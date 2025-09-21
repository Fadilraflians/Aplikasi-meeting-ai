/**
 * Room Database Service
 * Menghubungkan AI Assistant ke database ruangan untuk cek ketersediaan dan rekomendasi
 */

export interface Room {
  id: number;
  room_name: string;
  room_number?: string;
  capacity: number;
  floor?: string;
  building?: string;
  description?: string;
  features?: string;
  image_url?: string;
  is_available: boolean;
  is_maintenance: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoomAvailability {
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
  available: boolean;
  conflicting_bookings: number;
}

export interface RoomRecommendation {
  room: Room;
  score: number;
  reasons: string[];
  availability: RoomAvailability;
}

export interface SearchCriteria {
  capacity?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  facilities?: string[];
  floor?: string;
  building?: string;
}

class RoomDatabaseService {
  private baseUrl: string;

  constructor() {
    // Gunakan URL backend yang sesuai dengan struktur aplikasi
    this.baseUrl = 'http://127.0.0.1:8080/api';
  }

  /**
   * Ambil semua ruangan yang tersedia
   */
  async getAllRooms(): Promise<Room[]> {
    try {
      const response = await fetch(`${this.baseUrl}/meeting_rooms.php?action=get_all`);
      
      // Check if response is valid JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('API returned non-JSON response, using fallback data');
        return this.getFallbackRooms();
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data.map((room: any) => ({
          id: room.id,
          room_name: room.room_name || room.name,
          room_number: room.room_number,
          capacity: room.capacity,
          floor: room.floor || room.floor_number,
          building: room.building,
          description: room.description,
          features: room.features || room.amenities,
          image_url: room.image_url,
          is_available: room.is_available === 1 || room.is_available === true,
          is_maintenance: room.is_maintenance === 1 || room.is_maintenance === true,
          created_at: room.created_at,
          updated_at: room.updated_at
        }));
      }
      return this.getFallbackRooms();
    } catch (error) {
      console.error('Error fetching all rooms:', error);
      console.log('Using fallback room data');
      return this.getFallbackRooms();
    }
  }

  /**
   * Data ruangan fallback jika API tidak tersedia
   */
  private getFallbackRooms(): Room[] {
    return [
      {
        id: 1,
        room_name: 'Ruang Meeting A',
        room_number: 'RMA-001',
        capacity: 8,
        floor: '3',
        building: 'Gedung Utama',
        description: 'Ruang meeting kecil untuk rapat tim',
        features: 'Proyektor, Whiteboard, Wi-Fi',
        is_available: true,
        is_maintenance: false
      },
      {
        id: 2,
        room_name: 'Ruang Konferensi Bintang',
        room_number: 'RKB-002',
        capacity: 12,
        floor: '5',
        building: 'Gedung Utama',
        description: 'Ruang konferensi dengan fasilitas lengkap',
        features: 'Proyektor, Sound System, Video Conference',
        is_available: true,
        is_maintenance: false
      },
      {
        id: 3,
        room_name: 'Auditorium Utama',
        room_number: 'AU-003',
        capacity: 50,
        floor: '1',
        building: 'Gedung Utama',
        description: 'Auditorium besar untuk presentasi dan seminar',
        features: 'Panggung, Sound System, Layar Besar',
        is_available: true,
        is_maintenance: false
      },
      {
        id: 4,
        room_name: 'Ruang Kolaborasi Alpha',
        room_number: 'RKA-004',
        capacity: 6,
        floor: '2',
        building: 'Gedung Utama',
        description: 'Ruang kolaborasi dengan meja fleksibel',
        features: 'Whiteboard Besar, TV Smart, Meja Fleksibel',
        is_available: true,
        is_maintenance: false
      },
      {
        id: 5,
        room_name: 'Ruang Meeting Executive',
        room_number: 'RME-005',
        capacity: 15,
        floor: '4',
        building: 'Gedung Utama',
        description: 'Ruang meeting executive dengan fasilitas premium',
        features: 'Proyektor 4K, Sound System Premium, Video Conference HD',
        is_available: true,
        is_maintenance: false
      }
    ];
  }

  /**
   * Cek ketersediaan ruangan untuk waktu tertentu
   */
  async checkRoomAvailability(
    roomId: number, 
    date: string, 
    startTime: string, 
    endTime: string
  ): Promise<RoomAvailability> {
    try {
      const response = await fetch(
        `${this.baseUrl}/meeting_rooms.php?action=get_available&start_time=${startTime}&end_time=${endTime}`
      );
      const result = await response.json();
      
      if (result.success) {
        const isAvailable = result.data.some((room: any) => room.id === roomId);
        return {
          room_id: roomId,
          date,
          start_time: startTime,
          end_time: endTime,
          available: isAvailable,
          conflicting_bookings: isAvailable ? 0 : 1
        };
      }
      
      return {
        room_id: roomId,
        date,
        start_time: startTime,
        end_time: endTime,
        available: false,
        conflicting_bookings: 1
      };
    } catch (error) {
      console.error('Error checking room availability:', error);
      return {
        room_id: roomId,
        date,
        start_time: startTime,
        end_time: endTime,
        available: false,
        conflicting_bookings: 1
      };
    }
  }

  /**
   * Cari ruangan berdasarkan kriteria
   */
  async searchRooms(criteria: SearchCriteria): Promise<Room[]> {
    try {
      const params = new URLSearchParams();
      
      if (criteria.capacity) {
        params.append('capacity_min', criteria.capacity.toString());
      }
      if (criteria.facilities && criteria.facilities.length > 0) {
        params.append('facilities', criteria.facilities.join(','));
      }
      if (criteria.floor) {
        params.append('floor', criteria.floor);
      }
      if (criteria.building) {
        params.append('building', criteria.building);
      }
      
      const response = await fetch(
        `${this.baseUrl}/meeting_rooms.php?action=search&${params.toString()}`
      );
      const result = await response.json();
      
      if (result.success) {
        return result.data.map((room: any) => ({
          id: room.id,
          room_name: room.room_name || room.name,
          room_number: room.room_number,
          capacity: room.capacity,
          floor: room.floor || room.floor_number,
          building: room.building,
          description: room.description,
          features: room.features || room.amenities,
          image_url: room.image_url,
          is_available: room.is_available === 1 || room.is_available === true,
          is_maintenance: room.is_maintenance === 1 || room.is_maintenance === true,
          created_at: room.created_at,
          updated_at: room.updated_at
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching rooms:', error);
      return [];
    }
  }

  /**
   * Dapatkan rekomendasi ruangan berdasarkan kebutuhan
   */
  async getRoomRecommendations(
    participants: number,
    date: string,
    startTime: string,
    endTime: string,
    facilities?: string[]
  ): Promise<RoomRecommendation[]> {
    try {
      // Ambil semua ruangan
      const allRooms = await this.getAllRooms();
      
      // Filter ruangan yang sesuai kapasitas
      const suitableRooms = allRooms.filter(room => 
        room.capacity >= participants && 
        room.is_available && 
        !room.is_maintenance
      );

      const recommendations: RoomRecommendation[] = [];

      for (const room of suitableRooms) {
        // Cek ketersediaan
        const availability = await this.checkRoomAvailability(
          room.id, 
          date, 
          startTime, 
          endTime
        );

        if (availability.available) {
          // Hitung skor rekomendasi
          let score = 0;
          const reasons: string[] = [];

          // Skor berdasarkan kapasitas (lebih dekat dengan kebutuhan = lebih tinggi)
          const capacityRatio = participants / room.capacity;
          if (capacityRatio >= 0.8 && capacityRatio <= 1.0) {
            score += 30;
            reasons.push('Kapasitas pas untuk jumlah peserta');
          } else if (capacityRatio >= 0.6) {
            score += 20;
            reasons.push('Kapasitas cukup untuk jumlah peserta');
          } else {
            score += 10;
            reasons.push('Kapasitas lebih dari cukup');
          }

          // Skor berdasarkan fasilitas
          if (facilities && facilities.length > 0) {
            const roomFeatures = room.features ? JSON.parse(room.features) : [];
            const matchedFacilities = facilities.filter(facility => 
              roomFeatures.some((feature: string) => 
                feature.toLowerCase().includes(facility.toLowerCase())
              )
            );
            
            if (matchedFacilities.length === facilities.length) {
              score += 25;
              reasons.push('Memiliki semua fasilitas yang dibutuhkan');
            } else if (matchedFacilities.length > 0) {
              score += 15;
              reasons.push(`Memiliki ${matchedFacilities.length} dari ${facilities.length} fasilitas yang dibutuhkan`);
            }
          }

          // Skor berdasarkan lokasi (lantai yang sama)
          if (room.floor) {
            score += 5;
            reasons.push(`Terletak di lantai ${room.floor}`);
          }

          // Skor berdasarkan ketersediaan
          score += 20;
          reasons.push('Tersedia pada waktu yang diminta');

          recommendations.push({
            room,
            score,
            reasons,
            availability
          });
        }
      }

      // Urutkan berdasarkan skor tertinggi
      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting room recommendations:', error);
      return [];
    }
  }

  /**
   * Dapatkan ruangan berdasarkan ID
   */
  async getRoomById(roomId: number): Promise<Room | null> {
    try {
      const response = await fetch(`${this.baseUrl}/meeting_rooms.php?action=get_by_id&room_id=${roomId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const room = result.data;
        return {
          id: room.id,
          room_name: room.room_name || room.name,
          room_number: room.room_number,
          capacity: room.capacity,
          floor: room.floor || room.floor_number,
          building: room.building,
          description: room.description,
          features: room.features || room.amenities,
          image_url: room.image_url,
          is_available: room.is_available === 1 || room.is_available === true,
          is_maintenance: room.is_maintenance === 1 || room.is_maintenance === true,
          created_at: room.created_at,
          updated_at: room.updated_at
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching room by ID:', error);
      return null;
    }
  }

  /**
   * Dapatkan statistik penggunaan ruangan
   */
  async getRoomStatistics(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/meeting_rooms.php?action=get_statistics`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching room statistics:', error);
      return [];
    }
  }

  /**
   * Format waktu untuk database
   */
  formatTimeForDatabase(time: string): string {
    // Konversi format waktu ke format yang sesuai database
    if (time.includes(':')) {
      return time;
    }
    // Jika format lain, konversi sesuai kebutuhan
    return time;
  }

  /**
   * Format tanggal untuk database
   */
  formatDateForDatabase(date: string): string {
    // Pastikan format tanggal sesuai dengan database (YYYY-MM-DD)
    if (date.includes('-')) {
      return date;
    }
    // Konversi format lain jika diperlukan
    return date;
  }
}

export default RoomDatabaseService;



