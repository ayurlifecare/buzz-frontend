<div align="center">

# 🛒 Buzz Mart — Customer Web
### Next.js 16 · React 19 · TypeScript · v2.0.0

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/buzz-mart-web)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/buzz-mart-web)

</div>

## ⚡ Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/buzz-mart-web.git
cd buzz-mart-web

cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_ADMIN_PANEL_URL

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Required Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ADMIN_PANEL_URL` | Your backend URL e.g. `https://api.yourdomain.com` |
| `NEXT_PUBLIC_SITE_URL` | Your site URL e.g. `https://yourdomain.com` |
| `NEXT_PUBLIC_SSR` | `true` for Vercel/Node, `false` for static export |

## 🚀 Deploy

### Vercel (SSR — recommended)
1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add env vars in dashboard
4. Done ✓

### Netlify (Static)
1. Push to GitHub  
2. Connect at [app.netlify.com](https://app.netlify.com)
3. `netlify.toml` auto-configures the build
4. Add env vars in dashboard

## 📁 Structure

```
src/
├── components/     # UI components (Location, Cart, etc.)
├── pages/          # Next.js pages
├── contexts/       # React contexts (Settings, Auth)
├── hooks/          # Custom hooks
├── helpers/        # Utility functions
├── routes/         # API client functions
├── stores/         # Redux stores
├── types/          # TypeScript types
└── views/          # Page-level view components
```

## 📍 Location Feature

- 🔍 **Search** — Type any address/city in the search box
- 📍 **Auto-detect** — Click the GPS icon (requires HTTPS + browser permission)
- 🗺️ **Map pick** — Click anywhere on the map to set location
- 🔄 **Drag marker** — Drag the red pin to fine-tune

If auto-detect fails (browser blocked / HTTP), a clear message guides users to search manually.
