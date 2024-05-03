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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log"], function (require, exports, event_1, lifecycle_1, instantiation_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcessLifecycleService = exports.ISharedProcessLifecycleService = void 0;
    exports.ISharedProcessLifecycleService = (0, instantiation_1.createDecorator)('sharedProcessLifecycleService');
    let SharedProcessLifecycleService = class SharedProcessLifecycleService extends lifecycle_1.Disposable {
        constructor(logService) {
            super();
            this.logService = logService;
            this._onWillShutdown = this._register(new event_1.Emitter());
            this.onWillShutdown = this._onWillShutdown.event;
        }
        fireOnWillShutdown() {
            this.logService.trace('Lifecycle#onWillShutdown.fire()');
            this._onWillShutdown.fire();
        }
    };
    exports.SharedProcessLifecycleService = SharedProcessLifecycleService;
    exports.SharedProcessLifecycleService = SharedProcessLifecycleService = __decorate([
        __param(0, log_1.ILogService)
    ], SharedProcessLifecycleService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkUHJvY2Vzc0xpZmVjeWNsZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2xpZmVjeWNsZS9ub2RlL3NoYXJlZFByb2Nlc3NMaWZlY3ljbGVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQU9uRixRQUFBLDhCQUE4QixHQUFHLElBQUEsK0JBQWUsRUFBaUMsK0JBQStCLENBQUMsQ0FBQztJQVl4SCxJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE4QixTQUFRLHNCQUFVO1FBTzVELFlBQ2MsVUFBd0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFGc0IsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUpyQyxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzlELG1CQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7UUFNckQsQ0FBQztRQUVELGtCQUFrQjtZQUNqQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1lBRXpELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDN0IsQ0FBQztLQUNELENBQUE7SUFsQlksc0VBQTZCOzRDQUE3Qiw2QkFBNkI7UUFRdkMsV0FBQSxpQkFBVyxDQUFBO09BUkQsNkJBQTZCLENBa0J6QyJ9