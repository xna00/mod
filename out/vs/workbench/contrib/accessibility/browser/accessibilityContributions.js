/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/base/common/strings", "vs/platform/commands/common/commands", "vs/editor/contrib/hover/browser/hover", "vs/platform/contextview/browser/contextView", "vs/editor/common/editorContextKeys", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/platform/list/browser/listService", "vs/workbench/common/contextkeys", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/platform/hover/browser/hover", "vs/base/browser/ui/aria/aria", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/base/common/themables", "vs/base/common/codicons", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionContextKeys", "vs/platform/contextkey/common/contextkey", "vs/platform/accessibilitySignal/browser/accessibilitySignalService"], function (require, exports, lifecycle_1, codeEditorService_1, nls_1, accessibilityConfiguration_1, strings, commands_1, hover_1, contextView_1, editorContextKeys_1, notificationsCommands_1, listService_1, contextkeys_1, accessibleView_1, hover_2, aria_1, accessibleViewActions_1, themables_1, codicons_1, inlineCompletionsController_1, inlineCompletionContextKeys_1, contextkey_1, accessibilitySignalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineCompletionsAccessibleViewContribution = exports.NotificationAccessibleViewContribution = exports.HoverAccessibleViewContribution = void 0;
    exports.descriptionForCommand = descriptionForCommand;
    exports.alertFocusChange = alertFocusChange;
    function descriptionForCommand(commandId, msg, noKbMsg, keybindingService) {
        const kb = keybindingService.lookupKeybinding(commandId);
        if (kb) {
            return strings.format(msg, kb.getAriaLabel());
        }
        return strings.format(noKbMsg, commandId);
    }
    class HoverAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._options = { language: 'typescript', type: "view" /* AccessibleViewType.View */ };
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(95, 'hover', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const editor = codeEditorService.getActiveCodeEditor() || codeEditorService.getFocusedCodeEditor();
                const editorHoverContent = editor ? hover_1.HoverController.get(editor)?.getWidgetContent() ?? undefined : undefined;
                if (!editor || !editorHoverContent) {
                    return false;
                }
                this._options.language = editor?.getModel()?.getLanguageId() ?? undefined;
                accessibleViewService.show({
                    id: "hover" /* AccessibleViewProviderId.Hover */,
                    verbositySettingKey: "accessibility.verbosity.hover" /* AccessibilityVerbositySettingId.Hover */,
                    provideContent() { return editorHoverContent; },
                    onClose() {
                        hover_1.HoverController.get(editor)?.focus();
                    },
                    options: this._options
                });
                return true;
            }, editorContextKeys_1.EditorContextKeys.hoverFocused));
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(90, 'extension-hover', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const contextViewService = accessor.get(contextView_1.IContextViewService);
                const contextViewElement = contextViewService.getContextViewElement();
                const extensionHoverContent = contextViewElement?.textContent ?? undefined;
                const hoverService = accessor.get(hover_2.IHoverService);
                if (contextViewElement.classList.contains('accessible-view-container') || !extensionHoverContent) {
                    // The accessible view, itself, uses the context view service to display the text. We don't want to read that.
                    return false;
                }
                accessibleViewService.show({
                    id: "hover" /* AccessibleViewProviderId.Hover */,
                    verbositySettingKey: "accessibility.verbosity.hover" /* AccessibilityVerbositySettingId.Hover */,
                    provideContent() { return extensionHoverContent; },
                    onClose() {
                        hoverService.showAndFocusLastHover();
                    },
                    options: this._options
                });
                return true;
            }));
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(115, 'accessible-view', accessor => {
                accessor.get(accessibleView_1.IAccessibleViewService).showAccessibleViewHelp();
                return true;
            }, accessibilityConfiguration_1.accessibleViewIsShown));
        }
    }
    exports.HoverAccessibleViewContribution = HoverAccessibleViewContribution;
    class NotificationAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(90, 'notifications', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const listService = accessor.get(listService_1.IListService);
                const commandService = accessor.get(commands_1.ICommandService);
                const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
                function renderAccessibleView() {
                    const notification = (0, notificationsCommands_1.getNotificationFromContext)(listService);
                    if (!notification) {
                        return false;
                    }
                    commandService.executeCommand('notifications.showList');
                    let notificationIndex;
                    let length;
                    const list = listService.lastFocusedList;
                    if (list instanceof listService_1.WorkbenchList) {
                        notificationIndex = list.indexOf(notification);
                        length = list.length;
                    }
                    if (notificationIndex === undefined) {
                        return false;
                    }
                    function focusList() {
                        commandService.executeCommand('notifications.showList');
                        if (list && notificationIndex !== undefined) {
                            list.domFocus();
                            try {
                                list.setFocus([notificationIndex]);
                            }
                            catch { }
                        }
                    }
                    const message = notification.message.original.toString();
                    if (!message) {
                        return false;
                    }
                    notification.onDidClose(() => accessibleViewService.next());
                    accessibleViewService.show({
                        id: "notification" /* AccessibleViewProviderId.Notification */,
                        provideContent: () => {
                            return notification.source ? (0, nls_1.localize)('notification.accessibleViewSrc', '{0} Source: {1}', message, notification.source) : (0, nls_1.localize)('notification.accessibleView', '{0}', message);
                        },
                        onClose() {
                            focusList();
                        },
                        next() {
                            if (!list) {
                                return;
                            }
                            focusList();
                            list.focusNext();
                            alertFocusChange(notificationIndex, length, 'next');
                            renderAccessibleView();
                        },
                        previous() {
                            if (!list) {
                                return;
                            }
                            focusList();
                            list.focusPrevious();
                            alertFocusChange(notificationIndex, length, 'previous');
                            renderAccessibleView();
                        },
                        verbositySettingKey: "accessibility.verbosity.notification" /* AccessibilityVerbositySettingId.Notification */,
                        options: { type: "view" /* AccessibleViewType.View */ },
                        actions: getActionsFromNotification(notification, accessibilitySignalService)
                    });
                    return true;
                }
                return renderAccessibleView();
            }, contextkeys_1.NotificationFocusedContext));
        }
    }
    exports.NotificationAccessibleViewContribution = NotificationAccessibleViewContribution;
    function getActionsFromNotification(notification, accessibilitySignalService) {
        let actions = undefined;
        if (notification.actions) {
            actions = [];
            if (notification.actions.primary) {
                actions.push(...notification.actions.primary);
            }
            if (notification.actions.secondary) {
                actions.push(...notification.actions.secondary);
            }
        }
        if (actions) {
            for (const action of actions) {
                action.class = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.bell);
                const initialAction = action.run;
                action.run = () => {
                    initialAction();
                    notification.close();
                };
            }
        }
        const manageExtension = actions?.find(a => a.label.includes('Manage Extension'));
        if (manageExtension) {
            manageExtension.class = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.gear);
        }
        if (actions) {
            actions.push({
                id: 'clearNotification', label: (0, nls_1.localize)('clearNotification', "Clear Notification"), tooltip: (0, nls_1.localize)('clearNotification', "Clear Notification"), run: () => {
                    notification.close();
                    accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.clear);
                }, enabled: true, class: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.clearAll)
            });
        }
        return actions;
    }
    function alertFocusChange(index, length, type) {
        if (index === undefined || length === undefined) {
            return;
        }
        const number = index + 1;
        if (type === 'next' && number + 1 <= length) {
            (0, aria_1.alert)(`Focused ${number + 1} of ${length}`);
        }
        else if (type === 'previous' && number - 1 > 0) {
            (0, aria_1.alert)(`Focused ${number - 1} of ${length}`);
        }
        return;
    }
    class InlineCompletionsAccessibleViewContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._options = { type: "view" /* AccessibleViewType.View */ };
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(95, 'inline-completions', accessor => {
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const show = () => {
                    const editor = codeEditorService.getActiveCodeEditor() || codeEditorService.getFocusedCodeEditor();
                    if (!editor) {
                        return false;
                    }
                    const model = inlineCompletionsController_1.InlineCompletionsController.get(editor)?.model.get();
                    const state = model?.state.get();
                    if (!model || !state) {
                        return false;
                    }
                    const lineText = model.textModel.getLineContent(state.primaryGhostText.lineNumber);
                    const ghostText = state.primaryGhostText.renderForScreenReader(lineText);
                    if (!ghostText) {
                        return false;
                    }
                    this._options.language = editor.getModel()?.getLanguageId() ?? undefined;
                    accessibleViewService.show({
                        id: "inlineCompletions" /* AccessibleViewProviderId.InlineCompletions */,
                        verbositySettingKey: "accessibility.verbosity.inlineCompletions" /* AccessibilityVerbositySettingId.InlineCompletions */,
                        provideContent() { return lineText + ghostText; },
                        onClose() {
                            model.stop();
                            editor.focus();
                        },
                        next() {
                            model.next();
                            setTimeout(() => show(), 50);
                        },
                        previous() {
                            model.previous();
                            setTimeout(() => show(), 50);
                        },
                        options: this._options
                    });
                    return true;
                };
                contextkey_1.ContextKeyExpr.and(inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible);
                return show();
            }));
        }
    }
    exports.InlineCompletionsAccessibleViewContribution = InlineCompletionsAccessibleViewContribution;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eUNvbnRyaWJ1dGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHkvYnJvd3Nlci9hY2Nlc3NpYmlsaXR5Q29udHJpYnV0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQ2hHLHNEQU1DO0lBMEtELDRDQVlDO0lBNUxELFNBQWdCLHFCQUFxQixDQUFDLFNBQWlCLEVBQUUsR0FBVyxFQUFFLE9BQWUsRUFBRSxpQkFBcUM7UUFDM0gsTUFBTSxFQUFFLEdBQUcsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekQsSUFBSSxFQUFFLEVBQUUsQ0FBQztZQUNSLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVELE1BQWEsK0JBQWdDLFNBQVEsc0JBQVU7UUFHOUQ7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUZELGFBQVEsR0FBMkIsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLElBQUksc0NBQXlCLEVBQUUsQ0FBQztZQUdwRyxJQUFJLENBQUMsU0FBUyxDQUFDLDRDQUFvQixDQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQzdFLE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBc0IsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0NBQWtCLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxpQkFBaUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUNuRyxNQUFNLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsdUJBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDN0csSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQ3BDLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLFNBQVMsQ0FBQztnQkFDMUUscUJBQXFCLENBQUMsSUFBSSxDQUFDO29CQUMxQixFQUFFLDhDQUFnQztvQkFDbEMsbUJBQW1CLDZFQUF1QztvQkFDMUQsY0FBYyxLQUFLLE9BQU8sa0JBQWtCLENBQUMsQ0FBQyxDQUFDO29CQUMvQyxPQUFPO3dCQUNOLHVCQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDO29CQUN0QyxDQUFDO29CQUNELE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUTtpQkFDdEIsQ0FBQyxDQUFDO2dCQUNILE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxFQUFFLHFDQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyw0Q0FBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQ3ZGLE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBc0IsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsaUNBQW1CLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUN0RSxNQUFNLHFCQUFxQixHQUFHLGtCQUFrQixFQUFFLFdBQVcsSUFBSSxTQUFTLENBQUM7Z0JBQzNFLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUJBQWEsQ0FBQyxDQUFDO2dCQUVqRCxJQUFJLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQ2xHLDhHQUE4RztvQkFDOUcsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztnQkFDRCxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7b0JBQzFCLEVBQUUsOENBQWdDO29CQUNsQyxtQkFBbUIsNkVBQXVDO29CQUMxRCxjQUFjLEtBQUssT0FBTyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7b0JBQ2xELE9BQU87d0JBQ04sWUFBWSxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQ3RDLENBQUM7b0JBQ0QsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRO2lCQUN0QixDQUFDLENBQUM7Z0JBQ0gsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQywrQ0FBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQzNGLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXNCLENBQUMsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUM5RCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUMsRUFBRSxrREFBcUIsQ0FBQyxDQUFDLENBQUM7UUFDNUIsQ0FBQztLQUNEO0lBcERELDBFQW9EQztJQUVELE1BQWEsc0NBQXVDLFNBQVEsc0JBQVU7UUFFckU7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxTQUFTLENBQUMsNENBQW9CLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLGVBQWUsRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDckYsTUFBTSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUFzQixDQUFDLENBQUM7Z0JBQ25FLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMEJBQVksQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBCQUFlLENBQUMsQ0FBQztnQkFDckQsTUFBTSwwQkFBMEIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdEQUEyQixDQUFDLENBQUM7Z0JBRTdFLFNBQVMsb0JBQW9CO29CQUM1QixNQUFNLFlBQVksR0FBRyxJQUFBLGtEQUEwQixFQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUM3RCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7d0JBQ25CLE9BQU8sS0FBSyxDQUFDO29CQUNkLENBQUM7b0JBQ0QsY0FBYyxDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO29CQUN4RCxJQUFJLGlCQUFxQyxDQUFDO29CQUMxQyxJQUFJLE1BQTBCLENBQUM7b0JBQy9CLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxlQUFlLENBQUM7b0JBQ3pDLElBQUksSUFBSSxZQUFZLDJCQUFhLEVBQUUsQ0FBQzt3QkFDbkMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDL0MsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7b0JBQ3RCLENBQUM7b0JBQ0QsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDckMsT0FBTyxLQUFLLENBQUM7b0JBQ2QsQ0FBQztvQkFFRCxTQUFTLFNBQVM7d0JBQ2pCLGNBQWMsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQzt3QkFDeEQsSUFBSSxJQUFJLElBQUksaUJBQWlCLEtBQUssU0FBUyxFQUFFLENBQUM7NEJBQzdDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs0QkFDaEIsSUFBSSxDQUFDO2dDQUNKLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7NEJBQ3BDLENBQUM7NEJBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzt3QkFDWixDQUFDO29CQUNGLENBQUM7b0JBQ0QsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3pELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDZCxPQUFPLEtBQUssQ0FBQztvQkFDZCxDQUFDO29CQUNELFlBQVksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFDNUQscUJBQXFCLENBQUMsSUFBSSxDQUFDO3dCQUMxQixFQUFFLDREQUF1Qzt3QkFDekMsY0FBYyxFQUFFLEdBQUcsRUFBRTs0QkFDcEIsT0FBTyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxnQ0FBZ0MsRUFBRSxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7d0JBQ3BMLENBQUM7d0JBQ0QsT0FBTzs0QkFDTixTQUFTLEVBQUUsQ0FBQzt3QkFDYixDQUFDO3dCQUNELElBQUk7NEJBQ0gsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dDQUNYLE9BQU87NEJBQ1IsQ0FBQzs0QkFDRCxTQUFTLEVBQUUsQ0FBQzs0QkFDWixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7NEJBQ2pCLGdCQUFnQixDQUFDLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQzs0QkFDcEQsb0JBQW9CLEVBQUUsQ0FBQzt3QkFDeEIsQ0FBQzt3QkFDRCxRQUFROzRCQUNQLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQ0FDWCxPQUFPOzRCQUNSLENBQUM7NEJBQ0QsU0FBUyxFQUFFLENBQUM7NEJBQ1osSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDOzRCQUNyQixnQkFBZ0IsQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7NEJBQ3hELG9CQUFvQixFQUFFLENBQUM7d0JBQ3hCLENBQUM7d0JBQ0QsbUJBQW1CLDJGQUE4Qzt3QkFDakUsT0FBTyxFQUFFLEVBQUUsSUFBSSxzQ0FBeUIsRUFBRTt3QkFDMUMsT0FBTyxFQUFFLDBCQUEwQixDQUFDLFlBQVksRUFBRSwwQkFBMEIsQ0FBQztxQkFDN0UsQ0FBQyxDQUFDO29CQUNILE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBQ0QsT0FBTyxvQkFBb0IsRUFBRSxDQUFDO1lBQy9CLENBQUMsRUFBRSx3Q0FBMEIsQ0FBQyxDQUFDLENBQUM7UUFDakMsQ0FBQztLQUNEO0lBNUVELHdGQTRFQztJQUVELFNBQVMsMEJBQTBCLENBQUMsWUFBbUMsRUFBRSwwQkFBdUQ7UUFDL0gsSUFBSSxPQUFPLEdBQUcsU0FBUyxDQUFDO1FBQ3hCLElBQUksWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFDRCxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pELENBQUM7UUFDRixDQUFDO1FBQ0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNiLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxLQUFLLEdBQUcscUJBQVMsQ0FBQyxXQUFXLENBQUMsa0JBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztnQkFDakMsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUU7b0JBQ2pCLGFBQWEsRUFBRSxDQUFDO29CQUNoQixZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3RCLENBQUMsQ0FBQztZQUNILENBQUM7UUFDRixDQUFDO1FBQ0QsTUFBTSxlQUFlLEdBQUcsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUNqRixJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3JCLGVBQWUsQ0FBQyxLQUFLLEdBQUcscUJBQVMsQ0FBQyxXQUFXLENBQUMsa0JBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBQ0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ1osRUFBRSxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7b0JBQzVKLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDckIsMEJBQTBCLENBQUMsVUFBVSxDQUFDLGdEQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsRSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUscUJBQVMsQ0FBQyxXQUFXLENBQUMsa0JBQU8sQ0FBQyxRQUFRLENBQUM7YUFDaEUsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2hCLENBQUM7SUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxLQUF5QixFQUFFLE1BQTBCLEVBQUUsSUFBeUI7UUFDaEgsSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUNqRCxPQUFPO1FBQ1IsQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7UUFFekIsSUFBSSxJQUFJLEtBQUssTUFBTSxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxFQUFFLENBQUM7WUFDN0MsSUFBQSxZQUFLLEVBQUMsV0FBVyxNQUFNLEdBQUcsQ0FBQyxPQUFPLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDN0MsQ0FBQzthQUFNLElBQUksSUFBSSxLQUFLLFVBQVUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2xELElBQUEsWUFBSyxFQUFDLFdBQVcsTUFBTSxHQUFHLENBQUMsT0FBTyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFDRCxPQUFPO0lBQ1IsQ0FBQztJQUVELE1BQWEsMkNBQTRDLFNBQVEsc0JBQVU7UUFHMUU7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUZELGFBQVEsR0FBMkIsRUFBRSxJQUFJLHNDQUF5QixFQUFFLENBQUM7WUFHNUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyw0Q0FBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQzFGLE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBc0IsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0NBQWtCLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxJQUFJLEdBQUcsR0FBRyxFQUFFO29CQUNqQixNQUFNLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLGlCQUFpQixDQUFDLG9CQUFvQixFQUFFLENBQUM7b0JBQ25HLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDYixPQUFPLEtBQUssQ0FBQztvQkFDZCxDQUFDO29CQUNELE1BQU0sS0FBSyxHQUFHLHlEQUEyQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ25FLE1BQU0sS0FBSyxHQUFHLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDdEIsT0FBTyxLQUFLLENBQUM7b0JBQ2QsQ0FBQztvQkFDRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ25GLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDekUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUNoQixPQUFPLEtBQUssQ0FBQztvQkFDZCxDQUFDO29CQUNELElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxTQUFTLENBQUM7b0JBQ3pFLHFCQUFxQixDQUFDLElBQUksQ0FBQzt3QkFDMUIsRUFBRSxzRUFBNEM7d0JBQzlDLG1CQUFtQixxR0FBbUQ7d0JBQ3RFLGNBQWMsS0FBSyxPQUFPLFFBQVEsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUNqRCxPQUFPOzRCQUNOLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0QkFDYixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ2hCLENBQUM7d0JBQ0QsSUFBSTs0QkFDSCxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7NEJBQ2IsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUM5QixDQUFDO3dCQUNELFFBQVE7NEJBQ1AsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDOzRCQUNqQixVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQzlCLENBQUM7d0JBQ0QsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRO3FCQUN0QixDQUFDLENBQUM7b0JBQ0gsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQyxDQUFDO2dCQUFDLDJCQUFjLENBQUMsR0FBRyxDQUFDLHlEQUEyQixDQUFDLHVCQUF1QixDQUFDLENBQUM7Z0JBQzNFLE9BQU8sSUFBSSxFQUFFLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNEO0lBL0NELGtHQStDQyJ9