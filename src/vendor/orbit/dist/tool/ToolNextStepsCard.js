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
import React, { useEffect, useState } from 'react';
import { Card } from '../layout';
import { FA, FaIcon, Headings, Text } from '../primitives';
import styles from './ToolNextStepsCard.module.css';
var CHEVRON_UP_GLYPH = '\uf077';
var DEFAULT_MILESTONES = Array.from({ length: 5 }, function (_, index) { return ({
    milestone: "Gate ".concat(index + 1),
    dueDate: '21/05/2026',
    status: 'Pending',
}); });
function DefaultMilestoneTable() {
    return (_jsx("div", { className: styles.milestoneTableWrap, children: _jsxs("table", { className: styles.milestoneTable, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Milestone" }), _jsx("th", { scope: "col", children: "Due Date" }), _jsx("th", { scope: "col", children: "Status" }), _jsx("th", { scope: "col", children: "Action" })] }) }), _jsx("tbody", { children: DEFAULT_MILESTONES.map(function (row) { return (_jsxs("tr", { children: [_jsx("td", { children: row.milestone }), _jsx("td", { children: row.dueDate }), _jsx("td", { children: row.status }), _jsx("td", { children: _jsx("button", { type: "button", className: styles.milestoneButton, children: "Mark Complete" }) })] }, row.milestone)); }) })] }) }));
}
var DEFAULT_ACTIONS = [
    {
        id: 'analyse-another-initiative',
        icon: '\uf890',
        title: 'Analyse Contract on Another Initiative',
        description: 'Start fresh with a new initiative.',
        hideChevron: true,
        dividerAfter: true,
    },
    {
        id: 'update-milestone',
        icon: '\uf328',
        title: 'Update Milestone',
        description: 'Track your initiative progress.',
        expanded: true,
        expandedContent: _jsx(DefaultMilestoneTable, {}),
    },
    {
        id: 'complete-initiative',
        icon: '\uf336',
        title: 'Complete Initiative',
        description: 'Mark this initiative as complete.',
        hideChevron: true,
    },
];
function ActionContent(_a) {
    var action = _a.action;
    var chevronGlyph = action.expanded ? CHEVRON_UP_GLYPH : FA.chevronRight;
    return (_jsxs(_Fragment, { children: [_jsxs("span", { className: styles.actionContent, children: [_jsx("span", { className: styles.iconBox, "aria-hidden": "true", children: _jsx(FaIcon, { icon: action.icon, size: 18, color: "var(--orbit-color-card-border-highlight)" }) }), _jsxs("span", { className: styles.copy, children: [_jsx(Text, { as: "span", size: "Paragraph", variant: "Bold", children: action.title }), _jsx(Text, { as: "span", size: "Paragraph", variant: "Secondary", children: action.description })] })] }), _jsx("span", { className: styles.chevron, style: action.hideChevron ? { visibility: 'hidden' } : undefined, "aria-hidden": "true", children: _jsx(FaIcon, { icon: chevronGlyph, size: 14, color: "var(--orbit-color-text-secondary)" }) })] }));
}
export function ToolNextStepsCard(_a) {
    var _b = _a.title, title = _b === void 0 ? 'Next, you can...' : _b, _c = _a.actions, actions = _c === void 0 ? DEFAULT_ACTIONS : _c, onActionSelect = _a.onActionSelect;
    var _d = useState(function () { return new Set(actions.filter(function (action) { return action.expanded; }).map(function (action) { return action.id; })); }), expandedIds = _d[0], setExpandedIds = _d[1];
    useEffect(function () {
        setExpandedIds(new Set(actions.filter(function (action) { return action.expanded; }).map(function (action) { return action.id; })));
    }, [actions]);
    return (_jsx(Card, { state: "Default", type: "Static", padding: "Base", children: _jsxs("div", { className: styles.card, children: [_jsx(Headings, { size: "Heading 5", children: title }), _jsx("div", { className: styles.actions, children: actions.map(function (action) {
                        var isExpanded = expandedIds.has(action.id);
                        var hasExpandedContent = Boolean(action.expandedContent);
                        var expandedContent = isExpanded && action.expandedContent ? (_jsx("div", { className: styles.expandedContent, children: action.expandedContent })) : null;
                        var handleAction = function () {
                            if (action.disabled)
                                return;
                            if (hasExpandedContent) {
                                setExpandedIds(function (prev) {
                                    var next = new Set(prev);
                                    if (next.has(action.id))
                                        next.delete(action.id);
                                    else
                                        next.add(action.id);
                                    return next;
                                });
                            }
                            onActionSelect === null || onActionSelect === void 0 ? void 0 : onActionSelect(action.id);
                        };
                        var header = action.href && !action.disabled ? (_jsx("a", { href: action.href, className: styles.action, "aria-label": action.ariaLabel, onClick: function () { return onActionSelect === null || onActionSelect === void 0 ? void 0 : onActionSelect(action.id); }, children: _jsx(ActionContent, { action: __assign(__assign({}, action), { expanded: isExpanded }) }) }, action.id)) : (_jsx("button", { type: "button", className: styles.action, disabled: action.disabled, "aria-label": action.ariaLabel, "aria-expanded": hasExpandedContent ? isExpanded : undefined, onClick: handleAction, children: _jsx(ActionContent, { action: __assign(__assign({}, action), { expanded: isExpanded }) }) }, action.id));
                        var node = (_jsxs("div", { className: styles.actionPanel, children: [header, expandedContent] }, action.id));
                        return action.dividerAfter ? (_jsxs(React.Fragment, { children: [node, _jsx("hr", { "aria-hidden": "true", className: styles.divider })] }, action.id)) : node;
                    }) })] }) }));
}
