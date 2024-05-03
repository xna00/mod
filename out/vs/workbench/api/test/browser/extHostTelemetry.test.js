/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/platform/telemetry/test/common/telemetryLogAppender.test", "vs/workbench/api/common/extHostTelemetry", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, uri_1, utils_1, extensions_1, log_1, telemetryLogAppender_test_1, extHostTelemetry_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostTelemetry', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const mockEnvironment = {
            isExtensionDevelopmentDebug: false,
            extensionDevelopmentLocationURI: undefined,
            extensionTestsLocationURI: undefined,
            appRoot: undefined,
            appName: 'test',
            extensionTelemetryLogResource: uri_1.URI.parse('fake'),
            isExtensionTelemetryLoggingOnly: false,
            appHost: 'test',
            appLanguage: 'en',
            globalStorageHome: uri_1.URI.parse('fake'),
            workspaceStorageHome: uri_1.URI.parse('fake'),
            appUriScheme: 'test',
        };
        const mockTelemetryInfo = {
            firstSessionDate: '2020-01-01T00:00:00.000Z',
            sessionId: 'test',
            machineId: 'test',
            sqmId: 'test'
        };
        const mockRemote = {
            authority: 'test',
            isRemote: false,
            connectionData: null
        };
        const mockExtensionIdentifier = {
            identifier: new extensions_1.ExtensionIdentifier('test-extension'),
            targetPlatform: "universal" /* TargetPlatform.UNIVERSAL */,
            isBuiltin: true,
            isUserBuiltin: true,
            isUnderDevelopment: true,
            name: 'test-extension',
            publisher: 'vscode',
            version: '1.0.0',
            engines: { vscode: '*' },
            extensionLocation: uri_1.URI.parse('fake')
        };
        const createExtHostTelemetry = () => {
            const extensionTelemetry = new extHostTelemetry_1.ExtHostTelemetry(new class extends (0, workbenchTestServices_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.environment = mockEnvironment;
                    this.telemetryInfo = mockTelemetryInfo;
                    this.remote = mockRemote;
                }
            }, new telemetryLogAppender_test_1.TestTelemetryLoggerService(log_1.DEFAULT_LOG_LEVEL));
            store.add(extensionTelemetry);
            extensionTelemetry.$initializeTelemetryLevel(3 /* TelemetryLevel.USAGE */, true, { usage: true, error: true });
            return extensionTelemetry;
        };
        const createLogger = (functionSpy, extHostTelemetry, options) => {
            const extensionTelemetry = extHostTelemetry ?? createExtHostTelemetry();
            // This is the appender which the extension would contribute
            const appender = {
                sendEventData: (eventName, data) => {
                    functionSpy.dataArr.push({ eventName, data });
                },
                sendErrorData: (exception, data) => {
                    functionSpy.exceptionArr.push({ exception, data });
                },
                flush: () => {
                    functionSpy.flushCalled = true;
                }
            };
            if (extHostTelemetry) {
                store.add(extHostTelemetry);
            }
            const logger = extensionTelemetry.instantiateLogger(mockExtensionIdentifier, appender, options);
            store.add(logger);
            return logger;
        };
        test('Validate sender instances', function () {
            assert.throws(() => extHostTelemetry_1.ExtHostTelemetryLogger.validateSender(null));
            assert.throws(() => extHostTelemetry_1.ExtHostTelemetryLogger.validateSender(1));
            assert.throws(() => extHostTelemetry_1.ExtHostTelemetryLogger.validateSender({}));
            assert.throws(() => {
                extHostTelemetry_1.ExtHostTelemetryLogger.validateSender({
                    sendErrorData: () => { },
                    sendEventData: true
                });
            });
            assert.throws(() => {
                extHostTelemetry_1.ExtHostTelemetryLogger.validateSender({
                    sendErrorData: 123,
                    sendEventData: () => { },
                });
            });
            assert.throws(() => {
                extHostTelemetry_1.ExtHostTelemetryLogger.validateSender({
                    sendErrorData: () => { },
                    sendEventData: () => { },
                    flush: true
                });
            });
        });
        test('Ensure logger gets proper telemetry level during initialization', function () {
            const extensionTelemetry = createExtHostTelemetry();
            let config = extensionTelemetry.getTelemetryDetails();
            assert.strictEqual(config.isCrashEnabled, true);
            assert.strictEqual(config.isUsageEnabled, true);
            assert.strictEqual(config.isErrorsEnabled, true);
            // Initialize would never be called twice, but this is just for testing
            extensionTelemetry.$initializeTelemetryLevel(2 /* TelemetryLevel.ERROR */, true, { usage: true, error: true });
            config = extensionTelemetry.getTelemetryDetails();
            assert.strictEqual(config.isCrashEnabled, true);
            assert.strictEqual(config.isUsageEnabled, false);
            assert.strictEqual(config.isErrorsEnabled, true);
            extensionTelemetry.$initializeTelemetryLevel(1 /* TelemetryLevel.CRASH */, true, { usage: true, error: true });
            config = extensionTelemetry.getTelemetryDetails();
            assert.strictEqual(config.isCrashEnabled, true);
            assert.strictEqual(config.isUsageEnabled, false);
            assert.strictEqual(config.isErrorsEnabled, false);
            extensionTelemetry.$initializeTelemetryLevel(3 /* TelemetryLevel.USAGE */, true, { usage: false, error: true });
            config = extensionTelemetry.getTelemetryDetails();
            assert.strictEqual(config.isCrashEnabled, true);
            assert.strictEqual(config.isUsageEnabled, false);
            assert.strictEqual(config.isErrorsEnabled, true);
            extensionTelemetry.dispose();
        });
        test('Simple log event to TelemetryLogger', function () {
            const functionSpy = { dataArr: [], exceptionArr: [], flushCalled: false };
            const logger = createLogger(functionSpy);
            logger.logUsage('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 1);
            assert.strictEqual(functionSpy.dataArr[0].eventName, `${mockExtensionIdentifier.name}/test-event`);
            assert.strictEqual(functionSpy.dataArr[0].data['test-data'], 'test-data');
            logger.logUsage('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 2);
            logger.logError('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 3);
            logger.logError(new Error('test-error'), { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 3);
            assert.strictEqual(functionSpy.exceptionArr.length, 1);
            // Assert not flushed
            assert.strictEqual(functionSpy.flushCalled, false);
            // Call flush and assert that flush occurs
            logger.dispose();
            assert.strictEqual(functionSpy.flushCalled, true);
        });
        test('Simple log event to TelemetryLogger with options', function () {
            const functionSpy = { dataArr: [], exceptionArr: [], flushCalled: false };
            const logger = createLogger(functionSpy, undefined, { additionalCommonProperties: { 'common.foo': 'bar' } });
            logger.logUsage('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 1);
            assert.strictEqual(functionSpy.dataArr[0].eventName, `${mockExtensionIdentifier.name}/test-event`);
            assert.strictEqual(functionSpy.dataArr[0].data['test-data'], 'test-data');
            assert.strictEqual(functionSpy.dataArr[0].data['common.foo'], 'bar');
            logger.logUsage('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 2);
            logger.logError('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 3);
            logger.logError(new Error('test-error'), { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 3);
            assert.strictEqual(functionSpy.exceptionArr.length, 1);
            // Assert not flushed
            assert.strictEqual(functionSpy.flushCalled, false);
            // Call flush and assert that flush occurs
            logger.dispose();
            assert.strictEqual(functionSpy.flushCalled, true);
        });
        test('Log error should get common properties #193205', function () {
            const functionSpy = { dataArr: [], exceptionArr: [], flushCalled: false };
            const logger = createLogger(functionSpy, undefined, { additionalCommonProperties: { 'common.foo': 'bar' } });
            logger.logError(new Error('Test error'));
            assert.strictEqual(functionSpy.exceptionArr.length, 1);
            assert.strictEqual(functionSpy.exceptionArr[0].data['common.foo'], 'bar');
            assert.strictEqual(functionSpy.exceptionArr[0].data['common.product'], 'test');
            logger.logError('test-error-event');
            assert.strictEqual(functionSpy.dataArr.length, 1);
            assert.strictEqual(functionSpy.dataArr[0].data['common.foo'], 'bar');
            assert.strictEqual(functionSpy.dataArr[0].data['common.product'], 'test');
            logger.logError('test-error-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 2);
            assert.strictEqual(functionSpy.dataArr[1].data['common.foo'], 'bar');
            assert.strictEqual(functionSpy.dataArr[1].data['common.product'], 'test');
            logger.logError('test-error-event', { properties: { 'test-data': 'test-data' } });
            assert.strictEqual(functionSpy.dataArr.length, 3);
            assert.strictEqual(functionSpy.dataArr[2].data.properties['common.foo'], 'bar');
            assert.strictEqual(functionSpy.dataArr[2].data.properties['common.product'], 'test');
            logger.dispose();
            assert.strictEqual(functionSpy.flushCalled, true);
        });
        test('Ensure logger properly cleans PII', function () {
            const functionSpy = { dataArr: [], exceptionArr: [], flushCalled: false };
            const logger = createLogger(functionSpy);
            // Log an event with a bunch of PII, this should all get cleaned out
            logger.logUsage('test-event', {
                'fake-password': 'pwd=123',
                'fake-email': 'no-reply@example.com',
                'fake-token': 'token=123',
                'fake-slack-token': 'xoxp-123',
                'fake-path': '/Users/username/.vscode/extensions',
            });
            assert.strictEqual(functionSpy.dataArr.length, 1);
            assert.strictEqual(functionSpy.dataArr[0].eventName, `${mockExtensionIdentifier.name}/test-event`);
            assert.strictEqual(functionSpy.dataArr[0].data['fake-password'], '<REDACTED: Generic Secret>');
            assert.strictEqual(functionSpy.dataArr[0].data['fake-email'], '<REDACTED: Email>');
            assert.strictEqual(functionSpy.dataArr[0].data['fake-token'], '<REDACTED: Generic Secret>');
            assert.strictEqual(functionSpy.dataArr[0].data['fake-slack-token'], '<REDACTED: Slack Token>');
            assert.strictEqual(functionSpy.dataArr[0].data['fake-path'], '<REDACTED: user-file-path>');
        });
        test('Ensure output channel is logged to', function () {
            // Have to re-duplicate code here because I the logger service isn't exposed in the simple setup functions
            const loggerService = new telemetryLogAppender_test_1.TestTelemetryLoggerService(log_1.LogLevel.Trace);
            const extensionTelemetry = new extHostTelemetry_1.ExtHostTelemetry(new class extends (0, workbenchTestServices_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.environment = mockEnvironment;
                    this.telemetryInfo = mockTelemetryInfo;
                    this.remote = mockRemote;
                }
            }, loggerService);
            extensionTelemetry.$initializeTelemetryLevel(3 /* TelemetryLevel.USAGE */, true, { usage: true, error: true });
            const functionSpy = { dataArr: [], exceptionArr: [], flushCalled: false };
            const logger = createLogger(functionSpy, extensionTelemetry);
            // Ensure headers are logged on instantiation
            assert.strictEqual(loggerService.createLogger().logs.length, 2);
            logger.logUsage('test-event', { 'test-data': 'test-data' });
            // Initial header is logged then the event
            assert.strictEqual(loggerService.createLogger().logs.length, 3);
            assert.ok(loggerService.createLogger().logs[2].startsWith('test-extension/test-event'));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlbGVtZXRyeS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9leHRIb3N0VGVsZW1ldHJ5LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFxQmhHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRTtRQUN6QixNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsTUFBTSxlQUFlLEdBQWlCO1lBQ3JDLDJCQUEyQixFQUFFLEtBQUs7WUFDbEMsK0JBQStCLEVBQUUsU0FBUztZQUMxQyx5QkFBeUIsRUFBRSxTQUFTO1lBQ3BDLE9BQU8sRUFBRSxTQUFTO1lBQ2xCLE9BQU8sRUFBRSxNQUFNO1lBQ2YsNkJBQTZCLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDaEQsK0JBQStCLEVBQUUsS0FBSztZQUN0QyxPQUFPLEVBQUUsTUFBTTtZQUNmLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLGlCQUFpQixFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQ3BDLG9CQUFvQixFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQ3ZDLFlBQVksRUFBRSxNQUFNO1NBQ3BCLENBQUM7UUFFRixNQUFNLGlCQUFpQixHQUFHO1lBQ3pCLGdCQUFnQixFQUFFLDBCQUEwQjtZQUM1QyxTQUFTLEVBQUUsTUFBTTtZQUNqQixTQUFTLEVBQUUsTUFBTTtZQUNqQixLQUFLLEVBQUUsTUFBTTtTQUNiLENBQUM7UUFFRixNQUFNLFVBQVUsR0FBRztZQUNsQixTQUFTLEVBQUUsTUFBTTtZQUNqQixRQUFRLEVBQUUsS0FBSztZQUNmLGNBQWMsRUFBRSxJQUFJO1NBQ3BCLENBQUM7UUFFRixNQUFNLHVCQUF1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