import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { BEATS, CHAPTERS, ENDINGS, THRESHOLD } from './story.js'
import Scene from './Scene.jsx'
import { HoldButton, useTypewriter } from './ui.jsx'

const PASSIVE = ['narr', 'line', 'term', 'news', 'notify']

const initial = {
  started: false, idx: 0, log: [], hq: 81, ai: 0, std: 0,
  picks: [], route: null, final: null, set: {}, shake: 0,
}

function logOf(beat) {
  switch (beat.type) {
    case 'narr': return { kind: 'narr', text: beat.text }
    case 'line': return { kind: 'line', who: beat.who, text: beat.text }
    case 'term': return { kind: 'term', who: beat.term, text: beat.text }
    case 'news': return { kind: 'sys', who: '뉴스 속보', text: `“${beat.headline}.” ${beat.sub}.` }
    case 'notify': return { kind: 'sys', who: beat.app, text: `${beat.title}. ${beat.body}.` }
    case 'message': return { kind: 'line', who: beat.from, text: `“${beat.text}”`, via: '메시지' }
    default: return null
  }
}

// from 위치부터 조건에 맞는 다음 비트로 들어간다.
function enter(state, from) {
  let s = { ...state }
  let i = from
  while (i < BEATS.length) {
    const b = BEATS[i]
    if (b.type === 'route') {
      const lastAi = [...s.picks].reverse().find((p) => p.axis === 'ai')
      const sign = s.ai !== 0 ? Math.sign(s.ai) : (lastAi?.sign ?? 1)
      s.route = sign > 0 ? 'A' : 'B'
      i += 1
      continue
    }
    if (b.when && !b.when(s)) { i += 1; continue }
    break
  }
  const beat = BEATS[i]
  if (!beat) return s
  s.idx = i
  if (beat.hq != null) s.hq = beat.hq
  if (beat.sceneChanged) s.set = beat.set ?? {}
  else if (beat.set) s.set = beat.set
  const entry = logOf(beat)
  if (beat.sceneChanged) s.log = [...s.log, { kind: 'place', text: `${CHAPTERS[beat.chapter - 1].label} · ${beat.place}` }]
  if (entry) s.log = [...s.log, entry]
  return s
}

function reducer(state, a) {
  switch (a.type) {
    case 'START': return enter({ ...initial, started: true, log: [{ kind: 'place', text: '1장 · 집' }] }, 0)
    case 'RESTART': return initial
    case 'NEXT': {
      let s = state
      if (a.log) s = { ...s, log: [...s.log, ...[].concat(a.log)] }
      return enter(s, state.idx + 1)
    }
    case 'CHOOSE': {
      const beat = BEATS[state.idx]
      const opt = beat.options[a.index]
      const delta = opt.sign * beat.amount
      const s = {
        ...state,
        ai: state.ai + (beat.axis === 'ai' ? delta : 0),
        std: state.std + (beat.axis === 'std' ? delta : 0),
        picks: [...state.picks, { id: beat.id, num: beat.num, title: beat.title, axis: beat.axis, sign: opt.sign, delta, text: opt.text }],
        log: [...state.log, beat.who === '나' ? { kind: 'narr', text: beat.prompt } : { kind: 'line', who: beat.who, text: beat.prompt }, { kind: 'me', text: opt.text }],
        shake: state.shake + 1,
      }
      return enter(s, state.idx + 1)
    }
    case 'FINAL': {
      const beat = BEATS[state.idx]
      const opt = beat.options.find((o) => o.key === a.key)
      const s = { ...state, final: a.key, log: [...state.log, { kind: 'me', text: opt.text }], shake: state.shake + 1 }
      return enter(s, state.idx + 1)
    }
    case 'LOG': return { ...state, log: [...state.log, ...[].concat(a.log)] }
    case 'HQ': return { ...state, hq: a.hq, shake: state.shake + 1 }
    case 'SET': return { ...state, set: { ...state.set, ...a.set } }
    default: return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initial)
  const beat = BEATS[state.idx]
  const scale = useStageScale()

  return (
    <div className="viewport">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {!state.started && <Title onStart={() => dispatch({ type: 'START' })} />}
        {state.started && beat.type !== 'ending' && <Game state={state} beat={beat} dispatch={dispatch} />}
        {state.started && beat.type === 'ending' && <Ending state={state} onRestart={() => dispatch({ type: 'RESTART' })} />}
      </div>
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

function Title({ onStart }) {
  return (
    <div className="title">
      <div className="eyebrow">Interactive Story</div>
      <h1>오늘의 HQ</h1>
      <p className="title-sub">2069년, 인간다움이 숫자로 매겨지는 도시.<br/>친구의 생일 모임에 가는 하루를 따라갑니다.</p>
      <div className="title-cards">
        <div className="card title-card">
          <div className="dot-title"><i className="dot ai" />플레이 시간</div>
          <p>약 5분</p>
        </div>
        <div className="card title-card">
          <div className="dot-title"><i className="dot std" />선택</div>
          <p>7번의 선택 · 12초 제한</p>
        </div>
        <div className="card title-card">
          <div className="dot-title"><i className="dot end" />결말</div>
          <p>네 개의 엔딩</p>
        </div>
      </div>
      <button className="btn primary big" onClick={onStart}>시작하기</button>
      <div className="title-hint">스페이스바로 진행 · 선택은 1, 2 키</div>
    </div>
  )
}

function Game({ state, beat, dispatch }) {
  const next = (log) => dispatch({ type: 'NEXT', log })
  const passive = PASSIVE.includes(beat.type)
  const last = [...state.log].reverse().find((e) => e.kind !== 'place')
  const typing = useTypewriter(passive ? last?.text ?? '' : '', state.log.length)

  const advance = () => {
    if (!passive) return
    if (!typing.done) typing.finish()
    else next()
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); advance() }
      if (beat.type === 'choice' && (e.key === '1' || e.key === '2')) dispatch({ type: 'CHOOSE', index: Number(e.key) - 1 })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const chapter = CHAPTERS[beat.chapter - 1]
  const interactive = ['gate', 'glance', 'bell', 'letter', 'message'].includes(beat.type)

  return (
    <div className="game">
      <Scene beat={beat} set={state.set} hq={state.hq} next={next} dispatch={dispatch} />

      <header className="top">
        <div className="top-left card">
          <div className="eyebrow">{chapter.label}</div>
          <h2>{chapter.title}{beat.place !== chapter.title && <span className="place">{beat.place}</span>}</h2>
        </div>
        <div className="progress card">
          {CHAPTERS.map((c) => (
            <div key={c.id} className={`pg ${c.id === beat.chapter ? 'on' : ''} ${c.id < beat.chapter ? 'past' : ''}`}>
              <i />{c.id === beat.chapter && <span>{c.label}</span>}
            </div>
          ))}
        </div>
        <Humeter hq={state.hq} shake={state.shake} empty={state.set.tagEmpty} />
      </header>

      <footer className={`dialog card ${passive ? 'passive' : ''}`} onClick={passive ? advance : undefined}>
        {beat.type !== 'choice' && beat.type !== 'final' && (
          <Speech entry={last} typing={passive ? typing : null} />
        )}
        {passive && <div className="continue"><span>{typing.done ? '계속' : '건너뛰기'}</span><kbd>Space</kbd></div>}
        {beat.type === 'choice' && <Choice beat={beat} onPick={(index) => dispatch({ type: 'CHOOSE', index })} />}
        {beat.type === 'final' && <Final beat={beat} onPick={(key) => dispatch({ type: 'FINAL', key })} />}
        {beat.type === 'epilogue' && <Epilogue state={state} dispatch={dispatch} />}
        {interactive && <Hint type={beat.type} />}
      </footer>
    </div>
  )
}

function Humeter({ hq, shake, empty }) {
  const [shown, setShown] = useState(hq)
  // 숫자가 바뀌면 한 칸씩 굴러가며 따라간다.
  useEffect(() => {
    if (hq == null || shown === hq) return
    const t = setTimeout(() => setShown((v) => v + Math.sign(hq - v)), 45)
    return () => clearTimeout(t)
  }, [hq, shown])
  const below = hq != null && shown < THRESHOLD
  return (
    <div className={`humeter ${below ? 'below' : 'pass'} ${empty ? 'empty' : ''}`}>
      <div className="hm-label">내 HQ</div>
      <div className="hm-num" key={shake}>{empty ? '' : shown}</div>
      <div className="hm-meta">
        <div className="hm-bar"><i style={{ width: `${empty ? 0 : Math.min(100, shown)}%` }} /><b style={{ left: `${THRESHOLD}%` }} /></div>
        <span>{empty ? '미측정' : `기준선 ${THRESHOLD}`}</span>
      </div>
    </div>
  )
}

const WHO_TONE = { 나: 'me', 나인: 'ai', 줄리안: 'violet', 클로이: 'teal', 휴미터: 'std', '뉴스 속보': 'red' }

function Speech({ entry, typing }) {
  if (!entry) return <div className="speech" />
  const text = typing ? typing.text : entry.text
  const who = entry.kind === 'me' ? '나' : entry.who
  return (
    <div className={`speech ${entry.kind}`}>
      {who && <div className="who"><i className={`dot ${WHO_TONE[who] ?? 'gray'}`} />{who}{entry.via && <em>{entry.via}</em>}</div>}
      <p>{text}{typing && !typing.done && <span className="caret" />}</p>
    </div>
  )
}

const CHOICE_TIME = 12000 // 12초 제한

function Choice({ beat, onPick }) {
  const [hover, setHover] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const startRef = React.useRef(Date.now())

  // 타이머: 시간 지나면 랜덤 선택
  useEffect(() => {
    const tick = () => {
      const e = Date.now() - startRef.current
      setElapsed(e)
      if (e >= CHOICE_TIME) { onPick(Math.floor(Math.random() * beat.options.length)); return }
      requestAnimationFrame(tick)
    }
    const raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line

  const remain = Math.max(0, 1 - elapsed / CHOICE_TIME)
  const warning = remain < 0.25

  return (
    <div className="choice">
      <div className="choice-q">
        <div className="dot-title"><i className={`dot ${beat.axis}`} />{beat.num} {beat.title}</div>
        <div className="who"><i className={`dot ${WHO_TONE[beat.who] ?? 'gray'}`} />{beat.who}</div>
        <p className="choice-prompt">{beat.prompt}</p>
        <div className={`inner ${hover != null ? 'on' : ''}`}>
          {hover != null ? <><b>속마음</b>{beat.options[hover].inner}</> : '선택지에 마우스를 올리면 속마음이 보입니다'}
        </div>
      </div>
      <div className="choice-opts">
        {beat.options.map((o, i) => (
          <button key={i} className="opt" onClick={() => onPick(i)} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <kbd>{i + 1}</kbd><span>{o.text}</span>
          </button>
        ))}
      </div>
      <div className={`timer-bar ${warning ? 'warning' : ''}`}><i style={{ width: `${remain * 100}%` }} /></div>
    </div>
  )
}

function Final({ beat, onPick }) {
  return (
    <div className="choice final">
      <div className="choice-q">
        <div className="dot-title"><i className="dot end" />{beat.num} {beat.title}</div>
        <div className="who"><i className={`dot ${WHO_TONE[beat.who] ?? 'gray'}`} />{beat.who}</div>
        <p className="choice-prompt">{beat.prompt}</p>
        <div className="inner">길게 눌러 결정합니다. 손을 떼면 취소됩니다.</div>
      </div>
      <div className="choice-opts">
        {beat.options.map((o, i) => (
          <HoldButton key={o.key} className="final-opt" ms={1300} onDone={() => onPick(o.key)}>
            <b className="final-num">{i + 1}</b>
            <div><strong>{o.text}</strong><p>{o.desc}</p></div>
          </HoldButton>
        ))}
      </div>
    </div>
  )
}

// 마지막 선택 뒤의 장면. 결말마다 직접 해 보는 행동이 하나씩 들어간다.
function Epilogue({ state, dispatch }) {
  const end = ENDINGS[state.final]
  const [done, setDone] = useState(0) // 끝낸 tasks 수
  const [acted, setActed] = useState(!end.tasks && !end.hold)
  const [step, setStep] = useState(-1)

  const nextStep = () => {
    const n = step + 1
    if (n >= end.steps.length) return dispatch({ type: 'NEXT' })
    const s = end.steps[n]
    dispatch({ type: 'LOG', log: { kind: 'narr', text: s.text } })
    if (s.hq != null && s.hq !== state.hq) dispatch({ type: 'HQ', hq: s.hq })
    if (n === 0 && (state.final === 'adapter' || state.final === 'zealot')) dispatch({ type: 'SET', set: { open: true, passed: true } })
    setStep(n)
  }

  useEffect(() => { if (acted && step === -1) nextStep() }, [acted]) // eslint-disable-line

  if (!acted && end.tasks) {
    const t = end.tasks[done]
    return (
      <div className="act">
        <div className="act-head"><div className="dot-title"><i className="dot ai" />나인의 제안</div><span>{done} / {end.tasks.length}</span></div>
        <HoldButton key={done} className="final-opt task" ms={1000} onDone={() => {
          dispatch({ type: 'LOG', log: [{ kind: 'me', text: t.label }, { kind: 'narr', text: t.result }] })
          dispatch({ type: 'HQ', hq: t.hq })
          if (done + 1 >= end.tasks.length) setActed(true)
          else setDone(done + 1)
        }}>
          <b className="final-num">{done + 1}</b>
          <div><strong>{t.label}</strong><p>길게 눌러 실행</p></div>
        </HoldButton>
      </div>
    )
  }

  if (!acted && end.hold) {
    return (
      <div className="act">
        <div className="act-head"><div className="dot-title"><i className="dot end" />되돌릴 수 없는 행동</div><span>길게 눌러 실행</span></div>
        <HoldButton className="final-opt danger" ms={2200} onDone={() => {
          dispatch({ type: 'LOG', log: { kind: 'narr', text: end.hold.result } })
          dispatch({ type: 'SET', set: state.final === 'zealot' ? { nineOff: true } : { tagEmpty: true } })
          if (state.final === 'outlier') dispatch({ type: 'HQ', hq: null })
          setActed(true)
        }}>
          <b className="final-num">!</b>
          <div><strong>{end.hold.label}</strong><p>손을 떼면 취소됩니다</p></div>
        </HoldButton>
      </div>
    )
  }

  return (
    <button className="continue live" onClick={nextStep}>
      <span>{step + 1 >= end.steps.length ? '결말 보기' : '계속'}</span><kbd>Click</kbd>
    </button>
  )
}

const HINTS = {
  gate: '왼쪽 화면의 패널을 길게 눌러 스캔하세요',
  glance: '승객들에게 마우스를 올려 머리 위를 흘끗 보세요',
  bell: '초인종을 누르세요',
  letter: '손에 든 편지를 눌러 내려다보세요',
  message: '왼쪽 화면에서 메시지를 확인하세요',
}
function Hint({ type }) {
  return <div className="hint"><i className="pulse" />{HINTS[type]}</div>
}

function Ending({ state, onRestart }) {
  const end = ENDINGS[state.final]
  const pos = useMemo(() => ({ x: state.ai / 10, y: state.std / 2 }), [state.ai, state.std])
  return (
    <div className={`ending tone-${end.tone}`}>
      <section className="end-hero">
        <div className="end-top">
          <span className="eyebrow light">{end.no}</span>
          <span className="end-tag">{end.hq}</span>
        </div>
        <div className="end-body">
          <div className="pill">{end.tag}</div>
          <h1 className="serif">{end.name}</h1>
          <h2>{end.ko}</h2>
          <p className="end-desc">{end.desc}</p>
          <p className="end-letter">{end.letter}</p>
          <blockquote>“{end.question}”</blockquote>
        </div>
      </section>

      <section className="end-side">
        <div className="card end-card">
          <div className="dot-title"><i className="dot end" />두 개의 질문 위의 나</div>
          <AxisChart pos={pos} />
          <div className="axis-sum">
            <span><i className="dot ai" />AI 축 <b>{fmt(state.ai)}</b></span>
            <span><i className="dot std" />기준 축 <b>{fmt(state.std)}</b></span>
            <span>루트 <b>4{state.route}</b></span>
          </div>
        </div>
        <div className="card end-card">
          <div className="dot-title"><i className="dot ai" />내가 한 선택</div>
          <ul className="picks">
            {state.picks.map((p) => (
              <li key={p.id}>
                <i className={`dot ${p.axis}`} />
                <span className="pick-title">{p.num} {p.title}</span>
                <span className="pick-text">{p.text}</span>
                <b className={p.delta > 0 ? 'plus' : 'minus'}>{fmt(p.delta)}</b>
              </li>
            ))}
          </ul>
        </div>
        <button className="btn primary" onClick={onRestart}>처음부터 다시</button>
      </section>
    </div>
  )
}

const fmt = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0')

function AxisChart({ pos }) {
  const S = 300, c = S / 2, r = 112
  const x = c + Math.max(-1, Math.min(1, pos.x)) * r
  const y = c - Math.max(-1, Math.min(1, pos.y)) * r
  return (
    <svg className="axis" viewBox={`0 0 ${S} ${S}`}>
      <rect x="14" y="14" width={S - 28} height={S - 28} rx="20" />
      <line x1="14" y1={c} x2={S - 14} y2={c} /><line x1={c} y1="14" x2={c} y2={S - 14} />
      <text x={c - 68} y="52" textAnchor="middle" className="q">Zealot</text>
      <text x={c + 68} y="52" textAnchor="middle" className="q">Adapter</text>
      <text x={c - 68} y={S - 40} textAnchor="middle" className="q">Outlier</text>
      <text x={c + 68} y={S - 40} textAnchor="middle" className="q">Insurgent</text>
      <text x="26" y={c - 8} className="a">배척</text>
      <text x={S - 26} y={c - 8} textAnchor="end" className="a">포용</text>
      <text x={c + 8} y="32" className="a">수긍</text>
      <text x={c + 8} y={S - 22} className="a">반대</text>
      <circle cx={x} cy={y} r="18" className="halo" />
      <circle cx={x} cy={y} r="8" className="me" />
    </svg>
  )
}
