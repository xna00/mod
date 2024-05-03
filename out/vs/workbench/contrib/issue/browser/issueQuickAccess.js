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
define(["require", "exports", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/base/common/filters", "vs/nls", "vs/platform/commands/common/commands", "vs/workbench/services/extensions/common/extensions", "vs/base/common/themables", "vs/base/common/codicons", "vs/platform/issue/common/issue", "vs/platform/product/common/productService"], function (require, exports, pickerQuickAccess_1, contextkey_1, actions_1, filters_1, nls_1, commands_1, extensions_1, themables_1, codicons_1, issue_1, productService_1) {
    "use strict";
    var IssueQuickAccess_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IssueQuickAccess = void 0;
    let IssueQuickAccess = class IssueQuickAccess extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { IssueQuickAccess_1 = this; }
        static { this.PREFIX = 'issue '; }
        constructor(menuService, contextKeyService, commandService, extensionService, productService) {
            super(IssueQuickAccess_1.PREFIX, { canAcceptInBackground: true });
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.commandService = commandService;
            this.extensionService = extensionService;
            this.productService = productService;
        }
        _getPicks(filter) {
            const issuePicksConst = new Array();
            const issuePicksParts = new Array();
            const extensionIdSet = new Set();
            // Add default items
            const productLabel = this.productService.nameLong;
            const marketPlaceLabel = (0, nls_1.localize)("reportExtensionMarketplace", "Extension Marketplace");
            const productFilter = (0, filters_1.matchesFuzzy)(filter, productLabel, true);
            const marketPlaceFilter = (0, filters_1.matchesFuzzy)(filter, marketPlaceLabel, true);
            // Add product pick if product filter matches
            if (productFilter) {
                issuePicksConst.push({
                    label: productLabel,
                    ariaLabel: productLabel,
                    highlights: { label: productFilter },
                    accept: () => this.commandService.executeCommand('workbench.action.openIssueReporter', { issueSource: issue_1.IssueSource.VSCode })
                });
            }
            // Add marketplace pick if marketplace filter matches
            if (marketPlaceFilter) {
                issuePicksConst.push({
                    label: marketPlaceLabel,
                    ariaLabel: marketPlaceLabel,
                    highlights: { label: marketPlaceFilter },
                    accept: () => this.commandService.executeCommand('workbench.action.openIssueReporter', { issueSource: issue_1.IssueSource.Marketplace })
                });
            }
            issuePicksConst.push({ type: 'separator', label: (0, nls_1.localize)('extensions', "Extensions") });
            // creates menu from contributed
            const menu = this.menuService.createMenu(actions_1.MenuId.IssueReporter, this.contextKeyService);
            // render menu and dispose
            const actions = menu.getActions({ renderShortTitle: true }).flatMap(entry => entry[1]);
            menu.dispose();
            // create picks from contributed menu
            actions.forEach(action => {
                if ('source' in action.item && action.item.source) {
                    extensionIdSet.add(action.item.source.id);
                }
                const pick = this._createPick(filter, action);
                if (pick) {
                    issuePicksParts.push(pick);
                }
            });
            // create picks from extensions
            this.extensionService.extensions.forEach(extension => {
                if (!extension.isBuiltin) {
                    const pick = this._createPick(filter, undefined, extension);
                    const id = extension.identifier.value;
                    if (pick && !extensionIdSet.has(id)) {
                        issuePicksParts.push(pick);
                    }
                    extensionIdSet.add(id);
                }
            });
            issuePicksParts.sort((a, b) => {
                const aLabel = a.label ?? '';
                const bLabel = b.label ?? '';
                return aLabel.localeCompare(bLabel);
            });
            return [...issuePicksConst, ...issuePicksParts];
        }
        _createPick(filter, action, extension) {
            const buttons = [{
                    iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.info),
                    tooltip: (0, nls_1.localize)('contributedIssuePage', "Open Extension Page")
                }];
            let label;
            let trigger;
            let accept;
            if (action && 'source' in action.item && action.item.source) {
                label = action.item.source?.title;
                trigger = () => {
                    if ('source' in action.item && action.item.source) {
                        this.commandService.executeCommand('extension.open', action.item.source.id);
                    }
                    return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                };
                accept = () => {
                    action.run();
                };
            }
            else if (extension) {
                label = extension.displayName ?? extension.name;
                trigger = () => {
                    this.commandService.executeCommand('extension.open', extension.identifier.value);
                    return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                };
                accept = () => {
                    this.commandService.executeCommand('workbench.action.openIssueReporter', extension.identifier.value);
                };
            }
            else {
                return undefined;
            }
            const highlights = (0, filters_1.matchesFuzzy)(filter, label, true);
            if (highlights) {
                return {
                    label,
                    highlights: { label: highlights },
                    buttons,
                    trigger,
                    accept
                };
            }
            return undefined;
        }
    };
    exports.IssueQuickAccess = IssueQuickAccess;
    exports.IssueQuickAccess = IssueQuickAccess = IssueQuickAccess_1 = __decorate([
        __param(0, actions_1.IMenuService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, commands_1.ICommandService),
        __param(3, extensions_1.IExtensionService),
        __param(4, productService_1.IProductService)
    ], IssueQuickAccess);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaXNzdWUvYnJvd3Nlci9pc3N1ZVF1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFnQnpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsNkNBQWlEOztpQkFFL0UsV0FBTSxHQUFHLFFBQVEsQUFBWCxDQUFZO1FBRXpCLFlBQ2dDLFdBQXlCLEVBQ25CLGlCQUFxQyxFQUN4QyxjQUErQixFQUM3QixnQkFBbUMsRUFDckMsY0FBK0I7WUFFakUsS0FBSyxDQUFDLGtCQUFnQixDQUFDLE1BQU0sRUFBRSxFQUFFLHFCQUFxQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFOakMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUN4QyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNyQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7UUFHbEUsQ0FBQztRQUVrQixTQUFTLENBQUMsTUFBYztZQUMxQyxNQUFNLGVBQWUsR0FBRyxJQUFJLEtBQUssRUFBZ0QsQ0FBQztZQUNsRixNQUFNLGVBQWUsR0FBRyxJQUFJLEtBQUssRUFBZ0QsQ0FBQztZQUNsRixNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBRXpDLG9CQUFvQjtZQUNwQixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQztZQUNsRCxNQUFNLGdCQUFnQixHQUFHLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDekYs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