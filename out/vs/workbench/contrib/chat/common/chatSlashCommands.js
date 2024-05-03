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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions"], function (require, exports, event_1, lifecycle_1, instantiation_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatSlashCommandService = exports.IChatSlashCommandService = void 0;
    exports.IChatSlashCommandService = (0, instantiation_1.createDecorator)('chatSlashCommandService');
    let ChatSlashCommandService = class ChatSlashCommandService extends lifecycle_1.Disposable {
        constructor(_extensionService) {
            super();
            this._extensionService = _extensionService;
            this._commands = new Map();
            this._onDidChangeCommands = this._register(new event_1.Emitter());
            this.onDidChangeCommands = this._onDidChangeCommands.event;
        }
        dispose() {
            super.dispose();
            this._commands.clear();
        }
        registerSlashCommand(data, command) {
            if (this._commands.has(data.command)) {
                throw new Error(`Already registered a command with id ${data.command}}`);
            }
            this._commands.set(data.command, { data, command });
            this._onDidChangeCommands.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._commands.delete(data.command)) {
                    this._onDidChangeCommands.fire();
                }
            });
        }
        getCommands() {
            return Array.from(this._commands.values(), v => v.data);
        }
        hasCommand(id) {
            return this._commands.has(id);
        }
        async executeCommand(id, prompt, progress, history, token) {
            const data = this._commands.get(id);
            if (!data) {
                throw new Error('No command with id ${id} NOT registered');
            }
            if (!data.command) {
                await this._extensionService.activateByEvent(`onSlash:${id}`);
            }
            if (!data.command) {
                throw new Error(`No command with id ${id} NOT resolved`);
            }
            return await data.command(prompt, progress, history, token);
        }
    };
    exports.ChatSlashCommandService = ChatSlashCommandService;
    exports.ChatSlashCommandService = ChatSlashCommandService = __decorate([
        __param(0, extensions_1.IExtensionService)
    ], ChatSlashCommandService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFNsYXNoQ29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvY29tbW9uL2NoYXRTbGFzaENvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThCbkYsUUFBQSx3QkFBd0IsR0FBRyxJQUFBLCtCQUFlLEVBQTJCLHlCQUF5QixDQUFDLENBQUM7SUFnQnRHLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsc0JBQVU7UUFTdEQsWUFBK0IsaUJBQXFEO1lBQ25GLEtBQUssRUFBRSxDQUFDO1lBRHVDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFMbkUsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFpQixDQUFDO1lBRXJDLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ25FLHdCQUFtQixHQUFnQixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1FBSTVFLENBQUM7UUFFUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVELG9CQUFvQixDQUFDLElBQW9CLEVBQUUsT0FBMkI7WUFDckUsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7WUFDMUUsQ0FBQztZQUVELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFakMsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUN6QyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2xDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxXQUFXO1lBQ1YsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVELFVBQVUsQ0FBQyxFQUFVO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBVSxFQUFFLE1BQWMsRUFBRSxRQUFrQyxFQUFFLE9BQXVCLEVBQUUsS0FBd0I7WUFDckksTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMseUNBQXlDLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMvRCxDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBRUQsT0FBTyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0QsQ0FBQztLQUNELENBQUE7SUF2RFksMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFTdEIsV0FBQSw4QkFBaUIsQ0FBQTtPQVRsQix1QkFBdUIsQ0F1RG5DIn0=