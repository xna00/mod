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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/theme/common/themeService", "vs/base/common/lifecycle", "vs/base/browser/keyboardEvent", "vs/base/common/platform", "vs/base/common/decorators", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/theme/common/theme", "vs/base/common/uri", "vs/platform/quickinput/browser/quickInputUtils", "vs/base/common/lazy", "vs/base/common/iconLabels", "vs/base/common/comparers", "vs/base/common/strings", "vs/base/browser/ui/tree/abstractTree", "vs/base/common/async", "vs/base/common/errors"], function (require, exports, dom, event_1, nls_1, instantiation_1, listService_1, themeService_1, lifecycle_1, keyboardEvent_1, platform_1, decorators_1, iconLabel_1, keybindingLabel_1, actionbar_1, theme_1, uri_1, quickInputUtils_1, lazy_1, iconLabels_1, comparers_1, strings_1, abstractTree_1, async_1, errors_1) {
    "use strict";
    var QuickPickItemElementRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputTree = exports.QuickInputListFocus = void 0;
    const $ = dom.$;
    var QuickInputListFocus;
    (function (QuickInputListFocus) {
        QuickInputListFocus[QuickInputListFocus["First"] = 1] = "First";
        QuickInputListFocus[QuickInputListFocus["Second"] = 2] = "Second";
        QuickInputListFocus[QuickInputListFocus["Last"] = 3] = "Last";
        QuickInputListFocus[QuickInputListFocus["Next"] = 4] = "Next";
        QuickInputListFocus[QuickInputListFocus["Previous"] = 5] = "Previous";
        QuickInputListFocus[QuickInputListFocus["NextPage"] = 6] = "NextPage";
        QuickInputListFocus[QuickInputListFocus["PreviousPage"] = 7] = "PreviousPage";
        QuickInputListFocus[QuickInputListFocus["NextSeparator"] = 8] = "NextSeparator";
        QuickInputListFocus[QuickInputListFocus["PreviousSeparator"] = 9] = "PreviousSeparator";
    })(QuickInputListFocus || (exports.QuickInputListFocus = QuickInputListFocus = {}));
    class BaseQuickPickItemElement {
        constructor(index, hasCheckbox, mainItem) {
            this.index = index;
            this.hasCheckbox = hasCheckbox;
            this._hidden = false;
            this._init = new lazy_1.Lazy(() => {
                const saneLabel = mainItem.label ?? '';
                const saneSortLabel = (0, iconLabels_1.parseLabelWithIcons)(saneLabel).text.trim();
                const saneAriaLabel = mainItem.ariaLabel || [saneLabel, this.saneDescription, this.saneDetail]
                    .map(s => (0, iconLabels_1.getCodiconAriaLabel)(s))
                    .filter(s => !!s)
                    .join(', ');
                return {
                    saneLabel,
                    saneSortLabel,
                    saneAriaLabel
                };
            });
            this._saneDescription = mainItem.description;
            this._saneTooltip = mainItem.tooltip;
        }
        // #region Lazy Getters
        get saneLabel() {
            return this._init.value.saneLabel;
        }
        get saneSortLabel() {
            return this._init.value.saneSortLabel;
        }
        get saneAriaLabel() {
            return this._init.value.saneAriaLabel;
        }
        get element() {
            return this._element;
        }
        set element(value) {
            this._element = value;
        }
        get hidden() {
            return this._hidden;
        }
        set hidden(value) {
            this._hidden = value;
        }
        get saneDescription() {
            return this._saneDescription;
        }
        set saneDescription(value) {
            this._saneDescription = value;
        }
        get saneDetail() {
            return this._saneDetail;
        }
        set saneDetail(value) {
            this._saneDetail = value;
        }
        get saneTooltip() {
            return this._saneTooltip;
        }
        set saneTooltip(value) {
            this._saneTooltip = value;
        }
        get labelHighlights() {
            return this._labelHighlights;
        }
        set labelHighlights(value) {
            this._labelHighlights = value;
        }
        get descriptionHighlights() {
            return this._descriptionHighlights;
        }
        set descriptionHighlights(value) {
            this._descriptionHighlights = value;
        }
        get detailHighlights() {
            return this._detailHighlights;
        }
        set detailHighlights(value) {
            this._detailHighlights = value;
        }
    }
    class QuickPickItemElement extends BaseQuickPickItemElement {
        constructor(index, hasCheckbox, fireButtonTriggered, _onChecked, item, _separator) {
            super(index, hasCheckbox, item);
            this.fireButtonTriggered = fireButtonTriggered;
            this._onChecked = _onChecked;
            this.item = item;
            this._separator = _separator;
            this._checked = false;
            this.onChecked = hasCheckbox
                ? event_1.Event.map(event_1.Event.filter(this._onChecked.event, e => e.element === this), e => e.checked)
                : event_1.Event.None;
            this._saneDetail = item.detail;
            this._labelHighlights = item.highlights?.label;
            this._descriptionHighlights = item.highlights?.description;
            this._detailHighlights = item.highlights?.detail;
        }
        get separator() {
            return this._separator;
        }
        set separator(value) {
            this._separator = value;
        }
        get checked() {
            return this._checked;
        }
        set checked(value) {
            if (value !== this._checked) {
                this._checked = value;
                this._onChecked.fire({ element: this, checked: value });
            }
        }
        get checkboxDisabled() {
            return !!this.item.disabled;
        }
    }
    var QuickPickSeparatorFocusReason;
    (function (QuickPickSeparatorFocusReason) {
        /**
         * No item is hovered or active
         */
        QuickPickSeparatorFocusReason[QuickPickSeparatorFocusReason["NONE"] = 0] = "NONE";
        /**
         * Some item within this section is hovered
         */
        QuickPickSeparatorFocusReason[QuickPickSeparatorFocusReason["MOUSE_HOVER"] = 1] = "MOUSE_HOVER";
        /**
         * Some item within this section is active
         */
        QuickPickSeparatorFocusReason[QuickPickSeparatorFocusReason["ACTIVE_ITEM"] = 2] = "ACTIVE_ITEM";
    })(QuickPickSeparatorFocusReason || (QuickPickSeparatorFocusReason = {}));
    class QuickPickSeparatorElement extends BaseQuickPickItemElement {
        constructor(index, fireSeparatorButtonTriggered, separator) {
            super(index, false, separator);
            this.fireSeparatorButtonTriggered = fireSeparatorButtonTriggered;
            this.separator = separator;
            this.children = new Array();
            /**
             * If this item is >0, it means that there is some item in the list that is either:
             * * hovered over
             * * active
             */
            this.focusInsideSeparator = QuickPickSeparatorFocusReason.NONE;
        }
    }
    class QuickInputItemDelegate {
        getHeight(element) {
            if (element instanceof QuickPickSeparatorElement) {
                return 30;
            }
            return element.saneDetail ? 44 : 22;
        }
        getTemplateId(element) {
            if (element instanceof QuickPickItemElement) {
                return QuickPickItemElementRenderer.ID;
            }
            else {
                return QuickPickSeparatorElementRenderer.ID;
            }
        }
    }
    class QuickInputAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('quickInput', "Quick Input");
        }
        getAriaLabel(element) {
            return element.separator?.label
                ? `${element.saneAriaLabel}, ${element.separator.label}`
                : element.saneAriaLabel;
        }
        getWidgetRole() {
            return 'listbox';
        }
        getRole(element) {
            return element.hasCheckbox ? 'checkbox' : 'option';
        }
        isChecked(element) {
            if (!element.hasCheckbox || !(element instanceof QuickPickItemElement)) {
                return undefined;
            }
            return {
                value: element.checked,
                onDidChange: element.onChecked
            };
        }
    }
    class BaseQuickInputListRenderer {
        constructor(hoverDelegate) {
            this.hoverDelegate = hoverDelegate;
        }
        // TODO: only do the common stuff here and have a subclass handle their specific stuff
        renderTemplate(container) {
            const data = Object.create(null);
            data.toDisposeElement = new lifecycle_1.DisposableStore();
            data.toDisposeTemplate = new lifecycle_1.DisposableStore();
            data.entry = dom.append(container, $('.quick-input-list-entry'));
            // Checkbox
            const label = dom.append(data.entry, $('label.quick-input-list-label'));
            data.toDisposeTemplate.add(dom.addStandardDisposableListener(label, dom.EventType.CLICK, e => {
                if (!data.checkbox.offsetParent) { // If checkbox not visible:
                    e.preventDefault(); // Prevent toggle of checkbox when it is immediately shown afterwards. #91740
                }
            }));
            data.checkbox = dom.append(label, $('input.quick-input-list-checkbox'));
            data.checkbox.type = 'checkbox';
            // Rows
            const rows = dom.append(label, $('.quick-input-list-rows'));
            const row1 = dom.append(rows, $('.quick-input-list-row'));
            const row2 = dom.append(rows, $('.quick-input-list-row'));
            // Label
            data.label = new iconLabel_1.IconLabel(row1, { supportHighlights: true, supportDescriptionHighlights: true, supportIcons: true, hoverDelegate: this.hoverDelegate });
            data.toDisposeTemplate.add(data.label);
            data.icon = dom.prepend(data.label.element, $('.quick-input-list-icon'));
            // Keybinding
            const keybindingContainer = dom.append(row1, $('.quick-input-list-entry-keybinding'));
            data.keybinding = new keybindingLabel_1.KeybindingLabel(keybindingContainer, platform_1.OS);
            data.toDisposeTemplate.add(data.keybinding);
            // Detail
            const detailContainer = dom.append(row2, $('.quick-input-list-label-meta'));
            data.detail = new iconLabel_1.IconLabel(detailContainer, { supportHighlights: true, supportIcons: true, hoverDelegate: this.hoverDelegate });
            data.toDisposeTemplate.add(data.detail);
            // Separator
            data.separator = dom.append(data.entry, $('.quick-input-list-separator'));
            // Actions
            data.actionBar = new actionbar_1.ActionBar(data.entry, this.hoverDelegate ? { hoverDelegate: this.hoverDelegate } : undefined);
            data.actionBar.domNode.classList.add('quick-input-list-entry-action-bar');
            data.toDisposeTemplate.add(data.actionBar);
            return data;
        }
        disposeTemplate(data) {
            data.toDisposeElement.dispose();
            data.toDisposeTemplate.dispose();
        }
        disposeElement(_element, _index, data) {
            data.toDisposeElement.clear();
            data.actionBar.clear();
        }
    }
    let QuickPickItemElementRenderer = class QuickPickItemElementRenderer extends BaseQuickInputListRenderer {
        static { QuickPickItemElementRenderer_1 = this; }
        static { this.ID = 'quickpickitem'; }
        constructor(hoverDelegate, themeService) {
            super(hoverDelegate);
            this.themeService = themeService;
            // Follow what we do in the separator renderer
            this._itemsWithSeparatorsFrequency = new Map();
        }
        get templateId() {
            return QuickPickItemElementRenderer_1.ID;
        }
        renderTemplate(container) {
            const data = super.renderTemplate(container);
            data.toDisposeTemplate.add(dom.addStandardDisposableListener(data.checkbox, dom.EventType.CHANGE, e => {
                data.element.checked = data.checkbox.checked;
            }));
            return data;
        }
        renderElement(node, index, data) {
            const element = node.element;
            data.element = element;
            element.element = data.entry ?? undefined;
            const mainItem = element.item;
            data.checkbox.checked = element.checked;
            data.toDisposeElement.add(element.onChecked(checked => data.checkbox.checked = checked));
            data.checkbox.disabled = element.checkboxDisabled;
            const { labelHighlights, descriptionHighlights, detailHighlights } = element;
            // Icon
            if (mainItem.iconPath) {
                const icon = (0, theme_1.isDark)(this.themeService.getColorTheme().type) ? mainItem.iconPath.dark : (mainItem.iconPath.light ?? mainItem.iconPath.dark);
                const iconUrl = uri_1.URI.revive(icon);
                data.icon.className = 'quick-input-list-icon';
                data.icon.style.backgroundImage = dom.asCSSUrl(iconUrl);
            }
            else {
                data.icon.style.backgroundImage = '';
                data.icon.className = mainItem.iconClass ? `quick-input-list-icon ${mainItem.iconClass}` : '';
            }
            // Label
            let descriptionTitle;
            // if we have a tooltip, that will be the hover,
            // with the saneDescription as fallback if it
            // is defined
            if (!element.saneTooltip && element.saneDescription) {
                descriptionTitle = {
                    markdown: {
                        value: element.saneDescription,
                        supportThemeIcons: true
                    },
                    markdownNotSupportedFallback: element.saneDescription
                };
            }
            const options = {
                matches: labelHighlights || [],
                // If we have a tooltip, we want that to be shown and not any other hover
                descriptionTitle,
                descriptionMatches: descriptionHighlights || [],
                labelEscapeNewLines: true
            };
            options.extraClasses = mainItem.iconClasses;
            options.italic = mainItem.italic;
            options.strikethrough = mainItem.strikethrough;
            data.entry.classList.remove('quick-input-list-separator-as-item');
            data.label.setLabel(element.saneLabel, element.saneDescription, options);
            // Keybinding
            data.keybinding.set(mainItem.keybinding);
            // Detail
            if (element.saneDetail) {
                let title;
                // If we have a tooltip, we want that to be shown and not any other hover
                if (!element.saneTooltip) {
                    title = {
                        markdown: {
                            value: element.saneDetail,
                            supportThemeIcons: true
                        },
                        markdownNotSupportedFallback: element.saneDetail
                    };
                }
                data.detail.element.style.display = '';
                data.detail.setLabel(element.saneDetail, undefined, {
                    matches: detailHighlights,
                    title,
                    labelEscapeNewLines: true
                });
            }
            else {
                data.detail.element.style.display = 'none';
            }
            // Separator
            if (element.separator?.label) {
                data.separator.textContent = element.separator.label;
                data.separator.style.display = '';
                this.addItemWithSeparator(element);
            }
            else {
                data.separator.style.display = 'none';
            }
            data.entry.classList.toggle('quick-input-list-separator-border', !!element.separator);
            // Actions
            const buttons = mainItem.buttons;
            if (buttons && buttons.length) {
                data.actionBar.push(buttons.map((button, index) => (0, quickInputUtils_1.quickInputButtonToAction)(button, `id-${index}`, () => element.fireButtonTriggered({ button, item: element.item }))), { icon: true, label: false });
                data.entry.classList.add('has-actions');
            }
            else {
                data.entry.classList.remove('has-actions');
            }
        }
        disposeElement(element, _index, data) {
            this.removeItemWithSeparator(element.element);
            super.disposeElement(element, _index, data);
        }
        isItemWithSeparatorVisible(item) {
            return this._itemsWithSeparatorsFrequency.has(item);
        }
        addItemWithSeparator(item) {
            this._itemsWithSeparatorsFrequency.set(item, (this._itemsWithSeparatorsFrequency.get(item) || 0) + 1);
        }
        removeItemWithSeparator(item) {
            const frequency = this._itemsWithSeparatorsFrequency.get(item) || 0;
            if (frequency > 1) {
                this._itemsWithSeparatorsFrequency.set(item, frequency - 1);
            }
            else {
                this._itemsWithSeparatorsFrequency.delete(item);
            }
        }
    };
    QuickPickItemElementRenderer = QuickPickItemElementRenderer_1 = __decorate([
        __param(1, themeService_1.IThemeService)
    ], QuickPickItemElementRenderer);
    class QuickPickSeparatorElementRenderer extends BaseQuickInputListRenderer {
        constructor() {
            super(...arguments);
            // This is a frequency map because sticky scroll re-uses the same renderer to render a second
            // instance of the same separator.
            this._visibleSeparatorsFrequency = new Map();
        }
        static { this.ID = 'quickpickseparator'; }
        get templateId() {
            return QuickPickSeparatorElementRenderer.ID;
        }
        get visibleSeparators() {
            return [...this._visibleSeparatorsFrequency.keys()];
        }
        isSeparatorVisible(separator) {
            return this._visibleSeparatorsFrequency.has(separator);
        }
        renderElement(node, index, data) {
            const element = node.element;
            data.element = element;
            element.element = data.entry ?? undefined;
            element.element.classList.toggle('focus-inside', !!element.focusInsideSeparator);
            const mainItem = element.separator;
            const { labelHighlights, descriptionHighlights, detailHighlights } = element;
            // Icon
            data.icon.style.backgroundImage = '';
            data.icon.className = '';
            // Label
            let descriptionTitle;
            // if we have a tooltip, that will be the hover,
            // with the saneDescription as fallback if it
            // is defined
            if (!element.saneTooltip && element.saneDescription) {
                descriptionTitle = {
                    markdown: {
                        value: element.saneDescription,
                        supportThemeIcons: true
                    },
                    markdownNotSupportedFallback: element.saneDescription
                };
            }
            const options = {
                matches: labelHighlights || [],
                // If we have a tooltip, we want that to be shown and not any other hover
                descriptionTitle,
                descriptionMatches: descriptionHighlights || [],
                labelEscapeNewLines: true
            };
            data.entry.classList.add('quick-input-list-separator-as-item');
            data.label.setLabel(element.saneLabel, element.saneDescription, options);
            // Detail
            if (element.saneDetail) {
                let title;
                // If we have a tooltip, we want that to be shown and not any other hover
                if (!element.saneTooltip) {
                    title = {
                        markdown: {
                            value: element.saneDetail,
                            supportThemeIcons: true
                        },
                        markdownNotSupportedFallback: element.saneDetail
                    };
                }
                data.detail.element.style.display = '';
                data.detail.setLabel(element.saneDetail, undefined, {
                    matches: detailHighlights,
                    title,
                    labelEscapeNewLines: true
                });
            }
            else {
                data.detail.element.style.display = 'none';
            }
            // Separator
            data.separator.style.display = 'none';
            data.entry.classList.add('quick-input-list-separator-border');
            // Actions
            const buttons = mainItem.buttons;
            if (buttons && buttons.length) {
                data.actionBar.push(buttons.map((button, index) => (0, quickInputUtils_1.quickInputButtonToAction)(button, `id-${index}`, () => element.fireSeparatorButtonTriggered({ button, separator: element.separator }))), { icon: true, label: false });
                data.entry.classList.add('has-actions');
            }
            else {
                data.entry.classList.remove('has-actions');
            }
            this.addSeparator(element);
        }
        disposeElement(element, _index, data) {
            this.removeSeparator(element.element);
            if (!this.isSeparatorVisible(element.element)) {
                element.element.element?.classList.remove('focus-inside');
            }
            super.disposeElement(element, _index, data);
        }
        addSeparator(separator) {
            this._visibleSeparatorsFrequency.set(separator, (this._visibleSeparatorsFrequency.get(separator) || 0) + 1);
        }
        removeSeparator(separator) {
            const frequency = this._visibleSeparatorsFrequency.get(separator) || 0;
            if (frequency > 1) {
                this._visibleSeparatorsFrequency.set(separator, frequency - 1);
            }
            else {
                this._visibleSeparatorsFrequency.delete(separator);
            }
        }
    }
    let QuickInputTree = class QuickInputTree extends lifecycle_1.Disposable {
        constructor(parent, hoverDelegate, linkOpenerDelegate, id, instantiationService) {
            super();
            this.parent = parent;
            this.hoverDelegate = hoverDelegate;
            this.linkOpenerDelegate = linkOpenerDelegate;
            this._onKeyDown = new event_1.Emitter();
            /**
             * Event that is fired when the tree receives a keydown.
            */
            this.onKeyDown = this._onKeyDown.event;
            this._onLeave = new event_1.Emitter();
            /**
             * Event that is fired when the tree would no longer have focus.
            */
            this.onLeave = this._onLeave.event;
            this._onChangedAllVisibleChecked = new event_1.Emitter();
            this.onChangedAllVisibleChecked = this._onChangedAllVisibleChecked.event;
            this._onChangedCheckedCount = new event_1.Emitter();
            this.onChangedCheckedCount = this._onChangedCheckedCount.event;
            this._onChangedVisibleCount = new event_1.Emitter();
            this.onChangedVisibleCount = this._onChangedVisibleCount.event;
            this._onChangedCheckedElements = new event_1.Emitter();
            this.onChangedCheckedElements = this._onChangedCheckedElements.event;
            this._onButtonTriggered = new event_1.Emitter();
            this.onButtonTriggered = this._onButtonTriggered.event;
            this._onSeparatorButtonTriggered = new event_1.Emitter();
            this.onSeparatorButtonTriggered = this._onSeparatorButtonTriggered.event;
            this._onTriggerEmptySelectionOrFocus = new event_1.Emitter();
            this._elementChecked = new event_1.Emitter();
            this._inputElements = new Array();
            this._elementTree = new Array();
            this._itemElements = new Array();
            // Elements that apply to the current set of elements
            this._elementDisposable = this._register(new lifecycle_1.DisposableStore());
            // This is used to prevent setting the checked state of a single element from firing the checked events
            // so that we can batch them together. This can probably be improved by handling events differently,
            // but this works for now. An observable would probably be ideal for this.
            this._shouldFireCheckedEvents = true;
            this._matchOnDescription = false;
            this._matchOnDetail = false;
            this._matchOnLabel = true;
            this._matchOnLabelMode = 'fuzzy';
            this._matchOnMeta = true;
            this._sortByLabel = true;
            this._container = dom.append(this.parent, $('.quick-input-list'));
            this._separatorRenderer = new QuickPickSeparatorElementRenderer(hoverDelegate);
            this._itemRenderer = instantiationService.createInstance(QuickPickItemElementRenderer, hoverDelegate);
            this._tree = this._register(instantiationService.createInstance((listService_1.WorkbenchObjectTree), 'QuickInput', this._container, new QuickInputItemDelegate(), [this._itemRenderer, this._separatorRenderer], {
                accessibilityProvider: new QuickInputAccessibilityProvider(),
                setRowLineHeight: false,
                multipleSelectionSupport: false,
                hideTwistiesOfChildlessElements: true,
                renderIndentGuides: abstractTree_1.RenderIndentGuides.None,
                findWidgetEnabled: false,
                indent: 0,
                horizontalScrolling: false,
                allowNonCollapsibleParents: true,
                identityProvider: {
                    getId: element => {
                        // always prefer item over separator because if item is defined, it must be the main item type
                        // always prefer a defined id if one was specified and use label as a fallback
                        return element.item?.id
                            ?? element.item?.label
                            ?? element.separator?.id
                            ?? element.separator?.label
                            ?? '';
                    },
                },
                alwaysConsumeMouseWheel: true
            }));
            this._tree.getHTMLElement().id = id;
            this._registerListeners();
        }
        //#region public getters/setters
        get onDidChangeFocus() {
            return event_1.Event.map(event_1.Event.any(this._tree.onDidChangeFocus, this._onTriggerEmptySelectionOrFocus.event), e => e.elements.filter((e) => e instanceof QuickPickItemElement).map(e => e.item));
        }
        get onDidChangeSelection() {
            return event_1.Event.map(event_1.Event.any(this._tree.onDidChangeSelection, this._onTriggerEmptySelectionOrFocus.event), e => ({
                items: e.elements.filter((e) => e instanceof QuickPickItemElement).map(e => e.item),
                event: e.browserEvent
            }));
        }
        get scrollTop() {
            return this._tree.scrollTop;
        }
        set scrollTop(scrollTop) {
            this._tree.scrollTop = scrollTop;
        }
        get ariaLabel() {
            return this._tree.ariaLabel;
        }
        set ariaLabel(label) {
            this._tree.ariaLabel = label ?? '';
        }
        set enabled(value) {
            this._tree.getHTMLElement().style.pointerEvents = value ? '' : 'none';
        }
        get matchOnDescription() {
            return this._matchOnDescription;
        }
        set matchOnDescription(value) {
            this._matchOnDescription = value;
        }
        get matchOnDetail() {
            return this._matchOnDetail;
        }
        set matchOnDetail(value) {
            this._matchOnDetail = value;
        }
        get matchOnLabel() {
            return this._matchOnLabel;
        }
        set matchOnLabel(value) {
            this._matchOnLabel = value;
        }
        get matchOnLabelMode() {
            return this._matchOnLabelMode;
        }
        set matchOnLabelMode(value) {
            this._matchOnLabelMode = value;
        }
        get matchOnMeta() {
            return this._matchOnMeta;
        }
        set matchOnMeta(value) {
            this._matchOnMeta = value;
        }
        get sortByLabel() {
            return this._sortByLabel;
        }
        set sortByLabel(value) {
            this._sortByLabel = value;
        }
        //#endregion
        //#region register listeners
        _registerListeners() {
            this._registerOnKeyDown();
            this._registerOnContainerClick();
            this._registerOnMouseMiddleClick();
            this._registerOnElementChecked();
            this._registerOnContextMenu();
            this._registerHoverListeners();
            this._registerSelectionChangeListener();
            this._registerSeparatorActionShowingListeners();
        }
        _registerOnKeyDown() {
            // TODO: Should this be added at a higher level?
            this._register(this._tree.onKeyDown(e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                switch (event.keyCode) {
                    case 10 /* KeyCode.Space */:
                        this.toggleCheckbox();
                        break;
                    case 31 /* KeyCode.KeyA */:
                        if (platform_1.isMacintosh ? e.metaKey : e.ctrlKey) {
                            this._tree.setFocus(this._itemElements);
                        }
                        break;
                    // When we hit the top of the tree, we fire the onLeave event.
                    case 16 /* KeyCode.UpArrow */: {
                        const focus1 = this._tree.getFocus();
                        if (focus1.length === 1 && focus1[0] === this._itemElements[0]) {
                            this._onLeave.fire();
                        }
                        break;
                    }
                    // When we hit the bottom of the tree, we fire the onLeave event.
                    case 18 /* KeyCode.DownArrow */: {
                        const focus2 = this._tree.getFocus();
                        if (focus2.length === 1 && focus2[0] === this._itemElements[this._itemElements.length - 1]) {
                            this._onLeave.fire();
                        }
                        break;
                    }
                }
                this._onKeyDown.fire(event);
            }));
        }
        _registerOnContainerClick() {
            this._register(dom.addDisposableListener(this._container, dom.EventType.CLICK, e => {
                if (e.x || e.y) { // Avoid 'click' triggered by 'space' on checkbox.
                    this._onLeave.fire();
                }
            }));
        }
        _registerOnMouseMiddleClick() {
            this._register(dom.addDisposableListener(this._container, dom.EventType.AUXCLICK, e => {
                if (e.button === 1) {
                    this._onLeave.fire();
                }
            }));
        }
        _registerOnElementChecked() {
            this._register(this._elementChecked.event(_ => this._fireCheckedEvents()));
        }
        _registerOnContextMenu() {
            this._register(this._tree.onContextMenu(e => {
                if (e.element) {
                    e.browserEvent.preventDefault();
                    // we want to treat a context menu event as
                    // a gesture to open the item at the index
                    // since we do not have any context menu
                    // this enables for example macOS to Ctrl-
                    // click on an item to open it.
                    this._tree.setSelection([e.element]);
                }
            }));
        }
        _registerHoverListeners() {
            const delayer = this._register(new async_1.ThrottledDelayer(this.hoverDelegate.delay));
            this._register(this._tree.onMouseOver(async (e) => {
                // If we hover over an anchor element, we don't want to show the hover because
                // the anchor may have a tooltip that we want to show instead.
                if (e.browserEvent.target instanceof HTMLAnchorElement) {
                    delayer.cancel();
                    return;
                }
                if (
                // anchors are an exception as called out above so we skip them here
                !(e.browserEvent.relatedTarget instanceof HTMLAnchorElement) &&
                    // check if the mouse is still over the same element
                    dom.isAncestor(e.browserEvent.relatedTarget, e.element?.element)) {
                    return;
                }
                try {
                    await delayer.trigger(async () => {
                        if (e.element instanceof QuickPickItemElement) {
                            this.showHover(e.element);
                        }
                    });
                }
                catch (e) {
                    // Ignore cancellation errors due to mouse out
                    if (!(0, errors_1.isCancellationError)(e)) {
                        throw e;
                    }
                }
            }));
            this._register(this._tree.onMouseOut(e => {
                // onMouseOut triggers every time a new element has been moused over
                // even if it's on the same list item. We only want one event, so we
                // check if the mouse is still over the same element.
                if (dom.isAncestor(e.browserEvent.relatedTarget, e.element?.element)) {
                    return;
                }
                delayer.cancel();
            }));
        }
        /**
         * Register's focus change and mouse events so that we can track when items inside of a
         * separator's section are focused or hovered so that we can display the separator's actions
         */
        _registerSeparatorActionShowingListeners() {
            this._register(this._tree.onDidChangeFocus(e => {
                const parent = e.elements[0]
                    ? this._tree.getParentElement(e.elements[0])
                    // treat null as focus lost and when we have no separators
                    : null;
                for (const separator of this._separatorRenderer.visibleSeparators) {
                    const value = separator === parent;
                    // get bitness of ACTIVE_ITEM and check if it changed
                    const currentActive = !!(separator.focusInsideSeparator & QuickPickSeparatorFocusReason.ACTIVE_ITEM);
                    if (currentActive !== value) {
                        if (value) {
                            separator.focusInsideSeparator |= QuickPickSeparatorFocusReason.ACTIVE_ITEM;
                        }
                        else {
                            separator.focusInsideSeparator &= ~QuickPickSeparatorFocusReason.ACTIVE_ITEM;
                        }
                        this._tree.rerender(separator);
                    }
                }
            }));
            this._register(this._tree.onMouseOver(e => {
                const parent = e.element
                    ? this._tree.getParentElement(e.element)
                    : null;
                for (const separator of this._separatorRenderer.visibleSeparators) {
                    if (separator !== parent) {
                        continue;
                    }
                    const currentMouse = !!(separator.focusInsideSeparator & QuickPickSeparatorFocusReason.MOUSE_HOVER);
                    if (!currentMouse) {
                        separator.focusInsideSeparator |= QuickPickSeparatorFocusReason.MOUSE_HOVER;
                        this._tree.rerender(separator);
                    }
                }
            }));
            this._register(this._tree.onMouseOut(e => {
                const parent = e.element
                    ? this._tree.getParentElement(e.element)
                    : null;
                for (const separator of this._separatorRenderer.visibleSeparators) {
                    if (separator !== parent) {
                        continue;
                    }
                    const currentMouse = !!(separator.focusInsideSeparator & QuickPickSeparatorFocusReason.MOUSE_HOVER);
                    if (currentMouse) {
                        separator.focusInsideSeparator &= ~QuickPickSeparatorFocusReason.MOUSE_HOVER;
                        this._tree.rerender(separator);
                    }
                }
            }));
        }
        _registerSelectionChangeListener() {
            // When the user selects a separator, the separator will move to the top and focus will be
            // set to the first element after the separator.
            this._register(this._tree.onDidChangeSelection(e => {
                const elementsWithoutSeparators = e.elements.filter((e) => e instanceof QuickPickItemElement);
                if (elementsWithoutSeparators.length !== e.elements.length) {
                    if (e.elements.length === 1 && e.elements[0] instanceof QuickPickSeparatorElement) {
                        this._tree.setFocus([e.elements[0].children[0]]);
                        this._tree.reveal(e.elements[0], 0);
                    }
                    this._tree.setSelection(elementsWithoutSeparators);
                }
            }));
        }
        //#endregion
        //#region public methods
        getAllVisibleChecked() {
            return this._allVisibleChecked(this._itemElements, false);
        }
        getCheckedCount() {
            return this._itemElements.filter(element => element.checked).length;
        }
        getVisibleCount() {
            return this._itemElements.filter(e => !e.hidden).length;
        }
        setAllVisibleChecked(checked) {
            try {
                this._shouldFireCheckedEvents = false;
                this._itemElements.forEach(element => {
                    if (!element.hidden && !element.checkboxDisabled) {
                        // Would fire an event if we didn't have the flag set
                        element.checked = checked;
                    }
                });
            }
            finally {
                this._shouldFireCheckedEvents = true;
                this._fireCheckedEvents();
            }
        }
        setElements(inputElements) {
            this._elementDisposable.clear();
            this._inputElements = inputElements;
            const hasCheckbox = this.parent.classList.contains('show-checkboxes');
            let currentSeparatorElement;
            this._itemElements = new Array();
            this._elementTree = inputElements.reduce((result, item, index) => {
                let element;
                if (item.type === 'separator') {
                    if (!item.buttons) {
                        // This separator will be rendered as a part of the list item
                        return result;
                    }
                    currentSeparatorElement = new QuickPickSeparatorElement(index, (event) => this.fireSeparatorButtonTriggered(event), item);
                    element = currentSeparatorElement;
                }
                else {
                    const previous = index > 0 ? inputElements[index - 1] : undefined;
                    let separator;
                    if (previous && previous.type === 'separator' && !previous.buttons) {
                        // Found an inline separator so we clear out the current separator element
                        currentSeparatorElement = undefined;
                        separator = previous;
                    }
                    const qpi = new QuickPickItemElement(index, hasCheckbox, (event) => this.fireButtonTriggered(event), this._elementChecked, item, separator);
                    this._itemElements.push(qpi);
                    if (currentSeparatorElement) {
                        currentSeparatorElement.children.push(qpi);
                        return result;
                    }
                    element = qpi;
                }
                result.push(element);
                return result;
            }, new Array());
            const elements = new Array();
            let visibleCount = 0;
            for (const element of this._elementTree) {
                if (element instanceof QuickPickSeparatorElement) {
                    elements.push({
                        element,
                        collapsible: false,
                        collapsed: false,
                        children: element.children.map(e => ({
                            element: e,
                            collapsible: false,
                            collapsed: false,
                        })),
                    });
                    visibleCount += element.children.length + 1; // +1 for the separator itself;
                }
                else {
                    elements.push({
                        element,
                        collapsible: false,
                        collapsed: false,
                    });
                    visibleCount++;
                }
            }
            this._tree.setChildren(null, elements);
            this._onChangedVisibleCount.fire(visibleCount);
        }
        getElementsCount() {
            return this._inputElements.length;
        }
        getFocusedElements() {
            return this._tree.getFocus()
                .filter((e) => !!e)
                .map(e => e.item)
                .filter((e) => !!e);
        }
        setFocusedElements(items) {
            const elements = items.map(item => this._itemElements.find(e => e.item === item))
                .filter((e) => !!e);
            this._tree.setFocus(elements);
            if (items.length > 0) {
                const focused = this._tree.getFocus()[0];
                if (focused) {
                    this._tree.reveal(focused);
                }
            }
        }
        getActiveDescendant() {
            return this._tree.getHTMLElement().getAttribute('aria-activedescendant');
        }
        getSelectedElements() {
            return this._tree.getSelection()
                .filter((e) => !!e && !!e.item)
                .map(e => e.item);
        }
        setSelectedElements(items) {
            const elements = items.map(item => this._itemElements.find(e => e.item === item))
                .filter((e) => !!e);
            this._tree.setSelection(elements);
        }
        getCheckedElements() {
            return this._itemElements.filter(e => e.checked)
                .map(e => e.item);
        }
        setCheckedElements(items) {
            try {
                this._shouldFireCheckedEvents = false;
                const checked = new Set();
                for (const item of items) {
                    checked.add(item);
                }
                for (const element of this._itemElements) {
                    // Would fire an event if we didn't have the flag set
                    element.checked = checked.has(element.item);
                }
            }
            finally {
                this._shouldFireCheckedEvents = true;
                this._fireCheckedEvents();
            }
        }
        focus(what) {
            if (!this._itemElements.length) {
                return;
            }
            if (what === QuickInputListFocus.Second && this._itemElements.length < 2) {
                what = QuickInputListFocus.First;
            }
            switch (what) {
                case QuickInputListFocus.First:
                    this._tree.scrollTop = 0;
                    this._tree.focusFirst(undefined, (e) => e.element instanceof QuickPickItemElement);
                    break;
                case QuickInputListFocus.Second:
                    this._tree.scrollTop = 0;
                    this._tree.setFocus([this._itemElements[1]]);
                    break;
                case QuickInputListFocus.Last:
                    this._tree.scrollTop = this._tree.scrollHeight;
                    this._tree.setFocus([this._itemElements[this._itemElements.length - 1]]);
                    break;
                case QuickInputListFocus.Next:
                    this._tree.focusNext(undefined, true, undefined, (e) => {
                        if (!(e.element instanceof QuickPickItemElement)) {
                            return false;
                        }
                        this._tree.reveal(e.element);
                        return true;
                    });
                    break;
                case QuickInputListFocus.Previous:
                    this._tree.focusPrevious(undefined, true, undefined, (e) => {
                        if (!(e.element instanceof QuickPickItemElement)) {
                            return false;
                        }
                        const parent = this._tree.getParentElement(e.element);
                        if (parent === null || parent.children[0] !== e.element) {
                            this._tree.reveal(e.element);
                        }
                        else {
                            // Only if we are the first child of a separator do we reveal the separator
                            this._tree.reveal(parent);
                        }
                        return true;
                    });
                    break;
                case QuickInputListFocus.NextPage:
                    this._tree.focusNextPage(undefined, (e) => {
                        if (!(e.element instanceof QuickPickItemElement)) {
                            return false;
                        }
                        this._tree.reveal(e.element);
                        return true;
                    });
                    break;
                case QuickInputListFocus.PreviousPage:
                    this._tree.focusPreviousPage(undefined, (e) => {
                        if (!(e.element instanceof QuickPickItemElement)) {
                            return false;
                        }
                        const parent = this._tree.getParentElement(e.element);
                        if (parent === null || parent.children[0] !== e.element) {
                            this._tree.reveal(e.element);
                        }
                        else {
                            this._tree.reveal(parent);
                        }
                        return true;
                    });
                    break;
                case QuickInputListFocus.NextSeparator: {
                    let foundSeparatorAsItem = false;
                    const before = this._tree.getFocus()[0];
                    this._tree.focusNext(undefined, true, undefined, (e) => {
                        if (foundSeparatorAsItem) {
                            // This should be the index right after the separator so it
                            // is the item we want to focus.
                            return true;
                        }
                        if (e.element instanceof QuickPickSeparatorElement) {
                            foundSeparatorAsItem = true;
                            // If the separator is visible, then we should just reveal its first child so it's not as jarring.
                            if (this._separatorRenderer.isSeparatorVisible(e.element)) {
                                this._tree.reveal(e.element.children[0]);
                            }
                            else {
                                // If the separator is not visible, then we should
                                // push it up to the top of the list.
                                this._tree.reveal(e.element, 0);
                            }
                        }
                        else if (e.element instanceof QuickPickItemElement) {
                            if (e.element.separator) {
                                if (this._itemRenderer.isItemWithSeparatorVisible(e.element)) {
                                    this._tree.reveal(e.element);
                                }
                                else {
                                    this._tree.reveal(e.element, 0);
                                }
                                return true;
                            }
                            else if (e.element === this._elementTree[0]) {
                                // We should stop at the first item in the list if it's a regular item.
                                this._tree.reveal(e.element, 0);
                                return true;
                            }
                        }
                        return false;
                    });
                    const after = this._tree.getFocus()[0];
                    if (before === after) {
                        // If we didn't move, then we should just move to the end
                        // of the list.
                        this._tree.scrollTop = this._tree.scrollHeight;
                        this._tree.setFocus([this._itemElements[this._itemElements.length - 1]]);
                    }
                    break;
                }
                case QuickInputListFocus.PreviousSeparator: {
                    let focusElement;
                    // If we are already sitting on an inline separator, then we
                    // have already found the _current_ separator and need to
                    // move to the previous one.
                    let foundSeparator = !!this._tree.getFocus()[0]?.separator;
                    this._tree.focusPrevious(undefined, true, undefined, (e) => {
                        if (e.element instanceof QuickPickSeparatorElement) {
                            if (foundSeparator) {
                                if (!focusElement) {
                                    if (this._separatorRenderer.isSeparatorVisible(e.element)) {
                                        this._tree.reveal(e.element);
                                    }
                                    else {
                                        this._tree.reveal(e.element, 0);
                                    }
                                    focusElement = e.element.children[0];
                                }
                            }
                            else {
                                foundSeparator = true;
                            }
                        }
                        else if (e.element instanceof QuickPickItemElement) {
                            if (!focusElement) {
                                if (e.element.separator) {
                                    if (this._itemRenderer.isItemWithSeparatorVisible(e.element)) {
                                        this._tree.reveal(e.element);
                                    }
                                    else {
                                        this._tree.reveal(e.element, 0);
                                    }
                                    focusElement = e.element;
                                }
                                else if (e.element === this._elementTree[0]) {
                                    // We should stop at the first item in the list if it's a regular item.
                                    this._tree.reveal(e.element, 0);
                                    return true;
                                }
                            }
                        }
                        return false;
                    });
                    if (focusElement) {
                        this._tree.setFocus([focusElement]);
                    }
                    break;
                }
            }
        }
        clearFocus() {
            this._tree.setFocus([]);
        }
        domFocus() {
            this._tree.domFocus();
        }
        layout(maxHeight) {
            this._tree.getHTMLElement().style.maxHeight = maxHeight ? `${
            // Make sure height aligns with list item heights
            Math.floor(maxHeight / 44) * 44
                // Add some extra height so that it's clear there's more to scroll
                + 6}px` : '';
            this._tree.layout();
        }
        filter(query) {
            if (!(this._sortByLabel || this._matchOnLabel || this._matchOnDescription || this._matchOnDetail)) {
                this._tree.layout();
                return false;
            }
            const queryWithWhitespace = query;
            query = query.trim();
            // Reset filtering
            if (!query || !(this.matchOnLabel || this.matchOnDescription || this.matchOnDetail)) {
                this._itemElements.forEach(element => {
                    element.labelHighlights = undefined;
                    element.descriptionHighlights = undefined;
                    element.detailHighlights = undefined;
                    element.hidden = false;
                    const previous = element.index && this._inputElements[element.index - 1];
                    if (element.item) {
                        element.separator = previous && previous.type === 'separator' && !previous.buttons ? previous : undefined;
                    }
                });
            }
            // Filter by value (since we support icons in labels, use $(..) aware fuzzy matching)
            else {
                let currentSeparator;
                this._elementTree.forEach(element => {
                    let labelHighlights;
                    if (this.matchOnLabelMode === 'fuzzy') {
                        labelHighlights = this.matchOnLabel ? (0, iconLabels_1.matchesFuzzyIconAware)(query, (0, iconLabels_1.parseLabelWithIcons)(element.saneLabel)) ?? undefined : undefined;
                    }
                    else {
                        labelHighlights = this.matchOnLabel ? matchesContiguousIconAware(queryWithWhitespace, (0, iconLabels_1.parseLabelWithIcons)(element.saneLabel)) ?? undefined : undefined;
                    }
                    const descriptionHighlights = this.matchOnDescription ? (0, iconLabels_1.matchesFuzzyIconAware)(query, (0, iconLabels_1.parseLabelWithIcons)(element.saneDescription || '')) ?? undefined : undefined;
                    const detailHighlights = this.matchOnDetail ? (0, iconLabels_1.matchesFuzzyIconAware)(query, (0, iconLabels_1.parseLabelWithIcons)(element.saneDetail || '')) ?? undefined : undefined;
                    if (labelHighlights || descriptionHighlights || detailHighlights) {
                        element.labelHighlights = labelHighlights;
                        element.descriptionHighlights = descriptionHighlights;
                        element.detailHighlights = detailHighlights;
                        element.hidden = false;
                    }
                    else {
                        element.labelHighlights = undefined;
                        element.descriptionHighlights = undefined;
                        element.detailHighlights = undefined;
                        element.hidden = element.item ? !element.item.alwaysShow : true;
                    }
                    // Ensure separators are filtered out first before deciding if we need to bring them back
                    if (element.item) {
                        element.separator = undefined;
                    }
                    else if (element.separator) {
                        element.hidden = true;
                    }
                    // we can show the separator unless the list gets sorted by match
                    if (!this.sortByLabel) {
                        const previous = element.index && this._inputElements[element.index - 1];
                        currentSeparator = previous && previous.type === 'separator' ? previous : currentSeparator;
                        if (currentSeparator && !element.hidden) {
                            element.separator = currentSeparator;
                            currentSeparator = undefined;
                        }
                    }
                });
            }
            const shownElements = this._elementTree.filter(element => !element.hidden);
            // Sort by value
            if (this.sortByLabel && query) {
                const normalizedSearchValue = query.toLowerCase();
                shownElements.sort((a, b) => {
                    return compareEntries(a, b, normalizedSearchValue);
                });
            }
            let currentSeparator;
            const finalElements = shownElements.reduce((result, element, index) => {
                if (element instanceof QuickPickItemElement) {
                    if (currentSeparator) {
                        currentSeparator.children.push(element);
                    }
                    else {
                        result.push(element);
                    }
                }
                else if (element instanceof QuickPickSeparatorElement) {
                    element.children = [];
                    currentSeparator = element;
                    result.push(element);
                }
                return result;
            }, new Array());
            const elements = new Array();
            for (const element of finalElements) {
                if (element instanceof QuickPickSeparatorElement) {
                    elements.push({
                        element,
                        collapsible: false,
                        collapsed: false,
                        children: element.children.map(e => ({
                            element: e,
                            collapsible: false,
                            collapsed: false,
                        })),
                    });
                }
                else {
                    elements.push({
                        element,
                        collapsible: false,
                        collapsed: false,
                    });
                }
            }
            const before = this._tree.getFocus().length;
            this._tree.setChildren(null, elements);
            // Temporary fix until we figure out why the tree doesn't fire an event when focus & selection
            // get changed to empty arrays.
            if (before > 0 && elements.length === 0) {
                this._onTriggerEmptySelectionOrFocus.fire({
                    elements: []
                });
            }
            this._tree.layout();
            this._onChangedAllVisibleChecked.fire(this.getAllVisibleChecked());
            this._onChangedVisibleCount.fire(shownElements.length);
            return true;
        }
        toggleCheckbox() {
            try {
                this._shouldFireCheckedEvents = false;
                const elements = this._tree.getFocus().filter((e) => e instanceof QuickPickItemElement);
                const allChecked = this._allVisibleChecked(elements);
                for (const element of elements) {
                    if (!element.checkboxDisabled) {
                        // Would fire an event if we didn't have the flag set
                        element.checked = !allChecked;
                    }
                }
            }
            finally {
                this._shouldFireCheckedEvents = true;
                this._fireCheckedEvents();
            }
        }
        display(display) {
            this._container.style.display = display ? '' : 'none';
        }
        isDisplayed() {
            return this._container.style.display !== 'none';
        }
        style(styles) {
            this._tree.style(styles);
        }
        toggleHover() {
            const focused = this._tree.getFocus()[0];
            if (!focused?.saneTooltip || !(focused instanceof QuickPickItemElement)) {
                return;
            }
            // if there's a hover already, hide it (toggle off)
            if (this._lastHover && !this._lastHover.isDisposed) {
                this._lastHover.dispose();
                return;
            }
            // If there is no hover, show it (toggle on)
            this.showHover(focused);
            const store = new lifecycle_1.DisposableStore();
            store.add(this._tree.onDidChangeFocus(e => {
                if (e.elements[0] instanceof QuickPickItemElement) {
                    this.showHover(e.elements[0]);
                }
            }));
            if (this._lastHover) {
                store.add(this._lastHover);
            }
            this._elementDisposable.add(store);
        }
        //#endregion
        //#region private methods
        _allVisibleChecked(elements, whenNoneVisible = true) {
            for (let i = 0, n = elements.length; i < n; i++) {
                const element = elements[i];
                if (!element.hidden) {
                    if (!element.checked) {
                        return false;
                    }
                    else {
                        whenNoneVisible = true;
                    }
                }
            }
            return whenNoneVisible;
        }
        _fireCheckedEvents() {
            if (!this._shouldFireCheckedEvents) {
                return;
            }
            this._onChangedAllVisibleChecked.fire(this.getAllVisibleChecked());
            this._onChangedCheckedCount.fire(this.getCheckedCount());
            this._onChangedCheckedElements.fire(this.getCheckedElements());
        }
        fireButtonTriggered(event) {
            this._onButtonTriggered.fire(event);
        }
        fireSeparatorButtonTriggered(event) {
            this._onSeparatorButtonTriggered.fire(event);
        }
        /**
         * Disposes of the hover and shows a new one for the given index if it has a tooltip.
         * @param element The element to show the hover for
         */
        showHover(element) {
            if (this._lastHover && !this._lastHover.isDisposed) {
                this.hoverDelegate.onDidHideHover?.();
                this._lastHover?.dispose();
            }
            if (!element.element || !element.saneTooltip) {
                return;
            }
            this._lastHover = this.hoverDelegate.showHover({
                content: element.saneTooltip,
                target: element.element,
                linkHandler: (url) => {
                    this.linkOpenerDelegate(url);
                },
                appearance: {
                    showPointer: true,
                },
                container: this._container,
                position: {
                    hoverPosition: 1 /* HoverPosition.RIGHT */
                }
            }, false);
        }
    };
    exports.QuickInputTree = QuickInputTree;
    __decorate([
        decorators_1.memoize
    ], QuickInputTree.prototype, "onDidChangeFocus", null);
    __decorate([
        decorators_1.memoize
    ], QuickInputTree.prototype, "onDidChangeSelection", null);
    exports.QuickInputTree = QuickInputTree = __decorate([
        __param(4, instantiation_1.IInstantiationService)
    ], QuickInputTree);
    function matchesContiguousIconAware(query, target) {
        const { text, iconOffsets } = target;
        // Return early if there are no icon markers in the word to match against
        if (!iconOffsets || iconOffsets.length === 0) {
            return matchesContiguous(query, text);
        }
        // Trim the word to match against because it could have leading
        // whitespace now if the word started with an icon
        const wordToMatchAgainstWithoutIconsTrimmed = (0, strings_1.ltrim)(text, ' ');
        const leadingWhitespaceOffset = text.length - wordToMatchAgainstWithoutIconsTrimmed.length;
        // match on value without icon
        const matches = matchesContiguous(query, wordToMatchAgainstWithoutIconsTrimmed);
        // Map matches back to offsets with icon and trimming
        if (matches) {
            for (const match of matches) {
                const iconOffset = iconOffsets[match.start + leadingWhitespaceOffset] /* icon offsets at index */ + leadingWhitespaceOffset /* overall leading whitespace offset */;
                match.start += iconOffset;
                match.end += iconOffset;
            }
        }
        return matches;
    }
    function matchesContiguous(word, wordToMatchAgainst) {
        const matchIndex = wordToMatchAgainst.toLowerCase().indexOf(word.toLowerCase());
        if (matchIndex !== -1) {
            return [{ start: matchIndex, end: matchIndex + word.length }];
        }
        return null;
    }
    function compareEntries(elementA, elementB, lookFor) {
        const labelHighlightsA = elementA.labelHighlights || [];
        const labelHighlightsB = elementB.labelHighlights || [];
        if (labelHighlightsA.length && !labelHighlightsB.length) {
            return -1;
        }
        if (!labelHighlightsA.length && labelHighlightsB.length) {
            return 1;
        }
        if (labelHighlightsA.length === 0 && labelHighlightsB.length === 0) {
            return 0;
        }
        return (0, comparers_1.compareAnything)(elementA.saneSortLabel, elementB.saneSortLabel, lookFor);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tJbnB1dFRyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3F1aWNraW5wdXQvYnJvd3Nlci9xdWlja0lucHV0VHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBcUNoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhCLElBQVksbUJBVVg7SUFWRCxXQUFZLG1CQUFtQjtRQUM5QiwrREFBUyxDQUFBO1FBQ1QsaUVBQU0sQ0FBQTtRQUNOLDZEQUFJLENBQUE7UUFDSiw2REFBSSxDQUFBO1FBQ0oscUVBQVEsQ0FBQTtRQUNSLHFFQUFRLENBQUE7UUFDUiw2RUFBWSxDQUFBO1FBQ1osK0VBQWEsQ0FBQTtRQUNiLHVGQUFpQixDQUFBO0lBQ2xCLENBQUMsRUFWVyxtQkFBbUIsbUNBQW5CLG1CQUFtQixRQVU5QjtJQXFDRCxNQUFNLHdCQUF3QjtRQUc3QixZQUNVLEtBQWEsRUFDYixXQUFvQixFQUM3QixRQUF1QjtZQUZkLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYixnQkFBVyxHQUFYLFdBQVcsQ0FBUztZQThDdEIsWUFBTyxHQUFHLEtBQUssQ0FBQztZQTNDdkIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFdBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzFCLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN2QyxNQUFNLGFBQWEsR0FBRyxJQUFBLGdDQUFtQixFQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFFakUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxVQUFV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