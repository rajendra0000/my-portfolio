import * as THREE from 'three';
import type { FaceKey } from './cube-core';

export interface QueuedMove {
  move: string;
  stage?: 'Cross'|'F2L'|'OLL'|'PLL';
  highlight?: string[];
}

type Callbacks = {
  msPerQuarterTurn?: number;
  onStageChange?: (s: 'Cross'|'F2L'|'OLL'|'PLL') => void;
  onMove?: (m: string) => void;
};

const FACE_TO_AXIS: Record<FaceKey, 'x'|'y'|'z'> = { U: 'y', D: 'y', L: 'x', R: 'x', F: 'z', B: 'z' };
const FACE_DIR: Record<FaceKey, 1|-1> = { R: 1, L: -1, U: 1, D: -1, F: 1, B: -1 };

export async function playMoves(
  getGroupForFace: (face: FaceKey) => THREE.Group,
  enqueueCommit: (commit: () => void) => void,
  sequence: QueuedMove[],
  opts: Callbacks = {}
): Promise<void> {
  const speed = opts.msPerQuarterTurn ?? 320;

  function animateRotation(group: THREE.Group, axis: 'x'|'y'|'z', radians: number, durationMs: number): Promise<void> {
    return new Promise(resolve => {
      const start = performance.now();
      const startRot = group.rotation[axis];
      const target = startRot + radians;
      const animate = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad
        group.rotation[axis] = startRot + (target - startRot) * eased;
        if (t < 1) requestAnimationFrame(animate);
        else {
          group.rotation[axis] = target;
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  for (const { move, stage } of sequence) {
    const face = move[0] as FaceKey;
    const group = getGroupForFace(face);
    if (stage) opts.onStageChange?.(stage);
    opts.onMove?.(move);

    const axis = FACE_TO_AXIS[face];
    const dir = FACE_DIR[face];
    const isPrime = move.endsWith("'");
    const isDouble = move.endsWith('2');
    const quarter = (Math.PI / 2) * (isPrime ? -dir : dir);
    const total = isDouble ? quarter * 2 : quarter;

    await animateRotation(group, axis, total, isDouble ? speed * 2 : speed);

    enqueueCommit(() => void 0);
  }
}


