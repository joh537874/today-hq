import React, { useEffect, useRef, useState } from 'react'
import { THRESHOLD } from './story.js'
import { Figure, ScanMarker } from './ui.jsx'

const PHOTO = { home: 'home2', cafe: 'cafe2', street: 'street2', subway: 'subway2', door: 'door' }

const TIME = { home: '23:48', cafe: '08:12', street: '08:31', subway: '18:40', door: '19:06' }

export default function Scene({ beat, set, hq, next, dispatch, reply, onReply, picks = [] }) {
  const View = { home: Home, cafe: Cafe, street: Street, subway: Subway, door: Door }[beat.scene]
  return (
    <section className={`scene scene-${beat.scene} ${set.tv === 'breaking' ? 'tv-on' : ''} ${beat.shot ? 'shot-on' : ''}`} key={beat.scene}>
      <div className="scene-photo" key={beat.shot ?? 'base'} style={{ backgroundImage: `url(${import.meta.env.BASE_URL}img/${beat.shot ?? PHOTO[beat.scene]}.jpg)` }} />
      <div className="scene-inner">
        {/* 1인칭 HUD 상단 — 시간, 장소 */}
        <div className="hud-top-bar">
          <span className="hud-time">{TIME[beat.scene]}</span>
          <span className="hud-loc">{beat.place}</span>
        </div>

        <View beat={beat} set={set} hq={hq} next={next} dispatch={dispatch} />

        {beat.type === 'notify' && <Notify beat={beat} />}
        {beat.type === 'message' && <Message key={beat.text} beat={beat} reply={reply} onReply={onReply} />}
        {beat.type === 'gate' && <Gate key={beat.at} beat={beat} hq={hq} next={next} />}
        {beat.type === 'term' && beat.scene !== 'home' && <Term key={beat.term} beat={beat} />}
        {beat.type === 'letter' && <Letter beat={beat} next={next} picks={picks} />}

        {/* 1인칭 HUD — 화면 모서리 장식 */}
        <div className="hud-corner hud-tl" />
        <div className="hud-corner hud-tr" />
        <div className="hud-corner hud-bl" />
        <div className="hud-corner hud-br" />
      </div>
    </section>
  )
}

/* ───────── 장면 */

function Home({ beat, set }) {
  const on = set.tv === 'breaking'
  return (
    <>
      {on && <Broadcast beat={beat} />}
      {set.nine && <Figure name="나인" hq="88" tone="ai" ai style={{ left: '74%' }} />}
    </>
  )
}

// 프롤로그 뉴스. 화면이 TV로 다가가고, 방송 화면이 장면을 가득 채운다.
function Broadcast({ beat }) {
  const term = beat.type === 'term'
  return (
    <div className="bc">
      <div className="bc-screen">
        <div className="bc-top">
          <div className="bc-bug"><i />LIVE<span>HQN 뉴스</span></div>
          <div className="bc-clock">2069. 3. 14 · 23:48</div>
        </div>

        {term ? (
          <div className="bc-body" key={beat.term}>
            <div className="bc-eyebrow">용어 해설</div>
            <div className="bc-term-card">
              <div className="bc-dot-title"><i className="ai" />{beat.en}</div>
              <h3>{beat.term}</h3>
              <p>{beat.text}</p>
            </div>
          </div>
        ) : (
          <div className="bc-body">
            <div className="bc-eyebrow">Breaking News</div>
            <h2 className="bc-title">AI 평균 HQ가 인간을 넘어섰습니다</h2>
            <div className="bc-cards">
              <div className="bc-card">
                <div className="bc-dot-title"><i className="ai" />AI 평균</div>
                <b className="ai"><Count to={82} /></b>
              </div>
              <div className="bc-cross">크로스오버</div>
              <div className="bc-card">
                <div className="bc-dot-title"><i className="human" />인간 평균</div>
                <b><Count to={81} /></b>
              </div>
            </div>
          </div>
        )}

        <div className="bc-foot">
          <span className="bc-tag">속보</span>
          <div className="bc-ticker"><span>관측 이래 처음으로 AI가 인간을 넘어섰습니다 · HQ 관리국 “기준 재검토 착수” · 내일부터 관리국 기준 v.48 적용 · 주요 매장 입장 기준 상향 예정 · 관측 이래 처음으로 AI가 인간을 넘어섰습니다 · HQ 관리국 “기준 재검토 착수” · 내일부터 관리국 기준 v.48 적용 · 주요 매장 입장 기준 상향 예정 ·&nbsp;</span></div>
        </div>
      </div>
    </div>
  )
}

function Count({ to, ms = 1400 }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf, t0
    const tick = (t) => {
      t0 ??= t
      const p = Math.min(1, (t - t0) / ms)
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms])
  return n
}

function Cafe({ set }) {
  return (
    <>
      <div className="shop">
        <div className="shop-sign">CAFÉ ORDINARY</div>
        <div className="shop-door" />
        {set.gate && (
          <ScanMarker label={`기준 ${THRESHOLD}`} active style={{ position: 'absolute', right: -50, top: 200 }} />
        )}
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
        <Figure name="재이" hq="?" tone="mono" style={{ left: '14%' }} className="protester">
          <div className="picket">HQ 폐지</div>
        </Figure>
      )}
    </>
  )
}

// subway2.jpg 속 승객 다섯 명의 얼굴 위치(화면 대비 %)
const PASSENGERS = [
  { hq: 84, x: 6.8, y: 30 }, { hq: 77, x: 23.4, y: 29 }, { hq: 68, x: 39.8, y: 32 }, { hq: 90, x: 53, y: 32, ai: true }, { hq: 79, x: 68.6, y: 29 },
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
      {glancing && PASSENGERS.map((p, k) => (
        <button
          key={k}
          className={`look-spot ${seen.includes(k) ? 'seen' : ''} ${p.ai ? 'ai' : ''}`}
          style={{ left: `${p.x}%`, top: `${p.y * 10.8}px` }}
          onPointerEnter={() => look(k)} onClick={() => look(k)}
        >
          {seen.includes(k) ? <b>{p.hq}</b> : <i />}
        </button>
      ))}
      {set.julian && <Figure name="줄리안" hq="92" tone="violet" className="front" style={{ left: '30%' }} />}
      {set.julian && <Figure name="나인" hq="88" tone="ai" ai className="front" style={{ left: '62%' }} />}
      {glancing && (
        <div className="glance-bar">
          <svg viewBox="0 0 16 16" width="12" height="12"><path d="M8 2 L14 8 L8 14 L2 8 Z" fill="currentColor" opacity=".5" /></svg>
          <span>흘끗 본 사람 {seen.length} / {PASSENGERS.length}</span>
          <button className="btn light" disabled={!enough} onClick={() => next({ kind: 'narr', text: '창에 비친 내 얼굴 위에도 숫자가 떠 있다. 72.' })}>
            {enough ? '시선을 거둔다' : `${beat.need}명 이상 관찰`}
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
      {set.panel && (
        <ScanMarker
          label={`기준 ${THRESHOLD}`}
          active={!set.passed}
          style={{ position: 'absolute', left: 'calc(50% + 200px)', top: 300 }}
        />
      )}
      <button className={`bell ${beat.type === 'bell' ? 'live' : ''}`} disabled={beat.type !== 'bell'} onClick={() => next({ kind: 'narr', text: '손가락이 초인종 위에서 멈춘다.' })}>
        <i />
        {beat.type === 'bell' && <ScanMarker active style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)' }} />}
      </button>
      {set.open && !set.passed && <Figure name="클로이" hq="91" tone="teal" className="in-door" style={{ left: '52%' }} />}
      {set.nine && <Figure name="나인" hq={set.nineOff ? '' : '88'} tone="ai" ai off={set.nineOff} style={{ left: '80%' }} />}
      {set.memory && <div className="memory">"AI 몸 안에 있는 휴미터를 꺼내서 끼우면 돼."</div>}
      {set.hands && (
        <div className="hands">
          <div className="hand flower"><i />꽃</div>
          <div className={`hand letter ${beat.type === 'letter' ? 'live' : ''}`}>
            <i />편지
            {beat.type === 'letter' && <ScanMarker active style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)' }} />}
          </div>
        </div>
      )}
    </>
  )
}

/* ───────── 장면 위에 뜨는 인터랙션 */

function Notify({ beat }) {
  const [open, setOpen] = useState(false)
  const diff = beat.prevHq != null ? beat.title.match(/\d+/)?.[0] - beat.prevHq : null
  return (
    <button className={`notify ${open ? 'open' : ''}`} onClick={() => setOpen((v) => !v)}>
      <div className="notify-head">
        <span>{beat.app}</span>
        <em>지금</em>
      </div>
      <strong>{beat.title}</strong>
      <p>{beat.body}</p>
      {open && beat.prevHq != null && (
        <div className="notify-more">
          <div className="nm-row"><span>어제</span><b>{beat.prevHq}</b><span>오늘</span><b className="bad">{beat.title.match(/\d+/)?.[0]}</b><em>{diff < 0 ? `−${-diff}` : `+${diff}`}</em></div>
          <p>측정 방식이 바뀌었습니다. 어제와 달라진 행동은 감지되지 않았습니다.</p>
        </div>
      )}
      {!open && beat.prevHq != null && <small className="notify-tap">눌러서 자세히 보기</small>}
    </button>
  )
}

function Term({ beat }) {
  return (
    <div className="term-card">
      <small>{beat.en}</small>
      <h3>{beat.term}</h3>
      <p>{beat.text}</p>
      <div className="term-line" />
    </div>
  )
}

// 클로이의 연락. 폰 안에서 추천 답장을 고르거나 직접 입력해 보낸다.
function Message({ beat, reply, onReply }) {
  const [typing, setTyping] = useState(true)
  const [text, setText] = useState('')
  const canReply = beat.replies.length > 0
  useEffect(() => { const t = setTimeout(() => setTyping(false), 1100); return () => clearTimeout(t) }, [])
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input')) return
      const i = Number(e.key) - 1
      if (!typing && canReply && i >= 0 && i < beat.replies.length) onReply(beat.replies[i])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  const send = () => { const t = text.trim(); if (t) onReply(t) }
  return (
    <div className="phone2-wrap">
      <div className="phone2">
        <div className="p2-status"><span>{beat.scene === 'home' ? '23:52' : '19:07'}</span><i className="p2-island" /><span className="p2-bat"><b /></span></div>
        <div className="p2-head">
          <span className="p2-back">‹</span>
          <div className="p2-avatar">{beat.from.slice(0, 1)}</div>
          <div className="p2-who"><strong>{beat.from}</strong><small>HQ 91</small></div>
        </div>
        <div className="p2-chat">
          <div className="p2-day">오늘</div>
          {typing
            ? <div className="p2-bubble in typing"><i /><i /><i /></div>
            : <div className="p2-bubble in">{beat.text}</div>}
          {reply && reply !== '__none' && <div className="p2-bubble out">{reply}<small>읽음</small></div>}
        </div>

        {!typing && !reply && (
          <div className="p2-quick">
            {canReply
              ? beat.replies.map((r, i) => (
                <button key={r} onClick={() => onReply(r)}><kbd>{i + 1}</kbd>{r}</button>
              ))
              : <button className="ghost" onClick={() => onReply(null)}>답장하지 않고 화면을 끈다</button>}
          </div>
        )}

        <form className={`p2-input ${reply ? 'sent' : ''}`} onSubmit={(e) => { e.preventDefault(); send() }}>
          <input
            value={reply ? '' : text}
            onChange={(e) => setText(e.target.value)}
            placeholder={reply ? '' : canReply ? '직접 입력해서 보내기' : '답장할 말이 떠오르지 않는다'}
            disabled={!!reply || typing || !canReply}
            maxLength={60}
          />
          <button type="submit" disabled={!text.trim() || !!reply} aria-label="보내기">↑</button>
        </form>
      </div>
    </div>
  )
}

function Gate({ beat, hq, next }) {
  const [phase, setPhase] = useState('idle') // idle → camera → scan → fail
  const [n, setN] = useState(0)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // 카메라 시작
  const startCamera = async () => {
    setPhase('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      // 카메라 권한 거부 시 바로 스캔 진행
      setPhase('scan')
    }
  }

  // 카메라 켜진 후 2.5초 뒤 자동으로 스캔 시작
  useEffect(() => {
    if (phase !== 'camera') return
    const t = setTimeout(() => setPhase('scan'), 2500)
    return () => clearTimeout(t)
  }, [phase])

  // 스캔 카운트
  useEffect(() => {
    if (phase !== 'scan') return
    if (n >= hq) { const t = setTimeout(() => setPhase('fail'), 350); return () => clearTimeout(t) }
    const t = setTimeout(() => setN((v) => Math.min(hq, v + 3)), 28)
    return () => clearTimeout(t)
  }, [phase, n, hq])

  // 실패 후 진행
  useEffect(() => {
    if (phase !== 'fail') return
    const t = setTimeout(() => next({ kind: 'sys', who: beat.at, text: `입장 기준 ${THRESHOLD}. 측정값 ${hq}. ${beat.fail}. ${beat.after}` }), 1700)
    return () => clearTimeout(t)
  }, [phase]) // eslint-disable-line

  // 카메라 정리
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])

  return (
    <div className={`gate ${phase}`}>
      <div className="gate-head">
        <span>{beat.at}</span>
        <em>기준 {THRESHOLD}</em>
      </div>

      {phase === 'idle' && (
        <button className="gate-cam-btn" onClick={startCamera}>
          <div className="gate-cam-icon">
            <svg viewBox="0 0 48 48" width="48" height="48">
              <path d="M24 4 L44 24 L24 44 L4 24 Z" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".4" />
              <circle cx="24" cy="22" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M24 32 Q16 34 14 40" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".5" />
              <path d="M24 32 Q32 34 34 40" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".5" />
            </svg>
          </div>
          <span>카메라로 스캔</span>
        </button>
      )}

      {(phase === 'camera' || phase === 'scan' || phase === 'fail') && (
        <div className="gate-camera">
          <div className="gate-viewfinder">
            <video ref={videoRef} className="gate-video" playsInline muted />
            {/* 뷰파인더 코너 */}
            <i className="vf-corner vf-tl" /><i className="vf-corner vf-tr" />
            <i className="vf-corner vf-bl" /><i className="vf-corner vf-br" />
            {/* 스캔라인 */}
            {phase === 'camera' && <div className="gate-scanline-cam" />}
            {phase === 'camera' && <div className="gate-cam-label">얼굴을 인식하고 있습니다…</div>}
          </div>

          {phase !== 'camera' && (
            <div className="gate-read">
              <div className="gate-scanline" />
              <div className="gate-num">{n}</div>
              <div className="gate-line">
                <i style={{ width: `${n}%` }} />
                <b style={{ left: `${THRESHOLD}%` }} />
              </div>
              <div className="gate-msg">
                {phase === 'scan' ? (
                  <span className="gate-dots">측정 중</span>
                ) : (
                  <span className="gate-fail-text">{beat.fail}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 문 앞에서 내려다보는 편지. ③에서 나인의 SNS 검색을 받았는지에 따라 편지 내용이 달라진다.
const LETTER_SNS = [
  { t: '생일 축하해, 클로이!', tag: '추천 문장' },
  { t: '올해도 너의 반짝이는 하루들을 응원할게.', tag: '추천 문장' },
  { t: '요즘 빠져 있다는 필름 카메라처럼, 오래 남는 순간만 가득하길.', tag: 'SNS에서 찾음' },
  { t: '언제나 고마운 친구에게.', tag: '추천 문장' },
]
const LETTER_OWN = [
  { t: '생일 축하해.' },
  { t: '뭐라고 써야 할지 몰라서 세 번 다시 썼어.', strike: '너는 늘 완벽해서' },
  { t: '줄 서서 커피 기다리다 처음 말 걸었던 날, 아직 기억나.' },
  { t: '숫자 말고, 그냥 오늘 보고 싶어서 가.' },
]

function Letter({ beat, next, picks }) {
  const [n, setN] = useState(0)
  const sns = picks.find((p) => p.id === 'c3')?.sign > 0
  const body = sns ? LETTER_SNS : LETTER_OWN
  const open = n > 0
  const done = n > beat.lines.length
  return (
    <div className={`letter-view ${open ? 'open' : ''}`}>
      {!open && (
        <button className="letter-open-btn" onClick={() => setN(1)}>
          <span>편지를 내려다본다</span>
        </button>
      )}
      {open && (
        <div className="letter-spread" onClick={() => (done ? next(beat.lines.map((t) => ({ kind: 'narr', text: t }))) : setN(n + 1))}>
          <div className={`paper ${sns ? 'typed' : 'hand'}`}>
            <small>클로이에게</small>
            {body.map((l, i) => (
              <p key={i} style={{ animationDelay: `${i * 0.25}s` }}>
                {l.strike && <del>{l.strike}</del>}{l.t}
                {l.tag && <span className="ltag">{l.tag}</span>}
              </p>
            ))}
            <div className="sign">진</div>
          </div>
          <div className="letter-thoughts">
            {beat.lines.slice(0, n - 1).map((t) => <p key={t}>{t}</p>)}
            <span className="paper-next">{done ? '편지를 접는다' : n === 1 ? '눌러서 다시 생각해 보기' : '계속'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
