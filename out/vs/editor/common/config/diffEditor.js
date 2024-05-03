/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.diffEditorDefaultOptions = void 0;
    exports.diffEditorDefaultOptions = {
        enableSplitViewResizing: true,
        splitViewDefaultRatio: 0.5,
        renderSideBySide: true,
        renderMarginRevertIcon: true,
        renderGutterMenu: true,
        maxComputationTime: 5000,
        maxFileSize: 50,
        ignoreTrimWhitespace: true,
        renderIndicators: true,
        originalEditable: false,
        diffCodeLens: false,
        renderOverviewRuler: true,
        diffWordWrap: 'inherit',
        diffAlgorithm: 'advanced',
        accessibilityVerbose: false,
        experimental: {
            showMoves: false,
            showEmptyDecorations: true,
        },
        hideUnchangedRegions: {
            enabled: false,
            contextLineCount: 3,
            minimumLineCount: 3,
            revealLineCount: 20,
        },
        isInEmbeddedEditor: false,
        onlyShowAccessibleDiffViewer: false,
        renderSideBySideInlineBreakpoint: 900,
        useInlineViewWhenSpaceIsLimited: true,
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb25maWcvZGlmZkVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJbkYsUUFBQSx3QkFBd0IsR0FBRztRQUN2Qyx1QkFBdUIsRUFBRSxJQUFJO1FBQzdCLHFCQUFxQixFQUFFLEdBQUc7UUFDMUIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixzQkFBc0IsRUFBRSxJQUFJO1FBQzVCLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixXQUFXLEVBQUUsRUFBRTtRQUNmLG9CQUFvQixFQUFFLElBQUk7UUFDMUIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixnQkFBZ0IsRUFBRSxLQUFLO1FBQ3ZCLFlBQVksRUFBRSxLQUFLO1FBQ25CLG1CQUFtQixFQUFFLElBQUk7UUFDekIsWUFBWSxFQUFFLFNBQVM7UUFDdkIsYUFBYSxFQUFFLFVBQVU7UUFDekIsb0JBQW9CLEVBQUUsS0FBSztRQUMzQixZQUFZLEVBQUU7WUFDYixTQUFTLEVBQUUsS0FBSztZQUNoQixvQkFBb0IsRUFBRSxJQUFJO1NBQzFCO1FBQ0Qsb0JBQW9CLEVBQUU7WUFDckIsT0FBTyxFQUFFLEtBQUs7WUFDZCxnQkFBZ0IsRUFBRSxDQUFDO1lBQ25CLGdCQUFnQixFQUFFLENBQUM7WUFDbkIsZUFBZSxFQUFFLEVBQUU7U0FDbkI7UUFDRCxrQkFBa0IsRUFBRSxLQUFLO1FBQ3pCLDRCQUE0QixFQUFFLEtBQUs7UUFDbkMsZ0NBQWdDLEVBQUUsR0FBRztRQUNyQywrQkFBK0IsRUFBRSxJQUFJO0tBQ0EsQ0FBQyJ9