'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useWebSocket } from '@/components/WebSocketProvider';
import { WebSocketEvents } from '@/lib/websocket';
import { toast } from 'sonner';
import { useMySession } from '@/hooks/data/useMySession';
import { useSession } from 'next-auth/react';

/**
 * Global component that listens for new request events and shows notifications
 * when the user is not on the request pages
 */
export function RequestNotificationListener() {
  const { socket, isConnected } = useWebSocket();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  const { data: mySession } = useMySession(userId);
  const workspace = mySession?.workspace;

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handler for request created events
    const handleRequestCreated = (data: any) => {
      const requestType = data?.type; // 'mini-store' or 'main-store'

      if (requestType === 'mini-store' && workspace === 'mini-store') {
        // Mini-store request: table requesting from mini store
        // Only show notification if not on the mini-store request page
        if (!pathname?.includes('/requests-mini-store')) {
          const totalItems = data?.totalItems || 0;
          const totalQuantity = data?.totalQuantity || 0;

          let message = 'New request from table';
          if (data?.tableSaleSessionId) {
            message += ` (Session: ${data.tableSaleSessionId.substring(
              0,
              8
            )}...)`;
          }

          toast.info(message, {
            description: `${totalItems} item${
              totalItems !== 1 ? 's' : ''
            } • ${totalQuantity} unit${totalQuantity !== 1 ? 's' : ''}`,
            action: {
              label: 'View',
              onClick: () => router.push('/requests-mini-store'),
            },
            duration: 10000, // Show for 10 seconds
          });
        }
      } else if (requestType === 'main-store' && workspace === 'main-store') {
        // Main-store request: mini store requesting from main store
        // Only show notification if not on the main-store request page
        if (!pathname?.includes('/requests-main-store')) {
          const totalItems = data?.totalItems || 0;
          const totalQuantity = data?.totalQuantity || 0;

          let message = 'New request from mini store';
          if (data?.miniStoreSessionId) {
            message += ` (Session: ${data.miniStoreSessionId.substring(
              0,
              8
            )}...)`;
          }

          toast.info(message, {
            description: `${totalItems} item${
              totalItems !== 1 ? 's' : ''
            } • ${totalQuantity} unit${totalQuantity !== 1 ? 's' : ''}`,
            action: {
              label: 'View',
              onClick: () => router.push('/requests-main-store'),
            },
            duration: 10000, // Show for 10 seconds
          });
        }
      }
    };

    // Subscribe to request created events
    socket.on(WebSocketEvents.REQUEST_CREATED, handleRequestCreated);

    // Cleanup
    return () => {
      socket.off(WebSocketEvents.REQUEST_CREATED, handleRequestCreated);
    };
  }, [socket, isConnected, pathname, router]);

  // This component doesn't render anything
  return null;
}
