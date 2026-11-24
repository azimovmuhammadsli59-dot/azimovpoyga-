// Generates rich SVG data-URI illustrations for each of the 40 games so zero external URLs or 404s occur.

const PALETTES = {
  racing: ['#091229', '#00e5ff', '#3b82f6'],
  moto: ['#1a0b2e', '#f43f5e', '#a855f7'],
  formula: ['#1b0a16', '#ef4444', '#f59e0b'],
  drift: ['#110e2c', '#ec4899', '#06b6d4'],
  offroad: ['#23170c', '#f59e0b', '#84cc16'],
  taxi: ['#1d1807', '#facc15', '#38bdf8'],
  truck: ['#0e1a24', '#38bdf8', '#94a3b8'],
  flight: ['#071e3d', '#38bdf8', '#e0f2fe'],
  space: ['#09061f', '#8b5cf6', '#00e5ff'],
  football: ['#082819', '#10b981', '#fef08a'],
  dino: ['#0c261c', '#34d399', '#fbbf24'],
  robot: ['#10182f', '#22d3ee', '#818cf8'],
  maze: ['#170d2e', '#c084fc', '#2dd4bf'],
  ocean: ['#062038', '#0ea5e9', '#fde047'],
  kids: ['#271645', '#fbbf24', '#f472b6'],
};

function getVisualMotif(game, c1, c2) {
  const icon = game.iconType || 'racing';
  if (icon === 'kids-car' || icon === 'racing' || icon === 'drift' || icon === 'taxi') {
    return `
      <path d="M40 148 L120 96 L200 96 L280 148 Z" fill="rgba(255,255,255,0.06)"/>
      <g transform="translate(88, 72)">
        <rect x="8" y="34" width="128" height="32" rx="10" fill="${c1}"/>
        <path d="M32 34 L50 10 L100 10 L118 34 Z" fill="${c2}"/>
        <circle cx="34" cy="68" r="14" fill="#0f172a" stroke="#e2e8f0" stroke-width="4"/>
        <circle cx="110" cy="68" r="14" fill="#0f172a" stroke="#e2e8f0" stroke-width="4"/>
        <rect x="120" y="42" width="14" height="8" rx="3" fill="#fef08a"/>
      </g>`;
  }
  if (icon === 'formula') {
    return `
      <g transform="translate(74, 78)">
        <rect x="10" y="32" width="140" height="18" rx="6" fill="${c1}"/>
        <rect x="0" y="38" width="26" height="10" rx="3" fill="#ffffff"/>
        <rect x="136" y="16" width="22" height="24" rx="3" fill="${c2}"/>
        <circle cx="38" cy="50" r="15" fill="#0f172a" stroke="#facc15" stroke-width="4"/>
        <circle cx="126" cy="50" r="16" fill="#0f172a" stroke="#facc15" stroke-width="4"/>
      </g>`;
  }
  if (icon === 'moto') {
    return `
      <g transform="translate(86, 68)">
        <circle cx="28" cy="68" r="17" fill="none" stroke="#e2e8f0" stroke-width="6"/>
        <circle cx="116" cy="68" r="17" fill="none" stroke="#e2e8f0" stroke-width="6"/>
        <path d="M28 66 L58 34 L106 38 L116 66" stroke="${c1}" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M52 34 L76 18 L98 28" stroke="${c2}" stroke-width="8" fill="none" stroke-linecap="round"/>
      </g>`;
  }
  if (icon === 'truck' || icon === 'offroad') {
    return `
      <g transform="translate(76, 64)">
        <rect x="12" y="20" width="84" height="48" rx="6" fill="${c2}"/>
        <path d="M98 30 L138 30 L152 48 L152 68 L98 68 Z" fill="${c1}"/>
        <circle cx="34" cy="72" r="15" fill="#0f172a" stroke="#cbd5e1" stroke-width="4"/>
        <circle cx="74" cy="72" r="15" fill="#0f172a" stroke="#cbd5e1" stroke-width="4"/>
        <circle cx="128" cy="72" r="15" fill="#0f172a" stroke="#cbd5e1" stroke-width="4"/>
      </g>`;
  }
  if (icon === 'flight') {
    return `
      <g transform="translate(92, 56)">
        <path d="M16 44 L120 34 L138 44 L120 54 Z" fill="${c1}"/>
        <path d="M46 14 L84 44 L46 74 L60 44 Z" fill="${c2}"/>
        <circle cx="96" cy="44" r="9" fill="#ffffff"/>
      </g>`;
  }
  if (icon === 'space') {
    return `
      <circle cx="62" cy="44" r="2" fill="#fff"/>
      <circle cx="248" cy="36" r="3" fill="${c1}"/>
      <circle cx="220" cy="138" r="2" fill="#fff"/>
      <g transform="translate(100, 56)">
        <polygon points="60,8 108,76 60,58 12,76" fill="${c1}"/>
        <polygon points="60,22 76,56 60,48 44,56" fill="${c2}"/>
      </g>`;
  }
  if (icon === 'football') {
    return `
      <rect x="34" y="34" width="252" height="132" rx="10" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="3"/>
      <line x1="160" y1="34" x2="160" y2="166" stroke="rgba(255,255,255,0.22)" stroke-width="3"/>
      <circle cx="160" cy="100" r="26" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>
      <polygon points="160,84 173,94 168,110 152,110 147,94" fill="#0f172a"/>`;
  }
  if (icon === 'dino') {
    return `
      <g transform="translate(98, 56)">
        <rect x="24" y="42" width="66" height="44" rx="12" fill="${c1}"/>
        <rect x="74" y="16" width="42" height="32" rx="10" fill="${c1}"/>
        <rect x="0" y="54" width="32" height="18" rx="8" fill="${c2}"/>
        <circle cx="102" cy="28" r="4" fill="#0f172a"/>
        <rect x="36" y="84" width="14" height="20" rx="4" fill="${c1}"/>
        <rect x="64" y="84" width="14" height="20" rx="4" fill="${c1}"/>
      </g>`;
  }
  if (icon === 'robot') {
    return `
      <g transform="translate(110, 48)">
        <rect x="24" y="12" width="52" height="36" rx="8" fill="${c1}"/>
        <rect x="32" y="24" width="36" height="10" rx="4" fill="#0f172a"/>
        <rect x="16" y="54" width="68" height="52" rx="10" fill="${c2}"/>
      </g>`;
  }
  if (icon === 'ocean') {
    return `
      <g transform="translate(96, 66)">
        <rect x="20" y="24" width="90" height="44" rx="22" fill="${c2}"/>
        <rect x="48" y="8" width="26" height="18" rx="4" fill="${c1}"/>
        <circle cx="92" cy="46" r="10" fill="#e0f2fe"/>
      </g>`;
  }
  if (icon === 'maze') {
    return `
      <g stroke="${c1}" stroke-width="6" fill="none" stroke-linecap="round">
        <rect x="70" y="34" width="180" height="132" rx="12"/>
        <path d="M110 34 V120 H175 V74 H210 V142 H130"/>
        <circle cx="215" cy="58" r="8" fill="${c2}" stroke="none"/>
      </g>`;
  }
  // Kids colorful shapes / fruits / animals / bubbles / blocks
  return `
    <circle cx="98" cy="92" r="34" fill="${c1}" opacity="0.9"/>
    <rect x="148" y="58" width="64" height="64" rx="14" fill="${c2}" opacity="0.9"/>
    <polygon points="228,130 256,74 284,130" fill="#38bdf8" opacity="0.9"/>`;
}

export function getGameThumbnail(game) {
  const [bg, c1, c2] = PALETTES[game.palette || 'racing'] || PALETTES.racing;
  const motif = getVisualMotif(game, c1, c2);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="100%" stop-color="#050814"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#g)"/>
      <circle cx="265" cy="34" r="78" fill="${c1}" opacity="0.14"/>
      <circle cx="48" cy="172" r="68" fill="${c2}" opacity="0.14"/>
      ${motif}
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
