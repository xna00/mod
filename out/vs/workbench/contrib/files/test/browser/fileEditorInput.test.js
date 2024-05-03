/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/common/editor", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/base/common/async", "vs/editor/common/languages/modesRegistry", "vs/base/common/lifecycle", "vs/workbench/common/editor/binaryEditorModel", "vs/platform/registry/common/platform", "vs/workbench/contrib/files/browser/editors/fileEditorHandler", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/workbench/services/textfile/common/textEditorService"], function (require, exports, assert, uri_1, utils_1, fileEditorInput_1, workbenchTestServices_1, editor_1, textfiles_1, files_1, textFileEditorModel_1, async_1, modesRegistry_1, lifecycle_1, binaryEditorModel_1, platform_1, fileEditorHandler_1, inMemoryFilesystemProvider_1, textEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - FileEditorInput', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        function createFileInput(resource, preferredResource, preferredLanguageId, preferredName, preferredDescription, preferredContents) {
            return disposables.add(instantiationService.createInstance(fileEditorInput_1.FileEditorInput, resource, preferredResource, preferredName, preferredDescription, undefined, preferredLanguageId, preferredContents));
        }
        class TestTextEditorService extends textEditorService_1.TextEditorService {
            createTextEditor(input) {
                return createFileInput(input.resource);
            }
            async resolveTextEditor(input) {
                return createFileInput(input.resource);
            }
        }
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({
                textEditorService: instantiationService => instantiationService.createInstance(TestTextEditorService)
            }, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
        });
        teardown(() => {
            disposables.clear();
        });
        test('Basics', async function () {
            let input = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'));
            const otherInput = createFileInput(utils_1.toResource.call(this, 'foo/bar/otherfile.js'));
            const otherInputSame = createFileInput(utils_1.toResource.call(this, 'foo/bar/file.js'));
            assert(input.matches(input));
            assert(input.matches(otherInputSame));
            assert(!input.matches(otherInput));
            assert.ok(input.getName());
            assert.ok(input.getDescription());
            assert.ok(input.getTitle(0 /* Verbosity.SHORT */));
            assert.ok(!input.hasCapability(4 /* EditorInputCapabilities.Untitled */));
            assert.ok(!input.hasCapability(2 /* EditorInputCapabilities.Readonly */));
            assert.ok(!input.isReadonly());
            assert.ok(!input.hasCapability(8 /* EditorInputCapabilities.Singleton */));
            assert.ok(!input.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */));
            const untypedInput = input.toUntyped({ preserveViewState: 0 });
            assert.strictEqual(untypedInput.resource.toString(), input.resource.toString());
            assert.strictEqual('file.js', input.getName());
            assert.strictEqual(utils_1.toResource.call(this, '/foo/bar/file.js').fsPath, input.resource.fsPath);
            assert(input.resource instanceof uri_1.URI);
            input = createFileInput(utils_1.toResource.call(this, '/foo/bar.html'));
            const inputToResolve = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'));
            const sameOtherInput = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'));
            let resolved = await inputToResolve.resolve();
            assert.ok(inputToResolve.isResolved());
            const resolvedModelA = resolved;
            resolved = await inputToResolve.resolve();
            assert(resolvedModelA === resolved); // OK: Resolved Model cached globally per input
            try {
                lifecycle_1.DisposableStore.DISABLE_DISPOSED_WARNING = true; // prevent unwanted warning output from occurring
                const otherResolved = await sameOtherInput.resolve();
                assert(otherResolved === resolvedModelA); // OK: Resolved Model cached globally per input
                inputToResolve.dispose();
                resolved = await inputToResolve.resolve();
                assert(resolvedModelA === resolved); // Model is still the same because we had 2 clients
                inputToResolve.dispose();
                sameOtherInput.dispose();
                resolvedModelA.dispose();
                resolved = await inputToResolve.resolve();
                assert(resolvedModelA !== resolved); // Different instance, because input got disposed
                const stat = (0, workbenchTestServices_1.getLastResolvedFileStat)(resolved);
                resolved = await inputToResolve.resolve();
                await (0, async_1.timeout)(0);
                assert(stat !== (0, workbenchTestServices_1.getLastResolvedFileStat)(resolved)); // Different stat, because resolve always goes to the server for refresh
            }
            finally {
                lifecycle_1.DisposableStore.DISABLE_DISPOSED_WARNING = false;
            }
        });
        test('reports as untitled without supported file scheme', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js').with({ scheme: 'someTestingScheme' }));
            assert.ok(input.hasCapability(4 /* EditorInputCapabilities.Untitled */));
            assert.ok(!input.hasCapability(2 /* EditorInputCapabilities.Readonly */));
            assert.ok(!input.isReadonly());
        });
        test('reports as readonly with readonly file scheme', async function () {
            const inMemoryFilesystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            inMemoryFilesystemProvider.setReadOnly(true);
            disposables.add(accessor.fileService.registerProvider('someTestingReadonlyScheme', inMemoryFilesystemProvider));
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js').with({ scheme: 'someTestingReadonlyScheme' }));
            assert.ok(!input.hasCapability(4 /* EditorInputCapabilities.Untitled */));
            assert.ok(input.hasCapability(2 /* EditorInputCapabilities.Readonly */));
            assert.ok(input.isReadonly());
        });
        test('preferred resource', function () {
            const resource = utils_1.toResource.call(this, '/foo/bar/updatefile.js');
            const preferredResource = utils_1.toResource.call(this, '/foo/bar/UPDATEFILE.js');
            const inputWithoutPreferredResource = createFileInput(resource);
            assert.strictEqual(inputWithoutPreferredResource.resource.toString(), resource.toString());
            assert.strictEqual(inputWithoutPreferredResource.preferredResource.toString(), resource.toString());
            const inputWithPreferredResource = createFileInput(resource, preferredResource);
            assert.strictEqual(inputWithPreferredResource.resource.toString(), resource.toString());
            assert.strictEqual(inputWithPreferredResource.preferredResource.toString(), preferredResource.toString());
            let didChangeLabel = false;
            disposables.add(inputWithPreferredResource.onDidChangeLabel(e => {
                didChangeLabel = true;
            }));
            assert.strictEqual(inputWithPreferredResource.getName(), 'UPDATEFILE.js');
            const otherPreferredResource = utils_1.toResource.call(this, '/FOO/BAR/updateFILE.js');
            inputWithPreferredResource.setPreferredResource(otherPreferredResource);
            assert.strictEqual(inputWithPreferredResource.resource.toString(), resource.toString());
            assert.strictEqual(inputWithPreferredResource.preferredResource.toString(), otherPreferredResource.toString());
            assert.strictEqual(inputWithPreferredResource.getName(), 'updateFILE.js');
            assert.strictEqual(didChangeLabel, true);
        });
        test('preferred language', async function () {
            const languageId = 'file-input-test';
            disposables.add(accessor.languageService.registerLanguage({
                id: languageId,
            }));
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'), undefined, languageId);
            assert.strictEqual(input.getPreferredLanguageId(), languageId);
            const model = disposables.add(await input.resolve());
            assert.strictEqual(model.textEditorModel.getLanguageId(), languageId);
            input.setLanguageId('text');
            assert.strictEqual(input.getPreferredLanguageId(), 'text');
            assert.strictEqual(model.textEditorModel.getLanguageId(), modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            const input2 = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'));
            input2.setPreferredLanguageId(languageId);
            const model2 = disposables.add(await input2.resolve());
            assert.strictEqual(model2.textEditorModel.getLanguageId(), languageId);
        });
        test('preferred contents', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'), undefined, undefined, undefined, undefined, 'My contents');
            const model = disposables.add(await input.resolve());
            assert.strictEqual(model.textEditorModel.getValue(), 'My contents');
            assert.strictEqual(input.isDirty(), true);
            const untypedInput = input.toUntyped({ preserveViewState: 0 });
            assert.strictEqual(untypedInput.contents, 'My contents');
            const untypedInputWithoutContents = input.toUntyped();
            assert.strictEqual(untypedInputWithoutContents.contents, undefined);
            input.setPreferredContents('Other contents');
            await input.resolve();
            assert.strictEqual(model.textEditorModel.getValue(), 'Other contents');
            model.textEditorModel?.setValue('Changed contents');
            await input.resolve();
            assert.strictEqual(model.textEditorModel.getValue(), 'Changed contents'); // preferred contents only used once
            const input2 = createFileInput(utils_1.toResource.call(this, '/foo/bar/file.js'));
            input2.setPreferredContents('My contents');
            const model2 = await input2.resolve();
            assert.strictEqual(model2.textEditorModel.getValue(), 'My contents');
            assert.strictEqual(input2.isDirty(), true);
        });
        test('matches', function () {
            const input1 = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            const input2 = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            const input3 = createFileInput(utils_1.toResource.call(this, '/foo/bar/other.js'));
            const input2Upper = createFileInput(utils_1.toResource.call(this, '/foo/bar/UPDATEFILE.js'));
            assert.strictEqual(input1.matches(input1), true);
            assert.strictEqual(input1.matches(input2), true);
            assert.strictEqual(input1.matches(input3), false);
            assert.strictEqual(input1.matches(input2Upper), false);
        });
        test('getEncoding/setEncoding', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            await input.setEncoding('utf16', 0 /* EncodingMode.Encode */);
            assert.strictEqual(input.getEncoding(), 'utf16');
            const resolved = disposables.add(await input.resolve());
            assert.strictEqual(input.getEncoding(), resolved.getEncoding());
        });
        test('save', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            const resolved = disposables.add(await input.resolve());
            resolved.textEditorModel.setValue('changed');
            assert.ok(input.isDirty());
            assert.ok(input.isModified());
            await input.save(0);
            assert.ok(!input.isDirty());
            assert.ok(!input.isModified());
        });
        test('revert', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            const resolved = disposables.add(await input.resolve());
            resolved.textEditorModel.setValue('changed');
            assert.ok(input.isDirty());
            assert.ok(input.isModified());
            await input.revert(0);
            assert.ok(!input.isDirty());
            assert.ok(!input.isModified());
            input.dispose();
            assert.ok(input.isDisposed());
        });
        test('resolve handles binary files', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            accessor.textFileService.setReadStreamErrorOnce(new textfiles_1.TextFileOperationError('error', 0 /* TextFileOperationResult.FILE_IS_BINARY */));
            const resolved = disposables.add(await input.resolve());
            assert.ok(resolved);
        });
        test('resolve throws for too large files', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            let e = undefined;
            accessor.textFileService.setReadStreamErrorOnce(new files_1.TooLargeFileOperationError('error', 7 /* FileOperationResult.FILE_TOO_LARGE */, 1000));
            try {
                await input.resolve();
            }
            catch (error) {
                e = error;
            }
            assert.ok(e);
        });
        test('attaches to model when created and reports dirty', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            let listenerCount = 0;
            disposables.add(input.onDidChangeDirty(() => {
                listenerCount++;
            }));
            // instead of going through file input resolve method
            // we resolve the model directly through the service
            const model = disposables.add(await accessor.textFileService.files.resolve(input.resource));
            model.textEditorModel?.setValue('hello world');
            assert.strictEqual(listenerCount, 1);
            assert.ok(input.isDirty());
        });
        test('force open text/binary', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            input.setForceOpenAsBinary();
            let resolved = disposables.add(await input.resolve());
            assert.ok(resolved instanceof binaryEditorModel_1.BinaryEditorModel);
            input.setForceOpenAsText();
            resolved = disposables.add(await input.resolve());
            assert.ok(resolved instanceof textFileEditorModel_1.TextFileEditorModel);
        });
        test('file editor serializer', async function () {
            instantiationService.invokeFunction(accessor => platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).start(accessor));
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            disposables.add(platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer('workbench.editors.files.fileEditorInput', fileEditorHandler_1.FileEditorInputSerializer));
            const editorSerializer = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).getEditorSerializer(input.typeId);
            if (!editorSerializer) {
                assert.fail('File Editor Input Serializer missing');
            }
            assert.strictEqual(editorSerializer.canSerialize(input), true);
            const inputSerialized = editorSerializer.serialize(input);
            if (!inputSerialized) {
                assert.fail('Unexpected serialized file input');
            }
            const inputDeserialized = editorSerializer.deserialize(instantiationService, inputSerialized);
            assert.strictEqual(inputDeserialized ? input.matches(inputDeserialized) : false, true);
            const preferredResource = utils_1.toResource.call(this, '/foo/bar/UPDATEfile.js');
            const inputWithPreferredResource = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'), preferredResource);
            const inputWithPreferredResourceSerialized = editorSerializer.serialize(inputWithPreferredResource);
            if (!inputWithPreferredResourceSerialized) {
                assert.fail('Unexpected serialized file input');
            }
            const inputWithPreferredResourceDeserialized = editorSerializer.deserialize(instantiationService, inputWithPreferredResourceSerialized);
            assert.strictEqual(inputWithPreferredResource.resource.toString(), inputWithPreferredResourceDeserialized.resource.toString());
            assert.strictEqual(inputWithPreferredResource.preferredResource.toString(), inputWithPreferredResourceDeserialized.preferredResource.toString());
        });
        test('preferred name/description', async function () {
            // Works with custom file input
            const customFileInput = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js').with({ scheme: 'test-custom' }), undefined, undefined, 'My Name', 'My Description');
            let didChangeLabelCounter = 0;
            disposables.add(customFileInput.onDidChangeLabel(() => {
                didChangeLabelCounter++;
            }));
            assert.strictEqual(customFileInput.getName(), 'My Name');
            assert.strictEqual(customFileInput.getDescription(), 'My Description');
            customFileInput.setPreferredName('My Name 2');
            customFileInput.setPreferredDescription('My Description 2');
            assert.strictEqual(customFileInput.getName(), 'My Name 2');
            assert.strictEqual(customFileInput.getDescription(), 'My Description 2');
            assert.strictEqual(didChangeLabelCounter, 2);
            customFileInput.dispose();
            // Disallowed with local file input
            const fileInput = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'), undefined, undefined, 'My Name', 'My Description');
            didChangeLabelCounter = 0;
            disposables.add(fileInput.onDidChangeLabel(() => {
                didChangeLabelCounter++;
            }));
            assert.notStrictEqual(fileInput.getName(), 'My Name');
            assert.notStrictEqual(fileInput.getDescription(), 'My Description');
            fileInput.setPreferredName('My Name 2');
            fileInput.setPreferredDescription('My Description 2');
            assert.notStrictEqual(fileInput.getName(), 'My Name 2');
            assert.notStrictEqual(fileInput.getDescription(), 'My Description 2');
            assert.strictEqual(didChangeLabelCounter, 0);
        });
        test('reports readonly changes', async function () {
            const input = createFileInput(utils_1.toResource.call(this, '/foo/bar/updatefile.js'));
            let listenerCount = 0;
            disposables.add(input.onDidChangeCapabilities(() => {
                listenerCount++;
            }));
            const model = disposables.add(await accessor.textFileService.files.resolve(input.resource));
            assert.strictEqual(model.isReadonly(), false);
            assert.strictEqual(input.hasCapability(2 /* EditorInputCapabilities.Readonly */), false);
            assert.strictEqual(input.isReadonly(), false);
            const stat = await accessor.fileService.resolve(input.resource, { resolveMetadata: true });
            try {
                accessor.fileService.readShouldThrowError = new files_1.NotModifiedSinceFileOperationError('file not modified since', { ...stat, readonly: true });
                await input.resolve();
            }
            finally {
                accessor.fileService.readShouldThrowError = undefined;
            }
            assert.strictEqual(!!model.isReadonly(), true);
            assert.strictEqual(input.hasCapability(2 /* EditorInputCapabilities.Readonly */), true);
            assert.strictEqual(!!input.isReadonly(), true);
            assert.strictEqual(listenerCount, 1);
            try {
                accessor.fileService.readShouldThrowError = new files_1.NotModifiedSinceFileOperationError('file not modified since', { ...stat, readonly: false });
                await input.resolve();
            }
            finally {
                accessor.fileService.readShouldThrowError = undefined;
            }
            assert.strictEqual(model.isReadonly(), false);
            assert.strictEqual(input.hasCapability(2 /* EditorInputCapabilities.Readonly */), false);
            assert.strictEqual(input.isReadonly(), false);
            assert.strictEqual(listenerCount, 2);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUVkaXRvcklucHV0LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL3Rlc3QvYnJvd3Nlci9maWxlRWRpdG9ySW5wdXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXNCaEcsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtRQUVyQyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLG9CQUEyQyxDQUFDO1FBQ2hELElBQUksUUFBNkIsQ0FBQztRQUVsQyxTQUFTLGVBQWUsQ0FBQyxRQUFhLEVBQUUsaUJBQXVCLEVBQUUsbUJBQTRCLEVBQUUsYUFBc0IsRUFBRSxvQkFBNkIsRUFBRSxpQkFBMEI7WUFDL0ssT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpQ0FBZSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztRQUNuTSxDQUFDO1FBRUQsTUFBTSxxQkFBc0IsU0FBUSxxQ0FBaUI7WUFDM0MsZ0JBQWdCLENBQUMsS0FBMkI7Z0JBQ3BELE9BQU8sZUFBZSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4QyxDQUFDO1lBRVEsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEtBQTJCO2dCQUMzRCxPQUFPLGVBQWUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEMsQ0FBQztTQUNEO1FBRUQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLG9CQUFvQixHQUFHLElBQUEscURBQTZCLEVBQUM7Z0JBQ3BELGlCQUFpQixFQUFFLG9CQUFv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