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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/uri", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, lifecycle_1, observable_1, uri_1, log_1, storage_1, uriIdentity_1, debugModel_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugStorage = void 0;
    const DEBUG_BREAKPOINTS_KEY = 'debug.breakpoint';
    const DEBUG_FUNCTION_BREAKPOINTS_KEY = 'debug.functionbreakpoint';
    const DEBUG_DATA_BREAKPOINTS_KEY = 'debug.databreakpoint';
    const DEBUG_EXCEPTION_BREAKPOINTS_KEY = 'debug.exceptionbreakpoint';
    const DEBUG_WATCH_EXPRESSIONS_KEY = 'debug.watchexpressions';
    const DEBUG_CHOSEN_ENVIRONMENTS_KEY = 'debug.chosenenvironment';
    const DEBUG_UX_STATE_KEY = 'debug.uxstate';
    let DebugStorage = class DebugStorage extends lifecycle_1.Disposable {
        constructor(storageService, textFileService, uriIdentityService, logService) {
            super();
            this.storageService = storageService;
            this.textFileService = textFileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this.breakpoints = (0, observable_1.observableValue)(this, this.loadBreakpoints());
            this.functionBreakpoints = (0, observable_1.observableValue)(this, this.loadFunctionBreakpoints());
            this.exceptionBreakpoints = (0, observable_1.observableValue)(this, this.loadExceptionBreakpoints());
            this.dataBreakpoints = (0, observable_1.observableValue)(this, this.loadDataBreakpoints());
            this.watchExpressions = (0, observable_1.observableValue)(this, this.loadWatchExpressions());
            this._register(storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, undefined, this._store)(e => {
                if (e.external) {
                    switch (e.key) {
                        case DEBUG_BREAKPOINTS_KEY:
                            return this.breakpoints.set(this.loadBreakpoints(), undefined);
                        case DEBUG_FUNCTION_BREAKPOINTS_KEY:
                            return this.functionBreakpoints.set(this.loadFunctionBreakpoints(), undefined);
                        case DEBUG_EXCEPTION_BREAKPOINTS_KEY:
                            return this.exceptionBreakpoints.set(this.loadExceptionBreakpoints(), undefined);
                        case DEBUG_DATA_BREAKPOINTS_KEY:
                            return this.dataBreakpoints.set(this.loadDataBreakpoints(), undefined);
                        case DEBUG_WATCH_EXPRESSIONS_KEY:
                            return this.watchExpressions.set(this.loadWatchExpressions(), undefined);
                    }
                }
            }));
        }
        loadDebugUxState() {
            return this.storageService.get(DEBUG_UX_STATE_KEY, 1 /* StorageScope.WORKSPACE */, 'default');
        }
        storeDebugUxState(value) {
            this.storageService.store(DEBUG_UX_STATE_KEY, value, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        loadBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_BREAKPOINTS_KEY, 1 /* StorageScope.WORKSPACE */, '[]')).map((breakpoint) => {
                    breakpoint.uri = uri_1.URI.revive(breakpoint.uri);
                    return new debugModel_1.Breakpoint(breakpoint, this.textFileService, this.uriIdentityService, this.logService, breakpoint.id);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadFunctionBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_FUNCTION_BREAKPOINTS_KEY, 1 /* StorageScope.WORKSPACE */, '[]')).map((fb) => {
                    return new debugModel_1.FunctionBreakpoint(fb, fb.id);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadExceptionBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_EXCEPTION_BREAKPOINTS_KEY, 1 /* StorageScope.WORKSPACE */, '[]')).map((exBreakpoint) => {
                    return new debugModel_1.ExceptionBreakpoint(exBreakpoint, exBreakpoint.id);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadDataBreakpoints() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_DATA_BREAKPOINTS_KEY, 1 /* StorageScope.WORKSPACE */, '[]')).map((dbp) => {
                    return new debugModel_1.DataBreakpoint(dbp, dbp.id);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadWatchExpressions() {
            let result;
            try {
                result = JSON.parse(this.storageService.get(DEBUG_WATCH_EXPRESSIONS_KEY, 1 /* StorageScope.WORKSPACE */, '[]')).map((watchStoredData) => {
                    return new debugModel_1.Expression(watchStoredData.name, watchStoredData.id);
                });
            }
            catch (e) { }
            return result || [];
        }
        loadChosenEnvironments() {
            return JSON.parse(this.storageService.get(DEBUG_CHOSEN_ENVIRONMENTS_KEY, 1 /* StorageScope.WORKSPACE */, '{}'));
        }
        storeChosenEnvironments(environments) {
            this.storageService.store(DEBUG_CHOSEN_ENVIRONMENTS_KEY, JSON.stringify(environments), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        storeWatchExpressions(watchExpressions) {
            if (watchExpressions.length) {
                this.storageService.store(DEBUG_WATCH_EXPRESSIONS_KEY, JSON.stringify(watchExpressions.map(we => ({ name: we.name, id: we.getId() }))), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(DEBUG_WATCH_EXPRESSIONS_KEY, 1 /* StorageScope.WORKSPACE */);
            }
        }
        storeBreakpoints(debugModel) {
            const breakpoints = debugModel.getBreakpoints();
            if (breakpoints.length) {
                this.storageService.store(DEBUG_BREAKPOINTS_KEY, JSON.stringify(breakpoints), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(DEBUG_BREAKPOINTS_KEY, 1 /* StorageScope.WORKSPACE */);
            }
            const functionBreakpoints = debugModel.getFunctionBreakpoints();
            if (functionBreakpoints.length) {
                this.storageService.store(DEBUG_FUNCTION_BREAKPOINTS_KEY, JSON.stringify(functionBreakpoints), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(DEBUG_FUNCTION_BREAKPOINTS_KEY, 1 /* StorageScope.WORKSPACE */);
            }
            const dataBreakpoints = debugModel.getDataBreakpoints().filter(dbp => dbp.canPersist);
            if (dataBreakpoints.length) {
                this.storageService.store(DEBUG_DATA_BREAKPOINTS_KEY, JSON.stringify(dataBreakpoints), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(DEBUG_DATA_BREAKPOINTS_KEY, 1 /* StorageScope.WORKSPACE */);
            }
            const exceptionBreakpoints = debugModel.getExceptionBreakpoints();
            if (exceptionBreakpoints.length) {
                this.storageService.store(DEBUG_EXCEPTION_BREAKPOINTS_KEY, JSON.stringify(exceptionBreakpoints), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(DEBUG_EXCEPTION_BREAKPOINTS_KEY, 1 /* StorageScope.WORKSPACE */);
            }
        }
    };
    exports.DebugStorage = DebugStorage;
    exports.DebugStorage = DebugStorage = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, log_1.ILogService)
    ], DebugStorage);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdTdG9yYWdlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9jb21tb24vZGVidWdTdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVloRyxNQUFNLHFCQUFxQixHQUFHLGtCQUFrQixDQUFDO0lBQ2pELE1BQU0sOEJBQThCLEdBQUcsMEJBQTBCLENBQUM7SUFDbEUsTUFBTSwwQkFBMEIsR0FBRyxzQkFBc0IsQ0FBQztJQUMxRCxNQUFNLCtCQUErQixHQUFHLDJCQUEyQixDQUFDO0lBQ3BFLE1BQU0sMkJBQTJCLEdBQUcsd0JBQXdCLENBQUM7SUFDN0QsTUFBTSw2QkFBNkIsR0FBRyx5QkFBeUIsQ0FBQztJQUNoRSxNQUFNLGtCQUFrQixHQUFHLGVBQWUsQ0FBQztJQUVwQyxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFhLFNBQVEsc0JBQVU7UUFPM0MsWUFDa0IsY0FBZ0QsRUFDL0MsZUFBa0QsRUFDL0Msa0JBQXdELEVBQ2hFLFVBQXdDO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBTDBCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUM5QixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDOUIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMvQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBVnRDLGdCQUFXLEdBQUcsSUFBQSw0QkFBZSxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztZQUM1RCx3QkFBbUIsR0FBRyxJQUFBLDRCQUFlLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLENBQUM7WUFDNUUseUJBQW9CLEdBQUcsSUFBQSw0QkFBZSxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBQzlFLG9CQUFlLEdBQUcsSUFBQSw0QkFBZSxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQ3BFLHFCQUFnQixHQUFHLElBQUEsNEJBQWUsRUFBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztZQVVyRixJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsaUNBQXlCLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2xHLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNoQixRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFDZixLQUFLLHFCQUFxQjs0QkFDekIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ2hFLEtBQUssOEJBQThCOzRCQUNsQyxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ2hGLEtBQUssK0JBQStCOzRCQUNuQyxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ2xGLEtBQUssMEJBQTBCOzRCQUM5QixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO3dCQUN4RSxLQUFLLDJCQUEyQjs0QkFDL0IsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUMzRSxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELGdCQUFnQjtZQUNmLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLGtDQUEwQixTQUFTLENBQXlCLENBQUM7UUFDL0csQ0FBQztRQUVELGlCQUFpQixDQUFDLEtBQTJCO1lBQzVDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEtBQUssZ0VBQWdELENBQUM7UUFDckcsQ0FBQztRQUVPLGVBQWU7WUFDdEIsSUFBSSxNQUFnQyxDQUFDO1lBQ3JDLElBQUksQ0FBQztnQkFDSixNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsa0NBQTBCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBNEMsRUFBRSxFQUFFO29CQUN0SixVQUFVLENBQUMsR0FBRyxHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUM1QyxPQUFPLElBQUksdUJBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2xILENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWYsT0FBTyxNQUFNLElBQUksRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFFTyx1QkFBdUI7WUFDOUIsSUFBSSxNQUF3QyxDQUFDO1lBQzdDLElBQUksQ0FBQztnQkFDSixNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsa0NBQTBCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBNEMsRUFBRSxFQUFFO29CQUMvSixPQUFPLElBQUksK0JBQWtCLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDMUMsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFZixPQUFPLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUVPLHdCQUF3QjtZQUMvQixJQUFJLE1BQXlDLENBQUM7WUFDOUMsSUFBSSxDQUFDO2dCQUNKLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLCtCQUErQixrQ0FBMEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxZQUF1RCxFQUFFLEVBQUU7b0JBQzNLLE9BQU8sSUFBSSxnQ0FBbUIsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRCxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVmLE9BQU8sTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBRU8sbUJBQW1CO1lBQzFCLElBQUksTUFBb0MsQ0FBQztZQUN6QyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsMEJBQTBCLGtDQUEwQixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQXlDLEVBQUUsRUFBRTtvQkFDeEosT0FBTyxJQUFJLDJCQUFjLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDeEMsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFZixPQUFPLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUVPLG9CQUFvQjtZQUMzQixJQUFJLE1BQWdDLENBQUM7WUFDckMsSUFBSSxDQUFDO2dCQUNKLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLDJCQUEyQixrQ0FBMEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxlQUE2QyxFQUFFLEVBQUU7b0JBQzdKLE9BQU8sSUFBSSx1QkFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRSxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVmLE9BQU8sTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBRUQsc0JBQXNCO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsa0NBQTBCLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDekcsQ0FBQztRQUVELHVCQUF1QixDQUFDLFlBQXVDO1lBQzlELElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLGdFQUFnRCxDQUFDO1FBQ3ZJLENBQUM7UUFFRCxxQkFBcUIsQ0FBQyxnQkFBNkM7WUFDbEUsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxnRUFBZ0QsQ0FBQztZQUN4TCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsMkJBQTJCLGlDQUF5QixDQUFDO1lBQ2pGLENBQUM7UUFDRixDQUFDO1FBRUQsZ0JBQWdCLENBQUMsVUFBdUI7WUFDdkMsTUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ2hELElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxnRUFBZ0QsQ0FBQztZQUM5SCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMscUJBQXFCLGlDQUF5QixDQUFDO1lBQzNFLENBQUM7WUFFRCxNQUFNLG1CQUFtQixHQUFHLFVBQVUsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBQ2hFLElBQUksbUJBQW1CLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLDhCQUE4QixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsZ0VBQWdELENBQUM7WUFDL0ksQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLDhCQUE4QixpQ0FBeUIsQ0FBQztZQUNwRixDQUFDO1lBRUQsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLGtCQUFrQixFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3RGLElBQUksZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxnRUFBZ0QsQ0FBQztZQUN2SSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsMEJBQTBCLGlDQUF5QixDQUFDO1lBQ2hGLENBQUM7WUFFRCxNQUFNLG9CQUFvQixHQUFHLFVBQVUsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQ2xFLElBQUksb0JBQW9CLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLCtCQUErQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsZ0VBQWdELENBQUM7WUFDakosQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLCtCQUErQixpQ0FBeUIsQ0FBQztZQUNyRixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUE5SVksb0NBQVk7MkJBQVosWUFBWTtRQVF0QixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLDRCQUFnQixDQUFBO1FBQ2hCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxpQkFBVyxDQUFBO09BWEQsWUFBWSxDQThJeEIifQ==