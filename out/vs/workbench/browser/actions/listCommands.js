/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/browser/ui/list/listWidget", "vs/platform/list/browser/listService", "vs/base/browser/ui/list/listPaging", "vs/base/common/arrays", "vs/platform/contextkey/common/contextkey", "vs/base/browser/ui/tree/objectTree", "vs/base/browser/ui/tree/asyncDataTree", "vs/base/browser/ui/tree/dataTree", "vs/platform/commands/common/commands", "vs/base/browser/ui/table/tableWidget", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/dom", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/nls"], function (require, exports, keybindingsRegistry_1, listWidget_1, listService_1, listPaging_1, arrays_1, contextkey_1, objectTree_1, asyncDataTree_1, dataTree_1, commands_1, tableWidget_1, abstractTree_1, dom_1, actions_1, configuration_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ensureDOMFocus(widget) {
        // it can happen that one of the commands is executed while
        // DOM focus is within another focusable control within the
        // list/tree item. therefor we should ensure that the
        // list/tree has DOM focus again after the command ran.
        const element = widget?.getHTMLElement();
        if (element && !(0, dom_1.isActiveElement)(element)) {
            widget?.domFocus();
        }
    }
    async function updateFocus(widget, updateFocusFn) {
        if (!listService_1.WorkbenchListSelectionNavigation.getValue(widget.contextKeyService)) {
            return updateFocusFn(widget);
        }
        const focus = widget.getFocus();
        const selection = widget.getSelection();
        await updateFocusFn(widget);
        const newFocus = widget.getFocus();
        if (selection.length > 1 || !(0, arrays_1.equals)(focus, selection) || (0, arrays_1.equals)(focus, newFocus)) {
            return;
        }
        const fakeKeyboardEvent = new KeyboardEvent('keydown');
        widget.setSelection(newFocus, fakeKeyboardEvent);
    }
    async function navigate(widget, updateFocusFn) {
        if (!widget) {
            return;
        }
        await updateFocus(widget, updateFocusFn);
        const listFocus = widget.getFocus();
        if (listFocus.length) {
            widget.reveal(listFocus[0]);
        }
        widget.setAnchor(listFocus[0]);
        ensureDOMFocus(widget);
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 18 /* KeyCode.DownArrow */,
        mac: {
            primary: 18 /* KeyCode.DownArrow */,
            secondary: [256 /* KeyMod.WinCtrl */ | 44 /* KeyCode.KeyN */]
        },
        handler: (accessor, arg2) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusNext(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 16 /* KeyCode.UpArrow */,
        mac: {
            primary: 16 /* KeyCode.UpArrow */,
            secondary: [256 /* KeyMod.WinCtrl */ | 46 /* KeyCode.KeyP */]
        },
        handler: (accessor, arg2) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusPrevious(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusAnyDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
        mac: {
            primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
            secondary: [256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 44 /* KeyCode.KeyN */]
        },
        handler: (accessor, arg2) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown', { altKey: true });
                await widget.focusNext(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusAnyUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
        mac: {
            primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
            secondary: [256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 46 /* KeyCode.KeyP */]
        },
        handler: (accessor, arg2) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown', { altKey: true });
                await widget.focusPrevious(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusPageDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 12 /* KeyCode.PageDown */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusNextPage(fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusPageUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 11 /* KeyCode.PageUp */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusPreviousPage(fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusFirst',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 14 /* KeyCode.Home */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusFirst(fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusLast',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 13 /* KeyCode.End */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusLast(fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusAnyFirst',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 512 /* KeyMod.Alt */ | 14 /* KeyCode.Home */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown', { altKey: true });
                await widget.focusFirst(fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusAnyLast',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 512 /* KeyMod.Alt */ | 13 /* KeyCode.End */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown', { altKey: true });
                await widget.focusLast(fakeKeyboardEvent);
            });
        }
    });
    function expandMultiSelection(focused, previousFocus) {
        // List
        if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList || focused instanceof tableWidget_1.Table) {
            const list = focused;
            const focus = list.getFocus() ? list.getFocus()[0] : undefined;
            const selection = list.getSelection();
            if (selection && typeof focus === 'number' && selection.indexOf(focus) >= 0) {
                list.setSelection(selection.filter(s => s !== previousFocus));
            }
            else {
                if (typeof focus === 'number') {
                    list.setSelection(selection.concat(focus));
                }
            }
        }
        // Tree
        else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
            const list = focused;
            const focus = list.getFocus() ? list.getFocus()[0] : undefined;
            if (previousFocus === focus) {
                return;
            }
            const selection = list.getSelection();
            const fakeKeyboardEvent = new KeyboardEvent('keydown', { shiftKey: true });
            if (selection && selection.indexOf(focus) >= 0) {
                list.setSelection(selection.filter(s => s !== previousFocus), fakeKeyboardEvent);
            }
            else {
                list.setSelection(selection.concat(focus), fakeKeyboardEvent);
            }
        }
    }
    function revealFocusedStickyScroll(tree, postRevealAction) {
        const focus = tree.getStickyScrollFocus();
        if (focus.length === 0) {
            throw new Error(`StickyScroll has no focus`);
        }
        if (focus.length > 1) {
            throw new Error(`StickyScroll can only have a single focused item`);
        }
        tree.reveal(focus[0]);
        tree.getHTMLElement().focus(); // domfocus() would focus stiky scroll dom and not the tree todo@benibenj
        tree.setFocus(focus);
        postRevealAction?.(focus[0]);
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.expandSelectionDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListSupportsMultiSelectContextKey),
        primary: 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */,
        handler: (accessor, arg2) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget) {
                return;
            }
            // Focus down first
            const previousFocus = widget.getFocus() ? widget.getFocus()[0] : undefined;
            const fakeKeyboardEvent = new KeyboardEvent('keydown');
            widget.focusNext(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            // Then adjust selection
            expandMultiSelection(widget, previousFocus);
            const focus = widget.getFocus();
            if (focus.length) {
                widget.reveal(focus[0]);
            }
            ensureDOMFocus(widget);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.expandSelectionUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListSupportsMultiSelectContextKey),
        primary: 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */,
        handler: (accessor, arg2) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget) {
                return;
            }
            // Focus up first
            const previousFocus = widget.getFocus() ? widget.getFocus()[0] : undefined;
            const fakeKeyboardEvent = new KeyboardEvent('keydown');
            widget.focusPrevious(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            // Then adjust selection
            expandMultiSelection(widget, previousFocus);
            const focus = widget.getFocus();
            if (focus.length) {
                widget.reveal(focus[0]);
            }
            ensureDOMFocus(widget);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.collapse',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, contextkey_1.ContextKeyExpr.or(listService_1.WorkbenchTreeElementCanCollapse, listService_1.WorkbenchTreeElementHasParent)),
        primary: 15 /* KeyCode.LeftArrow */,
        mac: {
            primary: 15 /* KeyCode.LeftArrow */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */]
        },
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget || !(widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree || widget instanceof asyncDataTree_1.AsyncDataTree)) {
                return;
            }
            const tree = widget;
            const focusedElements = tree.getFocus();
            if (focusedElements.length === 0) {
                return;
            }
            const focus = focusedElements[0];
            if (!tree.collapse(focus)) {
                const parent = tree.getParentElement(focus);
                if (parent) {
                    navigate(widget, widget => {
                        const fakeKeyboardEvent = new KeyboardEvent('keydown');
                        widget.setFocus([parent], fakeKeyboardEvent);
                    });
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.stickyScroll.collapse',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        when: listService_1.WorkbenchTreeStickyScrollFocused,
        primary: 15 /* KeyCode.LeftArrow */,
        mac: {
            primary: 15 /* KeyCode.LeftArrow */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */]
        },
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget || !(widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree || widget instanceof asyncDataTree_1.AsyncDataTree)) {
                return;
            }
            revealFocusedStickyScroll(widget, focus => widget.collapse(focus));
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.collapseAll',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */]
        },
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            if (focused && !(focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList || focused instanceof tableWidget_1.Table)) {
                focused.collapseAll();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.collapseAllToFocus',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        handler: accessor => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            const fakeKeyboardEvent = (0, listService_1.getSelectionKeyboardEvent)('keydown', true);
            // Trees
            if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = focused;
                const focus = tree.getFocus();
                if (focus.length > 0) {
                    tree.collapse(focus[0], true);
                }
                tree.setSelection(focus, fakeKeyboardEvent);
                tree.setAnchor(focus[0]);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusParent',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget || !(widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree || widget instanceof asyncDataTree_1.AsyncDataTree)) {
                return;
            }
            const tree = widget;
            const focusedElements = tree.getFocus();
            if (focusedElements.length === 0) {
                return;
            }
            const focus = focusedElements[0];
            const parent = tree.getParentElement(focus);
            if (parent) {
                navigate(widget, widget => {
                    const fakeKeyboardEvent = new KeyboardEvent('keydown');
                    widget.setFocus([parent], fakeKeyboardEvent);
                });
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.expand',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, contextkey_1.ContextKeyExpr.or(listService_1.WorkbenchTreeElementCanExpand, listService_1.WorkbenchTreeElementHasChild)),
        primary: 17 /* KeyCode.RightArrow */,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget) {
                return;
            }
            if (widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree) {
                // TODO@Joao: instead of doing this here, just delegate to a tree method
                const focusedElements = widget.getFocus();
                if (focusedElements.length === 0) {
                    return;
                }
                const focus = focusedElements[0];
                if (!widget.expand(focus)) {
                    const child = widget.getFirstElementChild(focus);
                    if (child) {
                        const node = widget.getNode(child);
                        if (node.visible) {
                            navigate(widget, widget => {
                                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                                widget.setFocus([child], fakeKeyboardEvent);
                            });
                        }
                    }
                }
            }
            else if (widget instanceof asyncDataTree_1.AsyncDataTree) {
                // TODO@Joao: instead of doing this here, just delegate to a tree method
                const focusedElements = widget.getFocus();
                if (focusedElements.length === 0) {
                    return;
                }
                const focus = focusedElements[0];
                widget.expand(focus).then(didExpand => {
                    if (focus && !didExpand) {
                        const child = widget.getFirstElementChild(focus);
                        if (child) {
                            const node = widget.getNode(child);
                            if (node.visible) {
                                navigate(widget, widget => {
                                    const fakeKeyboardEvent = new KeyboardEvent('keydown');
                                    widget.setFocus([child], fakeKeyboardEvent);
                                });
                            }
                        }
                    }
                });
            }
        }
    });
    function selectElement(accessor, retainCurrentFocus) {
        const focused = accessor.get(listService_1.IListService).lastFocusedList;
        const fakeKeyboardEvent = (0, listService_1.getSelectionKeyboardEvent)('keydown', retainCurrentFocus);
        // List
        if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList || focused instanceof tableWidget_1.Table) {
            const list = focused;
            list.setAnchor(list.getFocus()[0]);
            list.setSelection(list.getFocus(), fakeKeyboardEvent);
        }
        // Trees
        else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
            const tree = focused;
            const focus = tree.getFocus();
            if (focus.length > 0) {
                let toggleCollapsed = true;
                if (tree.expandOnlyOnTwistieClick === true) {
                    toggleCollapsed = false;
                }
                else if (typeof tree.expandOnlyOnTwistieClick !== 'boolean' && tree.expandOnlyOnTwistieClick(focus[0])) {
                    toggleCollapsed = false;
                }
                if (toggleCollapsed) {
                    tree.toggleCollapsed(focus[0]);
                }
            }
            tree.setAnchor(focus[0]);
            tree.setSelection(focus, fakeKeyboardEvent);
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.select',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 3 /* KeyCode.Enter */,
        mac: {
            primary: 3 /* KeyCode.Enter */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
        },
        handler: (accessor) => {
            selectElement(accessor, false);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.stickyScrollselect',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50, // priorities over file explorer
        when: listService_1.WorkbenchTreeStickyScrollFocused,
        primary: 3 /* KeyCode.Enter */,
        mac: {
            primary: 3 /* KeyCode.Enter */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
        },
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget || !(widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree || widget instanceof asyncDataTree_1.AsyncDataTree)) {
                return;
            }
            revealFocusedStickyScroll(widget, focus => widget.setSelection([focus]));
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.selectAndPreserveFocus',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        handler: accessor => {
            selectElement(accessor, true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.selectAll',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListSupportsMultiSelectContextKey),
        primary: 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */,
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // List
            if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList || focused instanceof tableWidget_1.Table) {
                const list = focused;
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                list.setSelection((0, arrays_1.range)(list.length), fakeKeyboardEvent);
            }
            // Trees
            else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = focused;
                const focus = tree.getFocus();
                const selection = tree.getSelection();
                // Which element should be considered to start selecting all?
                let start = undefined;
                if (focus.length > 0 && (selection.length === 0 || !selection.includes(focus[0]))) {
                    start = focus[0];
                }
                if (!start && selection.length > 0) {
                    start = selection[0];
                }
                // What is the scope of select all?
                let scope = undefined;
                if (!start) {
                    scope = undefined;
                }
                else {
                    scope = tree.getParentElement(start);
                }
                const newSelection = [];
                const visit = (node) => {
                    for (const child of node.children) {
                        if (child.visible) {
                            newSelection.push(child.element);
                            if (!child.collapsed) {
                                visit(child);
                            }
                        }
                    }
                };
                // Add the whole scope subtree to the new selection
                visit(tree.getNode(scope));
                // If the scope isn't the tree root, it should be part of the new selection
                if (scope && selection.length === newSelection.length) {
                    newSelection.unshift(scope);
                }
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                tree.setSelection(newSelection, fakeKeyboardEvent);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.toggleSelection',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget) {
                return;
            }
            const focus = widget.getFocus();
            if (focus.length === 0) {
                return;
            }
            const selection = widget.getSelection();
            const index = selection.indexOf(focus[0]);
            if (index > -1) {
                widget.setSelection([...selection.slice(0, index), ...selection.slice(index + 1)]);
            }
            else {
                widget.setSelection([...selection, focus[0]]);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.toggleExpand',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 10 /* KeyCode.Space */,
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // Tree only
            if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = focused;
                const focus = tree.getFocus();
                if (focus.length > 0 && tree.isCollapsible(focus[0])) {
                    tree.toggleCollapsed(focus[0]);
                    return;
                }
            }
            selectElement(accessor, true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.stickyScrolltoggleExpand',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50, // priorities over file explorer
        when: listService_1.WorkbenchTreeStickyScrollFocused,
        primary: 10 /* KeyCode.Space */,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget || !(widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree || widget instanceof asyncDataTree_1.AsyncDataTree)) {
                return;
            }
            revealFocusedStickyScroll(widget);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.clear',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListHasSelectionOrFocus),
        primary: 9 /* KeyCode.Escape */,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget) {
                return;
            }
            const selection = widget.getSelection();
            const fakeKeyboardEvent = new KeyboardEvent('keydown');
            if (selection.length > 1) {
                const useSelectionNavigation = listService_1.WorkbenchListSelectionNavigation.getValue(widget.contextKeyService);
                if (useSelectionNavigation) {
                    const focus = widget.getFocus();
                    widget.setSelection([focus[0]], fakeKeyboardEvent);
                }
                else {
                    widget.setSelection([], fakeKeyboardEvent);
                }
            }
            else {
                widget.setSelection([], fakeKeyboardEvent);
                widget.setFocus([], fakeKeyboardEvent);
            }
            widget.setAnchor(undefined);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'list.triggerTypeNavigation',
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            widget?.triggerTypeNavigation();
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'list.toggleFindMode',
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (widget instanceof abstractTree_1.AbstractTree || widget instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = widget;
                tree.findMode = tree.findMode === abstractTree_1.TreeFindMode.Filter ? abstractTree_1.TreeFindMode.Highlight : abstractTree_1.TreeFindMode.Filter;
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'list.toggleFindMatchType',
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (widget instanceof abstractTree_1.AbstractTree || widget instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = widget;
                tree.findMatchType = tree.findMatchType === abstractTree_1.TreeFindMatchType.Contiguous ? abstractTree_1.TreeFindMatchType.Fuzzy : abstractTree_1.TreeFindMatchType.Contiguous;
            }
        }
    });
    // Deprecated commands
    commands_1.CommandsRegistry.registerCommandAlias('list.toggleKeyboardNavigation', 'list.triggerTypeNavigation');
    commands_1.CommandsRegistry.registerCommandAlias('list.toggleFilterOnType', 'list.toggleFindMode');
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.find',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.RawWorkbenchListFocusContextKey, listService_1.WorkbenchListSupportsFind),
        primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
        secondary: [61 /* KeyCode.F3 */],
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            // List
            if (widget instanceof listWidget_1.List || widget instanceof listPaging_1.PagedList || widget instanceof tableWidget_1.Table) {
                // TODO@joao
            }
            // Tree
            else if (widget instanceof abstractTree_1.AbstractTree || widget instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = widget;
                tree.openFind();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.closeFind',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.RawWorkbenchListFocusContextKey, listService_1.WorkbenchTreeFindOpen),
        primary: 9 /* KeyCode.Escape */,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (widget instanceof abstractTree_1.AbstractTree || widget instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = widget;
                tree.closeFind();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.scrollUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        // Since the default keybindings for list.scrollUp and widgetNavigation.focusPrevious
        // are both Ctrl+UpArrow, we disable this command when the scrollbar is at
        // top-most position. This will give chance for widgetNavigation.focusPrevious to execute
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListScrollAtTopContextKey?.negate()),
        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
        handler: accessor => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            if (!focused) {
                return;
            }
            focused.scrollTop -= 10;
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.scrollDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        // same as above
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListScrollAtBottomContextKey?.negate()),
        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
        handler: accessor => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            if (!focused) {
                return;
            }
            focused.scrollTop += 10;
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.scrollLeft',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        handler: accessor => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            if (!focused) {
                return;
            }
            focused.scrollLeft -= 10;
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.scrollRight',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        handler: accessor => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            if (!focused) {
                return;
            }
            focused.scrollLeft += 10;
        }
    });
    (0, actions_1.registerAction2)(class ToggleStickyScroll extends actions_1.Action2 {
        constructor() {
            super({
                id: 'tree.toggleStickyScroll',
                title: {
                    ...(0, nls_1.localize2)('toggleTreeStickyScroll', "Toggle Tree Sticky Scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mitoggleTreeStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Toggle Tree Sticky Scroll"),
                },
                category: 'View',
                f1: true
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('workbench.tree.enableStickyScroll');
            configurationService.updateValue('workbench.tree.enableStickyScroll', newValue);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdENvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9hY3Rpb25zL2xpc3RDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXNCaEcsU0FBUyxjQUFjLENBQUMsTUFBOEI7UUFDckQsMkRBQTJEO1FBQzNELDJEQUEyRDtRQUMzRCxxREFBcUQ7UUFDckQsdURBQXVEO1FBQ3ZELE1BQU0sT0FBTyxHQUFHLE1BQU0sRUFBRSxjQUFjLEVBQUUsQ0FBQztRQUN6QyxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUEscUJBQWUsRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQzFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQztRQUNwQixDQUFDO0lBQ0YsQ0FBQztJQUVELEtBQUssVUFBVSxXQUFXLENBQUMsTUFBMkIsRUFBRSxhQUFvRTtRQUMzSCxJQUFJLENBQUMsOENBQWdDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7WUFDMUUsT0FBTyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNoQyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7UUFFeEMsTUFBTSxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFNUIsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRW5DLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFBLGVBQU0sRUFBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLElBQUksSUFBQSxlQUFNLEVBQUMsS0FBSyxFQUFFLFFBQVEsQ0FB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