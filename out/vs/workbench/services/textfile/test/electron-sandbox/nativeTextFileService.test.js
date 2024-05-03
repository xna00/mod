/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/files/common/files", "vs/base/common/network", "vs/platform/instantiation/common/serviceCollection", "vs/base/common/lifecycle", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/workbench/test/electron-sandbox/workbenchTestServices", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/base/test/common/utils"], function (require, exports, assert, files_1, network_1, serviceCollection_1, lifecycle_1, fileService_1, log_1, workbenchTestServices_1, workingCopyFileService_1, workingCopyService_1, uriIdentityService_1, inMemoryFilesystemProvider_1, textFileEditorModel_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - NativeTextFileService', function () {
        const disposables = new lifecycle_1.DisposableStore();
        let service;
        let instantiationService;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(network_1.Schemas.file, fileProvider));
            const collection = new serviceCollection_1.ServiceCollection();
            collection.set(files_1.IFileService, fileService);
            collection.set(workingCopyFileService_1.IWorkingCopyFileService, disposables.add(new workingCopyFileService_1.WorkingCopyFileService(fileService, disposables.add(new workingCopyService_1.WorkingCopyService()), instantiationService, disposables.add(new uriIdentityService_1.UriIdentityService(fileService)))));
            service = disposables.add(instantiationService.createChild(collection).createInstance(workbenchTestServices_1.TestNativeTextFileServiceWithEncodingOverrides));
            disposables.add(service.files);
        });
        teardown(() => {
            disposables.clear();
        });
        test('shutdown joins on pending saves', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/index_async.txt'), 'utf8', undefined));
            await model.resolve();
            let pendingSaveAwaited = false;
            model.save().then(() => pendingSaveAwaited = true);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.lifecycleService.fireShutdown();
            assert.ok(accessor.lifecycleService.shutdownJoiners.length > 0);
            await Promise.all(accessor.lifecycleService.shutdownJoiners);
            assert.strictEqual(pendingSaveAwaited, true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlVGV4dEZpbGVTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0ZmlsZS90ZXN0L2VsZWN0cm9uLXNhbmRib3gvbmF0aXZlVGV4dEZpbGVTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvQmhHLEtBQUssQ0FBQywrQkFBK0IsRUFBRTtRQUN0QyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxJQUFJLE9BQXlCLENBQUM7UUFDOUIsSUFBSSxvQkFBMkMsQ0FBQztRQUVoRCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1Ysb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFN0UsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQkFBYyxFQUFFLENBQUM7WUFDeEMsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHlCQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUVqRSxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdURBQTBCLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZFLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGlCQUFPLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFFMUUsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1lBQzNDLFVBQVUsQ0FBQyxHQUFHLENBQUMsb0JBQVksRUFBRSxXQUFXLENBQUMsQ0FBQztZQUMxQyxVQUFVLENBQUMsR0FBRyxDQUFDLGdEQUF1QixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwrQ0FBc0IsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixFQUFFLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQWtCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV6TixPQUFPLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsY0FBYyxDQUFDLHNFQUE4QyxDQUFDLENBQUMsQ0FBQztZQUN2SSxXQUFXLENBQUMsR0FBRyxDQUE2QixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEtBQUs7WUFDNUMsTUFBTSxLQUFLLEdBQXdCLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHlDQUFtQixFQUFFLGtCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBRWhMLE1BQU0sS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXRCLElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO1lBQy9CLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFFbkQsTUFBTSxRQUFRLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJDQUFtQixDQUFDLENBQUM7WUFDMUUsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxDQUFDO1lBRXpDLE1BQU0sQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEUsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUU3RCxNQUFNLENBQUMsV0FBVyxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=