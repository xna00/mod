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
define(["require", "exports", "vs/base/common/event", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/timeline/common/timeline", "vs/base/common/marshalling"], function (require, exports, event_1, log_1, extHost_protocol_1, extHostCustomers_1, timeline_1, marshalling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTimeline = void 0;
    let MainThreadTimeline = class MainThreadTimeline {
        constructor(context, logService, _timelineService) {
            this.logService = logService;
            this._timelineService = _timelineService;
            this._providerEmitters = new Map();
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTimeline);
        }
        $registerTimelineProvider(provider) {
            this.logService.trace(`MainThreadTimeline#registerTimelineProvider: id=${provider.id}`);
            const proxy = this._proxy;
            const emitters = this._providerEmitters;
            let onDidChange = emitters.get(provider.id);
            if (onDidChange === undefined) {
                onDidChange = new event_1.Emitter();
                emitters.set(provider.id, onDidChange);
            }
            this._timelineService.registerTimelineProvider({
                ...provider,
                onDidChange: onDidChange.event,
                async provideTimeline(uri, options, token) {
                    return (0, marshalling_1.revive)(await proxy.$getTimeline(provider.id, uri, options, token));
                },
                dispose() {
                    emitters.delete(provider.id);
                    onDidChange?.dispose();
                }
            });
        }
        $unregisterTimelineProvider(id) {
            this.logService.trace(`MainThreadTimeline#unregisterTimelineProvider: id=${id}`);
            this._timelineService.unregisterTimelineProvider(id);
        }
        $emitTimelineChangeEvent(e) {
            this.logService.trace(`MainThreadTimeline#emitChangeEvent: id=${e.id}, uri=${e.uri?.toString(true)}`);
            const emitter = this._providerEmitters.get(e.id);
            emitter?.fire(e);
        }
        dispose() {
            // noop
        }
    };
    exports.MainThreadTimeline = MainThreadTimeline;
    exports.MainThreadTimeline = MainThreadTimeline = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTimeline),
        __param(1, log_1.ILogService),
        __param(2, timeline_1.ITimelineService)
    ], MainThreadTimeline);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRpbWVsaW5lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFRpbWVsaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVl6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjtRQUk5QixZQUNDLE9BQXdCLEVBQ1gsVUFBd0MsRUFDbkMsZ0JBQW1EO1lBRHZDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDbEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUxyRCxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBd0MsQ0FBQztZQU9wRixJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQseUJBQXlCLENBQUMsUUFBb0M7WUFDN0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsbURBQW1ELFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXhGLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFFMUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1lBQ3hDLElBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLElBQUksV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMvQixXQUFXLEdBQUcsSUFBSSxlQUFPLEVBQXVCLENBQUM7Z0JBQ2pELFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN4QyxDQUFDO1lBRUQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHdCQUF3QixDQUFDO2dCQUM5QyxHQUFHLFFBQVE7Z0JBQ1gsV0FBVyxFQUFFLFdBQVcsQ0FBQyxLQUFLO2dCQUM5QixLQUFLLENBQUMsZUFBZSxDQUFDLEdBQVEsRUFBRSxPQUF3QixFQUFFLEtBQXdCO29CQUNqRixPQUFPLElBQUEsb0JBQU0sRUFBVyxNQUFNLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3JGLENBQUM7Z0JBQ0QsT0FBTztvQkFDTixRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDN0IsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDO2dCQUN4QixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELDJCQUEyQixDQUFDLEVBQVU7WUFDckMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMscURBQXFELEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFakYsSUFBSSxDQUFDLGdCQUFnQixDQUFDLDBCQUEwQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCx3QkFBd0IsQ0FBQyxDQUFzQjtZQUM5QyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFdEcsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakQsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBRUQsT0FBTztZQUNOLE9BQU87UUFDUixDQUFDO0tBQ0QsQ0FBQTtJQXJEWSxnREFBa0I7aUNBQWxCLGtCQUFrQjtRQUQ5QixJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsa0JBQWtCLENBQUM7UUFPbEQsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSwyQkFBZ0IsQ0FBQTtPQVBOLGtCQUFrQixDQXFEOUIifQ==