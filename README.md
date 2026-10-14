# Haven Property Co.

[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth%20%2B%20Storage-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![React Router](https://img.shields.io/badge/React%20Router-v7-f44250?style=flat-square&logo=reactrouter)](https://reactrouter.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

A high-performance, editorial luxury property brokerage platform and staff content management system (CMS) tailored for boutique brokerages and independent real estate agencies managing 100–300 curated listings.

Designed with an editorial architectural aesthetic, Haven eliminates aggregator portal spam, unverified listings, and duplicate inventory by providing an authentic, staff-managed real estate experience.

---

## 🌟 Highlights & Key Features

### 🏛️ Public Experience
- **Curated Editorial Interface**: Warm, typography-driven architectural aesthetic with seamless **Light and Dark themes** adhering strictly to WCAG AA/AAA contrast guidelines.
- **Smart Search & Live Autocomplete**: Instant debounced search querying property titles, neighborhoods, cities, and property types with keyboard arrow navigation.
- **Context-Aware Filtering**:
  - Filter by City/Locality, Property Type, Bedrooms, Bathrooms, Furnishing, Parking, Availability, and specific Amenities.
  - **Dynamic Price Presets**: Automatically distinguishes between capital acquisition budgets (`₹1 Cr–3 Cr`, `₹3 Cr–5 Cr`, `₹5 Cr+`) and monthly rental budgets (`Under ₹50k`, `₹50k–1L`, `₹1L–2.5L`, `₹2.5L+`).
  - Full URL synchronization so every filter state is bookmarkable and shareable.
- **Head-to-Head Comparison Matrix**:
  - Compare up to 3 properties side-by-side on price, price-per-square-foot, configuration, floor, parking, and an amenity checklist.
  - Accessible directly from individual property detail pages or from the saved shortlist.
  - Includes a dedicated print-optimized view.
- **Interactive Mortgage & EMI Calculator**:
  - Real-time monthly payment calculation based on home price, down payment percentage, interest rate, and tenure.
  - One-tap preset chips for quick down payment adjustments (10%, 20%, 25%, 30%, 40%) and tenure adjustments (10y, 15y, 20y, 25y, 30y).
  - Expandable **Amortization Milestone Schedule** calculating principal, interest, and remaining balance at Years 1, 3, 5, 10, 15, 20, and payoff.
- **High-End Photo Stories & Gallery**:
  - Responsive image carousel with touch gestures on mobile and **keyboard arrow navigation** on desktop.
  - High-resolution modal Lightbox photo viewer.
  - Browser-side progressive image optimization with placeholder fallback for missing/broken images.
- **Viewing Requests & Lead Capture**:
  - Guided viewing scheduler supporting both **In-person private tours** and **Live video walkthroughs**.
  - Client-selected preferred communication channel (**WhatsApp**, **Phone Call**, **Email**).
  - Spam protection via honeypot fields without intrusive captchas.
- **Privacy & Map Integration**:
  - The exact address is kept strictly internal. Public views show locality and city.
  - Approximate maps use opt-in OpenStreetMap embeds with customizable zoom levels.
- **Client Shortlist & Preferences**:
  - Save properties locally (zero sign-up friction) with cross-tab reactive updates.
  - One-click shortlist sharing via native Web Share API or clipboard copy.
  - Unit toggle (Square Feet ↔ Square Meters) with instant recalculation.

---

### 🛡️ Staff CMS & Brokerage Operations
- **Role-Based Access Control (RBAC)**: Powered by Supabase Auth and `staff_profiles` with `owner`, `admin`, and `editor` privileges. Authenticated visitors are never granted staff rights by default.
- **Property Lifecycle & Inventory Control**:
  - Draft → Review → Publish / Unpublish workflow.
  - Mark listings as *Available*, *Under offer*, or *Sold*.
  - Strict pre-publish data validation (numeric bounds, required media, floor consistency).
  - Bulk actions: batch publish, unpublish, or mark as sold across multiple listings in one click.
- **Media Asset Manager**:
  - Direct upload of property photography and architectural floor plans to Supabase Storage (`property-media`).
  - Drag-and-drop ordering and primary image designation.
- **Lead & Enquiry Pipeline**:
  - Track viewing inquiries across a 6-stage funnel: `New` → `Contacted` → `Viewing requested` → `Qualified` → `Closed` → `Lost`.
  - Assign leads to internal agents, add private notes, view requested viewing dates, and trigger one-click WhatsApp, call, or email actions.
- **Brokerage Settings**:
  - Custom hero banner images and promotional offer modal popups.
  - Dynamic city / active location manager with quick tag management and real-time validation.

---

### ⚡ Performance & Technical Architecture
- **Zero-Latency Navigation**: Implements Stale-While-Revalidate (SWR) browser caching for instant page transitions.
- **Security Boundary**: Public pages query an isolated PostgreSQL database view (`public_properties`) that strips out private addresses, coordinates, and internal staff notes at the database level.
- **SEO & Discovery**:
  - Dynamic Schema.org JSON-LD structured data (`Residence`, `RealEstateAgent`).
  - Prebuild automated sitemap and `robots.txt` generation directly querying published listings.
  - Social media meta cards (Open Graph / Twitter).
- **Print Stylesheet**: Generates clean, branded physical property brochures when visitors or brokers press Print (`Ctrl+P` / `Cmd+P`).

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, React Router v7, Vite 5 |
| **Styling** | Vanilla CSS3 (Custom design system, CSS Variables, Theme switching) |
| **Icons** | Lucide React |
| **Backend / Database** | Supabase (PostgreSQL 15, Row Level Security, Triggers, Views) |
| **Authentication** | Supabase Auth (JWT, email/password) |
| **Storage** | Supabase Storage (Bucket: `property-media`) |
| **Tooling & Scripts** | Node.js (automated sitemap generation) |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.x or higher
- npm or pnpm or yarn
- A Supabase account (free tier works great)

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/your-username/haven-website.git
cd haven-website
npm install
```

### 3. Supabase Configuration

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run the schema file:
   - For a clean setup: execute [`supabase/schema.sql`](supabase/schema.sql).
   - *(Optional for testing)*: execute [`supabase/seed.sql`](supabase/seed.sql) to populate sample listings and team members.
3. In **Storage**, ensure the `property-media` bucket is created and marked as public (handled automatically by `schema.sql`).
4. In **Authentication → Users**, create your staff user (e.g. `admin@haven.com`).
5. In the **SQL Editor**, grant your user staff privileges:

```sql
insert into public.staff_profiles (user_id, full_name, role)
values ('YOUR-USER-UUID-FROM-AUTH-TAB', 'Founder & Director', 'owner');
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Populate `.env` with your project credentials:

```ini
# Supabase credentials (found in Project Settings -> API)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Production Site Details
VITE_SITE_URL=http://localhost:5173
VITE_SITE_NAME=Haven Property Co.
VITE_COMPANY_PHONE=+91 98200 12345
VITE_COMPANY_EMAIL=hello@havenproperty.co
VITE_COMPANY_WHATSAPP=919820012345
VITE_CITIES=Mumbai,Pune,Bengaluru,Alibaug
```

> **Security Note:** Only expose the Supabase `anon` key in `VITE_SUPABASE_ANON_KEY`. Never expose your `service_role` key in frontend code or environment files. All permissions are enforced safely via Postgres Row Level Security (RLS).

---

## 💻 Development & Build Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server at `http://localhost:5173` |
| `npm run build` | Generates sitemap, robots.txt, and compiles the production bundle in `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run prebuild` | Executes the sitemap generator script (`scripts/generate-sitemap.mjs`) |

---

## 📁 Project Structure

```text
haven-website/
├── public/                     # Static assets (favicons, manifest, placeholders)
├── scripts/
│   └── generate-sitemap.mjs    # Automated sitemap & robots.txt generator
├── src/
│   ├── components/             # Reusable modular UI components
│   │   ├── Chrome.jsx          # Header, footer, theme toggle, mobile navigation
│   │   ├── CompareModal.jsx    # Side-by-side property comparison matrix
│   │   ├── DataState.jsx       # Skeletons, shimmers, error states
│   │   ├── FilterPanel.jsx     # Faceted search & dynamic price preset filters
│   │   ├── Listing.jsx         # Property browse grid, toolbar & view toggle
│   │   ├── MortgageCalculator.jsx # Live EMI calculator & amortization milestones
│   │   ├── PropertyBits.jsx    # PropertyCard, SearchBox with autocomplete, EnquiryModal
│   │   ├── ScrollReveal.jsx    # IntersectionObserver animation wrappers
│   │   ├── ShareModal.jsx      # Social & clipboard property sharing modal
│   │   └── Toast.jsx           # Global notification toast provider
│   ├── lib/                    # Core utilities, API store, preferences
│   │   ├── config.js           # Site configuration & environment helpers
│   │   ├── hooks.js            # Custom React hooks (useAsync, useDebounce, etc.)
│   │   ├── images.js           # Image resizing & proxy optimization helpers
│   │   ├── preferences.js      # Measurement units (sq ft / sq m) context
│   │   ├── recentlyViewed.js   # Local browsing history manager
│   │   ├── seo.js              # Meta tags & JSON-LD structured data injector
│   │   ├── store.js            # Supabase API queries, caching & mutations
│   │   └── supabaseClient.js   # Supabase client initializer
│   ├── pages/                  # Route views
│   │   ├── admin/              # Protected staff CMS pages
│   │   │   ├── AdminLayout.jsx # CMS dashboard shell & sidebar navigation
│   │   │   ├── Agents.jsx      # Agent team management
│   │   │   ├── Dashboard.jsx   # Metrics, inventory & lead breakdown
│   │   │   ├── Enquiries.jsx   # Lead management pipeline
│   │   │   ├── Listing.jsx     # Admin property inventory table with bulk actions
│   │   │   ├── Login.jsx       # Staff login portal
│   │   │   ├── PropertyForm.jsx# Full property editor with media upload
│   │   │   ├── Settings.jsx    # Active cities, hero image, and offer popup
│   │   │   └── Staff.jsx       # Staff RBAC account management
│   │   ├── About.jsx           # Brokerage story & operational principles
│   │   ├── Buy.jsx             # Dedicated purchase property collection
│   │   ├── Contact.jsx         # Direct brokerage contact & advisory form
│   │   ├── FAQ.jsx             # Categorized client questions & answers
│   │   ├── Home.jsx            # Editorial landing page with curated collections
│   │   ├── NotFound.jsx        # Custom 404 page with recovery search
│   │   ├── Privacy.jsx         # Privacy policy
│   │   ├── Properties.jsx      # Complete collection view
│   │   ├── PropertyDetail.jsx  # Rich listing sheet with gallery, map & financing
│   │   ├── Rent.jsx            # Dedicated rental property collection
│   │   ├── Saved.jsx           # Client saved property shortlist & comparison
│   │   ├── Services.jsx        # Advisory services (buyers, sellers, NRIs)
│   │   ├── Team.jsx            # Licensed agent roster
│   │   └── Terms.jsx           # Terms of service
│   ├── App.jsx                 # Route definitions & global layout wrappers
│   ├── index.html              # Entry HTML with meta & preloads
│   ├── main.jsx                # React DOM root mounting
│   └── styles.css              # Custom responsive stylesheet & dark theme
├── supabase/
│   ├── schema.sql              # Clean production database schema, RLS & views
│   ├── migration.sql           # Migration script for existing databases
│   └── seed.sql                # Optional sample seed data
└── package.json
```

---

## 🚢 Deployment

### Vercel / Netlify / Cloudflare Pages

1. Push your repository to GitHub.
2. Link the repository to your hosting provider.
3. Configure the build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Configure the environment variables in your provider's dashboard matching `.env.example` (make sure `VITE_SITE_URL` points to your production custom domain).
5. Add SPA rewrite rules:
   - For **Vercel**: a `vercel.json` rewrite:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```
   - For **Netlify**: a `public/_redirects` file:
     ```text
     /*    /index.html   200
     ```

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

## 🤝 Contributing

Contributions, feedback, and feature requests are welcome. Feel free to open an issue or submit a pull request!
# haven-website
