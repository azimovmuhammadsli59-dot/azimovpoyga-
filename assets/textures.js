import * as THREE from 'three';

function finalizeTexture(canvas, renderer, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (renderer) {
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  }
  tex.needsUpdate = true;
  return tex;
}

export function createAsphaltTexture(renderer, variant = 'city') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const baseColor = variant === 'desert' ? '#2c2927' : '#181c28';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Fine asphalt grain
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = 20 + Math.floor(Math.random() * 35);
    ctx.fillStyle = `rgba(${shade},${shade},${shade + 8},0.35)`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Edge kerbs
  const stripeH = 64;
  for (let y = 0; y < 512; y += stripeH) {
    const isRed = (y / stripeH) % 2 === 0;
    ctx.fillStyle = isRed ? '#ef4444' : '#f8fafc';
    ctx.fillRect(0, y, 22, stripeH);
    ctx.fillRect(490, y, 22, stripeH);
  }

  // Solid edge lines
  ctx.fillStyle = variant === 'city' ? '#00e5ff' : '#e2e8f0';
  ctx.fillRect(30, 0, 6, 512);
  ctx.fillRect(476, 0, 6, 512);

  // Dashed center line
  ctx.fillStyle = '#f8fafc';
  for (let y = 16; y < 512; y += 64) {
    ctx.fillRect(252, y, 8, 34);
  }

  return finalizeTexture(canvas, renderer, 1, 16);
}

export function createTerrainTexture(renderer, theme = 'city') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (theme === 'desert') {
    ctx.fillStyle = '#9a6b3e';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(194,142,88,0.3)' : 'rgba(110,72,38,0.28)';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 2);
    }
  } else if (theme === 'forest') {
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(64,145,108,0.25)' : 'rgba(18,50,36,0.35)';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }
  } else {
    ctx.fillStyle = '#0c1222';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.14)';
    ctx.lineWidth = 2;
    for (let p = 0; p <= 512; p += 64) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(512, p);
      ctx.stroke();
    }
  }

  return finalizeTexture(canvas, renderer, 24, 24);
}

export function createCheckerTexture(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const size = 16;
  for (let y = 0; y < 64; y += size) {
    for (let x = 0; x < 256; x += size) {
      ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#ffffff' : '#0f172a';
      ctx.fillRect(x, y, size, size);
    }
  }
  return finalizeTexture(canvas, renderer, 2, 1);
}

export function createBuildingTexture(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f162b';
  ctx.fillRect(0, 0, 256, 512);

  for (let y = 16; y < 496; y += 28) {
    for (let x = 16; x < 240; x += 32) {
      const lit = Math.random() > 0.35;
      ctx.fillStyle = lit
        ? (Math.random() > 0.5 ? '#38bdf8' : '#fde047')
        : '#1e293b';
      ctx.fillRect(x, y, 18, 16);
    }
  }
  return finalizeTexture(canvas, renderer, 1, 1);
}

export function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.62)');
  grad.addColorStop(0.65, 'rgba(0,0,0,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
