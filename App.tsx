
import React, { useState, useEffect } from 'react';
import { Page, type MeetingRoom, type Booking, type User } from './types';
import { BackendService } from './src/services/backendService';
import { ApiService } from './src/config/api';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MeetingRoomsPage from './pages/MeetingRoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import EditRoomPage from './pages/EditRoomPage';
import AddRoomPage from './pages/AddRoomPage';
import BookingFormPage from './pages/BookingFormPage';
import RBAPage from './pages/RBAPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import ReservationsPage from './pages/ReservationsPage';
import ReservationDetailPage from './pages/ReservationDetailPage';
import HistoryPage from './pages/HistoryPage';
import RispatPage from './pages/RispatPage';
import { addHistory } from './services/historyService';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HelpCenterPage from './pages/HelpCenter';
import CancelRequestsPage from './pages/CancelRequestsPage';
import MainLayout from './components/MainLayout';
import { LanguageProvider } from './contexts/LanguageContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { NotificationProvider } from './contexts/NotificationContext';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentPage, setCurrentPage] = useState<Page>(Page.Login);
    const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
    const [currentBookingData, setCurrentBookingData] = useState<Partial<Booking>>({});
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
    const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // Mock user data
    const [user, setUser] = useState<User>({
        fullName: 'Eaan Arviant',
        email: 'user@example.com',
        role: 'User',
        avatar: undefined,
    });

    // Check session on app load
    useEffect(() => {
        const checkSession = async () => {
            try {
                const sessionToken = localStorage.getItem('session_token');
                const userDataStr = localStorage.getItem('user_data');
                const savedPage = localStorage.getItem('current_page');
                
                console.log('Session check - Token:', sessionToken ? 'Present' : 'Missing');
                console.log('Session check - User data:', userDataStr ? 'Present' : 'Missing');
                console.log('Session check - Saved page:', savedPage);
                
                if (sessionToken && userDataStr) {
                    // Validate session token
                    console.log('Validating session token...');
                    const userId = await ApiService.getUserBySessionToken(sessionToken);
                    console.log('Session validation result:', userId ? 'Valid' : 'Invalid');
                    
                    if (userId) {
                        // Session is valid, restore user data
                        const userData = JSON.parse(userDataStr);
                        console.log('Restoring user data for ID:', userData.id);
                        
                        setUser({
                            fullName: userData.full_name || userData.username || 'User',
                            email: userData.email || 'user@example.com',
                            role: userData.role || 'User',
                            avatar: userData.avatar,
                        });
                        // Ensure user_data has the id field
                        if (!userData.id) {
                            // Don't set default ID for new users - let them have empty dashboard
                            console.log('New user detected - will show empty dashboard');
                        }
                        setIsAuthenticated(true);
                        
                        // Restore the last visited page or default to Dashboard
                        const pageToRestore = savedPage && Object.values(Page).includes(savedPage as unknown as Page) 
                            ? (savedPage as unknown as Page)
                            : Page.Dashboard;
                        console.log('Restoring page:', pageToRestore);
                        setCurrentPage(pageToRestore);
                        
                        // Load bookings from server
                        if (userData.id) {
                            await loadBookingsFromServer(userData.id);
                        }
                    } else {
                        // Session is invalid, clear storage
                        console.log('Session invalid, clearing storage');
                        localStorage.removeItem('session_token');
                        localStorage.removeItem('user_data');
                        localStorage.removeItem('current_page');
                    }
                } else {
                    console.log('No session token or user data found');
                }
            } catch (error) {
                console.error('Error checking session:', error);
                // Clear invalid session data
                localStorage.removeItem('session_token');
                localStorage.removeItem('user_data');
                localStorage.removeItem('current_page');
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    // Listen for refreshBookings event
    useEffect(() => {
        const handleRefreshBookings = async () => {
            console.log('RefreshBookings event received, reloading bookings...');
            if (user.id) {
                await loadBookingsFromServer(user.id);
            }
        };

        window.addEventListener('refreshBookings', handleRefreshBookings);
        
        return () => {
            window.removeEventListener('refreshBookings', handleRefreshBookings);
        };
    }, [user.id]);

    // Load bookings from server
    const loadBookingsFromServer = async (userId: number) => {
        try {
            let serverBookings = [];
            let aiBookings = [];
            
            // Check if current user is admin
            const userDataStr = localStorage.getItem('user_data');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const isAdmin = userData?.role === 'admin';
            
            console.log('🔍 App.tsx - Loading bookings for user ID:', userId, 'Role:', userData?.role, 'Is Admin:', isAdmin);
            
            // Get server bookings (all users can see all server bookings)
            const serverBookingsRes = await ApiService.getAllBookings();
            serverBookings = serverBookingsRes.data || [];
            
            // Get AI bookings (all users can see all AI bookings)
            const aiBookingsRes = await ApiService.getAllAIBookings();
            aiBookings = aiBookingsRes.data || [];
            
            console.log('🔍 App.tsx - AI Bookings API Response:', aiBookingsRes);
            console.log('🔍 App.tsx - Raw AI bookings:', aiBookings);
            console.log('🔍 App.tsx - AI bookings count:', aiBookings.length);
            console.log('🔍 App.tsx - AI bookings success:', aiBookingsRes.success);
            console.log('🔍 App.tsx - AI bookings message:', aiBookingsRes.message);
            
            // Debug: Show AI bookings with BOOKED status
            const bookedAIBookings = aiBookings.filter((b: any) => b.booking_state === 'BOOKED');
            console.log('🔍 App.tsx - AI bookings with BOOKED status:', bookedAIBookings.length);
            console.log('🔍 App.tsx - Sample BOOKED AI booking:', bookedAIBookings[0]);
            
            // Format server bookings
            const serverBookingsFormatted: Booking[] = serverBookings.map((b: any): Booking => {
                console.log('🔍 App.tsx - Raw server booking facilities:', b.facilities, 'Type:', typeof b.facilities);
                console.log('🔍 App.tsx - Raw server booking requires_rispat:', b.requires_rispat, 'Type:', typeof b.requires_rispat);
                console.log('🔍 App.tsx - Raw server booking image_url:', b.image_url, 'Type:', typeof b.image_url);
                
                const formattedFacilities = (() => {
                    if (b.facilities && Array.isArray(b.facilities)) {
                        return b.facilities;
                    } else if (b.facilities && typeof b.facilities === 'string') {
                        try {
                            const parsed = JSON.parse(b.facilities);
                            if (Array.isArray(parsed)) {
                                return parsed;
                            }
                        } catch (e) {
                            // If not JSON, split by comma
                            return b.facilities.split(',').map((s: string) => s.trim()).filter(Boolean);
                        }
                    }
                    return [];
                })();
                
                console.log('🔍 App.tsx - Formatted server booking facilities:', formattedFacilities);
                
                return {
                    id: b.id,
                    roomId: b.room_id || 0,
                    roomName: b.room_name || `Room ${b.room_id}` || '—',
                    imageUrl: b.image_url || null, // Add image_url for room image display
                    topic: b.topic,
                    date: b.meeting_date,
                    time: b.meeting_time,
                    endTime: b.end_time ? b.end_time.slice(0, 5) : null, // Format HH:MM
                    participants: Number(b.participants || 0),
                    pic: (b.pic && String(b.pic).trim()) ? b.pic : '-',
                    meetingType: (b.meeting_type === 'external' ? 'external' : 'internal'),
                    facilities: formattedFacilities,
                    requiresRispat: Boolean(b.requires_rispat), // Add requiresRispat field
                    userName: b.user_name || b.username || 'Unknown User', // Add user info for admin view
                    status: b.status || 'active', // Add status field for filtering
                    booking_state: b.booking_state || 'BOOKED', // Add booking_state field for filtering
                };
            });

            // Format AI bookings
            const aiBookingsFormatted: Booking[] = aiBookings.map((b: any): Booking => {
                console.log('🔍 App.tsx - Processing AI booking:', {
                    id: b.id,
                    image_url: b.image_url,
                    user_id: b.user_id,
                    room_id: b.room_id,
                    room_name: b.room_name,
                    topic: b.topic,
                    booking_state: b.booking_state,
                    meeting_date: b.meeting_date,
                    meeting_time: b.meeting_time,
                    participants: b.participants,
                    pic: b.pic
                });
                
                // Validate required fields
                if (!b.id || !b.topic || !b.meeting_date || !b.meeting_time) {
                    console.warn('🔍 App.tsx - AI booking missing required fields:', b);
                }
                console.log('🔍 App.tsx - Raw AI booking facilities:', b.facilities, 'Type:', typeof b.facilities);
                console.log('🔍 App.tsx - Raw AI booking requires_rispat:', b.requires_rispat, 'Type:', typeof b.requires_rispat);
                
                const formattedFacilities = (() => {
                    if (b.facilities && Array.isArray(b.facilities)) {
                        return b.facilities;
                    } else if (b.facilities && typeof b.facilities === 'string') {
                        try {
                            const parsed = JSON.parse(b.facilities);
                            if (Array.isArray(parsed)) {
                                return parsed;
                            }
                        } catch (e) {
                            // If not JSON, split by comma
                            return b.facilities.split(',').map((s: string) => s.trim()).filter(Boolean);
                        }
                    }
                    return [];
                })();
                
                console.log('🔍 App.tsx - Formatted AI booking facilities:', formattedFacilities);
                
                const formattedBooking = {
                    id: `ai_${b.id}`, // Prefix dengan 'ai_' untuk membedakan dari form bookings
                    roomId: b.room_id || 0,
                    roomName: b.room_name || (b.room_id ? `Room ${b.room_id}` : 'Ruangan Tidak Diketahui'),
                    imageUrl: b.image_url || null, // Add image_url for room image display
                    topic: b.topic,
                    date: b.meeting_date,
                    time: b.meeting_time,
                    endTime: b.end_time ? b.end_time.slice(0, 5) : null, // Use database end_time if available, don't calculate
                    duration: b.duration || 60, // Durasi dalam menit, default 60 menit
                    participants: Number(b.participants || 0),
                    pic: (b.pic && String(b.pic).trim()) ? b.pic : '-',
                    meetingType: (b.meeting_type === 'external' ? 'external' : 'internal') as 'internal' | 'external',
                    facilities: formattedFacilities,
                    requiresRispat: Boolean(b.requires_rispat), // Add requiresRispat field
                    status: 'BOOKED', // Always set to BOOKED for AI bookings
                    booking_state: 'BOOKED', // Always set to BOOKED for AI bookings
                    source: 'ai', // Menandai bahwa ini adalah AI booking
                    userName: b.user_name || b.username || 'Unknown User', // Add user info for admin view
                    userId: b.user_id, // Add user_id for admin view
                };
                
                console.log('🔍 App.tsx - Formatted AI booking:', formattedBooking);
                return formattedBooking;
            });
            
            console.log('🔍 App.tsx - Formatted AI bookings:', aiBookingsFormatted);
            console.log('🔍 App.tsx - Formatted server bookings:', serverBookingsFormatted);
            
            // Debug: Check AI bookings with BOOKED status specifically
            const bookedAIBookingsFormatted = aiBookingsFormatted.filter(b => b.status === 'BOOKED' && b.booking_state === 'BOOKED');
            console.log('🔍 App.tsx - BOOKED AI bookings formatted:', bookedAIBookingsFormatted.length);
            console.log('🔍 App.tsx - Sample BOOKED AI booking formatted:', bookedAIBookingsFormatted[0]);
            
            // Debug: Check if AI bookings have required fields
            aiBookingsFormatted.forEach((booking, index) => {
                console.log(`🔍 App.tsx - AI booking ${index}:`, {
                    id: booking.id,
                    topic: booking.topic,
                    date: booking.date,
                    time: booking.time,
                    roomName: booking.roomName,
                    pic: booking.pic,
                    source: booking.source,
                    status: booking.status,
                    booking_state: booking.booking_state
                });
                
                // Special check for booking ID 145 (meeting vendors)
                if (booking.id === 'ai_145' || booking.topic === 'meeting vendors') {
                    console.log('🎯 App.tsx - FOUND TARGET AI BOOKING (meeting vendors):', booking);
                }
            });

            // Gabungkan AI bookings dan server bookings dengan deduplication
            const allBookings = [...aiBookingsFormatted, ...serverBookingsFormatted];
            
            console.log('🔍 App.tsx - All bookings before deduplication:', allBookings.length);
            console.log('🔍 App.tsx - AI bookings count:', aiBookingsFormatted.length);
            console.log('🔍 App.tsx - Server bookings count:', serverBookingsFormatted.length);
            
            // Deduplicate by ID first
            const uniqueByIdBookings = allBookings.filter((booking, index, self) => 
                index === self.findIndex(b => String(b.id) === String(booking.id))
            );
            
            console.log('🔍 App.tsx - After ID deduplication:', uniqueByIdBookings.length);
            console.log('🔍 App.tsx - ID duplicates removed:', allBookings.length - uniqueByIdBookings.length);
            
            // Additional deduplication by content (topic, date, time, room, pic)
            // But preserve AI bookings even if they have similar content to regular bookings
            const uniqueBookings = uniqueByIdBookings.filter((booking, index, self) => {
                // Always keep AI bookings
                if (booking.source === 'ai') {
                    console.log('🔍 App.tsx - Keeping AI booking:', booking.topic, 'ID:', booking.id);
                    
                    // Special tracking for target booking
                    if (booking.id === 'ai_145' || booking.topic === 'meeting vendors') {
                        console.log('🎯 App.tsx - TARGET AI BOOKING PASSED DEDUPLICATION:', booking);
                    }
                    
                    return true;
                }
                
                // For regular bookings, check for duplicates
                const isDuplicate = index !== self.findIndex(b => 
                    b.topic === booking.topic && 
                    b.date === booking.date && 
                    b.time === booking.time && 
                    b.roomName === booking.roomName && 
                    b.pic === booking.pic &&
                    b.source === booking.source // Also check source to avoid mixing AI and regular bookings
                );
                
                if (isDuplicate) {
                    console.log('🔍 App.tsx - Filtering out duplicate regular booking:', booking.topic, 'ID:', booking.id);
                }
                
                return !isDuplicate;
            });
            
            console.log('🔍 App.tsx - After content deduplication:', uniqueBookings.length);
            console.log('🔍 App.tsx - Content duplicates removed:', uniqueByIdBookings.length - uniqueBookings.length);
            
            // Filter out completed and cancelled bookings (they should only appear in History/Rispat pages)
            const activeBookings = uniqueBookings.filter(booking => {
                // Show all bookings except cancelled ones
                const isCancelled = booking.status === 'cancelled' || booking.booking_state === 'CANCELLED';
                
                // Show all bookings (active, completed, booked) except cancelled
                const isActive = booking.status === 'active' || booking.status === 'booked' || booking.status === 'completed' || !booking.status;
                const isBooked = booking.booking_state === 'BOOKED' || booking.booking_state === 'COMPLETED' || !booking.booking_state;
                
                // For AI bookings, be more lenient with status checking
                if (booking.source === 'ai') {
                    // AI bookings should be shown if they are not cancelled
                    const isAICancelled = booking.status === 'cancelled' || booking.booking_state === 'CANCELLED';
                    
                    console.log('🔍 App.tsx - Checking AI booking:', {
                        id: booking.id,
                        topic: booking.topic,
                        status: booking.status,
                        booking_state: booking.booking_state,
                        isAICancelled,
                        source: booking.source,
                        date: booking.date,
                        time: booking.time
                    });
                    
                    if (isAICancelled) {
                        console.log('🔍 App.tsx - Filtering out cancelled AI booking:', booking.topic, 'ID:', booking.id);
                        return false;
                    }
                    
                    // Show AI booking if it's not cancelled
                    console.log('🔍 App.tsx - AI booking passed filtering:', booking.topic, 'ID:', booking.id);
                    
                    // Special tracking for target booking
                    if (booking.id === 'ai_145' || booking.topic === 'meeting vendors') {
                        console.log('🎯 App.tsx - TARGET AI BOOKING PASSED STATUS FILTERING:', booking);
                    }
                    
                    return true;
                }
                
                console.log('🔍 App.tsx - Checking regular booking:', {
                    id: booking.id,
                    topic: booking.topic,
                    status: booking.status,
                    booking_state: booking.booking_state,
                    isCancelled,
                    isActive,
                    isBooked,
                    source: booking.source || 'unknown'
                });
                
                if (isCancelled) {
                    console.log('🔍 App.tsx - Filtering out cancelled booking:', booking.topic, 'ID:', booking.id);
                    return false;
                }
                
                // Show all bookings (active, completed, booked) except cancelled
                if (!isActive && !isBooked) {
                    console.log('🔍 App.tsx - Filtering out inactive booking:', booking.topic, 'ID:', booking.id, 'Status:', booking.status);
                    return false;
                }
                
                return true;
            });
            
            console.log('🔍 App.tsx - After status filtering:', activeBookings.length);
            console.log('🔍 App.tsx - Status filtered out:', uniqueBookings.length - activeBookings.length);
            
            console.log('🔍 App.tsx - Setting bookings:', activeBookings);
            console.log('🔍 App.tsx - Total bookings count:', activeBookings.length);
            console.log('🔍 App.tsx - AI bookings count:', aiBookingsFormatted.length);
            console.log('🔍 App.tsx - Server bookings count:', serverBookingsFormatted.length);
            console.log('🔍 App.tsx - AI bookings after formatting:', aiBookingsFormatted);
            console.log('🔍 App.tsx - Server bookings after formatting:', serverBookingsFormatted);
            console.log('🔍 App.tsx - All bookings before filtering:', uniqueBookings);
            console.log('🔍 App.tsx - Active bookings after filtering:', activeBookings);
            console.log('🔍 App.tsx - After ID deduplication:', uniqueByIdBookings.length);
            console.log('🔍 App.tsx - After content deduplication:', uniqueBookings.length);
            console.log('🔍 App.tsx - After status filtering:', activeBookings.length);
            console.log('🔍 App.tsx - Total duplicates removed:', allBookings.length - uniqueBookings.length);
            console.log('🔍 App.tsx - Sample booking:', activeBookings[0]);
            
            // Debug: Check if any AI bookings made it to the final list
            const aiBookingsInFinal = activeBookings.filter(b => b.source === 'ai');
            console.log('🔍 App.tsx - AI bookings in final list:', aiBookingsInFinal.length);
            console.log('🔍 App.tsx - AI bookings in final list:', aiBookingsInFinal);
            
            // Special check for target booking in final result
            const targetBooking = activeBookings.find(b => b.id === 'ai_145' || b.topic === 'meeting vendors');
            if (targetBooking) {
                console.log('🎯 App.tsx - TARGET AI BOOKING FOUND IN FINAL RESULT:', targetBooking);
            } else {
                console.log('❌ App.tsx - TARGET AI BOOKING NOT FOUND IN FINAL RESULT!');
                console.log('🔍 App.tsx - All active booking IDs:', activeBookings.map(b => b.id));
                console.log('🔍 App.tsx - All active booking topics:', activeBookings.map(b => b.topic));
                
                // Check localStorage history for potential issues
                const history = JSON.parse(localStorage.getItem('booking_history') || '[]');
                const historyBooking145 = history.find((h: any) => String(h.id) === '145');
                if (historyBooking145) {
                    console.log('⚠️ App.tsx - AI Booking 145 found in localStorage history:', historyBooking145);
                    console.log('⚠️ App.tsx - This might be causing filtering issues!');
                }
            }
            
            // Check for expired bookings and move them to history
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
            
            const expiredBookings = activeBookings.filter(booking => {
                // Check if booking is today and time has passed
                if (booking.date === currentDate) {
                    const endTime = booking.endTime || booking.time;
                    return currentTime > endTime;
                }
                // Check if booking date has passed
                return booking.date < currentDate;
            });
            
            if (expiredBookings.length > 0) {
                console.log(`🔍 App.tsx - Found ${expiredBookings.length} expired bookings, moving to history`);
                
                // Call auto-complete API to update database status
                try {
                    console.log('🔍 App.tsx - Calling auto-complete API for expired bookings...');
                    const response = await ApiService.autoCompleteExpiredBookings();
                    if (response.status === 'success') {
                        console.log('✅ App.tsx - Auto-completed expired bookings in database:', response.message);
                    } else {
                        console.error('❌ App.tsx - Failed to auto-complete bookings:', response.message);
                    }
                } catch (error) {
                    console.error('❌ App.tsx - Error calling auto-complete API:', error);
                }
                
                expiredBookings.forEach(booking => {
                    console.log('🔍 Moving expired booking to history:', booking);
                    addHistory({
                        id: booking.id,
                        topic: booking.topic,
                        date: booking.date,
                        time: booking.time,
                        endTime: booking.endTime,
                        roomName: booking.roomName,
                        participants: booking.participants || 0,
                        pic: booking.pic || 'Unknown',
                        status: 'Selesai'
                    });
                });
                
                // Remove expired bookings from active bookings
                const nonExpiredBookings = activeBookings.filter(booking => 
                    !expiredBookings.some(expired => expired.id === booking.id)
                );
                setBookings(nonExpiredBookings);
            } else {
                setBookings(activeBookings);
            }
            
            // Force re-render of dashboard if it's currently active
            if (currentPage === Page.Dashboard) {
                console.log('🔍 App.tsx - Dashboard is active, forcing re-render');
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error loading bookings from server:', error);
        }
    };

    const handleLogin = (loggedInUser: User) => {
        setUser({
            fullName: loggedInUser.fullName || 'User',
            email: loggedInUser.email || 'user@example.com',
            role: loggedInUser.role || 'User',
            avatar: loggedInUser.avatar,
        });
        
        // Ensure user_data has the id field
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                if (!userData.id) {
                    // Don't set default ID for new users - let them have empty dashboard
                    console.log('New user detected - will show empty dashboard');
                }
            } catch (e) {
                // If parsing fails, don't create default user data
                console.log('Failed to parse user data - will show empty dashboard');
            }
        }
        
        setIsAuthenticated(true);
        setCurrentPage(Page.Dashboard);
        
        // Load bookings from server after login
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                if (userData.id) {
                    loadBookingsFromServer(userData.id);
                }
            } catch (e) {
                console.log('Failed to parse user data for loading bookings');
            }
        }
    };

    const handleLogout = () => {
        // Clear user data from localStorage
        localStorage.removeItem('user_data');
        localStorage.removeItem('session_token');
        localStorage.removeItem('current_page');
        
        // Reset app state
        setIsAuthenticated(false);
        setCurrentPage(Page.Login);
        setSelectedRoom(null);
        setBookings([]);
        setConfirmedBooking(null);
    };

    const navigateTo = (page: Page) => {
        // Check if user has permission to access admin pages
        if (isAdminPage(page) && user.role !== 'admin') {
            alert('Anda tidak memiliki akses ke halaman ini. Hanya admin yang dapat mengakses fitur ini.');
            return;
        }
        
        setCurrentPage(page);
        // Save current page to localStorage for session persistence
        localStorage.setItem('current_page', page.toString());
        
        // Refresh bookings when navigating to dashboard
        if (page === Page.Dashboard) {
            const userDataStr = localStorage.getItem('user_data');
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    if (userData.id) {
                        console.log('🔍 Refreshing bookings for dashboard...');
                        loadBookingsFromServer(userData.id);
                    }
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        }
        
        // Force re-render when navigating to dashboard
        if (page === Page.Dashboard) {
            console.log('🔍 Navigating to dashboard, forcing re-render');
            setRefreshTrigger(prev => prev + 1);
        }
    };

    // Helper function to check if page requires admin access
    const isAdminPage = (page: Page): boolean => {
        const adminPages = [Page.AddRoom, Page.EditRoom];
        return adminPages.includes(page);
    };

    // Helper function to check if user is admin
    const isAdmin = (): boolean => {
        return user.role === 'admin';
    };

    const handleBookRoom = (room: MeetingRoom, bookingData?: Partial<Booking>) => {
        setSelectedRoom(room);
        if (bookingData) {
            setCurrentBookingData(bookingData);
        }
        navigateTo(Page.Booking);
    };

    const handleRoomDetail = (room: MeetingRoom) => {
        setSelectedRoom(room);
        navigateTo(Page.RoomDetail);
    };

    const handleEditRoom = (room: MeetingRoom) => {
        if (!isAdmin()) {
            alert('Anda tidak memiliki akses untuk mengedit ruangan. Hanya admin yang dapat melakukan operasi ini.');
            return;
        }
        setSelectedRoom(room);
        navigateTo(Page.EditRoom);
    };

    const handleRoomUpdated = (updatedRoom: MeetingRoom) => {
        setSelectedRoom(updatedRoom);
        // Update rooms list if needed
        // This could trigger a refresh of the rooms list
    };

    const handleAddRoom = () => {
        if (!isAdmin()) {
            alert('Anda tidak memiliki akses untuk menambah ruangan. Hanya admin yang dapat melakukan operasi ini.');
            return;
        }
        navigateTo(Page.AddRoom);
    };

    const handleRoomAdded = (newRoom: MeetingRoom) => {
        // Room sudah disimpan ke database, tidak perlu update state lokal
        console.log('New room added:', newRoom);
    };

    const handleDeleteRoom = (roomId: number) => {
        if (!isAdmin()) {
            alert('Anda tidak memiliki akses untuk menghapus ruangan. Hanya admin yang dapat melakukan operasi ini.');
            return;
        }
        // Room sudah dihapus dari database, tidak perlu update state lokal
        console.log('Room deleted:', roomId);
        // Navigate back to meeting rooms page
        navigateTo(Page.MeetingRooms);
    };

    const handleUpdateRoomStatus = (roomId: number, isActive: boolean) => {
        if (!isAdmin()) {
            alert('Anda tidak memiliki akses untuk mengubah status ruangan. Hanya admin yang dapat melakukan operasi ini.');
            return;
        }
        // Room status sudah diupdate di database, tidak perlu update state lokal
        console.log('Room status updated:', roomId, isActive);
        // Navigate back to meeting rooms page
        navigateTo(Page.MeetingRooms);
    };

    const handleConfirmBooking = (newBooking: Booking) => {
        console.log('🔍 App.tsx - handleConfirmBooking received:', newBooking);
        console.log('🔍 App.tsx - booking details:', {
            roomName: newBooking.roomName,
            topic: newBooking.topic,
            pic: newBooking.pic,
            date: newBooking.date,
            time: newBooking.time,
            participants: newBooking.participants,
            meetingType: newBooking.meetingType
        });
        
        // Don't add to local state to prevent duplication
        // Data will be refreshed from server instead
        setConfirmedBooking(newBooking);
        setCurrentBookingData({});
        
        // Refresh bookings from server to get the latest data
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                if (userData.id) {
                    loadBookingsFromServer(userData.id);
                }
            } catch (e) {
                console.error('Error parsing user data for refresh:', e);
            }
        }
        
        // Trigger refresh for ReservationsPage
        setRefreshTrigger(prev => prev + 1);
        // Catatan: histori 'Selesai' tidak dibuat saat konfirmasi.
        // Status 'Selesai' hanya dihistori ketika user menekan tombol Selesai pada halaman Reservasi.
        navigateTo(Page.BookingConfirmation);
    };
    
    const handleAiBookingData = (bookingData: Partial<Booking>) => {
        setCurrentBookingData(bookingData);
    };

    const handleCancelBooking = async (id: number) => {
        try {
            // Check if this is an AI booking
            const isAiBooking = String(id).startsWith('ai_');
            
            console.log('Cancelling booking with ID:', id);
            
            if (isAiBooking) {
                // For AI bookings, call the AI cancel endpoint
                // Pass the full ID with 'ai_' prefix to maintain AI booking detection
                await BackendService.cancelBooking(String(id));
                console.log('AI booking cancelled from App via API:', id);
            } else {
                // For form bookings, call backend API
                await BackendService.cancelBooking(Number(id));
            }
            
            // Update booking status to cancelled instead of removing
            setBookings(prev => prev.map(b => 
                b.id === id 
                    ? { ...b, status: 'cancelled' }
                    : b
            ));
            
            // Refresh bookings from server to get updated data
            if (user.id) {
                console.log('🔄 Refreshing bookings after cancellation...');
                await loadBookingsFromServer(user.id);
                console.log('✅ Bookings refreshed after cancellation');
            }
            
            // Trigger refresh event for other components
            window.dispatchEvent(new CustomEvent('refreshBookings'));
            
            // Note: History will be added by ReservationsPage handleConfirmCancel
            // to avoid duplication
            
            // Show success message
            alert('Pemesanan berhasil dibatalkan!');
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Gagal membatalkan pemesanan. Mohon coba lagi.');
        }
    };

    const renderContent = () => {
        // Show loading while checking session
        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700">
                    <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p>Memuat aplikasi...</p>
                    </div>
                </div>
            );
        }

        if (!isAuthenticated) {
            switch (currentPage) {
                case Page.Register:
                    return <RegisterPage onNavigateToLogin={() => navigateTo(Page.Login)} />;
                default:
                    return <LoginPage onLogin={handleLogin} onNavigateToRegister={() => navigateTo(Page.Register)} />;
            }
        }
        
        const pageComponents: { [key in Page]?: React.ReactNode } = {
            [Page.Dashboard]: <DashboardPage onNavigate={navigateTo} bookings={bookings} user={user} key={refreshTrigger} />,
            [Page.MeetingRooms]: <MeetingRoomsPage onNavigate={navigateTo} onBookRoom={handleBookRoom} onRoomDetail={handleRoomDetail} onAddRoom={handleAddRoom} bookings={bookings} user={user} />,
            [Page.RoomDetail]: <RoomDetailPage onNavigate={navigateTo} onBookRoom={handleBookRoom} room={selectedRoom} bookings={bookings} onEditRoom={handleEditRoom} onDeleteRoom={handleDeleteRoom} onUpdateRoomStatus={handleUpdateRoomStatus} user={user} />,
            [Page.EditRoom]: <EditRoomPage onNavigate={navigateTo} room={selectedRoom} onRoomUpdated={handleRoomUpdated} />,
            [Page.AddRoom]: <AddRoomPage onNavigate={navigateTo} onRoomAdded={handleRoomAdded} />,
            [Page.Booking]: <BookingFormPage onNavigate={navigateTo} room={selectedRoom} onBookingConfirmed={handleConfirmBooking} bookingData={currentBookingData} />,
            [Page.RBA]: <RBAPage onNavigate={navigateTo} onBookingConfirmed={handleConfirmBooking} />,
            [Page.BookingConfirmation]: <BookingConfirmationPage onNavigate={navigateTo} booking={confirmedBooking} />,
            [Page.Reservations]: <ReservationsPage onNavigate={navigateTo} bookings={bookings} onCancelBooking={handleCancelBooking} onRemoveLocalBooking={(id:any)=> setBookings(prev=> prev.filter(b=> String(b.id) !== String(id)))} refreshTrigger={refreshTrigger} />, 
            [Page.ReservationDetail]: <ReservationDetailPage onNavigate={navigateTo} booking={detailBooking} />, 
            [Page.History]: <HistoryPage onNavigate={navigateTo} />, 
            [Page.Rispat]: <RispatPage onNavigate={navigateTo} />, 
            [Page.Profile]: <ProfilePage onNavigate={navigateTo} user={user} />,
            [Page.Settings]: <SettingsPage onNavigate={navigateTo} />,
            [Page.HelpCenter]: <HelpCenterPage onNavigate={navigateTo} />,
            [Page.CancelRequests]: <CancelRequestsPage onNavigate={navigateTo} />
        };

        return (
            <MainLayout onLogout={handleLogout} onNavigate={navigateTo} currentPage={currentPage} user={user}>
                {pageComponents[currentPage] || <DashboardPage onNavigate={navigateTo} bookings={bookings} key={refreshTrigger} />}
            </MainLayout>
        );
    };

    return (
        <LanguageProvider>
            <DarkModeProvider>
                <NotificationProvider>
                    <div className="min-h-screen">
                        {renderContent()}
                {/* Bridge event from ReservationsPage to set detail booking and navigate */}
                {(() => {
                    if (typeof window !== 'undefined') {
                        window.addEventListener('set_detail_booking', () => {
                            const raw = sessionStorage.getItem('detail_booking');
                            if (raw) {
                                try {
                                    const bookingData = JSON.parse(raw);
                                    console.log('🔍 Detail booking data from sessionStorage:', bookingData);
                                    console.log('🔍 EndTime in detail booking:', bookingData.endTime);
                                    setDetailBooking(bookingData);
                                    navigateTo(Page.ReservationDetail);
                                } catch (e) {
                                    console.error('Error parsing detail booking:', e);
                                }
                            }
                        });
                        window.addEventListener('storage', (e: any) => {
                            if (e.key === 'booking_refresh') {
                                if (currentPage === Page.Reservations) {
                                    // no-op UI will refresh from component
                                }
                            }
                        });
                    }
                    return null;
                })()}
                    </div>
                </NotificationProvider>
            </DarkModeProvider>
        </LanguageProvider>
    );
};

export default App;