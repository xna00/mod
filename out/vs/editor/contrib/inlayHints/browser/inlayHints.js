/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, errors_1, lifecycle_1, position_1, range_1, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlayHintsFragments = exports.InlayHintItem = exports.InlayHintAnchor = void 0;
    exports.asCommandLink = asCommandLink;
    class InlayHintAnchor {
        constructor(range, direction) {
            this.range = range;
            this.direction = direction;
        }
    }
    exports.InlayHintAnchor = InlayHintAnchor;
    class InlayHintItem {
        constructor(hint, anchor, provider) {
            this.hint = hint;
            this.anchor = anchor;
            this.provider = provider;
            this._isResolved = false;
        }
        with(delta) {
            const result = new InlayHintItem(this.hint, delta.anchor, this.provider);
            result._isResolved = this._isResolved;
            result._currentResolve = this._currentResolve;
            return result;
        }
        async resolve(token) {
            if (typeof this.provider.resolveInlayHint !== 'function') {
                return;
            }
            if (this._currentResolve) {
                // wait for an active resolve operation and try again
                // when that's done.
                await this._currentResolve;
                if (token.isCancellationRequested) {
                    return;
                }
                return this.resolve(token);
            }
            if (!this._isResolved) {
                this._currentResolve = this._doResolve(token)
                    .finally(() => this._currentResolve = undefined);
            }
            await this._currentResolve;
        }
        async _doResolve(token) {
            try {
                const newHint = await Promise.resolve(this.provider.resolveInlayHint(this.hint, token));
                this.hint.tooltip = newHint?.tooltip ?? this.hint.tooltip;
                this.hint.label = newHint?.label ?? this.hint.label;
                this.hint.textEdits = newHint?.textEdits ?? this.hint.textEdits;
                this._isResolved = true;
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
                this._isResolved = false;
            }
        }
    }
    exports.InlayHintItem = InlayHintItem;
    class InlayHintsFragments {
        static { this._emptyInlayHintList = Object.freeze({ dispose() { }, hints: [] }); }
        static async create(registry, model, ranges, token) {
            const data = [];
            const promises = registry.ordered(model).reverse().map(provider => ranges.map(async (range) => {
                try {
                    const result = await provider.provideInlayHints(model, range, token);
                    if (result?.hints.length || provider.onDidChangeInlayHints) {
                        data.push([result ?? InlayHintsFragments._emptyInlayHintList, provider]);
                    }
                }
                catch (err) {
                    (0, errors_1.onUnexpectedExternalError)(err);
                }
            }));
            await Promise.all(promises.flat());
            if (token.isCancellationRequested || model.isDisposed()) {
                throw new errors_1.CancellationError();
            }
            return new InlayHintsFragments(ranges, data, model);
        }
        constructor(ranges, data, model) {
            this._disposables = new lifecycle_1.DisposableStore();
            this.ranges = ranges;
            this.provider = new Set();
            const items = [];
            for (const [list, provider] of data) {
                this._disposables.add(list);
                this.provider.add(provider);
                for (const hint of list.hints) {
                    // compute the range to which the item should be attached to
                    const position = model.validatePosition(hint.position);
                    let direction = 'before';
                    const wordRange = InlayHintsFragments._getRangeAtPosition(model, position);
                    let range;
                    if (wordRange.getStartPosition().isBefore(position)) {
                        range = range_1.Range.fromPositions(wordRange.getStartPosition(), position);
                        direction = 'after';
                    }
                    else {
                        range = range_1.Range.fromPositions(position, wordRange.getEndPosition());
                        direction = 'before';
                    }
                    items.push(new InlayHintItem(hint, new InlayHintAnchor(range, direction), provider));
                }
            }
            this.items = items.sort((a, b) => position_1.Position.compare(a.hint.position, b.hint.position));
        }
        dispose() {
            this._disposables.dispose();
        }
        static _getRangeAtPosition(model, position) {
            const line = position.lineNumber;
            const word = model.getWordAtPosition(position);
            if (word) {
                // always prefer the word range
                return new range_1.Range(line, word.startColumn, line, word.endColumn);
            }
            model.tokenization.tokenizeIfCheap(line);
            const tokens = model.tokenization.getLineTokens(line);
            const offset = position.column - 1;
            const idx = tokens.findTokenIndexAtOffset(offset);
            let start = tokens.getStartOffset(idx);
            let end = tokens.getEndOffset(idx);
            if (end - start === 1) {
                // single character token, when at its end try leading/trailing token instead
                if (start === offset && idx > 1) {
                    // leading token
                    start = tokens.getStartOffset(idx - 1);
                    end = tokens.getEndOffset(idx - 1);
                }
                else if (end === offset && idx < tokens.getCount() - 1) {
                    // trailing token
                    start = tokens.getStartOffset(idx + 1);
                    end = tokens.getEndOffset(idx + 1);
                }
            }
            return new range_1.Range(line, start + 1, line, end + 1);
        }
    }
    exports.InlayHintsFragments = InlayHintsFragments;
    function asCommandLink(command) {
        return uri_1.URI.from({
            scheme: network_1.Schemas.command,
            path: command.id,
            query: command.arguments && encodeURIComponent(JSON.stringify(command.arguments))
        }).toString();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5sYXlIaW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5sYXlIaW50cy9icm93c2VyL2lubGF5SGludHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0toRyxzQ0FNQztJQS9KRCxNQUFhLGVBQWU7UUFDM0IsWUFBcUIsS0FBWSxFQUFXLFNBQTZCO1lBQXBELFVBQUssR0FBTCxLQUFLLENBQU87WUFBVyxjQUFTLEdBQVQsU0FBUyxDQUFvQjtRQUFJLENBQUM7S0FDOUU7SUFGRCwwQ0FFQztJQUVELE1BQWEsYUFBYTtRQUt6QixZQUFxQixJQUFlLEVBQVcsTUFBdUIsRUFBVyxRQUE0QjtZQUF4RixTQUFJLEdBQUosSUFBSSxDQUFXO1lBQVcsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7WUFBVyxhQUFRLEdBQVIsUUFBUSxDQUFvQjtZQUhyRyxnQkFBVyxHQUFZLEtBQUssQ0FBQztRQUc0RSxDQUFDO1FBRWxILElBQUksQ0FBQyxLQUFrQztZQUN0QyxNQUFNLE1BQU0sR0FBRyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUN0QyxNQUFNLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDOUMsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUF3QjtZQUNyQyxJQUFJLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDMUQsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLElBQUksQ0FB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