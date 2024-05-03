var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/filters", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/common/debug"], function (require, exports, filters_1, nls_1, commands_1, pickerQuickAccess_1, viewsService_1, debugCommands_1, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugConsoleQuickAccess = void 0;
    let DebugConsoleQuickAccess = class DebugConsoleQuickAccess extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(_debugService, _viewsService, _commandService) {
            super(debugCommands_1.DEBUG_CONSOLE_QUICK_ACCESS_PREFIX, { canAcceptInBackground: true });
            this._debugService = _debugService;
            this._viewsService = _viewsService;
            this._commandService = _commandService;
        }
        _getPicks(filter, disposables, token) {
            const debugConsolePicks = [];
            this._debugService.getModel().getSessions(true).filter(s => s.hasSeparateRepl()).forEach((session, index) => {
                const pick = this._createPick(session, index, filter);
                if (pick) {
                    debugConsolePicks.push(pick);
                }
            });
            if (debugConsolePicks.length > 0) {
                debugConsolePicks.push({ type: 'separator' });
            }
            const createTerminalLabel = (0, nls_1.localize)("workbench.action.debug.startDebug", "Start a New Debug Session");
            debugConsolePicks.push({
                label: `$(plus) ${createTerminalLabel}`,
                ariaLabel: createTerminalLabel,
                accept: () => this._commandService.executeCommand(debugCommands_1.SELECT_AND_START_ID)
            });
            return debugConsolePicks;
        }
        _createPick(session, sessionIndex, filter) {
            const label = session.name;
            const highlights = (0, filters_1.matchesFuzzy)(filter, label, true);
            if (highlights) {
                return {
                    label,
                    highlights: { label: highlights },
                    accept: (keyMod, event) => {
                        this._debugService.focusStackFrame(undefined, undefined, session, { explicit: true });
                        if (!this._viewsService.isViewVisible(debug_1.REPL_VIEW_ID)) {
                            this._viewsService.openView(debug_1.REPL_VIEW_ID, true);
                        }
                    }
                };
            }
            return undefined;
        }
    };
    exports.DebugConsoleQuickAccess = DebugConsoleQuickAccess;
    exports.DebugConsoleQuickAccess = DebugConsoleQuickAccess = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, viewsService_1.IViewsService),
        __param(2, commands_1.ICommandService)
    ], DebugConsoleQuickAccess);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb25zb2xlUXVpY2tBY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2Jyb3dzZXIvZGVidWdDb25zb2xlUXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQWVPLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsNkNBQWlEO1FBRTdGLFlBQ2lDLGFBQTRCLEVBQzVCLGFBQTRCLEVBQzFCLGVBQWdDO1lBRWxFLEtBQUssQ0FBQyxpREFBaUMsRUFBRSxFQUFFLHFCQUFxQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFKMUMsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDNUIsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDMUIsb0JBQWUsR0FBZixlQUFlLENBQWlCO1FBR25FLENBQUM7UUFFUyxTQUFTLENBQUMsTUFBYyxFQUFFLFdBQTRCLEVBQUUsS0FBd0I7WUFDekYsTUFBTSxpQkFBaUIsR0FBd0QsRUFBRSxDQUFDO1lBRWxGLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDM0csTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLElBQUksRUFBRSxDQUFDO29CQUNWLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBR0gsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFFRCxNQUFNLG1CQUFtQixHQUFHLElBQUEsY0FBUSxFQUFDLG1DQUFtQyxFQUFFLDJCQUEyQixDQUFDLENBQUM7WUFDdkcsaUJBQWlCLENBQUMsSUFBSSxDQUFDO2dCQUN0QixLQUFLLEVBQUUsV0FBVyxtQkFBbUIsRUFBRTtnQkFDdkMsU0FBUyxFQUFFLG1CQUFtQjtnQkFDOUIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLG1DQUFtQixDQUFDO2FBQ3RFLENBQUMsQ0FBQztZQUNILE9BQU8saUJBQWlCLENBQUM7UUFDMUIsQ0FBQztRQUVPLFdBQVcsQ0FBQyxPQUFzQixFQUFFLFlBQW9CLEVBQUUsTUFBYztZQUMvRSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBRTNCLE1BQU0sVUFBVSxHQUFHLElBQUEsc0JBQVksRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3JELElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLE9BQU87b0JBQ04sS0FBSztvQkFDTCxVQUFVLEVBQUUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFO29CQUNqQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7d0JBQ3pCLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7d0JBQ3RGLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxvQkFBWSxDQUFDLEVBQUUsQ0FBQzs0QkFDckQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsb0JBQVksRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDakQsQ0FBQztvQkFDRixDQUFDO2lCQUNELENBQUM7WUFDSCxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztLQUNELENBQUE7SUFwRFksMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFHakMsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSwwQkFBZSxDQUFBO09BTEwsdUJBQXVCLENBb0RuQyJ9