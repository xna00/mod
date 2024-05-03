/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/languageConfigurationRegistry"], function (require, exports, languageConfiguration_1, languageConfigurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getEnterAction = getEnterAction;
    function getEnterAction(autoIndent, model, range, languageConfigurationService) {
        const scopedLineTokens = (0, languageConfigurationRegistry_1.getScopedLineTokens)(model, range.startLineNumber, range.startColumn);
        const richEditSupport = languageConfigurationService.getLanguageConfiguration(scopedLineTokens.languageId);
        if (!richEditSupport) {
            return null;
        }
        const scopedLineText = scopedLineTokens.getLineContent();
        const beforeEnterText = scopedLineText.substr(0, range.startColumn - 1 - scopedLineTokens.firstCharOffset);
        // selection support
        let afterEnterText;
        if (range.isEmpty()) {
            afterEnterText = scopedLineText.substr(range.startColumn - 1 - scopedLineTokens.firstCharOffset);
        }
        else {
            const endScopedLineTokens = (0, languageConfigurationRegistry_1.getScopedLineTokens)(model, range.endLineNumber, range.endColumn);
            afterEnterText = endScopedLineTokens.getLineContent().substr(range.endColumn - 1 - scopedLineTokens.firstCharOffset);
        }
        let previousLineText = '';
        if (range.startLineNumber > 1 && scopedLineTokens.firstCharOffset === 0) {
            // This is not the first line and the entire line belongs to this mode
            const oneLineAboveScopedLineTokens = (0, languageConfigurationRegistry_1.getScopedLineTokens)(model, range.startLineNumber - 1);
            if (oneLineAboveScopedLineTokens.languageId === scopedLineTokens.languageId) {
                // The line above ends with text belonging to the same mode
                previousLineText = oneLineAboveScopedLineTokens.getLineContent();
            }
        }
        const enterResult = richEditSupport.onEnter(autoIndent, previousLineText, beforeEnterText, afterEnterText);
        if (!enterResult) {
            return null;
        }
        const indentAction = enterResult.indentAction;
        let appendText = enterResult.appendText;
        const removeText = enterResult.removeText || 0;
        // Here we add `\t` to appendText first because enterAction is leveraging appendText and removeText to change indentation.
        if (!appendText) {
            if ((indentAction === languageConfiguration_1.IndentAction.Indent) ||
                (indentAction === languageConfiguration_1.IndentAction.IndentOutdent)) {
                appendText = '\t';
            }
            else {
                appendText = '';
            }
        }
        else if (indentAction === languageConfiguration_1.IndentAction.Indent) {
            appendText = '\t' + appendText;
        }
        let indentation = (0, languageConfigurationRegistry_1.getIndentationAtPosition)(model, range.startLineNumber, range.startColumn);
        if (removeText) {
            indentation = indentation.substring(0, indentation.length - removeText);
        }
        return {
            indentAction: indentAction,
            appendText: appendText,
            removeText: removeText,
            indentation: indentation
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50ZXJBY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VzL2VudGVyQWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLHdDQW9FQztJQXBFRCxTQUFnQixjQUFjLENBQzdCLFVBQW9DLEVBQ3BDLEtBQWlCLEVBQ2pCLEtBQVksRUFDWiw0QkFBMkQ7UUFFM0QsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLG1EQUFtQixFQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5RixNQUFNLGVBQWUsR0FBRyw0QkFBNEIsQ0FBQyx3QkFBd0IsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDdEIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsTUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDekQsTUFBTSxlQUFlLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFdBQVcsR0FBRyxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFM0csb0JBQW9CO1FBQ3BCLElBQUksY0FBc0IsQ0FBQztRQUMzQixJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1lBQ3JCLGNBQWMsR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2xHLENBQUM7YUFBTSxDQUFDO1lBQ1AsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLG1EQUFtQixFQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM3RixjQUFjLEdBQUcsbUJBQW1CLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3RILENBQUM7UUFFRCxJQUFJLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztRQUMxQixJQUFJLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLGVBQWUsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN6RSxzRUFBc0U7WUFDdEUsTUFBTSw0QkFBNEIsR0FBRyxJQUFBLG1EQUFtQixFQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzNGLElBQUksNEJBQTRCLENBQUMsVUFBVSxLQUFLLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUM3RSwyREFBMkQ7Z0JBQzNELGdCQUFnQixHQUFHLDRCQUE0QixDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ2xFLENBQUM7UUFDRixDQUFDO1FBRUQsTUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQzNHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNsQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDO1FBQzlDLElBQUksVUFBVSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUM7UUFDeEMsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUM7UUFFL0MsMEhBQTBIO1FBQzFILElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNqQixJQUNDLENBQUMsWUFBWSxLQUFLLG9DQUFZLENBQUMsTUFBTSxDQUFDO2dCQUN0QyxDQUFDLFlBQVksS0FBSyxvQ0FBWSxDQUFDLGFBQWEsQ0FBQyxFQUM1QyxDQUFDO2dCQUNGLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDbkIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDakIsQ0FBQztRQUNGLENBQUM7YUFBTSxJQUFJLFlBQVksS0FBSyxvQ0FBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2pELFVBQVUsR0FBRyxJQUFJLEdBQUcsVUFBVSxDQUFDO1FBQ2hDLENBQUM7UUFFRCxJQUFJLFdBQVcsR0FBRyxJQUFBLHdEQUF3QixFQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM1RixJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLFdBQVcsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFRCxPQUFPO1lBQ04sWUFBWSxFQUFFLFlBQVk7WUFDMUIsVUFBVSxFQUFFLFVBQVU7WUFDdEIsVUFBVSxFQUFFLFVBQVU7WUFDdEIsV0FBVyxFQUFFLFdBQVc7U0FDeEIsQ0FBQztJQUNILENBQUMifQ==