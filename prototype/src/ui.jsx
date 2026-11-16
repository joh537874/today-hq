import React, { useEffect, useRef, useState } from 'react'

// 글자를 한 자씩 찍는다. key가 바뀌면 처음부터 다시 찍는다.
export function useTypewriter(full, key, speed = 26) {
  const [n, setN] = useState(0)
  useEffect(() => { setN(0) }, [key])
  useEffect(() => {
    if (n >= full.length) return
    const t = setTimeout(() => setN((v) => v + 1), speed)
    return () => clearTimeout(t)
  }, [n, full, speed])
  return { text: full.slice(0, n), done: n >= full.length, finish: () => setN(full.length) }
}

// 누르면 실행되는 버튼. confirm이면 첫 클릭은 고르기만 하고, 같은 버튼을 한 번 더 눌러야 실행된다.
// armed/onArm을 넘기면 여러 버튼 중 하나만 골라진 상태를 부모가 관리한다.
export function ActButton({ onDone, confirm = false, armed = false, onArm, className = '', children }) {
  const [fired, setFired] = useState(false)
  const click = () => {
    if (fired) return
    if (confirm && !armed) return onArm?.()
    setFired(true)
    onDone?.()
  }
  return (
    <button className={`act-btn ${armed ? 'armed' : ''} ${fired ? 'fired' : ''} ${className}`} onClick={click}>
      {children}
      {confirm && <span className="act-confirm">{armed ? '한 번 더 눌러 확정' : '눌러서 고르기'}</span>}
    </button>
  )
}

// 머리 위에 HQ 태그가 떠 있는 사람 실루엣.
export function Figure({ name, hq, tone = 'gray', ai = false, off = false, style, hidden = false, className = '', children, ...rest }) {
  return (
    <div className={`fig tone-${tone} ${off ? 'off' : ''} ${hidden ? 'tag-hidden' : ''} ${className}`} style={style} {...rest}>
      <div className="fig-tag">{hq}</div>
      <div className="fig-head" />
      <div className="fig-body">{ai && <i className="neck" />}</div>
      {name && <div className="fig-name">{name}</div>}
      {children}
    </div>
  )
}

// 디트로이트식 챕터 타이틀 카드 — 장 전환 시 풀스크린 표시
export function ChapterCard({ chapter, title, place, onDone, slow }) {
  const [phase, setPhase] = useState('enter') // enter → hold → exit
  const d = slow ? 1.8 : 1 // 1장은 1.8배 느리게
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 800 * d)
    const t2 = setTimeout(() => setPhase('exit'), 2800 * d)
    const t3 = setTimeout(() => onDone?.(), 3600 * d)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, []) // eslint-disable-line
  return (
    <div className={`chapter-card ${phase}`}>
      <div className="ch-line" />
      <div className="ch-label">{chapter}</div>
      <h2 className="ch-title">{title}</h2>
      <div className="ch-place">{place}</div>
      <div className="ch-line" />
    </div>
  )
}

// 선택 후 관계 변화 플래시 — "나인 ▲" 같은 게 잠깐 뜨고 사라짐
export function RelationFlash({ who, direction }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(t)
  }, [])
  if (!visible) return null
  return (
    <div className={`relation-flash ${direction > 0 ? 'up' : 'down'}`}>
      <span className="rf-who">{who}</span>
      <span className="rf-arrow">{direction > 0 ? '▲' : '▼'}</span>
    </div>
  )
}

// 디트로이트식 스캔 마커 — 인터랙티브 오브젝트 위에 뜨는 다이아몬드
export function ScanMarker({ label, active, style, onClick }) {
  return (
    <button className={`scan-marker ${active ? 'active' : ''}`} style={style} onClick={onClick}>
      <svg className="sm-diamond" viewBox="0 0 24 24" width="24" height="24">
        <path d="M12 2 L22 12 L12 22 L2 12 Z" />
      </svg>
      {label && <span className="sm-label">{label}</span>}
    </button>
  )
}

// 글리치 텍스트 효과 — HQ 숫자가 바뀔 때 사용
export function GlitchNum({ value, glitch }) {
  const [offset, setOffset] = useState(false)
  useEffect(() => {
    if (!glitch) return
    setOffset(true)
    const t = setTimeout(() => setOffset(false), 400)
    return () => clearTimeout(t)
  }, [glitch])
  return (
    <span className={`glitch-num ${offset ? 'glitching' : ''}`} data-text={value}>
      {value}
    </span>
  )
}
