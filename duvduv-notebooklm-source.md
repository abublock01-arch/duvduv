# duvduv — O'zbekiston yuk va yo'lovchi topish ilovasi

## Ilova haqida

duvduv — O'zbekiston viloyatlari o'rtasida yuk va yo'lovchi topish uchun Telegram Mini App. Foydalanuvchi alohida ilova yuklamasdan, to'g'ridan Telegram ichida ishlaydi.

Veb-sayt: https://duvduv.vercel.app  
Telegram: t.me/duvduv_bot

---

## Muammo

O'zbekistonda viloyatlar arasi yuk yuborish hali ham tartibsiz:

- Haydovchi topish uchun Telegram guruhlarda qidiruv kerak — vaqt ketadi
- Har safar qayerdan, qayerga, narx alohida muzokara qilinadi
- Haydovchi topilganini bilmaysiz — doim o'zingiz tekshirасиz
- Ishonchlilik past — notanish odamga yuk berishdan qo'rqish bor

---

## Yechim

duvduv uchta ishtirokchini avtomatik moslashtiradi:

**Jo'natuvchi** — Viloyat va tumanni tanlaydi, yukning rasmini yuklaydi, e'lon qo'yadi.

**duvduv Bot** — Yangi e'lonni ko'radi, barcha mos haydovchilarni topadi va ikkalasiga darhol Telegram xabari yuboradi.

**Haydovchi** — Oldindan marshrut belgilagan (masalan: Toshkent → Samarqand). Mos e'lon kelganda bildirishnoma oladi va jo'natuvchi bilan to'g'ridan bog'lanadi.

---

## Qanday ishlaydi — 4 qadam

1. **Telegram botni oching** — t.me/duvduv_bot ga kiring yoki «Қани бошладик» tugmasini bosing
2. **Viloyat va tuman tanlang** — Qayerdan qayerga. Yukning rasmini qo'shing
3. **E'lonni yuboring** — Bot darhol mos haydovchilarni qidiradi
4. **Haydovchi bog'lanadi** — Telegram orqali to'g'ridan muloqot boshlanadi

---

## Asosiy xususiyatlar

- **Xarita** — Barcha e'lonlar interaktiv xaritada ko'rinadi (Mapbox)
- **Bildirishnomalar** — Bot mos e'lon topilsa darhol Telegram xabari yuboradi
- **Telefon ulashish** — Foydalanuvchi raqamini ulasha oladi — haydovchi tez bog'lanadi
- **Rasm yuklash** — Yukning rasmini qo'shish mumkin — ishonch oshadi
- **Marshrut filtri** — Haydovchi faqat o'z yo'nalishdagi e'lonlarni oladi
- **Ikki rol** — Bitta ilovada ham jo'natuvchi, ham haydovchi bo'lish mumkin

---

## Texnologiyalar

| Qatlam | Texnologiya |
|--------|------------|
| Frontend | HTML, CSS, JavaScript (Telegram Mini App) |
| Xarita | Mapbox GL JS |
| Backend | Node.js (Telegram Bot) |
| Ma'lumotlar bazasi | Firebase Firestore |
| Frontend deploy | Vercel |
| Bot deploy | Railway |

---

## Foydalanuvchi oqimi — Jo'natuvchi

1. Ilova ochiladi → GPS joylashuv so'raladi
2. "Jo'natuvchi" rejimi → viloyat picker → tuman tanlash
3. Yukning rasmi olinadi (kamera yoki galereya)
4. "Yuborish" tugmasi → telefon raqam so'raladi (ixtiyoriy)
5. E'lon joylashtiriladi → darhol tasdiqlash xabari keladi
6. Bot mos haydovchilarga xabar yuboradi

## Foydalanuvchi oqimi — Haydovchi

1. "Haydovchi" tabiga o'tadi → GPS so'raladi
2. Marshrut belgilanadi (A viloyat → B viloyat)
3. Xaritada barcha mos e'lonlar ko'rinadi
4. Yangi mos e'lon kelsa → Telegram bildirishnomasi
5. Jo'natuvchi bilan Telegram orqali bog'lanadi

---

## Viloyatlar

Ilova O'zbekistonning barcha 13 viloyati + Qoraqalpog'istonni qamrab oladi:
Toshkent, Samarqand, Buxoro, Andijon, Farg'ona, Namangan, Qashqadaryo, Surxondaryo, Xorazm, Navoiy, Jizzax, Sirdaryo, Qoraqalpog'iston.

---

## Nima uchun Telegram?

- O'zbekistonda Telegram eng keng tarqalgan messenger
- Alohida ilova yuklamasdan ishlaydi
- Foydalanuvchi ma'lumotlari (telefon, ism) Telegram orqali tasdiqlanadi
- Push bildirishnomalar Telegram orqali ishlaydi — alohida ruxsat kerak emas
- Mini App texnologiyasi — native ilova kabi ko'rinish va his

---

## Video skript (60 soniya)

**[0-5 sek]**
"Viloyatlarga yuk yuborish kerakmi? Har safar Telegram guruhlarida haydovchi qidirasizmi?"

**[5-15 sek]**
"duvduv — bu muammoni hal qiladi. Telegram ichida, alohida ilova yuklamasdan."

**[15-30 sek]**
"Qanday ishlaydi? Birinchi: botni oching. Ikkinchi: qayerdan qayerga — viloyat va tumanni tanlang. Rasmni yuklang. Yuborish."

**[30-45 sek]**
"Bot darhol mos haydovchini topadi va ikkalangizga xabar yuboradi. Haydovchi Telegram orqali sizga yozadi — hamma narsa bir joyda."

**[45-55 sek]**
"Haydovchimisiz? Marshrut belgilang — faqat o'z yo'nalishingizdagi e'lonlarni olasiz. Vaqtni behuda sarflamaysiz."

**[55-60 sek]**
"t.me/duvduv_bot — hoziroq boshlang."
