
import React, {
  Suspense,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {
  OrbitControls,
  ContactShadows,
  useGLTF,
  Bounds,
  Center,
  Grid,
} from '@react-three/drei';

import {
  Canvas,
  useThree,
  useFrame,
} from '@react-three/fiber';

import './App.css';

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import * as THREE from 'three';

import {
  loadSettings,
  saveSettings,
  resolveHdriUrl,
} from './storage';

/* =========================================================
   MODEL
========================================================= */

function Model({
  url,
  onLoaded,
}) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    onLoaded?.();
  }, [scene, onLoaded]);

  return (
    <primitive
      object={scene}
    />
  );
}

/* =========================================================
   POSITIONED MODEL
========================================================= */

function PositionedModel({
  url,
  position,
  onLoaded,
}) {
  return (
    <group
      position={[
        position.x,
        position.y,
        position.z,
      ]}
    >
      <Center bottom>
        <Model
          url={url}
          onLoaded={onLoaded}
        />
      </Center>
    </group>
  );
}

/* =========================================================
   INTERACTIVE LOADING OVERLAY
========================================================= */

function LoadingOverlay({
  modelName,
}) {
  const [
    loadingText,
    setLoadingText,
  ] = useState(
    'Preparing 3D scene'
  );

  useEffect(() => {
    const messages = [
      'Preparing 3D scene',
      'Loading model geometry',
      'Loading materials',
      'Preparing textures',
      'Setting up environment',
      'Almost ready',
    ];

    let index = 0;

    const interval =
      setInterval(
        () => {
          index =
            (index + 1) %
            messages.length;

          setLoadingText(
            messages[index]
          );
        },
        1200
      );

    return () => {
      clearInterval(
        interval
      );
    };
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl">

      {/* Background Glow */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-indigo-500/10 blur-3xl" />

      </div>

      <div className="relative flex flex-col items-center">

        {/* Animated Loader */}

        <div className="relative flex h-32 w-32 items-center justify-center">

          <div className="absolute inset-0 animate-spin rounded-full border border-indigo-400/20 border-t-indigo-400" />

          <div className="absolute inset-4 animate-[spin_2s_linear_infinite_reverse] rounded-full border border-violet-400/20 border-b-violet-400" />

          <div className="absolute inset-8 animate-ping rounded-full border border-indigo-400/20" />

          <div
            className="relative h-10 w-10 animate-bounce rounded-lg border border-indigo-300/40 bg-gradient-to-br from-indigo-400/30 to-violet-500/20 shadow-xl shadow-indigo-500/30 backdrop-blur-md"
            style={{
              transform:
                'rotate(45deg)',

              animationDuration:
                '1.8s',
            }}
          >

            <div className="absolute inset-1 rounded-md border border-white/10" />

          </div>

        </div>

        {/* Text */}

        <div className="mt-7 text-center">

          <p className="text-sm font-semibold tracking-wide text-white">
            Loading 3D Model
          </p>

          {modelName && (
            <p className="mt-1 max-w-[260px] truncate text-xs text-slate-400">
              {modelName}
            </p>
          )}

          {/* Animated Dots */}

          <div className="mt-4 flex items-center justify-center gap-1.5">

            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />

            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />

            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />

          </div>

          <p
            key={loadingText}
            className="mt-3 animate-pulse text-[11px] text-slate-500"
          >
            {loadingText}
          </p>

        </div>

        {/* Progress */}

        <div className="mt-5 h-1 w-52 overflow-hidden rounded-full bg-white/10">

          <div className="h-full w-1/2 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-indigo-400" />

        </div>

      </div>

      <style>
        {`
          @keyframes loading {

            0% {
              transform: translateX(-100%);
            }

            50% {
              transform: translateX(100%);
            }

            100% {
              transform: translateX(250%);
            }

          }
        `}
      </style>

    </div>
  );
}

/* =========================================================
   ENVIRONMENT
========================================================= */

function Env({
  hdriUrl,
  onReady,
  theme,
}) {
  const {
    scene,
  } = useThree();

  const [
    texture,
    setTexture,
  ] = useState(null);

  const loadedUrlRef =
    useRef(null);

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      scene.environment =
        null;

      setTexture(
        (
          previousTexture
        ) => {
          if (
            previousTexture
          ) {
            previousTexture.dispose();
          }

          return null;
        }
      );
    };
  }, [
    scene,
  ]);

  /* =======================================================
     HDRI
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    if (
      !hdriUrl
    ) {
      scene.environment =
        null;

      setTexture(
        (
          previousTexture
        ) => {
          if (
            previousTexture
          ) {
            previousTexture.dispose();
          }

          return null;
        }
      );

      loadedUrlRef.current =
        null;

      onReady?.(
        false
      );

      return;
    }

    if (
      loadedUrlRef.current ===
      hdriUrl
    ) {
      return;
    }

    onReady?.(
      false
    );

    loadedUrlRef.current =
      hdriUrl;

    const loader =
      new RGBELoader();

    loader.load(
      hdriUrl,

      (
        loadedTexture
      ) => {
        if (
          cancelled
        ) {
          loadedTexture.dispose();

          return;
        }

        loadedTexture.mapping =
          THREE.EquirectangularReflectionMapping;

        loadedTexture.colorSpace =
          THREE.SRGBColorSpace;

        setTexture(
          (
            previousTexture
          ) => {
            if (
              previousTexture
            ) {
              previousTexture.dispose();
            }

            return loadedTexture;
          }
        );

        scene.environment =
          loadedTexture;

        onReady?.(
          true
        );
      }
    );

    return () => {
      cancelled =
        true;
    };
  }, [
    hdriUrl,
    scene,
    onReady,
  ]);

  /* =======================================================
     BACKGROUND
  ======================================================= */

  useFrame(() => {
    const targetHex =
      theme === 'dark'
        ? '#111827'
        : '#e8eaed';

    if (
      !(
        scene.background instanceof
        THREE.Color
      )
    ) {
      scene.background =
        new THREE.Color(
          targetHex
        );
    } else {
      const targetColor =
        new THREE.Color(
          targetHex
        );

      scene.background.lerp(
        targetColor,
        0.08
      );
    }
  });

  return null;
}

/* =========================================================
   UPLOAD BUTTON
========================================================= */

function UploadButton({
  onClick,
  icon,
  label,
  description,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left backdrop-blur-md transition-all duration-200 hover:border-indigo-400/40 hover:bg-white/10 active:scale-[0.98]"
    >

      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">

        {icon}

      </span>

      <span className="min-w-0 flex-1">

        <span className="block text-sm font-semibold text-white">

          {label}

        </span>

        <span className="block truncate text-xs text-slate-400">

          {description}

        </span>

      </span>

      <svg
        className="h-4 w-4 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >

        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5l7 7-7 7"
        />

      </svg>

    </button>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function Toggle({
  enabled,
  onChange,
  label,
  description,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() =>
        onChange(
          !enabled
        )
      }
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all duration-200 hover:bg-white/10"
    >

      <span>

        <span className="block text-sm font-semibold text-white">

          {label}

        </span>

        <span className="block text-xs text-slate-400">

          {description}

        </span>

      </span>

      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          enabled
            ? 'bg-indigo-500'
            : 'bg-slate-600'
        }`}
      >

        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            enabled
              ? 'translate-x-5'
              : ''
          }`}
        />

      </span>

    </button>
  );
}

/* =========================================================
   MODEL POSITION CONTROLS
========================================================= */

function ModelPositionControl({
  modelPosition,
  setModelPosition,
  handleUpdatePosition,
}) {
  const axes = [
    'x',
    'y',
    'z',
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">

      {/* Header */}

      <div className="mb-3 flex items-center justify-between">

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">

            Model Position

          </p>

          <p className="mt-0.5 text-[10px] text-slate-500">

            Adjust model position

          </p>

        </div>

        <button
          type="button"
          onClick={() => {
            setModelPosition({
              x: 0,
              y: 0,
              z: 0,
            });
          }}
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400 transition hover:bg-white/10 hover:text-white"
        >

          Reset

        </button>

      </div>

      {/* XYZ */}

      <div className="flex flex-col gap-2">

        {axes.map(
          (
            axis
          ) => {
            const axisStyle =
              axis === 'x'
                ? 'bg-red-500/15 text-red-400'
                : axis === 'y'
                ? 'bg-green-500/15 text-green-400'
                : 'bg-blue-500/15 text-blue-400';

            return (
              <div
                key={axis}
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-slate-950/30 p-2"
              >

                {/* Axis */}

                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold uppercase ${axisStyle}`}
                >

                  {axis}

                </div>

                {/* Controls */}

                <div className="flex flex-1 items-center overflow-hidden rounded-lg border border-white/10 bg-slate-900/70">

                  {/* Minus */}

                  <button
                    type="button"
                    onClick={() => {
                      handleUpdatePosition(
                        axis,
                        modelPosition[
                          axis
                        ] -
                          0.1
                      );
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center border-r border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white active:scale-95"
                  >

                    −

                  </button>

                  {/* Input */}

                  <input
                    type="number"
                    min="-50"
                    max="50"
                    step="0.1"
                    value={
                      Number(
                        modelPosition[
                          axis
                        ]
                      ).toFixed(
                        1
                      )
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        parseFloat(
                          event
                            .target
                            .value
                        );

                      handleUpdatePosition(
                        axis,
                        value
                      );
                    }}
                    className="h-8 min-w-0 flex-1 bg-transparent px-1 text-center text-xs font-semibold tabular-nums text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />

                  {/* Plus */}

                  <button
                    type="button"
                    onClick={() => {
                      handleUpdatePosition(
                        axis,
                        modelPosition[
                          axis
                        ] +
                          0.1
                      );
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center border-l border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white active:scale-95"
                  >

                    +

                  </button>

                </div>

              </div>
            );
          }
        )}

      </div>

      {/* Axis Guide */}

      <div className="mt-3 flex items-center justify-center gap-4 border-t border-white/5 pt-2">

        <span className="text-[9px] text-red-400">
          ● X
        </span>

        <span className="text-[9px] text-green-400">
          ● Y
        </span>

        <span className="text-[9px] text-blue-400">
          ● Z
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {

  const initialSettings =
    loadSettings();

  const activeHdri =
    initialSettings.hdriLibrary.find(
      (
        item
      ) =>
        item.id ===
        initialSettings.activeHdriId
    ) ??
    initialSettings.hdriLibrary[0];

  /* =======================================================
     STATE
  ======================================================= */

  const [
    hdriLibrary,
    setHdriLibrary,
  ] =
    useState(
      initialSettings.hdriLibrary
    );

  const [
    activeHdriId,
    setActiveHdriId,
  ] =
    useState(
      initialSettings.activeHdriId
    );

  const [
    theme,
    setTheme,
  ] =
    useState(
      initialSettings.theme
    );

  const [
    hdriUrl,
    setHdriUrl,
  ] =
    useState(
      resolveHdriUrl(
        activeHdri
      )
    );

  const [
    modelUrl,
    setModelUrl,
  ] =
    useState(
      '/models/porsche_911.glb'
    );

  const [
    isModelLoading,
    setIsModelLoading,
  ] =
    useState(
      true
    );

  const [
    modelFileName,
    setModelFileName,
  ] =
    useState(
      'Porsche 911'
    );

  const [
    storageError,
  ] =
    useState(
      ''
    );

  const [
    modelPosition,
    setModelPosition,
  ] =
    useState({
      x: 0,
      y: 0,
      z: 0,
    });

  const fileInputGlbRef =
    useRef(
      null
    );

  const activeHdriEntry =
    hdriLibrary.find(
      (
        item
      ) =>
        item.id ===
        activeHdriId
    ) ??
    hdriLibrary[0];

  /* =======================================================
     SETTINGS
  ======================================================= */

  useEffect(() => {
    saveSettings({
      theme,
      activeHdriId,
      hdriLibrary,
    });
  }, [
    theme,
    activeHdriId,
    hdriLibrary,
  ]);

  /* =======================================================
     HDRI
  ======================================================= */

  useEffect(() => {
    setHdriUrl(
      resolveHdriUrl(
        activeHdriEntry
      )
    );
  }, [
    activeHdriEntry,
  ]);

  /* =======================================================
     MODEL LOADING
  ======================================================= */

  useEffect(() => {
    setIsModelLoading(
      true
    );
  }, [
    modelUrl,
  ]);

  const handleModelLoaded =
    useCallback(
      () => {
        setIsModelLoading(
          false
        );
      },
      []
    );

  const handleHdriReady =
    useCallback(
      () => {},
      []
    );

  /* =======================================================
     INPUT POSITION UPDATE
  ======================================================= */

  const handleUpdatePosition =
    useCallback(
      (
        axis,
        value
      ) => {
        if (
          Number.isNaN(
            value
          )
        ) {
          return;
        }

        const clampedValue =
          Math.min(
            50,
            Math.max(
              -50,
              value
            )
          );

        const roundedValue =
          Math.round(
            clampedValue *
              10
          ) /
          10;

        setModelPosition(
          (
            previous
          ) => ({
            ...previous,

            [axis]:
              roundedValue,
          })
        );
      },
      []
    );

  /* =======================================================
     GLB UPLOAD
  ======================================================= */

  const handleFileGlbChange =
    (
      event
    ) => {
      const file =
        event
          .target
          .files[0];

      if (
        file
      ) {
        const url =
          URL.createObjectURL(
            file
          );

        setModelUrl(
          url
        );

        setModelFileName(
          file.name
        );

        setModelPosition({
          x: 0,
          y: 0,
          z: 0,
        });
      }

      event.target.value =
        '';
    };

  const handleUploadGlbClick =
    () => {
      fileInputGlbRef.current?.click();
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>

      {/* ===================================================
          UI PANEL
      =================================================== */}

      <div className="pointer-events-none absolute inset-0 z-10">

        <div className="pointer-events-auto absolute left-5 top-5 w-72">

          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">

            <div className="mb-4">

              <p className="text-xs text-slate-400">

                Upload and position a 3D model

              </p>

            </div>

            <div className="flex flex-col gap-2.5">

              {/* Theme */}

              <Toggle
                enabled={
                  theme ===
                  'dark'
                }
                onChange={(
                  isDark
                ) =>
                  setTheme(
                    isDark
                      ? 'dark'
                      : 'light'
                  )
                }
                label="Dark Mode Background"
                description={
                  theme ===
                  'dark'
                    ? 'Sleek dark viewer background'
                    : 'Clean light viewer background'
                }
              />

              {/* Upload */}

              <UploadButton
                onClick={
                  handleUploadGlbClick
                }
                label="Upload Model"
                description={
                  modelFileName
                }
                icon={
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={
                      1.5
                    }
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                    />

                  </svg>
                }
              />

              {/* Position */}

              <ModelPositionControl
                modelPosition={
                  modelPosition
                }
                setModelPosition={
                  setModelPosition
                }
                handleUpdatePosition={
                  handleUpdatePosition
                }
              />

              {/* Error */}

              {storageError && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">

                  {storageError}

                </p>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ===================================================
          FILE INPUT
      =================================================== */}

      <input
        type="file"
        accept=".glb,.gltf"
        onChange={
          handleFileGlbChange
        }
        ref={
          fileInputGlbRef
        }
        className="hidden"
      />

      {/* ===================================================
          LOADING
      =================================================== */}

      {isModelLoading && (
        <LoadingOverlay
          modelName={
            modelFileName
          }
        />
      )}

      {/* ===================================================
          VIEWER
      =================================================== */}

      <div className="relative h-full w-full">

        <Canvas
          className="!absolute inset-0"

          camera={{
            fov: 40,

            near: 0.1,

            far: 1000,

            position: [
              0,
              0,
              8,
            ],
          }}
        >

          {/* Environment */}

          <Env
            hdriUrl={
              hdriUrl
            }
            onReady={
              handleHdriReady
            }
            theme={
              theme
            }
          />

          {/* Grid */}

          <Grid
            infiniteGrid
            fadeDistance={
              45
            }
            fadeStrength={
              1.5
            }
            cellSize={
              0.5
            }
            sectionSize={
              2.5
            }
            cellColor="#c7cdd6"
            sectionColor="#9aa3b2"
            position={[
              0,
              0,
              0,
            ]}
          />

          {/* Model */}

          <Bounds
            fit
            clip
            margin={
              1.15
            }
          >

            <Suspense
              fallback={
                null
              }
            >

              <PositionedModel
                url={
                  modelUrl
                }
                position={
                  modelPosition
                }
                onLoaded={
                  handleModelLoaded
                }
              />

            </Suspense>

          </Bounds>

          {/* Shadow */}

          <ContactShadows
            scale={
              50
            }
            position={[
              0,
              0,
              0,
            ]}
            opacity={
              0.6
            }
            blur={
              2
            }
          />

          {/* Camera Controls */}

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={
              0.08
            }
            rotateSpeed={
              0.7
            }
            zoomSpeed={
              0.8
            }
            panSpeed={
              0.8
            }
            target={[
              0,
              1,
              0,
            ]}
            maxPolarAngle={
              Math.PI /
              2
            }
            minDistance={
              1
            }
            maxDistance={
              500
            }
          />

        </Canvas>

      </div>

    </>
  );
}

