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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/platform/window/common/window", "vs/workbench/browser/parts/editor/editorPart", "vs/workbench/browser/parts/titlebar/windowTitle", "vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/services/title/browser/titleService"], function (require, exports, browser_1, dom_1, event_1, lifecycle_1, platform_1, configuration_1, contextkey_1, instantiation_1, serviceCollection_1, storage_1, themeService_1, window_1, editorPart_1, windowTitle_1, auxiliaryWindowService_1, editorService_1, host_1, layoutService_1, lifecycle_2, statusbar_1, titleService_1) {
    "use strict";
    var AuxiliaryEditorPart_1, AuxiliaryEditorPartImpl_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuxiliaryEditorPart = void 0;
    let AuxiliaryEditorPart = class AuxiliaryEditorPart {
        static { AuxiliaryEditorPart_1 = this; }
        static { this.STATUS_BAR_VISIBILITY = 'workbench.statusBar.visible'; }
        constructor(editorPartsView, instantiationService, auxiliaryWindowService, lifecycleService, configurationService, statusbarService, titleService, editorService, layoutService) {
            this.editorPartsView = editorPartsView;
            this.instantiationService = instantiationService;
            this.auxiliaryWindowService = auxiliaryWindowService;
            this.lifecycleService = lifecycleService;
            this.configurationService = configurationService;
            this.statusbarService = statusbarService;
            this.titleService = titleService;
            this.editorService = editorService;
            this.layoutService = layoutService;
        }
        async create(label, options) {
            function computeEditorPartHeightOffset() {
                let editorPartHeightOffset = 0;
                if (statusbarVisible) {
                    editorPartHeightOffset += statusbarPart.height;
                }
                if (titlebarPart && titlebarVisible) {
                    editorPartHeightOffset += titlebarPart.height;
                }
                return editorPartHeightOffset;
            }
            function updateStatusbarVisibility(fromEvent) {
                if (statusbarVisible) {
                    (0, dom_1.show)(statusbarPart.container);
                }
                else {
                    (0, dom_1.hide)(statusbarPart.container);
                }
                if (fromEvent) {
                    auxiliaryWindow.layout();
                }
            }
            function updateTitlebarVisibility(fromEvent) {
                if (!titlebarPart) {
                    return;
                }
                if (titlebarVisible) {
                    (0, dom_1.show)(titlebarPart.container);
                }
                else {
                    (0, dom_1.hide)(titlebarPart.container);
                }
                if (fromEvent) {
                    auxiliaryWindow.layout();
                }
            }
            const disposables = new lifecycle_1.DisposableStore();
            // Auxiliary Window
            const auxiliaryWindow = disposables.add(await this.auxiliaryWindowService.open(options));
            // Editor Part
            const editorPartContainer = document.createElement('div');
            editorPartContainer.classList.add('part', 'editor');
            editorPartContainer.setAttribute('role', 'main');
            editorPartContainer.style.position = 'relative';
            auxiliaryWindow.container.appendChild(editorPartContainer);
            const editorPart = disposables.add(this.instantiationService.createInstance(AuxiliaryEditorPartImpl, auxiliaryWindow.window.vscodeWindowId, this.editorPartsView, options?.state, label));
            disposables.add(this.editorPartsView.registerPart(editorPart));
            editorPart.create(editorPartContainer);
            // Titlebar
            let titlebarPart = undefined;
            let titlebarVisible = false;
            const useCustomTitle = platform_1.isNative && (0, window_1.hasCustomTitlebar)(this.configurationService); // custom title in aux windows only enabled in native
            if (useCustomTitle) {
                titlebarPart = disposables.add(this.titleService.createAuxiliaryTitlebarPart(auxiliaryWindow.container, editorPart));
                titlebarVisible = (0, layoutService_1.shouldShowCustomTitleBar)(this.configurationService, auxiliaryWindow.window);
                const handleTitleBarVisibilityEvent = () => {
                    const oldTitlebarPartVisible = titlebarVisible;
                    titlebarVisible = (0, layoutService_1.shouldShowCustomTitleBar)(this.configurationService, auxiliaryWindow.window);
                    if (oldTitlebarPartVisible !== titlebarVisible) {
                        updateTitlebarVisibility(true);
                    }
                };
                disposables.add(titlebarPart.onDidChange(() => auxiliaryWindow.layout()));
                disposables.add(this.layoutService.onDidChangePartVisibility(() => handleTitleBarVisibilityEvent()));
                disposables.add((0, browser_1.onDidChangeFullscreen)(windowId => {
                    if (windowId !== auxiliaryWindow.window.vscodeWindowId) {
                        return; // ignore all but our window
                    }
                    handleTitleBarVisibilityEvent();
                }));
                updateTitlebarVisibility(false);
            }
            else {
                disposables.add(this.instantiationService.createInstance(windowTitle_1.WindowTitle, auxiliaryWindow.window, editorPart));
            }
            // Statusbar
            const statusbarPart = disposables.add(this.statusbarService.createAuxiliaryStatusbarPart(auxiliaryWindow.container));
            let statusbarVisible = this.configurationService.getValue(AuxiliaryEditorPart_1.STATUS_BAR_VISIBILITY) !== false;
            disposables.add(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(AuxiliaryEditorPart_1.STATUS_BAR_VISIBILITY)) {
                    statusbarVisible = this.configurationService.getValue(AuxiliaryEditorPart_1.STATUS_BAR_VISIBILITY) !== false;
                    updateStatusbarVisibility(true);
                }
            }));
            updateStatusbarVisibility(false);
            // Lifecycle
            const editorCloseListener = disposables.add(event_1.Event.once(editorPart.onWillClose)(() => auxiliaryWindow.window.close()));
            disposables.add(event_1.Event.once(auxiliaryWindow.onUnload)(() => {
                if (disposables.isDisposed) {
                    return; // the close happened as part of an earlier dispose call
                }
                editorCloseListener.dispose();
                editorPart.close();
                disposables.dispose();
            }));
            disposables.add(event_1.Event.once(this.lifecycleService.onDidShutdown)(() => disposables.dispose()));
            disposables.add(auxiliaryWindow.onBeforeUnload(event => {
                for (const group of editorPart.groups) {
                    for (const editor of group.editors) {
                        // Closing an auxiliary window with opened editors
                        // will move the editors to the main window. As such,
                        // we need to validate that we can move and otherwise
                        // prevent the window from closing.
                        const canMoveVeto = editor.canMove(group.id, this.editorPartsView.mainPart.activeGroup.id);
                        if (typeof canMoveVeto === 'string') {
                            group.openEditor(editor);
                            event.veto(canMoveVeto);
                            break;
                        }
                    }
                }
            }));
            // Layout: specifically `onWillLayout` to have a chance
            // to build the aux editor part before other components
            // have a chance to react.
            disposables.add(auxiliaryWindow.onWillLayout(dimension => {
                const titlebarPartHeight = titlebarPart?.height ?? 0;
                titlebarPart?.layout(dimension.width, titlebarPartHeight, 0, 0);
                const editorPartHeight = dimension.height - computeEditorPartHeightOffset();
                editorPart.layout(dimension.width, editorPartHeight, titlebarPartHeight, 0);
                statusbarPart.layout(dimension.width, statusbarPart.height, dimension.height - statusbarPart.height, 0);
            }));
            auxiliaryWindow.layout();
            // Have a InstantiationService that is scoped to the auxiliary window
            const instantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([statusbar_1.IStatusbarService, this.statusbarService.createScoped(statusbarPart, disposables)], [editorService_1.IEditorService, this.editorService.createScoped(editorPart, disposables)]));
            return {
                part: editorPart,
                instantiationService,
                disposables
            };
        }
    };
    exports.AuxiliaryEditorPart = AuxiliaryEditorPart;
    exports.AuxiliaryEditorPart = AuxiliaryEditorPart = AuxiliaryEditorPart_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, auxiliaryWindowService_1.IAuxiliaryWindowService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, statusbar_1.IStatusbarService),
        __param(6, titleService_1.ITitleService),
        __param(7, editorService_1.IEditorService),
        __param(8, layoutService_1.IWorkbenchLayoutService)
    ], AuxiliaryEditorPart);
    let AuxiliaryEditorPartImpl = class AuxiliaryEditorPartImpl extends editorPart_1.EditorPart {
        static { AuxiliaryEditorPartImpl_1 = this; }
        static { this.COUNTER = 1; }
        constructor(windowId, editorPartsView, state, groupsLabel, instantiationService, themeService, configurationService, storageService, layoutService, hostService, contextKeyService) {
            const id = AuxiliaryEditorPartImpl_1.COUNTER++;
            super(editorPartsView, `workbench.parts.auxiliaryEditor.${id}`, groupsLabel, windowId, instantiationService, themeService, configurationService, storageService, layoutService, hostService, contextKeyService);
            this.state = state;
            this._onWillClose = this._register(new event_1.Emitter());
            this.onWillClose = this._onWillClose.event;
        }
        removeGroup(group, preserveFocus) {
            // Close aux window when last group removed
            const groupView = this.assertGroupView(group);
            if (this.count === 1 && this.activeGroup === groupView) {
                this.doRemoveLastGroup(preserveFocus);
            }
            // Otherwise delegate to parent implementation
            else {
                super.removeGroup(group, preserveFocus);
            }
        }
        doRemoveLastGroup(preserveFocus) {
            const restoreFocus = !preserveFocus && this.shouldRestoreFocus(this.container);
            // Activate next group
            const mostRecentlyActiveGroups = this.editorPartsView.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            const nextActiveGroup = mostRecentlyActiveGroups[1]; // [0] will be the current group we are about to dispose
            if (nextActiveGroup) {
                nextActiveGroup.groupsView.activateGroup(nextActiveGroup);
                if (restoreFocus) {
                    nextActiveGroup.focus();
                }
            }
            this.doClose(false /* do not merge any groups to main part */);
        }
        loadState() {
            return this.state;
        }
        saveState() {
            return; // disabled, auxiliary editor part state is tracked outside
        }
        close() {
            this.doClose(true /* merge all groups to main part */);
        }
        doClose(mergeGroupsToMainPart) {
            if (mergeGroupsToMainPart) {
                this.mergeGroupsToMainPart();
            }
            this._onWillClose.fire();
        }
        mergeGroupsToMainPart() {
            if (!this.groups.some(group => group.count > 0)) {
                return; // skip if we have no editors opened
            }
            // Find the most recent group that is not locked
            let targetGroup = undefined;
            for (const group of this.editorPartsView.mainPart.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                if (!group.isLocked) {
                    targetGroup = group;
                    break;
                }
            }
            if (!targetGroup) {
                targetGroup = this.editorPartsView.mainPart.addGroup(this.editorPartsView.mainPart.activeGroup, this.partOptions.openSideBySideDirection === 'right' ? 3 /* GroupDirection.RIGHT */ : 1 /* GroupDirection.DOWN */);
            }
            this.mergeAllGroups(targetGroup);
            targetGroup.focus();
        }
    };
    AuxiliaryEditorPartImpl = AuxiliaryEditorPartImpl_1 = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, storage_1.IStorageService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, host_1.IHostService),
        __param(10, contextkey_1.IContextKeyService)
    ], AuxiliaryEditorPartImpl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5RWRpdG9yUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2F1eGlsaWFyeUVkaXRvclBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFDekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBbUI7O2lCQUVoQiwwQkFBcUIsR0FBRyw2QkFBNkIsQUFBaEMsQ0FBaUM7UUFFckUsWUFDa0IsZUFBaUMsRUFDVixvQkFBMkMsRUFDekMsc0JBQStDLEVBQ3JELGdCQUFtQyxFQUMvQixvQkFBMkMsRUFDL0MsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQzFCLGFBQTZCLEVBQ3BCLGFBQXNDO1lBUi9ELG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNWLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDekMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUNyRCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQy9CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDL0MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN2QyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUMxQixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQXlCO1FBRWpGLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQWEsRUFBRSxPQUF5QztZQUVwRSxTQUFTLDZCQUE2QjtnQkFDckMsSUFBSSxzQkFBc0IsR0FBRyxDQUFDLENBQUM7Z0JBRS9CLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztvQkFDdEIsc0JBQXNCLElBQUksYUFBYSxDQUFDLE1BQU0sQ0FBQztnQkFDaEQsQ0FBQztnQkFFRCxJQUFJLFlB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