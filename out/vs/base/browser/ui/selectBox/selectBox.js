/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/selectBox/selectBoxCustom", "vs/base/browser/ui/selectBox/selectBoxNative", "vs/base/browser/ui/widget", "vs/base/common/platform", "vs/css!./selectBox"], function (require, exports, listWidget_1, selectBoxCustom_1, selectBoxNative_1, widget_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectBox = exports.unthemedSelectBoxStyles = void 0;
    exports.unthemedSelectBoxStyles = {
        ...listWidget_1.unthemedListStyles,
        selectBackground: '#3C3C3C',
        selectForeground: '#F0F0F0',
        selectBorder: '#3C3C3C',
        decoratorRightForeground: undefined,
        selectListBackground: undefined,
        selectListBorder: undefined,
        focusBorder: undefined,
    };
    class SelectBox extends widget_1.Widget {
        constructor(options, selected, contextViewProvider, styles, selectBoxOptions) {
            super();
            // Default to native SelectBox for OSX unless overridden
            if (platform_1.isMacintosh && !selectBoxOptions?.useCustomDrawn) {
                this.selectBoxDelegate = new selectBoxNative_1.SelectBoxNative(options, selected, styles, selectBoxOptions);
            }
            else {
                this.selectBoxDelegate = new selectBoxCustom_1.SelectBoxList(options, selected, contextViewProvider, styles, selectBoxOptions);
            }
            this._register(this.selectBoxDelegate);
        }
        // Public SelectBox Methods - routed through delegate interface
        get onDidSelect() {
            return this.selectBoxDelegate.onDidSelect;
        }
        setOptions(options, selected) {
            this.selectBoxDelegate.setOptions(options, selected);
        }
        select(index) {
            this.selectBoxDelegate.select(index);
        }
        setAriaLabel(label) {
            this.selectBoxDelegate.setAriaLabel(label);
        }
        focus() {
            this.selectBoxDelegate.focus();
        }
        blur() {
            this.selectBoxDelegate.blur();
        }
        setFocusable(focusable) {
            this.selectBoxDelegate.setFocusable(focusable);
        }
        render(container) {
            this.selectBoxDelegate.render(container);
        }
    }
    exports.SelectBox = SelectBox;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0Qm94LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvc2VsZWN0Qm94L3NlbGVjdEJveC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE2RG5GLFFBQUEsdUJBQXVCLEdBQXFCO1FBQ3hELEdBQUcsK0JBQWtCO1FBQ3JCLGdCQUFnQixFQUFFLFNBQVM7UUFDM0IsZ0JBQWdCLEVBQUUsU0FBUztRQUMzQixZQUFZLEVBQUUsU0FBUztRQUN2Qix3QkFBd0IsRUFBRSxTQUFTO1FBQ25DLG9CQUFvQixFQUFFLFNBQVM7UUFDL0IsZ0JBQWdCLEVBQUUsU0FBUztRQUMzQixXQUFXLEVBQUUsU0FBUztLQUN0QixDQUFDO0lBT0YsTUFBYSxTQUFVLFNBQVEsZUFBTTtRQUdwQyxZQUFZLE9BQTRCLEVBQUUsUUFBZ0IsRUFBRSxtQkFBeUMsRUFBRSxNQUF3QixFQUFFLGdCQUFvQztZQUNwSyxLQUFLLEVBQUUsQ0FBQztZQUVSLHdEQUF3RDtZQUN4RCxJQUFJLHNCQUFXLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksaUNBQWUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSwrQkFBYSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDOUcsQ0FBQztZQUVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVELCtEQUErRDtRQUUvRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUM7UUFDM0MsQ0FBQztRQUVELFVBQVUsQ0FBQyxPQUE0QixFQUFFLFFBQWlCO1lBQ3pELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCxNQUFNLENBQUMsS0FBYTtZQUNuQixJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxZQUFZLENBQUMsS0FBYTtZQUN6QixJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFFRCxJQUFJO1lBQ0gsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFRCxZQUFZLENBQUMsU0FBa0I7WUFDOUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRUQsTUFBTSxDQUFDLFNBQXNCO1lBQzVCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDMUMsQ0FBQztLQUNEO0lBakRELDhCQWlEQyJ9