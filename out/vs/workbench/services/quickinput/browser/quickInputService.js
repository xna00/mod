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
define(["require", "exports", "vs/platform/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/browser/quickInputService", "vs/platform/instantiation/common/extensions", "vs/platform/quickinput/common/quickInput", "vs/workbench/browser/quickaccess"], function (require, exports, layoutService_1, instantiation_1, themeService_1, configuration_1, contextkey_1, keybinding_1, quickInputService_1, extensions_1, quickInput_1, quickaccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputService = void 0;
    let QuickInputService = class QuickInputService extends quickInputService_1.QuickInputService {
        constructor(configurationService, instantiationService, keybindingService, contextKeyService, themeService, layoutService) {
            super(instantiationService, contextKeyService, themeService, layoutService, configurationService);
            this.keybindingService = keybindingService;
            this.inQuickInputContext = quickaccess_1.InQuickPickContextKey.bindTo(this.contextKeyService);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.onShow(() => this.inQuickInputContext.set(true)));
            this._register(this.onHide(() => this.inQuickInputContext.set(false)));
        }
        createController() {
            return super.createController(this.layoutService, {
                ignoreFocusOut: () => !this.configurationService.getValue('workbench.quickOpen.closeOnFocusLost'),
                backKeybindingLabel: () => this.keybindingService.lookupKeybinding('workbench.action.quickInputBack')?.getLabel() || undefined,
            });
        }
    };
    exports.QuickInputService = QuickInputService;
    exports.QuickInputService = QuickInputService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, themeService_1.IThemeService),
        __param(5, layoutService_1.ILayoutService)
    ], QuickInputService);
    (0, extensions_1.registerSingleton)(quickInput_1.IQuickInputService, QuickInputService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tJbnB1dFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9xdWlja2lucHV0L2Jyb3dzZXIvcXVpY2tJbnB1dFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEscUNBQXFCO1FBSTNELFlBQ3dCLG9CQUEyQyxFQUMzQyxvQkFBMkMsRUFDOUMsaUJBQXNELEVBQ3RELGlCQUFxQyxFQUMxQyxZQUEyQixFQUMxQixhQUE2QjtZQUU3QyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBTDdELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFMMUQsd0JBQW1CLEdBQUcsbUNBQXFCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBWTNGLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRWtCLGdCQUFnQjtZQUNsQyxPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUNqRCxjQUFjLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLHNDQUFzQyxDQUFDO2dCQUNqRyxtQkFBbUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsaUNBQWlDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxTQUFTO2FBQzlILENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRCxDQUFBO0lBNUJZLDhDQUFpQjtnQ0FBakIsaUJBQWlCO1FBSzNCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSw4QkFBYyxDQUFBO09BVkosaUJBQWlCLENBNEI3QjtJQUVELElBQUEsOEJBQWlCLEVBQUMsK0JBQWtCLEVBQUUsaUJBQWlCLG9DQUE0QixDQUFDIn0=