import type { CubeState, Cubie, FaceKey, Color } from './cube-core';
import { applyMove, applyMoves, isCrossSolved, isFirstTwoLayersSolved, isOLLSolved, SOLVED_COLORS } from './cube-core';
import { parseMoves, simplifyMoves, type BasicMove } from './notation';

export type Stage = 'Cross'|'F2L'|'OLL'|'PLL';

export interface StageStep {
  alg: string[];
  label?: string;
  highlightCubies?: string[];
  // chunk metadata
  chunkId?: string;
  chunkLabel?: string;
  chunkIndex?: number;
  chunkSize?: number;
}

export interface StagePlan { stage: Stage; steps: StageStep[] }

export interface CFOPPlan { stages: StagePlan[]; moves: string[] }

// Third-party minimal solver adapter (using vendored cubejs lib files)
// We import the CommonJS bundles via require using a type-ignored dynamic import signature

// Convert CubeState to 54-character facelet string in URFDLB order
// Each face scanned row-major from viewer perspective: top-left → bottom-right
// Colors mapped to face letters: W→U, Y→D, R→R, O→L, G→F, B→B
function toFacelets(state: CubeState): string {
  const faces: FaceKey[] = ['U','R','F','D','L','B'];
  const colorToLetter: Record<string,string> = { W:'U', Y:'D', R:'R', O:'L', G:'F', B:'B' };
  
  // Define 3x3 coordinate grids for each face (viewer perspective, row-major)
  const faceCoords: Record<FaceKey, Array<{x:number,y:number,z:number}>> = {
    // U face: looking down at top (y=1), scan from back-left to front-right
    U: [
      {x:-1,y:1,z:-1}, {x:0,y:1,z:-1}, {x:1,y:1,z:-1},
      {x:-1,y:1,z:0},  {x:0,y:1,z:0},  {x:1,y:1,z:0},
      {x:-1,y:1,z:1},  {x:0,y:1,z:1},  {x:1,y:1,z:1}
    ],
    // R face: looking at right side (x=1), scan from top-back to bottom-front
    R: [
      {x:1,y:1,z:-1}, {x:1,y:1,z:0}, {x:1,y:1,z:1},
      {x:1,y:0,z:-1}, {x:1,y:0,z:0}, {x:1,y:0,z:1},
      {x:1,y:-1,z:-1}, {x:1,y:-1,z:0}, {x:1,y:-1,z:1}
    ],
    // F face: looking at front (z=1), scan from top-left to bottom-right
    F: [
      {x:-1,y:1,z:1}, {x:0,y:1,z:1}, {x:1,y:1,z:1},
      {x:-1,y:0,z:1}, {x:0,y:0,z:1}, {x:1,y:0,z:1},
      {x:-1,y:-1,z:1}, {x:0,y:-1,z:1}, {x:1,y:-1,z:1}
    ],
    // D face: looking up at bottom (y=-1), scan from front-left to back-right
    D: [
      {x:-1,y:-1,z:1}, {x:0,y:-1,z:1}, {x:1,y:-1,z:1},
      {x:-1,y:-1,z:0}, {x:0,y:-1,z:0}, {x:1,y:-1,z:0},
      {x:-1,y:-1,z:-1}, {x:0,y:-1,z:-1}, {x:1,y:-1,z:-1}
    ],
    // L face: looking at left side (x=-1), scan from top-front to bottom-back  
    L: [
      {x:-1,y:1,z:1}, {x:-1,y:1,z:0}, {x:-1,y:1,z:-1},
      {x:-1,y:0,z:1}, {x:-1,y:0,z:0}, {x:-1,y:0,z:-1},
      {x:-1,y:-1,z:1}, {x:-1,y:-1,z:0}, {x:-1,y:-1,z:-1}
    ],
    // B face: looking at back (z=-1), scan from top-right to bottom-left
    B: [
      {x:1,y:1,z:-1}, {x:0,y:1,z:-1}, {x:-1,y:1,z:-1},
      {x:1,y:0,z:-1}, {x:0,y:0,z:-1}, {x:-1,y:0,z:-1},
      {x:1,y:-1,z:-1}, {x:0,y:-1,z:-1}, {x:-1,y:-1,z:-1}
    ]
  };
  
  let result = '';
  for (const face of faces) {
    const coords = faceCoords[face];
    for (const coord of coords) {
      const cubie = state.cubies.find(c => c.pos.x === coord.x && c.pos.y === coord.y && c.pos.z === coord.z);
      const color = cubie?.faceColors[face];
      const letter = color ? (colorToLetter[color] || face) : face;
      result += letter;
    }
  }
  
  return result;
}

// Parse and normalize solver output to ensure only U D L R F B moves with ' and 2
function fromSolutionString(sol: string): string[] {
  const moves = parseMoves(sol);
  return normalizeMoves(moves);
}

// Ensure only basic face turns, reject/warn on rotations or slice moves
function normalizeMoves(moves: string[]): string[] {
  const validMoves: string[] = [];
  const validPattern = /^[UDLRFB]['′2]?$/;
  
  for (const move of moves) {
    if (validPattern.test(move)) {
      validMoves.push(move);
    } else {
      console.warn(`⚠️ Skipping unsupported move: ${move} (only U D L R F B with ' and 2 supported)`);
    }
  }
  
  return validMoves;
}

function changedCubies(before: CubeState, after: CubeState): string[] {
  const out: string[] = [];
  const map = new Map(before.cubies.map(c => [c.id, c] as const));
  for (const ac of after.cubies) {
    const bc = map.get(ac.id)!;
    if (bc.pos.x !== ac.pos.x || bc.pos.y !== ac.pos.y || bc.pos.z !== ac.pos.z) out.push(ac.id);
  }
  return out;
}

// ===== Helpers for stage-aware highlights =====

function isEdge(c: Cubie): boolean { return Object.keys(c.faceColors).length === 2; }
function isCorner(c: Cubie): boolean { return Object.keys(c.faceColors).length === 3; }
function hasColor(c: Cubie, color: Color): boolean { return Object.values(c.faceColors).includes(color); }

const FACE_FROM_COLOR: Record<Color, FaceKey> = {
  W: 'U', Y: 'D', O: 'L', R: 'R', G: 'F', B: 'B'
};

function getWhiteEdges(state: CubeState): Cubie[] {
  return state.cubies.filter(c => isEdge(c) && hasColor(c, 'W'));
}

function findEdgeByColors(state: CubeState, a: Color, b: Color): Cubie | undefined {
  return state.cubies.find(c => isEdge(c) && hasColor(c, a) && hasColor(c, b));
}

function findCornerByColors(state: CubeState, a: Color, b: Color, c: Color): Cubie | undefined {
  return state.cubies.find(x => isCorner(x) && hasColor(x, a) && hasColor(x, b) && hasColor(x, c));
}

function getCrossTargetEdge(state: CubeState, side: 'F'|'R'|'B'|'L'): Cubie | undefined {
  const sideColor = SOLVED_COLORS[side];
  return findEdgeByColors(state, 'W', sideColor);
}

function isWhiteCrossEdgeSolved(state: CubeState, edge: Cubie): boolean {
  if (!isEdge(edge) || !hasColor(edge,'W')) return false;
  // White must be on D face
  if (edge.faceColors.D !== 'W') return false;
  // Other sticker must match its side center
  const sideKeys: FaceKey[] = ['F','R','B','L'];
  for (const k of sideKeys) {
    if (edge.faceColors[k] && edge.faceColors[k] === SOLVED_COLORS[k]) return true;
  }
  return false;
}

function getF2LSlotColors(slot: 'FR'|'FL'|'BR'|'BL'): [Color, Color] {
  switch (slot) {
    case 'FR': return ['G','R'];
    case 'FL': return ['G','O'];
    case 'BR': return ['B','R'];
    case 'BL': return ['B','O'];
  }
}

function whichF2LSlot(edge: Cubie, corner: Cubie): 'FR'|'FL'|'BR'|'BL'|undefined {
  const cornerColors = Object.values(corner.faceColors).filter(c => c !== 'W') as Color[];
  const edgeColors = Object.values(edge.faceColors) as Color[];
  const colors = new Set<Color>([...cornerColors, ...edgeColors].filter(c => c !== 'W'));
  const has = (c: Color) => colors.has(c);
  if (has('G') && has('R')) return 'FR';
  if (has('G') && has('O')) return 'FL';
  if (has('B') && has('R')) return 'BR';
  if (has('B') && has('O')) return 'BL';
  return undefined;
}

function isCubieSolved(c: Cubie): boolean {
  for (const k of Object.keys(c.faceColors) as FaceKey[]) {
    if (c.faceColors[k] !== SOLVED_COLORS[k]) return false;
  }
  return true;
}

function isF2LPairSolved(state: CubeState, slot: 'FR'|'FL'|'BR'|'BL'): boolean {
  const [c1,c2] = getF2LSlotColors(slot);
  const edge = findEdgeByColors(state, c1, c2);
  const corner = findCornerByColors(state, 'W', c1, c2);
  if (!edge || !corner) return false;
  return isCubieSolved(edge) && isCubieSolved(corner);
}

function uLayerCubies(state: CubeState): Cubie[] {
  return state.cubies.filter(c => c.pos.y === 1);
}

function stickerOrientationOnU(state: CubeState, cubie: Cubie): 'oriented'|'misoriented'|undefined {
  if (cubie.pos.y !== 1) return undefined;
  if (!('U' in cubie.faceColors)) return undefined;
  return cubie.faceColors.U === SOLVED_COLORS.U ? 'oriented' : 'misoriented';
}

function manhattan(a: {x:number;y:number;z:number}, b: {x:number;y:number;z:number}) { return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+Math.abs(a.z-b.z); }

function crossTargetPosForEdge(edge: Cubie): { x: number; y: number; z: number } | undefined {
  // choose side face by non-white color of this edge
  const colors = Object.values(edge.faceColors) as Color[];
  const sideColor = colors.find(c => c !== 'W');
  if (!sideColor) return undefined;
  const side = FACE_FROM_COLOR[sideColor];
  switch (side) {
    case 'F': return { x: 0, y: -1, z: 1 };
    case 'B': return { x: 0, y: -1, z: -1 };
    case 'R': return { x: 1, y: -1, z: 0 };
    case 'L': return { x: -1, y: -1, z: 0 };
  }
  return undefined;
}

export function planCFOP(initial: CubeState): CFOPPlan {
  const facelets = toFacelets(initial);
  
  // Validate facelet string format for solved state  
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const solved = { cubies: initial.cubies.map(c => ({ ...c, pos: { ...c.pos }, faceColors: { ...c.faceColors } })) };
    const solvedFacelets = toFacelets(solved);
    console.assert(solvedFacelets.length === 54, `❌ Facelet length ${solvedFacelets.length}, expected 54`);
    // Centers should be URFDLB at positions 4, 13, 22, 31, 40, 49
    const centers = [4,13,22,31,40,49].map(i => solvedFacelets[i]).join('');
    console.log(`🎯 Facelet centers: ${centers} (should be URFDLB)`);
  }
  
  // Import vendored cubejs solver
  // @ts-ignore
  const solveJs = require('./thirdparty/cubejs-solve.js');
  // @ts-ignore  
  const cubeJs = require('./thirdparty/cubejs-cube.js');
  const solver: any = (solveJs && (solveJs as any).solve) ? solveJs : (globalThis as any).cubejs || solveJs;
  const solutionStr: string = (solver.solve ? solver.solve : solver)(facelets);
  
  console.log(`🔧 Solver input: ${facelets}`);
  console.log(`🔧 Solver output: ${solutionStr}`);
  
  const allMoves = fromSolutionString(solutionStr);

  // Simulate and segment
  const stages: StagePlan[] = [];
  const makeStage = (stage: Stage): StagePlan => ({ stage, steps: [] });
  let stage: StagePlan = makeStage('Cross');
  let accState: CubeState = { cubies: initial.cubies.map(c=>({ id:c.id, pos:{...c.pos}, faceColors: { ...c.faceColors }})) };

  const pushStep = (label: string, alg: string[], highlight: string[]) => {
    stage.steps.push({ label, alg, highlightCubies: highlight });
  };

  for (const m of allMoves) {
    const before = accState;
    const after = applyMove(accState, m as BasicMove);
    accState = after;
    let highlight: string[] = [];
    let label = '';
    if (stage.stage === 'Cross') {
      const whiteEdgesBefore = getWhiteEdges(before);
      const unsolvedBefore = whiteEdgesBefore.filter(e=>!isWhiteCrossEdgeSolved(before, e));
      const whiteEdgesAfter = getWhiteEdges(after);
      const newlySolved = whiteEdgesAfter.filter(e => {
        const prev = before.cubies.find(c=>c.id===e.id)!;
        return !isWhiteCrossEdgeSolved(before, prev) && isWhiteCrossEdgeSolved(after, e);
      });
      if (newlySolved.length > 0) {
        const e = newlySolved.sort((a,b)=>a.id.localeCompare(b.id))[0];
        highlight = [e.id];
        const sideColor = (Object.values(e.faceColors).find(c=>c!=='W') as Color) || 'G';
        label = `Cross: place ${sideColor} edge`;
      } else {
        // choose unsolved edge that moved closer to its target
        const changed = changedCubies(before, after);
        const candidates = unsolvedBefore.filter(e=>changed.includes(e.id));
        let best: { id: string; d: number } | null = null;
        for (const e of candidates) {
          const t = crossTargetPosForEdge(e);
          if (!t) continue;
          const prev = before.cubies.find(c=>c.id===e.id)!;
          const nxt = after.cubies.find(c=>c.id===e.id)!;
          const dPrev = manhattan(prev.pos, t);
          const dNext = manhattan(nxt.pos, t);
          if (dNext < dPrev) {
            const val = { id: e.id, d: dNext };
            if (!best || dNext < best.d || (dNext===best.d && e.id.localeCompare(best.id)<0)) best = val as any;
          }
        }
        if (best) highlight = [best.id];
        label = 'Cross: setup';
      }
    } else if (stage.stage === 'F2L') {
      const order: ('FR'|'FL'|'BR'|'BL')[] = ['FR','FL','BR','BL'];
      const became: ('FR'|'FL'|'BR'|'BL')[] = order.filter(s=>!isF2LPairSolved(before,s) && isF2LPairSolved(after,s));
      const active = became[0] ?? order.find(s=>!isF2LPairSolved(after,s)) ?? 'FR';
      const [c1,c2] = getF2LSlotColors(active);
      const edge = findEdgeByColors(before, c1, c2);
      const corner = findCornerByColors(before, 'W', c1, c2);
      if (edge && corner) highlight = [corner.id, edge.id];
      else {
        const changed = new Set(changedCubies(before, after));
        highlight = after.cubies.filter(c=>changed.has(c.id) && (c.pos.y!==1)).map(c=>c.id).slice(0,2);
      }
      label = `F2L: ${active} pair${became.length>0?' (insert)':' (setup)'}`;
    } else if (stage.stage === 'OLL') {
      const uPrev = uLayerCubies(before);
      const uNext = uLayerCubies(after);
      const highlightSet = new Set<string>();
      for (const c of uPrev) {
        const next = uNext.find(x=>x.id===c.id);
        const a = stickerOrientationOnU(before, c);
        const b = next ? stickerOrientationOnU(after, next) : undefined;
        if (a !== b && (a || b)) highlightSet.add(c.id);
      }
      highlight = Array.from(highlightSet);
      if (highlight.length===0) {
        const changed = new Set(changedCubies(before, after));
        highlight = uNext.filter(c=>changed.has(c.id)).map(c=>c.id);
      }
      label = 'OLL step';
    } else {
      // PLL
      const uPrev = uLayerCubies(before);
      const uNext = uLayerCubies(after);
      const moved: string[] = [];
      for (const c of uPrev) {
        const n = uNext.find(x=>x.id===c.id);
        if (!n) continue;
        if (n.pos.x!==c.pos.x || n.pos.z!==c.pos.z) moved.push(c.id);
      }
      highlight = moved;
      label = 'PLL step';
    }
    pushStep(label, [m], highlight);
    // check stage boundaries after applying move
    if (stage.stage === 'Cross' && isCrossSolved(accState)) {
      stages.push(stage);
      stage = makeStage('F2L');
    } else if (stage.stage === 'F2L' && isFirstTwoLayersSolved(accState)) {
      stages.push(stage);
      stage = makeStage('OLL');
    } else if (stage.stage === 'OLL' && isOLLSolved(accState)) {
      stages.push(stage);
      stage = makeStage('PLL');
    }
  }
  // push final stage if not empty
  if (stage.steps.length > 0) stages.push(stage);

  // simplify per stage
  const simplified = stages.map(sp => ({
    stage: sp.stage,
    steps: sp.steps.map(st => ({ ...st, alg: simplifyMoves(st.alg) }))
  }));
  // Chunking pass per stage
  const chunked = chunkStages(initial, simplified);
  const flatMoves = chunked.flatMap(sp => sp.steps.flatMap(s => s.alg));
  return { stages: chunked, moves: flatMoves };
}

// The following stage-specific planners are not used when third-party solver is active,
// but kept exported to preserve API compatibility for future homegrown CFOP.
export function planCross(state: CubeState): StagePlan { return { stage: 'Cross', steps: [] }; }
export function planF2L(state: CubeState): StagePlan { return { stage: 'F2L', steps: [] }; }
export function planOLL(state: CubeState): StagePlan { return { stage: 'OLL', steps: [] }; }
export function planPLL(state: CubeState): StagePlan { return { stage: 'PLL', steps: [] }; }

// ===== Chunking =====
function stageStartStates(initial: CubeState, stages: StagePlan[]): CubeState[] {
  const starts: CubeState[] = [];
  let acc = { cubies: initial.cubies.map(c=>({ id:c.id, pos:{...c.pos}, faceColors: { ...c.faceColors }})) };
  for (const sp of stages) {
    starts.push(acc);
    for (const st of sp.steps) {
      const m = st.alg[0] as BasicMove;
      acc = applyMove(acc, m);
    }
  }
  return starts;
}

function buildStatesForStage(start: CubeState, steps: StageStep[]): CubeState[] {
  const s: CubeState[] = [start];
  for (const st of steps) {
    const m = st.alg[0] as BasicMove;
    s.push(applyMove(s[s.length-1], m));
  }
  return s;
}

function whiteCrossCount(state: CubeState): number {
  return getWhiteEdges(state).filter(e=>isWhiteCrossEdgeSolved(state, e)).length;
}

function solvedF2LSlots(state: CubeState): Array<'FR'|'FL'|'BR'|'BL'> {
  const slots: ('FR'|'FL'|'BR'|'BL')[] = ['FR','FL','BR','BL'];
  return slots.filter(s => isF2LPairSolved(state, s));
}

function areOLLEdgesOriented(state: CubeState): boolean {
  // All U-layer edges have U sticker on U
  const uEdges = uLayerCubies(state).filter(isEdge);
  if (uEdges.length < 4) return false;
  return uEdges.every(e => e.faceColors.U === SOLVED_COLORS.U);
}

function areOLLCornersOriented(state: CubeState): boolean {
  const uCorners = uLayerCubies(state).filter(isCorner);
  if (uCorners.length < 4) return false;
  return uCorners.every(c => c.faceColors.U === SOLVED_COLORS.U);
}

function arePLLCornersPermuted(state: CubeState): boolean {
  // After OLL, corners are oriented. Check if their side colors match centers at current positions.
  const uCorners = uLayerCubies(state).filter(isCorner);
  for (const c of uCorners) {
    // check side faces at position
    const sides: FaceKey[] = [];
    if (c.pos.x === 1) sides.push('R'); else if (c.pos.x === -1) sides.push('L');
    if (c.pos.z === 1) sides.push('F'); else if (c.pos.z === -1) sides.push('B');
    for (const f of sides) {
      const color = c.faceColors[f];
      if (!color || color !== SOLVED_COLORS[f]) return false;
    }
  }
  return true;
}

function arePLLEdgesPermuted(state: CubeState): boolean {
  const uEdges = uLayerCubies(state).filter(isEdge);
  for (const e of uEdges) {
    if (e.pos.x === 0 && e.pos.z === 0) return false; // shouldn't happen
    let f: FaceKey | undefined = undefined;
    if (e.pos.x === 1) f = 'R'; else if (e.pos.x === -1) f = 'L';
    if (e.pos.z === 1) f = 'F'; else if (e.pos.z === -1) f = 'B';
    if (!f) return false;
    const color = e.faceColors[f];
    if (!color || color !== SOLVED_COLORS[f]) return false;
  }
  return true;
}

function stripUExtremes(seq: string[]): string[] {
  const isU = (m: string) => m[0] === 'U';
  let a = 0, b = seq.length - 1;
  while (a <= b && isU(seq[a])) a++;
  while (b >= a && isU(seq[b])) b--;
  return seq.slice(a, b + 1);
}

const OLL_EDGES_DICT: Record<string,string[]> = {
  line: ["F","R","U","R'","U'","F'"],
  lshape: ["F","U","R","U'","R'","F'"],
};
const OLL_CORNERS_DICT: Record<string,string[]> = {
  sune: ["R","U","R'","U","R","U2","R'"],
  antisune: ["R'","U'","R","U'","R'","U2","R"],
};
const PLL_EDGES_DICT: Record<string,string[]> = {
  ua: ["R","U'","R","U","R","U","R","U'","R'","U'","R2"],
  ub: ["R2","U","R","U","R'","U'","R'","U'","R'","U","R'"],
};

function matchAlg(labelSet: Record<string,string[]>, seq: string[]): string | undefined {
  const s = stripUExtremes(seq);
  for (const key of Object.keys(labelSet)) {
    const target = labelSet[key];
    if (s.length === target.length && s.every((m,i)=>m===target[i])) return key;
  }
  return undefined;
}

function chunkStages(initial: CubeState, stages: StagePlan[]): StagePlan[] {
  const starts = stageStartStates(initial, stages);
  const out: StagePlan[] = [];
  stages.forEach((sp, idx) => {
    const start = starts[idx];
    const states = buildStatesForStage(start, sp.steps);
    const steps = sp.steps.map(s=>({ ...s }));
    if (sp.stage === 'Cross') {
      let chunkCounter = 0;
      let chunkStart = 0;
      let prevCount = whiteCrossCount(states[0]);
      for (let i=0;i<steps.length;i++) {
        const before = states[i];
        const after = states[i+1];
        const count = whiteCrossCount(after);
        if (count > prevCount) {
          // determine which edge placed
          const edgesAfter = getWhiteEdges(after);
          const placed = edgesAfter.find(e=>!isWhiteCrossEdgeSolved(before, before.cubies.find(c=>c.id===e.id)!));
          const sideColor = placed ? (Object.values(placed.faceColors).find(c=>c!=='W') as Color) : undefined;
          const chunkId = `Cross-${chunkCounter}`;
          const label = sideColor ? `Cross: place ${sideColor} edge` : 'Cross: place edge';
          const size = i - chunkStart + 1;
          for (let j=chunkStart;j<=i;j++) {
            steps[j].chunkId = chunkId;
            steps[j].chunkLabel = label;
            steps[j].chunkIndex = j - chunkStart;
            steps[j].chunkSize = size;
          }
          chunkCounter++;
          chunkStart = i+1;
          prevCount = count;
        }
      }
    } else if (sp.stage === 'F2L') {
      const order: ('FR'|'FL'|'BR'|'BL')[] = ['FR','FL','BR','BL'];
      let cursor = 0;
      let chunkCounter = 0;
      for (const slot of order) {
        if (cursor >= steps.length) break;
        if (isF2LPairSolved(states[cursor], slot)) continue;
        const [c1,c2] = getF2LSlotColors(slot);
        // find start index
        let startIdx = cursor;
        let corner = findCornerByColors(states[cursor], 'W', c1, c2);
        let edge = findEdgeByColors(states[cursor], c1, c2);
        for (let i=cursor;i<steps.length;i++) {
          const ch = new Set(changedCubies(states[i], states[i+1]));
          if ((corner && ch.has(corner.id)) || (edge && ch.has(edge.id))) { startIdx = i; break; }
        }
        // find end index (when slot solved)
        let endIdx = steps.length-1;
        for (let i=startIdx;i<steps.length;i++) {
          if (isF2LPairSolved(states[i+1], slot)) { endIdx = i; break; }
        }
        const chunkId = `F2L-${chunkCounter}`;
        const size = endIdx - startIdx + 1;
        for (let j=startIdx;j<=endIdx;j++) {
          steps[j].chunkId = chunkId;
          steps[j].chunkLabel = `F2L: ${slot} (setup+insert)`;
          steps[j].chunkIndex = j - startIdx;
          steps[j].chunkSize = size;
        }
        cursor = endIdx + 1;
        chunkCounter++;
      }
    } else if (sp.stage === 'OLL') {
      // edges chunk then corners chunk
      let edgeEnd = steps.length-1;
      for (let i=0;i<steps.length;i++) {
        if (!areOLLEdgesOriented(states[i]) && areOLLEdgesOriented(states[i+1])) { edgeEnd = i; break; }
      }
      const edgesSeq = steps.slice(0, edgeEnd+1).map(s=>s.alg[0]);
      const matchE = matchAlg(OLL_EDGES_DICT, edgesSeq);
      const edgesLabel = matchE ? `OLL: ${matchE}` : 'OLL: orient edges';
      for (let j=0;j<=edgeEnd;j++) {
        steps[j].chunkId = 'OLL-edges';
        steps[j].chunkLabel = edgesLabel;
        steps[j].chunkIndex = j;
        steps[j].chunkSize = edgeEnd+1;
      }
      const cornersSeq = steps.slice(edgeEnd+1).map(s=>s.alg[0]);
      const matchC = matchAlg(OLL_CORNERS_DICT, cornersSeq);
      const cornersLabel = matchC ? `OLL: ${matchC}` : 'OLL: orient corners';
      for (let j=edgeEnd+1;j<steps.length;j++) {
        steps[j].chunkId = 'OLL-corners';
        steps[j].chunkLabel = cornersLabel;
        steps[j].chunkIndex = j - (edgeEnd+1);
        steps[j].chunkSize = steps.length - (edgeEnd+1);
      }
    } else if (sp.stage === 'PLL') {
      // corners then edges
      let cornerEnd = steps.length-1;
      for (let i=0;i<steps.length;i++) {
        if (!arePLLCornersPermuted(states[i]) && arePLLCornersPermuted(states[i+1])) { cornerEnd = i; break; }
      }
      const cornersLabel = 'PLL: corners';
      for (let j=0;j<=cornerEnd;j++) {
        steps[j].chunkId = 'PLL-corners';
        steps[j].chunkLabel = cornersLabel;
        steps[j].chunkIndex = j;
        steps[j].chunkSize = cornerEnd+1;
      }
      const edgesSeq = steps.slice(cornerEnd+1).map(s=>s.alg[0]);
      const matchP = matchAlg(PLL_EDGES_DICT, edgesSeq);
      const edgesLabel = matchP ? `PLL: ${matchP}` : 'PLL: edges';
      for (let j=cornerEnd+1;j<steps.length;j++) {
        steps[j].chunkId = 'PLL-edges';
        steps[j].chunkLabel = edgesLabel;
        steps[j].chunkIndex = j - (cornerEnd+1);
        steps[j].chunkSize = steps.length - (cornerEnd+1);
      }
    }
    out.push({ stage: sp.stage, steps });
  });
  return out;
}


