import React from 'react';
export interface DropzoneProps {
    onFileSelected: (file: File) => void;
    accept?: string;
    disabled?: boolean;
    ariaLabel: string;
    chooseButtonLabel?: string;
    promptPrefix?: React.ReactNode;
    promptSuffix?: React.ReactNode;
    acceptedFileTypesLabel?: string;
    maxFileSizeLabel?: string;
    error?: React.ReactNode;
    icon?: React.ReactNode;
}
export declare const Dropzone: React.FC<DropzoneProps>;
