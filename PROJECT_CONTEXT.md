# Pastekaro (Pastebin-Lite) - Complete Project Context

> **Last Updated:** January 25, 2026  
> **Purpose:** Comprehensive documentation for AI assistants to continue development.

---

## 📋 Project Overview

**Pastekaro** is a minimalist pastebin with powerful authenticated features. The design philosophy is:
- **Anonymous users**: Ultra-simple, zero-friction paste creation
- **Logged-in users**: Rich dashboard with collections, editing, and management

### Design Philosophy
| Mode | Experience |
|------|------------|
| **Anonymous** | Minimal UI → paste → get link → done |
| **Logged In** | Full dashboard with collections, paste editing, constraints, organization |

---

## 🎯 Feature Summary

### For Everyone (Anonymous)
- ✅ Create paste instantly (no signup required)
- ✅ Set TTL (time-to-live) expiration
- ✅ Set max views limit
- ✅ Get shareable URL

### For Logged-in Users
- ✅ **Dashboard** with tabs (Pastes / Collections)
- ✅ **Save pastes** to account (persisted in Postgres)
- ✅ **Edit pastes** (content, title, constraints) - URL stays same!
- ✅ **Collections** (group pastes together)
  - Create with name/description/privacy
  - Add pastes during creation OR from homepage
  - Edit collection details
  - Reorder pastes (drag up/down)
  - Remove pastes from collection
  - **Create new paste directly inside collection**
- ✅ **Public collection sharing** via `/c/[id]` URLs
- ✅ **View paste live** without leaving editor

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Next.js 16.1.1 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Database** | Vercel Postgres |
| **Cache/KV** | Redis (via ioredis) |
| **Auth** | NextAuth 4.24 (Credentials provider, JWT) |
| **IDs** | nanoid 5.1.6 |
| **Password** | bcryptjs 3.0.3 |

---

## 📁 Project Structure (Simplified)

```
pastebin-lite/
├── app/
│   ├── page.tsx                 # Homepage (paste creation)
│   ├── layout.tsx               # Root layout
│   ├── providers.tsx            # SessionProvider
│   │
│   ├── admin/page.tsx           # Admin dashboard
│   ├── auth/
│   │   ├── login/page.tsx       # Login
│   │   └── signup/page.tsx      # Signup
│   │
│   ├── c/[id]/page.tsx          # PUBLIC collection view
│   ├── p/[id]/page.tsx          # View single paste
│   ├── dashboard/page.tsx       # USER DASHBOARD (all-in-one)
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── auth/signup/route.ts
│       ├── pastes/route.ts           # POST: Create paste
│       ├── pastes/[id]/route.ts      # GET: View paste
│       ├── pastes/my/route.ts        # GET: User's pastes
│       ├── pastes/my/[id]/route.ts   # GET/PUT/DELETE: Edit paste
│       ├── collections/route.ts       # GET/POST: Collections
│       ├── collections/[id]/route.ts  # GET/PUT/DELETE/PATCH
│       └── collections/[id]/public/route.ts
│
├── lib/
│   ├── auth.ts                  # NextAuth config
│   ├── db.ts                    # Postgres connection
│   ├── kv.ts                    # Redis wrapper
│   └── paste.ts                 # Paste CRUD
│
└── types/
    ├── paste.ts
    └── next-auth.d.ts
```

---

## 🗄 Database Schema

### Users
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Packages (Collections)
```sql
CREATE TABLE packages (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Pastes
```sql
CREATE TABLE pastes (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  package_id VARCHAR(255) REFERENCES packages(id) ON DELETE SET NULL,
  order_in_package INTEGER DEFAULT 0,
  ttl_seconds INTEGER,
  max_views INTEGER,
  view_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🖥 Key UI Flows

### Homepage (Minimal)
```
[Logo: PasteKaro]           [Login] (if not logged in)
                            [Username] [Logout] (if logged in)

[Title input]  ← Only shows when "Save to account" checked
[Content textarea]
[TTL] [Max Views]
☐ Save to my account ← Only for logged-in users
  └─ [Collection dropdown] ← Select which collection to add to
[🚀 Create]

[Success: Link + Copy button]
```

### Dashboard (Rich)
```
[Username's Dashboard]                    [+ New Paste] [Logout]
[📄 Pastes (5)] [📦 Collections (3)]     ← Tabs

=== PASTES TAB ===
┌─────────────────────────────────────────────┐
│ Paste Title                    [Edit][View][Del] │
│ Preview text...                                   │
│ 👁 12 views • Jan 25                              │
└─────────────────────────────────────────────┘

=== COLLECTIONS TAB ===
[➕ Create New Collection]

┌──────────────────────────────┐
│ Collection Name        🌍     │
│ Description...                │
│ 5 items • Jan 25              │
│ [View] [Edit] 🔗 🔒 🗑        │
└──────────────────────────────┘
```

### Edit Collection Modal (2-column)
```
┌─────────────────────────────────────────────────────┐
│ Edit Collection                               [✕]  │
├─────────────────────────┬───────────────────────────┤
│ COLLECTION DETAILS      │ PASTES (3)  [+ New Paste] │
│                         │                           │
│ Name: [___________]     │ 1. Paste Title   ✏️ ↑↓ × │
│ Description: [______]   │ 2. Another Paste ✏️ ↑↓ × │
│                         │ 3. Third Paste   ✏️ ↑↓ × │
│ [🌍 Public] [🔒 Private]│                           │
├─────────────────────────┴───────────────────────────┤
│ [Save Changes]                         [Preview]    │
└─────────────────────────────────────────────────────┘
```

### Paste Editor Modal (Create/Edit)
```
┌─────────────────────────────────────────────────────┐
│ ← New Paste / Edit Paste               [View→] [✕] │
├────────────────────────────────┬────────────────────┤
│ Title: [___________]           │ SETTINGS           │
│                                │                    │
│ Content:                       │ Max Views: [___]   │
│ ┌─────────────────────────┐    │ TTL (sec): [___]   │
│ │                         │    │                    │
│ │  (code/text editor)     │    │ Views: 12          │
│ │                         │    │ ID: abc123         │
│ └─────────────────────────┘    │                    │
│                                │ 💡 URL stays same  │
├────────────────────────────────┴────────────────────┤
│ [Create/Save Paste]              [Back to Collection]│
└─────────────────────────────────────────────────────┘
```

---

## 🔌 API Reference

### Pastes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pastes` | Create paste (accepts `collectionId`) |
| GET | `/api/pastes/[id]` | View paste (public) |
| GET | `/api/pastes/my` | List user's pastes |
| GET | `/api/pastes/my/[id]` | Get paste for editing |
| PUT | `/api/pastes/my/[id]` | Update paste (title, content, constraints) |
| DELETE | `/api/pastes/my/[id]` | Delete paste |

### Collections

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections` | List user's collections |
| POST | `/api/collections` | Create collection (accepts `pasteIds`) |
| GET | `/api/collections/[id]` | Get collection details |
| PUT | `/api/collections/[id]` | Update collection & paste order |
| PATCH | `/api/collections/[id]` | Toggle privacy only |
| DELETE | `/api/collections/[id]` | Delete collection (pastes remain) |
| GET | `/api/collections/[id]/public` | Public view (no auth) |

---

## 🎨 Design System

### Colors (Dark Theme)
```css
/* Backgrounds */
--bg-gradient: from-slate-900 via-purple-900 to-slate-900
--glass: bg-white/10 backdrop-blur-xl border-white/20

/* Interactive */
--primary: from-blue-600 to-purple-600 (gradient)
--secondary: bg-white/10 hover:bg-white/20
--danger: bg-red-500/20 text-red-300

/* Text */
--text-primary: text-white
--text-secondary: text-gray-400
--text-muted: text-gray-500
```

### Common Patterns
```tsx
// Glass card
<div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl">

// Primary button
<button className="bg-gradient-to-r from-blue-600 to-purple-600">

// Input
<input className="bg-white/10 border border-white/20 rounded-lg text-white">

// Modal overlay
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm">
```

---

## 🔐 Environment Variables

```bash
# Database
POSTGRES_URL="..."

# Redis
REDIS_URL="..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Admin
ADMIN_SECRET="..."
```

---

## ✅ Completed Features (Phase 1 + Enhancements)

- [x] Anonymous paste creation (Redis)
- [x] User paste creation (Postgres)
- [x] TTL and max views
- [x] User authentication
- [x] Dashboard with tabs
- [x] Collections CRUD
- [x] Add paste to collection on creation (homepage)
- [x] Public collection view (`/c/[id]`)
- [x] **Edit paste** (content, title, constraints) - URL preserved
- [x] **Create paste inside collection modal**
- [x] **Unified paste editor UI** (create/edit modes)
- [x] Reorder pastes in collection
- [x] Remove pastes from collection
- [x] Toggle collection privacy
- [x] Copy collection link

---

## 🔮 Potential Future Features

- [ ] Add existing pastes to collection (from edit modal)
- [ ] Syntax highlighting
- [ ] Markdown preview
- [ ] Paste forking
- [ ] Tags/search
- [ ] Analytics
- [ ] Rate limiting
- [ ] API keys for programmatic access

---

## 🛠 Development Commands

```bash
npm install      # Install deps
npm run dev      # Dev server
npm run build    # Production build
npm start        # Start production
npm run lint     # Lint code
```

---

## 📌 Code Patterns

### Protected API Route
```typescript
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
// Use: session.user.id, session.user.email
```

### Database Query
```typescript
const result = await sql`SELECT * FROM pastes WHERE user_id = ${userId}`;
const pastes = result.rows;
```

### Modal State Pattern (Dashboard)
```typescript
type ModalType = 'none' | 'create-collection' | 'edit-collection' | 'edit-paste' | 'create-paste';
const [modal, setModal] = useState<ModalType>('none');
```

---

This document provides complete context for continuing development. For specific implementations, refer to the source files directly.
