# Firestore Security Rules — DuvDuv
> **Saqlangan:** 2026-05-27 | Ehtiyot nusxasi

## Qo'llash tartibi

1. [Firebase Console](https://console.firebase.google.com) → loyihangiz → **Firestore Database** → **Rules** tab
2. Mavjud hamma narsani o'chirib, quyidagi rules ni to'liq paste qiling
3. **Publish** tugmasini bosing

---

## Rules (to'liq, copy-paste tayyor)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // ───────── ESKI APP KOLLEKSIYALARI (o'zgarishsiz) ─────────

    match /drivers/{driverId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == driverId;
    }

    match /admins/{adminId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }

    match /screenshare/{docId} {
      allow read, write: if request.auth != null;
    }

    match /messages/{docId} {
      allow read, write: if request.auth != null;
    }

    match /notifications/{docId} {
      allow read, write: if request.auth != null;
    }

    match /calls/{docId} {
      allow read, write: if request.auth != null;
    }

    match /driver_routes/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /sandiqlar/{docId} {
      allow read, write: if request.auth != null;
    }

    match /groups/{docId} {
      allow read, write: if request.auth != null;
    }

    match /groupInvites/{docId} {
      allow read, write: if request.auth != null;
    }

    match /voiceMessages/{docId} {
      allow read, write: if request.auth != null;
    }

    match /connection_requests/{docId} {
      allow read, write: if request.auth != null;
    }

    match /yutuvchilar/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /ai_chats/{docId} {
      allow read, write: if request.auth != null;
    }

    match /aigo_knowledge/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /stations/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /ratings/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // ───────── DUVDUV KOLLEKSIYALARI (yangi, himoyalangan) ─────────

    match /users/{uid} {
      allow read: if true;
      allow create, update: if true;
      allow delete: if isAdmin();
    }

    match /orders/{orderId} {
      allow read: if true;
      allow create, update: if true;
      allow delete: if isAdmin();
    }

    match /travels/{docId} {
      allow read: if true;
      allow create, update: if true;
      allow delete: if isAdmin();
    }

    match /admin_messages/{docId} {
      allow read, write: if isAdmin();
    }

  }
}
```

---

## Muhim linklar

| Nima | Link |
|------|------|
| 🔥 Firebase Console | https://console.firebase.google.com |
| 📋 Firestore Rules | https://console.firebase.google.com/project/_/firestore/rules |
| 🔐 Authentication | https://console.firebase.google.com/project/_/authentication/users |
| 🌐 Authorized Domains | https://console.firebase.google.com/project/_/authentication/settings |
| 🚀 Vercel Dashboard | https://vercel.com/dashboard |
| 📦 GitHub Repo | https://github.com/ibnakrom/duvduv *(agar boshqa bo'lsa o'zgartiring)* |

---

## Asosiy o'zgarishlar (nima qilindi)

| Kolleksiya | Avval | Hozir |
|---|---|---|
| `users` | `read, write: if true` | read/write ochiq, **delete faqat admin** |
| `orders` | `read, write: if true` | read/write ochiq, **delete faqat admin** |
| `travels` | `read, write: if true` | read/write ochiq, **delete faqat admin** |
| `admin_messages` | `read, write: if true` | **faqat admin** (bot Admin SDK orqali ishlaydi) |

> **Eslatma:** Bot (`bot.js`) Firebase Admin SDK ishlatadi — u Firestore rules ni chetlab o'tadi, shuning uchun `admin_messages` ga yoza oladi.

---

## Admin UID

```
yWUpDVyai8dvIap9CVvgsPYAlRC2
```

Bu UID ni Firebase Console → Firestore → `admins` kolleksiyasiga document sifatida qo'shish kerak:

**Collection:** `admins`  
**Document ID:** `yWUpDVyai8dvIap9CVvgsPYAlRC2`  
**Fields:** `{ "email": "azimmmov@gmail.com" }` *(ixtiyoriy)*

---

## Firestore `admins` kolleksiyasini yaratish (bir marta)

Firebase Console → Firestore → **+ Start collection** → ID: `admins`  
→ **+ Add document** → Document ID: `yWUpDVyai8dvIap9CVvgsPYAlRC2`  
→ Field: `email` = `azimmmov@gmail.com` → **Save**
