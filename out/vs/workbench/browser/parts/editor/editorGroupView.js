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
define(["require", "exports", "vs/workbench/common/editor/editorGroupModel", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/base/browser/dom", "vs/platform/instantiation/common/serviceCollection", "vs/platform/contextkey/common/contextkey", "vs/base/browser/ui/progressbar/progressbar", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/workbench/browser/parts/editor/editorPanes", "vs/platform/progress/common/progress", "vs/workbench/services/progress/browser/progressIndicator", "vs/nls", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/platform/telemetry/common/telemetry", "vs/base/common/async", "vs/base/browser/touch", "vs/workbench/browser/parts/editor/editor", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/base/browser/mouseEvent", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/contextview/browser/contextView", "vs/workbench/services/editor/common/editorService", "vs/base/common/hash", "vs/editor/common/services/languagesAssociations", "vs/base/common/resources", "vs/base/common/network", "vs/platform/editor/common/editor", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/common/uri", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/platform", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/theme/browser/defaultStyles", "vs/workbench/browser/parts/editor/editorGroupWatermark", "vs/workbench/browser/parts/editor/editorTitleControl", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/host/browser/host", "vs/css!./media/editorgroupview"], function (require, exports, editorGroupModel_1, editor_1, contextkeys_1, sideBySideEditorInput_1, event_1, instantiation_1, dom_1, serviceCollection_1, contextkey_1, progressbar_1, themeService_1, colorRegistry_1, theme_1, editorPanes_1, progress_1, progressIndicator_1, nls_1, arrays_1, lifecycle_1, telemetry_1, async_1, touch_1, editor_2, actionbar_1, keybinding_1, actions_1, mouseEvent_1, menuEntryActionViewItem_1, contextView_1, editorService_1, hash_1, languagesAssociations_1, resources_1, network_1, editor_3, dialogs_1, filesConfigurationService_1, uri_1, uriIdentity_1, platform_1, log_1, telemetryUtils_1, defaultStyles_1, editorGroupWatermark_1, editorTitleControl_1, editorPane_1, editorResolverService_1, host_1) {
    "use strict";
    var EditorGroupView_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorGroupView = void 0;
    let EditorGroupView = EditorGroupView_1 = class EditorGroupView extends themeService_1.Themable {
        //#region factory
        static createNew(editorPartsView, groupsView, groupsLabel, groupIndex, instantiationService) {
            return instantiationService.createInstance(EditorGroupView_1, null, editorPartsView, groupsView, groupsLabel, groupIndex);
        }
        static createFromSerialized(serialized, editorPartsView, groupsView, groupsLabel, groupIndex, instantiationService) {
            return instantiationService.createInstance(EditorGroupView_1, serialized, editorPartsView, groupsView, groupsLabel, groupIndex);
        }
        static createCopy(copyFrom, editorPartsView, groupsView, groupsLabel, groupIndex, instantiationService) {
            return instantiationService.createInstance(EditorGroupView_1, copyFrom, editorPartsView, groupsView, groupsLabel, groupIndex);
        }
        constructor(from, editorPartsView, groupsView, groupsLabel, _index, instantiationService, contextKeyService, themeService, telemetryService, keybindingService, menuService, contextMenuService, fileDialogService, editorService, filesConfigurationService, uriIdentityService, logService, editorResolverService, hostService, dialogService) {
            super(themeService);
            this.editorPartsView = editorPartsView;
            this.groupsView = groupsView;
            this.groupsLabel = groupsLabel;
            this._index = _index;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.telemetryService = telemetryService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            this.fileDialogService = fileDialogService;
            this.editorService = editorService;
            this.filesConfigurationService = filesConfigurationService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this.editorResolverService = editorResolverService;
            this.hostService = hostService;
            this.dialogService = dialogService;
            //#region events
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this._onDidModelChange = this._register(new event_1.Emitter());
            this.onDidModelChange = this._onDidModelChange.event;
            this._onDidActiveEditorChange = this._register(new event_1.Emitter());
            this.onDidActiveEditorChange = this._onDidActiveEditorChange.event;
            this._onDidOpenEditorFail = this._register(new event_1.Emitter());
            this.onDidOpenEditorFail = this._onDidOpenEditorFail.event;
            this._onWillCloseEditor = this._register(new event_1.Emitter());
            this.onWillCloseEditor = this._onWillCloseEditor.event;
            this._onDidCloseEditor = this._register(new event_1.Emitter());
            this.onDidCloseEditor = this._onDidCloseEditor.event;
            this._onWillMoveEditor = this._register(new event_1.Emitter());
            this.onWillMoveEditor = this._onWillMoveEditor.event;
            this._onWillOpenEditor = this._register(new event_1.Emitter());
            this.onWillOpenEditor = this._onWillOpenEditor.event;
            this.disposedEditorsWorker = this._register(new async_1.RunOnceWorker(editors => this.handleDisposedEditors(editors), 0));
            this.mapEditorToPendingConfirmation = new Map();
            this.containerToolBarMenuDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.whenRestoredPromise = new async_1.DeferredPromise();
            this.whenRestored = this.whenRestoredPromise.p;
            this._disposed = false;
            //#endregion
            //#region ISerializableView
            this.element = document.createElement('div');
            this._onDidChange = this._register(new event_1.Relay());
            this.onDidChange = this._onDidChange.event;
            if (from instanceof EditorGroupView_1) {
                this.model = this._register(from.model.clone());
            }
            else if ((0, editorGroupModel_1.isSerializedEditorGroupModel)(from)) {
                this.model = this._register(instantiationService.createInstance(editorGroupModel_1.EditorGroupModel, from));
            }
            else {
                this.model = this._register(instantiationService.createInstance(editorGroupModel_1.EditorGroupModel, undefined));
            }
            //#region create()
            {
                // Scoped context key service
                this.scopedContextKeyService = this._register(this.contextKeyService.createScoped(this.element));
                // Container
                this.element.classList.add(...(0, arrays_1.coalesce)(['editor-group-container', this.model.isLocked ? 'locked' : undefined]));
                // Container listeners
                this.registerContainerListeners();
                // Container toolbar
                this.createContainerToolbar();
                // Container context menu
                this.createContainerContextMenu();
                // Watermark & shortcuts
                this._register(this.instantiationService.createInstance(editorGroupWatermark_1.EditorGroupWatermark, this.element));
                // Progress bar
                this.progressBar = this._register(new progressbar_1.ProgressBar(this.element, defaultStyles_1.defaultProgressBarStyles));
                this.progressBar.hide();
                // Scoped instantiation service
                this.scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.scopedContextKeyService], [progress_1.IEditorProgressService, this._register(new progressIndicator_1.EditorProgressIndicator(this.progressBar, this))]));
                // Context keys
                this.resourceContext = this._register(this.scopedInstantiationService.createInstance(contextkeys_1.ResourceContextKey));
                this.handleGroupContextKeys();
                // Title container
                this.titleContainer = document.createElement('div');
                this.titleContainer.classList.add('title');
                this.element.appendChild(this.titleContainer);
                // Title control
                this.titleControl = this._register(this.scopedInstantiationService.createInstance(editorTitleControl_1.EditorTitleControl, this.titleContainer, this.editorPartsView, this.groupsView, this, this.model));
                // Editor container
                this.editorContainer = document.createElement('div');
                this.editorContainer.classList.add('editor-container');
                this.element.appendChild(this.editorContainer);
                // Editor pane
                this.editorPane = this._register(this.scopedInstantiationService.createInstance(editorPanes_1.EditorPanes, this.element, this.editorContainer, this));
                this._onDidChange.input = this.editorPane.onDidChangeSizeConstraints;
                // Track Focus
                this.doTrackFocus();
                // Update containers
                this.updateTitleContainer();
                this.updateContainer();
                // Update styles
                this.updateStyles();
            }
            //#endregion
            // Restore editors if provided
            const restoreEditorsPromise = this.restoreEditors(from) ?? Promise.resolve();
            // Signal restored once editors have restored
            restoreEditorsPromise.finally(() => {
                this.whenRestoredPromise.complete();
            });
            // Register Listeners
            this.registerListeners();
        }
        handleGroupContextKeys() {
            const groupActiveEditorDirtyContext = contextkeys_1.ActiveEditorDirtyContext.bindTo(this.scopedContextKeyService);
            const groupActiveEditorPinnedContext = contextkeys_1.ActiveEditorPinnedContext.bindTo(this.scopedContextKeyService);
            const groupActiveEditorFirstContext = contextkeys_1.ActiveEditorFirstInGroupContext.bindTo(this.scopedContextKeyService);
            const groupActiveEditorLastContext = contextkeys_1.ActiveEditorLastInGroupContext.bindTo(this.scopedContextKeyService);
            const groupActiveEditorStickyContext = contextkeys_1.ActiveEditorStickyContext.bindTo(this.scopedContextKeyService);
            const groupEditorsCountContext = contextkeys_1.EditorGroupEditorsCountContext.bindTo(this.scopedContextKeyService);
            const groupLockedContext = contextkeys_1.ActiveEditorGroupLockedContext.bindTo(this.scopedContextKeyService);
            const groupActiveEditorAvailableEditorIds = contextkeys_1.ActiveEditorAvailableEditorIdsContext.bindTo(this.scopedContextKeyService);
            const groupActiveEditorCanSplitInGroupContext = contextkeys_1.ActiveEditorCanSplitInGroupContext.bindTo(this.scopedContextKeyService);
            const sideBySideEditorContext = contextkeys_1.SideBySideEditorActiveContext.bindTo(this.scopedContextKeyService);
            const activeEditorListener = this._register(new lifecycle_1.MutableDisposable());
            const observeActiveEditor = () => {
                activeEditorListener.clear();
                this.scopedContextKeyService.bufferChangeEvents(() => {
                    const activeEditor = this.activeEditor;
                    this.resourceContext.set(editor_1.EditorResourceAccessor.getOriginalUri(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }));
                    (0, contextkeys_1.applyAvailableEditorIds)(groupActiveEditorAvailableEditorIds, activeEditor, this.editorResolverService);
                    groupActiveEditorCanSplitInGroupContext.set(activeEditor ? activeEditor.hasCapability(32 /* EditorInputCapabilities.CanSplitInGroup */) : false);
                    sideBySideEditorContext.set(activeEditor?.typeId === sideBySideEditorInput_1.SideBySideEditorInput.ID);
                    if (activeEditor) {
                        groupActiveEditorDirtyContext.set(activeEditor.isDirty() && !activeEditor.isSaving());
                        activeEditorListener.value = activeEditor.onDidChangeDirty(() => {
                            groupActiveEditorDirtyContext.set(activeEditor.isDirty() && !activeEditor.isSaving());
                        });
                    }
                    else {
                        groupActiveEditorDirtyContext.set(false);
                    }
                });
            };
            // Update group contexts based on group changes
            const updateGroupContextKeys = (e) => {
                switch (e.kind) {
                    case 3 /* GroupModelChangeKind.GROUP_LOCKED */:
                        groupLockedContext.set(this.isLocked);
                        break;
                    case 7 /* GroupModelChangeKind.EDITOR_ACTIVE */:
                        groupActiveEditorFirstContext.set(this.model.isFirst(this.model.activeEditor));
                        groupActiveEditorLastContext.set(this.model.isLast(this.model.activeEditor));
                        groupActiveEditorPinnedContext.set(this.model.activeEditor ? this.model.isPinned(this.model.activeEditor) : false);
                        groupActiveEditorStickyContext.set(this.model.activeEditor ? this.model.isSticky(this.model.activeEditor) : false);
                        break;
                    case 5 /* GroupModelChangeKind.EDITOR_CLOSE */:
                    case 4 /* GroupModelChangeKind.EDITOR_OPEN */:
                    case 6 /* GroupModelChangeKind.EDITOR_MOVE */:
                        groupActiveEditorFirstContext.set(this.model.isFirst(this.model.activeEditor));
                        groupActiveEditorLastContext.set(this.model.isLast(this.model.activeEditor));
                        break;
                    case 10 /* GroupModelChangeKind.EDITOR_PIN */:
                        if (e.editor && e.editor === this.model.activeEditor) {
                            groupActiveEditorPinnedContext.set(this.model.isPinned(this.model.activeEditor));
                        }
                        break;
                    case 12 /* GroupModelChangeKind.EDITOR_STICKY */:
                        if (e.editor && e.editor === this.model.activeEditor) {
                            groupActiveEditorStickyContext.set(this.model.isSticky(this.model.activeEditor));
                        }
                        break;
                }
                // Group editors count context
                groupEditorsCountContext.set(this.count);
            };
            this._register(this.onDidModelChange(e => updateGroupContextKeys(e)));
            // Track the active editor and update context key that reflects
            // the dirty state of this editor
            this._register(this.onDidActiveEditorChange(() => observeActiveEditor()));
            // Update context keys on startup
            observeActiveEditor();
            updateGroupContextKeys({ kind: 7 /* GroupModelChangeKind.EDITOR_ACTIVE */ });
            updateGroupContextKeys({ kind: 3 /* GroupModelChangeKind.GROUP_LOCKED */ });
        }
        registerContainerListeners() {
            // Open new file via doubleclick on empty container
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.DBLCLICK, e => {
                if (this.isEmpty) {
                    dom_1.EventHelper.stop(e);
                    this.editorService.openEditor({
                        resource: undefined,
                        options: {
                            pinned: true,
                            override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id
                        }
                    }, this.id);
                }
            }));
            // Close empty editor group via middle mouse click
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.AUXCLICK, e => {
                if (this.isEmpty && e.button === 1 /* Middle Button */) {
                    dom_1.EventHelper.stop(e, true);
                    this.groupsView.removeGroup(this);
                }
            }));
        }
        createContainerToolbar() {
            // Toolbar Container
            const toolbarContainer = document.createElement('div');
            toolbarContainer.classList.add('editor-group-container-toolbar');
            this.element.appendChild(toolbarContainer);
            // Toolbar
            const containerToolbar = this._register(new actionbar_1.ActionBar(toolbarContainer, {
                ariaLabel: (0, nls_1.localize)('ariaLabelGroupActions', "Empty editor group actions"),
                highlightToggledItems: true
            }));
            // Toolbar actions
            const containerToolbarMenu = this._register(this.menuService.createMenu(actions_1.MenuId.EmptyEditorGroup, this.scopedContextKeyService));
            const updateContainerToolbar = () => {
                const actions = { primary: [], secondary: [] };
                // Clear old actions
                this.containerToolBarMenuDisposable.value = (0, lifecycle_1.toDisposable)(() => containerToolbar.clear());
                // Create new actions
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(containerToolbarMenu, { arg: { groupId: this.id }, shouldForwardArgs: true }, actions, 'navigation');
                for (const action of [...actions.primary, ...actions.secondary]) {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    containerToolbar.push(action, { icon: true, label: false, keybinding: keybinding?.getLabel() });
                }
            };
            updateContainerToolbar();
            this._register(containerToolbarMenu.onDidChange(updateContainerToolbar));
        }
        createContainerContextMenu() {
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.CONTEXT_MENU, e => this.onShowContainerContextMenu(e)));
            this._register((0, dom_1.addDisposableListener)(this.element, touch_1.EventType.Contextmenu, () => this.onShowContainerContextMenu()));
        }
        onShowContainerContextMenu(e) {
            if (!this.isEmpty) {
                return; // only for empty editor groups
            }
            // Find target anchor
            let anchor = this.element;
            if (e) {
                anchor = new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.element), e);
            }
            // Show it
            this.contextMenuService.showContextMenu({
                menuId: actions_1.MenuId.EmptyEditorGroupContext,
                contextKeyService: this.contextKeyService,
                getAnchor: () => anchor,
                onHide: () => {
                    this.focus();
                }
            });
        }
        doTrackFocus() {
            // Container
            const containerFocusTracker = this._register((0, dom_1.trackFocus)(this.element));
            this._register(containerFocusTracker.onDidFocus(() => {
                if (this.isEmpty) {
                    this._onDidFocus.fire(); // only when empty to prevent duplicate events from `editorPane.onDidFocus`
                }
            }));
            // Title Container
            const handleTitleClickOrTouch = (e) => {
                let target;
                if ((0, dom_1.isMouseEvent)(e)) {
                    if (e.button !== 0 /* middle/right mouse button */ || (platform_1.isMacintosh && e.ctrlKey /* macOS context menu */)) {
                        return undefined;
                    }
                    target = e.target;
                }
                else {
                    target = e.initialTarget;
                }
                if ((0, dom_1.findParentWithClass)(target, 'monaco-action-bar', this.titleContainer) ||
                    (0, dom_1.findParentWithClass)(target, 'monaco-breadcrumb-item', this.titleContainer)) {
                    return; // not when clicking on actions or breadcrumbs
                }
                // timeout to keep focus in editor after mouse up
                setTimeout(() => {
                    this.focus();
                });
            };
            this._register((0, dom_1.addDisposableListener)(this.titleContainer, dom_1.EventType.MOUSE_DOWN, e => handleTitleClickOrTouch(e)));
            this._register((0, dom_1.addDisposableListener)(this.titleContainer, touch_1.EventType.Tap, e => handleTitleClickOrTouch(e)));
            // Editor pane
            this._register(this.editorPane.onDidFocus(() => {
                this._onDidFocus.fire();
            }));
        }
        updateContainer() {
            // Empty Container: add some empty container attributes
            if (this.isEmpty) {
                this.element.classList.add('empty');
                this.element.tabIndex = 0;
                this.element.setAttribute('aria-label', (0, nls_1.localize)('emptyEditorGroup', "{0} (empty)", this.ariaLabel));
            }
            // Non-Empty Container: revert empty container attributes
            else {
                this.element.classList.remove('empty');
                this.element.removeAttribute('tabIndex');
                this.element.removeAttribute('aria-label');
            }
            // Update styles
            this.updateStyles();
        }
        updateTitleContainer() {
            this.titleContainer.classList.toggle('tabs', this.groupsView.partOptions.showTabs === 'multiple');
            this.titleContainer.classList.toggle('show-file-icons', this.groupsView.partOptions.showIcons);
        }
        restoreEditors(from) {
            if (this.count === 0) {
                return; // nothing to show
            }
            // Determine editor options
            let options;
            if (from instanceof EditorGroupView_1) {
                options = (0, editor_2.fillActiveEditorViewState)(from); // if we copy from another group, ensure to copy its active editor viewstate
            }
            else {
                options = Object.create(null);
            }
            const activeEditor = this.model.activeEditor;
            if (!activeEditor) {
                return;
            }
            options.pinned = this.model.isPinned(activeEditor); // preserve pinned state
            options.sticky = this.model.isSticky(activeEditor); // preserve sticky state
            options.preserveFocus = true; // handle focus after editor is restored
            const internalOptions = {
                preserveWindowOrder: true // handle window order after editor is restored
            };
            const activeElement = (0, dom_1.getActiveElement)();
            // Show active editor (intentionally not using async to keep
            // `restoreEditors` from executing in same stack)
            return this.doShowEditor(activeEditor, { active: true, isNew: false /* restored */ }, options, internalOptions).then(() => {
                // Set focused now if this is the active group and focus has
                // not changed meanwhile. This prevents focus from being
                // stolen accidentally on startup when the user already
                // clicked somewhere.
                if (this.groupsView.activeGroup === this && activeElement && (0, dom_1.isActiveElement)(activeElement)) {
                    this.focus();
                }
            });
        }
        //#region event handling
        registerListeners() {
            // Model Events
            this._register(this.model.onDidModelChange(e => this.onDidGroupModelChange(e)));
            // Option Changes
            this._register(this.groupsView.onDidChangeEditorPartOptions(e => this.onDidChangeEditorPartOptions(e)));
            // Visibility
            this._register(this.groupsView.onDidVisibilityChange(e => this.onDidVisibilityChange(e)));
            // Focus
            this._register(this.onDidFocus(() => this.onDidGainFocus()));
        }
        onDidGroupModelChange(e) {
            // Re-emit to outside
            this._onDidModelChange.fire(e);
            // Handle within
            if (e.kind === 3 /* GroupModelChangeKind.GROUP_LOCKED */) {
                this.element.classList.toggle('locked', this.isLocked);
            }
            if (!e.editor) {
                return;
            }
            switch (e.kind) {
                case 4 /* GroupModelChangeKind.EDITOR_OPEN */:
                    if ((0, editorGroupModel_1.isGroupEditorOpenEvent)(e)) {
                        this.onDidOpenEditor(e.editor, e.editorIndex);
                    }
                    break;
                case 5 /* GroupModelChangeKind.EDITOR_CLOSE */:
                    if ((0, editorGroupModel_1.isGroupEditorCloseEvent)(e)) {
                        this.handleOnDidCloseEditor(e.editor, e.editorIndex, e.context, e.sticky);
                    }
                    break;
                case 14 /* GroupModelChangeKind.EDITOR_WILL_DISPOSE */:
                    this.onWillDisposeEditor(e.editor);
                    break;
                case 13 /* GroupModelChangeKind.EDITOR_DIRTY */:
                    this.onDidChangeEditorDirty(e.editor);
                    break;
                case 11 /* GroupModelChangeKind.EDITOR_TRANSIENT */:
                    this.onDidChangeEditorTransient(e.editor);
                    break;
                case 8 /* GroupModelChangeKind.EDITOR_LABEL */:
                    this.onDidChangeEditorLabel(e.editor);
                    break;
            }
        }
        onDidOpenEditor(editor, editorIndex) {
            /* __GDPR__
                "editorOpened" : {
                    "owner": "bpasero",
                    "${include}": [
                        "${EditorTelemetryDescriptor}"
                    ]
                }
            */
            this.telemetryService.publicLog('editorOpened', this.toEditorTelemetryDescriptor(editor));
            // Update container
            this.updateContainer();
        }
        handleOnDidCloseEditor(editor, editorIndex, context, sticky) {
            // Before close
            this._onWillCloseEditor.fire({ groupId: this.id, editor, context, index: editorIndex, sticky });
            // Handle event
            const editorsToClose = [editor];
            // Include both sides of side by side editors when being closed
            if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                editorsToClose.push(editor.primary, editor.secondary);
            }
            // For each editor to close, we call dispose() to free up any resources.
            // However, certain editors might be shared across multiple editor groups
            // (including being visible in side by side / diff editors) and as such we
            // only dispose when they are not opened elsewhere.
            for (const editor of editorsToClose) {
                if (this.canDispose(editor)) {
                    editor.dispose();
                }
            }
            /* __GDPR__
                "editorClosed" : {
                    "owner": "bpasero",
                    "${include}": [
                        "${EditorTelemetryDescriptor}"
                    ]
                }
            */
            this.telemetryService.publicLog('editorClosed', this.toEditorTelemetryDescriptor(editor));
            // Update container
            this.updateContainer();
            // Event
            this._onDidCloseEditor.fire({ groupId: this.id, editor, context, index: editorIndex, sticky });
        }
        canDispose(editor) {
            for (const groupView of this.editorPartsView.groups) {
                if (groupView instanceof EditorGroupView_1 && groupView.model.contains(editor, {
                    strictEquals: true, // only if this input is not shared across editor groups
                    supportSideBySide: editor_1.SideBySideEditor.ANY // include any side of an opened side by side editor
                })) {
                    return false;
                }
            }
            return true;
        }
        toResourceTelemetryDescriptor(resource) {
            if (!resource) {
                return undefined;
            }
            const path = resource ? resource.scheme === network_1.Schemas.file ? resource.fsPath : resource.path : undefined;
            if (!path) {
                return undefined;
            }
            let resourceExt = (0, resources_1.extname)(resource);
            // Remove query parameters from the resource extension
            const queryStringLocation = resourceExt.indexOf('?');
            resourceExt = queryStringLocation !== -1 ? resourceExt.substr(0, queryStringLocation) : resourceExt;
            return { mimeType: new telemetryUtils_1.TelemetryTrustedValue((0, languagesAssociations_1.getMimeTypes)(resource).join(', ')), scheme: resource.scheme, ext: resourceExt, path: (0, hash_1.hash)(path) };
        }
        toEditorTelemetryDescriptor(editor) {
            const descriptor = editor.getTelemetryDescriptor();
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH });
            if (uri_1.URI.isUri(resource)) {
                descriptor['resource'] = this.toResourceTelemetryDescriptor(resource);
                /* __GDPR__FRAGMENT__
                    "EditorTelemetryDescriptor" : {
                        "resource": { "${inline}": [ "${URIDescriptor}" ] }
                    }
                */
                return descriptor;
            }
            else if (resource) {
                if (resource.primary) {
                    descriptor['resource'] = this.toResourceTelemetryDescriptor(resource.primary);
                }
                if (resource.secondary) {
                    descriptor['resourceSecondary'] = this.toResourceTelemetryDescriptor(resource.secondary);
                }
                /* __GDPR__FRAGMENT__
                    "EditorTelemetryDescriptor" : {
                        "resource": { "${inline}": [ "${URIDescriptor}" ] },
                        "resourceSecondary": { "${inline}": [ "${URIDescriptor}" ] }
                    }
                */
                return descriptor;
            }
            return descriptor;
        }
        onWillDisposeEditor(editor) {
            // To prevent race conditions, we handle disposed editors in our worker with a timeout
            // because it can happen that an input is being disposed with the intent to replace
            // it with some other input right after.
            this.disposedEditorsWorker.work(editor);
        }
        handleDisposedEditors(disposedEditors) {
            // Split between visible and hidden editors
            let activeEditor;
            const inactiveEditors = [];
            for (const disposedEditor of disposedEditors) {
                const editorFindResult = this.model.findEditor(disposedEditor);
                if (!editorFindResult) {
                    continue; // not part of the model anymore
                }
                const editor = editorFindResult[0];
                if (!editor.isDisposed()) {
                    continue; // editor got reopened meanwhile
                }
                if (this.model.isActive(editor)) {
                    activeEditor = editor;
                }
                else {
                    inactiveEditors.push(editor);
                }
            }
            // Close all inactive editors first to prevent UI flicker
            for (const inactiveEditor of inactiveEditors) {
                this.doCloseEditor(inactiveEditor, true);
            }
            // Close active one last
            if (activeEditor) {
                this.doCloseEditor(activeEditor, true);
            }
        }
        onDidChangeEditorPartOptions(event) {
            // Title container
            this.updateTitleContainer();
            // Title control
            this.titleControl.updateOptions(event.oldPartOptions, event.newPartOptions);
            // Title control switch between singleEditorTabs, multiEditorTabs and multiRowEditorTabs
            if (event.oldPartOptions.showTabs !== event.newPartOptions.showTabs ||
                event.oldPartOptions.tabHeight !== event.newPartOptions.tabHeight ||
                (event.oldPartOptions.showTabs === 'multiple' && event.oldPartOptions.pinnedTabsOnSeparateRow !== event.newPartOptions.pinnedTabsOnSeparateRow)) {
                // Re-layout
                this.relayout();
                // Ensure to show active editor if any
                if (this.model.activeEditor) {
                    this.titleControl.openEditor(this.model.activeEditor);
                }
            }
            // Styles
            this.updateStyles();
            // Pin preview editor once user disables preview
            if (event.oldPartOptions.enablePreview && !event.newPartOptions.enablePreview) {
                if (this.model.previewEditor) {
                    this.pinEditor(this.model.previewEditor);
                }
            }
        }
        onDidChangeEditorDirty(editor) {
            // Always show dirty editors pinned
            this.pinEditor(editor);
            // Forward to title control
            this.titleControl.updateEditorDirty(editor);
        }
        onDidChangeEditorTransient(editor) {
            const transient = this.model.isTransient(editor);
            // Transient state overrides the `enablePreview` setting,
            // so when an editor leaves the transient state, we have
            // to ensure its preview state is also cleared.
            if (!transient && !this.groupsView.partOptions.enablePreview) {
                this.pinEditor(editor);
            }
        }
        onDidChangeEditorLabel(editor) {
            // Forward to title control
            this.titleControl.updateEditorLabel(editor);
        }
        onDidVisibilityChange(visible) {
            // Forward to active editor pane
            this.editorPane.setVisible(visible);
        }
        onDidGainFocus() {
            if (this.activeEditor) {
                // We aggressively clear the transient state of editors
                // as soon as the group gains focus. This is to ensure
                // that the transient state is not staying around when
                // the user interacts with the editor.
                this.model.setTransient(this.activeEditor, false);
            }
        }
        //#endregion
        //#region IEditorGroupView
        get index() {
            return this._index;
        }
        get label() {
            if (this.groupsLabel) {
                return (0, nls_1.localize)('groupLabelLong', "{0}: Group {1}", this.groupsLabel, this._index + 1);
            }
            return (0, nls_1.localize)('groupLabel', "Group {0}", this._index + 1);
        }
        get ariaLabel() {
            if (this.groupsLabel) {
                return (0, nls_1.localize)('groupAriaLabelLong', "{0}: Editor Group {1}", this.groupsLabel, this._index + 1);
            }
            return (0, nls_1.localize)('groupAriaLabel', "Editor Group {0}", this._index + 1);
        }
        get disposed() {
            return this._disposed;
        }
        get isEmpty() {
            return this.count === 0;
        }
        get titleHeight() {
            return this.titleControl.getHeight();
        }
        notifyIndexChanged(newIndex) {
            if (this._index !== newIndex) {
                this._index = newIndex;
                this.model.setIndex(newIndex);
            }
        }
        notifyLabelChanged(newLabel) {
            if (this.groupsLabel !== newLabel) {
                this.groupsLabel = newLabel;
                this.model.setLabel(newLabel);
            }
        }
        setActive(isActive) {
            this.active = isActive;
            // Update container
            this.element.classList.toggle('active', isActive);
            this.element.classList.toggle('inactive', !isActive);
            // Update title control
            this.titleControl.setActive(isActive);
            // Update styles
            this.updateStyles();
            // Update model
            this.model.setActive(undefined /* entire group got active */);
        }
        //#endregion
        //#region basics()
        get id() {
            return this.model.id;
        }
        get windowId() {
            return this.groupsView.windowId;
        }
        get editors() {
            return this.model.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
        }
        get count() {
            return this.model.count;
        }
        get stickyCount() {
            return this.model.stickyCount;
        }
        get activeEditorPane() {
            return this.editorPane ? this.editorPane.activeEditorPane ?? undefined : undefined;
        }
        get activeEditor() {
            return this.model.activeEditor;
        }
        get previewEditor() {
            return this.model.previewEditor;
        }
        isPinned(editorOrIndex) {
            return this.model.isPinned(editorOrIndex);
        }
        isSticky(editorOrIndex) {
            return this.model.isSticky(editorOrIndex);
        }
        isTransient(editorOrIndex) {
            return this.model.isTransient(editorOrIndex);
        }
        isActive(editor) {
            return this.model.isActive(editor);
        }
        contains(candidate, options) {
            return this.model.contains(candidate, options);
        }
        getEditors(order, options) {
            return this.model.getEditors(order, options);
        }
        findEditors(resource, options) {
            const canonicalResource = this.uriIdentityService.asCanonicalUri(resource);
            return this.getEditors(1 /* EditorsOrder.SEQUENTIAL */).filter(editor => {
                if (editor.resource && (0, resources_1.isEqual)(editor.resource, canonicalResource)) {
                    return true;
                }
                // Support side by side editor primary side if specified
                if (options?.supportSideBySide === editor_1.SideBySideEditor.PRIMARY || options?.supportSideBySide === editor_1.SideBySideEditor.ANY) {
                    const primaryResource = editor_1.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                    if (primaryResource && (0, resources_1.isEqual)(primaryResource, canonicalResource)) {
                        return true;
                    }
                }
                // Support side by side editor secondary side if specified
                if (options?.supportSideBySide === editor_1.SideBySideEditor.SECONDARY || options?.supportSideBySide === editor_1.SideBySideEditor.ANY) {
                    const secondaryResource = editor_1.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY });
                    if (secondaryResource && (0, resources_1.isEqual)(secondaryResource, canonicalResource)) {
                        return true;
                    }
                }
                return false;
            });
        }
        getEditorByIndex(index) {
            return this.model.getEditorByIndex(index);
        }
        getIndexOfEditor(editor) {
            return this.model.indexOf(editor);
        }
        isFirst(editor) {
            return this.model.isFirst(editor);
        }
        isLast(editor) {
            return this.model.isLast(editor);
        }
        focus() {
            // Pass focus to editor panes
            if (this.activeEditorPane) {
                this.activeEditorPane.focus();
            }
            else {
                this.element.focus();
            }
            // Event
            this._onDidFocus.fire();
        }
        pinEditor(candidate = this.activeEditor || undefined) {
            if (candidate && !this.model.isPinned(candidate)) {
                // Update model
                const editor = this.model.pin(candidate);
                // Forward to title control
                if (editor) {
                    this.titleControl.pinEditor(editor);
                }
            }
        }
        stickEditor(candidate = this.activeEditor || undefined) {
            this.doStickEditor(candidate, true);
        }
        unstickEditor(candidate = this.activeEditor || undefined) {
            this.doStickEditor(candidate, false);
        }
        doStickEditor(candidate, sticky) {
            if (candidate && this.model.isSticky(candidate) !== sticky) {
                const oldIndexOfEditor = this.getIndexOfEditor(candidate);
                // Update model
                const editor = sticky ? this.model.stick(candidate) : this.model.unstick(candidate);
                if (!editor) {
                    return;
                }
                // If the index of the editor changed, we need to forward this to
                // title control and also make sure to emit this as an event
                const newIndexOfEditor = this.getIndexOfEditor(editor);
                if (newIndexOfEditor !== oldIndexOfEditor) {
                    this.titleControl.moveEditor(editor, oldIndexOfEditor, newIndexOfEditor, true);
                }
                // Forward sticky state to title control
                if (sticky) {
                    this.titleControl.stickEditor(editor);
                }
                else {
                    this.titleControl.unstickEditor(editor);
                }
            }
        }
        //#endregion
        //#region openEditor()
        async openEditor(editor, options, internalOptions) {
            return this.doOpenEditor(editor, options, {
                // Appply given internal open options
                ...internalOptions,
                // Allow to match on a side-by-side editor when same
                // editor is opened on both sides. In that case we
                // do not want to open a new editor but reuse that one.
                supportSideBySide: editor_1.SideBySideEditor.BOTH
            });
        }
        async doOpenEditor(editor, options, internalOptions) {
            // Guard against invalid editors. Disposed editors
            // should never open because they emit no events
            // e.g. to indicate dirty changes.
            if (!editor || editor.isDisposed()) {
                return;
            }
            // Fire the event letting everyone know we are about to open an editor
            this._onWillOpenEditor.fire({ editor, groupId: this.id });
            // Determine options
            const pinned = options?.sticky
                || (!this.groupsView.partOptions.enablePreview && !options?.transient)
                || editor.isDirty()
                || (options?.pinned ?? typeof options?.index === 'number' /* unless specified, prefer to pin when opening with index */)
                || (typeof options?.index === 'number' && this.model.isSticky(options.index))
                || editor.hasCapability(512 /* EditorInputCapabilities.Scratchpad */);
            const openEditorOptions = {
                index: options ? options.index : undefined,
                pinned,
                sticky: options?.sticky || (typeof options?.index === 'number' && this.model.isSticky(options.index)),
                transient: !!options?.transient,
                active: this.count === 0 || !options || !options.inactive,
                supportSideBySide: internalOptions?.supportSideBySide
            };
            if (!openEditorOptions.active && !openEditorOptions.pinned && this.model.activeEditor && !this.model.isPinned(this.model.activeEditor)) {
                // Special case: we are to open an editor inactive and not pinned, but the current active
                // editor is also not pinned, which means it will get replaced with this one. As such,
                // the editor can only be active.
                openEditorOptions.active = true;
            }
            let activateGroup = false;
            let restoreGroup = false;
            if (options?.activation === editor_3.EditorActivation.ACTIVATE) {
                // Respect option to force activate an editor group.
                activateGroup = true;
            }
            else if (options?.activation === editor_3.EditorActivation.RESTORE) {
                // Respect option to force restore an editor group.
                restoreGroup = true;
            }
            else if (options?.activation === editor_3.EditorActivation.PRESERVE) {
                // Respect option to preserve active editor group.
                activateGroup = false;
                restoreGroup = false;
            }
            else if (openEditorOptions.active) {
                // Finally, we only activate/restore an editor which is
                // opening as active editor.
                // If preserveFocus is enabled, we only restore but never
                // activate the group.
                activateGroup = !options || !options.preserveFocus;
                restoreGroup = !activateGroup;
            }
            // Actually move the editor if a specific index is provided and we figure
            // out that the editor is already opened at a different index. This
            // ensures the right set of events are fired to the outside.
            if (typeof openEditorOptions.index === 'number') {
                const indexOfEditor = this.model.indexOf(editor);
                if (indexOfEditor !== -1 && indexOfEditor !== openEditorOptions.index) {
                    this.doMoveEditorInsideGroup(editor, openEditorOptions);
                }
            }
            // Update model and make sure to continue to use the editor we get from
            // the model. It is possible that the editor was already opened and we
            // want to ensure that we use the existing instance in that case.
            const { editor: openedEditor, isNew } = this.model.openEditor(editor, openEditorOptions);
            // Conditionally lock the group
            if (isNew && // only if this editor was new for the group
                this.count === 1 && // only when this editor was the first editor in the group
                this.editorPartsView.groups.length > 1 // only allow auto locking if more than 1 group is opened
            ) {
                // only when the editor identifier is configured as such
                if (openedEditor.editorId && this.groupsView.partOptions.autoLockGroups?.has(openedEditor.editorId)) {
                    this.lock(true);
                }
            }
            // Show editor
            const showEditorResult = this.doShowEditor(openedEditor, { active: !!openEditorOptions.active, isNew }, options, internalOptions);
            // Finally make sure the group is active or restored as instructed
            if (activateGroup) {
                this.groupsView.activateGroup(this);
            }
            else if (restoreGroup) {
                this.groupsView.restoreGroup(this);
            }
            return showEditorResult;
        }
        doShowEditor(editor, context, options, internalOptions) {
            // Show in editor control if the active editor changed
            let openEditorPromise;
            if (context.active) {
                openEditorPromise = (async () => {
                    const { pane, changed, cancelled, error } = await this.editorPane.openEditor(editor, options, internalOptions, { newInGroup: context.isNew });
                    // Return early if the operation was cancelled by another operation
                    if (cancelled) {
                        return undefined;
                    }
                    // Editor change event
                    if (changed) {
                        this._onDidActiveEditorChange.fire({ editor });
                    }
                    // Indicate error as an event but do not bubble them up
                    if (error) {
                        this._onDidOpenEditorFail.fire(editor);
                    }
                    // Without an editor pane, recover by closing the active editor
                    // (if the input is still the active one)
                    if (!pane && this.activeEditor === editor) {
                        this.doCloseEditor(editor, options?.preserveFocus, { fromError: true });
                    }
                    return pane;
                })();
            }
            else {
                openEditorPromise = Promise.resolve(undefined); // inactive: return undefined as result to signal this
            }
            // Show in title control after editor control because some actions depend on it
            // but respect the internal options in case title control updates should skip.
            if (!internalOptions?.skipTitleUpdate) {
                this.titleControl.openEditor(editor, internalOptions);
            }
            return openEditorPromise;
        }
        //#endregion
        //#region openEditors()
        async openEditors(editors) {
            // Guard against invalid editors. Disposed editors
            // should never open because they emit no events
            // e.g. to indicate dirty changes.
            const editorsToOpen = (0, arrays_1.coalesce)(editors).filter(({ editor }) => !editor.isDisposed());
            // Use the first editor as active editor
            const firstEditor = (0, arrays_1.firstOrDefault)(editorsToOpen);
            if (!firstEditor) {
                return;
            }
            const openEditorsOptions = {
                // Allow to match on a side-by-side editor when same
                // editor is opened on both sides. In that case we
                // do not want to open a new editor but reuse that one.
                supportSideBySide: editor_1.SideBySideEditor.BOTH
            };
            await this.doOpenEditor(firstEditor.editor, firstEditor.options, openEditorsOptions);
            // Open the other ones inactive
            const inactiveEditors = editorsToOpen.slice(1);
            const startingIndex = this.getIndexOfEditor(firstEditor.editor) + 1;
            await async_1.Promises.settled(inactiveEditors.map(({ editor, options }, index) => {
                return this.doOpenEditor(editor, {
                    ...options,
                    inactive: true,
                    pinned: true,
                    index: startingIndex + index
                }, {
                    ...openEditorsOptions,
                    // optimization: update the title control later
                    // https://github.com/microsoft/vscode/issues/130634
                    skipTitleUpdate: true
                });
            }));
            // Update the title control all at once with all editors
            this.titleControl.openEditors(inactiveEditors.map(({ editor }) => editor));
            // Opening many editors at once can put any editor to be
            // the active one depending on options. As such, we simply
            // return the active editor pane after this operation.
            return this.editorPane.activeEditorPane ?? undefined;
        }
        //#endregion
        //#region moveEditor()
        moveEditors(editors, target) {
            // Optimization: knowing that we move many editors, we
            // delay the title update to a later point for this group
            // through a method that allows for bulk updates but only
            // when moving to a different group where many editors
            // are more likely to occur.
            const internalOptions = {
                skipTitleUpdate: this !== target
            };
            let moveFailed = false;
            const movedEditors = new Set();
            for (const { editor, options } of editors) {
                if (this.moveEditor(editor, target, options, internalOptions)) {
                    movedEditors.add(editor);
                }
                else {
                    moveFailed = true;
                }
            }
            // Update the title control all at once with all editors
            // in source and target if the title update was skipped
            if (internalOptions.skipTitleUpdate) {
                target.titleControl.openEditors(Array.from(movedEditors));
                this.titleControl.closeEditors(Array.from(movedEditors));
            }
            return !moveFailed;
        }
        moveEditor(editor, target, options, internalOptions) {
            // Move within same group
            if (this === target) {
                this.doMoveEditorInsideGroup(editor, options);
                return true;
            }
            // Move across groups
            else {
                return this.doMoveOrCopyEditorAcrossGroups(editor, target, options, { ...internalOptions, keepCopy: false });
            }
        }
        doMoveEditorInsideGroup(candidate, options) {
            const moveToIndex = options ? options.index : undefined;
            if (typeof moveToIndex !== 'number') {
                return; // do nothing if we move into same group without index
            }
            // Update model and make sure to continue to use the editor we get from
            // the model. It is possible that the editor was already opened and we
            // want to ensure that we use the existing instance in that case.
            const currentIndex = this.model.indexOf(candidate);
            const editor = this.model.getEditorByIndex(currentIndex);
            if (!editor) {
                return;
            }
            // Move when index has actually changed
            if (currentIndex !== moveToIndex) {
                const oldStickyCount = this.model.stickyCount;
                // Update model
                this.model.moveEditor(editor, moveToIndex);
                this.model.pin(editor);
                // Forward to title control
                this.titleControl.moveEditor(editor, currentIndex, moveToIndex, oldStickyCount !== this.model.stickyCount);
                this.titleControl.pinEditor(editor);
            }
            // Support the option to stick the editor even if it is moved.
            // It is important that we call this method after we have moved
            // the editor because the result of moving the editor could have
            // caused a change in sticky state.
            if (options?.sticky) {
                this.stickEditor(editor);
            }
        }
        doMoveOrCopyEditorAcrossGroups(editor, target, openOptions, internalOptions) {
            const keepCopy = internalOptions?.keepCopy;
            // Validate that we can move
            if (!keepCopy || editor.hasCapability(8 /* EditorInputCapabilities.Singleton */) /* singleton editors will always move */) {
                const canMoveVeto = editor.canMove(this.id, target.id);
                if (typeof canMoveVeto === 'string') {
                    this.dialogService.error(canMoveVeto, (0, nls_1.localize)('moveErrorDetails', "Try saving or reverting the editor first and then try again."));
                    return false;
                }
            }
            // When moving/copying an editor, try to preserve as much view state as possible
            // by checking for the editor to be a text editor and creating the options accordingly
            // if so
            const options = (0, editor_2.fillActiveEditorViewState)(this, editor, {
                ...openOptions,
                pinned: true, // always pin moved editor
                sticky: openOptions?.sticky ?? (!keepCopy && this.model.isSticky(editor)) // preserve sticky state only if editor is moved or eplicitly wanted (https://github.com/microsoft/vscode/issues/99035)
            });
            // Indicate will move event
            if (!keepCopy) {
                this._onWillMoveEditor.fire({
                    groupId: this.id,
                    editor,
                    target: target.id
                });
            }
            // A move to another group is an open first...
            target.doOpenEditor(keepCopy ? editor.copy() : editor, options, internalOptions);
            // ...and a close afterwards (unless we copy)
            if (!keepCopy) {
                this.doCloseEditor(editor, true /* do not focus next one behind if any */, { ...internalOptions, context: editor_1.EditorCloseContext.MOVE });
            }
            return true;
        }
        //#endregion
        //#region copyEditor()
        copyEditors(editors, target) {
            // Optimization: knowing that we move many editors, we
            // delay the title update to a later point for this group
            // through a method that allows for bulk updates but only
            // when moving to a different group where many editors
            // are more likely to occur.
            const internalOptions = {
                skipTitleUpdate: this !== target
            };
            for (const { editor, options } of editors) {
                this.copyEditor(editor, target, options, internalOptions);
            }
            // Update the title control all at once with all editors
            // in target if the title update was skipped
            if (internalOptions.skipTitleUpdate) {
                const copiedEditors = editors.map(({ editor }) => editor);
                target.titleControl.openEditors(copiedEditors);
            }
        }
        copyEditor(editor, target, options, internalOptions) {
            // Move within same group because we do not support to show the same editor
            // multiple times in the same group
            if (this === target) {
                this.doMoveEditorInsideGroup(editor, options);
            }
            // Copy across groups
            else {
                this.doMoveOrCopyEditorAcrossGroups(editor, target, options, { ...internalOptions, keepCopy: true });
            }
        }
        //#endregion
        //#region closeEditor()
        async closeEditor(editor = this.activeEditor || undefined, options) {
            return this.doCloseEditorWithConfirmationHandling(editor, options);
        }
        async doCloseEditorWithConfirmationHandling(editor = this.activeEditor || undefined, options, internalOptions) {
            if (!editor) {
                return false;
            }
            // Check for confirmation and veto
            const veto = await this.handleCloseConfirmation([editor]);
            if (veto) {
                return false;
            }
            // Do close
            this.doCloseEditor(editor, options?.preserveFocus, internalOptions);
            return true;
        }
        doCloseEditor(editor, preserveFocus = (this.groupsView.activeGroup !== this), internalOptions) {
            // Forward to title control unless skipped via internal options
            if (!internalOptions?.skipTitleUpdate) {
                this.titleControl.beforeCloseEditor(editor);
            }
            // Closing the active editor of the group is a bit more work
            if (this.model.isActive(editor)) {
                this.doCloseActiveEditor(preserveFocus, internalOptions);
            }
            // Closing inactive editor is just a model update
            else {
                this.doCloseInactiveEditor(editor, internalOptions);
            }
            // Forward to title control unless skipped via internal options
            if (!internalOptions?.skipTitleUpdate) {
                this.titleControl.closeEditor(editor);
            }
        }
        doCloseActiveEditor(preserveFocus = (this.groupsView.activeGroup !== this), internalOptions) {
            const editorToClose = this.activeEditor;
            const restoreFocus = !preserveFocus && this.shouldRestoreFocus(this.element);
            // Optimization: if we are about to close the last editor in this group and settings
            // are configured to close the group since it will be empty, we first set the last
            // active group as empty before closing the editor. This reduces the amount of editor
            // change events that this operation emits and will reduce flicker. Without this
            // optimization, this group (if active) would first trigger a active editor change
            // event because it became empty, only to then trigger another one when the next
            // group gets active.
            const closeEmptyGroup = this.groupsView.partOptions.closeEmptyGroups;
            if (closeEmptyGroup && this.active && this.count === 1) {
                const mostRecentlyActiveGroups = this.groupsView.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
                const nextActiveGroup = mostRecentlyActiveGroups[1]; // [0] will be the current one, so take [1]
                if (nextActiveGroup) {
                    if (restoreFocus) {
                        nextActiveGroup.focus();
                    }
                    else {
                        this.groupsView.activateGroup(nextActiveGroup, true);
                    }
                }
            }
            // Update model
            if (editorToClose) {
                this.model.closeEditor(editorToClose, internalOptions?.context);
            }
            // Open next active if there are more to show
            const nextActiveEditor = this.model.activeEditor;
            if (nextActiveEditor) {
                let activation = undefined;
                if (preserveFocus && this.groupsView.activeGroup !== this) {
                    // If we are opening the next editor in an inactive group
                    // without focussing it, ensure we preserve the editor
                    // group sizes in case that group is minimized.
                    // https://github.com/microsoft/vscode/issues/117686
                    activation = editor_3.EditorActivation.PRESERVE;
                }
                const options = {
                    preserveFocus,
                    activation,
                    // When closing an editor due to an error we can end up in a loop where we continue closing
                    // editors that fail to open (e.g. when the file no longer exists). We do not want to show
                    // repeated errors in this case to the user. As such, if we open the next editor and we are
                    // in a scope of a previous editor failing, we silence the input errors until the editor is
                    // opened by setting ignoreError: true.
                    ignoreError: internalOptions?.fromError
                };
                const internalEditorOpenOptions = {
                    // When closing an editor, we reveal the next one in the group.
                    // However, this can be a result of moving an editor to another
                    // window so we explicitly disable window reordering in this case.
                    preserveWindowOrder: true
                };
                this.doOpenEditor(nextActiveEditor, options, internalEditorOpenOptions);
            }
            // Otherwise we are empty, so clear from editor control and send event
            else {
                // Forward to editor pane
                if (editorToClose) {
                    this.editorPane.closeEditor(editorToClose);
                }
                // Restore focus to group container as needed unless group gets closed
                if (restoreFocus && !closeEmptyGroup) {
                    this.focus();
                }
                // Events
                this._onDidActiveEditorChange.fire({ editor: undefined });
                // Remove empty group if we should
                if (closeEmptyGroup) {
                    this.groupsView.removeGroup(this, preserveFocus);
                }
            }
        }
        shouldRestoreFocus(target) {
            const activeElement = (0, dom_1.getActiveElement)();
            if (activeElement === target.ownerDocument.body) {
                return true; // always restore focus if nothing is focused currently
            }
            // otherwise check for the active element being an ancestor of the target
            return (0, dom_1.isAncestor)(activeElement, target);
        }
        doCloseInactiveEditor(editor, internalOptions) {
            // Update model
            this.model.closeEditor(editor, internalOptions?.context);
        }
        async handleCloseConfirmation(editors) {
            if (!editors.length) {
                return false; // no veto
            }
            const editor = editors.shift();
            // To prevent multiple confirmation dialogs from showing up one after the other
            // we check if a pending confirmation is currently showing and if so, join that
            let handleCloseConfirmationPromise = this.mapEditorToPendingConfirmation.get(editor);
            if (!handleCloseConfirmationPromise) {
                handleCloseConfirmationPromise = this.doHandleCloseConfirmation(editor);
                this.mapEditorToPendingConfirmation.set(editor, handleCloseConfirmationPromise);
            }
            let veto;
            try {
                veto = await handleCloseConfirmationPromise;
            }
            finally {
                this.mapEditorToPendingConfirmation.delete(editor);
            }
            // Return for the first veto we got
            if (veto) {
                return veto;
            }
            // Otherwise continue with the remainders
            return this.handleCloseConfirmation(editors);
        }
        async doHandleCloseConfirmation(editor, options) {
            if (!this.shouldConfirmClose(editor)) {
                return false; // no veto
            }
            if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput && this.model.contains(editor.primary)) {
                return false; // primary-side of editor is still opened somewhere else
            }
            // Note: we explicitly decide to ask for confirm if closing a normal editor even
            // if it is opened in a side-by-side editor in the group. This decision is made
            // because it may be less obvious that one side of a side by side editor is dirty
            // and can still be changed.
            // The only exception is when the same editor is opened on both sides of a side
            // by side editor (https://github.com/microsoft/vscode/issues/138442)
            if (this.editorPartsView.groups.some(groupView => {
                if (groupView === this) {
                    return false; // skip (we already handled our group above)
                }
                const otherGroup = groupView;
                if (otherGroup.contains(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH })) {
                    return true; // exact editor still opened (either single, or split-in-group)
                }
                if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput && otherGroup.contains(editor.primary)) {
                    return true; // primary side of side by side editor still opened
                }
                return false;
            })) {
                return false; // editor is still editable somewhere else
            }
            // In some cases trigger save before opening the dialog depending
            // on auto-save configuration.
            // However, make sure to respect `skipAutoSave` option in case the automated
            // save fails which would result in the editor never closing.
            // Also, we only do this if no custom confirmation handling is implemented.
            let confirmation = 2 /* ConfirmResult.CANCEL */;
            let saveReason = 1 /* SaveReason.EXPLICIT */;
            let autoSave = false;
            if (!editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) && !options?.skipAutoSave && !editor.closeHandler) {
                // Auto-save on focus change: save, because a dialog would steal focus
                // (see https://github.com/microsoft/vscode/issues/108752)
                if (this.filesConfigurationService.getAutoSaveMode(editor).mode === 3 /* AutoSaveMode.ON_FOCUS_CHANGE */) {
                    autoSave = true;
                    confirmation = 0 /* ConfirmResult.SAVE */;
                    saveReason = 3 /* SaveReason.FOCUS_CHANGE */;
                }
                // Auto-save on window change: save, because on Windows and Linux, a
                // native dialog triggers the window focus change
                // (see https://github.com/microsoft/vscode/issues/134250)
                else if ((platform_1.isNative && (platform_1.isWindows || platform_1.isLinux)) && this.filesConfigurationService.getAutoSaveMode(editor).mode === 4 /* AutoSaveMode.ON_WINDOW_CHANGE */) {
                    autoSave = true;
                    confirmation = 0 /* ConfirmResult.SAVE */;
                    saveReason = 4 /* SaveReason.WINDOW_CHANGE */;
                }
            }
            // No auto-save on focus change or custom confirmation handler: ask user
            if (!autoSave) {
                // Switch to editor that we want to handle for confirmation unless showing already
                if (!this.activeEditor || !this.activeEditor.matches(editor)) {
                    await this.doOpenEditor(editor);
                }
                // Ensure our window has focus since we are about to show a dialog
                await this.hostService.focus((0, dom_1.getWindow)(this.element));
                // Let editor handle confirmation if implemented
                if (typeof editor.closeHandler?.confirm === 'function') {
                    confirmation = await editor.closeHandler.confirm([{ editor, groupId: this.id }]);
                }
                // Show a file specific confirmation
                else {
                    let name;
                    if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                        name = editor.primary.getName(); // prefer shorter names by using primary's name in this case
                    }
                    else {
                        name = editor.getName();
                    }
                    confirmation = await this.fileDialogService.showSaveConfirm([name]);
                }
            }
            // It could be that the editor's choice of confirmation has changed
            // given the check for confirmation is long running, so we check
            // again to see if anything needs to happen before closing for good.
            // This can happen for example if `autoSave: onFocusChange` is configured
            // so that the save happens when the dialog opens.
            // However, we only do this unless a custom confirm handler is installed
            // that may not be fit to be asked a second time right after.
            if (!editor.closeHandler && !this.shouldConfirmClose(editor)) {
                return confirmation === 2 /* ConfirmResult.CANCEL */ ? true : false;
            }
            // Otherwise, handle accordingly
            switch (confirmation) {
                case 0 /* ConfirmResult.SAVE */: {
                    const result = await editor.save(this.id, { reason: saveReason });
                    if (!result && autoSave) {
                        // Save failed and we need to signal this back to the user, so
                        // we handle the dirty editor again but this time ensuring to
                        // show the confirm dialog
                        // (see https://github.com/microsoft/vscode/issues/108752)
                        return this.doHandleCloseConfirmation(editor, { skipAutoSave: true });
                    }
                    return editor.isDirty(); // veto if still dirty
                }
                case 1 /* ConfirmResult.DONT_SAVE */:
                    try {
                        // first try a normal revert where the contents of the editor are restored
                        await editor.revert(this.id);
                        return editor.isDirty(); // veto if still dirty
                    }
                    catch (error) {
                        this.logService.error(error);
                        // if that fails, since we are about to close the editor, we accept that
                        // the editor cannot be reverted and instead do a soft revert that just
                        // enables us to close the editor. With this, a user can always close a
                        // dirty editor even when reverting fails.
                        await editor.revert(this.id, { soft: true });
                        return editor.isDirty(); // veto if still dirty
                    }
                case 2 /* ConfirmResult.CANCEL */:
                    return true; // veto
            }
        }
        shouldConfirmClose(editor) {
            if (editor.closeHandler) {
                return editor.closeHandler.showConfirm(); // custom handling of confirmation on close
            }
            return editor.isDirty() && !editor.isSaving(); // editor must be dirty and not saving
        }
        //#endregion
        //#region closeEditors()
        async closeEditors(args, options) {
            if (this.isEmpty) {
                return true;
            }
            const editors = this.doGetEditorsToClose(args);
            // Check for confirmation and veto
            const veto = await this.handleCloseConfirmation(editors.slice(0));
            if (veto) {
                return false;
            }
            // Do close
            this.doCloseEditors(editors, options);
            return true;
        }
        doGetEditorsToClose(args) {
            if (Array.isArray(args)) {
                return args;
            }
            const filter = args;
            const hasDirection = typeof filter.direction === 'number';
            let editorsToClose = this.model.getEditors(hasDirection ? 1 /* EditorsOrder.SEQUENTIAL */ : 0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, filter); // in MRU order only if direction is not specified
            // Filter: saved or saving only
            if (filter.savedOnly) {
                editorsToClose = editorsToClose.filter(editor => !editor.isDirty() || editor.isSaving());
            }
            // Filter: direction (left / right)
            else if (hasDirection && filter.except) {
                editorsToClose = (filter.direction === 0 /* CloseDirection.LEFT */) ?
                    editorsToClose.slice(0, this.model.indexOf(filter.except, editorsToClose)) :
                    editorsToClose.slice(this.model.indexOf(filter.except, editorsToClose) + 1);
            }
            // Filter: except
            else if (filter.except) {
                editorsToClose = editorsToClose.filter(editor => filter.except && !editor.matches(filter.except));
            }
            return editorsToClose;
        }
        doCloseEditors(editors, options) {
            // Close all inactive editors first
            let closeActiveEditor = false;
            for (const editor of editors) {
                if (!this.isActive(editor)) {
                    this.doCloseInactiveEditor(editor);
                }
                else {
                    closeActiveEditor = true;
                }
            }
            // Close active editor last if contained in editors list to close
            if (closeActiveEditor) {
                this.doCloseActiveEditor(options?.preserveFocus);
            }
            // Forward to title control
            if (editors.length) {
                this.titleControl.closeEditors(editors);
            }
        }
        //#endregion
        //#region closeAllEditors()
        async closeAllEditors(options) {
            if (this.isEmpty) {
                // If the group is empty and the request is to close all editors, we still close
                // the editor group is the related setting to close empty groups is enabled for
                // a convenient way of removing empty editor groups for the user.
                if (this.groupsView.partOptions.closeEmptyGroups) {
                    this.groupsView.removeGroup(this);
                }
                return true;
            }
            // Check for confirmation and veto
            const veto = await this.handleCloseConfirmation(this.model.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, options));
            if (veto) {
                return false;
            }
            // Do close
            this.doCloseAllEditors(options);
            return true;
        }
        doCloseAllEditors(options) {
            // Close all inactive editors first
            const editorsToClose = [];
            for (const editor of this.model.getEditors(1 /* EditorsOrder.SEQUENTIAL */, options)) {
                if (!this.isActive(editor)) {
                    this.doCloseInactiveEditor(editor);
                }
                editorsToClose.push(editor);
            }
            // Close active editor last (unless we skip it, e.g. because it is sticky)
            if (this.activeEditor && editorsToClose.includes(this.activeEditor)) {
                this.doCloseActiveEditor();
            }
            // Forward to title control
            if (editorsToClose.length) {
                this.titleControl.closeEditors(editorsToClose);
            }
        }
        //#endregion
        //#region replaceEditors()
        async replaceEditors(editors) {
            // Extract active vs. inactive replacements
            let activeReplacement;
            const inactiveReplacements = [];
            for (let { editor, replacement, forceReplaceDirty, options } of editors) {
                const index = this.getIndexOfEditor(editor);
                if (index >= 0) {
                    const isActiveEditor = this.isActive(editor);
                    // make sure we respect the index of the editor to replace
                    if (options) {
                        options.index = index;
                    }
                    else {
                        options = { index };
                    }
                    options.inactive = !isActiveEditor;
                    options.pinned = options.pinned ?? true; // unless specified, prefer to pin upon replace
                    const editorToReplace = { editor, replacement, forceReplaceDirty, options };
                    if (isActiveEditor) {
                        activeReplacement = editorToReplace;
                    }
                    else {
                        inactiveReplacements.push(editorToReplace);
                    }
                }
            }
            // Handle inactive first
            for (const { editor, replacement, forceReplaceDirty, options } of inactiveReplacements) {
                // Open inactive editor
                await this.doOpenEditor(replacement, options);
                // Close replaced inactive editor unless they match
                if (!editor.matches(replacement)) {
                    let closed = false;
                    if (forceReplaceDirty) {
                        this.doCloseEditor(editor, true, { context: editor_1.EditorCloseContext.REPLACE });
                        closed = true;
                    }
                    else {
                        closed = await this.doCloseEditorWithConfirmationHandling(editor, { preserveFocus: true }, { context: editor_1.EditorCloseContext.REPLACE });
                    }
                    if (!closed) {
                        return; // canceled
                    }
                }
            }
            // Handle active last
            if (activeReplacement) {
                // Open replacement as active editor
                const openEditorResult = this.doOpenEditor(activeReplacement.replacement, activeReplacement.options);
                // Close replaced active editor unless they match
                if (!activeReplacement.editor.matches(activeReplacement.replacement)) {
                    if (activeReplacement.forceReplaceDirty) {
                        this.doCloseEditor(activeReplacement.editor, true, { context: editor_1.EditorCloseContext.REPLACE });
                    }
                    else {
                        await this.doCloseEditorWithConfirmationHandling(activeReplacement.editor, { preserveFocus: true }, { context: editor_1.EditorCloseContext.REPLACE });
                    }
                }
                await openEditorResult;
            }
        }
        //#endregion
        //#region Locking
        get isLocked() {
            return this.model.isLocked;
        }
        lock(locked) {
            this.model.lock(locked);
        }
        //#endregion
        //#region Editor Actions
        createEditorActions(disposables) {
            const primary = [];
            const secondary = [];
            let onDidChange;
            // Editor actions require the editor control to be there, so we retrieve it via service
            const activeEditorPane = this.activeEditorPane;
            if (activeEditorPane instanceof editorPane_1.EditorPane) {
                const editorScopedContextKeyService = activeEditorPane.scopedContextKeyService ?? this.scopedContextKeyService;
                const editorTitleMenu = disposables.add(this.menuService.createMenu(actions_1.MenuId.EditorTitle, editorScopedContextKeyService, { emitEventsForSubmenuChanges: true, eventDebounceDelay: 0 }));
                onDidChange = editorTitleMenu.onDidChange;
                const shouldInlineGroup = (action, group) => group === 'navigation' && action.actions.length <= 1;
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(editorTitleMenu, { arg: this.resourceContext.get(), shouldForwardArgs: true }, { primary, secondary }, 'navigation', shouldInlineGroup);
            }
            else {
                // If there is no active pane in the group (it's the last group and it's empty)
                // Trigger the change event when the active editor changes
                const _onDidChange = disposables.add(new event_1.Emitter());
                onDidChange = _onDidChange.event;
                disposables.add(this.onDidActiveEditorChange(() => _onDidChange.fire()));
            }
            return { actions: { primary, secondary }, onDidChange };
        }
        //#endregion
        //#region Themable
        updateStyles() {
            const isEmpty = this.isEmpty;
            // Container
            if (isEmpty) {
                this.element.style.backgroundColor = this.getColor(theme_1.EDITOR_GROUP_EMPTY_BACKGROUND) || '';
            }
            else {
                this.element.style.backgroundColor = '';
            }
            // Title control
            const borderColor = this.getColor(theme_1.EDITOR_GROUP_HEADER_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            if (!isEmpty && borderColor) {
                this.titleContainer.classList.add('title-border-bottom');
                this.titleContainer.style.setProperty('--title-border-bottom-color', borderColor);
            }
            else {
                this.titleContainer.classList.remove('title-border-bottom');
                this.titleContainer.style.removeProperty('--title-border-bottom-color');
            }
            const { showTabs } = this.groupsView.partOptions;
            this.titleContainer.style.backgroundColor = this.getColor(showTabs === 'multiple' ? theme_1.EDITOR_GROUP_HEADER_TABS_BACKGROUND : theme_1.EDITOR_GROUP_HEADER_NO_TABS_BACKGROUND) || '';
            // Editor container
            this.editorContainer.style.backgroundColor = this.getColor(colorRegistry_1.editorBackground) || '';
        }
        get minimumWidth() { return this.editorPane.minimumWidth; }
        get minimumHeight() { return this.editorPane.minimumHeight; }
        get maximumWidth() { return this.editorPane.maximumWidth; }
        get maximumHeight() { return this.editorPane.maximumHeight; }
        get proportionalLayout() {
            if (!this.lastLayout) {
                return true;
            }
            return !(this.lastLayout.width === this.minimumWidth || this.lastLayout.height === this.minimumHeight);
        }
        layout(width, height, top, left) {
            this.lastLayout = { width, height, top, left };
            this.element.classList.toggle('max-height-478px', height <= 478);
            // Layout the title control first to receive the size it occupies
            const titleControlSize = this.titleControl.layout({
                container: new dom_1.Dimension(width, height),
                available: new dom_1.Dimension(width, height - this.editorPane.minimumHeight)
            });
            // Update progress bar location
            this.progressBar.getContainer().style.top = `${Math.max(this.titleHeight.offset - 2, 0)}px`;
            // Pass the container width and remaining height to the editor layout
            const editorHeight = Math.max(0, height - titleControlSize.height);
            this.editorContainer.style.height = `${editorHeight}px`;
            this.editorPane.layout({ width, height: editorHeight, top: top + titleControlSize.height, left });
        }
        relayout() {
            if (this.lastLayout) {
                const { width, height, top, left } = this.lastLayout;
                this.layout(width, height, top, left);
            }
        }
        setBoundarySashes(sashes) {
            this.editorPane.setBoundarySashes(sashes);
        }
        toJSON() {
            return this.model.serialize();
        }
        //#endregion
        dispose() {
            this._disposed = true;
            this._onWillDispose.fire();
            super.dispose();
        }
    };
    exports.EditorGroupView = EditorGroupView;
    exports.EditorGroupView = EditorGroupView = EditorGroupView_1 = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, themeService_1.IThemeService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, actions_1.IMenuService),
        __param(11, contextView_1.IContextMenuService),
        __param(12, dialogs_1.IFileDialogService),
        __param(13, editorService_1.IEditorService),
        __param(14, filesConfigurationService_1.IFilesConfigurationService),
        __param(15, uriIdentity_1.IUriIdentityService),
        __param(16, log_1.ILogService),
        __param(17, editorResolverService_1.IEditorResolverService),
        __param(18, host_1.IHostService),
        __param(19, dialogs_1.IDialogService)
    ], EditorGroupView);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yR3JvdXBWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3RHpGLElBQU0sZUFBZSx1QkFBckIsTUFBTSxlQUFnQixTQUFRLHVCQUFRO1FBRTVDLGlCQUFpQjtRQUVqQixNQUFNLENBQUMsU0FBUyxDQUFDLGVBQWlDLEVBQUUsVUFBNkIsRUFBRSxXQUFtQixFQUFFLFVBQWtCLEVBQUUsb0JBQTJDO1lBQ3RLLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlCQUFlLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3pILENBQUM7UUFFRCxNQUFNLENBQUMsb0JBQW9CLENBQUMsVUFBdUMsRUFBRSxlQUFpQyxFQUFFLFVBQTZCLEVBQUUsV0FBbUIsRUFBRSxVQUFrQixFQUFFLG9CQUEyQztZQUMxTixPQUFPLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpQkFBZSxFQUFFLFVBQVUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMvSCxDQUFDO1FBRUQsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUEwQixFQUFFLGVBQWlDLEVBQUUsVUFBNkIsRUFBRSxXQUFtQixFQUFFLFVBQWtCLEVBQUUsb0JBQTJDO1lBQ25NLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlCQUFlLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzdILENBQUM7UUFrRUQsWUFDQyxJQUEyRCxFQUMxQyxlQUFp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