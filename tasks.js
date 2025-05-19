document.addEventListener('DOMContentLoaded', () => {
  // ——— Helpers —————————————————————————
  const fmtMS = sec => {
    const m = String(Math.floor(sec/60)).padStart(2,'0');
    const s = String(sec%60).padStart(2,'0');
    return `${m}:${s}`;
  };
  const cutText = str => {
    if (str.length <= 8) return str;
    const c = Math.floor(str.length/4);
    return str.slice(0,c) + '…' + str.slice(-c);
  };

  // ——— State & DOM Refs ————————————————————
  let tasks = [];
  let activeIdx = null;

  const listEl    = document.getElementById('list');
  const addBtn    = document.getElementById('addBtn');
  const inputEl   = document.getElementById('newTask');
  const overlay   = document.getElementById('overlay');
  const modalName = document.getElementById('modalName');
  const modalTime = document.getElementById('modalTimer');
  const pauseBtn  = document.getElementById('pauseBtn');
  const closeBtn  = document.getElementById('closeBtn');

  // ——— Render tasks ——————————————————————
  function render() {
    listEl.innerHTML = '';
    tasks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'task-card' + (t.done ? ' completed' : '');
      li.innerHTML = `
        <div class="task-info">
          <input type="checkbox" data-i="${i}" ${t.done?'checked':''}>
          <span class="name">${t.done? cutText(t.name): t.name}</span>
          <span class="timer">${fmtMS(t.time)}</span>
        </div>
        <div class="actions">
          <button data-i="${i}" data-act="start">▶</button>
          <button data-i="${i}" data-act="pause">⏸</button>
          <button data-i="${i}" data-act="reset">↺</button>
        </div>
      `;
      listEl.appendChild(li);
    });
    bindEvents();
  }

  // ——— Bind card events ———————————————————
  function bindEvents() {
    // Complete checkbox
    listEl.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.onchange = () => {
        const i = +cb.dataset.i;
        stopTimer(i);
        tasks[i].done = cb.checked;
        render();
      };
    });
    // Start / Pause / Reset buttons
    listEl.querySelectorAll('.actions button').forEach(btn => {
      const i = +btn.dataset.i;
      const act = btn.dataset.act;
      btn.onclick = () => {
        if (act === 'start') {
          openModal(i);
        } else if (act === 'pause') {
          stopTimer(i);
        } else if (act === 'reset') {
          stopTimer(i);
          tasks[i].time = 0;
          render();
        }
      };
    });
  }

  // ——— Add new task —————————————————————
  addBtn.onclick = () => {
    const name = inputEl.value.trim();
    if (!name) return;
    tasks.push({ name, time: 0, done: false, intervalId: null });
    inputEl.value = '';
    render();
  };

  // ——— Open focus‑mode modal —————————————————
  function openModal(idx) {
    if (tasks[idx].done) return;
    activeIdx = idx;
    modalName.textContent  = tasks[idx].name;
    modalTime.textContent  = fmtMS(tasks[idx].time);
    overlay.classList.remove('hidden');
    startTimer(idx);
  }

  // ——— Timer logic ——————————————————————
  function startTimer(idx) {
    // clear any old interval to avoid duplicates
    if (tasks[idx].intervalId != null) {
      clearInterval(tasks[idx].intervalId);
    }
    tasks[idx].intervalId = setInterval(() => {
      tasks[idx].time++;
      modalTime.textContent = fmtMS(tasks[idx].time);
      // sync list‐view timers
      document.querySelectorAll('.timer').forEach(el => {
        const parent = el.closest('li');
        const i = +parent.querySelector('button').dataset.i;
        if (i === idx) el.textContent = fmtMS(tasks[i].time);
      });
    }, 1000);
  }

  function stopTimer(idx) {
    if (tasks[idx].intervalId != null) {
      clearInterval(tasks[idx].intervalId);
      tasks[idx].intervalId = null;
    }
  }

  // ——— Modal controls —————————————————————
  pauseBtn.onclick = () => {
    // stop only; do NOT hide modal
    if (activeIdx != null) stopTimer(activeIdx);
  };
  closeBtn.onclick = () => {
    // stop + hide modal
    if (activeIdx != null) {
      stopTimer(activeIdx);
      overlay.classList.add('hidden');
      activeIdx = null;
    }
  };

  // ——— Initialize ———————————————————————
  render();
});
