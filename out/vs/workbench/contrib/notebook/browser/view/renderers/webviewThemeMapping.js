/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.transformWebviewThemeVars = void 0;
    const mapping = new Map([
        ['theme-font-family', 'vscode-font-family'],
        ['theme-font-weight', 'vscode-font-weight'],
        ['theme-font-size', 'vscode-font-size'],
        ['theme-code-font-family', 'vscode-editor-font-family'],
        ['theme-code-font-weight', 'vscode-editor-font-weight'],
        ['theme-code-font-size', 'vscode-editor-font-size'],
        ['theme-scrollbar-background', 'vscode-scrollbarSlider-background'],
        ['theme-scrollbar-hover-background', 'vscode-scrollbarSlider-hoverBackground'],
        ['theme-scrollbar-active-background', 'vscode-scrollbarSlider-activeBackground'],
        ['theme-quote-background', 'vscode-textBlockQuote-background'],
        ['theme-quote-border', 'vscode-textBlockQuote-border'],
        ['theme-code-foreground', 'vscode-textPreformat-foreground'],
        // Editor
        ['theme-background', 'vscode-editor-background'],
        ['theme-foreground', 'vscode-editor-foreground'],
        ['theme-ui-foreground', 'vscode-foreground'],
        ['theme-link', 'vscode-textLink-foreground'],
        ['theme-link-active', 'vscode-textLink-activeForeground'],
        // Buttons
        ['theme-button-background', 'vscode-button-background'],
        ['theme-button-hover-background', 'vscode-button-hoverBackground'],
        ['theme-button-foreground', 'vscode-button-foreground'],
        ['theme-button-secondary-background', 'vscode-button-secondaryBackground'],
        ['theme-button-secondary-hover-background', 'vscode-button-secondaryHoverBackground'],
        ['theme-button-secondary-foreground', 'vscode-button-secondaryForeground'],
        ['theme-button-hover-foreground', 'vscode-button-foreground'],
        ['theme-button-focus-foreground', 'vscode-button-foreground'],
        ['theme-button-secondary-hover-foreground', 'vscode-button-secondaryForeground'],
        ['theme-button-secondary-focus-foreground', 'vscode-button-secondaryForeground'],
        // Inputs
        ['theme-input-background', 'vscode-input-background'],
        ['theme-input-foreground', 'vscode-input-foreground'],
        ['theme-input-placeholder-foreground', 'vscode-input-placeholderForeground'],
        ['theme-input-focus-border-color', 'vscode-focusBorder'],
        // Menus
        ['theme-menu-background', 'vscode-menu-background'],
        ['theme-menu-foreground', 'vscode-menu-foreground'],
        ['theme-menu-hover-background', 'vscode-menu-selectionBackground'],
        ['theme-menu-focus-background', 'vscode-menu-selectionBackground'],
        ['theme-menu-hover-foreground', 'vscode-menu-selectionForeground'],
        ['theme-menu-focus-foreground', 'vscode-menu-selectionForeground'],
        // Errors
        ['theme-error-background', 'vscode-inputValidation-errorBackground'],
        ['theme-error-foreground', 'vscode-foreground'],
        ['theme-warning-background', 'vscode-inputValidation-warningBackground'],
        ['theme-warning-foreground', 'vscode-foreground'],
        ['theme-info-background', 'vscode-inputValidation-infoBackground'],
        ['theme-info-foreground', 'vscode-foreground'],
        // Notebook:
        ['theme-notebook-output-background', 'vscode-notebook-outputContainerBackgroundColor'],
        ['theme-notebook-output-border', 'vscode-notebook-outputContainerBorderColor'],
        ['theme-notebook-cell-selected-background', 'vscode-notebook-selectedCellBackground'],
        ['theme-notebook-symbol-highlight-background', 'vscode-notebook-symbolHighlightBackground'],
        ['theme-notebook-diff-removed-background', 'vscode-diffEditor-removedTextBackground'],
        ['theme-notebook-diff-inserted-background', 'vscode-diffEditor-insertedTextBackground'],
    ]);
    const constants = {
        'theme-input-border-width': '1px',
        'theme-button-primary-hover-shadow': 'none',
        'theme-button-secondary-hover-shadow': 'none',
        'theme-input-border-color': 'transparent',
    };
    /**
     * Transforms base vscode theme variables into generic variables for notebook
     * renderers.
     * @see https://github.com/microsoft/vscode/issues/107985 for context
     * @deprecated
     */
    const transformWebviewThemeVars = (s) => {
        const result = { ...s, ...constants };
        for (const [target, src] of mapping) {
            result[target] = s[src];
        }
        return result;
    };
    exports.transformWebviewThemeVars = transformWebviewThemeVars;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1RoZW1lTWFwcGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L3JlbmRlcmVycy93ZWJ2aWV3VGhlbWVNYXBwaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRyxNQUFNLE9BQU8sR0FBZ0MsSUFBSSxHQUFHLENBQUM7UUFDcEQsQ0FBQyxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQztRQUMzQyxDQUFDLG1CQUFtQixFQUFFLG9CQUFvQixDQUFDO1FBQzNDLENBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLENBQUM7UUFDdkMsQ0FBQyx3QkFBd0IsRUFBRSwyQkFBMkIsQ0FBQztRQUN2RCxDQUFDLHdCQUF3QixFQUFFLDJCQUEyQixDQUFDO1FBQ3ZELENBQUMsc0JBQXNCLEVBQUUseUJBQXlCLENBQUM7UUFDbkQsQ0FBQyw0QkFBNEIsRUFBRSxtQ0FBbUMsQ0FBQztRQUNuRSxDQUFDLGtDQUFrQyxFQUFFLHdDQUF3QyxDQUFDO1FBQzlFLENBQUMsbUNBQW1DLEVBQUUseUNBQXlDLENBQUM7UUFDaEYsQ0FBQyx3QkFBd0IsRUFBRSxrQ0FBa0MsQ0FBQztRQUM5RCxDQUFDLG9CQUFvQixFQUFFLDhCQUE4QixDQUFDO1FBQ3RELENBQUMsdUJBQXVCLEVBQUUsaUNBQWlDLENBQUM7UUFDNUQsU0FBUztRQUNULENBQUMsa0JBQWtCLEVBQUUsMEJBQTBCLENBQUM7UUFDaEQsQ0FBQyxrQkFBa0IsRUFBRSwwQkFBMEIsQ0FBQztRQUNoRCxDQUFDLHFCQUFxQixFQUFFLG1CQUFtQixDQUFDO1FBQzVDLENBQUMsWUFBWSxFQUFFLDRCQUE0QixDQUFDO1FBQzVDLENBQUMsbUJBQW1CLEVBQUUsa0NBQWtDLENBQUM7UUFDekQsVUFBVTtR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