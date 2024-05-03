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
define(["require", "exports", "vs/platform/progress/common/progress", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/actions", "vs/platform/commands/common/commands", "vs/nls"], function (require, exports, progress_1, extHost_protocol_1, extHostCustomers_1, actions_1, commands_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadProgress = void 0;
    class ManageExtensionAction extends actions_1.Action {
        constructor(extensionId, label, commandService) {
            super(extensionId, label, undefined, true, () => {
                return commandService.executeCommand('_extensions.manage', extensionId);
            });
        }
    }
    let MainThreadProgress = class MainThreadProgress {
        constructor(extHostContext, progressService, _commandService) {
            this._commandService = _commandService;
            this._progress = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostProgress);
            this._progressService = progressService;
        }
        dispose() {
            this._progress.forEach(handle => handle.resolve());
            this._progress.clear();
        }
        async $startProgress(handle, options, extensionId) {
            const task = this._createTask(handle);
            if (options.location === 15 /* ProgressLocation.Notification */ && extensionId) {
                const notificationOptions = {
                    ...options,
                    location: 15 /* ProgressLocation.Notification */,
                    secondaryActions: [new ManageExtensionAction(extensionId, (0, nls_1.localize)('manageExtension', "Manage Extension"), this._commandService)]
                };
                options = notificationOptions;
            }
            this._progressService.withProgress(options, task, () => this._proxy.$acceptProgressCanceled(handle));
        }
        $progressReport(handle, message) {
            const entry = this._progress.get(handle);
            entry?.progress.report(message);
        }
        $progressEnd(handle) {
            const entry = this._progress.get(handle);
            if (entry) {
                entry.resolve();
                this._progress.delete(handle);
            }
        }
        _createTask(handle) {
            return (progress) => {
                return new Promise(resolve => {
                    this._progress.set(handle, { resolve, progress });
                });
            };
        }
    };
    exports.MainThreadProgress = MainThreadProgress;
    exports.MainThreadProgress = MainThreadProgress = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadProgress),
        __param(1, progress_1.IProgressService),
        __param(2, commands_1.ICommandService)
    ], MainThreadProgress);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFByb2dyZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFByb2dyZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVNoRyxNQUFNLHFCQUFzQixTQUFRLGdCQUFNO1FBQ3pDLFlBQVksV0FBbUIsRUFBRSxLQUFhLEVBQUUsY0FBK0I7WUFDOUUsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7Z0JBQy9DLE9BQU8sY0FBYyxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN6RSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQUdNLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQWtCO1FBTTlCLFlBQ0MsY0FBK0IsRUFDYixlQUFpQyxFQUNsQyxlQUFpRDtZQUFoQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFOM0QsY0FBUyxHQUFHLElBQUksR0FBRyxFQUF1RSxDQUFDO1lBUWxHLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7UUFDekMsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBYyxFQUFFLE9BQXlCLEVBQUUsV0FBb0I7WUFDbkYsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV0QyxJQUFJLE9BQU8sQ0FBQyxRQUFRLDJDQUFrQyxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUN2RSxNQUFNLG1CQUFtQixHQUFpQztvQkFDekQsR0FBRyxPQUFPO29CQUNWLFFBQVEsd0NBQStCO29CQUN2QyxnQkFBZ0IsRUFBRSxDQUFDLElBQUkscUJBQXFCLENBQUMsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixDQUFDLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2lCQUNqSSxDQUFDO2dCQUVGLE9BQU8sR0FBRyxtQkFBbUIsQ0FBQztZQUMvQixDQUFDO1lBRUQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRUQsZUFBZSxDQUFDLE1BQWMsRUFBRSxPQUFzQjtZQUNyRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QyxLQUFLLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsWUFBWSxDQUFDLE1BQWM7WUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekMsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9CLENBQUM7UUFDRixDQUFDO1FBRU8sV0FBVyxDQUFDLE1BQWM7WUFDakMsT0FBTyxDQUFDLFFBQWtDLEVBQUUsRUFBRTtnQkFDN0MsT0FBTyxJQUFJLE9BQU8sQ0FBTyxPQUFPLENBQUMsRUFBRTtvQkFDbEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQ25ELENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUE7SUF4RFksZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUFEOUIsSUFBQSx1Q0FBb0IsRUFBQyw4QkFBVyxDQUFDLGtCQUFrQixDQUFDO1FBU2xELFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSwwQkFBZSxDQUFBO09BVEwsa0JBQWtCLENBd0Q5QiJ9