import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'id' | 'en' | 'ja';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  id: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.meetingRooms': 'Ruangan Rapat',
    'nav.aiAssistant': 'Asisten AI',
    'nav.reservations': 'Reservasi',
    'nav.history': 'Riwayat',
    'nav.profile': 'Profil',
    'nav.settings': 'Pengaturan',
    'nav.helpCenter': 'Pusat Bantuan',
    
    // Settings
    'settings.title': 'Pengaturan',
    'settings.appearance': 'Tampilan',
    'settings.darkMode': 'Mode Gelap',
    'settings.darkModeDesc': 'Aktifkan tema gelap',
    'settings.language': 'Bahasa',
    'settings.privacySecurity': 'Privasi & Keamanan',
    'settings.changePassword': 'Ubah Password',
    'settings.twoFactorAuth': 'Verifikasi 2FA',
    'settings.saveSettings': 'Simpan Pengaturan',
    
    // Language options
    'language.indonesian': 'Bahasa Indonesia',
    'language.english': 'English',
    'language.japanese': '日本語',
    
    // Common
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.confirm': 'Konfirmasi',
    'common.loading': 'Memuat...',
    'common.error': 'Terjadi kesalahan',
    'common.success': 'Berhasil',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Selamat datang',
    'dashboard.upcomingMeetings': 'Rapat Mendatang',
    'dashboard.quickActions': 'Aksi Cepat',
    'dashboard.heroTitle': 'Biarkan AI Membantu Anda Memesan Ruang Rapat yang Sempurna!',
    'dashboard.heroSubtitle': 'Temukan dan pesan ruang rapat ideal secara instan dengan bantuan Asisten AI cerdas kami. Proses pemesanan jadi lebih cepat, efisien, dan sesuai kebutuhan Anda.',
    'dashboard.upcomingReservations': 'Reservasi Terdekat',
    'dashboard.bookingHistory': 'Histori Pemesanan',
    'dashboard.featuredFeatures': 'Fitur Unggulan',
    'dashboard.smartRecommendations': 'Rekomendasi Cerdas',
    'dashboard.smartRecommendationsDesc': 'AI kami akan merekomendasikan ruang terbaik berdasarkan kebutuhan Anda, jumlah peserta, dan preferensi fasilitas.',
    'dashboard.automaticScheduling': 'Penjadwalan Otomatis',
    'dashboard.automaticSchedulingDesc': 'Secara otomatis menemukan slot waktu terbaik yang sesuai untuk semua peserta rapat tanpa konflik jadwal.',
    'dashboard.naturalLanguage': 'Bahasa Alami',
    'dashboard.naturalLanguageDesc': 'Berinteraksi dengan Asisten AI kami menggunakan bahasa manusia untuk pengalaman pemesanan yang lebih intuitif.',
    'dashboard.noReservations': 'Anda belum memiliki reservasi.',
    'dashboard.noReservationsDesc': 'Coba buat reservasi melalui AI Assistant atau form manual.',
    'dashboard.viewAllReservations': 'Lihat Semua Reservasi',
    'dashboard.viewHistory': 'Lihat Histori',
    'dashboard.historyDesc': 'Ringkasan histori terbaru Anda (tersimpan lokal meski data database telah dihapus).',
    
    // AI Assistant
    'ai.greeting': 'Halo! 👋 Saya adalah asisten AI Spacio yang siap membantu Anda memesan ruang rapat dengan mudah! 🎯',
    'ai.bookRoom': 'Pesan Ruangan',
    'ai.help': 'Bantuan',
    'ai.clickMessage': 'Halo! Saya adalah Spacio Aplikasi Ruang Meeting AI',
    'ai.chatButton': 'Mari Mengobrol dengan AI!',
    
    // Booking
    'booking.title': 'Pemesanan Ruangan',
    'booking.confirm': 'Konfirmasi Pemesanan',
    'booking.cancel': 'Batalkan Pemesanan',
    'booking.success': 'Pemesanan berhasil!',
    
    // Profile
    'profile.title': 'Profil',
    'profile.settings': 'Pengaturan',
    'profile.settingsDesc': 'Ubah preferensi akun',
    'profile.helpCenter': 'Pusat Bantuan',
    'profile.helpCenterDesc': 'Dapatkan bantuan dan dukungan',
    
    // Meeting Rooms
    'meetingRooms.title': 'Meeting Rooms',
    'meetingRooms.subtitle': 'Discover and book the perfect meeting space for your needs',
    'meetingRooms.addRoom': 'Add Room',
    'meetingRooms.totalRooms': 'Total Ruangan',
    'meetingRooms.availableRooms': 'Ruangan Tersedia',
    'meetingRooms.totalCapacity': 'Total Kapasitas',
    'meetingRooms.loading': 'Memuat data ruangan...',
    'meetingRooms.error': 'Gagal Memuat Data',
    'meetingRooms.retry': 'Coba Lagi',
    'meetingRooms.noRooms': 'Belum Ada Ruangan',
    'meetingRooms.noRoomsDesc': 'Belum ada ruangan meeting yang tersedia. Tambahkan ruangan pertama untuk memulai.',
    'meetingRooms.addFirstRoom': '➕ Tambah Ruangan Pertama',
    'meetingRooms.available': 'Tersedia',
    'meetingRooms.ongoing': 'Sedang Berlangsung',
    'meetingRooms.upcoming': 'Akan Datang',
    'meetingRooms.occupied': 'Sedang Digunakan',
    'meetingRooms.full': 'Penuh',
    'meetingRooms.left': 'Tersisa',
    'meetingRooms.capacity': 'Kapasitas',
    'meetingRooms.address': 'Alamat',
    'meetingRooms.facilities': 'Fasilitas',
    'meetingRooms.book': 'Pesan',
    'meetingRooms.people': 'orang',
    
    // Reservations
    'reservations.title': 'Reservasi Saya',
    'reservations.subtitle': 'Kelola dan pantau semua reservasi meeting room Anda',
    'reservations.totalReservations': 'Total Reservasi',
    'reservations.activeReservations': 'Reservasi Aktif',
    'reservations.roomsUsed': 'Ruangan Digunakan',
    'reservations.searchPlaceholder': 'Cari berdasarkan topik atau ruangan...',
    'reservations.sortNewest': 'Terbaru',
    'reservations.sortOldest': 'Terlama',
    'reservations.noReservations': 'Tidak Ada Reservasi',
    'reservations.noReservationsDesc': 'Anda belum membuat pemesanan apa pun. Mulai dengan mencari ruangan yang tersedia dan buat reservasi pertama Anda.',
    'reservations.searchRooms': '🔍 Cari Ruangan',
    'reservations.active': 'Aktif',
    'reservations.date': 'Tanggal',
    'reservations.time': 'Waktu',
    'reservations.pic': 'PIC',
    'reservations.participants': 'Peserta',
    'reservations.detail': 'Detail',
    'reservations.complete': 'Selesai',
    'reservations.cancel': 'Batalkan',
    'reservations.confirmCancel': 'Apakah Anda yakin ingin membatalkan pemesanan ini? Data akan dihapus dari database.',
    'reservations.cancelSuccess': 'Pemesanan berhasil dibatalkan dan dihapus dari database!',
    'reservations.cancelError': 'Gagal membatalkan pemesanan. Silakan coba lagi.',
    'reservations.completeError': 'Gagal menyelesaikan pemesanan. Silakan coba lagi.',
    
    // Footer
    'footer.aboutUs': 'Tentang Kami',
    'footer.ourProfile': 'Profil Kami',
    'footer.contactUs': 'Kontak Kami',
    'footer.investorRelations': 'Hubungan Investor',
    'footer.annualReport': 'Laporan Tahunan',
    'footer.publications': 'Publikasi',
    'footer.news': 'Berita',
    'footer.airportInfo': 'Informasi & Profil Bandara',
    'footer.memberOf': 'Member Of',
    'footer.airportsCenter': 'InJourney Airports Center',
    'footer.airportName': 'Bandar Udara Internasional Soekarno-Hatta',
    'footer.address': 'Jl. M2, Pajang, Kec. Benda, Kota Tangerang, Banten 15126',
    'footer.companyName': 'PT Angkasa Pura Indonesia',
    'footer.copyright': 'PT Angkasa Pura Indonesia © 2024. All Rights Reserved',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.meetingRooms': 'Meeting Rooms',
    'nav.aiAssistant': 'AI Assistant',
    'nav.reservations': 'Reservations',
    'nav.history': 'History',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.helpCenter': 'Help Center',
    
    // Settings
    'settings.title': 'Settings',
    'settings.appearance': 'Appearance',
    'settings.darkMode': 'Dark Mode',
    'settings.darkModeDesc': 'Enable dark theme',
    'settings.language': 'Language',
    'settings.privacySecurity': 'Privacy & Security',
    'settings.changePassword': 'Change Password',
    'settings.twoFactorAuth': '2FA Verification',
    'settings.saveSettings': 'Save Settings',
    
    // Language options
    'language.indonesian': 'Bahasa Indonesia',
    'language.english': 'English',
    'language.japanese': '日本語',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.upcomingMeetings': 'Upcoming Meetings',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.heroTitle': 'Let AI Help You Book the Perfect Meeting Room!',
    'dashboard.heroSubtitle': 'Find and book the ideal meeting room instantly with the help of our smart AI Assistant. The booking process becomes faster, more efficient, and tailored to your needs.',
    'dashboard.upcomingReservations': 'Upcoming Reservations',
    'dashboard.bookingHistory': 'Booking History',
    'dashboard.featuredFeatures': 'Featured Features',
    'dashboard.smartRecommendations': 'Smart Recommendations',
    'dashboard.smartRecommendationsDesc': 'Our AI will recommend the best room based on your needs, number of participants, and facility preferences.',
    'dashboard.automaticScheduling': 'Automatic Scheduling',
    'dashboard.automaticSchedulingDesc': 'Automatically finds the best time slot that suits all meeting participants without schedule conflicts.',
    'dashboard.naturalLanguage': 'Natural Language',
    'dashboard.naturalLanguageDesc': 'Interact with our AI Assistant using human language for a more intuitive booking experience.',
    'dashboard.noReservations': 'You don\'t have any reservations yet.',
    'dashboard.noReservationsDesc': 'Try creating a reservation through AI Assistant or manual form.',
    'dashboard.viewAllReservations': 'View All Reservations',
    'dashboard.viewHistory': 'View History',
    'dashboard.historyDesc': 'Summary of your recent history (saved locally even if database data has been deleted).',
    
    // AI Assistant
    'ai.greeting': 'Hello! 👋 I am Spacio AI assistant ready to help you book meeting rooms easily! 🎯',
    'ai.bookRoom': 'Book Room',
    'ai.help': 'Help',
    'ai.clickMessage': 'Hello! I am Spacio AI Meeting Room Application',
    'ai.chatButton': 'Let\'s Chat with AI!',
    
    // Booking
    'booking.title': 'Room Booking',
    'booking.confirm': 'Confirm Booking',
    'booking.cancel': 'Cancel Booking',
    'booking.success': 'Booking successful!',
    
    // Profile
    'profile.title': 'Profile',
    'profile.settings': 'Settings',
    'profile.settingsDesc': 'Change account preferences',
    'profile.helpCenter': 'Help Center',
    'profile.helpCenterDesc': 'Get help and support',
    
    // Meeting Rooms
    'meetingRooms.title': 'Meeting Rooms',
    'meetingRooms.subtitle': 'Discover and book the perfect meeting space for your needs',
    'meetingRooms.addRoom': 'Add Room',
    'meetingRooms.totalRooms': 'Total Rooms',
    'meetingRooms.availableRooms': 'Available Rooms',
    'meetingRooms.totalCapacity': 'Total Capacity',
    'meetingRooms.loading': 'Loading room data...',
    'meetingRooms.error': 'Failed to Load Data',
    'meetingRooms.retry': 'Try Again',
    'meetingRooms.noRooms': 'No Rooms Available',
    'meetingRooms.noRoomsDesc': 'No meeting rooms are available yet. Add the first room to get started.',
    'meetingRooms.addFirstRoom': '➕ Add First Room',
    'meetingRooms.available': 'Available',
    'meetingRooms.ongoing': 'Ongoing',
    'meetingRooms.upcoming': 'Upcoming',
    'meetingRooms.occupied': 'Occupied',
    'meetingRooms.full': 'Full',
    'meetingRooms.left': 'Left',
    'meetingRooms.capacity': 'Capacity',
    'meetingRooms.address': 'Address',
    'meetingRooms.facilities': 'Facilities',
    'meetingRooms.book': 'Book',
    'meetingRooms.people': 'people',
    
    // Reservations
    'reservations.title': 'My Reservations',
    'reservations.subtitle': 'Manage and monitor all your meeting room reservations',
    'reservations.totalReservations': 'Total Reservations',
    'reservations.activeReservations': 'Active Reservations',
    'reservations.roomsUsed': 'Rooms Used',
    'reservations.searchPlaceholder': 'Search by topic or room...',
    'reservations.sortNewest': 'Newest',
    'reservations.sortOldest': 'Oldest',
    'reservations.noReservations': 'No Reservations',
    'reservations.noReservationsDesc': 'You haven\'t made any bookings yet. Start by finding available rooms and make your first reservation.',
    'reservations.searchRooms': '🔍 Search Rooms',
    'reservations.active': 'Active',
    'reservations.date': 'Date',
    'reservations.time': 'Time',
    'reservations.pic': 'PIC',
    'reservations.participants': 'Participants',
    'reservations.detail': 'Detail',
    'reservations.complete': 'Complete',
    'reservations.cancel': 'Cancel',
    'reservations.confirmCancel': 'Are you sure you want to cancel this booking? Data will be deleted from the database.',
    'reservations.cancelSuccess': 'Booking successfully cancelled and deleted from database!',
    'reservations.cancelError': 'Failed to cancel booking. Please try again.',
    'reservations.completeError': 'Failed to complete booking. Please try again.',
    
    // Footer
    'footer.aboutUs': 'About Us',
    'footer.ourProfile': 'Our Profile',
    'footer.contactUs': 'Contact Us',
    'footer.investorRelations': 'Investor Relations',
    'footer.annualReport': 'Annual Report',
    'footer.publications': 'Publications',
    'footer.news': 'News',
    'footer.airportInfo': 'Airport Information & Profile',
    'footer.memberOf': 'Member Of',
    'footer.airportsCenter': 'InJourney Airports Center',
    'footer.airportName': 'Soekarno-Hatta International Airport',
    'footer.address': 'Jl. M2, Pajang, Kec. Benda, Kota Tangerang, Banten 15126',
    'footer.companyName': 'PT Angkasa Pura Indonesia',
    'footer.copyright': 'PT Angkasa Pura Indonesia © 2024. All Rights Reserved',
  },
  ja: {
    // Navigation
    'nav.dashboard': 'ダッシュボード',
    'nav.meetingRooms': '会議室',
    'nav.aiAssistant': 'AIアシスタント',
    'nav.reservations': '予約',
    'nav.history': '履歴',
    'nav.profile': 'プロフィール',
    'nav.settings': '設定',
    'nav.helpCenter': 'ヘルプセンター',
    
    // Settings
    'settings.title': '設定',
    'settings.appearance': '外観',
    'settings.darkMode': 'ダークモード',
    'settings.darkModeDesc': 'ダークテーマを有効にする',
    'settings.language': '言語',
    'settings.privacySecurity': 'プライバシーとセキュリティ',
    'settings.changePassword': 'パスワード変更',
    'settings.twoFactorAuth': '2FA認証',
    'settings.saveSettings': '設定を保存',
    
    // Language options
    'language.indonesian': 'Bahasa Indonesia',
    'language.english': 'English',
    'language.japanese': '日本語',
    
    // Common
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.confirm': '確認',
    'common.loading': '読み込み中...',
    'common.error': 'エラーが発生しました',
    'common.success': '成功',
    
    // Dashboard
    'dashboard.title': 'ダッシュボード',
    'dashboard.welcome': 'ようこそ',
    'dashboard.upcomingMeetings': '今後の会議',
    'dashboard.quickActions': 'クイックアクション',
    'dashboard.heroTitle': 'AIに完璧な会議室の予約を手伝ってもらいましょう！',
    'dashboard.heroSubtitle': 'スマートなAIアシスタントの助けを借りて、理想的な会議室を瞬時に見つけて予約しましょう。予約プロセスがより速く、効率的で、あなたのニーズに合わせてカスタマイズされます。',
    'dashboard.upcomingReservations': '今後の予約',
    'dashboard.bookingHistory': '予約履歴',
    'dashboard.featuredFeatures': '注目の機能',
    'dashboard.smartRecommendations': 'スマート推奨',
    'dashboard.smartRecommendationsDesc': '私たちのAIは、あなたのニーズ、参加者数、設備の好みに基づいて最適な部屋を推奨します。',
    'dashboard.automaticScheduling': '自動スケジューリング',
    'dashboard.automaticSchedulingDesc': 'スケジュールの競合なしに、すべての会議参加者に適した最適な時間スロットを自動的に見つけます。',
    'dashboard.naturalLanguage': '自然言語',
    'dashboard.naturalLanguageDesc': 'より直感的な予約体験のために、人間の言語を使用してAIアシスタントとやり取りします。',
    'dashboard.noReservations': 'まだ予約がありません。',
    'dashboard.noReservationsDesc': 'AIアシスタントまたは手動フォームを通じて予約を作成してみてください。',
    'dashboard.viewAllReservations': 'すべての予約を表示',
    'dashboard.viewHistory': '履歴を表示',
    'dashboard.historyDesc': '最新の履歴の概要（データベースデータが削除されてもローカルに保存されます）。',
    
    // AI Assistant
    'ai.greeting': 'こんにちは！👋 私はSpacio AIアシスタントです。会議室の予約を簡単にお手伝いします！🎯',
    'ai.bookRoom': '部屋を予約',
    'ai.help': 'ヘルプ',
    'ai.clickMessage': 'こんにちは！私はSpacio AI会議室アプリケーションです',
    'ai.chatButton': 'AIとチャットしましょう！',
    
    // Booking
    'booking.title': '部屋予約',
    'booking.confirm': '予約確認',
    'booking.cancel': '予約キャンセル',
    'booking.success': '予約が成功しました！',
    
    // Profile
    'profile.title': 'プロフィール',
    'profile.settings': '設定',
    'profile.settingsDesc': 'アカウント設定を変更',
    'profile.helpCenter': 'ヘルプセンター',
    'profile.helpCenterDesc': 'ヘルプとサポートを取得',
    
    // Meeting Rooms
    'meetingRooms.title': '会議室',
    'meetingRooms.subtitle': 'ニーズに合った完璧な会議スペースを見つけて予約しましょう',
    'meetingRooms.addRoom': '部屋を追加',
    'meetingRooms.totalRooms': '総部屋数',
    'meetingRooms.availableRooms': '利用可能な部屋',
    'meetingRooms.totalCapacity': '総収容人数',
    'meetingRooms.loading': '部屋データを読み込み中...',
    'meetingRooms.error': 'データの読み込みに失敗',
    'meetingRooms.retry': '再試行',
    'meetingRooms.noRooms': '部屋がありません',
    'meetingRooms.noRoomsDesc': 'まだ会議室がありません。最初の部屋を追加して始めましょう。',
    'meetingRooms.addFirstRoom': '➕ 最初の部屋を追加',
    'meetingRooms.available': '利用可能',
    'meetingRooms.ongoing': '進行中',
    'meetingRooms.upcoming': '予定',
    'meetingRooms.occupied': '使用中',
    'meetingRooms.full': '満室',
    'meetingRooms.left': '残り',
    'meetingRooms.capacity': '収容人数',
    'meetingRooms.address': '住所',
    'meetingRooms.facilities': '設備',
    'meetingRooms.book': '予約',
    'meetingRooms.people': '人',
    
    // Reservations
    'reservations.title': '私の予約',
    'reservations.subtitle': '会議室の予約を管理・監視しましょう',
    'reservations.totalReservations': '総予約数',
    'reservations.activeReservations': 'アクティブな予約',
    'reservations.roomsUsed': '使用された部屋',
    'reservations.searchPlaceholder': 'トピックまたは部屋で検索...',
    'reservations.sortNewest': '最新',
    'reservations.sortOldest': '最古',
    'reservations.noReservations': '予約がありません',
    'reservations.noReservationsDesc': 'まだ予約を作成していません。利用可能な部屋を見つけて最初の予約を作成しましょう。',
    'reservations.searchRooms': '🔍 部屋を検索',
    'reservations.active': 'アクティブ',
    'reservations.date': '日付',
    'reservations.time': '時間',
    'reservations.pic': 'PIC',
    'reservations.participants': '参加者',
    'reservations.detail': '詳細',
    'reservations.complete': '完了',
    'reservations.cancel': 'キャンセル',
    'reservations.confirmCancel': 'この予約をキャンセルしてもよろしいですか？データはデータベースから削除されます。',
    'reservations.cancelSuccess': '予約が正常にキャンセルされ、データベースから削除されました！',
    'reservations.cancelError': '予約のキャンセルに失敗しました。もう一度お試しください。',
    'reservations.completeError': '予約の完了に失敗しました。もう一度お試しください。',
    
    // Footer
    'footer.aboutUs': '私たちについて',
    'footer.ourProfile': '私たちのプロフィール',
    'footer.contactUs': 'お問い合わせ',
    'footer.investorRelations': '投資家関係',
    'footer.annualReport': '年次報告書',
    'footer.publications': '出版物',
    'footer.news': 'ニュース',
    'footer.airportInfo': '空港情報とプロフィール',
    'footer.memberOf': 'メンバー',
    'footer.airportsCenter': 'InJourney エアポートセンター',
    'footer.airportName': 'スカルノ・ハッタ国際空港',
    'footer.address': 'Jl. M2, Pajang, Kec. Benda, Kota Tangerang, Banten 15126',
    'footer.companyName': 'PT Angkasa Pura Indonesia',
    'footer.copyright': 'PT Angkasa Pura Indonesia © 2024. All Rights Reserved',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('id');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app_language') as Language;
    if (savedLanguage && ['id', 'en', 'ja'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language to localStorage when changed
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
