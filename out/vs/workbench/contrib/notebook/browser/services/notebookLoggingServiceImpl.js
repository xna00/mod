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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/log/common/log"], function (require, exports, nls, lifecycle_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookLoggingService = void 0;
    const logChannelId = 'notebook.rendering';
    let NotebookLoggingService = class NotebookLoggingService extends lifecycle_1.Disposable {
        static { this.ID = 'notebook'; }
        constructor(loggerService) {
            super();
            this._logger = this._register(loggerService.createLogger(logChannelId, { name: nls.localize('renderChannelName', "Notebook rendering") }));
        }
        debug(category, output) {
            this._logger.debug(`[${category}] ${output}`);
        }
        info(category, output) {
            this._logger.info(`[${category}] ${output}`);
        }
    };
    exports.NotebookLoggingService = NotebookLoggingService;
    exports.NotebookLoggingService = NotebookLoggingService = __decorate([
        __param(0, log_1.ILoggerService)
    ], NotebookLoggingService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tMb2dnaW5nU2VydmljZUltcGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvc2VydmljZXMvbm90ZWJvb2tMb2dnaW5nU2VydmljZUltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBT2hHLE1BQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFDO0lBRW5DLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEsc0JBQVU7aUJBRzlDLE9BQUUsR0FBVyxVQUFVLEFBQXJCLENBQXNCO1FBRy9CLFlBQ2lCLGFBQTZCO1lBRTdDLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUUsb0JBQW9CLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1SSxDQUFDO1FBRUQsS0FBSyxDQUFDLFFBQWdCLEVBQUUsTUFBYztZQUNyQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLFFBQVEsS0FBSyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCxJQUFJLENBQUMsUUFBZ0IsRUFBRSxNQUFjO1lBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksUUFBUSxLQUFLLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDOUMsQ0FBQzs7SUFuQlcsd0RBQXNCO3FDQUF0QixzQkFBc0I7UUFPaEMsV0FBQSxvQkFBYyxDQUFBO09BUEosc0JBQXNCLENBb0JsQyJ9