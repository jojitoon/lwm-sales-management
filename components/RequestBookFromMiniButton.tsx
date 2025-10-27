'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RequestBookFromMini } from '@/components/RequestBookFromMini';

export function RequestBookFromMiniButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Request Books from Mini Store
      </Button>
      <RequestBookFromMini open={open} setOpen={setOpen} />
    </>
  );
}
