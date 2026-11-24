import { soundEngine } from './assets/audio.js';

const SETTINGS_KEY = 'uzgames_settings_v1';

const DEFAULT_SETTINGS = {
  muted: false,
  volume: 0.65,
  graphics: 'balanced', // 'high' | 'balanced'
  showTouchControls: 'auto', // 'auto' | 'always' | 'off'
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    soundEngine.setConfig({ muted: merged.muted, volume: merged.volume });
    return merged;
  } catch {
    soundEngine.setConfig({ muted: DEFAULT_SETTINGS.muted, volume: DEFAULT_SETTINGS.volume });
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(next) {
  const merged = { ...DEFAULT_SETTINGS, ...next };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  soundEngine.setConfig({ muted: merged.muted, volume: merged.volume });
  return merged;
}

export function toggleMuteSetting() {
  const current = loadSettings();
  return saveSettings({ ...current, muted: !current.muted });
}

export function renderSettingsModal(container, onUpdate, onToast) {
  const s = loadSettings();
  container.innerHTML = `
    <div class="setting-row">
      <div>
        <p class="setting-title">Ovoz effektlari va dvigatel tovushi</p>
        <p class="setting-desc">Barcha o'yinlarda ovozni yoqish yoki o'chirish</p>
      </div>
      <button type="button" id="setting-mute-toggle" class="btn-secondary">
        ${s.muted ? "O'chirilgan (Yoqish)" : "Yoqilgan (O'chirish)"}
      </button>
    </div>

    <div class="setting-row">
      <div>
        <p class="setting-title">Ovoz balandligi (<span id="vol-pct">${Math.round(s.volume * 100)}%</span>)</p>
        <p class="setting-desc">O'yin tovushlari darajasini sozlang</p>
      </div>
      <input
        id="setting-volume-range"
        type="range"
        min="0"
        max="100"
        value="${Math.round(s.volume * 100)}"
        aria-label="Ovoz balandligi"
      />
    </div>

    <div class="setting-row">
      <div>
        <p class="setting-title">3D Grafika sifati</p>
        <p class="setting-desc">Qurilmangiz unumdorligiga mos sifatni tanlang</p>
      </div>
      <select id="setting-graphics-select" class="name-input" style="width:auto;padding:8px 12px;font-size:0.9rem;">
        <option value="balanced" ${s.graphics === 'balanced' ? 'selected' : ''}>Muvozanatli (Tezkor)</option>
        <option value="high" ${s.graphics === 'high' ? 'selected' : ''}>Yuqori (Soyalar bilan)</option>
      </select>
    </div>

    <div class="setting-row" style="border-bottom:none;">
      <div>
        <p class="setting-title">Ekran tugmalari (Mobil boshqaruv)</p>
        <p class="setting-desc">3D poyga va harakat o'yinlarida sensorli tugmalar ko'rinishi</p>
      </div>
      <select id="setting-touch-select" class="name-input" style="width:auto;padding:8px 12px;font-size:0.9rem;">
        <option value="auto" ${s.showTouchControls === 'auto' ? 'selected' : ''}>Avtomatik</option>
        <option value="always" ${s.showTouchControls === 'always' ? 'selected' : ''}>Doim ko'rsatish</option>
        <option value="off" ${s.showTouchControls === 'off' ? 'selected' : ''}>Yashirish</option>
      </select>
    </div>
  `;

  container.querySelector('#setting-mute-toggle').addEventListener('click', () => {
    const updated = toggleMuteSetting();
    soundEngine.playClick();
    renderSettingsModal(container, onUpdate, onToast);
    onUpdate?.(updated);
    onToast?.('Sozlamalar', updated.muted ? "Ovoz o'chirildi" : 'Ovoz yoqildi');
  });

  const volRange = container.querySelector('#setting-volume-range');
  volRange.addEventListener('input', (e) => {
    const pct = Number(e.target.value);
    container.querySelector('#vol-pct').textContent = `${pct}%`;
    const updated = saveSettings({ ...loadSettings(), volume: pct / 100 });
    onUpdate?.(updated);
  });

  container.querySelector('#setting-graphics-select').addEventListener('change', (e) => {
    const updated = saveSettings({ ...loadSettings(), graphics: e.target.value });
    soundEngine.playClick();
    onUpdate?.(updated);
    onToast?.('Grafika yangilandi', 'Yangi 3D sifat keyingi o‘yinda qo‘llanadi.');
  });

  container.querySelector('#setting-touch-select').addEventListener('change', (e) => {
    const updated = saveSettings({ ...loadSettings(), showTouchControls: e.target.value });
    soundEngine.playClick();
    onUpdate?.(updated);
  });
}
