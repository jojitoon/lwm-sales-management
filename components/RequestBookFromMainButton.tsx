'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RequestBookFromMain } from '@/components/RequestBookFromMain';

export function RequestBookFromMainButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Request Books from Main Store
      </Button>
      <RequestBookFromMain open={open} setOpen={setOpen} />
    </>
  );
}
