/**
 * duvduv Bot — professional, tushunarli, Кирилл
 */

const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// ── Firebase ──────────────────────────────────────────────────────────────
// Kalit Railway environment variable dan o'qiladi (JSON string)
let serviceAccount;
if (process.env.FIREBASE_SA) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SA);
} else {
  // Lokal ishlab chiqish uchun (git ga solinmaydi)
  serviceAccount = require('./newkeyfirebase.json');
}
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'yolcar-30649',
});
const db = admin.firestore();
// gRPC yo'q — faqat REST ishlatamiz (Railway uchun)
db.settings({ preferRest: true });

// Firestore snapshot → oddiy object
function docToObj(doc) {
  const d = doc.data();
  return {
    from:             d.from || '',
    to:               d.to || d.dest || '',
    dest:             d.dest || '',
    type:             d.type || '',
    telegramId:       Number(d.telegramId) || 0,
    telegramUsername: d.telegramUsername || '',
    archived:         d.archived === true,
    createdAt:        d.createdAt?.toMillis ? d.createdAt.toMillis() : (d.createdAt || 0),
  };
}

async function fsQuery(collectionId, afterMs) {
  const ts = admin.firestore.Timestamp.fromMillis(afterMs);
  const snap = await db.collection(collectionId)
    .where('createdAt', '>', ts)
    .orderBy('createdAt', 'asc')
    .get();
  return snap.docs.map(docToObj);
}

// ── Bot ───────────────────────────────────────────────────────────────────
const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) { console.error('❌ BOT_TOKEN topilmadi'); process.exit(1); }

const bot = new TelegramBot(TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: { timeout: 10 }
  }
});
const APP_URL = 'https://duvduv.vercel.app';

console.log('✅ duvduv bot ishga tushdi');

// ── Polling xatolarini ushlab, avtomatik qayta ulanish ───────────────────
bot.on('polling_error', (err) => {
  const code = err.code || '';
  if (['ETIMEDOUT','ECONNRESET','ENOTFOUND','EFATAL'].includes(code) ||
      (err.message && err.message.includes('ETIMEDOUT'))) {
    console.warn(`⚠️ Polling uzildi (${code}), 5 soniyada qayta ulanadi...`);
    setTimeout(() => {
      bot.stopPolling()
        .then(() => bot.startPolling())
        .catch(e => console.error('Qayta ulanish xatosi:', e.message));
    }, 5000);
  } else {
    console.error('Polling xatosi:', err.message);
  }
});

// ── Tugmalar ──────────────────────────────────────────────────────────────
const APP_BTN_TEXT  = '▶️  Иловани очиш';
const MENU_BTN_TEXT = 'Қани бошладик';   // keyboard pastki tugма матни (ўзгармайди)

bot.setChatMenuButton({
  menu_button: { type: 'web_app', text: MENU_BTN_TEXT, web_app: { url: APP_URL } }
})
  .then(() => console.log('✅ Menu tugmasi sozlandi'))
  .catch(err => console.warn('Menu tugmasi:', err.message));

// Pastki doimiy klaviatura
const persistentKeyboard = {
  keyboard: [[{ text: MENU_BTN_TEXT, web_app: { url: APP_URL } }]],
  resize_keyboard: true,
  persistent: true
};

// Standart inline "Иловани очиш" tugmasi
const appBtn = () => ({
  inline_keyboard: [[{ text: APP_BTN_TEXT, web_app: { url: APP_URL } }]]
});

// ── Latin → Kirill normalizatsiya (mini app Latin, bot Kirill yozadi) ────
const LATIN_TO_CYR = {
  // === Lotin (mini app UZ_REGIONS) → Kanonik Kirill ===
  'Toshkent shahar' : 'Тошкент',
  'Toshkent viloyat': 'Тошкент',
  'Toshkent'        : 'Тошкент',
  'Samarqand'       : 'Самарқанд',
  "Farg'ona"        : 'Фарғона',
  'Fargona'         : 'Фарғона',
  'Andijon'         : 'Андижон',
  'Namangan'        : 'Наманган',
  'Buxoro'          : 'Бухоро',
  'Xorazm'          : 'Хоразм',
  'Surxondaryo'     : 'Сурхондарё',
  'Qashqadaryo'     : 'Қашқадарё',
  'Sirdaryo'        : 'Сирдарё',
  'Jizzax'          : 'Жиззах',
  'Navoiy'          : 'Навоий',
  "Qoraqalpog'iston": 'Қорақалпоғистон',
  'Qoraqalpogiston' : 'Қорақалпоғистон',

  // === Kirill variantlari (mini app ROUTE_REGIONS) → Kanonik Kirill ===
  'Тошкент шаҳри'   : 'Тошкент',
  'Тошкент шаҳар'   : 'Тошкент',
  'Тошкент вилояти' : 'Тошкент',
  'Тошкент шаҳар вилояти': 'Тошкент',
  'Самарқанд'       : 'Самарқанд',
  'Фарғона'         : 'Фарғона',
  'Андижон'         : 'Андижон',
  'Наманган'        : 'Наманган',
  'Бухоро'          : 'Бухоро',
  'Хоразм'          : 'Хоразм',
  'Сурхондарё'      : 'Сурхондарё',
  'Қашқадарё'       : 'Қашқадарё',
  'Сирдарё'         : 'Сирдарё',
  'Жиззах'          : 'Жиззах',
  'Навоий'          : 'Навоий',
  'Қорақалпоғистон' : 'Қорақалпоғистон',
};

/** Viloyat nomini kanonik Kirill ko'rinishiga keltiradi */
function normalizeRegion(r) {
  if (!r) return '';
  // To'liq qiymat bo'yicha qidirish
  if (LATIN_TO_CYR[r]) return LATIN_TO_CYR[r];
  // "Andijon — Andijon shahar" → "Andijon" (dash dan oldingi qism)
  const beforeDash = r.split('—')[0].trim();
  if (LATIN_TO_CYR[beforeDash]) return LATIN_TO_CYR[beforeDash];
  // " shahar" / " viloyat" / " shahri" qo'shimchasini olib tashlash
  const clean = beforeDash.replace(/\s+(shahar|viloyat|shahri|viloyati)$/i, '').trim();
  return LATIN_TO_CYR[clean] || clean || r;
}

/** MarkdownV2 uchun maxsus belgilarni escape qilish */
function esc(t) {
  return String(t).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/** "Toshkent shahar" → "Тошкент Ш", "Toshkent viloyat" → "Тошкент В" */
function shortRegion(r) {
  if (!r) return '';
  const cyr = normalizeRegion(r); // avval Kirillga o'tkazamiz
  const low = r.toLowerCase();
  if (low.includes('shahar') || low.includes('шаҳар') || low.includes('шаҳри') || low.includes('sh.') ) {
    return cyr + ' Ш';
  }
  if (low.includes('viloyat') || low.includes('вилоят') || low.includes('вилояти')) {
    return cyr + ' В';
  }
  return cyr;
}

// ── Viloyatlar ────────────────────────────────────────────────────────────
const REGIONS = [
  'Тошкент', 'Самарқанд', 'Бухоро', 'Андижон',
  'Фарғона', 'Наманган', 'Қашқадарё', 'Сурхондарё',
  'Хоразм', 'Навоий', 'Жиззах', 'Сирдарё', 'Қорақалпоғистон'
];

const regionKeyboard = (prefix) => ({
  inline_keyboard: [
    ...REGIONS.reduce((rows, r, i) => {
      const row = Math.floor(i / 2);
      if (!rows[row]) rows[row] = [];
      rows[row].push({ text: r, callback_data: `${prefix}:${r}` });
      return rows;
    }, [])
  ]
});

// Rol tugmalari
const roleMenu = {
  inline_keyboard: [[
    { text: '🚐  Ҳайдовчи', callback_data: 'role_driver' },
    { text: '📦  Жўнатувчи', callback_data: 'role_sender' },
  ]]
};

// Xabarnoma menyu
const notifMenu = (notif) => ({
  inline_keyboard: [
    [{ text: APP_BTN_TEXT, web_app: { url: APP_URL } }],
    notif
      ? [{ text: '🔔  Билдиришномалар: ёқилган', callback_data: 'notif_off' }]
      : [{ text: '🔕  Билдиришномалар: ўчирилган', callback_data: 'notif_on' }],
  ]
});

// ── Vaqtinchalik sessiya ───────────────────────────────────────────────────
const driverSession = {};

async function getUser(telegramId) {
  const doc = await db.collection('users').doc(String(telegramId)).get();
  return doc.exists ? doc.data() : null;
}

async function saveUser(user, extra = {}) {
  await db.collection('users').doc(String(user.id)).set({
    telegramId: user.id,
    chatId: user.id,
    username: user.username || '',
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    notifications: true,
    ...extra,
  }, { merge: true });
}

// ── /start ────────────────────────────────────────────────────────────────
bot.onText(/\/start/, async (msg) => {
  const user = msg.from;
  const name = user.first_name || 'Фойдаланувчи';
  const chatId = msg.chat.id;

  try {
    await saveUser(user);
    const existing = await getUser(user.id);

    if (existing && existing.role) {
      // Qaytgan foydalanuvchi
      await bot.sendMessage(chatId,
        `👋 Хуш келибсиз, *${name}*!\n\n` +
        `Иловани очинг:`,
        {
          parse_mode: 'Markdown',
          reply_markup: appBtn()
        }
      );
    } else {
      // Yangi foydalanuvchi
      await bot.sendMessage(chatId,
        `👋 Салом, *${name}*!\n\n` +
        `*duvduv* — юк ва йўловчи топиш иловаси.\n\n` +
        `Билдиришномаларни ёқиш учун иловани очинг:\n` +
        `📦  Юкингизга ҳайдовчи топилганда\n` +
        `🧍  Йўловчи сўрови келганда\n` +
        `🔔  Янги мос эълонларда\n\n` +
        `Рухсат бериш учун иловани очинг:`,
        {
          parse_mode: 'Markdown',
          reply_markup: appBtn()
        }
      );
    }
  } catch (err) {
    console.error('/start xatosi:', err.message);
  }
});

// ── /menu ─────────────────────────────────────────────────────────────────
bot.onText(/\/menu/, async (msg) => {
  const user = msg.from;
  const existing = await getUser(user.id);
  const notif = existing?.notifications !== false;
  const fromCity = existing?.routeFrom || '—';
  const toCity = existing?.routeTo || '—';
  const isDriver = existing?.role === 'driver';

  const keyboard = {
    inline_keyboard: [
      [{ text: APP_BTN_TEXT, web_app: { url: APP_URL } }],
      ...(isDriver ? [[{ text: `🛣  ${fromCity} → ${toCity}`, callback_data: 'set_route' }]] : []),
      [notif
        ? { text: '🔔  Билдиришномалар: ёқилган', callback_data: 'notif_off' }
        : { text: '🔕  Билдиришномалар: ўчирилган', callback_data: 'notif_on' }
      ],
    ]
  };

  await bot.sendMessage(msg.chat.id,
    `⚙️ *Созламалар*`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
});

// ── /test — tekshirish buyrug'i ───────────────────────────────────────────
bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id;
  const uid    = String(msg.from.id);
  try {
    // 1. Firestore'da user ma'lumotlari
    const userDoc = await db.collection('users').doc(uid).get();
    const u = userDoc.exists ? userDoc.data() : null;

    // 2. So'nggi arxivlanmagan order
    const ordSnap = await db.collection('orders').orderBy('createdAt','desc').limit(5).get();
    const lastOrd = ordSnap.docs.map(d => d.data()).find(d => !d.archived) || null;

    // 3. Jami haydovchilar soni (chatId bor + driver/route bor)
    const allSnap = await db.collection('users').where('chatId', '>', 0).get();
    const drivers = allSnap.docs.map(d => d.data()).filter(u =>
      u.role === 'driver' || (u.routeFrom && u.routeTo)
    );

    const lines = [
      `🔧 *Bot diagnostika*\n`,
      `👤 Siz: \`${uid}\``,
      `📋 Firestore user: ${u ? '✅ topildi' : '❌ topilmadi'}`,
      u ? `   role: \`${u.role || '—'}\`` : '',
      u ? `   chatId: \`${u.chatId || '—'}\`` : '',
      u ? `   routeFrom: \`${u.routeFrom || '—'}\`` : '',
      u ? `   routeTo: \`${u.routeTo || '—'}\`` : '',
      u ? `   notifications: \`${u.notifications}\`` : '',
      ``,
      `🚐 Bildirishnoma oladigan haydovchilar: *${drivers.length} ta*`,
      ...drivers.map(d => `   • \`${d.chatId}\` ${d.routeFrom || '?'} → ${d.routeTo || 'har yer'}`),
      ``,
      `📦 So'nggi aktiv order: ${lastOrd ? '✅' : '❌ yo\'q'}`,
      lastOrd ? `   from: \`${lastOrd.from}\`  to: \`${lastOrd.to || lastOrd.dest}\`` : '',
      lastOrd ? `   telegramId: \`${lastOrd.telegramId || '—'}\`` : '',
      ``,
      `✅ Bot ishlayapti!`
    ].filter(l => l !== null && l !== undefined);

    await bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'Markdown' });
  } catch(e) {
    await bot.sendMessage(chatId, `❌ Xato: ${e.message}`);
  }
});

// ── /stop ─────────────────────────────────────────────────────────────────
bot.onText(/\/stop/, async (msg) => {
  await db.collection('users').doc(String(msg.from.id)).set(
    { notifications: false },
    { merge: true }
  );
  await bot.sendMessage(msg.chat.id,
    `🔕 *Билдиришномалар ўчирилди.*\n\nҚайта ёқиш учун /menu юборинг.`,
    { parse_mode: 'Markdown' }
  );
});

// ── Callback tugmalar ─────────────────────────────────────────────────────
bot.on('callback_query', async (query) => {
  const user = query.from;
  const chatId = query.message.chat.id;
  const msgId = query.message.message_id;
  const data = query.data;

  try {
    // Rol tanlash
    if (data === 'role_driver' || data === 'role_sender') {
      const role = data === 'role_driver' ? 'driver' : 'sender';
      await saveUser(user, { role });

      if (role === 'driver') {
        await bot.editMessageText(
          `🚐 *Ҳайдовчи сифатида рўйхатдан ўтдингиз.*\n\n` +
          `📍 Маршрутингизни белгиланг.\n` +
          `Жўнаш нуқтасини танланг:`,
          { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: regionKeyboard('from') }
        );
      } else {
        await bot.editMessageText(
          `📦 *Жўнатувчи сифатида рўйхатдан ўтдингиз.*\n\n` +
          `Юк ёки йўловчи жўнатиш учун иловани очинг:`,
          { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: appBtn() }
        );
      }
    }

    // Yo'nalish o'rnatish
    if (data === 'set_route') {
      await bot.editMessageText(
        `🛣 *Маршрутни янгилаш*\n\n` +
        `📍 Жўнаш нуқтасини танланг:`,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: regionKeyboard('from') }
      );
    }

    // A nuqta tanlandi
    if (data.startsWith('from:')) {
      const city = data.split(':')[1];
      driverSession[user.id] = { from: city };
      await bot.editMessageText(
        `✅ *Жўнаш нуқтаси:* ${city}\n\n` +
        `📍 Борадиган манзилни танланг:`,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: regionKeyboard('to') }
      );
    }

    // B nuqta tanlandi
    if (data.startsWith('to:')) {
      const city = data.split(':')[1];
      const fromCity = driverSession[user.id]?.from || '';
      delete driverSession[user.id];

      await db.collection('users').doc(String(user.id)).set(
        { routeFrom: fromCity, routeTo: city },
        { merge: true }
      );

      await bot.editMessageText(
        `✅ *Маршрут сақланди*\n\n` +
        `🛣  ${fromCity} → ${city}\n\n` +
        `Ушбу йўналишдаги янги эълонлар ҳақида хабардор бўласиз.`,
        {
          chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
          reply_markup: appBtn()
        }
      );
    }

    if (data === 'change_role') {
      await bot.editMessageText(
        `👤 *Ролни танланг:*`,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: roleMenu }
      );
    }

    // Xabarnomani o'chirish
    if (data === 'notif_off') {
      await db.collection('users').doc(String(user.id)).set(
        { notifications: false }, { merge: true }
      );
      await bot.editMessageReplyMarkup(notifMenu(false), { chat_id: chatId, message_id: msgId });
      await bot.answerCallbackQuery(query.id, { text: '🔕 Билдиришномалар ўчирилди' });
    }

    // Xabarnomani yoqish
    if (data === 'notif_on') {
      await db.collection('users').doc(String(user.id)).set(
        { notifications: true }, { merge: true }
      );
      await bot.editMessageReplyMarkup(notifMenu(true), { chat_id: chatId, message_id: msgId });
      await bot.answerCallbackQuery(query.id, { text: '🔔 Билдиришномалар ёқилди' });
    }

    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error('Callback xatosi:', err.message);
  }
});


// ── Foydalanuvchiga tasdiqlash xabari (e'lon qo'yganidan keyin) ──────────
async function notifySender(telegramId, from, to, type) {
  if (!telegramId) { console.log('⚠️ notifySender: telegramId yo\'q'); return; }
  console.log(`📨 Sender ga xabar: chatId=${telegramId}`);

  let icon, label, reply;
  if (type === '🚗 Сафар') {
    icon  = '🚐';
    label = 'Сафар эълони';
    reply = '🔔 Йўналишингизга мос йўловчи ёки юк топилганда дарҳол хабар берамиз.';
  } else if (type === '👤 Йўловчи') {
    icon  = '🧍';
    label = 'Йўловчи эълони';
    reply = '🔔 Мос ҳайдовчи топилганда дарҳол хабар берамиз.';
  } else {
    icon  = '📦';
    label = 'Юк эълони';
    reply = '🔔 Мос ҳайдовчи топилганда дарҳол хабар берамиз.';
  }

  const fromS = esc(shortRegion(from));
  const toS   = esc(shortRegion(to));
  try {
    await bot.sendMessage(telegramId,
      `✅ *Эълонингиз қабул қилинди\\!*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛣  *${fromS} ➜ ${toS}*\n` +
      `${icon}  ${esc(label)}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${esc(reply)}\n\n` +
      `_Иловани очиб эълонингизни кўришингиз мумкин_ 👇`,
      { parse_mode: 'MarkdownV2', reply_markup: appBtn() }
    );
  } catch(e) {
    console.error('Sender notification xatosi:', e.message);
  }
}

// ── Haydovchilarga yangi e'lon xabari ────────────────────────────────────
async function notifyDrivers(from, to, type, senderUsername, senderChatId) {
  if (!from || !to) { console.log('⚠️ notifyDrivers: from yoki to yo\'q'); return; }
  console.log(`🔍 Haydovchilar qidirilmoqda: ${from} → ${to}, jo'natuvchi: ${senderChatId}`);

  // Barcha chatId bor foydalanuvchilarni olamiz
  const usersSnap = await db.collection('users')
    .where('chatId', '>', 0)
    .get();

  console.log(`👥 Jami chatId bor foydalanuvchilar: ${usersSnap.size} ta`);

  // type qiymatiga qarab
  let icon, label;
  if (type === '👤 Йўловчи') {
    icon  = '🧍';
    label = 'Йўловчи бор';
  } else if (type === '🚗 Сафар') {
    icon  = '🚐';
    label = 'Ҳайдовчи маршрути';
  } else {
    icon  = '📦';
    label = 'Юк жўнатиш бор';
  }

  const senderLine = senderUsername ? `👤  @${senderUsername}\n` : '';

  for (const doc of usersSnap.docs) {
    const driver = doc.data();
    if (!driver.chatId) continue;

    // Jo'natuvchining o'ziga ikki marta xabar ketmasin
    if (senderChatId && Number(driver.chatId) === Number(senderChatId)) {
      console.log(`⏭ ${doc.id}: jo'natuvchining o'zi, o'tkazildi`);
      continue;
    }

    // Bildirishnoma o'chirilgan — o'tkazib yuboramiz
    if (driver.notifications === false) continue;

    // Marshrut filtri: faqat belgilangan bo'lsa tekshiramiz
    // Belgilanmagan (routeFrom/To yo'q) bo'lsa — barcha e'lonlarni oladi
    const driverFrom = normalizeRegion(driver.routeFrom || '');
    const driverTo   = normalizeRegion(driver.routeTo   || '');
    if (driverFrom && driverTo) {
      const match = (driverFrom === from && driverTo === to) ||
                    (driverFrom === to   && driverTo === from);
      if (!match) {
        console.log(`⏭ ${doc.id}: marshrut mos kelmadi (${driverFrom}→${driverTo} vs ${from}→${to})`);
        continue;
      }
    }

    const fromS = esc(shortRegion(from));
    const toS   = esc(shortRegion(to));
    const mijoz = senderUsername ? `👤  Мижоз: @${esc(senderUsername)}\n` : '';
    console.log(`📤 Xabar yuborilmoqda: chatId=${driver.chatId} (${doc.id})`);
    await bot.sendMessage(driver.chatId,
      `🔔 *ЯНГИ ЭЪЛОН — СИЗНИНГ ЙЎНАЛИШИНГИЗДА\\!*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛣  *${fromS} ➜ ${toS}*\n` +
      `${icon}  ${esc(label)}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      mijoz +
      `📲 Батафсил маълумот ва боғланиш учун:`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: appBtn()
      }
    ).catch(e => console.error(`sendMessage xato (${driver.chatId}):`, e.message));
  }
}

// ── Polling (REST API orqali — gRPC bypass) ───────────────────────────────
const POLL_MS     = 6000;
let lastOrderMs   = Date.now();
let lastTravelMs  = Date.now();

async function pollOrders() {
  try {
    const docs = await fsQuery('orders', lastOrderMs);
    for (const d of docs) {
      if (d.archived) continue;
      if (d.createdAt <= lastOrderMs) continue;
      lastOrderMs = d.createdAt;
      const age = Date.now() - d.createdAt;
      if (age > 120000) continue;
      const type = d.type === 'person' ? '👤 Йўловчи' : '📦 Жўнатма';
      const from = normalizeRegion(d.from || '');
      const to   = normalizeRegion(d.to || d.dest || '');
      console.log(`📦 Order: "${from}"→"${to}" id=${d.telegramId}`);
      if (!from || !to) continue;
      await notifySender(d.telegramId, from, to, type).catch(e => console.error('notifySender:', e.message));
      await notifyDrivers(from, to, type, d.telegramUsername || '', d.telegramId).catch(e => console.error('notifyDrivers:', e.message));
    }
  } catch(e) { console.error('pollOrders xato:', e.message); }
}

async function pollTravels() {
  try {
    const docs = await fsQuery('travels', lastTravelMs);
    for (const d of docs) {
      if (d.archived) continue;
      if (d.createdAt <= lastTravelMs) continue;
      lastTravelMs = d.createdAt;
      const age = Date.now() - d.createdAt;
      if (age > 120000) continue;
      const from = normalizeRegion(d.from || '');
      const to   = normalizeRegion(d.to || d.dest || '');
      console.log(`🚐 Travel: "${from}"→"${to}" id=${d.telegramId}`);
      if (!from || !to) continue;
      await notifySender(d.telegramId, from, to, '🚗 Сафар').catch(e => console.error('notifySender:', e.message));
      await notifyDrivers(from, to, '🚗 Сафар', d.telegramUsername || '', d.telegramId).catch(e => console.error('notifyDrivers:', e.message));
    }
  } catch(e) { console.error('pollTravels xato:', e.message); }
}

setInterval(pollOrders,  POLL_MS);
setInterval(pollTravels, POLL_MS);
console.log('✅ REST polling tayyor (har 6 soniya)');

// ── Admin broadcast ───────────────────────────────────────────────────────
let initAdminMsg = false;
db.collection('admin_messages').where('sent', '==', false).orderBy('createdAt', 'asc')
  .onSnapshot(async snap => {
    if (!initAdminMsg) { initAdminMsg = true; return; }
    for (const ch of snap.docChanges()) {
      if (ch.type !== 'added') continue;
      const ref = ch.doc.ref;
      const d   = ch.doc.data();
      const text = d.text || '';
      const to   = d.to || 'all';
      if (!text) { await ref.update({ sent: true, error: 'bo\'sh xabar' }); continue; }
      try {
        let chatIds = [];
        if (to === 'all') {
          const snap2 = await db.collection('users').where('chatId', '>', 0).get();
          chatIds = snap2.docs.map(d => d.data().chatId).filter(Boolean);
        } else if (to === 'drivers') {
          const snap2 = await db.collection('users').where('routeFrom', '!=', '').get();
          chatIds = snap2.docs.map(d => d.data().chatId).filter(Boolean);
        } else if (to === 'passengers') {
          const snap2 = await db.collection('orders').where('type', '==', 'person').get();
          const ids = [...new Set(snap2.docs.map(d => d.data().telegramId).filter(Boolean))];
          chatIds = ids;
        } else {
          chatIds = [Number(to) || to];
        }
        let sent = 0, failed = 0;
        for (const chatId of chatIds) {
          try {
            await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
            sent++;
          } catch (e) {
            console.warn(`⚠️ ${chatId} ga yuborib bo'lmadi: ${e.message}`);
            failed++;
          }
        }
        await ref.update({
          sent: true,
          sentCount: sent,
          failedCount: failed,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`📢 Broadcast: ${sent} ta yuborildi, ${failed} ta xato`);
      } catch (e) {
        console.error('Broadcast xatosi:', e.message);
        await ref.update({ sent: true, error: e.message });
      }
    }
  }, err => console.error('admin_messages listener xato:', err.message));

console.log('📡 Firestore va Telegram tinglanyapti...');
