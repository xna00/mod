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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/browser/dom", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/telemetry/common/telemetry", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/preferences/browser/keybindingsEditorModel", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/preferences/browser/keybindingWidgets", "vs/workbench/contrib/preferences/common/preferences", "vs/platform/contextview/browser/contextView", "vs/workbench/services/keybinding/common/keybindingEditing", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/editorExtensions", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/base/common/event", "vs/platform/actions/common/actions", "vs/workbench/common/theme", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/theme/browser/defaultStyles", "vs/workbench/contrib/extensions/common/extensions", "vs/base/browser/keyboardEvent", "vs/base/common/types", "vs/workbench/contrib/codeEditor/browser/suggestEnabledInput/suggestEnabledInput", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry", "vs/platform/configuration/common/configuration", "vs/workbench/browser/actions/widgetNavigationCommands", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./media/keybindingsEditor"], function (require, exports, nls_1, async_1, DOM, platform_1, lifecycle_1, toggle_1, highlightedLabel_1, keybindingLabel_1, actions_1, actionbar_1, editorPane_1, telemetry_1, clipboardService_1, keybindingsEditorModel_1, instantiation_1, keybinding_1, keybindingWidgets_1, preferences_1, contextView_1, keybindingEditing_1, themeService_1, themables_1, contextkey_1, colorRegistry_1, editorService_1, editorExtensions_1, listService_1, notification_1, storage_1, event_1, actions_2, theme_1, preferencesIcons_1, toolbar_1, defaultStyles_1, extensions_1, keyboardEvent_1, types_1, suggestEnabledInput_1, settingsEditorColorRegistry_1, configuration_1, widgetNavigationCommands_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    var KeybindingsEditor_1, ActionsColumnRenderer_1, SourceColumnRenderer_1, WhenColumnRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsEditor = void 0;
    const $ = DOM.$;
    let KeybindingsEditor = class KeybindingsEditor extends editorPane_1.EditorPane {
        static { KeybindingsEditor_1 = this; }
        static { this.ID = 'workbench.editor.keybindings'; }
        constructor(group, telemetryService, themeService, keybindingsService, contextMenuService, keybindingEditingService, contextKeyService, notificationService, clipboardService, instantiationService, editorService, storageService, configurationService) {
            super(KeybindingsEditor_1.ID, group, telemetryService, themeService, storageService);
            this.keybindingsService = keybindingsService;
            this.contextMenuService = contextMenuService;
            this.keybindingEditingService = keybindingEditingService;
            this.contextKeyService = contextKeyService;
            this.notificationService = notificationService;
            this.clipboardService = clipboardService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this._onDefineWhenExpression = this._register(new event_1.Emitter());
            this.onDefineWhenExpression = this._onDefineWhenExpression.event;
            this._onRejectWhenExpression = this._register(new event_1.Emitter());
            this.onRejectWhenExpression = this._onRejectWhenExpression.event;
            this._onAcceptWhenExpression = this._register(new event_1.Emitter());
            this.onAcceptWhenExpression = this._onAcceptWhenExpression.event;
            this._onLayout = this._register(new event_1.Emitter());
            this.onLayout = this._onLayout.event;
            this.keybindingsEditorModel = null;
            this.unAssignedKeybindingItemToRevealAndFocus = null;
            this.tableEntries = [];
            this.dimension = null;
            this.latestEmptyFilters = [];
            this.delayedFiltering = new async_1.Delayer(300);
            this._register(keybindingsService.onDidUpdateKeybindings(() => this.render(!!this.keybindingFocusContextKey.get())));
            this.keybindingsEditorContextKey = preferences_1.CONTEXT_KEYBINDINGS_EDITOR.bindTo(this.contextKeyService);
            this.searchFocusContextKey = preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS.bindTo(this.contextKeyService);
            this.keybindingFocusContextKey = preferences_1.CONTEXT_KEYBINDING_FOCUS.bindTo(this.contextKeyService);
            this.searchHistoryDelayer = new async_1.Delayer(500);
            this.recordKeysAction = new actions_1.Action(preferences_1.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS, (0, nls_1.localize)('recordKeysLabel', "Record Keys"), themables_1.ThemeIcon.asClassName(preferencesIcons_1.keybindingsRecordKeysIcon));
            this.recordKeysAction.checked = false;
            this.sortByPrecedenceAction = new actions_1.Action(preferences_1.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE, (0, nls_1.localize)('sortByPrecedeneLabel', "Sort by Precedence (Highest first)"), themables_1.ThemeIcon.asClassName(preferencesIcons_1.keybindingsSortIcon));
            this.sortByPrecedenceAction.checked = false;
            this.overflowWidgetsDomNode = $('.keybindings-overflow-widgets-container.monaco-editor');
        }
        create(parent) {
            super.create(parent);
            this._register((0, widgetNavigationCommands_1.registerNavigableContainer)({
                focusNotifiers: [this],
                focusNextWidget: () => {
                    if (this.searchWidget.hasFocus()) {
                        this.focusKeybindings();
                    }
                },
                focusPreviousWidget: () => {
                    if (!this.searchWidget.hasFocus()) {
                        this.focusSearch();
                    }
                }
            }));
        }
        createEditor(parent) {
            const keybindingsEditorElement = DOM.append(parent, $('div', { class: 'keybindings-editor' }));
            this.createAriaLabelElement(keybindingsEditorElement);
            this.createOverlayContainer(keybindingsEditorElement);
            this.createHeader(keybindingsEditorElement);
            this.createBody(keybindingsEditorElement);
        }
        setInput(input, options, context, token) {
            this.keybindingsEditorContextKey.set(true);
            return super.setInput(input, options, context, token)
                .then(() => this.render(!!(options && options.preserveFocus)));
        }
        clearInput() {
            super.clearInput();
            this.keybindingsEditorContextKey.reset();
            this.keybindingFocusContextKey.reset();
        }
        layout(dimension) {
            this.dimension = dimension;
            this.layoutSearchWidget(dimension);
            this.overlayContainer.style.width = dimension.width + 'px';
            this.overlayContainer.style.height = dimension.height + 'px';
            this.defineKeybindingWidget.layout(this.dimension);
            this.layoutKeybindingsTable();
            this._onLayout.fire();
        }
        focus() {
            super.focus();
            const activeKeybindingEntry = this.activeKeybindingEntry;
            if (activeKeybindingEntry) {
                this.selectEntry(activeKeybindingEntry);
            }
            else if (!platform_1.isIOS) {
                this.searchWidget.focus();
            }
        }
        get activeKeybindingEntry() {
            const focusedElement = this.keybindingsTable.getFocusedElements()[0];
            return focusedElement && focusedElement.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID ? focusedElement : null;
        }
        async defineKeybinding(keybindingEntry, add) {
            this.selectEntry(keybindingEntry);
            this.showOverlayContainer();
            try {
                const key = await this.defineKeybindingWidget.define();
                if (key) {
                    await this.updateKeybinding(keybindingEntry, key, keybindingEntry.keybindingItem.when, add);
                }
            }
            catch (error) {
                this.onKeybindingEditingError(error);
            }
            finally {
                this.hideOverlayContainer();
                this.selectEntry(keybindingEntry);
            }
        }
        defineWhenExpression(keybindingEntry) {
            if (keybindingEntry.keybindingItem.keybinding) {
                this.selectEntry(keybindingEntry);
                this._onDefineWhenExpression.fire(keybindingEntry);
            }
        }
        rejectWhenExpression(keybindingEntry) {
            this._onRejectWhenExpression.fire(keybindingEntry);
        }
        acceptWhenExpression(keybindingEntry) {
            this._onAcceptWhenExpression.fire(keybindingEntry);
        }
        async updateKeybinding(keybindingEntry, key, when, add) {
            const currentKey = keybindingEntry.keybindingItem.keybinding ? keybindingEntry.keybindingItem.keybinding.getUserSettingsLabel() : '';
            if (currentKey !== key || keybindingEntry.keybindingItem.when !== when) {
                if (add) {
                    await this.keybindingEditingService.addKeybinding(keybindingEntry.keybindingItem.keybindingItem, key, when || undefined);
                }
                else {
                    await this.keybindingEditingService.editKeybinding(keybindingEntry.keybindingItem.keybindingItem, key, when || undefined);
                }
                if (!keybindingEntry.keybindingItem.keybinding) { // reveal only if keybinding was added to unassinged. Because the entry will be placed in different position after rendering
                    this.unAssignedKeybindingItemToRevealAndFocus = keybindingEntry;
                }
            }
        }
        async removeKeybinding(keybindingEntry) {
            this.selectEntry(keybindingEntry);
            if (keybindingEntry.keybindingItem.keybinding) { // This should be a pre-condition
                try {
                    await this.keybindingEditingService.removeKeybinding(keybindingEntry.keybindingItem.keybindingItem);
                    this.focus();
                }
                catch (error) {
                    this.onKeybindingEditingError(error);
                    this.selectEntry(keybindingEntry);
                }
            }
        }
        async resetKeybinding(keybindingEntry) {
            this.selectEntry(keybindingEntry);
            try {
                await this.keybindingEditingService.resetKeybinding(keybindingEntry.keybindingItem.keybindingItem);
                if (!keybindingEntry.keybindingItem.keybinding) { // reveal only if keybinding was added to unassinged. Because the entry will be placed in different position after rendering
                    this.unAssignedKeybindingItemToRevealAndFocus = keybindingEntry;
                }
                this.selectEntry(keybindingEntry);
            }
            catch (error) {
                this.onKeybindingEditingError(error);
                this.selectEntry(keybindingEntry);
            }
        }
        async copyKeybinding(keybinding) {
            this.selectEntry(keybinding);
            const userFriendlyKeybinding = {
                key: keybinding.keybindingItem.keybinding ? keybinding.keybindingItem.keybinding.getUserSettingsLabel() || '' : '',
                command: keybinding.keybindingItem.command
            };
            if (keybinding.keybindingItem.when) {
                userFriendlyKeybinding.when = keybinding.keybindingItem.when;
            }
            await this.clipboardService.writeText(JSON.stringify(userFriendlyKeybinding, null, '  '));
        }
        async copyKeybindingCommand(keybinding) {
            this.selectEntry(keybinding);
            await this.clipboardService.writeText(keybinding.keybindingItem.command);
        }
        async copyKeybindingCommandTitle(keybinding) {
            this.selectEntry(keybinding);
            await this.clipboardService.writeText(keybinding.keybindingItem.commandLabel);
        }
        focusSearch() {
            this.searchWidget.focus();
        }
        search(filter) {
            this.focusSearch();
            this.searchWidget.setValue(filter);
            this.selectEntry(0);
        }
        clearSearchResults() {
            this.searchWidget.clear();
        }
        showSimilarKeybindings(keybindingEntry) {
            const value = `"${keybindingEntry.keybindingItem.keybinding.getAriaLabel()}"`;
            if (value !== this.searchWidget.getValue()) {
                this.searchWidget.setValue(value);
            }
        }
        createAriaLabelElement(parent) {
            this.ariaLabelElement = DOM.append(parent, DOM.$(''));
            this.ariaLabelElement.setAttribute('id', 'keybindings-editor-aria-label-element');
            this.ariaLabelElement.setAttribute('aria-live', 'assertive');
        }
        createOverlayContainer(parent) {
            this.overlayContainer = DOM.append(parent, $('.overlay-container'));
            this.overlayContainer.style.position = 'absolute';
            this.overlayContainer.style.zIndex = '40'; // has to greater than sash z-index which is 35
            this.defineKeybindingWidget = this._register(this.instantiationService.createInstance(keybindingWidgets_1.DefineKeybindingWidget, this.overlayContainer));
            this._register(this.defineKeybindingWidget.onDidChange(keybindingStr => this.defineKeybindingWidget.printExisting(this.keybindingsEditorModel.fetch(`"${keybindingStr}"`).length)));
            this._register(this.defineKeybindingWidget.onShowExistingKeybidings(keybindingStr => this.searchWidget.setValue(`"${keybindingStr}"`)));
            this.hideOverlayContainer();
        }
        showOverlayContainer() {
            this.overlayContainer.style.display = 'block';
        }
        hideOverlayContainer() {
            this.overlayContainer.style.display = 'none';
        }
        createHeader(parent) {
            this.headerContainer = DOM.append(parent, $('.keybindings-header'));
            const fullTextSearchPlaceholder = (0, nls_1.localize)('SearchKeybindings.FullTextSearchPlaceholder', "Type to search in keybindings");
            const keybindingsSearchPlaceholder = (0, nls_1.localize)('SearchKeybindings.KeybindingsSearchPlaceholder', "Recording Keys. Press Escape to exit");
            const clearInputAction = new actions_1.Action(preferences_1.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS, (0, nls_1.localize)('clearInput', "Clear Keybindings Search Input"), themables_1.ThemeIcon.asClassName(preferencesIcons_1.preferencesClearInputIcon), false, async () => this.clearSearchResults());
            const searchContainer = DOM.append(this.headerContainer, $('.search-container'));
            this.searchWidget = this._register(this.instantiationService.createInstance(keybindingWidgets_1.KeybindingsSearchWidget, searchContainer, {
                ariaLabel: fullTextSearchPlaceholder,
                placeholder: fullTextSearchPlaceholder,
                focusKey: this.searchFocusContextKey,
                ariaLabelledBy: 'keybindings-editor-aria-label-element',
                recordEnter: true,
                quoteRecordedKeys: true,
                history: this.getMemento(0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */)['searchHistory'] || [],
                inputBoxStyles: (0, defaultStyles_1.getInputBoxStyle)({
                    inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
                })
            }));
            this._register(this.searchWidget.onDidChange(searchValue => {
                clearInputAction.enabled = !!searchValue;
                this.delayedFiltering.trigger(() => this.filterKeybindings());
                this.updateSearchOptions();
            }));
            this._register(this.searchWidget.onEscape(() => this.recordKeysAction.checked = false));
            this.actionsContainer = DOM.append(searchContainer, DOM.$('.keybindings-search-actions-container'));
            const recordingBadge = this.createRecordingBadge(this.actionsContainer);
            this._register(this.sortByPrecedenceAction.onDidChange(e => {
                if (e.checked !== undefined) {
                    this.renderKeybindingsEntries(false);
                }
                this.updateSearchOptions();
            }));
            this._register(this.recordKeysAction.onDidChange(e => {
                if (e.checked !== undefined) {
                    recordingBadge.classList.toggle('disabled', !e.checked);
                    if (e.checked) {
                        this.searchWidget.inputBox.setPlaceHolder(keybindingsSearchPlaceholder);
                        this.searchWidget.inputBox.setAriaLabel(keybindingsSearchPlaceholder);
                        this.searchWidget.startRecordingKeys();
                        this.searchWidget.focus();
                    }
                    else {
                        this.searchWidget.inputBox.setPlaceHolder(fullTextSearchPlaceholder);
                        this.searchWidget.inputBox.setAriaLabel(fullTextSearchPlaceholder);
                        this.searchWidget.stopRecordingKeys();
                        this.searchWidget.focus();
                    }
                    this.updateSearchOptions();
                }
            }));
            const actions = [this.recordKeysAction, this.sortByPrecedenceAction, clearInputAction];
            const toolBar = this._register(new toolbar_1.ToolBar(this.actionsContainer, this.contextMenuService, {
                actionViewItemProvider: (action, options) => {
                    if (action.id === this.sortByPrecedenceAction.id || action.id === this.recordKeysAction.id) {
                        return new toggle_1.ToggleActionViewItem(null, action, { ...options, keybinding: this.keybindingsService.lookupKeybinding(action.id)?.getLabel(), toggleStyles: defaultStyles_1.defaultToggleStyles });
                    }
                    return undefined;
                },
                getKeyBinding: action => this.keybindingsService.lookupKeybinding(action.id)
            }));
            toolBar.setActions(actions);
            this._register(this.keybindingsService.onDidUpdateKeybindings(() => toolBar.setActions(actions)));
        }
        updateSearchOptions() {
            const keybindingsEditorInput = this.input;
            if (keybindingsEditorInput) {
                keybindingsEditorInput.searchOptions = {
                    searchValue: this.searchWidget.getValue(),
                    recordKeybindings: !!this.recordKeysAction.checked,
                    sortByPrecedence: !!this.sortByPrecedenceAction.checked
                };
            }
        }
        createRecordingBadge(container) {
            const recordingBadge = DOM.append(container, DOM.$('.recording-badge.monaco-count-badge.long.disabled'));
            recordingBadge.textContent = (0, nls_1.localize)('recording', "Recording Keys");
            recordingBadge.style.backgroundColor = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.badgeBackground);
            recordingBadge.style.color = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.badgeForeground);
            recordingBadge.style.border = `1px solid ${(0, colorRegistry_1.asCssVariable)(colorRegistry_1.contrastBorder)}`;
            return recordingBadge;
        }
        layoutSearchWidget(dimension) {
            this.searchWidget.layout(dimension);
            this.headerContainer.classList.toggle('small', dimension.width < 400);
            this.searchWidget.inputBox.inputElement.style.paddingRight = `${DOM.getTotalWidth(this.actionsContainer) + 12}px`;
        }
        createBody(parent) {
            const bodyContainer = DOM.append(parent, $('.keybindings-body'));
            this.createTable(bodyContainer);
        }
        createTable(parent) {
            this.keybindingsTableContainer = DOM.append(parent, $('.keybindings-table-container'));
            this.keybindingsTable = this._register(this.instantiationService.createInstance(listService_1.WorkbenchTable, 'KeybindingsEditor', this.keybindingsTableContainer, new Delegate(), [
                {
                    label: '',
                    tooltip: '',
                    weight: 0,
                    minimumWidth: 40,
                    maximumWidth: 40,
                    templateId: ActionsColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('command', "Command"),
                    tooltip: '',
                    weight: 0.3,
                    templateId: CommandColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('keybinding', "Keybinding"),
                    tooltip: '',
                    weight: 0.2,
                    templateId: KeybindingColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('when', "When"),
                    tooltip: '',
                    weight: 0.35,
                    templateId: WhenColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('source', "Source"),
                    tooltip: '',
                    weight: 0.15,
                    templateId: SourceColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
            ], [
                this.instantiationService.createInstance(ActionsColumnRenderer, this),
                this.instantiationService.createInstance(CommandColumnRenderer),
                this.instantiationService.createInstance(KeybindingColumnRenderer),
                this.instantiationService.createInstance(WhenColumnRenderer, this),
                this.instantiationService.createInstance(SourceColumnRenderer),
            ], {
                identityProvider: { getId: (e) => e.id },
                horizontalScrolling: false,
                accessibilityProvider: new AccessibilityProvider(this.configurationService),
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e.keybindingItem.commandLabel || e.keybindingItem.command },
                overrideStyles: {
                    listBackground: colorRegistry_1.editorBackground
                },
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                openOnSingleClick: false,
                transformOptimization: false // disable transform optimization as it causes the editor overflow widgets to be mispositioned
            }));
            this._register(this.keybindingsTable.onContextMenu(e => this.onContextMenu(e)));
            this._register(this.keybindingsTable.onDidChangeFocus(e => this.onFocusChange()));
            this._register(this.keybindingsTable.onDidFocus(() => {
                this.keybindingsTable.getHTMLElement().classList.add('focused');
                this.onFocusChange();
            }));
            this._register(this.keybindingsTable.onDidBlur(() => {
                this.keybindingsTable.getHTMLElement().classList.remove('focused');
                this.keybindingFocusContextKey.reset();
            }));
            this._register(this.keybindingsTable.onDidOpen((e) => {
                // stop double click action on the input #148493
                if (e.browserEvent?.defaultPrevented) {
                    return;
                }
                const activeKeybindingEntry = this.activeKeybindingEntry;
                if (activeKeybindingEntry) {
                    this.defineKeybinding(activeKeybindingEntry, false);
                }
            }));
            DOM.append(this.keybindingsTableContainer, this.overflowWidgetsDomNode);
        }
        async render(preserveFocus) {
            if (this.input) {
                const input = this.input;
                this.keybindingsEditorModel = await input.resolve();
                await this.keybindingsEditorModel.resolve(this.getActionsLabels());
                this.renderKeybindingsEntries(false, preserveFocus);
                if (input.searchOptions) {
                    this.recordKeysAction.checked = input.searchOptions.recordKeybindings;
                    this.sortByPrecedenceAction.checked = input.searchOptions.sortByPrecedence;
                    this.searchWidget.setValue(input.searchOptions.searchValue);
                }
                else {
                    this.updateSearchOptions();
                }
            }
        }
        getActionsLabels() {
            const actionsLabels = new Map();
            for (const editorAction of editorExtensions_1.EditorExtensionsRegistry.getEditorActions()) {
                actionsLabels.set(editorAction.id, editorAction.label);
            }
            for (const menuItem of actions_2.MenuRegistry.getMenuItems(actions_2.MenuId.CommandPalette)) {
                if ((0, actions_2.isIMenuItem)(menuItem)) {
                    const title = typeof menuItem.command.title === 'string' ? menuItem.command.title : menuItem.command.title.value;
                    const category = menuItem.command.category ? typeof menuItem.command.category === 'string' ? menuItem.command.category : menuItem.command.category.value : undefined;
                    actionsLabels.set(menuItem.command.id, category ? `${category}: ${title}` : title);
                }
            }
            return actionsLabels;
        }
        filterKeybindings() {
            this.renderKeybindingsEntries(this.searchWidget.hasFocus());
            this.searchHistoryDelayer.trigger(() => {
                this.searchWidget.inputBox.addToHistory();
                this.getMemento(0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */)['searchHistory'] = this.searchWidget.inputBox.getHistory();
                this.saveState();
            });
        }
        clearKeyboardShortcutSearchHistory() {
            this.searchWidget.inputBox.clearHistory();
            this.getMemento(0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */)['searchHistory'] = this.searchWidget.inputBox.getHistory();
            this.saveState();
        }
        renderKeybindingsEntries(reset, preserveFocus) {
            if (this.keybindingsEditorModel) {
                const filter = this.searchWidget.getValue();
                const keybindingsEntries = this.keybindingsEditorModel.fetch(filter, this.sortByPrecedenceAction.checked);
                this.ariaLabelElement.setAttribute('aria-label', this.getAriaLabel(keybindingsEntries));
                if (keybindingsEntries.length === 0) {
                    this.latestEmptyFilters.push(filter);
                }
                const currentSelectedIndex = this.keybindingsTable.getSelection()[0];
                this.tableEntries = keybindingsEntries;
                this.keybindingsTable.splice(0, this.keybindingsTable.length, this.tableEntries);
                this.layoutKeybindingsTable();
                if (reset) {
                    this.keybindingsTable.setSelection([]);
                    this.keybindingsTable.setFocus([]);
                }
                else {
                    if (this.unAssignedKeybindingItemToRevealAndFocus) {
                        const index = this.getNewIndexOfUnassignedKeybinding(this.unAssignedKeybindingItemToRevealAndFocus);
                        if (index !== -1) {
                            this.keybindingsTable.reveal(index, 0.2);
                            this.selectEntry(index);
                        }
                        this.unAssignedKeybindingItemToRevealAndFocus = null;
                    }
                    else if (currentSelectedIndex !== -1 && currentSelectedIndex < this.tableEntries.length) {
                        this.selectEntry(currentSelectedIndex, preserveFocus);
                    }
                    else if (this.editorService.activeEditorPane === this && !preserveFocus) {
                        this.focus();
                    }
                }
            }
        }
        getAriaLabel(keybindingsEntries) {
            if (this.sortByPrecedenceAction.checked) {
                return (0, nls_1.localize)('show sorted keybindings', "Showing {0} Keybindings in precedence order", keybindingsEntries.length);
            }
            else {
                return (0, nls_1.localize)('show keybindings', "Showing {0} Keybindings in alphabetical order", keybindingsEntries.length);
            }
        }
        layoutKeybindingsTable() {
            if (!this.dimension) {
                return;
            }
            const tableHeight = this.dimension.height - (DOM.getDomNodePagePosition(this.headerContainer).height + 12 /*padding*/);
            this.keybindingsTableContainer.style.height = `${tableHeight}px`;
            this.keybindingsTable.layout(tableHeight);
        }
        getIndexOf(listEntry) {
            const index = this.tableEntries.indexOf(listEntry);
            if (index === -1) {
                for (let i = 0; i < this.tableEntries.length; i++) {
                    if (this.tableEntries[i].id === listEntry.id) {
                        return i;
                    }
                }
            }
            return index;
        }
        getNewIndexOfUnassignedKeybinding(unassignedKeybinding) {
            for (let index = 0; index < this.tableEntries.length; index++) {
                const entry = this.tableEntries[index];
                if (entry.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                    const keybindingItemEntry = entry;
                    if (keybindingItemEntry.keybindingItem.command === unassignedKeybinding.keybindingItem.command) {
                        return index;
                    }
                }
            }
            return -1;
        }
        selectEntry(keybindingItemEntry, focus = true) {
            const index = typeof keybindingItemEntry === 'number' ? keybindingItemEntry : this.getIndexOf(keybindingItemEntry);
            if (index !== -1 && index < this.keybindingsTable.length) {
                if (focus) {
                    this.keybindingsTable.domFocus();
                    this.keybindingsTable.setFocus([index]);
                }
                this.keybindingsTable.setSelection([index]);
            }
        }
        focusKeybindings() {
            this.keybindingsTable.domFocus();
            const currentFocusIndices = this.keybindingsTable.getFocus();
            this.keybindingsTable.setFocus([currentFocusIndices.length ? currentFocusIndices[0] : 0]);
        }
        selectKeybinding(keybindingItemEntry) {
            this.selectEntry(keybindingItemEntry);
        }
        recordSearchKeys() {
            this.recordKeysAction.checked = true;
        }
        toggleSortByPrecedence() {
            this.sortByPrecedenceAction.checked = !this.sortByPrecedenceAction.checked;
        }
        onContextMenu(e) {
            if (!e.element) {
                return;
            }
            if (e.element.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                const keybindingItemEntry = e.element;
                this.selectEntry(keybindingItemEntry);
                this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => [
                        this.createCopyAction(keybindingItemEntry),
                        this.createCopyCommandAction(keybindingItemEntry),
                        this.createCopyCommandTitleAction(keybindingItemEntry),
                        new actions_1.Separator(),
                        ...(keybindingItemEntry.keybindingItem.keybinding
                            ? [this.createDefineKeybindingAction(keybindingItemEntry), this.createAddKeybindingAction(keybindingItemEntry)]
                            : [this.createDefineKeybindingAction(keybindingItemEntry)]),
                        new actions_1.Separator(),
                        this.createRemoveAction(keybindingItemEntry),
                        this.createResetAction(keybindingItemEntry),
                        new actions_1.Separator(),
                        this.createDefineWhenExpressionAction(keybindingItemEntry),
                        new actions_1.Separator(),
                        this.createShowConflictsAction(keybindingItemEntry)
                    ]
                });
            }
        }
        onFocusChange() {
            this.keybindingFocusContextKey.reset();
            const element = this.keybindingsTable.getFocusedElements()[0];
            if (!element) {
                return;
            }
            if (element.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                this.keybindingFocusContextKey.set(true);
            }
        }
        createDefineKeybindingAction(keybindingItemEntry) {
            return {
                label: keybindingItemEntry.keybindingItem.keybinding ? (0, nls_1.localize)('changeLabel', "Change Keybinding...") : (0, nls_1.localize)('addLabel', "Add Keybinding..."),
                enabled: true,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE,
                run: () => this.defineKeybinding(keybindingItemEntry, false)
            };
        }
        createAddKeybindingAction(keybindingItemEntry) {
            return {
                label: (0, nls_1.localize)('addLabel', "Add Keybinding..."),
                enabled: true,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_ADD,
                run: () => this.defineKeybinding(keybindingItemEntry, true)
            };
        }
        createDefineWhenExpressionAction(keybindingItemEntry) {
            return {
                label: (0, nls_1.localize)('editWhen', "Change When Expression"),
                enabled: !!keybindingItemEntry.keybindingItem.keybinding,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN,
                run: () => this.defineWhenExpression(keybindingItemEntry)
            };
        }
        createRemoveAction(keybindingItem) {
            return {
                label: (0, nls_1.localize)('removeLabel', "Remove Keybinding"),
                enabled: !!keybindingItem.keybindingItem.keybinding,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_REMOVE,
                run: () => this.removeKeybinding(keybindingItem)
            };
        }
        createResetAction(keybindingItem) {
            return {
                label: (0, nls_1.localize)('resetLabel', "Reset Keybinding"),
                enabled: !keybindingItem.keybindingItem.keybindingItem.isDefault,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_RESET,
                run: () => this.resetKeybinding(keybindingItem)
            };
        }
        createShowConflictsAction(keybindingItem) {
            return {
                label: (0, nls_1.localize)('showSameKeybindings', "Show Same Keybindings"),
                enabled: !!keybindingItem.keybindingItem.keybinding,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR,
                run: () => this.showSimilarKeybindings(keybindingItem)
            };
        }
        createCopyAction(keybindingItem) {
            return {
                label: (0, nls_1.localize)('copyLabel', "Copy"),
                enabled: true,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY,
                run: () => this.copyKeybinding(keybindingItem)
            };
        }
        createCopyCommandAction(keybinding) {
            return {
                label: (0, nls_1.localize)('copyCommandLabel', "Copy Command ID"),
                enabled: true,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND,
                run: () => this.copyKeybindingCommand(keybinding)
            };
        }
        createCopyCommandTitleAction(keybinding) {
            return {
                label: (0, nls_1.localize)('copyCommandTitleLabel', "Copy Command Title"),
                enabled: !!keybinding.keybindingItem.commandLabel,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND_TITLE,
                run: () => this.copyKeybindingCommandTitle(keybinding)
            };
        }
        onKeybindingEditingError(error) {
            this.notificationService.error(typeof error === 'string' ? error : (0, nls_1.localize)('error', "Error '{0}' while editing the keybinding. Please open 'keybindings.json' file and check for errors.", `${error}`));
        }
    };
    exports.KeybindingsEditor = KeybindingsEditor;
    exports.KeybindingsEditor = KeybindingsEditor = KeybindingsEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, keybindingEditing_1.IKeybindingEditingService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, notification_1.INotificationService),
        __param(8, clipboardService_1.IClipboardService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, editorService_1.IEditorService),
        __param(11, storage_1.IStorageService),
        __param(12, configuration_1.IConfigurationService)
    ], KeybindingsEditor);
    class Delegate {
        constructor() {
            this.headerRowHeight = 30;
        }
        getHeight(element) {
            if (element.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                const commandIdMatched = element.keybindingItem.commandLabel && element.commandIdMatches;
                const commandDefaultLabelMatched = !!element.commandDefaultLabelMatches;
                const extensionIdMatched = !!element.extensionIdMatches;
                if (commandIdMatched && commandDefaultLabelMatched) {
                    return 60;
                }
                if (extensionIdMatched || commandIdMatched || commandDefaultLabelMatched) {
                    return 40;
                }
            }
            return 24;
        }
    }
    let ActionsColumnRenderer = class ActionsColumnRenderer {
        static { ActionsColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'actions'; }
        constructor(keybindingsEditor, keybindingsService) {
            this.keybindingsEditor = keybindingsEditor;
            this.keybindingsService = keybindingsService;
            this.templateId = ActionsColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const element = DOM.append(container, $('.actions'));
            const actionBar = new actionbar_1.ActionBar(element);
            return { actionBar };
        }
        renderElement(keybindingItemEntry, index, templateData, height) {
            templateData.actionBar.clear();
            const actions = [];
            if (keybindingItemEntry.keybindingItem.keybinding) {
                actions.push(this.createEditAction(keybindingItemEntry));
            }
            else {
                actions.push(this.createAddAction(keybindingItemEntry));
            }
            templateData.actionBar.push(actions, { icon: true });
        }
        createEditAction(keybindingItemEntry) {
            const keybinding = this.keybindingsService.lookupKeybinding(preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE);
            return {
                class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.keybindingsEditIcon),
                enabled: true,
                id: 'editKeybinding',
                tooltip: keybinding ? (0, nls_1.localize)('editKeybindingLabelWithKey', "Change Keybinding {0}", `(${keybinding.getLabel()})`) : (0, nls_1.localize)('editKeybindingLabel', "Change Keybinding"),
                run: () => this.keybindingsEditor.defineKeybinding(keybindingItemEntry, false)
            };
        }
        createAddAction(keybindingItemEntry) {
            const keybinding = this.keybindingsService.lookupKeybinding(preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE);
            return {
                class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.keybindingsAddIcon),
                enabled: true,
                id: 'addKeybinding',
                tooltip: keybinding ? (0, nls_1.localize)('addKeybindingLabelWithKey', "Add Keybinding {0}", `(${keybinding.getLabel()})`) : (0, nls_1.localize)('addKeybindingLabel', "Add Keybinding"),
                run: () => this.keybindingsEditor.defineKeybinding(keybindingItemEntry, false)
            };
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    };
    ActionsColumnRenderer = ActionsColumnRenderer_1 = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], ActionsColumnRenderer);
    class CommandColumnRenderer {
        constructor() {
            this.templateId = CommandColumnRenderer.TEMPLATE_ID;
        }
        static { this.TEMPLATE_ID = 'commands'; }
        renderTemplate(container) {
            const commandColumn = DOM.append(container, $('.command'));
            const commandColumnHover = (0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), commandColumn, '');
            const commandLabelContainer = DOM.append(commandColumn, $('.command-label'));
            const commandLabel = new highlightedLabel_1.HighlightedLabel(commandLabelContainer);
            const commandDefaultLabelContainer = DOM.append(commandColumn, $('.command-default-label'));
            const commandDefaultLabel = new highlightedLabel_1.HighlightedLabel(commandDefaultLabelContainer);
            const commandIdLabelContainer = DOM.append(commandColumn, $('.command-id.code'));
            const commandIdLabel = new highlightedLabel_1.HighlightedLabel(commandIdLabelContainer);
            return { commandColumn, commandColumnHover, commandLabelContainer, commandLabel, commandDefaultLabelContainer, commandDefaultLabel, commandIdLabelContainer, commandIdLabel };
        }
        renderElement(keybindingItemEntry, index, templateData, height) {
            const keybindingItem = keybindingItemEntry.keybindingItem;
            const commandIdMatched = !!(keybindingItem.commandLabel && keybindingItemEntry.commandIdMatches);
            const commandDefaultLabelMatched = !!keybindingItemEntry.commandDefaultLabelMatches;
            templateData.commandColumn.classList.toggle('vertical-align-column', commandIdMatched || commandDefaultLabelMatched);
            const title = keybindingItem.commandLabel ? (0, nls_1.localize)('title', "{0} ({1})", keybindingItem.commandLabel, keybindingItem.command) : keybindingItem.command;
            templateData.commandColumn.setAttribute('aria-label', title);
            templateData.commandColumnHover.update(title);
            if (keybindingItem.commandLabel) {
                templateData.commandLabelContainer.classList.remove('hide');
                templateData.commandLabel.set(keybindingItem.commandLabel, keybindingItemEntry.commandLabelMatches);
            }
            else {
                templateData.commandLabelContainer.classList.add('hide');
                templateData.commandLabel.set(undefined);
            }
            if (keybindingItemEntry.commandDefaultLabelMatches) {
                templateData.commandDefaultLabelContainer.classList.remove('hide');
                templateData.commandDefaultLabel.set(keybindingItem.commandDefaultLabel, keybindingItemEntry.commandDefaultLabelMatches);
            }
            else {
                templateData.commandDefaultLabelContainer.classList.add('hide');
                templateData.commandDefaultLabel.set(undefined);
            }
            if (keybindingItemEntry.commandIdMatches || !keybindingItem.commandLabel) {
                templateData.commandIdLabelContainer.classList.remove('hide');
                templateData.commandIdLabel.set(keybindingItem.command, keybindingItemEntry.commandIdMatches);
            }
            else {
                templateData.commandIdLabelContainer.classList.add('hide');
                templateData.commandIdLabel.set(undefined);
            }
        }
        disposeTemplate(templateData) {
            templateData.commandColumnHover.dispose();
            templateData.commandDefaultLabel.dispose();
            templateData.commandIdLabel.dispose();
            templateData.commandLabel.dispose();
        }
    }
    class KeybindingColumnRenderer {
        static { this.TEMPLATE_ID = 'keybindings'; }
        constructor() {
            this.templateId = KeybindingColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const element = DOM.append(container, $('.keybinding'));
            const keybindingLabel = new keybindingLabel_1.KeybindingLabel(DOM.append(element, $('div.keybinding-label')), platform_1.OS, defaultStyles_1.defaultKeybindingLabelStyles);
            return { keybindingLabel };
        }
        renderElement(keybindingItemEntry, index, templateData, height) {
            if (keybindingItemEntry.keybindingItem.keybinding) {
                templateData.keybindingLabel.set(keybindingItemEntry.keybindingItem.keybinding, keybindingItemEntry.keybindingMatches);
            }
            else {
                templateData.keybindingLabel.set(undefined, undefined);
            }
        }
        disposeTemplate(templateData) {
            templateData.keybindingLabel.dispose();
        }
    }
    function onClick(element, callback) {
        const disposables = new lifecycle_1.DisposableStore();
        disposables.add(DOM.addDisposableListener(element, DOM.EventType.CLICK, DOM.finalHandler(callback)));
        disposables.add(DOM.addDisposableListener(element, DOM.EventType.KEY_UP, e => {
            const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
            if (keyboardEvent.equals(10 /* KeyCode.Space */) || keyboardEvent.equals(3 /* KeyCode.Enter */)) {
                e.preventDefault();
                e.stopPropagation();
                callback();
            }
        }));
        return disposables;
    }
    let SourceColumnRenderer = class SourceColumnRenderer {
        static { SourceColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'source'; }
        constructor(extensionsWorkbenchService) {
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.templateId = SourceColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const sourceColumn = DOM.append(container, $('.source'));
            const sourceColumnHover = (0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), sourceColumn, '');
            const sourceLabel = new highlightedLabel_1.HighlightedLabel(DOM.append(sourceColumn, $('.source-label')));
            const extensionContainer = DOM.append(sourceColumn, $('.extension-container'));
            const extensionLabel = DOM.append(extensionContainer, $('a.extension-label', { tabindex: 0 }));
            const extensionId = new highlightedLabel_1.HighlightedLabel(DOM.append(extensionContainer, $('.extension-id-container.code')));
            return { sourceColumn, sourceColumnHover, sourceLabel, extensionLabel, extensionContainer, extensionId, disposables: new lifecycle_1.DisposableStore() };
        }
        renderElement(keybindingItemEntry, index, templateData, height) {
            if ((0, types_1.isString)(keybindingItemEntry.keybindingItem.source)) {
                templateData.extensionContainer.classList.add('hide');
                templateData.sourceLabel.element.classList.remove('hide');
                templateData.sourceColumnHover.update('');
                templateData.sourceLabel.set(keybindingItemEntry.keybindingItem.source || '-', keybindingItemEntry.sourceMatches);
            }
            else {
                templateData.extensionContainer.classList.remove('hide');
                templateData.sourceLabel.element.classList.add('hide');
                const extension = keybindingItemEntry.keybindingItem.source;
                const extensionLabel = extension.displayName ?? extension.identifier.value;
                templateData.sourceColumnHover.update((0, nls_1.localize)('extension label', "Extension ({0})", extensionLabel));
                templateData.extensionLabel.textContent = extensionLabel;
                templateData.disposables.add(onClick(templateData.extensionLabel, () => {
                    this.extensionsWorkbenchService.open(extension.identifier.value);
                }));
                if (keybindingItemEntry.extensionIdMatches) {
                    templateData.extensionId.element.classList.remove('hide');
                    templateData.extensionId.set(extension.identifier.value, keybindingItemEntry.extensionIdMatches);
                }
                else {
                    templateData.extensionId.element.classList.add('hide');
                    templateData.extensionId.set(undefined);
                }
            }
        }
        disposeTemplate(templateData) {
            templateData.sourceColumnHover.dispose();
            templateData.disposables.dispose();
            templateData.sourceLabel.dispose();
            templateData.extensionId.dispose();
        }
    };
    SourceColumnRenderer = SourceColumnRenderer_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], SourceColumnRenderer);
    let WhenInputWidget = class WhenInputWidget extends lifecycle_1.Disposable {
        constructor(parent, keybindingsEditor, instantiationService, contextKeyService) {
            super();
            this._onDidAccept = this._register(new event_1.Emitter());
            this.onDidAccept = this._onDidAccept.event;
            this._onDidReject = this._register(new event_1.Emitter());
            this.onDidReject = this._onDidReject.event;
            const focusContextKey = preferences_1.CONTEXT_WHEN_FOCUS.bindTo(contextKeyService);
            this.input = this._register(instantiationService.createInstance(suggestEnabledInput_1.SuggestEnabledInput, 'keyboardshortcutseditor#wheninput', parent, {
                provideResults: () => {
                    const result = [];
                    for (const contextKey of contextkey_1.RawContextKey.all()) {
                        result.push({ label: contextKey.key, documentation: contextKey.description, detail: contextKey.type, kind: 14 /* CompletionItemKind.Constant */ });
                    }
                    return result;
                },
                triggerCharacters: ['!', ' '],
                wordDefinition: /[a-zA-Z.]+/,
                alwaysShowSuggestions: true,
            }, '', `keyboardshortcutseditor#wheninput`, { focusContextKey, overflowWidgetsDomNode: keybindingsEditor.overflowWidgetsDomNode }));
            this._register((DOM.addDisposableListener(this.input.element, DOM.EventType.DBLCLICK, e => DOM.EventHelper.stop(e))));
            this._register((0, lifecycle_1.toDisposable)(() => focusContextKey.reset()));
            this._register(keybindingsEditor.onAcceptWhenExpression(() => this._onDidAccept.fire(this.input.getValue())));
            this._register(event_1.Event.any(keybindingsEditor.onRejectWhenExpression, this.input.onDidBlur)(() => this._onDidReject.fire()));
        }
        layout(dimension) {
            this.input.layout(dimension);
        }
        show(value) {
            this.input.setValue(value);
            this.input.focus(true);
        }
    };
    WhenInputWidget = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextkey_1.IContextKeyService)
    ], WhenInputWidget);
    let WhenColumnRenderer = class WhenColumnRenderer {
        static { WhenColumnRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'when'; }
        constructor(keybindingsEditor, instantiationService) {
            this.keybindingsEditor = keybindingsEditor;
            this.instantiationService = instantiationService;
            this.templateId = WhenColumnRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const element = DOM.append(container, $('.when'));
            const whenLabelContainer = DOM.append(element, $('div.when-label'));
            const whenLabel = new highlightedLabel_1.HighlightedLabel(whenLabelContainer);
            const whenInputContainer = DOM.append(element, $('div.when-input-container'));
            return {
                element,
                whenLabelContainer,
                whenLabel,
                whenInputContainer,
                disposables: new lifecycle_1.DisposableStore(),
            };
        }
        renderElement(keybindingItemEntry, index, templateData, height) {
            templateData.disposables.clear();
            const whenInputDisposables = templateData.disposables.add(new lifecycle_1.DisposableStore());
            templateData.disposables.add(this.keybindingsEditor.onDefineWhenExpression(e => {
                if (keybindingItemEntry === e) {
                    templateData.element.classList.add('input-mode');
                    const inputWidget = whenInputDisposables.add(this.instantiationService.createInstance(WhenInputWidget, templateData.whenInputContainer, this.keybindingsEditor));
                    inputWidget.layout(new DOM.Dimension(templateData.element.parentElement.clientWidth, 18));
                    inputWidget.show(keybindingItemEntry.keybindingItem.when || '');
                    const hideInputWidget = () => {
                        whenInputDisposables.clear();
                        templateData.element.classList.remove('input-mode');
                        templateData.element.parentElement.style.paddingLeft = '10px';
                        DOM.clearNode(templateData.whenInputContainer);
                    };
                    whenInputDisposables.add(inputWidget.onDidAccept(value => {
                        hideInputWidget();
                        this.keybindingsEditor.updateKeybinding(keybindingItemEntry, keybindingItemEntry.keybindingItem.keybinding ? keybindingItemEntry.keybindingItem.keybinding.getUserSettingsLabel() || '' : '', value);
                        this.keybindingsEditor.selectKeybinding(keybindingItemEntry);
                    }));
                    whenInputDisposables.add(inputWidget.onDidReject(() => {
                        hideInputWidget();
                        this.keybindingsEditor.selectKeybinding(keybindingItemEntry);
                    }));
                    templateData.element.parentElement.style.paddingLeft = '0px';
                }
            }));
            templateData.whenLabelContainer.classList.toggle('code', !!keybindingItemEntry.keybindingItem.when);
            templateData.whenLabelContainer.classList.toggle('empty', !keybindingItemEntry.keybindingItem.when);
            if (keybindingItemEntry.keybindingItem.when) {
                templateData.whenLabel.set(keybindingItemEntry.keybindingItem.when, keybindingItemEntry.whenMatches, keybindingItemEntry.keybindingItem.when);
                templateData.disposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), templateData.element, keybindingItemEntry.keybindingItem.when));
            }
            else {
                templateData.whenLabel.set('-');
            }
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
            templateData.whenLabel.dispose();
        }
    };
    WhenColumnRenderer = WhenColumnRenderer_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], WhenColumnRenderer);
    class AccessibilityProvider {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('keybindingsLabel', "Keybindings");
        }
        getAriaLabel({ keybindingItem }) {
            const ariaLabel = [
                keybindingItem.commandLabel ? keybindingItem.commandLabel : keybindingItem.command,
                keybindingItem.keybinding?.getAriaLabel() || (0, nls_1.localize)('noKeybinding', "No keybinding assigned"),
                keybindingItem.when ? keybindingItem.when : (0, nls_1.localize)('noWhen', "No when context"),
                (0, types_1.isString)(keybindingItem.source) ? keybindingItem.source : keybindingItem.source.description ?? keybindingItem.source.identifier.value,
            ];
            if (this.configurationService.getValue("accessibility.verbosity.keybindingsEditor" /* AccessibilityVerbositySettingId.KeybindingsEditor */)) {
                const kbEditorAriaLabel = (0, nls_1.localize)('keyboard shortcuts aria label', "use space or enter to change the keybinding.");
                ariaLabel.push(kbEditorAriaLabel);
            }
            return ariaLabel.join(', ');
        }
    }
    (0, colorRegistry_1.registerColor)('keybindingTable.headerBackground', { dark: colorRegistry_1.tableOddRowsBackgroundColor, light: colorRegistry_1.tableOddRowsBackgroundColor, hcDark: colorRegistry_1.tableOddRowsBackgroundColor, hcLight: colorRegistry_1.tableOddRowsBackgroundColor }, 'Background color for the keyboard shortcuts table header.');
    (0, colorRegistry_1.registerColor)('keybindingTable.rowsBackground', { light: colorRegistry_1.tableOddRowsBackgroundColor, dark: colorRegistry_1.tableOddRowsBackgroundColor, hcDark: colorRegistry_1.tableOddRowsBackgroundColor, hcLight: colorRegistry_1.tableOddRowsBackgroundColor }, 'Background color for the keyboard shortcuts table alternating rows.');
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const foregroundColor = theme.getColor(colorRegistry_1.foreground);
        if (foregroundColor) {
            const whenForegroundColor = foregroundColor.transparent(.8).makeOpaque((0, theme_1.WORKBENCH_BACKGROUND)(theme));
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-table-tr .monaco-table-td .code { color: ${whenForegroundColor}; }`);
        }
        const listActiveSelectionForegroundColor = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        const listActiveSelectionBackgroundColor = theme.getColor(colorRegistry_1.listActiveSelectionBackground);
        if (listActiveSelectionForegroundColor && listActiveSelectionBackgroundColor) {
            const whenForegroundColor = listActiveSelectionForegroundColor.transparent(.8).makeOpaque(listActiveSelectionBackgroundColor);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table.focused .monaco-list-row.selected .monaco-table-tr .monaco-table-td .code { color: ${whenForegroundColor}; }`);
        }
        const listInactiveSelectionForegroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionForeground);
        const listInactiveSelectionBackgroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionBackground);
        if (listInactiveSelectionForegroundColor && listInactiveSelectionBackgroundColor) {
            const whenForegroundColor = listInactiveSelectionForegroundColor.transparent(.8).makeOpaque(listInactiveSelectionBackgroundColor);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-list-row.selected .monaco-table-tr .monaco-table-td .code { color: ${whenForegroundColor}; }`);
        }
        const listFocusForegroundColor = theme.getColor(colorRegistry_1.listFocusForeground);
        const listFocusBackgroundColor = theme.getColor(colorRegistry_1.listFocusBackground);
        if (listFocusForegroundColor && listFocusBackgroundColor) {
            const whenForegroundColor = listFocusForegroundColor.transparent(.8).makeOpaque(listFocusBackgroundColor);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table.focused .monaco-list-row.focused .monaco-table-tr .monaco-table-td .code { color: ${whenForegroundColor}; }`);
        }
        const listHoverForegroundColor = theme.getColor(colorRegistry_1.listHoverForeground);
        const listHoverBackgroundColor = theme.getColor(colorRegistry_1.listHoverBackground);
        if (listHoverForegroundColor && listHoverBackgroundColor) {
            const whenForegroundColor = listHoverForegroundColor.transparent(.8).makeOpaque(listHoverBackgroundColor);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table.focused .monaco-list-row:hover:not(.focused):not(.selected) .monaco-table-tr .monaco-table-td .code { color: ${whenForegroundColor}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2Jyb3dzZXIva2V5YmluZGluZ3NFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTZEaEcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVULElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsdUJBQVU7O2lCQUVoQyxPQUFFLEdBQVcsOEJBQThCLEFBQXpDLENBQTBDO1FBMEM1RCxZQUNDLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ3RCLGtCQUF1RCxFQUN0RCxrQkFBd0QsRUFDbEQsd0JBQW9FLEVBQzNFLGlCQUFzRCxFQUNwRCxtQkFBMEQsRUFDN0QsZ0JBQW9ELEVBQ2hELG9CQUE0RCxFQUNuRSxhQUE4QyxFQUM3QyxjQUErQixFQUN6QixvQkFBNEQ7WUFFbkYsS0FBSyxDQUFDLG1CQUFpQixDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBWDlDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDckMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUNqQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBQzFELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbkMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUM1QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQy9CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbEQsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBRXRCLHlCQUFvQixHQUFwQixvQkFBb0Is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LENBQUMsbUNBQW1CLENBQUMsQ0FBQztRQUNyRSxNQUFNLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsbUNBQW1CLENBQUMsQ0FBQztRQUNyRSxJQUFJLHdCQUF3QixJQUFJLHdCQUF3QixFQUFFLENBQUM7WUFDMUQsTUFBTSxtQkFBbUIsR0FBRyx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDMUcsU0FBUyxDQUFDLE9BQU8sQ0FBQywwS0FBMEssbUJBQW1CLEtBQUssQ0FBQyxDQUFDO1FBQ3ZOLENBQUM7UUFFRCxNQUFNLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsbUNBQW1CLENBQUMsQ0FBQztRQUNyRSxNQUFNLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsbUNBQW1CLENBQUMsQ0FBQztRQUNyRSxJQUFJLHdCQUF3QixJQUFJLHdCQUF3QixFQUFFLENBQUM7WUFDMUQsTUFBTSxtQkFBbUIsR0FBRyx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDMUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxxTUFBcU0sbUJBQW1CLEtBQUssQ0FBQyxDQUFDO1FBQ2xQLENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQyJ9