/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/test/common/workbenchTestServices", "vs/platform/log/common/log", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/cancellation", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/services/label/common/labelService", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyHistoryService", "vs/base/common/resources", "vs/base/common/arrays", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/common/uuid", "vs/base/common/path", "vs/base/common/buffer", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert, workbenchTestServices_1, log_1, fileService_1, network_1, uri_1, cancellation_1, uriIdentityService_1, labelService_1, workbenchTestServices_2, testConfigurationService_1, workingCopyHistoryService_1, resources_1, arrays_1, inMemoryFilesystemProvider_1, uuid_1, path_1, buffer_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestWorkingCopyHistoryService = void 0;
    class TestWorkingCopyHistoryService extends workingCopyHistoryService_1.NativeWorkingCopyHistoryService {
        constructor(disposables, fileService) {
            const environmentService = workbenchTestServices_2.TestEnvironmentService;
            const logService = new log_1.NullLogService();
            if (!fileService) {
                fileService = disposables.add(new fileService_1.FileService(logService));
                disposables.add(fileService.registerProvider(network_1.Schemas.inMemory, disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
                disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
            }
            const remoteAgentService = new workbenchTestServices_2.TestRemoteAgentService();
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const lifecycleService = disposables.add(new workbenchTestServices_2.TestLifecycleService());
            const labelService = disposables.add(new labelService_1.LabelService(environmentService, new workbenchTestServices_1.TestContextService(), new workbenchTestServices_2.TestPathService(), new workbenchTestServices_2.TestRemoteAgentService(), disposables.add(new workbenchTestServices_1.TestStorageService()), lifecycleService));
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            super(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, lifecycleService, logService, configurationService);
            this._fileService = fileService;
            this._configurationService = configurationService;
            this._lifecycleService = lifecycleService;
        }
    }
    exports.TestWorkingCopyHistoryService = TestWorkingCopyHistoryService;
    suite('WorkingCopyHistoryService', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let testDir;
        let historyHome;
        let workHome;
        let service;
        let fileService;
        let testFile1Path;
        let testFile2Path;
        let testFile3Path;
        const testFile1PathContents = 'Hello Foo';
        const testFile2PathContents = [
            'Lorem ipsum ',
            'dolor öäü sit amet ',
            'adipiscing ßß elit',
            'consectetur '
        ].join('');
        const testFile3PathContents = 'Hello Bar';
        setup(async () => {
            testDir = uri_1.URI.file((0, path_1.join)((0, uuid_1.generateUuid)(), 'vsctests', 'workingcopyhistoryservice')).with({ scheme: network_1.Schemas.inMemory });
            historyHome = (0, resources_1.joinPath)(testDir, 'User', 'History');
            workHome = (0, resources_1.joinPath)(testDir, 'work');
            service = disposables.add(new TestWorkingCopyHistoryService(disposables));
            fileService = service._fileService;
            await fileService.createFolder(historyHome);
            await fileService.createFolder(workHome);
            testFile1Path = (0, resources_1.joinPath)(workHome, 'foo.txt');
            testFile2Path = (0, resources_1.joinPath)(workHome, 'bar.txt');
            testFile3Path = (0, resources_1.joinPath)(workHome, 'foo-bar.txt');
            await fileService.writeFile(testFile1Path, buffer_1.VSBuffer.fromString(testFile1PathContents));
            await fileService.writeFile(testFile2Path, buffer_1.VSBuffer.fromString(testFile2PathContents));
            await fileService.writeFile(testFile3Path, buffer_1.VSBuffer.fromString(testFile3PathContents));
        });
        let increasingTimestampCounter = 1;
        async function addEntry(descriptor, token, expectEntryAdded = true) {
            const entry = await service.addEntry({
                ...descriptor,
                timestamp: increasingTimestampCounter++ // very important to get tests to not be flaky with stable sort order
            }, token);
            if (expectEntryAdded) {
                assert.ok(entry, 'Unexpected undefined local history entry');
                assert.strictEqual((await fileService.exists(entry.location)), true, 'Unexpected local history not stored');
            }
            return entry;
        }
        teardown(() => {
            disposables.clear();
        });
        test('addEntry', async () => {
            const addEvents = [];
            disposables.add(service.onDidAddEntry(e => addEvents.push(e)));
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const workingCopy2 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile2Path));
            // Add Entry works
            const entry1A = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            const entry2A = await addEntry({ resource: workingCopy2.resource, source: 'My Source' }, cancellation_1.CancellationToken.None);
            assert.strictEqual((await fileService.readFile(entry1A.location)).value.toString(), testFile1PathContents);
            assert.strictEqual((await fileService.readFile(entry2A.location)).value.toString(), testFile2PathContents);
            assert.strictEqual(addEvents.length, 2);
            assert.strictEqual(addEvents[0].entry.workingCopy.resource.toString(), workingCopy1.resource.toString());
            assert.strictEqual(addEvents[1].entry.workingCopy.resource.toString(), workingCopy2.resource.toString());
            assert.strictEqual(addEvents[1].entry.source, 'My Source');
            const entry1B = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            const entry2B = await addEntry({ resource: workingCopy2.resource }, cancellation_1.CancellationToken.None);
            assert.strictEqual((await fileService.readFile(entry1B.location)).value.toString(), testFile1PathContents);
            assert.strictEqual((await fileService.readFile(entry2B.location)).value.toString(), testFile2PathContents);
            assert.strictEqual(addEvents.length, 4);
            assert.strictEqual(addEvents[2].entry.workingCopy.resource.toString(), workingCopy1.resource.toString());
            assert.strictEqual(addEvents[3].entry.workingCopy.resource.toString(), workingCopy2.resource.toString());
            // Cancellation works
            const cts = new cancellation_1.CancellationTokenSource();
            const entry1CPromise = addEntry({ resource: workingCopy1.resource }, cts.token, false);
            cts.dispose(true);
            const entry1C = await entry1CPromise;
            assert.ok(!entry1C);
            assert.strictEqual(addEvents.length, 4);
            // Invalid working copies are ignored
            const workingCopy3 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile2Path.with({ scheme: 'unsupported' })));
            const entry3A = await addEntry({ resource: workingCopy3.resource }, cancellation_1.CancellationToken.None, false);
            assert.ok(!entry3A);
            assert.strictEqual(addEvents.length, 4);
        });
        test('renameEntry', async () => {
            const changeEvents = [];
            disposables.add(service.onDidChangeEntry(e => changeEvents.push(e)));
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const entry = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource, source: 'My Source' }, cancellation_1.CancellationToken.None);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            await service.updateEntry(entry, { source: 'Hello Rename' }, cancellation_1.CancellationToken.None);
            assert.strictEqual(changeEvents.length, 1);
            assert.strictEqual(changeEvents[0].entry, entry);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries[0].source, 'Hello Rename');
            // Simulate shutdown
            const event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            assert.strictEqual(entries[0].source, 'Hello Rename');
        });
        test('removeEntry', async () => {
            const removeEvents = [];
            disposables.add(service.onDidRemoveEntry(e => removeEvents.push(e)));
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource, source: 'My Source' }, cancellation_1.CancellationToken.None);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            let removed = await service.removeEntry(entry2, cancellation_1.CancellationToken.None);
            assert.strictEqual(removed, true);
            assert.strictEqual(removeEvents.length, 1);
            assert.strictEqual(removeEvents[0].entry, entry2);
            // Cannot remove same entry again
            removed = await service.removeEntry(entry2, cancellation_1.CancellationToken.None);
            assert.strictEqual(removed, false);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            // Simulate shutdown
            const event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
        });
        test('removeEntry - deletes history entries folder when last entry removed', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            let entry = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            let event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            assert.strictEqual((await fileService.exists((0, resources_1.dirname)(entry.location))), true);
            entry = (0, arrays_1.firstOrDefault)(await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None));
            assert.ok(entry);
            await service.removeEntry(entry, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            assert.strictEqual((await fileService.exists((0, resources_1.dirname)(entry.location))), false);
        });
        test('removeAll', async () => {
            let removed = false;
            disposables.add(service.onDidRemoveEntries(() => removed = true));
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const workingCopy2 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile2Path));
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy2.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy2.resource, source: 'My Source' }, cancellation_1.CancellationToken.None);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            await service.removeAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(removed, true);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            // Simulate shutdown
            const event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
        });
        test('getEntries - simple', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const workingCopy2 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile2Path));
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            const entry1 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry1);
            const entry2 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            assertEntryEqual(entries[1], entry2);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            const entry3 = await addEntry({ resource: workingCopy2.resource, source: 'other-test-source' }, cancellation_1.CancellationToken.None);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry3);
        });
        test('getEntries - metadata preserved when stored', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const workingCopy2 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile2Path));
            const entry1 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy2.resource }, cancellation_1.CancellationToken.None);
            const entry3 = await addEntry({ resource: workingCopy2.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            const event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry1);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            assertEntryEqual(entries[0], entry2);
            assertEntryEqual(entries[1], entry3);
        });
        test('getEntries - corrupt meta.json is no problem', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            const event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            const metaFile = (0, resources_1.joinPath)((0, resources_1.dirname)(entry1.location), 'entries.json');
            assert.ok((await fileService.exists(metaFile)));
            await fileService.del(metaFile);
            const entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry1, false /* skip timestamp that is unreliable when entries.json is gone */);
        });
        test('getEntries - missing entries from meta.json is no problem', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            const event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            await fileService.del(entry1.location);
            const entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry2);
        });
        test('getEntries - in-memory and on-disk entries are merged', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            const event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            const entry3 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry4 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            const entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            assertEntryEqual(entries[0], entry1);
            assertEntryEqual(entries[1], entry2);
            assertEntryEqual(entries[2], entry3);
            assertEntryEqual(entries[3], entry4);
        });
        test('getEntries - configured max entries respected', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            const entry3 = await addEntry({ resource: workingCopy1.resource, source: 'Test source' }, cancellation_1.CancellationToken.None);
            const entry4 = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            service._configurationService.setUserConfiguration('workbench.localHistory.maxFileEntries', 2);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            assertEntryEqual(entries[0], entry3);
            assertEntryEqual(entries[1], entry4);
            service._configurationService.setUserConfiguration('workbench.localHistory.maxFileEntries', 4);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            service._configurationService.setUserConfiguration('workbench.localHistory.maxFileEntries', 5);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
        });
        test('getAll', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const workingCopy2 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile2Path));
            let resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 0);
            await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 2);
            for (const resource of resources) {
                if (resource.toString() !== workingCopy1.resource.toString() && resource.toString() !== workingCopy2.resource.toString()) {
                    assert.fail(`Unexpected history resource: ${resource.toString()}`);
                }
            }
            // Simulate shutdown
            const event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            const workingCopy3 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile3Path));
            await addEntry({ resource: workingCopy3.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 3);
            for (const resource of resources) {
                if (resource.toString() !== workingCopy1.resource.toString() && resource.toString() !== workingCopy2.resource.toString() && resource.toString() !== workingCopy3.resource.toString()) {
                    assert.fail(`Unexpected history resource: ${resource.toString()}`);
                }
            }
        });
        test('getAll - ignores resource when no entries exist', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const entry = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            let resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 1);
            await service.removeEntry(entry, cancellation_1.CancellationToken.None);
            resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 0);
            // Simulate shutdown
            const event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 0);
        });
        function assertEntryEqual(entryA, entryB, assertTimestamp = true) {
            assert.strictEqual(entryA.id, entryB.id);
            assert.strictEqual(entryA.location.toString(), entryB.location.toString());
            if (assertTimestamp) {
                assert.strictEqual(entryA.timestamp, entryB.timestamp);
            }
            assert.strictEqual(entryA.source, entryB.source);
            assert.strictEqual(entryA.workingCopy.name, entryB.workingCopy.name);
            assert.strictEqual(entryA.workingCopy.resource.toString(), entryB.workingCopy.resource.toString());
        }
        test('entries cleaned up on shutdown', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            const entry3 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            const entry4 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            service._configurationService.setUserConfiguration('workbench.localHistory.maxFileEntries', 2);
            // Simulate shutdown
            let event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            assert.ok(!(await fileService.exists(entry1.location)));
            assert.ok(!(await fileService.exists(entry2.location)));
            assert.ok((await fileService.exists(entry3.location)));
            assert.ok((await fileService.exists(entry4.location)));
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            assertEntryEqual(entries[0], entry3);
            assertEntryEqual(entries[1], entry4);
            service._configurationService.setUserConfiguration('workbench.localHistory.maxFileEntries', 3);
            const entry5 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            event = new workbenchTestServices_2.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            assert.ok((await fileService.exists(entry3.location)));
            assert.ok((await fileService.exists(entry4.location)));
            assert.ok((await fileService.exists(entry5.location)));
            // Resolve from file service fresh and verify again
            service.dispose();
            service = disposables.add(new TestWorkingCopyHistoryService(disposables, fileService));
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            assertEntryEqual(entries[0], entry3);
            assertEntryEqual(entries[1], entry4);
            assertEntryEqual(entries[2], entry5);
        });
        test('entries are merged when source is same', async () => {
            let replaced = undefined;
            disposables.add(service.onDidReplaceEntry(e => replaced = e.entry));
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            service._configurationService.setUserConfiguration('workbench.localHistory.mergeWindow', 1);
            const entry1 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            assert.strictEqual(replaced, undefined);
            const entry2 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            assert.strictEqual(replaced, entry1);
            const entry3 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            assert.strictEqual(replaced, entry2);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry3);
            service._configurationService.setUserConfiguration('workbench.localHistory.mergeWindow', undefined);
            await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
        });
        test('move entries (file rename)', async () => {
            const workingCopy = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            let entries = await service.getEntries(workingCopy.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            const renamedWorkingCopyResource = (0, resources_1.joinPath)((0, resources_1.dirname)(workingCopy.resource), 'renamed.txt');
            await fileService.move(workingCopy.resource, renamedWorkingCopyResource);
            const result = await service.moveEntries(workingCopy.resource, renamedWorkingCopyResource);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].toString(), renamedWorkingCopyResource.toString());
            entries = await service.getEntries(workingCopy.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await service.getEntries(renamedWorkingCopyResource, cancellation_1.CancellationToken.None);
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
            const all = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(all.length, 1);
            assert.strictEqual(all[0].toString(), renamedWorkingCopyResource.toString());
        });
        test('entries moved (folder rename)', async () => {
            const workingCopy1 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile1Path));
            const workingCopy2 = disposables.add(new workbenchTestServices_1.TestWorkingCopy(testFile2Path));
            const entry1A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry1B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            const renamedWorkHome = (0, resources_1.joinPath)((0, resources_1.dirname)(workHome), 'renamed');
            await fileService.move(workHome, renamedWorkHome);
            const resources = await service.moveEntries(workHome, renamedWorkHome);
            const renamedWorkingCopy1Resource = (0, resources_1.joinPath)(renamedWorkHome, (0, resources_1.basename)(workingCopy1.resource));
            const renamedWorkingCopy2Resource = (0, resources_1.joinPath)(renamedWorkHome, (0, resources_1.basename)(workingCopy2.resource));
            assert.strictEqual(resources.length, 2);
            for (const resource of resources) {
                if (resource.toString() !== renamedWorkingCopy1Resource.toString() && resource.toString() !== renamedWorkingCopy2Resource.toString()) {
                    assert.fail(`Unexpected history resource: ${resource.toString()}`);
                }
            }
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await service.getEntries(renamedWorkingCopy1Resource, cancellation_1.CancellationToken.None);
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
            entries = await service.getEntries(renamedWorkingCopy2Resource, cancellation_1.CancellationToken.None);
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
            const all = await service.getAll(cancellation_1.CancellationToken.None);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlIaXN0b3J5U2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvdGVzdC9lbGVjdHJvbi1zYW5kYm94L3dvcmtpbmdDb3B5SGlzdG9yeVNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5QmhHLE1BQWEsNkJBQThCLFNBQVEsMkRBQStCO1FBTWpGLFlBQVksV0FBNEIsRUFBRSxXQUEwQjtZQUNuRSxNQUFNLGtCQUFrQixHQUFHLDhDQUFzQixDQUFDO1lBQ2xELE1BQU0sVUFBVSxHQUFHLElBQUksb0JBQWMsRUFBRSxDQUFDO1lBRXhDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEIsV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGlCQUFPLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1REFBMEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuSCxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBTyxDQUFDLGNBQWMsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdURBQTBCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxSCxDQUFDO1lBRUQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLDhDQUFzQixFQUFFLENBQUM7WUFDeEQsTUFBTSxrQkFBa0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQWtCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FB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RSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLDBCQUEwQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFFdEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLDBCQUEwQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFFdEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLDBCQUEwQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFFdEcsTUFBTSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSwwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzlFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtCQUErQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hELE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBZSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDekUsTUFBTSxZQUFZLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFlLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUV6RSxNQUFNLE9BQU8sR0FBRyxNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuSCxNQUFNLE9BQU8sR0FBRyxNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuSCxNQUFNLE9BQU8sR0FBRyxNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVuSCxNQUFNLE9BQU8sR0FBRyxNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuSCxNQUFNLE9BQU8sR0FBRyxNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuSCxNQUFNLE9BQU8sR0FBRyxNQUFNLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVuSCxJQUFJLE9BQU8sR0FBRyxNQUFNLE9BQU8sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFdEMsT0FBTyxHQUFHLE1BQU0sT0FBTyxD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TyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsMkJBQTJCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUV2RyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsMkJBQTJCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUV2RyxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsVUFBVSxDQUFD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