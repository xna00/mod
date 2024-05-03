/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/textModelBracketPairs", "./beforeEditPositionMapper", "./brackets", "./length", "./parser", "./smallImmutableSet", "./tokenizer", "vs/base/common/arrays", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/combineTextEditInfos"], function (require, exports, event_1, lifecycle_1, textModelBracketPairs_1, beforeEditPositionMapper_1, brackets_1, length_1, parser_1, smallImmutableSet_1, tokenizer_1, arrays_1, combineTextEditInfos_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketPairsTree = void 0;
    class BracketPairsTree extends lifecycle_1.Disposable {
        didLanguageChange(languageId) {
            return this.brackets.didLanguageChange(languageId);
        }
        constructor(textModel, getLanguageConfiguration) {
            super();
            this.textModel = textModel;
            this.getLanguageConfiguration = getLanguageConfiguration;
            this.didChangeEmitter = new event_1.Emitter();
            this.denseKeyProvider = new smallImmutableSet_1.DenseKeyProvider();
            this.brackets = new brackets_1.LanguageAgnosticBracketTokens(this.denseKeyProvider, this.getLanguageConfiguration);
            this.onDidChange = this.didChangeEmitter.event;
            this.queuedTextEditsForInitialAstWithoutTokens = [];
            this.queuedTextEdits = [];
            if (!textModel.tokenization.hasTokens) {
                const brackets = this.brackets.getSingleLanguageBracketTokens(this.textModel.getLanguageId());
                const tokenizer = new tokenizer_1.FastTokenizer(this.textModel.getValue(), brackets);
                this.initialAstWithoutTokens = (0, parser_1.parseDocument)(tokenizer, [], undefined, true);
                this.astWithTokens = this.initialAstWithoutTokens;
            }
            else if (textModel.tokenization.backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) {
                // Skip the initial ast, as there is no flickering.
                // Directly create the tree with token information.
                this.initialAstWithoutTokens = undefined;
                this.astWithTokens = this.parseDocumentFromTextBuffer([], undefined, false);
            }
            else {
                // We missed some token changes already, so we cannot use the fast tokenizer + delta increments
                this.initialAstWithoutTokens = this.parseDocumentFromTextBuffer([], undefined, true);
                this.astWithTokens = this.initialAstWithoutTokens;
            }
        }
        //#region TextModel events
        handleDidChangeBackgroundTokenizationState() {
            if (this.textModel.tokenization.backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) {
                const wasUndefined = this.initialAstWithoutTokens === undefined;
                // Clear the initial tree as we can use the tree with token information now.
                this.initialAstWithoutTokens = undefined;
                if (!wasUndefined) {
                    this.didChangeEmitter.fire();
                }
            }
        }
        handleDidChangeTokens({ ranges }) {
            const edits = ranges.map(r => new beforeEditPositionMapper_1.TextEditInfo((0, length_1.toLength)(r.fromLineNumber - 1, 0), (0, length_1.toLength)(r.toLineNumber, 0), (0, length_1.toLength)(r.toLineNumber - r.fromLineNumber + 1, 0)));
            this.handleEdits(edits, true);
            if (!this.initialAstWithoutTokens) {
                this.didChangeEmitter.fire();
            }
        }
        handleContentChanged(change) {
            const edits = beforeEditPositionMapper_1.TextEditInfo.fromModelContentChanges(change.changes);
            this.handleEdits(edits, false);
        }
        handleEdits(edits, tokenChange) {
            // Lazily queue the edits and only apply them when the tree is accessed.
            const result = (0, combineTextEditInfos_1.combineTextEditInfos)(this.queuedTextEdits, edits);
            this.queuedTextEdits = result;
            if (this.initialAstWithoutTokens && !tokenChange) {
                this.queuedTextEditsForInitialAstWithoutTokens = (0, combineTextEditInfos_1.combineTextEditInfos)(this.queuedTextEditsForInitialAstWithoutTokens, edits);
            }
        }
        //#endregion
        flushQueue() {
            if (this.queuedTextEdits.length > 0) {
                this.astWithTokens = this.parseDocumentFromTextBuffer(this.queuedTextEdits, this.astWithTokens, false);
                this.queuedTextEdits = [];
            }
            if (this.queuedTextEditsForInitialAstWithoutTokens.length > 0) {
                if (this.initialAstWithoutTokens) {
                    this.initialAstWithoutTokens = this.parseDocumentFromTextBuffer(this.queuedTextEditsForInitialAstWithoutTokens, this.initialAstWithoutTokens, false);
                }
                this.queuedTextEditsForInitialAstWithoutTokens = [];
            }
        }
        /**
         * @pure (only if isPure = true)
        */
        parseDocumentFromTextBuffer(edits, previousAst, immutable) {
            // Is much faster if `isPure = false`.
            const isPure = false;
            const previousAstClone = isPure ? previousAst?.deepClone() : previousAst;
            const tokenizer = new tokenizer_1.TextBufferTokenizer(this.textModel, this.brackets);
            const result = (0, parser_1.parseDocument)(tokenizer, edits, previousAstClone, immutable);
            return result;
        }
        getBracketsInRange(range, onlyColorizedBrackets) {
            this.flushQueue();
            const startOffset = (0, length_1.toLength)(range.startLineNumber - 1, range.startColumn - 1);
            const endOffset = (0, length_1.toLength)(range.endLineNumber - 1, range.endColumn - 1);
            return new arrays_1.CallbackIterable(cb => {
                const node = this.initialAstWithoutTokens || this.astWithTokens;
                collectBrackets(node, length_1.lengthZero, node.length, startOffset, endOffset, cb, 0, 0, new Map(), onlyColorizedBrackets);
            });
        }
        getBracketPairsInRange(range, includeMinIndentation) {
            this.flushQueue();
            const startLength = (0, length_1.positionToLength)(range.getStartPosition());
            const endLength = (0, length_1.positionToLength)(range.getEndPosition());
            return new arrays_1.CallbackIterable(cb => {
                const node = this.initialAstWithoutTokens || this.astWithTokens;
                const context = new CollectBracketPairsContext(cb, includeMinIndentation, this.textModel);
                collectBracketPairs(node, length_1.lengthZero, node.length, startLength, endLength, context, 0, new Map());
            });
        }
        getFirstBracketAfter(position) {
            this.flushQueue();
            const node = this.initialAstWithoutTokens || this.astWithTokens;
            return getFirstBracketAfter(node, length_1.lengthZero, node.length, (0, length_1.positionToLength)(position));
        }
        getFirstBracketBefore(position) {
            this.flushQueue();
            const node = this.initialAstWithoutTokens || this.astWithTokens;
            return getFirstBracketBefore(node, length_1.lengthZero, node.length, (0, length_1.positionToLength)(position));
        }
    }
    exports.BracketPairsTree = BracketPairsTree;
    function getFirstBracketBefore(node, nodeOffsetStart, nodeOffsetEnd, position) {
        if (node.kind === 4 /* AstNodeKind.List */ || node.kind === 2 /* AstNodeKind.Pair */) {
            const lengths = [];
            for (const child of node.children) {
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                lengths.push({ nodeOffsetStart, nodeOffsetEnd });
                nodeOffsetStart = nodeOffsetEnd;
            }
            for (let i = lengths.length - 1; i >= 0; i--) {
                const { nodeOffsetStart, nodeOffsetEnd } = lengths[i];
                if ((0, length_1.lengthLessThan)(nodeOffsetStart, position)) {
                    const result = getFirstBracketBefore(node.children[i], nodeOffsetStart, nodeOffsetEnd, position);
                    if (result) {
                        return result;
                    }
                }
            }
            return null;
        }
        else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
            return null;
        }
        else if (node.kind === 1 /* AstNodeKind.Bracket */) {
            const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
            return {
                bracketInfo: node.bracketInfo,
                range
            };
        }
        return null;
    }
    function getFirstBracketAfter(node, nodeOffsetStart, nodeOffsetEnd, position) {
        if (node.kind === 4 /* AstNodeKind.List */ || node.kind === 2 /* AstNodeKind.Pair */) {
            for (const child of node.children) {
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                if ((0, length_1.lengthLessThan)(position, nodeOffsetEnd)) {
                    const result = getFirstBracketAfter(child, nodeOffsetStart, nodeOffsetEnd, position);
                    if (result) {
                        return result;
                    }
                }
                nodeOffsetStart = nodeOffsetEnd;
            }
            return null;
        }
        else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
            return null;
        }
        else if (node.kind === 1 /* AstNodeKind.Bracket */) {
            const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
            return {
                bracketInfo: node.bracketInfo,
                range
            };
        }
        return null;
    }
    function collectBrackets(node, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, push, level, nestingLevelOfEqualBracketType, levelPerBracketType, onlyColorizedBrackets, parentPairIsIncomplete = false) {
        if (level > 200) {
            return true;
        }
        whileLoop: while (true) {
            switch (node.kind) {
                case 4 /* AstNodeKind.List */: {
                    const childCount = node.childrenLength;
                    for (let i = 0; i < childCount; i++) {
                        const child = node.getChild(i);
                        if (!child) {
                            continue;
                        }
                        nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                        if ((0, length_1.lengthLessThanEqual)(nodeOffsetStart, endOffset) &&
                            (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, startOffset)) {
                            const childEndsAfterEnd = (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, endOffset);
                            if (childEndsAfterEnd) {
                                // No child after this child in the requested window, don't recurse
                                node = child;
                                continue whileLoop;
                            }
                            const shouldContinue = collectBrackets(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, push, level, 0, levelPerBracketType, onlyColorizedBrackets);
                            if (!shouldContinue) {
                                return false;
                            }
                        }
                        nodeOffsetStart = nodeOffsetEnd;
                    }
                    return true;
                }
                case 2 /* AstNodeKind.Pair */: {
                    const colorize = !onlyColorizedBrackets || !node.closingBracket || node.closingBracket.bracketInfo.closesColorized(node.openingBracket.bracketInfo);
                    let levelPerBracket = 0;
                    if (levelPerBracketType) {
                        let existing = levelPerBracketType.get(node.openingBracket.text);
                        if (existing === undefined) {
                            existing = 0;
                        }
                        levelPerBracket = existing;
                        if (colorize) {
                            existing++;
                            levelPerBracketType.set(node.openingBracket.text, existing);
                        }
                    }
                    const childCount = node.childrenLength;
                    for (let i = 0; i < childCount; i++) {
                        const child = node.getChild(i);
                        if (!child) {
                            continue;
                        }
                        nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                        if ((0, length_1.lengthLessThanEqual)(nodeOffsetStart, endOffset) &&
                            (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, startOffset)) {
                            const childEndsAfterEnd = (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, endOffset);
                            if (childEndsAfterEnd && child.kind !== 1 /* AstNodeKind.Bracket */) {
                                // No child after this child in the requested window, don't recurse
                                // Don't do this for brackets because of unclosed/unopened brackets
                                node = child;
                                if (colorize) {
                                    level++;
                                    nestingLevelOfEqualBracketType = levelPerBracket + 1;
                                }
                                else {
                                    nestingLevelOfEqualBracketType = levelPerBracket;
                                }
                                continue whileLoop;
                            }
                            if (colorize || child.kind !== 1 /* AstNodeKind.Bracket */ || !node.closingBracket) {
                                const shouldContinue = collectBrackets(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, push, colorize ? level + 1 : level, colorize ? levelPerBracket + 1 : levelPerBracket, levelPerBracketType, onlyColorizedBrackets, !node.closingBracket);
                                if (!shouldContinue) {
                                    return false;
                                }
                            }
                        }
                        nodeOffsetStart = nodeOffsetEnd;
                    }
                    levelPerBracketType?.set(node.openingBracket.text, levelPerBracket);
                    return true;
                }
                case 3 /* AstNodeKind.UnexpectedClosingBracket */: {
                    const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
                    return push(new textModelBracketPairs_1.BracketInfo(range, level - 1, 0, true));
                }
                case 1 /* AstNodeKind.Bracket */: {
                    const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
                    return push(new textModelBracketPairs_1.BracketInfo(range, level - 1, nestingLevelOfEqualBracketType - 1, parentPairIsIncomplete));
                }
                case 0 /* AstNodeKind.Text */:
                    return true;
            }
        }
    }
    class CollectBracketPairsContext {
        constructor(push, includeMinIndentation, textModel) {
            this.push = push;
            this.includeMinIndentation = includeMinIndentation;
            this.textModel = textModel;
        }
    }
    function collectBracketPairs(node, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, context, level, levelPerBracketType) {
        if (level > 200) {
            return true;
        }
        let shouldContinue = true;
        if (node.kind === 2 /* AstNodeKind.Pair */) {
            let levelPerBracket = 0;
            if (levelPerBracketType) {
                let existing = levelPerBracketType.get(node.openingBracket.text);
                if (existing === undefined) {
                    existing = 0;
                }
                levelPerBracket = existing;
                existing++;
                levelPerBracketType.set(node.openingBracket.text, existing);
            }
            const openingBracketEnd = (0, length_1.lengthAdd)(nodeOffsetStart, node.openingBracket.length);
            let minIndentation = -1;
            if (context.includeMinIndentation) {
                minIndentation = node.computeMinIndentation(nodeOffsetStart, context.textModel);
            }
            shouldContinue = context.push(new textModelBracketPairs_1.BracketPairWithMinIndentationInfo((0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd), (0, length_1.lengthsToRange)(nodeOffsetStart, openingBracketEnd), node.closingBracket
                ? (0, length_1.lengthsToRange)((0, length_1.lengthAdd)(openingBracketEnd, node.child?.length || length_1.lengthZero), nodeOffsetEnd)
                : undefined, level, levelPerBracket, node, minIndentation));
            nodeOffsetStart = openingBracketEnd;
            if (shouldContinue && node.child) {
                const child = node.child;
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                if ((0, length_1.lengthLessThanEqual)(nodeOffsetStart, endOffset) &&
                    (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, startOffset)) {
                    shouldContinue = collectBracketPairs(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, context, level + 1, levelPerBracketType);
                    if (!shouldContinue) {
                        return false;
                    }
                }
            }
            levelPerBracketType?.set(node.openingBracket.text, levelPerBracket);
        }
        else {
            let curOffset = nodeOffsetStart;
            for (const child of node.children) {
                const childOffset = curOffset;
                curOffset = (0, length_1.lengthAdd)(curOffset, child.length);
                if ((0, length_1.lengthLessThanEqual)(childOffset, endOffset) &&
                    (0, length_1.lengthLessThanEqual)(startOffset, curOffset)) {
                    shouldContinue = collectBracketPairs(child, childOffset, curOffset, startOffset, endOffset, context, level, levelPerBracketType);
                    if (!shouldContinue) {
                        return false;
                    }
                }
            }
        }
        return shouldContinue;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldFBhaXJzVHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9icmFja2V0UGFpcnNUZXh0TW9kZWxQYXJ0L2JyYWNrZXRQYWlyc1RyZWUvYnJhY2tldFBhaXJzVHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLE1BQWEsZ0JBQWlCLFNBQVEsc0JBQVU7UUFrQnhDLGlCQUFpQixDQUFDLFVBQWtCO1lBQzFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBTUQsWUFDa0IsU0FBb0IsRUFDcEIsd0JBQStFO1lBRWhHLEtBQUssRUFBRSxDQUFDO1lBSFMsY0FBUyxHQUFULFNBQVMsQ0FBVztZQUNwQiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQXVEO1lBM0JoRixxQkFBZ0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBY3ZDLHFCQUFnQixHQUFHLElBQUksb0NBQWdCLEVBQVUsQ0FBQztZQUNsRCxhQUFRLEdBQUcsSUFBSSx3Q0FBNkIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFNcEcsZ0JBQVcsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBQ2xELDhDQUF5QyxHQUFtQixFQUFFLENBQUM7WUFDL0Qsb0JBQWUsR0FBbUIsRUFBRSxDQUFDO1lBUTVDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLDhCQUE4QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztn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