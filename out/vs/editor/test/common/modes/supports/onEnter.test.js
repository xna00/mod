define(["require", "exports", "assert", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/supports/onEnter", "vs/editor/test/common/modes/supports/onEnterRules", "vs/base/test/common/utils"], function (require, exports, assert, languageConfiguration_1, onEnter_1, onEnterRules_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('OnEnter', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('uses brackets', () => {
            const brackets = [
                ['(', ')'],
                ['begin', 'end']
            ];
            const support = new onEnter_1.OnEnterSupport({
                brackets: brackets
            });
            const testIndentAction = (beforeText, afterText, expected) => {
                const actual = support.onEnter(3 /* EditorAutoIndentStrategy.Advanced */, '', beforeText, afterText);
                if (expected === languageConfiguration_1.IndentAction.None) {
                    assert.strictEqual(actual, null);
                }
                else {
                    assert.strictEqual(actual.indentAction, expected);
                }
            };
            testIndentAction('a', '', languageConfiguration_1.IndentAction.None);
            testIndentAction('', 'b', languageConfiguration_1.IndentAction.None);
            testIndentAction('(', 'b', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('a', ')', languageConfiguration_1.IndentAction.None);
            testIndentAction('begin', 'ending', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('abegin', 'end', languageConfiguration_1.IndentAction.None);
            testIndentAction('begin', ')', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('begin', 'end', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction('begin ', ' end', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction(' begin', 'end//as', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction('(', ')', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction('( ', ')', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction('a(', ')b', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction('(', '', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('(', 'foo', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('begin', 'foo', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('begin', '', languageConfiguration_1.IndentAction.Indent);
        });
        test('Issue #121125: onEnterRules with global modifier', () => {
            const support = new onEnter_1.OnEnterSupport({
                onEnterRules: [
                    {
                        action: {
                            appendText: '/// ',
                            indentAction: languageConfiguration_1.IndentAction.Outdent
                        },
                        beforeText: /^\s*\/{3}.*$/gm
                    }
                ]
            });
            const testIndentAction = (previousLineText, beforeText, afterText, expectedIndentAction, expectedAppendText, removeText = 0) => {
                const actual = support.onEnter(3 /* EditorAutoIndentStrategy.Advanced */, previousLineText, beforeText, afterText);
                if (expectedIndentAction === null) {
                    assert.strictEqual(actual, null, 'isNull:' + beforeText);
                }
                else {
                    assert.strictEqual(actual !== null, true, 'isNotNull:' + beforeText);
                    assert.strictEqual(actual.indentAction, expectedIndentAction, 'indentAction:' + beforeText);
                    if (expectedAppendText !== null) {
                        assert.strictEqual(actual.appendText, expectedAppendText, 'appendText:' + beforeText);
                    }
                    if (removeText !== 0) {
                        assert.strictEqual(actual.removeText, removeText, 'removeText:' + beforeText);
                    }
                }
            };
            testIndentAction('/// line', '/// line', '', languageConfiguration_1.IndentAction.Outdent, '/// ');
            testIndentAction('/// line', '/// line', '', languageConfiguration_1.IndentAction.Outdent, '/// ');
        });
        test('uses regExpRules', () => {
            const support = new onEnter_1.OnEnterSupport({
                onEnterRules: onEnterRules_1.javascriptOnEnterRules
            });
            const testIndentAction = (previousLineText, beforeText, afterText, expectedIndentAction, expectedAppendText, removeText = 0) => {
                const actual = support.onEnter(3 /* EditorAutoIndentStrategy.Advanced */, previousLineText, beforeText, afterText);
                if (expectedIndentAction === null) {
                    assert.strictEqual(actual, null, 'isNull:' + beforeText);
                }
                else {
                    assert.strictEqual(actual !== null, true, 'isNotNull:' + beforeText);
                    assert.strictEqual(actual.indentAction, expectedIndentAction, 'indentAction:' + beforeText);
                    if (expectedAppendText !== null) {
                        assert.strictEqual(actual.appendText, expectedAppendText, 'appendText:' + beforeText);
                    }
                    if (removeText !== 0) {
                        assert.strictEqual(actual.removeText, removeText, 'removeText:' + beforeText);
                    }
                }
            };
            testIndentAction('', '\t/**', ' */', languageConfiguration_1.IndentAction.IndentOutdent, ' * ');
            testIndentAction('', '\t/**', '', languageConfiguration_1.IndentAction.None, ' * ');
            testIndentAction('', '\t/** * / * / * /', '', languageConfiguration_1.IndentAction.None, ' * ');
            testIndentAction('', '\t/** /*', '', languageConfiguration_1.IndentAction.None, ' * ');
            testIndentAction('', '/**', '', languageConfiguration_1.IndentAction.None, ' * ');
            testIndentAction('', '\t/**/', '', null, null);
            testIndentAction('', '\t/***/', '', null, null);
            testIndentAction('', '\t/*******/', '', null, null);
            testIndentAction('', '\t/** * * * * */', '', null, null);
            testIndentAction('', '\t/** */', '', null, null);
            testIndentAction('', '\t/** asdfg */', '', null, null);
            testIndentAction('', '\t/* asdfg */', '', null, null);
            testIndentAction('', '\t/* asdfg */', '', null, null);
            testIndentAction('', '\t/** asdfg */', '', null, null);
            testIndentAction('', '*/', '', null, null);
            testIndentAction('', '\t/*', '', null, null);
            testIndentAction('', '\t*', '', null, null);
            testIndentAction('\t/**', '\t *', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('\t * something', '\t *', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('\t *', '\t *', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('', '\t */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '\t * */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '\t * * / * / * / */', '', null, null);
            testIndentAction('\t/**', '\t * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('\t * something', '\t * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('\t *', '\t * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('/**', ' * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' * something', ' * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' *', ' * asdfsfagadfg', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('/**', ' * asdfsfagadfg * * * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' * something', ' * asdfsfagadfg * * * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' *', ' * asdfsfagadfg * * * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('/**', ' * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' * something', ' * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' *', ' * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('/**', ' * asdfsfagadfg * / * / * /', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' * something', ' * asdfsfagadfg * / * / * /', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' *', ' * asdfsfagadfg * / * / * /', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('/**', ' * asdfsfagadfg * / * / * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' * something', ' * asdfsfagadfg * / * / * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' *', ' * asdfsfagadfg * / * / * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('', ' */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction(' */', ' * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('', '\t */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '\t\t */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '   */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '     */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '\t     */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', ' *--------------------------------------------------------------------------------------------*/', '', languageConfiguration_1.IndentAction.None, null, 1);
            // issue #43469
            testIndentAction('class A {', '    * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('', '    * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('    ', '    * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('class A {', '  * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('', '  * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('  ', '  * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
        });
        test('issue #141816', () => {
            const support = new onEnter_1.OnEnterSupport({
                onEnterRules: onEnterRules_1.javascriptOnEnterRules
            });
            const testIndentAction = (beforeText, afterText, expected) => {
                const actual = support.onEnter(3 /* EditorAutoIndentStrategy.Advanced */, '', beforeText, afterText);
                if (expected === languageConfiguration_1.IndentAction.None) {
                    assert.strictEqual(actual, null);
                }
                else {
                    assert.strictEqual(actual.indentAction, expected);
                }
            };
            testIndentAction('const r = /{/;', '', languageConfiguration_1.IndentAction.None);
            testIndentAction('const r = /{[0-9]/;', '', languageConfiguration_1.IndentAction.None);
            testIndentAction('const r = /[a-zA-Z]{/;', '', languageConfiguration_1.IndentAction.None);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25FbnRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZXMvc3VwcG9ydHMvb25FbnRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVdBLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1FBRXJCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtZQUMxQixNQUFNLFFBQVEsR0FBb0I7Z0JBQ2pDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztnQkFDVixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUM7YUFDaEIsQ0FBQztZQUNGLE1BQU0sT0FBTyxHQUFHLElBQUksd0JBQWMsQ0FBQztnQkFDbEMsUUFBUSxFQUFFLFFBQVE7YUFDbEIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLFVBQWtCLEVBQUUsU0FBaUIsRUFBRSxRQUFzQixFQUFFLEVBQUU7Z0JBQzFGLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxPQUFPLDRDQUFvQyxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM3RixJQUFJLFFBQVEsS0FBSyxvQ0FBWSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbEMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDcEQsQ0FBQztZQUNGLENBQUMsQ0FBQztZQUVGLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsb0NBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxnQkFB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