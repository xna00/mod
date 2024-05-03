/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/browser/parts/statusbar/statusbarModel", "vs/workbench/test/common/workbenchTestServices", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert, statusbarModel_1, workbenchTestServices_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench status bar model', () => {
        const disposables = new lifecycle_1.DisposableStore();
        teardown(() => {
            disposables.clear();
        });
        test('basics', () => {
            const container = document.createElement('div');
            const model = disposables.add(new statusbarModel_1.StatusbarViewModel(disposables.add(new workbenchTestServices_1.TestStorageService())));
            assert.strictEqual(model.entries.length, 0);
            const entry1 = { id: '3', alignment: 0 /* StatusbarAlignment.LEFT */, name: '3', priority: { primary: 3, secondary: 1 }, container, labelContainer: container, hasCommand: false };
            model.add(entry1);
            const entry2 = { id: '2', alignment: 0 /* StatusbarAlignment.LEFT */, name: '2', priority: { primary: 2, secondary: 1 }, container, labelContainer: container, hasCommand: false };
            model.add(entry2);
            const entry3 = { id: '1', alignment: 0 /* StatusbarAlignment.LEFT */, name: '1', priority: { primary: 1, secondary: 1 }, container, labelContainer: container, hasCommand: false };
            model.add(entry3);
            const entry4 = { id: '1-right', alignment: 1 /* StatusbarAlignment.RIGHT */, name: '1-right', priority: { primary: 1, secondary: 1 }, container, labelContainer: container, hasCommand: false };
            model.add(entry4);
            assert.strictEqual(model.entries.length, 4);
            const leftEntries = model.getEntries(0 /* StatusbarAlignment.LEFT */);
            assert.strictEqual(leftEntries.length, 3);
            assert.strictEqual(model.getEntries(1 /* StatusbarAlignment.RIGHT */).length, 1);
            assert.strictEqual(leftEntries[0].id, '3');
            assert.strictEqual(leftEntries[1].id, '2');
            assert.strictEqual(leftEntries[2].id, '1');
            const entries = model.entries;
            assert.strictEqual(entries[0].id, '3');
            assert.strictEqual(entries[1].id, '2');
            assert.strictEqual(entries[2].id, '1');
            assert.strictEqual(entries[3].id, '1-right');
            assert.ok(model.findEntry(container));
            let didChangeEntryVisibility = { id: '', visible: false };
            disposables.add(model.onDidChangeEntryVisibility(e => {
                didChangeEntryVisibility = e;
            }));
            assert.strictEqual(model.isHidden('1'), false);
            model.hide('1');
            assert.strictEqual(didChangeEntryVisibility.id, '1');
            assert.strictEqual(didChangeEntryVisibility.visible, false);
            assert.strictEqual(model.isHidden('1'), true);
            didChangeEntryVisibility = { id: '', visible: false };
            model.show('1');
            assert.strictEqual(didChangeEntryVisibility.id, '1');
            assert.strictEqual(didChangeEntryVisibility.visible, true);
            assert.strictEqual(model.isHidden('1'), false);
            model.remove(entry1);
            model.remove(entry4);
            assert.strictEqual(model.entries.length, 2);
            model.remove(entry2);
            model.remove(entry3);
            assert.strictEqual(model.entries.length, 0);
        });
        test('secondary priority used when primary is same', () => {
            const container = document.createElement('div');
            const model = disposables.add(new statusbarModel_1.StatusbarViewModel(disposables.add(new workbenchTestServices_1.TestStorageService())));
            assert.strictEqual(model.entries.length, 0);
            model.add({ id: '1', alignment: 0 /* StatusbarAlignment.LEFT */, name: '1', priority: { primary: 1, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            model.add({ id: '2', alignment: 0 /* StatusbarAlignment.LEFT */, name: '2', priority: { primary: 1, secondary: 2 }, container, labelContainer: container, hasCommand: false });
            model.add({ id: '3', alignment: 0 /* StatusbarAlignment.LEFT */, name: '3', priority: { primary: 1, secondary: 3 }, container, labelContainer: container, hasCommand: false });
            const entries = model.entries;
            assert.strictEqual(entries[0].id, '3');
            assert.strictEqual(entries[1].id, '2');
            assert.strictEqual(entries[2].id, '1');
        });
        test('insertion order preserved when priorites are the same', () => {
            const container = document.createElement('div');
            const model = disposables.add(new statusbarModel_1.StatusbarViewModel(disposables.add(new workbenchTestServices_1.TestStorageService())));
            assert.strictEqual(model.entries.length, 0);
            model.add({ id: '1', alignment: 0 /* StatusbarAlignment.LEFT */, name: '1', priority: { primary: 1, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            model.add({ id: '2', alignment: 0 /* StatusbarAlignment.LEFT */, name: '2', priority: { primary: 1, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            model.add({ id: '3', alignment: 0 /* StatusbarAlignment.LEFT */, name: '3', priority: { primary: 1, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            const entries = model.entries;
            assert.strictEqual(entries[0].id, '1');
            assert.strictEqual(entries[1].id, '2');
            assert.strictEqual(entries[2].id, '3');
        });
        test('entry with reference to other entry (existing)', () => {
            const container = document.createElement('div');
            const model = disposables.add(new statusbarModel_1.StatusbarViewModel(disposables.add(new workbenchTestServices_1.TestStorageService())));
            // Existing reference, Alignment: left
            model.add({ id: 'a', alignment: 0 /* StatusbarAlignment.LEFT */, name: '1', priority: { primary: 2, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            model.add({ id: 'b', alignment: 0 /* StatusbarAlignment.LEFT */, name: '2', priority: { primary: 1, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            let entry = { id: 'c', alignment: 0 /* StatusbarAlignment.LEFT */, name: '3', priority: { primary: { id: 'a', alignment: 0 /* StatusbarAlignment.LEFT */ }, secondary: 1 }, container, labelContainer: container, hasCommand: false };
            model.add(entry);
            let entries = model.entries;
            assert.strictEqual(entries.length, 3);
            assert.strictEqual(entries[0].id, 'c');
            assert.strictEqual(entries[1].id, 'a');
            assert.strictEqual(entries[2].id, 'b');
            model.remove(entry);
            // Existing reference, Alignment: right
            entry = { id: 'c', alignment: 1 /* StatusbarAlignment.RIGHT */, name: '3', priority: { primary: { id: 'a', alignment: 1 /* StatusbarAlignment.RIGHT */ }, secondary: 1 }, container, labelContainer: container, hasCommand: false };
            model.add(entry);
            entries = model.entries;
            assert.strictEqual(entries.length, 3);
            assert.strictEqual(entries[0].id, 'a');
            assert.strictEqual(entries[1].id, 'c');
            assert.strictEqual(entries[2].id, 'b');
        });
        test('entry with reference to other entry (nonexistent)', () => {
            const container = document.createElement('div');
            const model = disposables.add(new statusbarModel_1.StatusbarViewModel(disposables.add(new workbenchTestServices_1.TestStorageService())));
            // Nonexistent reference, Alignment: left
            model.add({ id: 'a', alignment: 0 /* StatusbarAlignment.LEFT */, name: '1', priority: { primary: 2, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            model.add({ id: 'b', alignment: 0 /* StatusbarAlignment.LEFT */, name: '2', priority: { primary: 1, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            let entry = { id: 'c', alignment: 0 /* StatusbarAlignment.LEFT */, name: '3', priority: { primary: { id: 'not-existing', alignment: 0 /* StatusbarAlignment.LEFT */ }, secondary: 1 }, container, labelContainer: container, hasCommand: false };
            model.add(entry);
            let entries = model.entries;
            assert.strictEqual(entries.length, 3);
            assert.strictEqual(entries[0].id, 'a');
            assert.strictEqual(entries[1].id, 'b');
            assert.strictEqual(entries[2].id, 'c');
            model.remove(entry);
            // Nonexistent reference, Alignment: right
            entry = { id: 'c', alignment: 1 /* StatusbarAlignment.RIGHT */, name: '3', priority: { primary: { id: 'not-existing', alignment: 1 /* StatusbarAlignment.RIGHT */ }, secondary: 1 }, container, labelContainer: container, hasCommand: false };
            model.add(entry);
            entries = model.entries;
            assert.strictEqual(entries.length, 3);
            assert.strictEqual(entries[0].id, 'a');
            assert.strictEqual(entries[1].id, 'b');
            assert.strictEqual(entries[2].id, 'c');
        });
        test('entry with reference to other entry resorts based on other entry being there or not', () => {
            const container = document.createElement('div');
            const model = disposables.add(new statusbarModel_1.StatusbarViewModel(disposables.add(new workbenchTestServices_1.TestStorageService())));
            model.add({ id: 'a', alignment: 0 /* StatusbarAlignment.LEFT */, name: '1', priority: { primary: 2, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            model.add({ id: 'b', alignment: 0 /* StatusbarAlignment.LEFT */, name: '2', priority: { primary: 1, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            model.add({ id: 'c', alignment: 0 /* StatusbarAlignment.LEFT */, name: '3', priority: { primary: { id: 'not-existing', alignment: 0 /* StatusbarAlignment.LEFT */ }, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            let entries = model.entries;
            assert.strictEqual(entries.length, 3);
            assert.strictEqual(entries[0].id, 'a');
            assert.strictEqual(entries[1].id, 'b');
            assert.strictEqual(entries[2].id, 'c');
            const entry = { id: 'not-existing', alignment: 0 /* StatusbarAlignment.LEFT */, name: 'not-existing', priority: { primary: 3, secondary: 1 }, container, labelContainer: container, hasCommand: false };
            model.add(entry);
            entries = model.entries;
            assert.strictEqual(entries.length, 4);
            assert.strictEqual(entries[0].id, 'c');
            assert.strictEqual(entries[1].id, 'not-existing');
            assert.strictEqual(entries[2].id, 'a');
            assert.strictEqual(entries[3].id, 'b');
            model.remove(entry);
            entries = model.entries;
            assert.strictEqual(entries.length, 3);
            assert.strictEqual(entries[0].id, 'a');
            assert.strictEqual(entries[1].id, 'b');
            assert.strictEqual(entries[2].id, 'c');
        });
        test('entry with reference to other entry but different alignment does not explode', () => {
            const container = document.createElement('div');
            const model = disposables.add(new statusbarModel_1.StatusbarViewModel(disposables.add(new workbenchTestServices_1.TestStorageService())));
            model.add({ id: '1-left', alignment: 0 /* StatusbarAlignment.LEFT */, name: '1-left', priority: { primary: 2, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            model.add({ id: '2-left', alignment: 0 /* StatusbarAlignment.LEFT */, name: '2-left', priority: { primary: 1, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            model.add({ id: '1-right', alignment: 1 /* StatusbarAlignment.RIGHT */, name: '1-right', priority: { primary: 2, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            model.add({ id: '2-right', alignment: 1 /* StatusbarAlignment.RIGHT */, name: '2-right', priority: { primary: 1, secondary: 1 }, container, labelContainer: container, hasCommand: false });
            assert.strictEqual(model.getEntries(0 /* StatusbarAlignment.LEFT */).length, 2);
            assert.strictEqual(model.getEntries(1 /* StatusbarAlignment.RIGHT */).length, 2);
            const relativeEntryLeft = { id: 'relative', alignment: 0 /* StatusbarAlignment.LEFT */, name: 'relative', priority: { primary: { id: '1-right', alignment: 0 /* StatusbarAlignment.LEFT */ }, secondary: 1 }, container, labelContainer: container, hasCommand: false };
            model.add(relativeEntryLeft);
            assert.strictEqual(model.getEntries(0 /* StatusbarAlignment.LEFT */).length, 3);
            assert.strictEqual(model.getEntries(0 /* StatusbarAlignment.LEFT */)[2], relativeEntryLeft);
            assert.strictEqual(model.getEntries(1 /* StatusbarAlignment.RIGHT */).length, 2);
            model.remove(relativeEntryLeft);
            const relativeEntryRight = { id: 'relative', alignment: 1 /* StatusbarAlignment.RIGHT */, name: 'relative', priority: { primary: { id: '1-right', alignment: 0 /* StatusbarAlignment.LEFT */ }, secondary: 1 }, container, labelContainer: container, hasCommand: false };
            model.add(relativeEntryRight);
            assert.strictEqual(model.getEntries(0 /* StatusbarAlignment.LEFT */).length, 2);
            assert.strictEqual(model.getEntries(1 /* StatusbarAlignment.RIGHT */).length, 3);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzYmFyTW9kZWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvYnJvd3Nlci9wYXJ0cy9zdGF0dXNiYXIvc3RhdHVzYmFyTW9kZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1FBRXhDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtZQUNuQixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxtQ0FBa0IsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksMENBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVqRyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTVDLE1BQU0sTUFBTSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxTQUFTLGlDQUF5QixFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQzNLLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxD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