import { useState, useEffect } from "react";
import { Wifi, WifiOff, Cloud, CloudOff } from "lucide-react";
import { connectionManager } from "@/lib/offline";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
  variant?: 'badge' | 'inline' | 'fixed';
}

export function ConnectionStatus({
  className,
  showText = true,
  variant = 'badge'
}: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(connectionManager.isOnline);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const handleStatusChange = (status: boolean) => {
      setIsOnline(status);
      if (status) {
        setLastSync(new Date());
      }
    };

    connectionManager.addListener(handleStatusChange);

    // Set initial sync time if online
    if (connectionManager.isOnline) {
      setLastSync(new Date());
    }

    return () => {
      connectionManager.removeListener(handleStatusChange);
    };
  }, []);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  if (variant === 'fixed') {
    return (
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-white rounded-full px-3 py-1 shadow-md border">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs font-medium text-gray-700">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {isOnline ? (
          <>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <Wifi className="w-4 h-4 text-green-600" />
            </div>
            {showText && (
              <div className="text-sm">
                <span className="text-green-600 font-medium">Online</span>
                {lastSync && (
                  <span className="text-gray-500 ml-1">
                    • Sync: {formatLastSync(lastSync)}
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <WifiOff className="w-4 h-4 text-red-600" />
            </div>
            {showText && (
              <div className="text-sm">
                <span className="text-red-600 font-medium">Offline</span>
                <span className="text-gray-500 ml-1">• Modo local</span>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Default badge variant
  return (
    <Badge
      variant={isOnline ? "default" : "destructive"}
      className={cn(
        "flex items-center space-x-1 transition-all duration-200",
        isOnline ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200",
        className
      )}
    >
      {isOnline ? (
        <>
          <Cloud className="w-3 h-3" />
          {showText && <span>Online</span>}
        </>
      ) : (
        <>
          <CloudOff className="w-3 h-3" />
          {showText && <span>Offline</span>}
        </>
      )}
    </Badge>
  );
}
