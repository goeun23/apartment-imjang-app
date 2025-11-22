-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create records table
create table if not exists records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  type text not null check (type in ('대지', '아파트')),
  area_pyeong int not null check (area_pyeong in (20, 30)),
  price_in_hundred_million numeric not null,
  region_si text not null check (region_si in ('서울', '경기')),
  region_gu text not null,
  region_dong text,
  address_full text,
  apartment_name text,
  school_accessibility int not null check (school_accessibility between 1 and 5),
  traffic_accessibility text not null,
  is_ltv_regulated boolean not null,
  ltv_rate int not null check (ltv_rate in (40, 70)),
  memo text,
  ai_report text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create record_photos table
create table if not exists record_photos (
  id uuid primary key default uuid_generate_v4(),
  record_id uuid references records(id) on delete cascade not null,
  photo_url text not null,
  photo_order int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create comments table
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  record_id uuid references records(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create search_history table
create table if not exists search_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  region_si text not null,
  region_gu text not null,
  searched_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create loan_calculations table
create table if not exists loan_calculations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  current_asset numeric not null,
  apartment_price numeric not null,
  ltv_rate int not null check (ltv_rate in (40, 70)),
  max_loan_amount numeric not null,
  calculated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create market_prices table
create table if not exists market_prices (
  id uuid primary key default uuid_generate_v4(),
  region_si text not null,
  region_gu text not null,
  apartment_name text not null,
  transaction_date text not null,
  price_in_hundred_million numeric not null,
  area_pyeong numeric not null,
  floor int not null,
  fetched_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table records enable row level security;
alter table record_photos enable row level security;
alter table comments enable row level security;
alter table search_history enable row level security;
alter table loan_calculations enable row level security;
alter table market_prices enable row level security;

-- Create policies
-- Records policies (Shared access for family)
create policy "Enable read access for authenticated users" on records
  for select using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users" on records
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update access for authenticated users" on records
  for update using (auth.role() = 'authenticated');

create policy "Enable delete access for authenticated users" on records
  for delete using (auth.role() = 'authenticated');

-- Record Photos policies
create policy "Enable read access for authenticated users" on record_photos
  for select using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users" on record_photos
  for insert with check (auth.role() = 'authenticated');

create policy "Enable delete access for authenticated users" on record_photos
  for delete using (auth.role() = 'authenticated');

-- Comments policies
create policy "Enable read access for authenticated users" on comments
  for select using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users" on comments
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update access for users based on user_id" on comments
  for update using (auth.uid() = user_id);

create policy "Enable delete access for users based on user_id" on comments
  for delete using (auth.uid() = user_id);

-- Search History policies (Private to user)
create policy "Users can see their own search history" on search_history
  for select using (auth.uid() = user_id);

create policy "Users can insert their own search history" on search_history
  for insert with check (auth.uid() = user_id);

-- Loan Calculations policies (Private to user)
create policy "Users can see their own loan calculations" on loan_calculations
  for select using (auth.uid() = user_id);

create policy "Users can insert their own loan calculations" on loan_calculations
  for insert with check (auth.uid() = user_id);

-- Market Prices policies (Public read for authenticated)
create policy "Enable read access for authenticated users" on market_prices
  for select using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users" on market_prices
  for insert with check (auth.role() = 'authenticated');

-- Storage Setup
-- Note: This requires the storage extension which is enabled by default in Supabase
insert into storage.buckets (id, name, public) 
values ('record-photos', 'record-photos', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload photos"
on storage.objects for insert
with check ( bucket_id = 'record-photos' and auth.role() = 'authenticated' );

create policy "Public access to photos"
on storage.objects for select
using ( bucket_id = 'record-photos' );

create policy "Authenticated users can delete photos"
on storage.objects for delete
using ( bucket_id = 'record-photos' and auth.role() = 'authenticated' );
