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
define(["require", "exports", "electron", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/state/node/state", "vs/platform/window/common/window", "vs/platform/windows/electron-main/windowImpl"], function (require, exports, electron_1, platform_1, configuration_1, environmentMainService_1, lifecycleMainService_1, log_1, state_1, window_1, windowImpl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuxiliaryWindow = void 0;
    let AuxiliaryWindow = class AuxiliaryWindow extends windowImpl_1.BaseWindow {
        get win() {
            if (!super.win) {
                this.tryClaimWindow();
            }
            return super.win;
        }
        constructor(contents, environmentMainService, logService, configurationService, stateService, lifecycleMainService) {
            super(configurationService, stateService, environmentMainService, logService);
            this.contents = contents;
            this.lifecycleMainService = lifecycleMainService;
            this.id = this.contents.id;
            this.parentId = -1;
            // Try to claim window
            this.tryClaimWindow();
        }
        tryClaimWindow() {
            if (this._win) {
                return; // already claimed
            }
            if (this._store.isDisposed || this.contents.isDestroyed()) {
                return; // already disposed
            }
            const window = electron_1.BrowserWindow.fromWebContents(this.contents);
            if (window) {
                this.logService.trace('[aux window] Claimed browser window instance');
                // Remember
                this.setWin(window);
                // Disable Menu
                window.setMenu(null);
                if ((platform_1.isWindows || platform_1.isLinux) && (0, window_1.hasNativeTitlebar)(this.configurationService)) {
                    window.setAutoHideMenuBar(true); // Fix for https://github.com/microsoft/vscode/issues/200615
                }
                // Lifecycle
                this.lifecycleMainService.registerAuxWindow(this);
            }
        }
    };
    exports.AuxiliaryWindow = AuxiliaryWindow;
    exports.AuxiliaryWindow = AuxiliaryWindow = __decorate([
        __param(1, environmentMainService_1.IEnvironmentMainService),
        __param(2, log_1.ILogService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, state_1.IStateService),
        __param(5, lifecycleMainService_1.ILifecycleMainService)
    ], AuxiliaryWindow);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5V2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hdXhpbGlhcnlXaW5kb3cvZWxlY3Ryb24tbWFpbi9hdXhpbGlhcnlXaW5kb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJ6RixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHVCQUFVO1FBSzlDLElBQWEsR0FBRztZQUNmLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxZQUNrQixRQUFxQixFQUNiLHNCQUErQyxFQUMzRCxVQUF1QixFQUNiLG9CQUEyQyxFQUNuRCxZQUEyQixFQUNuQixvQkFBNEQ7WUFFbkYsS0FBSyxDQUFDLG9CQUFvQixFQUFFLFlBQVksRUFBRSxzQkFBc0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQVA3RCxhQUFRLEdBQVIsUUFBUSxDQUFhO1lBS0UseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQWpCM0UsT0FBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQy9CLGFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztZQW9CYixzQkFBc0I7WUFDdEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxjQUFjO1lBQ2IsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxDQUFDLGtCQUFrQjtZQUMzQixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQzNELE9BQU8sQ0FBQyxtQkFBbUI7WUFDNUIsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLHdCQUFhLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1RCxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7Z0JBRXRFLFdBQVc7Z0JBQ1gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFcEIsZUFBZTtnQkFDZixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNyQixJQUFJLENBQUMsb0JBQVMsSUFBSSxrQkFBTyxDQUFDLElBQUksSUFBQSwwQkFBaUIsRUFBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDO29CQUM1RSxNQUFNLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyw0REFBNEQ7Z0JBQzlGLENBQUM7Z0JBRUQsWUFBWTtnQkFDWixJQUFJLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkQsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBckRZLDBDQUFlOzhCQUFmLGVBQWU7UUFlekIsV0FBQSxnREFBdUIsQ0FBQTtRQUN2QixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsNENBQXFCLENBQUE7T0FuQlgsZUFBZSxDQXFEM0IifQ==