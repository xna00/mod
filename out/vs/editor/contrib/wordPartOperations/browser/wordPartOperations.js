/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/cursor/cursorWordOperations", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/contrib/wordOperations/browser/wordOperations", "vs/platform/commands/common/commands"], function (require, exports, editorExtensions_1, cursorWordOperations_1, range_1, editorContextKeys_1, wordOperations_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorWordPartRightSelect = exports.CursorWordPartRight = exports.WordPartRightCommand = exports.CursorWordPartLeftSelect = exports.CursorWordPartLeft = exports.WordPartLeftCommand = exports.DeleteWordPartRight = exports.DeleteWordPartLeft = void 0;
    class DeleteWordPartLeft extends wordOperations_1.DeleteWordCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'deleteWordPartLeft',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 1 /* KeyCode.Backspace */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _delete(ctx, wordNavigationType) {
            const r = cursorWordOperations_1.WordPartOperations.deleteWordPartLeft(ctx);
            if (r) {
                return r;
            }
            return new range_1.Range(1, 1, 1, 1);
        }
    }
    exports.DeleteWordPartLeft = DeleteWordPartLeft;
    class DeleteWordPartRight extends wordOperations_1.DeleteWordCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'deleteWordPartRight',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 20 /* KeyCode.Delete */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _delete(ctx, wordNavigationType) {
            const r = cursorWordOperations_1.WordPartOperations.deleteWordPartRight(ctx);
            if (r) {
                return r;
            }
            const lineCount = ctx.model.getLineCount();
            const maxColumn = ctx.model.getLineMaxColumn(lineCount);
            return new range_1.Range(lineCount, maxColumn, lineCount, maxColumn);
        }
    }
    exports.DeleteWordPartRight = DeleteWordPartRight;
    class WordPartLeftCommand extends wordOperations_1.MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordPartOperations.moveWordPartLeft(wordSeparators, model, position);
        }
    }
    exports.WordPartLeftCommand = WordPartLeftCommand;
    class CursorWordPartLeft extends WordPartLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'cursorWordPartLeft',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartLeft = CursorWordPartLeft;
    // Register previous id for compatibility purposes
    commands_1.CommandsRegistry.registerCommandAlias('cursorWordPartStartLeft', 'cursorWordPartLeft');
    class CursorWordPartLeftSelect extends WordPartLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'cursorWordPartLeftSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartLeftSelect = CursorWordPartLeftSelect;
    // Register previous id for compatibility purposes
    commands_1.CommandsRegistry.registerCommandAlias('cursorWordPartStartLeftSelect', 'cursorWordPartLeftSelect');
    class WordPartRightCommand extends wordOperations_1.MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordPartOperations.moveWordPartRight(wordSeparators, model, position);
        }
    }
    exports.WordPartRightCommand = WordPartRightCommand;
    class CursorWordPartRight extends WordPartRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordPartRight',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartRight = CursorWordPartRight;
    class CursorWordPartRightSelect extends WordPartRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordPartRightSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartRightSelect = CursorWordPartRightSelect;
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordPartLeft());
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordPartRight());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartLeft());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartLeftSelect());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartRight());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartRightSelect());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZFBhcnRPcGVyYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi93b3JkUGFydE9wZXJhdGlvbnMvYnJvd3Nlci93b3JkUGFydE9wZXJhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLE1BQWEsa0JBQW1CLFNBQVEsa0NBQWlCO1FBQ3hEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLG9CQUFvQixFQUFFLElBQUk7Z0JBQzFCLGtCQUFrQixzQ0FBOEI7Z0JBQ2hELEVBQUUsRUFBRSxvQkFBb0I7Z0JBQ3hCLFlBQVksRUFBRSxxQ0FBaUIsQ0FBQyxRQUFRO2dCQUN4QyxNQUFNLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLHFDQUFpQixDQUFDLGNBQWM7b0JBQ3hDLE9BQU8sRUFBRSxDQUFDO29CQUNWLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSwrQ0FBMkIsNEJBQW9CLEVBQUU7b0JBQ2pFLE1BQU0sMENBQWdDO2lCQUN0QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUyxPQUFPLENBQUMsR0FBc0IsRUFBRSxrQkFBc0M7WUFDL0UsTUFBTSxDQUFDLEdBQUcseUNBQWtCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDckQsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDUCxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFDRCxPQUFPLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FDRDtJQXZCRCxnREF1QkM7SUFFRCxNQUFhLG1CQUFvQixTQUFRLGtDQUFpQjtRQUN6RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxvQkFBb0IsRUFBRSxJQUFJO2dCQUMxQixrQkFBa0Is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