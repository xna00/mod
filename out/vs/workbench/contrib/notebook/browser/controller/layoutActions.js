/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/uri", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/common/preferences"], function (require, exports, codicons_1, uri_1, nls_1, actionCommonCategories_1, actions_1, commands_1, configuration_1, contextkey_1, quickInput_1, coreActions_1, notebookBrowser_1, notebookEditorService_1, notebookCommon_1, notebookContextKeys_1, notebookService_1, editorService_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(class NotebookConfigureLayoutAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.select',
                title: (0, nls_1.localize2)('workbench.notebook.layout.select.label', "Select between Notebook Layouts"),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.openGettingStarted}`, true),
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        group: 'notebookLayout',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true), contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.openGettingStarted}`, true)),
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        group: 'notebookLayout',
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true), contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.openGettingStarted}`, true)),
                        order: 0
                    }
                ]
            });
        }
        run(accessor) {
            accessor.get(commands_1.ICommandService).executeCommand('workbench.action.openWalkthrough', { category: 'notebooks', step: 'notebookProfile' }, true);
        }
    });
    (0, actions_1.registerAction2)(class NotebookConfigureLayoutAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.configure',
                title: (0, nls_1.localize2)('workbench.notebook.layout.configure.label', "Customize Notebook Layout"),
                f1: true,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        group: 'notebookLayout',
                        when: contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true),
                        order: 1
                    }
                ]
            });
        }
        run(accessor) {
            accessor.get(preferences_1.IPreferencesService).openSettings({ jsonEditor: false, query: '@tag:notebookLayout' });
        }
    });
    (0, actions_1.registerAction2)(class NotebookConfigureLayoutFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.configure.editorTitle',
                title: (0, nls_1.localize2)('workbench.notebook.layout.configure.label', "Customize Notebook Layout"),
                f1: false,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayout',
                        when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
                        order: 1
                    }
                ]
            });
        }
        run(accessor) {
            accessor.get(preferences_1.IPreferencesService).openSettings({ jsonEditor: false, query: '@tag:notebookLayout' });
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        submenu: actions_1.MenuId.NotebookEditorLayoutConfigure,
        rememberDefaultAction: false,
        title: (0, nls_1.localize2)('customizeNotebook', "Customize Notebook..."),
        icon: codicons_1.Codicon.gear,
        group: 'navigation',
        order: -1,
        when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR
    });
    (0, actions_1.registerAction2)(class ToggleLineNumberFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.toggleLineNumbersFromEditorTitle',
                title: (0, nls_1.localize2)('notebook.toggleLineNumbers', 'Toggle Notebook Line Numbers'),
                precondition: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayoutDetails',
                        order: 1,
                        when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR
                    }
                ],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.notEquals('config.notebook.lineNumbers', 'off'),
                    title: (0, nls_1.localize)('notebook.showLineNumbers', "Notebook Line Numbers"),
                }
            });
        }
        async run(accessor) {
            return accessor.get(commands_1.ICommandService).executeCommand('notebook.toggleLineNumbers');
        }
    });
    (0, actions_1.registerAction2)(class ToggleCellToolbarPositionFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.toggleCellToolbarPositionFromEditorTitle',
                title: (0, nls_1.localize2)('notebook.toggleCellToolbarPosition', 'Toggle Cell Toolbar Position'),
                menu: [{
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayoutDetails',
                        order: 3
                    }],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: false
            });
        }
        async run(accessor, ...args) {
            return accessor.get(commands_1.ICommandService).executeCommand('notebook.toggleCellToolbarPosition', ...args);
        }
    });
    (0, actions_1.registerAction2)(class ToggleBreadcrumbFromEditorTitle extends actions_1.Action2 {
        constructor() {
            super({
                id: 'breadcrumbs.toggleFromEditorTitle',
                title: (0, nls_1.localize2)('notebook.toggleBreadcrumb', 'Toggle Breadcrumbs'),
                menu: [{
                        id: actions_1.MenuId.NotebookEditorLayoutConfigure,
                        group: 'notebookLayoutDetails',
                        order: 2
                    }],
                f1: false
            });
        }
        async run(accessor) {
            return accessor.get(commands_1.ICommandService).executeCommand('breadcrumbs.toggle');
        }
    });
    (0, actions_1.registerAction2)(class SaveMimeTypeDisplayOrder extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.saveMimeTypeOrder',
                title: (0, nls_1.localize2)('notebook.saveMimeTypeOrder', "Save Mimetype Display Order"),
                f1: true,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                precondition: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
            });
        }
        run(accessor) {
            const service = accessor.get(notebookService_1.INotebookService);
            const qp = accessor.get(quickInput_1.IQuickInputService).createQuickPick();
            qp.placeholder = (0, nls_1.localize)('notebook.placeholder', 'Settings file to save in');
            qp.items = [
                { target: 2 /* ConfigurationTarget.USER */, label: (0, nls_1.localize)('saveTarget.machine', 'User Settings') },
                { target: 5 /* ConfigurationTarget.WORKSPACE */, label: (0, nls_1.localize)('saveTarget.workspace', 'Workspace Settings') },
            ];
            qp.onDidAccept(() => {
                const target = qp.selectedItems[0]?.target;
                if (target !== undefined) {
                    service.saveMimeDisplayOrder(target);
                }
                qp.dispose();
            });
            qp.onDidHide(() => qp.dispose());
            qp.show();
        }
    });
    (0, actions_1.registerAction2)(class NotebookWebviewResetAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.notebook.layout.webview.reset',
                title: (0, nls_1.localize2)('workbench.notebook.layout.webview.reset.label', "Reset Notebook Webview"),
                f1: false,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY
            });
        }
        run(accessor, args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            if (args) {
                const uri = uri_1.URI.revive(args);
                const notebookEditorService = accessor.get(notebookEditorService_1.INotebookEditorService);
                const widgets = notebookEditorService.listNotebookEditors().filter(widget => widget.hasModel() && widget.textModel.uri.toString() === uri.toString());
                for (const widget of widgets) {
                    if (widget.hasModel()) {
                        widget.getInnerWebview()?.reload();
                    }
                }
            }
            else {
                const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
                if (!editor) {
                    return;
                }
                editor.getInnerWebview()?.reload();
            }
        }
    });
    (0, actions_1.registerAction2)(class ToggleNotebookStickyScroll extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.action.toggleNotebookStickyScroll',
                title: {
                    ...(0, nls_1.localize2)('toggleStickyScroll', "Toggle Notebook Sticky Scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mitoggleNotebookStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Toggle Notebook Sticky Scroll"),
                },
                category: actionCommonCategories_1.Categories.View,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.equals('config.notebook.stickyScroll.enabled', true),
                    title: (0, nls_1.localize)('notebookStickyScroll', "Toggle Notebook Sticky Scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mitoggleNotebookStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Toggle Notebook Sticky Scroll"),
                },
                menu: [
                    { id: actions_1.MenuId.CommandPalette },
                    {
                        id: actions_1.MenuId.NotebookStickyScrollContext,
                        group: 'notebookView',
                        order: 2
                    }
                ]
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('notebook.stickyScroll.enabled');
            return configurationService.updateValue('notebook.stickyScroll.enabled', newValue);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cm9sbGVyL2xheW91dEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFxQmhHLElBQUEseUJBQWUsRUFBQyxNQUFNLDZCQUE4QixTQUFRLGlCQUFPO1FBQ2xFO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxrQ0FBa0M7Z0JBQ3RDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyx3Q0FBd0MsRUFBRSxpQ0FBaUMsQ0FBQztnQkFDN0YsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsWUFBWSxFQUFFLDJCQUFjLENBQUMsTUFBTSxDQUFDLFVBQVUsZ0NBQWUsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLElBQUksQ0FBQztnQkFDekYsUUFBUSxFQUFFLHVDQUF5QjtnQkFDbkMsSUFBSSxFQUFFO29CQUNMO3dCQUNDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFdBQVc7d0JBQ3RCLEtBQUssRUFBRSxnQkFBZ0I7d0JBQ3ZCLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FDdkIsK0NBQXlCLEVBQ3pCLDJCQUFjLENBQUMsU0FBUyxDQUFDLCtCQUErQixFQUFFLElBQUksQ0FBQyxFQUMvRCwyQkFBYyxDQUFDLE1BQU0sQ0FBQyxVQUFVLGdDQUFlLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FDM0U7d0JBQ0QsS0FBSyxFQUFFLENBQUM7cUJBQ1I7b0JBQ0Q7d0JBQ0MsRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTt3QkFDMUIsS0FBSyxFQUFFLGdCQUFnQjt3QkFDdkIsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUN2QiwyQkFBYyxDQUFDLE1BQU0sQ0FB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