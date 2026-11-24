import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GAMES_CATALOG } from './games.js';
import { getGameThumbnail } from './assets/thumbnails.js';
import { createVehicleModel } from './assets/models.js';
import { soundEngine } from './assets/audio.js';
import {
  AGE_LABELS,
  loadProgress,
  loadUser,
  markGameStarted,
  recordGameScore,
  renderProfileModal,
  saveUser,
  toggleFavoriteGame,
} from './profile.js';
import { loadSettings, renderSettingsModal, toggleMuteSetting } from './settings.js';
import { launchRacingGame } from './racing-game.js';
import { launchWorld3DGame } from './engines/3d-worlds.js';
import { launchKidsGame } from './engines/kids-educational.js';

// DOM References
const splashEl = document.getElementById('splash-loader');
const onboardingEl = document.getElementById('onboarding-screen');
const ageStepEl = document.getElementById('age-step');
const nameStepEl = document.getElementById('name-step');
const selectedAgeLabel = document.getElementById('selected-age-label');
const backToAgeBtn = document.getElementById('back-to-age-btn');
const regForm = document.getElementById('registration-form');
const nameInput = document.getElementById('player-name-input');
const nameError = document.getElementById('name-error');

const appShell = document.getElementById('app-shell');
const headerPlayerName = document.getElementById('header-player-name');
const welcomeGreeting = document.getElementById('welcome-greeting');
const welcomeMeta = document.getElementById('welcome-meta');

const searchInput = document.getElementById('game-search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const ageFilterBar = document.getElementById('age-filter-bar');
const categoryFilterBar = document.getElementById('category-filter-bar');

const libraryTitle = document.getElementById('library-section-title');
const libraryCount = document.getElementById('library-section-count');
const libraryGrid = document.getElementById('library-grid');
const emptySearchState = document.getElementById('empty-search-state');

const recentSection = document.getElementById('recent-section');
const recentGrid = document.getElementById('recent-grid');
const favoritesSection = document.getElementById('favorites-section');
const favoritesGrid = document.getElementById('favorites-grid');
const popularGrid = document.getElementById('popular-grid');
const recommendedGrid = document.getElementById('recommended-grid');
const newGrid = document.getElementById('new-grid');

const heroTitle = document.getElementById('hero-title');
const heroDesc = document.getElementById('hero-desc');
const heroPlayBtn = document.getElementById('hero-play-btn');
const heroGarageBtn = document.getElementById('hero-garage-btn');
const heroCanvas = document.getElementById('hero-preview-canvas');

const gameModal = document.getElementById('game-modal');
const activeGameTitle = document.getElementById('active-game-title');
const activeGameMeta = document.getElementById('active-game-meta');
const activeControlsHint = document.getElementById('active-game-controls-hint');
const gameStage = document.getElementById('game-stage');
const gameLoading = document.getElementById('game-loading');
const modalFavBtn = document.getElementById('modal-fav-btn');
const modalSoundBtn = document.getElementById('modal-sound-btn');
const modalFullscreenBtn = document.getElementById('modal-fullscreen-btn');
const modalRestartBtn = document.getElementById('modal-restart-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');

const profileModal = document.getElementById('profile-modal');
const profileModalBody = document.getElementById('profile-modal-body');
const settingsModal = document.getElementById('settings-modal');
const settingsModalBody = document.getElementById('settings-modal-body');
const toastContainer = document.getElementById('toast-container');

// State
let pendingAgeGroup = null;
let currentUser = loadUser();
let currentSettings = loadSettings();
let filterAge = currentUser ? currentUser.ageGroup : '6-9';
let filterCategory = 'all';
let searchQuery = '';
let activeGame = null;
let cleanupActiveGame = null;
let heroPaused = false;
let heroCleanup = null;

// Toast Helper
function showToast(title, message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div class="toast-title">${escapeHtml(title)}</div><div>${escapeHtml(message)}</div>`;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 260);
  }, 3400);
}

function notifyNewAchievements(list) {
  if (!list || !list.length) return;
  for (const ach of list) {
    soundEngine.playSuccess();
    showToast(`Yangi yutuq: ${ach.title}`, ach.desc);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Onboarding Flow
function openOnboarding(step = 'age') {
  onboardingEl.classList.remove('hidden');
  appShell.classList.add('hidden');
  if (step === 'age') {
    ageStepEl.classList.remove('hidden');
    nameStepEl.classList.add('hidden');
  } else {
    ageStepEl.classList.add('hidden');
    nameStepEl.classList.remove('hidden');
  }
}

document.querySelectorAll('.age-card').forEach((card) => {
  card.addEventListener('click', () => {
    soundEngine.playClick();
    pendingAgeGroup = card.dataset.age;
    selectedAgeLabel.textContent = `Tanlangan yosh toifasi: ${AGE_LABELS[pendingAgeGroup] || pendingAgeGroup}`;
    ageStepEl.classList.add('hidden');
    nameStepEl.classList.remove('hidden');
    nameError.textContent = '';
    if (currentUser?.name) {
      nameInput.value = currentUser.name;
    }
    nameInput.focus();
  });
});

backToAgeBtn.addEventListener('click', () => {
  soundEngine.playClick();
  nameStepEl.classList.add('hidden');
  ageStepEl.classList.remove('hidden');
});

regForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const rawName = nameInput.value.trim();
  if (rawName.length < 2) {
    nameError.textContent = 'Iltimos, kamida 2 ta harfdan iborat ismingizni kiriting.';
    nameInput.focus();
    return;
  }
  if (!pendingAgeGroup) {
    openOnboarding('age');
    return;
  }

  soundEngine.playSuccess();
  currentUser = saveUser(rawName, pendingAgeGroup);
  filterAge = currentUser.ageGroup;
  filterCategory = 'all';
  onboardingEl.classList.add('hidden');
  enterMainApp();
  showToast(
    `Xush kelibsiz, ${currentUser.name}!`,
    `${AGE_LABELS[currentUser.ageGroup]} kutubxonasi ochildi.`
  );
});

// 3D Hero Showroom Preview
function initHero3DPreview() {
  if (heroCleanup || !heroCanvas) return;
  let isSoftwareGl = false;
  try {
    const probe = document.createElement('canvas').getContext('webgl2');
    const ext = probe?.getExtension('WEBGL_debug_renderer_info');
    const gpu = ext && probe ? String(probe.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    probe?.getExtension('WEBGL_lose_context')?.loseContext();
    isSoftwareGl = !probe || /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    isSoftwareGl = true;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas: heroCanvas,
    antialias: !isSoftwareGl,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(42, 1.5, 0.1, 60);
  camera.position.set(4.5, 2.3, 5.2);
  camera.lookAt(0, 0.7, 0);

  const hemi = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.9);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(5, 8, 5);
  scene.add(key);

  const car = createVehicleModel('sport', 0x00e5ff);
  scene.add(car.group);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(3.1, 3.3, 0.2, 36),
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.7, roughness: 0.3 })
  );
  pedestal.position.y = -0.1;
  scene.add(pedestal);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.2, 0.05, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.02;
  scene.add(ring);

  function resizeHero() {
    const parent = heroCanvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth || 480;
    const h = parent.clientHeight || 280;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resizeHero();
  window.addEventListener('resize', resizeHero);

  let frameId = 0;
  let disposed = false;
  const clock = new THREE.Clock();

  function afterDraw(cb) {
    const gl = renderer.getContext();
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 10);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 120);
      }
    };
    frameId = window.setTimeout(poll, 10);
  }

  function tick() {
    if (disposed) return;
    const dt = Math.min(0.05, clock.getDelta());
    if (!heroPaused && !appShell.classList.contains('hidden')) {
      car.group.rotation.y += dt * 0.55;
      for (const w of car.wheels) w.rotation.x -= dt * 2.2;
      renderer.render(scene, camera);
    }
    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);
  }
  tick();

  heroCleanup = () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    clearTimeout(frameId);
    window.removeEventListener('resize', resizeHero);
    renderer.dispose();
  };
}

// Render Game Card
function createGameCardElement(game, progress) {
  const isFav = progress.favorites.includes(game.id);
  const record = progress.records[game.id] || 0;

  const card = document.createElement('article');
  card.className = 'game-card';
  card.innerHTML = `
    <div class="game-thumb-wrap">
      <img
        src="${getGameThumbnail(game)}"
        alt="${escapeHtml(game.title)}"
        class="game-thumb"
        loading="lazy"
      />
      <button
        type="button"
        class="fav-toggle-btn ${isFav ? 'is-fav' : ''}"
        aria-label="${isFav ? 'Sevimlilardan olish' : 'Sevimlilarga qo‘shish'}"
        title="${isFav ? 'Sevimlilardan olish' : 'Sevimlilarga qo‘shish'}"
      >
        ${isFav ? '♥' : '♡'}
      </button>
    </div>
    <div class="game-card-body">
      <h3 class="game-card-title">${escapeHtml(game.title)}</h3>
      <div class="game-card-meta">
        <span>${escapeHtml(game.category)}</span>
        <span aria-hidden="true">&middot;</span>
        <span>${escapeHtml(game.ageGroup)} yosh</span>
      </div>
      <p class="game-card-desc">${escapeHtml(game.description)}</p>
      <div class="game-card-footer">
        <span class="game-record-text tabular-nums">${record > 0 ? `Rekord: ${record}` : 'Yangi rekord'}</span>
        <button type="button" class="btn-play-card">O‘ynash</button>
      </div>
    </div>
  `;

  card.querySelector('.fav-toggle-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    soundEngine.playClick();
    const res = toggleFavoriteGame(game.id);
    notifyNewAchievements(res.newAchievements);
    renderAllCatalogSections();
  });

  card.querySelector('.btn-play-card').addEventListener('click', () => {
    launchGame(game);
  });

  card.querySelector('.game-thumb-wrap').addEventListener('click', (e) => {
    if (e.target.closest('.fav-toggle-btn')) return;
    launchGame(game);
  });

  return card;
}

function renderGameListInto(gridEl, list, progress) {
  gridEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const g of list) {
    frag.appendChild(createGameCardElement(g, progress));
  }
  gridEl.appendChild(frag);
}

function renderAllCatalogSections() {
  if (!currentUser) return;
  const progress = loadProgress();

  headerPlayerName.textContent = currentUser.name;
  welcomeGreeting.textContent = `Salom, ${currentUser.name}!`;
  welcomeMeta.textContent = `Faol yosh toifasi: ${AGE_LABELS[currentUser.ageGroup]} · Umumiy ball: ${progress.totalScore}`;

  // Sync active filter buttons
  ageFilterBar.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.ageFilter === filterAge);
  });
  categoryFilterBar.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.category === filterCategory);
  });

  // Hero spotlight adapts safely for 3-5 vs 6+
  const featuredGame =
    currentUser.ageGroup === '3-5'
      ? GAMES_CATALOG.find((g) => g.id === 'kids-rangli-mashinalar')
      : GAMES_CATALOG.find((g) => g.ageGroup === currentUser.ageGroup && g.engine === 'racing3d') ||
        GAMES_CATALOG.find((g) => g.id === 'jr-3d-avtomobil-poygasi');

  if (featuredGame) {
    heroTitle.textContent = featuredGame.title;
    heroDesc.textContent = featuredGame.description;
    heroPlayBtn.onclick = () => launchGame(featuredGame);
  }

  // Primary Filtered Library
  const q = searchQuery.trim().toLowerCase();
  const filtered = GAMES_CATALOG.filter((g) => {
    const matchAge = filterAge === 'all' || g.ageGroup === filterAge;
    const matchCat = filterCategory === 'all' || g.category === filterCategory;
    const matchQ =
      !q ||
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      (g.keywords && g.keywords.toLowerCase().includes(q));
    return matchAge && matchCat && matchQ;
  });

  libraryTitle.textContent =
    filterAge === 'all'
      ? 'Barcha yosh toifalari o‘yinlari'
      : `${filterAge} yosh uchun o‘yinlar kutubxonasi`;
  libraryCount.textContent = `${filtered.length} ta o‘yin topildi`;

  if (filtered.length === 0) {
    libraryGrid.innerHTML = '';
    emptySearchState.classList.remove('hidden');
  } else {
    emptySearchState.classList.add('hidden');
    renderGameListInto(libraryGrid, filtered, progress);
  }

  // Recently Played
  const recentGames = progress.recent
    .map((id) => GAMES_CATALOG.find((g) => g.id === id))
    .filter(Boolean);
  if (recentGames.length > 0) {
    recentSection.classList.remove('hidden');
    renderGameListInto(recentGrid, recentGames.slice(0, 4), progress);
  } else {
    recentSection.classList.add('hidden');
  }

  // Favorites
  const favGames = progress.favorites
    .map((id) => GAMES_CATALOG.find((g) => g.id === id))
    .filter(Boolean);
  if (favGames.length > 0) {
    favoritesSection.classList.remove('hidden');
    renderGameListInto(favoritesGrid, favGames, progress);
  } else {
    favoritesSection.classList.add('hidden');
  }

  // Curated age-appropriate sections (safe for 3-5, rich across catalog for 6+)
  const pool =
    currentUser.ageGroup === '3-5'
      ? GAMES_CATALOG.filter((g) => g.ageGroup === '3-5')
      : GAMES_CATALOG.filter((g) => g.ageGroup !== '3-5');

  const popular = pool.filter((g) => g.popular).slice(0, 4);
  const recommended = pool.filter((g) => g.ageGroup === currentUser.ageGroup && g.recommended).slice(0, 4);
  const newest = pool.filter((g) => g.isNew).slice(0, 4);

  renderGameListInto(popularGrid, popular, progress);
  renderGameListInto(
    recommendedGrid,
    recommended.length ? recommended : pool.slice(0, 4),
    progress
  );
  renderGameListInto(newGrid, newest, progress);
}

// Launch Any of the 40 Playable Games
function launchGame(game) {
  soundEngine.playClick();
  closeActiveGame();

  activeGame = game;
  heroPaused = true;
  currentSettings = loadSettings();

  const startedRes = markGameStarted(game.id);
  notifyNewAchievements(startedRes.newAchievements);

  const progress = loadProgress();
  const isFav = progress.favorites.includes(game.id);
  const best = progress.records[game.id] || 0;

  activeGameTitle.textContent = game.title;
  activeGameMeta.textContent = `${game.category} · ${game.ageGroup} yosh · Rekord: ${best}`;
  activeControlsHint.textContent = `Boshqaruv: ${game.controls}`;
  modalFavBtn.classList.toggle('active', isFav);
  modalFavBtn.textContent = isFav ? 'Sevimli ♥' : 'Sevimli ♡';
  modalSoundBtn.textContent = currentSettings.muted ? "Ovoz: O'chirilgan" : 'Ovoz: Yoqilgan';

  gameModal.classList.remove('hidden');
  gameLoading.classList.remove('hidden');
  gameStage.innerHTML = '';

  requestAnimationFrame(() => {
    const callbacks = {
      container: gameStage,
      game,
      settings: currentSettings,
      onScoreUpdate: (score) => {
        const res = recordGameScore(game.id, score);
        notifyNewAchievements(res.newAchievements);
        activeGameMeta.textContent = `${game.category} · ${game.ageGroup} yosh · Rekord: ${res.best}`;
        if (res.isNewRecord && score > 0) {
          showToast('Yangi shaxsiy rekord!', `${game.title}: ${score} ball`);
        }
      },
      onFinish: () => {
        renderAllCatalogSections();
      },
    };

    if (game.engine === 'racing3d') {
      cleanupActiveGame = launchRacingGame(callbacks);
    } else if (game.engine === 'world3d') {
      cleanupActiveGame = launchWorld3DGame(callbacks);
    } else {
      cleanupActiveGame = launchKidsGame(callbacks);
    }

    setTimeout(() => {
      gameLoading.classList.add('hidden');
    }, 180);
  });
}

function closeActiveGame() {
  if (cleanupActiveGame) {
    cleanupActiveGame();
    cleanupActiveGame = null;
  }
  soundEngine.stopEngine();
  gameStage.innerHTML = '';
  gameModal.classList.add('hidden');
  activeGame = null;
  heroPaused = false;
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  renderAllCatalogSections();
}

// Modal Controls
modalCloseBtn.addEventListener('click', () => {
  soundEngine.playClick();
  closeActiveGame();
});

modalRestartBtn.addEventListener('click', () => {
  if (!activeGame) return;
  const g = activeGame;
  launchGame(g);
});

modalFavBtn.addEventListener('click', () => {
  if (!activeGame) return;
  soundEngine.playClick();
  const res = toggleFavoriteGame(activeGame.id);
  modalFavBtn.classList.toggle('active', res.added);
  modalFavBtn.textContent = res.added ? 'Sevimli ♥' : 'Sevimli ♡';
  notifyNewAchievements(res.newAchievements);
  renderAllCatalogSections();
});

modalSoundBtn.addEventListener('click', () => {
  currentSettings = toggleMuteSetting();
  modalSoundBtn.textContent = currentSettings.muted ? "Ovoz: O'chirilgan" : 'Ovoz: Yoqilgan';
  soundEngine.playClick();
});

modalFullscreenBtn.addEventListener('click', () => {
  soundEngine.playClick();
  if (!document.fullscreenElement) {
    gameModal.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
});

// Search & Filter Listeners
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  clearSearchBtn.classList.toggle('hidden', !searchQuery);
  renderAllCatalogSections();
});

clearSearchBtn.addEventListener('click', () => {
  searchQuery = '';
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  renderAllCatalogSections();
});

resetFiltersBtn.addEventListener('click', () => {
  soundEngine.playClick();
  searchQuery = '';
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  filterAge = 'all';
  filterCategory = 'all';
  renderAllCatalogSections();
});

ageFilterBar.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  soundEngine.playClick();
  filterAge = btn.dataset.ageFilter;
  renderAllCatalogSections();
});

categoryFilterBar.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  soundEngine.playClick();
  filterCategory = btn.dataset.category;
  renderAllCatalogSections();
});

heroGarageBtn.addEventListener('click', () => {
  soundEngine.playClick();
  document.getElementById('library-section').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('nav-quick-race').addEventListener('click', (e) => {
  e.preventDefault();
  const raceGame =
    GAMES_CATALOG.find((g) => g.ageGroup === currentUser?.ageGroup && g.engine === 'racing3d') ||
    GAMES_CATALOG.find((g) => g.id === 'jr-3d-avtomobil-poygasi');
  if (raceGame) launchGame(raceGame);
});

// Profile & Settings Modals
function openProfileModal() {
  soundEngine.playClick();
  renderProfileModal(profileModalBody, GAMES_CATALOG, {
    onRequestAgeChange: () => {
      profileModal.classList.add('hidden');
      openOnboarding('age');
    },
  });
  profileModal.classList.remove('hidden');
}

function openSettingsModal() {
  soundEngine.playClick();
  renderSettingsModal(
    settingsModalBody,
    (next) => {
      currentSettings = next;
    },
    showToast
  );
  settingsModal.classList.remove('hidden');
}

document.getElementById('open-profile-btn').addEventListener('click', openProfileModal);
document.getElementById('nav-achievements-btn').addEventListener('click', openProfileModal);
document.getElementById('footer-profile-btn').addEventListener('click', openProfileModal);

document.getElementById('nav-settings-btn').addEventListener('click', openSettingsModal);
document.getElementById('footer-settings-btn').addEventListener('click', openSettingsModal);
document.getElementById('footer-age-btn').addEventListener('click', () => {
  soundEngine.playClick();
  openOnboarding('age');
});

document.getElementById('close-profile-btn').addEventListener('click', () => {
  profileModal.classList.add('hidden');
});
document.getElementById('close-settings-btn').addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

[profileModal, settingsModal].forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (!profileModal.classList.contains('hidden')) profileModal.classList.add('hidden');
    else if (!settingsModal.classList.contains('hidden')) settingsModal.classList.add('hidden');
  }
});

// Enter Main App
function enterMainApp() {
  onboardingEl.classList.add('hidden');
  appShell.classList.remove('hidden');
  renderAllCatalogSections();
  initHero3DPreview();
}

// Bootstrap
function bootstrap() {
  if (currentUser) {
    filterAge = currentUser.ageGroup;
    enterMainApp();
  } else {
    openOnboarding('age');
  }

  setTimeout(() => {
    splashEl.classList.add('fade-out');
    setTimeout(() => splashEl.classList.add('hidden'), 360);
  }, 350);
}

bootstrap();
