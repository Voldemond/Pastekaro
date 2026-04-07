# Pastekaro (Pastebin-Lite)

**Pastekaro** is a minimalist, modern, and powerful pastebin application built with Next.js. It features a unique dual-mode architecture that caters to both anonymous users looking for quick text sharing and power users who want persistent organization.

---

## 🎯 What Problem Does It Solve?

Traditional pastebins often force a choice: either they are too simple (you lose track of your pastes, no editing, no organization) or they are too complex (requiring accounts to do anything, cluttered UIs). 

**Pastekaro solves this by offering a frictionless workflow:**
1. **The Fast Path:** Anyone can drop text, set expiry constraints (time or views), and instantly get a shareable link. No sign-up required.
2. **The Power Path:** Logged-in users get a dedicated dashboard to save, edit, and organize their pastes into thematic collections. They can edit an existing paste to fix typos without the URL ever changing, solving the "I shared a broken link" problem.

## ✨ Functionalities & Features

### For Everyone (Anonymous Mode)
- **Zero-Friction Creation:** Paste text and get a link instantly.
- **Auto-Destruct (TTL):** Set a Time-to-Live (e.g., 3600 seconds) after which the paste automatically deletes itself.
- **Burn After Reading:** Set a Maximum View count (e.g., 5 views). After the 5th view, the paste self-destructs.
- **Fast Storage:** Powered by Vercel KV (Redis) for ultra-low latency reads and native TTL support.

### For Authenticated Users (Power Mode)
- **User Accounts:** Secure authentication powered by NextAuth (custom Credentials provider).
- **Persistent Storage:** Pastes saved to the account are stored permanently in PostgreSQL.
- **Rich Dashboard:** A comprehensive centralized view of all your pastes and collections.
- **Editable Pastes:** Fix typos or update code! Logged-in users can edit paste content, title, and constraints while **preserving the original URL**.
- **Collections (Packages):** 
  - Group related pastes into named Collections.
  - Set Collections as Public (🌍) or Private (🔒).
  - Share a single link to a Collection (`/c/[id]`) so others can view all associated pastes.
  - Manage ordering: easily drag or move pastes up and down within a collection.
  - Add new pastes directly from inside the collection manager.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database (Relational)**: Vercel Postgres (for Users, Collections, saved Pastes)
- **Database (Key-Value)**: Vercel KV / Redis (for anonymous temporary pastes)
- **Authentication**: NextAuth.js (v4) with JWT strategy and bcrypt password hashing
- **ID Generation**: `nanoid` for short, URL-friendly IDs

## 🚀 Running Locally

### Prerequisites

- Node.js 18+ installed
- Vercel account (for Postgres & KV databases)
- Vercel CLI installed (`npm i -g vercel`)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pastebin-lite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Vercel Environment (Postgres, KV, Auth)**
   ```bash
   vercel login
   vercel link
   vercel env pull .env.local
   ```
   *Make sure you have added `NEXTAUTH_SECRET` and `NEXTAUTH_URL=http://localhost:3000` to your local `.env.local` file.*

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## ☁️ Deployment

When deploying to Vercel, ensure you have set all required environment variables in your Vercel Project Settings:

1. `POSTGRES_URL` (Auto-configured if you use Vercel Storage)
2. `REDIS_URL` / `KV_URL` (Auto-configured if you use Vercel Storage)
3. `NEXTAUTH_SECRET` (Run `openssl rand -base64 32` to generate one)
4. `NEXTAUTH_URL` (e.g., `https://pastekaro.vercel.app`)

## 🛣️ API Endpoints

The app exposes a robust API to power its client-side interactions:

- **Auth**: `/api/auth/signup`, NextAuth routes
- **Anonymous Pastes**: `POST /api/pastes`, `GET /api/pastes/[id]`
- **Authenticated Pastes**: `GET /api/pastes/my`, `GET/PUT/DELETE /api/pastes/my/[id]`
- **Collections**: `GET/POST /api/collections`, `GET/PUT/DELETE/PATCH /api/collections/[id]`
- **Public View**: `GET /api/collections/[id]/public`

## 📜 License

MIT