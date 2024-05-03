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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/workbench/contrib/scm/common/scm", "vs/base/browser/ui/countBadge/countBadge", "vs/platform/contextview/browser/contextView", "vs/platform/commands/common/commands", "vs/base/common/actions", "./util", "vs/platform/theme/browser/defaultStyles", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/telemetry/common/telemetry", "vs/css!./media/scm"], function (require, exports, lifecycle_1, dom_1, scm_1, countBadge_1, contextView_1, commands_1, actions_1, util_1, defaultStyles_1, toolbar_1, actions_2, contextkey_1, keybinding_1, telemetry_1) {
    "use strict";
    var RepositoryRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RepositoryRenderer = exports.RepositoryActionRunner = void 0;
    class RepositoryActionRunner extends actions_1.ActionRunner {
        constructor(getSelectedRepositories) {
            super();
            this.getSelectedRepositories = getSelectedRepositories;
        }
        async runAction(action, context) {
            if (!(action instanceof actions_2.MenuItemAction)) {
                return super.runAction(action, context);
            }
            const selection = this.getSelectedRepositories().map(r => r.provider);
            const actionContext = selection.some(s => s === context) ? selection : [context];
            await action.run(...actionContext);
        }
    }
    exports.RepositoryActionRunner = RepositoryActionRunner;
    let RepositoryRenderer = class RepositoryRenderer {
        static { RepositoryRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'repository'; }
        get templateId() { return RepositoryRenderer_1.TEMPLATE_ID; }
        constructor(toolbarMenuId, actionViewItemProvider, scmViewService, commandService, contextKeyService, contextMenuService, keybindingService, menuService, telemetryService) {
            this.toolbarMenuId = toolbarMenuId;
            this.actionViewItemProvider = actionViewItemProvider;
            this.scmViewService = scmViewService;
            this.commandService = commandService;
            this.contextKeyService = contextKeyService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.telemetryService = telemetryService;
        }
        renderTemplate(container) {
            // hack
            if (container.classList.contains('monaco-tl-contents')) {
                container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-twistie');
            }
            const provider = (0, dom_1.append)(container, (0, dom_1.$)('.scm-provider'));
            const label = (0, dom_1.append)(provider, (0, dom_1.$)('.label'));
            const name = (0, dom_1.append)(label, (0, dom_1.$)('span.name'));
            const description = (0, dom_1.append)(label, (0, dom_1.$)('span.description'));
            const actions = (0, dom_1.append)(provider, (0, dom_1.$)('.actions'));
            const toolBar = new toolbar_1.WorkbenchToolBar(actions, { actionViewItemProvider: this.actionViewItemProvider, resetMenu: this.toolbarMenuId }, this.menuService, this.contextKeyService, this.contextMenuService, this.keybindingService, this.telemetryService);
            const countContainer = (0, dom_1.append)(provider, (0, dom_1.$)('.count'));
            const count = new countBadge_1.CountBadge(countContainer, {}, defaultStyles_1.defaultCountBadgeStyles);
            const visibilityDisposable = toolBar.onDidChangeDropdownVisibility(e => provider.classList.toggle('active', e));
            const templateDisposable = (0, lifecycle_1.combinedDisposable)(visibilityDisposable, toolBar);
            return { label, name, description, countContainer, count, toolBar, elementDisposables: new lifecycle_1.DisposableStore(), templateDisposable };
        }
        renderElement(arg, index, templateData, height) {
            const repository = (0, util_1.isSCMRepository)(arg) ? arg : arg.element;
            templateData.name.textContent = repository.provider.name;
            if (repository.provider.rootUri) {
                templateData.label.title = `${repository.provider.label}: ${repository.provider.rootUri.fsPath}`;
                templateData.description.textContent = repository.provider.label;
            }
            else {
                templateData.label.title = repository.provider.label;
                templateData.description.textContent = '';
            }
            let statusPrimaryActions = [];
            let menuPrimaryActions = [];
            let menuSecondaryActions = [];
            const updateToolbar = () => {
                templateData.toolBar.setActions([...statusPrimaryActions, ...menuPrimaryActions], menuSecondaryActions);
            };
            const onDidChangeProvider = () => {
                const commands = repository.provider.statusBarCommands || [];
                statusPrimaryActions = commands.map(c => new util_1.StatusBarAction(c, this.commandService));
                updateToolbar();
                const count = repository.provider.count || 0;
                templateData.countContainer.setAttribute('data-count', String(count));
                templateData.count.setCount(count);
            };
            // TODO@joao TODO@lszomoru
            let disposed = false;
            templateData.elementDisposables.add((0, lifecycle_1.toDisposable)(() => disposed = true));
            templateData.elementDisposables.add(repository.provider.onDidChange(() => {
                if (disposed) {
                    return;
                }
                onDidChangeProvider();
            }));
            onDidChangeProvider();
            const repositoryMenus = this.scmViewService.menus.getRepositoryMenus(repository.provider);
            const menu = this.toolbarMenuId === actions_2.MenuId.SCMTitle ? repositoryMenus.titleMenu.menu : repositoryMenus.repositoryMenu;
            templateData.elementDisposables.add((0, util_1.connectPrimaryMenu)(menu, (primary, secondary) => {
                menuPrimaryActions = primary;
                menuSecondaryActions = secondary;
                updateToolbar();
            }));
            templateData.toolBar.context = repository.provider;
        }
        renderCompressedElements() {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeElement(group, index, template) {
            template.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.elementDisposables.dispose();
            templateData.templateDisposable.dispose();
        }
    };
    exports.RepositoryRenderer = RepositoryRenderer;
    exports.RepositoryRenderer = RepositoryRenderer = RepositoryRenderer_1 = __decorate([
        __param(2, scm_1.ISCMViewService),
        __param(3, commands_1.ICommandService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, actions_2.IMenuService),
        __param(8, telemetry_1.ITelemetryService)
    ], RepositoryRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtUmVwb3NpdG9yeVJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zY20vYnJvd3Nlci9zY21SZXBvc2l0b3J5UmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXVCaEcsTUFBYSxzQkFBdUIsU0FBUSxzQkFBWTtRQUN2RCxZQUE2Qix1QkFBK0M7WUFDM0UsS0FBSyxFQUFFLENBQUM7WUFEb0IsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF3QjtRQUU1RSxDQUFDO1FBRWtCLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBZSxFQUFFLE9BQXFCO1lBQ3hFLElBQUksQ0FBQyxDQUFDLE1BQU0sWUFBWSx3QkFBYyxDQUFDLEVBQUUsQ0FBQztnQkFDekMsT0FBTyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN6QyxDQUFDO1lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVqRixNQUFNLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQztRQUNwQyxDQUFDO0tBQ0Q7SUFmRCx3REFlQztJQWFNLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQWtCOztpQkFFZCxnQkFBVyxHQUFHLFlBQVksQUFBZixDQUFn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