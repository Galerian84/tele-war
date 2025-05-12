// lobby.js
const socket        = io();
const loginBtn      = document.getElementById('login-btn');
const startBtn      = document.getElementById('start-btn');
const usernameInput = document.getElementById('username');
const playersList   = document.getElementById('players-list');
let loggedIn = false;

// Actualizar lista de usuarios
socket.on('userlist', users => {
  playersList.innerHTML = '';
  users.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    playersList.appendChild(li);
  });
  startBtn.disabled = users.length === 0;
});

// Cuando alguien inicia la partida, todos navegan
socket.on('startGame', () => {
  window.location.href = 'game.html';
});

// Pulsar “Iniciar partida” emite startGame
startBtn.addEventListener('click', () => {
  socket.emit('startGame');
});

// Login normal
loginBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if (!name || loggedIn) return;
  sessionStorage.setItem('username', name);
  socket.emit('login', name);
  usernameInput.disabled = true;
  loginBtn.disabled     = true;
  loggedIn              = true;
  usernameInput.value   = '';
});
usernameInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') loginBtn.click();
});
document.addEventListener('DOMContentLoaded', () => {
  usernameInput.focus();
});