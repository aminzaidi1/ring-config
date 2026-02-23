# Ring Configurator Documentation

## 1. Project Overview

This project is a 3D ring configurator built with Next.js and React Three Fiber. It allows users to visualize a ring with customizable gemstone and metal materials. The highlight feature is a physically-accurate refraction rendering for the gemstone, including caustics and dispersion effects, controlled via an interactive debug panel.

## 2. Features

*   **3D Ring Visualization:** Renders a detailed 3D model of a ring and gemstone.
*   **Material Customization:** Users can select from various gemstone types and ring metal colors via a swatch UI.
*   **Advanced Gemstone Effects:**
    *   **Refraction:** Employs `MeshRefractionMaterial` for realistic light bending through the gemstone.
    *   **Caustics:** Generates realistic light patterns cast by the gemstone onto surfaces.
    *   **Dispersion:** Simulates the "rainbow" effect (chromatic aberration) of light splitting into its constituent colors.
*   **Interactive Debug Controls:** A `leva` panel provides real-time adjustments for gemstone properties like `bounces`, `aberrationStrength`, `ior` (Index of Refraction), and `fresnel`.
*   **High-Quality Rendering:** Utilizes `EffectComposer` with `Bloom` for enhanced visual glimmer and overall scene quality.
*   **Responsive UI:** Built with Next.js for a modern web experience.

## 3. Technology Stack

*   **Framework:** Next.js (React Framework)
*   **3D Rendering:** React Three Fiber (`@react-three/fiber`)
*   **3D Helpers:** Drei (`@react-three/drei`) - Provides abstractions and helpers for common 3D tasks (e.g., `useGLTF`, `OrbitControls`, `Environment`, `CubeCamera`, `Caustics`, `MeshRefractionMaterial`).
*   **3D Post-processing:** `@react-three/postprocessing` - For visual effects like `Bloom`.
*   **UI Debugging:** Leva (`leva`) - A declarative UI for React apps, used here for the gemstone property controls.
*   **3D Assets:** GLTF/GLB models (`/assets/ring one.glb`) and HDR environment maps (`/assets/ring envoirment.hdr`).
*   **Typechecking:** TypeScript
*   **Styling:** Standard CSS (`Configurator.css`)

## 4. Setup and Installation

To get the project up and running locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/aminzaidi1/ring-config.git
    cd ring-config
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
    *Note: You might see `npm warn ERESOLVE overriding peer dependency` related to `three` and `postprocessing`. This is often due to version mismatches between indirect dependencies but doesn't typically prevent the application from running. See Troubleshooting for more details.*
3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the configurator.

## 5. Usage

*   **Ring Visualization:** The 3D ring model will load automatically. You can use your mouse/trackpad to orbit around the ring.
*   **Gemstone/Metal Selection:** Use the swatch UI at the bottom of the screen to change the gemstone type and ring metal color.
*   **Gemstone Property Controls:** A debug panel (powered by `leva`) will appear in the top-right corner of the screen. Use the sliders to adjust the following properties of the gemstone:
    *   `bounces`: Number of internal light bounces within the gem.
    *   `aberrationStrength`: Intensity of chromatic aberration (rainbow effect).
    *   `ior`: Index of Refraction, controlling how much light bends.
    *   `fresnel`: Fresnel effect intensity, affecting reflections at grazing angles.

## 6. Code Structure

*   `app/page.tsx`: The main page component that renders `ClientRing`.
*   `app/components/ClientRing.tsx`: A client-side wrapper for `RingConfigurator` to ensure it renders only on the client (necessary for React Three Fiber).
*   `app/components/RingConfigurator.tsx`:
    *   Main 3D scene setup using `<Canvas>`.
    *   State management for `gem` and `ringColor` selections.
    *   The `RingModel` component is responsible for rendering the 3D GLB model.
    *   Includes `OrbitControls`, `Environment`, and `EffectComposer` for scene interactivity, lighting, and post-processing.
    *   Integrates the `Leva` debug panel and the material swatch UI.
*   `app/components/Configurator.css`: Contains CSS for the swatch UI.
*   `public/assets/ring one.glb`: The 3D model of the ring (containing both the ring band and gemstone meshes).
*   `public/assets/ring envoirment.hdr`: The HDR image used for environment lighting and reflections.

### Key Component: `RingModel.tsx` (within `RingConfigurator.tsx`)

This component handles the loading and rendering of the `.glb` model and applies the specialized materials:

1.  **GLTF Loading:** Uses `useGLTF('/assets/ring one.glb')` to load the model, providing access to `scene` (the entire model hierarchy) and `nodes` (individual named meshes within the model).
    *   `nodes['Body1_1']`: Represents the gemstone mesh.
    *   `nodes['MeshBody1_1']`: Represents the ring band mesh.
2.  **Environment Map:** Loads `'/assets/ring envoirment.hdr'` using `RGBELoader` for use with `CubeCamera`.
3.  **Material Application Strategy:**
    *   **Ring Band:** The `sceneClone` is used as a base. The `MeshBody1_1` material within `sceneClone` is updated with `MeshStandardMaterial` based on the selected `ringColor`.
    *   **Gemstone (Separate Rendering):**
        *   The original `Body1_1` mesh within `sceneClone` is set to `visible = false` to avoid double rendering.
        *   A separate `<mesh>` component is created for the gemstone using `gemNode.geometry`.
        *   **Crucially**, `matrix={gemNode.matrixWorld}` and `matrixAutoUpdate={false}` are applied to this separate gem mesh to ensure it perfectly overlays the original gem's world position, even though it's rendered outside the `primitive`'s hierarchy.
        *   This separate gem mesh is wrapped in `CubeCamera` and `Caustics` (for dynamic reflections and caustics effects).
        *   Inside the `CubeCamera`'s render prop, `MeshRefractionMaterial` is applied to the gem mesh, utilizing the captured `envMap` and the `leva` `config` properties.
    *   **Opaque Gems:** For gemstone types in `opaqueGems` (e.g., Black Diamond), a `meshStandardMaterial` is used instead of `MeshRefractionMaterial` to render them as solid, non-refractive elements.

## 7. Customization and Extension

*   **Add New Gemstones/Metals:**
    *   Update the `gemstones` or `ringMetals` arrays in `RingConfigurator.tsx` with new `{ name: string; hex: string }` objects.
*   **Change 3D Model:**
    *   Replace `public/assets/ring one.glb` with your own `.glb` model.
    *   Adjust mesh names (`Body1_1`, `MeshBody1_1`) in `RingModel.tsx` if your model uses different naming conventions.
*   **Modify Gemstone Effects:**
    *   Experiment with the `leva` controls to find desired visual styles.
    *   Adjust default `config` values in `useControls` for different starting points.
    *   Tweak `Caustics` properties (e.g., `lightSource`, `intensity`).
    *   Further customize `MeshRefractionMaterial` properties or even swap it for `MeshTransmissionMaterial` for different transparent effects.
*   **Change Environment:** Replace `public/assets/ring envoirment.hdr` with a different HDR image to change the scene's lighting and reflections.
*   **Post-processing:** Adjust `Bloom` settings or add other effects from `@react-three/postprocessing`.

## 8. Deployment

This project is a Next.js application, making it straightforward to deploy on platforms like Vercel.

1.  **Push to Git Repository:** Ensure your project is pushed to a Git repository (e.g., GitHub, GitLab, Bitbucket).
2.  **Connect to Vercel:**
    *   Log in to Vercel and create a new project.
    *   Connect your Git repository.
    *   Vercel will automatically detect that it's a Next.js project and configure the build settings.
3.  **Build and Deploy:** Vercel will build and deploy your application. Subsequent pushes to the connected branch will trigger automatic deployments.

## 9. Troubleshooting

*   **`npm warn ERESOLVE overriding peer dependency` during `npm install`:**
    *   **Issue:** This warning indicates that `npm` had to install a `three.js` version that conflicts with the declared peer dependency of `postprocessing`.
    *   **Solution:** In most cases, this is a warning and not an error, and the application should still run correctly. `npm` (especially npm v7+) is designed to resolve these conflicts. If you encounter runtime issues, consider:
        *   Explicitly installing the `three` version requested by `postprocessing` if you don't need `three`'s latest features used by other `drei` components.
        *   Updating `@react-three/postprocessing` and `@react-three/drei` to their latest versions, as they often align with newer `three` versions.
*   **TypeScript errors related to `@react-three/drei` components (e.g., `Caustics` props):**
    *   **Issue:** The API for `@react-three/drei` components can evolve between versions, leading to type errors if props are renamed, removed, or their types change (e.g., `backfaces` vs. `backside`, `backfaceIor` vs. `backsideIOR`).
    *   **Solution:**
        1.  **Check `drei` Documentation:** Always refer to the official `@react-three/drei` documentation for the specific version you are using.
        2.  **Update `drei`:** Ensure your `@react-three/drei` package is up to date, as API changes might be accompanied by fixes or better typings.
        3.  **Inspect Error Messages Carefully:** The TypeScript error message will often suggest the correct prop names or expected types. For instance, `causticsOnly` and `backside` were recently required props for `Caustics`.
*   **Gemstone Detachment/Incorrect Positioning:**
    *   **Issue:** This can occur if the complex transform hierarchy of the GLB model is not correctly maintained when individual meshes are extracted and rendered separately.
    *   **Solution:** The current implementation in `RingModel.tsx` specifically addresses this by:
        *   Rendering the main GLB scene as a `primitive` (with the original gem mesh hidden).
        *   Rendering the actual gemstone as a separate `<mesh>` element.
        *   Using `matrix={gemNode.matrixWorld}` and `matrixAutoUpdate={false}` on the separate gem mesh to ensure it precisely inherits its world position from the original GLTF hierarchy. Do not try to manually set `position`, `rotation`, and `scale` on this separate mesh.

## 10. Credits

*   Built with [Next.js](https://nextjs.org/)
*   3D powered by [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) and [Drei](https://docs.pmnd.rs/drei/introduction)
*   Debug UI by [Leva](https://leva.pmnd.rs/)
*   HDR environment maps from [Poly Haven](https://polyhaven.com/)
*   3D model: `ring one.glb` (source details if available)
