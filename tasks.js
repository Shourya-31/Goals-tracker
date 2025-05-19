document.addEventListener('DOMContentLoaded', () => {
  const fmtMS = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const cutText = str => (str.length <= 12 ? str : str.slice(0, 4) + '…' + str.slice(-4));

  // Theme selector
  const themes = {
    light:    {'--bg-color':'#ffffff','--nav-bg':'#84dcc6','--card-bg':'#f5fff5','--primary':'#ffa69e','--accent':'#ffdab9','--text-color':'#333'},
    dark:     {'--bg-color':'#121212','--nav-bg':'#1f1f1f','--card-bg':'#1e1e1e','--primary':'#bb86fc','--accent':'#03dac6','--text-color':'#fff'},
    ocean:    {'--bg-color':'#e0f7fa','--nav-bg':'#006064','--card-bg':'#b2ebf2','--primary':'#004d40','--accent':'#ffab00','--text-color':'#004d40'},
    sunset:   {'--bg-color':'#fff3e0','--nav-bg':'#fb8c00','--card-bg':'#ffe0b2','--primary':'#d84315','--accent':'#8e24aa','--text-color':'#4e342e'},
    midnight: {'--bg-color':'#2f2f3e','--nav-bg':'#1b1b2f','--card-bg':'#3a3a5c','--primary':'#8c9eff','--accent':'#ff4081','--text-color':'#e0e0e0'}
  };

  const selector = document.getElementById('themeSelector');
  const applyTheme = name => {
    const theme = themes[name] || themes.light;
    Object.entries(theme).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    localStorage.setItem('yp-theme', name);
  };

  applyTheme(localStorage.getItem('yp-theme') || 'light');
  selector.addEventListener('change', () => applyTheme(selector.value));
  selector.value = localStorage.getItem('yp-theme') || 'light';

  // Elements
  const listEl = document.getElementById('list');
  const inputEl = document.getElementById('newTask');
  const dueEl = document.getElementById('dueDate');
  const tagEl = document.getElementById('tags');
  const addBtn = document.getElementById('addBtn');
  const overlay = document.getElementById('overlay');
  const modalName = document.getElementById('modalName');
  const modalTimer = document.getElementById('modalTimer');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const closeBtn = document.getElementById('closeBtn');

  let tasks = JSON.parse(localStorage.getItem('yp-tasks') || '[]');
  let taskTimers = {}; // In-memory map of index to intervalId
  let activeIdx = null;

  function saveTasks() {
    const saved = tasks.map(t => ({ ...t })); // strip intervalId
    localStorage.setItem('yp-tasks', JSON.stringify(saved));
  }

  function render() {
    listEl.innerHTML = '';
    tasks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'task-card' + (t.done ? ' completed' : '');

      const tagDisplay = t.tags?.length ? `<small>[${t.tags.join(', ')}]</small>` : '';
      const dueDisplay = t.due ? `<small>📅 ${new Date(t.due).toLocaleDateString()}</small>` : '';

      li.innerHTML = `
        <div class="task-info">
          <input type="checkbox" data-i="${i}" ${t.done ? 'checked' : ''}>
          <span class="name">${t.name}</span>
          ${tagDisplay} ${dueDisplay}
          <span class="timer">${fmtMS(t.time)}</span>
        </div>
        <div class="actions">
          <button data-i="${i}" data-act="start">▶</button>
          <button data-i="${i}" data-act="pause">⏸</button>
          <button data-i="${i}" data-act="reset">↺</button>
          <button data-i="${i}" data-act="delete">🗑️</button>
        </div>`;
      listEl.appendChild(li);
    });

    listEl.querySelectorAll('[data-act]').forEach(btn => {
      const i = +btn.dataset.i;
      const act = btn.dataset.act;
      btn.onclick = () => {
        if (act === 'start') openModal(i);
        if (act === 'pause') stopTimer(i);
        if (act === 'reset') { stopTimer(i); tasks[i].time = 0; saveTasks(); render(); }
        if (act === 'delete') { stopTimer(i); tasks.splice(i, 1); saveTasks(); render(); }
      };
    });

    listEl.querySelectorAll('input[type=checkbox]').forEach(cb => {
      const i = +cb.dataset.i;
      cb.onchange = () => {
        tasks[i].done = cb.checked;
        stopTimer(i);
        saveTasks();
        render();
      };
    });
  }

  function openModal(i) {
    if (tasks[i].done) return;
    activeIdx = i;
    modalName.textContent = tasks[i].name;
    modalTimer.textContent = fmtMS(tasks[i].time);
    overlay.classList.remove('hidden');
    startTimer(i);
  }

  function startTimer(i) {
    stopTimer(i); // stop if already running
    taskTimers[i] = setInterval(() => {
      tasks[i].time++;
      modalTimer.textContent = fmtMS(tasks[i].time);

      const taskCard = listEl.children[i];
      if (taskCard) {
        const timerSpan = taskCard.querySelector('.timer');
        if (timerSpan) timerSpan.textContent = fmtMS(tasks[i].time);
      }

      saveTasks();
    }, 1000);
  }

  function stopTimer(i) {
    if (taskTimers[i]) {
      clearInterval(taskTimers[i]);
      delete taskTimers[i];
    }
  }

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

  addBtn.onclick = () => {
    const name = inputEl.value.trim();
    if (!name) return;
    const tags = tagEl.value ? tagEl.value.split(',').map(t => t.trim()) : [];
    const due = dueEl.value ? new Date(dueEl.value).toISOString() : null;
    tasks.push({ name, time: 0, done: false, tags, due });
    inputEl.value = '';
    dueEl.value = '';
    tagEl.value = '';
    saveTasks();
    render();
  };

  render();
});
