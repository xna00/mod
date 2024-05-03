/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/editor/common/core/characterClassifier"], function (require, exports, arrays_1, lifecycle_1, characterClassifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommitCharacterController = void 0;
    class CommitCharacterController {
        constructor(editor, widget, model, accept) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._disposables.add(model.onDidSuggest(e => {
                if (e.completionModel.items.length === 0) {
                    this.reset();
                }
            }));
            this._disposables.add(model.onDidCancel(e => {
                this.reset();
            }));
            this._disposables.add(widget.onDidShow(() => this._onItem(widget.getFocusedItem())));
            this._disposables.add(widget.onDidFocus(this._onItem, this));
            this._disposables.add(widget.onDidHide(this.reset, this));
            this._disposables.add(editor.onWillType(text => {
                if (this._active && !widget.isFrozen() && model.state !== 0 /* State.Idle */) {
                    const ch = text.charCodeAt(text.length - 1);
                    if (this._active.acceptCharacters.has(ch) && editor.getOption(0 /* EditorOption.acceptSuggestionOnCommitCharacter */)) {
                        accept(this._active.item);
                    }
                }
            }));
        }
        _onItem(selected) {
            if (!selected || !(0, arrays_1.isNonEmptyArray)(selected.item.completion.commitCharacters)) {
                // no item or no commit characters
                this.reset();
                return;
            }
            if (this._active && this._active.item.item === selected.item) {
                // still the same item
                return;
            }
            // keep item and its commit characters
            const acceptCharacters = new characterClassifier_1.CharacterSet();
            for (const ch of selected.item.completion.commitCharacters) {
                if (ch.length > 0) {
                    acceptCharacters.add(ch.charCodeAt(0));
                }
            }
            this._active = { acceptCharacters, item: selected };
        }
        reset() {
            this._active = undefined;
        }
        dispose() {
            this._disposables.dispose();
        }
    }
    exports.CommitCharacterController = CommitCharacterController;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdENvbW1pdENoYXJhY3RlcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N1Z2dlc3QvYnJvd3Nlci9zdWdnZXN0Q29tbWl0Q2hhcmFjdGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSx5QkFBeUI7UUFTckMsWUFBWSxNQUFtQixFQUFFLE1BQXFCLEVBQUUsS0FBbUIsRUFBRSxNQUE4QztZQVAxRyxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBU3JELElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUMxQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2QsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMzQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUUxRCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM5QyxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssdUJBQWUsRUFBRSxDQUFDO29CQUN0RSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQzVDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksTUFBTSxDQUFDLFNBQVMsd0RBQWdELEVBQUUsQ0FBQzt3QkFDL0csTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzNCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sT0FBTyxDQUFDLFFBQXlDO1lBQ3hELElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxJQUFBLHdCQUFlLEVBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO2dCQUM5RSxrQ0FBa0M7Z0JBQ2xDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDYixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUM5RCxzQkFBc0I7Z0JBQ3RCLE9BQU87WUFDUixDQUFDO1lBRUQsc0NBQXNDO1lBQ3RDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxrQ0FBWSxFQUFFLENBQUM7WUFDNUMsS0FBSyxNQUFNLEVBQUUsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUM1RCxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ25CLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQztRQUNyRCxDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDO1FBQzFCLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM3QixDQUFDO0tBQ0Q7SUEvREQsOERBK0RDIn0=