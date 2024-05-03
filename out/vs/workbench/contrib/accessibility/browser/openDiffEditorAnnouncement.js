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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/base/common/event"], function (require, exports, lifecycle_1, editorBrowser_1, nls_1, accessibility_1, configuration_1, editorService_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorActiveAnnouncementContribution = void 0;
    let DiffEditorActiveAnnouncementContribution = class DiffEditorActiveAnnouncementContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.diffEditorActiveAnnouncement'; }
        constructor(_editorService, _accessibilityService, _configurationService) {
            super();
            this._editorService = _editorService;
            this._accessibilityService = _accessibilityService;
            this._configurationService = _configurationService;
            this._register(event_1.Event.runAndSubscribe(_accessibilityService.onDidChangeScreenReaderOptimized, () => this._updateListener()));
            this._register(_configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("accessibility.verbosity.diffEditorActive" /* AccessibilityVerbositySettingId.DiffEditorActive */)) {
                    this._updateListener();
                }
            }));
        }
        _updateListener() {
            const announcementEnabled = this._configurationService.getValue("accessibility.verbosity.diffEditorActive" /* AccessibilityVerbositySettingId.DiffEditorActive */);
            const screenReaderOptimized = this._accessibilityService.isScreenReaderOptimized();
            if (!announcementEnabled || !screenReaderOptimized) {
                this._onDidActiveEditorChangeListener?.dispose();
                this._onDidActiveEditorChangeListener = undefined;
                return;
            }
            if (this._onDidActiveEditorChangeListener) {
                return;
            }
            this._onDidActiveEditorChangeListener = this._register(this._editorService.onDidActiveEditorChange(() => {
                if ((0, editorBrowser_1.isDiffEditor)(this._editorService.activeTextEditorControl)) {
                    this._accessibilityService.alert((0, nls_1.localize)('openDiffEditorAnnouncement', "Diff editor"));
                }
            }));
        }
    };
    exports.DiffEditorActiveAnnouncementContribution = DiffEditorActiveAnnouncementContribution;
    exports.DiffEditorActiveAnnouncementContribution = DiffEditorActiveAnnouncementContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, accessibility_1.IAccessibilityService),
        __param(2, configuration_1.IConfigurationService)
    ], DiffEditorActiveAnnouncementContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbkRpZmZFZGl0b3JBbm5vdW5jZW1lbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHkvYnJvd3Nlci9vcGVuRGlmZkVkaXRvckFubm91bmNlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSx3Q0FBd0MsR0FBOUMsTUFBTSx3Q0FBeUMsU0FBUSxzQkFBVTtpQkFFdkQsT0FBRSxHQUFHLGdEQUFnRCxBQUFuRCxDQUFvRDtRQUl0RSxZQUNrQyxjQUE4QixFQUN2QixxQkFBNEMsRUFDNUMscUJBQTRDO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBSnlCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUN2QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzVDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFHcEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsZUFBZSxDQUFDLHFCQUFxQixDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDakUsSUFBSSxDQUFDLENBQUMsb0JBQW9CLG1HQUFrRCxFQUFFLENBQUM7b0JBQzlFLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDeEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sZUFBZTtZQUN0QixNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLG1HQUFrRCxDQUFDO1lBQ2xILE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFFbkYsSUFBSSxDQUFDLG1CQUFtQixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLE9BQU8sRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsZ0NBQWdDLEdBQUcsU0FBUyxDQUFDO2dCQUNsRCxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLGdDQUFnQyxFQUFFLENBQUM7Z0JBQzNDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLGdDQUFnQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3ZHLElBQUksSUFBQSw0QkFBWSxFQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUMsRUFBRSxDQUFDO29CQUMvRCxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQzs7SUF2Q1csNEZBQXdDO3VEQUF4Qyx3Q0FBd0M7UUFPbEQsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFDQUFxQixDQUFBO09BVFgsd0NBQXdDLENBd0NwRCJ9