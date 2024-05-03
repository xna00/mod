/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/contrib/snippet/browser/snippetParser", "vs/editor/contrib/snippet/browser/snippetSession", "vs/editor/contrib/suggest/browser/suggestController", "vs/base/common/observable", "vs/editor/common/core/textEdit", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/editor/contrib/inlineCompletions/browser/singleTextEdit"], function (require, exports, event_1, lifecycle_1, position_1, range_1, languages_1, snippetParser_1, snippetSession_1, suggestController_1, observable_1, textEdit_1, arrays_1, arraysFind_1, singleTextEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestItemInfo = exports.SuggestWidgetAdaptor = void 0;
    class SuggestWidgetAdaptor extends lifecycle_1.Disposable {
        get selectedItem() {
            return this._selectedItem;
        }
        constructor(editor, suggestControllerPreselector, checkModelVersion, onWillAccept) {
            super();
            this.editor = editor;
            this.suggestControllerPreselector = suggestControllerPreselector;
            this.checkModelVersion = checkModelVersion;
            this.onWillAccept = onWillAccept;
            this.isSuggestWidgetVisible = false;
            this.isShiftKeyPressed = false;
            this._isActive = false;
            this._currentSuggestItemInfo = undefined;
            this._selectedItem = (0, observable_1.observableValue)(this, undefined);
            // See the command acceptAlternativeSelectedSuggestion that is bound to shift+tab
            this._register(editor.onKeyDown(e => {
                if (e.shiftKey && !this.isShiftKeyPressed) {
                    this.isShiftKeyPressed = true;
                    this.update(this._isActive);
                }
            }));
            this._register(editor.onKeyUp(e => {
                if (e.shiftKey && this.isShiftKeyPressed) {
                    this.isShiftKeyPressed = false;
                    this.update(this._isActive);
                }
            }));
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            if (suggestController) {
                this._register(suggestController.registerSelector({
                    priority: 100,
                    select: (model, pos, suggestItems) => {
                        (0, observable_1.transaction)(tx => this.checkModelVersion(tx));
                        const textModel = this.editor.getModel();
                        if (!textModel) {
                            // Should not happen
                            return -1;
                        }
                        const i = this.suggestControllerPreselector();
                        const itemToPreselect = i ? (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(i, textModel) : undefined;
                        if (!itemToPreselect) {
                            return -1;
                        }
                        const position = position_1.Position.lift(pos);
                        const candidates = suggestItems
                            .map((suggestItem, index) => {
                            const suggestItemInfo = SuggestItemInfo.fromSuggestion(suggestController, textModel, position, suggestItem, this.isShiftKeyPressed);
                            const suggestItemTextEdit = (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(suggestItemInfo.toSingleTextEdit(), textModel);
                            const valid = (0, singleTextEdit_1.singleTextEditAugments)(itemToPreselect, suggestItemTextEdit);
                            return { index, valid, prefixLength: suggestItemTextEdit.text.length, suggestItem };
                        })
                            .filter(item => item && item.valid && item.prefixLength > 0);
                        const result = (0, arraysFind_1.findFirstMaxBy)(candidates, (0, arrays_1.compareBy)(s => s.prefixLength, arrays_1.numberComparator));
                        return result ? result.index : -1;
                    }
                }));
                let isBoundToSuggestWidget = false;
                const bindToSuggestWidget = () => {
                    if (isBoundToSuggestWidget) {
                        return;
                    }
                    isBoundToSuggestWidget = true;
                    this._register(suggestController.widget.value.onDidShow(() => {
                        this.isSuggestWidgetVisible = true;
                        this.update(true);
                    }));
                    this._register(suggestController.widget.value.onDidHide(() => {
                        this.isSuggestWidgetVisible = false;
                        this.update(false);
                    }));
                    this._register(suggestController.widget.value.onDidFocus(() => {
                        this.isSuggestWidgetVisible = true;
                        this.update(true);
                    }));
                };
                this._register(event_1.Event.once(suggestController.model.onDidTrigger)(e => {
                    bindToSuggestWidget();
                }));
                this._register(suggestController.onWillInsertSuggestItem(e => {
                    const position = this.editor.getPosition();
                    const model = this.editor.getModel();
                    if (!position || !model) {
                        return undefined;
                    }
                    const suggestItemInfo = SuggestItemInfo.fromSuggestion(suggestController, model, position, e.item, this.isShiftKeyPressed);
                    this.onWillAccept(suggestItemInfo);
                }));
            }
            this.update(this._isActive);
        }
        update(newActive) {
            const newInlineCompletion = this.getSuggestItemInfo();
            if (this._isActive !== newActive || !suggestItemInfoEquals(this._currentSuggestItemInfo, newInlineCompletion)) {
                this._isActive = newActive;
                this._currentSuggestItemInfo = newInlineCompletion;
                (0, observable_1.transaction)(tx => {
                    /** @description Update state from suggest widget */
                    this.checkModelVersion(tx);
                    this._selectedItem.set(this._isActive ? this._currentSuggestItemInfo : undefined, tx);
                });
            }
        }
        getSuggestItemInfo() {
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            if (!suggestController || !this.isSuggestWidgetVisible) {
                return undefined;
            }
            const focusedItem = suggestController.widget.value.getFocusedItem();
            const position = this.editor.getPosition();
            const model = this.editor.getModel();
            if (!focusedItem || !position || !model) {
                return undefined;
            }
            return SuggestItemInfo.fromSuggestion(suggestController, model, position, focusedItem.item, this.isShiftKeyPressed);
        }
        stopForceRenderingAbove() {
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            suggestController?.stopForceRenderingAbove();
        }
        forceRenderingAbove() {
            const suggestController = suggestController_1.SuggestController.get(this.editor);
            suggestController?.forceRenderingAbove();
        }
    }
    exports.SuggestWidgetAdaptor = SuggestWidgetAdaptor;
    class SuggestItemInfo {
        static fromSuggestion(suggestController, model, position, item, toggleMode) {
            let { insertText } = item.completion;
            let isSnippetText = false;
            if (item.completion.insertTextRules & 4 /* CompletionItemInsertTextRule.InsertAsSnippet */) {
                const snippet = new snippetParser_1.SnippetParser().parse(insertText);
                if (snippet.children.length < 100) {
                    // Adjust whitespace is expensive.
                    snippetSession_1.SnippetSession.adjustWhitespace(model, position, true, snippet);
                }
                insertText = snippet.toString();
                isSnippetText = true;
            }
            const info = suggestController.getOverwriteInfo(item, toggleMode);
            return new SuggestItemInfo(range_1.Range.fromPositions(position.delta(0, -info.overwriteBefore), position.delta(0, Math.max(info.overwriteAfter, 0))), insertText, item.completion.kind, isSnippetText);
        }
        constructor(range, insertText, completionItemKind, isSnippetText) {
            this.range = range;
            this.insertText = insertText;
            this.completionItemKind = completionItemKind;
            this.isSnippetText = isSnippetText;
        }
        equals(other) {
            return this.range.equalsRange(other.range)
                && this.insertText === other.insertText
                && this.completionItemKind === other.completionItemKind
                && this.isSnippetText === other.isSnippetText;
        }
        toSelectedSuggestionInfo() {
            return new languages_1.SelectedSuggestionInfo(this.range, this.insertText, this.completionItemKind, this.isSnippetText);
        }
        toSingleTextEdit() {
            return new textEdit_1.SingleTextEdit(this.range, this.insertText);
        }
    }
    exports.SuggestItemInfo = SuggestItemInfo;
    function suggestItemInfoEquals(a, b) {
        if (a === b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return a.equals(b);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdFdpZGdldElubGluZUNvbXBsZXRpb25Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5saW5lQ29tcGxldGlvbnMvYnJvd3Nlci9zdWdnZXN0V2lkZ2V0SW5saW5lQ29tcGxldGlvblByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1CaEcsTUFBYSxvQkFBcUIsU0FBUSxzQkFBVTtRQVFuRCxJQUFXLFlBQVk7WUFDdEIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7UUFFRCxZQUNrQixNQUFtQixFQUNuQiw0QkFBOEQsRUFDOUQsaUJBQTZDLEVBQzdDLFlBQTZDO1lBRTlELEtBQUssRUFBRSxDQUFDO1lBTFMsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNuQixpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQWtDO1lBQzlELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBNEI7WUFDN0MsaUJBQVksR0FBWixZQUFZLENBQWlDO1lBZnZELDJCQUFzQixHQUFZLEtBQUssQ0FBQztZQUN4QyxzQkFBaUIsR0FBRyxLQUFLLENBQUM7WUFDMUIsY0FBUyxHQUFHLEtBQUssQ0FBQztZQUNsQiw0QkFBdUIsR0FBZ0MsU0FBUyxDQUFDO1lBRXhELGtCQUFhLEdBQUcsSUFBQSw0QkFBZSxFQUFDLElBQUksRUFBRSxTQUF3QyxDQUFDLENBQUM7WUFjaEcsaUZBQWlGO1lBQ2pGLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbkMsSUFBSSxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQzNDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENB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