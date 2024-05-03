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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/inlineEdit/browser/ghostTextWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "vs/base/common/cancellation", "vs/editor/contrib/inlineCompletions/browser/ghostText", "vs/platform/commands/common/commands", "vs/editor/contrib/inlineEdit/browser/inlineEditHintsWidget", "vs/base/browser/dom", "vs/platform/configuration/common/configuration", "vs/base/common/errors"], function (require, exports, lifecycle_1, observable_1, editOperation_1, position_1, range_1, ghostTextWidget_1, contextkey_1, instantiation_1, languages_1, languageFeatures_1, cancellation_1, ghostText_1, commands_1, inlineEditHintsWidget_1, dom_1, configuration_1, errors_1) {
    "use strict";
    var InlineEditController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineEditController = exports.InlineEditWidget = void 0;
    class InlineEditWidget {
        constructor(widget, edit) {
            this.widget = widget;
            this.edit = edit;
        }
        dispose() {
            this.widget.dispose();
        }
    }
    exports.InlineEditWidget = InlineEditWidget;
    let InlineEditController = class InlineEditController extends lifecycle_1.Disposable {
        static { InlineEditController_1 = this; }
        static { this.ID = 'editor.contrib.inlineEditController'; }
        static { this.inlineEditVisibleKey = 'inlineEditVisible'; }
        static { this.inlineEditVisibleContext = new contextkey_1.RawContextKey(InlineEditController_1.inlineEditVisibleKey, false); }
        static { this.cursorAtInlineEditKey = 'cursorAtInlineEdit'; }
        static { this.cursorAtInlineEditContext = new contextkey_1.RawContextKey(InlineEditController_1.cursorAtInlineEditKey, false); }
        static get(editor) {
            return editor.getContribution(InlineEditController_1.ID);
        }
        constructor(editor, instantiationService, contextKeyService, languageFeaturesService, _commandService, _configurationService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.languageFeaturesService = languageFeaturesService;
            this._commandService = _commandService;
            this._configurationService = _configurationService;
            this._isVisibleContext = InlineEditController_1.inlineEditVisibleContext.bindTo(this.contextKeyService);
            this._isCursorAtInlineEditContext = InlineEditController_1.cursorAtInlineEditContext.bindTo(this.contextKeyService);
            this._currentEdit = this._register((0, observable_1.disposableObservableValue)(this, undefined));
            this._isAccepting = (0, observable_1.observableValue)(this, false);
            this._enabled = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(63 /* EditorOption.inlineEdit */).enabled);
            this._fontFamily = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(63 /* EditorOption.inlineEdit */).fontFamily);
            this._backgroundColoring = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(63 /* EditorOption.inlineEdit */).backgroundColoring);
            //Automatically request inline edit when the content was changed
            //Cancel the previous request if there is one
            //Remove the previous ghost text
            const modelChangedSignal = (0, observable_1.observableSignalFromEvent)('InlineEditController.modelContentChangedSignal', editor.onDidChangeModelContent);
            this._register((0, observable_1.autorun)(reader => {
                /** @description InlineEditController.modelContentChanged model */
                if (!this._enabled.read(reader)) {
                    return;
                }
                modelChangedSignal.read(reader);
                if (this._isAccepting.read(reader)) {
                    return;
                }
                this.getInlineEdit(editor, true);
            }));
            //Check if the cursor is at the ghost text
            const cursorPosition = (0, observable_1.observableFromEvent)(editor.onDidChangeCursorPosition, () => editor.getPosition());
            this._register((0, observable_1.autorun)(reader => {
                /** @description InlineEditController.cursorPositionChanged model */
                if (!this._enabled.read(reader)) {
                    return;
                }
                const pos = cursorPosition.read(reader);
                if (pos) {
                    this.checkCursorPosition(pos);
                }
            }));
            //Perform stuff when the current edit has changed
            this._register((0, observable_1.autorun)((reader) => {
                /** @description InlineEditController.update model */
                const currentEdit = this._currentEdit.read(reader);
                this._isCursorAtInlineEditContext.set(false);
                if (!currentEdit) {
                    this._isVisibleContext.set(false);
                    return;
                }
                this._isVisibleContext.set(true);
                const pos = editor.getPosition();
                if (pos) {
                    this.checkCursorPosition(pos);
                }
            }));
            //Clear suggestions on lost focus
            const editorBlurSingal = (0, observable_1.observableSignalFromEvent)('InlineEditController.editorBlurSignal', editor.onDidBlurEditorWidget);
            this._register((0, observable_1.autorun)(async (reader) => {
                /** @description InlineEditController.editorBlur */
                if (!this._enabled.read(reader)) {
                    return;
                }
                editorBlurSingal.read(reader);
                // This is a hidden setting very useful for debugging
                if (this._configurationService.getValue('editor.experimentalInlineEdit.keepOnBlur') || editor.getOption(63 /* EditorOption.inlineEdit */).keepOnBlur) {
                    return;
                }
                this._currentRequestCts?.dispose(true);
                this._currentRequestCts = undefined;
                await this.clear(false);
            }));
            //Invoke provider on focus
            const editorFocusSignal = (0, observable_1.observableSignalFromEvent)('InlineEditController.editorFocusSignal', editor.onDidFocusEditorText);
            this._register((0, observable_1.autorun)(reader => {
                /** @description InlineEditController.editorFocus */
                if (!this._enabled.read(reader)) {
                    return;
                }
                editorFocusSignal.read(reader);
                this.getInlineEdit(editor, true);
            }));
            //handle changes of font setting
            const styleElement = this._register((0, dom_1.createStyleSheet2)());
            this._register((0, observable_1.autorun)(reader => {
                const fontFamily = this._fontFamily.read(reader);
                styleElement.setStyle(fontFamily === '' || fontFamily === 'default' ? `` : `
.monaco-editor .inline-edit-decoration,
.monaco-editor .inline-edit-decoration-preview,
.monaco-editor .inline-edit {
	font-family: ${fontFamily};
}`);
            }));
            this._register(new inlineEditHintsWidget_1.InlineEditHintsWidget(this.editor, this._currentEdit, this.instantiationService));
        }
        checkCursorPosition(position) {
            if (!this._currentEdit) {
                this._isCursorAtInlineEditContext.set(false);
                return;
            }
            const gt = this._currentEdit.get()?.edit;
            if (!gt) {
                this._isCursorAtInlineEditContext.set(false);
                return;
            }
            this._isCursorAtInlineEditContext.set(range_1.Range.containsPosition(gt.range, position));
        }
        validateInlineEdit(editor, edit) {
            //Multiline inline replacing edit must replace whole lines
            if (edit.text.includes('\n') && edit.range.startLineNumber !== edit.range.endLineNumber && edit.range.startColumn !== edit.range.endColumn) {
                const firstColumn = edit.range.startColumn;
                if (firstColumn !== 1) {
                    return false;
                }
                const lastLine = edit.range.endLineNumber;
                const lastColumn = edit.range.endColumn;
                const lineLength = editor.getModel()?.getLineLength(lastLine) ?? 0;
                if (lastColumn !== lineLength + 1) {
                    return false;
                }
            }
            return true;
        }
        async fetchInlineEdit(editor, auto) {
            if (this._currentRequestCts) {
                this._currentRequestCts.dispose(true);
            }
            const model = editor.getModel();
            if (!model) {
                return;
            }
            const modelVersion = model.getVersionId();
            const providers = this.languageFeaturesService.inlineEditProvider.all(model);
            if (providers.length === 0) {
                return;
            }
            const provider = providers[0];
            this._currentRequestCts = new cancellation_1.CancellationTokenSource();
            const token = this._currentRequestCts.token;
            const triggerKind = auto ? languages_1.InlineEditTriggerKind.Automatic : languages_1.InlineEditTriggerKind.Invoke;
            const shouldDebounce = auto;
            if (shouldDebounce) {
                await wait(50, token);
            }
            if (token.isCancellationRequested || model.isDisposed() || model.getVersionId() !== modelVersion) {
                return;
            }
            const edit = await provider.provideInlineEdit(model, { triggerKind }, token);
            if (!edit) {
                return;
            }
            if (token.isCancellationRequested || model.isDisposed() || model.getVersionId() !== modelVersion) {
                return;
            }
            if (!this.validateInlineEdit(editor, edit)) {
                return;
            }
            return edit;
        }
        async getInlineEdit(editor, auto) {
            this._isCursorAtInlineEditContext.set(false);
            await this.clear();
            const edit = await this.fetchInlineEdit(editor, auto);
            if (!edit) {
                return;
            }
            const line = edit.range.endLineNumber;
            const column = edit.range.endColumn;
            const ghostText = new ghostText_1.GhostText(line, [new ghostText_1.GhostTextPart(column, edit.text, false)]);
            const instance = this.instantiationService.createInstance(ghostTextWidget_1.GhostTextWidget, this.editor, {
                ghostText: (0, observable_1.constObservable)(ghostText),
                minReservedLineCount: (0, observable_1.constObservable)(0),
                targetTextModel: (0, observable_1.constObservable)(this.editor.getModel() ?? undefined),
                range: (0, observable_1.constObservable)(edit.range),
                backgroundColoring: this._backgroundColoring
            });
            this._currentEdit.set(new InlineEditWidget(instance, edit), undefined);
        }
        async trigger() {
            await this.getInlineEdit(this.editor, false);
        }
        async jumpBack() {
            if (!this._jumpBackPosition) {
                return;
            }
            this.editor.setPosition(this._jumpBackPosition);
            //if position is outside viewports, scroll to it
            this.editor.revealPositionInCenterIfOutsideViewport(this._jumpBackPosition);
        }
        async accept() {
            this._isAccepting.set(true, undefined);
            const data = this._currentEdit.get()?.edit;
            if (!data) {
                return;
            }
            //It should only happen in case of last line suggestion
            let text = data.text;
            if (data.text.startsWith('\n')) {
                text = data.text.substring(1);
            }
            this.editor.pushUndoStop();
            this.editor.executeEdits('acceptCurrent', [editOperation_1.EditOperation.replace(range_1.Range.lift(data.range), text)]);
            if (data.accepted) {
                await this._commandService
                    .executeCommand(data.accepted.id, ...(data.accepted.arguments || []))
                    .then(undefined, errors_1.onUnexpectedExternalError);
            }
            this.freeEdit(data);
            (0, observable_1.transaction)((tx) => {
                this._currentEdit.set(undefined, tx);
                this._isAccepting.set(false, tx);
            });
        }
        jumpToCurrent() {
            this._jumpBackPosition = this.editor.getSelection()?.getStartPosition();
            const data = this._currentEdit.get()?.edit;
            if (!data) {
                return;
            }
            const position = position_1.Position.lift({ lineNumber: data.range.startLineNumber, column: data.range.startColumn });
            this.editor.setPosition(position);
            //if position is outside viewports, scroll to it
            this.editor.revealPositionInCenterIfOutsideViewport(position);
        }
        async clear(sendRejection = true) {
            const edit = this._currentEdit.get()?.edit;
            if (edit && edit?.rejected && sendRejection) {
                await this._commandService
                    .executeCommand(edit.rejected.id, ...(edit.rejected.arguments || []))
                    .then(undefined, errors_1.onUnexpectedExternalError);
            }
            if (edit) {
                this.freeEdit(edit);
            }
            this._currentEdit.set(undefined, undefined);
        }
        freeEdit(edit) {
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            const providers = this.languageFeaturesService.inlineEditProvider.all(model);
            if (providers.length === 0) {
                return;
            }
            providers[0].freeInlineEdit(edit);
        }
        shouldShowHoverAt(range) {
            const currentEdit = this._currentEdit.get();
            if (!currentEdit) {
                return false;
            }
            const edit = currentEdit.edit;
            const model = currentEdit.widget.model;
            const overReplaceRange = range_1.Range.containsPosition(edit.range, range.getStartPosition()) || range_1.Range.containsPosition(edit.range, range.getEndPosition());
            if (overReplaceRange) {
                return true;
            }
            const ghostText = model.ghostText.get();
            if (ghostText) {
                return ghostText.parts.some(p => range.containsPosition(new position_1.Position(ghostText.lineNumber, p.column)));
            }
            return false;
        }
        shouldShowHoverAtViewZone(viewZoneId) {
            return this._currentEdit.get()?.widget.ownsViewZone(viewZoneId) ?? false;
        }
    };
    exports.InlineEditController = InlineEditController;
    exports.InlineEditController = InlineEditController = InlineEditController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, commands_1.ICommandService),
        __param(5, configuration_1.IConfigurationService)
    ], InlineEditController);
    function wait(ms, cancellationToken) {
        return new Promise(resolve => {
            let d = undefined;
            const handle = setTimeout(() => {
                if (d) {
                    d.dispose();
                }
                resolve();
            }, ms);
            if (cancellationToken) {
                d = cancellationToken.onCancellationRequested(() => {
                    clearTimeout(handle);
                    if (d) {
                        d.dispose();
                    }
                    resolve();
                });
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lRWRpdENvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGluZUVkaXQvYnJvd3Nlci9pbmxpbmVFZGl0Q29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0JoRyxNQUFhLGdCQUFnQjtRQUM1QixZQUE0QixNQUF1QixFQUFrQixJQUFpQjtZQUExRCxXQUFNLEdBQU4sTUFBTSxDQUFpQjtZQUFrQixTQUFJLEdBQUosSUFBSSxDQUFhO1FBQUksQ0FBQztRQUUzRixPQUFPO1lBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDO0tBQ0Q7SUFORCw0Q0FNQztJQUVNLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7O2lCQUM1QyxPQUFFLEdBQUcscUNBQXFDLEFBQXhDLENBQXlDO2lCQUUzQix5QkFBb0IsR0FBRyxtQkFBbUIsQUFBdEIsQ0FBdUI7aUJBQzNDLDZCQUF3QixHQUFHLElBQUksMEJBQWEsQ0FBVSxzQkFBb0IsQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQUFBL0UsQ0FBZ0Y7aUJBR3hHLDBCQUFxQixHQUFHLG9CQUFvQixBQUF2QixDQUF3QjtpQkFDN0MsOEJBQXlCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHNCQUFvQixDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxBQUFoRixDQUFpRjtRQUcxSCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQ3BDLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBdUIsc0JBQW9CLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQWFELFlBQ2lCLE1BQW1CLEVBQ1osb0JBQTRELEVBQy9ELGlCQUFzRCxF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