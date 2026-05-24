# Cursor Prompt — Admin panelga "MiniApp" bo'limi qo'shish

## Vazifa
Admin panel loyihasiga duvduv Telegram Mini App uchun yangi bo'lim qo'shish kerak.
Bu bo'lim `orders`, `travels`, `users` kolleksiyalarini ko'rsatadi.

---

## Quyidagi fayllarni tahlil qil

Loyihaning asosiy fayllarini ko'rib chiq:
- `src/App.jsx` yoki `src/App.tsx` — router/routing qismi
- `src/components/Sidebar.jsx` yoki shunga o'xshash sidebar fayli
- `src/pages/` papkasidagi mavjud sahifalar (Sandiqcha, Aigo, Stansiyalar)

---

## Quyidagi faylni YANGI yaratish kerak

### `src/pages/MiniAppPage.jsx`

```jsx
import { useEffect, useState } from 'react'
import { db } from '../firebase' // yoki loyihadagi firebase import yo'li

// ─── Yordamchi funksiyalar ─────────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Hozir'
  if (diff < 3600000) return Math.floor(diff / 60000) + ' daq oldin'
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' soat oldin'
  return d.toLocaleDateString('uz', { day: 'numeric', month: 'short' })
}

function isToday(ts) {
  if (!ts) return false
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toDateString() === new Date().toDateString()
}

// ─── Asosiy komponent ──────────────────────────────────────────────────────

export default function MiniAppPage() {
  const [tab, setTab] = useState('stats')
  const [orders, setOrders] = useState([])
  const [travels, setTravels] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const unsub1 = db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .onSnapshot(snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

    const unsub2 = db.collection('travels')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .onSnapshot(snap => setTravels(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

    const unsub3 = db.collection('users')
      .orderBy('lastSeen', 'desc')
      .limit(1000)
      .onSnapshot(
        snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        () => {} // users rules cheklangan bo'lsa, bo'sh qoladi
      )

    return () => { unsub1(); unsub2(); unsub3() }
  }, [])

  async function deleteDoc(collection, id) {
    if (!confirm('Bu elonni o\'chirishni xohlaysizmi?')) return
    await db.collection(collection).doc(id).delete()
  }

  const todayCount = orders.filter(o => isToday(o.createdAt)).length
                   + travels.filter(t => isToday(t.createdAt)).length
  const drivers = users.filter(u => u.role === 'driver').length

  // Region statistics
  const regionMap = {}
  orders.forEach(o => {
    const r = (o.dest || '').split(' — ')[0] || 'Noma\'lum'
    regionMap[r] = (regionMap[r] || 0) + 1
  })
  travels.forEach(t => {
    const r = (t.to || t.dest || '').split(' — ')[0] || 'Noma\'lum'
    regionMap[r] = (regionMap[r] || 0) + 1
  })
  const regionStats = Object.entries(regionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const q = search.toLowerCase()
  const filteredOrders = orders.filter(o =>
    !q || (o.dest || '').toLowerCase().includes(q) || (o.telegramUsername || '').toLowerCase().includes(q)
  )
  const filteredTravels = travels.filter(t =>
    !q || (t.from || '').toLowerCase().includes(q) || (t.to || '').toLowerCase().includes(q) || (t.telegramUsername || '').toLowerCase().includes(q)
  )
  const filteredUsers = users.filter(u =>
    !q || (u.firstName || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q) || String(u.telegramId || '').includes(q)
  )

  const tabs = [
    { id: 'stats', label: 'Statistika', icon: '📊' },
    { id: 'orders', label: `Jo'natmalar (${orders.length})`, icon: '📦' },
    { id: 'travels', label: `Yo'lovchilar (${travels.length})`, icon: '🚗' },
    { id: 'users', label: `Foydalanuvchilar (${users.length})`, icon: '👥' },
  ]

  return (
    <div className="p-6 text-white min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gold">📱 Mini App — duvduv</h1>
        <p className="text-gray-400 text-sm mt-1">Telegram Mini App elonlari va foydalanuvchilari</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Jo\'natmalar', val: orders.length, color: 'text-blue-400' },
          { label: 'Yo\'lovchilar', val: travels.length, color: 'text-green-400' },
          { label: 'Foydalanuvchilar', val: users.length, color: 'text-gold' },
          { label: 'Bugun', val: todayCount, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-surfacelow border border-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{s.label}</div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch('') }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-gold text-dark'
                : 'bg-surfacelow text-gray-400 hover:text-white'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Search (orders/travels/users uchun) */}
      {tab !== 'stats' && (
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Qidirish..."
          className="w-full mb-4 px-4 py-2 bg-surfacelow border border-white/10 rounded-lg text-sm text-white outline-none focus:border-gold/50"
        />
      )}

      {/* STATS TAB */}
      {tab === 'stats' && (
        <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 text-sm font-semibold text-gray-300">
            Viloyatlar bo'yicha
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-2 text-gray-400 font-medium">Viloyat</th>
                <th className="text-right px-4 py-2 text-gray-400 font-medium">Elonlar</th>
              </tr>
            </thead>
            <tbody>
              {regionStats.length === 0 ? (
                <tr><td colSpan={2} className="text-center py-8 text-gray-500">Ma'lumot yo'q</td></tr>
              ) : regionStats.map(([r, c]) => (
                <tr key={r} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">{r}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="bg-gold/20 text-gold text-xs px-2 py-1 rounded-full font-semibold">{c}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-white/5 text-xs text-gray-500">
            Haydovchilar: {drivers} | Jo'natuvchilar: {users.length - drivers}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surfacelow">
                <th className="text-left px-4 py-2 text-gray-400">Manzil</th>
                <th className="text-left px-4 py-2 text-gray-400">Telegram</th>
                <th className="text-left px-4 py-2 text-gray-400">Vaqt</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Elonlar topilmadi</td></tr>
              ) : filteredOrders.map(o => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 max-w-[200px] truncate">{o.dest || '—'}</td>
                  <td className="px-4 py-3">
                    {o.telegramUsername ? (
                      <a href={`https://t.me/${o.telegramUsername.replace('@','')}`} target="_blank" rel="noreferrer"
                        className="text-gold hover:underline text-xs">{o.telegramUsername}</a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatTime(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteDoc('orders', o.id)}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400 px-2 py-1 rounded transition-all">
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TRAVELS TAB */}
      {tab === 'travels' && (
        <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surfacelow">
                <th className="text-left px-4 py-2 text-gray-400">Qayerdan</th>
                <th className="text-left px-4 py-2 text-gray-400">Qayerga</th>
                <th className="text-left px-4 py-2 text-gray-400">Telegram</th>
                <th className="text-left px-4 py-2 text-gray-400">Vaqt</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTravels.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Elonlar topilmadi</td></tr>
              ) : filteredTravels.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 max-w-[140px] truncate text-xs">{t.from || '—'}</td>
                  <td className="px-4 py-3 max-w-[140px] truncate text-xs">{t.to || t.dest || '—'}</td>
                  <td className="px-4 py-3">
                    {t.telegramUsername ? (
                      <a href={`https://t.me/${t.telegramUsername.replace('@','')}`} target="_blank" rel="noreferrer"
                        className="text-gold hover:underline text-xs">{t.telegramUsername}</a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatTime(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteDoc('travels', t.id)}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400 px-2 py-1 rounded transition-all">
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surfacelow">
                <th className="text-left px-4 py-2 text-gray-400">Telegram ID</th>
                <th className="text-left px-4 py-2 text-gray-400">Ism</th>
                <th className="text-left px-4 py-2 text-gray-400">Username</th>
                <th className="text-left px-4 py-2 text-gray-400">Rol</th>
                <th className="text-left px-4 py-2 text-gray-400">So'nggi faollik</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Foydalanuvchilar topilmadi</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{u.telegramId || u.id || '—'}</td>
                  <td className="px-4 py-3">{((u.firstName || '') + ' ' + (u.lastName || '')).trim() || '—'}</td>
                  <td className="px-4 py-3">
                    {u.username ? (
                      <a href={`https://t.me/${u.username}`} target="_blank" rel="noreferrer"
                        className="text-gold hover:underline text-xs">@{u.username}</a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === 'driver'
                        ? 'bg-blue-400/20 text-blue-400'
                        : 'bg-gray-400/20 text-gray-400'
                    }`}>
                      {u.role === 'driver' ? '🚗 Haydovchi' : '📦 Jo\'natuvchi'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatTime(u.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

---

## App.jsx (yoki Router) ga qo'shish

Mavjud routing/switch da yangi route qo'sh:

```jsx
import MiniAppPage from './pages/MiniAppPage'

// routes/switch ichida:
{ path: '/miniapp', component: <MiniAppPage /> }
// yoki agar switch/case ishlatilsa:
case '/miniapp': return <MiniAppPage />
```

---

## Sidebar ga qo'shish

Mavjud sidebar navigation itemlari orasiga qo'sh (Sandiqcha, Aigo, Stansiyalar yoniga):

```jsx
{
  path: '/miniapp',
  label: 'Mini App',
  icon: '📱',   // yoki mavjud ikonka uslubida SVG
}
```

---

## Muhim: Design tokenlar (Tailwind config)

Mavjud config ga asoslangan ranglar:
- `bg-dark` = `#0A0A0F`
- `bg-surface` = `#131318`  
- `bg-surfacelow` = `#1B1B20`
- `text-gold`, `bg-gold` = `#FFCC00`
- `text-dark` = qoʻngʻir/qora

---

## Qisqacha aytganda

1. `src/pages/MiniAppPage.jsx` — yuqoridagi kodni to'liq nusxala
2. `App.jsx` — `/miniapp` routini qo'sh
3. Sidebar — "📱 Mini App" tugmasini qo'sh
4. Firebase import — mavjud loyihadagi `db` importidan foydalan
5. `npm run dev` — tekshir
6. `firebase deploy` — deploy qil
