// 배경음·환경음(반복)과 효과음(한 번) 재생. 파일은 public/sound/ 아래 이름.mp3.
const BASE = import.meta.env.BASE_URL
const src = (name) => `${BASE}sound/${name}.mp3`
const VOL = { bgm: 0.35, amb: 0.22, sfx: 0.7, vib: 0.8 }
const FADE_MS = 1000
// 파일별 보정 배율. 측정 음량(LUFS)이 기준 -20보다 큰 음원만 기준에 맞춰 줄인다(2026-11-28 ebur128 측정).
// 예: vibrate -3.1 LUFS → 약 -17dB, call-connect -8.8 LUFS → 약 -11dB.
const LUFS = { vibrate: -3.1, 'call-connect': -8.8, 'child-cry': -16.3, phone: -16.9, news: -17.1, humeter: -18.4 }
const gain = (name) => (LUFS[name] ? Math.pow(10, (-20 - LUFS[name]) / 20) : 1)
let muted = false
export const isMuted = () => muted
const loops = [] // 현재 재생 중인 반복 음원 { audio, kind }

// 음량을 ms 동안 to까지 옮긴다. 끝나면 done을 부른다.
// 같은 음원에 새 변화가 시작되면 이전 변화는 멈춘다. 음량은 0~1 범위로 자른다.
function ramp(audio, to, ms, done) {
  const from = audio.volume
  const t0 = performance.now()
  const id = (audio._ramp = (audio._ramp || 0) + 1)
  const step = (t) => {
    if (audio._ramp !== id) return
    const k = Math.min(1, (t - t0) / ms)
    audio.volume = Math.min(1, Math.max(0, from + (to - from) * k))
    if (k < 1) requestAnimationFrame(step)
    else done?.()
  }
  requestAnimationFrame(step)
}

// 같은 종류의 반복 음원은 하나만 재생한다. 바뀌면 fade(기본 1초) 동안 겹쳐 넘어간다.
function makeLoop(kind, fade = FADE_MS) {
  let name = null
  let audio = null
  const set = (next) => {
    next = next || null
    if (next === name) return
    name = next
    if (audio) {
      const old = audio
      ramp(old, 0, fade, () => old.pause())
    }
    audio = null
    if (!next) return
    const a = new Audio(src(next))
    a.loop = true
    a.volume = 0
    a.play().catch(() => {})
    a._vol = VOL[kind] * gain(next)
    ramp(a, muted ? 0 : a._vol, fade)
    audio = a
  }
  loops.push(() => audio && ramp(audio, muted ? 0 : audio._vol, 300))
  return set
}

export const setBgm = makeLoop('bgm')
export const setAmb = makeLoop('amb')
// 휴대폰 진동. 전화를 받는 순간 바로 멈춰야 하므로 짧게 줄인다.
export const setVib = makeLoop('vib', 150)

// 효과음. 배열이면 0.35초 간격으로 차례로 낸다(예: 게이트 통과음 → 문 종소리).
export function sfx(name) {
  if (!name || muted) return
  if (Array.isArray(name)) { name.forEach((n, i) => setTimeout(() => sfx(n), i * 350)); return }
  const a = new Audio(src(name))
  a.volume = VOL.sfx * gain(name)
  a.play().catch(() => {})
}

export function stopAll() {
  setBgm(null)
  setAmb(null)
  setVib(null)
}

// 소리 끄기·켜기. 반복 음원은 0.3초에 걸쳐 줄이거나 되살린다.
export function setMuted(m) {
  muted = m
  loops.forEach((apply) => apply())
}

// ───────── 화면 효과음(음원 파일 없이 브라우저에서 합성한다)
// 대사 앞의 '핑', 대사가 찍힐 때의 '타닥'.
// 배경음보다 한참 작게 둔다. 이야기 소리를 가리지 않고 귀로만 구분되게 하기 위해서다.
let ctx = null
const ac = () => {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch { return null } }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}
// 사인파 하나를 짧게 울린다. f0에서 f1로 음높이가 옮겨 가고, 소리는 지수적으로 줄어든다.
function tone({ f0, f1 = f0, type = 'sine', vol, dur, at = 0 }) {
  const c = ac()
  if (!c || muted) return
  const t = c.currentTime + at
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, t)
  o.frequency.exponentialRampToValueAtTime(f1, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}
export const ui = {
  // 대사가 시작될 때. 높은 음 두 개를 겹쳐 맑게, 0.35초 안에 사라진다.
  ping: () => { tone({ f0: 1320, vol: 0.035, dur: 0.35 }); tone({ f0: 1980, vol: 0.012, dur: 0.25 }) },
  // 대사 글자가 찍힐 때. 음높이를 조금씩 흔들어 기계음처럼 들리지 않게 한다.
  tick: () => tone({ f0: 520 + Math.random() * 120, f1: 380, type: 'triangle', vol: 0.018, dur: 0.035 }),
}
