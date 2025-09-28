// Import API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? (process.env.VITE_PROD_API_URL || `${(typeof window !== 'undefined' ? window.location.origin : '')}/api`)
    : '/api'; // Use relative path for development (Vite proxy will handle it)

export interface RispatFile {
  id: number;
  booking_id: number;
  file_name: string;
  original_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  id?: number;
}

export interface RispatListResponse {
  success: boolean;
  data: RispatFile[];
  message?: string;
}

class RispatService {
  // Ambil semua risalah rapat berdasarkan booking ID
  async getRispatByBookingId(bookingId: number): Promise<RispatFile[]> {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}/rispat.php?booking_id=${bookingId}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('🔍 RispatService - Raw response text:', text);
      
      let data: RispatListResponse;
      
      try {
        data = JSON.parse(text);
        console.log('🔍 RispatService - Parsed data:', data);
      } catch (parseError) {
        console.error('❌ RispatService - Invalid JSON response:', text);
        throw new Error('Server mengembalikan response yang tidak valid. Pastikan API berjalan dengan benar.');
      }
      
      if (data.success) {
        console.log('🔍 RispatService - Success response, data:', data.data);
        return data.data || [];
      } else {
        console.error('❌ RispatService - Error response:', data.message);
        throw new Error(data.message || 'Gagal mengambil data risalah rapat');
      }
    } catch (error) {
      console.error('Error fetching rispat:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Silakan coba lagi.');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Tidak dapat terhubung ke server. Pastikan server berjalan dan koneksi internet stabil.');
        }
      }
      
      throw error;
    }
  }

  // Upload file risalah rapat
  async uploadRispat(bookingId: number, file: File, uploadedBy: string): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('booking_id', bookingId.toString());
      formData.append('uploaded_by', uploadedBy);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for upload

      const response = await fetch(`${API_BASE_URL}/rispat.php`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      let data: UploadResponse;
      
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Invalid JSON response:', text);
        throw new Error('Server mengembalikan response yang tidak valid. Pastikan API berjalan dengan benar.');
      }
      
      return data;
    } catch (error) {
      console.error('Error uploading rispat:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout. Silakan coba lagi.');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Tidak dapat terhubung ke server. Pastikan server berjalan dan koneksi internet stabil.');
        }
      }
      
      throw error;
    }
  }

  // Hapus risalah rapat
  async deleteRispat(id: number): Promise<UploadResponse> {
    try {
      console.log('Deleting rispat with ID:', id);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}/rispat.php?id=${id}`, {
        method: 'DELETE',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      console.log('Delete response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log('Delete response text:', text);
      
      let data: UploadResponse;
      
      try {
        data = JSON.parse(text);
        console.log('Delete parsed data:', data);
      } catch (parseError) {
        console.error('Invalid JSON response:', text);
        throw new Error('Server mengembalikan response yang tidak valid. Pastikan API berjalan dengan benar.');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting rispat:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Silakan coba lagi.');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Tidak dapat terhubung ke server. Pastikan server berjalan dan koneksi internet stabil.');
        }
      }
      
      throw error;
    }
  }

  // Download file risalah rapat
  getDownloadUrl(fileId: number): string {
    const downloadUrl = `${API_BASE_URL}/download_rispat.php?id=${fileId}`;
    console.log('Download URL constructed:', downloadUrl);
    return downloadUrl;
  }

  // Format ukuran file
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Get file icon berdasarkan tipe
  getFileIcon(fileType: string): string {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png')) return '🖼️';
    return '📎';
  }

  // Validasi tipe file
  validateFileType(file: File): boolean {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
    return allowedTypes.includes(file.type);
  }

  // Validasi ukuran file (max 10MB)
  validateFileSize(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  }
}

export default new RispatService();


