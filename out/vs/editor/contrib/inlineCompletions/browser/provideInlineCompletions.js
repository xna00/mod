/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/map", "vs/base/common/errors", "vs/editor/common/core/range", "vs/editor/common/model/bracketPairsTextModelPart/fixBrackets", "vs/editor/common/core/textEdit", "vs/editor/contrib/inlineCompletions/browser/utils", "vs/editor/contrib/snippet/browser/snippetParser"], function (require, exports, assert_1, async_1, cancellation_1, map_1, errors_1, range_1, fixBrackets_1, textEdit_1, utils_1, snippetParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineCompletionItem = exports.InlineCompletionList = exports.InlineCompletionProviderResult = void 0;
    exports.provideInlineCompletions = provideInlineCompletions;
    async function provideInlineCompletions(registry, position, model, context, token = cancellation_1.CancellationToken.None, languageConfigurationService) {
        // Important: Don't use position after the await calls, as the model could have been changed in the meantime!
        const defaultReplaceRange = getDefaultRange(position, model);
        const providers = registry.all(model);
        const multiMap = new map_1.SetMap();
        for (const provider of providers) {
            if (provider.groupId) {
                multiMap.add(provider.groupId, provider);
            }
        }
        function getPreferredProviders(provider) {
            if (!provider.yieldsToGroupIds) {
                return [];
            }
            const result = [];
            for (const groupId of provider.yieldsToGroupIds || []) {
                const providers = multiMap.get(groupId);
                for (const p of providers) {
                    result.push(p);
                }
            }
            return result;
        }
        const states = new Map();
        const seen = new Set();
        function findPreferredProviderCircle(provider, stack) {
            stack = [...stack, provider];
            if (seen.has(provider)) {
                return stack;
            }
            seen.add(provider);
            try {
                const preferred = getPreferredProviders(provider);
                for (const p of preferred) {
                    const c = findPreferredProviderCircle(p, stack);
                    if (c) {
                        return c;
                    }
                }
            }
            finally {
                seen.delete(provider);
            }
            return undefined;
        }
        function processProvider(provider) {
            const state = states.get(provider);
            if (state) {
                return state;
            }
            const circle = findPreferredProviderCircle(provider, []);
            if (circle) {
                (0, errors_1.onUnexpectedExternalError)(new Error(`Inline completions: cyclic yield-to dependency detected. Path: ${circle.map(s => s.toString ? s.toString() : ('' + s)).join(' -> ')}`));
            }
            const deferredPromise = new async_1.DeferredPromise();
            states.set(provider, deferredPromise.p);
            (async () => {
                if (!circle) {
                    const preferred = getPreferredProviders(provider);
                    for (const p of preferred) {
                        const result = await processProvider(p);
                        if (result && result.items.length > 0) {
                            // Skip provider
                            return undefined;
                        }
                    }
                }
                try {
                    const completions = await provider.provideInlineCompletions(model, position, context, token);
                    return completions;
                }
                catch (e) {
                    (0, errors_1.onUnexpectedExternalError)(e);
                    return undefined;
                }
            })().then(c => deferredPromise.complete(c), e => deferredPromise.error(e));
            return deferredPromise.p;
        }
        const providerResults = await Promise.all(providers.map(async (provider) => ({ provider, completions: await processProvider(provider) })));
        const itemsByHash = new Map();
        const lists = [];
        for (const result of providerResults) {
            const completions = result.completions;
            if (!completions) {
                continue;
            }
            const list = new InlineCompletionList(completions, result.provider);
            lists.push(list);
            for (const item of completions.items) {
                const inlineCompletionItem = InlineCompletionItem.from(item, list, defaultReplaceRange, model, languageConfigurationService);
                itemsByHash.set(inlineCompletionItem.hash(), inlineCompletionItem);
            }
        }
        return new InlineCompletionProviderResult(Array.from(itemsByHash.values()), new Set(itemsByHash.keys()), lists);
    }
    class InlineCompletionProviderResult {
        constructor(
        /**
         * Free of duplicates.
         */
        completions, hashs, providerResults) {
            this.completions = completions;
            this.hashs = hashs;
            this.providerResults = providerResults;
        }
        has(item) {
            return this.hashs.has(item.hash());
        }
        dispose() {
            for (const result of this.providerResults) {
                result.removeRef();
            }
        }
    }
    exports.InlineCompletionProviderResult = InlineCompletionProviderResult;
    /**
     * A ref counted pointer to the computed `InlineCompletions` and the `InlineCompletionsProvider` that
     * computed them.
     */
    class InlineCompletionList {
        constructor(inlineCompletions, provider) {
            this.inlineCompletions = inlineCompletions;
            this.provider = provider;
            this.refCount = 1;
        }
        addRef() {
            this.refCount++;
        }
        removeRef() {
            this.refCount--;
            if (this.refCount === 0) {
                this.provider.freeInlineCompletions(this.inlineCompletions);
            }
        }
    }
    exports.InlineCompletionList = InlineCompletionList;
    class InlineCompletionItem {
        static from(inlineCompletion, source, defaultReplaceRange, textModel, languageConfigurationService) {
            let insertText;
            let snippetInfo;
            let range = inlineCompletion.range ? range_1.Range.lift(inlineCompletion.range) : defaultReplaceRange;
            if (typeof inlineCompletion.insertText === 'string') {
                insertText = inlineCompletion.insertText;
                if (languageConfigurationService && inlineCompletion.completeBracketPairs) {
                    insertText = closeBrackets(insertText, range.getStartPosition(), textModel, languageConfigurationService);
                    // Modify range depending on if brackets are added or removed
                    const diff = insertText.length - inlineCompletion.insertText.length;
                    if (diff !== 0) {
                        range = new range_1.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn + diff);
                    }
                }
                snippetInfo = undefined;
            }
            else if ('snippet' in inlineCompletion.insertText) {
                const preBracketCompletionLength = inlineCompletion.insertText.snippet.length;
                if (languageConfigurationService && inlineCompletion.completeBracketPairs) {
                    inlineCompletion.insertText.snippet = closeBrackets(inlineCompletion.insertText.snippet, range.getStartPosition(), textModel, languageConfigurationService);
                    // Modify range depending on if brackets are added or removed
                    const diff = inlineCompletion.insertText.snippet.length - preBracketCompletionLength;
                    if (diff !== 0) {
                        range = new range_1.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn + diff);
                    }
                }
                const snippet = new snippetParser_1.SnippetParser().parse(inlineCompletion.insertText.snippet);
                if (snippet.children.length === 1 && snippet.children[0] instanceof snippetParser_1.Text) {
                    insertText = snippet.children[0].value;
                    snippetInfo = undefined;
                }
                else {
                    insertText = snippet.toString();
                    snippetInfo = {
                        snippet: inlineCompletion.insertText.snippet,
                        range: range
                    };
                }
            }
            else {
                (0, assert_1.assertNever)(inlineCompletion.insertText);
            }
            return new InlineCompletionItem(insertText, inlineCompletion.command, range, insertText, snippetInfo, inlineCompletion.additionalTextEdits || (0, utils_1.getReadonlyEmptyArray)(), inlineCompletion, source);
        }
        constructor(filterText, command, range, insertText, snippetInfo, additionalTextEdits, 
        /**
         * A reference to the original inline completion this inline completion has been constructed from.
         * Used for event data to ensure referential equality.
        */
        sourceInlineCompletion, 
        /**
         * A reference to the original inline completion list this inline completion has been constructed from.
         * Used for event data to ensure referential equality.
        */
        source) {
            this.filterText = filterText;
            this.command = command;
            this.range = range;
            this.insertText = insertText;
            this.snippetInfo = snippetInfo;
            this.additionalTextEdits = additionalTextEdits;
            this.sourceInlineCompletion = sourceInlineCompletion;
            this.source = source;
            filterText = filterText.replace(/\r\n|\r/g, '\n');
            insertText = filterText.replace(/\r\n|\r/g, '\n');
        }
        withRange(updatedRange) {
            return new InlineCompletionItem(this.filterText, this.command, updatedRange, this.insertText, this.snippetInfo, this.additionalTextEdits, this.sourceInlineCompletion, this.source);
        }
        hash() {
            return JSON.stringify({ insertText: this.insertText, range: this.range.toString() });
        }
        toSingleTextEdit() {
            return new textEdit_1.SingleTextEdit(this.range, this.insertText);
        }
    }
    exports.InlineCompletionItem = InlineCompletionItem;
    function getDefaultRange(position, model) {
        const word = model.getWordAtPosition(position);
        const maxColumn = model.getLineMaxColumn(position.lineNumber);
        // By default, always replace up until the end of the current line.
        // This default might be subject to change!
        return word
            ? new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, maxColumn)
            : range_1.Range.fromPositions(position, position.with(undefined, maxColumn));
    }
    function closeBrackets(text, position, model, languageConfigurationService) {
        const lineStart = model.getLineContent(position.lineNumber).substring(0, position.column - 1);
        const newLine = lineStart + text;
        const newTokens = model.tokenization.tokenizeLineWithEdit(position, newLine.length - (position.column - 1), text);
        const slicedTokens = newTokens?.sliceAndInflate(position.column - 1, newLine.length, 0);
        if (!slicedTokens) {
            return text;
        }
        const newText = (0, fixBrackets_1.fixBracketsInLine)(slicedTokens, languageConfigurationService);
        return newText;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZUlubGluZUNvbXBsZXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVDb21wbGV0aW9ucy9icm93c2VyL3Byb3ZpZGVJbmxpbmVDb21wbGV0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQmhHLDREQW1IQztJQW5ITSxLQUFLLFVBQVUsd0JBQXdCLENBQzdDLFFBQTRELEVBQzVELFFBQWtCLEVBQ2xCLEtBQWlCLEVBQ2pCLE9BQWdDLEVBQ2hDLFFBQTJCLGdDQUFpQixDQUFDLElBQUksRUFDakQsNEJBQTREO1FBRTVELDZHQUE2RztRQUM3RyxNQUFNLG1CQUFtQixHQUFHLGVBQWUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0QsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV0QyxNQUFNLFFBQVEsR0FBRyxJQUFJLFlBQU0sRUFBbUUsQ0FBQztRQUMvRixLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ2xDLElBQUksUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN0QixRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDMUMsQ0FBQztRQUNGLENBQUM7UUFFRCxTQUFTLHFCQUFxQixDQUFDLFFBQXdDO1lBQ3RFLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFBQyxPQUFPLEVBQUUsQ0FBQztZQUFDLENBQUM7WUFDOUMsTUFBTSxNQUFNLEdBQXFDLEVBQUUsQ0FBQztZQUNwRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDdkQsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDeEMsS0FBSyxNQUFNLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEIsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFHRCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBMEUsQ0FBQztRQUVqRyxNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsRUFBa0UsQ0FBQztRQUN2RixTQUFTLDJCQUEyQixDQUFDLFFBQXdDLEVBQUUsS0FBa0M7WUFDaEgsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDN0IsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQUMsT0FBTyxLQUFLLENBQUM7WUFBQyxDQUFDO1lBRXpDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkIsSUFBSSxDQUFDO2dCQUNKLE1BQU0sU0FBUyxHQUFHLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNsRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUMzQixNQUFNLENBQUMsR0FBRywyQkFBMkIsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ2hELElBQUksQ0FBQyxFQUFFLENBQUM7d0JBQUMsT0FBTyxDQUFDLENBQUM7b0JBQUMsQ0FBQztnQkFDckIsQ0FBQztZQUNGLENBQUM7b0JBQVMsQ0FBQztnQkFDVixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsU0FBUyxlQUFlLENBQUMsUUFBd0M7WUFDaEUsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuQyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLDJCQUEyQixDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN6RCxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLElBQUEsa0NBQXlCLEVBQUMsSUFBSSxLQUFLLENBQUMsa0VBQWtFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlLLENBQUM7WUFFRCxNQUFNLGVBQWUsR0FBRyxJQUFJLHVCQUFlLEVBQTBELENBQUM7WUFDdEcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXhDLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ1gsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNiLE1BQU0sU0FBUyxHQUFHLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNsRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLFNBQVMsRUFBRSxDQUFDO3dCQUMzQixNQUFNLE1BQU0sR0FBRyxNQUFNLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDeEMsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQ3ZDLGdCQUFnQjs0QkFDaEIsT0FBTyxTQUFTLENBQUM7d0JBQ2xCLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksQ0FBQztvQkFDSixNQUFNLFdBQVcsR0FBRyxNQUFNLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDN0YsT0FBTyxXQUFXLENBQUM7Z0JBQ3BCLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWixJQUFBLGtDQUF5QixFQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM3QixPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUzRSxPQUFPLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVELE1BQU0sZUFBZSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxRQUFRLEVBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLE1BQU0sZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFekksTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQWdDLENBQUM7UUFDNUQsTUFBTSxLQUFLLEdBQTJCLEVBQUUsQ0FBQztRQUN6QyxLQUFLLE1BQU0sTUFBTSxJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3RDLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFDdkMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNsQixTQUFTO1lBQ1YsQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLElBQUksb0JBQW9CLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRWpCLEtBQUssTUFBTSxJQUFJLElBQUksV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN0QyxNQUFNLG9CQUFvQixHQUFHLG9CQUFvQixDQUFDLElBQUksQ0FDckQsSUFBSSxFQUNKLElBQUksRUFDSixtQkFBbUIsRUFDbkIsS0FBSyxFQUNMLDRCQUE0QixDQUM1QixDQUFDO2dCQUNGLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUNwRSxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sSUFBSSw4QkFBOEIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pILENBQUM7SUFFRCxNQUFhLDhCQUE4QjtRQUUxQztRQUNDOztXQUVHO1FBQ2EsV0FBNEMsRUFDM0MsS0FBa0IsRUFDbEIsZUFBZ0Q7WUFGakQsZ0JBQVcsR0FBWCxXQUFXLENBQWlDO1lBQzNDLFVBQUssR0FBTCxLQUFLLENBQWE7WUFDbEIsb0JBQWUsR0FBZixlQUFlLENBQWlDO1FBQzlELENBQUM7UUFFRSxHQUFHLENBQUMsSUFBMEI7WUFDcEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsT0FBTztZQUNOLEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMzQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDcEIsQ0FBQztRQUNGLENBQUM7S0FDRDtJQXBCRCx3RUFvQkM7SUFFRDs7O09BR0c7SUFDSCxNQUFhLG9CQUFvQjtRQUVoQyxZQUNpQixpQkFBb0MsRUFDcEMsUUFBbUM7WUFEbkMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNwQyxhQUFRLEdBQVIsUUFBUSxDQUEyQjtZQUg1QyxhQUFRLEdBQUcsQ0FBQyxDQUFDO1FBSWpCLENBQUM7UUFFTCxNQUFNO1lBQ0wsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxTQUFTO1lBQ1IsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hCLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUM3RCxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBakJELG9EQWlCQztJQUVELE1BQWEsb0JBQW9CO1FBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQ2pCLGdCQUFrQyxFQUNsQyxNQUE0QixFQUM1QixtQkFBMEIsRUFDMUIsU0FBcUIsRUFDckIsNEJBQXVFO1lBRXZFLElBQUksVUFBa0IsQ0FBQztZQUN2QixJQUFJLFdBQW9DLENBQUM7WUFDekMsSUFBSSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQztZQUU5RixJQUFJLE9BQU8sZ0JBQWdCLENBQUMsVUFBVSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNyRCxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxDQUFDO2dCQUV6QyxJQUFJLDRCQUE0QixJQUFJLGdCQUFnQixDQUFDLG9CQUFvQixFQUFFLENBQUM7b0JBQzNFLFVBQVUsR0FBRyxhQUFhLENBQ3pCLFVBQVUsRUFDVixLQUFLLENBQUMsZ0JBQWdCLEVBQUUsRUFDeEIsU0FBUyxFQUNULDRCQUE0QixDQUM1QixDQUFDO29CQUVGLDZEQUE2RDtvQkFDN0QsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO29CQUNwRSxJQUFJLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDaEIsS0FBSyxHQUFHLElBQUksYUFBSyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUM7b0JBQzFHLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxXQUFXLEdBQUcsU0FBUyxDQUFDO1lBQ3pCLENBQUM7aUJBQU0sSUFBSSxTQUFTLElBQUksZ0JBQWdCLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JELE1BQU0sMEJBQTBCLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBRTlFLElBQUksNEJBQTRCLElBQUksZ0JBQWdCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDM0UsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQ2xELGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQ25DLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxFQUN4QixTQUFTLEVBQ1QsNEJBQTRCLENBQzVCLENBQUM7b0JBRUYsNkRBQTZEO29CQUM3RCxNQUFNLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRywwQkFBMEIsQ0FBQztvQkFDckYsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ2hCLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDO29CQUMxRyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFL0UsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsWUFBWSxvQkFBSSxFQUFFLENBQUM7b0JBQzFFLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztvQkFDdkMsV0FBVyxHQUFHLFNBQVMsQ0FBQztnQkFDekIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2hDLFdBQVcsR0FBRzt3QkFDYixPQUFPLEVBQUUsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE9BQU87d0JBQzVDLEtBQUssRUFBRSxLQUFLO3FCQUNaLENBQUM7Z0JBQ0gsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFBLG9CQUFXLEVBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELE9BQU8sSUFBSSxvQkFBb0IsQ0FDOUIsVUFBVSxFQUNWLGdCQUFnQixDQUFDLE9BQU8sRUFDeEIsS0FBSyxFQUNMLFVBQVUsRUFDVixXQUFXLEVBQ1gsZ0JBQWdCLENBQUMsbUJBQW1CLElBQUksSUFBQSw2QkFBcUIsR0FBRSxFQUMvRCxnQkFBZ0IsRUFDaEIsTUFBTSxDQUNOLENBQUM7UUFDSCxDQUFDO1FBRUQsWUFDVSxVQUFrQixFQUNsQixPQUE0QixFQUM1QixLQUFZLEVBQ1osVUFBa0IsRUFDbEIsV0FBb0MsRUFFcEMsbUJBQW9EO1FBRzdEOzs7VUFHRTtRQUNPLHNCQUF3QztRQUVqRDs7O1VBR0U7UUFDTyxNQUE0QjtZQW5CNUIsZUFBVSxHQUFWLFVBQVUsQ0FBUTtZQUNsQixZQUFPLEdBQVAsT0FBTyxDQUFxQjtZQUM1QixVQUFLLEdBQUwsS0FBSyxDQUFPO1lBQ1osZUFBVSxHQUFWLFVBQVUsQ0FBUTtZQUNsQixnQkFBVyxHQUFYLFdBQVcsQ0FBeUI7WUFFcEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFpQztZQU9wRCwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQWtCO1lBTXhDLFdBQU0sR0FBTixNQUFNLENBQXNCO1lBRXJDLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRCxVQUFVLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVNLFNBQVMsQ0FBQyxZQUFtQjtZQUNuQyxPQUFPLElBQUksb0JBQW9CLENBQzlCLElBQUksQ0FBQyxVQUFVLEVBQ2YsSUFBSSxDQUFDLE9BQU8sRUFDWixZQUFZLEVBQ1osSUFBSSxDQUFDLFVBQVUsRUFDZixJQUFJLENBQUMsV0FBVyxFQUNoQixJQUFJLENBQUMsbUJBQW1CLEVBQ3hCLElBQUksQ0FBQyxzQkFBc0IsRUFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FDWCxDQUFDO1FBQ0gsQ0FBQztRQUVNLElBQUk7WUFDVixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEYsQ0FBQztRQUVNLGdCQUFnQjtZQUN0QixPQUFPLElBQUkseUJBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN4RCxDQUFDO0tBQ0Q7SUEzSEQsb0RBMkhDO0lBUUQsU0FBUyxlQUFlLENBQUMsUUFBa0IsRUFBRSxLQUFpQjtRQUM3RCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0MsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM5RCxtRUFBbUU7UUFDbkUsMkNBQTJDO1FBQzNDLE9BQU8sSUFBSTtZQUNWLENBQUMsQ0FBQyxJQUFJLGFBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUM7WUFDbEYsQ0FBQyxDQUFDLGFBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVELFNBQVMsYUFBYSxDQUFDLElBQVksRUFBRSxRQUFrQixFQUFFLEtBQWlCLEVBQUUsNEJBQTJEO1FBQ3RJLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM5RixNQUFNLE9BQU8sR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBRWpDLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xILE1BQU0sWUFBWSxHQUFHLFNBQVMsRUFBRSxlQUFlLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4RixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbkIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBQSwrQkFBaUIsRUFBQyxZQUFZLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUU5RSxPQUFPLE9BQU8sQ0FBQztJQUNoQixDQUFDIn0=