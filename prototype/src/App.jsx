import React, { useEffect, useReducer, useRef, useState } from 'react'
import { BEATS, CHAPTERS, ENDINGS, ENDING_ORDER, WHO_EN } from './story.js'
import { useTypewriter } from './ui.jsx'

const BASE = import.meta.env.BASE_URL
const cut = (name) => `${BASE}cut/${name}.jpg`
const PASSIVE = ['narr', 'line']

const initial = { started: false, idx: 0, ai: 0, hq: 0, picks: [], route: null, final: null, mine: null, history: [] }
// 엔딩 영상의 첫 비트. 다른 결말을 고르면 여기서부터 그 결말을 재생한다.
const ENDING_START = BEATS.findIndex((b) => b.chapter === 5)

// from 위치부터 조건(when)이 맞는 첫 비트로 이동한다. route 비트에서 4장 루트를 정한다.
function enter(state, from) {
  const s = { ...state }
  let i = from
  while (i < BEATS.length) {
    const b = BEATS[i]
    if (b.type === 'route') {
      // AI축 합계의 부호. 합계가 0이면 마지막 AI축 선택 ⑧을 따른다.
      const last = [...s.picks].reverse().find((p) => p.axis === 'ai')
      s.route = (s.ai !== 0 ? Math.sign(s.ai) : last?.sign ?? 1) > 0 ? 'A' : 'B'
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
      if (!state.history.length) return state
      return { ...state.history[state.history.length - 1], history: state.history.slice(0, -1) }
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
    case 'REPLAY': return enter({ ...state, history: [...state.history, snap(state)], final: a.key }, ENDING_START)
    default: return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initial)
  const scale = useStageScale()
  const beat = BEATS[state.idx]

  return (
    <div className="viewport">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {!state.started && <Title onStart={() => dispatch({ type: 'START' })} />}
        {state.started && beat.type === 'after' && <After key={state.final} state={state} dispatch={dispatch} />}
        {state.started && beat.type === 'result' && <Result key={state.final} state={state} dispatch={dispatch} />}
        {state.started && beat.type !== 'after' && beat.type !== 'result' && <Film state={state} beat={beat} dispatch={dispatch} />}
      </div>
      <Cursor scale={scale} />
    </div>
  )
}

function useStageScale() {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return scale
}

// 키보드 공통 처리. Space·Enter로 진행, 숫자로 선택, ←·Backspace로 되돌리기.
function useKeys(handler) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return
      if (e.code === 'Space' || e.code === 'Enter') e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
}

const PRESS_MS = 500
// 누르면 동작은 바로 실행하고, 버튼의 흰색 채움만 잠깐 남겼다가 걷어 낸다.
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
    <div key={n} className={`photo ${i === layers.length - 1 && layers.length > 1 ? 'photo-new' : ''}`} style={{ backgroundImage: `url(${cut(n)})` }} />
  ))
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
          {WHO_EN[item.who] && <em>{WHO_EN[item.who]}</em>}
          {item.via && <em>· {item.via}</em>}
        </div>
      )}
      <p className="ko"><Sentences full={item.text} shown={text.length} /></p>
      {item.en && <p className="en"><Sentences full={item.en} shown={typing ? Math.round((item.en.length * text.length) / Math.max(1, item.text.length)) : undefined} /></p>}
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

/* ───────── 타이틀 (Figma 2227) */

function Title({ onStart }) {
  const [pressed, press] = usePress()
  const start = () => press('start', onStart)
  useKeys((e) => { if (e.code === 'Space' || e.code === 'Enter') start() })
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

  const advance = () => {
    if (!passive) return
    if (!typing.done) typing.finish()
    else press('next', () => dispatch({ type: 'NEXT' }))
  }
  // 인물 대사가 이어질 때는 다 찍힌 뒤 0.5초 있다가 스스로 넘어간다.
  // 내레이션, 그리고 컷·선택·장이 바뀌기 직전의 자막은 '계속하기'를 눌러야 넘어간다.
  const next = BEATS[enter(state, state.idx + 1).idx]
  const cutEnds = !next || (next.type !== 'narr' && next.type !== 'line') || next.img !== beat.img || next.chapter !== beat.chapter
  const hold = passive && (beat.type === 'narr' || cutEnds)
  useEffect(() => {
    if (!passive || hold || !typing.done) return
    const t = setTimeout(() => dispatch({ type: 'NEXT' }), AUTO_MS)
    return () => clearTimeout(t)
  }, [passive, hold, typing.done, state.idx])
  const skip = () => press('skip', () => dispatch({ type: 'SKIP' }))
  const pick = (index) => press(index, () => dispatch({ type: beat.type === 'final' ? 'FINAL' : 'CHOOSE', index }))

  useKeys((e) => {
    if (e.code === 'Space' || e.code === 'Enter') advance()
    if (e.code === 'KeyS' && passive) skip()
    if ((e.key === 'ArrowLeft' || e.key === 'Backspace') && state.history.length) dispatch({ type: 'BACK' })
    const i = Number(e.key) - 1
    if ((beat.type === 'choice' || beat.type === 'final') && beat.options[i]) pick(i)
  })

  const isFinal = beat.type === 'final'
  return (
    <div className="film" onClick={advance}>
      <Photo name={beat.img} />
      {!isFinal && <ChapterTag chapter={beat.chapter} />}

      {(beat.type === 'choice' || isFinal) && <Options final={isFinal} options={beat.options} pressed={pressed} onPick={pick} />}

      {!isFinal && (
        <footer className="caption-bar">
          <Caption key={state.idx} item={passive ? beat : beat.prompt} typing={passive ? typing : null} />
          {passive && (
            <div className="caption-actions">
              <ContinueButton label="건너뛰기" hint="S" ghost on={pressed === 'skip'} onClick={skip} />
              {hold && <ContinueButton on={pressed === 'next'} onClick={advance} />}
            </div>
          )}
        </footer>
      )}
    </div>
  )
}

// 우측 선택지. 반투명 박스에 번호와 문장을 둔다.
function Options({ options, onPick, pressed = null, final = false }) {
  return (
    <div className={`options ${final ? 'final' : ''}`}>
      {options.map((o, i) => (
        <button key={i} className={`option ${pressed === i ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); origin(e); onPick(i) }}>
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
  useKeys((e) => {
    if (e.key === 'Escape' || e.key === 'ArrowLeft' || e.key === 'Backspace') {
      if (view === 'cards') setView('result')
      else dispatch({ type: 'BACK' })
    }
  })
  if (view === 'cards') return <Cards state={state} dispatch={dispatch} />
  return (
    <div className="result" style={{ '--tint': end.tint, '--base': end.base }}>
      <img className="result-photo" src={`${BASE}ending/${end.portrait}.jpg`} alt="" />
      <div className="result-tint" />
      <div className="result-fade" />
      <ChapterTag chapter={5} />
      <div className="result-quote">{end.quote}</div>
      <footer className="caption-bar result-bar">
        <div className="result-text">
          <h1>{end.name}</h1>
          <p>{end.desc}</p>
        </div>
        <div className="result-actions">
          <button className={`continue ${pressed === 'restart' ? 'on' : ''}`} onClick={(e) => origin(e) || press('restart', () => dispatch({ type: 'RESTART' }))}>
            <span>다시 시작하기</span>
          </button>
          <button className={`continue ${pressed === 'cards' ? 'on' : ''}`} onClick={(e) => origin(e) || press('cards', () => setView('cards'))}>
            <span>다른 결말 보기</span>
          </button>
        </div>
      </footer>
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
            <img className="card-photo" src={`${BASE}ending/${end.portrait}.jpg`} alt="" />
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
                <h2>{end.name}</h2>
                <p>{end.desc}</p>
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

function Cursor({ scale }) {
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
  if (!pos) return null
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
