import { useEffect, useMemo, useRef } from 'react'
import { BEATS, CHAPTERS, ENDINGS, ENDING_ORDER } from './story.js'

// 관리자 뷰어. 주소 끝이 #/admin일 때만 켜진다.
// 왼쪽 목차에서 비트를 누르면 그 비트로 바로 이동하고, 문장을 고쳐 저장하면 같은 자리로 돌아온다.
export const isAdmin = () => location.hash.replace(/\/$/, '') === '#/admin'
export const PANEL_W = 400
const KEY = 'hq-admin'

const CHOICES = BEATS.map((b, i) => ({ b, i })).filter((x) => x.b.type === 'choice')
const ROUTE_IDX = BEATS.findIndex((b) => b.type === 'route')
const FINAL_IDX = BEATS.findIndex((b) => b.type === 'final')
const PICK_IDS = ['c2', 'c3'] // 갈림 대사가 있는 선택
const COMBO_ROUTES = ['A', 'B']

// 엔딩마다 그 엔딩을 고를 수 있는 루트. 엔딩과 루트가 어긋나지 않게 맞춘다.
const ROUTE_OF = {}
BEATS.filter((b) => b.type === 'final').forEach((b) => {
  const r = COMBO_ROUTES.find((x) => b.when?.({ route: x }))
  b.options.forEach((o) => { ROUTE_OF[o.key] = r })
})
const align = (cfg, by) => {
  if (by === 'route' && ROUTE_OF[cfg.final] !== cfg.route) return { ...cfg, final: ENDING_ORDER.find((k) => ROUTE_OF[k] === cfg.route) }
  if (by === 'final' && ROUTE_OF[cfg.final] && ROUTE_OF[cfg.final] !== cfg.route) return { ...cfg, route: ROUTE_OF[cfg.final] }
  return cfg
}

export const defaultCfg = () => ({ route: 'A', final: 'adapter', signs: {} })

// i번 비트를 보기 위한 진행 상태를 만든다. 그 앞의 선택은 설정값(기본 +1)으로 채운다.
export function buildState(i, cfg) {
  const picks = CHOICES.filter((c) => c.i < i).map(({ b }) => {
    const opt = b.options.find((o) => o.sign === (cfg.signs[b.id] ?? 1)) ?? b.options[0]
    return { id: b.id, num: b.num, axis: b.axis, sign: opt.sign, prompt: b.prompt, text: opt.text }
  })
  const afterFinal = i > FINAL_IDX
  if (afterFinal) picks.push({ id: 'final', num: '최종', axis: 'final', prompt: null, text: ENDINGS[cfg.final].name })
  const sum = (axis) => picks.filter((p) => p.axis === axis).reduce((a, p) => a + p.sign, 0)
  return {
    started: true, idx: i, ai: sum('ai'), hq: sum('hq'), picks,
    route: i > ROUTE_IDX ? cfg.route : null,
    forceRoute: cfg.route,
    final: afterFinal ? cfg.final : null,
    mine: afterFinal ? cfg.final : null,
    history: [],
  }
}

const fits = (i, cfg) => BEATS[i].type !== 'route' && (!BEATS[i].when || BEATS[i].when(buildState(i, cfg)))

// 조건을 만족하는 설정 조합 전체
const COMBOS = []
for (const route of COMBO_ROUTES) for (const final of ENDING_ORDER) for (const s2 of [1, -1]) for (const s3 of [1, -1])
  COMBOS.push({ route, final, signs: { c2: s2, c3: s3 } })

// 비트를 고르면, 현재 설정에서 가장 적게 바꿔 그 비트가 재생되는 설정을 찾는다.
function satisfy(i, cfg) {
  if (fits(i, cfg)) return cfg
  let best = null, score = 99
  for (const c of COMBOS) {
    const next = { ...cfg, ...c, signs: { ...cfg.signs, ...c.signs } }
    if (ROUTE_OF[next.final] && ROUTE_OF[next.final] !== next.route) continue
    if (!fits(i, next)) continue
    const d = (c.route !== cfg.route) + (c.final !== cfg.final) + PICK_IDS.filter((id) => c.signs[id] !== (cfg.signs[id] ?? 1)).length
    if (d < score) { score = d; best = next }
  }
  return best ?? cfg
}

// 비트가 어떤 조건에서만 나오는지 짧게 표시한다.
function tagOf(b, i) {
  if (!b.when) return ''
  const ok = COMBOS.filter((c) => b.when(buildState(i, c)))
  const one = (get) => { const v = [...new Set(ok.map(get))]; return v.length === 1 ? v[0] : null }
  const out = []
  const r = one((c) => c.route); if (r) out.push(`${r}루트`)
  const f = one((c) => c.final); if (f) out.push(ENDINGS[f].name.replace('The ', ''))
  for (const id of PICK_IDS) { const s = one((c) => c.signs[id]); if (s) out.push(`${CHOICES.find((x) => x.b.id === id).b.num}${s > 0 ? '+' : '−'}`) }
  return out.join(' ')
}

const TYPE = { narr: '나레이션', line: '대사', choice: '선택', final: '최종 선택', video: '영상', voice: '목소리', after: '엔딩 질문', result: '결과' }
const preview = (b) => (b.text ?? b.prompt?.text ?? b.src ?? b.cues?.[0]?.text ?? '').replace(/\n/g, ' ')

export function loadAdmin() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY))
    if (!saved) return null
    const cfg = { ...defaultCfg(), ...saved.cfg }
    // 문장을 고쳐 비트 수가 바뀌어도, 저장해 둔 첫 문장과 같은 비트를 우선 찾는다.
    let i = Math.min(saved.idx, BEATS.length - 1)
    if (saved.text && preview(BEATS[i]).slice(0, 20) !== saved.text) {
      const near = BEATS.map((b, j) => j).filter((j) => preview(BEATS[j]).slice(0, 20) === saved.text)
      if (near.length) i = near.sort((a, b) => Math.abs(a - saved.idx) - Math.abs(b - saved.idx))[0]
    }
    return { cfg, idx: i }
  } catch { return null }
}

export function saveAdmin(idx, cfg) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ idx, cfg, text: preview(BEATS[idx] ?? {}).slice(0, 20) })) } catch {}
}

export function AdminPanel({ state, cfg, setCfg, dispatch, instant, setInstant }) {
  const listRef = useRef(null)
  const tags = useMemo(() => BEATS.map(tagOf), [])
  const jump = (i, c = cfg) => {
    let next = satisfy(i, c)
    if (ROUTE_OF[next.final] !== next.route) { const fixed = align(next, 'final'); if (fits(i, fixed)) next = fixed }
    setCfg(next)
    dispatch({ type: 'JUMP', state: buildState(i, next) })
  }
  const change = (patch) => {
    const next = align({ ...cfg, ...patch, signs: { ...cfg.signs, ...patch.signs } }, 'route' in patch ? 'route' : 'final' in patch ? 'final' : null)
    setCfg(next)
    // 설정을 바꾸면 지금 비트에서 다시 시작한다. 지금 비트가 새 설정에서 안 나오면 가장 가까운 다음 비트로 간다.
    let i = state.idx
    while (i < BEATS.length - 1 && !fits(i, next)) i += 1
    dispatch({ type: 'JUMP', state: buildState(i, next) })
  }

  // ←·→로 현재 설정에서 재생되는 이전·다음 비트로 이동한다.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') return
      e.preventDefault(); e.stopImmediatePropagation()
      const dir = e.code === 'ArrowRight' ? 1 : -1
      let i = state.idx + dir
      while (i >= 0 && i < BEATS.length && !fits(i, cfg)) i += dir
      if (i >= 0 && i < BEATS.length) jump(i)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  useEffect(() => {
    listRef.current?.querySelector('.on')?.scrollIntoView({ block: 'nearest' })
  }, [state.idx])

  let chapter = 0
  return (
    <aside className="admin" style={{ width: PANEL_W }}>
      <div className="admin-head">
        <strong>HQ Admin</strong>
        <span>{state.idx + 1} / {BEATS.length}</span>
      </div>
      <div className="admin-cfg">
        <div className="row"><label>루트</label>
          {['A', 'B'].map((r) => <button key={r} className={cfg.route === r ? 'on' : ''} onClick={() => change({ route: r })}>{r}</button>)}
        </div>
        <div className="row"><label>엔딩</label>
          {ENDING_ORDER.map((k) => <button key={k} className={cfg.final === k ? 'on' : ''} onClick={() => change({ final: k })}>{ENDINGS[k].name.replace('The ', '')}</button>)}
        </div>
        <div className="row"><label>선택</label>
          {CHOICES.map(({ b }) => {
            const s = cfg.signs[b.id] ?? 1
            return <button key={b.id} className={s > 0 ? 'on' : 'neg'} title={b.options.find((o) => o.sign === s)?.text}
              onClick={() => change({ signs: { [b.id]: -s } })}>{b.num}{s > 0 ? '+' : '−'}</button>
          })}
        </div>
        <div className="row"><label>자막</label>
          <button className={instant ? 'on' : ''} onClick={() => setInstant(!instant)}>{instant ? '즉시 표시' : '타이핑'}</button>
          <em>← → 이동</em>
        </div>
      </div>
      <ol className="admin-list" ref={listRef}>
        {BEATS.map((b, i) => {
          if (b.type === 'route') return null
          const head = b.chapter !== chapter
          chapter = b.chapter
          const ch = CHAPTERS.find((c) => c.id === b.chapter)
          return [
            head && <li key={`h${i}`} className="admin-chapter">{b.chapter}장 · {ch?.title}</li>,
            <li key={i} className={`${i === state.idx ? 'on' : ''} ${fits(i, cfg) ? '' : 'off'}`} onClick={() => jump(i)}>
              <span className="n">{i + 1}</span>
              <span className="t">{TYPE[b.type] ?? b.type}{b.who ? ` · ${b.who}` : ''}{tags[i] && <i>{tags[i]}</i>}</span>
              <span className="p">{preview(b)}</span>
            </li>,
          ]
        })}
      </ol>
    </aside>
  )
}
