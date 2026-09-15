-- =========================================================================
-- TAPA HEY — demo seed data for Supabase
-- Run AFTER schema.sql. Safe to re-run (uses fixed ids + upserts).
--
-- Staff / profiles are NOT created here because they must exist in
-- auth.users first. See README.md → "Supabase setup → Creating the admin
-- account" for the exact steps, then run the INSERT INTO staff block at
-- the bottom of this file with the real auth user id.
-- =========================================================================

-- ---------------------------------------------------------------------
-- Menu categories
-- ---------------------------------------------------------------------
insert into menu_categories (id, name, slug, description, sort_order, active) values
  ('00000000-0000-0000-0000-000000000001','Tapsilog','tapsilog','Our signature beef tapa plates',1,true),
  ('00000000-0000-0000-0000-000000000002','Silog Meals','silog-meals','Every Filipino breakfast classic',2,true),
  ('00000000-0000-0000-0000-000000000003','Sides','sides','Add a little extra',3,true),
  ('00000000-0000-0000-0000-000000000004','Drinks','drinks','Cold, hot and everything between',4,true),
  ('00000000-0000-0000-0000-000000000005','Desserts','desserts','Sweet Filipino endings',5,true),
  ('00000000-0000-0000-0000-000000000006','Promos','promos','Bundles that feed the barkada',6,true)
on conflict (id) do update set name = excluded.name, description = excluded.description;

-- ---------------------------------------------------------------------
-- Menu items
-- ---------------------------------------------------------------------
insert into menu_items (id, category_id, name, description, price, discount_price, image_url, prep_time_minutes, available, best_seller, sort_order) values
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000001','Classic Tapsilog','Sweet-savoury beef tapa, garlic rice and a sunny-side-up egg.',99,null,'/images/menu/tapa.jpg',15,true,true,1),
  ('00000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000001','Spicy Tapsilog','Beef tapa fired up with siling labuyo and house chili oil.',109,null,'/images/menu/tapa.jpg',15,true,true,2),
  ('00000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000001','Garlic Tapsilog','Double-garlic tapa with extra toasted garlic bits on top.',109,null,'/images/menu/tapa.jpg',15,true,false,3),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000002','Longsilog','Sweet Pampanga longganisa, garlic rice and egg.',89,null,'/images/menu/longanisa.jpg',12,true,true,4),
  ('00000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000002','Hotsilog','Jumbo hotdogs grilled to a snap, with rice and egg.',89,null,'/images/menu/hotdog.jpg',10,true,false,5),
  ('00000000-0000-0000-0001-000000000006','00000000-0000-0000-0000-000000000002','Tocilog','Sweet cured pork tocino caramelised on the griddle.',89,null,'/images/menu/tocino.jpg',12,true,true,6),
  ('00000000-0000-0000-0001-000000000007','00000000-0000-0000-0000-000000000002','Spamsilog','Thick-cut Spam, crisp on the edges, with rice and egg.',119,null,'/images/menu/spam.jpg',10,true,false,7),
  ('00000000-0000-0000-0001-000000000008','00000000-0000-0000-0000-000000000002','Cornsilog','Sautéed corned beef with onions, rice and egg.',95,null,'/images/menu/cornbeef.jpg',12,true,false,8),
  ('00000000-0000-0000-0001-000000000009','00000000-0000-0000-0000-000000000002','Bangsilog','Boneless daing na bangus fried until the skin crackles.',119,null,'/images/menu/bangus.jpg',15,true,false,9),
  ('00000000-0000-0000-0001-000000000010','00000000-0000-0000-0000-000000000002','Tinapasilog','Smoked tinapa flakes with tomatoes on the side.',99,null,'/images/menu/tinapa.jpg',12,true,false,10),
  ('00000000-0000-0000-0001-000000000011','00000000-0000-0000-0000-000000000002','Dilis Silog','Crispy fried dilis with spiced vinegar dip.',89,null,'/images/menu/dilis.jpg',10,true,false,11),
  ('00000000-0000-0000-0001-000000000012','00000000-0000-0000-0000-000000000002','Pusit Silog','Grilled squid rings glazed in calamansi-soy.',129,null,'/images/menu/pusit.jpg',18,true,false,12),
  ('00000000-0000-0000-0001-000000000013','00000000-0000-0000-0000-000000000002','Danggit Silog','Cebu-style salted danggit, fried light and crisp.',109,null,'/images/menu/danggit.jpg',12,true,false,13),
  ('00000000-0000-0000-0001-000000000014','00000000-0000-0000-0000-000000000002','Tuyo Silog','Classic salted tuyo — the true Filipino breakfast.',79,null,'/images/menu/tuyo.jpg',10,false,false,14),
  ('00000000-0000-0000-0001-000000000015','00000000-0000-0000-0000-000000000003','Extra Rice','One cup of steamed rice.',25,null,'/images/menu/rice.jpg',3,true,false,15),
  ('00000000-0000-0000-0001-000000000016','00000000-0000-0000-0000-000000000003','Garlic Rice','Fried rice tossed with toasted garlic.',35,null,'/images/menu/rice.jpg',5,true,false,16),
  ('00000000-0000-0000-0001-000000000017','00000000-0000-0000-0000-000000000003','Fried Egg','Sunny-side-up, runny yolk guaranteed.',20,null,'/images/menu/egg.jpg',3,true,false,17),
  ('00000000-0000-0000-0001-000000000018','00000000-0000-0000-0000-000000000003','Atchara','Pickled green papaya to cut the richness.',25,null,'/images/menu/side.jpg',2,true,false,18),
  ('00000000-0000-0000-0001-000000000019','00000000-0000-0000-0000-000000000004','Bottomless Iced Tea','House-brewed lemon iced tea, free refills in-store.',49,null,'/images/menu/drink.jpg',3,true,true,19),
  ('00000000-0000-0000-0001-000000000020','00000000-0000-0000-0000-000000000004','Soft Drinks','Ice-cold cola, lemon-lime or orange in can.',35,null,'/images/menu/drink.jpg',1,true,false,20),
  ('00000000-0000-0000-0001-000000000021','00000000-0000-0000-0000-000000000004','Bottled Water','500ml purified water.',20,null,'/images/menu/drink.jpg',1,true,false,21),
  ('00000000-0000-0000-0001-000000000022','00000000-0000-0000-0000-000000000004','Barako Coffee','Strong Batangas barako, brewed per order.',45,null,'/images/menu/coffee.jpg',5,true,false,22),
  ('00000000-0000-0000-0001-000000000023','00000000-0000-0000-0000-000000000004','Sago''t Gulaman','Sweet muscovado drink with sago pearls.',45,null,'/images/menu/drink.jpg',4,true,false,23),
  ('00000000-0000-0000-0001-000000000024','00000000-0000-0000-0000-000000000005','Leche Flan','Silky custard under a burnt-sugar cap.',59,null,'/images/menu/dessert.jpg',3,true,false,24),
  ('00000000-0000-0000-0001-000000000025','00000000-0000-0000-0000-000000000005','Halo-Halo','Shaved ice, sweet beans, leche flan and ube.',89,null,'/images/menu/dessert.jpg',6,true,true,25),
  ('00000000-0000-0000-0001-000000000026','00000000-0000-0000-0000-000000000005','Turon','Caramelised banana spring rolls, two pieces.',35,null,'/images/menu/dessert.jpg',6,true,false,26),
  ('00000000-0000-0000-0001-000000000027','00000000-0000-0000-0000-000000000006','Tapa Hey Barkada Bundle','4 tapsilog plates, 4 iced teas and 2 turon to share.',499,399,'/images/menu/promo.jpg',25,true,true,27),
  ('00000000-0000-0000-0001-000000000028','00000000-0000-0000-0000-000000000006','Solo Combo','Any silog meal plus a drink and leche flan.',159,129,'/images/menu/promo.jpg',15,true,false,28)
on conflict (id) do update set price = excluded.price, discount_price = excluded.discount_price, available = excluded.available;

-- ---------------------------------------------------------------------
-- Restaurant tables
-- ---------------------------------------------------------------------
insert into restaurant_tables (id, label, seats, area, active) values
  ('00000000-0000-0000-0002-000000000001','T1',2,'Main Hall',true),
  ('00000000-0000-0000-0002-000000000002','T2',4,'Main Hall',true),
  ('00000000-0000-0000-0002-000000000003','T3',4,'Window',true),
  ('00000000-0000-0000-0002-000000000004','T4',6,'Window',true),
  ('00000000-0000-0000-0002-000000000005','T5',8,'Function Room',true),
  ('00000000-0000-0000-0002-000000000006','T6',2,'Al Fresco',true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------
insert into inventory (id, name, stock, unit, minimum_stock, supplier) values
  ('00000000-0000-0000-0003-000000000001','Beef Tapa',42,'kg',15,'Monterey Meats'),
  ('00000000-0000-0000-0003-000000000002','Eggs',320,'pcs',120,'San Isidro Poultry'),
  ('00000000-0000-0000-0003-000000000003','Rice',86,'kg',40,'Nueva Ecija Grains'),
  ('00000000-0000-0000-0003-000000000004','Garlic',8,'kg',10,'Ilocos Produce'),
  ('00000000-0000-0000-0003-000000000005','Soy Sauce',24,'L',10,'Datu Puti Distributors'),
  ('00000000-0000-0000-0003-000000000006','Vinegar',19,'L',10,'Datu Puti Distributors'),
  ('00000000-0000-0000-0003-000000000007','Longganisa',5,'kg',12,'Pampanga Sausage Co.'),
  ('00000000-0000-0000-0003-000000000008','Hotdog',14,'kg',8,'Purefoods Supply'),
  ('00000000-0000-0000-0003-000000000009','Cooking Oil',0,'L',15,'Golden Fry Trading'),
  ('00000000-0000-0000-0003-000000000010','Soft Drinks',180,'cans',60,'Coca-Cola FEMSA'),
  ('00000000-0000-0000-0003-000000000011','Coffee',11,'kg',5,'Batangas Barako Farms'),
  ('00000000-0000-0000-0003-000000000012','Water',240,'bottles',80,'Wilkins Distribution')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Customers (guest customers — not linked to auth users)
-- ---------------------------------------------------------------------
insert into customers (id, profile_id, full_name, email, phone, address, active) values
  ('00000000-0000-0000-0004-000000000001',null,'Juan Dela Cruz','juan@tapahey.demo','+63 917 555 0101','12 Mabini St, Brgy. San Isidro, Quezon City',true),
  ('00000000-0000-0000-0004-000000000002',null,'Maria Santos','maria.santos@example.com','+63 918 555 0102','48 Rizal Ave, Brgy. Holy Spirit, Quezon City',true),
  ('00000000-0000-0000-0004-000000000003',null,'John Reyes','john.reyes@example.com','+63 919 555 0103','7 Katipunan Ext, Brgy. Bagumbayan, Quezon City',true),
  ('00000000-0000-0000-0004-000000000004',null,'Angela Cruz','angela.cruz@example.com','+63 920 555 0104','90 Kalayaan Ave, Brgy. Diliman, Quezon City',true),
  ('00000000-0000-0000-0004-000000000005',null,'Mark Garcia','mark.garcia@example.com','+63 921 555 0105','3 Tandang Sora, Brgy. Culiat, Quezon City',true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Sample orders + items + payments (so the dashboard isn't empty)
-- ---------------------------------------------------------------------
insert into orders (id, order_number, customer_id, order_type, subtotal, delivery_fee, discount, total, payment_status, order_status, customer_name, customer_email, customer_phone, delivery_address, delivery_city, table_number, created_at) values
  ('00000000-0000-0000-0005-000000000001','TH-20260401-1001','00000000-0000-0000-0004-000000000001','delivery',247,50,0,297,'paid','completed','Juan Dela Cruz','juan@tapahey.demo','+63 917 555 0101','12 Mabini St, Brgy. San Isidro, Quezon City','Quezon City',null, now() - interval '5 days'),
  ('00000000-0000-0000-0005-000000000002','TH-20260402-1002','00000000-0000-0000-0004-000000000002','dine_in',134,0,0,134,'paid','completed','Maria Santos','maria.santos@example.com','+63 918 555 0102',null,null,'T2', now() - interval '9 days'),
  ('00000000-0000-0000-0005-000000000003','TH-20260406-1009','00000000-0000-0000-0004-000000000004','delivery',260,50,0,310,'paid','confirmed','Angela Cruz','angela.cruz@example.com','+63 920 555 0104','90 Kalayaan Ave, Brgy. Diliman, Quezon City','Quezon City',null, now())
on conflict (id) do nothing;

insert into order_items (id, order_id, menu_item_id, item_name, quantity, unit_price) values
  ('00000000-0000-0000-0006-000000000001','00000000-0000-0000-0005-000000000001','00000000-0000-0000-0001-000000000001','Classic Tapsilog',2,99),
  ('00000000-0000-0000-0006-000000000002','00000000-0000-0000-0005-000000000001','00000000-0000-0000-0001-000000000019','Bottomless Iced Tea',1,49),
  ('00000000-0000-0000-0006-000000000003','00000000-0000-0000-0005-000000000002','00000000-0000-0000-0001-000000000006','Tocilog',1,89),
  ('00000000-0000-0000-0006-000000000004','00000000-0000-0000-0005-000000000002','00000000-0000-0000-0001-000000000022','Barako Coffee',1,45),
  ('00000000-0000-0000-0006-000000000005','00000000-0000-0000-0005-000000000003','00000000-0000-0000-0001-000000000008','Cornsilog',2,95),
  ('00000000-0000-0000-0006-000000000006','00000000-0000-0000-0005-000000000003','00000000-0000-0000-0001-000000000026','Turon',2,35)
on conflict (id) do nothing;

insert into payments (id, order_id, customer_id, amount, currency, payment_method, payment_status, transaction_reference, provider) values
  ('00000000-0000-0000-0007-000000000001','00000000-0000-0000-0005-000000000001','00000000-0000-0000-0004-000000000001',297,'PHP','gcash','paid','DEMO-20260401-1001-1000','demo'),
  ('00000000-0000-0000-0007-000000000002','00000000-0000-0000-0005-000000000002','00000000-0000-0000-0004-000000000002',134,'PHP','cash','paid','DEMO-20260402-1002-1001','cash'),
  ('00000000-0000-0000-0007-000000000003','00000000-0000-0000-0005-000000000003','00000000-0000-0000-0004-000000000004',310,'PHP','maya','paid','DEMO-20260406-1009-1002','demo')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Reservations
-- ---------------------------------------------------------------------
insert into reservations (id, customer_id, full_name, email, phone, reserved_date, reserved_time, guests, special_request, status) values
  ('00000000-0000-0000-0008-000000000001','00000000-0000-0000-0004-000000000001','Juan Dela Cruz','juan@tapahey.demo','+63 917 555 0101', current_date + 1, '18:30', 4, 'Birthday celebration, near the window please.', 'confirmed'),
  ('00000000-0000-0000-0008-000000000002','00000000-0000-0000-0004-000000000002','Maria Santos','maria.santos@example.com','+63 918 555 0102', current_date, '12:00', 2, null, 'seated'),
  ('00000000-0000-0000-0008-000000000003','00000000-0000-0000-0004-000000000003','John Reyes','john.reyes@example.com','+63 919 555 0103', current_date + 2, '19:00', 6, 'Team dinner — one long table if possible.', 'pending')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------
insert into reviews (id, customer_id, customer_name, rating, comment, approved, reply) values
  ('00000000-0000-0000-0009-000000000001','00000000-0000-0000-0004-000000000001','Juan Dela Cruz',5,'Affordable and super delicious. My favorite tapsilog place!',true,'Salamat po, Juan! See you again soon.'),
  ('00000000-0000-0000-0009-000000000002','00000000-0000-0000-0004-000000000002','Maria Santos',5,'The garlic rice alone is worth the trip. Egg was perfectly runny.',true,null),
  ('00000000-0000-0000-0009-000000000003','00000000-0000-0000-0004-000000000003','John Reyes',4,'Great value for money. Delivery arrived hot in 25 minutes.',true,null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Gallery
-- ---------------------------------------------------------------------
insert into gallery (id, title, image_url, sort_order, approved) values
  ('00000000-0000-0000-000a-000000000001','Classic Tapsilog plate','/images/menu/tapa.jpg',1,true),
  ('00000000-0000-0000-000a-000000000002','Longsilog, fresh off the griddle','/images/menu/longanisa.jpg',2,true),
  ('00000000-0000-0000-000a-000000000003','Tocilog mornings','/images/menu/tocino.jpg',3,true),
  ('00000000-0000-0000-000a-000000000004','Golden hour at Tapa Hey','/images/about.jpg',4,true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Website content
-- ---------------------------------------------------------------------
insert into website_content (section, content) values
  ('hero', '{"eyebrow":"GOOD FOOD. GOOD MOOD.","title":"Tapa Hey","description":"Classic Filipino tapsilog, made fresh and served with a smile.","image_url":"/images/hero.jpg","primary_button":"Order Now","secondary_button":"View Menu"}'),
  ('favorites', '{"title":"Tapsilog Favorites","description":"All-time favorite Filipino meals, cooked fresh and served hot."}'),
  ('about', '{"title":"More Than Just Tapsilog","description":"Tapa Hey is all about serving fresh, affordable, and delicious Filipino meals for everyone.","story":"We started in 2018 as a single roadside stall in Quezon City with one recipe: Lola Ising''s beef tapa.","image_url":"/images/about.jpg","button_text":"Our Story","highlights":[{"title":"Fresh Ingredients","description":"Meat and produce delivered every single morning."},{"title":"Affordable Meals","description":"Complete silog plates starting at ₱79."},{"title":"Customer First","description":"Hot, fast and always served with a smile."}]}'),
  ('why_choose_us', '{"title":"The Tapa Hey Difference","description":"Four reasons neighbours keep coming back every morning.","cards":[{"icon":"UtensilsCrossed","title":"Authentic Filipino Taste","description":"Recipes handed down three generations, unchanged."},{"icon":"Flame","title":"Freshly Cooked","description":"Nothing sits under a heat lamp."},{"icon":"PiggyBank","title":"Affordable Prices","description":"Honest pricing for a full, satisfying meal."},{"icon":"HeartHandshake","title":"Friendly Service","description":"You are family the moment you walk through the door."}]}'),
  ('reviews', '{"title":"What Our Customers Say","description":"Real reviews from real Tapa Hey regulars."}'),
  ('gallery', '{"title":"Our Food Moments","description":"A look inside the kitchen and the plates we send out."}'),
  ('location', '{"title":"Find Us","description":"Dine in, take out, or have it delivered hot to your door.","address":"123 Food Street, Brgy. San Isidro, Quezon City","phone":"+63 917 555 0199","email":"hello@tapahey.demo","opening_hours":"6:00 AM – 10:00 PM, daily","map_embed_url":"https://www.openstreetmap.org/export/embed.html?bbox=121.02%2C14.63%2C121.08%2C14.68&layer=mapnik"}'),
  ('footer', '{"tagline":"Good Food. Good Mood.","blurb":"Serving fresh, affordable Filipino breakfast plates in Quezon City since 2018.","facebook":"https://facebook.com","instagram":"https://instagram.com","tiktok":"https://tiktok.com"}')
on conflict (section) do update set content = excluded.content;

-- ---------------------------------------------------------------------
-- Restaurant settings (single row)
-- ---------------------------------------------------------------------
insert into restaurant_settings (id, name, tagline, address, phone, email, opening_hours, map_embed_url, delivery_fee, currency) values
  ('00000000-0000-0000-000b-000000000001','Tapa Hey','Good Food. Good Mood.','123 Food Street, Brgy. San Isidro, Quezon City','+63 917 555 0199','hello@tapahey.demo','6:00 AM – 10:00 PM',
   'https://www.openstreetmap.org/export/embed.html?bbox=121.02%2C14.63%2C121.08%2C14.68&layer=mapnik', 50, 'PHP')
on conflict (id) do update set name = excluded.name;

-- ---------------------------------------------------------------------
-- Branches
-- ---------------------------------------------------------------------
insert into branches (id, name, code, address, phone, active, is_main) values
  ('00000000-0000-0000-000c-000000000001','Tapa Hey – Main Branch','MAIN','123 Food Street, Brgy. San Isidro, Quezon City','+63 917 555 0199',true,true),
  ('00000000-0000-0000-000c-000000000002','Tapa Hey – Branch 02','BR02','45 Commonwealth Ave, Brgy. Batasan Hills, Quezon City','+63 917 555 0210',true,false),
  ('00000000-0000-0000-000c-000000000003','Tapa Hey – Branch 03','BR03','8 Marcos Highway, Brgy. Santolan, Pasig City','+63 917 555 0311',true,false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Packaged products (section 3D / 8) — added to the menu_items master
-- ---------------------------------------------------------------------
insert into menu_categories (id, name, slug, description, sort_order, active) values
  ('00000000-0000-0000-0000-000000000007','Packaged Products','packaged-products','Take-home and reseller-ready packaged goods',7,true)
on conflict (id) do nothing;

insert into menu_items (id, category_id, name, description, price, image_url, prep_time_minutes, available, sort_order, sku, barcode, cost, wholesale_price, product_type, batch_number, expiration_date) values
  ('00000000-0000-0000-0001-000000000029','00000000-0000-0000-0000-000000000007','Packaged Beef Tapa (500g)','Marinated raw beef tapa, vacuum-sealed, ready to fry at home.',320,'/images/menu/tapa.jpg',0,true,29,'TH-PKG-001','20001',190,240,'packaged','B2026-0091', current_date + 45),
  ('00000000-0000-0000-0001-000000000030','00000000-0000-0000-0000-000000000007','Frozen Beef Tapa (1kg)','Bulk frozen beef tapa for households and resellers.',580,'/images/menu/tapa.jpg',0,true,30,'TH-PKG-002','20002',340,430,'packaged','B2026-0088', current_date + 90),
  ('00000000-0000-0000-0001-000000000031','00000000-0000-0000-0000-000000000007','Tapa Hey Sawsawan (350ml)','House vinegar-soy dipping sauce, bottled.',99,'/images/menu/side.jpg',0,true,31,'TH-PKG-003','20003',42,65,'packaged','B2026-0102', current_date + 180),
  ('00000000-0000-0000-0001-000000000032','00000000-0000-0000-0000-000000000007','Toasted Garlic Oil (250ml)','House-toasted garlic oil for fried rice and dips.',149,'/images/menu/side.jpg',0,true,32,'TH-PKG-004','20004',78,110,'packaged','B2026-0075', current_date + 120)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Recipes / BOM — auto-deducts inventory when an order completes
-- ---------------------------------------------------------------------
insert into recipe_items (menu_item_id, inventory_id, ingredient_name, quantity_per_serving, unit) values
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000001','Beef Tapa',0.15,'kg'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000003','Rice',0.2,'kg'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000002','Eggs',1,'pcs'),
  ('00000000-0000-0000-0001-000000000001','00000000-0000-0000-0003-000000000004','Garlic',0.01,'kg'),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0003-000000000007','Longganisa',0.12,'kg'),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0003-000000000003','Rice',0.2,'kg'),
  ('00000000-0000-0000-0001-000000000004','00000000-0000-0000-0003-000000000002','Eggs',1,'pcs')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------
insert into suppliers (id, name, contact_name, phone, email, products, lead_time_days, payment_terms, status) values
  ('00000000-0000-0000-000d-000000000001','Monterey Meats','Ederic Tan','+63 918 200 1001','orders@montereymeats.demo','Beef Tapa',2,'Net 15','active'),
  ('00000000-0000-0000-000d-000000000002','San Isidro Poultry','Grace Uy','+63 918 200 1002','sales@sipoultry.demo','Eggs',1,'COD','active'),
  ('00000000-0000-0000-000d-000000000003','Ilocos Produce','Nena Lacsamana','+63 918 200 1004','nena@ilocosproduce.demo','Garlic, Onions',2,'COD','active')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Promotions
-- ---------------------------------------------------------------------
insert into promotions (id, code, description, discount_type, discount_value, min_purchase, start_date, end_date, active) values
  ('00000000-0000-0000-000e-000000000001','TAPA10','10% off your order','percent',10,0, current_date - 90, current_date + 90, true),
  ('00000000-0000-0000-000e-000000000002','BREAKFAST50','₱50 off breakfast orders over ₱250','fixed',50,250, current_date - 30, current_date + 60, true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Resellers (B2B)
-- ---------------------------------------------------------------------
insert into resellers (id, business_name, contact_name, phone, email, credit_limit, credit_terms_days, status) values
  ('00000000-0000-0000-000f-000000000001','Sari-Sari ni Aling Nena','Nena Villareal','+63 917 700 2001','nena.sari@example.com',20000,15,'active'),
  ('00000000-0000-0000-000f-000000000002','QC Pasalubong Center','Ferdie Ocampo','+63 917 700 2002','ferdie@qcpasalubong.demo',50000,30,'active')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Integrations (demo mode by default — see Admin ▸ Integrations)
-- ---------------------------------------------------------------------
insert into integrations (key, name, category, status) values
  ('stripe','Stripe','Payment Gateway','demo'),
  ('gcash','GCash','Payment Gateway','demo'),
  ('maya','Maya','Payment Gateway','demo'),
  ('delivery_platform','Delivery Platform','Delivery','demo'),
  ('accounting','Accounting Export','Finance','demo'),
  ('email','Email','Notifications','demo'),
  ('sms','SMS','Notifications','demo'),
  ('maps','Google Maps','Location','demo')
on conflict (key) do nothing;

-- =========================================================================
-- STAFF ACCOUNTS — run manually after creating each user in Supabase Auth
-- (Dashboard → Authentication → Users → Add user). Replace the UUIDs below
-- with the real auth user ids, then run:
-- =========================================================================
--
-- insert into profiles (id, email, full_name, role) values
--   ('<auth-user-uuid>', 'admin@tapahey.demo', 'Chef Andres Bautista', 'staff');
--
-- insert into staff (profile_id, email, full_name, role) values
--   ('<auth-user-uuid>', 'admin@tapahey.demo', 'Chef Andres Bautista', 'super_admin');
