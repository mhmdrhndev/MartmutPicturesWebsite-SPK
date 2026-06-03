/**
 * =========================================================
 * SPK ENGINE - Metode Weighted Product (WP)
 * =========================================================
 * Sistem Pendukung Keputusan Penentuan Strategi Promosi
 * Martmut Picture
 *
 * Langkah-langkah Metode Weighted Product (WP):
 * 1. Normalisasi Bobot  : Wj = wj / Σwj
 * 2. Perhitungan Vektor S: Si = Π(xij ^ wj)
 *    → wj positif untuk kriteria Benefit
 *    → wj negatif untuk kriteria Cost
 * 3. Perhitungan Vektor V: Vi = Si / ΣSi
 * =========================================================
 */

class SPKWeightedProduct {
    constructor() {
        /**
         * Daftar kriteria default
         * - C1: Biaya (Cost) → semakin kecil semakin baik
         * - C2: Jangkauan (Benefit) → semakin besar semakin baik
         * - C3: Konversi (Benefit) → semakin besar semakin baik
         */
        this.kriteria = [
            { id: 'C1', nama: 'Biaya', tipe: 'cost', bobot: 3 },
            { id: 'C2', nama: 'Jangkauan', tipe: 'benefit', bobot: 4 },
            { id: 'C3', nama: 'Konversi', tipe: 'benefit', bobot: 5 }
        ];

        // Daftar alternatif strategi promosi
        this.alternatif = [];

        // Hasil perhitungan
        this.hasilNormalisasi = [];
        this.hasilVektorS = [];
        this.hasilVektorV = [];
        this.ranking = [];

        // Key untuk localStorage
        this.STORAGE_KEY_ALT = 'spk_alternatif';
        this.STORAGE_KEY_KRI = 'spk_kriteria';
    }

    // ─────────────────────────────────────────────
    // MANAJEMEN DATA
    // ─────────────────────────────────────────────

    /**
     * Menambahkan alternatif baru
     * @param {string} nama - Nama strategi promosi
     * @param {number[]} nilai - Array nilai kriteria [biaya, jangkauan, konversi] (skala 1-5)
     * @returns {string} ID alternatif yang dibuat
     */
    tambahAlternatif(nama, nilai) {
        // Validasi jumlah nilai sesuai jumlah kriteria
        if (nilai.length !== this.kriteria.length) {
            throw new Error(`Jumlah nilai harus ${this.kriteria.length} sesuai jumlah kriteria.`);
        }

        // Validasi rentang nilai 1-5
        nilai.forEach((n, i) => {
            if (n < 1 || n > 5) {
                throw new Error(`Nilai ${this.kriteria[i].nama} harus antara 1 dan 5.`);
            }
        });

        const id = 'A' + (this.alternatif.length + 1);
        this.alternatif.push({ id, nama, nilai: [...nilai] });
        this.simpanKeStorage();
        return id;
    }

    /**
     * Menghapus alternatif berdasarkan index
     * @param {number} index - Index alternatif yang akan dihapus
     */
    hapusAlternatif(index) {
        if (index < 0 || index >= this.alternatif.length) {
            throw new Error('Index alternatif tidak valid.');
        }
        this.alternatif.splice(index, 1);
        // Re-index ID agar berurutan
        this.alternatif.forEach((alt, i) => {
            alt.id = 'A' + (i + 1);
        });
        this.simpanKeStorage();
    }

    /**
     * Mengatur bobot kriteria
     * @param {number[]} bobot - Array bobot untuk setiap kriteria
     */
    setBobot(bobot) {
        if (bobot.length !== this.kriteria.length) {
            throw new Error(`Jumlah bobot harus ${this.kriteria.length}.`);
        }
        bobot.forEach((b, i) => {
            if (b <= 0) throw new Error('Bobot harus bernilai positif.');
            this.kriteria[i].bobot = b;
        });
        this.simpanKeStorage();
    }

    /**
     * Mereset semua alternatif dan hasil perhitungan
     */
    reset() {
        this.alternatif = [];
        this.hasilNormalisasi = [];
        this.hasilVektorS = [];
        this.hasilVektorV = [];
        this.ranking = [];
        this.simpanKeStorage();
    }

    /**
     * Memuat contoh data default untuk demonstrasi
     */
    muatContohData() {
        this.alternatif = [];
        this.hasilNormalisasi = [];
        this.hasilVektorS = [];
        this.hasilVektorV = [];
        this.ranking = [];
        this.tambahAlternatif('Instagram Ads', [4, 5, 4]);
        this.tambahAlternatif('TikTok Organic', [2, 4, 5]);
        this.tambahAlternatif('SEO Website', [3, 3, 3]);
        this.tambahAlternatif('Google Ads', [5, 4, 4]);
        this.tambahAlternatif('Facebook Ads', [4, 3, 3]);
    }

    // ─────────────────────────────────────────────
    // LANGKAH 1: NORMALISASI BOBOT
    // ─────────────────────────────────────────────

    /**
     * Menormalisasi bobot kriteria
     * Rumus: Wj = wj / Σwj
     *
     * Contoh: Jika bobot = [3, 4, 5]
     * Total = 3 + 4 + 5 = 12
     * W1 = 3/12 = 0.25
     * W2 = 4/12 = 0.333
     * W3 = 5/12 = 0.417
     *
     * @returns {Object[]} Kriteria dengan bobot ternormalisasi
     */
    normalisasiBobot() {
        const totalBobot = this.kriteria.reduce((sum, k) => sum + k.bobot, 0);

        if (totalBobot === 0) {
            throw new Error('Total bobot tidak boleh nol.');
        }

        this.hasilNormalisasi = this.kriteria.map(k => ({
            ...k,
            bobotNormal: parseFloat((k.bobot / totalBobot).toFixed(6))
        }));

        return this.hasilNormalisasi;
    }

    // ─────────────────────────────────────────────
    // LANGKAH 2: PERHITUNGAN VEKTOR S
    // ─────────────────────────────────────────────

    /**
     * Menghitung Vektor S untuk setiap alternatif
     * Rumus: Si = Π(xij ^ wj)
     *
     * Untuk kriteria BENEFIT: pangkat = +Wj (positif)
     * Untuk kriteria COST   : pangkat = -Wj (negatif)
     *
     * Contoh untuk alternatif "Instagram Ads" [4, 5, 4]:
     * S = (4 ^ -0.25) * (5 ^ +0.333) * (4 ^ +0.417)
     *
     * @returns {Object[]} Alternatif dengan nilai Vektor S
     */
    hitungVektorS() {
        // Pastikan bobot sudah dinormalisasi
        if (this.hasilNormalisasi.length === 0) {
            this.normalisasiBobot();
        }

        this.hasilVektorS = this.alternatif.map(alt => {
            let vektorS = 1;

            this.hasilNormalisasi.forEach((kriteria, j) => {
                // Pangkat negatif untuk Cost, positif untuk Benefit
                const pangkat = kriteria.tipe === 'cost'
                    ? -kriteria.bobotNormal
                    : kriteria.bobotNormal;

                // Si = Si * (xij ^ wj)
                vektorS *= Math.pow(alt.nilai[j], pangkat);
            });

            return {
                ...alt,
                vektorS: parseFloat(vektorS.toFixed(6))
            };
        });

        return this.hasilVektorS;
    }

    // ─────────────────────────────────────────────
    // LANGKAH 3: PERHITUNGAN VEKTOR V
    // ─────────────────────────────────────────────

    /**
     * Menghitung Vektor V (nilai preferensi relatif)
     * Rumus: Vi = Si / ΣSi
     *
     * Vektor V menunjukkan preferensi relatif setiap alternatif.
     * Nilai Vi yang lebih besar menunjukkan alternatif yang lebih baik.
     *
     * @returns {Object[]} Alternatif dengan nilai Vektor V
     */
    hitungVektorV() {
        // Pastikan Vektor S sudah dihitung
        if (this.hasilVektorS.length === 0) {
            this.hitungVektorS();
        }

        // Hitung total Vektor S
        const totalS = this.hasilVektorS.reduce((sum, alt) => sum + alt.vektorS, 0);

        if (totalS === 0) {
            throw new Error('Total Vektor S tidak boleh nol.');
        }

        this.hasilVektorV = this.hasilVektorS.map(alt => ({
            ...alt,
            vektorV: parseFloat((alt.vektorS / totalS).toFixed(6))
        }));

        return this.hasilVektorV;
    }

    // ─────────────────────────────────────────────
    // PERHITUNGAN LENGKAP & RANKING
    // ─────────────────────────────────────────────

    /**
     * Menjalankan seluruh proses perhitungan WP
     * dan menghasilkan ranking dari yang terbaik
     *
     * @returns {Object} Hasil lengkap perhitungan
     */
    hitung() {
        if (this.alternatif.length === 0) {
            throw new Error('Tidak ada data alternatif. Silakan tambahkan minimal 1 alternatif.');
        }

        // Eksekusi 3 langkah berurutan
        this.normalisasiBobot();
        this.hitungVektorS();
        this.hitungVektorV();

        // Urutkan berdasarkan Vektor V (descending) → ranking
        this.ranking = [...this.hasilVektorV]
            .sort((a, b) => b.vektorV - a.vektorV)
            .map((alt, i) => ({
                ...alt,
                peringkat: i + 1
            }));

        return {
            normalisasiBobot: this.hasilNormalisasi,
            vektorS: this.hasilVektorS,
            vektorV: this.hasilVektorV,
            ranking: this.ranking
        };
    }

    /**
     * Mendapatkan rekomendasi strategi terbaik
     * @returns {Object|null} Alternatif dengan peringkat tertinggi
     */
    getRekomendasi() {
        if (this.ranking.length === 0) return null;
        return this.ranking[0];
    }

    /**
     * Mendapatkan detail langkah perhitungan untuk ditampilkan
     * @returns {Object} Detail seluruh langkah perhitungan
     */
    getDetailPerhitungan() {
        return {
            kriteria: this.kriteria,
            alternatif: this.alternatif,
            normalisasi: this.hasilNormalisasi,
            vektorS: this.hasilVektorS,
            vektorV: this.hasilVektorV,
            ranking: this.ranking
        };
    }

    // ─────────────────────────────────────────────
    // LOCAL STORAGE PERSISTENCE
    // ─────────────────────────────────────────────

    /**
     * Menyimpan data alternatif & kriteria ke localStorage
     * Dipanggil otomatis setiap ada perubahan data
     */
    simpanKeStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY_ALT, JSON.stringify(this.alternatif));
            localStorage.setItem(this.STORAGE_KEY_KRI, JSON.stringify(this.kriteria));
        } catch (e) {
            console.warn('Gagal menyimpan ke localStorage:', e.message);
        }
    }

    /**
     * Memuat data alternatif & kriteria dari localStorage
     * Dipanggil saat halaman pertama kali dibuka
     * @returns {boolean} true jika berhasil memuat data
     */
    muatDariStorage() {
        try {
            const savedAlt = localStorage.getItem(this.STORAGE_KEY_ALT);
            const savedKri = localStorage.getItem(this.STORAGE_KEY_KRI);

            if (savedAlt) {
                this.alternatif = JSON.parse(savedAlt);
            }
            if (savedKri) {
                this.kriteria = JSON.parse(savedKri);
            }

            return this.alternatif.length > 0;
        } catch (e) {
            console.warn('Gagal memuat dari localStorage:', e.message);
            return false;
        }
    }

    /**
     * Menghapus semua data dari localStorage
     */
    hapusStorage() {
        localStorage.removeItem(this.STORAGE_KEY_ALT);
        localStorage.removeItem(this.STORAGE_KEY_KRI);
    }
}
