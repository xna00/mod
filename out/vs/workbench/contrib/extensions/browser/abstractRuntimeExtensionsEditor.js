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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/date", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/base/common/network", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/common/runtimeExtensionsInput", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensionRunningLocation", "vs/workbench/services/extensions/common/extensions", "vs/css!./media/runtimeExtensionsEditor"], function (require, exports, dom_1, actionbar_1, hoverDelegateFactory_1, updatableHoverWidget_1, iconLabels_1, actions_1, arrays_1, async_1, date_1, decorators_1, lifecycle_1, network_1, nls, actionCommonCategories_1, actions_2, clipboardService_1, contextkey_1, contextView_1, extensions_1, instantiation_1, label_1, listService_1, notification_1, platform_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, editorPane_1, extensionsIcons_1, extensions_2, runtimeExtensionsInput_1, editorService_1, environmentService_1, extensionFeatures_1, extensionManagement_1, extensionRunningLocation_1, extensions_3) {
    "use strict";
    var AbstractRuntimeExtensionsEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowRuntimeExtensionsAction = exports.AbstractRuntimeExtensionsEditor = void 0;
    let AbstractRuntimeExtensionsEditor = class AbstractRuntimeExtensionsEditor extends editorPane_1.EditorPane {
        static { AbstractRuntimeExtensionsEditor_1 = this; }
        static { this.ID = 'workbench.editor.runtimeExtensions'; }
        constructor(group, telemetryService, themeService, contextKeyService, _extensionsWorkbenchService, _extensionService, _notificationService, _contextMenuService, _instantiationService, storageService, _labelService, _environmentService, _clipboardService, _extensionFeaturesManagementService) {
            super(AbstractRuntimeExtensionsEditor_1.ID, group, telemetryService, themeService, storageService);
            this._extensionsWorkbenchService = _extensionsWorkbenchService;
            this._extensionService = _extensionService;
            this._notificationService = _notificationService;
            this._contextMenuService = _contextMenuService;
            this._instantiationService = _instantiationService;
            this._labelService = _labelService;
            this._environmentService = _environmentService;
            this._clipboardService = _clipboardService;
            this._extensionFeaturesManagementService = _extensionFeaturesManagementService;
            this._list = null;
            this._elements = null;
            this._updateSoon = this._register(new async_1.RunOnceScheduler(() => this._updateExtensions(), 200));
            this._register(this._extensionService.onDidChangeExtensionsStatus(() => this._updateSoon.schedule()));
            this._register(this._extensionFeaturesManagementService.onDidChangeAccessData(() => this._updateSoon.schedule()));
            this._updateExtensions();
        }
        async _updateExtensions() {
            this._elements = await this._resolveExtensions();
            this._list?.splice(0, this._list.length, this._elements);
        }
        async _resolveExtensions() {
            // We only deal with extensions with source code!
            await this._extensionService.whenInstalledExtensionsRegistered();
            const extensionsDescriptions = this._extensionService.extensions.filter((extension) => {
                return Boolean(extension.main) || Boolean(extension.browser);
            });
            const marketplaceMap = new extensions_1.ExtensionIdentifierMap();
            const marketPlaceExtensions = await this._extensionsWorkbenchService.queryLocal();
            for (const extension of marketPlaceExtensions) {
                marketplaceMap.set(extension.identifier.id, extension);
            }
            const statusMap = this._extensionService.getExtensionsStatus();
            // group profile segments by extension
            const segments = new extensions_1.ExtensionIdentifierMap();
            const profileInfo = this._getProfileInfo();
            if (profileInfo) {
                let currentStartTime = profileInfo.startTime;
                for (let i = 0, len = profileInfo.deltas.length; i < len; i++) {
                    const id = profileInfo.ids[i];
                    const delta = profileInfo.deltas[i];
                    let extensionSegments = segments.get(id);
                    if (!extensionSegments) {
                        extensionSegments = [];
                        segments.set(id, extensionSegments);
                    }
                    extensionSegments.push(currentStartTime);
                    currentStartTime = currentStartTime + delta;
                    extensionSegments.push(currentStartTime);
                }
            }
            let result = [];
            for (let i = 0, len = extensionsDescriptions.length; i < len; i++) {
                const extensionDescription = extensionsDescriptions[i];
                let extProfileInfo = null;
                if (profileInfo) {
                    const extensionSegments = segments.get(extensionDescription.identifier) || [];
                    let extensionTotalTime = 0;
                    for (let j = 0, lenJ = extensionSegments.length / 2; j < lenJ; j++) {
                        const startTime = extensionSegments[2 * j];
                        const endTime = extensionSegments[2 * j + 1];
                        extensionTotalTime += (endTime - startTime);
                    }
                    extProfileInfo = {
                        segments: extensionSegments,
                        totalTime: extensionTotalTime
                    };
                }
                result[i] = {
                    originalIndex: i,
                    description: extensionDescription,
                    marketplaceInfo: marketplaceMap.get(extensionDescription.identifier),
                    status: statusMap[extensionDescription.identifier.value],
                    profileInfo: extProfileInfo || undefined,
                    unresponsiveProfile: this._getUnresponsiveProfile(extensionDescription.identifier)
                };
            }
            result = result.filter(element => element.status.activationStarted);
            // bubble up extensions that have caused slowness
            const isUnresponsive = (extension) => extension.unresponsiveProfile === profileInfo;
            const profileTime = (extension) => extension.profileInfo?.totalTime ?? 0;
            const activationTime = (extension) => (extension.status.activationTimes?.codeLoadingTime ?? 0) +
                (extension.status.activationTimes?.activateCallTime ?? 0);
            result = result.sort((a, b) => {
                if (isUnresponsive(a) || isUnresponsive(b)) {
                    return +isUnresponsive(b) - +isUnresponsive(a);
                }
                else if (profileTime(a) || profileTime(b)) {
                    return profileTime(b) - profileTime(a);
                }
                else if (activationTime(a) || activationTime(b)) {
                    return activationTime(b) - activationTime(a);
                }
                return a.originalIndex - b.originalIndex;
            });
            return result;
        }
        createEditor(parent) {
            parent.classList.add('runtime-extensions-editor');
            const TEMPLATE_ID = 'runtimeExtensionElementTemplate';
            const delegate = new class {
                getHeight(element) {
                    return 70;
                }
                getTemplateId(element) {
                    return TEMPLATE_ID;
                }
            };
            const renderer = {
                templateId: TEMPLATE_ID,
                renderTemplate: (root) => {
                    const element = (0, dom_1.append)(root, (0, dom_1.$)('.extension'));
                    const iconContainer = (0, dom_1.append)(element, (0, dom_1.$)('.icon-container'));
                    const icon = (0, dom_1.append)(iconContainer, (0, dom_1.$)('img.icon'));
                    const desc = (0, dom_1.append)(element, (0, dom_1.$)('div.desc'));
                    const headerContainer = (0, dom_1.append)(desc, (0, dom_1.$)('.header-container'));
                    const header = (0, dom_1.append)(headerContainer, (0, dom_1.$)('.header'));
                    const name = (0, dom_1.append)(header, (0, dom_1.$)('div.name'));
                    const version = (0, dom_1.append)(header, (0, dom_1.$)('span.version'));
                    const msgContainer = (0, dom_1.append)(desc, (0, dom_1.$)('div.msg'));
                    const actionbar = new actionbar_1.ActionBar(desc);
                    actionbar.onDidRun(({ error }) => error && this._notificationService.error(error));
                    const timeContainer = (0, dom_1.append)(element, (0, dom_1.$)('.time'));
                    const activationTime = (0, dom_1.append)(timeContainer, (0, dom_1.$)('div.activation-time'));
                    const profileTime = (0, dom_1.append)(timeContainer, (0, dom_1.$)('div.profile-time'));
                    const disposables = [actionbar];
                    return {
                        root,
                        element,
                        icon,
                        name,
                        version,
                        actionbar,
                        activationTime,
                        profileTime,
                        msgContainer,
                        disposables,
                        elementDisposables: [],
                    };
                },
                renderElement: (element, index, data) => {
                    data.elementDisposables = (0, lifecycle_1.dispose)(data.elementDisposables);
                    data.root.classList.toggle('odd', index % 2 === 1);
                    data.elementDisposables.push((0, dom_1.addDisposableListener)(data.icon, 'error', () => data.icon.src = element.marketplaceInfo?.iconUrlFallback || extensionManagement_1.DefaultIconPath, { once: true }));
                    data.icon.src = element.marketplaceInfo?.iconUrl || extensionManagement_1.DefaultIconPath;
                    if (!data.icon.complete) {
                        data.icon.style.visibility = 'hidden';
                        data.icon.onload = () => data.icon.style.visibility = 'inherit';
                    }
                    else {
                        data.icon.style.visibility = 'inherit';
                    }
                    data.name.textContent = (element.marketplaceInfo?.displayName || element.description.identifier.value).substr(0, 50);
                    data.version.textContent = element.description.version;
                    const activationTimes = element.status.activationTimes;
                    if (activationTimes) {
                        const syncTime = activationTimes.codeLoadingTime + activationTimes.activateCallTime;
                        data.activationTime.textContent = activationTimes.activationReason.startup ? `Startup Activation: ${syncTime}ms` : `Activation: ${syncTime}ms`;
                    }
                    else {
                        data.activationTime.textContent = `Activating...`;
                    }
                    data.actionbar.clear();
                    const slowExtensionAction = this._createSlowExtensionAction(element);
                    if (slowExtensionAction) {
                        data.actionbar.push(slowExtensionAction, { icon: false, label: true });
                    }
                    if ((0, arrays_1.isNonEmptyArray)(element.status.runtimeErrors)) {
                        const reportExtensionIssueAction = this._createReportExtensionIssueAction(element);
                        if (reportExtensionIssueAction) {
                            data.actionbar.push(reportExtensionIssueAction, { icon: false, label: true });
                        }
                    }
                    let title;
                    if (activationTimes) {
                        const activationId = activationTimes.activationReason.extensionId.value;
                        const activationEvent = activationTimes.activationReason.activationEvent;
                        if (activationEvent === '*') {
                            title = nls.localize({
                                key: 'starActivation',
                                comment: [
                                    '{0} will be an extension identifier'
                                ]
                            }, "Activated by {0} on start-up", activationId);
                        }
                        else if (/^workspaceContains:/.test(activationEvent)) {
                            const fileNameOrGlob = activationEvent.substr('workspaceContains:'.length);
                            if (fileNameOrGlob.indexOf('*') >= 0 || fileNameOrGlob.indexOf('?') >= 0) {
                                title = nls.localize({
                                    key: 'workspaceContainsGlobActivation',
                                    comment: [
                                        '{0} will be a glob pattern',
                                        '{1} will be an extension identifier'
                                    ]
                                }, "Activated by {1} because a file matching {0} exists in your workspace", fileNameOrGlob, activationId);
                            }
                            else {
                                title = nls.localize({
                                    key: 'workspaceContainsFileActivation',
                                    comment: [
                                        '{0} will be a file name',
                                        '{1} will be an extension identifier'
                                    ]
                                }, "Activated by {1} because file {0} exists in your workspace", fileNameOrGlob, activationId);
                            }
                        }
                        else if (/^workspaceContainsTimeout:/.test(activationEvent)) {
                            const glob = activationEvent.substr('workspaceContainsTimeout:'.length);
                            title = nls.localize({
                                key: 'workspaceContainsTimeout',
                                comment: [
                                    '{0} will be a glob pattern',
                                    '{1} will be an extension identifier'
                                ]
                            }, "Activated by {1} because searching for {0} took too long", glob, activationId);
                        }
                        else if (activationEvent === 'onStartupFinished') {
                            title = nls.localize({
                                key: 'startupFinishedActivation',
                                comment: [
                                    'This refers to an extension. {0} will be an activation event.'
                                ]
                            }, "Activated by {0} after start-up finished", activationId);
                        }
                        else if (/^onLanguage:/.test(activationEvent)) {
                            const language = activationEvent.substr('onLanguage:'.length);
                            title = nls.localize('languageActivation', "Activated by {1} because you opened a {0} file", language, activationId);
                        }
                        else {
                            title = nls.localize({
                                key: 'workspaceGenericActivation',
                                comment: [
                                    '{0} will be an activation event, like e.g. \'language:typescript\', \'debug\', etc.',
                                    '{1} will be an extension identifier'
                                ]
                            }, "Activated by {1} on {0}", activationEvent, activationId);
                        }
                    }
                    else {
                        title = nls.localize('extensionActivating', "Extension is activating...");
                    }
                    data.elementDisposables.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.activationTime, title));
                    (0, dom_1.clearNode)(data.msgContainer);
                    if (this._getUnresponsiveProfile(element.description.identifier)) {
                        const el = (0, dom_1.$)('span', undefined, ...(0, iconLabels_1.renderLabelWithIcons)(` $(alert) Unresponsive`));
                        const extensionHostFreezTitle = nls.localize('unresponsive.title', "Extension has caused the extension host to freeze.");
                        data.elementDisposables.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), el, extensionHostFreezTitle));
                        data.msgContainer.appendChild(el);
                    }
                    if ((0, arrays_1.isNonEmptyArray)(element.status.runtimeErrors)) {
                        const el = (0, dom_1.$)('span', undefined, ...(0, iconLabels_1.renderLabelWithIcons)(`$(bug) ${nls.localize('errors', "{0} uncaught errors", element.status.runtimeErrors.length)}`));
                        data.msgContainer.appendChild(el);
                    }
                    if (element.status.messages && element.status.messages.length > 0) {
                        const el = (0, dom_1.$)('span', undefined, ...(0, iconLabels_1.renderLabelWithIcons)(`$(alert) ${element.status.messages[0].message}`));
                        data.msgContainer.appendChild(el);
                    }
                    let extraLabel = null;
                    if (element.status.runningLocation && element.status.runningLocation.equals(new extensionRunningLocation_1.LocalWebWorkerRunningLocation(0))) {
                        extraLabel = `$(globe) web worker`;
                    }
                    else if (element.description.extensionLocation.scheme === network_1.Schemas.vscodeRemote) {
                        const hostLabel = this._labelService.getHostLabel(network_1.Schemas.vscodeRemote, this._environmentService.remoteAuthority);
                        if (hostLabel) {
                            extraLabel = `$(remote) ${hostLabel}`;
                        }
                        else {
                            extraLabel = `$(remote) ${element.description.extensionLocation.authority}`;
                        }
                    }
                    else if (element.status.runningLocation && element.status.runningLocation.affinity > 0) {
                        extraLabel = element.status.runningLocation instanceof extensionRunningLocation_1.LocalWebWorkerRunningLocation
                            ? `$(globe) web worker ${element.status.runningLocation.affinity + 1}`
                            : `$(server-process) local process ${element.status.runningLocation.affinity + 1}`;
                    }
                    if (extraLabel) {
                        const el = (0, dom_1.$)('span', undefined, ...(0, iconLabels_1.renderLabelWithIcons)(extraLabel));
                        data.msgContainer.appendChild(el);
                    }
                    const features = platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).getExtensionFeatures();
                    for (const feature of features) {
                        const accessData = this._extensionFeaturesManagementService.getAccessData(element.description.identifier, feature.id);
                        if (accessData) {
                            const status = accessData?.current?.status;
                            if (status) {
                                data.msgContainer.appendChild((0, dom_1.$)('span', undefined, `${feature.label}: `));
                                data.msgContainer.appendChild((0, dom_1.$)('span', undefined, ...(0, iconLabels_1.renderLabelWithIcons)(`$(${status.severity === notification_1.Severity.Error ? extensionsIcons_1.errorIcon.id : extensionsIcons_1.warningIcon.id}) ${status.message}`)));
                            }
                            if (accessData?.current) {
                                const element = (0, dom_1.$)('span', undefined, nls.localize('requests count', "{0} Requests: {1} (Session)", feature.label, accessData.current.count));
                                const title = nls.localize('requests count title', "Last request was {0}. Overall Requests: {1}", (0, date_1.fromNow)(accessData.current.lastAccessed, true, true), accessData.totalCount);
                                data.elementDisposables.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), element, title));
                                data.msgContainer.appendChild(element);
                            }
                        }
                    }
                    if (element.profileInfo) {
                        data.profileTime.textContent = `Profile: ${(element.profileInfo.totalTime / 1000).toFixed(2)}ms`;
                    }
                    else {
                        data.profileTime.textContent = '';
                    }
                },
                disposeTemplate: (data) => {
                    data.disposables = (0, lifecycle_1.dispose)(data.disposables);
                }
            };
            this._list = this._instantiationService.createInstance(listService_1.WorkbenchList, 'RuntimeExtensions', parent, delegate, [renderer], {
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                horizontalScrolling: false,
                overrideStyles: {
                    listBackground: colorRegistry_1.editorBackground
                },
                accessibilityProvider: new class {
                    getWidgetAriaLabel() {
                        return nls.localize('runtimeExtensions', "Runtime Extensions");
                    }
                    getAriaLabel(element) {
                        return element.description.name;
                    }
                }
            });
            this._list.splice(0, this._list.length, this._elements || undefined);
            this._list.onContextMenu((e) => {
                if (!e.element) {
                    return;
                }
                const actions = [];
                actions.push(new actions_1.Action('runtimeExtensionsEditor.action.copyId', nls.localize('copy id', "Copy id ({0})", e.element.description.identifier.value), undefined, true, () => {
                    this._clipboardService.writeText(e.element.description.identifier.value);
                }));
                const reportExtensionIssueAction = this._createReportExtensionIssueAction(e.element);
                if (reportExtensionIssueAction) {
                    actions.push(reportExtensionIssueAction);
                }
                actions.push(new actions_1.Separator());
                if (e.element.marketplaceInfo) {
                    actions.push(new actions_1.Action('runtimeExtensionsEditor.action.disableWorkspace', nls.localize('disable workspace', "Disable (Workspace)"), undefined, true, () => this._extensionsWorkbenchService.setEnablement(e.element.marketplaceInfo, 7 /* EnablementState.DisabledWorkspace */)));
                    actions.push(new actions_1.Action('runtimeExtensionsEditor.action.disable', nls.localize('disable', "Disable"), undefined, true, () => this._extensionsWorkbenchService.setEnablement(e.element.marketplaceInfo, 6 /* EnablementState.DisabledGlobally */)));
                }
                actions.push(new actions_1.Separator());
                const profileAction = this._createProfileAction();
                if (profileAction) {
                    actions.push(profileAction);
                }
                const saveExtensionHostProfileAction = this.saveExtensionHostProfileAction;
                if (saveExtensionHostProfileAction) {
                    actions.push(saveExtensionHostProfileAction);
                }
                this._contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => actions
                });
            });
        }
        get saveExtensionHostProfileAction() {
            return this._createSaveExtensionHostProfileAction();
        }
        layout(dimension) {
            this._list?.layout(dimension.height);
        }
    };
    exports.AbstractRuntimeExtensionsEditor = AbstractRuntimeExtensionsEditor;
    __decorate([
        decorators_1.memoize
    ], AbstractRuntimeExtensionsEditor.prototype, "saveExtensionHostProfileAction", null);
    exports.AbstractRuntimeExtensionsEditor = AbstractRuntimeExtensionsEditor = AbstractRuntimeExtensionsEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, extensions_2.IExtensionsWorkbenchService),
        __param(5, extensions_3.IExtensionService),
        __param(6, notification_1.INotificationService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, storage_1.IStorageService),
        __param(10, label_1.ILabelService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService),
        __param(12, clipboardService_1.IClipboardService),
        __param(13, extensionFeatures_1.IExtensionFeaturesManagementService)
    ], AbstractRuntimeExtensionsEditor);
    class ShowRuntimeExtensionsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.showRuntimeExtensions',
                title: nls.localize2('showRuntimeExtensions', "Show Running Extensions"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                menu: {
                    id: actions_2.MenuId.ViewContainerTitle,
                    when: contextkey_1.ContextKeyExpr.equals('viewContainer', 'workbench.view.extensions'),
                    group: '2_enablement',
                    order: 3
                }
            });
        }
        async run(accessor) {
            await accessor.get(editorService_1.IEditorService).openEditor(runtimeExtensionsInput_1.RuntimeExtensionsInput.instance, { pinned: true });
        }
    }
    exports.ShowRuntimeExtensionsAction = ShowRuntimeExtensionsAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RSdW50aW1lRXh0ZW5zaW9uc0VkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9icm93c2VyL2Fic3RyYWN0UnVudGltZUV4dGVuc2lvbnNFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9FekYsSUFBZSwrQkFBK0IsR0FBOUMsTUFBZSwrQkFBZ0MsU0FBUSx1QkFBVTs7aUJBRWhELE9BQUUsR0FBVyxvQ0FBb0MsQUFBL0MsQ0FBZ0Q7UUFNekUsWUFDQyxLQUFtQixFQUNBLGdCQUFtQyxFQUN2QyxZQUEyQixFQUN0QixpQkFBcUMsRUFDWCwyQkFBd0QsRUFDbEUsaUJBQW9DLEVBQ2pDLG9CQUEwQyxFQUMzQyxtQkFBd0MsRUFDcEMscUJBQTRDLEVBQ3JFLGNBQStCLEVBQ2hCLGFBQTRCLEVBQ2IsbUJBQWlELEVBQzVELGlCQUFvQyxFQUNsQixtQ0FBd0U7WUFFOUgsS0FBSyxDQUFDLGlDQUErQixDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBWG5ELGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFDbEUsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNqQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQzNDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDcEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUV0RCxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUNiLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBOEI7WUFDNUQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNsQix3Q0FBbUMsR0FBbkMsbUNBQW1DLENBQXFD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