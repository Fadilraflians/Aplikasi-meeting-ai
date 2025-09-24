import React, { useState, useEffect } from 'react';
import { Page, User, Booking } from '../types';
import { BackArrowIcon } from '../components/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { ApiService } from '../src/config/api';

interface ProfilePageProps {
  onNavigate: (page: Page) => void;
  user: User;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, user }) => {
  const { t } = useLanguage();
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        setLoading(true);
        
        // Ambil data booking dari API
        let bookings = [];
        let aiBookings = [];
        
        try {
          const bookingsResponse = await ApiService.getUserBookings(user.id);
          bookings = bookingsResponse?.data || [];
          console.log('ProfilePage - Regular bookings:', bookings);
        } catch (error) {
          console.error('ProfilePage - Error fetching regular bookings:', error);
        }
        
        try {
          const aiBookingsResponse = await ApiService.getAIBookingsByUserId(user.id);
          aiBookings = aiBookingsResponse?.data || [];
          console.log('ProfilePage - AI bookings:', aiBookings);
        } catch (error) {
          console.error('ProfilePage - Error fetching AI bookings:', error);
        }
        
        // Gabungkan semua booking
        const allBookings = [...bookings, ...aiBookings];
        console.log('ProfilePage - All bookings combined:', allBookings);
        
        // Buat aktivitas dari data booking
        const activities = allBookings
          .filter(booking => booking.created_at || booking.date) // Pastikan ada tanggal
          .sort((a, b) => {
            const dateA = new Date(a.created_at || a.date);
            const dateB = new Date(b.created_at || b.date);
            return dateB.getTime() - dateA.getTime(); // Terbaru dulu
          })
          .slice(0, 4) // Ambil 4 terbaru
          .map((booking, index) => {
            const bookingDate = new Date(booking.created_at || booking.date);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - bookingDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let timeLabel = '';
            if (diffDays === 0) timeLabel = t('profile.today');
            else if (diffDays === 1) timeLabel = t('profile.yesterday');
            else if (diffDays <= 7) timeLabel = t('profile.daysAgo').replace('{days}', diffDays.toString());
            else timeLabel = t('profile.weeksAgo').replace('{weeks}', Math.ceil(diffDays / 7).toString());
            
            return {
              id: booking.id || `booking-${index}`,
              type: 'reservation',
              title: t('profile.roomReservation'),
              description: `${booking.roomName || booking.room_name || 'Meeting Room'} - ${booking.topic || booking.meeting_topic || 'Meeting'}`,
              time: timeLabel,
              icon: 'calendar',
              color: 'blue'
            };
          });
        
        console.log('ProfilePage - Generated activities:', activities);
        
        // Tambahkan aktivitas default jika tidak ada booking
        if (activities.length === 0) {
          activities.push(
            {
              id: 'default-1',
              type: 'profile',
              title: t('profile.updateProfile'),
              description: t('profile.profileUpdated'),
              time: t('profile.weekAgo'),
              icon: 'user',
              color: 'green'
            }
          );
        }
        
        setRecentActivities(activities);
      } catch (error) {
        console.error('Failed to fetch recent activities:', error);
        // Fallback ke aktivitas default
        setRecentActivities([
          {
            id: 'default-1',
            type: 'profile',
            title: t('profile.updateProfile'),
            description: t('profile.profileUpdated'),
            time: t('profile.weekAgo'),
            icon: 'user',
            color: 'green'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
    
    // Event listener untuk refresh activities ketika ada perubahan booking
    const handleRefreshActivities = () => {
      console.log('ProfilePage - Refreshing activities due to booking change');
      fetchRecentActivities();
    };
    
    window.addEventListener('refreshBookings', handleRefreshActivities);
    
    return () => {
      window.removeEventListener('refreshBookings', handleRefreshActivities);
    };
  }, [user.id, t]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header dengan design modern */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => onNavigate(Page.Dashboard)} 
                className="mr-4 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300"
              >
                <BackArrowIcon />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{t('profile.title')}</h2>
                <p className="text-gray-600 text-sm">{t('profile.subtitle')}</p>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Profile Header Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-40 h-40 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl ring-4 ring-white">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (user.fullName || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                {/* Status indicator */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              <h3 className="text-3xl font-bold text-gray-800 mb-2">{user.fullName || 'User'}</h3>
              <p className="text-gray-600 mb-4 text-lg">{user.email || 'user@example.com'}</p>
              
              <div className="flex justify-center gap-3 mb-6">
                <span className="px-6 py-2 bg-blue-500 text-white rounded-full text-sm font-semibold shadow-md">
                  {user.role || 'User'}
                </span>
                <span className="px-6 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-200">
                  ✓ {t('profile.active')}
                </span>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">{t('profile.reservations')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">8</div>
                  <div className="text-sm text-gray-600">{t('profile.completed')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">4</div>
                  <div className="text-sm text-gray-600">{t('profile.pending')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-800">{t('profile.personalInfo')}</h4>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">{t('profile.fullName')}</span>
                  <span className="font-semibold text-gray-800">{user.fullName || 'User'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">{t('profile.email')}</span>
                  <span className="font-semibold text-gray-800">{user.email || 'user@example.com'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">{t('profile.role')}</span>
                  <span className="font-semibold text-gray-800">{user.role || 'User'}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium">{t('profile.accountStatus')}</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">{t('profile.active')}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-800">{t('profile.recentActivity')}</h4>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('profile.loadingActivities')}</p>
                  </div>
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => {
                    const getIconAndColor = (iconType: string, color: string) => {
                      const colorClasses = {
                        blue: 'bg-blue-100 text-blue-600',
                        purple: 'bg-purple-100 text-purple-600',
                        yellow: 'bg-yellow-100 text-yellow-600',
                        green: 'bg-green-100 text-green-600',
                        orange: 'bg-orange-100 text-orange-600',
                        gray: 'bg-gray-100 text-gray-600'
                      };
                      
                      const timeColorClasses = {
                        blue: 'bg-blue-100 text-blue-700',
                        purple: 'bg-purple-100 text-purple-700',
                        yellow: 'bg-yellow-100 text-yellow-700',
                        green: 'bg-green-100 text-green-700',
                        orange: 'bg-orange-100 text-orange-700',
                        gray: 'bg-gray-100 text-gray-700'
                      };
                      
                      const iconSvg = {
                        calendar: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ),
                        user: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ),
                        check: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ),
                        warning: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        )
                      };
                      
                      return {
                        iconClass: colorClasses[color as keyof typeof colorClasses] || colorClasses.gray,
                        timeClass: timeColorClasses[color as keyof typeof timeColorClasses] || timeColorClasses.gray,
                        icon: iconSvg[iconType as keyof typeof iconSvg] || iconSvg.user
                      };
                    };
                    
                    const { iconClass, timeClass, icon } = getIconAndColor(activity.icon, activity.color);
                    const isLast = index === recentActivities.length - 1;
                    
                    return (
                      <div key={activity.id} className={`flex justify-between items-center py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex items-center flex-1">
                          <div className={`w-8 h-8 ${iconClass} rounded-lg flex items-center justify-center mr-3`}>
                            {icon}
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-600 font-medium block">{activity.title}</span>
                            <span className="text-gray-500 text-sm">{activity.description}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 ${timeClass} rounded-full text-sm font-semibold ml-3`}>
                          {activity.time}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">{t('profile.noRecentActivity')}</p>
                    <p className="text-gray-500 text-sm mt-1">{t('profile.startWithReservation')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => onNavigate(Page.Settings)}
              className="group p-6 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-2xl text-left transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-lg font-bold text-gray-800 mb-1">{t('profile.settings')}</h5>
                  <p className="text-gray-600">{t('profile.settingsDesc')}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onNavigate(Page.HelpCenter)}
              className="group p-6 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-2xl text-left transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-lg font-bold text-gray-800 mb-1">{t('profile.helpCenter')}</h5>
                  <p className="text-gray-600">{t('profile.helpCenterDesc')}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;


