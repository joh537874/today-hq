import React, { useEffect, useReducer, useRef, useState } from 'react'
import { BEATS, CHAPTERS, ENDINGS, ENDING_ORDER, WHO_EN, CHOICE_LABELS, CHOICE_MAP } from './story.js'
import { useTypewriter } from './ui.jsx'
import { setBgm, setAmb, setVib, sfx, stopAll, setMuted, isMuted, ui } from './sound.js'
import { isAdmin, PANEL_W, AdminPanel, buildState, defaultCfg, loadAdmin, saveAdmin } from './Admin.jsx'
import { setInstant as setTypeInstant } from './ui.jsx'

const ADMIN = isAdmin()

const BASE = import.meta.env.BASE_URL

// @property를 JS로 등록 (Vite CSS 처리 우회)
try { CSS.registerProperty({ name: '--trace-angle', syntax: '<angle>', inherits: false, initialValue: '0deg' }) } catch (e) {}
const cut = (name) => `${BASE}cut/${name}.jpg`
const PASSIVE = ['narr', 'line']
const TITLE_BGM = 'night'

const initial = { started: false, idx: 0, ai: 0, hq: 0, picks: [], route: null, final: null, mine: null, history: [] }
// 엔딩 영상의 첫 비트. 다른 결말을 고르면 여기서부터 그 결말을 재생한다.
// 이름에 따라 자막 페이지 수가 달라지므로 그때그때 찾는다.
const endingStart = () => BEATS.findIndex((b) => b.chapter === 5)

// from 위치부터 조건(when)이 맞는 첫 비트로 이동한다. route 비트에서 4장 루트를 정한다.
function enter(state, from) {
  const s = { ...state }
  let i = from
  while (i < BEATS.length) {
    const b = BEATS[i]
    if (b.type === 'route') {
      // AI축 합계의 부호. 합계가 0이면 마지막 AI축 선택 ⑧을 따른다.
      const last = [...s.picks].reverse().find((p) => p.axis === 'ai')
      // 관리자 화면에서 루트를 정해 두었으면 그 루트를 쓴다.
      s.route = s.forceRoute ?? ((s.ai !== 0 ? Math.sign(s.ai) : last?.sign ?? 1) > 0 ? 'A' : 'B')
      i += 1
      continue
    }
    if (b.when && !b.when(s)) { i += 1; continue }
    break
  }
  s.idx = i
  return s
}

const snap = ({ history, ...rest }) => rest

function reducer(state, a) {
  switch (a.type) {
    case 'START': return enter({ ...initial, started: true }, 0)
    case 'RESTART': return initial
    case 'BACK': {
      // 저절로 넘어가는 컷(type: 'cut')에는 되돌아가 멈추지 않고 그 앞까지 간다.
      let h = state.history
      while (h.length > 1 && BEATS[h[h.length - 1].idx]?.type === 'cut') h = h.slice(0, -1)
      if (!h.length) return state
      return { ...h[h.length - 1], history: h.slice(0, -1) }
    }
    case 'NEXT': return enter({ ...state, history: [...state.history, snap(state)] }, state.idx + 1)
    case 'CHOOSE': {
      const beat = BEATS[state.idx]
      const opt = beat.options[a.index]
      return enter({
        ...state,
        history: [...state.history, snap(state)],
        ai: state.ai + (beat.axis === 'ai' ? opt.sign : 0),
        hq: state.hq + (beat.axis === 'hq' ? opt.sign : 0),
        picks: [...state.picks, { id: beat.id, num: beat.num, axis: beat.axis, sign: opt.sign, prompt: beat.prompt, text: opt.text }],
      }, state.idx + 1)
    }
    case 'FINAL': {
      const beat = BEATS[state.idx]
      const opt = beat.options[a.index]
      return enter({
        ...state,
        history: [...state.history, snap(state)],
        final: opt.key,
        mine: opt.key,
        picks: [...state.picks, { id: 'final', num: '최종', axis: 'final', prompt: null, text: opt.text }],
      }, state.idx + 1)
    }
    case 'SKIP': {
      // 남은 자막을 건너뛰고 다음 선택지(또는 엔딩 질문 화면)까지 간다.
      let s = { ...state, history: [...state.history, snap(state)] }
      do { s = enter(s, s.idx + 1) } while (s.idx < BEATS.length && PASSIVE.includes(BEATS[s.idx].type))
      return s
    }
    case 'JUMP': return a.state
    case 'REPLAY': return enter({ ...state, history: [...state.history, snap(state)], final: a.key }, endingStart())
    case 'JUMP_ENDING': {
      // S키 어드민 전용: 선택 8개를 첫 번째 옵션으로 채우고 지정된 엔딩 결과 화면으로 바로 간다.
      const mockPicks = Object.entries(CHOICE_MAP).map(([id, b]) => ({
        id, num: b.num, axis: b.axis, sign: b.options[0].sign, prompt: b.prompt, text: b.options[0].text,
      }))
      mockPicks.push({ id: 'final', num: '최종', axis: 'final', prompt: null, text: '' })
      const resultIdx = BEATS.findIndex((b) => b.type === 'result')
      return { ...initial, started: true, idx: resultIdx, final: a.key, mine: a.key, picks: mockPicks, route: 'A', history: [] }
    }
    default: return state
  }
}

class ErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return <div style={{ color: 'red', padding: 40, fontSize: 24 }}>ERROR: {this.state.error.message}<br /><pre style={{ fontSize: 14 }}>{this.state.error.stack}</pre></div>
    return this.props.children
  }
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>
}

function AppInner() {
  // 관리자 화면에서는 마지막으로 보던 비트에서 다시 시작한다.
  const boot = ADMIN ? loadAdmin() : null
  const [cfg, setCfg] = useState(() => boot?.cfg ?? defaultCfg())
  const [state, dispatch] = useReducer(reducer, initial, () => (boot ? buildState(boot.idx, boot.cfg) : initial))
  const [instant, setInstant] = useState(false)
  setTypeInstant(ADMIN && instant)
  useEffect(() => { if (ADMIN && state.started) saveAdmin(state.idx, cfg) }, [state.idx, cfg])
  useEffect(() => {
    const onHash = () => { if (isAdmin() !== ADMIN) location.reload() }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const { scale, x, y } = useStageScale(ADMIN ? PANEL_W : 0)
  const beat = BEATS[state.idx]
  if (state.started && !beat) return <div className="viewport"><p style={{ color: 'red', padding: 40 }}>beat {state.idx} not found (총 {BEATS.length}개)</p></div>

  // 소리 끄기. 선택은 이 브라우저에 기억한다(저장이 막혀 있어도 동작한다).
  const [muted, setMutedState] = useState(() => { try { return localStorage.getItem('hq-muted') === '1' } catch { return false } })
  useEffect(() => {
    setMuted(muted)
    try { localStorage.setItem('hq-muted', muted ? '1' : '0') } catch {}
  }, [muted])
  useEffect(() => {
    const onKey = (e) => { if (e.code === 'KeyM' && !isTyping(e)) setMutedState((m) => !m) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 장면이 바뀌면 그 장면의 배경음·환경음으로 맞추고, 효과음이 있으면 한 번 낸다.
  // 오프닝 영상·검은 화면 나레이션·엔딩 화면에는 따로 깔지 않는다(컷에 bgm이 없으면 꺼진다).
  useEffect(() => {
    if (!state.started) {
      stopAll()
      // 타이틀 배경음. 브라우저는 첫 입력 전에는 소리를 막으므로, 첫 클릭·키 입력에 맞춰 서서히 올린다.
      // 시작 뒤 안내 화면(notice)도 같은 곡이라 끊기지 않고 이어지다가, 오프닝 영상에서 줄어든다.
      const on = () => setBgm(TITLE_BGM)
      window.addEventListener('pointerdown', on, { once: true })
      window.addEventListener('keydown', on, { once: true })
      return () => { window.removeEventListener('pointerdown', on); window.removeEventListener('keydown', on) }
    }
    setBgm(beat.bgm)
    setAmb(beat.amb)
    setVib(beat.vib ? 'vibrate' : null)
    sfx(beat.sfx)
  }, [state.started, state.idx])

  // 이름 입력 중에는 ← 키를 글자 지우기로 쓰므로 버튼을 두지 않는다. 영상·나레이션은 되돌리기가 없다.
  const canBack = state.started && (state.history.length > 0 || beat.type === 'result') && !['name', 'video', 'voice', 'notice', 'news'].includes(beat.type)
  return (
    <>
    {ADMIN && <AdminPanel state={state} cfg={cfg} setCfg={setCfg} dispatch={dispatch} instant={instant} setInstant={setInstant} />}
    <div className="viewport" style={ADMIN ? { left: PANEL_W } : undefined}>
      <div className="stage" style={{ left: x, top: y, transform: `scale(${scale})` }}>
        {!state.started && <Title onStart={() => dispatch({ type: 'START' })} onSkip={() => dispatch({ type: 'JUMP_ENDING', key: 'adapter' })} />}
        {state.started && beat.type === 'after' && <After key={state.final} state={state} dispatch={dispatch} />}
        {state.started && beat.type === 'result' && <Result key={state.final} state={state} dispatch={dispatch} />}
        {state.started && beat.type === 'video' && <OpeningVideo key={state.idx} beat={beat} dispatch={dispatch} muted={muted} />}
        {state.started && beat.type === 'news' && <NewsVideo key={state.idx} beat={beat} dispatch={dispatch} muted={muted} />}
        {state.started && beat.type === 'notice' && <Notice key={state.idx} beat={beat} dispatch={dispatch} />}
        {state.started && beat.type === 'voice' && <VoiceOver key={state.idx} beat={beat} dispatch={dispatch} muted={muted} />}
        <div className="top-ctrl">
          {/* 되돌리기. 화면마다 ← 키 처리가 다르므로(결과 화면은 안쪽 단계부터 되돌린다) 같은 키 입력을 보낸다. */}
          {canBack && (
            <button className="top-btn back" onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })) }} aria-label="뒤로 가기">
              <span>Back</span><em>←</em>
            </button>
          )}
          <button className={`top-btn mute ${muted ? 'off' : ''}`} onClick={(e) => { e.stopPropagation(); setMutedState((m) => !m) }} aria-label={muted ? '소리 켜기' : '소리 끄기'}>
            <span>{muted ? 'Sound Off' : 'Sound On'}</span><em>M</em>
          </button>
        </div>
        {state.started && !['after', 'result', 'video', 'voice', 'name', 'notice', 'news'].includes(beat.type) && <Film state={state} beat={beat} dispatch={dispatch} />}
      </div>
      <Cursor scale={scale} minX={ADMIN ? PANEL_W : 0} />
    </div>
    </>
  )
}

// 1920×1080 무대를 창에 맞춘다. 무대 높이와 위치를 정수 픽셀에 맞춰 가장자리에 반 픽셀짜리 줄이 생기지 않게 한다.
function useStageScale(offset = 0) {
  const [fit, setFit] = useState({ scale: 1, x: 0, y: 0 })
  useEffect(() => {
    const update = () => {
      const W = window.innerWidth - offset
      const H = window.innerHeight
      const h = Math.floor(Math.min(W / 1920, H / 1080) * 1080)
      const scale = h / 1080
      setFit({ scale, x: Math.round((W - 1920 * scale) / 2), y: Math.round((H - h) / 2) })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return fit
}

// 입력란에서 글자를 치는 중이면 단축키를 쓰지 않는다.
const isTyping = (e) => e.target instanceof HTMLInputElement

// 키보드 공통 처리. Space·Enter로 진행, 숫자로 선택, ←·Backspace로 되돌리기.
function useKeys(handler) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || isTyping(e)) return
      if (e.code === 'Space' || e.code === 'Enter') e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
}

const PRESS_MS = 1000
// 누르면 동작은 바로 실행하고, 버튼의 빛 효과(테두리 트레이스·플래시)만 1초 동안 남긴다.
// 효과가 끝나기를 기다렸다가 실행하면 빠르게 연달아 누를 때 앞 입력이 취소되어 넘어가지 않는다.
function usePress() {
  const [pressed, setPressed] = useState(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const press = (id, fn) => {
    setPressed(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPressed(null), PRESS_MS)
    fn()
  }
  return [pressed, press]
}

// 마우스로 누른 경우 그 자리를 원이 퍼지는 중심으로 정한다. 키보드로 누르면 버튼 가운데에서 퍼진다.
function origin(e) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  if (!e.clientX && !e.clientY) return
  el.style.setProperty('--x', `${((e.clientX - r.left) / r.width) * 100}%`)
  el.style.setProperty('--y', `${((e.clientY - r.top) / r.height) * 100}%`)
  setTimeout(() => { el.style.removeProperty('--x'); el.style.removeProperty('--y') }, PRESS_MS + 100)
}

// 자막이 다 찍힌 뒤 다음으로 넘어가기까지의 여유(ms)
const AUTO_MS = 500
// 선택지를 고른 뒤 다음 장면으로 넘어가기까지의 시간(ms)
const CHOICE_MS = 900

/* ───────── 화면 공통 요소 */

// 사진 한 장이 화면 전체를 덮는다. 컷이 바뀌면 이전 컷 위로 새 컷이 서서히 겹쳐 올라온다.
function Photo({ name }) {
  const [layers, setLayers] = useState([name])
  useEffect(() => {
    setLayers((l) => (l[l.length - 1] === name ? l : [...l.slice(-1), name]))
    const t = setTimeout(() => setLayers((l) => l.slice(-1)), 1000)
    return () => clearTimeout(t)
  }, [name])
  return layers.map((n, i) => (
    <div key={n} className={`photo ${i === layers.length - 1 && layers.length > 1 ? 'photo-new' : ''}`} style={{ backgroundImage: `url(${cut(n)})` }}>
      {/* 거실 TV의 뉴스 화면은 사진 한 장처럼 사진과 함께 나타나야 하므로 같은 층에 넣는다 */}
      {n === 'p-call-bg' && <TvStill />}
    </div>
  ))
}

// 컷 위에 까는 배경 영상. 한 번 재생하고 마지막 장면에서 멈춘다. 소리는 장면 배경음을 쓰므로 끈다.
// 자막이 여러 쪽으로 나뉘어도 같은 영상이면 처음부터 다시 틀지 않는다(key가 영상 경로).
// 자막 없는 영상 컷(type: 'clip')은 영상이 끝나면 다음으로 넘어간다.
function BgVideo({ src, onEnd }) {
  return <video className="photo photo-video" src={`${BASE}${src}`} autoPlay muted playsInline preload="auto" onEnded={onEnd} />
}

// 좌상단 "01 | Prologue"
function ChapterTag({ chapter }) {
  const c = CHAPTERS[chapter - 1]
  return (
    <div className="chapter-tag">
      <span>{String(c.id).padStart(2, '0')}</span>
      <img src={`${BASE}ui/divider.svg`} alt="" width="1" height="18" />
      <span>{c.en}</span>
    </div>
  )
}

function ContinueButton({ label = '계속하기', hint = 'Space', ghost = false, onClick, on = false }) {
  return (
    <button className={`continue ${ghost ? 'ghost' : ''} ${on ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); origin(e); onClick() }}>
      <span>{label}</span><em>{hint}</em>
    </button>
  )
}

// 하단 자막. 내레이션은 가운데 또는 좌측, 대사는 화자 이름과 함께 좌측에 놓인다.
function Caption({ item, typing }) {
  if (!item) return null
  const text = typing ? typing.text : item.text
  const center = item.type === 'narr' && item.center
  return (
    <div className={`caption ${center ? 'center' : 'left'} ${item.type}`}>
      {item.type === 'line' && (
        <div className="who">
          <span>{item.who}</span>
          {(item.whoEn ?? WHO_EN[item.who]) && <em>{item.whoEn ?? WHO_EN[item.who]}</em>}
          {item.via && <em>· {item.via}</em>}
        </div>
      )}
      <p className="ko"><Sentences full={item.text} shown={text.length} /></p>
    </div>
  )
}

// 자막 줄 나눔. story.js에서 넣은 '\n'을 기준으로 줄을 나눈다. 조각 길이의 합은 원문 길이와 같다.
function splitSentences(t) {
  const out = []
  let last = 0
  for (let i = 0; i < t.length; i++) if (t[i] === '\n') { out.push(t.slice(last, i + 1)); last = i + 1 }
  if (last < t.length) out.push(t.slice(last))
  return out
}

// 줄마다 한 줄씩 놓는다. 타이핑 중에는 아직 찍히지 않은 글자를 투명하게 남겨 줄 배치가 흔들리지 않게 한다.
function Sentences({ full, shown = full.length }) {
  let offset = 0
  return splitSentences(full).map((s, i) => {
    const seg = s.trimEnd()
    const v = Math.max(0, Math.min(seg.length, shown - offset))
    offset += s.length
    return (
      <span className="sent" key={i}>
        {seg.slice(0, v)}
        {v < seg.length && <span className="ghost">{seg.slice(v)}</span>}
      </span>
    )
  })
}

// 휴미터 알림. 대본의 '(▼9) · 관리국 기준 갱신' 같은 화면 표시를 대사 대신 화면 우상단에 띄운다.
function Hud({ hq, delta, note }) {
  return (
    <div className="hud">
      <span className="hud-label">HQ</span>
      <b>{hq}</b>
      {delta ? <span className={`hud-delta ${delta < 0 ? 'down' : 'up'}`}>{delta < 0 ? '▼' : '▲'}{Math.abs(delta)}</span> : null}
      {note && <em>{note}</em>}
    </div>
  )
}

/* ───────── 영상 (버튼 없이 재생만 한다. 오프닝·재이 영상은 자막이 영상에 들어 있고,
   줄리안 영상은 주인공 이름이 들어가므로 cues로 자막을 얹는다) */

function OpeningVideo({ beat, dispatch, muted }) {
  const ref = useRef(null)
  const [cue, setCue] = useState(-1)
  const next = () => dispatch({ type: 'NEXT' })
  useEffect(() => {
    const v = ref.current
    // 소리 재생이 막히면 음소거로라도 재생한다.
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}) })
    if (!beat.cues) return
    // 영상 시간에 맞춰 자막을 바꾼다.
    let raf = 0
    const tick = () => {
      const t = v.currentTime
      setCue(beat.cues.findIndex((c) => t >= c.at && t < c.to))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const c = cue >= 0 ? beat.cues[cue] : null
  useKeys((e) => {
    if (e.code === 'Space' || e.code === 'Enter') next()
    if (e.code === 'KeyS') dispatch({ type: 'JUMP_ENDING', key: 'adapter' })
  })
  return (
    <div className="opening" onClick={next}>
      <video ref={ref} src={`${BASE}${beat.src}`} playsInline preload="auto" muted={muted} onEnded={next} />
      {c && (
        <div className="video-cue">
          <p className="ko">{c.text.split('\n').map((l, i) => <span key={i}>{l}</span>)}</p>
        </div>
      )}
    </div>
  )
}

/* ───────── 1장 뉴스. 화면 전체로 시작해 세 번째 문장에서 거실(p-call-bg) 벽걸이 TV로 줌아웃한다.
   거실 사진과 TV 화면을 따로 움직인다. 사진은 확대·이동만, TV 화면은 네 꼭짓점을 직접 정해 원근을 맞춘다. */

// 거실 사진(1920×1080) 속 TV 화면의 네 꼭짓점(좌상·우상·우하·좌하). 사진을 확대해 측정했다.
const TV_QUAD = [[456, 403], [781, 423], [781, 600], [455, 605]]
// 줌아웃 시작 때 화면을 꽉 채우는 TV 안쪽의 16:9 사각형. 여기서 시작해 TV_QUAD로 옮겨 간다.
const TV_R0 = { x: 461, y: 423, w: 314, h: 176.6 }
// 두 번째 문장 끝(15.0초) 무렵 시작해 6초 동안 천천히 빠진다. 영상(22초)이 끝나기 약 1초 전에 TV에 자리 잡는다.
const NEWS_ZOOM_AT = 14.8 // 줌아웃 시작(영상 초)
const NEWS_ZOOM_MS = 6000

// 1920×1080 요소를 네 꼭짓점에 맞추는 원근 변환(matrix3d). 단위 정사각형 → 사각형 사영 변환을 쓴다.
function quadMatrix(q, w = 1920, h = 1080) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3
  const den = dx1 * dy2 - dx2 * dy1
  const g = (dx3 * dy2 - dx2 * dy3) / den
  const k = (dx1 * dy3 - dx3 * dy1) / den
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3
  const d = y1 - y0 + g * y1, e = y3 - y0 + k * y3
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`
}
// 처음엔 천천히, 가운데서 빠르게 빠졌다가, 끝에서 길게 감속한다.
// 앞 35% 구간에서 절반을 가속해 빠지고, 남은 절반은 65% 구간에 걸쳐 감속한다. 두 식은 p=0.35에서 0.5로 만난다.
const zoomEase = (p) => (p < 0.35 ? 0.5 * Math.pow(p / 0.35, 2.2) : 1 - 0.5 * Math.pow(1 - (p - 0.35) / 0.65, 3.2))

// 뉴스 화면 위의 생방송 표시와 제목 띠. 영상 재생 중과 거실 TV 정지 화면이 같은 것을 쓴다.
function NewsUi() {
  return (
    <>
      <div className="news-live"><i />LIVE<span>2069.03.14 22:41</span></div>
      <div className="news-lower"><em>BREAKING</em><b>AI NOW SCORES MORE HUMAN THAN HUMANS</b></div>
    </>
  )
}

// 거실 컷(p-call-bg)의 TV에 새 뉴스 화면을 얹는다. 사진 속 TV에는 예전 앵커가 그려져 있기 때문이다.
// 뉴스 영상의 마지막 프레임(cut/news-still.jpg)을 써서, 영상이 끝나고 넘어가도 TV 화면이 이어진다.
const TV_MATRIX = quadMatrix(TV_QUAD)
function TvStill() {
  return (
    <div className="news-tv still" style={{ transform: TV_MATRIX, filter: 'brightness(0.85)' }}>
      <img src={cut('news-still')} alt="" />
      <NewsUi />
    </div>
  )
}

function NewsVideo({ beat, dispatch, muted }) {
  const ref = useRef(null)
  const room = useRef(null)
  const tv = useRef(null)
  const [cue, setCue] = useState(-1)
  const [zoomed, setZoomed] = useState(false)
  const next = () => dispatch({ type: 'NEXT' })
  useEffect(() => {
    const v = ref.current
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}) })
    const c = [TV_R0.x + TV_R0.w / 2, TV_R0.y + TV_R0.h / 2]
    const S0 = 1920 / TV_R0.w
    const r0 = [[TV_R0.x, TV_R0.y], [TV_R0.x + TV_R0.w, TV_R0.y], [TV_R0.x + TV_R0.w, TV_R0.y + TV_R0.h], [TV_R0.x, TV_R0.y + TV_R0.h]]
    let raf = 0
    let started = false
    const tick = () => {
      if (!room.current || !tv.current) return // 화면이 바뀐 직후의 마지막 프레임
      const t = v.currentTime
      setCue(beat.cues.findIndex((q) => t >= q.at && t < q.to))
      const p = Math.min(1, Math.max(0, (t - NEWS_ZOOM_AT) / (NEWS_ZOOM_MS / 1000)))
      const e = p === 0 ? 0 : p === 1 ? 1 : zoomEase(p)
      // 거실 사진: 배율을 로그 척도로 줄여 일정한 속도로 멀어지는 느낌을 낸다. 중심은 TV에서 화면 가운데로 옮겨 간다.
      const s = Math.pow(S0, 1 - e)
      const cx = 960 + (c[0] - 960) * e, cy = 540 + (c[1] - 540) * e
      const toScreen = ([x, y]) => [(x - c[0]) * s + cx, (y - c[1]) * s + cy]
      room.current.style.transform = `translate(${cx - c[0] * s}px, ${cy - c[1] * s}px) scale(${s})`
      tv.current.style.transform = quadMatrix(r0.map((pt, i) => toScreen([pt[0] + (TV_QUAD[i][0] - pt[0]) * e, pt[1] + (TV_QUAD[i][1] - pt[1]) * e])))
      tv.current.style.filter = `brightness(${1 - 0.15 * e})`
      // TV 속 소리처럼 들리게 줄이고, 거실 음악과 바깥 소리를 올린다.
      if (!v.muted) v.volume = 1 - 0.45 * e
      if (p > 0 && !started) { started = true; setZoomed(true); setBgm('living'); setAmb('street') }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  useKeys((e) => {
    if (e.code === 'Space' || e.code === 'Enter') next()
    if (e.key === 'ArrowLeft' || e.key === 'Backspace') dispatch({ type: 'BACK' })
  })
  const c = cue >= 0 ? beat.cues[cue] : null
  return (
    <div className="news" onClick={next}>
      <div className="news-room" ref={room} style={{ backgroundImage: `url(${cut(beat.img)})` }} />
      <div className="news-tv" ref={tv}>
        <video ref={ref} src={`${BASE}${beat.src}`} playsInline preload="auto" muted={muted} onEnded={() => setTimeout(next, 400)} />
        <NewsUi />
      </div>
      <div className="news-dim" />
      {zoomed && <ChapterTag chapter={1} />}
      {c && (
        <div className="video-cue" key={cue}>
          <p className="ko">{c.text.split('\n').map((l, i) => <span key={i}>{l}</span>)}</p>
        </div>
      )}
    </div>
  )
}

// 영상이 끝난 뒤 검은 화면에 나레이션 목소리와 가운데 자막만 이어진다. 배경음은 음원에 섞여 있다.
function VoiceOver({ beat, dispatch, muted }) {
  const ref = useRef(null)
  const [i, setI] = useState(-1)
  const next = () => dispatch({ type: 'NEXT' })
  useEffect(() => {
    const a = ref.current
    let raf = 0
    let start = performance.now()
    let blocked = false
    a.play().catch(() => { blocked = true; start = performance.now() })
    // 음원 시간에 맞춰 자막을 바꾼다. 재생이 막힌 경우에는 시계로 대신한다.
    const tick = () => {
      const t = blocked ? (performance.now() - start) / 1000 : a.currentTime
      let k = -1
      beat.cues.forEach((c, j) => { if (t >= c.at) k = j })
      setI(k)
      if (blocked && t > beat.cues[beat.cues.length - 1].at + 6) { next(); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); a.pause() }
  }, [])
  useKeys((e) => {
    if (e.code === 'Space' || e.code === 'Enter') next()
    if (e.code === 'KeyS') dispatch({ type: 'JUMP_ENDING', key: 'adapter' })
  })
  const c = i >= 0 ? beat.cues[i] : null
  return (
    <div className="voice" onClick={next}>
      <audio ref={ref} src={`${BASE}${beat.audio}`} preload="auto" muted={muted} onEnded={() => setTimeout(next, 600)} />
      {c && (
        <div className="voice-cue" key={i}>
          <p className="ko">{c.text}</p>
        </div>
      )}
    </div>
  )
}

// 검은 화면 안내. 정해진 시간이 지나면 넘어가고, 클릭·Space·Enter로 바로 넘길 수 있다.
function Notice({ beat, dispatch }) {
  const next = () => dispatch({ type: 'NEXT' })
  useEffect(() => {
    const t = setTimeout(next, beat.ms ?? 5000)
    return () => clearTimeout(t)
  }, [])
  useKeys((e) => { if (e.code === 'Space' || e.code === 'Enter') next() })
  return (
    <div className="notice" onClick={next}>
      <div className="notice-body">
        <h2>{beat.title}</h2>
        <p>{beat.lines.map((l, i) => <span key={i}>{l}</span>)}</p>
      </div>
    </div>
  )
}

/* ───────── 타이틀 (Figma 2227) */

function Title({ onStart, onSkip }) {
  const [pressed, press] = usePress()
  const start = () => press('start', onStart)
  useKeys((e) => {
    if (e.code === 'Space' || e.code === 'Enter') start()
    if (e.code === 'KeyS') onSkip()
  })
  return (
    <div className="title">
      <div className="photo" style={{ backgroundImage: `url(${BASE}ui/title.jpg)` }} />
      <div className="title-bottom">
        <div className="title-text">
          <span className="eyebrow">Interactive Story Film</span>
          <div className="title-stack">
            <h1>Human Quotient</h1>
            <p>우리는 얼마나 인간다운가요?</p>
          </div>
        </div>
        <button className={`pill ${pressed === 'start' ? 'on' : ''}`} onClick={(e) => { origin(e); start() }}>시작하기</button>
      </div>
    </div>
  )
}

/* ───────── 장면 (Figma 2245 · 2249 · 2251) */

function Film({ state, beat, dispatch }) {
  const passive = PASSIVE.includes(beat.type)
  const typing = useTypewriter(passive ? beat.text : '', state.idx)
  const [pressed, press] = usePress()

  // 대사와 내레이션을 귀로 구분한다. 대사는 시작할 때 '핑' 한 번, 글자가 찍히는 동안 세 글자마다 작게 '타닥'.
  // 같은 사람의 대사가 여러 쪽으로 이어지면 첫 쪽에서만 '핑'을 낸다. 내레이션에는 소리를 붙이지 않는다.
  const isLine = beat.type === 'line'
  useEffect(() => {
    const prev = BEATS[state.idx - 1]
    if (isLine && !(prev?.type === 'line' && prev.who === beat.who)) ui.ping()
  }, [state.idx])
  const shown = typing.text.length
  useEffect(() => {
    if (!isLine || typing.done || shown === 0 || shown % 3) return
    if (beat.text[shown - 1]?.trim()) ui.tick()
  }, [shown])

  const advance = () => {
    if (beat.type === 'clip') { dispatch({ type: 'NEXT' }); return }
    if (!passive) return
    if (!typing.done) typing.finish()
    else press('next', () => dispatch({ type: 'NEXT' }))
  }
  // 같은 컷 안의 자막(대사·내레이션)은 다 찍힌 뒤 0.5초 있다가 스스로 넘어간다.
  // 컷·선택·장이 바뀌기 직전의 자막만 '계속하기'를 눌러야 넘어간다.
  const next = BEATS[enter(state, state.idx + 1).idx]
  const cutEnds = !next || (next.type !== 'narr' && next.type !== 'line') || next.img !== beat.img || next.chapter !== beat.chapter
  const hold = passive && cutEnds
  // 자동 넘김 제거 — 항상 계속하기를 눌러야 다음으로 넘어간다
  // 고른 선택지는 흰색으로 남고 나머지는 흐려진 뒤, 잠깐 머물렀다가 다음으로 넘어간다.
  const [chosen, setChosen] = useState(null)
  useEffect(() => setChosen(null), [state.idx])
  const pick = (index) => {
    if (chosen !== null) return
    setChosen(index)
    sfx('dong')
    setTimeout(() => dispatch({ type: beat.type === 'final' ? 'FINAL' : 'CHOOSE', index }), CHOICE_MS)
  }

  useKeys((e) => {
    if (e.code === 'Space' || e.code === 'Enter') advance()
    if ((e.key === 'ArrowLeft' || e.key === 'Backspace') && state.history.length) dispatch({ type: 'BACK' })
    // S키: 어드민용 — adapter 엔딩으로 바로 이동
    if (e.code === 'KeyS') {
      dispatch({ type: 'JUMP_ENDING', key: 'adapter' })
    }
    const i = Number(e.key) - 1
    if ((beat.type === 'choice' || beat.type === 'final') && beat.options[i]) pick(i)
  })

  // 컷만 잠깐 보여 주는 비트는 정해진 시간 뒤 저절로 넘어간다.
  useEffect(() => {
    if (beat.type !== 'cut') return
    const t = setTimeout(() => dispatch({ type: 'NEXT' }), beat.ms ?? 700)
    return () => clearTimeout(t)
  }, [state.idx])

  const isFinal = beat.type === 'final'
  return (
    <div className="film" onClick={beat.type === 'clip' ? advance : undefined}>
      <Photo name={beat.img} />
      {beat.vid && <BgVideo key={beat.vid} src={beat.vid} onEnd={beat.type === 'clip' ? () => setTimeout(() => dispatch({ type: 'NEXT' }), 600) : undefined} />}
      {!isFinal && <ChapterTag chapter={beat.chapter} />}

      {beat.hud && <Hud {...beat.hud} />}
      {(beat.type === 'call' || beat.call) && <CallCard key="call" beat={beat} idx={state.idx} dispatch={dispatch} />}
      {(beat.type === 'choice' || isFinal) && <Options final={isFinal} options={beat.options} chosen={chosen} onPick={pick} />}

      {/* 지시문(내레이션) 형태의 선택 질문은 자막으로 띄우지 않고 화면(컷)으로 보여 준다 */}
      {!isFinal && (passive || beat.prompt?.type === 'line') && (
        <footer className="caption-bar">
          <Caption key={state.idx} item={passive ? beat : beat.prompt} typing={passive ? typing : null} />
          {passive && (
            <div className="caption-actions">
              <ContinueButton on={pressed === 'next'} onClick={advance} />
            </div>
          )}
        </footer>
      )}
    </div>
  )
}

/* ───────── 클로이의 전화 (Figma 3233:1078 수신 · 3233:1089 밀어서 받기 · 3233:1100 통화 중)
   피그마 프레임(162×190)을 화면 폭에 맞춰 3.549배로 키운 크기다. */

const CALL = `${BASE}ui/call/`
// 받기 버튼을 막대의 이 비율 이상 밀면 전화를 받는다.
const ANSWER_AT = 0.8

function CallCard({ beat, idx, dispatch }) {
  const [answered, setAnswered] = useState(false)
  const [drag, setDrag] = useState(0) // 받기 버튼 위치 0~1
  const [dragging, setDragging] = useState(false)
  const [since, setSince] = useState(null) // 통화 시작 시각
  const [cue, setCue] = useState(null) // 통화 영상 자막
  const [, tick] = useState(0)
  const track = useRef(null)
  const start = useRef(null)
  const on = answered || beat.call === 'on'

  // 전화 비트로 (다시) 들어오면 처음 상태로 돌린다.
  useEffect(() => {
    if (beat.type !== 'call') return
    setAnswered(false); setDrag(0); setSince(null)
  }, [idx])
  // 통화 시간
  useEffect(() => {
    if (!on) return
    setSince((t) => t ?? performance.now())
    const id = setInterval(() => tick((n) => n + 1), 500)
    return () => clearInterval(id)
  }, [on])

  const answer = () => {
    if (answered || beat.type !== 'call') return
    setAnswered(true)
    setDrag(1)
    setVib(null)
    sfx('call-connect')
    setTimeout(() => dispatch({ type: 'NEXT' }), 700)
  }
  useKeys((e) => {
    if (e.code === 'Space' || e.code === 'Enter' || e.key === 'ArrowRight') answer()
  })

  // 받기 버튼 끌기. 놓았을 때 ANSWER_AT을 넘었으면 받고, 아니면 제자리로 돌아간다.
  const max = () => {
    const el = track.current
    const knob = el.firstElementChild
    const pad = parseFloat(getComputedStyle(el).paddingLeft)
    return el.clientWidth - pad * 2 - knob.offsetWidth
  }
  const onDown = (e) => {
    if (answered) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = e.clientX
    setDragging(true)
  }
  const onMove = (e) => {
    if (!dragging) return
    // 무대가 축소되어 있으므로 화면 거리를 무대 거리로 바꾼다.
    const scale = track.current.getBoundingClientRect().width / track.current.offsetWidth
    setDrag(Math.min(1, Math.max(0, (e.clientX - start.current) / scale / max())))
  }
  const onUp = () => {
    if (!dragging) return
    setDragging(false)
    if (drag >= ANSWER_AT) answer()
    else setDrag(0)
  }

  const secs = since ? Math.floor((performance.now() - since) / 1000) : 0
  const time = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
  return (
    <>
    {beat.type === 'callvid' && cue && (
      <div className="video-cue">
        <p className="ko">{cue.text.split('\n').map((l, i) => <span key={i}>{l}</span>)}</p>
      </div>
    )}
    <div className={`call-card ${on ? 'on' : 'ring'}`}>
      {on && beat.callVid
        ? <CallVideo key="callvid" src={beat.callVid} play={beat.type === 'callvid'} cues={beat.cues} onCue={setCue} onEnd={() => dispatch({ type: 'NEXT' })}
            fallback={<img className="call-face" src={`${CALL}chloe.png`} alt="" />} />
        : <img className="call-face" src={`${CALL}chloe.png`} alt="" />}
      <div className="call-shade" />
      {/* 받기 전에는 이름과 '전화 거는 중', 통화 중에는 통화 시간만 작게 보인다 */}
      <div className="call-name">
        {!on && <p>Chloe</p>}
        <p className="call-status">{on ? time : 'calling...'}</p>
      </div>
      {!on || (answered && beat.type === 'call') ? (
        <div className="call-track" ref={track} style={{ '--p': drag }}>
          <button
            className={`call-knob ${dragging ? 'dragging' : ''}`}
            style={{ transform: `translateX(calc(var(--p) * var(--max)))` }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            onClick={(e) => e.stopPropagation()}
            aria-label="전화 받기"
          >
            <img src={`${CALL}call-answer.svg`} alt="" />
          </button>
          <span className="call-hint">slide to answer</span>
        </div>
      ) : (
        <div className="call-actions">
          <span className="call-btn small"><img src={`${CALL}volume-up.svg`} alt="" /></span>
          <span className="call-btn end"><img src={`${CALL}call-end.svg`} alt="" /></span>
          <span className="call-btn small"><img src={`${CALL}mic-off.svg`} alt="" /></span>
        </div>
      )}
    </div>
    </>
  )
}

// 배경이 투명한 영상은 브라우저마다 형식이 다르다. 사파리는 애플 형식(HEVC), 그 밖은 웹엠(VP9).
const SAFARI = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)
const alphaVideo = (base) => `${BASE}${base}${SAFARI ? '-hevc.mp4' : '.webm'}`

// 통화 카드 속 클로이 영상. play일 때 재생하며 자막을 알리고, 끝나면 onEnd.
// 이어지는 통화 대사에서는 마지막 장면에 멈춰 둔다.
// 영상이 바뀔 때는 영상마다 층을 따로 두고, 새 영상이 첫 장면을 그리면 0.35초 동안 겹쳐 바꾼다(빈 화면·튐 방지).
// 첫 영상이 준비되기 전까지는 통화 사진(fallback)을 그대로 둔다.
function CallVideo({ src, play, cues, onCue, onEnd, fallback }) {
  const [layers, setLayers] = useState([src])
  const [ready, setReady] = useState(false)
  useEffect(() => { setLayers((l) => (l[l.length - 1] === src ? l : [...l.filter((s) => s !== src), src].slice(-2))) }, [src])
  const shown = (s) => {
    setReady(true)
    setTimeout(() => setLayers((l) => (l.includes(s) ? [s] : l)), 400)
  }
  return (
    <>
      {!ready && fallback}
      {layers.map((s) => (
        <CallVideoLayer key={s} src={s} active={s === src} play={play && s === src} cues={s === src ? cues : null}
          onCue={onCue} onEnd={onEnd} onShown={() => shown(s)} />
      ))}
    </>
  )
}

function CallVideoLayer({ src, active, play, cues: cueList, onCue, onEnd, onShown }) {
  const ref = useRef(null)
  const cues = useRef([])
  const [shown, setShown] = useState(false)
  cues.current = cueList ?? []
  const show = () => { if (active && !shown) { setShown(true); onShown() } }
  useEffect(() => {
    if (!active) return
    const v = ref.current
    if (!play) {
      onCue(null)
      const toEnd = () => { v.pause(); if (isFinite(v.duration)) v.currentTime = Math.max(0, v.duration - 0.05) }
      if (v.readyState >= 1) toEnd(); else v.addEventListener('loadedmetadata', toEnd, { once: true })
      return
    }
    v.currentTime = 0
    v.muted = isMuted()
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}) })
    let raf = 0
    const tick = () => {
      const t = v.currentTime
      onCue(cues.current.find((c) => t >= c.at && t < c.to) ?? null)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [play, active])
  return (
    <video ref={ref} className={`call-face call-vid ${shown ? 'in' : ''}`} src={alphaVideo(src)} playsInline preload="auto"
      onPlaying={show} onSeeked={show}
      onEnded={() => { if (play) setTimeout(onEnd, 500) }} />
  )
}

// 우측 선택지. 반투명 박스에 번호와 문장을 둔다.
function Options({ options, onPick, chosen = null, final = false }) {
  return (
    <div className={`options ${final ? 'final' : ''} ${chosen !== null ? 'picked' : ''}`}>
      {options.map((o, i) => (
        <button key={i} className={`option ${chosen === i ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); origin(e); onPick(i) }}>
          <span className="num">{i + 1}</span>
          <span className="txt">{o.text}</span>
        </button>
      ))}
    </div>
  )
}

/* ───────── 엔딩 영상이 끝난 뒤의 질문 (Figma 2255) */

function After({ state, dispatch }) {
  const end = ENDINGS[state.final]
  const [pressed, press] = usePress()
  const next = () => press('next', () => dispatch({ type: 'NEXT' }))
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'NEXT' }), 4500)
    return () => clearTimeout(t)
  }, [])
  useKeys((e) => {
    if (e.code === 'Space' || e.code === 'Enter') next()
    if (e.key === 'ArrowLeft' || e.key === 'Backspace') dispatch({ type: 'BACK' })
  })
  return (
    <div className="after" onClick={next}>
      <Photo name={end.last} />
      <ChapterTag chapter={5} />
      <footer className="caption-bar after-bar">
        <p className="after-q">{end.question}</p>
      </footer>
    </div>
  )
}

/* ───────── 결과 화면 (Figma 2262) → 다른 결말 보기 (2263~2266) */

function Result({ state, dispatch }) {
  const [view, setView] = useState('result')
  const [pressed, press] = usePress()
  const end = ENDINGS[state.final]
  const toChoices = () => press('next', () => setView('choices'))
  useKeys((e) => {
    if (e.key === 'Escape' || e.key === 'ArrowLeft' || e.key === 'Backspace') {
      if (view === 'cards') setView('branches')
      else if (view === 'branches') setView('choices')
      else if (view === 'choices') setView('result')
      else dispatch({ type: 'BACK' })
    }
    if (view === 'result' && (e.code === 'Space' || e.code === 'Enter')) toChoices()
  })
  if (view === 'cards') return <Cards state={state} dispatch={dispatch} />
  const ps = end.portraitStyle
  return (
    <div className="result" style={{ '--tint': end.tint, '--base': end.base, '--base-t': end.base.replace('rgb(', 'rgba(').replace(')', ',0)') }}>
      <div className="result-photo-wrap" style={ps ? { width: ps.width, height: ps.height, left: ps.left, top: ps.top } : undefined}>
        {end.photoGradient && <div style={{ position: 'absolute', inset: 0, backgroundImage: end.photoGradient }} />}
        <img className="result-photo" src={`${BASE}ending/${end.portrait}.jpg`} alt="" />
      </div>
      <div className="result-tint" />
      <div className="result-fade" />
      {view === 'result' && <ChapterTag chapter={5} />}
      {view === 'result' && <div className="result-quote" style={end.quotePos ? { left: end.quotePos.left, top: end.quotePos.top } : undefined}>{end.quote}</div>}
      {view === 'result' && <footer className="caption-bar result-bar">
        <div className="result-text">
          <h1>{end.name}</h1>
          <p>{end.desc}</p>
        </div>
        <ContinueButton on={pressed === 'next'} onClick={toChoices} />
      </footer>}
      {(view === 'choices' || view === 'branches') && (
        <div className="mychoices">
          <div className="mychoices-overlay" />
          <ChapterTag chapter={6} />
          <div className="mychoices-slider" style={{ transform: view === 'branches' ? 'translateX(-1920px)' : undefined }}>
            <div className="mychoices-page"><Choices state={state} sliding={view === 'branches'} onNext={() => setView('branches')} /></div>
            <div className="mychoices-page"><BranchTree state={state} dispatch={dispatch} onRestart={() => dispatch({ type: 'RESTART' })} onCards={() => setView('cards')} /></div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────── 나의 선택 (Figma 3098-2322) — 8개의 분기 선택을 4×2 카드로 보여 준다 */

function Choices({ state, sliding, onNext }) {
  const end = ENDINGS[state.final]
  const [pressed, press] = usePress()
  const go = () => press('next', onNext)
  useKeys((e) => {
    if (e.code === 'Space' || e.code === 'Enter') go()
  })
  // picks의 처음 8개(c1~c8)만 표시한다. 최종 선택(final)은 제외.
  const picks = state.picks.filter((p) => p.id !== 'final').slice(0, 8)
  return (
    <div className="choices">
      <p className="choices-step">{'STEP 1  ·  8번의 선택'}</p>
      <div className="choices-grid">
        {picks.map((pick, i) => {
          const beat = CHOICE_MAP[pick.id]
          if (!beat) return null
          const label = CHOICE_LABELS[pick.id]
          const num = String(i + 1).padStart(2, '0')
          return (
            <div className="choice-card" key={pick.id}>
              <div className="choice-media">
                <img src={cut(beat.img || 'p-fog')} alt="" />
                <div className="choice-shade" />
                <span className="choice-label"><span className="choice-label-num">{num}</span><span className="choice-label-name">{label}</span></span>
              </div>
              <div className="choice-options">
                {beat.options.map((opt, j) => {
                  const selected = opt.text === pick.text
                  return (
                    <div className={`choice-opt ${selected ? 'selected' : ''}`} key={j}>
                      <span className="choice-opt-text">{opt.text}</span>
                      <span className="choice-opt-sign">{opt.sign > 0 ? '+1' : '−1'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <footer className="caption-bar choices-bar" style={sliding ? { opacity: 0, transition: 'opacity 0.3s ease' } : { transition: 'opacity 0.3s ease' }}>
        <ContinueButton on={pressed === 'next'} onClick={go} />
      </footer>
    </div>
  )
}

/* ───────── STEP 2+3 결말 분기 트리 (Figma 471:206) */

const FINAL_CHOICES = [
  { key: 'adapter', text: 'HQ를 높이기 위해 시도한다', route: 'A' },
  { key: 'insurgent', text: '돌아선다', route: 'A' },
  { key: 'zealot', text: '어떻게든 들어간다', route: 'B' },
  { key: 'outlier', text: 'HQ 제도에 회의를 느낀다', route: 'B' },
]

function BranchTree({ state, dispatch, onRestart, onCards }) {
  const end = ENDINGS[state.final]
  const [pressed, press] = usePress()
  const isA = state.route === 'A'
  useKeys((e) => {
    if (e.code === 'Space' || e.code === 'Enter') press('cards', onCards)
  })
  const choiceY = [238, 427, 603, 772]
  const endingY = [206, 395, 571, 740]
  return (
    <div className="branches">
      <div className="branches-content">

      {/* 컬럼 헤더 */}
      <p className="branches-step" style={{ left: 395, top: 152 }}>{'STEP 2  ·  AI 축 판정'}</p>
      <p className="branches-step" style={{ left: 1017, top: 152 }}>{'STEP 3  ·  마지막 선택'}</p>
      <p className="branches-step" style={{ left: 1477, top: 152 }}>결말</p>

      {/* SVG 연결선 */}
      <svg className="branches-paths" viewBox="0 0 1920 1080" fill="none">
        {/* 왼쪽: 중앙 → 분기+ */}
        <path d="M0 536 H200 V313 H395" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <path d="M0 536 H200 V313 H395" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ opacity: isA ? 1 : 0 }} />
        {/* 왼쪽: 중앙 → 분기- */}
        <path d="M0 536 H200 V716 H395" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <path d="M0 536 H200 V716 H395" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ opacity: isA ? 0 : 1 }} />
        {/* 중간: 분기+ → 선택1,2 */}
        <path d="M817 313 H917 V266 H1017" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <path d="M817 313 H917 V266 H1017" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ opacity: state.final === 'adapter' ? 1 : 0 }} />
        <path d="M817 313 H917 V455 H1017" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <path d="M817 313 H917 V455 H1017" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ opacity: state.final === 'insurgent' ? 1 : 0 }} />
        {/* 중간: 분기- → 선택3,4 */}
        <path d="M817 716 H917 V631 H1017" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <path d="M817 716 H917 V631 H1017" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ opacity: state.final === 'zealot' ? 1 : 0 }} />
        <path d="M817 716 H917 V800 H1017" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <path d="M817 716 H917 V800 H1017" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ opacity: state.final === 'outlier' ? 1 : 0 }} />
        {/* 오른쪽: 수평 연결선 (초상화 중심 y = endingY + 60) */}
        {ENDING_ORDER.map((k, i) => {
          const cy = endingY[i] + 60
          return (
            <React.Fragment key={k}>
              <line x1={1357} y1={cy} x2={1477} y2={cy} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1={1357} y1={cy} x2={1477} y2={cy} stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ opacity: state.final === k ? 1 : 0 }} />
            </React.Fragment>
          )
        })}
      </svg>

      {/* 분기+ (AI 인정) */}
      <div className="branch-group" style={{ top: 194, opacity: isA ? 1 : 0.38 }}>
        <div className="branch-label">
          <span className="branch-axis" style={{ color: isA ? '#adeaed' : 'rgba(255,255,255,0.6)' }}>AI 축 합계 +</span>
          <span className="branch-name">AI를 인정한 사람들</span>
        </div>
        <div className="branch-scene"><img src={cut('s4-jin-a')} alt="" /></div>
      </div>

      {/* 분기- (AI 거부) */}
      <div className="branch-group" style={{ top: 547, opacity: isA ? 0.38 : 1 }}>
        <div className="branch-label">
          <span className="branch-axis" style={{ color: isA ? 'rgba(255,255,255,0.6)' : '#adeaed' }}>AI 축 합계 −</span>
          <span className="branch-name">AI를 거부한 사람들</span>
        </div>
        <div className="branch-scene"><img src={cut('s4-julian-b')} alt="" /></div>
      </div>

      {/* STEP 3: 마지막 선택 4개 */}
      {FINAL_CHOICES.map((c, i) => {
        const isMine = c.key === state.final
        return (
          <div key={c.key} className={`branch-choice ${isMine ? 'mine' : ''}`} style={{ top: choiceY[i] }}>
            <span>{c.text}</span>
          </div>
        )
      })}

      {/* 결말 4개 */}
      {ENDING_ORDER.map((k, i) => {
        const e = ENDINGS[k]
        const isMine = k === state.final
        return (
          <div key={k} className="branch-ending" style={{ top: endingY[i], opacity: isMine ? 1 : 0.3 }}>
            <div className="branch-portrait">
              <div style={e.photoGradientOpen ? undefined : { mixBlendMode: 'luminosity', overflow: 'hidden', position: 'absolute', inset: 0 }}>
                {e.photoGradientOpen && <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'luminosity', backgroundImage: e.photoGradient }} />}
                <img src={`${BASE}ending/${e.cardPortrait || e.portrait}.jpg`} alt="" style={e.photoGradientOpen ? { mixBlendMode: 'luminosity', objectFit: 'cover', objectPosition: 'bottom', width: '100%', height: '100%' } : undefined} />
              </div>
            </div>
            <span className="branch-ending-name" style={{ color: isMine ? '#adeaed' : '#fff' }}>{e.name}</span>
          </div>
        )
      })}

      {/* 하단 바 */}
      <footer className="caption-bar branches-bar">
        <div className="branch-result-line">
          <span>이 선택들이 당신을</span>
          <span className="branch-result-name">{end.name}</span>
          <span>로 이끌었습니다.</span>
        </div>
        <div className="branch-buttons">
          <button className={`continue ${pressed === 'restart' ? 'on' : ''}`} onClick={(e) => { origin(e); press('restart', onRestart) }}><span>다시 시작하기</span></button>
          <button className={`continue ${pressed === 'cards' ? 'on' : ''}`} onClick={(e) => { origin(e); press('cards', onCards) }}><span>다른 결말 보기</span></button>
        </div>
      </footer>
      </div>
    </div>
  )
}

// 네 결말 카드. 누른 카드가 넓게 펼쳐지고, 내가 고른 결말에는 '내가 선택한 엔딩'이 붙는다.
// 다른 결말을 펼친 상태에서 '이 엔딩 보기'를 누르면 그 결말 영상부터 재생한다.
function Cards({ state, dispatch }) {
  const [open, setOpen] = useState(state.final)
  const [pressed, press] = usePress()
  useKeys((e) => {
    const k = ENDING_ORDER[Number(e.key) - 1]
    if (k) setOpen(k)
  })
  return (
    <div className="cards">
      {ENDING_ORDER.map((k) => {
        const end = ENDINGS[k]
        const on = open === k
        const fade = `linear-gradient(180deg, ${end.fade[0]} ${end.fade[3]}, ${end.fade[1]}, ${end.fade[2]})`
        return (
          <div
            key={k}
            className={`card ${on ? 'open' : ''}`}
            style={{ background: on ? end.card : end.dim }}
            onClick={() => setOpen(k)}
          >
            <div className="card-photo-wrap"
              style={(() => { const s = on ? end.cardOpen : end.cardClosed; return s ? { width: s.width, height: s.height, left: s.left, top: s.top } : undefined })()}
            >
            <div className="card-photo" style={end.photoGradientOpen ? undefined : { mixBlendMode: 'luminosity' }}>
              {(end.photoGradient || end.photoGradientOpen) && <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'luminosity', backgroundImage: on ? (end.photoGradientOpen || end.photoGradient) : (end.photoGradientClosed || end.photoGradient) }} />}
              <img src={`${BASE}ending/${end.cardPortrait || end.portrait}.jpg`} alt=""
                style={(() => {
                  const ci = on ? (end.cardImgOpen || end.cardImg) : (end.cardImgClosed || end.cardImg)
                  const s = on ? end.cardOpen : end.cardClosed
                  if (!ci || !s) return undefined
                  if (ci.objectFit) return { width: '100%', height: '100%', objectFit: ci.objectFit, objectPosition: ci.objectPosition, mixBlendMode: 'luminosity' }
                  const pct = (v) => typeof v === 'string' && v.endsWith('%')
                  return {
                    width:  pct(ci.width)  ? s.width  * parseFloat(ci.width)  / 100 : ci.width,
                    height: pct(ci.height) ? s.height * parseFloat(ci.height) / 100 : ci.height,
                    left:   pct(ci.left)   ? s.width  * parseFloat(ci.left)   / 100 : (ci.left || 0),
                    top:    pct(ci.top)    ? s.height * parseFloat(ci.top)    / 100 : (ci.top || 0),
                  }
                })()}
              />
            </div>
            </div>
            <div className="card-fade" style={{ backgroundImage: on ? fade : end.dimFade }} />
            {on ? (
              <div className="card-head">
                {k === state.mine ? (
                  <span className="continue static"><span>내가 선택한 엔딩</span></span>
                ) : (
                  <button
                    className={`continue ${pressed === k ? 'on' : ''}`}
                    onClick={(e) => { e.stopPropagation(); origin(e); press(k, () => dispatch({ type: 'REPLAY', key: k })) }}
                  >
                    <span>이 엔딩 보기</span>
                  </button>
                )}
                <div className="card-text">
                  <h2>{end.name}</h2>
                  <p>{end.desc}</p>
                </div>
              </div>
            ) : (
              <div className="card-label">
                <h3>{end.name}</h3>
                <i />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ───────── 커서: 흰 원, 아래 화면의 색을 반전한다 (Figma Ellipse 6, mix-blend-mode: difference) */

function Cursor({ scale, minX = 0 }) {
  const [pos, setPos] = useState(null)
  const [down, setDown] = useState(false)
  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY })
    const leave = () => setPos(null)
    const press = () => setDown(true)
    const release = () => setDown(false)
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('pointerleave', leave)
    window.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
    }
  }, [])
  if (!pos || pos.x < minX) return null
  const size = 58 * scale // SVG 82px 기준 원 58px → 표시 원 약 41px
  return (
    <img
      className={`cursor ${down ? 'down' : ''}`}
      src={`${BASE}ui/cursor.svg`}
      alt=""
      width="82"
      height="82"
      style={{ width: size, height: size, left: pos.x - size / 2, top: pos.y - size / 2 }}
    />
  )
}
