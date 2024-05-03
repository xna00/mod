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
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/dictation/editorDictation", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/snippet/browser/snippetController2", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/platform/theme/common/themeService", "vs/platform/notification/common/notification", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures", "vs/base/common/numbers"], function (require, exports, editorExtensions_1, codeEditorService_1, codeEditorWidget_1, contextkey_1, instantiation_1, commands_1, menuPreventer_1, editorDictation_1, contextmenu_1, suggestController_1, snippetController2_1, tabCompletion_1, themeService_1, notification_1, accessibility_1, commentContextKeys_1, languageConfigurationRegistry_1, languageFeatures_1, numbers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleCommentEditor = exports.MAX_EDITOR_HEIGHT = exports.MIN_EDITOR_HEIGHT = exports.ctxCommentEditorFocused = void 0;
    exports.calculateEditorHeight = calculateEditorHeight;
    exports.ctxCommentEditorFocused = new contextkey_1.RawContextKey('commentEditorFocused', false);
    exports.MIN_EDITOR_HEIGHT = 5 * 18;
    exports.MAX_EDITOR_HEIGHT = 25 * 18;
    let SimpleCommentEditor = class SimpleCommentEditor extends codeEditorWidget_1.CodeEditorWidget {
        constructor(domElement, options, scopedContextKeyService, parentThread, instantiationService, codeEditorService, commandService, themeService, notificationService, accessibilityService, languageConfigurationService, languageFeaturesService) {
            const codeEditorWidgetOptions = {
                contributions: [
                    { id: menuPreventer_1.MenuPreventer.ID, ctor: menuPreventer_1.MenuPreventer, instantiation: 2 /* EditorContributionInstantiation.BeforeFirstInteraction */ },
                    { id: contextmenu_1.ContextMenuController.ID, ctor: contextmenu_1.ContextMenuController, instantiation: 2 /* EditorContributionInstantiation.BeforeFirstInteraction */ },
                    { id: suggestController_1.SuggestController.ID, ctor: suggestController_1.SuggestController, instantiation: 0 /* EditorContributionInstantiation.Eager */ },
                    { id: snippetController2_1.SnippetController2.ID, ctor: snippetController2_1.SnippetController2, instantiation: 4 /* EditorContributionInstantiation.Lazy */ },
                    { id: tabCompletion_1.TabCompletionController.ID, ctor: tabCompletion_1.TabCompletionController, instantiation: 0 /* EditorContributionInstantiation.Eager */ }, // eager because it needs to define a context key
                    { id: editorDictation_1.EditorDictation.ID, ctor: editorDictation_1.EditorDictation, instantiation: 4 /* EditorContributionInstantiation.Lazy */ }
                ]
            };
            super(domElement, options, codeEditorWidgetOptions, instantiationService, codeEditorService, commandService, scopedContextKeyService, themeService, notificationService, accessibilityService, languageConfigurationService, languageFeaturesService);
            this._commentEditorFocused = exports.ctxCommentEditorFocused.bindTo(scopedContextKeyService);
            this._commentEditorEmpty = commentContextKeys_1.CommentContextKeys.commentIsEmpty.bindTo(scopedContextKeyService);
            this._commentEditorEmpty.set(!this.getModel()?.getValueLength());
            this._parentThread = parentThread;
            this._register(this.onDidFocusEditorWidget(_ => this._commentEditorFocused.set(true)));
            this._register(this.onDidChangeModelContent(e => this._commentEditorEmpty.set(!this.getModel()?.getValueLength())));
            this._register(this.onDidBlurEditorWidget(_ => this._commentEditorFocused.reset()));
        }
        getParentThread() {
            return this._parentThread;
        }
        _getActions() {
            return editorExtensions_1.EditorExtensionsRegistry.getEditorActions();
        }
        static getEditorOptions(configurationService) {
            return {
                wordWrap: 'on',
                glyphMargin: false,
                lineNumbers: 'off',
                folding: false,
                selectOnLineNumbers: false,
                scrollbar: {
                    vertical: 'visible',
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                    alwaysConsumeMouseWheel: false
                },
                overviewRulerLanes: 2,
                lineDecorationsWidth: 0,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'none',
                fixedOverflowWidgets: true,
                acceptSuggestionOnEnter: 'smart',
                minimap: {
                    enabled: false
                },
                autoClosingBrackets: configurationService.getValue('editor.autoClosingBrackets'),
                quickSuggestions: false,
                accessibilitySupport: configurationService.getValue('editor.accessibilitySupport'),
            };
        }
    };
    exports.SimpleCommentEditor = SimpleCommentEditor;
    exports.SimpleCommentEditor = SimpleCommentEditor = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, codeEditorService_1.ICodeEditorService),
        __param(6, commands_1.ICommandService),
        __param(7, themeService_1.IThemeService),
        __param(8, notification_1.INotificationService),
        __param(9, accessibility_1.IAccessibilityService),
        __param(10, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(11, languageFeatures_1.ILanguageFeaturesService)
    ], SimpleCommentEditor);
    function calculateEditorHeight(parentEditor, editor, currentHeight) {
        const layoutInfo = editor.getLayoutInfo();
        const lineHeight = editor.getOption(67 /* EditorOption.lineHeight */);
        const contentHeight = (editor._getViewModel()?.getLineCount() * lineHeight) ?? editor.getContentHeight(); // Can't just call getContentHeight() because it returns an incorrect, large, value when the editor is first created.
        if ((contentHeight > layoutInfo.height) ||
            (contentHeight < layoutInfo.height && currentHeight > exports.MIN_EDITOR_HEIGHT)) {
            const linesToAdd = Math.ceil((contentHeight - layoutInfo.height) / lineHeight);
            const proposedHeight = layoutInfo.height + (lineHeight * linesToAdd);
            return (0, numbers_1.clamp)(proposedHeight, exports.MIN_EDITOR_HEIGHT, (0, numbers_1.clamp)(parentEditor.getLayoutInfo().height - 90, exports.MIN_EDITOR_HEIGHT, exports.MAX_EDITOR_HEIGHT));
        }
        return currentHeight;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlQ29tbWVudEVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9zaW1wbGVDb21tZW50RWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVIaEcsc0RBV0M7SUF0R1ksUUFBQSx1QkFBdUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDcEYsUUFBQSxpQkFBaUIsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzNCLFFBQUEsaUJBQWlCLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQU1sQyxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLG1DQUFnQjtRQUt4RCxZQUNDLFVBQXVCLEVBQ3ZCLE9BQXVCLEVBQ3ZCLHVCQUEyQyxFQUMzQyxZQUFrQyxFQUNYLG9CQUEyQyxFQUM5QyxpQkFBcUMsRUFDeEMsY0FBK0IsRUFDakMsWUFBMkIsRUFDcEIsbUJBQXlDLEVBQ3hDLG9CQUEyQyxFQUNuQyw0QkFBMkQsRUFDaEUsdUJBQWlEO1lBRTNFLE1BQU0sdUJBQXVCLEdBQTZCO2dCQUN6RCxhQUFhLEVBQW9DO29CQUNoRCxFQUFFLEVBQUUsRUFBRSw2QkFBYSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsNkJBQWEsRUFBRSxhQUFhLGdFQUF3RCxFQUFFO29CQUNwSCxFQUFFLEVBQUUsRUFBRSxtQ0FBcUIsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLG1DQUFxQixFQUFFLGFBQWEsZ0VBQXdELEVBQUU7b0JBQ3BJLEVBQUUsRUFBRSxFQUFFLHFDQUFpQixDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUscUNBQWlCLEVBQUUsYUFBYSwrQ0FBdUMsRUFBRTtv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