define(["require", "exports", "assert", "vs/base/common/jsonEdit", "vs/base/test/common/utils"], function (require, exports, assert, jsonEdit_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('JSON - edits', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertEdit(content, edits, expected) {
            assert(edits);
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
        const formatterOptions = {
            insertSpaces: true,
            tabSize: 2,
            eol: '\n'
        };
        test('set property', () => {
            let content = '{\n  "x": "y"\n}';
            let edits = (0, jsonEdit_1.setProperty)(content, ['x'], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "x": "bar"\n}');
            content = 'true';
            edits = (0, jsonEdit_1.setProperty)(content, [], 'bar', formatterOptions);
            assertEdit(content, edits, '"bar"');
            content = '{\n  "x": "y"\n}';
            edits = (0, jsonEdit_1.setProperty)(content, ['x'], { key: true }, formatterOptions);
            assertEdit(content, edits, '{\n  "x": {\n    "key": true\n  }\n}');
            content = '{\n  "a": "b",  "x": "y"\n}';
            edits = (0, jsonEdit_1.setProperty)(content, ['a'], null, formatterOptions);
            assertEdit(content, edits, '{\n  "a": null,  "x": "y"\n}');
        });
        test('insert property', () => {
            let content = '{}';
            let edits = (0, jsonEdit_1.setProperty)(content, ['foo'], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "foo": "bar"\n}');
            edits = (0, jsonEdit_1.setProperty)(content, ['foo', 'foo2'], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "foo": {\n    "foo2": "bar"\n  }\n}');
            content = '{\n}';
            edits = (0, jsonEdit_1.setProperty)(content, ['foo'], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "foo": "bar"\n}');
            content = '  {\n  }';
            edits = (0, jsonEdit_1.setProperty)(content, ['foo'], 'bar', formatterOptions);
            assertEdit(content, edits, '  {\n    "foo": "bar"\n  }');
            content = '{\n  "x": "y"\n}';
            edits = (0, jsonEdit_1.setProperty)(content, ['foo'], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "x": "y",\n  "foo": "bar"\n}');
            content = '{\n  "x": "y"\n}';
            edits = (0, jsonEdit_1.setProperty)(content, ['e'], 'null', formatterOptions);
            assertEdit(content, edits, '{\n  "x": "y",\n  "e": "null"\n}');
            edits = (0, jsonEdit_1.setProperty)(content, ['x'], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "x": "bar"\n}');
            content = '{\n  "x": {\n    "a": 1,\n    "b": true\n  }\n}\n';
            edits = (0, jsonEdit_1.setProperty)(content, ['x'], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "x": "bar"\n}\n');
            edits = (0, jsonEdit_1.setProperty)(content, ['x', 'b'], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "x": {\n    "a": 1,\n    "b": "bar"\n  }\n}\n');
            edits = (0, jsonEdit_1.setProperty)(content, ['x', 'c'], 'bar', formatterOptions, () => 0);
            assertEdit(content, edits, '{\n  "x": {\n    "c": "bar",\n    "a": 1,\n    "b": true\n  }\n}\n');
            edits = (0, jsonEdit_1.setProperty)(content, ['x', 'c'], 'bar', formatterOptions, () => 1);
            assertEdit(content, edits, '{\n  "x": {\n    "a": 1,\n    "c": "bar",\n    "b": true\n  }\n}\n');
            edits = (0, jsonEdit_1.setProperty)(content, ['x', 'c'], 'bar', formatterOptions, () => 2);
            assertEdit(content, edits, '{\n  "x": {\n    "a": 1,\n    "b": true,\n    "c": "bar"\n  }\n}\n');
            edits = (0, jsonEdit_1.setProperty)(content, ['c'], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "x": {\n    "a": 1,\n    "b": true\n  },\n  "c": "bar"\n}\n');
            content = '{\n  "a": [\n    {\n    } \n  ]  \n}';
            edits = (0, jsonEdit_1.setProperty)(content, ['foo'], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "a": [\n    {\n    } \n  ],\n  "foo": "bar"\n}');
            content = '';
            edits = (0, jsonEdit_1.setProperty)(content, ['foo', 0], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "foo": [\n    "bar"\n  ]\n}');
            content = '//comment';
            edits = (0, jsonEdit_1.setProperty)(content, ['foo', 0], 'bar', formatterOptions);
            assertEdit(content, edits, '{\n  "foo": [\n    "bar"\n  ]\n} //comment');
        });
        test('remove property', () => {
            let content = '{\n  "x": "y"\n}';
            let edits = (0, jsonEdit_1.removeProperty)(content, ['x'], formatterOptions);
            assertEdit(content, edits, '{\n}');
            content = '{\n  "x": "y", "a": []\n}';
            edits = (0, jsonEdit_1.removeProperty)(content, ['x'], formatterOptions);
            assertEdit(content, edits, '{\n  "a": []\n}');
            content = '{\n  "x": "y", "a": []\n}';
            edits = (0, jsonEdit_1.removeProperty)(content, ['a'], formatterOptions);
            assertEdit(content, edits, '{\n  "x": "y"\n}');
        });
        test('insert item at 0', () => {
            const content = '[\n  2,\n  3\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [0], 1, formatterOptions);
            assertEdit(content, edits, '[\n  1,\n  2,\n  3\n]');
        });
        test('insert item at 0 in empty array', () => {
            const content = '[\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [0], 1, formatterOptions);
            assertEdit(content, edits, '[\n  1\n]');
        });
        test('insert item at an index', () => {
            const content = '[\n  1,\n  3\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [1], 2, formatterOptions);
            assertEdit(content, edits, '[\n  1,\n  2,\n  3\n]');
        });
        test('insert item at an index im empty array', () => {
            const content = '[\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [1], 1, formatterOptions);
            assertEdit(content, edits, '[\n  1\n]');
        });
        test('insert item at end index', () => {
            const content = '[\n  1,\n  2\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [2], 3, formatterOptions);
            assertEdit(content, edits, '[\n  1,\n  2,\n  3\n]');
        });
        test('insert item at end to empty array', () => {
            const content = '[\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [-1], 'bar', formatterOptions);
            assertEdit(content, edits, '[\n  "bar"\n]');
        });
        test('insert item at end', () => {
            const content = '[\n  1,\n  2\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [-1], 'bar', formatterOptions);
            assertEdit(content, edits, '[\n  1,\n  2,\n  "bar"\n]');
        });
        test('remove item in array with one item', () => {
            const content = '[\n  1\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [0], undefined, formatterOptions);
            assertEdit(content, edits, '[]');
        });
        test('remove item in the middle of the array', () => {
            const content = '[\n  1,\n  2,\n  3\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [1], undefined, formatterOptions);
            assertEdit(content, edits, '[\n  1,\n  3\n]');
        });
        test('remove last item in the array', () => {
            const content = '[\n  1,\n  2,\n  "bar"\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [2], undefined, formatterOptions);
            assertEdit(content, edits, '[\n  1,\n  2\n]');
        });
        test('remove last item in the array if ends with comma', () => {
            const content = '[\n  1,\n  "foo",\n  "bar",\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [2], undefined, formatterOptions);
            assertEdit(content, edits, '[\n  1,\n  "foo"\n]');
        });
        test('remove last item in the array if there is a comment in the beginning', () => {
            const content = '// This is a comment\n[\n  1,\n  "foo",\n  "bar"\n]';
            const edits = (0, jsonEdit_1.setProperty)(content, [2], undefined, formatterOptions);
            assertEdit(content, edits, '// This is a comment\n[\n  1,\n  "foo"\n]');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbkVkaXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9qc29uRWRpdC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVNBLEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1FBRTFCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLFVBQVUsQ0FBQyxPQUFlLEVBQUUsS0FBYSxFQUFFLFFBQWdCO1lBQ25FLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNkLElBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDcEMsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzVDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzVGLE1BQU0sQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxrQ0FBa0M7Z0JBQ3ZGLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUM3QixPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxH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