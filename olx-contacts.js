/**
 * OLX.uz — yetkazib berish e'lonlaridan kontakt ma'lumotlarini yig'ish
 * Ishlatish: node olx-contacts.js
 */

const https = require('https');
const fs = require('fs');

const KEYWORDS = [
  'viloyatlarga yetkazib berish',
  'yetkazib beramiz',
  'butun uzbekistonga yetkazib',
];

// O'zbekiston telefon raqam formatlari
const PHONE_REGEX = /(\+?998[\s\-]?)?(\(?\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/g;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractPhones(text) {
  if (!text) return [];
  const clean = text.replace(/<[^>]+>/g, ' ');
  const found = [];
  let m;
  const re = /(\+?998[\s\-.]?)?\(?(9[01234789]\d)\)?[\s\-.]?(\d{3})[\s\-.]?(\d{2})[\s\-.]?(\d{2})/g;
  while ((m = re.exec(clean)) !== null) {
    const num = (m[1] || '+998') + m[2] + m[3] + m[4] + m[5];
    const normalized = num.replace(/[\s\-.()+]/g, '');
    const final = normalized.startsWith('998') ? '+' + normalized : '+998' + normalized.slice(-9);
    if (!found.includes(final)) found.push(final);
  }
  return found;
}

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
        'Referer': 'https://www.olx.uz/',
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) return resolve({ status: res.statusCode, body: null });
        try { resolve({ status: 200, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: 200, body: null }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchWithRetry(query, offset, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const r = await fetchPage(query, offset);
    if (r.status === 200) return r;
    await sleep((i + 1) * 3000);
  }
  return { status: 0, body: null };
}

async function scrapeAll() {
  const seen = new Set();
  const contacts = [];

  for (const keyword of KEYWORDS) {
    console.log(`\n🔍 "${keyword}" qidirilmoqda...`);
    let offset = 0;
    let total = 0;

    while (true) {
      const result = await fetchWithRetry(keyword, offset);
      if (!result.body) { console.log('  ❌ Javob kelmadi'); break; }

      const items = result.body.data || [];
      const meta = result.body.metadata || {};

      if (offset === 0) {
        total = meta.visible_total_count || meta.total_elements || 0;
        console.log(`  📊 Jami: ${total.toLocaleString()} ta e'lon`);
      }
      if (items.length === 0) break;

      for (const item of items) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);

        const desc = item.description || '';
        const title = item.title || '';
        const fullText = title + ' ' + desc;

        // Tavsifdan telefon raqamlarini olish
        const phones = extractPhones(fullText);

        // Seller ma'lumoti
        const seller = item.user || {};
        const location = item.location || {};

        contacts.push({
          id: item.id,
          title: title.replace(/<[^>]+>/g, '').trim(),
          seller_name: seller.name || '',
          seller_id: seller.id || '',
          phones: phones,
          has_phone_btn: item.contact?.phone === true,
          city: location.city?.name || '',
          region: location.region?.normalized_name || '',
          category: item.category?.type || '',
          url: item.url,
          keyword,
          desc_short: desc.replace(/<[^>]+>/g, '').slice(0, 150),
        });
      }

      process.stdout.write(`  ✓ ${seen.size} ta skanerlandi\r`);
      offset += items.length;
      if (offset >= Math.min(total, 1000)) break;
      await sleep(600);
    }
    await sleep(2000);
  }

  return contacts;
}

async function main() {
  console.log('🚀 OLX kontakt yig\'uvchi boshlandi...\n');

  const all = await scrapeAll();

  // Tahlil
  const withPhone = all.filter(c => c.phones.length > 0);
  const withPhoneBtn = all.filter(c => c.has_phone_btn);
  const withAnyContact = all.filter(c => c.phones.length > 0 || c.has_phone_btn);

  console.log('\n' + '═'.repeat(60));
  console.log('📊 NATIJA:');
  console.log('═'.repeat(60));
  console.log(`Jami e'lonlar skanerlandi : ${all.length} ta`);
  console.log(`Tavsifda telefon bor      : ${withPhone.length} ta`);
  console.log(`OLX tugmasi bor (yashirin): ${withPhoneBtn.length} ta`);
  console.log(`Istalgan kontakt bor      : ${withAnyContact.length} ta`);

  // Viloyat bo'yicha
  const byRegion = {};
  withAnyContact.forEach(c => {
    byRegion[c.region] = (byRegion[c.region] || 0) + 1;
  });
  console.log('\n🗺️ Viloyatlar:');
  Object.entries(byRegion).sort((a,b)=>b[1]-a[1])
    .forEach(([k,v]) => console.log(`  ${v} ta — ${k}`));

  // Misollar — telefon bor bo'lganlar
  console.log('\n📱 Telefon topilgan misollar (5 ta):');
  withPhone.slice(0, 5).forEach(c => {
    console.log(`\n  📌 ${c.title}`);
    console.log(`     Sotuvchi: ${c.seller_name}`);
    console.log(`     Tel: ${c.phones.join(', ')}`);
    console.log(`     Shahar: ${c.city}`);
    console.log(`     ${c.url}`);
  });

  // CSV saqlash
  const csvHeader = 'id,seller_name,phones,city,region,category,title,url\n';
  const csvRows = withAnyContact.map(c =>
    [c.id, c.seller_name, c.phones.join('|'), c.city, c.region, c.category,
     `"${c.title.replace(/"/g,'')}"`, c.url].join(',')
  ).join('\n');
  fs.writeFileSync('./olx-contacts.csv', csvHeader + csvRows);

  // JSON saqlash
  fs.writeFileSync('./olx-contacts.json', JSON.stringify(withAnyContact, null, 2));

  console.log(`\n✅ ${withAnyContact.length} ta kontakt saqlandi:`);
  console.log('   📄 olx-contacts.csv');
  console.log('   📄 olx-contacts.json');
}

main().catch(console.error);
