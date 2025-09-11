@echo off
echo ========================================
echo Setup Tabel Rispat di Database
echo ========================================
echo.

echo Menjalankan script SQL untuk membuat tabel rispat...
echo.

REM Ganti dengan path MySQL Anda jika berbeda
mysql -u root -p spacio_meeting_db < create_rispat_table.sql

echo.
echo ========================================
echo Setup selesai!
echo ========================================
echo.
echo Tabel rispat telah dibuat di database spacio_meeting_db
echo.
echo Langkah selanjutnya:
echo 1. Pastikan file api/rispat.php dapat diakses
echo 2. Buat folder uploads/rispat/ jika belum ada
echo 3. Test upload foto melalui aplikasi
echo.
pause
