// durations in seconds
let workDuration = 25 * 60;
let shortBreak = 5 * 60;
let longBreak = 15 * 60;
let longAfter = 4;

let sessionCount = 0,
    timeLeft = workDuration,
    mode = 'work',
    timerInterval = null;

const display = document.getElementById('timer-display'),
      label   = document.getElementById('session-label'),
      prog    = document.getElementById('progress'),
      ring    = document.querySelector('.ring-progress'),
      radius  = +ring.getAttribute('r'),
      circ    = 2 * Math.PI * radius;

// prepare ring
ring.style.strokeDasharray  = circ;
ring.style.strokeDashoffset = 0;

function updateDisplay() {
  let m = String(Math.floor(timeLeft / 60)).padStart(2,'0'),
      s = String(timeLeft % 60).padStart(2,'0');
  display.textContent = `${m}:${s}`;
  // ring animation
  let total = (mode==='work'?workDuration:(mode==='short'?shortBreak:longBreak));
  ring.style.strokeDashoffset = circ * (1 - timeLeft/total);
}

function switchMode(to) {
  mode = to;
  label.textContent = to === 'work' ? 'Work'
                      : to === 'short' ? 'Short Break'
                      : 'Long Break';
  timeLeft = to==='work'? workDuration
           : to==='short'? shortBreak
           : longBreak;
  updateDisplay();
}

function tick() {
  if (timeLeft>0) {
    timeLeft--;
    updateDisplay();
  } else {
    clearInterval(timerInterval);
    sessionCount += (mode==='work')?1:0;
    prog.textContent = `Pomodoros Completed: ${sessionCount} 🍅`;

    if (mode==='work') {
      let next = (sessionCount % longAfter === 0)? 'long' : 'short';
      switchMode(next);
    } else {
      switchMode('work');
    }
    startTimer();
  }
}

function startTimer() {
  if (!timerInterval) {
    timerInterval = setInterval(tick, 1000);
  }
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  pauseTimer();
  sessionCount = 0;
  prog.textContent = `Pomodoros Completed: 0 🍅`;
  switchMode('work');
}

// bind buttons
document.getElementById('startBtn').onclick = startTimer;
document.getElementById('pauseBtn').onclick = pauseTimer;
document.getElementById('resetBtn').onclick = resetTimer;

// custom durations
['workDuration','shortBreak','longBreak','longBreakAfter']
.forEach(id=>{
  document.getElementById(id).onchange = ()=>{
    workDuration   = +document.getElementById('workDuration').value * 60;
    shortBreak     = +document.getElementById('shortBreak').value * 60;
    longBreak      = +document.getElementById('longBreak').value * 60;
    longAfter      = +document.getElementById('longBreakAfter').value;
    resetTimer();
  };
});

// initial render
updateDisplay();
