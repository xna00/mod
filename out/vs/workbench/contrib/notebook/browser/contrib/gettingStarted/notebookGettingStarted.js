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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/workbench/common/contributions", "vs/workbench/common/memento", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, lifecycle_1, nls_1, actionCommonCategories_1, actions_1, commands_1, configuration_1, contextkey_1, platform_1, storage_1, contributions_1, memento_1, notebookCommon_1, notebookContextKeys_1, notebookEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookGettingStarted = void 0;
    const hasOpenedNotebookKey = 'hasOpenedNotebook';
    const hasShownGettingStartedKey = 'hasShownNotebookGettingStarted';
    /**
     * Sets a context key when a notebook has ever been opened by the user
     */
    let NotebookGettingStarted = class NotebookGettingStarted extends lifecycle_1.Disposable {
        constructor(_editorService, _storageService, _contextKeyService, _commandService, _configurationService) {
            super();
            const hasOpenedNotebook = notebookContextKeys_1.HAS_OPENED_NOTEBOOK.bindTo(_contextKeyService);
            const memento = new memento_1.Memento('notebookGettingStarted2', _storageService);
            const storedValue = memento.getMemento(0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            if (storedValue[hasOpenedNotebookKey]) {
                hasOpenedNotebook.set(true);
            }
            const needToShowGettingStarted = _configurationService.getValue(notebookCommon_1.NotebookSetting.openGettingStarted) && !storedValue[hasShownGettingStartedKey];
            if (!storedValue[hasOpenedNotebookKey] || needToShowGettingStarted) {
                const onDidOpenNotebook = () => {
                    hasOpenedNotebook.set(true);
                    storedValue[hasOpenedNotebookKey] = true;
                    if (needToShowGettingStarted) {
                        _commandService.executeCommand('workbench.action.openWalkthrough', { category: 'notebooks', step: 'notebookProfile' }, true);
                        storedValue[hasShownGettingStartedKey] = true;
                    }
                    memento.saveMemento();
                };
                if (_editorService.activeEditor?.typeId === notebookEditorInput_1.NotebookEditorInput.ID) {
                    // active editor is notebook
                    onDidOpenNotebook();
                    return;
                }
                const listener = this._register(_editorService.onDidActiveEditorChange(() => {
                    if (_editorService.activeEditor?.typeId === notebookEditorInput_1.NotebookEditorInput.ID) {
                        listener.dispose();
                        onDidOpenNotebook();
                    }
                }));
            }
        }
    };
    exports.NotebookGettingStarted = NotebookGettingStarted;
    exports.NotebookGettingStarted = NotebookGettingStarted = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, storage_1.IStorageService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, commands_1.ICommandService),
        __param(4, configuration_1.IConfigurationService)
    ], NotebookGettingStarted);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NotebookGettingStarted, 3 /* LifecyclePhase.Restored */);
    (0, actions_1.registerAction2)(class NotebookClearNotebookLayoutAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.gettingStarted',
                title: (0, nls_1.localize2)('workbench.notebook.layout.gettingStarted.label', "Reset notebook getting started"),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.openGettingStarted}`, true),
                category: actionCommonCategories_1.Categories.Developer,
            });
        }
        run(accessor) {
            const storageService = accessor.get(storage_1.IStorageService);
            const memento = new memento_1.Memento('notebookGettingStarted', storageService);
            const storedValue = memento.getMemento(0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            storedValue[hasOpenedNotebookKey] = undefined;
            memento.saveMemento();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tHZXR0aW5nU3RhcnRlZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2dldHRpbmdTdGFydGVkL25vdGVib29rR2V0dGluZ1N0YXJ0ZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxNQUFNLG9CQUFvQixHQUFHLG1CQUFtQixDQUFDO0lBQ2pELE1BQU0seUJBQXlCLEdBQUcsZ0NBQWdDLENBQUM7SUFFbkU7O09BRUc7SUFDSSxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLHNCQUFVO1FBRXJELFlBQ2lCLGNBQThCLEVBQzdCLGVBQWdDLEVBQzdCLGtCQUFzQyxFQUN6QyxlQUFnQyxFQUMxQixxQkFBNEM7WUFFbkUsS0FBSyxFQUFFLENBQUM7WUFFUixNQUFNLGlCQUFpQixHQUFHLHlDQUFtQixDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sT0FBTyxHQUFHLElBQUksaUJBQU8sQ0FBQyx5QkFBeUIsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUN4RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsVUFBVSwwREFBMEMsQ0FBQztZQUNqRixJQUFJLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QixDQUFDO1lBRUQsTUFBTSx3QkFBd0IsR0FBRyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsZ0NBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDL0ksSUFBSSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FB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