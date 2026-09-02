-- =====================================================================
-- KUMPULAN QUERY SQL (INSERT & SELECT) UNTUK DASHBOARD REVENUE
-- Struktur Skema: Star Schema (Fakta & Dimensi)
-- =====================================================================
-- KETENTUAN DATABASE BARU (Update Dashboard v2):
-- 1. Tabel `fact_targets`  : Menyimpan Target Revenue bulanan secara global untuk Tipe Sales.
-- 2. Tabel `fact_revenues` : Menyimpan Actual Revenue harian dengan detail produk.
-- =====================================================================

USE `dashboard_analysis1`;

-- =====================================================================
-- PANDUAN DISTRIBUSI HARIAN YANG SEHAT & REALISTIS
-- =====================================================================
-- Jika Target Bulanan adalah Rp 10 Miliar, maka rata-rata Harian yang 
-- "sehat" adalah sekitar Rp 320 - Rp 340 Juta per Hari.
-- Jangan memasukkan angka Rp 3 Miliar di 1 hari, karena akan dibaca
-- sebagai lonjakan (spike) ekstrem oleh algoritma statistik Dashboard.
--
-- Berikut adalah contoh insert Actual Revenue harian yang realistis 
-- untuk 1 hari (misal 15 Juli 2025), terbagi rata ke kategori produk:
-- =====================================================================

INSERT INTO fact_revenues (dim_date_id, dim_product_id, dim_sales_type_id, actual_revenue, created_at, updated_at)
VALUES
-- ==========================================
-- 1. KATEGORI: BROADBAND (~60% dari Total) = Rp 200 Juta/Hari
-- ==========================================
-- Existing (BAU)
(
    (SELECT id FROM dim_dates WHERE date = '2025-07-15' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Broadband' AND broadband_pack_type = 'Core' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1),
    120000000.00, -- Rp 120 Juta
    NOW(), NOW()
),
(
    (SELECT id FROM dim_dates WHERE date = '2025-07-15' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Broadband' AND broadband_pack_type = 'Acquisition' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1),
    40000000.00, -- Rp 40 Juta
    NOW(), NOW()
),
-- New Sales
(
    (SELECT id FROM dim_dates WHERE date = '2025-07-15' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Broadband' AND broadband_pack_type = 'Core' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'New Sales' LIMIT 1),
    40000000.00, -- Rp 40 Juta
    NOW(), NOW()
),


-- ==========================================
-- 2. KATEGORI: DIGITAL (~20% dari Total) = Rp 65 Juta/Hari
-- ==========================================
(
    (SELECT id FROM dim_dates WHERE date = '2025-07-15' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Digital' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1),
    50000000.00, -- Rp 50 Juta
    NOW(), NOW()
),
(
    (SELECT id FROM dim_dates WHERE date = '2025-07-15' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Digital' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'New Sales' LIMIT 1),
    15000000.00, -- Rp 15 Juta
    NOW(), NOW()
),


-- ==========================================
-- 3. KATEGORI: VOICE & SMS (~20% dari Total) = Rp 65 Juta/Hari
-- ==========================================
(
    (SELECT id FROM dim_dates WHERE date = '2025-07-15' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'Voice' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1),
    45000000.00, -- Rp 45 Juta
    NOW(), NOW()
),
(
    (SELECT id FROM dim_dates WHERE date = '2025-07-15' LIMIT 1),
    (SELECT id FROM dim_products WHERE category = 'SMS' LIMIT 1),
    (SELECT id FROM dim_sales_types WHERE type_name = 'BAU' LIMIT 1),
    20000000.00, -- Rp 20 Juta
    NOW(), NOW()
);


-- =====================================================================
-- =====================================================================
-- 4. (TIPS) QUERY INSERT MASSAL UNTUK BANYAK TANGGAL SEKALIGUS
-- =====================================================================
-- Jika Anda tidak ingin melakukan INSERT satu-satu per tanggal, Anda bisa
-- memanfaatkan "INSERT INTO ... SELECT" berdasarkan rentang waktu di dim_dates.
-- =====================================================================

-- Contoh 1: Memasukkan Rp 120 Juta per hari ke Broadband Core (BAU) untuk SELAMA 1 TAHUN PENUH (2025)
INSERT INTO fact_revenues (dim_date_id, dim_product_id, dim_sales_type_id, actual_revenue)
SELECT 
    d.id AS dim_date_id,
    p.id AS dim_product_id,
    s.id AS dim_sales_type_id,
    120000000.00 AS actual_revenue -- Diisi Rp 120 Juta
FROM dim_dates d
JOIN dim_products p ON p.category = 'Broadband' AND p.broadband_pack_type = 'Core'
JOIN dim_sales_types s ON s.type_name = 'BAU'
WHERE d.year = 2025 AND d.month BETWEEN 1 AND 12;

-- Contoh 2: Memasukkan Rp 40 Juta per hari ke Broadband Core (New Sales) HANYA untuk bulan Juli 2025
INSERT INTO fact_revenues (dim_date_id, dim_product_id, dim_sales_type_id, actual_revenue)
SELECT 
    d.id, p.id, s.id, 
    40000000.00 -- Rp 40 Juta
FROM dim_dates d
JOIN dim_products p ON p.category = 'Broadband' AND p.broadband_pack_type = 'Core'
JOIN dim_sales_types s ON s.type_name = 'New Sales'
WHERE d.year = 2025 AND d.month = 7;

-- Anda bisa mengulang pola "SELECT" di atas untuk kategori Digital, Voice, dll
-- dengan mengubah nama category dan type_name, tanpa perlu repot mengetik 
-- tanggal satu per satu!


-- =====================================================================
-- (OPSIONAL) RESET DATA TERTENTU JIKA TERLANJUR SPIKE
-- =====================================================================
-- Jika Anda ingin menghapus data anomaly yang nilainya Rp 3.2 Miliar, 
-- Anda bisa menjalankan query ini:
--
-- DELETE FROM fact_revenues 
-- WHERE actual_revenue = 3200000000.00 
-- AND dim_date_id IN (SELECT id FROM dim_dates WHERE month = 7 AND year = 2025);
-- =====================================================================


-- =====================================================================
-- 5. QUERY SELECT (MENAMPILKAN ANALISA DATA)
-- =====================================================================

-- 4.1 Menampilkan Total Actual Revenue per Kategori Produk (Sepanjang 2025)
SELECT 
    dp.category AS Kategori_Produk,
    SUM(fr.actual_revenue) AS Total_Actual_Revenue
FROM fact_revenues fr
JOIN dim_dates dd ON fr.dim_date_id = dd.id
JOIN dim_products dp ON fr.dim_product_id = dp.id
WHERE dd.year = 2025
GROUP BY dp.category
ORDER BY Total_Actual_Revenue DESC;


-- 4.2 Menampilkan Actual Revenue (Existing vs New Sales) Harian
SELECT 
    dd.full_date AS Tanggal,
    SUM(CASE WHEN dst.type_name = 'BAU' THEN fr.actual_revenue ELSE 0 END) AS Revenue_Existing,
    SUM(CASE WHEN dst.type_name = 'New Sales' THEN fr.actual_revenue ELSE 0 END) AS Revenue_New_Sales,
    SUM(fr.actual_revenue) AS Revenue_Total
FROM fact_revenues fr
JOIN dim_dates dd ON fr.dim_date_id = dd.id
JOIN dim_sales_types dst ON fr.dim_sales_type_id = dst.id
WHERE dd.year = 2025 AND dd.month = 7
GROUP BY dd.full_date
ORDER BY dd.full_date ASC;
