import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  CircuitComponentData, 
  CircuitWire, 
  SimulationState, 
  CameraPreset 
} from '../types';
import { CIRCUIT_COMPONENTS } from '../circuit/componentsData';
import { CIRCUIT_WIRES } from '../circuit/wireNets';

interface ThreeCircuitCanvasProps {
  simState: SimulationState;
  selectedComponent: CircuitComponentData | null;
  onSelectComponent: (comp: CircuitComponentData | null) => void;
  hoveredWire: CircuitWire | null;
  onHoverWire: (wire: CircuitWire | null) => void;
  cameraPreset: CameraPreset;
  showCurrentFlow: boolean;
  showElectronFlow: boolean;
  showPinLabels: boolean;
  showWireLabels: boolean;
  highlightedComponentIds?: string[];
  highlightedWireIds?: string[];
}

export const ThreeCircuitCanvas: React.FC<ThreeCircuitCanvasProps> = ({
  simState,
  selectedComponent,
  onSelectComponent,
  hoveredWire,
  onHoverWire,
  cameraPreset,
  showCurrentFlow,
  showElectronFlow,
  showPinLabels,
  showWireLabels,
  highlightedComponentIds = [],
  highlightedWireIds = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointLightLEDRef = useRef<THREE.PointLight | null>(null);
  const ledMeshRef = useRef<THREE.Mesh | null>(null);
  const soundWaveRingsRef = useRef<THREE.Mesh[]>([]);

  // Wire particle systems
  const wireParticlesRef = useRef<Array<{
    wire: CircuitWire;
    curve: THREE.CatmullRomCurve3;
    mesh: THREE.Points;
    progressArray: Float32Array;
    speed: number;
  }>>([]);

  // Component mesh map for raycasting
  const componentMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const wireMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Camera animation target
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 16, 16));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Mouse orbit controls state
  const isDragging = useRef(false);
  const isPanning = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const [hoveredCompName, setHoveredCompName] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Setup Camera Preset Target Coordinates
  useEffect(() => {
    switch (cameraPreset) {
      case 'sensor':
        targetCamPos.current.set(-5.5, 7.5, 4.5);
        targetLookAt.current.set(-5.0, 0, -0.5);
        break;
      case 'timer':
        targetCamPos.current.set(1.5, 8.0, 4.5);
        targetLookAt.current.set(1.0, 0, -1.0);
        break;
      case 'flipflop':
        targetCamPos.current.set(6.5, 8.5, 4.5);
        targetLookAt.current.set(6.2, 0, -1.0);
        break;
      case 'output':
        targetCamPos.current.set(10.5, 7.5, 3.5);
        targetLookAt.current.set(10.5, 0, -1.0);
        break;
      case 'pcb_top':
        targetCamPos.current.set(0, 20, 0.01);
        targetLookAt.current.set(0, 0, 0);
        break;
      case 'overview':
      default:
        targetCamPos.current.set(0, 15, 14);
        targetLookAt.current.set(0, 0, 0);
        break;
    }
  }, [cameraPreset]);

  // Main Scene Initialization
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14); // Deep engineering dark slate
    scene.fog = new THREE.FogExp2(0x0a0d14, 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 15, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    fillLight.position.set(-15, 10, -10);
    scene.add(fillLight);

    // Dynamic LED Point Light
    const pointLightLED = new THREE.PointLight(0xff2222, 0, 10, 1.8);
    pointLightLED.position.set(10.8, 1.2, -1.8);
    scene.add(pointLightLED);
    pointLightLEDRef.current = pointLightLED;

    // 5. Build Environment: Lab Bench & PCB Board
    buildLaboratoryEnvironment(scene);

    // 6. Build 3D Components
    buildAllComponents(scene, componentMeshesRef);

    // 7. Build 3D Wires & Particle Systems
    buildAllWires(scene, wireMeshesRef, wireParticlesRef);

    // 8. Build Sound Waves for Microphone
    soundWaveRingsRef.current = buildSoundWaveRings(scene);

    // 9. Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animFrame: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animFrame = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.06);
        currentLookAt.current.lerp(targetLookAt.current, 0.06);
        cameraRef.current.lookAt(currentLookAt.current);
      }

      // Update LED lighting & glow
      if (pointLightLEDRef.current && ledMeshRef.current) {
        const brightness = simState.ledBrightness;
        pointLightLEDRef.current.intensity = brightness * 4.5;
        const mat = ledMeshRef.current.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(brightness > 0.05 ? 0xff2222 : 0x220505);
        mat.emissiveIntensity = brightness * 3.5;
      }

      // Update sound wave expansion rings if clap is active
      if (soundWaveRingsRef.current.length > 0) {
        soundWaveRingsRef.current.forEach((ring, idx) => {
          if (simState.isClapActive && simState.micAmplitude > 0.05) {
            ring.visible = true;
            const phase = (elapsedTime * 3.5 + idx * 0.35) % 1.0;
            ring.scale.set(1 + phase * 2.5, 1 + phase * 2.5, 1);
            const ringMat = ring.material as THREE.MeshBasicMaterial;
            ringMat.opacity = (1 - phase) * simState.micAmplitude * 0.8;
          } else {
            ring.visible = false;
          }
        });
      }

      // Update Wire Signal Current Particles
      if (showCurrentFlow && simState.powerOn) {
        wireParticlesRef.current.forEach((wp) => {
          if (!wp || !wp.mesh || !wp.mesh.geometry || !wp.curve) return;
          const posAttr = wp.mesh.geometry.attributes.position;
          if (!posAttr) return;
          const positions = posAttr.array as Float32Array;
          const count = wp.progressArray ? wp.progressArray.length : 0;
          const activeFactor = wp.wire.isActive ? 1.0 : (wp.wire.signalType === 'power' || wp.wire.signalType === 'ground' ? 0.3 : 0.0);
          
          if (activeFactor <= 0.01) {
            wp.mesh.visible = false;
            return;
          }
          wp.mesh.visible = true;

          const dir = showElectronFlow ? -1 : 1;
          const clampedDelta = Math.min(delta, 0.05);
          const speedMultiplier = (simState.simulationSpeed || 1) * (wp.wire.signalType === 'trigger' || wp.wire.signalType === 'clock' ? 1.8 : 1.0);

          for (let i = 0; i < count; i++) {
            wp.progressArray[i] += wp.speed * clampedDelta * speedMultiplier * dir;
            let u = wp.progressArray[i] % 1;
            if (u < 0) u += 1;
            u = Math.max(0.0001, Math.min(0.9999, u));
            wp.progressArray[i] = u;

            try {
              const pt = wp.curve.getPointAt(u);
              if (pt && typeof pt.x === 'number' && !isNaN(pt.x)) {
                positions[i * 3] = pt.x;
                positions[i * 3 + 1] = (pt.y ?? 0) + 0.08;
                positions[i * 3 + 2] = pt.z ?? 0;
              }
            } catch {
              // Gracefully handle any curve edge point
            }
          }
          posAttr.needsUpdate = true;
        });
      } else {
        wireParticlesRef.current.forEach((wp) => {
          if (wp && wp.mesh) wp.mesh.visible = false;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Wire Activation States when simState changes
  useEffect(() => {
    CIRCUIT_WIRES.forEach((wire) => {
      let active = false;
      let voltage = 0;

      if (!simState.powerOn) {
        wire.isActive = false;
        wire.voltage = 0;
        return;
      }

      switch (wire.id) {
        case 'WIRE_BAT_TO_SW':
        case 'WIRE_SW_TO_VCC_BUS':
        case 'WIRE_VCC_TO_RCOL':
        case 'WIRE_VCC_TO_555_P8':
        case 'WIRE_VCC_TO_555_P4':
        case 'WIRE_VCC_TO_RTIMING':
        case 'WIRE_VCC_TO_7474_P14':
        case 'WIRE_VCC_TO_7474_P1_P4':
          active = true;
          voltage = simState.supplyVoltage;
          break;
        case 'WIRE_BAT_GND_MAIN':
        case 'WIRE_GND_TO_Q1_EMITTER':
        case 'WIRE_GND_TO_555_P1':
        case 'WIRE_GND_TO_7474_P7':
        case 'WIRE_GND_TO_LED_CATHODE':
          active = true;
          voltage = 0;
          break;
        case 'WIRE_MIC_TO_CCOUP':
        case 'WIRE_CCOUP_TO_BASE':
        case 'WIRE_RBASE_TO_BASE':
          active = simState.isClapActive || simState.micAmplitude > 0.1;
          voltage = simState.micSignalVoltage;
          break;
        case 'WIRE_Q1_TO_555_TRIG':
          active = simState.transistorIsOn;
          voltage = simState.timer555TriggerVoltage;
          break;
        case 'WIRE_555_RC_NODE':
          active = simState.timer555IsTiming;
          voltage = simState.timer555ThresholdVoltage;
          break;
        case 'WIRE_555_TO_7474_CLK':
          active = simState.timer555OutputState === 1;
          voltage = simState.timer555OutputVoltage;
          break;
        case 'WIRE_7474_FEEDBACK':
          active = true;
          voltage = simState.flipFlopQBarOutput === 1 ? 5.0 : 0.0;
          break;
        case 'WIRE_7474_Q_TO_RLED':
        case 'WIRE_RLED_TO_LED':
        case 'WIRE_7474_Q_TO_RELAY':
          active = simState.flipFlopQOutput === 1;
          voltage = simState.flipFlopQOutput === 1 ? 5.0 : 0.0;
          break;
      }

      wire.isActive = active;
      wire.voltage = voltage;

      // Update 3D wire mesh color & glow
      const mesh = wireMeshesRef.current.get(wire.id);
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const isHovered = hoveredWire?.id === wire.id;
        const isHighlighted = highlightedWireIds.includes(wire.id);

        if (isHovered || isHighlighted) {
          mat.emissive.setHex(0xffffff);
          mat.emissiveIntensity = 0.8;
          mesh.scale.set(1.4, 1.4, 1.4);
        } else if (active) {
          mat.emissive.set(wire.color);
          mat.emissiveIntensity = 0.5;
          mesh.scale.set(1.1, 1.1, 1.1);
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0.0;
          mesh.scale.set(1, 1, 1);
        }
      }
    });
  }, [simState, hoveredWire, highlightedWireIds]);

  // Update Component Mesh Highlights
  useEffect(() => {
    CIRCUIT_COMPONENTS.forEach((comp) => {
      const obj = componentMeshesRef.current.get(comp.id);
      if (obj) {
        const isSelected = selectedComponent?.id === comp.id;
        const isHighlighted = highlightedComponentIds.includes(comp.id);

        obj.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshStandardMaterial;
            if (isSelected) {
              mat.emissive = new THREE.Color(0x38bdf8);
              mat.emissiveIntensity = 0.6;
            } else if (isHighlighted) {
              mat.emissive = new THREE.Color(0xf59e0b);
              mat.emissiveIntensity = 0.7;
            } else {
              if (child.name !== 'LED_BULB') {
                mat.emissive = new THREE.Color(0x000000);
                mat.emissiveIntensity = 0;
              }
            }
          }
        });
      }
    });
  }, [selectedComponent, highlightedComponentIds]);

  // Mouse Interaction: Orbit Controls & Raycasting
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDragging.current = true;
    } else if (e.button === 2) {
      isPanning.current = true;
    }
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const prevX = previousMousePosition.current?.x ?? e.clientX;
    const prevY = previousMousePosition.current?.y ?? e.clientY;
    const deltaX = e.clientX - prevX;
    const deltaY = e.clientY - prevY;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };

    if (isDragging.current && targetCamPos.current && targetLookAt.current) {
      // Orbit rotation around current lookAt
      const radius = targetCamPos.current.distanceTo(targetLookAt.current);
      const camX = targetCamPos.current.x ?? 0;
      const camY = targetCamPos.current.y ?? 0;
      const camZ = targetCamPos.current.z ?? 0;
      const lookX = targetLookAt.current.x ?? 0;
      const lookY = targetLookAt.current.y ?? 0;
      const lookZ = targetLookAt.current.z ?? 0;

      const theta = Math.atan2(camX - lookX, camZ - lookZ);
      const phi = Math.acos(Math.max(-0.99, Math.min(0.99, (camY - lookY) / (radius || 1))));

      const newTheta = theta - deltaX * 0.008;
      const newPhi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, phi - deltaY * 0.008));

      targetCamPos.current.x = lookX + radius * Math.sin(newPhi) * Math.sin(newTheta);
      targetCamPos.current.y = lookY + radius * Math.cos(newPhi);
      targetCamPos.current.z = lookZ + radius * Math.sin(newPhi) * Math.cos(newTheta);
    } else if (isPanning.current && targetCamPos.current && targetLookAt.current) {
      // Pan translation
      const panSpeed = 0.02;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraRef.current.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cameraRef.current.quaternion);

      targetLookAt.current.addScaledVector(right, -deltaX * panSpeed);
      targetLookAt.current.addScaledVector(up, deltaY * panSpeed);
      targetCamPos.current.addScaledVector(right, -deltaX * panSpeed);
      targetCamPos.current.addScaledVector(up, deltaY * panSpeed);
    } else {
      // Raycasting for hover tooltip
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      // Check components
      const interactiveMeshes: THREE.Object3D[] = [];
      componentMeshesRef.current.forEach((mesh) => {
        mesh.traverse((c) => {
          if (c instanceof THREE.Mesh) interactiveMeshes.push(c);
        });
      });

      const compIntersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (compIntersects.length > 0) {
        let parentCompId: string | null = null;
        let curr: THREE.Object3D | null = compIntersects[0].object;
        while (curr) {
          if (curr.userData && curr.userData.componentId) {
            parentCompId = curr.userData.componentId;
            break;
          }
          curr = curr.parent;
        }

        if (parentCompId) {
          const comp = CIRCUIT_COMPONENTS.find(c => c.id === parentCompId);
          if (comp) {
            setHoveredCompName(comp.name);
            setTooltipPos({ x: e.clientX - rect.left + 15, y: e.clientY - rect.top + 15 });
            return;
          }
        }
      }

      // Check wires
      const wireMeshList: THREE.Object3D[] = Array.from(wireMeshesRef.current.values());
      const wireIntersects = raycaster.intersectObjects(wireMeshList, false);
      if (wireIntersects.length > 0) {
        const wireId = wireIntersects[0].object.userData.wireId;
        const wire = CIRCUIT_WIRES.find(w => w.id === wireId);
        if (wire) {
          onHoverWire(wire);
          setHoveredCompName(`Wire: ${wire.name} (${wire.signalType.toUpperCase()})`);
          setTooltipPos({ x: e.clientX - rect.left + 15, y: e.clientY - rect.top + 15 });
          return;
        }
      } else {
        if (hoveredWire) onHoverWire(null);
      }

      setHoveredCompName(null);
      setTooltipPos(null);
    }
  }, [hoveredWire, onHoverWire]);

  const handleMouseUp = () => {
    isDragging.current = false;
    isPanning.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const direction = targetCamPos.current.clone().sub(targetLookAt.current);
    const newLength = Math.max(3.5, Math.min(38, direction.length() * zoomFactor));
    direction.setLength(newLength);
    targetCamPos.current.copy(targetLookAt.current).add(direction);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const interactiveMeshes: THREE.Object3D[] = [];
    componentMeshesRef.current.forEach((mesh) => {
      mesh.traverse((c) => {
        if (c instanceof THREE.Mesh) interactiveMeshes.push(c);
      });
    });

    const intersects = raycaster.intersectObjects(interactiveMeshes, false);
    if (intersects.length > 0) {
      let curr: THREE.Object3D | null = intersects[0].object;
      while (curr) {
        if (curr.userData && curr.userData.componentId) {
          const comp = CIRCUIT_COMPONENTS.find(c => c.id === curr?.userData.componentId);
          if (comp) {
            onSelectComponent(comp);
            return;
          }
        }
        curr = curr.parent;
      }
    } else {
      onSelectComponent(null);
    }
  };

  return (
    <div
      ref={containerRef}
      id="three-circuit-container"
      className="relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden bg-slate-950"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating 3D Tooltip */}
      {hoveredCompName && tooltipPos && typeof tooltipPos.x === 'number' && typeof tooltipPos.y === 'number' && (
        <div
          id="circuit-3d-tooltip"
          className="absolute z-20 pointer-events-none px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-cyan-200 text-xs font-mono shadow-xl transition-opacity duration-150"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold">{hoveredCompName}</span>
          </div>
        </div>
      )}

      {/* 3D Pin & Section Labels Overlay (if toggled) */}
      {showPinLabels && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div className="absolute top-4 left-6 px-3 py-1 rounded bg-slate-900/80 border border-slate-700 text-[11px] font-mono text-slate-300">
            [Stage 1: Sound Sensor]
          </div>
          <div className="absolute top-4 left-1/4 px-3 py-1 rounded bg-slate-900/80 border border-slate-700 text-[11px] font-mono text-slate-300">
            [Stage 2: NPN Switch]
          </div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-slate-900/80 border border-slate-700 text-[11px] font-mono text-slate-300">
            [Stage 3: 555 Monostable Pulse]
          </div>
          <div className="absolute top-4 right-1/4 px-3 py-1 rounded bg-slate-900/80 border border-slate-700 text-[11px] font-mono text-slate-300">
            [Stage 4: 7474 D Flip-Flop (Q&apos;→D)]
          </div>
          <div className="absolute top-4 right-6 px-3 py-1 rounded bg-slate-900/80 border border-slate-700 text-[11px] font-mono text-slate-300">
            [Stage 5: LED / Load Output]
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// HELPER BUILDERS: PCB, COMPONENTS, WIRES, & SOUND WAVE RINGS
// =========================================================================

function buildLaboratoryEnvironment(scene: THREE.Scene) {
  // 1. Antistatic Lab Bench Mat
  const benchGeo = new THREE.PlaneGeometry(50, 40);
  const benchMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.85,
    metalness: 0.1,
  });
  const bench = new THREE.Mesh(benchGeo, benchMat);
  bench.rotation.x = -Math.PI / 2;
  bench.position.y = -0.35;
  bench.receiveShadow = true;
  scene.add(bench);

  // Bench Grid Lines
  const gridHelper = new THREE.GridHelper(40, 40, 0x1e293b, 0x0f172a);
  gridHelper.position.y = -0.34;
  scene.add(gridHelper);

  // 2. High-Tech Green PCB Board (Printed Circuit Board)
  const pcbWidth = 24;
  const pcbLength = 14;
  const pcbHeight = 0.3;

  const pcbGeo = new THREE.BoxGeometry(pcbWidth, pcbHeight, pcbLength);
  const pcbMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b, // Deep forest PCB green
    roughness: 0.4,
    metalness: 0.25,
  });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  pcb.position.set(0, 0, 0);
  pcb.receiveShadow = true;
  pcb.castShadow = true;
  scene.add(pcb);

  // PCB Beveled Edge Rails
  const railGeo = new THREE.BoxGeometry(pcbWidth + 0.2, 0.05, pcbLength + 0.2);
  const railMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.3 }); // Gold edge plating
  const rail = new THREE.Mesh(railGeo, railMat);
  rail.position.set(0, -0.1, 0);
  scene.add(rail);

  // 4 Corner Brass Mounting Standoffs
  const standoffGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16);
  const standoffMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
  [
    [-pcbWidth / 2 + 0.8, -pcbLength / 2 + 0.8],
    [pcbWidth / 2 - 0.8, -pcbLength / 2 + 0.8],
    [-pcbWidth / 2 + 0.8, pcbLength / 2 - 0.8],
    [pcbWidth / 2 - 0.8, pcbLength / 2 - 0.8],
  ].forEach(([x, z]) => {
    const standoff = new THREE.Mesh(standoffGeo, standoffMat);
    standoff.position.set(x, 0.1, z);
    scene.add(standoff);
  });
}

function buildAllComponents(
  scene: THREE.Scene, 
  compMeshMap: React.MutableRefObject<Map<string, THREE.Object3D>>
) {
  CIRCUIT_COMPONENTS.forEach((comp) => {
    const compGroup = new THREE.Group();
    compGroup.position.set(...comp.position);
    compGroup.userData = { componentId: comp.id };

    switch (comp.type) {
      case 'battery':
        build3DBattery(compGroup);
        break;
      case 'switch':
        build3DSwitch(compGroup);
        break;
      case 'mic':
        build3DMicrophone(compGroup);
        break;
      case 'transistor_bc547':
        build3DTransistor(compGroup);
        break;
      case 'ic_555':
        build3D555IC(compGroup);
        break;
      case 'ic_7474':
        build3D7474IC(compGroup);
        break;
      case 'resistor':
        build3DResistor(compGroup, comp.value || '');
        break;
      case 'capacitor':
        build3DCapacitor(compGroup, comp.value || '');
        break;
      case 'led':
        build3DLED(compGroup);
        break;
      case 'relay':
        build3DRelay(compGroup);
        break;
    }

    scene.add(compGroup);
    compMeshMap.current.set(comp.id, compGroup);
  });
}

function build3D555IC(group: THREE.Group) {
  // DIP-8 Molded Epoxy Body
  const bodyGeo = new THREE.BoxGeometry(1.6, 0.45, 1.8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.1 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);

  // Pin 1 Index Notch
  const notchGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.46, 16, 1, false, 0, Math.PI);
  const notchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  const notch = new THREE.Mesh(notchGeo, notchMat);
  notch.position.set(0, 0.35, 0.9);
  notch.rotation.y = Math.PI / 2;
  group.add(notch);

  // Silver Pins (8 pins)
  const pinGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  for (let i = 0; i < 4; i++) {
    const z = 0.6 - i * 0.4;
    // Left side pins (Pins 1-4)
    const pinL = new THREE.Mesh(pinGeo, pinMat);
    pinL.position.set(-0.9, 0.2, z);
    group.add(pinL);

    // Right side pins (Pins 8-5)
    const pinR = new THREE.Mesh(pinGeo, pinMat);
    pinR.position.set(0.9, 0.2, z);
    group.add(pinR);
  }
}

function build3D7474IC(group: THREE.Group) {
  // DIP-14 Molded Epoxy Body
  const bodyGeo = new THREE.BoxGeometry(2.0, 0.45, 3.2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.1 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);

  // Pin 1 Index Notch
  const notchGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.46, 16, 1, false, 0, Math.PI);
  const notchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  const notch = new THREE.Mesh(notchGeo, notchMat);
  notch.position.set(0, 0.35, 1.6);
  notch.rotation.y = Math.PI / 2;
  group.add(notch);

  // Silver Pins (14 pins)
  const pinGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  for (let i = 0; i < 7; i++) {
    const z = 1.2 - i * 0.4;
    // Left side (Pins 1-7)
    const pinL = new THREE.Mesh(pinGeo, pinMat);
    pinL.position.set(-1.1, 0.2, z);
    group.add(pinL);

    // Right side (Pins 14-8)
    const pinR = new THREE.Mesh(pinGeo, pinMat);
    pinR.position.set(1.1, 0.2, z);
    group.add(pinR);
  }
}

function build3DTransistor(group: THREE.Group) {
  // TO-92 Body (D-shaped Cylinder)
  const bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.7, 24, 1, false, 0, Math.PI * 1.3);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5, metalness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.55;
  body.rotation.y = Math.PI / 4;
  group.add(body);

  // 3 Silver Leads (Collector, Base, Emitter)
  const leadGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
  const leadMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  [-0.18, 0, 0.18].forEach((offset) => {
    const lead = new THREE.Mesh(leadGeo, leadMat);
    lead.position.set(0, 0.25, offset);
    group.add(lead);
  });
}

function build3DMicrophone(group: THREE.Group) {
  // Cylindrical Aluminum Electret Capsule
  const capGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.9, 32);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
  const capsule = new THREE.Mesh(capGeo, capMat);
  capsule.position.y = 0.6;
  capsule.castShadow = true;
  group.add(capsule);

  // Top Acoustic Felt Disc
  const feltGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.05, 32);
  const feltMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.95 });
  const felt = new THREE.Mesh(feltGeo, feltMat);
  felt.position.y = 1.06;
  group.add(felt);

  // Bottom Terminals
  const termGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
  const termMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 });
  [-0.2, 0.2].forEach((offset) => {
    const term = new THREE.Mesh(termGeo, termMat);
    term.position.set(0, 0.15, offset);
    group.add(term);
  });
}

function build3DLED(group: THREE.Group) {
  // LED Dome (5mm Diffused)
  const domeGeo = new THREE.SphereGeometry(0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const cylGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 32);
  const rimGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.08, 32);

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x440000,
    emissiveIntensity: 0.2,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
  });

  const dome = new THREE.Mesh(domeGeo, ledMat);
  dome.name = 'LED_BULB';
  dome.position.y = 0.85;
  group.add(dome);

  const cyl = new THREE.Mesh(cylGeo, ledMat);
  cyl.position.y = 0.6;
  group.add(cyl);

  const rim = new THREE.Mesh(rimGeo, ledMat);
  rim.position.y = 0.35;
  group.add(rim);

  // Silver Anode & Cathode Leads
  const leadGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
  const leadMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  [-0.15, 0.15].forEach((offset) => {
    const lead = new THREE.Mesh(leadGeo, leadMat);
    lead.position.set(0, 0.15, offset);
    group.add(lead);
  });
}

function build3DResistor(group: THREE.Group, valText: string) {
  // Axial Beige Ceramic Body
  const bodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 24);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6, metalness: 0.1 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.3;
  body.castShadow = true;
  group.add(body);

  // Colored Bands
  const bandGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.08, 24);
  const colors = [0x78350f, 0x000000, 0xf97316, 0xd97706]; // Default 10k: Brown, Black, Orange, Gold
  if (valText.includes('100')) {
    colors[2] = 0xeab308; // Yellow for 100k
  } else if (valText.includes('470')) {
    colors[0] = 0xeab308; // Yellow
    colors[1] = 0x7c3aed; // Violet
    colors[2] = 0xeab308; // Yellow
  } else if (valText.includes('330')) {
    colors[0] = 0xf97316; // Orange
    colors[1] = 0xf97316; // Orange
    colors[2] = 0x78350f; // Brown
  }

  [-0.24, -0.08, 0.08, 0.24].forEach((pos, idx) => {
    const bandMat = new THREE.MeshStandardMaterial({ color: colors[idx], roughness: 0.4 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.z = Math.PI / 2;
    band.position.set(pos, 0.3, 0);
    group.add(band);
  });

  // Wire Leads
  const wireGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8);
  const wireMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  wire.rotation.z = Math.PI / 2;
  wire.position.y = 0.3;
  group.add(wire);
}

function build3DCapacitor(group: THREE.Group, valText: string) {
  if (valText.includes('Electrolytic')) {
    // Black Aluminum Can with White Negative Stripe
    const canGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 24);
    const canMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.3 });
    const can = new THREE.Mesh(canGeo, canMat);
    can.position.y = 0.6;
    can.castShadow = true;
    group.add(can);

    // Negative Stripe
    const stripeGeo = new THREE.BoxGeometry(0.12, 0.88, 0.72);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.6, 0);
    group.add(stripe);
  } else {
    // Yellow Ceramic Disc Capacitor
    const discGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 24);
    const discMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 0.45;
    disc.rotation.x = Math.PI / 2;
    group.add(disc);
  }

  // Leads
  const leadGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8);
  const leadMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
  [-0.15, 0.15].forEach((offset) => {
    const lead = new THREE.Mesh(leadGeo, leadMat);
    lead.position.set(0, 0.15, offset);
    group.add(lead);
  });
}

function build3DBattery(group: THREE.Group) {
  // PP3 9V Battery Block
  const bodyGeo = new THREE.BoxGeometry(1.6, 2.2, 1.0);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.1;
  body.castShadow = true;
  group.add(body);

  // Gold Top Plate
  const plateGeo = new THREE.BoxGeometry(1.62, 0.4, 1.02);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.y = 1.95;
  group.add(plate);

  // Snap Terminals (+ and -)
  const posGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16);
  const negGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.2, 6);
  const termMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });

  const posTerm = new THREE.Mesh(posGeo, termMat);
  posTerm.position.set(0.35, 2.3, 0);
  group.add(posTerm);

  const negTerm = new THREE.Mesh(negGeo, termMat);
  negTerm.position.set(-0.35, 2.3, 0);
  group.add(negTerm);
}

function build3DSwitch(group: THREE.Group) {
  const baseGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.2;
  group.add(base);

  const leverGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.6, 12);
  const leverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
  const lever = new THREE.Mesh(leverGeo, leverMat);
  lever.position.set(0, 0.6, 0);
  lever.rotation.z = -0.35;
  group.add(lever);
}

function build3DRelay(group: THREE.Group) {
  const boxGeo = new THREE.BoxGeometry(1.5, 0.8, 1.2);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.2 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.y = 0.45;
  box.castShadow = true;
  group.add(box);
}

function buildAllWires(
  scene: THREE.Scene,
  wireMeshMap: React.MutableRefObject<Map<string, THREE.Mesh>>,
  wireParticlesRef: React.MutableRefObject<Array<{
    wire: CircuitWire;
    curve: THREE.CatmullRomCurve3;
    mesh: THREE.Points;
    progressArray: Float32Array;
    speed: number;
  }>>
) {
  CIRCUIT_WIRES.forEach((wire) => {
    if (!wire.waypoints || wire.waypoints.length < 2) return;

    const points = wire.waypoints.map(p => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);

    // 1. 3D Wire Tube Mesh
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.06, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: wire.color,
      roughness: 0.4,
      metalness: 0.3,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.userData = { wireId: wire.id };
    tubeMesh.castShadow = true;
    scene.add(tubeMesh);
    wireMeshMap.current.set(wire.id, tubeMesh);

    // 2. Moving Current Flow Particles along Curve
    const particleCount = 16;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const progressArray = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.max(0.0001, Math.min(0.9999, i / particleCount));
      progressArray[i] = u;
      try {
        const pt = curve.getPointAt(u);
        if (pt && typeof pt.x === 'number' && !isNaN(pt.x)) {
          posArray[i * 3] = pt.x;
          posArray[i * 3 + 1] = (pt.y ?? 0) + 0.08;
          posArray[i * 3 + 2] = pt.z ?? 0;
        }
      } catch {
        posArray[i * 3] = 0;
        posArray[i * 3 + 1] = 0;
        posArray[i * 3 + 2] = 0;
      }
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particleMat = new THREE.PointsMaterial({
      color: wire.signalType === 'feedback' ? 0x34d399 : (wire.signalType === 'clock' ? 0xc084fc : 0xfef08a),
      size: 0.18,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    wireParticlesRef.current.push({
      wire,
      curve,
      mesh: particles,
      progressArray,
      speed: 0.6,
    });
  });
}

function buildSoundWaveRings(scene: THREE.Scene): THREE.Mesh[] {
  const rings: THREE.Mesh[] = [];
  const ringGeo = new THREE.RingGeometry(0.5, 0.65, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(ringGeo, ringMat.clone());
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(-6.8, 1.2 + i * 0.4, 0.2);
    ring.visible = false;
    scene.add(ring);
    rings.push(ring);
  }

  return rings;
}
