/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusbarEntryKinds = exports.ShowTooltipCommand = exports.StatusbarAlignment = exports.IStatusbarService = void 0;
    exports.isStatusbarEntryLocation = isStatusbarEntryLocation;
    exports.isStatusbarEntryPriority = isStatusbarEntryPriority;
    exports.IStatusbarService = (0, instantiation_1.createDecorator)('statusbarService');
    var StatusbarAlignment;
    (function (StatusbarAlignment) {
        StatusbarAlignment[StatusbarAlignment["LEFT"] = 0] = "LEFT";
        StatusbarAlignment[StatusbarAlignment["RIGHT"] = 1] = "RIGHT";
    })(StatusbarAlignment || (exports.StatusbarAlignment = StatusbarAlignment = {}));
    function isStatusbarEntryLocation(thing) {
        const candidate = thing;
        return typeof candidate?.id === 'string' && typeof candidate.alignment === 'number';
    }
    function isStatusbarEntryPriority(thing) {
        const candidate = thing;
        return (typeof candidate?.primary === 'number' || isStatusbarEntryLocation(candidate?.primary)) && typeof candidate?.secondary === 'number';
    }
    exports.ShowTooltipCommand = {
        id: 'statusBar.entry.showTooltip',
        title: ''
    };
    exports.StatusbarEntryKinds = ['standard', 'warning', 'error', 'prominent', 'remote', 'offline'];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzYmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc3RhdHVzYmFyL2Jyb3dzZXIvc3RhdHVzYmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTREaEcsNERBSUM7SUF5QkQsNERBSUM7SUFuRlksUUFBQSxpQkFBaUIsR0FBRyxJQUFBLCtCQUFlLEVBQW9CLGtCQUFrQixDQUFDLENBQUM7SUF1QnhGLElBQWtCLGtCQUdqQjtJQUhELFdBQWtCLGtCQUFrQjtRQUNuQywyREFBSSxDQUFBO1FBQ0osNkRBQUssQ0FBQTtJQUNOLENBQUMsRUFIaUIsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFHbkM7SUF3QkQsU0FBZ0Isd0JBQXdCLENBQUMsS0FBYztRQUN0RCxNQUFNLFNBQVMsR0FBRyxLQUE0QyxDQUFDO1FBRS9ELE9BQU8sT0FBTyxTQUFTLEVBQUUsRUFBRSxLQUFLLFFBQVEsSUFBSSxPQUFPLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxDQUFDO0lBQ3JGLENBQUM7SUF5QkQsU0FBZ0Isd0JBQXdCLENBQUMsS0FBYztRQUN0RCxNQUFNLFNBQVMsR0FBRyxLQUE0QyxDQUFDO1FBRS9ELE9BQU8sQ0FBQyxPQUFPLFNBQVMsRUFBRSxPQUFPLEtBQUssUUFBUSxJQUFJLHdCQUF3QixDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLE9BQU8sU0FBUyxFQUFFLFNBQVMsS0FBSyxRQUFRLENBQUM7SUFDN0ksQ0FBQztJQUVZLFFBQUEsa0JBQWtCLEdBQVk7UUFDMUMsRUFBRSxFQUFFLDZCQUE2QjtRQUNqQyxLQUFLLEVBQUUsRUFBRTtLQUNULENBQUM7SUFVVyxRQUFBLG1CQUFtQixHQUF5QixDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMifQ==