// 관리자 뷰어의 문장 수정을 story.js 원문 글자에 적용한다. 개발 서버(vite.config.js)와 배포본(Admin.jsx, GitHub에 커밋)이 같이 쓴다.
// 원래 문장을 대본(const raw) 안의 작은따옴표 문자열에서 찾아 새 문장으로 바꾼다.
// 같은 문장이 여러 번 나오면 몇 번째인지(nth)로 고르고, 화면이 아는 개수(total)와 파일의 개수가 다르면 바꾸지 않는다.
export const lit = (t) => `'${t.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n')}'`

export function applyEdits(src, edits) {
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
  return out
}
