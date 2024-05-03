define(["require", "exports", "assert", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/snippet/browser/snippetParser", "vs/editor/contrib/snippet/browser/snippetSession", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/test/common/testTextModel", "vs/platform/instantiation/common/serviceCollection", "vs/platform/label/common/label", "vs/platform/workspace/common/workspace"], function (require, exports, assert, mock_1, utils_1, position_1, range_1, selection_1, languageConfigurationRegistry_1, snippetParser_1, snippetSession_1, testCodeEditor_1, testLanguageConfigurationService_1, testTextModel_1, serviceCollection_1, label_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SnippetSession', function () {
        let languageConfigurationService;
        let editor;
        let model;
        function assertSelections(editor, ...s) {
            for (const selection of editor.getSelections()) {
                const actual = s.shift();
                assert.ok(selection.equalsSelection(actual), `actual=${selection.toString()} <> expected=${actual.toString()}`);
            }
            assert.strictEqual(s.length, 0);
        }
        setup(function () {
            model = (0, testTextModel_1.createTextModel)('function foo() {\n    console.log(a);\n}');
            languageConfigurationService = new testLanguageConfigurationService_1.TestLanguageConfigurationService();
            const serviceCollection = new serviceCollection_1.ServiceCollection([label_1.ILabelService, new class extends (0, mock_1.mock)() {
                }], [languageConfigurationRegistry_1.ILanguageConfigurationService, languageConfigurationService], [workspace_1.IWorkspaceContextService, new class extends (0, mock_1.mock)() {
                    getWorkspace() {
                        return {
                            id: 'workspace-id',
                            folders: [],
                        };
                    }
                }]);
            editor = (0, testCodeEditor_1.createTestCodeEditor)(model, { serviceCollection });
            editor.setSelections([new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5)]);
            assert.strictEqual(model.getEOL(), '\n');
        });
        teardown(function () {
            model.dispose();
            editor.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('normalize whitespace', function () {
            function assertNormalized(position, input, expected) {
                const snippet = new snippetParser_1.SnippetParser().parse(input);
                snippetSession_1.SnippetSession.adjustWhitespace(model, position, true, snippet);
                assert.strictEqual(snippet.toTextmateString(), expected);
            }
            assertNormalized(new position_1.Position(1, 1), 'foo', 'foo');
            assertNormalized(new position_1.Position(1, 1), 'foo\rbar', 'foo\nbar');
            assertNormalized(new position_1.Position(1, 1), 'foo\rbar', 'foo\nbar');
            assertNormalized(new position_1.Position(2, 5), 'foo\r\tbar', 'foo\n        bar');
            assertNormalized(new position_1.Position(2, 3), 'foo\r\tbar', 'foo\n    bar');
            assertNormalized(new position_1.Position(2, 5), 'foo\r\tbar\nfoo', 'foo\n        bar\n    foo');
            //Indentation issue with choice elements that span multiple lines #46266
            assertNormalized(new position_1.Position(2, 5), 'a\nb${1|foo,\nbar|}', 'a\n    b${1|foo,\nbar|}');
        });
        test('adjust selection (overwrite[Before|After])', function () {
            let range = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 2, 1, 2), 1, 0);
            assert.ok(range.equalsRange(new range_1.Range(1, 1, 1, 2)));
            range = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 2, 1, 2), 1111, 0);
            assert.ok(range.equalsRange(new range_1.Range(1, 1, 1, 2)));
            range = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 2, 1, 2), 0, 10);
            assert.ok(range.equalsRange(new range_1.Range(1, 2, 1, 12)));
            range = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 2, 1, 2), 0, 10111);
            assert.ok(range.equalsRange(new range_1.Range(1, 2, 1, 17)));
        });
        test('text edits & selection', function () {
            const session = new snippetSession_1.SnippetSession(editor, 'foo${1:bar}foo$0', undefined, languageConfigurationService);
            session.insert();
            assert.strictEqual(editor.getModel().getValue(), 'foobarfoofunction foo() {\n    foobarfooconsole.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10), new selection_1.Selection(2, 14, 2, 14));
        });
        test('text edit with reversed selection', function () {
            const session = new snippetSession_1.SnippetSession(editor, '${1:bar}$0', undefined, languageConfigurationService);
            editor.setSelections([new selection_1.Selection(2, 5, 2, 5), new selection_1.Selection(1, 1, 1, 1)]);
            session.insert();
            assert.strictEqual(model.getValue(), 'barfunction foo() {\n    barconsole.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(2, 5, 2, 8), new selection_1.Selection(1, 1, 1, 4));
        });
        test('snippets, repeated tabstops', function () {
            const session = new snippetSession_1.SnippetSession(editor, '${1:abc}foo${1:abc}$0', undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 4), new selection_1.Selection(1, 7, 1, 10), new selection_1.Selection(2, 5, 2, 8), new selection_1.Selection(2, 11, 2, 14));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10), new selection_1.Selection(2, 14, 2, 14));
        });
        test('snippets, just text', function () {
            const session = new snippetSession_1.SnippetSession(editor, 'foobar', undefined, languageConfigurationService);
            session.insert();
            assert.strictEqual(model.getValue(), 'foobarfunction foo() {\n    foobarconsole.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(2, 11, 2, 11));
        });
        test('snippets, selections and new text with newlines', () => {
            const session = new snippetSession_1.SnippetSession(editor, 'foo\n\t${1:bar}\n$0', undefined, languageConfigurationService);
            session.insert();
            assert.strictEqual(editor.getModel().getValue(), 'foo\n    bar\nfunction foo() {\n    foo\n        bar\n    console.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(2, 5, 2, 8), new selection_1.Selection(5, 9, 5, 12));
            session.next();
            assertSelections(editor, new selection_1.Selection(3, 1, 3, 1), new selection_1.Selection(6, 5, 6, 5));
        });
        test('snippets, newline NO whitespace adjust', () => {
            editor.setSelection(new selection_1.Selection(2, 5, 2, 5));
            const session = new snippetSession_1.SnippetSession(editor, 'abc\n    foo\n        bar\n$0', { overwriteBefore: 0, overwriteAfter: 0, adjustWhitespace: false, clipboardText: undefined, overtypingCapturer: undefined }, languageConfigurationService);
            session.insert();
            assert.strictEqual(editor.getModel().getValue(), 'function foo() {\n    abc\n    foo\n        bar\nconsole.log(a);\n}');
        });
        test('snippets, selections -> next/prev', () => {
            const session = new snippetSession_1.SnippetSession(editor, 'f$1oo${2:bar}foo$0', undefined, languageConfigurationService);
            session.insert();
            // @ $2
            assertSelections(editor, new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(2, 6, 2, 6));
            // @ $1
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            // @ $2
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(2, 6, 2, 6));
            // @ $1
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            // @ $0
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10), new selection_1.Selection(2, 14, 2, 14));
        });
        test('snippets, selections & typing', function () {
            const session = new snippetSession_1.SnippetSession(editor, 'f${1:oo}_$2_$0', undefined, languageConfigurationService);
            session.insert();
            editor.trigger('test', 'type', { text: 'X' });
            session.next();
            editor.trigger('test', 'type', { text: 'bar' });
            // go back to ${2:oo} which is now just 'X'
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 2, 1, 3), new selection_1.Selection(2, 6, 2, 7));
            // go forward to $1 which is now 'bar'
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            // go to final tabstop
            session.next();
            assert.strictEqual(model.getValue(), 'fX_bar_function foo() {\n    fX_bar_console.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 8, 1, 8), new selection_1.Selection(2, 12, 2, 12));
        });
        test('snippets, insert shorter snippet into non-empty selection', function () {
            model.setValue('foo_bar_foo');
            editor.setSelections([new selection_1.Selection(1, 1, 1, 4), new selection_1.Selection(1, 9, 1, 12)]);
            new snippetSession_1.SnippetSession(editor, 'x$0', undefined, languageConfigurationService).insert();
            assert.strictEqual(model.getValue(), 'x_bar_x');
            assertSelections(editor, new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 8, 1, 8));
        });
        test('snippets, insert longer snippet into non-empty selection', function () {
            model.setValue('foo_bar_foo');
            editor.setSelections([new selection_1.Selection(1, 1, 1, 4), new selection_1.Selection(1, 9, 1, 12)]);
            new snippetSession_1.SnippetSession(editor, 'LONGER$0', undefined, languageConfigurationService).insert();
            assert.strictEqual(model.getValue(), 'LONGER_bar_LONGER');
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(1, 18, 1, 18));
        });
        test('snippets, don\'t grow final tabstop', function () {
            model.setValue('foo_zzz_foo');
            editor.setSelection(new selection_1.Selection(1, 5, 1, 8));
            const session = new snippetSession_1.SnippetSession(editor, '$1bar$0', undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 5, 1, 5));
            editor.trigger('test', 'type', { text: 'foo-' });
            session.next();
            assert.strictEqual(model.getValue(), 'foo_foo-bar_foo');
            assertSelections(editor, new selection_1.Selection(1, 12, 1, 12));
            editor.trigger('test', 'type', { text: 'XXX' });
            assert.strictEqual(model.getValue(), 'foo_foo-barXXX_foo');
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 5, 1, 9));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 15, 1, 15));
        });
        test('snippets, don\'t merge touching tabstops 1/2', function () {
            const session = new snippetSession_1.SnippetSession(editor, '$1$2$3$0', undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            session.prev();
            session.prev();
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            editor.trigger('test', 'type', { text: '111' });
            session.next();
            editor.trigger('test', 'type', { text: '222' });
            session.next();
            editor.trigger('test', 'type', { text: '333' });
            session.next();
            assert.strictEqual(model.getValue(), '111222333function foo() {\n    111222333console.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10), new selection_1.Selection(2, 14, 2, 14));
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 10), new selection_1.Selection(2, 11, 2, 14));
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(2, 8, 2, 11));
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 4), new selection_1.Selection(2, 5, 2, 8));
        });
        test('snippets, don\'t merge touching tabstops 2/2', function () {
            const session = new snippetSession_1.SnippetSession(editor, '$1$2$3$0', undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            editor.trigger('test', 'type', { text: '111' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(2, 8, 2, 8));
            editor.trigger('test', 'type', { text: '222' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(2, 11, 2, 11));
            editor.trigger('test', 'type', { text: '333' });
            session.next();
            assert.strictEqual(session.isAtLastPlaceholder, true);
        });
        test('snippets, gracefully move over final tabstop', function () {
            const session = new snippetSession_1.SnippetSession(editor, '${1}bar$0', undefined, languageConfigurationService);
            session.insert();
            assert.strictEqual(session.isAtLastPlaceholder, false);
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(2, 5, 2, 5));
            session.next();
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(2, 8, 2, 8));
            session.next();
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(2, 8, 2, 8));
        });
        test('snippets, overwriting nested placeholder', function () {
            const session = new snippetSession_1.SnippetSession(editor, 'log(${1:"$2"});$0', undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 5, 1, 7), new selection_1.Selection(2, 9, 2, 11));
            editor.trigger('test', 'type', { text: 'XXX' });
            assert.strictEqual(model.getValue(), 'log(XXX);function foo() {\n    log(XXX);console.log(a);\n}');
            session.next();
            assert.strictEqual(session.isAtLastPlaceholder, false);
            // assertSelections(editor, new Selection(1, 7, 1, 7), new Selection(2, 11, 2, 11));
            session.next();
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10), new selection_1.Selection(2, 14, 2, 14));
        });
        test('snippets, selections and snippet ranges', function () {
            const session = new snippetSession_1.SnippetSession(editor, '${1:foo}farboo${2:bar}$0', undefined, languageConfigurationService);
            session.insert();
            assert.strictEqual(model.getValue(), 'foofarboobarfunction foo() {\n    foofarboobarconsole.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 4), new selection_1.Selection(2, 5, 2, 8));
            assert.strictEqual(session.isSelectionWithinPlaceholders(), true);
            editor.setSelections([new selection_1.Selection(1, 1, 1, 1)]);
            assert.strictEqual(session.isSelectionWithinPlaceholders(), false);
            editor.setSelections([new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(2, 10, 2, 10)]);
            assert.strictEqual(session.isSelectionWithinPlaceholders(), false); // in snippet, outside placeholder
            editor.setSelections([new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(2, 10, 2, 10), new selection_1.Selection(1, 1, 1, 1)]);
            assert.strictEqual(session.isSelectionWithinPlaceholders(), false); // in snippet, outside placeholder
            editor.setSelections([new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(2, 10, 2, 10), new selection_1.Selection(2, 20, 2, 21)]);
            assert.strictEqual(session.isSelectionWithinPlaceholders(), false);
            // reset selection to placeholder
            session.next();
            assert.strictEqual(session.isSelectionWithinPlaceholders(), true);
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 13), new selection_1.Selection(2, 14, 2, 17));
            // reset selection to placeholder
            session.next();
            assert.strictEqual(session.isSelectionWithinPlaceholders(), true);
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 13, 1, 13), new selection_1.Selection(2, 17, 2, 17));
        });
        test('snippets, nested sessions', function () {
            model.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const first = new snippetSession_1.SnippetSession(editor, 'foo${2:bar}foo$0', undefined, languageConfigurationService);
            first.insert();
            assert.strictEqual(model.getValue(), 'foobarfoo');
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 7));
            const second = new snippetSession_1.SnippetSession(editor, 'ba${1:zzzz}$0', undefined, languageConfigurationService);
            second.insert();
            assert.strictEqual(model.getValue(), 'foobazzzzfoo');
            assertSelections(editor, new selection_1.Selection(1, 6, 1, 10));
            second.next();
            assert.strictEqual(second.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 10, 1, 10));
            first.next();
            assert.strictEqual(first.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 13, 1, 13));
        });
        test('snippets, typing at final tabstop', function () {
            const session = new snippetSession_1.SnippetSession(editor, 'farboo$0', undefined, languageConfigurationService);
            session.insert();
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assert.strictEqual(session.isSelectionWithinPlaceholders(), false);
            editor.trigger('test', 'type', { text: 'XXX' });
            assert.strictEqual(session.isSelectionWithinPlaceholders(), false);
        });
        test('snippets, typing at beginning', function () {
            editor.setSelection(new selection_1.Selection(1, 2, 1, 2));
            const session = new snippetSession_1.SnippetSession(editor, 'farboo$0', undefined, languageConfigurationService);
            session.insert();
            editor.setSelection(new selection_1.Selection(1, 2, 1, 2));
            assert.strictEqual(session.isSelectionWithinPlaceholders(), false);
            assert.strictEqual(session.isAtLastPlaceholder, true);
            editor.trigger('test', 'type', { text: 'XXX' });
            assert.strictEqual(model.getLineContent(1), 'fXXXfarboounction foo() {');
            assert.strictEqual(session.isSelectionWithinPlaceholders(), false);
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 11, 1, 11));
        });
        test('snippets, typing with nested placeholder', function () {
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, 'This ${1:is ${2:nested}}.$0', undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 6, 1, 15));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 9, 1, 15));
            editor.trigger('test', 'cut', {});
            assertSelections(editor, new selection_1.Selection(1, 9, 1, 9));
            editor.trigger('test', 'type', { text: 'XXX' });
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 6, 1, 12));
        });
        test('snippets, snippet with variables', function () {
            const session = new snippetSession_1.SnippetSession(editor, '@line=$TM_LINE_NUMBER$0', undefined, languageConfigurationService);
            session.insert();
            assert.strictEqual(model.getValue(), '@line=1function foo() {\n    @line=2console.log(a);\n}');
            assertSelections(editor, new selection_1.Selection(1, 8, 1, 8), new selection_1.Selection(2, 12, 2, 12));
        });
        test('snippets, merge', function () {
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, 'This ${1:is ${2:nested}}.$0', undefined, languageConfigurationService);
            session.insert();
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 9, 1, 15));
            session.merge('really ${1:nested}$0');
            assertSelections(editor, new selection_1.Selection(1, 16, 1, 22));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 22, 1, 22));
            assert.strictEqual(session.isAtLastPlaceholder, false);
            session.next();
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 23, 1, 23));
            session.prev();
            editor.trigger('test', 'type', { text: 'AAA' });
            // back to `really ${1:nested}`
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 16, 1, 22));
            // back to `${1:is ...}` which now grew
            session.prev();
            assertSelections(editor, new selection_1.Selection(1, 6, 1, 25));
        });
        test('snippets, transform', function () {
            editor.getModel().setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, '${1/foo/bar/}$0', undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1));
            editor.trigger('test', 'type', { text: 'foo' });
            session.next();
            assert.strictEqual(model.getValue(), 'bar');
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 4, 1, 4));
        });
        test('snippets, multi placeholder same index one transform', function () {
            editor.getModel().setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, '$1 baz ${1/foo/bar/}$0', undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(1, 6, 1, 6));
            editor.trigger('test', 'type', { text: 'foo' });
            session.next();
            assert.strictEqual(model.getValue(), 'foo baz bar');
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 12, 1, 12));
        });
        test('snippets, transform example', function () {
            editor.getModel().setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, '${1:name} : ${2:type}${3/\\s:=(.*)/${1:+ :=}${1}/};\n$0', undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 5));
            editor.trigger('test', 'type', { text: 'clk' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 11));
            editor.trigger('test', 'type', { text: 'std_logic' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 16, 1, 16));
            session.next();
            assert.strictEqual(model.getValue(), 'clk : std_logic;\n');
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(2, 1, 2, 1));
        });
        test('snippets, transform with indent', function () {
            const snippet = [
                'private readonly ${1} = new Emitter<$2>();',
                'readonly ${1/^_(.*)/$1/}: Event<$2> = this.$1.event;',
                '$0'
            ].join('\n');
            const expected = [
                '{',
                '\tprivate readonly _prop = new Emitter<string>();',
                '\treadonly prop: Event<string> = this._prop.event;',
                '\t',
                '}'
            ].join('\n');
            const base = [
                '{',
                '\t',
                '}'
            ].join('\n');
            editor.getModel().setValue(base);
            editor.getModel().updateOptions({ insertSpaces: false });
            editor.setSelection(new selection_1.Selection(2, 2, 2, 2));
            const session = new snippetSession_1.SnippetSession(editor, snippet, undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(2, 19, 2, 19), new selection_1.Selection(3, 11, 3, 11), new selection_1.Selection(3, 28, 3, 28));
            editor.trigger('test', 'type', { text: '_prop' });
            session.next();
            assertSelections(editor, new selection_1.Selection(2, 39, 2, 39), new selection_1.Selection(3, 23, 3, 23));
            editor.trigger('test', 'type', { text: 'string' });
            session.next();
            assert.strictEqual(model.getValue(), expected);
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(4, 2, 4, 2));
        });
        test('snippets, transform example hit if', function () {
            editor.getModel().setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, '${1:name} : ${2:type}${3/\\s:=(.*)/${1:+ :=}${1}/};\n$0', undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 5));
            editor.trigger('test', 'type', { text: 'clk' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 7, 1, 11));
            editor.trigger('test', 'type', { text: 'std_logic' });
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 16, 1, 16));
            editor.trigger('test', 'type', { text: ' := \'1\'' });
            session.next();
            assert.strictEqual(model.getValue(), 'clk : std_logic := \'1\';\n');
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(2, 1, 2, 1));
        });
        test('Snippet tab stop selection issue #96545, snippets, transform adjacent to previous placeholder', function () {
            editor.getModel().setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, '${1:{}${2:fff}${1/{/}/}', undefined, languageConfigurationService);
            session.insert();
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 2), new selection_1.Selection(1, 5, 1, 6));
            session.next();
            assert.strictEqual(model.getValue(), '{fff}');
            assertSelections(editor, new selection_1.Selection(1, 2, 1, 5));
            editor.trigger('test', 'type', { text: 'ggg' });
            session.next();
            assert.strictEqual(model.getValue(), '{ggg}');
            assert.strictEqual(session.isAtLastPlaceholder, true);
            assertSelections(editor, new selection_1.Selection(1, 6, 1, 6));
        });
        test('Snippet tab stop selection issue #96545', function () {
            editor.getModel().setValue('');
            const session = new snippetSession_1.SnippetSession(editor, '${1:{}${2:fff}${1/[\\{]/}/}$0', undefined, languageConfigurationService);
            session.insert();
            assert.strictEqual(editor.getModel().getValue(), '{fff{');
            assertSelections(editor, new selection_1.Selection(1, 1, 1, 2), new selection_1.Selection(1, 5, 1, 6));
            session.next();
            assertSelections(editor, new selection_1.Selection(1, 2, 1, 5));
        });
        test('Snippet placeholder index incorrect after using 2+ snippets in a row that each end with a placeholder, #30769', function () {
            editor.getModel().setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            const session = new snippetSession_1.SnippetSession(editor, 'test ${1:replaceme}', undefined, languageConfigurationService);
            session.insert();
            editor.trigger('test', 'type', { text: '1' });
            editor.trigger('test', 'type', { text: '\n' });
            assert.strictEqual(editor.getModel().getValue(), 'test 1\n');
            session.merge('test ${1:replaceme}');
            editor.trigger('test', 'type', { text: '2' });
            editor.trigger('test', 'type', { text: '\n' });
            assert.strictEqual(editor.getModel().getValue(), 'test 1\ntest 2\n');
            session.merge('test ${1:replaceme}');
            editor.trigger('test', 'type', { text: '3' });
            editor.trigger('test', 'type', { text: '\n' });
            assert.strictEqual(editor.getModel().getValue(), 'test 1\ntest 2\ntest 3\n');
            session.merge('test ${1:replaceme}');
            editor.trigger('test', 'type', { text: '4' });
            editor.trigger('test', 'type', { text: '\n' });
            assert.strictEqual(editor.getModel().getValue(), 'test 1\ntest 2\ntest 3\ntest 4\n');
        });
        test('Snippet variable text isn\'t whitespace normalised, #31124', function () {
            editor.getModel().setValue([
                'start',
                '\t\t-one',
                '\t\t-two',
                'end'
            ].join('\n'));
            editor.getModel().updateOptions({ insertSpaces: false });
            editor.setSelection(new selection_1.Selection(2, 2, 3, 7));
            new snippetSession_1.SnippetSession(editor, '<div>\n\t$TM_SELECTED_TEXT\n</div>$0', undefined, languageConfigurationService).insert();
            let expected = [
                'start',
                '\t<div>',
                '\t\t\t-one',
                '\t\t\t-two',
                '\t</div>',
                'end'
            ].join('\n');
            assert.strictEqual(editor.getModel().getValue(), expected);
            editor.getModel().setValue([
                'start',
                '\t\t-one',
                '\t-two',
                'end'
            ].join('\n'));
            editor.getModel().updateOptions({ insertSpaces: false });
            editor.setSelection(new selection_1.Selection(2, 2, 3, 7));
            new snippetSession_1.SnippetSession(editor, '<div>\n\t$TM_SELECTED_TEXT\n</div>$0', undefined, languageConfigurationService).insert();
            expected = [
                'start',
                '\t<div>',
                '\t\t\t-one',
                '\t\t-two',
                '\t</div>',
                'end'
            ].join('\n');
            assert.strictEqual(editor.getModel().getValue(), expected);
        });
        test('Selecting text from left to right, and choosing item messes up code, #31199', function () {
            const model = editor.getModel();
            model.setValue('console.log');
            let actual = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 12, 1, 9), 3, 0);
            assert.ok(actual.equalsSelection(new selection_1.Selection(1, 9, 1, 6)));
            actual = snippetSession_1.SnippetSession.adjustSelection(model, new selection_1.Selection(1, 9, 1, 12), 3, 0);
            assert.ok(actual.equalsSelection(new selection_1.Selection(1, 9, 1, 12)));
            editor.setSelections([new selection_1.Selection(1, 9, 1, 12)]);
            new snippetSession_1.SnippetSession(editor, 'far', { overwriteBefore: 3, overwriteAfter: 0, adjustWhitespace: true, clipboardText: undefined, overtypingCapturer: undefined }, languageConfigurationService).insert();
            assert.strictEqual(model.getValue(), 'console.far');
        });
        test('Tabs don\'t get replaced with spaces in snippet transformations #103818', function () {
            const model = editor.getModel();
            model.setValue('\n{\n  \n}');
            model.updateOptions({ insertSpaces: true, indentSize: 2 });
            editor.setSelections([new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(3, 6, 3, 6)]);
            const session = new snippetSession_1.SnippetSession(editor, [
                'function animate () {',
                '\tvar ${1:a} = 12;',
                '\tconsole.log(${1/(.*)/\n\t\t$1\n\t/})',
                '}'
            ].join('\n'), undefined, languageConfigurationService);
            session.insert();
            assert.strictEqual(model.getValue(), [
                'function animate () {',
                '  var a = 12;',
                '  console.log(a)',
                '}',
                '{',
                '  function animate () {',
                '    var a = 12;',
                '    console.log(a)',
                '  }',
                '}',
            ].join('\n'));
            editor.trigger('test', 'type', { text: 'bbb' });
            session.next();
            assert.strictEqual(model.getValue(), [
                'function animate () {',
                '  var bbb = 12;',
                '  console.log(',
                '    bbb',
                '  )',
                '}',
                '{',
                '  function animate () {',
                '    var bbb = 12;',
                '    console.log(',
                '      bbb',
                '    )',
                '  }',
                '}',
            ].join('\n'));
        });
        suite('createEditsAndSnippetsFromEdits', function () {
            test('empty', function () {
                const result = snippetSession_1.SnippetSession.createEditsAndSnippetsFromEdits(editor, [], true, true, undefined, undefined, languageConfigurationService);
                assert.deepStrictEqual(result.edits, []);
                assert.deepStrictEqual(result.snippets, []);
            });
            test('basic', function () {
                editor.getModel().setValue('foo("bar")');
                const result = snippetSession_1.SnippetSession.createEditsAndSnippetsFromEdits(editor, [{ range: new range_1.Range(1, 5, 1, 9), template: '$1' }, { range: new range_1.Range(1, 1, 1, 1), template: 'const ${1:new_const} = "bar"' }], true, true, undefined, undefined, languageConfigurationService);
                assert.strictEqual(result.edits.length, 2);
                assert.deepStrictEqual(result.edits[0].range, new range_1.Range(1, 1, 1, 1));
                assert.deepStrictEqual(result.edits[0].text, 'const new_const = "bar"');
                assert.deepStrictEqual(result.edits[1].range, new range_1.Range(1, 5, 1, 9));
                assert.deepStrictEqual(result.edits[1].text, 'new_const');
                assert.strictEqual(result.snippets.length, 1);
                assert.strictEqual(result.snippets[0].isTrivialSnippet, false);
            });
            test('with $SELECTION variable', function () {
                editor.getModel().setValue('Some text and a selection');
                editor.setSelections([new selection_1.Selection(1, 17, 1, 26)]);
                const result = snippetSession_1.SnippetSession.createEditsAndSnippetsFromEdits(editor, [{ range: new range_1.Range(1, 17, 1, 26), template: 'wrapped <$SELECTION>' }], true, true, undefined, undefined, languageConfigurationService);
                assert.strictEqual(result.edits.length, 1);
                assert.deepStrictEqual(result.edits[0].range, new range_1.Range(1, 17, 1, 26));
                assert.deepStrictEqual(result.edits[0].text, 'wrapped <selection>');
                assert.strictEqual(result.snippets.length, 1);
                assert.strictEqual(result.snippets[0].isTrivialSnippet, true);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldFNlc3Npb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc25pcHBldC90ZXN0L2Jyb3dzZXIvc25pcHBldFNlc3Npb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFzQkEsS0FBSyxDQUFDLGdCQUFnQixFQUFFO1FBRXZCLElBQUksNEJBQTJELENBQUM7UUFDaEUsSUFBSSxNQUF5QixDQUFDO1FBQzlCLElBQUksS0FBZ0IsQ0FBQztRQUVyQixTQUFTLGdCQUFnQixDQUFDLE1BQXlCLEVBQUUsR0FBRyxDQUFjO1lBQ3JFLEtBQUssTUFBTSxTQUFTLElBQUksTUFBTSxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUcsQ0FBQztnQkFDMUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFVBQVUsU0FBUyxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNqSCxDQUFDO1lBQ0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxLQUFLLENBQUM7WUFDTCxLQUFLLEdBQUcsSUFBQSwrQkFBZSxFQUFDLDBDQUEwQyxDQUFDLENBQUM7WUFDcEUsNEJBQTRCLEdBQUcsSUFBSSxtRUFBZ0MsRUFBRSxDQUFDO1lBQ3RFLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxxQ0FBaUIsQ0FDOUMsQ0FBQyxxQkFBYSxFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUFpQjtpQkFBSSxDQUFDLEVBQzVELENBQUMsNkRBQTZCLEVBQUUsNEJB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