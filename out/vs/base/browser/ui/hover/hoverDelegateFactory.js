/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lazy"], function (require, exports, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setHoverDelegateFactory = setHoverDelegateFactory;
    exports.getDefaultHoverDelegate = getDefaultHoverDelegate;
    exports.createInstantHoverDelegate = createInstantHoverDelegate;
    const nullHoverDelegateFactory = () => ({
        get delay() { return -1; },
        dispose: () => { },
        showHover: () => { return undefined; },
    });
    let hoverDelegateFactory = nullHoverDelegateFactory;
    const defaultHoverDelegateMouse = new lazy_1.Lazy(() => hoverDelegateFactory('mouse', false));
    const defaultHoverDelegateElement = new lazy_1.Lazy(() => hoverDelegateFactory('element', false));
    function setHoverDelegateFactory(hoverDelegateProvider) {
        hoverDelegateFactory = hoverDelegateProvider;
    }
    function getDefaultHoverDelegate(placement) {
        if (placement === 'element') {
            return defaultHoverDelegateElement.value;
        }
        return defaultHoverDelegateMouse.value;
    }
    function createInstantHoverDelegate() {
        // Creates a hover delegate with instant hover enabled.
        // This hover belongs to the consumer and requires the them to dispose it.
        // Instant hover only makes sense for 'element' placement.
        return hoverDelegateFactory('element', true);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJEZWxlZ2F0ZUZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9ob3Zlci9ob3ZlckRlbGVnYXRlRmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRywwREFFQztJQUVELDBEQUtDO0lBRUQsZ0VBS0M7SUExQkQsTUFBTSx3QkFBd0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksS0FBSyxLQUFhLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDO1FBQ2xCLFNBQVMsRUFBRSxHQUFHLEVBQUUsR0FBRyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7S0FDdEMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxvQkFBb0IsR0FBMEYsd0JBQXdCLENBQUM7SUFDM0ksTUFBTSx5QkFBeUIsR0FBRyxJQUFJLFdBQUksQ0FBaUIsR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDdkcsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLFdBQUksQ0FBaUIsR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFM0csU0FBZ0IsdUJBQXVCLENBQUMscUJBQThHO1FBQ3JKLG9CQUFvQixHQUFHLHFCQUFxQixDQUFDO0lBQzlDLENBQUM7SUFFRCxTQUFnQix1QkFBdUIsQ0FBQyxTQUE4QjtRQUNyRSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUM3QixPQUFPLDJCQUEyQixDQUFDLEtBQUssQ0FBQztRQUMxQyxDQUFDO1FBQ0QsT0FBTyx5QkFBeUIsQ0FBQyxLQUFLLENBQUM7SUFDeEMsQ0FBQztJQUVELFNBQWdCLDBCQUEwQjtRQUN6Qyx1REFBdUQ7UUFDdkQsMEVBQTBFO1FBQzFFLDBEQUEwRDtRQUMxRCxPQUFPLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDIn0=