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

// 길게 눌러야 실행되는 버튼. 진행률은 CSS 변수 --p(0~1)로 넘긴다.
export function HoldButton({ ms = 1200, onDone, className = '', children }) {
  const ref = useRef(null)
  const raf = useRef(0)
  const fired = useRef(false)

  const paint = (p) => ref.current?.style.setProperty('--p', p)
  const stop = () => {
    cancelAnimationFrame(raf.current)
    if (!fired.current) paint(0)
    ref.current?.classList.remove('holding')
  }
  const start = (e) => {
    if (fired.current) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    ref.current.classList.add('holding')
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms)
      paint(p)
      if (p >= 1) { fired.current = true; ref.current?.classList.add('fired'); onDone?.(); return }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return (
    <button ref={ref} className={`hold ${className}`} onPointerDown={start} onPointerUp={stop} onPointerCancel={stop} onPointerLeave={stop}>
      {children}
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
