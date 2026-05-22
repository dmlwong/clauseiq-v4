'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FaIcon, FA } from '../primitives/FaIcon';
export var Breadcrumb = function (_a) {
    var items = _a.items;
    var containerStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--orbit-space-xs)',
        fontSize: 'var(--orbit-text-small-size)',
        fontWeight: 'var(--orbit-text-small-weight)',
        fontFamily: 'var(--orbit-font-family-sans)',
        lineHeight: 'var(--orbit-text-small-leading)',
        flexWrap: 'wrap',
        listStyle: 'none',
        padding: 0,
        margin: 0,
    };
    var itemStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--orbit-space-xs)',
    };
    var linkStyles = {
        color: 'var(--orbit-color-text-secondary)',
        textDecoration: 'none',
        cursor: 'pointer',
    };
    var activeStyles = {
        color: 'var(--orbit-color-text-primary)',
        fontWeight: 'var(--orbit-font-weight-medium)',
    };
    var separatorStyles = {
        color: 'var(--orbit-color-text-disabled)',
        userSelect: 'none',
    };
    return (_jsx("nav", { "aria-label": "Breadcrumb", children: _jsx("ol", { style: containerStyles, children: items.map(function (item, index) { return (_jsxs("li", { style: itemStyles, children: [index > 0 && _jsx("span", { style: separatorStyles, "aria-hidden": "true", children: _jsx(FaIcon, { icon: FA.chevronRight, size: 10, color: "inherit" }) }), index === items.length - 1 ? (_jsx("span", { style: activeStyles, "aria-current": "page", children: item.label })) : (_jsx("a", { href: item.href || '#', style: linkStyles, children: item.label }))] }, item.id || "".concat(item.label, "-").concat(index))); }) }) }));
};
