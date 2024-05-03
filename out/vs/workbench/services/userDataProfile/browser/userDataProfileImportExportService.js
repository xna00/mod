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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/base/browser/dom", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/base/common/uri", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/log/common/log", "vs/workbench/browser/parts/views/treeView", "vs/workbench/services/userDataProfile/browser/settingsResource", "vs/workbench/services/userDataProfile/browser/keybindingsResource", "vs/workbench/services/userDataProfile/browser/snippetsResource", "vs/workbench/services/userDataProfile/browser/tasksResource", "vs/workbench/services/userDataProfile/browser/extensionsResource", "vs/workbench/services/userDataProfile/browser/globalStateResource", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/browser/ui/button/button", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/platform/theme/common/themeService", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/browser/defaultStyles", "vs/base/common/uuid", "vs/workbench/services/editor/common/editorService", "vs/base/common/errors", "vs/platform/progress/common/progress", "vs/workbench/services/extensions/common/extensions", "vs/platform/quickinput/common/quickInput", "vs/base/common/buffer", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/network", "vs/base/common/cancellation", "vs/base/common/severity", "vs/platform/clipboard/common/clipboardService", "vs/platform/url/common/url", "vs/platform/request/common/request", "vs/platform/product/common/productService", "vs/base/common/types", "vs/base/common/actions", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/base/common/codicons", "vs/base/common/async", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/htmlContent", "vs/base/browser/markdownRenderer", "vs/workbench/services/log/common/logConstants", "vs/base/browser/ui/selectBox/selectBox", "vs/base/common/themables", "vs/platform/hover/browser/hover", "vs/workbench/services/userDataProfile/common/userDataProfileIcons", "vs/workbench/services/userDataProfile/browser/iconSelectBox", "vs/base/browser/keyboardEvent", "vs/css!./media/userDataProfileView"], function (require, exports, nls_1, extensions_1, instantiation_1, notification_1, event_1, DOM, userDataProfile_1, lifecycle_1, dialogs_1, uriIdentity_1, textfiles_1, files_1, uri_1, views_1, viewsService_1, userDataProfile_2, contextkey_1, platform_1, descriptors_1, viewPaneContainer_1, log_1, treeView_1, settingsResource_1, keybindingsResource_1, snippetsResource_1, tasksResource_1, extensionsResource_1, globalStateResource_1, inMemoryFilesystemProvider_1, button_1, keybinding_1, contextView_1, configuration_1, opener_1, themeService_1, telemetry_1, defaultStyles_1, uuid_1, editorService_1, errors_1, progress_1, extensions_2, quickInput_1, buffer_1, resources_1, strings_1, network_1, cancellation_1, severity_1, clipboardService_1, url_1, request_1, productService_1, types_1, actions_1, platform_2, actions_2, codicons_1, async_1, extensionManagement_1, extensionManagementUtil_1, htmlContent_1, markdownRenderer_1, logConstants_1, selectBox_1, themables_1, hover_1, userDataProfileIcons_1, iconSelectBox_1, keyboardEvent_1) {
    "use strict";
    var UserDataProfileImportExportService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfileImportExportService = void 0;
    function isUserDataProfileTemplate(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && (candidate.name && typeof candidate.name === 'string')
            && ((0, types_1.isUndefined)(candidate.icon) || typeof candidate.icon === 'string')
            && ((0, types_1.isUndefined)(candidate.settings) || typeof candidate.settings === 'string')
            && ((0, types_1.isUndefined)(candidate.globalState) || typeof candidate.globalState === 'string')
            && ((0, types_1.isUndefined)(candidate.extensions) || typeof candidate.extensions === 'string'));
    }
    const EXPORT_PROFILE_PREVIEW_VIEW = 'workbench.views.profiles.export.preview';
    const IMPORT_PROFILE_PREVIEW_VIEW = 'workbench.views.profiles.import.preview';
    let UserDataProfileImportExportService = class UserDataProfileImportExportService extends lifecycle_1.Disposable {
        static { UserDataProfileImportExportService_1 = this; }
        static { this.PROFILE_URL_AUTHORITY_PREFIX = 'profile-'; }
        constructor(instantiationService, userDataProfileService, viewsService, editorService, contextKeyService, userDataProfileManagementService, userDataProfilesService, extensionService, extensionManagementService, quickInputService, notificationService, progressService, dialogService, clipboardService, openerService, requestService, urlService, productService, uriIdentityService, telemetryService, contextViewService, hoverService, logService) {
            super();
            this.instantiationService = instantiationService;
            this.userDataProfileService = userDataProfileService;
            this.viewsService = viewsService;
            this.editorService = editorService;
            this.userDataProfileManagementService = userDataProfileManagementService;
            this.userDataProfilesService = userDataProfilesService;
            this.extensionService = extensionService;
            this.extensionManagementService = extensionManagementService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.progressService = progressService;
            this.dialogService = dialogService;
            this.clipboardService = clipboardService;
            this.openerService = openerService;
            this.requestService = requestService;
            this.productService = productService;
            this.uriIdentityService = uriIdentityService;
            this.telemetryService = telemetryService;
            this.contextViewService = contextViewService;
            this.hoverService = hoverService;
            this.logService = logService;
            this.profileContentHandlers = new Map();
            this.registerProfileContentHandler(network_1.Schemas.file, this.fileUserDataProfileContentHandler = instantiationService.createInstance(FileUserDataProfileContentHandler));
            this.isProfileExportInProgressContextKey = userDataProfile_1.IS_PROFILE_EXPORT_IN_PROGRESS_CONTEXT.bindTo(contextKeyService);
            this.isProfileImportInProgressContextKey = userDataProfile_1.IS_PROFILE_IMPORT_IN_PROGRESS_CONTEXT.bindTo(contextKeyService);
            this.viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                id: 'userDataProfiles',
                title: userDataProfile_1.PROFILES_TITLE,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, ['userDataProfiles', { mergeViewWithContainerWhenSingleView: true }]),
                icon: userDataProfile_1.defaultUserDataProfileIcon,
                hideIfEmpty: true,
            }, 0 /* ViewContainerLocation.Sidebar */);
            urlService.registerHandler(this);
        }
        isProfileURL(uri) {
            return uri.authority === userDataProfile_1.PROFILE_URL_AUTHORITY || new RegExp(`^${UserDataProfileImportExportService_1.PROFILE_URL_AUTHORITY_PREFIX}`).test(uri.authority);
        }
        async handleURL(uri) {
            if (this.isProfileURL(uri)) {
                try {
                    await this.importProfile(uri);
                }
                catch (error) {
                    this.notificationService.error((0, nls_1.localize)('profile import error', "Error while importing profile: {0}", (0, errors_1.getErrorMessage)(error)));
                }
                return true;
            }
            return false;
        }
        registerProfileContentHandler(id, profileContentHandler) {
            if (this.profileContentHandlers.has(id)) {
                throw new Error(`Profile content handler with id '${id}' already registered.`);
            }
            this.profileContentHandlers.set(id, profileContentHandler);
            return (0, lifecycle_1.toDisposable)(() => this.unregisterProfileContentHandler(id));
        }
        unregisterProfileContentHandler(id) {
            this.profileContentHandlers.delete(id);
        }
        async exportProfile() {
            if (this.isProfileExportInProgressContextKey.get()) {
                this.logService.warn('Profile export already in progress.');
                return;
            }
            return this.showProfileContents();
        }
        async importProfile(uri, options) {
            if (this.isProfileImportInProgressContextKey.get()) {
                this.notificationService.warn('Profile import already in progress.');
                return;
            }
            this.isProfileImportInProgressContextKey.set(true);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, lifecycle_1.toDisposable)(() => this.isProfileImportInProgressContextKey.set(false)));
            try {
                const mode = options?.mode ?? 'preview';
                const profileTemplate = await this.progressService.withProgress({
                    location: 10 /* ProgressLocation.Window */,
                    command: logConstants_1.showWindowLogActionId,
                    title: (0, nls_1.localize)('resolving uri', "{0}: Resolving profile content...", options?.mode ? (0, nls_1.localize)('preview profile', "Preview Profile") : (0, nls_1.localize)('import profile', "Create Profile")),
                }, () => this.resolveProfileTemplate(uri, options));
                if (!profileTemplate) {
                    return;
                }
                if (mode === 'preview') {
                    await this.previewProfile(profileTemplate, options);
                }
                else if (mode === 'apply') {
                    await this.createAndSwitch(profileTemplate, false, true, options, (0, nls_1.localize)('create profile', "Create Profile"));
                }
                else if (mode === 'both') {
                    await this.importAndPreviewProfile(uri, profileTemplate, options);
                }
            }
            finally {
                disposables.dispose();
            }
        }
        createProfile(from) {
            return this.saveProfile(undefined, from);
        }
        editProfile(profile) {
            return this.saveProfile(profile);
        }
        async saveProfile(profile, source) {
            const createProfileTelemetryData = { source: source instanceof uri_1.URI ? 'template' : (0, userDataProfile_2.isUserDataProfile)(source) ? 'profile' : source ? 'external' : undefined };
            if (profile) {
                this.telemetryService.publicLog2('userDataProfile.startEdit');
            }
            else {
                this.telemetryService.publicLog2('userDataProfile.startCreate', createProfileTelemetryData);
            }
            const disposables = new lifecycle_1.DisposableStore();
            const title = profile ? (0, nls_1.localize)('save profile', "Edit {0} Profile...", profile.name) : (0, nls_1.localize)('create new profle', "Create New Profile...");
            const settings = { id: "settings" /* ProfileResourceType.Settings */, label: (0, nls_1.localize)('settings', "Settings"), picked: !profile?.useDefaultFlags?.settings };
            const keybindings = { id: "keybindings" /* ProfileResourceType.Keybindings */, label: (0, nls_1.localize)('keybindings', "Keyboard Shortcuts"), picked: !profile?.useDefaultFlags?.keybindings };
            const snippets = { id: "snippets" /* ProfileResourceType.Snippets */, label: (0, nls_1.localize)('snippets', "User Snippets"), picked: !profile?.useDefaultFlags?.snippets };
            const tasks = { id: "tasks" /* ProfileResourceType.Tasks */, label: (0, nls_1.localize)('tasks', "User Tasks"), picked: !profile?.useDefaultFlags?.tasks };
            const extensions = { id: "extensions" /* ProfileResourceType.Extensions */, label: (0, nls_1.localize)('extensions', "Extensions"), picked: !profile?.useDefaultFlags?.extensions };
            const resources = [settings, keybindings, snippets, tasks, extensions];
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.title = title;
            quickPick.placeholder = (0, nls_1.localize)('name placeholder', "Profile name");
            quickPick.value = profile?.name ?? (isUserDataProfileTemplate(source) ? this.generateProfileName(source.name) : '');
            quickPick.canSelectMany = true;
            quickPick.matchOnDescription = false;
            quickPick.matchOnDetail = false;
            quickPick.matchOnLabel = false;
            quickPick.sortByLabel = false;
            quickPick.hideCountBadge = true;
            quickPick.ok = false;
            quickPick.customButton = true;
            quickPick.hideCheckAll = true;
            quickPick.ignoreFocusOut = true;
            quickPick.customLabel = profile ? (0, nls_1.localize)('save', "Save") : (0, nls_1.localize)('create', "Create");
            quickPick.description = (0, nls_1.localize)('customise the profile', "Choose what to configure in your Profile:");
            quickPick.items = [...resources];
            const update = () => {
                quickPick.items = resources;
                quickPick.selectedItems = resources.filter(item => item.picked);
            };
            update();
            const validate = () => {
                if (!profile && this.userDataProfilesService.profiles.some(p => p.name === quickPick.value)) {
                    quickPick.validationMessage = (0, nls_1.localize)('profileExists', "Profile with name {0} already exists.", quickPick.value);
                    quickPick.severity = severity_1.default.Warning;
                    return;
                }
                if (resources.every(resource => !resource.picked)) {
                    quickPick.validationMessage = (0, nls_1.localize)('invalid configurations', "The profile should contain at least one configuration.");
                    quickPick.severity = severity_1.default.Warning;
                    return;
                }
                quickPick.severity = severity_1.default.Ignore;
                quickPick.validationMessage = undefined;
            };
            disposables.add(quickPick.onDidChangeSelection(items => {
                let needUpdate = false;
                for (const resource of resources) {
                    resource.picked = items.includes(resource);
                    const description = resource.picked ? undefined : (0, nls_1.localize)('use default profile', "Using Default Profile");
                    if (resource.description !== description) {
                        resource.description = description;
                        needUpdate = true;
                    }
                }
                if (needUpdate) {
                    update();
                }
                validate();
            }));
            disposables.add(quickPick.onDidChangeValue(validate));
            let icon = userDataProfileIcons_1.DEFAULT_ICON;
            if (profile?.icon) {
                icon = themables_1.ThemeIcon.fromId(profile.icon);
            }
            if (isUserDataProfileTemplate(source) && source.icon) {
                icon = themables_1.ThemeIcon.fromId(source.icon);
            }
            if (icon.id !== userDataProfileIcons_1.DEFAULT_ICON.id && !userDataProfileIcons_1.ICONS.some(({ id }) => id === icon.id) && !(0, codicons_1.getAllCodicons)().some(({ id }) => id === icon.id)) {
                icon = userDataProfileIcons_1.DEFAULT_ICON;
            }
            let result;
            disposables.add(event_1.Event.any(quickPick.onDidCustom, quickPick.onDidAccept)(() => {
                const name = quickPick.value.trim();
                if (!name) {
                    quickPick.validationMessage = (0, nls_1.localize)('name required', "Profile name is required and must be a non-empty value.");
                    quickPick.severity = severity_1.default.Error;
                }
                if (quickPick.validationMessage) {
                    return;
                }
                result = { name, items: quickPick.selectedItems, icon: icon.id === userDataProfileIcons_1.DEFAULT_ICON.id ? null : icon.id };
                quickPick.hide();
                quickPick.severity = severity_1.default.Ignore;
                quickPick.validationMessage = undefined;
            }));
            const domNode = DOM.$('.profile-edit-widget');
            const profileIconContainer = DOM.$('.profile-icon-container');
            DOM.append(profileIconContainer, DOM.$('.profile-icon-label', undefined, (0, nls_1.localize)('icon', "Icon:")));
            const profileIconElement = DOM.append(profileIconContainer, DOM.$(`.profile-icon${themables_1.ThemeIcon.asCSSSelector(icon)}`));
            profileIconElement.tabIndex = 0;
            profileIconElement.role = 'button';
            profileIconElement.ariaLabel = (0, nls_1.localize)('select icon', "Icon: {0}", icon.id);
            const iconSelectBox = disposables.add(this.instantiationService.createInstance(iconSelectBox_1.WorkbenchIconSelectBox, { icons: userDataProfileIcons_1.ICONS, inputBoxStyles: defaultStyles_1.defaultInputBoxStyles }));
            const dimension = new DOM.Dimension(486, 260);
            iconSelectBox.layout(dimension);
            let hoverWidget;
            const updateIcon = (updated) => {
                icon = updated ?? userDataProfileIcons_1.DEFAULT_ICON;
                profileIconElement.className = `profile-icon ${themables_1.ThemeIcon.asClassName(icon)}`;
                profileIconElement.ariaLabel = (0, nls_1.localize)('select icon', "Icon: {0}", icon.id);
            };
            disposables.add(iconSelectBox.onDidSelect(selectedIcon => {
                if (icon.id !== selectedIcon.id) {
                    updateIcon(selectedIcon);
                }
                hoverWidget?.dispose();
                profileIconElement.focus();
            }));
            const showIconSelectBox = () => {
                iconSelectBox.clearInput();
                hoverWidget = this.hoverService.showHover({
                    content: iconSelectBox.domNode,
                    target: profileIconElement,
                    position: {
                        hoverPosition: 2 /* HoverPosition.BELOW */,
                    },
                    persistence: {
                        sticky: true,
                    },
                    appearance: {
                        showPointer: true,
                    },
                }, true);
                if (hoverWidget) {
                    iconSelectBox.layout(dimension);
                    disposables.add(hoverWidget);
                }
                iconSelectBox.focus();
            };
            disposables.add(DOM.addDisposableListener(profileIconElement, DOM.EventType.CLICK, (e) => {
                DOM.EventHelper.stop(e, true);
                showIconSelectBox();
            }));
            disposables.add(DOM.addDisposableListener(profileIconElement, DOM.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    DOM.EventHelper.stop(event, true);
                    showIconSelectBox();
                }
            }));
            disposables.add(DOM.addDisposableListener(iconSelectBox.domNode, DOM.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(9 /* KeyCode.Escape */)) {
                    DOM.EventHelper.stop(event, true);
                    hoverWidget?.dispose();
                    profileIconElement.focus();
                }
            }));
            if (!profile && !isUserDataProfileTemplate(source)) {
                const profileTypeContainer = DOM.append(domNode, DOM.$('.profile-type-container'));
                DOM.append(profileTypeContainer, DOM.$('.profile-type-create-label', undefined, (0, nls_1.localize)('create from', "Copy from:")));
                const separator = { text: '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', isDisabled: true };
                const profileOptions = [];
                profileOptions.push({ text: (0, nls_1.localize)('empty profile', "None") });
                const templates = await this.userDataProfileManagementService.getBuiltinProfileTemplates();
                if (templates.length) {
                    profileOptions.push({ ...separator, decoratorRight: (0, nls_1.localize)('from templates', "Profile Templates") });
                    for (const template of templates) {
                        profileOptions.push({ text: template.name, id: template.url, source: uri_1.URI.parse(template.url) });
                    }
                }
                profileOptions.push({ ...separator, decoratorRight: (0, nls_1.localize)('from existing profiles', "Existing Profiles") });
                for (const profile of this.userDataProfilesService.profiles) {
                    profileOptions.push({ text: profile.name, id: profile.id, source: profile });
                }
                const findOptionIndex = () => {
                    const index = profileOptions.findIndex(option => {
                        if (source instanceof uri_1.URI) {
                            return option.source instanceof uri_1.URI && this.uriIdentityService.extUri.isEqual(option.source, source);
                        }
                        else if ((0, userDataProfile_2.isUserDataProfile)(source)) {
                            return option.id === source.id;
                        }
                        return false;
                    });
                    return index > -1 ? index : 0;
                };
                const initialIndex = findOptionIndex();
                const selectBox = disposables.add(this.instantiationService.createInstance(selectBox_1.SelectBox, profileOptions, initialIndex, this.contextViewService, defaultStyles_1.defaultSelectBoxStyles, {
                    useCustomDrawn: true,
                    ariaLabel: (0, nls_1.localize)('copy profile from', "Copy profile from"),
                }));
                selectBox.render(DOM.append(profileTypeContainer, DOM.$('.profile-type-select-container')));
                if (profileOptions[initialIndex].source) {
                    quickPick.value = this.generateProfileName(profileOptions[initialIndex].text);
                }
                const updateOptions = () => {
                    const option = profileOptions[findOptionIndex()];
                    for (const resource of resources) {
                        resource.picked = option.source && !(option.source instanceof uri_1.URI) ? !option.source?.useDefaultFlags?.[resource.id] : true;
                    }
                    updateIcon(!(option.source instanceof uri_1.URI) && option.source?.icon ? themables_1.ThemeIcon.fromId(option.source.icon) : undefined);
                    update();
                };
                updateOptions();
                disposables.add(selectBox.onDidSelect(({ index }) => {
                    source = profileOptions[index].source;
                    updateOptions();
                }));
            }
            DOM.append(domNode, profileIconContainer);
            quickPick.widget = domNode;
            quickPick.show();
            await new Promise((c, e) => {
                disposables.add(quickPick.onDidHide(() => {
                    disposables.dispose();
                    c();
                }));
            });
            if (!result) {
                if (profile) {
                    this.telemetryService.publicLog2('userDataProfile.cancelEdit');
                }
                else {
                    this.telemetryService.publicLog2('userDataProfile.cancelCreate', createProfileTelemetryData);
                }
                return;
            }
            try {
                const useDefaultFlags = result.items.length === resources.length
                    ? undefined
                    : {
                        settings: !result.items.includes(settings),
                        keybindings: !result.items.includes(keybindings),
                        snippets: !result.items.includes(snippets),
                        tasks: !result.items.includes(tasks),
                        extensions: !result.items.includes(extensions)
                    };
                if (profile) {
                    await this.userDataProfileManagementService.updateProfile(profile, { name: result.name, icon: result.icon, useDefaultFlags: profile.useDefaultFlags && !useDefaultFlags ? {} : useDefaultFlags });
                }
                else {
                    if (source instanceof uri_1.URI) {
                        this.telemetryService.publicLog2('userDataProfile.createFromTemplate', createProfileTelemetryData);
                        await this.importProfile(source, { mode: 'apply', name: result.name, useDefaultFlags, icon: result.icon ? result.icon : undefined });
                    }
                    else if ((0, userDataProfile_2.isUserDataProfile)(source)) {
                        this.telemetryService.publicLog2('userDataProfile.createFromProfile', createProfileTelemetryData);
                        await this.createFromProfile(source, result.name, { useDefaultFlags, icon: result.icon ? result.icon : undefined });
                    }
                    else if (isUserDataProfileTemplate(source)) {
                        source.name = result.name;
                        this.telemetryService.publicLog2('userDataProfile.createFromExternalTemplate', createProfileTelemetryData);
                        await this.createAndSwitch(source, false, true, { useDefaultFlags, icon: result.icon ? result.icon : undefined }, (0, nls_1.localize)('create profile', "Create Profile"));
                    }
                    else {
                        this.telemetryService.publicLog2('userDataProfile.createEmptyProfile', createProfileTelemetryData);
                        await this.userDataProfileManagementService.createAndEnterProfile(result.name, { useDefaultFlags, icon: result.icon ? result.icon : undefined });
                    }
                }
            }
            catch (error) {
                this.notificationService.error(error);
            }
        }
        async showProfileContents() {
            const view = this.viewsService.getViewWithId(EXPORT_PROFILE_PREVIEW_VIEW);
            if (view) {
                this.viewsService.openView(view.id, true);
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const userDataProfilesExportState = disposables.add(this.instantiationService.createInstance(UserDataProfileExportState, this.userDataProfileService.currentProfile));
                const barrier = new async_1.Barrier();
                const exportAction = new BarrierAction(barrier, new actions_1.Action('export', (0, nls_1.localize)('export', "Export"), undefined, true, async () => {
                    exportAction.enabled = false;
                    try {
                        await this.doExportProfile(userDataProfilesExportState);
                    }
                    catch (error) {
                        this.notificationService.error(error);
                        throw error;
                    }
                }), this.notificationService);
                const closeAction = new BarrierAction(barrier, new actions_1.Action('close', (0, nls_1.localize)('close', "Close")), this.notificationService);
                await this.showProfilePreviewView(EXPORT_PROFILE_PREVIEW_VIEW, userDataProfilesExportState.profile.name, exportAction, closeAction, true, userDataProfilesExportState);
                disposables.add(this.userDataProfileService.onDidChangeCurrentProfile(e => barrier.open()));
                await barrier.wait();
                await this.hideProfilePreviewView(EXPORT_PROFILE_PREVIEW_VIEW);
            }
            finally {
                disposables.dispose();
            }
        }
        async createFromProfile(profile, name, options) {
            const userDataProfilesExportState = this.instantiationService.createInstance(UserDataProfileExportState, profile);
            try {
                const profileTemplate = await userDataProfilesExportState.getProfileTemplate(name, options?.icon);
                await this.progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    delay: 500,
                    sticky: true,
                }, async (progress) => {
                    const reportProgress = (message) => progress.report({ message: (0, nls_1.localize)('create from profile', "Create Profile: {0}", message) });
                    const createdProfile = await this.doCreateProfile(profileTemplate, false, false, { useDefaultFlags: options?.useDefaultFlags, icon: options?.icon }, reportProgress);
                    if (createdProfile) {
                        reportProgress((0, nls_1.localize)('progress extensions', "Applying Extensions..."));
                        await this.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).copy(profile, createdProfile, false);
                        reportProgress((0, nls_1.localize)('switching profile', "Switching Profile..."));
                        await this.userDataProfileManagementService.switchProfile(createdProfile);
                    }
                });
            }
            finally {
                userDataProfilesExportState.dispose();
            }
        }
        async createTroubleshootProfile() {
            const userDataProfilesExportState = this.instantiationService.createInstance(UserDataProfileExportState, this.userDataProfileService.currentProfile);
            try {
                const profileTemplate = await userDataProfilesExportState.getProfileTemplate((0, nls_1.localize)('troubleshoot issue', "Troubleshoot Issue"), undefined);
                await this.progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    delay: 1000,
                    sticky: true,
                }, async (progress) => {
                    const reportProgress = (message) => progress.report({ message: (0, nls_1.localize)('troubleshoot profile progress', "Setting up Troubleshoot Profile: {0}", message) });
                    const profile = await this.doCreateProfile(profileTemplate, true, false, { useDefaultFlags: this.userDataProfileService.currentProfile.useDefaultFlags }, reportProgress);
                    if (profile) {
                        reportProgress((0, nls_1.localize)('progress extensions', "Applying Extensions..."));
                        await this.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).copy(this.userDataProfileService.currentProfile, profile, true);
                        reportProgress((0, nls_1.localize)('switching profile', "Switching Profile..."));
                        await this.userDataProfileManagementService.switchProfile(profile);
                    }
                });
            }
            finally {
                userDataProfilesExportState.dispose();
            }
        }
        async doExportProfile(userDataProfilesExportState) {
            const profile = await userDataProfilesExportState.getProfileToExport();
            if (!profile) {
                return;
            }
            this.isProfileExportInProgressContextKey.set(true);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, lifecycle_1.toDisposable)(() => this.isProfileExportInProgressContextKey.set(false)));
            try {
                await this.progressService.withProgress({
                    location: EXPORT_PROFILE_PREVIEW_VIEW,
                    title: (0, nls_1.localize)('profiles.exporting', "{0}: Exporting...", userDataProfile_1.PROFILES_CATEGORY.value),
                }, async (progress) => {
                    const id = await this.pickProfileContentHandler(profile.name);
                    if (!id) {
                        return;
                    }
                    const profileContentHandler = this.profileContentHandlers.get(id);
                    if (!profileContentHandler) {
                        return;
                    }
                    const saveResult = await profileContentHandler.saveProfile(profile.name.replace('/', '-'), JSON.stringify(profile), cancellation_1.CancellationToken.None);
                    if (!saveResult) {
                        return;
                    }
                    const message = (0, nls_1.localize)('export success', "Profile '{0}' was exported successfully.", profile.name);
                    if (profileContentHandler.extensionId) {
                        const buttons = [];
                        const link = this.productService.webUrl ? `${this.productService.webUrl}/${userDataProfile_1.PROFILE_URL_AUTHORITY}/${id}/${saveResult.id}` : (0, userDataProfile_1.toUserDataProfileUri)(`/${id}/${saveResult.id}`, this.productService).toString();
                        buttons.push({
                            label: (0, nls_1.localize)({ key: 'copy', comment: ['&& denotes a mnemonic'] }, "&&Copy Link"),
                            run: () => this.clipboardService.writeText(link)
                        });
                        if (this.productService.webUrl) {
                            buttons.push({
                                label: (0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, "&&Open Link"),
                                run: async () => {
                                    await this.openerService.open(link);
                                }
                            });
                        }
                        else {
                            buttons.push({
                                label: (0, nls_1.localize)({ key: 'open in', comment: ['&& denotes a mnemonic'] }, "&&Open in {0}", profileContentHandler.name),
                                run: async () => {
                                    await this.openerService.open(saveResult.link.toString());
                                }
                            });
                        }
                        await this.dialogService.prompt({
                            type: severity_1.default.Info,
                            message,
                            buttons,
                            cancelButton: (0, nls_1.localize)('close', "Close")
                        });
                    }
                    else {
                        await this.dialogService.info(message);
                    }
                });
            }
            finally {
                disposables.dispose();
            }
        }
        async resolveProfileTemplate(uri, options) {
            const profileContent = await this.resolveProfileContent(uri);
            if (profileContent === null) {
                return null;
            }
            const profileTemplate = JSON.parse(profileContent);
            if (!isUserDataProfileTemplate(profileTemplate)) {
                throw new Error('Invalid profile content.');
            }
            if (options?.name) {
                profileTemplate.name = options.name;
            }
            if (options?.icon) {
                profileTemplate.icon = options.icon;
            }
            return profileTemplate;
        }
        async importAndPreviewProfile(uri, profileTemplate, options) {
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const userDataProfileImportState = disposables.add(this.instantiationService.createInstance(UserDataProfileImportState, profileTemplate));
                profileTemplate = await userDataProfileImportState.getProfileTemplateToImport();
                const importedProfile = await this.createAndSwitch(profileTemplate, true, false, options, (0, nls_1.localize)('preview profile', "Preview Profile"));
                if (!importedProfile) {
                    return;
                }
                const barrier = new async_1.Barrier();
                const importAction = this.getCreateAction(barrier, userDataProfileImportState);
                const primaryAction = platform_2.isWeb
                    ? new actions_1.Action('importInDesktop', (0, nls_1.localize)('import in desktop', "Create Profile in {0}", this.productService.nameLong), undefined, true, async () => this.openerService.open(uri, { openExternal: true }))
                    : importAction;
                const secondaryAction = platform_2.isWeb
                    ? importAction
                    : new BarrierAction(barrier, new actions_1.Action('close', (0, nls_1.localize)('close', "Close")), this.notificationService);
                const view = await this.showProfilePreviewView(IMPORT_PROFILE_PREVIEW_VIEW, importedProfile.name, primaryAction, secondaryAction, false, userDataProfileImportState);
                const message = new htmlContent_1.MarkdownString();
                message.appendMarkdown((0, nls_1.localize)('preview profile message', "By default, extensions aren't installed when previewing a profile on the web. You can still install them manually before importing the profile. "));
                message.appendMarkdown(`[${(0, nls_1.localize)('learn more', "Learn more")}](https://aka.ms/vscode-extension-marketplace#_can-i-trust-extensions-from-the-marketplace).`);
                view.setMessage(message);
                const that = this;
                const disposable = disposables.add((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: 'previewProfile.installExtensions',
                            title: (0, nls_1.localize)('install extensions title', "Install Extensions"),
                            icon: codicons_1.Codicon.cloudDownload,
                            menu: {
                                id: actions_2.MenuId.ViewItemContext,
                                group: 'inline',
                                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', IMPORT_PROFILE_PREVIEW_VIEW), contextkey_1.ContextKeyExpr.equals('viewItem', "extensions" /* ProfileResourceType.Extensions */)),
                            }
                        });
                    }
                    async run() {
                        return that.progressService.withProgress({
                            location: IMPORT_PROFILE_PREVIEW_VIEW,
                        }, async (progress) => {
                            view.setMessage(undefined);
                            const profileTemplate = await userDataProfileImportState.getProfileTemplateToImport();
                            if (profileTemplate.extensions) {
                                await that.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).apply(profileTemplate.extensions, importedProfile);
                            }
                            disposable.dispose();
                        });
                    }
                }));
                disposables.add(event_1.Event.debounce(this.extensionManagementService.onDidInstallExtensions, () => undefined, 100)(async () => {
                    const profileTemplate = await userDataProfileImportState.getProfileTemplateToImport();
                    if (profileTemplate.extensions) {
                        const profileExtensions = await that.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).getProfileExtensions(profileTemplate.extensions);
                        const installed = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */);
                        if (profileExtensions.every(e => installed.some(i => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, i.identifier)))) {
                            disposable.dispose();
                        }
                    }
                }));
                await barrier.wait();
                await this.hideProfilePreviewView(IMPORT_PROFILE_PREVIEW_VIEW);
            }
            finally {
                disposables.dispose();
            }
        }
        async previewProfile(profileTemplate, options) {
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const userDataProfileImportState = disposables.add(this.instantiationService.createInstance(UserDataProfileImportState, profileTemplate));
                if (userDataProfileImportState.isEmpty()) {
                    await this.createAndSwitch(profileTemplate, false, true, options, (0, nls_1.localize)('create profile', "Create Profile"));
                }
                else {
                    const barrier = new async_1.Barrier();
                    const cancelAction = new BarrierAction(barrier, new actions_1.Action('cancel', (0, nls_1.localize)('cancel', "Cancel")), this.notificationService);
                    const importAction = this.getCreateAction(barrier, userDataProfileImportState, cancelAction);
                    await this.showProfilePreviewView(IMPORT_PROFILE_PREVIEW_VIEW, profileTemplate.name, importAction, cancelAction, false, userDataProfileImportState);
                    await barrier.wait();
                    await this.hideProfilePreviewView(IMPORT_PROFILE_PREVIEW_VIEW);
                }
            }
            finally {
                disposables.dispose();
            }
        }
        getCreateAction(barrier, userDataProfileImportState, cancelAction) {
            const importAction = new BarrierAction(barrier, new actions_1.Action('title', (0, nls_1.localize)('import', "Create Profile"), undefined, true, async () => {
                importAction.enabled = false;
                if (cancelAction) {
                    cancelAction.enabled = false;
                }
                const profileTemplate = await userDataProfileImportState.getProfileTemplateToImport();
                return this.saveProfile(undefined, profileTemplate);
            }), this.notificationService);
            return importAction;
        }
        async createAndSwitch(profileTemplate, temporaryProfile, extensions, options, title) {
            return this.progressService.withProgress({
                location: 15 /* ProgressLocation.Notification */,
                delay: 500,
                sticky: true,
            }, async (progress) => {
                title = `${title} (${profileTemplate.name})`;
                progress.report({ message: title });
                const reportProgress = (message) => progress.report({ message: `${title}: ${message}` });
                const profile = await this.doCreateProfile(profileTemplate, temporaryProfile, extensions, options, reportProgress);
                if (profile) {
                    reportProgress((0, nls_1.localize)('switching profile', "Switching Profile..."));
                    await this.userDataProfileManagementService.switchProfile(profile);
                }
                return profile;
            });
        }
        async doCreateProfile(profileTemplate, temporaryProfile, extensions, options, progress) {
            const profile = await this.getProfileToImport(profileTemplate, temporaryProfile, options);
            if (!profile) {
                return undefined;
            }
            if (profileTemplate.settings && !profile.useDefaultFlags?.settings) {
                progress((0, nls_1.localize)('progress settings', "Applying Settings..."));
                await this.instantiationService.createInstance(settingsResource_1.SettingsResource).apply(profileTemplate.settings, profile);
            }
            if (profileTemplate.keybindings && !profile.useDefaultFlags?.keybindings) {
                progress((0, nls_1.localize)('progress keybindings', "Applying Keyboard Shortcuts..."));
                await this.instantiationService.createInstance(keybindingsResource_1.KeybindingsResource).apply(profileTemplate.keybindings, profile);
            }
            if (profileTemplate.tasks && !profile.useDefaultFlags?.tasks) {
                progress((0, nls_1.localize)('progress tasks', "Applying Tasks..."));
                await this.instantiationService.createInstance(tasksResource_1.TasksResource).apply(profileTemplate.tasks, profile);
            }
            if (profileTemplate.snippets && !profile.useDefaultFlags?.snippets) {
                progress((0, nls_1.localize)('progress snippets', "Applying Snippets..."));
                await this.instantiationService.createInstance(snippetsResource_1.SnippetsResource).apply(profileTemplate.snippets, profile);
            }
            if (profileTemplate.globalState && !profile.useDefaultFlags?.globalState) {
                progress((0, nls_1.localize)('progress global state', "Applying State..."));
                await this.instantiationService.createInstance(globalStateResource_1.GlobalStateResource).apply(profileTemplate.globalState, profile);
            }
            if (profileTemplate.extensions && extensions && !profile.useDefaultFlags?.extensions) {
                progress((0, nls_1.localize)('progress extensions', "Applying Extensions..."));
                await this.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).apply(profileTemplate.extensions, profile);
            }
            return profile;
        }
        async resolveProfileContent(resource) {
            if (await this.fileUserDataProfileContentHandler.canHandle(resource)) {
                return this.fileUserDataProfileContentHandler.readProfile(resource, cancellation_1.CancellationToken.None);
            }
            if (this.isProfileURL(resource)) {
                let handlerId, idOrUri;
                if (resource.authority === userDataProfile_1.PROFILE_URL_AUTHORITY) {
                    idOrUri = this.uriIdentityService.extUri.basename(resource);
                    handlerId = this.uriIdentityService.extUri.basename(this.uriIdentityService.extUri.dirname(resource));
                }
                else {
                    handlerId = resource.authority.substring(UserDataProfileImportExportService_1.PROFILE_URL_AUTHORITY_PREFIX.length);
                    idOrUri = uri_1.URI.parse(resource.path.substring(1));
                }
                await this.extensionService.activateByEvent(`onProfile:${handlerId}`);
                const profileContentHandler = this.profileContentHandlers.get(handlerId);
                if (profileContentHandler) {
                    return profileContentHandler.readProfile(idOrUri, cancellation_1.CancellationToken.None);
                }
            }
            await this.extensionService.activateByEvent('onProfile');
            for (const profileContentHandler of this.profileContentHandlers.values()) {
                const content = await profileContentHandler.readProfile(resource, cancellation_1.CancellationToken.None);
                if (content !== null) {
                    return content;
                }
            }
            const context = await this.requestService.request({ type: 'GET', url: resource.toString(true) }, cancellation_1.CancellationToken.None);
            if (context.res.statusCode === 200) {
                return await (0, request_1.asText)(context);
            }
            else {
                const message = await (0, request_1.asText)(context);
                throw new Error(`Failed to get profile from URL: ${resource.toString()}. Status code: ${context.res.statusCode}. Message: ${message}`);
            }
        }
        async pickProfileContentHandler(name) {
            await this.extensionService.activateByEvent('onProfile');
            if (this.profileContentHandlers.size === 1) {
                return this.profileContentHandlers.keys().next().value;
            }
            const options = [];
            for (const [id, profileContentHandler] of this.profileContentHandlers) {
                options.push({ id, label: profileContentHandler.name, description: profileContentHandler.description });
            }
            const result = await this.quickInputService.pick(options.reverse(), {
                title: (0, nls_1.localize)('select profile content handler', "Export '{0}' profile as...", name),
                hideInput: true
            });
            return result?.id;
        }
        async getProfileToImport(profileTemplate, temp, options) {
            const profileName = profileTemplate.name;
            const profile = this.userDataProfilesService.profiles.find(p => p.name === profileName);
            if (profile) {
                if (temp) {
                    return this.userDataProfilesService.createNamedProfile(`${profileName} ${this.getProfileNameIndex(profileName)}`, { ...options, transient: temp });
                }
                let ImportProfileChoice;
                (function (ImportProfileChoice) {
                    ImportProfileChoice[ImportProfileChoice["Overwrite"] = 0] = "Overwrite";
                    ImportProfileChoice[ImportProfileChoice["CreateNew"] = 1] = "CreateNew";
                    ImportProfileChoice[ImportProfileChoice["Cancel"] = 2] = "Cancel";
                })(ImportProfileChoice || (ImportProfileChoice = {}));
                const { result } = await this.dialogService.prompt({
                    type: severity_1.default.Info,
                    message: (0, nls_1.localize)('profile already exists', "Profile with name '{0}' already exists. Do you want to overwrite it?", profileName),
                    buttons: [
                        {
                            label: (0, nls_1.localize)({ key: 'overwrite', comment: ['&& denotes a mnemonic'] }, "&&Overwrite"),
                            run: () => ImportProfileChoice.Overwrite
                        },
                        {
                            label: (0, nls_1.localize)({ key: 'create new', comment: ['&& denotes a mnemonic'] }, "&&Create New Profile"),
                            run: () => ImportProfileChoice.CreateNew
                        },
                    ],
                    cancelButton: {
                        run: () => ImportProfileChoice.Cancel
                    }
                });
                if (result === ImportProfileChoice.Overwrite) {
                    return profile;
                }
                if (result === ImportProfileChoice.Cancel) {
                    return undefined;
                }
                // Create new profile
                const name = await this.quickInputService.input({
                    placeHolder: (0, nls_1.localize)('name', "Profile name"),
                    title: (0, nls_1.localize)('create new title', "Create New Profile"),
                    value: `${profileName} ${this.getProfileNameIndex(profileName)}`,
                    validateInput: async (value) => {
                        if (this.userDataProfilesService.profiles.some(p => p.name === value)) {
                            return (0, nls_1.localize)('profileExists', "Profile with name {0} already exists.", value);
                        }
                        return undefined;
                    }
                });
                if (!name) {
                    return undefined;
                }
                return this.userDataProfilesService.createNamedProfile(name);
            }
            else {
                return this.userDataProfilesService.createNamedProfile(profileName, { ...options, transient: temp });
            }
        }
        generateProfileName(profileName) {
            const existingProfile = this.userDataProfilesService.profiles.find(p => p.name === profileName);
            return existingProfile ? `${profileName} ${this.getProfileNameIndex(profileName)}` : profileName;
        }
        getProfileNameIndex(name) {
            const nameRegEx = new RegExp(`${(0, strings_1.escapeRegExpCharacters)(name)}\\s(\\d+)`);
            let nameIndex = 0;
            for (const profile of this.userDataProfilesService.profiles) {
                const matches = nameRegEx.exec(profile.name);
                const index = matches ? parseInt(matches[1]) : 0;
                nameIndex = index > nameIndex ? index : nameIndex;
            }
            return nameIndex + 1;
        }
        async showProfilePreviewView(id, name, primary, secondary, refreshAction, userDataProfilesData) {
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name);
            if (refreshAction) {
                treeView.showRefreshAction = true;
            }
            const actionRunner = new actions_1.ActionRunner();
            const descriptor = {
                id,
                name: { value: name, original: name },
                ctorDescriptor: new descriptors_1.SyncDescriptor(UserDataProfilePreviewViewPane, [userDataProfilesData, primary, secondary, actionRunner]),
                canToggleVisibility: false,
                canMoveView: false,
                treeView,
                collapsed: false,
            };
            viewsRegistry.registerViews([descriptor], this.viewContainer);
            return (await this.viewsService.openView(id, true));
        }
        async hideProfilePreviewView(id) {
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            const viewDescriptor = viewsRegistry.getView(id);
            if (viewDescriptor) {
                viewDescriptor.treeView.dispose();
                viewsRegistry.deregisterViews([viewDescriptor], this.viewContainer);
            }
            await this.closeAllImportExportPreviewEditors();
        }
        async closeAllImportExportPreviewEditors() {
            const editorsToColse = this.editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */).filter(({ editor }) => editor.resource?.scheme === USER_DATA_PROFILE_EXPORT_SCHEME || editor.resource?.scheme === USER_DATA_PROFILE_EXPORT_PREVIEW_SCHEME || editor.resource?.scheme === USER_DATA_PROFILE_IMPORT_PREVIEW_SCHEME);
            if (editorsToColse.length) {
                await this.editorService.closeEditors(editorsToColse);
            }
        }
        async setProfile(profile) {
            await this.progressService.withProgress({
                location: 15 /* ProgressLocation.Notification */,
                title: (0, nls_1.localize)('profiles.applying', "{0}: Applying...", userDataProfile_1.PROFILES_CATEGORY.value),
            }, async (progress) => {
                if (profile.settings) {
                    await this.instantiationService.createInstance(settingsResource_1.SettingsResource).apply(profile.settings, this.userDataProfileService.currentProfile);
                }
                if (profile.globalState) {
                    await this.instantiationService.createInstance(globalStateResource_1.GlobalStateResource).apply(profile.globalState, this.userDataProfileService.currentProfile);
                }
                if (profile.extensions) {
                    await this.instantiationService.createInstance(extensionsResource_1.ExtensionsResource).apply(profile.extensions, this.userDataProfileService.currentProfile);
                }
            });
            this.notificationService.info((0, nls_1.localize)('applied profile', "{0}: Applied successfully.", userDataProfile_1.PROFILES_CATEGORY.value));
        }
    };
    exports.UserDataProfileImportExportService = UserDataProfileImportExportService;
    exports.UserDataProfileImportExportService = UserDataProfileImportExportService = UserDataProfileImportExportService_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, viewsService_1.IViewsService),
        __param(3, editorService_1.IEditorService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, userDataProfile_1.IUserDataProfileManagementService),
        __param(6, userDataProfile_2.IUserDataProfilesService),
        __param(7, extensions_2.IExtensionService),
        __param(8, extensionManagement_1.IExtensionManagementService),
        __param(9, quickInput_1.IQuickInputService),
        __param(10, notification_1.INotificationService),
        __param(11, progress_1.IProgressService),
        __param(12, dialogs_1.IDialogService),
        __param(13, clipboardService_1.IClipboardService),
        __param(14, opener_1.IOpenerService),
        __param(15, request_1.IRequestService),
        __param(16, url_1.IURLService),
        __param(17, productService_1.IProductService),
        __param(18, uriIdentity_1.IUriIdentityService),
        __param(19, telemetry_1.ITelemetryService),
        __param(20, contextView_1.IContextViewService),
        __param(21, hover_1.IHoverService),
        __param(22, log_1.ILogService)
    ], UserDataProfileImportExportService);
    let FileUserDataProfileContentHandler = class FileUserDataProfileContentHandler {
        constructor(fileDialogService, uriIdentityService, fileService, textFileService) {
            this.fileDialogService = fileDialogService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.name = (0, nls_1.localize)('local', "Local");
            this.description = (0, nls_1.localize)('file', "file");
        }
        async saveProfile(name, content, token) {
            const link = await this.fileDialogService.showSaveDialog({
                title: (0, nls_1.localize)('export profile dialog', "Save Profile"),
                filters: userDataProfile_1.PROFILE_FILTER,
                defaultUri: this.uriIdentityService.extUri.joinPath(await this.fileDialogService.defaultFilePath(), `${name}.${userDataProfile_1.PROFILE_EXTENSION}`),
            });
            if (!link) {
                return null;
            }
            await this.textFileService.create([{ resource: link, value: content, options: { overwrite: true } }]);
            return { link, id: link.toString() };
        }
        async canHandle(uri) {
            return uri.scheme !== network_1.Schemas.http && uri.scheme !== network_1.Schemas.https && await this.fileService.canHandleResource(uri);
        }
        async readProfile(uri, token) {
            if (await this.canHandle(uri)) {
                return (await this.fileService.readFile(uri, undefined, token)).value.toString();
            }
            return null;
        }
        async selectProfile() {
            const profileLocation = await this.fileDialogService.showOpenDialog({
                canSelectFolders: false,
                canSelectFiles: true,
                canSelectMany: false,
                filters: userDataProfile_1.PROFILE_FILTER,
                title: (0, nls_1.localize)('select profile', "Select Profile"),
            });
            return profileLocation ? profileLocation[0] : null;
        }
    };
    FileUserDataProfileContentHandler = __decorate([
        __param(0, dialogs_1.IFileDialogService),
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService)
    ], FileUserDataProfileContentHandler);
    let UserDataProfilePreviewViewPane = class UserDataProfilePreviewViewPane extends treeView_1.TreeViewPane {
        constructor(userDataProfileData, primaryAction, secondaryAction, actionRunner, options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, notificationService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, notificationService);
            this.userDataProfileData = userDataProfileData;
            this.primaryAction = primaryAction;
            this.secondaryAction = secondaryAction;
            this.actionRunner = actionRunner;
            this.totalTreeItemsCount = 0;
            this.renderDisposables = this._register(new lifecycle_1.DisposableStore());
        }
        renderTreeView(container) {
            this.treeView.dataProvider = this.userDataProfileData;
            super.renderTreeView(DOM.append(container, DOM.$('.profile-view-tree-container')));
            this.messageContainer = DOM.append(container, DOM.$('.profile-view-message-container.hide'));
            this.createButtons(container);
            this._register(this.treeView.onDidChangeCheckboxState(() => this.updateConfirmButtonEnablement()));
            this.computeAndLayout();
            this._register(event_1.Event.any(this.userDataProfileData.onDidChangeRoots, this.treeView.onDidCollapseItem, this.treeView.onDidExpandItem)(() => this.computeAndLayout()));
        }
        async computeAndLayout() {
            const roots = await this.userDataProfileData.getRoots();
            const children = await Promise.all(roots.map(async (root) => {
                let expanded = root.collapsibleState === views_1.TreeItemCollapsibleState.Expanded;
                try {
                    expanded = !this.treeView.isCollapsed(root);
                }
                catch (error) { /* Ignore because element might not be added yet */ }
                if (expanded) {
                    const children = await root.getChildren();
                    return children ?? [];
                }
                return [];
            }));
            this.totalTreeItemsCount = roots.length + children.flat().length;
            this.updateConfirmButtonEnablement();
            if (this.dimension) {
                this.layoutTreeView(this.dimension.height, this.dimension.width);
            }
        }
        createButtons(container) {
            this.buttonsContainer = DOM.append(container, DOM.$('.profile-view-buttons-container'));
            this.primaryButton = this._register(new button_1.Button(this.buttonsContainer, { ...defaultStyles_1.defaultButtonStyles }));
            this.primaryButton.element.classList.add('profile-view-button');
            this.primaryButton.label = this.primaryAction.label;
            this.primaryButton.enabled = this.primaryAction.enabled;
            this._register(this.primaryButton.onDidClick(() => this.actionRunner.run(this.primaryAction)));
            this._register(this.primaryAction.onDidChange(e => {
                if (e.enabled !== undefined) {
                    this.primaryButton.enabled = e.enabled;
                }
            }));
            this.secondaryButton = this._register(new button_1.Button(this.buttonsContainer, { secondary: true, ...defaultStyles_1.defaultButtonStyles }));
            this.secondaryButton.label = this.secondaryAction.label;
            this.secondaryButton.element.classList.add('profile-view-button');
            this.secondaryButton.enabled = this.secondaryAction.enabled;
            this._register(this.secondaryButton.onDidClick(() => this.actionRunner.run(this.secondaryAction)));
            this._register(this.secondaryAction.onDidChange(e => {
                if (e.enabled !== undefined) {
                    this.secondaryButton.enabled = e.enabled;
                }
            }));
        }
        layoutTreeView(height, width) {
            this.dimension = new DOM.Dimension(width, height);
            let messageContainerHeight = 0;
            if (!this.messageContainer.classList.contains('hide')) {
                messageContainerHeight = DOM.getClientArea(this.messageContainer).height;
            }
            const buttonContainerHeight = 108;
            this.buttonsContainer.style.height = `${buttonContainerHeight}px`;
            this.buttonsContainer.style.width = `${width}px`;
            super.layoutTreeView(Math.min(height - buttonContainerHeight - messageContainerHeight, 22 * this.totalTreeItemsCount), width);
        }
        updateConfirmButtonEnablement() {
            this.primaryButton.enabled = this.primaryAction.enabled && this.userDataProfileData.isEnabled();
        }
        setMessage(message) {
            this.messageContainer.classList.toggle('hide', !message);
            DOM.clearNode(this.messageContainer);
            if (message) {
                this.renderDisposables.clear();
                const rendered = this.renderDisposables.add((0, markdownRenderer_1.renderMarkdown)(message, {
                    actionHandler: {
                        callback: (content) => {
                            this.openerService.open(content, { allowCommands: true }).catch(errors_1.onUnexpectedError);
                        },
                        disposables: this.renderDisposables
                    }
                }));
                DOM.append(this.messageContainer, rendered.element);
            }
        }
        refresh() {
            return this.treeView.refresh();
        }
    };
    UserDataProfilePreviewViewPane = __decorate([
        __param(5, keybinding_1.IKeybindingService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, views_1.IViewDescriptorService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, opener_1.IOpenerService),
        __param(12, themeService_1.IThemeService),
        __param(13, telemetry_1.ITelemetryService),
        __param(14, notification_1.INotificationService)
    ], UserDataProfilePreviewViewPane);
    const USER_DATA_PROFILE_EXPORT_SCHEME = 'userdataprofileexport';
    const USER_DATA_PROFILE_EXPORT_PREVIEW_SCHEME = 'userdataprofileexportpreview';
    const USER_DATA_PROFILE_IMPORT_PREVIEW_SCHEME = 'userdataprofileimportpreview';
    let UserDataProfileImportExportState = class UserDataProfileImportExportState extends lifecycle_1.Disposable {
        constructor(quickInputService) {
            super();
            this.quickInputService = quickInputService;
            this._onDidChangeRoots = this._register(new event_1.Emitter());
            this.onDidChangeRoots = this._onDidChangeRoots.event;
            this.roots = [];
        }
        async getChildren(element) {
            if (element) {
                const children = await element.getChildren();
                if (children) {
                    for (const child of children) {
                        if (child.parent.checkbox && child.checkbox) {
                            child.checkbox.isChecked = child.parent.checkbox.isChecked && child.checkbox.isChecked;
                        }
                    }
                }
                return children;
            }
            else {
                this.rootsPromise = undefined;
                this._onDidChangeRoots.fire();
                return this.getRoots();
            }
        }
        getRoots() {
            if (!this.rootsPromise) {
                this.rootsPromise = (async () => {
                    this.roots = await this.fetchRoots();
                    for (const root of this.roots) {
                        root.checkbox = {
                            isChecked: !root.isFromDefaultProfile(),
                            tooltip: (0, nls_1.localize)('select', "Select {0}", root.label.label),
                            accessibilityInformation: {
                                label: (0, nls_1.localize)('select', "Select {0}", root.label.label),
                            }
                        };
                        if (root.isFromDefaultProfile()) {
                            root.description = (0, nls_1.localize)('from default', "From Default Profile");
                        }
                    }
                    return this.roots;
                })();
            }
            return this.rootsPromise;
        }
        isEnabled(resourceType) {
            if (resourceType !== undefined) {
                return this.roots.some(root => root.type === resourceType && this.isSelected(root));
            }
            return this.roots.some(root => this.isSelected(root));
        }
        async getProfileTemplate(name, icon) {
            const roots = await this.getRoots();
            let settings;
            let keybindings;
            let tasks;
            let snippets;
            let extensions;
            let globalState;
            for (const root of roots) {
                if (!this.isSelected(root)) {
                    continue;
                }
                if (root instanceof settingsResource_1.SettingsResourceTreeItem) {
                    settings = await root.getContent();
                }
                else if (root instanceof keybindingsResource_1.KeybindingsResourceTreeItem) {
                    keybindings = await root.getContent();
                }
                else if (root instanceof tasksResource_1.TasksResourceTreeItem) {
                    tasks = await root.getContent();
                }
                else if (root instanceof snippetsResource_1.SnippetsResourceTreeItem) {
                    snippets = await root.getContent();
                }
                else if (root instanceof extensionsResource_1.ExtensionsResourceTreeItem) {
                    extensions = await root.getContent();
                }
                else if (root instanceof globalStateResource_1.GlobalStateResourceTreeItem) {
                    globalState = await root.getContent();
                }
            }
            return {
                name,
                icon,
                settings,
                keybindings,
                tasks,
                snippets,
                extensions,
                globalState
            };
        }
        isSelected(treeItem) {
            if (treeItem.checkbox) {
                return treeItem.checkbox.isChecked || !!treeItem.children?.some(child => child.checkbox?.isChecked);
            }
            return true;
        }
    };
    UserDataProfileImportExportState = __decorate([
        __param(0, quickInput_1.IQuickInputService)
    ], UserDataProfileImportExportState);
    let UserDataProfileExportState = class UserDataProfileExportState extends UserDataProfileImportExportState {
        constructor(profile, quickInputService, fileService, instantiationService) {
            super(quickInputService);
            this.profile = profile;
            this.fileService = fileService;
            this.instantiationService = instantiationService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
        }
        async fetchRoots() {
            this.disposables.clear();
            this.disposables.add(this.fileService.registerProvider(USER_DATA_PROFILE_EXPORT_SCHEME, this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
            const previewFileSystemProvider = this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            this.disposables.add(this.fileService.registerProvider(USER_DATA_PROFILE_EXPORT_PREVIEW_SCHEME, previewFileSystemProvider));
            const roots = [];
            const exportPreviewProfle = this.createExportPreviewProfile(this.profile);
            const settingsResource = this.instantiationService.createInstance(settingsResource_1.SettingsResource);
            const settingsContent = await settingsResource.getContent(this.profile);
            await settingsResource.apply(settingsContent, exportPreviewProfle);
            const settingsResourceTreeItem = this.instantiationService.createInstance(settingsResource_1.SettingsResourceTreeItem, exportPreviewProfle);
            if (await settingsResourceTreeItem.hasContent()) {
                roots.push(settingsResourceTreeItem);
            }
            const keybindingsResource = this.instantiationService.createInstance(keybindingsResource_1.KeybindingsResource);
            const keybindingsContent = await keybindingsResource.getContent(this.profile);
            await keybindingsResource.apply(keybindingsContent, exportPreviewProfle);
            const keybindingsResourceTreeItem = this.instantiationService.createInstance(keybindingsResource_1.KeybindingsResourceTreeItem, exportPreviewProfle);
            if (await keybindingsResourceTreeItem.hasContent()) {
                roots.push(keybindingsResourceTreeItem);
            }
            const snippetsResource = this.instantiationService.createInstance(snippetsResource_1.SnippetsResource);
            const snippetsContent = await snippetsResource.getContent(this.profile);
            await snippetsResource.apply(snippetsContent, exportPreviewProfle);
            const snippetsResourceTreeItem = this.instantiationService.createInstance(snippetsResource_1.SnippetsResourceTreeItem, exportPreviewProfle);
            if (await snippetsResourceTreeItem.hasContent()) {
                roots.push(snippetsResourceTreeItem);
            }
            const tasksResource = this.instantiationService.createInstance(tasksResource_1.TasksResource);
            const tasksContent = await tasksResource.getContent(this.profile);
            await tasksResource.apply(tasksContent, exportPreviewProfle);
            const tasksResourceTreeItem = this.instantiationService.createInstance(tasksResource_1.TasksResourceTreeItem, exportPreviewProfle);
            if (await tasksResourceTreeItem.hasContent()) {
                roots.push(tasksResourceTreeItem);
            }
            const globalStateResource = (0, resources_1.joinPath)(exportPreviewProfle.globalStorageHome, 'globalState.json').with({ scheme: USER_DATA_PROFILE_EXPORT_PREVIEW_SCHEME });
            const globalStateResourceTreeItem = this.instantiationService.createInstance(globalStateResource_1.GlobalStateResourceExportTreeItem, exportPreviewProfle, globalStateResource);
            const content = await globalStateResourceTreeItem.getContent();
            if (content) {
                await this.fileService.writeFile(globalStateResource, buffer_1.VSBuffer.fromString(JSON.stringify(JSON.parse(content), null, '\t')));
                roots.push(globalStateResourceTreeItem);
            }
            const extensionsResourceTreeItem = this.instantiationService.createInstance(extensionsResource_1.ExtensionsResourceExportTreeItem, exportPreviewProfle);
            if (await extensionsResourceTreeItem.hasContent()) {
                roots.push(extensionsResourceTreeItem);
            }
            previewFileSystemProvider.setReadOnly(true);
            return roots;
        }
        createExportPreviewProfile(profile) {
            return {
                id: profile.id,
                name: profile.name,
                location: profile.location,
                isDefault: profile.isDefault,
                shortName: profile.shortName,
                icon: profile.icon,
                globalStorageHome: profile.globalStorageHome,
                settingsResource: profile.settingsResource.with({ scheme: USER_DATA_PROFILE_EXPORT_SCHEME }),
                keybindingsResource: profile.keybindingsResource.with({ scheme: USER_DATA_PROFILE_EXPORT_SCHEME }),
                tasksResource: profile.tasksResource.with({ scheme: USER_DATA_PROFILE_EXPORT_SCHEME }),
                snippetsHome: profile.snippetsHome.with({ scheme: USER_DATA_PROFILE_EXPORT_SCHEME }),
                extensionsResource: profile.extensionsResource,
                cacheHome: profile.cacheHome,
                useDefaultFlags: profile.useDefaultFlags,
                isTransient: profile.isTransient
            };
        }
        async getProfileToExport() {
            let name = this.profile.name;
            if (this.profile.isDefault) {
                name = await this.quickInputService.input({
                    placeHolder: (0, nls_1.localize)('export profile name', "Name the profile"),
                    title: (0, nls_1.localize)('export profile title', "Export Profile"),
                    async validateInput(input) {
                        if (!input.trim()) {
                            return (0, nls_1.localize)('profile name required', "Profile name must be provided.");
                        }
                        return undefined;
                    },
                });
                if (!name) {
                    return null;
                }
            }
            return super.getProfileTemplate(name, this.profile.icon);
        }
    };
    UserDataProfileExportState = __decorate([
        __param(1, quickInput_1.IQuickInputService),
        __param(2, files_1.IFileService),
        __param(3, instantiation_1.IInstantiationService)
    ], UserDataProfileExportState);
    let UserDataProfileImportState = class UserDataProfileImportState extends UserDataProfileImportExportState {
        constructor(profile, fileService, quickInputService, instantiationService) {
            super(quickInputService);
            this.profile = profile;
            this.fileService = fileService;
            this.instantiationService = instantiationService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
        }
        async fetchRoots() {
            this.disposables.clear();
            const inMemoryProvider = this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            this.disposables.add(this.fileService.registerProvider(USER_DATA_PROFILE_IMPORT_PREVIEW_SCHEME, inMemoryProvider));
            const roots = [];
            const importPreviewProfle = (0, userDataProfile_2.toUserDataProfile)((0, uuid_1.generateUuid)(), this.profile.name, uri_1.URI.file('/root').with({ scheme: USER_DATA_PROFILE_IMPORT_PREVIEW_SCHEME }), uri_1.URI.file('/cache').with({ scheme: USER_DATA_PROFILE_IMPORT_PREVIEW_SCHEME }));
            if (this.profile.settings) {
                const settingsResource = this.instantiationService.createInstance(settingsResource_1.SettingsResource);
                await settingsResource.apply(this.profile.settings, importPreviewProfle);
                const settingsResourceTreeItem = this.instantiationService.createInstance(settingsResource_1.SettingsResourceTreeItem, importPreviewProfle);
                if (await settingsResourceTreeItem.hasContent()) {
                    roots.push(settingsResourceTreeItem);
                }
            }
            if (this.profile.keybindings) {
                const keybindingsResource = this.instantiationService.createInstance(keybindingsResource_1.KeybindingsResource);
                await keybindingsResource.apply(this.profile.keybindings, importPreviewProfle);
                const keybindingsResourceTreeItem = this.instantiationService.createInstance(keybindingsResource_1.KeybindingsResourceTreeItem, importPreviewProfle);
                if (await keybindingsResourceTreeItem.hasContent()) {
                    roots.push(keybindingsResourceTreeItem);
                }
            }
            if (this.profile.snippets) {
                const snippetsResource = this.instantiationService.createInstance(snippetsResource_1.SnippetsResource);
                await snippetsResource.apply(this.profile.snippets, importPreviewProfle);
                const snippetsResourceTreeItem = this.instantiationService.createInstance(snippetsResource_1.SnippetsResourceTreeItem, importPreviewProfle);
                if (await snippetsResourceTreeItem.hasContent()) {
                    roots.push(snippetsResourceTreeItem);
                }
            }
            if (this.profile.tasks) {
                const tasksResource = this.instantiationService.createInstance(tasksResource_1.TasksResource);
                await tasksResource.apply(this.profile.tasks, importPreviewProfle);
                const tasksResourceTreeItem = this.instantiationService.createInstance(tasksResource_1.TasksResourceTreeItem, importPreviewProfle);
                if (await tasksResourceTreeItem.hasContent()) {
                    roots.push(tasksResourceTreeItem);
                }
            }
            if (this.profile.globalState) {
                const globalStateResource = (0, resources_1.joinPath)(importPreviewProfle.globalStorageHome, 'globalState.json');
                const content = buffer_1.VSBuffer.fromString(JSON.stringify(JSON.parse(this.profile.globalState), null, '\t'));
                if (content) {
                    await this.fileService.writeFile(globalStateResource, content);
                    roots.push(this.instantiationService.createInstance(globalStateResource_1.GlobalStateResourceImportTreeItem, this.profile.globalState, globalStateResource));
                }
            }
            if (this.profile.extensions) {
                const extensionsResourceTreeItem = this.instantiationService.createInstance(extensionsResource_1.ExtensionsResourceImportTreeItem, this.profile.extensions);
                if (await extensionsResourceTreeItem.hasContent()) {
                    roots.push(extensionsResourceTreeItem);
                }
            }
            inMemoryProvider.setReadOnly(true);
            return roots;
        }
        isEmpty() {
            return !(this.profile.settings || this.profile.keybindings || this.profile.tasks || this.profile.snippets || this.profile.globalState || this.profile.extensions);
        }
        async getProfileTemplateToImport() {
            return this.getProfileTemplate(this.profile.name, this.profile.icon);
        }
    };
    UserDataProfileImportState = __decorate([
        __param(1, files_1.IFileService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, instantiation_1.IInstantiationService)
    ], UserDataProfileImportState);
    class BarrierAction extends actions_1.Action {
        constructor(barrier, action, notificationService) {
            super(action.id, action.label, action.class, action.enabled, async () => {
                try {
                    await action.run();
                }
                catch (error) {
                    notificationService.error(error);
                    throw error;
                }
                barrier.open();
            });
        }
    }
    (0, extensions_1.registerSingleton)(userDataProfile_1.IUserDataProfileImportExportService, UserDataProfileImportExportService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlSW1wb3J0RXhwb3J0U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhUHJvZmlsZS9icm93c2VyL3VzZXJEYXRhUHJvZmlsZUltcG9ydEV4cG9ydFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTJGaEcsU0FBUyx5QkFBeUIsQ0FBQyxLQUFjO1FBQ2hELE1BQU0sU0FBUyxHQUFHLEtBQTZDLENBQUM7UUFFaEUsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksT0FBTyxTQUFTLEtBQUssUUFBUTtlQUNoRCxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksT0FBTyxTQUFTLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQztlQUN0RCxDQUFDLElBQUEsbUJBQVcsRUFBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksT0FBTyxTQUFTLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQztlQUNuRSxDQUFDLElBQUEsbUJBQVcsRUFBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksT0FBTyxTQUFTLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQztlQUMzRSxDQUFDLElBQUEsbUJBQVcsRUFBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksT0FBTyxTQUFTLENBQUMsV0FBVyxLQUFLLFFBQVEsQ0FBQztlQUNqRixDQUFDLElBQUEsbUJBQVcsRUFBQyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksT0FBTyxTQUFTLENBQUMsVUFBVSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDdEYsQ0FBQztJQUVELE1BQU0sMkJBQTJCLEdBQUcseUNBQXlDLENBQUM7SUFDOUUsTUFBTSwyQkFBMkIsR0FBRyx5Q0FBeUMsQ0FB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