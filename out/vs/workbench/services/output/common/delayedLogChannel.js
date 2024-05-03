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
define(["require", "exports", "vs/platform/log/common/log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DelayedLogChannel = void 0;
    let DelayedLogChannel = class DelayedLogChannel {
        constructor(id, name, file, loggerService) {
            this.file = file;
            this.loggerService = loggerService;
            this.logger = loggerService.createLogger(file, { name, id, hidden: true });
        }
        log(level, message) {
            this.loggerService.setVisibility(this.file, true);
            (0, log_1.log)(this.logger, level, message);
        }
    };
    exports.DelayedLogChannel = DelayedLogChannel;
    exports.DelayedLogChannel = DelayedLogChannel = __decorate([
        __param(3, log_1.ILoggerService)
    ], DelayedLogChannel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsYXllZExvZ0NoYW5uZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9vdXRwdXQvY29tbW9uL2RlbGF5ZWRMb2dDaGFubmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQUt6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFpQjtRQUk3QixZQUNDLEVBQVUsRUFBRSxJQUFZLEVBQW1CLElBQVMsRUFDbkIsYUFBNkI7WUFEbkIsU0FBSSxHQUFKLElBQUksQ0FBSztZQUNuQixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFFOUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDNUUsQ0FBQztRQUVELEdBQUcsQ0FBQyxLQUFlLEVBQUUsT0FBZTtZQUNuQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xELElBQUEsU0FBRyxFQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2xDLENBQUM7S0FFRCxDQUFBO0lBaEJZLDhDQUFpQjtnQ0FBakIsaUJBQWlCO1FBTTNCLFdBQUEsb0JBQWMsQ0FBQTtPQU5KLGlCQUFpQixDQWdCN0IifQ==