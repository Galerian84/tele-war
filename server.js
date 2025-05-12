// server.js
const express = require('express');
const path    = require('path');
const http    = require('http');
const socketIo= require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server);
const PORT   = process.env.PORT || 3000;

// Servir estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Mapa socket.id -> username
let users = {};

io.on('connection', socket => {
  console.log(`🔌 Conexión: ${socket.id}`);

  // Cuando el cliente se loguea en la página de juego
  socket.on('login', username => {
    users[socket.id] = username;
    io.emit('userlist', Object.values(users));
  });

  // Mensaje de chat (global o privado)
  socket.on('chat message', ({ to, message }) => {
    const from = users[socket.id];
    if (to === 'global') {
      io.emit('chat message', { from, to, message });
    } else {
      // privado: busca el socket del destinatario
      for (const id in users) {
        if (users[id] === to) {
          io.to(id).emit('chat message', { from, to, message });
          break;
        }
      }
      // también lo reenvía al emisor
      socket.emit('chat message', { from, to, message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Desconexión: ${socket.id}`);
    delete users[socket.id];
    io.emit('userlist', Object.values(users));
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});