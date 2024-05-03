/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/button/button", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/toggle/toggle", "vs/base/common/event", "vs/base/common/async", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/browser/ui/progressbar/progressbar", "vs/platform/quickinput/browser/quickInputController", "vs/platform/theme/test/common/testThemeService", "vs/base/test/common/utils", "vs/base/common/lifecycle", "vs/base/browser/window", "vs/platform/quickinput/common/quickInput", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/layout/browser/layoutService", "vs/platform/contextview/browser/contextView", "vs/platform/list/browser/listService", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextViewService"], function (require, exports, assert, inputBox_1, button_1, listWidget_1, toggle_1, event_1, async_1, countBadge_1, keybindingLabel_1, progressbar_1, quickInputController_1, testThemeService_1, utils_1, lifecycle_1, window_1, quickInput_1, instantiationServiceMock_1, themeService_1, configuration_1, testConfigurationService_1, layoutService_1, contextView_1, listService_1, contextkey_1, contextKeyService_1, keybindingResolver_1, keybinding_1, contextViewService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Sets up an `onShow` listener to allow us to wait until the quick pick is shown (useful when triggering an `accept()` right after launching a quick pick)
    // kick this off before you launch the picker and then await the promise returned after you launch the picker.
    async function setupWaitTilShownListener(controller) {
        const result = await (0, async_1.raceTimeout)(new Promise(resolve => {
            const event = controller.onShow(_ => {
                event.dispose();
                resolve(true);
            });
        }), 2000);
        if (!result) {
            throw new Error('Cancelled');
        }
    }
    suite('QuickInput', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let controller;
        setup(() => {
            const fixture = document.createElement('div');
            window_1.mainWindow.document.body.appendChild(fixture);
            store.add((0, lifecycle_1.toDisposable)(() => window_1.mainWindow.document.body.removeChild(fixture)));
            const instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            // Stub the services the quick input controller needs to function
            instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(listService_1.IListService, store.add(new listService_1.ListService()));
            instantiationService.stub(layoutService_1.ILayoutService, { activeContainer: fixture, onDidLayoutContainer: event_1.Event.None });
            instantiationService.stub(contextView_1.IContextViewService, store.add(instantiationService.createInstance(contextViewService_1.ContextViewService)));
            instantiationService.stub(contextkey_1.IContextKeyService, store.add(instantiationService.createInstance(contextKeyService_1.ContextKeyService)));
            instantiationService.stub(keybinding_1.IKeybindingService, {
                mightProducePrintableCharacter() { return false; },
                softDispatch() { return keybindingResolver_1.NoMatchingKb; },
            });
            controller = store.add(instantiationService.createInstance(quickInputController_1.QuickInputController, {
                container: fixture,
                idPrefix: 'testQuickInput',
                ignoreFocusOut() { return true; },
                returnFocus() { },
                backKeybindingLabel() { return undefined; },
                setContextKey() { return undefined; },
                linkOpenerDelegate(content) { },
                hoverDelegate: {
                    showHover(options, focus) {
                        return undefined;
                    },
                    delay: 200
                },
                styles: {
                    button: button_1.unthemedButtonStyles,
                    countBadge: countBadge_1.unthemedCountStyles,
                    inputBox: inputBox_1.unthemedInboxStyles,
                    toggle: toggle_1.unthemedToggleStyles,
                    keybindingLabel: keybindingLabel_1.unthemedKeybindingLabelOptions,
                    list: listWidget_1.unthemedListStyles,
                    progressBar: progressbar_1.unthemedProgressBarOptions,
                    widget: {
                        quickInputBackground: undefined,
                        quickInputForeground: undefined,
                        quickInputTitleBackground: undefined,
                        widgetBorder: undefined,
                        widgetShadow: undefined,
                    },
                    pickerGroup: {
                        pickerGroupBorder: undefined,
                        pickerGroupForeground: undefined,
                    }
                }
            }));
            // initial layout
            controller.layout({ height: 20, width: 40 }, 0);
        });
        test('pick - basecase', async () => {
            const item = { label: 'foo' };
            const wait = setupWaitTilShownListener(controller);
            const pickPromise = controller.pick([item, { label: 'bar' }]);
            await wait;
            controller.accept();
            const pick = await (0, async_1.raceTimeout)(pickPromise, 2000);
            assert.strictEqual(pick, item);
        });
        test('pick - activeItem is honored', async () => {
            const item = { label: 'foo' };
            const wait = setupWaitTilShownListener(controller);
            const pickPromise = controller.pick([{ label: 'bar' }, item], { activeItem: item });
            await wait;
            controller.accept();
            const pick = await pickPromise;
            assert.strictEqual(pick, item);
        });
        test('input - basecase', async () => {
            const wait = setupWaitTilShownListener(controller);
            const inputPromise = controller.input({ value: 'foo' });
            await wait;
            controller.accept();
            const value = await (0, async_1.raceTimeout)(inputPromise, 2000);
            assert.strictEqual(value, 'foo');
        });
        test('onDidChangeValue - gets triggered when .value is set', async () => {
            const quickpick = store.add(controller.createQuickPick());
            let value = undefined;
            store.add(quickpick.onDidChangeValue((e) => value = e));
            // Trigger a change
            quickpick.value = 'changed';
            try {
                assert.strictEqual(value, quickpick.value);
            }
            finally {
                quickpick.dispose();
            }
        });
        test('keepScrollPosition - works with activeItems', async () => {
            const quickpick = store.add(controller.createQuickPick());
            const items = [];
            for (let i = 0; i < 1000; i++) {
                items.push({ label: `item ${i}` });
            }
            quickpick.items = items;
            // setting the active item should cause the quick pick to scroll to the bottom
            quickpick.activeItems = [items[items.length - 1]];
            quickpick.show();
            const cursorTop = quickpick.scrollTop;
            assert.notStrictEqual(cursorTop, 0);
            quickpick.keepScrollPosition = true;
            quickpick.activeItems = [items[0]];
            assert.strictEqual(cursorTop, quickpick.scrollTop);
            quickpick.keepScrollPosition = false;
            quickpick.activeItems = [items[0]];
            assert.strictEqual(quickpick.scrollTop, 0);
        });
        test('keepScrollPosition - works with items', async () => {
            const quickpick = store.add(controller.createQuickPick());
            const items = [];
            for (let i = 0; i < 1000; i++) {
                items.push({ label: `item ${i}` });
            }
            quickpick.items = items;
            // setting the active item should cause the quick pick to scroll to the bottom
            quickpick.activeItems = [items[items.length - 1]];
            quickpick.show();
            const cursorTop = quickpick.scrollTop;
            assert.notStrictEqual(cursorTop, 0);
            quickpick.keepScrollPosition = true;
            quickpick.items = items;
            assert.strictEqual(cursorTop, quickpick.scrollTop);
            quickpick.keepScrollPosition = false;
            quickpick.items = items;
            assert.strictEqual(quickpick.scrollTop, 0);
        });
        test('selectedItems - verify previous selectedItems does not hang over to next set of items', async () => {
            const quickpick = store.add(controller.createQuickPick());
            quickpick.items = [{ label: 'step 1' }];
            quickpick.show();
            void (await new Promise(resolve => {
                store.add(quickpick.onDidAccept(() => {
                    quickpick.canSelectMany = true;
                    quickpick.items = [{ label: 'a' }, { label: 'b' }, { label: 'c' }];
                    resolve();
                }));
                // accept 'step 1'
                controller.accept();
            }));
            // accept in multi-select
            controller.accept();
            // Since we don't select any items, the selected items should be empty
            assert.strictEqual(quickpick.selectedItems.length, 0);
        });
        test('activeItems - verify onDidChangeActive is triggered after setting items', async () => {
            const quickpick = store.add(controller.createQuickPick());
            // Setup listener for verification
            const activeItemsFromEvent = [];
            store.add(quickpick.onDidChangeActive(items => activeItemsFromEvent.push(...items)));
            quickpick.show();
            const item = { label: 'step 1' };
            quickpick.items = [item];
            assert.strictEqual(activeItemsFromEvent.length, 1);
            assert.strictEqual(activeItemsFromEvent[0], item);
            assert.strictEqual(quickpick.activeItems.length, 1);
            assert.strictEqual(quickpick.activeItems[0], item);
        });
        test('activeItems - verify setting itemActivation to None still triggers onDidChangeActive after selection #207832', async () => {
            const quickpick = store.add(controller.createQuickPick());
            const item = { label: 'step 1' };
            quickpick.items = [item];
            quickpick.show();
            assert.strictEqual(quickpick.activeItems[0], item);
            // Setup listener for verification
            const activeItemsFromEvent = [];
            store.add(quickpick.onDidChangeActive(items => activeItemsFromEvent.push(...items)));
            // Trigger a change
            quickpick.itemActivation = quickInput_1.ItemActivation.NONE;
            quickpick.items = [item];
            assert.strictEqual(activeItemsFromEvent.length, 0);
            assert.strictEqual(quickpick.activeItems.length, 0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tpbnB1dC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9xdWlja2lucHV0L3Rlc3QvYnJvd3Nlci9xdWlja2lucHV0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQ2hHLDJKQUEySjtJQUMzSiw4R0FBOEc7SUFDOUcsS0FBSyxVQUFVLHlCQUF5QixDQUFDLFVBQWdDO1FBQ3hFLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxtQkFBVyxFQUFDLElBQUksT0FBTyxDQUFVLE9BQU8sQ0FBQyxFQUFFO1lBQy9ELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25DLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVWLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUIsQ0FBQztJQUNGLENBQUM7SUFFRCxLQUFLLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtRQUN4QixNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFDeEQsSUFBSSxVQUFnQyxDQUFDO1FBRXJDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlDLG1CQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZ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