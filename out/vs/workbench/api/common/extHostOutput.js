/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "./extHost.protocol", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/services/output/common/output", "vs/workbench/api/common/extHostFileSystemConsumer", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostFileSystemInfo", "vs/base/common/date", "vs/base/common/buffer", "vs/base/common/types", "vs/platform/files/common/files", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, extHost_protocol_1, instantiation_1, extHostRpcService_1, extensions_1, log_1, output_1, extHostFileSystemConsumer_1, extHostInitDataService_1, extHostFileSystemInfo_1, date_1, buffer_1, types_1, files_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostOutputService = exports.ExtHostOutputService = void 0;
    class ExtHostOutputChannel extends log_1.AbstractMessageLogger {
        get disposed() { return this._disposed; }
        constructor(id, name, logger, proxy, extension) {
            super();
            this.id = id;
            this.name = name;
            this.logger = logger;
            this.proxy = proxy;
            this.extension = extension;
            this.offset = 0;
            this._disposed = false;
            this.visible = false;
            this.setLevel(logger.getLevel());
            this._register(logger.onDidChangeLogLevel(level => this.setLevel(level)));
        }
        get logLevel() {
            return this.getLevel();
        }
        appendLine(value) {
            this.append(value + '\n');
        }
        append(value) {
            this.info(value);
        }
        clear() {
            const till = this.offset;
            this.logger.flush();
            this.proxy.$update(this.id, output_1.OutputChannelUpdateMode.Clear, till);
        }
        replace(value) {
            const till = this.offset;
            this.info(value);
            this.proxy.$update(this.id, output_1.OutputChannelUpdateMode.Replace, till);
            if (this.visible) {
                this.logger.flush();
            }
        }
        show(columnOrPreserveFocus, preserveFocus) {
            this.logger.flush();
            this.proxy.$reveal(this.id, !!(typeof columnOrPreserveFocus === 'boolean' ? columnOrPreserveFocus : preserveFocus));
        }
        hide() {
            this.proxy.$close(this.id);
        }
        log(level, message) {
            this.offset += buffer_1.VSBuffer.fromString(message).byteLength;
            (0, log_1.log)(this.logger, level, message);
            if (this.visible) {
                this.logger.flush();
                this.proxy.$update(this.id, output_1.OutputChannelUpdateMode.Append);
            }
        }
        dispose() {
            super.dispose();
            if (!this._disposed) {
                this.proxy.$dispose(this.id);
                this._disposed = true;
            }
        }
    }
    class ExtHostLogOutputChannel extends ExtHostOutputChannel {
        appendLine(value) {
            this.append(value);
        }
    }
    let ExtHostOutputService = class ExtHostOutputService {
        constructor(extHostRpc, initData, extHostFileSystem, extHostFileSystemInfo, loggerService, logService) {
            this.initData = initData;
            this.extHostFileSystem = extHostFileSystem;
            this.extHostFileSystemInfo = extHostFileSystemInfo;
            this.loggerService = loggerService;
            this.logService = logService;
            this.extensionLogDirectoryPromise = new Map();
            this.namePool = 1;
            this.channels = new Map();
            this.visibleChannelId = null;
            this.proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadOutputService);
            this.outputsLocation = this.extHostFileSystemInfo.extUri.joinPath(initData.logsLocation, `output_logging_${(0, date_1.toLocalISOString)(new Date()).replace(/-|:|\.\d+Z$/g, '')}`);
        }
        $setVisibleChannel(visibleChannelId) {
            this.visibleChannelId = visibleChannelId;
            for (const [id, channel] of this.channels) {
                channel.visible = id === this.visibleChannelId;
            }
        }
        createOutputChannel(name, options, extension) {
            name = name.trim();
            if (!name) {
                throw new Error('illegal argument `name`. must not be falsy');
            }
            const log = typeof options === 'object' && options.log;
            const languageId = (0, types_1.isString)(options) ? options : undefined;
            if ((0, types_1.isString)(languageId) && !languageId.trim()) {
                throw new Error('illegal argument `languageId`. must not be empty');
            }
            let logLevel;
            const logLevelValue = this.initData.environment.extensionLogLevel?.find(([identifier]) => extensions_1.ExtensionIdentifier.equals(extension.identifier, identifier))?.[1];
            if (logLevelValue) {
                logLevel = (0, log_1.parseLogLevel)(logLevelValue);
            }
            const extHostOutputChannel = log ? this.doCreateLogOutputChannel(name, logLevel, extension) : this.doCreateOutputChannel(name, languageId, extension);
            extHostOutputChannel.then(channel => {
                this.channels.set(channel.id, channel);
                channel.visible = channel.id === this.visibleChannelId;
            });
            return log ? this.createExtHostLogOutputChannel(name, logLevel ?? this.logService.getLevel(), extHostOutputChannel) : this.createExtHostOutputChannel(name, extHostOutputChannel);
        }
        async doCreateOutputChannel(name, languageId, extension) {
            if (!this.outputDirectoryPromise) {
                this.outputDirectoryPromise = this.extHostFileSystem.value.createDirectory(this.outputsLocation).then(() => this.outputsLocation);
            }
            const outputDir = await this.outputDirectoryPromise;
            const file = this.extHostFileSystemInfo.extUri.joinPath(outputDir, `${this.namePool++}-${name.replace(/[\\/:\*\?"<>\|]/g, '')}.log`);
            const logger = this.loggerService.createLogger(file, { logLevel: 'always', donotRotate: true, donotUseFormatters: true, hidden: true });
            const id = await this.proxy.$register(name, file, languageId, extension.identifier.value);
            return new ExtHostOutputChannel(id, name, logger, this.proxy, extension);
        }
        async doCreateLogOutputChannel(name, logLevel, extension) {
            const extensionLogDir = await this.createExtensionLogDirectory(extension);
            const fileName = name.replace(/[\\/:\*\?"<>\|]/g, '');
            const file = this.extHostFileSystemInfo.extUri.joinPath(extensionLogDir, `${fileName}.log`);
            const id = `${extension.identifier.value}.${fileName}`;
            const logger = this.loggerService.createLogger(file, { id, name, logLevel, extensionId: extension.identifier.value });
            return new ExtHostLogOutputChannel(id, name, logger, this.proxy, extension);
        }
        createExtensionLogDirectory(extension) {
            let extensionLogDirectoryPromise = this.extensionLogDirectoryPromise.get(extension.identifier.value);
            if (!extensionLogDirectoryPromise) {
                const extensionLogDirectory = this.extHostFileSystemInfo.extUri.joinPath(this.initData.logsLocation, extension.identifier.value);
                this.extensionLogDirectoryPromise.set(extension.identifier.value, extensionLogDirectoryPromise = (async () => {
                    try {
                        await this.extHostFileSystem.value.createDirectory(extensionLogDirectory);
                    }
                    catch (err) {
                        if ((0, files_1.toFileSystemProviderErrorCode)(err) !== files_1.FileSystemProviderErrorCode.FileExists) {
                            throw err;
                        }
                    }
                    return extensionLogDirectory;
                })());
            }
            return extensionLogDirectoryPromise;
        }
        createExtHostOutputChannel(name, channelPromise) {
            let disposed = false;
            const validate = () => {
                if (disposed) {
                    throw new Error('Channel has been closed');
                }
            };
            return {
                get name() { return name; },
                append(value) {
                    validate();
                    channelPromise.then(channel => channel.append(value));
                },
                appendLine(value) {
                    validate();
                    channelPromise.then(channel => channel.appendLine(value));
                },
                clear() {
                    validate();
                    channelPromise.then(channel => channel.clear());
                },
                replace(value) {
                    validate();
                    channelPromise.then(channel => channel.replace(value));
                },
                show(columnOrPreserveFocus, preserveFocus) {
                    validate();
                    channelPromise.then(channel => channel.show(columnOrPreserveFocus, preserveFocus));
                },
                hide() {
                    validate();
                    channelPromise.then(channel => channel.hide());
                },
                dispose() {
                    disposed = true;
                    channelPromise.then(channel => channel.dispose());
                }
            };
        }
        createExtHostLogOutputChannel(name, logLevel, channelPromise) {
            const disposables = new lifecycle_1.DisposableStore();
            const validate = () => {
                if (disposables.isDisposed) {
                    throw new Error('Channel has been closed');
                }
            };
            const onDidChangeLogLevel = disposables.add(new event_1.Emitter());
            function setLogLevel(newLogLevel) {
                logLevel = newLogLevel;
                onDidChangeLogLevel.fire(newLogLevel);
            }
            channelPromise.then(channel => {
                disposables.add(channel);
                if (channel.logLevel !== logLevel) {
                    setLogLevel(channel.logLevel);
                }
                disposables.add(channel.onDidChangeLogLevel(e => setLogLevel(e)));
            });
            return {
                ...this.createExtHostOutputChannel(name, channelPromise),
                get logLevel() { return logLevel; },
                onDidChangeLogLevel: onDidChangeLogLevel.event,
                trace(value, ...args) {
                    validate();
                    channelPromise.then(channel => channel.trace(value, ...args));
                },
                debug(value, ...args) {
                    validate();
                    channelPromise.then(channel => channel.debug(value, ...args));
                },
                info(value, ...args) {
                    validate();
                    channelPromise.then(channel => channel.info(value, ...args));
                },
                warn(value, ...args) {
                    validate();
                    channelPromise.then(channel => channel.warn(value, ...args));
                },
                error(value, ...args) {
                    validate();
                    channelPromise.then(channel => channel.error(value, ...args));
                },
                dispose() {
                    disposables.dispose();
                }
            };
        }
    };
    exports.ExtHostOutputService = ExtHostOutputService;
    exports.ExtHostOutputService = ExtHostOutputService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostFileSystemConsumer_1.IExtHostConsumerFileSystem),
        __param(3, extHostFileSystemInfo_1.IExtHostFileSystemInfo),
        __param(4, log_1.ILoggerService),
        __param(5, log_1.ILogService)
    ], ExtHostOutputService);
    exports.IExtHostOutputService = (0, instantiation_1.createDecorator)('IExtHostOutputService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE91dHB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdE91dHB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQmhHLE1BQU0sb0JBQXFCLFNBQVEsMkJBQXFCO1FBS3ZELElBQUksUUFBUSxLQUFjLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFJbEQsWUFDVSxFQUFVLEVBQVcsSUFBWSxFQUN2QixNQUFlLEVBQ2YsS0FBbUMsRUFDN0MsU0FBZ0M7WUFFekMsS0FBSyxFQUFFLENBQUM7WUFMQyxPQUFFLEdBQUYsRUFBRSxDQUFRO1lBQVcsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUN2QixXQUFNLEdBQU4sTUFBTSxDQUFTO1lBQ2YsVUFBSyxHQUFMLEtBQUssQ0FBOEI7WUFDN0MsY0FBUyxHQUFULFNBQVMsQ0FBdUI7WUFYbEMsV0FBTSxHQUFXLENBQUMsQ0FBQztZQUVuQixjQUFTLEdBQVksS0FBSyxDQUFDO1lBRzVCLFlBQU8sR0FBWSxLQUFLLENBQUM7WUFTL0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFFRCxJQUFJLFFBQVE7WUFDWCxPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN4QixDQUFDO1FBRUQsVUFBVSxDQUFDLEtBQWE7WUFDdkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENB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