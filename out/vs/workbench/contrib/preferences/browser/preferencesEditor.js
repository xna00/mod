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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/preferences/browser/preferencesRenderers", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesModels"], function (require, exports, lifecycle_1, instantiation_1, workspace_1, preferencesRenderers_1, preferences_1, preferencesModels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsEditorContribution = void 0;
    let SettingsEditorContribution = class SettingsEditorContribution extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.settings'; }
        constructor(editor, instantiationService, preferencesService, workspaceContextService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.preferencesService = preferencesService;
            this.workspaceContextService = workspaceContextService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this._createPreferencesRenderer();
            this._register(this.editor.onDidChangeModel(e => this._createPreferencesRenderer()));
            this._register(this.workspaceContextService.onDidChangeWorkbenchState(() => this._createPreferencesRenderer()));
        }
        async _createPreferencesRenderer() {
            this.disposables.clear();
            this.currentRenderer = undefined;
            const model = this.editor.getModel();
            if (model && /\.(json|code-workspace)$/.test(model.uri.path)) {
                // Fast check: the preferences renderer can only appear
                // in settings files or workspace files
                const settingsModel = await this.preferencesService.createPreferencesEditorModel(model.uri);
                if (settingsModel instanceof preferencesModels_1.SettingsEditorModel && this.editor.getModel()) {
                    this.disposables.add(settingsModel);
                    switch (settingsModel.configurationTarget) {
                        case 5 /* ConfigurationTarget.WORKSPACE */:
                            this.currentRenderer = this.disposables.add(this.instantiationService.createInstance(preferencesRenderers_1.WorkspaceSettingsRenderer, this.editor, settingsModel));
                            break;
                        default:
                            this.currentRenderer = this.disposables.add(this.instantiationService.createInstance(preferencesRenderers_1.UserSettingsRenderer, this.editor, settingsModel));
                            break;
                    }
                }
                this.currentRenderer?.render();
            }
        }
    };
    exports.SettingsEditorContribution = SettingsEditorContribution;
    exports.SettingsEditorContribution = SettingsEditorContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, preferences_1.IPreferencesService),
        __param(3, workspace_1.IWorkspaceContextService)
    ], SettingsEditorContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2Jyb3dzZXIvcHJlZmVyZW5jZXNFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0sMEJBQTBCLEdBQWhDLE1BQU0sMEJBQTJCLFNBQVEsc0JBQVU7aUJBQ3pDLE9BQUUsR0FBVyx5QkFBeUIsQUFBcEMsQ0FBcUM7UUFLdkQsWUFDa0IsTUFBbUIsRUFDYixvQkFBNEQsRUFDOUQsa0JBQXdELEVBQ25ELHVCQUFrRTtZQUU1RixLQUFLLEVBQUUsQ0FBQztZQUxTLFdBQU0sR0FBTixNQUFNLENBQWE7WUFDSSx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzdDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDbEMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQU41RSxnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQVNwRSxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMseUJBQXlCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pILENBQUM7UUFFTyxLQUFLLENBQUMsMEJBQTBCO1lBQ3ZDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUM7WUFFakMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxJQUFJLEtBQUssSUFBSSwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUM5RCx1REFBdUQ7Z0JBQ3ZELHVDQUF1QztnQkFDdkMsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsNEJBQTRCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM1RixJQUFJLGFBQWEsWUFBWSx1Q0FBbUIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7b0JBQzVFLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO29CQUNwQyxRQUFRLGFBQWEsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO3dCQUMzQzs0QkFDQyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsZ0RBQXlCLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDOzRCQUM3SSxNQUFNO3dCQUNQOzRCQUNDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQ0FBb0IsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7NEJBQ3hJLE1BQU07b0JBQ1IsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7O0lBekNXLGdFQUEwQjt5Q0FBMUIsMEJBQTBCO1FBUXBDLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLG9DQUF3QixDQUFBO09BVmQsMEJBQTBCLENBMEN0QyJ9