/**
 * API Configuration for Spacio Meeting Room Booker
 * Updated to use the correct backend endpoints
 */

// Base API URL: use environment variables for different environments
export const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? (process.env.VITE_PROD_API_URL || `${(typeof window !== 'undefined' ? window.location.origin : '')}/api`)
    : (process.env.VITE_API_URL || '/api');

// Separate base for Auth endpoints (lives under /api, not /backend/api)
export const AUTH_API_BASE_URL = process.env.NODE_ENV === 'production'
    ? (process.env.VITE_PROD_API_URL || `${(typeof window !== 'undefined' ? window.location.origin : '')}/api`)
    : (process.env.VITE_API_URL || '/api');

// API Endpoints
export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: `${AUTH_API_BASE_URL}/auth/login.php`,
        REGISTER: `${AUTH_API_BASE_URL}/auth/register.php`,
        LOGOUT: `${AUTH_API_BASE_URL}/auth/session.php`,
        GET_USER_BY_SESSION_TOKEN: `${AUTH_API_BASE_URL}/auth/session.php`,
    },
    
    // Meeting Rooms
    ROOMS: {
        GET_ALL: `${API_BASE_URL}/meeting_rooms.php`,
        GET_BY_ID: (id: number) => `${API_BASE_URL}/meeting_rooms.php?action=get_by_id&room_id=${id}`,
        GET_AVAILABLE: (startTime: string, endTime: string) => 
            `${API_BASE_URL}/bookings.php/availability?start_time=${startTime}&end_time=${endTime}`,
        GET_AVAILABILITY: (roomId: number, date: string, startTime: string, endTime: string) =>
            `${API_BASE_URL}/bookings.php/availability?room_id=${roomId}&date=${encodeURIComponent(date)}&start_time=${startTime}&end_time=${endTime}`,
        SEARCH: (searchTerm: string, capacityMin?: number, capacityMax?: number, roomType?: string) => {
            let url = `${API_BASE_URL}/bookings/rooms?search=${encodeURIComponent(searchTerm)}`;
            if (capacityMin !== undefined) url += `&capacity_min=${capacityMin}`;
            if (capacityMax !== undefined) url += `&capacity_max=${capacityMax}`;
            if (roomType) url += `&room_type=${roomType}`;
            return url;
        },
        CREATE: `${API_BASE_URL}/meeting_rooms.php`,
        UPDATE: `${API_BASE_URL}/meeting_rooms.php`,
        DELETE: `${API_BASE_URL}/meeting_rooms.php`,
    },
    
    // Reservations/Bookings
    RESERVATIONS: {
        GET_BY_ID: (id: number) => `${API_BASE_URL}/bookings.php/${id}`,
        GET_USER_RESERVATIONS: (userId: number) => 
            `${API_BASE_URL}/bookings.php/user?user_id=${userId}`,
        GET_ROOM_BOOKINGS: (roomId: number, date?: string) => 
            `${API_BASE_URL}/bookings.php/room-bookings?room_id=${roomId}${date ? `&date=${date}` : ''}`,
        GET_ROOM_RESERVATIONS: (roomId: number, date?: string) => {
            let url = `${API_BASE_URL}/bookings.php?room_id=${roomId}`;
            if (date) url += `&date=${date}`;
            return url;
        },
        GET_UPCOMING: (userId?: number, limit: number = 10) => {
            let url = `${API_BASE_URL}/bookings.php?limit=${limit}`;
            if (userId) url += `&user_id=${userId}`;
            return url;
        },
        GET_STATS: (userId?: number) => {
            let url = `${API_BASE_URL}/bookings.php/stats`;
            if (userId) url += `&user_id=${userId}`;
            return url;
        },
        CREATE: `${API_BASE_URL}/bookings.php`,
        UPDATE: `${API_BASE_URL}/bookings.php/bookings`,
        // Backend expects /bookings.php/{id} for DELETE
        CANCEL: (id: number) => `${API_BASE_URL}/bookings.php/${id}`,
    },

    // AI Bookings
    AI_BOOKINGS: {
        CREATE: `${API_BASE_URL}/bookings.php/ai-booking`,
        GET_CONVERSATIONS: `${API_BASE_URL}/bookings.php/conversations`,
        SAVE_CONVERSATION: `${API_BASE_URL}/bookings.php/conversations`,
    },
    
};

// API Helper Functions
export class ApiService {
    private static async makeRequest(url: string, options: RequestInit = {}) {
        // Get session token from localStorage
        const sessionToken = localStorage.getItem('session_token');
        
        // Debug logging
        console.log('🔍 API Request Debug:', {
            url,
            hasSessionToken: !!sessionToken,
            sessionToken: sessionToken ? `${sessionToken.substring(0, 10)}...` : 'null'
        });
        
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
                ...options.headers,
            },
            ...options,
        };
        

        try {
            console.log('🔍 Making API request to:', url);
            console.log('🔍 Request options:', defaultOptions);
            
            const response = await fetch(url, defaultOptions);
            console.log('🔍 Response status:', response.status);
            console.log('🔍 Response headers:', response.headers);

            // Handle 401 Unauthorized - session expired or invalid
            if (response.status === 401) {
                console.log('🔍 401 Unauthorized - clearing session token');
                localStorage.removeItem('session_token');
                // Dispatch event to notify components about session expiry
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('session-expired'));
                }
                throw new Error('Session expired. Please login again.');
            }

            // Some PHP environments may emit warnings before JSON (e.g., extension already loaded)
            // Parse defensively: try JSON first, then fallback to text->sanitize->JSON
            let data: any;
            try {
                data = await response.json();
            } catch {
                const raw = await response.text();
                const firstBrace = raw.indexOf('{');
                const firstBracket = raw.indexOf('[');
                const idx = (firstBrace === -1) ? firstBracket : (firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket));
                if (idx >= 0) {
                    const sliced = raw.slice(idx).trim();
                    try {
                        data = JSON.parse(sliced);
                    } catch (e2) {
                        console.error('Failed to parse JSON after sanitizing:', { raw: raw.slice(0, 200) + '...' });
                        throw e2;
                    }
                } else {
                    console.error('Response is not JSON and has no JSON start:', { raw: raw.slice(0, 200) + '...' });
                    throw new Error('Invalid JSON response');
                }
            }

            if (!response.ok) {
                throw new Error(data?.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            console.error('Error type:', typeof error);
            console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            
            // Handle network errors specifically
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.error('Network error detected - possible causes:');
                console.error('1. Server is not running');
                console.error('2. Incorrect API endpoint URL');
                console.error('3. CORS issues');
                console.error('4. Network connectivity problems');
                
                throw new Error('Network error: Unable to connect to server. Please check your internet connection and try again.');
            }
            
            throw error;
        }
    }

    // Authentication method and save session_token to localStorage
    static async login(email: string, password: string) {
        const response = await this.makeRequest(API_ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ action: 'login', email, password })
        });
        const sessionToken = response?.data?.session?.session_token || response?.session_token;
        if (sessionToken) {
            localStorage.setItem('session_token', sessionToken);
        }
        return response;
    }

    // Register method
    static async register(username: string, email: string, password: string, fullName: string) {
        return this.makeRequest(API_ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'register',
                username, 
                email, 
                password, 
                full_name: fullName 
            })
        });
    }

    // get user_id from session_token
    static async getUserBySessionToken(sessionToken: string) {
        if (!sessionToken) {
            return null;
        }
        const response = await this.makeRequest(API_ENDPOINTS.AUTH.GET_USER_BY_SESSION_TOKEN, {
            method: 'POST',
            body: JSON.stringify({ action: 'validate', session_token: sessionToken })
        });
        const data = response?.data || response;
        const userId = data?.user_id ?? data?.id ?? data?.user?.id ?? null;
        return userId;
    }



    static async logout(sessionToken: string) {
        return this.makeRequest(API_ENDPOINTS.AUTH.LOGOUT, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'logout', 
                session_token: sessionToken 
            })
        });
    }

    // Meeting Rooms methods
    static async getAllRooms() {
        return this.makeRequest(API_ENDPOINTS.ROOMS.GET_ALL);
    }

    static async getRoomById(id: number) {
        return this.makeRequest(API_ENDPOINTS.ROOMS.GET_BY_ID(id));
    }

    static async getRoomIdByName(name: string) {
        const rooms = await this.getAllRooms();
        const room = rooms.find((room: any) => room.room_name === name);
        return room.room_id;
    }

    static async getAvailableRooms(startTime: string, endTime: string) {
        return this.makeRequest(API_ENDPOINTS.ROOMS.GET_AVAILABLE(startTime, endTime));
    }

    static async getAvailability(roomId: number, date: string, startTime: string, endTime: string) {
        return this.makeRequest(API_ENDPOINTS.ROOMS.GET_AVAILABILITY(roomId, date, startTime, endTime));
    }

    static async searchRooms(searchTerm: string, capacityMin?: number, capacityMax?: number, roomType?: string) {
        return this.makeRequest(API_ENDPOINTS.ROOMS.SEARCH(searchTerm, capacityMin, capacityMax, roomType));
    }

    static async createRoom(roomData: any) {
        return this.makeRequest(API_ENDPOINTS.ROOMS.CREATE, {
            method: 'POST',
            body: JSON.stringify({
                action: 'create',
                room_data: roomData
            })
        });
    }

    static async updateRoom(roomData: any) {
        return this.makeRequest(API_ENDPOINTS.ROOMS.UPDATE, {
            method: 'POST',
            body: JSON.stringify({
                action: 'update',
                ...roomData
            })
        });
    }

    static async deleteRoom(roomId: number) {
        return this.makeRequest(`${API_ENDPOINTS.ROOMS.DELETE}?id=${roomId}`, {
            method: 'DELETE'
        });
    }

    static async updateRoomStatus(roomId: number, isActive: boolean) {
        return this.makeRequest(API_ENDPOINTS.ROOMS.UPDATE, {
            method: 'POST',
            body: JSON.stringify({
                action: 'update_status',
                room_id: roomId,
                is_active: isActive
            })
        });
    }

    // Reservations/Bookings methods
    static async getAllBookings() {
        return this.makeRequest(`${API_BASE_URL}/bookings.php`);
    }

    static async getBookingById(id: number) {
        return this.makeRequest(API_ENDPOINTS.RESERVATIONS.GET_BY_ID(id));
    }

    static async getUserBookings(userId: number, includeCompleted: boolean = false) {
        const url = includeCompleted 
            ? `${API_ENDPOINTS.RESERVATIONS.GET_USER_RESERVATIONS(userId)}&include_completed=true`
            : API_ENDPOINTS.RESERVATIONS.GET_USER_RESERVATIONS(userId);
        return this.makeRequest(url);
    }

    static async getAIBookingsByUserId(userId: number) {
        return this.makeRequest(`${API_BASE_URL}/bookings.php/ai-data?user_id=${userId}`);
    }

    static async changePassword(currentPassword: string, newPassword: string) {
        const token = localStorage.getItem('session_token');
        if (!token) {
            throw new Error('No session token found');
        }

        return this.makeRequest(`${AUTH_API_BASE_URL}/auth/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                action: 'change_password',
                current_password: currentPassword,
                new_password: newPassword
            })
        });
    }

    static async getAllAIBookings() {
        // Get current user data from localStorage for logging purposes
        const userDataStr = localStorage.getItem('user_data');
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const userId = userData?.id || 1;
        
        // Debug logging
        console.log('🔍 API getAllAIBookings - Debug Info:', {
            userDataStr,
            userData,
            userId,
            apiUrl: `${API_BASE_URL}/bookings.php?ai-data=true`
        });
        
        // Get all AI bookings (no user filtering - global visibility)
        const response = await this.makeRequest(`${API_BASE_URL}/bookings.php?ai-data=true`);
        
        console.log('🔍 API getAllAIBookings - Response:', response);
        
        return response;
    }

    static async autoCompleteExpiredBookings() {
        return this.makeRequest(`${API_BASE_URL}/bookings.php/auto-complete`);
    }

    static async getRoomBookings(roomId: number, date?: string) {
        return this.makeRequest(API_ENDPOINTS.RESERVATIONS.GET_ROOM_BOOKINGS(roomId, date));
    }

    static async createBooking(bookingData: any) {
        return this.makeRequest(API_ENDPOINTS.RESERVATIONS.CREATE, {
            method: 'POST',
            body: JSON.stringify({
                action: 'create',
                booking_data: bookingData
            })
        });
    }

    static async createAIBooking(bookingData: any) {
        return this.makeRequest(API_ENDPOINTS.AI_BOOKINGS.CREATE, {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    static async createFormBooking(bookingData: any) {
        return this.makeRequest(`${API_BASE_URL}/bookings.php/form-booking`, {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    static async saveSuccessfulAIBooking(bookingData: any) {
        return this.makeRequest(`${API_BASE_URL}/bookings.php/ai-booking-success`, {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    static async createAISuccessBooking(bookingData: any) {
        return this.makeRequest(`${API_BASE_URL}/bookings.php/ai-booking-success`, {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }



    static async updateBooking(id: number, bookingData: any) {
        return this.makeRequest(API_ENDPOINTS.RESERVATIONS.UPDATE, {
            method: 'PUT',
            body: JSON.stringify({ id, ...bookingData })
        });
    }

    static async cancelBooking(id: number | string, reason?: string) {
        // Check if this is an AI booking
        const isAiBooking = String(id).startsWith('ai_');
        
        if (isAiBooking) {
            // For AI bookings, use AI-specific endpoint
            const aiId = String(id).replace('ai_', '');
            const url = reason ? 
                `${API_BASE_URL}/bookings.php/ai-cancel?id=${aiId}&reason=${encodeURIComponent(reason)}` :
                `${API_BASE_URL}/bookings.php/ai-cancel?id=${aiId}`;
            return this.makeRequest(url, {
                method: 'DELETE'
            });
        } else {
            // For form bookings, use regular endpoint
            const url = reason ? 
                `${API_ENDPOINTS.RESERVATIONS.CANCEL(Number(id))}?reason=${encodeURIComponent(reason)}` :
                API_ENDPOINTS.RESERVATIONS.CANCEL(Number(id));
            return this.makeRequest(url, {
                method: 'DELETE'
            });
        }
    }

    static async completeBooking(id: number | string) {
        // Check if this is an AI booking
        const isAiBooking = String(id).startsWith('ai_');
        
        if (isAiBooking) {
            // For AI bookings, remove prefix and use complete endpoint
            const aiId = String(id).replace('ai_', '');
            return this.makeRequest(`${API_BASE_URL}/bookings.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'complete',
                    booking_id: aiId
                })
            });
        } else {
            // For form bookings, use complete endpoint
            return this.makeRequest(`${API_BASE_URL}/bookings.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'complete',
                    booking_id: id
                })
            });
        }
    }

    // Graceful Mongo AI bookings helpers (optional backend)
    static async getUserAIBookingsMongo(userId: number) {
        const url = `${API_BASE_URL}/bookings.php/ai-user?user_id=${userId}`;
        try {
            return await this.makeRequest(url);
        } catch (e) {
            // Fallback aman bila endpoint tidak tersedia
            return { status: 'error', data: [] } as any;
        }
    }

    static async cancelAIBookingMongo(id: string) {
        const url = `${API_BASE_URL}/bookings.php/ai-booking-mongo/${id}`;
        try {
            return await this.makeRequest(url, { method: 'DELETE' });
        } catch (e) {
            // Fallback aman bila endpoint tidak tersedia
            return { status: 'error' } as any;
        }
    }

    // AI Conversations
    static async getConversations(userId?: number, sessionId?: string) {
        let url = API_ENDPOINTS.AI_BOOKINGS.GET_CONVERSATIONS;
        if (userId) url += `?user_id=${userId}`;
        if (sessionId) url += userId ? `&session_id=${sessionId}` : `?session_id=${sessionId}`;
        return this.makeRequest(url);
    }

    static async saveConversation(conversationData: any) {
        return this.makeRequest(API_ENDPOINTS.AI_BOOKINGS.SAVE_CONVERSATION, {
            method: 'POST',
            body: JSON.stringify(conversationData)
        });
    }

    // Cancel Requests
    static async createCancelRequest(requestData: {
        booking_id: string;
        requester_name: string;
        owner_name: string;
        reason: string;
        requester_id?: number;
    }) {
        return this.makeRequest(`${API_BASE_URL}/cancel_requests.php?action=create`, {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
    }

    static async getCancelRequestsByOwner(ownerName: string) {
        return this.makeRequest(`${API_BASE_URL}/cancel_requests.php?action=get_by_owner&owner_name=${encodeURIComponent(ownerName)}`);
    }

    static async getCancelRequestsByRequester(requesterName: string) {
        return this.makeRequest(`${API_BASE_URL}/cancel_requests.php?action=get_by_requester&requester_name=${encodeURIComponent(requesterName)}`);
    }

    static async respondToCancelRequest(requestId: number, status: 'approved' | 'rejected', responseMessage?: string) {
        return this.makeRequest(`${API_BASE_URL}/cancel_requests.php?action=respond`, {
            method: 'POST',
            body: JSON.stringify({
                request_id: requestId,
                status: status,
                response_message: responseMessage
            })
        });
    }

    
}
