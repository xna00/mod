/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/css!./codelensWidget"], function (require, exports, dom, iconLabels_1, range_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeLensWidget = exports.CodeLensHelper = void 0;
    class CodeLensViewZone {
        constructor(afterLineNumber, heightInPx, onHeight) {
            /**
             * We want that this view zone, which reserves space for a code lens appears
             * as close as possible to the next line, so we use a very large value here.
             */
            this.afterColumn = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
            this.afterLineNumber = afterLineNumber;
            this.heightInPx = heightInPx;
            this._onHeight = onHeight;
            this.suppressMouseDown = true;
            this.domNode = document.createElement('div');
        }
        onComputedHeight(height) {
            if (this._lastHeight === undefined) {
                this._lastHeight = height;
            }
            else if (this._lastHeight !== height) {
                this._lastHeight = height;
                this._onHeight();
            }
        }
        isVisible() {
            return this._lastHeight !== 0
                && this.domNode.hasAttribute('monaco-visible-view-zone');
        }
    }
    class CodeLensContentWidget {
        static { this._idPool = 0; }
        constructor(editor, line) {
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = false;
            this.suppressMouseDown = true;
            this._commands = new Map();
            this._isEmpty = true;
            this._editor = editor;
            this._id = `codelens.widget-${(CodeLensContentWidget._idPool++)}`;
            this.updatePosition(line);
            this._domNode = document.createElement('span');
            this._domNode.className = `codelens-decoration`;
        }
        withCommands(lenses, animate) {
            this._commands.clear();
            const children = [];
            let hasSymbol = false;
            for (let i = 0; i < lenses.length; i++) {
                const lens = lenses[i];
                if (!lens) {
                    continue;
                }
                hasSymbol = true;
                if (lens.command) {
                    const title = (0, iconLabels_1.renderLabelWithIcons)(lens.command.title.trim());
                    if (lens.command.id) {
                        const id = `c${(CodeLensContentWidget._idPool++)}`;
                        children.push(dom.$('a', { id, title: lens.command.tooltip, role: 'button' }, ...title));
                        this._commands.set(id, lens.command);
                    }
                    else {
                        children.push(dom.$('span', { title: lens.command.tooltip }, ...title));
                    }
                    if (i + 1 < lenses.length) {
                        children.push(dom.$('span', undefined, '\u00a0|\u00a0'));
                    }
                }
            }
            if (!hasSymbol) {
                // symbols but no commands
                dom.reset(this._domNode, dom.$('span', undefined, 'no commands'));
            }
            else {
                // symbols and commands
                dom.reset(this._domNode, ...children);
                if (this._isEmpty && animate) {
                    this._domNode.classList.add('fadein');
                }
                this._isEmpty = false;
            }
        }
        getCommand(link) {
            return link.parentElement === this._domNode
                ? this._commands.get(link.id)
                : undefined;
        }
        getId() {
            return this._id;
        }
        getDomNode() {
            return this._domNode;
        }
        updatePosition(line) {
            const column = this._editor.getModel().getLineFirstNonWhitespaceColumn(line);
            this._widgetPosition = {
                position: { lineNumber: line, column: column },
                preference: [1 /* ContentWidgetPositionPreference.ABOVE */]
            };
        }
        getPosition() {
            return this._widgetPosition || null;
        }
    }
    class CodeLensHelper {
        constructor() {
            this._removeDecorations = [];
            this._addDecorations = [];
            this._addDecorationsCallbacks = [];
        }
        addDecoration(decoration, callback) {
            this._addDecorations.push(decoration);
            this._addDecorationsCallbacks.push(callback);
        }
        removeDecoration(decorationId) {
            this._removeDecorations.push(decorationId);
        }
        commit(changeAccessor) {
            const resultingDecorations = changeAccessor.deltaDecorations(this._removeDecorations, this._addDecorations);
            for (let i = 0, len = resultingDecorations.length; i < len; i++) {
                this._addDecorationsCallbacks[i](resultingDecorations[i]);
            }
        }
    }
    exports.CodeLensHelper = CodeLensHelper;
    const codeLensDecorationOptions = textModel_1.ModelDecorationOptions.register({
        collapseOnReplaceEdit: true,
        description: 'codelens'
    });
    class CodeLensWidget {
        constructor(data, editor, helper, viewZoneChangeAccessor, heightInPx, updateCallback) {
            this._isDisposed = false;
            this._editor = editor;
            this._data = data;
            // create combined range, track all ranges with decorations,
            // check if there is already something to render
            this._decorationIds = [];
            let range;
            const lenses = [];
            this._data.forEach((codeLensData, i) => {
                if (codeLensData.symbol.command) {
                    lenses.push(codeLensData.symbol);
                }
                helper.addDecoration({
                    range: codeLensData.symbol.range,
                    options: codeLensDecorationOptions
                }, id => this._decorationIds[i] = id);
                // the range contains all lenses on this line
                if (!range) {
                    range = range_1.Range.lift(codeLensData.symbol.range);
                }
                else {
                    range = range_1.Range.plusRange(range, codeLensData.symbol.range);
                }
            });
            this._viewZone = new CodeLensViewZone(range.startLineNumber - 1, heightInPx, updateCallback);
            this._viewZoneId = viewZoneChangeAccessor.addZone(this._viewZone);
            if (lenses.length > 0) {
                this._createContentWidgetIfNecessary();
                this._contentWidget.withCommands(lenses, false);
            }
        }
        _createContentWidgetIfNecessary() {
            if (!this._contentWidget) {
                this._contentWidget = new CodeLensContentWidget(this._editor, this._viewZone.afterLineNumber + 1);
                this._editor.addContentWidget(this._contentWidget);
            }
            else {
                this._editor.layoutContentWidget(this._contentWidget);
            }
        }
        dispose(helper, viewZoneChangeAccessor) {
            this._decorationIds.forEach(helper.removeDecoration, helper);
            this._decorationIds = [];
            viewZoneChangeAccessor?.removeZone(this._viewZoneId);
            if (this._contentWidget) {
                this._editor.removeContentWidget(this._contentWidget);
                this._contentWidget = undefined;
            }
            this._isDisposed = true;
        }
        isDisposed() {
            return this._isDisposed;
        }
        isValid() {
            return this._decorationIds.some((id, i) => {
                const range = this._editor.getModel().getDecorationRange(id);
                const symbol = this._data[i].symbol;
                return !!(range && range_1.Range.isEmpty(symbol.range) === range.isEmpty());
            });
        }
        updateCodeLensSymbols(data, helper) {
            this._decorationIds.forEach(helper.removeDecoration, helper);
            this._decorationIds = [];
            this._data = data;
            this._data.forEach((codeLensData, i) => {
                helper.addDecoration({
                    range: codeLensData.symbol.range,
                    options: codeLensDecorationOptions
                }, id => this._decorationIds[i] = id);
            });
        }
        updateHeight(height, viewZoneChangeAccessor) {
            this._viewZone.heightInPx = height;
            viewZoneChangeAccessor.layoutZone(this._viewZoneId);
            if (this._contentWidget) {
                this._editor.layoutContentWidget(this._contentWidget);
            }
        }
        computeIfNecessary(model) {
            if (!this._viewZone.isVisible()) {
                return null;
            }
            // Read editor current state
            for (let i = 0; i < this._decorationIds.length; i++) {
                const range = model.getDecorationRange(this._decorationIds[i]);
                if (range) {
                    this._data[i].symbol.range = range;
                }
            }
            return this._data;
        }
        updateCommands(symbols) {
            this._createContentWidgetIfNecessary();
            this._contentWidget.withCommands(symbols, true);
            for (let i = 0; i < this._data.length; i++) {
                const resolved = symbols[i];
                if (resolved) {
                    const { symbol } = this._data[i];
                    symbol.command = resolved.command || symbol.command;
                }
            }
        }
        getCommand(link) {
            return this._contentWidget?.getCommand(link);
        }
        getLineNumber() {
            const range = this._editor.getModel().getDecorationRange(this._decorationIds[0]);
            if (range) {
                return range.startLineNumber;
            }
            return -1;
        }
        update(viewZoneChangeAccessor) {
            if (this.isValid()) {
                const range = this._editor.getModel().getDecorationRange(this._decorationIds[0]);
                if (range) {
                    this._viewZone.afterLineNumber = range.startLineNumber - 1;
                    viewZoneChangeAccessor.layoutZone(this._viewZoneId);
                    if (this._contentWidget) {
                        this._contentWidget.updatePosition(range.startLineNumber);
                        this._editor.layoutContentWidget(this._contentWidget);
                    }
                }
            }
        }
        getItems() {
            return this._data;
        }
    }
    exports.CodeLensWidget = CodeLensWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZWxlbnNXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvZGVsZW5zL2Jyb3dzZXIvY29kZWxlbnNXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQU0sZ0JBQWdCO1FBZ0JyQixZQUFZLGVBQXVCLEVBQUUsVUFBa0IsRUFBRSxRQUFvQjtZQVY3RTs7O2VBR0c7WUFDTSxnQkFBVyxxREFBb0M7WUFPdkQsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7WUFDdkMsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFFN0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFDMUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztZQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELGdCQUFnQixDQUFDLE1BQWM7WUFDOUIsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNwQyxJQUFJLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQztZQUMzQixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNsQixDQUFDO1FBQ0YsQ0FBQztRQUVELFNBQVM7WUFDUixPQUFPLElBQUksQ0FBQyxXQUFXLEtBQUssQ0FBQzttQkFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUMzRCxDQUFDO0tBQ0Q7SUFFRCxN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