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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/notebook/browser/contrib/notebookVariables/notebookVariableContextKeys", "vs/workbench/contrib/notebook/browser/contrib/notebookVariables/notebookVariablesView", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorService"], function (require, exports, lifecycle_1, nls, configuration_1, contextkey_1, descriptors_1, platform_1, views_1, debug_1, notebookVariableContextKeys_1, notebookVariablesView_1, notebookBrowser_1, notebookIcons_1, notebookCommon_1, notebookExecutionStateService_1, notebookKernelService_1, notebookService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookVariables = void 0;
    let NotebookVariables = class NotebookVariables extends lifecycle_1.Disposable {
        constructor(contextKeyService, configurationService, editorService, notebookExecutionStateService, notebookKernelService, notebookDocumentService) {
            super();
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.notebookKernelService = notebookKernelService;
            this.notebookDocumentService = notebookDocumentService;
            this.listeners = [];
            this.initialized = false;
            this.viewEnabled = notebookVariableContextKeys_1.NOTEBOOK_VARIABLE_VIEW_ENABLED.bindTo(contextKeyService);
            this.listeners.push(this.editorService.onDidActiveEditorChange(() => this.handleInitEvent()));
            this.listeners.push(this.notebookExecutionStateService.onDidChangeExecution((e) => this.handleInitEvent(e.notebook)));
            this.configListener = configurationService.onDidChangeConfiguration((e) => this.handleConfigChange(e));
        }
        handleConfigChange(e) {
            if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.notebookVariablesView)) {
                if (!this.configurationService.getValue(notebookCommon_1.NotebookSetting.notebookVariablesView)) {
                    this.viewEnabled.set(false);
                }
                else if (this.initialized) {
                    this.viewEnabled.set(true);
                }
                else {
                    this.handleInitEvent();
                }
            }
        }
        handleInitEvent(notebook) {
            if (this.configurationService.getValue(notebookCommon_1.NotebookSetting.notebookVariablesView)
                && (!!notebook || this.editorService.activeEditorPane?.getId() === 'workbench.editor.notebook')) {
                if (this.hasVariableProvider(notebook) && !this.initialized && this.initializeView()) {
                    this.viewEnabled.set(true);
                    this.initialized = true;
                    this.listeners.forEach(listener => listener.dispose());
                }
            }
        }
        hasVariableProvider(notebookUri) {
            const notebook = notebookUri ?
                this.notebookDocumentService.getNotebookTextModel(notebookUri) :
                (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this.editorService.activeEditorPane)?.getViewModel()?.notebookDocument;
            return notebook && this.notebookKernelService.getMatchingKernel(notebook).selected?.hasVariableProvider;
        }
        initializeView() {
            const debugViewContainer = platform_1.Registry.as('workbench.registry.view.containers').get(debug_1.VIEWLET_ID);
            if (debugViewContainer) {
                const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
                const viewDescriptor = {
                    id: 'NOTEBOOK_VARIABLES', name: nls.localize2('notebookVariables', "Notebook Variables"),
                    containerIcon: notebookIcons_1.variablesViewIcon, ctorDescriptor: new descriptors_1.SyncDescriptor(notebookVariablesView_1.NotebookVariablesView),
                    order: 50, weight: 5, canToggleVisibility: true, canMoveView: true, collapsed: true, when: notebookVariableContextKeys_1.NOTEBOOK_VARIABLE_VIEW_ENABLED,
                };
                viewsRegistry.registerViews([viewDescriptor], debugViewContainer);
                return true;
            }
            return false;
        }
        dispose() {
            super.dispose();
            this.listeners.forEach(listener => listener.dispose());
            this.configListener.dispose();
        }
    };
    exports.NotebookVariables = NotebookVariables;
    exports.NotebookVariables = NotebookVariables = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, editorService_1.IEditorService),
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(4, notebookKernelService_1.INotebookKernelService),
        __param(5, notebookService_1.INotebookService)
    ], NotebookVariables);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWYXJpYWJsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9ub3RlYm9va1ZhcmlhYmxlcy9ub3RlYm9va1ZhcmlhYmxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQnpGLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsc0JBQVU7UUFPaEQsWUFDcUIsaUJBQXFDLEVBQ2xDLG9CQUE0RCxFQUNuRSxhQUE4QyxFQUM5Qiw2QkFBOEUsRUFDdEYscUJBQThELEVBQ3BFLHVCQUEwRDtZQUU1RSxLQUFLLEVBQUUsQ0FBQztZQU5nQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2xELGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUNiLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFDckUsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUNuRCw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQWtCO1lBWnJFLGNBQVMsR0FBa0IsRUFBRSxDQUFDO1lBRTlCLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1lBYzNCLElBQUksQ0FBQyxXQUFXLEdBQUcsNERBQThCLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFNUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENB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