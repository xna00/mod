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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/label/common/label", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, lifecycle_1, label_1, extHost_protocol_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadLabelService = void 0;
    let MainThreadLabelService = class MainThreadLabelService extends lifecycle_1.Disposable {
        constructor(_, _labelService) {
            super();
            this._labelService = _labelService;
            this._resourceLabelFormatters = this._register(new lifecycle_1.DisposableMap());
        }
        $registerResourceLabelFormatter(handle, formatter) {
            // Dynamicily registered formatters should have priority over those contributed via package.json
            formatter.priority = true;
            const disposable = this._labelService.registerCachedFormatter(formatter);
            this._resourceLabelFormatters.set(handle, disposable);
        }
        $unregisterResourceLabelFormatter(handle) {
            this._resourceLabelFormatters.deleteAndDispose(handle);
        }
    };
    exports.MainThreadLabelService = MainThreadLabelService;
    exports.MainThreadLabelService = MainThreadLabelService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadLabelService),
        __param(1, label_1.ILabelService)
    ], MainThreadLabelService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZExhYmVsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRMYWJlbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEsc0JBQVU7UUFJckQsWUFDQyxDQUFrQixFQUNILGFBQTZDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBRndCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBSjVDLDZCQUF3QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUFVLENBQUMsQ0FBQztRQU94RixDQUFDO1FBRUQsK0JBQStCLENBQUMsTUFBYyxFQUFFLFNBQWlDO1lBQ2hGLGdHQUFnRztZQUNoRyxTQUFTLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUMxQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFRCxpQ0FBaUMsQ0FBQyxNQUFjO1lBQy9DLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4RCxDQUFDO0tBQ0QsQ0FBQTtJQXJCWSx3REFBc0I7cUNBQXRCLHNCQUFzQjtRQURsQyxJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsc0JBQXNCLENBQUM7UUFPdEQsV0FBQSxxQkFBYSxDQUFBO09BTkgsc0JBQXNCLENBcUJsQyJ9