/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, platform_1, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ACTIVE_OUTPUT_CHANNEL_CONTEXT = exports.Extensions = exports.OutputChannelUpdateMode = exports.IOutputService = exports.CONTEXT_OUTPUT_SCROLL_LOCK = exports.CONTEXT_ACTIVE_OUTPUT_LEVEL_IS_DEFAULT = exports.CONTEXT_ACTIVE_OUTPUT_LEVEL = exports.CONTEXT_ACTIVE_OUTPUT_LEVEL_SETTABLE = exports.CONTEXT_ACTIVE_FILE_OUTPUT = exports.CONTEXT_IN_OUTPUT = exports.OUTPUT_VIEW_ID = exports.LOG_MODE_ID = exports.LOG_MIME = exports.OUTPUT_MODE_ID = exports.OUTPUT_SCHEME = exports.OUTPUT_MIME = void 0;
    /**
     * Mime type used by the output editor.
     */
    exports.OUTPUT_MIME = 'text/x-code-output';
    /**
     * Output resource scheme.
     */
    exports.OUTPUT_SCHEME = 'output';
    /**
     * Id used by the output editor.
     */
    exports.OUTPUT_MODE_ID = 'Log';
    /**
     * Mime type used by the log output editor.
     */
    exports.LOG_MIME = 'text/x-code-log-output';
    /**
     * Id used by the log output editor.
     */
    exports.LOG_MODE_ID = 'log';
    /**
     * Output view id
     */
    exports.OUTPUT_VIEW_ID = 'workbench.panel.output';
    exports.CONTEXT_IN_OUTPUT = new contextkey_1.RawContextKey('inOutput', false);
    exports.CONTEXT_ACTIVE_FILE_OUTPUT = new contextkey_1.RawContextKey('activeLogOutput', false);
    exports.CONTEXT_ACTIVE_OUTPUT_LEVEL_SETTABLE = new contextkey_1.RawContextKey('activeLogOutput.levelSettable', false);
    exports.CONTEXT_ACTIVE_OUTPUT_LEVEL = new contextkey_1.RawContextKey('activeLogOutput.level', '');
    exports.CONTEXT_ACTIVE_OUTPUT_LEVEL_IS_DEFAULT = new contextkey_1.RawContextKey('activeLogOutput.levelIsDefault', false);
    exports.CONTEXT_OUTPUT_SCROLL_LOCK = new contextkey_1.RawContextKey(`outputView.scrollLock`, false);
    exports.IOutputService = (0, instantiation_1.createDecorator)('outputService');
    var OutputChannelUpdateMode;
    (function (OutputChannelUpdateMode) {
        OutputChannelUpdateMode[OutputChannelUpdateMode["Append"] = 1] = "Append";
        OutputChannelUpdateMode[OutputChannelUpdateMode["Replace"] = 2] = "Replace";
        OutputChannelUpdateMode[OutputChannelUpdateMode["Clear"] = 3] = "Clear";
    })(OutputChannelUpdateMode || (exports.OutputChannelUpdateMode = OutputChannelUpdateMode = {}));
    exports.Extensions = {
        OutputChannels: 'workbench.contributions.outputChannels'
    };
    class OutputChannelRegistry {
        constructor() {
            this.channels = new Map();
            this._onDidRegisterChannel = new event_1.Emitter();
            this.onDidRegisterChannel = this._onDidRegisterChannel.event;
            this._onDidRemoveChannel = new event_1.Emitter();
            this.onDidRemoveChannel = this._onDidRemoveChannel.event;
        }
        registerChannel(descriptor) {
            if (!this.channels.has(descriptor.id)) {
                this.channels.set(descriptor.id, descriptor);
                this._onDidRegisterChannel.fire(descriptor.id);
            }
        }
        getChannels() {
            const result = [];
            this.channels.forEach(value => result.push(value));
            return result;
        }
        getChannel(id) {
            return this.channels.get(id);
        }
        removeChannel(id) {
            this.channels.delete(id);
            this._onDidRemoveChannel.fire(id);
        }
    }
    platform_1.Registry.add(exports.Extensions.OutputChannels, new OutputChannelRegistry());
    exports.ACTIVE_OUTPUT_CHANNEL_CONTEXT = new contextkey_1.RawContextKey('activeOutputChannel', '');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvb3V0cHV0L2NvbW1vbi9vdXRwdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHOztPQUVHO0lBQ1UsUUFBQSxXQUFXLEdBQUcsb0JBQW9CLENBQUM7SUFFaEQ7O09BRUc7SUFDVSxRQUFBLGFBQWEsR0FBRyxRQUFRLENBQUM7SUFFdEM7O09BRUc7SUFDVSxRQUFBLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFFcEM7O09BRUc7SUFDVSxRQUFBLFFBQVEsR0FBRyx3QkFBd0IsQ0FBQztJQUVqRDs7T0FFRztJQUNVLFFBQUEsV0FBVyxHQUFHLEtBQUssQ0FBQztJQUVqQzs7T0FFRztJQUNVLFFBQUEsY0FBYyxHQUFHLHdCQUF3QixDQUFDO0lBRTFDLFFBQUEsaUJBQWlCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVsRSxRQUFBLDBCQUEwQixHQUFHLElBQUksMEJBQWEsQ0FBVSxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVsRixRQUFBLG9DQUFvQyxHQUFHLElBQUksMEJBQWEsQ0FBVSwrQkFBK0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUUxRyxRQUFBLDJCQUEyQixHQUFHLElBQUksMEJBQWEsQ0FBUyx1QkFBdUIsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVyRixRQUFBLHNDQUFzQyxHQUFHLElBQUksMEJBQWEsQ0FBVSxnQ0FBZ0MsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUU3RyxRQUFBLDBCQUEwQixHQUFHLElBQUksMEJBQWEsQ0FBVSx1QkFBdUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUV4RixRQUFBLGNBQWMsR0FBRyxJQUFBLCtCQUFlLEVBQWlCLGVBQWUsQ0FBQyxDQUFDO0lBeUMvRSxJQUFZLHVCQUlYO0lBSkQsV0FBWSx1QkFBdUI7UUFDbEMseUVBQVUsQ0FBQTtRQUNWLDJFQUFPLENBQUE7UUFDUCx1RUFBSyxDQUFBO0lBQ04sQ0FBQyxFQUpXLHVCQUF1Qix1Q0FBdkIsdUJBQXVCLFFBSWxDO0lBOENZLFFBQUEsVUFBVSxHQUFHO1FBQ3pCLGNBQWMsRUFBRSx3Q0FBd0M7S0FDeEQsQ0FBQztJQXlDRixNQUFNLHFCQUFxQjtRQUEzQjtZQUNTLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBb0MsQ0FBQztZQUU5QywwQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBVSxDQUFDO1lBQ3RELHlCQUFvQixHQUFrQixJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBRS9ELHdCQUFtQixHQUFHLElBQUksZUFBTyxFQUFVLENBQUM7WUFDcEQsdUJBQWtCLEdBQWtCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7UUF1QjdFLENBQUM7UUFyQk8sZUFBZSxDQUFDLFVBQW9DO1lBQzFELElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDaEQsQ0FBQztRQUNGLENBQUM7UUFFTSxXQUFXO1lBQ2pCLE1BQU0sTUFBTSxHQUErQixFQUFFLENBQUM7WUFDOUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDbkQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRU0sVUFBVSxDQUFDLEVBQVU7WUFDM0IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRU0sYUFBYSxDQUFDLEVBQVU7WUFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNuQyxDQUFDO0tBQ0Q7SUFFRCxtQkFBUSxDQUFDLEdBQUcsQ0FBQyxrQkFBVSxDQUFDLGNBQWMsRUFBRSxJQUFJLHFCQUFxQixFQUFFLENBQUMsQ0FBQztJQUV4RCxRQUFBLDZCQUE2QixHQUFHLElBQUksMEJBQWEsQ0FBUyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsQ0FBQyJ9