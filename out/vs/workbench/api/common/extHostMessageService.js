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
define(["require", "exports", "./extHost.protocol", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions"], function (require, exports, extHost_protocol_1, log_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostMessageService = void 0;
    function isMessageItem(item) {
        return item && item.title;
    }
    let ExtHostMessageService = class ExtHostMessageService {
        constructor(mainContext, _logService) {
            this._logService = _logService;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadMessageService);
        }
        showMessage(extension, severity, message, optionsOrFirstItem, rest) {
            const options = {
                source: { identifier: extension.identifier, label: extension.displayName || extension.name }
            };
            let items;
            if (typeof optionsOrFirstItem === 'string' || isMessageItem(optionsOrFirstItem)) {
                items = [optionsOrFirstItem, ...rest];
            }
            else {
                options.modal = optionsOrFirstItem?.modal;
                options.useCustom = optionsOrFirstItem?.useCustom;
                options.detail = optionsOrFirstItem?.detail;
                items = rest;
            }
            if (options.useCustom) {
                (0, extensions_1.checkProposedApiEnabled)(extension, 'resolvers');
            }
            const commands = [];
            let hasCloseAffordance = false;
            for (let handle = 0; handle < items.length; handle++) {
                const command = items[handle];
                if (typeof command === 'string') {
                    commands.push({ title: command, handle, isCloseAffordance: false });
                }
                else if (typeof command === 'object') {
                    const { title, isCloseAffordance } = command;
                    commands.push({ title, isCloseAffordance: !!isCloseAffordance, handle });
                    if (isCloseAffordance) {
                        if (hasCloseAffordance) {
                            this._logService.warn(`[${extension.identifier}] Only one message item can have 'isCloseAffordance':`, command);
                        }
                        else {
                            hasCloseAffordance = true;
                        }
                    }
                }
                else {
                    this._logService.warn(`[${extension.identifier}] Invalid message item:`, command);
                }
            }
            return this._proxy.$showMessage(severity, message, options, commands).then(handle => {
                if (typeof handle === 'number') {
                    return items[handle];
                }
                return undefined;
            });
        }
    };
    exports.ExtHostMessageService = ExtHostMessageService;
    exports.ExtHostMessageService = ExtHostMessageService = __decorate([
        __param(1, log_1.ILogService)
    ], ExtHostMessageService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE1lc3NhZ2VTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0TWVzc2FnZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU2hHLFNBQVMsYUFBYSxDQUFDLElBQVM7UUFDL0IsT0FBTyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztJQUMzQixDQUFDO0lBRU0sSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBcUI7UUFJakMsWUFDQyxXQUF5QixFQUNLLFdBQXdCO1lBQXhCLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBRXRELElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDMUUsQ0FBQztRQU1ELFdBQVcsQ0FBQyxTQUFnQyxFQUFFLFFBQWtCLEVBQUUsT0FBZSxFQUFFLGtCQUFtRixFQUFFLElBQXdDO1lBRS9NLE1BQU0sT0FBTyxHQUE2QjtnQkFDekMsTUFBTSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxXQUFXLElBQUksU0FBUyxDQUFDLElBQUksRUFBRTthQUM1RixDQUFDO1lBQ0YsSUFBSSxLQUFzQyxDQUFDO1lBRTNDLElBQUksT0FBTyxrQkFBa0IsS0FBSyxRQUFRLElBQUksYUFBYSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQztnQkFDakYsS0FBSyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUN2QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxDQUFDLEtBQUssR0FBRyxrQkFBa0IsRUFBRSxLQUFLLENBQUM7Z0JBQzFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsa0JBQWtCLEVBQUUsU0FBUyxDQUFDO2dCQUNsRCxPQUFPLENBQUMsTUFBTSxHQUFHLGtCQUFrQixFQUFFLE1BQU0sQ0FBQztnQkFDNUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDdkIsSUFBQSxvQ0FBdUIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFvRSxFQUFFLENBQUM7WUFDckYsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7WUFFL0IsS0FBSyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDdEQsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QixJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNqQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDckUsQ0FBQztxQkFBTSxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUN4QyxNQUFNLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLEdBQUcsT0FBTyxDQUFDO29CQUM3QyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO29CQUN6RSxJQUFJLGlCQUFpQixFQUFFLENBQUM7d0JBQ3ZCLElBQUksa0JBQWtCLEVBQUUsQ0FBQzs0QkFDeEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsVUFBVSx1REFBdUQsRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFDakgsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLGtCQUFrQixHQUFHLElBQUksQ0FBQzt3QkFDM0IsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxVQUFVLHlCQUF5QixFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUNuRixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNuRixJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNoQyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEIsQ0FBQztnQkFDRCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRCxDQUFBO0lBaEVZLHNEQUFxQjtvQ0FBckIscUJBQXFCO1FBTS9CLFdBQUEsaUJBQVcsQ0FBQTtPQU5ELHFCQUFxQixDQWdFakMifQ==