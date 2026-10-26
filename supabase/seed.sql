-- Seed data for EXCURSION MALDIVES. Safe to re-run.
-- Images reference the photography shipped in /public/images. Replace via the admin CMS.

insert into public.settings (key, value) values
  ('marketplace', '{"site_name":"Excursion Maldives","default_commission":15,"currency":"USD","support_email":"hello@excursionmaldives.com","support_phone":"+960 777 0000","whatsapp":"+9607770000","address":"Majeedhee Magu, Malé, Republic of Maldives"}'),
  ('payments', '{"provider":"bml","enabled":false,"mode":"uat"}')
on conflict (key) do nothing;

insert into public.categories (name, slug, description, image_url, sort_order) values
  ('Snorkeling', 'snorkeling', 'House reefs, turtle points and coral gardens in crystal-clear water.', '/images/snorkeling.png', 1),
  ('Diving', 'diving', 'Manta cleaning stations, channel dives and wrecks with PADI centres.', '/images/manta.png', 2),
  ('Sandbank Trips', 'sandbank-trips', 'Your own strip of white sand in the middle of the lagoon.', '/images/sandbank.png', 3),
  ('Dolphin Cruises', 'dolphin-cruises', 'Spinner dolphins at golden hour aboard a traditional dhoni.', '/images/dolphins.png', 4),
  ('Fishing', 'fishing', 'Maldivian handline night fishing and big-game trolling.', '/images/fishing.png', 5),
  ('Water Sports', 'water-sports', 'Jet ski, parasailing, kayak and paddleboard.', '/images/watersports.png', 6),
  ('Island Hopping', 'island-hopping', 'Local islands, resort visits and village life.', '/images/islandhop.png', 7),
  ('Sunset Cruises', 'sunset-cruises', 'Catamaran and yacht cruises as the sky turns orange.', '/images/sunset.png', 8)
on conflict (slug) do nothing;

insert into public.destinations (name, slug, atoll, description, image_url, sort_order) values
  ('Malé', 'male', 'Kaafu (North Malé) Atoll', 'The lively capital and gateway to every excursion.', '/images/male.png', 1),
  ('Maafushi', 'maafushi', 'Kaafu (South Malé) Atoll', 'The original local-island guesthouse hub with a bikini beach.', '/images/maafushi.png', 2),
  ('South Ari Atoll', 'south-ari', 'Alif Dhaal Atoll', 'Year-round whale shark sightings along the outer reef.', '/images/whaleshark.png', 3),
  ('Baa Atoll', 'baa-atoll', 'Baa Atoll', 'UNESCO Biosphere Reserve and home of Hanifaru Bay mantas.', '/images/baa.png', 4),
  ('Thulusdhoo', 'thulusdhoo', 'Kaafu (North Malé) Atoll', 'Surf breaks, Coca-Cola factory and laid-back cafés.', '/images/thulusdhoo.png', 5)
on conflict (slug) do nothing;

-- Demo operators (no owner account — claim or replace them from the admin portal)
insert into public.vendors (business_name, slug, tagline, description, island, email, phone, status, commission_rate, logo_url, cover_url) values
  ('Blue Lagoon Adventures', 'blue-lagoon-adventures', 'Snorkel & sandbank specialists', 'Family-run operator from Maafushi running small-group reef trips since 2014.', 'Maafushi', 'hello@bluelagoon.mv', '+960 790 1111', 'approved', 15, null, '/images/sandbank.png'),
  ('Manta Point Divers', 'manta-point-divers', 'PADI 5-star dive centre', 'Certified instructors and fast dive boats covering North & South Malé atolls.', 'Malé', 'dive@mantapoint.mv', '+960 790 2222', 'approved', 12, null, '/images/manta.png'),
  ('Dhoni Sunset Co.', 'dhoni-sunset-co', 'Traditional boats, modern comfort', 'Restored wooden dhonis for dolphin, fishing and sunset cruises.', 'Hulhumalé', 'sail@dhonisunset.mv', '+960 790 3333', 'approved', 15, null, '/images/dolphins.png')
on conflict (slug) do nothing;

with v as (select id, slug from public.vendors),
c as (select id, slug from public.categories),
d as (select id, slug from public.destinations)
insert into public.experiences (
  vendor_id, category_id, destination_id, title, slug, summary, description, duration_minutes, price, child_price, compare_at_price,
  min_guests, max_guests, is_private, is_featured, status, cover_image, highlights, inclusions, exclusions, itinerary, pickup_locations, meeting_point, languages
)
select (select id from v where slug = x.vendor), (select id from c where slug = x.cat), (select id from d where slug = x.dest),
  x.title, x.slug, x.summary, x.description, x.duration, x.price, x.child_price, x.compare_at, x.min_g, x.max_g, x.is_private, x.featured, 'published', x.cover,
  x.highlights, x.inclusions, x.exclusions, x.itinerary::jsonb, x.pickups, x.meeting, '{English}'
from (values
  ('blue-lagoon-adventures', 'snorkeling', 'maafushi', 'Turtle Reef & Coral Garden Snorkel', 'turtle-reef-coral-garden-snorkel',
   'Two reef stops with green turtles, reef sharks and a rainbow of coral.', 'Join a small group on a speedboat to two of South Malé''s best snorkel spots. Our guides brief you on reef etiquette and swim with you the whole way.',
   180, 45::numeric, 30::numeric, 60::numeric, 1, 12, false, true, '/images/snorkeling.png',
   '{"Swim with green turtles","Two reef sites","Small groups of 12 max"}'::text[], '{"Mask, snorkel & fins","Life jackets","Drinking water & towels","Guide"}'::text[], '{"Underwater photos","Hotel transfers outside Maafushi"}'::text[],
   '[{"time":"09:00","title":"Jetty pickup","description":"Meet at Maafushi harbour"},{"time":"09:30","title":"Turtle Point","description":"First snorkel stop"},{"time":"10:45","title":"Coral Garden","description":"Second snorkel stop"},{"time":"12:00","title":"Return"}]',
   '{"Maafushi harbour","Guraidhoo jetty"}'::text[], 'Maafushi harbour, blue kiosk'),
  ('blue-lagoon-adventures', 'sandbank-trips', 'maafushi', 'Private Sandbank Picnic', 'private-sandbank-picnic',
   'Your own sandbank with parasol, picnic lunch and snorkel gear.', 'We take you to a quiet sandbank, set up shade and a picnic, then leave you to enjoy the lagoon. Price is for the whole boat (up to 6 guests).',
   240, 220::numeric, null::numeric, null::numeric, 1, 6, true, true, '/images/sandbank.png',
   '{"Exclusive sandbank","Picnic lunch","Snorkel gear included"}'::text[], '{"Speedboat transfer","Parasol & mats","Picnic lunch & drinks","Snorkel gear"}'::text[], '{"Alcoholic drinks"}'::text[],
   '[{"time":"10:00","title":"Depart Maafushi"},{"time":"10:20","title":"Arrive sandbank","description":"Set-up and free time"},{"time":"12:30","title":"Picnic lunch"},{"time":"14:00","title":"Return"}]',
   '{"Maafushi harbour"}'::text[], 'Maafushi harbour'),
  ('manta-point-divers', 'diving', 'male', 'Manta Cleaning Station Dive', 'manta-cleaning-station-dive',
   'Watch reef mantas glide over a cleaning station at 15m.', 'A morning two-tank dive for certified divers. First tank at a manta cleaning station, second at a vibrant thila.',
   300, 155::numeric, null::numeric, null::numeric, 1, 8, false, true, '/images/manta.png',
   '{"Two-tank dive","Manta rays","PADI instructors"}'::text[], '{"Tanks & weights","Dive guide","Refreshments"}'::text[], '{"Equipment rental ($25)","Certification"}'::text[],
   '[{"time":"07:30","title":"Briefing at dive centre"},{"time":"08:30","title":"Dive 1: Manta Point"},{"time":"10:30","title":"Dive 2: Thila"},{"time":"12:30","title":"Return to Malé"}]',
   '{"Malé dive centre","Hulhumalé jetty"}'::text[], 'Manta Point Divers, Boduthakurufaanu Magu'),
  ('manta-point-divers', 'snorkeling', 'south-ari', 'Whale Shark Safari — South Ari', 'whale-shark-safari-south-ari',
   'Full-day search for the gentle giants of South Ari Atoll.', 'Speedboat transfer to South Ari''s marine protected area where whale sharks feed year-round. Includes lunch on a local island.',
   480, 190::numeric, 140::numeric, 230::numeric, 2, 14, false, true, '/images/whaleshark.png',
   '{"Whale sharks year-round","Lunch on Dhigurah","Marine biologist guide"}'::text[], '{"Speedboat","Snorkel gear","Lunch","Guide"}'::text[], '{"Marine park fee ($10)"}'::text[],
   '[{"time":"07:00","title":"Depart Malé"},{"time":"09:00","title":"Whale shark search"},{"time":"12:30","title":"Lunch on Dhigurah"},{"time":"15:00","title":"Return"}]',
   '{"Malé jetty","Maafushi harbour"}'::text[], 'Malé Jetty 3'),
  ('dhoni-sunset-co', 'dolphin-cruises', 'male', 'Sunset Dolphin Dhoni Cruise', 'sunset-dolphin-dhoni-cruise',
   'Spinner dolphins and golden-hour views from a traditional dhoni.', 'Board our restored wooden dhoni for a relaxed evening cruise to the dolphin channel, with tea and short eats on deck.',
   120, 40::numeric, 25::numeric, null::numeric, 1, 20, false, false, '/images/dolphins.png',
   '{"Spinner dolphins","Traditional dhoni","Sunset views"}'::text[], '{"Tea & short eats","Life jackets"}'::text[], '{"Hotel transfers"}'::text[],
   '[{"time":"16:30","title":"Board at Hulhumalé"},{"time":"17:00","title":"Dolphin channel"},{"time":"18:00","title":"Sunset on deck"},{"time":"18:30","title":"Return"}]',
   '{"Hulhumalé ferry terminal","Malé jetty"}'::text[], 'Hulhumalé ferry terminal'),
  ('dhoni-sunset-co', 'fishing', 'male', 'Traditional Night Fishing', 'traditional-night-fishing',
   'Learn Maldivian handline fishing under the stars and grill your catch.', 'Fish the old way with handlines from our dhoni. Your catch is grilled on board.',
   180, 50::numeric, 35::numeric, 65::numeric, 2, 16, false, false, '/images/fishing.png',
   '{"Handline fishing","BBQ your catch","Under the stars"}'::text[], '{"Fishing gear & bait","BBQ","Soft drinks"}'::text[], '{"Hotel transfers"}'::text[],
   '[{"time":"18:00","title":"Board"},{"time":"18:45","title":"Fishing"},{"time":"20:15","title":"Grill & dinner"},{"time":"21:00","title":"Return"}]',
   '{"Hulhumalé ferry terminal"}'::text[], 'Hulhumalé ferry terminal'),
  ('dhoni-sunset-co', 'sunset-cruises', 'baa-atoll', 'Catamaran Sunset Sail', 'catamaran-sunset-sail',
   'Sail Baa Atoll''s lagoons with mocktails as the sun sets.', 'A two-hour catamaran sail through the UNESCO biosphere reserve at golden hour.',
   150, 85::numeric, 55::numeric, null::numeric, 1, 18, false, false, '/images/sunset.png',
   '{"Catamaran sail","UNESCO reserve","Mocktails & canapés"}'::text[], '{"Mocktails","Canapés","Crew"}'::text[], '{"Transfers"}'::text[],
   '[{"time":"17:00","title":"Board"},{"time":"17:30","title":"Sail"},{"time":"18:30","title":"Sunset"},{"time":"19:30","title":"Return"}]',
   '{"Resort jetty pickup on request"}'::text[], 'Dharavandhoo harbour'),
  ('blue-lagoon-adventures', 'island-hopping', 'maafushi', 'Local Island Hopping Day', 'local-island-hopping-day',
   'Three islands, one day: village life, a resort lunch and a sandbank swim.', 'Visit a fishing village, enjoy lunch at a resort and finish with a swim on a sandbank.',
   420, 95::numeric, 65::numeric, null::numeric, 2, 14, false, false, '/images/islandhop.png',
   '{"3 islands","Resort lunch","Sandbank stop"}'::text[], '{"Speedboat","Lunch","Guide"}'::text[], '{"Resort day-pass extras"}'::text[],
   '[{"time":"09:00","title":"Depart"},{"time":"09:45","title":"Village visit"},{"time":"12:00","title":"Resort lunch"},{"time":"14:30","title":"Sandbank"},{"time":"16:00","title":"Return"}]',
   '{"Maafushi harbour"}'::text[], 'Maafushi harbour'),
  ('blue-lagoon-adventures', 'water-sports', 'maafushi', 'Jet Ski Lagoon Tour', 'jet-ski-lagoon-tour',
   'A guided 45-minute jet ski run across turquoise lagoons.', 'Ride a Yamaha jet ski behind our guide to nearby sandbanks and resort reefs. One or two riders per ski.',
   45, 120::numeric, null::numeric, 140::numeric, 1, 2, false, false, '/images/watersports.png',
   '{"Guided ride","Sandbank stops"}'::text[], '{"Jet ski & fuel","Life jacket","Briefing"}'::text[], '{"Photos"}'::text[],
   '[]', '{"Maafushi water sports hut"}'::text[], 'Maafushi bikini beach'),
  ('dhoni-sunset-co', 'sunset-cruises', 'male', 'Private Yacht Charter (Half Day)', 'private-yacht-charter-half-day',
   'Charter a luxury yacht with crew for up to 10 guests.', 'Tailor the route with our captain: snorkel stops, sandbanks or a quiet anchorage. Price is per charter.',
   240, 1450::numeric, null::numeric, null::numeric, 1, 10, true, true, '/images/yacht.png',
   '{"Private yacht & crew","Custom route","Snorkel stop"}'::text[], '{"Captain & crew","Soft drinks & fruit","Snorkel gear"}'::text[], '{"Catering upgrades"}'::text[],
   '[]', '{"Malé marina","Hulhumalé marina","Resort jetty"}'::text[], 'Malé marina')
) as x(vendor, cat, dest, title, slug, summary, description, duration, price, child_price, compare_at, min_g, max_g, is_private, featured, cover, highlights, inclusions, exclusions, itinerary, pickups, meeting)
on conflict (slug) do nothing;

-- Gallery: cover + two related photos per experience
insert into public.experience_images (experience_id, url, alt, sort_order)
select e.id, img.url, e.title, img.ord
from public.experiences e
cross join lateral (values (e.cover_image, 0), ('/images/hero.png', 1), ('/images/sandbank.png', 2)) as img(url, ord)
where not exists (select 1 from public.experience_images i where i.experience_id = e.id);

-- Availability: next 60 days for each experience
insert into public.availability_slots (experience_id, date, start_time, capacity)
select e.id, d::date,
  coalesce((e.itinerary -> 0 ->> 'time')::time, '09:00'::time),
  case when e.is_private then 1 else e.max_guests end
from public.experiences e
cross join generate_series(current_date + 1, current_date + 60, interval '1 day') as d
on conflict (experience_id, date, start_time) do nothing;

insert into public.reviews (experience_id, author_name, rating, title, body)
select e.id, r.author, r.rating, r.title, r.body
from public.experiences e
cross join (values
  ('Sophie L.', 5, 'Unforgettable', 'Crew were warm and safety-first. We saw so much marine life!'),
  ('Ahmed R.', 5, 'Worth every dollar', 'Well organised, on time, and the guide knew every reef.'),
  ('Marco B.', 4, 'Great day out', 'Beautiful spots. Bring reef-safe sunscreen.')
) as r(author, rating, title, body)
where not exists (select 1 from public.reviews x where x.experience_id = e.id);

insert into public.promotions (code, description, discount_type, value, min_subtotal, is_active) values
  ('LAGOON10', '10% off your first booking', 'percent', 10, 0, true),
  ('SUNSET25', '$25 off orders over $200', 'fixed', 25, 200, true)
on conflict (code) do nothing;

insert into public.banners (title, subtitle, image_url, cta_label, cta_href, placement, sort_order) values
  ('Monsoon deals on whale shark safaris', 'Save up to 20% on South Ari trips this season.', '/images/whaleshark.png', 'See deals', '/deals', 'home', 1),
  ('10% off your first booking', 'Use code LAGOON10 at checkout.', '/images/sunset.png', 'Explore experiences', '/experiences', 'deals', 1)
on conflict do nothing;

insert into public.cms_sections (key, data) values
  ('home', '{}'::jsonb),
  ('about', '{"title":"Made in the Maldives","body":"Excursion Maldives connects travellers with licensed local operators across the atolls. We started on Maafushi with a single speedboat and now partner with dozens of island businesses — every booking keeps money in local communities.","image_url":"/images/culture.png"}'::jsonb)
on conflict (key) do nothing;

insert into public.blog_posts (title, slug, excerpt, content, cover_image, status, published_at) values
  ('When to see whale sharks in the Maldives', 'when-to-see-whale-sharks', 'South Ari is the year-round hotspot. Here is how to plan your trip.', 'Whale sharks can be seen year-round in South Ari Atoll, with the best visibility between November and April...\n\nBook with a licensed operator, keep 3 metres distance, and never touch the animal.', '/images/whaleshark.png', 'published', now() - interval '10 days'),
  ('A first-timer''s guide to local islands', 'first-timers-guide-local-islands', 'Guesthouses, bikini beaches and etiquette for visiting local islands.', 'Local islands like Maafushi and Thulusdhoo offer an authentic, affordable Maldives...\n\nDress modestly in the village, swim at designated bikini beaches, and try mas huni for breakfast.', '/images/maafushi.png', 'published', now() - interval '3 days')
on conflict (slug) do nothing;

-- Promote your own account to admin after signing up:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
