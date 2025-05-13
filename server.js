const express  = require('express');
const path     = require('path');
const http     = require('http');
const socketIo = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server);
const PORT   = process.env.PORT || 3001;

let users = {};

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', socket => {
  console.log(`🔌 Conexión: ${socket.id}`);

  // Login
  socket.on('login', username => {
    users[socket.id] = username;
    io.emit('userlist', Object.values(users));
  });

  // Nuevo: startGame → notifica a todos
  socket.on('startGame', () => {
    io.emit('startGame');
  });

  // Chat
  socket.on('chat message', ({ to, message }) => {
    const from = users[socket.id];
    if (to === 'global') {
      io.emit('chat message', { from, to, message });
    } else {
      // privado
      for (const id in users) {
        if (users[id] === to) {
          io.to(id).emit('chat message', { from, to, message });
          break;
        }
      }
      socket.emit('chat message', { from, to, message });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('userlist', Object.values(users));
    console.log(`❌ Desconexión: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});