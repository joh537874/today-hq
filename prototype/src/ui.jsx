import { useEffect, useState } from 'react'

// 관리자 화면의 '즉시 표시'. 켜면 타이핑 없이 문장 전체를 바로 보여 준다.
let instant = false
export const setInstant = (v) => { instant = v }

// 글자를 한 자씩 찍는다. key가 바뀌면 처음부터 다시 찍는다.
export function useTypewriter(full, key, speed = 26) {
  const [n, setN] = useState(0)
  useEffect(() => { setN(0) }, [key])
  useEffect(() => {
    if (n >= full.length) return
    const t = setTimeout(() => setN((v) => v + 1), speed)
    return () => clearTimeout(t)
  }, [n, full, speed])
  if (instant) return { text: full, done: true, finish: () => {} }
  return { text: full.slice(0, n), done: n >= full.length, finish: () => setN(full.length) }
}
