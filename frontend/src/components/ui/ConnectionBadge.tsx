import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useChatStore } from '@/store/chatStore';

export function ConnectionBadge() {
  const status = useChatStore((s) => s.connectionStatus);
  return (
    <div
      className={clsx(
        'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        status === 'connected' &&
          'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
        status === 'connecting' &&
          'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        status === 'disconnected' &&
          'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      )}
    >
      {status === 'connected' && <Wifi size={11} />}
      {status === 'connecting' && <Loader2 size={11} className="animate-spin" />}
      {status === 'disconnected' && <WifiOff size={11} />}
      <span className="hidden sm:inline">
        {status === 'connected' ? 'Online' : status === 'connecting' ? 'Reconnecting' : 'Offline'}
      </span>
    </div>
  );
}
