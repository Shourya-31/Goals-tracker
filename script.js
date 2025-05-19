// —— Helpers —————————————————————————————
function fmtHMS(sec) {
  const h = Math.floor(sec/3600).toString().padStart(2,'0');
  const m = Math.floor((sec%3600)/60).toString().padStart(2,'0');
  const s = Math.floor(sec%60).toString().padStart(2,'0');
  return `${h}:${m}:${s}`;
}
function downloadCSV(text, filename='tasks.csv') {
  const blob = new Blob([text], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// —— State & Persistence ————————————————————
let tasks = JSON.parse(localStorage.getItem('tasks')||'[]');
let pomodoro = { mode: 'work', remaining: 25*60, timer: null };
let totalSeconds = 0;

// —— DOM References ————————————————————————
const taskList    = document.getElementById('taskList');
const addBtn      = document.getElementById('addTask');
const taskInput   = document.getElementById('taskInput');
const totalTimeEl = document.getElementById('totalTime');
const exportBtn   = document.getElementById('exportCsv');
const startPomo   = document.getElementById('startPomodoro');
const dailyCtx    = document.getElementById('dailyChart').getContext('2d');
const weeklyCtx   = document.getElementById('weeklyChart').getContext('2d');

// —— Load & Save —————————————————————————
function save() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
function load() {
  tasks.forEach(t => renderTask(t));
  updateTotals();
  drawCharts();
}

// —— Task Rendering ——————————————————————
function renderTask(t) {
  const li = document.createElement('li');
  li.id = t.id;
  // info
  const info = document.createElement('div'); info.className='task-info';
  const cb   = document.createElement('input'); cb.type='checkbox';
  cb.checked = t.done;
  const name = document.createElement('span'); name.className='name';
  name.textContent = t.name;
  const timer = document.createElement('span'); timer.className='timer';
  timer.textContent = fmtHMS(t.runningSecs);

  info.append(cb, name, timer);

  // actions
  const act = document.createElement('div'); act.className='task-actions';
  const start= document.createElement('button'); start.textContent='▶'; start.className='start';
  const stop = document.createElement('button'); stop.textContent='■'; stop.className='stop';
  const reset= document.createElement('button'); reset.textContent='↺'; reset.className='reset';
  const del  = document.createElement('button'); del.textContent='✖'; del.className='delete';

  act.append(start, stop, reset, del);
  li.append(info, act);
  taskList.append(li);

  // —— Event Listeners ——
  cb.addEventListener('change', () => {
    t.done = cb.checked;
    save();
    drawCharts();
  });
  start.addEventListener('click', () => startTimer(t, timer));
  stop.addEventListener('click',  () => stopTimer(t));
  reset.addEventListener('click', () => {
    stopTimer(t);
    t.runningSecs = 0; timer.textContent = fmtHMS(0);
    save(); drawCharts(); updateTotals();
  });
  del.addEventListener('click', () => {
    stopTimer(t);
    tasks = tasks.filter(x=>x.id!==t.id);
    document.getElementById(t.id).remove();
    save(); drawCharts(); updateTotals();
  });
}

// —— Timer Logic ————————————————————————
function startTimer(t, displayEl) {
  if (t.interval) return;
  t.interval = setInterval(() => {
    t.runningSecs++;
    displayEl.textContent = fmtHMS(t.runningSecs);
    totalSeconds++;
    totalTimeEl.textContent = fmtHMS(totalSeconds);
  }, 1000);
}
function stopTimer(t) {
  clearInterval(t.interval);
  t.interval = null;
}
function updateTotals() {
  totalSeconds = tasks.reduce((sum,t) => sum + t.runningSecs, 0);
  totalTimeEl.textContent = fmtHMS(totalSeconds);
}

// —— Pomodoro ——————————————————————————
startPomo.addEventListener('click', () => {
  if (pomodoro.timer) return;
  pomodoro.timer = setInterval(() => {
    pomodoro.remaining--;
    startPomo.textContent = fmtHMS(pomodoro.remaining);
    if (pomodoro.remaining <= 0) {
      clearInterval(pomodoro.timer);
      pomodoro.timer = null;
      if (pomodoro.mode === 'work') {
        pomodoro.mode = 'break';
        pomodoro.remaining = 5*60;
        alert('Work session done! Take a 5 min break.');
      } else {
        pomodoro.mode = 'work';
        pomodoro.remaining = 25*60;
        alert('Break over! Back to work.');
      }
      startPomo.textContent = (pomodoro.mode==='work'? 'Start Work':'Start Break');
    }
  }, 1000);
});

// —— Charts (Chart.js) ————————————————————
function drawCharts() {
  const byDay = {}; // YYYY-MM-DD → secs
  const byWeek = {}; // ISO week → secs
  tasks.forEach(t => {
    if (!t.done) return;
    const day = t.completedAt?.slice(0,10);
    const week = day ? day.slice(0,7) : null;
    byDay[day]   = (byDay[day]||0) + t.runningSecs;
    byWeek[week] = (byWeek[week]||0) + t.runningSecs;
  });
  const dLabels = Object.keys(byDay).sort();
  const dData   = dLabels.map(d=>byDay[d]);
  const wLabels = Object.keys(byWeek).sort();
  const wData   = wLabels.map(w=>byWeek[w]);

  // destroy & recreate
  if (window._dailyChart) window._dailyChart.destroy();
  window._dailyChart = new Chart(dailyCtx, {
    type:'bar',
    data:{ labels:dLabels, datasets:[{ label:'Daily Secs', data:dData }] },
    options:{ scales:{ y:{ beginAtZero:true }}}
  });
  if (window._weeklyChart) window._weeklyChart.destroy();
  window._weeklyChart = new Chart(weeklyCtx, {
    type:'bar',
    data:{ labels:wLabels, datasets:[{ label:'Weekly Secs', data:wData }] },
    options:{ scales:{ y:{ beginAtZero:true }}}
  });
}

// —— Add & Export ————————————————————————
addBtn.addEventListener('click', () => {
  const name = taskInput.value.trim();
  if (!name) return;
  const t = {
    id: 't'+Date.now(), name,
    runningSecs: 0, done:false,
    createdAt: new Date().toISOString(),
    completedAt: null, interval: null
  };
  // mark completion timestamp
  Object.defineProperty(t, 'done', {
    get() { return this._done },
    set(v) {
      this._done = v;
      if (v) this.completedAt = new Date().toISOString();
    }
  });
  tasks.push(t);
  save();
  renderTask(t);
  taskInput.value = '';
  drawCharts();
});

exportBtn.addEventListener('click', () => {
  const rows = [['Name','Done','Time(s)','Created','Completed']];
  tasks.forEach(t => {
    rows.push([
      t.name,
      t._done?'Yes':'No',
      t.runningSecs,
      t.createdAt,
      t.completedAt||''
    ]);
  });
  const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
  downloadCSV(csv);
});

// —— Init —————————————————————————————
load();
