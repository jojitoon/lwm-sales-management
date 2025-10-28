'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RequestBookFromMini } from '@/components/RequestBookFromMini';

interface RequestBookFromMiniButtonProps {
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
  className?: string;
}

export function RequestBookFromMiniButton({
  open: externalOpen,
  setOpen: externalSetOpen,
  trigger,
  variant = 'default',
  size = 'default',
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
          className={className}
        >
          Request Books from Mini Store
        </Button>
      )}
      <RequestBookFromMini open={open} setOpen={setOpen} />
    </>
  );
}
