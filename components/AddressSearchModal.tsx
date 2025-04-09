import { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface AddressResult {
  id: string;
  place_name: string;
  center: [number, number];
}

interface AddressSearchModalProps {
  onSelect: (address: AddressResult) => void;
  value?: AddressResult;
}

const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function AddressSearchModal({
  onSelect,
  value,
}: AddressSearchModalProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: results, isLoading } = useQuery({
    queryKey: ['address-search', search],
    queryFn: async () => {
      if (!search) return [];
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          search
        )}.json?access_token=${MAPBOX_API_KEY}&country=BR`
      );
      return response.data.features.map((feature: any) => ({
        id: feature.id,
        place_name: feature.place_name,
        center: feature.center,
      }));
    },
    enabled: search.length > 2,
  });

  const handleSelect = useCallback(
    (result: AddressResult) => {
      onSelect(result);
      setOpen(false);
      setSearch('');
    },
    [onSelect]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='w-full justify-start text-left font-normal'
        >
          {value?.place_name || 'Search address...'}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <div className='grid gap-4'>
          <Input
            placeholder='Type to search address...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ScrollArea className='h-[300px] w-full rounded-md border'>
            {isLoading ? (
              <div className='p-4 text-center'>Loading...</div>
            ) : (
              <div className='p-4'>
                {results?.map((result: AddressResult) => (
                  <Button
                    key={result.id}
                    variant='ghost'
                    className='w-full justify-start text-left'
                    onClick={() => handleSelect(result)}
                  >
                    {result.place_name}
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
