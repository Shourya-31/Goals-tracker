const inputEl = document.querySelector('#taskInput');
const addBtn = document.querySelector('#addTask');
const listEl = document.querySelector('#taskList');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function fmtMS(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function cutText(t) {
  return `<s>${t}</s>`;
}

function render() {
  listEl.innerHTML = '';
  tasks.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = 'task-card' + (t.done ? ' completed' : '');
    li.setAttribute('draggable', true);
    li.dataset.index = i;

    const tagHTML = (t.tags || []).map(tag =>
      `<span class="tag">${tag}</span>`).join(" ");

    const subtaskHTML = (t.subtasks || []).map((sub, si) =>
      `<li><label>
        <input type="checkbox" data-task="${i}" data-sub="${si}" ${sub.done ? 'checked' : ''}>
        ${sub.done ? '<s>' + sub.name + '</s>' : sub.name}
      </label></li>`).join("");

    li.innerHTML = `
      <div class="task-info">
        <input type="checkbox" data-i="${i}" ${t.done ? 'checked' : ''}>
        <span class="name">${t.done ? cutText(t.name) : t.name}</span>
        <span class="timer">${fmtMS(t.time || 0)}</span>
        <span class="due">${t.due ? `⏰ ${t.due}` : ''}</span>
        <div class="tags">${tagHTML}</div>
      </div>
      <ul class="subtasks">${subtaskHTML}</ul>
      <div class="actions">
        <button data-i="${i}" data-act="start">▶</button>
        <button data-i="${i}" data-act="pause">⏸</button>
        <button data-i="${i}" data-act="reset">↺</button>
        <button data-i="${i}" data-act="edit">✏️</button>
        <button data-i="${i}" data-act="delete">🗑️</button>
      </div>
    `;

    listEl.appendChild(li);
  });

  // Main checkbox toggle
  listEl.querySelectorAll('input[type=checkbox][data-i]').forEach(cb => {
    cb.onchange = () => {
      const i = +cb.dataset.i;
      stopTimer(i);
      tasks[i].done = cb.checked;
      saveTasks();
      render();
    };
  });

  // Subtask checkbox toggle
  listEl.querySelectorAll('input[type=checkbox][data-sub]').forEach(cb => {
    cb.onchange = () => {
      const i = +cb.dataset.task;
      const si = +cb.dataset.sub;
      tasks[i].subtasks[si].done = cb.checked;
      saveTasks();
      render();
    };
  });

  // Buttons
  listEl.querySelectorAll('button').forEach(btn => {
    const i = +btn.dataset.i;
    const action = btn.dataset.act;

    btn.onclick = () => {
      switch (action) {
        case 'start':
          if (!tasks[i].intervalId) {
            tasks[i].intervalId = setInterval(() => {
              tasks[i].time += 1000;
              saveTasks();
              render();
            }, 1000);
          }
          break;

        case 'pause':
          stopTimer(i);
          break;

        case 'reset':
          stopTimer(i);
          tasks[i].time = 0;
          saveTasks();
          render();
          break;

        case 'edit':
          const newName = prompt("Edit task name:", tasks[i].name);
          if (newName !== null) tasks[i].name = newName;

          const newDue = prompt("Edit due date (YYYY-MM-DD):", tasks[i].due || '');
          if (newDue !== null) tasks[i].due = newDue;

          const newTags = prompt("Edit tags (comma-separated):", tasks[i].tags?.join(",") || '');
          if (newTags !== null)
            tasks[i].tags = newTags.split(',').map(t => t.trim()).filter(Boolean);

          const newSubtasks = prompt("Edit subtasks (comma-separated):", tasks[i].subtasks?.map(s => s.name).join(",") || '');
          if (newSubtasks !== null) {
            tasks[i].subtasks = newSubtasks.split(",").map(s => ({ name: s.trim(), done: false }));
          }

          saveTasks();
          render();
          break;

        case 'delete':
          stopTimer(i);
          tasks.splice(i, 1);
          saveTasks();
          render();
          break;
      }
    };
  });

  // Drag & drop
  listEl.querySelectorAll('li').forEach(item => {
    item.ondragstart = e => e.dataTransfer.setData("text/plain", item.dataset.index);
    item.ondragover = e => e.preventDefault();
    item.ondrop = e => {
      e.preventDefault();
      const from = +e.dataTransfer.getData("text/plain");
      const to = +item.dataset.index;
      const [moved] = tasks.splice(from, 1);
      tasks.splice(to, 0, moved);
      saveTasks();
      render();
    };
  });
}

function stopTimer(i) {
  if (tasks[i].intervalId) {
    clearInterval(tasks[i].intervalId);
    tasks[i].intervalId = null;
  }
}

addBtn.onclick = () => {
  const name = inputEl.value.trim();
  if (!name) return;

  const due = prompt("Enter due date (YYYY-MM-DD):", "");
  const tags = prompt("Add tags (comma separated):", "")
                 .split(",").map(t => t.trim()).filter(Boolean);
  const subtasks = [];

  const subStr = prompt("Add subtasks (comma separated):", "");
  if (subStr) {
    subStr.split(",").forEach(st => {
      if (st.trim()) subtasks.push({ name: st.trim(), done: false });
    });
  }

  tasks.push({
    name,
    time: 0,
    done: false,
    intervalId: null,
    due,
    tags,
    subtasks
  });

  saveTasks();
  inputEl.value = '';
  render();
};

render();
