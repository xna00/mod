/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/uri", "vs/base/common/performance", "vs/base/common/uriIpc", "vs/platform/contextkey/common/contextkey", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/workbench/services/extensions/common/extensionsUtil", "vs/base/common/network"], function (require, exports, path_1, platform, process_1, uri_1, performance, uriIpc_1, contextkey_1, extensionsScannerService_1, extensionsUtil_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteExtensionsScannerChannel = exports.RemoteExtensionsScannerService = void 0;
    class RemoteExtensionsScannerService {
        constructor(_extensionManagementCLI, environmentService, _userDataProfilesService, _extensionsScannerService, _logService, _extensionGalleryService, _languagePackService) {
            this._extensionManagementCLI = _extensionManagementCLI;
            this._userDataProfilesService = _userDataProfilesService;
            this._extensionsScannerService = _extensionsScannerService;
            this._logService = _logService;
            this._extensionGalleryService = _extensionGalleryService;
            this._languagePackService = _languagePackService;
            this._whenBuiltinExtensionsReady = Promise.resolve();
            this._whenExtensionsReady = Promise.resolve();
            const builtinExtensionsToInstall = environmentService.args['install-builtin-extension'];
            if (builtinExtensionsToInstall) {
                _logService.trace('Installing builtin extensions passed via args...');
                const installOptions = { isMachineScoped: !!environmentService.args['do-not-sync'], installPreReleaseVersion: !!environmentService.args['pre-release'] };
                performance.mark('code/server/willInstallBuiltinExtensions');
                this._whenExtensionsReady = this._whenBuiltinExtensionsReady = _extensionManagementCLI.installExtensions([], this._asExtensionIdOrVSIX(builtinExtensionsToInstall), installOptions, !!environmentService.args['force'])
                    .then(() => {
                    performance.mark('code/server/didInstallBuiltinExtensions');
                    _logService.trace('Finished installing builtin extensions');
                }, error => {
                    _logService.error(error);
                });
            }
            const extensionsToInstall = environmentService.args['install-extension'];
            if (extensionsToInstall) {
                _logService.trace('Installing extensions passed via args...');
                this._whenExtensionsReady = this._whenBuiltinExtensionsReady
                    .then(() => _extensionManagementCLI.installExtensions(this._asExtensionIdOrVSIX(extensionsToInstall), [], {
                    isMachineScoped: !!environmentService.args['do-not-sync'],
                    installPreReleaseVersion: !!environmentService.args['pre-release'],
                    isApplicationScoped: true // extensions installed during server startup are available to all profiles
                }, !!environmentService.args['force']))
                    .then(() => {
                    _logService.trace('Finished installing extensions');
                }, error => {
                    _logService.error(error);
                });
            }
        }
        _asExtensionIdOrVSIX(inputs) {
            return inputs.map(input => /\.vsix$/i.test(input) ? uri_1.URI.file((0, path_1.isAbsolute)(input) ? input : (0, path_1.join)((0, process_1.cwd)(), input)) : input);
        }
        whenExtensionsReady() {
            return this._whenExtensionsReady;
        }
        async scanExtensions(language, profileLocation, extensionDevelopmentLocations, languagePackId) {
            performance.mark('code/server/willScanExtensions');
            this._logService.trace(`Scanning extensions using UI language: ${language}`);
            await this._whenBuiltinExtensionsReady;
            const extensionDevelopmentPaths = extensionDevelopmentLocations ? extensionDevelopmentLocations.filter(url => url.scheme === network_1.Schemas.file).map(url => url.fsPath) : undefined;
            profileLocation = profileLocation ?? this._userDataProfilesService.defaultProfile.extensionsResource;
            const extensions = await this._scanExtensions(profileLocation, language ?? platform.language, extensionDevelopmentPaths, languagePackId);
            this._logService.trace('Scanned Extensions', extensions);
            this._massageWhenConditions(extensions);
            performance.mark('code/server/didScanExtensions');
            return extensions;
        }
        async scanSingleExtension(extensionLocation, isBuiltin, language) {
            await this._whenBuiltinExtensionsReady;
            const extensionPath = extensionLocation.scheme === network_1.Schemas.file ? extensionLocation.fsPath : null;
            if (!extensionPath) {
                return null;
            }
            const extension = await this._scanSingleExtension(extensionPath, isBuiltin, language ?? platform.language);
            if (!extension) {
                return null;
            }
            this._massageWhenConditions([extension]);
            return extension;
        }
        async _scanExtensions(profileLocation, language, extensionDevelopmentPath, languagePackId) {
            await this._ensureLanguagePackIsInstalled(language, languagePackId);
            const [builtinExtensions, installedExtensions, developedExtensions] = await Promise.all([
                this._scanBuiltinExtensions(language),
                this._scanInstalledExtensions(profileLocation, language),
                this._scanDevelopedExtensions(language, extensionDevelopmentPath)
            ]);
            return (0, extensionsUtil_1.dedupExtensions)(builtinExtensions, installedExtensions, developedExtensions, this._logService);
        }
        async _scanDevelopedExtensions(language, extensionDevelopmentPaths) {
            if (extensionDevelopmentPaths) {
                return (await Promise.all(extensionDevelopmentPaths.map(extensionDevelopmentPath => this._extensionsScannerService.scanOneOrMultipleExtensions(uri_1.URI.file((0, path_1.resolve)(extensionDevelopmentPath)), 1 /* ExtensionType.User */, { language }))))
                    .flat()
                    .map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, true));
            }
            return [];
        }
        async _scanBuiltinExtensions(language) {
            const scannedExtensions = await this._extensionsScannerService.scanSystemExtensions({ language, useCache: true });
            return scannedExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, false));
        }
        async _scanInstalledExtensions(profileLocation, language) {
            const scannedExtensions = await this._extensionsScannerService.scanUserExtensions({ profileLocation, language, useCache: true });
            return scannedExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, false));
        }
        async _scanSingleExtension(extensionPath, isBuiltin, language) {
            const extensionLocation = uri_1.URI.file((0, path_1.resolve)(extensionPath));
            const type = isBuiltin ? 0 /* ExtensionType.System */ : 1 /* ExtensionType.User */;
            const scannedExtension = await this._extensionsScannerService.scanExistingExtension(extensionLocation, type, { language });
            return scannedExtension ? (0, extensionsScannerService_1.toExtensionDescription)(scannedExtension, false) : null;
        }
        async _ensureLanguagePackIsInstalled(language, languagePackId) {
            if (
            // No need to install language packs for the default language
            language === platform.LANGUAGE_DEFAULT ||
                // The extension gallery service needs to be available
                !this._extensionGalleryService.isEnabled()) {
                return;
            }
            try {
                const installed = await this._languagePackService.getInstalledLanguages();
                if (installed.find(p => p.id === language)) {
                    this._logService.trace(`Language Pack ${language} is already installed. Skipping language pack installation.`);
                    return;
                }
            }
            catch (err) {
                // We tried to see what is installed but failed. We can try installing anyway.
                this._logService.error(err);
            }
            if (!languagePackId) {
                this._logService.trace(`No language pack id provided for language ${language}. Skipping language pack installation.`);
                return;
            }
            this._logService.trace(`Language Pack ${languagePackId} for language ${language} is not installed. It will be installed now.`);
            try {
                await this._extensionManagementCLI.installExtensions([languagePackId], [], { isMachineScoped: true }, true);
            }
            catch (err) {
                // We tried to install the language pack but failed. We can continue without it thus using the default language.
                this._logService.error(err);
            }
        }
        _massageWhenConditions(extensions) {
            // Massage "when" conditions which mention `resourceScheme`
            const _mapResourceSchemeValue = (value, isRegex) => {
                // console.log(`_mapResourceSchemeValue: ${value}, ${isRegex}`);
                return value.replace(/file/g, 'vscode-remote');
            };
            const _mapResourceRegExpValue = (value) => {
                let flags = '';
                flags += value.global ? 'g' : '';
                flags += value.ignoreCase ? 'i' : '';
                flags += value.multiline ? 'm' : '';
                return new RegExp(_mapResourceSchemeValue(value.source, true), flags);
            };
            const _exprKeyMapper = new class {
                mapDefined(key) {
                    return contextkey_1.ContextKeyDefinedExpr.create(key);
                }
                mapNot(key) {
                    return contextkey_1.ContextKeyNotExpr.create(key);
                }
                mapEquals(key, value) {
                    if (key === 'resourceScheme' && typeof value === 'string') {
                        return contextkey_1.ContextKeyEqualsExpr.create(key, _mapResourceSchemeValue(value, false));
                    }
                    else {
                        return contextkey_1.ContextKeyEqualsExpr.create(key, value);
                    }
                }
                mapNotEquals(key, value) {
                    if (key === 'resourceScheme' && typeof value === 'string') {
                        return contextkey_1.ContextKeyNotEqualsExpr.create(key, _mapResourceSchemeValue(value, false));
                    }
                    else {
                        return contextkey_1.ContextKeyNotEqualsExpr.create(key, value);
                    }
                }
                mapGreater(key, value) {
                    return contextkey_1.ContextKeyGreaterExpr.create(key, value);
                }
                mapGreaterEquals(key, value) {
                    return contextkey_1.ContextKeyGreaterEqualsExpr.create(key, value);
                }
                mapSmaller(key, value) {
                    return contextkey_1.ContextKeySmallerExpr.create(key, value);
                }
                mapSmallerEquals(key, value) {
                    return contextkey_1.ContextKeySmallerEqualsExpr.create(key, value);
                }
                mapRegex(key, regexp) {
                    if (key === 'resourceScheme' && regexp) {
                        return contextkey_1.ContextKeyRegexExpr.create(key, _mapResourceRegExpValue(regexp));
                    }
                    else {
                        return contextkey_1.ContextKeyRegexExpr.create(key, regexp);
                    }
                }
                mapIn(key, valueKey) {
                    return contextkey_1.ContextKeyInExpr.create(key, valueKey);
                }
                mapNotIn(key, valueKey) {
                    return contextkey_1.ContextKeyNotInExpr.create(key, valueKey);
                }
            };
            const _massageWhenUser = (element) => {
                if (!element || !element.when || !/resourceScheme/.test(element.when)) {
                    return;
                }
                const expr = contextkey_1.ContextKeyExpr.deserialize(element.when);
                if (!expr) {
                    return;
                }
                const massaged = expr.map(_exprKeyMapper);
                element.when = massaged.serialize();
            };
            const _massageWhenUserArr = (elements) => {
                if (Array.isArray(elements)) {
                    for (const element of elements) {
                        _massageWhenUser(element);
                    }
                }
                else {
                    _massageWhenUser(elements);
                }
            };
            const _massageLocWhenUser = (target) => {
                for (const loc in target) {
                    _massageWhenUserArr(target[loc]);
                }
            };
            extensions.forEach((extension) => {
                if (extension.contributes) {
                    if (extension.contributes.menus) {
                        _massageLocWhenUser(extension.contributes.menus);
                    }
                    if (extension.contributes.keybindings) {
                        _massageWhenUserArr(extension.contributes.keybindings);
                    }
                    if (extension.contributes.views) {
                        _massageLocWhenUser(extension.contributes.views);
                    }
                }
            });
        }
    }
    exports.RemoteExtensionsScannerService = RemoteExtensionsScannerService;
    class RemoteExtensionsScannerChannel {
        constructor(service, getUriTransformer) {
            this.service = service;
            this.getUriTransformer = getUriTransformer;
        }
        listen(context, event) {
            throw new Error('Invalid listen');
        }
        async call(context, command, args) {
            const uriTransformer = this.getUriTransformer(context);
            switch (command) {
                case 'whenExtensionsReady': return this.service.whenExtensionsReady();
                case 'scanExtensions': {
                    const language = args[0];
                    const profileLocation = args[1] ? uri_1.URI.revive(uriTransformer.transformIncoming(args[1])) : undefined;
                    const extensionDevelopmentPath = Array.isArray(args[2]) ? args[2].map(u => uri_1.URI.revive(uriTransformer.transformIncoming(u))) : undefined;
                    const languagePackId = args[3];
                    const extensions = await this.service.scanExtensions(language, profileLocation, extensionDevelopmentPath, languagePackId);
                    return extensions.map(extension => (0, uriIpc_1.transformOutgoingURIs)(extension, uriTransformer));
                }
                case 'scanSingleExtension': {
                    const extension = await this.service.scanSingleExtension(uri_1.URI.revive(uriTransformer.transformIncoming(args[0])), args[1], args[2]);
                    return extension ? (0, uriIpc_1.transformOutgoingURIs)(extension, uriTransformer) : null;
                }
            }
            throw new Error('Invalid call');
        }
    }
    exports.RemoteExtensionsScannerChannel = RemoteExtensionsScannerChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uc1NjYW5uZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3NlcnZlci9ub2RlL3JlbW90ZUV4dGVuc2lvbnNTY2FubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXVCaEcsTUFBYSw4QkFBOEI7UUFPMUMsWUFDa0IsdUJBQStDLEVBQ2hFLGtCQUE2QyxFQUM1Qix3QkFBa0QsRUFDbEQseUJBQW9ELEVBQ3BELFdBQXdCLEVBQ3hCLHdCQUFrRCxFQUNsRCxvQkFBMEM7WUFOMUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF3QjtZQUUvQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ2xELDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBMkI7WUFDcEQsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDeEIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUNsRCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBVjNDLGdDQUEyQixHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoRCx5QkFBb0IsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFXekQsTUFBTSwwQkFBMEIsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUN4RixJQUFJLDBCQUEwQixFQUFFLENBQUM7Z0JBQ2hDLFdBQVcsQ0FBQyxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztnQkFDdEUsTUFBTSxjQUFjLEdBQW1CLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO2dCQUN6SyxXQUFX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