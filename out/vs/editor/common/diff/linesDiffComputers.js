/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/diff/legacyLinesDiffComputer", "vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer"], function (require, exports, legacyLinesDiffComputer_1, defaultLinesDiffComputer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.linesDiffComputers = void 0;
    exports.linesDiffComputers = {
        getLegacy: () => new legacyLinesDiffComputer_1.LegacyLinesDiffComputer(),
        getDefault: () => new defaultLinesDiffComputer_1.DefaultLinesDiffComputer(),
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZXNEaWZmQ29tcHV0ZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2RpZmYvbGluZXNEaWZmQ29tcHV0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1uRixRQUFBLGtCQUFrQixHQUFHO1FBQ2pDLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLGlEQUF1QixFQUFFO1FBQzlDLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLG1EQUF3QixFQUFFO0tBQ0csQ0FBQyJ9