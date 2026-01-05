
-- ==========================================
-- ⚠️ RESET & CLEANUP (Run this first)
-- ==========================================

-- Drop new tracker tables if they exist (to allow re-running)
-- using CASCADE to remove dependencies (foreign keys) automatically
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.tracker_projects CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.interns CASCADE;
DROP TABLE IF EXISTS public.domains CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop obsolete tables from previous attempts (Cleanup)
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.client_payments CASCADE;
DROP TABLE IF EXISTS public.internship_payments CASCADE;
DROP TABLE IF EXISTS public.projects_internal CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- ==========================================
-- 🛠️ SCHEMA SETUP
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  role text check (role in ('admin', 'trainer', 'finance', 'project_lead')) default 'admin',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. DOMAINS (Lookup table)
create table public.domains (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Seed Domains
insert into public.domains (name) values 
('Web Development'), ('AI/ML'), ('App Development'), ('UI/UX Design'), ('Cybersecurity')
on conflict do nothing;

-- 3. INTERNS
create table public.interns (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text unique not null,
  phone text,
  college text,
  domain text not null, 
  batch_name text,
  trainer_id uuid references public.profiles(id),
  status text check (status in ('Active', 'Completed', 'Dropped', 'Pending')) default 'Active',
  enrollment_date date default CURRENT_DATE,
  total_fee numeric default 0,
  paid_fee numeric default 0,
  attendance_percentage numeric default 0,
  tasks_completed_percentage numeric default 0,
  certificate_status text default 'Locked',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. CLIENTS
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  contact_person text,
  email text,
  phone text,
  client_type text check (client_type in ('Startup', 'College', 'Business', 'Individual')),
  status text default 'Active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. TRACKER PROJECTS (Internal Only)
-- Renamed to avoid affecting public portfolio 'projects'
create table public.tracker_projects (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  client_id uuid references public.clients(id),
  domain text,
  start_date date,
  end_date date,
  value numeric default 0,
  status text check (status in ('Proposal', 'In Progress', 'Delivered', 'Maintenance')),
  lead_id uuid references public.profiles(id),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. PAYMENTS (Unified Ledger)
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  intern_id uuid references public.interns(id),
  client_id uuid references public.clients(id),
  project_id uuid references public.tracker_projects(id),
  amount numeric not null,
  payment_date date default CURRENT_DATE,
  payment_method text,
  transaction_id text,
  invoice_id text,
  type text check (type in ('Internship Fee', 'Project Milestone', 'Product Sale', 'Other')),
  status text default 'Completed',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. RLS POLICIES
alter table public.profiles enable row level security;
alter table public.interns enable row level security;
alter table public.clients enable row level security;
alter table public.tracker_projects enable row level security;
alter table public.payments enable row level security;
alter table public.domains enable row level security;

-- Policy: Only authenticated users can access the tracker data
create policy "Allow authenticated read access" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Allow authenticated read access" on public.interns for select using (auth.role() = 'authenticated');
create policy "Allow authenticated read access" on public.clients for select using (auth.role() = 'authenticated');
create policy "Allow authenticated read access" on public.tracker_projects for select using (auth.role() = 'authenticated');
create policy "Allow authenticated read access" on public.payments for select using (auth.role() = 'authenticated');
create policy "Allow authenticated read access" on public.domains for select using (auth.role() = 'authenticated');

-- Full access for admins
create policy "Enable all for users" on public.profiles for all using (auth.role() = 'authenticated');
create policy "Enable all for users" on public.interns for all using (auth.role() = 'authenticated');
create policy "Enable all for users" on public.clients for all using (auth.role() = 'authenticated');
create policy "Enable all for users" on public.tracker_projects for all using (auth.role() = 'authenticated');
create policy "Enable all for users" on public.payments for all using (auth.role() = 'authenticated');
create policy "Enable all for users" on public.domains for all using (auth.role() = 'authenticated');

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'admin');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
