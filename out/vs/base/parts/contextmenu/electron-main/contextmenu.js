/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/parts/ipc/electron-main/ipcMain", "vs/base/parts/contextmenu/common/contextmenu"], function (require, exports, electron_1, ipcMain_1, contextmenu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerContextMenuListener = registerContextMenuListener;
    function registerContextMenuListener() {
        ipcMain_1.validatedIpcMain.on(contextmenu_1.CONTEXT_MENU_CHANNEL, (event, contextMenuId, items, onClickChannel, options) => {
            const menu = createMenu(event, onClickChannel, items);
            menu.popup({
                x: options ? options.x : undefined,
                y: options ? options.y : undefined,
                positioningItem: options ? options.positioningItem : undefined,
                callback: () => {
                    // Workaround for https://github.com/microsoft/vscode/issues/72447
                    // It turns out that the menu gets GC'ed if not referenced anymore
                    // As such we drag it into this scope so that it is not being GC'ed
                    if (menu) {
                        event.sender.send(contextmenu_1.CONTEXT_MENU_CLOSE_CHANNEL, contextMenuId);
                    }
                }
            });
        });
    }
    function createMenu(event, onClickChannel, items) {
        const menu = new electron_1.Menu();
        items.forEach(item => {
            let menuitem;
            // Separator
            if (item.type === 'separator') {
                menuitem = new electron_1.MenuItem({
                    type: item.type,
                });
            }
            // Sub Menu
            else if (Array.isArray(item.submenu)) {
                menuitem = new electron_1.MenuItem({
                    submenu: createMenu(event, onClickChannel, item.submenu),
                    label: item.label
                });
            }
            // Normal Menu Item
            else {
                menuitem = new electron_1.MenuItem({
                    label: item.label,
                    type: item.type,
                    accelerator: item.accelerator,
                    checked: item.checked,
                    enabled: item.enabled,
                    visible: item.visible,
                    click: (menuItem, win, contextmenuEvent) => event.sender.send(onClickChannel, item.id, contextmenuEvent)
                });
            }
            menu.append(menuitem);
        });
        return menu;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dG1lbnUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvY29udGV4dG1lbnUvZWxlY3Ryb24tbWFpbi9jb250ZXh0bWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxrRUFrQkM7SUFsQkQsU0FBZ0IsMkJBQTJCO1FBQzFDLDBCQUFnQixDQUFDLEVBQUUsQ0FBQyxrQ0FBb0IsRUFBRSxDQUFDLEtBQW1CLEVBQUUsYUFBcUIsRUFBRSxLQUFxQyxFQUFFLGNBQXNCLEVBQUUsT0FBdUIsRUFBRSxFQUFFO1lBQ2hMLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRXRELElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ1YsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDbEMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDbEMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDOUQsUUFBUSxFQUFFLEdBQUcsRUFBRTtvQkFDZCxrRUFBa0U7b0JBQ2xFLGtFQUFrRTtvQkFDbEUsbUVBQW1FO29CQUNuRSxJQUFJLElBQUksRUFBRSxDQUFDO3dCQUNWLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHdDQUEwQixFQUFFLGFBQWEsQ0FBQyxDQUFDO29CQUM5RCxDQUFDO2dCQUNGLENBQUM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLFVBQVUsQ0FBQyxLQUFtQixFQUFFLGNBQXNCLEVBQUUsS0FBcUM7UUFDckcsTUFBTSxJQUFJLEdBQUcsSUFBSSxlQUFJLEVBQUUsQ0FBQztRQUV4QixLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3BCLElBQUksUUFBa0IsQ0FBQztZQUV2QixZQUFZO1lBQ1osSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUMvQixRQUFRLEdBQUcsSUFBSSxtQkFBUSxDQUFDO29CQUN2QixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7aUJBQ2YsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELFdBQVc7aUJBQ04sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxRQUFRLEdBQUcsSUFBSSxtQkFBUSxDQUFDO29CQUN2QixPQUFPLEVBQUUsVUFBVSxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQztvQkFDeEQsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO2lCQUNqQixDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsbUJBQW1CO2lCQUNkLENBQUM7Z0JBQ0wsUUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQztvQkFDdkIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO29CQUNqQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7b0JBQ2YsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO29CQUM3QixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87b0JBQ3JCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztvQkFDckIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO29CQUNyQixLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQztpQkFDeEcsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMifQ==