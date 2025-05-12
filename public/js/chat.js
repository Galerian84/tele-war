// chat.js
const socket = io();
const username = sessionStorage.getItem('username');

if (!username) {
  alert('No se ha encontrado tu usuario. Vuelve al lobby.');
  window.location.href = '/';
} else {
  socket.emit('login', username);
}

const playersList    = document.getElementById('players-list');
const chatTabsList   = document.getElementById('chat-tabs-list');
const chatContents   = document.querySelector('.chat-contents');
const chatInputField = document.getElementById('chat-input-field');
const chatSendBtn    = document.getElementById('chat-send-btn');

/** Helpers */
function createChatTab(user) {
  const li = document.createElement('li');
  li.classList.add('chat-tab');
  li.dataset.user = user;
  if (user === 'global') li.classList.add('active');
  li.innerHTML = `${user}${user !== 'global' ? ' <span class="close-tab">&times;</span>' : ''}`;
  chatTabsList.appendChild(li);
  li.addEventListener('click', e => {
    if (e.target.classList.contains('close-tab')) closeChatTab(user);
    else selectChatTab(user);
  });
}

function createChatContent(user) {
  const div = document.createElement('div');
  div.classList.add('chat-content');
  div.id = `chat-${user}`;
  div.innerHTML = `<div class="messages"></div>`;
  chatContents.appendChild(div);
}

function selectChatTab(user) {
  document.querySelectorAll('.chat-tab').forEach(tab =>
    tab.classList.toggle('active', tab.dataset.user === user)
  );
  document.querySelectorAll('.chat-content').forEach(c =>
    c.classList.toggle('active', c.id === `chat-${user}`)
  );
}

function closeChatTab(user) {
  document.querySelector(`.chat-tab[data-user="${user}"]`).remove();
  document.getElementById(`chat-${user}`).remove();
  selectChatTab('global');
}

function sendMessage() {
  const msg = chatInputField.value.trim();
  if (!msg) return;
  const to = document.querySelector('.chat-tab.active').dataset.user;
  socket.emit('chat message', { to, message: msg });
  chatInputField.value = '';
}

chatSendBtn.addEventListener('click', sendMessage);
chatInputField.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

// Recibe lista de usuarios y actualiza el sidebar
socket.on('userlist', users => {
  playersList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    li.dataset.user = user;
    playersList.appendChild(li);
  });
});

// Al hacer click en un jugador, abre chat privado
playersList.addEventListener('click', e => {
  if (e.target.tagName === 'LI') {
    const user = e.target.dataset.user;
    if (user !== username) {
      if (!document.querySelector(`.chat-tab[data-user="${user}"]`)) {
        createChatTab(user);
        createChatContent(user);
      }
      selectChatTab(user);
    }
  }
});

// Mostrar mensajes entrantes
socket.on('chat message', ({ from, to, message }) => {
  // Determina en qué chat aparece
  const user = to === 'global' ? 'global' : (from === username ? to : from);

  if (!document.getElementById(`chat-${user}`)) {
    createChatTab(user);
    createChatContent(user);
  }

  const cont = document.getElementById(`chat-${user}`).querySelector('.messages');
  const p = document.createElement('p');
  p.innerHTML = `<strong>${from}:</strong> ${message}`;
  cont.appendChild(p);
  cont.scrollTop = cont.scrollHeight;
});