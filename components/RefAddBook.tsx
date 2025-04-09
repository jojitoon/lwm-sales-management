'use client';

import { useState } from 'react';
import AddBook from './AddBook';
import { Button } from './ui/button';

const RefAddBook = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className='py-2'>
      <Button onClick={() => setOpen(true)}>Add Book</Button>
      <AddBook open={open} setOpen={setOpen} />
    </div>
  );
};

export default RefAddBook;
