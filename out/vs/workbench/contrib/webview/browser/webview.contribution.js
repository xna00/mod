/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/editor/browser/editorExtensions", "vs/editor/contrib/clipboard/browser/clipboard", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, dom_1, editorExtensions_1, clipboard_1, nls, actions_1, contextkey_1, webview_1, webviewEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreventDefaultContextMenuItemsContextKeyName = void 0;
    const PRIORITY = 100;
    function overrideCommandForWebview(command, f) {
        command?.addImplementation(PRIORITY, 'webview', accessor => {
            const webviewService = accessor.get(webview_1.IWebviewService);
            const webview = webviewService.activeWebview;
            if (webview?.isFocused) {
                f(webview);
                return true;
            }
            // When focused in a custom menu try to fallback to the active webview
            // This is needed for context menu actions and the menubar
            if ((0, dom_1.getActiveElement)()?.classList.contains('action-menu-item')) {
                const editorService = accessor.get(editorService_1.IEditorService);
                if (editorService.activeEditor instanceof webviewEditorInput_1.WebviewInput) {
                    f(editorService.activeEditor.webview);
                    return true;
                }
            }
            return false;
        });
    }
    overrideCommandForWebview(editorExtensions_1.UndoCommand, webview => webview.undo());
    overrideCommandForWebview(editorExtensions_1.RedoCommand, webview => webview.redo());
    overrideCommandForWebview(editorExtensions_1.SelectAllCommand, webview => webview.selectAll());
    overrideCommandForWebview(clipboard_1.CopyAction, webview => webview.copy());
    overrideCommandForWebview(clipboard_1.PasteAction, webview => webview.paste());
    overrideCommandForWebview(clipboard_1.CutAction, webview => webview.cut());
    exports.PreventDefaultContextMenuItemsContextKeyName = 'preventDefaultContextMenuItems';
    if (clipboard_1.CutAction) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.WebviewContext, {
            command: {
                id: clipboard_1.CutAction.id,
                title: nls.localize('cut', "Cut"),
            },
            group: '5_cutcopypaste',
            order: 1,
            when: contextkey_1.ContextKeyExpr.not(exports.PreventDefaultContextMenuItemsContextKeyName),
        });
    }
    if (clipboard_1.CopyAction) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.WebviewContext, {
            command: {
                id: clipboard_1.CopyAction.id,
                title: nls.localize('copy', "Copy"),
            },
            group: '5_cutcopypaste',
            order: 2,
            when: contextkey_1.ContextKeyExpr.not(exports.PreventDefaultContextMenuItemsContextKeyName),
        });
    }
    if (clipboard_1.PasteAction) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.WebviewContext, {
            command: {
                id: clipboard_1.PasteAction.id,
                title: nls.localize('paste', "Paste"),
            },
            group: '5_cutcopypaste',
            order: 3,
            when: contextkey_1.ContextKeyExpr.not(exports.PreventDefaultContextMenuItemsContextKeyName),
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlldy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvYnJvd3Nlci93ZWJ2aWV3LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO0lBRXJCLFNBQVMseUJBQXlCLENBQUMsT0FBaUMsRUFBRSxDQUE4QjtRQUNuRyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBRTtZQUMxRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQztZQUNyRCxNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFDO1lBQzdDLElBQUksT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDO2dCQUN4QixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ1gsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsc0VBQXNFO1lBQ3RFLDBEQUEwRDtZQUMxRCxJQUFJLElBQUEsc0JBQWdCLEdBQUUsRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQztnQkFDaEUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7Z0JBQ25ELElBQUksYUFBYSxDQUFDLFlBQVksWUFBWSxpQ0FBWSxFQUFFLENBQUM7b0JBQ3hELENBQUMsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN0QyxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQseUJBQXlCLENBQUMsOEJBQVcsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ2xFLHlCQUF5QixDQUFDLDhCQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNsRSx5QkFBeUIsQ0FBQyxtQ0FBZ0IsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO0lBQzVFLHlCQUF5QixDQUFDLHNCQUFVLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNqRSx5QkFBeUIsQ0FBQyx1QkFBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDbkUseUJBQXlCLENBQUMscUJBQVMsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBRWxELFFBQUEsNENBQTRDLEdBQUcsZ0NBQWdDLENBQUM7SUFFN0YsSUFBSSxxQkFBUyxFQUFFLENBQUM7UUFDZixzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLGNBQWMsRUFBRTtZQUNsRCxPQUFPLEVBQUU7Z0JBQ1IsRUFBRSxFQUFFLHFCQUFTLENBQUMsRUFBRTtnQkFDaEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQzthQUNqQztZQUNELEtBQUssRUFBRSxnQkFBZ0I7WUFDdkIsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsb0RBQTRDLENBQUM7U0FDdEUsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELElBQUksc0JBQVUsRUFBRSxDQUFDO1FBQ2hCLHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsY0FBYyxFQUFFO1lBQ2xELE9BQU8sRUFBRTtnQkFDUixFQUFFLEVBQUUsc0JBQVUsQ0FBQyxFQUFFO2dCQUNqQixLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO2FBQ25DO1lBQ0QsS0FBSyxFQUFFLGdCQUFnQjtZQUN2QixLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvREFBNEMsQ0FBQztTQUN0RSxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsSUFBSSx1QkFBVyxFQUFFLENBQUM7UUFDakIsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxjQUFjLEVBQUU7WUFDbEQsT0FBTyxFQUFFO2dCQUNSLEVBQUUsRUFBRSx1QkFBVyxDQUFDLEVBQUU7Z0JBQ2xCLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUM7YUFDckM7WUFDRCxLQUFLLEVBQUUsZ0JBQWdCO1lBQ3ZCLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLG9EQUE0QyxDQUFDO1NBQ3RFLENBQUMsQ0FBQztJQUNKLENBQUMifQ==