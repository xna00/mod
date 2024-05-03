define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/contextkey/common/contextkey"], function (require, exports, assert, utils_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function parseToStr(input) {
        const parser = new contextkey_1.Parser();
        const prints = [];
        const print = (...ss) => { ss.forEach(s => prints.push(s)); };
        const expr = parser.parse(input);
        if (expr === undefined) {
            if (parser.lexingErrors.length > 0) {
                print('Lexing errors:', '\n\n');
                parser.lexingErrors.forEach(lexingError => print(`Unexpected token '${lexingError.lexeme}' at offset ${lexingError.offset}. ${lexingError.additionalInfo}`, '\n'));
            }
            if (parser.parsingErrors.length > 0) {
                if (parser.lexingErrors.length > 0) {
                    print('\n --- \n');
                }
                print('Parsing errors:', '\n\n');
                parser.parsingErrors.forEach(parsingError => print(`Unexpected '${parsingError.lexeme}' at offset ${parsingError.offset}.`, '\n'));
            }
        }
        else {
            print(expr.serialize());
        }
        return prints.join('');
    }
    suite('Context Key Parser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test(' foo', () => {
            const input = ' foo';
            assert.deepStrictEqual(parseToStr(input), "foo");
        });
        test('!foo', () => {
            const input = '!foo';
            assert.deepStrictEqual(parseToStr(input), "!foo");
        });
        test('foo =~ /bar/', () => {
            const input = 'foo =~ /bar/';
            assert.deepStrictEqual(parseToStr(input), "foo =~ /bar/");
        });
        test(`foo || (foo =~ /bar/ && baz)`, () => {
            const input = `foo || (foo =~ /bar/ && baz)`;
            assert.deepStrictEqual(parseToStr(input), "foo || baz && foo =~ /bar/");
        });
        test('foo || (foo =~ /bar/ || baz)', () => {
            const input = 'foo || (foo =~ /bar/ || baz)';
            assert.deepStrictEqual(parseToStr(input), "baz || foo || foo =~ /bar/");
        });
        test(`(foo || bar) && (jee || jar)`, () => {
            const input = `(foo || bar) && (jee || jar)`;
            assert.deepStrictEqual(parseToStr(input), "bar && jar || bar && jee || foo && jar || foo && jee");
        });
        test('foo && foo =~ /zee/i', () => {
            const input = 'foo && foo =~ /zee/i';
            assert.deepStrictEqual(parseToStr(input), "foo && foo =~ /zee/i");
        });
        test('foo.bar==enabled', () => {
            const input = 'foo.bar==enabled';
            assert.deepStrictEqual(parseToStr(input), "foo.bar == 'enabled'");
        });
        test(`foo.bar == 'enabled'`, () => {
            const input = `foo.bar == 'enabled'`;
            assert.deepStrictEqual(parseToStr(input), `foo.bar == 'enabled'`);
        });
        test('foo.bar:zed==completed - equality with no space', () => {
            const input = 'foo.bar:zed==completed';
            assert.deepStrictEqual(parseToStr(input), "foo.bar:zed == 'completed'");
        });
        test('a && b || c', () => {
            const input = 'a && b || c';
            assert.deepStrictEqual(parseToStr(input), "c || a && b");
        });
        test('fooBar && baz.jar && fee.bee<K-loo+1>', () => {
            const input = 'fooBar && baz.jar && fee.bee<K-loo+1>';
            assert.deepStrictEqual(parseToStr(input), "baz.jar && fee.bee<K-loo+1> && fooBar");
        });
        test('foo.barBaz<C-r> < 2', () => {
            const input = 'foo.barBaz<C-r> < 2';
            assert.deepStrictEqual(parseToStr(input), `foo.barBaz<C-r> < 2`);
        });
        test('foo.bar >= -1', () => {
            const input = 'foo.bar >= -1';
            assert.deepStrictEqual(parseToStr(input), "foo.bar >= -1");
        });
        test(`key contains &nbsp: view == vsc-packages-activitybar-folders && vsc-packages-folders-loaded`, () => {
            const input = `view == vsc-packages-activitybar-folders && vsc-packages-folders-loaded`;
            assert.deepStrictEqual(parseToStr(input), "vsc-packages-folders-loaded && view == 'vsc-packages-activitybar-folders'");
        });
        test('foo.bar <= -1', () => {
            const input = 'foo.bar <= -1';
            assert.deepStrictEqual(parseToStr(input), `foo.bar <= -1`);
        });
        test('!cmake:hideBuildCommand \u0026\u0026 cmake:enableFullFeatureSet', () => {
            const input = '!cmake:hideBuildCommand \u0026\u0026 cmake:enableFullFeatureSet';
            assert.deepStrictEqual(parseToStr(input), "cmake:enableFullFeatureSet && !cmake:hideBuildCommand");
        });
        test('!(foo && bar)', () => {
            const input = '!(foo && bar)';
            assert.deepStrictEqual(parseToStr(input), "!bar || !foo");
        });
        test('!(foo && bar || boar) || deer', () => {
            const input = '!(foo && bar || boar) || deer';
            assert.deepStrictEqual(parseToStr(input), "deer || !bar && !boar || !boar && !foo");
        });
        test(`!(!foo)`, () => {
            const input = `!(!foo)`;
            assert.deepStrictEqual(parseToStr(input), "foo");
        });
        suite('controversial', () => {
            /*
                new parser KEEPS old one's behavior:
    
                old parser output: { key: 'debugState', op: '==', value: '"stopped"' }
                new parser output: { key: 'debugState', op: '==', value: '"stopped"' }
    
                TODO@ulugbekna: we should consider breaking old parser's behavior, and not take double quotes as part of the `value` because that's not what user expects.
            */
            test(`debugState == "stopped"`, () => {
                const input = `debugState == "stopped"`;
                assert.deepStrictEqual(parseToStr(input), "debugState == '\"stopped\"'");
            });
            /*
                new parser BREAKS old one's behavior:
    
                old parser output: { key: 'viewItem', op: '==', value: 'VSCode WorkSpace' }
                new parser output: { key: 'viewItem', op: '==', value: 'VSCode' }
    
                TODO@ulugbekna: since this's breaking, we can have hacky code that tries detecting such cases and replicate old parser's behavior.
            */
            test(` viewItem == VSCode WorkSpace`, () => {
                const input = ` viewItem == VSCode WorkSpace`;
                assert.deepStrictEqual(parseToStr(input), "Parsing errors:\n\nUnexpected 'WorkSpace' at offset 20.\n");
            });
        });
        suite('regex', () => {
            test(`resource =~ //foo/(barr|door/(Foo-Bar%20Templates|Soo%20Looo)|Web%20Site%Jjj%20Llll)(/.*)*$/`, () => {
                const input = `resource =~ //foo/(barr|door/(Foo-Bar%20Templates|Soo%20Looo)|Web%20Site%Jjj%20Llll)(/.*)*$/`;
                assert.deepStrictEqual(parseToStr(input), "resource =~ /\\/foo\\/(barr|door\\/(Foo-Bar%20Templates|Soo%20Looo)|Web%20Site%Jjj%20Llll)(\\/.*)*$/");
            });
            test(`resource =~ /((/scratch/(?!update)(.*)/)|((/src/).*/)).*$/`, () => {
                const input = `resource =~ /((/scratch/(?!update)(.*)/)|((/src/).*/)).*$/`;
                assert.deepStrictEqual(parseToStr(input), "resource =~ /((\\/scratch\\/(?!update)(.*)\\/)|((\\/src\\/).*\\/)).*$/");
            });
            test(`resourcePath =~ /\.md(\.yml|\.txt)*$/giym`, () => {
                const input = `resourcePath =~ /\.md(\.yml|\.txt)*$/giym`;
                assert.deepStrictEqual(parseToStr(input), "resourcePath =~ /.md(.yml|.txt)*$/im");
            });
        });
        suite('error handling', () => {
            test(`/foo`, () => {
                const input = `/foo`;
                assert.deepStrictEqual(parseToStr(input), "Lexing errors:\n\nUnexpected token '/foo' at offset 0. Did you forget to escape the '/' (slash) character? Put two backslashes before it to escape, e.g., '\\\\/'.\n\n --- \nParsing errors:\n\nUnexpected '/foo' at offset 0.\n");
            });
            test(`!b == 'true'`, () => {
                const input = `!b == 'true'`;
                assert.deepStrictEqual(parseToStr(input), "Parsing errors:\n\nUnexpected '==' at offset 3.\n");
            });
            test('!foo &&  in bar', () => {
                const input = '!foo &&  in bar';
                assert.deepStrictEqual(parseToStr(input), "Parsing errors:\n\nUnexpected 'in' at offset 9.\n");
            });
            test('vim<c-r> == 1 && vim<2<=3', () => {
                const input = 'vim<c-r> == 1 && vim<2<=3';
                assert.deepStrictEqual(parseToStr(input), "Lexing errors:\n\nUnexpected token '=' at offset 23. Did you mean == or =~?\n\n --- \nParsing errors:\n\nUnexpected '=' at offset 23.\n"); // FIXME
            });
            test(`foo && 'bar`, () => {
                const input = `foo && 'bar`;
                assert.deepStrictEqual(parseToStr(input), "Lexing errors:\n\nUnexpected token ''bar' at offset 7. Did you forget to open or close the quote?\n\n --- \nParsing errors:\n\nUnexpected ''bar' at offset 7.\n");
            });
            test(`config.foo &&  &&bar =~ /^foo$|^bar-foo$|^joo$|^jar$/ && !foo`, () => {
                const input = `config.foo &&  &&bar =~ /^foo$|^bar-foo$|^joo$|^jar$/ && !foo`;
                assert.deepStrictEqual(parseToStr(input), "Parsing errors:\n\nUnexpected '&&' at offset 15.\n");
            });
            test(`!foo == 'test'`, () => {
                const input = `!foo == 'test'`;
                assert.deepStrictEqual(parseToStr(input), "Parsing errors:\n\nUnexpected '==' at offset 5.\n");
            });
            test(`!!foo`, function () {
                const input = `!!foo`;
                assert.deepStrictEqual(parseToStr(input), "Parsing errors:\n\nUnexpected '!' at offset 1.\n");
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2NvbnRleHRrZXkvdGVzdC9jb21tb24vcGFyc2VyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBUUEsU0FBUyxVQUFVLENBQUMsS0FBYTtRQUNoQyxNQUFNLE1BQU0sR0FBRyxJQUFJLG1CQUFNLEVBQUUsQ0FBQztRQUU1QixNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFFNUIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQVksRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV4RSxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3hCLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMscUJBQXFCLFdBQVcsQ0FBQyxNQUFNLGVBQWUsV0FBVyxDQUFDLE1BQU0sS0FBSyxXQUFXLENBQUMsY0FBYyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwSyxDQUFDO1lBRUQsSUFBSSxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FB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