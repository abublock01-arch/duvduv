/**
 * duvduv Bot — chiroyli, qulay, professional
 */

const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// ── Firebase ──────────────────────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
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
  const name = user.first_name || 'Do\'st';
  const chatId = msg.chat.id;

  try {
    const existing = await getUser(user.id);

    if (existing && existing.role) {
      await saveUser(user);
      const roleText = existing.role === 'driver' ? '🚗 Ҳайдовчи' : '📦 Жўнатувчи';

      await bot.sendMessage(chatId,
        `👋 Қайта келдингиз, *${name}*!\n\n` +
        `Ролингиз: ${roleText}\n\n` +
        `Янги эълонлар ҳақида хабардор қиламиз 🔔`,
        {
          parse_mode: 'Markdown',
          reply_markup: persistentKeyboard
        }
      );
      await bot.sendMessage(chatId, '⚙️ Созламалар:', {
        reply_markup: mainMenu()
      });
    } else {
      await saveUser(user);

      await bot.sendMessage(chatId,
        `👋 Салом, *${name}*!\n\n` +
        `*duvduv* — Ўзбекистон бўйлаб юк ва йўловчи ташиш платформаси.\n\n` +
        `Бошлаш учун тугмани босинг 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: persistentKeyboard
        }
      );
      await bot.sendMessage(chatId, '👇 Иловани очинг:', {
        reply_markup: openAppInline
      });
      await bot.sendMessage(chatId, '👇 Ролни танланг:', {
        reply_markup: roleMenu
      });
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

  await bot.sendMessage(msg.chat.id,
    `📋 *Асосий меню*`,
    {
      parse_mode: 'Markdown',
      reply_markup: notifMenu(notif)
    }
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

      await bot.editMessageText(
        `✅ Ажойиб, *${user.first_name}*!\n\n` +
        `Ролингиз: *${roleText}*\n\n` +
        `${role === 'driver'
          ? 'Тошкентдан Самарқанд, Бухоро ёки бошқа шаҳарга кетаяотганингизда мос жўнатмалар ҳақида хабардор қиламиз! 🚗'
          : 'Юк ёки одам жўнатишингиз керак бўлганда мос ҳайдовчиларни топинг! 📦'
        }`,
        {
          chat_id: chatId,
          message_id: msgId,
          parse_mode: 'Markdown',
          reply_markup: mainMenu()
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

// ── Yangi order → mos haydovchilarga xabar ───────────────────────────────
let initialized = false;
db.collection('orders')
  .orderBy('createdAt', 'desc')
  .onSnapshot(async (snap) => {
    if (!initialized) { initialized = true; return; } // Birinchi yuklanishni o'tkazib yuborish

    for (const change of snap.docChanges()) {
      if (change.type !== 'added') continue;

      const order = change.doc.data();
      const createdAt = order.createdAt?.toDate?.() || new Date(0);
      if (Date.now() - createdAt.getTime() > 30_000) continue;

      const from = order.from || '';
      const to = order.to || '';
      const type = order.type === 'person' ? '👤 Yo\'lovchi' : '📦 Jo\'natma';
      const sender = order.telegramUsername || '';

      if (!from || !to) continue;

      try {
        // Mos haydovchilarni topish
        const usersSnap = await db.collection('users')
          .where('role', '==', 'driver')
          .where('notifications', '==', true)
          .get();

        for (const doc of usersSnap.docs) {
          const driver = doc.data();
          if (!driver.chatId) continue;

          // Haydovchining tanlangan viloyati mos kelsa
          const driverRegion = driver.region || '';
          if (driverRegion && driverRegion !== from && driverRegion !== to) continue;

          const text =
            `🔔 *Yangi e'lon!*\n\n` +
            `${type}\n` +
            `📍 ${from} → ${to}\n` +
            (sender ? `👤 ${sender}\n` : '') +
            `\n_Mini appda batafsil ko'ring_ 👇`;

          await bot.sendMessage(driver.chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: MENU_BTN_TEXT, web_app: { url: APP_URL } }
              ]]
            }
          });
        }
      } catch (err) {
        console.error('Notification xatosi:', err.message);
      }
    }
  });

console.log('📡 Firestore va Telegram tinglanyapti...');
