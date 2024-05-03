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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService"], function (require, exports, platform, event_1, lifecycle_1, instantiation_1, lifecycleMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyboardLayoutMainService = exports.IKeyboardLayoutMainService = void 0;
    exports.IKeyboardLayoutMainService = (0, instantiation_1.createDecorator)('keyboardLayoutMainService');
    let KeyboardLayoutMainService = class KeyboardLayoutMainService extends lifecycle_1.Disposable {
        constructor(lifecycleMainService) {
            super();
            this._onDidChangeKeyboardLayout = this._register(new event_1.Emitter());
            this.onDidChangeKeyboardLayout = this._onDidChangeKeyboardLayout.event;
            this._initPromise = null;
            this._keyboardLayoutData = null;
            // perf: automatically trigger initialize after windows
            // have opened so that we can do this work in parallel
            // to the window load.
            lifecycleMainService.when(3 /* LifecycleMainPhase.AfterWindowOpen */).then(() => this._initialize());
        }
        _initialize() {
            if (!this._initPromise) {
                this._initPromise = this._doInitialize();
            }
            return this._initPromise;
        }
        async _doInitialize() {
            const nativeKeymapMod = await new Promise((resolve_1, reject_1) => { require(['native-keymap'], resolve_1, reject_1); });
            this._keyboardLayoutData = readKeyboardLayoutData(nativeKeymapMod);
            if (!platform.isCI) {
                // See https://github.com/microsoft/vscode/issues/152840
                // Do not register the keyboard layout change listener in CI because it doesn't work
                // on the build machines and it just adds noise to the build logs.
                nativeKeymapMod.onDidChangeKeyboardLayout(() => {
                    this._keyboardLayoutData = readKeyboardLayoutData(nativeKeymapMod);
                    this._onDidChangeKeyboardLayout.fire(this._keyboardLayoutData);
                });
            }
        }
        async getKeyboardLayoutData() {
            await this._initialize();
            return this._keyboardLayoutData;
        }
    };
    exports.KeyboardLayoutMainService = KeyboardLayoutMainService;
    exports.KeyboardLayoutMainService = KeyboardLayoutMainService = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService)
    ], KeyboardLayoutMainService);
    function readKeyboardLayoutData(nativeKeymapMod) {
        const keyboardMapping = nativeKeymapMod.getKeyMap();
        const keyboardLayoutInfo = nativeKeymapMod.getCurrentKeyboardLayout();
        return { keyboardMapping, keyboardLayoutInfo };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmRMYXlvdXRNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0va2V5Ym9hcmRMYXlvdXQvZWxlY3Ryb24tbWFpbi9rZXlib2FyZExheW91dE1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVuRixRQUFBLDBCQUEwQixHQUFHLElBQUEsK0JBQWUsRUFBNkIsMkJBQTJCLENBQUMsQ0FBQztJQUk1RyxJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUEwQixTQUFRLHNCQUFVO1FBVXhELFlBQ3dCLG9CQUEyQztZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQVRRLCtCQUEwQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXVCLENBQUMsQ0FBQztZQUN4Riw4QkFBeUIsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDO1lBUzFFLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7WUFFaEMsdURBQXVEO1lBQ3ZELHNEQUFzRDtZQUN0RCxzQkFBc0I7WUFDdEIsb0JBQW9CLENBQUMsSUFBSSw0Q0FBb0MsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUVPLFdBQVc7WUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDMUMsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBRU8sS0FBSyxDQUFDLGFBQWE7WUFDMUIsTUFBTSxlQUFlLEdBQUcsc0RBQWEsZUFBZSwyQkFBQyxDQUFDO1lBRXRELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxzQkFBc0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNwQix3REFBd0Q7Z0JBQ3hELG9GQUFvRjtnQkFDcEYsa0VBQWtFO2dCQUNsRSxlQUFlLENBQUMseUJBQXlCLENBQUMsR0FBRyxFQUFFO29CQUM5QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsc0JBQXNCLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ25FLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2hFLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUM7UUFFTSxLQUFLLENBQUMscUJBQXFCO1lBQ2pDLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLG1CQUFvQixDQUFDO1FBQ2xDLENBQUM7S0FDRCxDQUFBO0lBakRZLDhEQUF5Qjt3Q0FBekIseUJBQXlCO1FBV25DLFdBQUEsNENBQXFCLENBQUE7T0FYWCx5QkFBeUIsQ0FpRHJDO0lBRUQsU0FBUyxzQkFBc0IsQ0FBQyxlQUFvQztRQUNuRSxNQUFNLGVBQWUsR0FBRyxlQUFlLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDcEQsTUFBTSxrQkFBa0IsR0FBRyxlQUFlLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUN0RSxPQUFPLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLENBQUM7SUFDaEQsQ0FBQyJ9