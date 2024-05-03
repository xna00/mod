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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/editorExtensions", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/core/selection", "vs/editor/contrib/codelens/browser/codelensController", "vs/editor/contrib/folding/browser/folding", "vs/platform/actions/browser/toolbar", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/editor/editor", "vs/workbench/contrib/mergeEditor/browser/utils"], function (require, exports, dom_1, event_1, lifecycle_1, observable_1, editorExtensions_1, codeEditorWidget_1, selection_1, codelensController_1, folding_1, toolbar_1, instantiation_1, editor_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TitleMenu = exports.CodeEditorView = void 0;
    exports.createSelectionsAutorun = createSelectionsAutorun;
    class CodeEditorView extends lifecycle_1.Disposable {
        updateOptions(newOptions) {
            this.editor.updateOptions(newOptions);
        }
        constructor(instantiationService, viewModel, configurationService) {
            super();
            this.instantiationService = instantiationService;
            this.viewModel = viewModel;
            this.configurationService = configurationService;
            this.model = this.viewModel.map(m => /** @description model */ m?.model);
            this.htmlElements = (0, dom_1.h)('div.code-view', [
                (0, dom_1.h)('div.header@header', [
                    (0, dom_1.h)('span.title@title'),
                    (0, dom_1.h)('span.description@description'),
                    (0, dom_1.h)('span.detail@detail'),
                    (0, dom_1.h)('span.toolbar@toolbar'),
                ]),
                (0, dom_1.h)('div.container', [
                    (0, dom_1.h)('div.gutter@gutterDiv'),
                    (0, dom_1.h)('div@editor'),
                ]),
            ]);
            this._onDidViewChange = new event_1.Emitter();
            this.view = {
                element: this.htmlElements.root,
                minimumWidth: editor_1.DEFAULT_EDITOR_MIN_DIMENSIONS.width,
                maximumWidth: editor_1.DEFAULT_EDITOR_MAX_DIMENSIONS.width,
                minimumHeight: editor_1.DEFAULT_EDITOR_MIN_DIMENSIONS.height,
                maximumHeight: editor_1.DEFAULT_EDITOR_MAX_DIMENSIONS.height,
                onDidChange: this._onDidViewChange.event,
                layout: (width, height, top, left) => {
                    (0, utils_1.setStyle)(this.htmlElements.root, { width, height, top, left });
                    this.editor.layout({
                        width: width - this.htmlElements.gutterDiv.clientWidth,
                        height: height - this.htmlElements.header.clientHeight,
                    });
                }
                // preferredWidth?: number | undefined;
                // preferredHeight?: number | undefined;
                // priority?: LayoutPriority | undefined;
                // snap?: boolean | undefined;
            };
            this.checkboxesVisible = (0, utils_1.observableConfigValue)('mergeEditor.showCheckboxes', false, this.configurationService);
            this.showDeletionMarkers = (0, utils_1.observableConfigValue)('mergeEditor.showDeletionMarkers', true, this.configurationService);
            this.useSimplifiedDecorations = (0, utils_1.observableConfigValue)('mergeEditor.useSimplifiedDecorations', false, this.configurationService);
            this.editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.htmlElements.editor, {}, {
                contributions: this.getEditorContributions(),
            });
            this.isFocused = (0, observable_1.observableFromEvent)(event_1.Event.any(this.editor.onDidBlurEditorWidget, this.editor.onDidFocusEditorWidget), () => /** @description editor.hasWidgetFocus */ this.editor.hasWidgetFocus());
            this.cursorPosition = (0, observable_1.observableFromEvent)(this.editor.onDidChangeCursorPosition, () => /** @description editor.getPosition */ this.editor.getPosition());
            this.selection = (0, observable_1.observableFromEvent)(this.editor.onDidChangeCursorSelection, () => /** @description editor.getSelections */ this.editor.getSelections());
            this.cursorLineNumber = this.cursorPosition.map(p => /** @description cursorPosition.lineNumber */ p?.lineNumber);
        }
        getEditorContributions() {
            return editorExtensions_1.EditorExtensionsRegistry.getEditorContributions().filter(c => c.id !== folding_1.FoldingController.ID && c.id !== codelensController_1.CodeLensContribution.ID);
        }
    }
    exports.CodeEditorView = CodeEditorView;
    function createSelectionsAutorun(codeEditorView, translateRange) {
        const selections = (0, observable_1.derived)(reader => {
            /** @description selections */
            const viewModel = codeEditorView.viewModel.read(reader);
            if (!viewModel) {
                return [];
            }
            const baseRange = viewModel.selectionInBase.read(reader);
            if (!baseRange || baseRange.sourceEditor === codeEditorView) {
                return [];
            }
            return baseRange.rangesInBase.map(r => translateRange(r, viewModel));
        });
        return (0, observable_1.autorun)(reader => {
            /** @description set selections */
            const ranges = selections.read(reader);
            if (ranges.length === 0) {
                return;
            }
            codeEditorView.editor.setSelections(ranges.map(r => new selection_1.Selection(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn)));
        });
    }
    let TitleMenu = class TitleMenu extends lifecycle_1.Disposable {
        constructor(menuId, targetHtmlElement, instantiationService) {
            super();
            const toolbar = instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, targetHtmlElement, menuId, {
                menuOptions: { renderShortTitle: true },
                toolbarOptions: { primaryGroup: (g) => g === 'primary' }
            });
            this._store.add(toolbar);
        }
    };
    exports.TitleMenu = TitleMenu;
    exports.TitleMenu = TitleMenu = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], TitleMenu);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUVkaXRvclZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvdmlldy9lZGl0b3JzL2NvZGVFZGl0b3JWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTRHaEcsMERBeUJDO0lBL0dELE1BQXNCLGNBQWUsU0FBUSxzQkFBVTtRQW1EL0MsYUFBYSxDQUFDLFVBQW9DO1lBQ3hELElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFtQkQsWUFDa0Isb0JBQTJDLEVBQzVDLFNBQXdELEVBQ3ZELG9CQUEyQztZQUU1RCxLQUFLLEVBQUUsQ0FBQztZQUpTLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDNUMsY0FBUyxHQUFULFNBQVMsQ0FBK0M7WUFDdkQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQTFFcEQsVUFBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMseUJBQXlCLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTFELGlCQUFZLEdBQUcsSUFBQSxPQUFDLEVBQUMsZUFBZSxFQUFFO2dCQUNwRCxJQUFBLE9BQUMsRUFBQyxtQkFBbUIsRUFBRTtvQkFDdEIsSUFBQSxPQUFDLEVBQUMsa0JBQWtCLENBQUM7b0JBQ3JCLElBQUEsT0FBQyxFQUFDLDhCQUE4QixDQUFDO29CQUNqQyxJQUFBLE9BQUMsRUFBQyxvQkFBb0IsQ0FBQztvQkFDdkIsSUFBQSxPQUFDLEVBQUMsc0JBQXNCLENBQUM7aUJBQ3pCLENBQUM7Z0JBQ0YsSUFBQSxPQUFDLEVBQUMsZUFBZSxFQUFFO29CQUNsQixJQUFB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