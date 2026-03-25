-- =====================================================
-- GENERATE 50 LAUNDROMATS IN GENERAL SANTOS CITY
-- =====================================================

-- First, insert the owner profile
INSERT INTO public.profiles (
    id, role, phone, address, city_id, is_suspended, created_at, username, first_name, surname, full_name
) VALUES (
    '12f35878-4d44-4306-890e-e8878c69887a', 'shop_owner', '09123640851', 'General Santos City', 'a1a1a1a1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', FALSE, NOW(), 'Tjflores', 'Tycoon James', 'Flores', 'Tycoon James Flores'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- GENERATE 50 LAUNDRY SHOPS
-- =====================================================

DO $$
DECLARE
    shop_ids TEXT[] := ARRAY[
        'aaaaaaaa-bbbb-cccc-0001-000000000001',
        'aaaaaaaa-bbbb-cccc-0002-000000000002',
        'aaaaaaaa-bbbb-cccc-0003-000000000003',
        'aaaaaaaa-bbbb-cccc-0004-000000000004',
        'aaaaaaaa-bbbb-cccc-0005-000000000005',
        'aaaaaaaa-bbbb-cccc-0006-000000000006',
        'aaaaaaaa-bbbb-cccc-0007-000000000007',
        'aaaaaaaa-bbbb-cccc-0008-000000000008',
        'aaaaaaaa-bbbb-cccc-0009-000000000009',
        'aaaaaaaa-bbbb-cccc-0010-000000000010',
        'aaaaaaaa-bbbb-cccc-0011-000000000011',
        'aaaaaaaa-bbbb-cccc-0012-000000000012',
        'aaaaaaaa-bbbb-cccc-0013-000000000013',
        'aaaaaaaa-bbbb-cccc-0014-000000000014',
        'aaaaaaaa-bbbb-cccc-0015-000000000015',
        'aaaaaaaa-bbbb-cccc-0016-000000000016',
        'aaaaaaaa-bbbb-cccc-0017-000000000017',
        'aaaaaaaa-bbbb-cccc-0018-000000000018',
        'aaaaaaaa-bbbb-cccc-0019-000000000019',
        'aaaaaaaa-bbbb-cccc-0020-000000000020',
        'aaaaaaaa-bbbb-cccc-0021-000000000021',
        'aaaaaaaa-bbbb-cccc-0022-000000000022',
        'aaaaaaaa-bbbb-cccc-0023-000000000023',
        'aaaaaaaa-bbbb-cccc-0024-000000000024',
        'aaaaaaaa-bbbb-cccc-0025-000000000025',
        'aaaaaaaa-bbbb-cccc-0026-000000000026',
        'aaaaaaaa-bbbb-cccc-0027-000000000027',
        'aaaaaaaa-bbbb-cccc-0028-000000000028',
        'aaaaaaaa-bbbb-cccc-0029-000000000029',
        'aaaaaaaa-bbbb-cccc-0030-000000000030',
        'aaaaaaaa-bbbb-cccc-0031-000000000031',
        'aaaaaaaa-bbbb-cccc-0032-000000000032',
        'aaaaaaaa-bbbb-cccc-0033-000000000033',
        'aaaaaaaa-bbbb-cccc-0034-000000000034',
        'aaaaaaaa-bbbb-cccc-0035-000000000035',
        'aaaaaaaa-bbbb-cccc-0036-000000000036',
        'aaaaaaaa-bbbb-cccc-0037-000000000037',
        'aaaaaaaa-bbbb-cccc-0038-000000000038',
        'aaaaaaaa-bbbb-cccc-0039-000000000039',
        'aaaaaaaa-bbbb-cccc-0040-000000000040',
        'aaaaaaaa-bbbb-cccc-0041-000000000041',
        'aaaaaaaa-bbbb-cccc-0042-000000000042',
        'aaaaaaaa-bbbb-cccc-0043-000000000043',
        'aaaaaaaa-bbbb-cccc-0044-000000000044',
        'aaaaaaaa-bbbb-cccc-0045-000000000045',
        'aaaaaaaa-bbbb-cccc-0046-000000000046',
        'aaaaaaaa-bbbb-cccc-0047-000000000047',
        'aaaaaaaa-bbbb-cccc-0048-000000000048',
        'aaaaaaaa-bbbb-cccc-0049-000000000049',
        'aaaaaaaa-bbbb-cccc-0050-000000000050'
    ];
    
    shop_names TEXT[] := ARRAY[
        'Clean & Fresh Laundry Center',
        'Super Wash Hub',
        'Quick Clean Laundromat',
        'Fresh Drops Laundry Shop',
        'Sparkle Laundry Services',
        'Easy Wash Laundry',
        'Green Leaf Laundry',
        'Ocean Breeze Laundry',
        'Gold Star Laundry',
        'City Clean Laundry',
        'Sampaguita Laundry Hub',
        'Mabuhay Wash & Dry',
        'Prime Laundry Services',
        'Rapid Clean Laundromat',
        'Tropical Wash Laundry',
        'Sunrise Laundry Center',
        'Premium Laundry Shop',
        'Mega Clean Laundry',
        'Eco Wash Laundry',
        'Royal Laundry Services',
        'Smart Wash Laundry',
        'Happy Laundry Hub',
        'Clean Pro Laundromat',
        'Fresh Start Laundry',
        'Flash Wash Laundry',
        'Pure Clean Laundry',
        'Reliable Laundry Services',
        'Modern Wash Laundry',
        'Trusty Laundry Shop',
        'Velvet Clean Laundry',
        'Breeze Laundry Center',
        'Luzon Wash & Dry',
        'Island Laundry Services',
        'Dawn Fresh Laundry',
        'Elite Wash Laundry',
        'Gentle Care Laundry',
        'Wonder Clean Laundry',
        'Ace Laundry Services',
        'Star Bright Laundry',
        'Pro Wash Laundry Hub',
        'Neat & Clean Laundry',
        'Blue Sky Laundry',
        'Crystal Clean Laundry',
        'Dream Wash Laundry',
        'Efficient Laundry Services',
        'Fast Track Laundry',
        'Golden Touch Laundry',
        'Hub of Clean Laundry',
        'Impress Laundry Shop',
        'Jiffy Clean Laundry',
        'Keen Laundry Services'
    ];
    
    shop_descriptions TEXT[] := ARRAY[
        'Professional laundry services with state-of-the-art equipment. Fast turnaround and affordable prices.',
        'Your trusted neighborhood laundry hub offering self-service and full-service options.',
        'Quality laundry care for families and individuals. Same-day service available.',
        'Premium laundry services with eco-friendly detergents. Gentle on clothes, tough on stains.',
        'Convenient location with ample parking. Professional staff ready to assist you.',
        'Wide range of laundry services from wash and fold to dry cleaning. Satisfaction guaranteed.',
        'Modern facilities with high-capacity machines. Perfect for bulk laundry needs.',
        'Family-owned laundry shop with personalized service. Treat your clothes with care.',
        'Fast, reliable, and affordable laundry services. Open early until late.',
        'Specialized in delicate fabrics and formal wear. Expert handling guaranteed.',
        'Self-service laundromat with coin-operated machines. Clean and well-maintained.',
        'Full-service laundry with pickup and delivery. Laundry day made easy.',
        'Commercial and residential laundry services. Bulk orders welcome.',
        'Premium wash, dry, and fold services. Fresh-smelling laundry every time.',
        'Affordable rates with high-quality results. Your laundry, our priority.',
        'State-of-the-art equipment for the best clean. Customer satisfaction is our goal.',
        'Convenient drop-off service. While you shop, we wash!',
        'Professional stain removal expertise. Even the toughest stains dont stand a chance.',
        'Quick turnaround times without compromising quality. Laundry done right.',
        'Eco-conscious laundry practices. Green and clean for a better tomorrow.'
    ];
    
    locations TEXT[] := ARRAY[
        'J. Catolico Avenue, General Santos City',
        'Quezon Avenue, General Santos City',
        'Datu Esmael Rouge Street, General Santos City',
        'San Miguel Street, General Santos City',
        'Mabini Street, General Santos City',
        'P. Acharon Street, General Santos City',
        'Santa Rosa Street, General Santos City',
        'Almond Avenue, General Santos City',
        'Cattleya Street, General Santos City',
        'Dahlia Street, General Santos City',
        'Orchid Street, General Santos City',
        'Rose Street, General Santos City',
        'Illana Street, General Santos City',
        'Cagayan de Oro Street, General Santos City',
        'Davao-Cotabato Road, General Santos City',
        'National Highway, General Santos City',
        'Caloocan Street, General Santos City',
        'M. Roxas Street, General Santos City',
        'Pioneer Avenue, General Santos City',
        'Tinio Street, General Santos City',
        'Aguilar Street, General Santos City',
        'Legaspi Street, General Santos City',
        'Burgos Street, General Santos City',
        'Bonifacio Street, General Santos City',
        'Rizal Street, General Santos City',
        'Luna Street, General Santos City',
        'Sarangani Street, General Santos City',
        'South Cotabato Street, General Santos City',
        'Sultan Kudarat Street, General Santos City',
        'Maguindanao Street, General Santos City'
    ];
    
    i INTEGER;
    shop_id TEXT;
    shop_name TEXT;
    shop_desc TEXT;
    shop_loc TEXT;
    lat_val NUMERIC(10,7);
    lng_val NUMERIC(10,7);
    price_val NUMERIC(10,2);
    capacity_val NUMERIC(8,2);
    rating_val NUMERIC(2,1);
    reviews_val INTEGER;
    badge_val TEXT;
    eta_min_val INTEGER;
    eta_max_val INTEGER;
BEGIN
    FOR i IN 1..50 LOOP
        shop_id := shop_ids[i];
        shop_name := shop_names[i];
        shop_desc := shop_descriptions[((i - 1) % array_length(shop_descriptions, 1)) + 1];
        shop_loc := locations[((i - 1) % array_length(locations, 1)) + 1];
        
        -- Generate coordinates within General Santos City area
        lat_val := 6.1000 + (random() * 0.0500);
        lng_val := 125.1400 + (random() * 0.0600);
        
        -- Random starting price between 50 and 150
        price_val := 50 + (random() * 100);
        
        -- Random load capacity between 6 and 12 kg
        capacity_val := 6 + (random() * 6);
        
        -- Random rating between 3.5 and 5.0
        rating_val := 3.5 + (random() * 1.5);
        
        -- Random reviews between 5 and 150
        reviews_val := 5 + (floor(random() * 146))::INTEGER;
        
        -- Random promo badge (30% chance)
        badge_val := CASE WHEN random() < 0.3 THEN 
            CASE floor(random() * 3)::INTEGER 
                WHEN 0 THEN 'HOT DEAL'
                WHEN 1 THEN 'BEST VALUE'
                ELSE 'NEW'
            END
        ELSE NULL END;
        
        -- Random ETA between 25-60 minutes
        eta_min_val := 25 + (floor(random() * 15))::INTEGER;
        eta_max_val := eta_min_val + 10 + (floor(random() * 20))::INTEGER;
        
        INSERT INTO public.laundry_shops (
            id, owner_id, shop_name, description, location, cover_image_url,
            city_id, starting_price, price_per_kg, load_capacity_kg, commission_percentage,
            is_verified, rating_avg, total_reviews, promo_badge, eta_min, eta_max,
            lat, lng, created_at
        ) VALUES (
            shop_id::uuid,
            '12f35878-4d44-4306-890e-e8878c69887a'::uuid,
            shop_name,
            shop_desc,
            shop_loc,
            NULL,
            'a1a1a1a1-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
            round(price_val, 2),
            round(price_val, 2), -- price_per_kg, same as starting_price for demo
            round(capacity_val, 2),
            10.00,
            TRUE,
            round(rating_val, 1),
            reviews_val,
            badge_val,
            eta_min_val,
            eta_max_val,
            round(lat_val, 6),
            round(lng_val, 6),
            NOW() - (random() * INTERVAL '180 days')
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- GENERATE SERVICES FOR EACH SHOP
-- =====================================================

DO $$
DECLARE
    shop_ids TEXT[] := ARRAY[
        'aaaaaaaa-bbbb-cccc-0001-000000000001',
        'aaaaaaaa-bbbb-cccc-0002-000000000002',
        'aaaaaaaa-bbbb-cccc-0003-000000000003',
        'aaaaaaaa-bbbb-cccc-0004-000000000004',
        'aaaaaaaa-bbbb-cccc-0005-000000000005',
        'aaaaaaaa-bbbb-cccc-0006-000000000006',
        'aaaaaaaa-bbbb-cccc-0007-000000000007',
        'aaaaaaaa-bbbb-cccc-0008-000000000008',
        'aaaaaaaa-bbbb-cccc-0009-000000000009',
        'aaaaaaaa-bbbb-cccc-0010-000000000010',
        'aaaaaaaa-bbbb-cccc-0011-000000000011',
        'aaaaaaaa-bbbb-cccc-0012-000000000012',
        'aaaaaaaa-bbbb-cccc-0013-000000000013',
        'aaaaaaaa-bbbb-cccc-0014-000000000014',
        'aaaaaaaa-bbbb-cccc-0015-000000000015',
        'aaaaaaaa-bbbb-cccc-0016-000000000016',
        'aaaaaaaa-bbbb-cccc-0017-000000000017',
        'aaaaaaaa-bbbb-cccc-0018-000000000018',
        'aaaaaaaa-bbbb-cccc-0019-000000000019',
        'aaaaaaaa-bbbb-cccc-0020-000000000020',
        'aaaaaaaa-bbbb-cccc-0021-000000000021',
        'aaaaaaaa-bbbb-cccc-0022-000000000022',
        'aaaaaaaa-bbbb-cccc-0023-000000000023',
        'aaaaaaaa-bbbb-cccc-0024-000000000024',
        'aaaaaaaa-bbbb-cccc-0025-000000000025',
        'aaaaaaaa-bbbb-cccc-0026-000000000026',
        'aaaaaaaa-bbbb-cccc-0027-000000000027',
        'aaaaaaaa-bbbb-cccc-0028-000000000028',
        'aaaaaaaa-bbbb-cccc-0029-000000000029',
        'aaaaaaaa-bbbb-cccc-0030-000000000030',
        'aaaaaaaa-bbbb-cccc-0031-000000000031',
        'aaaaaaaa-bbbb-cccc-0032-000000000032',
        'aaaaaaaa-bbbb-cccc-0033-000000000033',
        'aaaaaaaa-bbbb-cccc-0034-000000000034',
        'aaaaaaaa-bbbb-cccc-0035-000000000035',
        'aaaaaaaa-bbbb-cccc-0036-000000000036',
        'aaaaaaaa-bbbb-cccc-0037-000000000037',
        'aaaaaaaa-bbbb-cccc-0038-000000000038',
        'aaaaaaaa-bbbb-cccc-0039-000000000039',
        'aaaaaaaa-bbbb-cccc-0040-000000000040',
        'aaaaaaaa-bbbb-cccc-0041-000000000041',
        'aaaaaaaa-bbbb-cccc-0042-000000000042',
        'aaaaaaaa-bbbb-cccc-0043-000000000043',
        'aaaaaaaa-bbbb-cccc-0044-000000000044',
        'aaaaaaaa-bbbb-cccc-0045-000000000045',
        'aaaaaaaa-bbbb-cccc-0046-000000000046',
        'aaaaaaaa-bbbb-cccc-0047-000000000047',
        'aaaaaaaa-bbbb-cccc-0048-000000000048',
        'aaaaaaaa-bbbb-cccc-0049-000000000049',
        'aaaaaaaa-bbbb-cccc-0050-000000000050'
    ];
    
    service_names TEXT[] := ARRAY[
        'Self-Service Wash',
        'Self-Service Dry',
        'Wash, Dry & Fold',
        'Premium Care',
        'Deluxe Dry Clean',
        'Wash & Iron',
        'Blanket Cleaning',
        'Family Load Bundle',
        'Same-Day Express',
        'Eco Wash',
        'Bulky Items Laundry',
        'Curtain Cleaning Service',
        'Comforter Deep Clean',
        'Kids Laundry Special',
        'Work Uniform Service'
    ];
    
    service_descriptions TEXT[] := ARRAY[
        'Use our high-capacity washers yourself. Great for everyday clothes.',
        'Quick and efficient drying using our commercial dryers.',
        'Full-service wash, dry, and fold. We do everything for you.',
        'Premium washing with delicate-safe settings for sensitive fabrics.',
        'Professional dry cleaning for formal wear and special garments.',
        'Wash service with neatly pressed finishes, ready to wear.',
        'Deep cleaning for comforters, blankets, and bulky linens.',
        'Large family load bundle - wash, dry, and fold.',
        'Same-day express service with priority turnaround.',
        'Eco-friendly washing using low-residue detergents.',
        'Specialized cleaning for pillows, rugs, and large items.',
        'Professional curtain cleaning with proper handling.',
        'Deep cleaning for comforters and duvets.',
        'Gentle washing for childrens clothing and linens.',
        'Commercial-grade cleaning for office uniforms.'
    ];
    
    i INTEGER;
    j INTEGER;
    num_services INTEGER;
    service_id UUID;
    shop_id TEXT;
    svc_name TEXT;
    svc_desc TEXT;
    pricing_model TEXT;
    unit_price NUMERIC(10,2);
    load_capacity NUMERIC(8,2);
BEGIN
    FOR i IN 1..50 LOOP
        shop_id := shop_ids[i];
        
        -- Each shop gets 4-10 services randomly
        num_services := 4 + (floor(random() * 7))::INTEGER;
        
        FOR j IN 1..num_services LOOP
            service_id := gen_random_uuid();
            
            -- Random service selection
            svc_name := service_names[((i + j - 1) % array_length(service_names, 1)) + 1];
            svc_desc := service_descriptions[((i + j - 1) % array_length(service_descriptions, 1)) + 1];
            
            -- Random pricing model
            IF (i + j) % 3 = 0 THEN
                pricing_model := 'per_kg';
            ELSE
                pricing_model := 'per_load';
            END IF;
            
            -- Random unit price based on service type
            IF svc_name LIKE '%Dry Clean%' THEN
                unit_price := 180 + (random() * 100);
            ELSIF svc_name LIKE '%Premium%' THEN
                unit_price := 100 + (random() * 60);
            ELSIF svc_name LIKE '%Express%' THEN
                unit_price := 150 + (random() * 80);
            ELSIF svc_name LIKE '%Self-Service%' THEN
                unit_price := 40 + (random() * 40);
            ELSE
                unit_price := 80 + (random() * 100);
            END IF;
            
            -- Random load capacity between 5-10 kg
            load_capacity := 5 + (random() * 5);
            
            INSERT INTO public.services (
                id, shop_id, name, description, pricing_model, unit_price,
                price_per_kg, load_capacity_kg, created_at
            ) VALUES (
                service_id,
                shop_id::uuid,
                svc_name,
                svc_desc,
                pricing_model,
                round(unit_price, 2),
                round(unit_price, 2),
                round(load_capacity, 2),
                NOW() - (random() * INTERVAL '90 days')
            )
            ON CONFLICT (id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- GENERATE SERVICE OPTION GROUPS FOR FULL-SERVICE SHOP
-- =====================================================

-- For shops 1-30, add option groups to their Wash, Dry & Fold and similar services
DO $$
DECLARE
    shop_ids TEXT[] := ARRAY[
        'aaaaaaaa-bbbb-cccc-0001-000000000001',
        'aaaaaaaa-bbbb-cccc-0002-000000000002',
        'aaaaaaaa-bbbb-cccc-0003-000000000003',
        'aaaaaaaa-bbbb-cccc-0004-000000000004',
        'aaaaaaaa-bbbb-cccc-0005-000000000005',
        'aaaaaaaa-bbbb-cccc-0006-000000000006',
        'aaaaaaaa-bbbb-cccc-0007-000000000007',
        'aaaaaaaa-bbbb-cccc-0008-000000000008',
        'aaaaaaaa-bbbb-cccc-0009-000000000009',
        'aaaaaaaa-bbbb-cccc-0010-000000000010',
        'aaaaaaaa-bbbb-cccc-0011-000000000011',
        'aaaaaaaa-bbbb-cccc-0012-000000000012',
        'aaaaaaaa-bbbb-cccc-0013-000000000013',
        'aaaaaaaa-bbbb-cccc-0014-000000000014',
        'aaaaaaaa-bbbb-cccc-0015-000000000015',
        'aaaaaaaa-bbbb-cccc-0016-000000000016',
        'aaaaaaaa-bbbb-cccc-0017-000000000017',
        'aaaaaaaa-bbbb-cccc-0018-000000000018',
        'aaaaaaaa-bbbb-cccc-0019-000000000019',
        'aaaaaaaa-bbbb-cccc-0020-000000000020',
        'aaaaaaaa-bbbb-cccc-0021-000000000021',
        'aaaaaaaa-bbbb-cccc-0022-000000000022',
        'aaaaaaaa-bbbb-cccc-0023-000000000023',
        'aaaaaaaa-bbbb-cccc-0024-000000000024',
        'aaaaaaaa-bbbb-cccc-0025-000000000025',
        'aaaaaaaa-bbbb-cccc-0026-000000000026',
        'aaaaaaaa-bbbb-cccc-0027-000000000027',
        'aaaaaaaa-bbbb-cccc-0028-000000000028',
        'aaaaaaaa-bbbb-cccc-0029-000000000029',
        'aaaaaaaa-bbbb-cccc-0030-000000000030'
    ];
    
    i INTEGER;
    service_ids TEXT[];
    service_id TEXT;
    group_id UUID;
    group_ids TEXT[] := ARRAY[]::TEXT[];
BEGIN
    FOR i IN 1..30 LOOP
        -- Get Wash, Dry & Fold service ID for this shop
        SELECT array_agg(id::TEXT)
        INTO service_ids
        FROM public.services
        WHERE shop_id = shop_ids[i]::uuid
        AND name = 'Wash, Dry & Fold';
        
        IF service_ids IS NOT NULL AND array_length(service_ids, 1) > 0 THEN
            service_id := service_ids[1];
            
            -- Insert Detergent group
            group_id := gen_random_uuid();
            group_ids := array_append(group_ids, group_id::TEXT);
            
            INSERT INTO public.service_option_groups (
                id, service_id, name, option_type, selection_type, is_required, sort_order, created_at
            ) VALUES (
                group_id,
                service_id::uuid,
                'Detergent', 'detergent', 'single', TRUE, 1, NOW()
            )
            ON CONFLICT (id) DO NOTHING;
            
            -- Insert Fabcon group
            group_id := gen_random_uuid();
            group_ids := array_append(group_ids, group_id::TEXT);
            
            INSERT INTO public.service_option_groups (
                id, service_id, name, option_type, selection_type, is_required, sort_order, created_at
            ) VALUES (
                group_id,
                service_id::uuid,
                'Fabric Conditioner', 'fabcon', 'single', TRUE, 2, NOW()
            )
            ON CONFLICT (id) DO NOTHING;
            
            -- Insert Add-ons group
            group_id := gen_random_uuid();
            group_ids := array_append(group_ids, group_id::TEXT);
            
            INSERT INTO public.service_option_groups (
                id, service_id, name, option_type, selection_type, is_required, sort_order, created_at
            ) VALUES (
                group_id,
                service_id::uuid,
                'Add-ons', 'addon', 'multiple', FALSE, 3, NOW()
            )
            ON CONFLICT (id) DO NOTHING;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Service option groups created';
END $$;

-- =====================================================
-- GENERATE SERVICE OPTIONS
-- =====================================================

DO $$
DECLARE
    detergent_groups UUID[];
    fabcon_groups UUID[];
    addon_groups UUID[];
    i INTEGER;
    option_id UUID;
BEGIN
    -- Get all detergent groups
    SELECT array_agg(id)
    INTO detergent_groups
    FROM public.service_option_groups
    WHERE option_type = 'detergent';
    
    -- Get all fabcon groups
    SELECT array_agg(id)
    INTO fabcon_groups
    FROM public.service_option_groups
    WHERE option_type = 'fabcon';
    
    -- Get all addon groups
    SELECT array_agg(id)
    INTO addon_groups
    FROM public.service_option_groups
    WHERE option_type = 'addon';
    
    -- Insert detergent options
    IF detergent_groups IS NOT NULL AND array_length(detergent_groups, 1) > 0 THEN
        FOR i IN 1..array_length(detergent_groups, 1) LOOP
            option_id := gen_random_uuid();
            INSERT INTO public.service_options (
                id, group_id, name, description, price_delta, price_type, is_default, sort_order, created_at
            ) VALUES (
                option_id,
                detergent_groups[i]::uuid,
                'Regular Detergent', 'Standard detergent for everyday clothes', 0, 'per_order', TRUE, 1, NOW()
            ) ON CONFLICT (id) DO NOTHING;
            
            option_id := gen_random_uuid();
            INSERT INTO public.service_options (
                id, group_id, name, description, price_delta, price_type, is_default, sort_order, created_at
            ) VALUES (
                option_id,
                detergent_groups[i]::uuid,
                'Baby Safe Detergent', 'Mild detergent for infant wear and sensitive skin', 25, 'per_load', FALSE, 2, NOW()
            ) ON CONFLICT (id) DO NOTHING;
            
            option_id := gen_random_uuid();
            INSERT INTO public.service_options (
                id, group_id, name, description, price_delta, price_type, is_default, sort_order, created_at
            ) VALUES (
                option_id,
                detergent_groups[i]::uuid,
                'Hypoallergenic', 'Low-residue detergent for allergy-sensitive skin', 30, 'per_load', FALSE, 3, NOW()
            ) ON CONFLICT (id) DO NOTHING;
        END LOOP;
    END IF;
    
    -- Insert fabcon options
    IF fabcon_groups IS NOT NULL AND array_length(fabcon_groups, 1) > 0 THEN
        FOR i IN 1..array_length(fabcon_groups, 1) LOOP
            option_id := gen_random_uuid();
            INSERT INTO public.service_options (
                id, group_id, name, description, price_delta, price_type, is_default, sort_order, created_at
            ) VALUES (
                option_id,
                fabcon_groups[i]::uuid,
                'Regular Softener', 'Standard fabric softener', 0, 'per_order', TRUE, 1, NOW()
            ) ON CONFLICT (id) DO NOTHING;
            
            option_id := gen_random_uuid();
            INSERT INTO public.service_options (
                id, group_id, name, description, price_delta, price_type, is_default, sort_order, created_at
            ) VALUES (
                option_id,
                fabcon_groups[i]::uuid,
                'Lavender Scent', 'Fresh lavender fragrance with lasting scent', 15, 'per_load', FALSE, 2, NOW()
            ) ON CONFLICT (id) DO NOTHING;
            
            option_id := gen_random_uuid();
            INSERT INTO public.service_options (
                id, group_id, name, description, price_delta, price_type, is_default, sort_order, created_at
            ) VALUES (
                option_id,
                fabcon_groups[i]::uuid,
                'Sampaguita Fresh', 'Filipino-favorite floral scent for that fresh laundry smell', 20, 'per_load', FALSE, 3, NOW()
            ) ON CONFLICT (id) DO NOTHING;
        END LOOP;
    END IF;
    
    -- Insert addon options
    IF addon_groups IS NOT NULL AND array_length(addon_groups, 1) > 0 THEN
        FOR i IN 1..array_length(addon_groups, 1) LOOP
            option_id := gen_random_uuid();
            INSERT INTO public.service_options (
                id, group_id, name, description, price_delta, price_type, is_default, sort_order, created_at
            ) VALUES (
                option_id,
                addon_groups[i]::uuid,
                'Express Turnaround', 'Prioritize washing queue for faster release', 40, 'per_load', FALSE, 1, NOW()
            ) ON CONFLICT (id) DO NOTHING;
            
            option_id := gen_random_uuid();
            INSERT INTO public.service_options (
                id, group_id, name, description, price_delta, price_type, is_default, sort_order, created_at
            ) VALUES (
                option_id,
                addon_groups[i]::uuid,
                'Stain Treatment', 'Targeted spotting for collars and common stain areas', 45, 'per_order', FALSE, 2, NOW()
            ) ON CONFLICT (id) DO NOTHING;
            
            option_id := gen_random_uuid();
            INSERT INTO public.service_options (
                id, group_id, name, description, price_delta, price_type, is_default, sort_order, created_at
            ) VALUES (
                option_id,
                addon_groups[i]::uuid,
                'Ironing Service', 'Add pressing for ready-to-store laundry', 55, 'per_load', FALSE, 3, NOW()
            ) ON CONFLICT (id) DO NOTHING;
            
            option_id := gen_random_uuid();
            INSERT INTO public.service_options (
                id, group_id, name, description, price_delta, price_type, is_default, sort_order, created_at
            ) VALUES (
                option_id,
                addon_groups[i]::uuid,
                'Folding Service', 'Professional folding for delivery-ready laundry', 25, 'per_order', FALSE, 4, NOW()
            ) ON CONFLICT (id) DO NOTHING;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'Service options created successfully';
END $$;

-- =====================================================
-- VERIFY DATA GENERATION
-- =====================================================

SELECT 'Total Shops Created:' AS info, COUNT(*)::TEXT AS count FROM public.laundry_shops;
SELECT 'Total Services Created:' AS info, COUNT(*)::TEXT AS count FROM public.services;
SELECT 'Total Service Option Groups Created:' AS info, COUNT(*)::TEXT AS count FROM public.service_option_groups;
SELECT 'Total Service Options Created:' AS info, COUNT(*)::TEXT AS count FROM public.service_options;

-- Show sample shops
SELECT shop_name, location, starting_price, load_capacity_kg, rating_avg, total_reviews 
FROM public.laundry_shops 
ORDER BY created_at DESC 
LIMIT 10;

-- Show sample services with their shops
SELECT ls.shop_name, s.name, s.pricing_model, s.unit_price, s.load_capacity_kg
FROM public.services s
JOIN public.laundry_shops ls ON ls.id = s.shop_id
ORDER BY ls.shop_name, s.name
LIMIT 20;
