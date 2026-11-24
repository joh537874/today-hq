// 배경음·환경음(반복)과 효과음(한 번) 재생. 파일은 public/sound/ 아래 이름.mp3.
const BASE = import.meta.env.BASE_URL
const src = (name) => `${BASE}sound/${name}.mp3`
const VOL = { bgm: 0.35, amb: 0.22, sfx: 0.7 }
const FADE_MS = 1000
let muted = false
const loops = [] // 현재 재생 중인 반복 음원 { audio, kind }

// 음량을 ms 동안 to까지 옮긴다. 끝나면 done을 부른다.
function ramp(audio, to, ms, done) {
  const from = audio.volume
  const t0 = performance.now()
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms)
    audio.volume = from + (to - from) * k
    if (k < 1) requestAnimationFrame(step)
    else done?.()
  }
  requestAnimationFrame(step)
}

// 같은 종류의 반복 음원은 하나만 재생한다. 바뀌면 1초 동안 겹쳐 넘어간다.
function makeLoop(kind) {
  let name = null
  let audio = null
  const set = (next) => {
    next = next || null
    if (next === name) return
    name = next
    if (audio) {
      const old = audio
      ramp(old, 0, FADE_MS, () => old.pause())
    }
    audio = null
    if (!next) return
    const a = new Audio(src(next))
    a.loop = true
    a.volume = 0
    a.play().catch(() => {})
    ramp(a, muted ? 0 : VOL[kind], FADE_MS)
    audio = a
  }
  loops.push(() => audio && ramp(audio, muted ? 0 : VOL[kind], 300))
  return set
}

export const setBgm = makeLoop('bgm')
export const setAmb = makeLoop('amb')

export function sfx(name) {
  if (!name || muted) return
  const a = new Audio(src(name))
  a.volume = VOL.sfx
  a.play().catch(() => {})
}

export function stopAll() {
  setBgm(null)
  setAmb(null)
}

// 소리 끄기·켜기. 반복 음원은 0.3초에 걸쳐 줄이거나 되살린다.
export function setMuted(m) {
  muted = m
  loops.forEach((apply) => apply())
}
