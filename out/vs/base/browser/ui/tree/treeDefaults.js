/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/nls"], function (require, exports, actions_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollapseAllAction = void 0;
    class CollapseAllAction extends actions_1.Action {
        constructor(viewer, enabled) {
            super('vs.tree.collapse', nls.localize('collapse all', "Collapse All"), 'collapse-all', enabled);
            this.viewer = viewer;
        }
        async run() {
            this.viewer.collapseAll();
            this.viewer.setSelection([]);
            this.viewer.setFocus([]);
        }
    }
    exports.CollapseAllAction = CollapseAllAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZURlZmF1bHRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvdHJlZS90cmVlRGVmYXVsdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsaUJBQWlELFNBQVEsZ0JBQU07UUFFM0UsWUFBb0IsTUFBNkMsRUFBRSxPQUFnQjtZQUNsRixLQUFLLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLEVBQUUsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRDlFLFdBQU0sR0FBTixNQUFNLENBQXVDO1FBRWpFLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFCLENBQUM7S0FDRDtJQVhELDhDQVdDIn0=