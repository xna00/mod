/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChat", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChatController"], function (require, exports, lifecycle_1, accessibleView_1, accessibleViewActions_1, terminal_1, terminalChat_1, terminalChatController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalInlineChatAccessibleViewContribution = void 0;
    class TerminalInlineChatAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(105, 'terminalInlineChat', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const terminalService = accessor.get(terminal_1.ITerminalService);
                const controller = terminalService.activeInstance?.getContribution(terminalChatController_1.TerminalChatController.ID) ?? undefined;
                if (!controller?.lastResponseContent) {
                    return false;
                }
                const responseContent = controller.lastResponseContent;
                accessibleViewService.show({
                    id: "terminal-chat" /* AccessibleViewProviderId.TerminalChat */,
                    verbositySettingKey: "accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */,
                    provideContent() { return responseContent; },
                    onClose() {
                        controller.focus();
                    },
                    options: { type: "view" /* AccessibleViewType.View */ }
                });
                return true;
            }, terminalChat_1.TerminalChatContextKeys.focused));
        }
    }
    exports.TerminalInlineChatAccessibleViewContribution = TerminalInlineChatAccessibleViewContribution;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0QWNjZXNzaWJsZVZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9jaGF0L2Jyb3dzZXIvdGVybWluYWxDaGF0QWNjZXNzaWJsZVZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsNENBQTZDLFNBQVEsc0JBQVU7UUFFM0U7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxTQUFTLENBQUMsNENBQW9CLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLG9CQUFvQixFQUFFLFFBQVEsQ0FBQyxFQUFFO2dCQUMzRixNQUFNLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXNCLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsQ0FBQyxDQUFDO2dCQUN2RCxNQUFNLFVBQVUsR0FBdUMsZUFBZSxDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUMsK0NBQXNCLENBQUMsRUFBRSxDQUFDLElBQUksU0FBUyxDQUFDO2dCQUMvSSxJQUFJLENBQUMsVUFBVSxFQUFFLG1CQUFtQixFQUFFLENBQUM7b0JBQ3RDLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBQ0QsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLG1CQUFtQixDQUFDO2dCQUN2RCxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7b0JBQzFCLEVBQUUsNkRBQXVDO29CQUN6QyxtQkFBbUIsdUZBQTRDO29CQUMvRCxjQUFjLEtBQWEsT0FBTyxlQUFlLENBQUMsQ0FBQyxDQUFDO29CQUNwRCxPQUFPO3dCQUNOLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDcEIsQ0FBQztvQkFDRCxPQUFPLEVBQUUsRUFBRSxJQUFJLHNDQUF5QixFQUFFO2lCQUMxQyxDQUFDLENBQUM7Z0JBQ0gsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLEVBQUUsc0NBQXVCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDO0tBQ0Q7SUF4QkQsb0dBd0JDIn0=