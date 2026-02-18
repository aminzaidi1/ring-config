'use client';

import React, { Suspense, useState, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
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

function RingModel({ gem, ringColor }) {
  const { scene, nodes } = useGLTF('/assets/ring one.glb');

  // Log nodes to console to help identify correct mesh names
  useEffect(() => {
    console.log("Model nodes:", nodes);
  }, [nodes]);

  const sceneClone = useMemo(() => scene.clone(), [scene]);

  sceneClone.traverse((child) => {
    if (child.isMesh) {
      const gemMeshName = 'Body1_1';
      const ringMeshName = 'MeshBody1_1';

      if (child.name === gemMeshName) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(gem.hex);
        
        // Realism properties
        child.material.metalness = 0.2;
        child.material.roughness = 0.1;
        child.material.ior = 2.4; // Index of Refraction for diamond-like materials
        child.material.envMapIntensity = 1.5;

        // Opacity and Transmission
        if (opaqueGems.includes(gem.name)) {
            child.material.transparent = false;
            child.material.transmission = 0;
        } else {
            child.material.transparent = true;
            child.material.transmission = 0.95; // Simulates light passing through
        }

        // Dispersion for rainbow effect
        child.material.dispersion = 0.15;
      }
      if (child.name === ringMeshName) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(ringColor.hex);
        child.material.metalness = 0.8;
        child.material.roughness = 0.2;
      }
    }
  });

  return <primitive object={sceneClone} scale={10} />;
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
    <div style={{ width: '100vw', height: '100vh' }}>
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
            <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.1} intensity={1.5} />
        </EffectComposer>
      </Canvas>
      <div className="configurator-ui">
        <div className="color-options">
          <h3>Gemstone: {gem.name}</h3>
          <div className="swatches">
            {gemstones.map((g) => (
              <div
                key={g.name}
                className={`swatch ${gem.name === g.name ? 'active' : ''}`}
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
                className={`swatch ${ringColor.name === metal.name ? 'active' : ''}`}
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
