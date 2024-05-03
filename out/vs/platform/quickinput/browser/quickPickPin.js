/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/base/common/themables"], function (require, exports, codicons_1, nls_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showWithPinnedItems = showWithPinnedItems;
    const pinButtonClass = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.pin);
    const pinnedButtonClass = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.pinned);
    const buttonClasses = [pinButtonClass, pinnedButtonClass];
    /**
     * Initially, adds pin buttons to all @param quickPick items.
     * When pinned, a copy of the item will be moved to the end of the pinned list and any duplicate within the pinned list will
     * be removed if @param filterDupliates has been provided. Pin and pinned button events trigger updates to the underlying storage.
     * Shows the quickpick once formatted.
     */
    async function showWithPinnedItems(storageService, storageKey, quickPick, filterDuplicates) {
        const itemsWithoutPinned = quickPick.items;
        let itemsWithPinned = _formatPinnedItems(storageKey, quickPick, storageService, undefined, filterDuplicates);
        quickPick.onDidTriggerItemButton(async (buttonEvent) => {
            const expectedButton = buttonEvent.button.iconClass && buttonClasses.includes(buttonEvent.button.iconClass);
            if (expectedButton) {
                quickPick.items = itemsWithoutPinned;
                itemsWithPinned = _formatPinnedItems(storageKey, quickPick, storageService, buttonEvent.item, filterDuplicates);
                quickPick.items = quickPick.value ? itemsWithoutPinned : itemsWithPinned;
            }
        });
        quickPick.onDidChangeValue(async (value) => {
            if (quickPick.items === itemsWithPinned && value) {
                quickPick.items = itemsWithoutPinned;
            }
            else if (quickPick.items === itemsWithoutPinned && !value) {
                quickPick.items = itemsWithPinned;
            }
        });
        quickPick.items = quickPick.value ? itemsWithoutPinned : itemsWithPinned;
        quickPick.show();
    }
    function _formatPinnedItems(storageKey, quickPick, storageService, changedItem, filterDuplicates) {
        const formattedItems = [];
        let pinnedItems;
        if (changedItem) {
            pinnedItems = updatePinnedItems(storageKey, changedItem, storageService);
        }
        else {
            pinnedItems = getPinnedItems(storageKey, storageService);
        }
        if (pinnedItems.length) {
            formattedItems.push({ type: 'separator', label: (0, nls_1.localize)("terminal.commands.pinned", 'pinned') });
        }
        const pinnedIds = new Set();
        for (const itemToFind of pinnedItems) {
            const itemToPin = quickPick.items.find(item => itemsMatch(item, itemToFind));
            if (itemToPin) {
                const pinnedItemId = getItemIdentifier(itemToPin);
                const pinnedItem = Object.assign({}, itemToPin);
                if (!filterDuplicates || !pinnedIds.has(pinnedItemId)) {
                    pinnedIds.add(pinnedItemId);
                    updateButtons(pinnedItem, false);
                    formattedItems.push(pinnedItem);
                }
            }
        }
        for (const item of quickPick.items) {
            updateButtons(item, true);
            formattedItems.push(item);
        }
        return formattedItems;
    }
    function getItemIdentifier(item) {
        return item.type === 'separator' ? '' : item.id || `${item.label}${item.description}${item.detail}}`;
    }
    function updateButtons(item, removePin) {
        if (item.type === 'separator') {
            return;
        }
        // remove button classes before adding the new one
        const newButtons = item.buttons?.filter(button => button.iconClass && !buttonClasses.includes(button.iconClass)) ?? [];
        newButtons.unshift({
            iconClass: removePin ? pinButtonClass : pinnedButtonClass,
            tooltip: removePin ? (0, nls_1.localize)('pinCommand', "Pin command") : (0, nls_1.localize)('pinnedCommand', "Pinned command"),
            alwaysVisible: false
        });
        item.buttons = newButtons;
    }
    function itemsMatch(itemA, itemB) {
        return getItemIdentifier(itemA) === getItemIdentifier(itemB);
    }
    function updatePinnedItems(storageKey, changedItem, storageService) {
        const removePin = changedItem.buttons?.find(b => b.iconClass === pinnedButtonClass);
        let items = getPinnedItems(storageKey, storageService);
        if (removePin) {
            items = items.filter(item => getItemIdentifier(item) !== getItemIdentifier(changedItem));
        }
        else {
            items.push(changedItem);
        }
        storageService.store(storageKey, JSON.stringify(items), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        return items;
    }
    function getPinnedItems(storageKey, storageService) {
        const items = storageService.get(storageKey, 1 /* StorageScope.WORKSPACE */);
        return items ? JSON.parse(items) : [];
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tQaWNrUGluLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9xdWlja2lucHV0L2Jyb3dzZXIvcXVpY2tQaWNrUGluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaUJoRyxrREFxQkM7SUE5QkQsTUFBTSxjQUFjLEdBQUcscUJBQVMsQ0FBQyxXQUFXLENBQUMsa0JBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMxRCxNQUFNLGlCQUFpQixHQUFHLHFCQUFTLENBQUMsV0FBVyxDQUFDLGtCQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDaEUsTUFBTSxhQUFhLEdBQUcsQ0FBQyxjQUFjLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUMxRDs7Ozs7T0FLRztJQUNJLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxjQUErQixFQUFFLFVBQWtCLEVBQUUsU0FBcUMsRUFBRSxnQkFBMEI7UUFDL0osTUFBTSxrQkFBa0IsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDO1FBQzNDLElBQUksZUFBZSxHQUFHLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzdHLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUMsV0FBVyxFQUFDLEVBQUU7WUFDcEQsTUFBTSxjQUFjLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzVHLElBQUksY0FBYyxFQUFFLENBQUM7Z0JBQ3BCLFNBQVMsQ0FBQyxLQUFLLEdBQUcsa0JBQWtCLENBQUM7Z0JBQ3JDLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxF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