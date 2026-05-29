/**
 * OLX.uz scraper — "yetkazib berish" e'lonlarini topish
 * Ishlatish: node olx-scraper.js
 */

const https = require('https');
const fs = require('fs');

const KEYWORDS = [
  'viloyatlarga yetkazib berish',
  'yetkazib beramiz',
  'dostavka viloyat',
  'viloyatga yetkazib',
  'butun uzbekistonga yetkazib',
];

// Viloyat nomlari — tavsifda qidiramiz
const VILOYATLAR = [
  'andijon','namangan',"farg'ona",'fargona','samarqand','buxoro',
  'navoiy','qashqadaryo','surxondaryo','xorazm','sirdaryo','jizzax',
  'qoraqalpog','toshkent viloyat'
];

function fetchPage(query, offset = 0) {
  return new Promise((resolve, reject) => {
    const q = encodeURIComponent(query);
    const options = {
      hostname: 'www.olx.uz',
      path: `/api/v1/offers/?offset=${offset}&limit=50&query=${q}&sort_by=created_at:desc`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'uz,ru;q=0.9',
        'Referer': 'https://www.olx.uz/',
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 403) return resolve({ status: 403, body: null });
        if (res.statusCode === 429) return resolve({ status: 429, body: null });
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: null }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function hasViloyat(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return VILOYATLAR.some(v => t.includes(v));
}

async function fetchWithRetry(query, offset, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const r = await fetchPage(query, offset);
    if (r.status === 200) return r;
    if (r.status === 403 || r.status === 429) {
      const wait = (i + 1) * 3000;
      console.log(`  ⏳ ${r.status} — ${wait/1000}s kutilmoqda...`);
      await sleep(wait);
    } else {
      console.log(`  ❌ HTTP ${r.status}`);
      return r;
    }
  }
  return { status: 0, body: null };
}

async function scrapeKeyword(keyword) {
  process.stdout.write(`\n🔍 "${keyword}": `);
  let offset = 0;
  let total = 0;
  let fetched = 0;
  let withViloyat = 0;
  const viloyatItems = [];

  while (true) {
    const result = await fetchWithRetry(keyword, offset);
    if (!result.body) { console.log(`❌`); break; }

    const items = result.body.data || [];
    const meta = result.body.metadata || {};
    if (offset === 0) {
      total = meta.visible_total_count || meta.total_elements || 0;
      process.stdout.write(`${total} ta e'lon`);
    }

    if (items.length === 0) break;

    for (const item of items) {
      fetched++;
      const desc = (item.description || '') + ' ' + (item.title || '');
      if (hasViloyat(desc)) {
        withViloyat++;
        viloyatItems.push({
          id: item.id,
          title: item.title,
          category: item.category?.type || '',
          region: item.location?.region?.normalized_name || '',
          city: item.location?.city?.name || '',
          url: item.url,
          desc_short: item.description?.replace(/<[^>]+>/g,'').slice(0,120) || '',
        });
      }
    }

    offset += items.length;
    // max 500 ta olish (10 sahifa)
    if (offset >= Math.min(total, 500)) break;
    await sleep(800);
  }

  process.stdout.write(` | ${fetched} skanerlandi | ${withViloyat} ta viloyatga yetkazish\n`);
  return { keyword, total, fetched, withViloyat, items: viloyatItems };
}

async function main() {
  console.log('🚀 OLX.uz scraper boshlandi...');
  const allResults = {};

  for (const kw of KEYWORDS) {
    allResults[kw] = await scrapeKeyword(kw);
    await sleep(2000); // keyingi so'rovdan oldin 2s kutish
  }

  // Barcha viloyat e'lonlarini birlashtirish (takrorlarsiz)
  const seen = new Set();
  const unique = [];
  for (const r of Object.values(allResults)) {
    for (const item of r.items) {
      if (!seen.has(item.id)) { seen.add(item.id); unique.push(item); }
    }
  }

  // ── HISOBOT ──
  console.log('\n' + '═'.repeat(60));
  console.log('📊 NATIJA:');
  console.log('═'.repeat(60));

  for (const [kw, r] of Object.entries(allResults)) {
    console.log(`"${kw}"`);
    console.log(`  OLX da jami: ${r.total.toLocaleString()} ta`);
    console.log(`  Skanerlandi: ${r.fetched} ta`);
    console.log(`  Viloyatga yetkazish: ${r.withViloyat} ta`);
  }

  console.log('\n🎯 Noyob viloyat e\'lonlari: ' + unique.length + ' ta');

  // Kategoriyalar
  const cats = {};
  unique.forEach(i => { cats[i.category]=(cats[i.category]||0)+1; });
  console.log('\n📦 Kategoriyalar:');
  Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,8)
    .forEach(([k,v]) => console.log(`  ${v} ta — ${k}`));

  // Misollar
  console.log('\n📝 Misollar (5 ta):');
  unique.slice(0,5).forEach(i => {
    console.log(`  • ${i.title}`);
    console.log(`    ${i.desc_short}`);
    console.log(`    ${i.url}\n`);
  });

  fs.writeFileSync('./olx-results.json', JSON.stringify({ summary: allResults, unique }, null, 2));
  console.log('✅ olx-results.json ga saqlandi');
}

main().catch(console.error);
