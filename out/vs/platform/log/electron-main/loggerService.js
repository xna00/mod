/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/log/node/loggerService"], function (require, exports, map_1, event_1, instantiation_1, log_1, loggerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoggerMainService = exports.ILoggerMainService = void 0;
    exports.ILoggerMainService = (0, instantiation_1.refineServiceDecorator)(log_1.ILoggerService);
    class LoggerMainService extends loggerService_1.LoggerService {
        constructor() {
            super(...arguments);
            this.loggerResourcesByWindow = new map_1.ResourceMap();
        }
        createLogger(idOrResource, options, windowId) {
            if (windowId !== undefined) {
                this.loggerResourcesByWindow.set(this.toResource(idOrResource), windowId);
            }
            try {
                return super.createLogger(idOrResource, options);
            }
            catch (error) {
                this.loggerResourcesByWindow.delete(this.toResource(idOrResource));
                throw error;
            }
        }
        registerLogger(resource, windowId) {
            if (windowId !== undefined) {
                this.loggerResourcesByWindow.set(resource.resource, windowId);
            }
            super.registerLogger(resource);
        }
        deregisterLogger(resource) {
            this.loggerResourcesByWindow.delete(resource);
            super.deregisterLogger(resource);
        }
        getRegisteredLoggers(windowId) {
            const resources = [];
            for (const resource of super.getRegisteredLoggers()) {
                if (windowId === this.loggerResourcesByWindow.get(resource.resource)) {
                    resources.push(resource);
                }
            }
            return resources;
        }
        getOnDidChangeLogLevelEvent(windowId) {
            return event_1.Event.filter(this.onDidChangeLogLevel, arg => (0, log_1.isLogLevel)(arg) || this.isInterestedLoggerResource(arg[0], windowId));
        }
        getOnDidChangeVisibilityEvent(windowId) {
            return event_1.Event.filter(this.onDidChangeVisibility, ([resource]) => this.isInterestedLoggerResource(resource, windowId));
        }
        getOnDidChangeLoggersEvent(windowId) {
            return event_1.Event.filter(event_1.Event.map(this.onDidChangeLoggers, e => {
                const r = {
                    added: [...e.added].filter(loggerResource => this.isInterestedLoggerResource(loggerResource.resource, windowId)),
                    removed: [...e.removed].filter(loggerResource => this.isInterestedLoggerResource(loggerResource.resource, windowId)),
                };
                return r;
            }), e => e.added.length > 0 || e.removed.length > 0);
        }
        deregisterLoggers(windowId) {
            for (const [resource, resourceWindow] of this.loggerResourcesByWindow) {
                if (resourceWindow === windowId) {
                    this.deregisterLogger(resource);
                }
            }
        }
        isInterestedLoggerResource(resource, windowId) {
            const loggerWindowId = this.loggerResourcesByWindow.get(resource);
            return loggerWindowId === undefined || loggerWindowId === windowId;
        }
        dispose() {
            super.dispose();
            this.loggerResourcesByWindow.clear();
        }
    }
    exports.LoggerMainService = LoggerMainService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbG9nL2VsZWN0cm9uLW1haW4vbG9nZ2VyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTbkYsUUFBQSxrQkFBa0IsR0FBRyxJQUFBLHNDQUFzQixFQUFxQyxvQkFBYyxDQUFDLENBQUM7SUFzQjdHLE1BQWEsaUJBQWtCLFNBQVEsNkJBQWE7UUFBcEQ7O1lBRWtCLDRCQUF1QixHQUFHLElBQUksaUJBQVcsRUFBVSxDQUFDO1FBd0V0RSxDQUFDO1FBdEVTLFlBQVksQ0FBQyxZQUEwQixFQUFFLE9BQXdCLEVBQUUsUUFBaUI7WUFDNUYsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzRSxDQUFDO1lBQ0QsSUFBSSxDQUFDO2dCQUNKLE9BQU8sS0FBSyxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbEQsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLEtBQUssQ0FBQztZQUNiLENBQUM7UUFDRixDQUFDO1FBRVEsY0FBYyxDQUFDLFFBQXlCLEVBQUUsUUFBaUI7WUFDbkUsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENB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