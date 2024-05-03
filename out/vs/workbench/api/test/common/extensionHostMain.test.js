/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/errors", "vs/base/common/platform", "vs/base/common/ternarySearchTree", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTelemetry", "vs/workbench/api/common/extensionHostMain", "vs/workbench/services/extensions/common/extensions"], function (require, exports, assert, errors_1, platform_1, ternarySearchTree_1, mock_1, utils_1, instantiationService_1, serviceCollection_1, log_1, extHostExtensionService_1, extHostRpcService_1, extHostTelemetry_1, extensionHostMain_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionHostMain#ErrorHandler - Wrapping prepareStackTrace can cause slowdown and eventual stack overflow #184926 ', function () {
        if (platform_1.isFirefox || platform_1.isSafari) {
            return;
        }
        const extensionsIndex = ternarySearchTree_1.TernarySearchTree.forUris();
        const mainThreadExtensionsService = new class extends (0, mock_1.mock)() {
            $onExtensionRuntimeError(extensionId, data) {
            }
        };
        const collection = new serviceCollection_1.ServiceCollection([log_1.ILogService, new log_1.NullLogService()], [extHostTelemetry_1.IExtHostTelemetry, new class extends (0, mock_1.mock)() {
                onExtensionError(extension, error) {
                    return true;
                }
            }], [extHostExtensionService_1.IExtHostExtensionService, new class extends (0, mock_1.mock)() {
                getExtensionPathIndex() {
                    return new class extends extHostExtensionService_1.ExtensionPaths {
                        findSubstr(key) {
                            findSubstrCount++;
                            return extensions_1.nullExtensionDescription;
                        }
                    }(extensionsIndex);
                }
            }], [extHostRpcService_1.IExtHostRpcService, new class extends (0, mock_1.mock)() {
                getProxy(identifier) {
                    return mainThreadExtensionsService;
                }
            }]);
        const originalPrepareStackTrace = Error.prepareStackTrace;
        const insta = new instantiationService_1.InstantiationService(collection, false);
        let existingErrorHandler;
        let findSubstrCount = 0;
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suiteSetup(async function () {
            existingErrorHandler = errors_1.errorHandler.getUnexpectedErrorHandler();
            await insta.invokeFunction(extensionHostMain_1.ErrorHandler.installFullHandler);
        });
        suiteTeardown(function () {
            errors_1.errorHandler.setUnexpectedErrorHandler(existingErrorHandler);
        });
        setup(async function () {
            findSubstrCount = 0;
        });
        teardown(() => {
            Error.prepareStackTrace = originalPrepareStackTrace;
        });
        test('basics', function () {
            const err = new Error('test1');
            (0, errors_1.onUnexpectedError)(err);
            assert.strictEqual(findSubstrCount, 1);
        });
        test('set/reset prepareStackTrace-callback', function () {
            const original = Error.prepareStackTrace;
            Error.prepareStackTrace = (_error, _stack) => 'stack';
            const probeErr = new Error();
            const stack = probeErr.stack;
            assert.ok(stack);
            Error.prepareStackTrace = original;
            assert.strictEqual(findSubstrCount, 1);
            // already checked
            (0, errors_1.onUnexpectedError)(probeErr);
            assert.strictEqual(findSubstrCount, 1);
            // one more error
            const err = new Error('test2');
            (0, errors_1.onUnexpectedError)(err);
            assert.strictEqual(findSubstrCount, 2);
        });
        test('wrap prepareStackTrace-callback', function () {
            function do_something_else(params) {
                return params;
            }
            const original = Error.prepareStackTrace;
            Error.prepareStackTrace = (...args) => {
                return do_something_else(original?.(...args));
            };
            const probeErr = new Error();
            const stack = probeErr.stack;
            assert.ok(stack);
            (0, errors_1.onUnexpectedError)(probeErr);
            assert.strictEqual(findSubstrCount, 1);
        });
        test('prevent rewrapping', function () {
            let do_something_count = 0;
            function do_something(params) {
                do_something_count++;
            }
            Error.prepareStackTrace = (result, stack) => {
                do_something(stack);
                return 'fakestack';
            };
            for (let i = 0; i < 2_500; ++i) {
                Error.prepareStackTrace = Error.prepareStackTrace;
            }
            const probeErr = new Error();
            const stack = probeErr.stack;
            assert.strictEqual(stack, 'fakestack');
            (0, errors_1.onUnexpectedError)(probeErr);
            assert.strictEqual(findSubstrCount, 1);
            const probeErr2 = new Error();
            (0, errors_1.onUnexpectedError)(probeErr2);
            assert.strictEqual(findSubstrCount, 2);
            assert.strictEqual(do_something_count, 2);
        });
        suite('https://gist.github.com/thecrypticace/f0f2e182082072efdaf0f8e1537d2cce', function () {
            test("Restored, separate operations", () => {
                // Actual Test
                let original;
                // Operation 1
                original = Error.prepareStackTrace;
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                const err1 = new Error();
                assert.ok(err1.stack);
                assert.strictEqual(findSubstrCount, 1);
                Error.prepareStackTrace = original;
                // Operation 2
                original = Error.prepareStackTrace;
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                assert.strictEqual(findSubstrCount, 2);
                Error.prepareStackTrace = original;
                // Operation 3
                original = Error.prepareStackTrace;
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                assert.strictEqual(findSubstrCount, 3);
                Error.prepareStackTrace = original;
                // Operation 4
                original = Error.prepareStackTrace;
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                assert.strictEqual(findSubstrCount, 4);
                Error.prepareStackTrace = original;
                // Back to Operation 1
                assert.ok(err1.stack);
                assert.strictEqual(findSubstrCount, 4);
            });
            test("Never restored, separate operations", () => {
                // Operation 1
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                // Operation 2
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                // Operation 3
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                // Operation 4
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
            });
            test("Restored, too many uses before restoration", async () => {
                const original = Error.prepareStackTrace;
                Error.prepareStackTrace = (_, stack) => stack;
                // Operation 1 — more uses of `prepareStackTrace`
                for (let i = 0; i < 10_000; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                Error.prepareStackTrace = original;
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdE1haW4udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2NvbW1vbi9leHRlbnNpb25Ib3N0TWFpbi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxLQUFLLENBQUMscUhBQXFILEVBQUU7UUFFNUgsSUFBSSxvQkFBUyxJQUFJLG1CQUFRLEVBQUUsQ0FBQztZQUMzQixPQUFPO1FBQ1IsQ0FBQztRQUVELE1BQU0sZUFBZSxHQUFHLHFDQUFpQixDQUFDLE9BQU8sRUFBeUIsQ0FBQztRQUMzRSxNQUFNLDJCQUEyQixHQUFHLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUFtQztZQUNuRix3QkFBd0IsQ0FBQyxXQUFnQyxFQUFFLElBQXFCO1lBRXpGLENBQUM7U0FDRCxDQUFDO1FBRUYsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQ0FBaUIsQ0FDdkMsQ0FBQyxpQkFBVyxFQUFFLElBQUksb0JBQWMsRUFBRSxDQUFDLEVBQ25DLENBQUMsb0NBQWlCLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQXFCO2dCQUVyRCxnQkFBZ0IsQ0FBQyxTQUE4QixFQUFFLEtBQVk7b0JBQ3JFLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7YUFDRCxDQUFDLEVBQ0YsQ0FBQyxrREFBd0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBa0M7Z0JBRWxGLHFCQUFxQjtvQkFDcEIsT0FBTyxJQUFJLEtBQU0sU0FBUSx3Q0FBYzt3QkFDN0IsVUFBVSxDQUFDLEdBQVE7NEJBQzNCLGVBQWUsRUFBRSxDQUFDOzRCQUNsQixPQUFPLHFDQUF3QixDQUFDO3dCQUNqQyxDQUFDO3FCQUVELENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ3BCLENBQUM7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