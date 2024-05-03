/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeaturesService", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/editor/common/core/textEdit", "vs/editor/contrib/inlineCompletions/test/browser/utils", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/instantiation/common/serviceCollection", "vs/editor/common/core/selection", "vs/editor/contrib/inlineCompletions/browser/singleTextEdit"], function (require, exports, assert, async_1, lifecycle_1, timeTravelScheduler_1, utils_1, range_1, languageFeatures_1, languageFeaturesService_1, inlineCompletionsController_1, textEdit_1, utils_2, testCodeEditor_1, testTextModel_1, accessibilitySignalService_1, serviceCollection_1, selection_1, singleTextEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Inline Completions', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('inlineCompletionToGhostText', () => {
            function getOutput(text, suggestion) {
                const rangeStartOffset = text.indexOf('[');
                const rangeEndOffset = text.indexOf(']') - 1;
                const cleanedText = text.replace('[', '').replace(']', '');
                const tempModel = (0, testTextModel_1.createTextModel)(cleanedText);
                const range = range_1.Range.fromPositions(tempModel.getPositionAt(rangeStartOffset), tempModel.getPositionAt(rangeEndOffset));
                const options = ['prefix', 'subword'];
                const result = {};
                for (const option of options) {
                    result[option] = (0, singleTextEdit_1.computeGhostText)(new textEdit_1.SingleTextEdit(range, suggestion), tempModel, option)?.render(cleanedText, true);
                }
                tempModel.dispose();
                if (new Set(Object.values(result)).size === 1) {
                    return Object.values(result)[0];
                }
                return result;
            }
            test('Basic', () => {
                assert.deepStrictEqual(getOutput('[foo]baz', 'foobar'), 'foo[bar]baz');
                assert.deepStrictEqual(getOutput('[aaa]aaa', 'aaaaaa'), 'aaa[aaa]aaa');
                assert.deepStrictEqual(getOutput('[foo]baz', 'boobar'), undefined);
                assert.deepStrictEqual(getOutput('[foo]foo', 'foofoo'), 'foo[foo]foo');
                assert.deepStrictEqual(getOutput('foo[]', 'bar\nhello'), 'foo[bar\nhello]');
            });
            test('Empty ghost text', () => {
                assert.deepStrictEqual(getOutput('[foo]', 'foo'), 'foo');
            });
            test('Whitespace (indentation)', () => {
                assert.deepStrictEqual(getOutput('[ foo]', 'foobar'), ' foo[bar]');
                assert.deepStrictEqual(getOutput('[\tfoo]', 'foobar'), '\tfoo[bar]');
                assert.deepStrictEqual(getOutput('[\t foo]', '\tfoobar'), '	 foo[bar]');
                assert.deepStrictEqual(getOutput('[\tfoo]', '\t\tfoobar'), { prefix: undefined, subword: '\t[\t]foo[bar]' });
                assert.deepStrictEqual(getOutput('[\t]', '\t\tfoobar'), '\t[\tfoobar]');
                assert.deepStrictEqual(getOutput('\t[]', '\t'), '\t[\t]');
                assert.deepStrictEqual(getOutput('\t[\t]', ''), '\t\t');
                assert.deepStrictEqual(getOutput('[ ]', 'return 1'), ' [return 1]');
            });
            test('Whitespace (outside of indentation)', () => {
                assert.deepStrictEqual(getOutput('bar[ foo]', 'foobar'), undefined);
                assert.deepStrictEqual(getOutput('bar[\tfoo]', 'foobar'), undefined);
            });
            test('Unsupported Case', () => {
                assert.deepStrictEqual(getOutput('fo[o\n]', 'x\nbar'), undefined);
            });
            test('New Line', () => {
                assert.deepStrictEqual(getOutput('fo[o\n]', 'o\nbar'), 'foo\n[bar]');
            });
            test('Multi Part Diffing', () => {
                assert.deepStrictEqual(getOutput('foo[()]', '(x);'), { prefix: undefined, subword: 'foo([x])[;]' });
                assert.deepStrictEqual(getOutput('[\tfoo]', '\t\tfoobar'), { prefix: undefined, subword: '\t[\t]foo[bar]' });
                assert.deepStrictEqual(getOutput('[(y ===)]', '(y === 1) { f(); }'), { prefix: undefined, subword: '(y ===[ 1])[ { f(); }]' });
                assert.deepStrictEqual(getOutput('[(y ==)]', '(y === 1) { f(); }'), { prefix: undefined, subword: '(y ==[= 1])[ { f(); }]' });
                assert.deepStrictEqual(getOutput('[(y ==)]', '(y === 1) { f(); }'), { prefix: undefined, subword: '(y ==[= 1])[ { f(); }]' });
            });
            test('Multi Part Diffing 1', () => {
                assert.deepStrictEqual(getOutput('[if () ()]', 'if (1 == f()) ()'), { prefix: undefined, subword: 'if ([1 == f()]) ()' });
            });
            test('Multi Part Diffing 2', () => {
                assert.deepStrictEqual(getOutput('[)]', '())'), ({ prefix: undefined, subword: "[(])[)]" }));
                assert.deepStrictEqual(getOutput('[))]', '(())'), ({ prefix: undefined, subword: "[((]))" }));
            });
            test('Parenthesis Matching', () => {
                assert.deepStrictEqual(getOutput('[console.log()]', 'console.log({ label: "(" })'), {
                    prefix: undefined,
                    subword: 'console.log([{ label: "(" }])'
                });
            });
        });
        test('Does not trigger automatically if disabled', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider, inlineSuggest: { enabled: false } }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('foo');
                await (0, async_1.timeout)(1000);
                // Provider is not called, no ghost text is shown.
                assert.deepStrictEqual(provider.getAndClearCallHistory(), []);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['']);
            });
        });
        test('Ghost text is shown after trigger', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('foo');
                provider.setReturnValue({ insertText: 'foobar', range: new range_1.Range(1, 1, 1, 4) });
                model.triggerExplicitly();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,4)', text: 'foo', triggerKind: 1, }
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['', 'foo[bar]']);
            });
        });
        test('Ghost text is shown automatically when configured', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider, inlineSuggest: { enabled: true } }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('foo');
                provider.setReturnValue({ insertText: 'foobar', range: new range_1.Range(1, 1, 1, 4) });
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,4)', text: 'foo', triggerKind: 0, }
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['', 'foo[bar]']);
            });
        });
        test('Ghost text is updated automatically', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                provider.setReturnValue({ insertText: 'foobar', range: new range_1.Range(1, 1, 1, 4) });
                context.keyboardType('foo');
                model.triggerExplicitly();
                await (0, async_1.timeout)(1000);
                provider.setReturnValue({ insertText: 'foobizz', range: new range_1.Range(1, 1, 1, 6) });
                context.keyboardType('b');
                context.keyboardType('i');
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,4)', text: 'foo', triggerKind: 1, },
                    { position: '(1,6)', text: 'foobi', triggerKind: 0, }
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['', 'foo[bar]', 'foob[ar]', 'foobi', 'foobi[zz]']);
            });
        });
        test('Unindent whitespace', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('  ');
                provider.setReturnValue({ insertText: 'foo', range: new range_1.Range(1, 2, 1, 3) });
                model.triggerExplicitly();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['', '  [foo]']);
                model.accept(editor);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,3)', text: '  ', triggerKind: 1, },
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), [' foo']);
            });
        });
        test('Unindent tab', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('\t\t');
                provider.setReturnValue({ insertText: 'foo', range: new range_1.Range(1, 2, 1, 3) });
                model.triggerExplicitly();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['', '\t\t[foo]']);
                model.accept(editor);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,3)', text: '\t\t', triggerKind: 1, },
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['\tfoo']);
            });
        });
        test('No unindent after indentation', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('buzz  ');
                provider.setReturnValue({ insertText: 'foo', range: new range_1.Range(1, 6, 1, 7) });
                model.triggerExplicitly();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['']);
                model.accept(editor);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,7)', text: 'buzz  ', triggerKind: 1, },
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), []);
            });
        });
        test('Next/previous', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('foo');
                provider.setReturnValue({ insertText: 'foobar1', range: new range_1.Range(1, 1, 1, 4) });
                model.trigger();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['', 'foo[bar1]']);
                provider.setReturnValues([
                    { insertText: 'foobar1', range: new range_1.Range(1, 1, 1, 4) },
                    { insertText: 'foobizz2', range: new range_1.Range(1, 1, 1, 4) },
                    { insertText: 'foobuzz3', range: new range_1.Range(1, 1, 1, 4) }
                ]);
                model.next();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['foo[bizz2]']);
                model.next();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['foo[buzz3]']);
                model.next();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['foo[bar1]']);
                model.previous();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['foo[buzz3]']);
                model.previous();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['foo[bizz2]']);
                model.previous();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['foo[bar1]']);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,4)', text: 'foo', triggerKind: 0, },
                    { position: '(1,4)', text: 'foo', triggerKind: 1, },
                ]);
            });
        });
        test('Calling the provider is debounced', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                model.trigger();
                context.keyboardType('f');
                await (0, async_1.timeout)(40);
                context.keyboardType('o');
                await (0, async_1.timeout)(40);
                context.keyboardType('o');
                await (0, async_1.timeout)(40);
                // The provider is not called
                assert.deepStrictEqual(provider.getAndClearCallHistory(), []);
                await (0, async_1.timeout)(400);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,4)', text: 'foo', triggerKind: 0, }
                ]);
                provider.assertNotCalledTwiceWithin50ms();
            });
        });
        test('Backspace is debounced', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider, inlineSuggest: { enabled: true } }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('foo');
                provider.setReturnValue({ insertText: 'foobar', range: new range_1.Range(1, 1, 1, 4) });
                await (0, async_1.timeout)(1000);
                for (let j = 0; j < 2; j++) {
                    for (let i = 0; i < 3; i++) {
                        context.leftDelete();
                        await (0, async_1.timeout)(5);
                    }
                    context.keyboardType('bar');
                }
                await (0, async_1.timeout)(400);
                provider.assertNotCalledTwiceWithin50ms();
            });
        });
        test('Forward stability', async function () {
            // The user types the text as suggested and the provider is forward-stable
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                provider.setReturnValue({ insertText: 'foobar', range: new range_1.Range(1, 1, 1, 4) });
                context.keyboardType('foo');
                model.trigger();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,4)', text: 'foo', triggerKind: 0, }
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['', 'foo[bar]']);
                provider.setReturnValue({ insertText: 'foobar', range: new range_1.Range(1, 1, 1, 5) });
                context.keyboardType('b');
                assert.deepStrictEqual(context.currentPrettyViewState, 'foob[ar]');
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,5)', text: 'foob', triggerKind: 0, }
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['foob[ar]']);
                provider.setReturnValue({ insertText: 'foobar', range: new range_1.Range(1, 1, 1, 6) });
                context.keyboardType('a');
                assert.deepStrictEqual(context.currentPrettyViewState, 'fooba[r]');
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,6)', text: 'fooba', triggerKind: 0, }
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['fooba[r]']);
            });
        });
        test('Support forward instability', async function () {
            // The user types the text as suggested and the provider reports a different suggestion.
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                provider.setReturnValue({ insertText: 'foobar', range: new range_1.Range(1, 1, 1, 4) });
                context.keyboardType('foo');
                model.triggerExplicitly();
                await (0, async_1.timeout)(100);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,4)', text: 'foo', triggerKind: 1, }
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['', 'foo[bar]']);
                provider.setReturnValue({ insertText: 'foobaz', range: new range_1.Range(1, 1, 1, 5) });
                context.keyboardType('b');
                assert.deepStrictEqual(context.currentPrettyViewState, 'foob[ar]');
                await (0, async_1.timeout)(100);
                // This behavior might change!
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,5)', text: 'foob', triggerKind: 0, }
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['foob[ar]', 'foob[az]']);
            });
        });
        test('Support backward instability', async function () {
            // The user deletes text and the suggestion changes
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('fooba');
                provider.setReturnValue({ insertText: 'foobar', range: new range_1.Range(1, 1, 1, 6) });
                model.triggerExplicitly();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,6)', text: 'fooba', triggerKind: 1, }
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), ['', 'fooba[r]']);
                provider.setReturnValue({ insertText: 'foobaz', range: new range_1.Range(1, 1, 1, 5) });
                context.leftDelete();
                await (0, async_1.timeout)(1000);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(1,5)', text: 'foob', triggerKind: 0, }
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), [
                    'foob[ar]',
                    'foob[az]'
                ]);
            });
        });
        test('No race conditions', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider, }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('h');
                provider.setReturnValue({ insertText: 'helloworld', range: new range_1.Range(1, 1, 1, 2) }, 1000);
                model.triggerExplicitly();
                await (0, async_1.timeout)(1030);
                context.keyboardType('ello');
                provider.setReturnValue({ insertText: 'helloworld', range: new range_1.Range(1, 1, 1, 6) }, 1000);
                // after 20ms: Inline completion provider answers back
                // after 50ms: Debounce is triggered
                await (0, async_1.timeout)(2000);
                assert.deepStrictEqual(context.getAndClearViewStates(), [
                    '',
                    'hello[world]',
                ]);
            });
        });
        test('Do not reuse cache from previous session (#132516)', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider, inlineSuggest: { enabled: true } }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('hello\n');
                context.cursorLeft();
                context.keyboardType('x');
                context.leftDelete();
                provider.setReturnValue({ insertText: 'helloworld', range: new range_1.Range(1, 1, 1, 6) }, 1000);
                await (0, async_1.timeout)(2000);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    {
                        position: '(1,6)',
                        text: 'hello\n',
                        triggerKind: 0,
                    }
                ]);
                provider.setReturnValue({ insertText: 'helloworld', range: new range_1.Range(2, 1, 2, 6) }, 1000);
                context.cursorDown();
                context.keyboardType('hello');
                await (0, async_1.timeout)(40);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), []);
                // Update ghost text
                context.keyboardType('w');
                context.leftDelete();
                await (0, async_1.timeout)(2000);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), [
                    { position: '(2,6)', triggerKind: 0, text: 'hello\nhello' },
                ]);
                assert.deepStrictEqual(context.getAndClearViewStates(), [
                    '',
                    'hello[world]\n',
                    'hello\n',
                    'hello\nhello[world]',
                ]);
            });
        });
        test('Additional Text Edits', async function () {
            const provider = new utils_2.MockInlineCompletionsProvider();
            await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                context.keyboardType('buzz\nbaz');
                provider.setReturnValue({
                    insertText: 'bazz',
                    range: new range_1.Range(2, 1, 2, 4),
                    additionalTextEdits: [{
                            range: new range_1.Range(1, 1, 1, 5),
                            text: 'bla'
                        }],
                });
                model.triggerExplicitly();
                await (0, async_1.timeout)(1000);
                model.accept(editor);
                assert.deepStrictEqual(provider.getAndClearCallHistory(), ([{ position: "(2,4)", triggerKind: 1, text: "buzz\nbaz" }]));
                assert.deepStrictEqual(context.getAndClearViewStates(), [
                    '',
                    'buzz\nbaz[z]',
                    'bla\nbazz',
                ]);
            });
        });
        suite('inlineCompletionMultiCursor', () => {
            test('Basic', async function () {
                const provider = new utils_2.MockInlineCompletionsProvider();
                await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                    context.keyboardType('console\nconsole\n');
                    editor.setSelections([
                        new selection_1.Selection(1, 1000, 1, 1000),
                        new selection_1.Selection(2, 1000, 2, 1000),
                    ]);
                    provider.setReturnValue({
                        insertText: 'console.log("hello");',
                        range: new range_1.Range(1, 1, 1, 1000),
                    });
                    model.triggerExplicitly();
                    await (0, async_1.timeout)(1000);
                    model.accept(editor);
                    assert.deepStrictEqual(editor.getValue(), [
                        `console.log("hello");`,
                        `console.log("hello");`,
                        ``
                    ].join('\n'));
                });
            });
            test('Multi Part', async function () {
                const provider = new utils_2.MockInlineCompletionsProvider();
                await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                    context.keyboardType('console.log()\nconsole.log\n');
                    editor.setSelections([
                        new selection_1.Selection(1, 12, 1, 12),
                        new selection_1.Selection(2, 1000, 2, 1000),
                    ]);
                    provider.setReturnValue({
                        insertText: 'console.log("hello");',
                        range: new range_1.Range(1, 1, 1, 1000),
                    });
                    model.triggerExplicitly();
                    await (0, async_1.timeout)(1000);
                    model.accept(editor);
                    assert.deepStrictEqual(editor.getValue(), [
                        `console.log("hello");`,
                        `console.log("hello");`,
                        ``
                    ].join('\n'));
                });
            });
            test('Multi Part and Different Cursor Columns', async function () {
                const provider = new utils_2.MockInlineCompletionsProvider();
                await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                    context.keyboardType('console.log()\nconsole.warn\n');
                    editor.setSelections([
                        new selection_1.Selection(1, 12, 1, 12),
                        new selection_1.Selection(2, 14, 2, 14),
                    ]);
                    provider.setReturnValue({
                        insertText: 'console.log("hello");',
                        range: new range_1.Range(1, 1, 1, 1000),
                    });
                    model.triggerExplicitly();
                    await (0, async_1.timeout)(1000);
                    model.accept(editor);
                    assert.deepStrictEqual(editor.getValue(), [
                        `console.log("hello");`,
                        `console.warn("hello");`,
                        ``
                    ].join('\n'));
                });
            });
            async function acceptNextWord(model, editor, timesToAccept = 1) {
                for (let i = 0; i < timesToAccept; i++) {
                    model.triggerExplicitly();
                    await (0, async_1.timeout)(1000);
                    await model.acceptNextWord(editor);
                }
            }
            test('Basic Partial Completion', async function () {
                const provider = new utils_2.MockInlineCompletionsProvider();
                await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                    context.keyboardType('let\nlet\n');
                    editor.setSelections([
                        new selection_1.Selection(1, 1000, 1, 1000),
                        new selection_1.Selection(2, 1000, 2, 1000),
                    ]);
                    provider.setReturnValue({
                        insertText: `let a = 'some word'; `,
                        range: new range_1.Range(1, 1, 1, 1000),
                    });
                    await acceptNextWord(model, editor, 2);
                    assert.deepStrictEqual(editor.getValue(), [
                        `let a`,
                        `let a`,
                        ``
                    ].join('\n'));
                });
            });
            test('Partial Multi-Part Completion', async function () {
                const provider = new utils_2.MockInlineCompletionsProvider();
                await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                    context.keyboardType('for ()\nfor \n');
                    editor.setSelections([
                        new selection_1.Selection(1, 5, 1, 5),
                        new selection_1.Selection(2, 1000, 2, 1000),
                    ]);
                    provider.setReturnValue({
                        insertText: `for (let i = 0; i < 10; i++) {`,
                        range: new range_1.Range(1, 1, 1, 1000),
                    });
                    model.triggerExplicitly();
                    await (0, async_1.timeout)(1000);
                    await acceptNextWord(model, editor, 3);
                    assert.deepStrictEqual(editor.getValue(), [
                        `for (let i)`,
                        `for (let i`,
                        ``
                    ].join('\n'));
                });
            });
            test('Partial Mutli-Part and Different Cursor Columns Completion', async function () {
                const provider = new utils_2.MockInlineCompletionsProvider();
                await withAsyncTestCodeEditorAndInlineCompletionsModel('', { fakeClock: true, provider }, async ({ editor, editorViewModel, model, context }) => {
                    context.keyboardType(`console.log()\nconsole.warnnnn\n`);
                    editor.setSelections([
                        new selection_1.Selection(1, 12, 1, 12),
                        new selection_1.Selection(2, 16, 2, 16),
                    ]);
                    provider.setReturnValue({
                        insertText: `console.log("hello" + " " + "world");`,
                        range: new range_1.Range(1, 1, 1, 1000),
                    });
                    model.triggerExplicitly();
                    await (0, async_1.timeout)(1000);
                    await acceptNextWord(model, editor, 4);
                    assert.deepStrictEqual(editor.getValue(), [
                        `console.log("hello" + )`,
                        `console.warnnnn("hello" + `,
                        ``
                    ].join('\n'));
                });
            });
        });
    });
    async function withAsyncTestCodeEditorAndInlineCompletionsModel(text, options, callback) {
        return await (0, timeTravelScheduler_1.runWithFakedTimers)({
            useFakeTimers: options.fakeClock,
        }, async () => {
            const disposableStore = new lifecycle_1.DisposableStore();
            try {
                if (options.provider) {
                    const languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
                    if (!options.serviceCollection) {
                        options.serviceCollection = new serviceCollection_1.ServiceCollection();
                    }
                    options.serviceCollection.set(languageFeatures_1.ILanguageFeaturesService, languageFeaturesService);
                    options.serviceCollection.set(accessibilitySignalService_1.IAccessibilitySignalService, {
                        playSignal: async () => { },
                        isSoundEnabled(signal) { return false; },
                    });
                    const d = languageFeaturesService.inlineCompletionsProvider.register({ pattern: '**' }, options.provider);
                    disposableStore.add(d);
                }
                let result;
                await (0, testCodeEditor_1.withAsyncTestCodeEditor)(text, options, async (editor, editorViewModel, instantiationService) => {
                    const controller = instantiationService.createInstance(inlineCompletionsController_1.InlineCompletionsController, editor);
                    const model = controller.model.get();
                    const context = new utils_2.GhostTextContext(model, editor);
                    try {
                        result = await callback({ editor, editorViewModel, model, context });
                    }
                    finally {
                        context.dispose();
                        model.dispose();
                        controller.dispose();
                    }
                });
                if (options.provider instanceof utils_2.MockInlineCompletionsProvider) {
                    options.provider.assertNotCalledTwiceWithin50ms();
                }
                return result;
            }
            finally {
                disposableStore.dispose();
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ29tcGxldGlvbnNQcm92aWRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVDb21wbGV0aW9ucy90ZXN0L2Jyb3dzZXIvaW5saW5lQ29tcGxldGlvbnNQcm92aWRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBdUJoRyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1FBQ2hDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1lBRXpDLFNBQVMsU0FBUyxDQUFDLElBQVksRUFBRSxVQUFrQjtnQkFDbEQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDN0MsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxTQUFTLEdBQUcsSUFBQSwrQkFBZSxFQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLEtBQUssR0FBRyxhQUFLLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RILE1BQU0sT0FBTyxHQUFHLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBVSxDQUFDO2dCQUMvQyxNQUFNLE1BQU0sR0FBRyxFQUFTLENBQUM7Z0JBQ3pCLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQzlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFBLGlDQUFnQixFQUFDLElBQUkseUJBQWMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hILENBQUM7Z0JBRUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUVwQixJQUFJLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQy9DLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakMsQ0FBQztnQkFFRCxPQUFPLE1BQU0sQ0FBQztZQUNmLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDbEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3ZFLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUM3RSxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7Z0JBQzdCLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxRCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7Z0JBQ3JDLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUNyRSxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ3hFLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBQztnQkFDN0csTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUN4RSxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzFELE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFFeEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3JFLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtnQkFDaEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEUsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO2dCQUM3QixNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDbkUsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtnQkFDckIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3RFLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQztnQkFDcEcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO2dCQUM3RyxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsb0JBQW9CLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLHdCQUF3QixFQUFFLENBQUMsQ0FBQztnQkFDL0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxDQUFDLENBQUM7Z0JBRTlILE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBQy9ILENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtnQkFDakMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUM7WUFDM0gsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO2dCQUNqQyxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0YsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO2dCQUNqQyxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSw2QkFBNkIsQ0FBQyxFQUFFO29CQUNuRixNQUFNLEVBQUUsU0FBUztvQkFDakIsT0FBTyxFQUFFLCtCQUErQjtpQkFDeEMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxLQUFLO1lBQ3ZELE1BQU0sUUFBUSxHQUFHLElBQUkscUNBQTZCLEVBQUUsQ0FBQztZQUNyRCxNQUFNLGdEQUFnRCxDQUFDLEVBQUUsRUFDeEQsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFDaEUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtnQkFDckQsT0FBTyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDNUIsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFFcEIsa0RBQWtEO2dCQUNsRCxNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvRCxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLEtBQUs7WUFDOUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQ0FBNkIsRUFBRSxDQUFDO1lBQ3JELE1BQU0sZ0RBQWdELENBQUMsRUFBRSxFQUN4RCxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQzdCLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ3JELE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzVCLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hGLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUMxQixNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVwQixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFO29CQUN6RCxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHO2lCQUNuRCxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzNFLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbURBQW1ELEVBQUUsS0FBSztZQUM5RCxNQUFNLFFBQVEsR0FBRyxJQUFJLHFDQUE2QixFQUFFLENBQUM7WUFDckQsTUFBTSxnREFBZ0QsQ0FBQyxFQUFFLEVBQ3hELEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQy9ELEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ3JELE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRTVCLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hGLE1BQU0sSUFBQSxlQUFPLEVBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRXBCLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEVBQUU7b0JBQ3pELEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUc7aUJBQ25ELENBQUMsQ0FBQztnQkFDSCxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDM0UsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxLQUFLO1lBQ2hELE1BQU0sUUFBUSxHQUFHLElBQUkscUNBQTZCLEVBQUUsQ0FBQztZQUNyRCxNQUFNLGdEQUFnRCxDQUFDLEVBQUUsRUFDeEQsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUM3QixLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO2dCQUNyRCxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRixPQUFPLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM1QixLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFFcEIsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDakYsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDMUIsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDMUIsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFFcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsRUFBRTtvQkFDekQsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRztvQkFDbkQsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRztpQkFDckQsQ0FBQyxDQUFDO2dCQUNILE1BQU0sQ0FBQyxlQUFlLENBQ3JCLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxFQUMvQixDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FDbEQsQ0FBQztZQUNILENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsS0FBSztZQUNoQyxNQUFNLFFBQVEsR0FBRyxJQUFJLHFDQUE2QixFQUFFLENBQUM7WUFDckQsTUFBTSxnREFBZ0QsQ0FBQyxFQUFFLEVBQ3hELEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFDN0IsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtnQkFDckQsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDN0UsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzFCLE1BQU0sSUFBQSxlQUFPLEVBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRXBCLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFFekUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFckIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsRUFBRTtvQkFDekQsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRztpQkFDbEQsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ25FLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFLEtBQUs7WUFDekIsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQ0FBNkIsRUFBRSxDQUFDO1lBQ3JELE1BQU0sZ0RBQWdELENBQUMsRUFBRSxFQUN4RCxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQzdCLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ3JELE9BQU8sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzdCLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzdFLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUMxQixNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVwQixNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBRTNFLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXJCLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEVBQUU7b0JBQ3pELEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUc7aUJBQ3BELENBQUMsQ0FBQztnQkFFSCxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNwRSxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtCQUErQixFQUFFLEtBQUs7WUFDMUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQ0FBNkIsRUFBRSxDQUFDO1lBQ3JELE1BQU0sZ0RBQWdELENBQUMsRUFBRSxFQUN4RCxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQzdCLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ3JELE9BQU8sQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQy9CLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzdFLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUMxQixNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVwQixNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFOUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFckIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsRUFBRTtvQkFDekQsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRztpQkFDdEQsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDN0QsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSztZQUMxQixNQUFNLFFBQVEsR0FBRyxJQUFJLHFDQUE2QixFQUFFLENBQUM7WUFDckQsTUFBTSxnREFBZ0QsQ0FBQyxFQUFFLEVBQ3hELEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFDN0IsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtnQkFDckQsT0FBTyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDNUIsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDakYsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoQixNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVwQixNQUFNLENBQUMsZUFBZSxDQUNyQixPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFDL0IsQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQ2pCLENBQUM7Z0JBRUYsUUFBUSxDQUFDLGVBQWUsQ0FBQztvQkFDeEIsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDdkQsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDeEQsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtpQkFDeEQsQ0FBQyxDQUFDO2dCQUVILEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDYixNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwQixNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFFeEUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNiLE1BQU0sSUFBQSxlQUFPLEVBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BCLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO2dCQUV4RSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBRXZFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDakIsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBRXhFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDakIsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBRXhFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDakIsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBRXZFLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEVBQUU7b0JBQ3pELEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUc7b0JBQ25ELEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUc7aUJBQ25ELENBQUMsQ0FBQztZQUNKLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsS0FBSztZQUM5QyxNQUFNLFFBQVEsR0FBRyxJQUFJLHFDQUE2QixFQUFFLENBQUM7WUFDckQsTUFBTSxnREFBZ0QsQ0FBQyxFQUFFLEVBQ3hELEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFDN0IsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtnQkFDckQsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUVoQixPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLElBQUEsZUFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNsQixPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLElBQUEsZUFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNsQixPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLElBQUEsZUFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUVsQiw2QkFBNkI7Z0JBQzdCLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRTlELE1BQU0sSUFBQSxlQUFPLEVBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ25CLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEVBQUU7b0JBQ3pELEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUc7aUJBQ25ELENBQUMsQ0FBQztnQkFFSCxRQUFRLENBQUMsOEJBQThCLEVBQUUsQ0FBQztZQUMzQyxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEtBQUs7WUFDbkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQ0FBNkIsRUFBRSxDQUFDO1lBQ3JELE1BQU0sZ0RBQWdELENBQUMsRUFBRSxFQUN4RCxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUMvRCxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO2dCQUNyRCxPQUFPLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUU1QixRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRixNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVwQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzVCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDNUIsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO3dCQUNyQixNQUFNLElBQUEsZUFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsQixDQUFDO29CQUVELE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzdCLENBQUM7Z0JBRUQsTUFBTSxJQUFBLGVBQU8sRUFBQyxHQUFHLENBQUMsQ0FBQztnQkFFbkIsUUFBUSxDQUFDLDhCQUE4QixFQUFFLENBQUM7WUFDM0MsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtQkFBbUIsRUFBRSxLQUFLO1lBQzlCLDBFQUEwRTtZQUMxRSxNQUFNLFFBQVEsR0FBRyxJQUFJLHFDQUE2QixFQUFFLENBQUM7WUFDckQsTUFBTSxnREFBZ0QsQ0FBQyxFQUFFLEVBQ3hELEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFDN0IsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtnQkFDckQsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEYsT0FBTyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDNUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoQixNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwQixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFO29CQUN6RCxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHO2lCQUNuRCxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUUxRSxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRixPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsRUFBRTtvQkFDekQsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRztpQkFDcEQsQ0FBQyxDQUFDO2dCQUNILE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUV0RSxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRixPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsRUFBRTtvQkFDekQsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRztpQkFDckQsQ0FBQyxDQUFDO2dCQUNILE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ3ZFLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkJBQTZCLEVBQUUsS0FBSztZQUN4Qyx3RkFBd0Y7WUFFeEYsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQ0FBNkIsRUFBRSxDQUFDO1lBQ3JELE1BQU0sZ0RBQWdELENBQUMsRUFBRSxFQUN4RCxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQzdCLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ3JELFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hGLE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzVCLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUMxQixNQUFNLElBQUEsZUFBTyxFQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFO29CQUN6RCxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHO2lCQUNuRCxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUUxRSxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRixPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxJQUFBLGVBQU8sRUFBQyxHQUFHLENBQUMsQ0FBQztnQkFDbkIsOEJBQThCO2dCQUM5QixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFO29CQUN6RCxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHO2lCQUNwRCxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ25GLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUUsS0FBSztZQUN6QyxtREFBbUQ7WUFDbkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQ0FBNkIsRUFBRSxDQUFDO1lBQ3JELE1BQU0sZ0RBQWdELENBQUMsRUFBRSxFQUN4RCxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQzdCLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ3JELE9BQU8sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRTlCLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRWhGLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUMxQixNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwQixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFO29CQUN6RCxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHO2lCQUNyRCxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUUxRSxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRixPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JCLE1BQU0sSUFBQSxlQUFPLEVBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BCLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEVBQUU7b0JBQ3pELEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUc7aUJBQ3BELENBQUMsQ0FBQztnQkFDSCxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxFQUFFO29CQUN2RCxVQUFVO29CQUNWLFVBQVU7aUJBQ1YsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQkFBb0IsRUFBRSxLQUFLO1lBQy9CLE1BQU0sUUFBUSxHQUFHLElBQUkscUNBQTZCLEVBQUUsQ0FBQztZQUNyRCxNQUFNLGdEQUFnRCxDQUFDLEVBQUUsRUFDeEQsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsR0FBRyxFQUM5QixLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO2dCQUNyRCxPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFMUYsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBRTFCLE1BQU0sSUFBQSxlQUFPLEVBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BCLE9BQU8sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzdCLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUUxRixzREFBc0Q7Z0JBQ3RELG9DQUFvQztnQkFDcEMsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFFcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRTtvQkFDdkQsRUFBRTtvQkFDRixjQUFjO2lCQUNkLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsb0RBQW9ELEVBQUUsS0FBSztZQUMvRCxNQUFNLFFBQVEsR0FBRyxJQUFJLHFDQUE2QixFQUFFLENBQUM7WUFDckQsTUFBTSxnREFBZ0QsQ0FBQyxFQUFFLEVBQ3hELEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQy9ELEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ3JELE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2hDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDckIsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDMUIsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDMUYsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFFcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsRUFBRTtvQkFDekQ7d0JBQ0MsUUFBUSxFQUFFLE9BQU87d0JBQ2pCLElBQUksRUFBRSxTQUFTO3dCQUNmLFdBQVcsRUFBRSxDQUFDO3FCQUNkO2lCQUNELENBQUMsQ0FBQztnQkFFSCxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFMUYsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QixNQUFNLElBQUEsZUFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUVsQixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUU5RCxvQkFBb0I7Z0JBQ3BCLE9BQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzFCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFFckIsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFFcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsRUFBRTtvQkFDekQsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRTtpQkFDM0QsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEVBQUU7b0JBQ3ZELEVBQUU7b0JBQ0YsZ0JBQWdCO29CQUNoQixTQUFTO29CQUNULHFCQUFxQjtpQkFDckIsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1QkFBdUIsRUFBRSxLQUFLO1lBQ2xDLE1BQU0sUUFBUSxHQUFHLElBQUkscUNBQTZCLEVBQUUsQ0FBQztZQUNyRCxNQUFNLGdEQUFnRCxDQUFDLEVBQUUsRUFDeEQsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUM3QixLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO2dCQUNyRCxPQUFPLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNsQyxRQUFRLENBQUMsY0FBYyxDQUFDO29CQUN2QixVQUFVLEVBQUUsTUFBTTtvQkFDbEIsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDNUIsbUJBQW1CLEVBQUUsQ0FBQzs0QkFDckIsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzs0QkFDNUIsSUFBSSxFQUFFLEtBQUs7eUJBQ1gsQ0FBQztpQkFDRixDQUFDLENBQUM7Z0JBQ0gsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzFCLE1BQU0sSUFBQSxlQUFPLEVBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRXBCLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXJCLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFeEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsRUFBRTtvQkFDdkQsRUFBRTtvQkFDRixjQUFjO29CQUNkLFdBQVc7aUJBQ1gsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7WUFFekMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLO2dCQUNsQixNQUFNLFFBQVEsR0FBRyxJQUFJLHFDQUE2QixFQUFFLENBQUM7Z0JBQ3JELE1BQU0sZ0RBQWdELENBQUMsRUFBRSxFQUN4RCxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQzdCLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7b0JBQ3JELE9BQU8sQ0FBQyxZQUFZLENBQUMsb0JBQW9CLENBQUMsQ0FBQztvQkFDM0MsTUFBTSxDQUFDLGFBQWEsQ0FBQzt3QkFDcEIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQzt3QkFDL0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztxQkFDL0IsQ0FBQyxDQUFDO29CQUNILFFBQVEsQ0FBQyxjQUFjLENBQUM7d0JBQ3ZCLFVBQVUsRUFBRSx1QkFBdUI7d0JBQ25DLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7cUJBQy9CLENBQUMsQ0FBQztvQkFDSCxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDMUIsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztvQkFDcEIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDckIsTUFBTSxDQUFDLGVBQWUsQ0FDckIsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUNqQjt3QkFDQyx1QkFBdUI7d0JBQ3ZCLHVCQUF1Qjt3QkFDdkIsRUFBRTtxQkFDRixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDWixDQUFDO2dCQUNILENBQUMsQ0FDRCxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUs7Z0JBQ3ZCLE1BQU0sUUFBUSxHQUFHLElBQUkscUNBQTZCLEVBQUUsQ0FBQztnQkFDckQsTUFBTSxnREFBZ0QsQ0FBQyxFQUFFLEVBQ3hELEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFDN0IsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDckQsT0FBTyxDQUFDLFlBQVksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO29CQUNyRCxNQUFNLENBQUMsYUFBYSxDQUFDO3dCQUNwQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO3FCQUMvQixDQUFDLENBQUM7b0JBQ0gsUUFBUSxDQUFDLGNBQWMsQ0FBQzt3QkFDdkIsVUFBVSxFQUFFLHVCQUF1Qjt3QkFDbkMsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztxQkFDL0IsQ0FBQyxDQUFDO29CQUNILEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUMxQixNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxDQUFDO29CQUNwQixLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNyQixNQUFNLENBQUMsZUFBZSxDQUNyQixNQUFNLENBQUMsUUFBUSxFQUFFLEVBQ2pCO3dCQUNDLHVCQUF1Qjt3QkFDdkIsdUJBQXVCO3dCQUN2QixFQUFFO3FCQUNGLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUNaLENBQUM7Z0JBQ0gsQ0FBQyxDQUNELENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyx5Q0FBeUMsRUFBRSxLQUFLO2dCQUNwRCxNQUFNLFFBQVEsR0FBRyxJQUFJLHFDQUE2QixFQUFFLENBQUM7Z0JBQ3JELE1BQU0sZ0RBQWdELENBQUMsRUFBRSxFQUN4RCxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQzdCLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7b0JBQ3JELE9BQU8sQ0FBQyxZQUFZLENBQUMsK0JBQStCLENBQUMsQ0FBQztvQkFDdEQsTUFBTSxDQUFDLGFBQWEsQ0FBQzt3QkFDcEIsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDM0IsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztxQkFDM0IsQ0FBQyxDQUFDO29CQUNILFFBQVEsQ0FBQyxjQUFjLENBQUM7d0JBQ3ZCLFVBQVUsRUFBRSx1QkFBdUI7d0JBQ25DLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7cUJBQy9CLENBQUMsQ0FBQztvQkFDSCxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDMUIsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztvQkFDcEIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDckIsTUFBTSxDQUFDLGVBQWUsQ0FDckIsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUNqQjt3QkFDQyx1QkFBdUI7d0JBQ3ZCLHdCQUF3Qjt3QkFDeEIsRUFBRTtxQkFDRixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDWixDQUFDO2dCQUNILENBQUMsQ0FDRCxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFSCxLQUFLLFVBQVUsY0FBYyxDQUFDLEtBQTZCLEVBQUUsTUFBdUIsRUFBRSxnQkFBd0IsQ0FBQztnQkFDOUcsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUN4QyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDMUIsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztvQkFDcEIsTUFBTSxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNwQyxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQywwQkFBMEIsRUFBRSxLQUFLO2dCQUNyQyxNQUFNLFFBQVEsR0FBRyxJQUFJLHFDQUE2QixFQUFFLENBQUM7Z0JBQ3JELE1BQU0sZ0RBQWdELENBQUMsRUFBRSxFQUN4RCxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQzdCLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7b0JBQ3JELE9BQU8sQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ25DLE1BQU0sQ0FBQyxhQUFhLENBQUM7d0JBQ3BCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7d0JBQy9CLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7cUJBQy9CLENBQUMsQ0FBQztvQkFFSCxRQUFRLENBQUMsY0FBYyxDQUFDO3dCQUN2QixVQUFVLEVBQUUsdUJBQXVCO3dCQUNuQyxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO3FCQUMvQixDQUFDLENBQUM7b0JBRUgsTUFBTSxjQUFjLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFFdkMsTUFBTSxDQUFDLGVBQWUsQ0FDckIsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUNqQjt3QkFDQyxPQUFPO3dCQUNQLE9BQU87d0JBQ1AsRUFBRTtxQkFDRixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDWixDQUFDO2dCQUNILENBQUMsQ0FDRCxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsK0JBQStCLEVBQUUsS0FBSztnQkFDMUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQ0FBNkIsRUFBRSxDQUFDO2dCQUNyRCxNQUFNLGdEQUFnRCxDQUFDLEVBQUUsRUFDeEQsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUM3QixLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO29CQUNyRCxPQUFPLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUM7b0JBQ3ZDLE1BQU0sQ0FBQyxhQUFhLENBQUM7d0JBQ3BCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQ3pCLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7cUJBQy9CLENBQUMsQ0FBQztvQkFFSCxRQUFRLENBQUMsY0FBYyxDQUFDO3dCQUN2QixVQUFVLEVBQUUsZ0NBQWdDO3dCQUM1QyxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO3FCQUMvQixDQUFDLENBQUM7b0JBRUgsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQzFCLE1BQU0sSUFBQSxlQUFPLEVBQUMsSUFBSSxDQUFDLENBQUM7b0JBRXBCLE1BQU0sY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBRXZDLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFDakI7d0JBQ0MsYUFBYTt3QkFDYixZQUFZO3dCQUNaLEVBQUU7cUJBQ0YsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQ1osQ0FBQztnQkFDSCxDQUFDLENBQ0QsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLDREQUE0RCxFQUFFLEtBQUs7Z0JBQ3ZFLE1BQU0sUUFBUSxHQUFHLElBQUkscUNBQTZCLEVBQUUsQ0FBQztnQkFDckQsTUFBTSxnREFBZ0QsQ0FBQyxFQUFFLEVBQ3hELEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFDN0IsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDckQsT0FBTyxDQUFDLFlBQVksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO29CQUN6RCxNQUFNLENBQUMsYUFBYSxDQUFDO3dCQUNwQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUMzQixJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3FCQUMzQixDQUFDLENBQUM7b0JBRUgsUUFBUSxDQUFDLGNBQWMsQ0FBQzt3QkFDdkIsVUFBVSxFQUFFLHVDQUF1Qzt3QkFDbkQsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztxQkFDL0IsQ0FBQyxDQUFDO29CQUVILEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUMxQixNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxDQUFDO29CQUVwQixNQUFNLGNBQWMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUV2QyxNQUFNLENBQUMsZUFBZSxDQUNyQixNQUFNLENBQUMsUUFBUSxFQUFFLEVBQ2pCO3dCQUNDLHlCQUF5Qjt3QkFDekIsNEJBQTRCO3dCQUM1QixFQUFFO3FCQUNGLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUNaLENBQUM7Z0JBQ0gsQ0FBQyxDQUNELENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLFVBQVUsZ0RBQWdELENBQzlELElBQVksRUFDWixPQUEyRyxFQUMzRyxRQUFpSjtRQUVqSixPQUFPLE1BQU0sSUFBQSx3Q0FBa0IsRUFBQztZQUMvQixhQUFhLEVBQUUsT0FBTyxDQUFDLFNBQVM7U0FDaEMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNiLE1BQU0sZUFBZSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTlDLElBQUksQ0FBQztnQkFDSixJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDdEIsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLGlEQUF1QixFQUFFLENBQUM7b0JBQzlELElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzt3QkFDaEMsT0FBTyxDQUFDLGlCQUFpQixHQUFHLElBQUkscUNBQWlCLEVBQUUsQ0FBQztvQkFDckQsQ0FBQztvQkFDRCxPQUFPLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLDJDQUF3QixFQUFFLHVCQUF1QixDQUFDLENBQUM7b0JBQ2pGLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsd0RBQTJCLEVBQUU7d0JBQzFELFVBQVUsRUFBRSxLQUFLLElBQUksRUFBRSxHQUFHLENBQUM7d0JBQzNCLGNBQWMsQ0FBQyxNQUFlLElBQUksT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO3FCQUMxQyxDQUFDLENBQUM7b0JBQ1YsTUFBTSxDQUFDLEdBQUcsdUJBQXVCLENBQUMseUJBQXlCLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDMUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsQ0FBQztnQkFFRCxJQUFJLE1BQVMsQ0FBQztnQkFDZCxNQUFNLElBQUEsd0NBQXVCLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxvQkFBb0IsRUFBRSxFQUFFO29CQUNwRyxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMseURBQTJCLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBQzVGLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFHLENBQUM7b0JBQ3RDLE1BQU0sT0FBTyxHQUFHLElBQUksd0JBQWdCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUNwRCxJQUFJLENBQUM7d0JBQ0osTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztvQkFDdEUsQ0FBQzs0QkFBUyxDQUFDO3dCQUNWLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDbEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNoQixVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3RCLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxPQUFPLENBQUMsUUFBUSxZQUFZLHFDQUE2QixFQUFFLENBQUM7b0JBQy9ELE9BQU8sQ0FBQyxRQUFRLENBQUMsOEJBQThCLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQztnQkFFRCxPQUFPLE1BQU8sQ0FBQztZQUNoQixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzNCLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMifQ==