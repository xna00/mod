/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InternalModelContentChangeEvent = exports.ModelInjectedTextChangedEvent = exports.ModelRawContentChangedEvent = exports.ModelRawEOLChanged = exports.ModelRawLinesInserted = exports.ModelRawLinesDeleted = exports.ModelRawLineChanged = exports.LineInjectedText = exports.ModelRawFlush = exports.RawContentChangedType = void 0;
    /**
     * @internal
     */
    var RawContentChangedType;
    (function (RawContentChangedType) {
        RawContentChangedType[RawContentChangedType["Flush"] = 1] = "Flush";
        RawContentChangedType[RawContentChangedType["LineChanged"] = 2] = "LineChanged";
        RawContentChangedType[RawContentChangedType["LinesDeleted"] = 3] = "LinesDeleted";
        RawContentChangedType[RawContentChangedType["LinesInserted"] = 4] = "LinesInserted";
        RawContentChangedType[RawContentChangedType["EOLChanged"] = 5] = "EOLChanged";
    })(RawContentChangedType || (exports.RawContentChangedType = RawContentChangedType = {}));
    /**
     * An event describing that a model has been reset to a new value.
     * @internal
     */
    class ModelRawFlush {
        constructor() {
            this.changeType = 1 /* RawContentChangedType.Flush */;
        }
    }
    exports.ModelRawFlush = ModelRawFlush;
    /**
     * Represents text injected on a line
     * @internal
     */
    class LineInjectedText {
        static applyInjectedText(lineText, injectedTexts) {
            if (!injectedTexts || injectedTexts.length === 0) {
                return lineText;
            }
            let result = '';
            let lastOriginalOffset = 0;
            for (const injectedText of injectedTexts) {
                result += lineText.substring(lastOriginalOffset, injectedText.column - 1);
                lastOriginalOffset = injectedText.column - 1;
                result += injectedText.options.content;
            }
            result += lineText.substring(lastOriginalOffset);
            return result;
        }
        static fromDecorations(decorations) {
            const result = [];
            for (const decoration of decorations) {
                if (decoration.options.before && decoration.options.before.content.length > 0) {
                    result.push(new LineInjectedText(decoration.ownerId, decoration.range.startLineNumber, decoration.range.startColumn, decoration.options.before, 0));
                }
                if (decoration.options.after && decoration.options.after.content.length > 0) {
                    result.push(new LineInjectedText(decoration.ownerId, decoration.range.endLineNumber, decoration.range.endColumn, decoration.options.after, 1));
                }
            }
            result.sort((a, b) => {
                if (a.lineNumber === b.lineNumber) {
                    if (a.column === b.column) {
                        return a.order - b.order;
                    }
                    return a.column - b.column;
                }
                return a.lineNumber - b.lineNumber;
            });
            return result;
        }
        constructor(ownerId, lineNumber, column, options, order) {
            this.ownerId = ownerId;
            this.lineNumber = lineNumber;
            this.column = column;
            this.options = options;
            this.order = order;
        }
        withText(text) {
            return new LineInjectedText(this.ownerId, this.lineNumber, this.column, { ...this.options, content: text }, this.order);
        }
    }
    exports.LineInjectedText = LineInjectedText;
    /**
     * An event describing that a line has changed in a model.
     * @internal
     */
    class ModelRawLineChanged {
        constructor(lineNumber, detail, injectedText) {
            this.changeType = 2 /* RawContentChangedType.LineChanged */;
            this.lineNumber = lineNumber;
            this.detail = detail;
            this.injectedText = injectedText;
        }
    }
    exports.ModelRawLineChanged = ModelRawLineChanged;
    /**
     * An event describing that line(s) have been deleted in a model.
     * @internal
     */
    class ModelRawLinesDeleted {
        constructor(fromLineNumber, toLineNumber) {
            this.changeType = 3 /* RawContentChangedType.LinesDeleted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ModelRawLinesDeleted = ModelRawLinesDeleted;
    /**
     * An event describing that line(s) have been inserted in a model.
     * @internal
     */
    class ModelRawLinesInserted {
        constructor(fromLineNumber, toLineNumber, detail, injectedTexts) {
            this.changeType = 4 /* RawContentChangedType.LinesInserted */;
            this.injectedTexts = injectedTexts;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
            this.detail = detail;
        }
    }
    exports.ModelRawLinesInserted = ModelRawLinesInserted;
    /**
     * An event describing that a model has had its EOL changed.
     * @internal
     */
    class ModelRawEOLChanged {
        constructor() {
            this.changeType = 5 /* RawContentChangedType.EOLChanged */;
        }
    }
    exports.ModelRawEOLChanged = ModelRawEOLChanged;
    /**
     * An event describing a change in the text of a model.
     * @internal
     */
    class ModelRawContentChangedEvent {
        constructor(changes, versionId, isUndoing, isRedoing) {
            this.changes = changes;
            this.versionId = versionId;
            this.isUndoing = isUndoing;
            this.isRedoing = isRedoing;
            this.resultingSelection = null;
        }
        containsEvent(type) {
            for (let i = 0, len = this.changes.length; i < len; i++) {
                const change = this.changes[i];
                if (change.changeType === type) {
                    return true;
                }
            }
            return false;
        }
        static merge(a, b) {
            const changes = [].concat(a.changes).concat(b.changes);
            const versionId = b.versionId;
            const isUndoing = (a.isUndoing || b.isUndoing);
            const isRedoing = (a.isRedoing || b.isRedoing);
            return new ModelRawContentChangedEvent(changes, versionId, isUndoing, isRedoing);
        }
    }
    exports.ModelRawContentChangedEvent = ModelRawContentChangedEvent;
    /**
     * An event describing a change in injected text.
     * @internal
     */
    class ModelInjectedTextChangedEvent {
        constructor(changes) {
            this.changes = changes;
        }
    }
    exports.ModelInjectedTextChangedEvent = ModelInjectedTextChangedEvent;
    /**
     * @internal
     */
    class InternalModelContentChangeEvent {
        constructor(rawContentChangedEvent, contentChangedEvent) {
            this.rawContentChangedEvent = rawContentChangedEvent;
            this.contentChangedEvent = contentChangedEvent;
        }
        merge(other) {
            const rawContentChangedEvent = ModelRawContentChangedEvent.merge(this.rawContentChangedEvent, other.rawContentChangedEvent);
            const contentChangedEvent = InternalModelContentChangeEvent._mergeChangeEvents(this.contentChangedEvent, other.contentChangedEvent);
            return new InternalModelContentChangeEvent(rawContentChangedEvent, contentChangedEvent);
        }
        static _mergeChangeEvents(a, b) {
            const changes = [].concat(a.changes).concat(b.changes);
            const eol = b.eol;
            const versionId = b.versionId;
            const isUndoing = (a.isUndoing || b.isUndoing);
            const isRedoing = (a.isRedoing || b.isRedoing);
            const isFlush = (a.isFlush || b.isFlush);
            const isEolChange = a.isEolChange && b.isEolChange; // both must be true to not confuse listeners who skip such edits
            return {
                changes: changes,
                eol: eol,
                isEolChange: isEolChange,
                versionId: versionId,
                isUndoing: isUndoing,
                isRedoing: isRedoing,
                isFlush: isFlush,
            };
        }
    }
    exports.InternalModelContentChangeEvent = InternalModelContentChangeEvent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsRXZlbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3RleHRNb2RlbEV2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzSGhHOztPQUVHO0lBQ0gsSUFBa0IscUJBTWpCO0lBTkQsV0FBa0IscUJBQXFCO1FBQ3RDLG1FQUFTLENBQUE7UUFDVCwrRUFBZSxDQUFBO1FBQ2YsaUZBQWdCLENBQUE7UUFDaEIsbUZBQWlCLENBQUE7UUFDakIsNkVBQWMsQ0FBQTtJQUNmLENBQUMsRUFOaUIscUJBQXFCLHFDQUFyQixxQkFBcUIsUUFNdEM7SUFFRDs7O09BR0c7SUFDSCxNQUFhLGFBQWE7UUFBMUI7WUFDaUIsZUFBVSx1Q0FBK0I7UUFDMUQsQ0FBQztLQUFBO0lBRkQsc0NBRUM7SUFFRDs7O09BR0c7SUFDSCxNQUFhLGdCQUFnQjtRQUNyQixNQUFNLENBQUMsaUJBQWlCLENBQUMsUUFBZ0IsRUFBRSxhQUF3QztZQUN6RixJQUFJLENBQUMsYUFBYSxJQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xELE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUM7WUFDRCxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDaEIsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7WUFDM0IsS0FBSyxNQUFNLFlBQVksSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDMUMsTUFBTSxJQUFJLFFBQVEsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEVBQUUsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDMUUsa0JBQWtCLEdBQUcsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFD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