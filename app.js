'use strict';

// DOM references
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const statusEl = document.getElementById('status');
const cardEl = document.getElementById('card');
const categoryEl = document.getElementById('category');
const difficultyEl = document.getElementById('difficulty');
const progressEl = document.getElementById('progress');
const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const resultEl = document.getElementById('result');
const scoreEl = document.getElementById('score');
const totalEl = document.getElementById('total');

// App state
let questions = [];
let currentIndex = 0;
let score = 0;
let awaitingNext = false;

// API endpoint
const API_URL = 'https://opentdb.com/api.php?amount=10&category=18';

// Utility: decode HTML entities from API text
function decodeHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.documentElement.textContent || '';
}

// Utility: shuffle array (Fisher-Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// UI helpers
function setLoading(message) {
  statusEl.textContent = message;
}

function setError(message) {
  statusEl.textContent = message;
}

function clearStatus() {
  statusEl.textContent = '';
}

function resetQuizState() {
  questions = [];
  currentIndex = 0;
  score = 0;
  awaitingNext = false;
  resultEl.hidden = true;
  scoreEl.textContent = '';
  totalEl.textContent = '';
  cardEl.hidden = true;
  nextBtn.disabled = true;
}

async function fetchQuestions() {
  setLoading('Loading questions…');
  try {
    const response = await fetch(API_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Network error');
    }
    const data = await response.json();
    if (data.response_code !== 0 || !Array.isArray(data.results)) {
      throw new Error('Invalid API response');
    }
    // Normalize and decode
    questions = data.results.map((q) => {
      const decodedQuestion = decodeHtml(q.question);
      const decodedCorrect = decodeHtml(q.correct_answer);
      const decodedIncorrect = q.incorrect_answers.map(decodeHtml);
      const allAnswers = shuffle([decodedCorrect, ...decodedIncorrect]);
      return {
        type: q.type,
        difficulty: q.difficulty,
        category: decodeHtml(q.category),
        question: decodedQuestion,
        correct: decodedCorrect,
        answers: allAnswers
      };
    });
    clearStatus();
    return true;
  } catch (err) {
    console.error(err);
    setError('Failed to load questions. Please try again.');
    return false;
  }
}

function renderQuestion() {
  const q = questions[currentIndex];
  if (!q) return;

  cardEl.hidden = false;
  resultEl.hidden = true;
  questionEl.textContent = q.question;
  categoryEl.textContent = q.category;
  difficultyEl.textContent = `Difficulty: ${q.difficulty}`;
  progressEl.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

  // Clear previous answers
  answersEl.innerHTML = '';
  q.answers.forEach((answerText) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.type = 'button';
    btn.textContent = answerText;
    btn.addEventListener('click', () => onSelectAnswer(btn, q));
    li.appendChild(btn);
    answersEl.appendChild(li);
  });

  nextBtn.disabled = true;
  awaitingNext = false;
}

function onSelectAnswer(buttonEl, question) {
  if (awaitingNext) return; // prevent double selection
  awaitingNext = true;

  const selected = buttonEl.textContent;
  const isCorrect = selected === question.correct;
  if (isCorrect) {
    score += 1;
    buttonEl.classList.add('correct');
  } else {
    buttonEl.classList.add('incorrect');
  }

  // Reveal correct answer and lock others
  const buttons = answersEl.querySelectorAll('button');
  buttons.forEach((b) => {
    b.disabled = true;
    if (b.textContent === question.correct) {
      b.classList.add('correct');
    }
  });

  nextBtn.disabled = false;
}

function showResult() {
  cardEl.hidden = true;
  resultEl.hidden = false;
  scoreEl.textContent = String(score);
  totalEl.textContent = String(questions.length);
  nextBtn.disabled = true;
  restartBtn.hidden = false;
}

// Event handlers
startBtn.addEventListener('click', async () => {
  resetQuizState();
  startBtn.disabled = true;
  restartBtn.hidden = true;
  const ok = await fetchQuestions();
  if (ok) {
    renderQuestion();
    nextBtn.disabled = true; // disabled until an answer is chosen
  } else {
    startBtn.disabled = false;
  }
});

nextBtn.addEventListener('click', () => {
  if (currentIndex < questions.length - 1) {
    currentIndex += 1;
    renderQuestion();
  } else {
    showResult();
  }
});

restartBtn.addEventListener('click', () => {
  resetQuizState();
  clearStatus();
  startBtn.disabled = false;
});


