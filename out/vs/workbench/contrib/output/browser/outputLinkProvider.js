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
define(["require", "exports", "vs/base/common/async", "vs/editor/common/services/model", "vs/platform/workspace/common/workspace", "vs/workbench/services/output/common/output", "vs/editor/browser/services/webWorker", "vs/base/common/lifecycle", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures"], function (require, exports, async_1, model_1, workspace_1, output_1, webWorker_1, lifecycle_1, languageConfigurationRegistry_1, languageFeatures_1) {
    "use strict";
    var OutputLinkProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputLinkProvider = void 0;
    let OutputLinkProvider = class OutputLinkProvider {
        static { OutputLinkProvider_1 = this; }
        static { this.DISPOSE_WORKER_TIME = 3 * 60 * 1000; } // dispose worker after 3 minutes of inactivity
        constructor(contextService, modelService, languageConfigurationService, languageFeaturesService) {
            this.contextService = contextService;
            this.modelService = modelService;
            this.languageConfigurationService = languageConfigurationService;
            this.languageFeaturesService = languageFeaturesService;
            this.disposeWorkerScheduler = new async_1.RunOnceScheduler(() => this.disposeWorker(), OutputLinkProvider_1.DISPOSE_WORKER_TIME);
            this.registerListeners();
            this.updateLinkProviderWorker();
        }
        registerListeners() {
            this.contextService.onDidChangeWorkspaceFolders(() => this.updateLinkProviderWorker());
        }
        updateLinkProviderWorker() {
            // Setup link provider depending on folders being opened or not
            const folders = this.contextService.getWorkspace().folders;
            if (folders.length > 0) {
                if (!this.linkProviderRegistration) {
                    this.linkProviderRegistration = this.languageFeaturesService.linkProvider.register([{ language: output_1.OUTPUT_MODE_ID, scheme: '*' }, { language: output_1.LOG_MODE_ID, scheme: '*' }], {
                        provideLinks: async (model) => {
                            const links = await this.provideLinks(model.uri);
                            return links && { links };
                        }
                    });
                }
            }
            else {
                (0, lifecycle_1.dispose)(this.linkProviderRegistration);
                this.linkProviderRegistration = undefined;
            }
            // Dispose worker to recreate with folders on next provideLinks request
            this.disposeWorker();
            this.disposeWorkerScheduler.cancel();
        }
        getOrCreateWorker() {
            this.disposeWorkerScheduler.schedule();
            if (!this.worker) {
                const createData = {
                    workspaceFolders: this.contextService.getWorkspace().folders.map(folder => folder.uri.toString())
                };
                this.worker = (0, webWorker_1.createWebWorker)(this.modelService, this.languageConfigurationService, {
                    moduleId: 'vs/workbench/contrib/output/common/outputLinkComputer',
                    createData,
                    label: 'outputLinkComputer'
                });
            }
            return this.worker;
        }
        async provideLinks(modelUri) {
            const linkComputer = await this.getOrCreateWorker().withSyncedResources([modelUri]);
            return linkComputer.computeLinks(modelUri.toString());
        }
        disposeWorker() {
            if (this.worker) {
                this.worker.dispose();
                this.worker = undefined;
            }
        }
    };
    exports.OutputLinkProvider = OutputLinkProvider;
    exports.OutputLinkProvider = OutputLinkProvider = OutputLinkProvider_1 = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, model_1.IModelService),
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(3, languageFeatures_1.ILanguageFeaturesService)
    ], OutputLinkProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0TGlua1Byb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9vdXRwdXQvYnJvd3Nlci9vdXRwdXRMaW5rUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjs7aUJBRU4sd0JBQW1CLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLEFBQWhCLENBQWlCLEdBQUMsK0NBQStDO1FBTTVHLFlBQzRDLGNBQXdDLEVBQ25ELFlBQTJCLEVBQ1gsNEJBQTJELEVBQ2hFLHVCQUFpRDtZQUhqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDbkQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDWCxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBQ2hFLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFFNUYsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLG9CQUFrQixDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFFdkgsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFDakMsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUM7UUFDeEYsQ0FBQztRQUVPLHdCQUF3QjtZQUUvQiwrREFBK0Q7WUFDL0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFP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