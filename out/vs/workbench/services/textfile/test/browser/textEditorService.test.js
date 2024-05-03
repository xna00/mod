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
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/common/editor", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/common/editor/textResourceEditorInput", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/base/test/common/utils", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/platform/files/test/common/nullFileSystemProvider", "vs/workbench/common/editor/diffEditorInput", "vs/base/common/platform", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/textfile/common/textEditorService", "vs/editor/common/languages/language"], function (require, exports, assert, uri_1, editor_1, workbenchTestServices_1, textResourceEditorInput_1, descriptors_1, fileEditorInput_1, untitledTextEditorInput_1, utils_1, files_1, lifecycle_1, nullFileSystemProvider_1, diffEditorInput_1, platform_1, sideBySideEditorInput_1, textEditorService_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextEditorService', () => {
        const TEST_EDITOR_ID = 'MyTestEditorForEditorService';
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForEditorService';
        let FileServiceProvider = class FileServiceProvider extends lifecycle_1.Disposable {
            constructor(scheme, fileService) {
                super();
                this._register(fileService.registerProvider(scheme, new nullFileSystemProvider_1.NullFileSystemProvider()));
            }
        };
        FileServiceProvider = __decorate([
            __param(1, files_1.IFileService)
        ], FileServiceProvider);
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestEditor)(TEST_EDITOR_ID, [new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestFileEditorInput)], TEST_EDITOR_INPUT_ID));
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            disposables.add((0, workbenchTestServices_1.registerTestSideBySideEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        test('createTextEditor - basics', async function () {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const languageService = instantiationService.get(language_1.ILanguageService);
            const service = disposables.add(instantiationService.createInstance(textEditorService_1.TextEditorService));
            const languageId = 'create-input-test';
            disposables.add(languageService.registerLanguage({
                id: languageId,
            }));
            // Untyped Input (file)
            let input = disposables.add(service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html'), options: { selection: { startLineNumber: 1, startColumn: 1 } } }));
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            let contentInput = input;
            assert.strictEqual(contentInput.resource.fsPath, utils_1.toResource.call(this, '/index.html').fsPath);
            // Untyped Input (file casing)
            input = disposables.add(service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html') }));
            const inputDifferentCase = disposables.add(service.createTextEditor({ resource: utils_1.toResource.call(this, '/INDEX.html') }));
            if (!platform_1.isLinux) {
                assert.strictEqual(input, inputDifferentCase);
                assert.strictEqual(input.resource?.toString(), inputDifferentCase.resource?.toString());
            }
            else {
                assert.notStrictEqual(input, inputDifferentCase);
                assert.notStrictEqual(input.resource?.toString(), inputDifferentCase.resource?.toString());
            }
            // Typed Input
            assert.strictEqual(disposables.add(service.createTextEditor(input)), input);
            // Untyped Input (file, encoding)
            input = disposables.add(service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html'), encoding: 'utf16le', options: { selection: { startLineNumber: 1, startColumn: 1 } } }));
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            contentInput = input;
            assert.strictEqual(contentInput.getPreferredEncoding(), 'utf16le');
            // Untyped Input (file, language)
            input = disposables.add(service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html'), languageId: languageId }));
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            contentInput = input;
            assert.strictEqual(contentInput.getPreferredLanguageId(), languageId);
            let fileModel = disposables.add(await contentInput.resolve());
            assert.strictEqual(fileModel.textEditorModel?.getLanguageId(), languageId);
            // Untyped Input (file, contents)
            input = disposables.add(service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html'), contents: 'My contents' }));
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            contentInput = input;
            fileModel = disposables.add(await contentInput.resolve());
            assert.strictEqual(fileModel.textEditorModel?.getValue(), 'My contents');
            assert.strictEqual(fileModel.isDirty(), true);
            // Untyped Input (file, different language)
            input = disposables.add(service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html'), languageId: 'text' }));
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            contentInput = input;
            assert.strictEqual(contentInput.getPreferredLanguageId(), 'text');
            // Untyped Input (untitled)
            input = disposables.add(service.createTextEditor({ resource: undefined, options: { selection: { startLineNumber: 1, startColumn: 1 } } }));
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            // Untyped Input (untitled with contents)
            let untypedInput = { contents: 'Hello Untitled', options: { selection: { startLineNumber: 1, startColumn: 1 } } };
            input = disposables.add(service.createTextEditor(untypedInput));
            assert.ok((0, editor_1.isUntitledResourceEditorInput)(untypedInput));
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            let model = disposables.add(await input.resolve());
            assert.strictEqual(model.textEditorModel?.getValue(), 'Hello Untitled');
            // Untyped Input (untitled with language id)
            input = disposables.add(service.createTextEditor({ resource: undefined, languageId: languageId, options: { selection: { startLineNumber: 1, startColumn: 1 } } }));
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            model = disposables.add(await input.resolve());
            assert.strictEqual(model.getLanguageId(), languageId);
            // Untyped Input (untitled with file path)
            input = disposables.add(service.createTextEditor({ resource: uri_1.URI.file('/some/path.txt'), forceUntitled: true, options: { selection: { startLineNumber: 1, startColumn: 1 } } }));
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            assert.ok(input.hasAssociatedFilePath);
            // Untyped Input (untitled with untitled resource)
            untypedInput = { resource: uri_1.URI.parse('untitled://Untitled-1'), forceUntitled: true, options: { selection: { startLineNumber: 1, startColumn: 1 } } };
            assert.ok((0, editor_1.isUntitledResourceEditorInput)(untypedInput));
            input = disposables.add(service.createTextEditor(untypedInput));
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            assert.ok(!input.hasAssociatedFilePath);
            // Untyped input (untitled with custom resource, but forceUntitled)
            untypedInput = { resource: uri_1.URI.file('/fake'), forceUntitled: true };
            assert.ok((0, editor_1.isUntitledResourceEditorInput)(untypedInput));
            input = disposables.add(service.createTextEditor(untypedInput));
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            // Untyped Input (untitled with custom resource)
            const provider = disposables.add(instantiationService.createInstance(FileServiceProvider, 'untitled-custom'));
            input = disposables.add(service.createTextEditor({ resource: uri_1.URI.parse('untitled-custom://some/path'), forceUntitled: true, options: { selection: { startLineNumber: 1, startColumn: 1 } } }));
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            assert.ok(input.hasAssociatedFilePath);
            provider.dispose();
            // Untyped Input (resource)
            input = disposables.add(service.createTextEditor({ resource: uri_1.URI.parse('custom:resource') }));
            assert(input instanceof textResourceEditorInput_1.TextResourceEditorInput);
            // Untyped Input (diff)
            const resourceDiffInput = {
                modified: { resource: utils_1.toResource.call(this, '/modified.html') },
                original: { resource: utils_1.toResource.call(this, '/original.html') }
            };
            assert.strictEqual((0, editor_1.isResourceDiffEditorInput)(resourceDiffInput), true);
            input = disposables.add(service.createTextEditor(resourceDiffInput));
            assert(input instanceof diffEditorInput_1.DiffEditorInput);
            disposables.add(input.modified);
            disposables.add(input.original);
            assert.strictEqual(input.original.resource?.toString(), resourceDiffInput.original.resource.toString());
            assert.strictEqual(input.modified.resource?.toString(), resourceDiffInput.modified.resource.toString());
            const untypedDiffInput = input.toUntyped();
            assert.strictEqual(untypedDiffInput.original.resource?.toString(), resourceDiffInput.original.resource.toString());
            assert.strictEqual(untypedDiffInput.modified.resource?.toString(), resourceDiffInput.modified.resource.toString());
            // Untyped Input (side by side)
            const sideBySideResourceInput = {
                primary: { resource: utils_1.toResource.call(this, '/primary.html') },
                secondary: { resource: utils_1.toResource.call(this, '/secondary.html') }
            };
            assert.strictEqual((0, editor_1.isResourceSideBySideEditorInput)(sideBySideResourceInput), true);
            input = disposables.add(service.createTextEditor(sideBySideResourceInput));
            assert(input instanceof sideBySideEditorInput_1.SideBySideEditorInput);
            disposables.add(input.primary);
            disposables.add(input.secondary);
            assert.strictEqual(input.primary.resource?.toString(), sideBySideResourceInput.primary.resource.toString());
            assert.strictEqual(input.secondary.resource?.toString(), sideBySideResourceInput.secondary.resource.toString());
            const untypedSideBySideInput = input.toUntyped();
            assert.strictEqual(untypedSideBySideInput.primary.resource?.toString(), sideBySideResourceInput.primary.resource.toString());
            assert.strictEqual(untypedSideBySideInput.secondary.resource?.toString(), sideBySideResourceInput.secondary.resource.toString());
        });
        test('createTextEditor- caching', function () {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const service = disposables.add(instantiationService.createInstance(textEditorService_1.TextEditorService));
            // Cached Input (Files)
            const fileResource1 = utils_1.toResource.call(this, '/foo/bar/cache1.js');
            const fileEditorInput1 = disposables.add(service.createTextEditor({ resource: fileResource1 }));
            assert.ok(fileEditorInput1);
            const fileResource2 = utils_1.toResource.call(this, '/foo/bar/cache2.js');
            const fileEditorInput2 = disposables.add(service.createTextEditor({ resource: fileResource2 }));
            assert.ok(fileEditorInput2);
            assert.notStrictEqual(fileEditorInput1, fileEditorInput2);
            const fileEditorInput1Again = disposables.add(service.createTextEditor({ resource: fileResource1 }));
            assert.strictEqual(fileEditorInput1Again, fileEditorInput1);
            fileEditorInput1Again.dispose();
            assert.ok(fileEditorInput1.isDisposed());
            const fileEditorInput1AgainAndAgain = disposables.add(service.createTextEditor({ resource: fileResource1 }));
            assert.notStrictEqual(fileEditorInput1AgainAndAgain, fileEditorInput1);
            assert.ok(!fileEditorInput1AgainAndAgain.isDisposed());
            // Cached Input (Resource)
            const resource1 = uri_1.URI.from({ scheme: 'custom', path: '/foo/bar/cache1.js' });
            const input1 = disposables.add(service.createTextEditor({ resource: resource1 }));
            assert.ok(input1);
            const resource2 = uri_1.URI.from({ scheme: 'custom', path: '/foo/bar/cache2.js' });
            const input2 = disposables.add(service.createTextEditor({ resource: resource2 }));
            assert.ok(input2);
            assert.notStrictEqual(input1, input2);
            const input1Again = disposables.add(service.createTextEditor({ resource: resource1 }));
            assert.strictEqual(input1Again, input1);
            input1Again.dispose();
            assert.ok(input1.isDisposed());
            const input1AgainAndAgain = disposables.add(service.createTextEditor({ resource: resource1 }));
            assert.notStrictEqual(input1AgainAndAgain, input1);
            assert.ok(!input1AgainAndAgain.isDisposed());
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEVkaXRvclNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRmaWxlL3Rlc3QvYnJvd3Nlci90ZXh0RWRpdG9yU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBdUJoRyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBRS9CLE1BQU0sY0FBYyxHQUFHLDhCQUE4QixDQUFDO1FBQ3RELE1BQU0sb0JBQW9CLEdBQUcsaUNBQWlDLENBQUM7UUFFL0QsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTtZQUMzQyxZQUFZLE1BQWMsRUFBZ0IsV0FBeUI7Z0JBQ2xFLEtBQUssRUFBRSxDQUFDO2dCQUVSLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxJQUFJLCtDQUFzQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLENBQUM7U0FDRCxDQUFBO1FBTkssbUJBQW1CO1lBQ0ssV0FBQSxvQkFBWSxDQUFBO1dBRHBDLG1CQUFtQixDQU14QjtRQUVELE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsMENBQWtCLEVBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSw0QkFBYyxDQUFDLDJDQUFtQixDQUFDLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDckgsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGtEQUEwQixHQUFFLENBQUMsQ0FBQztZQUM5QyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsb0RBQTRCLEdBQUUs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