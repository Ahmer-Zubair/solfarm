# SolFarm 3D Asset Pipeline

The game runs in Phaser 2D, so GLB models are kept as master source files and rendered into transparent isometric PNG sprites for runtime.

## Source models

Put GLB files in:

```txt
src/assets/iso/models/
```

The current manifest is:

```txt
tools/iso_model_manifest.json
```

## Render all model sprites

Install Blender, then run from the project root:

```powershell
npm run render:iso
```

Render only one asset:

```powershell
npm run render:iso -- cow
```

Rendered PNGs go into:

```txt
src/assets/iso/generated/
```

After rendering, import the new PNG in `src/lib/assetManifest.ts`, map it in `getObjectAssetKey`, and rebuild the app.

## Camera standard

Use the manifest defaults unless the asset faces the wrong direction:

```txt
azimuth: 45
elevation: 35.264
transparent background
orthographic camera
```

That keeps buildings, animals, lamps, fences, and market props aligned to the same isometric town camera.
