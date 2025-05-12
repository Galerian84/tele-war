// public/js/map.js
document.addEventListener('DOMContentLoaded', () => {
    const container    = document.querySelector('.board-container');
    const playersList  = document.getElementById('players-list');
    const sidebarRight = document.querySelector('.sidebar-right');
  
    // — Configuramos solo el bloque de "Tus recursos"
    // Nos aseguramos de que exista un contenedor #player-resources con #player-inventory
    let invDiv = document.getElementById('player-resources');
    if (!invDiv) {
      invDiv = document.createElement('div');
      invDiv.id = 'player-resources';
      invDiv.innerHTML = `
        <h3>Tus recursos</h3>
        <ul id="player-inventory"></ul>
      `;
      sidebarRight.appendChild(invDiv);
    }
    const invList = invDiv.querySelector('#player-inventory');
  
    // — Creamos el tooltip que seguirá al cursor
    let tooltip = document.getElementById('hex-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'hex-tooltip';
      document.body.appendChild(tooltip);
    }
  
    // Parámetros de la rejilla
    const size  = 40;
    const cols  = 20;
    const rows  = 15;
    const wStep = 1.5 * size;
    const hStep = Math.sqrt(3) * size;
  
    // 1) Creamos y dimensionamos el canvas
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id     = 'mapCanvas';
    canvas.width  = Math.ceil(size + wStep * (cols - 1) + size);
    canvas.height = Math.ceil(size + hStep * (rows - 1 + 0.5) + size);
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
  
    // 2) Generamos el mapa de recursos y contamos totales (interno)
    const types   = ['pradera','bosque','cultivo','montaña','mina'];
    const weights = { pradera:50, bosque:20, cultivo:15, montaña:10, mina:5 };
    const totalW  = types.reduce((sum, t) => sum + weights[t], 0);
    const mapRes  = Array.from({ length: cols }, () => Array(rows));
    const counts  = Object.fromEntries(types.map(t => [t, 0]));
  
    function pickResource() {
      let r = Math.random() * totalW;
      for (const t of types) {
        r -= weights[t];
        if (r <= 0) return t;
      }
      return types[types.length - 1];
    }
  
    for (let q = 0; q < cols; q++) {
      for (let r = 0; r < rows; r++) {
        const t = pickResource();
        mapRes[q][r] = t;
        counts[t]++;
      }
    }
  
    // 3) Configuramos el inventario inicial del jugador (0 de todos)
    invList.innerHTML = types.map(t =>
      `<li>${t.charAt(0).toUpperCase() + t.slice(1)}: 0</li>`
    ).join('');
  
    // 4) Zoom con Ctrl+rueda
    let scale = 1;
    canvas.addEventListener('wheel', e => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      scale = Math.min(Math.max(0.5, scale - e.deltaY * 0.001), 2);
      redraw();
    });
  
    // 5) Función para dibujar un hexágono flat-topped
    function drawHex(x, y, fillColor) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 180 * (60 * i);
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
      ctx.strokeStyle = '#555';
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
  
    const colorMap = {
      pradera: 'rgba(34,139,34,0.4)',
      bosque:  'rgba(0,100,0,0.4)',
      cultivo: 'rgba(218,165,32,0.4)',
      montaña:'rgba(169,169,169,0.4)',
      mina:    'rgba(105,105,105,0.4)'
    };
  
    // 6) Dibuja la rejilla
    function drawGrid() {
      for (let q = 0; q < cols; q++) {
        for (let r = 0; r < rows; r++) {
          const x = size + wStep * q;
          const y = size + (q % 2) * (hStep / 2) + hStep * r;
          drawHex(x, y, colorMap[ mapRes[q][r] ]);
        }
      }
    }
  
    // 7) Devuelve coordenadas de todas las praderas
    function getPraderas() {
      const arr = [];
      for (let q = 0; q < cols; q++) {
        for (let r = 0; r < rows; r++) {
          if (mapRes[q][r] === 'pradera') {
            arr.push({ q, r });
          }
        }
      }
      return arr;
    }
  
    // 8) Asignación fija de posiciones de jugadores (una sola vez)
    const playerPositions = {};
    let positionsAssigned = false;
    function assignPositions() {
      const users = Array.from(playersList.children)
        .map(li => li.dataset.user)
        .filter(u => u);
      if (!users.length) return;
  
      const prads = getPraderas().slice();
      // Barajamos praderas
      for (let i = prads.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [prads[i], prads[j]] = [prads[j], prads[i]];
      }
      users.forEach((u, i) => {
        if (i < prads.length) playerPositions[u] = prads[i];
      });
      positionsAssigned = true;
    }
  
    // 9) Dibuja a los jugadores según las posiciones asignadas
    function drawPlayers() {
      Object.entries(playerPositions).forEach(([u, { q, r }], idx) => {
        const x = size + wStep * q;
        const y = size + (q % 2) * (hStep / 2) + hStep * r;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${Math.floor(360 * idx / Object.keys(playerPositions).length)},70%,60%)`;
        ctx.fill();
        ctx.fillStyle    = '#222';
        ctx.font         = `${Math.floor(size * 0.6)}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(u.charAt(0).toUpperCase(), x, y);
      });
    }
  
    // 10) Convierte pixel → hex axial (aprox) para tooltip
    function pixelToHex(px, py) {
      const x  = px / scale - size;
      const y  = py / scale - size;
      const qf = (2/3 * x) / size;
      const rf = ((-1/3 * x) + (Math.sqrt(3)/3 * y)) / size;
      let xf = qf, zf = rf, yf = -xf - zf;
      let rx = Math.round(xf), ry = Math.round(yf), rz = Math.round(zf);
      const dx = Math.abs(rx - xf), dy = Math.abs(ry - yf), dz = Math.abs(rz - zf);
      if (dx > dy && dx > dz) rx = -ry - rz;
      else if (dy > dz)       ry = -rx - rz;
      else                    rz = -rx - ry;
      return { q: rx, r: rz };
    }
  
    // 11) Tooltip que sigue al cursor
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const px   = e.clientX - rect.left;
      const py   = e.clientY - rect.top;
      const { q, r } = pixelToHex(px, py);
      if (q >= 0 && q < cols && r >= 0 && r < rows) {
        const t = mapRes[q][r];
        tooltip.textContent   = t.charAt(0).toUpperCase() + t.slice(1);
        tooltip.style.left    = `${e.pageX + 10}px`;
        tooltip.style.top     = `${e.pageY + 10}px`;
        tooltip.style.display = 'block';
      } else {
        tooltip.style.display = 'none';
      }
    });
    canvas.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  
    // 12) Redibuja todo (aplica zoom)
    function redraw() {
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.setTransform(scale,0,0,scale,0,0);
      drawGrid();
      drawPlayers();
    }
  
    // 13) Observador de la lista de jugadores:
    //     asigna posiciones solo UNA VEZ y luego redibuja
    new MutationObserver(() => {
      if (!positionsAssigned && playersList.children.length > 0) {
        assignPositions();
      }
      redraw();
    }).observe(playersList, { childList: true });
  
    // 14) Dibujo inicial
    redraw();
  });