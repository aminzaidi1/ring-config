# Detailed Environment Documentation

## 1. Overview
The environment in this ring configurator is the foundation of its visual realism. It utilizes **Physically Based Rendering (PBR)** principles, where the lighting, reflections, and refractive behavior of materials are driven by a high-dynamic-range image (HDRI).

## 2. The HDR Environment Map
*   **Current File:** `/public/assets/new-env.hdr`
*   **Format:** `.hdr` (Radiance RGBE)
*   **Role:** 
    *   **Lighting:** Acts as the primary light source for the scene (Image-Based Lighting).
    *   **Reflections:** Provides the "world" that is reflected on the polished metal surfaces of the ring.
    *   **Refraction:** Provides the background and light data that the gemstone bends and disperses.

## 3. Technical Implementation

### Scene-Wide Environment
The global environment is set using the `<Environment />` component from `@react-three/drei`.
```tsx
<Environment files="/assets/new-env.hdr" background />
```
*   `files`: Points to the HDR asset.
*   `background`: Renders the HDR as the visible background of the 3D scene.

### Gemstone Refraction Environment
Because the gemstone uses a `CubeCamera` to capture its surroundings for realistic refraction, the environment must be loaded manually for the camera's `envMap`.
```tsx
const envMap = useLoader(RGBELoader, '/assets/new-env.hdr');
// ...
<CubeCamera envMap={envMap}>
  {(texture) => (
    <MeshRefractionMaterial envMap={texture} ... />
  )}
</CubeCamera>
```
Using the same HDR ensures that the internal reflections within the gem perfectly match the external environment.

## 4. Lighting Strategy
*   **Image-Based Lighting (IBL):** The scene deliberately avoids standard `pointLight` or `ambientLight` components. This relies on the HDR's built-in luminance to provide natural highlights and shadows, as tuned by the 3D modeler.
*   **Exposure & Tone Mapping:** The `Canvas` and `MeshRefractionMaterial` handle the high range of the HDR to ensure highlights (like the sun or studio lights in the HDR) create "glimmer" without washing out the colors.

## 5. Environmental Effects

### Refraction & Dispersion
The `MeshRefractionMaterial` takes the environment data and calculates:
*   **Refraction:** Bending light based on the `ior` (Index of Refraction) setting.
*   **Dispersion:** Splitting the environment's white light into a rainbow spectrum (Chromatic Aberration) based on the `aberrationStrength`.

### Caustics
The `Caustics` component simulates light passing through the gemstone and hitting the floor/ring. 
*   **Light Source:** Currently set to `[5, 5, -10]`. This "virtual" light source is positioned to align with the brightest area of the HDR environment to ensure the shadows and caustics look physically consistent.

### Bloom
The `Bloom` effect (`@react-three/postprocessing`) reacts to the environment's intensity.
*   **Glimmer:** When a facet of the gemstone reflects a bright part of the HDR directly at the camera, the Bloom effect creates a "glow" or "sparkle," making the gem feel alive.

## 6. Updating the Environment
To change the look of the entire configurator (e.g., from a studio setup to an outdoor park):
1.  Place a new `.hdr` file in `/public/assets/`.
2.  Update the file paths in `RingConfigurator.tsx` for both the `Environment` component and the `RGBELoader`.
3.  Adjust the `Caustics` `lightSource` position if the "sun" in the new HDR is in a different location.
