import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-50 bg-red-600 text-white shadow-lg animate-in slide-in-from-top-4">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-3">
          <WifiOff className="h-5 w-5 animate-pulse" />
          <p className="font-bold text-sm">
            Estás desconectado. Verifica tu conexión a Internet para seguir navegando sin problemas.
          </p>
        </div>
      </div>
    </div>
  );
}
