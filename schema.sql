-- =========================================================
-- SKEMA DATABASE - SPK Weighted Product
-- =========================================================
-- Sistem Pendukung Keputusan Penentuan Strategi Promosi
-- Martmut Picture
-- Database Engine: SQL Server
-- =========================================================

-- Buat Database
CREATE DATABASE MartmutPictureSPK;
GO

USE MartmutPictureSPK;
GO

-- ─────────────────────────────────────────────
-- TABEL 1: KRITERIA
-- Menyimpan data kriteria penilaian
-- ─────────────────────────────────────────────
CREATE TABLE Kriteria (
    id_kriteria     INT IDENTITY(1,1) PRIMARY KEY,
    kode_kriteria   NVARCHAR(5)   NOT NULL UNIQUE,      -- Contoh: C1, C2, C3
    nama_kriteria   NVARCHAR(100) NOT NULL,              -- Contoh: Biaya, Jangkauan
    tipe            NVARCHAR(10)  NOT NULL                -- 'cost' atau 'benefit'
                    CHECK (tipe IN ('cost', 'benefit')),
    bobot           DECIMAL(5,2)  NOT NULL                -- Bobot kepentingan (1-5)
                    CHECK (bobot >= 1 AND bobot <= 5),
    created_at      DATETIME DEFAULT GETDATE(),
    updated_at      DATETIME DEFAULT GETDATE()
);
GO

-- ─────────────────────────────────────────────
-- TABEL 2: ALTERNATIF
-- Menyimpan data alternatif strategi promosi
-- ─────────────────────────────────────────────
CREATE TABLE Alternatif (
    id_alternatif     INT IDENTITY(1,1) PRIMARY KEY,
    kode_alternatif   NVARCHAR(5)   NOT NULL UNIQUE,     -- Contoh: A1, A2, A3
    nama_alternatif   NVARCHAR(200) NOT NULL,             -- Contoh: Instagram Ads
    deskripsi         NVARCHAR(500) NULL,                 -- Deskripsi opsional
    created_at        DATETIME DEFAULT GETDATE(),
    updated_at        DATETIME DEFAULT GETDATE()
);
GO

-- ─────────────────────────────────────────────
-- TABEL 3: NILAI ALTERNATIF
-- Menyimpan nilai setiap alternatif terhadap
-- setiap kriteria (relasi many-to-many)
-- ─────────────────────────────────────────────
CREATE TABLE NilaiAlternatif (
    id_nilai        INT IDENTITY(1,1) PRIMARY KEY,
    id_alternatif   INT NOT NULL,
    id_kriteria     INT NOT NULL,
    nilai           DECIMAL(5,2) NOT NULL                 -- Nilai 1-5
                    CHECK (nilai >= 1 AND nilai <= 5),
    created_at      DATETIME DEFAULT GETDATE(),

    -- Foreign Key Constraints
    CONSTRAINT FK_Nilai_Alternatif
        FOREIGN KEY (id_alternatif) REFERENCES Alternatif(id_alternatif)
        ON DELETE CASCADE,
    CONSTRAINT FK_Nilai_Kriteria
        FOREIGN KEY (id_kriteria) REFERENCES Kriteria(id_kriteria)
        ON DELETE CASCADE,

    -- Pastikan kombinasi alternatif-kriteria unik
    CONSTRAINT UQ_Alternatif_Kriteria
        UNIQUE (id_alternatif, id_kriteria)
);
GO

-- ─────────────────────────────────────────────
-- TABEL 4: HASIL PERHITUNGAN
-- Menyimpan hasil perhitungan SPK (Vektor S,
-- Vektor V, dan Ranking)
-- ─────────────────────────────────────────────
CREATE TABLE HasilPerhitungan (
    id_hasil        INT IDENTITY(1,1) PRIMARY KEY,
    id_alternatif   INT NOT NULL,
    vektor_s        DECIMAL(15,6) NULL,                   -- Nilai Vektor S
    vektor_v        DECIMAL(15,6) NULL,                   -- Nilai Vektor V
    ranking         INT NULL,                             -- Peringkat
    sesi_hitung     NVARCHAR(50) NOT NULL,                -- ID sesi perhitungan
    tanggal_hitung  DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Hasil_Alternatif
        FOREIGN KEY (id_alternatif) REFERENCES Alternatif(id_alternatif)
        ON DELETE CASCADE
);
GO

-- ─────────────────────────────────────────────
-- INDEX untuk optimasi query
-- ─────────────────────────────────────────────
CREATE INDEX IX_NilaiAlternatif_Alternatif ON NilaiAlternatif(id_alternatif);
CREATE INDEX IX_NilaiAlternatif_Kriteria ON NilaiAlternatif(id_kriteria);
CREATE INDEX IX_HasilPerhitungan_Sesi ON HasilPerhitungan(sesi_hitung);
CREATE INDEX IX_HasilPerhitungan_Ranking ON HasilPerhitungan(ranking);
GO

-- ─────────────────────────────────────────────
-- INSERT DATA DEFAULT KRITERIA
-- ─────────────────────────────────────────────
INSERT INTO Kriteria (kode_kriteria, nama_kriteria, tipe, bobot) VALUES
('C1', 'Biaya',      'cost',    3),   -- Semakin kecil semakin baik
('C2', 'Jangkauan',  'benefit', 4),   -- Semakin besar semakin baik
('C3', 'Konversi',   'benefit', 5);   -- Semakin besar semakin baik
GO

-- ─────────────────────────────────────────────
-- INSERT CONTOH DATA ALTERNATIF
-- ─────────────────────────────────────────────
INSERT INTO Alternatif (kode_alternatif, nama_alternatif, deskripsi) VALUES
('A1', 'Instagram Ads',   'Iklan berbayar melalui platform Instagram'),
('A2', 'TikTok Organic',  'Konten organik di platform TikTok'),
('A3', 'SEO Website',     'Optimasi mesin pencari untuk website'),
('A4', 'Google Ads',      'Iklan berbayar melalui Google Ads'),
('A5', 'Facebook Ads',    'Iklan berbayar melalui platform Facebook');
GO

-- ─────────────────────────────────────────────
-- INSERT CONTOH NILAI ALTERNATIF
-- Format: (id_alternatif, id_kriteria, nilai)
-- ─────────────────────────────────────────────
-- Instagram Ads: Biaya=4, Jangkauan=5, Konversi=4
INSERT INTO NilaiAlternatif (id_alternatif, id_kriteria, nilai) VALUES
(1, 1, 4), (1, 2, 5), (1, 3, 4);

-- TikTok Organic: Biaya=2, Jangkauan=4, Konversi=5
INSERT INTO NilaiAlternatif (id_alternatif, id_kriteria, nilai) VALUES
(2, 1, 2), (2, 2, 4), (2, 3, 5);

-- SEO Website: Biaya=3, Jangkauan=3, Konversi=3
INSERT INTO NilaiAlternatif (id_alternatif, id_kriteria, nilai) VALUES
(3, 1, 3), (3, 2, 3), (3, 3, 3);

-- Google Ads: Biaya=5, Jangkauan=4, Konversi=4
INSERT INTO NilaiAlternatif (id_alternatif, id_kriteria, nilai) VALUES
(4, 1, 5), (4, 2, 4), (4, 3, 4);

-- Facebook Ads: Biaya=4, Jangkauan=3, Konversi=3
INSERT INTO NilaiAlternatif (id_alternatif, id_kriteria, nilai) VALUES
(5, 1, 4), (5, 2, 3), (5, 3, 3);
GO

-- ─────────────────────────────────────────────
-- VIEW: Matriks Keputusan
-- Menampilkan tabel keputusan lengkap
-- ─────────────────────────────────────────────
CREATE VIEW vw_MatriksKeputusan AS
SELECT
    a.kode_alternatif,
    a.nama_alternatif,
    MAX(CASE WHEN k.kode_kriteria = 'C1' THEN n.nilai END) AS Biaya,
    MAX(CASE WHEN k.kode_kriteria = 'C2' THEN n.nilai END) AS Jangkauan,
    MAX(CASE WHEN k.kode_kriteria = 'C3' THEN n.nilai END) AS Konversi
FROM Alternatif a
JOIN NilaiAlternatif n ON a.id_alternatif = n.id_alternatif
JOIN Kriteria k ON n.id_kriteria = k.id_kriteria
GROUP BY a.kode_alternatif, a.nama_alternatif;
GO

-- ─────────────────────────────────────────────
-- VIEW: Hasil Ranking Terbaru
-- ─────────────────────────────────────────────
CREATE VIEW vw_RankingTerbaru AS
SELECT TOP 100
    h.ranking,
    a.kode_alternatif,
    a.nama_alternatif,
    h.vektor_s,
    h.vektor_v,
    h.tanggal_hitung
FROM HasilPerhitungan h
JOIN Alternatif a ON h.id_alternatif = a.id_alternatif
WHERE h.sesi_hitung = (
    SELECT TOP 1 sesi_hitung
    FROM HasilPerhitungan
    ORDER BY tanggal_hitung DESC
)
ORDER BY h.ranking ASC;
GO

PRINT '✅ Skema database MartmutPictureSPK berhasil dibuat!';
GO
