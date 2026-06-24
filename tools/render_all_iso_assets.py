import json
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "tools" / "iso_model_manifest.json"
RENDER_SCRIPT = ROOT / "tools" / "render_iso_asset.py"


def blender_command() -> str:
    candidate = shutil.which("blender")
    if candidate:
        return candidate

    common_paths = [
        Path(r"C:\Program Files\Blender Foundation\Blender 4.4\blender.exe"),
        Path(r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe"),
        Path(r"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"),
        Path(r"C:\Program Files\Blender Foundation\Blender 4.1\blender.exe"),
        Path(r"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe"),
    ]
    for path in common_paths:
        if path.exists():
            return str(path)

    raise SystemExit(
        "Blender was not found. Install Blender, then run this again. "
        "The game already keeps GLBs in src/assets/iso/models; this script turns them into Phaser-ready PNGs."
    )


def render_asset(blender: str, item: dict) -> None:
    input_path = ROOT / item["input"]
    output_path = ROOT / item["output"]
    if not input_path.exists():
        raise FileNotFoundError(f"Missing model: {input_path}")

    args = [
        blender,
        "--background",
        "--python",
        str(RENDER_SCRIPT),
        "--",
        "--input",
        str(input_path),
        "--output",
        str(output_path),
        "--size",
        str(item.get("size", 768)),
        "--azimuth",
        str(item.get("azimuth", 45)),
        "--elevation",
        str(item.get("elevation", 35.264)),
        "--rotation",
        str(item.get("rotation", 0)),
        "--exposure",
        str(item.get("exposure", 0.85)),
        "--samples",
        str(item.get("samples", 8)),
    ]
    if item.get("removeGround", False):
        args.append("--remove-ground")
    if item.get("floor", False):
        args.append("--floor")

    print(f"Rendering {item['name']} -> {output_path.relative_to(ROOT)}")
    subprocess.run(args, cwd=ROOT, check=True)


def main() -> None:
    blender = blender_command()
    items = json.loads(MANIFEST.read_text(encoding="utf-8"))
    selected = set(sys.argv[1:])
    for item in items:
        if selected and item["name"] not in selected:
            continue
        render_asset(blender, item)
    print("Done. Rebuild the Vite app after rendering new PNGs.")


if __name__ == "__main__":
    main()
