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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/map", "vs/editor/common/languages/language", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService"], function (require, exports, lifecycle_1, map_1, language_1, nls_1, configuration_1, instantiation_1, keybinding_1, platform_1, contributions_1, notebookBrowser_1, notebookCellStatusBarService_1, notebookCommon_1, notebookKernelService_1, notebookService_1, languageDetectionWorkerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CellStatusBarLanguagePickerProvider = class CellStatusBarLanguagePickerProvider {
        constructor(_notebookService, _languageService) {
            this._notebookService = _notebookService;
            this._languageService = _languageService;
            this.viewType = '*';
        }
        async provideCellStatusBarItems(uri, index, _token) {
            const doc = this._notebookService.getNotebookTextModel(uri);
            const cell = doc?.cells[index];
            if (!cell) {
                return;
            }
            const statusBarItems = [];
            let displayLanguage = cell.language;
            if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                displayLanguage = 'markdown';
            }
            else {
                const registeredId = this._languageService.getLanguageIdByLanguageName(cell.language);
                if (registeredId) {
                    displayLanguage = this._languageService.getLanguageName(displayLanguage) ?? displayLanguage;
                }
                else {
                    // add unregistered lanugage warning item
                    const searchTooltip = (0, nls_1.localize)('notebook.cell.status.searchLanguageExtensions', "Unknown cell language. Click to search for '{0}' extensions", cell.language);
                    statusBarItems.push({
                        text: `$(dialog-warning)`,
                        command: { id: 'workbench.extensions.search', arguments: [`@tag:${cell.language}`], title: 'Search Extensions' },
                        tooltip: searchTooltip,
                        alignment: 2 /* CellStatusbarAlignment.Right */,
                        priority: -Number.MAX_SAFE_INTEGER + 1
                    });
                }
            }
            statusBarItems.push({
                text: displayLanguage,
                command: notebookBrowser_1.CHANGE_CELL_LANGUAGE,
                tooltip: (0, nls_1.localize)('notebook.cell.status.language', "Select Cell Language Mode"),
                alignment: 2 /* CellStatusbarAlignment.Right */,
                priority: -Number.MAX_SAFE_INTEGER
            });
            return {
                items: statusBarItems
            };
        }
    };
    CellStatusBarLanguagePickerProvider = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, language_1.ILanguageService)
    ], CellStatusBarLanguagePickerProvider);
    let CellStatusBarLanguageDetectionProvider = class CellStatusBarLanguageDetectionProvider {
        constructor(_notebookService, _notebookKernelService, _languageService, _configurationService, _languageDetectionService, _keybindingService) {
            this._notebookService = _notebookService;
            this._notebookKernelService = _notebookKernelService;
            this._languageService = _languageService;
            this._configurationService = _configurationService;
            this._languageDetectionService = _languageDetectionService;
            this._keybindingService = _keybindingService;
            this.viewType = '*';
            this.cache = new map_1.ResourceMap();
        }
        async provideCellStatusBarItems(uri, index, token) {
            const doc = this._notebookService.getNotebookTextModel(uri);
            const cell = doc?.cells[index];
            if (!cell) {
                return;
            }
            const enablementConfig = this._configurationService.getValue('workbench.editor.languageDetectionHints');
            const enabled = typeof enablementConfig === 'object' && enablementConfig?.notebookEditors;
            if (!enabled) {
                return;
            }
            const cellUri = cell.uri;
            const contentVersion = cell.textModel?.getVersionId();
            if (!contentVersion) {
                return;
            }
            const currentLanguageId = cell.cellKind === notebookCommon_1.CellKind.Markup ?
                'markdown' :
                (this._languageService.getLanguageIdByLanguageName(cell.language) || cell.language);
            if (!this.cache.has(cellUri)) {
                this.cache.set(cellUri, {
                    cellLanguage: currentLanguageId, // force a re-compute upon a change in configured language
                    updateTimestamp: 0, // facilitates a disposable-free debounce operation
                    contentVersion: 1, // dont run for the initial contents, only on update
                });
            }
            const cached = this.cache.get(cellUri);
            if (cached.cellLanguage !== currentLanguageId || (cached.updateTimestamp < Date.now() - 1000 && cached.contentVersion !== contentVersion)) {
                cached.updateTimestamp = Date.now();
                cached.cellLanguage = currentLanguageId;
                cached.contentVersion = contentVersion;
                const kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(doc);
                if (kernel) {
                    const supportedLangs = [...kernel.supportedLanguages, 'markdown'];
                    cached.guess = await this._languageDetectionService.detectLanguage(cell.uri, supportedLangs);
                }
            }
            const items = [];
            if (cached.guess && currentLanguageId !== cached.guess) {
                const detectedName = this._languageService.getLanguageName(cached.guess) || cached.guess;
                let tooltip = (0, nls_1.localize)('notebook.cell.status.autoDetectLanguage', "Accept Detected Language: {0}", detectedName);
                const keybinding = this._keybindingService.lookupKeybinding(notebookBrowser_1.DETECT_CELL_LANGUAGE);
                const label = keybinding?.getLabel();
                if (label) {
                    tooltip += ` (${label})`;
                }
                items.push({
                    text: '$(lightbulb-autofix)',
                    command: notebookBrowser_1.DETECT_CELL_LANGUAGE,
                    tooltip,
                    alignment: 2 /* CellStatusbarAlignment.Right */,
                    priority: -Number.MAX_SAFE_INTEGER + 1
                });
            }
            return { items };
        }
    };
    CellStatusBarLanguageDetectionProvider = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, notebookKernelService_1.INotebookKernelService),
        __param(2, language_1.ILanguageService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(5, keybinding_1.IKeybindingService)
    ], CellStatusBarLanguageDetectionProvider);
    let BuiltinCellStatusBarProviders = class BuiltinCellStatusBarProviders extends lifecycle_1.Disposable {
        constructor(instantiationService, notebookCellStatusBarService) {
            super();
            const builtinProviders = [
                CellStatusBarLanguagePickerProvider,
                CellStatusBarLanguageDetectionProvider,
            ];
            builtinProviders.forEach(p => {
                this._register(notebookCellStatusBarService.registerCellStatusBarItemProvider(instantiationService.createInstance(p)));
            });
        }
    };
    BuiltinCellStatusBarProviders = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notebookCellStatusBarService_1.INotebookCellStatusBarService)
    ], BuiltinCellStatusBarProviders);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(BuiltinCellStatusBarProviders, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzQmFyUHJvdmlkZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvY2VsbFN0YXR1c0Jhci9zdGF0dXNCYXJQcm92aWRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFxQmhHLElBQU0sbUNBQW1DLEdBQXpDLE1BQU0sbUNBQW1DO1FBSXhDLFlBQ21CLGdCQUFtRCxFQUNuRCxnQkFBbUQ7WUFEbEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNsQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBSjdELGFBQVEsR0FBRyxHQUFHLENBQUM7UUFLcEIsQ0FBQztRQUVMLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxHQUFRLEVBQUUsS0FBYSxFQUFFLE1BQXlCO1lBQ2pGLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1RCxNQUFNLElBQUksR0FBRyxHQUFHLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sY0FBYyxHQUFpQyxFQUFFLENBQUM7WUFDeEQsSUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNwQyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUsseUJBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdkMsZUFBZSxHQUFHLFVBQVUsQ0FBQztZQUM5QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLDJCQUEyQixDQUFDLElBQUks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