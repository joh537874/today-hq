import React, { useEffect, useMemo, useReducer, useState, useRef } from 'react'
import { BEATS, CHAPTERS, ENDINGS, THRESHOLD } from './story.js'
import Scene from './Scene.jsx'
import { HoldButton, useTypewriter, ChapterCard, RelationFlash, GlitchNum } from './ui.jsx'

const PASSIVE = ['narr', 'line', 'term', 'news', 'notify']

const initial = {
  started: false, idx: 0, log: [], hq: 81, ai: 0, std: 0,
  picks: [], route: null, final: null, set: {}, shake: 0,
  lastRelation: null, // { who, direction } — 선택 후 관계 플래시
}

function logOf(beat) {
  switch (beat.type) {
    case 'narr': return { kind: 'narr', text: beat.text }
    case 'line': return { kind: 'line', who: beat.who, text: beat.text }
    case 'term': return { kind: 'term', who: beat.term, text: beat.text }
    case 'news': return { kind: 'sys', who: '뉴스 속보', text: `"${beat.headline}." ${beat.sub}.` }
    case 'notify': return { kind: 'sys', who: beat.app, text: `${beat.title}. ${beat.body}.` }
    case 'message': return { kind: 'line', who: beat.from, text: `"${beat.text}"`, via: '메시지' }
    default: return null
  }
}

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

// 선택 후 누구와의 관계가 변했는지 결정
const CHOICE_RELATION = {
  c1: 'ai', c3: 'ai', c6: 'ai', c7a: 'ai', c7b: 'ai',
  c2: 'std', c4: 'std',
}
const RELATION_NAMES = { ai: '나인', std: '기준 태도' }

function reducer(state, a) {
  switch (a.type) {
    case 'START': return enter({ ...initial, started: true, log: [{ kind: 'place', text: '1장 · 집' }] }, 0)
    case 'RESTART': return initial
    case 'NEXT': {
      let s = { ...state, lastRelation: null }
      if (a.log) s = { ...s, log: [...s.log, ...[].concat(a.log)] }
      return enter(s, state.idx + 1)
    }
    case 'CHOOSE': {
      const beat = BEATS[state.idx]
      const opt = beat.options[a.index]
      const delta = opt.sign * beat.amount
      const relAxis = CHOICE_RELATION[beat.id]
      const s = {
        ...state,
        ai: state.ai + (beat.axis === 'ai' ? delta : 0),
        std: state.std + (beat.axis === 'std' ? delta : 0),
        picks: [...state.picks, { id: beat.id, num: beat.num, title: beat.title, axis: beat.axis, sign: opt.sign, delta, text: opt.text }],
        log: [...state.log, beat.who === '나' ? { kind: 'narr', text: beat.prompt } : { kind: 'line', who: beat.who, text: beat.prompt }, { kind: 'me', text: opt.text }],
        shake: state.shake + 1,
        lastRelation: relAxis ? { who: RELATION_NAMES[relAxis] || relAxis, direction: opt.sign } : null,
      }
      return enter(s, state.idx + 1)
    }
    case 'FINAL': {
      const beat = BEATS[state.idx]
      const opt = beat.options.find((o) => o.key === a.key)
      const s = { ...state, final: a.key, log: [...state.log, { kind: 'me', text: opt.text }], shake: state.shake + 1, lastRelation: null }
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
  const [chapterShowing, setChapterShowing] = useState(null)
  const prevChapter = useRef(0)

  // 장 전환 감지 → 챕터 카드 표시
  useEffect(() => {
    if (!state.started || !beat) return
    if (beat.chapter !== prevChapter.current && beat.chapter <= 4) {
      setChapterShowing(beat.chapter)
    }
    prevChapter.current = beat.chapter
  }, [beat?.chapter, state.started])

  return (
    <div className="viewport">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {!state.started && <Title onStart={() => dispatch({ type: 'START' })} />}
        {state.started && beat.type !== 'ending' && (
          <>
            {chapterShowing && (
              <ChapterCard
                key={chapterShowing}
                chapter={CHAPTERS[chapterShowing - 1].label}
                title={CHAPTERS[chapterShowing - 1].title}
                place={beat.place}
                onDone={() => setChapterShowing(null)}
              />
            )}
            <Game state={state} beat={beat} dispatch={dispatch} />
          </>
        )}
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
  const [phase, setPhase] = useState('idle') // idle → reveal
  useEffect(() => { const t = setTimeout(() => setPhase('reveal'), 300); return () => clearTimeout(t) }, [])
  return (
    <div className={`title ${phase}`}>
      <div className="title-top">
        <div className="title-line" />
        <div className="eyebrow">인터랙티브 스토리</div>
      </div>
      <h1>오늘의<br/>HQ</h1>
      <p className="title-sub">2069년, 인간다움이 숫자로 매겨지는 도시.<br/>친구의 생일 모임에 가는 하루를 따라갑니다.</p>
      <div className="title-info">
        <div className="title-stat"><span className="ts-label">플레이</span><span className="ts-val">약 5분</span></div>
        <div className="title-divider" />
        <div className="title-stat"><span className="ts-label">선택</span><span className="ts-val">7회 · 12초 제한</span></div>
        <div className="title-divider" />
        <div className="title-stat"><span className="ts-label">엔딩</span><span className="ts-val">4개</span></div>
      </div>
      <button className="title-start" onClick={onStart}>
        <svg viewBox="0 0 48 48" width="48" height="48">
          <path d="M24 4 L44 24 L24 44 L4 24 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M20 16 L32 24 L20 32 Z" fill="currentColor" />
        </svg>
        <span>시작하기</span>
      </button>
      <div className="title-hint">스페이스바 — 진행&nbsp;&nbsp;·&nbsp;&nbsp;1, 2 — 선택</div>
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

      {/* 관계 변화 플래시 */}
      {state.lastRelation && (
        <RelationFlash key={state.shake} who={state.lastRelation.who} direction={state.lastRelation.direction} />
      )}

      {/* 상단 HUD */}
      <header className="top">
        <div className="top-left">
          <div className="tl-chapter">{chapter.label}</div>
          <h2 className="tl-title">{chapter.title}</h2>
          {beat.place !== chapter.title && <div className="tl-place">{beat.place}</div>}
        </div>

        {/* 챕터 진행 — 수직 다이아몬드 */}
        <div className="progress-diamonds">
          {CHAPTERS.map((c) => (
            <div key={c.id} className={`pd ${c.id === beat.chapter ? 'on' : ''} ${c.id < beat.chapter ? 'past' : ''}`}>
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path d="M8 1 L15 8 L8 15 L1 8 Z" />
              </svg>
            </div>
          ))}
        </div>

        <InstabilityMeter hq={state.hq} shake={state.shake} empty={state.set.tagEmpty} />
      </header>

      {/* 하단 대화 영역 */}
      <footer className={`dialog ${passive ? 'passive' : ''}`} onClick={passive ? advance : undefined}>
        {beat.type !== 'choice' && beat.type !== 'final' && (
          <Speech entry={last} typing={passive ? typing : null} />
        )}
        {passive && (
          <div className="continue">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            <span>{typing.done ? '계속' : '건너뛰기'}</span>
            <kbd>Space</kbd>
          </div>
        )}
        {beat.type === 'choice' && <DiamondChoice beat={beat} onPick={(index) => dispatch({ type: 'CHOOSE', index })} />}
        {beat.type === 'final' && <Final beat={beat} onPick={(key) => dispatch({ type: 'FINAL', key })} />}
        {beat.type === 'epilogue' && <Epilogue state={state} dispatch={dispatch} />}
        {interactive && <Hint type={beat.type} />}
      </footer>
    </div>
  )
}

// 디트로이트식 세로 불안정성 미터
function InstabilityMeter({ hq, shake, empty }) {
  const [shown, setShown] = useState(hq)
  useEffect(() => {
    if (hq == null || shown === hq) return
    const t = setTimeout(() => setShown((v) => v + Math.sign(hq - v)), 45)
    return () => clearTimeout(t)
  }, [hq, shown])
  const below = hq != null && shown < THRESHOLD
  const pct = empty ? 0 : Math.min(100, shown)

  return (
    <div className={`instability ${below ? 'unstable' : 'stable'} ${empty ? 'empty' : ''}`}>
      <div className="inst-label">HQ</div>
      <div className="inst-track">
        <div className="inst-fill" style={{ height: `${pct}%` }} />
        <div className="inst-threshold" style={{ bottom: `${THRESHOLD}%` }} />
        {/* 눈금 표시 */}
        {[25, 50, 75].map(v => <div key={v} className="inst-tick" style={{ bottom: `${v}%` }} />)}
      </div>
      <div className="inst-num" key={shake}>
        <GlitchNum value={empty ? '—' : shown} glitch={shake} />
      </div>
      <div className="inst-sub">{empty ? '미측정' : below ? '기준 미달' : '기준 통과'}</div>
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
      {who && (
        <div className="who">
          <svg className="who-diamond" viewBox="0 0 12 12" width="10" height="10">
            <path d="M6 1 L11 6 L6 11 L1 6 Z" className={WHO_TONE[who] ?? 'gray'} />
          </svg>
          {who}{entry.via && <em>{entry.via}</em>}
        </div>
      )}
      <p>{text}{typing && !typing.done && <span className="caret" />}</p>
    </div>
  )
}

// 디트로이트식 다이아몬드 선택 — 중앙 프롬프트, 양쪽에 선택지
const CHOICE_TIME = 12000

function DiamondChoice({ beat, onPick }) {
  const [hover, setHover] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())
  const picked = useRef(false)

  useEffect(() => {
    const tick = () => {
      if (picked.current) return
      const e = Date.now() - startRef.current
      setElapsed(e)
      if (e >= CHOICE_TIME) { picked.current = true; onPick(Math.floor(Math.random() * beat.options.length)); return }
      requestAnimationFrame(tick)
    }
    const raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line

  const handlePick = (i) => { if (!picked.current) { picked.current = true; onPick(i) } }
  const remain = Math.max(0, 1 - elapsed / CHOICE_TIME)
  const warning = remain < 0.25
  const secs = Math.ceil((CHOICE_TIME - elapsed) / 1000)

  return (
    <div className="diamond-choice">
      {/* 중앙 다이아몬드 + 프롬프트 */}
      <div className="dc-center">
        <div className="dc-meta">
          <svg viewBox="0 0 20 20" width="14" height="14"><path d="M10 2 L18 10 L10 18 L2 10 Z" className={beat.axis} /></svg>
          <span>{beat.num} {beat.title}</span>
        </div>
        <div className="dc-who">
          <svg viewBox="0 0 12 12" width="10" height="10"><path d="M6 1 L11 6 L6 11 L1 6 Z" className={WHO_TONE[beat.who] ?? 'gray'} /></svg>
          {beat.who}
        </div>
        <p className="dc-prompt">{beat.prompt}</p>
        <div className={`dc-inner ${hover != null ? 'on' : ''}`}>
          {hover != null ? beat.options[hover].inner : ''}
        </div>
        {/* 타이머 링 */}
        <svg className={`dc-timer ${warning ? 'warning' : ''}`} viewBox="0 0 60 60" width="52" height="52">
          <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" strokeWidth="2"
            strokeDasharray={`${remain * 163.36} 163.36`}
            strokeLinecap="round" transform="rotate(-90 30 30)" />
          <text x="30" y="34" textAnchor="middle" fontSize="16" fill="currentColor">{secs}</text>
        </svg>
      </div>

      {/* 선택지 — 양쪽 배치 */}
      <div className="dc-opts">
        {beat.options.map((o, i) => (
          <button
            key={i}
            className={`dc-opt dc-opt-${i}`}
            onClick={() => handlePick(i)}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          >
            <div className="dc-opt-diamond">
              <svg viewBox="0 0 32 32" width="28" height="28">
                <path d="M16 2 L30 16 L16 30 L2 16 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <text x="16" y="20" textAnchor="middle" fontSize="14" fill="currentColor">{i + 1}</text>
              </svg>
            </div>
            <span className="dc-opt-text">{o.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Final({ beat, onPick }) {
  return (
    <div className="diamond-choice final">
      <div className="dc-center">
        <div className="dc-meta">
          <svg viewBox="0 0 20 20" width="14" height="14"><path d="M10 2 L18 10 L10 18 L2 10 Z" className="end" /></svg>
          <span>{beat.num} {beat.title}</span>
        </div>
        <div className="dc-who">
          <svg viewBox="0 0 12 12" width="10" height="10"><path d="M6 1 L11 6 L6 11 L1 6 Z" className={WHO_TONE[beat.who] ?? 'gray'} /></svg>
          {beat.who}
        </div>
        <p className="dc-prompt">{beat.prompt}</p>
        <div className="dc-inner">길게 눌러 결정 · 손을 떼면 취소</div>
      </div>
      <div className="dc-opts final-opts">
        {beat.options.map((o, i) => (
          <HoldButton key={o.key} className="dc-final-hold" ms={1300} onDone={() => onPick(o.key)}>
            <div className="dc-opt-diamond">
              <svg viewBox="0 0 32 32" width="28" height="28">
                <path d="M16 2 L30 16 L16 30 L2 16 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <text x="16" y="20" textAnchor="middle" fontSize="14" fill="currentColor">{i + 1}</text>
              </svg>
            </div>
            <div className="dc-final-content">
              <strong>{o.text}</strong>
              <p>{o.desc}</p>
            </div>
          </HoldButton>
        ))}
      </div>
    </div>
  )
}

function Epilogue({ state, dispatch }) {
  const end = ENDINGS[state.final]
  const [done, setDone] = useState(0)
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
        <div className="act-head">
          <svg viewBox="0 0 16 16" width="12" height="12"><path d="M8 1 L15 8 L8 15 L1 8 Z" className="ai" /></svg>
          <span>나인의 제안</span>
          <em>{done + 1} / {end.tasks.length}</em>
        </div>
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
        <div className="act-head">
          <svg viewBox="0 0 16 16" width="12" height="12"><path d="M8 1 L15 8 L8 15 L1 8 Z" className="end" /></svg>
          <span>되돌릴 수 없는 행동</span>
        </div>
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
      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      <span>{step + 1 >= end.steps.length ? '결말 보기' : '계속'}</span>
    </button>
  )
}

const HINTS = {
  gate: '스캔 패널을 길게 눌러 측정하세요',
  glance: '승객 위에 마우스를 올려보세요',
  bell: '초인종을 누르세요',
  letter: '편지를 눌러 읽으세요',
  message: '메시지를 확인하세요',
}
function Hint({ type }) {
  return (
    <div className="hint">
      <svg className="hint-diamond" viewBox="0 0 16 16" width="12" height="12">
        <path d="M8 2 L14 8 L8 14 L2 8 Z" fill="currentColor" />
      </svg>
      {HINTS[type]}
    </div>
  )
}

function Ending({ state, onRestart }) {
  const end = ENDINGS[state.final]
  const pos = useMemo(() => ({ x: state.ai / 10, y: state.std / 2 }), [state.ai, state.std])
  return (
    <div className={`ending tone-${end.tone}`}>
      <section className="end-hero">
        <div className="end-top">
          <span className="end-no">{end.no}</span>
          <span className="end-tag">{end.hq}</span>
        </div>
        <div className="end-body">
          <div className="end-pill">{end.tag}</div>
          <h1 className="serif">{end.name}</h1>
          <h2>{end.ko}</h2>
          <p className="end-desc">{end.desc}</p>
          <p className="end-letter">{end.letter}</p>
          <blockquote>"{end.question}"</blockquote>
        </div>
      </section>

      <section className="end-side">
        <div className="end-card">
          <div className="ec-head">
            <svg viewBox="0 0 16 16" width="12" height="12"><path d="M8 1 L15 8 L8 15 L1 8 Z" className="end" /></svg>
            두 개의 질문 위의 나
          </div>
          <AxisChart pos={pos} />
          <div className="axis-sum">
            <span><i className="dot ai" />AI 축 <b>{fmt(state.ai)}</b></span>
            <span><i className="dot std" />기준 축 <b>{fmt(state.std)}</b></span>
            <span>루트 <b>4{state.route}</b></span>
          </div>
        </div>
        <div className="end-card picks-card">
          <div className="ec-head">
            <svg viewBox="0 0 16 16" width="12" height="12"><path d="M8 1 L15 8 L8 15 L1 8 Z" className="ai" /></svg>
            내가 한 선택
          </div>
          <ul className="picks">
            {state.picks.map((p) => (
              <li key={p.id}>
                <svg viewBox="0 0 10 10" width="8" height="8"><path d="M5 1 L9 5 L5 9 L1 5 Z" className={p.axis} /></svg>
                <span className="pick-title">{p.num} {p.title}</span>
                <span className="pick-text">{p.text}</span>
                <b className={p.delta > 0 ? 'plus' : 'minus'}>{fmt(p.delta)}</b>
              </li>
            ))}
          </ul>
        </div>
        <button className="btn-restart" onClick={onRestart}>
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          처음부터 다시
        </button>
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
      {/* 다이아몬드 배경 */}
      <path d={`M${c} 20 L${S-20} ${c} L${c} ${S-20} L20 ${c} Z`} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="20" y1={c} x2={S - 20} y2={c} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1={c} y1="20" x2={c} y2={S - 20} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
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
