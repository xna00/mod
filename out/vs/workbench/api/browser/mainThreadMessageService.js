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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/platform/commands/common/commands", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls, actions_1, extHost_protocol_1, extHostCustomers_1, dialogs_1, notification_1, event_1, commands_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadMessageService = void 0;
    let MainThreadMessageService = class MainThreadMessageService {
        constructor(extHostContext, _notificationService, _commandService, _dialogService, extensionService) {
            this._notificationService = _notificationService;
            this._commandService = _commandService;
            this._dialogService = _dialogService;
            this.extensionsListener = extensionService.onDidChangeExtensions(e => {
                for (const extension of e.removed) {
                    this._notificationService.removeFilter(extension.identifier.value);
                }
            });
        }
        dispose() {
            this.extensionsListener.dispose();
        }
        $showMessage(severity, message, options, commands) {
            if (options.modal) {
                return this._showModalMessage(severity, message, options.detail, commands, options.useCustom);
            }
            else {
                return this._showMessage(severity, message, commands, options);
            }
        }
        _showMessage(severity, message, commands, options) {
            return new Promise(resolve => {
                const primaryActions = commands.map(command => (0, actions_1.toAction)({
                    id: `_extension_message_handle_${command.handle}`,
                    label: command.title,
                    enabled: true,
                    run: () => {
                        resolve(command.handle);
                        return Promise.resolve();
                    }
                }));
                let source;
                if (options.source) {
                    source = {
                        label: options.source.label,
                        id: options.source.identifier.value
                    };
                }
                if (!source) {
                    source = nls.localize('defaultSource', "Extension");
                }
                const secondaryActions = [];
                if (options.source) {
                    secondaryActions.push((0, actions_1.toAction)({
                        id: options.source.identifier.value,
                        label: nls.localize('manageExtension', "Manage Extension"),
                        run: () => {
                            return this._commandService.executeCommand('_extensions.manage', options.source.identifier.value);
                        }
                    }));
                }
                const messageHandle = this._notificationService.notify({
                    severity,
                    message,
                    actions: { primary: primaryActions, secondary: secondaryActions },
                    source
                });
                // if promise has not been resolved yet, now is the time to ensure a return value
                // otherwise if already resolved it means the user clicked one of the buttons
                event_1.Event.once(messageHandle.onDidClose)(() => {
                    resolve(undefined);
                });
            });
        }
        async _showModalMessage(severity, message, detail, commands, useCustom) {
            const buttons = [];
            let cancelButton = undefined;
            for (const command of commands) {
                const button = {
                    label: command.title,
                    run: () => command.handle
                };
                if (command.isCloseAffordance) {
                    cancelButton = button;
                }
                else {
                    buttons.push(button);
                }
            }
            if (!cancelButton) {
                if (buttons.length > 0) {
                    cancelButton = {
                        label: nls.localize('cancel', "Cancel"),
                        run: () => undefined
                    };
                }
                else {
                    cancelButton = {
                        label: nls.localize({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"),
                        run: () => undefined
                    };
                }
            }
            const { result } = await this._dialogService.prompt({
                type: severity,
                message,
                detail,
                buttons,
                cancelButton,
                custom: useCustom
            });
            return result;
        }
    };
    exports.MainThreadMessageService = MainThreadMessageService;
    exports.MainThreadMessageService = MainThreadMessageService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadMessageService),
        __param(1, notification_1.INotificationService),
        __param(2, commands_1.ICommandService),
        __param(3, dialogs_1.IDialogService),
        __param(4, extensions_1.IExtensionService)
    ], MainThreadMessageService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE1lc3NhZ2VTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZE1lc3NhZ2VTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWV6RixJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF3QjtRQUlwQyxZQUNDLGNBQStCLEVBQ1Esb0JBQTBDLEVBQy9DLGVBQWdDLEVBQ2pDLGNBQThCLEVBQzVDLGdCQUFtQztZQUhmLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDL0Msb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ2pDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUcvRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BFLEtBQUssTUFBTSxTQUFTLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNuQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3BFLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25DLENBQUM7UUFFRCxZQUFZLENBQUMsUUFBa0IsRUFBRSxPQUFlLEVBQUUsT0FBaUMsRUFBRSxRQUF5RTtZQUM3SixJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxP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