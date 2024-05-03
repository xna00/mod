/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/platform/log/common/log", "vs/base/common/lifecycle"], function (require, exports, uri_1, event_1, log_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteLoggerChannelClient = exports.LoggerChannel = exports.LoggerChannelClient = void 0;
    class LoggerChannelClient extends log_1.AbstractLoggerService {
        constructor(windowId, logLevel, logsHome, loggers, channel) {
            super(logLevel, logsHome, loggers);
            this.windowId = windowId;
            this.channel = channel;
            this._register(channel.listen('onDidChangeLogLevel', windowId)(arg => {
                if ((0, log_1.isLogLevel)(arg)) {
                    super.setLogLevel(arg);
                }
                else {
                    super.setLogLevel(uri_1.URI.revive(arg[0]), arg[1]);
                }
            }));
            this._register(channel.listen('onDidChangeVisibility', windowId)(([resource, visibility]) => super.setVisibility(uri_1.URI.revive(resource), visibility)));
            this._register(channel.listen('onDidChangeLoggers', windowId)(({ added, removed }) => {
                for (const loggerResource of added) {
                    super.registerLogger({ ...loggerResource, resource: uri_1.URI.revive(loggerResource.resource) });
                }
                for (const loggerResource of removed) {
                    super.deregisterLogger(loggerResource.resource);
                }
            }));
        }
        createConsoleMainLogger() {
            return new log_1.AdapterLogger({
                log: (level, args) => {
                    this.channel.call('consoleLog', [level, args]);
                }
            });
        }
        registerLogger(logger) {
            super.registerLogger(logger);
            this.channel.call('registerLogger', [logger, this.windowId]);
        }
        deregisterLogger(resource) {
            super.deregisterLogger(resource);
            this.channel.call('deregisterLogger', [resource, this.windowId]);
        }
        setLogLevel(arg1, arg2) {
            super.setLogLevel(arg1, arg2);
            this.channel.call('setLogLevel', [arg1, arg2]);
        }
        setVisibility(resourceOrId, visibility) {
            super.setVisibility(resourceOrId, visibility);
            this.channel.call('setVisibility', [this.toResource(resourceOrId), visibility]);
        }
        doCreateLogger(file, logLevel, options) {
            return new Logger(this.channel, file, logLevel, options, this.windowId);
        }
        static setLogLevel(channel, arg1, arg2) {
            return channel.call('setLogLevel', [arg1, arg2]);
        }
    }
    exports.LoggerChannelClient = LoggerChannelClient;
    class Logger extends log_1.AbstractMessageLogger {
        constructor(channel, file, logLevel, loggerOptions, windowId) {
            super(loggerOptions?.logLevel === 'always');
            this.channel = channel;
            this.file = file;
            this.isLoggerCreated = false;
            this.buffer = [];
            this.setLevel(logLevel);
            this.channel.call('createLogger', [file, loggerOptions, windowId])
                .then(() => {
                this.doLog(this.buffer);
                this.isLoggerCreated = true;
            });
        }
        log(level, message) {
            const messages = [[level, message]];
            if (this.isLoggerCreated) {
                this.doLog(messages);
            }
            else {
                this.buffer.push(...messages);
            }
        }
        doLog(messages) {
            this.channel.call('log', [this.file, messages]);
        }
    }
    class LoggerChannel {
        constructor(loggerService, getUriTransformer) {
            this.loggerService = loggerService;
            this.getUriTransformer = getUriTransformer;
        }
        listen(context, event) {
            const uriTransformer = this.getUriTransformer(context);
            switch (event) {
                case 'onDidChangeLoggers': return event_1.Event.map(this.loggerService.onDidChangeLoggers, (e) => ({
                    added: [...e.added].map(logger => this.transformLogger(logger, uriTransformer)),
                    removed: [...e.removed].map(logger => this.transformLogger(logger, uriTransformer)),
                }));
                case 'onDidChangeVisibility': return event_1.Event.map(this.loggerService.onDidChangeVisibility, e => [uriTransformer.transformOutgoingURI(e[0]), e[1]]);
                case 'onDidChangeLogLevel': return event_1.Event.map(this.loggerService.onDidChangeLogLevel, e => (0, log_1.isLogLevel)(e) ? e : [uriTransformer.transformOutgoingURI(e[0]), e[1]]);
            }
            throw new Error(`Event not found: ${event}`);
        }
        async call(context, command, arg) {
            const uriTransformer = this.getUriTransformer(context);
            switch (command) {
                case 'setLogLevel': return (0, log_1.isLogLevel)(arg[0]) ? this.loggerService.setLogLevel(arg[0]) : this.loggerService.setLogLevel(uri_1.URI.revive(uriTransformer.transformIncoming(arg[0][0])), arg[0][1]);
                case 'getRegisteredLoggers': return Promise.resolve([...this.loggerService.getRegisteredLoggers()].map(logger => this.transformLogger(logger, uriTransformer)));
            }
            throw new Error(`Call not found: ${command}`);
        }
        transformLogger(logger, transformer) {
            return {
                ...logger,
                resource: transformer.transformOutgoingURI(logger.resource)
            };
        }
    }
    exports.LoggerChannel = LoggerChannel;
    class RemoteLoggerChannelClient extends lifecycle_1.Disposable {
        constructor(loggerService, channel) {
            super();
            channel.call('setLogLevel', [loggerService.getLogLevel()]);
            this._register(loggerService.onDidChangeLogLevel(arg => channel.call('setLogLevel', [arg])));
            channel.call('getRegisteredLoggers').then(loggers => {
                for (const loggerResource of loggers) {
                    loggerService.registerLogger({ ...loggerResource, resource: uri_1.URI.revive(loggerResource.resource) });
                }
            });
            this._register(channel.listen('onDidChangeVisibility')(([resource, visibility]) => loggerService.setVisibility(uri_1.URI.revive(resource), visibility)));
            this._register(channel.listen('onDidChangeLoggers')(({ added, removed }) => {
                for (const loggerResource of added) {
                    loggerService.registerLogger({ ...loggerResource, resource: uri_1.URI.revive(loggerResource.resource) });
                }
                for (const loggerResource of removed) {
                    loggerService.deregisterLogger(loggerResource.resource);
                }
            }));
        }
    }
    exports.RemoteLoggerChannelClient = RemoteLoggerChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9sb2cvY29tbW9uL2xvZ0lwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxtQkFBb0IsU0FBUSwyQkFBcUI7UUFFN0QsWUFBNkIsUUFBNEIsRUFBRSxRQUFrQixFQUFFLFFBQWEsRUFBRSxPQUEwQixFQUFtQixPQUFpQjtZQUMzSixLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQURQLGFBQVEsR0FBUixRQUFRLENBQW9CO1lBQWtGLFlBQU8sR0FBUCxPQUFPLENBQVU7WUFFM0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUE2QixxQkFBcUIsRUFBRSxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDaEcsSUFBSSxJQUFBLGdCQUFVLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDckIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0MsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQWlCLHVCQUF1QixFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMs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