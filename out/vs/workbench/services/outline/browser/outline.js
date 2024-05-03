/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutlineConfigCollapseItemsValues = exports.OutlineConfigKeys = exports.OutlineTarget = exports.IOutlineService = void 0;
    exports.IOutlineService = (0, instantiation_1.createDecorator)('IOutlineService');
    var OutlineTarget;
    (function (OutlineTarget) {
        OutlineTarget[OutlineTarget["OutlinePane"] = 1] = "OutlinePane";
        OutlineTarget[OutlineTarget["Breadcrumbs"] = 2] = "Breadcrumbs";
        OutlineTarget[OutlineTarget["QuickPick"] = 4] = "QuickPick";
    })(OutlineTarget || (exports.OutlineTarget = OutlineTarget = {}));
    var OutlineConfigKeys;
    (function (OutlineConfigKeys) {
        OutlineConfigKeys["icons"] = "outline.icons";
        OutlineConfigKeys["collapseItems"] = "outline.collapseItems";
        OutlineConfigKeys["problemsEnabled"] = "outline.problems.enabled";
        OutlineConfigKeys["problemsColors"] = "outline.problems.colors";
        OutlineConfigKeys["problemsBadges"] = "outline.problems.badges";
    })(OutlineConfigKeys || (exports.OutlineConfigKeys = OutlineConfigKeys = {}));
    var OutlineConfigCollapseItemsValues;
    (function (OutlineConfigCollapseItemsValues) {
        OutlineConfigCollapseItemsValues["Collapsed"] = "alwaysCollapse";
        OutlineConfigCollapseItemsValues["Expanded"] = "alwaysExpand";
    })(OutlineConfigCollapseItemsValues || (exports.OutlineConfigCollapseItemsValues = OutlineConfigCollapseItemsValues = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL291dGxpbmUvYnJvd3Nlci9vdXRsaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNuRixRQUFBLGVBQWUsR0FBRyxJQUFBLCtCQUFlLEVBQWtCLGlCQUFpQixDQUFDLENBQUM7SUFFbkYsSUFBa0IsYUFJakI7SUFKRCxXQUFrQixhQUFhO1FBQzlCLCtEQUFlLENBQUE7UUFDZiwrREFBZSxDQUFBO1FBQ2YsMkRBQWEsQ0FBQTtJQUNkLENBQUMsRUFKaUIsYUFBYSw2QkFBYixhQUFhLFFBSTlCO0lBcUVELElBQWtCLGlCQU1qQjtJQU5ELFdBQWtCLGlCQUFpQjtRQUNsQyw0Q0FBeUIsQ0FBQTtRQUN6Qiw0REFBeUMsQ0FBQTtRQUN6QyxpRUFBOEMsQ0FBQTtRQUM5QywrREFBNEMsQ0FBQTtRQUM1QywrREFBNEMsQ0FBQTtJQUM3QyxDQUFDLEVBTmlCLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBTWxDO0lBRUQsSUFBa0IsZ0NBR2pCO0lBSEQsV0FBa0IsZ0NBQWdDO1FBQ2pELGdFQUE0QixDQUFBO1FBQzVCLDZEQUF5QixDQUFBO0lBQzFCLENBQUMsRUFIaUIsZ0NBQWdDLGdEQUFoQyxnQ0FBZ0MsUUFHakQifQ==