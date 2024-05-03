define(["require", "exports", "assert", "vs/base/common/jsonFormatter", "vs/base/test/common/utils"], function (require, exports, assert, Formatter, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('JSON - formatter', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function format(content, expected, insertSpaces = true) {
            let range = undefined;
            const rangeStart = content.indexOf('|');
            const rangeEnd = content.lastIndexOf('|');
            if (rangeStart !== -1 && rangeEnd !== -1) {
                content = content.substring(0, rangeStart) + content.substring(rangeStart + 1, rangeEnd) + content.substring(rangeEnd + 1);
                range = { offset: rangeStart, length: rangeEnd - rangeStart };
            }
            const edits = Formatter.format(content, range, { tabSize: 2, insertSpaces: insertSpaces, eol: '\n' });
            let lastEditOffset = content.length;
            for (let i = edits.length - 1; i >= 0; i--) {
                const edit = edits[i];
                assert(edit.offset >= 0 && edit.length >= 0 && edit.offset + edit.length <= content.length);
                assert(typeof edit.content === 'string');
                assert(lastEditOffset >= edit.offset + edit.length); // make sure all edits are ordered
                lastEditOffset = edit.offset;
                content = content.substring(0, edit.offset) + edit.content + content.substring(edit.offset + edit.length);
            }
            assert.strictEqual(content, expected);
        }
        test('object - single property', () => {
            const content = [
                '{"x" : 1}'
            ].join('\n');
            const expected = [
                '{',
                '  "x": 1',
                '}'
            ].join('\n');
            format(content, expected);
        });
        test('object - multiple properties', () => {
            const content = [
                '{"x" : 1,  "y" : "foo", "z"  : true}'
            ].join('\n');
            const expected = [
                '{',
                '  "x": 1,',
                '  "y": "foo",',
                '  "z": true',
                '}'
            ].join('\n');
            format(content, expected);
        });
        test('object - no properties ', () => {
            const content = [
                '{"x" : {    },  "y" : {}}'
            ].join('\n');
            const expected = [
                '{',
                '  "x": {},',
                '  "y": {}',
                '}'
            ].join('\n');
            format(content, expected);
        });
        test('object - nesting', () => {
            const content = [
                '{"x" : {  "y" : { "z"  : { }}, "a": true}}'
            ].join('\n');
            const expected = [
                '{',
                '  "x": {',
                '    "y": {',
                '      "z": {}',
                '    },',
                '    "a": true',
                '  }',
                '}'
            ].join('\n');
            format(content, expected);
        });
        test('array - single items', () => {
            const content = [
                '["[]"]'
            ].join('\n');
            const expected = [
                '[',
                '  "[]"',
                ']'
            ].join('\n');
            format(content, expected);
        });
        test('array - multiple items', () => {
            const content = [
                '[true,null,1.2]'
            ].join('\n');
            const expected = [
                '[',
                '  true,',
                '  null,',
                '  1.2',
                ']'
            ].join('\n');
            format(content, expected);
        });
        test('array - no items', () => {
            const content = [
                '[      ]'
            ].join('\n');
            const expected = [
                '[]'
            ].join('\n');
            format(content, expected);
        });
        test('array - nesting', () => {
            const content = [
                '[ [], [ [ {} ], "a" ]  ]'
            ].join('\n');
            const expected = [
                '[',
                '  [],',
                '  [',
                '    [',
                '      {}',
                '    ],',
                '    "a"',
                '  ]',
                ']',
            ].join('\n');
            format(content, expected);
        });
        test('syntax errors', () => {
            const content = [
                '[ null 1.2 ]'
            ].join('\n');
            const expected = [
                '[',
                '  null 1.2',
                ']',
            ].join('\n');
            format(content, expected);
        });
        test('empty lines', () => {
            const content = [
                '{',
                '"a": true,',
                '',
                '"b": true',
                '}',
            ].join('\n');
            const expected = [
                '{',
                '\t"a": true,',
                '\t"b": true',
                '}',
            ].join('\n');
            format(content, expected, false);
        });
        test('single line comment', () => {
            const content = [
                '[ ',
                '//comment',
                '"foo", "bar"',
                '] '
            ].join('\n');
            const expected = [
                '[',
                '  //comment',
                '  "foo",',
                '  "bar"',
                ']',
            ].join('\n');
            format(content, expected);
        });
        test('block line comment', () => {
            const content = [
                '[{',
                '        /*comment*/     ',
                '"foo" : true',
                '}] '
            ].join('\n');
            const expected = [
                '[',
                '  {',
                '    /*comment*/',
                '    "foo": true',
                '  }',
                ']',
            ].join('\n');
            format(content, expected);
        });
        test('single line comment on same line', () => {
            const content = [
                ' {  ',
                '        "a": {}// comment    ',
                ' } '
            ].join('\n');
            const expected = [
                '{',
                '  "a": {} // comment    ',
                '}',
            ].join('\n');
            format(content, expected);
        });
        test('single line comment on same line 2', () => {
            const content = [
                '{ //comment',
                '}'
            ].join('\n');
            const expected = [
                '{ //comment',
                '}'
            ].join('\n');
            format(content, expected);
        });
        test('block comment on same line', () => {
            const content = [
                '{      "a": {}, /*comment*/    ',
                '        /*comment*/ "b": {},    ',
                '        "c": {/*comment*/}    } ',
            ].join('\n');
            const expected = [
                '{',
                '  "a": {}, /*comment*/',
                '  /*comment*/ "b": {},',
                '  "c": { /*comment*/}',
                '}',
            ].join('\n');
            format(content, expected);
        });
        test('block comment on same line advanced', () => {
            const content = [
                ' {       "d": [',
                '             null',
                '        ] /*comment*/',
                '        ,"e": /*comment*/ [null] }',
            ].join('\n');
            const expected = [
                '{',
                '  "d": [',
                '    null',
                '  ] /*comment*/,',
                '  "e": /*comment*/ [',
                '    null',
                '  ]',
                '}',
            ].join('\n');
            format(content, expected);
        });
        test('multiple block comments on same line', () => {
            const content = [
                '{      "a": {} /*comment*/, /*comment*/   ',
                '        /*comment*/ "b": {}  /*comment*/  } '
            ].join('\n');
            const expected = [
                '{',
                '  "a": {} /*comment*/, /*comment*/',
                '  /*comment*/ "b": {} /*comment*/',
                '}',
            ].join('\n');
            format(content, expected);
        });
        test('multiple mixed comments on same line', () => {
            const content = [
                '[ /*comment*/  /*comment*/   // comment ',
                ']'
            ].join('\n');
            const expected = [
                '[ /*comment*/ /*comment*/ // comment ',
                ']'
            ].join('\n');
            format(content, expected);
        });
        test('range', () => {
            const content = [
                '{ "a": {},',
                '|"b": [null, null]|',
                '} '
            ].join('\n');
            const expected = [
                '{ "a": {},',
                '"b": [',
                '  null,',
                '  null',
                ']',
                '} ',
            ].join('\n');
            format(content, expected);
        });
        test('range with existing indent', () => {
            const content = [
                '{ "a": {},',
                '   |"b": [null],',
                '"c": {}',
                '}|'
            ].join('\n');
            const expected = [
                '{ "a": {},',
                '   "b": [',
                '    null',
                '  ],',
                '  "c": {}',
                '}',
            ].join('\n');
            format(content, expected);
        });
        test('range with existing indent - tabs', () => {
            const content = [
                '{ "a": {},',
                '|  "b": [null],   ',
                '"c": {}',
                '} |    '
            ].join('\n');
            const expected = [
                '{ "a": {},',
                '\t"b": [',
                '\t\tnull',
                '\t],',
                '\t"c": {}',
                '}',
            ].join('\n');
            format(content, expected, false);
        });
        test('block comment none-line breaking symbols', () => {
            const content = [
                '{ "a": [ 1',
                '/* comment */',
                ', 2',
                '/* comment */',
                ']',
                '/* comment */',
                ',',
                ' "b": true',
                '/* comment */',
                '}'
            ].join('\n');
            const expected = [
                '{',
                '  "a": [',
                '    1',
                '    /* comment */',
                '    ,',
                '    2',
                '    /* comment */',
                '  ]',
                '  /* comment */',
                '  ,',
                '  "b": true',
                '  /* comment */',
                '}',
            ].join('\n');
            format(content, expected);
        });
        test('line comment after none-line breaking symbols', () => {
            const content = [
                '{ "a":',
                '// comment',
                'null,',
                ' "b"',
                '// comment',
                ': null',
                '// comment',
                '}'
            ].join('\n');
            const expected = [
                '{',
                '  "a":',
                '  // comment',
                '  null,',
                '  "b"',
                '  // comment',
                '  : null',
                '  // comment',
                '}',
            ].join('\n');
            format(content, expected);
        });
        test('toFormattedString', () => {
            const obj = {
                a: { b: 1, d: ['hello'] }
            };
            const getExpected = (tab, eol) => {
                return [
                    `{`,
                    `${tab}"a": {`,
                    `${tab}${tab}"b": 1,`,
                    `${tab}${tab}"d": [`,
                    `${tab}${tab}${tab}"hello"`,
                    `${tab}${tab}]`,
                    `${tab}}`,
                    '}'
                ].join(eol);
            };
            let actual = Formatter.toFormattedString(obj, { insertSpaces: true, tabSize: 2, eol: '\n' });
            assert.strictEqual(actual, getExpected('  ', '\n'));
            actual = Formatter.toFormattedString(obj, { insertSpaces: true, tabSize: 2, eol: '\r\n' });
            assert.strictEqual(actual, getExpected('  ', '\r\n'));
            actual = Formatter.toFormattedString(obj, { insertSpaces: false, eol: '\r\n' });
            assert.strictEqual(actual, getExpected('\t', '\r\n'));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbkZvcm1hdHRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2pzb25Gb3JtYXR0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFRQSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1FBRTlCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLE1BQU0sQ0FBQyxPQUFlLEVBQUUsUUFBZ0IsRUFBRSxZQUFZLEdBQUcsSUFBSTtZQUNyRSxJQUFJLEtBQUssR0FBZ0MsU0FBUyxDQUFDO1lBQ25ELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsSUFBSSxRQUFRLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLENBQUMsRUFBRSxRQUFRLENBQUMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDM0gsS0FBSyxHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsUUFBUSxHQUFHLFVBQVUsRUFBRSxDQUFDO1lBQy9ELENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLElBQUks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