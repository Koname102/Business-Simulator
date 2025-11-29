// ============================================
// FILE: components/ui/Toast.tsx
// PURPOSE: Toast notification component untuk validation errors
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function Toast() {
  const notifications = useGameStore((state) => state.notifications);
  const markNotificationRead = useGameStore((state) => state.markNotificationRead);
  const deleteNotification = useGameStore((state) => state.deleteNotification);
  
  const [visible, setVisible] = useState<string[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  // Show unread notifications
  useEffect(() => {
    const unread = notifications.filter((n) => !n.read && !processedIds.has(n.id)).slice(0, 3);
    
    if (unread.length === 0) return;
    
    setVisible((prev) => [...prev, ...unread.map((n) => n.id)]);
    
    // Mark as processed to prevent re-triggering
    setProcessedIds((prev) => new Set([...prev, ...unread.map((n) => n.id)]));
    
    // Auto-hide after 5 seconds
    unread.forEach((notification) => {
      setTimeout(() => {
        markNotificationRead(notification.id);
        setTimeout(() => {
          deleteNotification(notification.id);
          setVisible((prev) => prev.filter((id) => id !== notification.id));
          // Clean up processed IDs after deletion
          setTimeout(() => {
            setProcessedIds((prev) => {
              const next = new Set(prev);
              next.delete(notification.id);
              return next;
            });
          }, 1000);
        }, 300);
      }, 5000);
    });
  }, [notifications, processedIds, markNotificationRead, deleteNotification]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-white border-l-4 border-green-500 shadow-lg';
      case 'error':
        return 'bg-white border-l-4 border-red-500 shadow-lg';
      case 'warning':
        return 'bg-white border-l-4 border-yellow-500 shadow-lg';
      default:
        return 'bg-white border-l-4 border-blue-500 shadow-lg';
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read).slice(0, 3);

  if (unreadNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {unreadNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`
            ${getStyles(notification.type)}
            rounded-lg overflow-hidden pointer-events-auto
            transform transition-all duration-300 ease-out
            ${visible.includes(notification.id) ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            max-w-sm w-full
          `}
          style={{
            animation: visible.includes(notification.id) ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-out',
          }}
        >
          {/* Sunburst pattern background */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute inset-0" style={{
              background: `
                repeating-conic-gradient(
                  from 0deg at 50% 50%,
                  transparent 0deg,
                  currentColor 2deg,
                  transparent 4deg,
                  transparent 8deg
                )
              `,
            }} />
          </div>

          <div className="relative p-4 flex items-start space-x-3">
            {getIcon(notification.type)}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
            </div>

            <button
              onClick={() => {
                markNotificationRead(notification.id);
                setTimeout(() => deleteNotification(notification.id), 300);
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-200 overflow-hidden">
            <div 
              className={`h-full ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'error' ? 'bg-red-500' :
                notification.type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{
                animation: 'progress 5s linear forwards',
              }}
            />
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}