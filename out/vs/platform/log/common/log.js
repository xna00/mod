/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls, errorMessage_1, event_1, hash_1, lifecycle_1, map_1, platform_1, resources_1, types_1, uri_1, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CONTEXT_LOG_LEVEL = exports.NullLogService = exports.NullLogger = exports.AbstractLoggerService = exports.MultiplexLogger = exports.AdapterLogger = exports.ConsoleLogger = exports.ConsoleMainLogger = exports.AbstractMessageLogger = exports.AbstractLogger = exports.DEFAULT_LOG_LEVEL = exports.LogLevel = exports.ILoggerService = exports.ILogService = void 0;
    exports.isLogLevel = isLogLevel;
    exports.log = log;
    exports.getLogLevel = getLogLevel;
    exports.LogLevelToString = LogLevelToString;
    exports.LogLevelToLocalizedString = LogLevelToLocalizedString;
    exports.parseLogLevel = parseLogLevel;
    exports.ILogService = (0, instantiation_1.createDecorator)('logService');
    exports.ILoggerService = (0, instantiation_1.createDecorator)('loggerService');
    function now() {
        return new Date().toISOString();
    }
    function isLogLevel(thing) {
        return (0, types_1.isNumber)(thing);
    }
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["Off"] = 0] = "Off";
        LogLevel[LogLevel["Trace"] = 1] = "Trace";
        LogLevel[LogLevel["Debug"] = 2] = "Debug";
        LogLevel[LogLevel["Info"] = 3] = "Info";
        LogLevel[LogLevel["Warning"] = 4] = "Warning";
        LogLevel[LogLevel["Error"] = 5] = "Error";
    })(LogLevel || (exports.LogLevel = LogLevel = {}));
    exports.DEFAULT_LOG_LEVEL = LogLevel.Info;
    function log(logger, level, message) {
        switch (level) {
            case LogLevel.Trace:
                logger.trace(message);
                break;
            case LogLevel.Debug:
                logger.debug(message);
                break;
            case LogLevel.Info:
                logger.info(message);
                break;
            case LogLevel.Warning:
                logger.warn(message);
                break;
            case LogLevel.Error:
                logger.error(message);
                break;
            case LogLevel.Off: /* do nothing */ break;
            default: throw new Error(`Invalid log level ${level}`);
        }
    }
    function format(args, verbose = false) {
        let result = '';
        for (let i = 0; i < args.length; i++) {
            let a = args[i];
            if (a instanceof Error) {
                a = (0, errorMessage_1.toErrorMessage)(a, verbose);
            }
            if (typeof a === 'object') {
                try {
                    a = JSON.stringify(a);
                }
                catch (e) { }
            }
            result += (i > 0 ? ' ' : '') + a;
        }
        return result;
    }
    class AbstractLogger extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.level = exports.DEFAULT_LOG_LEVEL;
            this._onDidChangeLogLevel = this._register(new event_1.Emitter());
            this.onDidChangeLogLevel = this._onDidChangeLogLevel.event;
        }
        setLevel(level) {
            if (this.level !== level) {
                this.level = level;
                this._onDidChangeLogLevel.fire(this.level);
            }
        }
        getLevel() {
            return this.level;
        }
        checkLogLevel(level) {
            return this.level !== LogLevel.Off && this.level <= level;
        }
    }
    exports.AbstractLogger = AbstractLogger;
    class AbstractMessageLogger extends AbstractLogger {
        constructor(logAlways) {
            super();
            this.logAlways = logAlways;
        }
        checkLogLevel(level) {
            return this.logAlways || super.checkLogLevel(level);
        }
        trace(message, ...args) {
            if (this.checkLogLevel(LogLevel.Trace)) {
                this.log(LogLevel.Trace, format([message, ...args], true));
            }
        }
        debug(message, ...args) {
            if (this.checkLogLevel(LogLevel.Debug)) {
                this.log(LogLevel.Debug, format([message, ...args]));
            }
        }
        info(message, ...args) {
            if (this.checkLogLevel(LogLevel.Info)) {
                this.log(LogLevel.Info, format([message, ...args]));
            }
        }
        warn(message, ...args) {
            if (this.checkLogLevel(LogLevel.Warning)) {
                this.log(LogLevel.Warning, format([message, ...args]));
            }
        }
        error(message, ...args) {
            if (this.checkLogLevel(LogLevel.Error)) {
                if (message instanceof Error) {
                    const array = Array.prototype.slice.call(arguments);
                    array[0] = message.stack;
                    this.log(LogLevel.Error, format(array));
                }
                else {
                    this.log(LogLevel.Error, format([message, ...args]));
                }
            }
        }
        flush() { }
    }
    exports.AbstractMessageLogger = AbstractMessageLogger;
    class ConsoleMainLogger extends AbstractLogger {
        constructor(logLevel = exports.DEFAULT_LOG_LEVEL) {
            super();
            this.setLevel(logLevel);
            this.useColors = !platform_1.isWindows;
        }
        trace(message, ...args) {
            if (this.checkLogLevel(LogLevel.Trace)) {
                if (this.useColors) {
                    console.log(`\x1b[90m[main ${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[main ${now()}]`, message, ...args);
                }
            }
        }
        debug(message, ...args) {
            if (this.checkLogLevel(LogLevel.Debug)) {
                if (this.useColors) {
                    console.log(`\x1b[90m[main ${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[main ${now()}]`, message, ...args);
                }
            }
        }
        info(message, ...args) {
            if (this.checkLogLevel(LogLevel.Info)) {
                if (this.useColors) {
                    console.log(`\x1b[90m[main ${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[main ${now()}]`, message, ...args);
                }
            }
        }
        warn(message, ...args) {
            if (this.checkLogLevel(LogLevel.Warning)) {
                if (this.useColors) {
                    console.warn(`\x1b[93m[main ${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.warn(`[main ${now()}]`, message, ...args);
                }
            }
        }
        error(message, ...args) {
            if (this.checkLogLevel(LogLevel.Error)) {
                if (this.useColors) {
                    console.error(`\x1b[91m[main ${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.error(`[main ${now()}]`, message, ...args);
                }
            }
        }
        flush() {
            // noop
        }
    }
    exports.ConsoleMainLogger = ConsoleMainLogger;
    class ConsoleLogger extends AbstractLogger {
        constructor(logLevel = exports.DEFAULT_LOG_LEVEL, useColors = true) {
            super();
            this.useColors = useColors;
            this.setLevel(logLevel);
        }
        trace(message, ...args) {
            if (this.checkLogLevel(LogLevel.Trace)) {
                if (this.useColors) {
                    console.log('%cTRACE', 'color: #888', message, ...args);
                }
                else {
                    console.log(message, ...args);
                }
            }
        }
        debug(message, ...args) {
            if (this.checkLogLevel(LogLevel.Debug)) {
                if (this.useColors) {
                    console.log('%cDEBUG', 'background: #eee; color: #888', message, ...args);
                }
                else {
                    console.log(message, ...args);
                }
            }
        }
        info(message, ...args) {
            if (this.checkLogLevel(LogLevel.Info)) {
                if (this.useColors) {
                    console.log('%c INFO', 'color: #33f', message, ...args);
                }
                else {
                    console.log(message, ...args);
                }
            }
        }
        warn(message, ...args) {
            if (this.checkLogLevel(LogLevel.Warning)) {
                if (this.useColors) {
                    console.log('%c WARN', 'color: #993', message, ...args);
                }
                else {
                    console.log(message, ...args);
                }
            }
        }
        error(message, ...args) {
            if (this.checkLogLevel(LogLevel.Error)) {
                if (this.useColors) {
                    console.log('%c  ERR', 'color: #f33', message, ...args);
                }
                else {
                    console.error(message, ...args);
                }
            }
        }
        flush() {
            // noop
        }
    }
    exports.ConsoleLogger = ConsoleLogger;
    class AdapterLogger extends AbstractLogger {
        constructor(adapter, logLevel = exports.DEFAULT_LOG_LEVEL) {
            super();
            this.adapter = adapter;
            this.setLevel(logLevel);
        }
        trace(message, ...args) {
            if (this.checkLogLevel(LogLevel.Trace)) {
                this.adapter.log(LogLevel.Trace, [this.extractMessage(message), ...args]);
            }
        }
        debug(message, ...args) {
            if (this.checkLogLevel(LogLevel.Debug)) {
                this.adapter.log(LogLevel.Debug, [this.extractMessage(message), ...args]);
            }
        }
        info(message, ...args) {
            if (this.checkLogLevel(LogLevel.Info)) {
                this.adapter.log(LogLevel.Info, [this.extractMessage(message), ...args]);
            }
        }
        warn(message, ...args) {
            if (this.checkLogLevel(LogLevel.Warning)) {
                this.adapter.log(LogLevel.Warning, [this.extractMessage(message), ...args]);
            }
        }
        error(message, ...args) {
            if (this.checkLogLevel(LogLevel.Error)) {
                this.adapter.log(LogLevel.Error, [this.extractMessage(message), ...args]);
            }
        }
        extractMessage(msg) {
            if (typeof msg === 'string') {
                return msg;
            }
            return (0, errorMessage_1.toErrorMessage)(msg, this.checkLogLevel(LogLevel.Trace));
        }
        flush() {
            // noop
        }
    }
    exports.AdapterLogger = AdapterLogger;
    class MultiplexLogger extends AbstractLogger {
        constructor(loggers) {
            super();
            this.loggers = loggers;
            if (loggers.length) {
                this.setLevel(loggers[0].getLevel());
            }
        }
        setLevel(level) {
            for (const logger of this.loggers) {
                logger.setLevel(level);
            }
            super.setLevel(level);
        }
        trace(message, ...args) {
            for (const logger of this.loggers) {
                logger.trace(message, ...args);
            }
        }
        debug(message, ...args) {
            for (const logger of this.loggers) {
                logger.debug(message, ...args);
            }
        }
        info(message, ...args) {
            for (const logger of this.loggers) {
                logger.info(message, ...args);
            }
        }
        warn(message, ...args) {
            for (const logger of this.loggers) {
                logger.warn(message, ...args);
            }
        }
        error(message, ...args) {
            for (const logger of this.loggers) {
                logger.error(message, ...args);
            }
        }
        flush() {
            for (const logger of this.loggers) {
                logger.flush();
            }
        }
        dispose() {
            for (const logger of this.loggers) {
                logger.dispose();
            }
            super.dispose();
        }
    }
    exports.MultiplexLogger = MultiplexLogger;
    class AbstractLoggerService extends lifecycle_1.Disposable {
        constructor(logLevel, logsHome, loggerResources) {
            super();
            this.logLevel = logLevel;
            this.logsHome = logsHome;
            this._loggers = new map_1.ResourceMap();
            this._onDidChangeLoggers = this._register(new event_1.Emitter);
            this.onDidChangeLoggers = this._onDidChangeLoggers.event;
            this._onDidChangeLogLevel = this._register(new event_1.Emitter);
            this.onDidChangeLogLevel = this._onDidChangeLogLevel.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter);
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            if (loggerResources) {
                for (const loggerResource of loggerResources) {
                    this._loggers.set(loggerResource.resource, { logger: undefined, info: loggerResource });
                }
            }
        }
        getLoggerEntry(resourceOrId) {
            if ((0, types_1.isString)(resourceOrId)) {
                return [...this._loggers.values()].find(logger => logger.info.id === resourceOrId);
            }
            return this._loggers.get(resourceOrId);
        }
        getLogger(resourceOrId) {
            return this.getLoggerEntry(resourceOrId)?.logger;
        }
        createLogger(idOrResource, options) {
            const resource = this.toResource(idOrResource);
            const id = (0, types_1.isString)(idOrResource) ? idOrResource : (options?.id ?? (0, hash_1.hash)(resource.toString()).toString(16));
            let logger = this._loggers.get(resource)?.logger;
            const logLevel = options?.logLevel === 'always' ? LogLevel.Trace : options?.logLevel;
            if (!logger) {
                logger = this.doCreateLogger(resource, logLevel ?? this.getLogLevel(resource) ?? this.logLevel, { ...options, id });
            }
            const loggerEntry = {
                logger,
                info: { resource, id, logLevel, name: options?.name, hidden: options?.hidden, extensionId: options?.extensionId, when: options?.when }
            };
            this.registerLogger(loggerEntry.info);
            // TODO: @sandy081 Remove this once registerLogger can take ILogger
            this._loggers.set(resource, loggerEntry);
            return logger;
        }
        toResource(idOrResource) {
            return (0, types_1.isString)(idOrResource) ? (0, resources_1.joinPath)(this.logsHome, `${idOrResource}.log`) : idOrResource;
        }
        setLogLevel(arg1, arg2) {
            if (uri_1.URI.isUri(arg1)) {
                const resource = arg1;
                const logLevel = arg2;
                const logger = this._loggers.get(resource);
                if (logger && logLevel !== logger.info.logLevel) {
                    logger.info.logLevel = logLevel === this.logLevel ? undefined : logLevel;
                    logger.logger?.setLevel(logLevel);
                    this._loggers.set(logger.info.resource, logger);
                    this._onDidChangeLogLevel.fire([resource, logLevel]);
                }
            }
            else {
                this.logLevel = arg1;
                for (const [resource, logger] of this._loggers.entries()) {
                    if (this._loggers.get(resource)?.info.logLevel === undefined) {
                        logger.logger?.setLevel(this.logLevel);
                    }
                }
                this._onDidChangeLogLevel.fire(this.logLevel);
            }
        }
        setVisibility(resourceOrId, visibility) {
            const logger = this.getLoggerEntry(resourceOrId);
            if (logger && visibility !== !logger.info.hidden) {
                logger.info.hidden = !visibility;
                this._loggers.set(logger.info.resource, logger);
                this._onDidChangeVisibility.fire([logger.info.resource, visibility]);
            }
        }
        getLogLevel(resource) {
            let logLevel;
            if (resource) {
                logLevel = this._loggers.get(resource)?.info.logLevel;
            }
            return logLevel ?? this.logLevel;
        }
        registerLogger(resource) {
            const existing = this._loggers.get(resource.resource);
            if (existing) {
                if (existing.info.hidden !== resource.hidden) {
                    this.setVisibility(resource.resource, !resource.hidden);
                }
            }
            else {
                this._loggers.set(resource.resource, { info: resource, logger: undefined });
                this._onDidChangeLoggers.fire({ added: [resource], removed: [] });
            }
        }
        deregisterLogger(resource) {
            const existing = this._loggers.get(resource);
            if (existing) {
                if (existing.logger) {
                    existing.logger.dispose();
                }
                this._loggers.delete(resource);
                this._onDidChangeLoggers.fire({ added: [], removed: [existing.info] });
            }
        }
        *getRegisteredLoggers() {
            for (const entry of this._loggers.values()) {
                yield entry.info;
            }
        }
        getRegisteredLogger(resource) {
            return this._loggers.get(resource)?.info;
        }
        dispose() {
            this._loggers.forEach(logger => logger.logger?.dispose());
            this._loggers.clear();
            super.dispose();
        }
    }
    exports.AbstractLoggerService = AbstractLoggerService;
    class NullLogger {
        constructor() {
            this.onDidChangeLogLevel = new event_1.Emitter().event;
        }
        setLevel(level) { }
        getLevel() { return LogLevel.Info; }
        trace(message, ...args) { }
        debug(message, ...args) { }
        info(message, ...args) { }
        warn(message, ...args) { }
        error(message, ...args) { }
        critical(message, ...args) { }
        dispose() { }
        flush() { }
    }
    exports.NullLogger = NullLogger;
    class NullLogService extends NullLogger {
    }
    exports.NullLogService = NullLogService;
    function getLogLevel(environmentService) {
        if (environmentService.verbose) {
            return LogLevel.Trace;
        }
        if (typeof environmentService.logLevel === 'string') {
            const logLevel = parseLogLevel(environmentService.logLevel.toLowerCase());
            if (logLevel !== undefined) {
                return logLevel;
            }
        }
        return exports.DEFAULT_LOG_LEVEL;
    }
    function LogLevelToString(logLevel) {
        switch (logLevel) {
            case LogLevel.Trace: return 'trace';
            case LogLevel.Debug: return 'debug';
            case LogLevel.Info: return 'info';
            case LogLevel.Warning: return 'warn';
            case LogLevel.Error: return 'error';
            case LogLevel.Off: return 'off';
        }
    }
    function LogLevelToLocalizedString(logLevel) {
        switch (logLevel) {
            case LogLevel.Trace: return { original: 'Trace', value: nls.localize('trace', "Trace") };
            case LogLevel.Debug: return { original: 'Debug', value: nls.localize('debug', "Debug") };
            case LogLevel.Info: return { original: 'Info', value: nls.localize('info', "Info") };
            case LogLevel.Warning: return { original: 'Warning', value: nls.localize('warn', "Warning") };
            case LogLevel.Error: return { original: 'Error', value: nls.localize('error', "Error") };
            case LogLevel.Off: return { original: 'Off', value: nls.localize('off', "Off") };
        }
    }
    function parseLogLevel(logLevel) {
        switch (logLevel) {
            case 'trace':
                return LogLevel.Trace;
            case 'debug':
                return LogLevel.Debug;
            case 'info':
                return LogLevel.Info;
            case 'warn':
                return LogLevel.Warning;
            case 'error':
                return LogLevel.Error;
            case 'critical':
                return LogLevel.Error;
            case 'off':
                return LogLevel.Off;
        }
        return undefined;
    }
    // Contexts
    exports.CONTEXT_LOG_LEVEL = new contextkey_1.RawContextKey('logLevel', LogLevelToString(LogLevel.Info));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9sb2cvY29tbW9uL2xvZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3QmhHLGdDQUVDO0lBOEJELGtCQVVDO0lBZ3BCRCxrQ0FXQztJQUVELDRDQVNDO0lBRUQsOERBU0M7SUFFRCxzQ0FrQkM7SUF0dkJZLFFBQUEsV0FBVyxHQUFHLElBQUEsK0JBQWUsRUFBYyxZQUFZLENBQUMsQ0FBQztJQUN6RCxRQUFBLGNBQWMsR0FBRyxJQUFBLCtCQUFlLEVBQWlCLGVBQWUsQ0FBQyxDQUFDO0lBRS9FLFNBQVMsR0FBRztRQUNYLE9BQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRUQsU0FBZ0IsVUFBVSxDQUFDLEtBQWM7UUFDeEMsT0FBTyxJQUFBLGdCQUFRLEVBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVELElBQVksUUFPWDtJQVBELFdBQVksUUFBUTtRQUNuQixxQ0FBRyxDQUFBO1FBQ0gseUNBQUssQ0FBQTtRQUNMLHlDQUFLLENBQUE7UUFDTCx1Q0FBSSxDQUFBO1FBQ0osNkNBQU8sQ0FBQTtRQUNQLHlDQUFLLENBQUE7SUFDTixDQUFDLEVBUFcsUUFBUSx3QkFBUixRQUFRLFFBT25CO0lBRVksUUFBQSxpQkFBaUIsR0FBYSxRQUFRLENBQUMsSUFBSSxDQUFDO0lBbUJ6RCxTQUFnQixHQUFHLENBQUMsTUFBZSxFQUFFLEtBQWUsRUFBRSxPQUFlO1FBQ3BFLFFBQVEsS0FBSyxFQUFFLENBQUM7WUFDZixLQUFLLFFBQVEsQ0FBQyxLQUFLO2dCQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUNsRCxLQUFLLFFBQVEsQ0FBQyxLQUFLO2dC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