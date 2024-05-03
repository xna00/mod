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
define(["require", "exports", "vs/base/common/event", "vs/platform/log/common/log", "./timeline", "vs/workbench/services/views/common/viewsService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey"], function (require, exports, event_1, log_1, timeline_1, viewsService_1, configuration_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimelineService = exports.TimelineHasProviderContext = void 0;
    exports.TimelineHasProviderContext = new contextkey_1.RawContextKey('timelineHasProvider', false);
    let TimelineService = class TimelineService {
        constructor(logService, viewsService, configurationService, contextKeyService) {
            this.logService = logService;
            this.viewsService = viewsService;
            this.configurationService = configurationService;
            this.contextKeyService = contextKeyService;
            this._onDidChangeProviders = new event_1.Emitter();
            this.onDidChangeProviders = this._onDidChangeProviders.event;
            this._onDidChangeTimeline = new event_1.Emitter();
            this.onDidChangeTimeline = this._onDidChangeTimeline.event;
            this._onDidChangeUri = new event_1.Emitter();
            this.onDidChangeUri = this._onDidChangeUri.event;
            this.providers = new Map();
            this.providerSubscriptions = new Map();
            this.hasProviderContext = exports.TimelineHasProviderContext.bindTo(this.contextKeyService);
            this.updateHasProviderContext();
        }
        getSources() {
            return [...this.providers.values()].map(p => ({ id: p.id, label: p.label }));
        }
        getTimeline(id, uri, options, tokenSource) {
            this.logService.trace(`TimelineService#getTimeline(${id}): uri=${uri.toString()}`);
            const provider = this.providers.get(id);
            if (provider === undefined) {
                return undefined;
            }
            if (typeof provider.scheme === 'string') {
                if (provider.scheme !== '*' && provider.scheme !== uri.scheme) {
                    return undefined;
                }
            }
            else if (!provider.scheme.includes(uri.scheme)) {
                return undefined;
            }
            return {
                result: provider.provideTimeline(uri, options, tokenSource.token)
                    .then(result => {
                    if (result === undefined) {
                        return undefined;
                    }
                    result.items = result.items.map(item => ({ ...item, source: provider.id }));
                    result.items.sort((a, b) => (b.timestamp - a.timestamp) || b.source.localeCompare(a.source, undefined, { numeric: true, sensitivity: 'base' }));
                    return result;
                }),
                options: options,
                source: provider.id,
                tokenSource: tokenSource,
                uri: uri
            };
        }
        registerTimelineProvider(provider) {
            this.logService.trace(`TimelineService#registerTimelineProvider: id=${provider.id}`);
            const id = provider.id;
            const existing = this.providers.get(id);
            if (existing) {
                // For now to deal with https://github.com/microsoft/vscode/issues/89553 allow any overwritting here (still will be blocked in the Extension Host)
                // TODO@eamodio: Ultimately will need to figure out a way to unregister providers when the Extension Host restarts/crashes
                // throw new Error(`Timeline Provider ${id} already exists.`);
                try {
                    existing?.dispose();
                }
                catch { }
            }
            this.providers.set(id, provider);
            this.updateHasProviderContext();
            if (provider.onDidChange) {
                this.providerSubscriptions.set(id, provider.onDidChange(e => this._onDidChangeTimeline.fire(e)));
            }
            this._onDidChangeProviders.fire({ added: [id] });
            return {
                dispose: () => {
                    this.providers.delete(id);
                    this._onDidChangeProviders.fire({ removed: [id] });
                }
            };
        }
        unregisterTimelineProvider(id) {
            this.logService.trace(`TimelineService#unregisterTimelineProvider: id=${id}`);
            if (!this.providers.has(id)) {
                return;
            }
            this.providers.delete(id);
            this.providerSubscriptions.delete(id);
            this.updateHasProviderContext();
            this._onDidChangeProviders.fire({ removed: [id] });
        }
        setUri(uri) {
            this.viewsService.openView(timeline_1.TimelinePaneId, true);
            this._onDidChangeUri.fire(uri);
        }
        updateHasProviderContext() {
            this.hasProviderContext.set(this.providers.size !== 0);
        }
    };
    exports.TimelineService = TimelineService;
    exports.TimelineService = TimelineService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, viewsService_1.IViewsService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, contextkey_1.IContextKeyService)
    ], TimelineService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZWxpbmVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90aW1lbGluZS9jb21tb24vdGltZWxpbmVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVluRixRQUFBLDBCQUEwQixHQUFHLElBQUksMEJBQWEsQ0FBVSxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUU1RixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFlO1FBZTNCLFlBQ2MsVUFBd0MsRUFDdEMsWUFBcUMsRUFDN0Isb0JBQXFELEVBQ3hELGlCQUErQztZQUhyQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQzVCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ25CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDOUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQWhCbkQsMEJBQXFCLEdBQUcsSUFBSSxlQUFPLEVBQWdDLENBQUM7WUFDNUUseUJBQW9CLEdBQXdDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7WUFFckYseUJBQW9CLEdBQUcsSUFBSSxlQUFPLEVBQXVCLENBQUM7WUFDbEUsd0JBQW1CLEdBQStCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFDMUUsb0JBQWUsR0FBRyxJQUFJLGVBQU8sRUFBTyxDQUFDO1lBQzdDLG1CQUFjLEdBQWUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7WUFHaEQsY0FBUyxHQUFHLElBQUksR0FBRyxFQUE0QixDQUFDO1lBQ2hELDBCQUFxQixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBUXZFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxrQ0FBMEIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDcEYsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFDakMsQ0FBQztRQUVELFVBQVU7WUFDVCxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlFLENBQUM7UUFFRCxXQUFXLENBQUMsRUFBVSxFQUFFLEdBQVEsRUFBRSxPQUF3QixFQUFFLFdBQW9DO1lBQy9GLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLCtCQUErQixFQUFFLFVBQVUsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVuRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN4QyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDNUIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELElBQUksT0FBTyxRQUFRLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUN6QyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssR0FBRyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUMvRCxPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztZQUNGLENBQUM7aUJBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUNsRCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTztnQkFDTixNQUFNLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUM7cUJBQy9ELElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDZCxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDMUIsT0FBTyxTQUFTLENBQUM7b0JBQ2xCLENBQUM7b0JBRUQsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDNUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUVoSixPQUFPLE1BQU0sQ0FBQztnQkFDZixDQUFDLENBQUM7Z0JBQ0gsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLE1BQU0sRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDbkIsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLEdBQUcsRUFBRSxHQUFHO2FBQ1IsQ0FBQztRQUNILENBQUM7UUFFRCx3QkFBd0IsQ0FBQyxRQUEwQjtZQUNsRCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxnREFBZ0QsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFckYsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUV2QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN4QyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLGtKQUFrSjtnQkFDbEosMEhBQTBIO2dCQUMxSCw4REFBOEQ7Z0JBQzlELElBQUksQ0FBQztvQkFDSixRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUM7Z0JBQ3JCLENBQUM7Z0JBQ0QsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNWLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFakMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFFaEMsSUFBSSxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRyxDQUFDO1lBQ0QsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVqRCxPQUFPO2dCQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzFCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3BELENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVELDBCQUEwQixDQUFDLEVBQVU7WUFDcEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsa0RBQWtELEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFOUUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUV0QyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUVoQyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxNQUFNLENBQUMsR0FBUTtZQUNkLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLHlCQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUVPLHdCQUF3QjtZQUMvQixJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3hELENBQUM7S0FDRCxDQUFBO0lBeEhZLDBDQUFlOzhCQUFmLGVBQWU7UUFnQnpCLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsNEJBQWEsQ0FBQTtRQUNiLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSwrQkFBa0IsQ0FBQTtPQW5CUixlQUFlLENBd0gzQiJ9