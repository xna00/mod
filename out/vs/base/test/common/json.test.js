define(["require", "exports", "assert", "vs/base/common/json", "vs/base/common/jsonErrorMessages", "vs/base/test/common/utils"], function (require, exports, assert, json_1, jsonErrorMessages_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function assertKinds(text, ...kinds) {
        const scanner = (0, json_1.createScanner)(text);
        let kind;
        while ((kind = scanner.scan()) !== 17 /* SyntaxKind.EOF */) {
            assert.strictEqual(kind, kinds.shift());
        }
        assert.strictEqual(kinds.length, 0);
    }
    function assertScanError(text, expectedKind, scanError) {
        const scanner = (0, json_1.createScanner)(text);
        scanner.scan();
        assert.strictEqual(scanner.getToken(), expectedKind);
        assert.strictEqual(scanner.getTokenError(), scanError);
    }
    function assertValidParse(input, expected, options) {
        const errors = [];
        const actual = (0, json_1.parse)(input, errors, options);
        if (errors.length !== 0) {
            assert(false, (0, jsonErrorMessages_1.getParseErrorMessage)(errors[0].error));
        }
        assert.deepStrictEqual(actual, expected);
    }
    function assertInvalidParse(input, expected, options) {
        const errors = [];
        const actual = (0, json_1.parse)(input, errors, options);
        assert(errors.length > 0);
        assert.deepStrictEqual(actual, expected);
    }
    function assertTree(input, expected, expectedErrors = [], options) {
        const errors = [];
        const actual = (0, json_1.parseTree)(input, errors, options);
        assert.deepStrictEqual(errors.map(e => e.error, expected), expectedErrors);
        const checkParent = (node) => {
            if (node.children) {
                for (const child of node.children) {
                    assert.strictEqual(node, child.parent);
                    delete child.parent; // delete to avoid recursion in deep equal
                    checkParent(child);
                }
            }
        };
        checkParent(actual);
        assert.deepStrictEqual(actual, expected);
    }
    suite('JSON', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('tokens', () => {
            assertKinds('{', 1 /* SyntaxKind.OpenBraceToken */);
            assertKinds('}', 2 /* SyntaxKind.CloseBraceToken */);
            assertKinds('[', 3 /* SyntaxKind.OpenBracketToken */);
            assertKinds(']', 4 /* SyntaxKind.CloseBracketToken */);
            assertKinds(':', 6 /* SyntaxKind.ColonToken */);
            assertKinds(',', 5 /* SyntaxKind.CommaToken */);
        });
        test('comments', () => {
            assertKinds('// this is a comment', 12 /* SyntaxKind.LineCommentTrivia */);
            assertKinds('// this is a comment\n', 12 /* SyntaxKind.LineCommentTrivia */, 14 /* SyntaxKind.LineBreakTrivia */);
            assertKinds('/* this is a comment*/', 13 /* SyntaxKind.BlockCommentTrivia */);
            assertKinds('/* this is a \r\ncomment*/', 13 /* SyntaxKind.BlockCommentTrivia */);
            assertKinds('/* this is a \ncomment*/', 13 /* SyntaxKind.BlockCommentTrivia */);
            // unexpected end
            assertKinds('/* this is a', 13 /* SyntaxKind.BlockCommentTrivia */);
            assertKinds('/* this is a \ncomment', 13 /* SyntaxKind.BlockCommentTrivia */);
            // broken comment
            assertKinds('/ ttt', 16 /* SyntaxKind.Unknown */, 15 /* SyntaxKind.Trivia */, 16 /* SyntaxKind.Unknown */);
        });
        test('strings', () => {
            assertKinds('"test"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\""', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\/"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\b"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\f"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\n"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\r"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\t"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\v"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\u88ff"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"​\u2028"', 10 /* SyntaxKind.StringLiteral */);
            // unexpected end
            assertKinds('"test', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"test\n"', 10 /* SyntaxKind.StringLiteral */, 14 /* SyntaxKind.LineBreakTrivia */, 10 /* SyntaxKind.StringLiteral */);
            // invalid characters
            assertScanError('"\t"', 10 /* SyntaxKind.StringLiteral */, 6 /* ScanError.InvalidCharacter */);
            assertScanError('"\t "', 10 /* SyntaxKind.StringLiteral */, 6 /* ScanError.InvalidCharacter */);
        });
        test('numbers', () => {
            assertKinds('0', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('0.1', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('-0.1', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('-1', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('1', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('123456789', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('10', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90E+123', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90e+123', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90e-123', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90E-123', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90E123', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90e123', 11 /* SyntaxKind.NumericLiteral */);
            // zero handling
            assertKinds('01', 11 /* SyntaxKind.NumericLiteral */, 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('-01', 11 /* SyntaxKind.NumericLiteral */, 11 /* SyntaxKind.NumericLiteral */);
            // unexpected end
            assertKinds('-', 16 /* SyntaxKind.Unknown */);
            assertKinds('.0', 16 /* SyntaxKind.Unknown */);
        });
        test('keywords: true, false, null', () => {
            assertKinds('true', 8 /* SyntaxKind.TrueKeyword */);
            assertKinds('false', 9 /* SyntaxKind.FalseKeyword */);
            assertKinds('null', 7 /* SyntaxKind.NullKeyword */);
            assertKinds('true false null', 8 /* SyntaxKind.TrueKeyword */, 15 /* SyntaxKind.Trivia */, 9 /* SyntaxKind.FalseKeyword */, 15 /* SyntaxKind.Trivia */, 7 /* SyntaxKind.NullKeyword */);
            // invalid words
            assertKinds('nulllll', 16 /* SyntaxKind.Unknown */);
            assertKinds('True', 16 /* SyntaxKind.Unknown */);
            assertKinds('foo-bar', 16 /* SyntaxKind.Unknown */);
            assertKinds('foo bar', 16 /* SyntaxKind.Unknown */, 15 /* SyntaxKind.Trivia */, 16 /* SyntaxKind.Unknown */);
        });
        test('trivia', () => {
            assertKinds(' ', 15 /* SyntaxKind.Trivia */);
            assertKinds('  \t  ', 15 /* SyntaxKind.Trivia */);
            assertKinds('  \t  \n  \t  ', 15 /* SyntaxKind.Trivia */, 14 /* SyntaxKind.LineBreakTrivia */, 15 /* SyntaxKind.Trivia */);
            assertKinds('\r\n', 14 /* SyntaxKind.LineBreakTrivia */);
            assertKinds('\r', 14 /* SyntaxKind.LineBreakTrivia */);
            assertKinds('\n', 14 /* SyntaxKind.LineBreakTrivia */);
            assertKinds('\n\r', 14 /* SyntaxKind.LineBreakTrivia */, 14 /* SyntaxKind.LineBreakTrivia */);
            assertKinds('\n   \n', 14 /* SyntaxKind.LineBreakTrivia */, 15 /* SyntaxKind.Trivia */, 14 /* SyntaxKind.LineBreakTrivia */);
        });
        test('parse: literals', () => {
            assertValidParse('true', true);
            assertValidParse('false', false);
            assertValidParse('null', null);
            assertValidParse('"foo"', 'foo');
            assertValidParse('"\\"-\\\\-\\/-\\b-\\f-\\n-\\r-\\t"', '"-\\-/-\b-\f-\n-\r-\t');
            assertValidParse('"\\u00DC"', 'Ü');
            assertValidParse('9', 9);
            assertValidParse('-9', -9);
            assertValidParse('0.129', 0.129);
            assertValidParse('23e3', 23e3);
            assertValidParse('1.2E+3', 1.2E+3);
            assertValidParse('1.2E-3', 1.2E-3);
            assertValidParse('1.2E-3 // comment', 1.2E-3);
        });
        test('parse: objects', () => {
            assertValidParse('{}', {});
            assertValidParse('{ "foo": true }', { foo: true });
            assertValidParse('{ "bar": 8, "xoo": "foo" }', { bar: 8, xoo: 'foo' });
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} });
            assertValidParse('{ "a": false, "b": true, "c": [ 7.4 ] }', { a: false, b: true, c: [7.4] });
            assertValidParse('{ "lineComment": "//", "blockComment": ["/*", "*/"], "brackets": [ ["{", "}"], ["[", "]"], ["(", ")"] ] }', { lineComment: '//', blockComment: ['/*', '*/'], brackets: [['{', '}'], ['[', ']'], ['(', ')']] });
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} });
            assertValidParse('{ "hello": { "again": { "inside": 5 }, "world": 1 }}', { hello: { again: { inside: 5 }, world: 1 } });
            assertValidParse('{ "foo": /*hello*/true }', { foo: true });
        });
        test('parse: arrays', () => {
            assertValidParse('[]', []);
            assertValidParse('[ [],  [ [] ]]', [[], [[]]]);
            assertValidParse('[ 1, 2, 3 ]', [1, 2, 3]);
            assertValidParse('[ { "a": null } ]', [{ a: null }]);
        });
        test('parse: objects with errors', () => {
            assertInvalidParse('{,}', {});
            assertInvalidParse('{ "foo": true, }', { foo: true }, { allowTrailingComma: false });
            assertInvalidParse('{ "bar": 8 "xoo": "foo" }', { bar: 8, xoo: 'foo' });
            assertInvalidParse('{ ,"bar": 8 }', { bar: 8 });
            assertInvalidParse('{ ,"bar": 8, "foo" }', { bar: 8 });
            assertInvalidParse('{ "bar": 8, "foo": }', { bar: 8 });
            assertInvalidParse('{ 8, "foo": 9 }', { foo: 9 });
        });
        test('parse: array with errors', () => {
            assertInvalidParse('[,]', []);
            assertInvalidParse('[ 1, 2, ]', [1, 2], { allowTrailingComma: false });
            assertInvalidParse('[ 1 2, 3 ]', [1, 2, 3]);
            assertInvalidParse('[ ,1, 2, 3 ]', [1, 2, 3]);
            assertInvalidParse('[ ,1, 2, 3, ]', [1, 2, 3], { allowTrailingComma: false });
        });
        test('parse: disallow commments', () => {
            const options = { disallowComments: true };
            assertValidParse('[ 1, 2, null, "foo" ]', [1, 2, null, 'foo'], options);
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} }, options);
            assertInvalidParse('{ "foo": /*comment*/ true }', { foo: true }, options);
        });
        test('parse: trailing comma', () => {
            // default is allow
            assertValidParse('{ "hello": [], }', { hello: [] });
            let options = { allowTrailingComma: true };
            assertValidParse('{ "hello": [], }', { hello: [] }, options);
            assertValidParse('{ "hello": [] }', { hello: [] }, options);
            assertValidParse('{ "hello": [], "world": {}, }', { hello: [], world: {} }, options);
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} }, options);
            assertValidParse('{ "hello": [1,] }', { hello: [1] }, options);
            options = { allowTrailingComma: false };
            assertInvalidParse('{ "hello": [], }', { hello: [] }, options);
            assertInvalidParse('{ "hello": [], "world": {}, }', { hello: [], world: {} }, options);
        });
        test('tree: literals', () => {
            assertTree('true', { type: 'boolean', offset: 0, length: 4, value: true });
            assertTree('false', { type: 'boolean', offset: 0, length: 5, value: false });
            assertTree('null', { type: 'null', offset: 0, length: 4, value: null });
            assertTree('23', { type: 'number', offset: 0, length: 2, value: 23 });
            assertTree('-1.93e-19', { type: 'number', offset: 0, length: 9, value: -1.93e-19 });
            assertTree('"hello"', { type: 'string', offset: 0, length: 7, value: 'hello' });
        });
        test('tree: arrays', () => {
            assertTree('[]', { type: 'array', offset: 0, length: 2, children: [] });
            assertTree('[ 1 ]', { type: 'array', offset: 0, length: 5, children: [{ type: 'number', offset: 2, length: 1, value: 1 }] });
            assertTree('[ 1,"x"]', {
                type: 'array', offset: 0, length: 8, children: [
                    { type: 'number', offset: 2, length: 1, value: 1 },
                    { type: 'string', offset: 4, length: 3, value: 'x' }
                ]
            });
            assertTree('[[]]', {
                type: 'array', offset: 0, length: 4, children: [
                    { type: 'array', offset: 1, length: 2, children: [] }
                ]
            });
        });
        test('tree: objects', () => {
            assertTree('{ }', { type: 'object', offset: 0, length: 3, children: [] });
            assertTree('{ "val": 1 }', {
                type: 'object', offset: 0, length: 12, children: [
                    {
                        type: 'property', offset: 2, length: 8, colonOffset: 7, children: [
                            { type: 'string', offset: 2, length: 5, value: 'val' },
                            { type: 'number', offset: 9, length: 1, value: 1 }
                        ]
                    }
                ]
            });
            assertTree('{"id": "$", "v": [ null, null] }', {
                type: 'object', offset: 0, length: 32, children: [
                    {
                        type: 'property', offset: 1, length: 9, colonOffset: 5, children: [
                            { type: 'string', offset: 1, length: 4, value: 'id' },
                            { type: 'string', offset: 7, length: 3, value: '$' }
                        ]
                    },
                    {
                        type: 'property', offset: 12, length: 18, colonOffset: 15, children: [
                            { type: 'string', offset: 12, length: 3, value: 'v' },
                            {
                                type: 'array', offset: 17, length: 13, children: [
                                    { type: 'null', offset: 19, length: 4, value: null },
                                    { type: 'null', offset: 25, length: 4, value: null }
                                ]
                            }
                        ]
                    }
                ]
            });
            assertTree('{  "id": { "foo": { } } , }', {
                type: 'object', offset: 0, length: 27, children: [
                    {
                        type: 'property', offset: 3, length: 20, colonOffset: 7, children: [
                            { type: 'string', offset: 3, length: 4, value: 'id' },
                            {
                                type: 'object', offset: 9, length: 14, children: [
                                    {
                                        type: 'property', offset: 11, length: 10, colonOffset: 16, children: [
                                            { type: 'string', offset: 11, length: 5, value: 'foo' },
                                            { type: 'object', offset: 18, length: 3, children: [] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }, [3 /* ParseErrorCode.PropertyNameExpected */, 4 /* ParseErrorCode.ValueExpected */], { allowTrailingComma: false });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2pzb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFTQSxTQUFTLFdBQVcsQ0FBQyxJQUFZLEVBQUUsR0FBRyxLQUFtQjtRQUN4RCxNQUFNLE9BQU8sR0FBRyxJQUFBLG9CQUFhLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsSUFBSSxJQUFnQixDQUFDO1FBQ3JCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLDRCQUFtQixFQUFFLENBQUM7WUFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUNELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBQ0QsU0FBUyxlQUFlLENBQUMsSUFBWSxFQUFFLFlBQXdCLEVBQUUsU0FBb0I7UUFDcEYsTUFBTSxPQUFPLEdBQUcsSUFBQSxvQkFBYSxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNmLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFDLEtBQWEsRUFBRSxRQUFhLEVBQUUsT0FBc0I7UUFDN0UsTUFBTSxNQUFNLEdBQWlCLEVBQUUsQ0FBQztRQUNoQyxNQUFNLE1BQU0sR0FBRyxJQUFBLFlBQUssRUFBQyxL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