/**
 * retry_low_confidence.js
 * Segunda rodada para os 29 produtos com baixa confiança.
 * Usa queries mais específicas e busca no site do fabricante.
 */

import google from 'googlethis';
import fs from 'fs';

const SUPABASE_URL = 'https://lpovueymplmwuljohysj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwb3Z1ZXltcGxtd3Vsam9oeXNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE3ODY0MCwiZXhwIjoyMDkzNzU0NjQwfQ._HMesJL9z2gCsqp-IN26I7mAD5S58JVxZDagmOZ7RII';

const HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

// Domínios dos fabricantes por marca
const BRAND_SITES = {
  'Vonixx': 'site:vonixx.com.br OR site:images.tcdn.com.br',
  'Soft 99': 'site:soft99.com.br OR site:images.tcdn.com.br',
  'Cadillac': 'site:cadillacauto.com.br OR site:images.tcdn.com.br',
  'Zacs': 'site:images.tcdn.com.br OR site:cdn.awsli.com.br',
  'Razux': 'site:images.tcdn.com.br',
  'Vintex': 'site:images.tcdn.com.br OR site:vonixx.com.br',
  'Areon': 'site:images.tcdn.com.br',
  'Detailer': 'site:images.tcdn.com.br',
  'Diversos': 'site:images.tcdn.com.br',
};

const TRUSTED_DOMAINS = {
  'vonixx.com.br': 50, 'soft99.com.br': 50, 'cadillacauto.com.br': 50,
  'images.tcdn.com.br': 20, 'tcdn.com.br': 20,
  'mlstatic.com': 30, 'http2.mlstatic.com': 30,
  'amazon.com.br': 30, 'magazineluiza.com.br': 28,
  'awsli.com.br': 20, 'cdn.awsli.com.br': 20,
  'mitiendanube.com': 18,
};

const BLOCKED = ['instagram.com','facebook.com','pinterest.com','youtube.com','ytimg.com','fbcdn.net'];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getDomain(url) { try { return new URL(url).hostname.replace('www.',''); } catch { return ''; } }
function normalize(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim(); }

function scoreImage(img, name, brand) {
  const url = img.url || '';
  const domain = getDomain(url);
  if (BLOCKED.some(d => domain.includes(d))) return -1;
  if (!url.startsWith('http')) return -1;

  let score = 0;
  for (const [d, pts] of Object.entries(TRUSTED_DOMAINS)) {
    if (domain.includes(d)) { score += pts; break; }
  }
  if (url.includes('.png')) score += 15;
  else if (url.includes('.webp')) score += 8;
  else if (url.includes('.jpg') || url.includes('.jpeg')) score += 5;

  const normUrl = normalize(url);
  const tokens = normalize(name).split(' ').filter(t => t.length > 3);
  const matches = tokens.filter(t => normUrl.includes(t)).length;
  if (matches >= 2) score += 20;
  else if (matches === 1) score += 8;
  if (normUrl.includes(normalize(brand))) score += 10;

  if (img.width && img.height) {
    const min = Math.min(img.width, img.height);
    if (min >= 500) score += 10;
    else if (min >= 300) score += 5;
    const ratio = img.width / img.height;
    if (ratio >= 0.8 && ratio <= 1.25) score += 8;
  }
  return score;
}

async function searchBest(name, brand, queries) {
  for (const q of queries) {
    try {
      const images = await google.image(q, { safe: false });
      if (!images || images.length === 0) continue;

      let best = null, bestScore = -Infinity;
      for (const img of images.slice(0, 12)) {
        if (!img.url) continue;
        const s = scoreImage(img, name, brand);
        if (s > bestScore) { bestScore = s; best = { url: img.url, score: s, domain: getDomain(img.url) }; }
      }
      if (best && best.score >= 50) return best;
      await sleep(2000);
    } catch { await sleep(2000); }
  }
  return null;
}

async function run() {
  const allResults = JSON.parse(fs.readFileSync('image_results.json', 'utf-8'));
  const toRetry = allResults.filter(r => r.status === 'revisao');
  
  console.log(`🔄 Segunda rodada: ${toRetry.length} produtos para melhorar\n`);

  let improved = 0, unchanged = 0;

  for (let i = 0; i < toRetry.length; i++) {
    const p = toRetry[i];
    const brandSite = BRAND_SITES[p.brand] || 'site:images.tcdn.com.br';

    // Queries progressivamente mais amplas
    const queries = [
      `${p.brand} "${p.name}" produto fundo branco`,
      `${p.brand} ${p.name} ${brandSite}`,
      `${p.name} ${p.brand} automotivo`,
      `${p.name} automotivo produto`,
    ];

    process.stdout.write(`[${String(i+1).padStart(2,'0')}/${toRetry.length}] "${p.brand} ${p.name}" ... `);

    const best = await searchBest(p.name, p.brand, queries);

    if (best && best.score >= 50) {
      // Aplicar no banco
      const upd = await fetch(
        `${SUPABASE_URL}/rest/v1/products?id=eq.${p.id}`,
        { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ img_url: best.url }) }
      );

      if (upd.ok) {
        const label = best.score >= 60 ? '🟢' : '🟡';
        console.log(`${label} ${best.score}pts | ${best.domain} ✅`);
        // Atualizar results
        const idx = allResults.findIndex(r => r.id === p.id);
        allResults[idx].newUrl = best.url;
        allResults[idx].score = best.score;
        allResults[idx].domain = best.domain;
        allResults[idx].status = best.score >= 60 ? 'aplicado' : 'aplicado_medio';
        improved++;
      } else {
        console.log(`⚠️ Erro DB`);
        unchanged++;
      }
    } else {
      // Manter a imagem anterior se existia (não era null)
      const prevImg = p.img_url;
      if (prevImg && prevImg !== p.newUrl) {
        const upd = await fetch(
          `${SUPABASE_URL}/rest/v1/products?id=eq.${p.id}`,
          { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ img_url: prevImg }) }
        );
        console.log(`↩️  Mantendo imagem anterior | ${getDomain(prevImg)}`);
      } else {
        console.log(`❌ Sem melhora`);
      }
      unchanged++;
    }

    // Salvar progresso
    fs.writeFileSync('image_results.json', JSON.stringify(allResults, null, 2));
    await sleep(3000);
  }

  console.log(`\n✅ Melhorados: ${improved} | ↩️  Sem melhora: ${unchanged}`);

  // Regenerar HTML com todos os resultados
  generateHTML(allResults);
  console.log('🌐 Preview atualizado: image_preview.html');
}

function statusBadge(status) {
  const map = {
    'aplicado': { bg: '#166534', color: '#4ade80', text: '✅ ALTA CONF.' },
    'aplicado_medio': { bg: '#365314', color: '#a3e635', text: '✅ MÉD. CONF.' },
    'revisao': { bg: '#713f12', color: '#fbbf24', text: '🟡 MANUAL' },
    'falhou': { bg: '#7f1d1d', color: '#f87171', text: '❌ SEM IMAGEM' },
  };
  const s = map[status] || map['revisao'];
  return `<span style="background:${s.bg};color:${s.color};padding:3px 8px;font-size:10px;font-weight:700;letter-spacing:0.1em;border-radius:3px;">${s.text}</span>`;
}

function confidenceColor(score) {
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function generateHTML(results) {
  const applied = results.filter(r => r.status === 'aplicado').length;
  const medium = results.filter(r => r.status === 'aplicado_medio').length;
  const manual = results.filter(r => r.status === 'revisao').length;
  const failed = results.filter(r => r.status === 'falhou').length;

  const rows = results.map((r) => {
    const imgSrc = r.newUrl || r.img_url || '';
    const score = r.score || 0;
    const color = confidenceColor(score);
    return `
    <div class="card" data-status="${r.status}">
      <div style="position:relative;height:160px;background:#0a0a0a;display:flex;align-items:center;justify-content:center;overflow:hidden;">
        ${imgSrc
          ? `<img src="${imgSrc}" style="max-width:100%;max-height:100%;object-fit:contain;" loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='flex'">
             <div style="display:none;flex-direction:column;align-items:center;color:#444;"><span style="font-size:24px;">🚫</span><span style="font-size:10px;">Erro</span></div>`
          : `<div style="display:flex;flex-direction:column;align-items:center;color:#333;"><span style="font-size:24px;">📦</span><span style="font-size:10px;">Sem imagem</span></div>`
        }
        <div style="position:absolute;top:6px;right:6px;background:${color};color:#000;font-size:11px;font-weight:800;padding:2px 8px;border-radius:3px;">${score}pts</div>
      </div>
      <div style="padding:10px;flex:1;display:flex;flex-direction:column;gap:5px;">
        <div style="font-size:10px;color:#666;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">${r.brand}</div>
        <div style="font-size:12px;color:#fff;font-weight:600;line-height:1.3;">${r.name}</div>
        <div style="margin-top:auto;display:flex;flex-direction:column;gap:4px;">
          ${statusBadge(r.status)}
          ${r.domain ? `<div style="font-size:9px;color:#555;">📡 ${r.domain}</div>` : ''}
          ${imgSrc ? `<a href="${imgSrc}" target="_blank" style="font-size:9px;color:#3b82f6;text-decoration:none;word-break:break-all;line-height:1.2;">🔗 ver imagem</a>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Revizzi — Preview Final de Imagens</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; color: #fff; font-family: Inter, sans-serif; }
    .header { background: #111; border-bottom: 1px solid #222; padding: 18px 28px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; flex-wrap: wrap; gap: 12px; }
    .logo { font-size: 20px; font-weight: 800; letter-spacing: 0.05em; }
    .stats { display: flex; gap: 18px; flex-wrap: wrap; }
    .stat { text-align: center; }
    .stat-num { font-size: 20px; font-weight: 800; }
    .stat-label { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 0.08em; }
    .filter-bar { padding: 14px 28px; border-bottom: 1px solid #1a1a1a; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .filter-btn { background: #1a1a1a; border: 1px solid #333; color: #888; padding: 5px 13px; font-size: 11px; font-weight: 600; cursor: pointer; border-radius: 3px; transition: all 0.15s; }
    .filter-btn.active, .filter-btn:hover { border-color: #fff; color: #fff; background: #222; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 10px; padding: 20px 28px; }
    .card { background: #111; border: 1px solid #222; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; transition: border-color 0.15s; }
    .card:hover { border-color: #444; }
    .card[style*="display:none"] { display: none !important; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">REVIZZI — Preview Final</div>
    <div class="stats">
      <div class="stat"><div class="stat-num" style="color:#4ade80">${applied}</div><div class="stat-label">Alta conf.</div></div>
      <div class="stat"><div class="stat-num" style="color:#a3e635">${medium}</div><div class="stat-label">Méd. conf.</div></div>
      <div class="stat"><div class="stat-num" style="color:#fbbf24">${manual}</div><div class="stat-label">Manual</div></div>
      <div class="stat"><div class="stat-num" style="color:#f87171">${failed}</div><div class="stat-label">Sem img.</div></div>
      <div class="stat"><div class="stat-num" style="color:#fff">${results.length}</div><div class="stat-label">Total</div></div>
    </div>
  </div>
  <div class="filter-bar">
    <strong style="font-size:11px;color:#555;margin-right:4px;">FILTRAR:</strong>
    <button class="filter-btn active" onclick="filterCards(this,'todos')">Todos (${results.length})</button>
    <button class="filter-btn" onclick="filterCards(this,'aplicado')">✅ Alta conf. (${applied})</button>
    <button class="filter-btn" onclick="filterCards(this,'aplicado_medio')">✅ Méd. conf. (${medium})</button>
    <button class="filter-btn" onclick="filterCards(this,'revisao')">🟡 Manual (${manual})</button>
    <button class="filter-btn" onclick="filterCards(this,'falhou')">❌ Sem imagem (${failed})</button>
  </div>
  <div class="grid" id="grid">${rows}</div>
  <script>
    const cards = [...document.querySelectorAll('.card')];
    function filterCards(btn, filter) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      cards.forEach(card => {
        const status = card.dataset.status;
        card.style.display = (filter === 'todos' || status === filter) ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync('image_preview.html', html);
}

run().catch(console.error);
