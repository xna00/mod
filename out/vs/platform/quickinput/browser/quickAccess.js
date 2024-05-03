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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickAccess", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform"], function (require, exports, async_1, cancellation_1, event_1, lifecycle_1, instantiation_1, quickAccess_1, quickInput_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickAccessController = void 0;
    let QuickAccessController = class QuickAccessController extends lifecycle_1.Disposable {
        constructor(quickInputService, instantiationService) {
            super();
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.registry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
            this.mapProviderToDescriptor = new Map();
            this.lastAcceptedPickerValues = new Map();
            this.visibleQuickAccess = undefined;
        }
        pick(value = '', options) {
            return this.doShowOrPick(value, true, options);
        }
        show(value = '', options) {
            this.doShowOrPick(value, false, options);
        }
        doShowOrPick(value, pick, options) {
            // Find provider for the value to show
            const [provider, descriptor] = this.getOrInstantiateProvider(value);
            // Return early if quick access is already showing on that same prefix
            const visibleQuickAccess = this.visibleQuickAccess;
            const visibleDescriptor = visibleQuickAccess?.descriptor;
            if (visibleQuickAccess && descriptor && visibleDescriptor === descriptor) {
                // Apply value only if it is more specific than the prefix
                // from the provider and we are not instructed to preserve
                if (value !== descriptor.prefix && !options?.preserveValue) {
                    visibleQuickAccess.picker.value = value;
                }
                // Always adjust selection
                this.adjustValueSelection(visibleQuickAccess.picker, descriptor, options);
                return;
            }
            // Rewrite the filter value based on certain rules unless disabled
            if (descriptor && !options?.preserveValue) {
                let newValue = undefined;
                // If we have a visible provider with a value, take it's filter value but
                // rewrite to new provider prefix in case they differ
                if (visibleQuickAccess && visibleDescriptor && visibleDescriptor !== descriptor) {
                    const newValueCandidateWithoutPrefix = visibleQuickAccess.value.substr(visibleDescriptor.prefix.length);
                    if (newValueCandidateWithoutPrefix) {
                        newValue = `${descriptor.prefix}${newValueCandidateWithoutPrefix}`;
                    }
                }
                // Otherwise, take a default value as instructed
                if (!newValue) {
                    const defaultFilterValue = provider?.defaultFilterValue;
                    if (defaultFilterValue === quickAccess_1.DefaultQuickAccessFilterValue.LAST) {
                        newValue = this.lastAcceptedPickerValues.get(descriptor);
                    }
                    else if (typeof defaultFilterValue === 'string') {
                        newValue = `${descriptor.prefix}${defaultFilterValue}`;
                    }
                }
                if (typeof newValue === 'string') {
                    value = newValue;
                }
            }
            // Store the existing selection if there was one.
            const visibleSelection = visibleQuickAccess?.picker?.valueSelection;
            const visibleValue = visibleQuickAccess?.picker?.value;
            // Create a picker for the provider to use with the initial value
            // and adjust the filtering to exclude the prefix from filtering
            const disposables = new lifecycle_1.DisposableStore();
            const picker = disposables.add(this.quickInputService.createQuickPick());
            picker.value = value;
            this.adjustValueSelection(picker, descriptor, options);
            picker.placeholder = descriptor?.placeholder;
            picker.quickNavigate = options?.quickNavigateConfiguration;
            picker.hideInput = !!picker.quickNavigate && !visibleQuickAccess; // only hide input if there was no picker opened already
            if (typeof options?.itemActivation === 'number' || options?.quickNavigateConfiguration) {
                picker.itemActivation = options?.itemActivation ?? quickInput_1.ItemActivation.SECOND /* quick nav is always second */;
            }
            picker.contextKey = descriptor?.contextKey;
            picker.filterValue = (value) => value.substring(descriptor ? descriptor.prefix.length : 0);
            // Pick mode: setup a promise that can be resolved
            // with the selected items and prevent execution
            let pickPromise = undefined;
            if (pick) {
                pickPromise = new async_1.DeferredPromise();
                disposables.add(event_1.Event.once(picker.onWillAccept)(e => {
                    e.veto();
                    picker.hide();
                }));
            }
            // Register listeners
            disposables.add(this.registerPickerListeners(picker, provider, descriptor, value, options?.providerOptions));
            // Ask provider to fill the picker as needed if we have one
            // and pass over a cancellation token that will indicate when
            // the picker is hiding without a pick being made.
            const cts = disposables.add(new cancellation_1.CancellationTokenSource());
            if (provider) {
                disposables.add(provider.provide(picker, cts.token, options?.providerOptions));
            }
            // Finally, trigger disposal and cancellation when the picker
            // hides depending on items selected or not.
            event_1.Event.once(picker.onDidHide)(() => {
                if (picker.selectedItems.length === 0) {
                    cts.cancel();
                }
                // Start to dispose once picker hides
                disposables.dispose();
                // Resolve pick promise with selected items
                pickPromise?.complete(picker.selectedItems.slice(0));
            });
            // Finally, show the picker. This is important because a provider
            // may not call this and then our disposables would leak that rely
            // on the onDidHide event.
            picker.show();
            // If the previous picker had a selection and the value is unchanged, we should set that in the new picker.
            if (visibleSelection && visibleValue === value) {
                picker.valueSelection = visibleSelection;
            }
            // Pick mode: return with promise
            if (pick) {
                return pickPromise?.p;
            }
        }
        adjustValueSelection(picker, descriptor, options) {
            let valueSelection;
            // Preserve: just always put the cursor at the end
            if (options?.preserveValue) {
                valueSelection = [picker.value.length, picker.value.length];
            }
            // Otherwise: select the value up until the prefix
            else {
                valueSelection = [descriptor?.prefix.length ?? 0, picker.value.length];
            }
            picker.valueSelection = valueSelection;
        }
        registerPickerListeners(picker, provider, descriptor, value, providerOptions) {
            const disposables = new lifecycle_1.DisposableStore();
            // Remember as last visible picker and clean up once picker get's disposed
            const visibleQuickAccess = this.visibleQuickAccess = { picker, descriptor, value };
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                if (visibleQuickAccess === this.visibleQuickAccess) {
                    this.visibleQuickAccess = undefined;
                }
            }));
            // Whenever the value changes, check if the provider has
            // changed and if so - re-create the picker from the beginning
            disposables.add(picker.onDidChangeValue(value => {
                const [providerForValue] = this.getOrInstantiateProvider(value);
                if (providerForValue !== provider) {
                    this.show(value, {
                        // do not rewrite value from user typing!
                        preserveValue: true,
                        // persist the value of the providerOptions from the original showing
                        providerOptions
                    });
                }
                else {
                    visibleQuickAccess.value = value; // remember the value in our visible one
                }
            }));
            // Remember picker input for future use when accepting
            if (descriptor) {
                disposables.add(picker.onDidAccept(() => {
                    this.lastAcceptedPickerValues.set(descriptor, picker.value);
                }));
            }
            return disposables;
        }
        getOrInstantiateProvider(value) {
            const providerDescriptor = this.registry.getQuickAccessProvider(value);
            if (!providerDescriptor) {
                return [undefined, undefined];
            }
            let provider = this.mapProviderToDescriptor.get(providerDescriptor);
            if (!provider) {
                provider = this.instantiationService.createInstance(providerDescriptor.ctor);
                this.mapProviderToDescriptor.set(providerDescriptor, provider);
            }
            return [provider, providerDescriptor];
        }
    };
    exports.QuickAccessController = QuickAccessController;
    exports.QuickAccessController = QuickAccessController = __decorate([
        __param(0, quickInput_1.IQuickInputService),
        __param(1, instantiation_1.IInstantiationService)
    ], QuickAccessController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tBY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3F1aWNraW5wdXQvYnJvd3Nlci9xdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXekYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxzQkFBVTtRQWFwRCxZQUNxQixpQkFBc0QsRUFDbkQsb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBSDZCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQWJuRSxhQUFRLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXVCLHdCQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDckUsNEJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQXdELENBQUM7WUFFMUYsNkJBQXdCLEdBQUcsSUFBSSxHQUFHLEVBQTBDLENBQUM7WUFFdEYsdUJBQWtCLEdBSVYsU0FBUyxDQUFDO1FBTzFCLENBQUM7UUFFRCxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsRUFBRSxPQUE2QjtZQUM3QyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLEVBQUUsT0FBNkI7WUFDN0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFJTyxZQUFZLENBQUMsS0FBYSxFQUFFLElBQWEsRUFBRSxPQUE2QjtZQUUvRSxzQ0FBc0M7WUFDdEMsTUFBTSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMs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