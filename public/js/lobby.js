// lobby.js
const socket        = io();
const loginBtn      = document.getElementById('login-btn');
const startBtn      = document.getElementById('start-btn');
const usernameInput = document.getElementById('username');
const playersList   = document.getElementById('players-list');

let loggedIn = false;

// Cuando el servidor envía la lista de usuarios conectados:
socket.on('userlist', users => {
  // Actualizar UI
  playersList.innerHTML = '';
  users.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    playersList.appendChild(li);
  });
  // Activar el botón de iniciar si al menos 1 usuario
  startBtn.disabled = users.length === 0;
});

loginBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if (!name || loggedIn) return;

  // 1) Guardar localmente
  sessionStorage.setItem('username', name);
  // 2) Avisar al servidor
  socket.emit('login', name);
  // 3) Bloquear más logins en este cliente
  usernameInput.disabled = true;
  loginBtn.disabled     = true;
  loggedIn              = true;
  usernameInput.value   = '';
  startBtn.disabled     = false; // al menos tú ya cuentas
});

// Permitir Enter para hacer login
usernameInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') loginBtn.click();
});

// Cuando alguien pulsa Iniciar partida, vamos al juego
startBtn.addEventListener('click', () => {
  window.location.href = 'game.html';
});

// Aseguramos foco en el input al cargar
document.addEventListener('DOMContentLoaded', () => {
  usernameInput.focus();
});