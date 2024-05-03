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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/base/common/themables", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/workbench/contrib/notebook/browser/controller/coreActions"], function (require, exports, arrays_1, async_1, cancellation_1, codicons_1, event_1, lifecycle_1, strings_1, nls_1, commands_1, label_1, log_1, productService_1, quickInput_1, themables_1, extensions_1, notebookBrowser_1, notebookIcons_1, notebookKernelService_1, extensions_2, panecomposite_1, uri_1, opener_1, coreActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KernelPickerMRUStrategy = void 0;
    function isKernelPick(item) {
        return 'kernel' in item;
    }
    function isGroupedKernelsPick(item) {
        return 'kernels' in item;
    }
    function isSourcePick(item) {
        return 'action' in item;
    }
    function isInstallExtensionPick(item) {
        return item.id === 'installSuggested' && 'extensionIds' in item;
    }
    function isSearchMarketplacePick(item) {
        return item.id === 'install';
    }
    function isKernelSourceQuickPickItem(item) {
        return 'command' in item;
    }
    function supportAutoRun(item) {
        return 'autoRun' in item && !!item.autoRun;
    }
    const KERNEL_PICKER_UPDATE_DEBOUNCE = 200;
    function toKernelQuickPick(kernel, selected) {
        const res = {
            kernel,
            picked: kernel.id === selected?.id,
            label: kernel.label,
            description: kernel.description,
            detail: kernel.detail
        };
        if (kernel.id === selected?.id) {
            if (!res.description) {
                res.description = (0, nls_1.localize)('current1', "Currently Selected");
            }
            else {
                res.description = (0, nls_1.localize)('current2', "{0} - Currently Selected", res.description);
            }
        }
        return res;
    }
    class KernelPickerStrategyBase {
        constructor(_notebookKernelService, _productService, _quickInputService, _labelService, _logService, _paneCompositePartService, _extensionWorkbenchService, _extensionService, _commandService) {
            this._notebookKernelService = _notebookKernelService;
            this._productService = _productService;
            this._quickInputService = _quickInputService;
            this._labelService = _labelService;
            this._logService = _logService;
            this._paneCompositePartService = _paneCompositePartService;
            this._extensionWorkbenchService = _extensionWorkbenchService;
            this._extensionService = _extensionService;
            this._commandService = _commandService;
        }
        async showQuickPick(editor, wantedId, skipAutoRun) {
            const notebook = editor.textModel;
            const scopedContextKeyService = editor.scopedContextKeyService;
            const matchResult = this._getMatchingResult(notebook);
            const { selected, all } = matchResult;
            let newKernel;
            if (wantedId) {
                for (const candidate of all) {
                    if (candidate.id === wantedId) {
                        newKernel = candidate;
                        break;
                    }
                }
                if (!newKernel) {
                    this._logService.warn(`wanted kernel DOES NOT EXIST, wanted: ${wantedId}, all: ${all.map(k => k.id)}`);
                    return false;
                }
            }
            if (newKernel) {
                this._selecteKernel(notebook, newKernel);
                return true;
            }
            const quickPick = this._quickInputService.createQuickPick();
            const quickPickItems = this._getKernelPickerQuickPickItems(notebook, matchResult, this._notebookKernelService, scopedContextKeyService);
            if (quickPickItems.length === 1 && supportAutoRun(quickPickItems[0]) && !skipAutoRun) {
                return await this._handleQuickPick(editor, quickPickItems[0], quickPickItems);
            }
            quickPick.items = quickPickItems;
            quickPick.canSelectMany = false;
            quickPick.placeholder = selected
                ? (0, nls_1.localize)('prompt.placeholder.change', "Change kernel for '{0}'", this._labelService.getUriLabel(notebook.uri, { relative: true }))
                : (0, nls_1.localize)('prompt.placeholder.select', "Select kernel for '{0}'", this._labelService.getUriLabel(notebook.uri, { relative: true }));
            quickPick.busy = this._notebookKernelService.getKernelDetectionTasks(notebook).length > 0;
            const kernelDetectionTaskListener = this._notebookKernelService.onDidChangeKernelDetectionTasks(() => {
                quickPick.busy = this._notebookKernelService.getKernelDetectionTasks(notebook).length > 0;
            });
            // run extension recommendataion task if quickPickItems is empty
            const extensionRecommendataionPromise = quickPickItems.length === 0
                ? (0, async_1.createCancelablePromise)(token => this._showInstallKernelExtensionRecommendation(notebook, quickPick, this._extensionWorkbenchService, token))
                : undefined;
            const kernelChangeEventListener = event_1.Event.debounce(event_1.Event.any(this._notebookKernelService.onDidChangeSourceActions, this._notebookKernelService.onDidAddKernel, this._notebookKernelService.onDidRemoveKernel, this._notebookKernelService.onDidChangeNotebookAffinity), (last, _current) => last, KERNEL_PICKER_UPDATE_DEBOUNCE)(async () => {
                // reset quick pick progress
                quickPick.busy = false;
                extensionRecommendataionPromise?.cancel();
                const currentActiveItems = quickPick.activeItems;
                const matchResult = this._getMatchingResult(notebook);
                const quickPickItems = this._getKernelPickerQuickPickItems(notebook, matchResult, this._notebookKernelService, scopedContextKeyService);
                quickPick.keepScrollPosition = true;
                // recalcuate active items
                const activeItems = [];
                for (const item of currentActiveItems) {
                    if (isKernelPick(item)) {
                        const kernelId = item.kernel.id;
                        const sameItem = quickPickItems.find(pi => isKernelPick(pi) && pi.kernel.id === kernelId);
                        if (sameItem) {
                            activeItems.push(sameItem);
                        }
                    }
                    else if (isSourcePick(item)) {
                        const sameItem = quickPickItems.find(pi => isSourcePick(pi) && pi.action.action.id === item.action.action.id);
                        if (sameItem) {
                            activeItems.push(sameItem);
                        }
                    }
                }
                quickPick.items = quickPickItems;
                quickPick.activeItems = activeItems;
            }, this);
            const pick = await new Promise((resolve, reject) => {
                quickPick.onDidAccept(() => {
                    const item = quickPick.selectedItems[0];
                    if (item) {
                        resolve({ selected: item, items: quickPick.items });
                    }
                    else {
                        resolve({ selected: undefined, items: quickPick.items });
                    }
                    quickPick.hide();
                });
                quickPick.onDidHide(() => {
                    kernelDetectionTaskListener.dispose();
                    kernelChangeEventListener.dispose();
                    quickPick.dispose();
                    resolve({ selected: undefined, items: quickPick.items });
                });
                quickPick.show();
            });
            if (pick.selected) {
                return await this._handleQuickPick(editor, pick.selected, pick.items);
            }
            return false;
        }
        _getMatchingResult(notebook) {
            return this._notebookKernelService.getMatchingKernel(notebook);
        }
        async _handleQuickPick(editor, pick, quickPickItems) {
            if (isKernelPick(pick)) {
                const newKernel = pick.kernel;
                this._selecteKernel(editor.textModel, newKernel);
                return true;
            }
            // actions
            if (isSearchMarketplacePick(pick)) {
                await this._showKernelExtension(this._paneCompositePartService, this._extensionWorkbenchService, this._extensionService, editor.textModel.viewType, []);
                // suggestedExtension must be defined for this option to be shown, but still check to make TS happy
            }
            else if (isInstallExtensionPick(pick)) {
                await this._showKernelExtension(this._paneCompositePartService, this._extensionWorkbenchService, this._extensionService, editor.textModel.viewType, pick.extensionIds, this._productService.quality !== 'stable');
            }
            else if (isSourcePick(pick)) {
                // selected explicilty, it should trigger the execution?
                pick.action.runAction();
            }
            return true;
        }
        _selecteKernel(notebook, kernel) {
            this._notebookKernelService.selectKernelForNotebook(kernel, notebook);
        }
        async _showKernelExtension(paneCompositePartService, extensionWorkbenchService, extensionService, viewType, extIds, isInsiders) {
            // If extension id is provided attempt to install the extension as the user has requested the suggested ones be installed
            const extensionsToInstall = [];
            const extensionsToEnable = [];
            for (const extId of extIds) {
                const extension = (await extensionWorkbenchService.getExtensions([{ id: extId }], cancellation_1.CancellationToken.None))[0];
                if (extension.enablementState === 6 /* EnablementState.DisabledGlobally */ || extension.enablementState === 7 /* EnablementState.DisabledWorkspace */ || extension.enablementState === 2 /* EnablementState.DisabledByEnvironment */) {
                    extensionsToEnable.push(extension);
                }
                else {
                    const canInstall = await extensionWorkbenchService.canInstall(extension);
                    if (canInstall) {
                        extensionsToInstall.push(extension);
                    }
                }
            }
            if (extensionsToInstall.length || extensionsToEnable.length) {
                await Promise.all([...extensionsToInstall.map(async (extension) => {
                        await extensionWorkbenchService.install(extension, {
                            installPreReleaseVersion: isInsiders ?? false,
                            context: { skipWalkthrough: true }
                        }, 15 /* ProgressLocation.Notification */);
                    }), ...extensionsToEnable.map(async (extension) => {
                        switch (extension.enablementState) {
                            case 7 /* EnablementState.DisabledWorkspace */:
                                await extensionWorkbenchService.setEnablement([extension], 9 /* EnablementState.EnabledWorkspace */);
                                return;
                            case 6 /* EnablementState.DisabledGlobally */:
                                await extensionWorkbenchService.setEnablement([extension], 8 /* EnablementState.EnabledGlobally */);
                                return;
                            case 2 /* EnablementState.DisabledByEnvironment */:
                                await extensionWorkbenchService.setEnablement([extension], 3 /* EnablementState.EnabledByEnvironment */);
                                return;
                            default:
                                break;
                        }
                    })]);
                await extensionService.activateByEvent(`onNotebook:${viewType}`);
                return;
            }
            const viewlet = await paneCompositePartService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const view = viewlet?.getViewPaneContainer();
            const pascalCased = viewType.split(/[^a-z0-9]/ig).map(strings_1.uppercaseFirstLetter).join('');
            view?.search(`@tag:notebookKernel${pascalCased}`);
        }
        async _showInstallKernelExtensionRecommendation(notebookTextModel, quickPick, extensionWorkbenchService, token) {
            quickPick.busy = true;
            const newQuickPickItems = await this._getKernelRecommendationsQuickPickItems(notebookTextModel, extensionWorkbenchService);
            quickPick.busy = false;
            if (token.isCancellationRequested) {
                return;
            }
            if (newQuickPickItems && quickPick.items.length === 0) {
                quickPick.items = newQuickPickItems;
            }
        }
        async _getKernelRecommendationsQuickPickItems(notebookTextModel, extensionWorkbenchService) {
            const quickPickItems = [];
            const language = this.getSuggestedLanguage(notebookTextModel);
            const suggestedExtension = language ? this.getSuggestedKernelFromLanguage(notebookTextModel.viewType, language) : undefined;
            if (suggestedExtension) {
                await extensionWorkbenchService.queryLocal();
                const extensions = extensionWorkbenchService.installed.filter(e => (e.enablementState === 3 /* EnablementState.EnabledByEnvironment */ || e.enablementState === 8 /* EnablementState.EnabledGlobally */ || e.enablementState === 9 /* EnablementState.EnabledWorkspace */)
                    && suggestedExtension.extensionIds.includes(e.identifier.id));
                if (extensions.length === suggestedExtension.extensionIds.length) {
                    // it's installed but might be detecting kernels
                    return undefined;
                }
                // We have a suggested kernel, show an option to install it
                quickPickItems.push({
                    id: 'installSuggested',
                    description: suggestedExtension.displayName ?? suggestedExtension.extensionIds.join(', '),
                    label: `$(${codicons_1.Codicon.lightbulb.id}) ` + (0, nls_1.localize)('installSuggestedKernel', 'Install/Enable suggested extensions'),
                    extensionIds: suggestedExtension.extensionIds
                });
            }
            // there is no kernel, show the install from marketplace
            quickPickItems.push({
                id: 'install',
                label: (0, nls_1.localize)('searchForKernels', "Browse marketplace for kernel extensions"),
            });
            return quickPickItems;
        }
        /**
         * Examine the most common language in the notebook
         * @param notebookTextModel The notebook text model
         * @returns What the suggested language is for the notebook. Used for kernal installing
         */
        getSuggestedLanguage(notebookTextModel) {
            const metaData = notebookTextModel.metadata;
            let suggestedKernelLanguage = metaData?.metadata?.language_info?.name;
            // TODO how do we suggest multi language notebooks?
            if (!suggestedKernelLanguage) {
                const cellLanguages = notebookTextModel.cells.map(cell => cell.language).filter(language => language !== 'markdown');
                // Check if cell languages is all the same
                if (cellLanguages.length > 1) {
                    const firstLanguage = cellLanguages[0];
                    if (cellLanguages.every(language => language === firstLanguage)) {
                        suggestedKernelLanguage = firstLanguage;
                    }
                }
            }
            return suggestedKernelLanguage;
        }
        /**
         * Given a language and notebook view type suggest a kernel for installation
         * @param language The language to find a suggested kernel extension for
         * @returns A recommednation object for the recommended extension, else undefined
         */
        getSuggestedKernelFromLanguage(viewType, language) {
            const recommendation = notebookBrowser_1.KERNEL_RECOMMENDATIONS.get(viewType)?.get(language);
            return recommendation;
        }
    }
    let KernelPickerMRUStrategy = class KernelPickerMRUStrategy extends KernelPickerStrategyBase {
        constructor(_notebookKernelService, _productService, _quickInputService, _labelService, _logService, _paneCompositePartService, _extensionWorkbenchService, _extensionService, _commandService, _notebookKernelHistoryService, _openerService) {
            super(_notebookKernelService, _productService, _quickInputService, _labelService, _logService, _paneCompositePartService, _extensionWorkbenchService, _extensionService, _commandService);
            this._notebookKernelHistoryService = _notebookKernelHistoryService;
            this._openerService = _openerService;
        }
        _getKernelPickerQuickPickItems(notebookTextModel, matchResult, notebookKernelService, scopedContextKeyService) {
            const quickPickItems = [];
            if (matchResult.selected) {
                const kernelItem = toKernelQuickPick(matchResult.selected, matchResult.selected);
                quickPickItems.push(kernelItem);
            }
            matchResult.suggestions.filter(kernel => kernel.id !== matchResult.selected?.id).map(kernel => toKernelQuickPick(kernel, matchResult.selected))
                .forEach(kernel => {
                quickPickItems.push(kernel);
            });
            const shouldAutoRun = quickPickItems.length === 0;
            if (quickPickItems.length > 0) {
                quickPickItems.push({
                    type: 'separator'
                });
            }
            // select another kernel quick pick
            quickPickItems.push({
                id: 'selectAnother',
                label: (0, nls_1.localize)('selectAnotherKernel.more', "Select Another Kernel..."),
                autoRun: shouldAutoRun
            });
            return quickPickItems;
        }
        _selecteKernel(notebook, kernel) {
            const currentInfo = this._notebookKernelService.getMatchingKernel(notebook);
            if (currentInfo.selected) {
                // there is already a selected kernel
                this._notebookKernelHistoryService.addMostRecentKernel(currentInfo.selected);
            }
            super._selecteKernel(notebook, kernel);
            this._notebookKernelHistoryService.addMostRecentKernel(kernel);
        }
        _getMatchingResult(notebook) {
            const { selected, all } = this._notebookKernelHistoryService.getKernels(notebook);
            const matchingResult = this._notebookKernelService.getMatchingKernel(notebook);
            return {
                selected: selected,
                all: matchingResult.all,
                suggestions: all,
                hidden: []
            };
        }
        async _handleQuickPick(editor, pick, items) {
            if (pick.id === 'selectAnother') {
                return this.displaySelectAnotherQuickPick(editor, items.length === 1 && items[0] === pick);
            }
            return super._handleQuickPick(editor, pick, items);
        }
        async displaySelectAnotherQuickPick(editor, kernelListEmpty) {
            const notebook = editor.textModel;
            const disposables = new lifecycle_1.DisposableStore();
            const quickPick = this._quickInputService.createQuickPick();
            const quickPickItem = await new Promise(resolve => {
                // select from kernel sources
                quickPick.title = kernelListEmpty ? (0, nls_1.localize)('select', "Select Kernel") : (0, nls_1.localize)('selectAnotherKernel', "Select Another Kernel");
                quickPick.placeholder = (0, nls_1.localize)('selectKernel.placeholder', "Type to choose a kernel source");
                quickPick.busy = true;
                quickPick.buttons = [this._quickInputService.backButton];
                quickPick.show();
                disposables.add(quickPick.onDidTriggerButton(button => {
                    if (button === this._quickInputService.backButton) {
                        resolve(button);
                    }
                }));
                quickPick.onDidTriggerItemButton(async (e) => {
                    if (isKernelSourceQuickPickItem(e.item) && e.item.documentation !== undefined) {
                        const uri = uri_1.URI.isUri(e.item.documentation) ? uri_1.URI.parse(e.item.documentation) : await this._commandService.executeCommand(e.item.documentation);
                        void this._openerService.open(uri, { openExternal: true });
                    }
                });
                disposables.add(quickPick.onDidAccept(async () => {
                    resolve(quickPick.selectedItems[0]);
                }));
                disposables.add(quickPick.onDidHide(() => {
                    resolve(undefined);
                }));
                this._calculdateKernelSources(editor).then(quickPickItems => {
                    quickPick.items = quickPickItems;
                    if (quickPick.items.length > 0) {
                        quickPick.busy = false;
                    }
                });
                disposables.add(event_1.Event.debounce(event_1.Event.any(this._notebookKernelService.onDidChangeSourceActions, this._notebookKernelService.onDidAddKernel, this._notebookKernelService.onDidRemoveKernel), (last, _current) => last, KERNEL_PICKER_UPDATE_DEBOUNCE)(async () => {
                    quickPick.busy = true;
                    const quickPickItems = await this._calculdateKernelSources(editor);
                    quickPick.items = quickPickItems;
                    quickPick.busy = false;
                }));
            });
            quickPick.hide();
            disposables.dispose();
            if (quickPickItem === this._quickInputService.backButton) {
                return this.showQuickPick(editor, undefined, true);
            }
            if (quickPickItem) {
                const selectedKernelPickItem = quickPickItem;
                if (isKernelSourceQuickPickItem(selectedKernelPickItem)) {
                    try {
                        const selectedKernelId = await this._executeCommand(notebook, selectedKernelPickItem.command);
                        if (selectedKernelId) {
                            const { all } = await this._getMatchingResult(notebook);
                            const kernel = all.find(kernel => kernel.id === `ms-toolsai.jupyter/${selectedKernelId}`);
                            if (kernel) {
                                await this._selecteKernel(notebook, kernel);
                                return true;
                            }
                            return true;
                        }
                        else {
                            return this.displaySelectAnotherQuickPick(editor, false);
                        }
                    }
                    catch (ex) {
                        return false;
                    }
                }
                else if (isKernelPick(selectedKernelPickItem)) {
                    await this._selecteKernel(notebook, selectedKernelPickItem.kernel);
                    return true;
                }
                else if (isGroupedKernelsPick(selectedKernelPickItem)) {
                    await this._selectOneKernel(notebook, selectedKernelPickItem.label, selectedKernelPickItem.kernels);
                    return true;
                }
                else if (isSourcePick(selectedKernelPickItem)) {
                    // selected explicilty, it should trigger the execution?
                    try {
                        await selectedKernelPickItem.action.runAction();
                        return true;
                    }
                    catch (ex) {
                        return false;
                    }
                }
                else if (isSearchMarketplacePick(selectedKernelPickItem)) {
                    await this._showKernelExtension(this._paneCompositePartService, this._extensionWorkbenchService, this._extensionService, editor.textModel.viewType, []);
                    return true;
                }
                else if (isInstallExtensionPick(selectedKernelPickItem)) {
                    await this._showKernelExtension(this._paneCompositePartService, this._extensionWorkbenchService, this._extensionService, editor.textModel.viewType, selectedKernelPickItem.extensionIds, this._productService.quality !== 'stable');
                    return this.displaySelectAnotherQuickPick(editor, false);
                }
            }
            return false;
        }
        async _calculdateKernelSources(editor) {
            const notebook = editor.textModel;
            const sourceActionCommands = this._notebookKernelService.getSourceActions(notebook, editor.scopedContextKeyService);
            const actions = await this._notebookKernelService.getKernelSourceActions2(notebook);
            const matchResult = this._getMatchingResult(notebook);
            if (sourceActionCommands.length === 0 && matchResult.all.length === 0 && actions.length === 0) {
                return await this._getKernelRecommendationsQuickPickItems(notebook, this._extensionWorkbenchService) ?? [];
            }
            const others = matchResult.all.filter(item => item.extension.value !== notebookBrowser_1.JUPYTER_EXTENSION_ID);
            const quickPickItems = [];
            // group controllers by extension
            for (const group of (0, arrays_1.groupBy)(others, (a, b) => a.extension.value === b.extension.value ? 0 : 1)) {
                const extension = this._extensionService.extensions.find(extension => extension.identifier.value === group[0].extension.value);
                const source = extension?.displayName ?? extension?.description ?? group[0].extension.value;
                if (group.length > 1) {
                    quickPickItems.push({
                        label: source,
                        kernels: group
                    });
                }
                else {
                    quickPickItems.push({
                        label: group[0].label,
                        kernel: group[0]
                    });
                }
            }
            const validActions = actions.filter(action => action.command);
            quickPickItems.push(...validActions.map(action => {
                const buttons = action.documentation ? [{
                        iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.info),
                        tooltip: (0, nls_1.localize)('learnMoreTooltip', 'Learn More'),
                    }] : [];
                return {
                    id: typeof action.command === 'string' ? action.command : action.command.id,
                    label: action.label,
                    description: action.description,
                    command: action.command,
                    documentation: action.documentation,
                    buttons
                };
            }));
            for (const sourceAction of sourceActionCommands) {
                const res = {
                    action: sourceAction,
                    picked: false,
                    label: sourceAction.action.label,
                    tooltip: sourceAction.action.tooltip
                };
                quickPickItems.push(res);
            }
            return quickPickItems;
        }
        async _selectOneKernel(notebook, source, kernels) {
            const quickPickItems = kernels.map(kernel => toKernelQuickPick(kernel, undefined));
            const quickPick = this._quickInputService.createQuickPick();
            quickPick.items = quickPickItems;
            quickPick.canSelectMany = false;
            quickPick.title = (0, nls_1.localize)('selectKernelFromExtension', "Select Kernel from {0}", source);
            quickPick.onDidAccept(async () => {
                if (quickPick.selectedItems && quickPick.selectedItems.length > 0 && isKernelPick(quickPick.selectedItems[0])) {
                    await this._selecteKernel(notebook, quickPick.selectedItems[0].kernel);
                }
                quickPick.hide();
                quickPick.dispose();
            });
            quickPick.onDidHide(() => {
                quickPick.dispose();
            });
            quickPick.show();
        }
        async _executeCommand(notebook, command) {
            const id = typeof command === 'string' ? command : command.id;
            const args = typeof command === 'string' ? [] : command.arguments ?? [];
            if (typeof command === 'string' || !command.arguments || !Array.isArray(command.arguments) || command.arguments.length === 0) {
                args.unshift({
                    uri: notebook.uri,
                    $mid: 14 /* MarshalledId.NotebookActionContext */
                });
            }
            if (typeof command === 'string') {
                return this._commandService.executeCommand(id);
            }
            else {
                return this._commandService.executeCommand(id, ...args);
            }
        }
        static updateKernelStatusAction(notebook, action, notebookKernelService, notebookKernelHistoryService) {
            const detectionTasks = notebookKernelService.getKernelDetectionTasks(notebook);
            if (detectionTasks.length) {
                const info = notebookKernelService.getMatchingKernel(notebook);
                action.enabled = true;
                action.class = themables_1.ThemeIcon.asClassName(themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin'));
                if (info.selected) {
                    action.label = info.selected.label;
                    const kernelInfo = info.selected.description ?? info.selected.detail;
                    action.tooltip = kernelInfo
                        ? (0, nls_1.localize)('kernels.selectedKernelAndKernelDetectionRunning', "Selected Kernel: {0} (Kernel Detection Tasks Running)", kernelInfo)
                        : (0, nls_1.localize)('kernels.detecting', "Detecting Kernels");
                }
                else {
                    action.label = (0, nls_1.localize)('kernels.detecting', "Detecting Kernels");
                }
                return;
            }
            const runningActions = notebookKernelService.getRunningSourceActions(notebook);
            const updateActionFromSourceAction = (sourceAction, running) => {
                const sAction = sourceAction.action;
                action.class = running ? themables_1.ThemeIcon.asClassName(themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin')) : themables_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon);
                action.label = sAction.label;
                action.enabled = true;
            };
            if (runningActions.length) {
                return updateActionFromSourceAction(runningActions[0] /** TODO handle multiple actions state */, true);
            }
            const { selected } = notebookKernelHistoryService.getKernels(notebook);
            if (selected) {
                action.label = selected.label;
                action.class = themables_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon);
                action.tooltip = selected.description ?? selected.detail ?? '';
            }
            else {
                action.label = (0, nls_1.localize)('select', "Select Kernel");
                action.class = themables_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon);
                action.tooltip = '';
            }
        }
        static async resolveKernel(notebook, notebookKernelService, notebookKernelHistoryService, commandService) {
            const alreadySelected = notebookKernelHistoryService.getKernels(notebook);
            if (alreadySelected.selected) {
                return alreadySelected.selected;
            }
            await commandService.executeCommand(coreActions_1.SELECT_KERNEL_ID);
            const { selected } = notebookKernelHistoryService.getKernels(notebook);
            return selected;
        }
    };
    exports.KernelPickerMRUStrategy = KernelPickerMRUStrategy;
    exports.KernelPickerMRUStrategy = KernelPickerMRUStrategy = __decorate([
        __param(0, notebookKernelService_1.INotebookKernelService),
        __param(1, productService_1.IProductService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, label_1.ILabelService),
        __param(4, log_1.ILogService),
        __param(5, panecomposite_1.IPaneCompositePartService),
        __param(6, extensions_1.IExtensionsWorkbenchService),
        __param(7, extensions_2.IExtensionService),
        __param(8, commands_1.ICommandService),
        __param(9, notebookKernelService_1.INotebookKernelHistoryService),
        __param(10, opener_1.IOpenerService)
    ], KernelPickerMRUStrategy);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXJuZWxRdWlja1BpY2tTdHJhdGVneS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3UGFydHMvbm90ZWJvb2tLZXJuZWxRdWlja1BpY2tTdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQ2hHLFNBQVMsWUFBWSxDQUFDLElBQW9DO1FBQ3pELE9BQU8sUUFBUSxJQUFJLElBQUksQ0FBQztJQUN6QixDQUFDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFvQztRQUNqRSxPQUFPLFNBQVMsSUFBSSxJQUFJLENBQUM7SUFDMUIsQ0FBQztJQUVELFNBQVMsWUFBWSxDQUFDLElBQW9DO1FBQ3pELE9BQU8sUUFBUSxJQUFJLElBQUksQ0FBQztJQUN6QixDQUFDO0lBRUQsU0FBUyxzQkFBc0IsQ0FBQyxJQUFvQztRQUNuRSxPQUFPLElBQUksQ0FBQyxFQUFFLEtBQUssa0JBQWtCLElBQUksY0FBYyxJQUFJLElBQUksQ0FBQztJQUNqRSxDQUFDO0lBRUQsU0FBUyx1QkFBdUIsQ0FBQyxJQUFvQztRQUNwRSxPQUFPLElBQUksQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDO0lBQzlCLENBQUM7SUFHRCxTQUFTLDJCQUEyQixDQUFDLElBQW9CO1FBQ3hELE9BQU8sU0FBUyxJQUFJLElBQUksQ0FBQztJQUMxQixDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUMsSUFBb0M7UUFDM0QsT0FBTyxTQUFTLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQzVDLENBQUM7SUFFRCxNQUFNLDZCQUE2QixHQUFHLEdBQUcsQ0FBQztJQVkxQyxTQUFTLGlCQUFpQixDQUFDLE1BQXVCLEVBQUUs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