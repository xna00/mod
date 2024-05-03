/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/types"], function (require, exports, async_1, cancellation_1, lifecycle_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PickerQuickAccessProvider = exports.TriggerAction = void 0;
    var TriggerAction;
    (function (TriggerAction) {
        /**
         * Do nothing after the button was clicked.
         */
        TriggerAction[TriggerAction["NO_ACTION"] = 0] = "NO_ACTION";
        /**
         * Close the picker.
         */
        TriggerAction[TriggerAction["CLOSE_PICKER"] = 1] = "CLOSE_PICKER";
        /**
         * Update the results of the picker.
         */
        TriggerAction[TriggerAction["REFRESH_PICKER"] = 2] = "REFRESH_PICKER";
        /**
         * Remove the item from the picker.
         */
        TriggerAction[TriggerAction["REMOVE_ITEM"] = 3] = "REMOVE_ITEM";
    })(TriggerAction || (exports.TriggerAction = TriggerAction = {}));
    function isPicksWithActive(obj) {
        const candidate = obj;
        return Array.isArray(candidate.items);
    }
    function isFastAndSlowPicks(obj) {
        const candidate = obj;
        return !!candidate.picks && candidate.additionalPicks instanceof Promise;
    }
    class PickerQuickAccessProvider extends lifecycle_1.Disposable {
        constructor(prefix, options) {
            super();
            this.prefix = prefix;
            this.options = options;
        }
        provide(picker, token, runOptions) {
            const disposables = new lifecycle_1.DisposableStore();
            // Apply options if any
            picker.canAcceptInBackground = !!this.options?.canAcceptInBackground;
            // Disable filtering & sorting, we control the results
            picker.matchOnLabel = picker.matchOnDescription = picker.matchOnDetail = picker.sortByLabel = false;
            // Set initial picks and update on type
            let picksCts = undefined;
            const picksDisposable = disposables.add(new lifecycle_1.MutableDisposable());
            const updatePickerItems = async () => {
                const picksDisposables = picksDisposable.value = new lifecycle_1.DisposableStore();
                // Cancel any previous ask for picks and busy
                picksCts?.dispose(true);
                picker.busy = false;
                // Create new cancellation source for this run
                picksCts = new cancellation_1.CancellationTokenSource(token);
                // Collect picks and support both long running and short or combined
                const picksToken = picksCts.token;
                let picksFilter = picker.value.substring(this.prefix.length);
                if (!this.options?.shouldSkipTrimPickFilter) {
                    picksFilter = picksFilter.trim();
                }
                const providedPicks = this._getPicks(picksFilter, picksDisposables, picksToken, runOptions);
                const applyPicks = (picks, skipEmpty) => {
                    let items;
                    let activeItem = undefined;
                    if (isPicksWithActive(picks)) {
                        items = picks.items;
                        activeItem = picks.active;
                    }
                    else {
                        items = picks;
                    }
                    if (items.length === 0) {
                        if (skipEmpty) {
                            return false;
                        }
                        // We show the no results pick if we have no input to prevent completely empty pickers #172613
                        if ((picksFilter.length > 0 || picker.hideInput) && this.options?.noResultsPick) {
                            if ((0, types_1.isFunction)(this.options.noResultsPick)) {
                                items = [this.options.noResultsPick(picksFilter)];
                            }
                            else {
                                items = [this.options.noResultsPick];
                            }
                        }
                    }
                    picker.items = items;
                    if (activeItem) {
                        picker.activeItems = [activeItem];
                    }
                    return true;
                };
                const applyFastAndSlowPicks = async (fastAndSlowPicks) => {
                    let fastPicksApplied = false;
                    let slowPicksApplied = false;
                    await Promise.all([
                        // Fast Picks: if `mergeDelay` is configured, in order to reduce
                        // amount of flicker, we race against the slow picks over some delay
                        // and then set the fast picks.
                        // If the slow picks are faster, we reduce the flicker by only
                        // setting the items once.
                        (async () => {
                            if (typeof fastAndSlowPicks.mergeDelay === 'number') {
                                await (0, async_1.timeout)(fastAndSlowPicks.mergeDelay);
                                if (picksToken.isCancellationRequested) {
                                    return;
                                }
                            }
                            if (!slowPicksApplied) {
                                fastPicksApplied = applyPicks(fastAndSlowPicks.picks, true /* skip over empty to reduce flicker */);
                            }
                        })(),
                        // Slow Picks: we await the slow picks and then set them at
                        // once together with the fast picks, but only if we actually
                        // have additional results.
                        (async () => {
                            picker.busy = true;
                            try {
                                const awaitedAdditionalPicks = await fastAndSlowPicks.additionalPicks;
                                if (picksToken.isCancellationRequested) {
                                    return;
                                }
                                let picks;
                                let activePick = undefined;
                                if (isPicksWithActive(fastAndSlowPicks.picks)) {
                                    picks = fastAndSlowPicks.picks.items;
                                    activePick = fastAndSlowPicks.picks.active;
                                }
                                else {
                                    picks = fastAndSlowPicks.picks;
                                }
                                let additionalPicks;
                                let additionalActivePick = undefined;
                                if (isPicksWithActive(awaitedAdditionalPicks)) {
                                    additionalPicks = awaitedAdditionalPicks.items;
                                    additionalActivePick = awaitedAdditionalPicks.active;
                                }
                                else {
                                    additionalPicks = awaitedAdditionalPicks;
                                }
                                if (additionalPicks.length > 0 || !fastPicksApplied) {
                                    // If we do not have any activePick or additionalActivePick
                                    // we try to preserve the currently active pick from the
                                    // fast results. This fixes an issue where the user might
                                    // have made a pick active before the additional results
                                    // kick in.
                                    // See https://github.com/microsoft/vscode/issues/102480
                                    let fallbackActivePick = undefined;
                                    if (!activePick && !additionalActivePick) {
                                        const fallbackActivePickCandidate = picker.activeItems[0];
                                        if (fallbackActivePickCandidate && picks.indexOf(fallbackActivePickCandidate) !== -1) {
                                            fallbackActivePick = fallbackActivePickCandidate;
                                        }
                                    }
                                    applyPicks({
                                        items: [...picks, ...additionalPicks],
                                        active: activePick || additionalActivePick || fallbackActivePick
                                    });
                                }
                            }
                            finally {
                                if (!picksToken.isCancellationRequested) {
                                    picker.busy = false;
                                }
                                slowPicksApplied = true;
                            }
                        })()
                    ]);
                };
                // No Picks
                if (providedPicks === null) {
                    // Ignore
                }
                // Fast and Slow Picks
                else if (isFastAndSlowPicks(providedPicks)) {
                    await applyFastAndSlowPicks(providedPicks);
                }
                // Fast Picks
                else if (!(providedPicks instanceof Promise)) {
                    applyPicks(providedPicks);
                }
                // Slow Picks
                else {
                    picker.busy = true;
                    try {
                        const awaitedPicks = await providedPicks;
                        if (picksToken.isCancellationRequested) {
                            return;
                        }
                        if (isFastAndSlowPicks(awaitedPicks)) {
                            await applyFastAndSlowPicks(awaitedPicks);
                        }
                        else {
                            applyPicks(awaitedPicks);
                        }
                    }
                    finally {
                        if (!picksToken.isCancellationRequested) {
                            picker.busy = false;
                        }
                    }
                }
            };
            disposables.add(picker.onDidChangeValue(() => updatePickerItems()));
            updatePickerItems();
            // Accept the pick on accept and hide picker
            disposables.add(picker.onDidAccept(event => {
                const [item] = picker.selectedItems;
                if (typeof item?.accept === 'function') {
                    if (!event.inBackground) {
                        picker.hide(); // hide picker unless we accept in background
                    }
                    item.accept(picker.keyMods, event);
                }
            }));
            const buttonTrigger = async (button, item) => {
                if (typeof item.trigger !== 'function') {
                    return;
                }
                const buttonIndex = item.buttons?.indexOf(button) ?? -1;
                if (buttonIndex >= 0) {
                    const result = item.trigger(buttonIndex, picker.keyMods);
                    const action = (typeof result === 'number') ? result : await result;
                    if (token.isCancellationRequested) {
                        return;
                    }
                    switch (action) {
                        case TriggerAction.NO_ACTION:
                            break;
                        case TriggerAction.CLOSE_PICKER:
                            picker.hide();
                            break;
                        case TriggerAction.REFRESH_PICKER:
                            updatePickerItems();
                            break;
                        case TriggerAction.REMOVE_ITEM: {
                            const index = picker.items.indexOf(item);
                            if (index !== -1) {
                                const items = picker.items.slice();
                                const removed = items.splice(index, 1);
                                const activeItems = picker.activeItems.filter(activeItem => activeItem !== removed[0]);
                                const keepScrollPositionBefore = picker.keepScrollPosition;
                                picker.keepScrollPosition = true;
                                picker.items = items;
                                if (activeItems) {
                                    picker.activeItems = activeItems;
                                }
                                picker.keepScrollPosition = keepScrollPositionBefore;
                            }
                            break;
                        }
                    }
                }
            };
            // Trigger the pick with button index if button triggered
            disposables.add(picker.onDidTriggerItemButton(({ button, item }) => buttonTrigger(button, item)));
            disposables.add(picker.onDidTriggerSeparatorButton(({ button, separator }) => buttonTrigger(button, separator)));
            return disposables;
        }
    }
    exports.PickerQuickAccessProvider = PickerQuickAccessProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlja2VyUXVpY2tBY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3F1aWNraW5wdXQvYnJvd3Nlci9waWNrZXJRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsSUFBWSxhQXFCWDtJQXJCRCxXQUFZLGFBQWE7UUFFeEI7O1dBRUc7UUFDSCwyREFBUyxDQUFBO1FBRVQ7O1dBRUc7UUFDSCxpRUFBWSxDQUFBO1FBRVo7O1dBRUc7UUFDSCxxRUFBYyxDQUFBO1FBRWQ7O1dBRUc7UUFDSCwrREFBVyxDQUFBO0lBQ1osQ0FBQyxFQXJCVyxhQUFhLDZCQUFiLGFBQWEsUUFxQnhCO0lBb0ZELFNBQVMsaUJBQWlCLENBQUksR0FBWTtRQUN6QyxNQUFNLFNBQVMsR0FBRyxHQUF5QixDQUFDO1FBRTVDLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELFNBQVMsa0JBQWtCLENBQUksR0FBWTtRQUMxQyxNQUFNLFNBQVMsR0FBRyxHQUEwQixDQUFDO1FBRTdDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLElBQUksU0FBUyxDQUFDLGVBQWUsWUFBWSxPQUFPLENBQUM7SUFDMUUsQ0FBQztJQUVELE1BQXNCLHlCQUE0RCxTQUFRLHNCQUFVO1FBRW5HLFlBQW9CLE1BQWMsRUFBWSxPQUE4QztZQUMzRixLQUFLLEVBQUUsQ0FBQztZQURXLFdBQU0sR0FBTixNQUFNLENBQVE7WUFBWSxZQUFPLEdBQVAsT0FBTyxDQUF1QztRQUU1RixDQUFDO1FBRUQsT0FBTyxDQUFDLE1BQXFCLEVBQUUsS0FBd0IsRUFBRSxVQUEyQztZQUNuRyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUUx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