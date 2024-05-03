define(["require", "exports", "assert", "vs/base/common/filters", "vs/base/test/common/utils"], function (require, exports, assert, filters_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function filterOk(filter, word, wordToMatchAgainst, highlights) {
        const r = filter(word, wordToMatchAgainst);
        assert(r, `${word} didn't match ${wordToMatchAgainst}`);
        if (highlights) {
            assert.deepStrictEqual(r, highlights);
        }
    }
    function filterNotOk(filter, word, wordToMatchAgainst) {
        assert(!filter(word, wordToMatchAgainst), `${word} matched ${wordToMatchAgainst}`);
    }
    suite('Filters', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('or', () => {
            let filter;
            let counters;
            const newFilter = function (i, r) {
                return function () { counters[i]++; return r; };
            };
            counters = [0, 0];
            filter = (0, filters_1.or)(newFilter(0, false), newFilter(1, false));
            filterNotOk(filter, 'anything', 'anything');
            assert.deepStrictEqual(counters, [1, 1]);
            counters = [0, 0];
            filter = (0, filters_1.or)(newFilter(0, true), newFilter(1, false));
            filterOk(filter, 'anything', 'anything');
            assert.deepStrictEqual(counters, [1, 0]);
            counters = [0, 0];
            filter = (0, filters_1.or)(newFilter(0, true), newFilter(1, true));
            filterOk(filter, 'anything', 'anything');
            assert.deepStrictEqual(counters, [1, 0]);
            counters = [0, 0];
            filter = (0, filters_1.or)(newFilter(0, false), newFilter(1, true));
            filterOk(filter, 'anything', 'anything');
            assert.deepStrictEqual(counters, [1, 1]);
        });
        test('PrefixFilter - case sensitive', function () {
            filterNotOk(filters_1.matchesStrictPrefix, '', '');
            filterOk(filters_1.matchesStrictPrefix, '', 'anything', []);
            filterOk(filters_1.matchesStrictPrefix, 'alpha', 'alpha', [{ start: 0, end: 5 }]);
            filterOk(filters_1.matchesStrictPrefix, 'alpha', 'alphasomething', [{ start: 0, end: 5 }]);
            filterNotOk(filters_1.matchesStrictPrefix, 'alpha', 'alp');
            filterOk(filters_1.matchesStrictPrefix, 'a', 'alpha', [{ start: 0, end: 1 }]);
            filterNotOk(filters_1.matchesStrictPrefix, 'x', 'alpha');
            filterNotOk(filters_1.matchesStrictPrefix, 'A', 'alpha');
            filterNotOk(filters_1.matchesStrictPrefix, 'AlPh', 'alPHA');
        });
        test('PrefixFilter - ignore case', function () {
            filterOk(filters_1.matchesPrefix, 'alpha', 'alpha', [{ start: 0, end: 5 }]);
            filterOk(filters_1.matchesPrefix, 'alpha', 'alphasomething', [{ start: 0, end: 5 }]);
            filterNotOk(filters_1.matchesPrefix, 'alpha', 'alp');
            filterOk(filters_1.matchesPrefix, 'a', 'alpha', [{ start: 0, end: 1 }]);
            filterOk(filters_1.matchesPrefix, 'ä', 'Älpha', [{ start: 0, end: 1 }]);
            filterNotOk(filters_1.matchesPrefix, 'x', 'alpha');
            filterOk(filters_1.matchesPrefix, 'A', 'alpha', [{ start: 0, end: 1 }]);
            filterOk(filters_1.matchesPrefix, 'AlPh', 'alPHA', [{ start: 0, end: 4 }]);
            filterNotOk(filters_1.matchesPrefix, 'T', '4'); // see https://github.com/microsoft/vscode/issues/22401
        });
        test('CamelCaseFilter', () => {
            filterNotOk(filters_1.matchesCamelCase, '', '');
            filterOk(filters_1.matchesCamelCase, '', 'anything', []);
            filterOk(filters_1.matchesCamelCase, 'alpha', 'alpha', [{ start: 0, end: 5 }]);
            filterOk(filters_1.matchesCamelCase, 'AlPhA', 'alpha', [{ start: 0, end: 5 }]);
            filterOk(filters_1.matchesCamelCase, 'alpha', 'alphasomething', [{ start: 0, end: 5 }]);
            filterNotOk(filters_1.matchesCamelCase, 'alpha', 'alp');
            filterOk(filters_1.matchesCamelCase, 'c', 'CamelCaseRocks', [
                { start: 0, end: 1 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'cc', 'CamelCaseRocks', [
                { start: 0, end: 1 },
                { start: 5, end: 6 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'ccr', 'CamelCaseRocks', [
                { start: 0, end: 1 },
                { start: 5, end: 6 },
                { start: 9, end: 10 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'cacr', 'CamelCaseRocks', [
                { start: 0, end: 2 },
                { start: 5, end: 6 },
                { start: 9, end: 10 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'cacar', 'CamelCaseRocks', [
                { start: 0, end: 2 },
                { start: 5, end: 7 },
                { start: 9, end: 10 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'ccarocks', 'CamelCaseRocks', [
                { start: 0, end: 1 },
                { start: 5, end: 7 },
                { start: 9, end: 14 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'cr', 'CamelCaseRocks', [
                { start: 0, end: 1 },
                { start: 9, end: 10 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'fba', 'FooBarAbe', [
                { start: 0, end: 1 },
                { start: 3, end: 5 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'fbar', 'FooBarAbe', [
                { start: 0, end: 1 },
                { start: 3, end: 6 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'fbara', 'FooBarAbe', [
                { start: 0, end: 1 },
                { start: 3, end: 7 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'fbaa', 'FooBarAbe', [
                { start: 0, end: 1 },
                { start: 3, end: 5 },
                { start: 6, end: 7 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'fbaab', 'FooBarAbe', [
                { start: 0, end: 1 },
                { start: 3, end: 5 },
                { start: 6, end: 8 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'c2d', 'canvasCreation2D', [
                { start: 0, end: 1 },
                { start: 14, end: 16 }
            ]);
            filterOk(filters_1.matchesCamelCase, 'cce', '_canvasCreationEvent', [
                { start: 1, end: 2 },
                { start: 7, end: 8 },
                { start: 15, end: 16 }
            ]);
        });
        test('CamelCaseFilter - #19256', function () {
            assert((0, filters_1.matchesCamelCase)('Debug Console', 'Open: Debug Console'));
            assert((0, filters_1.matchesCamelCase)('Debug console', 'Open: Debug Console'));
            assert((0, filters_1.matchesCamelCase)('debug console', 'Open: Debug Console'));
        });
        test('matchesContiguousSubString', () => {
            filterOk(filters_1.matchesContiguousSubString, 'cela', 'cancelAnimationFrame()', [
                { start: 3, end: 7 }
            ]);
        });
        test('matchesSubString', () => {
            filterOk(filters_1.matchesSubString, 'cmm', 'cancelAnimationFrame()', [
                { start: 0, end: 1 },
                { start: 9, end: 10 },
                { start: 18, end: 19 }
            ]);
            filterOk(filters_1.matchesSubString, 'abc', 'abcabc', [
                { start: 0, end: 3 },
            ]);
            filterOk(filters_1.matchesSubString, 'abc', 'aaabbbccc', [
                { start: 0, end: 1 },
                { start: 3, end: 4 },
                { start: 6, end: 7 },
            ]);
        });
        test('matchesSubString performance (#35346)', function () {
            filterNotOk(filters_1.matchesSubString, 'aaaaaaaaaaaaaaaaaaaax', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
        });
        test('WordFilter', () => {
            filterOk(filters_1.matchesWords, 'alpha', 'alpha', [{ start: 0, end: 5 }]);
            filterOk(filters_1.matchesWords, 'alpha', 'alphasomething', [{ start: 0, end: 5 }]);
            filterNotOk(filters_1.matchesWords, 'alpha', 'alp');
            filterOk(filters_1.matchesWords, 'a', 'alpha', [{ start: 0, end: 1 }]);
            filterNotOk(filters_1.matchesWords, 'x', 'alpha');
            filterOk(filters_1.matchesWords, 'A', 'alpha', [{ start: 0, end: 1 }]);
            filterOk(filters_1.matchesWords, 'AlPh', 'alPHA', [{ start: 0, end: 4 }]);
            assert((0, filters_1.matchesWords)('Debug Console', 'Open: Debug Console'));
            filterOk(filters_1.matchesWords, 'gp', 'Git: Pull', [{ start: 0, end: 1 }, { start: 5, end: 6 }]);
            filterOk(filters_1.matchesWords, 'g p', 'Git: Pull', [{ start: 0, end: 1 }, { start: 5, end: 6 }]);
            filterOk(filters_1.matchesWords, 'gipu', 'Git: Pull', [{ start: 0, end: 2 }, { start: 5, end: 7 }]);
            filterOk(filters_1.matchesWords, 'gp', 'Category: Git: Pull', [{ start: 10, end: 11 }, { start: 15, end: 16 }]);
            filterOk(filters_1.matchesWords, 'g p', 'Category: Git: Pull', [{ start: 10, end: 11 }, { start: 15, end: 16 }]);
            filterOk(filters_1.matchesWords, 'gipu', 'Category: Git: Pull', [{ start: 10, end: 12 }, { start: 15, end: 17 }]);
            filterNotOk(filters_1.matchesWords, 'it', 'Git: Pull');
            filterNotOk(filters_1.matchesWords, 'll', 'Git: Pull');
            filterOk(filters_1.matchesWords, 'git: プル', 'git: プル', [{ start: 0, end: 7 }]);
            filterOk(filters_1.matchesWords, 'git プル', 'git: プル', [{ start: 0, end: 3 }, { start: 5, end: 7 }]);
            filterOk(filters_1.matchesWords, 'öäk', 'Öhm: Älles Klar', [{ start: 0, end: 1 }, { start: 5, end: 6 }, { start: 11, end: 12 }]);
            // Handles issue #123915
            filterOk(filters_1.matchesWords, 'C++', 'C/C++: command', [{ start: 2, end: 5 }]);
            // Handles issue #154533
            filterOk(filters_1.matchesWords, '.', ':', []);
            filterOk(filters_1.matchesWords, '.', '.', [{ start: 0, end: 1 }]);
            // assert.ok(matchesWords('gipu', 'Category: Git: Pull', true) === null);
            // assert.deepStrictEqual(matchesWords('pu', 'Category: Git: Pull', true), [{ start: 15, end: 17 }]);
            filterOk(filters_1.matchesWords, 'bar', 'foo-bar');
            filterOk(filters_1.matchesWords, 'bar test', 'foo-bar test');
            filterOk(filters_1.matchesWords, 'fbt', 'foo-bar test');
            filterOk(filters_1.matchesWords, 'bar test', 'foo-bar (test)');
            filterOk(filters_1.matchesWords, 'foo bar', 'foo (bar)');
            filterNotOk(filters_1.matchesWords, 'bar est', 'foo-bar test');
            filterNotOk(filters_1.matchesWords, 'fo ar', 'foo-bar test');
            filterNotOk(filters_1.matchesWords, 'for', 'foo-bar test');
            filterOk(filters_1.matchesWords, 'foo bar', 'foo-bar');
            filterOk(filters_1.matchesWords, 'foo bar', '123 foo-bar 456');
            filterOk(filters_1.matchesWords, 'foo-bar', 'foo bar');
            filterOk(filters_1.matchesWords, 'foo:bar', 'foo:bar');
        });
        function assertMatches(pattern, word, decoratedWord, filter, opts = {}) {
            const r = filter(pattern, pattern.toLowerCase(), opts.patternPos || 0, word, word.toLowerCase(), opts.wordPos || 0, { firstMatchCanBeWeak: opts.firstMatchCanBeWeak ?? false, boostFullMatch: true });
            assert.ok(!decoratedWord === !r);
            if (r) {
                const matches = (0, filters_1.createMatches)(r);
                let actualWord = '';
                let pos = 0;
                for (const match of matches) {
                    actualWord += word.substring(pos, match.start);
                    actualWord += '^' + word.substring(match.start, match.end).split('').join('^');
                    pos = match.end;
                }
                actualWord += word.substring(pos);
                assert.strictEqual(actualWord, decoratedWord);
            }
        }
        test('fuzzyScore, #23215', function () {
            assertMatches('tit', 'win.tit', 'win.^t^i^t', filters_1.fuzzyScore);
            assertMatches('title', 'win.title', 'win.^t^i^t^l^e', filters_1.fuzzyScore);
            assertMatches('WordCla', 'WordCharacterClassifier', '^W^o^r^dCharacter^C^l^assifier', filters_1.fuzzyScore);
            assertMatches('WordCCla', 'WordCharacterClassifier', '^W^o^r^d^Character^C^l^assifier', filters_1.fuzzyScore);
        });
        test('fuzzyScore, #23332', function () {
            assertMatches('dete', '"editor.quickSuggestionsDelay"', undefined, filters_1.fuzzyScore);
        });
        test('fuzzyScore, #23190', function () {
            assertMatches('c:\\do', '& \'C:\\Documents and Settings\'', '& \'^C^:^\\^D^ocuments and Settings\'', filters_1.fuzzyScore);
            assertMatches('c:\\do', '& \'c:\\Documents and Settings\'', '& \'^c^:^\\^D^ocuments and Settings\'', filters_1.fuzzyScore);
        });
        test('fuzzyScore, #23581', function () {
            assertMatches('close', 'css.lint.importStatement', '^css.^lint.imp^ort^Stat^ement', filters_1.fuzzyScore);
            assertMatches('close', 'css.colorDecorators.enable', '^css.co^l^orDecorator^s.^enable', filters_1.fuzzyScore);
            assertMatches('close', 'workbench.quickOpen.closeOnFocusOut', 'workbench.quickOpen.^c^l^o^s^eOnFocusOut', filters_1.fuzzyScore);
            assertTopScore(filters_1.fuzzyScore, 'close', 2, 'css.lint.importStatement', 'css.colorDecorators.enable', 'workbench.quickOpen.closeOnFocusOut');
        });
        test('fuzzyScore, #23458', function () {
            assertMatches('highlight', 'editorHoverHighlight', 'editorHover^H^i^g^h^l^i^g^h^t', filters_1.fuzzyScore);
            assertMatches('hhighlight', 'editorHoverHighlight', 'editor^Hover^H^i^g^h^l^i^g^h^t', filters_1.fuzzyScore);
            assertMatches('dhhighlight', 'editorHoverHighlight', undefined, filters_1.fuzzyScore);
        });
        test('fuzzyScore, #23746', function () {
            assertMatches('-moz', '-moz-foo', '^-^m^o^z-foo', filters_1.fuzzyScore);
            assertMatches('moz', '-moz-foo', '-^m^o^z-foo', filters_1.fuzzyScore);
            assertMatches('moz', '-moz-animation', '-^m^o^z-animation', filters_1.fuzzyScore);
            assertMatches('moza', '-moz-animation', '-^m^o^z-^animation', filters_1.fuzzyScore);
        });
        test('fuzzyScore', () => {
            assertMatches('ab', 'abA', '^a^bA', filters_1.fuzzyScore);
            assertMatches('ccm', 'cacmelCase', '^ca^c^melCase', filters_1.fuzzyScore);
            assertMatches('bti', 'the_black_knight', undefined, filters_1.fuzzyScore);
            assertMatches('ccm', 'camelCase', undefined, filters_1.fuzzyScore);
            assertMatches('cmcm', 'camelCase', undefined, filters_1.fuzzyScore);
            assertMatches('BK', 'the_black_knight', 'the_^black_^knight', filters_1.fuzzyScore);
            assertMatches('KeyboardLayout=', 'KeyboardLayout', undefined, filters_1.fuzzyScore);
            assertMatches('LLL', 'SVisualLoggerLogsList', 'SVisual^Logger^Logs^List', filters_1.fuzzyScore);
            assertMatches('LLLL', 'SVilLoLosLi', undefined, filters_1.fuzzyScore);
            assertMatches('LLLL', 'SVisualLoggerLogsList', undefined, filters_1.fuzzyScore);
            assertMatches('TEdit', 'TextEdit', '^Text^E^d^i^t', filters_1.fuzzyScore);
            assertMatches('TEdit', 'TextEditor', '^Text^E^d^i^tor', filters_1.fuzzyScore);
            assertMatches('TEdit', 'Textedit', '^Text^e^d^i^t', filters_1.fuzzyScore);
            assertMatches('TEdit', 'text_edit', '^text_^e^d^i^t', filters_1.fuzzyScore);
            assertMatches('TEditDit', 'TextEditorDecorationType', '^Text^E^d^i^tor^Decorat^ion^Type', filters_1.fuzzyScore);
            assertMatches('TEdit', 'TextEditorDecorationType', '^Text^E^d^i^torDecorationType', filters_1.fuzzyScore);
            assertMatches('Tedit', 'TextEdit', '^Text^E^d^i^t', filters_1.fuzzyScore);
            assertMatches('ba', '?AB?', undefined, filters_1.fuzzyScore);
            assertMatches('bkn', 'the_black_knight', 'the_^black_^k^night', filters_1.fuzzyScore);
            assertMatches('bt', 'the_black_knight', 'the_^black_knigh^t', filters_1.fuzzyScore);
            assertMatches('ccm', 'camelCasecm', '^camel^Casec^m', filters_1.fuzzyScore);
            assertMatches('fdm', 'findModel', '^fin^d^Model', filters_1.fuzzyScore);
            assertMatches('fob', 'foobar', '^f^oo^bar', filters_1.fuzzyScore);
            assertMatches('fobz', 'foobar', undefined, filters_1.fuzzyScore);
            assertMatches('foobar', 'foobar', '^f^o^o^b^a^r', filters_1.fuzzyScore);
            assertMatches('form', 'editor.formatOnSave', 'editor.^f^o^r^matOnSave', filters_1.fuzzyScore);
            assertMatches('g p', 'Git: Pull', '^Git:^ ^Pull', filters_1.fuzzyScore);
            assertMatches('g p', 'Git: Pull', '^Git:^ ^Pull', filters_1.fuzzyScore);
            assertMatches('gip', 'Git: Pull', '^G^it: ^Pull', filters_1.fuzzyScore);
            assertMatches('gip', 'Git: Pull', '^G^it: ^Pull', filters_1.fuzzyScore);
            assertMatches('gp', 'Git: Pull', '^Git: ^Pull', filters_1.fuzzyScore);
            assertMatches('gp', 'Git_Git_Pull', '^Git_Git_^Pull', filters_1.fuzzyScore);
            assertMatches('is', 'ImportStatement', '^Import^Statement', filters_1.fuzzyScore);
            assertMatches('is', 'isValid', '^i^sValid', filters_1.fuzzyScore);
            assertMatches('lowrd', 'lowWord', '^l^o^wWo^r^d', filters_1.fuzzyScore);
            assertMatches('myvable', 'myvariable', '^m^y^v^aria^b^l^e', filters_1.fuzzyScore);
            assertMatches('no', '', undefined, filters_1.fuzzyScore);
            assertMatches('no', 'match', undefined, filters_1.fuzzyScore);
            assertMatches('ob', 'foobar', undefined, filters_1.fuzzyScore);
            assertMatches('sl', 'SVisualLoggerLogsList', '^SVisual^LoggerLogsList', filters_1.fuzzyScore);
            assertMatches('sllll', 'SVisualLoggerLogsList', '^SVisua^l^Logger^Logs^List', filters_1.fuzzyScore);
            assertMatches('Three', 'HTMLHRElement', undefined, filters_1.fuzzyScore);
            assertMatches('Three', 'Three', '^T^h^r^e^e', filters_1.fuzzyScore);
            assertMatches('fo', 'barfoo', undefined, filters_1.fuzzyScore);
            assertMatches('fo', 'bar_foo', 'bar_^f^oo', filters_1.fuzzyScore);
            assertMatches('fo', 'bar_Foo', 'bar_^F^oo', filters_1.fuzzyScore);
            assertMatches('fo', 'bar foo', 'bar ^f^oo', filters_1.fuzzyScore);
            assertMatches('fo', 'bar.foo', 'bar.^f^oo', filters_1.fuzzyScore);
            assertMatches('fo', 'bar/foo', 'bar/^f^oo', filters_1.fuzzyScore);
            assertMatches('fo', 'bar\\foo', 'bar\\^f^oo', filters_1.fuzzyScore);
        });
        test('fuzzyScore (first match can be weak)', function () {
            assertMatches('Three', 'HTMLHRElement', 'H^TML^H^R^El^ement', filters_1.fuzzyScore, { firstMatchCanBeWeak: true });
            assertMatches('tor', 'constructor', 'construc^t^o^r', filters_1.fuzzyScore, { firstMatchCanBeWeak: true });
            assertMatches('ur', 'constructor', 'constr^ucto^r', filters_1.fuzzyScore, { firstMatchCanBeWeak: true });
            assertTopScore(filters_1.fuzzyScore, 'tor', 2, 'constructor', 'Thor', 'cTor');
        });
        test('fuzzyScore, many matches', function () {
            assertMatches('aaaaaa', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '^a^a^a^a^a^aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', filters_1.fuzzyScore);
        });
        test('Freeze when fjfj -> jfjf, https://github.com/microsoft/vscode/issues/91807', function () {
            assertMatches('jfjfj', 'fjfjfjfjfjfjfjfjfjfjfj', undefined, filters_1.fuzzyScore);
            assertMatches('jfjfjfjfjfjfjfjfjfj', 'fjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfj', undefined, filters_1.fuzzyScore);
            assertMatches('jfjfjfjfjfjfjfjfjfjjfjfjfjfjfjfjfjfjfjjfjfjfjfjfjfjfjfjfjjfjfjfjfjfjfjfjfjfjjfjfjfjfjfjfjfjfjfjjfjfjfjfjfjfjfjfjfj', 'fjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfj', undefined, filters_1.fuzzyScore);
            assertMatches('jfjfjfjfjfjfjfjfjfj', 'fJfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfj', 'f^J^f^j^f^j^f^j^f^j^f^j^f^j^f^j^f^j^f^jfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfj', // strong match
            filters_1.fuzzyScore);
            assertMatches('jfjfjfjfjfjfjfjfjfj', 'fjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfj', 'f^j^f^j^f^j^f^j^f^j^f^j^f^j^f^j^f^j^f^jfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfjfj', // any match
            filters_1.fuzzyScore, { firstMatchCanBeWeak: true });
        });
        test('fuzzyScore, issue #26423', function () {
            assertMatches('baba', 'abababab', undefined, filters_1.fuzzyScore);
            assertMatches('fsfsfs', 'dsafdsafdsafdsafdsafdsafdsafasdfdsa', undefined, filters_1.fuzzyScore);
            assertMatches('fsfsfsfsfsfsfsf', 'dsafdsafdsafdsafdsafdsafdsafasdfdsafdsafdsafdsafdsfdsafdsfdfdfasdnfdsajfndsjnafjndsajlknfdsa', undefined, filters_1.fuzzyScore);
        });
        test('Fuzzy IntelliSense matching vs Haxe metadata completion, #26995', function () {
            assertMatches('f', ':Foo', ':^Foo', filters_1.fuzzyScore);
            assertMatches('f', ':foo', ':^foo', filters_1.fuzzyScore);
        });
        test('Separator only match should not be weak #79558', function () {
            assertMatches('.', 'foo.bar', 'foo^.bar', filters_1.fuzzyScore);
        });
        test('Cannot set property \'1\' of undefined, #26511', function () {
            const word = new Array(123).join('a');
            const pattern = new Array(120).join('a');
            (0, filters_1.fuzzyScore)(pattern, pattern.toLowerCase(), 0, word, word.toLowerCase(), 0);
            assert.ok(true); // must not explode
        });
        test('Vscode 1.12 no longer obeys \'sortText\' in completion items (from language server), #26096', function () {
            assertMatches('  ', '  group', undefined, filters_1.fuzzyScore, { patternPos: 2 });
            assertMatches('  g', '  group', '  ^group', filters_1.fuzzyScore, { patternPos: 2 });
            assertMatches('g', '  group', '  ^group', filters_1.fuzzyScore);
            assertMatches('g g', '  groupGroup', undefined, filters_1.fuzzyScore);
            assertMatches('g g', '  group Group', '  ^group^ ^Group', filters_1.fuzzyScore);
            assertMatches(' g g', '  group Group', '  ^group^ ^Group', filters_1.fuzzyScore, { patternPos: 1 });
            assertMatches('zz', 'zzGroup', '^z^zGroup', filters_1.fuzzyScore);
            assertMatches('zzg', 'zzGroup', '^z^z^Group', filters_1.fuzzyScore);
            assertMatches('g', 'zzGroup', 'zz^Group', filters_1.fuzzyScore);
        });
        test('patternPos isn\'t working correctly #79815', function () {
            assertMatches(':p'.substr(1), 'prop', '^prop', filters_1.fuzzyScore, { patternPos: 0 });
            assertMatches(':p', 'prop', '^prop', filters_1.fuzzyScore, { patternPos: 1 });
            assertMatches(':p', 'prop', undefined, filters_1.fuzzyScore, { patternPos: 2 });
            assertMatches(':p', 'proP', 'pro^P', filters_1.fuzzyScore, { patternPos: 1, wordPos: 1 });
            assertMatches(':p', 'aprop', 'a^prop', filters_1.fuzzyScore, { patternPos: 1, firstMatchCanBeWeak: true });
            assertMatches(':p', 'aprop', undefined, filters_1.fuzzyScore, { patternPos: 1, firstMatchCanBeWeak: false });
        });
        function assertTopScore(filter, pattern, expected, ...words) {
            let topScore = -(100 * 10);
            let topIdx = 0;
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const m = filter(pattern, pattern.toLowerCase(), 0, word, word.toLowerCase(), 0);
                if (m) {
                    const [score] = m;
                    if (score > topScore) {
                        topScore = score;
                        topIdx = i;
                    }
                }
            }
            assert.strictEqual(topIdx, expected, `${pattern} -> actual=${words[topIdx]} <> expected=${words[expected]}`);
        }
        test('topScore - fuzzyScore', function () {
            assertTopScore(filters_1.fuzzyScore, 'cons', 2, 'ArrayBufferConstructor', 'Console', 'console');
            assertTopScore(filters_1.fuzzyScore, 'Foo', 1, 'foo', 'Foo', 'foo');
            // #24904
            assertTopScore(filters_1.fuzzyScore, 'onMess', 1, 'onmessage', 'onMessage', 'onThisMegaEscape');
            assertTopScore(filters_1.fuzzyScore, 'CC', 1, 'camelCase', 'CamelCase');
            assertTopScore(filters_1.fuzzyScore, 'cC', 0, 'camelCase', 'CamelCase');
            // assertTopScore(fuzzyScore, 'cC', 1, 'ccfoo', 'camelCase');
            // assertTopScore(fuzzyScore, 'cC', 1, 'ccfoo', 'camelCase', 'foo-cC-bar');
            // issue #17836
            // assertTopScore(fuzzyScore, 'TEdit', 1, 'TextEditorDecorationType', 'TextEdit', 'TextEditor');
            assertTopScore(filters_1.fuzzyScore, 'p', 4, 'parse', 'posix', 'pafdsa', 'path', 'p');
            assertTopScore(filters_1.fuzzyScore, 'pa', 0, 'parse', 'pafdsa', 'path');
            // issue #14583
            assertTopScore(filters_1.fuzzyScore, 'log', 3, 'HTMLOptGroupElement', 'ScrollLogicalPosition', 'SVGFEMorphologyElement', 'log', 'logger');
            assertTopScore(filters_1.fuzzyScore, 'e', 2, 'AbstractWorker', 'ActiveXObject', 'else');
            // issue #14446
            assertTopScore(filters_1.fuzzyScore, 'workbench.sideb', 1, 'workbench.editor.defaultSideBySideLayout', 'workbench.sideBar.location');
            // issue #11423
            assertTopScore(filters_1.fuzzyScore, 'editor.r', 2, 'diffEditor.renderSideBySide', 'editor.overviewRulerlanes', 'editor.renderControlCharacter', 'editor.renderWhitespace');
            // assertTopScore(fuzzyScore, 'editor.R', 1, 'diffEditor.renderSideBySide', 'editor.overviewRulerlanes', 'editor.renderControlCharacter', 'editor.renderWhitespace');
            // assertTopScore(fuzzyScore, 'Editor.r', 0, 'diffEditor.renderSideBySide', 'editor.overviewRulerlanes', 'editor.renderControlCharacter', 'editor.renderWhitespace');
            assertTopScore(filters_1.fuzzyScore, '-mo', 1, '-ms-ime-mode', '-moz-columns');
            // dupe, issue #14861
            assertTopScore(filters_1.fuzzyScore, 'convertModelPosition', 0, 'convertModelPositionToViewPosition', 'convertViewToModelPosition');
            // dupe, issue #14942
            assertTopScore(filters_1.fuzzyScore, 'is', 0, 'isValidViewletId', 'import statement');
            assertTopScore(filters_1.fuzzyScore, 'title', 1, 'files.trimTrailingWhitespace', 'window.title');
            assertTopScore(filters_1.fuzzyScore, 'const', 1, 'constructor', 'const', 'cuOnstrul');
        });
        test('Unexpected suggestion scoring, #28791', function () {
            assertTopScore(filters_1.fuzzyScore, '_lines', 1, '_lineStarts', '_lines');
            assertTopScore(filters_1.fuzzyScore, '_lines', 1, '_lineS', '_lines');
            assertTopScore(filters_1.fuzzyScore, '_lineS', 0, '_lineS', '_lines');
        });
        test.skip('Bad completion ranking changes valid variable name to class name when pressing "." #187055', function () {
            assertTopScore(filters_1.fuzzyScore, 'a', 1, 'A', 'a');
            assertTopScore(filters_1.fuzzyScore, 'theme', 1, 'Theme', 'theme');
        });
        test('HTML closing tag proposal filtered out #38880', function () {
            assertMatches('\t\t<', '\t\t</body>', '^\t^\t^</body>', filters_1.fuzzyScore, { patternPos: 0 });
            assertMatches('\t\t<', '\t\t</body>', '\t\t^</body>', filters_1.fuzzyScore, { patternPos: 2 });
            assertMatches('\t<', '\t</body>', '\t^</body>', filters_1.fuzzyScore, { patternPos: 1 });
        });
        test('fuzzyScoreGraceful', () => {
            assertMatches('rlut', 'result', undefined, filters_1.fuzzyScore);
            assertMatches('rlut', 'result', '^res^u^l^t', filters_1.fuzzyScoreGraceful);
            assertMatches('cno', 'console', '^co^ns^ole', filters_1.fuzzyScore);
            assertMatches('cno', 'console', '^co^ns^ole', filters_1.fuzzyScoreGraceful);
            assertMatches('cno', 'console', '^c^o^nsole', filters_1.fuzzyScoreGracefulAggressive);
            assertMatches('cno', 'co_new', '^c^o_^new', filters_1.fuzzyScoreGraceful);
            assertMatches('cno', 'co_new', '^c^o_^new', filters_1.fuzzyScoreGracefulAggressive);
        });
        test('List highlight filter: Not all characters from match are highlighterd #66923', () => {
            assertMatches('foo', 'barbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar_foo', 'barbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar_^f^o^o', filters_1.fuzzyScore);
        });
        test('Autocompletion is matched against truncated filterText to 54 characters #74133', () => {
            assertMatches('foo', 'ffffffffffffffffffffffffffffbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar_foo', 'ffffffffffffffffffffffffffffbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar_^f^o^o', filters_1.fuzzyScore);
            assertMatches('Aoo', 'Affffffffffffffffffffffffffffbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar_foo', '^Affffffffffffffffffffffffffffbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar_f^o^o', filters_1.fuzzyScore);
            assertMatches('foo', 'Gffffffffffffffffffffffffffffbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar_foo', undefined, filters_1.fuzzyScore);
        });
        test('"Go to Symbol" with the exact method name doesn\'t work as expected #84787', function () {
            const match = (0, filters_1.fuzzyScore)(':get', ':get', 1, 'get', 'get', 0, { firstMatchCanBeWeak: true, boostFullMatch: true });
            assert.ok(Boolean(match));
        });
        test('Wrong highlight after emoji #113404', function () {
            assertMatches('di', '✨div classname=""></div>', '✨^d^iv classname=""></div>', filters_1.fuzzyScore);
            assertMatches('di', 'adiv classname=""></div>', 'adiv classname=""></^d^iv>', filters_1.fuzzyScore);
        });
        test('Suggestion is not highlighted #85826', function () {
            assertMatches('SemanticTokens', 'SemanticTokensEdits', '^S^e^m^a^n^t^i^c^T^o^k^e^n^sEdits', filters_1.fuzzyScore);
            assertMatches('SemanticTokens', 'SemanticTokensEdits', '^S^e^m^a^n^t^i^c^T^o^k^e^n^sEdits', filters_1.fuzzyScoreGracefulAggressive);
        });
        test('IntelliSense completion not correctly highlighting text in front of cursor #115250', function () {
            assertMatches('lo', 'log', '^l^og', filters_1.fuzzyScore);
            assertMatches('.lo', 'log', '^l^og', filters_1.anyScore);
            assertMatches('.', 'log', 'log', filters_1.anyScore);
        });
        test('anyScore should not require a strong first match', function () {
            assertMatches('bar', 'foobAr', 'foo^b^A^r', filters_1.anyScore);
            assertMatches('bar', 'foobar', 'foo^b^a^r', filters_1.anyScore);
        });
        test('configurable full match boost', function () {
            const prefix = 'create';
            const a = 'createModelServices';
            const b = 'create';
            const aBoost = (0, filters_1.fuzzyScore)(prefix, prefix, 0, a, a.toLowerCase(), 0, { boostFullMatch: true, firstMatchCanBeWeak: true });
            const bBoost = (0, filters_1.fuzzyScore)(prefix, prefix, 0, b, b.toLowerCase(), 0, { boostFullMatch: true, firstMatchCanBeWeak: true });
            assert.ok(aBoost);
            assert.ok(bBoost);
            assert.ok(aBoost[0] < bBoost[0]);
            const aScore = (0, filters_1.fuzzyScore)(prefix, prefix, 0, a, a.toLowerCase(), 0, { boostFullMatch: false, firstMatchCanBeWeak: true });
            const bScore = (0, filters_1.fuzzyScore)(prefix, prefix, 0, b, b.toLowerCase(), 0, { boostFullMatch: false, firstMatchCanBeWeak: true });
            assert.ok(aScore);
            assert.ok(bScore);
            assert.ok(aScore[0] === bScore[0]);
        });
        test('Unexpected suggest highlighting ignores whole word match in favor of matching first letter#147423', function () {
            assertMatches('i', 'machine/{id}', 'machine/{^id}', filters_1.fuzzyScore);
            assertMatches('ok', 'obobobf{ok}/user', '^obobobf{o^k}/user', filters_1.fuzzyScore);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVycy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2ZpbHRlcnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFRQSxTQUFTLFFBQVEsQ0FBQyxNQUFlLEVBQUUsSUFBWSxFQUFFLGtCQUEwQixFQUFFLFVBQTZDO1FBQ3pILE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUMzQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxpQkFBaUIsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELElBQUksVUFBVSxFQUFFLENBQUM7WUFDaEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLFdBQVcsQ0FBQyxNQUFlLEVBQUUsSUFBWSxFQUFFLGtCQUEwQjtRQUM3RSxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLEVBQUUsR0FBRyxJQUFJLFlBQVksa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFFRCxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUNyQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7WUFDZixJQUFJLE1BQWUsQ0FBQztZQUNwQixJQUFJLFFBQWtCLENBQUM7WUFDdkIsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFTLEVBQUUsQ0FBVTtnQkFDaEQsT0FBTyxjQUF3QixRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLENBQUMsQ0FBQztZ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QUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6RixRQUFRLENBQUMsc0JBQVksRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUxRixRQUFRLENBQUMsc0JBQVksRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RHLFFBQVEsQ0FBQyxzQkFBWSxFQUFFLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkcsUUFBUSxDQUFDLHNCQUFZLEVBQUUsTUFBTSxFQUFFLHFCQUFxQixFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV4RyxXQUFXLENBQUMsc0JBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDN0MsV0FBVyxDQUFDLHNCQUFZLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRTdDLFFBQVEsQ0FBQyxzQkFBWSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEtB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