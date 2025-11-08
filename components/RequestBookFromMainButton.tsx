'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RequestBookFromMain } from '@/components/RequestBookFromMain';

interface RequestBookFromMainButtonProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  trigger?: React.ReactNode;
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
}

export function RequestBookFromMainButton({
  open: externalOpen,
  setOpen: externalSetOpen,
  trigger,
  variant = 'default',
  size = 'default',
  disabled = false,
  className,
}: RequestBookFromMainButtonProps) {
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
          Request Books from Main Store
        </Button>
      )}
      <RequestBookFromMain open={open} setOpen={setOpen} />
    </>
  );
}
