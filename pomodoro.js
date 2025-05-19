const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const sessionType = document.getElementById('sessionType');
const quoteBox = document.getElementById('quote');
const progressDisplay = document.getElementById('progress');
const alertSound = document.getElementById('alertSound');

const quotes = [
  "💪 Let’s focus and get it done!",
  "🌟 Progress, not perfection.",
  "📈 Every minute counts.",
  "🧠 You’re training your mind!",
  "🌱 Small steps every day.",
  "🍅 One Pomodoro at a time!"
];

let workDuration = 25 * 60;
let shortBreak = 5 * 60;
let longBreak = 15 * 60;
let cyclesBeforeLongBreak = 4;

let timer = workDuration;
let interval = null;
let currentCycle = 0;
let session = 'work'; // 'work', 'short', 'long'
let completedPomodoros = 0;

function updateDisplay() {
  let minutes = String(Math.floor(timer / 60)).padStart(2, '0');
  let seconds = String(timer % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
  sessionType.textContent = session === 'work' ? 'Work' : session === 'short' ? 'Short Break' : 'Long Break';
  progressDisplay.textContent = `Pomodoros Completed: ${completedPomodoros} 🍅`;
}

function switchSession() {
  alertSound.play();
  if (session === 'work') {
    completedPomodoros++;
    currentCycle++;
    session = (currentCycle % cyclesBeforeLongBreak === 0) ? 'long' : 'short';
  } else {
    session = 'work';
  }

  timer = session === 'work' ? workDuration : session === 'short' ? shortBreak : longBreak;
  quoteBox.textContent = quotes[Math.floor(Math.random() * quotes.length)];
  updateDisplay();
}

function startTimer() {
  if (interval) return;
  interval = setInterval(() => {
    if (timer > 0) {
      timer--;
      updateDisplay();
    } else {
      clearInterval(interval);
      interval = null;
      switchSession();
      startTimer();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(interval);
  interval = null;
}

function resetTimer() {
  pauseTimer();
  timer = session === 'work' ? workDuration : session === 'short' ? shortBreak : longBreak;
  updateDisplay();
}

startBtn.onclick = startTimer;
pauseBtn.onclick = pauseTimer;
resetBtn.onclick = resetTimer;

document.getElementById('workDuration').onchange = e => {
  workDuration = parseInt(e.target.value) * 60;
  if (session === 'work') resetTimer();
};

document.getElementById('shortBreak').onchange = e => {
  shortBreak = parseInt(e.target.value) * 60;
  if (session === 'short') resetTimer();
};

document.getElementById('longBreak').onchange = e => {
  longBreak = parseInt(e.target.value) * 60;
  if (session === 'long') resetTimer();
};

document.getElementById('cyclesBeforeLongBreak').onchange = e => {
  cyclesBeforeLongBreak = parseInt(e.target.value);
};

updateDisplay();

