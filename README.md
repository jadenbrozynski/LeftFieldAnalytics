# Left Field Admin Dashboard

Admin dashboard for the Left Field dating app. Manages user profiles, waitlists, reports, prompts, and interests/activities.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Login:** `admin@leftfield.app` / `leftfield2026`

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14 | App Router framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| PostgreSQL | Database (via `pg`) |
| Lucide React | Icons |

---

## Project Structure

```
leftfield-admin/
├── app/
│   ├── globals.css                    # Global styles & CSS variables
│   ├── layout.tsx                     # Root layout with metadata
│   ├── login/
│   │   ├── layout.tsx                 # Login layout (no auth required)
│   │   └── page.tsx                   # Login page (split-screen design)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts         # POST - Authenticate user
│   │   │   └── logout/route.ts        # POST - Clear auth cookie
│   │   ├── environment/route.ts       # GET/POST - Environment switching
│   │   ├── dashboard/
│   │   │   └── stats/route.ts         # GET - Dashboard statistics
│   │   ├── profiles/
│   │   │   ├── route.ts               # GET - List profiles with filters
│   │   │   └── [id]/route.ts          # GET - Single profile details
│   │   ├── waitlist/route.ts          # GET - Waitlisted profiles
│   │   ├── waitlist-cities/route.ts   # GET - Available cities
│   │   ├── reports/
│   │   │   ├── route.ts               # GET - List reports
│   │   │   └── [id]/route.ts          # GET - Single report details
│   │   ├── prompts/route.ts           # GET - Prompt definitions
│   │   ├── interests/route.ts         # GET - Interests list
│   │   └── activities/route.ts        # GET - Activities list
│   └── (dashboard)/
│       ├── layout.tsx                 # Dashboard layout wrapper
│       ├── page.tsx                   # Dashboard home (stats, activity)
│       ├── profiles/
│       │   ├── page.tsx               # Profiles list with search/filter
│       │   └── [id]/page.tsx          # Individual profile page
│       ├── waitlist/page.tsx          # Waitlist management
│       ├── reports/
│       │   ├── page.tsx               # Reports list
│       │   └── [id]/page.tsx          # Report detail page
│       ├── prompts/page.tsx           # Prompts management
│       ├── interests/page.tsx         # Interests & Activities (tabs)
│       └── timeline/page.tsx          # Global activity timeline
│
├── components/
│   ├── dashboard-layout.tsx           # Main layout (sidebar + header + env toggle)
│   ├── data-table.tsx                 # Reusable table with pagination & sorting
│   ├── filter-bar.tsx                 # Search + filter dropdowns
│   ├── photo-gallery.tsx              # Profile photo carousel (compact mode)
│   ├── profile-card.tsx               # Profile card component
│   ├── profile-view.tsx               # Detailed profile display (responsive)
│   ├── stats-row.tsx                  # Stats cards row
│   ├── timeline-view.tsx              # Activity timeline component
│   └── ui/                            # shadcn/ui components
│       ├── avatar.tsx
│       ├── badge.tsx                  # Variants: default, secondary, success, warning, error
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
│
├── lib/
│   ├── api.ts                         # Client-side API fetch functions
│   ├── db.ts                          # Database connection (staging/production pools)
│   ├── mock-data.ts                   # Mock data for development
│   ├── types.ts                       # TypeScript interfaces
│   └── utils.ts                       # Utility functions
│
├── hooks/
│   └── use-mobile.ts                  # Mobile detection hook
│
├── public/
│   ├── favicon.jpg                    # Browser tab icon
│   ├── logo-light.png                 # White logo for dark backgrounds
│   └── login-image.webp               # Login page background
│
├── middleware.ts                      # Auth protection for routes
├── database-schema.json               # PostgreSQL schema reference
├── tailwind.config.ts                 # Tailwind configuration
├── .env.local                         # Local environment variables
├── .env.stage                         # Staging database credentials
└── .env.prod                          # Production database credentials
```

---

## Features

### Authentication
- Cookie-based authentication (`admin_auth`)
- Login page with split-screen design
- Middleware protects all dashboard routes
- Logout clears cookie and redirects to login

### Environment Switching
- Toggle between **Staging** (green) and **Production** (red) databases
- Connection test before switching prevents freezing
- Environment indicator in top-right header
- Cookie-based persistence (`app_env`)

### Dashboard
- Stats: Total Users, Live Profiles, Waitlisted, Pending Reports
- Recent profiles list
- Pending reports list
- Activity timeline

### Profiles
- Search by name, phone, or email
- Filter by status, gender, city
- Paginated table with sorting
- Click row to open profile sheet
- Responsive two-column layout (photo left, info right)

### Waitlist
- View waitlisted profiles
- Filter by gender, city, review status
- Stats: Total, Needs Review, Top City

### Reports
- View user reports
- Filter by status (resolved/unresolved)
- Report detail page with reporter info
- Reported profile view with two-column layout

### Prompts, Interests, Activities
- View definitions and usage counts
- READ-ONLY mode (no modifications)

---

## Database Connection

Uses `pg` (node-postgres) with dual connection pools:

```typescript
// lib/db.ts
const stagingPool = new Pool({ /* staging config */ })
const productionPool = new Pool({ /* production config */ })

export async function query(text: string, params?: unknown[]) {
  const pool = await getPool()
  const result = await pool.query(`BEGIN READ ONLY; ${text}; COMMIT;`)
  return result
}
```

**All queries are READ-ONLY** - wrapped in `BEGIN READ ONLY` transactions.

### Environment Variables

```env
# .env.local
STAGING_DATABASE_HOST=...
STAGING_DATABASE_PORT=25061
STAGING_DATABASE_NAME=stage-connection-pool
STAGING_DATABASE_USER=...
STAGING_DATABASE_PASSWORD=...

PROD_DATABASE_HOST=...
PROD_DATABASE_PORT=25061
PROD_DATABASE_NAME=prod-connection-pool
PROD_DATABASE_USER=...
PROD_DATABASE_PASSWORD=...
```

---

## Design System

### Brand Colors
| Name | Value | Usage |
|------|-------|-------|
| Primary | `#00433a` | Sidebar, buttons, accents |
| Background | `#f8fafc` | Page background |
| Card | `#ffffff` | Card backgrounds |
| Border | `#d1d9d7` | Borders, dividers |

### CSS Variables (`app/globals.css`)
```css
--primary: 168 100% 13%;      /* #00433a */
--background: 0 0% 98%;
--card: 0 0% 100%;
--border: 168 20% 85%;
```

### Typography
- **Font:** Inter (Google Fonts)
- **Headings:** `font-semibold text-gray-900`
- **Body:** `text-gray-600`
- **Muted:** `text-gray-500`

---

## Key Components

### DashboardLayout
- Collapsible sidebar with dark teal background
- Environment toggle (staging/production)
- Mobile-responsive with Sheet sidebar
- Logout button

### ProfileView
- Two-column responsive layout
- Compact photo gallery (256px, square)
- Sticky photos while scrolling info
- Status badge, contact info, interests

### DataTable
- Generic with TypeScript generics
- Sorting, pagination, row click
- Page size selector (10, 20, 50, 100)

### PhotoGallery
- Carousel with navigation arrows
- Compact mode for side panels
- Video support with play indicator
- Photo counter badge

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | Authenticate with email/password |
| `/api/auth/logout` | POST | Clear auth cookie |
| `/api/environment` | GET/POST | Get/set environment |
| `/api/dashboard/stats` | GET | Dashboard statistics |
| `/api/profiles` | GET | List profiles (with filters) |
| `/api/profiles/[id]` | GET | Single profile with relations |
| `/api/waitlist` | GET | Waitlisted profiles |
| `/api/waitlist-cities` | GET | Available cities |
| `/api/reports` | GET | List reports |
| `/api/reports/[id]` | GET | Single report with profiles |
| `/api/prompts` | GET | Prompt definitions |
| `/api/interests` | GET | Interests list |
| `/api/activities` | GET | Activities list |

---

## Utility Functions (`lib/utils.ts`)

| Function | Description |
|----------|-------------|
| `cn(...classes)` | Tailwind class merger |
| `formatDate(date)` | "Jan 15, 2024" |
| `formatDateTime(date)` | "Jan 15, 2024, 3:30 PM" |
| `formatRelativeTime(date)` | "2 hours ago" |
| `formatHeight(inches)` | "5'10\"" |
| `formatPhoneNumber(phone)` | "+1 (555) 123-4567" |
| `getStatusColor(status)` | Badge color classes |
| `getGenderLabel(gender)` | "Man", "Woman", "Non-binary" |

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

*Last updated: February 2, 2026*
