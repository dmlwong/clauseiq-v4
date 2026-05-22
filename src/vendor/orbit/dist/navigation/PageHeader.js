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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useState } from 'react';
import clsx from 'clsx';
import { Button, IconButton } from '../actions';
import { FaIcon } from '../primitives/FaIcon';
import { TabButton } from './TabButton';
import { Badge } from '../indicators/Badge';
import styles from './PageHeader.module.css';
/* ─── Preset gradients for common categories ─── */
export var HeaderPresets = {
    identify: { iconGradient: ['var(--orbit-color-header-identify-from)', 'var(--orbit-color-header-identify-to)'], borderColor: 'var(--orbit-color-header-identify-border)' },
    deliver: { iconGradient: ['var(--orbit-color-header-deliver-from)', 'var(--orbit-color-header-deliver-to)'], borderColor: 'var(--orbit-color-header-deliver-border)' },
    sustain: { iconGradient: ['var(--orbit-color-header-sustain-from)', 'var(--orbit-color-header-sustain-to)'], borderColor: 'var(--orbit-color-header-sustain-border)' },
    rfp: { iconGradient: ['var(--orbit-color-header-rfp-from)', 'var(--orbit-color-header-rfp-to)'], borderColor: 'var(--orbit-color-header-rfp-border)' },
};
/* ─── Sub-components ─── */
function clampIndex(index, count) {
    if (count <= 0 || index === undefined || !Number.isFinite(index))
        return 0;
    return Math.max(0, Math.min(Math.floor(index), count - 1));
}
function getSelectableIndex(tabs, preferredIndex) {
    var _a;
    if (tabs.length === 0)
        return 0;
    var bounded = clampIndex(preferredIndex, tabs.length);
    if (!((_a = tabs[bounded]) === null || _a === void 0 ? void 0 : _a.disabled))
        return bounded;
    var firstEnabled = tabs.findIndex(function (tab) { return !tab.disabled; });
    return firstEnabled >= 0 ? firstEnabled : bounded;
}
function getNextSelectableIndex(tabs, currentIndex, direction) {
    var _a;
    if (tabs.length === 0 || tabs.every(function (tab) { return tab.disabled; }))
        return currentIndex;
    for (var offset = 1; offset <= tabs.length; offset += 1) {
        var nextIndex = (currentIndex + direction * offset + tabs.length) % tabs.length;
        if (!((_a = tabs[nextIndex]) === null || _a === void 0 ? void 0 : _a.disabled))
            return nextIndex;
    }
    return currentIndex;
}
function GradientIcon(_a) {
    var icon = _a.icon, gradient = _a.gradient;
    return (_jsx("span", { className: styles.gradientIcon, style: {
            '--_gradient-from': gradient[0],
            '--_gradient-to': gradient[1],
        }, children: _jsx(FaIcon, { icon: icon, size: 16, color: "var(--orbit-color-btn-primary-fg)" }) }));
}
function ActionButton(_a) {
    var label = _a.label, ariaLabel = _a.ariaLabel, icon = _a.icon, _b = _a.variant, variant = _b === void 0 ? 'Secondary' : _b, onClick = _a.onClick, disabled = _a.disabled;
    var isIconOnly = variant === 'IconOnly';
    var accessibleName = (ariaLabel || label).trim();
    var iconNode = icon ? _jsx(FaIcon, { icon: icon, size: 14, color: "currentColor" }) : undefined;
    if (!accessibleName)
        return null;
    if (isIconOnly && iconNode) {
        return (_jsx(IconButton, { ariaLabel: accessibleName, icon: iconNode, size: "Medium", state: disabled ? 'Disabled' : 'Default', variant: "Secondary", onClick: onClick }));
    }
    return (_jsx(Button, { icon: iconNode, size: "Medium", state: disabled ? 'Disabled' : 'Default', variant: variant === 'Primary' ? 'Primary' : 'Secondary', onClick: onClick, children: label }));
}
function InitiativePill(_a) {
    var code = _a.code, label = _a.label;
    return (_jsxs("div", { className: styles.pill, children: [_jsx(FaIcon, { icon: '\uf0c1', size: 12, color: "var(--orbit-color-text-secondary)" }), _jsxs("span", { className: styles.pillText, children: [code, " | ", label] })] }));
}
function TabBar(_a) {
    var tabs = _a.tabs, activeTab = _a.activeTab, onTabChange = _a.onTabChange, showTabUnderline = _a.showTabUnderline, tabIdBase = _a.tabIdBase;
    var handleKeyDown = function (event) {
        var _a, _b;
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key))
            return;
        if (tabs.length === 0 || tabs.every(function (tab) { return tab.disabled; }))
            return;
        event.preventDefault();
        var tabList = event.currentTarget;
        var nextIndex = event.key === 'Home'
            ? tabs.findIndex(function (tab) { return !tab.disabled; })
            : event.key === 'End'
                ? (_b = (_a = __spreadArray([], tabs, true).map(function (tab, index) { return ({ tab: tab, index: index }); }).reverse().find(function (_a) {
                    var tab = _a.tab;
                    return !tab.disabled;
                })) === null || _a === void 0 ? void 0 : _a.index) !== null && _b !== void 0 ? _b : activeTab
                : event.key === 'ArrowRight'
                    ? getNextSelectableIndex(tabs, activeTab, 1)
                    : getNextSelectableIndex(tabs, activeTab, -1);
        onTabChange(nextIndex);
        requestAnimationFrame(function () {
            var tab = tabList.querySelectorAll('[role="tab"]')[nextIndex];
            tab === null || tab === void 0 ? void 0 : tab.focus();
        });
    };
    return (_jsx("div", { role: "tablist", "aria-label": "Page sections", "aria-orientation": "horizontal", onKeyDown: handleKeyDown, className: styles.tabList, children: tabs.map(function (tab, i) {
            var tabId = tab.id || "".concat(tabIdBase, "-tab-").concat(i);
            return (_jsxs(TabButton, { id: tabId, active: i === activeTab, ariaControls: tab.panelId, disabled: tab.disabled, onClick: function () { return onTabChange(i); }, showUnderline: showTabUnderline, status: tab.disabled ? 'Disabled' : 'Rest', children: [tab.label, tab.badge !== undefined && _jsx(Badge, { label: String(tab.badge), status: "Red" })] }, tab.id || "".concat(tab.label, "-").concat(i)));
        }) }));
}
/* ─── Main Component ─── */
export var PageHeader = function (_a) {
    var _b;
    var _c = _a.type, type = _c === void 0 ? 'tool' : _c, title = _a.title, subtitle = _a.subtitle, icon = _a.icon, iconGradient = _a.iconGradient, borderColor = _a.borderColor, actions = _a.actions, pill = _a.pill, tabs = _a.tabs, activeTab = _a.activeTab, defaultActiveTab = _a.defaultActiveTab, onTabChange = _a.onTabChange, _d = _a.showTabUnderline, showTabUnderline = _d === void 0 ? true : _d;
    var tabIdBase = useId();
    var tabsLength = (_b = tabs === null || tabs === void 0 ? void 0 : tabs.length) !== null && _b !== void 0 ? _b : 0;
    var isControlled = activeTab !== undefined && onTabChange !== undefined;
    var _e = useState(function () { return (getSelectableIndex(tabs || [], defaultActiveTab !== null && defaultActiveTab !== void 0 ? defaultActiveTab : activeTab)); }), uncontrolledTab = _e[0], setUncontrolledTab = _e[1];
    useEffect(function () {
        if (!tabsLength) {
            setUncontrolledTab(0);
            return;
        }
        setUncontrolledTab(function (current) { return getSelectableIndex(tabs || [], current); });
    }, [tabs, tabsLength]);
    useEffect(function () {
        if (!isControlled && activeTab !== undefined) {
            setUncontrolledTab(getSelectableIndex(tabs || [], activeTab));
        }
    }, [activeTab, isControlled, tabs]);
    var handleTabChange = function (i) {
        if (!(tabs === null || tabs === void 0 ? void 0 : tabs[i]) || tabs[i].disabled)
            return;
        if (!isControlled)
            setUncontrolledTab(i);
        onTabChange === null || onTabChange === void 0 ? void 0 : onTabChange(i);
    };
    var isMain = type === 'main';
    var currentTab = getSelectableIndex(tabs || [], isControlled ? activeTab : uncontrolledTab);
    return (_jsxs("div", { className: styles.root, style: {
            '--_border-color': borderColor || 'var(--orbit-color-card-border-default)',
            '--_border-width': borderColor ? '2px' : '1px',
        }, children: [_jsxs("div", { className: styles.row, children: [!isMain && icon && iconGradient && (_jsx(GradientIcon, { icon: icon, gradient: iconGradient })), _jsx("div", { className: styles.titleGroup, children: isMain ? (_jsxs(_Fragment, { children: [_jsx("span", { className: clsx(styles.title, styles.mainTitle), children: title }), subtitle && (_jsx("span", { className: clsx(styles.subtitle, styles.mainSubtitle), children: subtitle }))] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: clsx(styles.title, styles.toolTitle), children: title }), subtitle && (_jsx("span", { className: clsx(styles.subtitle, styles.toolSubtitle), children: subtitle }))] })) }), (pill || (actions === null || actions === void 0 ? void 0 : actions.length)) && (_jsxs("div", { className: styles.right, children: [pill && _jsx(InitiativePill, __assign({}, pill)), (actions === null || actions === void 0 ? void 0 : actions.length) ? (_jsx("div", { className: styles.actions, children: actions.map(function (action, index) { return (_jsx(ActionButton, __assign({}, action), action.id || action.label || "".concat(action.variant || 'action', "-").concat(index))); }) })) : null] }))] }), tabs && tabs.length > 0 && (_jsx(TabBar, { tabs: tabs, activeTab: currentTab, onTabChange: handleTabChange, showTabUnderline: showTabUnderline, tabIdBase: tabIdBase }))] }));
};
