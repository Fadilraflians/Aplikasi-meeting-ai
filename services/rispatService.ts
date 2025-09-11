// Service untuk menangani rispat foto
export interface RispatData {
  id: number;
  booking_id: number;
  source_image: string;
  uploaded_at: string;
  status: 'active' | 'deleted';
}

export interface UploadRispatData {
  booking_id: number;
  source_image: string;
}

class RispatService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'http://localhost:5174'; // Sesuaikan dengan URL backend Anda
  }

  // Mendapatkan semua rispat berdasarkan booking_id
  async getRispatByBookingId(bookingId: number): Promise<RispatData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rispat-simple.php?booking_id=${bookingId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.rispat || [] : [];
    } catch (error) {
      console.error('Error fetching rispat:', error);
      return [];
    }
  }

  // Upload rispat baru
  async uploadRispat(file: File, bookingId: number): Promise<RispatData | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('booking_id', bookingId.toString());

      const response = await fetch(`${this.baseUrl}/rispat-simple.php`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      
      return data.rispat;
    } catch (error) {
      console.error('Error uploading rispat:', error);
      throw error; // Re-throw error to be handled by caller
    }
  }

  // Upload multiple rispat
  async uploadMultipleRispat(files: File[], bookingId: number): Promise<RispatData[]> {
    try {
      const uploadPromises = files.map(file => this.uploadRispat(file, bookingId));
      const results = await Promise.all(uploadPromises);
      return results.filter(rispat => rispat !== null) as RispatData[];
    } catch (error) {
      console.error('Error uploading multiple rispat:', error);
      throw error; // Re-throw error to be handled by caller
    }
  }

  // Menghapus rispat
  async deleteRispat(rispatId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rispat-simple.php?id=${rispatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting rispat:', error);
      return false;
    }
  }

  // Mendapatkan URL untuk menampilkan foto
  getRispatUrl(filePath: string): string {
    return `http://localhost:5174${filePath}`;
  }

  // Mendapatkan thumbnail URL
  getThumbnailUrl(filePath: string): string {
    // Untuk sementara, gunakan URL yang sama
    // Nanti bisa diubah untuk menggunakan thumbnail yang sudah dibuat
    return `http://localhost:5174${filePath}`;
  }

  // Format tanggal
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Mendapatkan icon berdasarkan ekstensi file
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg': return '📷';
      case 'png': return '🖼️';
      case 'gif': return '🎞️';
      case 'bmp': return '🖼️';
      case 'webp': return '🌐';
      default: return '📸';
    }
  }

  // Validasi file foto
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (file.size > maxSize) {
      return { valid: false, error: 'Ukuran file terlalu besar. Maksimal 10MB.' };
    }

    // Check file type and extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = allowedTypes.includes(file.type) || 
                       (extension && allowedExtensions.includes(extension));

    if (!isValidType) {
      return { 
        valid: false, 
        error: `Tipe file tidak didukung. Detected: ${file.type}. Hanya JPG, PNG, GIF, dan WebP yang diizinkan.` 
      };
    }

    return { valid: true };
  }

  // Mendapatkan metadata foto dari file
  async getImageMetadata(file: File): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type,
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Gagal membaca metadata foto'));
      };
      
      img.src = url;
    });
  }

  // Format ukuran file
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const rispatService = new RispatService();
export default rispatService;
