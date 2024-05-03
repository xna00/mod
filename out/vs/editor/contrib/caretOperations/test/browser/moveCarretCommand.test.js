/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/test/common/utils", "vs/editor/common/core/selection", "vs/editor/contrib/caretOperations/browser/moveCaretCommand", "vs/editor/test/browser/testCommand"], function (require, exports, utils_1, selection_1, moveCaretCommand_1, testCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testMoveCaretLeftCommand(lines, selection, expectedLines, expectedSelection) {
        (0, testCommand_1.testCommand)(lines, null, selection, (accessor, sel) => new moveCaretCommand_1.MoveCaretCommand(sel, true), expectedLines, expectedSelection);
    }
    function testMoveCaretRightCommand(lines, selection, expectedLines, expectedSelection) {
        (0, testCommand_1.testCommand)(lines, null, selection, (accessor, sel) => new moveCaretCommand_1.MoveCaretCommand(sel, false), expectedLines, expectedSelection);
    }
    suite('Editor Contrib - Move Caret Command', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('move selection to left', function () {
            testMoveCaretLeftCommand([
                '012345'
            ], new selection_1.Selection(1, 3, 1, 5), [
                '023145'
            ], new selection_1.Selection(1, 2, 1, 4));
        });
        test('move selection to right', function () {
            testMoveCaretRightCommand([
                '012345'
            ], new selection_1.Selection(1, 3, 1, 5), [
                '014235'
            ], new selection_1.Selection(1, 4, 1, 6));
        });
        test('move selection to left - from first column - no change', function () {
            testMoveCaretLeftCommand([
                '012345'
            ], new selection_1.Selection(1, 1, 1, 1), [
                '012345'
            ], new selection_1.Selection(1, 1, 1, 1));
        });
        test('move selection to right - from last column - no change', function () {
            testMoveCaretRightCommand([
                '012345'
            ], new selection_1.Selection(1, 5, 1, 7), [
                '012345'
            ], new selection_1.Selection(1, 5, 1, 7));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZUNhcnJldENvbW1hbmQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY2FyZXRPcGVyYXRpb25zL3Rlc3QvYnJvd3Nlci9tb3ZlQ2FycmV0Q29tbWFuZC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLFNBQVMsd0JBQXdCLENBQUMsS0FBZSxFQUFFLFNBQW9CLEVBQUUsYUFBdUIsRUFBRSxpQkFBNEI7UUFDN0gsSUFBQSx5QkFBVyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsSUFBSSxtQ0FBZ0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDM0gsQ0FBQztJQUVELFNBQVMseUJBQXlCLENBQUMsS0FBZSxFQUFFLFNBQW9CLEVBQUUsYUFBdUIsRUFBRSxpQkFBNEI7UUFDOUgsSUFBQSx5QkFBVyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsSUFBSSxtQ0FBZ0IsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDNUgsQ0FBQztJQUVELEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7UUFFakQsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRTtZQUM5Qix3QkFBd0IsQ0FDdkI7Z0JBQ0MsUUFBUTthQUNSLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN6QjtnQkFDQyxRQUFRO2FBQ1IsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQ3pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyx5QkFBeUIsRUFBRTtZQUMvQix5QkFBeUIsQ0FDeEI7Z0JBQ0MsUUFBUTthQUNSLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN6QjtnQkFDQyxRQUFRO2FBQ1IsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQ3pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyx3REFBd0QsRUFBRTtZQUM5RCx3QkFBd0IsQ0FDdkI7Z0JBQ0MsUUFBUTthQUNSLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN6QjtnQkFDQyxRQUFRO2FBQ1IsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQ3pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyx3REFBd0QsRUFBRTtZQUM5RCx5QkFBeUIsQ0FDeEI7Z0JBQ0MsUUFBUTthQUNSLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN6QjtnQkFDQyxRQUFRO2FBQ1IsRUFDRCxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQ3pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=