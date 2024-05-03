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
define(["require", "exports", "vs/platform/accessibility/common/accessibility", "vs/base/common/platform", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/accessibility/browser/accessibilityService", "vs/platform/instantiation/common/extensions", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/common/contributions", "vs/platform/native/common/native", "vs/platform/layout/browser/layoutService"], function (require, exports, accessibility_1, platform_1, environmentService_1, contextkey_1, configuration_1, accessibilityService_1, extensions_1, telemetry_1, jsonEditing_1, contributions_1, native_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeAccessibilityService = void 0;
    let NativeAccessibilityService = class NativeAccessibilityService extends accessibilityService_1.AccessibilityService {
        constructor(environmentService, contextKeyService, configurationService, _layoutService, _telemetryService, nativeHostService) {
            super(contextKeyService, _layoutService, configurationService);
            this._telemetryService = _telemetryService;
            this.nativeHostService = nativeHostService;
            this.didSendTelemetry = false;
            this.shouldAlwaysUnderlineAccessKeys = undefined;
            this.setAccessibilitySupport(environmentService.window.accessibilitySupport ? 2 /* AccessibilitySupport.Enabled */ : 1 /* AccessibilitySupport.Disabled */);
        }
        async alwaysUnderlineAccessKeys() {
            if (!platform_1.isWindows) {
                return false;
            }
            if (typeof this.shouldAlwaysUnderlineAccessKeys !== 'boolean') {
                const windowsKeyboardAccessibility = await this.nativeHostService.windowsGetStringRegKey('HKEY_CURRENT_USER', 'Control Panel\\Accessibility\\Keyboard Preference', 'On');
                this.shouldAlwaysUnderlineAccessKeys = (windowsKeyboardAccessibility === '1');
            }
            return this.shouldAlwaysUnderlineAccessKeys;
        }
        setAccessibilitySupport(accessibilitySupport) {
            super.setAccessibilitySupport(accessibilitySupport);
            if (!this.didSendTelemetry && accessibilitySupport === 2 /* AccessibilitySupport.Enabled */) {
                this._telemetryService.publicLog2('accessibility', { enabled: true });
                this.didSendTelemetry = true;
            }
        }
    };
    exports.NativeAccessibilityService = NativeAccessibilityService;
    exports.NativeAccessibilityService = NativeAccessibilityService = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, native_1.INativeHostService)
    ], NativeAccessibilityService);
    (0, extensions_1.registerSingleton)(accessibility_1.IAccessibilityService, NativeAccessibilityService, 1 /* InstantiationType.Delayed */);
    // On linux we do not automatically detect that a screen reader is detected, thus we have to implicitly notify the renderer to enable accessibility when user configures it in settings
    let LinuxAccessibilityContribution = class LinuxAccessibilityContribution {
        static { this.ID = 'workbench.contrib.linuxAccessibility'; }
        constructor(jsonEditingService, accessibilityService, environmentService) {
            const forceRendererAccessibility = () => {
                if (accessibilityService.isScreenReaderOptimized()) {
                    jsonEditingService.write(environmentService.argvResource, [{ path: ['force-renderer-accessibility'], value: true }], true);
                }
            };
            forceRendererAccessibility();
            accessibilityService.onDidChangeScreenReaderOptimized(forceRendererAccessibility);
        }
    };
    LinuxAccessibilityContribution = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, accessibility_1.IAccessibilityService),
        __param(2, environmentService_1.INativeWorkbenchEnvironmentService)
    ], LinuxAccessibilityContribution);
    if (platform_1.isLinux) {
        (0, contributions_1.registerWorkbenchContribution2)(LinuxAccessibilityContribution.ID, LinuxAccessibilityContribution, 2 /* WorkbenchPhase.BlockRestore */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9hY2Nlc3NpYmlsaXR5L2VsZWN0cm9uLXNhbmRib3gvYWNjZXNzaWJpbGl0eVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0J6RixJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLDJDQUFvQjtRQUtuRSxZQUNxQyxrQkFBc0QsRUFDdEUsaUJBQXFDLEVBQ2xDLG9CQUEyQyxFQUNsRCxjQUE4QixFQUMzQixpQkFBcUQsRUFDcEQsaUJBQXNEO1lBRTFFLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUgzQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ25DLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFUbkUscUJBQWdCLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLG9DQUErQixHQUF3QixTQUFTLENBQUM7WUFXeEUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLHNDQUE4QixDQUFDLHNDQUE4QixDQUFDLENBQUM7UUFDN0ksQ0FBQztRQUVRLEtBQUssQ0FBQyx5QkFBeUI7WUFDdkMsSUFBSSxDQUFDLG9CQUFTLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsSUFBSSxPQUFPLElBQUksQ0FBQywrQkFBK0IsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDL0QsTUFBTSw0QkFBNEIsR0FBRyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxtQkFBbUIsRUFBRSxtREFBbUQsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDekssSUFBSSxDQUFDLCtCQUErQixHQUFHLENBQUMsNEJBQTRCLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDL0UsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLCtCQUErQixDQUFDO1FBQzdDLENBQUM7UUFFUSx1QkFBdUIsQ0FBQyxvQkFBMEM7WUFDMUUsS0FBSyxDQUFDLHVCQUF1QixDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFFcEQsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxvQkFBb0IseUNBQWlDLEVBQUUsQ0FBQztnQkFDckYsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBMkQsZUFBZSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2hJLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBdENZLGdFQUEwQjt5Q0FBMUIsMEJBQTBCO1FBTXBDLFdBQUEsdURBQWtDLENBQUE7UUFDbEMsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSwyQkFBa0IsQ0FBQTtPQVhSLDBCQUEwQixDQXNDdEM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLHFDQUFxQixFQUFFLDBCQUEwQixvQ0FBNEIsQ0FBQztJQUVoRyx1TEFBdUw7SUFDdkwsSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBOEI7aUJBRW5CLE9BQUUsR0FBRyxzQ0FBc0MsQUFBekMsQ0FBMEM7UUFFNUQsWUFDc0Isa0JBQXVDLEVBQ3JDLG9CQUEyQyxFQUM5QixrQkFBc0Q7WUFFMUYsTUFBTSwwQkFBMEIsR0FBRyxHQUFHLEVBQUU7Z0JBQ3ZDLElBQUksb0JBQW9CLENBQUMsdUJBQXVCLEVBQUUsRUFBRSxDQUFDO29CQUNwRCxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM1SCxDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBQ0YsMEJBQTBCLEVBQUUsQ0FBQztZQUM3QixvQkFBb0IsQ0FBQyxnQ0FBZ0MsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ25GLENBQUM7O0lBaEJJLDhCQUE4QjtRQUtqQyxXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSx1REFBa0MsQ0FBQTtPQVAvQiw4QkFBOEIsQ0FpQm5DO0lBRUQsSUFBSSxrQkFBTyxFQUFFLENBQUM7UUFDYixJQUFBLDhDQUE4QixFQUFDLDhCQUE4QixDQUFDLEVBQUUsRUFBRSw4QkFBOEIsc0NBQThCLENBQUM7SUFDaEksQ0FBQyJ9