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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/keyboardLayout/common/keyboardLayout", "vs/base/common/event", "vs/base/common/platform", "vs/platform/ipc/common/mainProcessService", "vs/base/parts/ipc/common/ipc", "vs/platform/instantiation/common/instantiation"], function (require, exports, lifecycle_1, keyboardLayout_1, event_1, platform_1, mainProcessService_1, ipc_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeKeyboardLayoutService = exports.INativeKeyboardLayoutService = void 0;
    exports.INativeKeyboardLayoutService = (0, instantiation_1.createDecorator)('nativeKeyboardLayoutService');
    let NativeKeyboardLayoutService = class NativeKeyboardLayoutService extends lifecycle_1.Disposable {
        constructor(mainProcessService) {
            super();
            this._onDidChangeKeyboardLayout = this._register(new event_1.Emitter());
            this.onDidChangeKeyboardLayout = this._onDidChangeKeyboardLayout.event;
            this._keyboardLayoutService = ipc_1.ProxyChannel.toService(mainProcessService.getChannel('keyboardLayout'));
            this._initPromise = null;
            this._keyboardMapping = null;
            this._keyboardLayoutInfo = null;
            this._register(this._keyboardLayoutService.onDidChangeKeyboardLayout(async ({ keyboardLayoutInfo, keyboardMapping }) => {
                await this.initialize();
                if (keyboardMappingEquals(this._keyboardMapping, keyboardMapping)) {
                    // the mappings are equal
                    return;
                }
                this._keyboardMapping = keyboardMapping;
                this._keyboardLayoutInfo = keyboardLayoutInfo;
                this._onDidChangeKeyboardLayout.fire();
            }));
        }
        initialize() {
            if (!this._initPromise) {
                this._initPromise = this._doInitialize();
            }
            return this._initPromise;
        }
        async _doInitialize() {
            const keyboardLayoutData = await this._keyboardLayoutService.getKeyboardLayoutData();
            const { keyboardLayoutInfo, keyboardMapping } = keyboardLayoutData;
            this._keyboardMapping = keyboardMapping;
            this._keyboardLayoutInfo = keyboardLayoutInfo;
        }
        getRawKeyboardMapping() {
            return this._keyboardMapping;
        }
        getCurrentKeyboardLayout() {
            return this._keyboardLayoutInfo;
        }
    };
    exports.NativeKeyboardLayoutService = NativeKeyboardLayoutService;
    exports.NativeKeyboardLayoutService = NativeKeyboardLayoutService = __decorate([
        __param(0, mainProcessService_1.IMainProcessService)
    ], NativeKeyboardLayoutService);
    function keyboardMappingEquals(a, b) {
        if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
            return (0, keyboardLayout_1.windowsKeyboardMappingEquals)(a, b);
        }
        return (0, keyboardLayout_1.macLinuxKeyboardMappingEquals)(a, b);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlS2V5Ym9hcmRMYXlvdXRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMva2V5YmluZGluZy9lbGVjdHJvbi1zYW5kYm94L25hdGl2ZUtleWJvYXJkTGF5b3V0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXbkYsUUFBQSw0QkFBNEIsR0FBRyxJQUFBLCtCQUFlLEVBQStCLDZCQUE2QixDQUFDLENBQUM7SUFTbEgsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTtRQVkxRCxZQUNzQixrQkFBdUM7WUFFNUQsS0FBSyxFQUFFLENBQUM7WUFYUSwrQkFBMEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN6RSw4QkFBeUIsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDO1lBVzFFLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxrQkFBWSxDQUFDLFNBQVMsQ0FBbUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUN4SSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztZQUN6QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBQzdCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7WUFFaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMseUJBQXlCLENBQUMsS0FBSyxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsZUFBZSxFQUFFLEVBQUUsRUFBRTtnQkFDdEgsTUFBTSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3hCLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGVBQWUsQ0FBQyxFQUFFLENBQUM7b0JBQ25FLHlCQUF5QjtvQkFDekIsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3hDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU0sVUFBVTtZQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUMxQyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFFTyxLQUFLLENBQUMsYUFBYTtZQUMxQixNQUFNLGtCQUFrQixHQUFHLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDckYsTUFBTSxFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxHQUFHLGtCQUFrQixDQUFDO1lBQ25FLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7WUFDeEMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDO1FBQy9DLENBQUM7UUFFTSxxQkFBcUI7WUFDM0IsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFDOUIsQ0FBQztRQUVNLHdCQUF3QjtZQUM5QixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztRQUNqQyxDQUFDO0tBQ0QsQ0FBQTtJQXZEWSxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQWFyQyxXQUFBLHdDQUFtQixDQUFBO09BYlQsMkJBQTJCLENBdUR2QztJQUVELFNBQVMscUJBQXFCLENBQUMsQ0FBMEIsRUFBRSxDQUEwQjtRQUNwRixJQUFJLGFBQUUsb0NBQTRCLEVBQUUsQ0FBQztZQUNwQyxPQUFPLElBQUEsNkNBQTRCLEVBQWlDLENBQUMsRUFBa0MsQ0FBQyxDQUFDLENBQUM7UUFDM0csQ0FBQztRQUVELE9BQU8sSUFBQSw4Q0FBNkIsRUFBa0MsQ0FBQyxFQUFtQyxDQUFDLENBQUMsQ0FBQztJQUM5RyxDQUFDIn0=