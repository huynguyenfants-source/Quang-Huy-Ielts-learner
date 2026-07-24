// Seed content: sample exercises, vocabulary and knowledge. All editable in-app.

export const WRITING_PROMPTS = [
  { id: 'w1', type: 'Task 2', title: 'Technology & Communication',
    prompt: 'Some people think that modern technology has made face-to-face communication less important. To what extent do you agree or disagree?' },
  { id: 'w2', type: 'Task 2', title: 'Education',
    prompt: 'Many students find it difficult to focus on their studies. What are the causes of this problem and what solutions can you suggest?' },
  { id: 'w1t1', type: 'Task 1', title: 'Line graph',
    prompt: 'The chart below shows the number of visitors to three museums between 2007 and 2012. Summarise the information by selecting and reporting the main features.' },
];

export const READING_PASSAGES = [
  {
    id: 'r1', title: 'The Rise of Remote Work', level: 'B2',
    text: `Remote work, once a rare privilege, has become a mainstream way of working. Advances in communication technology allow employees to collaborate from almost anywhere. Supporters argue that it improves work-life balance and reduces commuting time. Critics, however, point to challenges such as isolation and blurred boundaries between work and personal life. Studies suggest that a hybrid approach, combining office and home work, may offer the best of both worlds.`,
    questions: [
      { q: 'What made remote work mainstream?', options: ['Higher salaries', 'Communication technology', 'Shorter weeks', 'New laws'], answer: 1 },
      { q: 'A drawback mentioned is:', options: ['Isolation', 'Faster promotion', 'Free lunches', 'More meetings'], answer: 0 },
      { q: 'The passage suggests the best approach is:', options: ['Fully remote', 'Fully office', 'Hybrid', 'No work'], answer: 2 },
    ],
  },
];

export const LISTENING_ITEMS = [
  {
    id: 'l1', title: 'Booking a hotel room', level: 'B1',
    // Uses browser Text-to-Speech to "play" the transcript.
    transcript: `Good morning, I would like to book a double room for three nights, starting on Friday. Do you offer breakfast? Yes, breakfast is included and free parking is available for guests.`,
    questions: [
      { q: 'How many nights does the caller want?', options: ['One', 'Two', 'Three', 'Four'], answer: 2 },
      { q: 'What is included?', options: ['Dinner', 'Breakfast', 'A tour', 'Nothing'], answer: 1 },
      { q: 'Parking is:', options: ['Not available', 'Free for guests', 'Very expensive', 'Only for staff'], answer: 1 },
    ],
  },
];

export const SPEAKING_PROMPTS = [
  { id: 's1', part: 'Part 1', prompt: 'Describe your hometown. What do you like most about it?' },
  { id: 's2', part: 'Part 2', prompt: 'Describe a skill you would like to learn. You should say what it is, why you want to learn it, and how you would learn it.' },
  { id: 's3', part: 'Part 3', prompt: 'Do you think traditional skills are being lost because of technology? Why?' },
];

export const SEED_VOCAB = [
  { id: 'v1', word: 'mainstream', ipa: '/ˈmeɪnstriːm/', meaning: 'phổ biến, chủ đạo', example: 'Remote work has become mainstream.', tags: ['work'] },
  { id: 'v2', word: 'blurred', ipa: '/blɜːrd/', meaning: 'mờ, không rõ ràng', example: 'blurred boundaries between work and life', tags: ['adjective'] },
];

export const SEED_MISTAKES = [
  { id: 'm1', wrong: 'I very like it', correct: 'I really like it', type: 'Grammar', note: 'Dùng "really" thay vì "very" trước động từ.' },
];

export const SEED_DOCS = [
  { id: 'd1', title: 'IELTS Writing Task 2 – Cấu trúc 4 đoạn', tags: ['writing'],
    body: '1. Introduction (paraphrase + thesis)\n2. Body 1 (idea + explain + example)\n3. Body 2 (idea + explain + example)\n4. Conclusion (restate).' },
];
