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
define(["require", "exports", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/storage/common/storage", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/extensions", "vs/platform/notification/common/notification", "vs/workbench/services/host/browser/host", "vs/platform/instantiation/common/instantiation", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/commands/common/commands", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/workbench/services/issue/common/issue", "vs/workbench/services/environment/common/environmentService", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/extensionManagement/common/extensionManagement"], function (require, exports, nls_1, extensionManagement_1, storage_1, extensions_1, extensions_2, notification_1, host_1, instantiation_1, actions_1, contextkey_1, dialogs_1, platform_1, contributions_1, commands_1, log_1, productService_1, issue_1, environmentService_1, extensionManagementUtil_1, actionCommonCategories_1, extensionManagement_2) {
    "use strict";
    var ExtensionBisectService_1, ExtensionBisectUi_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtensionBisectService = void 0;
    // --- bisect service
    exports.IExtensionBisectService = (0, instantiation_1.createDecorator)('IExtensionBisectService');
    class BisectState {
        static fromJSON(raw) {
            if (!raw) {
                return undefined;
            }
            try {
                const data = JSON.parse(raw);
                return new BisectState(data.extensions, data.low, data.high, data.mid);
            }
            catch {
                return undefined;
            }
        }
        constructor(extensions, low, high, mid = ((low + high) / 2) | 0) {
            this.extensions = extensions;
            this.low = low;
            this.high = high;
            this.mid = mid;
        }
    }
    let ExtensionBisectService = class ExtensionBisectService {
        static { ExtensionBisectService_1 = this; }
        static { this._storageKey = 'extensionBisectState'; }
        constructor(logService, _storageService, _envService) {
            this._storageService = _storageService;
            this._envService = _envService;
            this._disabled = new Map();
            const raw = _storageService.get(ExtensionBisectService_1._storageKey, -1 /* StorageScope.APPLICATION */);
            this._state = BisectState.fromJSON(raw);
            if (this._state) {
                const { mid, high } = this._state;
                for (let i = 0; i < this._state.extensions.length; i++) {
                    const isDisabled = i >= mid && i < high;
                    this._disabled.set(this._state.extensions[i], isDisabled);
                }
                logService.warn('extension BISECT active', [...this._disabled]);
            }
        }
        get isActive() {
            return !!this._state;
        }
        get disabledCount() {
            return this._state ? this._state.high - this._state.mid : -1;
        }
        isDisabledByBisect(extension) {
            if (!this._state) {
                // bisect isn't active
                return false;
            }
            if ((0, extensions_1.isResolverExtension)(extension.manifest, this._envService.remoteAuthority)) {
                // the current remote resolver extension cannot be disabled
                return false;
            }
            if (this._isEnabledInEnv(extension)) {
                // Extension enabled in env cannot be disabled
                return false;
            }
            const disabled = this._disabled.get(extension.identifier.id);
            return disabled ?? false;
        }
        _isEnabledInEnv(extension) {
            return Array.isArray(this._envService.enableExtensions) && this._envService.enableExtensions.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, extension.identifier));
        }
        async start(extensions) {
            if (this._state) {
                throw new Error('invalid state');
            }
            const extensionIds = extensions.map(ext => ext.identifier.id);
            const newState = new BisectState(extensionIds, 0, extensionIds.length, 0);
            this._storageService.store(ExtensionBisectService_1._storageKey, JSON.stringify(newState), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            await this._storageService.flush();
        }
        async next(seeingBad) {
            if (!this._state) {
                throw new Error('invalid state');
            }
            // check if bad when all extensions are disabled
            if (seeingBad && this._state.mid === 0 && this._state.high === this._state.extensions.length) {
                return { bad: true, id: '' };
            }
            // check if there is only one left
            if (this._state.low === this._state.high - 1) {
                await this.reset();
                return { id: this._state.extensions[this._state.low], bad: seeingBad };
            }
            // the second half is disabled so if there is still bad it must be
            // in the first half
            const nextState = new BisectState(this._state.extensions, seeingBad ? this._state.low : this._state.mid, seeingBad ? this._state.mid : this._state.high);
            this._storageService.store(ExtensionBisectService_1._storageKey, JSON.stringify(nextState), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            await this._storageService.flush();
            return undefined;
        }
        async reset() {
            this._storageService.remove(ExtensionBisectService_1._storageKey, -1 /* StorageScope.APPLICATION */);
            await this._storageService.flush();
        }
    };
    ExtensionBisectService = ExtensionBisectService_1 = __decorate([
        __param(0, log_1.ILogService),
        __param(1, storage_1.IStorageService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], ExtensionBisectService);
    (0, extensions_2.registerSingleton)(exports.IExtensionBisectService, ExtensionBisectService, 1 /* InstantiationType.Delayed */);
    // --- bisect UI
    let ExtensionBisectUi = class ExtensionBisectUi {
        static { ExtensionBisectUi_1 = this; }
        static { this.ctxIsBisectActive = new contextkey_1.RawContextKey('isExtensionBisectActive', false); }
        constructor(contextKeyService, _extensionBisectService, _notificationService, _commandService) {
            this._extensionBisectService = _extensionBisectService;
            this._notificationService = _notificationService;
            this._commandService = _commandService;
            if (_extensionBisectService.isActive) {
                ExtensionBisectUi_1.ctxIsBisectActive.bindTo(contextKeyService).set(true);
                this._showBisectPrompt();
            }
        }
        _showBisectPrompt() {
            const goodPrompt = {
                label: (0, nls_1.localize)('I cannot reproduce', "I can't reproduce"),
                run: () => this._commandService.executeCommand('extension.bisect.next', false)
            };
            const badPrompt = {
                label: (0, nls_1.localize)('This is Bad', "I can reproduce"),
                run: () => this._commandService.executeCommand('extension.bisect.next', true)
            };
            const stop = {
                label: 'Stop Bisect',
                run: () => this._commandService.executeCommand('extension.bisect.stop')
            };
            const message = this._extensionBisectService.disabledCount === 1
                ? (0, nls_1.localize)('bisect.singular', "Extension Bisect is active and has disabled 1 extension. Check if you can still reproduce the problem and proceed by selecting from these options.")
                : (0, nls_1.localize)('bisect.plural', "Extension Bisect is active and has disabled {0} extensions. Check if you can still reproduce the problem and proceed by selecting from these options.", this._extensionBisectService.disabledCount);
            this._notificationService.prompt(notification_1.Severity.Info, message, [goodPrompt, badPrompt, stop], { sticky: true, priority: notification_1.NotificationPriority.URGENT });
        }
    };
    ExtensionBisectUi = ExtensionBisectUi_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, exports.IExtensionBisectService),
        __param(2, notification_1.INotificationService),
        __param(3, commands_1.ICommandService)
    ], ExtensionBisectUi);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ExtensionBisectUi, 3 /* LifecyclePhase.Restored */);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'extension.bisect.start',
                title: (0, nls_1.localize2)('title.start', 'Start Extension Bisect'),
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                precondition: ExtensionBisectUi.ctxIsBisectActive.negate(),
                menu: {
                    id: actions_1.MenuId.ViewContainerTitle,
                    when: contextkey_1.ContextKeyExpr.equals('viewContainer', 'workbench.view.extensions'),
                    group: '2_enablement',
                    order: 4
                }
            });
        }
        async run(accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const hostService = accessor.get(host_1.IHostService);
            const extensionManagement = accessor.get(extensionManagement_1.IExtensionManagementService);
            const extensionEnablementService = accessor.get(extensionManagement_2.IWorkbenchExtensionEnablementService);
            const extensionsBisect = accessor.get(exports.IExtensionBisectService);
            const extensions = (await extensionManagement.getInstalled(1 /* ExtensionType.User */)).filter(ext => extensionEnablementService.isEnabled(ext));
            const res = await dialogService.confirm({
                message: (0, nls_1.localize)('msg.start', "Extension Bisect"),
                detail: (0, nls_1.localize)('detail.start', "Extension Bisect will use binary search to find an extension that causes a problem. During the process the window reloads repeatedly (~{0} times). Each time you must confirm if you are still seeing problems.", 2 + Math.log2(extensions.length) | 0),
                primaryButton: (0, nls_1.localize)({ key: 'msg2', comment: ['&& denotes a mnemonic'] }, "&&Start Extension Bisect")
            });
            if (res.confirmed) {
                await extensionsBisect.start(extensions);
                hostService.reload();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'extension.bisect.next',
                title: (0, nls_1.localize2)('title.isBad', 'Continue Extension Bisect'),
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                precondition: ExtensionBisectUi.ctxIsBisectActive
            });
        }
        async run(accessor, seeingBad) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const hostService = accessor.get(host_1.IHostService);
            const bisectService = accessor.get(exports.IExtensionBisectService);
            const productService = accessor.get(productService_1.IProductService);
            const extensionEnablementService = accessor.get(extensionManagement_1.IGlobalExtensionEnablementService);
            const issueService = accessor.get(issue_1.IWorkbenchIssueService);
            if (!bisectService.isActive) {
                return;
            }
            if (seeingBad === undefined) {
                const goodBadStopCancel = await this._checkForBad(dialogService, bisectService);
                if (goodBadStopCancel === null) {
                    return;
                }
                seeingBad = goodBadStopCancel;
            }
            if (seeingBad === undefined) {
                await bisectService.reset();
                hostService.reload();
                return;
            }
            const done = await bisectService.next(seeingBad);
            if (!done) {
                hostService.reload();
                return;
            }
            if (done.bad) {
                // DONE but nothing found
                await dialogService.info((0, nls_1.localize)('done.msg', "Extension Bisect"), (0, nls_1.localize)('done.detail2', "Extension Bisect is done but no extension has been identified. This might be a problem with {0}.", productService.nameShort));
            }
            else {
                // DONE and identified extension
                const res = await dialogService.confirm({
                    type: notification_1.Severity.Info,
                    message: (0, nls_1.localize)('done.msg', "Extension Bisect"),
                    primaryButton: (0, nls_1.localize)({ key: 'report', comment: ['&& denotes a mnemonic'] }, "&&Report Issue & Continue"),
                    cancelButton: (0, nls_1.localize)('continue', "Continue"),
                    detail: (0, nls_1.localize)('done.detail', "Extension Bisect is done and has identified {0} as the extension causing the problem.", done.id),
                    checkbox: { label: (0, nls_1.localize)('done.disbale', "Keep this extension disabled"), checked: true }
                });
                if (res.checkboxChecked) {
                    await extensionEnablementService.disableExtension({ id: done.id }, undefined);
                }
                if (res.confirmed) {
                    await issueService.openReporter({ extensionId: done.id });
                }
            }
            await bisectService.reset();
            hostService.reload();
        }
        async _checkForBad(dialogService, bisectService) {
            const { result } = await dialogService.prompt({
                type: notification_1.Severity.Info,
                message: (0, nls_1.localize)('msg.next', "Extension Bisect"),
                detail: (0, nls_1.localize)('bisect', "Extension Bisect is active and has disabled {0} extensions. Check if you can still reproduce the problem and proceed by selecting from these options.", bisectService.disabledCount),
                buttons: [
                    {
                        label: (0, nls_1.localize)({ key: 'next.good', comment: ['&& denotes a mnemonic'] }, "I ca&&n't reproduce"),
                        run: () => false // good now
                    },
                    {
                        label: (0, nls_1.localize)({ key: 'next.bad', comment: ['&& denotes a mnemonic'] }, "I can &&reproduce"),
                        run: () => true // bad
                    },
                    {
                        label: (0, nls_1.localize)({ key: 'next.stop', comment: ['&& denotes a mnemonic'] }, "&&Stop Bisect"),
                        run: () => undefined // stop
                    }
                ],
                cancelButton: {
                    label: (0, nls_1.localize)({ key: 'next.cancel', comment: ['&& denotes a mnemonic'] }, "&&Cancel Bisect"),
                    run: () => null // cancel
                }
            });
            return result;
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'extension.bisect.stop',
                title: (0, nls_1.localize2)('title.stop', 'Stop Extension Bisect'),
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                precondition: ExtensionBisectUi.ctxIsBisectActive
            });
        }
        async run(accessor) {
            const extensionsBisect = accessor.get(exports.IExtensionBisectService);
            const hostService = accessor.get(host_1.IHostService);
            await extensionsBisect.reset();
            hostService.reload();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uQmlzZWN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9uTWFuYWdlbWVudC9icm93c2VyL2V4dGVuc2lvbkJpc2VjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRyxxQkFBcUI7SUFFUixRQUFBLHVCQUF1QixHQUFHLElBQUEsK0JBQWUsRUFBMEIseUJBQXlCLENBQUMsQ0FBQztJQWMzRyxNQUFNLFdBQVc7UUFFaEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUF1QjtZQUN0QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ1YsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELElBQUksQ0FBQztnQkFFSixNQUFNLElBQUksR0FBUSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQyxPQUFPLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4RSxDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNSLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO1FBRUQsWUFDVSxVQUFvQixFQUNwQixHQUFXLEVBQ1gsSUFBWSxFQUNaLE1BQWMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBSHBDLGVBQVUsR0FBVixVQUFVLENBQVU7WUFDcEIsUUFBRyxHQUFILEdBQUcsQ0FBUTtZQUNYLFNBQUksR0FBSixJQUFJLENBQVE7WUFDWixRQUFHLEdBQUgsR0FBRyxDQUFpQztRQUMxQyxDQUFDO0tBQ0w7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