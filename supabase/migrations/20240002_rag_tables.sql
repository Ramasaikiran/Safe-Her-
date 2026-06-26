-- City safety scores
create table if not exists public.city_safety (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  country text not null default 'India',
  overall_score numeric(3,1) not null check (overall_score between 0 and 10),
  night_score numeric(3,1) check (night_score between 0 and 10),
  transport_score numeric(3,1) check (transport_score between 0 and 10),
  solo_traveller_score numeric(3,1) check (solo_traveller_score between 0 and 10),
  summary text,
  last_updated timestamptz default now(),
  created_at timestamptz default now(),
  unique(city)
);

-- Safety tips per city
create table if not exists public.safety_tips (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  category text not null,
  tip text not null,
  severity text default 'info',
  created_at timestamptz default now()
);

-- Community reviews for guides
create table if not exists public.guide_reviews (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid references public.guide_profiles(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  city text,
  created_at timestamptz default now()
);

-- Seed: major cities
insert into public.city_safety (city, country, overall_score, night_score, transport_score, solo_traveller_score, summary) values
('Bangalore','India',7.2,6.5,7.8,7.0,'Bangalore is generally safe for solo women. Koramangala, Indiranagar, and HSR Layout are well-lit and lively. Avoid empty auto-rickshaws late at night; use Ola/Uber instead. The metro is safe and has women-only coaches.'),
('Mumbai','India',7.8,7.2,8.0,7.8,'Mumbai is one of India''s safest cities for women. Local trains have dedicated women-only compartments. Marine Drive and Bandra areas are safe at most hours. The city has a strong nightlife culture.'),
('Delhi','India',5.8,4.5,6.0,5.5,'Delhi requires more caution than other metros. South Delhi (Hauz Khas, Saket, Vasant Vihar) is safer. Use only app-based cabs at night. The metro has women-only coaches in every train.'),
('Goa','India',7.0,6.0,6.5,7.2,'Goa is popular with solo women travelers. North Goa has a backpacker-friendly vibe. Be cautious on deserted beaches at night. Avoid accepting drinks from strangers at parties.'),
('Jaipur','India',6.5,5.5,6.5,6.0,'Jaipur is a heritage city with moderate safety. The old city can feel overwhelming. Use registered taxis. Dress modestly near religious sites.'),
('Hyderabad','India',7.0,6.0,7.0,6.8,'Hyderabad is relatively safe. Banjara Hills, Jubilee Hills, and Hitec City are the safest zones. The metro is excellent and has women-only coaches.'),
('Chennai','India',7.2,6.5,7.2,7.0,'Chennai is considered safe for women. T Nagar, Adyar, and Anna Nagar are family-friendly. Beaches like Marina are best visited during the day.'),
('Kochi','India',8.0,7.5,7.8,8.2,'Kochi ranks among India''s safest cities for solo women. Fort Kochi is charming and safe. Kerala overall is ranked #1 for women safety in India.'),
('Varanasi','India',5.5,4.5,5.5,5.2,'Varanasi requires extra caution. The ghats are best visited early morning or early evening. Touts are persistent — be firm. Stay near Assi Ghat for a safer experience.'),
('Kolkata','India',6.8,6.0,7.0,6.5,'Kolkata has a strong community culture. Park Street, Salt Lake, and New Town are safest. Known for its arts scene — solo women generally report feeling respected.')
on conflict (city) do nothing;

-- Seed: safety tips
insert into public.safety_tips (city, category, tip, severity) values
('Bangalore','transport','Use Ola or Uber after 9 PM instead of auto-rickshaws. Share your live trip location.','caution'),
('Bangalore','accommodation','Hostels in Koramangala, Indiranagar, and HSR Layout are women-friendly and well-rated.','info'),
('Bangalore','scams','Watch for inflated auto fares near MG Road — always use the meter or app-based rides.','caution'),
('Bangalore','emergency','Karnataka women helpline: 181. Bangalore police women''s helpline: 1091.','info'),
('Mumbai','transport','Take women-only compartments on local trains (first and last coaches).','info'),
('Mumbai','accommodation','Colaba, Bandra, and Andheri West have excellent women-friendly hostels.','info'),
('Mumbai','nightlife','Bandra, Juhu, and Lower Parel are the liveliest and safest areas at night.','info'),
('Delhi','transport','Metro is your safest bet. Avoid empty cabs or autos late at night. Stick to Ola/Uber.','warning'),
('Delhi','nightlife','Stick to South Delhi markets (Khan Market, Hauz Khas Village) and leave before 11 PM.','caution'),
('Delhi','emergency','Delhi police women helpline: 1091. Himmat app by Delhi Police for emergencies.','info'),
('Goa','accommodation','Book women-friendly hostels in Anjuna, Palolem, or Arambol. Many have female-only dorms.','info'),
('Goa','transport','Rent a scooter only from registered shops with helmets. Keep your documents safe.','caution'),
('Goa','nightlife','Avoid deserted beaches after dark. Stick to crowded shacks and clubs.','caution'),
('Kochi','general','Fort Kochi is very walkable and safe even for solo women at night.','info'),
('Kochi','transport','Auto-rickshaws in Kochi use meters honestly. App-based cabs are also widely available.','info'),
('Hyderabad','accommodation','Stay in Banjara Hills or Jubilee Hills for safest accommodation options.','info'),
('Hyderabad','transport','Hyderabad metro has dedicated women-only coaches. Preferred over autos at night.','info'),
('Chennai','transport','Local trains have women-only compartments. Chennai cabs are generally reliable.','info'),
('Jaipur','scams','Gem/handicraft shop commission scams are common near tourist spots. Decline firmly.','caution'),
('Varanasi','scams','Boat ride touts near ghats often overcharge. Agree on price firmly before boarding.','warning')
on conflict do nothing;

-- RLS
alter table public.city_safety enable row level security;
alter table public.safety_tips enable row level security;
alter table public.guide_reviews enable row level security;

create policy "public_read_city_safety" on public.city_safety for select using (true);
create policy "public_read_safety_tips" on public.safety_tips for select using (true);
create policy "public_read_guide_reviews" on public.guide_reviews for select using (true);
create policy "auth_insert_guide_review" on public.guide_reviews for insert with check (auth.uid() = reviewer_id);
