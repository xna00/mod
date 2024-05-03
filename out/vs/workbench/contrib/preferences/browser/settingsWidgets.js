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
define(["require", "exports", "vs/base/browser/canIUse", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/selectBox/selectBox", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/types", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./media/settingsWidgets"], function (require, exports, canIUse_1, DOM, actionbar_1, button_1, toggle_1, inputBox_1, selectBox_1, async_1, codicons_1, event_1, lifecycle_1, platform_1, types_1, nls_1, contextView_1, themeService_1, themables_1, preferencesIcons_1, settingsEditorColorRegistry_1, defaultStyles_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectSettingCheckboxWidget = exports.ObjectSettingDropdownWidget = exports.IncludeSettingWidget = exports.ExcludeSettingWidget = exports.ListSettingWidget = exports.AbstractListSettingWidget = exports.ListSettingListModel = void 0;
    const $ = DOM.$;
    class ListSettingListModel {
        get items() {
            const items = this._dataItems.map((item, i) => {
                const editing = typeof this._editKey === 'number' && this._editKey === i;
                return {
                    ...item,
                    editing,
                    selected: i === this._selectedIdx || editing
                };
            });
            if (this._editKey === 'create') {
                items.push({
                    editing: true,
                    selected: true,
                    ...this._newDataItem,
                });
            }
            return items;
        }
        constructor(newItem) {
            this._dataItems = [];
            this._editKey = null;
            this._selectedIdx = null;
            this._newDataItem = newItem;
        }
        setEditKey(key) {
            this._editKey = key;
        }
        setValue(listData) {
            this._dataItems = listData;
        }
        select(idx) {
            this._selectedIdx = idx;
        }
        getSelected() {
            return this._selectedIdx;
        }
        selectNext() {
            if (typeof this._selectedIdx === 'number') {
                this._selectedIdx = Math.min(this._selectedIdx + 1, this._dataItems.length - 1);
            }
            else {
                this._selectedIdx = 0;
            }
        }
        selectPrevious() {
            if (typeof this._selectedIdx === 'number') {
                this._selectedIdx = Math.max(this._selectedIdx - 1, 0);
            }
            else {
                this._selectedIdx = 0;
            }
        }
    }
    exports.ListSettingListModel = ListSettingListModel;
    let AbstractListSettingWidget = class AbstractListSettingWidget extends lifecycle_1.Disposable {
        get domNode() {
            return this.listElement;
        }
        get items() {
            return this.model.items;
        }
        get inReadMode() {
            return this.model.items.every(item => !item.editing);
        }
        constructor(container, themeService, contextViewService) {
            super();
            this.container = container;
            this.themeService = themeService;
            this.contextViewService = contextViewService;
            this.rowElements = [];
            this._onDidChangeList = this._register(new event_1.Emitter());
            this.model = new ListSettingListModel(this.getEmptyItem());
            this.listDisposables = this._register(new lifecycle_1.DisposableStore());
            this.onDidChangeList = this._onDidChangeList.event;
            this.listElement = DOM.append(container, $('div'));
            this.listElement.setAttribute('role', 'list');
            this.getContainerClasses().forEach(c => this.listElement.classList.add(c));
            DOM.append(container, this.renderAddButton());
            this.renderList();
            this._register(DOM.addDisposableListener(this.listElement, DOM.EventType.POINTER_DOWN, e => this.onListClick(e)));
            this._register(DOM.addDisposableListener(this.listElement, DOM.EventType.DBLCLICK, e => this.onListDoubleClick(e)));
            this._register(DOM.addStandardDisposableListener(this.listElement, 'keydown', (e) => {
                if (e.equals(16 /* KeyCode.UpArrow */)) {
                    this.selectPreviousRow();
                }
                else if (e.equals(18 /* KeyCode.DownArrow */)) {
                    this.selectNextRow();
                }
                else {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
            }));
        }
        setValue(listData) {
            this.model.setValue(listData);
            this.renderList();
        }
        renderHeader() {
            return;
        }
        isAddButtonVisible() {
            return true;
        }
        renderList() {
            const focused = DOM.isAncestorOfActiveElement(this.listElement);
            DOM.clearNode(this.listElement);
            this.listDisposables.clear();
            const newMode = this.model.items.some(item => !!(item.editing && this.isItemNew(item)));
            this.container.classList.toggle('setting-list-hide-add-button', !this.isAddButtonVisible() || newMode);
            if (this.model.items.length) {
                this.listElement.tabIndex = 0;
            }
            else {
                this.listElement.removeAttribute('tabIndex');
            }
            const header = this.renderHeader();
            if (header) {
                this.listElement.appendChild(header);
            }
            this.rowElements = this.model.items.map((item, i) => this.renderDataOrEditItem(item, i, focused));
            this.rowElements.forEach(rowElement => this.listElement.appendChild(rowElement));
        }
        createBasicSelectBox(value) {
            const selectBoxOptions = value.options.map(({ value, description }) => ({ text: value, description }));
            const selected = value.options.findIndex(option => value.data === option.value);
            const styles = (0, defaultStyles_1.getSelectBoxStyles)({
                selectBackground: settingsEditorColorRegistry_1.settingsSelectBackground,
                selectForeground: settingsEditorColorRegistry_1.settingsSelectForeground,
                selectBorder: settingsEditorColorRegistry_1.settingsSelectBorder,
                selectListBorder: settingsEditorColorRegistry_1.settingsSelectListBorder
            });
            const selectBox = new selectBox_1.SelectBox(selectBoxOptions, selected, this.contextViewService, styles, {
                useCustomDrawn: !(platform_1.isIOS && canIUse_1.BrowserFeatures.pointerEvents)
            });
            return selectBox;
        }
        editSetting(idx) {
            this.model.setEditKey(idx);
            this.renderList();
        }
        cancelEdit() {
            this.model.setEditKey('none');
            this.renderList();
        }
        handleItemChange(originalItem, changedItem, idx) {
            this.model.setEditKey('none');
            this._onDidChangeList.fire({
                originalItem,
                item: changedItem,
                targetIndex: idx,
            });
            this.renderList();
        }
        renderDataOrEditItem(item, idx, listFocused) {
            const rowElement = item.editing ?
                this.renderEdit(item, idx) :
                this.renderDataItem(item, idx, listFocused);
            rowElement.setAttribute('role', 'listitem');
            return rowElement;
        }
        renderDataItem(item, idx, listFocused) {
            const rowElementGroup = this.renderItem(item, idx);
            const rowElement = rowElementGroup.rowElement;
            rowElement.setAttribute('data-index', idx + '');
            rowElement.setAttribute('tabindex', item.selected ? '0' : '-1');
            rowElement.classList.toggle('selected', item.selected);
            const actionBar = new actionbar_1.ActionBar(rowElement);
            this.listDisposables.add(actionBar);
            actionBar.push(this.getActionsForItem(item, idx), { icon: true, label: true });
            this.addTooltipsToRow(rowElementGroup, item);
            if (item.selected && listFocused) {
                (0, async_1.disposableTimeout)(() => rowElement.focus(), undefined, this.listDisposables);
            }
            this.listDisposables.add(DOM.addDisposableListener(rowElement, 'click', (e) => {
                // There is a parent list widget, which is the one that holds the list of settings.
                // Prevent the parent widget from trying to interpret this click event.
                e.stopPropagation();
            }));
            return rowElement;
        }
        renderAddButton() {
            const rowElement = $('.setting-list-new-row');
            const startAddButton = this._register(new button_1.Button(rowElement, defaultStyles_1.defaultButtonStyles));
            startAddButton.label = this.getLocalizedStrings().addButtonLabel;
            startAddButton.element.classList.add('setting-list-addButton');
            this._register(startAddButton.onDidClick(() => {
                this.model.setEditKey('create');
                this.renderList();
            }));
            return rowElement;
        }
        onListClick(e) {
            const targetIdx = this.getClickedItemIndex(e);
            if (targetIdx < 0) {
                return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            if (this.model.getSelected() === targetIdx) {
                return;
            }
            this.selectRow(targetIdx);
        }
        onListDoubleClick(e) {
            const targetIdx = this.getClickedItemIndex(e);
            if (targetIdx < 0) {
                return;
            }
            const item = this.model.items[targetIdx];
            if (item) {
                this.editSetting(targetIdx);
                e.preventDefault();
                e.stopPropagation();
            }
        }
        getClickedItemIndex(e) {
            if (!e.target) {
                return -1;
            }
            const actionbar = DOM.findParentWithClass(e.target, 'monaco-action-bar');
            if (actionbar) {
                // Don't handle doubleclicks inside the action bar
                return -1;
            }
            const element = DOM.findParentWithClass(e.target, 'setting-list-row');
            if (!element) {
                return -1;
            }
            const targetIdxStr = element.getAttribute('data-index');
            if (!targetIdxStr) {
                return -1;
            }
            const targetIdx = parseInt(targetIdxStr);
            return targetIdx;
        }
        selectRow(idx) {
            this.model.select(idx);
            this.rowElements.forEach(row => row.classList.remove('selected'));
            const selectedRow = this.rowElements[this.model.getSelected()];
            selectedRow.classList.add('selected');
            selectedRow.focus();
        }
        selectNextRow() {
            this.model.selectNext();
            this.selectRow(this.model.getSelected());
        }
        selectPreviousRow() {
            this.model.selectPrevious();
            this.selectRow(this.model.getSelected());
        }
    };
    exports.AbstractListSettingWidget = AbstractListSettingWidget;
    exports.AbstractListSettingWidget = AbstractListSettingWidget = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, contextView_1.IContextViewService)
    ], AbstractListSettingWidget);
    class ListSettingWidget extends AbstractListSettingWidget {
        constructor() {
            super(...arguments);
            this.showAddButton = true;
        }
        setValue(listData, options) {
            this.keyValueSuggester = options?.keySuggester;
            this.showAddButton = options?.showAddButton ?? true;
            super.setValue(listData);
        }
        getEmptyItem() {
            return {
                value: {
                    type: 'string',
                    data: ''
                }
            };
        }
        isAddButtonVisible() {
            return this.showAddButton;
        }
        getContainerClasses() {
            return ['setting-list-widget'];
        }
        getActionsForItem(item, idx) {
            return [
                {
                    class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsEditIcon),
                    enabled: true,
                    id: 'workbench.action.editListItem',
                    tooltip: this.getLocalizedStrings().editActionTooltip,
                    run: () => this.editSetting(idx)
                },
                {
                    class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsRemoveIcon),
                    enabled: true,
                    id: 'workbench.action.removeListItem',
                    tooltip: this.getLocalizedStrings().deleteActionTooltip,
                    run: () => this._onDidChangeList.fire({ originalItem: item, item: undefined, targetIndex: idx })
                }
            ];
        }
        getDragImage(item) {
            const dragImage = $('.monaco-drag-image');
            dragImage.textContent = item.value.data;
            return dragImage;
        }
        renderItem(item, idx) {
            const rowElement = $('.setting-list-row');
            const valueElement = DOM.append(rowElement, $('.setting-list-value'));
            const siblingElement = DOM.append(rowElement, $('.setting-list-sibling'));
            valueElement.textContent = item.value.data.toString();
            siblingElement.textContent = item.sibling ? `when: ${item.sibling}` : null;
            this.addDragAndDrop(rowElement, item, idx);
            return { rowElement, keyElement: valueElement, valueElement: siblingElement };
        }
        addDragAndDrop(rowElement, item, idx) {
            if (this.inReadMode) {
                rowElement.draggable = true;
                rowElement.classList.add('draggable');
            }
            else {
                rowElement.draggable = false;
                rowElement.classList.remove('draggable');
            }
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_START, (ev) => {
                this.dragDetails = {
                    element: rowElement,
                    item,
                    itemIndex: idx
                };
                if (ev.dataTransfer) {
                    ev.dataTransfer.dropEffect = 'move';
                    const dragImage = this.getDragImage(item);
                    rowElement.ownerDocument.body.appendChild(dragImage);
                    ev.dataTransfer.setDragImage(dragImage, -10, -10);
                    setTimeout(() => rowElement.ownerDocument.body.removeChild(dragImage), 0);
                }
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_OVER, (ev) => {
                if (!this.dragDetails) {
                    return false;
                }
                ev.preventDefault();
                if (ev.dataTransfer) {
                    ev.dataTransfer.dropEffect = 'move';
                }
                return true;
            }));
            let counter = 0;
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_ENTER, (ev) => {
                counter++;
                rowElement.classList.add('drag-hover');
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_LEAVE, (ev) => {
                counter--;
                if (!counter) {
                    rowElement.classList.remove('drag-hover');
                }
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DROP, (ev) => {
                // cancel the op if we dragged to a completely different setting
                if (!this.dragDetails) {
                    return false;
                }
                ev.preventDefault();
                counter = 0;
                if (this.dragDetails.element !== rowElement) {
                    this._onDidChangeList.fire({
                        originalItem: this.dragDetails.item,
                        sourceIndex: this.dragDetails.itemIndex,
                        item,
                        targetIndex: idx
                    });
                }
                return true;
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_END, (ev) => {
                counter = 0;
                rowElement.classList.remove('drag-hover');
                ev.dataTransfer?.clearData();
                if (this.dragDetails) {
                    this.dragDetails = undefined;
                }
            }));
        }
        renderEdit(item, idx) {
            const rowElement = $('.setting-list-edit-row');
            let valueInput;
            let currentDisplayValue;
            let currentEnumOptions;
            if (this.keyValueSuggester) {
                const enumData = this.keyValueSuggester(this.model.items.map(({ value: { data } }) => data), idx);
                item = {
                    ...item,
                    value: {
                        type: 'enum',
                        data: item.value.data,
                        options: enumData ? enumData.options : []
                    }
                };
            }
            switch (item.value.type) {
                case 'string':
                    valueInput = this.renderInputBox(item.value, rowElement);
                    break;
                case 'enum':
                    valueInput = this.renderDropdown(item.value, rowElement);
                    currentEnumOptions = item.value.options;
                    if (item.value.options.length) {
                        currentDisplayValue = this.isItemNew(item) ?
                            currentEnumOptions[0].value : item.value.data;
                    }
                    break;
            }
            const updatedInputBoxItem = () => {
                const inputBox = valueInput;
                return {
                    value: {
                        type: 'string',
                        data: inputBox.value
                    },
                    sibling: siblingInput?.value
                };
            };
            const updatedSelectBoxItem = (selectedValue) => {
                return {
                    value: {
                        type: 'enum',
                        data: selectedValue,
                        options: currentEnumOptions ?? []
                    }
                };
            };
            const onKeyDown = (e) => {
                if (e.equals(3 /* KeyCode.Enter */)) {
                    this.handleItemChange(item, updatedInputBoxItem(), idx);
                }
                else if (e.equals(9 /* KeyCode.Escape */)) {
                    this.cancelEdit();
                    e.preventDefault();
                }
                rowElement?.focus();
            };
            if (item.value.type !== 'string') {
                const selectBox = valueInput;
                this.listDisposables.add(selectBox.onDidSelect(({ selected }) => {
                    currentDisplayValue = selected;
                }));
            }
            else {
                const inputBox = valueInput;
                this.listDisposables.add(DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, onKeyDown));
            }
            let siblingInput;
            if (!(0, types_1.isUndefinedOrNull)(item.sibling)) {
                siblingInput = new inputBox_1.InputBox(rowElement, this.contextViewService, {
                    placeholder: this.getLocalizedStrings().siblingInputPlaceholder,
                    inputBoxStyles: (0, defaultStyles_1.getInputBoxStyle)({
                        inputBackground: settingsEditorColorRegistry_1.settingsTextInputBackground,
                        inputForeground: settingsEditorColorRegistry_1.settingsTextInputForeground,
                        inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
                    })
                });
                siblingInput.element.classList.add('setting-list-siblingInput');
                this.listDisposables.add(siblingInput);
                siblingInput.value = item.sibling;
                this.listDisposables.add(DOM.addStandardDisposableListener(siblingInput.inputElement, DOM.EventType.KEY_DOWN, onKeyDown));
            }
            else if (valueInput instanceof inputBox_1.InputBox) {
                valueInput.element.classList.add('no-sibling');
            }
            const okButton = this._register(new button_1.Button(rowElement, defaultStyles_1.defaultButtonStyles));
            okButton.label = (0, nls_1.localize)('okButton', "OK");
            okButton.element.classList.add('setting-list-ok-button');
            this.listDisposables.add(okButton.onDidClick(() => {
                if (item.value.type === 'string') {
                    this.handleItemChange(item, updatedInputBoxItem(), idx);
                }
                else {
                    this.handleItemChange(item, updatedSelectBoxItem(currentDisplayValue), idx);
                }
            }));
            const cancelButton = this._register(new button_1.Button(rowElement, { secondary: true, ...defaultStyles_1.defaultButtonStyles }));
            cancelButton.label = (0, nls_1.localize)('cancelButton', "Cancel");
            cancelButton.element.classList.add('setting-list-cancel-button');
            this.listDisposables.add(cancelButton.onDidClick(() => this.cancelEdit()));
            this.listDisposables.add((0, async_1.disposableTimeout)(() => {
                valueInput.focus();
                if (valueInput instanceof inputBox_1.InputBox) {
                    valueInput.select();
                }
            }));
            return rowElement;
        }
        isItemNew(item) {
            return item.value.data === '';
        }
        addTooltipsToRow(rowElementGroup, { value, sibling }) {
            const title = (0, types_1.isUndefinedOrNull)(sibling)
                ? (0, nls_1.localize)('listValueHintLabel', "List item `{0}`", value.data)
                : (0, nls_1.localize)('listSiblingHintLabel', "List item `{0}` with sibling `${1}`", value.data, sibling);
            const { rowElement } = rowElementGroup;
            this.listDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), rowElement, title));
            rowElement.setAttribute('aria-label', title);
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeItem', "Remove Item"),
                editActionTooltip: (0, nls_1.localize)('editItem', "Edit Item"),
                addButtonLabel: (0, nls_1.localize)('addItem', "Add Item"),
                inputPlaceholder: (0, nls_1.localize)('itemInputPlaceholder', "Item..."),
                siblingInputPlaceholder: (0, nls_1.localize)('listSiblingInputPlaceholder', "Sibling..."),
            };
        }
        renderInputBox(value, rowElement) {
            const valueInput = new inputBox_1.InputBox(rowElement, this.contextViewService, {
                placeholder: this.getLocalizedStrings().inputPlaceholder,
                inputBoxStyles: (0, defaultStyles_1.getInputBoxStyle)({
                    inputBackground: settingsEditorColorRegistry_1.settingsTextInputBackground,
                    inputForeground: settingsEditorColorRegistry_1.settingsTextInputForeground,
                    inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
                })
            });
            valueInput.element.classList.add('setting-list-valueInput');
            this.listDisposables.add(valueInput);
            valueInput.value = value.data.toString();
            return valueInput;
        }
        renderDropdown(value, rowElement) {
            if (value.type !== 'enum') {
                throw new Error('Valuetype must be enum.');
            }
            const selectBox = this.createBasicSelectBox(value);
            const wrapper = $('.setting-list-object-list-row');
            selectBox.render(wrapper);
            rowElement.appendChild(wrapper);
            return selectBox;
        }
    }
    exports.ListSettingWidget = ListSettingWidget;
    class ExcludeSettingWidget extends ListSettingWidget {
        getContainerClasses() {
            return ['setting-list-include-exclude-widget'];
        }
        addDragAndDrop(rowElement, item, idx) {
            return;
        }
        addTooltipsToRow(rowElementGroup, { value, sibling }) {
            const title = (0, types_1.isUndefinedOrNull)(sibling)
                ? (0, nls_1.localize)('excludePatternHintLabel', "Exclude files matching `{0}`", value.data)
                : (0, nls_1.localize)('excludeSiblingHintLabel', "Exclude files matching `{0}`, only when a file matching `{1}` is present", value.data, sibling);
            const { rowElement } = rowElementGroup;
            this.listDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), rowElement, title));
            rowElement.setAttribute('aria-label', title);
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeExcludeItem', "Remove Exclude Item"),
                editActionTooltip: (0, nls_1.localize)('editExcludeItem', "Edit Exclude Item"),
                addButtonLabel: (0, nls_1.localize)('addPattern', "Add Pattern"),
                inputPlaceholder: (0, nls_1.localize)('excludePatternInputPlaceholder', "Exclude Pattern..."),
                siblingInputPlaceholder: (0, nls_1.localize)('excludeSiblingInputPlaceholder', "When Pattern Is Present..."),
            };
        }
    }
    exports.ExcludeSettingWidget = ExcludeSettingWidget;
    class IncludeSettingWidget extends ListSettingWidget {
        getContainerClasses() {
            return ['setting-list-include-exclude-widget'];
        }
        addDragAndDrop(rowElement, item, idx) {
            return;
        }
        addTooltipsToRow(rowElementGroup, { value, sibling }) {
            const title = (0, types_1.isUndefinedOrNull)(sibling)
                ? (0, nls_1.localize)('includePatternHintLabel', "Include files matching `{0}`", value.data)
                : (0, nls_1.localize)('includeSiblingHintLabel', "Include files matching `{0}`, only when a file matching `{1}` is present", value.data, sibling);
            const { rowElement } = rowElementGroup;
            this.listDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), rowElement, title));
            rowElement.setAttribute('aria-label', title);
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeIncludeItem', "Remove Include Item"),
                editActionTooltip: (0, nls_1.localize)('editIncludeItem', "Edit Include Item"),
                addButtonLabel: (0, nls_1.localize)('addPattern', "Add Pattern"),
                inputPlaceholder: (0, nls_1.localize)('includePatternInputPlaceholder', "Include Pattern..."),
                siblingInputPlaceholder: (0, nls_1.localize)('includeSiblingInputPlaceholder', "When Pattern Is Present..."),
            };
        }
    }
    exports.IncludeSettingWidget = IncludeSettingWidget;
    class ObjectSettingDropdownWidget extends AbstractListSettingWidget {
        constructor() {
            super(...arguments);
            this.currentSettingKey = '';
            this.showAddButton = true;
            this.keySuggester = () => undefined;
            this.valueSuggester = () => undefined;
        }
        setValue(listData, options) {
            this.showAddButton = options?.showAddButton ?? this.showAddButton;
            this.keySuggester = options?.keySuggester ?? this.keySuggester;
            this.valueSuggester = options?.valueSuggester ?? this.valueSuggester;
            if ((0, types_1.isDefined)(options) && options.settingKey !== this.currentSettingKey) {
                this.model.setEditKey('none');
                this.model.select(null);
                this.currentSettingKey = options.settingKey;
            }
            super.setValue(listData);
        }
        isItemNew(item) {
            return item.key.data === '' && item.value.data === '';
        }
        isAddButtonVisible() {
            return this.showAddButton;
        }
        getEmptyItem() {
            return {
                key: { type: 'string', data: '' },
                value: { type: 'string', data: '' },
                removable: true,
            };
        }
        getContainerClasses() {
            return ['setting-list-object-widget'];
        }
        getActionsForItem(item, idx) {
            const actions = [
                {
                    class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsEditIcon),
                    enabled: true,
                    id: 'workbench.action.editListItem',
                    tooltip: this.getLocalizedStrings().editActionTooltip,
                    run: () => this.editSetting(idx)
                },
            ];
            if (item.removable) {
                actions.push({
                    class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsRemoveIcon),
                    enabled: true,
                    id: 'workbench.action.removeListItem',
                    tooltip: this.getLocalizedStrings().deleteActionTooltip,
                    run: () => this._onDidChangeList.fire({ originalItem: item, item: undefined, targetIndex: idx })
                });
            }
            else {
                actions.push({
                    class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsDiscardIcon),
                    enabled: true,
                    id: 'workbench.action.resetListItem',
                    tooltip: this.getLocalizedStrings().resetActionTooltip,
                    run: () => this._onDidChangeList.fire({ originalItem: item, item: undefined, targetIndex: idx })
                });
            }
            return actions;
        }
        renderHeader() {
            const header = $('.setting-list-row-header');
            const keyHeader = DOM.append(header, $('.setting-list-object-key'));
            const valueHeader = DOM.append(header, $('.setting-list-object-value'));
            const { keyHeaderText, valueHeaderText } = this.getLocalizedStrings();
            keyHeader.textContent = keyHeaderText;
            valueHeader.textContent = valueHeaderText;
            return header;
        }
        renderItem(item, idx) {
            const rowElement = $('.setting-list-row');
            rowElement.classList.add('setting-list-object-row');
            const keyElement = DOM.append(rowElement, $('.setting-list-object-key'));
            const valueElement = DOM.append(rowElement, $('.setting-list-object-value'));
            keyElement.textContent = item.key.data;
            valueElement.textContent = item.value.data.toString();
            return { rowElement, keyElement, valueElement };
        }
        renderEdit(item, idx) {
            const rowElement = $('.setting-list-edit-row.setting-list-object-row');
            const changedItem = { ...item };
            const onKeyChange = (key) => {
                changedItem.key = key;
                okButton.enabled = key.data !== '';
                const suggestedValue = this.valueSuggester(key.data) ?? item.value;
                if (this.shouldUseSuggestion(item.value, changedItem.value, suggestedValue)) {
                    onValueChange(suggestedValue);
                    renderLatestValue();
                }
            };
            const onValueChange = (value) => {
                changedItem.value = value;
            };
            let keyWidget;
            let keyElement;
            if (this.showAddButton) {
                if (this.isItemNew(item)) {
                    const suggestedKey = this.keySuggester(this.model.items.map(({ key: { data } }) => data));
                    if ((0, types_1.isDefined)(suggestedKey)) {
                        changedItem.key = suggestedKey;
                        const suggestedValue = this.valueSuggester(changedItem.key.data);
                        onValueChange(suggestedValue ?? changedItem.value);
                    }
                }
                const { widget, element } = this.renderEditWidget(changedItem.key, {
                    idx,
                    isKey: true,
                    originalItem: item,
                    changedItem,
                    update: onKeyChange,
                });
                keyWidget = widget;
                keyElement = element;
            }
            else {
                keyElement = $('.setting-list-object-key');
                keyElement.textContent = item.key.data;
            }
            let valueWidget;
            const valueContainer = $('.setting-list-object-value-container');
            const renderLatestValue = () => {
                const { widget, element } = this.renderEditWidget(changedItem.value, {
                    idx,
                    isKey: false,
                    originalItem: item,
                    changedItem,
                    update: onValueChange,
                });
                valueWidget = widget;
                DOM.clearNode(valueContainer);
                valueContainer.append(element);
            };
            renderLatestValue();
            rowElement.append(keyElement, valueContainer);
            const okButton = this._register(new button_1.Button(rowElement, defaultStyles_1.defaultButtonStyles));
            okButton.enabled = changedItem.key.data !== '';
            okButton.label = (0, nls_1.localize)('okButton', "OK");
            okButton.element.classList.add('setting-list-ok-button');
            this.listDisposables.add(okButton.onDidClick(() => this.handleItemChange(item, changedItem, idx)));
            const cancelButton = this._register(new button_1.Button(rowElement, { secondary: true, ...defaultStyles_1.defaultButtonStyles }));
            cancelButton.label = (0, nls_1.localize)('cancelButton', "Cancel");
            cancelButton.element.classList.add('setting-list-cancel-button');
            this.listDisposables.add(cancelButton.onDidClick(() => this.cancelEdit()));
            this.listDisposables.add((0, async_1.disposableTimeout)(() => {
                const widget = keyWidget ?? valueWidget;
                widget.focus();
                if (widget instanceof inputBox_1.InputBox) {
                    widget.select();
                }
            }));
            return rowElement;
        }
        renderEditWidget(keyOrValue, options) {
            switch (keyOrValue.type) {
                case 'string':
                    return this.renderStringEditWidget(keyOrValue, options);
                case 'enum':
                    return this.renderEnumEditWidget(keyOrValue, options);
                case 'boolean':
                    return this.renderEnumEditWidget({
                        type: 'enum',
                        data: keyOrValue.data.toString(),
                        options: [{ value: 'true' }, { value: 'false' }],
                    }, options);
            }
        }
        renderStringEditWidget(keyOrValue, { idx, isKey, originalItem, changedItem, update }) {
            const wrapper = $(isKey ? '.setting-list-object-input-key' : '.setting-list-object-input-value');
            const inputBox = new inputBox_1.InputBox(wrapper, this.contextViewService, {
                placeholder: isKey
                    ? (0, nls_1.localize)('objectKeyInputPlaceholder', "Key")
                    : (0, nls_1.localize)('objectValueInputPlaceholder', "Value"),
                inputBoxStyles: (0, defaultStyles_1.getInputBoxStyle)({
                    inputBackground: settingsEditorColorRegistry_1.settingsTextInputBackground,
                    inputForeground: settingsEditorColorRegistry_1.settingsTextInputForeground,
                    inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
                })
            });
            inputBox.element.classList.add('setting-list-object-input');
            this.listDisposables.add(inputBox);
            inputBox.value = keyOrValue.data;
            this.listDisposables.add(inputBox.onDidChange(value => update({ ...keyOrValue, data: value })));
            const onKeyDown = (e) => {
                if (e.equals(3 /* KeyCode.Enter */)) {
                    this.handleItemChange(originalItem, changedItem, idx);
                }
                else if (e.equals(9 /* KeyCode.Escape */)) {
                    this.cancelEdit();
                    e.preventDefault();
                }
            };
            this.listDisposables.add(DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, onKeyDown));
            return { widget: inputBox, element: wrapper };
        }
        renderEnumEditWidget(keyOrValue, { isKey, changedItem, update }) {
            const selectBox = this.createBasicSelectBox(keyOrValue);
            const changedKeyOrValue = isKey ? changedItem.key : changedItem.value;
            this.listDisposables.add(selectBox.onDidSelect(({ selected }) => update(changedKeyOrValue.type === 'boolean'
                ? { ...changedKeyOrValue, data: selected === 'true' ? true : false }
                : { ...changedKeyOrValue, data: selected })));
            const wrapper = $('.setting-list-object-input');
            wrapper.classList.add(isKey ? 'setting-list-object-input-key' : 'setting-list-object-input-value');
            selectBox.render(wrapper);
            // Switch to the first item if the user set something invalid in the json
            const selected = keyOrValue.options.findIndex(option => keyOrValue.data === option.value);
            if (selected === -1 && keyOrValue.options.length) {
                update(changedKeyOrValue.type === 'boolean'
                    ? { ...changedKeyOrValue, data: true }
                    : { ...changedKeyOrValue, data: keyOrValue.options[0].value });
            }
            else if (changedKeyOrValue.type === 'boolean') {
                // https://github.com/microsoft/vscode/issues/129581
                update({ ...changedKeyOrValue, data: keyOrValue.data === 'true' });
            }
            return { widget: selectBox, element: wrapper };
        }
        shouldUseSuggestion(originalValue, previousValue, newValue) {
            // suggestion is exactly the same
            if (newValue.type !== 'enum' && newValue.type === previousValue.type && newValue.data === previousValue.data) {
                return false;
            }
            // item is new, use suggestion
            if (originalValue.data === '') {
                return true;
            }
            if (previousValue.type === newValue.type && newValue.type !== 'enum') {
                return false;
            }
            // check if all enum options are the same
            if (previousValue.type === 'enum' && newValue.type === 'enum') {
                const previousEnums = new Set(previousValue.options.map(({ value }) => value));
                newValue.options.forEach(({ value }) => previousEnums.delete(value));
                // all options are the same
                if (previousEnums.size === 0) {
                    return false;
                }
            }
            return true;
        }
        addTooltipsToRow(rowElementGroup, item) {
            const { keyElement, valueElement, rowElement } = rowElementGroup;
            const accessibleDescription = (0, nls_1.localize)('objectPairHintLabel', "The property `{0}` is set to `{1}`.", item.key.data, item.value.data);
            const keyDescription = this.getEnumDescription(item.key) ?? item.keyDescription ?? accessibleDescription;
            this.listDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), keyElement, keyDescription));
            const valueDescription = this.getEnumDescription(item.value) ?? accessibleDescription;
            this.listDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), valueElement, valueDescription));
            rowElement.setAttribute('aria-label', accessibleDescription);
        }
        getEnumDescription(keyOrValue) {
            const enumDescription = keyOrValue.type === 'enum'
                ? keyOrValue.options.find(({ value }) => keyOrValue.data === value)?.description
                : undefined;
            return enumDescription;
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeItem', "Remove Item"),
                resetActionTooltip: (0, nls_1.localize)('resetItem', "Reset Item"),
                editActionTooltip: (0, nls_1.localize)('editItem', "Edit Item"),
                addButtonLabel: (0, nls_1.localize)('addItem', "Add Item"),
                keyHeaderText: (0, nls_1.localize)('objectKeyHeader', "Item"),
                valueHeaderText: (0, nls_1.localize)('objectValueHeader', "Value"),
            };
        }
    }
    exports.ObjectSettingDropdownWidget = ObjectSettingDropdownWidget;
    class ObjectSettingCheckboxWidget extends AbstractListSettingWidget {
        constructor() {
            super(...arguments);
            this.currentSettingKey = '';
        }
        setValue(listData, options) {
            if ((0, types_1.isDefined)(options) && options.settingKey !== this.currentSettingKey) {
                this.model.setEditKey('none');
                this.model.select(null);
                this.currentSettingKey = options.settingKey;
            }
            super.setValue(listData);
        }
        isItemNew(item) {
            return !item.key.data && !item.value.data;
        }
        getEmptyItem() {
            return {
                key: { type: 'string', data: '' },
                value: { type: 'boolean', data: false },
                removable: false
            };
        }
        getContainerClasses() {
            return ['setting-list-object-widget'];
        }
        getActionsForItem(item, idx) {
            return [];
        }
        isAddButtonVisible() {
            return false;
        }
        renderHeader() {
            return undefined;
        }
        renderDataOrEditItem(item, idx, listFocused) {
            const rowElement = this.renderEdit(item, idx);
            rowElement.setAttribute('role', 'listitem');
            return rowElement;
        }
        renderItem(item, idx) {
            // Return just the containers, since we always render in edit mode anyway
            const rowElement = $('.blank-row');
            const keyElement = $('.blank-row-key');
            return { rowElement, keyElement };
        }
        renderEdit(item, idx) {
            const rowElement = $('.setting-list-edit-row.setting-list-object-row.setting-item-bool');
            const changedItem = { ...item };
            const onValueChange = (newValue) => {
                changedItem.value.data = newValue;
                this.handleItemChange(item, changedItem, idx);
            };
            const checkboxDescription = item.keyDescription ? `${item.keyDescription} (${item.key.data})` : item.key.data;
            const { element, widget: checkbox } = this.renderEditWidget(changedItem.value.data, checkboxDescription, onValueChange);
            rowElement.appendChild(element);
            const valueElement = DOM.append(rowElement, $('.setting-list-object-value'));
            valueElement.textContent = checkboxDescription;
            // We add the tooltips here, because the method is not called by default
            // for widgets in edit mode
            const rowElementGroup = { rowElement, keyElement: valueElement, valueElement: checkbox.domNode };
            this.addTooltipsToRow(rowElementGroup, item);
            this._register(DOM.addDisposableListener(valueElement, DOM.EventType.MOUSE_DOWN, e => {
                const targetElement = e.target;
                if (targetElement.tagName.toLowerCase() !== 'a') {
                    checkbox.checked = !checkbox.checked;
                    onValueChange(checkbox.checked);
                }
                DOM.EventHelper.stop(e);
            }));
            return rowElement;
        }
        renderEditWidget(value, checkboxDescription, onValueChange) {
            const checkbox = new toggle_1.Toggle({
                icon: codicons_1.Codicon.check,
                actionClassName: 'setting-value-checkbox',
                isChecked: value,
                title: checkboxDescription,
                ...toggle_1.unthemedToggleStyles
            });
            this.listDisposables.add(checkbox);
            const wrapper = $('.setting-list-object-input');
            wrapper.classList.add('setting-list-object-input-key-checkbox');
            checkbox.domNode.classList.add('setting-value-checkbox');
            wrapper.appendChild(checkbox.domNode);
            this._register(DOM.addDisposableListener(wrapper, DOM.EventType.MOUSE_DOWN, e => {
                checkbox.checked = !checkbox.checked;
                onValueChange(checkbox.checked);
                // Without this line, the settings editor assumes
                // we lost focus on this setting completely.
                e.stopImmediatePropagation();
            }));
            return { widget: checkbox, element: wrapper };
        }
        addTooltipsToRow(rowElementGroup, item) {
            const accessibleDescription = (0, nls_1.localize)('objectPairHintLabel', "The property `{0}` is set to `{1}`.", item.key.data, item.value.data);
            const title = item.keyDescription ?? accessibleDescription;
            const { rowElement, keyElement, valueElement } = rowElementGroup;
            this.listDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), keyElement, title));
            valueElement.setAttribute('aria-label', accessibleDescription);
            rowElement.setAttribute('aria-label', accessibleDescription);
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeItem', "Remove Item"),
                resetActionTooltip: (0, nls_1.localize)('resetItem', "Reset Item"),
                editActionTooltip: (0, nls_1.localize)('editItem', "Edit Item"),
                addButtonLabel: (0, nls_1.localize)('addItem', "Add Item"),
                keyHeaderText: (0, nls_1.localize)('objectKeyHeader', "Item"),
                valueHeaderText: (0, nls_1.localize)('objectValueHeader', "Value"),
            };
        }
    }
    exports.ObjectSettingCheckboxWidget = ObjectSettingCheckboxWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NXaWRnZXRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wcmVmZXJlbmNlcy9icm93c2VyL3NldHRpbmdzV2lkZ2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE2QmhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFlaEIsTUFBYSxvQkFBb0I7UUFNaEMsSUFBSSxLQUFLO1lBQ1IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdDLE1BQU0sT0FBTyxHQUFHLE9BQU8sSUFBSSxDQUFDLFFBQVEsS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLENBQUM7Z0JBQ3pFLE9BQU87b0JBQ04sR0FBRyxJQUFJO29CQUNQLE9BQU87b0JBQ1AsUUFBUSxFQUFFLENBQUMsS0FBSyxJQUFJLENBQUMsWUFBWSxJQUFJLE9BQU87aUJBQzVDLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDVixPQUFPLEVBQUUsSUFBSTtvQkFDYixRQUFRLEVBQUUsSUFBSTtvQkFDZCxHQUFHLElBQUksQ0FBQyxZQUFZO2lCQUNwQixDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsWUFBWSxPQUFrQjtZQTFCcEIsZUFBVSxHQUFnQixFQUFFLENBQUM7WUFDL0IsYUFBUSxHQUFtQixJQUFJLENBQUM7WUFDaEMsaUJBQVksR0FBa0IsSUFBSSxDQUFDO1lB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