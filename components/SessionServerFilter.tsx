'use client';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon } from 'lucide-react';
import { sessionOptions } from '@/lib/constant';
import { usePathname, useRouter } from 'next/navigation';

export const SessionServerFilter = ({ session }: { session: string }) => {
  const router = useRouter();
  const pathname = usePathname();

  const setSession = (newSession: string) => {
    router.push(`${pathname}?session=${newSession}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className='ml-auto'>
          Filter by Session <ChevronDownIcon className='ml-2 h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuCheckboxItem
          key='all'
          className='capitalize'
          checked={session === 'All'}
          onCheckedChange={() => setSession('All')}>
          All
        </DropdownMenuCheckboxItem>
        {sessionOptions.map((item) => {
          return (
            <DropdownMenuCheckboxItem
              key={item}
              className='capitalize'
              checked={session === item}
              onCheckedChange={() => setSession(item)}>
              {item}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
