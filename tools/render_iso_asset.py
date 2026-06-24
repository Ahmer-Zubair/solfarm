import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--size", type=int, default=768)
    parser.add_argument("--azimuth", type=float, default=45.0)
    parser.add_argument("--elevation", type=float, default=35.264)
    parser.add_argument("--samples", type=int, default=24)
    parser.add_argument("--rotation", type=float, default=0.0)
    parser.add_argument("--exposure", type=float, default=0.8)
    parser.add_argument("--remove-ground", action="store_true")
    parser.add_argument("--floor", action="store_true")
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def mesh_bounds(objects):
    points = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    if not points:
        raise RuntimeError("The GLB contains no mesh geometry.")
    low = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    high = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return low, high


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def main():
    args = parse_args()
    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(input_path))
    imported = list(bpy.context.scene.objects)
    low, high = mesh_bounds(imported)
    center = (low + high) * 0.5
    dimensions = high - low

    if args.remove_ground:
        for obj in list(imported):
            if obj.type != "MESH":
                continue
            obj_dimensions = obj.dimensions
            is_flat = obj_dimensions.z <= max(0.02, dimensions.z * 0.035)
            is_wide = obj_dimensions.x >= dimensions.x * 0.62 and obj_dimensions.y >= dimensions.y * 0.62
            if is_flat and is_wide:
                bpy.data.objects.remove(obj, do_unlink=True)
                imported.remove(obj)

    for obj in imported:
        if obj.parent is None:
            obj.location -= Vector((center.x, center.y, low.z))
            obj.rotation_euler.z += math.radians(args.rotation)

    bpy.context.view_layer.update()
    low, high = mesh_bounds(imported)
    center = (low + high) * 0.5
    dimensions = high - low
    radius = max(dimensions.x, dimensions.y, dimensions.z)

    if args.floor:
        floor_size = max(dimensions.x, dimensions.y) * 1.5
        bpy.ops.mesh.primitive_plane_add(size=floor_size, location=(0, 0, -0.025))
        floor = bpy.context.object
        floor.name = "IsoShadowFloor"
        floor_material = bpy.data.materials.new("IsoShadowMaterial")
        floor_material.diffuse_color = (0.24, 0.42, 0.18, 1.0)
        floor.data.materials.append(floor_material)

    camera_data = bpy.data.cameras.new("IsoCamera")
    camera = bpy.data.objects.new("IsoCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    azimuth = math.radians(args.azimuth)
    elevation = math.radians(args.elevation)
    distance = radius * 4.0
    horizontal = math.cos(elevation) * distance
    camera.location = (
        math.cos(azimuth) * horizontal,
        -math.sin(azimuth) * horizontal,
        math.sin(elevation) * distance,
    )
    look_at(camera, (0, 0, center.z * 0.88))
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = max(dimensions.x + dimensions.y, dimensions.z * 1.85) * 0.78
    bpy.context.scene.camera = camera

    sun_data = bpy.data.lights.new("KeySun", "SUN")
    sun_data.energy = 2.2
    sun_data.angle = math.radians(12)
    sun = bpy.data.objects.new("KeySun", sun_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(28), math.radians(-20), math.radians(-35))

    area_data = bpy.data.lights.new("SoftFill", "AREA")
    area_data.energy = 650
    area_data.shape = "DISK"
    area_data.size = radius * 3.0
    area = bpy.data.objects.new("SoftFill", area_data)
    bpy.context.collection.objects.link(area)
    area.location = (-radius * 2, radius * 2, radius * 3)
    look_at(area, (0, 0, center.z * 0.5))

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.image_settings.color_depth = "8"
    if hasattr(scene, "eevee"):
        scene.eevee.taa_render_samples = args.samples
    if hasattr(scene.render, "engine"):
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    if hasattr(scene, "render") and hasattr(scene.render, "use_file_extension"):
        scene.render.use_file_extension = True
    scene.render.resolution_x = args.size
    scene.render.resolution_y = args.size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True
    scene.render.filepath = str(output_path)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = args.exposure
    scene.world.color = (0.08, 0.11, 0.14)

    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"
    bpy.ops.render.render(write_still=True)

    print(
        f"Rendered {input_path.name}: "
        f"bounds=({dimensions.x:.3f}, {dimensions.y:.3f}, {dimensions.z:.3f}) "
        f"camera={args.azimuth:.1f}/{args.elevation:.1f} -> {output_path}"
    )


if __name__ == "__main__":
    main()
