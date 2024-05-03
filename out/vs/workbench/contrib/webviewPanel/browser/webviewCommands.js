/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/action/common/actionCommonCategories", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewEditor", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, editorContextKeys_1, nls, actions_1, contextkey_1, actionCommonCategories_1, webview_1, webviewEditor_1, webviewEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReloadWebviewAction = exports.WebViewEditorFindPreviousCommand = exports.WebViewEditorFindNextCommand = exports.HideWebViewEditorFindCommand = exports.ShowWebViewEditorFindWidgetAction = void 0;
    const webviewActiveContextKeyExpr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', webviewEditor_1.WebviewEditor.ID), editorContextKeys_1.EditorContextKeys.focus.toNegated() /* https://github.com/microsoft/vscode/issues/58668 */);
    class ShowWebViewEditorFindWidgetAction extends actions_1.Action2 {
        static { this.ID = 'editor.action.webvieweditor.showFind'; }
        static { this.LABEL = nls.localize('editor.action.webvieweditor.showFind', "Show find"); }
        constructor() {
            super({
                id: ShowWebViewEditorFindWidgetAction.ID,
                title: ShowWebViewEditorFindWidgetAction.LABEL,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(webviewActiveContextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_ENABLED),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            getActiveWebviewEditor(accessor)?.showFind();
        }
    }
    exports.ShowWebViewEditorFindWidgetAction = ShowWebViewEditorFindWidgetAction;
    class HideWebViewEditorFindCommand extends actions_1.Action2 {
        static { this.ID = 'editor.action.webvieweditor.hideFind'; }
        static { this.LABEL = nls.localize('editor.action.webvieweditor.hideFind', "Stop find"); }
        constructor() {
            super({
                id: HideWebViewEditorFindCommand.ID,
                title: HideWebViewEditorFindCommand.LABEL,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(webviewActiveContextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE),
                    primary: 9 /* KeyCode.Escape */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            getActiveWebviewEditor(accessor)?.hideFind();
        }
    }
    exports.HideWebViewEditorFindCommand = HideWebViewEditorFindCommand;
    class WebViewEditorFindNextCommand extends actions_1.Action2 {
        static { this.ID = 'editor.action.webvieweditor.findNext'; }
        static { this.LABEL = nls.localize('editor.action.webvieweditor.findNext', 'Find next'); }
        constructor() {
            super({
                id: WebViewEditorFindNextCommand.ID,
                title: WebViewEditorFindNextCommand.LABEL,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(webviewActiveContextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            getActiveWebviewEditor(accessor)?.runFindAction(false);
        }
    }
    exports.WebViewEditorFindNextCommand = WebViewEditorFindNextCommand;
    class WebViewEditorFindPreviousCommand extends actions_1.Action2 {
        static { this.ID = 'editor.action.webvieweditor.findPrevious'; }
        static { this.LABEL = nls.localize('editor.action.webvieweditor.findPrevious', 'Find previous'); }
        constructor() {
            super({
                id: WebViewEditorFindPreviousCommand.ID,
                title: WebViewEditorFindPreviousCommand.LABEL,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(webviewActiveContextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            getActiveWebviewEditor(accessor)?.runFindAction(true);
        }
    }
    exports.WebViewEditorFindPreviousCommand = WebViewEditorFindPreviousCommand;
    class ReloadWebviewAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.webview.reloadWebviewAction'; }
        static { this.LABEL = nls.localize2('refreshWebviewLabel', "Reload Webviews"); }
        constructor() {
            super({
                id: ReloadWebviewAction.ID,
                title: ReloadWebviewAction.LABEL,
                category: actionCommonCategories_1.Categories.Developer,
                menu: [{
                        id: actions_1.MenuId.CommandPalette
                    }]
            });
        }
        async run(accessor) {
            const webviewService = accessor.get(webview_1.IWebviewService);
            for (const webview of webviewService.webviews) {
                webview.reload();
            }
        }
    }
    exports.ReloadWebviewAction = ReloadWebviewAction;
    function getActiveWebviewEditor(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const activeEditor = editorService.activeEditor;
        return activeEditor instanceof webviewEditorInput_1.WebviewInput ? activeEditor.webview : undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0NvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3UGFuZWwvYnJvd3Nlci93ZWJ2aWV3Q29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQU0sMkJBQTJCLEdBQUcsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMkJBQWMsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLDZCQUFhLENBQUMsRUFBRSxDQUFDLEVBQUUscUNBQWlCLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLHNEQUFzRCxDQUFFLENBQUM7SUFFN00sTUFBYSxpQ0FBa0MsU0FBUSxpQkFBTztpQkFDdEMsT0FBRSxHQUFHLHNDQUFzQyxDQUFDO2lCQUM1QyxVQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVqRztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsaUNBQWlDLENBQUMsRUFBRTtnQkFDeEMsS0FBSyxFQUFFLGlDQUFpQyxDQUFDLEtBQUs7Z0JBQzlDLFVBQVUsRUFBRTtvQkFDWCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUUsd0RBQThDLENBQUM7b0JBQ3JHLE9BQU8sRUFBRSxpREFBNkI7b0JBQ3RDLE1BQU0sMENBQWdDO2lCQUN0QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxHQUFHLENBQUMsUUFBMEI7WUFDcEMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUM7UUFDOUMsQ0FBQzs7SUFsQkYsOEVBbUJDO0lBRUQsTUFBYSw0QkFBNkIsU0FBUSxpQkFBTztpQkFDakMsT0FBRSxHQUFHLHNDQUFzQyxDQUFDO2lC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