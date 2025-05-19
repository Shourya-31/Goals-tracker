document.addEventListener('DOMContentLoaded', () => {
  // ─── THEME LOGIC ─────────────────────────────────────────────
  const themes = {
    light:   {'--bg-color':'#ffffff','--nav-bg':'#84dcc6','--card-bg':'#f5fff5','--primary':'#ffa69e','--accent':'#ffdab9','--text-color':'#333'},
    dark:    {'--bg-color':'#121212','--nav-bg':'#1f1f1f','--card-bg':'#1e1e1e','--primary':'#bb86fc','--accent':'#03dac6','--text-color':'#fff'},
    ocean:   {'--bg-color':'#e0f7fa','--nav-bg':'#006064','--card-bg':'#b2ebf2','--primary':'#004d40','--accent':'#ffab00','--text-color':'#004d40'},
    sunset:  {'--bg-color':'#fff3e0','--nav-bg':'#fb8c00','--card-bg':'#ffe0b2','--primary':'#d84315','--accent':'#8e24aa','--text-color':'#4e342e'},
    midnight:{'--bg-color':'#2f2f3e','--nav-bg':'#1b1b2f','--card-bg':'#3a3a5c','--primary':'#8c9eff','--accent':'#ff4081','--text-color':'#e0e0e0'},
  };

  const selector = document.getElementById('themeSelector');

  function applyTheme(name) {
    const theme = themes[name] || themes.light;
    Object.entries(theme).forEach(([key, value]) =>
      document.documentElement.style.setProperty(key, value)
    );
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
  const fmtMS = sec => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0'),
          s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const cutText = str => {
    if (str.length <= 8) return str;
    const c = Math.floor(str.length / 4);
    return str.slice(0, c) + '…' + str.slice(-c);
  };

  // ─── STATE & DOM REFS ────────────────────────────────────────
  let tasks = JSON.parse(localStorage.getItem('yp-tasks') || '[]');
  tasks.forEach(t => t.intervalId = null);
  let activeIdx = null;
  let dragStartIndex = null;

  const listEl    = document.getElementById('list');
  const addBtn    = document.getElementById('addBtn');
  const inputEl   = document.getElementById('newTask');
  const overlay   = document.getElementById('overlay');
  const modalName = document.getElementById('modalName');
  const modalTime = document.getElementById('modalTimer');
  const pauseBtn  = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const closeBtn  = document.getElementById('closeBtn');

  function saveTasks() {
    const copy = tasks.map(t => ({
      name: t.name,
      time: t.time,
      done: t.done
    }));
    localStorage.setItem('yp-tasks', JSON.stringify(copy));
  }

  // ─── RENDER & BIND ───────────────────────────────────────────
  function render() {
    listEl.innerHTML = '';
    tasks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'task-card' + (t.done ? ' completed' : '');
      li.setAttribute('draggable', true);
      li.dataset.index = i;

      li.innerHTML = `
        <div class="task-info">
          <input type="checkbox" data-i="${i}" ${t.done ? 'checked' : ''}>
          <span class="name">${t.done ? cutText(t.name) : t.name}</span>
          <span class="timer">${fmtMS(t.time)}</span>
        </div>
        <div class="actions">
          <button data-i="${i}" data-act="start">▶</button>
          <button data-i="${i}" data-act="pause">⏸</button>
          <button data-i="${i}" data-act="reset">↺</button>
        </div>`;

      // ─── Drag Events ─────────────────
      li.addEventListener('dragstart', e => {
        dragStartIndex = i;
        li.classList.add('dragging');
      });

      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
      });

      li.addEventListener('dragover', e => {
        e.preventDefault();
        li.classList.add('drag-over');
      });

      li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over');
      });

      li.addEventListener('drop', e => {
        e.preventDefault();
        li.classList.remove('drag-over');
        const from = dragStartIndex;
        const to = +li.dataset.index;
        if (from !== to) {
          const moved = tasks.splice(from, 1)[0];
          tasks.splice(to, 0, moved);
          saveTasks();
          render();
        }
      });

      listEl.appendChild(li);
    });

    // Action buttons
    listEl.querySelectorAll('[data-act]').forEach(btn => {
      const i = +btn.dataset.i, act = btn.dataset.act;
      btn.onclick = () => {
        if (act === 'start') openModal(i);
        if (act === 'pause') stopTimer(i);
        if (act === 'reset') {
          stopTimer(i);
          tasks[i].time = 0;
          saveTasks();
          render();
        }
      };
    });

    // Checkbox toggles
    listEl.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.onchange = () => {
        const i = +cb.dataset.i;
        stopTimer(i);
        tasks[i].done = cb.checked;
        saveTasks();
        render();
      };
    });
  }

  // ─── ADD NEW TASK ────────────────────────────────────────────
  addBtn.onclick = () => {
    const name = inputEl.value.trim();
    if (!name) return;
    tasks.push({ name, time: 0, done: false, intervalId: null });
    saveTasks();
    inputEl.value = '';
    render();
  };

  // ─── MODAL & TIMER ───────────────────────────────────────────
  function openModal(i) {
    if (tasks[i].done) return;
    activeIdx = i;
    modalName.textContent = tasks[i].name;
    modalTime.textContent = fmtMS(tasks[i].time);
    overlay.classList.remove('hidden');
    startTimer(i);
  }

  function startTimer(i) {
    stopTimer(i);
    tasks[i].intervalId = setInterval(() => {
      tasks[i].time++;
      modalTime.textContent = fmtMS(tasks[i].time);
      const el = document.querySelector(`.task-card:nth-child(${i+1}) .timer`);
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
  pauseBtn.onclick = () => {
    if (activeIdx != null) stopTimer(activeIdx);
  };

  resumeBtn.onclick = () => {
    if (activeIdx != null) startTimer(activeIdx);
  };

  closeBtn.onclick = () => {
    if (activeIdx != null) {
      stopTimer(activeIdx);
      overlay.classList.add('hidden');
      activeIdx = null;
    }
  };

  // ─── INITIALIZE ─────────────────────────────────────────────
  render();
});
