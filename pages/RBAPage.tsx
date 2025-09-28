import React, { useState, useRef, useEffect } from 'react';
import { Page, Booking, MeetingRoom } from '../types';
import RoomBookingAssistant from '../services/roomBookingAssistant';
import { createRoomBookingAssistant } from '../services/roomBookingAssistant';
import { BackArrowIcon, SendIcon, RobotIcon, CheckIcon, XIcon, BookingIcon } from '../components/icons';
import InJourneyPattern from '../components/InJourneyPattern';

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
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 animate-pulse-slow">
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

const RBAPage: React.FC<RBAPageProps> = ({ onNavigate, onBookingConfirmed }) => {
    const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: 'user' | 'ai'; timestamp: string; options?: string[] }>>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [assistant, setAssistant] = useState<RoomBookingAssistant | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize assistant
    useEffect(() => {
        const newAssistant = createRoomBookingAssistant('user-1', 'session-1');
        setAssistant(newAssistant);
        
        // Add welcome message
        const welcomeMessage = {
            id: Date.now(),
            text: "Halo! 👋 Saya adalah asisten AI Spacio yang siap membantu Anda memesan ruang rapat dengan mudah! 🎯 Silakan pilih salah satu opsi di bawah atau ketik pesan Anda secara manual.",
            sender: 'ai' as const,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }),
            options: ['Pesan Ruangan', 'Bantuan']
        };
        setMessages([welcomeMessage]);
    }, []);

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto focus input field when component mounts
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !assistant || isLoading) return;

        const userMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'user' as const,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true })
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await assistant.processInput(inputValue);
            
            const aiMessage = {
                id: Date.now() + 1,
                text: response.message,
                sender: 'ai' as const,
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }),
                options: response.quickActions?.map(qa => qa.label),
                isQuotaExceeded: response.isQuotaExceeded
            };

            setMessages(prev => [...prev, aiMessage]);

            // If booking is confirmed, navigate to confirmation page
            if (response.action === 'complete' && response.bookingData) {
                console.log('🔍 RBAPage - Sending booking data to confirmation:', response.bookingData);
                console.log('🔍 RBAPage - Booking data details:', {
                    roomName: response.bookingData.roomName,
                    topic: response.bookingData.topic,
                    pic: response.bookingData.pic,
                    date: response.bookingData.date,
                    time: response.bookingData.time,
                    endTime: response.bookingData.endTime,
                    participants: response.bookingData.participants,
                    meetingType: response.bookingData.meetingType
                });
                
                // Validate data before sending - check all required fields
                const bookingData = response.bookingData;
                const hasValidData = bookingData.roomName && 
                                   bookingData.topic && 
                                   bookingData.pic && 
                                   bookingData.date && 
                                   (bookingData.time || bookingData.meeting_time) && 
                                   bookingData.participants && 
                                   bookingData.meetingType;
                
                if (hasValidData) {
                    console.log('✅ RBAPage - All booking data is valid, saving to database');
                    
                    // Save to database first
                    try {
                        const saveResult = await assistant?.saveBookingToDatabase(bookingData);
                        console.log('✅ RBAPage - Booking saved to database:', saveResult);
                        
                        // Trigger refresh event for other components
                        window.dispatchEvent(new CustomEvent('refreshBookings'));
                        
                        // Then proceed to confirmation
                        setTimeout(() => {
                            onBookingConfirmed(response.bookingData as any);
                        }, 1000);
                    } catch (error) {
                        console.error('❌ RBAPage - Failed to save booking to database:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                        alert(`Gagal menyimpan pemesanan ke database: ${errorMessage}. Silakan coba lagi.`);
                    }
                } else {
                    console.log('❌ RBAPage - Booking data is incomplete, not proceeding to confirmation');
                    console.log('❌ RBAPage - Missing fields:', {
                        roomName: !bookingData.roomName,
                        topic: !bookingData.topic,
                        pic: !bookingData.pic,
                        date: !bookingData.date,
                        time: !bookingData.time && !bookingData.meeting_time,
                        participants: !bookingData.participants,
                        meetingType: !bookingData.meetingType
                    });
                    console.log('❌ RBAPage - Actual booking data:', bookingData);
                    console.log('❌ RBAPage - Field values:', {
                        roomName: bookingData.roomName,
                        topic: bookingData.topic,
                        pic: bookingData.pic,
                        date: bookingData.date,
                        time: bookingData.time,
                        meeting_time: bookingData.meeting_time,
                        participants: bookingData.participants,
                        meetingType: bookingData.meetingType
                    });
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "Maaf, terjadi kesalahan. Silakan coba lagi.",
                sender: 'ai' as const,
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true })
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            
            // Auto focus input after sending message
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);
        }
    };

    const handleOptionClick = async (option: string) => {
        // Semua quick buttons sekarang akan mengirim pesan ke AI
        if (assistant) {
            try {
                setIsLoading(true);
                
                // Buat pesan user untuk ditampilkan di chat
                const userMessage = {
                    id: Date.now(),
                    text: option,
                    sender: 'user' as const,
                    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true })
                };
                setMessages(prev => [...prev, userMessage]);
                
                // Handle quick action atau process input biasa
                let response;
                if (option === 'Pesan Ruangan') {
                    response = await assistant.processInput('Saya ingin memesan ruang rapat');
                } else if (option === 'Bantuan') {
                    response = await assistant.processInput('Saya butuh bantuan');
                } else {
                    // Handle quick actions dari AI
                    response = await assistant.handleQuickAction(option);
                }
                
                const aiMessage = {
                    id: Date.now() + 1,
                    text: response.message,
                    sender: 'ai' as const,
                    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    options: response.quickActions?.map(qa => qa.label)
                };

                setMessages(prev => [...prev, aiMessage]);

                // If booking is confirmed, navigate to confirmation page
                if (response.action === 'complete' && response.bookingData) {
                    // Validate data before sending
                    const bookingData = response.bookingData;
                    const hasValidData = bookingData.roomName && 
                                       bookingData.topic && 
                                       bookingData.pic && 
                                       bookingData.date && 
                                       (bookingData.time || bookingData.meeting_time) && 
                                       bookingData.participants && 
                                       bookingData.meetingType;
                    
                    if (hasValidData) {
                        console.log('✅ RBAPage (OptionClick) - All booking data is valid, saving to database');
                        
                        // Save to database first
                        try {
                            const saveResult = await assistant?.saveBookingToDatabase(bookingData);
                            console.log('✅ RBAPage (OptionClick) - Booking saved to database:', saveResult);
                            
                            // Trigger refresh event for other components
                            window.dispatchEvent(new CustomEvent('refreshBookings'));
                            
                            // Then proceed to confirmation
                            setTimeout(() => {
                                onBookingConfirmed(response.bookingData as any);
                            }, 1000);
                        } catch (error) {
                            console.error('❌ RBAPage (OptionClick) - Failed to save booking to database:', error);
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                            alert(`Gagal menyimpan pemesanan ke database: ${errorMessage}. Silakan coba lagi.`);
                        }
                    } else {
                        console.log('❌ RBAPage (OptionClick) - Booking data is incomplete, not proceeding to confirmation');
                        console.log('❌ RBAPage (OptionClick) - Missing fields:', {
                            roomName: !bookingData.roomName,
                            topic: !bookingData.topic,
                            pic: !bookingData.pic,
                            date: !bookingData.date,
                            time: !bookingData.time && !bookingData.meeting_time,
                            participants: !bookingData.participants,
                            meetingType: !bookingData.meetingType
                        });
                        console.log('❌ RBAPage (OptionClick) - Actual booking data:', bookingData);
                        console.log('❌ RBAPage (OptionClick) - Field values:', {
                            roomName: bookingData.roomName,
                            topic: bookingData.topic,
                            pic: bookingData.pic,
                            date: bookingData.date,
                            time: bookingData.time,
                            meeting_time: bookingData.meeting_time,
                            participants: bookingData.participants,
                            meetingType: bookingData.meetingType
                        });
                    }
                }
            } catch (error) {
                console.error('Error handling quick action:', error);
                const errorMessage = {
                    id: Date.now() + 1,
                    text: "Maaf, terjadi kesalahan. Silakan coba lagi.",
                    sender: 'ai' as const,
                    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true })
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        } else {
            // Fallback jika assistant belum tersedia
            setInputValue(option);
            handleSendMessage();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        if (assistant) {
            const newAssistant = createRoomBookingAssistant('user-1', 'session-1');
            setAssistant(newAssistant);
            
            // Add welcome message
            const welcomeMessage = {
                id: Date.now(),
                text: "Halo! 👋 Saya adalah asisten AI Spacio yang siap membantu Anda memesan ruang rapat dengan mudah! 🎯 Silakan pilih salah satu opsi di bawah atau ketik pesan Anda secara manual.",
                sender: 'ai' as const,
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: true }),
                options: ['Pesan Ruangan', 'Bantuan']
            };
            setMessages([welcomeMessage]);
        }
    };

    return (
        <div className="h-screen overflow-hidden relative">
            {/* InJourney Pattern Background */}
            <InJourneyPattern className="opacity-30" />
            
            {/* Background Image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/images/meeting-rooms/t3.jpeg)'}}></div>
            
            {/* Overlay untuk meningkatkan kontras */}
            <div className="absolute inset-0 bg-white/2 backdrop-blur-sm"></div>
            
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse"></div>
                <div className="absolute top-40 left-40 w-60 h-60 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse"></div>
            </div>
            
            {/* Chat Container */}
            <div className="relative shadow-2xl h-screen flex flex-col w-full border border-white/30 overflow-hidden">
                {/* Background Image untuk Chat Container */}
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/images/meeting-rooms/t3.jpeg)'}}></div>
                
                {/* Overlay untuk kontras yang lebih baik */}
                <div className="absolute inset-0 bg-white/25 backdrop-blur-sm"></div>
                {/* Quick Header */}
                <header className="relative p-4 border-b border-blue-200/50 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-xl z-10">
                    <div className="flex items-center">
                        <button 
                            onClick={() => onNavigate(Page.Dashboard)} 
                            className="mr-3 p-2 rounded-full hover:bg-blue-200/50 transition-all duration-300 text-blue-700 hover:text-blue-900"
                        >
                            <BackArrowIcon />
                        </button>
                        <AiIcon />
                        <div className="ml-3">
                            <h2 className="text-lg font-bold text-blue-800">Asisten AI Spacio</h2>
                            <p className="text-xs text-blue-600">Online • Siap membantu</p>
                        </div>
                    </div>
                    
                    {/* Quick Status */}
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-blue-600 font-medium">AI Active</span>
                        </div>
                        <button 
                            onClick={clearChat}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-100/50 rounded-full hover:bg-blue-200/50 transition-all duration-300"
                        >
                            🔄 Reset
                        </button>
                    </div>
                </header>

                {/* Quick Booking Info Header */}
                {assistant && assistant.getCurrentBooking() && Object.keys(assistant.getCurrentBooking()).length > 0 && (
                    <div className="relative p-3 border-b border-blue-200/30 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-green-700">📝 Informasi yang sudah saya catat:</span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-green-600">
                                {assistant.getCurrentBooking().roomName && (
                                    <span className="flex items-center space-x-1">
                                        <span>🏢</span>
                                        <span>{assistant.getCurrentBooking().roomName}</span>
                                    </span>
                                )}
                                {assistant.getCurrentBooking().participants && (
                                    <span className="flex items-center space-x-1">
                                        <span>👥</span>
                                        <span>{assistant.getCurrentBooking().participants} orang</span>
                                    </span>
                                )}
                                {assistant.getCurrentBooking().date && (
                                    <span className="flex items-center space-x-1">
                                        <span>📅</span>
                                        <span>{assistant.getCurrentBooking().date}</span>
                                    </span>
                                )}
                                {assistant.getCurrentBooking().time && (
                                    <span className="flex items-center space-x-1">
                                        <span>⏰</span>
                                        <span>{assistant.getCurrentBooking().time}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="relative flex-1 p-6 overflow-y-auto min-h-0 backdrop-blur-sm z-10">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex items-end ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
                            {message.sender === 'ai' && <div className="mr-3"><AiIcon /></div>}
                            
                            <div className={`max-w-2xl ${message.sender === 'user' ? 'text-right' : ''}`}>
                                <div className={`px-6 py-5 rounded-3xl inline-block shadow-lg backdrop-blur-sm ${message.sender === 'user' ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-br-none border border-blue-400/30 shadow-blue-500/25' : 'bg-white/90 text-gray-800 rounded-bl-none border border-blue-200/50 shadow-blue-200/50 backdrop-blur-sm'}`}>
                                    <p className="text-left" style={{ whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                                    
                                    {/* API Key Information for Quota Exceeded */}
                                    {message.isQuotaExceeded && (
                                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-yellow-800">
                                                        Cara Mengatasi Masalah API Key
                                                    </h3>
                                                    <div className="mt-2 text-sm text-yellow-700">
                                                        <p>Untuk mengatasi masalah ini:</p>
                                                        <ol className="list-decimal list-inside mt-2 space-y-1">
                                                            <li>Kunjungi <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Google AI Studio</a></li>
                                                            <li>Buat API key baru atau periksa quota Anda</li>
                                                            <li>Update file <code className="bg-yellow-100 px-1 rounded">.env.local</code> dengan API key baru</li>
                                                            <li>Restart aplikasi</li>
                                                        </ol>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Quick Actions */}
                                {message.options && (
                                    <div className={`mt-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className="flex flex-wrap gap-2">
                                            {message.options.map((option, index) => {
                                                // Determine button style based on option type
                                                const isPrimary = option.includes('Booking') || option.includes('Ya') || option.includes('Pesan') || option.includes('Konfirmasi');
                                                const isSecondary = option.includes('Tidak') || option.includes('Batal') || option.includes('Lihat') || option.includes('Ubah');
                                                const isHelp = option.includes('Bantuan') || option.includes('Help');
                                                const isTime = option.includes(':') || option.includes('Hari') || option.includes('Besok');
                                                const isRoom = option.includes('Samudrantha') || option.includes('Cedaya') || option.includes('Celebes');
                                                const isParticipant = option.includes('orang');
                                                const isMeetingType = option.includes('Internal') || option.includes('Eksternal');
                                                
                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleOptionClick(option)}
                                                        className={`
                                                            font-medium rounded-lg px-3 py-2 text-xs flex items-center 
                                                            transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105
                                                            ${isPrimary 
                                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border border-blue-400 hover:from-blue-600 hover:to-indigo-600' 
                                                                : isSecondary 
                                                                ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300 hover:from-gray-200 hover:to-gray-300'
                                                                : isHelp
                                                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-300 hover:from-green-200 hover:to-emerald-200'
                                                                : isTime
                                                                ? 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border border-orange-300 hover:from-orange-200 hover:to-yellow-200'
                                                                : isRoom
                                                                ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-300 hover:from-purple-200 hover:to-pink-200'
                                                                : isParticipant
                                                                ? 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 border border-teal-300 hover:from-teal-200 hover:to-cyan-200'
                                                                : isMeetingType
                                                                ? 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border border-indigo-300 hover:from-indigo-200 hover:to-blue-200'
                                                                : 'bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 border border-sky-300 hover:from-sky-200 hover:to-blue-200'
                                                            }
                                                        `}
                                                    >
                                                        {/* Quick Icons */}
                                                        {(option.includes('Pesan') || option.includes('Booking')) && (
                                                            <span className="mr-1.5">📅</span>
                                                        )}
                                                        {(option.includes('Bantuan') || option.includes('Help')) && (
                                                            <span className="mr-1.5">❓</span>
                                                        )}
                                                        {(option.includes('Ya') || option.includes('Confirm') || option.includes('Konfirmasi')) && (
                                                            <span className="mr-1.5">✅</span>
                                                        )}
                                                        {(option.includes('Tidak') || option.includes('Batal')) && (
                                                            <span className="mr-1.5">❌</span>
                                                        )}
                                                        {(option.includes('Lihat') || option.includes('View')) && (
                                                            <span className="mr-1.5">👁️</span>
                                                        )}
                                                        {(option.includes('Ubah') || option.includes('Edit')) && (
                                                            <span className="mr-1.5">✏️</span>
                                                        )}
                                                        {isTime && (
                                                            <span className="mr-1.5">⏰</span>
                                                        )}
                                                        {isRoom && (
                                                            <span className="mr-1.5">🏢</span>
                                                        )}
                                                        {isParticipant && (
                                                            <span className="mr-1.5">👥</span>
                                                        )}
                                                        {isMeetingType && (
                                                            <span className="mr-1.5">🏢</span>
                                                        )}
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                <p className="text-xs text-gray-400 mt-1.5 px-1">{message.timestamp}</p>
                            </div>
                            
                            {message.sender === 'user' && <img src={`https://i.pravatar.cc/150?u=eaanarviant`} alt="User Avatar" className="w-10 h-10 rounded-full ml-3 flex-shrink-0 shadow-md" />}
                        </div>
                    ))}
                        
                    {isLoading && (
                        <div className="flex items-end justify-start mb-4">
                            <div className="mr-3"><AiIcon /></div>
                            <div className="px-4 py-3 rounded-2xl bg-white text-gray-800 rounded-bl-none inline-block shadow-md">
                                <div className="flex items-center justify-center space-x-1">
                                    <span className="text-sm text-gray-500 mr-2">Asisten AI sedang mengetik</span>
                                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse-fast"></span>
                                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse-fast animation-delay-150"></span>
                                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse-fast animation-delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Input Area */}
                <div className="relative p-4 border-t border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 flex-shrink-0 backdrop-blur-xl z-10">
                    <div className="relative">
                        <input 
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={isLoading ? "Menunggu balasan AI..." : "Ketik pesan Anda atau tekan Enter..."}
                            disabled={isLoading}
                            className="w-full pl-4 pr-14 py-3 border-2 border-blue-200/50 bg-white/95 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-md disabled:bg-blue-100 text-gray-800 placeholder-blue-500 text-sm font-medium"
                        />
                        <button 
                            onClick={handleSendMessage} 
                            disabled={!inputValue.trim() || isLoading} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 p-2.5 rounded-lg text-white hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed hover:scale-105 transform"
                        >
                            <SendIcon />
                        </button>
                    </div>
                    
                    {/* Quick Tips */}
                    <div className="mt-2 flex items-center justify-between text-xs text-blue-500">
                        <span>💡 Tips: Gunakan tombol quick actions untuk memudahkan</span>
                        <span className="flex items-center space-x-1">
                            <span>⌨️</span>
                            <span>Enter untuk kirim</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RBAPage;