define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, range_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor Model - Model Edit Operation', () => {
        const LINE1 = 'My First Line';
        const LINE2 = '\t\tMy Second Line';
        const LINE3 = '    Third Line';
        const LINE4 = '';
        const LINE5 = '1';
        let model;
        setup(() => {
            const text = LINE1 + '\r\n' +
                LINE2 + '\n' +
                LINE3 + '\n' +
                LINE4 + '\r\n' +
                LINE5;
            model = (0, testTextModel_1.createTextModel)(text);
        });
        teardown(() => {
            model.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function createSingleEditOp(text, positionLineNumber, positionColumn, selectionLineNumber = positionLineNumber, selectionColumn = positionColumn) {
            const range = new range_1.Range(selectionLineNumber, selectionColumn, positionLineNumber, positionColumn);
            return {
                range: range,
                text: text,
                forceMoveMarkers: false
            };
        }
        function assertSingleEditOp(singleEditOp, editedLines) {
            const editOp = [singleEditOp];
            const inverseEditOp = model.applyEdits(editOp, true);
            assert.strictEqual(model.getLineCount(), editedLines.length);
            for (let i = 0; i < editedLines.length; i++) {
                assert.strictEqual(model.getLineContent(i + 1), editedLines[i]);
            }
            const originalOp = model.applyEdits(inverseEditOp, true);
            assert.strictEqual(model.getLineCount(), 5);
            assert.strictEqual(model.getLineContent(1), LINE1);
            assert.strictEqual(model.getLineContent(2), LINE2);
            assert.strictEqual(model.getLineContent(3), LINE3);
            assert.strictEqual(model.getLineContent(4), LINE4);
            assert.strictEqual(model.getLineContent(5), LINE5);
            const simplifyEdit = (edit) => {
                return {
                    range: edit.range,
                    text: edit.text,
                    forceMoveMarkers: edit.forceMoveMarkers || false
                };
            };
            assert.deepStrictEqual(originalOp.map(simplifyEdit), editOp.map(simplifyEdit));
        }
        test('Insert inline', () => {
            assertSingleEditOp(createSingleEditOp('a', 1, 1), [
                'aMy First Line',
                LINE2,
                LINE3,
                LINE4,
                LINE5
            ]);
        });
        test('Replace inline/inline 1', () => {
            assertSingleEditOp(createSingleEditOp(' incredibly awesome', 1, 3), [
                'My incredibly awesome First Line',
                LINE2,
                LINE3,
                LINE4,
                LINE5
            ]);
        });
        test('Replace inline/inline 2', () => {
            assertSingleEditOp(createSingleEditOp(' with text at the end.', 1, 14), [
                'My First Line with text at the end.',
                LINE2,
                LINE3,
                LINE4,
                LINE5
            ]);
        });
        test('Replace inline/inline 3', () => {
            assertSingleEditOp(createSingleEditOp('My new First Line.', 1, 1, 1, 14), [
                'My new First Line.',
                LINE2,
                LINE3,
                LINE4,
                LINE5
            ]);
        });
        test('Replace inline/multi line 1', () => {
            assertSingleEditOp(createSingleEditOp('My new First Line.', 1, 1, 3, 15), [
                'My new First Line.',
                LINE4,
                LINE5
            ]);
        });
        test('Replace inline/multi line 2', () => {
            assertSingleEditOp(createSingleEditOp('My new First Line.', 1, 2, 3, 15), [
                'MMy new First Line.',
                LINE4,
                LINE5
            ]);
        });
        test('Replace inline/multi line 3', () => {
            assertSingleEditOp(createSingleEditOp('My new First Line.', 1, 2, 3, 2), [
                'MMy new First Line.   Third Line',
                LINE4,
                LINE5
            ]);
        });
        test('Replace muli line/multi line', () => {
            assertSingleEditOp(createSingleEditOp('1\n2\n3\n4\n', 1, 1), [
                '1',
                '2',
                '3',
                '4',
                LINE1,
                LINE2,
                LINE3,
                LINE4,
                LINE5
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxFZGl0T3BlcmF0aW9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2RlbC9tb2RlbEVkaXRPcGVyYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFXQSxLQUFLLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1FBQ2pELE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FBQztRQUM5QixNQUFNLEtBQUssR0FBRyxvQkFBb0IsQ0FBQztRQUNuQyxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQztRQUMvQixNQUFNLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDakIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDO1FBRWxCLElBQUksS0FBZ0IsQ0FBQztRQUVyQixLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsTUFBTSxJQUFJLEdBQ1QsS0FBSyxHQUFHLE1BQU07Z0JBQ2QsS0FBSyxHQUFHLElBQUk7Z0JBQ1osS0FBSyxHQUFHLElBQUk7Z0JBQ1osS0FBSyxHQUFHLE1BQU07Z0JBQ2QsS0FBSyxDQUFDO1lBQ1AsS0FBSyxHQUFHLElBQUEsK0JBQWUsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxrQkFBa0IsQ0FBQyxJQUFZLEVBQUUsa0JBQTBCLEVBQUUsY0FBc0IsRUFBRSxzQkFBOEIsa0JBQWtCLEVBQUUsa0JBQTBCLGNBQWM7WUFDdkwsTUFBTSxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQ3RCLG1CQUFtQixFQUNuQixlQUFlLEVBQ2Ysa0JBQWtCLEVB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