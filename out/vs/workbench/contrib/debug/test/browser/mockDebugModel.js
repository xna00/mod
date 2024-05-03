/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/test/common/mockDebug", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, log_1, uriIdentityService_1, debugModel_1, mockDebug_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mockUriIdentityService = void 0;
    exports.createMockDebugModel = createMockDebugModel;
    const fileService = new workbenchTestServices_1.TestFileService();
    exports.mockUriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
    function createMockDebugModel(disposable) {
        const storage = disposable.add(new workbenchTestServices_2.TestStorageService());
        const debugStorage = disposable.add(new mockDebug_1.MockDebugStorage(storage));
        return disposable.add(new debugModel_1.DebugModel(debugStorage, { isDirty: (e) => false }, exports.mockUriIdentityService, new log_1.NullLogService()));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0RlYnVnTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL3Rlc3QvYnJvd3Nlci9tb2NrRGVidWdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsb0RBSUM7SUFQRCxNQUFNLFdBQVcsR0FBRyxJQUFJLHVDQUFlLEVBQUUsQ0FBQztJQUM3QixRQUFBLHNCQUFzQixHQUFHLElBQUksdUNBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFMUUsU0FBZ0Isb0JBQW9CLENBQUMsVUFBd0M7UUFDNUUsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDBDQUFrQixFQUFFLENBQUMsQ0FBQztRQUN6RCxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksNEJBQWdCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNuRSxPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1QkFBVSxDQUFDLFlBQVksRUFBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsOEJBQXNCLEVBQUUsSUFBSSxvQkFBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3hJLENBQUMifQ==