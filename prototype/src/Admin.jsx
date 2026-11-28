import { useEffect, useMemo, useRef, useState } from 'react'
import { BEATS, CHAPTERS, ENDINGS, ENDING_ORDER, FIELDS, setDrafts } from './story.js'
import { applyEdits } from './edit-core.js'

// 관리자 뷰어. 주소 끝이 #/admin일 때만 켜진다.
// 왼쪽 목차에서 비트를 누르면 그 비트로 바로 이동하고, 문장을 고쳐 저장하면 같은 자리로 돌아온다.
// 목차 위 편집 칸에서 지금 비트의 문장을 고친다. 개발 서버(npm run dev)에서는 story.js에 바로 저장하고,
// 배포본에서는 이 브라우저에 모아 두었다가 '배포'를 누를 때 GitHub에 커밋 하나로 올린다.
export const isAdmin = () => location.hash.replace(/\/$/, '') === '#/admin'
export const PANEL_W = 400
const KEY = 'hq-admin'

// ───────── 문장 편집: 자료
const DEV = import.meta.env.DEV
const ALL = FIELDS.flat().map((f) => f.text) // 문장 전체. 순번(g)이 임시 수정의 열쇠다.
const OFFSET = []
FIELDS.reduce((n, f, i) => { OFFSET[i] = n; return n + f.length }, 0)
const RI_OF = FIELDS.flatMap((f, ri) => f.map(() => ri))
// 같은 문장이 대본에 여러 번 나오면 몇 번째인지(nth)로 구분한다. total은 파일과 대조하는 데 쓴다.
const locate = (g) => ({ nth: ALL.slice(0, g).filter((t) => t === ALL[g]).length, total: ALL.filter((t) => t === ALL[g]).length })

// 임시 수정(배포본 전용). { 순번: { old, text, sent } }로 이 브라우저에 저장한다.
// old가 지금 대본과 다르면 버린다. 배포가 끝나 새 대본이 내려온 경우와 그사이 대본이 바뀐 경우가 여기에 해당한다.
const DRAFT_KEY = 'hq-admin-drafts'
const TOKEN_KEY = 'hq-admin-token'
const REPO = 'joh537874/today-hq'
const FILE = 'prototype/src/story.js'
const BRANCH = 'main'
const writeDrafts = (d) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)) } catch {} }
const DRAFTS = {}
if (!DEV && isAdmin()) {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY)) ?? {}
    for (const g in saved) if (ALL[g] === saved[g].old) DRAFTS[g] = saved[g]
    if (Object.keys(saved).length !== Object.keys(DRAFTS).length) writeDrafts(DRAFTS)
  } catch {}
  // 아래의 비트 순번 계산(CHOICES 등)보다 먼저 대본에 반영해야 한다. 문장 길이에 따라 화면 수가 달라지기 때문이다.
  if (Object.keys(DRAFTS).length) setDrafts(Object.fromEntries(Object.entries(DRAFTS).map(([g, d]) => [g, d.text])))
}

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

// 저절로 넘어가는 컷(type: 'cut')은 화살표 이동에서 건너뛴다. 머물면 곧바로 다음 비트로 넘어가기 때문이다.
const fits = (i, cfg) => BEATS[i].type !== 'route' && BEATS[i].type !== 'cut' && (!BEATS[i].when || BEATS[i].when(buildState(i, cfg)))

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

const TYPE = { narr: '나레이션', line: '대사', choice: '선택', final: '최종 선택', video: '영상', news: '뉴스 영상', voice: '목소리', name: '이름 입력', cut: '컷', call: '전화 받기', notice: '안내', clip: '영상 컷', callvid: '통화 영상', after: '엔딩 질문', result: '결과' }
const preview = (b) => (b.text ?? b.prompt?.text ?? b.src ?? b.cues?.[0]?.text ?? '').replace(/\n/g, ' ')

// ───────── 문장 편집: 화면
function Editor({ ri }) {
  const fields = FIELDS[ri] ?? []
  const [draft, setDraft] = useState({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { setDraft({}); setMsg('') }, [ri])
  if (!fields.length) return null
  const g = (k) => OFFSET[ri] + k
  const cur = (k) => DRAFTS[g(k)]?.text ?? fields[k].text
  const edits = fields.map((f, k) => ({ k, text: draft[k]?.replace(/\s+$/, '') })).filter((e) => e.text != null && e.text !== cur(e.k))
  const save = async () => {
    if (!edits.length || busy) return
    if (edits.some((e) => !e.text.trim())) { setMsg('빈 문장은 저장할 수 없습니다.'); return }
    if (!DEV) {
      // 배포본: 이 브라우저에 모아 둔다. 원래 문장으로 되돌린 것은 목록에서 뺀다.
      const next = { ...DRAFTS }
      for (const e of edits) {
        if (e.text === fields[e.k].text) delete next[g(e.k)]
        else next[g(e.k)] = { old: fields[e.k].text, text: e.text }
      }
      writeDrafts(next)
      location.reload() // 보던 비트는 saveAdmin이 기억해 둔다
      return
    }
    setBusy(true)
    try {
      const body = JSON.stringify({ edits: edits.map((e) => ({ old: fields[e.k].text, text: e.text, ...locate(g(e.k)) })) })
      const res = await fetch('/__admin/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      const out = await res.json()
      if (!res.ok) throw new Error(out.error)
      location.reload()
    } catch (e) {
      setMsg(`저장 실패: ${e.message}`)
      setBusy(false)
    }
  }
  return (
    // 입력 중의 키(Space·Enter·S·화살표)가 게임 진행으로 넘어가지 않게 막는다.
    <div className="admin-edit" onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save() } }}>
      {fields.map((f, k) => {
        const v = draft[k] ?? cur(k)
        return (
          <label key={k} className={v !== cur(k) ? 'dirty' : DRAFTS[g(k)] ? 'draft' : ''}>
            <span>{f.label}{DRAFTS[g(k)] ? (DRAFTS[g(k)].sent ? ' · 배포 중' : ' · 임시 저장됨') : ''}</span>
            <textarea value={v} rows={Math.min(6, Math.max(1, Math.ceil(v.length / 26) + (v.split('\n').length - 1)))}
              onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} spellCheck={false} />
          </label>
        )
      })}
      <div className="admin-edit-foot">
        <em>{msg || (edits.length ? `${edits.length}곳 수정됨 · ⌘Enter` : DEV ? 'story.js에 바로 저장' : '이 브라우저에 임시 저장')}</em>
        <button disabled={!edits.length || busy} onClick={() => { setDraft({}); setMsg('') }}>되돌리기</button>
        <button className="on" disabled={!edits.length || busy} onClick={save}>{busy ? '저장 중' : DEV ? '저장' : '임시 저장'}</button>
      </div>
    </div>
  )
}

// GitHub API는 파일 내용을 base64로 주고받는다. 한글이 깨지지 않게 UTF-8 바이트로 바꿔서 다룬다.
const decode64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)))
const encode64 = (text) => {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}
const short = (t, n = 30) => { const x = t.replace(/\n/g, ' '); return x.length > n ? `${x.slice(0, n)}…` : x }

// 임시 수정 목록과 배포(배포본 전용). 쌓인 수정을 커밋 하나로 main에 올리면 GitHub Pages가 다시 배포한다.
function Drafts({ onJump }) {
  const ids = Object.keys(DRAFTS).map(Number).sort((a, b) => a - b)
  const [, redraw] = useState(0)
  const [token, setToken] = useState(() => { try { return localStorage.getItem(TOKEN_KEY) ?? '' } catch { return '' } })
  const [ask, setAsk] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  if (!ids.length) return null
  const pending = ids.filter((g) => !DRAFTS[g].sent)
  const drop = (list) => {
    const next = { ...DRAFTS }
    for (const g of list) delete next[g]
    writeDrafts(next)
    location.reload()
  }
  const deploy = async () => {
    if (busy || !pending.length) return
    const key = token.trim()
    if (!key) { setAsk(true); setMsg(''); return }
    setBusy(true); setMsg('GitHub에 올리는 중…')
    try {
      const api = `https://api.github.com/repos/${REPO}/contents/${FILE}`
      const headers = { Authorization: `Bearer ${key}`, Accept: 'application/vnd.github+json' }
      const fail = (r) => {
        if (r.status === 401) { try { localStorage.removeItem(TOKEN_KEY) } catch {} setAsk(true); return new Error('토큰이 올바르지 않습니다.') }
        if (r.status === 403 || r.status === 404) { setAsk(true); return new Error('토큰에 이 저장소의 Contents 쓰기 권한이 없습니다.') }
        if (r.status === 409) return new Error('그사이 파일이 바뀌었습니다. 다시 시도하세요.')
        return new Error(`GitHub 응답 ${r.status}`)
      }
      const got = await fetch(`${api}?ref=${BRANCH}`, { headers, cache: 'no-store' })
      if (!got.ok) throw fail(got)
      const file = await got.json()
      const next = applyEdits(decode64(file.content), pending.map((g) => ({ old: DRAFTS[g].old, text: DRAFTS[g].text, ...locate(g) })))
      const message = `어드민 문장 수정 ${pending.length}건\n\n${pending.map((g) => `- ${short(DRAFTS[g].old, 40)} → ${short(DRAFTS[g].text, 40)}`).join('\n')}`
      const put = await fetch(api, { method: 'PUT', headers, body: JSON.stringify({ message, content: encode64(next), sha: file.sha, branch: BRANCH }) })
      if (!put.ok) throw fail(put)
      try { localStorage.setItem(TOKEN_KEY, key) } catch {}
      for (const g of pending) DRAFTS[g].sent = true
      writeDrafts(DRAFTS)
      setAsk(false)
      setMsg(`${pending.length}건을 올렸습니다. 약 1분 뒤 새로 고침하면 모두에게 반영됩니다.`)
    } catch (e) {
      setMsg(`배포 실패: ${e.message}`)
    }
    setBusy(false)
    redraw((n) => n + 1)
  }
  return (
    <div className="admin-drafts" onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && ask) deploy() }}>
      <strong>임시 수정 {ids.length}건{pending.length < ids.length ? ` · ${ids.length - pending.length}건 배포 중` : ''}</strong>
      <ul>
        {ids.map((g) => (
          <li key={g} className={DRAFTS[g].sent ? 'sent' : ''} onClick={() => onJump(RI_OF[g])} title="이 문장으로 이동">
            <del>{short(DRAFTS[g].old, 60)}</del>
            <ins>{short(DRAFTS[g].text, 60)}</ins>
            {!DRAFTS[g].sent && <button title="이 수정 취소" onClick={(e) => { e.stopPropagation(); drop([g]) }}>×</button>}
          </li>
        ))}
      </ul>
      {ask && <>
        <p>GitHub 토큰을 붙여 넣으세요. today-hq 저장소의 Contents 읽기·쓰기 권한이 필요하며, 이 브라우저에만 저장됩니다.</p>
        <input type="password" value={token} placeholder="github_pat_…" autoComplete="off" onChange={(e) => setToken(e.target.value)} />
      </>}
      {msg && <p>{msg}</p>}
      <div className="admin-edit-foot">
        <em>{token && !ask && <a onClick={() => setAsk(true)}>토큰 변경</a>}</em>
        <button disabled={busy || !pending.length} onClick={() => drop(pending)}>전체 취소</button>
        <button className="on" disabled={busy || !pending.length} onClick={deploy}>{busy ? '배포 중' : `${pending.length}건 배포`}</button>
      </div>
    </div>
  )
}

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
      if (e.target?.closest?.('.admin-edit, .admin-drafts')) return // 문장을 고치는 중에는 커서 이동으로 쓴다
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
      <Editor ri={BEATS[state.idx]?.ri} />
      {!DEV && <Drafts onJump={(ri) => jump(BEATS.findIndex((b) => b.ri === ri))} />}
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
