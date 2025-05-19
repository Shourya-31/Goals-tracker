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
const sessionLabel = document.getElementById("session-label");
const progressDisplay = document.getElementById("progress");
const ring = document.getElementById("progress-ring");
const radius = 85;
const circumference = 2 * Math.PI * radius;

ring.style.strokeDasharray = circumference;
ring.style.strokeDashoffset = 0;

function updateTimerDisplay() {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function updateRing() {
  const maxTime =
    mode === "work"
      ? workDuration
      : mode === "shortBreak"
      ? shortBreak
      : longBreak;
  const progress = timeLeft / maxTime;
  ring.style.strokeDashoffset = circumference * (1 - progress);
}

function switchMode(newMode) {
  mode = newMode;
  sessionLabel.textContent =
    newMode === "work"
      ? "Work"
      : newMode === "shortBreak"
      ? "Short Break"
      : "Long Break";

  if (mode === "work") timeLeft = workDuration;
  else if (mode === "shortBreak") timeLeft = shortBreak;
  else timeLeft = longBreak;

  updateTimerDisplay();
  updateRing();
}

function tick() {
  if (timeLeft > 0) {
    timeLeft--;
    updateTimerDisplay();
    updateRing();
  } else {
    clearInterval(currentTimer);
    isRunning = false;

    if (mode === "work") {
      sessionCount++;
      updateProgress();
      switchMode(sessionCount % longBreakAfter === 0 ? "longBreak" : "shortBreak");
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

// Setup
updateTimerDisplay();
updateProgress();
updateRing();

document.getElementById("startBtn").addEventListener("click", startTimer);
document.getElementById("pauseBtn").addEventListener("click", pauseTimer);
document.getElementById("resetBtn").addEventListener("click", resetTimer);

["workDuration", "shortBreak", "longBreak", "longBreakAfter"].forEach(id => {
  document.getElementById(id).addEventListener("change", applyCustomDurations);
});
