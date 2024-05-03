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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/actions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/viewParts/notebookKernelView", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/assignment/common/assignmentService", "vs/base/common/async", "vs/platform/actions/browser/toolbar", "vs/platform/hover/browser/hover"], function (require, exports, DOM, scrollableElement_1, toolbar_1, actions_1, event_1, lifecycle_1, menuEntryActionViewItem_1, actions_2, configuration_1, contextView_1, instantiation_1, keybinding_1, coreActions_1, notebookCommon_1, notebookKernelView_1, cellActionView_1, editorService_1, assignmentService_1, async_1, toolbar_2, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorWorkbenchToolbar = exports.RenderLabel = void 0;
    exports.convertConfiguration = convertConfiguration;
    exports.workbenchCalculateActions = workbenchCalculateActions;
    exports.workbenchDynamicCalculateActions = workbenchDynamicCalculateActions;
    var RenderLabel;
    (function (RenderLabel) {
        RenderLabel[RenderLabel["Always"] = 0] = "Always";
        RenderLabel[RenderLabel["Never"] = 1] = "Never";
        RenderLabel[RenderLabel["Dynamic"] = 2] = "Dynamic";
    })(RenderLabel || (exports.RenderLabel = RenderLabel = {}));
    function convertConfiguration(value) {
        switch (value) {
            case true:
                return RenderLabel.Always;
            case false:
                return RenderLabel.Never;
            case 'always':
                return RenderLabel.Always;
            case 'never':
                return RenderLabel.Never;
            case 'dynamic':
                return RenderLabel.Dynamic;
        }
    }
    const ICON_ONLY_ACTION_WIDTH = 21;
    const TOGGLE_MORE_ACTION_WIDTH = 21;
    const ACTION_PADDING = 8;
    class WorkbenchAlwaysLabelStrategy {
        constructor(notebookEditor, editorToolbar, goToMenu, instantiationService) {
            this.notebookEditor = notebookEditor;
            this.editorToolbar = editorToolbar;
            this.goToMenu = goToMenu;
            this.instantiationService = instantiationService;
        }
        actionProvider(action, options) {
            if (action.id === coreActions_1.SELECT_KERNEL_ID) {
                //	this is being disposed by the consumer
                return this.instantiationService.createInstance(notebookKernelView_1.NotebooKernelActionViewItem, action, this.notebookEditor, options);
            }
            if (action instanceof actions_2.MenuItemAction) {
                return this.instantiationService.createInstance(cellActionView_1.ActionViewWithLabel, action, { hoverDelegate: options.hoverDelegate });
            }
            if (action instanceof actions_2.SubmenuItemAction && action.item.submenu.id === actions_2.MenuId.NotebookCellExecuteGoTo.id) {
                return this.instantiationService.createInstance(cellActionView_1.UnifiedSubmenuActionView, action, { hoverDelegate: options.hoverDelegate }, true, {
                    getActions: () => {
                        return this.goToMenu.getActions().find(([group]) => group === 'navigation/execute')?.[1] ?? [];
                    }
                }, this.actionProvider.bind(this));
            }
            return undefined;
        }
        calculateActions(leftToolbarContainerMaxWidth) {
            const initialPrimaryActions = this.editorToolbar.primaryActions;
            const initialSecondaryActions = this.editorToolbar.secondaryActions;
            const actionOutput = workbenchCalculateActions(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth);
            return {
                primaryActions: actionOutput.primaryActions.map(a => a.action),
                secondaryActions: actionOutput.secondaryActions
            };
        }
    }
    class WorkbenchNeverLabelStrategy {
        constructor(notebookEditor, editorToolbar, goToMenu, instantiationService) {
            this.notebookEditor = notebookEditor;
            this.editorToolbar = editorToolbar;
            this.goToMenu = goToMenu;
            this.instantiationService = instantiationService;
        }
        actionProvider(action, options) {
            if (action.id === coreActions_1.SELECT_KERNEL_ID) {
                //	this is being disposed by the consumer
                return this.instantiationService.createInstance(notebookKernelView_1.NotebooKernelActionViewItem, action, this.notebookEditor, options);
            }
            if (action instanceof actions_2.MenuItemAction) {
                return this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
            }
            if (action instanceof actions_2.SubmenuItemAction) {
                if (action.item.submenu.id === actions_2.MenuId.NotebookCellExecuteGoTo.id) {
                    return this.instantiationService.createInstance(cellActionView_1.UnifiedSubmenuActionView, action, { hoverDelegate: options.hoverDelegate }, false, {
                        getActions: () => {
                            return this.goToMenu.getActions().find(([group]) => group === 'navigation/execute')?.[1] ?? [];
                        }
                    }, this.actionProvider.bind(this));
                }
                else {
                    return this.instantiationService.createInstance(menuEntryActionViewItem_1.SubmenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                }
            }
            return undefined;
        }
        calculateActions(leftToolbarContainerMaxWidth) {
            const initialPrimaryActions = this.editorToolbar.primaryActions;
            const initialSecondaryActions = this.editorToolbar.secondaryActions;
            const actionOutput = workbenchCalculateActions(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth);
            return {
                primaryActions: actionOutput.primaryActions.map(a => a.action),
                secondaryActions: actionOutput.secondaryActions
            };
        }
    }
    class WorkbenchDynamicLabelStrategy {
        constructor(notebookEditor, editorToolbar, goToMenu, instantiationService) {
            this.notebookEditor = notebookEditor;
            this.editorToolbar = editorToolbar;
            this.goToMenu = goToMenu;
            this.instantiationService = instantiationService;
        }
        actionProvider(action, options) {
            if (action.id === coreActions_1.SELECT_KERNEL_ID) {
                //	this is being disposed by the consumer
                return this.instantiationService.createInstance(notebookKernelView_1.NotebooKernelActionViewItem, action, this.notebookEditor, options);
            }
            const a = this.editorToolbar.primaryActions.find(a => a.action.id === action.id);
            if (!a || a.renderLabel) {
                if (action instanceof actions_2.MenuItemAction) {
                    return this.instantiationService.createInstance(cellActionView_1.ActionViewWithLabel, action, { hoverDelegate: options.hoverDelegate });
                }
                if (action instanceof actions_2.SubmenuItemAction && action.item.submenu.id === actions_2.MenuId.NotebookCellExecuteGoTo.id) {
                    return this.instantiationService.createInstance(cellActionView_1.UnifiedSubmenuActionView, action, { hoverDelegate: options.hoverDelegate }, true, {
                        getActions: () => {
                            return this.goToMenu.getActions().find(([group]) => group === 'navigation/execute')?.[1] ?? [];
                        }
                    }, this.actionProvider.bind(this));
                }
                return undefined;
            }
            else {
                if (action instanceof actions_2.MenuItemAction) {
                    this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                }
                if (action instanceof actions_2.SubmenuItemAction) {
                    if (action.item.submenu.id === actions_2.MenuId.NotebookCellExecuteGoTo.id) {
                        return this.instantiationService.createInstance(cellActionView_1.UnifiedSubmenuActionView, action, { hoverDelegate: options.hoverDelegate }, false, {
                            getActions: () => {
                                return this.goToMenu.getActions().find(([group]) => group === 'navigation/execute')?.[1] ?? [];
                            }
                        }, this.actionProvider.bind(this));
                    }
                    else {
                        return this.instantiationService.createInstance(menuEntryActionViewItem_1.SubmenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                    }
                }
                return undefined;
            }
        }
        calculateActions(leftToolbarContainerMaxWidth) {
            const initialPrimaryActions = this.editorToolbar.primaryActions;
            const initialSecondaryActions = this.editorToolbar.secondaryActions;
            const actionOutput = workbenchDynamicCalculateActions(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth);
            return {
                primaryActions: actionOutput.primaryActions.map(a => a.action),
                secondaryActions: actionOutput.secondaryActions
            };
        }
    }
    let NotebookEditorWorkbenchToolbar = class NotebookEditorWorkbenchToolbar extends lifecycle_1.Disposable {
        get primaryActions() {
            return this._primaryActions;
        }
        get secondaryActions() {
            return this._secondaryActions;
        }
        set visible(visible) {
            if (this._visible !== visible) {
                this._visible = visible;
                this._onDidChangeVisibility.fire(visible);
            }
        }
        get useGlobalToolbar() {
            return this._useGlobalToolbar;
        }
        constructor(notebookEditor, contextKeyService, notebookOptions, domNode, instantiationService, configurationService, contextMenuService, menuService, editorService, keybindingService, experimentService) {
            super();
            this.notebookEditor = notebookEditor;
            this.contextKeyService = contextKeyService;
            this.notebookOptions = notebookOptions;
            this.domNode = domNode;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.editorService = editorService;
            this.keybindingService = keybindingService;
            this.experimentService = experimentService;
            this._useGlobalToolbar = false;
            this._renderLabel = RenderLabel.Always;
            this._visible = false;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._dimension = null;
            this._primaryActions = [];
            this._secondaryActions = [];
            this._buildBody();
            this._register(event_1.Event.debounce(this.editorService.onDidActiveEditorChange, (last, _current) => last, 200)(this._updatePerEditorChange, this));
            this._registerNotebookActionsToolbar();
        }
        _buildBody() {
            this._notebookTopLeftToolbarContainer = document.createElement('div');
            this._notebookTopLeftToolbarContainer.classList.add('notebook-toolbar-left');
            this._leftToolbarScrollable = new scrollableElement_1.DomScrollableElement(this._notebookTopLeftToolbarContainer, {
                vertical: 2 /* ScrollbarVisibility.Hidden */,
                horizontal: 3 /* ScrollbarVisibility.Visible */,
                horizontalScrollbarSize: 3,
                useShadows: false,
                scrollYToX: true
            });
            this._register(this._leftToolbarScrollable);
            DOM.append(this.domNode, this._leftToolbarScrollable.getDomNode());
            this._notebookTopRightToolbarContainer = document.createElement('div');
            this._notebookTopRightToolbarContainer.classList.add('notebook-toolbar-right');
            DOM.append(this.domNode, this._notebookTopRightToolbarContainer);
        }
        _updatePerEditorChange() {
            if (this.editorService.activeEditorPane?.getId() === notebookCommon_1.NOTEBOOK_EDITOR_ID) {
                const notebookEditor = this.editorService.activeEditorPane.getControl();
                if (notebookEditor === this.notebookEditor) {
                    // this is the active editor
                    this._showNotebookActionsinEditorToolbar();
                    return;
                }
            }
        }
        _registerNotebookActionsToolbar() {
            this._notebookGlobalActionsMenu = this._register(this.menuService.createMenu(this.notebookEditor.creationOptions.menuIds.notebookToolbar, this.contextKeyService));
            this._executeGoToActionsMenu = this._register(this.menuService.createMenu(actions_2.MenuId.NotebookCellExecuteGoTo, this.contextKeyService));
            this._useGlobalToolbar = this.notebookOptions.getDisplayOptions().globalToolbar;
            this._renderLabel = this._convertConfiguration(this.configurationService.getValue(notebookCommon_1.NotebookSetting.globalToolbarShowLabel));
            this._updateStrategy();
            const context = {
                ui: true,
                notebookEditor: this.notebookEditor
            };
            const actionProvider = (action, options) => {
                if (action.id === coreActions_1.SELECT_KERNEL_ID) {
                    // this is being disposed by the consumer
                    return this.instantiationService.createInstance(notebookKernelView_1.NotebooKernelActionViewItem, action, this.notebookEditor, options);
                }
                if (this._renderLabel !== RenderLabel.Never) {
                    const a = this._primaryActions.find(a => a.action.id === action.id);
                    if (a && a.renderLabel) {
                        return action instanceof actions_2.MenuItemAction ? this.instantiationService.createInstance(cellActionView_1.ActionViewWithLabel, action, { hoverDelegate: options.hoverDelegate }) : undefined;
                    }
                    else {
                        return action instanceof actions_2.MenuItemAction ? this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate }) : undefined;
                    }
                }
                else {
                    return action instanceof actions_2.MenuItemAction ? this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate }) : undefined;
                }
            };
            // Make sure both toolbars have the same hover delegate for instant hover to work
            // Due to the elements being further apart than normal toolbars, the default time limit is to short and has to be increased
            const hoverDelegate = this._register(this.instantiationService.createInstance(hover_1.WorkbenchHoverDelegate, 'element', true, {}));
            hoverDelegate.setInstantHoverTimeLimit(600);
            const leftToolbarOptions = {
                hiddenItemStrategy: 1 /* HiddenItemStrategy.RenderInSecondaryGroup */,
                resetMenu: actions_2.MenuId.NotebookToolbar,
                actionViewItemProvider: (action, options) => {
                    return this._strategy.actionProvider(action, options);
                },
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                renderDropdownAsChildElement: true,
                hoverDelegate
            };
            this._notebookLeftToolbar = this.instantiationService.createInstance(toolbar_2.WorkbenchToolBar, this._notebookTopLeftToolbarContainer, leftToolbarOptions);
            this._register(this._notebookLeftToolbar);
            this._notebookLeftToolbar.context = context;
            this._notebookRightToolbar = new toolbar_1.ToolBar(this._notebookTopRightToolbarContainer, this.contextMenuService, {
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                actionViewItemProvider: actionProvider,
                renderDropdownAsChildElement: true,
                hoverDelegate
            });
            this._register(this._notebookRightToolbar);
            this._notebookRightToolbar.context = context;
            this._showNotebookActionsinEditorToolbar();
            let dropdownIsVisible = false;
            let deferredUpdate;
            this._register(this._notebookGlobalActionsMenu.onDidChange(() => {
                if (dropdownIsVisible) {
                    deferredUpdate = () => this._showNotebookActionsinEditorToolbar();
                    return;
                }
                if (this.notebookEditor.isVisible) {
                    this._showNotebookActionsinEditorToolbar();
                }
            }));
            this._register(this._notebookLeftToolbar.onDidChangeDropdownVisibility(visible => {
                dropdownIsVisible = visible;
                if (deferredUpdate && !visible) {
                    setTimeout(() => {
                        deferredUpdate?.();
                    }, 0);
                    deferredUpdate = undefined;
                }
            }));
            this._register(this.notebookOptions.onDidChangeOptions(e => {
                if (e.globalToolbar !== undefined) {
                    this._useGlobalToolbar = this.notebookOptions.getDisplayOptions().globalToolbar;
                    this._showNotebookActionsinEditorToolbar();
                }
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.globalToolbarShowLabel)) {
                    this._renderLabel = this._convertConfiguration(this.configurationService.getValue(notebookCommon_1.NotebookSetting.globalToolbarShowLabel));
                    this._updateStrategy();
                    const oldElement = this._notebookLeftToolbar.getElement();
                    oldElement.parentElement?.removeChild(oldElement);
                    this._notebookLeftToolbar.dispose();
                    this._notebookLeftToolbar = this.instantiationService.createInstance(toolbar_2.WorkbenchToolBar, this._notebookTopLeftToolbarContainer, leftToolbarOptions);
                    this._register(this._notebookLeftToolbar);
                    this._notebookLeftToolbar.context = context;
                    this._showNotebookActionsinEditorToolbar();
                    return;
                }
            }));
            if (this.experimentService) {
                this.experimentService.getTreatment('nbtoolbarineditor').then(treatment => {
                    if (treatment === undefined) {
                        return;
                    }
                    if (this._useGlobalToolbar !== treatment) {
                        this._useGlobalToolbar = treatment;
                        this._showNotebookActionsinEditorToolbar();
                    }
                });
            }
        }
        _updateStrategy() {
            switch (this._renderLabel) {
                case RenderLabel.Always:
                    this._strategy = new WorkbenchAlwaysLabelStrategy(this.notebookEditor, this, this._executeGoToActionsMenu, this.instantiationService);
                    break;
                case RenderLabel.Never:
                    this._strategy = new WorkbenchNeverLabelStrategy(this.notebookEditor, this, this._executeGoToActionsMenu, this.instantiationService);
                    break;
                case RenderLabel.Dynamic:
                    this._strategy = new WorkbenchDynamicLabelStrategy(this.notebookEditor, this, this._executeGoToActionsMenu, this.instantiationService);
                    break;
            }
        }
        _convertConfiguration(value) {
            switch (value) {
                case true:
                    return RenderLabel.Always;
                case false:
                    return RenderLabel.Never;
                case 'always':
                    return RenderLabel.Always;
                case 'never':
                    return RenderLabel.Never;
                case 'dynamic':
                    return RenderLabel.Dynamic;
            }
        }
        _showNotebookActionsinEditorToolbar() {
            // when there is no view model, just ignore.
            if (!this.notebookEditor.hasModel()) {
                this._deferredActionUpdate?.dispose();
                this._deferredActionUpdate = undefined;
                this.visible = false;
                return;
            }
            if (this._deferredActionUpdate) {
                return;
            }
            if (!this._useGlobalToolbar) {
                this.domNode.style.display = 'none';
                this._deferredActionUpdate = undefined;
                this.visible = false;
            }
            else {
                this._deferredActionUpdate = (0, async_1.disposableTimeout)(async () => {
                    await this._setNotebookActions();
                    this.visible = true;
                    this._deferredActionUpdate = undefined;
                }, 50);
            }
        }
        async _setNotebookActions() {
            const groups = this._notebookGlobalActionsMenu.getActions({ shouldForwardArgs: true, renderShortTitle: true });
            this.domNode.style.display = 'flex';
            const primaryLeftGroups = groups.filter(group => /^navigation/.test(group[0]));
            const primaryActions = [];
            primaryLeftGroups.sort((a, b) => {
                if (a[0] === 'navigation') {
                    return 1;
                }
                if (b[0] === 'navigation') {
                    return -1;
                }
                return 0;
            }).forEach((group, index) => {
                primaryActions.push(...group[1]);
                if (index < primaryLeftGroups.length - 1) {
                    primaryActions.push(new actions_1.Separator());
                }
            });
            const primaryRightGroup = groups.find(group => /^status/.test(group[0]));
            const primaryRightActions = primaryRightGroup ? primaryRightGroup[1] : [];
            const secondaryActions = groups.filter(group => !/^navigation/.test(group[0]) && !/^status/.test(group[0])).reduce((prev, curr) => { prev.push(...curr[1]); return prev; }, []);
            this._notebookLeftToolbar.setActions([], []);
            this._primaryActions = primaryActions.map(action => ({
                action: action,
                size: (action instanceof actions_1.Separator ? 1 : 0),
                renderLabel: true,
                visible: true
            }));
            this._notebookLeftToolbar.setActions(primaryActions, secondaryActions);
            this._secondaryActions = secondaryActions;
            this._notebookRightToolbar.setActions(primaryRightActions, []);
            this._secondaryActions = secondaryActions;
            if (this._dimension && this._dimension.width >= 0 && this._dimension.height >= 0) {
                this._cacheItemSizes(this._notebookLeftToolbar);
            }
            this._computeSizes();
        }
        _cacheItemSizes(toolbar) {
            for (let i = 0; i < toolbar.getItemsLength(); i++) {
                const action = toolbar.getItemAction(i);
                if (action && action.id !== 'toolbar.toggle.more') {
                    const existing = this._primaryActions.find(a => a.action.id === action.id);
                    if (existing) {
                        existing.size = toolbar.getItemWidth(i);
                    }
                }
            }
        }
        _computeSizes() {
            const toolbar = this._notebookLeftToolbar;
            const rightToolbar = this._notebookRightToolbar;
            if (toolbar && rightToolbar && this._dimension && this._dimension.height >= 0 && this._dimension.width >= 0) {
                // compute size only if it's visible
                if (this._primaryActions.length === 0 && toolbar.getItemsLength() !== this._primaryActions.length) {
                    this._cacheItemSizes(this._notebookLeftToolbar);
                }
                if (this._primaryActions.length === 0) {
                    return;
                }
                const kernelWidth = (rightToolbar.getItemsLength() ? rightToolbar.getItemWidth(0) : 0) + ACTION_PADDING;
                const leftToolbarContainerMaxWidth = this._dimension.width - kernelWidth - (ACTION_PADDING + TOGGLE_MORE_ACTION_WIDTH) - ( /** toolbar left margin */ACTION_PADDING) - ( /** toolbar right margin */ACTION_PADDING);
                const calculatedActions = this._strategy.calculateActions(leftToolbarContainerMaxWidth);
                this._notebookLeftToolbar.setActions(calculatedActions.primaryActions, calculatedActions.secondaryActions);
            }
        }
        layout(dimension) {
            this._dimension = dimension;
            if (!this._useGlobalToolbar) {
                this.domNode.style.display = 'none';
            }
            else {
                this.domNode.style.display = 'flex';
            }
            this._computeSizes();
        }
        dispose() {
            this._notebookLeftToolbar.context = undefined;
            this._notebookRightToolbar.context = undefined;
            this._notebookLeftToolbar.dispose();
            this._notebookRightToolbar.dispose();
            this._notebookLeftToolbar = null;
            this._notebookRightToolbar = null;
            this._deferredActionUpdate?.dispose();
            this._deferredActionUpdate = undefined;
            super.dispose();
        }
    };
    exports.NotebookEditorWorkbenchToolbar = NotebookEditorWorkbenchToolbar;
    exports.NotebookEditorWorkbenchToolbar = NotebookEditorWorkbenchToolbar = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, actions_2.IMenuService),
        __param(8, editorService_1.IEditorService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, assignmentService_1.IWorkbenchAssignmentService)
    ], NotebookEditorWorkbenchToolbar);
    function workbenchCalculateActions(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth) {
        return actionOverflowHelper(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth, false);
    }
    function workbenchDynamicCalculateActions(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth) {
        if (initialPrimaryActions.length === 0) {
            return { primaryActions: [], secondaryActions: initialSecondaryActions };
        }
        // find true length of array, add 1 for each primary actions, ignoring an item when size = 0
        const visibleActionLength = initialPrimaryActions.filter(action => action.size !== 0).length;
        // step 1: try to fit all primary actions
        const totalWidthWithLabels = initialPrimaryActions.map(action => action.size).reduce((a, b) => a + b, 0) + (visibleActionLength - 1) * ACTION_PADDING;
        if (totalWidthWithLabels <= leftToolbarContainerMaxWidth) {
            initialPrimaryActions.forEach(action => {
                action.renderLabel = true;
            });
            return actionOverflowHelper(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth, false);
        }
        // step 2: check if they fit without labels
        if ((visibleActionLength * ICON_ONLY_ACTION_WIDTH + (visibleActionLength - 1) * ACTION_PADDING) > leftToolbarContainerMaxWidth) {
            initialPrimaryActions.forEach(action => { action.renderLabel = false; });
            return actionOverflowHelper(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth, true);
        }
        // step 3: render as many actions as possible with labels, rest without.
        let sum = 0;
        let lastActionWithLabel = -1;
        for (let i = 0; i < initialPrimaryActions.length; i++) {
            sum += initialPrimaryActions[i].size + ACTION_PADDING;
            if (initialPrimaryActions[i].action instanceof actions_1.Separator) {
                // find group separator
                const remainingItems = initialPrimaryActions.slice(i + 1).filter(action => action.size !== 0); // todo: need to exclude size 0 items from this
                const newTotalSum = sum + (remainingItems.length === 0 ? 0 : (remainingItems.length * ICON_ONLY_ACTION_WIDTH + (remainingItems.length - 1) * ACTION_PADDING));
                if (newTotalSum <= leftToolbarContainerMaxWidth) {
                    lastActionWithLabel = i;
                }
            }
            else {
                continue;
            }
        }
        // icons only don't fit either
        if (lastActionWithLabel < 0) {
            initialPrimaryActions.forEach(action => { action.renderLabel = false; });
            return actionOverflowHelper(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth, true);
        }
        // render labels for the actions that have space
        initialPrimaryActions.slice(0, lastActionWithLabel + 1).forEach(action => { action.renderLabel = true; });
        initialPrimaryActions.slice(lastActionWithLabel + 1).forEach(action => { action.renderLabel = false; });
        return {
            primaryActions: initialPrimaryActions,
            secondaryActions: initialSecondaryActions
        };
    }
    function actionOverflowHelper(initialPrimaryActions, initialSecondaryActions, leftToolbarContainerMaxWidth, iconOnly) {
        const renderActions = [];
        const overflow = [];
        let currentSize = 0;
        let nonZeroAction = false;
        let containerFull = false;
        if (initialPrimaryActions.length === 0) {
            return { primaryActions: [], secondaryActions: initialSecondaryActions };
        }
        for (let i = 0; i < initialPrimaryActions.length; i++) {
            const actionModel = initialPrimaryActions[i];
            const itemSize = iconOnly ? (actionModel.size === 0 ? 0 : ICON_ONLY_ACTION_WIDTH) : actionModel.size;
            // if two separators in a row, ignore the second
            if (actionModel.action instanceof actions_1.Separator && renderActions.length > 0 && renderActions[renderActions.length - 1].action instanceof actions_1.Separator) {
                continue;
            }
            // if a separator is the first nonZero action, ignore it
            if (actionModel.action instanceof actions_1.Separator && !nonZeroAction) {
                continue;
            }
            if (currentSize + itemSize <= leftToolbarContainerMaxWidth && !containerFull) {
                currentSize += ACTION_PADDING + itemSize;
                renderActions.push(actionModel);
                if (itemSize !== 0) {
                    nonZeroAction = true;
                }
                if (actionModel.action instanceof actions_1.Separator) {
                    nonZeroAction = false;
                }
            }
            else {
                containerFull = true;
                if (itemSize === 0) { // size 0 implies a hidden item, keep in primary to allow for Workbench to handle visibility
                    renderActions.push(actionModel);
                }
                else {
                    if (actionModel.action instanceof actions_1.Separator) { // never push a separator to overflow
                        continue;
                    }
                    overflow.push(actionModel.action);
                }
            }
        }
        for (let i = (renderActions.length - 1); i > 0; i--) {
            const temp = renderActions[i];
            if (temp.size === 0) {
                continue;
            }
            if (temp.action instanceof actions_1.Separator) {
                renderActions.splice(i, 1);
            }
            break;
        }
        if (renderActions.length && renderActions[renderActions.length - 1].action instanceof actions_1.Separator) {
            renderActions.pop();
        }
        if (overflow.length !== 0) {
            overflow.push(new actions_1.Separator());
        }
        if (iconOnly) {
            // if icon only mode, don't render both (+ code) and (+ markdown) buttons. remove of markdown action
            const markdownIndex = renderActions.findIndex(a => a.action.id === 'notebook.cell.insertMarkdownCellBelow');
            if (markdownIndex !== -1) {
                renderActions.splice(markdownIndex, 1);
            }
        }
        return {
            primaryActions: renderActions,
            secondaryActions: [...overflow, ...initialSecondaryActions]
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JUb29sYmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXdQYXJ0cy9ub3RlYm9va0VkaXRvclRvb2xiYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNkNoRyxvREFhQztJQWdpQkQsOERBRUM7SUFFRCw0RUF1REM7SUFobkJELElBQVksV0FJWDtJQUpELFdBQVksV0FBVztRQUN0QixpREFBVSxDQUFBO1FBQ1YsK0NBQVMsQ0FBQTtRQUNULG1EQUFXLENBQUE7SUFDWixDQUFDLEVBSlcsV0FBVywyQkFBWCxXQUFXLFFBSXRCO0lBSUQsU0FBZ0Isb0JBQW9CLENBQUMsS0FBOEI7UUFDbEUsUUFBUSxLQUFLLEVBQUUsQ0FBQztZQUNmLEtBQUssSUFBSTtnQkFDUixPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUM7WUFDM0IsS0FBSyxLQUFLO2dCQUNULE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQztZQUMxQixLQUFLLFFBQVE7Z0JBQ1osT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDO1lBQzNCLEtBQUssT0FBTztnQkFDWCxPQUFPLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFDMUIsS0FBSyxTQUFTO2dCQUNiLE9BQU8sV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUM3QixDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQU0sc0JBQXNCLEdBQUcsRUFBRSxDQUFDO0lBQ2xDLE1BQU0sd0JBQXdCLEdBQUcsRUFBRSxDQUFDO0lBQ3BDLE1BQU0sY0FBYyxHQUFHLENBQUMsQ0FBQztJQU96QixNQUFNLDRCQUE0QjtRQUNqQyxZQUNVLGNBQXVDLEVBQ3ZDLGFBQTZDLEVBQzdDLFFBQWUsRUFDZixvQkFBMkM7WUFIM0MsbUJBQWMs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