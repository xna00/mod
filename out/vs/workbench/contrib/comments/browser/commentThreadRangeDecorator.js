/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/languages", "vs/editor/common/model/textModel"], function (require, exports, lifecycle_1, languages_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentThreadRangeDecorator = void 0;
    class CommentThreadRangeDecoration {
        get id() {
            return this._decorationId;
        }
        set id(id) {
            this._decorationId = id;
        }
        constructor(range, options) {
            this.range = range;
            this.options = options;
        }
    }
    class CommentThreadRangeDecorator extends lifecycle_1.Disposable {
        static { this.description = 'comment-thread-range-decorator'; }
        constructor(commentService) {
            super();
            this.decorationIds = [];
            this.activeDecorationIds = [];
            this.threadCollapseStateListeners = [];
            const decorationOptions = {
                description: CommentThreadRangeDecorator.description,
                isWholeLine: false,
                zIndex: 20,
                className: 'comment-thread-range',
                shouldFillLineOnLineBreak: true
            };
            this.decorationOptions = textModel_1.ModelDecorationOptions.createDynamic(decorationOptions);
            const activeDecorationOptions = {
                description: CommentThreadRangeDecorator.description,
                isWholeLine: false,
                zIndex: 20,
                className: 'comment-thread-range-current',
                shouldFillLineOnLineBreak: true
            };
            this.activeDecorationOptions = textModel_1.ModelDecorationOptions.createDynamic(activeDecorationOptions);
            this._register(commentService.onDidChangeCurrentCommentThread(thread => {
                this.updateCurrent(thread);
            }));
            this._register(commentService.onDidUpdateCommentThreads(() => {
                this.updateCurrent(undefined);
            }));
        }
        updateCurrent(thread) {
            if (!this.editor || (thread?.resource && (thread.resource?.toString() !== this.editor.getModel()?.uri.toString()))) {
                return;
            }
            this.currentThreadCollapseStateListener?.dispose();
            const newDecoration = [];
            if (thread) {
                const range = thread.range;
                if (range && !((range.startLineNumber === range.endLineNumber) && (range.startColumn === range.endColumn))) {
                    if (thread.collapsibleState === languages_1.CommentThreadCollapsibleState.Expanded) {
                        this.currentThreadCollapseStateListener = thread.onDidChangeCollapsibleState(state => {
                            if (state === languages_1.CommentThreadCollapsibleState.Collapsed) {
                                this.updateCurrent(undefined);
                            }
                        });
                        newDecoration.push(new CommentThreadRangeDecoration(range, this.activeDecorationOptions));
                    }
                }
            }
            this.editor.changeDecorations((changeAccessor) => {
                this.activeDecorationIds = changeAccessor.deltaDecorations(this.activeDecorationIds, newDecoration);
                newDecoration.forEach((decoration, index) => decoration.id = this.decorationIds[index]);
            });
        }
        update(editor, commentInfos) {
            const model = editor?.getModel();
            if (!editor || !model) {
                return;
            }
            (0, lifecycle_1.dispose)(this.threadCollapseStateListeners);
            this.editor = editor;
            const commentThreadRangeDecorations = [];
            for (const info of commentInfos) {
                info.threads.forEach(thread => {
                    if (thread.isDisposed) {
                        return;
                    }
                    const range = thread.range;
                    // We only want to show a range decoration when there's the range spans either multiple lines
                    // or, when is spans multiple characters on the sample line
                    if (!range || (range.startLineNumber === range.endLineNumber) && (range.startColumn === range.endColumn)) {
                        return;
                    }
                    this.threadCollapseStateListeners.push(thread.onDidChangeCollapsibleState(() => {
                        this.update(editor, commentInfos);
                    }));
                    if (thread.collapsibleState === languages_1.CommentThreadCollapsibleState.Collapsed) {
                        return;
                    }
                    commentThreadRangeDecorations.push(new CommentThreadRangeDecoration(range, this.decorationOptions));
                });
            }
            editor.changeDecorations((changeAccessor) => {
                this.decorationIds = changeAccessor.deltaDecorations(this.decorationIds, commentThreadRangeDecorations);
                commentThreadRangeDecorations.forEach((decoration, index) => decoration.id = this.decorationIds[index]);
            });
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.threadCollapseStateListeners);
            this.currentThreadCollapseStateListener?.dispose();
            super.dispose();
        }
    }
    exports.CommentThreadRangeDecorator = CommentThreadRangeDecorator;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudFRocmVhZFJhbmdlRGVjb3JhdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRUaHJlYWRSYW5nZURlY29yYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBTSw0QkFBNEI7UUFHakMsSUFBVyxFQUFFO1lBQ1osT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7UUFFRCxJQUFXLEVBQUUsQ0FBQyxFQUFzQjtZQUNuQyxJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBRUQsWUFDaUIsS0FBYSxFQUNiLE9BQStCO1lBRC9CLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYixZQUFPLEdBQVAsT0FBTyxDQUF3QjtRQUNoRCxDQUFDO0tBQ0Q7SUFFRCxNQUFhLDJCQUE0QixTQUFRLHNCQUFVO2lCQUMzQyxnQkFBVyxHQUFHLGdDQUFnQyxBQUFuQyxDQUFvQztRQVM5RCxZQUFZLGNBQStCO1lBQzFDLEtBQUssRUFBRSxDQUFDO1lBUEQsa0JBQWEsR0FBYSxFQUFFLENBQUM7WUFDN0Isd0JBQW1CLEdBQWEsRUFBRSxDQUFDO1lBRW5DLGlDQUE0QixHQUFrQixFQUFFLENBQUM7WUFLeEQsTUFBTSxpQkFBaUIsR0FBNEI7Z0JBQ2xELFdBQVcsRUFBRSwyQkFBMkIsQ0FBQyxXQUFXO2dCQUNwRCxXQUFXLEVBQUUsS0FBSztnQkFDbEIsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsU0FBUyxFQUFFLHNCQUFzQjtnQkFDakMseUJBQXlCLEVBQUUsSUFBSTthQUMvQixDQUFDO1lBRUYsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGtDQUFzQixDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxD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