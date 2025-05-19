// Shared helper
function fmtMS(seconds) {
  const m = String(Math.floor(seconds/60)).padStart(2,'0');
  const s = String(seconds%60).padStart(2,'0');
  return `${m}:${s}`;
}
let tasks = JSON.parse(localStorage.getItem('tasks')||'[]');

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
function renderTasks() {
  const list = document.getElementById('tasksList');
  list.innerHTML = '';
  tasks.forEach((t,i) => {
    const li = document.createElement('li');
    li.className = 'task-card';
    li.innerHTML = `
      <div>
        <input type="checkbox" ${t.done?'checked':''}/>
        <span>${t.name}</span>
      </div>
      <div class="timer">${fmtMS(t.time)}</div>
      <div>
        <button class="btn-primary" data-action="start">▶</button>
        <button class="btn-secondary" data-action="pause">⏸</button>
        <button class="btn-secondary" data-action="reset">↺</button>
      </div>
    `;
    list.appendChild(li);

    // Events
    const [chk, , timerEl, btns] = li.children;
    chk.onchange = () => { t.done = chk.checked; saveTasks(); };
    li.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        const action = btn.dataset.action;
        if (action==='reset') {
          Swal.fire({
            title: 'Reset timer?',
            icon: 'warning',
            showCancelButton: true
          }).then(r => { if(r.isConfirmed){ t.time=0; saveTasks(); renderTasks(); }});
        } else {
          if (!t.interval && action==='start') {
            t.interval = setInterval(() => {
              t.time++; timerEl.textContent = fmtMS(t.time); saveTasks();
            },1000);
          }
          if (action==='pause') {
            clearInterval(t.interval);
            t.interval = null;
          }
        }
      };
    });
  });
}

document.getElementById('addTaskBtn').onclick = () => {
  const name = document.getElementById('newTask').value.trim();
  if (!name) return;
  tasks.push({ name, time:0, done:false, interval:null });
  saveTasks(); renderTasks();
};

renderTasks();
