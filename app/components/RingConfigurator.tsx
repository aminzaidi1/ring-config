'use client';

import React, { Suspense, useState, useMemo, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, MeshRefractionMaterial, CubeCamera, Caustics } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useControls, Leva } from 'leva';
import { RGBELoader } from 'three-stdlib';
import './Configurator.css';

const gemstones = [
  { name: 'Ruby', hex: '#DC143C' }, { name: 'Lab-Created Ruby', hex: '#D1001C' },
  { name: 'Rhodolite Garnet', hex: '#8F0B30' }, { name: 'Mozambique Garnet', hex: '#800000' },
  { name: 'Red Spinel', hex: '#FF0000' }, { name: 'Fire Opal', hex: '#FF4500' },
  { name: 'Citrine', hex: '#E4D00A' }, { name: 'Yellow Sapphire', hex: '#FADA5E' },
  { name: 'Spessartite Garnet', hex: '#FF8C00' }, { name: 'Cubic Zirconia', hex: '#FFFFFF' },
  { name: 'Emerald', hex: '#50C878' }, { name: 'Yellow Diamond', hex: '#F3DA0B' },
  { name: 'Lab-Created Emerald', hex: '#00A86B' }, { name: 'Peridot', hex: '#BEC644' },
  { name: 'Sapphire', hex: '#0F52BA' }, { name: 'Tourmaline', hex: '#728C00' },
  { name: 'Tsavorite Garnet', hex: '#12AD2B' }, { name: 'Topaz', hex: '#00BFFF' },
  { name: 'Zircon', hex: '#00CED1' }, { name: 'Chrome Tourmaline', hex: '#006600' },
  { name: 'Lab-Created Sapphire', hex: '#191970' }, { name: 'Blue Diamond', hex: '#0072BB' },
  { name: 'Aquamarine', hex: '#7FFFD4' }, { name: 'Tanzanite', hex: '#4B0082' },
  { name: 'Alexandrite', hex: '#7D3E5D' }, { name: 'Purple Sapphire', hex: '#6A0DAD' },
  { name: 'Amethyst', hex: '#9966CC' }, { name: 'Pink Sapphire', hex: '#FF69B4' },
  { name: 'Pink Tourmaline', hex: '#F24E82' }, { name: 'Pink Spinel', hex: '#FF1493' },
  { name: 'Black Spinel', hex: '#121212' }, { name: 'Morganite', hex: '#F4C2C2' },
  { name: 'Black Diamond', hex: '#1A1A1A' }, { name: 'Onyx', hex: '#0F0F0F' },
  { name: 'Salt and Pepper Diamond', hex: '#C0C0C0' }
];

const ringMetals = [
    { name: 'Yellow Gold', hex: '#FFD700' },
    { name: 'White Gold', hex: '#F5F5F5' },
    { name: 'Rose Gold', hex: '#B76E79' },
    { name: 'Titanium', hex: '#BFC1C2' }, { name: 'Tungsten', hex: '#757575' },
    { name: 'Tantalum', hex: '#4F5557' }, { name: 'Palladium', hex: '#CED4D5' },
    { name: 'Sterling Silver', hex: '#C0C0C0' }, { name: 'Bronze', hex: '#CD7F32' },
    { name: 'Stainless Steel', hex: '#A2A2A2' }, { name: 'Copper', hex: '#B87333' }
];

const opaqueGems = ['Black Diamond', 'Onyx', 'Black Spinel'];

interface RingModelProps {
  gem: { name: string; hex: string };
  ringColor: { name: string; hex: string };
}

function RingModel({ gem, ringColor }: RingModelProps) {
  const { scene, nodes } = useGLTF('/assets/ring one.glb') as any;
  const envMap = useLoader(RGBELoader, '/assets/ring envoirment.hdr');

  const config = useControls({
    bounces: { value: 3, min: 0, max: 8, step: 1 },
    aberrationStrength: { value: 0.01, min: 0, max: 0.1, step: 0.01 },
    ior: { value: 2.4, min: 0, max: 10 },
    fresnel: { value: 1, min: 0, max: 1 },
  });

  const isOpaque = opaqueGems.includes(gem.name);

  // Clone the scene and prepare materials for the ring band
  const sceneClone = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child: any) => {
      if (child.isMesh) {
        // Apply material to the ring part
        if (child.name === 'MeshBody1_1') {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(ringColor.hex),
            metalness: 0.8,
            roughness: 0.2
          });
        }
        // Make the original gem mesh invisible in the cloned scene
        // because we will render a separate gem with refraction effects
        if (child.name === 'Body1_1') {
          child.visible = false;
        }
      }
    });
    return clone;
  }, [scene, ringColor]);

  const gemNode = nodes['Body1_1']; // Get the original gem node for geometry and transforms

  return (
    <group scale={10}>
      {/* Render the cloned scene (ring and invisible original gem) */}
      <primitive object={sceneClone} /> 
      
      {/* Conditionally render the gem with refraction effects or opaque material, ensuring correct positioning */}
      {isOpaque ? (
        <mesh 
          geometry={gemNode.geometry}
          matrix={gemNode.matrixWorld} // Use matrixWorld for correct global positioning
          matrixAutoUpdate={false} // Disable auto-update to rely on matrixWorld
        >
          <meshStandardMaterial color={gem.hex} roughness={0.1} metalness={0.3} />
        </mesh>
      ) : (
        <CubeCamera resolution={256} frames={1} envMap={envMap}>
          {(texture) => (
            <Caustics
              backfaces
              color={gem.hex}
              position={[0, 0, 0]} // Caustics position relative to its parent (the gem mesh)
              lightSource={[5, 5, 5]} 
              worldRadius={0.1}
              ior={1.8}
              backfaceIor={1.1}
              intensity={0.1}
            >
              <mesh 
                geometry={gemNode.geometry}
                matrix={gemNode.matrixWorld} // Use matrixWorld for correct global positioning
                matrixAutoUpdate={false} // Disable auto-update to rely on matrixWorld
              >
                <MeshRefractionMaterial 
                  envMap={texture} 
                  {...config} 
                  color={gem.hex}
                  toneMapped={false} 
                />
              </mesh>
            </Caustics>
          )}
        </CubeCamera>
      )}
    </group>
  );
}

export default function RingConfigurator() {
  const [gem, setGem] = useState(gemstones[0]);
  const [ringColor, setRingColor] = useState(ringMetals[0]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Leva controls menu - defaults to top-right corner */}
      <Leva /> 
      <Canvas camera={{ position: [0, 0, 1.2], fov: 50 }}>
        <Suspense fallback={null}>
          <Environment files="/assets/ring envoirment.hdr" background />
          <RingModel gem={gem} ringColor={ringColor} />
          <OrbitControls minDistance={0.5} maxDistance={10} />
        </Suspense>
        {/* Add extra lights for more sparkle */}
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <EffectComposer>
            <Bloom luminanceThreshold={1} intensity={2} levels={9} mipmapBlur />
        </EffectComposer>
      </Canvas>
      <div className="configurator-ui">
        <div className="color-options">
          <h3>Gemstone: {gem.name}</h3>
          <div className="swatches">
            {gemstones.map((g) => (
              <div
                key={g.name}
                className={`swatch ${g.name === gem.name ? 'active' : ''}`}
                style={{ background: g.hex }}
                onClick={() => setGem(g)}
                title={g.name}
              />
            ))}
          </div>
        </div>
        <div className="color-options">
          <h3>Metal: {ringColor.name}</h3>
          <div className="swatches">
            {ringMetals.map((metal) => (
              <div
                key={metal.name}
                className={`swatch ${metal.name === ringColor.name ? 'active' : ''}`}
                style={{ background: metal.hex }}
                onClick={() => setRingColor(metal)}
                title={metal.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}