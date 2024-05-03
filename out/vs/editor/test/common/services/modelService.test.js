/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/core/stringBuilder", "vs/editor/common/model/textModel", "vs/editor/common/services/modelService", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/test/common/testTextModel", "vs/base/common/lifecycle", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration", "vs/base/test/common/utils"], function (require, exports, assert, platform, uri_1, editOperation_1, range_1, selection_1, stringBuilder_1, textModel_1, modelService_1, testConfigurationService_1, testTextModel_1, lifecycle_1, model_1, configuration_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const GENERATE_TESTS = false;
    suite('ModelService', () => {
        let disposables;
        let modelService;
        let instantiationService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'eol': '\n' });
            configService.setUserConfiguration('files', { 'eol': '\r\n' }, uri_1.URI.file(platform.isWindows ? 'c:\\myroot' : '/myroot'));
            instantiationService = (0, testTextModel_1.createModelServices)(disposables, [
                [configuration_1.IConfigurationService, configService]
            ]);
            modelService = instantiationService.get(model_1.IModelService);
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('EOL setting respected depending on root', () => {
            const model1 = modelService.createModel('farboo', null);
            const model2 = modelService.createModel('farboo', null, uri_1.URI.file(platform.isWindows ? 'c:\\myroot\\myfile.txt' : '/myroot/myfile.txt'));
            const model3 = modelService.createModel('farboo', null, uri_1.URI.file(platform.isWindows ? 'c:\\other\\myfile.txt' : '/other/myfile.txt'));
            assert.strictEqual(model1.getOptions().defaultEOL, 1 /* DefaultEndOfLine.LF */);
            assert.strictEqual(model2.getOptions().defaultEOL, 2 /* DefaultEndOfLine.CRLF */);
            assert.strictEqual(model3.getOptions().defaultEOL, 1 /* DefaultEndOfLine.LF */);
            model1.dispose();
            model2.dispose();
            model3.dispose();
        });
        test('_computeEdits no change', function () {
            const model = disposables.add((0, testTextModel_1.createTextModel)([
                'This is line one', //16
                'and this is line number two', //27
                'it is followed by #3', //20
                'and finished with the fourth.', //29
            ].join('\n')));
            const textBuffer = createAndRegisterTextBuffer(disposables, [
                'This is line one', //16
                'and this is line number two', //27
                'it is followed by #3', //20
                'and finished with the fourth.', //29
            ].join('\n'), 1 /* DefaultEndOfLine.LF */);
            const actual = modelService_1.ModelService._computeEdits(model, textBuffer);
            assert.deepStrictEqual(actual, []);
        });
        test('_computeEdits first line changed', function () {
            const model = disposables.add((0, testTextModel_1.createTextModel)([
                'This is line one', //16
                'and this is line number two', //27
                'it is followed by #3', //20
                'and finished with the fourth.', //29
            ].join('\n')));
            const textBuffer = createAndRegisterTextBuffer(disposables, [
                'This is line One', //16
                'and this is line number two', //27
                'it is followed by #3', //20
                'and finished with the fourth.', //29
            ].join('\n'), 1 /* DefaultEndOfLine.LF */);
            const actual = modelService_1.ModelService._computeEdits(model, textBuffer);
            assert.deepStrictEqual(actual, [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(1, 1, 2, 1), 'This is line One\n')
            ]);
        });
        test('_computeEdits EOL changed', function () {
            const model = disposables.add((0, testTextModel_1.createTextModel)([
                'This is line one', //16
                'and this is line number two', //27
                'it is followed by #3', //20
                'and finished with the fourth.', //29
            ].join('\n')));
            const textBuffer = createAndRegisterTextBuffer(disposables, [
                'This is line one', //16
                'and this is line number two', //27
                'it is followed by #3', //20
                'and finished with the fourth.', //29
            ].join('\r\n'), 1 /* DefaultEndOfLine.LF */);
            const actual = modelService_1.ModelService._computeEdits(model, textBuffer);
            assert.deepStrictEqual(actual, []);
        });
        test('_computeEdits EOL and other change 1', function () {
            const model = disposables.add((0, testTextModel_1.createTextModel)([
                'This is line one', //16
                'and this is line number two', //27
                'it is followed by #3', //20
                'and finished with the fourth.', //29
            ].join('\n')));
            const textBuffer = createAndRegisterTextBuffer(disposables, [
                'This is line One', //16
                'and this is line number two', //27
                'It is followed by #3', //20
                'and finished with the fourth.', //29
            ].join('\r\n'), 1 /* DefaultEndOfLine.LF */);
            const actual = modelService_1.ModelService._computeEdits(model, textBuffer);
            assert.deepStrictEqual(actual, [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(1, 1, 4, 1), [
                    'This is line One',
                    'and this is line number two',
                    'It is followed by #3',
                    ''
                ].join('\r\n'))
            ]);
        });
        test('_computeEdits EOL and other change 2', function () {
            const model = disposables.add((0, testTextModel_1.createTextModel)([
                'package main', // 1
                'func foo() {', // 2
                '}' // 3
            ].join('\n')));
            const textBuffer = createAndRegisterTextBuffer(disposables, [
                'package main', // 1
                'func foo() {', // 2
                '}', // 3
                ''
            ].join('\r\n'), 1 /* DefaultEndOfLine.LF */);
            const actual = modelService_1.ModelService._computeEdits(model, textBuffer);
            assert.deepStrictEqual(actual, [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(3, 2, 3, 2), '\r\n')
            ]);
        });
        test('generated1', () => {
            const file1 = ['pram', 'okctibad', 'pjuwtemued', 'knnnm', 'u', ''];
            const file2 = ['tcnr', 'rxwlicro', 'vnzy', '', '', 'pjzcogzur', 'ptmxyp', 'dfyshia', 'pee', 'ygg'];
            assertComputeEdits(file1, file2);
        });
        test('generated2', () => {
            const file1 = ['', 'itls', 'hrilyhesv', ''];
            const file2 = ['vdl', '', 'tchgz', 'bhx', 'nyl'];
            assertComputeEdits(file1, file2);
        });
        test('generated3', () => {
            const file1 = ['ubrbrcv', 'wv', 'xodspybszt', 's', 'wednjxm', 'fklajt', 'fyfc', 'lvejgge', 'rtpjlodmmk', 'arivtgmjdm'];
            const file2 = ['s', 'qj', 'tu', 'ur', 'qerhjjhyvx', 't'];
            assertComputeEdits(file1, file2);
        });
        test('generated4', () => {
            const file1 = ['ig', 'kh', 'hxegci', 'smvker', 'pkdmjjdqnv', 'vgkkqqx', '', 'jrzeb'];
            const file2 = ['yk', ''];
            assertComputeEdits(file1, file2);
        });
        test('does insertions in the middle of the document', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 2',
                'line 5',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does insertions at the end of the document', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 2',
                'line 3',
                'line 4'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does insertions at the beginning of the document', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 0',
                'line 1',
                'line 2',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does replacements', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 7',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does deletions', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3'
            ];
            const file2 = [
                'line 1',
                'line 3'
            ];
            assertComputeEdits(file1, file2);
        });
        test('does insert, replace, and delete', () => {
            const file1 = [
                'line 1',
                'line 2',
                'line 3',
                'line 4',
                'line 5',
            ];
            const file2 = [
                'line 0', // insert line 0
                'line 1',
                'replace line 2', // replace line 2
                'line 3',
                // delete line 4
                'line 5',
            ];
            assertComputeEdits(file1, file2);
        });
        test('maintains undo for same resource and same content', () => {
            const resource = uri_1.URI.parse('file://test.txt');
            // create a model
            const model1 = modelService.createModel('text', null, resource);
            // make an edit
            model1.pushEditOperations(null, [{ range: new range_1.Range(1, 5, 1, 5), text: '1' }], () => [new selection_1.Selection(1, 5, 1, 5)]);
            assert.strictEqual(model1.getValue(), 'text1');
            // dispose it
            modelService.destroyModel(resource);
            // create a new model with the same content
            const model2 = modelService.createModel('text1', null, resource);
            // undo
            model2.undo();
            assert.strictEqual(model2.getValue(), 'text');
            // dispose it
            modelService.destroyModel(resource);
        });
        test('maintains version id and alternative version id for same resource and same content', () => {
            const resource = uri_1.URI.parse('file://test.txt');
            // create a model
            const model1 = modelService.createModel('text', null, resource);
            // make an edit
            model1.pushEditOperations(null, [{ range: new range_1.Range(1, 5, 1, 5), text: '1' }], () => [new selection_1.Selection(1, 5, 1, 5)]);
            assert.strictEqual(model1.getValue(), 'text1');
            const versionId = model1.getVersionId();
            const alternativeVersionId = model1.getAlternativeVersionId();
            // dispose it
            modelService.destroyModel(resource);
            // create a new model with the same content
            const model2 = modelService.createModel('text1', null, resource);
            assert.strictEqual(model2.getVersionId(), versionId);
            assert.strictEqual(model2.getAlternativeVersionId(), alternativeVersionId);
            // dispose it
            modelService.destroyModel(resource);
        });
        test('does not maintain undo for same resource and different content', () => {
            const resource = uri_1.URI.parse('file://test.txt');
            // create a model
            const model1 = modelService.createModel('text', null, resource);
            // make an edit
            model1.pushEditOperations(null, [{ range: new range_1.Range(1, 5, 1, 5), text: '1' }], () => [new selection_1.Selection(1, 5, 1, 5)]);
            assert.strictEqual(model1.getValue(), 'text1');
            // dispose it
            modelService.destroyModel(resource);
            // create a new model with the same content
            const model2 = modelService.createModel('text2', null, resource);
            // undo
            model2.undo();
            assert.strictEqual(model2.getValue(), 'text2');
            // dispose it
            modelService.destroyModel(resource);
        });
        test('setValue should clear undo stack', () => {
            const resource = uri_1.URI.parse('file://test.txt');
            const model = modelService.createModel('text', null, resource);
            model.pushEditOperations(null, [{ range: new range_1.Range(1, 5, 1, 5), text: '1' }], () => [new selection_1.Selection(1, 5, 1, 5)]);
            assert.strictEqual(model.getValue(), 'text1');
            model.setValue('text2');
            model.undo();
            assert.strictEqual(model.getValue(), 'text2');
            // dispose it
            modelService.destroyModel(resource);
        });
    });
    function assertComputeEdits(lines1, lines2) {
        const model = (0, testTextModel_1.createTextModel)(lines1.join('\n'));
        const { disposable, textBuffer } = (0, textModel_1.createTextBuffer)(lines2.join('\n'), 1 /* DefaultEndOfLine.LF */);
        // compute required edits
        // let start = Date.now();
        const edits = modelService_1.ModelService._computeEdits(model, textBuffer);
        // console.log(`took ${Date.now() - start} ms.`);
        // apply edits
        model.pushEditOperations([], edits, null);
        assert.strictEqual(model.getValue(), lines2.join('\n'));
        disposable.dispose();
        model.dispose();
    }
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function getRandomString(minLength, maxLength) {
        const length = getRandomInt(minLength, maxLength);
        const t = new stringBuilder_1.StringBuilder(length);
        for (let i = 0; i < length; i++) {
            t.appendASCIICharCode(getRandomInt(97 /* CharCode.a */, 122 /* CharCode.z */));
        }
        return t.build();
    }
    function generateFile(small) {
        const lineCount = getRandomInt(1, small ? 3 : 10000);
        const lines = [];
        for (let i = 0; i < lineCount; i++) {
            lines.push(getRandomString(0, small ? 3 : 10000));
        }
        return lines;
    }
    if (GENERATE_TESTS) {
        let number = 1;
        while (true) {
            console.log('------TEST: ' + number++);
            const file1 = generateFile(true);
            const file2 = generateFile(true);
            console.log('------TEST GENERATED');
            try {
                assertComputeEdits(file1, file2);
            }
            catch (err) {
                console.log(err);
                console.log(`
const file1 = ${JSON.stringify(file1).replace(/"/g, '\'')};
const file2 = ${JSON.stringify(file2).replace(/"/g, '\'')};
assertComputeEdits(file1, file2);
`);
                break;
            }
        }
    }
    function createAndRegisterTextBuffer(store, value, defaultEOL) {
        const { disposable, textBuffer } = (0, textModel_1.createTextBuffer)(value, defaultEOL);
        store.add(disposable);
        return textBuffer;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9zZXJ2aWNlcy9tb2RlbFNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBRTdCLEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1FBQzFCLElBQUksV0FBNEIsQ0FBQztRQUNqQyxJQUFJLFlBQTJCLENBQUM7UUFDaEMsSUFBSSxvQkFBOEMsQ0FBQztRQUVuRCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRXBDLE1BQU0sYUFBYSxHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUNyRCxhQUFhLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDN0QsYUFBYSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUV4SCxvQkFBb0IsR0FBRyxJQUFBLG1DQUFtQixFQUFDLFdBQVcsRUFBRTtnQkFDdkQsQ0FBQyxxQ0FBcUIsRUFBRSxhQUFhLENBQUM7YUFDdEMsQ0FBQyxDQUFDO1lBQ0gsWUFBWSxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxxQkFBYSxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFD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