document.addEventListener('DOMContentLoaded', () => {
  // ─── THEME LOGIC ─────────────────────────────────────────────
  const themes = {
    light:    {'--bg-color':'#ffffff','--nav-bg':'#84dcc6','--card-bg':'#f5fff5','--primary':'#ffa69e','--accent':'#ffdab9','--text-color':'#333'},
    dark:     {'--bg-color':'#121212','--nav-bg':'#1f1f1f','--card-bg':'#1e1e1e','--primary':'#bb86fc','--accent':'#03dac6','--text-color':'#fff'},
    ocean:    {'--bg-color':'#e0f7fa','--nav-bg':'#006064','--card-bg':'#b2ebf2','--primary':'#004d40','--accent':'#ffab00','--text-color':'#004d40'},
    sunset:   {'--bg-color':'#fff3e0','--nav-bg':'#fb8c00','--card-bg':'#ffe0b2','--primary':'#d84315','--accent':'#8e24aa','--text-color':'#4e342e'},
    midnight: {'--bg-color':'#2f2f3e','--nav-bg':'#1b1b2f','--card-bg':'#3a3a5c','--primary':'#8c9eff','--accent':'#ff4081','--text-color':'#e0e0e0'}
  };

  const selector = document.getElementById('themeSelector');

  function applyTheme(name) {
    const theme = themes[name] || themes.light;
    Object.entries(theme).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    localStorage.setItem('yp-theme', name);
    if (selector) selector.value = name;
  }

  const savedTheme = localStorage.getItem('yp-theme') || 'light';
  applyTheme(savedTheme);
  if (selector) {
    selector.value = savedTheme;
    selector.addEventListener('change', () => applyTheme(selector.value));
  }

  // ─── HELPERS ──────────────────────────────────────────────────
  const fmtMS = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const cutText = str => (str.length <= 12 ? str : str.slice(0, 4) + '…' + str.slice(-4));

  // ─── STATE & DOM REFS ─────────────────────────────────────────
  let tasks = JSON.parse(localStorage.getItem('yp-tasks') || '[]');
  tasks.forEach(t => t.intervalId = null);

  let activeIdx = null, dragStartIndex = null;
  const listEl = document.getElementById('list');
  const addBtn = document.getElementById('addBtn');
  const inputEl = document.getElementById('newTask');
  const dueEl = document.getElementById('dueDate');
  const tagEl = document.getElementById('tags');
  const overlay = document.getElementById('overlay');
  const modalName = document.getElementById('modalName');
  const modalTime = document.getElementById('modalTimer');
  const modalSubtasks = document.getElementById('modalSubtasks');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const closeBtn = document.getElementById('closeBtn');

  // ─── TASK SAVE & LOAD ─────────────────────────────────────────
  function saveTasks() {
    const copy = tasks.map(({ name, time, done, tags, due, subtasks }) => ({ name, time, done, tags, due, subtasks }));
    localStorage.setItem('yp-tasks', JSON.stringify(copy));
  }

  function checkDueReminders() {
    const now = new Date();
    tasks.forEach((t, i) => {
      if (!t.done && t.due && new Date(t.due) <= now) {
        alert(`⏰ Reminder: Task "${t.name}" is due now or overdue!`);
        t.due = null; // prevent spamming alerts
        saveTasks();
      }
    });
  }

  setInterval(checkDueReminders, 60000); // check every minute

  // ─── RENDER ──────────────────────────────────────────────────
  function render() {
    listEl.innerHTML = '';
    tasks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'task-card' + (t.done ? ' completed' : '');
      li.setAttribute('draggable', true);
      li.dataset.index = i;

      const tagDisplay = t.tags?.length ? `<small>[${t.tags.join(', ')}]</small>` : '';
      const dueDisplay = t.due ? `<small>📅 ${new Date(t.due).toLocaleDateString()}</small>` : '';

      li.innerHTML = `
        <div class="task-info">
          <input type="checkbox" data-i="${i}" ${t.done ? 'checked' : ''}>
          <span class="name">${t.done ? cutText(t.name) : t.name}</span>
          ${tagDisplay} ${dueDisplay}
          <span class="timer">${fmtMS(t.time)}</span>
        </div>
        <div class="actions">
          <button data-i="${i}" data-act="start">▶</button>
          <button data-i="${i}" data-act="pause">⏸</button>
          <button data-i="${i}" data-act="reset">↺</button>
          <button data-i="${i}" data-act="edit">✏️</button>
          <button data-i="${i}" data-act="delete">🗑️</button>
        </div>`;

      // Drag Events
      li.addEventListener('dragstart', () => { dragStartIndex = i; li.classList.add('dragging'); });
      li.addEventListener('dragend', () => li.classList.remove('dragging'));
      li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('drag-over'); });
      li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
      li.addEventListener('drop', () => {
        li.classList.remove('drag-over');
        const from = dragStartIndex;
        const to = +li.dataset.index;
        if (from !== to) {
          const moved = tasks.splice(from, 1)[0];
          tasks.splice(to, 0, moved);
          saveTasks(); render();
        }
      });

      listEl.appendChild(li);
    });

    // Action buttons
    listEl.querySelectorAll('[data-act]').forEach(btn => {
      const i = +btn.dataset.i, act = btn.dataset.act;
      btn.onclick = () => {
        if (act === 'start') openModal(i);
        else if (act === 'pause') stopTimer(i);
        else if (act === 'reset') { stopTimer(i); tasks[i].time = 0; saveTasks(); render(); }
        else if (act === 'edit') {
          const newName = prompt("Edit task name:", tasks[i].name);
          if (newName?.trim()) { tasks[i].name = newName.trim(); saveTasks(); render(); }
        }
        else if (act === 'delete' && confirm("Delete this task?")) {
          stopTimer(i); tasks.splice(i, 1); saveTasks(); render();
        }
      };
    });

    // Checkbox
    listEl.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.onchange = () => {
        const i = +cb.dataset.i;
        stopTimer(i); tasks[i].done = cb.checked;
        saveTasks(); render();
      };
    });
  }

  // ─── ADD NEW TASK ────────────────────────────────────────────
  addBtn.onclick = () => {
    const name = inputEl.value.trim();
    if (!name) return;
    const tags = tagEl.value ? tagEl.value.split(',').map(t => t.trim()) : [];
    const due = dueEl.value ? new Date(dueEl.value).toISOString() : null;
    tasks.push({ name, time: 0, done: false, tags, due, subtasks: [], intervalId: null });
    inputEl.value = ''; dueEl.value = ''; tagEl.value = '';
    saveTasks(); render();
  };

  // ─── MODAL + TIMER ───────────────────────────────────────────
  function openModal(i) {
    if (tasks[i].done) return;
    activeIdx = i;
    modalName.textContent = tasks[i].name;
    modalTime.textContent = fmtMS(tasks[i].time);
    overlay.classList.remove('hidden');
    modalSubtasks.innerHTML = (tasks[i].subtasks || []).map((s, j) =>
      `<li>
        <input type="checkbox" ${s.done ? 'checked' : ''} data-sub="${j}">
        <input type="text" value="${s.text}" data-sub="${j}">
      </li>`).join('');
    startTimer(i);
  }

  modalSubtasks.addEventListener('change', e => {
    if (!e.target.dataset.sub) return;
    const idx = +e.target.dataset.sub;
    const subtasks = tasks[activeIdx].subtasks || [];
    if (e.target.type === 'checkbox') subtasks[idx].done = e.target.checked;
    else subtasks[idx].text = e.target.value;
    saveTasks();
  });

  function startTimer(i) {
    stopTimer(i);
    tasks[i].intervalId = setInterval(() => {
      tasks[i].time++;
      modalTime.textContent = fmtMS(tasks[i].time);
      const el = document.querySelector(`.task-card:nth-child(${i + 1}) .timer`);
      if (el) el.textContent = fmtMS(tasks[i].time);
    }, 1000);
  }

  function stopTimer(i) {
    if (tasks[i]?.intervalId != null) {
      clearInterval(tasks[i].intervalId);
      tasks[i].intervalId = null;
      saveTasks();
    }
  }

  // ─── MODAL CONTROLS ─────────────────────────────────────────
  pauseBtn.onclick = () => { if (activeIdx != null) stopTimer(activeIdx); };
  resumeBtn.onclick = () => { if (activeIdx != null) startTimer(activeIdx); };
  closeBtn.onclick = () => {
    if (activeIdx != null) {
      stopTimer(activeIdx);
      overlay.classList.add('hidden');
      activeIdx = null;
    }
  };

  // ─── INIT ───────────────────────────────────────────────────
  render();
  checkDueReminders();
});
