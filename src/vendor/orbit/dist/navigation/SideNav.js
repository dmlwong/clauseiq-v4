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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FaIcon } from '../primitives/FaIcon';
import styles from './SideNav.module.css';
var EMPTY_NAV_ITEMS = [];
var EMPTY_SECTIONS = [];
var EMPTY_WORK_ITEMS = [];
function RowPrimitive(_a) {
    var href = _a.href, onClick = _a.onClick, className = _a.className, children = _a.children, ariaLabel = _a.ariaLabel, ariaCurrent = _a.ariaCurrent;
    if (href) {
        return (_jsx("a", { href: href, onClick: onClick, className: className, "aria-label": ariaLabel, "aria-current": ariaCurrent, children: children }));
    }
    if (onClick) {
        return (_jsx("button", { type: "button", onClick: onClick, className: className, "aria-label": ariaLabel, "aria-current": ariaCurrent, children: children }));
    }
    return (_jsx("div", { className: className, "aria-label": ariaLabel, "aria-current": ariaCurrent, children: children }));
}
function NavItemRow(_a) {
    var icon = _a.icon, label = _a.label, active = _a.active, badge = _a.badge, href = _a.href, onClick = _a.onClick, ariaLabel = _a.ariaLabel;
    return (_jsxs(RowPrimitive, { href: href, onClick: onClick, ariaLabel: ariaLabel, ariaCurrent: active ? 'page' : undefined, className: clsx(styles.row, styles.navRow, active && styles.active, (href || onClick) && styles.interactive), children: [_jsx("span", { className: styles.iconSlot, "aria-hidden": "true", children: _jsx(FaIcon, { icon: icon, size: 12, color: "currentColor" }) }), _jsx("span", { className: styles.rowLabel, children: label }), badge !== undefined && _jsx("span", { className: styles.badge, children: badge })] }));
}
function SectionRow(_a) {
    var _b;
    var section = _a.section, expanded = _a.expanded, onToggle = _a.onToggle;
    var hasChildren = Boolean((_b = section.items) === null || _b === void 0 ? void 0 : _b.length);
    var showChevron = hasChildren || section.showChevron;
    var togglesSection = hasChildren || section.showChevron;
    var handleToggle = function () {
        var _a;
        onToggle();
        (_a = section.onClick) === null || _a === void 0 ? void 0 : _a.call(section);
    };
    var rowContents = (_jsxs(_Fragment, { children: [_jsx("span", { className: styles.sectionDot, style: { '--section-color': section.color }, "aria-hidden": "true" }), _jsx("span", { className: styles.rowLabel, children: section.label }), showChevron && (_jsx("span", { className: clsx(styles.chevron, expanded && styles.chevronExpanded), "aria-hidden": "true", children: _jsx(FaIcon, { icon: '\uf078', size: 12, color: "currentColor" }) }))] }));
    if (togglesSection) {
        return (_jsx("button", { type: "button", className: clsx(styles.row, styles.sectionRow, styles.interactive), "aria-expanded": hasChildren ? expanded : undefined, "aria-label": section.ariaLabel, onClick: handleToggle, children: rowContents }));
    }
    return (_jsx(RowPrimitive, { href: section.href, onClick: section.onClick, ariaLabel: section.ariaLabel, className: clsx(styles.row, styles.sectionRow, (section.href || section.onClick) && styles.interactive), children: rowContents }));
}
function SubItemRow(_a) {
    var icon = _a.icon, label = _a.label, active = _a.active, muted = _a.muted, href = _a.href, onClick = _a.onClick, ariaLabel = _a.ariaLabel;
    return (_jsxs(RowPrimitive, { href: href, onClick: onClick, ariaLabel: ariaLabel, ariaCurrent: active ? 'page' : undefined, className: clsx(styles.row, styles.subItem, active && styles.active, muted && styles.muted, (href || onClick) && styles.interactive), children: [_jsx("span", { className: styles.iconSlot, "aria-hidden": "true", children: _jsx(FaIcon, { icon: icon, size: 12, color: "currentColor" }) }), _jsx("span", { className: styles.rowLabel, children: label })] }));
}
function WorkItemRow(_a) {
    var title = _a.title, subtitle = _a.subtitle, active = _a.active, href = _a.href, onClick = _a.onClick, ariaLabel = _a.ariaLabel;
    return (_jsxs(RowPrimitive, { href: href, onClick: onClick, ariaLabel: ariaLabel, ariaCurrent: active ? 'page' : undefined, className: clsx(styles.workItem, active && styles.active, (href || onClick) && styles.interactive), children: [_jsx("span", { className: styles.workTitle, children: title }), _jsx("span", { className: styles.workSubtitle, children: subtitle })] }));
}
/* ─── Main Component ─── */
export var SideNav = function (_a) {
    var appName = _a.appName, clientName = _a.clientName, width = _a.width, _b = _a.logoIcon, logoIcon = _b === void 0 ? '\uf890' : _b, _c = _a.clientChevronIcon, clientChevronIcon = _c === void 0 ? '\uf078' : _c, _d = _a.navItems, navItems = _d === void 0 ? EMPTY_NAV_ITEMS : _d, _e = _a.sections, sections = _e === void 0 ? EMPTY_SECTIONS : _e, _f = _a.workItems, workItems = _f === void 0 ? EMPTY_WORK_ITEMS : _f, _g = _a.workHeading, workHeading = _g === void 0 ? 'My Work' : _g, _h = _a.workSearchIcon, workSearchIcon = _h === void 0 ? '\uf002' : _h, _j = _a.workSearchAriaLabel, workSearchAriaLabel = _j === void 0 ? 'Search work' : _j, onWorkSearch = _a.onWorkSearch, userName = _a.userName, userInitials = _a.userInitials, _k = _a.profileMenuIcon, profileMenuIcon = _k === void 0 ? '\uf141' : _k, _l = _a.profileMenuAriaLabel, profileMenuAriaLabel = _l === void 0 ? 'Open profile menu' : _l, onProfileMenu = _a.onProfileMenu, _m = _a.ariaLabel, ariaLabel = _m === void 0 ? 'Main navigation' : _m;
    var _o = useState(function () { return Object.fromEntries(sections.map(function (section) { var _a; return [section.id, (_a = section.expanded) !== null && _a !== void 0 ? _a : false]; })); }), expandedSections = _o[0], setExpandedSections = _o[1];
    useEffect(function () {
        setExpandedSections(function (prev) { return (__assign({}, Object.fromEntries(sections.map(function (section) { var _a, _b; return [section.id, (_b = (_a = prev[section.id]) !== null && _a !== void 0 ? _a : section.expanded) !== null && _b !== void 0 ? _b : false]; })))); });
    }, [sections]);
    var toggleSection = function (id) {
        setExpandedSections(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[id] = !prev[id], _a)));
        });
    };
    var sideNavStyle = width === undefined
        ? undefined
        : { '--sidenav-width': "".concat(width, "px") };
    return (_jsxs("aside", { role: "navigation", "aria-label": ariaLabel, className: styles.sideNav, style: sideNavStyle, children: [_jsxs("div", { className: styles.topGroup, children: [_jsxs("div", { className: styles.header, children: [_jsx("span", { className: styles.logo, "aria-hidden": "true", children: _jsx(FaIcon, { icon: logoIcon, size: 16, color: "currentColor" }) }), _jsxs("div", { className: styles.product, children: [_jsx("span", { className: styles.appName, children: appName }), _jsxs("span", { className: styles.clientName, children: [clientName, _jsx("span", { className: styles.clientChevron, "aria-hidden": "true", children: _jsx(FaIcon, { icon: clientChevronIcon, size: 8, color: "currentColor" }) })] })] })] }), _jsx("div", { className: styles.navList, children: navItems.map(function (item) { return (_jsx(NavItemRow, __assign({}, item), item.id)); }) })] }), _jsx("div", { className: styles.divider }), _jsx("div", { className: styles.sectionList, children: sections.map(function (section) {
                    var _a, _b;
                    var expanded = (_a = expandedSections[section.id]) !== null && _a !== void 0 ? _a : false;
                    return (_jsxs("div", { className: styles.sectionGroup, children: [_jsx(SectionRow, { section: section, expanded: expanded, onToggle: function () { return toggleSection(section.id); } }), expanded && ((_b = section.items) === null || _b === void 0 ? void 0 : _b.length) ? (_jsx("div", { className: styles.subItemList, children: section.items.map(function (item) { return (_jsx(SubItemRow, __assign({}, item), item.id)); }) })) : null] }, section.id));
                }) }), _jsx("div", { className: styles.divider }), _jsxs("div", { className: styles.workRegion, children: [_jsxs("div", { className: styles.workHeader, children: [_jsx("div", { className: styles.workHeading, children: _jsx("span", { children: workHeading }) }), onWorkSearch ? (_jsx("button", { type: "button", className: styles.workTools, "aria-label": workSearchAriaLabel, onClick: onWorkSearch, children: _jsx("span", { className: styles.iconSlot, "aria-hidden": "true", children: _jsx(FaIcon, { icon: workSearchIcon, size: 12, color: "currentColor" }) }) })) : (_jsx("span", { className: styles.workTools, "aria-hidden": "true", children: _jsx("span", { className: styles.iconSlot, children: _jsx(FaIcon, { icon: workSearchIcon, size: 12, color: "currentColor" }) }) }))] }), _jsx("div", { className: styles.workList, children: workItems.map(function (item) { return (_jsx(WorkItemRow, __assign({}, item), item.id)); }) })] }), _jsxs("div", { className: styles.profile, children: [_jsx("div", { className: styles.profileDivider }), _jsxs("div", { className: styles.profileContent, children: [_jsx("span", { className: styles.avatar, "aria-hidden": "true", children: userInitials }), _jsx("span", { className: styles.profileName, children: userName }), onProfileMenu ? (_jsx("button", { type: "button", className: styles.profileMenu, "aria-label": profileMenuAriaLabel, onClick: onProfileMenu, children: _jsx(FaIcon, { icon: profileMenuIcon, size: 10, color: "currentColor" }) })) : (_jsx("span", { className: styles.profileMenu, "aria-hidden": "true", children: _jsx(FaIcon, { icon: profileMenuIcon, size: 10, color: "currentColor" }) }))] })] })] }));
};
