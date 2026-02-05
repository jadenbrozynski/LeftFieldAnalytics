# Left Field Analytics - Admin Dashboard

## Project Overview
Admin dashboard for Left Field dating app to manage user profiles, waitlists, reports, prompts, interests/activities, and profile change tracking.

**Location:** `/Users/jadenbro1/Desktop/Left Field/leftfield-admin`
**Dev Server:** `npm run dev` → http://localhost:3000
**Status:** Frontend complete with mock data, ready for backend integration

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **UI Library:** shadcn/ui
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Icons:** Lucide React

---

## Design System

### Brand Colors
- **Primary (Sidebar):** `#00433a` (dark teal)
- **Primary Light:** `#00433a/10` for backgrounds
- **Background:** `#f8fafc` (light gray)
- **Cards:** `#ffffff` (white)
- **Text Primary:** `#111827` (gray-900)
- **Text Secondary:** `#6b7280` (gray-500)
- **Borders:** `#d1d9d7` (light teal-gray)

### Theme Configuration
CSS variables defined in `app/globals.css`:
```css
--primary: 168 100% 13%;      /* #00433a */
--background: 0 0% 98%;        /* Light gray */
--card: 0 0% 100%;             /* White */
--border: 168 20% 85%;         /* Light teal-gray */
```

### Typography
- Font: Inter (Google Fonts)
- Headings: `font-semibold text-gray-900`
- Body: `text-gray-600`
- Muted: `text-gray-500`

---

## Project Structure

```
leftfield-admin/
├── app/
│   ├── globals.css              # Global styles & CSS variables
│   ├── layout.tsx               # Root layout (metadata: "Left Field Analytics")
│   ├── login/
│   │   └── page.tsx             # Login page (split-screen design)
│   └── (dashboard)/
│       ├── layout.tsx           # Dashboard layout wrapper
│       ├── page.tsx             # Dashboard home (stats, recent activity)
│       ├── profiles/
│       │   ├── page.tsx         # Profiles list with search/filter
│       │   └── [id]/page.tsx    # Individual profile detail
│       ├── waitlist/
│       │   └── page.tsx         # Waitlist management
│       ├── reports/
│       │   ├── page.tsx         # Reports list
│       │   └── [id]/page.tsx    # Report detail
│       ├── prompts/
│       │   └── page.tsx         # Prompts management (CRUD)
│       ├── interests/
│       │   └── page.tsx         # Interests & Activities (tabs, CRUD)
│       └── timeline/
│           └── page.tsx         # Global activity timeline
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── avatar.tsx
│   │   ├── badge.tsx            # Variants: default, secondary, success, warning, error
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── tooltip.tsx
│   ├── dashboard-layout.tsx     # Main layout (sidebar + header)
│   ├── data-table.tsx           # Reusable table with pagination & sorting
│   ├── filter-bar.tsx           # Search + filter component
│   ├── photo-gallery.tsx        # Profile photo carousel
│   ├── profile-view.tsx         # Detailed profile display (sheet content)
│   ├── stats-row.tsx            # Stats cards row
│   └── timeline-view.tsx        # Activity timeline component
├── lib/
│   ├── utils.ts                 # Utility functions (cn, formatDate, etc.)
│   ├── types.ts                 # TypeScript interfaces
│   └── mock-data.ts             # Mock data for development
├── hooks/
│   └── use-mobile.ts            # Mobile detection hook
└── public/
    ├── favicon.jpg              # LF icon (browser tab)
    ├── logo-light.png           # "Left Field" white text logo
    └── login-image.webp         # Login page background image
```

---

## Components

### DashboardLayout (`components/dashboard-layout.tsx`)
- Collapsible sidebar with dark teal (#00433a) background
- White logo and navigation text
- Navigation items: Dashboard, Profiles, Waitlist, Reports, Prompts, Interests & Activities, Timeline
- User section at bottom
- Responsive mobile sidebar (Sheet)
- Top header with search and notifications

### DataTable (`components/data-table.tsx`)
- Generic table component with TypeScript generics
- Features: Sorting, pagination, row click handlers
- Loading skeleton state
- Empty state message
- Page size selector (10, 20, 50, 100)

### FilterBar (`components/filter-bar.tsx`)
- Search input with icon
- Dynamic filter dropdowns (select, text, number)
- Active filters display as badges
- Clear all filters button

### ProfileView (`components/profile-view.tsx`)
- Full profile display for sheets/modals
- Photo gallery, basic info, bio, prompts, interests, activities
- Status change dropdown
- Account info section
- Manual review alert

### StatsRow (`components/stats-row.tsx`)
- Grid of stat cards
- Supports: label, value, change indicator, icon
- Change types: positive (green), negative (red), neutral (gray)

### TimelineView (`components/timeline-view.tsx`)
- Vertical timeline of profile changes
- Shows: avatar, name, field changed, old/new values, timestamp
- Loading skeleton state

### PhotoGallery (`components/photo-gallery.tsx`)
- Image carousel with navigation arrows
- Dot indicators
- Thumbnail strip
- Video support with play icon

---

## Pages

### Login (`/login`)
- Split-screen design (image left, form right)
- Email/password inputs
- "Remember me" checkbox
- Links: Forgot password, Sign up

### Dashboard (`/`)
- Stats row: Total Users, Live Profiles, Waitlisted, Pending Reports
- Recent Profiles card
- Pending Reports card
- Recent Activity timeline

### Profiles (`/profiles`)
- Search by name, phone, email
- Filters: Status, Gender, City
- Table with: Avatar, Name, Status, Gender, Age, Location, Joined date
- Click row → Profile sheet opens

### Waitlist (`/waitlist`)
- Stats: Total Waitlisted, Needs Review, Top City, Approved Today
- Filters: Gender, City, Review Status
- Table with Approve/Reject buttons
- Click row → Profile sheet

### Reports (`/reports`)
- Stats: Total Reports, Unresolved, Resolved, System Flagged
- Filters: Status, Type
- Table: Reported User, Reporter, Reason, Status, Date
- View button → Report detail page

### Prompts (`/prompts`)
- Stats: Total Prompts, Active, Total Responses, Avg Responses
- Add Prompt dialog (text, category, date range)
- Table: Prompt text, Category, Active Period, Responses, Status
- Edit/Delete actions

### Interests & Activities (`/interests`)
- Tabs: Interests, Activities
- Stats: Total counts and usage
- Interests grouped by category in cards
- Full table with Edit/Delete
- Add Interest/Activity dialogs

### Timeline (`/timeline`)
- Stats: Total Changes, Today, Unique Fields, Profiles Changed
- Filters: Field, Changed By
- Changes grouped by date in cards
- Timeline view within each card

---

## TypeScript Interfaces (`lib/types.ts`)

```typescript
interface User {
  id: string
  phone: string
  email: string | null
  is_admin: boolean
  is_banned: boolean
  created_at: string
  last_seen_at: string | null
  referral_code: string | null
}

interface Profile {
  id: string
  user_id: string
  status: 'waitlisted' | 'live' | 'banned' | 'deleted'
  gender: 'man' | 'woman' | 'nonbinary'
  first_name: string
  last_name: string
  age: number
  height: number
  birthday: string
  pronouns: string | null
  neighborhood: string | null
  bio: string | null
  school: string | null
  job_title: string | null
  hometown: string | null
  waitlist_city_id: string | null
  completed: boolean
  needs_manual_review: boolean
  created_at: string
  updated_at: string
  uploads: ProfileUpload[]
  prompt_responses: PromptResponse[]
  interests: Interest[]
  activities: Activity[]
  geolocation: ProfileGeolocation | null
  user: User
}

interface ProfileUpload {
  id: string
  url: string
  display_order: number
  type: 'photo' | 'video'
}

interface PromptDefinition {
  id: string
  prompt: string
  category: string | null
  start_date: string | null
  end_date: string | null
  deleted_at: string | null
  created_at: string
  response_count?: number
}

interface Interest {
  id: string
  name: string
  category: string | null
  usage_count?: number
}

interface Activity {
  id: string
  name: string
  url: string
  usage_count?: number
}

interface ProfileReport {
  id: string
  profile_id: string | null
  reported_profile_id: string
  reporter_notes: string | null
  reviewer_notes: string | null
  is_resolved: boolean
  profile_upload_id: string | null
  conversation_id: string | null
  created_at: string
  reporter: Profile | null
  reported: Profile
}

interface ProfileChange {
  id: string
  profile_id: string
  field: string
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_at: string
  profile?: Profile
}

interface WaitlistCity {
  id: string
  name: string
  state: string
}
```

---

## Utility Functions (`lib/utils.ts`)

- `cn(...classes)` - Tailwind class merger
- `formatDate(date)` - "Jan 15, 2024"
- `formatDateTime(date)` - "Jan 15, 2024, 3:30 PM"
- `formatRelativeTime(date)` - "2 hours ago"
- `formatHeight(inches)` - "5'10\""
- `getStatusColor(status)` - Returns badge color classes
- `getGenderLabel(gender)` - "Man", "Woman", "Non-binary"

---

## Next Steps / Backend Integration

### API Routes to Create
Replace mock data imports with API calls:

1. **Profiles**
   - `GET /api/profiles` - List with filters
   - `GET /api/profiles/[id]` - Single profile
   - `PATCH /api/profiles/[id]` - Update status

2. **Waitlist**
   - `GET /api/waitlist` - Waitlisted profiles
   - `POST /api/waitlist/[id]/approve`
   - `POST /api/waitlist/[id]/reject`

3. **Reports**
   - `GET /api/reports` - List with filters
   - `GET /api/reports/[id]` - Single report
   - `PATCH /api/reports/[id]` - Resolve, add notes

4. **Prompts**
   - `GET /api/prompts`
   - `POST /api/prompts`
   - `PATCH /api/prompts/[id]`
   - `DELETE /api/prompts/[id]`

5. **Interests & Activities**
   - `GET /api/interests`
   - `POST /api/interests`
   - `PATCH /api/interests/[id]`
   - `DELETE /api/interests/[id]`
   - Same for `/api/activities`

6. **Timeline**
   - `GET /api/timeline` - Profile changes

7. **Auth**
   - `POST /api/auth/login`
   - `POST /api/auth/logout`
   - `GET /api/auth/me`

### Database Connection
- Add Supabase, Prisma, or direct PostgreSQL connection
- Environment variables for database URL
- Server actions or API routes for data fetching

### Authentication
- Implement login flow with session/JWT
- Protect dashboard routes
- Add middleware for auth check

---

## Running the Project

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Files Modified in This Session

1. `app/globals.css` - Theme colors updated to dark teal
2. `app/layout.tsx` - Title: "Left Field Analytics"
3. `components/dashboard-layout.tsx` - Dark teal sidebar, white logo
4. `components/stats-row.tsx` - Teal accent colors
5. `components/filter-bar.tsx` - Teal accent colors
6. `components/timeline-view.tsx` - Teal accent colors
7. `app/(dashboard)/page.tsx` - Teal accent colors

---

## Design Decisions

1. **Sidebar color:** Dark teal (#00433a) - matches Left Field brand
2. **White logo:** Uses `logo-light.png` designed for dark backgrounds
3. **Light content area:** White cards on light gray background for readability
4. **Accent colors:** Dark teal for interactive elements, badges, icons
5. **Split-screen login:** Image on left, form on right (like eventini-admin)
6. **Sheet for profile details:** Click table row → profile opens in side sheet
7. **Collapsible sidebar:** Desktop only, saves space when needed

---

*Last updated: February 2, 2026*
