import type { MoveNode } from './moveTree'

export type NavTarget = 'first' | 'prev' | 'next' | 'last' | 'enter' | 'exit'

export type TreeIndex = { index: Map<string, MoveNode>; parent: Map<string, MoveNode> }

/** Maps every node id to its node and to its parent, for navigation. */
export function indexTree(root: MoveNode): TreeIndex {
  const index = new Map<string, MoveNode>()
  const parent = new Map<string, MoveNode>()
  const walk = (n: MoveNode) => {
    index.set(n.id, n)
    for (const c of n.children) {
      parent.set(c.id, n)
      walk(c)
    }
  }
  walk(root)
  return { index, parent }
}

/**
 * Tree-aware navigation; returns the id to move to (or the same id when there is nowhere to go).
 *   next  follows children[0], continuing down the CURRENT sub-line.
 *   prev  steps to the parent.
 *   last  follows children[0] to the end of the current line.
 *   enter drops into the first sub-line branching here, or the one replacing the current move.
 *   exit  climbs out of the current sub-line to the main-line move it replaces.
 */
export function navigate(root: MoveNode, tree: TreeIndex, currentId: string, where: NavTarget): string {
  const { index, parent } = tree
  const cur = index.get(currentId) ?? root
  switch (where) {
    case 'first':
      return root.id
    case 'prev':
      return parent.get(cur.id)?.id ?? root.id
    case 'next':
      return cur.children[0]?.id ?? cur.id
    case 'last': {
      let n = cur
      while (n.children[0]) n = n.children[0]
      return n.id
    }
    case 'enter': {
      if (cur.children[1]) return cur.children[1].id
      const p = parent.get(cur.id)
      if (p && p.children[0]?.id === cur.id && p.children[1]) return p.children[1].id
      return cur.id
    }
    case 'exit': {
      let n: MoveNode | undefined = cur
      while (n) {
        const p = parent.get(n.id)
        if (!p) break
        if (p.children[0]?.id !== n.id) return p.children[0].id
        n = p
      }
      return cur.id
    }
  }
}

/** Square (e.g. "e1") of the given side's king in a FEN, used to highlight a check. */
export function kingSquare(fen: string, color: 'white' | 'black'): string | undefined {
  const target = color === 'white' ? 'K' : 'k'
  const rows = fen.split(' ')[0].split('/')
  for (let r = 0; r < 8; r++) {
    let file = 0
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) file += Number(ch)
      else {
        if (ch === target) return 'abcdefgh'[file] + (8 - r)
        file += 1
      }
    }
  }
  return undefined
}
