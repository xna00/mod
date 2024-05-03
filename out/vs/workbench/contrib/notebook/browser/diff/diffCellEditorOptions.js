/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fixedDiffEditorOptions = exports.fixedEditorOptions = exports.fixedEditorPadding = void 0;
    exports.fixedEditorPadding = {
        top: 12,
        bottom: 12
    };
    exports.fixedEditorOptions = {
        padding: exports.fixedEditorPadding,
        scrollBeyondLastLine: false,
        scrollbar: {
            verticalScrollbarSize: 14,
            horizontal: 'auto',
            vertical: 'auto',
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            alwaysConsumeMouseWheel: false,
        },
        renderLineHighlightOnlyWhenFocus: true,
        overviewRulerLanes: 0,
        overviewRulerBorder: false,
        selectOnLineNumbers: false,
        wordWrap: 'off',
        lineNumbers: 'off',
        lineDecorationsWidth: 0,
        glyphMargin: false,
        fixedOverflowWidgets: true,
        minimap: { enabled: false },
        renderValidationDecorations: 'on',
        renderLineHighlight: 'none',
        readOnly: true
    };
    exports.fixedDiffEditorOptions = {
        ...exports.fixedEditorOptions,
        glyphMargin: true,
        enableSplitViewResizing: false,
        renderIndicators: true,
        renderMarginRevertIcon: false,
        readOnly: false,
        isInEmbeddedEditor: true,
        renderOverviewRuler: false,
        wordWrap: 'off',
        diffWordWrap: 'off',
        diffAlgorithm: 'advanced',
        renderSideBySide: true,
        useInlineViewWhenSpaceIsLimited: false
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkNlbGxFZGl0b3JPcHRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2RpZmYvZGlmZkNlbGxFZGl0b3JPcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtuRixRQUFBLGtCQUFrQixHQUFHO1FBQ2pDLEdBQUcsRUFBRSxFQUFFO1FBQ1AsTUFBTSxFQUFFLEVBQUU7S0FDVixDQUFDO0lBRVcsUUFBQSxrQkFBa0IsR0FBbUI7UUFDakQsT0FBTyxFQUFFLDBCQUFrQjtRQUMzQixvQkFBb0IsRUFBRSxLQUFLO1FBQzNCLFNBQVMsRUFBRTtZQUNWLHFCQUFxQixFQUFFLEVBQUU7WUFDekIsVUFBVSxFQUFFLE1BQU07WUFDbEIsUUFBUSxFQUFFLE1BQU07WUFDaEIsVUFBVSxFQUFFLElBQUk7WUFDaEIsaUJBQWlCLEVBQUUsS0FBSztZQUN4QixtQkFBbUIsRUFBRSxLQUFLO1lBQzFCLHVCQUF1QixFQUFFLEtBQUs7U0FDOUI7UUFDRCxnQ0FBZ0MsRUFBRSxJQUFJO1FBQ3RDLGtCQUFrQixFQUFFLENBQUM7UUFDckIsbUJBQW1CLEVBQUUsS0FBSztRQUMxQixtQkFBbUIsRUFBRSxLQUFLO1FBQzFCLFFBQVEsRUFBRSxLQUFLO1FBQ2YsV0FBVyxFQUFFLEtBQUs7UUFDbEIsb0JBQW9CLEVBQUUsQ0FBQztRQUN2QixXQUFXLEVBQUUsS0FBSztRQUNsQixvQkFBb0IsRUFBRSxJQUFJO1FBQzFCLE9BQU8sRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUU7UUFDM0IsMkJBQTJCLEVBQUUsSUFBSTtRQUNqQyxtQkFBbUIsRUFBRSxNQUFNO1FBQzNCLFFBQVEsRUFBRSxJQUFJO0tBQ2QsQ0FBQztJQUVXLFFBQUEsc0JBQXNCLEdBQW1DO1FBQ3JFLEdBQUcsMEJBQWtCO1FBQ3JCLFdBQVcsRUFBRSxJQUFJO1FBQ2pCLHVCQUF1QixFQUFFLEtBQUs7UUFDOUIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixzQkFBc0IsRUFBRSxLQUFLO1FBQzdCLFFBQVEsRUFBRSxLQUFLO1FBQ2Ysa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixtQkFBbUIsRUFBRSxLQUFLO1FBQzFCLFFBQVEsRUFBRSxLQUFLO1FBQ2YsWUFBWSxFQUFFLEtBQUs7UUFDbkIsYUFBYSxFQUFFLFVBQVU7UUFDekIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QiwrQkFBK0IsRUFBRSxLQUFLO0tBQ3RDLENBQUMifQ==