import type { Locale, MonogramConfig } from '../types/commerce';
import type {
  HeroStageMode,
  PolarizedGlareShieldState,
  TryOnFitEvaluation,
  TryOnLensMaterialState,
} from '../engines/virtualTryOnEngine';

export interface EditorialPortraitPayload {
  webglCanvas: HTMLCanvasElement | null;
  videoElement?: HTMLVideoElement | null;
  stageMode: HeroStageMode;
  locale: Locale;
  finishLabel: string;
  finishHex: string;
  lensLabel: string;
  uvIndex: number;
  lensState: TryOnLensMaterialState;
  fit: TryOnFitEvaluation;
  glare: PolarizedGlareShieldState;
  monogram: MonogramConfig;
  headYawDeg: number;
  headPitchDeg: number;
}

/**
 * Composites a framed 1200x800 Parisian Atelier Editorial Try-On Portrait PNG
 * with live 3D / AR canvas snapshot and exact optical & anthropometric dossier.
 */
export function renderEditorialTryOnPortraitCanvas(
  payload: EditorialPortraitPayload
): HTMLCanvasElement {
  const W = 1200;
  const H = 800;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (!ctx) return out;

  // 1. Parisian Archival Paper background (#F6F3ED)
  ctx.fillStyle = '#F6F3ED';
  ctx.fillRect(0, 0, W, H);

  // Subtle archival hairline frame
  ctx.strokeStyle = 'rgba(17, 17, 17, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = 'rgba(17, 17, 17, 0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(32, 32, W - 64, H - 64);

  // 2. Left Portrait Plate Area (740 x 644)
  const plateX = 52;
  const plateY = 92;
  const plateW = 736;
  const plateH = 626;

  // Warm gallery chiaroscuro studio backdrop matching the live 3D Try-On stage
  const radGrad = ctx.createRadialGradient(
    plateX + plateW * 0.5,
    plateY + plateH * 0.44,
    40,
    plateX + plateW * 0.5,
    plateY + plateH * 0.44,
    plateW * 0.62
  );
  radGrad.addColorStop(0, '#E6DDD0');
  radGrad.addColorStop(0.66, '#D0C4B1');
  radGrad.addColorStop(1, '#BEB09B');
  ctx.fillStyle = radGrad;
  ctx.fillRect(plateX, plateY, plateW, plateH);

  // Archival faint grid inside portrait plate
  ctx.strokeStyle = 'rgba(17, 17, 17, 0.045)';
  ctx.lineWidth = 1;
  for (let gx = plateX + 92; gx < plateX + plateW; gx += 92) {
    ctx.beginPath();
    ctx.moveTo(gx, plateY);
    ctx.lineTo(gx, plateY + plateH);
    ctx.stroke();
  }
  for (let gy = plateY + 92; gy < plateY + plateH; gy += 92) {
    ctx.beginPath();
    ctx.moveTo(plateX, gy);
    ctx.lineTo(plateX + plateW, gy);
    ctx.stroke();
  }

  // Draw optional mirrored Webcam AR video feed first
  ctx.save();
  ctx.beginPath();
  ctx.rect(plateX, plateY, plateW, plateH);
  ctx.clip();

  if (
    payload.stageMode === 'ar' &&
    payload.videoElement &&
    payload.videoElement.readyState >= 2 &&
    payload.videoElement.videoWidth > 0
  ) {
    const vw = payload.videoElement.videoWidth;
    const vh = payload.videoElement.videoHeight;
    const scale = Math.max(plateW / vw, plateH / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = plateX + (plateW - dw) / 2;
    const dy = plateY + (plateH - dh) / 2;
    ctx.save();
    ctx.translate(plateX + plateW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(payload.videoElement, plateX + plateW - (dx + dw), dy, dw, dh);
    ctx.restore();
  }

  // Draw live 3D WebGL stage canvas (preserveDrawingBuffer: true)
  if (
    payload.webglCanvas &&
    payload.webglCanvas.width > 0 &&
    payload.webglCanvas.height > 0
  ) {
    const cw = payload.webglCanvas.width;
    const ch = payload.webglCanvas.height;
    const scale = Math.min(plateW / cw, plateH / ch);
    const dw = cw * scale;
    const dh = ch * scale;
    const dx = plateX + (plateW - dw) / 2;
    const dy = plateY + (plateH - dh) / 2;
    ctx.drawImage(payload.webglCanvas, dx, dy, dw, dh);
  }
  ctx.restore();

  // Plate crisp inner frame
  ctx.strokeStyle = 'rgba(17, 17, 17, 0.24)';
  ctx.lineWidth = 1;
  ctx.strokeRect(plateX, plateY, plateW, plateH);

  // Subtle plate footer stamp inside bottom-left of portrait
  ctx.fillStyle = 'rgba(17, 17, 17, 0.78)';
  ctx.fillRect(plateX + 16, plateY + plateH - 44, 344, 28);
  ctx.fillStyle = '#F6F3ED';
  ctx.font = '500 10.5px "JetBrains Mono", monospace';
  ctx.fillText(
    `POSE YAW ${payload.headYawDeg.toFixed(0)}° · PITCH ${payload.headPitchDeg.toFixed(0)}° · UV ${payload.uvIndex.toFixed(0)}/11 · VLT ${payload.lensState.vltPercent}%`,
    plateX + 28,
    plateY + plateH - 26
  );

  // 3. Top Header Ribbon
  ctx.fillStyle = '#B84A27';
  ctx.font = '500 11px "JetBrains Mono", monospace';
  ctx.fillText('MAISON VÉRA · PARIS · SABAE · V7.0 VIRTUAL TRY-ON STUDIO', 52, 66);

  const dateStamp = new Date().toISOString().slice(0, 10);
  ctx.fillStyle = '#6B655E';
  ctx.textAlign = 'right';
  ctx.fillText(`ATELIER DOSSIER · ${dateStamp}`, W - 52, 66);
  ctx.textAlign = 'left';

  // 4. Right Editorial Dossier Column (x = 816..1148)
  const colX = 816;
  const colW = 332;

  ctx.fillStyle = '#111111';
  ctx.font = '400 30px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(payload.fit.frame.name[payload.locale], colX, 124, colW);

  ctx.fillStyle = '#6B655E';
  ctx.font = '500 10.5px "JetBrains Mono", monospace';
  ctx.fillText(
    `${payload.fit.frame.sku} · ${payload.fit.frame.lensWidthMm}-${payload.fit.frame.bridgeWidthMm}-${payload.fit.frame.templeLengthMm} MM`,
    colX,
    148,
    colW
  );

  // Atelier Fit Score Hero Box
  ctx.fillStyle = '#111111';
  ctx.fillRect(colX, 172, colW, 104);
  ctx.fillStyle = '#D4B483';
  ctx.font = '500 10px "JetBrains Mono", monospace';
  ctx.fillText('ATELIER ANTHROPOMETRIC FIT SCORE', colX + 20, 198);
  ctx.fillStyle = '#F6F3ED';
  ctx.font = '400 50px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(`${payload.fit.fitScore}%`, colX + 20, 250);
  ctx.fillStyle = '#D4B483';
  ctx.font = '500 10.5px "JetBrains Mono", monospace';
  ctx.fillText(
    payload.fit.bridgeComfortVerdict[payload.locale].toUpperCase(),
    colX + 124,
    232,
    colW - 138
  );
  ctx.fillStyle = 'rgba(246, 243, 237, 0.78)';
  ctx.font = '400 10px "JetBrains Mono", monospace';
  const clearanceSign = payload.fit.templeClearanceMm >= 0 ? '+' : '';
  ctx.fillText(
    `TEMPLE ${clearanceSign}${payload.fit.templeClearanceMm.toFixed(1)} MM · PD ${payload.fit.pdMm} MM`,
    colX + 124,
    252,
    colW - 138
  );

  // Technical Dossier Rows
  const rows: [string, string, string?][] = [
    ['FACE ARCHETYPE', `${payload.fit.archetype.label[payload.locale]} (${payload.fit.archetype.templeWidthMm} mm)`],
    ['CHASSIS FINISH', payload.finishLabel, payload.finishHex],
    ['OPTICAL LENS', `${payload.lensLabel} (${payload.lensState.filterCategory})`, payload.lensState.hexColor],
    ['PHOTOCHROMIC UV', `UV ${payload.uvIndex}/11 · VLT ${payload.lensState.vltPercent}% · UV400 ${payload.lensState.uv400BlockPercent}%`],
    [
      'POLARIZED SHIELD',
      payload.glare.polarizedActive
        ? `ACTIVE (${payload.glare.glareAngleDeg.toFixed(0)}°) · -${payload.glare.glareReductionPercent}% GLARE`
        : 'STANDBY · MALUS COS²θ READY',
    ],
    ['CHEEK CLEARANCE', `${payload.fit.cheekClearanceMm.toFixed(1)} mm · BRIDGE ${payload.fit.archetype.noseBridgeHeightMm} mm`],
  ];

  if (payload.monogram.enabled && payload.monogram.text.trim()) {
    rows.push(['TEMPLE MONOGRAM', payload.monogram.text.trim().toUpperCase()]);
  }

  let rowY = 308;
  for (const [label, value, swatch] of rows) {
    ctx.strokeStyle = 'rgba(17, 17, 17, 0.12)';
    ctx.beginPath();
    ctx.moveTo(colX, rowY - 18);
    ctx.lineTo(colX + colW, rowY - 18);
    ctx.stroke();

    ctx.fillStyle = '#6B655E';
    ctx.font = '500 9.5px "JetBrains Mono", monospace';
    ctx.fillText(label, colX, rowY);

    let valX = colX;
    if (swatch) {
      ctx.fillStyle = swatch;
      ctx.beginPath();
      ctx.arc(colX + 6, rowY + 17, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(17,17,17,0.35)';
      ctx.stroke();
      valX = colX + 18;
    }

    ctx.fillStyle = '#111111';
    ctx.font = '500 12.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(value, valX, rowY + 21, colW - (valX - colX));
    rowY += 58;
  }

  // Footer colophon
  ctx.fillStyle = '#6B655E';
  ctx.font = '500 9.5px "JetBrains Mono", monospace';
  ctx.fillText(
    'CRAFTED IN GRADE-5 SABAE TITANIUM · MAISON VÉRA ARCHIVE',
    52,
    H - 42
  );
  ctx.textAlign = 'right';
  ctx.fillStyle = '#B84A27';
  ctx.fillText('VÉRA-01 · CERTIFIED TRY-ON STUDY', W - 52, H - 42);
  ctx.textAlign = 'left';

  return out;
}

function dataUrlToPngBlob(dataUrl: string): Blob | null {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return null;
  const binary = window.atob(dataUrl.slice(commaIdx + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'image/png' });
}

export function downloadEditorialTryOnPortrait(
  payload: EditorialPortraitPayload
): Promise<string> {
  const canvas = renderEditorialTryOnPortraitCanvas(payload);
  const fileName = `maison-vera-tryon-${payload.fit.frame.sku.toLowerCase()}-${payload.fit.archetype.id.toLowerCase()}-v7.png`;

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const blob = dataUrlToPngBlob(dataUrl);
    const href = blob ? URL.createObjectURL(blob) : dataUrl;
    const a = document.createElement('a');
    a.href = href;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (blob) {
      window.setTimeout(() => URL.revokeObjectURL(href), 5000);
    }
  } catch {
    // Graceful no-op in restricted environments
  }
  return Promise.resolve(fileName);
}
