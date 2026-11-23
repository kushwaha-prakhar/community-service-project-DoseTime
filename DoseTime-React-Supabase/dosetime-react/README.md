# DoseTime (React + Supabase)

Fully functional medicine reminder & adherence tracker with real backend.

- **Frontend**: React + Vite + Tailwind
- **Backend**: Supabase (Auth + Postgres)
- **Deploy**: Netlify (or any static host)

---

## 1. Create Supabase project

1. Go to https://supabase.com → New project
2. Name it `dosetime`, choose a region, set a database password
3. Wait until the project is ready
4. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` `public` key

---

## 2. Create the database tables

In Supabase go to **SQL Editor → New query**, paste the following, and click **Run**:

```sql
-- Enable UUID
create extension if not exists "uuid-ossp";

-- Profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  created_at timestamptz default now()
);

-- Medicines
create table public.medicines (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  dosage text,
  times text[] not null default '{}',
  stock integer default 30,
  alert_when integer default 5,
  created_at timestamptz default now()
);

-- Dose logs
create table public.dose_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  medicine_id uuid references public.medicines on delete cascade not null,
  med_name text not null,
  dosage text,
  scheduled_time text not null,
  status text not null check (status in ('taken', 'taken_late', 'missed', 'skipped')),
  date date not null,
  created_at timestamptz default now()
);

-- Indexes
create index medicines_user_id_idx on public.medicines(user_id);
create index dose_logs_user_id_idx on public.dose_logs(user_id);
create index dose_logs_date_idx on public.dose_logs(date);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.medicines enable row level security;
alter table public.dose_logs enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can manage own medicines"
  on public.medicines for all using (auth.uid() = user_id);

create policy "Users can manage own dose logs"
  on public.dose_logs for all using (auth.uid() = user_id);

-- Auto create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 3. Configure the app

1. Copy `.env.example` to `.env`
2. Paste your Supabase values:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Run locally

```bash
npm install
npm run dev
```

Open the URL shown (usually http://localhost:5173).

---

## 5. Important Supabase Auth setting

In Supabase → **Authentication → Providers → Email**:

- Turn **OFF** “Confirm email” if you want instant login after register (recommended for testing).

---

## 6. Deploy to Netlify

### Option A – Drag & drop (easiest)

```bash
npm run build
```

Then go to https://app.netlify.com → **Add new site → Deploy manually**  
and drag the `dist` folder.

### Option B – Git + continuous deploy

1. Push this folder to a GitHub repository
2. In Netlify → Add new site → Import from Git
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add environment variables in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## Features included

- Real email + password authentication
- Add / Edit / Delete medicines
- Multiple dose times
- Stock tracking + low-stock alerts
- Mark Taken / Taken late / Skipped / Missed
- Adherence stats, streak, 7-day chart
- Recent activity
- Demo medicine button
- Reset data
- Responsive (phone + laptop)
- Dark teal theme matching the original design

---

## Folder structure

```
dosetime-react/
├── public/
├── src/
│   ├── components/
│   │   ├── Auth.tsx
│   │   ├── Layout.tsx
│   │   ├── Today.tsx
│   │   ├── Medicines.tsx
│   │   └── History.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```
