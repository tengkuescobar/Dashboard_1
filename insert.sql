-- =====================================================================
-- KUMPULAN QUERY INSERT & SELECT LENGKAP REVENUE 2024 & 2025
-- DATABASE: Star Schema (fact_targets & fact_revenues)
-- =====================================================================
-- KETENTUAN DATABASE BARU:
-- 1. Tabel `fact_targets`  : Menyimpan Target Revenue bulanan (year, month, dim_product_id, dim_sales_type_id, target_revenue).
-- 2. Tabel `fact_revenues` : Menyimpan Actual Revenue harian (dim_date_id, dim_product_id, dim_sales_type_id, actual_revenue).
-- 3. Sales Types:
--    - 'BAU'       = Revenue Existing
--    - 'New Sales' = Revenue New Sales
--    - Revenue Total = Hasil Penjumlahan (SUM) BAU + New Sales.
-- =====================================================================

USE `dashboard_analysis1`;


-- =====================================================================
-- BAGIAN 1: QUERY INSERT TARGET BULANAN TAHUN 2024 & 2025 (FACT_TARGETS)
-- =====================================================================
-- Contoh menyisipkan Target Bulanan Rp 10 Miliar per Bulan (Rp 120 Miliar / Tahun)
-- Pembagian Tipe Sales: 80% Existing (BAU) = Rp 8 Miliar, 20% New Sales = Rp 2 Miliar.
-- =====================================================================

-- 1.1 Insert Target Bulanan Tahun 2024 (Contoh Bulan 1 s/d 3)
INSERT INTO fact_targets (year, month, dim_sales_type_id, dim_product_id, target_revenue, created_at, updated_at)
VALUES 
-- Existing (BAU) - Rp 8.000.000.000 / Bulan
(2024, 1, (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1), NULL, 8000000000.00, NOW(), NOW()),
(2024, 2, (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1), NULL, 8000000000.00, NOW(), NOW()),
(2024, 3, (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1), NULL, 8000000000.00, NOW(), NOW()),

-- New Sales - Rp 2.000.000.000 / Bulan
(2024, 1, (SELECT id FROM dim_sales_types WHERE type_name = 'New Sales' LIMIT 1), NULL, 2000000000.00, NOW(), NOW()),
(2024, 2, (SELECT id FROM dim_sales_types WHERE type_name = 'New Sales' LIMIT 1), NULL, 2000000000.00, NOW(), NOW()),
(2024, 3, (SELECT id FROM dim_sales_types WHERE type_name = 'New Sales' LIMIT 1), NULL, 2000000000.00, NOW(), NOW());


-- 1.2 Insert Target Bulanan Tahun 2025 (Contoh Bulan 1 s/d 2)
INSERT INTO fact_targets (year, month, dim_sales_type_id, dim_product_id, target_revenue, created_at, updated_at)
VALUES 
-- Existing (BAU) - Rp 8.000.000.000 / Bulan
(2025, 1, (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1), NULL, 8000000000.00, NOW(), NOW()),
(2025, 2, (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1), NULL, 8000000000.00, NOW(), NOW()),

-- New Sales - Rp 2.000.000.000 / Bulan
(2025, 1, (SELECT id FROM dim_sales_types WHERE type_name = 'New Sales' LIMIT 1), NULL, 2000000000.00, NOW(), NOW()),
(2025, 2, (SELECT id FROM dim_sales_types WHERE type_name = 'New Sales' LIMIT 1), NULL, 2000000000.00, NOW(), NOW());


-- =====================================================================
-- BAGIAN 2: QUERY INSERT ACTUAL REVENUE TAHUN 2024 & 2025 (FACT_REVENUES)
-- =====================================================================
-- Memasukkan data Aktual ke fact_revenues berdasarkan tanggal (dim_date_id)
-- =====================================================================

-- 2.1 Insert Actual Revenue untuk Tanggal Spesifik Tahun 2024 (Existing & New Sales)
INSERT INTO fact_revenues (dim_date_id, dim_product_id, dim_sales_type_id, actual_revenue)
VALUES
-- Revenue Existing (BAU) - 15 Januari 2024
(
    (SELECT id FROM dim_dates WHERE date = '2024-01-15' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Broadband' AND broadband_pack_type = 'Core' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1),
    250000000.00  -- Rp 250 Juta
),
-- Revenue New Sales - 15 Januari 2024
(
    (SELECT id FROM dim_dates WHERE date = '2024-01-15' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Broadband' AND broadband_pack_type = 'Core' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'New Sales' LIMIT 1),
    65000000.00   -- Rp 65 Juta
);


-- 2.2 Insert Actual Revenue untuk Tanggal Spesifik Tahun 2025 (Existing & New Sales)
INSERT INTO fact_revenues (dim_date_id, dim_product_id, dim_sales_type_id, actual_revenue)
VALUES
-- Revenue Existing (BAU) - 31 Desember 2025
(
    (SELECT id FROM dim_dates WHERE date = '2025-12-31' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Broadband' AND broadband_pack_type = 'Core' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1),
    300000000.00  -- Rp 300 Juta
),
-- Revenue New Sales - 31 Desember 2025
(
    (SELECT id FROM dim_dates WHERE date = '2025-12-31' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Broadband' AND broadband_pack_type = 'Core' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'New Sales' LIMIT 1),
    80000000.00   -- Rp 80 Juta
);


-- =====================================================================
-- BAGIAN 3: QUERY INSERT MANUALLY UNTUK TAMBAHAN REVENUE Rp 10 MILIAR (10 Bn)
-- =====================================================================
-- Anda dapat menjalankan query di bawah ini kapan saja untuk menambah Rp 10 Miliar
-- =====================================================================

-- 3.1 Tambah Rp 10 Miliar ke Revenue Existing (BAU) pada 31 Des 2025
INSERT INTO fact_revenues (dim_date_id, dim_product_id, dim_sales_type_id, actual_revenue)
VALUES (
    (SELECT id FROM dim_dates WHERE date = '2025-12-31' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Broadband' AND broadband_pack_type = 'Core' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1),
    10000000000.00  -- Rp 10 Miliar
);

-- 3.2 Tambah Rp 10 Miliar ke Revenue New Sales pada 31 Des 2025
INSERT INTO fact_revenues (dim_date_id, dim_product_id, dim_sales_type_id, actual_revenue)
VALUES (
    (SELECT id FROM dim_dates WHERE date = '2025-12-31' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Broadband' AND broadband_pack_type = 'Core' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'New Sales' LIMIT 1),
    10000000000.00  -- Rp 10 Miliar
);

-- 3.3 Tambah Rp 10 Miliar ke Revenue Total (Dibagi 80% Existing & 20% New Sales)
INSERT INTO fact_revenues (dim_date_id, dim_product_id, dim_sales_type_id, actual_revenue)
VALUES 
-- Rp 8 Miliar ke Existing
(
    (SELECT id FROM dim_dates WHERE date = '2025-12-31' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Broadband' AND broadband_pack_type = 'Core' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1),
    8000000000.00
),
-- Rp 2 Miliar ke New Sales
(
    (SELECT id FROM dim_dates WHERE date = '2025-12-31' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Broadband' AND broadband_pack_type = 'Core' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'New Sales' LIMIT 1),
    2000000000.00
);


-- =====================================================================
-- BAGIAN 4: QUERY CHECK & VERIFIKASI HASIL REVENUE (2024 & 2025)
-- =====================================================================

-- 4.1 Check Total Actual Revenue per Tahun & Tipe Sales (Existing vs New Sales)
SELECT 
    d.year,
    st.type_name AS sales_type,
    SUM(fr.actual_revenue) AS total_actual_revenue
FROM fact_revenues fr
JOIN dim_dates d ON fr.dim_date_id = d.id
JOIN dim_sales_types st ON fr.dim_sales_type_id = st.id
WHERE d.year IN (2024, 2025)
GROUP BY d.year, st.type_name
ORDER BY d.year, st.type_name;

-- 4.2 Check Total Target Revenue per Tahun & Tipe Sales (Existing vs New Sales)
SELECT 
    ft.year,
    st.type_name AS sales_type,
    SUM(ft.target_revenue) AS total_target_revenue
FROM fact_targets ft
JOIN dim_sales_types st ON ft.dim_sales_type_id = st.id
WHERE ft.year IN (2024, 2025)
GROUP BY ft.year, st.type_name
ORDER BY ft.year, st.type_name;

-- 4.3 Check Overall Total Actual vs Target Revenue (2024 vs 2025)
SELECT 
    d.year,
    (SELECT SUM(actual_revenue) FROM fact_revenues fr2 JOIN dim_dates d2 ON fr2.dim_date_id = d2.id WHERE d2.year = d.year) AS total_actual,
    (SELECT SUM(target_revenue) FROM fact_targets ft2 WHERE ft2.year = d.year) AS total_target
FROM dim_dates d
WHERE d.year IN (2024, 2025)
GROUP BY d.year;
