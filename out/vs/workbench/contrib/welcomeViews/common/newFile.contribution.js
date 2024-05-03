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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/workbench/common/contributions"], function (require, exports, async_1, lifecycle_1, types_1, nls_1, actions_1, commands_1, contextkey_1, keybinding_1, quickInput_1, platform_1, contributions_1) {
    "use strict";
    var NewFileTemplatesManager_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const builtInSource = (0, nls_1.localize)('Built-In', "Built-In");
    const category = (0, nls_1.localize2)('Create', 'Create');
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.showNewFileEntries',
                title: (0, nls_1.localize2)('welcome.newFile', 'New File...'),
                category,
                f1: true,
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ + 2048 /* KeyMod.CtrlCmd */ + 256 /* KeyMod.WinCtrl */ + 44 /* KeyCode.KeyN */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                },
                menu: {
                    id: actions_1.MenuId.MenubarFileMenu,
                    group: '1_new',
                    order: 2
                }
            });
        }
        async run(accessor) {
            return (0, types_1.assertIsDefined)(NewFileTemplatesManager.Instance).run();
        }
    });
    let NewFileTemplatesManager = class NewFileTemplatesManager extends lifecycle_1.Disposable {
        static { NewFileTemplatesManager_1 = this; }
        constructor(quickInputService, contextKeyService, commandService, keybindingService, menuService) {
            super();
            this.quickInputService = quickInputService;
            this.contextKeyService = contextKeyService;
            this.commandService = commandService;
            this.keybindingService = keybindingService;
            NewFileTemplatesManager_1.Instance = this;
            this._register({ dispose() { if (NewFileTemplatesManager_1.Instance === this) {
                    NewFileTemplatesManager_1.Instance = undefined;
                } } });
            this.menu = menuService.createMenu(actions_1.MenuId.NewFile, contextKeyService);
        }
        allEntries() {
            const items = [];
            for (const [groupName, group] of this.menu.getActions({ renderShortTitle: true })) {
                for (const action of group) {
                    if (action instanceof actions_1.MenuItemAction) {
                        items.push({ commandID: action.item.id, from: action.item.source?.title ?? builtInSource, title: action.label, group: groupName });
                    }
                }
            }
            return items;
        }
        async run() {
            const entries = this.allEntries();
            if (entries.length === 0) {
                throw Error('Unexpected empty new items list');
            }
            else if (entries.length === 1) {
                this.commandService.executeCommand(entries[0].commandID);
                return true;
            }
            else {
                return this.selectNewEntry(entries);
            }
        }
        async selectNewEntry(entries) {
            const { promise: resultPromise, resolve: resolveResult } = (0, async_1.promiseWithResolvers)();
            const disposables = new lifecycle_1.DisposableStore();
            const qp = this.quickInputService.createQuickPick();
            qp.title = (0, nls_1.localize)('newFileTitle', "New File...");
            qp.placeholder = (0, nls_1.localize)('newFilePlaceholder', "Select File Type or Enter File Name...");
            qp.sortByLabel = false;
            qp.matchOnDetail = true;
            qp.matchOnDescription = true;
            const sortCategories = (a, b) => {
                const categoryPriority = { 'file': 1, 'notebook': 2 };
                if (categoryPriority[a.group] && categoryPriority[b.group]) {
                    if (categoryPriority[a.group] !== categoryPriority[b.group]) {
                        return categoryPriority[b.group] - categoryPriority[a.group];
                    }
                }
                else if (categoryPriority[a.group]) {
                    return 1;
                }
                else if (categoryPriority[b.group]) {
                    return -1;
                }
                if (a.from === builtInSource) {
                    return 1;
                }
                if (b.from === builtInSource) {
                    return -1;
                }
                return a.from.localeCompare(b.from);
            };
            const displayCategory = {
                'file': (0, nls_1.localize)('file', "File"),
                'notebook': (0, nls_1.localize)('notebook', "Notebook"),
            };
            const refreshQp = (entries) => {
                const items = [];
                let lastSeparator;
                entries
                    .sort((a, b) => -sortCategories(a, b))
                    .forEach((entry) => {
                    const command = entry.commandID;
                    const keybinding = this.keybindingService.lookupKeybinding(command || '', this.contextKeyService);
                    if (lastSeparator !== entry.group) {
                        items.push({
                            type: 'separator',
                            label: displayCategory[entry.group] ?? entry.group
                        });
                        lastSeparator = entry.group;
                    }
                    items.push({
                        ...entry,
                        label: entry.title,
                        type: 'item',
                        keybinding,
                        buttons: command ? [
                            {
                                iconClass: 'codicon codicon-gear',
                                tooltip: (0, nls_1.localize)('change keybinding', "Configure Keybinding")
                            }
                        ] : [],
                        detail: '',
                        description: entry.from,
                    });
                });
                qp.items = items;
            };
            refreshQp(entries);
            disposables.add(this.menu.onDidChange(() => refreshQp(this.allEntries())));
            disposables.add(qp.onDidChangeValue((val) => {
                if (val === '') {
                    refreshQp(entries);
                    return;
                }
                const currentTextEntry = {
                    commandID: 'workbench.action.files.newFile',
                    commandArgs: { languageId: undefined, viewType: undefined, fileName: val },
                    title: (0, nls_1.localize)('miNewFileWithName', "Create New File ({0})", val),
                    group: 'file',
                    from: builtInSource,
                };
                refreshQp([currentTextEntry, ...entries]);
            }));
            disposables.add(qp.onDidAccept(async (e) => {
                const selected = qp.selectedItems[0];
                resolveResult(!!selected);
                qp.hide();
                if (selected) {
                    await this.commandService.executeCommand(selected.commandID, selected.commandArgs);
                }
            }));
            disposables.add(qp.onDidHide(() => {
                qp.dispose();
                disposables.dispose();
                resolveResult(false);
            }));
            disposables.add(qp.onDidTriggerItemButton(e => {
                qp.hide();
                this.commandService.executeCommand('workbench.action.openGlobalKeybindings', e.item.commandID);
                resolveResult(false);
            }));
            qp.show();
            return resultPromise;
        }
    };
    NewFileTemplatesManager = NewFileTemplatesManager_1 = __decorate([
        __param(0, quickInput_1.IQuickInputService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, commands_1.ICommandService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, actions_1.IMenuService)
    ], NewFileTemplatesManager);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(NewFileTemplatesManager, 3 /* LifecyclePhase.Restored */);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NewFile, {
        group: 'file',
        command: {
            id: 'workbench.action.files.newUntitledFile',
            title: (0, nls_1.localize)('miNewFile2', "Text File")
        },
        order: 1
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV3RmlsZS5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlbGNvbWVWaWV3cy9jb21tb24vbmV3RmlsZS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJoRyxNQUFNLGFBQWEsR0FBRyxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkQsTUFBTSxRQUFRLEdBQXFCLElBQUEsZUFBUyxFQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUVqRSxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw0QkFBNEI7Z0JBQ2hDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxpQkFBaUIsRUFBRSxhQUFhLENBQUM7Z0JBQ2xELFFBQVE7Z0JBQ1IsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsVUFBVSxFQUFFO29CQUNYLE9BQU8sRUFBRSxnREFBMkIsMkJBQWlCLHdCQUFlO29CQUNwRSxNQUFNLDZDQUFtQztpQkFDekM7Z0JBQ0QsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGVBQWU7b0JBQzFCLEtBQUssRUFBRSxPQUFPO29CQUNkLEtBQUssRUFBRSxDQUFDO2lCQUNSO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsT0FBTyxJQUFBLHVCQUFlLEVBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDaEUsQ0FBQztLQUNELENBQUMsQ0FBQztJQUdILElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdC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