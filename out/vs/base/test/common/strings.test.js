define(["require", "exports", "assert", "vs/base/common/strings", "vs/base/test/common/utils"], function (require, exports, assert, strings, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Strings', () => {
        test('equalsIgnoreCase', () => {
            assert(strings.equalsIgnoreCase('', ''));
            assert(!strings.equalsIgnoreCase('', '1'));
            assert(!strings.equalsIgnoreCase('1', ''));
            assert(strings.equalsIgnoreCase('a', 'a'));
            assert(strings.equalsIgnoreCase('abc', 'Abc'));
            assert(strings.equalsIgnoreCase('abc', 'ABC'));
            assert(strings.equalsIgnoreCase('Höhenmeter', 'HÖhenmeter'));
            assert(strings.equalsIgnoreCase('ÖL', 'Öl'));
        });
        test('beginsWithIgnoreCase', () => {
            assert(strings.startsWithIgnoreCase('', ''));
            assert(!strings.startsWithIgnoreCase('', '1'));
            assert(strings.startsWithIgnoreCase('1', ''));
            assert(strings.startsWithIgnoreCase('a', 'a'));
            assert(strings.startsWithIgnoreCase('abc', 'Abc'));
            assert(strings.startsWithIgnoreCase('abc', 'ABC'));
            assert(strings.startsWithIgnoreCase('Höhenmeter', 'HÖhenmeter'));
            assert(strings.startsWithIgnoreCase('ÖL', 'Öl'));
            assert(strings.startsWithIgnoreCase('alles klar', 'a'));
            assert(strings.startsWithIgnoreCase('alles klar', 'A'));
            assert(strings.startsWithIgnoreCase('alles klar', 'alles k'));
            assert(strings.startsWithIgnoreCase('alles klar', 'alles K'));
            assert(strings.startsWithIgnoreCase('alles klar', 'ALLES K'));
            assert(strings.startsWithIgnoreCase('alles klar', 'alles klar'));
            assert(strings.startsWithIgnoreCase('alles klar', 'ALLES KLAR'));
            assert(!strings.startsWithIgnoreCase('alles klar', ' ALLES K'));
            assert(!strings.startsWithIgnoreCase('alles klar', 'ALLES K '));
            assert(!strings.startsWithIgnoreCase('alles klar', 'öALLES K '));
            assert(!strings.startsWithIgnoreCase('alles klar', ' '));
            assert(!strings.startsWithIgnoreCase('alles klar', 'ö'));
        });
        test('compareIgnoreCase', () => {
            function assertCompareIgnoreCase(a, b, recurse = true) {
                let actual = strings.compareIgnoreCase(a, b);
                actual = actual > 0 ? 1 : actual < 0 ? -1 : actual;
                let expected = strings.compare(a.toLowerCase(), b.toLowerCase());
                expected = expected > 0 ? 1 : expected < 0 ? -1 : expected;
                assert.strictEqual(actual, expected, `${a} <> ${b}`);
                if (recurse) {
                    assertCompareIgnoreCase(b, a, false);
                }
            }
            assertCompareIgnoreCase('', '');
            assertCompareIgnoreCase('abc', 'ABC');
            assertCompareIgnoreCase('abc', 'ABc');
            assertCompareIgnoreCase('abc', 'ABcd');
            assertCompareIgnoreCase('abc', 'abcd');
            assertCompareIgnoreCase('foo', 'föo');
            assertCompareIgnoreCase('Code', 'code');
            assertCompareIgnoreCase('Code', 'cöde');
            assertCompareIgnoreCase('B', 'a');
            assertCompareIgnoreCase('a', 'B');
            assertCompareIgnoreCase('b', 'a');
            assertCompareIgnoreCase('a', 'b');
            assertCompareIgnoreCase('aa', 'ab');
            assertCompareIgnoreCase('aa', 'aB');
            assertCompareIgnoreCase('aa', 'aA');
            assertCompareIgnoreCase('a', 'aa');
            assertCompareIgnoreCase('ab', 'aA');
            assertCompareIgnoreCase('O', '/');
        });
        test('compareIgnoreCase (substring)', () => {
            function assertCompareIgnoreCase(a, b, aStart, aEnd, bStart, bEnd, recurse = true) {
                let actual = strings.compareSubstringIgnoreCase(a, b, aStart, aEnd, bStart, bEnd);
                actual = actual > 0 ? 1 : actual < 0 ? -1 : actual;
                let expected = strings.compare(a.toLowerCase().substring(aStart, aEnd), b.toLowerCase().substring(bStart, bEnd));
                expected = expected > 0 ? 1 : expected < 0 ? -1 : expected;
                assert.strictEqual(actual, expected, `${a} <> ${b}`);
                if (recurse) {
                    assertCompareIgnoreCase(b, a, bStart, bEnd, aStart, aEnd, false);
                }
            }
            assertCompareIgnoreCase('', '', 0, 0, 0, 0);
            assertCompareIgnoreCase('abc', 'ABC', 0, 1, 0, 1);
            assertCompareIgnoreCase('abc', 'Aabc', 0, 3, 1, 4);
            assertCompareIgnoreCase('abcABc', 'ABcd', 3, 6, 0, 4);
        });
        test('format', () => {
            assert.strictEqual(strings.format('Foo Bar'), 'Foo Bar');
            assert.strictEqual(strings.format('Foo {0} Bar'), 'Foo {0} Bar');
            assert.strictEqual(strings.format('Foo {0} Bar', 'yes'), 'Foo yes Bar');
            assert.strictEqual(strings.format('Foo {0} Bar {0}', 'yes'), 'Foo yes Bar yes');
            assert.strictEqual(strings.format('Foo {0} Bar {1}{2}', 'yes'), 'Foo yes Bar {1}{2}');
            assert.strictEqual(strings.format('Foo {0} Bar {1}{2}', 'yes', undefined), 'Foo yes Bar undefined{2}');
            assert.strictEqual(strings.format('Foo {0} Bar {1}{2}', 'yes', 5, false), 'Foo yes Bar 5false');
            assert.strictEqual(strings.format('Foo {0} Bar. {1}', '(foo)', '.test'), 'Foo (foo) Bar. .test');
        });
        test('format2', () => {
            assert.strictEqual(strings.format2('Foo Bar', {}), 'Foo Bar');
            assert.strictEqual(strings.format2('Foo {oops} Bar', {}), 'Foo {oops} Bar');
            assert.strictEqual(strings.format2('Foo {foo} Bar', { foo: 'bar' }), 'Foo bar Bar');
            assert.strictEqual(strings.format2('Foo {foo} Bar {foo}', { foo: 'bar' }), 'Foo bar Bar bar');
            assert.strictEqual(strings.format2('Foo {foo} Bar {bar}{boo}', { foo: 'bar' }), 'Foo bar Bar {bar}{boo}');
            assert.strictEqual(strings.format2('Foo {foo} Bar {bar}{boo}', { foo: 'bar', bar: 'undefined' }), 'Foo bar Bar undefined{boo}');
            assert.strictEqual(strings.format2('Foo {foo} Bar {bar}{boo}', { foo: 'bar', bar: '5', boo: false }), 'Foo bar Bar 5false');
            assert.strictEqual(strings.format2('Foo {foo} Bar. {bar}', { foo: '(foo)', bar: '.test' }), 'Foo (foo) Bar. .test');
        });
        test('lcut', () => {
            assert.strictEqual(strings.lcut('foo bar', 0), '');
            assert.strictEqual(strings.lcut('foo bar', 1), 'bar');
            assert.strictEqual(strings.lcut('foo bar', 3), 'bar');
            assert.strictEqual(strings.lcut('foo bar', 4), 'bar'); // Leading whitespace trimmed
            assert.strictEqual(strings.lcut('foo bar', 5), 'foo bar');
            assert.strictEqual(strings.lcut('test string 0.1.2.3', 3), '2.3');
            assert.strictEqual(strings.lcut('foo bar', 0, '…'), '…');
            assert.strictEqual(strings.lcut('foo bar', 1, '…'), '…bar');
            assert.strictEqual(strings.lcut('foo bar', 3, '…'), '…bar');
            assert.strictEqual(strings.lcut('foo bar', 4, '…'), '…bar'); // Leading whitespace trimmed
            assert.strictEqual(strings.lcut('foo bar', 5, '…'), 'foo bar');
            assert.strictEqual(strings.lcut('test string 0.1.2.3', 3, '…'), '…2.3');
            assert.strictEqual(strings.lcut('', 10), '');
            assert.strictEqual(strings.lcut('a', 10), 'a');
            assert.strictEqual(strings.lcut(' a', 10), 'a');
            assert.strictEqual(strings.lcut('            a', 10), 'a');
            assert.strictEqual(strings.lcut(' bbbb       a', 10), 'bbbb       a');
            assert.strictEqual(strings.lcut('............a', 10), '............a');
            assert.strictEqual(strings.lcut('', 10, '…'), '');
            assert.strictEqual(strings.lcut('a', 10, '…'), 'a');
            assert.strictEqual(strings.lcut(' a', 10, '…'), 'a');
            assert.strictEqual(strings.lcut('            a', 10, '…'), 'a');
            assert.strictEqual(strings.lcut(' bbbb       a', 10, '…'), 'bbbb       a');
            assert.strictEqual(strings.lcut('............a', 10, '…'), '............a');
        });
        test('escape', () => {
            assert.strictEqual(strings.escape(''), '');
            assert.strictEqual(strings.escape('foo'), 'foo');
            assert.strictEqual(strings.escape('foo bar'), 'foo bar');
            assert.strictEqual(strings.escape('<foo bar>'), '&lt;foo bar&gt;');
            assert.strictEqual(strings.escape('<foo>Hello</foo>'), '&lt;foo&gt;Hello&lt;/foo&gt;');
        });
        test('ltrim', () => {
            assert.strictEqual(strings.ltrim('foo', 'f'), 'oo');
            assert.strictEqual(strings.ltrim('foo', 'o'), 'foo');
            assert.strictEqual(strings.ltrim('http://www.test.de', 'http://'), 'www.test.de');
            assert.strictEqual(strings.ltrim('/foo/', '/'), 'foo/');
            assert.strictEqual(strings.ltrim('//foo/', '/'), 'foo/');
            assert.strictEqual(strings.ltrim('/', ''), '/');
            assert.strictEqual(strings.ltrim('/', '/'), '');
            assert.strictEqual(strings.ltrim('///', '/'), '');
            assert.strictEqual(strings.ltrim('', ''), '');
            assert.strictEqual(strings.ltrim('', '/'), '');
        });
        test('rtrim', () => {
            assert.strictEqual(strings.rtrim('foo', 'o'), 'f');
            assert.strictEqual(strings.rtrim('foo', 'f'), 'foo');
            assert.strictEqual(strings.rtrim('http://www.test.de', '.de'), 'http://www.test');
            assert.strictEqual(strings.rtrim('/foo/', '/'), '/foo');
            assert.strictEqual(strings.rtrim('/foo//', '/'), '/foo');
            assert.strictEqual(strings.rtrim('/', ''), '/');
            assert.strictEqual(strings.rtrim('/', '/'), '');
            assert.strictEqual(strings.rtrim('///', '/'), '');
            assert.strictEqual(strings.rtrim('', ''), '');
            assert.strictEqual(strings.rtrim('', '/'), '');
        });
        test('trim', () => {
            assert.strictEqual(strings.trim(' foo '), 'foo');
            assert.strictEqual(strings.trim('  foo'), 'foo');
            assert.strictEqual(strings.trim('bar  '), 'bar');
            assert.strictEqual(strings.trim('   '), '');
            assert.strictEqual(strings.trim('foo bar', 'bar'), 'foo ');
        });
        test('trimWhitespace', () => {
            assert.strictEqual(' foo '.trim(), 'foo');
            assert.strictEqual('	 foo	'.trim(), 'foo');
            assert.strictEqual('  foo'.trim(), 'foo');
            assert.strictEqual('bar  '.trim(), 'bar');
            assert.strictEqual('   '.trim(), '');
            assert.strictEqual(' 	  '.trim(), '');
        });
        test('lastNonWhitespaceIndex', () => {
            assert.strictEqual(strings.lastNonWhitespaceIndex('abc  \t \t '), 2);
            assert.strictEqual(strings.lastNonWhitespaceIndex('abc'), 2);
            assert.strictEqual(strings.lastNonWhitespaceIndex('abc\t'), 2);
            assert.strictEqual(strings.lastNonWhitespaceIndex('abc '), 2);
            assert.strictEqual(strings.lastNonWhitespaceIndex('abc  \t \t '), 2);
            assert.strictEqual(strings.lastNonWhitespaceIndex('abc  \t \t abc \t \t '), 11);
            assert.strictEqual(strings.lastNonWhitespaceIndex('abc  \t \t abc \t \t ', 8), 2);
            assert.strictEqual(strings.lastNonWhitespaceIndex('  \t \t '), -1);
        });
        test('containsRTL', () => {
            assert.strictEqual(strings.containsRTL('a'), false);
            assert.strictEqual(strings.containsRTL(''), false);
            assert.strictEqual(strings.containsRTL(strings.UTF8_BOM_CHARACTER + 'a'), false);
            assert.strictEqual(strings.containsRTL('hello world!'), false);
            assert.strictEqual(strings.containsRTL('a📚📚b'), false);
            assert.strictEqual(strings.containsRTL('هناك حقيقة مثبتة منذ زمن طويل'), true);
            assert.strictEqual(strings.containsRTL('זוהי עובדה מבוססת שדעתו'), true);
        });
        test('issue #115221: isEmojiImprecise misses ⭐', () => {
            const codePoint = strings.getNextCodePoint('⭐', '⭐'.length, 0);
            assert.strictEqual(strings.isEmojiImprecise(codePoint), true);
        });
        test('isBasicASCII', () => {
            function assertIsBasicASCII(str, expected) {
                assert.strictEqual(strings.isBasicASCII(str), expected, str + ` (${str.charCodeAt(0)})`);
            }
            assertIsBasicASCII('abcdefghijklmnopqrstuvwxyz', true);
            assertIsBasicASCII('ABCDEFGHIJKLMNOPQRSTUVWXYZ', true);
            assertIsBasicASCII('1234567890', true);
            assertIsBasicASCII('`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/?', true);
            assertIsBasicASCII(' ', true);
            assertIsBasicASCII('\t', true);
            assertIsBasicASCII('\n', true);
            assertIsBasicASCII('\r', true);
            let ALL = '\r\t\n';
            for (let i = 32; i < 127; i++) {
                ALL += String.fromCharCode(i);
            }
            assertIsBasicASCII(ALL, true);
            assertIsBasicASCII(String.fromCharCode(31), false);
            assertIsBasicASCII(String.fromCharCode(127), false);
            assertIsBasicASCII('ü', false);
            assertIsBasicASCII('a📚📚b', false);
        });
        test('createRegExp', () => {
            // Empty
            assert.throws(() => strings.createRegExp('', false));
            // Escapes appropriately
            assert.strictEqual(strings.createRegExp('abc', false).source, 'abc');
            assert.strictEqual(strings.createRegExp('([^ ,.]*)', false).source, '\\(\\[\\^ ,\\.\\]\\*\\)');
            assert.strictEqual(strings.createRegExp('([^ ,.]*)', true).source, '([^ ,.]*)');
            // Whole word
            assert.strictEqual(strings.createRegExp('abc', false, { wholeWord: true }).source, '\\babc\\b');
            assert.strictEqual(strings.createRegExp('abc', true, { wholeWord: true }).source, '\\babc\\b');
            assert.strictEqual(strings.createRegExp(' abc', true, { wholeWord: true }).source, ' abc\\b');
            assert.strictEqual(strings.createRegExp('abc ', true, { wholeWord: true }).source, '\\babc ');
            assert.strictEqual(strings.createRegExp(' abc ', true, { wholeWord: true }).source, ' abc ');
            const regExpWithoutFlags = strings.createRegExp('abc', true);
            assert(!regExpWithoutFlags.global);
            assert(regExpWithoutFlags.ignoreCase);
            assert(!regExpWithoutFlags.multiline);
            const regExpWithFlags = strings.createRegExp('abc', true, { global: true, matchCase: true, multiline: true });
            assert(regExpWithFlags.global);
            assert(!regExpWithFlags.ignoreCase);
            assert(regExpWithFlags.multiline);
        });
        test('getLeadingWhitespace', () => {
            assert.strictEqual(strings.getLeadingWhitespace('  foo'), '  ');
            assert.strictEqual(strings.getLeadingWhitespace('  foo', 2), '');
            assert.strictEqual(strings.getLeadingWhitespace('  foo', 1, 1), '');
            assert.strictEqual(strings.getLeadingWhitespace('  foo', 0, 1), ' ');
            assert.strictEqual(strings.getLeadingWhitespace('  '), '  ');
            assert.strictEqual(strings.getLeadingWhitespace('  ', 1), ' ');
            assert.strictEqual(strings.getLeadingWhitespace('  ', 0, 1), ' ');
            assert.strictEqual(strings.getLeadingWhitespace('\t\tfunction foo(){', 0, 1), '\t');
            assert.strictEqual(strings.getLeadingWhitespace('\t\tfunction foo(){', 0, 2), '\t\t');
        });
        test('fuzzyContains', () => {
            assert.ok(!strings.fuzzyContains((undefined), null));
            assert.ok(strings.fuzzyContains('hello world', 'h'));
            assert.ok(!strings.fuzzyContains('hello world', 'q'));
            assert.ok(strings.fuzzyContains('hello world', 'hw'));
            assert.ok(strings.fuzzyContains('hello world', 'horl'));
            assert.ok(strings.fuzzyContains('hello world', 'd'));
            assert.ok(!strings.fuzzyContains('hello world', 'wh'));
            assert.ok(!strings.fuzzyContains('d', 'dd'));
        });
        test('startsWithUTF8BOM', () => {
            assert(strings.startsWithUTF8BOM(strings.UTF8_BOM_CHARACTER));
            assert(strings.startsWithUTF8BOM(strings.UTF8_BOM_CHARACTER + 'a'));
            assert(strings.startsWithUTF8BOM(strings.UTF8_BOM_CHARACTER + 'aaaaaaaaaa'));
            assert(!strings.startsWithUTF8BOM(' ' + strings.UTF8_BOM_CHARACTER));
            assert(!strings.startsWithUTF8BOM('foo'));
            assert(!strings.startsWithUTF8BOM(''));
        });
        test('stripUTF8BOM', () => {
            assert.strictEqual(strings.stripUTF8BOM(strings.UTF8_BOM_CHARACTER), '');
            assert.strictEqual(strings.stripUTF8BOM(strings.UTF8_BOM_CHARACTER + 'foobar'), 'foobar');
            assert.strictEqual(strings.stripUTF8BOM('foobar' + strings.UTF8_BOM_CHARACTER), 'foobar' + strings.UTF8_BOM_CHARACTER);
            assert.strictEqual(strings.stripUTF8BOM('abc'), 'abc');
            assert.strictEqual(strings.stripUTF8BOM(''), '');
        });
        test('containsUppercaseCharacter', () => {
            [
                [null, false],
                ['', false],
                ['foo', false],
                ['föö', false],
                ['ناك', false],
                ['מבוססת', false],
                ['😀', false],
                ['(#@()*&%()@*#&09827340982374}{:">?></\'\\~`', false],
                ['Foo', true],
                ['FOO', true],
                ['FöÖ', true],
                ['FöÖ', true],
                ['\\Foo', true],
            ].forEach(([str, result]) => {
                assert.strictEqual(strings.containsUppercaseCharacter(str), result, `Wrong result for ${str}`);
            });
        });
        test('containsUppercaseCharacter (ignoreEscapedChars)', () => {
            [
                ['\\Woo', false],
                ['f\\S\\S', false],
                ['foo', false],
                ['Foo', true],
            ].forEach(([str, result]) => {
                assert.strictEqual(strings.containsUppercaseCharacter(str, true), result, `Wrong result for ${str}`);
            });
        });
        test('uppercaseFirstLetter', () => {
            [
                ['', ''],
                ['foo', 'Foo'],
                ['f', 'F'],
                ['123', '123'],
                ['.a', '.a'],
            ].forEach(([inStr, result]) => {
                assert.strictEqual(strings.uppercaseFirstLetter(inStr), result, `Wrong result for ${inStr}`);
            });
        });
        test('getNLines', () => {
            assert.strictEqual(strings.getNLines('', 5), '');
            assert.strictEqual(strings.getNLines('foo', 5), 'foo');
            assert.strictEqual(strings.getNLines('foo\nbar', 5), 'foo\nbar');
            assert.strictEqual(strings.getNLines('foo\nbar', 2), 'foo\nbar');
            assert.strictEqual(strings.getNLines('foo\nbar', 1), 'foo');
            assert.strictEqual(strings.getNLines('foo\nbar'), 'foo');
            assert.strictEqual(strings.getNLines('foo\nbar\nsomething', 2), 'foo\nbar');
            assert.strictEqual(strings.getNLines('foo', 0), '');
        });
        test('getGraphemeBreakType', () => {
            assert.strictEqual(strings.getGraphemeBreakType(0xBC1), 7 /* strings.GraphemeBreakType.SpacingMark */);
        });
        test('truncate', () => {
            assert.strictEqual('hello world', strings.truncate('hello world', 100));
            assert.strictEqual('hello…', strings.truncate('hello world', 5));
        });
        test('truncateMiddle', () => {
            assert.strictEqual('hello world', strings.truncateMiddle('hello world', 100));
            assert.strictEqual('he…ld', strings.truncateMiddle('hello world', 5));
        });
        test('replaceAsync', async () => {
            let i = 0;
            assert.strictEqual(await strings.replaceAsync('abcabcabcabc', /b(.)/g, async (match, after) => {
                assert.strictEqual(match, 'bc');
                assert.strictEqual(after, 'c');
                return `${i++}${after}`;
            }), 'a0ca1ca2ca3c');
        });
        test('removeAnsiEscapeCodes', () => {
            const CSI = '\x1b\[';
            const sequences = [
                // Base cases from https://invisible-island.net/xterm/ctlseqs/ctlseqs.html#h3-Functions-using-CSI-_-ordered-by-the-final-character_s_
                `${CSI}42@`,
                `${CSI}42 @`,
                `${CSI}42A`,
                `${CSI}42 A`,
                `${CSI}42B`,
                `${CSI}42C`,
                `${CSI}42D`,
                `${CSI}42E`,
                `${CSI}42F`,
                `${CSI}42G`,
                `${CSI}42;42H`,
                `${CSI}42I`,
                `${CSI}42J`,
                `${CSI}?42J`,
                `${CSI}42K`,
                `${CSI}?42K`,
                `${CSI}42L`,
                `${CSI}42M`,
                `${CSI}42P`,
                `${CSI}#P`,
                `${CSI}3#P`,
                `${CSI}#Q`,
                `${CSI}3#Q`,
                `${CSI}#R`,
                `${CSI}42S`,
                `${CSI}?1;2;3S`,
                `${CSI}42T`,
                `${CSI}42;42;42;42;42T`,
                `${CSI}>3T`,
                `${CSI}42X`,
                `${CSI}42Z`,
                `${CSI}42^`,
                `${CSI}42\``,
                `${CSI}42a`,
                `${CSI}42b`,
                `${CSI}42c`,
                `${CSI}=42c`,
                `${CSI}>42c`,
                `${CSI}42d`,
                `${CSI}42e`,
                `${CSI}42;42f`,
                `${CSI}42g`,
                `${CSI}3h`,
                `${CSI}?3h`,
                `${CSI}42i`,
                `${CSI}?42i`,
                `${CSI}3l`,
                `${CSI}?3l`,
                `${CSI}3m`,
                `${CSI}>0;0m`,
                `${CSI}>0m`,
                `${CSI}?0m`,
                `${CSI}42n`,
                `${CSI}>42n`,
                `${CSI}?42n`,
                `${CSI}>42p`,
                `${CSI}!p`,
                `${CSI}0;0"p`,
                `${CSI}42$p`,
                `${CSI}?42$p`,
                `${CSI}#p`,
                `${CSI}3#p`,
                `${CSI}>42q`,
                `${CSI}42q`,
                `${CSI}42 q`,
                `${CSI}42"q`,
                `${CSI}#q`,
                `${CSI}42;42r`,
                `${CSI}?3r`,
                `${CSI}0;0;0;0;3$r`,
                `${CSI}s`,
                `${CSI}0;0s`,
                `${CSI}>42s`,
                `${CSI}?3s`,
                `${CSI}42;42;42t`,
                `${CSI}>3t`,
                `${CSI}42 t`,
                `${CSI}0;0;0;0;3$t`,
                `${CSI}u`,
                `${CSI}42 u`,
                `${CSI}0;0;0;0;0;0;0;0$v`,
                `${CSI}42$w`,
                `${CSI}0;0;0;0'w`,
                `${CSI}42x`,
                `${CSI}42*x`,
                `${CSI}0;0;0;0;0$x`,
                `${CSI}42#y`,
                `${CSI}0;0;0;0;0;0*y`,
                `${CSI}42;0'z`,
                `${CSI}0;1;2;4$z`,
                `${CSI}3'{`,
                `${CSI}#{`,
                `${CSI}3#{`,
                `${CSI}0;0;0;0\${`,
                `${CSI}0;0;0;0#|`,
                `${CSI}42$|`,
                `${CSI}42'|`,
                `${CSI}42*|`,
                `${CSI}#}`,
                `${CSI}42'}`,
                `${CSI}42$}`,
                `${CSI}42'~`,
                `${CSI}42$~`,
                // Common SGR cases:
                `${CSI}1;31m`, // multiple attrs
                `${CSI}105m`, // bright background
                `${CSI}48:5:128m`, // 256 indexed color
                `${CSI}48;5;128m`, // 256 indexed color alt
                `${CSI}38:2:0:255:255:255m`, // truecolor
                `${CSI}38;2;255;255;255m`, // truecolor alt
                // Custom sequences:
                '\x1b]633;SetMark;\x07',
                '\x1b]633;P;Cwd=/foo\x07',
            ];
            for (const sequence of sequences) {
                assert.strictEqual(strings.removeAnsiEscapeCodes(`hello${sequence}world`), 'helloworld', `expect to remove ${JSON.stringify(sequence)}`);
            }
            for (const sequence of sequences) {
                assert.deepStrictEqual([...strings.forAnsiStringParts(`hello${sequence}world`)], [{ isCode: false, str: 'hello' }, { isCode: true, str: sequence }, { isCode: false, str: 'world' }], `expect to forAnsiStringParts ${JSON.stringify(sequence)}`);
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    test('htmlAttributeEncodeValue', () => {
        assert.strictEqual(strings.htmlAttributeEncodeValue(''), '');
        assert.strictEqual(strings.htmlAttributeEncodeValue('abc'), 'abc');
        assert.strictEqual(strings.htmlAttributeEncodeValue('<script>alert("Hello")</script>'), '&lt;script&gt;alert(&quot;Hello&quot;)&lt;/script&gt;');
        assert.strictEqual(strings.htmlAttributeEncodeValue('Hello & World'), 'Hello &amp; World');
        assert.strictEqual(strings.htmlAttributeEncodeValue('"Hello"'), '&quot;Hello&quot;');
        assert.strictEqual(strings.htmlAttributeEncodeValue('\'Hello\''), '&apos;Hello&apos;');
        assert.strictEqual(strings.htmlAttributeEncodeValue('<>&\'"'), '&lt;&gt;&amp;&apos;&quot;');
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5ncy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL3N0cmluZ3MudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFRQSxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUNyQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1lBQzdCLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzQyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1lBQ2pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsb0JB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LEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxNQUFNO2dCQUNaLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxJQUFJO2dCQUNWLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxJQUFJO2dCQUNWLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxJQUFJO2dCQUNWLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxTQUFTO2dCQUNmLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxpQkFBaUI7Z0JBQ3ZCLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxNQUFNO2dCQUNaLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxNQUFNO2dCQUNaLEdBQUcsR0FBRyxNQUFNO2dCQUNaLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxRQUFRO2dCQUNkLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxJQUFJO2dCQUNWLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxNQUFNO2dCQUNaLEdBQUcsR0FBRyxJQUFJO2dCQUNWLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxJQUFJO2dCQUNWLEdBQUcsR0FBRyxPQUFPO2dCQUNiLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxLQUFLO2dCQUNYLEdBQUcsR0FBRyxNQUFNO2dCQUNaLEdBQUcsR0FBRyxNQUFNO2dCQUNaLEdBQUcsR0FBRyxNQUFNO2dCQUNaLEdBQUcsR0FBRyxJQUFJ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