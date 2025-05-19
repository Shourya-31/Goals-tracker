let workDuration = 25 * 60;
let shortBreak = 5 * 60;
let longBreak = 15 * 60;
let longBreakAfter = 4;

let sessionCount = 0;
let currentTimer;
let timeLeft = workDuration;
let isRunning = false;
let mode = 'work';

const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const sessionLabel = document.getElementById("session-label");
const progressDisplay = document.getElementById("progress");

function updateTimerDisplay() {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function switchMode(newMode) {
  mode = newMode;
  sessionLabel.textContent = newMode === "work" ? "Work" : newMode === "shortBreak" ? "Short Break" : "Long Break";

  if (mode === "work") {
    timeLeft = workDuration;
  } else if (mode === "shortBreak") {
    timeLeft = shortBreak;
  } else {
    timeLeft = longBreak;
  }

  updateTimerDisplay();
}

function tick() {
  if (timeLeft > 0) {
    timeLeft--;
    updateTimerDisplay();
  } else {
    clearInterval(currentTimer);
    isRunning = false;

    if (mode === "work") {
      sessionCount++;
      updateProgress();
      if (sessionCount % longBreakAfter === 0) {
        switchMode("longBreak");
      } else {
        switchMode("shortBreak");
      }
    } else {
      switchMode("work");
    }

    startTimer();
  }
}

function startTimer() {
  if (!isRunning) {
    currentTimer = setInterval(tick, 1000);
    isRunning = true;
  }
}

function pauseTimer() {
  clearInterval(currentTimer);
  isRunning = false;
}

function resetTimer() {
  clearInterval(currentTimer);
  isRunning = false;
  sessionCount = 0;
  switchMode("work");
  updateProgress();
}

function updateProgress() {
  progressDisplay.innerHTML = `Pomodoros Completed: ${sessionCount} 🍅`;
}

function applyCustomDurations() {
  workDuration = parseInt(document.getElementById("workDuration").value) * 60;
  shortBreak = parseInt(document.getElementById("shortBreak").value) * 60;
  longBreak = parseInt(document.getElementById("longBreak").value) * 60;
  longBreakAfter = parseInt(document.getElementById("longBreakAfter").value);
  resetTimer();
}

// Initial setup
updateTimerDisplay();
updateProgress();

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

document.getElementById("workDuration").addEventListener("change", applyCustomDurations);
document.getElementById("shortBreak").addEventListener("change", applyCustomDurations);
document.getElementById("longBreak").addEventListener("change", applyCustomDurations);
document.getElementById("longBreakAfter").addEventListener("change", applyCustomDurations);
