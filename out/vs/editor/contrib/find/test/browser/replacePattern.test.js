/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/search", "vs/base/test/common/utils", "vs/editor/contrib/find/browser/replacePattern"], function (require, exports, assert, search_1, utils_1, replacePattern_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Replace Pattern test', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('parse replace string', () => {
            const testParse = (input, expectedPieces) => {
                const actual = (0, replacePattern_1.parseReplaceString)(input);
                const expected = new replacePattern_1.ReplacePattern(expectedPieces);
                assert.deepStrictEqual(actual, expected, 'Parsing ' + input);
            };
            // no backslash => no treatment
            testParse('hello', [replacePattern_1.ReplacePiece.staticValue('hello')]);
            // \t => TAB
            testParse('\\thello', [replacePattern_1.ReplacePiece.staticValue('\thello')]);
            testParse('h\\tello', [replacePattern_1.ReplacePiece.staticValue('h\tello')]);
            testParse('hello\\t', [replacePattern_1.ReplacePiece.staticValue('hello\t')]);
            // \n => LF
            testParse('\\nhello', [replacePattern_1.ReplacePiece.staticValue('\nhello')]);
            // \\t => \t
            testParse('\\\\thello', [replacePattern_1.ReplacePiece.staticValue('\\thello')]);
            testParse('h\\\\tello', [replacePattern_1.ReplacePiece.staticValue('h\\tello')]);
            testParse('hello\\\\t', [replacePattern_1.ReplacePiece.staticValue('hello\\t')]);
            // \\\t => \TAB
            testParse('\\\\\\thello', [replacePattern_1.ReplacePiece.staticValue('\\\thello')]);
            // \\\\t => \\t
            testParse('\\\\\\\\thello', [replacePattern_1.ReplacePiece.staticValue('\\\\thello')]);
            // \ at the end => no treatment
            testParse('hello\\', [replacePattern_1.ReplacePiece.staticValue('hello\\')]);
            // \ with unknown char => no treatment
            testParse('hello\\x', [replacePattern_1.ReplacePiece.staticValue('hello\\x')]);
            // \ with back reference => no treatment
            testParse('hello\\0', [replacePattern_1.ReplacePiece.staticValue('hello\\0')]);
            testParse('hello$&', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(0)]);
            testParse('hello$0', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(0)]);
            testParse('hello$02', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(0), replacePattern_1.ReplacePiece.staticValue('2')]);
            testParse('hello$1', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(1)]);
            testParse('hello$2', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(2)]);
            testParse('hello$9', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(9)]);
            testParse('$9hello', [replacePattern_1.ReplacePiece.matchIndex(9), replacePattern_1.ReplacePiece.staticValue('hello')]);
            testParse('hello$12', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(12)]);
            testParse('hello$99', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(99)]);
            testParse('hello$99a', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(99), replacePattern_1.ReplacePiece.staticValue('a')]);
            testParse('hello$1a', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(1), replacePattern_1.ReplacePiece.staticValue('a')]);
            testParse('hello$100', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(10), replacePattern_1.ReplacePiece.staticValue('0')]);
            testParse('hello$100a', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(10), replacePattern_1.ReplacePiece.staticValue('0a')]);
            testParse('hello$10a0', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(10), replacePattern_1.ReplacePiece.staticValue('a0')]);
            testParse('hello$$', [replacePattern_1.ReplacePiece.staticValue('hello$')]);
            testParse('hello$$0', [replacePattern_1.ReplacePiece.staticValue('hello$0')]);
            testParse('hello$`', [replacePattern_1.ReplacePiece.staticValue('hello$`')]);
            testParse('hello$\'', [replacePattern_1.ReplacePiece.staticValue('hello$\'')]);
        });
        test('parse replace string with case modifiers', () => {
            const testParse = (input, expectedPieces) => {
                const actual = (0, replacePattern_1.parseReplaceString)(input);
                const expected = new replacePattern_1.ReplacePattern(expectedPieces);
                assert.deepStrictEqual(actual, expected, 'Parsing ' + input);
            };
            function assertReplace(target, search, replaceString, expected) {
                const replacePattern = (0, replacePattern_1.parseReplaceString)(replaceString);
                const m = search.exec(target);
                const actual = replacePattern.buildReplaceString(m);
                assert.strictEqual(actual, expected, `${target}.replace(${search}, ${replaceString}) === ${expected}`);
            }
            // \U, \u => uppercase  \L, \l => lowercase  \E => cancel
            testParse('hello\\U$1', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.caseOps(1, ['U'])]);
            assertReplace('func privateFunc(', /func (\w+)\(/, 'func \\U$1(', 'func PRIVATEFUNC(');
            testParse('hello\\u$1', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.caseOps(1, ['u'])]);
            assertReplace('func privateFunc(', /func (\w+)\(/, 'func \\u$1(', 'func PrivateFunc(');
            testParse('hello\\L$1', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.caseOps(1, ['L'])]);
            assertReplace('func privateFunc(', /func (\w+)\(/, 'func \\L$1(', 'func privatefunc(');
            testParse('hello\\l$1', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.caseOps(1, ['l'])]);
            assertReplace('func PrivateFunc(', /func (\w+)\(/, 'func \\l$1(', 'func privateFunc(');
            testParse('hello$1\\u\\u\\U$4goodbye', [replacePattern_1.ReplacePiece.staticValue('hello'), replacePattern_1.ReplacePiece.matchIndex(1), replacePattern_1.ReplacePiece.caseOps(4, ['u', 'u', 'U']), replacePattern_1.ReplacePiece.staticValue('goodbye')]);
            assertReplace('hellogooDbye', /hello(\w+)/, 'hello\\u\\u\\l\\l\\U$1', 'helloGOodBYE');
        });
        test('replace has JavaScript semantics', () => {
            const testJSReplaceSemantics = (target, search, replaceString, expected) => {
                const replacePattern = (0, replacePattern_1.parseReplaceString)(replaceString);
                const m = search.exec(target);
                const actual = replacePattern.buildReplaceString(m);
                assert.deepStrictEqual(actual, expected, `${target}.replace(${search}, ${replaceString})`);
            };
            testJSReplaceSemantics('hi', /hi/, 'hello', 'hi'.replace(/hi/, 'hello'));
            testJSReplaceSemantics('hi', /hi/, '\\t', 'hi'.replace(/hi/, '\t'));
            testJSReplaceSemantics('hi', /hi/, '\\n', 'hi'.replace(/hi/, '\n'));
            testJSReplaceSemantics('hi', /hi/, '\\\\t', 'hi'.replace(/hi/, '\\t'));
            testJSReplaceSemantics('hi', /hi/, '\\\\n', 'hi'.replace(/hi/, '\\n'));
            // implicit capture group 0
            testJSReplaceSemantics('hi', /hi/, 'hello$&', 'hi'.replace(/hi/, 'hello$&'));
            testJSReplaceSemantics('hi', /hi/, 'hello$0', 'hi'.replace(/hi/, 'hello$&'));
            testJSReplaceSemantics('hi', /hi/, 'hello$&1', 'hi'.replace(/hi/, 'hello$&1'));
            testJSReplaceSemantics('hi', /hi/, 'hello$01', 'hi'.replace(/hi/, 'hello$&1'));
            // capture groups have funny semantics in replace strings
            // the replace string interprets $nn as a captured group only if it exists in the search regex
            testJSReplaceSemantics('hi', /(hi)/, 'hello$10', 'hi'.replace(/(hi)/, 'hello$10'));
            testJSReplaceSemantics('hi', /(hi)()()()()()()()()()/, 'hello$10', 'hi'.replace(/(hi)()()()()()()()()()/, 'hello$10'));
            testJSReplaceSemantics('hi', /(hi)/, 'hello$100', 'hi'.replace(/(hi)/, 'hello$100'));
            testJSReplaceSemantics('hi', /(hi)/, 'hello$20', 'hi'.replace(/(hi)/, 'hello$20'));
        });
        test('get replace string if given text is a complete match', () => {
            function assertReplace(target, search, replaceString, expected) {
                const replacePattern = (0, replacePattern_1.parseReplaceString)(replaceString);
                const m = search.exec(target);
                const actual = replacePattern.buildReplaceString(m);
                assert.strictEqual(actual, expected, `${target}.replace(${search}, ${replaceString}) === ${expected}`);
            }
            assertReplace('bla', /bla/, 'hello', 'hello');
            assertReplace('bla', /(bla)/, 'hello', 'hello');
            assertReplace('bla', /(bla)/, 'hello$0', 'hellobla');
            const searchRegex = /let\s+(\w+)\s*=\s*require\s*\(\s*['"]([\w\.\-/]+)\s*['"]\s*\)\s*/;
            assertReplace('let fs = require(\'fs\')', searchRegex, 'import * as $1 from \'$2\';', 'import * as fs from \'fs\';');
            assertReplace('let something = require(\'fs\')', searchRegex, 'import * as $1 from \'$2\';', 'import * as something from \'fs\';');
            assertReplace('let something = require(\'fs\')', searchRegex, 'import * as $1 from \'$1\';', 'import * as something from \'something\';');
            assertReplace('let something = require(\'fs\')', searchRegex, 'import * as $2 from \'$1\';', 'import * as fs from \'something\';');
            assertReplace('let something = require(\'fs\')', searchRegex, 'import * as $0 from \'$0\';', 'import * as let something = require(\'fs\') from \'let something = require(\'fs\')\';');
            assertReplace('let fs = require(\'fs\')', searchRegex, 'import * as $1 from \'$2\';', 'import * as fs from \'fs\';');
            assertReplace('for ()', /for(.*)/, 'cat$1', 'cat ()');
            // issue #18111
            assertReplace('HRESULT OnAmbientPropertyChange(DISPID   dispid);', /\b\s{3}\b/, ' ', ' ');
        });
        test('get replace string if match is sub-string of the text', () => {
            function assertReplace(target, search, replaceString, expected) {
                const replacePattern = (0, replacePattern_1.parseReplaceString)(replaceString);
                const m = search.exec(target);
                const actual = replacePattern.buildReplaceString(m);
                assert.strictEqual(actual, expected, `${target}.replace(${search}, ${replaceString}) === ${expected}`);
            }
            assertReplace('this is a bla text', /bla/, 'hello', 'hello');
            assertReplace('this is a bla text', /this(?=.*bla)/, 'that', 'that');
            assertReplace('this is a bla text', /(th)is(?=.*bla)/, '$1at', 'that');
            assertReplace('this is a bla text', /(th)is(?=.*bla)/, '$1e', 'the');
            assertReplace('this is a bla text', /(th)is(?=.*bla)/, '$1ere', 'there');
            assertReplace('this is a bla text', /(th)is(?=.*bla)/, '$1', 'th');
            assertReplace('this is a bla text', /(th)is(?=.*bla)/, 'ma$1', 'math');
            assertReplace('this is a bla text', /(th)is(?=.*bla)/, 'ma$1s', 'maths');
            assertReplace('this is a bla text', /(th)is(?=.*bla)/, '$0', 'this');
            assertReplace('this is a bla text', /(th)is(?=.*bla)/, '$0$1', 'thisth');
            assertReplace('this is a bla text', /bla(?=\stext$)/, 'foo', 'foo');
            assertReplace('this is a bla text', /b(la)(?=\stext$)/, 'f$1', 'fla');
            assertReplace('this is a bla text', /b(la)(?=\stext$)/, 'f$0', 'fbla');
            assertReplace('this is a bla text', /b(la)(?=\stext$)/, '$0ah', 'blaah');
        });
        test('issue #19740 Find and replace capture group/backreference inserts `undefined` instead of empty string', () => {
            const replacePattern = (0, replacePattern_1.parseReplaceString)('a{$1}');
            const matches = /a(z)?/.exec('abcd');
            const actual = replacePattern.buildReplaceString(matches);
            assert.strictEqual(actual, 'a{}');
        });
        test('buildReplaceStringWithCasePreserved test', () => {
            function assertReplace(target, replaceString, expected) {
                let actual = '';
                actual = (0, search_1.buildReplaceStringWithCasePreserved)(target, replaceString);
                assert.strictEqual(actual, expected);
            }
            assertReplace(['abc'], 'Def', 'def');
            assertReplace(['Abc'], 'Def', 'Def');
            assertReplace(['ABC'], 'Def', 'DEF');
            assertReplace(['abc', 'Abc'], 'Def', 'def');
            assertReplace(['Abc', 'abc'], 'Def', 'Def');
            assertReplace(['ABC', 'abc'], 'Def', 'DEF');
            assertReplace(['aBc', 'abc'], 'Def', 'def');
            assertReplace(['AbC'], 'Def', 'Def');
            assertReplace(['aBC'], 'Def', 'def');
            assertReplace(['aBc'], 'DeF', 'deF');
            assertReplace(['Foo-Bar'], 'newfoo-newbar', 'Newfoo-Newbar');
            assertReplace(['Foo-Bar-Abc'], 'newfoo-newbar-newabc', 'Newfoo-Newbar-Newabc');
            assertReplace(['Foo-Bar-abc'], 'newfoo-newbar', 'Newfoo-newbar');
            assertReplace(['foo-Bar'], 'newfoo-newbar', 'newfoo-Newbar');
            assertReplace(['foo-BAR'], 'newfoo-newbar', 'newfoo-NEWBAR');
            assertReplace(['foO-BAR'], 'NewFoo-NewBar', 'newFoo-NEWBAR');
            assertReplace(['Foo_Bar'], 'newfoo_newbar', 'Newfoo_Newbar');
            assertReplace(['Foo_Bar_Abc'], 'newfoo_newbar_newabc', 'Newfoo_Newbar_Newabc');
            assertReplace(['Foo_Bar_abc'], 'newfoo_newbar', 'Newfoo_newbar');
            assertReplace(['Foo_Bar-abc'], 'newfoo_newbar-abc', 'Newfoo_newbar-abc');
            assertReplace(['foo_Bar'], 'newfoo_newbar', 'newfoo_Newbar');
            assertReplace(['Foo_BAR'], 'newfoo_newbar', 'Newfoo_NEWBAR');
        });
        test('preserve case', () => {
            function assertReplace(target, replaceString, expected) {
                const replacePattern = (0, replacePattern_1.parseReplaceString)(replaceString);
                const actual = replacePattern.buildReplaceString(target, true);
                assert.strictEqual(actual, expected);
            }
            assertReplace(['abc'], 'Def', 'def');
            assertReplace(['Abc'], 'Def', 'Def');
            assertReplace(['ABC'], 'Def', 'DEF');
            assertReplace(['abc', 'Abc'], 'Def', 'def');
            assertReplace(['Abc', 'abc'], 'Def', 'Def');
            assertReplace(['ABC', 'abc'], 'Def', 'DEF');
            assertReplace(['aBc', 'abc'], 'Def', 'def');
            assertReplace(['AbC'], 'Def', 'Def');
            assertReplace(['aBC'], 'Def', 'def');
            assertReplace(['aBc'], 'DeF', 'deF');
            assertReplace(['Foo-Bar'], 'newfoo-newbar', 'Newfoo-Newbar');
            assertReplace(['Foo-Bar-Abc'], 'newfoo-newbar-newabc', 'Newfoo-Newbar-Newabc');
            assertReplace(['Foo-Bar-abc'], 'newfoo-newbar', 'Newfoo-newbar');
            assertReplace(['foo-Bar'], 'newfoo-newbar', 'newfoo-Newbar');
            assertReplace(['foo-BAR'], 'newfoo-newbar', 'newfoo-NEWBAR');
            assertReplace(['foO-BAR'], 'NewFoo-NewBar', 'newFoo-NEWBAR');
            assertReplace(['Foo_Bar'], 'newfoo_newbar', 'Newfoo_Newbar');
            assertReplace(['Foo_Bar_Abc'], 'newfoo_newbar_newabc', 'Newfoo_Newbar_Newabc');
            assertReplace(['Foo_Bar_abc'], 'newfoo_newbar', 'Newfoo_newbar');
            assertReplace(['Foo_Bar-abc'], 'newfoo_newbar-abc', 'Newfoo_newbar-abc');
            assertReplace(['foo_Bar'], 'newfoo_newbar', 'newfoo_Newbar');
            assertReplace(['foo_BAR'], 'newfoo_newbar', 'newfoo_NEWBAR');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZVBhdHRlcm4udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZmluZC90ZXN0L2Jyb3dzZXIvcmVwbGFjZVBhdHRlcm4udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1FBRWxDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1lBQ2pDLE1BQU0sU0FBUyxHQUFHLENBQUMsS0FBYSxFQUFFLGNBQThCLEVBQUUsRUFBRTtnQkFDbkUsTUFBTSxNQUFNLEdBQUcsSUFBQSxtQ0FBa0IsRUFBQyxLQUFLLENBQUMsQ0FBQztnQkFDekMsTUFBTSxRQUFRLEdBQUcsSUFBSSwrQkFBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNwRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQzlELENBQUMsQ0FBQztZQUVGLCtCQUErQjtZQUMvQixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXhELFlBQVk7WUFDWixTQUFTLENBQUMsVUFBVSxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdELFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0QsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU3RCxXQUFXO1lBQ1gsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU3RCxZQUFZO1lBQ1osU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRSxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFaEUsZUFBZTtZQUNmLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbkUsZUFBZTtZQUNmLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RSwrQkFBK0I7WUFDL0IsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU1RCxzQ0FBc0M7WUFDdEMsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU5RCx3Q0FBd0M7WUFDeEMsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU5RCxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsNkJBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBRSw2QkFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLDZCQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLDZCQUFZLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0SCxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsNkJBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBRSw2QkFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLDZCQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RixTQUFTLENBQUMsU0FBUyxFQUFFLENBQUMsNkJBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsNkJBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXRGLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBRSw2QkFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEYsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLDZCQUFZLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4RixTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsNkJBQVksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEVBQUUsNkJBQVksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hILFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBRSw2QkFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEgsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLDZCQUFZLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLDZCQUFZLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4SCxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsNkJBQVksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEVBQUUsNkJBQVksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFILFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBRSw2QkFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRSw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUgsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRCxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTdELFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUQsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLDZCQUFZLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwQ0FBMEMsRUFBRSxHQUFHLEVBQUU7WUFDckQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxLQUFhLEVBQUUsY0FBOEIsRUFBRSxFQUFFO2dCQUNuRSxNQUFNLE1BQU0sR0FBRyxJQUFBLG1DQUFrQixFQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLFFBQVEsR0FBRyxJQUFJLCtCQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEdBQUcsS0FBSyxDQUFDLENBQUM7WUFDOUQsQ0FBQyxDQUFDO1lBQ0YsU0FBUyxhQUFhLENBQUMsTUFBYyxFQUFFLE1BQWMsRUFBRSxhQUFxQixFQUFFLFFBQWdCO2dCQUM3RixNQUFNLGNBQWMsR0FBRyxJQUFBLG1DQUFrQixFQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXBELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLE1BQU0sWUFBWSxNQUFNLEtBQUssYUFBYSxTQUFTLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDeEcsQ0FBQztZQUVELHlEQUF5RDtZQUV6RCxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsNkJBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0YsYUFBYSxDQUFDLG1CQUFtQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUV2RixTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsNkJBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0YsYUFBYSxDQUFDLG1CQUFtQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUV2RixTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsNkJBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0YsYUFBYSxDQUFDLG1CQUFtQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUV2RixTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsNkJBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsNkJBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0YsYUFBYSxDQUFDLG1CQUFtQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUV2RixTQUFTLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyw2QkFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBRSw2QkFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSw2QkFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsNkJBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZMLGFBQWEsQ0FBQyxjQUFjLEVBQUUsWUFBWSxFQUFFLHdCQUF3QixFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3ZGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtDQUFrQyxFQUFFLEdBQUcsRUFBRTtZQUM3QyxNQUFNLHNCQUFzQixHQUFHLENBQUMsTUFBYyxFQUFFLE1BQWMsRUFBRSxhQUFxQixFQUFFLFFBQWdCLEVBQUUsRUFBRTtnQkFDMUcsTUFBTSxjQUFjLEdBQUcsSUFBQSxtQ0FBa0IsRUFBQyxhQUFhLENBQUMsQ0FBQztnQkFDekQsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDOUIsTUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVwRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxNQUFNLFlBQVksTUFBTSxLQUFLLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDNUYsQ0FBQyxDQUFDO1lBRUYsc0JBQXNCLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN6RSxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLHNCQUFzQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDcEUsc0JBQXNCLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN2RSxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRXZFLDJCQUEyQjtZQUMzQixzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzdFLHNCQUFzQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDN0Usc0JBQXNCLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUMvRSxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBRS9FLHlEQUF5RDtZQUN6RCw4RkFBOEY7WUFDOUYsc0JBQXNCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNuRixzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsd0JBQXdCLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUN2SCxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLHNCQUFzQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0RBQXNELEVBQUUsR0FBRyxFQUFFO1lBQ2pFLFNBQVMsYUFBYSxDQUFDLE1BQWMsRUFBRSxNQUFjLEVBQUUsYUFBcUIsRUFBRSxRQUFnQjtnQkFDN0YsTUFBTSxjQUFjLEdBQUcsSUFBQSxtQ0FBa0IsRUFBQyxhQUFhLENBQUMsQ0FBQztnQkFDekQsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDOUIsTUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVwRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxNQUFNLFlBQVksTUFBTSxLQUFLLGFBQWEsU0FBUyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hHLENBQUM7WUFFRCxhQUFhLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUMsYUFBYSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2hELGFBQWEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVyRCxNQUFNLFdBQVcsR0FBRyxrRUFBa0UsQ0FBQztZQUN2RixhQUFhLENBQUMsMEJBQTBCLEVBQUUsV0FBVyxFQUFFLDZCQUE2QixFQUFFLDZCQUE2QixDQUFDLENBQUM7WUFDckgsYUFBYSxDQUFDLGlDQUFpQyxFQUFFLFdBQVcsRUFBRSw2QkFBNkIsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO1lBQ25JLGFBQWEsQ0FBQyxpQ0FBaUMsRUFBRSxXQUFXLEVBQUUsNkJBQTZCLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztZQUMxSSxhQUFhLENBQUMsaUNBQWlDLEVBQUUsV0FBVyxFQUFFLDZCQUE2QixFQUFFLG9DQUFvQyxDQUFDLENBQUM7WUFDbkksYUFBYSxDQUFDLGlDQUFpQyxFQUFFLFdBQVcsRUFBRSw2QkFBNkIsRUFBRSx1RkFBdUYsQ0FBQyxDQUFDO1lBQ3RMLGFBQWEsQ0FBQywwQkFBMEIsRUFBRSxXQUFXLEVBQUUsNkJBQTZCLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztZQUNySCxhQUFhLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFdEQsZUFBZTtZQUNmLGFBQWEsQ0FBQyxtREFBbUQsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHVEQUF1RCxFQUFFLEdBQUcsRUFBRTtZQUNsRSxTQUFTLGFBQWEsQ0FBQyxNQUFjLEVBQUUsTUFBYyxFQUFFLGFBQXFCLEVBQUUsUUFBZ0I7Z0JBQzdGLE1BQU0sY0FBYyxHQUFHLElBQUEsbUNBQWtCLEVBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlCLE1BQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsTUFBTSxZQUFZLE1BQU0sS0FBSyxhQUFhLFNBQVMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN4RyxDQUFDO1lBQ0QsYUFBYSxDQUFDLG9CQUFvQixFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDN0QsYUFBYSxDQUFDLG9CQUFvQixFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDckUsYUFBYSxDQUFDLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN2RSxhQUFhLENBQUMsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JFLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDekUsYUFBYSxDQUFDLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNuRSxhQUFhLENBQUMsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZFLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDekUsYUFBYSxDQUFDLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNyRSxhQUFhLENBQUMsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3pFLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEUsYUFBYSxDQUFDLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0RSxhQUFhLENBQUMsb0JBQW9CLEVBQUUsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZFLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUdBQXVHLEVBQUUsR0FBRyxFQUFFO1lBQ2xILE1BQU0sY0FBYyxHQUFHLElBQUEsbUNBQWtCLEVBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyQyxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMENBQTBDLEVBQUUsR0FBRyxFQUFFO1lBQ3JELFNBQVMsYUFBYSxDQUFDLE1BQWdCLEVBQUUsYUFBcUIsRUFBRSxRQUFnQjtnQkFDL0UsSUFBSSxNQUFNLEdBQVcsRUFBRSxDQUFDO2dCQUN4QixNQUFNLEdBQUcsSUFBQSw0Q0FBbUMsRUFBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFFRCxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLGFBQWEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyQyxhQUFhLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVDLGFBQWEsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUMsYUFBYSxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QyxhQUFhLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVDLGFBQWEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyQyxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUM3RCxhQUFhLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxzQkFBc0IsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1lBQy9FLGFBQWEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUNqRSxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDN0QsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzdELGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUM3RCxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDN0QsYUFBYSxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsc0JBQXNCLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztZQUMvRSxhQUFhLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDakUsYUFBYSxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsbUJBQW1CLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUN6RSxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDN0QsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQzlELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7WUFDMUIsU0FBUyxhQUFhLENBQUMsTUFBZ0IsRUFBRSxhQUFxQixFQUFFLFFBQWdCO2dCQUMvRSxNQUFNLGNBQWMsR0FBRyxJQUFBLG1DQUFrQixFQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBRUQsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLGFBQWEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyQyxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsYUFBYSxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QyxhQUFhLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVDLGFBQWEsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUMsYUFBYSxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QyxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLGFBQWEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyQyxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDN0QsYUFBYSxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsc0JBQXNCLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztZQUMvRSxhQUFhLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDakUsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzdELGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUM3RCxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDN0QsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzdELGFBQWEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLHNCQUFzQixFQUFFLHNCQUFzQixDQUFDLENBQUM7WUFDL0UsYUFBYSxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQ2pFLGFBQWEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLG1CQUFtQixFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDekUsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzdELGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUM5RCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=