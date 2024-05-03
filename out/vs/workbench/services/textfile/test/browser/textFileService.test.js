/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/test/browser/workbenchTestServices", "vs/base/test/common/utils", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/base/common/lifecycle"], function (require, exports, assert, workbenchTestServices_1, utils_1, textFileEditorModel_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - TextFileService', () => {
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
        test('isDirty/getDirty - files and untitled', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined));
            accessor.textFileService.files.add(model.resource, model);
            await model.resolve();
            assert.ok(!accessor.textFileService.isDirty(model.resource));
            model.textEditorModel.setValue('foo');
            assert.ok(accessor.textFileService.isDirty(model.resource));
            const untitled = disposables.add(await accessor.textFileService.untitled.resolve());
            assert.ok(!accessor.textFileService.isDirty(untitled.resource));
            untitled.textEditorModel?.setValue('changed');
            assert.ok(accessor.textFileService.isDirty(untitled.resource));
        });
        test('save - file', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined));
            accessor.textFileService.files.add(model.resource, model);
            await model.resolve();
            model.textEditorModel.setValue('foo');
            assert.ok(accessor.textFileService.isDirty(model.resource));
            const res = await accessor.textFileService.save(model.resource);
            assert.strictEqual(res?.toString(), model.resource.toString());
            assert.ok(!accessor.textFileService.isDirty(model.resource));
        });
        test('saveAll - file', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined));
            accessor.textFileService.files.add(model.resource, model);
            await model.resolve();
            model.textEditorModel.setValue('foo');
            assert.ok(accessor.textFileService.isDirty(model.resource));
            const res = await accessor.textFileService.save(model.resource);
            assert.strictEqual(res?.toString(), model.resource.toString());
            assert.ok(!accessor.textFileService.isDirty(model.resource));
        });
        test('saveAs - file', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined));
            accessor.textFileService.files.add(model.resource, model);
            accessor.fileDialogService.setPickFileToSave(model.resource);
            await model.resolve();
            model.textEditorModel.setValue('foo');
            assert.ok(accessor.textFileService.isDirty(model.resource));
            const res = await accessor.textFileService.saveAs(model.resource);
            assert.strictEqual(res.toString(), model.resource.toString());
            assert.ok(!accessor.textFileService.isDirty(model.resource));
        });
        test('revert - file', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined));
            accessor.textFileService.files.add(model.resource, model);
            accessor.fileDialogService.setPickFileToSave(model.resource);
            await model.resolve();
            model.textEditorModel.setValue('foo');
            assert.ok(accessor.textFileService.isDirty(model.resource));
            await accessor.textFileService.revert(model.resource);
            assert.ok(!accessor.textFileService.isDirty(model.resource));
        });
        test('create does not overwrite existing model', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/file.txt'), 'utf8', undefined));
            accessor.textFileService.files.add(model.resource, model);
            await model.resolve();
            model.textEditorModel.setValue('foo');
            assert.ok(accessor.textFileService.isDirty(model.resource));
            let eventCounter = 0;
            disposables.add(accessor.workingCopyFileService.addFileOperationParticipant({
                participate: async (files) => {
                    assert.strictEqual(files[0].target.toString(), model.resource.toString());
                    eventCounter++;
                }
            }));
            disposables.add(accessor.workingCopyFileService.onDidRunWorkingCopyFileOperation(e => {
                assert.strictEqual(e.operation, 0 /* FileOperation.CREATE */);
                assert.strictEqual(e.files[0].target.toString(), model.resource.toString());
                eventCounter++;
            }));
            await accessor.textFileService.create([{ resource: model.resource, value: 'Foo' }]);
            assert.ok(!accessor.textFileService.isDirty(model.resource));
            assert.strictEqual(eventCounter, 2);
        });
        test('Filename Suggestion - Suggest prefix only when there are no relevant extensions', () => {
            disposables.add(accessor.languageService.registerLanguage({
                id: 'plumbus0',
                extensions: ['.one', '.two']
            }));
            const suggested = accessor.textFileService.suggestFilename('shleem', 'Untitled-1');
            assert.strictEqual(suggested, 'Untitled-1');
        });
        test('Filename Suggestion - Suggest prefix with first extension', () => {
            disposables.add(accessor.languageService.registerLanguage({
                id: 'plumbus1',
                extensions: ['.shleem', '.gazorpazorp'],
                filenames: ['plumbus']
            }));
            const suggested = accessor.textFileService.suggestFilename('plumbus1', 'Untitled-1');
            assert.strictEqual(suggested, 'Untitled-1.shleem');
        });
        test('Filename Suggestion - Preserve extension if it matchers', () => {
            disposables.add(accessor.languageService.registerLanguage({
                id: 'plumbus2',
                extensions: ['.shleem', '.gazorpazorp'],
            }));
            const suggested = accessor.textFileService.suggestFilename('plumbus2', 'Untitled-1.gazorpazorp');
            assert.strictEqual(suggested, 'Untitled-1.gazorpazorp');
        });
        test('Filename Suggestion - Rewrite extension according to language', () => {
            disposables.add(accessor.languageService.registerLanguage({
                id: 'plumbus2',
                extensions: ['.shleem', '.gazorpazorp'],
            }));
            const suggested = accessor.textFileService.suggestFilename('plumbus2', 'Untitled-1.foobar');
            assert.strictEqual(suggested, 'Untitled-1.shleem');
        });
        test('Filename Suggestion - Suggest filename if there are no extensions', () => {
            disposables.add(accessor.languageService.registerLanguage({
                id: 'plumbus2',
                filenames: ['plumbus', 'shleem', 'gazorpazorp']
            }));
            const suggested = accessor.textFileService.suggestFilename('plumbus2', 'Untitled-1');
            assert.strictEqual(suggested, 'plumbus');
        });
        test('Filename Suggestion - Preserve filename if it matches', () => {
            disposables.add(accessor.languageService.registerLanguage({
                id: 'plumbus2',
                filenames: ['plumbus', 'shleem', 'gazorpazorp']
            }));
            const suggested = accessor.textFileService.suggestFilename('plumbus2', 'gazorpazorp');
            assert.strictEqual(suggested, 'gazorpazorp');
        });
        test('Filename Suggestion - Rewrites filename according to language', () => {
            disposables.add(accessor.languageService.registerLanguage({
                id: 'plumbus2',
                filenames: ['plumbus', 'shleem', 'gazorpazorp']
            }));
            const suggested = accessor.textFileService.suggestFilename('plumbus2', 'foobar');
            assert.strictEqual(suggested, 'plumbus');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0ZmlsZS90ZXN0L2Jyb3dzZXIvdGV4dEZpbGVTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtRQUVyQyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLG9CQUEyQyxDQUFDO1FBQ2hELElBQUksUUFBNkIsQ0FBQztRQUVsQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1Ysb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDN0UsUUFBUSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQ0FBbUIsQ0FBQyxDQUFDO1lBQ3BFLFdBQVcsQ0FBQyxHQUFHLENBQWtDLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHVDQUF1QyxFQUFFLEtBQUs7WUFDbEQsTUFBTSxLQUFLLEdBQXdCLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHlDQUFtQixFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3ZJLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBTSxDQUFDLEdBQUcsQ0FBQyxLQUFL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