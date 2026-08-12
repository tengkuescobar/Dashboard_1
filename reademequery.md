# 📊 ANALISIS PERBEDAAAN HASIL QUERY MYSQL WORKBENCH VS VISUALISASI DASHBOARD

Dokumen ini menjelaskan secara mendetail penyebab perbedaan antara hasil kueri SQL di **MySQL Workbench** dengan angka yang tampil pada visualisasi **Dashboard Analytics**, serta analisis akar masalah (*root cause analysis*) dan rekomendasi perbaikannya.

---

## 📌 1. Rangkuman Eksekutif (Executive Summary)

> **Apakah ada yang salah dengan query SQL-nya?**
> **TIDAK ADA kesalahan sintaks query**, tetapi terdapat **perbedaan cakupan/skop rentang waktu (Time Grain Scope)** antara query SQL di Workbench dengan query API Backend Laravel di Dashboard.

* **MySQL Workbench**: Menghitung akumulasi **FULL YEAR / 1 TAHUN PENUH (12 Bulan: Jan – Des 2024)**. Total revenue = **Rp 147.99 Bn**.
* **Dashboard Gauge Card**: Menghitung **MTD / 1 BULAN TERAKHIR SAJA (Bulan Desember 2024)** via endpoint `/api/dashboard/summary`. Total revenue = **Rp 37.99 Bn**.

---

## 🔍 2. Tabel Komparasi Angka: MySQL Workbench vs Dashboard UI

Berikut adalah perbandingan angka persis dari data database untuk **Tahun 2024**:

| Metrik / Tipe Sales | Query MySQL Workbench<br>*(Akumulasi 12 Bulan / Full Year 2024)* | Visualisasi Dashboard UI<br>*(MTD / Hanya Bulan Desember 2024)* | Status / Keterangan |
| :--- | :---: | :---: | :--- |
| **Existing Sales (BAU)** | **Rp 109,993,756,596.70**<br>(~109.99 Bn) | **Rp 21,993,756,596.70**<br>(~21.99 Bn) | ⚠️ Workbench = 12 Bulan<br>Dashboard = Des 2024 |
| **New Sales** | **Rp 37,998,201,101.90**<br>(~37.99 Bn) | **Rp 16,000,000,000.00**<br>(~16.00 Bn) | ⚠️ Workbench = 12 Bulan<br>Dashboard = Des 2024 |
| **TOTAL REVENUE** | **Rp 147,991,957,698.60**<br>(~147.99 Bn) | **Rp 37,993,756,596.70**<br>(~37.99 Bn) | ⚠️ Workbench = 12 Bulan<br>Dashboard = Des 2024 |

---

## 🚨 3. Analisis 4 Faktor Utama Penyebab Perbedaan (Root Cause)

### 🔴 1. Perbedaan Rentang Waktu (MTD vs Full Year)
* **Di MySQL Workbench**:
  Query yang dijalankan menggunakan agregasi `GROUP BY d.year, st.type_name` tanpa memfilter bulan (`dim_dates.month`). Kueri menjumlahkan seluruh `actual_revenue` dari tanggal `2024-01-01` hingga `2024-12-31`.
* **Di Dashboard Backend (`DashboardController.php`)**:
  Endpoint `/api/dashboard/summary` memanggil fungsi `getDateRange($year, $month, 'current_month')`.
  Ketika tahun 2024 dipilih, parameter bulan bernilai `12` (Desember). `current_month` menghasilkan rentang tanggal **`2024-12-01` sampai `2024-12-31`**.

### 🔴 2. Koinsidensi Angka (Coincidental Match) yang Memicu Kebingungan
* Angka **New Sales Full Year 2024** di MySQL Workbench bernilai **37.99 Bn** (`37,998,201,101.90`).
* Angka **Total Revenue MTD Desember 2024** di Dashboard Gauge Card bernilai **37.99 Bn** (`37,993,756,596.70`).
* Karena kedua angka ini bernilai persis sama (**37.99 Bn**), muncul kesan seolah-olah Gauge Card *Revenue Total* salah mengambil nilai dari *New Sales*, padahal sebetulnya itu adalah perbandingan antara **Akumulasi New Sales 1 Tahun** vs **Total Revenue 1 Bulan Desember**.

### 🔴 3. Endpoint Dashboard Menggunakan Current Month (`$cmRange`)
Di controller `app/Http/Controllers/Api/DashboardController.php`:
```php
// baris 46 & 98-100:
$cmRange = $this->getDateRange($year, $month, 'current_month');

$totalCM    = $getRev($cmRange);               // Total Revenue MTD Des (37.99 Bn)
$existingCM = $getRev($cmRange, 'BAU');        // Existing Revenue MTD Des (21.99 Bn)
$newSalesCM = $getRev($cmRange, 'New Sales');   // New Sales Revenue MTD Des (16.00 Bn)
```
Gauge Card pada `DashboardOverview.jsx` mengambil dari `$totalCM`, `$existingCM`, dan `$newSalesCM` yang ber-skop MTD (Desember), bukan YTD / Full Year.

### 🔴 4. Perhitungan Target Proporsional vs Target Tahunan
* Target Bulanan untuk 1 Bulan (Desember):
  - Total Target: Rp 10 Bn
  - Existing Target: Rp 8 Bn
  - New Sales Target: Rp 2 Bn
* Target Tahunan (Full Year 12 Bulan):
  - Total Target: Rp 120 Bn (10 Bn x 12 bulan)
  - Existing Target: Rp 96 Bn (8 Bn x 12 bulan)
  - New Sales Target: Rp 24 Bn (2 Bn x 12 bulan)

---

## 💻 4. Pembedahan Query & Kode Backend

### A. Kueri SQL MySQL Workbench (Full Year Aggregation)
```sql
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
```
*Kueri di atas menghitung SUM seluruh transaksi selama 365 hari di tahun 2024.*

### B. Query SQL Sepadan di MySQL Workbench untuk Mencocokkan Dashboard MTD (Desember 2024)
Jika Anda ingin query di MySQL Workbench menghasilkan **angka yang 100% SAMA** dengan Gauge Card Dashboard MTD, tambahkan filter bulan `d.month = 12`:

```sql
SELECT
    d.year,
    d.month,
    st.type_name AS sales_type,
    SUM(fr.actual_revenue) AS total_actual_revenue
FROM fact_revenues fr
JOIN dim_dates d ON fr.dim_date_id = d.id
JOIN dim_sales_types st ON fr.dim_sales_type_id = st.id
WHERE d.year = 2024 AND d.month = 12
GROUP BY d.year, d.month, st.type_name
ORDER BY st.type_name;
```

**Hasil Kueri MTD Desember 2024 di Workbench (Akan 100% Sama dengan Dashboard):**
* **BAU**: `21,993,756,596.70` (**21.99 Bn**)
* **New Sales**: `16,000,000,000.00` (**16.00 Bn**)
* **TOTAL**: `37,993,756,596.70` (**37.99 Bn**)

---

## 🛠️ 5. Rekomendasi Solusi & Perbaikan

Terhitung 3 opsi perbaikan yang dapat diterapkan sesuai dengan kebutuhan bisnis:

### 💡 Opsi 1: Menambahkan Toggle / Pilihan Filter "MTD vs YTD / Full Year" pada Gauge Card (Sangat Direkomendasikan)
Di `DashboardOverview.jsx` dan `DashboardController.php`, berikan opsi bagi pengguna untuk memilih apakah *Target vs Actual* ingin melihat angka **MTD (Bulan Desember)** atau **YTD / Full Year (1 Tahun Penuh)**.

Jika memilih YTD / Full Year pada backend:
```php
$totalYTD    = $getRev($ytdRange);               // Actual 147.99 Bn vs Target 120 Bn
$existingYTD = $getRev($ytdRange, 'BAU');        // Actual 109.99 Bn vs Target 96 Bn
$newSalesYTD = $getRev($ytdRange, 'New Sales');   // Actual 37.99 Bn vs Target 24 Bn
```

### 💡 Opsi 2: Memperjelas Label UI di Dashboard
Jika Gauge Card memang dimaksudkan untuk melihat performa bulan berjalan (MTD), perjelas label pada UI dengan menambahkan badge/sub-heading:
> **TARGET VS ACTUAL (MTD - Bulan Desember 2024)**

### 💡 Opsi 3: Kueri SQL di Workbench Disesuaikan dengan Tujuan Analisis
- Gunakan kueri **Full Year** (`WHERE d.year = 2024`) jika ingin menganalisis total pencapaian tahunan.
- Gunakan kueri **MTD** (`WHERE d.year = 2024 AND d.month = 12`) jika ingin memverifikasi data bulan berjalan dengan Gauge Card Dashboard.

---

*Dokumentasi ini dibuat otomatis oleh Agentic AI Antigravity untuk keperluan audit data & sinkronisasi kueri database Dashboard Analytics.*
