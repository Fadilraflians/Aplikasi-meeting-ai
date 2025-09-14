# Contributing Guidelines

Terima kasih telah tertarik untuk berkontribusi pada Aplikasi Meeting Room Booking! 🎉

## 📋 Cara Berkontribusi

### 1. Fork Repository
- Klik tombol "Fork" di halaman repository
- Clone repository yang sudah di-fork ke komputer lokal Anda

### 2. Setup Development Environment
```bash
# Clone repository
git clone https://github.com/your-username/aplikasi-meeting-ai.git
cd aplikasi-meeting-ai

# Install dependencies
npm install
composer install

# Setup environment
cp .env.example .env.local
# Edit .env.local dengan konfigurasi yang sesuai
```

### 3. Buat Branch untuk Feature
```bash
git checkout -b feature/nama-feature-anda
# atau
git checkout -b bugfix/nama-bugfix-anda
```

### 4. Development Guidelines

#### Code Style
- **JavaScript/TypeScript**: Gunakan ESLint dan Prettier
- **PHP**: Ikuti PSR-12 coding standard
- **CSS**: Gunakan Tailwind CSS utility classes
- **Commit Messages**: Gunakan format conventional commits

#### File Structure
```
aplikasi-meeting-ai/
├── components/          # Reusable React components
├── pages/              # Page components
├── contexts/           # React contexts
├── services/           # Business logic
├── backend/            # PHP backend
│   ├── api/           # API endpoints
│   ├── models/        # Database models
│   └── config/        # Configuration
└── database/          # SQL schemas
```

#### Naming Conventions
- **Components**: PascalCase (e.g., `MeetingRoomCard.tsx`)
- **Files**: camelCase untuk JS/TS, snake_case untuk PHP
- **Variables**: camelCase untuk JS/TS, snake_case untuk PHP
- **Constants**: UPPER_SNAKE_CASE

### 5. Testing
Sebelum submit PR, pastikan:
- [ ] Kode sudah di-test secara manual
- [ ] Tidak ada error di console browser
- [ ] Responsive design masih berfungsi
- [ ] Dark/Light mode masih berfungsi
- [ ] Multi-language support masih berfungsi

### 6. Commit Changes
```bash
# Add changes
git add .

# Commit dengan pesan yang jelas
git commit -m "feat: add new booking confirmation feature"

# Push ke branch
git push origin feature/nama-feature-anda
```

### 7. Create Pull Request
- Buka repository di GitHub
- Klik "New Pull Request"
- Pilih branch yang akan di-merge
- Isi deskripsi yang jelas tentang perubahan yang dibuat
- Assign reviewer jika ada

## 🐛 Melaporkan Bug

### Cara Melaporkan Bug
1. Cek apakah bug sudah pernah dilaporkan di [Issues](https://github.com/username/aplikasi-meeting-ai/issues)
2. Buat issue baru dengan template bug report
3. Sertakan informasi:
   - Deskripsi bug yang jelas
   - Langkah-langkah untuk reproduce
   - Screenshot jika diperlukan
   - Environment (browser, OS, dll)

### Template Bug Report
```markdown
## Bug Description
[Deskripsi bug yang jelas]

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
[Deskripsi behavior yang diharapkan]

## Actual Behavior
[Deskripsi behavior yang terjadi]

## Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Node.js: [e.g. 18.0.0]
- PHP: [e.g. 8.1.0]

## Screenshots
[Jika ada, sertakan screenshot]
```

## ✨ Mengusulkan Fitur Baru

### Cara Mengusulkan Fitur
1. Cek apakah fitur sudah pernah diusulkan di [Issues](https://github.com/username/aplikasi-meeting-ai/issues)
2. Buat issue baru dengan template feature request
3. Jelaskan manfaat dan use case dari fitur tersebut

### Template Feature Request
```markdown
## Feature Description
[Deskripsi fitur yang diusulkan]

## Problem/Use Case
[Penjelasan masalah yang akan diselesaikan atau use case]

## Proposed Solution
[Deskripsi solusi yang diusulkan]

## Alternatives Considered
[Alternatif lain yang sudah dipertimbangkan]

## Additional Context
[Informasi tambahan yang relevan]
```

## 📝 Code Review Process

### Untuk Contributors
- Pastikan kode sudah mengikuti coding standards
- Sertakan test case jika diperlukan
- Update dokumentasi jika ada perubahan API
- Pastikan tidak ada breaking changes tanpa migration

### Untuk Reviewers
- Review kode dengan teliti
- Cek apakah fitur sudah sesuai dengan requirements
- Test functionality secara manual
- Berikan feedback yang konstruktif

## 🏷️ Label System

Kami menggunakan label untuk mengkategorikan issues dan PRs:

- `bug`: Bug yang perlu diperbaiki
- `enhancement`: Fitur baru atau improvement
- `documentation`: Perubahan dokumentasi
- `good first issue`: Cocok untuk contributor baru
- `help wanted`: Membutuhkan bantuan komunitas
- `priority: high`: Prioritas tinggi
- `priority: medium`: Prioritas sedang
- `priority: low`: Prioritas rendah

## 📞 Getting Help

Jika Anda membutuhkan bantuan:

1. **Documentation**: Cek README.md dan dokumentasi lainnya
2. **Issues**: Cari di [Issues](https://github.com/username/aplikasi-meeting-ai/issues)
3. **Discussions**: Gunakan [Discussions](https://github.com/username/aplikasi-meeting-ai/discussions)
4. **Contact**: Hubungi maintainer melalui email

## 🎉 Recognition

Contributors yang aktif akan:
- Dicantumkan di README.md
- Mendapatkan badge contributor
- Diundang sebagai collaborator untuk proyek besar

## 📄 License

Dengan berkontribusi, Anda setuju bahwa kontribusi Anda akan dilisensikan di bawah [MIT License](LICENSE).

---

**Terima kasih telah berkontribusi! 🙏**

Setiap kontribusi, sekecil apapun, sangat berarti untuk perkembangan proyek ini.
