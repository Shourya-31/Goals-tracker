// Helper to format MM:SS
function fmtMS(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// Cut text in half with “…”
function cutText(str) {
  const len = str.length;
  if (len <= 8) return str;           // too short?
  const half = Math.floor(len / 2);
  return str.slice(0, half) + '…' + str.slice(-half);
}

// STATE
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

// OVERLAY ELEMENTS
const overlay       = document.getElementById('overlay');
const modalName     = document.getElementById('modalTaskName');
const modalTimer    = document.getElementById('modalTimer');
const modalPauseBtn = document.getElementById('modalPause');
const modalCloseBtn = document.getElementById('modalClose');

// Currently active task in overlay
let activeTask = null;

// Save & load
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// RENDER
function renderTasks() {
  const list = document.getElementById('tasksList');
  list.innerHTML = '';

  tasks.forEach((t, i) => {
    // Create list‐item
    const li = document.createElement('li');
    li.className = 'task-card';
    li.innerHTML = `
      <div>
        <input type="checkbox" ${t.done ? 'checked' : ''}/>
        <span class="task-name">${t.name}</span>
      </div>
      <div class="timer">${fmtMS(t.time)}</div>
      <div>
        <button data-action="start" class="btn-primary">▶</button>
        <button data-action="pause" class="btn-secondary">⏸</button>
      </div>
    `;
    list.appendChild(li);

    // Get elements
    const checkbox = li.querySelector('input');
    const nameSpan = li.querySelector('.task-name');
    const timerDiv = li.querySelector('.timer');
    const [ startBtn, pauseBtn ] = li.querySelectorAll('button');

    // CHECKBOX → COMPLETE
    checkbox.onchange = () => {
      if (checkbox.checked) {
        // 1) stop timer
        clearInterval(t.interval);
        t.interval = null;
        // 2) mark done and record
        t.done = true;
        // 3) cut the text
        nameSpan.textContent = cutText(t.name);
        nameSpan.style.opacity = '0.6';
        // 4) save & re‑render timer display
        saveTasks();
        timerDiv.textContent = fmtMS(t.time);
      }
    };

    // START → show overlay + start counting
    startBtn.onclick = () => {
      if (t.interval) return; // already running
      // show overlay
      overlay.classList.remove('hidden');
      modalName.textContent  = t.name;
      modalTimer.textContent = fmtMS(t.time);
      activeTask = t;

      // start interval
      t.interval = setInterval(() => {
        t.time++;
        timerDiv.textContent = fmtMS(t.time);
        modalTimer.textContent = fmtMS(t.time);
        saveTasks();
      }, 1000);
    };

    // PAUSE → hide overlay + stop
    pauseBtn.onclick = modalPauseBtn.onclick = () => {
      if (!t.interval) return;
      clearInterval(t.interval);
      t.interval = null;
      overlay.classList.add('hidden');
      saveTasks();
    };
  });
}

// CLOSE BUTTON in modal
modalCloseBtn.onclick = () => {
  if (activeTask && activeTask.interval) {
    clearInterval(activeTask.interval);
    activeTask.interval = null;
    saveTasks();
  }
  overlay.classList.add('hidden');
};

// ADD NEW TASK
document.getElementById('addTaskBtn').onclick = () => {
  const name = document.getElementById('newTask').value.trim();
  if (!name) return;
  tasks.push({ name, time: 0, done: false, interval: null });
  saveTasks();
  renderTasks();
};

// INIT
renderTasks();
