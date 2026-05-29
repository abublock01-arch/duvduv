/**
 * OLX.uz — har bir e'lon uchun telefon raqamini olish
 * Ishlatish: node olx-phones.js
 */

const https = require('https');
const fs = require('fs');

const contacts = JSON.parse(fs.readFileSync('./olx-contacts.json'));

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchPhone(offerId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.olx.uz',
      path: `/api/v1/offers/${offerId}/phones/`,
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
        try {
          const r = JSON.parse(data);
          resolve({ status: res.statusCode, phones: r.data?.phones || [] });
        } catch(e) {
          resolve({ status: res.statusCode, phones: [] });
        }
      });
    });
    req.on('error', () => resolve({ status: 0, phones: [] }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ status: 408, phones: [] }); });
    req.end();
  });
}

async function main() {
  console.log(`🚀 ${contacts.length} ta e'lon uchun telefon olinmoqda...\n`);

  const results = [];
  let success = 0, failed = 0;

  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    const r = await fetchPhone(c.id);

    // OLX dan kelgan telefon + tavsifdan topilgan telefonlarni birlashtir
    const allPhones = [...new Set([
      ...r.phones.map(p => p.replace(/\s/g, '')),
      ...c.phones.map(p => p.replace(/^\+998/, ''))
    ])].filter(Boolean);

    results.push({ ...c, phones_all: allPhones });

    if (r.phones.length > 0) success++;
    else failed++;

    // Progress
    if ((i + 1) % 50 === 0 || i === contacts.length - 1) {
      process.stdout.write(`  ${i+1}/${contacts.length} — ✅ ${success} ta telefon, ❌ ${failed} ta yo'q\r`);
    }

    // Rate limit — har 10 ta so'rovda 1s kutish
    if ((i + 1) % 10 === 0) await sleep(1000);
    else await sleep(120);
  }

  console.log('\n\n' + '═'.repeat(60));
  console.log(`✅ Telefon topildi : ${success} ta`);
  console.log(`❌ Telefon yo'q    : ${failed} ta`);
  console.log('═'.repeat(60));

  // Telefon bor bo'lganlarni saqlash
  const withPhones = results.filter(c => c.phones_all.length > 0);

  // CSV
  const csv = ['#,Telefon,Sotuvchi,Nima sotadi,Shahar,Viloyat,OLX havola']
    .concat(withPhones.flatMap((c, i) =>
      c.phones_all.map(p =>
        [i+1, p, c.seller_name, `"${(c.title||'').replace(/"/g,'')}"`,
         c.city, c.region, c.url].join(',')
      )
    )).join('\n');

  fs.writeFileSync('./olx-phones.csv', csv);
  fs.writeFileSync('./olx-phones.json', JSON.stringify(withPhones, null, 2));

  console.log(`\n📄 olx-phones.csv — ${withPhones.length} ta kontakt (${withPhones.reduce((s,c)=>s+c.phones_all.length,0)} ta raqam)`);
  console.log('\n📱 Namunalar:');
  withPhones.slice(0, 5).forEach(c => {
    console.log(`  ${c.seller_name}: ${c.phones_all.join(', ')} — ${c.title?.slice(0,50)}`);
  });
}

main().catch(console.error);
