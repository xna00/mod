/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/wordOperations/test/browser/wordTestUtils", "vs/editor/contrib/wordPartOperations/browser/wordPartOperations", "vs/editor/contrib/wordPartOperations/test/browser/utils", "vs/editor/test/common/modes/testLanguageConfigurationService"], function (require, exports, assert, utils_1, position_1, languageConfigurationRegistry_1, wordTestUtils_1, wordPartOperations_1, utils_2, testLanguageConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WordPartOperations', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const _deleteWordPartLeft = new wordPartOperations_1.DeleteWordPartLeft();
        const _deleteWordPartRight = new wordPartOperations_1.DeleteWordPartRight();
        const _cursorWordPartLeft = new wordPartOperations_1.CursorWordPartLeft();
        const _cursorWordPartLeftSelect = new wordPartOperations_1.CursorWordPartLeftSelect();
        const _cursorWordPartRight = new wordPartOperations_1.CursorWordPartRight();
        const _cursorWordPartRightSelect = new wordPartOperations_1.CursorWordPartRightSelect();
        const serviceAccessor = new utils_2.StaticServiceAccessor().withService(languageConfigurationRegistry_1.ILanguageConfigurationService, new testLanguageConfigurationService_1.TestLanguageConfigurationService());
        function runEditorCommand(editor, command) {
            command.runEditorCommand(serviceAccessor, editor, null);
        }
        function cursorWordPartLeft(editor, inSelectionmode = false) {
            runEditorCommand(editor, inSelectionmode ? _cursorWordPartLeftSelect : _cursorWordPartLeft);
        }
        function cursorWordPartRight(editor, inSelectionmode = false) {
            runEditorCommand(editor, inSelectionmode ? _cursorWordPartRightSelect : _cursorWordPartRight);
        }
        function deleteWordPartLeft(editor) {
            runEditorCommand(editor, _deleteWordPartLeft);
        }
        function deleteWordPartRight(editor) {
            runEditorCommand(editor, _deleteWordPartRight);
        }
        test('cursorWordPartLeft - basic', () => {
            const EXPECTED = [
                '|start| |line|',
                '|this|Is|A|Camel|Case|Var|  |this_|is_|a_|snake_|case_|var| |THIS_|IS_|CAPS_|SNAKE| |this_|IS|Mixed|Use|',
                '|end| |line'
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartLeft - issue #53899: whitespace', () => {
            const EXPECTED = '|myvar| |=| |\'|demonstration|     |of| |selection| |with| |space|\'';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartLeft - issue #53899: underscores', () => {
            const EXPECTED = '|myvar| |=| |\'|demonstration_____|of| |selection| |with| |space|\'';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartRight - basic', () => {
            const EXPECTED = [
                'start| |line|',
                '|this|Is|A|Camel|Case|Var|  |this|_is|_a|_snake|_case|_var| |THIS|_IS|_CAPS|_SNAKE| |this|_IS|Mixed|Use|',
                '|end| |line|'
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordPartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(3, 9)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartRight - issue #53899: whitespace', () => {
            const EXPECTED = 'myvar| |=| |\'|demonstration|     |of| |selection| |with| |space|\'|';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordPartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 52)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartRight - issue #53899: underscores', () => {
            const EXPECTED = 'myvar| |=| |\'|demonstration|_____of| |selection| |with| |space|\'|';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordPartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 52)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('cursorWordPartRight - issue #53899: second case', () => {
            const EXPECTED = [
                ';| |--| |1|',
                '|;|        |--| |2|',
                '|;|    |#|3|',
                '|;|   |#|4|'
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordPartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(4, 7)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('issue #93239 - cursorWordPartRight', () => {
            const EXPECTED = [
                'foo|_bar|',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordPartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 8)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('issue #93239 - cursorWordPartLeft', () => {
            const EXPECTED = [
                '|foo_|bar',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 8), ed => cursorWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('deleteWordPartLeft - basic', () => {
            const EXPECTED = '|   |/*| |Just| |some| |text| |a|+=| |3| |+|5|-|3| |*/|  |this|Is|A|Camel|Case|Var|  |this_|is_|a_|snake_|case_|var| |THIS_|IS_|CAPS_|SNAKE| |this_|IS|Mixed|Use';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1000), ed => deleteWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getValue().length === 0);
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('deleteWordPartRight - basic', () => {
            const EXPECTED = '   |/*| |Just| |some| |text| |a|+=| |3| |+|5|-|3| |*/|  |this|Is|A|Camel|Case|Var|  |this|_is|_a|_snake|_case|_var| |THIS|_IS|_CAPS|_SNAKE| |this|_IS|Mixed|Use|';
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => deleteWordPartRight(ed), ed => new position_1.Position(1, text.length - ed.getValue().length + 1), ed => ed.getValue().length === 0);
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('issue #158667: cursorWordPartLeft stops at "-" even when "-" is not in word separators', () => {
            const EXPECTED = [
                '|this-|is-|a-|kebab-|case-|var| |THIS-|IS-|CAPS-|KEBAB| |this-|IS|Mixed|Use',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => cursorWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)), { wordSeparators: "!\"#&'()*+,./:;<=>?@[\\]^`{|}·" } // default characters sans '$-%~' plus '·'
            );
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('issue #158667: cursorWordPartRight stops at "-" even when "-" is not in word separators', () => {
            const EXPECTED = [
                'this|-is|-a|-kebab|-case|-var| |THIS|-IS|-CAPS|-KEBAB| |this|-IS|Mixed|Use|',
            ].join('\n');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => cursorWordPartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 60)), { wordSeparators: "!\"#&'()*+,./:;<=>?@[\\]^`{|}·" } // default characters sans '$-%~' plus '·'
            );
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('issue #158667: deleteWordPartLeft stops at "-" even when "-" is not in word separators', () => {
            const EXPECTED = [
                '|this-|is-|a-|kebab-|case-|var| |THIS-|IS-|CAPS-|KEBAB| |this-|IS|Mixed|Use',
            ].join(' ');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1000, 1000), ed => deleteWordPartLeft(ed), ed => ed.getPosition(), ed => ed.getValue().length === 0, { wordSeparators: "!\"#&'()*+,./:;<=>?@[\\]^`{|}·" } // default characters sans '$-%~' plus '·'
            );
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
        test('issue #158667: deleteWordPartRight stops at "-" even when "-" is not in word separators', () => {
            const EXPECTED = [
                'this|-is|-a|-kebab|-case|-var| |THIS|-IS|-CAPS|-KEBAB| |this|-IS|Mixed|Use|',
            ].join(' ');
            const [text,] = (0, wordTestUtils_1.deserializePipePositions)(EXPECTED);
            const actualStops = (0, wordTestUtils_1.testRepeatedActionAndExtractPositions)(text, new position_1.Position(1, 1), ed => deleteWordPartRight(ed), ed => new position_1.Position(1, text.length - ed.getValue().length + 1), ed => ed.getValue().length === 0, { wordSeparators: "!\"#&'()*+,./:;<=>?@[\\]^`{|}·" } // default characters sans '$-%~' plus '·'
            );
            const actual = (0, wordTestUtils_1.serializePipePositions)(text, actualStops);
            assert.deepStrictEqual(actual, EXPECTED);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZFBhcnRPcGVyYXRpb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3dvcmRQYXJ0T3BlcmF0aW9ucy90ZXN0L2Jyb3dzZXIvd29yZFBhcnRPcGVyYXRpb25zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtRQUVoQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLHVDQUFrQixFQUFFLENBQUM7UUFDckQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLHdDQUFtQixFQUFFLENBQUM7UUFDdkQsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLHVDQUFrQixFQUFFLENBQUM7UUFDckQsTUFBTSx5QkFBeUIsR0FBRyxJQUFJLDZDQUF3QixFQUFFLENBQUM7UUFDakUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLHdDQUFtQixFQUFFLENBQUM7UUFDdkQsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLDhDQUF5QixFQUFFLENBQUM7UUFFbkUsTUFBTSxlQUFlLEdBQUcsSUFBSSw2QkFBcUIsRUFBRSxDQUFDLFdBQVcsQ0FDOUQsNkRBQTZCLEVBQzdCLElBQUksbUVBQWdDLEVBQUUsQ0FDdEMsQ0FBQztRQUVGLFNBQVMsZ0JBQWdCLENBQUMsTUFBbUIsRUFBRSxPQUFzQjtZQUNwRSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBQ0QsU0FBUyxrQkFBa0IsQ0FBQyxNQUFtQixFQUFFLGtCQUEyQixLQUFLO1lBQ2hGLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixDQUFD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