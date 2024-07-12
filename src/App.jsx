import React, { useState, useEffect, useRef } from 'react';
import {
  OrbitControls,
  ContactShadows,
  useGLTF
} from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Leva, useControls } from 'leva';
import './App.css';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import * as THREE from 'three';

function Model({ url, scale, position }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={scale} position={position} />;
}

function Env({ hdriUrl }) {
  const { scene } = useThree();

  useEffect(() => {
    if (hdriUrl) {
      new RGBELoader().load(hdriUrl, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.encoding = THREE.sRGBEncoding;
        scene.environment = texture;
        scene.background = texture;
      });
    }
  }, [hdriUrl, scene]);

  return null;
}

export default function App() {
  const [hdriUrl, setHdriUrl] = useState('/img/scythian_tombs_2_4k.hdr');
  const [modelUrl, setModelUrl] = useState('/models/mercedes-maybach.glb');
  const [modelScale, setModelScale] = useState(10); // Renamed from scale to modelScale
  const fileInputGlbRef = useRef(null);

  const handleFileGlbChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
      setModelScale(10); // Reset scale when changing model
    }
  };

  const handleScaleChange = (value) => {
    setModelScale(value); // Adjust modelScale instead of scale
  };

  const handleUploadGlbClick = () => {
    if (fileInputGlbRef.current) {
      fileInputGlbRef.current.click();
    } else {
      console.log("File input ref is null or not yet initialized.");
    }
  };

  const { positionX, positionY, positionZ } = useControls({
    positionX: { value: 0, min: -10, max: 10, step: 0.1 },
    positionY: { value: 0, min: -10, max: 10, step: 0.1 },
    positionZ: { value: 0, min: -10, max: 10, step: 0.1 },
    scale: { value: 10, min: 0, max: 500, step: 0.1 }, // Renamed control to scale
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setHdriUrl(url);
    }
  };

  return (
    <>
      <input type="file" accept=".hdr" onChange={handleFileChange} style={{ position: 'absolute', zIndex: 1, marginLeft: '20px',marginTop: '20px' }} />
      <button onClick={handleUploadGlbClick} style={{ position: 'absolute', zIndex: 1, marginLeft: '20px', marginTop: '60px' }}>
        Upload Model
      </button>
      {/* Ensure ref is correctly assigned */}
      <input
        type="file"
        accept=".glb, .gltf"
        onChange={handleFileGlbChange}
        ref={fileInputGlbRef} // Assign ref here
        style={{ display: 'none' }}
      />
      <Canvas camera={{ position: [0, 10, 8] }}>
        <Env hdriUrl={hdriUrl} />
        <group>
          <Model
            url={modelUrl}
            scale={modelScale} // Use modelScale instead of scale
            position={[positionX, positionY, positionZ]}
          />
        </group>
        <ContactShadows
          scale={100}
          position={[0.33, -0.33, 0.33]}
          opacity={1.5}
        />
        <OrbitControls target={[0, 1, 0]} maxPolarAngle={Math.PI / 2} />
        {/* <Stats /> */}
      </Canvas>
      <Leva collapsed />
    </>
  );
}
