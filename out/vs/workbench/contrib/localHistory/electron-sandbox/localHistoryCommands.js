/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/platform/actions/common/actions", "vs/workbench/contrib/localHistory/browser/localHistory", "vs/workbench/contrib/localHistory/browser/localHistoryCommands", "vs/base/common/platform", "vs/platform/native/common/native", "vs/platform/contextkey/common/contextkey", "vs/base/common/network", "vs/workbench/common/contextkeys"], function (require, exports, nls_1, workingCopyHistory_1, actions_1, localHistory_1, localHistoryCommands_1, platform_1, native_1, contextkey_1, network_1, contextkeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Delete
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.revealInOS',
                title: platform_1.isWindows ? (0, nls_1.localize2)('revealInWindows', "Reveal in File Explorer") : platform_1.isMacintosh ? (0, nls_1.localize2)('revealInMac', "Reveal in Finder") : (0, nls_1.localize2)('openContainer', "Open Containing Folder"),
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '4_reveal',
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.and(localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY, contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file))
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const { entry } = await (0, localHistoryCommands_1.findLocalHistoryEntry)(workingCopyHistoryService, item);
            if (entry) {
                await nativeHostService.showItemInFolder(entry.location.with({ scheme: network_1.Schemas.file }).fsPath);
            }
        }
    });
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxIaXN0b3J5Q29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvY2FsSGlzdG9yeS9lbGVjdHJvbi1zYW5kYm94L2xvY2FsSGlzdG9yeUNvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLGdCQUFnQjtJQUVoQixJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwwQ0FBMEM7Z0JBQzlDLEtBQUssRUFBRSxvQkFBUyxDQUFDLENBQUMsQ0FBQyxJQUFBLGVBQVMsRUFBQyxpQkFBaUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxzQkFBVyxDQUFDLENBQUMsQ0FBQyxJQUFBLGVBQVMsRUFBQyxhQUFhLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxlQUFTLEVBQUMsZUFBZSxFQUFFLHdCQUF3QixDQUFDO2dCQUM5TCxJQUFJLEVBQUU7b0JBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsbUJBQW1CO29CQUM5QixLQUFLLEVBQUUsVUFBVTtvQkFDakIsS0FBSyxFQUFFLENBQUM7b0JBQ1IsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDZDQUE4QixFQUFFLGdDQUFrQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsaUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDM0c7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLElBQThCO1lBQ25FLE1BQU0seUJBQXlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQ0FBMEIsQ0FBQyxDQUFDO1lBQzNFLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBa0IsQ0FBQyxDQUFDO1lBRTNELE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxNQUFNLElBQUEsNENBQXFCLEVBQUMseUJBQXlCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDL0UsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxNQUFNLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoRyxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUMsQ0FBQzs7QUFFSCxZQUFZIn0=