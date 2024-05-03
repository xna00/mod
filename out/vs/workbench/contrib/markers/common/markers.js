/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkersContextKeys = exports.Markers = exports.MarkersViewMode = void 0;
    var MarkersViewMode;
    (function (MarkersViewMode) {
        MarkersViewMode["Table"] = "table";
        MarkersViewMode["Tree"] = "tree";
    })(MarkersViewMode || (exports.MarkersViewMode = MarkersViewMode = {}));
    var Markers;
    (function (Markers) {
        Markers.MARKERS_CONTAINER_ID = 'workbench.panel.markers';
        Markers.MARKERS_VIEW_ID = 'workbench.panel.markers.view';
        Markers.MARKERS_VIEW_STORAGE_ID = 'workbench.panel.markers';
        Markers.MARKER_COPY_ACTION_ID = 'problems.action.copy';
        Markers.MARKER_COPY_MESSAGE_ACTION_ID = 'problems.action.copyMessage';
        Markers.RELATED_INFORMATION_COPY_MESSAGE_ACTION_ID = 'problems.action.copyRelatedInformationMessage';
        Markers.FOCUS_PROBLEMS_FROM_FILTER = 'problems.action.focusProblemsFromFilter';
        Markers.MARKERS_VIEW_FOCUS_FILTER = 'problems.action.focusFilter';
        Markers.MARKERS_VIEW_CLEAR_FILTER_TEXT = 'problems.action.clearFilterText';
        Markers.MARKERS_VIEW_SHOW_MULTILINE_MESSAGE = 'problems.action.showMultilineMessage';
        Markers.MARKERS_VIEW_SHOW_SINGLELINE_MESSAGE = 'problems.action.showSinglelineMessage';
        Markers.MARKER_OPEN_ACTION_ID = 'problems.action.open';
        Markers.MARKER_OPEN_SIDE_ACTION_ID = 'problems.action.openToSide';
        Markers.MARKER_SHOW_PANEL_ID = 'workbench.action.showErrorsWarnings';
        Markers.MARKER_SHOW_QUICK_FIX = 'problems.action.showQuickFixes';
        Markers.TOGGLE_MARKERS_VIEW_ACTION_ID = 'workbench.actions.view.toggleProblems';
    })(Markers || (exports.Markers = Markers = {}));
    var MarkersContextKeys;
    (function (MarkersContextKeys) {
        MarkersContextKeys.MarkersViewModeContextKey = new contextkey_1.RawContextKey('problemsViewMode', "tree" /* MarkersViewMode.Tree */);
        MarkersContextKeys.MarkersTreeVisibilityContextKey = new contextkey_1.RawContextKey('problemsVisibility', false);
        MarkersContextKeys.MarkerFocusContextKey = new contextkey_1.RawContextKey('problemFocus', false);
        MarkersContextKeys.MarkerViewFilterFocusContextKey = new contextkey_1.RawContextKey('problemsFilterFocus', false);
        MarkersContextKeys.RelatedInformationFocusContextKey = new contextkey_1.RawContextKey('relatedInformationFocus', false);
        MarkersContextKeys.ShowErrorsFilterContextKey = new contextkey_1.RawContextKey('problems.filter.errors', true);
        MarkersContextKeys.ShowWarningsFilterContextKey = new contextkey_1.RawContextKey('problems.filter.warnings', true);
        MarkersContextKeys.ShowInfoFilterContextKey = new contextkey_1.RawContextKey('problems.filter.info', true);
        MarkersContextKeys.ShowActiveFileFilterContextKey = new contextkey_1.RawContextKey('problems.filter.activeFile', false);
        MarkersContextKeys.ShowExcludedFilesFilterContextKey = new contextkey_1.RawContextKey('problems.filter.excludedFiles', true);
    })(MarkersContextKeys || (exports.MarkersContextKeys = MarkersContextKeys = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWFya2Vycy9jb21tb24vbWFya2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsSUFBa0IsZUFHakI7SUFIRCxXQUFrQixlQUFlO1FBQ2hDLGtDQUFlLENBQUE7UUFDZixnQ0FBYSxDQUFBO0lBQ2QsQ0FBQyxFQUhpQixlQUFlLCtCQUFmLGVBQWUsUUFHaEM7SUFFRCxJQUFpQixPQUFPLENBaUJ2QjtJQWpCRCxXQUFpQixPQUFPO1FBQ1YsNEJBQW9CLEdBQUcseUJBQXlCLENBQUM7UUFDakQsdUJBQWUsR0FBRyw4QkFBOEIsQ0FBQztRQUNqRCwrQkFBdUIsR0FBRyx5QkFBeUIsQ0FBQztRQUNwRCw2QkFBcUIsR0FBRyxzQkFBc0IsQ0FBQztRQUMvQyxxQ0FBNkIsR0FBRyw2QkFBNkIsQ0FBQztRQUM5RCxrREFBMEMsR0FBRywrQ0FBK0MsQ0FBQztRQUM3RixrQ0FBMEIsR0FBRyx5Q0FBeUMsQ0FBQztRQUN2RSxpQ0FBeUIsR0FBRyw2QkFBNkIsQ0FBQztRQUMxRCxzQ0FBOEIsR0FBRyxpQ0FBaUMsQ0FBQztRQUNuRSwyQ0FBbUMsR0FBRyxzQ0FBc0MsQ0FBQztRQUM3RSw0Q0FBb0MsR0FBRyx1Q0FBdUMsQ0FBQztRQUMvRSw2QkFBcUIsR0FBRyxzQkFBc0IsQ0FBQztRQUMvQyxrQ0FBMEIsR0FBRyw0QkFBNEIsQ0FBQztRQUMxRCw0QkFBb0IsR0FBRyxxQ0FBcUMsQ0FBQztRQUM3RCw2QkFBcUIsR0FBRyxnQ0FBZ0MsQ0FBQztRQUN6RCxxQ0FBNkIsR0FBRyx1Q0FBdUMsQ0FBQztJQUN0RixDQUFDLEVBakJnQixPQUFPLHVCQUFQLE9BQU8sUUFpQnZCO0lBRUQsSUFBaUIsa0JBQWtCLENBV2xDO0lBWEQsV0FBaUIsa0JBQWtCO1FBQ3JCLDRDQUF5QixHQUFHLElBQUksMEJBQWEsQ0FBa0Isa0JBQWtCLG9DQUF1QixDQUFDO1FBQ3pHLGtEQUErQixHQUFHLElBQUksMEJBQWEsQ0FBVSxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxRix3Q0FBcUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFFLGtEQUErQixHQUFHLElBQUksMEJBQWEsQ0FBVSxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzRixvREFBaUMsR0FBRyxJQUFJLDBCQUFhLENBQVUseUJBQXlCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakcsNkNBQTBCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHdCQUF3QixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hGLCtDQUE0QixHQUFHLElBQUksMEJBQWEsQ0FBVSwwQkFBMEIsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM1RiwyQ0FBd0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEYsaURBQThCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pHLG9EQUFpQyxHQUFHLElBQUksMEJBQWEsQ0FBVSwrQkFBK0IsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwSCxDQUFDLEVBWGdCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBV2xDIn0=