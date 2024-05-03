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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/contrib/folding/browser/folding", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/configuration/common/configurationRegistry", "vs/editor/common/config/editorConfigurationSchema", "vs/workbench/services/extensions/common/extensions", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, folding_1, nls, platform_1, contributions_1, configurationRegistry_1, editorConfigurationSchema_1, extensions_1, configuration_1) {
    "use strict";
    var DefaultFoldingRangeProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let DefaultFoldingRangeProvider = class DefaultFoldingRangeProvider extends lifecycle_1.Disposable {
        static { DefaultFoldingRangeProvider_1 = this; }
        static { this.configName = 'editor.defaultFoldingRangeProvider'; }
        static { this.extensionIds = []; }
        static { this.extensionItemLabels = []; }
        static { this.extensionDescriptions = []; }
        constructor(_extensionService, _configurationService) {
            super();
            this._extensionService = _extensionService;
            this._configurationService = _configurationService;
            this._store.add(this._extensionService.onDidChangeExtensions(this._updateConfigValues, this));
            this._store.add(folding_1.FoldingController.setFoldingRangeProviderSelector(this._selectFoldingRangeProvider.bind(this)));
            this._updateConfigValues();
        }
        async _updateConfigValues() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            DefaultFoldingRangeProvider_1.extensionIds.length = 0;
            DefaultFoldingRangeProvider_1.extensionItemLabels.length = 0;
            DefaultFoldingRangeProvider_1.extensionDescriptions.length = 0;
            DefaultFoldingRangeProvider_1.extensionIds.push(null);
            DefaultFoldingRangeProvider_1.extensionItemLabels.push(nls.localize('null', 'All'));
            DefaultFoldingRangeProvider_1.extensionDescriptions.push(nls.localize('nullFormatterDescription', "All active folding range providers"));
            const languageExtensions = [];
            const otherExtensions = [];
            for (const extension of this._extensionService.extensions) {
                if (extension.main || extension.browser) {
                    if (extension.categories?.find(cat => cat === 'Programming Languages')) {
                        languageExtensions.push(extension);
                    }
                    else {
                        otherExtensions.push(extension);
                    }
                }
            }
            const sorter = (a, b) => a.name.localeCompare(b.name);
            for (const extension of languageExtensions.sort(sorter)) {
                DefaultFoldingRangeProvider_1.extensionIds.push(extension.identifier.value);
                DefaultFoldingRangeProvider_1.extensionItemLabels.push(extension.displayName ?? '');
                DefaultFoldingRangeProvider_1.extensionDescriptions.push(extension.description ?? '');
            }
            for (const extension of otherExtensions.sort(sorter)) {
                DefaultFoldingRangeProvider_1.extensionIds.push(extension.identifier.value);
                DefaultFoldingRangeProvider_1.extensionItemLabels.push(extension.displayName ?? '');
                DefaultFoldingRangeProvider_1.extensionDescriptions.push(extension.description ?? '');
            }
        }
        _selectFoldingRangeProvider(providers, document) {
            const value = this._configurationService.getValue(DefaultFoldingRangeProvider_1.configName, { overrideIdentifier: document.getLanguageId() });
            if (value) {
                return providers.filter(p => p.id === value);
            }
            return undefined;
        }
    };
    DefaultFoldingRangeProvider = DefaultFoldingRangeProvider_1 = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, configuration_1.IConfigurationService)
    ], DefaultFoldingRangeProvider);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...editorConfigurationSchema_1.editorConfigurationBaseNode,
        properties: {
            [DefaultFoldingRangeProvider.configName]: {
                description: nls.localize('formatter.default', "Defines a default folding range provider that takes precedence over all other folding range providers. Must be the identifier of an extension contributing a folding range provider."),
                type: ['string', 'null'],
                default: null,
                enum: DefaultFoldingRangeProvider.extensionIds,
                enumItemLabels: DefaultFoldingRangeProvider.extensionItemLabels,
                markdownEnumDescriptions: DefaultFoldingRangeProvider.extensionDescriptions
            }
        }
    });
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(DefaultFoldingRangeProvider, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZvbGRpbmcvYnJvd3Nlci9mb2xkaW5nLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQmhHLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7O2lCQUVuQyxlQUFVLEdBQUcsb0NBQW9DLEFBQXZDLENBQXdDO2lCQUUzRCxpQkFBWSxHQUFzQixFQUFFLEFBQXhCLENBQXlCO2lCQUNyQyx3QkFBbUIsR0FBYSxFQUFFLEFBQWYsQ0FBZ0I7aUJBQ25DLDBCQUFxQixHQUFhLEVBQUUsQUFBZixDQUFnQjtRQUU1QyxZQUNxQyxpQkFBb0MsRUFDaEMscUJBQTRDO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBSDRCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDaEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUdwRixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsMkJBQWlCLENBQUMsK0JBQStCLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFaEgsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUVPLEtBQUssQ0FBQyxtQkFBbUI7WUFDaEMsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsaUNBQWlDLEVBQUUsQ0FBQztZQUVq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