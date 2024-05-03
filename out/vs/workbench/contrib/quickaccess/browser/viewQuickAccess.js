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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/services/output/common/output", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/contextkey/common/contextkey", "vs/base/common/filters", "vs/base/common/strings", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/contrib/debug/common/debug"], function (require, exports, nls_1, quickInput_1, pickerQuickAccess_1, views_1, viewsService_1, output_1, terminal_1, contextkey_1, filters_1, strings_1, keybinding_1, actions_1, actionCommonCategories_1, panecomposite_1, debug_1) {
    "use strict";
    var ViewQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickAccessViewPickerAction = exports.OpenViewPickerAction = exports.ViewQuickAccessProvider = void 0;
    let ViewQuickAccessProvider = class ViewQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { ViewQuickAccessProvider_1 = this; }
        static { this.PREFIX = 'view '; }
        constructor(viewDescriptorService, viewsService, outputService, terminalService, terminalGroupService, debugService, paneCompositeService, contextKeyService) {
            super(ViewQuickAccessProvider_1.PREFIX, {
                noResultsPick: {
                    label: (0, nls_1.localize)('noViewResults', "No matching views"),
                    containerLabel: ''
                }
            });
            this.viewDescriptorService = viewDescriptorService;
            this.viewsService = viewsService;
            this.outputService = outputService;
            this.terminalService = terminalService;
            this.terminalGroupService = terminalGroupService;
            this.debugService = debugService;
            this.paneCompositeService = paneCompositeService;
            this.contextKeyService = contextKeyService;
        }
        _getPicks(filter) {
            const filteredViewEntries = this.doGetViewPickItems().filter(entry => {
                if (!filter) {
                    return true;
                }
                // Match fuzzy on label
                entry.highlights = { label: (0, filters_1.matchesFuzzy)(filter, entry.label, true) ?? undefined };
                // Return if we have a match on label or container
                return entry.highlights.label || (0, strings_1.fuzzyContains)(entry.containerLabel, filter);
            });
            // Map entries to container labels
            const mapEntryToContainer = new Map();
            for (const entry of filteredViewEntries) {
                if (!mapEntryToContainer.has(entry.label)) {
                    mapEntryToContainer.set(entry.label, entry.containerLabel);
                }
            }
            // Add separators for containers
            const filteredViewEntriesWithSeparators = [];
            let lastContainer = undefined;
            for (const entry of filteredViewEntries) {
                if (lastContainer !== entry.containerLabel) {
                    lastContainer = entry.containerLabel;
                    // When the entry container has a parent container, set container
                    // label as Parent / Child. For example, `Views / Explorer`.
                    let separatorLabel;
                    if (mapEntryToContainer.has(lastContainer)) {
                        separatorLabel = `${mapEntryToContainer.get(lastContainer)} / ${lastContainer}`;
                    }
                    else {
                        separatorLabel = lastContainer;
                    }
                    filteredViewEntriesWithSeparators.push({ type: 'separator', label: separatorLabel });
                }
                filteredViewEntriesWithSeparators.push(entry);
            }
            return filteredViewEntriesWithSeparators;
        }
        doGetViewPickItems() {
            const viewEntries = [];
            const getViewEntriesForPaneComposite = (paneComposite, viewContainer) => {
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                const result = [];
                for (const view of viewContainerModel.allViewDescriptors) {
                    if (this.contextKeyService.contextMatchesRules(view.when)) {
                        result.push({
                            label: view.name.value,
                            containerLabel: viewContainerModel.title,
                            accept: () => this.viewsService.openView(view.id, true)
                        });
                    }
                }
                return result;
            };
            const addPaneComposites = (location, containerLabel) => {
                const paneComposites = this.paneCompositeService.getPaneComposites(location);
                const visiblePaneCompositeIds = this.paneCompositeService.getVisiblePaneCompositeIds(location);
                paneComposites.sort((a, b) => {
                    let aIndex = visiblePaneCompositeIds.findIndex(id => a.id === id);
                    let bIndex = visiblePaneCompositeIds.findIndex(id => b.id === id);
                    if (aIndex < 0) {
                        aIndex = paneComposites.indexOf(a) + visiblePaneCompositeIds.length;
                    }
                    if (bIndex < 0) {
                        bIndex = paneComposites.indexOf(b) + visiblePaneCompositeIds.length;
                    }
                    return aIndex - bIndex;
                });
                for (const paneComposite of paneComposites) {
                    if (this.includeViewContainer(paneComposite)) {
                        const viewContainer = this.viewDescriptorService.getViewContainerById(paneComposite.id);
                        if (viewContainer) {
                            viewEntries.push({
                                label: this.viewDescriptorService.getViewContainerModel(viewContainer).title,
                                containerLabel,
                                accept: () => this.paneCompositeService.openPaneComposite(paneComposite.id, location, true)
                            });
                        }
                    }
                }
            };
            // Viewlets / Panels
            addPaneComposites(0 /* ViewContainerLocation.Sidebar */, (0, nls_1.localize)('views', "Side Bar"));
            addPaneComposites(1 /* ViewContainerLocation.Panel */, (0, nls_1.localize)('panels', "Panel"));
            addPaneComposites(2 /* ViewContainerLocation.AuxiliaryBar */, (0, nls_1.localize)('secondary side bar', "Secondary Side Bar"));
            const addPaneCompositeViews = (location) => {
                const paneComposites = this.paneCompositeService.getPaneComposites(location);
                for (const paneComposite of paneComposites) {
                    const viewContainer = this.viewDescriptorService.getViewContainerById(paneComposite.id);
                    if (viewContainer) {
                        viewEntries.push(...getViewEntriesForPaneComposite(paneComposite, viewContainer));
                    }
                }
            };
            // Side Bar / Panel Views
            addPaneCompositeViews(0 /* ViewContainerLocation.Sidebar */);
            addPaneCompositeViews(1 /* ViewContainerLocation.Panel */);
            addPaneCompositeViews(2 /* ViewContainerLocation.AuxiliaryBar */);
            // Terminals
            this.terminalGroupService.groups.forEach((group, groupIndex) => {
                group.terminalInstances.forEach((terminal, terminalIndex) => {
                    const label = (0, nls_1.localize)('terminalTitle', "{0}: {1}", `${groupIndex + 1}.${terminalIndex + 1}`, terminal.title);
                    viewEntries.push({
                        label,
                        containerLabel: (0, nls_1.localize)('terminals', "Terminal"),
                        accept: async () => {
                            await this.terminalGroupService.showPanel(true);
                            this.terminalService.setActiveInstance(terminal);
                        }
                    });
                });
            });
            // Debug Consoles
            this.debugService.getModel().getSessions(true).filter(s => s.hasSeparateRepl()).forEach((session, _) => {
                const label = session.name;
                viewEntries.push({
                    label,
                    containerLabel: (0, nls_1.localize)('debugConsoles', "Debug Console"),
                    accept: async () => {
                        await this.debugService.focusStackFrame(undefined, undefined, session, { explicit: true });
                        if (!this.viewsService.isViewVisible(debug_1.REPL_VIEW_ID)) {
                            await this.viewsService.openView(debug_1.REPL_VIEW_ID, true);
                        }
                    }
                });
            });
            // Output Channels
            const channels = this.outputService.getChannelDescriptors();
            for (const channel of channels) {
                viewEntries.push({
                    label: channel.label,
                    containerLabel: (0, nls_1.localize)('channels', "Output"),
                    accept: () => this.outputService.showChannel(channel.id)
                });
            }
            return viewEntries;
        }
        includeViewContainer(container) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(container.id);
            if (viewContainer?.hideIfEmpty) {
                return this.viewDescriptorService.getViewContainerModel(viewContainer).activeViewDescriptors.length > 0;
            }
            return true;
        }
    };
    exports.ViewQuickAccessProvider = ViewQuickAccessProvider;
    exports.ViewQuickAccessProvider = ViewQuickAccessProvider = ViewQuickAccessProvider_1 = __decorate([
        __param(0, views_1.IViewDescriptorService),
        __param(1, viewsService_1.IViewsService),
        __param(2, output_1.IOutputService),
        __param(3, terminal_1.ITerminalService),
        __param(4, terminal_1.ITerminalGroupService),
        __param(5, debug_1.IDebugService),
        __param(6, panecomposite_1.IPaneCompositePartService),
        __param(7, contextkey_1.IContextKeyService)
    ], ViewQuickAccessProvider);
    //#region Actions
    class OpenViewPickerAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openView'; }
        constructor() {
            super({
                id: OpenViewPickerAction.ID,
                title: (0, nls_1.localize2)('openView', 'Open View'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        async run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(ViewQuickAccessProvider.PREFIX);
        }
    }
    exports.OpenViewPickerAction = OpenViewPickerAction;
    class QuickAccessViewPickerAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.quickOpenView'; }
        static { this.KEYBINDING = {
            primary: 2048 /* KeyMod.CtrlCmd */ | 47 /* KeyCode.KeyQ */,
            mac: { primary: 256 /* KeyMod.WinCtrl */ | 47 /* KeyCode.KeyQ */ },
            linux: { primary: 0 }
        }; }
        constructor() {
            super({
                id: QuickAccessViewPickerAction.ID,
                title: (0, nls_1.localize2)('quickOpenView', 'Quick Open View'),
                category: actionCommonCategories_1.Categories.View,
                f1: false, // hide quick pickers from command palette to not confuse with the other entry that shows a input field
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: undefined,
                    ...QuickAccessViewPickerAction.KEYBINDING
                }
            });
        }
        async run(accessor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keys = keybindingService.lookupKeybindings(QuickAccessViewPickerAction.ID);
            quickInputService.quickAccess.show(ViewQuickAccessProvider.PREFIX, { quickNavigateConfiguration: { keybindings: keys }, itemActivation: quickInput_1.ItemActivation.FIRST });
        }
    }
    exports.QuickAccessViewPickerAction = QuickAccessViewPickerAction;
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld1F1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9xdWlja2FjY2Vzcy9icm93c2VyL3ZpZXdRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBMEJ6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLDZDQUE2Qzs7aUJBRWxGLFdBQU0sR0FBRyxPQUFPLEFBQVYsQ0FBVztRQUV4QixZQUMwQyxxQkFBNkMsRUFDdEQsWUFBMkIsRUFDMUIsYUFBNkIsRUFDM0IsZUFBaUMsRUFDNUIsb0JBQTJDLEVBQ25ELFlBQTJCLEVBQ2Ysb0JBQStDLEVBQ3RELGlCQUFxQztZQUUxRSxLQUFLLENBQUMseUJBQXVCLENBQUMsTUFBTSxFQUFFO2dCQUNyQyxhQUFhLEVBQUU7b0JBQ2QsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxtQkFBbUIsQ0FBQztvQkFDckQsY0FBYyxFQUFFLEVBQUU7aUJBQ2xCO2FBQ0QsQ0FBQyxDQUFDO1lBZHNDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDdEQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDMUIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQzNCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUM1Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ25ELGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ2YseUJBQW9CLEdBQXBCLG9CQUFvQixDQUEyQjtZQUN0RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1FBUTNFLENBQUM7UUFFUyxTQUFTLENBQUMsTUFBYztZQUNqQyxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE1BQU0s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