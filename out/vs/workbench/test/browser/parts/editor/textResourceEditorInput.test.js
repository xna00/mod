/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/languages/modesRegistry", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, textResourceEditorInput_1, workbenchTestServices_1, textfiles_1, modesRegistry_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextResourceEditorInput', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
        });
        teardown(() => {
            disposables.clear();
        });
        test('basics', async () => {
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID), resource);
            const input = disposables.add(instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, resource, 'The Name', 'The Description', undefined, undefined));
            const model = disposables.add(await input.resolve());
            assert.ok(model);
            assert.strictEqual((0, textfiles_1.snapshotToString)((model.createSnapshot())), 'function test() {}');
        });
        test('preferred language (via ctor)', async () => {
            const registration = accessor.languageService.registerLanguage({
                id: 'resource-input-test',
            });
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID), resource);
            const input = disposables.add(instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, resource, 'The Name', 'The Description', 'resource-input-test', undefined));
            const model = disposables.add(await input.resolve());
            assert.ok(model);
            assert.strictEqual(model.textEditorModel?.getLanguageId(), 'resource-input-test');
            input.setLanguageId('text');
            assert.strictEqual(model.textEditorModel?.getLanguageId(), modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            disposables.add(await input.resolve());
            assert.strictEqual(model.textEditorModel?.getLanguageId(), modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            registration.dispose();
        });
        test('preferred language (via setPreferredLanguageId)', async () => {
            const registration = accessor.languageService.registerLanguage({
                id: 'resource-input-test',
            });
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID), resource);
            const input = disposables.add(instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, resource, 'The Name', 'The Description', undefined, undefined));
            input.setPreferredLanguageId('resource-input-test');
            const model = disposables.add(await input.resolve());
            assert.ok(model);
            assert.strictEqual(model.textEditorModel?.getLanguageId(), 'resource-input-test');
            registration.dispose();
        });
        test('preferred contents (via ctor)', async () => {
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID), resource);
            const input = disposables.add(instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, resource, 'The Name', 'The Description', undefined, 'My Resource Input Contents'));
            const model = disposables.add(await input.resolve());
            assert.ok(model);
            assert.strictEqual(model.textEditorModel?.getValue(), 'My Resource Input Contents');
            model.textEditorModel.setValue('Some other contents');
            assert.strictEqual(model.textEditorModel?.getValue(), 'Some other contents');
            disposables.add(await input.resolve());
            assert.strictEqual(model.textEditorModel?.getValue(), 'Some other contents'); // preferred contents only used once
        });
        test('preferred contents (via setPreferredContents)', async () => {
            const resource = uri_1.URI.from({ scheme: 'inmemory', authority: null, path: 'thePath' });
            accessor.modelService.createModel('function test() {}', accessor.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID), resource);
            const input = disposables.add(instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, resource, 'The Name', 'The Description', undefined, undefined));
            input.setPreferredContents('My Resource Input Contents');
            const model = disposables.add(await input.resolve());
            assert.ok(model);
            assert.strictEqual(model.textEditorModel?.getValue(), 'My Resource Input Contents');
            model.textEditorModel.setValue('Some other contents');
            assert.strictEqual(model.textEditorModel?.getValue(), 'Some other contents');
            disposables.add(await input.resolve());
            assert.strictEqual(model.textEditorModel?.getValue(), 'Some other contents'); // preferred contents only used once
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFJlc291cmNlRWRpdG9ySW5wdXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvdGV4dFJlc291cmNlRWRpdG9ySW5wdXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxLQUFLLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO1FBRXJDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLElBQUksb0JBQTJDLENBQUM7UUFDaEQsSUFBSSxRQUE2QixDQUFDO1FBRWxDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixvQkFBb0IsR0FBRyxJQUFBLHFEQUE2QixFQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM3RSxRQUFRLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJDQUFtQixDQUFDLENBQUM7UUFDckUsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN6QixNQUFNLFFBQVEsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsSUFBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ3JGLFFBQVEsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLFFBQVEsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLHFDQUFxQixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFOUgsTUFBTSxLQUFLLEdBQUcs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