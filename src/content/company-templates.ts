/**
 * Company-profile website templates shown in the /templates catalog.
 * All content is fictional sample data. Each template picks one of three layout
 * families and its own theme, so previews differ in structure, not just colour.
 */
import type { Locale } from "@/lib/i18n/types";

type L = Record<Locale, string>;

export type TemplateLayout = "corporate" | "bold" | "minimal";

export type TemplateIcon =
  | "scale"
  | "briefcase"
  | "shield"
  | "file"
  | "hardhat"
  | "building"
  | "ruler"
  | "truck"
  | "stethoscope"
  | "heart"
  | "baby"
  | "smile"
  | "coffee"
  | "cake"
  | "users"
  | "package"
  | "globe"
  | "clock"
  | "book"
  | "code"
  | "award"
  | "chart";

/** One interactive, industry-specific tool per template. */
export type TemplateWidget = { title: string; subtitle: string } & (
  | {
      type: "booking";
      topicLabel: string;
      topics: string[];
      personLabel: string;
      slots: string[];
      /** 0 = Sunday … 6 = Saturday */
      closedDays: number[];
      daysAhead: number;
    }
  | {
      type: "estimator";
      buildingTypes: { label: string; pricePerM2: [number, number] }[];
      finishes: { label: string; multiplier: number }[];
      area: { min: number; max: number; default: number };
      floorsMax: number;
    }
  | {
      type: "menu";
      categories: { name: string; items: { name: string; price: number; description: string; tag?: string }[] }[];
    }
  | {
      type: "shipping";
      /** Cities with a zone number; price grows with zone distance. */
      cities: { name: string; zone: number }[];
      services: { name: string; perKg: number; base: number; etaDays: [number, number] }[];
    }
  | {
      type: "quiz";
      questions: { question: string; options: { label: string; scores: Record<string, number> }[] }[];
      results: Record<string, { name: string; description: string; duration: string; price: number }>;
    }
);

export type CompanyTemplate = {
  slug: string;
  name: string;
  industry: L;
  summary: L;
  layout: TemplateLayout;
  /** Catalog tags (sections/features worth pointing out). */
  highlights: L[];
  theme: {
    primary: string;
    accent: string;
    /** Page background / text for the template itself. */
    dark: boolean;
    font: "sans" | "serif";
  };
  company: { name: string; tagline: string };
  nav: string[];
  hero: { eyebrow: string; title: string; subtitle: string; cta: string; secondaryCta: string };
  stats: { value: string; label: string }[];
  about: { title: string; body: string; points: string[] };
  services: { icon: TemplateIcon; title: string; description: string }[];
  process: { title: string; description: string }[];
  testimonials: { quote: string; name: string; role: string }[];
  team: { name: string; role: string }[];
  cta: { title: string; subtitle: string; button: string };
  contact: { address: string; phone: string; email: string; hours: string };
  /** Shown in the WhatsApp preview (fictional — the demo never opens wa.me). */
  whatsapp: string;
  /** Structured data (schema.org) for search engines. */
  seo: {
    /** schema.org type(s), e.g. "LegalService", ["EducationalOrganization", "LocalBusiness"]. */
    schemaType: string | string[];
    locality: string;
    region: string;
    /** schema.org openingHours format, e.g. "Mo-Fr 08:00-17:00". */
    openingHours: string[];
    priceRange?: string;
    keywords: string[];
    /** Override for the <title> when "name — tagline di city" reads awkwardly. */
    title?: string;
  };
  faq: { q: string; a: string }[];
  widget: TemplateWidget;
};

export const companyTemplates: CompanyTemplate[] = [
  {
    slug: "aksara-legal",
    name: "Aksara Legal",
    industry: { en: "Law firm & consulting", id: "Firma hukum & konsultan" },
    summary: {
      en: "Formal, trust-first layout with practice areas, a consultation flow and partner profiles.",
      id: "Tampilan formal yang menonjolkan kepercayaan: bidang praktik, alur konsultasi, dan profil partner.",
    },
    layout: "corporate",
    highlights: [
      { en: "Consultation booking", id: "Booking konsultasi" },
      { en: "Practice areas", id: "Bidang praktik" },
      { en: "Consultation flow", id: "Alur konsultasi" },
      { en: "Partner profiles", id: "Profil partner" },
    ],
    theme: { primary: "#1e3a5f", accent: "#c9a227", dark: false, font: "serif" },
    company: { name: "Aksara Legal", tagline: "Advokat & Konsultan Hukum" },
    nav: ["Beranda", "Layanan", "Konsultasi", "Tim", "Kontak"],
    hero: {
      eyebrow: "Sejak 2009 · Jakarta",
      title: "Pendampingan hukum yang jernih untuk keputusan bisnis yang tepat",
      subtitle:
        "Kami membantu perusahaan dan individu menghadapi perkara korporasi, sengketa, dan kepatuhan dengan strategi yang terukur.",
      cta: "Jadwalkan Konsultasi",
      secondaryCta: "Lihat Bidang Praktik",
    },
    stats: [
      { value: "15+", label: "Tahun pengalaman" },
      { value: "800+", label: "Perkara ditangani" },
      { value: "120", label: "Klien korporasi" },
      { value: "98%", label: "Klien merekomendasikan" },
    ],
    about: {
      title: "Hukum yang dijelaskan dengan bahasa bisnis",
      body: "Aksara Legal didirikan oleh praktisi yang percaya bahwa nasihat hukum harus bisa dipahami dan ditindaklanjuti. Setiap perkara ditangani langsung oleh partner, dengan laporan perkembangan yang rutin.",
      points: [
        "Ditangani langsung oleh partner berpengalaman",
        "Biaya transparan sejak awal",
        "Laporan perkembangan perkara setiap minggu",
      ],
    },
    services: [
      { icon: "briefcase", title: "Hukum Korporasi", description: "Pendirian badan usaha, merger & akuisisi, serta tata kelola perusahaan." },
      { icon: "scale", title: "Penyelesaian Sengketa", description: "Litigasi, arbitrase, dan mediasi untuk sengketa komersial." },
      { icon: "shield", title: "Kepatuhan & Regulasi", description: "Audit kepatuhan, perizinan, dan pendampingan regulator." },
      { icon: "file", title: "Kontrak & Perjanjian", description: "Penyusunan dan telaah kontrak kerja sama, sewa, dan distribusi." },
      { icon: "users", title: "Ketenagakerjaan", description: "Peraturan perusahaan, PKB, dan penyelesaian perselisihan kerja." },
      { icon: "award", title: "Kekayaan Intelektual", description: "Pendaftaran merek, hak cipta, dan perlindungan rahasia dagang." },
    ],
    process: [
      { title: "Konsultasi awal", description: "Diskusi 30 menit untuk memahami kasus Anda — tanpa biaya." },
      { title: "Analisis & strategi", description: "Kami memetakan risiko, opsi, dan estimasi biaya secara tertulis." },
      { title: "Pendampingan", description: "Tim kami menjalankan strategi dan melaporkan setiap perkembangan." },
    ],
    testimonials: [
      { quote: "Penjelasannya lugas dan selalu disertai pilihan langkah. Proses akuisisi kami selesai lebih cepat dari target.", name: "Rina Kartika", role: "CFO, PT Sinar Niaga" },
      { quote: "Responsif dan teliti. Sengketa kontrak kami selesai lewat mediasi tanpa harus ke pengadilan.", name: "Budi Hartono", role: "Direktur, CV Mitra Karya" },
      { quote: "Audit kepatuhannya membuka banyak hal yang tidak kami sadari sebelumnya.", name: "Sari Wulandari", role: "Head of Legal, Fintech" },
    ],
    team: [
      { name: "Andika Pratama, S.H., M.H.", role: "Managing Partner" },
      { name: "Maya Lestari, S.H., LL.M.", role: "Partner · Korporasi" },
      { name: "Yoga Saputra, S.H.", role: "Partner · Litigasi" },
    ],
    cta: {
      title: "Punya persoalan hukum yang perlu segera ditangani?",
      subtitle: "Konsultasi awal 30 menit tanpa biaya.",
      button: "Hubungi Kami",
    },
    contact: {
      address: "Gedung Wisma Aksara Lt. 12, Jl. Jend. Sudirman Kav. 21, Jakarta",
      phone: "(021) 555-0123",
      email: "halo@aksaralegal.co.id",
      hours: "Senin–Jumat, 08.00–17.00",
    },
    whatsapp: "0812-5550-0123",
    seo: {
      schemaType: "LegalService",
      locality: "Jakarta Selatan",
      region: "DKI Jakarta",
      openingHours: ["Mo-Fr 08:00-17:00"],
      priceRange: "$$$",
      keywords: ["firma hukum Jakarta", "konsultan hukum", "pengacara korporasi", "advokat"],
    },
    faq: [
      { q: "Apakah konsultasi awal benar-benar gratis?", a: "Ya. Konsultasi awal 30 menit tidak dikenakan biaya dan tidak mengikat. Setelahnya kami kirimkan proposal tertulis beserta estimasi biaya." },
      { q: "Bagaimana sistem biayanya?", a: "Tersedia biaya per jam, biaya tetap per pekerjaan, atau retainer bulanan. Semua disepakati tertulis sebelum pekerjaan dimulai." },
      { q: "Apakah bisa konsultasi online?", a: "Bisa, lewat video call. Dokumen dapat dikirim melalui email terenkripsi." },
      { q: "Berapa lama proses pendirian PT?", a: "Umumnya 7–14 hari kerja sejak dokumen lengkap, termasuk akta, SK Kemenkumham, dan NIB." },
    ],
    widget: {
      type: "booking",
      title: "Jadwalkan konsultasi",
      subtitle: "Pilih topik, partner, dan waktu yang cocok — konfirmasi dikirim lewat WhatsApp.",
      topicLabel: "Topik",
      topics: ["Hukum Korporasi", "Penyelesaian Sengketa", "Kepatuhan & Regulasi", "Kontrak & Perjanjian", "Ketenagakerjaan", "Kekayaan Intelektual"],
      personLabel: "Partner",
      slots: ["09.00", "10.30", "13.00", "14.30", "16.00"],
      closedDays: [0, 6],
      daysAhead: 10,
    },
  },
  {
    slug: "bangun-prima",
    name: "Bangun Prima",
    industry: { en: "Construction & contractor", id: "Konstruksi & kontraktor" },
    summary: {
      en: "Bold, high-contrast design with big numbers, a project-driven service list and a quote form.",
      id: "Desain tegas berkontras tinggi dengan angka besar, daftar layanan berbasis proyek, dan form penawaran.",
    },
    layout: "bold",
    highlights: [
      { en: "Cost estimator", id: "Kalkulator biaya" },
      { en: "Big-number stats", id: "Statistik angka besar" },
      { en: "Numbered services", id: "Layanan bernomor" },
      { en: "Quote request form", id: "Form minta penawaran" },
    ],
    theme: { primary: "#f97316", accent: "#facc15", dark: true, font: "sans" },
    company: { name: "Bangun Prima", tagline: "General Contractor" },
    nav: ["Beranda", "Layanan", "Estimasi", "Proses", "Kontak"],
    hero: {
      eyebrow: "Kontraktor bersertifikat · Kualifikasi B1",
      title: "Membangun tepat waktu. Tepat anggaran.",
      subtitle:
        "Gudang, ruko, kantor, hingga fasilitas industri — dikerjakan tim sipil, MEP, dan arsitek dalam satu kontrak.",
      cta: "Minta Penawaran",
      secondaryCta: "Lihat Layanan",
    },
    stats: [
      { value: "240+", label: "Proyek selesai" },
      { value: "1,2 jt m²", label: "Luas terbangun" },
      { value: "0", label: "Kecelakaan kerja fatal" },
      { value: "92%", label: "Selesai sesuai jadwal" },
    ],
    about: {
      title: "Satu kontrak, satu penanggung jawab",
      body: "Bangun Prima menangani proyek dari desain hingga serah terima. Setiap proyek dipimpin project manager bersertifikat dengan laporan progres mingguan dan dokumentasi foto harian.",
      points: ["Sertifikat K3 & ISO 9001", "Garansi struktur 10 tahun", "Laporan progres mingguan"],
    },
    services: [
      { icon: "building", title: "Bangunan Komersial", description: "Ruko, kantor, dan pusat perbelanjaan skala kecil hingga menengah." },
      { icon: "package", title: "Gudang & Industri", description: "Struktur baja bentang lebar, lantai beban berat, dan loading dock." },
      { icon: "ruler", title: "Desain & Perencanaan", description: "Gambar arsitektur, struktur, RAB, dan pengurusan PBG." },
      { icon: "hardhat", title: "Renovasi & Retrofit", description: "Perkuatan struktur, renovasi interior, dan alih fungsi bangunan." },
    ],
    process: [
      { title: "Survei & RAB", description: "Tim survei datang ke lokasi; RAB terperinci dalam 7 hari kerja." },
      { title: "Kontrak & jadwal", description: "Jadwal kurva-S dan termin pembayaran yang jelas." },
      { title: "Konstruksi", description: "Pengawasan harian, laporan mingguan, dan quality control tiap tahap." },
      { title: "Serah terima", description: "Uji fungsi, as-built drawing, dan masa pemeliharaan." },
    ],
    testimonials: [
      { quote: "Gudang 6.000 m² kami selesai dua minggu lebih cepat. Laporan mingguannya sangat membantu direksi.", name: "Hendra Wijaya", role: "Operations Director, Logistik" },
      { quote: "Tim yang disiplin soal K3 dan rapi di lapangan.", name: "Lina Marlina", role: "Owner, Ruko Sentra Niaga" },
    ],
    team: [
      { name: "Ir. Gunawan Saputra", role: "Direktur Utama" },
      { name: "Dewi Anggraini, S.T.", role: "Project Manager" },
      { name: "Rizal Fahmi, S.T.", role: "Kepala K3" },
    ],
    cta: {
      title: "Siap mulai membangun?",
      subtitle: "Kirim detail proyek Anda — survei lokasi gratis untuk area Jabodetabek.",
      button: "Minta Penawaran",
    },
    contact: {
      address: "Jl. Industri Raya No. 8, Cikarang, Bekasi",
      phone: "0812-0000-1234",
      email: "proyek@bangunprima.co.id",
      hours: "Senin–Sabtu, 07.30–16.30",
    },
    whatsapp: "0812-0000-1234",
    seo: {
      schemaType: "GeneralContractor",
      locality: "Cikarang",
      region: "Jawa Barat",
      openingHours: ["Mo-Sa 07:30-16:30"],
      keywords: ["kontraktor gudang", "kontraktor bangunan Bekasi", "jasa konstruksi", "kontraktor ruko"],
    },
    faq: [
      { q: "Apakah survei lokasi berbayar?", a: "Gratis untuk area Jabodetabek. Di luar itu, biaya transportasi survei dipotong dari nilai kontrak jika proyek berjalan." },
      { q: "Berapa lama RAB bisa diterima?", a: "RAB terperinci kami kirim dalam 7 hari kerja setelah survei dan gambar kerja tersedia." },
      { q: "Bagaimana termin pembayarannya?", a: "Umumnya DP 20%, lalu termin berdasarkan progres fisik yang diverifikasi bersama, dan retensi 5% selama masa pemeliharaan." },
      { q: "Apakah bisa membantu pengurusan PBG?", a: "Bisa. Kami menyiapkan gambar dan dokumen teknis sekaligus mendampingi proses pengajuannya." },
    ],
    widget: {
      type: "estimator",
      title: "Estimasi biaya bangun",
      subtitle: "Perkiraan kasar untuk perencanaan awal. Angka final ditentukan setelah survei dan RAB.",
      buildingTypes: [
        { label: "Gudang (struktur baja)", pricePerM2: [2_800_000, 3_600_000] },
        { label: "Ruko / rumah toko", pricePerM2: [3_800_000, 5_000_000] },
        { label: "Kantor", pricePerM2: [4_500_000, 6_500_000] },
        { label: "Renovasi interior", pricePerM2: [1_500_000, 2_800_000] },
      ],
      finishes: [
        { label: "Standar", multiplier: 1 },
        { label: "Menengah", multiplier: 1.2 },
        { label: "Premium", multiplier: 1.45 },
      ],
      area: { min: 50, max: 10000, default: 400 },
      floorsMax: 5,
    },
  },
  {
    slug: "klinik-sehat-sentosa",
    name: "Klinik Sehat Sentosa",
    industry: { en: "Clinic & healthcare", id: "Klinik & kesehatan" },
    summary: {
      en: "Calm, minimal design with clear services, doctor profiles and opening hours up front.",
      id: "Desain tenang dan minimalis: layanan jelas, profil dokter, dan jam praktik langsung terlihat.",
    },
    layout: "minimal",
    highlights: [
      { en: "Doctor appointments", id: "Booking dokter" },
      { en: "Doctor profiles", id: "Profil dokter" },
      { en: "Opening hours", id: "Jam praktik" },
      { en: "Appointment CTA", id: "Tombol buat janji" },
    ],
    theme: { primary: "#0f766e", accent: "#5eead4", dark: false, font: "sans" },
    company: { name: "Sehat Sentosa", tagline: "Klinik Pratama & Gigi" },
    nav: ["Beranda", "Layanan", "Buat Janji", "Dokter", "Kontak"],
    hero: {
      eyebrow: "Buka setiap hari · BPJS & asuransi",
      title: "Perawatan yang tenang, untuk seluruh keluarga",
      subtitle: "Dokter umum, dokter gigi, dan pemeriksaan laboratorium dasar dalam satu tempat — dengan antrean online.",
      cta: "Buat Janji",
      secondaryCta: "Lihat Layanan",
    },
    stats: [
      { value: "12", label: "Dokter & dokter gigi" },
      { value: "30 mnt", label: "Rata-rata waktu tunggu" },
      { value: "4,9", label: "Rating Google" },
    ],
    about: {
      title: "Klinik yang mendengarkan",
      body: "Kami percaya konsultasi yang baik dimulai dari waktu yang cukup. Setiap pasien mendapat waktu konsultasi minimal 15 menit dan ringkasan pemeriksaan tertulis.",
      points: ["Antrean online lewat WhatsApp", "Melayani BPJS & 20+ asuransi", "Ruang tunggu ramah anak"],
    },
    services: [
      { icon: "stethoscope", title: "Dokter Umum", description: "Pemeriksaan, surat keterangan sehat, dan rujukan." },
      { icon: "smile", title: "Dokter Gigi", description: "Scaling, tambal, cabut, dan perawatan saluran akar." },
      { icon: "baby", title: "Kesehatan Ibu & Anak", description: "Imunisasi, tumbuh kembang, dan konsultasi laktasi." },
      { icon: "heart", title: "Cek Kesehatan", description: "Paket medical check-up dan laboratorium dasar." },
    ],
    process: [
      { title: "Daftar online", description: "Pilih dokter dan jam lewat WhatsApp." },
      { title: "Datang tepat waktu", description: "Nomor antrean dikirim 30 menit sebelumnya." },
      { title: "Konsultasi", description: "Ringkasan pemeriksaan dikirim setelah kunjungan." },
    ],
    testimonials: [
      { quote: "Dokternya sabar menjelaskan, anak saya jadi tidak takut lagi periksa.", name: "Ibu Ratna", role: "Pasien" },
      { quote: "Antrean online-nya benar-benar memangkas waktu tunggu.", name: "Fajar", role: "Pasien" },
      { quote: "Tempatnya bersih dan nyaman, pelayanannya ramah.", name: "Melati", role: "Pasien" },
    ],
    team: [
      { name: "dr. Anisa Rahma", role: "Dokter Umum" },
      { name: "drg. Kevin Halim", role: "Dokter Gigi" },
      { name: "dr. Putri Ayu, Sp.A", role: "Dokter Anak" },
      { name: "Bidan Wulan", role: "Konselor Laktasi" },
    ],
    cta: {
      title: "Butuh periksa hari ini?",
      subtitle: "Daftar online dan datang sesuai jadwal — tanpa antre lama.",
      button: "Buat Janji via WhatsApp",
    },
    contact: {
      address: "Jl. Kenanga No. 17, Bandung",
      phone: "0811-2200-3300",
      email: "info@kliniksentosa.id",
      hours: "Setiap hari, 07.00–21.00",
    },
    whatsapp: "0811-2200-3300",
    seo: {
      schemaType: "MedicalClinic",
      locality: "Bandung",
      region: "Jawa Barat",
      openingHours: ["Mo-Su 07:00-21:00"],
      keywords: ["klinik Bandung", "dokter gigi Bandung", "klinik BPJS", "dokter umum"],
    },
    faq: [
      { q: "Apakah melayani pasien BPJS?", a: "Ya, untuk peserta yang terdaftar di klinik kami sebagai faskes tingkat pertama. Kami juga menerima lebih dari 20 asuransi swasta." },
      { q: "Perlu daftar dulu atau bisa langsung datang?", a: "Bisa langsung datang, tapi pasien yang daftar online didahulukan sesuai jam yang dipilih." },
      { q: "Apakah ada layanan di hari Minggu?", a: "Ada. Dokter umum praktik setiap hari; jadwal dokter gigi dan dokter anak bisa dilihat saat membuat janji." },
    ],
    widget: {
      type: "booking",
      title: "Buat janji temu",
      subtitle: "Pilih layanan, dokter, dan jam kedatangan. Nomor antrean dikirim lewat WhatsApp.",
      topicLabel: "Layanan",
      topics: ["Dokter Umum", "Dokter Gigi", "Kesehatan Ibu & Anak", "Cek Kesehatan"],
      personLabel: "Dokter",
      slots: ["08.00", "09.30", "11.00", "13.30", "15.00", "16.30", "19.00"],
      closedDays: [],
      daysAhead: 7,
    },
  },
  {
    slug: "kopi-ruang-temu",
    name: "Kopi Ruang Temu",
    industry: { en: "Café & F&B", id: "Kafe & F&B" },
    summary: {
      en: "Warm, editorial design for food & beverage brands: menu highlights, story and locations.",
      id: "Desain hangat bergaya editorial untuk brand F&B: menu andalan, cerita brand, dan lokasi.",
    },
    layout: "bold",
    highlights: [
      { en: "Online ordering", id: "Pesan online" },
      { en: "Menu highlights", id: "Menu andalan" },
      { en: "Brand story", id: "Cerita brand" },
      { en: "Reservations", id: "Reservasi" },
    ],
    theme: { primary: "#d97706", accent: "#fde68a", dark: true, font: "serif" },
    company: { name: "Ruang Temu", tagline: "Kopi & Dapur" },
    nav: ["Beranda", "Menu", "Pesan Online", "Cerita", "Lokasi"],
    hero: {
      eyebrow: "Roastery sendiri · Yogyakarta",
      title: "Kopi lokal, meja panjang, obrolan tanpa terburu-buru.",
      subtitle: "Biji kopi dari petani Temanggung dan Kintamani, disangrai sendiri setiap minggu.",
      cta: "Reservasi Meja",
      secondaryCta: "Lihat Menu",
    },
    stats: [
      { value: "3", label: "Cabang" },
      { value: "8", label: "Origin kopi lokal" },
      { value: "52rb", label: "Cangkir per bulan" },
    ],
    about: {
      title: "Berawal dari meja panjang di garasi",
      body: "Ruang Temu dimulai tahun 2018 sebagai tempat ngopi kecil di garasi rumah. Sekarang kami punya tiga cabang, tapi prinsipnya tetap: kopi yang jujur dan tempat yang membuat orang betah bercerita.",
      points: ["Bekerja langsung dengan 6 kelompok tani", "Disangrai di roastery sendiri", "Ruang komunal untuk acara"],
    },
    services: [
      { icon: "coffee", title: "Kopi Susu Gula Aren", description: "Espresso blend rumah dengan gula aren Kulon Progo." },
      { icon: "coffee", title: "Manual Brew", description: "V60 dan Aeropress dengan pilihan 8 origin lokal." },
      { icon: "cake", title: "Dapur Ruang Temu", description: "Nasi, roti panggang, dan kue yang dibuat setiap pagi." },
      { icon: "users", title: "Ruang Acara", description: "Meja panjang untuk 30 orang — rapat, workshop, atau arisan." },
    ],
    process: [
      { title: "Pilih cabang", description: "Kotabaru, Prawirotaman, atau Kaliurang." },
      { title: "Pilih jam", description: "Reservasi minimal 2 jam sebelumnya." },
      { title: "Datang & nikmati", description: "Meja disimpan 15 menit dari jam reservasi." },
    ],
    testimonials: [
      { quote: "Kopi susunya tidak terlalu manis dan tempatnya enak untuk kerja seharian.", name: "Dimas", role: "Pelanggan" },
      { quote: "Workshop kantor kami di ruang acaranya — rapi dan makanannya enak.", name: "Nadia", role: "HR Manager" },
    ],
    team: [
      { name: "Bayu Aji", role: "Founder & Roaster" },
      { name: "Tari Susanti", role: "Head Barista" },
      { name: "Gilang", role: "Kepala Dapur" },
    ],
    cta: {
      title: "Sampai jumpa di meja panjang",
      subtitle: "Reservasi untuk rombongan atau acara kecil.",
      button: "Reservasi Sekarang",
    },
    contact: {
      address: "Jl. Faridan M. Noto No. 9, Kotabaru, Yogyakarta",
      phone: "0813-9000-7788",
      email: "halo@ruangtemu.coffee",
      hours: "Setiap hari, 08.00–23.00",
    },
    whatsapp: "0813-9000-7788",
    seo: {
      schemaType: "CafeOrCoffeeShop",
      locality: "Yogyakarta",
      region: "DI Yogyakarta",
      openingHours: ["Mo-Su 08:00-23:00"],
      priceRange: "Rp20.000–Rp40.000",
      keywords: ["coffee shop Jogja", "kopi lokal Yogyakarta", "kafe Kotabaru", "roastery Jogja"],
    },
    faq: [
      { q: "Apakah bisa pesan untuk diambil (take away)?", a: "Bisa. Pesan lewat tombol di bagian Pesan Online, lalu ambil di cabang pilihan Anda dalam 15 menit." },
      { q: "Apakah menerima pesanan untuk acara kantor?", a: "Ya, untuk minimal 20 porsi. Hubungi kami H-2 agar biji kopi bisa disiapkan." },
      { q: "Apakah biji kopinya dijual?", a: "Ya, dalam kemasan 200 gram dan 1 kg, digiling sesuai alat seduh Anda." },
    ],
    widget: {
      type: "menu",
      title: "Pesan online",
      subtitle: "Pilih menu, atur jumlah, lalu kirim pesanan lewat WhatsApp untuk diambil di cabang.",
      categories: [
        {
          name: "Kopi",
          items: [
            { name: "Kopi Susu Gula Aren", price: 24000, description: "Espresso blend rumah, susu segar, gula aren.", tag: "Favorit" },
            { name: "Americano", price: 22000, description: "Double shot espresso dengan air panas." },
            { name: "V60 Single Origin", price: 30000, description: "Pilihan origin harian: Temanggung, Kintamani, Gayo." },
            { name: "Es Kopi Pandan", price: 27000, description: "Kopi susu dengan sirup pandan buatan sendiri.", tag: "Baru" },
          ],
        },
        {
          name: "Non-kopi",
          items: [
            { name: "Cokelat Rempah", price: 26000, description: "Cokelat hitam dengan kayu manis dan cengkeh." },
            { name: "Teh Telang Lemon", price: 20000, description: "Teh bunga telang dengan perasan lemon." },
          ],
        },
        {
          name: "Makanan",
          items: [
            { name: "Nasi Ayam Sambal Matah", price: 38000, description: "Ayam bakar, sambal matah, nasi hangat.", tag: "Favorit" },
            { name: "Roti Bakar Srikaya", price: 22000, description: "Roti sourdough dengan srikaya pandan." },
            { name: "Pisang Goreng Keju", price: 20000, description: "Pisang kepok, keju, dan susu kental manis." },
          ],
        },
      ],
    },
  },
  {
    slug: "nusantara-logistik",
    name: "Nusantara Logistik",
    industry: { en: "Logistics & shipping", id: "Logistik & ekspedisi" },
    summary: {
      en: "Corporate layout for B2B services: coverage, service tiers, process and client testimonials.",
      id: "Layout korporat untuk jasa B2B: jangkauan, pilihan layanan, proses kerja, dan testimoni klien.",
    },
    layout: "corporate",
    highlights: [
      { en: "Shipping calculator", id: "Cek ongkir" },
      { en: "Service tiers", id: "Pilihan layanan" },
      { en: "Coverage stats", id: "Statistik jangkauan" },
      { en: "B2B process", id: "Proses B2B" },
    ],
    theme: { primary: "#1d4ed8", accent: "#22d3ee", dark: false, font: "sans" },
    company: { name: "Nusantara Logistik", tagline: "Freight & Fulfillment" },
    nav: ["Beranda", "Layanan", "Cek Ongkir", "Tentang", "Kontak"],
    hero: {
      eyebrow: "Kirim ke 514 kota/kabupaten",
      title: "Logistik B2B yang bisa Anda pantau setiap jamnya",
      subtitle: "Pengiriman darat, laut, dan udara — plus gudang fulfillment dengan sistem pelacakan real-time.",
      cta: "Hitung Ongkos Kirim",
      secondaryCta: "Lihat Layanan",
    },
    stats: [
      { value: "514", label: "Kota & kabupaten" },
      { value: "38", label: "Gudang mitra" },
      { value: "1,8 jt", label: "Paket per bulan" },
      { value: "99,2%", label: "Terkirim tepat waktu" },
    ],
    about: {
      title: "Dari gudang sampai tanda terima",
      body: "Nusantara Logistik menggabungkan armada sendiri dan jaringan mitra di seluruh Indonesia, dengan satu dasbor untuk memantau setiap kiriman.",
      points: ["Dasbor pelacakan real-time", "Asuransi kiriman hingga Rp500 juta", "Account manager khusus untuk klien korporat"],
    },
    services: [
      { icon: "truck", title: "Freight Darat", description: "FTL/LTL antar kota dengan armada CDD hingga trailer." },
      { icon: "globe", title: "Kargo Laut & Udara", description: "Antar pulau dengan konsolidasi muatan dan door-to-door." },
      { icon: "package", title: "Fulfillment", description: "Penyimpanan, pick & pack, dan integrasi marketplace." },
      { icon: "clock", title: "Same-Day Kota Besar", description: "Pengiriman di hari yang sama untuk 12 kota besar." },
      { icon: "chart", title: "Dasbor Logistik", description: "Laporan SLA, biaya, dan performa kurir per bulan." },
      { icon: "shield", title: "Asuransi Kiriman", description: "Perlindungan barang bernilai tinggi dan mudah pecah." },
    ],
    process: [
      { title: "Pickup", description: "Penjemputan terjadwal atau on-demand dari gudang Anda." },
      { title: "Sortir & kirim", description: "Rute dioptimalkan otomatis berdasarkan tujuan dan SLA." },
      { title: "Lacak", description: "Status per jam di dasbor dan notifikasi ke penerima." },
      { title: "Bukti terima", description: "Foto dan tanda tangan digital tersimpan otomatis." },
    ],
    testimonials: [
      { quote: "Sejak pindah ke Nusantara Logistik, komplain keterlambatan turun drastis.", name: "Yohanes", role: "Supply Chain Lead, FMCG" },
      { quote: "Integrasi ke marketplace-nya mulus, stok kami jadi akurat.", name: "Citra", role: "Founder, brand skincare" },
      { quote: "Dasbornya membuat laporan bulanan jadi lima menit.", name: "Agus", role: "Finance Manager" },
    ],
    team: [
      { name: "Teddy Kurniawan", role: "CEO" },
      { name: "Larasati", role: "VP Operations" },
      { name: "Ferry Santoso", role: "Head of Fulfillment" },
    ],
    cta: {
      title: "Butuh mitra logistik untuk bisnis Anda?",
      subtitle: "Dapatkan penawaran tarif korporat dalam 1×24 jam.",
      button: "Minta Penawaran",
    },
    contact: {
      address: "Kawasan Pergudangan Marunda Center Blok C-5, Jakarta Utara",
      phone: "1500-123",
      email: "sales@nusantaralogistik.co.id",
      hours: "Senin–Sabtu, 08.00–18.00",
    },
    whatsapp: "0812-1500-1230",
    seo: {
      schemaType: "ProfessionalService",
      locality: "Jakarta Utara",
      region: "DKI Jakarta",
      openingHours: ["Mo-Sa 08:00-18:00"],
      keywords: ["jasa logistik B2B", "ekspedisi kargo", "fulfillment Jakarta", "pengiriman antar pulau"],
    },
    faq: [
      { q: "Apakah ada minimum berat pengiriman?", a: "Untuk layanan Reguler dan Express tidak ada minimum. Kargo minimum 10 kg per pengiriman." },
      { q: "Bagaimana jika barang rusak atau hilang?", a: "Setiap kiriman dilindungi asuransi dasar; untuk barang bernilai tinggi tersedia asuransi tambahan hingga Rp500 juta." },
      { q: "Apakah bisa pickup dari gudang saya?", a: "Bisa, gratis untuk klien korporat dengan jadwal rutin, dan on-demand di 12 kota besar." },
    ],
    widget: {
      type: "shipping",
      title: "Cek ongkos kirim",
      subtitle: "Estimasi tarif dan waktu tempuh. Tarif korporat bisa lebih rendah sesuai volume.",
      cities: [
        { name: "Jakarta", zone: 0 },
        { name: "Bandung", zone: 0 },
        { name: "Semarang", zone: 1 },
        { name: "Surabaya", zone: 1 },
        { name: "Denpasar", zone: 2 },
        { name: "Medan", zone: 2 },
        { name: "Makassar", zone: 3 },
        { name: "Balikpapan", zone: 3 },
        { name: "Jayapura", zone: 5 },
      ],
      services: [
        { name: "Reguler", base: 9000, perKg: 7000, etaDays: [2, 4] },
        { name: "Express", base: 15000, perKg: 12000, etaDays: [1, 2] },
        { name: "Kargo (min. 10 kg)", base: 50000, perKg: 4500, etaDays: [4, 8] },
      ],
    },
  },
  {
    slug: "cendekia-academy",
    name: "Cendekia Academy",
    industry: { en: "Education & courses", id: "Pendidikan & kursus" },
    summary: {
      en: "Friendly minimal design for schools and course providers: programs, mentors and enrollment.",
      id: "Desain minimalis yang ramah untuk sekolah dan lembaga kursus: program, mentor, dan pendaftaran.",
    },
    layout: "minimal",
    highlights: [
      { en: "Program finder quiz", id: "Kuis cari program" },
      { en: "Program catalog", id: "Katalog program" },
      { en: "Mentor profiles", id: "Profil mentor" },
      { en: "Enrollment steps", id: "Langkah pendaftaran" },
    ],
    theme: { primary: "#6d28d9", accent: "#f0abfc", dark: false, font: "sans" },
    company: { name: "Cendekia", tagline: "Academy" },
    nav: ["Beranda", "Program", "Cari Program", "Mentor", "Kontak"],
    hero: {
      eyebrow: "Pendaftaran gelombang 3 dibuka",
      title: "Belajar skill digital bersama mentor praktisi",
      subtitle: "Kelas kecil, proyek nyata, dan pendampingan karier — online maupun tatap muka di Surabaya.",
      cta: "Daftar Sekarang",
      secondaryCta: "Lihat Program",
    },
    stats: [
      { value: "4.200+", label: "Alumni" },
      { value: "87%", label: "Bekerja ≤ 6 bulan" },
      { value: "15", label: "Kelas per angkatan" },
    ],
    about: {
      title: "Kelas kecil, umpan balik besar",
      body: "Setiap kelas dibatasi 15 peserta supaya mentor bisa memberi umpan balik pada setiap tugas. Kurikulum disusun bersama perusahaan mitra dan diperbarui tiap semester.",
      points: ["Mentor dari perusahaan teknologi", "Proyek portofolio di setiap kelas", "Sesi persiapan wawancara kerja"],
    },
    services: [
      { icon: "code", title: "Web Development", description: "HTML, React, dan backend dasar dalam 12 minggu." },
      { icon: "chart", title: "Data Analytics", description: "SQL, spreadsheet, dan dashboard untuk keputusan bisnis." },
      { icon: "ruler", title: "UI/UX Design", description: "Riset pengguna, wireframe, hingga prototipe interaktif." },
      { icon: "book", title: "Digital Marketing", description: "SEO, iklan berbayar, dan strategi konten." },
    ],
    process: [
      { title: "Pilih program", description: "Ikuti sesi info gratis untuk menemukan program yang cocok." },
      { title: "Tes penempatan", description: "Tes singkat online untuk menyesuaikan level kelas." },
      { title: "Mulai belajar", description: "Kelas dimulai setiap awal bulan; cicilan 0% tersedia." },
    ],
    testimonials: [
      { quote: "Proyek akhir saya jadi bahan utama saat wawancara kerja pertama.", name: "Aldi", role: "Alumni Web Development" },
      { quote: "Mentornya detail sekali memberi masukan di setiap tugas.", name: "Nabila", role: "Alumni UI/UX" },
      { quote: "Kelas kecil membuat saya berani bertanya.", name: "Rendi", role: "Alumni Data Analytics" },
    ],
    team: [
      { name: "Arief Nugroho", role: "Mentor Web Development" },
      { name: "Clara Widjaja", role: "Mentor UI/UX" },
      { name: "Hana Pertiwi", role: "Mentor Data Analytics" },
      { name: "Dion Prakoso", role: "Career Coach" },
    ],
    cta: {
      title: "Kelas berikutnya mulai bulan depan",
      subtitle: "Kursi terbatas 15 peserta per kelas.",
      button: "Daftar Sekarang",
    },
    contact: {
      address: "Jl. Raya Darmo No. 45, Surabaya",
      phone: "0821-3300-4455",
      email: "halo@cendekia.academy",
      hours: "Senin–Jumat, 09.00–20.00",
    },
    whatsapp: "0821-3300-4455",
    seo: {
      schemaType: ["EducationalOrganization", "LocalBusiness"],
      title: "Cendekia Academy — Kursus Skill Digital di Surabaya",
      locality: "Surabaya",
      region: "Jawa Timur",
      openingHours: ["Mo-Fr 09:00-20:00"],
      keywords: ["kursus web development Surabaya", "bootcamp data analytics", "kursus UI/UX", "kursus digital marketing"],
    },
    faq: [
      { q: "Apakah pemula tanpa latar belakang IT bisa ikut?", a: "Bisa. Semua program dimulai dari dasar, dan tes penempatan membantu menyesuaikan kelas." },
      { q: "Apakah tersedia cicilan?", a: "Ya, cicilan 0% hingga 6 bulan melalui mitra pembayaran kami." },
      { q: "Apakah mendapat sertifikat?", a: "Ya, sertifikat kelulusan diberikan setelah menyelesaikan proyek akhir dan minimal 80% kehadiran." },
    ],
    widget: {
      type: "quiz",
      title: "Program mana yang cocok untuk Anda?",
      subtitle: "Jawab tiga pertanyaan singkat — kami rekomendasikan program yang paling pas.",
      questions: [
        {
          question: "Kegiatan apa yang paling Anda nikmati?",
          options: [
            { label: "Membuat sesuatu yang bisa dipakai orang", scores: { web: 2, uiux: 1 } },
            { label: "Mencari pola dari angka dan data", scores: { data: 2 } },
            { label: "Mendesain tampilan yang rapi", scores: { uiux: 2 } },
            { label: "Membuat konten dan kampanye", scores: { marketing: 2 } },
          ],
        },
        {
          question: "Seperti apa pekerjaan impian Anda?",
          options: [
            { label: "Software engineer", scores: { web: 2 } },
            { label: "Data analyst", scores: { data: 2 } },
            { label: "Product designer", scores: { uiux: 2 } },
            { label: "Growth / digital marketer", scores: { marketing: 2 } },
          ],
        },
        {
          question: "Berapa waktu belajar per minggu?",
          options: [
            { label: "Di bawah 6 jam", scores: { marketing: 1, uiux: 1 } },
            { label: "6–10 jam", scores: { data: 1, uiux: 1 } },
            { label: "Lebih dari 10 jam", scores: { web: 1, data: 1 } },
          ],
        },
      ],
      results: {
        web: { name: "Web Development", description: "HTML, React, dan backend dasar — lulus dengan 3 proyek portofolio.", duration: "12 minggu", price: 7_500_000 },
        data: { name: "Data Analytics", description: "SQL, spreadsheet lanjutan, dan dashboard untuk keputusan bisnis.", duration: "10 minggu", price: 6_500_000 },
        uiux: { name: "UI/UX Design", description: "Riset pengguna, wireframe, hingga prototipe interaktif di Figma.", duration: "10 minggu", price: 6_000_000 },
        marketing: { name: "Digital Marketing", description: "SEO, iklan berbayar, dan strategi konten berbasis data.", duration: "8 minggu", price: 4_500_000 },
      },
    },
  },
];

export function getCompanyTemplate(slug: string): CompanyTemplate | undefined {
  return companyTemplates.find((t) => t.slug === slug);
}
