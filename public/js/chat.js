// chat.js
document.addEventListener('DOMContentLoaded', () => {
    const socket        = io();
    const username      = sessionStorage.getItem('username');
    if (!username) {
      alert('No se ha encontrado tu usuario. Vuelve al lobby.');
      return window.location.href = '/';
    }
  
    // DOM
    const playersList    = document.getElementById('players-list');
    const tabsList       = document.getElementById('chat-tabs-list');
    const contents       = document.querySelector('.chat-contents');
    const inputField     = document.getElementById('chat-input-field');
    const sendBtn        = document.getElementById('chat-send-btn');
    const openChats      = new Set();
  
    // Inicializa Global
    function initGlobal() {
      openChats.add('global');
      const tab = document.createElement('li');
      tab.classList.add('chat-tab', 'active');
      tab.dataset.user = 'global';
      tab.textContent = 'Global';
      tabsList.appendChild(tab);
      tab.addEventListener('click', () => selectTab('global'));
      const cont = document.createElement('div');
      cont.classList.add('chat-content', 'active');
      cont.id = 'chat-global';
      cont.innerHTML = `<div class="messages"></div>`;
      contents.appendChild(cont);
    }
  
    // Seleccionar pestaña
    function selectTab(user) {
      document.querySelectorAll('.chat-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.user === user);
        if (t.dataset.user === user) t.classList.remove('blink');
      });
      document.querySelectorAll('.chat-content').forEach(c =>
        c.classList.toggle('active', c.id === `chat-${user}`)
      );
    }
  
    // Abrir chat privado
    function openPrivate(user) {
      if (openChats.has(user) || user === 'global') return;
      openChats.add(user);
      const tab = document.createElement('li');
      tab.classList.add('chat-tab');
      tab.dataset.user = user;
      tab.innerHTML = `${user} <span class="close-tab" data-user="${user}">&times;</span>`;
      tabsList.appendChild(tab);
      tab.addEventListener('click', e => {
        if (e.target.classList.contains('close-tab')) return closeChat(user);
        selectTab(user);
      });
      const cont = document.createElement('div');
      cont.classList.add('chat-content');
      cont.id = `chat-${user}`;
      cont.innerHTML = `<div class="messages"></div>`;
      contents.appendChild(cont);
    }
  
    // Cerrar chat privado
    function closeChat(user) {
      document.querySelector(`.chat-tab[data-user="${user}"]`)?.remove();
      document.getElementById(`chat-${user}`)?.remove();
      openChats.delete(user);
      selectTab('global');
    }
  
    // Añadir mensaje y gestionar parpadeo
    function appendMsg(chatUser, from, text) {
      const cont = document.querySelector(`#chat-${chatUser} .messages`);
      if (!cont) return;
      const p = document.createElement('p');
      p.innerHTML = `<strong>${from}:</strong> ${text}`;
      cont.appendChild(p);
      cont.scrollTop = cont.scrollHeight;
  
      // Si la pestaña no está activa, parpadea
      const tab = document.querySelector(`.chat-tab[data-user="${chatUser}"]`);
      if (tab && !tab.classList.contains('active')) {
        tab.classList.add('blink');
      }
    }
  
    // Enviar mensaje
    function sendMessage() {
      const txt = inputField.value.trim();
      if (!txt) return;
      const active = document.querySelector('.chat-tab.active');
      const to = active.dataset.user || 'global';
      socket.emit('chat message', { to, message: txt });
      inputField.value = '';
    }
  
    // Eventos Socket.io
    socket.on('userlist', users => {
      playersList.innerHTML = '';
      users.forEach(u => {
        const li = document.createElement('li');
        li.textContent = u;
        li.dataset.user = u;
        if (u === username) li.classList.add('self');
        playersList.appendChild(li);
      });
    });
  
    socket.on('chat message', ({ from, to, message }) => {
      let target = to === 'global'
        ? 'global'
        : (from === username ? to : from);
  
      if (!openChats.has(target)) openPrivate(target);
      appendMsg(target, from, message);
    });
  
    // UI interactions
    playersList.addEventListener('click', e => {
      if (e.target.tagName !== 'LI') return;
      const u = e.target.dataset.user;
      if (u !== username) {
        openPrivate(u);
        selectTab(u);
      }
    });
    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', e => {
      if (e.key === 'Enter') sendMessage();
    });
  
    // Init
    initGlobal();
    socket.emit('login', username);
  });