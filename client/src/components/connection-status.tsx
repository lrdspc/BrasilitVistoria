import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { connectionStatus } from '@/lib/pwa';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(connectionStatus.isOnline);

  useEffect(() => {
    const handleConnectionChange = (online: boolean) => {
      setIsOnline(online);
    };

    connectionStatus.addListener(handleConnectionChange);
    return () => connectionStatus.removeListener(handleConnectionChange);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-white rounded-full px-3 py-1 shadow-md border">
      {isOnline ? (
        <>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-gray-700">Online</span>
        </>
      ) : (
        <>
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-xs font-medium text-gray-700">Offline</span>
        </>
      )}
    </div>
  );
}
