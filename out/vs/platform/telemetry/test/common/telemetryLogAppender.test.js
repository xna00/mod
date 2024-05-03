define(["require", "exports", "assert", "vs/base/common/event", "vs/base/test/common/utils", "vs/platform/environment/common/environment", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetryLogAppender"], function (require, exports, assert, event_1, utils_1, environment_1, instantiationServiceMock_1, log_1, productService_1, telemetryLogAppender_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestTelemetryLoggerService = void 0;
    class TestTelemetryLogger extends log_1.AbstractLogger {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super();
            this.logs = [];
            this.setLevel(logLevel);
        }
        trace(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Trace)) {
                this.logs.push(message + JSON.stringify(args));
            }
        }
        debug(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Debug)) {
                this.logs.push(message);
            }
        }
        info(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Info)) {
                this.logs.push(message);
            }
        }
        warn(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Warning)) {
                this.logs.push(message.toString());
            }
        }
        error(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Error)) {
                this.logs.push(message);
            }
        }
        flush() { }
    }
    class TestTelemetryLoggerService {
        constructor(logLevel) {
            this.logLevel = logLevel;
            this.onDidChangeVisibility = event_1.Event.None;
            this.onDidChangeLogLevel = event_1.Event.None;
            this.onDidChangeLoggers = event_1.Event.None;
        }
        getLogger() {
            return this.logger;
        }
        createLogger() {
            if (!this.logger) {
                this.logger = new TestTelemetryLogger(this.logLevel);
            }
            return this.logger;
        }
        setLogLevel() { }
        getLogLevel() { return log_1.LogLevel.Info; }
        setVisibility() { }
        getDefaultLogLevel() { return this.logLevel; }
        registerLogger() { }
        deregisterLogger() { }
        getRegisteredLoggers() { return []; }
        getRegisteredLogger() { return undefined; }
    }
    exports.TestTelemetryLoggerService = TestTelemetryLoggerService;
    suite('TelemetryLogAdapter', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Do not Log Telemetry if log level is not trace', async () => {
            const testLoggerService = new TestTelemetryLoggerService(log_1.DEFAULT_LOG_LEVEL);
            const testInstantiationService = new instantiationServiceMock_1.TestInstantiationService();
            const testObject = new telemetryLogAppender_1.TelemetryLogAppender(new log_1.NullLogService(), testLoggerService, testInstantiationService.stub(environment_1.IEnvironmentService, {}), testInstantiationService.stub(productService_1.IProductService, {}));
            testObject.log('testEvent', { hello: 'world', isTrue: true, numberBetween1And3: 2 });
            assert.strictEqual(testLoggerService.createLogger().logs.length, 2);
            testObject.dispose();
            testInstantiationService.dispose();
        });
        test('Log Telemetry if log level is trace', async () => {
            const testLoggerService = new TestTelemetryLoggerService(log_1.LogLevel.Trace);
            const testInstantiationService = new instantiationServiceMock_1.TestInstantiationService();
            const testObject = new telemetryLogAppender_1.TelemetryLogAppender(new log_1.NullLogService(), testLoggerService, testInstantiationService.stub(environment_1.IEnvironmentService, {}), testInstantiationService.stub(productService_1.IProductService, {}));
            testObject.log('testEvent', { hello: 'world', isTrue: true, numberBetween1And3: 2 });
            assert.strictEqual(testLoggerService.createLogger().logs[2], 'telemetry/testEvent' + JSON.stringify([{
                    properties: {
                        hello: 'world',
                    },
                    measurements: {
                        isTrue: 1, numberBetween1And3: 2
                    }
                }]));
            testObject.dispose();
            testInstantiationService.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5TG9nQXBwZW5kZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVsZW1ldHJ5L3Rlc3QvY29tbW9uL3RlbGVtZXRyeUxvZ0FwcGVuZGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQWFBLE1BQU0sbUJBQW9CLFNBQVEsb0JBQWM7UUFJL0MsWUFBWSxXQUFxQix1QkFBaUI7WUFDakQsS0FBSyxFQUFFLENBQUM7WUFIRixTQUFJLEdBQWEsRUFBRSxDQUFDO1lBSTFCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFlLEVBQUUsR0FBRyxJQUFXO1lBQ3BDLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNoRCxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFlLEVBQUUsR0FBRyxJQUFXO1lBQ3BDLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVztZQUNuQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lB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