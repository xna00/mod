/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/contextmenu/common/contextmenu", "vs/base/parts/sandbox/electron-sandbox/globals"], function (require, exports, contextmenu_1, globals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.popup = popup;
    let contextMenuIdPool = 0;
    function popup(items, options, onHide) {
        const processedItems = [];
        const contextMenuId = contextMenuIdPool++;
        const onClickChannel = `vscode:onContextMenu${contextMenuId}`;
        const onClickChannelHandler = (event, itemId, context) => {
            const item = processedItems[itemId];
            item.click?.(context);
        };
        globals_1.ipcRenderer.once(onClickChannel, onClickChannelHandler);
        globals_1.ipcRenderer.once(contextmenu_1.CONTEXT_MENU_CLOSE_CHANNEL, (event, closedContextMenuId) => {
            if (closedContextMenuId !== contextMenuId) {
                return;
            }
            globals_1.ipcRenderer.removeListener(onClickChannel, onClickChannelHandler);
            onHide?.();
        });
        globals_1.ipcRenderer.send(contextmenu_1.CONTEXT_MENU_CHANNEL, contextMenuId, items.map(item => createItem(item, processedItems)), onClickChannel, options);
    }
    function createItem(item, processedItems) {
        const serializableItem = {
            id: processedItems.length,
            label: item.label,
            type: item.type,
            accelerator: item.accelerator,
            checked: item.checked,
            enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
            visible: typeof item.visible === 'boolean' ? item.visible : true
        };
        processedItems.push(item);
        // Submenu
        if (Array.isArray(item.submenu)) {
            serializableItem.submenu = item.submenu.map(submenuItem => createItem(submenuItem, processedItems));
        }
        return serializableItem;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dG1lbnUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvY29udGV4dG1lbnUvZWxlY3Ryb24tc2FuZGJveC9jb250ZXh0bWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxzQkFzQkM7SUF4QkQsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7SUFFMUIsU0FBZ0IsS0FBSyxDQUFDLEtBQXlCLEVBQUUsT0FBdUIsRUFBRSxNQUFtQjtRQUM1RixNQUFNLGNBQWMsR0FBdUIsRUFBRSxDQUFDO1FBRTlDLE1BQU0sYUFBYSxHQUFHLGlCQUFpQixFQUFFLENBQUM7UUFDMUMsTUFBTSxjQUFjLEdBQUcsdUJBQXVCLGFBQWEsRUFBRSxDQUFDO1FBQzlELE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxLQUFjLEVBQUUsTUFBYyxFQUFFLE9BQTBCLEVBQUUsRUFBRTtZQUM1RixNQUFNLElBQUksR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZCLENBQUMsQ0FBQztRQUVGLHFCQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3hELHFCQUFXLENBQUMsSUFBSSxDQUFDLHdDQUEwQixFQUFFLENBQUMsS0FBYyxFQUFFLG1CQUEyQixFQUFFLEVBQUU7WUFDNUYsSUFBSSxtQkFBbUIsS0FBSyxhQUFhLEVBQUUsQ0FBQztnQkFDM0MsT0FBTztZQUNSLENBQUM7WUFFRCxxQkFBVyxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQUVsRSxNQUFNLEVBQUUsRUFBRSxDQUFDO1FBQ1osQ0FBQyxDQUFDLENBQUM7UUFFSCxxQkFBVyxDQUFDLElBQUksQ0FBQyxrQ0FBb0IsRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFBRSxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDckksQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFDLElBQXNCLEVBQUUsY0FBa0M7UUFDN0UsTUFBTSxnQkFBZ0IsR0FBaUM7WUFDdEQsRUFBRSxFQUFFLGNBQWMsQ0FBQyxNQUFNO1lBQ3pCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1lBQ3JCLE9BQU8sRUFBRSxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJO1lBQ2hFLE9BQU8sRUFBRSxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJO1NBQ2hFLENBQUM7UUFFRixjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTFCLFVBQVU7UUFDVixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakMsZ0JBQWdCLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ3JHLENBQUM7UUFFRCxPQUFPLGdCQUFnQixDQUFDO0lBQ3pCLENBQUMifQ==