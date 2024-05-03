/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/codicons", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/iconRegistry"], function (require, exports, nls_1, codicons_1, platform_1, contextkey_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LOCAL_HISTORY_ICON_RESTORE = exports.LOCAL_HISTORY_ICON_ENTRY = exports.LOCAL_HISTORY_MENU_CONTEXT_KEY = exports.LOCAL_HISTORY_MENU_CONTEXT_VALUE = void 0;
    exports.getLocalHistoryDateFormatter = getLocalHistoryDateFormatter;
    let localHistoryDateFormatter = undefined;
    function getLocalHistoryDateFormatter() {
        if (!localHistoryDateFormatter) {
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
            let formatter;
            try {
                formatter = new Intl.DateTimeFormat(platform_1.language, options);
            }
            catch (error) {
                formatter = new Intl.DateTimeFormat(undefined, options); // error can happen when language is invalid (https://github.com/microsoft/vscode/issues/147086)
            }
            localHistoryDateFormatter = {
                format: date => formatter.format(date)
            };
        }
        return localHistoryDateFormatter;
    }
    exports.LOCAL_HISTORY_MENU_CONTEXT_VALUE = 'localHistory:item';
    exports.LOCAL_HISTORY_MENU_CONTEXT_KEY = contextkey_1.ContextKeyExpr.equals('timelineItem', exports.LOCAL_HISTORY_MENU_CONTEXT_VALUE);
    exports.LOCAL_HISTORY_ICON_ENTRY = (0, iconRegistry_1.registerIcon)('localHistory-icon', codicons_1.Codicon.circleOutline, (0, nls_1.localize)('localHistoryIcon', "Icon for a local history entry in the timeline view."));
    exports.LOCAL_HISTORY_ICON_RESTORE = (0, iconRegistry_1.registerIcon)('localHistory-restore', codicons_1.Codicon.check, (0, nls_1.localize)('localHistoryRestore', "Icon for restoring contents of a local history entry."));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxIaXN0b3J5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9sb2NhbEhpc3RvcnkvYnJvd3Nlci9sb2NhbEhpc3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLG9FQWlCQztJQW5CRCxJQUFJLHlCQUF5QixHQUEyQyxTQUFTLENBQUM7SUFFbEYsU0FBZ0IsNEJBQTRCO1FBQzNDLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sT0FBTyxHQUErQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDO1lBRW5JLElBQUksU0FBOEIsQ0FBQztZQUNuQyxJQUFJLENBQUM7Z0JBQ0osU0FBUyxHQUFHLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxtQkFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixTQUFTLEdBQUcsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLGdHQUFnRztZQUMxSixDQUFDO1lBRUQseUJBQXlCLEdBQUc7Z0JBQzNCLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO2FBQ3RDLENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyx5QkFBeUIsQ0FBQztJQUNsQyxDQUFDO0lBRVksUUFBQSxnQ0FBZ0MsR0FBRyxtQkFBbUIsQ0FBQztJQUN2RCxRQUFBLDhCQUE4QixHQUFHLDJCQUFjLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSx3Q0FBZ0MsQ0FBQyxDQUFDO0lBRXpHLFFBQUEsd0JBQXdCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLG1CQUFtQixFQUFFLGtCQUFPLENBQUMsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLHNEQUFzRCxDQUFDLENBQUMsQ0FBQztJQUMxSyxRQUFBLDBCQUEwQixHQUFHLElBQUEsMkJBQVksRUFBQyxzQkFBc0IsRUFBRSxrQkFBTyxDQUFDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSx1REFBdUQsQ0FBQyxDQUFDLENBQUMifQ==