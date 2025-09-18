export enum Page {
  Login,
  Register,
  Dashboard,
  MeetingRooms,
  RoomDetail,
  EditRoom,
  AddRoom,
  Booking,
  RBA,
  BookingConfirmation,
  Reservations,
  ReservationDetail,
  History,
  Rispat,
  Profile,
  Settings,
  HelpCenter,
}

export interface MeetingRoom {
  id: number;
  name: string;
  floor: string;
  capacity: number;
  address: string;
  facilities: string[];
  image: string;
  available?: boolean; // Status ketersediaan
  isActive?: boolean; // Status aktif/nonaktif ruangan
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  quickActions?: QuickAction[];
}

export interface QuickAction {
  label: string;
  icon?: any; // Made optional and used any type to avoid React dependency
  action: () => void;
}

export interface Booking {
  id: string | number;
  roomName: string;
  roomId: number;
  topic: string;
  date: string;
  time: string;
  endTime?: string; // Waktu selesai (opsional)
  participants: number;
  pic: string;
  meetingType: 'internal' | 'external';
  facilities: string[]; // Fasilitas yang diminta (required)
  imageUrl?: string;
  // Field baru untuk RBA yang lebih cerdas
  urgency?: 'high' | 'normal' | 'low'; // Tingkat urgensi
  duration?: number; // Durasi dalam jam
  notes?: string; // Catatan tambahan
  roomNotFound?: boolean; // Flag untuk ruangan yang tidak ditemukan di database
  isConfirmation?: boolean; // Flag untuk konfirmasi user
}

export enum BookingState {
  IDLE,
  ASKING_ROOM,
  ASKING_TOPIC,
  ASKING_PIC,
  ASKING_PARTICIPANTS,
  ASKING_DATE,
  ASKING_TIME,
  ASKING_MEETING_TYPE,
  ASKING_FOOD_TYPE,
  CONFIRMING,
  BOOKED,
  // New states for modifying existing data
  MODIFYING_ROOM,
  MODIFYING_TOPIC,
  MODIFYING_PIC,
  MODIFYING_PARTICIPANTS,
  MODIFYING_DATE,
  MODIFYING_TIME,
  MODIFYING_MEETING_TYPE,
  MODIFYING_FOOD_TYPE,
  // One-shot booking form
  ONE_SHOT_FORM,
}

export interface User {
  fullName?: string;
  email?: string;
  role?: string;
  avatar?: string;
}
