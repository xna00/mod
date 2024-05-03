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
define(["require", "exports", "vs/base/common/numbers", "vs/base/browser/ui/sash/sash", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/layout/browser/layoutService"], function (require, exports, numbers_1, sash_1, event_1, lifecycle_1, configuration_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SashSettingsController = exports.maxSize = exports.minSize = void 0;
    exports.minSize = 1;
    exports.maxSize = 20; // see also https://ux.stackexchange.com/questions/39023/what-is-the-optimum-button-size-of-touch-screen-applications
    let SashSettingsController = class SashSettingsController {
        constructor(configurationService, layoutService) {
            this.configurationService = configurationService;
            this.layoutService = layoutService;
            this.disposables = new lifecycle_1.DisposableStore();
            const onDidChangeSize = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('workbench.sash.size'));
            onDidChangeSize(this.onDidChangeSize, this, this.disposables);
            this.onDidChangeSize();
            const onDidChangeHoverDelay = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('workbench.sash.hoverDelay'));
            onDidChangeHoverDelay(this.onDidChangeHoverDelay, this, this.disposables);
            this.onDidChangeHoverDelay();
        }
        onDidChangeSize() {
            const configuredSize = this.configurationService.getValue('workbench.sash.size');
            const size = (0, numbers_1.clamp)(configuredSize, 4, 20);
            const hoverSize = (0, numbers_1.clamp)(configuredSize, 1, 8);
            this.layoutService.mainContainer.style.setProperty('--vscode-sash-size', size + 'px');
            this.layoutService.mainContainer.style.setProperty('--vscode-sash-hover-size', hoverSize + 'px');
            (0, sash_1.setGlobalSashSize)(size);
        }
        onDidChangeHoverDelay() {
            (0, sash_1.setGlobalHoverDelay)(this.configurationService.getValue('workbench.sash.hoverDelay'));
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    exports.SashSettingsController = SashSettingsController;
    exports.SashSettingsController = SashSettingsController = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, layoutService_1.ILayoutService)
    ], SashSettingsController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FzaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2FzaC9icm93c2VyL3Nhc2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVW5GLFFBQUEsT0FBTyxHQUFHLENBQUMsQ0FBQztJQUNaLFFBQUEsT0FBTyxHQUFHLEVBQUUsQ0FBQyxDQUFDLHFIQUFxSDtJQUV6SSxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjtRQUlsQyxZQUN3QixvQkFBNEQsRUFDbkUsYUFBOEM7WUFEdEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNsRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFKOUMsZ0JBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQU1wRCxNQUFNLGVBQWUsR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUN4SSxlQUFlLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzlELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUV2QixNQUFNLHFCQUFxQixHQUFHLGFBQUssQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO1lBQ3BKLHFCQUFxQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFTyxlQUFlO1lBQ3RCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVMscUJBQXFCLENBQUMsQ0FBQztZQUN6RixNQUFNLElBQUksR0FBRyxJQUFBLGVBQUssRUFBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sU0FBUyxHQUFHLElBQUEsZUFBSyxFQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFOUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDdEYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsRUFBRSxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDakcsSUFBQSx3QkFBaUIsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBRU8scUJBQXFCO1lBQzVCLElBQUEsMEJBQW1CLEVBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBUywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzVCLENBQUM7S0FDRCxDQUFBO0lBbENZLHdEQUFzQjtxQ0FBdEIsc0JBQXNCO1FBS2hDLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw4QkFBYyxDQUFBO09BTkosc0JBQXNCLENBa0NsQyJ9