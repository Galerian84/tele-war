// chat.js
document.addEventListener('DOMContentLoaded', () => {
    const socket     = io();
    const username   = sessionStorage.getItem('username');
    if (!username) {
      alert('No se ha encontrado tu usuario. Vuelve al lobby.');
      return window.location.href = '/';
    }
  
    // DOM
    const playersList  = document.getElementById('players-list');
    const tabsList     = document.getElementById('chat-tabs-list');
    const contents     = document.querySelector('.chat-contents');
    const inputField   = document.getElementById('chat-input-field');
    const sendBtn      = document.getElementById('chat-send-btn');
  
    // Lleva el control de qué chats están abiertos
    const openChats = new Set();
  
    // 1) Inicializa el chat Global
    function initGlobal() {
      openChats.add('global');
      // pestaña
      const tab = document.createElement('li');
      tab.classList.add('chat-tab', 'active');
      tab.dataset.user = 'global';
      tab.textContent = 'Global';
      tabsList.appendChild(tab);
      tab.addEventListener('click', selectTab);
      // contenido
      const cont = document.createElement('div');
      cont.classList.add('chat-content', 'active');
      cont.id = 'chat-global';
      const msgs = document.createElement('div');
      msgs.classList.add('messages');
      cont.appendChild(msgs);
      contents.appendChild(cont);
    }
  
    // 2) Selección de pestaña
    function selectTab(e) {
      const u = e.currentTarget.dataset.user;
      document.querySelectorAll('.chat-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.user === u)
      );
      document.querySelectorAll('.chat-content').forEach(c =>
        c.classList.toggle('active', c.id === `chat-${u}`)
      );
    }
  
    // 3) Crea un chat privado si no existe
    function openPrivate(user) {
      if (openChats.has(user) || user === 'global') return;
      openChats.add(user);
      // pestaña
      const tab = document.createElement('li');
      tab.classList.add('chat-tab');
      tab.dataset.user = user;
      tab.innerHTML = `${user} <span class="close-tab" data-user="${user}">&times;</span>`;
      tabsList.appendChild(tab);
      tab.addEventListener('click', e => {
        if (e.target.classList.contains('close-tab')) return closeChat(user);
        selectTab(e);
      });
      // contenido
      const cont = document.createElement('div');
      cont.classList.add('chat-content');
      cont.id = `chat-${user}`;
      const msgs = document.createElement('div');
      msgs.classList.add('messages');
      cont.appendChild(msgs);
      contents.appendChild(cont);
    }
  
    // 4) Cierra un chat privado
    function closeChat(user) {
      document.querySelector(`.chat-tab[data-user="${user}"]`)?.remove();
      document.getElementById(`chat-${user}`)?.remove();
      openChats.delete(user);
      // vuelve a global
      document.querySelector('.chat-tab[data-user="global"]')?.click();
    }
  
    // 5) Añade mensaje al DOM
    function appendMsg(chatUser, from, text) {
      const cont = document.querySelector(`#chat-${chatUser} .messages`);
      if (!cont) return;
      const p = document.createElement('p');
      p.innerHTML = `<strong>${from}:</strong> ${text}`;
      cont.appendChild(p);
      cont.scrollTop = cont.scrollHeight;
    }
  
    // 6) Enviar mensaje
    function sendMessage() {
      const txt = inputField.value.trim();
      if (!txt) return;
      const active = document.querySelector('.chat-tab.active');
      const to = active ? active.dataset.user : 'global';
      socket.emit('chat message', { to, message: txt });
      inputField.value = '';
    }
  
    // 7) Actualiza la lista de usuarios
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
  
    // 8) Recibe mensajes del servidor
    socket.on('chat message', ({ from, to, message }) => {
      // Decide en qué chat mostrarlo
      let target = 'global';
      if (to !== 'global') {
        // si tú envías, va al chat de destino; si te envían, va al chat del emisor
        target = (from === username ? to : from);
      }
      if (!openChats.has(target)) openPrivate(target);
      appendMsg(target, from, message);
    });
  
    // 9) Interacciones UI
    // Abrir privado al clicar en la lista
    playersList.addEventListener('click', e => {
      if (e.target.tagName !== 'LI') return;
      const u = e.target.dataset.user;
      if (u !== username) {
        openPrivate(u);
        document.querySelector(`.chat-tab[data-user="${u}"]`)?.click();
      }
    });
    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', e => {
      if (e.key === 'Enter') sendMessage();
    });
  
    // Arranque
    initGlobal();
    socket.emit('login', username);
  });