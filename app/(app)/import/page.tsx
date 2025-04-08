'use client';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from '@/components/ui/file-input';
import { Paperclip } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';
import { DropzoneOptions } from 'react-dropzone';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { parseSheet } from '@/lib/utils';
import { uploadSheetAction } from '@/lib/actions/orders';
import { toast } from 'sonner';
import { CSV_FILE, XLSX_FILE, XLS_FILE } from '@/lib/constant';

const FileSvgDraw = () => {
  return (
    <>
      <svg
        className='w-8 h-8 mb-3 text-gray-500 dark:text-gray-400'
        aria-hidden='true'
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 20 16'
      >
        <path
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
        />
      </svg>
      <p className='mb-1 text-sm text-gray-500 dark:text-gray-400'>
        <span className='font-semibold'>Click to upload</span>
        &nbsp; or drag and drop
      </p>
      <p className='text-xs text-gray-500 dark:text-gray-400'>
        XLSX, XLS, or CSV
      </p>
    </>
  );
};

export default function ImportPage() {
  const [files, setFiles] = useState<File[] | null>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadState, uploadAction, isPending] = useActionState(
    uploadSheetAction,
    {
      uploaded: false,
    }
  );

  useEffect(() => {
    if (uploadState.error) {
      toast.error(uploadState.error);
    } else if (uploadState.uploaded) {
      toast.success('Sheet Uploaded');
    }
  }, [uploadState]);

  const onSubmit = async () => {
    if (!files) return;
    setIsLoading(true);
    const reader = new FileReader();

    reader.onabort = () => {
      console.log('file reading was aborted');
      setIsLoading(false);
    };
    reader.onerror = () => {
      console.log('file reading has failed');
      setIsLoading(false);
    };

    reader.onload = (event) => {
      const binary = event.target?.result;
      if (binary) {
        const result = parseSheet(binary as ArrayBuffer);
        console.log(result);
        uploadAction(result);
      } else {
        toast.error('Error occurred while parsing');
      }
      setIsLoading(false);
      setIsOpen(false);
    };
    reader.readAsArrayBuffer(files[0]);
  };

  const dropZoneConfig = {
    maxFiles: 1,
    // maxSize: MAX_FILE_SIZE,
    noDragEventsBubbling: true,
    // validateFile: validateCSVFiles,
    accept: {
      [CSV_FILE]: [],
      [XLSX_FILE]: [],
      [XLS_FILE]: [],
    },
  } satisfies DropzoneOptions;

  return (
    <main className='px-4 lg:px-6'>
      <h1 className='text-2xl font-bold my-2'>Process Preorder Sheet Data</h1>
      <Drawer
        open={isOpen}
        onClose={() => {
          setFiles([]);
        }}
      >
        <DrawerTrigger asChild>
          <Button variant='outline' onClick={() => setIsOpen(true)}>
            Import Sheet
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className='mx-auto w-full max-w-md'>
            <DrawerHeader>
              <DrawerTitle>Import Sheet</DrawerTitle>
              <DrawerDescription>
                Import a sheet of preorder sales data from a CSV, XLSX, or XLS
                file.
              </DrawerDescription>
            </DrawerHeader>
            <div className='p-4 pb-0'>
              <FileUploader
                value={files}
                onValueChange={setFiles}
                dropzoneOptions={dropZoneConfig}
                className='relative bg-background rounded-lg p-2'
              >
                <FileInput className='outline-dashed outline-1 outline-white'>
                  <div className='flex items-center justify-center flex-col pt-3 pb-4 w-full '>
                    <FileSvgDraw />
                  </div>
                </FileInput>
                <FileUploaderContent>
                  {files &&
                    files.length > 0 &&
                    files.map((file, i) => (
                      <FileUploaderItem key={i} index={i}>
                        <Paperclip className='h-4 w-4 stroke-current' />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span>{truncateFileName(file.name)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{file.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FileUploaderItem>
                    ))}
                </FileUploaderContent>
              </FileUploader>
            </div>
            <DrawerFooter>
              <Button onClick={onSubmit}>
                {isLoading || isPending ? 'Processing...' : 'Process'}
              </Button>
              <DrawerClose asChild>
                <Button variant='outline' onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  );
}

const truncateFileName = (name: string) => {
  if (name.length > 20) {
    return `${name.substring(0, 25)}...${name.substring(name.length - 10)}`;
  }
  return name;
};
