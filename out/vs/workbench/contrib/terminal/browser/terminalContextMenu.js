/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/mouseEvent", "vs/base/common/actions", "vs/base/common/arrays", "vs/platform/actions/browser/menuEntryActionViewItem"], function (require, exports, mouseEvent_1, actions_1, arrays_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalContextActionRunner = exports.InstanceContext = void 0;
    exports.openContextMenu = openContextMenu;
    /**
     * A context that is passed to actions as arguments to represent the terminal instance(s) being
     * acted upon.
     */
    class InstanceContext {
        constructor(instance) {
            // Only store the instance to avoid contexts holding on to disposed instances.
            this.instanceId = instance.instanceId;
        }
        toJSON() {
            return {
                $mid: 15 /* MarshalledId.TerminalContext */,
                instanceId: this.instanceId
            };
        }
    }
    exports.InstanceContext = InstanceContext;
    class TerminalContextActionRunner extends actions_1.ActionRunner {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        async runAction(action, context) {
            if (Array.isArray(context) && context.every(e => e instanceof InstanceContext)) {
                // arg1: The (first) focused instance
                // arg2: All selected instances
                await action.run(context?.[0], context);
                return;
            }
            return super.runAction(action, context);
        }
    }
    exports.TerminalContextActionRunner = TerminalContextActionRunner;
    function openContextMenu(targetWindow, event, contextInstances, menu, contextMenuService, extraActions) {
        const standardEvent = new mouseEvent_1.StandardMouseEvent(targetWindow, event);
        const actions = [];
        (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, actions);
        if (extraActions) {
            actions.push(...extraActions);
        }
        const context = contextInstances ? (0, arrays_1.asArray)(contextInstances).map(e => new InstanceContext(e)) : [];
        contextMenuService.showContextMenu({
            actionRunner: new TerminalContextActionRunner(),
            getAnchor: () => standardEvent,
            getActions: () => actions,
            getActionsContext: () => context,
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb250ZXh0TWVudS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbENvbnRleHRNZW51LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStDaEcsMENBbUJDO0lBckREOzs7T0FHRztJQUNILE1BQWEsZUFBZTtRQUczQixZQUFZLFFBQTJCO1lBQ3RDLDhFQUE4RTtZQUM5RSxJQUFJLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUM7UUFDdkMsQ0FBQztRQUVELE1BQU07WUFDTCxPQUFPO2dCQUNOLElBQUksdUNBQThCO2dCQUNsQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7YUFDM0IsQ0FBQztRQUNILENBQUM7S0FDRDtJQWRELDBDQWNDO0lBRUQsTUFBYSwyQkFBNEIsU0FBUSxzQkFBWTtRQUU1RCxnRUFBZ0U7UUFDN0MsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFlLEVBQUUsT0FBNkM7WUFDaEcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksZUFBZSxDQUFDLEVBQUUsQ0FBQztnQkFDaEYscUNBQXFDO2dCQUNyQywrQkFBK0I7Z0JBQy9CLE1BQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDeEMsT0FBTztZQUNSLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRDtJQVpELGtFQVlDO0lBRUQsU0FBZ0IsZUFBZSxDQUFDLFlBQW9CLEVBQUUsS0FBaUIsRUFBRSxnQkFBNkQsRUFBRSxJQUFXLEVBQUUsa0JBQXVDLEVBQUUsWUFBd0I7UUFDck4sTUFBTSxhQUFhLEdBQUcsSUFBSSwrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFbEUsTUFBTSxPQUFPLEdBQWMsRUFBRSxDQUFDO1FBRTlCLElBQUEsMkRBQWlDLEVBQUMsSUFBSSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFOUUsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNsQixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsWUFBWSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFzQixnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBQSxnQkFBTyxFQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBRXRILGtCQUFrQixDQUFDLGVBQWUsQ0FBQztZQUNsQyxZQUFZLEVBQUUsSUFBSSwyQkFBMkIsRUFBRTtZQUMvQyxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsYUFBYTtZQUM5QixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTztZQUN6QixpQkFBaUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPO1NBQ2hDLENBQUMsQ0FBQztJQUNKLENBQUMifQ==