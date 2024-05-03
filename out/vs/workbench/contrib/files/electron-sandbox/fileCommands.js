/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/network"], function (require, exports, async_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.revealResourcesInOS = revealResourcesInOS;
    // Commands
    function revealResourcesInOS(resources, nativeHostService, workspaceContextService) {
        if (resources.length) {
            (0, async_1.sequence)(resources.map(r => async () => {
                if (r.scheme === network_1.Schemas.file || r.scheme === network_1.Schemas.vscodeUserData) {
                    nativeHostService.showItemInFolder(r.with({ scheme: network_1.Schemas.file }).fsPath);
                }
            }));
        }
        else if (workspaceContextService.getWorkspace().folders.length) {
            const uri = workspaceContextService.getWorkspace().folders[0].uri;
            if (uri.scheme === network_1.Schemas.file) {
                nativeHostService.showItemInFolder(uri.fsPath);
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9lbGVjdHJvbi1zYW5kYm94L2ZpbGVDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyxrREFhQztJQWZELFdBQVc7SUFFWCxTQUFnQixtQkFBbUIsQ0FBQyxTQUFnQixFQUFFLGlCQUFxQyxFQUFFLHVCQUFpRDtRQUM3SSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN0QixJQUFBLGdCQUFRLEVBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUN0QyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN0RSxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0UsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO2FBQU0sSUFBSSx1QkFBdUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbEUsTUFBTSxHQUFHLEdBQUcsdUJBQXVCLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUNsRSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDakMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hELENBQUM7UUFDRixDQUFDO0lBQ0YsQ0FBQyJ9