import { Wifi, WifiOff } from 'lucide-react';
import { useOffline } from '@/hooks/use-offline';

export function ConnectionIndicator() {
  const { isOnline, pendingSyncCount } = useOffline();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-white rounded-full px-3 py-1 shadow-md border">
      <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      <span className="text-xs font-medium text-gray-700">
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {pendingSyncCount > 0 && (
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
          {pendingSyncCount} pendente{pendingSyncCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
