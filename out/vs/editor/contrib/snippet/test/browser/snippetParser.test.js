define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/contrib/snippet/browser/snippetParser"], function (require, exports, assert, utils_1, snippetParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SnippetParser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Scanner', () => {
            const scanner = new snippetParser_1.Scanner();
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('abc');
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('{{abc}}');
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('abc() ');
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 10 /* TokenType.Format */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('abc 123');
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 10 /* TokenType.Format */);
            assert.strictEqual(scanner.next().type, 8 /* TokenType.Int */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('$foo');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('$foo_bar');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('$foo-bar');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 12 /* TokenType.Dash */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('${foo}');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('${1223:foo}');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 8 /* TokenType.Int */);
            assert.strictEqual(scanner.next().type, 1 /* TokenType.Colon */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('\\${}');
            assert.strictEqual(scanner.next().type, 5 /* TokenType.Backslash */);
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            scanner.text('${foo/regex/format/option}');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 6 /* TokenType.Forwardslash */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 6 /* TokenType.Forwardslash */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 6 /* TokenType.Forwardslash */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
        });
        function assertText(value, expected) {
            const actual = snippetParser_1.SnippetParser.asInsertText(value);
            assert.strictEqual(actual, expected);
        }
        function assertMarker(input, ...ctors) {
            let marker;
            if (input instanceof snippetParser_1.TextmateSnippet) {
                marker = [...input.children];
            }
            else if (typeof input === 'string') {
                const p = new snippetParser_1.SnippetParser();
                marker = p.parse(input).children;
            }
            else {
                marker = [...input];
            }
            while (marker.length > 0) {
                const m = marker.pop();
                const ctor = ctors.pop();
                assert.ok(m instanceof ctor);
            }
            assert.strictEqual(marker.length, ctors.length);
            assert.strictEqual(marker.length, 0);
        }
        function assertTextAndMarker(value, escaped, ...ctors) {
            assertText(value, escaped);
            assertMarker(value, ...ctors);
        }
        function assertEscaped(value, expected) {
            const actual = snippetParser_1.SnippetParser.escape(value);
            assert.strictEqual(actual, expected);
        }
        test('Parser, escaped', function () {
            assertEscaped('foo$0', 'foo\\$0');
            assertEscaped('foo\\$0', 'foo\\\\\\$0');
            assertEscaped('f$1oo$0', 'f\\$1oo\\$0');
            assertEscaped('${1:foo}$0', '\\${1:foo\\}\\$0');
            assertEscaped('$', '\\$');
        });
        test('Parser, text', () => {
            assertText('$', '$');
            assertText('\\\\$', '\\$');
            assertText('{', '{');
            assertText('\\}', '}');
            assertText('\\abc', '\\abc');
            assertText('foo${f:\\}}bar', 'foo}bar');
            assertText('\\{', '\\{');
            assertText('I need \\\\\\$', 'I need \\$');
            assertText('\\', '\\');
            assertText('\\{{', '\\{{');
            assertText('{{', '{{');
            assertText('{{dd', '{{dd');
            assertText('}}', '}}');
            assertText('ff}}', 'ff}}');
            assertText('farboo', 'farboo');
            assertText('far{{}}boo', 'far{{}}boo');
            assertText('far{{123}}boo', 'far{{123}}boo');
            assertText('far\\{{123}}boo', 'far\\{{123}}boo');
            assertText('far{{id:bern}}boo', 'far{{id:bern}}boo');
            assertText('far{{id:bern {{basel}}}}boo', 'far{{id:bern {{basel}}}}boo');
            assertText('far{{id:bern {{id:basel}}}}boo', 'far{{id:bern {{id:basel}}}}boo');
            assertText('far{{id:bern {{id2:basel}}}}boo', 'far{{id:bern {{id2:basel}}}}boo');
        });
        test('Parser, TM text', () => {
            assertTextAndMarker('foo${1:bar}}', 'foobar}', snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text);
            assertTextAndMarker('foo${1:bar}${2:foo}}', 'foobarfoo}', snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Placeholder, snippetParser_1.Text);
            assertTextAndMarker('foo${1:bar\\}${2:foo}}', 'foobar}foo', snippetParser_1.Text, snippetParser_1.Placeholder);
            const [, placeholder] = new snippetParser_1.SnippetParser().parse('foo${1:bar\\}${2:foo}}').children;
            const { children } = placeholder;
            assert.strictEqual(placeholder.index, 1);
            assert.ok(children[0] instanceof snippetParser_1.Text);
            assert.strictEqual(children[0].toString(), 'bar}');
            assert.ok(children[1] instanceof snippetParser_1.Placeholder);
            assert.strictEqual(children[1].toString(), 'foo');
        });
        test('Parser, placeholder', () => {
            assertTextAndMarker('farboo', 'farboo', snippetParser_1.Text);
            assertTextAndMarker('far{{}}boo', 'far{{}}boo', snippetParser_1.Text);
            assertTextAndMarker('far{{123}}boo', 'far{{123}}boo', snippetParser_1.Text);
            assertTextAndMarker('far\\{{123}}boo', 'far\\{{123}}boo', snippetParser_1.Text);
        });
        test('Parser, literal code', () => {
            assertTextAndMarker('far`123`boo', 'far`123`boo', snippetParser_1.Text);
            assertTextAndMarker('far\\`123\\`boo', 'far\\`123\\`boo', snippetParser_1.Text);
        });
        test('Parser, variables/tabstop', () => {
            assertTextAndMarker('$far-boo', '-boo', snippetParser_1.Variable, snippetParser_1.Text);
            assertTextAndMarker('\\$far-boo', '$far-boo', snippetParser_1.Text);
            assertTextAndMarker('far$farboo', 'far', snippetParser_1.Text, snippetParser_1.Variable);
            assertTextAndMarker('far${farboo}', 'far', snippetParser_1.Text, snippetParser_1.Variable);
            assertTextAndMarker('$123', '', snippetParser_1.Placeholder);
            assertTextAndMarker('$farboo', '', snippetParser_1.Variable);
            assertTextAndMarker('$far12boo', '', snippetParser_1.Variable);
            assertTextAndMarker('000_${far}_000', '000__000', snippetParser_1.Text, snippetParser_1.Variable, snippetParser_1.Text);
            assertTextAndMarker('FFF_${TM_SELECTED_TEXT}_FFF$0', 'FFF__FFF', snippetParser_1.Text, snippetParser_1.Variable, snippetParser_1.Text, snippetParser_1.Placeholder);
        });
        test('Parser, variables/placeholder with defaults', () => {
            assertTextAndMarker('${name:value}', 'value', snippetParser_1.Variable);
            assertTextAndMarker('${1:value}', 'value', snippetParser_1.Placeholder);
            assertTextAndMarker('${1:bar${2:foo}bar}', 'barfoobar', snippetParser_1.Placeholder);
            assertTextAndMarker('${name:value', '${name:value', snippetParser_1.Text);
            assertTextAndMarker('${1:bar${2:foobar}', '${1:barfoobar', snippetParser_1.Text, snippetParser_1.Placeholder);
        });
        test('Parser, variable transforms', function () {
            assertTextAndMarker('${foo///}', '', snippetParser_1.Variable);
            assertTextAndMarker('${foo/regex/format/gmi}', '', snippetParser_1.Variable);
            assertTextAndMarker('${foo/([A-Z][a-z])/format/}', '', snippetParser_1.Variable);
            // invalid regex
            assertTextAndMarker('${foo/([A-Z][a-z])/format/GMI}', '${foo/([A-Z][a-z])/format/GMI}', snippetParser_1.Text);
            assertTextAndMarker('${foo/([A-Z][a-z])/format/funky}', '${foo/([A-Z][a-z])/format/funky}', snippetParser_1.Text);
            assertTextAndMarker('${foo/([A-Z][a-z]/format/}', '${foo/([A-Z][a-z]/format/}', snippetParser_1.Text);
            // tricky regex
            assertTextAndMarker('${foo/m\\/atch/$1/i}', '', snippetParser_1.Variable);
            assertMarker('${foo/regex\/format/options}', snippetParser_1.Text);
            // incomplete
            assertTextAndMarker('${foo///', '${foo///', snippetParser_1.Text);
            assertTextAndMarker('${foo/regex/format/options', '${foo/regex/format/options', snippetParser_1.Text);
            // format string
            assertMarker('${foo/.*/${0:fooo}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/${1}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/$1/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/This-$1-encloses/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/complex${1:else}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/complex${1:-else}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/complex${1:+if}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/complex${1:?if:else}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/complex${1:/upcase}/i}', snippetParser_1.Variable);
        });
        test('Parser, placeholder transforms', function () {
            assertTextAndMarker('${1///}', '', snippetParser_1.Placeholder);
            assertTextAndMarker('${1/regex/format/gmi}', '', snippetParser_1.Placeholder);
            assertTextAndMarker('${1/([A-Z][a-z])/format/}', '', snippetParser_1.Placeholder);
            // tricky regex
            assertTextAndMarker('${1/m\\/atch/$1/i}', '', snippetParser_1.Placeholder);
            assertMarker('${1/regex\/format/options}', snippetParser_1.Text);
            // incomplete
            assertTextAndMarker('${1///', '${1///', snippetParser_1.Text);
            assertTextAndMarker('${1/regex/format/options', '${1/regex/format/options', snippetParser_1.Text);
        });
        test('No way to escape forward slash in snippet regex #36715', function () {
            assertMarker('${TM_DIRECTORY/src\\//$1/}', snippetParser_1.Variable);
        });
        test('No way to escape forward slash in snippet format section #37562', function () {
            assertMarker('${TM_SELECTED_TEXT/a/\\/$1/g}', snippetParser_1.Variable);
            assertMarker('${TM_SELECTED_TEXT/a/in\\/$1ner/g}', snippetParser_1.Variable);
            assertMarker('${TM_SELECTED_TEXT/a/end\\//g}', snippetParser_1.Variable);
        });
        test('Parser, placeholder with choice', () => {
            assertTextAndMarker('${1|one,two,three|}', 'one', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one|}', 'one', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one1,two2|}', 'one1', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one1\\,two2|}', 'one1,two2', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one1\\|two2|}', 'one1|two2', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one1\\atwo2|}', 'one1\\atwo2', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one,two,three,|}', '${1|one,two,three,|}', snippetParser_1.Text);
            assertTextAndMarker('${1|one,', '${1|one,', snippetParser_1.Text);
            const snippet = new snippetParser_1.SnippetParser().parse('${1|one,two,three|}');
            const expected = [
                m => m instanceof snippetParser_1.Placeholder,
                m => m instanceof snippetParser_1.Choice && m.options.length === 3 && m.options.every(x => x instanceof snippetParser_1.Text),
            ];
            snippet.walk(marker => {
                assert.ok(expected.shift()(marker));
                return true;
            });
        });
        test('Snippet choices: unable to escape comma and pipe, #31521', function () {
            assertTextAndMarker('console.log(${1|not\\, not, five, 5, 1   23|});', 'console.log(not, not);', snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text);
        });
        test('Marker, toTextmateString()', function () {
            function assertTextsnippetString(input, expected) {
                const snippet = new snippetParser_1.SnippetParser().parse(input);
                const actual = snippet.toTextmateString();
                assert.strictEqual(actual, expected);
            }
            assertTextsnippetString('$1', '$1');
            assertTextsnippetString('\\$1', '\\$1');
            assertTextsnippetString('console.log(${1|not\\, not, five, 5, 1   23|});', 'console.log(${1|not\\, not, five, 5, 1   23|});');
            assertTextsnippetString('console.log(${1|not\\, not, \\| five, 5, 1   23|});', 'console.log(${1|not\\, not, \\| five, 5, 1   23|});');
            assertTextsnippetString('${1|cho\\,ices,wi\\|th,esc\\\\aping,chall\\\\\\,enges|}', '${1|cho\\,ices,wi\\|th,esc\\\\aping,chall\\\\\\,enges|}');
            assertTextsnippetString('this is text', 'this is text');
            assertTextsnippetString('this ${1:is ${2:nested with $var}}', 'this ${1:is ${2:nested with ${var}}}');
            assertTextsnippetString('this ${1:is ${2:nested with $var}}}', 'this ${1:is ${2:nested with ${var}}}\\}');
        });
        test('Marker, toTextmateString() <-> identity', function () {
            function assertIdent(input) {
                // full loop: (1) parse input, (2) generate textmate string, (3) parse, (4) ensure both trees are equal
                const snippet = new snippetParser_1.SnippetParser().parse(input);
                const input2 = snippet.toTextmateString();
                const snippet2 = new snippetParser_1.SnippetParser().parse(input2);
                function checkCheckChildren(marker1, marker2) {
                    assert.ok(marker1 instanceof Object.getPrototypeOf(marker2).constructor);
                    assert.ok(marker2 instanceof Object.getPrototypeOf(marker1).constructor);
                    assert.strictEqual(marker1.children.length, marker2.children.length);
                    assert.strictEqual(marker1.toString(), marker2.toString());
                    for (let i = 0; i < marker1.children.length; i++) {
                        checkCheckChildren(marker1.children[i], marker2.children[i]);
                    }
                }
                checkCheckChildren(snippet, snippet2);
            }
            assertIdent('$1');
            assertIdent('\\$1');
            assertIdent('console.log(${1|not\\, not, five, 5, 1   23|});');
            assertIdent('console.log(${1|not\\, not, \\| five, 5, 1   23|});');
            assertIdent('this is text');
            assertIdent('this ${1:is ${2:nested with $var}}');
            assertIdent('this ${1:is ${2:nested with $var}}}');
            assertIdent('this ${1:is ${2:nested with $var}} and repeating $1');
        });
        test('Parser, choise marker', () => {
            const { placeholders } = new snippetParser_1.SnippetParser().parse('${1|one,two,three|}');
            assert.strictEqual(placeholders.length, 1);
            assert.ok(placeholders[0].choice instanceof snippetParser_1.Choice);
            assert.ok(placeholders[0].children[0] instanceof snippetParser_1.Choice);
            assert.strictEqual(placeholders[0].children[0].options.length, 3);
            assertText('${1|one,two,three|}', 'one');
            assertText('\\${1|one,two,three|}', '${1|one,two,three|}');
            assertText('${1\\|one,two,three|}', '${1\\|one,two,three|}');
            assertText('${1||}', '${1||}');
        });
        test('Backslash character escape in choice tabstop doesn\'t work #58494', function () {
            const { placeholders } = new snippetParser_1.SnippetParser().parse('${1|\\,,},$,\\|,\\\\|}');
            assert.strictEqual(placeholders.length, 1);
            assert.ok(placeholders[0].choice instanceof snippetParser_1.Choice);
        });
        test('Parser, only textmate', () => {
            const p = new snippetParser_1.SnippetParser();
            assertMarker(p.parse('far{{}}boo'), snippetParser_1.Text);
            assertMarker(p.parse('far{{123}}boo'), snippetParser_1.Text);
            assertMarker(p.parse('far\\{{123}}boo'), snippetParser_1.Text);
            assertMarker(p.parse('far$0boo'), snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text);
            assertMarker(p.parse('far${123}boo'), snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text);
            assertMarker(p.parse('far\\${123}boo'), snippetParser_1.Text);
        });
        test('Parser, real world', () => {
            let marker = new snippetParser_1.SnippetParser().parse('console.warn(${1: $TM_SELECTED_TEXT })').children;
            assert.strictEqual(marker[0].toString(), 'console.warn(');
            assert.ok(marker[1] instanceof snippetParser_1.Placeholder);
            assert.strictEqual(marker[2].toString(), ')');
            const placeholder = marker[1];
            assert.strictEqual(placeholder.index, 1);
            assert.strictEqual(placeholder.children.length, 3);
            assert.ok(placeholder.children[0] instanceof snippetParser_1.Text);
            assert.ok(placeholder.children[1] instanceof snippetParser_1.Variable);
            assert.ok(placeholder.children[2] instanceof snippetParser_1.Text);
            assert.strictEqual(placeholder.children[0].toString(), ' ');
            assert.strictEqual(placeholder.children[1].toString(), '');
            assert.strictEqual(placeholder.children[2].toString(), ' ');
            const nestedVariable = placeholder.children[1];
            assert.strictEqual(nestedVariable.name, 'TM_SELECTED_TEXT');
            assert.strictEqual(nestedVariable.children.length, 0);
            marker = new snippetParser_1.SnippetParser().parse('$TM_SELECTED_TEXT').children;
            assert.strictEqual(marker.length, 1);
            assert.ok(marker[0] instanceof snippetParser_1.Variable);
        });
        test('Parser, transform example', () => {
            const { children } = new snippetParser_1.SnippetParser().parse('${1:name} : ${2:type}${3/\\s:=(.*)/${1:+ :=}${1}/};\n$0');
            //${1:name}
            assert.ok(children[0] instanceof snippetParser_1.Placeholder);
            assert.strictEqual(children[0].children.length, 1);
            assert.strictEqual(children[0].children[0].toString(), 'name');
            assert.strictEqual(children[0].transform, undefined);
            // :
            assert.ok(children[1] instanceof snippetParser_1.Text);
            assert.strictEqual(children[1].toString(), ' : ');
            //${2:type}
            assert.ok(children[2] instanceof snippetParser_1.Placeholder);
            assert.strictEqual(children[2].children.length, 1);
            assert.strictEqual(children[2].children[0].toString(), 'type');
            //${3/\\s:=(.*)/${1:+ :=}${1}/}
            assert.ok(children[3] instanceof snippetParser_1.Placeholder);
            assert.strictEqual(children[3].children.length, 0);
            assert.notStrictEqual(children[3].transform, undefined);
            const transform = children[3].transform;
            assert.deepStrictEqual(transform.regexp, /\s:=(.*)/);
            assert.strictEqual(transform.children.length, 2);
            assert.ok(transform.children[0] instanceof snippetParser_1.FormatString);
            assert.strictEqual(transform.children[0].index, 1);
            assert.strictEqual(transform.children[0].ifValue, ' :=');
            assert.ok(transform.children[1] instanceof snippetParser_1.FormatString);
            assert.strictEqual(transform.children[1].index, 1);
            assert.ok(children[4] instanceof snippetParser_1.Text);
            assert.strictEqual(children[4].toString(), ';\n');
        });
        // TODO @jrieken making this strictEqul causes circular json conversion errors
        test('Parser, default placeholder values', () => {
            assertMarker('errorContext: `${1:err}`, error: $1', snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text, snippetParser_1.Placeholder);
            const [, p1, , p2] = new snippetParser_1.SnippetParser().parse('errorContext: `${1:err}`, error:$1').children;
            assert.strictEqual(p1.index, 1);
            assert.strictEqual(p1.children.length, 1);
            assert.strictEqual(p1.children[0].toString(), 'err');
            assert.strictEqual(p2.index, 1);
            assert.strictEqual(p2.children.length, 1);
            assert.strictEqual(p2.children[0].toString(), 'err');
        });
        // TODO @jrieken making this strictEqul causes circular json conversion errors
        test('Parser, default placeholder values and one transform', () => {
            assertMarker('errorContext: `${1:err}`, error: ${1/err/ok/}', snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text, snippetParser_1.Placeholder);
            const [, p3, , p4] = new snippetParser_1.SnippetParser().parse('errorContext: `${1:err}`, error:${1/err/ok/}').children;
            assert.strictEqual(p3.index, 1);
            assert.strictEqual(p3.children.length, 1);
            assert.strictEqual(p3.children[0].toString(), 'err');
            assert.strictEqual(p3.transform, undefined);
            assert.strictEqual(p4.index, 1);
            assert.strictEqual(p4.children.length, 1);
            assert.strictEqual(p4.children[0].toString(), 'err');
            assert.notStrictEqual(p4.transform, undefined);
        });
        test('Repeated snippet placeholder should always inherit, #31040', function () {
            assertText('${1:foo}-abc-$1', 'foo-abc-foo');
            assertText('${1:foo}-abc-${1}', 'foo-abc-foo');
            assertText('${1:foo}-abc-${1:bar}', 'foo-abc-foo');
            assertText('${1}-abc-${1:foo}', 'foo-abc-foo');
        });
        test('backspace esapce in TM only, #16212', () => {
            const actual = snippetParser_1.SnippetParser.asInsertText('Foo \\\\${abc}bar');
            assert.strictEqual(actual, 'Foo \\bar');
        });
        test('colon as variable/placeholder value, #16717', () => {
            let actual = snippetParser_1.SnippetParser.asInsertText('${TM_SELECTED_TEXT:foo:bar}');
            assert.strictEqual(actual, 'foo:bar');
            actual = snippetParser_1.SnippetParser.asInsertText('${1:foo:bar}');
            assert.strictEqual(actual, 'foo:bar');
        });
        test('incomplete placeholder', () => {
            assertTextAndMarker('${1:}', '', snippetParser_1.Placeholder);
        });
        test('marker#len', () => {
            function assertLen(template, ...lengths) {
                const snippet = new snippetParser_1.SnippetParser().parse(template, true);
                snippet.walk(m => {
                    const expected = lengths.shift();
                    assert.strictEqual(m.len(), expected);
                    return true;
                });
                assert.strictEqual(lengths.length, 0);
            }
            assertLen('text$0', 4, 0);
            assertLen('$1text$0', 0, 4, 0);
            assertLen('te$1xt$0', 2, 0, 2, 0);
            assertLen('errorContext: `${1:err}`, error: $0', 15, 0, 3, 10, 0);
            assertLen('errorContext: `${1:err}`, error: $1$0', 15, 0, 3, 10, 0, 3, 0);
            assertLen('$TM_SELECTED_TEXT$0', 0, 0);
            assertLen('${TM_SELECTED_TEXT:def}$0', 0, 3, 0);
        });
        test('parser, parent node', function () {
            let snippet = new snippetParser_1.SnippetParser().parse('This ${1:is ${2:nested}}$0', true);
            assert.strictEqual(snippet.placeholders.length, 3);
            let [first, second] = snippet.placeholders;
            assert.strictEqual(first.index, 1);
            assert.strictEqual(second.index, 2);
            assert.ok(second.parent === first);
            assert.ok(first.parent === snippet);
            snippet = new snippetParser_1.SnippetParser().parse('${VAR:default${1:value}}$0', true);
            assert.strictEqual(snippet.placeholders.length, 2);
            [first] = snippet.placeholders;
            assert.strictEqual(first.index, 1);
            assert.ok(snippet.children[0] instanceof snippetParser_1.Variable);
            assert.ok(first.parent === snippet.children[0]);
        });
        test('TextmateSnippet#enclosingPlaceholders', () => {
            const snippet = new snippetParser_1.SnippetParser().parse('This ${1:is ${2:nested}}$0', true);
            const [first, second] = snippet.placeholders;
            assert.deepStrictEqual(snippet.enclosingPlaceholders(first), []);
            assert.deepStrictEqual(snippet.enclosingPlaceholders(second), [first]);
        });
        test('TextmateSnippet#offset', () => {
            let snippet = new snippetParser_1.SnippetParser().parse('te$1xt', true);
            assert.strictEqual(snippet.offset(snippet.children[0]), 0);
            assert.strictEqual(snippet.offset(snippet.children[1]), 2);
            assert.strictEqual(snippet.offset(snippet.children[2]), 2);
            snippet = new snippetParser_1.SnippetParser().parse('${TM_SELECTED_TEXT:def}', true);
            assert.strictEqual(snippet.offset(snippet.children[0]), 0);
            assert.strictEqual(snippet.offset(snippet.children[0].children[0]), 0);
            // forgein marker
            assert.strictEqual(snippet.offset(new snippetParser_1.Text('foo')), -1);
        });
        test('TextmateSnippet#placeholder', () => {
            let snippet = new snippetParser_1.SnippetParser().parse('te$1xt$0', true);
            let placeholders = snippet.placeholders;
            assert.strictEqual(placeholders.length, 2);
            snippet = new snippetParser_1.SnippetParser().parse('te$1xt$1$0', true);
            placeholders = snippet.placeholders;
            assert.strictEqual(placeholders.length, 3);
            snippet = new snippetParser_1.SnippetParser().parse('te$1xt$2$0', true);
            placeholders = snippet.placeholders;
            assert.strictEqual(placeholders.length, 3);
            snippet = new snippetParser_1.SnippetParser().parse('${1:bar${2:foo}bar}$0', true);
            placeholders = snippet.placeholders;
            assert.strictEqual(placeholders.length, 3);
        });
        test('TextmateSnippet#replace 1/2', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('aaa${1:bbb${2:ccc}}$0', true);
            assert.strictEqual(snippet.placeholders.length, 3);
            const [, second] = snippet.placeholders;
            assert.strictEqual(second.index, 2);
            const enclosing = snippet.enclosingPlaceholders(second);
            assert.strictEqual(enclosing.length, 1);
            assert.strictEqual(enclosing[0].index, 1);
            const nested = new snippetParser_1.SnippetParser().parse('ddd$1eee$0', true);
            snippet.replace(second, nested.children);
            assert.strictEqual(snippet.toString(), 'aaabbbdddeee');
            assert.strictEqual(snippet.placeholders.length, 4);
            assert.strictEqual(snippet.placeholders[0].index, 1);
            assert.strictEqual(snippet.placeholders[1].index, 1);
            assert.strictEqual(snippet.placeholders[2].index, 0);
            assert.strictEqual(snippet.placeholders[3].index, 0);
            const newEnclosing = snippet.enclosingPlaceholders(snippet.placeholders[1]);
            assert.ok(newEnclosing[0] === snippet.placeholders[0]);
            assert.strictEqual(newEnclosing.length, 1);
            assert.strictEqual(newEnclosing[0].index, 1);
        });
        test('TextmateSnippet#replace 2/2', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('aaa${1:bbb${2:ccc}}$0', true);
            assert.strictEqual(snippet.placeholders.length, 3);
            const [, second] = snippet.placeholders;
            assert.strictEqual(second.index, 2);
            const nested = new snippetParser_1.SnippetParser().parse('dddeee$0', true);
            snippet.replace(second, nested.children);
            assert.strictEqual(snippet.toString(), 'aaabbbdddeee');
            assert.strictEqual(snippet.placeholders.length, 3);
        });
        test('Snippet order for placeholders, #28185', function () {
            const _10 = new snippetParser_1.Placeholder(10);
            const _2 = new snippetParser_1.Placeholder(2);
            assert.strictEqual(snippetParser_1.Placeholder.compareByIndex(_10, _2), 1);
        });
        test('Maximum call stack size exceeded, #28983', function () {
            new snippetParser_1.SnippetParser().parse('${1:${foo:${1}}}');
        });
        test('Snippet can freeze the editor, #30407', function () {
            const seen = new Set();
            seen.clear();
            new snippetParser_1.SnippetParser().parse('class ${1:${TM_FILENAME/(?:\\A|_)([A-Za-z0-9]+)(?:\\.rb)?/(?2::\\u$1)/g}} < ${2:Application}Controller\n  $3\nend').walk(marker => {
                assert.ok(!seen.has(marker));
                seen.add(marker);
                return true;
            });
            seen.clear();
            new snippetParser_1.SnippetParser().parse('${1:${FOO:abc$1def}}').walk(marker => {
                assert.ok(!seen.has(marker));
                seen.add(marker);
                return true;
            });
        });
        test('Snippets: make parser ignore `${0|choice|}`, #31599', function () {
            assertTextAndMarker('${0|foo,bar|}', '${0|foo,bar|}', snippetParser_1.Text);
            assertTextAndMarker('${1|foo,bar|}', 'foo', snippetParser_1.Placeholder);
        });
        test('Transform -> FormatString#resolve', function () {
            // shorthand functions
            assert.strictEqual(new snippetParser_1.FormatString(1, 'upcase').resolve('foo'), 'FOO');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'downcase').resolve('FOO'), 'foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'capitalize').resolve('bar'), 'Bar');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'capitalize').resolve('bar no repeat'), 'Bar no repeat');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'pascalcase').resolve('bar-foo'), 'BarFoo');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'pascalcase').resolve('bar-42-foo'), 'Bar42Foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'pascalcase').resolve('snake_AndPascalCase'), 'SnakeAndPascalCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'pascalcase').resolve('kebab-AndPascalCase'), 'KebabAndPascalCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'pascalcase').resolve('_justPascalCase'), 'JustPascalCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'camelcase').resolve('bar-foo'), 'barFoo');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'camelcase').resolve('bar-42-foo'), 'bar42Foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'camelcase').resolve('snake_AndCamelCase'), 'snakeAndCamelCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'camelcase').resolve('kebab-AndCamelCase'), 'kebabAndCamelCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'camelcase').resolve('_JustCamelCase'), 'justCamelCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'notKnown').resolve('input'), 'input');
            // if
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'foo', undefined).resolve(undefined), '');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'foo', undefined).resolve(''), '');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'foo', undefined).resolve('bar'), 'foo');
            // else
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, undefined, 'foo').resolve(undefined), 'foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, undefined, 'foo').resolve(''), 'foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, undefined, 'foo').resolve('bar'), 'bar');
            // if-else
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'bar', 'foo').resolve(undefined), 'foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'bar', 'foo').resolve(''), 'foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'bar', 'foo').resolve('baz'), 'bar');
        });
        test('Snippet variable transformation doesn\'t work if regex is complicated and snippet body contains \'$$\' #55627', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('const fileName = "${TM_FILENAME/(.*)\\..+$/$1/}"');
            assert.strictEqual(snippet.toTextmateString(), 'const fileName = "${TM_FILENAME/(.*)\\..+$/${1}/}"');
        });
        test('[BUG] HTML attribute suggestions: Snippet session does not have end-position set, #33147', function () {
            const { placeholders } = new snippetParser_1.SnippetParser().parse('src="$1"', true);
            const [first, second] = placeholders;
            assert.strictEqual(placeholders.length, 2);
            assert.strictEqual(first.index, 1);
            assert.strictEqual(second.index, 0);
        });
        test('Snippet optional transforms are not applied correctly when reusing the same variable, #37702', function () {
            const transform = new snippetParser_1.Transform();
            transform.appendChild(new snippetParser_1.FormatString(1, 'upcase'));
            transform.appendChild(new snippetParser_1.FormatString(2, 'upcase'));
            transform.regexp = /^(.)|-(.)/g;
            assert.strictEqual(transform.resolve('my-file-name'), 'MyFileName');
            const clone = transform.clone();
            assert.strictEqual(clone.resolve('my-file-name'), 'MyFileName');
        });
        test('problem with snippets regex #40570', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${TM_DIRECTORY/.*src[\\/](.*)/$1/}');
            assertMarker(snippet, snippetParser_1.Variable);
        });
        test('Variable transformation doesn\'t work if undefined variables are used in the same snippet #51769', function () {
            const transform = new snippetParser_1.Transform();
            transform.appendChild(new snippetParser_1.Text('bar'));
            transform.regexp = new RegExp('foo', 'gi');
            assert.strictEqual(transform.toTextmateString(), '/foo/bar/ig');
        });
        test('Snippet parser freeze #53144', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${1/(void$)|(.+)/${1:?-\treturn nil;}/}');
            assertMarker(snippet, snippetParser_1.Placeholder);
        });
        test('snippets variable not resolved in JSON proposal #52931', function () {
            assertTextAndMarker('FOO${1:/bin/bash}', 'FOO/bin/bash', snippetParser_1.Text, snippetParser_1.Placeholder);
        });
        test('Mirroring sequence of nested placeholders not selected properly on backjumping #58736', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${3:nest1 ${1:nest2 ${2:nest3}}} $3');
            assert.strictEqual(snippet.children.length, 3);
            assert.ok(snippet.children[0] instanceof snippetParser_1.Placeholder);
            assert.ok(snippet.children[1] instanceof snippetParser_1.Text);
            assert.ok(snippet.children[2] instanceof snippetParser_1.Placeholder);
            function assertParent(marker) {
                marker.children.forEach(assertParent);
                if (!(marker instanceof snippetParser_1.Placeholder)) {
                    return;
                }
                let found = false;
                let m = marker;
                while (m && !found) {
                    if (m.parent === snippet) {
                        found = true;
                    }
                    m = m.parent;
                }
                assert.ok(found);
            }
            const [, , clone] = snippet.children;
            assertParent(clone);
        });
        test('Backspace can\'t be escaped in snippet variable transforms #65412', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('namespace ${TM_DIRECTORY/[\\/]/\\\\/g};');
            assertMarker(snippet, snippetParser_1.Text, snippetParser_1.Variable, snippetParser_1.Text);
        });
        test('Snippet cannot escape closing bracket inside conditional insertion variable replacement #78883', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${TM_DIRECTORY/(.+)/${1:+import { hello \\} from world}/}');
            const variable = snippet.children[0];
            assert.strictEqual(snippet.children.length, 1);
            assert.ok(variable instanceof snippetParser_1.Variable);
            assert.ok(variable.transform);
            assert.strictEqual(variable.transform.children.length, 1);
            assert.ok(variable.transform.children[0] instanceof snippetParser_1.FormatString);
            assert.strictEqual(variable.transform.children[0].ifValue, 'import { hello } from world');
            assert.strictEqual(variable.transform.children[0].elseValue, undefined);
        });
        test('Snippet escape backslashes inside conditional insertion variable replacement #80394', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${CURRENT_YEAR/(.+)/${1:+\\\\}/}');
            const variable = snippet.children[0];
            assert.strictEqual(snippet.children.length, 1);
            assert.ok(variable instanceof snippetParser_1.Variable);
            assert.ok(variable.transform);
            assert.strictEqual(variable.transform.children.length, 1);
            assert.ok(variable.transform.children[0] instanceof snippetParser_1.FormatString);
            assert.strictEqual(variable.transform.children[0].ifValue, '\\');
            assert.strictEqual(variable.transform.children[0].elseValue, undefined);
        });
        test('Snippet placeholder empty right after expansion #152553', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${1:prog}: ${2:$1.cc} - $2');
            const actual = snippet.toString();
            assert.strictEqual(actual, 'prog: prog.cc - prog.cc');
            const snippet2 = new snippetParser_1.SnippetParser().parse('${1:prog}: ${3:${2:$1.cc}.33} - $2 $3');
            const actual2 = snippet2.toString();
            assert.strictEqual(actual2, 'prog: prog.cc.33 - prog.cc prog.cc.33');
            // cyclic references of placeholders
            const snippet3 = new snippetParser_1.SnippetParser().parse('${1:$2.one} <> ${2:$1.two}');
            const actual3 = snippet3.toString();
            assert.strictEqual(actual3, '.two.one.two.one <> .one.two.one.two');
        });
        test('Snippet choices are incorrectly escaped/applied #180132', function () {
            assertTextAndMarker('${1|aaa$aaa|}bbb\\$bbb', 'aaa$aaabbb$bbb', snippetParser_1.Placeholder, snippetParser_1.Text);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldFBhcnNlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zbmlwcGV0L3Rlc3QvYnJvd3Nlci9zbmlwcGV0UGFyc2VyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBUUEsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFFM0IsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1lBRXBCLE1BQU0sT0FBTyxHQUFHLElBQUksdUJBQU8sRUFBRSxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUkseUJBQWdCLENBQUM7WUFFdkQsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLGlDQUF5QixDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUkseUJBQWdCLENBQUM7WUFFdkQsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN4QixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLDhCQUFzQixDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksOEJBQXNCLENBQUM7WUFDN0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxpQ0FBeUIsQ0FBQztZQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJ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