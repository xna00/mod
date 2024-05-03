/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/testing/common/testId"], function (require, exports, testId_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isCollapsedInSerializedTestTree = isCollapsedInSerializedTestTree;
    /**
     * Gets whether the given test ID is collapsed.
     */
    function isCollapsedInSerializedTestTree(serialized, id) {
        if (!(id instanceof testId_1.TestId)) {
            id = testId_1.TestId.fromString(id);
        }
        let node = serialized;
        for (const part of id.path) {
            if (!node.children?.hasOwnProperty(part)) {
                return undefined;
            }
            node = node.children[part];
        }
        return node.collapsed;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ1ZpZXdTdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9icm93c2VyL2V4cGxvcmVyUHJvamVjdGlvbnMvdGVzdGluZ1ZpZXdTdGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRywwRUFlQztJQWxCRDs7T0FFRztJQUNILFNBQWdCLCtCQUErQixDQUFDLFVBQTRDLEVBQUUsRUFBbUI7UUFDaEgsSUFBSSxDQUFDLENBQUMsRUFBRSxZQUFZLGVBQU0sQ0FBQyxFQUFFLENBQUM7WUFDN0IsRUFBRSxHQUFHLGVBQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQUksSUFBSSxHQUFHLFVBQVUsQ0FBQztRQUN0QixLQUFLLE1BQU0sSUFBSSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDdkIsQ0FBQyJ9