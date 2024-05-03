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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/splitview/splitview", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/editor/contrib/gotoSymbol/browser/peek/referencesTree", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/theme/common/themeService", "vs/platform/undoRedo/common/undoRedo", "../referencesModel", "vs/css!./referencesWidget"], function (require, exports, dom, splitview_1, color_1, event_1, lifecycle_1, network_1, resources_1, embeddedCodeEditorWidget_1, range_1, textModel_1, languageConfigurationRegistry_1, modesRegistry_1, language_1, resolverService_1, referencesTree_1, peekView, nls, instantiation_1, keybinding_1, label_1, listService_1, themeService_1, undoRedo_1, referencesModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReferenceWidget = exports.LayoutData = void 0;
    class DecorationsManager {
        static { this.DecorationOptions = textModel_1.ModelDecorationOptions.register({
            description: 'reference-decoration',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'reference-decoration'
        }); }
        constructor(_editor, _model) {
            this._editor = _editor;
            this._model = _model;
            this._decorations = new Map();
            this._decorationIgnoreSet = new Set();
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._callOnModelChange = new lifecycle_1.DisposableStore();
            this._callOnDispose.add(this._editor.onDidChangeModel(() => this._onModelChanged()));
            this._onModelChanged();
        }
        dispose() {
            this._callOnModelChange.dispose();
            this._callOnDispose.dispose();
            this.removeDecorations();
        }
        _onModelChanged() {
            this._callOnModelChange.clear();
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            for (const ref of this._model.references) {
                if (ref.uri.toString() === model.uri.toString()) {
                    this._addDecorations(ref.parent);
                    return;
                }
            }
        }
        _addDecorations(reference) {
            if (!this._editor.hasModel()) {
                return;
            }
            this._callOnModelChange.add(this._editor.getModel().onDidChangeDecorations(() => this._onDecorationChanged()));
            const newDecorations = [];
            const newDecorationsActualIndex = [];
            for (let i = 0, len = reference.children.length; i < len; i++) {
                const oneReference = reference.children[i];
                if (this._decorationIgnoreSet.has(oneReference.id)) {
                    continue;
                }
                if (oneReference.uri.toString() !== this._editor.getModel().uri.toString()) {
                    continue;
                }
                newDecorations.push({
                    range: oneReference.range,
                    options: DecorationsManager.DecorationOptions
                });
                newDecorationsActualIndex.push(i);
            }
            this._editor.changeDecorations((changeAccessor) => {
                const decorations = changeAccessor.deltaDecorations([], newDecorations);
                for (let i = 0; i < decorations.length; i++) {
                    this._decorations.set(decorations[i], reference.children[newDecorationsActualIndex[i]]);
                }
            });
        }
        _onDecorationChanged() {
            const toRemove = [];
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            for (const [decorationId, reference] of this._decorations) {
                const newRange = model.getDecorationRange(decorationId);
                if (!newRange) {
                    continue;
                }
                let ignore = false;
                if (range_1.Range.equalsRange(newRange, reference.range)) {
                    continue;
                }
                if (range_1.Range.spansMultipleLines(newRange)) {
                    ignore = true;
                }
                else {
                    const lineLength = reference.range.endColumn - reference.range.startColumn;
                    const newLineLength = newRange.endColumn - newRange.startColumn;
                    if (lineLength !== newLineLength) {
                        ignore = true;
                    }
                }
                if (ignore) {
                    this._decorationIgnoreSet.add(reference.id);
                    toRemove.push(decorationId);
                }
                else {
                    reference.range = newRange;
                }
            }
            for (let i = 0, len = toRemove.length; i < len; i++) {
                this._decorations.delete(toRemove[i]);
            }
            this._editor.removeDecorations(toRemove);
        }
        removeDecorations() {
            this._editor.removeDecorations([...this._decorations.keys()]);
            this._decorations.clear();
        }
    }
    class LayoutData {
        constructor() {
            this.ratio = 0.7;
            this.heightInLines = 18;
        }
        static fromJSON(raw) {
            let ratio;
            let heightInLines;
            try {
                const data = JSON.parse(raw);
                ratio = data.ratio;
                heightInLines = data.heightInLines;
            }
            catch {
                //
            }
            return {
                ratio: ratio || 0.7,
                heightInLines: heightInLines || 18
            };
        }
    }
    exports.LayoutData = LayoutData;
    class ReferencesTree extends listService_1.WorkbenchAsyncDataTree {
    }
    /**
     * ZoneWidget that is shown inside the editor
     */
    let ReferenceWidget = class ReferenceWidget extends peekView.PeekViewWidget {
        constructor(editor, _defaultTreeKeyboardSupport, layoutData, themeService, _textModelResolverService, _instantiationService, _peekViewService, _uriLabel, _undoRedoService, _keybindingService, _languageService, _languageConfigurationService) {
            super(editor, { showFrame: false, showArrow: true, isResizeable: true, isAccessible: true, supportOnTitleClick: true }, _instantiationService);
            this._defaultTreeKeyboardSupport = _defaultTreeKeyboardSupport;
            this.layoutData = layoutData;
            this._textModelResolverService = _textModelResolverService;
            this._instantiationService = _instantiationService;
            this._peekViewService = _peekViewService;
            this._uriLabel = _uriLabel;
            this._undoRedoService = _undoRedoService;
            this._keybindingService = _keybindingService;
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            this._disposeOnNewModel = new lifecycle_1.DisposableStore();
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._onDidSelectReference = new event_1.Emitter();
            this.onDidSelectReference = this._onDidSelectReference.event;
            this._dim = new dom.Dimension(0, 0);
            this._applyTheme(themeService.getColorTheme());
            this._callOnDispose.add(themeService.onDidColorThemeChange(this._applyTheme.bind(this)));
            this._peekViewService.addExclusiveWidget(editor, this);
            this.create();
        }
        dispose() {
            this.setModel(undefined);
            this._callOnDispose.dispose();
            this._disposeOnNewModel.dispose();
            (0, lifecycle_1.dispose)(this._preview);
            (0, lifecycle_1.dispose)(this._previewNotAvailableMessage);
            (0, lifecycle_1.dispose)(this._tree);
            (0, lifecycle_1.dispose)(this._previewModelReference);
            this._splitView.dispose();
            super.dispose();
        }
        _applyTheme(theme) {
            const borderColor = theme.getColor(peekView.peekViewBorder) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor,
                headerBackgroundColor: theme.getColor(peekView.peekViewTitleBackground) || color_1.Color.transparent,
                primaryHeadingColor: theme.getColor(peekView.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(peekView.peekViewTitleInfoForeground)
            });
        }
        show(where) {
            super.show(where, this.layoutData.heightInLines || 18);
        }
        focusOnReferenceTree() {
            this._tree.domFocus();
        }
        focusOnPreviewEditor() {
            this._preview.focus();
        }
        isPreviewEditorFocused() {
            return this._preview.hasTextFocus();
        }
        _onTitleClick(e) {
            if (this._preview && this._preview.getModel()) {
                this._onDidSelectReference.fire({
                    element: this._getFocusedReference(),
                    kind: e.ctrlKey || e.metaKey || e.altKey ? 'side' : 'open',
                    source: 'title'
                });
            }
        }
        _fillBody(containerElement) {
            this.setCssClass('reference-zone-widget');
            // message pane
            this._messageContainer = dom.append(containerElement, dom.$('div.messages'));
            dom.hide(this._messageContainer);
            this._splitView = new splitview_1.SplitView(containerElement, { orientation: 1 /* Orientation.HORIZONTAL */ });
            // editor
            this._previewContainer = dom.append(containerElement, dom.$('div.preview.inline'));
            const options = {
                scrollBeyondLastLine: false,
                scrollbar: {
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                    alwaysConsumeMouseWheel: true
                },
                overviewRulerLanes: 2,
                fixedOverflowWidgets: true,
                minimap: {
                    enabled: false
                }
            };
            this._preview = this._instantiationService.createInstance(embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget, this._previewContainer, options, {}, this.editor);
            dom.hide(this._previewContainer);
            this._previewNotAvailableMessage = new textModel_1.TextModel(nls.localize('missingPreviewMessage', "no preview available"), modesRegistry_1.PLAINTEXT_LANGUAGE_ID, textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, null, this._undoRedoService, this._languageService, this._languageConfigurationService);
            // tree
            this._treeContainer = dom.append(containerElement, dom.$('div.ref-tree.inline'));
            const treeOptions = {
                keyboardSupport: this._defaultTreeKeyboardSupport,
                accessibilityProvider: new referencesTree_1.AccessibilityProvider(),
                keyboardNavigationLabelProvider: this._instantiationService.createInstance(referencesTree_1.StringRepresentationProvider),
                identityProvider: new referencesTree_1.IdentityProvider(),
                openOnSingleClick: true,
                selectionNavigation: true,
                overrideStyles: {
                    listBackground: peekView.peekViewResultsBackground
                }
            };
            if (this._defaultTreeKeyboardSupport) {
                // the tree will consume `Escape` and prevent the widget from closing
                this._callOnDispose.add(dom.addStandardDisposableListener(this._treeContainer, 'keydown', (e) => {
                    if (e.equals(9 /* KeyCode.Escape */)) {
                        this._keybindingService.dispatchEvent(e, e.target);
                        e.stopPropagation();
                    }
                }, true));
            }
            this._tree = this._instantiationService.createInstance(ReferencesTree, 'ReferencesWidget', this._treeContainer, new referencesTree_1.Delegate(), [
                this._instantiationService.createInstance(referencesTree_1.FileReferencesRenderer),
                this._instantiationService.createInstance(referencesTree_1.OneReferenceRenderer),
            ], this._instantiationService.createInstance(referencesTree_1.DataSource), treeOptions);
            // split stuff
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: this._previewContainer,
                minimumSize: 200,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    this._preview.layout({ height: this._dim.height, width });
                }
            }, splitview_1.Sizing.Distribute);
            this._splitView.addView({
                onDidChange: event_1.Event.None,
                element: this._treeContainer,
                minimumSize: 100,
                maximumSize: Number.MAX_VALUE,
                layout: (width) => {
                    this._treeContainer.style.height = `${this._dim.height}px`;
                    this._treeContainer.style.width = `${width}px`;
                    this._tree.layout(this._dim.height, width);
                }
            }, splitview_1.Sizing.Distribute);
            this._disposables.add(this._splitView.onDidSashChange(() => {
                if (this._dim.width) {
                    this.layoutData.ratio = this._splitView.getViewSize(0) / this._dim.width;
                }
            }, undefined));
            // listen on selection and focus
            const onEvent = (element, kind) => {
                if (element instanceof referencesModel_1.OneReference) {
                    if (kind === 'show') {
                        this._revealReference(element, false);
                    }
                    this._onDidSelectReference.fire({ element, kind, source: 'tree' });
                }
            };
            this._tree.onDidOpen(e => {
                if (e.sideBySide) {
                    onEvent(e.element, 'side');
                }
                else if (e.editorOptions.pinned) {
                    onEvent(e.element, 'goto');
                }
                else {
                    onEvent(e.element, 'show');
                }
            });
            dom.hide(this._treeContainer);
        }
        _onWidth(width) {
            if (this._dim) {
                this._doLayoutBody(this._dim.height, width);
            }
        }
        _doLayoutBody(heightInPixel, widthInPixel) {
            super._doLayoutBody(heightInPixel, widthInPixel);
            this._dim = new dom.Dimension(widthInPixel, heightInPixel);
            this.layoutData.heightInLines = this._viewZone ? this._viewZone.heightInLines : this.layoutData.heightInLines;
            this._splitView.layout(widthInPixel);
            this._splitView.resizeView(0, widthInPixel * this.layoutData.ratio);
        }
        setSelection(selection) {
            return this._revealReference(selection, true).then(() => {
                if (!this._model) {
                    // disposed
                    return;
                }
                // show in tree
                this._tree.setSelection([selection]);
                this._tree.setFocus([selection]);
            });
        }
        setModel(newModel) {
            // clean up
            this._disposeOnNewModel.clear();
            this._model = newModel;
            if (this._model) {
                return this._onNewModel();
            }
            return Promise.resolve();
        }
        _onNewModel() {
            if (!this._model) {
                return Promise.resolve(undefined);
            }
            if (this._model.isEmpty) {
                this.setTitle('');
                this._messageContainer.innerText = nls.localize('noResults', "No results");
                dom.show(this._messageContainer);
                return Promise.resolve(undefined);
            }
            dom.hide(this._messageContainer);
            this._decorationsManager = new DecorationsManager(this._preview, this._model);
            this._disposeOnNewModel.add(this._decorationsManager);
            // listen on model changes
            this._disposeOnNewModel.add(this._model.onDidChangeReferenceRange(reference => this._tree.rerender(reference)));
            // listen on editor
            this._disposeOnNewModel.add(this._preview.onMouseDown(e => {
                const { event, target } = e;
                if (event.detail !== 2) {
                    return;
                }
                const element = this._getFocusedReference();
                if (!element) {
                    return;
                }
                this._onDidSelectReference.fire({
                    element: { uri: element.uri, range: target.range },
                    kind: (event.ctrlKey || event.metaKey || event.altKey) ? 'side' : 'open',
                    source: 'editor'
                });
            }));
            // make sure things are rendered
            this.container.classList.add('results-loaded');
            dom.show(this._treeContainer);
            dom.show(this._previewContainer);
            this._splitView.layout(this._dim.width);
            this.focusOnReferenceTree();
            // pick input and a reference to begin with
            return this._tree.setInput(this._model.groups.length === 1 ? this._model.groups[0] : this._model);
        }
        _getFocusedReference() {
            const [element] = this._tree.getFocus();
            if (element instanceof referencesModel_1.OneReference) {
                return element;
            }
            else if (element instanceof referencesModel_1.FileReferences) {
                if (element.children.length > 0) {
                    return element.children[0];
                }
            }
            return undefined;
        }
        async revealReference(reference) {
            await this._revealReference(reference, false);
            this._onDidSelectReference.fire({ element: reference, kind: 'goto', source: 'tree' });
        }
        async _revealReference(reference, revealParent) {
            // check if there is anything to do...
            if (this._revealedReference === reference) {
                return;
            }
            this._revealedReference = reference;
            // Update widget header
            if (reference.uri.scheme !== network_1.Schemas.inMemory) {
                this.setTitle((0, resources_1.basenameOrAuthority)(reference.uri), this._uriLabel.getUriLabel((0, resources_1.dirname)(reference.uri)));
            }
            else {
                this.setTitle(nls.localize('peekView.alternateTitle', "References"));
            }
            const promise = this._textModelResolverService.createModelReference(reference.uri);
            if (this._tree.getInput() === reference.parent) {
                this._tree.reveal(reference);
            }
            else {
                if (revealParent) {
                    this._tree.reveal(reference.parent);
                }
                await this._tree.expand(reference.parent);
                this._tree.reveal(reference);
            }
            const ref = await promise;
            if (!this._model) {
                // disposed
                ref.dispose();
                return;
            }
            (0, lifecycle_1.dispose)(this._previewModelReference);
            // show in editor
            const model = ref.object;
            if (model) {
                const scrollType = this._preview.getModel() === model.textEditorModel ? 0 /* ScrollType.Smooth */ : 1 /* ScrollType.Immediate */;
                const sel = range_1.Range.lift(reference.range).collapseToStart();
                this._previewModelReference = ref;
                this._preview.setModel(model.textEditorModel);
                this._preview.setSelection(sel);
                this._preview.revealRangeInCenter(sel, scrollType);
            }
            else {
                this._preview.setModel(this._previewNotAvailableMessage);
                ref.dispose();
            }
        }
    };
    exports.ReferenceWidget = ReferenceWidget;
    exports.ReferenceWidget = ReferenceWidget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, peekView.IPeekViewService),
        __param(7, label_1.ILabelService),
        __param(8, undoRedo_1.IUndoRedoService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, language_1.ILanguageService),
        __param(11, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], ReferenceWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlc1dpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZ290b1N5bWJvbC9icm93c2VyL3BlZWsvcmVmZXJlbmNlc1dpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQ2hHLE1BQU0sa0JBQWtCO2lCQUVDLHNCQUFpQixHQUFHLGtDQUFzQixDQUFDLFFBQVEsQ0FBQztZQUMzRSxXQUFXLEVBQUUsc0JBQXNCO1lBQ25DLFVBQVUsNERBQW9EO1lBQzlELFNBQVMsRUFBRSxzQkFBc0I7U0FDakMsQ0FBQyxBQUp1QyxDQUl0QztRQU9ILFlBQW9CLE9BQW9CLEVBQVUsTUFBdUI7WUFBckQsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUFVLFdBQU0sR0FBTixNQUFNLENBQWlCO1lBTGpFLGlCQUFZLEdBQUcsSUFBSSxHQUFHLEVBQXdCLENBQUM7WUFDL0MseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQUNoQyxtQkFBYyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3ZDLHVCQUFrQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRzNELElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsaUJBQWlCLEVBQUUs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