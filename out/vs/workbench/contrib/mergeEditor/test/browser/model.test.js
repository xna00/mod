/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/types", "vs/editor/common/diff/linesDiffComputers", "vs/editor/test/common/testTextModel", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/contrib/mergeEditor/browser/model/diffComputer", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/model/mergeEditorModel", "vs/workbench/contrib/mergeEditor/browser/telemetry"], function (require, exports, assert, lifecycle_1, observable_1, types_1, linesDiffComputers_1, testTextModel_1, telemetryUtils_1, diffComputer_1, mapping_1, mergeEditorModel_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('merge editor model', () => {
        // todo: renable when failing case is found https://github.com/microsoft/vscode/pull/190444#issuecomment-1678151428
        // ensureNoDisposablesAreLeakedInTestSuite();
        test('prepend line', async () => {
            await testMergeModel({
                "languageId": "plaintext",
                "base": "line1\nline2",
                "input1": "0\nline1\nline2",
                "input2": "0\nline1\nline2",
                "result": ""
            }, model => {
                assert.deepStrictEqual(model.getProjections(), {
                    base: ['⟦⟧₀line1', 'line2'],
                    input1: ['⟦0', '⟧₀line1', 'line2'],
                    input2: ['⟦0', '⟧₀line1', 'line2'],
                    result: ['⟦⟧{unrecognized}₀'],
                });
                model.toggleConflict(0, 1);
                assert.deepStrictEqual({ result: model.getResult() }, { result: '0\nline1\nline2' });
                model.toggleConflict(0, 2);
                assert.deepStrictEqual({ result: model.getResult() }, ({ result: "0\n0\nline1\nline2" }));
            });
        });
        test('empty base', async () => {
            await testMergeModel({
                "languageId": "plaintext",
                "base": "",
                "input1": "input1",
                "input2": "input2",
                "result": ""
            }, model => {
                assert.deepStrictEqual(model.getProjections(), {
                    base: ['⟦⟧₀'],
                    input1: ['⟦input1⟧₀'],
                    input2: ['⟦input2⟧₀'],
                    result: ['⟦⟧{base}₀'],
                });
                model.toggleConflict(0, 1);
                assert.deepStrictEqual({ result: model.getResult() }, ({ result: "input1" }));
                model.toggleConflict(0, 2);
                assert.deepStrictEqual({ result: model.getResult() }, ({ result: "input2" }));
            });
        });
        test('can merge word changes', async () => {
            await testMergeModel({
                "languageId": "plaintext",
                "base": "hello",
                "input1": "hallo",
                "input2": "helloworld",
                "result": ""
            }, model => {
                assert.deepStrictEqual(model.getProjections(), {
                    base: ['⟦hello⟧₀'],
                    input1: ['⟦hallo⟧₀'],
                    input2: ['⟦helloworld⟧₀'],
                    result: ['⟦⟧{unrecognized}₀'],
                });
                model.toggleConflict(0, 1);
                model.toggleConflict(0, 2);
                assert.deepStrictEqual({ result: model.getResult() }, { result: 'halloworld' });
            });
        });
        test('can combine insertions at end of document', async () => {
            await testMergeModel({
                "languageId": "plaintext",
                "base": "Zürich\nBern\nBasel\nChur\nGenf\nThun",
                "input1": "Zürich\nBern\nChur\nDavos\nGenf\nThun\nfunction f(b:boolean) {}",
                "input2": "Zürich\nBern\nBasel (FCB)\nChur\nGenf\nThun\nfunction f(a:number) {}",
                "result": "Zürich\nBern\nBasel\nChur\nDavos\nGenf\nThun"
            }, model => {
                assert.deepStrictEqual(model.getProjections(), {
                    base: ['Zürich', 'Bern', '⟦Basel', '⟧₀Chur', '⟦⟧₁Genf', 'Thun⟦⟧₂'],
                    input1: [
                        'Zürich',
                        'Bern',
                        '⟦⟧₀Chur',
                        '⟦Davos',
                        '⟧₁Genf',
                        'Thun',
                        '⟦function f(b:boolean) {}⟧₂',
                    ],
                    input2: [
                        'Zürich',
                        'Bern',
                        '⟦Basel (FCB)',
                        '⟧₀Chur',
                        '⟦⟧₁Genf',
                        'Thun',
                        '⟦function f(a:number) {}⟧₂',
                    ],
                    result: [
                        'Zürich',
                        'Bern',
                        '⟦Basel',
                        '⟧{base}₀Chur',
                        '⟦Davos',
                        '⟧{1✓}₁Genf',
                        'Thun⟦⟧{base}₂',
                    ],
                });
                model.toggleConflict(2, 1);
                model.toggleConflict(2, 2);
                assert.deepStrictEqual({ result: model.getResult() }, {
                    result: 'Zürich\nBern\nBasel\nChur\nDavos\nGenf\nThun\nfunction f(b:boolean) {}\nfunction f(a:number) {}',
                });
            });
        });
        test('conflicts are reset', async () => {
            await testMergeModel({
                "languageId": "typescript",
                "base": "import { h } from 'vs/base/browser/dom';\nimport { Disposable, IDisposable } from 'vs/base/common/lifecycle';\nimport { CodeEditorWidget } from 'vs/editor/browser/widget/codeEditorWidget';\nimport { EditorOption } from 'vs/editor/common/config/editorOptions';\nimport { autorun, IReader, observableFromEvent, ObservableValue } from 'vs/workbench/contrib/audioCues/browser/observable';\nimport { LineRange } from 'vs/workbench/contrib/mergeEditor/browser/model/lineRange';\n",
                "input1": "import { h } from 'vs/base/browser/dom';\nimport { Disposable, IDisposable } from 'vs/base/common/lifecycle';\nimport { observableSignalFromEvent } from 'vs/base/common/observable';\nimport { CodeEditorWidget } from 'vs/editor/browser/widget/codeEditorWidget';\nimport { autorun, IReader, observableFromEvent } from 'vs/workbench/contrib/audioCues/browser/observable';\nimport { LineRange } from 'vs/workbench/contrib/mergeEditor/browser/model/lineRange';\n",
                "input2": "import { h } from 'vs/base/browser/dom';\nimport { Disposable, IDisposable } from 'vs/base/common/lifecycle';\nimport { CodeEditorWidget } from 'vs/editor/browser/widget/codeEditorWidget';\nimport { autorun, IReader, observableFromEvent, ObservableValue } from 'vs/workbench/contrib/audioCues/browser/observable';\nimport { LineRange } from 'vs/workbench/contrib/mergeEditor/browser/model/lineRange';\n",
                "result": "import { h } from 'vs/base/browser/dom';\r\nimport { Disposable, IDisposable } from 'vs/base/common/lifecycle';\r\nimport { observableSignalFromEvent } from 'vs/base/common/observable';\r\nimport { CodeEditorWidget } from 'vs/editor/browser/widget/codeEditorWidget';\r\n<<<<<<< Updated upstream\r\nimport { autorun, IReader, observableFromEvent, ObservableValue } from 'vs/workbench/contrib/audioCues/browser/observable';\r\n=======\r\nimport { autorun, IReader, observableFromEvent } from 'vs/workbench/contrib/audioCues/browser/observable';\r\n>>>>>>> Stashed changes\r\nimport { LineRange } from 'vs/workbench/contrib/mergeEditor/browser/model/lineRange';\r\n"
            }, model => {
                assert.deepStrictEqual(model.getProjections(), {
                    base: [
                        "import { h } from 'vs/base/browser/dom';",
                        "import { Disposable, IDisposable } from 'vs/base/common/lifecycle';",
                        "⟦⟧₀import { CodeEditorWidget } from 'vs/editor/browser/widget/codeEditorWidget';",
                        "⟦import { EditorOption } from 'vs/editor/common/config/editorOptions';",
                        "import { autorun, IReader, observableFromEvent, ObservableValue } from 'vs/workbench/contrib/audioCues/browser/observable';",
                        "⟧₁import { LineRange } from 'vs/workbench/contrib/mergeEditor/browser/model/lineRange';",
                        '',
                    ],
                    input1: [
                        "import { h } from 'vs/base/browser/dom';",
                        "import { Disposable, IDisposable } from 'vs/base/common/lifecycle';",
                        "⟦import { observableSignalFromEvent } from 'vs/base/common/observable';",
                        "⟧₀import { CodeEditorWidget } from 'vs/editor/browser/widget/codeEditorWidget';",
                        "⟦import { autorun, IReader, observableFromEvent } from 'vs/workbench/contrib/audioCues/browser/observable';",
                        "⟧₁import { LineRange } from 'vs/workbench/contrib/mergeEditor/browser/model/lineRange';",
                        '',
                    ],
                    input2: [
                        "import { h } from 'vs/base/browser/dom';",
                        "import { Disposable, IDisposable } from 'vs/base/common/lifecycle';",
                        "⟦⟧₀import { CodeEditorWidget } from 'vs/editor/browser/widget/codeEditorWidget';",
                        "⟦import { autorun, IReader, observableFromEvent, ObservableValue } from 'vs/workbench/contrib/audioCues/browser/observable';",
                        "⟧₁import { LineRange } from 'vs/workbench/contrib/mergeEditor/browser/model/lineRange';",
                        '',
                    ],
                    result: [
                        "import { h } from 'vs/base/browser/dom';",
                        "import { Disposable, IDisposable } from 'vs/base/common/lifecycle';",
                        "⟦import { observableSignalFromEvent } from 'vs/base/common/observable';",
                        "⟧{1✓}₀import { CodeEditorWidget } from 'vs/editor/browser/widget/codeEditorWidget';",
                        '⟦<<<<<<< Updated upstream',
                        "import { autorun, IReader, observableFromEvent, ObservableValue } from 'vs/workbench/contrib/audioCues/browser/observable';",
                        '=======',
                        "import { autorun, IReader, observableFromEvent } from 'vs/workbench/contrib/audioCues/browser/observable';",
                        '>>>>>>> Stashed changes',
                        "⟧{unrecognized}₁import { LineRange } from 'vs/workbench/contrib/mergeEditor/browser/model/lineRange';",
                        '',
                    ],
                });
            });
        });
        test('auto-solve equal edits', async () => {
            await testMergeModel({
                "languageId": "javascript",
                "base": "const { readFileSync } = require('fs');\n\nlet paths = process.argv.slice(2);\nmain(paths);\n\nfunction main(paths) {\n    // print the welcome message\n    printMessage();\n\n    let data = getLineCountInfo(paths);\n    console.log(\"Lines: \" + data.totalLineCount);\n}\n\n/**\n * Prints the welcome message\n*/\nfunction printMessage() {\n    console.log(\"Welcome To Line Counter\");\n}\n\n/**\n * @param {string[]} paths\n*/\nfunction getLineCountInfo(paths) {\n    let lineCounts = paths.map(path => ({ path, count: getLinesLength(readFileSync(path, 'utf8')) }));\n    return {\n        totalLineCount: lineCounts.reduce((acc, { count }) => acc + count, 0),\n        lineCounts,\n    };\n}\n\n/**\n * @param {string} str\n */\nfunction getLinesLength(str) {\n    return str.split('\\n').length;\n}\n",
                "input1": "const { readFileSync } = require('fs');\n\nlet paths = process.argv.slice(2);\nmain(paths);\n\nfunction main(paths) {\n    // print the welcome message\n    printMessage();\n\n    const data = getLineCountInfo(paths);\n    console.log(\"Lines: \" + data.totalLineCount);\n}\n\nfunction printMessage() {\n    console.log(\"Welcome To Line Counter\");\n}\n\n/**\n * @param {string[]} paths\n*/\nfunction getLineCountInfo(paths) {\n    let lineCounts = paths.map(path => ({ path, count: getLinesLength(readFileSync(path, 'utf8')) }));\n    return {\n        totalLineCount: lineCounts.reduce((acc, { count }) => acc + count, 0),\n        lineCounts,\n    };\n}\n\n/**\n * @param {string} str\n */\nfunction getLinesLength(str) {\n    return str.split('\\n').length;\n}\n",
                "input2": "const { readFileSync } = require('fs');\n\nlet paths = process.argv.slice(2);\nrun(paths);\n\nfunction run(paths) {\n    // print the welcome message\n    printMessage();\n\n    const data = getLineCountInfo(paths);\n    console.log(\"Lines: \" + data.totalLineCount);\n}\n\nfunction printMessage() {\n    console.log(\"Welcome To Line Counter\");\n}\n\n/**\n * @param {string[]} paths\n*/\nfunction getLineCountInfo(paths) {\n    let lineCounts = paths.map(path => ({ path, count: getLinesLength(readFileSync(path, 'utf8')) }));\n    return {\n        totalLineCount: lineCounts.reduce((acc, { count }) => acc + count, 0),\n        lineCounts,\n    };\n}\n\n/**\n * @param {string} str\n */\nfunction getLinesLength(str) {\n    return str.split('\\n').length;\n}\n",
                "result": "<<<<<<< uiae\n>>>>>>> Stashed changes",
                resetResult: true,
            }, async (model) => {
                await model.mergeModel.reset();
                assert.deepStrictEqual(model.getResult(), `const { readFileSync } = require('fs');\n\nlet paths = process.argv.slice(2);\nrun(paths);\n\nfunction run(paths) {\n    // print the welcome message\n    printMessage();\n\n    const data = getLineCountInfo(paths);\n    console.log("Lines: " + data.totalLineCount);\n}\n\nfunction printMessage() {\n    console.log("Welcome To Line Counter");\n}\n\n/**\n * @param {string[]} paths\n*/\nfunction getLineCountInfo(paths) {\n    let lineCounts = paths.map(path => ({ path, count: getLinesLength(readFileSync(path, 'utf8')) }));\n    return {\n        totalLineCount: lineCounts.reduce((acc, { count }) => acc + count, 0),\n        lineCounts,\n    };\n}\n\n/**\n * @param {string} str\n */\nfunction getLinesLength(str) {\n    return str.split('\\n').length;\n}\n`);
            });
        });
    });
    async function testMergeModel(options, fn) {
        const disposables = new lifecycle_1.DisposableStore();
        const modelInterface = disposables.add(new MergeModelInterface(options, (0, testTextModel_1.createModelServices)(disposables)));
        await modelInterface.mergeModel.onInitialized;
        await fn(modelInterface);
        disposables.dispose();
    }
    function toSmallNumbersDec(value) {
        const smallNumbers = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
        return value.toString().split('').map(c => smallNumbers[parseInt(c)]).join('');
    }
    class MergeModelInterface extends lifecycle_1.Disposable {
        constructor(options, instantiationService) {
            super();
            const input1TextModel = this._register((0, testTextModel_1.createTextModel)(options.input1, options.languageId));
            const input2TextModel = this._register((0, testTextModel_1.createTextModel)(options.input2, options.languageId));
            const baseTextModel = this._register((0, testTextModel_1.createTextModel)(options.base, options.languageId));
            const resultTextModel = this._register((0, testTextModel_1.createTextModel)(options.result, options.languageId));
            const diffComputer = {
                async computeDiff(textModel1, textModel2, reader) {
                    const result = await linesDiffComputers_1.linesDiffComputers.getLegacy().computeDiff(textModel1.getLinesContent(), textModel2.getLinesContent(), { ignoreTrimWhitespace: false, maxComputationTimeMs: 10000, computeMoves: false });
                    const changes = result.changes.map(c => new mapping_1.DetailedLineRangeMapping((0, diffComputer_1.toLineRange)(c.original), textModel1, (0, diffComputer_1.toLineRange)(c.modified), textModel2, c.innerChanges?.map(ic => (0, diffComputer_1.toRangeMapping)(ic)).filter(types_1.isDefined)));
                    return {
                        diffs: changes
                    };
                }
            };
            this.mergeModel = this._register(instantiationService.createInstance(mergeEditorModel_1.MergeEditorModel, baseTextModel, {
                textModel: input1TextModel,
                description: '',
                detail: '',
                title: '',
            }, {
                textModel: input2TextModel,
                description: '',
                detail: '',
                title: '',
            }, resultTextModel, diffComputer, {
                resetResult: options.resetResult || false
            }, new telemetry_1.MergeEditorTelemetry(telemetryUtils_1.NullTelemetryService)));
        }
        getProjections() {
            function applyRanges(textModel, ranges) {
                textModel.applyEdits(ranges.map(({ range, label }) => ({
                    range: range,
                    text: `⟦${textModel.getValueInRange(range)}⟧${label}`,
                })));
            }
            const baseRanges = this.mergeModel.modifiedBaseRanges.get();
            const baseTextModel = (0, testTextModel_1.createTextModel)(this.mergeModel.base.getValue());
            applyRanges(baseTextModel, baseRanges.map((r, idx) => ({
                range: r.baseRange.toRange(),
                label: toSmallNumbersDec(idx),
            })));
            const input1TextModel = (0, testTextModel_1.createTextModel)(this.mergeModel.input1.textModel.getValue());
            applyRanges(input1TextModel, baseRanges.map((r, idx) => ({
                range: r.input1Range.toRange(),
                label: toSmallNumbersDec(idx),
            })));
            const input2TextModel = (0, testTextModel_1.createTextModel)(this.mergeModel.input2.textModel.getValue());
            applyRanges(input2TextModel, baseRanges.map((r, idx) => ({
                range: r.input2Range.toRange(),
                label: toSmallNumbersDec(idx),
            })));
            const resultTextModel = (0, testTextModel_1.createTextModel)(this.mergeModel.resultTextModel.getValue());
            applyRanges(resultTextModel, baseRanges.map((r, idx) => ({
                range: this.mergeModel.getLineRangeInResult(r.baseRange).toRange(),
                label: `{${this.mergeModel.getState(r).get()}}${toSmallNumbersDec(idx)}`,
            })));
            const result = {
                base: baseTextModel.getValue(1 /* EndOfLinePreference.LF */).split('\n'),
                input1: input1TextModel.getValue(1 /* EndOfLinePreference.LF */).split('\n'),
                input2: input2TextModel.getValue(1 /* EndOfLinePreference.LF */).split('\n'),
                result: resultTextModel.getValue(1 /* EndOfLinePreference.LF */).split('\n'),
            };
            baseTextModel.dispose();
            input1TextModel.dispose();
            input2TextModel.dispose();
            resultTextModel.dispose();
            return result;
        }
        toggleConflict(conflictIdx, inputNumber) {
            const baseRange = this.mergeModel.modifiedBaseRanges.get()[conflictIdx];
            if (!baseRange) {
                throw new Error();
            }
            const state = this.mergeModel.getState(baseRange).get();
            (0, observable_1.transaction)(tx => {
                this.mergeModel.setState(baseRange, state.toggle(inputNumber), true, tx);
            });
        }
        getResult() {
            return this.mergeModel.resultTextModel.getValue();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvdGVzdC9icm93c2VyL21vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFpQmhHLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7UUFDaEMsbUhBQW1IO1FBQ25ILDZDQUE2QztRQUU3QyxJQUFJLENBQUMsY0FBYyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9CLE1BQU0sY0FBYyxDQUNuQjtnQkFDQyxZQUFZLEVBQUUsV0FBVztnQkFDekIsTUFBTSxFQUFFLGNBQWM7Z0JBQ3RCLFFBQVEsRUFBRSxpQkFBaUI7Z0JBQzNCLFFBQVEsRUFBRSxpQkFBaUI7Z0JBQzNCLFFBQVEsRUFBRSxFQUFFO2FBQ1osRUFDRCxLQUFLLENBQUMsRUFBRTtnQkFDUCxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsRUFBRTtvQkFDOUMsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQztvQkFDM0IsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUM7b0JBQ2xDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDO29CQUNsQyxNQUFNLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztpQkFDN0IsQ0FBQyxDQUFDO2dCQUVILEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMzQixNQUFNLENBQUMsZUFBZSxDQUNyQixFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsRUFDN0IsRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsQ0FDN0IsQ0FBQztn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