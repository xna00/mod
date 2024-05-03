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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification"], function (require, exports, nls, path, lifecycle_1, editorExtensions_1, configuration_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LargeFileOptimizationsWarner = void 0;
    /**
     * Shows a message when opening a large file which has been memory optimized (and features disabled).
     */
    let LargeFileOptimizationsWarner = class LargeFileOptimizationsWarner extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.largeFileOptimizationsWarner'; }
        constructor(_editor, _notificationService, _configurationService) {
            super();
            this._editor = _editor;
            this._notificationService = _notificationService;
            this._configurationService = _configurationService;
            this._register(this._editor.onDidChangeModel((e) => this._update()));
            this._update();
        }
        _update() {
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            if (model.isTooLargeForTokenization()) {
                const message = nls.localize({
                    key: 'largeFile',
                    comment: [
                        'Variable 0 will be a file name.'
                    ]
                }, "{0}: tokenization, wrapping, folding, codelens, word highlighting and sticky scroll have been turned off for this large file in order to reduce memory usage and avoid freezing or crashing.", path.basename(model.uri.path));
                this._notificationService.prompt(notification_1.Severity.Info, message, [
                    {
                        label: nls.localize('removeOptimizations', "Forcefully Enable Features"),
                        run: () => {
                            this._configurationService.updateValue(`editor.largeFileOptimizations`, false).then(() => {
                                this._notificationService.info(nls.localize('reopenFilePrompt', "Please reopen file in order for this setting to take effect."));
                            }, (err) => {
                                this._notificationService.error(err);
                            });
                        }
                    }
                ], { neverShowAgain: { id: 'editor.contrib.largeFileOptimizationsWarner' } });
            }
        }
    };
    exports.LargeFileOptimizationsWarner = LargeFileOptimizationsWarner;
    exports.LargeFileOptimizationsWarner = LargeFileOptimizationsWarner = __decorate([
        __param(1, notification_1.INotificationService),
        __param(2, configuration_1.IConfigurationService)
    ], LargeFileOptimizationsWarner);
    (0, editorExtensions_1.registerEditorContribution)(LargeFileOptimizationsWarner.ID, LargeFileOptimizationsWarner, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFyZ2VGaWxlT3B0aW1pemF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL2xhcmdlRmlsZU9wdGltaXphdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV2hHOztPQUVHO0lBQ0ksSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBNkIsU0FBUSxzQkFBVTtpQkFFcEMsT0FBRSxHQUFHLDZDQUE2QyxBQUFoRCxDQUFpRDtRQUUxRSxZQUNrQixPQUFvQixFQUNFLG9CQUEwQyxFQUN6QyxxQkFBNEM7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFKUyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ0UseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUN6QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBSXBGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQUVPLE9BQU87WUFDZCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksS0FBSyxDQUFDLHlCQUF5QixFQUFFLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FDM0I7b0JBQ0MsR0FBRyxFQUFFLFdBQVc7b0JBQ2hCLE9BQU8sRUFBRTt3QkFDUixpQ0FBaUM7cUJBQ2pDO2lCQUNELEVBQ0QsOExBQThMLEVBQzlMLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FDN0IsQ0FBQztnQkFFRixJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLHVCQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtvQkFDeEQ7d0JBQ0MsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsNEJBQTRCLENBQUM7d0JBQ3hFLEdBQUcsRUFBRSxHQUFHLEVBQUU7NEJBQ1QsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFdBQVcsQ0FBQywrQkFBK0IsRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dDQUN4RixJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsOERBQThELENBQUMsQ0FBQyxDQUFDOzRCQUNsSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQ0FDVixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUN0QyxDQUFDLENBQUMsQ0FBQzt3QkFDSixDQUFDO3FCQUNEO2lCQUNELEVBQUUsRUFBRSxjQUFjLEVBQUUsRUFBRSxFQUFFLEVBQUUsNkNBQTZDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDL0UsQ0FBQztRQUNGLENBQUM7O0lBOUNXLG9FQUE0QjsyQ0FBNUIsNEJBQTRCO1FBTXRDLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSxxQ0FBcUIsQ0FBQTtPQVBYLDRCQUE0QixDQStDeEM7SUFFRCxJQUFBLDZDQUEwQixFQUFDLDRCQUE0QixDQUFDLEVBQUUsRUFBRSw0QkFBNEIsMkRBQW1ELENBQUMifQ==