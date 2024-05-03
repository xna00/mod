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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/languages", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/externalUriOpener/common/configuration", "vs/workbench/contrib/url/common/urlGlob", "vs/workbench/services/preferences/common/preferences"], function (require, exports, arrays_1, iterator_1, lifecycle_1, linkedList_1, platform_1, uri_1, languages, nls, configuration_1, instantiation_1, log_1, opener_1, quickInput_1, configuration_2, urlGlob_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalUriOpenerService = exports.IExternalUriOpenerService = void 0;
    exports.IExternalUriOpenerService = (0, instantiation_1.createDecorator)('externalUriOpenerService');
    let ExternalUriOpenerService = class ExternalUriOpenerService extends lifecycle_1.Disposable {
        constructor(openerService, configurationService, logService, preferencesService, quickInputService) {
            super();
            this.configurationService = configurationService;
            this.logService = logService;
            this.preferencesService = preferencesService;
            this.quickInputService = quickInputService;
            this._providers = new linkedList_1.LinkedList();
            this._register(openerService.registerExternalOpener(this));
        }
        registerExternalOpenerProvider(provider) {
            const remove = this._providers.push(provider);
            return { dispose: remove };
        }
        async getOpeners(targetUri, allowOptional, ctx, token) {
            const allOpeners = await this.getAllOpenersForUri(targetUri);
            if (allOpeners.size === 0) {
                return [];
            }
            // First see if we have a preferredOpener
            if (ctx.preferredOpenerId) {
                if (ctx.preferredOpenerId === configuration_2.defaultExternalUriOpenerId) {
                    return [];
                }
                const preferredOpener = allOpeners.get(ctx.preferredOpenerId);
                if (preferredOpener) {
                    // Skip the `canOpen` check here since the opener was specifically requested.
                    return [preferredOpener];
                }
            }
            // Check to see if we have a configured opener
            const configuredOpener = this.getConfiguredOpenerForUri(allOpeners, targetUri);
            if (configuredOpener) {
                // Skip the `canOpen` check here since the opener was specifically requested.
                return configuredOpener === configuration_2.defaultExternalUriOpenerId ? [] : [configuredOpener];
            }
            // Then check to see if there is a valid opener
            const validOpeners = [];
            await Promise.all(Array.from(allOpeners.values()).map(async (opener) => {
                let priority;
                try {
                    priority = await opener.canOpen(ctx.sourceUri, token);
                }
                catch (e) {
                    this.logService.error(e);
                    return;
                }
                switch (priority) {
                    case languages.ExternalUriOpenerPriority.Option:
                    case languages.ExternalUriOpenerPriority.Default:
                    case languages.ExternalUriOpenerPriority.Preferred:
                        validOpeners.push({ opener, priority });
                        break;
                }
            }));
            if (validOpeners.length === 0) {
                return [];
            }
            // See if we have a preferred opener first
            const preferred = (0, arrays_1.firstOrDefault)(validOpeners.filter(x => x.priority === languages.ExternalUriOpenerPriority.Preferred));
            if (preferred) {
                return [preferred.opener];
            }
            // See if we only have optional openers, use the default opener
            if (!allowOptional && validOpeners.every(x => x.priority === languages.ExternalUriOpenerPriority.Option)) {
                return [];
            }
            return validOpeners.map(value => value.opener);
        }
        async openExternal(href, ctx, token) {
            const targetUri = typeof href === 'string' ? uri_1.URI.parse(href) : href;
            const allOpeners = await this.getOpeners(targetUri, false, ctx, token);
            if (allOpeners.length === 0) {
                return false;
            }
            else if (allOpeners.length === 1) {
                return allOpeners[0].openExternalUri(targetUri, ctx, token);
            }
            // Otherwise prompt
            return this.showOpenerPrompt(allOpeners, targetUri, ctx, token);
        }
        async getOpener(targetUri, ctx, token) {
            const allOpeners = await this.getOpeners(targetUri, true, ctx, token);
            if (allOpeners.length >= 1) {
                return allOpeners[0];
            }
            return undefined;
        }
        async getAllOpenersForUri(targetUri) {
            const allOpeners = new Map();
            await Promise.all(iterator_1.Iterable.map(this._providers, async (provider) => {
                for await (const opener of provider.getOpeners(targetUri)) {
                    allOpeners.set(opener.id, opener);
                }
            }));
            return allOpeners;
        }
        getConfiguredOpenerForUri(openers, targetUri) {
            const config = this.configurationService.getValue(configuration_2.externalUriOpenersSettingId) || {};
            for (const [uriGlob, id] of Object.entries(config)) {
                if ((0, urlGlob_1.testUrlMatchesGlob)(targetUri, uriGlob)) {
                    if (id === configuration_2.defaultExternalUriOpenerId) {
                        return 'default';
                    }
                    const entry = openers.get(id);
                    if (entry) {
                        return entry;
                    }
                }
            }
            return undefined;
        }
        async showOpenerPrompt(openers, targetUri, ctx, token) {
            const items = openers.map((opener) => {
                return {
                    label: opener.label,
                    opener: opener
                };
            });
            items.push({
                label: platform_1.isWeb
                    ? nls.localize('selectOpenerDefaultLabel.web', 'Open in new browser window')
                    : nls.localize('selectOpenerDefaultLabel', 'Open in default browser'),
                opener: undefined
            }, { type: 'separator' }, {
                label: nls.localize('selectOpenerConfigureTitle', "Configure default opener..."),
                opener: 'configureDefault'
            });
            const picked = await this.quickInputService.pick(items, {
                placeHolder: nls.localize('selectOpenerPlaceHolder', "How would you like to open: {0}", targetUri.toString())
            });
            if (!picked) {
                // Still cancel the default opener here since we prompted the user
                return true;
            }
            if (typeof picked.opener === 'undefined') {
                return false; // Fallback to default opener
            }
            else if (picked.opener === 'configureDefault') {
                await this.preferencesService.openUserSettings({
                    jsonEditor: true,
                    revealSetting: { key: configuration_2.externalUriOpenersSettingId, edit: true }
                });
                return true;
            }
            else {
                return picked.opener.openExternalUri(targetUri, ctx, token);
            }
        }
    };
    exports.ExternalUriOpenerService = ExternalUriOpenerService;
    exports.ExternalUriOpenerService = ExternalUriOpenerService = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService),
        __param(3, preferences_1.IPreferencesService),
        __param(4, quickInput_1.IQuickInputService)
    ], ExternalUriOpenerService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxVcmlPcGVuZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlcm5hbFVyaU9wZW5lci9jb21tb24vZXh0ZXJuYWxVcmlPcGVuZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFCbkYsUUFBQSx5QkFBeUIsR0FBRyxJQUFBLCtCQUFlLEVBQTRCLDBCQUEwQixDQUFDLENBQUM7SUE4QnpHLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7UUFNdkQsWUFDaUIsYUFBNkIsRUFDdEIsb0JBQTRELEVBQ3RFLFVBQXdDLEVBQ2hDLGtCQUF3RCxFQUN6RCxpQkFBc0Q7WUFFMUUsS0FBSyxFQUFFLENBQUM7WUFMZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2YsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN4QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBUDFELGVBQVUsR0FBRyxJQUFJLHVCQUFVLEVBQTJCLENBQUM7WUFVdkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRUQsOEJBQThCLENBQUMsUUFBaUM7WUFDL0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFjLEVBQUUsYUFBc0IsRUFBRSxHQUFtRCxFQUFFLEtBQXdCO1lB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