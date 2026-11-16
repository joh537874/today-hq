import React, { useEffect, useMemo, useReducer, useState, useRef } from 'react'
import { BEATS, CHAPTERS, ENDINGS, THRESHOLD } from './story.js'
import Scene, { TIME } from './Scene.jsx'
import { ActButton, useTypewriter, ChapterCard, GlitchNum } from './ui.jsx'

const PASSIVE = ['narr', 'line', 'term', 'news', 'notify']

const initial = {
  started: false, idx: 0, log: [], hq: 81, ai: 0, std: 0,
  picks: [], route: null, final: null, set: {}, shake: 0,
  lastRelation: null,
  lastReact: null, // { who, text, sign } 선택 직후 상대의 반응
  history: [], // 뒤로가기용 스냅샷
  hqLog: [], // HQ 변동 기록 { at, from, to, why }
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
  if (beat.hq != null && beat.hq !== s.hq) s.hqLog = [...s.hqLog, { at: beat.place, from: s.hq, to: beat.hq, why: beat.hqWhy ?? '' }]
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

function snap(state) {
  const { history, ...rest } = state
  return rest
}

function reducer(state, a) {
  switch (a.type) {
    case 'START': return enter({ ...initial, started: true, history: [], hqLog: [{ at: '어제', from: null, to: 81, why: '마지막 정기 측정' }], log: [{ kind: 'place', text: '1장 · 집' }] }, 0)
    case 'RESTART': return initial
    case 'BACK': {
      if (state.history.length === 0) return state
      const prev = state.history[state.history.length - 1]
      return { ...prev, history: state.history.slice(0, -1) }
    }
    case 'NEXT': {
      let s = { ...state, lastRelation: null, history: [...state.history, snap(state)] }
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
        history: [...state.history, snap(state)],
        ai: state.ai + (beat.axis === 'ai' ? delta : 0),
        std: state.std + (beat.axis === 'std' ? delta : 0),
        picks: [...state.picks, { id: beat.id, num: beat.num, title: beat.title, axis: beat.axis, sign: opt.sign, delta, text: opt.text }],
        log: [...state.log, beat.who === '나' ? { kind: 'narr', text: beat.prompt } : { kind: 'line', who: beat.who, text: beat.prompt }, { kind: 'me', text: opt.text }],
        shake: state.shake + 1,
        lastRelation: relAxis ? { who: RELATION_NAMES[relAxis] || relAxis, direction: opt.sign } : null,
        lastReact: opt.react ? { ...opt.react, sign: opt.sign } : null,
      }
      return enter(s, state.idx + 1)
    }
    case 'FINAL': {
      const beat = BEATS[state.idx]
      const opt = beat.options.find((o) => o.key === a.key)
      const s = { ...state, history: [...state.history, snap(state)], final: a.key, log: [...state.log, { kind: 'me', text: opt.text }], shake: state.shake + 1, lastRelation: null }
      return enter(s, state.idx + 1)
    }
    case 'LOG': return { ...state, log: [...state.log, ...[].concat(a.log)] }
    case 'HQ': return { ...state, hq: a.hq, shake: state.shake + 1, hqLog: a.hq === state.hq ? state.hqLog : [...state.hqLog, { at: BEATS[state.idx]?.place ?? '', from: state.hq, to: a.hq, why: a.why ?? '' }] }
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
                slow={chapterShowing === 1}
                onDone={() => setChapterShowing(null)}
              />
            )}
            <Game state={state} beat={beat} dispatch={dispatch} />
          </>
        )}
        {state.started && beat.type === 'ending' && <Ending state={state} onBack={() => dispatch({ type: 'BACK' })} onRestart={() => dispatch({ type: 'RESTART' })} />}
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
  const [phase, setPhase] = useState('idle')
  useEffect(() => { const t = setTimeout(() => setPhase('reveal'), 300); return () => clearTimeout(t) }, [])
  return (
    <div className={`title cover ${phase}`}>
      <div className="title-photo" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}img/ref-city1.jpg)` }} />

      <div className="cv-top">
        <span>Seoul, 2069</span>
        <span>An Interactive Story</span>
      </div>

      <div className="cv-bottom">
        <div className="cv-title">
          <em>Humanity Quotient</em>
          <h1>오늘의 HQ</h1>
          <p>인간다움이 숫자로 매겨지는 도시, 친구의 생일 모임에 가는 하루</p>
        </div>
        <div className="cv-start">
          <small>5 min · 7 choices · 4 endings</small>
          <button className="cv-btn" onClick={onStart}>시작하기<i>→</i></button>
        </div>
      </div>
    </div>
  )
}

function Game({ state, beat, dispatch }) {
  const next = (log) => dispatch({ type: 'NEXT', log })
  const [report, setReport] = useState(false)
  // 휴대폰 답장. 고른 답장이 화면에 전송된 뒤 다음으로 넘어간다.
  const [reply, setReply] = useState(null)
  useEffect(() => { setReply(null) }, [state.idx])
  const sendReply = (text) => {
    if (reply) return
    setReply(text ?? '__none')
    setTimeout(() => next(text ? { kind: 'me', text } : { kind: 'narr', text: '답장을 쓰지 못하고 화면을 끈다.' }), 1200)
  }
  const passive = PASSIVE.includes(beat.type)
  const logLast = [...state.log].reverse().find((e) => e.kind !== 'place')
  // 화면 패널에 이미 같은 문장이 떠 있는 비트는 대화창에 짧은 서술만 둔다
  const CAPTION = {
    news: '밤 11시, 뉴스 속보가 뜬다.',
    term: `앵커가 ‘${beat.term}’를 짚어 준다.`,
    notify: '아침, 휴미터 알림이 울린다.',
    message: `${beat.from}에게서 메시지가 왔다.`,
  }[beat.type]
  const last = CAPTION ? { kind: 'narr', text: CAPTION } : logLast
  const typing = useTypewriter(passive ? last?.text ?? '' : '', state.log.length)

  const advance = () => {
    if (!passive) return
    if (!typing.done) typing.finish()
    else next()
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || e.target.closest?.('input, textarea')) return
      if (!report && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); advance() }
      if (e.key === 'h' || e.key === 'H' || e.key === 'ㅗ') { setReport((v) => !v); return }
      if (e.key === 'Escape') { setReport(false); return }
      if (report) return
      if ((e.key === 'ArrowLeft' || e.key === 'Backspace') && state.history.length > 0) { e.preventDefault(); dispatch({ type: 'BACK' }) }
      if (beat.type === 'choice' && (e.key === '1' || e.key === '2')) dispatch({ type: 'CHOOSE', index: Number(e.key) - 1 })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const chapter = CHAPTERS[beat.chapter - 1]
  const interactive = ['gate', 'glance', 'bell', 'letter', 'rewind'].includes(beat.type)

  return (
    <div className="game">
      <Scene beat={beat} set={state.set} hq={state.hq} next={next} dispatch={dispatch} reply={reply} onReply={sendReply} picks={state.picks} />

      {/* 관계 변화 플래시 */}
      {state.lastReact && <ReactionToast key={state.shake} react={state.lastReact} />}

      {/* 상단 HUD: 왼쪽 위치 정보 한 줄, 오른쪽 HQ */}
      <header className="top2">
        <div className="hud-l">
          {state.history.length > 0 && (
            <button className="back-btn" onClick={() => dispatch({ type: 'BACK' })}>
              <span>← 뒤로</span>
            </button>
          )}
          <div className="hud-where">
            <b>Chapter {chapter.id}</b>
            <span>{chapter.title}</span>
            <i />
            <span>{beat.place}</span>
            <em>{TIME[beat.scene]}</em>
          </div>
        </div>
        <HQChip hq={state.hq} shake={state.shake} empty={state.set.tagEmpty} onClick={() => setReport(true)} />
      </header>

      {report && <HQReport state={state} onClose={() => setReport(false)} />}

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
        {beat.type === 'message' && <div className="hint"><i className="hint-dot" />{beat.replies.length ? '폰에서 답장을 고르거나 직접 입력하세요' : '폰 화면을 확인하세요'}</div>}
        {interactive && <Hint type={beat.type} />}
      </footer>
    </div>
  )
}

function HQChip({ hq, shake, empty, onClick }) {
  const [shown, setShown] = useState(hq)
  useEffect(() => {
    if (hq == null || shown === hq) return
    const t = setTimeout(() => setShown((v) => v + Math.sign(hq - v)), 45)
    return () => clearTimeout(t)
  }, [hq, shown])
  const below = hq != null && shown < THRESHOLD
  return (
    <button className={`hq-chip ${empty ? 'empty' : below ? 'bad' : 'good'}`} onClick={onClick} aria-label="HQ 리포트 열기">
      <span className="hq-k">HQ</span>
      <b key={shake}>{empty ? '—' : shown}</b>
      <div className="hq-side">
        <div className="hq-bar"><i style={{ width: `${empty ? 0 : Math.min(100, shown)}%` }} /><u style={{ left: `${THRESHOLD}%` }} /></div>
        <small>{empty ? 'Unread' : below ? `Below ${THRESHOLD}` : `Pass ${THRESHOLD}`}<kbd>H</kbd></small>
      </div>
    </button>
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
        <GlitchNum value={empty ? '' : shown} glitch={shake} />
      </div>
      <div className="inst-sub">{empty ? '미측정' : below ? '기준 미달' : '기준 통과'}</div>
    </div>
  )
}

// HQ를 누르면 열리는 측정 리포트. 항목 값은 HQ와 지금까지의 선택에서 계산한 연출용 수치다.
function HQReport({ state, onClose }) {
  // 리포트가 열려 있는 동안에는 진행·선택 키를 막는다
  useEffect(() => {
    const block = (e) => {
      if (e.target.closest?.('input, textarea')) return
      if (['Escape', 'h', 'H', 'ㅗ'].includes(e.key)) { e.stopImmediatePropagation(); onClose(); return }
      e.stopImmediatePropagation()
    }
    window.addEventListener('keydown', block, true)
    return () => window.removeEventListener('keydown', block, true)
  }, [onClose])
  const empty = state.hq == null
  const base = state.hq ?? 0
  const clamp = (v) => Math.max(8, Math.min(99, Math.round(v)))
  const items = [
    { label: '표정 안정성', v: clamp(base + 4 + state.std * 2) },
    { label: '공감 반응', v: clamp(base - 3 + state.ai * 1.2) },
    { label: '말과 표정의 일치', v: clamp(base + 1 - Math.abs(state.ai) * 0.6) },
    { label: '망설임 억제', v: clamp(base - 6 + state.std) },
  ]
  const below = !empty && base < THRESHOLD
  return (
    <div className="report-wrap" onClick={onClose}>
      <aside className="report" onClick={(e) => e.stopPropagation()}>
        <div className="rp-head">
          <span>Humeter Report</span>
          <button onClick={onClose}>닫기 <kbd>Esc</kbd></button>
        </div>
        <div className="rp-now">
          <b className={below ? 'bad' : 'good'}>{empty ? '미측정' : base}</b>
          <div>
            <span className={`rp-pill ${below ? 'bad' : 'good'}`}>{empty ? '측정 불가' : below ? `기준 ${THRESHOLD} 미달` : `기준 ${THRESHOLD} 통과`}</span>
            <p>곁에 있는 나인 <strong>88</strong></p>
          </div>
        </div>
        <div className="rp-sec">측정 항목</div>
        {items.map((it) => (
          <div className="rp-bar" key={it.label}>
            <span>{it.label}</span>
            <i><em style={{ width: `${empty ? 0 : it.v}%` }} className={it.v < THRESHOLD ? 'bad' : ''} /><u style={{ left: `${THRESHOLD}%` }} /></i>
            <b>{empty ? '' : it.v}</b>
          </div>
        ))}
        <div className="rp-sec">변동 기록</div>
        <ul className="rp-log">
          {[...state.hqLog].reverse().map((h, i) => (
            <li key={i}>
              <span className="rp-at">{h.at}</span>
              <span className="rp-why">{h.why}</span>
              <b className={h.from != null && h.to != null ? (h.to < h.from ? 'bad' : 'good') : ''}>
                {h.from != null && <s>{h.from}</s>}{h.to ?? '—'}
              </b>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

// 선택 직후 상대의 반응 한 줄. 몇 초 뒤 스스로 사라진다.
function ReactionToast({ react }) {
  const [out, setOut] = useState(false)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    const a = setTimeout(() => setOut(true), 3200)
    const b = setTimeout(() => setGone(true), 3700)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  if (gone) return null
  return (
    <div className={`react-toast ${out ? 'out' : ''} ${react.sign > 0 ? 'warm' : 'cool'}`}>
      <span className="rt-avatar">{react.who.slice(0, 1)}</span>
      <div><small>{react.who}</small><p>{react.text}</p></div>
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

function DiamondChoice({ beat, onPick }) {
  const [hover, setHover] = useState(null)

  return (
    <div className="diamond-choice">
      <div className="dc-center">
        <div className="dc-meta">
          <svg viewBox="0 0 20 20" width="14" height="14"><path d="M10 2 L18 10 L10 18 L2 10 Z" className={beat.axis} /></svg>
          <span><em className="dc-en">Choice {beat.num}</em>{beat.title}</span>
        </div>
        <div className="dc-who">
          <svg viewBox="0 0 12 12" width="10" height="10"><path d="M6 1 L11 6 L6 11 L1 6 Z" className={WHO_TONE[beat.who] ?? 'gray'} /></svg>
          {beat.who}
        </div>
        <p className="dc-prompt">{beat.prompt}</p>
        <div className={`dc-inner ${hover != null ? 'on' : ''}`}>
          {hover != null ? beat.options[hover].inner : ''}
        </div>
      </div>

      <div className="dc-opts">
        {beat.options.map((o, i) => (
          <button
            key={i}
            className={`dc-opt dc-opt-${i}`}
            onClick={() => onPick(i)}
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
  // 한 번 누르면 고른 카드가 빛나고 나머지가 흐려진 뒤 넘어간다
  const [picked, setPicked] = useState(null)
  const choose = (i) => {
    if (picked != null) return
    setPicked(i)
    setTimeout(() => onPick(beat.options[i].key), 900)
  }
  useEffect(() => {
    const onKey = (e) => { const i = Number(e.key) - 1; if (beat.options[i]) choose(i) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  return (
    <div className="diamond-choice final">
      <div className="dc-center">
        <div className="dc-meta">
          <svg viewBox="0 0 20 20" width="14" height="14"><path d="M10 2 L18 10 L10 18 L2 10 Z" className="end" /></svg>
          <span><em className="dc-en">Choice {beat.num}</em>{beat.title}</span>
        </div>
        <div className="dc-who">
          <svg viewBox="0 0 12 12" width="10" height="10"><path d="M6 1 L11 6 L6 11 L1 6 Z" className={WHO_TONE[beat.who] ?? 'gray'} /></svg>
          {beat.who}
        </div>
        <p className="dc-prompt">{beat.prompt}</p>
        <div className="dc-inner on">되돌릴 수 없는 선택입니다</div>
      </div>
      <div className="dc-opts final-opts">
        {beat.options.map((o, i) => (
          <button key={o.key} className={`dc-final-hold ${picked === i ? 'picked' : ''} ${picked != null && picked !== i ? 'faded' : ''}`} onClick={() => choose(i)}>
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
          </button>
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
    if (s.hq != null && s.hq !== state.hq) dispatch({ type: 'HQ', hq: s.hq, why: s.text.split('.')[0] })
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
        <ActButton key={done} className="final-opt task" onDone={() => {
          dispatch({ type: 'LOG', log: [{ kind: 'me', text: t.label }, { kind: 'narr', text: t.result }] })
          dispatch({ type: 'HQ', hq: t.hq, why: t.label })
          if (done + 1 >= end.tasks.length) setActed(true)
          else setDone(done + 1)
        }}>
          <b className="final-num">{done + 1}</b>
          <div><strong>{t.label}</strong><p>눌러서 실행</p></div>
        </ActButton>
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
        <ActButton className="final-opt danger" onDone={() => {
          dispatch({ type: 'LOG', log: { kind: 'narr', text: end.hold.result } })
          dispatch({ type: 'SET', set: state.final === 'zealot' ? { nineOff: true } : { tagEmpty: true } })
          if (state.final === 'outlier') dispatch({ type: 'HQ', hq: null, why: '휴미터 분리' })
          setActed(true)
        }}>
          <b className="final-num">!</b>
          <div><strong>{end.hold.label}</strong><p>되돌릴 수 없습니다</p></div>
        </ActButton>
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
  rewind: '오늘 하루가 스쳐 지나갑니다. 눌러서 넘길 수 있어요',
  gate: 'Scan Face를 눌러 측정하세요',
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

function Ending({ state, onBack, onRestart }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); onBack() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack])
  const end = ENDINGS[state.final]
  const pos = useMemo(() => ({ x: state.ai / 10, y: state.std / 2 }), [state.ai, state.std])
  return (
    <div className={`ending tone-${end.tone}`}>
      <section className="end-hero">
        <div className="end-photo" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}img/end-${state.final}.jpg)` }} />
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
          <div className="ec-head"><span>Where I Stand</span>두 개의 질문 위의 나</div>
          <Quadrant pos={pos} current={state.final} />
          <div className="axis-sum">
            <span><i className="dot ai" />AI 축 <b>{fmt(state.ai)}</b></span>
            <span><i className="dot std" />기준 축 <b>{fmt(state.std)}</b></span>
            <span>루트 <b>4{state.route}</b></span>
          </div>
        </div>
        <div className="end-card picks-card">
          <div className="ec-head"><span>My Choices</span>내가 한 선택</div>
          <ul className="picks2">
            {state.picks.map((p) => (
              <li key={p.id}>
                <span className={`pk-axis ${p.axis}`}>{p.axis === 'ai' ? 'AI' : '기준'}</span>
                <span className="pk-title">{p.title}</span>
                <span className="pk-text">{p.text}</span>
                <b className={p.delta > 0 ? 'plus' : 'minus'}>{fmt(p.delta)}</b>
              </li>
            ))}
          </ul>
        </div>
        <div className="end-actions">
        <button className="back-btn end-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M14 12 L8 12 M10 9 L7 12 L10 15" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          <span>← Back to the door</span>
        </button>
        <button className="btn-restart" onClick={onRestart}>
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          Play again
        </button>
        </div>
      </section>
    </div>
  )
}

const QUADS = [
  { key: 'zealot', name: 'The Zealot', ko: 'AI 적대 · HQ 맹신' },
  { key: 'adapter', name: 'The Adapter', ko: 'AI 인정 · HQ 인정' },
  { key: 'outlier', name: 'The Outlier', ko: 'AI 적대 · HQ 거부' },
  { key: 'insurgent', name: 'The Insurgent', ko: 'AI 인정 · HQ 거부' },
]
function Quadrant({ pos, current }) {
  const x = 50 + Math.max(-1, Math.min(1, pos.x)) * 42
  const y = 50 - Math.max(-1, Math.min(1, pos.y)) * 42
  return (
    <div className="quad">
      <span className="qa top">수긍</span><span className="qa bottom">반대</span>
      <span className="qa left">배척</span><span className="qa right">포용</span>
      <div className="quad-grid">
        {QUADS.map((q) => (
          <div key={q.key} className={`quad-cell ${q.key === current ? 'on' : ''}`}>
            <b>{q.name}</b><small>{q.ko}</small>
          </div>
        ))}
        <i className="quad-me" style={{ left: `${x}%`, top: `${y}%` }}><em>나</em></i>
      </div>
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
