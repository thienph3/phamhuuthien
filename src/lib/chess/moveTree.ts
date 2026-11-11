import { Chess } from 'chess.js';

/**
 * A node in the move tree. The root is the starting position (no move).
 * `children[0]` is the main continuation; `children[1..]` are variations
 * branching from the SAME parent position (i.e. alternatives to children[0]).
 */
export interface MoveNode {
  id: string;              // stable path id, e.g. "0-1-2" or "0-1-v0-0"
  ply: number;             // half-move number from the game start (root = 0)
  moveNumber: number;      // full-move number this move belongs to (1-based)
  isWhite: boolean;        // true if this is a White move
  san: string | null;      // SAN of the move leading INTO this node (null at root)
  glyph: string;           // trailing annotation glyph: '', '!', '?', '!?', '?!', '!!', '??'
  fen: string;             // position AFTER this move
  from: string;           // from-square (for highlight), '' at root
  to: string;             // to-square, '' at root
  check: 'white' | 'black' | null; // side to move is in check after this move
  comment?: string;        // optional HTML comment shown when this node is current
  children: MoveNode[];    // children[0] = main line, children[1..] = variations
}

/** Spec for a game or variation line. `moves` are SAN strings; glyphs allowed. */
export interface LineSpec {
  moves: string[];
  comments?: Record<string, string>; // key = 0-based index into `moves`
  /** Variations branching from this line. */
  variations?: VariationSpec[];
}

export interface VariationSpec extends LineSpec {
  /**
   * 0-based index into the PARENT line's `moves` that this variation REPLACES.
   * e.g. atMoveIndex=11 means "instead of parent.moves[11], play these moves".
   */
  atMoveIndex: number;
  label?: string; // e.g. "(a)" — shown as the variation's lead-in tag
}

export interface GameSpec extends LineSpec {
  caption?: string;
  startFen?: string;
  /** Full-move number of the first ply (default 1). */
  startMove?: number;
  /** Whether the first ply is White's (default true). */
  startWhite?: boolean;
  /** Optional label shown as the variation tag at the root (unused for main game). */
  label?: string;
}

const GLYPH_RE = /([!?]+)$/;

function splitGlyph(raw: string): { san: string; glyph: string } {
  const m = raw.match(GLYPH_RE);
  if (!m) return { san: raw, glyph: '' };
  return { san: raw.slice(0, m.index).trim(), glyph: m[1] };
}

/**
 * Build a move tree from a GameSpec. Throws (with a precise message) if any SAN
 * is illegal — this is the client-side mirror of the Python audit.
 */
export function buildTree(spec: GameSpec): MoveNode {
  const startFen = spec.startFen;
  const startMove = spec.startMove ?? 1;
  const startWhite = spec.startWhite ?? true;

  const root: MoveNode = {
    id: 'r',
    ply: 0,
    moveNumber: startMove,
    isWhite: !startWhite, // so the first child flips to startWhite
    san: null,
    glyph: '',
    fen: new Chess(startFen).fen(),
    from: '',
    to: '',
    check: null,
    children: [],
  };

  buildLine(root, spec, startFen, startMove, startWhite, 'r');
  return root;
}

function buildLine(
  parent: MoveNode,
  line: LineSpec,
  startFen: string | undefined,
  startMove: number,
  startWhite: boolean,
  idPrefix: string,
): void {
  // Replay the line move by move, attaching nodes along children[0].
  const game = new Chess(startFen);
  // If parent isn't the game start (variation), load the parent's position.
  if (parent.san !== null || idPrefix !== 'r') {
    game.load(parent.fen);
  }

  let node = parent;
  for (let i = 0; i < line.moves.length; i++) {
    const raw = line.moves[i];
    const { san, glyph } = splitGlyph(raw);
    let mv;
    try {
      mv = game.move(san);
    } catch {
      throw new Error(
        `Illegal move #${i + 1} "${raw}" after ${line.moves.slice(0, i).join(' ')} ` +
          `(FEN before: ${game.fen()})`,
      );
    }
    const ply = node.ply + 1;
    const isWhite = startWhite ? ply % 2 === 1 : ply % 2 === 0;
    const moveNumber = startMove + Math.floor((ply - 1 + (startWhite ? 0 : 1)) / 2);
    const child: MoveNode = {
      id: `${idPrefix}-${i}`,
      ply,
      moveNumber,
      isWhite,
      san,
      glyph,
      fen: game.fen(),
      from: mv.from,
      to: mv.to,
      check: game.inCheck() ? (game.turn() === 'w' ? 'white' : 'black') : null,
      comment: line.comments?.[String(i)],
      children: [],
    };
    node.children.push(child);

    // Attach any variations that branch by REPLACING move i (alternatives to this move).
    // A variation at atMoveIndex=i is an alternative to line.moves[i], so it branches
    // from `node` (the position BEFORE move i) and becomes node.children[1..].
    const vars = (line.variations ?? []).filter((v) => v.atMoveIndex === i);
    vars.forEach((v, vi) => {
      buildLine(node, v, startFenForNode(node, startFen), startMove, startWhite, `${idPrefix}-${i}v${vi}`);
      // tag the first node of the variation with its label
      const varFirst = node.children[node.children.length - 1];
      if (v.label && varFirst) varFirst.comment = (v.label + ' ' + (varFirst.comment ?? '')).trim();
    });

    node = child;
  }
}

function startFenForNode(node: MoveNode, gameStartFen: string | undefined): string {
  return node.san === null ? new Chess(gameStartFen).fen() : node.fen;
}

/** Flatten the main line (children[0] chain) for keyboard prev/next navigation. */
export function mainLine(root: MoveNode): MoveNode[] {
  const out: MoveNode[] = [];
  let n: MoveNode | undefined = root.children[0];
  while (n) {
    out.push(n);
    n = n.children[0];
  }
  return out;
}
