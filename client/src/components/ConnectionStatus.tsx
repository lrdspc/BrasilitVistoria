import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { connectionManager } from "@/lib/offline";

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(connectionManager.isOnline);

  useEffect(() => {
    const handleStatusChange = (status: boolean) => {
      setIsOnline(status);
    };

    connectionManager.addListener(handleStatusChange);

    return () => {
      connectionManager.removeListener(handleStatusChange);
    };
  }, []);

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
