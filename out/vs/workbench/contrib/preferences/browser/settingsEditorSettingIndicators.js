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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/iconLabel/simpleIconLabel", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/common/languages/language", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/services/configuration/common/configuration", "vs/platform/hover/browser/hover"], function (require, exports, DOM, keyboardEvent_1, simpleIconLabel_1, async_1, lifecycle_1, language_1, nls_1, commands_1, userDataProfile_1, userDataSync_1, preferences_1, configuration_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsTreeIndicatorsLabel = void 0;
    exports.getIndicatorsLabelAriaLabel = getIndicatorsLabelAriaLabel;
    const $ = DOM.$;
    /**
     * Contains a set of the sync-ignored settings
     * to keep the sync ignored indicator and the getIndicatorsLabelAriaLabel() function in sync.
     * SettingsTreeIndicatorsLabel#updateSyncIgnored provides the source of truth.
     */
    let cachedSyncIgnoredSettingsSet = new Set();
    /**
     * Contains a copy of the sync-ignored settings to determine when to update
     * cachedSyncIgnoredSettingsSet.
     */
    let cachedSyncIgnoredSettings = [];
    /**
     * Renders the indicators next to a setting, such as "Also Modified In".
     */
    let SettingsTreeIndicatorsLabel = class SettingsTreeIndicatorsLabel {
        constructor(container, configurationService, hoverService, userDataSyncEnablementService, languageService, userDataProfilesService, commandService) {
            this.configurationService = configurationService;
            this.hoverService = hoverService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.languageService = languageService;
            this.userDataProfilesService = userDataProfilesService;
            this.commandService = commandService;
            this.keybindingListeners = new lifecycle_1.DisposableStore();
            this.focusedIndex = 0;
            this.defaultHoverOptions = {
                trapFocus: true,
                position: {
                    hoverPosition: 2 /* HoverPosition.BELOW */,
                },
                appearance: {
                    showPointer: true,
                    compact: false,
                }
            };
            this.indicatorsContainerElement = DOM.append(container, $('.setting-indicators-container'));
            this.indicatorsContainerElement.style.display = 'inline';
            this.profilesEnabled = this.userDataProfilesService.isEnabled();
            this.workspaceTrustIndicator = this.createWorkspaceTrustIndicator();
            this.scopeOverridesIndicator = this.createScopeOverridesIndicator();
            this.syncIgnoredIndicator = this.createSyncIgnoredIndicator();
            this.defaultOverrideIndicator = this.createDefaultOverrideIndicator();
            this.allIndicators = [this.workspaceTrustIndicator, this.scopeOverridesIndicator, this.syncIgnoredIndicator, this.defaultOverrideIndicator];
        }
        addHoverDisposables(disposables, element, showHover) {
            disposables.clear();
            const scheduler = disposables.add(new async_1.RunOnceScheduler(() => {
                const hover = showHover(false);
                if (hover) {
                    disposables.add(hover);
                }
            }, this.configurationService.getValue('workbench.hover.delay')));
            disposables.add(DOM.addDisposableListener(element, DOM.EventType.MOUSE_OVER, () => {
                if (!scheduler.isScheduled()) {
                    scheduler.schedule();
                }
            }));
            disposables.add(DOM.addDisposableListener(element, DOM.EventType.MOUSE_LEAVE, () => {
                scheduler.cancel();
            }));
            disposables.add(DOM.addDisposableListener(element, DOM.EventType.KEY_DOWN, (e) => {
                const evt = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (evt.equals(10 /* KeyCode.Space */) || evt.equals(3 /* KeyCode.Enter */)) {
                    const hover = showHover(true);
                    if (hover) {
                        disposables.add(hover);
                    }
                    e.preventDefault();
                }
            }));
        }
        createWorkspaceTrustIndicator() {
            const disposables = new lifecycle_1.DisposableStore();
            const workspaceTrustElement = $('span.setting-indicator.setting-item-workspace-trust');
            const workspaceTrustLabel = disposables.add(new simpleIconLabel_1.SimpleIconLabel(workspaceTrustElement));
            workspaceTrustLabel.text = '$(warning) ' + (0, nls_1.localize)('workspaceUntrustedLabel', "Setting value not applied");
            const content = (0, nls_1.localize)('trustLabel', "The setting value can only be applied in a trusted workspace.");
            const showHover = (focus) => {
                return this.hoverService.showHover({
                    ...this.defaultHoverOptions,
                    content,
                    target: workspaceTrustElement,
                    actions: [{
                            label: (0, nls_1.localize)('manageWorkspaceTrust', "Manage Workspace Trust"),
                            commandId: 'workbench.trust.manage',
                            run: (target) => {
                                this.commandService.executeCommand('workbench.trust.manage');
                            }
                        }],
                }, focus);
            };
            this.addHoverDisposables(disposables, workspaceTrustElement, showHover);
            return {
                element: workspaceTrustElement,
                label: workspaceTrustLabel,
                disposables
            };
        }
        createScopeOverridesIndicator() {
            const disposables = new lifecycle_1.DisposableStore();
            // Don't add .setting-indicator class here, because it gets conditionally added later.
            const otherOverridesElement = $('span.setting-item-overrides');
            const otherOverridesLabel = disposables.add(new simpleIconLabel_1.SimpleIconLabel(otherOverridesElement));
            return {
                element: otherOverridesElement,
                label: otherOverridesLabel,
                disposables
            };
        }
        createSyncIgnoredIndicator() {
            const disposables = new lifecycle_1.DisposableStore();
            const syncIgnoredElement = $('span.setting-indicator.setting-item-ignored');
            const syncIgnoredLabel = disposables.add(new simpleIconLabel_1.SimpleIconLabel(syncIgnoredElement));
            syncIgnoredLabel.text = (0, nls_1.localize)('extensionSyncIgnoredLabel', 'Not synced');
            const syncIgnoredHoverContent = (0, nls_1.localize)('syncIgnoredTitle', "This setting is ignored during sync");
            const showHover = (focus) => {
                return this.hoverService.showHover({
                    ...this.defaultHoverOptions,
                    content: syncIgnoredHoverContent,
                    target: syncIgnoredElement
                }, focus);
            };
            this.addHoverDisposables(disposables, syncIgnoredElement, showHover);
            return {
                element: syncIgnoredElement,
                label: syncIgnoredLabel,
                disposables
            };
        }
        createDefaultOverrideIndicator() {
            const disposables = new lifecycle_1.DisposableStore();
            const defaultOverrideIndicator = $('span.setting-indicator.setting-item-default-overridden');
            const defaultOverrideLabel = disposables.add(new simpleIconLabel_1.SimpleIconLabel(defaultOverrideIndicator));
            defaultOverrideLabel.text = (0, nls_1.localize)('defaultOverriddenLabel', "Default value changed");
            return {
                element: defaultOverrideIndicator,
                label: defaultOverrideLabel,
                disposables
            };
        }
        render() {
            const indicatorsToShow = this.allIndicators.filter(indicator => {
                return indicator.element.style.display !== 'none';
            });
            this.indicatorsContainerElement.innerText = '';
            this.indicatorsContainerElement.style.display = 'none';
            if (indicatorsToShow.length) {
                this.indicatorsContainerElement.style.display = 'inline';
                DOM.append(this.indicatorsContainerElement, $('span', undefined, '('));
                for (let i = 0; i < indicatorsToShow.length - 1; i++) {
                    DOM.append(this.indicatorsContainerElement, indicatorsToShow[i].element);
                    DOM.append(this.indicatorsContainerElement, $('span.comma', undefined, ' • '));
                }
                DOM.append(this.indicatorsContainerElement, indicatorsToShow[indicatorsToShow.length - 1].element);
                DOM.append(this.indicatorsContainerElement, $('span', undefined, ')'));
                this.resetIndicatorNavigationKeyBindings(indicatorsToShow);
            }
        }
        resetIndicatorNavigationKeyBindings(indicators) {
            this.keybindingListeners.clear();
            this.indicatorsContainerElement.role = indicators.length >= 1 ? 'toolbar' : 'button';
            if (!indicators.length) {
                return;
            }
            const firstElement = indicators[0].focusElement ?? indicators[0].element;
            firstElement.tabIndex = 0;
            this.keybindingListeners.add(DOM.addDisposableListener(this.indicatorsContainerElement, 'keydown', (e) => {
                const ev = new keyboardEvent_1.StandardKeyboardEvent(e);
                let handled = true;
                if (ev.equals(14 /* KeyCode.Home */)) {
                    this.focusIndicatorAt(indicators, 0);
                }
                else if (ev.equals(13 /* KeyCode.End */)) {
                    this.focusIndicatorAt(indicators, indicators.length - 1);
                }
                else if (ev.equals(17 /* KeyCode.RightArrow */)) {
                    const indexToFocus = (this.focusedIndex + 1) % indicators.length;
                    this.focusIndicatorAt(indicators, indexToFocus);
                }
                else if (ev.equals(15 /* KeyCode.LeftArrow */)) {
                    const indexToFocus = this.focusedIndex ? this.focusedIndex - 1 : indicators.length - 1;
                    this.focusIndicatorAt(indicators, indexToFocus);
                }
                else {
                    handled = false;
                }
                if (handled) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }));
        }
        focusIndicatorAt(indicators, index) {
            if (index === this.focusedIndex) {
                return;
            }
            const indicator = indicators[index];
            const elementToFocus = indicator.focusElement ?? indicator.element;
            elementToFocus.tabIndex = 0;
            elementToFocus.focus();
            const currentlyFocusedIndicator = indicators[this.focusedIndex];
            const previousFocusedElement = currentlyFocusedIndicator.focusElement ?? currentlyFocusedIndicator.element;
            previousFocusedElement.tabIndex = -1;
            this.focusedIndex = index;
        }
        updateWorkspaceTrust(element) {
            this.workspaceTrustIndicator.element.style.display = element.isUntrusted ? 'inline' : 'none';
            this.render();
        }
        updateSyncIgnored(element, ignoredSettings) {
            this.syncIgnoredIndicator.element.style.display = this.userDataSyncEnablementService.isEnabled()
                && ignoredSettings.includes(element.setting.key) ? 'inline' : 'none';
            this.render();
            if (cachedSyncIgnoredSettings !== ignoredSettings) {
                cachedSyncIgnoredSettings = ignoredSettings;
                cachedSyncIgnoredSettingsSet = new Set(cachedSyncIgnoredSettings);
            }
        }
        getInlineScopeDisplayText(completeScope) {
            const [scope, language] = completeScope.split(':');
            const localizedScope = scope === 'user' ?
                (0, nls_1.localize)('user', "User") : scope === 'workspace' ?
                (0, nls_1.localize)('workspace', "Workspace") : (0, nls_1.localize)('remote', "Remote");
            if (language) {
                return `${this.languageService.getLanguageName(language)} > ${localizedScope}`;
            }
            return localizedScope;
        }
        dispose() {
            this.keybindingListeners.dispose();
            for (const indicator of this.allIndicators) {
                indicator.disposables.dispose();
            }
        }
        updateScopeOverrides(element, onDidClickOverrideElement, onApplyFilter) {
            this.scopeOverridesIndicator.element.innerText = '';
            this.scopeOverridesIndicator.element.style.display = 'none';
            this.scopeOverridesIndicator.focusElement = this.scopeOverridesIndicator.element;
            if (element.hasPolicyValue) {
                // If the setting falls under a policy, then no matter what the user sets, the policy value takes effect.
                this.scopeOverridesIndicator.element.style.display = 'inline';
                this.scopeOverridesIndicator.element.classList.add('setting-indicator');
                this.scopeOverridesIndicator.label.text = '$(warning) ' + (0, nls_1.localize)('policyLabelText', "Setting value not applied");
                const content = (0, nls_1.localize)('policyDescription', "This setting is managed by your organization and its applied value cannot be changed.");
                const showHover = (focus) => {
                    return this.hoverService.showHover({
                        ...this.defaultHoverOptions,
                        content,
                        actions: [{
                                label: (0, nls_1.localize)('policyFilterLink', "View policy settings"),
                                commandId: '_settings.action.viewPolicySettings',
                                run: (_) => {
                                    onApplyFilter.fire(`@${preferences_1.POLICY_SETTING_TAG}`);
                                }
                            }],
                        target: this.scopeOverridesIndicator.element
                    }, focus);
                };
                this.addHoverDisposables(this.scopeOverridesIndicator.disposables, this.scopeOverridesIndicator.element, showHover);
            }
            else if (this.profilesEnabled && element.settingsTarget === 3 /* ConfigurationTarget.USER_LOCAL */ && this.configurationService.isSettingAppliedForAllProfiles(element.setting.key)) {
                this.scopeOverridesIndicator.element.style.display = 'inline';
                this.scopeOverridesIndicator.element.classList.add('setting-indicator');
                this.scopeOverridesIndicator.label.text = (0, nls_1.localize)('applicationSetting', "Applies to all profiles");
                const content = (0, nls_1.localize)('applicationSettingDescription', "The setting is not specific to the current profile, and will retain its value when switching profiles.");
                const showHover = (focus) => {
                    return this.hoverService.showHover({
                        ...this.defaultHoverOptions,
                        content,
                        target: this.scopeOverridesIndicator.element
                    }, focus);
                };
                this.addHoverDisposables(this.scopeOverridesIndicator.disposables, this.scopeOverridesIndicator.element, showHover);
            }
            else if (element.overriddenScopeList.length || element.overriddenDefaultsLanguageList.length) {
                if (element.overriddenScopeList.length === 1 && !element.overriddenDefaultsLanguageList.length) {
                    // We can inline the override and show all the text in the label
                    // so that users don't have to wait for the hover to load
                    // just to click into the one override there is.
                    this.scopeOverridesIndicator.element.style.display = 'inline';
                    this.scopeOverridesIndicator.element.classList.remove('setting-indicator');
                    this.scopeOverridesIndicator.disposables.clear();
                    const prefaceText = element.isConfigured ?
                        (0, nls_1.localize)('alsoConfiguredIn', "Also modified in") :
                        (0, nls_1.localize)('configuredIn', "Modified in");
                    this.scopeOverridesIndicator.label.text = `${prefaceText} `;
                    const overriddenScope = element.overriddenScopeList[0];
                    const view = DOM.append(this.scopeOverridesIndicator.element, $('a.modified-scope', undefined, this.getInlineScopeDisplayText(overriddenScope)));
                    view.tabIndex = -1;
                    this.scopeOverridesIndicator.focusElement = view;
                    const onClickOrKeydown = (e) => {
                        const [scope, language] = overriddenScope.split(':');
                        onDidClickOverrideElement.fire({
                            settingKey: element.setting.key,
                            scope: scope,
                            language
                        });
                        e.preventDefault();
                        e.stopPropagation();
                    };
                    this.scopeOverridesIndicator.disposables.add(DOM.addDisposableListener(view, DOM.EventType.CLICK, (e) => {
                        onClickOrKeydown(e);
                    }));
                    this.scopeOverridesIndicator.disposables.add(DOM.addDisposableListener(view, DOM.EventType.KEY_DOWN, (e) => {
                        const ev = new keyboardEvent_1.StandardKeyboardEvent(e);
                        if (ev.equals(10 /* KeyCode.Space */) || ev.equals(3 /* KeyCode.Enter */)) {
                            onClickOrKeydown(e);
                        }
                    }));
                }
                else {
                    this.scopeOverridesIndicator.element.style.display = 'inline';
                    this.scopeOverridesIndicator.element.classList.add('setting-indicator');
                    const scopeOverridesLabelText = element.isConfigured ?
                        (0, nls_1.localize)('alsoConfiguredElsewhere', "Also modified elsewhere") :
                        (0, nls_1.localize)('configuredElsewhere', "Modified elsewhere");
                    this.scopeOverridesIndicator.label.text = scopeOverridesLabelText;
                    let contentMarkdownString = '';
                    if (element.overriddenScopeList.length) {
                        const prefaceText = element.isConfigured ?
                            (0, nls_1.localize)('alsoModifiedInScopes', "The setting has also been modified in the following scopes:") :
                            (0, nls_1.localize)('modifiedInScopes', "The setting has been modified in the following scopes:");
                        contentMarkdownString = prefaceText;
                        for (const scope of element.overriddenScopeList) {
                            const scopeDisplayText = this.getInlineScopeDisplayText(scope);
                            contentMarkdownString += `\n- [${scopeDisplayText}](${encodeURIComponent(scope)} "${getAccessibleScopeDisplayText(scope, this.languageService)}")`;
                        }
                    }
                    if (element.overriddenDefaultsLanguageList.length) {
                        if (contentMarkdownString) {
                            contentMarkdownString += `\n\n`;
                        }
                        const prefaceText = (0, nls_1.localize)('hasDefaultOverridesForLanguages', "The following languages have default overrides:");
                        contentMarkdownString += prefaceText;
                        for (const language of element.overriddenDefaultsLanguageList) {
                            const scopeDisplayText = this.languageService.getLanguageName(language);
                            contentMarkdownString += `\n- [${scopeDisplayText}](${encodeURIComponent(`default:${language}`)} "${scopeDisplayText}")`;
                        }
                    }
                    const content = {
                        value: contentMarkdownString,
                        isTrusted: false,
                        supportHtml: false
                    };
                    const showHover = (focus) => {
                        return this.hoverService.showHover({
                            ...this.defaultHoverOptions,
                            content,
                            linkHandler: (url) => {
                                const [scope, language] = decodeURIComponent(url).split(':');
                                onDidClickOverrideElement.fire({
                                    settingKey: element.setting.key,
                                    scope: scope,
                                    language
                                });
                            },
                            target: this.scopeOverridesIndicator.element
                        }, focus);
                    };
                    this.addHoverDisposables(this.scopeOverridesIndicator.disposables, this.scopeOverridesIndicator.element, showHover);
                }
            }
            this.render();
        }
        updateDefaultOverrideIndicator(element) {
            this.defaultOverrideIndicator.element.style.display = 'none';
            const sourceToDisplay = getDefaultValueSourceToDisplay(element);
            if (sourceToDisplay !== undefined) {
                this.defaultOverrideIndicator.element.style.display = 'inline';
                this.defaultOverrideIndicator.disposables.clear();
                const defaultOverrideHoverContent = (0, nls_1.localize)('defaultOverriddenDetails', "Default setting value overridden by {0}", sourceToDisplay);
                const showHover = (focus) => {
                    return this.hoverService.showHover({
                        content: defaultOverrideHoverContent,
                        target: this.defaultOverrideIndicator.element,
                        position: {
                            hoverPosition: 2 /* HoverPosition.BELOW */,
                        },
                        appearance: {
                            showPointer: true,
                            compact: false
                        }
                    }, focus);
                };
                this.addHoverDisposables(this.defaultOverrideIndicator.disposables, this.defaultOverrideIndicator.element, showHover);
            }
            this.render();
        }
    };
    exports.SettingsTreeIndicatorsLabel = SettingsTreeIndicatorsLabel;
    exports.SettingsTreeIndicatorsLabel = SettingsTreeIndicatorsLabel = __decorate([
        __param(1, configuration_1.IWorkbenchConfigurationService),
        __param(2, hover_1.IHoverService),
        __param(3, userDataSync_1.IUserDataSyncEnablementService),
        __param(4, language_1.ILanguageService),
        __param(5, userDataProfile_1.IUserDataProfilesService),
        __param(6, commands_1.ICommandService)
    ], SettingsTreeIndicatorsLabel);
    function getDefaultValueSourceToDisplay(element) {
        let sourceToDisplay;
        const defaultValueSource = element.defaultValueSource;
        if (defaultValueSource) {
            if (typeof defaultValueSource !== 'string') {
                sourceToDisplay = defaultValueSource.displayName ?? defaultValueSource.id;
            }
            else if (typeof defaultValueSource === 'string') {
                sourceToDisplay = defaultValueSource;
            }
        }
        return sourceToDisplay;
    }
    function getAccessibleScopeDisplayText(completeScope, languageService) {
        const [scope, language] = completeScope.split(':');
        const localizedScope = scope === 'user' ?
            (0, nls_1.localize)('user', "User") : scope === 'workspace' ?
            (0, nls_1.localize)('workspace', "Workspace") : (0, nls_1.localize)('remote', "Remote");
        if (language) {
            return (0, nls_1.localize)('modifiedInScopeForLanguage', "The {0} scope for {1}", localizedScope, languageService.getLanguageName(language));
        }
        return localizedScope;
    }
    function getAccessibleScopeDisplayMidSentenceText(completeScope, languageService) {
        const [scope, language] = completeScope.split(':');
        const localizedScope = scope === 'user' ?
            (0, nls_1.localize)('user', "User") : scope === 'workspace' ?
            (0, nls_1.localize)('workspace', "Workspace") : (0, nls_1.localize)('remote', "Remote");
        if (language) {
            return (0, nls_1.localize)('modifiedInScopeForLanguageMidSentence', "the {0} scope for {1}", localizedScope.toLowerCase(), languageService.getLanguageName(language));
        }
        return localizedScope;
    }
    function getIndicatorsLabelAriaLabel(element, configurationService, userDataProfilesService, languageService) {
        const ariaLabelSections = [];
        // Add workspace trust text
        if (element.isUntrusted) {
            ariaLabelSections.push((0, nls_1.localize)('workspaceUntrustedAriaLabel', "Workspace untrusted; setting value not applied"));
        }
        if (element.hasPolicyValue) {
            ariaLabelSections.push((0, nls_1.localize)('policyDescriptionAccessible', "Managed by organization policy; setting value not applied"));
        }
        else if (userDataProfilesService.isEnabled() && element.settingsTarget === 3 /* ConfigurationTarget.USER_LOCAL */ && configurationService.isSettingAppliedForAllProfiles(element.setting.key)) {
            ariaLabelSections.push((0, nls_1.localize)('applicationSettingDescriptionAccessible', "Setting value retained when switching profiles"));
        }
        else {
            // Add other overrides text
            const otherOverridesStart = element.isConfigured ?
                (0, nls_1.localize)('alsoConfiguredIn', "Also modified in") :
                (0, nls_1.localize)('configuredIn', "Modified in");
            const otherOverridesList = element.overriddenScopeList
                .map(scope => getAccessibleScopeDisplayMidSentenceText(scope, languageService)).join(', ');
            if (element.overriddenScopeList.length) {
                ariaLabelSections.push(`${otherOverridesStart} ${otherOverridesList}`);
            }
        }
        // Add sync ignored text
        if (cachedSyncIgnoredSettingsSet.has(element.setting.key)) {
            ariaLabelSections.push((0, nls_1.localize)('syncIgnoredAriaLabel', "Setting ignored during sync"));
        }
        // Add default override indicator text
        const sourceToDisplay = getDefaultValueSourceToDisplay(element);
        if (sourceToDisplay !== undefined) {
            ariaLabelSections.push((0, nls_1.localize)('defaultOverriddenDetailsAriaLabel', "{0} overrides the default value", sourceToDisplay));
        }
        // Add text about default values being overridden in other languages
        const otherLanguageOverridesList = element.overriddenDefaultsLanguageList
            .map(language => languageService.getLanguageName(language)).join(', ');
        if (element.overriddenDefaultsLanguageList.length) {
            const otherLanguageOverridesText = (0, nls_1.localize)('defaultOverriddenLanguagesList', "Language-specific default values exist for {0}", otherLanguageOverridesList);
            ariaLabelSections.push(otherLanguageOverridesText);
        }
        const ariaLabel = ariaLabelSections.join('. ');
        return ariaLabel;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NFZGl0b3JTZXR0aW5nSW5kaWNhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcHJlZmVyZW5jZXMvYnJvd3Nlci9zZXR0aW5nc0VkaXRvclNldHRpbmdJbmRpY2F0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJmaEcsa0VBNkNDO0lBamhCRCxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBcUJoQjs7OztPQUlHO0lBQ0gsSUFBSSw0QkFBNEIsR0FBZ0IsSUFBSSxHQUFHLEVBQVUsQ0FBQztJQUVsRTs7O09BR0c7SUFDSCxJQUFJLHlCQUF5QixHQUFhLEVBQUUsQ0FBQztJQUU3Qzs7T0FFRztJQUNJLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTJCO1FBY3ZDLFlBQ0MsU0FBc0IsRUFDVSxvQkFBcUUsRUFDdEYsWUFBNEMsRUFDM0IsNkJBQThFLEVBQzVGLGVBQWtELEVBQzFDLHVCQUFrRSxFQUMzRSxjQUFnRDtZQUxoQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQWdDO1lBQ3JFLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ1Ysa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFnQztZQUMzRSxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDekIsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUMxRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFWakQsd0JBQW1CLEdBQW9CLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3RFLGlCQUFZLEdBQUcsQ0FBQyxDQUFDO1lBc0JqQix3QkFBbUIsR0FBMkI7Z0JBQ3JELFNBQVMsRUFBRSxJQUFJO2dCQUNmLFFBQVEsRUFBRTtvQkFDVCxhQUFhLDZCQUFxQjtpQkFDbEM7Z0JBQ0Qs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