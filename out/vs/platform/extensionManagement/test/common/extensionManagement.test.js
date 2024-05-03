define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil"], function (require, exports, assert, utils_1, extensionManagement_1, extensionManagementUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Extension Identifier Pattern', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('extension identifier pattern', () => {
            const regEx = new RegExp(extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN);
            assert.strictEqual(true, regEx.test('publisher.name'));
            assert.strictEqual(true, regEx.test('publiSher.name'));
            assert.strictEqual(true, regEx.test('publisher.Name'));
            assert.strictEqual(true, regEx.test('PUBLISHER.NAME'));
            assert.strictEqual(true, regEx.test('PUBLISHEr.NAMe'));
            assert.strictEqual(true, regEx.test('PUBLISHEr.N-AMe'));
            assert.strictEqual(true, regEx.test('PUB-LISHEr.NAMe'));
            assert.strictEqual(true, regEx.test('PUB-LISHEr.N-AMe'));
            assert.strictEqual(true, regEx.test('PUBLISH12Er90.N-A54Me123'));
            assert.strictEqual(true, regEx.test('111PUBLISH12Er90.N-1111A54Me123'));
            assert.strictEqual(false, regEx.test('publishername'));
            assert.strictEqual(false, regEx.test('-publisher.name'));
            assert.strictEqual(false, regEx.test('publisher.-name'));
            assert.strictEqual(false, regEx.test('-publisher.-name'));
            assert.strictEqual(false, regEx.test('publ_isher.name'));
            assert.strictEqual(false, regEx.test('publisher._name'));
        });
        test('extension key', () => {
            assert.strictEqual(new extensionManagementUtil_1.ExtensionKey({ id: 'pub.extension-name' }, '1.0.1').toString(), 'pub.extension-name-1.0.1');
            assert.strictEqual(new extensionManagementUtil_1.ExtensionKey({ id: 'pub.extension-name' }, '1.0.1', "undefined" /* TargetPlatform.UNDEFINED */).toString(), 'pub.extension-name-1.0.1');
            assert.strictEqual(new extensionManagementUtil_1.ExtensionKey({ id: 'pub.extension-name' }, '1.0.1', "win32-x64" /* TargetPlatform.WIN32_X64 */).toString(), `pub.extension-name-1.0.1-${"win32-x64" /* TargetPlatform.WIN32_X64 */}`);
        });
        test('extension key parsing', () => {
            assert.strictEqual(extensionManagementUtil_1.ExtensionKey.parse('pub.extension-name'), null);
            assert.strictEqual(extensionManagementUtil_1.ExtensionKey.parse('pub.extension-name@1.2.3'), null);
            assert.strictEqual(extensionManagementUtil_1.ExtensionKey.parse('pub.extension-name-1.0.1')?.toString(), 'pub.extension-name-1.0.1');
            assert.strictEqual(extensionManagementUtil_1.ExtensionKey.parse('pub.extension-name-1.0.1-win32-x64')?.toString(), 'pub.extension-name-1.0.1-win32-x64');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25NYW5hZ2VtZW50L3Rlc3QvY29tbW9uL2V4dGVuc2lvbk1hbmFnZW1lbnQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFVQSxLQUFLLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1FBRTFDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1lBQ3pDLE1BQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLGtEQUE0QixDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxD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