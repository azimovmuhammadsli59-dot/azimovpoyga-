import { soundEngine } from '../assets/audio.js';

// Safe, colorful, educational & interactive games for children aged 3-5
export function launchKidsGame({ container, game, onFinish, onScoreUpdate }) {
  const mode = game.mode;
  let score = 0;
  let cleanupFns = [];
  let finished = false;

  const addScore = (pts) => {
    score += pts;
    const el = container.querySelector('#kids-score');
    if (el) el.textContent = String(score);
  };

  const completeRound = (headline = 'Barakalla! Ajoyib o‘ynadingiz!') => {
    if (finished) return;
    finished = true;
    soundEngine.playSuccess();
    onScoreUpdate?.(score);
    onFinish?.(score);
    const board = container.querySelector('#kids-board');
    if (!board) return;
    const done = document.createElement('div');
    done.className = 'race-overlay-panel';
    done.innerHTML = `
      <div class="race-card" style="text-align:center;max-width:440px;">
        <h3 class="race-card-title">${headline}</h3>
        <p class="race-card-sub">To‘plangan yulduzcha ballari: <strong style="color:var(--accent-cyan);">${score}</strong></p>
        <button type="button" id="kids-replay-btn" class="btn-primary">Yana o‘ynash</button>
      </div>
    `;
    board.appendChild(done);
    done.querySelector('#kids-replay-btn').addEventListener('click', () => {
      cleanupAll();
      launchKidsGame({ container, game, onFinish, onScoreUpdate });
    });
  };

  container.innerHTML = `
    <div class="kids-canvas-shell">
      <div class="kids-hud">
        <div>
          <strong style="font-family:var(--font-display);font-size:1.05rem;">${game.title}</strong>
          <span id="kids-prompt" style="margin-left:12px;color:var(--accent-cyan);font-weight:600;"></span>
        </div>
        <div style="display:flex;align-items:center;gap:14px;">
          <span>Ball: <strong id="kids-score" class="tabular-nums" style="color:var(--accent-amber);">0</strong></span>
          <button type="button" id="kids-finish-btn" class="btn-secondary" style="padding:6px 12px;font-size:0.82rem;">Yakunlash</button>
        </div>
      </div>
      <div id="kids-board" class="kids-board"></div>
    </div>
  `;

  const board = container.querySelector('#kids-board');
  const promptEl = container.querySelector('#kids-prompt');
  container.querySelector('#kids-finish-btn').addEventListener('click', () => completeRound());

  // 1. HAYVONLARNI TOP (Animal Memory & Discovery)
  if (mode === 'find-animals') {
    const animals = [
      { id: 'sher', name: 'Sher', color: '#f59e0b', glyph: '🦁' },
      { id: 'fil', name: 'Fil', color: '#38bdf8', glyph: '🐘' },
      { id: 'mushuk', name: 'Mushuk', color: '#f472b6', glyph: '🐱' },
      { id: 'kuchuk', name: 'Kuchuk', color: '#a78bfa', glyph: '🐶' },
      { id: 'quyon', name: 'Quyon', color: '#34d399', glyph: '🐰' },
      { id: 'ayiq', name: 'Ayiq', color: '#fb7185', glyph: '🐻' },
    ];
    const deck = [...animals, ...animals].sort(() => Math.random() - 0.5);
    let flipped = [];
    let matched = 0;
    promptEl.textContent = 'Bir xil hayvonlarni toping!';

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:20px;height:100%;align-content:center;';
    board.appendChild(grid);

    deck.forEach((item) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.style.cssText = 'min-height:92px;border-radius:14px;background:#1e293b;border:2px solid rgba(255,255,255,0.14);font-size:1.8rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;transition:transform 0.15s;';
      card.innerHTML = '<span>?</span>';
      card.addEventListener('click', () => {
        if (card.dataset.done || flipped.includes(card) || flipped.length >= 2) return;
        soundEngine.playClick();
        card.style.background = item.color;
        card.innerHTML = `<span>${item.glyph}</span><span style="font-size:0.78rem;font-weight:700;color:#0f172a;">${item.name}</span>`;
        flipped.push({ card, item });

        if (flipped.length === 2) {
          const [a, b] = flipped;
          if (a.item.id === b.item.id) {
            a.card.dataset.done = '1';
            b.card.dataset.done = '1';
            matched += 1;
            addScore(50);
            soundEngine.playCoin();
            promptEl.textContent = `Topildi: ${a.item.name}!`;
            flipped = [];
            if (matched === animals.length) {
              setTimeout(() => completeRound('Barcha hayvonlarni topdingiz!'), 450);
            }
          } else {
            setTimeout(() => {
              [a.card, b.card].forEach((c) => {
                c.style.background = '#1e293b';
                c.innerHTML = '<span>?</span>';
              });
              flipped = [];
            }, 650);
          }
        }
      });
      grid.appendChild(card);
    });
  }

  // 2. RANGLARNI AJRAT (Color Sorting)
  else if (mode === 'sort-colors') {
    const colors = [
      { id: 'red', name: 'Qizil', hex: '#ef4444' },
      { id: 'blue', name: 'Ko‘k', hex: '#3b82f6' },
      { id: 'green', name: 'Yashil', hex: '#10b981' },
      { id: 'yellow', name: 'Sariq', hex: '#facc15' },
    ];
    let current = colors[Math.floor(Math.random() * colors.length)];
    let solved = 0;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:space-around;height:420px;padding:24px;';
    wrap.innerHTML = `
      <p style="font-size:1.15rem;font-weight:700;">Ushbu kubikni mos rangli qutiga joylashtiring:</p>
      <div id="target-cube" style="width:96px;height:96px;border-radius:20px;box-shadow:0 12px 30px rgba(0,0,0,0.4);transition:transform 0.2s;"></div>
      <div id="color-buckets" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;width:100%;max-width:540px;"></div>
    `;
    board.appendChild(wrap);

    const cube = wrap.querySelector('#target-cube');
    const buckets = wrap.querySelector('#color-buckets');

    const nextColor = () => {
      current = colors[Math.floor(Math.random() * colors.length)];
      cube.style.background = current.hex;
      promptEl.textContent = `Rang: ${current.name}`;
    };
    nextColor();

    colors.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = c.name;
      btn.style.cssText = `padding:18px 10px;border-radius:14px;background:${c.hex};color:#090d16;font-weight:800;font-size:1rem;`;
      btn.addEventListener('click', () => {
        if (c.id === current.id) {
          addScore(30);
          solved += 1;
          soundEngine.playCoin();
          if (solved >= 10) completeRound('Ranglarni a’lo ajratdingiz!');
          else nextColor();
        } else {
          soundEngine.playTone(220, 0.14, 'sine', 0.12);
        }
      });
      buckets.appendChild(btn);
    });
  }

  // 3. SHAKLLARNI TOP (Geometric Shapes)
  else if (mode === 'find-shapes') {
    const shapes = [
      { id: 'circle', name: 'Doira', svg: '<circle cx="40" cy="40" r="28" fill="#38bdf8"/>' },
      { id: 'square', name: 'Kvadrat', svg: '<rect x="14" y="14" width="52" height="52" rx="6" fill="#facc15"/>' },
      { id: 'triangle', name: 'Uchburchak', svg: '<polygon points="40,10 70,66 10,66" fill="#10b981"/>' },
      { id: 'star', name: 'Yulduz', svg: '<polygon points="40,8 49,29 72,31 54,46 60,69 40,56 20,69 26,46 8,31 31,29" fill="#f472b6"/>' },
    ];
    let target = shapes[0];
    let rounds = 0;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;height:420px;padding:24px;';
    wrap.innerHTML = `
      <h3 id="shape-ask" style="font-family:var(--font-display);font-size:1.6rem;"></h3>
      <div id="shape-options" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;width:100%;max-width:560px;"></div>
    `;
    board.appendChild(wrap);

    const askEl = wrap.querySelector('#shape-ask');
    const optEl = wrap.querySelector('#shape-options');

    const pickTarget = () => {
      target = shapes[Math.floor(Math.random() * shapes.length)];
      askEl.textContent = `"${target.name}" shaklini bosing!`;
      promptEl.textContent = target.name;
    };
    pickTarget();

    shapes.forEach((sh) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = 'padding:16px;border-radius:16px;background:#1e293b;border:2px solid rgba(255,255,255,0.14);display:grid;place-items:center;';
      btn.innerHTML = `<svg viewBox="0 0 80 80" width="80" height="80">${sh.svg}</svg>`;
      btn.addEventListener('click', () => {
        if (sh.id === target.id) {
          addScore(35);
          rounds += 1;
          soundEngine.playCoin();
          if (rounds >= 8) completeRound('Barcha shakllarni topdingiz!');
          else pickTarget();
        } else {
          soundEngine.playTone(210, 0.14, 'sine', 0.12);
        }
      });
      optEl.appendChild(btn);
    });
  }

  // 4. KICHKINA QURUVCHI (Interactive Block Builder)
  else if (mode === 'little-builder') {
    const palette = ['#ef4444', '#facc15', '#10b981', '#38bdf8', '#a855f7', '#f97316'];
    let activeColor = palette[0];
    promptEl.textContent = 'Kubiklar bilan qasr quring!';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;padding:16px;height:420px;';
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div id="builder-colors" style="display:flex;gap:8px;"></div>
        <button type="button" id="builder-clear" class="btn-secondary" style="padding:6px 12px;font-size:0.82rem;">Tozalash</button>
      </div>
      <div id="builder-grid" style="flex:1;display:grid;grid-template-columns:repeat(10,1fr);grid-template-rows:repeat(6,1fr);gap:4px;background:#090d1b;padding:8px;border-radius:12px;"></div>
    `;
    board.appendChild(wrap);

    const palWrap = wrap.querySelector('#builder-colors');
    palette.forEach((col, i) => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = `swatch-btn ${i === 0 ? 'selected' : ''}`;
      sw.style.background = col;
      sw.addEventListener('click', () => {
        activeColor = col;
        soundEngine.playClick();
        palWrap.querySelectorAll('.swatch-btn').forEach((b) => b.classList.remove('selected'));
        sw.classList.add('selected');
      });
      palWrap.appendChild(sw);
    });

    const grid = wrap.querySelector('#builder-grid');
    for (let i = 0; i < 60; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.style.cssText = 'border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);transition:transform 0.1s;';
      cell.addEventListener('click', () => {
        if (cell.dataset.filled) {
          cell.style.background = 'rgba(255,255,255,0.05)';
          delete cell.dataset.filled;
        } else {
          cell.style.background = activeColor;
          cell.dataset.filled = '1';
          addScore(10);
          soundEngine.playCoin();
        }
      });
      grid.appendChild(cell);
    }

    wrap.querySelector('#builder-clear').addEventListener('click', () => {
      grid.querySelectorAll('button').forEach((c) => {
        c.style.background = 'rgba(255,255,255,0.05)';
        delete c.dataset.filled;
      });
      soundEngine.playClick();
    });
  }

  // 5–10. INTERACTIVE CANVAS GAMES (Colorful Cars, Catch Fruits, Little Racer, Happy Plane, Dino Adventure, Magic Bubbles)
  else {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 420;
    board.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let carColor = '#00e5ff';
    if (mode === 'colorful-cars') {
      promptEl.textContent = 'Rangni tanlang va yulduz yig‘ing!';
      const bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;top:10px;left:12px;display:flex;gap:8px;z-index:5;';
      ['#00e5ff', '#ef4444', '#facc15', '#10b981', '#a855f7'].forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'swatch-btn';
        b.style.background = c;
        b.addEventListener('click', () => {
          carColor = c;
          soundEngine.playClick();
        });
        bar.appendChild(b);
      });
      board.appendChild(bar);
    }

    let playerX = 400;
    let playerY = 330;
    let playerVy = 0;
    let lane = 1;
    let items = [];
    let spawnTimer = 0;
    const keys = { left: false, right: false, up: false };

    const onKeyDown = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keys.left = true;
        if (mode === 'little-racer' || mode === 'colorful-cars') lane = Math.max(0, lane - 1);
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keys.right = true;
        if (mode === 'little-racer' || mode === 'colorful-cars') lane = Math.min(2, lane + 1);
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        keys.up = true;
        if (mode === 'dino-adventure' && playerY >= 318) {
          playerVy = -460;
          soundEngine.playClick();
        }
        if (mode === 'happy-plane') {
          playerVy = -260;
          soundEngine.playClick();
        }
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    cleanupFns.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    });

    const onPointerDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const py = ((e.clientY - rect.top) / rect.height) * canvas.height;

      if (mode === 'magic-bubbles') {
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          if (Math.hypot(px - it.x, py - it.y) <= it.r + 14) {
            items.splice(i, 1);
            addScore(20);
            soundEngine.playCoin();
            break;
          }
        }
      } else if (mode === 'happy-plane') {
        playerVy = -260;
        soundEngine.playClick();
      } else if (mode === 'dino-adventure') {
        if (playerY >= 318) {
          playerVy = -460;
          soundEngine.playClick();
        }
      } else if (mode === 'little-racer' || mode === 'colorful-cars') {
        if (px < canvas.width / 2) lane = Math.max(0, lane - 1);
        else lane = Math.min(2, lane + 1);
      } else if (mode === 'catch-fruits') {
        playerX = px;
      }
    };
    const onPointerMove = (e) => {
      if (mode === 'catch-fruits') {
        const rect = canvas.getBoundingClientRect();
        playerX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      }
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);

    let lastTime = performance.now();
    let rafId = 0;

    function loop(now) {
      if (finished) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      ctx.clearRect(0, 0, 800, 420);

      if (mode === 'catch-fruits') {
        promptEl.textContent = 'Mevalarni savatchaga tuting!';
        ctx.fillStyle = '#0c1b33';
        ctx.fillRect(0, 0, 800, 420);
        if (keys.left) playerX -= 360 * dt;
        if (keys.right) playerX += 360 * dt;
        playerX = Math.max(50, Math.min(750, playerX));

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = 0.75;
          const emojis = ['🍎', '🍌', '🍇', '🍉', '🍓'];
          items.push({ x: 50 + Math.random() * 700, y: -20, vy: 145 + Math.random() * 60, glyph: emojis[Math.floor(Math.random() * emojis.length)] });
        }

        // Basket
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(playerX - 48, 358, 96, 30);
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';

        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.vy * dt;
          ctx.fillText(it.glyph, it.x, it.y);
          if (it.y > 345 && it.y < 395 && Math.abs(it.x - playerX) < 56) {
            items.splice(i, 1);
            addScore(25);
            soundEngine.playCoin();
          } else if (it.y > 440) {
            items.splice(i, 1);
          }
        }
      } else if (mode === 'magic-bubbles') {
        promptEl.textContent = 'Rangli sharlarni bosing!';
        ctx.fillStyle = '#110f29';
        ctx.fillRect(0, 0, 800, 420);
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = 0.55;
          const cols = ['#00e5ff', '#f472b6', '#facc15', '#34d399', '#a78bfa'];
          items.push({ x: 60 + Math.random() * 680, y: 440, vy: 75 + Math.random() * 65, r: 26 + Math.random() * 14, col: cols[Math.floor(Math.random() * cols.length)] });
        }
        for (let i = items.length - 1; i >= 0; i--) {
          const b = items[i];
          b.y -= b.vy * dt;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = b.col;
          ctx.globalAlpha = 0.82;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          if (b.y < -50) items.splice(i, 1);
        }
      } else if (mode === 'happy-plane') {
        promptEl.textContent = 'Samolyotni ko‘tarish uchun Space yoki ekranga bosing!';
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(0, 0, 800, 420);
        playerVy += 520 * dt;
        playerY = Math.max(30, Math.min(370, playerY + playerVy * dt));
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = 1.05;
          items.push({ x: 830, y: 60 + Math.random() * 290 });
        }
        // Plane shape
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(150, playerY, 34, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(130, playerY - 22, 14, 16);

        ctx.font = '30px sans-serif';
        for (let i = items.length - 1; i >= 0; i--) {
          const st = items[i];
          st.x -= 210 * dt;
          ctx.fillText('⭐', st.x, st.y);
          if (Math.hypot(st.x - 150, st.y - playerY) < 42) {
            items.splice(i, 1);
            addScore(30);
            soundEngine.playCoin();
          } else if (st.x < -30) {
            items.splice(i, 1);
          }
        }
      } else if (mode === 'dino-adventure') {
        promptEl.textContent = 'Sakrash uchun Space yoki ekranga bosing!';
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(0, 0, 800, 420);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, 355, 800, 65);

        playerVy += 1150 * dt;
        playerY = Math.min(320, playerY + playerVy * dt);
        if (playerY >= 320) playerVy = 0;

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = 1.25;
          items.push({ x: 830, isFruit: Math.random() > 0.45 });
        }

        // Cute Dino
        ctx.fillStyle = '#34d399';
        ctx.fillRect(110, playerY - 24, 44, 52);
        ctx.fillRect(136, playerY - 40, 30, 24);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(156, playerY - 34, 5, 5);

        ctx.font = '30px sans-serif';
        for (let i = items.length - 1; i >= 0; i--) {
          const obj = items[i];
          obj.x -= 240 * dt;
          ctx.fillText(obj.isFruit ? '🍓' : '🌿', obj.x, obj.isFruit ? 255 : 345);
          const targetY = obj.isFruit ? 255 : 340;
          if (Math.abs(obj.x - 135) < 34 && Math.abs(playerY - targetY) < 44) {
            items.splice(i, 1);
            if (obj.isFruit) {
              addScore(35);
              soundEngine.playCoin();
            } else {
              soundEngine.playTone(260, 0.12, 'sine', 0.1);
            }
          } else if (obj.x < -40) {
            items.splice(i, 1);
          }
        }
      } else {
        // colorful-cars / little-racer 3-lane highway
        if (mode === 'little-racer') promptEl.textContent = 'Chap/O‘ng tugmalar bilan yulduz to‘plang!';
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(160, 0, 480, 420);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 160, 420);
        ctx.fillRect(640, 0, 160, 420);

        ctx.strokeStyle = '#f8fafc';
        ctx.setLineDash([24, 24]);
        ctx.lineWidth = 4;
        [320, 480].forEach((lx) => {
          ctx.beginPath();
          ctx.moveTo(lx, 0);
          ctx.lineTo(lx, 420);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        const laneX = [240, 400, 560][lane];
        playerX += (laneX - playerX) * Math.min(1, 14 * dt);

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = 0.85;
          items.push({ lane: Math.floor(Math.random() * 3), y: -20 });
        }

        // Car
        ctx.fillStyle = carColor;
        ctx.fillRect(playerX - 28, 320, 56, 74);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(playerX - 20, 336, 40, 22);

        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += 220 * dt;
          const ix = [240, 400, 560][it.lane];
          ctx.fillText(mode === 'little-racer' ? '🎈' : '⭐', ix, it.y);
          if (it.lane === lane && it.y > 305 && it.y < 390) {
            items.splice(i, 1);
            addScore(25);
            soundEngine.playCoin();
          } else if (it.y > 440) {
            items.splice(i, 1);
          }
        }
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    cleanupFns.push(() => cancelAnimationFrame(rafId));
  }

  function cleanupAll() {
    finished = true;
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
    if (score > 0) onScoreUpdate?.(score);
  }

  return cleanupAll;
}
