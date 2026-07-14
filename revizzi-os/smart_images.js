/**
 * smart_images.js
 * Busca imagens inteligentes para todos os produtos da Revizzi
 * Critérios: domínio confiável + URL com nome do produto + .png preferido
 * Alta confiança (>=60): aplica direto
 * Baixa confiança (<60): marca para revisão
 * Gera preview HTML ao final
 */

import google from 'googlethis';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://lpovueymplmwuljohysj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwb3Z1ZXltcGxtd3Vsam9oeXNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE3ODY0MCwiZXhwIjoyMDkzNzU0NjQwfQ._HMesJL9z2gCsqp-IN26I7mAD5S58JVxZDagmOZ7RII';

const HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

// Domínios de alta confiança (pontuação extra)
const TRUSTED_DOMAINS = {
  // Fabricantes oficiais (+50)
  'vonixx.com.br': 50, 'soft99.com.br': 50, 'soft99australia.com': 40,
  'cadillacauto.com.br': 50, 'zacs.com.br': 50, 'razux.com.br': 50,
  'vintex.com.br': 50, 'areon.eu': 50, 'limpwax.com.br': 40,
  // Grandes lojas (+30)
  'mercadolivre.com.br': 30, 'mlstatic.com': 30, 'amazon.com.br': 30,
  'magazineluiza.com.br': 28, 'shopee.com.br': 25, 'americanas.com.br': 25,
  'submarino.com.br': 25, 'pontofrio.com.br': 22,
  // Lojas automotivas conhecidas (+25)
  'ultracar.com.br': 25, 'autozone.com.br': 25, 'studiocar': 25,
  'detailshop.com.br': 25, 'wax.com.br': 25, 'carollubrificantes.com.br': 25,
  'millenniun.com.br': 22, 'tcdn.com.br': 20, 'images.tcdn.com.br': 20,
  'awsli.com.br': 20, 'mitiendanube.com': 18,
};

// Domínios a evitar (conteúdo social/irrelevante)
const BLOCKED_DOMAINS = [
  'instagram.com', 'facebook.com', 'pinterest.com', 'youtube.com',
  'ytimg.com', 'fbcdn.net', 'lookaside.instagram.com', 'whatsapp.com',
  'twitter.com', 'tiktok.com', 'blogspot.com',
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function normalize(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch { return ''; }
}

function scoreImage(img, productName, brand) {
  const url = img.url || '';
  const domain = getDomain(url);
  let score = 0;
  let reasons = [];

  // Bloquear domínios ruins
  if (BLOCKED_DOMAINS.some(d => domain.includes(d))) return { score: -1, reasons: ['domínio bloqueado'] };
  if (!url.startsWith('http')) return { score: -1, reasons: ['url inválida'] };

  // Domínio confiável
  for (const [d, pts] of Object.entries(TRUSTED_DOMAINS)) {
    if (domain.includes(d)) {
      score += pts;
      reasons.push(`domínio confiável: ${d} (+${pts})`);
      break;
    }
  }

  // PNG preferido (suporte a fundo branco/transparente)
  if (url.toLowerCase().includes('.png') || url.toLowerCase().includes('png')) {
    score += 15;
    reasons.push('formato PNG (+15)');
  } else if (url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg')) {
    score += 5;
    reasons.push('formato JPG (+5)');
  } else if (url.toLowerCase().includes('.webp')) {
    score += 8;
    reasons.push('formato WEBP (+8)');
  }

  // URL contém nome do produto ou marca
  const normUrl = normalize(url);
  const normProduct = normalize(productName);
  const normBrand = normalize(brand);
  
  const productTokens = normProduct.split(' ').filter(t => t.length > 3);
  const matchCount = productTokens.filter(t => normUrl.includes(t)).length;
  
  if (matchCount >= 2) {
    score += 20;
    reasons.push(`nome do produto na URL (+20)`);
  } else if (matchCount === 1) {
    score += 8;
    reasons.push(`parcial na URL (+8)`);
  }

  if (normUrl.includes(normBrand)) {
    score += 10;
    reasons.push(`marca na URL (+10)`);
  }

  // Dimensões da imagem (preferir quadradas/grandes)
  if (img.width && img.height) {
    const minDim = Math.min(img.width, img.height);
    if (minDim >= 500) { score += 10; reasons.push('alta resolução (+10)'); }
    else if (minDim >= 300) { score += 5; reasons.push('média resolução (+5)'); }
    
    // Imagem quadrada = produto isolado (bom sinal)
    const ratio = img.width / img.height;
    if (ratio >= 0.8 && ratio <= 1.25) { score += 8; reasons.push('formato quadrado (+8)'); }
  }

  return { score, reasons };
}

async function searchBestImage(product) {
  const query = `${product.brand} ${product.name} fundo branco`;
  
  let images = [];
  try {
    images = await google.image(query, { safe: false });
  } catch (e) {
    // Tentar query simplificada
    try {
      await sleep(1500);
      images = await google.image(`${product.brand} ${product.name}`, { safe: false });
    } catch (e2) {
      return null;
    }
  }

  if (!images || images.length === 0) return null;

  // Pontuar top 10 imagens
  let best = null;
  let bestScore = -Infinity;
  let allScored = [];

  for (const img of images.slice(0, 10)) {
    if (!img.url) continue;
    const { score, reasons } = scoreImage(img, product.name, product.brand);
    if (score < 0) continue;
    allScored.push({ url: img.url, score, reasons, domain: getDomain(img.url), width: img.width, height: img.height });
    if (score > bestScore) {
      bestScore = score;
      best = { url: img.url, score, reasons, domain: getDomain(img.url) };
    }
  }

  return best;
}

async function run() {
  console.log('📦 Buscando todos os produtos do Supabase...');
  
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=id,name,brand,img_url&order=brand.asc`,
    { headers: HEADERS }
  );
  const products = await resp.json();
  console.log(`✅ ${products.length} produtos encontrados.\n`);

  const results = [];
  let applied = 0, skipped = 0, failed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const query = `${p.brand} ${p.name}`;
    process.stdout.write(`[${String(i+1).padStart(2,'0')}/${products.length}] "${query}" ... `);

    const best = await searchBestImage(p);

    if (!best) {
      console.log(`❌ Nenhuma imagem encontrada`);
      results.push({ ...p, newUrl: null, score: 0, domain: '', reasons: [], status: 'falhou' });
      failed++;
    } else {
      const confidence = Math.min(100, best.score);
      const label = confidence >= 60 ? '🟢' : confidence >= 35 ? '🟡' : '🔴';
      console.log(`${label} ${confidence}pts | ${best.domain}`);

      if (confidence >= 60) {
        // Aplicar direto no banco
        const upd = await fetch(
          `${SUPABASE_URL}/rest/v1/products?id=eq.${p.id}`,
          { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ img_url: best.url }) }
        );
        if (upd.ok) {
          applied++;
          results.push({ ...p, newUrl: best.url, score: confidence, domain: best.domain, reasons: best.reasons, status: 'aplicado' });
        } else {
          failed++;
          results.push({ ...p, newUrl: best.url, score: confidence, domain: best.domain, reasons: best.reasons, status: 'erro_db' });
        }
      } else {
        skipped++;
        results.push({ ...p, newUrl: best.url, score: confidence, domain: best.domain, reasons: best.reasons, status: 'revisao' });
      }
    }

    // Delay para não ser bloqueado pelo Google (3s)
    await sleep(3000);
  }

  // Salvar JSON com resultados
  fs.writeFileSync('image_results.json', JSON.stringify(results, null, 2));
  console.log(`\n✅ Aplicados: ${applied} | 🟡 Para revisão: ${skipped} | ❌ Falhas: ${failed}`);

  // Gerar HTML de preview
  generateHTML(results);
  console.log('\n🌐 Preview HTML gerado: image_preview.html');
  console.log('Abra o arquivo para revisar todas as imagens!');
}

function confidenceColor(score) {
  if (score >= 60) return '#22c55e';
  if (score >= 35) return '#f59e0b';
  return '#ef4444';
}

function confidenceLabel(score) {
  if (score >= 60) return 'ALTA';
  if (score >= 35) return 'MÉDIA';
  return 'BAIXA';
}

function statusBadge(status) {
  const map = {
    'aplicado': { bg: '#166534', color: '#4ade80', text: '✅ APLICADO' },
    'revisao': { bg: '#713f12', color: '#fbbf24', text: '🟡 REVISAR' },
    'falhou': { bg: '#7f1d1d', color: '#f87171', text: '❌ SEM IMAGEM' },
    'erro_db': { bg: '#7f1d1d', color: '#f87171', text: '❌ ERRO BD' },
  };
  const s = map[status] || map['revisao'];
  return `<span style="background:${s.bg};color:${s.color};padding:3px 8px;font-size:10px;font-weight:700;letter-spacing:0.1em;border-radius:3px;">${s.text}</span>`;
}

function generateHTML(results) {
  const rows = results.map((r, i) => {
    const imgSrc = r.newUrl || r.img_url || '';
    const score = r.score || 0;
    const color = confidenceColor(score);
    
    return `
    <div style="background:#111;border:1px solid #222;border-radius:6px;overflow:hidden;display:flex;flex-direction:column;">
      <div style="position:relative;height:160px;background:#0a0a0a;display:flex;align-items:center;justify-content:center;overflow:hidden;">
        ${imgSrc 
          ? `<img src="${imgSrc}" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display='none';this.nextSibling.style.display='flex'">
             <div style="display:none;flex-direction:column;align-items:center;gap:4px;color:#444;">
               <span style="font-size:24px;">🚫</span>
               <span style="font-size:10px;">Erro ao carregar</span>
             </div>`
          : `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;color:#333;">
               <span style="font-size:24px;">📦</span>
               <span style="font-size:10px;">Sem imagem</span>
             </div>`
        }
        <div style="position:absolute;top:6px;right:6px;background:${color};color:#000;font-size:10px;font-weight:800;padding:2px 7px;border-radius:3px;">
          ${score}pts
        </div>
      </div>
      <div style="padding:10px;flex:1;display:flex;flex-direction:column;gap:6px;">
        <div style="font-size:10px;color:#666;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">${r.brand}</div>
        <div style="font-size:12px;color:#fff;font-weight:600;line-height:1.3;">${r.name}</div>
        <div style="margin-top:auto;display:flex;flex-direction:column;gap:4px;">
          ${statusBadge(r.status)}
          ${r.domain ? `<div style="font-size:9px;color:#555;margin-top:2px;">📡 ${r.domain}</div>` : ''}
          ${imgSrc ? `<a href="${imgSrc}" target="_blank" style="font-size:9px;color:#3b82f6;text-decoration:none;word-break:break-all;line-height:1.2;" title="${imgSrc}">🔗 ver imagem</a>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  const applied = results.filter(r => r.status === 'aplicado').length;
  const toReview = results.filter(r => r.status === 'revisao').length;
  const failed = results.filter(r => r.status === 'falhou' || r.status === 'erro_db').length;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Revizzi — Preview de Imagens</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; color: #fff; font-family: Inter, sans-serif; min-height: 100vh; }
    .header { background: #111; border-bottom: 1px solid #222; padding: 20px 30px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: 0.05em; }
    .stats { display: flex; gap: 20px; }
    .stat { text-align: center; }
    .stat-num { font-size: 22px; font-weight: 800; }
    .stat-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 0.08em; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; padding: 24px 30px; }
    .filter-bar { padding: 16px 30px; border-bottom: 1px solid #1a1a1a; display: flex; gap: 10px; flex-wrap: wrap; }
    .filter-btn { background: #1a1a1a; border: 1px solid #333; color: #888; padding: 6px 14px; font-size: 11px; font-weight: 600; cursor: pointer; border-radius: 3px; transition: all 0.2s; }
    .filter-btn.active, .filter-btn:hover { border-color: #fff; color: #fff; background: #222; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">REVIZZI — Preview de Imagens</div>
    <div class="stats">
      <div class="stat"><div class="stat-num" style="color:#4ade80">${applied}</div><div class="stat-label">Aplicados</div></div>
      <div class="stat"><div class="stat-num" style="color:#fbbf24">${toReview}</div><div class="stat-label">Para revisar</div></div>
      <div class="stat"><div class="stat-num" style="color:#f87171">${failed}</div><div class="stat-label">Sem imagem</div></div>
      <div class="stat"><div class="stat-num" style="color:#fff">${results.length}</div><div class="stat-label">Total</div></div>
    </div>
  </div>
  <div class="filter-bar">
    <button class="filter-btn active" onclick="filterCards('todos')">Todos (${results.length})</button>
    <button class="filter-btn" onclick="filterCards('aplicado')">✅ Aplicados (${applied})</button>
    <button class="filter-btn" onclick="filterCards('revisao')">🟡 Revisar (${toReview})</button>
    <button class="filter-btn" onclick="filterCards('falhou')">❌ Sem imagem (${failed})</button>
  </div>
  <div class="grid" id="grid">
    ${rows}
  </div>
  <script>
    // Guardar status de cada card
    const cards = Array.from(document.getElementById('grid').children);
    const statuses = ${JSON.stringify(results.map(r => r.status))};
    
    function filterCards(filter) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      cards.forEach((card, i) => {
        if (filter === 'todos' || statuses[i] === filter || (filter === 'falhou' && (statuses[i] === 'falhou' || statuses[i] === 'erro_db'))) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync('image_preview.html', html);
}

run().catch(console.error);
