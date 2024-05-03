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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/editor/contrib/gotoSymbol/browser/link/clickLinkGesture", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/contextkey/common/contextkey", "../goToCommands", "../goToSymbol", "vs/editor/common/services/languageFeatures", "vs/editor/common/model/textModel", "vs/css!./goToDefinitionAtPosition"], function (require, exports, async_1, errors_1, htmlContent_1, lifecycle_1, editorState_1, editorExtensions_1, range_1, language_1, resolverService_1, clickLinkGesture_1, peekView_1, nls, contextkey_1, goToCommands_1, goToSymbol_1, languageFeatures_1, textModel_1) {
    "use strict";
    var GotoDefinitionAtPositionEditorContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoDefinitionAtPositionEditorContribution = void 0;
    let GotoDefinitionAtPositionEditorContribution = class GotoDefinitionAtPositionEditorContribution {
        static { GotoDefinitionAtPositionEditorContribution_1 = this; }
        static { this.ID = 'editor.contrib.gotodefinitionatposition'; }
        static { this.MAX_SOURCE_PREVIEW_LINES = 8; }
        constructor(editor, textModelResolverService, languageService, languageFeaturesService) {
            this.textModelResolverService = textModelResolverService;
            this.languageService = languageService;
            this.languageFeaturesService = languageFeaturesService;
            this.toUnhook = new lifecycle_1.DisposableStore();
            this.toUnhookForKeyboard = new lifecycle_1.DisposableStore();
            this.currentWordAtPosition = null;
            this.previousPromise = null;
            this.editor = editor;
            this.linkDecorations = this.editor.createDecorationsCollection();
            const linkGesture = new clickLinkGesture_1.ClickLinkGesture(editor);
            this.toUnhook.add(linkGesture);
            this.toUnhook.add(linkGesture.onMouseMoveOrRelevantKeyDown(([mouseEvent, keyboardEvent]) => {
                this.startFindDefinitionFromMouse(mouseEvent, keyboardEvent ?? undefined);
            }));
            this.toUnhook.add(linkGesture.onExecute((mouseEvent) => {
                if (this.isEnabled(mouseEvent)) {
                    this.gotoDefinition(mouseEvent.target.position, mouseEvent.hasSideBySideModifier)
                        .catch((error) => {
                        (0, errors_1.onUnexpectedError)(error);
                    })
                        .finally(() => {
                        this.removeLinkDecorations();
                    });
                }
            }));
            this.toUnhook.add(linkGesture.onCancel(() => {
                this.removeLinkDecorations();
                this.currentWordAtPosition = null;
            }));
        }
        static get(editor) {
            return editor.getContribution(GotoDefinitionAtPositionEditorContribution_1.ID);
        }
        async startFindDefinitionFromCursor(position) {
            // For issue: https://github.com/microsoft/vscode/issues/46257
            // equivalent to mouse move with meta/ctrl key
            // First find the definition and add decorations
            // to the editor to be shown with the content hover widget
            await this.startFindDefinition(position);
            // Add listeners for editor cursor move and key down events
            // Dismiss the "extended" editor decorations when the user hides
            // the hover widget. There is no event for the widget itself so these
            // serve as a best effort. After removing the link decorations, the hover
            // widget is clean and will only show declarations per next request.
            this.toUnhookForKeyboard.add(this.editor.onDidChangeCursorPosition(() => {
                this.currentWordAtPosition = null;
                this.removeLinkDecorations();
                this.toUnhookForKeyboard.clear();
            }));
            this.toUnhookForKeyboard.add(this.editor.onKeyDown((e) => {
                if (e) {
                    this.currentWordAtPosition = null;
                    this.removeLinkDecorations();
                    this.toUnhookForKeyboard.clear();
                }
            }));
        }
        startFindDefinitionFromMouse(mouseEvent, withKey) {
            // check if we are active and on a content widget
            if (mouseEvent.target.type === 9 /* MouseTargetType.CONTENT_WIDGET */ && this.linkDecorations.length > 0) {
                return;
            }
            if (!this.editor.hasModel() || !this.isEnabled(mouseEvent, withKey)) {
                this.currentWordAtPosition = null;
                this.removeLinkDecorations();
                return;
            }
            const position = mouseEvent.target.position;
            this.startFindDefinition(position);
        }
        async startFindDefinition(position) {
            // Dispose listeners for updating decorations when using keyboard to show definition hover
            this.toUnhookForKeyboard.clear();
            // Find word at mouse position
            const word = position ? this.editor.getModel()?.getWordAtPosition(position) : null;
            if (!word) {
                this.currentWordAtPosition = null;
                this.removeLinkDecorations();
                return;
            }
            // Return early if word at position is still the same
            if (this.currentWordAtPosition && this.currentWordAtPosition.startColumn === word.startColumn && this.currentWordAtPosition.endColumn === word.endColumn && this.currentWordAtPosition.word === word.word) {
                return;
            }
            this.currentWordAtPosition = word;
            // Find definition and decorate word if found
            const state = new editorState_1.EditorState(this.editor, 4 /* CodeEditorStateFlag.Position */ | 1 /* CodeEditorStateFlag.Value */ | 2 /* CodeEditorStateFlag.Selection */ | 8 /* CodeEditorStateFlag.Scroll */);
            if (this.previousPromise) {
                this.previousPromise.cancel();
                this.previousPromise = null;
            }
            this.previousPromise = (0, async_1.createCancelablePromise)(token => this.findDefinition(position, token));
            let results;
            try {
                results = await this.previousPromise;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
                return;
            }
            if (!results || !results.length || !state.validate(this.editor)) {
                this.removeLinkDecorations();
                return;
            }
            const linkRange = results[0].originSelectionRange
                ? range_1.Range.lift(results[0].originSelectionRange)
                : new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
            // Multiple results
            if (results.length > 1) {
                let combinedRange = linkRange;
                for (const { originSelectionRange } of results) {
                    if (originSelectionRange) {
                        combinedRange = range_1.Range.plusRange(combinedRange, originSelectionRange);
                    }
                }
                this.addDecoration(combinedRange, new htmlContent_1.MarkdownString().appendText(nls.localize('multipleResults', "Click to show {0} definitions.", results.length)));
            }
            else {
                // Single result
                const result = results[0];
                if (!result.uri) {
                    return;
                }
                this.textModelResolverService.createModelReference(result.uri).then(ref => {
                    if (!ref.object || !ref.object.textEditorModel) {
                        ref.dispose();
                        return;
                    }
                    const { object: { textEditorModel } } = ref;
                    const { startLineNumber } = result.range;
                    if (startLineNumber < 1 || startLineNumber > textEditorModel.getLineCount()) {
                        // invalid range
                        ref.dispose();
                        return;
                    }
                    const previewValue = this.getPreviewValue(textEditorModel, startLineNumber, result);
                    const languageId = this.languageService.guessLanguageIdByFilepathOrFirstLine(textEditorModel.uri);
                    this.addDecoration(linkRange, previewValue ? new htmlContent_1.MarkdownString().appendCodeblock(languageId ? languageId : '', previewValue) : undefined);
                    ref.dispose();
                });
            }
        }
        getPreviewValue(textEditorModel, startLineNumber, result) {
            let rangeToUse = result.range;
            const numberOfLinesInRange = rangeToUse.endLineNumber - rangeToUse.startLineNumber;
            if (numberOfLinesInRange >= GotoDefinitionAtPositionEditorContribution_1.MAX_SOURCE_PREVIEW_LINES) {
                rangeToUse = this.getPreviewRangeBasedOnIndentation(textEditorModel, startLineNumber);
            }
            const previewValue = this.stripIndentationFromPreviewRange(textEditorModel, startLineNumber, rangeToUse);
            return previewValue;
        }
        stripIndentationFromPreviewRange(textEditorModel, startLineNumber, previewRange) {
            const startIndent = textEditorModel.getLineFirstNonWhitespaceColumn(startLineNumber);
            let minIndent = startIndent;
            for (let endLineNumber = startLineNumber + 1; endLineNumber < previewRange.endLineNumber; endLineNumber++) {
                const endIndent = textEditorModel.getLineFirstNonWhitespaceColumn(endLineNumber);
                minIndent = Math.min(minIndent, endIndent);
            }
            const previewValue = textEditorModel.getValueInRange(previewRange).replace(new RegExp(`^\\s{${minIndent - 1}}`, 'gm'), '').trim();
            return previewValue;
        }
        getPreviewRangeBasedOnIndentation(textEditorModel, startLineNumber) {
            const startIndent = textEditorModel.getLineFirstNonWhitespaceColumn(startLineNumber);
            const maxLineNumber = Math.min(textEditorModel.getLineCount(), startLineNumber + GotoDefinitionAtPositionEditorContribution_1.MAX_SOURCE_PREVIEW_LINES);
            let endLineNumber = startLineNumber + 1;
            for (; endLineNumber < maxLineNumber; endLineNumber++) {
                const endIndent = textEditorModel.getLineFirstNonWhitespaceColumn(endLineNumber);
                if (startIndent === endIndent) {
                    break;
                }
            }
            return new range_1.Range(startLineNumber, 1, endLineNumber + 1, 1);
        }
        addDecoration(range, hoverMessage) {
            const newDecorations = {
                range: range,
                options: {
                    description: 'goto-definition-link',
                    inlineClassName: 'goto-definition-link',
                    hoverMessage
                }
            };
            this.linkDecorations.set([newDecorations]);
        }
        removeLinkDecorations() {
            this.linkDecorations.clear();
        }
        isEnabled(mouseEvent, withKey) {
            return this.editor.hasModel()
                && mouseEvent.isLeftClick
                && mouseEvent.isNoneOrSingleMouseDown
                && mouseEvent.target.type === 6 /* MouseTargetType.CONTENT_TEXT */
                && !(mouseEvent.target.detail.injectedText?.options instanceof textModel_1.ModelDecorationInjectedTextOptions)
                && (mouseEvent.hasTriggerModifier || (withKey ? withKey.keyCodeIsTriggerKey : false))
                && this.languageFeaturesService.definitionProvider.has(this.editor.getModel());
        }
        findDefinition(position, token) {
            const model = this.editor.getModel();
            if (!model) {
                return Promise.resolve(null);
            }
            return (0, goToSymbol_1.getDefinitionsAtPosition)(this.languageFeaturesService.definitionProvider, model, position, token);
        }
        gotoDefinition(position, openToSide) {
            this.editor.setPosition(position);
            return this.editor.invokeWithinContext((accessor) => {
                const canPeek = !openToSide && this.editor.getOption(88 /* EditorOption.definitionLinkOpensInPeek */) && !this.isInPeekEditor(accessor);
                const action = new goToCommands_1.DefinitionAction({ openToSide, openInPeek: canPeek, muteMessage: true }, { title: { value: '', original: '' }, id: '', precondition: undefined });
                return action.run(accessor);
            });
        }
        isInPeekEditor(accessor) {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            return peekView_1.PeekContext.inPeekEditor.getValue(contextKeyService);
        }
        dispose() {
            this.toUnhook.dispose();
            this.toUnhookForKeyboard.dispose();
        }
    };
    exports.GotoDefinitionAtPositionEditorContribution = GotoDefinitionAtPositionEditorContribution;
    exports.GotoDefinitionAtPositionEditorContribution = GotoDefinitionAtPositionEditorContribution = GotoDefinitionAtPositionEditorContribution_1 = __decorate([
        __param(1, resolverService_1.ITextModelService),
        __param(2, language_1.ILanguageService),
        __param(3, languageFeatures_1.ILanguageFeaturesService)
    ], GotoDefinitionAtPositionEditorContribution);
    (0, editorExtensions_1.registerEditorContribution)(GotoDefinitionAtPositionEditorContribution.ID, GotoDefinitionAtPositionEditorContribution, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29Ub0RlZmluaXRpb25BdFBvc2l0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9nb3RvU3ltYm9sL2Jyb3dzZXIvbGluay9nb1RvRGVmaW5pdGlvbkF0UG9zaXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQStCekYsSUFBTSwwQ0FBMEMsR0FBaEQsTUFBTSwwQ0FBMEM7O2lCQUUvQixPQUFFLEdBQUcseUNBQXlDLEFBQTVDLENBQTZDO2lCQUN0RCw2QkFBd0IsR0FBRyxDQUFDLEFBQUosQ0FBSztRQVM3QyxZQUNDLE1BQW1CLEVBQ0Esd0JBQTRELEVBQzdELGVBQWtELEVBQzFDLHVCQUFrRTtZQUZ4RCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQW1CO1lBQzVDLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUN6Qiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBVjVFLGFBQVEsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNqQyx3QkFBbUIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUVyRCwwQkFBcUIsR0FBMkIsSUFBSSxDQUFDO1lBQ3JELG9CQUFlLEdBQW9ELElBQUksQ0FBQztZQVEvRSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQUVqRSxNQUFNLFdBQVcsR0FBRyxJQUFJLG1DQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRS9CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyw0QkFBNEIs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