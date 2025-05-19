document.addEventListener("DOMContentLoaded", () => {
  const timerDisplay = document.getElementById("timer");
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const sessionLabel = document.getElementById("sessionLabel");
  const completedDisplay = document.getElementById("completedCount");

  const workInput = document.getElementById("workInput");
  const shortInput = document.getElementById("shortInput");
  const longInput = document.getElementById("longInput");
  const longBreakAfterInput = document.getElementById("longBreakAfterInput");

  let timer, timeLeft, isRunning = false;
  let mode = "work"; // work | short | long
  let pomodorosCompleted = 0;
  let sessionCount = 0;

  function updateDisplay(seconds) {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    timerDisplay.textContent = `${min}:${sec}`;
  }

  function getDuration(mode) {
    if (mode === "work") return +workInput.value * 60;
    if (mode === "short") return +shortInput.value * 60;
    if (mode === "long") return +longInput.value * 60;
  }

  function switchMode(newMode) {
    mode = newMode;
    timeLeft = getDuration(mode);
    sessionLabel.textContent = {
      work: "Work",
      short: "Short Break",
      long: "Long Break"
    }[mode];
    updateDisplay(timeLeft);
    setColors(mode);
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    timer = setInterval(() => {
      timeLeft--;
      updateDisplay(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timer);
        isRunning = false;

        if (mode === "work") {
          pomodorosCompleted++;
          sessionCount++;
          completedDisplay.textContent = pomodorosCompleted;
          if (sessionCount % +longBreakAfterInput.value === 0) {
            switchMode("long");
          } else {
            switchMode("short");
          }
        } else {
          switchMode("work");
        }
        startTimer();
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
  }

  function resetTimer() {
    pauseTimer();
    sessionCount = 0;
    pomodorosCompleted = 0;
    completedDisplay.textContent = "0";
    switchMode("work");
  }

  function setColors(mode) {
    document.body.className = ""; // reset classes
    document.body.classList.add(mode + "-mode");
  }

  // Init
  switchMode("work");

  startBtn.onclick = startTimer;
  pauseBtn.onclick = pauseTimer;
  resetBtn.onclick = resetTimer;
});
