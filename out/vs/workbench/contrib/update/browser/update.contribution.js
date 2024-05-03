/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/workbench/contrib/update/browser/update", "vs/platform/product/common/product", "vs/platform/update/common/update", "vs/platform/instantiation/common/instantiation", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/base/common/labels", "vs/workbench/contrib/update/common/update", "vs/platform/contextkey/common/contextkeys", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/base/common/uri", "vs/platform/contextkey/common/contextkey", "vs/platform/update/common/update.config.contribution"], function (require, exports, nls_1, platform_1, contributions_1, actionCommonCategories_1, actions_1, update_1, product_1, update_2, instantiation_1, platform_2, dialogs_1, labels_1, update_3, contextkeys_1, opener_1, productService_1, uri_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CheckForUpdateAction = exports.ShowCurrentReleaseNotesFromCurrentFileAction = exports.ShowCurrentReleaseNotesAction = void 0;
    const workbench = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbench.registerWorkbenchContribution(update_1.ProductContribution, 3 /* LifecyclePhase.Restored */);
    workbench.registerWorkbenchContribution(update_1.UpdateContribution, 3 /* LifecyclePhase.Restored */);
    workbench.registerWorkbenchContribution(update_1.SwitchProductQualityContribution, 3 /* LifecyclePhase.Restored */);
    // Release notes
    class ShowCurrentReleaseNotesAction extends actions_1.Action2 {
        constructor() {
            super({
                id: update_3.ShowCurrentReleaseNotesActionId,
                title: {
                    ...(0, nls_1.localize2)('showReleaseNotes', "Show Release Notes"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mshowReleaseNotes', comment: ['&& denotes a mnemonic'] }, "Show &&Release Notes"),
                },
                category: { value: product_1.default.nameShort, original: product_1.default.nameShort },
                f1: true,
                precondition: update_1.RELEASE_NOTES_URL,
                menu: [{
                        id: actions_1.MenuId.MenubarHelpMenu,
                        group: '1_welcome',
                        order: 5,
                        when: update_1.RELEASE_NOTES_URL,
                    }]
            });
        }
        async run(accessor) {
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            try {
                await (0, update_1.showReleaseNotesInEditor)(instantiationService, productService.version, false);
            }
            catch (err) {
                if (productService.releaseNotesUrl) {
                    await openerService.open(uri_1.URI.parse(productService.releaseNotesUrl));
                }
                else {
                    throw new Error((0, nls_1.localize)('update.noReleaseNotesOnline', "This version of {0} does not have release notes online", productService.nameLong));
                }
            }
        }
    }
    exports.ShowCurrentReleaseNotesAction = ShowCurrentReleaseNotesAction;
    class ShowCurrentReleaseNotesFromCurrentFileAction extends actions_1.Action2 {
        constructor() {
            super({
                id: update_3.ShowCurrentReleaseNotesFromCurrentFileActionId,
                title: {
                    ...(0, nls_1.localize2)('showReleaseNotesCurrentFile', "Open Current File as Release Notes"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mshowReleaseNotes', comment: ['&& denotes a mnemonic'] }, "Show &&Release Notes"),
                },
                category: (0, nls_1.localize2)('developerCategory', "Developer"),
                f1: true,
                precondition: update_1.RELEASE_NOTES_URL
            });
        }
        async run(accessor) {
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const productService = accessor.get(productService_1.IProductService);
            try {
                await (0, update_1.showReleaseNotesInEditor)(instantiationService, productService.version, true);
            }
            catch (err) {
                throw new Error((0, nls_1.localize)('releaseNotesFromFileNone', "Cannot open the current file as Release Notes"));
            }
        }
    }
    exports.ShowCurrentReleaseNotesFromCurrentFileAction = ShowCurrentReleaseNotesFromCurrentFileAction;
    (0, actions_1.registerAction2)(ShowCurrentReleaseNotesAction);
    (0, actions_1.registerAction2)(ShowCurrentReleaseNotesFromCurrentFileAction);
    // Update
    class CheckForUpdateAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'update.checkForUpdate',
                title: (0, nls_1.localize2)('checkForUpdates', 'Check for Updates...'),
                category: { value: product_1.default.nameShort, original: product_1.default.nameShort },
                f1: true,
                precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("idle" /* StateType.Idle */),
            });
        }
        async run(accessor) {
            const updateService = accessor.get(update_2.IUpdateService);
            return updateService.checkForUpdates(true);
        }
    }
    exports.CheckForUpdateAction = CheckForUpdateAction;
    class DownloadUpdateAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'update.downloadUpdate',
                title: (0, nls_1.localize2)('downloadUpdate', 'Download Update'),
                category: { value: product_1.default.nameShort, original: product_1.default.nameShort },
                f1: true,
                precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("available for download" /* StateType.AvailableForDownload */)
            });
        }
        async run(accessor) {
            await accessor.get(update_2.IUpdateService).downloadUpdate();
        }
    }
    class InstallUpdateAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'update.installUpdate',
                title: (0, nls_1.localize2)('installUpdate', 'Install Update'),
                category: { value: product_1.default.nameShort, original: product_1.default.nameShort },
                f1: true,
                precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("downloaded" /* StateType.Downloaded */)
            });
        }
        async run(accessor) {
            await accessor.get(update_2.IUpdateService).applyUpdate();
        }
    }
    class RestartToUpdateAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'update.restartToUpdate',
                title: (0, nls_1.localize2)('restartToUpdate', 'Restart to Update'),
                category: { value: product_1.default.nameShort, original: product_1.default.nameShort },
                f1: true,
                precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("ready" /* StateType.Ready */)
            });
        }
        async run(accessor) {
            await accessor.get(update_2.IUpdateService).quitAndInstall();
        }
    }
    class DownloadAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.download'; }
        constructor() {
            super({
                id: DownloadAction.ID,
                title: (0, nls_1.localize2)('openDownloadPage', "Download {0}", product_1.default.nameLong),
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsWebContext, update_1.DOWNLOAD_URL), // Only show when running in a web browser and a download url is available
                f1: true,
                menu: [{
                        id: actions_1.MenuId.StatusBarWindowIndicatorMenu,
                        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsWebContext, update_1.DOWNLOAD_URL)
                    }]
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.downloadUrl) {
                openerService.open(uri_1.URI.parse(productService.downloadUrl));
            }
        }
    }
    (0, actions_1.registerAction2)(DownloadAction);
    (0, actions_1.registerAction2)(CheckForUpdateAction);
    (0, actions_1.registerAction2)(DownloadUpdateAction);
    (0, actions_1.registerAction2)(InstallUpdateAction);
    (0, actions_1.registerAction2)(RestartToUpdateAction);
    if (platform_2.isWindows) {
        class DeveloperApplyUpdateAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: '_update.applyupdate',
                    title: (0, nls_1.localize2)('applyUpdate', 'Apply Update...'),
                    category: actionCommonCategories_1.Categories.Developer,
                    f1: true,
                    precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("idle" /* StateType.Idle */)
                });
            }
            async run(accessor) {
                const updateService = accessor.get(update_2.IUpdateService);
                const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                const updatePath = await fileDialogService.showOpenDialog({
                    title: (0, nls_1.localize)('pickUpdate', "Apply Update"),
                    filters: [{ name: 'Setup', extensions: ['exe'] }],
                    canSelectFiles: true,
                    openLabel: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'updateButton', comment: ['&& denotes a mnemonic'] }, "&&Update"))
                });
                if (!updatePath || !updatePath[0]) {
                    return;
                }
                await updateService._applySpecificUpdate(updatePath[0].fsPath);
            }
        }
        (0, actions_1.registerAction2)(DeveloperApplyUpdateAction);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXBkYXRlL2Jyb3dzZXIvdXBkYXRlLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLE1BQU0sU0FBUyxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUU5RixTQUFTLENBQUMsNkJBQTZCLENBQUMsNEJBQW1CLGtDQUEwQixDQUFDO0lBQ3RGLFNBQVMsQ0FBQyw2QkFBNkIsQ0FBQywyQkFBa0Isa0NBQTBCLENBQUM7SUFDckYsU0FBUyxDQUFDLDZCQUE2QixDQUFDLHlDQUFnQyxrQ0FBMEIsQ0FBQztJQUVuRyxnQkFBZ0I7SUFFaEIsTUFBYSw2QkFBOEIsU0FBUSxpQkFBTztRQUV6RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsd0NBQStCO2dCQUNuQyxLQUFLLEVBQUU7b0JBQ04sR0FBRyxJQUFBLGVBQVMsRUFBQyxrQkFBa0IsRUFBRSxvQkFBb0IsQ0FBQztvQkFDdEQsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLG1CQUFtQixFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxzQkFBc0IsQ0FBQztpQkFDakg7Z0JBQ0QsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLGlCQUFPLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxpQkFBTyxDQUFDLFNBQVMsRUFBRTtnQkFDbkUsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsWUFBWSxFQUFFLDBCQUFpQjtnQkFDL0IsSUFBSSxFQUFFLENBQUM7d0JBQ04sRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTt3QkFDMUIs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