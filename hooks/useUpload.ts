import { useState } from 'react';
import { DropzoneOptions, FileRejection, useDropzone } from 'react-dropzone';
export interface UseUploadOption extends DropzoneOptions {
  url?: string;
}

export enum FileTypes {
  image = 'image',
  video = 'video',
}

export interface FileValidationOptions extends UseUploadOption {
  files: IFile[];
  filesToValidate: IFile[];
}

export interface IUseUploadOption extends UseUploadOption {
  validateFile?: (options: FileValidationOptions) => string;
  initialFiles?: IFile[];
  onChange?: (files: IFile[]) => void;
  onErrored?: (error: string) => void;
}

export interface IFile {
  file?: File;
  preview: string;
  binary?: ArrayBuffer;
  fileType?: FileTypes;
}

export const useUpload = ({
  maxFiles,
  validateFile,
  initialFiles = [],
  onChange,
  onErrored,
  ...rest
}: IUseUploadOption) => {
  const [files, setFiles] = useState<IFile[]>(initialFiles);

  const handleFileRejection = (fileRejections: FileRejection[]) => {
    const rejectionError = fileRejections.find(({ errors }) => errors[0].code);

    if (!rejectionError) return;

    const { code, message } = rejectionError.errors[0] || {};

    const errorMessage =
      code === 'too-many-files'
        ? `You can only upload ${maxFiles} file${
            (maxFiles || 1) > 1 ? 's' : ''
          }`
        : code === 'file-too-large'
        ? `Your file must not exceed ${(rest.maxSize || 0) / 1024 / 1024}MB`
        : message;

    onErrored?.(errorMessage);
  };

  const getAcceptedFilesErrorMessage = (acceptedFiles: File[]) => {
    return maxFiles && [...files, ...acceptedFiles].length > maxFiles
      ? `You can only upload ${maxFiles} files`
      : validateFile?.({
          files,
          filesToValidate: acceptedFiles.map((f) => ({
            file: f,
            preview: URL.createObjectURL(f),
            fileType: f.type.split('/')[0] as FileTypes,
          })),
          maxFiles,
          ...rest,
        });
  };

  const handleAcceptedFiles = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      const preview = URL.createObjectURL(file);

      reader.onabort = () => console.log('file reading was aborted');
      reader.onerror = () => console.log('file reading has failed');

      reader.onload = (event) => {
        const fileType = file.type.split('/')[0] as FileTypes;
        const binary = event.target?.result;

        const newFile: IFile = {
          file,
          binary: binary as ArrayBuffer,
          fileType,
          preview,
        };

        setFiles((prev) => {
          const newFiles = [...prev, newFile];
          onChange?.(newFiles);
          return newFiles;
        });
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDrop: DropzoneOptions['onDrop'] = (
    acceptedFiles,
    fileRejections
  ) => {
    if (fileRejections.length) return handleFileRejection(fileRejections);

    const errorMessage = getAcceptedFilesErrorMessage(acceptedFiles);
    if (errorMessage) return onErrored?.(errorMessage);

    handleAcceptedFiles(acceptedFiles);
  };

  const removeFile = (preview: string) => {
    const newFiles = files.filter((f) => f.preview !== preview);

    setFiles(newFiles);
    onChange?.(newFiles);
  };

  const clearFiles = () => {
    setFiles([]);
    onChange?.([]);
  };

  const dropzoneState = useDropzone({
    onDrop: handleDrop,
    maxFiles,
    ...rest,
  });

  return {
    ...dropzoneState,
    files,
    removeFile,
    clearFiles,
  };
};
