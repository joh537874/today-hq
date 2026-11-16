// 스토리 데이터. Figma '새로 빚은 스토리 라인'(2393:247) 기준.
// 비트(beat)를 위에서 아래로 순서대로 재생한다. when이 있으면 조건이 맞을 때만 재생한다.

export const CHAPTERS = [
  { id: 1, label: '1장', title: '프롤로그' },
  { id: 2, label: '2장', title: '바뀐 숫자' },
  { id: 3, label: '3장', title: '클로이에게 가는 길' },
  { id: 4, label: '4장', title: '클로이의 집 앞' },
  { id: 5, label: '5장', title: '엔딩' },
]

export const THRESHOLD = 75

const N = (text, extra = {}) => ({ type: 'narr', text, ...extra })
const L = (who, text, extra = {}) => ({ type: 'line', who, text, ...extra })

const raw = [
  // ───────── 1장 · 프롤로그
  { chapter: 1, scene: 'home', place: '집', set: { tv: 'idle' }, hq: 81, ...N('2069년 3월 14일 밤.') },
  { type: 'news', set: { tv: 'breaking' }, headline: 'AI 평균 HQ 82, 인간 평균 81', sub: '관측 이래 처음으로 AI가 인간을 넘어섰습니다' },
  { type: 'term', term: '휴미터', en: 'Humeter', text: '귀 뒤에 붙이는 작은 측정 장치. 표정과 말, 망설임을 읽어 인간다움을 숫자로 바꾼다.' },
  { type: 'term', term: 'HQ', en: 'Humanity Quotient', text: '머리 위에 떠 있는 숫자. 가게도, 회사도, 친구의 집도 이 숫자를 보고 문을 연다.' },
  { type: 'term', term: '크로스오버', en: 'Crossover', text: 'AI의 평균 HQ가 인간의 평균을 넘어선 밤. 오늘이 그날이다.' },
  N('나는 AI 동반자 나인과 함께 뉴스를 본다. 나인의 HQ는 88이다.', { set: { tv: 'dim', nine: true } }),
  {
    type: 'message', from: '클로이', text: '내일 저녁 우리 집에서 생일 모임! 꼭 와.',
    replies: ['당연하지, 갈게!', '응. 내일 봐.'],
  },

  // ───────── 2장 · 카페 앞
  { chapter: 2, scene: 'cafe', place: '카페 앞', type: 'notify', app: '휴미터', title: '오늘의 HQ 72', body: '관리국 기준 v.48 적용', hq: 72, hqWhy: '관리국 기준 v.48 적용', prevHq: 81 },
  N('어제는 81이었다. 달라진 건 기준뿐이다.'),
  N('단골 카페 입구의 기준선이 75로 올라 있다.', { set: { gate: true } }),
  { type: 'gate', at: '단골 카페', fail: '입장 불가', after: '문은 열리지 않는다.' },
  N('나인만 들어갔다가 커피 두 잔을 들고 나온다.', { set: { gate: true, coffee: true } }),
  {
    type: 'choice', id: 'c1', num: '①', title: '나인의 위로', axis: 'ai', amount: 1,
    who: '나인', prompt: '“오늘 많이 당황스러우시죠. 저도 그 기분 알 것 같아요.”',
    options: [
      { text: '“응, 그러네. 위로 고마워.”', sign: 1, inner: '나인이 옆에 있어서 다행이다.' },
      { text: '대충 끄덕이고 커피를 받는다.', sign: -1, inner: '네가 이 기분을 어떻게 알아.' },
    ],
  },
  L('줄 끝의 남자', '“저도 아침에 4점이나 떨어졌어요.”', { set: { gate: true, coffee: true, man: true } }),
  {
    type: 'choice', id: 'c2', num: '②', title: '줄 선 남자의 말', axis: 'std', amount: 1,
    who: '줄 끝의 남자', prompt: '“위원회가 그렇게 정했으면 우리가 좀 부족했던 거겠죠.”',
    options: [
      { text: '“그러게요. 저도 뭐가 부족했는지 좀 돌아봐야겠어요.”', sign: 1, inner: '기준이 올랐으면 나도 올라가야지.' },
      { text: '“글쎄요. 전 어제랑 달라진 게 없는데, 숫자만 바뀐 것 같아서요.”', sign: -1, inner: '바뀐 건 내가 아니라 잣대다.' },
    ],
  },

  // ───────── 2장 · 거리
  { scene: 'street', place: '거리', set: { ad: true }, ...N('커피를 들고 나인과 거리를 걷는다. 버스 정류장 광고판에는 HQ 광고가 돌아간다.') },
  L('나인', '“저녁에 클로이 씨 생일 모임 있죠.”'),
  {
    type: 'choice', id: 'c3', num: '③', title: '나인의 제안', axis: 'ai', amount: 1,
    who: '나인', prompt: '“클로이 씨한테 건넬 축하 인사를 위해 클로이 씨의 SNS를 찾아볼까요?”',
    options: [
      { text: '“그래, 클로이가 좋아할 만한 것을 찾아봐 줘.”', sign: 1, inner: '나인이 찾으면 더 정확하겠지.' },
      { text: '“고마워. 근데 이건 내가 직접 생각해야 마음이 전해질 것 같아.”', sign: -1, inner: '축하 인사까지 맡기고 싶지는 않다.' },
    ],
  },
  N('길 건너에서 재이가 HQ 폐지 시위를 하고 있다.', { set: { ad: true, protest: true } }),
  {
    type: 'choice', id: 'c4', num: '④', title: '재이의 시위', axis: 'std', amount: 1,
    who: '나', prompt: '피켓을 든 재이와 눈이 마주친다.',
    options: [
      { text: '‘HQ는 인간성을 측정하기 위해 필요한 제도다.’ 생각하고 지나친다.', sign: 1, inner: '기준이 없으면 무엇으로 사람을 믿지.' },
      { text: '‘HQ가 정말 인간성을 대변할 수 있는 것일까?’', sign: -1, inner: '오늘 아침의 72가 떠오른다.' },
    ],
  },

  // ───────── 3장 · 지하철
  { chapter: 3, scene: 'subway', place: '지하철', hq: 72, ...N('저녁, 클로이에게 가는 지하철.') },
  N('사람들이 습관처럼 서로의 머리 위를 흘끗 본다.'),
  { type: 'glance', need: 4 },
  N('건너편에서 아이가 울고 있다. AI 승객이 아이를 능숙하게 달랜다. 머리 위의 숫자는 90이다.', { set: { child: true } }),
  L('나인', '“참 다정하시네요.”', { set: { child: true } }),
  {
    type: 'choice', id: 'c6', num: '⑥', title: 'AI 승객', axis: 'ai', amount: 2,
    who: '나', prompt: '아이는 어느새 울음을 그쳤다.',
    options: [
      { text: '“그러게. 정말 다정하다. 배울 만한 태도네.”', sign: 1, inner: '누가 했든 다정한 건 다정한 거다.' },
      { text: '“우는 사람을 보면 달래 주도록 학습된 것뿐이지.”', sign: -1, inner: '저건 마음이 아니라 기능이다.' },
    ],
  },
  N('같은 칸에서 오랜 친구 줄리안을 만난다. 줄리안은 Born Human Society 회원이다.', { set: { julian: true } }),
  L('줄리안', '“AI의 발전은 축복이 아니라 위협일 뿐이야. 인간을 닮아 갈수록 그 위험성은 커지는 법이지.”', { set: { julian: true } }),
  {
    type: 'choice', id: 'c7a', num: '⑦', title: '줄리안의 말 · 1', axis: 'ai', amount: 3,
    who: '줄리안', prompt: '“쓸데없이 사람을 흉내 내는 AI가 결국 어떤 재앙을 불러올지, 생각해 본 적 없나?”',
    options: [
      { text: '“나인이 있어서 삶이 훨씬 편해.”', sign: 1, inner: '재앙이라기엔 매일 도움을 받고 있다.' },
      { text: '‘그러게, 점점 인간의 영역이 위협받고 있는 걸까?’', sign: -1, inner: '오늘 밤 뉴스의 82와 81이 떠오른다.' },
    ],
  },
  {
    type: 'choice', id: 'c7b', num: '⑦', title: '줄리안의 말 · 2', axis: 'ai', amount: 3,
    who: '줄리안', prompt: '“그 깡통이랑 같이 다니지 마. 걔가 너를 잡아먹고 있는 거라니까.”',
    options: [
      { text: '“도움 되는 존재를 그런 식으로 비하하면 넌 어떻게 발전하고 싶은 건데? 사람한테 도움받는 거랑 뭐가 달라.”', sign: 1, inner: '나인은 깡통이 아니다.' },
      { text: '대답하지 않는다. 나인과 살짝 서먹해져 거리를 두고 걷는다.', sign: -1, inner: '틀린 말이 아닐지도 모른다.' },
    ],
  },
  L('줄리안', '“HQ를 올리는 건 쉬워. AI 몸 안에 있는 휴미터를 꺼내서 끼우면 돼.”', { set: { julian: true } }),
  N('줄리안은 다음 역에서 내린다.'),

  // ───────── 4장 · 문 앞
  { type: 'route' },
  { chapter: 4, scene: 'door', place: '클로이의 집 앞', hq: 69, hqWhy: '문 앞에서 길어진 망설임', set: { hands: true }, ...N('클로이의 집 앞. 한 손에는 꽃, 한 손에는 편지.') },
  { type: 'bell' },
  N('초인종을 누르려다 문 옆의 패널을 본다. 오늘 하루 나를 막아 온 그 화면이다.', { set: { hands: true, panel: true } }),
  { type: 'gate', at: '클로이의 집', fail: '입장 불가', after: '친구 집에까지 기준선이 걸려 있을 거라고는 생각하지 못했다.' },

  // 4A · AI를 포용해 온 경우
  { when: (s) => s.route === 'A', set: { hands: true, panel: true, open: true }, ...L('클로이', '“아, 말한다는 게… 애들이 기준 못 낮춘대. 조금만 올려서 오면 안 돼?”') },
  { when: (s) => s.route === 'A', type: 'letter', lines: ['SNS가 시키는 대로 쓴 문장들.', '카페에서 일부러 삼킨 대답.', '지하철에서 연습한 말투.', '오늘 하루 한 모든 일이 이 문 하나를 열기 위한 것이었다.'] },
  { when: (s) => s.route === 'A', set: { hands: true, panel: true, open: true, nine: true }, ...L('나인', '“꼭 들어가고 싶으신 거예요?”') },
  {
    when: (s) => s.route === 'A', type: 'final', num: '⑧', title: '문 앞의 선택',
    who: '클로이', prompt: '“조금만 올려서 오면 안 돼?”',
    options: [
      { key: 'insurgent', text: '돌아선다', desc: '“미안, 오늘은 그냥 갈게.” 점수도, 파티도, 어쩌면 클로이와의 관계도 내려놓는다.' },
      { key: 'adapter', text: 'HQ를 높이기 위해 노력한다', desc: '“HQ를 높일 수 있을 만한 행동이 뭐가 있어?” 나인한테 물어본다.' },
    ],
  },

  // 4B · AI를 배척해 온 경우
  { when: (s) => s.route === 'B', set: { hands: true, panel: true, memory: true }, ...N('줄리안이 했던 말이 떠오른다.') },
  { when: (s) => s.route === 'B', set: { hands: true, panel: true, memory: true }, ...L('줄리안', '“HQ를 올리는 건 쉬워. AI 몸 안에 있는 휴미터를 꺼내서 끼우면 돼.”') },
  { when: (s) => s.route === 'B', set: { hands: true, panel: true, nine: true }, ...N('나인을 바라본다. 나인은 아무것도 모르는 얼굴로 서 있다.') },
  { when: (s) => s.route === 'B', type: 'message', from: '클로이', text: '언제 와? 다들 기다려.', replies: [], set: { hands: true, panel: true, nine: true } },
  {
    when: (s) => s.route === 'B', type: 'final', num: '⑧', title: '문 앞의 선택',
    who: '나', prompt: '문은 닫혀 있고, 나인은 옆에 서 있다.',
    options: [
      { key: 'zealot', text: '어떻게든 들어가기를 선택한다', desc: '내가 어떻게 여기까지 왔는데. AI 때문에 내 인간성이 의심받는다는 게 화가 난다.' },
      { key: 'outlier', text: 'HQ 제도에 회의감을 느낀다', desc: 'AI도 사람도 지친다. AI의 점수를 빌리는 것도 싫다. 이 삶이 진절머리가 난다.' },
    ],
  },

  // ───────── 5장 · 엔딩
  { chapter: 5, type: 'epilogue' },
  { type: 'ending' },
]

// scene, place, chapter를 앞 비트에서 이어받는다.
let carry = { chapter: 1, scene: 'home', place: '' }
export const BEATS = raw.map((b) => {
  const sceneChanged = b.scene && b.scene !== carry.scene
  carry = { chapter: b.chapter ?? carry.chapter, scene: b.scene ?? carry.scene, place: b.place ?? carry.place }
  return { ...b, ...carry, sceneChanged }
})

export const ENDINGS = {
  insurgent: {
    no: '결말 1', name: 'The Insurgent', ko: '돌아선 사람', tag: 'AI 인정 · HQ 거부', hq: '41', tone: 'blue',
    steps: [
      { text: '꽃과 편지를 든 채로 발길을 돌린다. “미안, 오늘은 그냥 갈게.”', hq: 69 },
      { text: '집으로 돌아오는 길, 나인과 별것 아닌 이야기를 나눈다. 바람과 가로등, 밤공기의 온도와 습도가 느껴진다.', hq: 63 },
      { text: '편지는 다음 날 우편으로 보낸다. 기준이 없는 곳에서 건넨 셈이다.', hq: 52 },
      { text: '그 뒤로 입구 앞에서 숫자를 확인하지 않게 된다. HQ는 41까지 떨어진다.', hq: 41 },
      { text: '며칠 뒤 클로이가 집으로 찾아온다. 편지를 읽었다고만 하고, 점수 얘기는 꺼내지 않는다.', hq: 41 },
    ],
    letter: '편지는 우편으로 갔다.',
    question: '그래서 결국 당신이 지킨 인간다움은 무엇인가요?',
    desc: '나를 규정하는 기준 자체를 내려놓은 사람',
  },
  adapter: {
    no: '결말 2', name: 'The Adapter', ko: '맞춰 가는 사람', tag: 'AI 인정 · HQ 인정', hq: '88', tone: 'teal',
    tasks: [
      { label: '감동적인 영상 찾아보기', result: '3분짜리 유기견 구조 영상. 눈물이 날 때까지 다시 본다.', hq: 76 },
      { label: '난민 기구에 기부하기', result: '금액을 고르고, 결제하고, 인증 화면을 띄운다.', hq: 83 },
      { label: '골목의 쓰레기 줍기', result: '휴미터가 잘 보이는 각도로 허리를 숙인다.', hq: 88 },
    ],
    steps: [
      { text: '패널에 88이 뜨고 문이 열린다.', hq: 88 },
      { text: '클로이가 편지를 읽고 말한다. “너 요즘 진짜 사람 같아졌다.”', hq: 88 },
      { text: '칭찬인데 칭찬으로 들리지 않는다. 주머니에서 알림이 울린다. “새 HQ 기준 v.49 해석 특집.”', hq: 88 },
    ],
    letter: '편지는 읽혔다.',
    question: '그래서 이제는 당신의 인간성을 되찾은 것 같은가요?',
    desc: 'AI와 함께 살며 기준에 맞춰 나를 바꿔 가는 사람',
  },
  zealot: {
    no: '결말 3', name: 'The Zealot', ko: '빼앗은 사람', tag: 'AI 적대 · HQ 맹신', hq: '96', tone: 'violet',
    hold: { label: '나인의 휴미터를 꺼낸다', result: '나인의 전원이 꺼진다. 손바닥 위의 휴미터는 아직 따뜻하다.' },
    steps: [
      { text: '귀 뒤에 나인의 휴미터를 끼운다. 패널에 96이 뜨고 문이 열린다.', hq: 96 },
      { text: '나는 파티 장소로 들어가고, 나인은 바닥에 꺼진 채로 남는다.', hq: 96 },
      { text: '클로이가 편지를 읽다 울컥해도 내 숫자는 미동도 없다.', hq: 96 },
      { text: '음료를 나르는 AI를 보며 웃는다. “HQ 높은 AI는 다 죽이면 되지 않나?”', hq: 96 },
    ],
    letter: '편지는 읽혔지만 닿지 않았다.',
    question: '인간성을 되찾기 위해 한 행동인데, 오히려 인간에서 멀어진 사람. 어때 보이나요?',
    desc: 'HQ를 신앙처럼 따르고, AI를 없애려는 사람',
  },
  outlier: {
    no: '결말 4', name: 'The Outlier', ko: '벗어난 사람', tag: 'AI 적대 · HQ 거부', hq: 'Unread', tone: 'mono',
    hold: { label: '내 휴미터를 뺀다', result: '귀 뒤에 하얀 자국이 남는다. 머리 위의 태그는 빈 박스가 된다.' },
    steps: [
      { text: '가족과 회사에 미측정 알림이 즉시 간다.', hq: null },
      { text: '문은 열리지 않는다. 꽃은 문 앞에 두고 간다. 편지는 주머니에 그대로 있다.', hq: null },
      { text: '홀가분한 얼굴로 그 자리를 떠난다. 점수가 없으면 아무도 나를 평가할 수 없지만, 대신 어디에도 들어갈 수 없다.', hq: null },
      { text: '클로이에게서 온 마지막 메시지는 읽지 않은 채로 둔다.', hq: null },
    ],
    letter: '편지는 전해지지 못했다.',
    question: '충분히 인간 같다고 느끼시나요?',
    desc: '기준 밖으로 밀려나 점수 없이 사는 사람',
  },
}
