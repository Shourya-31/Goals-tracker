let pomoSec = 25*60, pomoInterval = null;
const disp = document.getElementById('pomodoroDisplay');
function fmtMS2(sec) {
  const m = String(Math.floor(sec/60)).padStart(2,'0');
  const s = String(sec%60).padStart(2,'0');
  return `${m}:${s}`;
}

document.getElementById('startPomo').onclick = () => {
  if (pomoInterval) return;
  Swal.fire({ title:'Work for 25 minutes', icon:'info' }).then(() => {
    pomoInterval = setInterval(() => {
      pomoSec--;
      disp.textContent = fmtMS2(pomoSec);
      if (pomoSec<=0) {
        clearInterval(pomoInterval);
        pomoInterval = null;
        Swal.fire({ title:'Time’s up!', text:'Take a 5‑minute break.', icon:'success' });
        pomoSec = 25*60; disp.textContent = fmtMS2(pomoSec);
      }
    },1000);
  });
};

document.getElementById('stopPomo').onclick = () => {
  clearInterval(pomoInterval);
  pomoInterval = null;
  Swal.fire({ title:'Paused', icon:'pause' });
};
