/*
 Core, pure cube representation and move application, deterministic scramble.
*/
import type { BasicMove, Face } from './notation';

export type Color = 'W'|'Y'|'O'|'R'|'G'|'B';
export type FaceKey = 'U'|'D'|'L'|'R'|'F'|'B';

export interface Vec3 { x: -1|0|1; y: -1|0|1; z: -1|0|1 }

export interface Cubie {
  id: string;
  pos: Vec3;
  faceColors: Partial<Record<FaceKey, Color>>;
  isHighlighted?: boolean;
}

export interface CubeState { cubies: Cubie[] }

export const SOLVED_COLORS: Record<FaceKey, Color> = {
  U: 'W', D: 'Y', L: 'O', R: 'R', F: 'G', B: 'B'
};

export function createSolvedState(): CubeState {
  const cubies: Cubie[] = [];
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        const pos = { x: x as -1|0|1, y: y as -1|0|1, z: z as -1|0|1 };
        const isCenter = (x === 0 && y === 0 && z === 0);
        const faceColors: Partial<Record<FaceKey, Color>> = {};
        if (y === 1) faceColors.U = SOLVED_COLORS.U;
        if (y === -1) faceColors.D = SOLVED_COLORS.D;
        if (x === -1) faceColors.L = SOLVED_COLORS.L;
        if (x === 1) faceColors.R = SOLVED_COLORS.R;
        if (z === 1) faceColors.F = SOLVED_COLORS.F;
        if (z === -1) faceColors.B = SOLVED_COLORS.B;
        cubies.push({ id: `${x},${y},${z}`, pos, faceColors, isHighlighted: false });
      }
  return { cubies };
}

// Right-hand rule rotations: +90° around axis
// Around X: (x,y,z) -> (x, -z, y)
// Around Y: (x,y,z) -> (z, y, -x) 
// Around Z: (x,y,z) -> (-y, x, z)
function rotatePosAroundX(p: Vec3, dir: 1|-1): Vec3 {
  return dir === 1 ? { x: p.x, y: (-p.z) as -1|0|1, z: p.y } : { x: p.x, y: p.z, z: (-p.y) as -1|0|1 };
}
function rotatePosAroundY(p: Vec3, dir: 1|-1): Vec3 {
  return dir === 1 ? { x: p.z, y: p.y, z: (-p.x) as -1|0|1 } : { x: (-p.z) as -1|0|1, y: p.y, z: p.x };
}
function rotatePosAroundZ(p: Vec3, dir: 1|-1): Vec3 {
  return dir === 1 ? { x: (-p.y) as -1|0|1, y: p.x, z: p.z } : { x: p.y, y: (-p.x) as -1|0|1, z: p.z };
}

// Sticker-key cycles (for cubies on that face):
// R/L (X-axis): cycle {U, B, D, F}; for R (+90°): U→B, B→D, D→F, F→U
function rotateFaceKeysAroundX(keys: Partial<Record<FaceKey, Color>>, dir: 1|-1): Partial<Record<FaceKey, Color>> {
  const out: Partial<Record<FaceKey, Color>> = {};
  // R/L faces don't change when rotating around X
  if (keys.R) out.R = keys.R;
  if (keys.L) out.L = keys.L;
  // cycle U->B->D->F->U for +90 around +X
  if (dir === 1) {
    if (keys.U) out.B = keys.U;
    if (keys.B) out.D = keys.B;
    if (keys.D) out.F = keys.D;
    if (keys.F) out.U = keys.F;
  } else {
    if (keys.U) out.F = keys.U;
    if (keys.F) out.D = keys.F;
    if (keys.D) out.B = keys.D;
    if (keys.B) out.U = keys.B;
  }
  return out;
}

// U/D (Y-axis): cycle {F, R, B, L}; for U (+90°): F→R, R→B, B→L, L→F
function rotateFaceKeysAroundY(keys: Partial<Record<FaceKey, Color>>, dir: 1|-1): Partial<Record<FaceKey, Color>> {
  const out: Partial<Record<FaceKey, Color>> = {};
  // U/D faces don't change when rotating around Y
  if (keys.U) out.U = keys.U;
  if (keys.D) out.D = keys.D;
  // cycle F->R->B->L->F for +90 around +Y
  if (dir === 1) {
    if (keys.F) out.R = keys.F;
    if (keys.R) out.B = keys.R;
    if (keys.B) out.L = keys.B;
    if (keys.L) out.F = keys.L;
  } else {
    if (keys.F) out.L = keys.F;
    if (keys.L) out.B = keys.L;
    if (keys.B) out.R = keys.B;
    if (keys.R) out.F = keys.R;
  }
  return out;
}

// F/B (Z-axis): cycle {U, R, D, L}; for F (+90°): U→R, R→D, D→L, L→U
function rotateFaceKeysAroundZ(keys: Partial<Record<FaceKey, Color>>, dir: 1|-1): Partial<Record<FaceKey, Color>> {
  const out: Partial<Record<FaceKey, Color>> = {};
  // F/B faces don't change when rotating around Z
  if (keys.F) out.F = keys.F;
  if (keys.B) out.B = keys.B;
  // cycle U->R->D->L->U for +90 around +Z
  if (dir === 1) {
    if (keys.U) out.R = keys.U;
    if (keys.R) out.D = keys.R;
    if (keys.D) out.L = keys.D;
    if (keys.L) out.U = keys.L;
  } else {
    if (keys.U) out.L = keys.U;
    if (keys.L) out.D = keys.L;
    if (keys.D) out.R = keys.D;
    if (keys.R) out.U = keys.R;
  }
  return out;
}

function deepClone(state: CubeState): CubeState {
  return {
    cubies: state.cubies.map(c => ({ id: c.id, pos: { ...c.pos }, faceColors: { ...c.faceColors }, isHighlighted: !!c.isHighlighted }))
  };
}

type AxisSpec = { axis: 'x'|'y'|'z'; layer: 1|-1|0; dir: 1|-1 };

function specForMove(move: BasicMove): AxisSpec {
  const f = move[0] as FaceKey;
  const isPrime = move.endsWith("'");
  const isDouble = move.endsWith('2');
  const dir90 = (d: 1|-1) => isPrime ? (d === 1 ? -1 : 1) : d;
  switch (f) {
    case 'R': return { axis: 'x', layer: 1, dir: dir90(1) };
    case 'L': return { axis: 'x', layer: -1, dir: dir90(-1) };
    case 'U': return { axis: 'y', layer: 1, dir: dir90(1) };
    case 'D': return { axis: 'y', layer: -1, dir: dir90(-1) };
    case 'F': return { axis: 'z', layer: 1, dir: dir90(1) };
    case 'B': return { axis: 'z', layer: -1, dir: dir90(-1) };
  }
}

export function applyMove(state: CubeState, move: BasicMove): CubeState {
  const s = deepClone(state);
  const isDouble = move.endsWith('2');
  const single: BasicMove = isDouble ? (move[0] as FaceKey) as BasicMove : move;
  const turns = isDouble ? 2 : 1;
  for (let t = 0; t < turns; t++) {
    const spec = specForMove(single);
    for (const cubie of s.cubies) {
      const inLayer = (spec.axis === 'x' && cubie.pos.x === spec.layer) ||
        (spec.axis === 'y' && cubie.pos.y === spec.layer) ||
        (spec.axis === 'z' && cubie.pos.z === spec.layer);
      if (!inLayer) continue;
      // rotate position
      if (spec.axis === 'x') cubie.pos = rotatePosAroundX(cubie.pos, spec.dir);
      if (spec.axis === 'y') cubie.pos = rotatePosAroundY(cubie.pos, spec.dir);
      if (spec.axis === 'z') cubie.pos = rotatePosAroundZ(cubie.pos, spec.dir);
      // rotate stickers
      if (spec.axis === 'x') cubie.faceColors = rotateFaceKeysAroundX(cubie.faceColors, spec.dir);
      if (spec.axis === 'y') cubie.faceColors = rotateFaceKeysAroundY(cubie.faceColors, spec.dir);
      if (spec.axis === 'z') cubie.faceColors = rotateFaceKeysAroundZ(cubie.faceColors, spec.dir);
    }
  }
  return s;
}

export function applyMoves(state: CubeState, moves: BasicMove[]): CubeState {
  return moves.reduce((acc, m) => applyMove(acc, m), state);
}

export function isSolved(state: CubeState): boolean {
  for (const c of state.cubies) {
    for (const k of Object.keys(c.faceColors) as FaceKey[]) {
      const col = c.faceColors[k]!;
      // in solved state, sticker color matches face center color
      if (col !== SOLVED_COLORS[k]) return false;
    }
  }
  return true;
}

export function isCrossSolved(state: CubeState, face: 'D'|'U' = 'D'): boolean {
  const faceColor = SOLVED_COLORS[face];
  const layerY = face === 'D' ? -1 : 1;
  const edges = state.cubies.filter(c => c.pos.y === layerY && Math.abs(c.pos.x) + Math.abs(c.pos.z) === 1);
  return edges.every(e => e.faceColors[face] === faceColor);
}

export function isFirstTwoLayersSolved(state: CubeState): boolean {
  // Layers y = -1 and y = 0 fully match solved stickers
  for (const c of state.cubies) {
    if (c.pos.y === 1) continue;
    for (const k of Object.keys(c.faceColors) as FaceKey[]) {
      if (c.faceColors[k]! !== SOLVED_COLORS[k]) return false;
    }
  }
  return true;
}

export function isOLLSolved(state: CubeState): boolean {
  // All U stickers face up with correct color
  const up = state.cubies.filter(c => c.pos.y === 1);
  return up.every(c => c.faceColors.U === SOLVED_COLORS.U);
}

// Mulberry32 for deterministic scrambles
function mulberry32(a: number) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALL_MOVES: BasicMove[] = [
  'U', "U'", 'U2', 'D', "D'", 'D2', 'L', "L'", 'L2', 'R', "R'", 'R2', 'F', "F'", 'F2', 'B', "B'", 'B2'
];

function faceAxis(face: FaceKey) { return face === 'U' || face === 'D' ? 'y' : face === 'L' || face === 'R' ? 'x' : 'z'; }

export function randomScramble(n = 25, seed = 1234): { moves: BasicMove[]; state: CubeState } {
  const rnd = mulberry32(seed);
  const moves: BasicMove[] = [];
  let lastFace: FaceKey | null = null;
  let lastAxis: 'x'|'y'|'z'|null = null;
  while (moves.length < n) {
    const m = ALL_MOVES[Math.floor(rnd() * ALL_MOVES.length)];
    const f = m[0] as FaceKey;
    const ax = faceAxis(f);
    if (lastFace === f) continue; // avoid repeating same face
    if (lastAxis === ax) continue; // avoid same axis repetition
    moves.push(m);
    lastFace = f;
    lastAxis = ax;
  }
  const final = applyMoves(createSolvedState(), moves);
  return { moves, state: final };
}

// Dev tests for move validation - run in development only
function deepEqualState(a: CubeState, b: CubeState): boolean {
  if (a.cubies.length !== b.cubies.length) return false;
  const mapB = new Map(b.cubies.map(c => [c.id, c]));
  for (const cubieA of a.cubies) {
    const cubieB = mapB.get(cubieA.id);
    if (!cubieB) return false;
    if (cubieA.pos.x !== cubieB.pos.x || cubieA.pos.y !== cubieB.pos.y || cubieA.pos.z !== cubieB.pos.z) return false;
    const keysA = Object.keys(cubieA.faceColors) as FaceKey[];
    const keysB = Object.keys(cubieB.faceColors) as FaceKey[];
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
      if (cubieA.faceColors[k] !== cubieB.faceColors[k]) return false;
    }
  }
  return true;
}

export async function testSolverAccuracy(): Promise<void> {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return;
  
  try {
    // Test with small scramble first
    const s = createSolvedState();
    const { moves: scrambleMoves } = randomScramble(10, 42);
    const scrambled = applyMoves(s, scrambleMoves);
    
    console.log(`🎲 Testing scramble: ${scrambleMoves.join(' ')}`);
    
    // Import and test solver
    const { planCFOP } = await import('./cfop-solver');
    const plan = planCFOP(scrambled);
    const solutionMoves = plan.moves.filter(m => m && m.trim()) as BasicMove[];
    
    console.log(`🔧 Solution (${solutionMoves.length} moves): ${solutionMoves.join(' ')}`);
    
    // Apply solution step by step with validation
    let cur = scrambled;
    for (let i = 0; i < solutionMoves.length; i++) {
      const move = solutionMoves[i];
      const next = applyMove(cur, move);
      
      if (!next.cubies || next.cubies.length !== 27) {
        throw new Error(`❌ Invalid state at move ${i} (${move}): missing or wrong cubie count`);
      }
      
      cur = next;
    }
    
    const solved = isSolved(cur);
    console.assert(solved, '❌ Solver sequence does not solve the cube!');
    
    if (solved) {
      console.log('✅ Solver validation test passed');
    } else {
      console.error('❌ Solver validation FAILED - cube not solved after applying solution');
      // Debug output
      console.log('Final state cubies sample:', cur.cubies.slice(0, 3));
    }
    
  } catch (error) {
    console.error('❌ Solver test failed with error:', error);
  }
}

export function runDevTests(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return;
  
  console.log('🧪 Running cube dev tests...');
  
  // 1) Move + inverse = identity
  for (const m of ["U","D","L","R","F","B"]) {
    const s0 = createSolvedState();
    const s1 = applyMove(s0, m as BasicMove);
    const s2 = applyMove(s1, (m+"'") as BasicMove);
    console.assert(deepEqualState(s0, s2), `❌ fail: ${m} then ${m}'`);
    
    const s3 = applyMove(applyMove(s0, m as BasicMove), m as BasicMove);
    const s4 = applyMove(s0, (m+"2") as BasicMove);
    console.assert(deepEqualState(s3, s4), `❌ fail: ${m}2 equivalence`);
  }
  console.log('✅ Move inverse tests passed');
  
  // 2) Async solver validation (don't wait for it)
  testSolverAccuracy().catch(console.error);
}


