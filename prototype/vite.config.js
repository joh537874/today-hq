import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 관리자 뷰어(#/admin)의 문장 편집을 story.js 원문에 적는다. 개발 서버에서만 켜진다.
// 화면이 보낸 원래 문장을 대본(const raw) 안의 작은따옴표 문자열에서 찾아 새 문장으로 바꾼다.
// 같은 문장이 여러 번 나오면 몇 번째인지(nth)로 고르고, 화면이 아는 개수(total)와 파일의 개수가 다르면 쓰지 않는다.
const STORY = fileURLToPath(new URL('./src/story.js', import.meta.url))
const lit = (t) => `'${t.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n')}'`

function saveEdits(edits) {
  const src = fs.readFileSync(STORY, 'utf8')
  const from = src.indexOf('const raw = [')
  const to = src.indexOf('\n]\n', from)
  if (from < 0 || to < 0) throw new Error('story.js에서 대본(const raw)을 찾지 못했습니다.')
  const cuts = edits.map(({ old, text, nth, total }) => {
    if (typeof old !== 'string' || typeof text !== 'string' || !text.trim()) throw new Error('빈 문장은 저장할 수 없습니다.')
    const key = lit(old)
    const found = []
    for (let i = src.indexOf(key, from); i >= 0 && i < to; i = src.indexOf(key, i + key.length)) found.push(i)
    if (found.length !== total || !(nth >= 0 && nth < found.length)) {
      throw new Error(`“${old.slice(0, 24)}” 문장의 위치를 특정하지 못했습니다(파일 ${found.length}곳, 화면 ${total}곳). 새로 고침한 뒤 다시 시도하세요.`)
    }
    return { at: found[nth], len: key.length, next: lit(text.replace(/\s+$/, '')) }
  }).sort((a, b) => b.at - a.at)
  if (cuts.some((c, i) => i && c.at === cuts[i - 1].at)) throw new Error('같은 문장을 두 번 고칠 수 없습니다.')
  let out = src
  for (const c of cuts) out = out.slice(0, c.at) + c.next + out.slice(c.at + c.len)
  fs.writeFileSync(STORY, out)
  return cuts.length
}

function adminEdit() {
  return {
    name: 'admin-edit',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__admin/save', (req, res) => {
        const send = (code, body) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)) }
        // 다른 사이트가 보낸 요청은 받지 않는다.
        const origin = req.headers.origin
        if (req.method !== 'POST' || (origin && new URL(origin).host !== req.headers.host)) return send(403, { error: '허용되지 않은 요청입니다.' })
        let body = ''
        req.on('data', (c) => { body += c })
        req.on('end', () => {
          try { send(200, { saved: saveEdits(JSON.parse(body).edits) }) } catch (e) { send(400, { error: e.message }) }
        })
      })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), adminEdit()],
  server: { port: 5183 },
})
