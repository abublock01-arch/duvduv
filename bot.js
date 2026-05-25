/**
 * duvduv Bot — chiroyli, qulay, professional
 */

const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// ── Firebase ──────────────────────────────────────────────────────────────
const serviceAccount = require('./yolcar-30649-firebase-adminsdk-fbsvc-491c85b007.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'yolcar-30649',
});
const db = admin.firestore();

// ── Bot ───────────────────────────────────────────────────────────────────
const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) { console.error('❌ BOT_TOKEN topilmadi'); process.exit(1); }

const bot = new TelegramBot(TOKEN, { polling: true });
const APP_URL = 'https://duvduv.vercel.app';

console.log('✅ duvduv bot ishga tushdi');

// Menu tugmasi — «Қани бошладик» (pastdagi ko'k tugma, URL emas)
const MENU_BTN_TEXT = 'Қани бошладик';
bot.setChatMenuButton({
  menu_button: { type: 'web_app', text: MENU_BTN_TEXT, web_app: { url: APP_URL } }
})
  .then(() => console.log('✅ Menu tugmasi:', MENU_BTN_TEXT))
  .catch(err => console.warn('Menu tugmasi:', err.message));

// ── Persistent klaviatura ───────────────────────────────────────────────
const persistentKeyboard = {
  keyboard: [[
    { text: MENU_BTN_TEXT, web_app: { url: APP_URL } }
  ]],
  resize_keyboard: true,
  persistent: true
};

const openAppInline = {
  inline_keyboard: [[
    { text: MENU_BTN_TEXT, web_app: { url: APP_URL } }
  ]]
};

// ── Yordamchi funksiyalar ─────────────────────────────────────────────────
const mainMenu = () => ({
  inline_keyboard: [
    [{ text: MENU_BTN_TEXT, web_app: { url: APP_URL } }],
    [{ text: '🔔 Хабарномалар: ёқилган', callback_data: 'notif_off' }],
    [{ text: '🔄 Ролни ўзгартириш', callback_data: 'change_role' }],
  ]
});

const roleMenu = {
  inline_keyboard: [
    [
      { text: '🚗 Ҳайдовчи', callback_data: 'role_driver' },
      { text: '📦 Жўнатувчи', callback_data: 'role_sender' },
    ]
  ]
};

const notifMenu = (notif) => ({
  inline_keyboard: [
    [{ text: MENU_BTN_TEXT, web_app: { url: APP_URL } }],
    notif
      ? [{ text: '🔔 Хабарномалар: ёқилган ✓', callback_data: 'notif_off' }]
      : [{ text: '🔕 Хабарномалар: ўчирилган', callback_data: 'notif_on' }],
    [{ text: '🔄 Ролни ўзгартириш', callback_data: 'change_role' }],
  ]
});

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

// Vaqtinchalik sessiya (A manzilni saqlash)
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
  const name = user.first_name || 'Дўст';
  const chatId = msg.chat.id;

  try {
    await saveUser(user);
    const existing = await getUser(user.id);

    if (existing && existing.role) {
      // Қайтган фойдаланувчи
      await bot.sendMessage(chatId,
        `👋 Хуш келибсиз, *${name}*!\n\n` +
        `🚀 duvduv — юк ва йўловчи топиш платформаси\n\n` +
        `Қуйидаги тугмани босиб иловани очинг 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🚀  Қани бошладик  →', web_app: { url: APP_URL } }
            ]]
          }
        }
      );
    } else {
      // Янги фойдаланувчи — хабарнома рухсати
      await bot.sendMessage(chatId,
        `👋 Салом, *${name}*!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔔 *Хабарнома рухсати*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `duvduv сизга муҳим хабарлар юборади:\n\n` +
        `   📦  Юкингизга ҳайдовчи топилганда\n` +
        `   👤  Йўловчи сўрови келганда\n` +
        `   ⏰  Эълон муддати тугаётганда\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Рухсат бериш учун тугмани босинг_ 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅  Ҳа, рухсат бераман  →', web_app: { url: APP_URL } }
            ]]
          }
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
      [{ text: '🚀  Қани бошладик  →', web_app: { url: APP_URL } }],
      ...(isDriver ? [[{ text: `🗺 Йўналиш: ${fromCity} → ${toCity}`, callback_data: 'set_route' }]] : []),
      [notif
        ? { text: '🔔 Хабарномалар: ёқилган ✓', callback_data: 'notif_off' }
        : { text: '🔕 Хабарномалар: ўчирилган', callback_data: 'notif_on' }
      ],
    ]
  };

  await bot.sendMessage(msg.chat.id,
    `📋 *Менюм*`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
});

// ── /stop ─────────────────────────────────────────────────────────────────
bot.onText(/\/stop/, async (msg) => {
  await db.collection('users').doc(String(msg.from.id)).set(
    { notifications: false },
    { merge: true }
  );
  await bot.sendMessage(msg.chat.id,
    `🔕 Хабарномалар ўчирилди.\n\nҚайта ёқиш учун /menu юборинг.`
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
      const roleText = role === 'driver' ? '🚗 Ҳайдовчи' : '📦 Жўнатувчи';

      await saveUser(user, { role });

      if (role === 'driver') {
        await bot.editMessageText(
          `✅ Ажойиб, *${user.first_name}*! Сиз ҳайдовчисиз 🚗\n\n📍 Қаердан кетасиз? *(А нуқта)*`,
          { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: regionKeyboard('from') }
        );
      } else {
        await bot.editMessageText(
          `✅ Ажойиб, *${user.first_name}*!\n\nЮк ёки одам жўнатиш учун иловани очинг 📦`,
          { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🚀 Қани бошладик →', web_app: { url: APP_URL } }]] }
          }
        );
      }
    }

    // Yo'nalish o'rnatish
    if (data === 'set_route') {
      await bot.editMessageText(
        `🗺 *Йўналишни танланг*\n\n📍 Қаердан кетасиз? *(А нуқта)*`,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: regionKeyboard('from') }
      );
    }

    // A nuqta tanlandi
    if (data.startsWith('from:')) {
      const city = data.split(':')[1];
      driverSession[user.id] = { from: city };
      await bot.editMessageText(
        `✅ *А нуқта:* ${city}\n\n📍 Қаерга кетасиз? *(Б нуқта)*`,
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
        `✅ *Йўналиш сақланди!*\n\n` +
        `🚗 ${fromCity} → ${city}\n\n` +
        `Энди бу йўналишдаги эълонлар ҳақида хабардор қиламиз 🔔`,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🚀 Қани бошладик →', web_app: { url: APP_URL } }]] }
        }
      );
    }

    if (data === 'change_role') {
      await bot.editMessageText(
        `🔄 Янги ролни танланг:`,
        {
          chat_id: chatId,
          message_id: msgId,
          reply_markup: roleMenu
        }
      );
    }

    // Xabarnomani o'chirish
    if (data === 'notif_off') {
      await db.collection('users').doc(String(user.id)).set(
        { notifications: false },
        { merge: true }
      );
      const existing = await getUser(user.id);
      await bot.editMessageReplyMarkup(notifMenu(false), {
        chat_id: chatId,
        message_id: msgId,
      });
      await bot.answerCallbackQuery(query.id, { text: '🔕 Хабарномалар ўчирилди' });
    }

    // Xabarnomani yoqish
    if (data === 'notif_on') {
      await db.collection('users').doc(String(user.id)).set(
        { notifications: true },
        { merge: true }
      );
      await bot.editMessageReplyMarkup(notifMenu(true), {
        chat_id: chatId,
        message_id: msgId,
      });
      await bot.answerCallbackQuery(query.id, { text: '🔔 Хабарномалар ёқилди' });
    }

    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error('Callback xatosi:', err.message);
  }
});


// ── Yangi travel → mos haydovchilarga xabar ──────────────────────────────
async function notifyDrivers(from, to, type, sender) {
  if (!from || !to) return;
  const usersSnap = await db.collection('users')
    .where('role', '==', 'driver')
    .where('notifications', '==', true)
    .get();

  for (const doc of usersSnap.docs) {
    const driver = doc.data();
    if (!driver.chatId) continue;

    const driverFrom = driver.routeFrom || '';
    const driverTo   = driver.routeTo   || '';
    if (driverFrom && driverTo) {
      const match = (driverFrom === from && driverTo === to) ||
                    (driverFrom === to   && driverTo === from);
      if (!match) continue;
    }

    const text =
      `🔔 *Янги эълон!*\n\n` +
      `${type}\n` +
      `📍 ${from} → ${to}\n` +
      (sender ? `👤 ${sender}\n` : '') +
      `\n_Mini appda batafsil ko'ring_ 👇`;

    await bot.sendMessage(driver.chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: MENU_BTN_TEXT, web_app: { url: APP_URL } }]] }
    });
  }
}

let initOrders = false;
db.collection('orders').orderBy('createdAt','desc')
  .onSnapshot(async snap => {
    if (!initOrders) { initOrders = true; return; }
    for (const ch of snap.docChanges()) {
      if (ch.type !== 'added') continue;
      const d = ch.doc.data();
      if (Date.now() - (d.createdAt?.toDate?.() || new Date(0)).getTime() > 30000) continue;
      const type = d.type === 'person' ? '👤 Йўловчи' : '📦 Жўнатма';
      await notifyDrivers(d.from||'', d.to||'', type, d.telegramUsername||'').catch(console.error);
    }
  });

let initTravels = false;
db.collection('travels').orderBy('createdAt','desc')
  .onSnapshot(async snap => {
    if (!initTravels) { initTravels = true; return; }
    for (const ch of snap.docChanges()) {
      if (ch.type !== 'added') continue;
      const d = ch.doc.data();
      if (Date.now() - (d.createdAt?.toDate?.() || new Date(0)).getTime() > 30000) continue;
      await notifyDrivers(d.from||'', d.to||d.dest||'', '🚗 Сафар', d.telegramUsername||'').catch(console.error);
    }
  });

console.log('📡 Firestore va Telegram tinglanyapti...');
