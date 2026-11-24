const USER_KEY = 'uzgames_user_v1';
const PROGRESS_KEY = 'uzgames_progress_v1';

export const AGE_LABELS = {
  '3-5': '3–5 yosh (Kichkintoylar)',
  '6-9': '6–9 yosh (Sarguzashtchilar)',
  '10-15': '10–15 yosh (Yosh chempionlar)',
  '16-20': '16–20 yosh (Pro o‘yinchilar)',
};

export const ACHIEVEMENTS = [
  {
    id: 'first_start',
    title: 'Ilk qadam',
    desc: 'Platformada birinchi o‘yinni ishga tushiring',
    check: (p) => p.gamesPlayed >= 1,
  },
  {
    id: 'five_games',
    title: 'Faol o‘yinchi',
    desc: 'Kamida 5 ta o‘yin o‘ynang',
    check: (p) => p.gamesPlayed >= 5,
  },
  {
    id: 'score_500',
    title: '500 ball ustasi',
    desc: 'Umumiy ballaringizni 500 dan oshiring',
    check: (p) => p.totalScore >= 500,
  },
  {
    id: 'score_2500',
    title: 'Super Chempion',
    desc: 'Umumiy ballaringizni 2500 ga yetkazing',
    check: (p) => p.totalScore >= 2500,
  },
  {
    id: 'fav_collector',
    title: 'Sevimlilar to‘plami',
    desc: '3 ta o‘yinni sevimlilar ro‘yxatiga qo‘shing',
    check: (p) => p.favorites.length >= 3,
  },
  {
    id: 'race_winner',
    title: '3D Poyga qiroli',
    desc: 'Istalgan 3D poyga o‘yinida 300+ ball to‘plang',
    check: (p) => Object.entries(p.records).some(([id, val]) => id.includes('race') || id.includes('poyga') || id.includes('formula') || id.includes('drift') ? val >= 300 : false),
  },
];

const DEFAULT_PROGRESS = {
  favorites: [],
  recent: [],
  records: {},
  totalScore: 0,
  gamesPlayed: 0,
  unlockedAchievements: [],
};

export function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.name || !parsed.ageGroup) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveUser(name, ageGroup) {
  const user = {
    name: String(name).trim(),
    ageGroup,
    createdAt: loadUser()?.createdAt || new Date().toISOString(),
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
      records: parsed.records && typeof parsed.records === 'object' ? parsed.records : {},
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  return progress;
}

export function toggleFavoriteGame(gameId) {
  const p = loadProgress();
  const idx = p.favorites.indexOf(gameId);
  let added = false;
  if (idx >= 0) {
    p.favorites.splice(idx, 1);
  } else {
    p.favorites.unshift(gameId);
    added = true;
  }
  const newAchievements = evaluateAchievements(p);
  saveProgress(p);
  return { progress: p, added, newAchievements };
}

export function markGameStarted(gameId) {
  const p = loadProgress();
  p.recent = [gameId, ...p.recent.filter((id) => id !== gameId)].slice(0, 8);
  p.gamesPlayed += 1;
  const newAchievements = evaluateAchievements(p);
  saveProgress(p);
  return { progress: p, newAchievements };
}

export function recordGameScore(gameId, score) {
  const cleanScore = Math.max(0, Math.round(Number(score) || 0));
  const p = loadProgress();
  const prevBest = p.records[gameId] || 0;
  const isNewRecord = cleanScore > prevBest;
  if (isNewRecord) {
    p.records[gameId] = cleanScore;
  }
  p.totalScore += cleanScore;
  const newAchievements = evaluateAchievements(p);
  saveProgress(p);
  return { progress: p, isNewRecord, best: p.records[gameId] || 0, newAchievements };
}

function evaluateAchievements(progress) {
  const unlockedNow = [];
  for (const ach of ACHIEVEMENTS) {
    if (!progress.unlockedAchievements.includes(ach.id) && ach.check(progress)) {
      progress.unlockedAchievements.push(ach.id);
      unlockedNow.push(ach);
    }
  }
  return unlockedNow;
}

export function resetAllUserData() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PROGRESS_KEY);
}

export function renderProfileModal(container, gamesList, handlers) {
  const user = loadUser();
  const p = loadProgress();
  if (!user) return;

  const topRecords = Object.entries(p.records)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, score]) => {
      const g = gamesList.find((item) => item.id === id);
      return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span>${g ? g.title : id}</span>
        <strong class="tabular-nums" style="color:var(--accent-cyan);">${score} ball</strong>
      </div>`;
    })
    .join('');

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div>
        <h3 style="font-family:var(--font-display);font-size:1.35rem;">${escapeHtml(user.name)}</h3>
        <p style="color:var(--text-muted);font-size:0.88rem;">Yosh guruhi: ${AGE_LABELS[user.ageGroup] || user.ageGroup}</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button type="button" id="profile-change-age-btn" class="btn-secondary">Yoshni o‘zgartirish</button>
      </div>
    </div>

    <div class="profile-summary-grid">
      <div class="stat-tile">
        <div class="stat-tile-label">Umumiy ball</div>
        <div class="stat-tile-value tabular-nums">${p.totalScore}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-label">O‘ynalgan o‘yinlar</div>
        <div class="stat-tile-value tabular-nums">${p.gamesPlayed}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-label">Yutuqlar</div>
        <div class="stat-tile-value tabular-nums">${p.unlockedAchievements.length}/${ACHIEVEMENTS.length}</div>
      </div>
    </div>

    <div>
      <h4 style="font-family:var(--font-display);margin-bottom:10px;">Yutuqlar</h4>
      <div class="achievements-list">
        ${ACHIEVEMENTS.map((ach) => {
          const unlocked = p.unlockedAchievements.includes(ach.id);
          return `
            <div class="ach-item ${unlocked ? 'unlocked' : ''}">
              <div class="ach-title">${ach.title} ${unlocked ? '✓' : ''}</div>
              <div class="ach-desc">${ach.desc}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div>
      <h4 style="font-family:var(--font-display);margin-bottom:8px;">Shaxsiy rekordlar</h4>
      ${topRecords || '<p style="color:var(--text-muted);font-size:0.88rem;">Hozircha rekordlar yo‘q. Biror o‘yinni boshlang!</p>'}
    </div>
  `;

  container.querySelector('#profile-change-age-btn').addEventListener('click', () => {
    handlers?.onRequestAgeChange?.();
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
