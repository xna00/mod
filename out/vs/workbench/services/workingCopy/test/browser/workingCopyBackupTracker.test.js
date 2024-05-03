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
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/test/common/utils", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/log/common/log", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/async", "vs/workbench/services/workingCopy/browser/workingCopyBackupTracker", "vs/base/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/base/common/buffer", "vs/base/common/platform", "vs/base/common/network"], function (require, exports, assert, uri_1, editorService_1, editorGroupsService_1, editorService_2, workingCopyBackup_1, utils_1, filesConfigurationService_1, workingCopyService_1, log_1, lifecycle_1, untitledTextEditorInput_1, workbenchTestServices_1, workbenchTestServices_2, async_1, workingCopyBackupTracker_1, lifecycle_2, workingCopyEditorService_1, buffer_1, platform_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WorkingCopyBackupTracker (browser)', function () {
        let accessor;
        const disposables = new lifecycle_2.DisposableStore();
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
        });
        teardown(async () => {
            await (0, workbenchTestServices_1.workbenchTeardown)(accessor.instantiationService);
            disposables.clear();
        });
        let TestWorkingCopyBackupTracker = class TestWorkingCopyBackupTracker extends workingCopyBackupTracker_1.BrowserWorkingCopyBackupTracker {
            constructor(workingCopyBackupService, filesConfigurationService, workingCopyService, lifecycleService, logService, workingCopyEditorService, editorService, editorGroupService) {
                super(workingCopyBackupService, filesConfigurationService, workingCopyService, lifecycleService, logService, workingCopyEditorService, editorService, editorGroupService);
            }
            getBackupScheduleDelay() {
                return 10; // Reduce timeout for tests
            }
            get pendingBackupOperationCount() { return this.pendingBackupOperations.size; }
            getUnrestoredBackups() {
                return this.unrestoredBackups;
            }
            async testRestoreBackups(handler) {
                return super.restoreBackups(handler);
            }
        };
        TestWorkingCopyBackupTracker = __decorate([
            __param(0, workingCopyBackup_1.IWorkingCopyBackupService),
            __param(1, filesConfigurationService_1.IFilesConfigurationService),
            __param(2, workingCopyService_1.IWorkingCopyService),
            __param(3, lifecycle_1.ILifecycleService),
            __param(4, log_1.ILogService),
            __param(5, workingCopyEditorService_1.IWorkingCopyEditorService),
            __param(6, editorService_1.IEditorService),
            __param(7, editorGroupsService_1.IEditorGroupsService)
        ], TestWorkingCopyBackupTracker);
        class TestUntitledTextEditorInput extends untitledTextEditorInput_1.UntitledTextEditorInput {
            constructor() {
                super(...arguments);
                this.resolved = false;
            }
            resolve() {
                this.resolved = true;
                return super.resolve();
            }
        }
        async function createTracker() {
            const workingCopyBackupService = disposables.add(new workbenchTestServices_1.InMemoryTestWorkingCopyBackupService());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            instantiationService.stub(workingCopyBackup_1.IWorkingCopyBackupService, workingCopyBackupService);
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            const editorService = disposables.add(instantiationService.createInstance(editorService_2.EditorService, undefined));
            instantiationService.stub(editorService_1.IEditorService, editorService);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            const tracker = disposables.add(instantiationService.createInstance(TestWorkingCopyBackupTracker));
            return { accessor, part, tracker, workingCopyBackupService: workingCopyBackupService, instantiationService };
        }
        async function untitledBackupTest(untitled = { resource: undefined }) {
            const { accessor, workingCopyBackupService } = await createTracker();
            const untitledTextEditor = disposables.add((await accessor.editorService.openEditor(untitled))?.input);
            const untitledTextModel = disposables.add(await untitledTextEditor.resolve());
            if (!untitled?.contents) {
                untitledTextModel.textEditorModel?.setValue('Super Good');
            }
            await workingCopyBackupService.joinBackupResource();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(untitledTextModel), true);
            untitledTextModel.dispose();
            await workingCopyBackupService.joinDiscardBackup();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(untitledTextModel), false);
        }
        test('Track backups (untitled)', function () {
            return untitledBackupTest();
        });
        test('Track backups (untitled with initial contents)', function () {
            return untitledBackupTest({ resource: undefined, contents: 'Foo Bar' });
        });
        test('Track backups (custom)', async function () {
            const { accessor, tracker, workingCopyBackupService } = await createTracker();
            class TestBackupWorkingCopy extends workbenchTestServices_2.TestWorkingCopy {
                constructor(resource) {
                    super(resource);
                    this.backupDelay = 10;
                    disposables.add(accessor.workingCopyService.registerWorkingCopy(this));
                }
                async backup(token) {
                    await (0, async_1.timeout)(0);
                    return {};
                }
            }
            const resource = utils_1.toResource.call(this, '/path/custom.txt');
            const customWorkingCopy = disposables.add(new TestBackupWorkingCopy(resource));
            // Normal
            customWorkingCopy.setDirty(true);
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            await workingCopyBackupService.joinBackupResource();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(customWorkingCopy), true);
            customWorkingCopy.setDirty(false);
            customWorkingCopy.setDirty(true);
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            await workingCopyBackupService.joinBackupResource();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(customWorkingCopy), true);
            customWorkingCopy.setDirty(false);
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            await workingCopyBackupService.joinDiscardBackup();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(customWorkingCopy), false);
            // Cancellation
            customWorkingCopy.setDirty(true);
            await (0, async_1.timeout)(0);
            customWorkingCopy.setDirty(false);
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            await workingCopyBackupService.joinDiscardBackup();
            assert.strictEqual(workingCopyBackupService.hasBackupSync(customWorkingCopy), false);
        });
        async function restoreBackupsInit() {
            const fooFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Foo' : '/Foo');
            const barFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Bar' : '/Bar');
            const untitledFile1 = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
            const untitledFile2 = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-2' });
            const workingCopyBackupService = disposables.add(new workbenchTestServices_1.InMemoryTestWorkingCopyBackupService());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            instantiationService.stub(workingCopyBackup_1.IWorkingCopyBackupService, workingCopyBackupService);
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_2.EditorService, undefined));
            instantiationService.stub(editorService_1.IEditorService, editorService);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            // Backup 2 normal files and 2 untitled files
            const untitledFile1WorkingCopyId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile1);
            const untitledFile2WorkingCopyId = (0, workbenchTestServices_1.toTypedWorkingCopyId)(untitledFile2);
            await workingCopyBackupService.backup(untitledFile1WorkingCopyId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('untitled-1')));
            await workingCopyBackupService.backup(untitledFile2WorkingCopyId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('untitled-2')));
            const fooFileWorkingCopyId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
            const barFileWorkingCopyId = (0, workbenchTestServices_1.toTypedWorkingCopyId)(barFile);
            await workingCopyBackupService.backup(fooFileWorkingCopyId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('fooFile')));
            await workingCopyBackupService.backup(barFileWorkingCopyId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('barFile')));
            const tracker = disposables.add(instantiationService.createInstance(TestWorkingCopyBackupTracker));
            accessor.lifecycleService.phase = 3 /* LifecyclePhase.Restored */;
            return [tracker, accessor];
        }
        test('Restore backups (basics, some handled)', async function () {
            const [tracker, accessor] = await restoreBackupsInit();
            assert.strictEqual(tracker.getUnrestoredBackups().size, 0);
            let handlesCounter = 0;
            let isOpenCounter = 0;
            let createEditorCounter = 0;
            await tracker.testRestoreBackups({
                handles: workingCopy => {
                    handlesCounter++;
                    return workingCopy.typeId === 'testBackupTypeId';
                },
                isOpen: (workingCopy, editor) => {
                    isOpenCounter++;
                    return false;
                },
                createEditor: workingCopy => {
                    createEditorCounter++;
                    return disposables.add(accessor.instantiationService.createInstance(TestUntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' })));
                }
            });
            assert.strictEqual(handlesCounter, 4);
            assert.strictEqual(isOpenCounter, 0);
            assert.strictEqual(createEditorCounter, 2);
            assert.strictEqual(accessor.editorService.count, 2);
            assert.ok(accessor.editorService.editors.every(editor => editor.isDirty()));
            assert.strictEqual(tracker.getUnrestoredBackups().size, 2);
            for (const editor of accessor.editorService.editors) {
                assert.ok(editor instanceof TestUntitledTextEditorInput);
                assert.strictEqual(editor.resolved, true);
            }
        });
        test('Restore backups (basics, none handled)', async function () {
            const [tracker, accessor] = await restoreBackupsInit();
            await tracker.testRestoreBackups({
                handles: workingCopy => false,
                isOpen: (workingCopy, editor) => { throw new Error('unexpected'); },
                createEditor: workingCopy => { throw new Error('unexpected'); }
            });
            assert.strictEqual(accessor.editorService.count, 0);
            assert.strictEqual(tracker.getUnrestoredBackups().size, 4);
        });
        test('Restore backups (basics, error case)', async function () {
            const [tracker] = await restoreBackupsInit();
            try {
                await tracker.testRestoreBackups({
                    handles: workingCopy => true,
                    isOpen: (workingCopy, editor) => { throw new Error('unexpected'); },
                    createEditor: workingCopy => { throw new Error('unexpected'); }
                });
            }
            catch (error) {
                // ignore
            }
            assert.strictEqual(tracker.getUnrestoredBackups().size, 4);
        });
        test('Restore backups (multiple handlers)', async function () {
            const [tracker, accessor] = await restoreBackupsInit();
            const firstHandler = tracker.testRestoreBackups({
                handles: workingCopy => {
                    return workingCopy.typeId === 'testBackupTypeId';
                },
                isOpen: (workingCopy, editor) => {
                    return false;
                },
                createEditor: workingCopy => {
                    return disposables.add(accessor.instantiationService.createInstance(TestUntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' })));
                }
            });
            const secondHandler = tracker.testRestoreBackups({
                handles: workingCopy => {
                    return workingCopy.typeId.length === 0;
                },
                isOpen: (workingCopy, editor) => {
                    return false;
                },
                createEditor: workingCopy => {
                    return disposables.add(accessor.instantiationService.createInstance(TestUntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' })));
                }
            });
            await Promise.all([firstHandler, secondHandler]);
            assert.strictEqual(accessor.editorService.count, 4);
            assert.ok(accessor.editorService.editors.every(editor => editor.isDirty()));
            assert.strictEqual(tracker.getUnrestoredBackups().size, 0);
            for (const editor of accessor.editorService.editors) {
                assert.ok(editor instanceof TestUntitledTextEditorInput);
                assert.strictEqual(editor.resolved, true);
            }
        });
        test('Restore backups (editors already opened)', async function () {
            const [tracker, accessor] = await restoreBackupsInit();
            assert.strictEqual(tracker.getUnrestoredBackups().size, 0);
            let handlesCounter = 0;
            let isOpenCounter = 0;
            const editor1 = disposables.add(accessor.instantiationService.createInstance(TestUntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' })));
            const editor2 = disposables.add(accessor.instantiationService.createInstance(TestUntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' })));
            await accessor.editorService.openEditors([{ editor: editor1 }, { editor: editor2 }]);
            editor1.resolved = false;
            editor2.resolved = false;
            await tracker.testRestoreBackups({
                handles: workingCopy => {
                    handlesCounter++;
                    return workingCopy.typeId === 'testBackupTypeId';
                },
                isOpen: (workingCopy, editor) => {
                    isOpenCounter++;
                    return true;
                },
                createEditor: workingCopy => { throw new Error('unexpected'); }
            });
            assert.strictEqual(handlesCounter, 4);
            assert.strictEqual(isOpenCounter, 4);
            assert.strictEqual(accessor.editorService.count, 2);
            assert.strictEqual(tracker.getUnrestoredBackups().size, 2);
            for (const editor of accessor.editorService.editors) {
                assert.ok(editor instanceof TestUntitledTextEditorInput);
                // assert that we only call `resolve` on inactive editors
                if (accessor.editorService.isVisible(editor)) {
                    assert.strictEqual(editor.resolved, false);
                }
                else {
                    assert.strictEqual(editor.resolved, true);
                }
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBUcmFja2VyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3JraW5nQ29weS90ZXN0L2Jyb3dzZXIvd29ya2luZ0NvcHlCYWNrdXBUcmFja2VyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUE2QmhHLEtBQUssQ0FBQyxvQ0FBb0MsRUFBRTtRQUMzQyxJQUFJLFFBQTZCLENBQUM7UUFDbEMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSxrREFBMEIsR0FBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDbkIsTUFBTSxJQUFBLHlDQUFpQixFQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBRXZELFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTZCLFNBQVEsMERBQStCO1lBRXpFLFlBQzRCLHdCQUFtRCxFQUNsRCx5QkFBcUQsRUFDNUQsa0JBQXVDLEVBQ3pDLGdCQUFtQyxFQUN6QyxVQUF1QixFQUNULHdCQUFtRCxFQUM5RCxhQUE2QixFQUN2QixrQkFBd0M7Z0JBRTlELEtBQUssQ0FBQyx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsd0JBQXdCLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDM0ssQ0FBQztZQUVrQixzQkFBc0I7Z0JBQ3hDLE9B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