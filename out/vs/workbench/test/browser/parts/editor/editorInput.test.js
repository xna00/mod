/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, lifecycle_1, network_1, uri_1, utils_1, editor_1, diffEditorInput_1, editorInput_1, textResourceEditorInput_1, fileEditorInput_1, mergeEditorInput_1, untitledTextEditorInput_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorInput', () => {
        let instantiationService;
        let accessor;
        const disposables = new lifecycle_1.DisposableStore();
        const testResource = uri_1.URI.from({ scheme: 'random', path: '/path' });
        const untypedResourceEditorInput = { resource: testResource, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        const untypedTextResourceEditorInput = { resource: testResource, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        const untypedResourceSideBySideEditorInput = { primary: untypedResourceEditorInput, secondary: untypedResourceEditorInput, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        const untypedUntitledResourceEditorinput = { resource: uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: '/path' }), options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        const untypedResourceDiffEditorInput = { original: untypedResourceEditorInput, modified: untypedResourceEditorInput, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        const untypedResourceMergeEditorInput = { base: untypedResourceEditorInput, input1: untypedResourceEditorInput, input2: untypedResourceEditorInput, result: untypedResourceEditorInput, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } };
        // Function to easily remove the overrides from the untyped inputs
        const stripOverrides = () => {
            if (!untypedResourceEditorInput.options ||
                !untypedTextResourceEditorInput.options ||
                !untypedUntitledResourceEditorinput.options ||
                !untypedResourceDiffEditorInput.options ||
                !untypedResourceMergeEditorInput.options) {
                throw new Error('Malformed options on untyped inputs');
            }
            // Some of the tests mutate the overrides so we want to reset them on each test
            untypedResourceEditorInput.options.override = undefined;
            untypedTextResourceEditorInput.options.override = undefined;
            untypedUntitledResourceEditorinput.options.override = undefined;
            untypedResourceDiffEditorInput.options.override = undefined;
            untypedResourceMergeEditorInput.options.override = undefined;
        };
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            if (!untypedResourceEditorInput.options ||
                !untypedTextResourceEditorInput.options ||
                !untypedUntitledResourceEditorinput.options ||
                !untypedResourceDiffEditorInput.options ||
                !untypedResourceMergeEditorInput.options) {
                throw new Error('Malformed options on untyped inputs');
            }
            // Some of the tests mutate the overrides so we want to reset them on each test
            untypedResourceEditorInput.options.override = editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
            untypedTextResourceEditorInput.options.override = editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
            untypedUntitledResourceEditorinput.options.override = editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
            untypedResourceDiffEditorInput.options.override = editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
            untypedResourceMergeEditorInput.options.override = editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
        });
        teardown(() => {
            disposables.clear();
        });
        class MyEditorInput extends editorInput_1.EditorInput {
            constructor() {
                super(...arguments);
                this.resource = undefined;
            }
            get typeId() { return 'myEditorInput'; }
            resolve() { return null; }
        }
        test('basics', () => {
            let counter = 0;
            const input = disposables.add(new MyEditorInput());
            const otherInput = disposables.add(new MyEditorInput());
            assert.ok((0, editor_1.isEditorInput)(input));
            assert.ok(!(0, editor_1.isEditorInput)(undefined));
            assert.ok(!(0, editor_1.isEditorInput)({ resource: uri_1.URI.file('/') }));
            assert.ok(!(0, editor_1.isEditorInput)({}));
            assert.ok(!(0, editor_1.isResourceEditorInput)(input));
            assert.ok(!(0, editor_1.isUntitledResourceEditorInput)(input));
            assert.ok(!(0, editor_1.isResourceDiffEditorInput)(input));
            assert.ok(!(0, editor_1.isResourceMergeEditorInput)(input));
            assert.ok(!(0, editor_1.isResourceSideBySideEditorInput)(input));
            assert(input.matches(input));
            assert(!input.matches(otherInput));
            assert(input.getName());
            disposables.add(input.onWillDispose(() => {
                assert(true);
                counter++;
            }));
            input.dispose();
            assert.strictEqual(counter, 1);
        });
        test('untyped matches', () => {
            const testInputID = 'untypedMatches';
            const testInputResource = uri_1.URI.file('/fake');
            const testInput = disposables.add(new workbenchTestServices_1.TestEditorInput(testInputResource, testInputID));
            const testUntypedInput = { resource: testInputResource, options: { override: testInputID } };
            const tetUntypedInputWrongResource = { resource: uri_1.URI.file('/incorrectFake'), options: { override: testInputID } };
            const testUntypedInputWrongId = { resource: testInputResource, options: { override: 'wrongId' } };
            const testUntypedInputWrong = { resource: uri_1.URI.file('/incorrectFake'), options: { override: 'wrongId' } };
            assert(testInput.matches(testUntypedInput));
            assert.ok(!testInput.matches(tetUntypedInputWrongResource));
            assert.ok(!testInput.matches(testUntypedInputWrongId));
            assert.ok(!testInput.matches(testUntypedInputWrong));
        });
        test('Untpyed inputs properly match TextResourceEditorInput', () => {
            const textResourceEditorInput = instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, testResource, undefined, undefined, undefined, undefined);
            assert.ok(textResourceEditorInput.matches(untypedResourceEditorInput));
            assert.ok(textResourceEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!textResourceEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!textResourceEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!textResourceEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!textResourceEditorInput.matches(untypedResourceMergeEditorInput));
            textResourceEditorInput.dispose();
        });
        test('Untyped inputs properly match FileEditorInput', () => {
            const fileEditorInput = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, testResource, undefined, undefined, undefined, undefined, undefined, undefined);
            assert.ok(fileEditorInput.matches(untypedResourceEditorInput));
            assert.ok(fileEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!fileEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!fileEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!fileEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!fileEditorInput.matches(untypedResourceMergeEditorInput));
            // Now we remove the override on the untyped to ensure that FileEditorInput supports lightweight resource matching
            stripOverrides();
            assert.ok(fileEditorInput.matches(untypedResourceEditorInput));
            assert.ok(fileEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!fileEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!fileEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!fileEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!fileEditorInput.matches(untypedResourceMergeEditorInput));
            fileEditorInput.dispose();
        });
        test('Untyped inputs properly match MergeEditorInput', () => {
            const mergeData = { uri: testResource, description: undefined, detail: undefined, title: undefined };
            const mergeEditorInput = instantiationService.createInstance(mergeEditorInput_1.MergeEditorInput, testResource, mergeData, mergeData, testResource);
            assert.ok(!mergeEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!mergeEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(mergeEditorInput.matches(untypedResourceMergeEditorInput));
            stripOverrides();
            assert.ok(!mergeEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!mergeEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!mergeEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(mergeEditorInput.matches(untypedResourceMergeEditorInput));
            mergeEditorInput.dispose();
        });
        test('Untyped inputs properly match UntitledTextEditorInput', () => {
            const untitledModel = accessor.untitledTextEditorService.create({ associatedResource: { authority: '', path: '/path', fragment: '', query: '' } });
            const untitledTextEditorInput = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, untitledModel);
            assert.ok(!untitledTextEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(untitledTextEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceMergeEditorInput));
            stripOverrides();
            assert.ok(!untitledTextEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(untitledTextEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!untitledTextEditorInput.matches(untypedResourceMergeEditorInput));
            untitledTextEditorInput.dispose();
        });
        test('Untyped inputs properly match DiffEditorInput', () => {
            const fileEditorInput1 = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, testResource, undefined, undefined, undefined, undefined, undefined, undefined);
            const fileEditorInput2 = instantiationService.createInstance(fileEditorInput_1.FileEditorInput, testResource, undefined, undefined, undefined, undefined, undefined, undefined);
            const diffEditorInput = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, undefined, undefined, fileEditorInput1, fileEditorInput2, false);
            assert.ok(!diffEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!diffEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!diffEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!diffEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(diffEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!diffEditorInput.matches(untypedResourceMergeEditorInput));
            stripOverrides();
            assert.ok(!diffEditorInput.matches(untypedResourceEditorInput));
            assert.ok(!diffEditorInput.matches(untypedTextResourceEditorInput));
            assert.ok(!diffEditorInput.matches(untypedResourceSideBySideEditorInput));
            assert.ok(!diffEditorInput.matches(untypedUntitledResourceEditorinput));
            assert.ok(diffEditorInput.matches(untypedResourceDiffEditorInput));
            assert.ok(!diffEditorInput.matches(untypedResourceMergeEditorInput));
            diffEditorInput.dispose();
            fileEditorInput1.dispose();
            fileEditorInput2.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9ySW5wdXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9ySW5wdXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsS0FBSyxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7UUFFekIsSUFBSSxvQkFBMkMsQ0FBQztRQUNoRCxJQUFJLFFBQTZCLENBQUM7UUFDbEMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsTUFBTSxZQUFZLEdBQVEsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDeEUsTUFBTSwwQkFBMEIsR0FBeUIsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxtQ0FBMEIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQzFJLE1BQU0sOEJBQThCLEdBQTZCLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsbUNBQTBCLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUNsSixNQUFNLG9DQUFvQyxHQUFtQyxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxTQUFTLEVBQUUsMEJBQTBCLEVBQUUsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLG1DQUEwQixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDbE4sTUFBTSxrQ0FBa0MsR0FBcUMsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxF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