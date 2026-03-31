'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RequestBookFromMini } from '@/components/RequestBookFromMini';

interface RequestBookFromMiniButtonProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function RequestBookFromMiniButton({
  open: externalOpen,
  setOpen: externalSetOpen,
  trigger,
  variant = 'default',
  size = 'default',
  disabled = false,
  className,
}: RequestBookFromMiniButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalSetOpen || setInternalOpen;

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className='cursor-pointer'>
          {trigger}
        </div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          variant={variant}
          size={size}
          disabled={disabled}
          className={className}
          title={
            disabled
              ? 'Stock has been closed. No new requests can be made.'
              : ''
          }
        >
          Request Books from Mini Store
        </Button>
      )}
      <RequestBookFromMini open={open} setOpen={setOpen} />
    </>
  );
}
