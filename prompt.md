# Gemini CLI Prompt: Add Ring Model Switcher to Configurator

## Context

I have a working Next.js / React Three Fiber ring configurator (`RingConfigurator.tsx`) that already implements:
- A `.glb` ring model with two meshes: `Body1_1` (gemstone) and `MeshBody1_1` (ring band)
- `MeshRefractionMaterial` + `CubeCamera` + `Caustics` for the gemstone
- A `leva` panel with `bounces`, `aberrationStrength`, `ior`, `fresnel`
- A swatch UI at the bottom for gemstone color and ring metal color
- The `matrixWorld` trick to keep gem aligned with the ring band

The project documentation is attached. Everything is working correctly.

---

## New Feature: Ring Model Switcher

I now have **3 ring models** placed in `/public/assets/`:
- `1.glb`
- `2.glb`
- `3.glb`

Each model follows the **same mesh naming convention**:
- `Body1_1` — gemstone mesh
- `MeshBody1_1` — ring band mesh

Add the ability to switch between these 3 models in the UI.

---

## What Must NOT Change

- All existing gemstone material logic (`MeshRefractionMaterial`, `CubeCamera`, `Caustics`, `matrixWorld` positioning trick) — untouched
- Ring band material logic — untouched
- `leva` panel controls — untouched
- Gemstone and metal swatch UI layout and CSS — untouched
- `Configurator.css` — untouched
- Camera, `OrbitControls`, `Environment`, `Bloom` — untouched
- The `gemstones`, `ringMetals`, `opaqueGems` arrays — untouched

---

## What Must Change

### 1. State

Add a new state variable in `RingConfigurator`:
```tsx
const [ringModel, setRingModel] = useState<'1' | '2' | '3'>('1');
```

### 2. Dynamic model path

Pass the selected model path into `RingModel`:
```tsx
<RingModel
  gem={gem}
  ringColor={ringColor}
  modelPath={`/assets/${ringModel}.glb`}
/>
```

Update `RingModel`'s props interface:
```tsx
interface RingModelProps {
  gem: { name: string; hex: string };
  ringColor: { name: string; hex: string };
  modelPath: string;
}
```

Inside `RingModel`, change `useGLTF` to use the dynamic path:
```tsx
const { scene, nodes } = useGLTF(modelPath);
```

### 3. Preload all 3 models

After the component definitions, add preloading so switching is instant with no loading delay:
```tsx
useGLTF.preload('/assets/1.glb');
useGLTF.preload('/assets/2.glb');
useGLTF.preload('/assets/3.glb');
```

### 4. UI — Model Switcher

Add a third section to the existing `.configurator-ui` panel, **above** the Gemstone and Metal sections (so the order top-to-bottom is: Ring Model → Gemstone → Metal).

The model switcher should use **3 clickable thumbnail-style buttons** (not color swatches) labeled "Ring 1", "Ring 2", "Ring 3". Style them to match the existing UI aesthetic (frosted glass panel, same font, same border-radius language).

Add the following to `Configurator.css` for the model switcher:

```css
.model-options {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.model-options h3 {
  margin: 0;
  padding: 0 5px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.model-buttons {
  display: flex;
  gap: 8px;
  padding: 5px;
}

.model-btn {
  padding: 6px 16px;
  border-radius: 20px;
  border: 2px solid #fff;
  background: rgba(255, 255, 255, 0.3);
  color: #333;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, background 0.2s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.model-btn.active {
  background: rgba(0, 123, 255, 0.2);
  border-color: #007bff;
  transform: scale(1.08);
}

.model-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}
```

The JSX for the switcher inside `.configurator-ui`:
```tsx
<div className="model-options">
  <h3>Ring Model</h3>
  <div className="model-buttons">
    {(['1', '2', '3'] as const).map((id) => (
      <button
        key={id}
        className={`model-btn ${ringModel === id ? 'active' : ''}`}
        onClick={() => setRingModel(id)}
      >
        Ring {id}
      </button>
    ))}
  </div>
</div>
```

### 5. Handle the useMemo dependency

The existing `sceneClone` useMemo depends on `scene`. Since `scene` now changes when `modelPath` changes, this should already work correctly — but confirm the `useMemo` dependency array includes `scene`:
```tsx
const sceneClone = useMemo(() => scene.clone(), [scene]);
```

Also ensure that hiding the gem on `sceneClone` and applying ring band material happens inside a `useEffect` or within the useMemo, not in the render body directly, to avoid stale closure issues when the model switches.

---

## Summary of Changes

| File | Change |
|------|--------|
| `RingConfigurator.tsx` | Add `ringModel` state, pass `modelPath` prop to `RingModel`, add model switcher JSX in `.configurator-ui`, add `useGLTF.preload` calls |
| `RingConfigurator.tsx` (RingModel) | Accept `modelPath` prop, use dynamic `useGLTF(modelPath)` |
| `Configurator.css` | Add `.model-options`, `.model-buttons`, `.model-btn`, `.model-btn.active` styles |

No other files should be modified.

---

## Important Constraints

- All 3 models use identical mesh names (`Body1_1`, `MeshBody1_1`) — no conditional mesh name logic needed
- The gem alignment (`matrixWorld`) trick must still work after model switching — it will as long as `gemNode` is re-derived from the new `nodes` object after each model load
- Do not add a loading spinner or Suspense fallback change — preloading handles the transition smoothly
- The leva panel position and existing controls must remain unchanged