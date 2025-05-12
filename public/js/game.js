// game.js
document.addEventListener('DOMContentLoaded', () => {
    const boardContainer = document.querySelector('.board-container');
    const board = document.createElement('div');
    board.classList.add('board');
    board.innerHTML = `<p style="color:#888;">Aquí irá tu tablero</p>`;
    boardContainer.appendChild(board);
  
    let scale = 1;
    boardContainer.addEventListener('wheel', e => {
      if (e.ctrlKey) {
        e.preventDefault();
        scale += e.deltaY * -0.001;
        scale = Math.min(Math.max(0.5, scale), 2);
        board.style.transform = `scale(${scale})`;
      }
    });
  });