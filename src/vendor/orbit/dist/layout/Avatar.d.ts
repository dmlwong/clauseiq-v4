import React from 'react';
export interface AvatarProps {
    style?: 'Text' | 'Image' | 'Icon' | 'Square';
    size?: 'Extra Small' | 'Small' | 'Medium' | 'Large';
    initials?: string;
    name: string;
    color?: string;
    src?: string;
    alt?: string;
}
export declare const Avatar: React.FC<AvatarProps>;
export interface AvatarStackProps {
    avatars: AvatarProps[];
    max?: number;
    size?: AvatarProps['size'];
}
export declare const AvatarStack: React.FC<AvatarStackProps>;
