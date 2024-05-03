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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/commands/common/commands", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/workbench/services/remote/common/remoteExplorerService", "vs/platform/clipboard/common/clipboardService", "vs/platform/notification/common/notification", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/functional", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/browser/parts/views/viewPane", "vs/base/common/uri", "vs/platform/tunnel/common/tunnel", "vs/platform/instantiation/common/descriptors", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/telemetry/common/telemetry", "vs/base/browser/ui/actionbar/actionViewItems", "vs/workbench/contrib/remote/browser/remoteIcons", "vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService", "vs/base/common/cancellation", "vs/base/common/platform", "vs/platform/list/browser/listService", "vs/base/browser/ui/button/button", "vs/platform/theme/common/colorRegistry", "vs/base/common/htmlContent", "vs/workbench/common/theme", "vs/base/common/codicons", "vs/platform/theme/browser/defaultStyles", "vs/workbench/services/remote/common/tunnelModel", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./media/tunnelView"], function (require, exports, nls, dom, views_1, viewsService_1, keybinding_1, contextView_1, contextkey_1, configuration_1, instantiation_1, opener_1, quickInput_1, commands_1, event_1, lifecycle_1, actionbar_1, iconLabel_1, actions_1, actions_2, menuEntryActionViewItem_1, remoteExplorerService_1, clipboardService_1, notification_1, inputBox_1, functional_1, themeService_1, themables_1, viewPane_1, uri_1, tunnel_1, descriptors_1, keybindingsRegistry_1, telemetry_1, actionViewItems_1, remoteIcons_1, externalUriOpenerService_1, cancellation_1, platform_1, listService_1, button_1, colorRegistry_1, htmlContent_1, theme_1, codicons_1, defaultStyles_1, tunnelModel_1, hoverDelegateFactory_1) {
    "use strict";
    var TunnelPanel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenPortInPreviewAction = exports.OpenPortInBrowserAction = exports.ForwardPortAction = exports.TunnelPanelDescriptor = exports.TunnelPanel = exports.TunnelViewModel = exports.openPreviewEnabledContext = void 0;
    exports.openPreviewEnabledContext = new contextkey_1.RawContextKey('openPreviewEnabled', false);
    class TunnelTreeVirtualDelegate {
        constructor(remoteExplorerService) {
            this.remoteExplorerService = remoteExplorerService;
            this.headerRowHeight = 22;
        }
        getHeight(row) {
            return (row.tunnelType === remoteExplorerService_1.TunnelType.Add && !this.remoteExplorerService.getEditableData(undefined)) ? 30 : 22;
        }
    }
    let TunnelViewModel = class TunnelViewModel {
        constructor(remoteExplorerService, tunnelService) {
            this.remoteExplorerService = remoteExplorerService;
            this.tunnelService = tunnelService;
            this._candidates = new Map();
            this.input = {
                label: nls.localize('remote.tunnelsView.addPort', "Add Port"),
                icon: undefined,
                tunnelType: remoteExplorerService_1.TunnelType.Add,
                hasRunningProcess: false,
                remoteHost: '',
                remotePort: 0,
                processDescription: '',
                tooltipPostfix: '',
                iconTooltip: '',
                portTooltip: '',
                processTooltip: '',
                originTooltip: '',
                privacyTooltip: '',
                source: { source: tunnelModel_1.TunnelSource.User, description: '' },
                protocol: tunnel_1.TunnelProtocol.Http,
                privacy: {
                    id: tunnel_1.TunnelPrivacyId.Private,
                    themeIcon: remoteIcons_1.privatePortIcon.id,
                    label: nls.localize('tunnelPrivacy.private', "Private")
                },
                strip: () => undefined
            };
            this.model = remoteExplorerService.tunnelModel;
            this.onForwardedPortsChanged = event_1.Event.any(this.model.onForwardPort, this.model.onClosePort, this.model.onPortName, this.model.onCandidatesChanged);
        }
        get all() {
            const result = [];
            this._candidates = new Map();
            this.model.candidates.forEach(candidate => {
                this._candidates.set((0, tunnelModel_1.makeAddress)(candidate.host, candidate.port), candidate);
            });
            if ((this.model.forwarded.size > 0) || this.remoteExplorerService.getEditableData(undefined)) {
                result.push(...this.forwarded);
            }
            if (this.model.detected.size > 0) {
                result.push(...this.detected);
            }
            result.push(this.input);
            return result;
        }
        addProcessInfoFromCandidate(tunnelItem) {
            const key = (0, tunnelModel_1.makeAddress)(tunnelItem.remoteHost, tunnelItem.remotePort);
            if (this._candidates.has(key)) {
                tunnelItem.processDescription = this._candidates.get(key).detail;
            }
        }
        get forwarded() {
            const forwarded = Array.from(this.model.forwarded.values()).map(tunnel => {
                const tunnelItem = TunnelItem.createFromTunnel(this.remoteExplorerService, this.tunnelService, tunnel);
                this.addProcessInfoFromCandidate(tunnelItem);
                return tunnelItem;
            }).sort((a, b) => {
                if (a.remotePort === b.remotePort) {
                    return a.remoteHost < b.remoteHost ? -1 : 1;
                }
                else {
                    return a.remotePort < b.remotePort ? -1 : 1;
                }
            });
            return forwarded;
        }
        get detected() {
            return Array.from(this.model.detected.values()).map(tunnel => {
                const tunnelItem = TunnelItem.createFromTunnel(this.remoteExplorerService, this.tunnelService, tunnel, remoteExplorerService_1.TunnelType.Detected, false);
                this.addProcessInfoFromCandidate(tunnelItem);
                return tunnelItem;
            });
        }
        isEmpty() {
            return (this.detected.length === 0) &&
                ((this.forwarded.length === 0) || (this.forwarded.length === 1 &&
                    (this.forwarded[0].tunnelType === remoteExplorerService_1.TunnelType.Add) && !this.remoteExplorerService.getEditableData(undefined)));
        }
    };
    exports.TunnelViewModel = TunnelViewModel;
    exports.TunnelViewModel = TunnelViewModel = __decorate([
        __param(0, remoteExplorerService_1.IRemoteExplorerService),
        __param(1, tunnel_1.ITunnelService)
    ], TunnelViewModel);
    function emptyCell(item) {
        return { label: '', tunnel: item, editId: remoteExplorerService_1.TunnelEditId.None, tooltip: '' };
    }
    class IconColumn {
        constructor() {
            this.label = '';
            this.tooltip = '';
            this.weight = 1;
            this.minimumWidth = 40;
            this.maximumWidth = 40;
            this.templateId = 'actionbar';
        }
        project(row) {
            if (row.tunnelType === remoteExplorerService_1.TunnelType.Add) {
                return emptyCell(row);
            }
            const icon = row.processDescription ? remoteIcons_1.forwardedPortWithProcessIcon : remoteIcons_1.forwardedPortWithoutProcessIcon;
            let tooltip = '';
            if (row instanceof TunnelItem) {
                tooltip = `${row.iconTooltip} ${row.tooltipPostfix}`;
            }
            return {
                label: '', icon, tunnel: row, editId: remoteExplorerService_1.TunnelEditId.None, tooltip
            };
        }
    }
    class PortColumn {
        constructor() {
            this.label = nls.localize('tunnel.portColumn.label', "Port");
            this.tooltip = nls.localize('tunnel.portColumn.tooltip', "The label and remote port number of the forwarded port.");
            this.weight = 1;
            this.templateId = 'actionbar';
        }
        project(row) {
            const isAdd = row.tunnelType === remoteExplorerService_1.TunnelType.Add;
            const label = row.label;
            let tooltip = '';
            if (row instanceof TunnelItem && !isAdd) {
                tooltip = `${row.portTooltip} ${row.tooltipPostfix}`;
            }
            else {
                tooltip = label;
            }
            return {
                label, tunnel: row, menuId: actions_2.MenuId.TunnelPortInline,
                editId: row.tunnelType === remoteExplorerService_1.TunnelType.Add ? remoteExplorerService_1.TunnelEditId.New : remoteExplorerService_1.TunnelEditId.Label, tooltip
            };
        }
    }
    class LocalAddressColumn {
        constructor() {
            this.label = nls.localize('tunnel.addressColumn.label', "Forwarded Address");
            this.tooltip = nls.localize('tunnel.addressColumn.tooltip', "The address that the forwarded port is available at.");
            this.weight = 1;
            this.templateId = 'actionbar';
        }
        project(row) {
            if (row.tunnelType === remoteExplorerService_1.TunnelType.Add) {
                return emptyCell(row);
            }
            const label = row.localAddress ?? '';
            let tooltip = label;
            if (row instanceof TunnelItem) {
                tooltip = row.tooltipPostfix;
            }
            return {
                label,
                menuId: actions_2.MenuId.TunnelLocalAddressInline,
                tunnel: row,
                editId: remoteExplorerService_1.TunnelEditId.LocalPort,
                tooltip,
                markdownTooltip: label ? LocalAddressColumn.getHoverText(label) : undefined
            };
        }
        static getHoverText(localAddress) {
            return function (configurationService) {
                const editorConf = configurationService.getValue('editor');
                let clickLabel = '';
                if (editorConf.multiCursorModifier === 'ctrlCmd') {
                    if (platform_1.isMacintosh) {
                        clickLabel = nls.localize('portsLink.followLinkAlt.mac', "option + click");
                    }
                    else {
                        clickLabel = nls.localize('portsLink.followLinkAlt', "alt + click");
                    }
                }
                else {
                    if (platform_1.isMacintosh) {
                        clickLabel = nls.localize('portsLink.followLinkCmd', "cmd + click");
                    }
                    else {
                        clickLabel = nls.localize('portsLink.followLinkCtrl', "ctrl + click");
                    }
                }
                const markdown = new htmlContent_1.MarkdownString('', true);
                const uri = localAddress.startsWith('http') ? localAddress : `http://${localAddress}`;
                return markdown.appendLink(uri, 'Follow link').appendMarkdown(` (${clickLabel})`);
            };
        }
    }
    class RunningProcessColumn {
        constructor() {
            this.label = nls.localize('tunnel.processColumn.label', "Running Process");
            this.tooltip = nls.localize('tunnel.processColumn.tooltip', "The command line of the process that is using the port.");
            this.weight = 2;
            this.templateId = 'actionbar';
        }
        project(row) {
            if (row.tunnelType === remoteExplorerService_1.TunnelType.Add) {
                return emptyCell(row);
            }
            const label = row.processDescription ?? '';
            return { label, tunnel: row, editId: remoteExplorerService_1.TunnelEditId.None, tooltip: row instanceof TunnelItem ? row.processTooltip : '' };
        }
    }
    class OriginColumn {
        constructor() {
            this.label = nls.localize('tunnel.originColumn.label', "Origin");
            this.tooltip = nls.localize('tunnel.originColumn.tooltip', "The source that a forwarded port originates from. Can be an extension, user forwarded, statically forwarded, or automatically forwarded.");
            this.weight = 1;
            this.templateId = 'actionbar';
        }
        project(row) {
            if (row.tunnelType === remoteExplorerService_1.TunnelType.Add) {
                return emptyCell(row);
            }
            const label = row.source.description;
            const tooltip = `${row instanceof TunnelItem ? row.originTooltip : ''}. ${row instanceof TunnelItem ? row.tooltipPostfix : ''}`;
            return { label, menuId: actions_2.MenuId.TunnelOriginInline, tunnel: row, editId: remoteExplorerService_1.TunnelEditId.None, tooltip };
        }
    }
    class PrivacyColumn {
        constructor() {
            this.label = nls.localize('tunnel.privacyColumn.label', "Visibility");
            this.tooltip = nls.localize('tunnel.privacyColumn.tooltip', "The availability of the forwarded port.");
            this.weight = 1;
            this.templateId = 'actionbar';
        }
        project(row) {
            if (row.tunnelType === remoteExplorerService_1.TunnelType.Add) {
                return emptyCell(row);
            }
            const label = row.privacy?.label;
            let tooltip = '';
            if (row instanceof TunnelItem) {
                tooltip = `${row.privacy.label} ${row.tooltipPostfix}`;
            }
            return { label, tunnel: row, icon: { id: row.privacy.themeIcon }, editId: remoteExplorerService_1.TunnelEditId.None, tooltip };
        }
    }
    let ActionBarRenderer = class ActionBarRenderer extends lifecycle_1.Disposable {
        constructor(instantiationService, contextKeyService, menuService, contextViewService, remoteExplorerService, commandService, configurationService) {
            super();
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.contextViewService = contextViewService;
            this.remoteExplorerService = remoteExplorerService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.templateId = 'actionbar';
            this._hoverDelegate = (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse');
        }
        set actionRunner(actionRunner) {
            this._actionRunner = actionRunner;
        }
        renderTemplate(container) {
            const cell = dom.append(container, dom.$('.ports-view-actionbar-cell'));
            const icon = dom.append(cell, dom.$('.ports-view-actionbar-cell-icon'));
            const label = new iconLabel_1.IconLabel(cell, {
                supportHighlights: true,
                hoverDelegate: this._hoverDelegate
            });
            const actionsContainer = dom.append(cell, dom.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: menuEntryActionViewItem_1.createActionViewItem.bind(undefined, this.instantiationService),
                hoverDelegate: this._hoverDelegate
            });
            return { label, icon, actionBar, container: cell, elementDisposable: lifecycle_1.Disposable.None };
        }
        renderElement(element, index, templateData) {
            // reset
            templateData.actionBar.clear();
            templateData.icon.className = 'ports-view-actionbar-cell-icon';
            templateData.icon.style.display = 'none';
            templateData.label.setLabel('');
            templateData.label.element.style.display = 'none';
            templateData.container.style.height = '22px';
            if (templateData.button) {
                templateData.button.element.style.display = 'none';
                templateData.button.dispose();
            }
            templateData.container.style.paddingLeft = '0px';
            templateData.elementDisposable.dispose();
            let editableData;
            if (element.editId === remoteExplorerService_1.TunnelEditId.New && (editableData = this.remoteExplorerService.getEditableData(undefined))) {
                this.renderInputBox(templateData.container, editableData);
            }
            else {
                editableData = this.remoteExplorerService.getEditableData(element.tunnel, element.editId);
                if (editableData) {
                    this.renderInputBox(templateData.container, editableData);
                }
                else if ((element.tunnel.tunnelType === remoteExplorerService_1.TunnelType.Add) && (element.menuId === actions_2.MenuId.TunnelPortInline)) {
                    this.renderButton(element, templateData);
                }
                else {
                    this.renderActionBarItem(element, templateData);
                }
            }
        }
        renderButton(element, templateData) {
            templateData.container.style.paddingLeft = '7px';
            templateData.container.style.height = '28px';
            templateData.button = this._register(new button_1.Button(templateData.container, defaultStyles_1.defaultButtonStyles));
            templateData.button.label = element.label;
            templateData.button.element.title = element.tooltip;
            this._register(templateData.button.onDidClick(() => {
                this.commandService.executeCommand(ForwardPortAction.INLINE_ID);
            }));
        }
        tunnelContext(tunnel) {
            let context;
            if (tunnel instanceof TunnelItem) {
                context = tunnel.strip();
            }
            if (!context) {
                context = {
                    tunnelType: tunnel.tunnelType,
                    remoteHost: tunnel.remoteHost,
                    remotePort: tunnel.remotePort,
                    localAddress: tunnel.localAddress,
                    protocol: tunnel.protocol,
                    localUri: tunnel.localUri,
                    localPort: tunnel.localPort,
                    name: tunnel.name,
                    closeable: tunnel.closeable,
                    source: tunnel.source,
                    privacy: tunnel.privacy,
                    processDescription: tunnel.processDescription,
                    label: tunnel.label
                };
            }
            return context;
        }
        renderActionBarItem(element, templateData) {
            templateData.label.element.style.display = 'flex';
            templateData.label.setLabel(element.label, undefined, {
                title: element.markdownTooltip ?
                    { markdown: element.markdownTooltip(this.configurationService), markdownNotSupportedFallback: element.tooltip }
                    : element.tooltip,
                extraClasses: element.menuId === actions_2.MenuId.TunnelLocalAddressInline ? ['ports-view-actionbar-cell-localaddress'] : undefined
            });
            templateData.actionBar.context = this.tunnelContext(element.tunnel);
            templateData.container.style.paddingLeft = '10px';
            const context = [
                ['view', remoteExplorerService_1.TUNNEL_VIEW_ID],
                [TunnelTypeContextKey.key, element.tunnel.tunnelType],
                [TunnelCloseableContextKey.key, element.tunnel.closeable],
                [TunnelPrivacyContextKey.key, element.tunnel.privacy.id],
                [TunnelProtocolContextKey.key, element.tunnel.protocol]
            ];
            const contextKeyService = this.contextKeyService.createOverlay(context);
            const disposableStore = new lifecycle_1.DisposableStore();
            templateData.elementDisposable = disposableStore;
            if (element.menuId) {
                const menu = disposableStore.add(this.menuService.createMenu(element.menuId, contextKeyService));
                let actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, actions);
                if (actions) {
                    const labelActions = actions.filter(action => action.id.toLowerCase().indexOf('label') >= 0);
                    if (labelActions.length > 1) {
                        labelActions.sort((a, b) => a.label.length - b.label.length);
                        labelActions.pop();
                        actions = actions.filter(action => labelActions.indexOf(action) < 0);
                    }
                    templateData.actionBar.push(actions, { icon: true, label: false });
                    if (this._actionRunner) {
                        templateData.actionBar.actionRunner = this._actionRunner;
                    }
                }
            }
            if (element.icon) {
                templateData.icon.className = `ports-view-actionbar-cell-icon ${themables_1.ThemeIcon.asClassName(element.icon)}`;
                templateData.icon.title = element.tooltip;
                templateData.icon.style.display = 'inline';
            }
        }
        renderInputBox(container, editableData) {
            // Required for FireFox. The blur event doesn't fire on FireFox when you just mash the "+" button to forward a port.
            if (this.inputDone) {
                this.inputDone(false, false);
                this.inputDone = undefined;
            }
            container.style.paddingLeft = '5px';
            const value = editableData.startingValue || '';
            const inputBox = new inputBox_1.InputBox(container, this.contextViewService, {
                ariaLabel: nls.localize('remote.tunnelsView.input', "Press Enter to confirm or Escape to cancel."),
                validationOptions: {
                    validation: (value) => {
                        const message = editableData.validationMessage(value);
                        if (!message) {
                            return null;
                        }
                        return {
                            content: message.content,
                            formatContent: true,
                            type: message.severity === notification_1.Severity.Error ? 3 /* MessageType.ERROR */ : 1 /* MessageType.INFO */
                        };
                    }
                },
                placeholder: editableData.placeholder || '',
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles
            });
            inputBox.value = value;
            inputBox.focus();
            inputBox.select({ start: 0, end: editableData.startingValue ? editableData.startingValue.length : 0 });
            const done = (0, functional_1.createSingleCallFunction)(async (success, finishEditing) => {
                (0, lifecycle_1.dispose)(toDispose);
                if (this.inputDone) {
                    this.inputDone = undefined;
                }
                inputBox.element.style.display = 'none';
                const inputValue = inputBox.value;
                if (finishEditing) {
                    return editableData.onFinish(inputValue, success);
                }
            });
            this.inputDone = done;
            const toDispose = [
                inputBox,
                dom.addStandardDisposableListener(inputBox.inputElement, dom.EventType.KEY_DOWN, async (e) => {
                    if (e.equals(3 /* KeyCode.Enter */)) {
                        e.stopPropagation();
                        if (inputBox.validate() !== 3 /* MessageType.ERROR */) {
                            return done(true, true);
                        }
                        else {
                            return done(false, true);
                        }
                    }
                    else if (e.equals(9 /* KeyCode.Escape */)) {
                        e.preventDefault();
                        e.stopPropagation();
                        return done(false, true);
                    }
                }),
                dom.addDisposableListener(inputBox.inputElement, dom.EventType.BLUR, () => {
                    return done(inputBox.validate() !== 3 /* MessageType.ERROR */, true);
                })
            ];
            return (0, lifecycle_1.toDisposable)(() => {
                done(false, false);
            });
        }
        disposeElement(element, index, templateData, height) {
            templateData.elementDisposable.dispose();
        }
        disposeTemplate(templateData) {
            templateData.label.dispose();
            templateData.actionBar.dispose();
            templateData.elementDisposable.dispose();
            templateData.button?.dispose();
        }
    };
    ActionBarRenderer = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, actions_2.IMenuService),
        __param(3, contextView_1.IContextViewService),
        __param(4, remoteExplorerService_1.IRemoteExplorerService),
        __param(5, commands_1.ICommandService),
        __param(6, configuration_1.IConfigurationService)
    ], ActionBarRenderer);
    class TunnelItem {
        static createFromTunnel(remoteExplorerService, tunnelService, tunnel, type = remoteExplorerService_1.TunnelType.Forwarded, closeable) {
            return new TunnelItem(type, tunnel.remoteHost, tunnel.remotePort, tunnel.source, !!tunnel.hasRunningProcess, tunnel.protocol, tunnel.localUri, tunnel.localAddress, tunnel.localPort, closeable === undefined ? tunnel.closeable : closeable, tunnel.name, tunnel.runningProcess, tunnel.pid, tunnel.privacy, remoteExplorerService, tunnelService);
        }
        /**
         * Removes all non-serializable properties from the tunnel
         * @returns A new TunnelItem without any services
         */
        strip() {
            return new TunnelItem(this.tunnelType, this.remoteHost, this.remotePort, this.source, this.hasRunningProcess, this.protocol, this.localUri, this.localAddress, this.localPort, this.closeable, this.name, this.runningProcess, this.pid, this._privacy);
        }
        constructor(tunnelType, remoteHost, remotePort, source, hasRunningProcess, protocol, localUri, localAddress, localPort, closeable, name, runningProcess, pid, _privacy, remoteExplorerService, tunnelService) {
            this.tunnelType = tunnelType;
            this.remoteHost = remoteHost;
            this.remotePort = remotePort;
            this.source = source;
            this.hasRunningProcess = hasRunningProcess;
            this.protocol = protocol;
            this.localUri = localUri;
            this.localAddress = localAddress;
            this.localPort = localPort;
            this.closeable = closeable;
            this.name = name;
            this.runningProcess = runningProcess;
            this.pid = pid;
            this._privacy = _privacy;
            this.remoteExplorerService = remoteExplorerService;
            this.tunnelService = tunnelService;
        }
        get label() {
            if (this.tunnelType === remoteExplorerService_1.TunnelType.Add && this.name) {
                return this.name;
            }
            const portNumberLabel = ((0, tunnel_1.isLocalhost)(this.remoteHost) || (0, tunnel_1.isAllInterfaces)(this.remoteHost))
                ? `${this.remotePort}`
                : `${this.remoteHost}:${this.remotePort}`;
            if (this.name) {
                return `${this.name} (${portNumberLabel})`;
            }
            else {
                return portNumberLabel;
            }
        }
        set processDescription(description) {
            this.runningProcess = description;
        }
        get processDescription() {
            let description = '';
            if (this.runningProcess) {
                if (this.pid && this.remoteExplorerService?.namedProcesses.has(this.pid)) {
                    // This is a known process. Give it a friendly name.
                    description = this.remoteExplorerService.namedProcesses.get(this.pid);
                }
                else {
                    description = this.runningProcess.replace(/\0/g, ' ').trim();
                }
                if (this.pid) {
                    description += ` (${this.pid})`;
                }
            }
            else if (this.hasRunningProcess) {
                description = nls.localize('tunnelView.runningProcess.inacessable', "Process information unavailable");
            }
            return description;
        }
        get tooltipPostfix() {
            let information;
            if (this.localAddress) {
                information = nls.localize('remote.tunnel.tooltipForwarded', "Remote port {0}:{1} forwarded to local address {2}. ", this.remoteHost, this.remotePort, this.localAddress);
            }
            else {
                information = nls.localize('remote.tunnel.tooltipCandidate', "Remote port {0}:{1} not forwarded. ", this.remoteHost, this.remotePort);
            }
            return information;
        }
        get iconTooltip() {
            const isAdd = this.tunnelType === remoteExplorerService_1.TunnelType.Add;
            if (!isAdd) {
                return `${this.processDescription ? nls.localize('tunnel.iconColumn.running', "Port has running process.") :
                    nls.localize('tunnel.iconColumn.notRunning', "No running process.")}`;
            }
            else {
                return this.label;
            }
        }
        get portTooltip() {
            const isAdd = this.tunnelType === remoteExplorerService_1.TunnelType.Add;
            if (!isAdd) {
                return `${this.name ? nls.localize('remote.tunnel.tooltipName', "Port labeled {0}. ", this.name) : ''}`;
            }
            else {
                return '';
            }
        }
        get processTooltip() {
            return this.processDescription ?? '';
        }
        get originTooltip() {
            return this.source.description;
        }
        get privacy() {
            if (this.tunnelService?.privacyOptions) {
                return this.tunnelService?.privacyOptions.find(element => element.id === this._privacy) ??
                    {
                        id: '',
                        themeIcon: codicons_1.Codicon.question.id,
                        label: nls.localize('tunnelPrivacy.unknown', "Unknown")
                    };
            }
            else {
                return {
                    id: tunnel_1.TunnelPrivacyId.Private,
                    themeIcon: remoteIcons_1.privatePortIcon.id,
                    label: nls.localize('tunnelPrivacy.private', "Private")
                };
            }
        }
    }
    const TunnelTypeContextKey = new contextkey_1.RawContextKey('tunnelType', remoteExplorerService_1.TunnelType.Add, true);
    const TunnelCloseableContextKey = new contextkey_1.RawContextKey('tunnelCloseable', false, true);
    const TunnelPrivacyContextKey = new contextkey_1.RawContextKey('tunnelPrivacy', undefined, true);
    const TunnelPrivacyEnabledContextKey = new contextkey_1.RawContextKey('tunnelPrivacyEnabled', false, true);
    const TunnelProtocolContextKey = new contextkey_1.RawContextKey('tunnelProtocol', tunnel_1.TunnelProtocol.Http, true);
    const TunnelViewFocusContextKey = new contextkey_1.RawContextKey('tunnelViewFocus', false, nls.localize('tunnel.focusContext', "Whether the Ports view has focus."));
    const TunnelViewSelectionKeyName = 'tunnelViewSelection';
    // host:port
    const TunnelViewSelectionContextKey = new contextkey_1.RawContextKey(TunnelViewSelectionKeyName, undefined, true);
    const TunnelViewMultiSelectionKeyName = 'tunnelViewMultiSelection';
    // host:port[]
    const TunnelViewMultiSelectionContextKey = new contextkey_1.RawContextKey(TunnelViewMultiSelectionKeyName, undefined, true);
    const PortChangableContextKey = new contextkey_1.RawContextKey('portChangable', false, true);
    const ProtocolChangeableContextKey = new contextkey_1.RawContextKey('protocolChangable', true, true);
    let TunnelPanel = class TunnelPanel extends viewPane_1.ViewPane {
        static { TunnelPanel_1 = this; }
        static { this.ID = remoteExplorerService_1.TUNNEL_VIEW_ID; }
        static { this.TITLE = nls.localize2('remote.tunnel', "Ports"); }
        constructor(viewModel, options, keybindingService, contextMenuService, contextKeyService, configurationService, instantiationService, viewDescriptorService, openerService, quickInputService, commandService, menuService, themeService, remoteExplorerService, telemetryService, tunnelService, contextViewService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.viewModel = viewModel;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.menuService = menuService;
            this.remoteExplorerService = remoteExplorerService;
            this.tunnelService = tunnelService;
            this.contextViewService = contextViewService;
            this.tableDisposables = this._register(new lifecycle_1.DisposableStore());
            this.isEditing = false;
            this.titleActions = [];
            this.lastFocus = [];
            this.height = 0;
            this.width = 0;
            this.tunnelTypeContext = TunnelTypeContextKey.bindTo(contextKeyService);
            this.tunnelCloseableContext = TunnelCloseableContextKey.bindTo(contextKeyService);
            this.tunnelPrivacyContext = TunnelPrivacyContextKey.bindTo(contextKeyService);
            this.tunnelPrivacyEnabledContext = TunnelPrivacyEnabledContextKey.bindTo(contextKeyService);
            this.tunnelPrivacyEnabledContext.set(tunnelService.canChangePrivacy);
            this.protocolChangableContextKey = ProtocolChangeableContextKey.bindTo(contextKeyService);
            this.protocolChangableContextKey.set(tunnelService.canChangeProtocol);
            this.tunnelProtocolContext = TunnelProtocolContextKey.bindTo(contextKeyService);
            this.tunnelViewFocusContext = TunnelViewFocusContextKey.bindTo(contextKeyService);
            this.tunnelViewSelectionContext = TunnelViewSelectionContextKey.bindTo(contextKeyService);
            this.tunnelViewMultiSelectionContext = TunnelViewMultiSelectionContextKey.bindTo(contextKeyService);
            this.portChangableContextKey = PortChangableContextKey.bindTo(contextKeyService);
            const overlayContextKeyService = this.contextKeyService.createOverlay([['view', TunnelPanel_1.ID]]);
            const titleMenu = this._register(this.menuService.createMenu(actions_2.MenuId.TunnelTitle, overlayContextKeyService));
            const updateActions = () => {
                this.titleActions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(titleMenu, undefined, this.titleActions);
                this.updateActions();
            };
            this._register(titleMenu.onDidChange(updateActions));
            updateActions();
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.titleActions = [];
            }));
            this.registerPrivacyActions();
            this._register(event_1.Event.once(this.tunnelService.onAddedTunnelProvider)(() => {
                let updated = false;
                if (this.tunnelPrivacyEnabledContext.get() === false) {
                    this.tunnelPrivacyEnabledContext.set(tunnelService.canChangePrivacy);
                    updated = true;
                }
                if (this.protocolChangableContextKey.get() === true) {
                    this.protocolChangableContextKey.set(tunnelService.canChangeProtocol);
                    updated = true;
                }
                if (updated) {
                    updateActions();
                    this.registerPrivacyActions();
                    this.createTable();
                    this.table.layout(this.height, this.width);
                }
            }));
        }
        registerPrivacyActions() {
            for (const privacyOption of this.tunnelService.privacyOptions) {
                const optionId = `remote.tunnel.privacy${privacyOption.id}`;
                commands_1.CommandsRegistry.registerCommand(optionId, ChangeTunnelPrivacyAction.handler(privacyOption.id));
                actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelPrivacy, ({
                    order: 0,
                    command: {
                        id: optionId,
                        title: privacyOption.label,
                        toggled: TunnelPrivacyContextKey.isEqualTo(privacyOption.id)
                    }
                }));
            }
        }
        get portCount() {
            return this.remoteExplorerService.tunnelModel.forwarded.size + this.remoteExplorerService.tunnelModel.detected.size;
        }
        createTable() {
            if (!this.panelContainer) {
                return;
            }
            this.tableDisposables.clear();
            dom.clearNode(this.panelContainer);
            const widgetContainer = dom.append(this.panelContainer, dom.$('.customview-tree'));
            widgetContainer.classList.add('ports-view');
            widgetContainer.classList.add('file-icon-themable-tree', 'show-file-icons');
            const actionBarRenderer = new ActionBarRenderer(this.instantiationService, this.contextKeyService, this.menuService, this.contextViewService, this.remoteExplorerService, this.commandService, this.configurationService);
            const columns = [new IconColumn(), new PortColumn(), new LocalAddressColumn(), new RunningProcessColumn()];
            if (this.tunnelService.canChangePrivacy) {
                columns.push(new PrivacyColumn());
            }
            columns.push(new OriginColumn());
            this.table = this.instantiationService.createInstance(listService_1.WorkbenchTable, 'RemoteTunnels', widgetContainer, new TunnelTreeVirtualDelegate(this.remoteExplorerService), columns, [actionBarRenderer], {
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (item) => {
                        return item.label;
                    }
                },
                multipleSelectionSupport: true,
                accessibilityProvider: {
                    getAriaLabel: (item) => {
                        if (item instanceof TunnelItem) {
                            return `${item.tooltipPostfix} ${item.portTooltip} ${item.iconTooltip} ${item.processTooltip} ${item.originTooltip} ${this.tunnelService.canChangePrivacy ? item.privacy.label : ''}`;
                        }
                        else {
                            return item.label;
                        }
                    },
                    getWidgetAriaLabel: () => nls.localize('tunnelView', "Tunnel View")
                },
                openOnSingleClick: true
            });
            const actionRunner = new actions_1.ActionRunner();
            actionBarRenderer.actionRunner = actionRunner;
            this.tableDisposables.add(this.table);
            this.tableDisposables.add(this.table.onContextMenu(e => this.onContextMenu(e, actionRunner)));
            this.tableDisposables.add(this.table.onMouseDblClick(e => this.onMouseDblClick(e)));
            this.tableDisposables.add(this.table.onDidChangeFocus(e => this.onFocusChanged(e)));
            this.tableDisposables.add(this.table.onDidChangeSelection(e => this.onSelectionChanged(e)));
            this.tableDisposables.add(this.table.onDidFocus(() => this.tunnelViewFocusContext.set(true)));
            this.tableDisposables.add(this.table.onDidBlur(() => this.tunnelViewFocusContext.set(false)));
            const rerender = () => this.table.splice(0, Number.POSITIVE_INFINITY, this.viewModel.all);
            rerender();
            let lastPortCount = this.portCount;
            this.tableDisposables.add(event_1.Event.debounce(this.viewModel.onForwardedPortsChanged, (_last, e) => e, 50)(() => {
                const newPortCount = this.portCount;
                if (((lastPortCount === 0) || (newPortCount === 0)) && (lastPortCount !== newPortCount)) {
                    this._onDidChangeViewWelcomeState.fire();
                }
                lastPortCount = newPortCount;
                rerender();
            }));
            this.tableDisposables.add(this.table.onMouseClick(e => {
                if (this.hasOpenLinkModifier(e.browserEvent)) {
                    const selection = this.table.getSelectedElements();
                    if ((selection.length === 0) ||
                        ((selection.length === 1) && (selection[0] === e.element))) {
                        this.commandService.executeCommand(OpenPortInBrowserAction.ID, e.element);
                    }
                }
            }));
            this.tableDisposables.add(this.table.onDidOpen(e => {
                if (!e.element || (e.element.tunnelType !== remoteExplorerService_1.TunnelType.Forwarded)) {
                    return;
                }
                if (e.browserEvent?.type === 'dblclick') {
                    this.commandService.executeCommand(LabelTunnelAction.ID);
                }
            }));
            this.tableDisposables.add(this.remoteExplorerService.onDidChangeEditable(e => {
                this.isEditing = !!this.remoteExplorerService.getEditableData(e?.tunnel, e?.editId);
                this._onDidChangeViewWelcomeState.fire();
                if (!this.isEditing) {
                    widgetContainer.classList.remove('highlight');
                }
                rerender();
                if (this.isEditing) {
                    widgetContainer.classList.add('highlight');
                    if (!e) {
                        // When we are in editing mode for a new forward, rather than updating an existing one we need to reveal the input box since it might be out of view.
                        this.table.reveal(this.table.indexOf(this.viewModel.input));
                    }
                }
                else {
                    if (e && (e.tunnel.tunnelType !== remoteExplorerService_1.TunnelType.Add)) {
                        this.table.setFocus(this.lastFocus);
                    }
                    this.focus();
                }
            }));
        }
        renderBody(container) {
            super.renderBody(container);
            this.panelContainer = dom.append(container, dom.$('.tree-explorer-viewlet-tree-view'));
            this.createTable();
        }
        shouldShowWelcome() {
            return this.viewModel.isEmpty() && !this.isEditing;
        }
        focus() {
            super.focus();
            this.table.domFocus();
        }
        onFocusChanged(event) {
            if (event.indexes.length > 0 && event.elements.length > 0) {
                this.lastFocus = [...event.indexes];
            }
            const elements = event.elements;
            const item = elements && elements.length ? elements[0] : undefined;
            if (item) {
                this.tunnelViewSelectionContext.set((0, tunnelModel_1.makeAddress)(item.remoteHost, item.remotePort));
                this.tunnelTypeContext.set(item.tunnelType);
                this.tunnelCloseableContext.set(!!item.closeable);
                this.tunnelPrivacyContext.set(item.privacy.id);
                this.tunnelProtocolContext.set(item.protocol === tunnel_1.TunnelProtocol.Https ? tunnel_1.TunnelProtocol.Https : tunnel_1.TunnelProtocol.Https);
                this.portChangableContextKey.set(!!item.localPort);
            }
            else {
                this.tunnelTypeContext.reset();
                this.tunnelViewSelectionContext.reset();
                this.tunnelCloseableContext.reset();
                this.tunnelPrivacyContext.reset();
                this.tunnelProtocolContext.reset();
                this.portChangableContextKey.reset();
            }
        }
        hasOpenLinkModifier(e) {
            const editorConf = this.configurationService.getValue('editor');
            let modifierKey = false;
            if (editorConf.multiCursorModifier === 'ctrlCmd') {
                modifierKey = e.altKey;
            }
            else {
                if (platform_1.isMacintosh) {
                    modifierKey = e.metaKey;
                }
                else {
                    modifierKey = e.ctrlKey;
                }
            }
            return modifierKey;
        }
        onSelectionChanged(event) {
            const elements = event.elements;
            if (elements.length > 1) {
                this.tunnelViewMultiSelectionContext.set(elements.map(element => (0, tunnelModel_1.makeAddress)(element.remoteHost, element.remotePort)));
            }
            else {
                this.tunnelViewMultiSelectionContext.set(undefined);
            }
        }
        onContextMenu(event, actionRunner) {
            if ((event.element !== undefined) && !(event.element instanceof TunnelItem)) {
                return;
            }
            event.browserEvent.preventDefault();
            event.browserEvent.stopPropagation();
            const node = event.element;
            if (node) {
                this.table.setFocus([this.table.indexOf(node)]);
                this.tunnelTypeContext.set(node.tunnelType);
                this.tunnelCloseableContext.set(!!node.closeable);
                this.tunnelPrivacyContext.set(node.privacy.id);
                this.tunnelProtocolContext.set(node.protocol);
                this.portChangableContextKey.set(!!node.localPort);
            }
            else {
                this.tunnelTypeContext.set(remoteExplorerService_1.TunnelType.Add);
                this.tunnelCloseableContext.set(false);
                this.tunnelPrivacyContext.set(undefined);
                this.tunnelProtocolContext.set(undefined);
                this.portChangableContextKey.set(false);
            }
            this.contextMenuService.showContextMenu({
                menuId: actions_2.MenuId.TunnelContext,
                menuActionOptions: { shouldForwardArgs: true },
                contextKeyService: this.table.contextKeyService,
                getAnchor: () => event.anchor,
                getActionViewItem: (action) => {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionViewItems_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return undefined;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.table.domFocus();
                    }
                },
                getActionsContext: () => node?.strip(),
                actionRunner
            });
        }
        onMouseDblClick(e) {
            if (!e.element) {
                this.commandService.executeCommand(ForwardPortAction.INLINE_ID);
            }
        }
        layoutBody(height, width) {
            this.height = height;
            this.width = width;
            super.layoutBody(height, width);
            this.table.layout(height, width);
        }
    };
    exports.TunnelPanel = TunnelPanel;
    exports.TunnelPanel = TunnelPanel = TunnelPanel_1 = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, views_1.IViewDescriptorService),
        __param(8, opener_1.IOpenerService),
        __param(9, quickInput_1.IQuickInputService),
        __param(10, commands_1.ICommandService),
        __param(11, actions_2.IMenuService),
        __param(12, themeService_1.IThemeService),
        __param(13, remoteExplorerService_1.IRemoteExplorerService),
        __param(14, telemetry_1.ITelemetryService),
        __param(15, tunnel_1.ITunnelService),
        __param(16, contextView_1.IContextViewService)
    ], TunnelPanel);
    class TunnelPanelDescriptor {
        constructor(viewModel, environmentService) {
            this.id = TunnelPanel.ID;
            this.name = TunnelPanel.TITLE;
            this.canToggleVisibility = true;
            this.hideByDefault = false;
            // group is not actually used for views that are not extension contributed. Use order instead.
            this.group = 'details@0';
            // -500 comes from the remote explorer viewOrderDelegate
            this.order = -500;
            this.canMoveView = true;
            this.containerIcon = remoteIcons_1.portsViewIcon;
            this.ctorDescriptor = new descriptors_1.SyncDescriptor(TunnelPanel, [viewModel]);
            this.remoteAuthority = environmentService.remoteAuthority ? environmentService.remoteAuthority.split('+')[0] : undefined;
        }
    }
    exports.TunnelPanelDescriptor = TunnelPanelDescriptor;
    function isITunnelItem(item) {
        return item && item.tunnelType && item.remoteHost && item.source;
    }
    var LabelTunnelAction;
    (function (LabelTunnelAction) {
        LabelTunnelAction.ID = 'remote.tunnel.label';
        LabelTunnelAction.LABEL = nls.localize('remote.tunnel.label', "Set Port Label");
        LabelTunnelAction.COMMAND_ID_KEYWORD = 'label';
        function handler() {
            return async (accessor, arg) => {
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                let tunnelContext;
                if (isITunnelItem(arg)) {
                    tunnelContext = arg;
                }
                else {
                    const context = accessor.get(contextkey_1.IContextKeyService).getContextKeyValue(TunnelViewSelectionKeyName);
                    const tunnel = context ? remoteExplorerService.tunnelModel.forwarded.get(context) : undefined;
                    if (tunnel) {
                        const tunnelService = accessor.get(tunnel_1.ITunnelService);
                        tunnelContext = TunnelItem.createFromTunnel(remoteExplorerService, tunnelService, tunnel);
                    }
                }
                if (tunnelContext) {
                    const tunnelItem = tunnelContext;
                    return new Promise(resolve => {
                        const startingValue = tunnelItem.name ? tunnelItem.name : `${tunnelItem.remotePort}`;
                        remoteExplorerService.setEditable(tunnelItem, remoteExplorerService_1.TunnelEditId.Label, {
                            onFinish: async (value, success) => {
                                value = value.trim();
                                remoteExplorerService.setEditable(tunnelItem, remoteExplorerService_1.TunnelEditId.Label, null);
                                const changed = success && (value !== startingValue);
                                if (changed) {
                                    await remoteExplorerService.tunnelModel.name(tunnelItem.remoteHost, tunnelItem.remotePort, value);
                                }
                                resolve(changed ? { port: tunnelItem.remotePort, label: value } : undefined);
                            },
                            validationMessage: () => null,
                            placeholder: nls.localize('remote.tunnelsView.labelPlaceholder', "Port label"),
                            startingValue
                        });
                    });
                }
                return undefined;
            };
        }
        LabelTunnelAction.handler = handler;
    })(LabelTunnelAction || (LabelTunnelAction = {}));
    const invalidPortString = nls.localize('remote.tunnelsView.portNumberValid', "Forwarded port should be a number or a host:port.");
    const maxPortNumber = 65536;
    const invalidPortNumberString = nls.localize('remote.tunnelsView.portNumberToHigh', "Port number must be \u2265 0 and < {0}.", maxPortNumber);
    const requiresSudoString = nls.localize('remote.tunnelView.inlineElevationMessage', "May Require Sudo");
    const alreadyForwarded = nls.localize('remote.tunnelView.alreadyForwarded', "Port is already forwarded");
    var ForwardPortAction;
    (function (ForwardPortAction) {
        ForwardPortAction.INLINE_ID = 'remote.tunnel.forwardInline';
        ForwardPortAction.COMMANDPALETTE_ID = 'remote.tunnel.forwardCommandPalette';
        ForwardPortAction.LABEL = nls.localize2('remote.tunnel.forward', "Forward a Port");
        ForwardPortAction.TREEITEM_LABEL = nls.localize('remote.tunnel.forwardItem', "Forward Port");
        const forwardPrompt = nls.localize('remote.tunnel.forwardPrompt', "Port number or address (eg. 3000 or 10.10.10.10:2000).");
        function validateInput(remoteExplorerService, tunnelService, value, canElevate) {
            const parsed = (0, tunnelModel_1.parseAddress)(value);
            if (!parsed) {
                return { content: invalidPortString, severity: notification_1.Severity.Error };
            }
            else if (parsed.port >= maxPortNumber) {
                return { content: invalidPortNumberString, severity: notification_1.Severity.Error };
            }
            else if (canElevate && tunnelService.isPortPrivileged(parsed.port)) {
                return { content: requiresSudoString, severity: notification_1.Severity.Info };
            }
            else if ((0, tunnelModel_1.mapHasAddressLocalhostOrAllInterfaces)(remoteExplorerService.tunnelModel.forwarded, parsed.host, parsed.port)) {
                return { content: alreadyForwarded, severity: notification_1.Severity.Error };
            }
            return null;
        }
        function error(notificationService, tunnelOrError, host, port) {
            if (!tunnelOrError) {
                notificationService.warn(nls.localize('remote.tunnel.forwardError', "Unable to forward {0}:{1}. The host may not be available or that remote port may already be forwarded", host, port));
            }
            else if (typeof tunnelOrError === 'string') {
                notificationService.warn(nls.localize('remote.tunnel.forwardErrorProvided', "Unable to forward {0}:{1}. {2}", host, port, tunnelOrError));
            }
        }
        function inlineHandler() {
            return async (accessor, arg) => {
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const tunnelService = accessor.get(tunnel_1.ITunnelService);
                remoteExplorerService.setEditable(undefined, remoteExplorerService_1.TunnelEditId.New, {
                    onFinish: async (value, success) => {
                        remoteExplorerService.setEditable(undefined, remoteExplorerService_1.TunnelEditId.New, null);
                        let parsed;
                        if (success && (parsed = (0, tunnelModel_1.parseAddress)(value))) {
                            remoteExplorerService.forward({
                                remote: { host: parsed.host, port: parsed.port },
                                elevateIfNeeded: true
                            }).then(tunnelOrError => error(notificationService, tunnelOrError, parsed.host, parsed.port));
                        }
                    },
                    validationMessage: (value) => validateInput(remoteExplorerService, tunnelService, value, tunnelService.canElevate),
                    placeholder: forwardPrompt
                });
            };
        }
        ForwardPortAction.inlineHandler = inlineHandler;
        function commandPaletteHandler() {
            return async (accessor, arg) => {
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const viewsService = accessor.get(viewsService_1.IViewsService);
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const tunnelService = accessor.get(tunnel_1.ITunnelService);
                await viewsService.openView(TunnelPanel.ID, true);
                const value = await quickInputService.input({
                    prompt: forwardPrompt,
                    validateInput: (value) => Promise.resolve(validateInput(remoteExplorerService, tunnelService, value, tunnelService.canElevate))
                });
                let parsed;
                if (value && (parsed = (0, tunnelModel_1.parseAddress)(value))) {
                    remoteExplorerService.forward({
                        remote: { host: parsed.host, port: parsed.port },
                        elevateIfNeeded: true
                    }).then(tunnel => error(notificationService, tunnel, parsed.host, parsed.port));
                }
            };
        }
        ForwardPortAction.commandPaletteHandler = commandPaletteHandler;
    })(ForwardPortAction || (exports.ForwardPortAction = ForwardPortAction = {}));
    function makeTunnelPicks(tunnels, remoteExplorerService, tunnelService) {
        const picks = tunnels.map(forwarded => {
            const item = TunnelItem.createFromTunnel(remoteExplorerService, tunnelService, forwarded);
            return {
                label: item.label,
                description: item.processDescription,
                tunnel: item
            };
        });
        if (picks.length === 0) {
            picks.push({
                label: nls.localize('remote.tunnel.closeNoPorts', "No ports currently forwarded. Try running the {0} command", ForwardPortAction.LABEL.value)
            });
        }
        return picks;
    }
    var ClosePortAction;
    (function (ClosePortAction) {
        ClosePortAction.INLINE_ID = 'remote.tunnel.closeInline';
        ClosePortAction.COMMANDPALETTE_ID = 'remote.tunnel.closeCommandPalette';
        ClosePortAction.LABEL = nls.localize2('remote.tunnel.close', "Stop Forwarding Port");
        function inlineHandler() {
            return async (accessor, arg) => {
                const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                let ports = [];
                const multiSelectContext = contextKeyService.getContextKeyValue(TunnelViewMultiSelectionKeyName);
                if (multiSelectContext) {
                    multiSelectContext.forEach(context => {
                        const tunnel = remoteExplorerService.tunnelModel.forwarded.get(context);
                        if (tunnel) {
                            ports?.push(tunnel);
                        }
                    });
                }
                else if (isITunnelItem(arg)) {
                    ports = [arg];
                }
                else {
                    const context = contextKeyService.getContextKeyValue(TunnelViewSelectionKeyName);
                    const tunnel = context ? remoteExplorerService.tunnelModel.forwarded.get(context) : undefined;
                    if (tunnel) {
                        ports = [tunnel];
                    }
                }
                if (!ports || ports.length === 0) {
                    return;
                }
                return Promise.all(ports.map(port => remoteExplorerService.close({ host: port.remoteHost, port: port.remotePort }, tunnelModel_1.TunnelCloseReason.User)));
            };
        }
        ClosePortAction.inlineHandler = inlineHandler;
        function commandPaletteHandler() {
            return async (accessor) => {
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const tunnelService = accessor.get(tunnel_1.ITunnelService);
                const commandService = accessor.get(commands_1.ICommandService);
                const picks = makeTunnelPicks(Array.from(remoteExplorerService.tunnelModel.forwarded.values()).filter(tunnel => tunnel.closeable), remoteExplorerService, tunnelService);
                const result = await quickInputService.pick(picks, { placeHolder: nls.localize('remote.tunnel.closePlaceholder', "Choose a port to stop forwarding") });
                if (result && result.tunnel) {
                    await remoteExplorerService.close({ host: result.tunnel.remoteHost, port: result.tunnel.remotePort }, tunnelModel_1.TunnelCloseReason.User);
                }
                else if (result) {
                    await commandService.executeCommand(ForwardPortAction.COMMANDPALETTE_ID);
                }
            };
        }
        ClosePortAction.commandPaletteHandler = commandPaletteHandler;
    })(ClosePortAction || (ClosePortAction = {}));
    var OpenPortInBrowserAction;
    (function (OpenPortInBrowserAction) {
        OpenPortInBrowserAction.ID = 'remote.tunnel.open';
        OpenPortInBrowserAction.LABEL = nls.localize('remote.tunnel.open', "Open in Browser");
        function handler() {
            return async (accessor, arg) => {
                let key;
                if (isITunnelItem(arg)) {
                    key = (0, tunnelModel_1.makeAddress)(arg.remoteHost, arg.remotePort);
                }
                else if (arg.tunnelRemoteHost && arg.tunnelRemotePort) {
                    key = (0, tunnelModel_1.makeAddress)(arg.tunnelRemoteHost, arg.tunnelRemotePort);
                }
                if (key) {
                    const model = accessor.get(remoteExplorerService_1.IRemoteExplorerService).tunnelModel;
                    const openerService = accessor.get(opener_1.IOpenerService);
                    return run(model, openerService, key);
                }
            };
        }
        OpenPortInBrowserAction.handler = handler;
        function run(model, openerService, key) {
            const tunnel = model.forwarded.get(key) || model.detected.get(key);
            if (tunnel) {
                return openerService.open(tunnel.localUri, { allowContributedOpeners: false });
            }
            return Promise.resolve();
        }
        OpenPortInBrowserAction.run = run;
    })(OpenPortInBrowserAction || (exports.OpenPortInBrowserAction = OpenPortInBrowserAction = {}));
    var OpenPortInPreviewAction;
    (function (OpenPortInPreviewAction) {
        OpenPortInPreviewAction.ID = 'remote.tunnel.openPreview';
        OpenPortInPreviewAction.LABEL = nls.localize('remote.tunnel.openPreview', "Preview in Editor");
        function handler() {
            return async (accessor, arg) => {
                let key;
                if (isITunnelItem(arg)) {
                    key = (0, tunnelModel_1.makeAddress)(arg.remoteHost, arg.remotePort);
                }
                else if (arg.tunnelRemoteHost && arg.tunnelRemotePort) {
                    key = (0, tunnelModel_1.makeAddress)(arg.tunnelRemoteHost, arg.tunnelRemotePort);
                }
                if (key) {
                    const model = accessor.get(remoteExplorerService_1.IRemoteExplorerService).tunnelModel;
                    const openerService = accessor.get(opener_1.IOpenerService);
                    const externalOpenerService = accessor.get(externalUriOpenerService_1.IExternalUriOpenerService);
                    return run(model, openerService, externalOpenerService, key);
                }
            };
        }
        OpenPortInPreviewAction.handler = handler;
        async function run(model, openerService, externalOpenerService, key) {
            const tunnel = model.forwarded.get(key) || model.detected.get(key);
            if (tunnel) {
                const remoteHost = tunnel.remoteHost.includes(':') ? `[${tunnel.remoteHost}]` : tunnel.remoteHost;
                const sourceUri = uri_1.URI.parse(`http://${remoteHost}:${tunnel.remotePort}`);
                const opener = await externalOpenerService.getOpener(tunnel.localUri, { sourceUri }, cancellation_1.CancellationToken.None);
                if (opener) {
                    return opener.openExternalUri(tunnel.localUri, { sourceUri }, cancellation_1.CancellationToken.None);
                }
                return openerService.open(tunnel.localUri);
            }
            return Promise.resolve();
        }
        OpenPortInPreviewAction.run = run;
    })(OpenPortInPreviewAction || (exports.OpenPortInPreviewAction = OpenPortInPreviewAction = {}));
    var OpenPortInBrowserCommandPaletteAction;
    (function (OpenPortInBrowserCommandPaletteAction) {
        OpenPortInBrowserCommandPaletteAction.ID = 'remote.tunnel.openCommandPalette';
        OpenPortInBrowserCommandPaletteAction.LABEL = nls.localize('remote.tunnel.openCommandPalette', "Open Port in Browser");
        function handler() {
            return async (accessor, arg) => {
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const tunnelService = accessor.get(tunnel_1.ITunnelService);
                const model = remoteExplorerService.tunnelModel;
                const quickPickService = accessor.get(quickInput_1.IQuickInputService);
                const openerService = accessor.get(opener_1.IOpenerService);
                const commandService = accessor.get(commands_1.ICommandService);
                const options = [...model.forwarded, ...model.detected].map(value => {
                    const tunnelItem = TunnelItem.createFromTunnel(remoteExplorerService, tunnelService, value[1]);
                    return {
                        label: tunnelItem.label,
                        description: tunnelItem.processDescription,
                        tunnel: tunnelItem
                    };
                });
                if (options.length === 0) {
                    options.push({
                        label: nls.localize('remote.tunnel.openCommandPaletteNone', "No ports currently forwarded. Open the Ports view to get started.")
                    });
                }
                else {
                    options.push({
                        label: nls.localize('remote.tunnel.openCommandPaletteView', "Open the Ports view...")
                    });
                }
                const picked = await quickPickService.pick(options, { placeHolder: nls.localize('remote.tunnel.openCommandPalettePick', "Choose the port to open") });
                if (picked && picked.tunnel) {
                    return OpenPortInBrowserAction.run(model, openerService, (0, tunnelModel_1.makeAddress)(picked.tunnel.remoteHost, picked.tunnel.remotePort));
                }
                else if (picked) {
                    return commandService.executeCommand(`${remoteExplorerService_1.TUNNEL_VIEW_ID}.focus`);
                }
            };
        }
        OpenPortInBrowserCommandPaletteAction.handler = handler;
    })(OpenPortInBrowserCommandPaletteAction || (OpenPortInBrowserCommandPaletteAction = {}));
    var CopyAddressAction;
    (function (CopyAddressAction) {
        CopyAddressAction.INLINE_ID = 'remote.tunnel.copyAddressInline';
        CopyAddressAction.COMMANDPALETTE_ID = 'remote.tunnel.copyAddressCommandPalette';
        CopyAddressAction.INLINE_LABEL = nls.localize('remote.tunnel.copyAddressInline', "Copy Local Address");
        CopyAddressAction.COMMANDPALETTE_LABEL = nls.localize('remote.tunnel.copyAddressCommandPalette', "Copy Forwarded Port Address");
        async function copyAddress(remoteExplorerService, clipboardService, tunnelItem) {
            const address = remoteExplorerService.tunnelModel.address(tunnelItem.remoteHost, tunnelItem.remotePort);
            if (address) {
                await clipboardService.writeText(address.toString());
            }
        }
        function inlineHandler() {
            return async (accessor, arg) => {
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                let tunnelItem;
                if (isITunnelItem(arg)) {
                    tunnelItem = arg;
                }
                else {
                    const context = accessor.get(contextkey_1.IContextKeyService).getContextKeyValue(TunnelViewSelectionKeyName);
                    tunnelItem = context ? remoteExplorerService.tunnelModel.forwarded.get(context) : undefined;
                }
                if (tunnelItem) {
                    return copyAddress(remoteExplorerService, accessor.get(clipboardService_1.IClipboardService), tunnelItem);
                }
            };
        }
        CopyAddressAction.inlineHandler = inlineHandler;
        function commandPaletteHandler() {
            return async (accessor, arg) => {
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const tunnelService = accessor.get(tunnel_1.ITunnelService);
                const commandService = accessor.get(commands_1.ICommandService);
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const tunnels = Array.from(remoteExplorerService.tunnelModel.forwarded.values()).concat(Array.from(remoteExplorerService.tunnelModel.detected.values()));
                const result = await quickInputService.pick(makeTunnelPicks(tunnels, remoteExplorerService, tunnelService), { placeHolder: nls.localize('remote.tunnel.copyAddressPlaceholdter', "Choose a forwarded port") });
                if (result && result.tunnel) {
                    await copyAddress(remoteExplorerService, clipboardService, result.tunnel);
                }
                else if (result) {
                    await commandService.executeCommand(ForwardPortAction.COMMANDPALETTE_ID);
                }
            };
        }
        CopyAddressAction.commandPaletteHandler = commandPaletteHandler;
    })(CopyAddressAction || (CopyAddressAction = {}));
    var ChangeLocalPortAction;
    (function (ChangeLocalPortAction) {
        ChangeLocalPortAction.ID = 'remote.tunnel.changeLocalPort';
        ChangeLocalPortAction.LABEL = nls.localize('remote.tunnel.changeLocalPort', "Change Local Address Port");
        function validateInput(tunnelService, value, canElevate) {
            if (!value.match(/^[0-9]+$/)) {
                return { content: nls.localize('remote.tunnelsView.portShouldBeNumber', "Local port should be a number."), severity: notification_1.Severity.Error };
            }
            else if (Number(value) >= maxPortNumber) {
                return { content: invalidPortNumberString, severity: notification_1.Severity.Error };
            }
            else if (canElevate && tunnelService.isPortPrivileged(Number(value))) {
                return { content: requiresSudoString, severity: notification_1.Severity.Info };
            }
            return null;
        }
        function handler() {
            return async (accessor, arg) => {
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const tunnelService = accessor.get(tunnel_1.ITunnelService);
                let tunnelContext;
                if (isITunnelItem(arg)) {
                    tunnelContext = arg;
                }
                else {
                    const context = accessor.get(contextkey_1.IContextKeyService).getContextKeyValue(TunnelViewSelectionKeyName);
                    const tunnel = context ? remoteExplorerService.tunnelModel.forwarded.get(context) : undefined;
                    if (tunnel) {
                        const tunnelService = accessor.get(tunnel_1.ITunnelService);
                        tunnelContext = TunnelItem.createFromTunnel(remoteExplorerService, tunnelService, tunnel);
                    }
                }
                if (tunnelContext) {
                    const tunnelItem = tunnelContext;
                    remoteExplorerService.setEditable(tunnelItem, remoteExplorerService_1.TunnelEditId.LocalPort, {
                        onFinish: async (value, success) => {
                            remoteExplorerService.setEditable(tunnelItem, remoteExplorerService_1.TunnelEditId.LocalPort, null);
                            if (success) {
                                await remoteExplorerService.close({ host: tunnelItem.remoteHost, port: tunnelItem.remotePort }, tunnelModel_1.TunnelCloseReason.Other);
                                const numberValue = Number(value);
                                const newForward = await remoteExplorerService.forward({
                                    remote: { host: tunnelItem.remoteHost, port: tunnelItem.remotePort },
                                    local: numberValue,
                                    name: tunnelItem.name,
                                    elevateIfNeeded: true,
                                    source: tunnelItem.source
                                });
                                if (newForward && (typeof newForward !== 'string') && newForward.tunnelLocalPort !== numberValue) {
                                    notificationService.warn(nls.localize('remote.tunnel.changeLocalPortNumber', "The local port {0} is not available. Port number {1} has been used instead", value, newForward.tunnelLocalPort ?? newForward.localAddress));
                                }
                            }
                        },
                        validationMessage: (value) => validateInput(tunnelService, value, tunnelService.canElevate),
                        placeholder: nls.localize('remote.tunnelsView.changePort', "New local port")
                    });
                }
            };
        }
        ChangeLocalPortAction.handler = handler;
    })(ChangeLocalPortAction || (ChangeLocalPortAction = {}));
    var ChangeTunnelPrivacyAction;
    (function (ChangeTunnelPrivacyAction) {
        function handler(privacyId) {
            return async (accessor, arg) => {
                if (isITunnelItem(arg)) {
                    const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                    await remoteExplorerService.close({ host: arg.remoteHost, port: arg.remotePort }, tunnelModel_1.TunnelCloseReason.Other);
                    return remoteExplorerService.forward({
                        remote: { host: arg.remoteHost, port: arg.remotePort },
                        local: arg.localPort,
                        name: arg.name,
                        elevateIfNeeded: true,
                        privacy: privacyId,
                        source: arg.source
                    });
                }
                return undefined;
            };
        }
        ChangeTunnelPrivacyAction.handler = handler;
    })(ChangeTunnelPrivacyAction || (ChangeTunnelPrivacyAction = {}));
    var SetTunnelProtocolAction;
    (function (SetTunnelProtocolAction) {
        SetTunnelProtocolAction.ID_HTTP = 'remote.tunnel.setProtocolHttp';
        SetTunnelProtocolAction.ID_HTTPS = 'remote.tunnel.setProtocolHttps';
        SetTunnelProtocolAction.LABEL_HTTP = nls.localize('remote.tunnel.protocolHttp', "HTTP");
        SetTunnelProtocolAction.LABEL_HTTPS = nls.localize('remote.tunnel.protocolHttps', "HTTPS");
        async function handler(arg, protocol, remoteExplorerService) {
            if (isITunnelItem(arg)) {
                const attributes = {
                    protocol
                };
                return remoteExplorerService.tunnelModel.configPortsAttributes.addAttributes(arg.remotePort, attributes, 4 /* ConfigurationTarget.USER_REMOTE */);
            }
        }
        function handlerHttp() {
            return async (accessor, arg) => {
                return handler(arg, tunnel_1.TunnelProtocol.Http, accessor.get(remoteExplorerService_1.IRemoteExplorerService));
            };
        }
        SetTunnelProtocolAction.handlerHttp = handlerHttp;
        function handlerHttps() {
            return async (accessor, arg) => {
                return handler(arg, tunnel_1.TunnelProtocol.Https, accessor.get(remoteExplorerService_1.IRemoteExplorerService));
            };
        }
        SetTunnelProtocolAction.handlerHttps = handlerHttps;
    })(SetTunnelProtocolAction || (SetTunnelProtocolAction = {}));
    const tunnelViewCommandsWeightBonus = 10; // give our commands a little bit more weight over other default list/tree commands
    const isForwardedExpr = TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Forwarded);
    const isForwardedOrDetectedExpr = contextkey_1.ContextKeyExpr.or(isForwardedExpr, TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Detected));
    const isNotMultiSelectionExpr = TunnelViewMultiSelectionContextKey.isEqualTo(undefined);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: LabelTunnelAction.ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + tunnelViewCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(TunnelViewFocusContextKey, isForwardedExpr, isNotMultiSelectionExpr),
        primary: 60 /* KeyCode.F2 */,
        mac: {
            primary: 3 /* KeyCode.Enter */
        },
        handler: LabelTunnelAction.handler()
    });
    commands_1.CommandsRegistry.registerCommand(ForwardPortAction.INLINE_ID, ForwardPortAction.inlineHandler());
    commands_1.CommandsRegistry.registerCommand(ForwardPortAction.COMMANDPALETTE_ID, ForwardPortAction.commandPaletteHandler());
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: ClosePortAction.INLINE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + tunnelViewCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(TunnelCloseableContextKey, TunnelViewFocusContextKey),
        primary: 20 /* KeyCode.Delete */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
            secondary: [20 /* KeyCode.Delete */]
        },
        handler: ClosePortAction.inlineHandler()
    });
    commands_1.CommandsRegistry.registerCommand(ClosePortAction.COMMANDPALETTE_ID, ClosePortAction.commandPaletteHandler());
    commands_1.CommandsRegistry.registerCommand(OpenPortInBrowserAction.ID, OpenPortInBrowserAction.handler());
    commands_1.CommandsRegistry.registerCommand(OpenPortInPreviewAction.ID, OpenPortInPreviewAction.handler());
    commands_1.CommandsRegistry.registerCommand(OpenPortInBrowserCommandPaletteAction.ID, OpenPortInBrowserCommandPaletteAction.handler());
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: CopyAddressAction.INLINE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + tunnelViewCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(TunnelViewFocusContextKey, isForwardedOrDetectedExpr, isNotMultiSelectionExpr),
        primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
        handler: CopyAddressAction.inlineHandler()
    });
    commands_1.CommandsRegistry.registerCommand(CopyAddressAction.COMMANDPALETTE_ID, CopyAddressAction.commandPaletteHandler());
    commands_1.CommandsRegistry.registerCommand(ChangeLocalPortAction.ID, ChangeLocalPortAction.handler());
    commands_1.CommandsRegistry.registerCommand(SetTunnelProtocolAction.ID_HTTP, SetTunnelProtocolAction.handlerHttp());
    commands_1.CommandsRegistry.registerCommand(SetTunnelProtocolAction.ID_HTTPS, SetTunnelProtocolAction.handlerHttps());
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, ({
        command: {
            id: ClosePortAction.COMMANDPALETTE_ID,
            title: ClosePortAction.LABEL
        },
        when: tunnelModel_1.forwardedPortsViewEnabled
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, ({
        command: {
            id: ForwardPortAction.COMMANDPALETTE_ID,
            title: ForwardPortAction.LABEL
        },
        when: tunnelModel_1.forwardedPortsViewEnabled
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, ({
        command: {
            id: CopyAddressAction.COMMANDPALETTE_ID,
            title: CopyAddressAction.COMMANDPALETTE_LABEL
        },
        when: tunnelModel_1.forwardedPortsViewEnabled
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, ({
        command: {
            id: OpenPortInBrowserCommandPaletteAction.ID,
            title: OpenPortInBrowserCommandPaletteAction.LABEL
        },
        when: tunnelModel_1.forwardedPortsViewEnabled
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '._open',
        order: 0,
        command: {
            id: OpenPortInBrowserAction.ID,
            title: OpenPortInBrowserAction.LABEL,
        },
        when: contextkey_1.ContextKeyExpr.and(isForwardedOrDetectedExpr, isNotMultiSelectionExpr)
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '._open',
        order: 1,
        command: {
            id: OpenPortInPreviewAction.ID,
            title: OpenPortInPreviewAction.LABEL,
        },
        when: contextkey_1.ContextKeyExpr.and(isForwardedOrDetectedExpr, isNotMultiSelectionExpr)
    }));
    // The group 0_manage is used by extensions, so try not to change it
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '0_manage',
        order: 1,
        command: {
            id: LabelTunnelAction.ID,
            title: LabelTunnelAction.LABEL,
            icon: remoteIcons_1.labelPortIcon
        },
        when: contextkey_1.ContextKeyExpr.and(isForwardedExpr, isNotMultiSelectionExpr)
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '2_localaddress',
        order: 0,
        command: {
            id: CopyAddressAction.INLINE_ID,
            title: CopyAddressAction.INLINE_LABEL,
        },
        when: contextkey_1.ContextKeyExpr.and(isForwardedOrDetectedExpr, isNotMultiSelectionExpr)
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '2_localaddress',
        order: 1,
        command: {
            id: ChangeLocalPortAction.ID,
            title: ChangeLocalPortAction.LABEL,
        },
        when: contextkey_1.ContextKeyExpr.and(isForwardedExpr, PortChangableContextKey, isNotMultiSelectionExpr)
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '2_localaddress',
        order: 2,
        submenu: actions_2.MenuId.TunnelPrivacy,
        title: nls.localize('tunnelContext.privacyMenu', "Port Visibility"),
        when: contextkey_1.ContextKeyExpr.and(isForwardedExpr, TunnelPrivacyEnabledContextKey)
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '2_localaddress',
        order: 3,
        submenu: actions_2.MenuId.TunnelProtocol,
        title: nls.localize('tunnelContext.protocolMenu', "Change Port Protocol"),
        when: contextkey_1.ContextKeyExpr.and(isForwardedExpr, isNotMultiSelectionExpr, ProtocolChangeableContextKey)
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '3_forward',
        order: 0,
        command: {
            id: ClosePortAction.INLINE_ID,
            title: ClosePortAction.LABEL,
        },
        when: TunnelCloseableContextKey
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '3_forward',
        order: 1,
        command: {
            id: ForwardPortAction.INLINE_ID,
            title: ForwardPortAction.LABEL,
        },
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelProtocol, ({
        order: 0,
        command: {
            id: SetTunnelProtocolAction.ID_HTTP,
            title: SetTunnelProtocolAction.LABEL_HTTP,
            toggled: TunnelProtocolContextKey.isEqualTo(tunnel_1.TunnelProtocol.Http)
        }
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelProtocol, ({
        order: 1,
        command: {
            id: SetTunnelProtocolAction.ID_HTTPS,
            title: SetTunnelProtocolAction.LABEL_HTTPS,
            toggled: TunnelProtocolContextKey.isEqualTo(tunnel_1.TunnelProtocol.Https)
        }
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelPortInline, ({
        group: '0_manage',
        order: 0,
        command: {
            id: ForwardPortAction.INLINE_ID,
            title: ForwardPortAction.TREEITEM_LABEL,
            icon: remoteIcons_1.forwardPortIcon
        },
        when: TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Candidate)
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelPortInline, ({
        group: '0_manage',
        order: 4,
        command: {
            id: LabelTunnelAction.ID,
            title: LabelTunnelAction.LABEL,
            icon: remoteIcons_1.labelPortIcon
        },
        when: isForwardedExpr
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelPortInline, ({
        group: '0_manage',
        order: 5,
        command: {
            id: ClosePortAction.INLINE_ID,
            title: ClosePortAction.LABEL,
            icon: remoteIcons_1.stopForwardIcon
        },
        when: TunnelCloseableContextKey
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelLocalAddressInline, ({
        order: -1,
        command: {
            id: CopyAddressAction.INLINE_ID,
            title: CopyAddressAction.INLINE_LABEL,
            icon: remoteIcons_1.copyAddressIcon
        },
        when: isForwardedOrDetectedExpr
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelLocalAddressInline, ({
        order: 0,
        command: {
            id: OpenPortInBrowserAction.ID,
            title: OpenPortInBrowserAction.LABEL,
            icon: remoteIcons_1.openBrowserIcon
        },
        when: isForwardedOrDetectedExpr
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelLocalAddressInline, ({
        order: 1,
        command: {
            id: OpenPortInPreviewAction.ID,
            title: OpenPortInPreviewAction.LABEL,
            icon: remoteIcons_1.openPreviewIcon
        },
        when: isForwardedOrDetectedExpr
    }));
    (0, colorRegistry_1.registerColor)('ports.iconRunningProcessForeground', {
        light: theme_1.STATUS_BAR_REMOTE_ITEM_BACKGROUND,
        dark: theme_1.STATUS_BAR_REMOTE_ITEM_BACKGROUND,
        hcDark: theme_1.STATUS_BAR_REMOTE_ITEM_BACKGROUND,
        hcLight: theme_1.STATUS_BAR_REMOTE_ITEM_BACKGROUND
    }, nls.localize('portWithRunningProcess.foreground', "The color of the icon for a port that has an associated running process."));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcmVtb3RlL2Jyb3dzZXIvdHVubmVsVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeURuRixRQUFBLHlCQUF5QixHQUFHLElBQUksMEJBQWEsQ0FBVSxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVqRyxNQUFNLHlCQUF5QjtRQUk5QixZQUE2QixxQkFBNkM7WUFBN0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUZqRSxvQkFBZSxHQUFXLEVBQUUsQ0FBQztRQUV3QyxDQUFDO1FBRS9FLFNBQVMsQ0FBQyxHQUFnQjtZQUN6QixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsS0FBSyxrQ0FBVSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDaEgsQ0FBQztLQUNEO0lBU00sSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZTtRQThCM0IsWUFDeUIscUJBQThELEVBQ3RFLGFBQThDO1lBRHJCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDckQsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBNUJ2RCxnQkFBVyxHQUErQixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBRW5ELFVBQUssR0FBRztnQkFDaEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLEVBQUUsVUFBVSxDQUFDO2dCQUM3RCxJQUFJLEVBQUUsU0FBUztnQkFDZixVQUFVLEVBQUUsa0NBQVUsQ0FBQyxHQUFHO2dCQUMxQixpQkFBaUIsRUFBRSxL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