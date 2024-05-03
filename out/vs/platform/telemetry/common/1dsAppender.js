/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/amdX", "vs/base/common/errors", "vs/base/common/objects", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, amdX_1, errors_1, objects_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractOneDataSystemAppender = void 0;
    const endpointUrl = 'https://mobile.events.data.microsoft.com/OneCollector/1.0';
    const endpointHealthUrl = 'https://mobile.events.data.microsoft.com/ping';
    async function getClient(instrumentationKey, addInternalFlag, xhrOverride) {
        const oneDs = await (0, amdX_1.importAMDNodeModule)('@microsoft/1ds-core-js', 'dist/ms.core.js');
        const postPlugin = await (0, amdX_1.importAMDNodeModule)('@microsoft/1ds-post-js', 'dist/ms.post.js');
        const appInsightsCore = new oneDs.AppInsightsCore();
        const collectorChannelPlugin = new postPlugin.PostChannel();
        // Configure the app insights core to send to collector++ and disable logging of debug info
        const coreConfig = {
            instrumentationKey,
            endpointUrl,
            loggingLevelTelemetry: 0,
            loggingLevelConsole: 0,
            disableCookiesUsage: true,
            disableDbgExt: true,
            disableInstrumentationKeyValidation: true,
            channels: [[
                    collectorChannelPlugin
                ]]
        };
        if (xhrOverride) {
            coreConfig.extensionConfig = {};
            // Configure the channel to use a XHR Request override since it's not available in node
            const channelConfig = {
                alwaysUseXhrOverride: true,
                ignoreMc1Ms0CookieProcessing: true,
                httpXHROverride: xhrOverride
            };
            coreConfig.extensionConfig[collectorChannelPlugin.identifier] = channelConfig;
        }
        appInsightsCore.initialize(coreConfig, []);
        appInsightsCore.addTelemetryInitializer((envelope) => {
            // Opt the user out of 1DS data sharing
            envelope['ext'] = envelope['ext'] ?? {};
            envelope['ext']['web'] = envelope['ext']['web'] ?? {};
            envelope['ext']['web']['consentDetails'] = '{"GPC_DataSharingOptIn":false}';
            if (addInternalFlag) {
                envelope['ext']['utc'] = envelope['ext']['utc'] ?? {};
                // Sets it to be internal only based on Windows UTC flagging
                envelope['ext']['utc']['flags'] = 0x0000811ECD;
            }
        });
        return appInsightsCore;
    }
    // TODO @lramos15 maybe make more in line with src/vs/platform/telemetry/browser/appInsightsAppender.ts with caching support
    class AbstractOneDataSystemAppender {
        constructor(_isInternalTelemetry, _eventPrefix, _defaultData, iKeyOrClientFactory, // allow factory function for testing
        _xhrOverride) {
            this._isInternalTelemetry = _isInternalTelemetry;
            this._eventPrefix = _eventPrefix;
            this._defaultData = _defaultData;
            this._xhrOverride = _xhrOverride;
            this.endPointUrl = endpointUrl;
            this.endPointHealthUrl = endpointHealthUrl;
            if (!this._defaultData) {
                this._defaultData = {};
            }
            if (typeof iKeyOrClientFactory === 'function') {
                this._aiCoreOrKey = iKeyOrClientFactory();
            }
            else {
                this._aiCoreOrKey = iKeyOrClientFactory;
            }
            this._asyncAiCore = null;
        }
        _withAIClient(callback) {
            if (!this._aiCoreOrKey) {
                return;
            }
            if (typeof this._aiCoreOrKey !== 'string') {
                callback(this._aiCoreOrKey);
                return;
            }
            if (!this._asyncAiCore) {
                this._asyncAiCore = getClient(this._aiCoreOrKey, this._isInternalTelemetry, this._xhrOverride);
            }
            this._asyncAiCore.then((aiClient) => {
                callback(aiClient);
            }, (err) => {
                (0, errors_1.onUnexpectedError)(err);
                console.error(err);
            });
        }
        log(eventName, data) {
            if (!this._aiCoreOrKey) {
                return;
            }
            data = (0, objects_1.mixin)(data, this._defaultData);
            data = (0, telemetryUtils_1.validateTelemetryData)(data);
            const name = this._eventPrefix + '/' + eventName;
            try {
                this._withAIClient((aiClient) => {
                    aiClient.pluginVersionString = data?.properties.version ?? 'Unknown';
                    aiClient.track({
                        name,
                        baseData: { name, properties: data?.properties, measurements: data?.measurements }
                    });
                });
            }
            catch { }
        }
        flush() {
            if (this._aiCoreOrKey) {
                return new Promise(resolve => {
                    this._withAIClient((aiClient) => {
                        aiClient.unload(true, () => {
                            this._aiCoreOrKey = undefined;
                            resolve(undefined);
                        });
                    });
                });
            }
            return Promise.resolve(undefined);
        }
    }
    exports.AbstractOneDataSystemAppender = AbstractOneDataSystemAppender;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMWRzQXBwZW5kZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9jb21tb24vMWRzQXBwZW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUJoRyxNQUFNLFdBQVcsR0FBRywyREFBMkQsQ0FBQztJQUNoRixNQUFNLGlCQUFpQixHQUFHLCtDQUErQyxDQUFDO0lBRTFFLEtBQUssVUFBVSxTQUFTLENBQUMsa0JBQTBCLEVBQUUsZUFBeUIsRUFBRSxXQUEwQjtRQUN6RyxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUEsMEJBQW1CLEVBQTBDLHdCQUF3QixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDOUgsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFBLDBCQUFtQixFQUEwQyx3QkFBd0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25JLE1BQU0sZUFBZSxHQUFHLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3BELE1BQU0sc0JBQXNCLEdBQWdCLElBQUksVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3pFLDJGQUEyRjtRQUMzRixNQUFNLFVBQVUsR0FBMkI7WUFDMUMsa0JBQWtCO1lBQ2xCLFdBQVc7WUFDWCxxQkFBcUIsRUFBRSxDQUFDO1lBQ3hCLG1CQUFtQixFQUFFLENBQUM7WUFDdEIsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixhQUFhLEVBQUUsSUFBSTtZQUNuQixtQ0FBbUMsRUFBRSxJQUFJO1lBQ3pDLFFBQVEsRUFBRSxDQUFDO29CQUNWLHNCQUFzQjtpQkFDdEIsQ0FBQztTQUNGLENBQUM7UUFFRixJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2pCLFVBQVUsQ0FBQyxlQUFlLEdBQUcsRUFBRSxDQUFDO1lBQ2hDLHVGQUF1RjtZQUN2RixNQUFNLGFBQWEs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