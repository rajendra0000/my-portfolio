export type BasicMove =
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'L' | "L'" | 'L2'
  | 'R' | "R'" | 'R2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2';

export const BASIC_FACES = ['U', 'D', 'L', 'R', 'F', 'B'] as const;
export type Face = typeof BASIC_FACES[number];

export function parseMoves(s: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === ' ' || ch === '\n' || ch === '\t') {
      i++;
      continue;
    }
    if (BASIC_FACES.includes(ch as Face)) {
      let move = ch;
      if (i + 1 < s.length && (s[i + 1] === "'" || s[i + 1] === '2')) {
        move += s[i + 1];
        i += 2;
      } else {
        i += 1;
      }
      tokens.push(move);
      continue;
    }
    // ignore unsupported tokens gracefully
    i++;
  }
  return tokens;
}

export function simplifyMoves(moves: string[]): string[] {
  const result: string[] = [];
  const axisOf = (m: string) => m[0];
  const amount = (m: string) => (m.endsWith("'") ? -1 : m.endsWith('2') ? 2 : 1);
  for (const m of moves) {
    if (result.length === 0) {
      result.push(m);
      continue;
    }
    const last = result[result.length - 1];
    if (axisOf(last) === axisOf(m)) {
      let sum = amount(last) + amount(m);
      sum = ((sum % 4) + 4) % 4; // 0..3
      result.pop();
      if (sum === 1) result.push(axisOf(m));
      else if (sum === 2) result.push(axisOf(m) + '2');
      else if (sum === 3) result.push(axisOf(m) + "'");
      // sum === 0 cancels
    } else {
      result.push(m);
    }
  }
  return result;
}


