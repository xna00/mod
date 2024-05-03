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
define(["require", "exports", "vs/nls", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/browser/parts/editor/editorPart", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/base/common/arrays", "vs/workbench/browser/parts/editor/auxiliaryEditorPart", "vs/workbench/browser/part", "vs/base/common/async", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/base/browser/dom", "vs/base/browser/browser"], function (require, exports, nls_1, editorGroupsService_1, event_1, lifecycle_1, editorPart_1, extensions_1, instantiation_1, arrays_1, auxiliaryEditorPart_1, part_1, async_1, storage_1, themeService_1, dom_1, browser_1) {
    "use strict";
    var EditorParts_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorParts = void 0;
    let EditorParts = class EditorParts extends part_1.MultiWindowParts {
        static { EditorParts_1 = this; }
        constructor(instantiationService, storageService, themeService) {
            super('workbench.editorParts', themeService, storageService);
            this.instantiationService = instantiationService;
            this.mainPart = this._register(this.createMainEditorPart());
            this.mostRecentActiveParts = [this.mainPart];
            //#region Auxiliary Editor Parts
            this._onDidCreateAuxiliaryEditorPart = this._register(new event_1.Emitter());
            this.onDidCreateAuxiliaryEditorPart = this._onDidCreateAuxiliaryEditorPart.event;
            this.workspaceMemento = this.getMemento(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            this._isReady = false;
            this.whenReadyPromise = new async_1.DeferredPromise();
            this.whenReady = this.whenReadyPromise.p;
            this.whenRestoredPromise = new async_1.DeferredPromise();
            this.whenRestored = this.whenRestoredPromise.p;
            //#endregion
            //#region Events
            this._onDidActiveGroupChange = this._register(new event_1.Emitter());
            this.onDidChangeActiveGroup = this._onDidActiveGroupChange.event;
            this._onDidAddGroup = this._register(new event_1.Emitter());
            this.onDidAddGroup = this._onDidAddGroup.event;
            this._onDidRemoveGroup = this._register(new event_1.Emitter());
            this.onDidRemoveGroup = this._onDidRemoveGroup.event;
            this._onDidMoveGroup = this._register(new event_1.Emitter());
            this.onDidMoveGroup = this._onDidMoveGroup.event;
            this._onDidActivateGroup = this._register(new event_1.Emitter());
            this.onDidActivateGroup = this._onDidActivateGroup.event;
            this._onDidChangeGroupIndex = this._register(new event_1.Emitter());
            this.onDidChangeGroupIndex = this._onDidChangeGroupIndex.event;
            this._onDidChangeGroupLocked = this._register(new event_1.Emitter());
            this.onDidChangeGroupLocked = this._onDidChangeGroupLocked.event;
            this._onDidChangeGroupMaximized = this._register(new event_1.Emitter());
            this.onDidChangeGroupMaximized = this._onDidChangeGroupMaximized.event;
            this._register(this.registerPart(this.mainPart));
            this.restoreParts();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.onDidChangeMementoValue(1 /* StorageScope.WORKSPACE */, this._store)(e => this.onDidChangeMementoState(e)));
        }
        createMainEditorPart() {
            return this.instantiationService.createInstance(editorPart_1.MainEditorPart, this);
        }
        async createAuxiliaryEditorPart(options) {
            const { part, instantiationService, disposables } = await this.instantiationService.createInstance(auxiliaryEditorPart_1.AuxiliaryEditorPart, this).create(this.getGroupsLabel(this._parts.size), options);
            // Events
            this._onDidAddGroup.fire(part.activeGroup);
            const eventDisposables = disposables.add(new lifecycle_1.DisposableStore());
            this._onDidCreateAuxiliaryEditorPart.fire({ part, instantiationService, disposables: eventDisposables });
            return part;
        }
        //#endregion
        //#region Registration
        registerPart(part) {
            const disposables = this._register(new lifecycle_1.DisposableStore());
            disposables.add(super.registerPart(part));
            this.registerEditorPartListeners(part, disposables);
            return disposables;
        }
        unregisterPart(part) {
            super.unregisterPart(part);
            // Notify all parts about a groups label change
            // given it is computed based on the index
            this.parts.forEach((part, index) => {
                if (part === this.mainPart) {
                    return;
                }
                part.notifyGroupsLabelChange(this.getGroupsLabel(index));
            });
        }
        registerEditorPartListeners(part, disposables) {
            disposables.add(part.onDidFocus(() => {
                this.doUpdateMostRecentActive(part, true);
                if (this._parts.size > 1) {
                    this._onDidActiveGroupChange.fire(this.activeGroup); // this can only happen when we have more than 1 editor part
                }
            }));
            disposables.add((0, lifecycle_1.toDisposable)(() => this.doUpdateMostRecentActive(part)));
            disposables.add(part.onDidChangeActiveGroup(group => this._onDidActiveGroupChange.fire(group)));
            disposables.add(part.onDidAddGroup(group => this._onDidAddGroup.fire(group)));
            disposables.add(part.onDidRemoveGroup(group => this._onDidRemoveGroup.fire(group)));
            disposables.add(part.onDidMoveGroup(group => this._onDidMoveGroup.fire(group)));
            disposables.add(part.onDidActivateGroup(group => this._onDidActivateGroup.fire(group)));
            disposables.add(part.onDidChangeGroupMaximized(maximized => this._onDidChangeGroupMaximized.fire(maximized)));
            disposables.add(part.onDidChangeGroupIndex(group => this._onDidChangeGroupIndex.fire(group)));
            disposables.add(part.onDidChangeGroupLocked(group => this._onDidChangeGroupLocked.fire(group)));
        }
        doUpdateMostRecentActive(part, makeMostRecentlyActive) {
            const index = this.mostRecentActiveParts.indexOf(part);
            // Remove from MRU list
            if (index !== -1) {
                this.mostRecentActiveParts.splice(index, 1);
            }
            // Add to front as needed
            if (makeMostRecentlyActive) {
                this.mostRecentActiveParts.unshift(part);
            }
        }
        getGroupsLabel(index) {
            return (0, nls_1.localize)('groupLabel', "Window {0}", index + 1);
        }
        getPart(groupOrElement) {
            if (this._parts.size > 1) {
                if (groupOrElement instanceof HTMLElement) {
                    const element = groupOrElement;
                    return this.getPartByDocument(element.ownerDocument);
                }
                else {
                    const group = groupOrElement;
                    let id;
                    if (typeof group === 'number') {
                        id = group;
                    }
                    else {
                        id = group.id;
                    }
                    for (const part of this._parts) {
                        if (part.hasGroup(id)) {
                            return part;
                        }
                    }
                }
            }
            return this.mainPart;
        }
        //#endregion
        //#region Lifecycle / State
        static { this.EDITOR_PARTS_UI_STATE_STORAGE_KEY = 'editorparts.state'; }
        get isReady() { return this._isReady; }
        async restoreParts() {
            // Join on the main part being ready to pick
            // the right moment to begin restoring.
            // The main part is automatically being created
            // as part of the overall startup process.
            await this.mainPart.whenReady;
            // Only attempt to restore auxiliary editor parts
            // when the main part did restore. It is possible
            // that restoring was not attempted because specific
            // editors were opened.
            if (this.mainPart.willRestoreState) {
                const state = this.loadState();
                if (state) {
                    await this.restoreState(state);
                }
            }
            const mostRecentActivePart = (0, arrays_1.firstOrDefault)(this.mostRecentActiveParts);
            mostRecentActivePart?.activeGroup.focus();
            this._isReady = true;
            this.whenReadyPromise.complete();
            // Await restored
            await Promise.allSettled(this.parts.map(part => part.whenRestored));
            this.whenRestoredPromise.complete();
        }
        loadState() {
            return this.workspaceMemento[EditorParts_1.EDITOR_PARTS_UI_STATE_STORAGE_KEY];
        }
        saveState() {
            const state = this.createState();
            if (state.auxiliary.length === 0) {
                delete this.workspaceMemento[EditorParts_1.EDITOR_PARTS_UI_STATE_STORAGE_KEY];
            }
            else {
                this.workspaceMemento[EditorParts_1.EDITOR_PARTS_UI_STATE_STORAGE_KEY] = state;
            }
        }
        createState() {
            return {
                auxiliary: this.parts.filter(part => part !== this.mainPart).map(part => {
                    return {
                        state: part.createState(),
                        bounds: (() => {
                            const auxiliaryWindow = (0, dom_1.getWindow)(part.getContainer());
                            if (auxiliaryWindow) {
                                return {
                                    x: auxiliaryWindow.screenX,
                                    y: auxiliaryWindow.screenY,
                                    width: auxiliaryWindow.outerWidth,
                                    height: auxiliaryWindow.outerHeight
                                };
                            }
                            return undefined;
                        })(),
                        zoomLevel: (() => {
                            const auxiliaryWindow = (0, dom_1.getWindow)(part.getContainer());
                            if (auxiliaryWindow) {
                                return (0, browser_1.getZoomLevel)(auxiliaryWindow);
                            }
                            return undefined;
                        })()
                    };
                }),
                mru: this.mostRecentActiveParts.map(part => this.parts.indexOf(part))
            };
        }
        async restoreState(state) {
            if (state.auxiliary.length) {
                const auxiliaryEditorPartPromises = [];
                // Create auxiliary editor parts
                for (const auxiliaryEditorPartState of state.auxiliary) {
                    auxiliaryEditorPartPromises.push(this.createAuxiliaryEditorPart({
                        bounds: auxiliaryEditorPartState.bounds,
                        state: auxiliaryEditorPartState.state,
                        zoomLevel: auxiliaryEditorPartState.zoomLevel
                    }));
                }
                // Await creation
                await Promise.allSettled(auxiliaryEditorPartPromises);
                // Update MRU list
                if (state.mru.length === this.parts.length) {
                    this.mostRecentActiveParts = state.mru.map(index => this.parts[index]);
                }
                else {
                    this.mostRecentActiveParts = [...this.parts];
                }
                // Await ready
                await Promise.allSettled(this.parts.map(part => part.whenReady));
            }
        }
        get hasRestorableState() {
            return this.parts.some(part => part.hasRestorableState);
        }
        onDidChangeMementoState(e) {
            if (e.external && e.scope === 1 /* StorageScope.WORKSPACE */) {
                this.reloadMemento(e.scope);
                const state = this.loadState();
                if (state) {
                    this.applyState(state);
                }
            }
        }
        async applyState(state) {
            // Close all editors and auxiliary parts first
            for (const part of this.parts) {
                if (part === this.mainPart) {
                    continue; // main part takes care on its own
                }
                for (const group of part.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                    const closed = await group.closeAllEditors();
                    if (!closed) {
                        return false;
                    }
                }
                part.close();
            }
            // Restore auxiliary state
            await this.restoreState(state);
            return true;
        }
        //#endregion
        //#region Editor Groups Service
        get activeGroup() {
            return this.activePart.activeGroup;
        }
        get sideGroup() {
            return this.activePart.sideGroup;
        }
        get groups() {
            return this.getGroups();
        }
        get count() {
            return this.groups.length;
        }
        getGroups(order = 0 /* GroupsOrder.CREATION_TIME */) {
            if (this._parts.size > 1) {
                let parts;
                switch (order) {
                    case 2 /* GroupsOrder.GRID_APPEARANCE */: // we currently do not have a way to compute by appearance over multiple windows
                    case 0 /* GroupsOrder.CREATION_TIME */:
                        parts = this.parts;
                        break;
                    case 1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */:
                        parts = (0, arrays_1.distinct)([...this.mostRecentActiveParts, ...this.parts]); // always ensure all parts are included
                        break;
                }
                return parts.map(part => part.getGroups(order)).flat();
            }
            return this.mainPart.getGroups(order);
        }
        getGroup(identifier) {
            if (this._parts.size > 1) {
                for (const part of this._parts) {
                    const group = part.getGroup(identifier);
                    if (group) {
                        return group;
                    }
                }
            }
            return this.mainPart.getGroup(identifier);
        }
        assertGroupView(group) {
            let groupView;
            if (typeof group === 'number') {
                groupView = this.getGroup(group);
            }
            else {
                groupView = group;
            }
            if (!groupView) {
                throw new Error('Invalid editor group provided!');
            }
            return groupView;
        }
        activateGroup(group) {
            return this.getPart(group).activateGroup(group);
        }
        getSize(group) {
            return this.getPart(group).getSize(group);
        }
        setSize(group, size) {
            this.getPart(group).setSize(group, size);
        }
        arrangeGroups(arrangement, group) {
            (group !== undefined ? this.getPart(group) : this.activePart).arrangeGroups(arrangement, group);
        }
        toggleMaximizeGroup(group) {
            (group !== undefined ? this.getPart(group) : this.activePart).toggleMaximizeGroup(group);
        }
        toggleExpandGroup(group) {
            (group !== undefined ? this.getPart(group) : this.activePart).toggleExpandGroup(group);
        }
        restoreGroup(group) {
            return this.getPart(group).restoreGroup(group);
        }
        applyLayout(layout) {
            this.activePart.applyLayout(layout);
        }
        getLayout() {
            return this.activePart.getLayout();
        }
        get orientation() {
            return this.activePart.orientation;
        }
        setGroupOrientation(orientation) {
            this.activePart.setGroupOrientation(orientation);
        }
        findGroup(scope, source = this.activeGroup, wrap) {
            const sourcePart = this.getPart(source);
            if (this._parts.size > 1) {
                const groups = this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
                // Ensure that FIRST/LAST dispatches globally over all parts
                if (scope.location === 0 /* GroupLocation.FIRST */ || scope.location === 1 /* GroupLocation.LAST */) {
                    return scope.location === 0 /* GroupLocation.FIRST */ ? groups[0] : groups[groups.length - 1];
                }
                // Try to find in target part first without wrapping
                const group = sourcePart.findGroup(scope, source, false);
                if (group) {
                    return group;
                }
                // Ensure that NEXT/PREVIOUS dispatches globally over all parts
                if (scope.location === 2 /* GroupLocation.NEXT */ || scope.location === 3 /* GroupLocation.PREVIOUS */) {
                    const sourceGroup = this.assertGroupView(source);
                    const index = groups.indexOf(sourceGroup);
                    if (scope.location === 2 /* GroupLocation.NEXT */) {
                        let nextGroup = groups[index + 1];
                        if (!nextGroup && wrap) {
                            nextGroup = groups[0];
                        }
                        return nextGroup;
                    }
                    else {
                        let previousGroup = groups[index - 1];
                        if (!previousGroup && wrap) {
                            previousGroup = groups[groups.length - 1];
                        }
                        return previousGroup;
                    }
                }
            }
            return sourcePart.findGroup(scope, source, wrap);
        }
        addGroup(location, direction) {
            return this.getPart(location).addGroup(location, direction);
        }
        removeGroup(group) {
            this.getPart(group).removeGroup(group);
        }
        moveGroup(group, location, direction) {
            return this.getPart(group).moveGroup(group, location, direction);
        }
        mergeGroup(group, target, options) {
            return this.getPart(group).mergeGroup(group, target, options);
        }
        mergeAllGroups(target) {
            return this.activePart.mergeAllGroups(target);
        }
        copyGroup(group, location, direction) {
            return this.getPart(group).copyGroup(group, location, direction);
        }
        createEditorDropTarget(container, delegate) {
            return this.getPart(container).createEditorDropTarget(container, delegate);
        }
        //#endregion
        //#region Main Editor Part Only
        get partOptions() { return this.mainPart.partOptions; }
        get onDidChangeEditorPartOptions() { return this.mainPart.onDidChangeEditorPartOptions; }
    };
    exports.EditorParts = EditorParts;
    exports.EditorParts = EditorParts = EditorParts_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, storage_1.IStorageService),
        __param(2, themeService_1.IThemeService)
    ], EditorParts);
    (0, extensions_1.registerSingleton)(editorGroupsService_1.IEditorGroupsService, EditorParts, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUGFydHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JQYXJ0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBZ0N6RixJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFZLFNBQVEsdUJBQTRCOztRQVE1RCxZQUN3QixvQkFBNEQsRUFDbEUsY0FBK0IsRUFDakMsWUFBMkI7WUFFMUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUpyQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBTDNFLGFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUM7WUFFeEQsMEJBQXFCLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUF1QmhELGdDQUFnQztZQUVmLG9DQUErQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW1DLENBQUMsQ0FBQztZQUN6RyxtQ0FBOEIsR0FBRyxJQUFJLENBQUMsK0JBQStCLENBQUMsS0FBSyxDQUFDO1lBd0hwRSxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsVUFBVSw0REFBNEMsQ0FBQztZQUV4RixhQUFRLEdBQUcsS0FBSyxDQUFDO1lBR1IscUJBQWdCLEdBQUcsSUFBSSx1QkFBZSxFQUFRLENBQUM7WUFDdkQsY0FBUyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFFNUIsd0JBQW1CLEdBQUcsSUFBSSx1QkFBZSxFQUFRLENBQUM7WUFDMUQsaUJBQVksR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBZ0puRCxZQUFZO1lB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