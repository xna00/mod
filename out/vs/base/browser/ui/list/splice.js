/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CombinedSpliceable = void 0;
    class CombinedSpliceable {
        constructor(spliceables) {
            this.spliceables = spliceables;
        }
        splice(start, deleteCount, elements) {
            this.spliceables.forEach(s => s.splice(start, deleteCount, elements));
        }
    }
    exports.CombinedSpliceable = CombinedSpliceable;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BsaWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvbGlzdC9zcGxpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsa0JBQWtCO1FBRTlCLFlBQW9CLFdBQTZCO1lBQTdCLGdCQUFXLEdBQVgsV0FBVyxDQUFrQjtRQUFJLENBQUM7UUFFdEQsTUFBTSxDQUFDLEtBQWEsRUFBRSxXQUFtQixFQUFFLFFBQWE7WUFDdkQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN2RSxDQUFDO0tBQ0Q7SUFQRCxnREFPQyJ9