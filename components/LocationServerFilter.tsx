'use client';
import React, { useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon } from 'lucide-react';
import { sessionOptions } from '@/lib/constant';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const getSearches = (search: any, others: string[]) => {
  const searches = [] as { [key: string]: string }[];
  others.forEach((key) => {
    if (search.get(key)) {
      searches.push({
        [key]: search.get(key),
      });
    }
  });
  return searches;
};

const generateSearchParams = (searches: { [key: string]: string }[]) => {
  const params = new URLSearchParams();
  searches.forEach((search) => {
    for (const key in search) {
      if (search.hasOwnProperty(key)) {
        params.append(key, search[key]);
      }
    }
  });
  return params.toString();
};

export const LocationServerFilter = ({
  location,
  locations,
  label,
  keyBy,
  otherKeys,
}: {
  location: string;
  locations: string[];
  label?: string;
  keyBy?: string;
  otherKeys?: string[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const searches = useMemo(() => {
    return getSearches(search, otherKeys || []);
  }, [search, otherKeys]);

  const setLocation = (newLocation: string) => {
    if (newLocation === 'All' && searches?.length === 0) {
      return router.push(pathname);
    }
    router.push(
      `${pathname}?${keyBy || 'location'}=${newLocation}${
        searches.length > 0 ? `&${generateSearchParams(searches)}` : ''
      }`
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className='ml-auto'>
          {label || 'Filter by Location '}
          <ChevronDownIcon className='ml-2 h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='overflow-auto max-h-[400px]'>
        <DropdownMenuCheckboxItem
          key='all'
          className='capitalize'
          checked={!location}
          onCheckedChange={() => setLocation('All')}>
          All
        </DropdownMenuCheckboxItem>
        {locations?.map((item) => {
          return (
            <DropdownMenuCheckboxItem
              key={item}
              className='capitalize'
              checked={location === item}
              onCheckedChange={() => setLocation(item)}>
              {item.replace(/_/g, ' ')}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
