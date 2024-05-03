/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/brackets", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/parser", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/smallImmutableSet", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/tokenizer"], function (require, exports, brackets_1, length_1, parser_1, smallImmutableSet_1, tokenizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fixBracketsInLine = fixBracketsInLine;
    function fixBracketsInLine(tokens, languageConfigurationService) {
        const denseKeyProvider = new smallImmutableSet_1.DenseKeyProvider();
        const bracketTokens = new brackets_1.LanguageAgnosticBracketTokens(denseKeyProvider, (languageId) => languageConfigurationService.getLanguageConfiguration(languageId));
        const tokenizer = new tokenizer_1.TextBufferTokenizer(new StaticTokenizerSource([tokens]), bracketTokens);
        const node = (0, parser_1.parseDocument)(tokenizer, [], undefined, true);
        let str = '';
        const line = tokens.getLineContent();
        function processNode(node, offset) {
            if (node.kind === 2 /* AstNodeKind.Pair */) {
                processNode(node.openingBracket, offset);
                offset = (0, length_1.lengthAdd)(offset, node.openingBracket.length);
                if (node.child) {
                    processNode(node.child, offset);
                    offset = (0, length_1.lengthAdd)(offset, node.child.length);
                }
                if (node.closingBracket) {
                    processNode(node.closingBracket, offset);
                    offset = (0, length_1.lengthAdd)(offset, node.closingBracket.length);
                }
                else {
                    const singleLangBracketTokens = bracketTokens.getSingleLanguageBracketTokens(node.openingBracket.languageId);
                    const closingTokenText = singleLangBracketTokens.findClosingTokenText(node.openingBracket.bracketIds);
                    str += closingTokenText;
                }
            }
            else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
                // remove the bracket
            }
            else if (node.kind === 0 /* AstNodeKind.Text */ || node.kind === 1 /* AstNodeKind.Bracket */) {
                str += line.substring((0, length_1.lengthGetColumnCountIfZeroLineCount)(offset), (0, length_1.lengthGetColumnCountIfZeroLineCount)((0, length_1.lengthAdd)(offset, node.length)));
            }
            else if (node.kind === 4 /* AstNodeKind.List */) {
                for (const child of node.children) {
                    processNode(child, offset);
                    offset = (0, length_1.lengthAdd)(offset, child.length);
                }
            }
        }
        processNode(node, length_1.lengthZero);
        return str;
    }
    class StaticTokenizerSource {
        constructor(lines) {
            this.lines = lines;
            this.tokenization = {
                getLineTokens: (lineNumber) => {
                    return this.lines[lineNumber - 1];
                }
            };
        }
        getValue() {
            return this.lines.map(l => l.getLineContent()).join('\n');
        }
        getLineCount() {
            return this.lines.length;
        }
        getLineLength(lineNumber) {
            return this.lines[lineNumber - 1].getLineContent().length;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4QnJhY2tldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvYnJhY2tldFBhaXJzVGV4dE1vZGVsUGFydC9maXhCcmFja2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyw4Q0FrREM7SUFsREQsU0FBZ0IsaUJBQWlCLENBQUMsTUFBdUIsRUFBRSw0QkFBMkQ7UUFDckgsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLG9DQUFnQixFQUFVLENBQUM7UUFDeEQsTUFBTSxhQUFhLEdBQUcsSUFBSSx3Q0FBNkIsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQ3hGLDRCQUE0QixDQUFDLHdCQUF3QixDQUFDLFVBQVUsQ0FBQyxDQUNqRSxDQUFDO1FBQ0YsTUFBTSxTQUFTLEdBQUcsSUFBSSwrQkFBbUIsQ0FDeEMsSUFBSSxxQkFBcUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQ25DLGFBQWEsQ0FDYixDQUFDO1FBQ0YsTUFBTSxJQUFJLEdBQUcsSUFBQSxzQkFBYSxFQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTNELElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNiLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUVyQyxTQUFTLFdBQVcsQ0FBQyxJQUFhLEVBQUUsTUFBYztZQUNqRCxJQUFJLElBQUksQ0FBQyxJQUFJLDZCQUFxQixFQUFFLENBQUM7Z0JBQ3BDLFdBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLEdBQUcsSUFBQSxrQkFBUyxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0s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