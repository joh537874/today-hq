import React, { useEffect, useState } from 'react'
import { THRESHOLD } from './story.js'
import { Figure, HoldButton } from './ui.jsx'

const TIME = { home: '23:48', cafe: '08:12', street: '08:31', subway: '18:40', door: '19:06' }

export default function Scene({ beat, set, hq, next, dispatch }) {
  const View = { home: Home, cafe: Cafe, street: Street, subway: Subway, door: Door }[beat.scene]
  return (
    <section className={`scene scene-${beat.scene}`} key={beat.scene}>
      <div className="scene-inner">
      <div className="scene-meta"><span>{TIME[beat.scene]}</span><span>{beat.place}</span></div>
      <View beat={beat} set={set} hq={hq} next={next} dispatch={dispatch} />

      {beat.type === 'notify' && <Notify beat={beat} />}
      {beat.type === 'message' && <Message key={beat.text} beat={beat} next={next} />}
      {beat.type === 'gate' && <Gate key={beat.at} beat={beat} hq={hq} next={next} />}
      {beat.type === 'term' && <Term key={beat.term} beat={beat} />}
      {beat.type === 'letter' && <Letter beat={beat} next={next} />}
      <div className="scene-place">{beat.place}</div>
      </div>
    </section>
  )
}

/* ───────── 장면 */

function Home({ beat, set }) {
  return (
    <>
      <div className={`tv ${set.tv ?? 'idle'}`}>
        <div className="tv-bar"><b>속보</b><span>HQ 관리국 발표</span></div>
        {beat.type === 'news' || set.tv === 'breaking' ? (
          <div className="tv-body">
            <h3>{beat.headline ?? 'AI 평균 HQ 82, 인간 평균 81'}</h3>
            <div className="tv-bars">
              <div><span>AI 평균</span><i style={{ width: '82%' }} className="ai" /><b>82</b></div>
              <div><span>인간 평균</span><i style={{ width: '81%' }} /><b>81</b></div>
            </div>
            <p>{beat.sub ?? '관측 이래 처음으로 AI가 인간을 넘어섰습니다'}</p>
          </div>
        ) : (
          <div className="tv-body idle"><h3>밤 11시 뉴스</h3><p>잠시 후 HQ 관리국의 발표가 이어집니다</p></div>
        )}
        <div className="tv-ticker"><span>AI 평균 HQ 82 · 인간 평균 81 · 크로스오버 · 관리국 “기준 재검토 착수” · AI 평균 HQ 82 · 인간 평균 81 · 크로스오버 · 관리국 “기준 재검토 착수” ·&nbsp;</span></div>
      </div>
      {set.nine && <Figure name="나인" hq="88" tone="ai" ai style={{ left: '78%' }} />}
    </>
  )
}

function Cafe({ set }) {
  return (
    <>
      <div className="shop">
        <div className="shop-sign">CAFÉ ORDINARY</div>
        <div className="shop-door" />
        {set.gate && <div className="shop-panel"><span>입장 기준</span><b>{THRESHOLD}</b></div>}
      </div>
      {set.coffee && <Figure name="나인" hq="88" tone="ai" ai style={{ left: '78%' }}><div className="cups"><i /><i /></div></Figure>}
      {set.man && <Figure name="줄 끝의 남자" hq="70" tone="gray" style={{ left: '16%' }} />}
    </>
  )
}

const ADS = ['HQ 올리는 아침 루틴 7가지', '표정 교정 클리닉 · 첫 달 무료', '당신의 공감, 몇 점입니까?']

function Street({ set }) {
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI((v) => (v + 1) % ADS.length), 2600); return () => clearInterval(t) }, [])
  return (
    <>
      <div className="skyline" />
      {set.ad && (
        <div className="billboard">
          <small>AD</small>
          <h3 key={i}>{ADS[i]}</h3>
          <div className="bb-dots">{ADS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
        </div>
      )}
      <Figure name="나인" hq="88" tone="ai" ai style={{ left: '74%' }} />
      {set.protest && (
        <Figure name="재이" hq="—" tone="mono" style={{ left: '14%' }} className="protester">
          <div className="picket">HQ 폐지</div>
        </Figure>
      )}
    </>
  )
}

const PASSENGERS = [
  { hq: 84, x: 10 }, { hq: 77, x: 26 }, { hq: 90, x: 42, ai: true }, { hq: 68, x: 58 }, { hq: 81, x: 74 }, { hq: 79, x: 90 },
]

function Subway({ beat, set, hq, next }) {
  const [seen, setSeen] = useState([])
  const glancing = beat.type === 'glance'
  const look = (k) => glancing && !seen.includes(k) && setSeen([...seen, k])
  const enough = glancing && seen.length >= beat.need
  return (
    <>
      <div className="train-windows"><i /><i /><i /><i /></div>
      <div className="reflection"><span>창에 비친 나</span><b>{hq}</b></div>
      <div className="train-pole" /><div className="train-seat" />
      {PASSENGERS.map((p, k) => (
        <Figure
          key={k} hq={p.hq} ai={p.ai} tone={p.ai ? 'ai' : 'gray'}
          hidden={glancing && !seen.includes(k)}
          className={`passenger ${glancing ? 'lookable' : ''} ${set.julian || set.child ? 'dim' : ''} ${set.child && p.ai ? 'focus' : ''}`}
          style={{ left: `${p.x}%` }} onPointerEnter={() => look(k)}
        >
          {set.child && p.ai && <div className="child" />}
        </Figure>
      ))}
      {set.julian && <Figure name="줄리안" hq="92" tone="violet" className="front" style={{ left: '30%' }} />}
      {set.julian && <Figure name="나인" hq="88" tone="ai" ai className="front" style={{ left: '62%' }} />}
      {glancing && (
        <div className="glance-bar">
          <span>흘끗 본 사람 {seen.length} / {PASSENGERS.length}</span>
          <button className="btn light" disabled={!enough} onClick={() => next({ kind: 'narr', text: '창에 비친 내 얼굴 위에도 숫자가 떠 있다. 72.' })}>
            {enough ? '시선을 거둔다' : `${beat.need}명 이상 보기`}
          </button>
        </div>
      )}
    </>
  )
}

function Door({ beat, set, next }) {
  return (
    <>
      <div className={`house-door ${set.open ? 'open' : ''}`}><div className="door-leaf" /><div className="door-glow" /></div>
      {set.panel && <div className={`door-panel ${set.passed ? 'pass' : ''}`}><span>입장 기준</span><b>{THRESHOLD}</b></div>}
      <button className={`bell ${beat.type === 'bell' ? 'live' : ''}`} disabled={beat.type !== 'bell'} onClick={() => next({ kind: 'narr', text: '손가락이 초인종 위에서 멈춘다.' })}>
        <i />
      </button>
      {set.open && !set.passed && <Figure name="클로이" hq="91" tone="teal" className="in-door" style={{ left: '52%' }} />}
      {set.nine && <Figure name="나인" hq={set.nineOff ? '' : '88'} tone="ai" ai off={set.nineOff} style={{ left: '80%' }} />}
      {set.memory && <div className="memory">“AI 몸 안에 있는 휴미터를 꺼내서 끼우면 돼.”</div>}
      {set.hands && (
        <div className="hands">
          <div className="hand flower"><i />꽃</div>
          <div className={`hand letter ${beat.type === 'letter' ? 'live' : ''}`}><i />편지</div>
        </div>
      )}
    </>
  )
}

/* ───────── 장면 위에 뜨는 인터랙션 */

function Notify({ beat }) {
  return (
    <div className="notify">
      <div className="notify-app"><i className="dot std" />{beat.app}<span>지금</span></div>
      <strong>{beat.title}</strong>
      <p>{beat.body}</p>
    </div>
  )
}

function Term({ beat }) {
  return (
    <div className="term-card">
      <small>{beat.en}</small>
      <h3>{beat.term}</h3>
      <p>{beat.text}</p>
    </div>
  )
}

function Message({ beat, next }) {
  return (
    <div className="phone">
      <div className="phone-head"><i className="avatar" />{beat.from}</div>
      <div className="bubble in">{beat.text}</div>
      <div className="phone-replies">
        {beat.replies.length > 0
          ? beat.replies.map((r) => <button key={r} className="bubble out" onClick={() => next({ kind: 'me', text: r })}>{r}</button>)
          : <button className="bubble out ghost" onClick={() => next({ kind: 'narr', text: '답장을 쓰지 못하고 화면을 끈다.' })}>답장하지 않고 화면을 끈다</button>}
      </div>
    </div>
  )
}

function Gate({ beat, hq, next }) {
  const [phase, setPhase] = useState('idle') // idle → scan → fail
  const [n, setN] = useState(0)
  useEffect(() => {
    if (phase !== 'scan') return
    if (n >= hq) { const t = setTimeout(() => setPhase('fail'), 350); return () => clearTimeout(t) }
    const t = setTimeout(() => setN((v) => Math.min(hq, v + 3)), 28)
    return () => clearTimeout(t)
  }, [phase, n, hq])
  useEffect(() => {
    if (phase !== 'fail') return
    const t = setTimeout(() => next({ kind: 'sys', who: beat.at, text: `입장 기준 ${THRESHOLD}. 측정값 ${hq}. ${beat.fail}. ${beat.after}` }), 1700)
    return () => clearTimeout(t)
  }, [phase]) // eslint-disable-line
  return (
    <div className={`gate ${phase}`}>
      <div className="gate-head"><span>{beat.at}</span><em>입장 기준 {THRESHOLD}</em></div>
      {phase === 'idle' && (
        <HoldButton className="gate-pad" ms={1100} onDone={() => setPhase('scan')}>
          <span className="ring" /><b>길게 눌러 스캔</b>
        </HoldButton>
      )}
      {phase !== 'idle' && (
        <div className="gate-read">
          <div className="gate-num">{n}</div>
          <div className="gate-line"><i style={{ width: `${n}%` }} /><b style={{ left: `${THRESHOLD}%` }} /></div>
          <div className="gate-msg">{phase === 'scan' ? '측정 중' : beat.fail}</div>
        </div>
      )}
    </div>
  )
}

function Letter({ beat, next }) {
  const [n, setN] = useState(0)
  const open = n > 0
  const done = n >= beat.lines.length
  return (
    <div className={`letter-view ${open ? 'open' : ''}`}>
      {!open && <button className="btn light" onClick={() => setN(1)}>편지를 내려다본다</button>}
      {open && (
        <div className="paper" onClick={() => (done ? next(beat.lines.map((t) => ({ kind: 'narr', text: t }))) : setN(n + 1))}>
          <small>클로이에게</small>
          {beat.lines.slice(0, n).map((t) => <p key={t}>{t}</p>)}
          <span className="paper-next">{done ? '편지를 접는다' : '눌러서 계속 읽기'}</span>
        </div>
      )}
    </div>
  )
}
