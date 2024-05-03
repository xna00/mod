/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/coreCommands", "vs/editor/common/core/position", "vs/base/common/platform"], function (require, exports, coreCommands_1, position_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewController = void 0;
    class ViewController {
        constructor(configuration, viewModel, userInputEvents, commandDelegate) {
            this.configuration = configuration;
            this.viewModel = viewModel;
            this.userInputEvents = userInputEvents;
            this.commandDelegate = commandDelegate;
        }
        paste(text, pasteOnNewLine, multicursorText, mode) {
            this.commandDelegate.paste(text, pasteOnNewLine, multicursorText, mode);
        }
        type(text) {
            this.commandDelegate.type(text);
        }
        compositionType(text, replacePrevCharCnt, replaceNextCharCnt, positionDelta) {
            this.commandDelegate.compositionType(text, replacePrevCharCnt, replaceNextCharCnt, positionDelta);
        }
        compositionStart() {
            this.commandDelegate.startComposition();
        }
        compositionEnd() {
            this.commandDelegate.endComposition();
        }
        cut() {
            this.commandDelegate.cut();
        }
        setSelection(modelSelection) {
            coreCommands_1.CoreNavigationCommands.SetSelection.runCoreEditorCommand(this.viewModel, {
                source: 'keyboard',
                selection: modelSelection
            });
        }
        _validateViewColumn(viewPosition) {
            const minColumn = this.viewModel.getLineMinColumn(viewPosition.lineNumber);
            if (viewPosition.column < minColumn) {
                return new position_1.Position(viewPosition.lineNumber, minColumn);
            }
            return viewPosition;
        }
        _hasMulticursorModifier(data) {
            switch (this.configuration.options.get(78 /* EditorOption.multiCursorModifier */)) {
                case 'altKey':
                    return data.altKey;
                case 'ctrlKey':
                    return data.ctrlKey;
                case 'metaKey':
                    return data.metaKey;
                default:
                    return false;
            }
        }
        _hasNonMulticursorModifier(data) {
            switch (this.configuration.options.get(78 /* EditorOption.multiCursorModifier */)) {
                case 'altKey':
                    return data.ctrlKey || data.metaKey;
                case 'ctrlKey':
                    return data.altKey || data.metaKey;
                case 'metaKey':
                    return data.ctrlKey || data.altKey;
                default:
                    return false;
            }
        }
        dispatchMouse(data) {
            const options = this.configuration.options;
            const selectionClipboardIsOn = (platform.isLinux && options.get(107 /* EditorOption.selectionClipboard */));
            const columnSelection = options.get(22 /* EditorOption.columnSelection */);
            if (data.middleButton && !selectionClipboardIsOn) {
                this._columnSelect(data.position, data.mouseColumn, data.inSelectionMode);
            }
            else if (data.startedOnLineNumbers) {
                // If the dragging started on the gutter, then have operations work on the entire line
                if (this._hasMulticursorModifier(data)) {
                    if (data.inSelectionMode) {
                        this._lastCursorLineSelect(data.position, data.revealType);
                    }
                    else {
                        this._createCursor(data.position, true);
                    }
                }
                else {
                    if (data.inSelectionMode) {
                        this._lineSelectDrag(data.position, data.revealType);
                    }
                    else {
                        this._lineSelect(data.position, data.revealType);
                    }
                }
            }
            else if (data.mouseDownCount >= 4) {
                this._selectAll();
            }
            else if (data.mouseDownCount === 3) {
                if (this._hasMulticursorModifier(data)) {
                    if (data.inSelectionMode) {
                        this._lastCursorLineSelectDrag(data.position, data.revealType);
                    }
                    else {
                        this._lastCursorLineSelect(data.position, data.revealType);
                    }
                }
                else {
                    if (data.inSelectionMode) {
                        this._lineSelectDrag(data.position, data.revealType);
                    }
                    else {
                        this._lineSelect(data.position, data.revealType);
                    }
                }
            }
            else if (data.mouseDownCount === 2) {
                if (!data.onInjectedText) {
                    if (this._hasMulticursorModifier(data)) {
                        this._lastCursorWordSelect(data.position, data.revealType);
                    }
                    else {
                        if (data.inSelectionMode) {
                            this._wordSelectDrag(data.position, data.revealType);
                        }
                        else {
                            this._wordSelect(data.position, data.revealType);
                        }
                    }
                }
            }
            else {
                if (this._hasMulticursorModifier(data)) {
                    if (!this._hasNonMulticursorModifier(data)) {
                        if (data.shiftKey) {
                            this._columnSelect(data.position, data.mouseColumn, true);
                        }
                        else {
                            // Do multi-cursor operations only when purely alt is pressed
                            if (data.inSelectionMode) {
                                this._lastCursorMoveToSelect(data.position, data.revealType);
                            }
                            else {
                                this._createCursor(data.position, false);
                            }
                        }
                    }
                }
                else {
                    if (data.inSelectionMode) {
                        if (data.altKey) {
                            this._columnSelect(data.position, data.mouseColumn, true);
                        }
                        else {
                            if (columnSelection) {
                                this._columnSelect(data.position, data.mouseColumn, true);
                            }
                            else {
                                this._moveToSelect(data.position, data.revealType);
                            }
                        }
                    }
                    else {
                        this.moveTo(data.position, data.revealType);
                    }
                }
            }
        }
        _usualArgs(viewPosition, revealType) {
            viewPosition = this._validateViewColumn(viewPosition);
            return {
                source: 'mouse',
                position: this._convertViewToModelPosition(viewPosition),
                viewPosition,
                revealType
            };
        }
        moveTo(viewPosition, revealType) {
            coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(this.viewModel, this._usualArgs(viewPosition, revealType));
        }
        _moveToSelect(viewPosition, revealType) {
            coreCommands_1.CoreNavigationCommands.MoveToSelect.runCoreEditorCommand(this.viewModel, this._usualArgs(viewPosition, revealType));
        }
        _columnSelect(viewPosition, mouseColumn, doColumnSelect) {
            viewPosition = this._validateViewColumn(viewPosition);
            coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(this.viewModel, {
                source: 'mouse',
                position: this._convertViewToModelPosition(viewPosition),
                viewPosition: viewPosition,
                mouseColumn: mouseColumn,
                doColumnSelect: doColumnSelect
            });
        }
        _createCursor(viewPosition, wholeLine) {
            viewPosition = this._validateViewColumn(viewPosition);
            coreCommands_1.CoreNavigationCommands.CreateCursor.runCoreEditorCommand(this.viewModel, {
                source: 'mouse',
                position: this._convertViewToModelPosition(viewPosition),
                viewPosition: viewPosition,
                wholeLine: wholeLine
            });
        }
        _lastCursorMoveToSelect(viewPosition, revealType) {
            coreCommands_1.CoreNavigationCommands.LastCursorMoveToSelect.runCoreEditorCommand(this.viewModel, this._usualArgs(viewPosition, revealType));
        }
        _wordSelect(viewPosition, revealType) {
            coreCommands_1.CoreNavigationCommands.WordSelect.runCoreEditorCommand(this.viewModel, this._usualArgs(viewPosition, revealType));
        }
        _wordSelectDrag(viewPosition, revealType) {
            coreCommands_1.CoreNavigationCommands.WordSelectDrag.runCoreEditorCommand(this.viewModel, this._usualArgs(viewPosition, revealType));
        }
        _lastCursorWordSelect(viewPosition, revealType) {
            coreCommands_1.CoreNavigationCommands.LastCursorWordSelect.runCoreEditorCommand(this.viewModel, this._usualArgs(viewPosition, revealType));
        }
        _lineSelect(viewPosition, revealType) {
            coreCommands_1.CoreNavigationCommands.LineSelect.runCoreEditorCommand(this.viewModel, this._usualArgs(viewPosition, revealType));
        }
        _lineSelectDrag(viewPosition, revealType) {
            coreCommands_1.CoreNavigationCommands.LineSelectDrag.runCoreEditorCommand(this.viewModel, this._usualArgs(viewPosition, revealType));
        }
        _lastCursorLineSelect(viewPosition, revealType) {
            coreCommands_1.CoreNavigationCommands.LastCursorLineSelect.runCoreEditorCommand(this.viewModel, this._usualArgs(viewPosition, revealType));
        }
        _lastCursorLineSelectDrag(viewPosition, revealType) {
            coreCommands_1.CoreNavigationCommands.LastCursorLineSelectDrag.runCoreEditorCommand(this.viewModel, this._usualArgs(viewPosition, revealType));
        }
        _selectAll() {
            coreCommands_1.CoreNavigationCommands.SelectAll.runCoreEditorCommand(this.viewModel, { source: 'mouse' });
        }
        // ----------------------
        _convertViewToModelPosition(viewPosition) {
            return this.viewModel.coordinatesConverter.convertViewPositionToModelPosition(viewPosition);
        }
        emitKeyDown(e) {
            this.userInputEvents.emitKeyDown(e);
        }
        emitKeyUp(e) {
            this.userInputEvents.emitKeyUp(e);
        }
        emitContextMenu(e) {
            this.userInputEvents.emitContextMenu(e);
        }
        emitMouseMove(e) {
            this.userInputEvents.emitMouseMove(e);
        }
        emitMouseLeave(e) {
            this.userInputEvents.emitMouseLeave(e);
        }
        emitMouseUp(e) {
            this.userInputEvents.emitMouseUp(e);
        }
        emitMouseDown(e) {
            this.userInputEvents.emitMouseDown(e);
        }
        emitMouseDrag(e) {
            this.userInputEvents.emitMouseDrag(e);
        }
        emitMouseDrop(e) {
            this.userInputEvents.emitMouseDrop(e);
        }
        emitMouseDropCanceled() {
            this.userInputEvents.emitMouseDropCanceled();
        }
        emitMouseWheel(e) {
            this.userInputEvents.emitMouseWheel(e);
        }
    }
    exports.ViewController = ViewController;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0NvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXcvdmlld0NvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNENoRyxNQUFhLGNBQWM7UUFPMUIsWUFDQyxhQUFtQyxFQUNuQyxTQUFxQixFQUNyQixlQUFvQyxFQUNwQyxlQUFpQztZQUVqQyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztZQUNuQyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUMzQixJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztZQUN2QyxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUN4QyxDQUFDO1FBRU0sS0FBSyxDQUFDLElBQVksRUFBRSxjQUF1QixFQUFFLGVBQWdDLEVBQUUsSUFBbUI7WUFDeEcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVNLElBQUksQ0FBQyxJQUFZO1lBQ3ZCLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFTSxlQUFlLENBQUMsSUFBWSxFQUFFLGtCQUEwQixFQUFFLGtCQUEwQixFQUFFLGFBQXFCO1lBQ2pILElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUNuRyxDQUFDO1FBRU0sZ0JBQWdCO1lBQ3RCLElBQUksQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN6QyxDQUFDO1FBRU0sY0FBYztZQUNwQixJQUFJLENBQUMsZUFBZSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3ZDLENBQUM7UUFFTSxHQUFHO1lBQ1QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRU0sWUFBWSxDQUFDLGNBQXlCO1lBQzVDLHFDQUFzQixDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUN4RSxNQUFNLEVBQUUsVUFBVTtnQkFDbEIsU0FBUyxFQUFFLGNBQWM7YUFDekIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLG1CQUFtQixDQUFDLFlBQXNCO1lBQ2pELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzNFLElBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxTQUFTLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxJQUFJLG1CQUFRLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBQ0QsT0FBTyxZQUFZLENBQUM7UUFDckIsQ0FBQztRQUVPLHVCQUF1QixDQUFDLElBQXdCO1lBQ3ZELFFBQVEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRywyQ0FBa0MsRUFBRSxDQUFDO2dCQUMxRSxLQUFLLFFBQVE7b0JBQ1osT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUNwQixLQUFLLFNBQVM7b0JBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUNyQixLQUFLLFNBQVM7b0JBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUNyQjtvQkFDQyxPQUFPLEtBQUssQ0FBQztZQUNmLENBQUM7UUFDRixDQUFDO1FBRU8sMEJBQTBCLENBQUMsSUFBd0I7WUFDMUQsUUFBUSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLDJDQUFrQyxFQUFFLENBQUM7Z0JBQzFFLEtBQUssUUFBUTtvQkFDWixPQUFPLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDckMsS0FBSyxTQUFTO29CQUNiLE9BQU8sSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUNwQyxLQUFLLFNBQVM7b0JBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ3BDO29CQUNDLE9BQU8sS0FBSyxDQUFDO1lBQ2YsQ0FBQztRQUNGLENBQUM7UUFFTSxhQUFhLENBQUMsSUFBd0I7WUFDNUMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDM0MsTUFBTSxzQkFBc0IsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLEdBQUcsMkNBQWlDLENBQUMsQ0FBQztZQUNsRyxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsR0FBRyx1Q0FBOEIsQ0FBQztZQUNsRSxJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUNsRCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDM0UsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUN0QyxzRkFBc0Y7Z0JBQ3RGLElBQUksSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3hDLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO3dCQUMxQixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQzVELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ3pDLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO3dCQUMxQixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN0RCxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDbEQsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxjQUFjLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNuQixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLGNBQWMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDeEMsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7d0JBQzFCLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDaEUsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDNUQsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7d0JBQzFCLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ3RELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUNsRCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLGNBQWMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDMUIsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDeEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUM1RCxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7NEJBQzFCLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ3RELENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUNsRCxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7d0JBQzVDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOzRCQUNuQixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDM0QsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLDZEQUE2RDs0QkFDN0QsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0NBQzFCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzs0QkFDOUQsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQzs0QkFDMUMsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO3dCQUMxQixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzs0QkFDakIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQzNELENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxJQUFJLGVBQWUsRUFBRSxDQUFDO2dDQUNyQixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQzs0QkFDM0QsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7NEJBQ3BELENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDN0MsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxVQUFVLENBQUMsWUFBc0IsRUFBRSxVQUF1QztZQUNqRixZQUFZLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3RELE9BQU87Z0JBQ04sTUFBTSxFQUFFLE9BQU87Z0JBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxZQUFZLENBQUM7Z0JBQ3hELFlBQVk7Z0JBQ1osVUFBVTthQUNWLENBQUM7UUFDSCxDQUFDO1FBRU0sTUFBTSxDQUFDLFlBQXNCLEVBQUUsVUFBdUM7WUFDNUUscUNBQXNCLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUMvRyxDQUFDO1FBRU8sYUFBYSxDQUFDLFlBQXNCLEVBQUUsVUFBdUM7WUFDcEYscUNBQXNCLENBQUMsWUFBWSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNySCxDQUFDO1FBRU8sYUFBYSxDQUFDLFlBQXNCLEVBQUUsV0FBbUIsRUFBRSxjQUF1QjtZQUN6RixZQUFZLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3RELHFDQUFzQixDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUN4RSxNQUFNLEVBQUUsT0FBTztnQkFDZixRQUFRLEVBQUUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFlBQVksQ0FBQztnQkFDeEQsWUFBWSxFQUFFLFlBQVk7Z0JBQzFCLFdBQVcsRUFBRSxXQUFXO2dCQUN4QixjQUFjLEVBQUUsY0FBYzthQUM5QixDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sYUFBYSxDQUFDLFlBQXNCLEVBQUUsU0FBa0I7WUFDL0QsWUFBWSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN0RCxxQ0FBc0IsQ0FBQyxZQUFZLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDeEUsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxZQUFZLENBQUM7Z0JBQ3hELFlBQVksRUFBRSxZQUFZO2dCQUMxQixTQUFTLEVBQUUsU0FBUzthQUNwQixDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sdUJBQXVCLENBQUMsWUFBc0IsRUFBRSxVQUF1QztZQUM5RixxQ0FBc0IsQ0FBQyxzQkFBc0IsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDL0gsQ0FBQztRQUVPLFdBQVcsQ0FBQyxZQUFzQixFQUFFLFVBQXVDO1lBQ2xGLHFDQUFzQixDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDbkgsQ0FBQztRQUVPLGVBQWUsQ0FBQyxZQUFzQixFQUFFLFVBQXVDO1lBQ3RGLHFDQUFzQixDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDdkgsQ0FBQztRQUVPLHFCQUFxQixDQUFDLFlBQXNCLEVBQUUsVUFBdUM7WUFDNUYscUNBQXNCLENBQUMsb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzdILENBQUM7UUFFTyxXQUFXLENBQUMsWUFBc0IsRUFBRSxVQUF1QztZQUNsRixxQ0FBc0IsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ25ILENBQUM7UUFFTyxlQUFlLENBQUMsWUFBc0IsRUFBRSxVQUF1QztZQUN0RixxQ0FBc0IsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3ZILENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxZQUFzQixFQUFFLFVBQXVDO1lBQzVGLHFDQUFzQixDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUM3SCxDQUFDO1FBRU8seUJBQXlCLENBQUMsWUFBc0IsRUFBRSxVQUF1QztZQUNoRyxxQ0FBc0IsQ0FBQyx3QkFBd0IsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDakksQ0FBQztRQUVPLFVBQVU7WUFDakIscUNBQXNCLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUM1RixDQUFDO1FBRUQseUJBQXlCO1FBRWpCLDJCQUEyQixDQUFDLFlBQXNCO1lBQ3pELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxrQ0FBa0MsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM3RixDQUFDO1FBRU0sV0FBVyxDQUFDLENBQWlCO1lBQ25DLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFTSxTQUFTLENBQUMsQ0FBaUI7WUFDakMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVNLGVBQWUsQ0FBQyxDQUFvQjtZQUMxQyxJQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRU0sYUFBYSxDQUFDLENBQW9CO1lBQ3hDLElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFTSxjQUFjLENBQUMsQ0FBMkI7WUFDaEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVNLFdBQVcsQ0FBQyxDQUFvQjtZQUN0QyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRU0sYUFBYSxDQUFDLENBQW9CO1lBQ3hDLElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFTSxhQUFhLENBQUMsQ0FBb0I7WUFDeEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVNLGFBQWEsQ0FBQyxDQUEyQjtZQUMvQyxJQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRU0scUJBQXFCO1lBQzNCLElBQUksQ0FBQyxlQUFlLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUM5QyxDQUFDO1FBRU0sY0FBYyxDQUFDLENBQW1CO1lBQ3hDLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDRDtJQWpTRCx3Q0FpU0MifQ==