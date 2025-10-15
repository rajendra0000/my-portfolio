'use client';

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import BlurFade from '@/components/magicui/blur-fade';
import { applyMove, applyMoves, createSolvedState, CubeState, FaceKey, isSolved, randomScramble, runDevTests } from '@/lib/cube-core';
import type { CFOPPlan } from '@/lib/cfop-solver';
import type { BasicMove } from '@/lib/notation';

const FACE_ORDER: FaceKey[] = ['U','D','L','R','F','B'];

const PLASTIC_HEX = '#1a1a1a'; // Dark grey plastic for inner faces

function colorToHex(c?: string): string {
  switch (c) {
    case 'W': return '#ffffff';
    case 'Y': return '#ffff00';
    case 'O': return '#ff9900';
    case 'R': return '#ff0000';
    case 'G': return '#00cc55';
    case 'B': return '#0066ff';
    // undefined or any unknown -> inner plastic
    default:  return PLASTIC_HEX;
  }
}

function CubieMesh({
  id,
  position,
  faces,
  highlighted,
  refCallback,
}: {
  id: string;
  position: [number, number, number];
  faces: Partial<Record<FaceKey, string>>;
  highlighted: boolean;
  refCallback: (id: string, obj: THREE.Object3D | null) => void;
}) {
  const setRef = useCallback((node: THREE.Object3D | null) => {
    refCallback(id, node);
  }, [id, refCallback]);

  const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: PLASTIC_HEX,
    metalness: 0.1,
    roughness: 0.8,
    emissive: highlighted ? new THREE.Color('#404020') : new THREE.Color('#000000'),
  }), [highlighted]);

  const stickerMaterialFor = useCallback((hex: string) => new THREE.MeshStandardMaterial({
    color: hex,
    metalness: 0,
    roughness: 0.5,
    emissive: highlighted ? new THREE.Color('#ffff66') : new THREE.Color('#000000'),
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    side: THREE.DoubleSide,
  }), [highlighted]);

  // Plane transforms per face
  const half = 0.95 / 2;
  const eps = 0.001;
  const stickerSize = 0.9;
  const faceTransforms: Record<FaceKey, { pos: [number,number,number]; rot: [number,number,number] }> = {
    U: { pos: [0,  half + eps, 0], rot: [-Math.PI/2, 0, 0] },
    D: { pos: [0, -half - eps, 0], rot: [ Math.PI/2, 0, 0] },
    F: { pos: [0, 0,  half + eps], rot: [0, 0, 0] },
    B: { pos: [0, 0, -half - eps], rot: [0, Math.PI, 0] },
    R: { pos: [ half + eps, 0, 0], rot: [0, -Math.PI/2, 0] },
    L: { pos: [-half - eps, 0, 0], rot: [0,  Math.PI/2, 0] },
  };

  return (
    <group ref={setRef} position={position}>
      {/* Base plastic cubie */}
      <mesh renderOrder={0}>
        <boxGeometry args={[0.95, 0.95, 0.95]} />
        <primitive attach="material" object={baseMaterial} />
      </mesh>

      {/* Sticker planes */}
      {Object.entries(faces).map(([face, col]) => {
        if (!col) return null;
        const f = face as FaceKey;
        const t = faceTransforms[f];
        const mat = stickerMaterialFor(colorToHex(col));
        return (
          <mesh key={f} position={t.pos} rotation={t.rot} renderOrder={2}>
            <planeGeometry args={[stickerSize, stickerSize]} />
            <primitive attach="material" object={mat} />
          </mesh>
        );
      })}
    </group>
  );
}

const RotatingCubeGroup = ({ isSolving, children, groupRef }: { 
  isSolving: boolean; 
  children: React.ReactNode;
  groupRef: React.RefObject<THREE.Group>;
}) => {
  useFrame((_, delta) => {
    if (groupRef.current && !isSolving) {
      groupRef.current.rotation.x += delta * 0.3;
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
};

// Runs per-frame inside the Canvas context to animate current face rotation and commit moves
const MovePlayer = ({
  paused,
  anim,
  faceGroupRef,
  rootRef,
  queue,
  setQueue,
  setCube,
  setCurrentMove,
  setGlobalStepIndex,
  solutionLenRef,
  doneCountRef,
  thresholdsRef,
  setStage,
  setIsSolving,
  setStatusMessage,
}: {
  paused: boolean;
  anim: React.MutableRefObject<null | { face: FaceKey; axis: 'x'|'y'|'z'; dir: 1|-1; turns: 1|2; start: number; duration: number; affected: string[] }>;
  faceGroupRef: React.RefObject<THREE.Group>;
  rootRef: React.RefObject<THREE.Group>;
  queue: BasicMove[];
  setQueue: React.Dispatch<React.SetStateAction<BasicMove[]>>;
  setCube: React.Dispatch<React.SetStateAction<CubeState>>;
  setCurrentMove: React.Dispatch<React.SetStateAction<string | null>>;
  setGlobalStepIndex: React.Dispatch<React.SetStateAction<number>>;
  solutionLenRef: React.MutableRefObject<number>;
  doneCountRef: React.MutableRefObject<number>;
  thresholdsRef: React.MutableRefObject<{ q1:number; q2:number; q3:number }>;
  setStage: (s: 'Cross'|'F2L'|'OLL'|'PLL'|'Solved') => void;
  setIsSolving: (b: boolean) => void;
  setStatusMessage: (s: string) => void;
}) => {
  useFrame(() => {
    const a = anim.current;
    if (!a || paused) return;
    const now = performance.now();
    const t = Math.min(1, (now - a.start) / a.duration);
    const eased = t<0.5 ? 2*t*t : -1 + (4-2*t)*t;
    const angle = eased * (Math.PI/2) * a.turns * a.dir;
    if (faceGroupRef.current) {
      (faceGroupRef.current.rotation as any)[a.axis] = angle;
    }
    if (t >= 1) {
      if (faceGroupRef.current && rootRef.current) {
        const grp = faceGroupRef.current;
        const toMove: THREE.Object3D[] = [];
        grp.children.forEach(ch => toMove.push(ch));
        toMove.forEach(ch => (rootRef.current as any).attach(ch));
        grp.rotation.set(0,0,0);
      }
      const mv = queue[0];
      setCube(prev => applyMove(prev, mv));
      setQueue(q => q.slice(1));
      setGlobalStepIndex(i => i + 1);
      if (solutionLenRef.current > 0) {
        doneCountRef.current += 1;
        const d = doneCountRef.current;
        const { q1, q2, q3 } = thresholdsRef.current;
        const label = d < q1 ? 'Cross' : d < q2 ? 'F2L' : d < q3 ? 'OLL' : (d < solutionLenRef.current ? 'PLL' : 'Solved');
        setStage(label as any);
        if (d >= solutionLenRef.current) {
          setIsSolving(false);
          setStatusMessage('Solved');
          setStage('Solved');
          solutionLenRef.current = 0;
        }
      }
      anim.current = null;
      setCurrentMove(null);
    }
  });
  return null;
};

const AppleButton = ({ 
  onClick, 
  disabled = false, 
  variant = 'primary',
  children,
  className = ''
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  className?: string;
}) => {
  const baseClasses = "px-6 py-3 font-medium text-sm rounded-xl transition-all duration-200 ease-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm";
  const variantClasses = {
    primary: "bg-black text-white hover:bg-gray-800 focus:ring-gray-500 disabled:bg-gray-300 disabled:text-gray-500",
    secondary: "bg-white text-black border border-gray-200 hover:bg-gray-50 focus:ring-gray-300 disabled:bg-gray-100 disabled:text-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300"
  } as const;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
};

// Main React Component using pure core + face-group animation
const RubiksCubeScene = () => {
  const [cube, setCube] = useState<CubeState>(() => createSolvedState());
  
  // Run dev tests on mount
  useEffect(() => {
    runDevTests();
  }, []);
  const [queue, setQueue] = useState<BasicMove[]>([]);
  const [currentMove, setCurrentMove] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [speed, setSpeed] = useState(320);
  const [stage, setStage] = useState<'Cross'|'F2L'|'OLL'|'PLL'|'Solved'>('Solved');
  const [showHighlights, setShowHighlights] = useState(true);
  const [lastScramble, setLastScramble] = useState<BasicMove[] | null>(null);
  const [plan, setPlan] = useState<CFOPPlan | null>(null);
  const [planStartState, setPlanStartState] = useState<CubeState | null>(null);
  const [globalStepIndex, setGlobalStepIndex] = useState(0);
  const [flatSteps, setFlatSteps] = useState<any[]>([]);
  const [stageOffsets, setStageOffsets] = useState<number[]>([]);
  const [chunkStartIndices, setChunkStartIndices] = useState<number[]>([]);
  const [chunkSnapshots, setChunkSnapshots] = useState<Map<number, CubeState>>(new Map());
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const lastSeekRef = useRef<number>(0);
  
  const groupRef = useRef<THREE.Group>(null);
  const faceGroupRef = useRef<THREE.Group>(null);
  const rootRef = useRef<THREE.Group>(null);
  const idToObj = useRef<Map<string, THREE.Object3D>>(new Map());

  const anim = useRef<null | { face: FaceKey; axis: 'x'|'y'|'z'; dir: 1|-1; turns: 1|2; start: number; duration: number; affected: string[] }>(null);
  const solutionLenRef = useRef(0);
  const doneCountRef = useRef(0);
  const thresholdsRef = useRef<{ q1:number; q2:number; q3:number }>({ q1:0, q2:0, q3:0 });

  const axisOfFace = (f: FaceKey) => (f==='U'||f==='D') ? 'y' : (f==='L'||f==='R') ? 'x' : 'z';
  const layerOfFace = (f: FaceKey) => (f==='U'||f==='R'||f==='F') ? 1 : -1;
  const dirOfFace = (f: FaceKey, isPrime: boolean) => {
    const base: 1|-1 = (f==='R'||f==='U'||f==='F') ? 1 : -1;
    return (isPrime ? -base : base) as 1|-1;
  };

  const startNext = useCallback(() => {
    if (anim.current || queue.length === 0) return;
    const mv = queue[0];
    const face = mv[0] as FaceKey;
    const isPrime = mv.endsWith("'");
    const isDouble = mv.endsWith('2');
    const axis = axisOfFace(face);
    const dir = dirOfFace(face, isPrime);
    const layer = layerOfFace(face);
    const affected = cube.cubies.filter(c => (axis==='x' ? c.pos.x===layer : axis==='y' ? c.pos.y===layer : c.pos.z===layer)).map(c => c.id);
    anim.current = { face, axis, dir, turns: isDouble ? 2 : 1, start: performance.now(), duration: (isDouble? 2:1) * speed, affected };
    setCurrentMove(mv);
    const grp = faceGroupRef.current!;
    grp.rotation.set(0,0,0);
    affected.forEach(id => {
      const obj = idToObj.current.get(id);
      if (obj && grp) (grp as any).attach(obj);
    });
  }, [queue, cube, speed]);

  // Update highlights per current step
  useEffect(() => {
    if (!plan) { setHighlightedIds(new Set()); return; }
    const fs = plan.stages.flatMap(s=>s.steps);
    const step = fs[globalStepIndex];
    setHighlightedIds(new Set(step?.highlightCubies ?? []));
  }, [globalStepIndex, plan]);

  // per-frame logic moved into MovePlayer inside Canvas

  useEffect(() => {
    if (!anim.current && queue.length > 0 && !paused) startNext();
  }, [queue, paused, startNext]);

  // Mouse interaction handlers for viewing
  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  const handleMouseDown = (e: React.MouseEvent) => { setIsDragging(true); setPreviousMousePosition({ x: e.clientX, y: e.clientY }); };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !groupRef.current) return;
    const dx = e.clientX - previousMousePosition.x;
    const dy = e.clientY - previousMousePosition.y;
    groupRef.current.rotation.y += dx * 0.01;
    groupRef.current.rotation.x += dy * 0.01;
    setPreviousMousePosition({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => setIsDragging(false);

  const onScramble = () => {
    if (isSolving) return;
    setStatusMessage('Scrambling...');
    const { moves } = randomScramble(25, Math.floor(Math.random()*1e9));
    setLastScramble(moves);
    setQueue(moves);
    setPlan(null); setPlanStartState(null); setGlobalStepIndex(0); setFlatSteps([]); setStageOffsets([]); setChunkStartIndices([]); setChunkSnapshots(new Map());
  };

  const onSolve = () => {
    if (isSolving) return;
    // If a scramble is in progress or queued, finish it instantly into logical state
    if (anim.current || queue.length > 0) {
      // cancel in-flight tween and reattach objects
      if (anim.current) {
        anim.current = null;
        if (faceGroupRef.current && rootRef.current) {
          const grp = faceGroupRef.current;
          const toMove: THREE.Object3D[] = [];
          grp.children.forEach(ch => toMove.push(ch));
          toMove.forEach(ch => (rootRef.current as any).attach(ch));
          grp.rotation.set(0,0,0);
        }
      }
      const scrambled = applyMoves(cube, queue);
      setCube(scrambled);
      setQueue([]);
    }
    const base = queue.length === 0 ? cube : applyMoves(cube, queue);
    if (isSolved(base)) return;
    setIsSolving(true);
    setStatusMessage('Planning...');
    (async () => {
      const { planCFOP } = await import('@/lib/cfop-solver');
      const newPlan: CFOPPlan = planCFOP(base);
      setPlan(newPlan);
      setPlanStartState(base);
      // flatten and indices
      const fs = newPlan.stages.flatMap(s=>s.steps);
      setFlatSteps(fs);
      const offs: number[] = [];
      let acc = 0;
      for (const s of newPlan.stages) { offs.push(acc); acc += s.steps.length; }
      setStageOffsets(offs);
      // chunk starts and snapshots
      const starts: number[] = [];
      let prevId: string | undefined;
      fs.forEach((st, i) => { const id = st.chunkId ?? `m-${i}`; if (id !== prevId) { starts.push(i); prevId = id; } });
      setChunkStartIndices(starts);
      const snaps = new Map<number, CubeState>();
      let s = cube;
      for (let i=0;i<fs.length;i++) {
        if (starts.includes(i)) snaps.set(i, s);
        s = applyMove(s, fs[i].alg[0] as any);
      }
      setChunkSnapshots(snaps);
      solutionLenRef.current = newPlan.moves.length;
      doneCountRef.current = 0;
      setGlobalStepIndex(0);
      const crossLen = newPlan.stages.find(s=>s.stage==='Cross')?.steps.length ?? 0;
      const f2lLen = newPlan.stages.find(s=>s.stage==='F2L')?.steps.length ?? 0;
      const ollLen = newPlan.stages.find(s=>s.stage==='OLL')?.steps.length ?? 0;
      thresholdsRef.current = { q1: crossLen, q2: crossLen + f2lLen, q3: crossLen + ollLen };
      setStage('Cross');
      setQueue(newPlan.moves as BasicMove[]);
      setStatusMessage('Solving...');
    })();
  };

  const onReset = () => {
    if (isSolving) return;
    setQueue([]);
    anim.current = null;
    setCube(createSolvedState());
    setStatusMessage('Reset');
    setStage('Solved');
    setPlan(null); setPlanStartState(null); setGlobalStepIndex(0); setFlatSteps([]); setStageOffsets([]); setChunkStartIndices([]); setChunkSnapshots(new Map()); setHighlightedIds(new Set());
  };

  // Seek helpers
  const clampIndex = useCallback((i:number) => {
    const max = (plan ? plan.stages.flatMap(s=>s.steps).length : 0) - 1;
    return Math.max(0, Math.min(i, max >= 0 ? max : 0));
  }, [plan]);

  const computeStateAt = useCallback((target:number): CubeState => {
    if (!plan || !planStartState) return cube;
    const idx = clampIndex(target);
    const fs = plan.stages.flatMap(s=>s.steps);
    // nearest snapshot at or before idx
    let startIdx = 0;
    for (const s of chunkStartIndices) { if (s <= idx && s >= startIdx) startIdx = s; }
    let state = chunkSnapshots.get(startIdx) ?? planStartState;
    for (let i=startIdx;i<idx;i++) state = applyMove(state, fs[i].alg[0] as any);
    return state;
  }, [plan, planStartState, chunkStartIndices, chunkSnapshots, cube, clampIndex]);

  const cancelTween = useCallback(() => {
    if (anim.current) {
      anim.current = null;
      if (faceGroupRef.current && rootRef.current) {
        const grp = faceGroupRef.current;
        const toMove: THREE.Object3D[] = [];
        grp.children.forEach(ch => toMove.push(ch));
        toMove.forEach(ch => (rootRef.current as any).attach(ch));
        grp.rotation.set(0,0,0);
      }
    }
  }, []);

  const stageForIndex = useCallback((i:number): 'Cross'|'F2L'|'OLL'|'PLL'|'Solved' => {
    if (!plan) return 'Solved';
    let acc = 0;
    for (const sp of plan.stages) {
      const len = sp.steps.length;
      if (i < acc + len) return sp.stage as any;
      acc += len;
    }
    return 'Solved';
  }, [plan]);

  const seekTo = useCallback((idx:number) => {
    if (!plan) return;
    const now = Date.now();
    if (now - lastSeekRef.current < 30) return; // debounce
    lastSeekRef.current = now;
    setPaused(true);
    cancelTween();
    const clamped = clampIndex(idx);
    const nextState = computeStateAt(clamped);
    setCube(nextState);
    setGlobalStepIndex(clamped);
    const fs = plan.stages.flatMap(s=>s.steps);
    const remaining = fs.slice(clamped).map(s=>s.alg[0] as BasicMove);
    setQueue(remaining);
    setStage(stageForIndex(clamped));
  }, [plan, clampIndex, computeStateAt, cancelTween, stageForIndex]);

  // Keyboard controls
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (!plan) return;
      const shift = e.shiftKey;
      if (e.code === 'Space') { e.preventDefault(); setPaused(p=>!p); return; }
      if (e.code === 'ArrowRight' && shift) {
        e.preventDefault();
        // next chunk
        const fs = plan.stages.flatMap(s=>s.steps);
        const curr = fs[globalStepIndex];
        const currId = curr?.chunkId;
        let i = globalStepIndex + 1;
        while (i < fs.length && fs[i].chunkId === currId) i++;
        seekTo(i);
        return;
      }
      if (e.code === 'ArrowLeft' && shift) {
        e.preventDefault();
        const fs = plan.stages.flatMap(s=>s.steps);
        // find start of current chunk
        let i = globalStepIndex;
        const currId = fs[i]?.chunkId;
        while (i > 0 && fs[i-1].chunkId === currId) i--;
        // go to previous chunk start
        let j = i - 1;
        const prevId = j >=0 ? fs[j]?.chunkId : undefined;
        while (j > 0 && fs[j-1].chunkId === prevId) j--;
        seekTo(Math.max(0,j));
        return;
      }
      if (e.code === 'ArrowRight') { e.preventDefault(); seekTo(globalStepIndex + 1); return; }
      if (e.code === 'ArrowLeft') { e.preventDefault(); seekTo(globalStepIndex - 1); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [plan, globalStepIndex, seekTo]);

  const isCurrentlySolved = () => (queue.length === 0) && isSolved(cube);

  return (
    <div className="cube-container">
      <div className="controls mb-6 flex gap-3 flex-wrap justify-center">
        <AppleButton onClick={onScramble} disabled={isSolving} variant="secondary">Scramble</AppleButton>
        <AppleButton onClick={onSolve} disabled={isSolving || isCurrentlySolved()} variant="primary">CFOP Solve</AppleButton>
        <AppleButton onClick={onReset} disabled={isSolving} variant="secondary">Reset</AppleButton>
        <AppleButton onClick={() => setPaused(p=>!p)} variant="secondary">{paused ? 'Resume' : 'Pause'}</AppleButton>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Speed</span>
          <input type="range" min={150} max={600} step={10} value={speed} onChange={e=>{ const v = parseInt(e.target.value); anim.current = anim.current ? { ...anim.current, duration: (anim.current.turns as number) * v } as any : anim.current; setSpeed(v); }} />
        </div>
        <label className="text-xs text-gray-600 flex items-center gap-2">
          <input type="checkbox" checked={showHighlights} onChange={e=>setShowHighlights(e.target.checked)} /> Show highlights
        </label>
      </div>

      <div className="status mb-6 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isSolving ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="font-medium text-gray-900">{statusMessage} • Stage: {stage} {currentMove ? `• ${currentMove}` : ''}</span>
          </div>
          {queue.length > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{queue.length} moves remaining</span>
          )}
        </div>
        {plan && (() => {
          const flatSteps = plan.stages.flatMap(s => s.steps);
          const current = flatSteps[globalStepIndex];
          if (!current) return null;
          return (
            <div className="mt-2">
              {current.chunkLabel && (
                <div className="text-sm text-gray-700 truncate" title={current.chunkLabel}>
                  {current.chunkLabel}
                  {typeof current.chunkIndex==='number' && typeof current.chunkSize==='number' ? ` — ${current.chunkIndex+1}/${current.chunkSize}` : ''}
          </div>
        )}
              <div className="text-xs font-mono text-gray-500 mt-1">{currentMove}</div>
              {/* Chunk pills */}
              {(() => {
                // active stage chunks
                let acc=0; let activeIdx=0;
                for (let s=0; s<plan.stages.length; s++){ const len=plan.stages[s].steps.length; if (globalStepIndex < acc+len){ activeIdx=s; break;} acc+=len; }
                const stage = plan.stages[activeIdx];
                const stageStart = plan.stages.slice(0, activeIdx).reduce((a,st)=>a+st.steps.length,0);
                const chunks: { id:string; label:string; start:number }[] = [];
                let last: string | undefined;
                stage.steps.forEach((st, idx) => { if (st.chunkId !== last){ chunks.push({ id: st.chunkId ?? `m-${idx}`, label: st.chunkLabel ?? plan!.stages[activeIdx].stage, start: idx }); last = st.chunkId; } });
                return (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {chunks.map(ch => {
                      const active = current.chunkId === ch.id;
                      const startGlobal = stageStart + ch.start;
                      return (
                        <button key={ch.id} className={`px-2 py-1 rounded text-xs ${active ? 'bg-black/10' : 'bg-black/5'} hover:bg-black/10`} title={ch.label} onClick={() => seekTo(startGlobal)}>
                          {ch.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </div>

      <div 
        className="canvas-container w-full h-96 border border-gray-200 rounded-2xl overflow-hidden shadow-lg bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }} style={{ background: 'white' }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <pointLight position={[-10, -10, -10]} intensity={0.6} />
          <pointLight position={[0, 10, 0]} intensity={0.4} />
          <RotatingCubeGroup isSolving={isSolving} groupRef={groupRef}>
            <group ref={rootRef}>
              {cube.cubies.map(c => (
                <CubieMesh
                  key={c.id}
                  id={c.id}
                  position={[c.pos.x, c.pos.y, c.pos.z]}
                  faces={c.faceColors}
                  highlighted={showHighlights && (plan ? highlightedIds.has(c.id) : (stage==='OLL' ? c.pos.y===1 : stage==='PLL' ? c.pos.y===1 : false))}
                  refCallback={(id,obj)=>{ if (obj) idToObj.current.set(id, obj); else idToObj.current.delete(id); }}
              />
            ))}
            </group>
            <group ref={faceGroupRef} />
            <MovePlayer
              paused={paused}
              anim={anim}
              faceGroupRef={faceGroupRef}
              rootRef={rootRef}
              queue={queue}
              setQueue={setQueue}
              setCube={setCube}
              setCurrentMove={setCurrentMove}
              setGlobalStepIndex={setGlobalStepIndex}
              solutionLenRef={solutionLenRef}
              doneCountRef={doneCountRef}
              thresholdsRef={thresholdsRef}
              setStage={setStage}
              setIsSolving={setIsSolving}
              setStatusMessage={setStatusMessage}
            />
          </RotatingCubeGroup>
        </Canvas>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">Drag to rotate • Click buttons to interact</div>
    </div>
  );
};

const RubiksCube = () => {
  return (
    <BlurFade delay={0.25} inView>
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gray-900">Rubik&apos;s Cube Solver</h2>
            <p className="text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-3xl mx-auto">Interactive 3D visualization with Scramble/Solve/Reset, smooth face animations, and stage labels.</p>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-4xl shadow-lg">
            <RubiksCubeScene />
          </div>
        </div>
      </div>
    </BlurFade>
  );
};

export default RubiksCube; 


