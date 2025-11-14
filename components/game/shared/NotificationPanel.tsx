// ============================================
// FILE: components/game/shared/NotificationPanel.tsx
// PURPOSE: Notification panel (all business types)
// RELATIONS: Uses gameStore notifications
// ============================================

'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function NotificationPanel() {
  const notifications = useGameStore((state) => state.notifications);
  const markNotificationRead = useGameStore((state) => state.markNotificationRead);
  const deleteNotification = useGameStore((state) => state.deleteNotification);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  const handleNotificationClick = (notificationId: string) => {
    markNotificationRead(notificationId);
    setSelectedNotification(notificationId);
  };
  
  const handleDelete = (notificationId: string) => {
    deleteNotification(notificationId);
    setSelectedNotification(null);
  };
  
  const handleCloseModal = () => {
    setSelectedNotification(null);
  };
  
  const selectedNotif = notifications.find((n) => n.id === selectedNotification);
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };
  
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  
  const getModalColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
      case 'warning': return 'border-yellow-500';
      default: return 'border-blue-500';
    }
  };
  
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };
  
  const formatFullTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="text-2xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <span className="text-sm text-gray-600">
                  {unreadCount} unread
                </span>
              </div>
              
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No notifications yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Game events will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        notification.read 
                          ? 'bg-white hover:bg-gray-50' 
                          : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg border ${getNotificationColor(notification.type)}`}>
                          <span className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {selectedNotif && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <div
              className={`bg-white rounded-lg shadow-xl max-w-md w-full border-t-4 ${getModalColor(selectedNotif.type)}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-lg border ${getNotificationColor(selectedNotif.type)}`}>
                    <span className="text-3xl">
                      {getNotificationIcon(selectedNotif.type)}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {selectedNotif.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatFullTime(selectedNotif.timestamp)}
                    </p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed">
                    {selectedNotif.message}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDelete(selectedNotif.id)}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}