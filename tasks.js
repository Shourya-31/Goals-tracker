// ——— Helpers —————————————————————————

function fmtMS(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// Cut text from the middle: show first & last chunks
function cutText(str) {
  const len = str.length;
  if (len <= 8) return str;
  const chunk = Math.floor(len / 4);
  return str.slice(0, chunk) + '…' + str.slice(len - chunk);
}

// ——— State & DOM Refs ——————————————————

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
const listEl     = document.getElementById('tasksList');
const addBtn     = document.getElementById('addTaskBtn');
const inputEl    = document.getElementById('newTask');

// Overlay & modal
const overlay    = document.getElementById('overlay');
const modalName  = document.getElementById('modalTaskName');
const modalTimer = document.getElementById('modalTimer');
const btnPause   = document.getElementById('modalPause');
const btnClose   = document.getElementById('modalClose');

let activeTask = null;  // currently modal‐active task

// ——— Persistence —————————————————————

function save() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// ——— Rendering ——————————————————————

function render() {
  listEl.innerHTML = '';
  tasks.forEach((t, idx) => {
    const li = document.createElement('li');
    li.className = 'task-card';
    if (t.done) li.classList.add('completed');
    li.innerHTML = `
      <div class="task-info">
        <input type="checkbox" ${t.done ? 'checked' : ''} data-i="${idx}"/>
        <span class="name">${t.done ? cutText(t.name) : t.name}</span>
        <span class="timer">${fmtMS(t.time)}</span>
      </div>
      <div class="task-actions">
        <button class="start" data-i="${idx}">▶</button>
        <button class="pause" data-i="${idx}">⏸</button>
        <button class="reset" data-i="${idx}">↺</button>
      </div>
    `;
    listEl.appendChild(li);
  });
  attachEvents();
}

// ——— Event Hooks —————————————————————

function attachEvents() {
  // Checkbox: complete
  listEl.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.onchange = () => {
      const i = +cb.dataset.i;
      // stop timer
      stopTimer(tasks[i]);
      tasks[i].done = cb.checked;
      if (cb.checked) {
        tasks[i].time = tasks[i].time;  // freeze
      }
      save();
      render();
    };
  });

  // Start button → open modal + start timer
  listEl.querySelectorAll('button.start').forEach(btn => {
    btn.onclick = () => {
      const t = tasks[btn.dataset.i];
      if (t.done) return;
      openModal(t);
    };
  });
  // Pause & Reset inside list (in‐line)
  listEl.querySelectorAll('button.pause').forEach(btn => {
    btn.onclick = () => stopTimer(tasks[btn.dataset.i]);
  });
  listEl.querySelectorAll('button.reset').forEach(btn => {
    btn.onclick = () => {
      const t = tasks[btn.dataset.i];
      stopTimer(t);
      t.time = 0;
      save();
      render();
    };
  });
}

// ——— Modal Logic —————————————————————

function openModal(task) {
  activeTask = task;
  modalName.textContent = task.name;
  modalTimer.textContent = fmtMS(task.time);
  overlay.classList.remove('hidden');
  startTimer(task, modalTimer);
}

btnPause.onclick = () => {
  if (activeTask) stopTimer(activeTask);
};
btnClose.onclick = () => {
  if (activeTask) {
    stopTimer(activeTask);
    activeTask = null;
  }
  overlay.classList.add('hidden');
};

// ——— Timer Logic ——————————————————————

function startTimer(task, displayEl) {
  if (task.interval) return;
  task.interval = setInterval(() => {
    task.time++;
    displayEl.textContent = fmtMS(task.time);
    // also update list display if visible
    const listTimers = listEl.querySelectorAll('.timer');
    listTimers.forEach(el => {
      const idx = +el.closest('li').querySelector('button.start').dataset.i;
      if (tasks[idx] === task) el.textContent = fmtMS(task.time);
    });
    save();
  }, 1000);
}

function stopTimer(task) {
  clearInterval(task.interval);
  task.interval = null;
}

// ——— Add New Task ————————————————————

addBtn.onclick = () => {
  const name = inputEl.value.trim();
  if (!name) return;
  tasks.push({ name, time: 0, done: false, interval: null });
  inputEl.value = '';
  save();
  render();
};

// ——— Init —————————————————————————

render();
