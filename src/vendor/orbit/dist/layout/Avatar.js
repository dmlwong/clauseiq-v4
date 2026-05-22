'use client';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import { FaIcon, FA } from '../primitives/FaIcon';
import styles from './Avatar.module.css';
var sizeMap = {
    'Extra Small': 'var(--orbit-space-m)',
    Small: 'var(--orbit-space-l)',
    Medium: 'var(--orbit-space-xxl)',
    Large: 'var(--orbit-space-mega)',
};
var fontSizeMap = {
    'Extra Small': 'var(--orbit-text-xs)',
    Small: 'var(--orbit-text-xs)',
    Medium: 'var(--orbit-text-sm)',
    Large: 'var(--orbit-text-lg)',
};
export var Avatar = function (_a) {
    var _b = _a.style, style = _b === void 0 ? 'Text' : _b, _c = _a.size, size = _c === void 0 ? 'Medium' : _c, initials = _a.initials, name = _a.name, color = _a.color, src = _a.src, alt = _a.alt;
    var displayInitials = initials || name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    var className = clsx(styles.avatar, style === 'Square' && styles.square);
    var cssVars = {
        '--_size': sizeMap[size],
        '--_fontSize': fontSizeMap[size],
        '--_bg': color || 'var(--orbit-color-efficio-blue)',
    };
    if (style === 'Image' && src) {
        return (_jsx("img", { className: className, style: cssVars, src: src, alt: alt || name }));
    }
    if (style === 'Icon') {
        return (_jsx("div", { className: className, style: cssVars, title: name, role: "img", "aria-label": name, children: _jsx(FaIcon, { icon: FA.user, size: { 'Extra Small': 10, Small: 14, Medium: 20, Large: 28 }[size] || 20, color: "currentColor" }) }));
    }
    return (_jsx("div", { className: className, style: cssVars, title: name, role: "img", "aria-label": name, children: displayInitials }));
};
export var AvatarStack = function (_a) {
    var avatars = _a.avatars, _b = _a.max, max = _b === void 0 ? 3 : _b, size = _a.size;
    var visibleAvatars = avatars.slice(0, max);
    var hiddenCount = Math.max(avatars.length - visibleAvatars.length, 0);
    return (_jsxs("div", { className: styles.stack, "aria-label": "".concat(avatars.length, " avatars"), children: [visibleAvatars.map(function (avatar) {
                var _a;
                return (_jsx("span", { className: styles.stackItem, children: _jsx(Avatar, __assign({}, avatar, { size: size !== null && size !== void 0 ? size : avatar.size })) }, "".concat(avatar.name, "-").concat((_a = avatar.initials) !== null && _a !== void 0 ? _a : '')));
            }), hiddenCount > 0 && (_jsx("span", { className: styles.stackItem, children: _jsx(Avatar, { name: "".concat(hiddenCount, " more"), initials: "+".concat(hiddenCount), size: size !== null && size !== void 0 ? size : 'Medium' }) }))] }));
};
