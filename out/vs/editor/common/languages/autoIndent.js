/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/supports", "vs/editor/common/languages/languageConfigurationRegistry"], function (require, exports, strings, languageConfiguration_1, supports_1, languageConfigurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInheritIndentForLine = getInheritIndentForLine;
    exports.getGoodIndentForLine = getGoodIndentForLine;
    exports.getIndentForEnter = getIndentForEnter;
    exports.getIndentActionForType = getIndentActionForType;
    exports.getIndentMetadata = getIndentMetadata;
    /**
     * Get nearest preceding line which doesn't match unIndentPattern or contains all whitespace.
     * Result:
     * -1: run into the boundary of embedded languages
     * 0: every line above are invalid
     * else: nearest preceding line of the same language
     */
    function getPrecedingValidLine(model, lineNumber, indentRulesSupport) {
        const languageId = model.tokenization.getLanguageIdAtPosition(lineNumber, 0);
        if (lineNumber > 1) {
            let lastLineNumber;
            let resultLineNumber = -1;
            for (lastLineNumber = lineNumber - 1; lastLineNumber >= 1; lastLineNumber--) {
                if (model.tokenization.getLanguageIdAtPosition(lastLineNumber, 0) !== languageId) {
                    return resultLineNumber;
                }
                const text = model.getLineContent(lastLineNumber);
                if (indentRulesSupport.shouldIgnore(text) || /^\s+$/.test(text) || text === '') {
                    resultLineNumber = lastLineNumber;
                    continue;
                }
                return lastLineNumber;
            }
        }
        return -1;
    }
    /**
     * Get inherited indentation from above lines.
     * 1. Find the nearest preceding line which doesn't match unIndentedLinePattern.
     * 2. If this line matches indentNextLinePattern or increaseIndentPattern, it means that the indent level of `lineNumber` should be 1 greater than this line.
     * 3. If this line doesn't match any indent rules
     *   a. check whether the line above it matches indentNextLinePattern
     *   b. If not, the indent level of this line is the result
     *   c. If so, it means the indent of this line is *temporary*, go upward utill we find a line whose indent is not temporary (the same workflow a -> b -> c).
     * 4. Otherwise, we fail to get an inherited indent from aboves. Return null and we should not touch the indent of `lineNumber`
     *
     * This function only return the inherited indent based on above lines, it doesn't check whether current line should decrease or not.
     */
    function getInheritIndentForLine(autoIndent, model, lineNumber, honorIntentialIndent = true, languageConfigurationService) {
        if (autoIndent < 4 /* EditorAutoIndentStrategy.Full */) {
            return null;
        }
        const indentRulesSupport = languageConfigurationService.getLanguageConfiguration(model.tokenization.getLanguageId()).indentRulesSupport;
        if (!indentRulesSupport) {
            return null;
        }
        if (lineNumber <= 1) {
            return {
                indentation: '',
                action: null
            };
        }
        // Use no indent if this is the first non-blank line
        for (let priorLineNumber = lineNumber - 1; priorLineNumber > 0; priorLineNumber--) {
            if (model.getLineContent(priorLineNumber) !== '') {
                break;
            }
            if (priorLineNumber === 1) {
                return {
                    indentation: '',
                    action: null
                };
            }
        }
        const precedingUnIgnoredLine = getPrecedingValidLine(model, lineNumber, indentRulesSupport);
        if (precedingUnIgnoredLine < 0) {
            return null;
        }
        else if (precedingUnIgnoredLine < 1) {
            return {
                indentation: '',
                action: null
            };
        }
        const precedingUnIgnoredLineContent = model.getLineContent(precedingUnIgnoredLine);
        if (indentRulesSupport.shouldIncrease(precedingUnIgnoredLineContent) || indentRulesSupport.shouldIndentNextLine(precedingUnIgnoredLineContent)) {
            return {
                indentation: strings.getLeadingWhitespace(precedingUnIgnoredLineContent),
                action: languageConfiguration_1.IndentAction.Indent,
                line: precedingUnIgnoredLine
            };
        }
        else if (indentRulesSupport.shouldDecrease(precedingUnIgnoredLineContent)) {
            return {
                indentation: strings.getLeadingWhitespace(precedingUnIgnoredLineContent),
                action: null,
                line: precedingUnIgnoredLine
            };
        }
        else {
            // precedingUnIgnoredLine can not be ignored.
            // it doesn't increase indent of following lines
            // it doesn't increase just next line
            // so current line is not affect by precedingUnIgnoredLine
            // and then we should get a correct inheritted indentation from above lines
            if (precedingUnIgnoredLine === 1) {
                return {
                    indentation: strings.getLeadingWhitespace(model.getLineContent(precedingUnIgnoredLine)),
                    action: null,
                    line: precedingUnIgnoredLine
                };
            }
            const previousLine = precedingUnIgnoredLine - 1;
            const previousLineIndentMetadata = indentRulesSupport.getIndentMetadata(model.getLineContent(previousLine));
            if (!(previousLineIndentMetadata & (1 /* IndentConsts.INCREASE_MASK */ | 2 /* IndentConsts.DECREASE_MASK */)) &&
                (previousLineIndentMetadata & 4 /* IndentConsts.INDENT_NEXTLINE_MASK */)) {
                let stopLine = 0;
                for (let i = previousLine - 1; i > 0; i--) {
                    if (indentRulesSupport.shouldIndentNextLine(model.getLineContent(i))) {
                        continue;
                    }
                    stopLine = i;
                    break;
                }
                return {
                    indentation: strings.getLeadingWhitespace(model.getLineContent(stopLine + 1)),
                    action: null,
                    line: stopLine + 1
                };
            }
            if (honorIntentialIndent) {
                return {
                    indentation: strings.getLeadingWhitespace(model.getLineContent(precedingUnIgnoredLine)),
                    action: null,
                    line: precedingUnIgnoredLine
                };
            }
            else {
                // search from precedingUnIgnoredLine until we find one whose indent is not temporary
                for (let i = precedingUnIgnoredLine; i > 0; i--) {
                    const lineContent = model.getLineContent(i);
                    if (indentRulesSupport.shouldIncrease(lineContent)) {
                        return {
                            indentation: strings.getLeadingWhitespace(lineContent),
                            action: languageConfiguration_1.IndentAction.Indent,
                            line: i
                        };
                    }
                    else if (indentRulesSupport.shouldIndentNextLine(lineContent)) {
                        let stopLine = 0;
                        for (let j = i - 1; j > 0; j--) {
                            if (indentRulesSupport.shouldIndentNextLine(model.getLineContent(i))) {
                                continue;
                            }
                            stopLine = j;
                            break;
                        }
                        return {
                            indentation: strings.getLeadingWhitespace(model.getLineContent(stopLine + 1)),
                            action: null,
                            line: stopLine + 1
                        };
                    }
                    else if (indentRulesSupport.shouldDecrease(lineContent)) {
                        return {
                            indentation: strings.getLeadingWhitespace(lineContent),
                            action: null,
                            line: i
                        };
                    }
                }
                return {
                    indentation: strings.getLeadingWhitespace(model.getLineContent(1)),
                    action: null,
                    line: 1
                };
            }
        }
    }
    function getGoodIndentForLine(autoIndent, virtualModel, languageId, lineNumber, indentConverter, languageConfigurationService) {
        if (autoIndent < 4 /* EditorAutoIndentStrategy.Full */) {
            return null;
        }
        const richEditSupport = languageConfigurationService.getLanguageConfiguration(languageId);
        if (!richEditSupport) {
            return null;
        }
        const indentRulesSupport = languageConfigurationService.getLanguageConfiguration(languageId).indentRulesSupport;
        if (!indentRulesSupport) {
            return null;
        }
        const indent = getInheritIndentForLine(autoIndent, virtualModel, lineNumber, undefined, languageConfigurationService);
        const lineContent = virtualModel.getLineContent(lineNumber);
        if (indent) {
            const inheritLine = indent.line;
            if (inheritLine !== undefined) {
                // Apply enter action as long as there are only whitespace lines between inherited line and this line.
                let shouldApplyEnterRules = true;
                for (let inBetweenLine = inheritLine; inBetweenLine < lineNumber - 1; inBetweenLine++) {
                    if (!/^\s*$/.test(virtualModel.getLineContent(inBetweenLine))) {
                        shouldApplyEnterRules = false;
                        break;
                    }
                }
                if (shouldApplyEnterRules) {
                    const enterResult = richEditSupport.onEnter(autoIndent, '', virtualModel.getLineContent(inheritLine), '');
                    if (enterResult) {
                        let indentation = strings.getLeadingWhitespace(virtualModel.getLineContent(inheritLine));
                        if (enterResult.removeText) {
                            indentation = indentation.substring(0, indentation.length - enterResult.removeText);
                        }
                        if ((enterResult.indentAction === languageConfiguration_1.IndentAction.Indent) ||
                            (enterResult.indentAction === languageConfiguration_1.IndentAction.IndentOutdent)) {
                            indentation = indentConverter.shiftIndent(indentation);
                        }
                        else if (enterResult.indentAction === languageConfiguration_1.IndentAction.Outdent) {
                            indentation = indentConverter.unshiftIndent(indentation);
                        }
                        if (indentRulesSupport.shouldDecrease(lineContent)) {
                            indentation = indentConverter.unshiftIndent(indentation);
                        }
                        if (enterResult.appendText) {
                            indentation += enterResult.appendText;
                        }
                        return strings.getLeadingWhitespace(indentation);
                    }
                }
            }
            if (indentRulesSupport.shouldDecrease(lineContent)) {
                if (indent.action === languageConfiguration_1.IndentAction.Indent) {
                    return indent.indentation;
                }
                else {
                    return indentConverter.unshiftIndent(indent.indentation);
                }
            }
            else {
                if (indent.action === languageConfiguration_1.IndentAction.Indent) {
                    return indentConverter.shiftIndent(indent.indentation);
                }
                else {
                    return indent.indentation;
                }
            }
        }
        return null;
    }
    function getIndentForEnter(autoIndent, model, range, indentConverter, languageConfigurationService) {
        if (autoIndent < 4 /* EditorAutoIndentStrategy.Full */) {
            return null;
        }
        model.tokenization.forceTokenization(range.startLineNumber);
        const lineTokens = model.tokenization.getLineTokens(range.startLineNumber);
        const scopedLineTokens = (0, supports_1.createScopedLineTokens)(lineTokens, range.startColumn - 1);
        const scopedLineText = scopedLineTokens.getLineContent();
        let embeddedLanguage = false;
        let beforeEnterText;
        if (scopedLineTokens.firstCharOffset > 0 && lineTokens.getLanguageId(0) !== scopedLineTokens.languageId) {
            // we are in the embeded language content
            embeddedLanguage = true; // if embeddedLanguage is true, then we don't touch the indentation of current line
            beforeEnterText = scopedLineText.substr(0, range.startColumn - 1 - scopedLineTokens.firstCharOffset);
        }
        else {
            beforeEnterText = lineTokens.getLineContent().substring(0, range.startColumn - 1);
        }
        let afterEnterText;
        if (range.isEmpty()) {
            afterEnterText = scopedLineText.substr(range.startColumn - 1 - scopedLineTokens.firstCharOffset);
        }
        else {
            const endScopedLineTokens = (0, languageConfigurationRegistry_1.getScopedLineTokens)(model, range.endLineNumber, range.endColumn);
            afterEnterText = endScopedLineTokens.getLineContent().substr(range.endColumn - 1 - scopedLineTokens.firstCharOffset);
        }
        const indentRulesSupport = languageConfigurationService.getLanguageConfiguration(scopedLineTokens.languageId).indentRulesSupport;
        if (!indentRulesSupport) {
            return null;
        }
        const beforeEnterResult = beforeEnterText;
        const beforeEnterIndent = strings.getLeadingWhitespace(beforeEnterText);
        const virtualModel = {
            tokenization: {
                getLineTokens: (lineNumber) => {
                    return model.tokenization.getLineTokens(lineNumber);
                },
                getLanguageId: () => {
                    return model.getLanguageId();
                },
                getLanguageIdAtPosition: (lineNumber, column) => {
                    return model.getLanguageIdAtPosition(lineNumber, column);
                },
            },
            getLineContent: (lineNumber) => {
                if (lineNumber === range.startLineNumber) {
                    return beforeEnterResult;
                }
                else {
                    return model.getLineContent(lineNumber);
                }
            }
        };
        const currentLineIndent = strings.getLeadingWhitespace(lineTokens.getLineContent());
        const afterEnterAction = getInheritIndentForLine(autoIndent, virtualModel, range.startLineNumber + 1, undefined, languageConfigurationService);
        if (!afterEnterAction) {
            const beforeEnter = embeddedLanguage ? currentLineIndent : beforeEnterIndent;
            return {
                beforeEnter: beforeEnter,
                afterEnter: beforeEnter
            };
        }
        let afterEnterIndent = embeddedLanguage ? currentLineIndent : afterEnterAction.indentation;
        if (afterEnterAction.action === languageConfiguration_1.IndentAction.Indent) {
            afterEnterIndent = indentConverter.shiftIndent(afterEnterIndent);
        }
        if (indentRulesSupport.shouldDecrease(afterEnterText)) {
            afterEnterIndent = indentConverter.unshiftIndent(afterEnterIndent);
        }
        return {
            beforeEnter: embeddedLanguage ? currentLineIndent : beforeEnterIndent,
            afterEnter: afterEnterIndent
        };
    }
    /**
     * We should always allow intentional indentation. It means, if users change the indentation of `lineNumber` and the content of
     * this line doesn't match decreaseIndentPattern, we should not adjust the indentation.
     */
    function getIndentActionForType(autoIndent, model, range, ch, indentConverter, languageConfigurationService) {
        if (autoIndent < 4 /* EditorAutoIndentStrategy.Full */) {
            return null;
        }
        const scopedLineTokens = (0, languageConfigurationRegistry_1.getScopedLineTokens)(model, range.startLineNumber, range.startColumn);
        if (scopedLineTokens.firstCharOffset) {
            // this line has mixed languages and indentation rules will not work
            return null;
        }
        const indentRulesSupport = languageConfigurationService.getLanguageConfiguration(scopedLineTokens.languageId).indentRulesSupport;
        if (!indentRulesSupport) {
            return null;
        }
        const scopedLineText = scopedLineTokens.getLineContent();
        const beforeTypeText = scopedLineText.substr(0, range.startColumn - 1 - scopedLineTokens.firstCharOffset);
        // selection support
        let afterTypeText;
        if (range.isEmpty()) {
            afterTypeText = scopedLineText.substr(range.startColumn - 1 - scopedLineTokens.firstCharOffset);
        }
        else {
            const endScopedLineTokens = (0, languageConfigurationRegistry_1.getScopedLineTokens)(model, range.endLineNumber, range.endColumn);
            afterTypeText = endScopedLineTokens.getLineContent().substr(range.endColumn - 1 - scopedLineTokens.firstCharOffset);
        }
        // If previous content already matches decreaseIndentPattern, it means indentation of this line should already be adjusted
        // Users might change the indentation by purpose and we should honor that instead of readjusting.
        if (!indentRulesSupport.shouldDecrease(beforeTypeText + afterTypeText) && indentRulesSupport.shouldDecrease(beforeTypeText + ch + afterTypeText)) {
            // after typing `ch`, the content matches decreaseIndentPattern, we should adjust the indent to a good manner.
            // 1. Get inherited indent action
            const r = getInheritIndentForLine(autoIndent, model, range.startLineNumber, false, languageConfigurationService);
            if (!r) {
                return null;
            }
            let indentation = r.indentation;
            if (r.action !== languageConfiguration_1.IndentAction.Indent) {
                indentation = indentConverter.unshiftIndent(indentation);
            }
            return indentation;
        }
        return null;
    }
    function getIndentMetadata(model, lineNumber, languageConfigurationService) {
        const indentRulesSupport = languageConfigurationService.getLanguageConfiguration(model.getLanguageId()).indentRulesSupport;
        if (!indentRulesSupport) {
            return null;
        }
        if (lineNumber < 1 || lineNumber > model.getLineCount()) {
            return null;
        }
        return indentRulesSupport.getIndentMetadata(model.getLineContent(lineNumber));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b0luZGVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9sYW5ndWFnZXMvYXV0b0luZGVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFFaEcsMERBNklDO0lBRUQsb0RBbUZDO0lBRUQsOENBc0ZDO0lBTUQsd0RBc0RDO0lBRUQsOENBYUM7SUEvYUQ7Ozs7OztPQU1HO0lBQ0gsU0FBUyxxQkFBcUIsQ0FBQyxLQUFvQixFQUFFLFVBQWtCLEVBQUUsa0JBQXNDO1FBQzlHLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsdUJBQXVCLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdFLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3BCLElBQUksY0FBc0IsQ0FBQztZQUMzQixJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRTFCLEtBQUssY0FBYyxHQUFHLFVBQVUsR0FBRyxDQUFDLEVBQUUsY0FBYyxJQUFJLENBQUMsRUFBRSxjQUFjLEVBQUUsRUFBRSxDQUFDO2dCQUM3RSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsdUJBQXVCLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxLQUFLLFVBQVUsRUFBRSxDQUFDO29CQUNsRixPQUFPLGdCQUFnQixDQUFDO2dCQUN6QixDQUFDO2dCQUNELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ2xELElBQUksa0JBQWtCLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRSxDQUFDO29CQUNoRixnQkFBZ0IsR0FBRyxjQUFjLENBQUM7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