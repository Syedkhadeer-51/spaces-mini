import React, { useState, useEffect } from 'react';
import {
  Stats,
  OrbitControls,
  ContactShadows,
  useGLTF
} from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Leva, useControls } from 'leva';
import './App.css';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import * as THREE from 'three';

// Define the URL of the model you want to load
const modelUrl = '/models/mercedes-maybach.glb';

function Model({ url, scale, position }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={scale} position={position} />;
}

function Env({ hdriUrl }) {
  const { gl, scene } = useThree();

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

  const { scale, positionX, positionY, positionZ } = useControls({
    scale: { value: 10, min: 0, max: 500, step: 0.1 },
    positionX: { value: 0, min: 1, max: 10, step: 0.1 },
    positionY: { value: 0, min: 1, max: 10, step: 0.1 },
    positionZ: { value: 0, min: 1, max: 10, step: 0.1 },
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
      <input type="file" accept=".hdr" onChange={handleFileChange} style={{ position: 'absolute', zIndex: 1 }} />
      <Canvas camera={{ position: [0, 10, 8] }}>
        <Env hdriUrl={hdriUrl} />
        <group>
          <Model
            url={modelUrl}
            scale={scale}
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
