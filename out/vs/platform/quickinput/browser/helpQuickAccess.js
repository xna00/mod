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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/common/quickAccess", "vs/platform/quickinput/common/quickInput"], function (require, exports, nls_1, platform_1, lifecycle_1, keybinding_1, quickAccess_1, quickInput_1) {
    "use strict";
    var HelpQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HelpQuickAccessProvider = void 0;
    let HelpQuickAccessProvider = class HelpQuickAccessProvider {
        static { HelpQuickAccessProvider_1 = this; }
        static { this.PREFIX = '?'; }
        constructor(quickInputService, keybindingService) {
            this.quickInputService = quickInputService;
            this.keybindingService = keybindingService;
            this.registry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
        }
        provide(picker) {
            const disposables = new lifecycle_1.DisposableStore();
            // Open a picker with the selected value if picked
            disposables.add(picker.onDidAccept(() => {
                const [item] = picker.selectedItems;
                if (item) {
                    this.quickInputService.quickAccess.show(item.prefix, { preserveValue: true });
                }
            }));
            // Also open a picker when we detect the user typed the exact
            // name of a provider (e.g. `?term` for terminals)
            disposables.add(picker.onDidChangeValue(value => {
                const providerDescriptor = this.registry.getQuickAccessProvider(value.substr(HelpQuickAccessProvider_1.PREFIX.length));
                if (providerDescriptor && providerDescriptor.prefix && providerDescriptor.prefix !== HelpQuickAccessProvider_1.PREFIX) {
                    this.quickInputService.quickAccess.show(providerDescriptor.prefix, { preserveValue: true });
                }
            }));
            // Fill in all providers
            picker.items = this.getQuickAccessProviders().filter(p => p.prefix !== HelpQuickAccessProvider_1.PREFIX);
            return disposables;
        }
        getQuickAccessProviders() {
            const providers = this.registry
                .getQuickAccessProviders()
                .sort((providerA, providerB) => providerA.prefix.localeCompare(providerB.prefix))
                .flatMap(provider => this.createPicks(provider));
            return providers;
        }
        createPicks(provider) {
            return provider.helpEntries.map(helpEntry => {
                const prefix = helpEntry.prefix || provider.prefix;
                const label = prefix || '\u2026' /* ... */;
                return {
                    prefix,
                    label,
                    keybinding: helpEntry.commandId ? this.keybindingService.lookupKeybinding(helpEntry.commandId) : undefined,
                    ariaLabel: (0, nls_1.localize)('helpPickAriaLabel', "{0}, {1}", label, helpEntry.description),
                    description: helpEntry.description
                };
            });
        }
    };
    exports.HelpQuickAccessProvider = HelpQuickAccessProvider;
    exports.HelpQuickAccessProvider = HelpQuickAccessProvider = HelpQuickAccessProvider_1 = __decorate([
        __param(0, quickInput_1.IQuickInputService),
        __param(1, keybinding_1.IKeybindingService)
    ], HelpQuickAccessProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscFF1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9xdWlja2lucHV0L2Jyb3dzZXIvaGVscFF1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7O2lCQUU1QixXQUFNLEdBQUcsR0FBRyxBQUFOLENBQU87UUFJcEIsWUFDcUIsaUJBQXNELEVBQ3RELGlCQUFzRDtZQURyQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3JDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFKMUQsYUFBUSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF1Qix3QkFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBS2xGLENBQUM7UUFFTCxPQUFPLENBQUMsTUFBNEM7WUFDbkQsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMsa0RBQWtEO1lBQ2xELFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3ZDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO2dCQUNwQyxJQUFJLElBQUksRUFBRSxDQUFDO29CQUNWLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDL0UsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiw2REFBNkQ7WUFDN0Qsa0RBQWtEO1lBQ2xELFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMvQyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyx5QkFBdUIsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDckgsSUFBSSxrQkFBa0IsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLElBQUksa0JBQWtCLENBQUMsTUFBTSxLQUFLLHlCQUF1QixDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNySCxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDN0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSix3QkFBd0I7WUFDeEIsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLHlCQUF1QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXZHLE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFFRCx1QkFBdUI7WUFDdEIsTUFBTSxTQUFTLEdBQStCLElBQUksQ0FBQyxRQUFRO2lCQUN6RCx1QkFBdUIsRUFBRTtpQkFDekIsSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2lCQUNoRixPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFbEQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLFdBQVcsQ0FBQyxRQUF3QztZQUMzRCxPQUFPLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUMzQyxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ25ELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxRQUFRLENBQUMsU0FBUyxDQUFDO2dCQUUzQyxPQUFPO29CQUNOLE1BQU07b0JBQ04sS0FBSztvQkFDTCxVQUFVLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDMUcsU0FBUyxFQUFFLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLFdBQVcsQ0FBQztvQkFDbEYsV0FBVyxFQUFFLFNBQVMsQ0FBQyxXQUFXO2lCQUNsQyxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDOztJQTNEVywwREFBdUI7c0NBQXZCLHVCQUF1QjtRQU9qQyxXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsK0JBQWtCLENBQUE7T0FSUix1QkFBdUIsQ0E0RG5DIn0=