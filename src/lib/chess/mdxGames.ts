import type { Expression, Node } from 'estree'
import { createProcessor } from '@mdx-js/mdx'
import type { GameSpec } from './moveTree.ts'

/**
 * Turns a literal JS expression (arrays, objects, strings, numbers, booleans) into a value
 * WITHOUT executing it. Anything else (identifiers, calls, template expressions) throws,
 * so content files can never run code through this path.
 */
export function literalValue(node: Node): unknown {
  switch (node.type) {
    case 'Literal':
      return node.value
    case 'TemplateLiteral':
      if (node.expressions.length) throw new Error('Template literal with ${} is not a plain value')
      return node.quasis.map((q) => q.value.cooked).join('')
    case 'ArrayExpression':
      return node.elements.map((e) => {
        if (!e || e.type === 'SpreadElement') throw new Error('Unsupported array element')
        return literalValue(e)
      })
    case 'ObjectExpression': {
      const out: Record<string, unknown> = {}
      for (const p of node.properties) {
        if (p.type !== 'Property' || p.computed) throw new Error('Unsupported object property')
        const key = p.key.type === 'Identifier' ? p.key.name : p.key.type === 'Literal' ? String(p.key.value) : undefined
        if (key === undefined) throw new Error('Unsupported object key')
        out[key] = literalValue(p.value)
      }
      return out
    }
    case 'UnaryExpression':
      if (node.operator === '-' && node.argument.type === 'Literal' && typeof node.argument.value === 'number') return -node.argument.value
      throw new Error(`Unsupported unary operator ${node.operator}`)
    default:
      throw new Error(`Not a plain value: ${node.type}`)
  }
}

type JsxAttr = { type: string; name?: string; value?: string | { type: string; data?: { estree?: { body: { type: string; expression?: Expression }[] } } } | null }
type MdNode = { type: string; name?: string | null; attributes?: JsxAttr[]; children?: MdNode[] }

/** Every <ChessGame .../> in an MDX source, as GameSpec objects (props read statically, never executed). */
export function extractGames(mdx: string, component = 'ChessGame'): GameSpec[] {
  const tree = createProcessor().parse(mdx) as unknown as MdNode
  const games: GameSpec[] = []
  const walk = (n: MdNode) => {
    if ((n.type === 'mdxJsxFlowElement' || n.type === 'mdxJsxTextElement') && n.name === component) {
      const spec: Record<string, unknown> = {}
      for (const a of n.attributes ?? []) {
        if (a.type !== 'mdxJsxAttribute' || !a.name) throw new Error(`Unsupported attribute on <${component}>`)
        if (typeof a.value === 'string') spec[a.name] = a.value
        else if (a.value == null) spec[a.name] = true
        else {
          const stmt = a.value.data?.estree?.body[0]
          if (stmt?.type !== 'ExpressionStatement' || !stmt.expression) throw new Error(`Prop ${a.name} is not an expression`)
          spec[a.name] = literalValue(stmt.expression)
        }
      }
      if (!Array.isArray(spec.moves)) throw new Error(`<${component}> without a moves array`)
      games.push(spec as unknown as GameSpec)
    }
    n.children?.forEach(walk)
  }
  walk(tree)
  return games
}

type TextNode = { type: string; value?: unknown; name?: string | null; attributes?: JsxAttr[]; children?: TextNode[] }

/** Plain text of a node; <summary> labels are left out. */
const rawText = (n: TextNode): string =>
  n.name === 'summary' ? '' : n.type === 'text' || n.type === 'inlineCode' ? String(n.value) : (n.children ?? []).map(rawText).join(' ')

const tidy = (t: string) => t.replace(/\s+/g, ' ').replace(/ ([,;:!?)])/g, '$1').replace(/\( /g, '(').trim()

const hasClass = (n: TextNode, cls: string) =>
  (n.attributes ?? []).some((a) => a.type === 'mdxJsxAttribute' && a.name === 'className' && typeof a.value === 'string' && a.value.split(/\s+/).includes(cls))

export type QuestionText = { question: string; answer: string }

/**
 * Every exercise block (<div className="qrow"> with a <details> answer) as plain text.
 * `question` is the text outside <details>, `answer` the text inside it (the summary label is dropped).
 */
export function extractQuestions(mdx: string): QuestionText[] {
  const tree = createProcessor().parse(mdx) as unknown as TextNode
  const out: QuestionText[] = []
  const walk = (n: TextNode) => {
    if (n.type.startsWith('mdxJsx') && n.name === 'div' && hasClass(n, 'qrow')) {
      let answer = ''
      const strip = (x: TextNode): TextNode => {
        if (x.name === 'details') {
          answer += ' ' + rawText(x)
          return { type: 'text', value: '' }
        }
        return { ...x, children: x.children?.map(strip) }
      }
      out.push({ question: tidy(rawText(strip(n))), answer: tidy(answer) })
      return
    }
    n.children?.forEach(walk)
  }
  walk(tree)
  return out
}
