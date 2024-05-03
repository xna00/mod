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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/ui/splitview/splitview", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/editor/editor", "vs/base/common/lifecycle", "vs/workbench/common/theme", "vs/workbench/browser/parts/editor/editorWithViewState", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/editorService", "vs/base/common/resources", "vs/base/common/uri", "vs/css!./media/sidebysideeditor"], function (require, exports, nls_1, dom_1, platform_1, editor_1, sideBySideEditorInput_1, telemetry_1, instantiation_1, themeService_1, editorGroupsService_1, splitview_1, event_1, storage_1, types_1, configuration_1, editor_2, lifecycle_1, theme_1, editorWithViewState_1, textResourceConfiguration_1, editorService_1, resources_1, uri_1) {
    "use strict";
    var SideBySideEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SideBySideEditor = void 0;
    function isSideBySideEditorViewState(thing) {
        const candidate = thing;
        return typeof candidate?.primary === 'object' && typeof candidate.secondary === 'object';
    }
    let SideBySideEditor = class SideBySideEditor extends editorWithViewState_1.AbstractEditorWithViewState {
        static { SideBySideEditor_1 = this; }
        static { this.ID = editor_1.SIDE_BY_SIDE_EDITOR_ID; }
        static { this.SIDE_BY_SIDE_LAYOUT_SETTING = 'workbench.editor.splitInGroupLayout'; }
        static { this.VIEW_STATE_PREFERENCE_KEY = 'sideBySideEditorViewState'; }
        //#region Layout Constraints
        get minimumPrimaryWidth() { return this.primaryEditorPane ? this.primaryEditorPane.minimumWidth : 0; }
        get maximumPrimaryWidth() { return this.primaryEditorPane ? this.primaryEditorPane.maximumWidth : Number.POSITIVE_INFINITY; }
        get minimumPrimaryHeight() { return this.primaryEditorPane ? this.primaryEditorPane.minimumHeight : 0; }
        get maximumPrimaryHeight() { return this.primaryEditorPane ? this.primaryEditorPane.maximumHeight : Number.POSITIVE_INFINITY; }
        get minimumSecondaryWidth() { return this.secondaryEditorPane ? this.secondaryEditorPane.minimumWidth : 0; }
        get maximumSecondaryWidth() { return this.secondaryEditorPane ? this.secondaryEditorPane.maximumWidth : Number.POSITIVE_INFINITY; }
        get minimumSecondaryHeight() { return this.secondaryEditorPane ? this.secondaryEditorPane.minimumHeight : 0; }
        get maximumSecondaryHeight() { return this.secondaryEditorPane ? this.secondaryEditorPane.maximumHeight : Number.POSITIVE_INFINITY; }
        set minimumWidth(value) { }
        set maximumWidth(value) { }
        set minimumHeight(value) { }
        set maximumHeight(value) { }
        get minimumWidth() { return this.minimumPrimaryWidth + this.minimumSecondaryWidth; }
        get maximumWidth() { return this.maximumPrimaryWidth + this.maximumSecondaryWidth; }
        get minimumHeight() { return this.minimumPrimaryHeight + this.minimumSecondaryHeight; }
        get maximumHeight() { return this.maximumPrimaryHeight + this.maximumSecondaryHeight; }
        constructor(group, telemetryService, instantiationService, themeService, storageService, configurationService, textResourceConfigurationService, editorService, editorGroupService) {
            super(SideBySideEditor_1.ID, group, SideBySideEditor_1.VIEW_STATE_PREFERENCE_KEY, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService);
            this.configurationService = configurationService;
            //#endregion
            //#region Events
            this.onDidCreateEditors = this._register(new event_1.Emitter());
            this._onDidChangeSizeConstraints = this._register(new event_1.Relay());
            this.onDidChangeSizeConstraints = event_1.Event.any(this.onDidCreateEditors.event, this._onDidChangeSizeConstraints.event);
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            //#endregion
            this.primaryEditorPane = undefined;
            this.secondaryEditorPane = undefined;
            this.splitviewDisposables = this._register(new lifecycle_1.DisposableStore());
            this.editorDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orientation = this.configurationService.getValue(SideBySideEditor_1.SIDE_BY_SIDE_LAYOUT_SETTING) === 'vertical' ? 0 /* Orientation.VERTICAL */ : 1 /* Orientation.HORIZONTAL */;
            this.dimension = new dom_1.Dimension(0, 0);
            this.lastFocusedSide = undefined;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
        }
        onConfigurationUpdated(event) {
            if (event.affectsConfiguration(SideBySideEditor_1.SIDE_BY_SIDE_LAYOUT_SETTING)) {
                this.orientation = this.configurationService.getValue(SideBySideEditor_1.SIDE_BY_SIDE_LAYOUT_SETTING) === 'vertical' ? 0 /* Orientation.VERTICAL */ : 1 /* Orientation.HORIZONTAL */;
                // If config updated from event, re-create the split
                // editor using the new layout orientation if it was
                // already created.
                if (this.splitview) {
                    this.recreateSplitview();
                }
            }
        }
        recreateSplitview() {
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            // Clear old (if any) but remember ratio
            const ratio = this.getSplitViewRatio();
            if (this.splitview) {
                container.removeChild(this.splitview.el);
                this.splitviewDisposables.clear();
            }
            // Create new
            this.createSplitView(container, ratio);
            this.layout(this.dimension);
        }
        getSplitViewRatio() {
            let ratio = undefined;
            if (this.splitview) {
                const leftViewSize = this.splitview.getViewSize(0);
                const rightViewSize = this.splitview.getViewSize(1);
                // Only return a ratio when the view size is significantly
                // enough different for left and right view sizes
                if (Math.abs(leftViewSize - rightViewSize) > 1) {
                    const totalSize = this.splitview.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height;
                    ratio = leftViewSize / totalSize;
                }
            }
            return ratio;
        }
        createEditor(parent) {
            parent.classList.add('side-by-side-editor');
            // Editor pane containers
            this.secondaryEditorContainer = (0, dom_1.$)('.side-by-side-editor-container.editor-instance');
            this.primaryEditorContainer = (0, dom_1.$)('.side-by-side-editor-container.editor-instance');
            // Split view
            this.createSplitView(parent);
        }
        createSplitView(parent, ratio) {
            // Splitview widget
            this.splitview = this.splitviewDisposables.add(new splitview_1.SplitView(parent, { orientation: this.orientation }));
            this.splitviewDisposables.add(this.splitview.onDidSashReset(() => this.splitview?.distributeViewSizes()));
            if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                this.splitview.orthogonalEndSash = this._boundarySashes?.bottom;
            }
            else {
                this.splitview.orthogonalStartSash = this._boundarySashes?.left;
                this.splitview.orthogonalEndSash = this._boundarySashes?.right;
            }
            // Figure out sizing
            let leftSizing = splitview_1.Sizing.Distribute;
            let rightSizing = splitview_1.Sizing.Distribute;
            if (ratio) {
                const totalSize = this.splitview.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height;
                leftSizing = Math.round(totalSize * ratio);
                rightSizing = totalSize - leftSizing;
                // We need to call `layout` for the `ratio` to have any effect
                this.splitview.layout(this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height);
            }
            // Secondary (left)
            const secondaryEditorContainer = (0, types_1.assertIsDefined)(this.secondaryEditorContainer);
            this.splitview.addView({
                element: secondaryEditorContainer,
                layout: size => this.layoutPane(this.secondaryEditorPane, size),
                minimumSize: this.orientation === 1 /* Orientation.HORIZONTAL */ ? editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: event_1.Event.None
            }, leftSizing);
            // Primary (right)
            const primaryEditorContainer = (0, types_1.assertIsDefined)(this.primaryEditorContainer);
            this.splitview.addView({
                element: primaryEditorContainer,
                layout: size => this.layoutPane(this.primaryEditorPane, size),
                minimumSize: this.orientation === 1 /* Orientation.HORIZONTAL */ ? editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: event_1.Event.None
            }, rightSizing);
            this.updateStyles();
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('sideBySideEditor', "Side by Side Editor");
        }
        async setInput(input, options, context, token) {
            const oldInput = this.input;
            await super.setInput(input, options, context, token);
            // Create new side by side editors if either we have not
            // been created before or the input no longer matches.
            if (!oldInput || !input.matches(oldInput)) {
                if (oldInput) {
                    this.disposeEditors();
                }
                this.createEditors(input);
            }
            // Restore any previous view state
            const { primary, secondary, viewState } = this.loadViewState(input, options, context);
            this.lastFocusedSide = viewState?.focus;
            if (typeof viewState?.ratio === 'number' && this.splitview) {
                const totalSize = this.splitview.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height;
                this.splitview.resizeView(0, Math.round(totalSize * viewState.ratio));
            }
            else {
                this.splitview?.distributeViewSizes();
            }
            // Set input to both sides
            await Promise.all([
                this.secondaryEditorPane?.setInput(input.secondary, secondary, context, token),
                this.primaryEditorPane?.setInput(input.primary, primary, context, token)
            ]);
            // Update focus if target is provided
            if (typeof options?.target === 'number') {
                this.lastFocusedSide = options.target;
            }
        }
        loadViewState(input, options, context) {
            const viewState = isSideBySideEditorViewState(options?.viewState) ? options?.viewState : this.loadEditorViewState(input, context);
            let primaryOptions = Object.create(null);
            let secondaryOptions = undefined;
            // Depending on the optional `target` property, we apply
            // the provided options to either the primary or secondary
            // side
            if (options?.target === editor_1.SideBySideEditor.SECONDARY) {
                secondaryOptions = { ...options };
            }
            else {
                primaryOptions = { ...options };
            }
            primaryOptions.viewState = viewState?.primary;
            if (viewState?.secondary) {
                if (!secondaryOptions) {
                    secondaryOptions = { viewState: viewState.secondary };
                }
                else {
                    secondaryOptions.viewState = viewState?.secondary;
                }
            }
            return { primary: primaryOptions, secondary: secondaryOptions, viewState };
        }
        createEditors(newInput) {
            // Create editors
            this.secondaryEditorPane = this.doCreateEditor(newInput.secondary, (0, types_1.assertIsDefined)(this.secondaryEditorContainer));
            this.primaryEditorPane = this.doCreateEditor(newInput.primary, (0, types_1.assertIsDefined)(this.primaryEditorContainer));
            // Layout
            this.layout(this.dimension);
            // Eventing
            this._onDidChangeSizeConstraints.input = event_1.Event.any(event_1.Event.map(this.secondaryEditorPane.onDidChangeSizeConstraints, () => undefined), event_1.Event.map(this.primaryEditorPane.onDidChangeSizeConstraints, () => undefined));
            this.onDidCreateEditors.fire(undefined);
            // Track focus and signal active control change via event
            this.editorDisposables.add(this.primaryEditorPane.onDidFocus(() => this.onDidFocusChange(editor_1.SideBySideEditor.PRIMARY)));
            this.editorDisposables.add(this.secondaryEditorPane.onDidFocus(() => this.onDidFocusChange(editor_1.SideBySideEditor.SECONDARY)));
        }
        doCreateEditor(editorInput, container) {
            const editorPaneDescriptor = platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).getEditorPane(editorInput);
            if (!editorPaneDescriptor) {
                throw new Error('No editor pane descriptor for editor found');
            }
            // Create editor pane and make visible
            const editorPane = editorPaneDescriptor.instantiate(this.instantiationService, this.group);
            editorPane.create(container);
            editorPane.setVisible(this.isVisible());
            // Track selections if supported
            if ((0, editor_1.isEditorPaneWithSelection)(editorPane)) {
                this.editorDisposables.add(editorPane.onDidChangeSelection(e => this._onDidChangeSelection.fire(e)));
            }
            // Track for disposal
            this.editorDisposables.add(editorPane);
            return editorPane;
        }
        onDidFocusChange(side) {
            this.lastFocusedSide = side;
            // Signal to outside that our active control changed
            this._onDidChangeControl.fire();
        }
        getSelection() {
            const lastFocusedEditorPane = this.getLastFocusedEditorPane();
            if ((0, editor_1.isEditorPaneWithSelection)(lastFocusedEditorPane)) {
                const selection = lastFocusedEditorPane.getSelection();
                if (selection) {
                    return new SideBySideAwareEditorPaneSelection(selection, lastFocusedEditorPane === this.primaryEditorPane ? editor_1.SideBySideEditor.PRIMARY : editor_1.SideBySideEditor.SECONDARY);
                }
            }
            return undefined;
        }
        setOptions(options) {
            super.setOptions(options);
            // Update focus if target is provided
            if (typeof options?.target === 'number') {
                this.lastFocusedSide = options.target;
            }
            // Apply to focused side
            this.getLastFocusedEditorPane()?.setOptions(options);
        }
        setEditorVisible(visible) {
            // Forward to both sides
            this.primaryEditorPane?.setVisible(visible);
            this.secondaryEditorPane?.setVisible(visible);
            super.setEditorVisible(visible);
        }
        clearInput() {
            super.clearInput();
            // Forward to both sides
            this.primaryEditorPane?.clearInput();
            this.secondaryEditorPane?.clearInput();
            // Since we do not keep side editors alive
            // we dispose any editor created for recreation
            this.disposeEditors();
        }
        focus() {
            super.focus();
            this.getLastFocusedEditorPane()?.focus();
        }
        getLastFocusedEditorPane() {
            if (this.lastFocusedSide === editor_1.SideBySideEditor.SECONDARY) {
                return this.secondaryEditorPane;
            }
            return this.primaryEditorPane;
        }
        layout(dimension) {
            this.dimension = dimension;
            const splitview = (0, types_1.assertIsDefined)(this.splitview);
            splitview.layout(this.orientation === 1 /* Orientation.HORIZONTAL */ ? dimension.width : dimension.height);
        }
        setBoundarySashes(sashes) {
            this._boundarySashes = sashes;
            if (this.splitview) {
                this.splitview.orthogonalEndSash = sashes.bottom;
            }
        }
        layoutPane(pane, size) {
            pane?.layout(this.orientation === 1 /* Orientation.HORIZONTAL */ ? new dom_1.Dimension(size, this.dimension.height) : new dom_1.Dimension(this.dimension.width, size));
        }
        getControl() {
            return this.getLastFocusedEditorPane()?.getControl();
        }
        getPrimaryEditorPane() {
            return this.primaryEditorPane;
        }
        getSecondaryEditorPane() {
            return this.secondaryEditorPane;
        }
        tracksEditorViewState(input) {
            return input instanceof sideBySideEditorInput_1.SideBySideEditorInput;
        }
        computeEditorViewState(resource) {
            if (!this.input || !(0, resources_1.isEqual)(resource, this.toEditorViewStateResource(this.input))) {
                return; // unexpected state
            }
            const primarViewState = this.primaryEditorPane?.getViewState();
            const secondaryViewState = this.secondaryEditorPane?.getViewState();
            if (!primarViewState || !secondaryViewState) {
                return; // we actually need view states
            }
            return {
                primary: primarViewState,
                secondary: secondaryViewState,
                focus: this.lastFocusedSide,
                ratio: this.getSplitViewRatio()
            };
        }
        toEditorViewStateResource(input) {
            let primary;
            let secondary;
            if (input instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                primary = input.primary.resource;
                secondary = input.secondary.resource;
            }
            if (!secondary || !primary) {
                return undefined;
            }
            // create a URI that is the Base64 concatenation of original + modified resource
            return uri_1.URI.from({ scheme: 'sideBySide', path: `${(0, dom_1.multibyteAwareBtoa)(secondary.toString())}${(0, dom_1.multibyteAwareBtoa)(primary.toString())}` });
        }
        updateStyles() {
            super.updateStyles();
            if (this.primaryEditorContainer) {
                if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                    this.primaryEditorContainer.style.borderLeftWidth = '1px';
                    this.primaryEditorContainer.style.borderLeftStyle = 'solid';
                    this.primaryEditorContainer.style.borderLeftColor = this.getColor(theme_1.SIDE_BY_SIDE_EDITOR_VERTICAL_BORDER) ?? '';
                    this.primaryEditorContainer.style.borderTopWidth = '0';
                }
                else {
                    this.primaryEditorContainer.style.borderTopWidth = '1px';
                    this.primaryEditorContainer.style.borderTopStyle = 'solid';
                    this.primaryEditorContainer.style.borderTopColor = this.getColor(theme_1.SIDE_BY_SIDE_EDITOR_HORIZONTAL_BORDER) ?? '';
                    this.primaryEditorContainer.style.borderLeftWidth = '0';
                }
            }
        }
        dispose() {
            this.disposeEditors();
            super.dispose();
        }
        disposeEditors() {
            this.editorDisposables.clear();
            this.secondaryEditorPane = undefined;
            this.primaryEditorPane = undefined;
            this.lastFocusedSide = undefined;
            if (this.secondaryEditorContainer) {
                (0, dom_1.clearNode)(this.secondaryEditorContainer);
            }
            if (this.primaryEditorContainer) {
                (0, dom_1.clearNode)(this.primaryEditorContainer);
            }
        }
    };
    exports.SideBySideEditor = SideBySideEditor;
    exports.SideBySideEditor = SideBySideEditor = SideBySideEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, storage_1.IStorageService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, editorService_1.IEditorService),
        __param(8, editorGroupsService_1.IEditorGroupsService)
    ], SideBySideEditor);
    class SideBySideAwareEditorPaneSelection {
        constructor(selection, side) {
            this.selection = selection;
            this.side = side;
        }
        compare(other) {
            if (!(other instanceof SideBySideAwareEditorPaneSelection)) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            if (this.side !== other.side) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            return this.selection.compare(other.selection);
        }
        restore(options) {
            const sideBySideEditorOptions = {
                ...options,
                target: this.side
            };
            return this.selection.restore(sideBySideEditorOptions);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lkZUJ5U2lkZUVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL3NpZGVCeVNpZGVFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXVDaEcsU0FBUywyQkFBMkIsQ0FBQyxLQUFjO1FBQ2xELE1BQU0sU0FBUyxHQUFHLEtBQStDLENBQUM7UUFFbEUsT0FBTyxPQUFPLFNBQVMsRUFBRSxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLENBQUM7SUFDMUYsQ0FBQztJQWVNLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsaURBQXVEOztpQkFFNUUsT0FBRSxHQUFXLCtCQUFzQixBQUFqQyxDQUFrQztpQkFFN0MsZ0NBQTJCLEdBQUcscUNBQXFDLEFBQXhDLENBQXlDO2lCQUVuRCw4QkFBeUIsR0FBRywyQkFBMkIsQUFBOUIsQ0FBK0I7UUFFaEYsNEJBQTRCO1FBRTVCLElBQVksbUJBQW1CLEtBQUssT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUcsSUFBWSxtQkFBbUIsS0FBSyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztRQUNySSxJQUFZLG9CQUFvQixLQUFLLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFB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