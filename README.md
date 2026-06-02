# MonitoringSystem — Frontend

Frontend Next.js 14 untuk sistem monitoring pergerakan kendaraan terminal.

📖 **Dokumentasi lengkap project**: lihat [`../README.md`](../README.md)

---

## 🚀 Quick Start

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local dengan kredensial Anda
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## 📜 Available Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm start        # production server
npm run lint     # run ESLint
```

---

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS 4**
- **Recharts** (data visualization)
- **Lucide React** (icons)

---

## 📂 Folder Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Public routes
│   ├── (dashboard)/      # Protected routes
│   └── api/              # API routes
├── components/           # Reusable UI components
├── views/                # Page views per role
└── lib/                  # Utilities
```

---

## 🌐 Environment Variables

Lihat [`.env.local.example`](./.env.local.example) untuk daftar lengkap.

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-cron-secret
```

---

## 🚀 Deploy

### Vercel
1. Import repo
2. Root directory: `FE`
3. Set environment variables
4. Deploy

Build output: 15+ static & dynamic routes.
