/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/platform/registry/common/platform"], function (require, exports, arrays_1, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickAccessRegistry = exports.Extensions = exports.DefaultQuickAccessFilterValue = void 0;
    var DefaultQuickAccessFilterValue;
    (function (DefaultQuickAccessFilterValue) {
        /**
         * Keep the value as it is given to quick access.
         */
        DefaultQuickAccessFilterValue[DefaultQuickAccessFilterValue["PRESERVE"] = 0] = "PRESERVE";
        /**
         * Use the value that was used last time something was accepted from the picker.
         */
        DefaultQuickAccessFilterValue[DefaultQuickAccessFilterValue["LAST"] = 1] = "LAST";
    })(DefaultQuickAccessFilterValue || (exports.DefaultQuickAccessFilterValue = DefaultQuickAccessFilterValue = {}));
    exports.Extensions = {
        Quickaccess: 'workbench.contributions.quickaccess'
    };
    class QuickAccessRegistry {
        constructor() {
            this.providers = [];
            this.defaultProvider = undefined;
        }
        registerQuickAccessProvider(provider) {
            // Extract the default provider when no prefix is present
            if (provider.prefix.length === 0) {
                this.defaultProvider = provider;
            }
            else {
                this.providers.push(provider);
            }
            // sort the providers by decreasing prefix length, such that longer
            // prefixes take priority: 'ext' vs 'ext install' - the latter should win
            this.providers.sort((providerA, providerB) => providerB.prefix.length - providerA.prefix.length);
            return (0, lifecycle_1.toDisposable)(() => {
                this.providers.splice(this.providers.indexOf(provider), 1);
                if (this.defaultProvider === provider) {
                    this.defaultProvider = undefined;
                }
            });
        }
        getQuickAccessProviders() {
            return (0, arrays_1.coalesce)([this.defaultProvider, ...this.providers]);
        }
        getQuickAccessProvider(prefix) {
            const result = prefix ? (this.providers.find(provider => prefix.startsWith(provider.prefix)) || undefined) : undefined;
            return result || this.defaultProvider;
        }
        clear() {
            const providers = [...this.providers];
            const defaultProvider = this.defaultProvider;
            this.providers = [];
            this.defaultProvider = undefined;
            return () => {
                this.providers = providers;
                this.defaultProvider = defaultProvider;
            };
        }
    }
    exports.QuickAccessRegistry = QuickAccessRegistry;
    platform_1.Registry.add(exports.Extensions.Quickaccess, new QuickAccessRegistry());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tBY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3F1aWNraW5wdXQvY29tbW9uL3F1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFFaEcsSUFBWSw2QkFXWDtJQVhELFdBQVksNkJBQTZCO1FBRXhDOztXQUVHO1FBQ0gseUZBQVksQ0FBQTtRQUVaOztXQUVHO1FBQ0gsaUZBQVEsQ0FBQTtJQUNULENBQUMsRUFYVyw2QkFBNkIsNkNBQTdCLDZCQUE2QixRQVd4QztJQStGWSxRQUFBLFVBQVUsR0FBRztRQUN6QixXQUFXLEVBQUUscUNBQXFDO0tBQ2xELENBQUM7SUFvQkYsTUFBYSxtQkFBbUI7UUFBaEM7WUFFUyxjQUFTLEdBQXFDLEVBQUUsQ0FBQztZQUNqRCxvQkFBZSxHQUErQyxTQUFTLENBQUM7UUE4Q2pGLENBQUM7UUE1Q0EsMkJBQTJCLENBQUMsUUFBd0M7WUFFbkUseURBQXlEO1lBQ3pELElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxlQUFlLEdBQUcsUUFBUSxDQUFDO1lBQ2pDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQixDQUFDO1lBRUQsbUVBQW1FO1lBQ25FLHlFQUF5RTtZQUN6RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFakcsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFM0QsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUN2QyxJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztnQkFDbEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELHVCQUF1QjtZQUN0QixPQUFPLElBQUEsaUJBQVEsRUFBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRUQsc0JBQXNCLENBQUMsTUFBYztZQUNwQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFFdkgsT0FBTyxNQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUN2QyxDQUFDO1FBRUQsS0FBSztZQUNKLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUU3QyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztZQUVqQyxPQUFPLEdBQUcsRUFBRTtnQkFDWCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7WUFDeEMsQ0FBQyxDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBakRELGtEQWlEQztJQUVELG1CQUFRLENBQUMsR0FBRyxDQUFDLGtCQUFVLENBQUMsV0FBVyxFQUFFLElBQUksbUJBQW1CLEVBQUUsQ0FBQyxDQUFDIn0=