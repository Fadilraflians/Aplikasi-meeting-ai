
import React, { useState, useRef, useEffect } from 'react';
import { Page, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import NotificationBell from './NotificationBell';

const UserProfileIcon: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => (
  <svg className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
  </svg>
);

const SettingsIcon: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => (
    <svg className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
);

const HelpIcon: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => (
  <svg className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4c-1.742 0-3.223-.835-3.772-2M12 18h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);

interface HeaderProps {
    onNavigate: (page: Page) => void;
    currentPage: Page;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();
    const { isDarkMode } = useDarkMode();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Get user data from localStorage instead of API
                const userDataStr = localStorage.getItem('user_data');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    setUserData(userData);
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const navItems = [
        { label: t('nav.dashboard'), page: Page.Dashboard },
        { label: t('nav.meetingRooms'), page: Page.MeetingRooms },
        { label: t('nav.reservations'), page: Page.Reservations },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className={`backdrop-blur-md shadow-md sticky top-4 mx-4 md:mx-8 rounded-xl z-50 ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <button onClick={() => onNavigate(Page.Dashboard)} className="flex items-center cursor-pointer group">
                    <img src="/images/logoIAC.png" alt="IAC Logo" className="h-10 md:h-12 w-auto mr-3 rounded-sm" />
                    <span className="text-3xl font-bold text-cyan-500 group-hover:text-cyan-600">Spacio</span>
                </button>
                <nav className="hidden md:flex items-center space-x-8">
                    {navItems.map(item => (
                        <button 
                            key={item.label} 
                            onClick={() => onNavigate(item.page)}
                            className={`text-lg font-medium transition ${currentPage === item.page ? 'text-cyan-500 border-b-2 border-cyan-500' : (isDarkMode ? 'text-gray-300 hover:text-cyan-500' : 'text-gray-600 hover:text-cyan-500')}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="flex items-center space-x-4">
                    {/* Notification Bell */}
                    <NotificationBell 
                        currentUser={userData?.full_name || userData?.username || 'Unknown User'}
                        onNotificationClick={() => {
                            // Navigate to cancel requests page
                            onNavigate(Page.CancelRequests);
                        }}
                    />
                    
                    {/* User Dropdown */}
                    <div className="relative">
                    <button onClick={() => setIsDropdownOpen(prev => !prev)} className={`flex items-center space-x-3 cursor-pointer p-2 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/50'}`}>
                        <div className="relative">
                            <img src={`https://i.pravatar.cc/150?u=${Date.now()}`} alt="User Avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-md" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{userData?.full_name || userData?.username || 'User'}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{userData?.username || 'Free Account'}</p>
                        </div>
                        <div className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>

                    {isDropdownOpen && (
                        <div ref={dropdownRef} className={`absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl border z-50 origin-top-right backdrop-blur-sm ${isDarkMode ? 'bg-gray-800/95 border-gray-600' : 'bg-white/95 border-gray-200'}`}>
                            {/* Profile Header */}
                            <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                <div className="flex items-center space-x-3">
                                    <img src={`https://i.pravatar.cc/150?u=${Date.now()}`} alt="User Avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-md" />
                                    <div>
                                        <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{userData?.full_name || userData?.username || 'User'}</p>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{userData?.username || 'Free Account'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Menu Items */}
                            <div className="py-2">
                                <button 
                                    onClick={() => {
                                        onNavigate(Page.Profile);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`flex items-center w-full text-left px-4 py-3 text-sm transition-all duration-200 group ${isDarkMode ? 'text-gray-200 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${isDarkMode ? 'bg-gray-700 group-hover:bg-blue-600' : 'bg-gray-100 group-hover:bg-blue-100'}`}>
                                        <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium">{t('nav.profile')}</span>
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        onNavigate(Page.Settings);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`flex items-center w-full text-left px-4 py-3 text-sm transition-all duration-200 group ${isDarkMode ? 'text-gray-200 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${isDarkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                                        <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium">{t('nav.settings')}</span>
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        onNavigate(Page.HelpCenter);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`flex items-center w-full text-left px-4 py-3 text-sm transition-all duration-200 group ${isDarkMode ? 'text-gray-200 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${isDarkMode ? 'bg-gray-700 group-hover:bg-green-600' : 'bg-gray-100 group-hover:bg-green-100'}`}>
                                        <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium">{t('nav.helpCenter')}</span>
                                </button>
                            </div>
                            
                            {/* Logout Section */}
                            <div className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}></div>
                            <button 
                                onClick={onLogout} 
                                className={`flex items-center w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200 group ${isDarkMode ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300' : 'text-red-600 hover:bg-red-50 hover:text-red-700'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${isDarkMode ? 'bg-gray-700 group-hover:bg-red-600' : 'bg-gray-100 group-hover:bg-red-100'}`}>
                                    <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                                <span className="font-medium">{t('nav.logout')}</span>
                            </button>
                        </div>
                    )}
                    </div>
                </div>
            </div>
        </header>
    );
};

interface MainLayoutProps {
    children: React.ReactNode;
    onNavigate: (page: Page) => void;
    currentPage: Page;
    onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, onNavigate, currentPage, onLogout }) => (
    <div className="min-h-screen bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700">
        <div className="relative">
            <div className="relative pt-4 z-30">
                <Header onNavigate={onNavigate} currentPage={currentPage} onLogout={onLogout} />
            </div>
            <main className="container mx-auto px-4 md:px-8 pt-8 pb-8">
                {children}
            </main>
        </div>
    </div>
);

export default MainLayout;
