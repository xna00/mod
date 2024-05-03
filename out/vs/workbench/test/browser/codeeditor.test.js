/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/languageService", "vs/workbench/browser/codeeditor", "vs/editor/test/browser/testCodeEditor", "vs/editor/common/core/range", "vs/editor/common/core/position", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/common/services/modelService", "vs/editor/browser/coreCommands", "vs/workbench/services/editor/common/editorService", "vs/editor/test/common/testTextModel", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, workbenchTestServices_1, model_1, language_1, languageService_1, codeeditor_1, testCodeEditor_1, range_1, position_1, configuration_1, testConfigurationService_1, modelService_1, coreCommands_1, editorService_1, testTextModel_1, themeService_1, testThemeService_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor - Range decorations', () => {
        let disposables;
        let instantiationService;
        let codeEditor;
        let model;
        let text;
        let testObject;
        const modelsToDispose = [];
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            instantiationService.stub(editorService_1.IEditorService, new workbenchTestServices_1.TestEditorService());
            instantiationService.stub(language_1.ILanguageService, languageService_1.LanguageService);
            instantiationService.stub(model_1.IModelService, stubModelService(instantiationService));
            text = 'LINE1' + '\n' + 'LINE2' + '\n' + 'LINE3' + '\n' + 'LINE4' + '\r\n' + 'LINE5';
            model = disposables.add(aModel(uri_1.URI.file('some_file')));
            codeEditor = disposables.add((0, testCodeEditor_1.createTestCodeEditor)(model));
            instantiationService.stub(editorService_1.IEditorService, 'activeEditor', { get resource() { return codeEditor.getModel().uri; } });
            instantiationService.stub(editorService_1.IEditorService, 'activeTextEditorControl', codeEditor);
            testObject = disposables.add(instantiationService.createInstance(codeeditor_1.RangeHighlightDecorations));
        });
        teardown(() => {
            codeEditor.dispose();
            modelsToDispose.forEach(model => model.dispose());
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('highlight range for the resource if it is an active editor', function () {
            const range = new range_1.Range(1, 1, 1, 1);
            testObject.highlightRange({ resource: model.uri, range });
            const actuals = rangeHighlightDecorations(model);
            assert.deepStrictEqual(actuals, [range]);
        });
        test('remove highlight range', function () {
            testObject.highlightRange({ resource: model.uri, range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 } });
            testObject.removeHighlightRange();
            const actuals = rangeHighlightDecorations(model);
            assert.deepStrictEqual(actuals, []);
        });
        test('highlight range for the resource removes previous highlight', function () {
            testObject.highlightRange({ resource: model.uri, range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 } });
            const range = new range_1.Range(2, 2, 4, 3);
            testObject.highlightRange({ resource: model.uri, range });
            const actuals = rangeHighlightDecorations(model);
            assert.deepStrictEqual(actuals, [range]);
        });
        test('highlight range for a new resource removes highlight of previous resource', function () {
            testObject.highlightRange({ resource: model.uri, range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 } });
            const anotherModel = prepareActiveEditor('anotherModel');
            const range = new range_1.Range(2, 2, 4, 3);
            testObject.highlightRange({ resource: anotherModel.uri, range });
            let actuals = rangeHighlightDecorations(model);
            assert.deepStrictEqual(actuals, []);
            actuals = rangeHighlightDecorations(anotherModel);
            assert.deepStrictEqual(actuals, [range]);
        });
        test('highlight is removed on model change', function () {
            testObject.highlightRange({ resource: model.uri, range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 } });
            prepareActiveEditor('anotherModel');
            const actuals = rangeHighlightDecorations(model);
            assert.deepStrictEqual(actuals, []);
        });
        test('highlight is removed on cursor position change', function () {
            testObject.highlightRange({ resource: model.uri, range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 } });
            codeEditor.trigger('mouse', coreCommands_1.CoreNavigationCommands.MoveTo.id, {
                position: new position_1.Position(2, 1)
            });
            const actuals = rangeHighlightDecorations(model);
            assert.deepStrictEqual(actuals, []);
        });
        test('range is not highlight if not active editor', function () {
            const model = aModel(uri_1.URI.file('some model'));
            testObject.highlightRange({ resource: model.uri, range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 } });
            const actuals = rangeHighlightDecorations(model);
            assert.deepStrictEqual(actuals, []);
        });
        test('previous highlight is not removed if not active editor', function () {
            const range = new range_1.Range(1, 1, 1, 1);
            testObject.highlightRange({ resource: model.uri, range });
            const model1 = aModel(uri_1.URI.file('some model'));
            testObject.highlightRange({ resource: model1.uri, range: { startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 1 } });
            const actuals = rangeHighlightDecorations(model);
            assert.deepStrictEqual(actuals, [range]);
        });
        function prepareActiveEditor(resource) {
            const model = aModel(uri_1.URI.file(resource));
            codeEditor.setModel(model);
            return model;
        }
        function aModel(resource, content = text) {
            const model = (0, testTextModel_1.createTextModel)(content, undefined, undefined, resource);
            modelsToDispose.push(model);
            return model;
        }
        function rangeHighlightDecorations(m) {
            const rangeHighlights = [];
            for (const dec of m.getAllDecorations()) {
                if (dec.options.className === 'rangeHighlight') {
                    rangeHighlights.push(dec.range);
                }
            }
            rangeHighlights.sort(range_1.Range.compareRangesUsingStarts);
            return rangeHighlights;
        }
        function stubModelService(instantiationService) {
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
            return instantiationService.createInstance(modelService_1.ModelService);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZWVkaXRvci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9icm93c2VyL2NvZGVlZGl0b3IudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTBCaEcsS0FBSyxDQUFDLDRCQUE0QixFQUFFLEdBQUcsRUFBRTtRQUV4QyxJQUFJLFdBQTRCLENBQUM7UUFDakMsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLFVBQXVCLENBQUM7UUFDNUIsSUFBSSxLQUFnQixDQUFDO1FBQ3JCLElBQUksSUFBWSxDQUFDO1FBQ2pCLElBQUksVUFBcUMsQ0FBQztRQUMxQyxNQUFNLGVBQWUsR0FBZ0IsRUFBRSxDQUFDO1FBRXhDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDcEMsb0JBQW9CLEdBQTZCLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3ZHLG9CQUFvQixDQUFDLElBQUksQ0FBQyw4QkFBYyxFQUFFLElBQUkseUNBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLG9CQUFvQixDQUFDLElBQUksQ0FBQywyQkFBZ0IsRUFBRSxpQ0FBZSxDQUFDLENBQUM7WUFDN0Qsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHFCQUFhLEVBQUUsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLElBQUksR0FBRyxPQUFPLEdBQUcsSUFBSSxHQUFHLE9BQU8sR0FBRyxJQUFJLEdBQUcsT0FBTyxHQUFHLElBQUksR0FBRyxPQUFPLEdBQUcsTUFBTSxHQUFHLE9BQU8sQ0FBQztZQUNyRixLQUFLLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBRyxDQUFDLElBQUks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