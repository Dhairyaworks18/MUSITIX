-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  email text,
  phone text,
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Auth.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================
-- BOOKINGS TABLE (FINAL VERSION)
-- Razorpay + Supabase Auth READY
-- ================================

-- Drop old table if exists
drop table if exists bookings cascade;

-- Create bookings table
create table bookings (
  id uuid primary key default gen_random_uuid(),

  created_at timestamptz not null default now(),

  -- Auth user
  user_id uuid not null
    references auth.users(id) on delete cascade,

  -- Event booked
  event_id uuid not null
    references events(id) on delete cascade,

  -- Ticket quantity
  quantity int not null
    check (quantity >= 1 and quantity <= 5),

  -- Snapshot price
  price_per_ticket int not null,

  -- Total amount paid
  amount int not null,

  -- Booking lifecycle
  status text not null
    check (status in ('created', 'paid', 'failed', 'refunded')),

  -- Razorpay fields
  razorpay_order_id text not null,
  razorpay_payment_id text,
  razorpay_signature text
);

-- ================================
-- ENABLE ROW LEVEL SECURITY
-- ================================
alter table bookings enable row level security;

-- ================================
-- RLS POLICIES
-- ================================

-- Insert: only own booking
create policy "insert_own_booking"
on bookings
for insert
with check (auth.uid() = user_id);

-- Read: only own bookings
create policy "read_own_bookings"
on bookings
for select
using (auth.uid() = user_id);

-- Update: only own bookings
create policy "update_own_bookings"
on bookings
for update
using (auth.uid() = user_id);

-- ================================
-- INDEXES (PERFORMANCE)
-- ================================
create index bookings_user_id_idx on bookings(user_id);
create index bookings_event_id_idx on bookings(event_id);
create index bookings_status_idx on bookings(status);
