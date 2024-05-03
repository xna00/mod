/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/base/common/lifecycle", "vs/platform/instantiation/common/serviceCollection", "vs/platform/files/common/files", "vs/base/common/uri", "vs/base/common/path", "vs/workbench/services/textfile/common/encoding", "vs/base/common/buffer", "vs/workbench/services/textfile/test/common/fixtures/files", "vs/workbench/services/textfile/test/common/textFileService.io.test", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/electron-sandbox/workbenchTestServices", "vs/base/test/common/utils"], function (require, exports, log_1, fileService_1, network_1, lifecycle_1, serviceCollection_1, files_1, uri_1, path_1, encoding_1, buffer_1, files_2, textFileService_io_test_1, workingCopyFileService_1, workingCopyService_1, uriIdentityService_1, workbenchTestServices_1, workbenchTestServices_2, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - NativeTextFileService i/o', function () {
        const disposables = new lifecycle_1.DisposableStore();
        let service;
        let fileProvider;
        const testDir = 'test';
        (0, textFileService_io_test_1.default)({
            setup: async () => {
                const instantiationService = (0, workbenchTestServices_2.workbenchInstantiationService)(undefined, disposables);
                const logService = new log_1.NullLogService();
                const fileService = disposables.add(new fileService_1.FileService(logService));
                fileProvider = disposables.add(new workbenchTestServices_1.TestInMemoryFileSystemProvider());
                disposables.add(fileService.registerProvider(network_1.Schemas.file, fileProvider));
                const collection = new serviceCollection_1.ServiceCollection();
                collection.set(files_1.IFileService, fileService);
                collection.set(workingCopyFileService_1.IWorkingCopyFileService, disposables.add(new workingCopyFileService_1.WorkingCopyFileService(fileService, disposables.add(new workingCopyService_1.WorkingCopyService()), instantiationService, disposables.add(new uriIdentityService_1.UriIdentityService(fileService)))));
                service = disposables.add(instantiationService.createChild(collection).createInstance(workbenchTestServices_2.TestNativeTextFileServiceWithEncodingOverrides));
                disposables.add(service.files);
                await fileProvider.mkdir(uri_1.URI.file(testDir));
                for (const fileName in files_2.default) {
                    await fileProvider.writeFile(uri_1.URI.file((0, path_1.join)(testDir, fileName)), files_2.default[fileName], { create: true, overwrite: false, unlock: false, atomic: false });
                }
                return { service, testDir };
            },
            teardown: async () => {
                disposables.clear();
            },
            exists,
            stat,
            readFile,
            detectEncodingByBOM
        });
        async function exists(fsPath) {
            try {
                await fileProvider.readFile(uri_1.URI.file(fsPath));
                return true;
            }
            catch (e) {
                return false;
            }
        }
        async function readFile(fsPath, encoding) {
            const file = await fileProvider.readFile(uri_1.URI.file(fsPath));
            if (!encoding) {
                return buffer_1.VSBuffer.wrap(file);
            }
            return new TextDecoder((0, encoding_1.toCanonicalName)(encoding)).decode(file);
        }
        async function stat(fsPath) {
            return fileProvider.stat(uri_1.URI.file(fsPath));
        }
        async function detectEncodingByBOM(fsPath) {
            try {
                const buffer = await readFile(fsPath);
                return (0, encoding_1.detectEncodingByBOMFromBuffer)(buffer.slice(0, 3), 3);
            }
            catch (error) {
                return null; // ignore errors (like file not found)
            }
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlVGV4dEZpbGVTZXJ2aWNlLmlvLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0ZmlsZS90ZXN0L2VsZWN0cm9uLXNhbmRib3gvbmF0aXZlVGV4dEZpbGVTZXJ2aWNlLmlvLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF1QmhHLEtBQUssQ0FBQyxtQ0FBbUMsRUFBRTtRQUMxQyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxJQUFJLE9BQXlCLENBQUM7UUFDOUIsSUFBSSxZQUE0QyxDQUFDO1FBQ2pELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUV2QixJQUFBLGlDQUFXLEVBQUM7WUFDWCxLQUFLLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ2pCLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBRW5GLE1BQU0sVUFBVSxHQUFHLElBQUksb0JBQWMsRUFBRSxDQUFDO2dCQUN4QyxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUkseUJBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUVqRSxZQUFZLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHNEQUE4QixFQUFFLENBQUMsQ0FBQztnQkFDckUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFFMUUsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO2dCQUMzQyxVQUFVLENBQUMsR0FBRyxDQUFDLG9CQUFZLEVBQUUsV0FBVyxDQUFDLENB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