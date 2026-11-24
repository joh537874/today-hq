// 스토리 데이터. Figma 'HQ 프로토타입 · 대사 & 플로우'(2972:123)와 '컷신 최종'(2956:831) 기준.
// 비트(beat)를 위에서 아래로 순서대로 재생한다. when이 있으면 조건이 맞을 때만 재생한다.
// img는 public/cut/ 아래 컷 이름이며, 생략하면 앞 비트의 컷을 이어받는다.

export const CHAPTERS = [
  { id: 1, title: '프롤로그', en: 'Prologue' },
  { id: 2, title: '바뀐 숫자', en: 'The Shifted Number' },
  { id: 3, title: '클로이에게 가는 길', en: 'On the Way' },
  { id: 4, title: '클로이의 집 앞', en: 'At the Door' },
  { id: 5, title: '엔딩', en: 'Ending' },
]

// 화자 영문 표기 (Figma UI 2251 기준 '나인 Nyin')
export const WHO_EN = {
  진: 'Jin', 나인: 'Nyin', 클로이: 'Chloe', 줄리안: 'Julian', 재이: 'Jae',
  'AI 바리스타': 'AI Barista', 'AI 승객': 'AI Passenger', 뉴스: 'News', 휴미터: 'Humeter', '게이트 안내': 'Gate',
}

// 내레이션 / 대사
const N = (text, en, extra = {}) => ({ type: 'narr', text, en, ...extra })
const L = (who, text, en, extra = {}) => ({ type: 'line', who, text, en, ...extra })
// 선택 결과에 따라 재생 여부를 정한다
const ifPick = (id, sign) => (s) => s.picks.find((p) => p.id === id)?.sign === sign
const ifRoute = (r) => (s) => s.route === r
const ifFinal = (k) => (s) => s.final === k

const raw = [
  // ───────── 1장 · 프롤로그 (선택 없음)
  { chapter: 1, img: 'p-fog', ...N('2030년대, AI의 발전은 인류의 삶을 크게 바꾸어 놓았습니다. 불과 얼마 전까지만 해도 상상에 불과했던 일들이 현실이 되기 시작한 것이죠.', 'In the 2030s, AI transformed human life in remarkable ways. Things that once seemed possible only in our imagination were becoming reality.') },
  N('AI는 인간을 뛰어넘는 능력으로 불가능했던 일들까지 가능하게 만들었습니다. 우리의 삶은 그 어느 때보다 편리하고 풍요로워졌습니다.', 'With abilities beyond human capabilities, AI made even the impossible possible, bringing greater comfort and abundance to our lives.'),
  N('인간의 모습을 하고, 인간의 목소리로 말하며, 때로는 우리의 마음까지 이해하는 AI. 이제 사람들은 그들과 관계를 맺고, 감정을 나누는 일에도 익숙해졌습니다.', 'With human appearances and voices, AI could even understand our feelings. Before long, people grew accustomed to forming relationships and sharing emotions with them.'),
  N('그런데, 모든 것이 좋기만 했을까요? AI가 인간과 점점 더 닮아갈수록 사람들의 마음속에는 새로운 불안이 자리 잡기 시작했습니다. 인간만이 가진다고 믿었던 특별한 지위마저 흔들리는 것은 아닐까요?', 'But was everything really as good as it seemed? As AI became more like humans, a new sense of unease began to emerge. Could even the special status once believed to belong exclusively to humans be at risk?', { img: 'p-city' }),
  N('사람들은 AI가 가져다주는 편리함은 누리면서도, 그들을 자신과 동등한 존재로 받아들이지는 않았습니다. AI를 단순한 도구로 여기고, 그들의 가치를 낮추면서 인간과 AI 사이의 차이를 더욱 분명히 하려 했습니다.', 'People enjoyed the convenience AI offered, but were unwilling to accept them as equals. They treated AI as mere tools, diminished their worth, and sought to widen the divide between humans and AI.'),
  N('이를 위해 사람들은 인간과 AI를 구분할 새로운 기준을 만들었습니다. 바로 HQ입니다.', 'To address this, people established a new standard to distinguish humans from AI. It was called HQ.', { img: 'p-humeter' }),
  N('HQ는 인간다움을 수치화한 점수로, 0점부터 100점까지 대상이 인간일 확률을 나타냅니다. 정확한 판별 기준은 공개되지 않았습니다. 감정이나 망설임, 예상치 못한 실수 등이 기준일 것이라는 추측만 있을 뿐이죠.', 'HQ is a numerical measure of how human-like someone is, representing the probability of being human on a scale from 0 to 100. The exact criteria behind the score remain undisclosed. People can only speculate that factors such as emotions, hesitation, or unexpected mistakes might play a role.'),
  N('HQ관리국은 이를 판별하기 위해 ‘휴미터’라는 장치를 개발했습니다. 귀 뒤에 부착하는 휴미터는 대상의 언행과 표정을 기록하고, 이를 바탕으로 실시간 HQ를 계산합니다.', 'To make this distinction possible, the HQ Bureau developed a device called the Humeter. Worn behind the ear, the Humeter records a subject’s words, actions, and facial expressions, using this data to calculate their HQ score in real time.'),
  N('평균 HQ는 AI가 40점 안팎, 인간은 70~80점. 사람들은 이 점수를 바탕으로 서로의 정체를 구분하기 시작했고, HQ는 인간으로 인정받기 위한 기준이 되었습니다.', 'The average HQ score is around 40 for AI and 70 to 80 for humans. People began using these scores to distinguish one another, and HQ became the standard for being recognized as human.'),
  N('하지만… 정말 이걸로 충분할까요?', 'But… is this really enough?', { img: 'p-woman' }),
  N('AI는 지금도 인간을 닮아가고 있습니다. 인간만이 할 수 있다고 믿었던 일들마저 하나둘 대신하고 있죠.', 'AI continues to become more like humans, taking over tasks once believed to be uniquely human.'),
  N('만약 언젠가 AI가 인간다움마저 따라잡는다면… 그때 인류는 무엇으로 자신을 구분할 수 있을까요?', 'What if, one day, AI catches up with humans in HQ scores as well? What will become of humanity then?'),

  // 당신의 집 · 크로스오버의 밤
  N('2069년 3월 14일 밤.', 'The night of March 14, 2069.', { img: 'p-home' }),
  L('뉴스', '“속보입니다. HQ관리국이 발표한 이번 분기 평균 HQ 점수에서 AI가 처음으로 인간을 넘어섰습니다. 판별 시스템이 인간보다 AI를 더 높은 인간 점수로 평가한 것은 이번이 처음인데요. 인간과 AI의 경계에 또 한 번 큰 파장이 예상됩니다.”', '“Breaking news. According to the HQ Bureau’s latest quarterly report, AI has surpassed humans in average HQ scores for the first time. This marks the first time the identification system has rated AI as more human than humans themselves. The news is expected to send shockwaves through society, once again blurring the line between humans and AI.”', { img: 'p-news-sketch' }),
  N('진은 소파에 앉아 뉴스를 보고 있다. 그때, 휴대폰이 울린다.', 'Jin is watching the news on the sofa. Then the phone rings.', { img: 'p-home' }),
  L('클로이', '“여보세요, 진? 아직 안 자고 있었네? 별건 아니고, 내일 있을 내 생일 파티 말이야. 한 7시쯤 볼까 하는데 시간 괜찮지?”', '“Hello? Jin? You’re still up? Oh, it’s nothing important. I just wanted to talk about my birthday party tomorrow. I was thinking around seven. Does that work for you?”', { img: 'p-phone-sketch', via: '전화' }),
  L('클로이', '“…그래 알겠어. 그럼 그때 보자.”', '“...Alright, got it. I’ll see you then.”', { via: '전화' }),
  L('클로이', '“참, 방금 뉴스를 보니까 HQ가 난리더라. 너희 집 AI는 어때? 이름이… 나인이랬지?”', '“By the way, I just saw the news. HQ is causing quite a stir. How’s the AI at your place? Its name was... Nine, right?”', { via: '전화' }),
  L('클로이', '“…아무튼, 시간이 너무 늦었네. 내일 다시 연락할게. 잘 자.”', '“...Anyway, it’s getting pretty late. I’ll talk to you again tomorrow. Good night.”', { via: '전화' }),
  L('나인', '“그러고 보니, 내일이 클로이 씨의 생일이네요. 내일은 일찍 나가셔야 할 것 같아요. 어서 주무시는 걸 추천할게요.”', '“Come to think of it, tomorrow is Chloe’s birthday. You’ll need to head out early, so I suggest getting some rest now.”', { img: 'p-home' }),
  N('창밖 전광판의 숫자가 자정을 알린다. 늦은 밤에도 도시는 여전히 환하게 빛나고, 사람들은 저마다의 밤을 보낸다.', 'The billboard outside marks midnight. Even this late, the city still glows, and everyone spends their own night.', { img: 'p-city' }),

  // ───────── 2장 · 집 · 다음 날 아침
  { chapter: 2, img: 's2-morning', hq: 72, ...L('휴미터', '“좋은 아침입니다, 진 님. 오늘의 HQ는 72입니다. (▼9) · 관리국 기준 갱신”', '“Good morning, Jin. Your HQ is 72 today.”') },
  N('다음 날 아침, 진의 HQ가 81에서 72로 떨어졌다. 밤사이 관리국 기준이 갱신된 것이다.', 'The next morning, Jin’s HQ dropped from 81 to 72. The Bureau updated its standard overnight.'),
  L('진', '“젠장. 하룻밤 새 9점이나 떨어졌네.”'),
  L('나인', '“오… 괜찮습니다, 진. HQ는 매일 갱신되는 것이니까요. 오늘 하루는 제가 동행할 테니 큰 문제는 없을 겁니다.”', '“Oh... that’s alright, Jin. HQ is updated daily, after all. I’ll be accompanying you today, so there shouldn’t be any major problems.”'),
  N('나인의 HQ는 88. 나보다 더 높게 책정되어 있다.'),
  L('진', '“나보다… 더 높잖아.”'),
  L('나인', '“저는 당신의 최고의 친구이자 비서로서, 매일 밤 업데이트를 하고 있거든요.”', '“As your best friend and personal assistant, I make sure to update my score every night.”'),

  // 책상 위 편지
  L('나인', '“그나저나 진, 클로이를 위한 선물은 준비했나요?”', '“By the way, Jin, have you prepared a gift for Chloe?”', { img: 's2-letter' }),
  L('진', '“이런, 그러고 보니 어제 뉴스를 보다 늦게 잠들어 선물을 준비하지 못했네.”'),
  L('나인', '“그렇다면 손편지는 어떤가요? 최근 아날로그한 축하 방식이 유행을 하고 있다고 해요.”', '“How about a handwritten letter? I’ve heard that handwritten congratulations are becoming quite popular lately.”'),
  L('진', '“좋은 아이디어야, 나인.”'),
  N('진은 책상에 앉아 클로이에게 줄 편지를 쓸 준비를 한다.'),
  L('진', '“…실수로 잘못 적었어. 오늘은 되는 일이 없군.”', undefined, { img: 's2-letter-close' }),
  L('나인', '“오타가 나쁘지만은 않아요. 듣자 하니 소문에 의하면, ‘실수’를 많이 할수록 HQ가 높아진다고도 하더라고요. AI는 실수를 하지 않으니까 그런 걸까요?”', '“Oh, mistakes aren’t necessarily a bad thing. According to rumors, the more mistakes you make, the higher your HQ score gets. Maybe it’s because AIs never make mistakes?”'),
  L('나인', '“어떤 사람들은 그래서 일부러 오타투성이 편지를 주고받기도 해요.”', '“Some people even deliberately give and receive letters with typos for that very reason.”'),
  L('진', '“오타를 내면 HQ에 도움이 된다고?”'),
  L('나인', '“소문에 의하면요.”', '“That’s what the rumors say.”'),
  N('편지로 돌아온 진은, 방금 쓴 문장에서 틀린 맞춤법 하나를 발견하고 손에 든 지우개를 바라보며 생각에 빠진다.', undefined, { img: 's2-letter' }),
  {
    type: 'choice', id: 'c1', num: '①', axis: 'hq',
    prompt: N('편지 속 틀린 맞춤법 하나. 커서가 그 위에서 깜빡인다.'),
    options: [
      { text: '틀린 맞춤법을 보고도 고치지 않고 그대로 둔다.', sign: 1 },
      { text: '틀린 맞춤법을 고쳐 제대로 다시 쓴다.', sign: -1 },
    ],
  },
  N('편지를 다 쓰고 봉투에 넣는다.', undefined, { img: 's2-letter-write' }),
  L('나인', '“다 쓰셨나요? 쓰시는 사이에 백화점에 선물을 예약해 두었어요. 가는 길에 바로 픽업하면 돼요.”', '“Are you all set? While you were getting ready, I reserved a gift for you at the department store. We can pick it up on our way.”'),
  L('진', '“고마워, 나인. 바로 나가자.”'),

  // 백화점 입구 · 낮
  N('백화점으로 향한다. 입구에는 기준선이 적혀 있다. HQ 75.', undefined, { img: 's2-store' }),
  N('나인이 먼저 게이트를 지난다. 88, 초록 불. 뒤따르던 진 앞에서 짧은 경고음과 함께 빨간 불이 켜진다.'),
  L('게이트 안내', '“죄송합니다. 현재 HQ로는 입장하실 수 없습니다.”', '“We’re sorry. Your current HQ score does not meet the entry requirements.”'),
  N('안으로 들어갔던 나인이 발길을 돌려, 들어오지 못한 진에게 돌아온다.', undefined, { img: 's2-nine-back' }),
  N('나인이 진의 얼굴을 살핀다.', undefined, { img: 's2-nine-face' }),
  {
    type: 'choice', id: 'c2', num: '②', axis: 'ai',
    prompt: L('나인', '“…진? 괜찮나요?”', '“...Jin? Are you okay?”'),
    options: [
      { text: '“하… 여긴 못 가겠다. 다른 갈 만한 데 있을까? 장소 찾아봐 줘.”', sign: 1 },
      { text: '‘AI는 들어가는데 사람이 못 들어가는 게 말이 되나.’ 생각한다.', sign: -1 },
    ],
  },
  { when: ifPick('c2', 1), ...L('나인', '“…어쩔 수 없죠. 제가 빠르게 다른 방법을 찾아볼게요.”', '“...There’s nothing we can do. I’ll quickly look for another way.”') },
  { when: ifPick('c2', -1), ...L('나인', '“…어쩔 수 없죠. 제가 가서 픽업해 올게요. 잠시만 기다려 주세요.”', '“...There’s nothing we can do. I’ll go pick it up myself. Please wait here for a moment.”') },

  // 단골 카페
  L('진', '“그래도 어찌저찌 선물을 샀네. 지쳤어.”', undefined, { img: 's2-cafe' }),
  L('나인', '“의도치 않게 너무 시간이 오래 걸렸네요. 생체 신호를 보니 많이 지치신 것 같아요. 마침 근처에 카페가 있으니, 잠시 쉬었다 가죠.”', '“I’m sorry it took so much longer than expected. Your vital signs suggest you’re quite tired. There’s a café nearby, so why don’t we take a short break?”'),
  N('둘은 기준선이 70인 단골 카페로 간다. 패널에 72가 뜨고, 초록 불이 켜진다.'),
  N('커피를 주문하자, 카운터의 AI 바리스타가 컵을 내밀며 말을 건다.', undefined, { img: 's2-barista' }),
  L('AI 바리스타', '“안녕하세요~! 날씨가 우중충해서 다운되는 하루네요. 저는 오늘 같은 날만 되면 기분이 축 처지더라고요.”', '“Hello~! The weather is so gloomy today, isn’t it? Days like this always bring my mood down.”'),
  {
    type: 'choice', id: 'c3', num: '③', axis: 'ai',
    prompt: L('AI 바리스타', '“…어머, 보아하니 안색이 좋지 않은데, 손님도 오늘 좀 힘드신가 봐요?”', '“...Oh, you don’t look too well. Are you having a rough day, too?”'),
    options: [
      { text: '“그러게요. 오늘 참… 기분이 안 좋은 하루네요.”', sign: 1 },
      { text: 'AI가 기분을 느끼다니 어이없다고 생각하며, 대충 끄덕이고 커피를 받아 간다.', sign: -1 },
    ],
  },
  { when: ifPick('c3', 1), ...L('AI 바리스타', '“저런, 기분 전환을 위해 휘핑크림이라도 얹어 드릴까요? 힘내세요.”', '“Would you like some whipped cream on top to lift your spirits? Hang in there!”') },
  { when: ifPick('c3', -1), ...L('AI 바리스타', '“안녕히 가세요 손님, 좋은 하루 되세요~!”', '“Goodbye! Have a wonderful day~!”') },

  // 길거리
  N('커피를 받아 카페를 나와 걷는데, 길 건너에서 누군가 홀로 피켓을 들고 서 있다.', undefined, { img: 's2-jae' }),
  N('재이다. 피켓에는 ‘HQ 폐지’. 숫자가 없는 재이의 머리 위를 흘끗 본 사람들은, 못 본 척 지나간다.'),
  L('재이', '“HQ는 진짜 인간다움이 아닙니다! 그걸 누가, 어떻게 규정하는 거죠? 내 스스로조차 제대로 알지 못하는데, 어떻게 인간다움을 규정한단 말입니까?!”', '“HQ isn’t what makes someone human! Who gets to decide what that means, and how? I don’t even fully understand myself, so how can anyone define what it means to be human?!”'),
  L('재이', '“실수를 하면 인간이라고? 감정을 많이 느끼면 인간이라고? 그런 건 인간다움이라고 할 수 없어요. 인간다움은 고정된 개념이 아닙니다. 인간다움은 우리 스스로 찾아 나가는 거죠!”', '“Making mistakes makes you human? Feeling emotions makes you human? You can’t define humanity that way. Humanity isn’t a fixed concept. It’s something we have to discover for ourselves!”'),
  {
    type: 'choice', id: 'c4', num: '④', axis: 'hq',
    prompt: N('재이가 HQ 폐지 시위를 하고 있다.'),
    options: [
      { text: '‘HQ는 인간성을 측정하려면 필요한 제도지.’라고 생각하며 지나친다.', sign: 1 },
      { text: '‘HQ가 정말 인간성을 대변할 수 있는 것일까?’ 깊게 생각해 보게 된다.', sign: -1 },
    ],
  },
  N('나란히 걷던 나인이 저녁 파티 이야기를 꺼낸다.', undefined, { img: 's2-nine-flowers' }),
  L('나인', '“진, 그러고 보니 클로이의 파티에 참석하는 건 굉장히 오랜만이네요.”', '“Jin, come to think of it, it’s been a really long time since you’ve attended one of Chloe’s parties.”'),
  L('진', '“응. 그래서 살짝 걱정이 돼. 솔직히, 요즘 뭐 하고 사는지도 모르거든.”'),
  {
    type: 'choice', id: 'c5', num: '⑤', axis: 'ai',
    prompt: L('나인', '“음, 그럼 제가 클로이의 관심사를 기반으로 축하 대화를 시뮬레이션해 드릴까요? 제가 준비한 대사대로 말만 해도 그녀는 굉장히 좋아할 거예요.”', '“Hmm, would you like me to simulate a congratulatory conversation based on Chloe’s interests? If you just say the lines I’ve prepared, she’ll absolutely love it.”'),
    options: [
      { text: '“그래, 클로이가 좋아할 만한 것을 찾아봐 줘.”', sign: 1 },
      { text: '“괜찮아. 이건 내가 직접 생각해야 진심이 전해질 것 같아.”', sign: -1 },
    ],
  },
  L('나인', '“알겠습니다.”', '“Okay.”'),

  // ───────── 3장 · 지하철 · 저녁
  { chapter: 3, img: 's3-subway', ...N('저녁, 클로이의 집으로 가는 지하철.', 'Evening, on the subway to Chloe’s place.') },
  N('맞은편 자리에서 아이가 갑자기 울음을 터뜨린다.'),
  N('가장 먼저 움직인 건 옆자리의 AI 승객이었다. 머리 위 HQ 90. AI 승객이 아이를 능숙하게 달랜다.', undefined, { img: 's3-passenger' }),
  L('AI 승객', '“오 이런, 괜찮아? 많이 놀랐지. 울음 뚝 그치렴.”', '“Oh dear, are you alright? That must have been quite a scare. There, there. No need to cry.”'),
  N('이를 보고 나인이 귓속말로 말한다.', undefined, { img: 's3-nine' }),
  {
    type: 'choice', id: 'c6', num: '⑥', axis: 'ai',
    prompt: L('나인', '“참 다정하네요.”', '“He’s very kind.”'),
    options: [
      { text: '“그러게. 정말 다정하다. 배울 만해.”', sign: 1 },
      { text: '“우는 사람을 보면 달래 주도록 학습된 것뿐이지.”', sign: -1 },
    ],
  },

  // 지하철 · 다음 역
  N('잠시 뒤 열차의 문이 열리고, 오랜 친구이자 Born Human Society 회원인 줄리안과 마주친다.', undefined, { img: 's3-julian-door' }),
  N('줄리안은 진과 나인의 HQ를 보며 말을 꺼낸다.'),
  L('줄리안', '“진! 오랜만이야. 근데 옆에 있는….”', '“Jin! Long time no see. But who’s that beside you...?”', { img: 's3-julian' }),
  L('나인', '“안녕하세요, 줄리안. 오랜만이군요. 기억하실지 모르겠지만, 저는 진의 AI 비서 나인입니다.”', '“Hello, Julian. It’s been a while. You may not remember me, but I’m Nyin, Jin’s AI assistant.”', { img: 's3-nine' }),
  L('줄리안', '“…기억하지. 근데 HQ가 이렇게 높진 않았던 걸로 기억해서.”', '“...I remember. But I don’t recall your HQ being this high.”', { img: 's3-julian' }),
  L('나인', '“아시다시피, 저는 매일 업데이트를 하거든요. 점점 더 인간다워지는 것이 놀라운 일은 아니죠.”', '“As you know, I receive updates every day. It’s only natural that I’m becoming more human-like.”', { img: 's3-nine' }),
  N('줄리안은 시선을 나인에게서 돌려 진을 바라본다.', undefined, { img: 's3-julian' }),
  L('줄리안', '“진, 진심이야? 인간을 모방한 고철 덩어리가 주제도 모르고 기어오르는데 넌 불쾌하지도 않아?”', '“Jin, are you serious? You’re not even uncomfortable with this pile of scrap metal pretending to be human and getting above its station?”'),
  {
    type: 'choice', id: 'c7', num: '⑦', axis: 'ai',
    prompt: L('줄리안', '“AI의 발전은 축복이 아니라 위협일 뿐이야. 인간을 닮아 갈수록 그 위험성은 커지는 법이지.”'),
    options: [
      { text: '“글쎄, 나는 나인이 있어서 삶이 훨씬 나아졌어.”', sign: 1 },
      { text: '‘정말 인간의 영역이 점점 위협받고 있는 걸까?’ 잠시 생각에 잠긴다.', sign: -1 },
    ],
  },
  N('진이 내릴 즈음, 줄리안이 나인을 턱으로 가리키며 말한다.', undefined, { img: 's3-julian-point' }),
  {
    type: 'choice', id: 'c8', num: '⑧', axis: 'ai',
    prompt: L('줄리안', '“그 깡통이랑 같이 다니지 마. 장담컨대, 언젠가는 큰코다칠 거야. 우리 자릴 빼앗길 거라고.”', '“Stop hanging around with that tin can. Trust me, you’ll regret it someday. They’re going to take our place.”'),
    options: [
      { text: '“AI한테 도움받는 거랑 사람한테 도움받는 거랑 뭐가 달라?”', sign: 1 },
      { text: '대답하지 않고 나인과 조금 거리를 두고 걷는다.', sign: -1 },
    ],
  },

  // ───────── 4장 · 클로이의 집 앞 · 저녁
  { type: 'route' },
  { chapter: 4, img: 's4-hands', ...N('지하철에서 내려 클로이의 집으로 향한다.', 'Getting off the subway, Jin heads to Chloe’s place.') },
  N('클로이의 집 앞에 도착한 진이 초인종을 누르려다 문 옆 패널을 본다. 입장 기준 75.', undefined, { img: 's4-corridor' }),
  N('당황한 진은 초인종을 누르고, 도어폰에서 클로이의 목소리가 나온다.', undefined, { img: 's4-panel' }),
  L('클로이', '“왔구나. …어, 잠깐만 너 HQ가…”', '“You’re here! ...Oh, wait, your HQ...”'),
  N('스피커 너머로 뒤쪽의 웃음소리가 섞여 들어온다.'),
  L('클로이', '“미리 말할걸 그랬네. 미안하지만 너도 알다시피 체면상… 우린 75 이하의 사람과 어울리기 조금 그래. 애들이 기준은 못 낮춘다는데… HQ 조금만 올려서 다시 오면 안 돼?”', '“I should’ve told you earlier. I’m sorry, but as you know, I have my reputation to think about... We’re just not comfortable having anyone with a score below 75 around. The others won’t lower the threshold... Could you try raising your HQ a little and come back?”'),

  // Route A · AI를 인정한 사람들
  { when: ifRoute('A'), img: 's4-jin-a', ...N('나인과 함께 문 앞에 선다.') },
  { when: ifRoute('A'), ...N('손에는 클로이에게 줄 편지가 들려 있다. 친구 집에까지 기준선이 있을 줄은 몰랐다. 옆에서 나인이 조용히 진을 바라본다.') },
  {
    when: ifRoute('A'), type: 'final', num: '⑨',
    options: [
      { key: 'adapter', text: 'HQ를 높이기 위해 시도한다' },
      { key: 'insurgent', text: '돌아선다' },
    ],
  },
  { when: ifFinal('adapter'), ...L('진', '“HQ를 올리려면 뭘 하면 돼?”') },
  { when: ifFinal('adapter'), ...N('진이 나인에게 묻는다.') },
  { when: ifFinal('insurgent'), ...N('편지를 든 채 발길을 돌린다.') },
  { when: ifFinal('insurgent'), ...L('진', '“미안, 오늘은 그냥 갈게.”') },

  // Route B · AI를 배척한 사람들
  { when: ifRoute('B'), img: 's4-julian-b', ...N('손에는 클로이에게 줄 편지가 들려 있다. 아까 마주친 줄리안이 했던 말이 떠오른다.') },
  { when: ifRoute('B'), ...L('줄리안', '“친구로서 충고하는 거야. 절대 저 깡통보다 HQ가 낮게 두지 마.”', '“I’m telling you this as a friend. Never let your HQ score fall below that tin can’s.”', { via: '회상' }) },
  { when: ifRoute('B'), ...L('줄리안', '“…그럼 어떻게 하냐고? 이용하는 거지. HQ 점수를 올리는 건 쉬워. 저 깡통 안에 있는 휴미터를 꺼내서 너한테 끼우면 돼.”', '“...You want to know how? Use it. Raising your HQ score is easy. Just take the Humeter out of that tin can and wear it yourself.”', { via: '회상' }) },
  {
    when: ifRoute('B'), type: 'final', num: '⑨', img: 's4-jin-b',
    options: [
      { key: 'zealot', text: '어떻게든 들어간다' },
      { key: 'outlier', text: 'HQ 제도에 회의를 느낀다' },
    ],
  },
  { when: ifFinal('zealot'), ...L('진', '“여기까지 와서 돌아갈 순 없어.”') },
  { when: ifFinal('outlier'), ...N('AI의 점수를 빌려서까지 들어가고 싶지는 않다.') },

  // ───────── 5장 · 엔딩 (엔딩 영상 → 마지막 질문 → 결과 화면, Figma 2254 · 2255 · 2262)
  { chapter: 5, when: ifFinal('adapter'), img: 'e-adapter-phone', ...N('급하게 감동적인 영상을 찾아보고, 기부를 하고, 길에서 쓰레기를 줍는다.') },
  { when: ifFinal('adapter'), img: 'e-adapter-party', ...N('그렇게 애를 써서 들어간 클로이의 집. 진은 점수를 겨우 올려 파티에 들어간다.') },
  { when: ifFinal('adapter'), ...N('쓸쓸한 진의 뒷모습과 파티 소음이 교차된다.') },

  { chapter: 5, when: ifFinal('insurgent'), img: 'e-insurgent-sky', ...N('하늘을 올려다보며 나인과 이야기를 나눈다. 바람과 온도를 느끼는 지금, 진은 오히려 가장 사람답다고 느낀다.') },
  { when: ifFinal('insurgent'), ...N('진은 파티에 가지 않고 나인과 함께 집으로 돌아간다. 나인과 자신의 집에서 저녁을 보낸다.') },
  { when: ifFinal('insurgent'), img: 'e-mail', ...N('편지는 다음 날 우편으로 보낸다.') },

  { chapter: 5, when: ifFinal('zealot'), img: 'e-zealot-hand', ...N('나인의 몸에서 휴미터를 꺼내 귀에 단다.') },
  { when: ifFinal('zealot'), img: 'e-zealot-nine', ...N('진은 파티에 들어가고, 꺼진 나인은 문 앞 바닥에 쓰러져 있다.') },
  { when: ifFinal('zealot'), img: 'e-zealot-chloe', ...N('클로이가 편지를 읽다 눈물을 보여도 진의 숫자는 그대로다.') },

  { chapter: 5, when: ifFinal('outlier'), img: 'e-outlier-humeter', ...N('진은 자기 휴미터를 떼어 내고 던져 버린다.') },
  { when: ifFinal('outlier'), img: 'e-outlier-sketch', ...N('그리고 한결 가벼운 얼굴로 그 자리를 떠난다.') },
  { when: ifFinal('outlier'), img: 'e-outlier-up', ...N('머리 위 숫자가 사라지고, 진은 편지를 주머니에 넣은 채 돌아선다.') },

  { type: 'after' },
  { type: 'result' },
]

// chapter, img를 앞 비트에서 이어받는다. 각 장의 첫 내레이션과 1장 내레이션은 가운데 정렬한다.
let carry = { chapter: 1, img: 'p-fog' }
export const BEATS = raw.map((b) => {
  const chapterStart = b.chapter != null && b.chapter !== carry.chapter
  carry = { chapter: b.chapter ?? carry.chapter, img: b.img ?? carry.img }
  const center = b.type === 'narr' && (carry.chapter === 1 || (chapterStart && carry.chapter < 5))
  return { ...b, ...carry, center }
})

// 결말별 정보. last는 엔딩 영상의 마지막 컷, color는 엔딩 카드(3061:1315)의 선택 상태 색이다.
// card: 선택 카드 배경 / fade: 하단 그라데이션 [투명 시작색, 중간색, 끝색, 시작 위치]
// dim: 기본(좁은) 카드 배경과 그라데이션
export const ENDING_ORDER = ['adapter', 'insurgent', 'zealot', 'outlier']
export const ENDINGS = {
  adapter: {
    name: 'The Adapter', last: 'e-adapter-party', portrait: 'adapter',
    desc: 'AI와 함께 살며 기준에 맞춰 나를 바꿔 가는 사람',
    quote: '새 HQ 기준이 발표됐네요, 인간다움 또한 공부 대상입니다.',
    question: '이제 당신은 인간다움을 되찾은 것 같나요?',
    card: '#7cafc6', fade: ['rgba(122,175,193,0)', '#53879e 72%', '#29506e 97.6%', '34.3%'],
    tint: 'rgba(174,234,237,0.25)', base: 'rgb(100,152,174)',
    dim: '#13171c', dimFade: 'linear-gradient(180deg, rgba(53,58,66,0) 31.85%, #838c98 71%, #d1d5da)',
  },
  insurgent: {
    name: 'The Insurgent', last: 'e-mail', portrait: 'insurgent',
    desc: '나를 규정하는 기준 자체를 무너뜨리려는 사람',
    quote: 'AI는 유능하지만, 인간성을 비교하진 마. HQ로 사람을 규정하는 건 잘못됐어.',
    question: '당신이 지키고 싶었던 인간다움은 무엇이었나요?',
    card: '#bed9ff', fade: ['rgba(39,78,133,0)', '#274e85 70%', '#0d1733', '28%'],
    tint: 'rgba(190,217,255,0.25)', base: '#274e85',
    dim: '#181b20', dimFade: 'linear-gradient(180deg, rgba(53,58,66,0) 0%, rgba(53,58,66,0.014) 21.9%, rgb(53,58,66) 69.67%, rgb(20,23,28))',
  },
  zealot: {
    name: 'The Zealot', last: 'e-zealot-chloe', portrait: 'zealot',
    desc: 'HQ를 신앙처럼 따르고, AI를 없애려는 사람',
    quote: 'HQ 높은 AI는 다 죽이면 되지 않나?',
    question: '인간다워지려다 오히려 인간에게서 멀어졌다면, 어떻게 보이나요?',
    card: '#1a1438', fade: ['rgba(22,17,49,0)', '#161131 70%', '#080a1a', '27.7%'],
    tint: 'rgba(26,20,56,0.25)', base: '#161131',
    dim: '#13171c', dimFade: 'linear-gradient(180deg, rgba(53,58,66,0) 31.85%, #838c98 71%, #d1d5da)',
  },
  outlier: {
    name: 'The Outlier', last: 'e-outlier-up', portrait: 'outlier',
    desc: '기준 밖으로 밀려나 점수 없이 사는 사람',
    quote: 'AI? 웃기고 있네, HQ 같은 소리 하지 마. 세상이 미쳤군.',
    question: '숫자가 없어도, 충분히 인간적으로 보이나요?',
    card: '#e0e4ee', fade: ['rgba(53,58,66,0)', '#353a42 70%', '#14171c', '29%'],
    tint: 'rgba(224,228,238,0.25)', base: '#353a42',
    dim: '#181b20', dimFade: 'linear-gradient(180deg, rgba(53,58,66,0) 34.1%, #353a42 69.67%, #14171c)',
  },
}
