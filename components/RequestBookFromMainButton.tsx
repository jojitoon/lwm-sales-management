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
  className?: string;
}

export function RequestBookFromMainButton({
  open: externalOpen,
  setOpen: externalSetOpen,
  trigger,
  variant = 'default',
  size = 'default',
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
          className={className}
        >
          Request Books from Main Store
        </Button>
      )}
      <RequestBookFromMain open={open} setOpen={setOpen} />
    </>
  );
}
