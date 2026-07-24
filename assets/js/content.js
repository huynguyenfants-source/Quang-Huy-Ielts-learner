/* content.js — sample IELTS content: tasks, passages, vocab */

/* ── Writing tasks ───────────────────────────────────────── */
export const WRITING_TASKS = [
  {
    id: 'w1',
    type: 'task1',
    title: 'Bar Chart — Internet Usage',
    prompt: `The bar chart below shows the percentage of people who used the internet in three countries between 2000 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.`,
    image: null,
  },
  {
    id: 'w2',
    type: 'task2',
    title: 'Technology & Education',
    prompt: `Some people believe that technology has made education worse. Others argue that it has improved it.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words.`,
    image: null,
  },
  {
    id: 'w3',
    type: 'task2',
    title: 'Remote Work',
    prompt: `More and more people are working from home rather than going into an office.\n\nDo you think the advantages of this trend outweigh the disadvantages?\n\nWrite at least 250 words.`,
    image: null,
  },
  {
    id: 'w4',
    type: 'task2',
    title: 'Urban vs Rural Life',
    prompt: `People are moving from rural areas to cities in large numbers.\n\nWhat problems does this create? What measures can be taken to solve them?\n\nWrite at least 250 words.`,
    image: null,
  },
  {
    id: 'w5',
    type: 'task1',
    title: 'Line Graph — CO₂ Emissions',
    prompt: `The graph below shows CO₂ emissions per capita in five countries from 1990 to 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.`,
    image: null,
  },
];

/* ── Reading passages ────────────────────────────────────── */
export const READING_PASSAGES = [
  {
    id: 'r1',
    title: 'The Rise of Renewable Energy',
    difficulty: 'medium',
    text: `Over the past two decades, renewable energy has shifted from a niche interest to a mainstream concern for governments, businesses, and individuals worldwide. Solar and wind power, in particular, have experienced dramatic cost reductions, making them cost-competitive — and in many regions, cheaper — than fossil fuels for new electricity generation.

The transformation has been driven by a combination of technological progress, economies of scale, and supportive policy frameworks. Advances in photovoltaic cell efficiency mean that modern solar panels convert roughly 22–23 % of sunlight into electricity, compared with approximately 15 % a decade ago. Meanwhile, wind turbines have grown taller and their blades longer, allowing them to capture more energy even at lower wind speeds.

Critics point out that intermittency remains a challenge: the sun does not always shine and the wind does not always blow. However, proponents argue that rapidly falling battery storage costs and the expansion of smart grids are addressing this limitation. Several countries — including Denmark, which regularly generates more than 50 % of its electricity from wind — demonstrate that high renewable penetration is operationally feasible.

Looking ahead, analysts predict that solar capacity alone could triple by 2030 as emerging economies in Asia, Africa, and Latin America accelerate deployment. The shift carries profound implications not only for climate targets but also for energy security, employment, and the geopolitical balance of power.`,
    questions: [
      {
        id: 'r1q1',
        text: 'What is the main reason renewable energy has become cost-competitive with fossil fuels?',
        options: ['Government subsidies only', 'Technological progress and economies of scale', 'Falling demand for fossil fuels', 'International trade agreements'],
        answer: 1,
      },
      {
        id: 'r1q2',
        text: 'Approximately what percentage of sunlight do modern solar panels convert to electricity?',
        options: ['10 %', '15 %', '22–23 %', '30 %'],
        answer: 2,
      },
      {
        id: 'r1q3',
        text: 'Which country regularly generates over 50 % of its electricity from wind?',
        options: ['Germany', 'Denmark', 'Spain', 'Netherlands'],
        answer: 1,
      },
      {
        id: 'r1q4',
        text: 'According to the passage, what is the main challenge critics associate with renewable energy?',
        options: ['High cost', 'Intermittency', 'Land use', 'Water consumption'],
        answer: 1,
      },
    ],
  },
  {
    id: 'r2',
    title: 'Biodiversity and Ecosystem Services',
    difficulty: 'hard',
    text: `Biodiversity — the variety of life on Earth — underpins the functioning of ecosystems and the services they provide to humanity. These services range from provisioning goods such as food, fresh water, and medicines to regulating functions including climate stabilisation, flood control, and pollination, as well as cultural benefits such as recreation and spiritual fulfilment.

Despite its fundamental importance, biodiversity is under unprecedented threat. The IUCN Red List currently classifies more than 40,000 species as threatened with extinction, a figure that has grown steadily over the past four decades. Habitat destruction, driven primarily by agricultural expansion, remains the single greatest driver of biodiversity loss, followed by invasive species, overexploitation, pollution, and climate change.

Economists have attempted to quantify the value of ecosystem services to highlight the true cost of biodiversity loss. A landmark study estimated the total value of global ecosystem services at USD 125–145 trillion per year — roughly 1.5 times global GDP. While critics caution that placing a monetary value on nature risks commodifying it and ignoring intrinsic worth, proponents argue that without such figures, biodiversity receives little weight in policy and investment decisions.

Conservation efforts have achieved notable successes: the recovery of the bald eagle and grey wolf in North America, the expansion of marine protected areas, and the gradual stabilisation of some deforestation rates in the Amazon. Nevertheless, scientists warn that without a fundamental change in the relationship between human society and the natural world, the current trajectory of biodiversity loss will continue to accelerate.`,
    questions: [
      {
        id: 'r2q1',
        text: 'How many species does the IUCN Red List currently classify as threatened?',
        options: ['Over 10,000', 'Over 40,000', 'Over 100,000', 'Over 200,000'],
        answer: 1,
      },
      {
        id: 'r2q2',
        text: 'What is identified as the single greatest driver of biodiversity loss?',
        options: ['Climate change', 'Pollution', 'Habitat destruction', 'Overexploitation'],
        answer: 2,
      },
      {
        id: 'r2q3',
        text: 'The landmark study estimated the value of ecosystem services at roughly how many times global GDP?',
        options: ['0.5 times', '1 time', '1.5 times', '2 times'],
        answer: 2,
      },
    ],
  },
];

/* ── Listening prompts (TTS) ─────────────────────────────── */
export const LISTENING_TRACKS = [
  {
    id: 'l1',
    title: 'Campus Information — Library',
    script: `Good morning, everyone. Welcome to the university library orientation. My name is Sarah, and I'll be your guide today. The library is open Monday through Friday, from eight in the morning until ten at night. On weekends, we open at nine and close at six. We have four floors. The ground floor has the main lending desk, computers for catalogue searches, and the periodicals section. The second floor is dedicated to reference books — these cannot be borrowed, but you may use them in the library. The third floor houses quiet study rooms, which must be booked in advance through the student portal. Finally, the fourth floor contains our Special Collections archive, which requires special permission to access. To borrow items, you need your student ID card. Most books can be borrowed for three weeks and renewed twice online. If you have any questions, please do not hesitate to ask any member of staff. Thank you, and enjoy your studies.`,
    questions: [
      { id: 'l1q1', text: 'What time does the library open on weekdays?', options: ['7:00', '8:00', '9:00', '10:00'], answer: 1 },
      { id: 'l1q2', text: 'Where are quiet study rooms located?', options: ['Ground floor', 'Second floor', 'Third floor', 'Fourth floor'], answer: 2 },
      { id: 'l1q3', text: 'How many times can a book be renewed online?', options: ['Once', 'Twice', 'Three times', 'Four times'], answer: 1 },
    ],
  },
  {
    id: 'l2',
    title: 'Academic Lecture — Climate Science',
    script: `Today we're going to talk about the greenhouse effect and its role in climate change. The greenhouse effect is actually a natural process that keeps our planet warm enough to support life. Without it, the average surface temperature of the Earth would be around minus eighteen degrees Celsius, instead of the current plus fifteen. The problem is that human activities — primarily the burning of fossil fuels and deforestation — are increasing the concentration of greenhouse gases in the atmosphere. These gases, including carbon dioxide, methane, and nitrous oxide, trap more heat, leading to what scientists call enhanced greenhouse effect or global warming. Since the industrial revolution, global average temperatures have risen by approximately 1.1 degrees Celsius. While this may sound small, the consequences are far-reaching: more frequent and intense extreme weather events, rising sea levels, melting glaciers, and disruption of ecosystems. International agreements such as the Paris Agreement aim to limit warming to 1.5 degrees above pre-industrial levels, but achieving this will require rapid and deep cuts in emissions across all sectors of the economy.`,
    questions: [
      { id: 'l2q1', text: 'Without the greenhouse effect, what would Earth\'s average temperature be?', options: ['-18°C', '-5°C', '+5°C', '+15°C'], answer: 0 },
      { id: 'l2q2', text: 'By how much have global temperatures risen since the industrial revolution?', options: ['0.5°C', '1.1°C', '1.5°C', '2°C'], answer: 1 },
      { id: 'l2q3', text: 'What does the Paris Agreement aim to limit warming to?', options: ['1°C', '1.5°C', '2°C', '2.5°C'], answer: 1 },
    ],
  },
];

/* ── Speaking topics ─────────────────────────────────────── */
export const SPEAKING_TOPICS = [
  {
    id: 's1',
    part: 1,
    questions: [
      'Do you enjoy reading? Why or why not?',
      'What kind of music do you like? Why?',
      'Do you prefer city life or country life? Why?',
      'How do you usually spend your weekends?',
      'Are you good at cooking? What can you cook?',
    ],
  },
  {
    id: 's2',
    part: 2,
    cue: `Describe a skill you would like to learn.\n\nYou should say:\n• what the skill is\n• why you would like to learn it\n• how you would learn it\nand explain how this skill would benefit you.`,
    prepTime: 60,
    speakTime: 120,
  },
  {
    id: 's3',
    part: 3,
    questions: [
      'Why do you think some people find it difficult to learn new skills as adults?',
      'How has technology changed the way people learn new skills?',
      'Do you think vocational skills are as important as academic qualifications?',
      'How might the skills that are valued by employers change in the future?',
    ],
  },
];

/* ── Default vocabulary list ─────────────────────────────── */
export const DEFAULT_VOCAB = [
  { word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', definition: '(adj) having more than one possible meaning; unclear', example: 'The instructions were ambiguous, so I was unsure what to do.' },
  { word: 'consequently', phonetic: '/ˈkɒnsɪkwəntli/', definition: '(adv) as a result; therefore', example: 'He didn\'t study; consequently, he failed the exam.' },
  { word: 'demonstrate', phonetic: '/ˈdemənstreɪt/', definition: '(v) to show clearly; to prove', example: 'The data demonstrates a clear link between pollution and respiratory disease.' },
  { word: 'elaborate', phonetic: '/ɪˈlæbərət/', definition: '(adj/v) detailed and complicated; to add more detail', example: 'Could you elaborate on your main argument?' },
  { word: 'facilitate', phonetic: '/fəˈsɪlɪteɪt/', definition: '(v) to make an action or process easy or easier', example: 'Technology facilitates communication across the globe.' },
  { word: 'inevitable', phonetic: '/ɪnˈevɪtəbl/', definition: '(adj) certain to happen; unavoidable', example: 'Change is inevitable in any growing economy.' },
  { word: 'mitigate', phonetic: '/ˈmɪtɪɡeɪt/', definition: '(v) to make something less severe or serious', example: 'Planting trees can help mitigate climate change.' },
  { word: 'perspective', phonetic: '/pəˈspektɪv/', definition: '(n) a particular way of thinking about something; a point of view', example: 'From an economic perspective, the policy makes sense.' },
  { word: 'substantial', phonetic: '/səbˈstænʃəl/', definition: '(adj) large in size, value, or importance', example: 'There has been a substantial increase in renewable energy use.' },
  { word: 'ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', definition: '(adj) seeming to appear everywhere at the same time', example: 'Smartphones have become ubiquitous in modern society.' },
];
