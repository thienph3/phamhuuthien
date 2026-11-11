import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import type { Score } from '../../src/lib/chess/pipeline.ts'

export type Analysis = { score: Score; best?: string }

/** One Stockfish process speaking UCI. Searches one position at a time. */
class Engine {
  private proc: ChildProcessWithoutNullStreams
  private buffer = ''
  private waiting?: (line: string) => boolean

  constructor(path: string, hashMb: number) {
    this.proc = spawn(path, [], { stdio: 'pipe' })
    this.proc.stdout.on('data', (d: Buffer) => {
      this.buffer += d.toString()
      let i
      while ((i = this.buffer.indexOf('\n')) >= 0) {
        const line = this.buffer.slice(0, i).trim()
        this.buffer = this.buffer.slice(i + 1)
        if (this.waiting && this.waiting(line)) this.waiting = undefined
      }
    })
    this.send(`uci\nsetoption name Threads value 1\nsetoption name Hash value ${hashMb}`)
  }

  private send(cmd: string) {
    this.proc.stdin.write(cmd + '\n')
  }

  private until(test: (line: string) => boolean): Promise<void> {
    return new Promise((resolve) => (this.waiting = (l) => (test(l) ? (resolve(), true) : false)))
  }

  async ready() {
    const p = this.until((l) => l === 'readyok')
    this.send('isready')
    await p
  }

  /** Searches `fen` to `depth`. Score is for the side to move. */
  async analyse(fen: string, depth: number): Promise<Analysis> {
    let score: Score | undefined
    let best: string | undefined
    const done = this.until((l) => {
      const s = l.match(/ score (cp|mate) (-?\d+)/)
      if (l.startsWith('info') && s && !/ (upper|lower)bound/.test(l)) score = s[1] === 'cp' ? { cp: Number(s[2]) } : { mate: Number(s[2]) }
      const b = l.match(/^bestmove (\S+)/)
      if (b) best = b[1] === '(none)' ? undefined : b[1]
      return !!b
    })
    this.send(`ucinewgame\nposition fen ${fen}\ngo depth ${depth}`)
    await done
    if (!score) throw new Error(`Stockfish gave no score for ${fen}`)
    return { score, best }
  }

  quit() {
    this.send('quit')
  }
}

/** Analyses many positions with `workers` engines in parallel. `onProgress` gets the count done. */
export async function analyseAll(path: string, fens: string[], depth: number, workers: number, onProgress?: (done: number) => void): Promise<Map<string, Analysis>> {
  const engines = Array.from({ length: Math.max(1, Math.min(workers, fens.length)) }, () => new Engine(path, 32))
  await Promise.all(engines.map((e) => e.ready()))
  const out = new Map<string, Analysis>()
  let next = 0
  await Promise.all(
    engines.map(async (e) => {
      while (next < fens.length) {
        const fen = fens[next++]
        out.set(fen, await e.analyse(fen, depth))
        onProgress?.(out.size)
      }
    }),
  )
  engines.forEach((e) => e.quit())
  return out
}
