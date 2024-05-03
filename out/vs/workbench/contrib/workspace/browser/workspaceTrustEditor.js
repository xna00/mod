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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/linkedText", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextview/browser/contextView", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/opener/browser/link", "vs/platform/registry/common/platform", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/debug/browser/debugColors", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/path", "vs/base/common/extpath", "vs/base/browser/keyboardEvent", "vs/platform/product/common/productService", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/browser/defaultStyles", "vs/base/common/platform", "vs/platform/keybinding/common/keybinding", "vs/base/common/resources"], function (require, exports, dom_1, actionbar_1, button_1, inputBox_1, scrollableElement_1, actions_1, codicons_1, decorators_1, event_1, labels_1, lifecycle_1, linkedText_1, network_1, uri_1, nls_1, configurationRegistry_1, contextView_1, dialogs_1, instantiation_1, label_1, listService_1, link_1, platform_1, virtualWorkspace_1, storage_1, telemetry_1, colorRegistry_1, workspace_1, themeService_1, themables_1, workspaceTrust_1, editorPane_1, debugColors_1, extensions_1, configuration_1, extensionManifestPropertiesService_1, uriIdentity_1, extensionManagementUtil_1, extensionManagement_1, path_1, extpath_1, keyboardEvent_1, productService_1, iconRegistry_1, defaultStyles_1, platform_2, keybinding_1, resources_1) {
    "use strict";
    var TrustedUriActionsColumnRenderer_1, TrustedUriPathColumnRenderer_1, TrustedUriHostColumnRenderer_1, WorkspaceTrustEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTrustEditor = exports.shieldIcon = void 0;
    exports.shieldIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-banner', codicons_1.Codicon.shield, (0, nls_1.localize)('shieldIcon', 'Icon for workspace trust ion the banner.'));
    const checkListIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-check', codicons_1.Codicon.check, (0, nls_1.localize)('checkListIcon', 'Icon for the checkmark in the workspace trust editor.'));
    const xListIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-cross', codicons_1.Codicon.x, (0, nls_1.localize)('xListIcon', 'Icon for the cross in the workspace trust editor.'));
    const folderPickerIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-folder-picker', codicons_1.Codicon.folder, (0, nls_1.localize)('folderPickerIcon', 'Icon for the pick folder icon in the workspace trust editor.'));
    const editIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-edit-folder', codicons_1.Codicon.edit, (0, nls_1.localize)('editIcon', 'Icon for the edit folder icon in the workspace trust editor.'));
    const removeIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-remove-folder', codicons_1.Codicon.close, (0, nls_1.localize)('removeIcon', 'Icon for the remove folder icon in the workspace trust editor.'));
    let WorkspaceTrustedUrisTable = class WorkspaceTrustedUrisTable extends lifecycle_1.Disposable {
        constructor(container, instantiationService, workspaceService, workspaceTrustManagementService, uriService, labelService, fileDialogService) {
            super();
            this.container = container;
            this.instantiationService = instantiationService;
            this.workspaceService = workspaceService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.uriService = uriService;
            this.labelService = labelService;
            this.fileDialogService = fileDialogService;
            this._onDidAcceptEdit = this._register(new event_1.Emitter());
            this.onDidAcceptEdit = this._onDidAcceptEdit.event;
            this._onDidRejectEdit = this._register(new event_1.Emitter());
            this.onDidRejectEdit = this._onDidRejectEdit.event;
            this._onEdit = this._register(new event_1.Emitter());
            this.onEdit = this._onEdit.event;
            this._onDelete = this._register(new event_1.Emitter());
            this.onDelete = this._onDelete.event;
            this.descriptionElement = container.appendChild((0, dom_1.$)('.workspace-trusted-folders-description'));
            const tableElement = container.appendChild((0, dom_1.$)('.trusted-uris-table'));
            const addButtonBarElement = container.appendChild((0, dom_1.$)('.trusted-uris-button-bar'));
            this.table = this.instantiationService.createInstance(listService_1.WorkbenchTable, 'WorkspaceTrust', tableElement, new TrustedUriTableVirtualDelegate(), [
                {
                    label: (0, nls_1.localize)('hostColumnLabel', "Host"),
                    tooltip: '',
                    weight: 1,
                    templateId: TrustedUriHostColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('pathColumnLabel', "Path"),
                    tooltip: '',
                    weight: 8,
                    templateId: TrustedUriPathColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: '',
                    tooltip: '',
                    weight: 1,
                    minimumWidth: 75,
                    maximumWidth: 75,
                    templateId: TrustedUriActionsColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
            ], [
                this.instantiationService.createInstance(TrustedUriHostColumnRenderer),
                this.instantiationService.createInstance(TrustedUriPathColumnRenderer, this),
                this.instantiationService.createInstance(TrustedUriActionsColumnRenderer, this, this.currentWorkspaceUri),
            ], {
                horizontalScrolling: false,
                alwaysConsumeMouseWheel: false,
                openOnSingleClick: false,
                multipleSelectionSupport: false,
                accessibilityProvider: {
                    getAriaLabel: (item) => {
                        const hostLabel = getHostLabel(this.labelService, item);
                        if (hostLabel === undefined || hostLabel.length === 0) {
                            return (0, nls_1.localize)('trustedFolderAriaLabel', "{0}, trusted", this.labelService.getUriLabel(item.uri));
                        }
                        return (0, nls_1.localize)('trustedFolderWithHostAriaLabel', "{0} on {1}, trusted", this.labelService.getUriLabel(item.uri), hostLabel);
                    },
                    getWidgetAriaLabel: () => (0, nls_1.localize)('trustedFoldersAndWorkspaces', "Trusted Folders & Workspaces")
                },
                identityProvider: {
                    getId(element) {
                        return element.uri.toString();
                    },
                }
            });
            this._register(this.table.onDidOpen(item => {
                // default prevented when input box is double clicked #125052
                if (item && item.element && !item.browserEvent?.defaultPrevented) {
                    this.edit(item.element, true);
                }
            }));
            const buttonBar = this._register(new button_1.ButtonBar(addButtonBarElement));
            const addButton = this._register(buttonBar.addButton({ title: (0, nls_1.localize)('addButton', "Add Folder"), ...defaultStyles_1.defaultButtonStyles }));
            addButton.label = (0, nls_1.localize)('addButton', "Add Folder");
            this._register(addButton.onDidClick(async () => {
                const uri = await this.fileDialogService.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    defaultUri: this.currentWorkspaceUri,
                    openLabel: (0, nls_1.localize)('trustUri', "Trust Folder"),
                    title: (0, nls_1.localize)('selectTrustedUri', "Select Folder To Trust")
                });
                if (uri) {
                    this.workspaceTrustManagementService.setUrisTrust(uri, true);
                }
            }));
            this._register(this.workspaceTrustManagementService.onDidChangeTrustedFolders(() => {
                this.updateTable();
            }));
        }
        getIndexOfTrustedUriEntry(item) {
            const index = this.trustedUriEntries.indexOf(item);
            if (index === -1) {
                for (let i = 0; i < this.trustedUriEntries.length; i++) {
                    if (this.trustedUriEntries[i].uri === item.uri) {
                        return i;
                    }
                }
            }
            return index;
        }
        selectTrustedUriEntry(item, focus = true) {
            const index = this.getIndexOfTrustedUriEntry(item);
            if (index !== -1) {
                if (focus) {
                    this.table.domFocus();
                    this.table.setFocus([index]);
                }
                this.table.setSelection([index]);
            }
        }
        get currentWorkspaceUri() {
            return this.workspaceService.getWorkspace().folders[0]?.uri || uri_1.URI.file('/');
        }
        get trustedUriEntries() {
            const currentWorkspace = this.workspaceService.getWorkspace();
            const currentWorkspaceUris = currentWorkspace.folders.map(folder => folder.uri);
            if (currentWorkspace.configuration) {
                currentWorkspaceUris.push(currentWorkspace.configuration);
            }
            const entries = this.workspaceTrustManagementService.getTrustedUris().map(uri => {
                let relatedToCurrentWorkspace = false;
                for (const workspaceUri of currentWorkspaceUris) {
                    relatedToCurrentWorkspace = relatedToCurrentWorkspace || this.uriService.extUri.isEqualOrParent(workspaceUri, uri);
                }
                return {
                    uri,
                    parentOfWorkspaceItem: relatedToCurrentWorkspace
                };
            });
            // Sort entries
            const sortedEntries = entries.sort((a, b) => {
                if (a.uri.scheme !== b.uri.scheme) {
                    if (a.uri.scheme === network_1.Schemas.file) {
                        return -1;
                    }
                    if (b.uri.scheme === network_1.Schemas.file) {
                        return 1;
                    }
                }
                const aIsWorkspace = a.uri.path.endsWith('.code-workspace');
                const bIsWorkspace = b.uri.path.endsWith('.code-workspace');
                if (aIsWorkspace !== bIsWorkspace) {
                    if (aIsWorkspace) {
                        return 1;
                    }
                    if (bIsWorkspace) {
                        return -1;
                    }
                }
                return a.uri.fsPath.localeCompare(b.uri.fsPath);
            });
            return sortedEntries;
        }
        layout() {
            this.table.layout((this.trustedUriEntries.length * TrustedUriTableVirtualDelegate.ROW_HEIGHT) + TrustedUriTableVirtualDelegate.HEADER_ROW_HEIGHT, undefined);
        }
        updateTable() {
            const entries = this.trustedUriEntries;
            this.container.classList.toggle('empty', entries.length === 0);
            this.descriptionElement.innerText = entries.length ?
                (0, nls_1.localize)('trustedFoldersDescription', "You trust the following folders, their subfolders, and workspace files.") :
                (0, nls_1.localize)('noTrustedFoldersDescriptions', "You haven't trusted any folders or workspace files yet.");
            this.table.splice(0, Number.POSITIVE_INFINITY, this.trustedUriEntries);
            this.layout();
        }
        validateUri(path, item) {
            if (!item) {
                return null;
            }
            if (item.uri.scheme === 'vscode-vfs') {
                const segments = path.split(path_1.posix.sep).filter(s => s.length);
                if (segments.length === 0 && path.startsWith(path_1.posix.sep)) {
                    return {
                        type: 2 /* MessageType.WARNING */,
                        content: (0, nls_1.localize)({ key: 'trustAll', comment: ['The {0} will be a host name where repositories are hosted.'] }, "You will trust all repositories on {0}.", getHostLabel(this.labelService, item))
                    };
                }
                if (segments.length === 1) {
                    return {
                        type: 2 /* MessageType.WARNING */,
                        content: (0, nls_1.localize)({ key: 'trustOrg', comment: ['The {0} will be an organization or user name.', 'The {1} will be a host name where repositories are hosted.'] }, "You will trust all repositories and forks under '{0}' on {1}.", segments[0], getHostLabel(this.labelService, item))
                    };
                }
                if (segments.length > 2) {
                    return {
                        type: 3 /* MessageType.ERROR */,
                        content: (0, nls_1.localize)('invalidTrust', "You cannot trust individual folders within a repository.", path)
                    };
                }
            }
            return null;
        }
        acceptEdit(item, uri) {
            const trustedFolders = this.workspaceTrustManagementService.getTrustedUris();
            const index = trustedFolders.findIndex(u => this.uriService.extUri.isEqual(u, item.uri));
            if (index >= trustedFolders.length || index === -1) {
                trustedFolders.push(uri);
            }
            else {
                trustedFolders[index] = uri;
            }
            this.workspaceTrustManagementService.setTrustedUris(trustedFolders);
            this._onDidAcceptEdit.fire(item);
        }
        rejectEdit(item) {
            this._onDidRejectEdit.fire(item);
        }
        async delete(item) {
            this.table.focusNext();
            await this.workspaceTrustManagementService.setUrisTrust([item.uri], false);
            if (this.table.getFocus().length === 0) {
                this.table.focusLast();
            }
            this._onDelete.fire(item);
            this.table.domFocus();
        }
        async edit(item, usePickerIfPossible) {
            const canUseOpenDialog = item.uri.scheme === network_1.Schemas.file ||
                (item.uri.scheme === this.currentWorkspaceUri.scheme &&
                    this.uriService.extUri.isEqualAuthority(this.currentWorkspaceUri.authority, item.uri.authority) &&
                    !(0, virtualWorkspace_1.isVirtualResource)(item.uri));
            if (canUseOpenDialog && usePickerIfPossible) {
                const uri = await this.fileDialogService.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    defaultUri: item.uri,
                    openLabel: (0, nls_1.localize)('trustUri', "Trust Folder"),
                    title: (0, nls_1.localize)('selectTrustedUri', "Select Folder To Trust")
                });
                if (uri) {
                    this.acceptEdit(item, uri[0]);
                }
                else {
                    this.rejectEdit(item);
                }
            }
            else {
                this.selectTrustedUriEntry(item);
                this._onEdit.fire(item);
            }
        }
    };
    WorkspaceTrustedUrisTable = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, label_1.ILabelService),
        __param(6, dialogs_1.IFileDialogService)
    ], WorkspaceTrustedUrisTable);
    class TrustedUriTableVirtualDelegate {
        constructor() {
            this.headerRowHeight = TrustedUriTableVirtualDelegate.HEADER_ROW_HEIGHT;
        }
        static { this.HEADER_ROW_HEIGHT = 30; }
        static { this.ROW_HEIGHT = 24; }
        getHeight(item) {
            return TrustedUriTableVirtualDelegate.ROW_HEIGHT;
        }
    }
    let TrustedUriActionsColumnRenderer = class TrustedUriActionsColumnRenderer {
        static { TrustedUriActionsColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'actions'; }
        constructor(table, currentWorkspaceUri, uriService) {
            this.table = table;
            this.currentWorkspaceUri = currentWorkspaceUri;
            this.uriService = uriService;
            this.templateId = TrustedUriActionsColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const element = container.appendChild((0, dom_1.$)('.actions'));
            const actionBar = new actionbar_1.ActionBar(element);
            return { actionBar };
        }
        renderElement(item, index, templateData, height) {
            templateData.actionBar.clear();
            const canUseOpenDialog = item.uri.scheme === network_1.Schemas.file ||
                (item.uri.scheme === this.currentWorkspaceUri.scheme &&
                    this.uriService.extUri.isEqualAuthority(this.currentWorkspaceUri.authority, item.uri.authority) &&
                    !(0, virtualWorkspace_1.isVirtualResource)(item.uri));
            const actions = [];
            if (canUseOpenDialog) {
                actions.push(this.createPickerAction(item));
            }
            actions.push(this.createEditAction(item));
            actions.push(this.createDeleteAction(item));
            templateData.actionBar.push(actions, { icon: true });
        }
        createEditAction(item) {
            return {
                class: themables_1.ThemeIcon.asClassName(editIcon),
                enabled: true,
                id: 'editTrustedUri',
                tooltip: (0, nls_1.localize)('editTrustedUri', "Edit Path"),
                run: () => {
                    this.table.edit(item, false);
                }
            };
        }
        createPickerAction(item) {
            return {
                class: themables_1.ThemeIcon.asClassName(folderPickerIcon),
                enabled: true,
                id: 'pickerTrustedUri',
                tooltip: (0, nls_1.localize)('pickerTrustedUri', "Open File Picker"),
                run: () => {
                    this.table.edit(item, true);
                }
            };
        }
        createDeleteAction(item) {
            return {
                class: themables_1.ThemeIcon.asClassName(removeIcon),
                enabled: true,
                id: 'deleteTrustedUri',
                tooltip: (0, nls_1.localize)('deleteTrustedUri', "Delete Path"),
                run: async () => {
                    await this.table.delete(item);
                }
            };
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    };
    TrustedUriActionsColumnRenderer = TrustedUriActionsColumnRenderer_1 = __decorate([
        __param(2, uriIdentity_1.IUriIdentityService)
    ], TrustedUriActionsColumnRenderer);
    let TrustedUriPathColumnRenderer = class TrustedUriPathColumnRenderer {
        static { TrustedUriPathColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'path'; }
        constructor(table, contextViewService) {
            this.table = table;
            this.contextViewService = contextViewService;
            this.templateId = TrustedUriPathColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const element = container.appendChild((0, dom_1.$)('.path'));
            const pathLabel = element.appendChild((0, dom_1.$)('div.path-label'));
            const pathInput = new inputBox_1.InputBox(element, this.contextViewService, {
                validationOptions: {
                    validation: value => this.table.validateUri(value, this.currentItem)
                },
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles
            });
            const disposables = new lifecycle_1.DisposableStore();
            const renderDisposables = disposables.add(new lifecycle_1.DisposableStore());
            return {
                element,
                pathLabel,
                pathInput,
                disposables,
                renderDisposables
            };
        }
        renderElement(item, index, templateData, height) {
            templateData.renderDisposables.clear();
            this.currentItem = item;
            templateData.renderDisposables.add(this.table.onEdit(async (e) => {
                if (item === e) {
                    templateData.element.classList.add('input-mode');
                    templateData.pathInput.focus();
                    templateData.pathInput.select();
                    templateData.element.parentElement.style.paddingLeft = '0px';
                }
            }));
            // stop double click action from re-rendering the element on the table #125052
            templateData.renderDisposables.add((0, dom_1.addDisposableListener)(templateData.pathInput.element, dom_1.EventType.DBLCLICK, e => {
                dom_1.EventHelper.stop(e);
            }));
            const hideInputBox = () => {
                templateData.element.classList.remove('input-mode');
                templateData.element.parentElement.style.paddingLeft = '5px';
            };
            const accept = () => {
                hideInputBox();
                const pathToUse = templateData.pathInput.value;
                const uri = (0, extpath_1.hasDriveLetter)(pathToUse) ? item.uri.with({ path: path_1.posix.sep + (0, extpath_1.toSlashes)(pathToUse) }) : item.uri.with({ path: pathToUse });
                templateData.pathLabel.innerText = this.formatPath(uri);
                if (uri) {
                    this.table.acceptEdit(item, uri);
                }
            };
            const reject = () => {
                hideInputBox();
                templateData.pathInput.value = stringValue;
                this.table.rejectEdit(item);
            };
            templateData.renderDisposables.add((0, dom_1.addStandardDisposableListener)(templateData.pathInput.inputElement, dom_1.EventType.KEY_DOWN, e => {
                let handled = false;
                if (e.equals(3 /* KeyCode.Enter */)) {
                    accept();
                    handled = true;
                }
                else if (e.equals(9 /* KeyCode.Escape */)) {
                    reject();
                    handled = true;
                }
                if (handled) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }));
            templateData.renderDisposables.add(((0, dom_1.addDisposableListener)(templateData.pathInput.inputElement, dom_1.EventType.BLUR, () => {
                reject();
            })));
            const stringValue = this.formatPath(item.uri);
            templateData.pathInput.value = stringValue;
            templateData.pathLabel.innerText = stringValue;
            templateData.element.classList.toggle('current-workspace-parent', item.parentOfWorkspaceItem);
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
            templateData.renderDisposables.dispose();
        }
        formatPath(uri) {
            if (uri.scheme === network_1.Schemas.file) {
                return (0, labels_1.normalizeDriveLetter)(uri.fsPath);
            }
            // If the path is not a file uri, but points to a windows remote, we should create windows fs path
            // e.g. /c:/user/directory => C:\user\directory
            if (uri.path.startsWith(path_1.posix.sep)) {
                const pathWithoutLeadingSeparator = uri.path.substring(1);
                const isWindowsPath = (0, extpath_1.hasDriveLetter)(pathWithoutLeadingSeparator, true);
                if (isWindowsPath) {
                    return (0, labels_1.normalizeDriveLetter)(path_1.win32.normalize(pathWithoutLeadingSeparator), true);
                }
            }
            return uri.path;
        }
    };
    TrustedUriPathColumnRenderer = TrustedUriPathColumnRenderer_1 = __decorate([
        __param(1, contextView_1.IContextViewService)
    ], TrustedUriPathColumnRenderer);
    function getHostLabel(labelService, item) {
        return item.uri.authority ? labelService.getHostLabel(item.uri.scheme, item.uri.authority) : (0, nls_1.localize)('localAuthority', "Local");
    }
    let TrustedUriHostColumnRenderer = class TrustedUriHostColumnRenderer {
        static { TrustedUriHostColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'host'; }
        constructor(labelService) {
            this.labelService = labelService;
            this.templateId = TrustedUriHostColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const disposables = new lifecycle_1.DisposableStore();
            const renderDisposables = disposables.add(new lifecycle_1.DisposableStore());
            const element = container.appendChild((0, dom_1.$)('.host'));
            const hostContainer = element.appendChild((0, dom_1.$)('div.host-label'));
            const buttonBarContainer = element.appendChild((0, dom_1.$)('div.button-bar'));
            return {
                element,
                hostContainer,
                buttonBarContainer,
                disposables,
                renderDisposables
            };
        }
        renderElement(item, index, templateData, height) {
            templateData.renderDisposables.clear();
            templateData.renderDisposables.add({ dispose: () => { (0, dom_1.clearNode)(templateData.buttonBarContainer); } });
            templateData.hostContainer.innerText = getHostLabel(this.labelService, item);
            templateData.element.classList.toggle('current-workspace-parent', item.parentOfWorkspaceItem);
            templateData.hostContainer.style.display = '';
            templateData.buttonBarContainer.style.display = 'none';
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    TrustedUriHostColumnRenderer = TrustedUriHostColumnRenderer_1 = __decorate([
        __param(0, label_1.ILabelService)
    ], TrustedUriHostColumnRenderer);
    let WorkspaceTrustEditor = class WorkspaceTrustEditor extends editorPane_1.EditorPane {
        static { WorkspaceTrustEditor_1 = this; }
        static { this.ID = 'workbench.editor.workspaceTrust'; }
        constructor(group, telemetryService, themeService, storageService, workspaceService, extensionWorkbenchService, extensionManifestPropertiesService, instantiationService, workspaceTrustManagementService, configurationService, extensionEnablementService, productService, keybindingService) {
            super(WorkspaceTrustEditor_1.ID, group, telemetryService, themeService, storageService);
            this.workspaceService = workspaceService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.instantiationService = instantiationService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.configurationService = configurationService;
            this.extensionEnablementService = extensionEnablementService;
            this.productService = productService;
            this.keybindingService = keybindingService;
            this.rendering = false;
            this.rerenderDisposables = this._register(new lifecycle_1.DisposableStore());
            this.layoutParticipants = [];
        }
        createEditor(parent) {
            this.rootElement = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-editor', { tabindex: '0' }));
            this.createHeaderElement(this.rootElement);
            const scrollableContent = (0, dom_1.$)('.workspace-trust-editor-body');
            this.bodyScrollBar = this._register(new scrollableElement_1.DomScrollableElement(scrollableContent, {
                horizontal: 2 /* ScrollbarVisibility.Hidden */,
                vertical: 1 /* ScrollbarVisibility.Auto */,
            }));
            (0, dom_1.append)(this.rootElement, this.bodyScrollBar.getDomNode());
            this.createAffectedFeaturesElement(scrollableContent);
            this.createConfigurationElement(scrollableContent);
            this.rootElement.style.setProperty('--workspace-trust-selected-color', (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonBackground));
            this.rootElement.style.setProperty('--workspace-trust-unselected-color', (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonSecondaryBackground));
            this.rootElement.style.setProperty('--workspace-trust-check-color', (0, colorRegistry_1.asCssVariable)(debugColors_1.debugIconStartForeground));
            this.rootElement.style.setProperty('--workspace-trust-x-color', (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorErrorForeground));
            // Navigate page with keyboard
            this._register((0, dom_1.addDisposableListener)(this.rootElement, dom_1.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(16 /* KeyCode.UpArrow */) || event.equals(18 /* KeyCode.DownArrow */)) {
                    const navOrder = [this.headerContainer, this.trustedContainer, this.untrustedContainer, this.configurationContainer];
                    const currentIndex = navOrder.findIndex(element => {
                        return (0, dom_1.isAncestorOfActiveElement)(element);
                    });
                    let newIndex = currentIndex;
                    if (event.equals(18 /* KeyCode.DownArrow */)) {
                        newIndex++;
                    }
                    else if (event.equals(16 /* KeyCode.UpArrow */)) {
                        newIndex = Math.max(0, newIndex);
                        newIndex--;
                    }
                    newIndex += navOrder.length;
                    newIndex %= navOrder.length;
                    navOrder[newIndex].focus();
                }
                else if (event.equals(9 /* KeyCode.Escape */)) {
                    this.rootElement.focus();
                }
                else if (event.equals(2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */)) {
                    if (this.workspaceTrustManagementService.canSetWorkspaceTrust()) {
                        this.workspaceTrustManagementService.setWorkspaceTrust(!this.workspaceTrustManagementService.isWorkspaceTrusted());
                    }
                }
                else if (event.equals(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */)) {
                    if (this.workspaceTrustManagementService.canSetParentFolderTrust()) {
                        this.workspaceTrustManagementService.setParentFolderTrust(true);
                    }
                }
            }));
        }
        focus() {
            super.focus();
            this.rootElement.focus();
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            if (token.isCancellationRequested) {
                return;
            }
            await this.workspaceTrustManagementService.workspaceTrustInitialized;
            this.registerListeners();
            await this.render();
        }
        registerListeners() {
            this._register(this.extensionWorkbenchService.onChange(() => this.render()));
            this._register(this.configurationService.onDidChangeRestrictedSettings(() => this.render()));
            this._register(this.workspaceTrustManagementService.onDidChangeTrust(() => this.render()));
            this._register(this.workspaceTrustManagementService.onDidChangeTrustedFolders(() => this.render()));
        }
        getHeaderContainerClass(trusted) {
            if (trusted) {
                return 'workspace-trust-header workspace-trust-trusted';
            }
            return 'workspace-trust-header workspace-trust-untrusted';
        }
        getHeaderTitleText(trusted) {
            if (trusted) {
                if (this.workspaceTrustManagementService.isWorkspaceTrustForced()) {
                    return (0, nls_1.localize)('trustedUnsettableWindow', "This window is trusted");
                }
                switch (this.workspaceService.getWorkbenchState()) {
                    case 1 /* WorkbenchState.EMPTY */:
                        return (0, nls_1.localize)('trustedHeaderWindow', "You trust this window");
                    case 2 /* WorkbenchState.FOLDER */:
                        return (0, nls_1.localize)('trustedHeaderFolder', "You trust this folder");
                    case 3 /* WorkbenchState.WORKSPACE */:
                        return (0, nls_1.localize)('trustedHeaderWorkspace', "You trust this workspace");
                }
            }
            return (0, nls_1.localize)('untrustedHeader', "You are in Restricted Mode");
        }
        getHeaderTitleIconClassNames(trusted) {
            return themables_1.ThemeIcon.asClassNameArray(exports.shieldIcon);
        }
        getFeaturesHeaderText(trusted) {
            let title = '';
            let subTitle = '';
            switch (this.workspaceService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */: {
                    title = trusted ? (0, nls_1.localize)('trustedWindow', "In a Trusted Window") : (0, nls_1.localize)('untrustedWorkspace', "In Restricted Mode");
                    subTitle = trusted ? (0, nls_1.localize)('trustedWindowSubtitle', "You trust the authors of the files in the current window. All features are enabled:") :
                        (0, nls_1.localize)('untrustedWindowSubtitle', "You do not trust the authors of the files in the current window. The following features are disabled:");
                    break;
                }
                case 2 /* WorkbenchState.FOLDER */: {
                    title = trusted ? (0, nls_1.localize)('trustedFolder', "In a Trusted Folder") : (0, nls_1.localize)('untrustedWorkspace', "In Restricted Mode");
                    subTitle = trusted ? (0, nls_1.localize)('trustedFolderSubtitle', "You trust the authors of the files in the current folder. All features are enabled:") :
                        (0, nls_1.localize)('untrustedFolderSubtitle', "You do not trust the authors of the files in the current folder. The following features are disabled:");
                    break;
                }
                case 3 /* WorkbenchState.WORKSPACE */: {
                    title = trusted ? (0, nls_1.localize)('trustedWorkspace', "In a Trusted Workspace") : (0, nls_1.localize)('untrustedWorkspace', "In Restricted Mode");
                    subTitle = trusted ? (0, nls_1.localize)('trustedWorkspaceSubtitle', "You trust the authors of the files in the current workspace. All features are enabled:") :
                        (0, nls_1.localize)('untrustedWorkspaceSubtitle', "You do not trust the authors of the files in the current workspace. The following features are disabled:");
                    break;
                }
            }
            return [title, subTitle];
        }
        async render() {
            if (this.rendering) {
                return;
            }
            this.rendering = true;
            this.rerenderDisposables.clear();
            const isWorkspaceTrusted = this.workspaceTrustManagementService.isWorkspaceTrusted();
            this.rootElement.classList.toggle('trusted', isWorkspaceTrusted);
            this.rootElement.classList.toggle('untrusted', !isWorkspaceTrusted);
            // Header Section
            this.headerTitleText.innerText = this.getHeaderTitleText(isWorkspaceTrusted);
            this.headerTitleIcon.className = 'workspace-trust-title-icon';
            this.headerTitleIcon.classList.add(...this.getHeaderTitleIconClassNames(isWorkspaceTrusted));
            this.headerDescription.innerText = '';
            const headerDescriptionText = (0, dom_1.append)(this.headerDescription, (0, dom_1.$)('div'));
            headerDescriptionText.innerText = isWorkspaceTrusted ?
                (0, nls_1.localize)('trustedDescription', "All features are enabled because trust has been granted to the workspace.") :
                (0, nls_1.localize)('untrustedDescription', "{0} is in a restricted mode intended for safe code browsing.", this.productService.nameShort);
            const headerDescriptionActions = (0, dom_1.append)(this.headerDescription, (0, dom_1.$)('div'));
            const headerDescriptionActionsText = (0, nls_1.localize)({ key: 'workspaceTrustEditorHeaderActions', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[Configure your settings]({0}) or [learn more](https://aka.ms/vscode-workspace-trust).", `command:workbench.trust.configure`);
            for (const node of (0, linkedText_1.parseLinkedText)(headerDescriptionActionsText).nodes) {
                if (typeof node === 'string') {
                    (0, dom_1.append)(headerDescriptionActions, document.createTextNode(node));
                }
                else {
                    this.rerenderDisposables.add(this.instantiationService.createInstance(link_1.Link, headerDescriptionActions, { ...node, tabIndex: -1 }, {}));
                }
            }
            this.headerContainer.className = this.getHeaderContainerClass(isWorkspaceTrusted);
            this.rootElement.setAttribute('aria-label', `${(0, nls_1.localize)('root element label', "Manage Workspace Trust")}:  ${this.headerContainer.innerText}`);
            // Settings
            const restrictedSettings = this.configurationService.restrictedSettings;
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            const settingsRequiringTrustedWorkspaceCount = restrictedSettings.default.filter(key => {
                const property = configurationRegistry.getConfigurationProperties()[key];
                // cannot be configured in workspace
                if (property.scope === 1 /* ConfigurationScope.APPLICATION */ || property.scope === 2 /* ConfigurationScope.MACHINE */) {
                    return false;
                }
                // If deprecated include only those configured in the workspace
                if (property.deprecationMessage || property.markdownDeprecationMessage) {
                    if (restrictedSettings.workspace?.includes(key)) {
                        return true;
                    }
                    if (restrictedSettings.workspaceFolder) {
                        for (const workspaceFolderSettings of restrictedSettings.workspaceFolder.values()) {
                            if (workspaceFolderSettings.includes(key)) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
                return true;
            }).length;
            // Features List
            this.renderAffectedFeatures(settingsRequiringTrustedWorkspaceCount, this.getExtensionCount());
            // Configuration Tree
            this.workspaceTrustedUrisTable.updateTable();
            this.bodyScrollBar.getDomNode().style.height = `calc(100% - ${this.headerContainer.clientHeight}px)`;
            this.bodyScrollBar.scanDomNode();
            this.rendering = false;
        }
        getExtensionCount() {
            const set = new Set();
            const inVirtualWorkspace = (0, virtualWorkspace_1.isVirtualWorkspace)(this.workspaceService.getWorkspace());
            const localExtensions = this.extensionWorkbenchService.local.filter(ext => ext.local).map(ext => ext.local);
            for (const extension of localExtensions) {
                const enablementState = this.extensionEnablementService.getEnablementState(extension);
                if (enablementState !== 8 /* EnablementState.EnabledGlobally */ && enablementState !== 9 /* EnablementState.EnabledWorkspace */ &&
                    enablementState !== 0 /* EnablementState.DisabledByTrustRequirement */ && enablementState !== 5 /* EnablementState.DisabledByExtensionDependency */) {
                    continue;
                }
                if (inVirtualWorkspace && this.extensionManifestPropertiesService.getExtensionVirtualWorkspaceSupportType(extension.manifest) === false) {
                    continue;
                }
                if (this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(extension.manifest) !== true) {
                    set.add(extension.identifier.id);
                    continue;
                }
                const dependencies = (0, extensionManagementUtil_1.getExtensionDependencies)(localExtensions, extension);
                if (dependencies.some(ext => this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(ext.manifest) === false)) {
                    set.add(extension.identifier.id);
                }
            }
            return set.size;
        }
        createHeaderElement(parent) {
            this.headerContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-header', { tabIndex: '0' }));
            this.headerTitleContainer = (0, dom_1.append)(this.headerContainer, (0, dom_1.$)('.workspace-trust-title'));
            this.headerTitleIcon = (0, dom_1.append)(this.headerTitleContainer, (0, dom_1.$)('.workspace-trust-title-icon'));
            this.headerTitleText = (0, dom_1.append)(this.headerTitleContainer, (0, dom_1.$)('.workspace-trust-title-text'));
            this.headerDescription = (0, dom_1.append)(this.headerContainer, (0, dom_1.$)('.workspace-trust-description'));
        }
        createConfigurationElement(parent) {
            this.configurationContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-settings', { tabIndex: '0' }));
            const configurationTitle = (0, dom_1.append)(this.configurationContainer, (0, dom_1.$)('.workspace-trusted-folders-title'));
            configurationTitle.innerText = (0, nls_1.localize)('trustedFoldersAndWorkspaces', "Trusted Folders & Workspaces");
            this.workspaceTrustedUrisTable = this._register(this.instantiationService.createInstance(WorkspaceTrustedUrisTable, this.configurationContainer));
        }
        createAffectedFeaturesElement(parent) {
            this.affectedFeaturesContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-features'));
            this.trustedContainer = (0, dom_1.append)(this.affectedFeaturesContainer, (0, dom_1.$)('.workspace-trust-limitations.trusted', { tabIndex: '0' }));
            this.untrustedContainer = (0, dom_1.append)(this.affectedFeaturesContainer, (0, dom_1.$)('.workspace-trust-limitations.untrusted', { tabIndex: '0' }));
        }
        async renderAffectedFeatures(numSettings, numExtensions) {
            (0, dom_1.clearNode)(this.trustedContainer);
            (0, dom_1.clearNode)(this.untrustedContainer);
            // Trusted features
            const [trustedTitle, trustedSubTitle] = this.getFeaturesHeaderText(true);
            this.renderLimitationsHeaderElement(this.trustedContainer, trustedTitle, trustedSubTitle);
            const trustedContainerItems = this.workspaceService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ?
                [
                    (0, nls_1.localize)('trustedTasks', "Tasks are allowed to run"),
                    (0, nls_1.localize)('trustedDebugging', "Debugging is enabled"),
                    (0, nls_1.localize)('trustedExtensions', "All enabled extensions are activated")
                ] :
                [
                    (0, nls_1.localize)('trustedTasks', "Tasks are allowed to run"),
                    (0, nls_1.localize)('trustedDebugging', "Debugging is enabled"),
                    (0, nls_1.localize)('trustedSettings', "All workspace settings are applied"),
                    (0, nls_1.localize)('trustedExtensions', "All enabled extensions are activated")
                ];
            this.renderLimitationsListElement(this.trustedContainer, trustedContainerItems, themables_1.ThemeIcon.asClassNameArray(checkListIcon));
            // Restricted Mode features
            const [untrustedTitle, untrustedSubTitle] = this.getFeaturesHeaderText(false);
            this.renderLimitationsHeaderElement(this.untrustedContainer, untrustedTitle, untrustedSubTitle);
            const untrustedContainerItems = this.workspaceService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ?
                [
                    (0, nls_1.localize)('untrustedTasks', "Tasks are not allowed to run"),
                    (0, nls_1.localize)('untrustedDebugging', "Debugging is disabled"),
                    fixBadLocalizedLinks((0, nls_1.localize)({ key: 'untrustedExtensions', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[{0} extensions]({1}) are disabled or have limited functionality", numExtensions, `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`))
                ] :
                [
                    (0, nls_1.localize)('untrustedTasks', "Tasks are not allowed to run"),
                    (0, nls_1.localize)('untrustedDebugging', "Debugging is disabled"),
                    fixBadLocalizedLinks(numSettings ? (0, nls_1.localize)({ key: 'untrustedSettings', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[{0} workspace settings]({1}) are not applied", numSettings, 'command:settings.filterUntrusted') : (0, nls_1.localize)('no untrustedSettings', "Workspace settings requiring trust are not applied")),
                    fixBadLocalizedLinks((0, nls_1.localize)({ key: 'untrustedExtensions', comment: ['Please ensure the markdown link syntax is not broken up with whitespace [text block](link block)'] }, "[{0} extensions]({1}) are disabled or have limited functionality", numExtensions, `command:${extensions_1.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID}`))
                ];
            this.renderLimitationsListElement(this.untrustedContainer, untrustedContainerItems, themables_1.ThemeIcon.asClassNameArray(xListIcon));
            if (this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                if (this.workspaceTrustManagementService.canSetWorkspaceTrust()) {
                    this.addDontTrustButtonToElement(this.untrustedContainer);
                }
                else {
                    this.addTrustedTextToElement(this.untrustedContainer);
                }
            }
            else {
                if (this.workspaceTrustManagementService.canSetWorkspaceTrust()) {
                    this.addTrustButtonToElement(this.trustedContainer);
                }
            }
        }
        createButtonRow(parent, buttonInfo, enabled) {
            const buttonRow = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-buttons-row'));
            const buttonContainer = (0, dom_1.append)(buttonRow, (0, dom_1.$)('.workspace-trust-buttons'));
            const buttonBar = this.rerenderDisposables.add(new button_1.ButtonBar(buttonContainer));
            for (const { action, keybinding } of buttonInfo) {
                const button = buttonBar.addButtonWithDescription(defaultStyles_1.defaultButtonStyles);
                button.label = action.label;
                button.enabled = enabled !== undefined ? enabled : action.enabled;
                button.description = keybinding.getLabel();
                button.element.ariaLabel = action.label + ', ' + (0, nls_1.localize)('keyboardShortcut', "Keyboard Shortcut: {0}", keybinding.getAriaLabel());
                this.rerenderDisposables.add(button.onDidClick(e => {
                    if (e) {
                        dom_1.EventHelper.stop(e, true);
                    }
                    action.run();
                }));
            }
        }
        addTrustButtonToElement(parent) {
            const trustAction = new actions_1.Action('workspace.trust.button.action.grant', (0, nls_1.localize)('trustButton', "Trust"), undefined, true, async () => {
                await this.workspaceTrustManagementService.setWorkspaceTrust(true);
            });
            const trustActions = [{ action: trustAction, keybinding: this.keybindingService.resolveUserBinding(platform_2.isMacintosh ? 'Cmd+Enter' : 'Ctrl+Enter')[0] }];
            if (this.workspaceTrustManagementService.canSetParentFolderTrust()) {
                const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this.workspaceService.getWorkspace());
                const name = (0, resources_1.basename)((0, resources_1.dirname)(workspaceIdentifier.uri));
                const trustMessageElement = (0, dom_1.append)(parent, (0, dom_1.$)('.trust-message-box'));
                trustMessageElement.innerText = (0, nls_1.localize)('trustMessage', "Trust the authors of all files in the current folder or its parent '{0}'.", name);
                const trustParentAction = new actions_1.Action('workspace.trust.button.action.grantParent', (0, nls_1.localize)('trustParentButton', "Trust Parent"), undefined, true, async () => {
                    await this.workspaceTrustManagementService.setParentFolderTrust(true);
                });
                trustActions.push({ action: trustParentAction, keybinding: this.keybindingService.resolveUserBinding(platform_2.isMacintosh ? 'Cmd+Shift+Enter' : 'Ctrl+Shift+Enter')[0] });
            }
            this.createButtonRow(parent, trustActions);
        }
        addDontTrustButtonToElement(parent) {
            this.createButtonRow(parent, [{
                    action: new actions_1.Action('workspace.trust.button.action.deny', (0, nls_1.localize)('dontTrustButton', "Don't Trust"), undefined, true, async () => {
                        await this.workspaceTrustManagementService.setWorkspaceTrust(false);
                    }),
                    keybinding: this.keybindingService.resolveUserBinding(platform_2.isMacintosh ? 'Cmd+Enter' : 'Ctrl+Enter')[0]
                }]);
        }
        addTrustedTextToElement(parent) {
            if (this.workspaceService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                return;
            }
            const textElement = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-untrusted-description'));
            if (!this.workspaceTrustManagementService.isWorkspaceTrustForced()) {
                textElement.innerText = this.workspaceService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? (0, nls_1.localize)('untrustedWorkspaceReason', "This workspace is trusted via the bolded entries in the trusted folders below.") : (0, nls_1.localize)('untrustedFolderReason', "This folder is trusted via the bolded entries in the the trusted folders below.");
            }
            else {
                textElement.innerText = (0, nls_1.localize)('trustedForcedReason', "This window is trusted by nature of the workspace that is opened.");
            }
        }
        renderLimitationsHeaderElement(parent, headerText, subtitleText) {
            const limitationsHeaderContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-limitations-header'));
            const titleElement = (0, dom_1.append)(limitationsHeaderContainer, (0, dom_1.$)('.workspace-trust-limitations-title'));
            const textElement = (0, dom_1.append)(titleElement, (0, dom_1.$)('.workspace-trust-limitations-title-text'));
            const subtitleElement = (0, dom_1.append)(limitationsHeaderContainer, (0, dom_1.$)('.workspace-trust-limitations-subtitle'));
            textElement.innerText = headerText;
            subtitleElement.innerText = subtitleText;
        }
        renderLimitationsListElement(parent, limitations, iconClassNames) {
            const listContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.workspace-trust-limitations-list-container'));
            const limitationsList = (0, dom_1.append)(listContainer, (0, dom_1.$)('ul'));
            for (const limitation of limitations) {
                const limitationListItem = (0, dom_1.append)(limitationsList, (0, dom_1.$)('li'));
                const icon = (0, dom_1.append)(limitationListItem, (0, dom_1.$)('.list-item-icon'));
                const text = (0, dom_1.append)(limitationListItem, (0, dom_1.$)('.list-item-text'));
                icon.classList.add(...iconClassNames);
                const linkedText = (0, linkedText_1.parseLinkedText)(limitation);
                for (const node of linkedText.nodes) {
                    if (typeof node === 'string') {
                        (0, dom_1.append)(text, document.createTextNode(node));
                    }
                    else {
                        this.rerenderDisposables.add(this.instantiationService.createInstance(link_1.Link, text, { ...node, tabIndex: -1 }, {}));
                    }
                }
            }
        }
        layout(dimension) {
            if (!this.isVisible()) {
                return;
            }
            this.workspaceTrustedUrisTable.layout();
            this.layoutParticipants.forEach(participant => {
                participant.layout();
            });
            this.bodyScrollBar.scanDomNode();
        }
    };
    exports.WorkspaceTrustEditor = WorkspaceTrustEditor;
    __decorate([
        (0, decorators_1.debounce)(100)
    ], WorkspaceTrustEditor.prototype, "render", null);
    exports.WorkspaceTrustEditor = WorkspaceTrustEditor = WorkspaceTrustEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, extensions_1.IExtensionsWorkbenchService),
        __param(6, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(9, configuration_1.IWorkbenchConfigurationService),
        __param(10, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(11, productService_1.IProductService),
        __param(12, keybinding_1.IKeybindingService)
    ], WorkspaceTrustEditor);
    // Highly scoped fix for #126614
    function fixBadLocalizedLinks(badString) {
        const regex = /(.*)\[(.+)\]\s*\((.+)\)(.*)/; // markdown link match with spaces
        return badString.replace(regex, '$1[$2]($3)$4');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVHJ1c3RFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dvcmtzcGFjZS9icm93c2VyL3dvcmtzcGFjZVRydXN0RWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE0RG5GLFFBQUEsVUFBVSxHQUFHLElBQUEsMkJBQVksRUFBQyx3QkFBd0IsRUFBRSxrQkFBTyxDQUFDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsMENBQTBDLENBQUMsQ0FBQyxDQUFDO0lBRXJKLE1BQU0sYUFBYSxHQUFHLElBQUEsMkJBQVksRUFBQyw4QkFBOEIsRUFBRSxrQkFBTyxDQUFDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsdURBQXVELENBQUMsQ0FBQyxDQUFDO0lBQ3RLLE1BQU0sU0FBUyxHQUFHLElBQUEsMkJBQVksRUFBQyw4QkFBOEIsRUFBRSxrQkFBTyxDQUFDLENBQUMsRUFBRSxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsbURBQW1ELENBQUMsQ0FBQyxDQUFDO0lBQ3RKLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLHNDQUFzQyxFQUFFLGtCQUFPLENBQUMsTUFBTSxFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLDhEQUE4RCxDQUFDLENBQUMsQ0FBQztJQUM1TCxNQUFNLFFBQVEsR0FBRyxJQUFBLDJCQUFZLEVBQUMsb0NBQW9DLEVBQUUsa0JBQU8sQ0FBQyxJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLDhEQUE4RCxDQUFDLENBQUMsQ0FBQztJQUN4SyxNQUFNLFVBQVUsR0FBRyxJQUFBLDJCQUFZLEVBQUMsc0NBQXNDLEVBQUUsa0JBQU8sQ0FBQyxLQUFL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