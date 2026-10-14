-- Optional demo data for development/preview.
-- DO NOT run this file against a production database unless you replace the sample records.

insert into agents (id, name, role, phone, email, image) values
  ('a1', 'Aarav Mehta', 'Mumbai · Residential', '+91 98200 11122', 'aarav@havenproperty.in', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=85'),
  ('a2', 'Mira Kapoor', 'Pune · Residential', '+91 98220 33344', 'mira@havenproperty.in', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=700&q=85'),
  ('a3', 'Dev Shah', 'Bengaluru · Villas', '+91 98450 55566', 'dev@havenproperty.in', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=85'),
  ('a4', 'Rhea Bose', 'Bengaluru · Family homes', '+91 98860 77788', 'rhea@havenproperty.in', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=700&q=85'),
  ('a5', 'Ishaan Roy', 'Mumbai · Premium', '+91 99870 99011', 'ishaan@havenproperty.in', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=700&q=85')
on conflict (id) do update set active = true;

insert into properties (id, slug, title, property_type, status, price, location, city, address, area, bedrooms, bathrooms, floor, total_floors, furnishing, parking, description, amenities, image, images, featured, availability, agent_id, date_added, lat, lng, show_map, published)
values
  ('p1','skyline-glass-house','Skyline Glass House','Villa','For sale',48500000,'Bandra West, Mumbai','Mumbai','14 Carter Road, Bandra West, Mumbai 400050',3250,4,4,0,2,'Semi-furnished',2,'A contemporary family home designed around light, air and an unusually generous connection to the garden.',
    array['Private garden','Sunset terrace','Italian kitchen','Home office','Double-height living','CCTV & security'],
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=88',
    array['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=88','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=88'],
    true,'Available','a1','2026-06-02',19.0596,72.8295,false,true),
  ('p2','the-olive-residency','The Olive Residency','Apartment','For sale',14200000,'Kalyani Nagar, Pune','Pune','Tower 3, Olive Residency, Kalyani Nagar, Pune 411006',1860,3,3,7,14,'Unfurnished',1,'An easy, polished apartment with generous windows, a calm neutral interior and a floor plan that works for everyday life.',
    array['Clubhouse','Pool','Gym','2 lifts','Power backup','Visitor parking'],
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=88',
    array['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=88'],
    true,'Available','a2','2026-07-11',18.5489,73.9019,false,true),
  ('p7','monsoon-house','Monsoon House','House','For rent',75000,'Kharadi, Pune','Pune','14 Monsoon Lane, Kharadi, Pune 411014',2050,3,3,0,2,'Furnished',2,'A breezy rental with a covered veranda, bright interiors and a sensible commute to Kharadi''s business district.',
    array['Fully furnished','Garden','24/7 security','2 covered parking','Pet friendly'],
    'https://images.unsplash.com/photo-1600566753051-96eafc56f5d5?auto=format&fit=crop&w=1600&q=88',
    array['https://images.unsplash.com/photo-1600566753051-96eafc56f5d5?auto=format&fit=crop&w=1600&q=88'],
    false,'Available','a1','2026-08-20',18.5515,73.9438,false,true)
on conflict (id) do update set published = excluded.published, updated_at = now();
