/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/browser/browser", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/workbench/services/themes/common/hostColorSchemeService", "vs/base/browser/window"], function (require, exports, event_1, browser_1, extensions_1, lifecycle_1, hostColorSchemeService_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserHostColorSchemeService = void 0;
    class BrowserHostColorSchemeService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidSchemeChangeEvent = this._register(new event_1.Emitter());
            this.registerListeners();
        }
        registerListeners() {
            (0, browser_1.addMatchMediaChangeListener)(window_1.mainWindow, '(prefers-color-scheme: dark)', () => {
                this._onDidSchemeChangeEvent.fire();
            });
            (0, browser_1.addMatchMediaChangeListener)(window_1.mainWindow, '(forced-colors: active)', () => {
                this._onDidSchemeChangeEvent.fire();
            });
        }
        get onDidChangeColorScheme() {
            return this._onDidSchemeChangeEvent.event;
        }
        get dark() {
            if (window_1.mainWindow.matchMedia(`(prefers-color-scheme: light)`).matches) {
                return false;
            }
            else if (window_1.mainWindow.matchMedia(`(prefers-color-scheme: dark)`).matches) {
                return true;
            }
            return false;
        }
        get highContrast() {
            if (window_1.mainWindow.matchMedia(`(forced-colors: active)`).matches) {
                return true;
            }
            return false;
        }
    }
    exports.BrowserHostColorSchemeService = BrowserHostColorSchemeService;
    (0, extensions_1.registerSingleton)(hostColorSchemeService_1.IHostColorSchemeService, BrowserHostColorSchemeService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlckhvc3RDb2xvclNjaGVtZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90aGVtZXMvYnJvd3Nlci9icm93c2VySG9zdENvbG9yU2NoZW1lU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSw2QkFBOEIsU0FBUSxzQkFBVTtRQU01RDtZQUVDLEtBQUssRUFBRSxDQUFDO1lBSlEsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFNOUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUV4QixJQUFBLHFDQUEyQixFQUFDLG1CQUFVLEVBQUUsOEJBQThCLEVBQUUsR0FBRyxFQUFFO2dCQUM1RSxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDckMsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFBLHFDQUEyQixFQUFDLG1CQUFVLEVBQUUseUJBQXlCLEVBQUUsR0FBRyxFQUFFO2dCQUN2RSxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDckMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsSUFBSSxzQkFBc0I7WUFDekIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1FBQzNDLENBQUM7UUFFRCxJQUFJLElBQUk7WUFDUCxJQUFJLG1CQUFVLENBQUMsVUFBVSxDQUFDLCtCQUErQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3BFLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztpQkFBTSxJQUFJLG1CQUFVLENBQUMsVUFBVSxDQUFDLDhCQUE4QixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzFFLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELElBQUksWUFBWTtZQUNmLElBQUksbUJBQVUsQ0FBQyxVQUFVLENBQUMseUJBQXlCLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDOUQsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO0tBRUQ7SUEzQ0Qsc0VBMkNDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxnREFBdUIsRUFBRSw2QkFBNkIsb0NBQTRCLENBQUMifQ==