/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./ast", "./beforeEditPositionMapper", "./smallImmutableSet", "./length", "./concat23Trees", "./nodeReader"], function (require, exports, ast_1, beforeEditPositionMapper_1, smallImmutableSet_1, length_1, concat23Trees_1, nodeReader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseDocument = parseDocument;
    /**
     * Non incrementally built ASTs are immutable.
    */
    function parseDocument(tokenizer, edits, oldNode, createImmutableLists) {
        const parser = new Parser(tokenizer, edits, oldNode, createImmutableLists);
        return parser.parseDocument();
    }
    /**
     * Non incrementally built ASTs are immutable.
    */
    class Parser {
        /**
         * Reports how many nodes were constructed in the last parse operation.
        */
        get nodesConstructed() {
            return this._itemsConstructed;
        }
        /**
         * Reports how many nodes were reused in the last parse operation.
        */
        get nodesReused() {
            return this._itemsFromCache;
        }
        constructor(tokenizer, edits, oldNode, createImmutableLists) {
            this.tokenizer = tokenizer;
            this.createImmutableLists = createImmutableLists;
            this._itemsConstructed = 0;
            this._itemsFromCache = 0;
            if (oldNode && createImmutableLists) {
                throw new Error('Not supported');
            }
            this.oldNodeReader = oldNode ? new nodeReader_1.NodeReader(oldNode) : undefined;
            this.positionMapper = new beforeEditPositionMapper_1.BeforeEditPositionMapper(edits);
        }
        parseDocument() {
            this._itemsConstructed = 0;
            this._itemsFromCache = 0;
            let result = this.parseList(smallImmutableSet_1.SmallImmutableSet.getEmpty(), 0);
            if (!result) {
                result = ast_1.ListAstNode.getEmpty();
            }
            return result;
        }
        parseList(openedBracketIds, level) {
            const items = [];
            while (true) {
                let child = this.tryReadChildFromCache(openedBracketIds);
                if (!child) {
                    const token = this.tokenizer.peek();
                    if (!token ||
                        (token.kind === 2 /* TokenKind.ClosingBracket */ &&
                            token.bracketIds.intersects(openedBracketIds))) {
                        break;
                    }
                    child = this.parseChild(openedBracketIds, level + 1);
                }
                if (child.kind === 4 /* AstNodeKind.List */ && child.childrenLength === 0) {
                    continue;
                }
                items.push(child);
            }
            // When there is no oldNodeReader, all items are created from scratch and must have the same height.
            const result = this.oldNodeReader ? (0, concat23Trees_1.concat23Trees)(items) : (0, concat23Trees_1.concat23TreesOfSameHeight)(items, this.createImmutableLists);
            return result;
        }
        tryReadChildFromCache(openedBracketIds) {
            if (this.oldNodeReader) {
                const maxCacheableLength = this.positionMapper.getDistanceToNextChange(this.tokenizer.offset);
                if (maxCacheableLength === null || !(0, length_1.lengthIsZero)(maxCacheableLength)) {
                    const cachedNode = this.oldNodeReader.readLongestNodeAt(this.positionMapper.getOffsetBeforeChange(this.tokenizer.offset), curNode => {
                        // The edit could extend the ending token, thus we cannot re-use nodes that touch the edit.
                        // If there is no edit anymore, we can re-use the node in any case.
                        if (maxCacheableLength !== null && !(0, length_1.lengthLessThan)(curNode.length, maxCacheableLength)) {
                            // Either the node contains edited text or touches edited text.
                            // In the latter case, brackets might have been extended (`end` -> `ending`), so even touching nodes cannot be reused.
                            return false;
                        }
                        const canBeReused = curNode.canBeReused(openedBracketIds);
                        return canBeReused;
                    });
                    if (cachedNode) {
                        this._itemsFromCache++;
                        this.tokenizer.skip(cachedNode.length);
                        return cachedNode;
                    }
                }
            }
            return undefined;
        }
        parseChild(openedBracketIds, level) {
            this._itemsConstructed++;
            const token = this.tokenizer.read();
            switch (token.kind) {
                case 2 /* TokenKind.ClosingBracket */:
                    return new ast_1.InvalidBracketAstNode(token.bracketIds, token.length);
                case 0 /* TokenKind.Text */:
                    return token.astNode;
                case 1 /* TokenKind.OpeningBracket */: {
                    if (level > 300) {
                        // To prevent stack overflows
                        return new ast_1.TextAstNode(token.length);
                    }
                    const set = openedBracketIds.merge(token.bracketIds);
                    const child = this.parseList(set, level + 1);
                    const nextToken = this.tokenizer.peek();
                    if (nextToken &&
                        nextToken.kind === 2 /* TokenKind.ClosingBracket */ &&
                        (nextToken.bracketId === token.bracketId || nextToken.bracketIds.intersects(token.bracketIds))) {
                        this.tokenizer.read();
                        return ast_1.PairAstNode.create(token.astNode, child, nextToken.astNode);
                    }
                    else {
                        return ast_1.PairAstNode.create(token.astNode, child, null);
                    }
                }
                default:
                    throw new Error('unexpected');
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyc1RleHRNb2RlbFBhcnQvYnJhY2tldFBhaXJzVHJlZS9wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsc0NBR0M7SUFORDs7TUFFRTtJQUNGLFNBQWdCLGFBQWEsQ0FBQyxTQUFvQixFQUFFLEtBQXFCLEVBQUUsT0FBNEIsRUFBRSxvQkFBNkI7UUFDckksTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUMzRSxPQUFPLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQ7O01BRUU7SUFDRixNQUFNLE1BQU07UUFNWDs7VUFFRTtRQUNGLElBQUksZ0JBQWdCO1lBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQy9CLENBQUM7UUFFRDs7VUFFRTtRQUNGLElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM3QixDQUFDO1FBRUQsWUFDa0IsU0FBb0IsRUFDckMsS0FBcUIsRUFDckIsT0FBNEIsRUFDWCxvQkFBNkI7WUFIN0IsY0FBUyxHQUFULFNBQVMsQ0FBVztZQUdwQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQVM7WUFyQnZDLHNCQUFpQixHQUFXLENBQUMsQ0FBQztZQUM5QixvQkFBZSxHQUFXLENBQUMsQ0FBQztZQXNCbkMsSUFBSSxPQUFPLElBQUksb0JBQW9CLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNsQyxDQUFDO1lBRUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxPQUFP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