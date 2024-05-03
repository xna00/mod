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
define(["require", "exports", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/common/actions", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/base/common/themables", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/browser/viewParts/notebookKernelQuickPickStrategy", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/editor/common/editorService"], function (require, exports, actionViewItems_1, actions_1, nls_1, actions_2, contextkey_1, extensions_1, instantiation_1, themables_1, coreActions_1, notebookBrowser_1, notebookIcons_1, notebookKernelQuickPickStrategy_1, notebookContextKeys_1, notebookKernelService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebooKernelActionViewItem = void 0;
    function getEditorFromContext(editorService, context) {
        let editor;
        if (context !== undefined && 'notebookEditorId' in context) {
            const editorId = context.notebookEditorId;
            const matchingEditor = editorService.visibleEditorPanes.find((editorPane) => {
                const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorPane);
                return notebookEditor?.getId() === editorId;
            });
            editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(matchingEditor);
        }
        else if (context !== undefined && 'notebookEditor' in context) {
            editor = context?.notebookEditor;
        }
        else {
            editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
        }
        return editor;
    }
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: coreActions_1.SELECT_KERNEL_ID,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                title: (0, nls_1.localize2)('notebookActions.selectKernel', 'Select Notebook Kernel'),
                icon: notebookIcons_1.selectKernelIcon,
                f1: true,
                precondition: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
                menu: [{
                        id: actions_2.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true)),
                        group: 'navigation',
                        order: -10
                    }, {
                        id: actions_2.MenuId.NotebookToolbar,
                        when: contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true),
                        group: 'status',
                        order: -10
                    }, {
                        id: actions_2.MenuId.InteractiveToolbar,
                        when: notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.notEqualsTo(0),
                        group: 'status',
                        order: -10
                    }],
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.selectKernel.args', "Notebook Kernel Args"),
                    args: [
                        {
                            name: 'kernelInfo',
                            description: 'The kernel info',
                            schema: {
                                'type': 'object',
                                'required': ['id', 'extension'],
                                'properties': {
                                    'id': {
                                        'type': 'string'
                                    },
                                    'extension': {
                                        'type': 'string'
                                    },
                                    'notebookEditorId': {
                                        'type': 'string'
                                    }
                                }
                            }
                        }
                    ]
                },
            });
        }
        async run(accessor, context) {
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = getEditorFromContext(editorService, context);
            if (!editor || !editor.hasModel()) {
                return false;
            }
            let controllerId = context && 'id' in context ? context.id : undefined;
            let extensionId = context && 'extension' in context ? context.extension : undefined;
            if (controllerId && (typeof controllerId !== 'string' || typeof extensionId !== 'string')) {
                // validate context: id & extension MUST be strings
                controllerId = undefined;
                extensionId = undefined;
            }
            const notebook = editor.textModel;
            const notebookKernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            const matchResult = notebookKernelService.getMatchingKernel(notebook);
            const { selected } = matchResult;
            if (selected && controllerId && selected.id === controllerId && extensions_1.ExtensionIdentifier.equals(selected.extension, extensionId)) {
                // current kernel is wanted kernel -> done
                return true;
            }
            const wantedKernelId = controllerId ? `${extensionId}/${controllerId}` : undefined;
            const strategy = instantiationService.createInstance(notebookKernelQuickPickStrategy_1.KernelPickerMRUStrategy);
            return strategy.showQuickPick(editor, wantedKernelId);
        }
    });
    let NotebooKernelActionViewItem = class NotebooKernelActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(actualAction, _editor, options, _notebookKernelService, _notebookKernelHistoryService) {
            super(undefined, new actions_1.Action('fakeAction', undefined, themables_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon), true, (event) => actualAction.run(event)), { ...options, label: false, icon: true });
            this._editor = _editor;
            this._notebookKernelService = _notebookKernelService;
            this._notebookKernelHistoryService = _notebookKernelHistoryService;
            this._register(_editor.onDidChangeModel(this._update, this));
            this._register(_notebookKernelService.onDidAddKernel(this._update, this));
            this._register(_notebookKernelService.onDidRemoveKernel(this._update, this));
            this._register(_notebookKernelService.onDidChangeNotebookAffinity(this._update, this));
            this._register(_notebookKernelService.onDidChangeSelectedNotebooks(this._update, this));
            this._register(_notebookKernelService.onDidChangeSourceActions(this._update, this));
            this._register(_notebookKernelService.onDidChangeKernelDetectionTasks(this._update, this));
        }
        render(container) {
            this._update();
            super.render(container);
            container.classList.add('kernel-action-view-item');
            this._kernelLabel = document.createElement('a');
            container.appendChild(this._kernelLabel);
            this.updateLabel();
        }
        updateLabel() {
            if (this._kernelLabel) {
                this._kernelLabel.classList.add('kernel-label');
                this._kernelLabel.innerText = this._action.label;
            }
        }
        _update() {
            const notebook = this._editor.textModel;
            if (!notebook) {
                this._resetAction();
                return;
            }
            notebookKernelQuickPickStrategy_1.KernelPickerMRUStrategy.updateKernelStatusAction(notebook, this._action, this._notebookKernelService, this._notebookKernelHistoryService);
            this.updateClass();
        }
        _resetAction() {
            this._action.enabled = false;
            this._action.label = '';
            this._action.class = '';
        }
    };
    exports.NotebooKernelActionViewItem = NotebooKernelActionViewItem;
    exports.NotebooKernelActionViewItem = NotebooKernelActionViewItem = __decorate([
        __param(3, notebookKernelService_1.INotebookKernelService),
        __param(4, notebookKernelService_1.INotebookKernelHistoryService)
    ], NotebooKernelActionViewItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXJuZWxWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXdQYXJ0cy9ub3RlYm9va0tlcm5lbFZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxTQUFTLG9CQUFvQixDQUFDLGFBQTZCLEVBQUUsT0FBZ0M7UUFDNUYsSUFBSSxNQUFtQyxDQUFDO1FBQ3hDLElBQUksT0FBTyxLQUFLLFNBQVMsSUFBSSxrQkFBa0IsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUM1RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7WUFDMUMsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO2dCQUMzRSxNQUFNLGNBQWMsR0FBRyxJQUFBLGlEQUErQixFQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNuRSxPQUFPLGNBQWMsRUFBRSxLQUFLLEVBQUUsS0FBSyxRQUFRLENBQUM7WUFDN0MsQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLEdBQUcsSUFBQSxpREFBK0IsRUFBQyxjQUFjLENBQUMsQ0FBQztRQUMxRCxDQUFDO2FBQU0sSUFBSSxPQUFPLEtBQUssU0FBUyxJQUFJLGdCQUFnQixJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2pFLE1BQU0sR0FBRyxPQUFPLEVBQUUsY0FBYyxDQUFDO1FBQ2xDLENBQUM7YUFBTSxDQUFDO1lBQ1AsTUFBTSxHQUFHLElBQUEsaURBQStCLEVBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVELElBQUEseUJBQWUsRUFB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