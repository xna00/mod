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
define(["require", "exports", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/terminal/browser/terminal", "vs/nls", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/terminal/common/terminal", "vs/base/common/codicons", "vs/base/common/actions", "vs/workbench/browser/labels", "vs/workbench/services/decorations/common/decorations", "vs/platform/hover/browser/hover", "vs/base/common/severity", "vs/base/common/lifecycle", "vs/base/browser/dnd", "vs/base/common/async", "vs/base/browser/ui/list/listView", "vs/base/common/uri", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/functional", "vs/platform/dnd/browser/dnd", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/browser/terminalTooltip", "vs/platform/theme/browser/defaultStyles", "vs/base/common/event", "vs/base/common/network", "vs/workbench/contrib/terminal/browser/terminalStatusList", "vs/workbench/contrib/terminal/browser/terminalContextMenu"], function (require, exports, listService_1, configuration_1, contextkey_1, keybinding_1, themeService_1, themables_1, terminal_1, nls_1, DOM, instantiation_1, actionbar_1, actions_1, menuEntryActionViewItem_1, terminal_2, codicons_1, actions_2, labels_1, decorations_1, hover_1, severity_1, lifecycle_1, dnd_1, async_1, listView_1, uri_1, terminalIcon_1, contextView_1, inputBox_1, functional_1, dnd_2, terminalStrings_1, lifecycle_2, terminalContextKey_1, terminalUri_1, terminalTooltip_1, defaultStyles_1, event_1, network_1, terminalStatusList_1, terminalContextMenu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalTabList = exports.TerminalTabsListSizes = void 0;
    const $ = DOM.$;
    var TerminalTabsListSizes;
    (function (TerminalTabsListSizes) {
        TerminalTabsListSizes[TerminalTabsListSizes["TabHeight"] = 22] = "TabHeight";
        TerminalTabsListSizes[TerminalTabsListSizes["NarrowViewWidth"] = 46] = "NarrowViewWidth";
        TerminalTabsListSizes[TerminalTabsListSizes["WideViewMinimumWidth"] = 80] = "WideViewMinimumWidth";
        TerminalTabsListSizes[TerminalTabsListSizes["DefaultWidth"] = 120] = "DefaultWidth";
        TerminalTabsListSizes[TerminalTabsListSizes["MidpointViewWidth"] = 63] = "MidpointViewWidth";
        TerminalTabsListSizes[TerminalTabsListSizes["ActionbarMinimumWidth"] = 105] = "ActionbarMinimumWidth";
        TerminalTabsListSizes[TerminalTabsListSizes["MaximumWidth"] = 500] = "MaximumWidth";
    })(TerminalTabsListSizes || (exports.TerminalTabsListSizes = TerminalTabsListSizes = {}));
    let TerminalTabList = class TerminalTabList extends listService_1.WorkbenchList {
        constructor(container, contextKeyService, listService, themeService, _configurationService, _terminalService, _terminalGroupService, instantiationService, decorationsService, _themeService, lifecycleService, _hoverService) {
            super('TerminalTabsList', container, {
                getHeight: () => 22 /* TerminalTabsListSizes.TabHeight */,
                getTemplateId: () => 'terminal.tabs'
            }, [instantiationService.createInstance(TerminalTabsRenderer, container, instantiationService.createInstance(labels_1.ResourceLabels, labels_1.DEFAULT_LABELS_CONTAINER), () => this.getSelectedElements())], {
                horizontalScrolling: false,
                supportDynamicHeights: false,
                selectionNavigation: true,
                identityProvider: {
                    getId: e => e?.instanceId
                },
                accessibilityProvider: instantiationService.createInstance(TerminalTabsAccessibilityProvider),
                smoothScrolling: _configurationService.getValue('workbench.list.smoothScrolling'),
                multipleSelectionSupport: true,
                paddingBottom: 22 /* TerminalTabsListSizes.TabHeight */,
                dnd: instantiationService.createInstance(TerminalTabsDragAndDrop),
                openOnSingleClick: true
            }, contextKeyService, listService, _configurationService, instantiationService);
            this._configurationService = _configurationService;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._themeService = _themeService;
            this._hoverService = _hoverService;
            const instanceDisposables = [
                this._terminalGroupService.onDidChangeInstances(() => this.refresh()),
                this._terminalGroupService.onDidChangeGroups(() => this.refresh()),
                this._terminalGroupService.onDidShow(() => this.refresh()),
                this._terminalGroupService.onDidChangeInstanceCapability(() => this.refresh()),
                this._terminalService.onAnyInstanceTitleChange(() => this.refresh()),
                this._terminalService.onAnyInstanceIconChange(() => this.refresh()),
                this._terminalService.onAnyInstancePrimaryStatusChange(() => this.refresh()),
                this._terminalService.onDidChangeConnectionState(() => this.refresh()),
                this._themeService.onDidColorThemeChange(() => this.refresh()),
                this._terminalGroupService.onDidChangeActiveInstance(e => {
                    if (e) {
                        const i = this._terminalGroupService.instances.indexOf(e);
                        this.setSelection([i]);
                        this.reveal(i);
                    }
                    this.refresh();
                })
            ];
            // Dispose of instance listeners on shutdown to avoid extra work and so tabs don't disappear
            // briefly
            lifecycleService.onWillShutdown(e => {
                (0, lifecycle_1.dispose)(instanceDisposables);
            });
            this.onMouseDblClick(async (e) => {
                const focus = this.getFocus();
                if (focus.length === 0) {
                    const instance = await this._terminalService.createTerminal({ location: terminal_2.TerminalLocation.Panel });
                    this._terminalGroupService.setActiveInstance(instance);
                    await instance.focusWhenReady();
                }
                if (this._terminalService.getEditingTerminal()?.instanceId === e.element?.instanceId) {
                    return;
                }
                if (this._getFocusMode() === 'doubleClick' && this.getFocus().length === 1) {
                    e.element?.focus(true);
                }
            });
            // on left click, if focus mode = single click, focus the element
            // unless multi-selection is in progress
            this.onMouseClick(async (e) => {
                if (this._terminalService.getEditingTerminal()?.instanceId === e.element?.instanceId) {
                    return;
                }
                if (e.browserEvent.altKey && e.element) {
                    await this._terminalService.createTerminal({ location: { parentTerminal: e.element } });
                }
                else if (this._getFocusMode() === 'singleClick') {
                    if (this.getSelection().length <= 1) {
                        e.element?.focus(true);
                    }
                }
            });
            // on right click, set the focus to that element
            // unless multi-selection is in progress
            this.onContextMenu(e => {
                if (!e.element) {
                    this.setSelection([]);
                    return;
                }
                const selection = this.getSelectedElements();
                if (!selection || !selection.find(s => e.element === s)) {
                    this.setFocus(e.index !== undefined ? [e.index] : []);
                }
            });
            this._terminalTabsSingleSelectedContextKey = terminalContextKey_1.TerminalContextKeys.tabsSingularSelection.bindTo(contextKeyService);
            this._isSplitContextKey = terminalContextKey_1.TerminalContextKeys.splitTerminal.bindTo(contextKeyService);
            this.onDidChangeSelection(e => this._updateContextKey());
            this.onDidChangeFocus(() => this._updateContextKey());
            this.onDidOpen(async (e) => {
                const instance = e.element;
                if (!instance) {
                    return;
                }
                this._terminalGroupService.setActiveInstance(instance);
                if (!e.editorOptions.preserveFocus) {
                    await instance.focusWhenReady();
                }
            });
            if (!this._decorationsProvider) {
                this._decorationsProvider = this.disposables.add(instantiationService.createInstance(TabDecorationsProvider));
                this.disposables.add(decorationsService.registerDecorationsProvider(this._decorationsProvider));
            }
            this.refresh();
        }
        _getFocusMode() {
            return this._configurationService.getValue("terminal.integrated.tabs.focusMode" /* TerminalSettingId.TabsFocusMode */);
        }
        refresh(cancelEditing = true) {
            if (cancelEditing && this._terminalService.isEditable(undefined)) {
                this.domFocus();
            }
            this.splice(0, this.length, this._terminalGroupService.instances.slice());
        }
        focusHover() {
            const instance = this.getSelectedElements()[0];
            if (!instance) {
                return;
            }
            this._hoverService.showHover({
                ...(0, terminalTooltip_1.getInstanceHoverInfo)(instance),
                target: this.getHTMLElement(),
                trapFocus: true
            }, true);
        }
        _updateContextKey() {
            this._terminalTabsSingleSelectedContextKey.set(this.getSelectedElements().length === 1);
            const instance = this.getFocusedElements();
            this._isSplitContextKey.set(instance.length > 0 && this._terminalGroupService.instanceIsSplit(instance[0]));
        }
    };
    exports.TerminalTabList = TerminalTabList;
    exports.TerminalTabList = TerminalTabList = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, listService_1.IListService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, terminal_1.ITerminalService),
        __param(6, terminal_1.ITerminalGroupService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, decorations_1.IDecorationsService),
        __param(9, themeService_1.IThemeService),
        __param(10, lifecycle_2.ILifecycleService),
        __param(11, hover_1.IHoverService)
    ], TerminalTabList);
    let TerminalTabsRenderer = class TerminalTabsRenderer {
        constructor(_container, _labels, _getSelection, _instantiationService, _terminalService, _terminalGroupService, _hoverService, _configurationService, _keybindingService, _listService, _themeService, _contextViewService) {
            this._container = _container;
            this._labels = _labels;
            this._getSelection = _getSelection;
            this._instantiationService = _instantiationService;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._hoverService = _hoverService;
            this._configurationService = _configurationService;
            this._keybindingService = _keybindingService;
            this._listService = _listService;
            this._themeService = _themeService;
            this._contextViewService = _contextViewService;
            this.templateId = 'terminal.tabs';
        }
        renderTemplate(container) {
            const element = DOM.append(container, $('.terminal-tabs-entry'));
            const context = {};
            const label = this._labels.create(element, {
                supportHighlights: true,
                supportDescriptionHighlights: true,
                supportIcons: true,
                hoverDelegate: {
                    delay: this._configurationService.getValue('workbench.hover.delay'),
                    showHover: options => {
                        return this._hoverService.showHover({
                            ...options,
                            actions: context.hoverActions,
                            persistence: {
                                hideOnHover: true
                            }
                        });
                    }
                }
            });
            const actionsContainer = DOM.append(label.element, $('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionRunner: new terminalContextMenu_1.TerminalContextActionRunner(),
                actionViewItemProvider: (action, options) => action instanceof actions_1.MenuItemAction
                    ? this._instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate })
                    : undefined
            });
            return {
                element,
                label,
                actionBar,
                context,
                elementDisposables: new lifecycle_1.DisposableStore(),
            };
        }
        shouldHideText() {
            return this._container ? this._container.clientWidth < 63 /* TerminalTabsListSizes.MidpointViewWidth */ : false;
        }
        shouldHideActionBar() {
            return this._container ? this._container.clientWidth <= 105 /* TerminalTabsListSizes.ActionbarMinimumWidth */ : false;
        }
        renderElement(instance, index, template) {
            const hasText = !this.shouldHideText();
            const group = this._terminalGroupService.getGroupForInstance(instance);
            if (!group) {
                throw new Error(`Could not find group for instance "${instance.instanceId}"`);
            }
            template.element.classList.toggle('has-text', hasText);
            template.element.classList.toggle('is-active', this._terminalGroupService.activeInstance === instance);
            let prefix = '';
            if (group.terminalInstances.length > 1) {
                const terminalIndex = group.terminalInstances.indexOf(instance);
                if (terminalIndex === 0) {
                    prefix = `┌ `;
                }
                else if (terminalIndex === group.terminalInstances.length - 1) {
                    prefix = `└ `;
                }
                else {
                    prefix = `├ `;
                }
            }
            const hoverInfo = (0, terminalTooltip_1.getInstanceHoverInfo)(instance);
            template.context.hoverActions = hoverInfo.actions;
            const iconId = this._instantiationService.invokeFunction(terminalIcon_1.getIconId, instance);
            const hasActionbar = !this.shouldHideActionBar();
            let label = '';
            if (!hasText) {
                const primaryStatus = instance.statusList.primary;
                // Don't show ignore severity
                if (primaryStatus && primaryStatus.severity > severity_1.default.Ignore) {
                    label = `${prefix}$(${primaryStatus.icon?.id || iconId})`;
                }
                else {
                    label = `${prefix}$(${iconId})`;
                }
            }
            else {
                this.fillActionBar(instance, template);
                label = prefix;
                // Only add the title if the icon is set, this prevents the title jumping around for
                // example when launching with a ShellLaunchConfig.name and no icon
                if (instance.icon) {
                    label += `$(${iconId}) ${instance.title}`;
                }
            }
            if (!hasActionbar) {
                template.actionBar.clear();
            }
            // Kill terminal on middle click
            template.elementDisposables.add(DOM.addDisposableListener(template.element, DOM.EventType.AUXCLICK, e => {
                e.stopImmediatePropagation();
                if (e.button === 1 /*middle*/) {
                    this._terminalService.safeDisposeTerminal(instance);
                }
            }));
            const extraClasses = [];
            const colorClass = (0, terminalIcon_1.getColorClass)(instance);
            if (colorClass) {
                extraClasses.push(colorClass);
            }
            const uriClasses = (0, terminalIcon_1.getUriClasses)(instance, this._themeService.getColorTheme().type);
            if (uriClasses) {
                extraClasses.push(...uriClasses);
            }
            template.label.setResource({
                resource: instance.resource,
                name: label,
                description: hasText ? instance.description : undefined
            }, {
                fileDecorations: {
                    colors: true,
                    badges: hasText
                },
                title: {
                    markdown: hoverInfo.content,
                    markdownNotSupportedFallback: undefined
                },
                extraClasses
            });
            const editableData = this._terminalService.getEditableData(instance);
            template.label.element.classList.toggle('editable-tab', !!editableData);
            if (editableData) {
                template.elementDisposables.add(this._renderInputBox(template.label.element.querySelector('.monaco-icon-label-container'), instance, editableData));
                template.actionBar.clear();
            }
        }
        _renderInputBox(container, instance, editableData) {
            const value = instance.title || '';
            const inputBox = new inputBox_1.InputBox(container, this._contextViewService, {
                validationOptions: {
                    validation: (value) => {
                        const message = editableData.validationMessage(value);
                        if (!message || message.severity !== severity_1.default.Error) {
                            return null;
                        }
                        return {
                            content: message.content,
                            formatContent: true,
                            type: 3 /* MessageType.ERROR */
                        };
                    }
                },
                ariaLabel: (0, nls_1.localize)('terminalInputAriaLabel', "Type terminal name. Press Enter to confirm or Escape to cancel."),
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles
            });
            inputBox.element.style.height = '22px';
            inputBox.value = value;
            inputBox.focus();
            inputBox.select({ start: 0, end: value.length });
            const done = (0, functional_1.createSingleCallFunction)((success, finishEditing) => {
                inputBox.element.style.display = 'none';
                const value = inputBox.value;
                (0, lifecycle_1.dispose)(toDispose);
                inputBox.element.remove();
                if (finishEditing) {
                    editableData.onFinish(value, success);
                }
            });
            const showInputBoxNotification = () => {
                if (inputBox.isInputValid()) {
                    const message = editableData.validationMessage(inputBox.value);
                    if (message) {
                        inputBox.showMessage({
                            content: message.content,
                            formatContent: true,
                            type: message.severity === severity_1.default.Info ? 1 /* MessageType.INFO */ : message.severity === severity_1.default.Warning ? 2 /* MessageType.WARNING */ : 3 /* MessageType.ERROR */
                        });
                    }
                    else {
                        inputBox.hideMessage();
                    }
                }
            };
            showInputBoxNotification();
            const toDispose = [
                inputBox,
                DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, (e) => {
                    e.stopPropagation();
                    if (e.equals(3 /* KeyCode.Enter */)) {
                        done(inputBox.isInputValid(), true);
                    }
                    else if (e.equals(9 /* KeyCode.Escape */)) {
                        done(false, true);
                    }
                }),
                DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_UP, (e) => {
                    showInputBoxNotification();
                }),
                DOM.addDisposableListener(inputBox.inputElement, DOM.EventType.BLUR, () => {
                    done(inputBox.isInputValid(), true);
                })
            ];
            return (0, lifecycle_1.toDisposable)(() => {
                done(false, false);
            });
        }
        disposeElement(instance, index, templateData) {
            templateData.elementDisposables.clear();
            templateData.actionBar.clear();
        }
        disposeTemplate(templateData) {
            templateData.elementDisposables.dispose();
            templateData.label.dispose();
            templateData.actionBar.dispose();
        }
        fillActionBar(instance, template) {
            // If the instance is within the selection, split all selected
            const actions = [
                new actions_2.Action("workbench.action.terminal.splitActiveTab" /* TerminalCommandId.SplitActiveTab */, terminalStrings_1.terminalStrings.split.short, themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitHorizontal), true, async () => {
                    this._runForSelectionOrInstance(instance, async (e) => {
                        this._terminalService.createTerminal({ location: { parentTerminal: e } });
                    });
                }),
                new actions_2.Action("workbench.action.terminal.killActiveTab" /* TerminalCommandId.KillActiveTab */, terminalStrings_1.terminalStrings.kill.short, themables_1.ThemeIcon.asClassName(codicons_1.Codicon.trashcan), true, async () => {
                    this._runForSelectionOrInstance(instance, e => this._terminalService.safeDisposeTerminal(e));
                })
            ];
            // TODO: Cache these in a way that will use the correct instance
            template.actionBar.clear();
            for (const action of actions) {
                template.actionBar.push(action, { icon: true, label: false, keybinding: this._keybindingService.lookupKeybinding(action.id)?.getLabel() });
            }
        }
        _runForSelectionOrInstance(instance, callback) {
            const selection = this._getSelection();
            if (selection.includes(instance)) {
                for (const s of selection) {
                    if (s) {
                        callback(s);
                    }
                }
            }
            else {
                callback(instance);
            }
            this._terminalGroupService.focusTabs();
            this._listService.lastFocusedList?.focusNext();
        }
    };
    TerminalTabsRenderer = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, terminal_1.ITerminalService),
        __param(5, terminal_1.ITerminalGroupService),
        __param(6, hover_1.IHoverService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, listService_1.IListService),
        __param(10, themeService_1.IThemeService),
        __param(11, contextView_1.IContextViewService)
    ], TerminalTabsRenderer);
    let TerminalTabsAccessibilityProvider = class TerminalTabsAccessibilityProvider {
        constructor(_terminalGroupService) {
            this._terminalGroupService = _terminalGroupService;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('terminal.tabs', "Terminal tabs");
        }
        getAriaLabel(instance) {
            let ariaLabel = '';
            const tab = this._terminalGroupService.getGroupForInstance(instance);
            if (tab && tab.terminalInstances?.length > 1) {
                const terminalIndex = tab.terminalInstances.indexOf(instance);
                ariaLabel = (0, nls_1.localize)({
                    key: 'splitTerminalAriaLabel',
                    comment: [
                        `The terminal's ID`,
                        `The terminal's title`,
                        `The terminal's split number`,
                        `The terminal group's total split number`
                    ]
                }, "Terminal {0} {1}, split {2} of {3}", instance.instanceId, instance.title, terminalIndex + 1, tab.terminalInstances.length);
            }
            else {
                ariaLabel = (0, nls_1.localize)({
                    key: 'terminalAriaLabel',
                    comment: [
                        `The terminal's ID`,
                        `The terminal's title`
                    ]
                }, "Terminal {0} {1}", instance.instanceId, instance.title);
            }
            return ariaLabel;
        }
    };
    TerminalTabsAccessibilityProvider = __decorate([
        __param(0, terminal_1.ITerminalGroupService)
    ], TerminalTabsAccessibilityProvider);
    let TerminalTabsDragAndDrop = class TerminalTabsDragAndDrop extends lifecycle_1.Disposable {
        constructor(_terminalService, _terminalGroupService) {
            super();
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._autoFocusDisposable = lifecycle_1.Disposable.None;
            this._primaryBackend = this._terminalService.getPrimaryBackend();
        }
        getDragURI(instance) {
            if (this._terminalService.getEditingTerminal()?.instanceId === instance.instanceId) {
                return null;
            }
            return instance.resource.toString();
        }
        getDragLabel(elements, originalEvent) {
            return elements.length === 1 ? elements[0].title : undefined;
        }
        onDragLeave() {
            this._autoFocusInstance = undefined;
            this._autoFocusDisposable.dispose();
            this._autoFocusDisposable = lifecycle_1.Disposable.None;
        }
        onDragStart(data, originalEvent) {
            if (!originalEvent.dataTransfer) {
                return;
            }
            const dndData = data.getData();
            if (!Array.isArray(dndData)) {
                return;
            }
            // Attach terminals type to event
            const terminals = dndData.filter(e => 'instanceId' in e);
            if (terminals.length > 0) {
                originalEvent.dataTransfer.setData("Terminals" /* TerminalDataTransfers.Terminals */, JSON.stringify(terminals.map(e => e.resource.toString())));
            }
        }
        onDragOver(data, targetInstance, targetIndex, targetSector, originalEvent) {
            if (data instanceof listView_1.NativeDragAndDropData) {
                if (!(0, dnd_2.containsDragType)(originalEvent, dnd_1.DataTransfers.FILES, dnd_1.DataTransfers.RESOURCES, "Terminals" /* TerminalDataTransfers.Terminals */, dnd_2.CodeDataTransfers.FILES)) {
                    return false;
                }
            }
            const didChangeAutoFocusInstance = this._autoFocusInstance !== targetInstance;
            if (didChangeAutoFocusInstance) {
                this._autoFocusDisposable.dispose();
                this._autoFocusInstance = targetInstance;
            }
            if (!targetInstance && !(0, dnd_2.containsDragType)(originalEvent, "Terminals" /* TerminalDataTransfers.Terminals */)) {
                return data instanceof listView_1.ElementsDragAndDropData;
            }
            if (didChangeAutoFocusInstance && targetInstance) {
                this._autoFocusDisposable = (0, async_1.disposableTimeout)(() => {
                    this._terminalService.setActiveInstance(targetInstance);
                    this._autoFocusInstance = undefined;
                }, 500, this._store);
            }
            return {
                feedback: targetIndex ? [targetIndex] : undefined,
                accept: true,
                effect: { type: 1 /* ListDragOverEffectType.Move */, position: "drop-target" /* ListDragOverEffectPosition.Over */ }
            };
        }
        async drop(data, targetInstance, targetIndex, targetSector, originalEvent) {
            this._autoFocusDisposable.dispose();
            this._autoFocusInstance = undefined;
            let sourceInstances;
            const promises = [];
            const resources = (0, terminalUri_1.getTerminalResourcesFromDragEvent)(originalEvent);
            if (resources) {
                for (const uri of resources) {
                    const instance = this._terminalService.getInstanceFromResource(uri);
                    if (instance) {
                        sourceInstances = [instance];
                        this._terminalService.moveToTerminalView(instance);
                    }
                    else if (this._primaryBackend) {
                        const terminalIdentifier = (0, terminalUri_1.parseTerminalUri)(uri);
                        if (terminalIdentifier.instanceId) {
                            promises.push(this._primaryBackend.requestDetachInstance(terminalIdentifier.workspaceId, terminalIdentifier.instanceId));
                        }
                    }
                }
            }
            if (promises.length) {
                let processes = await Promise.all(promises);
                processes = processes.filter(p => p !== undefined);
                let lastInstance;
                for (const attachPersistentProcess of processes) {
                    lastInstance = await this._terminalService.createTerminal({ config: { attachPersistentProcess } });
                }
                if (lastInstance) {
                    this._terminalService.setActiveInstance(lastInstance);
                }
                return;
            }
            if (sourceInstances === undefined) {
                if (!(data instanceof listView_1.ElementsDragAndDropData)) {
                    this._handleExternalDrop(targetInstance, originalEvent);
                    return;
                }
                const draggedElement = data.getData();
                if (!draggedElement || !Array.isArray(draggedElement)) {
                    return;
                }
                sourceInstances = [];
                for (const e of draggedElement) {
                    if ('instanceId' in e) {
                        sourceInstances.push(e);
                    }
                }
            }
            if (!targetInstance) {
                this._terminalGroupService.moveGroupToEnd(sourceInstances[0]);
                this._terminalService.setActiveInstance(sourceInstances[0]);
                return;
            }
            let focused = false;
            for (const instance of sourceInstances) {
                this._terminalGroupService.moveGroup(instance, targetInstance);
                if (!focused) {
                    this._terminalService.setActiveInstance(instance);
                    focused = true;
                }
            }
        }
        async _handleExternalDrop(instance, e) {
            if (!instance || !e.dataTransfer) {
                return;
            }
            // Check if files were dragged from the tree explorer
            let resource;
            const rawResources = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
            if (rawResources) {
                resource = uri_1.URI.parse(JSON.parse(rawResources)[0]);
            }
            const rawCodeFiles = e.dataTransfer.getData(dnd_2.CodeDataTransfers.FILES);
            if (!resource && rawCodeFiles) {
                resource = uri_1.URI.file(JSON.parse(rawCodeFiles)[0]);
            }
            if (!resource && e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].path /* Electron only */) {
                // Check if the file was dragged from the filesystem
                resource = uri_1.URI.file(e.dataTransfer.files[0].path);
            }
            if (!resource) {
                return;
            }
            this._terminalService.setActiveInstance(instance);
            instance.focus();
            await instance.sendPath(resource, false);
        }
    };
    TerminalTabsDragAndDrop = __decorate([
        __param(0, terminal_1.ITerminalService),
        __param(1, terminal_1.ITerminalGroupService)
    ], TerminalTabsDragAndDrop);
    let TabDecorationsProvider = class TabDecorationsProvider extends lifecycle_1.Disposable {
        constructor(_terminalService) {
            super();
            this._terminalService = _terminalService;
            this.label = (0, nls_1.localize)('label', "Terminal");
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(this._terminalService.onAnyInstancePrimaryStatusChange(e => this._onDidChange.fire([e.resource])));
        }
        provideDecorations(resource) {
            if (resource.scheme !== network_1.Schemas.vscodeTerminal) {
                return undefined;
            }
            const instance = this._terminalService.getInstanceFromResource(resource);
            if (!instance) {
                return undefined;
            }
            const primaryStatus = instance?.statusList?.primary;
            if (!primaryStatus?.icon) {
                return undefined;
            }
            return {
                color: (0, terminalStatusList_1.getColorForSeverity)(primaryStatus.severity),
                letter: primaryStatus.icon,
                tooltip: primaryStatus.tooltip
            };
        }
    };
    TabDecorationsProvider = __decorate([
        __param(0, terminal_1.ITerminalService)
    ], TabDecorationsProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUYWJzTGlzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbFRhYnNMaXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtEaEcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVoQixJQUFrQixxQkFRakI7SUFSRCxXQUFrQixxQkFBcUI7UUFDdEMsNEVBQWMsQ0FBQTtRQUNkLHdGQUFvQixDQUFBO1FBQ3BCLGtHQUF5QixDQUFBO1FBQ3pCLG1GQUFrQixDQUFBO1FBQ2xCLDRGQUE0RyxDQUFBO1FBQzVHLHFHQUEyQixDQUFBO1FBQzNCLG1GQUFrQixDQUFBO0lBQ25CLENBQUMsRUFSaUIscUJBQXFCLHFDQUFyQixxQkFBcUIsUUFRdEM7SUFFTSxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLDJCQUFnQztRQUtwRSxZQUNDLFNBQXNCLEVBQ0YsaUJBQXFDLEVBQzNDLFdBQXlCLEVBQ3hCLFlBQTJCLEVBQ0YscUJBQTRDLEVBQ2pELGdCQUFrQyxFQUM3QixxQkFBNEMsRUFDN0Qsb0JBQTJDLEVBQzdDLGtCQUF1QyxFQUM1QixhQUE0QixFQUN6QyxnQkFBbUMsRUFDdEIsYUFBNEI7WUFFNUQsS0FBSyxDQUFDLGtCQUFrQixFQUFFLFNBQVMsRUFDbEM7Z0JBQ0MsU0FBUyxFQUFFLEdBQUcsRUFBRSx5Q0FBZ0M7Z0JBQ2hELGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxlQUFlO2FBQ3BDLEVBQ0QsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx1QkFBYyxFQUFFLGlDQUF3QixDQUFDLEVBQUUs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