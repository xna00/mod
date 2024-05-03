/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/comment/browser/blockCommentCommand", "vs/editor/contrib/comment/browser/lineCommentCommand", "vs/nls", "vs/platform/actions/common/actions"], function (require, exports, keyCodes_1, editorExtensions_1, range_1, editorContextKeys_1, languageConfigurationRegistry_1, blockCommentCommand_1, lineCommentCommand_1, nls, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CommentLineAction extends editorExtensions_1.EditorAction {
        constructor(type, opts) {
            super(opts);
            this._type = type;
        }
        run(accessor, editor) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            if (!editor.hasModel()) {
                return;
            }
            const model = editor.getModel();
            const commands = [];
            const modelOptions = model.getOptions();
            const commentsOptions = editor.getOption(23 /* EditorOption.comments */);
            const selections = editor.getSelections().map((selection, index) => ({ selection, index, ignoreFirstLine: false }));
            selections.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.selection, b.selection));
            // Remove selections that would result in copying the same line
            let prev = selections[0];
            for (let i = 1; i < selections.length; i++) {
                const curr = selections[i];
                if (prev.selection.endLineNumber === curr.selection.startLineNumber) {
                    // these two selections would copy the same line
                    if (prev.index < curr.index) {
                        // prev wins
                        curr.ignoreFirstLine = true;
                    }
                    else {
                        // curr wins
                        prev.ignoreFirstLine = true;
                        prev = curr;
                    }
                }
            }
            for (const selection of selections) {
                commands.push(new lineCommentCommand_1.LineCommentCommand(languageConfigurationService, selection.selection, modelOptions.indentSize, this._type, commentsOptions.insertSpace, commentsOptions.ignoreEmptyLines, selection.ignoreFirstLine));
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    class ToggleCommentLineAction extends CommentLineAction {
        constructor() {
            super(0 /* Type.Toggle */, {
                id: 'editor.action.commentLine',
                label: nls.localize('comment.line', "Toggle Line Comment"),
                alias: 'Toggle Line Comment',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 90 /* KeyCode.Slash */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarEditMenu,
                    group: '5_insert',
                    title: nls.localize({ key: 'miToggleLineComment', comment: ['&& denotes a mnemonic'] }, "&&Toggle Line Comment"),
                    order: 1
                }
            });
        }
    }
    class AddLineCommentAction extends CommentLineAction {
        constructor() {
            super(1 /* Type.ForceAdd */, {
                id: 'editor.action.addCommentLine',
                label: nls.localize('comment.line.add', "Add Line Comment"),
                alias: 'Add Line Comment',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    class RemoveLineCommentAction extends CommentLineAction {
        constructor() {
            super(2 /* Type.ForceRemove */, {
                id: 'editor.action.removeCommentLine',
                label: nls.localize('comment.line.remove', "Remove Line Comment"),
                alias: 'Remove Line Comment',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 51 /* KeyCode.KeyU */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    class BlockCommentAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.blockComment',
                label: nls.localize('comment.block', "Toggle Block Comment"),
                alias: 'Toggle Block Comment',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 31 /* KeyCode.KeyA */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarEditMenu,
                    group: '5_insert',
                    title: nls.localize({ key: 'miToggleBlockComment', comment: ['&& denotes a mnemonic'] }, "Toggle &&Block Comment"),
                    order: 2
                }
            });
        }
        run(accessor, editor) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            if (!editor.hasModel()) {
                return;
            }
            const commentsOptions = editor.getOption(23 /* EditorOption.comments */);
            const commands = [];
            const selections = editor.getSelections();
            for (const selection of selections) {
                commands.push(new blockCommentCommand_1.BlockCommentCommand(selection, commentsOptions.insertSpace, languageConfigurationService));
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    (0, editorExtensions_1.registerEditorAction)(ToggleCommentLineAction);
    (0, editorExtensions_1.registerEditorAction)(AddLineCommentAction);
    (0, editorExtensions_1.registerEditorAction)(RemoveLineCommentAction);
    (0, editorExtensions_1.registerEditorAction)(BlockCommentAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29tbWVudC9icm93c2VyL2NvbW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQmhHLE1BQWUsaUJBQWtCLFNBQVEsK0JBQVk7UUFJcEQsWUFBWSxJQUFVLEVBQUUsSUFBb0I7WUFDM0MsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1osSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbkIsQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQW1CO1lBQ3pELE1BQU0sNEJBQTRCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw2REFBNkIsQ0FBQyxDQUFDO1lBRWpGLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDeEIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEMsTUFBTSxRQUFRLEdBQWUsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN4QyxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsU0FBUyxnQ0FBdUIsQ0FBQztZQUVoRSxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwSCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsYUFBSyxDQUFDLHdCQUF3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