/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/accessibility/browser/accessibleViewActions"], function (require, exports, inlineChatController_1, inlineChat_1, accessibleView_1, lifecycle_1, codeEditorService_1, contextkey_1, accessibleViewActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatAccessibleViewContribution = void 0;
    class InlineChatAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(100, 'inlineChat', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const editor = (codeEditorService.getActiveCodeEditor() || codeEditorService.getFocusedCodeEditor());
                if (!editor) {
                    return false;
                }
                const controller = inlineChatController_1.InlineChatController.get(editor);
                if (!controller) {
                    return false;
                }
                const responseContent = controller?.getMessage();
                if (!responseContent) {
                    return false;
                }
                accessibleViewService.show({
                    id: "inlineChat" /* AccessibleViewProviderId.InlineChat */,
                    verbositySettingKey: "accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */,
                    provideContent() { return responseContent; },
                    onClose() {
                        controller.focus();
                    },
                    options: { type: "view" /* AccessibleViewType.View */ }
                });
                return true;
            }, contextkey_1.ContextKeyExpr.or(inlineChat_1.CTX_INLINE_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_RESPONSE_FOCUSED)));
        }
    }
    exports.InlineChatAccessibleViewContribution = InlineChatAccessibleViewContribution;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdEFjY2Vzc2libGVWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2Jyb3dzZXIvaW5saW5lQ2hhdEFjY2Vzc2libGVWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFhLG9DQUFxQyxTQUFRLHNCQUFVO1FBRW5FO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsU0FBUyxDQUFDLDRDQUFvQixDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQ25GLE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBc0IsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0NBQWtCLENBQUMsQ0FBQztnQkFFM0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLGlCQUFpQixDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztnQkFDckcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNiLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBQ0QsTUFBTSxVQUFVLEdBQUcsMkNBQW9CLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNwRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ2pCLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBQ0QsTUFBTSxlQUFlLEdBQUcsVUFBVSxFQUFFLFVBQVUsRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3RCLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBQ0QscUJBQXFCLENBQUMsSUFBSSxDQUFDO29CQUMxQixFQUFFLHdEQUFxQztvQkFDdkMsbUJBQW1CLHVGQUE0QztvQkFDL0QsY0FBYyxLQUFhLE9BQU8sZUFBZSxDQUFDLENBQUMsQ0FBQztvQkFDcEQsT0FBTzt3QkFDTixVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3BCLENBQUM7b0JBRUQsT0FBTyxFQUFFLEVBQUUsSUFBSSxzQ0FBeUIsRUFBRTtpQkFDMUMsQ0FBQyxDQUFDO2dCQUNILE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLG9DQUF1QixFQUFFLDZDQUFnQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25GLENBQUM7S0FDRDtJQWpDRCxvRkFpQ0MifQ==