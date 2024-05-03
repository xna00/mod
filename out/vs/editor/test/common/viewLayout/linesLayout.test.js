define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/viewLayout/linesLayout"], function (require, exports, assert, utils_1, linesLayout_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor ViewLayout - LinesLayout', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function insertWhitespace(linesLayout, afterLineNumber, ordinal, heightInPx, minWidth) {
            let id;
            linesLayout.changeWhitespace((accessor) => {
                id = accessor.insertWhitespace(afterLineNumber, ordinal, heightInPx, minWidth);
            });
            return id;
        }
        function changeOneWhitespace(linesLayout, id, newAfterLineNumber, newHeight) {
            linesLayout.changeWhitespace((accessor) => {
                accessor.changeOneWhitespace(id, newAfterLineNumber, newHeight);
            });
        }
        function removeWhitespace(linesLayout, id) {
            linesLayout.changeWhitespace((accessor) => {
                accessor.removeWhitespace(id);
            });
        }
        test('LinesLayout 1', () => {
            // Start off with 10 lines
            const linesLayout = new linesLayout_1.LinesLayout(10, 10, 0, 0);
            // lines: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            // whitespace: -
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 100);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 10);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 20);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 30);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 40);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 50);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 60);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 70);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(9), 80);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(10), 90);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(0), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(1), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(5), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(9), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(10), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(11), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(15), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(19), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(20), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(21), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(29), 3);
            // Add whitespace of height 5px after 2nd line
            insertWhitespace(linesLayout, 2, 0, 5, 0);
            // lines: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            // whitespace: a(2,5)
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 105);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 10);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 25);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 35);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 45);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(0), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(1), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(9), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(10), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(20), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(21), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(24), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(25), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(35), 4);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(45), 5);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(104), 10);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(105), 10);
            // Add two more whitespaces of height 5px
            insertWhitespace(linesLayout, 3, 0, 5, 0);
            insertWhitespace(linesLayout, 4, 0, 5, 0);
            // lines: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            // whitespace: a(2,5), b(3, 5), c(4, 5)
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 115);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 10);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 25);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 40);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 55);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 65);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(0), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(1), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(9), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(10), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(19), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(20), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(34), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(35), 4);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(49), 4);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(50), 5);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(64), 5);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(65), 6);
            assert.strictEqual(linesLayout.getVerticalOffsetForWhitespaceIndex(0), 20); // 20 -> 25
            assert.strictEqual(linesLayout.getVerticalOffsetForWhitespaceIndex(1), 35); // 35 -> 40
            assert.strictEqual(linesLayout.getVerticalOffsetForWhitespaceIndex(2), 50);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(0), 0);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(19), 0);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(20), 0);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(21), 0);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(22), 0);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(23), 0);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(24), 0);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(25), 1);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(26), 1);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(34), 1);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(35), 1);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(36), 1);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(39), 1);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(40), 2);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(41), 2);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(49), 2);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(50), 2);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(51), 2);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(54), 2);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(55), -1);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(1000), -1);
        });
        test('LinesLayout 2', () => {
            // Start off with 10 lines and one whitespace after line 2, of height 5
            const linesLayout = new linesLayout_1.LinesLayout(10, 1, 0, 0);
            const a = insertWhitespace(linesLayout, 2, 0, 5, 0);
            // 10 lines
            // whitespace: - a(2,5)
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 15);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 1);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 7);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 8);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 9);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 10);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 11);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 12);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(9), 13);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(10), 14);
            // Change whitespace height
            // 10 lines
            // whitespace: - a(2,10)
            changeOneWhitespace(linesLayout, a, 2, 10);
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 20);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 1);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 12);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 13);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 14);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 15);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 16);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 17);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(9), 18);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(10), 19);
            // Change whitespace position
            // 10 lines
            // whitespace: - a(5,10)
            changeOneWhitespace(linesLayout, a, 5, 10);
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 20);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 1);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 2);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 3);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 4);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 15);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 16);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 17);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(9), 18);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(10), 19);
            // Pretend that lines 5 and 6 were deleted
            // 8 lines
            // whitespace: - a(4,10)
            linesLayout.onLinesDeleted(5, 6);
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 18);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 1);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 2);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 3);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 14);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 15);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 16);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 17);
            // Insert two lines at the beginning
            // 10 lines
            // whitespace: - a(6,10)
            linesLayout.onLinesInserted(1, 2);
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 20);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 1);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 2);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 3);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 4);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 5);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 16);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 17);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(9), 18);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(10), 19);
            // Remove whitespace
            // 10 lines
            removeWhitespace(linesLayout, a);
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 10);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 1);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 2);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 3);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 4);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 5);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 6);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 7);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(9), 8);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(10), 9);
        });
        test('LinesLayout Padding', () => {
            // Start off with 10 lines
            const linesLayout = new linesLayout_1.LinesLayout(10, 10, 15, 20);
            // lines: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            // whitespace: -
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 135);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 15);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 25);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 35);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 45);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 55);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 65);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 75);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 85);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(9), 95);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(10), 105);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(0), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(10), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(15), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(24), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(25), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(34), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(35), 3);
            // Add whitespace of height 5px after 2nd line
            insertWhitespace(linesLayout, 2, 0, 5, 0);
            // lines: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            // whitespace: a(2,5)
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 140);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 15);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 25);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 40);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 50);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(0), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(10), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(25), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(34), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(35), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(39), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(40), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(41), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(49), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(50), 4);
            // Add two more whitespaces of height 5px
            insertWhitespace(linesLayout, 3, 0, 5, 0);
            insertWhitespace(linesLayout, 4, 0, 5, 0);
            // lines: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            // whitespace: a(2,5), b(3, 5), c(4, 5)
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 150);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 15);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 25);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 40);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 55);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 70);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 80);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(0), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(15), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(24), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(30), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(35), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(39), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(40), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(49), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(50), 4);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(54), 4);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(55), 4);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(64), 4);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(65), 5);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(69), 5);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(70), 5);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(80), 6);
            assert.strictEqual(linesLayout.getVerticalOffsetForWhitespaceIndex(0), 35); // 35 -> 40
            assert.strictEqual(linesLayout.getVerticalOffsetForWhitespaceIndex(1), 50); // 50 -> 55
            assert.strictEqual(linesLayout.getVerticalOffsetForWhitespaceIndex(2), 65);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(0), 0);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(34), 0);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(35), 0);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(39), 0);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(40), 1);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(49), 1);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(50), 1);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(54), 1);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(55), 2);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(64), 2);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(65), 2);
            assert.strictEqual(linesLayout.getWhitespaceIndexAtOrAfterVerticallOffset(70), -1);
        });
        test('LinesLayout getLineNumberAtOrAfterVerticalOffset', () => {
            const linesLayout = new linesLayout_1.LinesLayout(10, 1, 0, 0);
            insertWhitespace(linesLayout, 6, 0, 10, 0);
            // 10 lines
            // whitespace: - a(6,10)
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 20);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 1);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 2);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 3);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 4);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 5);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 16);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 17);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(9), 18);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(10), 19);
            // Do some hit testing
            // line      [1, 2, 3, 4, 5, 6,  7,  8,  9, 10]
            // vertical: [0, 1, 2, 3, 4, 5, 16, 17, 18, 19]
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(-100), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(-1), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(0), 1);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(1), 2);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(2), 3);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(3), 4);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(4), 5);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(5), 6);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(6), 7);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(7), 7);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(8), 7);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(9), 7);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(10), 7);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(11), 7);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(12), 7);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(13), 7);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(14), 7);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(15), 7);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(16), 7);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(17), 8);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(18), 9);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(19), 10);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(20), 10);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(21), 10);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(22), 10);
            assert.strictEqual(linesLayout.getLineNumberAtOrAfterVerticalOffset(23), 10);
        });
        test('LinesLayout getCenteredLineInViewport', () => {
            const linesLayout = new linesLayout_1.LinesLayout(10, 1, 0, 0);
            insertWhitespace(linesLayout, 6, 0, 10, 0);
            // 10 lines
            // whitespace: - a(6,10)
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 20);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 1);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 2);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 3);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 4);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 5);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 16);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 17);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(9), 18);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(10), 19);
            // Find centered line in viewport 1
            // line      [1, 2, 3, 4, 5, 6,  7,  8,  9, 10]
            // vertical: [0, 1, 2, 3, 4, 5, 16, 17, 18, 19]
            assert.strictEqual(linesLayout.getLinesViewportData(0, 1).centeredLineNumber, 1);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 2).centeredLineNumber, 2);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 3).centeredLineNumber, 2);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 4).centeredLineNumber, 3);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 5).centeredLineNumber, 3);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 6).centeredLineNumber, 4);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 7).centeredLineNumber, 4);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 8).centeredLineNumber, 5);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 9).centeredLineNumber, 5);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 10).centeredLineNumber, 6);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 11).centeredLineNumber, 6);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 12).centeredLineNumber, 6);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 13).centeredLineNumber, 6);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 14).centeredLineNumber, 6);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 15).centeredLineNumber, 6);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 16).centeredLineNumber, 6);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 17).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 18).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 19).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 21).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 22).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 23).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 24).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 25).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 26).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 27).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 28).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 29).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 30).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 31).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 32).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(0, 33).centeredLineNumber, 7);
            // Find centered line in viewport 2
            // line      [1, 2, 3, 4, 5, 6,  7,  8,  9, 10]
            // vertical: [0, 1, 2, 3, 4, 5, 16, 17, 18, 19]
            assert.strictEqual(linesLayout.getLinesViewportData(0, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(1, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(2, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(3, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(4, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(5, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(6, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(7, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(8, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(9, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(10, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(11, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(12, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(13, 20).centeredLineNumber, 7);
            assert.strictEqual(linesLayout.getLinesViewportData(14, 20).centeredLineNumber, 8);
            assert.strictEqual(linesLayout.getLinesViewportData(15, 20).centeredLineNumber, 8);
            assert.strictEqual(linesLayout.getLinesViewportData(16, 20).centeredLineNumber, 9);
            assert.strictEqual(linesLayout.getLinesViewportData(17, 20).centeredLineNumber, 9);
            assert.strictEqual(linesLayout.getLinesViewportData(18, 20).centeredLineNumber, 10);
            assert.strictEqual(linesLayout.getLinesViewportData(19, 20).centeredLineNumber, 10);
            assert.strictEqual(linesLayout.getLinesViewportData(20, 23).centeredLineNumber, 10);
            assert.strictEqual(linesLayout.getLinesViewportData(21, 23).centeredLineNumber, 10);
            assert.strictEqual(linesLayout.getLinesViewportData(22, 23).centeredLineNumber, 10);
        });
        test('LinesLayout getLinesViewportData 1', () => {
            const linesLayout = new linesLayout_1.LinesLayout(10, 10, 0, 0);
            insertWhitespace(linesLayout, 6, 0, 100, 0);
            // 10 lines
            // whitespace: - a(6,100)
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 200);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 10);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 20);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 30);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 40);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 50);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 160);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 170);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(9), 180);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(10), 190);
            // viewport 0->50
            let viewportData = linesLayout.getLinesViewportData(0, 50);
            assert.strictEqual(viewportData.startLineNumber, 1);
            assert.strictEqual(viewportData.endLineNumber, 5);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 1);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 5);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [0, 10, 20, 30, 40]);
            // viewport 1->51
            viewportData = linesLayout.getLinesViewportData(1, 51);
            assert.strictEqual(viewportData.startLineNumber, 1);
            assert.strictEqual(viewportData.endLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 2);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 5);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [0, 10, 20, 30, 40, 50]);
            // viewport 5->55
            viewportData = linesLayout.getLinesViewportData(5, 55);
            assert.strictEqual(viewportData.startLineNumber, 1);
            assert.strictEqual(viewportData.endLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 2);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 5);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [0, 10, 20, 30, 40, 50]);
            // viewport 10->60
            viewportData = linesLayout.getLinesViewportData(10, 60);
            assert.strictEqual(viewportData.startLineNumber, 2);
            assert.strictEqual(viewportData.endLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 2);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 6);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [10, 20, 30, 40, 50]);
            // viewport 50->100
            viewportData = linesLayout.getLinesViewportData(50, 100);
            assert.strictEqual(viewportData.startLineNumber, 6);
            assert.strictEqual(viewportData.endLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 6);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [50]);
            // viewport 60->110
            viewportData = linesLayout.getLinesViewportData(60, 110);
            assert.strictEqual(viewportData.startLineNumber, 7);
            assert.strictEqual(viewportData.endLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 7);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [160]);
            // viewport 65->115
            viewportData = linesLayout.getLinesViewportData(65, 115);
            assert.strictEqual(viewportData.startLineNumber, 7);
            assert.strictEqual(viewportData.endLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 7);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [160]);
            // viewport 50->159
            viewportData = linesLayout.getLinesViewportData(50, 159);
            assert.strictEqual(viewportData.startLineNumber, 6);
            assert.strictEqual(viewportData.endLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 6);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [50]);
            // viewport 50->160
            viewportData = linesLayout.getLinesViewportData(50, 160);
            assert.strictEqual(viewportData.startLineNumber, 6);
            assert.strictEqual(viewportData.endLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 6);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [50]);
            // viewport 51->161
            viewportData = linesLayout.getLinesViewportData(51, 161);
            assert.strictEqual(viewportData.startLineNumber, 6);
            assert.strictEqual(viewportData.endLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 7);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [50, 160]);
            // viewport 150->169
            viewportData = linesLayout.getLinesViewportData(150, 169);
            assert.strictEqual(viewportData.startLineNumber, 7);
            assert.strictEqual(viewportData.endLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 7);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [160]);
            // viewport 159->169
            viewportData = linesLayout.getLinesViewportData(159, 169);
            assert.strictEqual(viewportData.startLineNumber, 7);
            assert.strictEqual(viewportData.endLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 7);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [160]);
            // viewport 160->169
            viewportData = linesLayout.getLinesViewportData(160, 169);
            assert.strictEqual(viewportData.startLineNumber, 7);
            assert.strictEqual(viewportData.endLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 7);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [160]);
            // viewport 160->1000
            viewportData = linesLayout.getLinesViewportData(160, 1000);
            assert.strictEqual(viewportData.startLineNumber, 7);
            assert.strictEqual(viewportData.endLineNumber, 10);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 10);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [160, 170, 180, 190]);
        });
        test('LinesLayout getLinesViewportData 2 & getWhitespaceViewportData', () => {
            const linesLayout = new linesLayout_1.LinesLayout(10, 10, 0, 0);
            const a = insertWhitespace(linesLayout, 6, 0, 100, 0);
            const b = insertWhitespace(linesLayout, 7, 0, 50, 0);
            // 10 lines
            // whitespace: - a(6,100), b(7, 50)
            assert.strictEqual(linesLayout.getLinesTotalHeight(), 250);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(1), 0);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(2), 10);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(3), 20);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(4), 30);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(5), 40);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(6), 50);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(7), 160);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(8), 220);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(9), 230);
            assert.strictEqual(linesLayout.getVerticalOffsetForLineNumber(10), 240);
            // viewport 50->160
            let viewportData = linesLayout.getLinesViewportData(50, 160);
            assert.strictEqual(viewportData.startLineNumber, 6);
            assert.strictEqual(viewportData.endLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 6);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [50]);
            let whitespaceData = linesLayout.getWhitespaceViewportData(50, 160);
            assert.deepStrictEqual(whitespaceData, [{
                    id: a,
                    afterLineNumber: 6,
                    verticalOffset: 60,
                    height: 100
                }]);
            // viewport 50->219
            viewportData = linesLayout.getLinesViewportData(50, 219);
            assert.strictEqual(viewportData.startLineNumber, 6);
            assert.strictEqual(viewportData.endLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 7);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [50, 160]);
            whitespaceData = linesLayout.getWhitespaceViewportData(50, 219);
            assert.deepStrictEqual(whitespaceData, [{
                    id: a,
                    afterLineNumber: 6,
                    verticalOffset: 60,
                    height: 100
                }, {
                    id: b,
                    afterLineNumber: 7,
                    verticalOffset: 170,
                    height: 50
                }]);
            // viewport 50->220
            viewportData = linesLayout.getLinesViewportData(50, 220);
            assert.strictEqual(viewportData.startLineNumber, 6);
            assert.strictEqual(viewportData.endLineNumber, 7);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 7);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [50, 160]);
            // viewport 50->250
            viewportData = linesLayout.getLinesViewportData(50, 250);
            assert.strictEqual(viewportData.startLineNumber, 6);
            assert.strictEqual(viewportData.endLineNumber, 10);
            assert.strictEqual(viewportData.completelyVisibleStartLineNumber, 6);
            assert.strictEqual(viewportData.completelyVisibleEndLineNumber, 10);
            assert.deepStrictEqual(viewportData.relativeVerticalOffset, [50, 160, 220, 230, 240]);
        });
        test('LinesLayout getWhitespaceAtVerticalOffset', () => {
            const linesLayout = new linesLayout_1.LinesLayout(10, 10, 0, 0);
            const a = insertWhitespace(linesLayout, 6, 0, 100, 0);
            const b = insertWhitespace(linesLayout, 7, 0, 50, 0);
            let whitespace = linesLayout.getWhitespaceAtVerticalOffset(0);
            assert.strictEqual(whitespace, null);
            whitespace = linesLayout.getWhitespaceAtVerticalOffset(59);
            assert.strictEqual(whitespace, null);
            whitespace = linesLayout.getWhitespaceAtVerticalOffset(60);
            assert.strictEqual(whitespace.id, a);
            whitespace = linesLayout.getWhitespaceAtVerticalOffset(61);
            assert.strictEqual(whitespace.id, a);
            whitespace = linesLayout.getWhitespaceAtVerticalOffset(159);
            assert.strictEqual(whitespace.id, a);
            whitespace = linesLayout.getWhitespaceAtVerticalOffset(160);
            assert.strictEqual(whitespace, null);
            whitespace = linesLayout.getWhitespaceAtVerticalOffset(161);
            assert.strictEqual(whitespace, null);
            whitespace = linesLayout.getWhitespaceAtVerticalOffset(169);
            assert.strictEqual(whitespace, null);
            whitespace = linesLayout.getWhitespaceAtVerticalOffset(170);
            assert.strictEqual(whitespace.id, b);
            whitespace = linesLayout.getWhitespaceAtVerticalOffset(171);
            assert.strictEqual(whitespace.id, b);
            whitespace = linesLayout.getWhitespaceAtVerticalOffset(219);
            assert.strictEqual(whitespace.id, b);
            whitespace = linesLayout.getWhitespaceAtVerticalOffset(220);
            assert.strictEqual(whitespace, null);
        });
        test('LinesLayout', () => {
            const linesLayout = new linesLayout_1.LinesLayout(100, 20, 0, 0);
            // Insert a whitespace after line number 2, of height 10
            const a = insertWhitespace(linesLayout, 2, 0, 10, 0);
            // whitespaces: a(2, 10)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 1);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 2);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 10);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 10);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 10);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 10);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 10);
            // Insert a whitespace again after line number 2, of height 20
            let b = insertWhitespace(linesLayout, 2, 0, 20, 0);
            // whitespaces: a(2, 10), b(2, 20)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 2);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 2);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 10);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 2);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(1), 20);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 10);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(1), 30);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 30);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 30);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 30);
            // Change last inserted whitespace height to 30
            changeOneWhitespace(linesLayout, b, 2, 30);
            // whitespaces: a(2, 10), b(2, 30)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 2);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 2);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 10);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 2);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(1), 30);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 10);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(1), 40);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 40);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 40);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 40);
            // Remove last inserted whitespace
            removeWhitespace(linesLayout, b);
            // whitespaces: a(2, 10)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 1);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 2);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 10);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 10);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 10);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 10);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 10);
            // Add a whitespace before the first line of height 50
            b = insertWhitespace(linesLayout, 0, 0, 50, 0);
            // whitespaces: b(0, 50), a(2, 10)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 2);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 0);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 50);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 2);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(1), 10);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 50);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(1), 60);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 60);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 60);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 60);
            // Add a whitespace after line 4 of height 20
            insertWhitespace(linesLayout, 4, 0, 20, 0);
            // whitespaces: b(0, 50), a(2, 10), c(4, 20)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 3);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 0);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 50);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 2);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(1), 10);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(2), 4);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(2), 20);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 50);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(1), 60);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(2), 80);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 80);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 60);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 60);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(5), 80);
            // Add a whitespace after line 3 of height 30
            insertWhitespace(linesLayout, 3, 0, 30, 0);
            // whitespaces: b(0, 50), a(2, 10), d(3, 30), c(4, 20)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 4);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 0);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 50);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 2);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(1), 10);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(2), 3);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(2), 30);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(3), 4);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(3), 20);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 50);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(1), 60);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(2), 90);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(3), 110);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 110);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 60);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 90);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(5), 110);
            // Change whitespace after line 2 to height of 100
            changeOneWhitespace(linesLayout, a, 2, 100);
            // whitespaces: b(0, 50), a(2, 100), d(3, 30), c(4, 20)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 4);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 0);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 50);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 2);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(1), 100);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(2), 3);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(2), 30);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(3), 4);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(3), 20);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 50);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(1), 150);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(2), 180);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(3), 200);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 200);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 150);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 180);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(5), 200);
            // Remove whitespace after line 2
            removeWhitespace(linesLayout, a);
            // whitespaces: b(0, 50), d(3, 30), c(4, 20)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 3);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 0);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 50);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 3);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(1), 30);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(2), 4);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(2), 20);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 50);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(1), 80);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(2), 100);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 100);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 80);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(5), 100);
            // Remove whitespace before line 1
            removeWhitespace(linesLayout, b);
            // whitespaces: d(3, 30), c(4, 20)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 2);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 3);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 30);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 4);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(1), 20);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 30);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(1), 50);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 30);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(5), 50);
            // Delete line 1
            linesLayout.onLinesDeleted(1, 1);
            // whitespaces: d(2, 30), c(3, 20)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 2);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 2);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 30);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 3);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(1), 20);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 30);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(1), 50);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 30);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(5), 50);
            // Insert a line before line 1
            linesLayout.onLinesInserted(1, 1);
            // whitespaces: d(3, 30), c(4, 20)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 2);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 3);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 30);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 4);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(1), 20);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 30);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(1), 50);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 30);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(5), 50);
            // Delete line 4
            linesLayout.onLinesDeleted(4, 4);
            // whitespaces: d(3, 30), c(3, 20)
            assert.strictEqual(linesLayout.getWhitespacesCount(), 2);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 3);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(0), 30);
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 3);
            assert.strictEqual(linesLayout.getHeightForWhitespaceIndex(1), 20);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(0), 30);
            assert.strictEqual(linesLayout.getWhitespacesAccumulatedHeight(1), 50);
            assert.strictEqual(linesLayout.getWhitespacesTotalHeight(), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(1), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(2), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(3), 0);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(4), 50);
            assert.strictEqual(linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(5), 50);
        });
        test('LinesLayout findInsertionIndex', () => {
            const makeInternalWhitespace = (afterLineNumbers, ordinal = 0) => {
                return afterLineNumbers.map((afterLineNumber) => new linesLayout_1.EditorWhitespace('', afterLineNumber, ordinal, 0, 0));
            };
            let arr;
            arr = makeInternalWhitespace([]);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 0, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 1, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 2, 0), 0);
            arr = makeInternalWhitespace([1]);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 0, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 1, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 2, 0), 1);
            arr = makeInternalWhitespace([1, 3]);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 0, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 1, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 2, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 3, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 4, 0), 2);
            arr = makeInternalWhitespace([1, 3, 5]);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 0, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 1, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 2, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 3, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 4, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 5, 0), 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 6, 0), 3);
            arr = makeInternalWhitespace([1, 3, 5], 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 0, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 1, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 2, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 3, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 4, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 5, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 6, 0), 3);
            arr = makeInternalWhitespace([1, 3, 5, 7]);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 0, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 1, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 2, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 3, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 4, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 5, 0), 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 6, 0), 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 7, 0), 4);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 8, 0), 4);
            arr = makeInternalWhitespace([1, 3, 5, 7, 9]);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 0, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 1, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 2, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 3, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 4, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 5, 0), 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 6, 0), 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 7, 0), 4);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 8, 0), 4);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 9, 0), 5);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 10, 0), 5);
            arr = makeInternalWhitespace([1, 3, 5, 7, 9, 11]);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 0, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 1, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 2, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 3, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 4, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 5, 0), 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 6, 0), 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 7, 0), 4);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 8, 0), 4);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 9, 0), 5);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 10, 0), 5);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 11, 0), 6);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 12, 0), 6);
            arr = makeInternalWhitespace([1, 3, 5, 7, 9, 11, 13]);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 0, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 1, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 2, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 3, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 4, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 5, 0), 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 6, 0), 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 7, 0), 4);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 8, 0), 4);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 9, 0), 5);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 10, 0), 5);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 11, 0), 6);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 12, 0), 6);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 13, 0), 7);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 14, 0), 7);
            arr = makeInternalWhitespace([1, 3, 5, 7, 9, 11, 13, 15]);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 0, 0), 0);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 1, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 2, 0), 1);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 3, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 4, 0), 2);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 5, 0), 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 6, 0), 3);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 7, 0), 4);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 8, 0), 4);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 9, 0), 5);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 10, 0), 5);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 11, 0), 6);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 12, 0), 6);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 13, 0), 7);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 14, 0), 7);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 15, 0), 8);
            assert.strictEqual(linesLayout_1.LinesLayout.findInsertionIndex(arr, 16, 0), 8);
        });
        test('LinesLayout changeWhitespaceAfterLineNumber & getFirstWhitespaceIndexAfterLineNumber', () => {
            const linesLayout = new linesLayout_1.LinesLayout(100, 20, 0, 0);
            const a = insertWhitespace(linesLayout, 0, 0, 1, 0);
            const b = insertWhitespace(linesLayout, 7, 0, 1, 0);
            const c = insertWhitespace(linesLayout, 3, 0, 1, 0);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), a); // 0
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 0);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), c); // 3
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 3);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), b); // 7
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(2), 7);
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(1), 1); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(2), 1); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(3), 1); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(4), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(5), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(6), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(7), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(8), -1); // --
            // Do not really move a
            changeOneWhitespace(linesLayout, a, 1, 1);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), a); // 1
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 1);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), c); // 3
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 3);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), b); // 7
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(2), 7);
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(1), 0); // a
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(2), 1); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(3), 1); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(4), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(5), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(6), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(7), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(8), -1); // --
            // Do not really move a
            changeOneWhitespace(linesLayout, a, 2, 1);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), a); // 2
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 2);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), c); // 3
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 3);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), b); // 7
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(2), 7);
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(1), 0); // a
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(2), 0); // a
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(3), 1); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(4), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(5), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(6), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(7), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(8), -1); // --
            // Change a to conflict with c => a gets placed after c
            changeOneWhitespace(linesLayout, a, 3, 1);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), c); // 3
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 3);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), a); // 3
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 3);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), b); // 7
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(2), 7);
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(1), 0); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(2), 0); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(3), 0); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(4), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(5), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(6), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(7), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(8), -1); // --
            // Make a no-op
            changeOneWhitespace(linesLayout, c, 3, 1);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), c); // 3
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 3);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), a); // 3
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 3);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), b); // 7
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(2), 7);
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(1), 0); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(2), 0); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(3), 0); // c
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(4), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(5), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(6), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(7), 2); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(8), -1); // --
            // Conflict c with b => c gets placed after b
            changeOneWhitespace(linesLayout, c, 7, 1);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), a); // 3
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(0), 3);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), b); // 7
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(1), 7);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), c); // 7
            assert.strictEqual(linesLayout.getAfterLineNumberForWhitespaceIndex(2), 7);
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(1), 0); // a
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(2), 0); // a
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(3), 0); // a
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(4), 1); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(5), 1); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(6), 1); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(7), 1); // b
            assert.strictEqual(linesLayout.getFirstWhitespaceIndexAfterLineNumber(8), -1); // --
        });
        test('LinesLayout Bug', () => {
            const linesLayout = new linesLayout_1.LinesLayout(100, 20, 0, 0);
            const a = insertWhitespace(linesLayout, 0, 0, 1, 0);
            const b = insertWhitespace(linesLayout, 7, 0, 1, 0);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), a); // 0
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), b); // 7
            const c = insertWhitespace(linesLayout, 3, 0, 1, 0);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), a); // 0
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), c); // 3
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), b); // 7
            const d = insertWhitespace(linesLayout, 2, 0, 1, 0);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), a); // 0
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), d); // 2
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), c); // 3
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(3), b); // 7
            const e = insertWhitespace(linesLayout, 8, 0, 1, 0);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), a); // 0
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), d); // 2
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), c); // 3
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(3), b); // 7
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(4), e); // 8
            const f = insertWhitespace(linesLayout, 11, 0, 1, 0);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), a); // 0
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), d); // 2
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), c); // 3
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(3), b); // 7
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(4), e); // 8
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(5), f); // 11
            const g = insertWhitespace(linesLayout, 10, 0, 1, 0);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), a); // 0
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), d); // 2
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), c); // 3
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(3), b); // 7
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(4), e); // 8
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(5), g); // 10
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(6), f); // 11
            const h = insertWhitespace(linesLayout, 0, 0, 1, 0);
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(0), a); // 0
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(1), h); // 0
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(2), d); // 2
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(3), c); // 3
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(4), b); // 7
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(5), e); // 8
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(6), g); // 10
            assert.strictEqual(linesLayout.getIdForWhitespaceIndex(7), f); // 11
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZXNMYXlvdXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL3ZpZXdMYXlvdXQvbGluZXNMYXlvdXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFRQSxLQUFLLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxFQUFFO1FBRTdDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLGdCQUFnQixDQUFDLFdBQXdCLEVBQUUsZUFBdUIsRUFBRSxPQUFlLEVBQUUsVUFBa0IsRUFBRSxRQUFnQjtZQUNqSSxJQUFJLEVBQVUsQ0FBQztZQUNmLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO2dCQUN6QyxFQUFFLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2hGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxFQUFHLENBQUM7UUFDWixDQUFDO1FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxXQUF3QixFQUFFLEVBQVUsRUFBRSxrQkFBMEIsRUFBRSxTQUFpQjtZQUMvRyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDekMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNqRSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxTQUFTLGdCQUFnQixDQUFDLFdBQXdCLEVBQUUsRUFBVTtZQUM3RCxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDekMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQy9CLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1lBRTFCLDBCQUEwQjtZQUMxQixNQUFNLFdBQVcsR0FBRyxJQUFJLHlCQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEQsMkNBQTJDO1lBQzNDLGdCQUFnQjtZQUNoQixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXZFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTVFLDhDQUE4QztZQUM5QyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUMsMkNBQTJDO1lBQzNDLHFCQUFxQjtZQUNyQixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRTlFLHlDQUF5QztZQUN6QyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFDLDJDQUEyQztZQUMzQyx1Q0FBdUM7WUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVc7WUFDdkYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsbUNBQW1DLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXO1lBQ3ZGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG1DQUFtQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRTNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FB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Q0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXZFLDZCQUE2QjtZQUM3QixXQUFXO1lBQ1gsd0JBQXdCO1lBQ3hCLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFdkUsMENBQTBDO1lBQzFDLFVBQVU7WUFDVix3QkFBd0I7WUFDeEIsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV0RSxvQ0FBb0M7WUFDcEMsV0FBVztZQUNYLHdCQUF3QjtZQUN4QixXQUFXLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXZFLG9CQUFvQjtZQUNwQixXQUFXO1lBQ1gsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJ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QUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTVFLHlDQUF5QztZQUN6QyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFDLDJDQUEyQztZQUMzQyx1Q0FBdUM7WUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVc7WUFDdkYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsbUNBQW1DLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXO1lBQ3ZGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG1DQUFtQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRTNFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLDBDQUEwQyxDQUFD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QUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0NBQW9DLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3RSxNQUFNLENB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QyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEYsbUNBQW1DO1lBQ25DLCtDQUErQztZQUMvQywrQ0FBK0M7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNwRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNyRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7WUFDL0MsTUFBTSxXQUFXLEdBQUcsSUFBSSx5QkFBVyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELGdCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1QyxXQUFXO1lBQ1gseUJBQXlCO1lBQ3pCLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsOEJBQThCLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFeEUsaUJBQWlCO1lBQ2pCLElBQUksWUFBWSxHQUFHLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZ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QyxDQUFDO1lBRXRDLFVBQVUsR0FBRyxXQUFXLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFckMsVUFBVSxHQUFHLFdBQVcsQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVyQyxVQUFVLEdBQUcsV0FBVyxDQUFDLDZCQUE2QixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXJDLFVBQVUsR0FBRyxXQUFXLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFXLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRDLFVBQVUsR0FBRyxXQUFXLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFXLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRDLFVBQVUsR0FBRyxXQUFXLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFXLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRDLFVBQVUsR0FBRyxXQUFXLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtZQUV4QixNQUFNLFdBQVcsR0FBRyxJQUFJLHlCQUFXLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENB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QyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWpFLEdBQUcsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWpFLEdBQUcsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLHlCQUFXLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsV0FBVyxDQUFDLHlCQUFXLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsV0FBVyxDQUFDLHlCQUFXLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsV0FBVyxDQUFDLHlCQUFXLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsV0FBVyxDQUFDLHlCQUFXLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsV0FBVyxDQUFDLHlCQUFXLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsV0FBVyxDQUFDLHlCQUFXLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVqRSxHQUFHLEdBQUcsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWpFLEdBQUcsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFakUsR0FBRyxHQUFHLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEUsR0FBRyxHQUFHLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMseUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWxFLEdBQUcsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEUsR0FBRyxHQUFHLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyx5QkFBVyxDQUFDLGtCQUFr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QUFDLFdBQVcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7WUFDbkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsb0NBQW9DLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsc0NBQXNDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLHNDQUFzQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsc0NBQXNDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLHNDQUFzQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtZQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsc0NBQXNDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLHNDQUFzQyxDQUFDLENBQUMsQ0FBQyxFQUFF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