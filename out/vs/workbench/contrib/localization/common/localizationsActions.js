/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/languagePacks/common/languagePacks", "vs/workbench/services/localization/common/locale", "vs/workbench/contrib/extensions/common/extensions"], function (require, exports, nls_1, quickInput_1, cancellation_1, lifecycle_1, actions_1, languagePacks_1, locale_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClearDisplayLanguageAction = exports.ConfigureDisplayLanguageAction = void 0;
    class ConfigureDisplayLanguageAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.configureLocale'; }
        constructor() {
            super({
                id: ConfigureDisplayLanguageAction.ID,
                title: (0, nls_1.localize2)('configureLocale', "Configure Display Language"),
                menu: {
                    id: actions_1.MenuId.CommandPalette
                },
                metadata: {
                    description: (0, nls_1.localize2)('configureLocaleDescription', "Changes the locale of VS Code based on installed language packs. Common languages include French, Chinese, Spanish, Japanese, German, Korean, and more.")
                }
            });
        }
        async run(accessor) {
            const languagePackService = accessor.get(languagePacks_1.ILanguagePackService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const localeService = accessor.get(locale_1.ILocaleService);
            const extensionWorkbenchService = accessor.get(extensions_1.IExtensionsWorkbenchService);
            const installedLanguages = await languagePackService.getInstalledLanguages();
            const qp = quickInputService.createQuickPick();
            qp.matchOnDescription = true;
            qp.placeholder = (0, nls_1.localize)('chooseLocale', "Select Display Language");
            if (installedLanguages?.length) {
                const items = [{ type: 'separator', label: (0, nls_1.localize)('installed', "Installed") }];
                qp.items = items.concat(this.withMoreInfoButton(installedLanguages));
            }
            const disposables = new lifecycle_1.DisposableStore();
            const source = new cancellation_1.CancellationTokenSource();
            disposables.add(qp.onDispose(() => {
                source.cancel();
                disposables.dispose();
            }));
            const installedSet = new Set(installedLanguages?.map(language => language.id) ?? []);
            languagePackService.getAvailableLanguages().then(availableLanguages => {
                const newLanguages = availableLanguages.filter(l => l.id && !installedSet.has(l.id));
                if (newLanguages.length) {
                    qp.items = [
                        ...qp.items,
                        { type: 'separator', label: (0, nls_1.localize)('available', "Available") },
                        ...this.withMoreInfoButton(newLanguages)
                    ];
                }
                qp.busy = false;
            });
            disposables.add(qp.onDidAccept(async () => {
                const selectedLanguage = qp.activeItems[0];
                if (selectedLanguage) {
                    qp.hide();
                    await localeService.setLocale(selectedLanguage);
                }
            }));
            disposables.add(qp.onDidTriggerItemButton(async (e) => {
                qp.hide();
                if (e.item.extensionId) {
                    await extensionWorkbenchService.open(e.item.extensionId);
                }
            }));
            qp.show();
            qp.busy = true;
        }
        withMoreInfoButton(items) {
            for (const item of items) {
                if (item.extensionId) {
                    item.buttons = [{
                            tooltip: (0, nls_1.localize)('moreInfo', "More Info"),
                            iconClass: 'codicon-info'
                        }];
                }
            }
            return items;
        }
    }
    exports.ConfigureDisplayLanguageAction = ConfigureDisplayLanguageAction;
    class ClearDisplayLanguageAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.clearLocalePreference'; }
        static { this.LABEL = (0, nls_1.localize2)('clearDisplayLanguage', "Clear Display Language Preference"); }
        constructor() {
            super({
                id: ClearDisplayLanguageAction.ID,
                title: ClearDisplayLanguageAction.LABEL,
                menu: {
                    id: actions_1.MenuId.CommandPalette
                }
            });
        }
        async run(accessor) {
            const localeService = accessor.get(locale_1.ILocaleService);
            await localeService.clearLocalePreference();
        }
    }
    exports.ClearDisplayLanguageAction = ClearDisplayLanguageAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxpemF0aW9uc0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvY2FsaXphdGlvbi9jb21tb24vbG9jYWxpemF0aW9uc0FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQWEsOEJBQStCLFNBQVEsaUJBQU87aUJBQ25DLE9BQUUsR0FBRyxrQ0FBa0MsQ0FBQztRQUUvRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsOEJBQThCLENBQUMsRUFBRTtnQkFDckMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLGlCQUFpQixFQUFFLDRCQUE0QixDQUFDO2dCQUNqRSxJQUFJLEVBQUU7b0JBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsY0FBYztpQkFDekI7Z0JBQ0QsUUFBUSxFQUFFO29CQUNULFdBQVcsRUFBRSxJQUFBLGVBQVMsRUFBQyw0QkFBNEIsRUFBRSx5SkFBeUosQ0FBQztpQkFDL007YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUMxQyxNQUFNLG1CQUFtQixHQUF5QixRQUFRLENBQUMsR0FBRyxDQUFDLG9DQUFvQixDQUFDLENBQUM7WUFDckYsTUFBTSxpQkFBaUIsR0FBdUIsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBQy9FLE1BQU0sYUFBYSxHQUFtQixRQUFRLENBQUMsR0FBRyxDQUFDLHVCQUFjLENBQUMsQ0FBQztZQUNuRSxNQUFNLHlCQUF5QixHQUFnQyxRQUFRLENBQUMsR0FBRyxDQUFDLHdDQUEyQixDQUFDLENBQUM7WUFFekcsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLG1CQUFtQixDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFFN0Us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