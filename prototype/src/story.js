// 스토리 데이터. Figma 'HQ 프로토타입 · 대사 & 플로우'(2972:123)와 '컷신 최종'(2956:831) 기준.
// 비트(beat)를 위에서 아래로 순서대로 재생한다. when이 있으면 조건이 맞을 때만 재생한다.
// img는 public/cut/ 아래 컷 이름이며, 생략하면 앞 비트의 컷을 이어받는다.

export const CHAPTERS = [
  { id: 1, title: '프롤로그', en: 'Prologue' },
  { id: 2, title: '바뀐 숫자', en: 'The Shifted Number' },
  { id: 3, title: '클로이에게 가는 길', en: 'On the Way' },
  { id: 4, title: '클로이의 집 앞', en: 'At the Door' },
  { id: 5, title: '엔딩', en: 'Ending' },
  { id: 6, title: '나의 선택', en: 'My Choices' },
]

// 화자 영문 표기 (Figma UI 2251 기준 '나인 Nyin')
export const WHO_EN = {
  나인: 'Nyin', 클로이: 'Chloe', 줄리안: 'Julian', 재이: 'Jae',
  'AI 바리스타': 'AI Barista', 'AI 승객': 'AI Passenger', 뉴스: 'News', 휴미터: 'Humeter', '게이트 안내': 'Gate',
}

// 주인공 이름. 대본에는 {name} 자리표시자로 적고, 시작할 때 플레이어가 입력한 이름으로 채운다.
// {name:은}·{name:이}·{name:을}·{name:과}는 이름의 마지막 글자 받침에 따라 조사를 고른다.
const ME = '{name}'
export const DEFAULT_NAME = '진'
export const NAME_MAX = 8
const JOSA = { 은: ['은', '는'], 이: ['이', '가'], 을: ['을', '를'], 과: ['과', '와'] }
// 한글이면 받침 유무(true/false), 한글이 아니면 null을 돌려준다.
function batchim(name) {
  const c = name.charCodeAt(name.length - 1) - 0xac00
  return c >= 0 && c <= 11171 ? c % 28 !== 0 : null
}
function fillText(t, name) {
  return t.replace(/\{name(?::(.))?\}/g, (_, j) => {
    if (!j) return name
    const b = batchim(name)
    const [a, z] = JOSA[j]
    return name + (b === null ? `${a}(${z})` : b ? a : z)
  })
}
// 기본 이름일 때 영문 자막에는 기존 표기를 쓴다.
const DEFAULT_EN = 'Jin'
const EN_KEYS = ['en', 'whoEn']
// 문자열·배열·일반 객체를 따라 내려가며 자리표시자를 채운다. 함수(when)는 그대로 둔다.
function fill(v, name, key) {
  if (typeof v === 'string') {
    if (!v.includes('{name')) return v
    return fillText(v, EN_KEYS.includes(key) && name === DEFAULT_NAME ? DEFAULT_EN : name)
  }
  if (Array.isArray(v)) return v.map((x) => fill(x, name))
  if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    const o = {}
    for (const k in v) o[k] = fill(v[k], name, k)
    return o
  }
  return v
}

// 내레이션 / 대사
const N = (text, en, extra = {}) => ({ type: 'narr', text, en, ...extra })
const L = (who, text, en, extra = {}) => ({ type: 'line', who, text, en, ...(who === ME ? { whoEn: ME } : {}), ...extra })
// 선택 결과에 따라 재생 여부를 정한다
const ifPick = (id, sign) => (s) => s.picks.find((p) => p.id === id)?.sign === sign
const ifRoute = (r) => (s) => s.route === r
const ifFinal = (k) => (s) => s.final === k

const raw = [
  // ───────── 1장 · 프롤로그 (선택 없음)
  // 오프닝 영상(자막 포함, 38.4초). 끝나면 검은 화면에 나레이션 목소리와 자막만 이어진다.
  // 플레이 방법 안내. 검은 화면에 5초 동안 띄운 뒤 오프닝 영상으로 넘어간다.
  {
    chapter: 1, type: 'notice', title: 'How To Play', ms: 5000, bgm: 'night', // 타이틀 배경음이 안내 화면까지 이어진다
    lines: ['지금부터, 이야기는 당신의 선택으로 이어집니다.', '정답은 없습니다. 당신의 생각에 더 가까운 쪽을 고르세요.'],
  },
  { type: 'video', src: 'opening/prologue.mp4', bgm: null },
  {
    type: 'voice', audio: 'opening/after.mp3',
    // ElevenLabs Brian(eleven_v3, 숨 한 번 + 속삭임), 앞 1초 정적, 배경음은 아주 작게.
    // 2026-11-28 1.1배속 음원(media-src/opening/op/after_1.1x.mp3)을 0.91배로 늦췄다. 자막 시점도 1.1배로 늘렸다.
    cues: [
      { at: 1.1, text: '하지만… 정말 이걸로 충분할까요?', en: 'But is this really enough?' },
      { at: 4.3, text: '언젠가 AI가 인간다움마저 따라잡는다면, 우리는 무엇으로 구분될까요?', en: 'If AI one day catches up with our humanity, what will set us apart?' },
    ],
  },

  // 당신의 집 · 크로스오버의 밤
  N('2069년 3월 14일 밤.', 'The night of March 14, 2069.', { img: 'p-call-bg', bgm: null, amb: 'street' }),
  // 뉴스 영상(22초). 화면 전체로 시작해 세 번째 문장에서 거실 TV로 줌아웃한다(App.jsx NewsVideo).
  // 영상 소리에 새 뉴스 배경음이 섞여 있다(media-src/news/build.sh). 줌아웃과 함께 거실 음악(living)과 환경음이 올라온다.
  // 자막 시점은 말소리 사이의 쉼(8.7~9.1초, 15.0~15.5초)에 맞췄다.
  {
    type: 'news', src: 'scene/news.mp4', img: 'p-call-bg', bgm: null, amb: null,
    cues: [
      { at: 0.2, to: 8.9, text: '“속보입니다. HQ관리국이 발표한 이번 분기 평균 HQ 점수에서\nAI가 처음으로 인간을 넘어섰습니다.', en: '“Breaking news. According to the HQ Bureau’s latest quarterly report, AI has surpassed humans in average HQ scores for the first time.' },
      { at: 9.1, to: 15.3, text: '판별 시스템이 인간보다 AI를 더 높은 인간 점수로\n평가한 것은 이번이 처음인데요.', en: 'This marks the first time the identification system has rated AI as more human than humans themselves.' },
      { at: 15.5, to: 22.1, text: '인간과 AI의 경계에 또 한 번 큰 파장이 예상됩니다.”', en: 'The news is expected to send shockwaves through society, once again blurring the line between humans and AI.”' },
    ],
  },
  // 2026-11-28 Figma '최종 이미지' 스토리보드 01~04(3082:698·713·741·755) 기준으로 1~4장 문구와 컷을 맞췄다.
  // 나레이션의 주어는 Figma처럼 '당신'으로 쓰고, 대사 속 호칭만 플레이어가 입력한 이름({name})으로 채운다.
  N('당신은 AI 비서 ‘나인’과 함께 소파에 앉아 뉴스를 보고 있다. 그때, 휴대폰이 울린다.', 'You are sitting on the sofa watching the news with your AI assistant, Nyin. Then the phone rings.', { img: 'p-call-bg', bgm: 'living', amb: 'street', vib: true }),
  // 클로이의 전화. 휴대폰이 진동하고, 플레이어가 초록 버튼을 밀어서(또는 Space·Enter·→) 받는다.
  { type: 'call', img: 'p-call-bg', vib: true },
  // 클로이 첫 대사는 통화 카드 안 영상으로 보여 준다(배경을 투명하게 뺀 영상, 유리 효과는 화면에서 건다). 자막은 말소리에 맞춰 아래에 뜨고, 영상이 끝나면 넘어간다.
  // 영상 속 클로이는 주인공 이름을 부르지 않는다.
  {
    type: 'callvid', img: 'p-call-bg', call: 'on', callVid: 'scene/chloe-call',
    cues: [
      { at: 0.1, to: 1.9, text: '여보세요? 아직 안 자고 있었네?', en: 'Hello? You’re still up?' },
      { at: 2.1, to: 3.9, text: '아, 별건 아니고.', en: 'Oh, it’s nothing important.' },
      { at: 4.0, to: 6.6, text: '내일 있을 내 생일 파티 말이야.', en: 'I just wanted to talk about my birthday party tomorrow.' },
      { at: 6.7, to: 8.8, text: '한 7시쯤 볼까 하는데', en: 'I was thinking around seven.' },
      { at: 8.9, to: 10.1, text: '시간 괜찮지?', en: 'Does that work for you?' },
    ],
  },
  L(ME, '“응, 7시 괜찮아. 그럼 그때 보자.”', '“Yeah, seven works. See you then.”', { call: 'on', callVid: 'scene/chloe-call' }),
  // 클로이 두 번째 통화 영상. '참, 방금 뉴스를 보니까…'부터 '잘 자'까지 한 번에 이어지는 영상(MiniMax H3로 음성을 넣어 생성).
  // 첫 영상과 같은 방식(배경 투명, 말소리에 맞춘 자막). 음성 구절 위치는 입 모양에 맞춰 다듬었다(media-src/chloe-call-23/build.sh).
  {
    type: 'callvid', call: 'on', callVid: 'scene/chloe-call-23',
    cues: [
      { at: 0.1, to: 2.0, text: '참, 방금 뉴스를 보니까', en: 'By the way, I just saw the news.' },
      { at: 2.1, to: 4.4, text: 'HQ가 난리더라.', en: 'HQ is causing quite a stir.' },
      { at: 4.8, to: 6.6, text: '너희 집 AI는 어때?', en: 'How’s the AI at your place?' },
      { at: 6.8, to: 9.7, text: '이름이… 나인이랬지?', en: 'Its name was… Nyin, right?' },
      { at: 10.4, to: 12.3, text: '아무튼, 시간이 너무 늦었네.', en: 'Anyway, it’s getting pretty late.' },
      { at: 12.4, to: 13.95, text: '내일 다시 연락할게.', en: 'I’ll talk to you again tomorrow.' },
      { at: 14.05, to: 15.1, text: '잘 자.', en: 'Good night.' },
    ],
  },
  L('나인', '“내일은 클로이 씨의 생일 파티에 참석하는 날이네요. 일찍 주무시는 걸 추천드려요.”', '“Tomorrow is Chloe’s birthday party. I suggest getting some rest early.”', { img: 'p-home-nine' }),
  // 자정에서 아침으로 넘어가는 도시 영상. 자막 없이 영상만 보여 주고, 끝나면 2장으로 넘어간다.
  { type: 'clip', img: 'p-city', vid: 'scene/p-city.mp4' },
  // ───────── 2장 · 집 · 다음 날 아침
  { chapter: 2, img: 's2-morning', bgm: 'morning', amb: null, sfx: 'humeter', hq: 72, hud: { hq: 72, delta: -9, note: '관리국 기준 갱신' }, ...L('휴미터', '“좋은 아침입니다, {name} 님. 오늘의 HQ는 72입니다.”', '“Good morning, {name}. Your HQ is 72 today.”') },
  N('다음 날 아침, 당신의 HQ는 81에서 72로 떨어져 있었다. 인간을 닮아 가는 로봇에 대한 경계심이 커지면서, HQ 산정 기준이 새롭게 개정되었기 때문이다.', 'The next morning, your HQ had dropped from 81 to 72. As wariness of human-like robots grew, the HQ standard had been revised.'),
  L(ME, '“하룻밤 새 9점이나 떨어졌네….”', '“It dropped nine points overnight….”'),
  L('나인', '“괜찮아요, {name}. HQ는 매일 바뀌잖아요. 오늘은 제가 같이 갈 테니 너무 걱정하지 마세요.”', '“It’s okay, {name}. Your HQ could change again tomorrow. I’ll come with you today, so don’t worry too much.”', { img: 's2-morning-nine' }),
  N('나인의 HQ는 88, 당신보다 더 높게 책정되어 있다.', 'Nyin’s HQ is 88, rated higher than yours.'),
  L(ME, '“나보다 높네….”', '“Higher than mine….”'),
  L('나인', '“저도 매일 밤 제 HQ를 확인하고 있어요. {name} 곁에 있으려면 저도 신경 써야 하니까요.”', '“I check my HQ every night, too. I have to keep an eye on it if I’m going to stay by your side.”'),

  // 책상 위 편지
  L('나인', '“그런데 {name}, 클로이 선물은 준비했어요?”', '“By the way, {name}, have you got a gift for Chloe?”'),
  L(ME, '“아, 그러고 보니 아직이네. 어제 뉴스를 보다가 늦게 자는 바람에 깜빡했어.”', '“Oh, right. I haven’t got anything yet. I stayed up watching the news and completely forgot.”'),
  L('나인', '“그럼 손편지는 어때요? 클로이도 좋아할 것 같은데요.”', '“How about a handwritten letter? I think Chloe would like that.”'),
  L(ME, '“좋은 생각이야, 나인.”', '“That’s a good idea, Nyin.”'),
  N('당신은 책상에 앉아 클로이에게 줄 편지를 쓸 준비를 한다.', 'You sit at the desk and get ready to write a letter to Chloe.', { img: 's2-letter', sfx: 'pen' }),
  L(ME, '“……실수로 잘못 적었어. 오늘은 되는 일이 없네.”', '“...I made a typo. Nothing seems to be going right today.”', { img: 's2-letter-write' }),
  L('나인', '“너무 신경 쓰지 마세요. 요즘은 실수가 오히려 HQ를 높여 준다는 얘기도 있던데요. AI는 실수를 하지 않으니까요.”', '“Don’t worry too much. I’ve heard that making mistakes might actually raise your HQ. After all, AIs aren’t supposed to make mistakes.”'),
  L('나인', '“그래서 일부러 편지에 오타를 넣는 사람들도 있대요.”', '“Apparently, some people even put typos in their letters on purpose.”'),
  L(ME, '“실수를 하면 HQ가 올라간다고?”', '“Making mistakes can raise your HQ?”'),
  L('나인', '“그런 소문이 있어요.”', '“That’s what people are saying.”'),
  N('편지를 쓰던 중, 당신은 방금 적은 문장에서 맞춤법이 틀린 부분을 발견한다. 지우개를 든 채 잠시 망설인다.', 'While writing, you notice a misspelling in the sentence you just wrote. You hesitate, eraser in hand.', { img: 's2-letter-write' }),
  {
    type: 'choice', id: 'c1', num: '①', axis: 'hq', img: 's2-letter-write',
    prompt: L(ME, '‘혹시 오타를 지우지 않고 그냥 주면, 내 HQ가 오르지 않을까? 하지만 오타를 그냥 두면 보기 안 좋을 텐데. 어떡하지?’', '‘If I just leave the typo, maybe my HQ will go up? But it won’t look good. What should I do?’'),
    options: [
      { text: '틀린 부분을 발견하고도 고치지 않고 그대로 둔다.', sign: 1 },
      { text: '틀린 부분을 지우고 올바르게 고쳐 쓴다.', sign: -1 },
    ],
  },
  N('당신은 편지를 다 써서 봉투에 넣는다.', 'You finish the letter and put it in an envelope.', { img: 's2-envelope' }),
  L('나인', '“다 썼어요? 편지 쓰는 동안 백화점에 선물도 미리 준비해 뒀어요. 가는 길에 찾아가면 돼요.”', '“All done? I arranged a gift for Chloe while you were writing. We can pick it up on our way.”'),
  L(ME, '“고마워, 나인. 그럼 바로 가자.”', '“Thanks, Nyin. Let’s get going.”'),

  // 백화점 입구 · 낮 (게이트: 나인 통과 → 내 차례 → 72 거부)
  N('당신과 나인은 백화점으로 향한다. 입구에는 ‘입장 기준 HQ 75’라는 안내가 붙어 있다.', 'You and Nyin head to the department store. A sign at the entrance reads ‘Entry requirement: HQ 75.’', { img: 's2-store', bgm: 'day', amb: 'mall' }),
  N('나인이 먼저 게이트를 통과한다. HQ 88. 초록색 불이 켜진다.', 'Nyin passes through the gate first. HQ 88. The light turns green.', { img: 's2-gate-nine', sfx: 'gate-ok' }),
  N('이제 당신의 HQ를 입력할 차례다.', 'Now it’s your turn to enter your HQ.', { img: 's2-gate-panel' }),
  L('게이트 안내', '“죄송합니다. 현재 HQ로는 입장하실 수 없습니다.”', '“We’re sorry. Your current HQ score does not meet the entry requirements.”', { img: 's2-gate-denied', sfx: 'gate-no' }),
  N('먼저 게이트를 통과했던 나인이 발길을 돌려 당신에게 돌아온다. 나인이 당신의 얼굴을 살핀다.', 'Nyin, who had already gone through, turns back and returns to you, studying your face.', { img: 's2-nine-face' }),
  {
    type: 'choice', id: 'c2', num: '②', axis: 'ai',
    prompt: L('나인', '“……괜찮아요?”', '“...Are you okay?”'),
    options: [
      { text: '“하… 여긴 못 들어가겠네. 다른 곳을 찾아볼 수 있을까? 어디 갈 만한 데 있는지 알아봐 줘.”', sign: 1 },
      { text: '‘AI는 들어갈 수 있는데, 사람은 안 된다는 거야?’ 생각한다.', sign: -1 },
    ],
  },
  { when: ifPick('c2', 1), img: 's2-nine-after', ...L('나인', '“……어쩔 수 없네요. 다른 방법이 있는지 알아볼게요.”', '“...I suppose there’s no other choice. I’ll see if there’s another way.”') },
  { when: ifPick('c2', -1), img: 's2-nine-after', ...L('나인', '“……그럼 제가 선물을 가져올게요. 여기서 잠깐만 기다려 주세요.”', '“...I’ll go get the gift, then. Just wait here for a moment.”') },

  // 단골 카페 (입구 패널: 빈 화면 → 72 입장 허용)
  L(ME, '“어찌어찌 선물은 샀네. 이제 좀 지친다.”', '“Well, at least we got the gift. I’m pretty tired now.”', { img: 's2-cafe', amb: 'street-day' }),
  L('나인', '“생각보다 오래 걸렸네요. 많이 피곤해 보이는데, 근처에 카페가 있어요. 잠깐 쉬었다 갈까요?”', '“That took longer than expected. You look pretty tired. There’s a café nearby. Shall we take a break?”'),
  N('둘은 입장 기준이 HQ 70인 단골 카페로 향한다.', 'The two head to their usual café, where the entry requirement is HQ 70.', { img: 's2-cafe-panel' }),
  // 패널에 72와 입장 허용이 뜨는 컷. 글 없이 잠깐 보여 주고 넘어간다.
  { type: 'cut', img: 's2-cafe-allowed', ms: 1600, amb: 'cafe', sfx: ['gate-ok', 'bell'] },
  N('당신이 커피를 주문하자, 카운터의 AI 바리스타가 컵을 내밀며 말을 건다.', 'As you order coffee, the AI barista at the counter hands you a cup and starts talking.', { img: 's2-barista' }),
  L('AI 바리스타', '“안녕하세요~! 날씨가 우중충해서 다운되는 하루네요. 저는 오늘 같은 날만 되면 기분이 축 처지더라고요.”', '“Hello~! The weather is so gloomy today, isn’t it? Days like this always bring my mood down.”'),
  {
    type: 'choice', id: 'c3', num: '③', axis: 'ai',
    prompt: L('AI 바리스타', '“……어머, 손님도 오늘 무슨 안 좋은 일 있으셨어요? 표정이 좀 어두우시네요.”', '“...Oh, did something happen today? You look a little down, too.”'),
    options: [
      { text: '“그러게요. 오늘 참… 기분이 안 좋은 하루네요.”', sign: 1 },
      { text: 'AI가 기분을 느낀다는 말이 이상하게 느껴진다. 대충 고개를 끄덕이고 커피를 받아 든다.', sign: -1 },
    ],
  },
  { when: ifPick('c3', 1), img: 's2-barista-bye', ...L('AI 바리스타', '“그럼 휘핑크림 좀 더 올려 드릴까요? 달달한 거 먹으면 기분이 좀 나아질지도 모르잖아요.”', '“How about a little extra whipped cream? Something sweet might cheer you up.”') },
  { when: ifPick('c3', -1), img: 's2-barista-bye', ...L('AI 바리스타', '“네, 조심히 가세요! 좋은 하루 보내세요~!”', '“Alright, take care! Have a nice day~!”') },

  // 길거리
  N('커피를 받아 카페를 나온다. 나인과 함께 걷던 중, 길 건너편에서 누군가 홀로 피켓을 들고 서 있는 것을 발견한다.', 'You leave the café with your coffee. Walking with Nyin, you spot someone standing alone across the street, holding a picket sign.', { img: 's2-cafe-street', amb: 'street-day' }),
  N('피켓에는 ‘HQ 폐지!’라고 적혀 있다. 머리 위에 HQ 숫자가 없는 그녀를 힐끗거리던 사람들은 이내 모른 척 지나간다.', 'The sign reads ‘Abolish HQ!’ People glance at her, with no HQ number above her head, then pretend not to see and walk past.', { img: 's2-jae' }),
  // 재이 시위 영상(22초, 1·2 이어 붙임). 대사·자막·거리 소리가 영상에 들어 있다.
  { type: 'video', src: 'scene/jae-protest.mp4', bgm: null, amb: null },
  {
    type: 'choice', id: 'c4', num: '④', axis: 'hq', bgm: 'day', amb: 'street-day',
    prompt: N('재이가 HQ 폐지 시위를 하고 있다.', 'Jae is protesting to abolish HQ.'),
    options: [
      { text: '‘그래도 인간다움을 판단할 기준은 필요하지 않을까?’ 생각하며 지나친다.', sign: 1 },
      { text: '‘HQ 점수가 정말 한 사람의 인간다움을 설명할 수 있을까?’ 의문이 든다.', sign: -1 },
    ],
  },
  N('나란히 걷던 나인이 저녁 파티 이야기를 꺼낸다.', 'Walking side by side, Nyin brings up the party tonight.', { img: 's2-walk' }),
  L('나인', '“그러고 보니 클로이 파티에 가는 것도 정말 오랜만이네요.”', '“Come to think of it, it’s been a while since you last went to one of Chloe’s parties.”'),
  L(ME, '“그러게. 오랜만이라 그런가 좀 걱정되네. 요즘 클로이랑 무슨 얘길 했는지도 잘 모르겠고.”', '“Yeah. I guess I’m a little nervous. I don’t even know what Chloe’s been into lately.”'),
  {
    type: 'choice', id: 'c5', num: '⑤', axis: 'ai', img: 's2-walk-nine',
    prompt: L('나인', '“그럼 제가 클로이의 관심사를 기반으로 축하 대화를 시뮬레이션해 드릴까요? 제가 준비한 대사대로 말만 해도 그녀는 굉장히 좋아할 거예요.”', '“Would you like me to simulate a congratulatory conversation based on Chloe’s interests? If you just say the lines I’ve prepared, she’ll absolutely love it.”'),
    options: [
      { text: '“좋아. 클로이가 요즘 뭘 좋아하는지부터 알아봐 줘.”', sign: 1 },
      { text: '“괜찮아. 이건 내가 직접 생각해야 진심이 전해질 것 같아.”', sign: -1 },
    ],
  },
  L('나인', '“알겠습니다.”', '“Okay.”'),

  // ───────── 3장 · 지하철 · 저녁
  { chapter: 3, img: 's3-subway', bgm: 'evening', amb: 'subway-ride', ...N('잠시 후 저녁, 당신과 나인은 클로이의 집으로 향하는 지하철에 타고 있다.', 'Later that evening, you and Nyin are on the subway to Chloe’s place.') },
  N('맞은편에 앉아 있던 아이가 갑자기 울음을 터뜨린다.', 'A child sitting across from you suddenly bursts into tears.', { sfx: 'child-cry' }),
  N('가장 먼저 움직인 것은 옆자리의 AI 승객이었다. 머리 위에는 HQ 90이 표시되어 있다. AI 승객은 익숙한 듯 아이에게 몸을 기울여 다정하게 말을 건넨다.', 'The first to move is the AI passenger in the next seat, HQ 90 shown above its head. It leans toward the child as if used to this and speaks gently.', { img: 's3-passenger' }),
  L('AI 승객', '“괜찮아? 많이 놀랐지. 자, 이제 괜찮아. 울지 않아도 돼.”', '“Oh, are you alright? That must have startled you. There, there. You’re okay now.”'),
  N('이를 본 나인이 옆에서 조용히 말을 건넨다.', 'Seeing this, Nyin speaks quietly beside you.', { img: 's3-nine' }),
  {
    type: 'choice', id: 'c6', num: '⑥', axis: 'ai',
    prompt: L('나인', '“참 다정하네요.”', '“He’s very kind.”'),
    options: [
      { text: '“그러게. 정말 다정하다. 나도 좀 배워야겠어.”', sign: 1 },
      { text: '“우는 아이를 보면 달래 주도록 학습된 것뿐이지.”', sign: -1 },
    ],
  },

  // 지하철 · 다음 역
  N('잠시 뒤 열차의 문이 열리고, 오랜 친구이자 Born Human Society 회원인 줄리안과 마주친다.', 'Soon the doors open, and you run into Julian, an old friend and a member of the Born Human Society.', { img: 's3-julian-door' }),
  N('줄리안은 당신과 나인의 HQ를 보며 말을 꺼낸다.', 'Julian looks at your HQ and Nyin’s, and speaks up.'),
  // 줄리안 지하철 영상(40초). 줄리안·나인 대사와 지하철 소리가 영상에 들어 있다.
  // 영상에서는 주인공 이름을 부르지 않는다. 음성의 이름 자리는 0.5초 'Hey', 13.5초 'an'(나인의 'Julian' 끝음절), 28.4초 'shit'으로 바꿨다.
  // 자막은 영상에 굽지 않고 코드로 얹는다. at·to는 영상 기준 초.
  {
    type: 'video', src: 'scene/julian-subway.mp4', bgm: null, amb: null,
    cues: [
      { at: 0.5, to: 3.9, text: '어이! 오랜만이야.', en: 'Hey! Long time no see.' },
      { at: 4.0, to: 6.4, text: '근데 옆에 있는….', en: 'But who’s that next to you...?' },
      { at: 8.25, to: 11.05, text: '안녕하세요, 줄리안. 오랜만이군요.', en: 'Hello, Julian. It’s been a while.' },
      { at: 11.1, to: 15.0, text: '기억하실지 모르겠지만,\n저는 AI 비서 나인입니다.', en: 'You may not remember me, but I’m Nyin, an AI assistant.' },
      { at: 15.9, to: 18.35, text: '…기억하지.', en: '...Yeah, I remember.' },
      { at: 18.4, to: 21.0, text: '근데 HQ가 이렇게 높진 않았던 걸로 기억해서.', en: 'But I don’t remember your HQ being this high.' },
      { at: 21.4, to: 23.85, text: '아시다시피, 저는 매일 업데이트를 하거든요.', en: 'As you know, I receive updates every day.' },
      { at: 23.9, to: 27.0, text: '점점 더 인간다워지는 것이 놀라운 일은 아니죠.', en: 'It’s only natural that I’m becoming more human-like.' },
      { at: 28.4, to: 32.7, text: '젠장. 진심이야?', en: 'Shit... are you serious?' },
      { at: 32.8, to: 37.85, text: '인간을 모방한 고철 덩어리가\n주제도 모르고 기어오르는데', en: 'A pile of scrap metal pretending to be human, getting above itself...' },
      { at: 37.9, to: 40.1, text: '넌 불쾌하지도 않아?', en: '...and that doesn’t bother you?' },
    ],
  },
  {
    type: 'choice', id: 'c7', num: '⑦', axis: 'ai', img: 's3-julian', bgm: 'evening', amb: 'subway-ride',
    prompt: L('줄리안', '“AI의 발전은 축복이 아니라 위협일 뿐이야. 인간을 닮아 갈수록 그 위험성은 커지는 법이지.”', '“AI’s progress isn’t a blessing. It’s a threat. The more it resembles us, the more dangerous it gets.”'),
    options: [
      { text: '“글쎄, 나는 나인 덕분에 훨씬 편해졌어.”', sign: 1 },
      { text: '‘정말 인간의 영역이 점점 위협받고 있는 걸까?’ 잠시 생각에 잠긴다.', sign: -1 },
    ],
  },
  N('당신이 내릴 즈음, 줄리안이 나인을 턱으로 가리키며 말한다.', 'As you are about to get off, Julian nods toward Nyin.', { img: 's3-julian-point' }),
  // Figma 03에는 선택 ⑧이 없다. 루트 계산에 ⑧이 쓰이므로 줄리안 대사만 Figma 문장으로 바꾸고 선택지는 유지한다.
  {
    type: 'choice', id: 'c8', num: '⑧', axis: 'ai',
    prompt: L('줄리안', '“그 깡통이랑 그만 어울려. 진심으로 하는 말이야. 언젠가는 후회하게 될 거야. 결국 우리 자리를 빼앗으려 들 테니까.”', '“Stop hanging around with that tin can. I’m serious. You’ll regret it someday. They’re going to take our place.”'),
    options: [
      { text: '“AI한테 도움받는 거랑 사람한테 도움받는 거랑 뭐가 달라?”', sign: 1 },
      { text: '대답하지 않고 나인과 조금 거리를 두고 걷는다.', sign: -1 },
    ],
  },

  // ───────── 4장 · 클로이의 집 앞 · 저녁
  { type: 'route' },
  { chapter: 4, img: 's4-corridor', bgm: 'door', amb: 'hall', ...N('지하철에서 내려 클로이의 집으로 향한다.', 'Getting off the subway, you head to Chloe’s place.') },
  N('클로이의 집 앞에 도착한 당신은 초인종을 누르려다 문 옆에 붙은 패널을 발견한다. 패널에는 ‘입장 기준 HQ 75’라고 표시되어 있다.', 'Arriving at Chloe’s door, you reach for the bell and notice a panel beside it. It reads ‘Entry requirement: HQ 75.’', { img: 's4-panel', sfx: 'panel-no' }),
  N('잠시 망설이던 당신은 초인종을 누른다. 곧 도어폰 너머로 클로이의 목소리가 들려온다.', 'After a moment’s hesitation, you ring the bell. Soon Chloe’s voice comes through the intercom.', { sfx: ['doorbell', 'intercom'] }),
  L('클로이', '“왔구나. …어, 잠깐만 너 HQ가…”', '“You’re here! ...Oh, wait, your HQ...”'),
  N('스피커 너머로 잠시 정적이 흐른다. 뒤쪽에서는 누군가 웃는 소리가 들려온다.', 'A brief silence comes through the speaker. Someone is laughing in the background.', { amb: 'party' }),
  L('클로이', '“미리 말했어야 했는데. 미안해. 그런데 너도 알잖아. 요즘은 HQ가 비슷한 사람들끼리 어울리는 게 당연하니까. 우리도 나름 기준이 있는데, 너 하나 때문에 바꾸긴 좀 그렇잖아?”', '“I should have told you earlier. I’m sorry. But you know how it is. These days, people with similar HQ stick together. We have our own standard, and it’s a bit much to change it just for you, right?”'),
  L('클로이', '“다른 애들도 별로 내키지 않는 눈치고…… HQ 조금만 더 올려서 다시 오면 안 될까?”', '“The others don’t seem too keen either... Could you raise your HQ a little and come back?”'),

  // Route A · AI를 인정한 사람들
  { when: ifRoute('A'), img: 's4-jin-a', ...N('당신과 나인은 클로이의 집 앞에 멍하니 서 있다. 손에는 클로이에게 전할 편지와 선물이 들려 있다.', 'You and Nyin stand blankly at Chloe’s door, the letter and gift for Chloe in your hands.') },
  { when: ifRoute('A'), ...N('친구의 집에도 입장 기준이 있을 거라고는 미처 생각하지 못했다. 당황한 당신을 나인은 옆에서 조용히 바라본다.', 'You never imagined even a friend’s home would have an entry requirement. Nyin quietly watches you, flustered.') },
  {
    when: ifRoute('A'), type: 'final', num: '⑨',
    options: [
      { key: 'adapter', text: 'HQ를 높이기 위해 시도한다' },
      { key: 'insurgent', text: '돌아선다' },
    ],
  },
  { when: ifFinal('adapter'), ...L(ME, '“나인, 나 꼭 이 파티에 가고 싶어. 어떻게든 HQ를 높여야 해. HQ를 높이려면 뭘 해야 해?”', '“Nyin, I really want to go to this party. I have to raise my HQ somehow. What do I need to do?”') },
  { when: ifFinal('adapter'), ...L('나인', '“HQ를 높이는 방법이 정확히 알려진 건 아니에요. 그래도 몇 가지 조언을 드리자면……”', '“No one knows exactly how to raise your HQ. But if I could offer a few tips...”') },
  { when: ifFinal('adapter'), ...N('나인은 몇 가지 정보를 조용히 읊조린다. 당신은 나인이 알려준 방법을 하나씩 따라 하기 시작한다. HQ가 오를 때까지. 파티장에 들어갈 수 있을 때까지.', 'Nyin quietly recites a few things. You begin to follow them one by one. Until your HQ goes up. Until you can get into the party.') },
  { when: ifFinal('insurgent'), ...L(ME, '“사람들이 정한 인간다움에 맞추려고 내 행동까지 바꾸고 싶진 않아. 그런 걸 강요하는 사람들과 어울리면서까지 파티에 가고 싶지도 않고.”', '“I don’t want to change who I am to fit what people call human. And I don’t want to go to a party with people who force that on me.”') },
  { when: ifFinal('insurgent'), ...L('나인', '“그렇군요. 그럼 돌아갈까요?”', '“I see. Shall we go back, then?”') },
  { when: ifFinal('insurgent'), ...L(ME, '“편지는 그냥 우편으로 보내자. 자, 돌아가자.”', '“Let’s just send the letter by mail. Come on, let’s go.”') },
  { when: ifFinal('insurgent'), ...N('당신은 나인과 함께 발걸음을 돌려 집으로 향한다. 클로이에게 무시당한 건 여전히 마음에 걸리지만, 한편으로는 마음 한켠이 한결 가볍다.', 'You turn around and head home with Nyin. Being brushed off by Chloe still stings, but part of you feels lighter.') },

  // Route B · AI를 배척한 사람들
  { when: ifRoute('B'), img: 's4-jin-b', ...N('당신과 나인은 클로이의 집 앞에 멍하니 서 있다. 손에는 클로이에게 전할 편지와 선물이 들려 있다.', 'You and Nyin stand blankly at Chloe’s door, the letter and gift for Chloe in your hands.') },
  { when: ifRoute('B'), ...N('친구의 집에도 입장 기준이 있을 거라고는 미처 생각하지 못했다. 당황한 당신을 나인은 옆에서 조용히 바라본다.', 'You never imagined even a friend’s home would have an entry requirement. Nyin quietly watches you, flustered.') },
  { when: ifRoute('B'), img: 's3-julian', ...N('그때, 문득 헤어지기 전 줄리안이 했던 조언이 떠오른다.', 'Then you suddenly remember the advice Julian gave you before you parted.') },
  { when: ifRoute('B'), ...L('줄리안', '“친구로서 하는 충고야. 절대 저 깡통보다 HQ를 낮게 두지 마.”', '“I’m telling you this as a friend. Never let your HQ fall below that tin can’s.”', { via: '회상' }) },
  { when: ifRoute('B'), ...L('줄리안', '“……어떻게 해야 하냐고? 간단해. 저 깡통을 이용하면 되잖아. 안에 있는 휴미터를 꺼내서 네가 착용해. 그럼 HQ를 올릴 수 있을 거야.”', '“...How? Simple. Use the tin can. Take out the Humeter inside it and wear it yourself. That’ll raise your HQ.”', { via: '회상' }) },
  {
    when: ifRoute('B'), type: 'final', num: '⑨', img: 's4-jin-b',
    options: [
      { key: 'zealot', text: '어떻게든 들어간다' },
      { key: 'outlier', text: 'HQ 제도에 회의를 느낀다' },
    ],
  },
  { when: ifFinal('zealot'), ...L(ME, '“……나인, 미안해.”', '“...Nyin, I’m sorry.”') },
  { when: ifFinal('zealot'), ...L('나인', '“네? {name}……?”', '“What? {name}...?”') },
  { when: ifFinal('zealot'), ...N('당신은 나인의 말이 끝나기도 전에 나인의 귀에 부착된 휴미터를 거칠게 뜯어낸다. 휴미터를 손에 쥐고 자신의 귀에 가져다 대자 HQ가 올라가는 것이 느껴진다. 당신은 바닥에 쓰러진 나인을 뒤로한 채, 망설임 없이 집 안으로 들어선다.', 'Before Nyin can finish, you rip the Humeter from Nyin’s ear. As you hold it to your own ear, you feel your HQ rise. Leaving Nyin collapsed on the floor, you walk into the house without hesitation.') },
  { when: ifFinal('outlier'), ...L(ME, '“사람들이 정한 인간다움에 맞추려고 내 행동까지 바꾸고 싶진 않아. 그렇다고 AI의 도움을 받고 싶지도 않고.”', '“I don’t want to change who I am to fit what people call human. But I don’t want an AI’s help either.”') },
  { when: ifFinal('outlier'), ...L('나인', '“그렇군요. 그럼 돌아갈까요?”', '“I see. Shall we go back, then?”') },
  { when: ifFinal('outlier'), ...L(ME, '“난 돌아가겠어.”', '“I’m going back.”') },
  { when: ifFinal('outlier'), ...N('당신은 나인과 함께 발걸음을 돌려 집으로 향한다. 클로이에게 무시당한 건 여전히 마음에 걸리지만, 한편으로는 마음 한켠이 한결 가볍다.', 'You turn around and head home with Nyin. Being brushed off by Chloe still stings, but part of you feels lighter.') },

  // ───────── 5장 · 엔딩 (엔딩 영상 → 마지막 질문 → 결과 화면, Figma 2254 · 2255 · 2262)
  { chapter: 5, when: ifFinal('adapter'), img: 'e-adapter-phone', bgm: 'end-adapter', amb: 'street-day', ...N('급하게 감동적인 영상을 찾아보고, 기부를 하고, 길에서 쓰레기를 줍는다.', '{name} rushes to watch moving videos, makes a donation, picks up trash on the street.') },
  { when: ifFinal('adapter'), img: 'e-adapter-party', ...N('그렇게 애를 써서 들어간 클로이의 집. 당신은 점수를 겨우 올려 파티에 들어간다.', 'After all that effort, {name} barely raises the score and makes it into Chloe’s party.', { amb: 'party' }) },
  { when: ifFinal('adapter'), ...N('쓸쓸한 당신의 뒷모습과 파티 소음이 교차된다.', '{name}’s lonely back cuts against the noise of the party.') },

  { chapter: 5, when: ifFinal('insurgent'), img: 'e-insurgent-sky', bgm: 'end-insurgent', amb: 'wind', ...N('하늘을 올려다보며 나인과 이야기를 나눈다. 바람과 온도를 느끼는 지금, 당신은 오히려 가장 사람답다고 느낀다.', 'Looking up at the sky, {name} talks with Nyin. Feeling the wind and the air, {name} feels more human than ever.') },
  { when: ifFinal('insurgent'), ...N('당신은 파티에 가지 않고 나인과 함께 집으로 돌아간다. 나인과 자신의 집에서 저녁을 보낸다.', '{name} skips the party and goes home with Nyin, spending the evening there together.') },
  { when: ifFinal('insurgent'), img: 'e-mail', ...N('편지는 다음 날 우편으로 보낸다.', 'The letter goes out by mail the next day.', { amb: null }) },

  { chapter: 5, when: ifFinal('zealot'), img: 'e-zealot-hand', bgm: 'end-zealot', amb: 'hall', ...N('나인의 몸에서 휴미터를 꺼내 귀에 단다.', '{name} takes the Humeter out of Nyin and puts it on.') },
  { when: ifFinal('zealot'), img: 'e-zealot-nine', ...N('당신은 파티에 들어가고, 꺼진 나인은 문 앞 바닥에 쓰러져 있다.', '{name} walks into the party, while Nyin lies switched off on the floor by the door.', { amb: 'party', sfx: 'shutdown' }) },
  { when: ifFinal('zealot'), img: 'e-zealot-chloe', ...N('클로이가 편지를 읽다 눈물을 보여도 당신의 숫자는 그대로다.', 'Even as Chloe tears up reading the letter, {name}’s number doesn’t move.') },

  { chapter: 5, when: ifFinal('outlier'), img: 'e-outlier-humeter', bgm: 'end-outlier', amb: 'hall', sfx: 'throw', ...N('당신은 자기 휴미터를 떼어 내고 던져 버린다.', '{name} pulls off the Humeter and throws it away.') },
  { when: ifFinal('outlier'), img: 'e-outlier-sketch', ...N('그리고 한결 가벼운 얼굴로 그 자리를 떠난다.', 'And walks away, looking lighter.') },
  { when: ifFinal('outlier'), img: 'e-outlier-up', ...N('머리 위 숫자가 사라지고, 당신은 편지를 주머니에 넣은 채 돌아선다.', 'The number overhead disappears. {name} turns away, the letter tucked in a pocket.') },

  { type: 'after', bgm: 'result', amb: null },
  { type: 'result', bgm: 'result', amb: null },
]

// chapter, img를 앞 비트에서 이어받는다. 각 장의 첫 내레이션과 1장 내레이션은 가운데 정렬한다.
// ───────── 자막 나누기
// 한 화면의 자막은 2줄을 넘지 않는다. 짧은 문장은 한 줄에 붙이고, 길면 다음 자막으로 넘긴다.
// 줄 사이는 '\n'으로 표시한다. 한 줄에 들어가는 글자 수는 화면 폭(한글 28px, 영문 20px) 기준의 근사치다.
const KO_LINE = { left: 42, center: 38 }
const EN_LINE = 100

const sentencesOf = (t) => t.split(/(?<=[.?!…]["'”’」)]?)\s+/).map((x) => x.trim()).filter(Boolean)
const rows = (t, width) => Math.max(1, Math.ceil(t.length / width))

// 문장들을 줄로 묶는다. 이어 붙여도 한 줄에 들어가면 같은 줄에 둔다.
function toLines(sents, width) {
  const lines = []
  for (const x of sents) {
    const last = lines[lines.length - 1]
    // 한 줄에 들어가면 붙인다. 앞 문장이 짧으면(12자 미만) 줄이 넘쳐도 붙여서 한두 단어짜리 화면을 만들지 않는다.
    if (last && ((last + ' ' + x).length <= width || last.length < 12)) lines[lines.length - 1] = last + ' ' + x
    else lines.push(x)
  }
  return lines
}

// 줄들을 2줄 이하의 화면 단위로 묶는다. 한 문장이 2줄을 넘으면 그 문장만 한 화면에 둔다.
function toPages(lines, width) {
  const pages = []
  let cur = []
  let used = 0
  for (const l of lines) {
    const h = rows(l, width)
    if (cur.length && used + h > 2) { pages.push(cur); cur = []; used = 0 }
    cur.push(l)
    used += h
  }
  if (cur.length) pages.push(cur)
  return pages
}

// 영문을 한글 화면 수만큼 나눈다. 한글 화면별 글자 비율에 맞춘 위치 근처의 문장 끝·쉼표·띄어쓰기에서 끊는다.
function splitEn(en, n, weights = null) {
  if (!en) return Array(n).fill(undefined)
  const lines = (t) => toLines(sentencesOf(t), EN_LINE).join('\n')
  if (n === 1) return [lines(en)]
  const w = weights ?? Array(n).fill(1)
  const total = w.reduce((a, x) => a + x, 0)
  const cuts = []
  let acc = 0
  for (let p = 0; p < n - 1; p++) {
    acc += w[p]
    const target = Math.round((en.length * acc) / total)
    let best = -1
    let score = Infinity
    for (let i = 1; i < en.length - 1; i++) {
      if (en[i] !== ' ') continue
      const prev = en[i - 1]
      const bonus = /[.?!…”"]/.test(prev) ? 0 : prev === ',' ? 12 : 30
      const d = Math.abs(i - target) + bonus
      if (d < score && i > (cuts[cuts.length - 1] ?? 0)) { score = d; best = i }
    }
    cuts.push(best)
  }
  const out = []
  let last = 0
  for (const c of [...cuts, en.length]) { out.push(lines(en.slice(last, c).trim())); last = c }
  return out
}

function paginate(b) {
  const width = b.center ? KO_LINE.center : KO_LINE.left
  const pages = toPages(toLines(sentencesOf(b.text), width), width)
  const ens = splitEn(b.en, pages.length, pages.map((p) => p.join(' ').length))
  return pages.map((p, i) => ({ ...b, text: p.join('\n'), en: ens[i], start: b.start && i === 0, sfx: i === 0 ? b.sfx : undefined }))
}

// 선택 비트를 id로 찾을 수 있게 맵으로 내보낸다 (My Choices 화면용).
// label은 Figma 3098-2322 기준.
export const CHOICE_LABELS = {
  c1: '편지 쓰기', c2: '백화점 입장 거부 후 돌아온 나인에게',
  c3: '카페에서 AI 바리스타와 대화', c4: '재이 시위 에피소드',
  c5: '나인의 제안', c6: 'AI 승객에 대한 반응',
  c7: '줄리안의 말·1', c8: '줄리안의 말·2',
}
function buildChoiceMap(src) {
  const map = {}
  let img = 'p-fog'
  for (const b of src) {
    if (b.img) img = b.img
    if (b.type === 'choice') map[b.id] = { ...b, img: b.img || img }
  }
  return map
}

// 자막은 이름 길이에 따라 줄바꿈과 페이지 수가 달라지므로, 이름을 채운 뒤에 페이지를 나눈다.
function buildBeats(src) {
  let carry = { chapter: 0, img: 'p-fog', bgm: null, amb: null }
  return src.flatMap((b) => {
    const chapterStart = b.chapter != null && b.chapter !== carry.chapter
    carry = {
      chapter: b.chapter ?? carry.chapter,
      img: b.img ?? carry.img,
      bgm: 'bgm' in b ? b.bgm : carry.bgm,
      amb: 'amb' in b ? b.amb : carry.amb,
    }
    const center = false // 가운데 정렬은 오프닝 영상 자막과 검은 화면 자막만 쓴다
    const beat = { ...b, ...carry, center, start: chapterStart }
    if (beat.type === 'narr' || beat.type === 'line') return paginate(beat)
    if (beat.prompt) {
      const w = KO_LINE.left
      return [{ ...beat, prompt: { ...beat.prompt, text: toLines(sentencesOf(beat.prompt.text), w).join('\n'), en: splitEn(beat.prompt.en, 1)[0] } }]
    }
    return [beat]
  })
}

export let NAME = DEFAULT_NAME
export let BEATS = []
export let CHOICE_MAP = {}
// 이름을 정하고 대본 전체를 다시 만든다. 빈 이름이면 기본 이름을 쓴다.
// 2026-11-28 이름 입력 화면을 없앴다. 주인공 이름은 기본 이름('진')으로 고정한다.
export function applyName(input) {
  NAME = (input ?? '').trim().slice(0, NAME_MAX) || DEFAULT_NAME
  const src = fill(raw, NAME)
  CHOICE_MAP = buildChoiceMap(src)
  BEATS = buildBeats(src)
  return NAME
}
applyName(DEFAULT_NAME)

// 결말별 정보. last는 엔딩 영상의 마지막 컷, color는 엔딩 카드(3061:1315)의 선택 상태 색이다.
// card: 선택 카드 배경 / fade: 하단 그라데이션 [투명 시작색, 중간색, 끝색, 시작 위치]
// dim: 기본(좁은) 카드 배경과 그라데이션
export const ENDING_ORDER = ['adapter', 'insurgent', 'zealot', 'outlier']
export const ENDINGS = {
  // ── Figma 3122:2544 (결과) · 3122:2616 (카드) ──
  adapter: {
    name: 'The Adapter', last: 'e-adapter-party', portrait: 'adapter',
    // 결과 화면 (Figma 3122:2544)
    portraitStyle: { width: 3026, height: 1704, left: -792, top: -279 },
    quotePos: { left: 1218, top: 299 },
    tint: 'rgba(174,234,237,0.25)', base: 'rgb(100,152,174)',
    desc: 'AI와 함께 살며 기준에 맞춰 나를 바꿔 가는 사람',
    quote: '"새 HQ 기준이 발표됐네요.\n인간다움 또한 공부 대상입니다."',
    question: '이제 당신은 인간다움을 되찾은 것 같나요?',
    // 카드 화면 (Figma 3122:2616)
    card: '#d5f6ff',
    fade: ['rgba(149,185,195,0)', '#6d939d 72.14%', '#314c54 97.6%', '34.3%'],
    dim: '#13171c',
    dimFade: 'linear-gradient(180deg, rgba(53,58,66,0) 31.85%, #838c98 71.03%, #d1d5da)',
    cardOpen: { width: 820, height: 880, left: -40, top: 0 },
    cardClosed: { width: 726, height: 799, left: -155, top: 0 },
    cardImg: { width: '195.41%', height: '108.85%', left: '-49.49%', top: '0.02%' },
  },
  // ── Figma 3122:2562 (결과) · 3122:2621 (카드) ──
  insurgent: {
    name: 'The Insurgent', last: 'e-mail', portrait: 'insurgent',
    // 결과 화면 (Figma 3122:2562)
    portraitStyle: { width: 2381, height: 1770, left: -287, top: -380 },
    quotePos: { left: 1195, top: 389 },
    tint: 'rgba(174,234,237,0.25)', base: 'rgb(100,152,174)',
    desc: '나를 규정하는 기준 자체를 무너뜨리려는 사람',
    quote: '"AI는 유능하지만, 인간성을 비교하진 마.\nHQ로 사람을 규정하는 건 잘못됐어."',
    question: '당신이 지키고 싶었던 인간다움은 무엇이었나요?',
    // 카드 화면 (Figma 3122:2621)
    card: '#d5f6ff',
    fade: ['rgba(149,185,195,0)', 'rgba(109,147,157,0.5) 56.19%, rgb(83,117,126) 71.86%', 'rgb(49,76,84) 97.6%', '36.2%'],
    dim: '#181b20',
    dimFade: 'linear-gradient(180deg, rgba(53,58,66,0) 0%, rgba(53,58,66,0.014) 21.9%, rgb(53,58,66) 63.47%, rgb(20,23,28))',
    cardOpen: { width: 887, height: 837, left: -64, top: 0 },
    cardClosed: { width: 548, height: 731, left: -75, top: 0 },
    cardImgOpen: { width: '123.14%', height: '97.09%', left: '-7.24%', top: '-3.65%' },
    cardImgClosed: { width: '173.98%', height: '97.09%', left: '-26.84%', top: '-3.65%' },
  },
  // ── Figma 3122:2580 (결과) · 3122:2631 (카드) ──
  zealot: {
    name: 'The Zealot', last: 'e-zealot-chloe', portrait: 'zealot', cardPortrait: 'zealot-card',
    // 결과 화면 (Figma 3122:2580) — 174.9deg
    portraitStyle: { width: 2009, height: 1615, left: -57, top: -276 },
    photoGradient: 'linear-gradient(174.9deg, rgb(204,204,204) 36.15%, rgb(102,102,102) 96.92%, rgb(81,81,81) 109.64%)',
    quotePos: { left: 1218, top: 349 },
    tint: 'rgba(174,234,237,0.25)', base: 'rgb(100,152,174)',
    desc: 'HQ를 신앙처럼 따르고, AI를 없애려는 사람',
    quote: '"HQ 높은 AI는\n다 죽이면 되지 않나?"',
    question: '인간다워지려다 오히려 인간에게서 멀어졌다면, 어떻게 보이나요?',
    // 카드 화면 (Figma 3122:2631) — open 159.42deg · closed 160.83deg
    card: '#d5f6ff',
    fade: ['rgba(149,185,195,0)', '#6d939d 72.14%', '#314c54 97.6%', '34.3%'],
    dim: '#13171c',
    dimFade: 'linear-gradient(180deg, rgba(53,58,66,0) 31.85%, #bfc4c9 71.15%, #838c98)',
    photoGradientOpen: 'linear-gradient(159.42deg, rgb(204,204,204) 35.82%, rgb(102,102,102) 88.87%, rgb(81,81,81) 99.97%)',
    photoGradientClosed: 'linear-gradient(160.83deg, rgb(204,204,204) 10.89%, rgb(102,102,102) 68.44%, rgb(81,81,81) 80.48%)',
    cardOpen: { width: 780, height: 850, left: -20, top: 0 },
    cardClosed: { width: 680, height: 780, left: -140, top: 0 },
    cardImg: { objectFit: 'cover', objectPosition: 'bottom' },
  },
  // ── Figma 3122:2598 (결과) · 3122:2626 (카드) ──
  outlier: {
    name: 'The Outlier', last: 'e-outlier-up', portrait: 'outlier',
    // 결과 화면 (Figma 3122:2598)
    portraitStyle: { width: 3217, height: 1644, left: -910, top: -236 },
    quotePos: { left: 1207, top: 409 },
    tint: 'rgba(174,234,237,0.25)', base: 'rgb(100,152,174)',
    desc: '기준 밖으로 밀려나 점수 없이 사는 사람',
    quote: '"AI? 웃기고 있네.\nHQ 같은 소리 하지 마. 세상이 미쳤군."',
    question: '숫자가 없어도, 충분히 인간적으로 보이나요?',
    // 카드 화면 (Figma 3122:2626)
    card: '#d5f6ff',
    fade: ['rgba(149,185,195,0)', '#6d939d 72.14%', '#314c54 97.6%', '34.3%'],
    dim: '#181b20',
    dimFade: 'linear-gradient(180deg, rgba(53,58,66,0) 34.13%, #353a42 69.67%, #14171c)',
    cardOpen: { width: 820, height: 961, left: -50, top: -33 },
    cardClosed: { width: 663, height: 884, left: -130, top: 0 },
    cardImgOpen: { width: '217.67%', height: '108.81%', left: '-64.65%', top: '0.01%' },
    cardImgClosed: { width: '247.6%', height: '108.81%', left: '-80.75%', top: '0.01%' },
  },
}
