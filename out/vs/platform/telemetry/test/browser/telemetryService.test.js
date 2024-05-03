define(["require", "exports", "assert", "sinon", "sinon-test", "vs/base/browser/window", "vs/base/common/errors", "vs/base/common/event", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/product/common/product", "vs/platform/telemetry/browser/errorTelemetry", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, assert, sinon, sinonTest, window_1, Errors, event_1, utils_1, testConfigurationService_1, product_1, errorTelemetry_1, telemetryService_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const sinonTestFn = sinonTest(sinon);
    class TestTelemetryAppender {
        constructor() {
            this.events = [];
            this.isDisposed = false;
        }
        log(eventName, data) {
            this.events.push({ eventName, data });
        }
        getEventsCount() {
            return this.events.length;
        }
        flush() {
            this.isDisposed = true;
            return Promise.resolve(null);
        }
    }
    class ErrorTestingSettings {
        constructor() {
            this.randomUserFile = 'a/path/that/doe_snt/con-tain/code/names.js';
            this.anonymizedRandomUserFile = '<REDACTED: user-file-path>';
            this.nodeModulePathToRetain = 'node_modules/path/that/shouldbe/retained/names.js:14:15854';
            this.nodeModuleAsarPathToRetain = 'node_modules.asar/path/that/shouldbe/retained/names.js:14:12354';
            this.personalInfo = 'DANGEROUS/PATH';
            this.importantInfo = 'important/information';
            this.filePrefix = 'file:///';
            this.dangerousPathWithImportantInfo = this.filePrefix + this.personalInfo + '/resources/app/' + this.importantInfo;
            this.dangerousPathWithoutImportantInfo = this.filePrefix + this.personalInfo;
            this.missingModelPrefix = 'Received model events for missing model ';
            this.missingModelMessage = this.missingModelPrefix + ' ' + this.dangerousPathWithoutImportantInfo;
            this.noSuchFilePrefix = 'ENOENT: no such file or directory';
            this.noSuchFileMessage = this.noSuchFilePrefix + ' \'' + this.personalInfo + '\'';
            this.stack = [`at e._modelEvents (${this.randomUserFile}:11:7309)`,
                `    at t.AllWorkers (${this.randomUserFile}:6:8844)`,
                `    at e.(anonymous function) [as _modelEvents] (${this.randomUserFile}:5:29552)`,
                `    at Function.<anonymous> (${this.randomUserFile}:6:8272)`,
                `    at e.dispatch (${this.randomUserFile}:5:26931)`,
                `    at e.request (/${this.nodeModuleAsarPathToRetain})`,
                `    at t._handleMessage (${this.nodeModuleAsarPathToRetain})`,
                `    at t._onmessage (/${this.nodeModulePathToRetain})`,
                `    at t.onmessage (${this.nodeModulePathToRetain})`,
                `    at DedicatedWorkerGlobalScope.self.onmessage`,
                this.dangerousPathWithImportantInfo,
                this.dangerousPathWithoutImportantInfo,
                this.missingModelMessage,
                this.noSuchFileMessage];
        }
    }
    suite('TelemetryService', () => {
        const TestProductService = { _serviceBrand: undefined, ...product_1.default };
        test('Disposing', sinonTestFn(function () {
            const testAppender = new TestTelemetryAppender();
            const service = new telemetryService_1.TelemetryService({ appenders: [testAppender] }, new testConfigurationService_1.TestConfigurationService(), TestProductService);
            service.publicLog('testPrivateEvent');
            assert.strictEqual(testAppender.getEventsCount(), 1);
            service.dispose();
            assert.strictEqual(!testAppender.isDisposed, true);
        }));
        // event reporting
        test('Simple event', sinonTestFn(function () {
            const testAppender = new TestTelemetryAppender();
            const service = new telemetryService_1.TelemetryService({ appenders: [testAppender] }, new testConfigurationService_1.TestConfigurationService(), TestProductService);
            service.publicLog('testEvent');
            assert.strictEqual(testAppender.getEventsCount(), 1);
            assert.strictEqual(testAppender.events[0].eventName, 'testEvent');
            assert.notStrictEqual(testAppender.events[0].data, null);
            service.dispose();
        }));
        test('Event with data', sinonTestFn(function () {
            const testAppender = new TestTelemetryAppender();
            const service = new telemetryService_1.TelemetryService({ appenders: [testAppender] }, new testConfigurationService_1.TestConfigurationService(), TestProductService);
            service.publicLog('testEvent', {
                'stringProp': 'property',
                'numberProp': 1,
                'booleanProp': true,
                'complexProp': {
                    'value': 0
                }
            });
            assert.strictEqual(testAppender.getEventsCount(), 1);
            assert.strictEqual(testAppender.events[0].eventName, 'testEvent');
            assert.notStrictEqual(testAppender.events[0].data, null);
            assert.strictEqual(testAppender.events[0].data['stringProp'], 'property');
            assert.strictEqual(testAppender.events[0].data['numberProp'], 1);
            assert.strictEqual(testAppender.events[0].data['booleanProp'], true);
            assert.strictEqual(testAppender.events[0].data['complexProp'].value, 0);
            service.dispose();
        }));
        test('common properties added to *all* events, simple event', function () {
            const testAppender = new TestTelemetryAppender();
            const service = new telemetryService_1.TelemetryService({
                appenders: [testAppender],
                commonProperties: { foo: 'JA!', get bar() { return Math.random() % 2 === 0; } }
            }, new testConfigurationService_1.TestConfigurationService(), TestProductService);
            service.publicLog('testEvent');
            const [first] = testAppender.events;
            assert.strictEqual(Object.keys(first.data).length, 2);
            assert.strictEqual(typeof first.data['foo'], 'string');
            assert.strictEqual(typeof first.data['bar'], 'boolean');
            service.dispose();
        });
        test('common properties added to *all* events, event with data', function () {
            const testAppender = new TestTelemetryAppender();
            const service = new telemetryService_1.TelemetryService({
                appenders: [testAppender],
                commonProperties: { foo: 'JA!', get bar() { return Math.random() % 2 === 0; } }
            }, new testConfigurationService_1.TestConfigurationService(), TestProductService);
            service.publicLog('testEvent', { hightower: 'xl', price: 8000 });
            const [first] = testAppender.events;
            assert.strictEqual(Object.keys(first.data).length, 4);
            assert.strictEqual(typeof first.data['foo'], 'string');
            assert.strictEqual(typeof first.data['bar'], 'boolean');
            assert.strictEqual(typeof first.data['hightower'], 'string');
            assert.strictEqual(typeof first.data['price'], 'number');
            service.dispose();
        });
        test('TelemetryInfo comes from properties', function () {
            const service = new telemetryService_1.TelemetryService({
                appenders: [telemetryUtils_1.NullAppender],
                commonProperties: {
                    sessionID: 'one',
                    ['common.machineId']: 'three',
                }
            }, new testConfigurationService_1.TestConfigurationService(), TestProductService);
            assert.strictEqual(service.sessionId, 'one');
            assert.strictEqual(service.machineId, 'three');
            service.dispose();
        });
        test('telemetry on by default', function () {
            const testAppender = new TestTelemetryAppender();
            const service = new telemetryService_1.TelemetryService({ appenders: [testAppender] }, new testConfigurationService_1.TestConfigurationService(), TestProductService);
            service.publicLog('testEvent');
            assert.strictEqual(testAppender.getEventsCount(), 1);
            assert.strictEqual(testAppender.events[0].eventName, 'testEvent');
            service.dispose();
        });
        class TestErrorTelemetryService extends telemetryService_1.TelemetryService {
            constructor(config) {
                super({ ...config, sendErrorTelemetry: true }, new testConfigurationService_1.TestConfigurationService, TestProductService);
            }
        }
        test('Error events', sinonTestFn(function () {
            const origErrorHandler = Errors.errorHandler.getUnexpectedErrorHandler();
            Errors.setUnexpectedErrorHandler(() => { });
            try {
                const testAppender = new TestTelemetryAppender();
                const service = new TestErrorTelemetryService({ appenders: [testAppender] });
                const errorTelemetry = new errorTelemetry_1.default(service);
                const e = new Error('This is a test.');
                // for Phantom
                if (!e.stack) {
                    e.stack = 'blah';
                }
                Errors.onUnexpectedError(e);
                this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
                assert.strictEqual(testAppender.getEventsCount(), 1);
                assert.strictEqual(testAppender.events[0].eventName, 'UnhandledError');
                assert.strictEqual(testAppender.events[0].data.msg, 'This is a test.');
                errorTelemetry.dispose();
                service.dispose();
            }
            finally {
                Errors.setUnexpectedErrorHandler(origErrorHandler);
            }
        }));
        // 	test('Unhandled Promise Error events', sinonTestFn(function() {
        //
        // 		let origErrorHandler = Errors.errorHandler.getUnexpectedErrorHandler();
        // 		Errors.setUnexpectedErrorHandler(() => {});
        //
        // 		try {
        // 			let service = new MainTelemetryService();
        // 			let testAppender = new TestTelemetryAppender();
        // 			service.addTelemetryAppender(testAppender);
        //
        // 			winjs.Promise.wrapError(new Error('This should not get logged'));
        // 			winjs.TPromise.as(true).then(() => {
        // 				throw new Error('This should get logged');
        // 			});
        // 			// prevent console output from failing the test
        // 			this.stub(console, 'log');
        // 			// allow for the promise to finish
        // 			this.clock.tick(MainErrorTelemetry.ERROR_FLUSH_TIMEOUT);
        //
        // 			assert.strictEqual(testAppender.getEventsCount(), 1);
        // 			assert.strictEqual(testAppender.events[0].eventName, 'UnhandledError');
        // 			assert.strictEqual(testAppender.events[0].data.msg,  'This should get logged');
        //
        // 			service.dispose();
        // 		} finally {
        // 			Errors.setUnexpectedErrorHandler(origErrorHandler);
        // 		}
        // 	}));
        test('Handle global errors', sinonTestFn(function () {
            const errorStub = sinon.stub();
            window_1.mainWindow.onerror = errorStub;
            const testAppender = new TestTelemetryAppender();
            const service = new TestErrorTelemetryService({ appenders: [testAppender] });
            const errorTelemetry = new errorTelemetry_1.default(service);
            const testError = new Error('test');
            window_1.mainWindow.onerror('Error Message', 'file.js', 2, 42, testError);
            this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
            assert.strictEqual(errorStub.alwaysCalledWithExactly('Error Message', 'file.js', 2, 42, testError), true);
            assert.strictEqual(errorStub.callCount, 1);
            assert.strictEqual(testAppender.getEventsCount(), 1);
            assert.strictEqual(testAppender.events[0].eventName, 'UnhandledError');
            assert.strictEqual(testAppender.events[0].data.msg, 'Error Message');
            assert.strictEqual(testAppender.events[0].data.file, 'file.js');
            assert.strictEqual(testAppender.events[0].data.line, 2);
            assert.strictEqual(testAppender.events[0].data.column, 42);
            assert.strictEqual(testAppender.events[0].data.uncaught_error_msg, 'test');
            errorTelemetry.dispose();
            service.dispose();
            sinon.restore();
        }));
        test('Error Telemetry removes PII from filename with spaces', sinonTestFn(function () {
            const errorStub = sinon.stub();
            window_1.mainWindow.onerror = errorStub;
            const settings = new ErrorTestingSettings();
            const testAppender = new TestTelemetryAppender();
            const service = new TestErrorTelemetryService({ appenders: [testAppender] });
            const errorTelemetry = new errorTelemetry_1.default(service);
            const personInfoWithSpaces = settings.personalInfo.slice(0, 2) + ' ' + settings.personalInfo.slice(2);
            const dangerousFilenameError = new Error('dangerousFilename');
            dangerousFilenameError.stack = settings.stack;
            window_1.mainWindow.onerror('dangerousFilename', settings.dangerousPathWithImportantInfo.replace(settings.personalInfo, personInfoWithSpaces) + '/test.js', 2, 42, dangerousFilenameError);
            this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
            assert.strictEqual(errorStub.callCount, 1);
            assert.strictEqual(testAppender.events[0].data.file.indexOf(settings.dangerousPathWithImportantInfo.replace(settings.personalInfo, personInfoWithSpaces)), -1);
            assert.strictEqual(testAppender.events[0].data.file, settings.importantInfo + '/test.js');
            errorTelemetry.dispose();
            service.dispose();
            sinon.restore();
        }));
        test('Uncaught Error Telemetry removes PII from filename', sinonTestFn(function () {
            const clock = this.clock;
            const errorStub = sinon.stub();
            window_1.mainWindow.onerror = errorStub;
            const settings = new ErrorTestingSettings();
            const testAppender = new TestTelemetryAppender();
            const service = new TestErrorTelemetryService({ appenders: [testAppender] });
            const errorTelemetry = new errorTelemetry_1.default(service);
            let dangerousFilenameError = new Error('dangerousFilename');
            dangerousFilenameError.stack = settings.stack;
            window_1.mainWindow.onerror('dangerousFilename', settings.dangerousPathWithImportantInfo + '/test.js', 2, 42, dangerousFilenameError);
            clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
            assert.strictEqual(errorStub.callCount, 1);
            assert.strictEqual(testAppender.events[0].data.file.indexOf(settings.dangerousPathWithImportantInfo), -1);
            dangerousFilenameError = new Error('dangerousFilename');
            dangerousFilenameError.stack = settings.stack;
            window_1.mainWindow.onerror('dangerousFilename', settings.dangerousPathWithImportantInfo + '/test.js', 2, 42, dangerousFilenameError);
            clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
            assert.strictEqual(errorStub.callCount, 2);
            assert.strictEqual(testAppender.events[0].data.file.indexOf(settings.dangerousPathWithImportantInfo), -1);
            assert.strictEqual(testAppender.events[0].data.file, settings.importantInfo + '/test.js');
            errorTelemetry.dispose();
            service.dispose();
            sinon.restore();
        }));
        test('Unexpected Error Telemetry removes PII', sinonTestFn(function () {
            const origErrorHandler = Errors.errorHandler.getUnexpectedErrorHandler();
            Errors.setUnexpectedErrorHandler(() => { });
            try {
                const settings = new ErrorTestingSettings();
                const testAppender = new TestTelemetryAppender();
                const service = new TestErrorTelemetryService({ appenders: [testAppender] });
                const errorTelemetry = new errorTelemetry_1.default(service);
                const dangerousPathWithoutImportantInfoError = new Error(settings.dangerousPathWithoutImportantInfo);
                dangerousPathWithoutImportantInfoError.stack = settings.stack;
                Errors.onUnexpectedError(dangerousPathWithoutImportantInfoError);
                this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.filePrefix), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.filePrefix), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.stack[4].replace(settings.randomUserFile, settings.anonymizedRandomUserFile)), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.split('\n').length, settings.stack.length);
                errorTelemetry.dispose();
                service.dispose();
            }
            finally {
                Errors.setUnexpectedErrorHandler(origErrorHandler);
            }
        }));
        test('Uncaught Error Telemetry removes PII', sinonTestFn(function () {
            const errorStub = sinon.stub();
            window_1.mainWindow.onerror = errorStub;
            const settings = new ErrorTestingSettings();
            const testAppender = new TestTelemetryAppender();
            const service = new TestErrorTelemetryService({ appenders: [testAppender] });
            const errorTelemetry = new errorTelemetry_1.default(service);
            const dangerousPathWithoutImportantInfoError = new Error('dangerousPathWithoutImportantInfo');
            dangerousPathWithoutImportantInfoError.stack = settings.stack;
            window_1.mainWindow.onerror(settings.dangerousPathWithoutImportantInfo, 'test.js', 2, 42, dangerousPathWithoutImportantInfoError);
            this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
            assert.strictEqual(errorStub.callCount, 1);
            // Test that no file information remains, esp. personal info
            assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.personalInfo), -1);
            assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.filePrefix), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.personalInfo), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.filePrefix), -1);
            assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.stack[4].replace(settings.randomUserFile, settings.anonymizedRandomUserFile)), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.split('\n').length, settings.stack.length);
            errorTelemetry.dispose();
            service.dispose();
            sinon.restore();
        }));
        test('Unexpected Error Telemetry removes PII but preserves Code file path', sinonTestFn(function () {
            const origErrorHandler = Errors.errorHandler.getUnexpectedErrorHandler();
            Errors.setUnexpectedErrorHandler(() => { });
            try {
                const settings = new ErrorTestingSettings();
                const testAppender = new TestTelemetryAppender();
                const service = new TestErrorTelemetryService({ appenders: [testAppender] });
                const errorTelemetry = new errorTelemetry_1.default(service);
                const dangerousPathWithImportantInfoError = new Error(settings.dangerousPathWithImportantInfo);
                dangerousPathWithImportantInfoError.stack = settings.stack;
                // Test that important information remains but personal info does not
                Errors.onUnexpectedError(dangerousPathWithImportantInfoError);
                this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
                assert.notStrictEqual(testAppender.events[0].data.msg.indexOf(settings.importantInfo), -1);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.filePrefix), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.importantInfo), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.filePrefix), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.stack[4].replace(settings.randomUserFile, settings.anonymizedRandomUserFile)), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.split('\n').length, settings.stack.length);
                errorTelemetry.dispose();
                service.dispose();
            }
            finally {
                Errors.setUnexpectedErrorHandler(origErrorHandler);
            }
        }));
        test('Uncaught Error Telemetry removes PII but preserves Code file path', sinonTestFn(function () {
            const errorStub = sinon.stub();
            window_1.mainWindow.onerror = errorStub;
            const settings = new ErrorTestingSettings();
            const testAppender = new TestTelemetryAppender();
            const service = new TestErrorTelemetryService({ appenders: [testAppender] });
            const errorTelemetry = new errorTelemetry_1.default(service);
            const dangerousPathWithImportantInfoError = new Error('dangerousPathWithImportantInfo');
            dangerousPathWithImportantInfoError.stack = settings.stack;
            window_1.mainWindow.onerror(settings.dangerousPathWithImportantInfo, 'test.js', 2, 42, dangerousPathWithImportantInfoError);
            this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
            assert.strictEqual(errorStub.callCount, 1);
            // Test that important information remains but personal info does not
            assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf('(' + settings.nodeModuleAsarPathToRetain), -1);
            assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf('(' + settings.nodeModulePathToRetain), -1);
            assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf('(/' + settings.nodeModuleAsarPathToRetain), -1);
            assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf('(/' + settings.nodeModulePathToRetain), -1);
            assert.notStrictEqual(testAppender.events[0].data.msg.indexOf(settings.importantInfo), -1);
            assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.personalInfo), -1);
            assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.filePrefix), -1);
            assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.importantInfo), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.personalInfo), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.filePrefix), -1);
            assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.stack[4].replace(settings.randomUserFile, settings.anonymizedRandomUserFile)), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.split('\n').length, settings.stack.length);
            errorTelemetry.dispose();
            service.dispose();
            sinon.restore();
        }));
        test('Unexpected Error Telemetry removes PII but preserves Code file path with node modules', sinonTestFn(function () {
            const origErrorHandler = Errors.errorHandler.getUnexpectedErrorHandler();
            Errors.setUnexpectedErrorHandler(() => { });
            try {
                const settings = new ErrorTestingSettings();
                const testAppender = new TestTelemetryAppender();
                const service = new TestErrorTelemetryService({ appenders: [testAppender] });
                const errorTelemetry = new errorTelemetry_1.default(service);
                const dangerousPathWithImportantInfoError = new Error(settings.dangerousPathWithImportantInfo);
                dangerousPathWithImportantInfoError.stack = settings.stack;
                Errors.onUnexpectedError(dangerousPathWithImportantInfoError);
                this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf('(' + settings.nodeModuleAsarPathToRetain), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf('(' + settings.nodeModulePathToRetain), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf('(/' + settings.nodeModuleAsarPathToRetain), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf('(/' + settings.nodeModulePathToRetain), -1);
                errorTelemetry.dispose();
                service.dispose();
            }
            finally {
                Errors.setUnexpectedErrorHandler(origErrorHandler);
            }
        }));
        test('Unexpected Error Telemetry removes PII but preserves Code file path when PIIPath is configured', sinonTestFn(function () {
            const origErrorHandler = Errors.errorHandler.getUnexpectedErrorHandler();
            Errors.setUnexpectedErrorHandler(() => { });
            try {
                const settings = new ErrorTestingSettings();
                const testAppender = new TestTelemetryAppender();
                const service = new TestErrorTelemetryService({ appenders: [testAppender], piiPaths: [settings.personalInfo + '/resources/app/'] });
                const errorTelemetry = new errorTelemetry_1.default(service);
                const dangerousPathWithImportantInfoError = new Error(settings.dangerousPathWithImportantInfo);
                dangerousPathWithImportantInfoError.stack = settings.stack;
                // Test that important information remains but personal info does not
                Errors.onUnexpectedError(dangerousPathWithImportantInfoError);
                this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
                assert.notStrictEqual(testAppender.events[0].data.msg.indexOf(settings.importantInfo), -1);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.filePrefix), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.importantInfo), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.filePrefix), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.stack[4].replace(settings.randomUserFile, settings.anonymizedRandomUserFile)), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.split('\n').length, settings.stack.length);
                errorTelemetry.dispose();
                service.dispose();
            }
            finally {
                Errors.setUnexpectedErrorHandler(origErrorHandler);
            }
        }));
        test('Uncaught Error Telemetry removes PII but preserves Code file path when PIIPath is configured', sinonTestFn(function () {
            const errorStub = sinon.stub();
            window_1.mainWindow.onerror = errorStub;
            const settings = new ErrorTestingSettings();
            const testAppender = new TestTelemetryAppender();
            const service = new TestErrorTelemetryService({ appenders: [testAppender], piiPaths: [settings.personalInfo + '/resources/app/'] });
            const errorTelemetry = new errorTelemetry_1.default(service);
            const dangerousPathWithImportantInfoError = new Error('dangerousPathWithImportantInfo');
            dangerousPathWithImportantInfoError.stack = settings.stack;
            window_1.mainWindow.onerror(settings.dangerousPathWithImportantInfo, 'test.js', 2, 42, dangerousPathWithImportantInfoError);
            this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
            assert.strictEqual(errorStub.callCount, 1);
            // Test that important information remains but personal info does not
            assert.notStrictEqual(testAppender.events[0].data.msg.indexOf(settings.importantInfo), -1);
            assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.personalInfo), -1);
            assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.filePrefix), -1);
            assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.importantInfo), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.personalInfo), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.filePrefix), -1);
            assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.stack[4].replace(settings.randomUserFile, settings.anonymizedRandomUserFile)), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.split('\n').length, settings.stack.length);
            errorTelemetry.dispose();
            service.dispose();
            sinon.restore();
        }));
        test('Unexpected Error Telemetry removes PII but preserves Missing Model error message', sinonTestFn(function () {
            const origErrorHandler = Errors.errorHandler.getUnexpectedErrorHandler();
            Errors.setUnexpectedErrorHandler(() => { });
            try {
                const settings = new ErrorTestingSettings();
                const testAppender = new TestTelemetryAppender();
                const service = new TestErrorTelemetryService({ appenders: [testAppender] });
                const errorTelemetry = new errorTelemetry_1.default(service);
                const missingModelError = new Error(settings.missingModelMessage);
                missingModelError.stack = settings.stack;
                // Test that no file information remains, but this particular
                // error message does (Received model events for missing model)
                Errors.onUnexpectedError(missingModelError);
                this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
                assert.notStrictEqual(testAppender.events[0].data.msg.indexOf(settings.missingModelPrefix), -1);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.filePrefix), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.missingModelPrefix), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.filePrefix), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.stack[4].replace(settings.randomUserFile, settings.anonymizedRandomUserFile)), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.split('\n').length, settings.stack.length);
                errorTelemetry.dispose();
                service.dispose();
            }
            finally {
                Errors.setUnexpectedErrorHandler(origErrorHandler);
            }
        }));
        test('Uncaught Error Telemetry removes PII but preserves Missing Model error message', sinonTestFn(function () {
            const errorStub = sinon.stub();
            window_1.mainWindow.onerror = errorStub;
            const settings = new ErrorTestingSettings();
            const testAppender = new TestTelemetryAppender();
            const service = new TestErrorTelemetryService({ appenders: [testAppender] });
            const errorTelemetry = new errorTelemetry_1.default(service);
            const missingModelError = new Error('missingModelMessage');
            missingModelError.stack = settings.stack;
            window_1.mainWindow.onerror(settings.missingModelMessage, 'test.js', 2, 42, missingModelError);
            this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
            assert.strictEqual(errorStub.callCount, 1);
            // Test that no file information remains, but this particular
            // error message does (Received model events for missing model)
            assert.notStrictEqual(testAppender.events[0].data.msg.indexOf(settings.missingModelPrefix), -1);
            assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.personalInfo), -1);
            assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.filePrefix), -1);
            assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.missingModelPrefix), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.personalInfo), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.filePrefix), -1);
            assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.stack[4].replace(settings.randomUserFile, settings.anonymizedRandomUserFile)), -1);
            assert.strictEqual(testAppender.events[0].data.callstack.split('\n').length, settings.stack.length);
            errorTelemetry.dispose();
            service.dispose();
            sinon.restore();
        }));
        test('Unexpected Error Telemetry removes PII but preserves No Such File error message', sinonTestFn(function () {
            const origErrorHandler = Errors.errorHandler.getUnexpectedErrorHandler();
            Errors.setUnexpectedErrorHandler(() => { });
            try {
                const settings = new ErrorTestingSettings();
                const testAppender = new TestTelemetryAppender();
                const service = new TestErrorTelemetryService({ appenders: [testAppender] });
                const errorTelemetry = new errorTelemetry_1.default(service);
                const noSuchFileError = new Error(settings.noSuchFileMessage);
                noSuchFileError.stack = settings.stack;
                // Test that no file information remains, but this particular
                // error message does (ENOENT: no such file or directory)
                Errors.onUnexpectedError(noSuchFileError);
                this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
                assert.notStrictEqual(testAppender.events[0].data.msg.indexOf(settings.noSuchFilePrefix), -1);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.filePrefix), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.noSuchFilePrefix), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.filePrefix), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.stack[4].replace(settings.randomUserFile, settings.anonymizedRandomUserFile)), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.split('\n').length, settings.stack.length);
                errorTelemetry.dispose();
                service.dispose();
            }
            finally {
                Errors.setUnexpectedErrorHandler(origErrorHandler);
            }
        }));
        test('Uncaught Error Telemetry removes PII but preserves No Such File error message', sinonTestFn(function () {
            const origErrorHandler = Errors.errorHandler.getUnexpectedErrorHandler();
            Errors.setUnexpectedErrorHandler(() => { });
            try {
                const errorStub = sinon.stub();
                window_1.mainWindow.onerror = errorStub;
                const settings = new ErrorTestingSettings();
                const testAppender = new TestTelemetryAppender();
                const service = new TestErrorTelemetryService({ appenders: [testAppender] });
                const errorTelemetry = new errorTelemetry_1.default(service);
                const noSuchFileError = new Error('noSuchFileMessage');
                noSuchFileError.stack = settings.stack;
                window_1.mainWindow.onerror(settings.noSuchFileMessage, 'test.js', 2, 42, noSuchFileError);
                this.clock.tick(errorTelemetry_1.default.ERROR_FLUSH_TIMEOUT);
                assert.strictEqual(errorStub.callCount, 1);
                // Test that no file information remains, but this particular
                // error message does (ENOENT: no such file or directory)
                Errors.onUnexpectedError(noSuchFileError);
                assert.notStrictEqual(testAppender.events[0].data.msg.indexOf(settings.noSuchFilePrefix), -1);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.msg.indexOf(settings.filePrefix), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.noSuchFilePrefix), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.personalInfo), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.indexOf(settings.filePrefix), -1);
                assert.notStrictEqual(testAppender.events[0].data.callstack.indexOf(settings.stack[4].replace(settings.randomUserFile, settings.anonymizedRandomUserFile)), -1);
                assert.strictEqual(testAppender.events[0].data.callstack.split('\n').length, settings.stack.length);
                errorTelemetry.dispose();
                service.dispose();
                sinon.restore();
            }
            finally {
                Errors.setUnexpectedErrorHandler(origErrorHandler);
            }
        }));
        test('Telemetry Service sends events when telemetry is on', sinonTestFn(function () {
            const testAppender = new TestTelemetryAppender();
            const service = new telemetryService_1.TelemetryService({ appenders: [testAppender] }, new testConfigurationService_1.TestConfigurationService(), TestProductService);
            service.publicLog('testEvent');
            assert.strictEqual(testAppender.getEventsCount(), 1);
            service.dispose();
        }));
        test('Telemetry Service checks with config service', function () {
            let telemetryLevel = "off" /* TelemetryConfiguration.OFF */;
            const emitter = new event_1.Emitter();
            const testAppender = new TestTelemetryAppender();
            const service = new telemetryService_1.TelemetryService({
                appenders: [testAppender]
            }, new class extends testConfigurationService_1.TestConfigurationService {
                constructor() {
                    super(...arguments);
                    this.onDidChangeConfiguration = emitter.event;
                }
                getValue() {
                    return telemetryLevel;
                }
            }(), TestProductService);
            assert.strictEqual(service.telemetryLevel, 0 /* TelemetryLevel.NONE */);
            telemetryLevel = "all" /* TelemetryConfiguration.ON */;
            emitter.fire({ affectsConfiguration: () => true });
            assert.strictEqual(service.telemetryLevel, 3 /* TelemetryLevel.USAGE */);
            telemetryLevel = "error" /* TelemetryConfiguration.ERROR */;
            emitter.fire({ affectsConfiguration: () => true });
            assert.strictEqual(service.telemetryLevel, 2 /* TelemetryLevel.ERROR */);
            service.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5U2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvdGVzdC9icm93c2VyL3RlbGVtZXRyeVNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFtQkEsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXJDLE1BQU0scUJBQXFCO1FBSzFCO1lBQ0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDekIsQ0FBQztRQUVNLEdBQUcsQ0FBQyxTQUFpQixFQUFFLElBQVU7WUFDdkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRU0sY0FBYztZQUNwQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLENBQUM7UUFFTSxLQUFLO1lBQ1gsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDdkIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FDRDtJQUVELE1BQU0sb0JBQW9CO1FBZ0J6QjtZQUxPLG1CQUFjLEdBQVcsNENBQTRDLENBQUM7WUFDdEUsNkJBQXdCLEdBQVcsNEJBQTRCLENBQUM7WUFDaEUsMkJBQXNCLEdBQVcsNERBQTRELENBQUM7WUFDOUYsK0JBQTBCLEdBQVcsaUVBQWlFLENBQUM7WUFHN0csSUFBSSxDQUFDLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQztZQUNyQyxJQUFJLENBQUMsYUFBYSxHQUFHLHVCQUF1QixDQUFDO1lBQzdDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFB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QUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRixNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8s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Q3JFLE1BQU0sQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRixNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8s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