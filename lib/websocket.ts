// WebSocket event emitter utility
// This allows API routes to emit events that will be broadcasted via Socket.io

import { EventEmitter } from 'events';

declare global {
  // eslint-disable-next-line no-var
  var io: any;
}

class WebSocketEventEmitter extends EventEmitter {
  emit(event: string, ...args: any[]): boolean {
    // Emit to local event emitter (for testing/local development)
    const result = super.emit(event, ...args);

    // The actual Socket.io server will pick this up via the global instance
    if (typeof global.io !== 'undefined' && global.io) {
      global.io.emit(event, ...args);
    }

    return result;
  }
}

export const wsEmitter = new WebSocketEventEmitter();

// Event types
export enum WebSocketEvents {
  BOOK_SALE_CREATED = 'book-sale-created',
  REQUEST_CREATED = 'request-created',
  REQUEST_APPROVED = 'request-approved',
  REQUEST_DENIED = 'request-denied',
  STOCK_UPDATED = 'stock-updated',
  BOOK_ADDED = 'book-added',
  BOOK_UPDATED = 'book-updated',
}
