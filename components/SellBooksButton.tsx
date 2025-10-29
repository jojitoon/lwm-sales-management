'use client';

import { useState } from 'react';
import { BookSalesForm } from '@/components/BookSalesForm';
import { IconCirclePlusFilled } from '@tabler/icons-react';
import { useMySession } from '@/hooks/data/useMySession';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SidebarMenuButton } from './ui/sidebar';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { WebSocketEvents } from '@/lib/websocket';

interface SellBooksButtonProps {
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function SellBooksButton({
  variant = 'default',
  size = 'default',
  className,
  children,
}: SellBooksButtonProps) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  const { data: mySession } = useMySession(userId);

  // Fetch available stock for the user's session
  const { data: availableStock = [] } = useQuery({
    queryKey: ['available-stock', mySession?.tableSaleSession?.id],
    queryFn: async () => {
      if (!mySession?.tableSaleSession?.id) return [];

      const response = await axios.get(`/api/books/main-store-stock`);
      return response.data;
    },
    enabled: !!mySession?.tableSaleSession?.id,
  });

  // Subscribe to real-time stock updates
  useRealtimeUpdates({
    events: [WebSocketEvents.STOCK_UPDATED, WebSocketEvents.BOOK_SALE_CREATED],
    queryKeys: ['available-stock'], // This will invalidate all available-stock queries
  });

  // Only show the button if user has book-sales workspace
  if (mySession?.workspace !== 'book-sales') {
    return null;
  }

  return (
    <BookSalesForm
      availableStock={availableStock}
      open={open}
      setOpen={setOpen}
      trigger={
        children || (
          <SidebarMenuButton
            tooltip='Sell Books'
            className='bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear w-full '
          >
            <IconCirclePlusFilled />
            <span>Sell Books</span>
          </SidebarMenuButton>
          //   <Button variant={variant} size={size} className={className}>
          //     <IconShoppingCart className='h-4 w-4 mr-2' />
          //     Sell Books
          //   </Button>
        )
      }
    />
  );
}
