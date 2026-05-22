import React from 'react';
export interface DocumentGlyphProps {
    documentType?: 'XLS' | 'DOC' | 'PDF' | 'ZIP' | 'IMG' | 'Unknown';
    size?: 'Large' | 'Medium' | 'Small' | 'Extra Small' | 'Micro';
    ariaLabel?: string;
}
export declare const DocumentGlyph: React.FC<DocumentGlyphProps>;
