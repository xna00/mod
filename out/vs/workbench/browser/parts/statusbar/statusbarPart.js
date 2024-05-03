/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/browser/part", "vs/base/browser/touch", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/contextview/browser/contextView", "vs/base/common/actions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dom", "vs/platform/storage/common/storage", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/extensions", "vs/base/common/arrays", "vs/base/browser/mouseEvent", "vs/workbench/browser/actions/layoutActions", "vs/base/common/types", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/theme", "vs/base/common/hash", "vs/platform/hover/browser/hover", "vs/workbench/browser/parts/statusbar/statusbarActions", "vs/workbench/browser/parts/statusbar/statusbarModel", "vs/workbench/browser/parts/statusbar/statusbarItem", "vs/workbench/common/contextkeys", "vs/base/common/event", "vs/css!./media/statusbarpart"], function (require, exports, nls_1, lifecycle_1, part_1, touch_1, instantiation_1, statusbar_1, contextView_1, actions_1, themeService_1, theme_1, workspace_1, colorRegistry_1, dom_1, storage_1, layoutService_1, extensions_1, arrays_1, mouseEvent_1, layoutActions_1, types_1, contextkey_1, theme_2, hash_1, hover_1, statusbarActions_1, statusbarModel_1, statusbarItem_1, contextkeys_1, event_1) {
    "use strict";
    var StatusbarPart_1, AuxiliaryStatusbarPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScopedStatusbarService = exports.StatusbarService = exports.AuxiliaryStatusbarPart = exports.MainStatusbarPart = void 0;
    let StatusbarPart = class StatusbarPart extends part_1.Part {
        static { StatusbarPart_1 = this; }
        static { this.HEIGHT = 22; }
        constructor(id, instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService) {
            super(id, { hasTitle: false }, themeService, storageService, layoutService);
            this.instantiationService = instantiationService;
            this.contextService = contextService;
            this.storageService = storageService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            //#region IView
            this.minimumWidth = 0;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = StatusbarPart_1.HEIGHT;
            this.maximumHeight = StatusbarPart_1.HEIGHT;
            this.pendingEntries = [];
            this.viewModel = this._register(new statusbarModel_1.StatusbarViewModel(this.storageService));
            this.onDidChangeEntryVisibility = this.viewModel.onDidChangeEntryVisibility;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this.hoverDelegate = this._register(this.instantiationService.createInstance(hover_1.WorkbenchHoverDelegate, 'element', true, (_, focus) => ({
                persistence: {
                    hideOnKeyDown: true,
                    sticky: focus
                }
            })));
            this.compactEntriesDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.styleOverrides = new Set();
            this.registerListeners();
        }
        registerListeners() {
            // Entry visibility changes
            this._register(this.onDidChangeEntryVisibility(() => this.updateCompactEntries()));
            // Workbench state changes
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateStyles()));
        }
        addEntry(entry, id, alignment, priorityOrLocation = 0) {
            let priority;
            if ((0, statusbar_1.isStatusbarEntryPriority)(priorityOrLocation)) {
                priority = priorityOrLocation;
            }
            else {
                priority = {
                    primary: priorityOrLocation,
                    secondary: (0, hash_1.hash)(id) // derive from identifier to accomplish uniqueness
                };
            }
            // As long as we have not been created into a container yet, record all entries
            // that are pending so that they can get created at a later point
            if (!this.element) {
                return this.doAddPendingEntry(entry, id, alignment, priority);
            }
            // Otherwise add to view
            return this.doAddEntry(entry, id, alignment, priority);
        }
        doAddPendingEntry(entry, id, alignment, priority) {
            const pendingEntry = { entry, id, alignment, priority };
            this.pendingEntries.push(pendingEntry);
            const accessor = {
                update: (entry) => {
                    if (pendingEntry.accessor) {
                        pendingEntry.accessor.update(entry);
                    }
                    else {
                        pendingEntry.entry = entry;
                    }
                },
                dispose: () => {
                    if (pendingEntry.accessor) {
                        pendingEntry.accessor.dispose();
                    }
                    else {
                        this.pendingEntries = this.pendingEntries.filter(entry => entry !== pendingEntry);
                    }
                }
            };
            return accessor;
        }
        doAddEntry(entry, id, alignment, priority) {
            // View model item
            const itemContainer = this.doCreateStatusItem(id, alignment);
            const item = this.instantiationService.createInstance(statusbarItem_1.StatusbarEntryItem, itemContainer, entry, this.hoverDelegate);
            // View model entry
            const viewModelEntry = new class {
                constructor() {
                    this.id = id;
                    this.alignment = alignment;
                    this.priority = priority;
                    this.container = itemContainer;
                    this.labelContainer = item.labelContainer;
                }
                get name() { return item.name; }
                get hasCommand() { return item.hasCommand; }
            };
            // Add to view model
            const { needsFullRefresh } = this.doAddOrRemoveModelEntry(viewModelEntry, true);
            if (needsFullRefresh) {
                this.appendStatusbarEntries();
            }
            else {
                this.appendStatusbarEntry(viewModelEntry);
            }
            return {
                update: entry => {
                    item.update(entry);
                },
                dispose: () => {
                    const { needsFullRefresh } = this.doAddOrRemoveModelEntry(viewModelEntry, false);
                    if (needsFullRefresh) {
                        this.appendStatusbarEntries();
                    }
                    else {
                        itemContainer.remove();
                    }
                    (0, lifecycle_1.dispose)(item);
                }
            };
        }
        doCreateStatusItem(id, alignment, ...extraClasses) {
            const itemContainer = document.createElement('div');
            itemContainer.id = id;
            itemContainer.classList.add('statusbar-item');
            if (extraClasses) {
                itemContainer.classList.add(...extraClasses);
            }
            if (alignment === 1 /* StatusbarAlignment.RIGHT */) {
                itemContainer.classList.add('right');
            }
            else {
                itemContainer.classList.add('left');
            }
            return itemContainer;
        }
        doAddOrRemoveModelEntry(entry, add) {
            // Update model but remember previous entries
            const entriesBefore = this.viewModel.entries;
            if (add) {
                this.viewModel.add(entry);
            }
            else {
                this.viewModel.remove(entry);
            }
            const entriesAfter = this.viewModel.entries;
            // Apply operation onto the entries from before
            if (add) {
                entriesBefore.splice(entriesAfter.indexOf(entry), 0, entry);
            }
            else {
                entriesBefore.splice(entriesBefore.indexOf(entry), 1);
            }
            // Figure out if a full refresh is needed by comparing arrays
            const needsFullRefresh = !(0, arrays_1.equals)(entriesBefore, entriesAfter);
            return { needsFullRefresh };
        }
        isEntryVisible(id) {
            return !this.viewModel.isHidden(id);
        }
        updateEntryVisibility(id, visible) {
            if (visible) {
                this.viewModel.show(id);
            }
            else {
                this.viewModel.hide(id);
            }
        }
        focusNextEntry() {
            this.viewModel.focusNextEntry();
        }
        focusPreviousEntry() {
            this.viewModel.focusPreviousEntry();
        }
        isEntryFocused() {
            return this.viewModel.isEntryFocused();
        }
        focus(preserveEntryFocus = true) {
            this.getContainer()?.focus();
            const lastFocusedEntry = this.viewModel.lastFocusedEntry;
            if (preserveEntryFocus && lastFocusedEntry) {
                setTimeout(() => lastFocusedEntry.labelContainer.focus(), 0); // Need a timeout, for some reason without it the inner label container will not get focused
            }
        }
        createContentArea(parent) {
            this.element = parent;
            // Track focus within container
            const scopedContextKeyService = this._register(this.contextKeyService.createScoped(this.element));
            contextkeys_1.StatusBarFocused.bindTo(scopedContextKeyService).set(true);
            // Left items container
            this.leftItemsContainer = document.createElement('div');
            this.leftItemsContainer.classList.add('left-items', 'items-container');
            this.element.appendChild(this.leftItemsContainer);
            this.element.tabIndex = 0;
            // Right items container
            this.rightItemsContainer = document.createElement('div');
            this.rightItemsContainer.classList.add('right-items', 'items-container');
            this.element.appendChild(this.rightItemsContainer);
            // Context menu support
            this._register((0, dom_1.addDisposableListener)(parent, dom_1.EventType.CONTEXT_MENU, e => this.showContextMenu(e)));
            this._register(touch_1.Gesture.addTarget(parent));
            this._register((0, dom_1.addDisposableListener)(parent, touch_1.EventType.Contextmenu, e => this.showContextMenu(e)));
            // Initial status bar entries
            this.createInitialStatusbarEntries();
            return this.element;
        }
        createInitialStatusbarEntries() {
            // Add items in order according to alignment
            this.appendStatusbarEntries();
            // Fill in pending entries if any
            while (this.pendingEntries.length) {
                const pending = this.pendingEntries.shift();
                if (pending) {
                    pending.accessor = this.addEntry(pending.entry, pending.id, pending.alignment, pending.priority.primary);
                }
            }
        }
        appendStatusbarEntries() {
            const leftItemsContainer = (0, types_1.assertIsDefined)(this.leftItemsContainer);
            const rightItemsContainer = (0, types_1.assertIsDefined)(this.rightItemsContainer);
            // Clear containers
            (0, dom_1.clearNode)(leftItemsContainer);
            (0, dom_1.clearNode)(rightItemsContainer);
            // Append all
            for (const entry of [
                ...this.viewModel.getEntries(0 /* StatusbarAlignment.LEFT */),
                ...this.viewModel.getEntries(1 /* StatusbarAlignment.RIGHT */).reverse() // reversing due to flex: row-reverse
            ]) {
                const target = entry.alignment === 0 /* StatusbarAlignment.LEFT */ ? leftItemsContainer : rightItemsContainer;
                target.appendChild(entry.container);
            }
            // Update compact entries
            this.updateCompactEntries();
        }
        appendStatusbarEntry(entry) {
            const entries = this.viewModel.getEntries(entry.alignment);
            if (entry.alignment === 1 /* StatusbarAlignment.RIGHT */) {
                entries.reverse(); // reversing due to flex: row-reverse
            }
            const target = (0, types_1.assertIsDefined)(entry.alignment === 0 /* StatusbarAlignment.LEFT */ ? this.leftItemsContainer : this.rightItemsContainer);
            const index = entries.indexOf(entry);
            if (index + 1 === entries.length) {
                target.appendChild(entry.container); // append at the end if last
            }
            else {
                target.insertBefore(entry.container, entries[index + 1].container); // insert before next element otherwise
            }
            // Update compact entries
            this.updateCompactEntries();
        }
        updateCompactEntries() {
            const entries = this.viewModel.entries;
            // Find visible entries and clear compact related CSS classes if any
            const mapIdToVisibleEntry = new Map();
            for (const entry of entries) {
                if (!this.viewModel.isHidden(entry.id)) {
                    mapIdToVisibleEntry.set(entry.id, entry);
                }
                entry.container.classList.remove('compact-left', 'compact-right');
            }
            // Figure out groups of entries with `compact` alignment
            const compactEntryGroups = new Map();
            for (const entry of mapIdToVisibleEntry.values()) {
                if ((0, statusbar_1.isStatusbarEntryLocation)(entry.priority.primary) && // entry references another entry as location
                    entry.priority.primary.compact // entry wants to be compact
                ) {
                    const locationId = entry.priority.primary.id;
                    const location = mapIdToVisibleEntry.get(locationId);
                    if (!location) {
                        continue; // skip if location does not exist
                    }
                    // Build a map of entries that are compact among each other
                    let compactEntryGroup = compactEntryGroups.get(locationId);
                    if (!compactEntryGroup) {
                        compactEntryGroup = new Set([entry, location]);
                        compactEntryGroups.set(locationId, compactEntryGroup);
                    }
                    else {
                        compactEntryGroup.add(entry);
                    }
                    // Adjust CSS classes to move compact items closer together
                    if (entry.priority.primary.alignment === 0 /* StatusbarAlignment.LEFT */) {
                        location.container.classList.add('compact-left');
                        entry.container.classList.add('compact-right');
                    }
                    else {
                        location.container.classList.add('compact-right');
                        entry.container.classList.add('compact-left');
                    }
                }
            }
            // Install mouse listeners to update hover feedback for
            // all compact entries that belong to each other
            const statusBarItemHoverBackground = this.getColor(theme_1.STATUS_BAR_ITEM_HOVER_BACKGROUND);
            const statusBarItemCompactHoverBackground = this.getColor(theme_1.STATUS_BAR_ITEM_COMPACT_HOVER_BACKGROUND);
            this.compactEntriesDisposable.value = new lifecycle_1.DisposableStore();
            if (statusBarItemHoverBackground && statusBarItemCompactHoverBackground && !(0, theme_2.isHighContrast)(this.theme.type)) {
                for (const [, compactEntryGroup] of compactEntryGroups) {
                    for (const compactEntry of compactEntryGroup) {
                        if (!compactEntry.hasCommand) {
                            continue; // only show hover feedback when we have a command
                        }
                        this.compactEntriesDisposable.value.add((0, dom_1.addDisposableListener)(compactEntry.labelContainer, dom_1.EventType.MOUSE_OVER, () => {
                            compactEntryGroup.forEach(compactEntry => compactEntry.labelContainer.style.backgroundColor = statusBarItemHoverBackground);
                            compactEntry.labelContainer.style.backgroundColor = statusBarItemCompactHoverBackground;
                        }));
                        this.compactEntriesDisposable.value.add((0, dom_1.addDisposableListener)(compactEntry.labelContainer, dom_1.EventType.MOUSE_OUT, () => {
                            compactEntryGroup.forEach(compactEntry => compactEntry.labelContainer.style.backgroundColor = '');
                        }));
                    }
                }
            }
        }
        showContextMenu(e) {
            dom_1.EventHelper.stop(e, true);
            const event = new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.element), e);
            let actions = undefined;
            this.contextMenuService.showContextMenu({
                getAnchor: () => event,
                getActions: () => {
                    actions = this.getContextMenuActions(event);
                    return actions;
                },
                onHide: () => {
                    if (actions) {
                        (0, lifecycle_1.disposeIfDisposable)(actions);
                    }
                }
            });
        }
        getContextMenuActions(event) {
            const actions = [];
            // Provide an action to hide the status bar at last
            actions.push((0, actions_1.toAction)({ id: layoutActions_1.ToggleStatusbarVisibilityAction.ID, label: (0, nls_1.localize)('hideStatusBar', "Hide Status Bar"), run: () => this.instantiationService.invokeFunction(accessor => new layoutActions_1.ToggleStatusbarVisibilityAction().run(accessor)) }));
            actions.push(new actions_1.Separator());
            // Show an entry per known status entry
            // Note: even though entries have an identifier, there can be multiple entries
            // having the same identifier (e.g. from extensions). So we make sure to only
            // show a single entry per identifier we handled.
            const handledEntries = new Set();
            for (const entry of this.viewModel.entries) {
                if (!handledEntries.has(entry.id)) {
                    actions.push(new statusbarActions_1.ToggleStatusbarEntryVisibilityAction(entry.id, entry.name, this.viewModel));
                    handledEntries.add(entry.id);
                }
            }
            // Figure out if mouse is over an entry
            let statusEntryUnderMouse = undefined;
            for (let element = event.target; element; element = element.parentElement) {
                const entry = this.viewModel.findEntry(element);
                if (entry) {
                    statusEntryUnderMouse = entry;
                    break;
                }
            }
            if (statusEntryUnderMouse) {
                actions.push(new actions_1.Separator());
                actions.push(new statusbarActions_1.HideStatusbarEntryAction(statusEntryUnderMouse.id, statusEntryUnderMouse.name, this.viewModel));
            }
            return actions;
        }
        updateStyles() {
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            const styleOverride = [...this.styleOverrides].sort((a, b) => a.priority - b.priority)[0];
            // Background / foreground colors
            const backgroundColor = this.getColor(styleOverride?.background ?? (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ? theme_1.STATUS_BAR_BACKGROUND : theme_1.STATUS_BAR_NO_FOLDER_BACKGROUND)) || '';
            container.style.backgroundColor = backgroundColor;
            const foregroundColor = this.getColor(styleOverride?.foreground ?? (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ? theme_1.STATUS_BAR_FOREGROUND : theme_1.STATUS_BAR_NO_FOLDER_FOREGROUND)) || '';
            container.style.color = foregroundColor;
            const itemBorderColor = this.getColor(theme_1.STATUS_BAR_ITEM_FOCUS_BORDER);
            // Border color
            const borderColor = this.getColor(styleOverride?.border ?? (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ? theme_1.STATUS_BAR_BORDER : theme_1.STATUS_BAR_NO_FOLDER_BORDER)) || this.getColor(colorRegistry_1.contrastBorder);
            if (borderColor) {
                container.classList.add('status-border-top');
                container.style.setProperty('--status-border-top-color', borderColor);
            }
            else {
                container.classList.remove('status-border-top');
                container.style.removeProperty('--status-border-top-color');
            }
            // Colors and focus outlines via dynamic stylesheet
            const statusBarFocusColor = this.getColor(theme_1.STATUS_BAR_FOCUS_BORDER);
            if (!this.styleElement) {
                this.styleElement = (0, dom_1.createStyleSheet)(container);
            }
            this.styleElement.textContent = `

				/* Status bar focus outline */
				.monaco-workbench .part.statusbar:focus {
					outline-color: ${statusBarFocusColor};
				}

				/* Status bar item focus outline */
				.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:focus-visible {
					outline: 1px solid ${this.getColor(colorRegistry_1.activeContrastBorder) ?? itemBorderColor};
					outline-offset: ${borderColor ? '-2px' : '-1px'};
				}

				/* Notification Beak */
				.monaco-workbench .part.statusbar > .items-container > .statusbar-item.has-beak > .status-bar-item-beak-container:before {
					border-bottom-color: ${backgroundColor};
				}
			`;
        }
        layout(width, height, top, left) {
            super.layout(width, height, top, left);
            super.layoutContents(width, height);
        }
        overrideStyle(style) {
            this.styleOverrides.add(style);
            this.updateStyles();
            return (0, lifecycle_1.toDisposable)(() => {
                this.styleOverrides.delete(style);
                this.updateStyles();
            });
        }
        toJSON() {
            return {
                type: "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */
            };
        }
        dispose() {
            this._onWillDispose.fire();
            super.dispose();
        }
    };
    StatusbarPart = StatusbarPart_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, storage_1.IStorageService),
        __param(5, layoutService_1.IWorkbenchLayoutService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, contextkey_1.IContextKeyService)
    ], StatusbarPart);
    let MainStatusbarPart = class MainStatusbarPart extends StatusbarPart {
        constructor(instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService) {
            super("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService);
        }
    };
    exports.MainStatusbarPart = MainStatusbarPart;
    exports.MainStatusbarPart = MainStatusbarPart = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, themeService_1.IThemeService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, contextkey_1.IContextKeyService)
    ], MainStatusbarPart);
    let AuxiliaryStatusbarPart = class AuxiliaryStatusbarPart extends StatusbarPart {
        static { AuxiliaryStatusbarPart_1 = this; }
        static { this.COUNTER = 1; }
        constructor(container, instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService) {
            const id = AuxiliaryStatusbarPart_1.COUNTER++;
            super(`workbench.parts.auxiliaryStatus.${id}`, instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService);
            this.container = container;
            this.height = StatusbarPart.HEIGHT;
        }
    };
    exports.AuxiliaryStatusbarPart = AuxiliaryStatusbarPart;
    exports.AuxiliaryStatusbarPart = AuxiliaryStatusbarPart = AuxiliaryStatusbarPart_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, storage_1.IStorageService),
        __param(5, layoutService_1.IWorkbenchLayoutService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, contextkey_1.IContextKeyService)
    ], AuxiliaryStatusbarPart);
    let StatusbarService = class StatusbarService extends part_1.MultiWindowParts {
        constructor(instantiationService, storageService, themeService) {
            super('workbench.statusBarService', themeService, storageService);
            this.instantiationService = instantiationService;
            this.mainPart = this._register(this.instantiationService.createInstance(MainStatusbarPart));
            this._onDidCreateAuxiliaryStatusbarPart = this._register(new event_1.Emitter());
            this.onDidCreateAuxiliaryStatusbarPart = this._onDidCreateAuxiliaryStatusbarPart.event;
            //#endregion
            //#region Service Implementation
            this.onDidChangeEntryVisibility = this.mainPart.onDidChangeEntryVisibility;
            this._register(this.registerPart(this.mainPart));
        }
        //#region Auxiliary Statusbar Parts
        createAuxiliaryStatusbarPart(container) {
            // Container
            const statusbarPartContainer = document.createElement('footer');
            statusbarPartContainer.classList.add('part', 'statusbar');
            statusbarPartContainer.setAttribute('role', 'status');
            statusbarPartContainer.style.position = 'relative';
            statusbarPartContainer.setAttribute('aria-live', 'off');
            statusbarPartContainer.setAttribute('tabindex', '0');
            container.appendChild(statusbarPartContainer);
            // Statusbar Part
            const statusbarPart = this.instantiationService.createInstance(AuxiliaryStatusbarPart, statusbarPartContainer);
            const disposable = this.registerPart(statusbarPart);
            statusbarPart.create(statusbarPartContainer);
            event_1.Event.once(statusbarPart.onWillDispose)(() => disposable.dispose());
            // Emit internal event
            this._onDidCreateAuxiliaryStatusbarPart.fire(statusbarPart);
            return statusbarPart;
        }
        createScoped(statusbarEntryContainer, disposables) {
            return disposables.add(this.instantiationService.createInstance(ScopedStatusbarService, statusbarEntryContainer));
        }
        addEntry(entry, id, alignment, priorityOrLocation = 0) {
            if (entry.showInAllWindows) {
                return this.doAddEntryToAllWindows(entry, id, alignment, priorityOrLocation);
            }
            return this.mainPart.addEntry(entry, id, alignment, priorityOrLocation);
        }
        doAddEntryToAllWindows(entry, id, alignment, priorityOrLocation = 0) {
            const entryDisposables = new lifecycle_1.DisposableStore();
            const accessors = new Set();
            function addEntry(part) {
                const partDisposables = new lifecycle_1.DisposableStore();
                partDisposables.add(part.onWillDispose(() => partDisposables.dispose()));
                const accessor = partDisposables.add(part.addEntry(entry, id, alignment, priorityOrLocation));
                accessors.add(accessor);
                partDisposables.add((0, lifecycle_1.toDisposable)(() => accessors.delete(accessor)));
                entryDisposables.add(partDisposables);
                partDisposables.add((0, lifecycle_1.toDisposable)(() => entryDisposables.delete(partDisposables)));
            }
            for (const part of this.parts) {
                addEntry(part);
            }
            entryDisposables.add(this.onDidCreateAuxiliaryStatusbarPart(part => addEntry(part)));
            return {
                update: (entry) => {
                    for (const update of accessors) {
                        update.update(entry);
                    }
                },
                dispose: () => entryDisposables.dispose()
            };
        }
        isEntryVisible(id) {
            return this.mainPart.isEntryVisible(id);
        }
        updateEntryVisibility(id, visible) {
            for (const part of this.parts) {
                part.updateEntryVisibility(id, visible);
            }
        }
        focus(preserveEntryFocus) {
            this.activePart.focus(preserveEntryFocus);
        }
        focusNextEntry() {
            this.activePart.focusNextEntry();
        }
        focusPreviousEntry() {
            this.activePart.focusPreviousEntry();
        }
        isEntryFocused() {
            return this.activePart.isEntryFocused();
        }
        overrideStyle(style) {
            const disposables = new lifecycle_1.DisposableStore();
            for (const part of this.parts) {
                disposables.add(part.overrideStyle(style));
            }
            return disposables;
        }
    };
    exports.StatusbarService = StatusbarService;
    exports.StatusbarService = StatusbarService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, storage_1.IStorageService),
        __param(2, themeService_1.IThemeService)
    ], StatusbarService);
    let ScopedStatusbarService = class ScopedStatusbarService extends lifecycle_1.Disposable {
        constructor(statusbarEntryContainer, statusbarService) {
            super();
            this.statusbarEntryContainer = statusbarEntryContainer;
            this.statusbarService = statusbarService;
            this.onDidChangeEntryVisibility = this.statusbarEntryContainer.onDidChangeEntryVisibility;
        }
        createAuxiliaryStatusbarPart(container) {
            return this.statusbarService.createAuxiliaryStatusbarPart(container);
        }
        createScoped(statusbarEntryContainer, disposables) {
            return this.statusbarService.createScoped(statusbarEntryContainer, disposables);
        }
        getPart() {
            return this.statusbarEntryContainer;
        }
        addEntry(entry, id, alignment, priorityOrLocation = 0) {
            return this.statusbarEntryContainer.addEntry(entry, id, alignment, priorityOrLocation);
        }
        isEntryVisible(id) {
            return this.statusbarEntryContainer.isEntryVisible(id);
        }
        updateEntryVisibility(id, visible) {
            this.statusbarEntryContainer.updateEntryVisibility(id, visible);
        }
        focus(preserveEntryFocus) {
            this.statusbarEntryContainer.focus(preserveEntryFocus);
        }
        focusNextEntry() {
            this.statusbarEntryContainer.focusNextEntry();
        }
        focusPreviousEntry() {
            this.statusbarEntryContainer.focusPreviousEntry();
        }
        isEntryFocused() {
            return this.statusbarEntryContainer.isEntryFocused();
        }
        overrideStyle(style) {
            return this.statusbarEntryContainer.overrideStyle(style);
        }
    };
    exports.ScopedStatusbarService = ScopedStatusbarService;
    exports.ScopedStatusbarService = ScopedStatusbarService = __decorate([
        __param(1, statusbar_1.IStatusbarService)
    ], ScopedStatusbarService);
    (0, extensions_1.registerSingleton)(statusbar_1.IStatusbarService, StatusbarService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzYmFyUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvc3RhdHVzYmFyL3N0YXR1c2JhclBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTRHaEcsSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYyxTQUFRLFdBQUk7O2lCQUVmLFdBQU0sR0FBRyxFQUFFLEFBQUwsQ0FBTTtRQXFDNUIsWUFDQyxFQUFVLEVBQ2Esb0JBQTRELEVBQ3BFLFlBQTJCLEVBQ2hCLGNBQXlELEVBQ2xFLGNBQWdELEVBQ3hDLGFBQXNDLEVBQzFDLGtCQUF3RCxFQUN6RCxpQkFBc0Q7WUFFMUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBUnBDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFFeEMsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUUzQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3hDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUEzQzNFLGVBQWU7WUFFTixpQkFBWSxHQUFXLENBQUMsQ0FBQztZQUN6QixpQkFBWSxHQUFXLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztZQUNoRCxrQkFBYSxHQUFXLGVBQWEsQ0FBQyxNQUFNLENBQUM7WUFDN0Msa0JBQWEsR0FBVyxlQUFhLENBQUMsTUFBTSxDQUFDO1lBTTlDLG1CQUFjLEdBQTZCLEVBQUUsQ0FBQztZQUVyQyxjQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLG1DQUFrQixDQUFDLElBQUksQ0FBQyxjQUFjLENB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