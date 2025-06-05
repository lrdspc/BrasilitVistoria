import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const ConnectionStatus = () => {
  const { syncStatus, isOnline, isOffline, isSyncing, hasPendingSync } = useOfflineSync();

  const getStatusColor = () => {
    if (isSyncing) return 'bg-blue-500';
    if (isOnline) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (isSyncing) return 'Sincronizando';
    if (isOnline) return 'Online';
    return 'Offline';
  };

  const getStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="w-3 h-3 animate-spin" />;
    if (isOnline) return <Wifi className="w-3 h-3" />;
    return <WifiOff className="w-3 h-3" />;
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-white rounded-full px-3 py-1 shadow-md border">
      <div className={cn('w-3 h-3 rounded-full flex items-center justify-center text-white', getStatusColor())}>
        {isSyncing ? null : <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
      {isSyncing && getStatusIcon()}
      <span className="text-xs font-medium text-gray-700">
        {getStatusText()}
        {hasPendingSync && !isSyncing && (
          <span className="ml-1 text-orange-600">({syncStatus.pendingCount})</span>
        )}
      </span>
    </div>
  );
};
