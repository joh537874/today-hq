import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { applyEdits } from './src/edit-core.js'

// 관리자 뷰어(#/admin)의 문장 편집을 story.js 원문에 적는다. 개발 서버에서만 켜진다.
// 배포본에서는 고친 문장을 브라우저에 모아 두었다가 GitHub에 한 번에 커밋한다(Admin.jsx).
const STORY = fileURLToPath(new URL('./src/story.js', import.meta.url))

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
          try {
            const { edits } = JSON.parse(body)
            fs.writeFileSync(STORY, applyEdits(fs.readFileSync(STORY, 'utf8'), edits))
            send(200, { saved: edits.length })
          } catch (e) { send(400, { error: e.message }) }
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
