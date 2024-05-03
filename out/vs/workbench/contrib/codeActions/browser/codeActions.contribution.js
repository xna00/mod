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
define(["require", "exports", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/codeActions/common/codeActionsExtensionPoint", "vs/workbench/contrib/codeActions/common/documentationExtensionPoint", "vs/workbench/services/extensions/common/extensionsRegistry", "./codeActionsContribution", "./documentationContribution"], function (require, exports, configurationRegistry_1, instantiation_1, platform_1, contributions_1, codeActionsExtensionPoint_1, documentationExtensionPoint_1, extensionsRegistry_1, codeActionsContribution_1, documentationContribution_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const codeActionsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint(codeActionsExtensionPoint_1.codeActionsExtensionPointDescriptor);
    const documentationExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint(documentationExtensionPoint_1.documentationExtensionPointDescriptor);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration(codeActionsContribution_1.editorConfiguration);
    let WorkbenchConfigurationContribution = class WorkbenchConfigurationContribution {
        constructor(instantiationService) {
            instantiationService.createInstance(codeActionsContribution_1.CodeActionsContribution, codeActionsExtensionPoint);
            instantiationService.createInstance(documentationContribution_1.CodeActionDocumentationContribution, documentationExtensionPoint);
        }
    };
    WorkbenchConfigurationContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], WorkbenchConfigurationContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(WorkbenchConfigurationContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbnMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlQWN0aW9ucy9icm93c2VyL2NvZGVBY3Rpb25zLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQWFoRyxNQUFNLHlCQUF5QixHQUFHLHVDQUFrQixDQUFDLHNCQUFzQixDQUE4QiwrREFBbUMsQ0FBQyxDQUFDO0lBQzlJLE1BQU0sMkJBQTJCLEdBQUcsdUNBQWtCLENBQUMsc0JBQXNCLENBQThCLG1FQUFxQyxDQUFDLENBQUM7SUFFbEosbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUFVLENBQUMsYUFBYSxDQUFDO1NBQzNELHFCQUFxQixDQUFDLDZDQUFtQixDQUFDLENBQUM7SUFFN0MsSUFBTSxrQ0FBa0MsR0FBeEMsTUFBTSxrQ0FBa0M7UUFDdkMsWUFDd0Isb0JBQTJDO1lBRWxFLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpREFBdUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1lBQ3hGLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywrREFBbUMsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO1FBQ3ZHLENBQUM7S0FDRCxDQUFBO0lBUEssa0NBQWtDO1FBRXJDLFdBQUEscUNBQXFCLENBQUE7T0FGbEIsa0NBQWtDLENBT3ZDO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQztTQUN6RSw2QkFBNkIsQ0FBQyxrQ0FBa0Msb0NBQTRCLENBQUMifQ==