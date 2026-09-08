# Rescue Arc Frontend — Marketing & Dashboard App

## 🌿 Fresh Natural White & Light Green Design System

The Rescue Arc frontend features a scrollable, high-impact marketing experience built with Next.js 15, Tailwind v4, and custom geospatial telemetry components.

### 🎨 Theme & Color Variables (`src/app/globals.css`)
- `--bg-light-white`: `#ffffff` (Pure crisp white backgrounds)
- `--bg-light-sage`: `#f0fdf4` (Light sage green section container backdrops)
- `--bg-light-mint`: `#e6f4ea` (Soft mint accents)
- `--forest-pine`: `#064e3b` (Deep evergreen text & headings)
- `--forest-leaf`: `#059669` (Fresh leaf green highlights)
- `--earth-amber`: `#d97706` (Wildfire, landslide & warning highlights)
- `--authority-navy`: `#1e3a8a` (NDRF & official authority badge slate navy)

### 🧩 Marketing Page Components (`src/components/marketing/`)
- `Navbar.jsx`: Translucent white/sage navigation bar with smooth scroll anchors (`#home`, `#authorities`, `#features`, `#how-it-works`, `#impact`) and NDRF 1078 helpline button.
- `Home/HomeSection.jsx`: Scrollable hero section with real-time multi-hazard monitor, NDRF operational status pill, and impact stat cards.
- `Authority/AuthorityHubSection.jsx`: Dedicated NDRF, SDMA, Forest Dept, and Central Water Commission operational matrix.
- `Features/FeaturesSection.jsx`: Multi-hazard interactive switcher (Wildfires, Flash Floods, Landslides, Cyclones).
- `HowItWorks/HowItWorkSection.jsx`: 4-step authority & citizen response protocol.
- `Impact/ImpactSection.jsx`: Real-time impact metrics and organizational onboarding CTA.
- `footer.tsx`: Light green multi-column footer with emergency numbers & disaster management links.

## 🚀 Running the Frontend

Run from root directory or `frontend/` directory using `pnpm`:

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.
