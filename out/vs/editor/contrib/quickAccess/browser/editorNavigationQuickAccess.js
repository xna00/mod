/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/common/model", "vs/editor/common/core/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/base/browser/ui/aria/aria"], function (require, exports, functional_1, lifecycle_1, editorBrowser_1, model_1, editorColorRegistry_1, themeService_1, aria_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractEditorNavigationQuickAccessProvider = void 0;
    /**
     * A reusable quick access provider for the editor with support
     * for adding decorations for navigating in the currently active file
     * (for example "Go to line", "Go to symbol").
     */
    class AbstractEditorNavigationQuickAccessProvider {
        constructor(options) {
            this.options = options;
            //#endregion
            //#region Decorations Utils
            this.rangeHighlightDecorationId = undefined;
        }
        //#region Provider methods
        provide(picker, token) {
            const disposables = new lifecycle_1.DisposableStore();
            // Apply options if any
            picker.canAcceptInBackground = !!this.options?.canAcceptInBackground;
            // Disable filtering & sorting, we control the results
            picker.matchOnLabel = picker.matchOnDescription = picker.matchOnDetail = picker.sortByLabel = false;
            // Provide based on current active editor
            const pickerDisposable = disposables.add(new lifecycle_1.MutableDisposable());
            pickerDisposable.value = this.doProvide(picker, token);
            // Re-create whenever the active editor changes
            disposables.add(this.onDidActiveTextEditorControlChange(() => {
                // Clear old
                pickerDisposable.value = undefined;
                // Add new
                pickerDisposable.value = this.doProvide(picker, token);
            }));
            return disposables;
        }
        doProvide(picker, token) {
            const disposables = new lifecycle_1.DisposableStore();
            // With text control
            const editor = this.activeTextEditorControl;
            if (editor && this.canProvideWithTextEditor(editor)) {
                const context = { editor };
                // Restore any view state if this picker was closed
                // without actually going to a line
                const codeEditor = (0, editorBrowser_1.getCodeEditor)(editor);
                if (codeEditor) {
                    // Remember view state and update it when the cursor position
                    // changes even later because it could be that the user has
                    // configured quick access to remain open when focus is lost and
                    // we always want to restore the current location.
                    let lastKnownEditorViewState = editor.saveViewState() ?? undefined;
                    disposables.add(codeEditor.onDidChangeCursorPosition(() => {
                        lastKnownEditorViewState = editor.saveViewState() ?? undefined;
                    }));
                    context.restoreViewState = () => {
                        if (lastKnownEditorViewState && editor === this.activeTextEditorControl) {
                            editor.restoreViewState(lastKnownEditorViewState);
                        }
                    };
                    disposables.add((0, functional_1.createSingleCallFunction)(token.onCancellationRequested)(() => context.restoreViewState?.()));
                }
                // Clean up decorations on dispose
                disposables.add((0, lifecycle_1.toDisposable)(() => this.clearDecorations(editor)));
                // Ask subclass for entries
                disposables.add(this.provideWithTextEditor(context, picker, token));
            }
            // Without text control
            else {
                disposables.add(this.provideWithoutTextEditor(picker, token));
            }
            return disposables;
        }
        /**
         * Subclasses to implement if they can operate on the text editor.
         */
        canProvideWithTextEditor(editor) {
            return true;
        }
        gotoLocation({ editor }, options) {
            editor.setSelection(options.range, "code.jump" /* TextEditorSelectionSource.JUMP */);
            editor.revealRangeInCenter(options.range, 0 /* ScrollType.Smooth */);
            if (!options.preserveFocus) {
                editor.focus();
            }
            const model = editor.getModel();
            if (model && 'getLineContent' in model) {
                (0, aria_1.status)(`${model.getLineContent(options.range.startLineNumber)}`);
            }
        }
        getModel(editor) {
            return (0, editorBrowser_1.isDiffEditor)(editor) ?
                editor.getModel()?.modified :
                editor.getModel();
        }
        addDecorations(editor, range) {
            editor.changeDecorations(changeAccessor => {
                // Reset old decorations if any
                const deleteDecorations = [];
                if (this.rangeHighlightDecorationId) {
                    deleteDecorations.push(this.rangeHighlightDecorationId.overviewRulerDecorationId);
                    deleteDecorations.push(this.rangeHighlightDecorationId.rangeHighlightId);
                    this.rangeHighlightDecorationId = undefined;
                }
                // Add new decorations for the range
                const newDecorations = [
                    // highlight the entire line on the range
                    {
                        range,
                        options: {
                            description: 'quick-access-range-highlight',
                            className: 'rangeHighlight',
                            isWholeLine: true
                        }
                    },
                    // also add overview ruler highlight
                    {
                        range,
                        options: {
                            description: 'quick-access-range-highlight-overview',
                            overviewRuler: {
                                color: (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerRangeHighlight),
                                position: model_1.OverviewRulerLane.Full
                            }
                        }
                    }
                ];
                const [rangeHighlightId, overviewRulerDecorationId] = changeAccessor.deltaDecorations(deleteDecorations, newDecorations);
                this.rangeHighlightDecorationId = { rangeHighlightId, overviewRulerDecorationId };
            });
        }
        clearDecorations(editor) {
            const rangeHighlightDecorationId = this.rangeHighlightDecorationId;
            if (rangeHighlightDecorationId) {
                editor.changeDecorations(changeAccessor => {
                    changeAccessor.deltaDecorations([
                        rangeHighlightDecorationId.overviewRulerDecorationId,
                        rangeHighlightDecorationId.rangeHighlightId
                    ], []);
                });
                this.rangeHighlightDecorationId = undefined;
            }
        }
    }
    exports.AbstractEditorNavigationQuickAccessProvider = AbstractEditorNavigationQuickAccessProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yTmF2aWdhdGlvblF1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9xdWlja0FjY2Vzcy9icm93c2VyL2VkaXRvck5hdmlnYXRpb25RdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3Q2hHOzs7O09BSUc7SUFDSCxNQUFzQiwyQ0FBMkM7UUFFaEUsWUFBc0IsT0FBNkM7WUFBN0MsWUFBTyxHQUFQLE9BQU8sQ0FBc0M7WUE4SG5FLFlBQVk7WUFHWiwyQkFBMkI7WUFFbkIsK0JBQTBCLEdBQXNDLFNBQVMsQ0FBQztRQW5JWCxDQUFDO1FBRXhFLDBCQUEwQjtRQUUxQixPQUFPLENBQUMsTUFBa0MsRUFBRSxLQUF3QjtZQUNuRSxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUUxQyx1QkFBdUI7WUFDdkIsTUFBTSxDQUFDLHFCQUFxQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLHFCQUFxQixDQUFDO1lBRXJFLHNEQUFzRDtZQUN0RCxNQUFNLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxrQkFBa0IsR0FBRyxNQUFNLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBRXBHLHlDQUF5QztZQUN6QyxNQUFNLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFDbEUsZ0JBQWdCLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRXZELCtDQUErQztZQUMvQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxHQUFHLEVBQUU7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