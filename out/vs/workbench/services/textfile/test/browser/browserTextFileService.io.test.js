/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/log/common/log", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/base/common/lifecycle", "vs/platform/instantiation/common/serviceCollection", "vs/platform/files/common/files", "vs/base/common/uri", "vs/base/common/path", "vs/workbench/services/textfile/common/encoding", "vs/base/common/buffer", "vs/workbench/services/textfile/test/common/fixtures/files", "vs/workbench/services/textfile/test/common/textFileService.io.test", "vs/base/common/platform", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/uriIdentity/common/uriIdentityService", "vs/base/test/common/utils"], function (require, exports, workbenchTestServices_1, log_1, fileService_1, network_1, lifecycle_1, serviceCollection_1, files_1, uri_1, path_1, encoding_1, buffer_1, files_2, textFileService_io_test_1, platform_1, workingCopyFileService_1, workingCopyService_1, uriIdentityService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // optimization: we don't need to run this suite in native environment,
    // because we have nativeTextFileService.io.test.ts for it,
    // so our tests run faster
    if (platform_1.isWeb) {
        suite('Files - BrowserTextFileService i/o', function () {
            const disposables = new lifecycle_1.DisposableStore();
            let service;
            let fileProvider;
            const testDir = 'test';
            (0, textFileService_io_test_1.default)({
                setup: async () => {
                    const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
                    const logService = new log_1.NullLogService();
                    const fileService = disposables.add(new fileService_1.FileService(logService));
                    fileProvider = disposables.add(new workbenchTestServices_1.TestInMemoryFileSystemProvider());
                    disposables.add(fileService.registerProvider(network_1.Schemas.file, fileProvider));
                    const collection = new serviceCollection_1.ServiceCollection();
                    collection.set(files_1.IFileService, fileService);
                    collection.set(workingCopyFileService_1.IWorkingCopyFileService, disposables.add(new workingCopyFileService_1.WorkingCopyFileService(fileService, disposables.add(new workingCopyService_1.WorkingCopyService()), instantiationService, disposables.add(new uriIdentityService_1.UriIdentityService(fileService)))));
                    service = disposables.add(instantiationService.createChild(collection).createInstance(workbenchTestServices_1.TestBrowserTextFileServiceWithEncodingOverrides));
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
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlclRleHRGaWxlU2VydmljZS5pby50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dGZpbGUvdGVzdC9icm93c2VyL2Jyb3dzZXJUZXh0RmlsZVNlcnZpY2UuaW8udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXVCaEcsdUVBQXVFO0lBQ3ZFLDJEQUEyRDtJQUMzRCwwQkFBMEI7SUFDMUIsSUFBSSxnQkFBSyxFQUFFLENBQUM7UUFDWCxLQUFLLENBQUMsb0NBQW9DLEVBQUU7WUFDM0MsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMsSUFBSSxPQUF5QixDQUFDO1lBQzlCLElBQUksWUFBNEMsQ0FBQztZQUNqRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFFdkIsSUFBQSxpQ0FBVyxFQUFDO2dCQUNYLEtBQUssRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDakIsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLHFEQUE2QixFQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFFbkYsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQkFBYyxFQUFFLENBQUM7b0JBQ3hDLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBRWpFLFlBQVksR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksc0RBQThCLEVBQUUsQ0FBQyxDQUFDO29CQUNyRSxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBTyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO29CQUUxRSxNQUFNLFVBQVUsR0FBRyxJQUFJLHFDQUFpQixF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