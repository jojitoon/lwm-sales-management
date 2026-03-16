'use client';

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AccountCard,
  AccountCardBody,
  AccountCardFooter,
} from './AccountCard';
import { exportDatabase, importDatabase } from '@/lib/actions/settings';

export default function BackupRestore() {
  const [isExporting, startExport] = useTransition();
  const [isImporting, startImport] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleExport = () => {
    startExport(async () => {
      const result = await exportDatabase();
      if (!result?.success || !result.data) {
        toast.error('Failed to export database', {
          description: result?.error,
        });
        return;
      }

      try {
        const blob = new Blob([result.data], {
          type: 'application/json;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `lwm-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Database exported');
      } catch (e) {
        toast.error('Failed to download backup file');
      }
    });
  };

  const handleImport = () => {
    const input = fileInputRef.current;
    if (!input || !input.files || input.files.length === 0) {
      toast.error('Please select a backup file to import');
      return;
    }

    const file = input.files[0];
    setSelectedFileName(file.name);
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result?.toString() ?? '';
      startImport(async () => {
        const result = await importDatabase(text);
        if (result?.success) {
          toast.success('Database imported successfully');
        } else {
          toast.error('Failed to import database', {
            description: result?.error,
          });
        }
      });
    };

    reader.onerror = () => {
      toast.error('Failed to read backup file');
    };

    reader.readAsText(file);
  };

  return (
    <AccountCard
      params={{
        header: 'Export / Import',
        description:
          'Backup the entire database to a file and restore it later.',
      }}
    >
      <AccountCardBody>
        <div className='space-y-4'>
          <div>
            <h3 className='font-medium'>Export database</h3>
            <p className='text-sm text-muted-foreground'>
              Download a backup of all data as a JSON file. This can be
              imported later to restore the database to this state.
            </p>
          </div>
          <Button
            type='button'
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting…' : 'Export database'}
          </Button>
          <div className='pt-4 border-t'>
            <h3 className='font-medium'>Import database</h3>
            <p className='text-sm text-muted-foreground mb-2'>
              Restore the database from a previously exported JSON backup file.
              This will overwrite existing data.
            </p>
            <div className='flex items-center gap-3'>
              <input
                ref={fileInputRef}
                id='backup-file'
                type='file'
                accept='.json,application/json'
                className='hidden'
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setSelectedFileName(file.name);
                  } else {
                    setSelectedFileName(null);
                  }
                }}
              />
              <Button
                type='button'
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
              >
                Choose backup file
              </Button>
              <span className='text-sm text-muted-foreground truncate max-w-[220px]'>
                {selectedFileName ?? 'No file selected'}
              </span>
            </div>
          </div>
        </div>
      </AccountCardBody>
      <AccountCardFooter description='Importing will replace current data with the backup.'>
        <Button
          type='button'
          variant='secondary'
          onClick={handleImport}
          disabled={isImporting}
        >
          {isImporting ? 'Importing…' : 'Import from backup'}
        </Button>
      </AccountCardFooter>
    </AccountCard>
  );
}

