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
                options: response.quickActions?.map(qa => qa.label)
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
                
                // Validate data before sending
                const hasValidData = response.bookingData.roomName && 
                                   response.bookingData.topic && 
                                   response.bookingData.pic && 
                                   response.bookingData.date && 
                                   response.bookingData.time && 
                                   response.bookingData.participants && 
                                   response.bookingData.meetingType;
                
                if (hasValidData) {
                    console.log('✅ RBAPage - All booking data is valid, proceeding to confirmation');
                    setTimeout(() => {
                        onBookingConfirmed(response.bookingData as any);
                    }, 1000);
                } else {
                    console.log('❌ RBAPage - Booking data is incomplete, not proceeding to confirmation');
                    console.log('❌ RBAPage - Missing fields:', {
                        roomName: !response.bookingData.roomName,
                        topic: !response.bookingData.topic,
                        pic: !response.bookingData.pic,
                        date: !response.bookingData.date,
                        time: !response.bookingData.time,
                        participants: !response.bookingData.participants,
                        meetingType: !response.bookingData.meetingType
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
        if (option === 'Pesan Ruangan') {
            onNavigate(Page.Booking);
        } else if (option === 'Bantuan') {
            onNavigate(Page.HelpCenter);
        } else {
            // Handle quick actions from AI
            if (assistant) {
                try {
                    setIsLoading(true);
                    const response = await assistant.handleQuickAction(option);
                    
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
                        setTimeout(() => {
                            onBookingConfirmed(response.bookingData as any);
                        }, 1000);
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
                setInputValue(option);
                handleSendMessage();
            }
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
            {/* Background Image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/images/view.jpeg)'}}></div>
            
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
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/images/view.jpeg)'}}></div>
                
                {/* Overlay untuk kontras yang lebih baik */}
                <div className="absolute inset-0 bg-white/25 backdrop-blur-sm"></div>
                {/* Chat Header */}
                <header className="relative p-5 border-b border-blue-200/50 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 backdrop-blur-xl z-10">
                    <div className="flex items-center">
                        <button 
                            onClick={() => onNavigate(Page.Dashboard)} 
                            className="mr-4 p-3 rounded-full hover:bg-blue-200 transition-all duration-300 text-blue-700 hover:text-blue-900"
                        >
                            <BackArrowIcon />
                        </button>
                        <AiIcon />
                        <div className="ml-3">
                            <h2 className="text-xl font-bold text-blue-800">Asisten AI Spacio</h2>
                            <p className="text-sm text-blue-600">Online</p>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="relative flex-1 p-6 overflow-y-auto min-h-0 backdrop-blur-sm z-10">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex items-end ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
                            {message.sender === 'ai' && <div className="mr-3"><AiIcon /></div>}
                            
                            <div className={`max-w-2xl ${message.sender === 'user' ? 'text-right' : ''}`}>
                                <div className={`px-6 py-5 rounded-3xl inline-block shadow-lg backdrop-blur-sm ${message.sender === 'user' ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-br-none border border-blue-400/30 shadow-blue-500/25' : 'bg-white/90 text-gray-800 rounded-bl-none border border-blue-200/50 shadow-blue-200/50 backdrop-blur-sm'}`}>
                                    <p className="text-left" style={{ whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                                </div>
                                
                                {/* Options */}
                                {message.options && (
                                    <div className={`mt-3 flex flex-wrap gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {message.options.map((option, index) => {
                                            // Determine button style based on option type
                                            const isPrimary = option.includes('Booking') || option.includes('Ya') || option.includes('Pesan');
                                            const isSecondary = option.includes('Tidak') || option.includes('Batal') || option.includes('Lihat');
                                            const isHelp = option.includes('Bantuan') || option.includes('Help');
                                            
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => handleOptionClick(option)}
                                                    className={`
                                                        font-medium rounded-xl px-4 py-2.5 text-sm flex items-center 
                                                        transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105
                                                        ${isPrimary 
                                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border border-blue-400 hover:from-blue-600 hover:to-indigo-600' 
                                                            : isSecondary 
                                                            ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300 hover:from-gray-200 hover:to-gray-300'
                                                            : isHelp
                                                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-300 hover:from-green-200 hover:to-emerald-200'
                                                            : 'bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 border border-sky-300 hover:from-sky-200 hover:to-blue-200'
                                                        }
                                                    `}
                                                >
                                                    {/* Icons for different options */}
                                                    {(option.includes('Pesan') || option.includes('Booking')) && (
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                    {(option.includes('Bantuan') || option.includes('Help')) && (
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                    {(option.includes('Ya') || option.includes('Confirm')) && (
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                    {(option.includes('Tidak') || option.includes('Batal')) && (
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                    {(option.includes('Lihat') || option.includes('View')) && (
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    )}
                                                    {option}
                                                </button>
                                            );
                                        })}
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
                <div className="relative p-6 border-t border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 flex-shrink-0 backdrop-blur-xl z-10">
                    <div className="relative">
                        <input 
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={isLoading ? "Menunggu balasan AI..." : "Ketik pesan Anda atau tekan Enter..."}
                            disabled={isLoading}
                            className="w-full pl-6 pr-16 py-5 border-2 border-blue-200/50 bg-white/95 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-lg disabled:bg-blue-100 text-gray-800 placeholder-blue-500 text-lg font-medium"
                        />
                        <button 
                            onClick={handleSendMessage} 
                            disabled={!inputValue.trim() || isLoading} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-xl text-white hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed hover:scale-105 transform"
                        >
                            <SendIcon />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RBAPage;