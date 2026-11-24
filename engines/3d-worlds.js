import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createAirplaneModel,
  createDinoModel,
  createRobotModel,
  createSpaceshipModel,
  createSubmarineModel,
} from '../assets/models.js';
import { soundEngine } from '../assets/audio.js';

function detectSoftwareWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function launchWorld3DGame({ container, game, settings, onFinish, onScoreUpdate }) {
  const mode = game.mode || 'flight';
  const showTouch =
    settings.showTouchControls === 'always' ||
    (settings.showTouchControls !== 'off' && ('ontouchstart' in window || window.innerWidth <= 920));

  const labelsByMode = {
    flight: { obj: 'Halqalar', action: 'Turbo' },
    'flight-pro': { obj: 'Halqalar', action: 'Forsaž' },
    space: { obj: 'Kristallar', action: 'Lazer' },
    'space-pro': { obj: 'Kristallar', action: 'Plazma' },
    football: { obj: 'Gollar', action: 'Zarba' },
    'football-pro': { obj: 'Gollar', action: 'Zarba' },
    dino: { obj: 'Tuxumlar', action: 'Sakrash' },
    robot: { obj: 'Yadrolar', action: 'Tezlik' },
    maze: { obj: 'Olmoslar', action: 'Sakrash' },
    ocean: { obj: 'Marvarid', action: 'Suv osti' },
  }[mode] || { obj: 'Ball', action: 'Harakat' };

  container.innerHTML = `
    <div id="world-canvas-mount" style="width:100%;height:100%;position:relative;"></div>
    <div class="hud-layer">
      <div class="hud-top-row">
        <div class="hud-panel">
          <div class="hud-stat-grid">
            <div>
              <span class="hud-stat-label">${labelsByMode.obj}</span>
              <span class="hud-stat-value" id="w-hud-count">0</span>
            </div>
            <div>
              <span class="hud-stat-label">Ball</span>
              <span class="hud-stat-value" id="w-hud-score">0</span>
            </div>
            <div>
              <span class="hud-stat-label">Vaqt</span>
              <span class="hud-stat-value" id="w-hud-time">60s</span>
            </div>
          </div>
        </div>
        <div class="hud-panel">
          <span class="hud-stat-label">Holat</span>
          <span class="hud-stat-value" id="w-hud-status" style="font-size:0.95rem;color:var(--accent-cyan);">Faol</span>
        </div>
      </div>

      <div class="touch-controls ${showTouch ? '' : 'hidden'}">
        <div class="touch-cluster">
          <button type="button" class="touch-btn" data-key="left">&larr;</button>
          <button type="button" class="touch-btn" data-key="up">&uarr;</button>
          <button type="button" class="touch-btn" data-key="down">&darr;</button>
          <button type="button" class="touch-btn" data-key="right">&rarr;</button>
        </div>
        <div class="touch-cluster">
          <button type="button" class="touch-btn touch-btn-gas" data-key="action">${labelsByMode.action}</button>
        </div>
      </div>
    </div>
  `;

  const mount = container.querySelector('#world-canvas-mount');
  const hudCount = container.querySelector('#w-hud-count');
  const hudScore = container.querySelector('#w-hud-score');
  const hudTime = container.querySelector('#w-hud-time');
  const hudStatus = container.querySelector('#w-hud-status');

  const isSoftwareGl = detectSoftwareWebGL();
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth || 960, mount.clientHeight || 540);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(
    65,
    (mount.clientWidth || 960) / (mount.clientHeight || 540),
    0.1,
    360
  );

  const hemi = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.85);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 1.35);
  dir.position.set(25, 45, 25);
  scene.add(dir);

  const keys = { up: false, down: false, left: false, right: false, action: false };
  const onKeyDown = (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') {
      keys.action = true;
      e.preventDefault();
    }
  };
  const onKeyUp = (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space') keys.action = false;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  container.querySelectorAll('.touch-btn[data-key]').forEach((btn) => {
    const k = btn.dataset.key;
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); keys[k] = true; btn.classList.add('pressed'); });
    const up = (e) => { e.preventDefault(); keys[k] = false; btn.classList.remove('pressed'); };
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  });

  // Game Mode Setup
  let score = 0;
  let count = 0;
  let timeLeft = mode === 'maze' ? 90 : 60;
  let finished = false;
  let playerObj = null;
  let updateLogic = () => {};

  if (mode === 'flight' || mode === 'flight-pro') {
    scene.background = new THREE.Color(0x0ea5e9);
    scene.fog = new THREE.FogExp2(0x38bdf8, 0.008);
    const plane = createAirplaneModel(mode === 'flight-pro' ? 0xf43f5e : 0x38bdf8);
    plane.position.set(0, 12, 0);
    scene.add(plane);
    playerObj = plane;

    // Ground & Clouds
    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 500, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 })
    );
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -4;
    scene.add(terrain);

    const rings = [];
    const ringGeo = new THREE.TorusGeometry(3.4, 0.3, 10, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 1.2 });
    for (let i = 0; i < 10; i++) {
      const r = new THREE.Mesh(ringGeo, ringMat);
      r.position.set((Math.random() - 0.5) * 24, 8 + Math.random() * 14, -30 - i * 26);
      scene.add(r);
      rings.push(r);
    }

    let zPos = 0;
    const baseSpeed = mode === 'flight-pro' ? 32 : 22;
    updateLogic = (dt) => {
      const boost = keys.action ? 1.6 : 1.0;
      zPos -= baseSpeed * boost * dt;
      if (keys.left) plane.position.x -= 16 * dt;
      if (keys.right) plane.position.x += 16 * dt;
      if (keys.up) plane.position.y += 12 * dt;
      if (keys.down) plane.position.y -= 12 * dt;
      plane.position.x = THREE.MathUtils.clamp(plane.position.x, -20, 20);
      plane.position.y = THREE.MathUtils.clamp(plane.position.y, 2, 28);
      plane.position.z = zPos;
      terrain.position.z = zPos;

      plane.rotation.z = THREE.MathUtils.damp(plane.rotation.z, ((keys.left ? 1 : 0) - (keys.right ? 1 : 0)) * 0.55, 8, dt);
      plane.rotation.x = THREE.MathUtils.damp(plane.rotation.x, ((keys.up ? 1 : 0) - (keys.down ? 1 : 0)) * 0.35, 8, dt);

      for (const r of rings) {
        r.rotation.z += dt * 1.5;
        if (plane.position.distanceTo(r.position) < 4.2) {
          count += 1;
          score += 50;
          soundEngine.playCoin();
          r.position.z = zPos - 240 - Math.random() * 40;
          r.position.x = (Math.random() - 0.5) * 26;
          r.position.y = 6 + Math.random() * 16;
        } else if (r.position.z > zPos + 12) {
          r.position.z = zPos - 240;
          r.position.x = (Math.random() - 0.5) * 26;
        }
      }

      camera.position.set(plane.position.x * 0.65, plane.position.y + 3.2, zPos + 11);
      camera.lookAt(plane.position.x, plane.position.y, zPos - 14);
      hudStatus.textContent = keys.action ? 'TURBO!' : 'Parvoz';
    };
  } else if (mode === 'space' || mode === 'space-pro') {
    scene.background = new THREE.Color(0x040312);
    scene.fog = new THREE.FogExp2(0x040312, 0.008);
    const ship = createSpaceshipModel(mode === 'space-pro' ? 0x00e5ff : 0x8b5cf6);
    scene.add(ship);
    playerObj = ship;

    // Starfield
    const starGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for (let i = 0; i < 400; i++) {
      starVerts.push((Math.random() - 0.5) * 160, (Math.random() - 0.5) * 120, -Math.random() * 200);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.45 })));

    const crystals = [];
    const meteors = [];
    const lasers = [];
    for (let i = 0; i < 12; i++) {
      const cr = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.95),
        new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.5 })
      );
      cr.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 12, -25 - i * 18);
      scene.add(cr);
      crystals.push(cr);

      const mt = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.4),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 })
      );
      mt.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 12, -35 - i * 21);
      scene.add(mt);
      meteors.push(mt);
    }

    let shootCooldown = 0;
    const speed = mode === 'space-pro' ? 32 : 22;
    updateLogic = (dt) => {
      if (keys.left) ship.position.x -= 18 * dt;
      if (keys.right) ship.position.x += 18 * dt;
      if (keys.up) ship.position.y += 14 * dt;
      if (keys.down) ship.position.y -= 14 * dt;
      ship.position.x = THREE.MathUtils.clamp(ship.position.x, -16, 16);
      ship.position.y = THREE.MathUtils.clamp(ship.position.y, -9, 9);
      ship.rotation.z = THREE.MathUtils.damp(ship.rotation.z, ((keys.left ? 1 : 0) - (keys.right ? 1 : 0)) * 0.5, 10, dt);

      shootCooldown -= dt;
      if (keys.action && shootCooldown <= 0) {
        shootCooldown = 0.22;
        soundEngine.playLaser();
        const beam = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.18, 2.2),
          new THREE.MeshBasicMaterial({ color: 0xf43f5e })
        );
        beam.position.copy(ship.position).add(new THREE.Vector3(0, 0, -2));
        scene.add(beam);
        lasers.push(beam);
      }

      for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].position.z -= 75 * dt;
        if (lasers[i].position.z < -150) {
          scene.remove(lasers[i]);
          lasers.splice(i, 1);
        }
      }

      for (const cr of crystals) {
        cr.position.z += speed * dt;
        cr.rotation.y += dt * 3;
        if (cr.position.distanceTo(ship.position) < 2.6) {
          count += 1;
          score += 40;
          soundEngine.playCoin();
          cr.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 12, -160);
        } else if (cr.position.z > 10) {
          cr.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 12, -160);
        }
      }

      for (const mt of meteors) {
        mt.position.z += speed * 1.15 * dt;
        mt.rotation.x += dt * 1.6;
        for (let i = lasers.length - 1; i >= 0; i--) {
          if (lasers[i].position.distanceTo(mt.position) < 2.4) {
            score += 30;
            soundEngine.playCollision();
            mt.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 12, -170);
            scene.remove(lasers[i]);
            lasers.splice(i, 1);
            break;
          }
        }
        if (mt.position.distanceTo(ship.position) < 2.2) {
          score = Math.max(0, score - 15);
          soundEngine.playCollision();
          mt.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 12, -170);
        } else if (mt.position.z > 10) {
          mt.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 12, -170);
        }
      }

      camera.position.set(ship.position.x * 0.45, ship.position.y * 0.45 + 2.5, 9.5);
      camera.lookAt(ship.position.x * 0.4, ship.position.y * 0.4, -15);
      hudStatus.textContent = 'Koinot jangi';
    };
  } else if (mode === 'football' || mode === 'football-pro') {
    scene.background = new THREE.Color(0x0b1f3a);
    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 48),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 })
    );
    pitch.rotation.x = -Math.PI / 2;
    scene.add(pitch);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const centerRing = new THREE.Mesh(new THREE.RingGeometry(4.5, 4.75, 32), lineMat);
    centerRing.rotation.x = -Math.PI / 2;
    centerRing.position.y = 0.02;
    scene.add(centerRing);

    // Goalposts
    const goalGroup = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.4, roughness: 0.3 });
    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.6, 12), postMat);
    pL.position.set(-5.2, 1.8, -21);
    const pR = pL.clone();
    pR.position.x = 5.2;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 10.6, 12), postMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 3.6, -21);
    goalGroup.add(pL, pR, bar);
    scene.add(goalGroup);

    // Striker (Player) & AI Goalkeeper
    const striker = createRobotModel(0x00e5ff);
    striker.group.position.set(0, 0, 10);
    scene.add(striker.group);

    const keeper = createRobotModel(0xf43f5e);
    keeper.group.position.set(0, 0, -19.5);
    scene.add(keeper.group);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 18, 18),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })
    );
    ball.position.set(0, 0.55, 6);
    scene.add(ball);

    const ballVel = new THREE.Vector3();
    let keeperPhase = 0;
    const keeperSpeed = mode === 'football-pro' ? 3.4 : 2.1;

    updateLogic = (dt) => {
      let mx = 0;
      let mz = 0;
      if (keys.left) mx -= 1;
      if (keys.right) mx += 1;
      if (keys.up) mz -= 1;
      if (keys.down) mz += 1;

      striker.group.position.x = THREE.MathUtils.clamp(striker.group.position.x + mx * 12 * dt, -14, 14);
      striker.group.position.z = THREE.MathUtils.clamp(striker.group.position.z + mz * 12 * dt, -18, 19);

      // Dribble when close
      const distToBall = striker.group.position.distanceTo(ball.position);
      if (distToBall < 1.8) {
        const push = ball.position.clone().sub(striker.group.position);
        push.y = 0;
        if (push.lengthSq() > 0.001) {
          push.normalize();
          ballVel.x = push.x * 11;
          ballVel.z = push.z * 11;
        }
        if (keys.action) {
          ballVel.z = -30;
          ballVel.x = (ball.position.x - striker.group.position.x) * 8;
          ballVel.y = 5.5;
          soundEngine.playLaser();
        }
      }

      // Ball physics
      ball.position.addScaledVector(ballVel, dt);
      ballVel.x *= Math.pow(0.45, dt);
      ballVel.z *= Math.pow(0.45, dt);
      if (ball.position.y > 0.55 || ballVel.y > 0) {
        ballVel.y -= 16 * dt;
        if (ball.position.y <= 0.55) {
          ball.position.y = 0.55;
          ballVel.y = Math.abs(ballVel.y) * 0.45;
          if (ballVel.y < 0.6) ballVel.y = 0;
        }
      }

      // Keep ball in pitch bounds
      if (Math.abs(ball.position.x) > 15) {
        ball.position.x = Math.sign(ball.position.x) * 15;
        ballVel.x *= -0.7;
      }
      if (ball.position.z > 22) {
        ball.position.z = 22;
        ballVel.z *= -0.7;
      }

      // Keeper patrol & save
      keeperPhase += dt * keeperSpeed;
      keeper.group.position.x = Math.sin(keeperPhase) * 4.2;
      if (keeper.group.position.distanceTo(ball.position) < 1.8 && ballVel.z < 0) {
        ballVel.z *= -0.8;
        ballVel.x = (Math.random() - 0.5) * 12;
        hudStatus.textContent = 'Darvozabon qaytardi!';
        soundEngine.playCollision();
      }

      // Goal detection
      if (ball.position.z < -20.8 && Math.abs(ball.position.x) < 5.0) {
        count += 1;
        score += 100;
        hudStatus.textContent = 'GOOOL!';
        soundEngine.playSuccess();
        ball.position.set(0, 0.55, 6);
        ballVel.set(0, 0, 0);
        striker.group.position.set(0, 0, 10);
      } else if (ball.position.z < -23) {
        ball.position.set(0, 0.55, 6);
        ballVel.set(0, 0, 0);
      }

      camera.position.set(striker.group.position.x * 0.5, 11, striker.group.position.z + 15);
      camera.lookAt(ball.position.x, 1, ball.position.z - 6);
    };
  } else if (mode === 'maze') {
    scene.background = new THREE.Color(0x0b081a);
    scene.fog = new THREE.FogExp2(0x0b081a, 0.045);

    const MAP = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 2, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1],
      [1, 2, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 3, 0, 0, 0, 0, 2, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    const CELL = 4;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.5, metalness: 0.25 });
    const gems = [];
    let exitPortal = null;

    MAP.forEach((row, r) => {
      row.forEach((cell, c) => {
        const wx = c * CELL;
        const wz = r * CELL;
        if (cell === 1) {
          const wall = new THREE.Mesh(new THREE.BoxGeometry(CELL, 3.6, CELL), wallMat);
          wall.position.set(wx, 1.8, wz);
          scene.add(wall);
        } else if (cell === 2) {
          const gem = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.65),
            new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.5 })
          );
          gem.position.set(wx, 1.4, wz);
          scene.add(gem);
          gems.push(gem);
        } else if (cell === 3) {
          exitPortal = new THREE.Mesh(
            new THREE.TorusGeometry(1.1, 0.2, 10, 24),
            new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.6 })
          );
          exitPortal.position.set(wx, 1.5, wz);
          scene.add(exitPortal);
        }
      });
    });

    const playerPos = new THREE.Vector3(1 * CELL, 1.6, 1 * CELL);
    let yaw = Math.PI;

    const isWallAt = (x, z) => {
      const c = Math.round(x / CELL);
      const r = Math.round(z / CELL);
      if (r < 0 || r >= MAP.length || c < 0 || c >= MAP[0].length) return true;
      return MAP[r][c] === 1;
    };

    updateLogic = (dt) => {
      if (keys.left) yaw += 2.3 * dt;
      if (keys.right) yaw -= 2.3 * dt;
      const move = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
      if (move !== 0) {
        const nx = playerPos.x - Math.sin(yaw) * move * 7.5 * dt;
        const nz = playerPos.z - Math.cos(yaw) * move * 7.5 * dt;
        if (!isWallAt(nx, playerPos.z)) playerPos.x = nx;
        if (!isWallAt(playerPos.x, nz)) playerPos.z = nz;
      }

      for (const g of gems) {
        if (g.visible) {
          g.rotation.y += dt * 2.5;
          if (playerPos.distanceTo(g.position) < 1.8) {
            g.visible = false;
            count += 1;
            score += 100;
            soundEngine.playCoin();
          }
        }
      }

      if (exitPortal) {
        exitPortal.rotation.y += dt * 2;
        if (playerPos.distanceTo(exitPortal.position) < 2.0) {
          score += 250;
          finishWorldGame();
        }
      }

      camera.position.copy(playerPos);
      camera.rotation.set(0, yaw, 0);
      hudStatus.textContent = 'Chiqishni toping';
    };
  } else {
    // Dino / Robot / Ocean 3D Arena Collect & Dodge
    const isOcean = mode === 'ocean';
    const isRobot = mode === 'robot';
    scene.background = new THREE.Color(isOcean ? 0x062c4d : isRobot ? 0x090f24 : 0x67b779);
    scene.fog = new THREE.FogExp2(scene.background, 0.014);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshStandardMaterial({
        color: isOcean ? 0x0e4d7a : isRobot ? 0x111827 : 0x3f6212,
        roughness: 0.85,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const actor = isOcean
      ? createSubmarineModel(0xfacc15)
      : isRobot
      ? createRobotModel(0x22d3ee)
      : createDinoModel(0x10b981);
    scene.add(actor.group);

    const items = [];
    const hazards = [];
    for (let i = 0; i < 10; i++) {
      const it = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.75),
        new THREE.MeshStandardMaterial({
          color: isOcean ? 0xf8fafc : isRobot ? 0x00e5ff : 0xfacc15,
          emissive: isOcean ? 0x38bdf8 : isRobot ? 0x06b6d4 : 0xeab308,
          emissiveIntensity: 1.1,
        })
      );
      it.position.set((Math.random() - 0.5) * 44, isOcean ? 2 + Math.random() * 5 : 1.1, (Math.random() - 0.5) * 44);
      scene.add(it);
      items.push(it);
    }

    for (let i = 0; i < 5; i++) {
      const hz = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0x9f1239, emissiveIntensity: 0.8 })
      );
      hz.position.set((Math.random() - 0.5) * 40, isOcean ? 3 : 1.1, (Math.random() - 0.5) * 40);
      scene.add(hz);
      hazards.push({ mesh: hz, vx: (Math.random() - 0.5) * 8, vz: (Math.random() - 0.5) * 8 });
    }

    let velY = 0;
    let actorY = isOcean ? 3 : 0;

    updateLogic = (dt) => {
      const speed = keys.action && isRobot ? 22 : 14;
      let mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      let mz = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);

      if (mx !== 0 || mz !== 0) {
        const len = Math.hypot(mx, mz);
        mx /= len;
        mz /= len;
        actor.group.position.x = THREE.MathUtils.clamp(actor.group.position.x + mx * speed * dt, -26, 26);
        actor.group.position.z = THREE.MathUtils.clamp(actor.group.position.z + mz * speed * dt, -26, 26);
        actor.group.rotation.y = Math.atan2(-mx, -mz);
      }

      if (isOcean) {
        if (keys.action) actorY += 9 * dt;
        else actorY = THREE.MathUtils.damp(actorY, 3, 2, dt);
        actorY = THREE.MathUtils.clamp(actorY, 1.2, 9);
        if (actor.prop) actor.prop.rotation.z += dt * 12;
      } else {
        if (keys.action && actorY <= 0.05) {
          velY = 10.5;
          soundEngine.playClick();
        }
        velY -= 24 * dt;
        actorY = Math.max(0, actorY + velY * dt);
        if (actorY === 0) velY = 0;
      }
      actor.group.position.y = actorY;

      for (const it of items) {
        it.rotation.y += dt * 2.5;
        if (actor.group.position.distanceTo(it.position) < 2.2) {
          count += 1;
          score += 45;
          soundEngine.playCoin();
          it.position.set((Math.random() - 0.5) * 44, isOcean ? 2 + Math.random() * 5 : 1.1, (Math.random() - 0.5) * 44);
        }
      }

      for (const h of hazards) {
        h.mesh.position.x += h.vx * dt;
        h.mesh.position.z += h.vz * dt;
        if (Math.abs(h.mesh.position.x) > 25) h.vx *= -1;
        if (Math.abs(h.mesh.position.z) > 25) h.vz *= -1;
        if (actor.group.position.distanceTo(h.mesh.position) < 2.1) {
          score = Math.max(0, score - 10);
          soundEngine.playCollision();
          h.mesh.position.set((Math.random() - 0.5) * 40, h.mesh.position.y, (Math.random() - 0.5) * 40);
        }
      }

      camera.position.set(actor.group.position.x * 0.7, actor.group.position.y + 9, actor.group.position.z + 15);
      camera.lookAt(actor.group.position.x, actor.group.position.y + 1, actor.group.position.z);
    };
  }

  const onResize = () => {
    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  let frameId = 0;
  let disposed = false;

  function finishWorldGame() {
    if (finished) return;
    finished = true;
    soundEngine.playSuccess();
    onScoreUpdate?.(score);
    onFinish?.(score);

    const overlay = document.createElement('div');
    overlay.className = 'race-overlay-panel';
    overlay.innerHTML = `
      <div class="race-card" style="text-align:center;">
        <h3 class="race-card-title">Barakalla! O‘yin yakunlandi</h3>
        <p class="race-card-sub">${game.title}</p>
        <div class="profile-summary-grid" style="margin-bottom:20px;">
          <div class="stat-tile">
            <div class="stat-tile-label">${labelsByMode.obj}</div>
            <div class="stat-tile-value">${count}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Jami ball</div>
            <div class="stat-tile-value">${score}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Natija</div>
            <div class="stat-tile-value">A'lo</div>
          </div>
        </div>
        <button type="button" id="w-play-again" class="btn-primary">Yana o‘ynash</button>
      </div>
    `;
    container.appendChild(overlay);
    overlay.querySelector('#w-play-again').addEventListener('click', () => {
      cleanup();
      launchWorld3DGame({ container, game, settings, onFinish, onScoreUpdate });
    });
  }

  function afterDraw(cb) {
    const gl = renderer.getContext();
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function tick() {
    if (disposed) return;
    const dt = Math.min(0.05, clock.getDelta());
    if (!finished) {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        finishWorldGame();
      } else {
        updateLogic(dt);
      }
      hudCount.textContent = String(count);
      hudScore.textContent = String(score);
      hudTime.textContent = `${Math.ceil(timeLeft)}s`;
    }

    renderer.render(scene, camera);
    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);
  }

  tick();

  function cleanup() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    clearTimeout(frameId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);
    if (!finished && score > 0) {
      onScoreUpdate?.(score);
    }
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  return cleanup;
}
