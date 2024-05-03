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
define(["require", "exports", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/lifecycle", "vs/workbench/api/browser/statusBarExtensionPoint"], function (require, exports, extHost_protocol_1, extHostCustomers_1, lifecycle_1, statusBarExtensionPoint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadStatusBar = void 0;
    let MainThreadStatusBar = class MainThreadStatusBar {
        constructor(extHostContext, statusbarService) {
            this.statusbarService = statusbarService;
            this._store = new lifecycle_1.DisposableStore();
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostStatusBar);
            // once, at startup read existing items and send them over
            const entries = [];
            for (const [entryId, item] of statusbarService.getEntries()) {
                entries.push(asDto(entryId, item));
            }
            proxy.$acceptStaticEntries(entries);
            this._store.add(statusbarService.onDidChange(e => {
                if (e.added) {
                    proxy.$acceptStaticEntries([asDto(e.added[0], e.added[1])]);
                }
            }));
            function asDto(entryId, item) {
                return {
                    entryId,
                    name: item.entry.name,
                    text: item.entry.text,
                    tooltip: item.entry.tooltip,
                    command: typeof item.entry.command === 'string' ? item.entry.command : typeof item.entry.command === 'object' ? item.entry.command.id : undefined,
                    priority: item.priority,
                    alignLeft: item.alignment === 0 /* StatusbarAlignment.LEFT */,
                    accessibilityInformation: item.entry.ariaLabel ? { label: item.entry.ariaLabel, role: item.entry.role } : undefined
                };
            }
        }
        dispose() {
            this._store.dispose();
        }
        $setEntry(entryId, id, extensionId, name, text, tooltip, command, color, backgroundColor, alignLeft, priority, accessibilityInformation) {
            const kind = this.statusbarService.setOrUpdateEntry(entryId, id, extensionId, name, text, tooltip, command, color, backgroundColor, alignLeft, priority, accessibilityInformation);
            if (kind === 0 /* StatusBarUpdateKind.DidDefine */) {
                this._store.add((0, lifecycle_1.toDisposable)(() => this.statusbarService.unsetEntry(entryId)));
            }
        }
        $disposeEntry(entryId) {
            this.statusbarService.unsetEntry(entryId);
        }
    };
    exports.MainThreadStatusBar = MainThreadStatusBar;
    exports.MainThreadStatusBar = MainThreadStatusBar = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadStatusBar),
        __param(1, statusBarExtensionPoint_1.IExtensionStatusBarItemService)
    ], MainThreadStatusBar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFN0YXR1c0Jhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRTdGF0dXNCYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO1FBSS9CLFlBQ0MsY0FBK0IsRUFDQyxnQkFBaUU7WUFBaEQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFnQztZQUpqRixXQUFNLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFNL0MsTUFBTSxLQUFLLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFdkUsMERBQTBEO1lBQzFELE1BQU0sT0FBTyxHQUF1QixFQUFFLENBQUM7WUFDdkMsS0FBSyxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQzdELE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLENBQUM7WUFFRCxLQUFLLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFcEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNoRCxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDYixLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3RCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLFNBQVMsS0FBSyxDQUFDLE9BQWUsRUFBRSxJQUFpRjtnQkFDaEgsT0FBTztvQkFDTixPQUFPO29CQUNQLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7b0JBQ3JCLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7b0JBQ3JCLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQTZCO29CQUNqRCxPQUFPLEVBQUUsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTO29CQUNqSixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7b0JBQ3ZCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxvQ0FBNEI7b0JBQ3JELHdCQUF3QixFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUztpQkFDbkgsQ0FBQztZQUNILENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUVELFNBQVMsQ0FBQyxPQUFlLEVBQUUsRUFBVSxFQUFFLFdBQStCLEVBQUUsSUFBWSxFQUFFLElBQVksRUFBRSxPQUE2QyxFQUFFLE9BQTRCLEVBQUUsS0FBc0MsRUFBRSxlQUF1QyxFQUFFLFNBQWtCLEVBQUUsUUFBNEIsRUFBRSx3QkFBK0Q7WUFDbFgsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztZQUNuTCxJQUFJLElBQUksMENBQWtDLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLENBQUM7UUFDRixDQUFDO1FBRUQsYUFBYSxDQUFDLE9BQWU7WUFDNUIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMzQyxDQUFDO0tBQ0QsQ0FBQTtJQXBEWSxrREFBbUI7a0NBQW5CLG1CQUFtQjtRQUQvQixJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsbUJBQW1CLENBQUM7UUFPbkQsV0FBQSx3REFBOEIsQ0FBQTtPQU5wQixtQkFBbUIsQ0FvRC9CIn0=