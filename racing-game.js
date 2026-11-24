import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createVehicleModel } from './assets/models.js';
import {
  createAsphaltTexture,
  createBuildingTexture,
  createCheckerTexture,
  createContactShadowTexture,
  createTerrainTexture,
} from './assets/textures.js';
import { soundEngine } from './assets/audio.js';

const VEHICLE_PRESETS = [
  { id: 'sport', name: 'Neon GT Kupe', speedStat: '265 km/s', handling: 1.0, maxSpeed: 68, accel: 34, grip: 0.92 },
  { id: 'formula', name: 'Formula F1 Bolid', speedStat: '330 km/s', handling: 1.25, maxSpeed: 86, accel: 45, grip: 0.96 },
  { id: 'drift', name: 'Drift Pro Kupe', speedStat: '250 km/s', handling: 1.15, maxSpeed: 66, accel: 36, grip: 0.84 },
  { id: 'moto', name: 'Superbike R1', speedStat: '300 km/s', handling: 1.2, maxSpeed: 78, accel: 42, grip: 0.9 },
  { id: 'offroad', name: '4x4 Yo‘ltanlamas', speedStat: '220 km/s', handling: 0.95, maxSpeed: 58, accel: 30, grip: 0.89 },
  { id: 'taxi', name: 'Shahar Taksisi', speedStat: '240 km/s', handling: 1.02, maxSpeed: 62, accel: 32, grip: 0.91 },
  { id: 'truck', name: 'Og‘ir Yuk Mashinasi', speedStat: '185 km/s', handling: 0.78, maxSpeed: 50, accel: 22, grip: 0.88 },
  { id: 'hyper', name: 'Hyperion X Giperkar', speedStat: '350 km/s', handling: 1.18, maxSpeed: 90, accel: 48, grip: 0.94 },
];

const PAINT_COLORS = [
  { name: 'Neon Moviy', hex: 0x00e5ff },
  { name: 'Poyga Qizil', hex: 0xef4444 },
  { name: 'Binafsha', hex: 0x8b5cf6 },
  { name: 'Oltin Sariq', hex: 0xfacc15 },
  { name: 'Zumrad', hex: 0x10b981 },
  { name: 'Oq Marvarid', hex: 0xf8fafc },
];

const ENV_LABELS = {
  city: 'Tungi Megapolis',
  desert: 'Sahro Kanyoni',
  forest: 'Yashil O‘rmon Trassasi',
  formula: 'Formula Gran-Pri Arenasi',
};

function detectSoftwareWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function launchRacingGame({ container, game, settings, onFinish, onScoreUpdate }) {
  const cfg = game.config || {};
  let selectedVehicleId = cfg.vehicleType || 'sport';
  let selectedColorHex = selectedVehicleId === 'taxi' ? 0xfacc15 : 0x00e5ff;
  let selectedEnv = cfg.env || 'city';
  let cleanupEngine = null;
  let destroyed = false;

  // Render Pre-Race Garage & Vehicle Selection
  function showGarage() {
    if (cleanupEngine) {
      cleanupEngine();
      cleanupEngine = null;
    }

    container.innerHTML = `
      <div class="race-overlay-panel">
        <div class="race-card">
          <h3 class="race-card-title">${game.title}</h3>
          <p class="race-card-sub">
            Avtomobil, rang va trassa muhitini tanlang. Keyin start chizig‘ida poygani boshlang!
          </p>

          <p style="font-size:0.84rem;font-weight:700;margin-bottom:8px;color:var(--text-secondary);">Transport vositasini tanlang:</p>
          <div class="vehicle-options" id="garage-vehicle-list">
            ${VEHICLE_PRESETS.map((v) => `
              <button type="button" class="vehicle-opt ${v.id === selectedVehicleId ? 'selected' : ''}" data-vid="${v.id}">
                <span class="vehicle-opt-name">${v.name}</span>
                <span class="vehicle-opt-stats">Maks: ${v.speedStat}</span>
              </button>
            `).join('')}
          </div>

          <p style="font-size:0.84rem;font-weight:700;margin-bottom:8px;color:var(--text-secondary);">Kuzov rangi:</p>
          <div class="color-swatches" id="garage-color-list">
            ${PAINT_COLORS.map((c) => `
              <button
                type="button"
                class="swatch-btn ${c.hex === selectedColorHex ? 'selected' : ''}"
                data-hex="${c.hex}"
                title="${c.name}"
                aria-label="${c.name}"
                style="background:#${c.hex.toString(16).padStart(6, '0')};"
              ></button>
            `).join('')}
          </div>

          <p style="font-size:0.84rem;font-weight:700;margin-bottom:8px;color:var(--text-secondary);">Poyga muhiti:</p>
          <div class="segmented-bar" id="garage-env-list" style="margin-bottom:22px;">
            ${Object.entries(ENV_LABELS).map(([key, label]) => `
              <button type="button" class="seg-btn ${key === selectedEnv ? 'active' : ''}" data-env="${key}">${label}</button>
            `).join('')}
          </div>

          <div style="display:flex;justify-content:flex-end;gap:12px;">
            <button type="button" id="start-race-btn" class="btn-primary btn-lg">Poygani boshlash</button>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('#garage-vehicle-list .vehicle-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedVehicleId = btn.dataset.vid;
        soundEngine.playClick();
        container.querySelectorAll('#garage-vehicle-list .vehicle-opt').forEach((b) =>
          b.classList.toggle('selected', b.dataset.vid === selectedVehicleId)
        );
      });
    });

    container.querySelectorAll('#garage-color-list .swatch-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedColorHex = Number(btn.dataset.hex);
        soundEngine.playClick();
        container.querySelectorAll('#garage-color-list .swatch-btn').forEach((b) =>
          b.classList.toggle('selected', Number(b.dataset.hex) === selectedColorHex)
        );
      });
    });

    container.querySelectorAll('#garage-env-list .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedEnv = btn.dataset.env;
        soundEngine.playClick();
        container.querySelectorAll('#garage-env-list .seg-btn').forEach((b) =>
          b.classList.toggle('active', b.dataset.env === selectedEnv)
        );
      });
    });

    container.querySelector('#start-race-btn').addEventListener('click', () => {
      soundEngine.playClick();
      start3DRace();
    });
  }

  function start3DRace() {
    if (destroyed) return;
    const preset = VEHICLE_PRESETS.find((v) => v.id === selectedVehicleId) || VEHICLE_PRESETS[0];
    const totalLaps = cfg.laps || 3;
    const raceMode = cfg.mode || 'race';
    const isEndless = totalLaps >= 50;

    const showTouch =
      settings.showTouchControls === 'always' ||
      (settings.showTouchControls !== 'off' &&
        ('ontouchstart' in window || window.innerWidth <= 920));

    container.innerHTML = `
      <div id="race-canvas-mount" style="width:100%;height:100%;position:relative;"></div>
      <div class="hud-layer">
        <div class="hud-top-row">
          <div class="hud-panel">
            <div class="hud-stat-grid">
              <div>
                <span class="hud-stat-label">${isEndless ? 'Ball' : 'Aylana'}</span>
                <span class="hud-stat-value" id="hud-lap">${isEndless ? '0' : `1 / ${totalLaps}`}</span>
              </div>
              <div>
                <span class="hud-stat-label">Vaqt</span>
                <span class="hud-stat-value" id="hud-time">00:00.0</span>
              </div>
              <div>
                <span class="hud-stat-label">${raceMode === 'taxi' ? 'Mijozlar' : raceMode === 'drift' ? 'Drift ball' : 'O‘rin / Ochko'}</span>
                <span class="hud-stat-value" id="hud-score">0</span>
              </div>
            </div>
          </div>

          <div class="hud-panel speedometer-box">
            <div>
              <span class="speed-num" id="hud-speed">0</span>
              <span class="speed-unit">km/s</span>
            </div>
            <div style="font-size:0.74rem;color:var(--text-muted);" id="hud-cam-label">Kamera: Tashqi (C)</div>
            <div class="rpm-bar"><div class="rpm-fill" id="hud-rpm"></div></div>
          </div>
        </div>

        <div id="race-countdown" class="countdown-banner">3</div>

        <div class="touch-controls ${showTouch ? '' : 'hidden'}" id="race-touch-controls">
          <div class="touch-cluster">
            <button type="button" class="touch-btn" data-key="left">&larr; Chap</button>
            <button type="button" class="touch-btn" data-key="right">O‘ng &rarr;</button>
          </div>
          <div class="touch-cluster">
            <button type="button" class="touch-btn" id="touch-cam-btn">Kamera</button>
            <button type="button" class="touch-btn" data-key="handbrake">Drift</button>
            <button type="button" class="touch-btn touch-btn-brake" data-key="down">Tormoz</button>
            <button type="button" class="touch-btn touch-btn-gas" data-key="up">Gaz</button>
          </div>
        </div>
      </div>
    `;

    const mount = container.querySelector('#race-canvas-mount');
    const hudLap = container.querySelector('#hud-lap');
    const hudTime = container.querySelector('#hud-time');
    const hudScore = container.querySelector('#hud-score');
    const hudSpeed = container.querySelector('#hud-speed');
    const hudRpm = container.querySelector('#hud-rpm');
    const hudCamLabel = container.querySelector('#hud-cam-label');
    const countdownEl = container.querySelector('#race-countdown');

    const isSoftwareGl = detectSoftwareWebGL();
    const highQuality = settings.graphics === 'high' && !isSoftwareGl;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth || 960, mount.clientHeight || 540);
    renderer.shadowMap.enabled = highQuality;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envColors = {
      city: { sky: 0x090e1f, fog: 0x090e1f, sun: 0xe0f2fe, hemiSky: 0x38bdf8, hemiGround: 0x111827 },
      desert: { sky: 0xd97736, fog: 0xc86b32, sun: 0xfff3d6, hemiSky: 0xfdba74, hemiGround: 0x78350f },
      forest: { sky: 0x7ec8e3, fog: 0x7ec8e3, sun: 0xfffbe6, hemiSky: 0xbae6fd, hemiGround: 0x1b4332 },
      formula: { sky: 0x111827, fog: 0x111827, sun: 0xffffff, hemiSky: 0x93c5fd, hemiGround: 0x1e293b },
    }[selectedEnv];

    scene.background = new THREE.Color(envColors.sky);
    scene.fog = new THREE.FogExp2(envColors.fog, selectedEnv === 'city' ? 0.0042 : 0.0032);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3-Point / Outdoor Lighting
    const hemi = new THREE.HemisphereLight(envColors.hemiSky, envColors.hemiGround, 0.72);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(envColors.sun, 1.45);
    sun.position.set(80, 120, 60);
    sun.castShadow = highQuality;
    if (highQuality) {
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -90;
      sun.shadow.camera.right = 90;
      sun.shadow.camera.top = 90;
      sun.shadow.camera.bottom = -90;
      sun.shadow.bias = -0.0005;
    }
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(
      68,
      (mount.clientWidth || 960) / (mount.clientHeight || 540),
      0.2,
      550
    );

    // Closed Spline Track Geometry
    const trackPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -110),
      new THREE.Vector3(65, 0, -185),
      new THREE.Vector3(165, 0, -175),
      new THREE.Vector3(215, 0, -90),
      new THREE.Vector3(175, 0, 15),
      new THREE.Vector3(220, 0, 115),
      new THREE.Vector3(145, 0, 185),
      new THREE.Vector3(45, 0, 145),
      new THREE.Vector3(-10, 0, 95),
    ];
    const trackCurve = new THREE.CatmullRomCurve3(trackPoints, true, 'catmullrom', 0.45);
    const TRACK_WIDTH = 16;
    const HALF_TRACK = TRACK_WIDTH * 0.5;
    const SEGMENTS = 320;

    const roadTex = createAsphaltTexture(renderer, selectedEnv);
    const terrainTex = createTerrainTexture(renderer, selectedEnv);

    // Ground Terrain
    const groundGeo = new THREE.PlaneGeometry(1400, 1400);
    const groundMat = new THREE.MeshStandardMaterial({
      map: terrainTex,
      roughness: 0.92,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.04;
    ground.receiveShadow = true;
    scene.add(ground);

    // Build Ribbon Road Mesh & Barrier Walls
    const roadPositions = [];
    const roadUvs = [];
    const roadIndices = [];
    const sampleCount = SEGMENTS;

    const sampledFrames = [];
    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const pt = trackCurve.getPointAt(t % 1);
      const tan = trackCurve.getTangentAt(t % 1).normalize();
      const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      sampledFrames.push({ t, pt, tan, right });

      const leftPt = pt.clone().addScaledVector(right, -HALF_TRACK);
      const rightPt = pt.clone().addScaledVector(right, HALF_TRACK);
      roadPositions.push(leftPt.x, 0.02, leftPt.z, rightPt.x, 0.02, rightPt.z);
      roadUvs.push(0, t * 24, 1, t * 24);

      if (i < sampleCount) {
        const base = i * 2;
        roadIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.72,
      metalness: 0.12,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Trackside Barrier Posts (InstancedMesh for crisp performance)
    const postGeo = new THREE.BoxGeometry(0.45, 0.9, 1.8);
    const postMat = new THREE.MeshStandardMaterial({
      color: selectedEnv === 'city' ? 0x00e5ff : 0xf97316,
      emissive: selectedEnv === 'city' ? 0x005f73 : 0x431407,
      roughness: 0.4,
      metalness: 0.4,
    });
    const postCount = 160;
    const postsMesh = new THREE.InstancedMesh(postGeo, postMat, postCount * 2);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < postCount; i++) {
      const f = sampledFrames[Math.floor((i / postCount) * sampleCount)];
      const angle = Math.atan2(f.tan.x, f.tan.z);
      [-1, 1].forEach((side, sIdx) => {
        const p = f.pt.clone().addScaledVector(f.right, side * (HALF_TRACK + 0.7));
        dummy.position.set(p.x, 0.45, p.z);
        dummy.rotation.set(0, angle, 0);
        dummy.updateMatrix();
        postsMesh.setMatrixAt(i * 2 + sIdx, dummy.matrix);
      });
    }
    postsMesh.computeBoundingSphere();
    scene.add(postsMesh);

    // Start / Finish Checkered Gantry
    const startFrame = sampledFrames[0];
    const startAngle = Math.atan2(startFrame.tan.x, startFrame.tan.z);
    const gantry = new THREE.Group();
    gantry.position.copy(startFrame.pt);
    gantry.rotation.y = startAngle;

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.35 });
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6.2, 0.9), pillarMat);
    pillarL.position.set(-HALF_TRACK - 0.5, 3.1, 0);
    gantry.add(pillarL);
    const pillarR = pillarL.clone();
    pillarR.position.x = HALF_TRACK + 0.5;
    gantry.add(pillarR);

    const bannerMat = new THREE.MeshStandardMaterial({ map: createCheckerTexture(renderer), roughness: 0.4 });
    const banner = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH + 2, 1.5, 0.6), bannerMat);
    banner.position.set(0, 5.8, 0);
    gantry.add(banner);
    scene.add(gantry);

    // Environment Props (Skyscrapers / Trees / Rocks / Grandstands)
    const propGroup = new THREE.Group();
    const buildingTex = createBuildingTexture(renderer);
    const propCount = 56;
    for (let i = 0; i < propCount; i++) {
      const f = sampledFrames[Math.floor((i / propCount) * sampleCount)];
      const side = i % 2 === 0 ? 1 : -1;
      const dist = HALF_TRACK + 12 + (i % 4) * 7;
      const pos = f.pt.clone().addScaledVector(f.right, side * dist);

      if (selectedEnv === 'city' || selectedEnv === 'formula') {
        const h = selectedEnv === 'city' ? 14 + (i % 5) * 8 : 6 + (i % 3) * 2;
        const w = selectedEnv === 'city' ? 9 + (i % 3) * 3 : 12;
        const bldg = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, w),
          new THREE.MeshStandardMaterial({
            map: selectedEnv === 'city' ? buildingTex : null,
            color: selectedEnv === 'city' ? 0xffffff : 0x334155,
            roughness: 0.6,
          })
        );
        bldg.position.set(pos.x, h / 2, pos.z);
        propGroup.add(bldg);
      } else if (selectedEnv === 'forest') {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.6, 3.2, 7),
          new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 })
        );
        trunk.position.y = 1.6;
        const crown = new THREE.Mesh(
          new THREE.ConeGeometry(2.6, 6.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 })
        );
        crown.position.y = 5.4;
        tree.add(trunk, crown);
        tree.position.set(pos.x, 0, pos.z);
        propGroup.add(tree);
      } else {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(3.2 + (i % 3) * 1.4, 0),
          new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.92 })
        );
        rock.position.set(pos.x, 1.5, pos.z);
        rock.scale.y = 1.4;
        propGroup.add(rock);
      }
    }
    scene.add(propGroup);

    // Collectible Coins / Nitro / Checkpoints / Taxi Zones
    const collectibles = [];
    const coinGeo = new THREE.TorusGeometry(0.65, 0.18, 10, 18);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.9,
      metalness: 0.8,
      roughness: 0.2,
    });
    for (let i = 1; i <= 18; i++) {
      const t = (i / 19) % 1;
      const pt = trackCurve.getPointAt(t);
      const tan = trackCurve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const offset = ((i % 3) - 1) * 3.8;
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.copy(pt).addScaledVector(right, offset);
      coin.position.y = 1.1;
      scene.add(coin);
      collectibles.push({ mesh: coin, active: true, respawn: 0 });
    }

    // Taxi mode pickup/dropoff beacon
    let taxiPhase = 'pickup'; // 'pickup' | 'dropoff'
    let taxiTargetT = 0.28;
    let taxiPassengers = 0;
    const taxiBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 0.35, 24),
      new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x00e5ff,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.65,
      })
    );
    if (raceMode === 'taxi') {
      const tp = trackCurve.getPointAt(taxiTargetT);
      taxiBeacon.position.set(tp.x, 0.2, tp.z);
      scene.add(taxiBeacon);
    }

    // Player Vehicle
    const playerModel = createVehicleModel(preset.id, selectedColorHex);
    const playerGroup = playerModel.group;
    playerGroup.position.copy(startFrame.pt);
    // Vehicle forward faces -Z in local space; align local -Z with track tangent
    const startYaw = Math.atan2(-startFrame.tan.x, -startFrame.tan.z);
    playerGroup.rotation.y = startYaw;

    // Contact Shadow under Player Vehicle
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 5.2),
      new THREE.MeshBasicMaterial({
        map: createContactShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.65,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.04;
    playerGroup.add(shadowPlane);
    scene.add(playerGroup);

    // AI Opponent / Traffic Vehicles
    const aiCount = cfg.aiCount ?? 2;
    const aiCars = [];
    const aiPalette = [0xf43f5e, 0x8b5cf6, 0x10b981, 0xf97316, 0x38bdf8, 0xeab308];
    for (let i = 0; i < aiCount; i++) {
      const aiType = raceMode === 'traffic' ? (i % 2 === 0 ? 'sport' : 'truck') : preset.id;
      const aiModel = createVehicleModel(aiType, aiPalette[i % aiPalette.length]);
      const aiObj = {
        group: aiModel.group,
        wheels: aiModel.wheels,
        t: (0.03 + i * (raceMode === 'traffic' ? 0.14 : 0.015)) % 1,
        laneOffset: ((i % 3) - 1) * 3.6,
        speed: raceMode === 'traffic' ? 24 + (i % 3) * 5 : preset.maxSpeed * (0.72 + (i % 3) * 0.06),
      };
      scene.add(aiObj.group);
      aiCars.push(aiObj);
    }

    // Input State
    const keys = { up: false, down: false, left: false, right: false, handbrake: false };
    let cameraMode = 0; // 0 = third person, 1 = first person cockpit

    const onKeyDown = (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keys.up = true;
      if (code === 'KeyS' || code === 'ArrowDown') keys.down = true;
      if (code === 'KeyA' || code === 'ArrowLeft') keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') keys.right = true;
      if (code === 'Space') {
        keys.handbrake = true;
        e.preventDefault();
      }
      if (code === 'KeyC') {
        cameraMode = cameraMode === 0 ? 1 : 0;
        hudCamLabel.textContent = cameraMode === 0 ? 'Kamera: Tashqi (C)' : 'Kamera: Kabina (C)';
        soundEngine.playClick();
      }
    };

    const onKeyUp = (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keys.up = false;
      if (code === 'KeyS' || code === 'ArrowDown') keys.down = false;
      if (code === 'KeyA' || code === 'ArrowLeft') keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') keys.right = false;
      if (code === 'Space') keys.handbrake = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Touch controls binding
    container.querySelectorAll('.touch-btn[data-key]').forEach((btn) => {
      const k = btn.dataset.key;
      const press = (ev) => {
        ev.preventDefault();
        keys[k] = true;
        btn.classList.add('pressed');
      };
      const release = (ev) => {
        ev.preventDefault();
        keys[k] = false;
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('pointerleave', release);
    });

    const touchCamBtn = container.querySelector('#touch-cam-btn');
    if (touchCamBtn) {
      touchCamBtn.addEventListener('click', () => {
        cameraMode = cameraMode === 0 ? 1 : 0;
        hudCamLabel.textContent = cameraMode === 0 ? 'Kamera: Tashqi (C)' : 'Kamera: Kabina (C)';
        soundEngine.playClick();
      });
    }

    // Physics & Race State
    let speed = 0;
    let yaw = startYaw;
    let driftAngle = 0;
    let steerAngle = 0;
    let raceElapsed = 0;
    let currentLap = 1;
    let lastT = 0;
    let passedHalfway = false;
    let score = 0;
    let driftPoints = 0;
    let finished = false;
    let countdownRemaining = 3.2;
    let lastBeepSecond = 4;
    let raceStarted = false;

    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    const _forward = new THREE.Vector3();
    const _carPos = new THREE.Vector3();
    const _aiPos = new THREE.Vector3();

    // Helper: Find nearest point along track spline
    function findNearestTrackSample(pos) {
      let bestIdx = 0;
      let bestDistSq = Infinity;
      for (let i = 0; i < sampleCount; i++) {
        const p = sampledFrames[i].pt;
        const dx = pos.x - p.x;
        const dz = pos.z - p.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestIdx = i;
        }
      }
      return { frame: sampledFrames[bestIdx], dist: Math.sqrt(bestDistSq) };
    }

    const onResize = () => {
      if (!mount || destroyed) return;
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    soundEngine.startEngine();
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      const d = Math.floor((sec % 1) * 10);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${d}`;
    }

    function finishRace() {
      if (finished) return;
      finished = true;
      soundEngine.stopEngine();
      soundEngine.playSuccess();

      const timeBonus = Math.max(0, Math.round(450 - raceElapsed * 3));
      const finalScore = Math.max(120, Math.round(score + driftPoints + timeBonus));
      onScoreUpdate?.(finalScore);
      onFinish?.(finalScore);

      const finishOverlay = document.createElement('div');
      finishOverlay.className = 'race-overlay-panel';
      finishOverlay.innerHTML = `
        <div class="race-card" style="text-align:center;">
          <h3 class="race-card-title">Finish! Ajoyib natija!</h3>
          <p class="race-card-sub">${game.title} yakunlandi</p>
          <div class="profile-summary-grid" style="margin-bottom:20px;">
            <div class="stat-tile">
              <div class="stat-tile-label">Vaqt</div>
              <div class="stat-tile-value">${formatTime(raceElapsed)}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Yakuniy ball</div>
              <div class="stat-tile-value">${finalScore}</div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile-label">Aylanalar</div>
              <div class="stat-tile-value">${totalLaps}/${totalLaps}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
            <button type="button" id="race-again-btn" class="btn-primary">Yana o‘ynash</button>
            <button type="button" id="race-garage-btn" class="btn-secondary">Avtomobilni almashtirish</button>
          </div>
        </div>
      `;
      container.appendChild(finishOverlay);
      finishOverlay.querySelector('#race-again-btn').addEventListener('click', () => start3DRace());
      finishOverlay.querySelector('#race-garage-btn').addEventListener('click', () => showGarage());
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
      if (disposed || destroyed) return;
      const dt = Math.min(0.05, clock.getDelta());

      // Starting Countdown
      if (!raceStarted) {
        countdownRemaining -= dt;
        const sec = Math.ceil(countdownRemaining);
        if (sec !== lastBeepSecond && sec >= 1 && sec <= 3) {
          lastBeepSecond = sec;
          countdownEl.textContent = String(sec);
          soundEngine.playCountdown(false);
        }
        if (countdownRemaining <= 0) {
          raceStarted = true;
          countdownEl.textContent = 'OLG‘A!';
          soundEngine.playCountdown(true);
          setTimeout(() => {
            if (countdownEl) countdownEl.classList.add('hidden');
          }, 700);
        }
      } else if (!finished) {
        raceElapsed += dt;
      }

      // Vehicle Physics
      const maxSpd = Math.max(preset.maxSpeed, cfg.maxSpeed || preset.maxSpeed);
      if (raceStarted && !finished) {
        if (keys.up) {
          speed += preset.accel * dt;
        } else if (keys.down) {
          speed -= preset.accel * 1.45 * dt;
        } else {
          speed *= Math.pow(0.45, dt);
        }

        if (keys.handbrake) {
          speed *= Math.pow(0.62, dt);
        }

        speed = THREE.MathUtils.clamp(speed, -maxSpd * 0.35, maxSpd);

        const steerInput = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
        steerAngle = THREE.MathUtils.damp(steerAngle, steerInput * 0.48, 12, dt);

        const speedFactor = THREE.MathUtils.clamp(Math.abs(speed) / 14, 0, 1);
        const dirSign = speed >= -0.5 ? 1 : -1;
        const turnMultiplier = keys.handbrake ? 1.48 : 1.0;
        yaw += steerInput * dirSign * preset.handling * 1.85 * turnMultiplier * speedFactor * dt;

        // Drift physics visual angle & score
        const isDrifting = keys.handbrake && Math.abs(speed) > 18 && Math.abs(steerInput) > 0;
        const targetDrift = isDrifting ? steerInput * 0.36 : 0;
        driftAngle = THREE.MathUtils.damp(driftAngle, targetDrift, 8, dt);

        if (isDrifting) {
          driftPoints += Math.round(dt * 85);
        }

        _forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
        playerGroup.position.addScaledVector(_forward, speed * dt);

        // Motorcycle lean vs Car roll
        if (preset.id === 'moto') {
          playerGroup.rotation.set(0, yaw + driftAngle * 0.3, steerInput * 0.32 * speedFactor);
        } else {
          playerGroup.rotation.set(0, yaw + driftAngle, 0);
        }

        // Rotate Wheels & Front Steering
        for (const w of playerModel.wheels) {
          w.rotation.x -= (speed * dt) / 0.38;
        }
        for (const piv of playerModel.frontWheelPivots) {
          piv.rotation.y = steerAngle;
        }

        // Track Boundary Collision
        const nearest = findNearestTrackSample(playerGroup.position);
        const maxOffset = HALF_TRACK - 1.1;
        if (nearest.dist > maxOffset) {
          const pushDir = nearest.frame.pt.clone().sub(playerGroup.position).normalize();
          playerGroup.position.addScaledVector(pushDir, nearest.dist - maxOffset);
          speed *= 0.65;
          soundEngine.playCollision();
        }

        // Lap & Finish Progression
        const currentT = nearest.frame.t;
        if (currentT > 0.45 && currentT < 0.65) {
          passedHalfway = true;
        }
        if (passedHalfway && lastT > 0.85 && currentT < 0.15) {
          passedHalfway = false;
          if (!isEndless) {
            if (currentLap >= totalLaps) {
              finishRace();
            } else {
              currentLap += 1;
              score += 100;
              soundEngine.playCoin();
            }
          } else {
            score += 150;
            soundEngine.playCoin();
          }
        }
        lastT = currentT;

        // Collectibles
        _carPos.copy(playerGroup.position);
        for (const item of collectibles) {
          if (item.active) {
            item.mesh.rotation.y += dt * 3;
            if (_carPos.distanceToSquared(item.mesh.position) < 6.5) {
              item.active = false;
              item.mesh.visible = false;
              item.respawn = 12;
              score += 25;
              soundEngine.playCoin();
            }
          } else {
            item.respawn -= dt;
            if (item.respawn <= 0) {
              item.active = true;
              item.mesh.visible = true;
            }
          }
        }

        // Taxi Mission Zones
        if (raceMode === 'taxi') {
          taxiBeacon.rotation.y += dt * 2;
          if (_carPos.distanceToSquared(taxiBeacon.position) < 24) {
            if (taxiPhase === 'pickup') {
              taxiPhase = 'dropoff';
              taxiBeacon.material.color.setHex(0xfacc15);
              taxiBeacon.material.emissive.setHex(0xfacc15);
            } else {
              taxiPhase = 'pickup';
              taxiPassengers += 1;
              score += 120;
              taxiBeacon.material.color.setHex(0x00e5ff);
              taxiBeacon.material.emissive.setHex(0x00e5ff);
            }
            soundEngine.playSuccess();
            taxiTargetT = (taxiTargetT + 0.27 + Math.random() * 0.2) % 1;
            const np = trackCurve.getPointAt(taxiTargetT);
            taxiBeacon.position.set(np.x, 0.2, np.z);
          }
        }

        // Engine Audio
        soundEngine.updateEngine(speed / maxSpd, isDrifting);
      } else {
        soundEngine.updateEngine(0, false);
      }

      // AI Cars Update & Collision
      for (const ai of aiCars) {
        if (raceStarted && !finished) {
          ai.t = (ai.t + (ai.speed * dt) / 1150) % 1;
        }
        const pt = trackCurve.getPointAt(ai.t);
        const tan = trackCurve.getTangentAt(ai.t).normalize();
        const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
        _aiPos.copy(pt).addScaledVector(right, ai.laneOffset);
        ai.group.position.copy(_aiPos);
        ai.group.rotation.y = Math.atan2(-tan.x, -tan.z);
        for (const w of ai.wheels) {
          w.rotation.x -= (ai.speed * dt) / 0.38;
        }

        if (raceStarted && !finished && playerGroup.position.distanceToSquared(_aiPos) < 9.5) {
          const push = playerGroup.position.clone().sub(_aiPos).normalize();
          playerGroup.position.addScaledVector(push, 0.65);
          speed *= 0.72;
          soundEngine.playCollision();
        }
      }

      // Dynamic Camera (Third-person Chase vs First-person Cockpit)
      _forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      if (cameraMode === 0) {
        const targetCam = playerGroup.position
          .clone()
          .addScaledVector(_forward, -8.2)
          .add(new THREE.Vector3(0, 3.6, 0));
        if (camPos.lengthSq() === 0) camPos.copy(targetCam);
        camPos.lerp(targetCam, 1 - Math.exp(-8 * dt));
        camera.position.copy(camPos);

        const lookTarget = playerGroup.position
          .clone()
          .addScaledVector(_forward, 9)
          .add(new THREE.Vector3(0, 1.2, 0));
        camLook.lerp(lookTarget, 1 - Math.exp(-10 * dt));
        camera.lookAt(camLook);

        const targetFov = 65 + (Math.abs(speed) / maxSpd) * 18;
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 6, dt);
        camera.updateProjectionMatrix();
      } else {
        const hoodPos = playerGroup.position
          .clone()
          .addScaledVector(_forward, -0.15)
          .add(new THREE.Vector3(0, playerModel.cameraSeatY + 0.15, 0));
        camera.position.copy(hoodPos);
        const lookAhead = playerGroup.position
          .clone()
          .addScaledVector(_forward, 24)
          .add(new THREE.Vector3(0, playerModel.cameraSeatY, 0));
        camera.lookAt(lookAhead);
        camera.fov = THREE.MathUtils.damp(camera.fov, 76, 8, dt);
        camera.updateProjectionMatrix();
      }

      // HUD Updates
      const kmh = Math.round(Math.abs(speed) * 3.8);
      hudSpeed.textContent = String(kmh);
      hudRpm.style.width = `${Math.min(100, Math.round((Math.abs(speed) / maxSpd) * 100))}%`;
      hudTime.textContent = formatTime(raceElapsed);
      hudLap.textContent = isEndless ? String(score + driftPoints) : `${currentLap} / ${totalLaps}`;
      hudScore.textContent =
        raceMode === 'taxi'
          ? `${taxiPassengers} ta`
          : raceMode === 'drift'
          ? String(driftPoints)
          : String(score + driftPoints);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    cleanupEngine = () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      soundEngine.stopEngine();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);

      // Save partial progress on exit if user drove meaningfully
      if (!finished && raceElapsed > 5) {
        const earned = Math.round(score + driftPoints + raceElapsed * 4);
        if (earned > 0) onScoreUpdate?.(earned);
      }

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      roadTex.dispose();
      terrainTex.dispose();
      buildingTex.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
    };
  }

  // Start straight in Garage (with 1 click to enter race)
  showGarage();

  return () => {
    destroyed = true;
    if (cleanupEngine) cleanupEngine();
  };
}
