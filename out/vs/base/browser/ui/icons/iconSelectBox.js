/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/nls", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/css!./iconSelectBox"], function (require, exports, dom, aria_1, inputBox_1, scrollableElement_1, event_1, lifecycle_1, themables_1, nls_1, highlightedLabel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IconSelectBox = void 0;
    class IconSelectBox extends lifecycle_1.Disposable {
        static { this.InstanceCount = 0; }
        constructor(options) {
            super();
            this.options = options;
            this.domId = `icon_select_box_id_${++IconSelectBox.InstanceCount}`;
            this._onDidSelect = this._register(new event_1.Emitter());
            this.onDidSelect = this._onDidSelect.event;
            this.renderedIcons = [];
            this.focusedItemIndex = 0;
            this.numberOfElementsPerRow = 1;
            this.iconContainerWidth = 36;
            this.iconContainerHeight = 36;
            this.domNode = dom.$('.icon-select-box');
            this._register(this.create());
        }
        create() {
            const disposables = new lifecycle_1.DisposableStore();
            const iconSelectBoxContainer = dom.append(this.domNode, dom.$('.icon-select-box-container'));
            iconSelectBoxContainer.style.margin = '10px 15px';
            const iconSelectInputContainer = dom.append(iconSelectBoxContainer, dom.$('.icon-select-input-container'));
            iconSelectInputContainer.style.paddingBottom = '10px';
            this.inputBox = disposables.add(new inputBox_1.InputBox(iconSelectInputContainer, undefined, {
                placeholder: (0, nls_1.localize)('iconSelect.placeholder', "Search icons"),
                inputBoxStyles: this.options.inputBoxStyles,
            }));
            const iconsContainer = this.iconsContainer = dom.$('.icon-select-icons-container', { id: `${this.domId}_icons` });
            iconsContainer.role = 'listbox';
            iconsContainer.tabIndex = 0;
            this.scrollableElement = disposables.add(new scrollableElement_1.DomScrollableElement(iconsContainer, {
                useShadows: false,
                horizontal: 2 /* ScrollbarVisibility.Hidden */,
            }));
            dom.append(iconSelectBoxContainer, this.scrollableElement.getDomNode());
            if (this.options.showIconInfo) {
                this.iconIdElement = this._register(new highlightedLabel_1.HighlightedLabel(dom.append(dom.append(iconSelectBoxContainer, dom.$('.icon-select-id-container')), dom.$('.icon-select-id-label'))));
            }
            const iconsDisposables = disposables.add(new lifecycle_1.MutableDisposable());
            iconsDisposables.value = this.renderIcons(this.options.icons, [], iconsContainer);
            this.scrollableElement.scanDomNode();
            disposables.add(this.inputBox.onDidChange(value => {
                const icons = [], matches = [];
                for (const icon of this.options.icons) {
                    const match = this.matchesContiguous(value, icon.id);
                    if (match) {
                        icons.push(icon);
                        matches.push(match);
                    }
                }
                if (icons.length) {
                    iconsDisposables.value = this.renderIcons(icons, matches, iconsContainer);
                    this.scrollableElement?.scanDomNode();
                }
            }));
            this.inputBox.inputElement.role = 'combobox';
            this.inputBox.inputElement.ariaHasPopup = 'menu';
            this.inputBox.inputElement.ariaAutoComplete = 'list';
            this.inputBox.inputElement.ariaExpanded = 'true';
            this.inputBox.inputElement.setAttribute('aria-controls', iconsContainer.id);
            return disposables;
        }
        renderIcons(icons, matches, container) {
            const disposables = new lifecycle_1.DisposableStore();
            dom.clearNode(container);
            const focusedIcon = this.renderedIcons[this.focusedItemIndex]?.icon;
            let focusedIconIndex = 0;
            const renderedIcons = [];
            if (icons.length) {
                for (let index = 0; index < icons.length; index++) {
                    const icon = icons[index];
                    const iconContainer = dom.append(container, dom.$('.icon-container', { id: `${this.domId}_icons_${index}` }));
                    iconContainer.style.width = `${this.iconContainerWidth}px`;
                    iconContainer.style.height = `${this.iconContainerHeight}px`;
                    iconContainer.title = icon.id;
                    iconContainer.role = 'button';
                    iconContainer.setAttribute('aria-setsize', `${icons.length}`);
                    iconContainer.setAttribute('aria-posinset', `${index + 1}`);
                    dom.append(iconContainer, dom.$(themables_1.ThemeIcon.asCSSSelector(icon)));
                    renderedIcons.push({ icon, element: iconContainer, highlightMatches: matches[index] });
                    disposables.add(dom.addDisposableListener(iconContainer, dom.EventType.CLICK, (e) => {
                        e.stopPropagation();
                        this.setSelection(index);
                    }));
                    if (icon === focusedIcon) {
                        focusedIconIndex = index;
                    }
                }
            }
            else {
                const noResults = (0, nls_1.localize)('iconSelect.noResults', "No results");
                dom.append(container, dom.$('.icon-no-results', undefined, noResults));
                (0, aria_1.alert)(noResults);
            }
            this.renderedIcons.splice(0, this.renderedIcons.length, ...renderedIcons);
            this.focusIcon(focusedIconIndex);
            return disposables;
        }
        focusIcon(index) {
            const existing = this.renderedIcons[this.focusedItemIndex];
            if (existing) {
                existing.element.classList.remove('focused');
            }
            this.focusedItemIndex = index;
            const renderedItem = this.renderedIcons[index];
            if (renderedItem) {
                renderedItem.element.classList.add('focused');
            }
            if (this.inputBox) {
                if (renderedItem) {
                    this.inputBox.inputElement.setAttribute('aria-activedescendant', renderedItem.element.id);
                }
                else {
                    this.inputBox.inputElement.removeAttribute('aria-activedescendant');
                }
            }
            if (this.iconIdElement) {
                if (renderedItem) {
                    this.iconIdElement.set(renderedItem.icon.id, renderedItem.highlightMatches);
                }
                else {
                    this.iconIdElement.set('');
                }
            }
            this.reveal(index);
        }
        reveal(index) {
            if (!this.scrollableElement) {
                return;
            }
            if (index < 0 || index >= this.renderedIcons.length) {
                return;
            }
            const element = this.renderedIcons[index].element;
            if (!element) {
                return;
            }
            const { height } = this.scrollableElement.getScrollDimensions();
            const { scrollTop } = this.scrollableElement.getScrollPosition();
            if (element.offsetTop + this.iconContainerHeight > scrollTop + height) {
                this.scrollableElement.setScrollPosition({ scrollTop: element.offsetTop + this.iconContainerHeight - height });
            }
            else if (element.offsetTop < scrollTop) {
                this.scrollableElement.setScrollPosition({ scrollTop: element.offsetTop });
            }
        }
        matchesContiguous(word, wordToMatchAgainst) {
            const matchIndex = wordToMatchAgainst.toLowerCase().indexOf(word.toLowerCase());
            if (matchIndex !== -1) {
                return [{ start: matchIndex, end: matchIndex + word.length }];
            }
            return null;
        }
        layout(dimension) {
            this.domNode.style.width = `${dimension.width}px`;
            this.domNode.style.height = `${dimension.height}px`;
            const iconsContainerWidth = dimension.width - 30;
            this.numberOfElementsPerRow = Math.floor(iconsContainerWidth / this.iconContainerWidth);
            if (this.numberOfElementsPerRow === 0) {
                throw new Error('Insufficient width');
            }
            const extraSpace = iconsContainerWidth % this.iconContainerWidth;
            const iconElementMargin = Math.floor(extraSpace / this.numberOfElementsPerRow);
            for (const { element } of this.renderedIcons) {
                element.style.marginRight = `${iconElementMargin}px`;
            }
            const containerPadding = extraSpace % this.numberOfElementsPerRow;
            if (this.iconsContainer) {
                this.iconsContainer.style.paddingLeft = `${Math.floor(containerPadding / 2)}px`;
                this.iconsContainer.style.paddingRight = `${Math.ceil(containerPadding / 2)}px`;
            }
            if (this.scrollableElement) {
                this.scrollableElement.getDomNode().style.height = `${this.iconIdElement ? dimension.height - 80 : dimension.height - 40}px`;
                this.scrollableElement.scanDomNode();
            }
        }
        getFocus() {
            return [this.focusedItemIndex];
        }
        setSelection(index) {
            if (index < 0 || index >= this.renderedIcons.length) {
                throw new Error(`Invalid index ${index}`);
            }
            this.focusIcon(index);
            this._onDidSelect.fire(this.renderedIcons[index].icon);
        }
        clearInput() {
            if (this.inputBox) {
                this.inputBox.value = '';
            }
        }
        focus() {
            this.inputBox?.focus();
            this.focusIcon(0);
        }
        focusNext() {
            this.focusIcon((this.focusedItemIndex + 1) % this.renderedIcons.length);
        }
        focusPrevious() {
            this.focusIcon((this.focusedItemIndex - 1 + this.renderedIcons.length) % this.renderedIcons.length);
        }
        focusNextRow() {
            let nextRowIndex = this.focusedItemIndex + this.numberOfElementsPerRow;
            if (nextRowIndex >= this.renderedIcons.length) {
                nextRowIndex = (nextRowIndex + 1) % this.numberOfElementsPerRow;
                nextRowIndex = nextRowIndex >= this.renderedIcons.length ? 0 : nextRowIndex;
            }
            this.focusIcon(nextRowIndex);
        }
        focusPreviousRow() {
            let previousRowIndex = this.focusedItemIndex - this.numberOfElementsPerRow;
            if (previousRowIndex < 0) {
                const numberOfRows = Math.floor(this.renderedIcons.length / this.numberOfElementsPerRow);
                previousRowIndex = this.focusedItemIndex + (this.numberOfElementsPerRow * numberOfRows) - 1;
                previousRowIndex = previousRowIndex < 0
                    ? this.renderedIcons.length - 1
                    : previousRowIndex >= this.renderedIcons.length
                        ? previousRowIndex - this.numberOfElementsPerRow
                        : previousRowIndex;
            }
            this.focusIcon(previousRowIndex);
        }
        getFocusedIcon() {
            return this.renderedIcons[this.focusedItemIndex].icon;
        }
    }
    exports.IconSelectBox = IconSelectBox;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvblNlbGVjdEJveC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL2ljb25zL2ljb25TZWxlY3RCb3gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkJoRyxNQUFhLGFBQWMsU0FBUSxzQkFBVTtpQkFFN0Isa0JBQWEsR0FBRyxDQUFDLEFBQUosQ0FBSztRQW9CakMsWUFDa0IsT0FBOEI7WUFFL0MsS0FBSyxFQUFFLENBQUM7WUFGUyxZQUFPLEdBQVAsT0FBTyxDQUF1QjtZQXBCdkMsVUFBSyxHQUFHLHNCQUFzQixFQUFFLGFBQWEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUkvRCxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWEsQ0FBQyxDQUFDO1lBQ3ZELGdCQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFdkMsa0JBQWEsR0FBd0IsRUFBRSxDQUFDO1lBRXhDLHFCQUFnQixHQUFXLENBQUMsQ0FBQztZQUM3QiwyQkFBc0IsR0FBVyxDQUFDLENBQUM7WUFNMUIsdUJBQWtCLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLHdCQUFtQixHQUFHLEVBQUUsQ0FBQztZQU16QyxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFTyxNQUFNO1lBQ2IsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMsTUFBTSxzQkFBc0IsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FB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