import React, { useState, useRef, useEffect } from 'react';
import { Page, Booking, MeetingRoom } from '../types';
import { createRoomBookingAssistant, RoomBookingAssistant } from '../services/roomBookingAssistant';
import { BackArrowIcon, SendIcon, RobotIcon, CheckIcon, XIcon, BookingIcon } from '../components/icons';

const AiIcon: React.FC = () => {
    const [isThinking, setIsThinking] = useState(false);

    // Simulate thinking animation when component mounts
    React.useEffect(() => {
        const interval = setInterval(() => {
            setIsThinking(true);
            setTimeout(() => setIsThinking(false), 2000);
        }, 8000); // Every 8 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md flex-shrink-0 animate-pulse-slow">
            <img 
                src="/images/robot.png" 
                alt="AI Avatar" 
                className={`w-8 h-8 transition-all duration-300 ${
                    isThinking ? 'animate-thinking' : 'animate-wiggle-slow'
                }`} 
            />
        </div>
    );
};

interface RBAPageProps {
  onNavigate: (page: Page) => void;
  onBookingConfirmed: (booking: Booking) => void;
}

interface Message {
  id: number;
  type: 'user' | 'rba';
  content: string;
  timestamp: string;
  recommendations?: {
    rooms: MeetingRoom[];
    reasons: string[];
  };
  notifications?: Array<{
    type: 'confirmation' | 'reminder' | 'change' | 'feedback';
    message: string;
    scheduled?: Date;
  }>;
}

const RBAPage: React.FC<RBAPageProps> = ({ onNavigate, onBookingConfirmed }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rba, setRba] = useState<RoomBookingAssistant | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Partial<Booking>>({});
  const [availableRooms, setAvailableRooms] = useState<MeetingRoom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize RBA
  useEffect(() => {
    console.log('Initializing RBA...');
    try {
      const assistant = createRoomBookingAssistant('user-123', `session-${Date.now()}`);
      console.log('RBA created successfully:', assistant);
      setRba(assistant);
      
      // Add welcome message
      setMessages([{
        id: 1,
        type: 'rba',
        content: "Halo! 👋 Saya adalah RoomBooking Assistant (RBA) - asisten cerdas Anda untuk pemesanan ruang rapat. Saya siap membantu Anda dengan pengalaman pemesanan yang mulus, personal, dan efisien! 🎯\n\nApa yang bisa saya bantu hari ini?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      console.log('Welcome message added');
    } catch (error) {
      console.error('Error initializing RBA:', error);
      setError(`Error initializing RBA: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessages([{
        id: 1,
        type: 'rba',
        content: "Halo! 👋 Saya adalah RoomBooking Assistant (RBA). Maaf, terjadi kesalahan dalam inisialisasi. Silakan refresh halaman atau coba lagi.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto focus input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Prevent page scroll when typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent page scroll when typing in chat
      if (inputRef.current && document.activeElement === inputRef.current) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Home' || e.key === 'End') {
          e.preventDefault();
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Only prevent scroll if user is actively typing
      if (inputRef.current && document.activeElement === inputRef.current && input.length > 0) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !rba) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      // Process with RBA
      const response = await rba.processInput(userMessage);
      
      // Add RBA response
      const rbaMsg: Message = {
        id: Date.now() + 1,
        type: 'rba',
        content: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendations: response.recommendations,
        notifications: response.notifications
      };

      setMessages(prev => [...prev, rbaMsg]);

      // Update booking data if provided
      if (response.bookingData) {
        setCurrentBooking(prev => ({ ...prev, ...response.bookingData }));
      }

      // Handle completion
      if (response.action === 'complete' && response.bookingData) {
        const booking: Booking = {
          id: Date.now(),
          roomName: response.bookingData.roomName || '',
          roomId: 0, // Will be set by backend
          topic: response.bookingData.topic || '',
          pic: response.bookingData.pic || '',
          participants: response.bookingData.participants || 0,
          date: response.bookingData.date || '',
          time: response.bookingData.time || '',
          endTime: response.bookingData.endTime || '',
          meetingType: response.bookingData.meetingType as any || 'internal',
          facilities: response.bookingData.facilities || []
        };

        onBookingConfirmed(booking);
        onNavigate(Page.BookingConfirmation);
      }

    } catch (error) {
      console.error('RBA Error:', error);
      
      const errorMsg: Message = {
        id: Date.now() + 1,
        type: 'rba',
        content: "Maaf, terjadi kesalahan dalam memproses permintaan Anda. Silakan coba lagi atau gunakan fitur pemesanan manual.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputFocus = () => {
    // Keep current position when input is focused
    // Don't force scroll
  };


  const resetRBA = () => {
    if (rba) {
      rba.resetContext();
      setCurrentBooking({});
      setMessages([{
        id: 1,
        type: 'rba',
        content: "Halo! 👋 Saya adalah RoomBooking Assistant (RBA) - asisten cerdas Anda untuk pemesanan ruang rapat. Saya siap membantu Anda dengan pengalaman pemesanan yang mulus, personal, dan efisien! 🎯\n\nApa yang bisa saya bantu hari ini?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };


  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl h-[80vh] flex flex-col border border-white/20">
      <header className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
        <div className="flex items-center">
          <button onClick={() => onNavigate(Page.Dashboard)} className="mr-4 p-2 rounded-full hover:bg-white/60 transition-all duration-200 shadow-sm">
            <BackArrowIcon />
          </button>
          <AiIcon/>
          <div className="ml-3">
            <h2 className="text-lg font-bold text-gray-800">Asisten AI Spacio</h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow p-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-gray-100">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                  {msg.type === 'rba' && (
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <RobotIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-semibold">RBA Assistant</span>
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-500">Online</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className={`rounded-2xl px-4 py-3 shadow-lg ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-8 rounded-br-lg' 
                      : 'bg-white text-gray-800 mr-8 border border-gray-200/50 rounded-bl-lg'
                  }`}>
                    <p className="text-base whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-3 ${msg.type === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                      {msg.timestamp}
                    </p>
                  </div>


                  {/* Recommendations */}
                  {msg.recommendations && msg.recommendations.rooms && Array.isArray(msg.recommendations.rooms) && msg.recommendations.rooms.length > 0 && (
                    <div className="mt-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/60 rounded-3xl p-5 shadow-lg mr-8">
                      <h4 className="text-sm font-bold text-blue-800 mb-4 flex items-center">
                        <span className="text-xl mr-2">💡</span>
                        Rekomendasi Ruangan
                      </h4>
                      <div className="space-y-3">
                        {msg.recommendations.rooms.map((room, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/90 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-200 border border-white/50">
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{room.name}</p>
                              <p className="text-xs text-gray-600 mt-1">Kapasitas: {room.capacity} orang</p>
                            </div>
                            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl text-xs font-semibold hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                              Pilih
                            </button>
                          </div>
                        ))}
                      </div>
                      {msg.recommendations.reasons && Array.isArray(msg.recommendations.reasons) && msg.recommendations.reasons.length > 0 && (
                        <div className="mt-4 bg-gradient-to-r from-blue-100/60 to-purple-100/60 rounded-2xl p-3 border border-blue-200/40">
                          <p className="text-xs text-blue-700 font-medium">
                            <span className="font-bold">Alasan:</span> {msg.recommendations.reasons.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notifications */}
                  {msg.notifications && Array.isArray(msg.notifications) && msg.notifications.length > 0 && (
                    <div className="mt-4 space-y-3 mr-8">
                      {msg.notifications.map((notification, index) => (
                        <div key={index} className={`p-4 rounded-3xl text-sm shadow-lg border-2 ${
                          notification.type === 'confirmation' 
                            ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 text-green-800 border-green-300/60'
                            : notification.type === 'reminder'
                            ? 'bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 text-yellow-800 border-yellow-300/60'
                            : notification.type === 'change'
                            ? 'bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 text-orange-800 border-orange-300/60'
                            : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 text-blue-800 border-blue-300/60'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {notification.type === 'confirmation' ? '✅' : 
                               notification.type === 'reminder' ? '⏰' :
                               notification.type === 'change' ? '🔄' : '📝'}
                            </span>
                            <span className="font-bold text-sm">{notification.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

        {isLoading && (
          <div className="flex items-end justify-start mb-4">
            <div className="mr-3"><AiIcon/></div>
            <div className="px-4 py-3 rounded-2xl bg-white text-gray-800 rounded-bl-lg inline-block shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm text-gray-500 mr-2">Asisten AI sedang mengetik</span>
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 bg-gradient-to-r from-pink-400 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}

            <div ref={chatEndRef} />
          </div>


      <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-white to-gray-50 rounded-b-3xl">
        <div className="relative">
          <input 
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            placeholder={isLoading ? "Menunggu balasan AI..." : "Ketik pesan Anda atau tekan Enter..."}
            disabled={isLoading}
            className="w-full pl-5 pr-14 py-3 border border-gray-200/50 bg-white/80 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 disabled:bg-gray-100 text-black placeholder-gray-500 shadow-sm"
          />
          <button onClick={handleSendMessage} disabled={!input.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-blue-600 p-2.5 rounded-full text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RBAPage;
