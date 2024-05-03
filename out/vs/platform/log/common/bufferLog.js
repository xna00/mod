/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/log/common/log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferLogger = void 0;
    class BufferLogger extends log_1.AbstractMessageLogger {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super();
            this.buffer = [];
            this._logger = undefined;
            this.setLevel(logLevel);
            this._register(this.onDidChangeLogLevel(level => {
                this._logger?.setLevel(level);
            }));
        }
        set logger(logger) {
            this._logger = logger;
            for (const { level, message } of this.buffer) {
                (0, log_1.log)(logger, level, message);
            }
            this.buffer = [];
        }
        log(level, message) {
            if (this._logger) {
                (0, log_1.log)(this._logger, level, message);
            }
            else if (this.getLevel() <= level) {
                this.buffer.push({ level, message });
            }
        }
        dispose() {
            this._logger?.dispose();
            super.dispose();
        }
        flush() {
            this._logger?.flush();
        }
    }
    exports.BufferLogger = BufferLogger;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyTG9nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9sb2cvY29tbW9uL2J1ZmZlckxvZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxZQUFhLFNBQVEsMkJBQXFCO1FBTXRELFlBQVksV0FBcUIsdUJBQWlCO1lBQ2pELEtBQUssRUFBRSxDQUFDO1lBSkQsV0FBTSxHQUFXLEVBQUUsQ0FBQztZQUNwQixZQUFPLEdBQXdCLFNBQVMsQ0FBQztZQUloRCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMvQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELElBQUksTUFBTSxDQUFDLE1BQWU7WUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFFdEIsS0FBSyxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDOUMsSUFBQSxTQUFHLEVBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM3QixDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDbEIsQ0FBQztRQUVTLEdBQUcsQ0FBQyxLQUFlLEVBQUUsT0FBZTtZQUM3QyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEIsSUFBQSxTQUFHLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbkMsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ3hCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRVEsS0FBSztZQUNiLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDdkIsQ0FBQztLQUNEO0lBeENELG9DQXdDQyJ9