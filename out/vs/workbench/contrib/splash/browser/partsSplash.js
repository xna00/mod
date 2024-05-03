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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editor", "vs/workbench/common/theme", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/base/common/performance", "vs/base/common/types", "vs/workbench/contrib/splash/browser/splash", "vs/base/browser/window", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, browser_1, dom, color_1, event_1, lifecycle_1, colorRegistry_1, themeService_1, editor_1, themes, layoutService_1, environmentService_1, editorGroupsService_1, configuration_1, perf, types_1, splash_1, window_1, lifecycle_2) {
    "use strict";
    var PartsSplash_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PartsSplash = void 0;
    let PartsSplash = class PartsSplash {
        static { PartsSplash_1 = this; }
        static { this.ID = 'workbench.contrib.partsSplash'; }
        static { this._splashElementId = 'monaco-parts-splash'; }
        constructor(_themeService, _layoutService, _environmentService, _configService, _partSplashService, editorGroupsService, lifecycleService) {
            this._themeService = _themeService;
            this._layoutService = _layoutService;
            this._environmentService = _environmentService;
            this._configService = _configService;
            this._partSplashService = _partSplashService;
            this._disposables = new lifecycle_1.DisposableStore();
            event_1.Event.once(_layoutService.onDidLayoutMainContainer)(() => {
                this._removePartsSplash();
                perf.mark('code/didRemovePartsSplash');
            }, undefined, this._disposables);
            const lastIdleSchedule = this._disposables.add(new lifecycle_1.MutableDisposable());
            const savePartsSplashSoon = () => {
                lastIdleSchedule.value = dom.runWhenWindowIdle(window_1.mainWindow, () => this._savePartsSplash(), 2500);
            };
            lifecycleService.when(3 /* LifecyclePhase.Restored */).then(() => {
                event_1.Event.any(event_1.Event.filter(browser_1.onDidChangeFullscreen, windowId => windowId === window_1.mainWindow.vscodeWindowId), editorGroupsService.mainPart.onDidLayout, _themeService.onDidColorThemeChange)(savePartsSplashSoon, undefined, this._disposables);
                savePartsSplashSoon();
            });
            _configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("window.titleBarStyle" /* TitleBarSetting.TITLE_BAR_STYLE */)) {
                    this._didChangeTitleBarStyle = true;
                    this._savePartsSplash();
                }
            }, this, this._disposables);
        }
        dispose() {
            this._disposables.dispose();
        }
        _savePartsSplash() {
            const theme = this._themeService.getColorTheme();
            this._partSplashService.saveWindowSplash({
                zoomLevel: this._configService.getValue('window.zoomLevel'),
                baseTheme: (0, themeService_1.getThemeTypeSelector)(theme.type),
                colorInfo: {
                    foreground: theme.getColor(colorRegistry_1.foreground)?.toString(),
                    background: color_1.Color.Format.CSS.formatHex(theme.getColor(colorRegistry_1.editorBackground) || themes.WORKBENCH_BACKGROUND(theme)),
                    editorBackground: theme.getColor(colorRegistry_1.editorBackground)?.toString(),
                    titleBarBackground: theme.getColor(themes.TITLE_BAR_ACTIVE_BACKGROUND)?.toString(),
                    activityBarBackground: theme.getColor(themes.ACTIVITY_BAR_BACKGROUND)?.toString(),
                    sideBarBackground: theme.getColor(themes.SIDE_BAR_BACKGROUND)?.toString(),
                    statusBarBackground: theme.getColor(themes.STATUS_BAR_BACKGROUND)?.toString(),
                    statusBarNoFolderBackground: theme.getColor(themes.STATUS_BAR_NO_FOLDER_BACKGROUND)?.toString(),
                    windowBorder: theme.getColor(themes.WINDOW_ACTIVE_BORDER)?.toString() ?? theme.getColor(themes.WINDOW_INACTIVE_BORDER)?.toString()
                },
                layoutInfo: !this._shouldSaveLayoutInfo() ? undefined : {
                    sideBarSide: this._layoutService.getSideBarPosition() === 1 /* Position.RIGHT */ ? 'right' : 'left',
                    editorPartMinWidth: editor_1.DEFAULT_EDITOR_MIN_DIMENSIONS.width,
                    titleBarHeight: this._layoutService.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, window_1.mainWindow) ? dom.getTotalHeight((0, types_1.assertIsDefined)(this._layoutService.getContainer(window_1.mainWindow, "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */))) : 0,
                    activityBarWidth: this._layoutService.isVisible("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */) ? dom.getTotalWidth((0, types_1.assertIsDefined)(this._layoutService.getContainer(window_1.mainWindow, "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */))) : 0,
                    sideBarWidth: this._layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) ? dom.getTotalWidth((0, types_1.assertIsDefined)(this._layoutService.getContainer(window_1.mainWindow, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */))) : 0,
                    statusBarHeight: this._layoutService.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, window_1.mainWindow) ? dom.getTotalHeight((0, types_1.assertIsDefined)(this._layoutService.getContainer(window_1.mainWindow, "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */))) : 0,
                    windowBorder: this._layoutService.hasMainWindowBorder(),
                    windowBorderRadius: this._layoutService.getMainWindowBorderRadius()
                }
            });
        }
        _shouldSaveLayoutInfo() {
            return !(0, browser_1.isFullscreen)(window_1.mainWindow) && !this._environmentService.isExtensionDevelopment && !this._didChangeTitleBarStyle;
        }
        _removePartsSplash() {
            const element = window_1.mainWindow.document.getElementById(PartsSplash_1._splashElementId);
            if (element) {
                element.style.display = 'none';
            }
            // remove initial colors
            const defaultStyles = window_1.mainWindow.document.head.getElementsByClassName('initialShellColors');
            if (defaultStyles.length) {
                window_1.mainWindow.document.head.removeChild(defaultStyles[0]);
            }
        }
    };
    exports.PartsSplash = PartsSplash;
    exports.PartsSplash = PartsSplash = PartsSplash_1 = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, splash_1.ISplashStorageService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, lifecycle_2.ILifecycleService)
    ], PartsSplash);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydHNTcGxhc2guanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NwbGFzaC9icm93c2VyL3BhcnRzU3BsYXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFzQnpGLElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVc7O2lCQUVQLE9BQUUsR0FBRywrQkFBK0IsQUFBbEMsQ0FBbUM7aUJBRTdCLHFCQUFnQixHQUFHLHFCQUFxQixBQUF4QixDQUF5QjtRQU1qRSxZQUNnQixhQUE2QyxFQUNuQyxjQUF3RCxFQUNuRCxtQkFBa0UsRUFDekUsY0FBc0QsRUFDdEQsa0JBQTBELEVBQzNELG1CQUF5QyxFQUM1QyxnQkFBbUM7WUFOdEIsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDbEIsbUJBQWMsR0FBZCxjQUFjLENBQXlCO1lBQ2xDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBOEI7WUFDeEQsbUJBQWMsR0FBZCxjQUFjLENBQXVCO1lBQ3JDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBdUI7WUFUakUsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQWFyRCxhQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEdBQUcsRUFBRTtnQkFDeEQsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUN4QyxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVqQyxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sbUJBQW1C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