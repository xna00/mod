/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onObservableChange = onObservableChange;
    function onObservableChange(observable, callback) {
        const o = {
            beginUpdate() { },
            endUpdate() { },
            handlePossibleChange(observable) {
                observable.reportChanges();
            },
            handleChange(_observable, change) {
                callback(change);
            }
        };
        observable.addObserver(o);
        return {
            dispose() {
                observable.removeObserver(o);
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZVV0aWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi9vYnNlcnZhYmxlVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsZ0RBa0JDO0lBbEJELFNBQWdCLGtCQUFrQixDQUFJLFVBQW1DLEVBQUUsUUFBNEI7UUFDdEcsTUFBTSxDQUFDLEdBQWM7WUFDcEIsV0FBVyxLQUFLLENBQUM7WUFDakIsU0FBUyxLQUFLLENBQUM7WUFDZixvQkFBb0IsQ0FBQyxVQUFVO2dCQUM5QixVQUFVLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDNUIsQ0FBQztZQUNELFlBQVksQ0FBYyxXQUFxQyxFQUFFLE1BQWU7Z0JBQy9FLFFBQVEsQ0FBQyxNQUFrQixDQUFDLENBQUM7WUFDOUIsQ0FBQztTQUNELENBQUM7UUFFRixVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFCLE9BQU87WUFDTixPQUFPO2dCQUNOLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsQ0FBQztTQUNELENBQUM7SUFDSCxDQUFDIn0=