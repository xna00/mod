/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/uri", "vs/workbench/services/workingCopy/common/workingCopyHistoryTracker", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/async", "vs/base/common/network", "vs/base/common/resources", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/notification/test/common/testNotificationService", "vs/base/common/cancellation", "vs/base/common/types", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/workbench/services/workingCopy/test/electron-sandbox/workingCopyHistoryService.test"], function (require, exports, assert, event_1, workbenchTestServices_1, extpath_1, path_1, uri_1, workingCopyHistoryTracker_1, workingCopyService_1, uriIdentityService_1, workbenchTestServices_2, async_1, network_1, resources_1, undoRedoService_1, testDialogService_1, testNotificationService_1, cancellation_1, types_1, buffer_1, lifecycle_1, utils_1, workingCopyHistoryService_test_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WorkingCopyHistoryTracker', () => {
        let testDir;
        let historyHome;
        let workHome;
        let workingCopyHistoryService;
        let workingCopyService;
        let fileService;
        let configurationService;
        let tracker;
        let testFile1Path;
        let testFile2Path;
        const disposables = new lifecycle_1.DisposableStore();
        const testFile1PathContents = 'Hello Foo';
        const testFile2PathContents = [
            'Lorem ipsum ',
            'dolor öäü sit amet ',
            'adipiscing ßß elit',
            'consectetur '
        ].join('').repeat(1000);
        let increasingTimestampCounter = 1;
        async function addEntry(descriptor, token) {
            const entry = await workingCopyHistoryService.addEntry({
                ...descriptor,
                timestamp: increasingTimestampCounter++ // very important to get tests to not be flaky with stable sort order
            }, token);
            return (0, types_1.assertIsDefined)(entry);
        }
        setup(async () => {
            testDir = uri_1.URI.file((0, extpath_1.randomPath)((0, path_1.join)('vsctests', 'workingcopyhistorytracker'))).with({ scheme: network_1.Schemas.inMemory });
            historyHome = (0, resources_1.joinPath)(testDir, 'User', 'History');
            workHome = (0, resources_1.joinPath)(testDir, 'work');
            workingCopyHistoryService = disposables.add(new workingCopyHistoryService_test_1.TestWorkingCopyHistoryService(disposables));
            workingCopyService = disposables.add(new workingCopyService_1.WorkingCopyService());
            fileService = workingCopyHistoryService._fileService;
            configurationService = workingCopyHistoryService._configurationService;
            tracker = disposables.add(createTracker());
            await fileService.createFolder(historyHome);
            await fileService.createFolder(workHome);
            testFile1Path = (0, resources_1.joinPath)(workHome, 'foo.txt');
            testFile2Path = (0, resources_1.joinPath)(workHome, 'bar.txt');
            await fileService.writeFile(testFile1Path, buffer_1.VSBuffer.fromString(testFile1PathContents));
            await fileService.writeFile(testFile2Path, buffer_1.VSBuffer.fromString(testFile2PathContents));
        });
        function createTracker() {
            return new workingCopyHistoryTracker_1.WorkingCopyHistoryTracker(workingCopyService, workingCopyHistoryService, disposables.add(new uriIdentityService_1.UriIdentityService(disposables.add(new workbenchTestServices_2.TestFileService()))), new workbenchTestServices_2.TestPathService(undefined, network_1.Schemas.file), configurationService, new undoRedoService_1.UndoRedoService(new testDialogService_1.TestDialogService(), new testNotificationService_1.TestNotificationService()), new workbenchTestServices_1.TestContextService(), workingCopyHistoryService._fileService);
        }
        teardown(async () => {
            await fileService.del(testDir, { recursive: true });
            disposables.clear();
        });
        test('history entry added on save', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const workingCopy2 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile2Path));
            const stat1 = await fileService.resolve(workingCopy1.resource, { resolveMetadata: true });
            const stat2 = await fileService.resolve(workingCopy2.resource, { resolveMetadata: true });
            disposables.add(workingCopyService.registerWorkingCopy(workingCopy1));
            disposables.add(workingCopyService.registerWorkingCopy(workingCopy2));
            const saveResult = new async_1.DeferredPromise();
            let addedCounter = 0;
            disposables.add(workingCopyHistoryService.onDidAddEntry(e => {
                if ((0, resources_1.isEqual)(e.entry.workingCopy.resource, workingCopy1.resource) || (0, resources_1.isEqual)(e.entry.workingCopy.resource, workingCopy2.resource)) {
                    addedCounter++;
                    if (addedCounter === 2) {
                        saveResult.complete();
                    }
                }
            }));
            await workingCopy1.save(undefined, stat1);
            await workingCopy2.save(undefined, stat2);
            await saveResult.p;
        });
        test('history entry skipped when setting disabled (globally)', async () => {
            configurationService.setUserConfiguration('workbench.localHistory.enabled', false, testFile1Path);
            return assertNoLocalHistoryEntryAddedWithSettingsConfigured();
        });
        test('history entry skipped when setting disabled (exclude)', () => {
            configurationService.setUserConfiguration('workbench.localHistory.exclude', { '**/foo.txt': true });
            // Recreate to apply settings
            tracker.dispose();
            tracker = disposables.add(createTracker());
            return assertNoLocalHistoryEntryAddedWithSettingsConfigured();
        });
        test('history entry skipped when too large', async () => {
            configurationService.setUserConfiguration('workbench.localHistory.maxFileSize', 0, testFile1Path);
            return assertNoLocalHistoryEntryAddedWithSettingsConfigured();
        });
        async function assertNoLocalHistoryEntryAddedWithSettingsConfigured() {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const workingCopy2 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile2Path));
            const stat1 = await fileService.resolve(workingCopy1.resource, { resolveMetadata: true });
            const stat2 = await fileService.resolve(workingCopy2.resource, { resolveMetadata: true });
            disposables.add(workingCopyService.registerWorkingCopy(workingCopy1));
            disposables.add(workingCopyService.registerWorkingCopy(workingCopy2));
            const saveResult = new async_1.DeferredPromise();
            disposables.add(workingCopyHistoryService.onDidAddEntry(e => {
                if ((0, resources_1.isEqual)(e.entry.workingCopy.resource, workingCopy1.resource)) {
                    assert.fail('Unexpected working copy history entry: ' + e.entry.workingCopy.resource.toString());
                }
                if ((0, resources_1.isEqual)(e.entry.workingCopy.resource, workingCopy2.resource)) {
                    saveResult.complete();
                }
            }));
            await workingCopy1.save(undefined, stat1);
            await workingCopy2.save(undefined, stat2);
            await saveResult.p;
        }
        test('entries moved (file rename)', async () => {
            const entriesMoved = event_1.Event.toPromise(workingCopyHistoryService.onDidMoveEntries);
            const workingCopy = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            let entries = await workingCopyHistoryService.getEntries(workingCopy.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            const renamedWorkingCopyResource = (0, resources_1.joinPath)((0, resources_1.dirname)(workingCopy.resource), 'renamed.txt');
            await workingCopyHistoryService._fileService.move(workingCopy.resource, renamedWorkingCopyResource);
            await entriesMoved;
            entries = await workingCopyHistoryService.getEntries(workingCopy.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await workingCopyHistoryService.getEntries(renamedWorkingCopyResource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            assert.strictEqual(entries[0].id, entry1.id);
            assert.strictEqual(entries[0].timestamp, entry1.timestamp);
            assert.strictEqual(entries[0].source, entry1.source);
            assert.notStrictEqual(entries[0].location, entry1.location);
            assert.strictEqual(entries[0].workingCopy.resource.toString(), renamedWorkingCopyResource.toString());
            assert.strictEqual(entries[1].id, entry2.id);
            assert.strictEqual(entries[1].timestamp, entry2.timestamp);
            assert.strictEqual(entries[1].source, entry2.source);
            assert.notStrictEqual(entries[1].location, entry2.location);
            assert.strictEqual(entries[1].workingCopy.resource.toString(), renamedWorkingCopyResource.toString());
            assert.strictEqual(entries[2].id, entry3.id);
            assert.strictEqual(entries[2].timestamp, entry3.timestamp);
            assert.strictEqual(entries[2].source, entry3.source);
            assert.notStrictEqual(entries[2].location, entry3.location);
            assert.strictEqual(entries[2].workingCopy.resource.toString(), renamedWorkingCopyResource.toString());
            const all = await workingCopyHistoryService.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(all.length, 1);
            assert.strictEqual(all[0].toString(), renamedWorkingCopyResource.toString());
        });
        test('entries moved (folder rename)', async () => {
            const entriesMoved = event_1.Event.toPromise(workingCopyHistoryService.onDidMoveEntries);
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const workingCopy2 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile2Path));
            const entry1A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry1B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            let entries = await workingCopyHistoryService.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            entries = await workingCopyHistoryService.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            const renamedWorkHome = (0, resources_1.joinPath)((0, resources_1.dirname)(testDir), 'renamed');
            await workingCopyHistoryService._fileService.move(workHome, renamedWorkHome);
            const renamedWorkingCopy1Resource = (0, resources_1.joinPath)(renamedWorkHome, (0, resources_1.basename)(workingCopy1.resource));
            const renamedWorkingCopy2Resource = (0, resources_1.joinPath)(renamedWorkHome, (0, resources_1.basename)(workingCopy2.resource));
            await entriesMoved;
            entries = await workingCopyHistoryService.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await workingCopyHistoryService.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await workingCopyHistoryService.getEntries(renamedWorkingCopy1Resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            assert.strictEqual(entries[0].id, entry1A.id);
            assert.strictEqual(entries[0].timestamp, entry1A.timestamp);
            assert.strictEqual(entries[0].source, entry1A.source);
            assert.notStrictEqual(entries[0].location, entry1A.location);
            assert.strictEqual(entries[0].workingCopy.resource.toString(), renamedWorkingCopy1Resource.toString());
            assert.strictEqual(entries[1].id, entry2A.id);
            assert.strictEqual(entries[1].timestamp, entry2A.timestamp);
            assert.strictEqual(entries[1].source, entry2A.source);
            assert.notStrictEqual(entries[1].location, entry2A.location);
            assert.strictEqual(entries[1].workingCopy.resource.toString(), renamedWorkingCopy1Resource.toString());
            assert.strictEqual(entries[2].id, entry3A.id);
            assert.strictEqual(entries[2].timestamp, entry3A.timestamp);
            assert.strictEqual(entries[2].source, entry3A.source);
            assert.notStrictEqual(entries[2].location, entry3A.location);
            assert.strictEqual(entries[2].workingCopy.resource.toString(), renamedWorkingCopy1Resource.toString());
            entries = await workingCopyHistoryService.getEntries(renamedWorkingCopy2Resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            assert.strictEqual(entries[0].id, entry1B.id);
            assert.strictEqual(entries[0].timestamp, entry1B.timestamp);
            assert.strictEqual(entries[0].source, entry1B.source);
            assert.notStrictEqual(entries[0].location, entry1B.location);
            assert.strictEqual(entries[0].workingCopy.resource.toString(), renamedWorkingCopy2Resource.toString());
            assert.strictEqual(entries[1].id, entry2B.id);
            assert.strictEqual(entries[1].timestamp, entry2B.timestamp);
            assert.strictEqual(entries[1].source, entry2B.source);
            assert.notStrictEqual(entries[1].location, entry2B.location);
            assert.strictEqual(entries[1].workingCopy.resource.toString(), renamedWorkingCopy2Resource.toString());
            assert.strictEqual(entries[2].id, entry3B.id);
            assert.strictEqual(entries[2].timestamp, entry3B.timestamp);
            assert.strictEqual(entries[2].source, entry3B.source);
            assert.notStrictEqual(entries[2].location, entry3B.location);
            assert.strictEqual(entries[2].workingCopy.resource.toString(), renamedWorkingCopy2Resource.toString());
            const all = await workingCopyHistoryService.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(all.length, 2);
            for (const resource of all) {
                if (resource.toString() !== renamedWorkingCopy1Resource.toString() && resource.toString() !== renamedWorkingCopy2Resource.toString()) {
                    assert.fail(`Unexpected history resource: ${resource.toString()}`);
                }
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlIaXN0b3J5VHJhY2tlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvdGVzdC9lbGVjdHJvbi1zYW5kYm94L3dvcmtpbmdDb3B5SGlzdG9yeVRyYWNrZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTRCaEcsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtRQUV2QyxJQUFJLE9BQVksQ0FBQztRQUNqQixJQUFJLFdBQWdCLENBQUM7UUFDckIsSUFBSSxRQUFhLENBQUM7UUFFbEIsSUFBSSx5QkFBd0QsQ0FBQztRQUM3RCxJQUFJLGtCQUFzQyxDQUFDO1FBQzNDLElBQUksV0FBeUIsQ0FBQztRQUM5QixJQUFJLG9CQUE4QyxDQUFDO1FBRW5ELElBQUksT0FBa0MsQ0FBQztRQUV2QyxJQUFJLGFBQWtCLENBQUM7UUFDdkIsSUFBSSxhQUFrQixDQUFDO1FBRXZCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLE1BQU0scUJBQXFCLEdBQUcsV0FBVyxDQUFDO1FBQzFDLE1BQU0scUJBQXFCLEdBQUc7WUFDN0IsY0FBYztZQUNkLHFCQUFxQjtZQUNyQixvQkFBb0I7WUFDcEIsY0FBYztTQUNkLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV4QixJQUFJLDBCQUEwQixHQUFHLENBQUMsQ0FBQztRQUVuQyxLQUFLLFVBQVUsUUFBUSxDQUFDLFVBQThDLEVBQUUsS0FBd0I7WUFDL0YsTUFBTSxLQUFLLEdBQUcsTUFBTSx5QkFBeUIsQ0FBQyxRQUFRLENBQUM7Z0JBQ3RELEdBQUcsVUFBVTtnQkFDYixTQUFTLEVBQUUsMEJBQTBC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Q0FBQztZQUV2RyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsMkJBQTJCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUV2RyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsMkJB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