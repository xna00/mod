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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding", "vs/workbench/common/editor", "vs/workbench/contrib/files/browser/fileActions", "vs/workbench/contrib/files/common/files", "vs/workbench/browser/parts/editor/editorActions", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/platform/list/browser/listService", "vs/workbench/browser/labels", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/telemetry/common/telemetry", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/workbench/contrib/files/browser/fileConstants", "vs/workbench/common/contextkeys", "vs/platform/dnd/browser/dnd", "vs/workbench/browser/dnd", "vs/workbench/browser/parts/views/viewPane", "vs/base/browser/dnd", "vs/base/common/decorators", "vs/base/browser/ui/list/listView", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/base/common/comparers", "vs/base/common/codicons", "vs/platform/commands/common/commands", "vs/base/common/network", "vs/base/common/resources", "vs/base/browser/window", "vs/workbench/browser/parts/editor/editorGroupView", "vs/css!./media/openeditors"], function (require, exports, nls, async_1, actions_1, dom, contextView_1, instantiation_1, editorGroupsService_1, configuration_1, keybinding_1, editor_1, fileActions_1, files_1, editorActions_1, contextkey_1, themeService_1, colorRegistry_1, listService_1, labels_1, actionbar_1, telemetry_1, lifecycle_1, actions_2, fileConstants_1, contextkeys_1, dnd_1, dnd_2, viewPane_1, dnd_3, decorators_1, listView_1, workingCopyService_1, filesConfigurationService_1, views_1, opener_1, comparers_1, codicons_1, commands_1, network_1, resources_1, window_1, editorGroupView_1) {
    "use strict";
    var OpenEditorsView_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenEditorsView = void 0;
    const $ = dom.$;
    let OpenEditorsView = class OpenEditorsView extends viewPane_1.ViewPane {
        static { OpenEditorsView_1 = this; }
        static { this.DEFAULT_VISIBLE_OPEN_EDITORS = 9; }
        static { this.DEFAULT_MIN_VISIBLE_OPEN_EDITORS = 0; }
        static { this.ID = 'workbench.explorer.openEditorsView'; }
        static { this.NAME = nls.localize2({ key: 'openEditors', comment: ['Open is an adjective'] }, "Open Editors"); }
        constructor(options, instantiationService, viewDescriptorService, contextMenuService, editorGroupService, configurationService, keybindingService, contextKeyService, themeService, telemetryService, workingCopyService, filesConfigurationService, openerService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.editorGroupService = editorGroupService;
            this.workingCopyService = workingCopyService;
            this.filesConfigurationService = filesConfigurationService;
            this.needsRefresh = false;
            this.elements = [];
            this.blockFocusActiveEditorTracking = false;
            this.structuralRefreshDelay = 0;
            this.sortOrder = configurationService.getValue('explorer.openEditors.sortOrder');
            this.registerUpdateEvents();
            // Also handle configuration updates
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChange(e)));
            // Handle dirty counter
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.updateDirtyIndicator(workingCopy)));
        }
        registerUpdateEvents() {
            const updateWholeList = () => {
                if (!this.isBodyVisible() || !this.list) {
                    this.needsRefresh = true;
                    return;
                }
                this.listRefreshScheduler?.schedule(this.structuralRefreshDelay);
            };
            const groupDisposables = this._register(new lifecycle_1.DisposableMap());
            const addGroupListener = (group) => {
                const groupModelChangeListener = group.onDidModelChange(e => {
                    if (this.listRefreshScheduler?.isScheduled()) {
                        return;
                    }
                    if (!this.isBodyVisible() || !this.list) {
                        this.needsRefresh = true;
                        return;
                    }
                    const index = this.getIndex(group, e.editor);
                    switch (e.kind) {
                        case 7 /* GroupModelChangeKind.EDITOR_ACTIVE */:
                            this.focusActiveEditor();
                            break;
                        case 1 /* GroupModelChangeKind.GROUP_INDEX */:
                        case 2 /* GroupModelChangeKind.GROUP_LABEL */:
                            if (index >= 0) {
                                this.list.splice(index, 1, [group]);
                            }
                            break;
                        case 13 /* GroupModelChangeKind.EDITOR_DIRTY */:
                        case 12 /* GroupModelChangeKind.EDITOR_STICKY */:
                        case 9 /* GroupModelChangeKind.EDITOR_CAPABILITIES */:
                        case 10 /* GroupModelChangeKind.EDITOR_PIN */:
                        case 8 /* GroupModelChangeKind.EDITOR_LABEL */:
                            this.list.splice(index, 1, [new files_1.OpenEditor(e.editor, group)]);
                            this.focusActiveEditor();
                            break;
                        case 4 /* GroupModelChangeKind.EDITOR_OPEN */:
                        case 6 /* GroupModelChangeKind.EDITOR_MOVE */:
                        case 5 /* GroupModelChangeKind.EDITOR_CLOSE */:
                            updateWholeList();
                            break;
                    }
                });
                groupDisposables.set(group.id, groupModelChangeListener);
            };
            this.editorGroupService.groups.forEach(g => addGroupListener(g));
            this._register(this.editorGroupService.onDidAddGroup(group => {
                addGroupListener(group);
                updateWholeList();
            }));
            this._register(this.editorGroupService.onDidMoveGroup(() => updateWholeList()));
            this._register(this.editorGroupService.onDidChangeActiveGroup(() => this.focusActiveEditor()));
            this._register(this.editorGroupService.onDidRemoveGroup(group => {
                groupDisposables.deleteAndDispose(group.id);
                updateWholeList();
            }));
        }
        renderHeaderTitle(container) {
            super.renderHeaderTitle(container, this.title);
            const count = dom.append(container, $('.open-editors-dirty-count-container'));
            this.dirtyCountElement = dom.append(count, $('.dirty-count.monaco-count-badge.long'));
            this.dirtyCountElement.style.backgroundColor = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.badgeBackground);
            this.dirtyCountElement.style.color = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.badgeForeground);
            this.dirtyCountElement.style.border = `1px solid ${(0, colorRegistry_1.asCssVariable)(colorRegistry_1.contrastBorder)}`;
            this.updateDirtyIndicator();
        }
        renderBody(container) {
            super.renderBody(container);
            container.classList.add('open-editors');
            container.classList.add('show-file-icons');
            const delegate = new OpenEditorsDelegate();
            if (this.list) {
                this.list.dispose();
            }
            if (this.listLabels) {
                this.listLabels.clear();
            }
            this.dnd = new OpenEditorsDragAndDrop(this.sortOrder, this.instantiationService, this.editorGroupService);
            this.listLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchList, 'OpenEditors', container, delegate, [
                new EditorGroupRenderer(this.keybindingService, this.instantiationService),
                new OpenEditorRenderer(this.listLabels, this.instantiationService, this.keybindingService, this.configurationService)
            ], {
                identityProvider: { getId: (element) => element instanceof files_1.OpenEditor ? element.getId() : element.id.toString() },
                dnd: this.dnd,
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                },
                accessibilityProvider: new OpenEditorsAccessibilityProvider()
            });
            this._register(this.list);
            this._register(this.listLabels);
            // Register the refresh scheduler
            let labelChangeListeners = [];
            this.listRefreshScheduler = this._register(new async_1.RunOnceScheduler(() => {
                // No need to refresh the list if it's not rendered
                if (!this.list) {
                    return;
                }
                labelChangeListeners = (0, lifecycle_1.dispose)(labelChangeListeners);
                const previousLength = this.list.length;
                const elements = this.getElements();
                this.list.splice(0, this.list.length, elements);
                this.focusActiveEditor();
                if (previousLength !== this.list.length) {
                    this.updateSize();
                }
                this.needsRefresh = false;
                if (this.sortOrder === 'alphabetical' || this.sortOrder === 'fullPath') {
                    // We need to resort the list if the editor label changed
                    elements.forEach(e => {
                        if (e instanceof files_1.OpenEditor) {
                            labelChangeListeners.push(e.editor.onDidChangeLabel(() => this.listRefreshScheduler?.schedule()));
                        }
                    });
                }
            }, this.structuralRefreshDelay));
            this.updateSize();
            // Bind context keys
            files_1.OpenEditorsFocusedContext.bindTo(this.list.contextKeyService);
            files_1.ExplorerFocusedContext.bindTo(this.list.contextKeyService);
            this.resourceContext = this.instantiationService.createInstance(contextkeys_1.ResourceContextKey);
            this._register(this.resourceContext);
            this.groupFocusedContext = fileConstants_1.OpenEditorsGroupContext.bindTo(this.contextKeyService);
            this.dirtyEditorFocusedContext = fileConstants_1.OpenEditorsDirtyEditorContext.bindTo(this.contextKeyService);
            this.readonlyEditorFocusedContext = fileConstants_1.OpenEditorsReadonlyEditorContext.bindTo(this.contextKeyService);
            this._register(this.list.onContextMenu(e => this.onListContextMenu(e)));
            this.list.onDidChangeFocus(e => {
                this.resourceContext.reset();
                this.groupFocusedContext.reset();
                this.dirtyEditorFocusedContext.reset();
                this.readonlyEditorFocusedContext.reset();
                const element = e.elements.length ? e.elements[0] : undefined;
                if (element instanceof files_1.OpenEditor) {
                    const resource = element.getResource();
                    this.dirtyEditorFocusedContext.set(element.editor.isDirty() && !element.editor.isSaving());
                    this.readonlyEditorFocusedContext.set(!!element.editor.isReadonly());
                    this.resourceContext.set(resource ?? null);
                }
                else if (!!element) {
                    this.groupFocusedContext.set(true);
                }
            });
            // Open when selecting via keyboard
            this._register(this.list.onMouseMiddleClick(e => {
                if (e && e.element instanceof files_1.OpenEditor) {
                    if ((0, editor_1.preventEditorClose)(e.element.group, e.element.editor, editor_1.EditorCloseMethod.MOUSE, this.editorGroupService.partOptions)) {
                        return;
                    }
                    e.element.group.closeEditor(e.element.editor, { preserveFocus: true });
                }
            }));
            this._register(this.list.onDidOpen(e => {
                const element = e.element;
                if (!element) {
                    return;
                }
                else if (element instanceof files_1.OpenEditor) {
                    if (dom.isMouseEvent(e.browserEvent) && e.browserEvent.button === 1) {
                        return; // middle click already handled above: closes the editor
                    }
                    this.withActiveEditorFocusTrackingDisabled(() => {
                        this.openEditor(element, { preserveFocus: e.editorOptions.preserveFocus, pinned: e.editorOptions.pinned, sideBySide: e.sideBySide });
                    });
                }
                else {
                    this.withActiveEditorFocusTrackingDisabled(() => {
                        this.editorGroupService.activateGroup(element);
                        if (!e.editorOptions.preserveFocus) {
                            element.focus();
                        }
                    });
                }
            }));
            this.listRefreshScheduler.schedule(0);
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.listRefreshScheduler?.schedule(0);
                }
            }));
            const containerModel = this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id));
            this._register(containerModel.onDidChangeAllViewDescriptors(() => {
                this.updateSize();
            }));
        }
        focus() {
            super.focus();
            this.list?.domFocus();
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.list?.layout(height, width);
        }
        get showGroups() {
            return this.editorGroupService.groups.length > 1;
        }
        getElements() {
            this.elements = [];
            this.editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */).forEach(g => {
                if (this.showGroups) {
                    this.elements.push(g);
                }
                let editors = g.editors.map(ei => new files_1.OpenEditor(ei, g));
                if (this.sortOrder === 'alphabetical') {
                    editors = editors.sort((first, second) => (0, comparers_1.compareFileNamesDefault)(first.editor.getName(), second.editor.getName()));
                }
                else if (this.sortOrder === 'fullPath') {
                    editors = editors.sort((first, second) => {
                        const firstResource = first.editor.resource;
                        const secondResource = second.editor.resource;
                        //put 'system' editors before everything
                        if (firstResource === undefined && secondResource === undefined) {
                            return (0, comparers_1.compareFileNamesDefault)(first.editor.getName(), second.editor.getName());
                        }
                        else if (firstResource === undefined) {
                            return -1;
                        }
                        else if (secondResource === undefined) {
                            return 1;
                        }
                        else {
                            const firstScheme = firstResource.scheme;
                            const secondScheme = secondResource.scheme;
                            //put non-file editors before files
                            if (firstScheme !== network_1.Schemas.file && secondScheme !== network_1.Schemas.file) {
                                return resources_1.extUriIgnorePathCase.compare(firstResource, secondResource);
                            }
                            else if (firstScheme !== network_1.Schemas.file) {
                                return -1;
                            }
                            else if (secondScheme !== network_1.Schemas.file) {
                                return 1;
                            }
                            else {
                                return resources_1.extUriIgnorePathCase.compare(firstResource, secondResource);
                            }
                        }
                    });
                }
                this.elements.push(...editors);
            });
            return this.elements;
        }
        getIndex(group, editor) {
            if (!editor) {
                return this.elements.findIndex(e => !(e instanceof files_1.OpenEditor) && e.id === group.id);
            }
            return this.elements.findIndex(e => e instanceof files_1.OpenEditor && e.editor === editor && e.group.id === group.id);
        }
        openEditor(element, options) {
            if (element) {
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: 'workbench.files.openFile', from: 'openEditors' });
                const preserveActivateGroup = options.sideBySide && options.preserveFocus; // needed for https://github.com/microsoft/vscode/issues/42399
                if (!preserveActivateGroup) {
                    this.editorGroupService.activateGroup(element.group); // needed for https://github.com/microsoft/vscode/issues/6672
                }
                const targetGroup = options.sideBySide ? this.editorGroupService.sideGroup : element.group;
                targetGroup.openEditor(element.editor, options);
            }
        }
        onListContextMenu(e) {
            if (!e.element) {
                return;
            }
            const element = e.element;
            this.contextMenuService.showContextMenu({
                menuId: actions_2.MenuId.OpenEditorsContext,
                menuActionOptions: { shouldForwardArgs: true, arg: element instanceof files_1.OpenEditor ? editor_1.EditorResourceAccessor.getOriginalUri(element.editor) : {} },
                contextKeyService: this.list?.contextKeyService,
                getAnchor: () => e.anchor,
                getActionsContext: () => element instanceof files_1.OpenEditor ? { groupId: element.groupId, editorIndex: element.group.getIndexOfEditor(element.editor) } : { groupId: element.id }
            });
        }
        withActiveEditorFocusTrackingDisabled(fn) {
            this.blockFocusActiveEditorTracking = true;
            try {
                fn();
            }
            finally {
                this.blockFocusActiveEditorTracking = false;
            }
        }
        focusActiveEditor() {
            if (!this.list || this.blockFocusActiveEditorTracking) {
                return;
            }
            if (this.list.length && this.editorGroupService.activeGroup) {
                const index = this.getIndex(this.editorGroupService.activeGroup, this.editorGroupService.activeGroup.activeEditor);
                if (index >= 0) {
                    try {
                        this.list.setFocus([index]);
                        this.list.setSelection([index]);
                        this.list.reveal(index);
                    }
                    catch (e) {
                        // noop list updated in the meantime
                    }
                    return;
                }
            }
            this.list.setFocus([]);
            this.list.setSelection([]);
        }
        onConfigurationChange(event) {
            if (event.affectsConfiguration('explorer.openEditors')) {
                this.updateSize();
            }
            // Trigger a 'repaint' when decoration settings change or the sort order changed
            if (event.affectsConfiguration('explorer.decorations') || event.affectsConfiguration('explorer.openEditors.sortOrder')) {
                this.sortOrder = this.configurationService.getValue('explorer.openEditors.sortOrder');
                if (this.dnd) {
                    this.dnd.sortOrder = this.sortOrder;
                }
                this.listRefreshScheduler?.schedule();
            }
        }
        updateSize() {
            // Adjust expanded body size
            this.minimumBodySize = this.orientation === 0 /* Orientation.VERTICAL */ ? this.getMinExpandedBodySize() : 170;
            this.maximumBodySize = this.orientation === 0 /* Orientation.VERTICAL */ ? this.getMaxExpandedBodySize() : Number.POSITIVE_INFINITY;
        }
        updateDirtyIndicator(workingCopy) {
            if (workingCopy) {
                const gotDirty = workingCopy.isDirty();
                if (gotDirty && !(workingCopy.capabilities & 2 /* WorkingCopyCapabilities.Untitled */) && this.filesConfigurationService.hasShortAutoSaveDelay(workingCopy.resource)) {
                    return; // do not indicate dirty of working copies that are auto saved after short delay
                }
            }
            const dirty = this.workingCopyService.dirtyCount;
            if (dirty === 0) {
                this.dirtyCountElement.classList.add('hidden');
            }
            else {
                this.dirtyCountElement.textContent = nls.localize('dirtyCounter', "{0} unsaved", dirty);
                this.dirtyCountElement.classList.remove('hidden');
            }
        }
        get elementCount() {
            return this.editorGroupService.groups.map(g => g.count)
                .reduce((first, second) => first + second, this.showGroups ? this.editorGroupService.groups.length : 0);
        }
        getMaxExpandedBodySize() {
            let minVisibleOpenEditors = this.configurationService.getValue('explorer.openEditors.minVisible');
            // If it's not a number setting it to 0 will result in dynamic resizing.
            if (typeof minVisibleOpenEditors !== 'number') {
                minVisibleOpenEditors = OpenEditorsView_1.DEFAULT_MIN_VISIBLE_OPEN_EDITORS;
            }
            const containerModel = this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id));
            if (containerModel.visibleViewDescriptors.length <= 1) {
                return Number.POSITIVE_INFINITY;
            }
            return (Math.max(this.elementCount, minVisibleOpenEditors)) * OpenEditorsDelegate.ITEM_HEIGHT;
        }
        getMinExpandedBodySize() {
            let visibleOpenEditors = this.configurationService.getValue('explorer.openEditors.visible');
            if (typeof visibleOpenEditors !== 'number') {
                visibleOpenEditors = OpenEditorsView_1.DEFAULT_VISIBLE_OPEN_EDITORS;
            }
            return this.computeMinExpandedBodySize(visibleOpenEditors);
        }
        computeMinExpandedBodySize(visibleOpenEditors = OpenEditorsView_1.DEFAULT_VISIBLE_OPEN_EDITORS) {
            const itemsToShow = Math.min(Math.max(visibleOpenEditors, 1), this.elementCount);
            return itemsToShow * OpenEditorsDelegate.ITEM_HEIGHT;
        }
        setStructuralRefreshDelay(delay) {
            this.structuralRefreshDelay = delay;
        }
        getOptimalWidth() {
            if (!this.list) {
                return super.getOptimalWidth();
            }
            const parentNode = this.list.getHTMLElement();
            const childNodes = [].slice.call(parentNode.querySelectorAll('.open-editor > a'));
            return dom.getLargestChildWidth(parentNode, childNodes);
        }
    };
    exports.OpenEditorsView = OpenEditorsView;
    exports.OpenEditorsView = OpenEditorsView = OpenEditorsView_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, workingCopyService_1.IWorkingCopyService),
        __param(11, filesConfigurationService_1.IFilesConfigurationService),
        __param(12, opener_1.IOpenerService)
    ], OpenEditorsView);
    class OpenEditorActionRunner extends actions_1.ActionRunner {
        async run(action) {
            if (!this.editor) {
                return;
            }
            return super.run(action, { groupId: this.editor.groupId, editorIndex: this.editor.group.getIndexOfEditor(this.editor.editor) });
        }
    }
    class OpenEditorsDelegate {
        static { this.ITEM_HEIGHT = 22; }
        getHeight(_element) {
            return OpenEditorsDelegate.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            if (element instanceof files_1.OpenEditor) {
                return OpenEditorRenderer.ID;
            }
            return EditorGroupRenderer.ID;
        }
    }
    class EditorGroupRenderer {
        static { this.ID = 'editorgroup'; }
        constructor(keybindingService, instantiationService) {
            this.keybindingService = keybindingService;
            this.instantiationService = instantiationService;
            // noop
        }
        get templateId() {
            return EditorGroupRenderer.ID;
        }
        renderTemplate(container) {
            const editorGroupTemplate = Object.create(null);
            editorGroupTemplate.root = dom.append(container, $('.editor-group'));
            editorGroupTemplate.name = dom.append(editorGroupTemplate.root, $('span.name'));
            editorGroupTemplate.actionBar = new actionbar_1.ActionBar(container);
            const saveAllInGroupAction = this.instantiationService.createInstance(fileActions_1.SaveAllInGroupAction, fileActions_1.SaveAllInGroupAction.ID, fileActions_1.SaveAllInGroupAction.LABEL);
            const saveAllInGroupKey = this.keybindingService.lookupKeybinding(saveAllInGroupAction.id);
            editorGroupTemplate.actionBar.push(saveAllInGroupAction, { icon: true, label: false, keybinding: saveAllInGroupKey ? saveAllInGroupKey.getLabel() : undefined });
            const closeGroupAction = this.instantiationService.createInstance(fileActions_1.CloseGroupAction, fileActions_1.CloseGroupAction.ID, fileActions_1.CloseGroupAction.LABEL);
            const closeGroupActionKey = this.keybindingService.lookupKeybinding(closeGroupAction.id);
            editorGroupTemplate.actionBar.push(closeGroupAction, { icon: true, label: false, keybinding: closeGroupActionKey ? closeGroupActionKey.getLabel() : undefined });
            return editorGroupTemplate;
        }
        renderElement(editorGroup, _index, templateData) {
            templateData.editorGroup = editorGroup;
            templateData.name.textContent = editorGroup.label;
            templateData.actionBar.context = { groupId: editorGroup.id };
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    }
    class OpenEditorRenderer {
        static { this.ID = 'openeditor'; }
        constructor(labels, instantiationService, keybindingService, configurationService) {
            this.labels = labels;
            this.instantiationService = instantiationService;
            this.keybindingService = keybindingService;
            this.configurationService = configurationService;
            this.closeEditorAction = this.instantiationService.createInstance(editorActions_1.CloseEditorAction, editorActions_1.CloseEditorAction.ID, editorActions_1.CloseEditorAction.LABEL);
            this.unpinEditorAction = this.instantiationService.createInstance(editorActions_1.UnpinEditorAction, editorActions_1.UnpinEditorAction.ID, editorActions_1.UnpinEditorAction.LABEL);
            // noop
        }
        get templateId() {
            return OpenEditorRenderer.ID;
        }
        renderTemplate(container) {
            const editorTemplate = Object.create(null);
            editorTemplate.container = container;
            editorTemplate.actionRunner = new OpenEditorActionRunner();
            editorTemplate.actionBar = new actionbar_1.ActionBar(container, { actionRunner: editorTemplate.actionRunner });
            editorTemplate.root = this.labels.create(container);
            return editorTemplate;
        }
        renderElement(openedEditor, _index, templateData) {
            const editor = openedEditor.editor;
            templateData.actionRunner.editor = openedEditor;
            templateData.container.classList.toggle('dirty', editor.isDirty() && !editor.isSaving());
            templateData.container.classList.toggle('sticky', openedEditor.isSticky());
            templateData.root.setResource({
                resource: editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH }),
                name: editor.getName(),
                description: editor.getDescription(1 /* Verbosity.MEDIUM */)
            }, {
                italic: openedEditor.isPreview(),
                extraClasses: ['open-editor'].concat(openedEditor.editor.getLabelExtraClasses()),
                fileDecorations: this.configurationService.getValue().explorer.decorations,
                title: editor.getTitle(2 /* Verbosity.LONG */),
                icon: editor.getIcon()
            });
            const editorAction = openedEditor.isSticky() ? this.unpinEditorAction : this.closeEditorAction;
            if (!templateData.actionBar.hasAction(editorAction)) {
                if (!templateData.actionBar.isEmpty()) {
                    templateData.actionBar.clear();
                }
                templateData.actionBar.push(editorAction, { icon: true, label: false, keybinding: this.keybindingService.lookupKeybinding(editorAction.id)?.getLabel() });
            }
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
            templateData.root.dispose();
            templateData.actionRunner.dispose();
        }
    }
    class OpenEditorsDragAndDrop {
        set sortOrder(value) {
            this._sortOrder = value;
        }
        constructor(sortOrder, instantiationService, editorGroupService) {
            this.instantiationService = instantiationService;
            this.editorGroupService = editorGroupService;
            this._sortOrder = sortOrder;
        }
        get dropHandler() {
            return this.instantiationService.createInstance(dnd_2.ResourcesDropHandler, { allowWorkspaceOpen: false });
        }
        getDragURI(element) {
            if (element instanceof files_1.OpenEditor) {
                const resource = element.getResource();
                if (resource) {
                    return resource.toString();
                }
            }
            return null;
        }
        getDragLabel(elements) {
            if (elements.length > 1) {
                return String(elements.length);
            }
            const element = elements[0];
            return element instanceof files_1.OpenEditor ? element.editor.getName() : element.label;
        }
        onDragStart(data, originalEvent) {
            const items = data.elements;
            const editors = [];
            if (items) {
                for (const item of items) {
                    if (item instanceof files_1.OpenEditor) {
                        editors.push(item);
                    }
                }
            }
            if (editors.length) {
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.instantiationService.invokeFunction(dnd_2.fillEditorsDragData, editors, originalEvent);
            }
        }
        onDragOver(data, _targetElement, _targetIndex, targetSector, originalEvent) {
            if (data instanceof listView_1.NativeDragAndDropData) {
                if (!(0, dnd_1.containsDragType)(originalEvent, dnd_3.DataTransfers.FILES, dnd_1.CodeDataTransfers.FILES)) {
                    return false;
                }
            }
            if (this._sortOrder !== 'editorOrder') {
                if (data instanceof listView_1.ElementsDragAndDropData) {
                    // No reordering supported when sorted
                    return false;
                }
                else {
                    // Allow droping files to open them
                    return { accept: true, effect: { type: 1 /* ListDragOverEffectType.Move */ }, feedback: [-1] };
                }
            }
            let dropEffectPosition = undefined;
            switch (targetSector) {
                case 0 /* ListViewTargetSector.TOP */:
                case 1 /* ListViewTargetSector.CENTER_TOP */:
                    dropEffectPosition = (_targetIndex === 0 && _targetElement instanceof editorGroupView_1.EditorGroupView) ? "drop-target-after" /* ListDragOverEffectPosition.After */ : "drop-target-before" /* ListDragOverEffectPosition.Before */;
                    break;
                case 2 /* ListViewTargetSector.CENTER_BOTTOM */:
                case 3 /* ListViewTargetSector.BOTTOM */:
                    dropEffectPosition = "drop-target-after" /* ListDragOverEffectPosition.After */;
                    break;
            }
            return { accept: true, effect: { type: 1 /* ListDragOverEffectType.Move */, position: dropEffectPosition }, feedback: [_targetIndex] };
        }
        drop(data, targetElement, _targetIndex, targetSector, originalEvent) {
            let group = targetElement instanceof files_1.OpenEditor ? targetElement.group : targetElement || this.editorGroupService.groups[this.editorGroupService.count - 1];
            let targetEditorIndex = targetElement instanceof files_1.OpenEditor ? targetElement.group.getIndexOfEditor(targetElement.editor) : 0;
            switch (targetSector) {
                case 0 /* ListViewTargetSector.TOP */:
                case 1 /* ListViewTargetSector.CENTER_TOP */:
                    if (targetElement instanceof editorGroupView_1.EditorGroupView && group.index !== 0) {
                        group = this.editorGroupService.groups[group.index - 1];
                        targetEditorIndex = group.count;
                    }
                    break;
                case 3 /* ListViewTargetSector.BOTTOM */:
                case 2 /* ListViewTargetSector.CENTER_BOTTOM */:
                    if (targetElement instanceof files_1.OpenEditor) {
                        targetEditorIndex++;
                    }
                    break;
            }
            if (data instanceof listView_1.ElementsDragAndDropData) {
                for (const oe of data.elements) {
                    const sourceEditorIndex = oe.group.getIndexOfEditor(oe.editor);
                    if (oe.group === group && sourceEditorIndex < targetEditorIndex) {
                        targetEditorIndex--;
                    }
                    oe.group.moveEditor(oe.editor, group, { index: targetEditorIndex, preserveFocus: true });
                    targetEditorIndex++;
                }
                this.editorGroupService.activateGroup(group);
            }
            else {
                this.dropHandler.handleDrop(originalEvent, window_1.mainWindow, () => group, () => group.focus(), { index: targetEditorIndex });
            }
        }
        dispose() { }
    }
    __decorate([
        decorators_1.memoize
    ], OpenEditorsDragAndDrop.prototype, "dropHandler", null);
    class OpenEditorsAccessibilityProvider {
        getWidgetAriaLabel() {
            return nls.localize('openEditors', "Open Editors");
        }
        getAriaLabel(element) {
            if (element instanceof files_1.OpenEditor) {
                return `${element.editor.getName()}, ${element.editor.getDescription()}`;
            }
            return element.ariaLabel;
        }
    }
    const toggleEditorGroupLayoutId = 'workbench.action.toggleEditorGroupLayout';
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleEditorGroupLayout',
                title: nls.localize2('flipLayout', "Toggle Vertical/Horizontal Editor Layout"),
                f1: true,
                keybinding: {
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 21 /* KeyCode.Digit0 */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 21 /* KeyCode.Digit0 */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                icon: codicons_1.Codicon.editorLayout,
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', OpenEditorsView.ID), contextkeys_1.MultipleEditorGroupsContext),
                    order: 10
                }
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const newOrientation = (editorGroupService.orientation === 1 /* GroupOrientation.VERTICAL */) ? 0 /* GroupOrientation.HORIZONTAL */ : 1 /* GroupOrientation.VERTICAL */;
            editorGroupService.setGroupOrientation(newOrientation);
        }
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '5_flip',
        command: {
            id: toggleEditorGroupLayoutId,
            title: {
                ...nls.localize2('miToggleEditorLayoutWithoutMnemonic', "Flip Layout"),
                mnemonicTitle: nls.localize({ key: 'miToggleEditorLayout', comment: ['&& denotes a mnemonic'] }, "Flip &&Layout")
            }
        },
        order: 1
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.files.saveAll',
                title: fileConstants_1.SAVE_ALL_LABEL,
                f1: true,
                icon: codicons_1.Codicon.saveAll,
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', OpenEditorsView.ID),
                    order: 20
                }
            });
        }
        async run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            await commandService.executeCommand(fileConstants_1.SAVE_ALL_COMMAND_ID);
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'openEditors.closeAll',
                title: editorActions_1.CloseAllEditorsAction.LABEL,
                f1: false,
                icon: codicons_1.Codicon.closeAll,
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', OpenEditorsView.ID),
                    order: 30
                }
            });
        }
        async run(accessor) {
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const closeAll = new editorActions_1.CloseAllEditorsAction();
            await instantiationService.invokeFunction(accessor => closeAll.run(accessor));
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'openEditors.newUntitledFile',
                title: nls.localize2('newUntitledFile', "New Untitled Text File"),
                f1: false,
                icon: codicons_1.Codicon.newFile,
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', OpenEditorsView.ID),
                    order: 5
                }
            });
        }
        async run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            await commandService.executeCommand(fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbkVkaXRvcnNWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL3ZpZXdzL29wZW5FZGl0b3JzVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0RoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRVQsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxtQkFBUTs7aUJBRXBCLGlDQUE0QixHQUFHLENBQUMsQUFBSixDQUFLO2lCQUNqQyxxQ0FBZ0MsR0FBRyxDQUFDLEFBQUosQ0FBSztpQkFDN0MsT0FBRSxHQUFHLG9DQUFvQyxBQUF2QyxDQUF3QztpQkFDMUMsU0FBSSxHQUFxQixHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLEVBQUUsY0FBYyxDQUFDLEFBQTdHLENBQThHO1FBaUJsSSxZQUNDLE9BQTRCLEVBQ0wsb0JBQTJDLEVBQzFDLHFCQUE2QyxFQUNoRCxrQkFBdUMsRUFDdEMsa0JBQXlELEVBQ3hELG9CQUEyQyxFQUM5QyxpQkFBcUMsRUFDckMsaUJBQXFDLEVBQzFDLFlBQTJCLEVBQ3ZCLGdCQUFtQyxFQUNqQyxrQkFBd0QsRUFDakQseUJBQXNFLEVBQ2xGLGFBQTZCO1lBRTdDLEtBQUssQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBVnBKLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFNekMsdUJBQWtC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