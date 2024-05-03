/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/range", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./iconlabel"], function (require, exports, dom, highlightedLabel_1, updatableHoverWidget_1, lifecycle_1, objects_1, range_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IconLabel = void 0;
    class FastLabelNode {
        constructor(_element) {
            this._element = _element;
        }
        get element() {
            return this._element;
        }
        set textContent(content) {
            if (this.disposed || content === this._textContent) {
                return;
            }
            this._textContent = content;
            this._element.textContent = content;
        }
        set className(className) {
            if (this.disposed || className === this._className) {
                return;
            }
            this._className = className;
            this._element.className = className;
        }
        set empty(empty) {
            if (this.disposed || empty === this._empty) {
                return;
            }
            this._empty = empty;
            this._element.style.marginLeft = empty ? '0' : '';
        }
        dispose() {
            this.disposed = true;
        }
    }
    class IconLabel extends lifecycle_1.Disposable {
        constructor(container, options) {
            super();
            this.customHovers = new Map();
            this.creationOptions = options;
            this.domNode = this._register(new FastLabelNode(dom.append(container, dom.$('.monaco-icon-label'))));
            this.labelContainer = dom.append(this.domNode.element, dom.$('.monaco-icon-label-container'));
            this.nameContainer = dom.append(this.labelContainer, dom.$('span.monaco-icon-name-container'));
            if (options?.supportHighlights || options?.supportIcons) {
                this.nameNode = this._register(new LabelWithHighlights(this.nameContainer, !!options.supportIcons));
            }
            else {
                this.nameNode = new Label(this.nameContainer);
            }
            this.hoverDelegate = options?.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse');
        }
        get element() {
            return this.domNode.element;
        }
        setLabel(label, description, options) {
            const labelClasses = ['monaco-icon-label'];
            const containerClasses = ['monaco-icon-label-container'];
            let ariaLabel = '';
            if (options) {
                if (options.extraClasses) {
                    labelClasses.push(...options.extraClasses);
                }
                if (options.italic) {
                    labelClasses.push('italic');
                }
                if (options.strikethrough) {
                    labelClasses.push('strikethrough');
                }
                if (options.disabledCommand) {
                    containerClasses.push('disabled');
                }
                if (options.title) {
                    if (typeof options.title === 'string') {
                        ariaLabel += options.title;
                    }
                    else {
                        ariaLabel += label;
                    }
                }
            }
            this.domNode.className = labelClasses.join(' ');
            this.domNode.element.setAttribute('aria-label', ariaLabel);
            this.labelContainer.className = containerClasses.join(' ');
            this.setupHover(options?.descriptionTitle ? this.labelContainer : this.element, options?.title);
            this.nameNode.setLabel(label, options);
            if (description || this.descriptionNode) {
                const descriptionNode = this.getOrCreateDescriptionNode();
                if (descriptionNode instanceof highlightedLabel_1.HighlightedLabel) {
                    descriptionNode.set(description || '', options ? options.descriptionMatches : undefined, undefined, options?.labelEscapeNewLines);
                    this.setupHover(descriptionNode.element, options?.descriptionTitle);
                }
                else {
                    descriptionNode.textContent = description && options?.labelEscapeNewLines ? highlightedLabel_1.HighlightedLabel.escapeNewLines(description, []) : (description || '');
                    this.setupHover(descriptionNode.element, options?.descriptionTitle || '');
                    descriptionNode.empty = !description;
                }
            }
            if (options?.suffix || this.suffixNode) {
                const suffixNode = this.getOrCreateSuffixNode();
                suffixNode.textContent = options?.suffix ?? '';
            }
        }
        setupHover(htmlElement, tooltip) {
            const previousCustomHover = this.customHovers.get(htmlElement);
            if (previousCustomHover) {
                previousCustomHover.dispose();
                this.customHovers.delete(htmlElement);
            }
            if (!tooltip) {
                htmlElement.removeAttribute('title');
                return;
            }
            if (this.hoverDelegate.showNativeHover) {
                (0, updatableHoverWidget_1.setupNativeHover)(htmlElement, tooltip);
            }
            else {
                const hoverDisposable = (0, updatableHoverWidget_1.setupCustomHover)(this.hoverDelegate, htmlElement, tooltip);
                if (hoverDisposable) {
                    this.customHovers.set(htmlElement, hoverDisposable);
                }
            }
        }
        dispose() {
            super.dispose();
            for (const disposable of this.customHovers.values()) {
                disposable.dispose();
            }
            this.customHovers.clear();
        }
        getOrCreateSuffixNode() {
            if (!this.suffixNode) {
                const suffixContainer = this._register(new FastLabelNode(dom.after(this.nameContainer, dom.$('span.monaco-icon-suffix-container'))));
                this.suffixNode = this._register(new FastLabelNode(dom.append(suffixContainer.element, dom.$('span.label-suffix'))));
            }
            return this.suffixNode;
        }
        getOrCreateDescriptionNode() {
            if (!this.descriptionNode) {
                const descriptionContainer = this._register(new FastLabelNode(dom.append(this.labelContainer, dom.$('span.monaco-icon-description-container'))));
                if (this.creationOptions?.supportDescriptionHighlights) {
                    this.descriptionNode = this._register(new highlightedLabel_1.HighlightedLabel(dom.append(descriptionContainer.element, dom.$('span.label-description')), { supportIcons: !!this.creationOptions.supportIcons }));
                }
                else {
                    this.descriptionNode = this._register(new FastLabelNode(dom.append(descriptionContainer.element, dom.$('span.label-description'))));
                }
            }
            return this.descriptionNode;
        }
    }
    exports.IconLabel = IconLabel;
    class Label {
        constructor(container) {
            this.container = container;
            this.label = undefined;
            this.singleLabel = undefined;
        }
        setLabel(label, options) {
            if (this.label === label && (0, objects_1.equals)(this.options, options)) {
                return;
            }
            this.label = label;
            this.options = options;
            if (typeof label === 'string') {
                if (!this.singleLabel) {
                    this.container.innerText = '';
                    this.container.classList.remove('multiple');
                    this.singleLabel = dom.append(this.container, dom.$('a.label-name', { id: options?.domId }));
                }
                this.singleLabel.textContent = label;
            }
            else {
                this.container.innerText = '';
                this.container.classList.add('multiple');
                this.singleLabel = undefined;
                for (let i = 0; i < label.length; i++) {
                    const l = label[i];
                    const id = options?.domId && `${options?.domId}_${i}`;
                    dom.append(this.container, dom.$('a.label-name', { id, 'data-icon-label-count': label.length, 'data-icon-label-index': i, 'role': 'treeitem' }, l));
                    if (i < label.length - 1) {
                        dom.append(this.container, dom.$('span.label-separator', undefined, options?.separator || '/'));
                    }
                }
            }
        }
    }
    function splitMatches(labels, separator, matches) {
        if (!matches) {
            return undefined;
        }
        let labelStart = 0;
        return labels.map(label => {
            const labelRange = { start: labelStart, end: labelStart + label.length };
            const result = matches
                .map(match => range_1.Range.intersect(labelRange, match))
                .filter(range => !range_1.Range.isEmpty(range))
                .map(({ start, end }) => ({ start: start - labelStart, end: end - labelStart }));
            labelStart = labelRange.end + separator.length;
            return result;
        });
    }
    class LabelWithHighlights extends lifecycle_1.Disposable {
        constructor(container, supportIcons) {
            super();
            this.container = container;
            this.supportIcons = supportIcons;
            this.label = undefined;
            this.singleLabel = undefined;
        }
        setLabel(label, options) {
            if (this.label === label && (0, objects_1.equals)(this.options, options)) {
                return;
            }
            this.label = label;
            this.options = options;
            if (typeof label === 'string') {
                if (!this.singleLabel) {
                    this.container.innerText = '';
                    this.container.classList.remove('multiple');
                    this.singleLabel = this._register(new highlightedLabel_1.HighlightedLabel(dom.append(this.container, dom.$('a.label-name', { id: options?.domId })), { supportIcons: this.supportIcons }));
                }
                this.singleLabel.set(label, options?.matches, undefined, options?.labelEscapeNewLines);
            }
            else {
                this.container.innerText = '';
                this.container.classList.add('multiple');
                this.singleLabel = undefined;
                const separator = options?.separator || '/';
                const matches = splitMatches(label, separator, options?.matches);
                for (let i = 0; i < label.length; i++) {
                    const l = label[i];
                    const m = matches ? matches[i] : undefined;
                    const id = options?.domId && `${options?.domId}_${i}`;
                    const name = dom.$('a.label-name', { id, 'data-icon-label-count': label.length, 'data-icon-label-index': i, 'role': 'treeitem' });
                    const highlightedLabel = this._register(new highlightedLabel_1.HighlightedLabel(dom.append(this.container, name), { supportIcons: this.supportIcons }));
                    highlightedLabel.set(l, m, undefined, options?.labelEscapeNewLines);
                    if (i < label.length - 1) {
                        dom.append(name, dom.$('span.label-separator', undefined, separator));
                    }
                }
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbkxhYmVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvaWNvbkxhYmVsL2ljb25MYWJlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQ2hHLE1BQU0sYUFBYTtRQU1sQixZQUFvQixRQUFxQjtZQUFyQixhQUFRLEdBQVIsUUFBUSxDQUFhO1FBQ3pDLENBQUM7UUFFRCxJQUFJLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVELElBQUksV0FBVyxDQUFDLE9BQWU7WUFDOUIsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLE9BQU8sS0FBSyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3BELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUM7WUFDNUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxJQUFJLFNBQVMsQ0FBQyxTQUFpQjtZQUM5QixJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksU0FBUyxLQUFLLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDcEQsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDckMsQ0FBQztRQUVELElBQUksS0FBSyxDQUFDLEtBQWM7WUFDdkIsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzVDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFB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