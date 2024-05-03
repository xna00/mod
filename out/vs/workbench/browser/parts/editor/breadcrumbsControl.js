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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/breadcrumbs/breadcrumbsWidget", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/quickinput/common/quickInput", "vs/workbench/browser/labels", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/workbench/browser/parts/editor/breadcrumbsModel", "vs/workbench/browser/parts/editor/breadcrumbsPicker", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/pixelRatio", "vs/platform/label/common/label", "vs/platform/action/common/actionCommonCategories", "vs/platform/theme/common/iconRegistry", "vs/base/common/codicons", "vs/platform/theme/browser/defaultStyles", "vs/base/common/event", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./media/breadcrumbscontrol"], function (require, exports, dom, mouseEvent_1, breadcrumbsWidget_1, arrays_1, async_1, lifecycle_1, resources_1, uri_1, nls_1, actions_1, configuration_1, contextkey_1, contextView_1, files_1, instantiation_1, keybindingsRegistry_1, listService_1, quickInput_1, labels_1, breadcrumbs_1, breadcrumbsModel_1, breadcrumbsPicker_1, editor_1, editorService_1, editorGroupsService_1, pixelRatio_1, label_1, actionCommonCategories_1, iconRegistry_1, codicons_1, defaultStyles_1, event_1, hoverDelegateFactory_1) {
    "use strict";
    var BreadcrumbsControl_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsControlFactory = exports.BreadcrumbsControl = void 0;
    class OutlineItem extends breadcrumbsWidget_1.BreadcrumbsItem {
        constructor(model, element, options) {
            super();
            this.model = model;
            this.element = element;
            this.options = options;
            this._disposables = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this._disposables.dispose();
        }
        equals(other) {
            if (!(other instanceof OutlineItem)) {
                return false;
            }
            return this.element.element === other.element.element &&
                this.options.showFileIcons === other.options.showFileIcons &&
                this.options.showSymbolIcons === other.options.showSymbolIcons;
        }
        render(container) {
            const { element, outline } = this.element;
            if (element === outline) {
                const element = dom.$('span', undefined, '…');
                container.appendChild(element);
                return;
            }
            const templateId = outline.config.delegate.getTemplateId(element);
            const renderer = outline.config.renderers.find(renderer => renderer.templateId === templateId);
            if (!renderer) {
                container.innerText = '<<NO RENDERER>>';
                return;
            }
            const template = renderer.renderTemplate(container);
            renderer.renderElement({
                element,
                children: [],
                depth: 0,
                visibleChildrenCount: 0,
                visibleChildIndex: 0,
                collapsible: false,
                collapsed: false,
                visible: true,
                filterData: undefined
            }, 0, template, undefined);
            this._disposables.add((0, lifecycle_1.toDisposable)(() => { renderer.disposeTemplate(template); }));
        }
    }
    class FileItem extends breadcrumbsWidget_1.BreadcrumbsItem {
        constructor(model, element, options, _labels, _hoverDelegate) {
            super();
            this.model = model;
            this.element = element;
            this.options = options;
            this._labels = _labels;
            this._hoverDelegate = _hoverDelegate;
            this._disposables = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this._disposables.dispose();
        }
        equals(other) {
            if (!(other instanceof FileItem)) {
                return false;
            }
            return (resources_1.extUri.isEqual(this.element.uri, other.element.uri) &&
                this.options.showFileIcons === other.options.showFileIcons &&
                this.options.showSymbolIcons === other.options.showSymbolIcons);
        }
        render(container) {
            // file/folder
            const label = this._labels.create(container, { hoverDelegate: this._hoverDelegate });
            label.setFile(this.element.uri, {
                hidePath: true,
                hideIcon: this.element.kind === files_1.FileKind.FOLDER || !this.options.showFileIcons,
                fileKind: this.element.kind,
                fileDecorations: { colors: this.options.showDecorationColors, badges: false },
            });
            container.classList.add(files_1.FileKind[this.element.kind].toLowerCase());
            this._disposables.add(label);
        }
    }
    const separatorIcon = (0, iconRegistry_1.registerIcon)('breadcrumb-separator', codicons_1.Codicon.chevronRight, (0, nls_1.localize)('separatorIcon', 'Icon for the separator in the breadcrumbs.'));
    let BreadcrumbsControl = class BreadcrumbsControl {
        static { BreadcrumbsControl_1 = this; }
        static { this.HEIGHT = 22; }
        static { this.SCROLLBAR_SIZES = {
            default: 3,
            large: 8
        }; }
        static { this.Payload_Reveal = {}; }
        static { this.Payload_RevealAside = {}; }
        static { this.Payload_Pick = {}; }
        static { this.CK_BreadcrumbsPossible = new contextkey_1.RawContextKey('breadcrumbsPossible', false, (0, nls_1.localize)('breadcrumbsPossible', "Whether the editor can show breadcrumbs")); }
        static { this.CK_BreadcrumbsVisible = new contextkey_1.RawContextKey('breadcrumbsVisible', false, (0, nls_1.localize)('breadcrumbsVisible', "Whether breadcrumbs are currently visible")); }
        static { this.CK_BreadcrumbsActive = new contextkey_1.RawContextKey('breadcrumbsActive', false, (0, nls_1.localize)('breadcrumbsActive', "Whether breadcrumbs have focus")); }
        get onDidVisibilityChange() { return this._onDidVisibilityChange.event; }
        constructor(container, _options, _editorGroup, _contextKeyService, _contextViewService, _instantiationService, _quickInputService, _fileService, _editorService, _labelService, configurationService, breadcrumbsService) {
            this._options = _options;
            this._editorGroup = _editorGroup;
            this._contextKeyService = _contextKeyService;
            this._contextViewService = _contextViewService;
            this._instantiationService = _instantiationService;
            this._quickInputService = _quickInputService;
            this._fileService = _fileService;
            this._editorService = _editorService;
            this._labelService = _labelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._breadcrumbsDisposables = new lifecycle_1.DisposableStore();
            this._model = new lifecycle_1.MutableDisposable();
            this._breadcrumbsPickerShowing = false;
            this._onDidVisibilityChange = this._disposables.add(new event_1.Emitter());
            this.domNode = document.createElement('div');
            this.domNode.classList.add('breadcrumbs-control');
            dom.append(container, this.domNode);
            this._cfUseQuickPick = breadcrumbs_1.BreadcrumbsConfig.UseQuickPick.bindTo(configurationService);
            this._cfShowIcons = breadcrumbs_1.BreadcrumbsConfig.Icons.bindTo(configurationService);
            this._cfTitleScrollbarSizing = breadcrumbs_1.BreadcrumbsConfig.TitleScrollbarSizing.bindTo(configurationService);
            this._labels = this._instantiationService.createInstance(labels_1.ResourceLabels, labels_1.DEFAULT_LABELS_CONTAINER);
            const sizing = this._cfTitleScrollbarSizing.getValue() ?? 'default';
            const styles = _options.widgetStyles ?? defaultStyles_1.defaultBreadcrumbsWidgetStyles;
            this._widget = new breadcrumbsWidget_1.BreadcrumbsWidget(this.domNode, BreadcrumbsControl_1.SCROLLBAR_SIZES[sizing], separatorIcon, styles);
            this._widget.onDidSelectItem(this._onSelectEvent, this, this._disposables);
            this._widget.onDidFocusItem(this._onFocusEvent, this, this._disposables);
            this._widget.onDidChangeFocus(this._updateCkBreadcrumbsActive, this, this._disposables);
            this._ckBreadcrumbsPossible = BreadcrumbsControl_1.CK_BreadcrumbsPossible.bindTo(this._contextKeyService);
            this._ckBreadcrumbsVisible = BreadcrumbsControl_1.CK_BreadcrumbsVisible.bindTo(this._contextKeyService);
            this._ckBreadcrumbsActive = BreadcrumbsControl_1.CK_BreadcrumbsActive.bindTo(this._contextKeyService);
            this._hoverDelegate = (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse');
            this._disposables.add(breadcrumbsService.register(this._editorGroup.id, this._widget));
            this.hide();
        }
        dispose() {
            this._disposables.dispose();
            this._breadcrumbsDisposables.dispose();
            this._ckBreadcrumbsPossible.reset();
            this._ckBreadcrumbsVisible.reset();
            this._ckBreadcrumbsActive.reset();
            this._cfUseQuickPick.dispose();
            this._cfShowIcons.dispose();
            this._widget.dispose();
            this._labels.dispose();
            this.domNode.remove();
        }
        get model() {
            return this._model.value;
        }
        layout(dim) {
            this._widget.layout(dim);
        }
        isHidden() {
            return this.domNode.classList.contains('hidden');
        }
        hide() {
            const wasHidden = this.isHidden();
            this._breadcrumbsDisposables.clear();
            this._ckBreadcrumbsVisible.set(false);
            this.domNode.classList.toggle('hidden', true);
            if (!wasHidden) {
                this._onDidVisibilityChange.fire();
            }
        }
        show() {
            const wasHidden = this.isHidden();
            this._ckBreadcrumbsVisible.set(true);
            this.domNode.classList.toggle('hidden', false);
            if (wasHidden) {
                this._onDidVisibilityChange.fire();
            }
        }
        revealLast() {
            this._widget.revealLast();
        }
        update() {
            this._breadcrumbsDisposables.clear();
            // honor diff editors and such
            const uri = editor_1.EditorResourceAccessor.getCanonicalUri(this._editorGroup.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            const wasHidden = this.isHidden();
            if (!uri || !this._fileService.hasProvider(uri)) {
                // cleanup and return when there is no input or when
                // we cannot handle this input
                this._ckBreadcrumbsPossible.set(false);
                if (!wasHidden) {
                    this.hide();
                    return true;
                }
                else {
                    return false;
                }
            }
            // display uri which can be derived from certain inputs
            const fileInfoUri = editor_1.EditorResourceAccessor.getOriginalUri(this._editorGroup.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            this.show();
            this._ckBreadcrumbsPossible.set(true);
            const model = this._instantiationService.createInstance(breadcrumbsModel_1.BreadcrumbsModel, fileInfoUri ?? uri, this._editorGroup.activeEditorPane);
            this._model.value = model;
            this.domNode.classList.toggle('backslash-path', this._labelService.getSeparator(uri.scheme, uri.authority) === '\\');
            const updateBreadcrumbs = () => {
                this.domNode.classList.toggle('relative-path', model.isRelative());
                const showIcons = this._cfShowIcons.getValue();
                const options = {
                    ...this._options,
                    showFileIcons: this._options.showFileIcons && showIcons,
                    showSymbolIcons: this._options.showSymbolIcons && showIcons
                };
                const items = model.getElements().map(element => element instanceof breadcrumbsModel_1.FileElement ? new FileItem(model, element, options, this._labels, this._hoverDelegate) : new OutlineItem(model, element, options));
                if (items.length === 0) {
                    this._widget.setEnabled(false);
                    this._widget.setItems([new class extends breadcrumbsWidget_1.BreadcrumbsItem {
                            render(container) {
                                container.innerText = (0, nls_1.localize)('empty', "no elements");
                            }
                            equals(other) {
                                return other === this;
                            }
                            dispose() {
                            }
                        }]);
                }
                else {
                    this._widget.setEnabled(true);
                    this._widget.setItems(items);
                    this._widget.reveal(items[items.length - 1]);
                }
            };
            const listener = model.onDidUpdate(updateBreadcrumbs);
            const configListener = this._cfShowIcons.onDidChange(updateBreadcrumbs);
            updateBreadcrumbs();
            this._breadcrumbsDisposables.clear();
            this._breadcrumbsDisposables.add(listener);
            this._breadcrumbsDisposables.add((0, lifecycle_1.toDisposable)(() => this._model.clear()));
            this._breadcrumbsDisposables.add(configListener);
            this._breadcrumbsDisposables.add((0, lifecycle_1.toDisposable)(() => this._widget.setItems([])));
            const updateScrollbarSizing = () => {
                const sizing = this._cfTitleScrollbarSizing.getValue() ?? 'default';
                this._widget.setHorizontalScrollbarSize(BreadcrumbsControl_1.SCROLLBAR_SIZES[sizing]);
            };
            updateScrollbarSizing();
            const updateScrollbarSizeListener = this._cfTitleScrollbarSizing.onDidChange(updateScrollbarSizing);
            this._breadcrumbsDisposables.add(updateScrollbarSizeListener);
            // close picker on hide/update
            this._breadcrumbsDisposables.add({
                dispose: () => {
                    if (this._breadcrumbsPickerShowing) {
                        this._contextViewService.hideContextView({ source: this });
                    }
                }
            });
            return wasHidden !== this.isHidden();
        }
        _onFocusEvent(event) {
            if (event.item && this._breadcrumbsPickerShowing) {
                this._breadcrumbsPickerIgnoreOnceItem = undefined;
                this._widget.setSelection(event.item);
            }
        }
        _onSelectEvent(event) {
            if (!event.item) {
                return;
            }
            if (event.item === this._breadcrumbsPickerIgnoreOnceItem) {
                this._breadcrumbsPickerIgnoreOnceItem = undefined;
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                return;
            }
            const { element } = event.item;
            this._editorGroup.focus();
            const group = this._getEditorGroup(event.payload);
            if (group !== undefined) {
                // reveal the item
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                this._revealInEditor(event, element, group);
                return;
            }
            if (this._cfUseQuickPick.getValue()) {
                // using quick pick
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                this._quickInputService.quickAccess.show(element instanceof breadcrumbsModel_1.OutlineElement2 ? '@' : '');
                return;
            }
            // show picker
            let picker;
            let pickerAnchor;
            this._contextViewService.showContextView({
                render: (parent) => {
                    if (event.item instanceof FileItem) {
                        picker = this._instantiationService.createInstance(breadcrumbsPicker_1.BreadcrumbsFilePicker, parent, event.item.model.resource);
                    }
                    else if (event.item instanceof OutlineItem) {
                        picker = this._instantiationService.createInstance(breadcrumbsPicker_1.BreadcrumbsOutlinePicker, parent, event.item.model.resource);
                    }
                    const selectListener = picker.onWillPickElement(() => this._contextViewService.hideContextView({ source: this, didPick: true }));
                    const zoomListener = pixelRatio_1.PixelRatio.getInstance(dom.getWindow(this.domNode)).onDidChange(() => this._contextViewService.hideContextView({ source: this }));
                    const focusTracker = dom.trackFocus(parent);
                    const blurListener = focusTracker.onDidBlur(() => {
                        this._breadcrumbsPickerIgnoreOnceItem = this._widget.isDOMFocused() ? event.item : undefined;
                        this._contextViewService.hideContextView({ source: this });
                    });
                    this._breadcrumbsPickerShowing = true;
                    this._updateCkBreadcrumbsActive();
                    return (0, lifecycle_1.combinedDisposable)(picker, selectListener, zoomListener, focusTracker, blurListener);
                },
                getAnchor: () => {
                    if (!pickerAnchor) {
                        const window = dom.getWindow(this.domNode);
                        const maxInnerWidth = window.innerWidth - 8 /*a little less the full widget*/;
                        let maxHeight = Math.min(window.innerHeight * 0.7, 300);
                        const pickerWidth = Math.min(maxInnerWidth, Math.max(240, maxInnerWidth / 4.17));
                        const pickerArrowSize = 8;
                        let pickerArrowOffset;
                        const data = dom.getDomNodePagePosition(event.node.firstChild);
                        const y = data.top + data.height + pickerArrowSize;
                        if (y + maxHeight >= window.innerHeight) {
                            maxHeight = window.innerHeight - y - 30 /* room for shadow and status bar*/;
                        }
                        let x = data.left;
                        if (x + pickerWidth >= maxInnerWidth) {
                            x = maxInnerWidth - pickerWidth;
                        }
                        if (event.payload instanceof mouseEvent_1.StandardMouseEvent) {
                            const maxPickerArrowOffset = pickerWidth - 2 * pickerArrowSize;
                            pickerArrowOffset = event.payload.posx - x;
                            if (pickerArrowOffset > maxPickerArrowOffset) {
                                x = Math.min(maxInnerWidth - pickerWidth, x + pickerArrowOffset - maxPickerArrowOffset);
                                pickerArrowOffset = maxPickerArrowOffset;
                            }
                        }
                        else {
                            pickerArrowOffset = (data.left + (data.width * 0.3)) - x;
                        }
                        picker.show(element, maxHeight, pickerWidth, pickerArrowSize, Math.max(0, pickerArrowOffset));
                        pickerAnchor = { x, y };
                    }
                    return pickerAnchor;
                },
                onHide: (data) => {
                    if (!data?.didPick) {
                        picker.restoreViewState();
                    }
                    this._breadcrumbsPickerShowing = false;
                    this._updateCkBreadcrumbsActive();
                    if (data?.source === this) {
                        this._widget.setFocused(undefined);
                        this._widget.setSelection(undefined);
                    }
                    picker.dispose();
                }
            });
        }
        _updateCkBreadcrumbsActive() {
            const value = this._widget.isDOMFocused() || this._breadcrumbsPickerShowing;
            this._ckBreadcrumbsActive.set(value);
        }
        async _revealInEditor(event, element, group, pinned = false) {
            if (element instanceof breadcrumbsModel_1.FileElement) {
                if (element.kind === files_1.FileKind.FILE) {
                    await this._editorService.openEditor({ resource: element.uri, options: { pinned } }, group);
                }
                else {
                    // show next picker
                    const items = this._widget.getItems();
                    const idx = items.indexOf(event.item);
                    this._widget.setFocused(items[idx + 1]);
                    this._widget.setSelection(items[idx + 1], BreadcrumbsControl_1.Payload_Pick);
                }
            }
            else {
                element.outline.reveal(element, { pinned }, group === editorService_1.SIDE_GROUP, false);
            }
        }
        _getEditorGroup(data) {
            if (data === BreadcrumbsControl_1.Payload_RevealAside) {
                return editorService_1.SIDE_GROUP;
            }
            else if (data === BreadcrumbsControl_1.Payload_Reveal) {
                return editorService_1.ACTIVE_GROUP;
            }
            else {
                return undefined;
            }
        }
    };
    exports.BreadcrumbsControl = BreadcrumbsControl;
    exports.BreadcrumbsControl = BreadcrumbsControl = BreadcrumbsControl_1 = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, contextView_1.IContextViewService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, quickInput_1.IQuickInputService),
        __param(7, files_1.IFileService),
        __param(8, editorService_1.IEditorService),
        __param(9, label_1.ILabelService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, breadcrumbs_1.IBreadcrumbsService)
    ], BreadcrumbsControl);
    let BreadcrumbsControlFactory = class BreadcrumbsControlFactory {
        get control() { return this._control; }
        get onDidEnablementChange() { return this._onDidEnablementChange.event; }
        get onDidVisibilityChange() { return this._onDidVisibilityChange.event; }
        constructor(_container, _editorGroup, _options, configurationService, _instantiationService, fileService) {
            this._container = _container;
            this._editorGroup = _editorGroup;
            this._options = _options;
            this._instantiationService = _instantiationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._controlDisposables = new lifecycle_1.DisposableStore();
            this._onDidEnablementChange = this._disposables.add(new event_1.Emitter());
            this._onDidVisibilityChange = this._disposables.add(new event_1.Emitter());
            const config = this._disposables.add(breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(configurationService));
            this._disposables.add(config.onDidChange(() => {
                const value = config.getValue();
                if (!value && this._control) {
                    this._controlDisposables.clear();
                    this._control = undefined;
                    this._onDidEnablementChange.fire();
                }
                else if (value && !this._control) {
                    this._control = this.createControl();
                    this._control.update();
                    this._onDidEnablementChange.fire();
                }
            }));
            if (config.getValue()) {
                this._control = this.createControl();
            }
            this._disposables.add(fileService.onDidChangeFileSystemProviderRegistrations(e => {
                if (this._control?.model && this._control.model.resource.scheme !== e.scheme) {
                    // ignore if the scheme of the breadcrumbs resource is not affected
                    return;
                }
                if (this._control?.update()) {
                    this._onDidEnablementChange.fire();
                }
            }));
        }
        createControl() {
            const control = this._controlDisposables.add(this._instantiationService.createInstance(BreadcrumbsControl, this._container, this._options, this._editorGroup));
            this._controlDisposables.add(control.onDidVisibilityChange(() => this._onDidVisibilityChange.fire()));
            return control;
        }
        dispose() {
            this._disposables.dispose();
            this._controlDisposables.dispose();
        }
    };
    exports.BreadcrumbsControlFactory = BreadcrumbsControlFactory;
    exports.BreadcrumbsControlFactory = BreadcrumbsControlFactory = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, files_1.IFileService)
    ], BreadcrumbsControlFactory);
    //#region commands
    // toggle command
    (0, actions_1.registerAction2)(class ToggleBreadcrumb extends actions_1.Action2 {
        constructor() {
            super({
                id: 'breadcrumbs.toggle',
                title: {
                    ...(0, nls_1.localize2)('cmd.toggle', "Toggle Breadcrumbs"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miBreadcrumbs', comment: ['&& denotes a mnemonic'] }, "Toggle &&Breadcrumbs"),
                },
                category: actionCommonCategories_1.Categories.View,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.equals('config.breadcrumbs.enabled', true),
                    title: (0, nls_1.localize)('cmd.toggle2', "Toggle Breadcrumbs"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miBreadcrumbs2', comment: ['&& denotes a mnemonic'] }, "Toggle &&Breadcrumbs")
                },
                menu: [
                    { id: actions_1.MenuId.CommandPalette },
                    { id: actions_1.MenuId.MenubarAppearanceMenu, group: '4_editor', order: 2 },
                    { id: actions_1.MenuId.NotebookToolbar, group: 'notebookLayout', order: 2 },
                    { id: actions_1.MenuId.StickyScrollContext },
                    { id: actions_1.MenuId.NotebookStickyScrollContext, group: 'notebookView', order: 2 }
                ]
            });
        }
        run(accessor) {
            const config = accessor.get(configuration_1.IConfigurationService);
            const value = breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config).getValue();
            breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config).updateValue(!value);
        }
    });
    // focus/focus-and-select
    function focusAndSelectHandler(accessor, select) {
        // find widget and focus/select
        const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
        const widget = breadcrumbs.getWidget(groups.activeGroup.id);
        if (widget) {
            const item = (0, arrays_1.tail)(widget.getItems());
            widget.setFocused(item);
            if (select) {
                widget.setSelection(item, BreadcrumbsControl.Payload_Pick);
            }
        }
    }
    (0, actions_1.registerAction2)(class FocusAndSelectBreadcrumbs extends actions_1.Action2 {
        constructor() {
            super({
                id: 'breadcrumbs.focusAndSelect',
                title: (0, nls_1.localize2)('cmd.focusAndSelect', "Focus and Select Breadcrumbs"),
                precondition: BreadcrumbsControl.CK_BreadcrumbsVisible,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 89 /* KeyCode.Period */,
                    when: BreadcrumbsControl.CK_BreadcrumbsPossible,
                },
                f1: true
            });
        }
        run(accessor, ...args) {
            focusAndSelectHandler(accessor, true);
        }
    });
    (0, actions_1.registerAction2)(class FocusBreadcrumbs extends actions_1.Action2 {
        constructor() {
            super({
                id: 'breadcrumbs.focus',
                title: (0, nls_1.localize2)('cmd.focus', "Focus Breadcrumbs"),
                precondition: BreadcrumbsControl.CK_BreadcrumbsVisible,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 85 /* KeyCode.Semicolon */,
                    when: BreadcrumbsControl.CK_BreadcrumbsPossible,
                },
                f1: true
            });
        }
        run(accessor, ...args) {
            focusAndSelectHandler(accessor, false);
        }
    });
    // this commands is only enabled when breadcrumbs are
    // disabled which it then enables and focuses
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.toggleToOn',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 89 /* KeyCode.Period */,
        when: contextkey_1.ContextKeyExpr.not('config.breadcrumbs.enabled'),
        handler: async (accessor) => {
            const instant = accessor.get(instantiation_1.IInstantiationService);
            const config = accessor.get(configuration_1.IConfigurationService);
            // check if enabled and iff not enable
            const isEnabled = breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config);
            if (!isEnabled.getValue()) {
                await isEnabled.updateValue(true);
                await (0, async_1.timeout)(50); // hacky - the widget might not be ready yet...
            }
            return instant.invokeFunction(focusAndSelectHandler, true);
        }
    });
    // navigation
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusNext',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 17 /* KeyCode.RightArrow */,
        secondary: [2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */],
        mac: {
            primary: 17 /* KeyCode.RightArrow */,
            secondary: [512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */],
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusNext();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusPrevious',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 15 /* KeyCode.LeftArrow */,
        secondary: [2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */],
        mac: {
            primary: 15 /* KeyCode.LeftArrow */,
            secondary: [512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */],
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusPrev();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusNextWithPicker',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
        primary: 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */,
        mac: {
            primary: 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive, listService_1.WorkbenchListFocusContextKey),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusNext();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusPreviousWithPicker',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
        primary: 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */,
        mac: {
            primary: 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive, listService_1.WorkbenchListFocusContextKey),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusPrev();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.selectFocused',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 3 /* KeyCode.Enter */,
        secondary: [18 /* KeyCode.DownArrow */],
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setSelection(widget.getFocused(), BreadcrumbsControl.Payload_Pick);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.revealFocused',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 10 /* KeyCode.Space */,
        secondary: [2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */],
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setSelection(widget.getFocused(), BreadcrumbsControl.Payload_Reveal);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.selectEditor',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
        primary: 9 /* KeyCode.Escape */,
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setFocused(undefined);
            widget.setSelection(undefined);
            groups.activeGroup.activeEditorPane?.focus();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.revealFocusedFromTreeAside',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive, listService_1.WorkbenchListFocusContextKey),
        handler(accessor) {
            const editors = accessor.get(editorService_1.IEditorService);
            const lists = accessor.get(listService_1.IListService);
            const tree = lists.lastFocusedList;
            if (!(tree instanceof listService_1.WorkbenchDataTree) && !(tree instanceof listService_1.WorkbenchAsyncDataTree)) {
                return;
            }
            const element = tree.getFocus()[0];
            if (uri_1.URI.isUri(element?.resource)) {
                // IFileStat: open file in editor
                return editors.openEditor({
                    resource: element.resource,
                    options: { pinned: true }
                }, editorService_1.SIDE_GROUP);
            }
            // IOutline: check if this the outline and iff so reveal element
            const input = tree.getInput();
            if (input && typeof input.outlineKind === 'string') {
                return input.reveal(element, {
                    pinned: true,
                    preserveFocus: false
                }, true, false);
            }
        }
    });
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWRjcnVtYnNDb250cm9sLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvYnJlYWRjcnVtYnNDb250cm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwQ2hHLE1BQU0sV0FBWSxTQUFRLG1DQUFlO1FBSXhDLFlBQ1UsS0FBdUIsRUFDdkIsT0FBd0IsRUFDeEIsT0FBbUM7WUFFNUMsS0FBSyxFQUFFLENBQUM7WUFKQyxVQUFLLEdBQUwsS0FBSyxDQUFrQjtZQUN2QixZQUFPLEdBQVAsT0FBTyxDQUFpQjtZQUN4QixZQUFPLEdBQVAsT0FBTyxDQUE0QjtZQUw1QixpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBUXRELENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM3QixDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQXNCO1lBQzVCLElBQUksQ0FBQyxDQUFDLEtBQUssWUFBWSxXQUFXLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTztnQkFDcEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEtBQUssS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhO2dCQUMxRCxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsS0FBSyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQztRQUNqRSxDQUFDO1FBRUQsTUFBTSxDQUFDLFNBQXNCO1lBQzVCLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9B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