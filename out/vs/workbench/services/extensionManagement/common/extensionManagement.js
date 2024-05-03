/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/network", "vs/nls"], function (require, exports, instantiation_1, extensionManagement_1, network_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWebExtensionsScannerService = exports.IWorkbenchExtensionEnablementService = exports.EnablementState = exports.extensionsConfigurationNodeBase = exports.IWorkbenchExtensionManagementService = exports.DefaultIconPath = exports.IExtensionManagementServerService = exports.ExtensionInstallLocation = exports.IProfileAwareExtensionManagementService = void 0;
    exports.IProfileAwareExtensionManagementService = (0, instantiation_1.refineServiceDecorator)(extensionManagement_1.IExtensionManagementService);
    var ExtensionInstallLocation;
    (function (ExtensionInstallLocation) {
        ExtensionInstallLocation[ExtensionInstallLocation["Local"] = 1] = "Local";
        ExtensionInstallLocation[ExtensionInstallLocation["Remote"] = 2] = "Remote";
        ExtensionInstallLocation[ExtensionInstallLocation["Web"] = 3] = "Web";
    })(ExtensionInstallLocation || (exports.ExtensionInstallLocation = ExtensionInstallLocation = {}));
    exports.IExtensionManagementServerService = (0, instantiation_1.createDecorator)('extensionManagementServerService');
    exports.DefaultIconPath = network_1.FileAccess.asBrowserUri('vs/workbench/services/extensionManagement/common/media/defaultIcon.png').toString(true);
    exports.IWorkbenchExtensionManagementService = (0, instantiation_1.refineServiceDecorator)(exports.IProfileAwareExtensionManagementService);
    exports.extensionsConfigurationNodeBase = {
        id: 'extensions',
        order: 30,
        title: (0, nls_1.localize)('extensionsConfigurationTitle', "Extensions"),
        type: 'object'
    };
    var EnablementState;
    (function (EnablementState) {
        EnablementState[EnablementState["DisabledByTrustRequirement"] = 0] = "DisabledByTrustRequirement";
        EnablementState[EnablementState["DisabledByExtensionKind"] = 1] = "DisabledByExtensionKind";
        EnablementState[EnablementState["DisabledByEnvironment"] = 2] = "DisabledByEnvironment";
        EnablementState[EnablementState["EnabledByEnvironment"] = 3] = "EnabledByEnvironment";
        EnablementState[EnablementState["DisabledByVirtualWorkspace"] = 4] = "DisabledByVirtualWorkspace";
        EnablementState[EnablementState["DisabledByExtensionDependency"] = 5] = "DisabledByExtensionDependency";
        EnablementState[EnablementState["DisabledGlobally"] = 6] = "DisabledGlobally";
        EnablementState[EnablementState["DisabledWorkspace"] = 7] = "DisabledWorkspace";
        EnablementState[EnablementState["EnabledGlobally"] = 8] = "EnabledGlobally";
        EnablementState[EnablementState["EnabledWorkspace"] = 9] = "EnabledWorkspace";
    })(EnablementState || (exports.EnablementState = EnablementState = {}));
    exports.IWorkbenchExtensionEnablementService = (0, instantiation_1.createDecorator)('extensionEnablementService');
    exports.IWebExtensionsScannerService = (0, instantiation_1.createDecorator)('IWebExtensionsScannerService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbk1hbmFnZW1lbnQvY29tbW9uL2V4dGVuc2lvbk1hbmFnZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWW5GLFFBQUEsdUNBQXVDLEdBQUcsSUFBQSxzQ0FBc0IsRUFBdUUsaURBQTJCLENBQUMsQ0FBQztJQVdqTCxJQUFrQix3QkFJakI7SUFKRCxXQUFrQix3QkFBd0I7UUFDekMseUVBQVMsQ0FBQTtRQUNULDJFQUFNLENBQUE7UUFDTixxRUFBRyxDQUFBO0lBQ0osQ0FBQyxFQUppQix3QkFBd0Isd0NBQXhCLHdCQUF3QixRQUl6QztJQUVZLFFBQUEsaUNBQWlDLEdBQUcsSUFBQSwrQkFBZSxFQUFvQyxrQ0FBa0MsQ0FBQyxDQUFDO0lBVTNILFFBQUEsZUFBZSxHQUFHLG9CQUFVLENBQUMsWUFBWSxDQUFDLHdFQUF3RSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBZW5JLFFBQUEsb0NBQW9DLEdBQUcsSUFBQSxzQ0FBc0IsRUFBZ0YsK0NBQXVDLENBQUMsQ0FBQztJQXNCdEwsUUFBQSwrQkFBK0IsR0FBRztRQUM5QyxFQUFFLEVBQUUsWUFBWTtRQUNoQixLQUFLLEVBQUUsRUFBRTtRQUNULEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSxZQUFZLENBQUM7UUFDN0QsSUFBSSxFQUFFLFFBQVE7S0FDZCxDQUFDO0lBRUYsSUFBa0IsZUFXakI7SUFYRCxXQUFrQixlQUFlO1FBQ2hDLGlHQUEwQixDQUFBO1FBQzFCLDJGQUF1QixDQUFBO1FBQ3ZCLHVGQUFxQixDQUFBO1FBQ3JCLHFGQUFvQixDQUFBO1FBQ3BCLGlHQUEwQixDQUFBO1FBQzFCLHVHQUE2QixDQUFBO1FBQzdCLDZFQUFnQixDQUFBO1FBQ2hCLCtFQUFpQixDQUFBO1FBQ2pCLDJFQUFlLENBQUE7UUFDZiw2RUFBZ0IsQ0FBQTtJQUNqQixDQUFDLEVBWGlCLGVBQWUsK0JBQWYsZUFBZSxRQVdoQztJQUVZLFFBQUEsb0NBQW9DLEdBQUcsSUFBQSwrQkFBZSxFQUF1Qyw0QkFBNEIsQ0FBQyxDQUFDO0lBOEUzSCxRQUFBLDRCQUE0QixHQUFHLElBQUEsK0JBQWUsRUFBK0IsOEJBQThCLENBQUMsQ0FBQyJ9