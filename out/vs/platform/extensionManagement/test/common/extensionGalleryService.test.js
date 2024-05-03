/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/test/common/mock", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/externalServices/common/marketplace", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/base/test/common/utils"], function (require, exports, assert, resources_1, uri_1, uuid_1, mock_1, testConfigurationService_1, extensionGalleryService_1, fileService_1, inMemoryFilesystemProvider_1, log_1, product_1, marketplace_1, storage_1, telemetry_1, telemetryUtils_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EnvironmentServiceMock extends (0, mock_1.mock)() {
        constructor(serviceMachineIdResource) {
            super();
            this.serviceMachineIdResource = serviceMachineIdResource;
            this.isBuilt = true;
        }
    }
    suite('Extension Gallery Service', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let fileService, environmentService, storageService, productService, configurationService;
        setup(() => {
            const serviceMachineIdResource = (0, resources_1.joinPath)(uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }), 'machineid');
            environmentService = new EnvironmentServiceMock(serviceMachineIdResource);
            fileService = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(serviceMachineIdResource.scheme, fileSystemProvider));
            storageService = disposables.add(new storage_1.InMemoryStorageService());
            configurationService = new testConfigurationService_1.TestConfigurationService({ [telemetry_1.TELEMETRY_SETTING_ID]: "all" /* TelemetryConfiguration.ON */ });
            configurationService.updateValue(telemetry_1.TELEMETRY_SETTING_ID, "all" /* TelemetryConfiguration.ON */);
            productService = { _serviceBrand: undefined, ...product_1.default, enableTelemetry: true };
        });
        test('marketplace machine id', async () => {
            const headers = await (0, marketplace_1.resolveMarketplaceHeaders)(product_1.default.version, productService, environmentService, configurationService, fileService, storageService, telemetryUtils_1.NullTelemetryService);
            assert.ok((0, uuid_1.isUUID)(headers['X-Market-User-Id']));
            const headers2 = await (0, marketplace_1.resolveMarketplaceHeaders)(product_1.default.version, productService, environmentService, configurationService, fileService, storageService, telemetryUtils_1.NullTelemetryService);
            assert.strictEqual(headers['X-Market-User-Id'], headers2['X-Market-User-Id']);
        });
        test('sorting single extension version without target platform', async () => {
            const actual = [aExtensionVersion('1.1.2')];
            const expected = [...actual];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "darwin-x64" /* TargetPlatform.DARWIN_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting single extension version with preferred target platform', async () => {
            const actual = [aExtensionVersion('1.1.2', "darwin-x64" /* TargetPlatform.DARWIN_X64 */)];
            const expected = [...actual];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "darwin-x64" /* TargetPlatform.DARWIN_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting single extension version with not compatible target platform', async () => {
            const actual = [aExtensionVersion('1.1.2', "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */)];
            const expected = [...actual];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-x64" /* TargetPlatform.WIN32_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting multiple extension versions without target platforms', async () => {
            const actual = [aExtensionVersion('1.2.4'), aExtensionVersion('1.1.3'), aExtensionVersion('1.1.2'), aExtensionVersion('1.1.1')];
            const expected = [...actual];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-arm64" /* TargetPlatform.WIN32_ARM64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting multiple extension versions with target platforms - 1', async () => {
            const actual = [aExtensionVersion('1.2.4', "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */), aExtensionVersion('1.2.4', "win32-arm64" /* TargetPlatform.WIN32_ARM64 */), aExtensionVersion('1.2.4', "linux-arm64" /* TargetPlatform.LINUX_ARM64 */), aExtensionVersion('1.1.3'), aExtensionVersion('1.1.2'), aExtensionVersion('1.1.1')];
            const expected = [actual[1], actual[0], actual[2], actual[3], actual[4], actual[5]];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-arm64" /* TargetPlatform.WIN32_ARM64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting multiple extension versions with target platforms - 2', async () => {
            const actual = [aExtensionVersion('1.2.4'), aExtensionVersion('1.2.3', "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */), aExtensionVersion('1.2.3', "win32-arm64" /* TargetPlatform.WIN32_ARM64 */), aExtensionVersion('1.2.3', "linux-arm64" /* TargetPlatform.LINUX_ARM64 */), aExtensionVersion('1.1.2'), aExtensionVersion('1.1.1')];
            const expected = [actual[0], actual[3], actual[1], actual[2], actual[4], actual[5]];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "linux-arm64" /* TargetPlatform.LINUX_ARM64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting multiple extension versions with target platforms - 3', async () => {
            const actual = [aExtensionVersion('1.2.4'), aExtensionVersion('1.1.2'), aExtensionVersion('1.1.1'), aExtensionVersion('1.0.0', "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */), aExtensionVersion('1.0.0', "win32-arm64" /* TargetPlatform.WIN32_ARM64 */)];
            const expected = [actual[0], actual[1], actual[2], actual[4], actual[3]];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-arm64" /* TargetPlatform.WIN32_ARM64 */);
            assert.deepStrictEqual(actual, expected);
        });
        function aExtensionVersion(version, targetPlatform) {
            return { version, targetPlatform };
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uR2FsbGVyeVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uTWFuYWdlbWVudC90ZXN0L2NvbW1vbi9leHRlbnNpb25HYWxsZXJ5U2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBd0JoRyxNQUFNLHNCQUF1QixTQUFRLElBQUEsV0FBSSxHQUF1QjtRQUUvRCxZQUFZLHdCQUE2QjtZQUN4QyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyx3QkFBd0IsR0FBRyx3QkFBd0IsQ0FBQztZQUN6RCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNyQixDQUFDO0tBQ0Q7SUFFRCxLQUFLLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1FBQ3ZDLE1BQU0sV0FBVyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUM5RCxJQUFJLFdBQXlCLEVBQUUsa0JBQXVDLEVBQUUsY0FBK0IsRUFBRSxjQUErQixFQUFFLG9CQUEyQyxDQUFDO1FBRXRMLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLHdCQUF3QixHQUFHLElBQUEsb0JBQVEsRUFBQyxTQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzNHLGtCQUFrQixHQUFHLElBQUksc0JBQXNCLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUMxRSxXQUFXLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHlCQUFXLENBQUMsSUFBSSxvQkFBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sa0JBQWtCLEdBQUcsV0FBVyxDQUFD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