/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languages/languageConfiguration"], function (require, exports, languageConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cppOnEnterRules = exports.phpOnEnterRules = exports.javascriptOnEnterRules = void 0;
    exports.javascriptOnEnterRules = [
        {
            // e.g. /** | */
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            afterText: /^\s*\*\/$/,
            action: { indentAction: languageConfiguration_1.IndentAction.IndentOutdent, appendText: ' * ' }
        }, {
            // e.g. /** ...|
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.None, appendText: ' * ' }
        }, {
            // e.g.  * ...|
            beforeText: /^(\t|[ ])*[ ]\*([ ]([^\*]|\*(?!\/))*)?$/,
            previousLineText: /(?=^(\s*(\/\*\*|\*)).*)(?=(?!(\s*\*\/)))/,
            action: { indentAction: languageConfiguration_1.IndentAction.None, appendText: '* ' }
        }, {
            // e.g.  */|
            beforeText: /^(\t|[ ])*[ ]\*\/\s*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.None, removeText: 1 }
        },
        {
            // e.g.  *-----*/|
            beforeText: /^(\t|[ ])*[ ]\*[^/]*\*\/\s*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.None, removeText: 1 }
        },
        {
            beforeText: /^\s*(\bcase\s.+:|\bdefault:)$/,
            afterText: /^(?!\s*(\bcase\b|\bdefault\b))/,
            action: { indentAction: languageConfiguration_1.IndentAction.Indent }
        },
        {
            previousLineText: /^\s*(((else ?)?if|for|while)\s*\(.*\)\s*|else\s*)$/,
            beforeText: /^\s+([^{i\s]|i(?!f\b))/,
            action: { indentAction: languageConfiguration_1.IndentAction.Outdent }
        },
        // Indent when pressing enter from inside ()
        {
            beforeText: /^.*\([^\)]*$/,
            afterText: /^\s*\).*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.IndentOutdent, appendText: '\t' }
        },
        // Indent when pressing enter from inside {}
        {
            beforeText: /^.*\{[^\}]*$/,
            afterText: /^\s*\}.*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.IndentOutdent, appendText: '\t' }
        },
        // Indent when pressing enter from inside []
        {
            beforeText: /^.*\[[^\]]*$/,
            afterText: /^\s*\].*$/,
            action: { indentAction: languageConfiguration_1.IndentAction.IndentOutdent, appendText: '\t' }
        },
    ];
    exports.phpOnEnterRules = [
        {
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            afterText: /^\s*\*\/$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.IndentOutdent,
                appendText: ' * ',
            }
        },
        {
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.None,
                appendText: ' * ',
            }
        },
        {
            beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.None,
                appendText: '* ',
            }
        },
        {
            beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.None,
                removeText: 1,
            }
        },
        {
            beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.None,
                removeText: 1,
            }
        },
        {
            beforeText: /^\s+([^{i\s]|i(?!f\b))/,
            previousLineText: /^\s*(((else ?)?if|for(each)?|while)\s*\(.*\)\s*|else\s*)$/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.Outdent
            }
        },
    ];
    exports.cppOnEnterRules = [
        {
            previousLineText: /^\s*(((else ?)?if|for|while)\s*\(.*\)\s*|else\s*)$/,
            beforeText: /^\s+([^{i\s]|i(?!f\b))/,
            action: {
                indentAction: languageConfiguration_1.IndentAction.Outdent
            }
        }
    ];
});
/*
export enum IndentAction {
    None = 0,
    Indent = 1,
    IndentOutdent = 2,
    Outdent = 3
}
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25FbnRlclJ1bGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZXMvc3VwcG9ydHMvb25FbnRlclJ1bGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUluRixRQUFBLHNCQUFzQixHQUFHO1FBQ3JDO1lBQ0MsZ0JBQWdCO1lBQ2hCLFVBQVUsRUFBRSxvQ0FBb0M7WUFDaEQsU0FBUyxFQUFFLFdBQVc7WUFDdEIsTUFBTSxFQUFFLEVBQUUsWUFBWSxFQUFFLG9DQUFZLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUU7U0FDdkUsRUFBRTtZQUNGLGdCQUFnQjtZQUNoQixVQUFVLEVBQUUsb0NBQW9DO1lBQ2hELE1BQU0sRUFBRSxFQUFFLFlBQVksRUFBRSxvQ0FBWSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO1NBQzlELEVBQUU7WUFDRixlQUFlO1lBQ2YsVUFBVSxFQUFFLHlDQUF5QztZQUNyRCxnQkFBZ0IsRUFBRSwwQ0FBMEM7WUFDNUQsTUFBTSxFQUFFLEVBQUUsWUFBWSxFQUFFLG9DQUFZLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7U0FDN0QsRUFBRTtZQUNGLFlBQVk7WUFDWixVQUFVLEVBQUUsdUJBQXVCO1lBQ25DLE1BQU0sRUFBRSxFQUFFLFlBQVksRUFBRSxvQ0FBWSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFO1NBQzFEO1FBQ0Q7WUFDQyxrQkFBa0I7WUFDbEIsVUFBVSxFQUFFLDhCQUE4QjtZQUMxQyxNQUFNLEVBQUUsRUFBRSxZQUFZLEVBQUUsb0NBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRTtTQUMxRDtRQUNEO1lBQ0MsVUFBVSxFQUFFLCtCQUErQjtZQUMzQyxTQUFTLEVBQUUsZ0NBQWdDO1lBQzNDLE1BQU0sRUFBRSxFQUFFLFlBQVksRUFBRSxvQ0FBWSxDQUFDLE1BQU0sRUFBRTtTQUM3QztRQUNEO1lBQ0MsZ0JBQWdCLEVBQUUsb0RBQW9EO1lBQ3RFLFVBQVUsRUFBRSx3QkFBd0I7WUFDcEMsTUFBTSxFQUFFLEVBQUUsWUFBWSxFQUFFLG9DQUFZLENBQUMsT0FBTyxFQUFFO1NBQzlDO1FBQ0QsNENBQTRDO1FBQzVDO1lBQ0MsVUFBVSxFQUFFLGNBQWM7WUFDMUIsU0FBUyxFQUFFLFdBQVc7WUFDdEIsTUFBTSxFQUFFLEVBQUUsWUFBWSxFQUFFLG9DQUFZLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7U0FDdEU7UUFDRCw0Q0FBNEM7UUFDNUM7WUFDQyxVQUFVLEVBQUUsY0FBYztZQUMxQixTQUFTLEVBQUUsV0FBVztZQUN0QixNQUFNLEVBQUUsRUFBRSxZQUFZLEVBQUUsb0NBQVksQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTtTQUN0RTtRQUNELDRDQUE0QztRQUM1QztZQUNDLFVBQVUsRUFBRSxjQUFjO1lBQzFCLFNBQVMsRUFBRSxXQUFXO1lBQ3RCLE1BQU0sRUFBRSxFQUFFLFlBQVksRUFBRSxvQ0FBWSxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFO1NBQ3RFO0tBQ0QsQ0FBQztJQUVXLFFBQUEsZUFBZSxHQUFHO1FBQzlCO1lBQ0MsVUFBVSxFQUFFLG9DQUFvQztZQUNoRCxTQUFTLEVBQUUsV0FBVztZQUN0QixNQUFNLEVBQUU7Z0JBQ1AsWUFBWSxFQUFFLG9DQUFZLENBQUMsYUFBYTtnQkFDeEMsVUFBVSxFQUFFLEtBQUs7YUFDakI7U0FDRDtRQUNEO1lBQ0MsVUFBVSxFQUFFLG9DQUFvQztZQUNoRCxNQUFNLEVBQUU7Z0JBQ1AsWUFBWSxFQUFFLG9DQUFZLENBQUMsSUFBSTtnQkFDL0IsVUFBVSxFQUFFLEtBQUs7YUFDakI7U0FDRDtRQUNEO1lBQ0MsVUFBVSxFQUFFLDBDQUEwQztZQUN0RCxNQUFNLEVBQUU7Z0JBQ1AsWUFBWSxFQUFFLG9DQUFZLENBQUMsSUFBSTtnQkFDL0IsVUFBVSxFQUFFLElBQUk7YUFDaEI7U0FDRDtRQUNEO1lBQ0MsVUFBVSxFQUFFLHlCQUF5QjtZQUNyQyxNQUFNLEVBQUU7Z0JBQ1AsWUFBWSxFQUFFLG9DQUFZLENBQUMsSUFBSTtnQkFDL0IsVUFBVSxFQUFFLENBQUM7YUFDYjtTQUNEO1FBQ0Q7WUFDQyxVQUFVLEVBQUUsZ0NBQWdDO1lBQzVDLE1BQU0sRUFBRTtnQkFDUCxZQUFZLEVBQUUsb0NBQVksQ0FBQyxJQUFJO2dCQUMvQixVQUFVLEVBQUUsQ0FBQzthQUNiO1NBQ0Q7UUFDRDtZQUNDLFVBQVUsRUFBRSx3QkFBd0I7WUFDcEMsZ0JBQWdCLEVBQUUsMkRBQTJEO1lBQzdFLE1BQU0sRUFBRTtnQkFDUCxZQUFZLEVBQUUsb0NBQVksQ0FBQyxPQUFPO2FBQ2xDO1NBQ0Q7S0FDRCxDQUFDO0lBRVcsUUFBQSxlQUFlLEdBQUc7UUFDOUI7WUFDQyxnQkFBZ0IsRUFBRSxvREFBb0Q7WUFDdEUsVUFBVSxFQUFFLHdCQUF3QjtZQUNwQyxNQUFNLEVBQUU7Z0JBQ1AsWUFBWSxFQUFFLG9DQUFZLENBQUMsT0FBTzthQUNsQztTQUNEO0tBQ0QsQ0FBQzs7QUFFRjs7Ozs7OztFQU9FIn0=