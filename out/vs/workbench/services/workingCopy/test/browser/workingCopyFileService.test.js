/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/base/test/common/utils", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/async", "vs/base/common/lifecycle"], function (require, exports, assert, textFileEditorModel_1, utils_1, workbenchTestServices_1, workbenchTestServices_2, buffer_1, cancellation_1, async_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WorkingCopyFileService', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            disposables.add(accessor.textFileService.files);
        });
        teardown(() => {
            disposables.clear();
        });
        test('create - dirty file', async function () {
            await testCreate(utils_1.toResource.call(this, '/path/file.txt'), buffer_1.VSBuffer.fromString('Hello World'));
        });
        test('delete - dirty file', async function () {
            await testDelete([utils_1.toResource.call(this, '/path/file.txt')]);
        });
        test('delete multiple - dirty files', async function () {
            await testDelete([
                utils_1.toResource.call(this, '/path/file1.txt'),
                utils_1.toResource.call(this, '/path/file2.txt'),
                utils_1.toResource.call(this, '/path/file3.txt'),
                utils_1.toResource.call(this, '/path/file4.txt')
            ]);
        });
        test('move - dirty file', async function () {
            await testMoveOrCopy([{ source: utils_1.toResource.call(this, '/path/file.txt'), target: utils_1.toResource.call(this, '/path/file_target.txt') }], true);
        });
        test('move - source identical to target', async function () {
            const sourceModel = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.files.add(sourceModel.resource, sourceModel);
            const eventCounter = await testEventsMoveOrCopy([{ file: { source: sourceModel.resource, target: sourceModel.resource }, overwrite: true }], true);
            sourceModel.dispose();
            assert.strictEqual(eventCounter, 3);
        });
        test('move - one source == target and another source != target', async function () {
            const sourceModel1 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file1.txt'), 'utf8', undefined);
            const sourceModel2 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file2.txt'), 'utf8', undefined);
            const targetModel2 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file_target2.txt'), 'utf8', undefined);
            accessor.textFileService.files.add(sourceModel1.resource, sourceModel1);
            accessor.textFileService.files.add(sourceModel2.resource, sourceModel2);
            accessor.textFileService.files.add(targetModel2.resource, targetModel2);
            const eventCounter = await testEventsMoveOrCopy([
                { file: { source: sourceModel1.resource, target: sourceModel1.resource }, overwrite: true },
                { file: { source: sourceModel2.resource, target: targetModel2.resource }, overwrite: true }
            ], true);
            sourceModel1.dispose();
            sourceModel2.dispose();
            targetModel2.dispose();
            assert.strictEqual(eventCounter, 3);
        });
        test('move multiple - dirty file', async function () {
            await testMoveOrCopy([
                { source: utils_1.toResource.call(this, '/path/file1.txt'), target: utils_1.toResource.call(this, '/path/file1_target.txt') },
                { source: utils_1.toResource.call(this, '/path/file2.txt'), target: utils_1.toResource.call(this, '/path/file2_target.txt') }
            ], true);
        });
        test('move - dirty file (target exists and is dirty)', async function () {
            await testMoveOrCopy([{ source: utils_1.toResource.call(this, '/path/file.txt'), target: utils_1.toResource.call(this, '/path/file_target.txt') }], true, true);
        });
        test('copy - dirty file', async function () {
            await testMoveOrCopy([{ source: utils_1.toResource.call(this, '/path/file.txt'), target: utils_1.toResource.call(this, '/path/file_target.txt') }], false);
        });
        test('copy - source identical to target', async function () {
            const sourceModel = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined);
            accessor.textFileService.files.add(sourceModel.resource, sourceModel);
            const eventCounter = await testEventsMoveOrCopy([{ file: { source: sourceModel.resource, target: sourceModel.resource }, overwrite: true }]);
            sourceModel.dispose();
            assert.strictEqual(eventCounter, 3);
        });
        test('copy - one source == target and another source != target', async function () {
            const sourceModel1 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file1.txt'), 'utf8', undefined);
            const sourceModel2 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file2.txt'), 'utf8', undefined);
            const targetModel2 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file_target2.txt'), 'utf8', undefined);
            accessor.textFileService.files.add(sourceModel1.resource, sourceModel1);
            accessor.textFileService.files.add(sourceModel2.resource, sourceModel2);
            accessor.textFileService.files.add(targetModel2.resource, targetModel2);
            const eventCounter = await testEventsMoveOrCopy([
                { file: { source: sourceModel1.resource, target: sourceModel1.resource }, overwrite: true },
                { file: { source: sourceModel2.resource, target: targetModel2.resource }, overwrite: true }
            ]);
            sourceModel1.dispose();
            sourceModel2.dispose();
            targetModel2.dispose();
            assert.strictEqual(eventCounter, 3);
        });
        test('copy multiple - dirty file', async function () {
            await testMoveOrCopy([
                { source: utils_1.toResource.call(this, '/path/file1.txt'), target: utils_1.toResource.call(this, '/path/file_target1.txt') },
                { source: utils_1.toResource.call(this, '/path/file2.txt'), target: utils_1.toResource.call(this, '/path/file_target2.txt') },
                { source: utils_1.toResource.call(this, '/path/file3.txt'), target: utils_1.toResource.call(this, '/path/file_target3.txt') }
            ], false);
        });
        test('copy - dirty file (target exists and is dirty)', async function () {
            await testMoveOrCopy([{ source: utils_1.toResource.call(this, '/path/file.txt'), target: utils_1.toResource.call(this, '/path/file_target.txt') }], false, true);
        });
        test('getDirty', async function () {
            const model1 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file-1.txt'), 'utf8', undefined);
            accessor.textFileService.files.add(model1.resource, model1);
            const model2 = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file-2.txt'), 'utf8', undefined);
            accessor.textFileService.files.add(model2.resource, model2);
            let dirty = accessor.workingCopyFileService.getDirty(model1.resource);
            assert.strictEqual(dirty.length, 0);
            await model1.resolve();
            model1.textEditorModel.setValue('foo');
            dirty = accessor.workingCopyFileService.getDirty(model1.resource);
            assert.strictEqual(dirty.length, 1);
            assert.strictEqual(dirty[0], model1);
            dirty = accessor.workingCopyFileService.getDirty(utils_1.toResource.call(this, '/path'));
            assert.strictEqual(dirty.length, 1);
            assert.strictEqual(dirty[0], model1);
            await model2.resolve();
            model2.textEditorModel.setValue('bar');
            dirty = accessor.workingCopyFileService.getDirty(utils_1.toResource.call(this, '/path'));
            assert.strictEqual(dirty.length, 2);
            model1.dispose();
            model2.dispose();
        });
        test('registerWorkingCopyProvider', async function () {
            const model1 = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file-1.txt'), 'utf8', undefined));
            accessor.textFileService.files.add(model1.resource, model1);
            await model1.resolve();
            model1.textEditorModel.setValue('foo');
            const testWorkingCopy = disposables.add(new workbenchTestServices_2.TestWorkingCopy(utils_1.toResource.call(this, '/path/file-2.txt'), true));
            const registration = accessor.workingCopyFileService.registerWorkingCopyProvider(() => {
                return [model1, testWorkingCopy];
            });
            let dirty = accessor.workingCopyFileService.getDirty(model1.resource);
            assert.strictEqual(dirty.length, 2, 'Should return default working copy + working copy from provider');
            assert.strictEqual(dirty[0], model1);
            assert.strictEqual(dirty[1], testWorkingCopy);
            registration.dispose();
            dirty = accessor.workingCopyFileService.getDirty(model1.resource);
            assert.strictEqual(dirty.length, 1, 'Should have unregistered our provider');
            assert.strictEqual(dirty[0], model1);
        });
        test('createFolder', async function () {
            let eventCounter = 0;
            let correlationId = undefined;
            const resource = utils_1.toResource.call(this, '/path/folder');
            disposables.add(accessor.workingCopyFileService.addFileOperationParticipant({
                participate: async (files, operation) => {
                    assert.strictEqual(files.length, 1);
                    const file = files[0];
                    assert.strictEqual(file.target.toString(), resource.toString());
                    assert.strictEqual(operation, 0 /* FileOperation.CREATE */);
                    eventCounter++;
                }
            }));
            disposables.add(accessor.workingCopyFileService.onWillRunWorkingCopyFileOperation(e => {
                assert.strictEqual(e.files.length, 1);
                const file = e.files[0];
                assert.strictEqual(file.target.toString(), resource.toString());
                assert.strictEqual(e.operation, 0 /* FileOperation.CREATE */);
                correlationId = e.correlationId;
                eventCounter++;
            }));
            disposables.add(accessor.workingCopyFileService.onDidRunWorkingCopyFileOperation(e => {
                assert.strictEqual(e.files.length, 1);
                const file = e.files[0];
                assert.strictEqual(file.target.toString(), resource.toString());
                assert.strictEqual(e.operation, 0 /* FileOperation.CREATE */);
                assert.strictEqual(e.correlationId, correlationId);
                eventCounter++;
            }));
            await accessor.workingCopyFileService.createFolder([{ resource }], cancellation_1.CancellationToken.None);
            assert.strictEqual(eventCounter, 3);
        });
        test('cancellation of participants', async function () {
            const resource = utils_1.toResource.call(this, '/path/folder');
            let canceled = false;
            disposables.add(accessor.workingCopyFileService.addFileOperationParticipant({
                participate: async (files, operation, info, t, token) => {
                    await (0, async_1.timeout)(0);
                    canceled = token.isCancellationRequested;
                }
            }));
            // Create
            let cts = new cancellation_1.CancellationTokenSource();
            let promise = accessor.workingCopyFileService.create([{ resource }], cts.token);
            cts.cancel();
            await promise;
            assert.strictEqual(canceled, true);
            canceled = false;
            // Create Folder
            cts = new cancellation_1.CancellationTokenSource();
            promise = accessor.workingCopyFileService.createFolder([{ resource }], cts.token);
            cts.cancel();
            await promise;
            assert.strictEqual(canceled, true);
            canceled = false;
            // Move
            cts = new cancellation_1.CancellationTokenSource();
            promise = accessor.workingCopyFileService.move([{ file: { source: resource, target: resource } }], cts.token);
            cts.cancel();
            await promise;
            assert.strictEqual(canceled, true);
            canceled = false;
            // Copy
            cts = new cancellation_1.CancellationTokenSource();
            promise = accessor.workingCopyFileService.copy([{ file: { source: resource, target: resource } }], cts.token);
            cts.cancel();
            await promise;
            assert.strictEqual(canceled, true);
            canceled = false;
            // Delete
            cts = new cancellation_1.CancellationTokenSource();
            promise = accessor.workingCopyFileService.delete([{ resource }], cts.token);
            cts.cancel();
            await promise;
            assert.strictEqual(canceled, true);
            canceled = false;
        });
        async function testEventsMoveOrCopy(files, move) {
            let eventCounter = 0;
            const participant = accessor.workingCopyFileService.addFileOperationParticipant({
                participate: async (files) => {
                    eventCounter++;
                }
            });
            const listener1 = accessor.workingCopyFileService.onWillRunWorkingCopyFileOperation(e => {
                eventCounter++;
            });
            const listener2 = accessor.workingCopyFileService.onDidRunWorkingCopyFileOperation(e => {
                eventCounter++;
            });
            if (move) {
                await accessor.workingCopyFileService.move(files, cancellation_1.CancellationToken.None);
            }
            else {
                await accessor.workingCopyFileService.copy(files, cancellation_1.CancellationToken.None);
            }
            participant.dispose();
            listener1.dispose();
            listener2.dispose();
            return eventCounter;
        }
        async function testMoveOrCopy(files, move, targetDirty) {
            let eventCounter = 0;
            const models = await Promise.all(files.map(async ({ source, target }, i) => {
                const sourceModel = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, source, 'utf8', undefined);
                const targetModel = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, target, 'utf8', undefined);
                accessor.textFileService.files.add(sourceModel.resource, sourceModel);
                accessor.textFileService.files.add(targetModel.resource, targetModel);
                await sourceModel.resolve();
                sourceModel.textEditorModel.setValue('foo' + i);
                assert.ok(accessor.textFileService.isDirty(sourceModel.resource));
                if (targetDirty) {
                    await targetModel.resolve();
                    targetModel.textEditorModel.setValue('bar' + i);
                    assert.ok(accessor.textFileService.isDirty(targetModel.resource));
                }
                return { sourceModel, targetModel };
            }));
            const participant = accessor.workingCopyFileService.addFileOperationParticipant({
                participate: async (files, operation) => {
                    for (let i = 0; i < files.length; i++) {
                        const { target, source } = files[i];
                        const { targetModel, sourceModel } = models[i];
                        assert.strictEqual(target.toString(), targetModel.resource.toString());
                        assert.strictEqual(source?.toString(), sourceModel.resource.toString());
                    }
                    eventCounter++;
                    assert.strictEqual(operation, move ? 2 /* FileOperation.MOVE */ : 3 /* FileOperation.COPY */);
                }
            });
            let correlationId;
            const listener1 = accessor.workingCopyFileService.onWillRunWorkingCopyFileOperation(e => {
                for (let i = 0; i < e.files.length; i++) {
                    const { target, source } = files[i];
                    const { targetModel, sourceModel } = models[i];
                    assert.strictEqual(target.toString(), targetModel.resource.toString());
                    assert.strictEqual(source?.toString(), sourceModel.resource.toString());
                }
                eventCounter++;
                correlationId = e.correlationId;
                assert.strictEqual(e.operation, move ? 2 /* FileOperation.MOVE */ : 3 /* FileOperation.COPY */);
            });
            const listener2 = accessor.workingCopyFileService.onDidRunWorkingCopyFileOperation(e => {
                for (let i = 0; i < e.files.length; i++) {
                    const { target, source } = files[i];
                    const { targetModel, sourceModel } = models[i];
                    assert.strictEqual(target.toString(), targetModel.resource.toString());
                    assert.strictEqual(source?.toString(), sourceModel.resource.toString());
                }
                eventCounter++;
                assert.strictEqual(e.operation, move ? 2 /* FileOperation.MOVE */ : 3 /* FileOperation.COPY */);
                assert.strictEqual(e.correlationId, correlationId);
            });
            if (move) {
                await accessor.workingCopyFileService.move(models.map(model => ({ file: { source: model.sourceModel.resource, target: model.targetModel.resource }, options: { overwrite: true } })), cancellation_1.CancellationToken.None);
            }
            else {
                await accessor.workingCopyFileService.copy(models.map(model => ({ file: { source: model.sourceModel.resource, target: model.targetModel.resource }, options: { overwrite: true } })), cancellation_1.CancellationToken.None);
            }
            for (let i = 0; i < models.length; i++) {
                const { sourceModel, targetModel } = models[i];
                assert.strictEqual(targetModel.textEditorModel.getValue(), 'foo' + i);
                if (move) {
                    assert.ok(!accessor.textFileService.isDirty(sourceModel.resource));
                }
                else {
                    assert.ok(accessor.textFileService.isDirty(sourceModel.resource));
                }
                assert.ok(accessor.textFileService.isDirty(targetModel.resource));
                sourceModel.dispose();
                targetModel.dispose();
            }
            assert.strictEqual(eventCounter, 3);
            participant.dispose();
            listener1.dispose();
            listener2.dispose();
        }
        async function testDelete(resources) {
            const models = await Promise.all(resources.map(async (resource) => {
                const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, resource, 'utf8', undefined);
                accessor.textFileService.files.add(model.resource, model);
                await model.resolve();
                model.textEditorModel.setValue('foo');
                assert.ok(accessor.workingCopyService.isDirty(model.resource));
                return model;
            }));
            let eventCounter = 0;
            let correlationId = undefined;
            const participant = accessor.workingCopyFileService.addFileOperationParticipant({
                participate: async (files, operation) => {
                    for (let i = 0; i < models.length; i++) {
                        const model = models[i];
                        const file = files[i];
                        assert.strictEqual(file.target.toString(), model.resource.toString());
                    }
                    assert.strictEqual(operation, 1 /* FileOperation.DELETE */);
                    eventCounter++;
                }
            });
            const listener1 = accessor.workingCopyFileService.onWillRunWorkingCopyFileOperation(e => {
                for (let i = 0; i < models.length; i++) {
                    const model = models[i];
                    const file = e.files[i];
                    assert.strictEqual(file.target.toString(), model.resource.toString());
                }
                assert.strictEqual(e.operation, 1 /* FileOperation.DELETE */);
                correlationId = e.correlationId;
                eventCounter++;
            });
            const listener2 = accessor.workingCopyFileService.onDidRunWorkingCopyFileOperation(e => {
                for (let i = 0; i < models.length; i++) {
                    const model = models[i];
                    const file = e.files[i];
                    assert.strictEqual(file.target.toString(), model.resource.toString());
                }
                assert.strictEqual(e.operation, 1 /* FileOperation.DELETE */);
                assert.strictEqual(e.correlationId, correlationId);
                eventCounter++;
            });
            await accessor.workingCopyFileService.delete(models.map(model => ({ resource: model.resource })), cancellation_1.CancellationToken.None);
            for (const model of models) {
                assert.ok(!accessor.workingCopyService.isDirty(model.resource));
                model.dispose();
            }
            assert.strictEqual(eventCounter, 3);
            participant.dispose();
            listener1.dispose();
            listener2.dispose();
        }
        async function testCreate(resource, contents) {
            const model = instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, resource, 'utf8', undefined);
            accessor.textFileService.files.add(model.resource, model);
            await model.resolve();
            model.textEditorModel.setValue('foo');
            assert.ok(accessor.workingCopyService.isDirty(model.resource));
            let eventCounter = 0;
            let correlationId = undefined;
            disposables.add(accessor.workingCopyFileService.addFileOperationParticipant({
                participate: async (files, operation) => {
                    assert.strictEqual(files.length, 1);
                    const file = files[0];
                    assert.strictEqual(file.target.toString(), model.resource.toString());
                    assert.strictEqual(operation, 0 /* FileOperation.CREATE */);
                    eventCounter++;
                }
            }));
            disposables.add(accessor.workingCopyFileService.onWillRunWorkingCopyFileOperation(e => {
                assert.strictEqual(e.files.length, 1);
                const file = e.files[0];
                assert.strictEqual(file.target.toString(), model.resource.toString());
                assert.strictEqual(e.operation, 0 /* FileOperation.CREATE */);
                correlationId = e.correlationId;
                eventCounter++;
            }));
            disposables.add(accessor.workingCopyFileService.onDidRunWorkingCopyFileOperation(e => {
                assert.strictEqual(e.files.length, 1);
                const file = e.files[0];
                assert.strictEqual(file.target.toString(), model.resource.toString());
                assert.strictEqual(e.operation, 0 /* FileOperation.CREATE */);
                assert.strictEqual(e.correlationId, correlationId);
                eventCounter++;
            }));
            await accessor.workingCopyFileService.create([{ resource, contents }], cancellation_1.CancellationToken.None);
            assert.ok(!accessor.workingCopyService.isDirty(model.resource));
            model.dispose();
            assert.strictEqual(eventCounter, 3);
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlGaWxlU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvdGVzdC9icm93c2VyL3dvcmtpbmdDb3B5RmlsZVNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlCaEcsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtRQUVwQyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLG9CQUEyQyxDQUFDO1FBQ2hELElBQUksUUFBNkIsQ0FBQztRQUVsQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1Ysb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDN0UsUUFBUSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQ0FBbUIsQ0FBQyxDQUFDO1lBQ3BFLFdBQVcsQ0FBQyxHQUFHLENBQTZCLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFCQUFxQixFQUFFLEtBQUs7WUFDaEMsTUFBTSxVQUFVLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUMvRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQkFBcUIsRUFBRSxLQUFLO1lBQ2hDLE1BQU0sVUFBVSxDQUFDLENB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