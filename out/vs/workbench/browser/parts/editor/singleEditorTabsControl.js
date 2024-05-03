/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/editorTabsControl", "vs/workbench/browser/labels", "vs/workbench/common/theme", "vs/base/browser/touch", "vs/base/browser/dom", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/color", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/platform/theme/browser/defaultStyles", "vs/workbench/browser/parts/editor/breadcrumbsControl", "vs/css!./media/singleeditortabscontrol"], function (require, exports, editor_1, editorTabsControl_1, labels_1, theme_1, touch_1, dom_1, editorCommands_1, color_1, types_1, objects_1, lifecycle_1, defaultStyles_1, breadcrumbsControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SingleEditorTabsControl = void 0;
    class SingleEditorTabsControl extends editorTabsControl_1.EditorTabsControl {
        constructor() {
            super(...arguments);
            this.activeLabel = Object.create(null);
        }
        get breadcrumbsControl() { return this.breadcrumbsControlFactory?.control; }
        create(parent) {
            super.create(parent);
            const titleContainer = this.titleContainer = parent;
            titleContainer.draggable = true;
            // Container listeners
            this.registerContainerListeners(titleContainer);
            // Gesture Support
            this._register(touch_1.Gesture.addTarget(titleContainer));
            const labelContainer = document.createElement('div');
            labelContainer.classList.add('label-container');
            titleContainer.appendChild(labelContainer);
            // Editor Label
            this.editorLabel = this._register(this.instantiationService.createInstance(labels_1.ResourceLabel, labelContainer, { hoverDelegate: this.getHoverDelegate() })).element;
            this._register((0, dom_1.addDisposableListener)(this.editorLabel.element, dom_1.EventType.CLICK, e => this.onTitleLabelClick(e)));
            // Breadcrumbs
            this.breadcrumbsControlFactory = this._register(this.instantiationService.createInstance(breadcrumbsControl_1.BreadcrumbsControlFactory, labelContainer, this.groupView, {
                showFileIcons: false,
                showSymbolIcons: true,
                showDecorationColors: false,
                widgetStyles: { ...defaultStyles_1.defaultBreadcrumbsWidgetStyles, breadcrumbsBackground: color_1.Color.transparent.toString() },
                showPlaceholder: false
            }));
            this._register(this.breadcrumbsControlFactory.onDidEnablementChange(() => this.handleBreadcrumbsEnablementChange()));
            titleContainer.classList.toggle('breadcrumbs', Boolean(this.breadcrumbsControl));
            this._register((0, lifecycle_1.toDisposable)(() => titleContainer.classList.remove('breadcrumbs'))); // important to remove because the container is a shared dom node
            // Create editor actions toolbar
            this.createEditorActionsToolBar(titleContainer, ['title-actions']);
        }
        registerContainerListeners(titleContainer) {
            // Drag & Drop support
            let lastDragEvent = undefined;
            let isNewWindowOperation = false;
            this._register(new dom_1.DragAndDropObserver(titleContainer, {
                onDragStart: e => { isNewWindowOperation = this.onGroupDragStart(e, titleContainer); },
                onDrag: e => { lastDragEvent = e; },
                onDragEnd: e => { this.onGroupDragEnd(e, lastDragEvent, titleContainer, isNewWindowOperation); },
            }));
            // Pin on double click
            this._register((0, dom_1.addDisposableListener)(titleContainer, dom_1.EventType.DBLCLICK, e => this.onTitleDoubleClick(e)));
            // Detect mouse click
            this._register((0, dom_1.addDisposableListener)(titleContainer, dom_1.EventType.AUXCLICK, e => this.onTitleAuxClick(e)));
            // Detect touch
            this._register((0, dom_1.addDisposableListener)(titleContainer, touch_1.EventType.Tap, (e) => this.onTitleTap(e)));
            // Context Menu
            for (const event of [dom_1.EventType.CONTEXT_MENU, touch_1.EventType.Contextmenu]) {
                this._register((0, dom_1.addDisposableListener)(titleContainer, event, e => {
                    if (this.tabsModel.activeEditor) {
                        this.onTabContextMenu(this.tabsModel.activeEditor, e, titleContainer);
                    }
                }));
            }
        }
        onTitleLabelClick(e) {
            dom_1.EventHelper.stop(e, false);
            // delayed to let the onTitleClick() come first which can cause a focus change which can close quick access
            setTimeout(() => this.quickInputService.quickAccess.show());
        }
        onTitleDoubleClick(e) {
            dom_1.EventHelper.stop(e);
            this.groupView.pinEditor();
        }
        onTitleAuxClick(e) {
            if (e.button === 1 /* Middle Button */ && this.tabsModel.activeEditor) {
                dom_1.EventHelper.stop(e, true /* for https://github.com/microsoft/vscode/issues/56715 */);
                if (!(0, editor_1.preventEditorClose)(this.tabsModel, this.tabsModel.activeEditor, editor_1.EditorCloseMethod.MOUSE, this.groupsView.partOptions)) {
                    this.groupView.closeEditor(this.tabsModel.activeEditor);
                }
            }
        }
        onTitleTap(e) {
            // We only want to open the quick access picker when
            // the tap occurred over the editor label, so we need
            // to check on the target
            // (https://github.com/microsoft/vscode/issues/107543)
            const target = e.initialTarget;
            if (!(target instanceof HTMLElement) || !this.editorLabel || !(0, dom_1.isAncestor)(target, this.editorLabel.element)) {
                return;
            }
            // TODO@rebornix gesture tap should open the quick access
            // editorGroupView will focus on the editor again when there
            // are mouse/pointer/touch down events we need to wait a bit as
            // `GesureEvent.Tap` is generated from `touchstart` and then
            // `touchend` events, which are not an atom event.
            setTimeout(() => this.quickInputService.quickAccess.show(), 50);
        }
        openEditor(editor) {
            return this.doHandleOpenEditor();
        }
        openEditors(editors) {
            return this.doHandleOpenEditor();
        }
        doHandleOpenEditor() {
            const activeEditorChanged = this.ifActiveEditorChanged(() => this.redraw());
            if (!activeEditorChanged) {
                this.ifActiveEditorPropertiesChanged(() => this.redraw());
            }
            return activeEditorChanged;
        }
        beforeCloseEditor(editor) {
            // Nothing to do before closing an editor
        }
        closeEditor(editor) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        closeEditors(editors) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        moveEditor(editor, fromIndex, targetIndex) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        pinEditor(editor) {
            this.ifEditorIsActive(editor, () => this.redraw());
        }
        stickEditor(editor) {
            // Sticky editors are not presented any different with tabs disabled
        }
        unstickEditor(editor) {
            // Sticky editors are not presented any different with tabs disabled
        }
        setActive(isActive) {
            this.redraw();
        }
        updateEditorLabel(editor) {
            this.ifEditorIsActive(editor, () => this.redraw());
        }
        updateEditorDirty(editor) {
            this.ifEditorIsActive(editor, () => {
                const titleContainer = (0, types_1.assertIsDefined)(this.titleContainer);
                // Signal dirty (unless saving)
                if (editor.isDirty() && !editor.isSaving()) {
                    titleContainer.classList.add('dirty');
                }
                // Otherwise, clear dirty
                else {
                    titleContainer.classList.remove('dirty');
                }
            });
        }
        updateOptions(oldOptions, newOptions) {
            super.updateOptions(oldOptions, newOptions);
            if (oldOptions.labelFormat !== newOptions.labelFormat || !(0, objects_1.equals)(oldOptions.decorations, newOptions.decorations)) {
                this.redraw();
            }
        }
        updateStyles() {
            this.redraw();
        }
        handleBreadcrumbsEnablementChange() {
            const titleContainer = (0, types_1.assertIsDefined)(this.titleContainer);
            titleContainer.classList.toggle('breadcrumbs', Boolean(this.breadcrumbsControl));
            this.redraw();
        }
        ifActiveEditorChanged(fn) {
            if (!this.activeLabel.editor && this.tabsModel.activeEditor || // active editor changed from null => editor
                this.activeLabel.editor && !this.tabsModel.activeEditor || // active editor changed from editor => null
                (!this.activeLabel.editor || !this.tabsModel.isActive(this.activeLabel.editor)) // active editor changed from editorA => editorB
            ) {
                fn();
                return true;
            }
            return false;
        }
        ifActiveEditorPropertiesChanged(fn) {
            if (!this.activeLabel.editor || !this.tabsModel.activeEditor) {
                return; // need an active editor to check for properties changed
            }
            if (this.activeLabel.pinned !== this.tabsModel.isPinned(this.tabsModel.activeEditor)) {
                fn(); // only run if pinned state has changed
            }
        }
        ifEditorIsActive(editor, fn) {
            if (this.tabsModel.isActive(editor)) {
                fn(); // only run if editor is current active
            }
        }
        redraw() {
            const editor = this.tabsModel.activeEditor ?? undefined;
            const options = this.groupsView.partOptions;
            const isEditorPinned = editor ? this.tabsModel.isPinned(editor) : false;
            const isGroupActive = this.groupsView.activeGroup === this.groupView;
            this.activeLabel = { editor, pinned: isEditorPinned };
            // Update Breadcrumbs
            if (this.breadcrumbsControl) {
                if (isGroupActive) {
                    this.breadcrumbsControl.update();
                    this.breadcrumbsControl.domNode.classList.toggle('preview', !isEditorPinned);
                }
                else {
                    this.breadcrumbsControl.hide();
                }
            }
            // Clear if there is no editor
            const [titleContainer, editorLabel] = (0, types_1.assertAllDefined)(this.titleContainer, this.editorLabel);
            if (!editor) {
                titleContainer.classList.remove('dirty');
                editorLabel.clear();
                this.clearEditorActionsToolbar();
            }
            // Otherwise render it
            else {
                // Dirty state
                this.updateEditorDirty(editor);
                // Editor Label
                const { labelFormat } = this.groupsView.partOptions;
                let description;
                if (this.breadcrumbsControl && !this.breadcrumbsControl.isHidden()) {
                    description = ''; // hide description when showing breadcrumbs
                }
                else if (labelFormat === 'default' && !isGroupActive) {
                    description = ''; // hide description when group is not active and style is 'default'
                }
                else {
                    description = editor.getDescription(this.getVerbosity(labelFormat)) || '';
                }
                editorLabel.setResource({
                    resource: editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH }),
                    name: editor.getName(),
                    description
                }, {
                    title: this.getHoverTitle(editor),
                    italic: !isEditorPinned,
                    extraClasses: ['single-tab', 'title-label'].concat(editor.getLabelExtraClasses()),
                    fileDecorations: {
                        colors: Boolean(options.decorations?.colors),
                        badges: Boolean(options.decorations?.badges)
                    },
                    icon: editor.getIcon(),
                    hideIcon: options.showIcons === false,
                });
                if (isGroupActive) {
                    titleContainer.style.color = this.getColor(theme_1.TAB_ACTIVE_FOREGROUND) || '';
                }
                else {
                    titleContainer.style.color = this.getColor(theme_1.TAB_UNFOCUSED_ACTIVE_FOREGROUND) || '';
                }
                // Update Editor Actions Toolbar
                this.updateEditorActionsToolbar();
            }
        }
        getVerbosity(style) {
            switch (style) {
                case 'short': return 0 /* Verbosity.SHORT */;
                case 'long': return 2 /* Verbosity.LONG */;
                default: return 1 /* Verbosity.MEDIUM */;
            }
        }
        prepareEditorActions(editorActions) {
            const isGroupActive = this.groupsView.activeGroup === this.groupView;
            // Active: allow all actions
            if (isGroupActive) {
                return editorActions;
            }
            // Inactive: only show "Close, "Unlock" and secondary actions
            else {
                return {
                    primary: editorActions.primary.filter(action => action.id === editorCommands_1.CLOSE_EDITOR_COMMAND_ID || action.id === editorCommands_1.UNLOCK_GROUP_COMMAND_ID),
                    secondary: editorActions.secondary
                };
            }
        }
        getHeight() {
            return this.tabHeight;
        }
        layout(dimensions) {
            this.breadcrumbsControl?.layout(undefined);
            return new dom_1.Dimension(dimensions.container.width, this.getHeight());
        }
    }
    exports.SingleEditorTabsControl = SingleEditorTabsControl;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2luZ2xlRWRpdG9yVGFic0NvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9zaW5nbGVFZGl0b3JUYWJzQ29udHJvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3QmhHLE1BQWEsdUJBQXdCLFNBQVEscUNBQWlCO1FBQTlEOztZQUlTLGdCQUFXLEdBQXlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFtVmpFLENBQUM7UUFoVkEsSUFBWSxrQkFBa0IsS0FBSyxPQUFPLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRWpFLE1BQU0sQ0FBQyxNQUFtQjtZQUM1QyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXJCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDO1lBQ3BELGNBQWMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBRWhDLHNCQUFzQjtZQUN0QixJQUFJLENBQUMsMEJBQTBCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFaEQsa0JBQWtCO1lBQ2xCLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBTyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBRWxELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckQsY0FBYyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNoRCxjQUFjLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTNDLGVBQWU7WUFDZixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMs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