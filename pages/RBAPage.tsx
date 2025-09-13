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

    // Focus input when component mounts
    useEffect(() => {
        inputRef.current?.focus();
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
                setTimeout(() => {
                    onBookingConfirmed(response.bookingData as any);
                }, 1000);
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
        <div className="min-h-screen bg-white flex items-center justify-center p-2">
            {/* Chat Container */}
            <div className="bg-white rounded-2xl shadow-lg h-[98vh] flex flex-col w-full max-w-6xl">
                {/* Chat Header */}
                <header className="p-3 border-b flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center">
                        <button 
                            onClick={() => onNavigate(Page.Dashboard)} 
                            className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <BackArrowIcon />
                        </button>
                        <AiIcon />
                        <div className="ml-3">
                            <h2 className="text-lg font-bold text-gray-800">Asisten AI Spacio</h2>
                            <p className="text-sm text-gray-500">Online</p>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 p-3 overflow-y-auto bg-white min-h-0">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex items-end ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
                            {message.sender === 'ai' && <div className="mr-3"><AiIcon /></div>}
                            
                            <div className={`max-w-2xl ${message.sender === 'user' ? 'text-right' : ''}`}>
                                <div className={`px-4 py-3 rounded-2xl inline-block shadow-md ${message.sender === 'user' ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                                    <p className="text-left" style={{ whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                                </div>
                                
                                {/* Options */}
                                {message.options && (
                                    <div className={`mt-2.5 flex flex-wrap gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {message.options.map((option, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleOptionClick(option)}
                                                className="bg-sky-100/80 border border-sky-200 text-sky-700 font-medium rounded-lg px-3 py-2 text-sm flex items-center hover:bg-sky-200/80 transition-colors shadow-sm"
                                            >
                                                {option === 'Pesan Ruangan' && (
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                )}
                                                {option === 'Bantuan' && (
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                )}
                                                {option}
                                            </button>
                                        ))}
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
                <div className="p-3 border-t bg-white rounded-b-2xl flex-shrink-0">
                    <div className="relative">
                        <input 
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={isLoading ? "Menunggu balasan AI..." : "Ketik pesan Anda atau tekan Enter..."}
                            disabled={isLoading}
                            className="w-full pl-5 pr-14 py-3 border border-gray-200 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-shadow disabled:bg-gray-100 text-black placeholder-gray-700"
                        />
                        <button 
                            onClick={handleSendMessage} 
                            disabled={!inputValue.trim() || isLoading} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 p-2.5 rounded-full text-white hover:bg-cyan-600 transition disabled:bg-cyan-300 disabled:cursor-not-allowed"
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