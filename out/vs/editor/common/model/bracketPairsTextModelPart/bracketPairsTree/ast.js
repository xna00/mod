/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/editor/common/core/cursorColumns", "./length", "./smallImmutableSet"], function (require, exports, errors_1, cursorColumns_1, length_1, smallImmutableSet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InvalidBracketAstNode = exports.BracketAstNode = exports.TextAstNode = exports.ListAstNode = exports.PairAstNode = exports.AstNodeKind = void 0;
    var AstNodeKind;
    (function (AstNodeKind) {
        AstNodeKind[AstNodeKind["Text"] = 0] = "Text";
        AstNodeKind[AstNodeKind["Bracket"] = 1] = "Bracket";
        AstNodeKind[AstNodeKind["Pair"] = 2] = "Pair";
        AstNodeKind[AstNodeKind["UnexpectedClosingBracket"] = 3] = "UnexpectedClosingBracket";
        AstNodeKind[AstNodeKind["List"] = 4] = "List";
    })(AstNodeKind || (exports.AstNodeKind = AstNodeKind = {}));
    /**
     * The base implementation for all AST nodes.
    */
    class BaseAstNode {
        /**
         * The length of the entire node, which should equal the sum of lengths of all children.
        */
        get length() {
            return this._length;
        }
        constructor(length) {
            this._length = length;
        }
    }
    /**
     * Represents a bracket pair including its child (e.g. `{ ... }`).
     * Might be unclosed.
     * Immutable, if all children are immutable.
    */
    class PairAstNode extends BaseAstNode {
        static create(openingBracket, child, closingBracket) {
            let length = openingBracket.length;
            if (child) {
                length = (0, length_1.lengthAdd)(length, child.length);
            }
            if (closingBracket) {
                length = (0, length_1.lengthAdd)(length, closingBracket.length);
            }
            return new PairAstNode(length, openingBracket, child, closingBracket, child ? child.missingOpeningBracketIds : smallImmutableSet_1.SmallImmutableSet.getEmpty());
        }
        get kind() {
            return 2 /* AstNodeKind.Pair */;
        }
        get listHeight() {
            return 0;
        }
        get childrenLength() {
            return 3;
        }
        getChild(idx) {
            switch (idx) {
                case 0: return this.openingBracket;
                case 1: return this.child;
                case 2: return this.closingBracket;
            }
            throw new Error('Invalid child index');
        }
        /**
         * Avoid using this property, it allocates an array!
        */
        get children() {
            const result = [];
            result.push(this.openingBracket);
            if (this.child) {
                result.push(this.child);
            }
            if (this.closingBracket) {
                result.push(this.closingBracket);
            }
            return result;
        }
        constructor(length, openingBracket, child, closingBracket, missingOpeningBracketIds) {
            super(length);
            this.openingBracket = openingBracket;
            this.child = child;
            this.closingBracket = closingBracket;
            this.missingOpeningBracketIds = missingOpeningBracketIds;
        }
        canBeReused(openBracketIds) {
            if (this.closingBracket === null) {
                // Unclosed pair ast nodes only
                // end at the end of the document
                // or when a parent node is closed.
                // This could be improved:
                // Only return false if some next token is neither "undefined" nor a bracket that closes a parent.
                return false;
            }
            if (openBracketIds.intersects(this.missingOpeningBracketIds)) {
                return false;
            }
            return true;
        }
        flattenLists() {
            return PairAstNode.create(this.openingBracket.flattenLists(), this.child && this.child.flattenLists(), this.closingBracket && this.closingBracket.flattenLists());
        }
        deepClone() {
            return new PairAstNode(this.length, this.openingBracket.deepClone(), this.child && this.child.deepClone(), this.closingBracket && this.closingBracket.deepClone(), this.missingOpeningBracketIds);
        }
        computeMinIndentation(offset, textModel) {
            return this.child ? this.child.computeMinIndentation((0, length_1.lengthAdd)(offset, this.openingBracket.length), textModel) : Number.MAX_SAFE_INTEGER;
        }
    }
    exports.PairAstNode = PairAstNode;
    class ListAstNode extends BaseAstNode {
        /**
         * This method uses more memory-efficient list nodes that can only store 2 or 3 children.
        */
        static create23(item1, item2, item3, immutable = false) {
            let length = item1.length;
            let missingBracketIds = item1.missingOpeningBracketIds;
            if (item1.listHeight !== item2.listHeight) {
                throw new Error('Invalid list heights');
            }
            length = (0, length_1.lengthAdd)(length, item2.length);
            missingBracketIds = missingBracketIds.merge(item2.missingOpeningBracketIds);
            if (item3) {
                if (item1.listHeight !== item3.listHeight) {
                    throw new Error('Invalid list heights');
                }
                length = (0, length_1.lengthAdd)(length, item3.length);
                missingBracketIds = missingBracketIds.merge(item3.missingOpeningBracketIds);
            }
            return immutable
                ? new Immutable23ListAstNode(length, item1.listHeight + 1, item1, item2, item3, missingBracketIds)
                : new TwoThreeListAstNode(length, item1.listHeight + 1, item1, item2, item3, missingBracketIds);
        }
        static create(items, immutable = false) {
            if (items.length === 0) {
                return this.getEmpty();
            }
            else {
                let length = items[0].length;
                let unopenedBrackets = items[0].missingOpeningBracketIds;
                for (let i = 1; i < items.length; i++) {
                    length = (0, length_1.lengthAdd)(length, items[i].length);
                    unopenedBrackets = unopenedBrackets.merge(items[i].missingOpeningBracketIds);
                }
                return immutable
                    ? new ImmutableArrayListAstNode(length, items[0].listHeight + 1, items, unopenedBrackets)
                    : new ArrayListAstNode(length, items[0].listHeight + 1, items, unopenedBrackets);
            }
        }
        static getEmpty() {
            return new ImmutableArrayListAstNode(length_1.lengthZero, 0, [], smallImmutableSet_1.SmallImmutableSet.getEmpty());
        }
        get kind() {
            return 4 /* AstNodeKind.List */;
        }
        get missingOpeningBracketIds() {
            return this._missingOpeningBracketIds;
        }
        /**
         * Use ListAstNode.create.
        */
        constructor(length, listHeight, _missingOpeningBracketIds) {
            super(length);
            this.listHeight = listHeight;
            this._missingOpeningBracketIds = _missingOpeningBracketIds;
            this.cachedMinIndentation = -1;
        }
        throwIfImmutable() {
            // NOOP
        }
        makeLastElementMutable() {
            this.throwIfImmutable();
            const childCount = this.childrenLength;
            if (childCount === 0) {
                return undefined;
            }
            const lastChild = this.getChild(childCount - 1);
            const mutable = lastChild.kind === 4 /* AstNodeKind.List */ ? lastChild.toMutable() : lastChild;
            if (lastChild !== mutable) {
                this.setChild(childCount - 1, mutable);
            }
            return mutable;
        }
        makeFirstElementMutable() {
            this.throwIfImmutable();
            const childCount = this.childrenLength;
            if (childCount === 0) {
                return undefined;
            }
            const firstChild = this.getChild(0);
            const mutable = firstChild.kind === 4 /* AstNodeKind.List */ ? firstChild.toMutable() : firstChild;
            if (firstChild !== mutable) {
                this.setChild(0, mutable);
            }
            return mutable;
        }
        canBeReused(openBracketIds) {
            if (openBracketIds.intersects(this.missingOpeningBracketIds)) {
                return false;
            }
            if (this.childrenLength === 0) {
                // Don't reuse empty lists.
                return false;
            }
            let lastChild = this;
            while (lastChild.kind === 4 /* AstNodeKind.List */) {
                const lastLength = lastChild.childrenLength;
                if (lastLength === 0) {
                    // Empty lists should never be contained in other lists.
                    throw new errors_1.BugIndicatingError();
                }
                lastChild = lastChild.getChild(lastLength - 1);
            }
            return lastChild.canBeReused(openBracketIds);
        }
        handleChildrenChanged() {
            this.throwIfImmutable();
            const count = this.childrenLength;
            let length = this.getChild(0).length;
            let unopenedBrackets = this.getChild(0).missingOpeningBracketIds;
            for (let i = 1; i < count; i++) {
                const child = this.getChild(i);
                length = (0, length_1.lengthAdd)(length, child.length);
                unopenedBrackets = unopenedBrackets.merge(child.missingOpeningBracketIds);
            }
            this._length = length;
            this._missingOpeningBracketIds = unopenedBrackets;
            this.cachedMinIndentation = -1;
        }
        flattenLists() {
            const items = [];
            for (const c of this.children) {
                const normalized = c.flattenLists();
                if (normalized.kind === 4 /* AstNodeKind.List */) {
                    items.push(...normalized.children);
                }
                else {
                    items.push(normalized);
                }
            }
            return ListAstNode.create(items);
        }
        computeMinIndentation(offset, textModel) {
            if (this.cachedMinIndentation !== -1) {
                return this.cachedMinIndentation;
            }
            let minIndentation = Number.MAX_SAFE_INTEGER;
            let childOffset = offset;
            for (let i = 0; i < this.childrenLength; i++) {
                const child = this.getChild(i);
                if (child) {
                    minIndentation = Math.min(minIndentation, child.computeMinIndentation(childOffset, textModel));
                    childOffset = (0, length_1.lengthAdd)(childOffset, child.length);
                }
            }
            this.cachedMinIndentation = minIndentation;
            return minIndentation;
        }
    }
    exports.ListAstNode = ListAstNode;
    class TwoThreeListAstNode extends ListAstNode {
        get childrenLength() {
            return this._item3 !== null ? 3 : 2;
        }
        getChild(idx) {
            switch (idx) {
                case 0: return this._item1;
                case 1: return this._item2;
                case 2: return this._item3;
            }
            throw new Error('Invalid child index');
        }
        setChild(idx, node) {
            switch (idx) {
                case 0:
                    this._item1 = node;
                    return;
                case 1:
                    this._item2 = node;
                    return;
                case 2:
                    this._item3 = node;
                    return;
            }
            throw new Error('Invalid child index');
        }
        get children() {
            return this._item3 ? [this._item1, this._item2, this._item3] : [this._item1, this._item2];
        }
        get item1() {
            return this._item1;
        }
        get item2() {
            return this._item2;
        }
        get item3() {
            return this._item3;
        }
        constructor(length, listHeight, _item1, _item2, _item3, missingOpeningBracketIds) {
            super(length, listHeight, missingOpeningBracketIds);
            this._item1 = _item1;
            this._item2 = _item2;
            this._item3 = _item3;
        }
        deepClone() {
            return new TwoThreeListAstNode(this.length, this.listHeight, this._item1.deepClone(), this._item2.deepClone(), this._item3 ? this._item3.deepClone() : null, this.missingOpeningBracketIds);
        }
        appendChildOfSameHeight(node) {
            if (this._item3) {
                throw new Error('Cannot append to a full (2,3) tree node');
            }
            this.throwIfImmutable();
            this._item3 = node;
            this.handleChildrenChanged();
        }
        unappendChild() {
            if (!this._item3) {
                throw new Error('Cannot remove from a non-full (2,3) tree node');
            }
            this.throwIfImmutable();
            const result = this._item3;
            this._item3 = null;
            this.handleChildrenChanged();
            return result;
        }
        prependChildOfSameHeight(node) {
            if (this._item3) {
                throw new Error('Cannot prepend to a full (2,3) tree node');
            }
            this.throwIfImmutable();
            this._item3 = this._item2;
            this._item2 = this._item1;
            this._item1 = node;
            this.handleChildrenChanged();
        }
        unprependChild() {
            if (!this._item3) {
                throw new Error('Cannot remove from a non-full (2,3) tree node');
            }
            this.throwIfImmutable();
            const result = this._item1;
            this._item1 = this._item2;
            this._item2 = this._item3;
            this._item3 = null;
            this.handleChildrenChanged();
            return result;
        }
        toMutable() {
            return this;
        }
    }
    /**
     * Immutable, if all children are immutable.
    */
    class Immutable23ListAstNode extends TwoThreeListAstNode {
        toMutable() {
            return new TwoThreeListAstNode(this.length, this.listHeight, this.item1, this.item2, this.item3, this.missingOpeningBracketIds);
        }
        throwIfImmutable() {
            throw new Error('this instance is immutable');
        }
    }
    /**
     * For debugging.
    */
    class ArrayListAstNode extends ListAstNode {
        get childrenLength() {
            return this._children.length;
        }
        getChild(idx) {
            return this._children[idx];
        }
        setChild(idx, child) {
            this._children[idx] = child;
        }
        get children() {
            return this._children;
        }
        constructor(length, listHeight, _children, missingOpeningBracketIds) {
            super(length, listHeight, missingOpeningBracketIds);
            this._children = _children;
        }
        deepClone() {
            const children = new Array(this._children.length);
            for (let i = 0; i < this._children.length; i++) {
                children[i] = this._children[i].deepClone();
            }
            return new ArrayListAstNode(this.length, this.listHeight, children, this.missingOpeningBracketIds);
        }
        appendChildOfSameHeight(node) {
            this.throwIfImmutable();
            this._children.push(node);
            this.handleChildrenChanged();
        }
        unappendChild() {
            this.throwIfImmutable();
            const item = this._children.pop();
            this.handleChildrenChanged();
            return item;
        }
        prependChildOfSameHeight(node) {
            this.throwIfImmutable();
            this._children.unshift(node);
            this.handleChildrenChanged();
        }
        unprependChild() {
            this.throwIfImmutable();
            const item = this._children.shift();
            this.handleChildrenChanged();
            return item;
        }
        toMutable() {
            return this;
        }
    }
    /**
     * Immutable, if all children are immutable.
    */
    class ImmutableArrayListAstNode extends ArrayListAstNode {
        toMutable() {
            return new ArrayListAstNode(this.length, this.listHeight, [...this.children], this.missingOpeningBracketIds);
        }
        throwIfImmutable() {
            throw new Error('this instance is immutable');
        }
    }
    const emptyArray = [];
    class ImmutableLeafAstNode extends BaseAstNode {
        get listHeight() {
            return 0;
        }
        get childrenLength() {
            return 0;
        }
        getChild(idx) {
            return null;
        }
        get children() {
            return emptyArray;
        }
        flattenLists() {
            return this;
        }
        deepClone() {
            return this;
        }
    }
    class TextAstNode extends ImmutableLeafAstNode {
        get kind() {
            return 0 /* AstNodeKind.Text */;
        }
        get missingOpeningBracketIds() {
            return smallImmutableSet_1.SmallImmutableSet.getEmpty();
        }
        canBeReused(_openedBracketIds) {
            return true;
        }
        computeMinIndentation(offset, textModel) {
            const start = (0, length_1.lengthToObj)(offset);
            // Text ast nodes don't have partial indentation (ensured by the tokenizer).
            // Thus, if this text node does not start at column 0, the first line cannot have any indentation at all.
            const startLineNumber = (start.columnCount === 0 ? start.lineCount : start.lineCount + 1) + 1;
            const endLineNumber = (0, length_1.lengthGetLineCount)((0, length_1.lengthAdd)(offset, this.length)) + 1;
            let result = Number.MAX_SAFE_INTEGER;
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const firstNonWsColumn = textModel.getLineFirstNonWhitespaceColumn(lineNumber);
                const lineContent = textModel.getLineContent(lineNumber);
                if (firstNonWsColumn === 0) {
                    continue;
                }
                const visibleColumn = cursorColumns_1.CursorColumns.visibleColumnFromColumn(lineContent, firstNonWsColumn, textModel.getOptions().tabSize);
                result = Math.min(result, visibleColumn);
            }
            return result;
        }
    }
    exports.TextAstNode = TextAstNode;
    class BracketAstNode extends ImmutableLeafAstNode {
        static create(length, bracketInfo, bracketIds) {
            const node = new BracketAstNode(length, bracketInfo, bracketIds);
            return node;
        }
        get kind() {
            return 1 /* AstNodeKind.Bracket */;
        }
        get missingOpeningBracketIds() {
            return smallImmutableSet_1.SmallImmutableSet.getEmpty();
        }
        constructor(length, bracketInfo, 
        /**
         * In case of a opening bracket, this is the id of the opening bracket.
         * In case of a closing bracket, this contains the ids of all opening brackets it can close.
        */
        bracketIds) {
            super(length);
            this.bracketInfo = bracketInfo;
            this.bracketIds = bracketIds;
        }
        get text() {
            return this.bracketInfo.bracketText;
        }
        get languageId() {
            return this.bracketInfo.languageId;
        }
        canBeReused(_openedBracketIds) {
            // These nodes could be reused,
            // but not in a general way.
            // Their parent may be reused.
            return false;
        }
        computeMinIndentation(offset, textModel) {
            return Number.MAX_SAFE_INTEGER;
        }
    }
    exports.BracketAstNode = BracketAstNode;
    class InvalidBracketAstNode extends ImmutableLeafAstNode {
        get kind() {
            return 3 /* AstNodeKind.UnexpectedClosingBracket */;
        }
        constructor(closingBrackets, length) {
            super(length);
            this.missingOpeningBracketIds = closingBrackets;
        }
        canBeReused(openedBracketIds) {
            return !openedBracketIds.intersects(this.missingOpeningBracketIds);
        }
        computeMinIndentation(offset, textModel) {
            return Number.MAX_SAFE_INTEGER;
        }
    }
    exports.InvalidBracketAstNode = InvalidBracketAstNode;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyc1RleHRNb2RlbFBhcnQvYnJhY2tldFBhaXJzVHJlZS9hc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLElBQWtCLFdBTWpCO0lBTkQsV0FBa0IsV0FBVztRQUM1Qiw2Q0FBUSxDQUFBO1FBQ1IsbURBQVcsQ0FBQTtRQUNYLDZDQUFRLENBQUE7UUFDUixxRkFBNEIsQ0FBQTtRQUM1Qiw2Q0FBUSxDQUFBO0lBQ1QsQ0FBQyxFQU5pQixXQUFXLDJCQUFYLFdBQVcsUUFNNUI7SUFJRDs7TUFFRTtJQUNGLE1BQWUsV0FBVztRQTRCekI7O1VBRUU7UUFDRixJQUFXLE1BQU07WUFDaEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3JCLENBQUM7UUFFRCxZQUFtQixNQUFjO1lBQ2hDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ3ZCLENBQUM7S0FvQkQ7SUFFRDs7OztNQUlFO0lBQ0YsTUFBYSxXQUFZLFNBQVEsV0FBVztRQUNwQyxNQUFNLENBQUMsTUFBTSxDQUNuQixjQUE4QixFQUM5QixLQUFxQixFQUNyQixjQUFxQztZQUVyQyxJQUFJLE1BQU0sR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDO1lBQ25DLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1gsTUFBTSxHQUFHLElBQUEsa0JBQVMsRUFBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFDRCxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUNwQixNQUFNLEdBQUcsSUFBQSxrQkFBUyxFQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbkQsQ0FBQztZQUNELE9B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