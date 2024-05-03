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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/resources", "vs/platform/files/common/files", "vs/platform/log/common/bufferLog", "vs/platform/log/common/log"], function (require, exports, async_1, buffer_1, resources_1, files_1, bufferLog_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileLoggerService = void 0;
    const MAX_FILE_SIZE = 5 * files_1.ByteSize.MB;
    let FileLogger = class FileLogger extends log_1.AbstractMessageLogger {
        constructor(resource, level, donotUseFormatters, fileService) {
            super();
            this.resource = resource;
            this.donotUseFormatters = donotUseFormatters;
            this.fileService = fileService;
            this.backupIndex = 1;
            this.buffer = '';
            this.setLevel(level);
            this.flushDelayer = new async_1.ThrottledDelayer(100 /* buffer saves over a short time */);
            this.initializePromise = this.initialize();
        }
        async flush() {
            if (!this.buffer) {
                return;
            }
            await this.initializePromise;
            let content = await this.loadContent();
            if (content.length > MAX_FILE_SIZE) {
                await this.fileService.writeFile(this.getBackupResource(), buffer_1.VSBuffer.fromString(content));
                content = '';
            }
            if (this.buffer) {
                content += this.buffer;
                this.buffer = '';
                await this.fileService.writeFile(this.resource, buffer_1.VSBuffer.fromString(content));
            }
        }
        async initialize() {
            try {
                await this.fileService.createFile(this.resource);
            }
            catch (error) {
                if (error.fileOperationResult !== 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                    throw error;
                }
            }
        }
        log(level, message) {
            if (this.donotUseFormatters) {
                this.buffer += message;
            }
            else {
                this.buffer += `${this.getCurrentTimestamp()} [${this.stringifyLogLevel(level)}] ${message}\n`;
            }
            this.flushDelayer.trigger(() => this.flush());
        }
        getCurrentTimestamp() {
            const toTwoDigits = (v) => v < 10 ? `0${v}` : v;
            const toThreeDigits = (v) => v < 10 ? `00${v}` : v < 100 ? `0${v}` : v;
            const currentTime = new Date();
            return `${currentTime.getFullYear()}-${toTwoDigits(currentTime.getMonth() + 1)}-${toTwoDigits(currentTime.getDate())} ${toTwoDigits(currentTime.getHours())}:${toTwoDigits(currentTime.getMinutes())}:${toTwoDigits(currentTime.getSeconds())}.${toThreeDigits(currentTime.getMilliseconds())}`;
        }
        getBackupResource() {
            this.backupIndex = this.backupIndex > 5 ? 1 : this.backupIndex;
            return (0, resources_1.joinPath)((0, resources_1.dirname)(this.resource), `${(0, resources_1.basename)(this.resource)}_${this.backupIndex++}`);
        }
        async loadContent() {
            try {
                const content = await this.fileService.readFile(this.resource);
                return content.value.toString();
            }
            catch (e) {
                return '';
            }
        }
        stringifyLogLevel(level) {
            switch (level) {
                case log_1.LogLevel.Debug: return 'debug';
                case log_1.LogLevel.Error: return 'error';
                case log_1.LogLevel.Info: return 'info';
                case log_1.LogLevel.Trace: return 'trace';
                case log_1.LogLevel.Warning: return 'warning';
            }
            return '';
        }
    };
    FileLogger = __decorate([
        __param(3, files_1.IFileService)
    ], FileLogger);
    class FileLoggerService extends log_1.AbstractLoggerService {
        constructor(logLevel, logsHome, fileService) {
            super(logLevel, logsHome);
            this.fileService = fileService;
        }
        doCreateLogger(resource, logLevel, options) {
            const logger = new bufferLog_1.BufferLogger(logLevel);
            (0, files_1.whenProviderRegistered)(resource, this.fileService).then(() => logger.logger = new FileLogger(resource, logger.getLevel(), !!options?.donotUseFormatters, this.fileService));
            return logger;
        }
    }
    exports.FileLoggerService = FileLoggerService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUxvZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbG9nL2NvbW1vbi9maWxlTG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVoRyxNQUFNLGFBQWEsR0FBRyxDQUFDLEdBQUcsZ0JBQVEsQ0FBQyxFQUFFLENBQUM7SUFFdEMsSUFBTSxVQUFVLEdBQWhCLE1BQU0sVUFBVyxTQUFRLDJCQUFxQjtRQU83QyxZQUNrQixRQUFhLEVBQzlCLEtBQWUsRUFDRSxrQkFBMkIsRUFDOUIsV0FBMEM7WUFFeEQsS0FBSyxFQUFFLENBQUM7WUFMUyxhQUFRLEdBQVIsUUFBUSxDQUFLO1lBRWIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFTO1lBQ2IsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFQakQsZ0JBQVcsR0FBVyxDQUFDLENBQUM7WUFDeEIsV0FBTSxHQUFXLEVBQUUsQ0FBQztZQVMzQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSx3QkFBZ0IsQ0FBTyxHQUFHLENBQUMsb0NBQW9DLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzVDLENBQUM7UUFFUSxLQUFLLENBQUMsS0FBSztZQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1lBQzdCLElBQUksT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3ZDLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxhQUFhLEVBQUUsQ0FBQztnQkFDcEMs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