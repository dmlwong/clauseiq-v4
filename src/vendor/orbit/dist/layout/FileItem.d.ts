import React from 'react';
import { type DocumentGlyphProps } from '../indicators/DocumentGlyph';
export interface FileItemProps {
    filename: string;
    documentType?: DocumentGlyphProps['documentType'];
    trailing?: React.ReactNode;
    onClick?: () => void;
    fixedWidth?: number;
}
export declare const FileItem: React.FC<FileItemProps>;
