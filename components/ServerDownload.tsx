'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { toSheet } from '@/lib/utils';

export const ServerDownload = ({
  data,
  name,
  isMultiple,
  label,
}: {
  data: any[];
  name: string;
  isMultiple?: boolean;
  label?: string;
}) => {
  const download = async () => {
    await toSheet(data, name, isMultiple);
  };

  return (
    <div>
      <Button onClick={download}>{label || 'Download Sheet'}</Button>
    </div>
  );
};
