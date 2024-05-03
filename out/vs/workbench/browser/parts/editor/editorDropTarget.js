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
define(["require", "exports", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/formattedTextRenderer", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/platform/dnd/browser/dnd", "vs/workbench/browser/dnd", "vs/workbench/browser/parts/editor/editor", "vs/workbench/common/theme", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/treeViewsDndService", "vs/editor/common/services/treeViewsDnd", "vs/css!./media/editordroptarget"], function (require, exports, dnd_1, dom_1, formattedTextRenderer_1, async_1, lifecycle_1, platform_1, types_1, nls_1, configuration_1, instantiation_1, platform_2, colorRegistry_1, themeService_1, workspace_1, dnd_2, dnd_3, editor_1, theme_1, editorGroupsService_1, editorService_1, treeViewsDndService_1, treeViewsDnd_1) {
    "use strict";
    var DropOverlay_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorDropTarget = void 0;
    function isDropIntoEditorEnabledGlobally(configurationService) {
        return configurationService.getValue('editor.dropIntoEditor.enabled');
    }
    function isDragIntoEditorEvent(e) {
        return e.shiftKey;
    }
    let DropOverlay = class DropOverlay extends themeService_1.Themable {
        static { DropOverlay_1 = this; }
        static { this.OVERLAY_ID = 'monaco-workbench-editor-drop-overlay'; }
        get disposed() { return !!this._disposed; }
        constructor(groupView, themeService, configurationService, instantiationService, editorService, editorGroupService, treeViewsDragAndDropService, contextService) {
            super(themeService);
            this.groupView = groupView;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.treeViewsDragAndDropService = treeViewsDragAndDropService;
            this.contextService = contextService;
            this.editorTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.groupTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.treeItemsTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.cleanupOverlayScheduler = this._register(new async_1.RunOnceScheduler(() => this.dispose(), 300));
            this.enableDropIntoEditor = isDropIntoEditorEnabledGlobally(this.configurationService) && this.isDropIntoActiveEditorEnabled();
            this.create();
        }
        create() {
            const overlayOffsetHeight = this.getOverlayOffsetHeight();
            // Container
            const container = this.container = document.createElement('div');
            container.id = DropOverlay_1.OVERLAY_ID;
            container.style.top = `${overlayOffsetHeight}px`;
            // Parent
            this.groupView.element.appendChild(container);
            this.groupView.element.classList.add('dragged-over');
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.groupView.element.removeChild(container);
                this.groupView.element.classList.remove('dragged-over');
            }));
            // Overlay
            this.overlay = document.createElement('div');
            this.overlay.classList.add('editor-group-overlay-indicator');
            container.appendChild(this.overlay);
            if (this.enableDropIntoEditor) {
                this.dropIntoPromptElement = (0, formattedTextRenderer_1.renderFormattedText)((0, nls_1.localize)('dropIntoEditorPrompt', "Hold __{0}__ to drop into editor", platform_1.isMacintosh ? '⇧' : 'Shift'), {});
                this.dropIntoPromptElement.classList.add('editor-group-overlay-drop-into-prompt');
                this.overlay.appendChild(this.dropIntoPromptElement);
            }
            // Overlay Event Handling
            this.registerListeners(container);
            // Styles
            this.updateStyles();
        }
        updateStyles() {
            const overlay = (0, types_1.assertIsDefined)(this.overlay);
            // Overlay drop background
            overlay.style.backgroundColor = this.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND) || '';
            // Overlay contrast border (if any)
            const activeContrastBorderColor = this.getColor(colorRegistry_1.activeContrastBorder);
            overlay.style.outlineColor = activeContrastBorderColor || '';
            overlay.style.outlineOffset = activeContrastBorderColor ? '-2px' : '';
            overlay.style.outlineStyle = activeContrastBorderColor ? 'dashed' : '';
            overlay.style.outlineWidth = activeContrastBorderColor ? '2px' : '';
            if (this.dropIntoPromptElement) {
                this.dropIntoPromptElement.style.backgroundColor = this.getColor(theme_1.EDITOR_DROP_INTO_PROMPT_BACKGROUND) ?? '';
                this.dropIntoPromptElement.style.color = this.getColor(theme_1.EDITOR_DROP_INTO_PROMPT_FOREGROUND) ?? '';
                const borderColor = this.getColor(theme_1.EDITOR_DROP_INTO_PROMPT_BORDER);
                if (borderColor) {
                    this.dropIntoPromptElement.style.borderWidth = '1px';
                    this.dropIntoPromptElement.style.borderStyle = 'solid';
                    this.dropIntoPromptElement.style.borderColor = borderColor;
                }
                else {
                    this.dropIntoPromptElement.style.borderWidth = '0';
                }
            }
        }
        registerListeners(container) {
            this._register(new dom_1.DragAndDropObserver(container, {
                onDragOver: e => {
                    if (this.enableDropIntoEditor && isDragIntoEditorEvent(e)) {
                        this.dispose();
                        return;
                    }
                    const isDraggingGroup = this.groupTransfer.hasData(dnd_3.DraggedEditorGroupIdentifier.prototype);
                    const isDraggingEditor = this.editorTransfer.hasData(dnd_3.DraggedEditorIdentifier.prototype);
                    // Update the dropEffect to "copy" if there is no local data to be dragged because
                    // in that case we can only copy the data into and not move it from its source
                    if (!isDraggingEditor && !isDraggingGroup && e.dataTransfer) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                    // Find out if operation is valid
                    let isCopy = true;
                    if (isDraggingGroup) {
                        isCopy = this.isCopyOperation(e);
                    }
                    else if (isDraggingEditor) {
                        const data = this.editorTransfer.getData(dnd_3.DraggedEditorIdentifier.prototype);
                        if (Array.isArray(data)) {
                            isCopy = this.isCopyOperation(e, data[0].identifier);
                        }
                    }
                    if (!isCopy) {
                        const sourceGroupView = this.findSourceGroupView();
                        if (sourceGroupView === this.groupView) {
                            if (isDraggingGroup || (isDraggingEditor && sourceGroupView.count < 2)) {
                                this.hideOverlay();
                                return; // do not allow to drop group/editor on itself if this results in an empty group
                            }
                        }
                    }
                    // Position overlay and conditionally enable or disable
                    // editor group splitting support based on setting and
                    // keymodifiers used.
                    let splitOnDragAndDrop = !!this.editorGroupService.partOptions.splitOnDragAndDrop;
                    if (this.isToggleSplitOperation(e)) {
                        splitOnDragAndDrop = !splitOnDragAndDrop;
                    }
                    this.positionOverlay(e.offsetX, e.offsetY, isDraggingGroup, splitOnDragAndDrop);
                    // Make sure to stop any running cleanup scheduler to remove the overlay
                    if (this.cleanupOverlayScheduler.isScheduled()) {
                        this.cleanupOverlayScheduler.cancel();
                    }
                },
                onDragLeave: e => this.dispose(),
                onDragEnd: e => this.dispose(),
                onDrop: e => {
                    dom_1.EventHelper.stop(e, true);
                    // Dispose overlay
                    this.dispose();
                    // Handle drop if we have a valid operation
                    if (this.currentDropOperation) {
                        this.handleDrop(e, this.currentDropOperation.splitDirection);
                    }
                }
            }));
            this._register((0, dom_1.addDisposableListener)(container, dom_1.EventType.MOUSE_OVER, () => {
                // Under some circumstances we have seen reports where the drop overlay is not being
                // cleaned up and as such the editor area remains under the overlay so that you cannot
                // type into the editor anymore. This seems related to using VMs and DND via host and
                // guest OS, though some users also saw it without VMs.
                // To protect against this issue we always destroy the overlay as soon as we detect a
                // mouse event over it. The delay is used to guarantee we are not interfering with the
                // actual DROP event that can also trigger a mouse over event.
                if (!this.cleanupOverlayScheduler.isScheduled()) {
                    this.cleanupOverlayScheduler.schedule();
                }
            }));
        }
        isDropIntoActiveEditorEnabled() {
            return !!this.groupView.activeEditor?.hasCapability(128 /* EditorInputCapabilities.CanDropIntoEditor */);
        }
        findSourceGroupView() {
            // Check for group transfer
            if (this.groupTransfer.hasData(dnd_3.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_3.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    return this.editorGroupService.getGroup(data[0].identifier);
                }
            }
            // Check for editor transfer
            else if (this.editorTransfer.hasData(dnd_3.DraggedEditorIdentifier.prototype)) {
                const data = this.editorTransfer.getData(dnd_3.DraggedEditorIdentifier.prototype);
                if (Array.isArray(data)) {
                    return this.editorGroupService.getGroup(data[0].identifier.groupId);
                }
            }
            return undefined;
        }
        async handleDrop(event, splitDirection) {
            // Determine target group
            const ensureTargetGroup = () => {
                let targetGroup;
                if (typeof splitDirection === 'number') {
                    targetGroup = this.editorGroupService.addGroup(this.groupView, splitDirection);
                }
                else {
                    targetGroup = this.groupView;
                }
                return targetGroup;
            };
            // Check for group transfer
            if (this.groupTransfer.hasData(dnd_3.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_3.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    const sourceGroup = this.editorGroupService.getGroup(data[0].identifier);
                    if (sourceGroup) {
                        if (typeof splitDirection !== 'number' && sourceGroup === this.groupView) {
                            return;
                        }
                        // Split to new group
                        let targetGroup;
                        if (typeof splitDirection === 'number') {
                            if (this.isCopyOperation(event)) {
                                targetGroup = this.editorGroupService.copyGroup(sourceGroup, this.groupView, splitDirection);
                            }
                            else {
                                targetGroup = this.editorGroupService.moveGroup(sourceGroup, this.groupView, splitDirection);
                            }
                        }
                        // Merge into existing group
                        else {
                            let mergeGroupOptions = undefined;
                            if (this.isCopyOperation(event)) {
                                mergeGroupOptions = { mode: 0 /* MergeGroupMode.COPY_EDITORS */ };
                            }
                            this.editorGroupService.mergeGroup(sourceGroup, this.groupView, mergeGroupOptions);
                        }
                        if (targetGroup) {
                            this.editorGroupService.activateGroup(targetGroup);
                        }
                    }
                    this.groupTransfer.clearData(dnd_3.DraggedEditorGroupIdentifier.prototype);
                }
            }
            // Check for editor transfer
            else if (this.editorTransfer.hasData(dnd_3.DraggedEditorIdentifier.prototype)) {
                const data = this.editorTransfer.getData(dnd_3.DraggedEditorIdentifier.prototype);
                if (Array.isArray(data)) {
                    const draggedEditor = data[0].identifier;
                    const sourceGroup = this.editorGroupService.getGroup(draggedEditor.groupId);
                    if (sourceGroup) {
                        const copyEditor = this.isCopyOperation(event, draggedEditor);
                        let targetGroup = undefined;
                        // Optimization: if we move the last editor of an editor group
                        // and we are configured to close empty editor groups, we can
                        // rather move the entire editor group according to the direction
                        if (this.editorGroupService.partOptions.closeEmptyGroups && sourceGroup.count === 1 && typeof splitDirection === 'number' && !copyEditor) {
                            targetGroup = this.editorGroupService.moveGroup(sourceGroup, this.groupView, splitDirection);
                        }
                        // In any other case do a normal move/copy operation
                        else {
                            targetGroup = ensureTargetGroup();
                            if (sourceGroup === targetGroup) {
                                return;
                            }
                            // Open in target group
                            const options = (0, editor_1.fillActiveEditorViewState)(sourceGroup, draggedEditor.editor, {
                                pinned: true, // always pin dropped editor
                                sticky: sourceGroup.isSticky(draggedEditor.editor), // preserve sticky state
                            });
                            if (!copyEditor) {
                                sourceGroup.moveEditor(draggedEditor.editor, targetGroup, options);
                            }
                            else {
                                sourceGroup.copyEditor(draggedEditor.editor, targetGroup, options);
                            }
                        }
                        // Ensure target has focus
                        targetGroup.focus();
                    }
                    this.editorTransfer.clearData(dnd_3.DraggedEditorIdentifier.prototype);
                }
            }
            // Check for tree items
            else if (this.treeItemsTransfer.hasData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype)) {
                const data = this.treeItemsTransfer.getData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype);
                if (Array.isArray(data)) {
                    const editors = [];
                    for (const id of data) {
                        const dataTransferItem = await this.treeViewsDragAndDropService.removeDragOperationTransfer(id.identifier);
                        if (dataTransferItem) {
                            const treeDropData = await (0, dnd_3.extractTreeDropData)(dataTransferItem);
                            editors.push(...treeDropData.map(editor => ({ ...editor, options: { ...editor.options, pinned: true } })));
                        }
                    }
                    if (editors.length) {
                        this.editorService.openEditors(editors, ensureTargetGroup(), { validateTrust: true });
                    }
                }
                this.treeItemsTransfer.clearData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype);
            }
            // Check for URI transfer
            else {
                const dropHandler = this.instantiationService.createInstance(dnd_3.ResourcesDropHandler, { allowWorkspaceOpen: !platform_1.isWeb || (0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace()) });
                dropHandler.handleDrop(event, (0, dom_1.getWindow)(this.groupView.element), () => ensureTargetGroup(), targetGroup => targetGroup?.focus());
            }
        }
        isCopyOperation(e, draggedEditor) {
            if (draggedEditor?.editor.hasCapability(8 /* EditorInputCapabilities.Singleton */)) {
                return false; // Singleton editors cannot be split
            }
            return (e.ctrlKey && !platform_1.isMacintosh) || (e.altKey && platform_1.isMacintosh);
        }
        isToggleSplitOperation(e) {
            return (e.altKey && !platform_1.isMacintosh) || (e.shiftKey && platform_1.isMacintosh);
        }
        positionOverlay(mousePosX, mousePosY, isDraggingGroup, enableSplitting) {
            const preferSplitVertically = this.editorGroupService.partOptions.openSideBySideDirection === 'right';
            const editorControlWidth = this.groupView.element.clientWidth;
            const editorControlHeight = this.groupView.element.clientHeight - this.getOverlayOffsetHeight();
            let edgeWidthThresholdFactor;
            let edgeHeightThresholdFactor;
            if (enableSplitting) {
                if (isDraggingGroup) {
                    edgeWidthThresholdFactor = preferSplitVertically ? 0.3 : 0.1; // give larger threshold when dragging group depending on preferred split direction
                }
                else {
                    edgeWidthThresholdFactor = 0.1; // 10% threshold to split if dragging editors
                }
                if (isDraggingGroup) {
                    edgeHeightThresholdFactor = preferSplitVertically ? 0.1 : 0.3; // give larger threshold when dragging group depending on preferred split direction
                }
                else {
                    edgeHeightThresholdFactor = 0.1; // 10% threshold to split if dragging editors
                }
            }
            else {
                edgeWidthThresholdFactor = 0;
                edgeHeightThresholdFactor = 0;
            }
            const edgeWidthThreshold = editorControlWidth * edgeWidthThresholdFactor;
            const edgeHeightThreshold = editorControlHeight * edgeHeightThresholdFactor;
            const splitWidthThreshold = editorControlWidth / 3; // offer to split left/right at 33%
            const splitHeightThreshold = editorControlHeight / 3; // offer to split up/down at 33%
            // No split if mouse is above certain threshold in the center of the view
            let splitDirection;
            if (mousePosX > edgeWidthThreshold && mousePosX < editorControlWidth - edgeWidthThreshold &&
                mousePosY > edgeHeightThreshold && mousePosY < editorControlHeight - edgeHeightThreshold) {
                splitDirection = undefined;
            }
            // Offer to split otherwise
            else {
                // User prefers to split vertically: offer a larger hitzone
                // for this direction like so:
                // ----------------------------------------------
                // |		|		SPLIT UP		|			|
                // | SPLIT 	|-----------------------|	SPLIT	|
                // |		|		  MERGE			|			|
                // | LEFT	|-----------------------|	RIGHT	|
                // |		|		SPLIT DOWN		|			|
                // ----------------------------------------------
                if (preferSplitVertically) {
                    if (mousePosX < splitWidthThreshold) {
                        splitDirection = 2 /* GroupDirection.LEFT */;
                    }
                    else if (mousePosX > splitWidthThreshold * 2) {
                        splitDirection = 3 /* GroupDirection.RIGHT */;
                    }
                    else if (mousePosY < editorControlHeight / 2) {
                        splitDirection = 0 /* GroupDirection.UP */;
                    }
                    else {
                        splitDirection = 1 /* GroupDirection.DOWN */;
                    }
                }
                // User prefers to split horizontally: offer a larger hitzone
                // for this direction like so:
                // ----------------------------------------------
                // |				SPLIT UP					|
                // |--------------------------------------------|
                // |  SPLIT LEFT  |	   MERGE	|  SPLIT RIGHT  |
                // |--------------------------------------------|
                // |				SPLIT DOWN					|
                // ----------------------------------------------
                else {
                    if (mousePosY < splitHeightThreshold) {
                        splitDirection = 0 /* GroupDirection.UP */;
                    }
                    else if (mousePosY > splitHeightThreshold * 2) {
                        splitDirection = 1 /* GroupDirection.DOWN */;
                    }
                    else if (mousePosX < editorControlWidth / 2) {
                        splitDirection = 2 /* GroupDirection.LEFT */;
                    }
                    else {
                        splitDirection = 3 /* GroupDirection.RIGHT */;
                    }
                }
            }
            // Draw overlay based on split direction
            switch (splitDirection) {
                case 0 /* GroupDirection.UP */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '50%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                case 1 /* GroupDirection.DOWN */:
                    this.doPositionOverlay({ top: '50%', left: '0', width: '100%', height: '50%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                case 2 /* GroupDirection.LEFT */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '50%', height: '100%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                case 3 /* GroupDirection.RIGHT */:
                    this.doPositionOverlay({ top: '0', left: '50%', width: '50%', height: '100%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                default:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '100%' });
                    this.toggleDropIntoPrompt(true);
            }
            // Make sure the overlay is visible now
            const overlay = (0, types_1.assertIsDefined)(this.overlay);
            overlay.style.opacity = '1';
            // Enable transition after a timeout to prevent initial animation
            setTimeout(() => overlay.classList.add('overlay-move-transition'), 0);
            // Remember as current split direction
            this.currentDropOperation = { splitDirection };
        }
        doPositionOverlay(options) {
            const [container, overlay] = (0, types_1.assertAllDefined)(this.container, this.overlay);
            // Container
            const offsetHeight = this.getOverlayOffsetHeight();
            if (offsetHeight) {
                container.style.height = `calc(100% - ${offsetHeight}px)`;
            }
            else {
                container.style.height = '100%';
            }
            // Overlay
            overlay.style.top = options.top;
            overlay.style.left = options.left;
            overlay.style.width = options.width;
            overlay.style.height = options.height;
        }
        getOverlayOffsetHeight() {
            // With tabs and opened editors: use the area below tabs as drop target
            if (!this.groupView.isEmpty && this.editorGroupService.partOptions.showTabs === 'multiple') {
                return this.groupView.titleHeight.offset;
            }
            // Without tabs or empty group: use entire editor area as drop target
            return 0;
        }
        hideOverlay() {
            const overlay = (0, types_1.assertIsDefined)(this.overlay);
            // Reset overlay
            this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '100%' });
            overlay.style.opacity = '0';
            overlay.classList.remove('overlay-move-transition');
            // Reset current operation
            this.currentDropOperation = undefined;
        }
        toggleDropIntoPrompt(showing) {
            if (!this.dropIntoPromptElement) {
                return;
            }
            this.dropIntoPromptElement.style.opacity = showing ? '1' : '0';
        }
        contains(element) {
            return element === this.container || element === this.overlay;
        }
        dispose() {
            super.dispose();
            this._disposed = true;
        }
    };
    DropOverlay = DropOverlay_1 = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, treeViewsDndService_1.ITreeViewsDnDService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], DropOverlay);
    let EditorDropTarget = class EditorDropTarget extends themeService_1.Themable {
        constructor(container, delegate, editorGroupService, themeService, configurationService, instantiationService) {
            super(themeService);
            this.container = container;
            this.delegate = delegate;
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.counter = 0;
            this.editorTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.groupTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.registerListeners();
        }
        get overlay() {
            if (this._overlay && !this._overlay.disposed) {
                return this._overlay;
            }
            return undefined;
        }
        registerListeners() {
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.DRAG_ENTER, e => this.onDragEnter(e)));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.DRAG_LEAVE, () => this.onDragLeave()));
            for (const target of [this.container, (0, dom_1.getWindow)(this.container)]) {
                this._register((0, dom_1.addDisposableListener)(target, dom_1.EventType.DRAG_END, () => this.onDragEnd()));
            }
        }
        onDragEnter(event) {
            if (isDropIntoEditorEnabledGlobally(this.configurationService) && isDragIntoEditorEvent(event)) {
                return;
            }
            this.counter++;
            // Validate transfer
            if (!this.editorTransfer.hasData(dnd_3.DraggedEditorIdentifier.prototype) &&
                !this.groupTransfer.hasData(dnd_3.DraggedEditorGroupIdentifier.prototype) &&
                event.dataTransfer) {
                const dndContributions = platform_2.Registry.as(dnd_2.Extensions.DragAndDropContribution).getAll();
                const dndContributionKeys = Array.from(dndContributions).map(e => e.dataFormatKey);
                if (!(0, dnd_2.containsDragType)(event, dnd_1.DataTransfers.FILES, dnd_2.CodeDataTransfers.FILES, dnd_1.DataTransfers.RESOURCES, dnd_2.CodeDataTransfers.EDITORS, ...dndContributionKeys)) { // see https://github.com/microsoft/vscode/issues/25789
                    event.dataTransfer.dropEffect = 'none';
                    return; // unsupported transfer
                }
            }
            // Signal DND start
            this.updateContainer(true);
            const target = event.target;
            if (target) {
                // Somehow we managed to move the mouse quickly out of the current overlay, so destroy it
                if (this.overlay && !this.overlay.contains(target)) {
                    this.disposeOverlay();
                }
                // Create overlay over target
                if (!this.overlay) {
                    const targetGroupView = this.findTargetGroupView(target);
                    if (targetGroupView) {
                        this._overlay = this.instantiationService.createInstance(DropOverlay, targetGroupView);
                    }
                }
            }
        }
        onDragLeave() {
            this.counter--;
            if (this.counter === 0) {
                this.updateContainer(false);
            }
        }
        onDragEnd() {
            this.counter = 0;
            this.updateContainer(false);
            this.disposeOverlay();
        }
        findTargetGroupView(child) {
            const groups = this.editorGroupService.groups;
            return groups.find(groupView => (0, dom_1.isAncestor)(child, groupView.element) || this.delegate.containsGroup?.(groupView));
        }
        updateContainer(isDraggedOver) {
            this.container.classList.toggle('dragged-over', isDraggedOver);
        }
        dispose() {
            super.dispose();
            this.disposeOverlay();
        }
        disposeOverlay() {
            if (this.overlay) {
                this.overlay.dispose();
                this._overlay = undefined;
            }
        }
    };
    exports.EditorDropTarget = EditorDropTarget;
    exports.EditorDropTarget = EditorDropTarget = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService)
    ], EditorDropTarget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRHJvcFRhcmdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvckRyb3BUYXJnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQStCaEcsU0FBUywrQkFBK0IsQ0FBQyxvQkFBMkM7UUFDbkYsT0FBTyxvQkFBb0IsQ0FBQyxRQUFRLENBQVUsK0JBQStCLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBRUQsU0FBUyxxQkFBcUIsQ0FBQyxDQUFZO1FBQzFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQztJQUNuQixDQUFDO0lBRUQsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLHVCQUFROztpQkFFVCxlQUFVLEdBQUcsc0NBQXNDLEFBQXpDLENBQTBDO1FBUzVFLElBQUksUUFBUSxLQUFjLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBVXBELFlBQ2tCLFNBQTJCLEVBQzdCLFlBQTJCLEVBQ25CLG9CQUE0RCxFQUM1RCxvQkFBNEQsRUFDbkUsYUFBOEMsRUFDeEMsa0JBQXlELEVBQ3pELDJCQUFrRSxFQUM5RCxjQUF5RDtZQUVuRixLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFUSCxjQUFTLEdBQVQsU0FBUyxDQUFrQjtZQUVKLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNsRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDdkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFzQjtZQUN4QyxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQXNCO1lBQzdDLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQWRuRSxtQkFBYyxHQUFHLDRCQUFzQixDQUFDLFdBQVcsRUFBMkIsQ0FBQztZQUMvRSxrQkFBYSxHQUFHLDRCQUFzQixDQUFDLFdBQVcsRUFBZ0MsQ0FBQztZQUNuRixzQkFBaUIsR0FBRyw0QkFBc0IsQ0FBQyxXQUFXLEVBQThCLENBQUM7WUFnQnJHLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFL0YsSUFBSSxDQUFDLG9CQUFvQixHQUFHLCtCQUErQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1lBRS9ILElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFTyxNQUFNO1lBQ2IsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUUxRCxZQUFZO1lBQ1osTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pFLFNBQVMsQ0FBQyxFQUFFLEdBQUcsYUFBVyxDQUFDLFVBQVUsQ0FBQztZQUN0QyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLG1CQUFtQixJQUFJLENBQUM7WUFFakQsU0FBUztZQUNULElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3pELENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixVQUFVO1lBQ1YsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQzdELFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXBDLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFBLDJDQUFtQixFQUFDLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLGtDQUFrQyxFQUFFLHNCQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3hKLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7Z0JBQ2xGLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3RELENBQUM7WUFFRCx5QkFBeUI7WUFDekIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRWxDLFNBQVM7WUFDVCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUVRLFlBQVk7WUFDcEIsTUFBTSxPQUFPLEdBQUcsSUFBQSx1QkFBZSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU5QywwQkFBMEI7WUFDMUIsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyx1Q0FBK0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUVyRixtQ0FBbUM7WUFDbkMsTUFBTSx5QkFBeUIsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLG9DQUFvQixDQUFDLENBQUM7WUFDdEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcseUJBQXlCLElBQUksRUFBRSxDQUFDO1lBQzdELE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUN0RSxPQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksR0FBRyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDdkUsT0FBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcseUJBQXlCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBRXBFLElBQUksSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsMENBQWtDLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzNHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsMENBQWtDLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRWpHLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsc0NBQThCLENBQUMsQ0FBQztnQkFDbEUsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDakIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO29CQUNyRCxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUM7b0JBQ3ZELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztnQkFDNUQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQztnQkFDcEQsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8saUJBQWlCLENBQUMsU0FBc0I7WUFDL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFtQixDQUFDLFNBQVMsRUFBRTtnQkFDakQsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFO29CQUNmLElBQUksSUFBSSxDQUFDLG9CQUFvQixJQUFJLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQzNELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDZixPQUFPO29CQUNSLENBQUM7b0JBRUQsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsa0NBQTRCLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQzNGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsNkJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBRXhGLGtGQUFrRjtvQkFDbEYsOEVBQThFO29CQUM5RSxJQUFJLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxlQUFlLElBQUksQ0FBQyxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUM3RCxDQUFDLENBQUMsWUFBWSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUM7b0JBQ3BDLENBQUM7b0JBRUQsaUNBQWlDO29CQUNqQyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7b0JBQ2xCLElBQUksZUFBZSxFQUFFLENBQUM7d0JBQ3JCLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxDQUFDO3lCQUFNLElBQUksZ0JBQWdCLEVBQUUsQ0FBQzt3QkFDN0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsNkJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7d0JBQzVFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDOzRCQUN6QixNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUN0RCxDQUFDO29CQUNGLENBQUM7b0JBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNiLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO3dCQUNuRCxJQUFJLGVBQWUsS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7NEJBQ3hDLElBQUksZUFBZSxJQUFJLENBQUMsZ0JBQWdCLElBQUksZUFBZSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO2dDQUN4RSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0NBQ25CLE9BQU8sQ0FBQyxnRkFBZ0Y7NEJBQ3pGLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO29CQUVELHVEQUF1RDtvQkFDdkQsc0RBQXNEO29CQUN0RCxxQkFBcUI7b0JBQ3JCLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUM7b0JBQ2xGLElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ3BDLGtCQUFrQixHQUFHLENBQUMsa0JBQWtCLENBQUM7b0JBQzFDLENBQUM7b0JBQ0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUM7b0JBRWhGLHdFQUF3RTtvQkFDeEUsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQzt3QkFDaEQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUN2QyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFFOUIsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFO29CQUNYLGlCQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFFMUIsa0JBQWtCO29CQUNsQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBRWYsMkNBQTJDO29CQUMzQyxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO3dCQUMvQixJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQzlELENBQUM7Z0JBQ0YsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLFNBQVMsRUFBRSxlQUFTLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtnQkFDMUUsb0ZBQW9GO2dCQUNwRixzRkFBc0Y7Z0JBQ3RGLHFGQUFxRjtnQkFDckYsdURBQXVEO2dCQUN2RCxxRkFBcUY7Z0JBQ3JGLHNGQUFzRjtnQkFDdEYsOERBQThEO2dCQUM5RCxJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7b0JBQ2pELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDekMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sNkJBQTZCO1lBQ3BDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLGFBQWEscURBQTJDLENBQUM7UUFDaEcsQ0FBQztRQUVPLG1CQUFtQjtZQUUxQiwyQkFBMkI7WUFDM0IsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxrQ0FBNEIsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUN4RSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxrQ0FBNEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDaEYsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3pCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzdELENBQUM7WUFDRixDQUFDO1lBRUQsNEJBQTRCO2lCQUN2QixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLDZCQUF1QixDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLDZCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM1RSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDekIsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3JFLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBZ0IsRUFBRSxjQUErQjtZQUV6RSx5QkFBeUI7WUFDekIsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLEVBQUU7Z0JBQzlCLElBQUksV0FBeUIsQ0FBQztnQkFDOUIsSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDeEMsV0FBVyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDaEYsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUM5QixDQUFDO2dCQUVELE9BQU8sV0FBVyxDQUFDO1lBQ3BCLENBQUMsQ0FBQztZQUVGLDJCQUEyQjtZQUMzQixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLGtDQUE0QixDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLGtDQUE0QixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNoRixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDekIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ3pFLElBQUksV0FBVyxFQUFFLENBQUM7d0JBQ2pCLElBQUksT0FBTyxjQUFjLEtBQUssUUFBUSxJQUFJLFdBQVcsS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7NEJBQzFFLE9BQU87d0JBQ1IsQ0FBQzt3QkFFRCxxQkFBcUI7d0JBQ3JCLElBQUksV0FBcUMsQ0FBQzt3QkFDMUMsSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLEVBQUUsQ0FBQzs0QkFDeEMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0NBQ2pDLFdBQVcsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDOzRCQUM5RixDQUFDO2lDQUFNLENBQUM7Z0NBQ1AsV0FBVyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUM7NEJBQzlGLENBQUM7d0JBQ0YsQ0FBQzt3QkFFRCw0QkFBNEI7NkJBQ3ZCLENBQUM7NEJBQ0wsSUFBSSxpQkFBaUIsR0FBbUMsU0FBUyxDQUFDOzRCQUNsRSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQ0FDakMsaUJBQWlCLEdBQUcsRUFBRSxJQUFJLHFDQUE2QixFQUFFLENBQUM7NEJBQzNELENBQUM7NEJBRUQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO3dCQUNwRixDQUFDO3dCQUVELElBQUksV0FBVyxFQUFFLENBQUM7NEJBQ2pCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7d0JBQ3BELENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxrQ0FBNEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdEUsQ0FBQztZQUNGLENBQUM7WUFFRCw0QkFBNEI7aUJBQ3ZCLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsNkJBQXVCLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDekUsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsNkJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzVFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN6QixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO29CQUV6QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDNUUsSUFBSSxXQUFXLEVBQUUsQ0FBQzt3QkFDakIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7d0JBQzlELElBQUksV0FBVyxHQUE2QixTQUFTLENBQUM7d0JBRXRELDhEQUE4RDt3QkFDOUQsNkRBQTZEO3dCQUM3RCxpRUFBaUU7d0JBQ2pFLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsSUFBSSxXQUFXLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs0QkFDMUksV0FBVyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUM7d0JBQzlGLENBQUM7d0JBRUQsb0RBQW9EOzZCQUMvQyxDQUFDOzRCQUNMLFdBQVcsR0FBRyxpQkFBaUIsRUFBRSxDQUFDOzRCQUNsQyxJQUFJLFdBQVcsS0FBSyxXQUFXLEVBQUUsQ0FBQztnQ0FDakMsT0FBTzs0QkFDUixDQUFDOzRCQUVELHVCQUF1Qjs0QkFDdkIsTUFBTSxPQUFPLEdBQUcsSUFBQSxrQ0FBeUIsRUFBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLE1BQU0sRUFBRTtnQ0FDNUUsTUFBTSxFQUFFLElBQUksRUFBVyw0QkFBNEI7Z0NBQ25ELE1BQU0sRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRSx3QkFBd0I7NkJBQzVFLENBQUMsQ0FBQzs0QkFFSCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0NBQ2pCLFdBQVcsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7NEJBQ3BFLENBQUM7aUNBQU0sQ0FBQztnQ0FDUCxXQUFXLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDOzRCQUNwRSxDQUFDO3dCQUNGLENBQUM7d0JBRUQsMEJBQTBCO3dCQUMxQixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3JCLENBQUM7b0JBRUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsNkJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2xFLENBQUM7WUFDRixDQUFDO1lBRUQsdUJBQXVCO2lCQUNsQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMseUNBQTBCLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDL0UsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyx5Q0FBMEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbEYsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3pCLE1BQU0sT0FBTyxHQUEwQixFQUFFLENBQUM7b0JBQzFDLEtBQUssTUFBTSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUM7d0JBQ3ZCLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxJQUFJLENBQUMsMkJBQTJCLENBQUMsMkJBQTJCLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUMzRyxJQUFJLGdCQUFnQixFQUFFLENBQUM7NEJBQ3RCLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBQSx5QkFBbUIsRUFBQyxnQkFBZ0IsQ0FBQyxDQUFDOzRCQUNqRSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRSxHQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzVHLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDcEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFDdkYsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMseUNBQTBCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDeEUsQ0FBQztZQUVELHlCQUF5QjtpQkFDcEIsQ0FBQztnQkFDTCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDBCQUFvQixFQUFFLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxnQkFBSyxJQUFJLElBQUEsZ0NBQW9CLEVBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDL0ssV0FBVyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDbEksQ0FBQztRQUNGLENBQUM7UUFFTyxlQUFlLENBQUMsQ0FBWSxFQUFFLGFBQWlDO1lBQ3RFLElBQUksYUFBYSxFQUFFLE1BQU0sQ0FBQyxhQUFhLDJDQUFtQyxFQUFFLENBQUM7Z0JBQzVFLE9BQU8sS0FBSyxDQUFDLENBQUMsb0NBQW9DO1lBQ25ELENBQUM7WUFFRCxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLHNCQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksc0JBQVcsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFTyxzQkFBc0IsQ0FBQyxDQUFZO1lBQzFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsc0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxzQkFBVyxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVPLGVBQWUsQ0FBQyxTQUFpQixFQUFFLFNBQWlCLEVBQUUsZUFBd0IsRUFBRSxlQUF3QjtZQUMvRyxNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsdUJBQXVCLEtBQUssT0FBTyxDQUFDO1lBRXRHLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO1lBQzlELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBRWhHLElBQUksd0JBQWdDLENBQUM7WUFDckMsSUFBSSx5QkFBaUMsQ0FBQztZQUN0QyxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNyQixJQUFJLGVBQWUsRUFBRSxDQUFDO29CQUNyQix3QkFBd0IsR0FBRyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxtRkFBbUY7Z0JBQ2xKLENBQUM7cUJBQU0sQ0FBQztvQkFDUCx3QkFBd0IsR0FBRyxHQUFHLENBQUMsQ0FBQyw2Q0FBNkM7Z0JBQzlFLENBQUM7Z0JBRUQsSUFBSSxlQUFlLEVBQUUsQ0FBQztvQkFDckIseUJBQXlCLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsbUZBQW1GO2dCQUNuSixDQUFDO3FCQUFNLENBQUM7b0JBQ1AseUJBQXlCLEdBQUcsR0FBRyxDQUFDLENBQUMsNkNBQTZDO2dCQUMvRSxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLHdCQUF3QixHQUFHLENBQUMsQ0FBQztnQkFDN0IseUJBQXlCLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFFRCxNQUFNLGtCQUFrQixHQUFHLGtCQUFrQixHQUFHLHdCQUF3QixDQUFDO1lBQ3pFLE1BQU0sbUJBQW1CLEdBQUcsbUJBQW1CLEdBQUcseUJBQXlCLENBQUM7WUFFNUUsTUFBTSxtQkFBbUIsR0FBRyxrQkFBa0IsR0FBRyxDQUFDLENBQUMsQ0FBRSxtQ0FBbUM7WUFDeEYsTUFBTSxvQkFBb0IsR0FBRyxtQkFBbUIsR0FBRyxDQUFDLENBQUMsQ0FBQyxnQ0FBZ0M7WUFFdEYseUVBQXlFO1lBQ3pFLElBQUksY0FBMEMsQ0FBQztZQUMvQyxJQUNDLFNBQVMsR0FBRyxrQkFBa0IsSUFBSSxTQUFTLEdBQUcsa0JBQWtCLEdBQUcsa0JBQWtCO2dCQUNyRixTQUFTLEdBQUcsbUJBQW1CLElBQUksU0FBUyxHQUFHLG1CQUFtQixHQUFHLG1CQUFtQixFQUN2RixDQUFDO2dCQUNGLGNBQWMsR0FBRyxTQUFTLENBQUM7WUFDNUIsQ0FBQztZQUVELDJCQUEyQjtpQkFDdEIsQ0FBQztnQkFFTCwyREFBMkQ7Z0JBQzNELDhCQUE4QjtnQkFDOUIsaURBQWlEO2dCQUNqRCx3QkFBd0I7Z0JBQ3hCLDZDQUE2QztnQkFDN0Msd0JBQXdCO2dCQUN4QiwyQ0FBMkM7Z0JBQzNDLDBCQUEwQjtnQkFDMUIsaURBQWlEO2dCQUNqRCxJQUFJLHFCQUFxQixFQUFFLENBQUM7b0JBQzNCLElBQUksU0FBUyxHQUFHLG1CQUFtQixFQUFFLENBQUM7d0JBQ3JDLGNBQWMsOEJBQXNCLENBQUM7b0JBQ3RDLENBQUM7eUJBQU0sSUFBSSxTQUFTLEdBQUcsbUJBQW1CLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ2hELGNBQWMsK0JBQXVCLENBQUM7b0JBQ3ZDLENBQUM7eUJBQU0sSUFBSSxTQUFTLEdBQUcsbUJBQW1CLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ2hELGNBQWMsNEJBQW9CLENBQUM7b0JBQ3BDLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxjQUFjLDhCQUFzQixDQUFDO29CQUN0QyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsNkRBQTZEO2dCQUM3RCw4QkFBOEI7Z0JBQzlCLGlEQUFpRDtnQkFDakQsc0JBQXNCO2dCQUN0QixpREFBaUQ7Z0JBQ2pELDhDQUE4QztnQkFDOUMsaURBQWlEO2dCQUNqRCx3QkFBd0I7Z0JBQ3hCLGlEQUFpRDtxQkFDNUMsQ0FBQztvQkFDTCxJQUFJLFNBQVMsR0FBRyxvQkFBb0IsRUFBRSxDQUFDO3dCQUN0QyxjQUFjLDRCQUFvQixDQUFDO29CQUNwQyxDQUFDO3lCQUFNLElBQUksU0FBUyxHQUFHLG9CQUFvQixHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUNqRCxjQUFjLDhCQUFzQixDQUFDO29CQUN0QyxDQUFDO3lCQUFNLElBQUksU0FBUyxHQUFHLGtCQUFrQixHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUMvQyxjQUFjLDhCQUFzQixDQUFDO29CQUN0QyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsY0FBYywrQkFBdUIsQ0FBQztvQkFDdkMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELHdDQUF3QztZQUN4QyxRQUFRLGNBQWMsRUFBRSxDQUFDO2dCQUN4QjtvQkFDQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztvQkFDOUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNqQyxNQUFNO2dCQUNQO29CQUNDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO29CQUNoRixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ2pDLE1BQU07Z0JBQ1A7b0JBQ0MsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7b0JBQzlFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDakMsTUFBTTtnQkFDUDtvQkFDQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztvQkFDaEYsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNqQyxNQUFNO2dCQUNQO29CQUNDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO29CQUMvRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEMsQ0FBQztZQUVELHVDQUF1QztZQUN2QyxNQUFNLE9BQU8sR0FBRyxJQUFBLHVCQUFlLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztZQUU1QixpRUFBaUU7WUFDakUsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFdEUsc0NBQXNDO1lBQ3RDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxFQUFFLGNBQWMsRUFBRSxDQUFDO1FBQ2hELENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxPQUFxRTtZQUM5RixNQUFNLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLElBQUEsd0JBQWdCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFNUUsWUFBWTtZQUNaLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBQ25ELElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLGVBQWUsWUFBWSxLQUFLLENBQUM7WUFDM0QsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNqQyxDQUFDO1lBRUQsVUFBVTtZQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDaEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUNsQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQ3BDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDdkMsQ0FBQztRQUVPLHNCQUFzQjtZQUU3Qix1RUFBdUU7WUFDdkUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsUUFBUSxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUM1RixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQztZQUMxQyxDQUFDO1lBRUQscUVBQXFFO1lBQ3JFLE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQUVPLFdBQVc7WUFDbEIsTUFBTSxPQUFPLEdBQUcsSUFBQSx1QkFBZSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU5QyxnQkFBZ0I7WUFDaEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDL0UsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1lBQzVCLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFFcEQsMEJBQTBCO1lBQzFCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxTQUFTLENBQUM7UUFDdkMsQ0FBQztRQUVPLG9CQUFvQixDQUFDLE9BQWdCO1lBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDakMsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxRQUFRLENBQUMsT0FBb0I7WUFDNUIsT0FBTyxPQUFPLEtBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUMvRCxDQUFDO1FBRVEsT0FBTztZQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVoQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN2QixDQUFDOztJQTVnQkksV0FBVztRQXVCZCxXQUFBLDRCQUFhLENBQUE7UUFDYixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSwwQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLDBDQUFvQixDQUFBO1FBQ3BCLFdBQUEsb0NBQXdCLENBQUE7T0E3QnJCLFdBQVcsQ0E2Z0JoQjtJQUVNLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsdUJBQVE7UUFTN0MsWUFDa0IsU0FBc0IsRUFDdEIsUUFBbUMsRUFDOUIsa0JBQXlELEVBQ2hFLFlBQTJCLEVBQ25CLG9CQUE0RCxFQUM1RCxvQkFBNEQ7WUFFbkYsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBUEgsY0FBUyxHQUFULFNBQVMsQ0FBYTtZQUN0QixhQUFRLEdBQVIsUUFBUSxDQUEyQjtZQUNiLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFFdkMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBWDVFLFlBQU8sR0FBRyxDQUFDLENBQUM7WUFFSCxtQkFBYyxHQUFHLDRCQUFzQixDQUFDLFdBQVcsRUFBMkIsQ0FBQztZQUMvRSxrQkFBYSxHQUFHLDRCQUFzQixDQUFDLFdBQVcsRUFBZ0MsQ0FBQztZQVluRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRUQsSUFBWSxPQUFPO1lBQ2xCLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzlDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QixDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsMkJBQXFCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxlQUFTLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsZUFBUyxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RHLEtBQUssTUFBTSxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUEsZUFBUyxFQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSwyQkFBcUIsRUFBQyxNQUFNLEVBQUUsZUFBUyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNGLENBQUM7UUFDRixDQUFDO1FBRU8sV0FBVyxDQUFDLEtBQWdCO1lBQ25DLElBQUksK0JBQStCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDaEcsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFZixvQkFBb0I7WUFDcEIsSUFDQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLDZCQUF1QixDQUFDLFNBQVMsQ0FBQztnQkFDL0QsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxrQ0FBNEIsQ0FBQyxTQUFTLENBQUM7Z0JBQ25FLEtBQUssQ0FBQyxZQUFZLEVBQ2pCLENBQUM7Z0JBQ0YsTUFBTSxnQkFBZ0IsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBbUMsZ0JBQXFCLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDL0gsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUNuRixJQUFJLENBQUMsSUFBQSxzQkFBZ0IsRUFBQyxLQUFLLEVBQUUsbUJBQWEsQ0FBQyxLQUFLLEVBQUUsdUJBQWlCLENBQUMsS0FBSyxFQUFFLG1CQUFhLENBQUMsU0FBUyxFQUFFLHVCQUFpQixDQUFDLE9BQU8sRUFBRSxHQUFHLG1CQUFtQixDQUFDLEVBQUUsQ0FBQyxDQUFDLHVEQUF1RDtvQkFDaE4sS0FBSyxDQUFDLFlBQVksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDO29CQUN2QyxPQUFPLENBQUMsdUJBQXVCO2dCQUNoQyxDQUFDO1lBQ0YsQ0FBQztZQUVELG1CQUFtQjtZQUNuQixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTNCLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFxQixDQUFDO1lBQzNDLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBRVoseUZBQXlGO2dCQUN6RixJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUNwRCxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3ZCLENBQUM7Z0JBRUQsNkJBQTZCO2dCQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNuQixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3pELElBQUksZUFBZSxFQUFFLENBQUM7d0JBQ3JCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQ3hGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sV0FBVztZQUNsQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFZixJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0IsQ0FBQztRQUNGLENBQUM7UUFFTyxTQUFTO1lBQ2hCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1lBRWpCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxLQUFrQjtZQUM3QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBNEIsQ0FBQztZQUVwRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFBLGdCQUFVLEVBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbkgsQ0FBQztRQUVPLGVBQWUsQ0FBQyxhQUFzQjtZQUM3QyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWhCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBRU8sY0FBYztZQUNyQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7WUFDM0IsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBckhZLDRDQUFnQjsrQkFBaEIsZ0JBQWdCO1FBWTFCLFdBQUEsMENBQW9CLENBQUE7UUFDcEIsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFDQUFxQixDQUFBO09BZlgsZ0JBQWdCLENBcUg1QiJ9