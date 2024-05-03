/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/common/path", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/languages/modesRegistry", "vs/editor/common/core/range", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/stream", "vs/base/common/buffer", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/base/test/common/utils", "vs/base/common/async"], function (require, exports, assert, uri_1, path_1, workbenchTestServices_1, textfiles_1, modesRegistry_1, range_1, untitledTextEditorInput_1, cancellation_1, lifecycle_1, stream_1, buffer_1, languageDetectionWorkerService_1, utils_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Untitled text editors', () => {
        class TestUntitledTextEditorInput extends untitledTextEditorInput_1.UntitledTextEditorInput {
            getModel() { return this.model; }
        }
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            disposables.add(accessor.untitledTextEditorService);
        });
        teardown(() => {
            disposables.clear();
        });
        test('basics', async () => {
            const service = accessor.untitledTextEditorService;
            const workingCopyService = accessor.workingCopyService;
            const events = [];
            disposables.add(service.onDidCreate(model => {
                events.push(model);
            }));
            const input1 = instantiationService.createInstance(TestUntitledTextEditorInput, service.create());
            await input1.resolve();
            assert.strictEqual(service.get(input1.resource), input1.getModel());
            assert.ok(!accessor.untitledTextEditorService.isUntitledWithAssociatedResource(input1.resource));
            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].resource.toString(), input1.getModel().resource.toString());
            assert.ok(service.get(input1.resource));
            assert.ok(!service.get(uri_1.URI.file('testing')));
            assert.ok(input1.hasCapability(4 /* EditorInputCapabilities.Untitled */));
            assert.ok(!input1.hasCapability(2 /* EditorInputCapabilities.Readonly */));
            assert.ok(!input1.isReadonly());
            assert.ok(!input1.hasCapability(8 /* EditorInputCapabilities.Singleton */));
            assert.ok(!input1.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */));
            assert.ok(!input1.hasCapability(512 /* EditorInputCapabilities.Scratchpad */));
            const input2 = instantiationService.createInstance(TestUntitledTextEditorInput, service.create());
            assert.strictEqual(service.get(input2.resource), input2.getModel());
            // toUntyped()
            const untypedInput = input1.toUntyped({ preserveViewState: 0 });
            assert.strictEqual(untypedInput.forceUntitled, true);
            // get()
            assert.strictEqual(service.get(input1.resource), input1.getModel());
            assert.strictEqual(service.get(input2.resource), input2.getModel());
            // revert()
            await input1.revert(0);
            assert.ok(input1.isDisposed());
            assert.ok(!service.get(input1.resource));
            // dirty
            const model = await input2.resolve();
            assert.strictEqual(await service.resolve({ untitledResource: input2.resource }), model);
            assert.ok(service.get(model.resource));
            assert.strictEqual(events.length, 2);
            assert.strictEqual(events[1].resource.toString(), input2.resource.toString());
            assert.ok(!input2.isDirty());
            const resourcePromise = awaitDidChangeDirty(accessor.untitledTextEditorService);
            model.textEditorModel?.setValue('foo bar');
            const resource = await resourcePromise;
            assert.strictEqual(resource.toString(), input2.resource.toString());
            assert.ok(input2.isDirty());
            const dirtyUntypedInput = input2.toUntyped({ preserveViewState: 0 });
            assert.strictEqual(dirtyUntypedInput.contents, 'foo bar');
            assert.strictEqual(dirtyUntypedInput.resource, undefined);
            const dirtyUntypedInputWithResource = input2.toUntyped({ preserveViewState: 0, preserveResource: true });
            assert.strictEqual(dirtyUntypedInputWithResource.contents, 'foo bar');
            assert.strictEqual(dirtyUntypedInputWithResource?.resource?.toString(), input2.resource.toString());
            const dirtyUntypedInputWithoutContent = input2.toUntyped();
            assert.strictEqual(dirtyUntypedInputWithoutContent.resource?.toString(), input2.resource.toString());
            assert.strictEqual(dirtyUntypedInputWithoutContent.contents, undefined);
            assert.ok(workingCopyService.isDirty(input2.resource));
            assert.strictEqual(workingCopyService.dirtyCount, 1);
            await input1.revert(0);
            await input2.revert(0);
            assert.ok(!service.get(input1.resource));
            assert.ok(!service.get(input2.resource));
            assert.ok(!input2.isDirty());
            assert.ok(!model.isDirty());
            assert.ok(!workingCopyService.isDirty(input2.resource));
            assert.strictEqual(workingCopyService.dirtyCount, 0);
            await input1.revert(0);
            assert.ok(input1.isDisposed());
            assert.ok(!service.get(input1.resource));
            input2.dispose();
            assert.ok(!service.get(input2.resource));
        });
        function awaitDidChangeDirty(service) {
            return new Promise(resolve => {
                const listener = service.onDidChangeDirty(async (model) => {
                    listener.dispose();
                    resolve(model.resource);
                });
            });
        }
        test('associated resource is dirty', async () => {
            const service = accessor.untitledTextEditorService;
            const file = uri_1.URI.file((0, path_1.join)('C:\\', '/foo/file.txt'));
            let onDidChangeDirtyModel = undefined;
            disposables.add(service.onDidChangeDirty(model => {
                onDidChangeDirtyModel = model;
            }));
            const model = disposables.add(service.create({ associatedResource: file }));
            assert.ok(accessor.untitledTextEditorService.isUntitledWithAssociatedResource(model.resource));
            const untitled = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, model));
            assert.ok(untitled.isDirty());
            assert.strictEqual(model, onDidChangeDirtyModel);
            const resolvedModel = await untitled.resolve();
            assert.ok(resolvedModel.hasAssociatedFilePath);
            assert.strictEqual(untitled.isDirty(), true);
        });
        test('no longer dirty when content gets empty (not with associated resource)', async () => {
            const service = accessor.untitledTextEditorService;
            const workingCopyService = accessor.workingCopyService;
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            // dirty
            const model = disposables.add(await input.resolve());
            model.textEditorModel?.setValue('foo bar');
            assert.ok(model.isDirty());
            assert.ok(workingCopyService.isDirty(model.resource, model.typeId));
            model.textEditorModel?.setValue('');
            assert.ok(!model.isDirty());
            assert.ok(!workingCopyService.isDirty(model.resource, model.typeId));
        });
        test('via create options', async () => {
            const service = accessor.untitledTextEditorService;
            const input1 = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            const model1 = disposables.add(await input1.resolve());
            model1.textEditorModel.setValue('foo bar');
            assert.ok(model1.isDirty());
            model1.textEditorModel.setValue('');
            assert.ok(!model1.isDirty());
            const input2 = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ initialValue: 'Hello World' })));
            const model2 = disposables.add(await input2.resolve());
            assert.strictEqual((0, textfiles_1.snapshotToString)(model2.createSnapshot()), 'Hello World');
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, disposables.add(service.create())));
            const input3 = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ untitledResource: input.resource })));
            const model3 = disposables.add(await input3.resolve());
            assert.strictEqual(model3.resource.toString(), input.resource.toString());
            const file = uri_1.URI.file((0, path_1.join)('C:\\', '/foo/file44.txt'));
            const input4 = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ associatedResource: file })));
            const model4 = disposables.add(await input4.resolve());
            assert.ok(model4.hasAssociatedFilePath);
            assert.ok(model4.isDirty());
        });
        test('associated path remains dirty when content gets empty', async () => {
            const service = accessor.untitledTextEditorService;
            const file = uri_1.URI.file((0, path_1.join)('C:\\', '/foo/file.txt'));
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ associatedResource: file })));
            // dirty
            const model = disposables.add(await input.resolve());
            model.textEditorModel?.setValue('foo bar');
            assert.ok(model.isDirty());
            model.textEditorModel?.setValue('');
            assert.ok(model.isDirty());
        });
        test('initial content is dirty', async () => {
            const service = accessor.untitledTextEditorService;
            const workingCopyService = accessor.workingCopyService;
            const untitled = disposables.add(instantiationService.createInstance(TestUntitledTextEditorInput, service.create({ initialValue: 'Hello World' })));
            assert.ok(untitled.isDirty());
            const backup = (await untitled.getModel().backup(cancellation_1.CancellationToken.None)).content;
            if ((0, stream_1.isReadableStream)(backup)) {
                const value = await (0, buffer_1.streamToBuffer)(backup);
                assert.strictEqual(value.toString(), 'Hello World');
            }
            else if ((0, stream_1.isReadable)(backup)) {
                const value = (0, buffer_1.readableToBuffer)(backup);
                assert.strictEqual(value.toString(), 'Hello World');
            }
            else {
                assert.fail('Missing untitled backup');
            }
            // dirty
            const model = disposables.add(await untitled.resolve());
            assert.ok(model.isDirty());
            assert.strictEqual(workingCopyService.dirtyCount, 1);
        });
        test('created with files.defaultLanguage setting', () => {
            const defaultLanguage = 'javascript';
            const config = accessor.testConfigurationService;
            config.setUserConfiguration('files', { 'defaultLanguage': defaultLanguage });
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(service.create());
            assert.strictEqual(input.getLanguageId(), defaultLanguage);
            config.setUserConfiguration('files', { 'defaultLanguage': undefined });
        });
        test('created with files.defaultLanguage setting (${activeEditorLanguage})', async () => {
            const config = accessor.testConfigurationService;
            config.setUserConfiguration('files', { 'defaultLanguage': '${activeEditorLanguage}' });
            accessor.editorService.activeTextEditorLanguageId = 'typescript';
            const service = accessor.untitledTextEditorService;
            const model = disposables.add(service.create());
            assert.strictEqual(model.getLanguageId(), 'typescript');
            config.setUserConfiguration('files', { 'defaultLanguage': undefined });
            accessor.editorService.activeTextEditorLanguageId = undefined;
        });
        test('created with language overrides files.defaultLanguage setting', () => {
            const language = 'typescript';
            const defaultLanguage = 'javascript';
            const config = accessor.testConfigurationService;
            config.setUserConfiguration('files', { 'defaultLanguage': defaultLanguage });
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(service.create({ languageId: language }));
            assert.strictEqual(input.getLanguageId(), language);
            config.setUserConfiguration('files', { 'defaultLanguage': undefined });
        });
        test('can change language afterwards', async () => {
            const languageId = 'untitled-input-test';
            disposables.add(accessor.languageService.registerLanguage({
                id: languageId,
            }));
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ languageId: languageId })));
            assert.strictEqual(input.getLanguageId(), languageId);
            const model = disposables.add(await input.resolve());
            assert.strictEqual(model.getLanguageId(), languageId);
            input.setLanguageId(modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            assert.strictEqual(input.getLanguageId(), modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
        });
        test('remembers that language was set explicitly', async () => {
            const language = 'untitled-input-test';
            disposables.add(accessor.languageService.registerLanguage({
                id: language,
            }));
            const service = accessor.untitledTextEditorService;
            const model = disposables.add(service.create());
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, model));
            assert.ok(!input.hasLanguageSetExplicitly);
            input.setLanguageId(modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            assert.ok(input.hasLanguageSetExplicitly);
            assert.strictEqual(input.getLanguageId(), modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
        });
        // Issue #159202
        test('remembers that language was set explicitly if set by another source (i.e. ModelService)', async () => {
            const language = 'untitled-input-test';
            disposables.add(accessor.languageService.registerLanguage({
                id: language,
            }));
            const service = accessor.untitledTextEditorService;
            const model = disposables.add(service.create());
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, model));
            disposables.add(await input.resolve());
            assert.ok(!input.hasLanguageSetExplicitly);
            model.textEditorModel.setLanguage(accessor.languageService.createById(language));
            assert.ok(input.hasLanguageSetExplicitly);
            assert.strictEqual(model.getLanguageId(), language);
        });
        test('Language is not set explicitly if set by language detection source', async () => {
            const language = 'untitled-input-test';
            disposables.add(accessor.languageService.registerLanguage({
                id: language,
            }));
            const service = accessor.untitledTextEditorService;
            const model = disposables.add(service.create());
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, model));
            await input.resolve();
            assert.ok(!input.hasLanguageSetExplicitly);
            model.textEditorModel.setLanguage(accessor.languageService.createById(language), 
            // This is really what this is testing
            languageDetectionWorkerService_1.LanguageDetectionLanguageEventSource);
            assert.ok(!input.hasLanguageSetExplicitly);
            assert.strictEqual(model.getLanguageId(), language);
        });
        test('service#onDidChangeEncoding', async () => {
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            let counter = 0;
            disposables.add(service.onDidChangeEncoding(model => {
                counter++;
                assert.strictEqual(model.resource.toString(), input.resource.toString());
            }));
            // encoding
            const model = disposables.add(await input.resolve());
            await model.setEncoding('utf16');
            assert.strictEqual(counter, 1);
        });
        test('service#onDidChangeLabel', async () => {
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            let counter = 0;
            disposables.add(service.onDidChangeLabel(model => {
                counter++;
                assert.strictEqual(model.resource.toString(), input.resource.toString());
            }));
            // label
            const model = disposables.add(await input.resolve());
            model.textEditorModel?.setValue('Foo Bar');
            assert.strictEqual(counter, 1);
        });
        test('service#onWillDispose', async () => {
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            let counter = 0;
            disposables.add(service.onWillDispose(model => {
                counter++;
                assert.strictEqual(model.resource.toString(), input.resource.toString());
            }));
            const model = disposables.add(await input.resolve());
            assert.strictEqual(counter, 0);
            model.dispose();
            assert.strictEqual(counter, 1);
        });
        test('service#getValue', async () => {
            const service = accessor.untitledTextEditorService;
            const input1 = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            const model1 = disposables.add(await input1.resolve());
            model1.textEditorModel.setValue('foo bar');
            assert.strictEqual(service.getValue(model1.resource), 'foo bar');
            model1.dispose();
            // When a model doesn't exist, it should return undefined
            assert.strictEqual(service.getValue(uri_1.URI.parse('https://www.microsoft.com')), undefined);
        });
        test('model#onDidChangeContent', async function () {
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            let counter = 0;
            const model = disposables.add(await input.resolve());
            disposables.add(model.onDidChangeContent(() => counter++));
            model.textEditorModel?.setValue('foo');
            assert.strictEqual(counter, 1, 'Dirty model should trigger event');
            model.textEditorModel?.setValue('bar');
            assert.strictEqual(counter, 2, 'Content change when dirty should trigger event');
            model.textEditorModel?.setValue('');
            assert.strictEqual(counter, 3, 'Manual revert should trigger event');
            model.textEditorModel?.setValue('foo');
            assert.strictEqual(counter, 4, 'Dirty model should trigger event');
        });
        test('model#onDidRevert and input disposed when reverted', async function () {
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            let counter = 0;
            const model = disposables.add(await input.resolve());
            disposables.add(model.onDidRevert(() => counter++));
            model.textEditorModel?.setValue('foo');
            await model.revert();
            assert.ok(input.isDisposed());
            assert.ok(counter === 1);
        });
        test('model#onDidChangeName and input name', async function () {
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            let counter = 0;
            let model = disposables.add(await input.resolve());
            disposables.add(model.onDidChangeName(() => counter++));
            model.textEditorModel?.setValue('foo');
            assert.strictEqual(input.getName(), 'foo');
            assert.strictEqual(model.name, 'foo');
            assert.strictEqual(counter, 1);
            model.textEditorModel?.setValue('bar');
            assert.strictEqual(input.getName(), 'bar');
            assert.strictEqual(model.name, 'bar');
            assert.strictEqual(counter, 2);
            model.textEditorModel?.setValue('');
            assert.strictEqual(input.getName(), 'Untitled-1');
            assert.strictEqual(model.name, 'Untitled-1');
            model.textEditorModel?.setValue('        ');
            assert.strictEqual(input.getName(), 'Untitled-1');
            assert.strictEqual(model.name, 'Untitled-1');
            model.textEditorModel?.setValue('([]}'); // require actual words
            assert.strictEqual(input.getName(), 'Untitled-1');
            assert.strictEqual(model.name, 'Untitled-1');
            model.textEditorModel?.setValue('([]}hello   '); // require actual words
            assert.strictEqual(input.getName(), '([]}hello');
            assert.strictEqual(model.name, '([]}hello');
            model.textEditorModel?.setValue('12345678901234567890123456789012345678901234567890'); // trimmed at 40chars max
            assert.strictEqual(input.getName(), '1234567890123456789012345678901234567890');
            assert.strictEqual(model.name, '1234567890123456789012345678901234567890');
            model.textEditorModel?.setValue('123456789012345678901234567890123456789🌞'); // do not break grapehems (#111235)
            assert.strictEqual(input.getName(), '123456789012345678901234567890123456789');
            assert.strictEqual(model.name, '123456789012345678901234567890123456789');
            model.textEditorModel?.setValue('hello\u202Eworld'); // do not allow RTL in names (#190133)
            assert.strictEqual(input.getName(), 'helloworld');
            assert.strictEqual(model.name, 'helloworld');
            assert.strictEqual(counter, 7);
            model.textEditorModel?.setValue('Hello\nWorld');
            assert.strictEqual(counter, 8);
            function createSingleEditOp(text, positionLineNumber, positionColumn, selectionLineNumber = positionLineNumber, selectionColumn = positionColumn) {
                const range = new range_1.Range(selectionLineNumber, selectionColumn, positionLineNumber, positionColumn);
                return {
                    range,
                    text,
                    forceMoveMarkers: false
                };
            }
            model.textEditorModel?.applyEdits([createSingleEditOp('hello', 2, 2)]);
            assert.strictEqual(counter, 8); // change was not on first line
            input.dispose();
            model.dispose();
            const inputWithContents = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create({ initialValue: 'Foo' })));
            model = disposables.add(await inputWithContents.resolve());
            assert.strictEqual(inputWithContents.getName(), 'Foo');
        });
        test('model#onDidChangeDirty', async function () {
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            let counter = 0;
            const model = disposables.add(await input.resolve());
            disposables.add(model.onDidChangeDirty(() => counter++));
            model.textEditorModel?.setValue('foo');
            assert.strictEqual(counter, 1, 'Dirty model should trigger event');
            model.textEditorModel?.setValue('bar');
            assert.strictEqual(counter, 1, 'Another change does not fire event');
        });
        test('model#onDidChangeEncoding', async function () {
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            let counter = 0;
            const model = disposables.add(await input.resolve());
            disposables.add(model.onDidChangeEncoding(() => counter++));
            await model.setEncoding('utf16');
            assert.strictEqual(counter, 1, 'Dirty model should trigger event');
            await model.setEncoding('utf16');
            assert.strictEqual(counter, 1, 'Another change to same encoding does not fire event');
        });
        test('canDispose with dirty model', async function () {
            const service = accessor.untitledTextEditorService;
            const input = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            const model = disposables.add(await input.resolve());
            model.textEditorModel?.setValue('foo');
            const canDisposePromise = service.canDispose(model);
            assert.ok(canDisposePromise instanceof Promise);
            let canDispose = false;
            (async () => {
                canDispose = await canDisposePromise;
            })();
            assert.strictEqual(canDispose, false);
            model.revert({ soft: true });
            await (0, async_1.timeout)(0);
            assert.strictEqual(canDispose, true);
            const canDispose2 = service.canDispose(model);
            assert.strictEqual(canDispose2, true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRUZXh0RWRpdG9yLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91bnRpdGxlZC90ZXN0L2Jyb3dzZXIvdW50aXRsZWRUZXh0RWRpdG9yLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF1QmhHLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFFbkMsTUFBTSwyQkFBNEIsU0FBUSxpREFBdUI7WUFDaEUsUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDakM7UUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLG9CQUEyQyxDQUFDO1FBQ2hELElBQUksUUFBNkIsQ0FBQztRQUVsQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1Ysb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDN0UsUUFBUSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQ0FBbUIsQ0FBQyxDQUFDO1lBQ3BFLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHlCQUFzRCxDQUFDLENBQUM7UUFDbEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN6QixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMseUJBQXlCLENBQUM7WUFDbkQsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUM7WUFFdkQsTUFBTSxNQUFNLEdBQStCLEVB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