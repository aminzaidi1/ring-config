# Gemini CLI Prompt: Upgrade Gemstone Material in Ring Configurator

## Context

I have a Next.js / React Three Fiber ring configurator (`Configurator.tsx`) that renders a `.glb` ring model with two meshes:
- `Body1_1` — the **gemstone** mesh
- `MeshBody1_1` — the **ring band** mesh

The ring is currently working correctly. The ring band material and positioning must **not change at all**.

The goal is to **only** upgrade the gemstone mesh (`Body1_1`) to use physically-accurate refraction rendering (like a real cut gem), inspired by the diamond material from a reference project that uses `MeshRefractionMaterial`, `CubeCamera`, and `Caustics` from `@react-three/drei`.

---

## What Must NOT Change

- Ring band (`MeshBody1_1`) material, color, metalness, roughness — untouched
- Ring model scale, position, rotation — untouched
- Canvas camera position and FOV — untouched
- `OrbitControls` settings — untouched
- The gemstone/metal swatch UI at the bottom (`.configurator-ui`, swatches, CSS) — untouched
- The `gemstones` and `ringMetals` arrays — untouched
- The `Environment` HDR file path (`/assets/ring envoirment.hdr`) — untouched
- The `Bloom` effect — untouched
- The `opaqueGems` list logic — keep but adapt for new material system

---

## What Must Change

Replace the current `child.material` assignment for `Body1_1` (gemstone mesh) with the following approach:

### 1. Install / ensure these packages are available:
```
@react-three/drei (already installed — needs CubeCamera, Caustics, MeshRefractionMaterial)
leva (for the debug controls panel)
three-stdlib (for RGBELoader)
```

### 2. Load a high-quality HDRI for the gem's CubeCamera envmap
Use the existing local HDR: `/assets/ring envoirment.hdr`  
Load it with `RGBELoader` from `three-stdlib`:
```tsx
const texture = useLoader(RGBELoader, '/assets/ring envoirment.hdr')
```

### 3. Add a Leva controls panel (top-right corner, default leva position)
The panel should expose these controls:
```tsx
const config = useControls({
  bounces: { value: 3, min: 0, max: 8, step: 1 },
  aberrationStrength: { value: 0.01, min: 0, max: 0.1, step: 0.01 },
  ior: { value: 2.4, min: 0, max: 10 },
  fresnel: { value: 1, min: 0, max: 1 },
})
```
Note: No `color` control in leva — color is already controlled by the gemstone swatch UI.

### 4. Wrap the gemstone mesh with CubeCamera + Caustics + MeshRefractionMaterial

The gemstone mesh (`Body1_1`) should be rendered like this pattern:

```tsx
<CubeCamera resolution={256} frames={1} envMap={texture}>
  {(envTexture) => (
    <Caustics
      backfaces
      color={gem.hex}           // driven by the swatch selection
      position={[0, -0.5, 0]}   // adjust to match ring model's world position if needed
      lightSource={[5, 5, -10]}
      worldRadius={0.1}
      ior={1.8}
      backfaceIor={1.1}
      intensity={0.1}
    >
      <mesh
        castShadow
        geometry={gemstoneMesh.geometry}   // the actual geometry from Body1_1
        position={gemstoneMesh.position}   // preserve world transform from the GLB
        rotation={gemstoneMesh.rotation}
        scale={gemstoneMesh.scale}
      >
        <MeshRefractionMaterial
          envMap={envTexture}
          bounces={config.bounces}
          aberrationStrength={config.aberrationStrength}
          ior={config.ior}
          fresnel={config.fresnel}
          color={opaqueGems.includes(gem.name) ? gem.hex : 'white'}
          toneMapped={false}
        />
      </mesh>
    </Caustics>
  )}
</CubeCamera>
```

For **opaque gems** (Black Diamond, Onyx, Black Spinel), fall back to a `meshStandardMaterial` with `color={gem.hex}, metalness=0.3, roughness=0.1` instead of `MeshRefractionMaterial`.

### 5. Architecture approach for separating the two meshes

Since the GLB has two meshes fused in a single `scene`, you need to:
1. Use `useGLTF` to get `nodes`
2. Extract `nodes['Body1_1']` (gemstone) and `nodes['MeshBody1_1']` (ring band) separately
3. Render the ring band as a plain `<primitive>` or `<mesh>` with its existing `MeshStandardMaterial` (metalness=0.8, roughness=0.2, color=ringColor.hex)
4. Render the gemstone separately using the CubeCamera/Caustics/MeshRefractionMaterial setup above
5. Wrap both inside a `<group scale={10}>` (the existing scale) to preserve the original sizing

The key insight: instead of cloning the whole scene and traversing it, **render the two meshes as separate JSX elements** so you can wrap the gem with CubeCamera/Caustics without affecting the ring band.

---

## File Structure

Only modify `Configurator.tsx`. Do not touch `Configurator.css`.

The final component should still:
- Accept `gem` state (from swatch selection) to drive gemstone color
- Accept `ringColor` state (from swatch selection) to drive ring band color  
- Show the leva panel (auto-positioned top-right by leva)
- Show the existing `.configurator-ui` swatches at the bottom

---

## Summary of the Transformation

| Before | After |
|--------|-------|
| `MeshPhysicalMaterial` with `transmission=0.95` | `MeshRefractionMaterial` inside `CubeCamera` + `Caustics` |
| Scene clone + traversal | Separate mesh rendering from `nodes` |
| No leva controls | Leva panel: bounces, aberrationStrength, ior, fresnel |
| Gem color set via `material.color` | Gem color set via `MeshRefractionMaterial color` prop |
| Opaque gems: `transparent=false` | Opaque gems: fallback to `meshStandardMaterial` |

Do not change anything about the ring band, camera, controls, environment, bloom, UI swatches, or CSS.
