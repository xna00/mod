/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/common/files", "vs/platform/log/common/log"], function (require, exports, files_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpdLogLogger = void 0;
    var SpdLogLevel;
    (function (SpdLogLevel) {
        SpdLogLevel[SpdLogLevel["Trace"] = 0] = "Trace";
        SpdLogLevel[SpdLogLevel["Debug"] = 1] = "Debug";
        SpdLogLevel[SpdLogLevel["Info"] = 2] = "Info";
        SpdLogLevel[SpdLogLevel["Warning"] = 3] = "Warning";
        SpdLogLevel[SpdLogLevel["Error"] = 4] = "Error";
        SpdLogLevel[SpdLogLevel["Critical"] = 5] = "Critical";
        SpdLogLevel[SpdLogLevel["Off"] = 6] = "Off";
    })(SpdLogLevel || (SpdLogLevel = {}));
    async function createSpdLogLogger(name, logfilePath, filesize, filecount, donotUseFormatters) {
        // Do not crash if spdlog cannot be loaded
        try {
            const _spdlog = await new Promise((resolve_1, reject_1) => { require(['@vscode/spdlog'], resolve_1, reject_1); });
            _spdlog.setFlushOn(SpdLogLevel.Trace);
            const logger = await _spdlog.createAsyncRotatingLogger(name, logfilePath, filesize, filecount);
            if (donotUseFormatters) {
                logger.clearFormatters();
            }
            else {
                logger.setPattern('%Y-%m-%d %H:%M:%S.%e [%l] %v');
            }
            return logger;
        }
        catch (e) {
            console.error(e);
        }
        return null;
    }
    function log(logger, level, message) {
        switch (level) {
            case log_1.LogLevel.Trace:
                logger.trace(message);
                break;
            case log_1.LogLevel.Debug:
                logger.debug(message);
                break;
            case log_1.LogLevel.Info:
                logger.info(message);
                break;
            case log_1.LogLevel.Warning:
                logger.warn(message);
                break;
            case log_1.LogLevel.Error:
                logger.error(message);
                break;
            case log_1.LogLevel.Off: /* do nothing */ break;
            default: throw new Error(`Invalid log level ${level}`);
        }
    }
    function setLogLevel(logger, level) {
        switch (level) {
            case log_1.LogLevel.Trace:
                logger.setLevel(SpdLogLevel.Trace);
                break;
            case log_1.LogLevel.Debug:
                logger.setLevel(SpdLogLevel.Debug);
                break;
            case log_1.LogLevel.Info:
                logger.setLevel(SpdLogLevel.Info);
                break;
            case log_1.LogLevel.Warning:
                logger.setLevel(SpdLogLevel.Warning);
                break;
            case log_1.LogLevel.Error:
                logger.setLevel(SpdLogLevel.Error);
                break;
            case log_1.LogLevel.Off:
                logger.setLevel(SpdLogLevel.Off);
                break;
            default: throw new Error(`Invalid log level ${level}`);
        }
    }
    class SpdLogLogger extends log_1.AbstractMessageLogger {
        constructor(name, filepath, rotating, donotUseFormatters, level) {
            super();
            this.buffer = [];
            this.setLevel(level);
            this._loggerCreationPromise = this._createSpdLogLogger(name, filepath, rotating, donotUseFormatters);
            this._register(this.onDidChangeLogLevel(level => {
                if (this._logger) {
                    setLogLevel(this._logger, level);
                }
            }));
        }
        async _createSpdLogLogger(name, filepath, rotating, donotUseFormatters) {
            const filecount = rotating ? 6 : 1;
            const filesize = (30 / filecount) * files_1.ByteSize.MB;
            const logger = await createSpdLogLogger(name, filepath, filesize, filecount, donotUseFormatters);
            if (logger) {
                this._logger = logger;
                setLogLevel(this._logger, this.getLevel());
                for (const { level, message } of this.buffer) {
                    log(this._logger, level, message);
                }
                this.buffer = [];
            }
        }
        log(level, message) {
            if (this._logger) {
                log(this._logger, level, message);
            }
            else if (this.getLevel() <= level) {
                this.buffer.push({ level, message });
            }
        }
        flush() {
            if (this._logger) {
                this._logger.flush();
            }
            else {
                this._loggerCreationPromise.then(() => this.flush());
            }
        }
        dispose() {
            if (this._logger) {
                this.disposeLogger();
            }
            else {
                this._loggerCreationPromise.then(() => this.disposeLogger());
            }
            super.dispose();
        }
        disposeLogger() {
            if (this._logger) {
                this._logger.drop();
                this._logger = undefined;
            }
        }
    }
    exports.SpdLogLogger = SpdLogLogger;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BkbG9nTG9nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9sb2cvbm9kZS9zcGRsb2dMb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLElBQUssV0FRSjtJQVJELFdBQUssV0FBVztRQUNmLCtDQUFLLENBQUE7UUFDTCwrQ0FBSyxDQUFBO1FBQ0wsNkNBQUksQ0FBQTtRQUNKLG1EQUFPLENBQUE7UUFDUCwrQ0FBSyxDQUFBO1FBQ0wscURBQVEsQ0FBQTtRQUNSLDJDQUFHLENBQUE7SUFDSixDQUFDLEVBUkksV0FBVyxLQUFYLFdBQVcsUUFRZjtJQUVELEtBQUssVUFBVSxrQkFBa0IsQ0FBQyxJQUFZLEVBQUUsV0FBbUIsRUFBRSxRQUFnQixFQUFFLFNBQWlCLEVBQUUsa0JBQTJCO1FBQ3BJLDBDQUEwQztRQUMxQyxJQUFJLENBQUM7WUFDSixNQUFNLE9BQU8sR0FBRyxzREFBYSxnQkFBZ0IsMkJBQUMsQ0FBQztZQUMvQyxPQUFPLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QyxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMvRixJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUMxQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxDQUFDLFVBQVUsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQ25ELENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztR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