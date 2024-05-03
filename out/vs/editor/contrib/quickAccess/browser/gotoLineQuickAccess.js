/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/contrib/quickAccess/browser/editorNavigationQuickAccess", "vs/nls"], function (require, exports, lifecycle_1, editorBrowser_1, editorNavigationQuickAccess_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractGotoLineQuickAccessProvider = void 0;
    class AbstractGotoLineQuickAccessProvider extends editorNavigationQuickAccess_1.AbstractEditorNavigationQuickAccessProvider {
        static { this.PREFIX = ':'; }
        constructor() {
            super({ canAcceptInBackground: true });
        }
        provideWithoutTextEditor(picker) {
            const label = (0, nls_1.localize)('cannotRunGotoLine', "Open a text editor first to go to a line.");
            picker.items = [{ label }];
            picker.ariaLabel = label;
            return lifecycle_1.Disposable.None;
        }
        provideWithTextEditor(context, picker, token) {
            const editor = context.editor;
            const disposables = new lifecycle_1.DisposableStore();
            // Goto line once picked
            disposables.add(picker.onDidAccept(event => {
                const [item] = picker.selectedItems;
                if (item) {
                    if (!this.isValidLineNumber(editor, item.lineNumber)) {
                        return;
                    }
                    this.gotoLocation(context, { range: this.toRange(item.lineNumber, item.column), keyMods: picker.keyMods, preserveFocus: event.inBackground });
                    if (!event.inBackground) {
                        picker.hide();
                    }
                }
            }));
            // React to picker changes
            const updatePickerAndEditor = () => {
                const position = this.parsePosition(editor, picker.value.trim().substr(AbstractGotoLineQuickAccessProvider.PREFIX.length));
                const label = this.getPickLabel(editor, position.lineNumber, position.column);
                // Picker
                picker.items = [{
                        lineNumber: position.lineNumber,
                        column: position.column,
                        label
                    }];
                // ARIA Label
                picker.ariaLabel = label;
                // Clear decorations for invalid range
                if (!this.isValidLineNumber(editor, position.lineNumber)) {
                    this.clearDecorations(editor);
                    return;
                }
                // Reveal
                const range = this.toRange(position.lineNumber, position.column);
                editor.revealRangeInCenter(range, 0 /* ScrollType.Smooth */);
                // Decorate
                this.addDecorations(editor, range);
            };
            updatePickerAndEditor();
            disposables.add(picker.onDidChangeValue(() => updatePickerAndEditor()));
            // Adjust line number visibility as needed
            const codeEditor = (0, editorBrowser_1.getCodeEditor)(editor);
            if (codeEditor) {
                const options = codeEditor.getOptions();
                const lineNumbers = options.get(68 /* EditorOption.lineNumbers */);
                if (lineNumbers.renderType === 2 /* RenderLineNumbersType.Relative */) {
                    codeEditor.updateOptions({ lineNumbers: 'on' });
                    disposables.add((0, lifecycle_1.toDisposable)(() => codeEditor.updateOptions({ lineNumbers: 'relative' })));
                }
            }
            return disposables;
        }
        toRange(lineNumber = 1, column = 1) {
            return {
                startLineNumber: lineNumber,
                startColumn: column,
                endLineNumber: lineNumber,
                endColumn: column
            };
        }
        parsePosition(editor, value) {
            // Support line-col formats of `line,col`, `line:col`, `line#col`
            const numbers = value.split(/,|:|#/).map(part => parseInt(part, 10)).filter(part => !isNaN(part));
            const endLine = this.lineCount(editor) + 1;
            return {
                lineNumber: numbers[0] > 0 ? numbers[0] : endLine + numbers[0],
                column: numbers[1]
            };
        }
        getPickLabel(editor, lineNumber, column) {
            // Location valid: indicate this as picker label
            if (this.isValidLineNumber(editor, lineNumber)) {
                if (this.isValidColumn(editor, lineNumber, column)) {
                    return (0, nls_1.localize)('gotoLineColumnLabel', "Go to line {0} and character {1}.", lineNumber, column);
                }
                return (0, nls_1.localize)('gotoLineLabel', "Go to line {0}.", lineNumber);
            }
            // Location invalid: show generic label
            const position = editor.getPosition() || { lineNumber: 1, column: 1 };
            const lineCount = this.lineCount(editor);
            if (lineCount > 1) {
                return (0, nls_1.localize)('gotoLineLabelEmptyWithLimit', "Current Line: {0}, Character: {1}. Type a line number between 1 and {2} to navigate to.", position.lineNumber, position.column, lineCount);
            }
            return (0, nls_1.localize)('gotoLineLabelEmpty', "Current Line: {0}, Character: {1}. Type a line number to navigate to.", position.lineNumber, position.column);
        }
        isValidLineNumber(editor, lineNumber) {
            if (!lineNumber || typeof lineNumber !== 'number') {
                return false;
            }
            return lineNumber > 0 && lineNumber <= this.lineCount(editor);
        }
        isValidColumn(editor, lineNumber, column) {
            if (!column || typeof column !== 'number') {
                return false;
            }
            const model = this.getModel(editor);
            if (!model) {
                return false;
            }
            const positionCandidate = { lineNumber, column };
            return model.validatePosition(positionCandidate).equals(positionCandidate);
        }
        lineCount(editor) {
            return this.getModel(editor)?.getLineCount() ?? 0;
        }
    }
    exports.AbstractGotoLineQuickAccessProvider = AbstractGotoLineQuickAccessProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290b0xpbmVRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvcXVpY2tBY2Nlc3MvYnJvd3Nlci9nb3RvTGluZVF1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFzQixtQ0FBb0MsU0FBUSx5RUFBMkM7aUJBRXJHLFdBQU0sR0FBRyxHQUFHLENBQUM7UUFFcEI7WUFDQyxLQUFLLENBQUMsRUFBRSxxQkFBcUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFUyx3QkFBd0IsQ0FBQyxNQUEwQztZQUM1RSxNQUFNLEtBQUssR0FBRyxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO1lBRXpGLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFFekIsT0FBTyxzQkFBVSxDQUFDLElBQUksQ0FBQztRQUN4QixDQUFDO1FBRVMscUJBQXFCLENBQUMsT0FBc0MsRUFBRSxNQUEwQyxFQUFFLEtBQXdCO1lBQzNJLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDOUIsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMsd0JBQXdCO1lBQ3hCLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDMUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7Z0JBQ3BDLElBQUksSUFBSSxFQUFFLENBQUM7b0JBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7d0JBQ3RELE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztvQkFFOUksSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDekIsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNmLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiwwQkFBMEI7WUFDMUIsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLEVBQUU7Z0JBQ2xDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLG1DQUFtQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUMzSCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFOUUsU0FBUztnQkFDVCxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUM7d0JBQ2YsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVO3dCQUMvQixNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU07d0JBQ3ZCLEtBQUs7cUJBQ0wsQ0FBQyxDQUFDO2dCQUVILGFBQWE7Z0JBQ2IsTUFBTSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7Z0JBRXpCLHNDQUFzQztnQkFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7b0JBQzFELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDOUIsT0FBTztnQkFDUixDQUFDO2dCQUVELFNBQVM7Z0JBQ1QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDakUsTUFBTSxDQUFDLG1CQUFtQixDQUFDLEtBQUssNEJBQW9CLENBQUM7Z0JBRXJELFdBQVc7Z0JBQ1gsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDO1lBQ0YscUJBQXFCLEVBQUUsQ0FBQztZQUN4QixXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV4RSwwQ0FBMEM7WUFDMUMsTUFBTSxVQUFVLEdBQUcsSUFBQSw2QkFBYSxFQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDeEMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsbUNBQTBCLENBQUM7Z0JBQzFELElBQUksV0FBVyxDQUFDLFVBQVUsMkNBQW1DLEVBQUUsQ0FBQztvQkFDL0QsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUVoRCxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1RixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFFTyxPQUFPLENBQUMsVUFBVSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQztZQUN6QyxPQUFPO2dCQUNOLGVBQWUsRUFBRSxVQUFVO2dCQUMzQixXQUFXLEVBQUUsTUFBTTtnQkFDbkIsYUFBYSxFQUFFLFVBQVU7Z0JBQ3pCLFNBQVMsRUFBRSxNQUFNO2FBQ2pCLENBQUM7UUFDSCxDQUFDO1FBRU8sYUFBYSxDQUFDLE1BQWUsRUFBRSxLQUFhO1lBRW5ELGlFQUFpRTtZQUNqRSxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTNDLE9BQU87Z0JBQ04sVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQ2xCLENBQUM7UUFDSCxDQUFDO1FBRU8sWUFBWSxDQUFDLE1BQWUsRUFBRSxVQUFrQixFQUFFLE1BQTBCO1lBRW5GLGdEQUFnRDtZQUNoRCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDcEQsT0FBTyxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxtQ0FBbUMsRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ2pHLENBQUM7Z0JBRUQsT0FBTyxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDakUsQ0FBQztZQUVELHVDQUF1QztZQUN2QyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUN0RSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNuQixPQUFPLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLHlGQUF5RixFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM1TCxDQUFDO1lBRUQsT0FBTyxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSx1RUFBdUUsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0SixDQUFDO1FBRU8saUJBQWlCLENBQUMsTUFBZSxFQUFFLFVBQThCO1lBQ3hFLElBQUksQ0FBQyxVQUFVLElBQUksT0FBTyxVQUFVLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ25ELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE9BQU8sVUFBVSxHQUFHLENBQUMsSUFBSSxVQUFVLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRU8sYUFBYSxDQUFDLE1BQWUsRUFBRSxVQUFrQixFQUFFLE1BQTBCO1lBQ3BGLElBQUksQ0FBQyxNQUFNLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzNDLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0saUJBQWlCLEdBQUcsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFFakQsT0FBTyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBRU8sU0FBUyxDQUFDLE1BQWU7WUFDaEMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuRCxDQUFDOztJQXRKRixrRkF1SkMifQ==