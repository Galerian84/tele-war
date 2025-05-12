// lobby.js
const loginBtn     = document.getElementById('login-btn');
const startBtn     = document.getElementById('start-btn');
const usernameInput = document.getElementById('username');
const playersList  = document.getElementById('players-list');

let players = [];

/**
 * Añade un jugador si no existe ya y actualiza la UI.
 */
function addPlayer(name) {
  if (!players.includes(name)) {
    players.push(name);
    updatePlayersUI();
    startBtn.disabled = players.length === 0;
  }
}

/**
 * Vuelca el array de jugadores en la lista del DOM.
 */
function updatePlayersUI() {
  playersList.innerHTML = '';
  players.forEach(player => {
    const li = document.createElement('li');
    li.textContent = player;
    playersList.appendChild(li);
  });
}

// Evento de click en Login
loginBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if (name) {
    addPlayer(name);
    usernameInput.value = '';
    usernameInput.focus();
  }
});

// Permite hacer Enter para hacer login
usernameInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') loginBtn.click();
});

// Evento de Iniciar partida
startBtn.addEventListener('click', () => {
  // Aquí navegaremos al juego real (pendiente de implementar)
  window.location.href = 'game.html';
});

// Foco inicial en el input
document.addEventListener('DOMContentLoaded', () => {
  usernameInput.focus();
});