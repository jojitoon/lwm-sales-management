'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/components/WebSocketProvider';
import { WebSocketEvents } from '@/lib/websocket';
import { useQueryClient } from '@tanstack/react-query';

interface UseRealtimeUpdatesOptions {
  events: WebSocketEvents[];
  queryKeys: string[];
  onEvent?: (event: WebSocketEvents, data: any) => void;
}

/**
 * Hook to subscribe to WebSocket events and automatically refetch queries
 */
export function useRealtimeUpdates({
  events,
  queryKeys,
  onEvent,
}: UseRealtimeUpdatesOptions) {
  const { socket, isConnected, subscribe, unsubscribe } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Subscribe to all events
    const eventHandlers = events.map((event) => {
      const handler = (data: any) => {
        console.log(`Received ${event}:`, data);

        // Handle STOCK_UPDATED events specially to invalidate correct query keys based on workspace
        if (event === WebSocketEvents.STOCK_UPDATED) {
          const workspace = data?.workspace;

          // Invalidate query keys based on workspace
          if (
            workspace === 'main-store' ||
            workspace === 'book-sales' ||
            workspace === 'table-manager'
          ) {
            queryClient.invalidateQueries({ queryKey: ['main-store-stock'] });
            queryClient.invalidateQueries({ queryKey: ['available-stock'] });
            queryClient.invalidateQueries({ queryKey: ['table-stock'] });
          }
          if (workspace === 'mini-store') {
            queryClient.invalidateQueries({ queryKey: ['mini-store-stock'] });
          }

          // Also invalidate table stock if sessionId is provided
          if (data?.sessionId) {
            queryClient.invalidateQueries({ queryKey: ['available-stock'] });
            queryClient.invalidateQueries({ queryKey: ['table-stock'] });
          }

          // Invalidate main store and mini store if both session IDs are provided (request approval)
          if (data?.mainStoreSessionId) {
            queryClient.invalidateQueries({ queryKey: ['main-store-stock'] });
            queryClient.invalidateQueries({ queryKey: ['table-stock'] });
          }
          if (data?.miniStoreSessionId) {
            queryClient.invalidateQueries({ queryKey: ['mini-store-stock'] });
          }
          if (data?.tableSaleSessionId) {
            queryClient.invalidateQueries({ queryKey: ['available-stock'] });
            queryClient.invalidateQueries({ queryKey: ['table-stock'] });
          }
          // Also invalidate table-stock when workspace is mini-store and tableSaleSessionId is provided (request approval)
          if (workspace === 'mini-store' && data?.tableSaleSessionId) {
            queryClient.invalidateQueries({ queryKey: ['table-stock'] });
          }
        }

        // Invalidate all specified query keys
        queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });

        // Call custom event handler if provided
        if (onEvent) {
          onEvent(event, data);
        }
      };

      socket.on(event, handler);
      return { event, handler };
    });

    // Cleanup: remove all event listeners
    return () => {
      eventHandlers.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
    };
  }, [socket, isConnected, events, queryKeys, onEvent, queryClient]);

  return { isConnected };
}
