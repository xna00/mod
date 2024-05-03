/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/checksum/node/checksumService", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/log/common/log"], function (require, exports, assert, network_1, uri_1, utils_1, checksumService_1, fileService_1, diskFileSystemProvider_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Checksum Service', () => {
        let diskFileSystemProvider;
        let fileService;
        setup(() => {
            const logService = new log_1.NullLogService();
            fileService = new fileService_1.FileService(logService);
            diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
        });
        teardown(() => {
            diskFileSystemProvider.dispose();
            fileService.dispose();
        });
        test('checksum', async () => {
            const checksumService = new checksumService_1.ChecksumService(fileService);
            const checksum = await checksumService.checksum(uri_1.URI.file(network_1.FileAccess.asFileUri('vs/platform/checksum/test/node/fixtures/lorem.txt').fsPath));
            assert.ok(checksum === 'd/9bMU0ydNCmc/hg8ItWeiLT/ePnf7gyPRQVGpd6tRI' || checksum === 'eJeeTIS0dzi8MZY+nHhjPBVtNbmGqxfVvgEOB4sqVIc'); // depends on line endings git config
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tzdW1TZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2NoZWNrc3VtL3Rlc3Qvbm9kZS9jaGVja3N1bVNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1FBRTlCLElBQUksc0JBQThDLENBQUM7UUFDbkQsSUFBSSxXQUF5QixDQUFDO1FBRTlCLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLFVBQVUsR0FBRyxJQUFJLG9CQUFjLEVBQUUsQ0FBQztZQUN4QyxXQUFXLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTFDLHNCQUFzQixHQUFHLElBQUksK0NBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDaEUsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGlCQUFPLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFDcEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2Isc0JBQXNCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzQixNQUFNLGVBQWUsR0FBRyxJQUFJLGlDQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFekQsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFlLENBQUMsUUFBUSxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQVUsQ0FBQyxTQUFTLENBQUMsbURBQW1ELENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzVJLE1BQU0sQ0FBQyxFQUFFLENBQUMsUUFBUSxLQUFLLDZDQUE2QyxJQUFJLFFBQVEsS0FBSyw2Q0FBNkMsQ0FBQyxDQUFDLENBQUMscUNBQXFDO1FBQzNLLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=