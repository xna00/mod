/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/lifecycle", "vs/base/common/objects"], function (require, exports, dom, hoverDelegateFactory_1, updatableHoverWidget_1, iconLabels_1, lifecycle_1, objects) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HighlightedLabel = void 0;
    /**
     * A widget which can render a label with substring highlights, often
     * originating from a filter function like the fuzzy matcher.
     */
    class HighlightedLabel extends lifecycle_1.Disposable {
        /**
         * Create a new {@link HighlightedLabel}.
         *
         * @param container The parent container to append to.
         */
        constructor(container, options) {
            super();
            this.options = options;
            this.text = '';
            this.title = '';
            this.highlights = [];
            this.didEverRender = false;
            this.supportIcons = options?.supportIcons ?? false;
            this.domNode = dom.append(container, dom.$('span.monaco-highlighted-label'));
        }
        /**
         * The label's DOM node.
         */
        get element() {
            return this.domNode;
        }
        /**
         * Set the label and highlights.
         *
         * @param text The label to display.
         * @param highlights The ranges to highlight.
         * @param title An optional title for the hover tooltip.
         * @param escapeNewLines Whether to escape new lines.
         * @returns
         */
        set(text, highlights = [], title = '', escapeNewLines) {
            if (!text) {
                text = '';
            }
            if (escapeNewLines) {
                // adjusts highlights inplace
                text = HighlightedLabel.escapeNewLines(text, highlights);
            }
            if (this.didEverRender && this.text === text && this.title === title && objects.equals(this.highlights, highlights)) {
                return;
            }
            this.text = text;
            this.title = title;
            this.highlights = highlights;
            this.render();
        }
        render() {
            const children = [];
            let pos = 0;
            for (const highlight of this.highlights) {
                if (highlight.end === highlight.start) {
                    continue;
                }
                if (pos < highlight.start) {
                    const substring = this.text.substring(pos, highlight.start);
                    if (this.supportIcons) {
                        children.push(...(0, iconLabels_1.renderLabelWithIcons)(substring));
                    }
                    else {
                        children.push(substring);
                    }
                    pos = highlight.start;
                }
                const substring = this.text.substring(pos, highlight.end);
                const element = dom.$('span.highlight', undefined, ...this.supportIcons ? (0, iconLabels_1.renderLabelWithIcons)(substring) : [substring]);
                if (highlight.extraClasses) {
                    element.classList.add(...highlight.extraClasses);
                }
                children.push(element);
                pos = highlight.end;
            }
            if (pos < this.text.length) {
                const substring = this.text.substring(pos);
                if (this.supportIcons) {
                    children.push(...(0, iconLabels_1.renderLabelWithIcons)(substring));
                }
                else {
                    children.push(substring);
                }
            }
            dom.reset(this.domNode, ...children);
            if (this.options?.hoverDelegate?.showNativeHover) {
                /* While custom hover is not inside custom hover */
                this.domNode.title = this.title;
            }
            else {
                if (!this.customHover && this.title !== '') {
                    const hoverDelegate = this.options?.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse');
                    this.customHover = this._register((0, updatableHoverWidget_1.setupCustomHover)(hoverDelegate, this.domNode, this.title));
                }
                else if (this.customHover) {
                    this.customHover.update(this.title);
                }
            }
            this.didEverRender = true;
        }
        static escapeNewLines(text, highlights) {
            let total = 0;
            let extra = 0;
            return text.replace(/\r\n|\r|\n/g, (match, offset) => {
                extra = match === '\r\n' ? -1 : 0;
                offset += total;
                for (const highlight of highlights) {
                    if (highlight.end <= offset) {
                        continue;
                    }
                    if (highlight.start >= offset) {
                        highlight.start += extra;
                    }
                    if (highlight.end >= offset) {
                        highlight.end += extra;
                    }
                }
                total += extra;
                return '\u23CE';
            });
        }
    }
    exports.HighlightedLabel = HighlightedLabel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaGxpZ2h0ZWRMYWJlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL2hpZ2hsaWdodGVkbGFiZWwvaGlnaGxpZ2h0ZWRMYWJlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE2QmhHOzs7T0FHRztJQUNILE1BQWEsZ0JBQWlCLFNBQVEsc0JBQVU7UUFVL0M7Ozs7V0FJRztRQUNILFlBQVksU0FBc0IsRUFBbUIsT0FBa0M7WUFDdEYsS0FBSyxFQUFFLENBQUM7WUFENEMsWUFBTyxHQUFQLE9BQU8sQ0FBMkI7WUFaL0UsU0FBSSxHQUFXLEVBQUUsQ0FBQztZQUNsQixVQUFLLEdBQVcsRUFBRSxDQUFDO1lBQ25CLGVBQVUsR0FBMEIsRUFBRSxDQUFDO1lBRXZDLGtCQUFhLEdBQVksS0FBSyxDQUFDO1lBV3RDLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxFQUFFLFlBQVksSUFBSSxLQUFLLENBQUM7WUFDbkQsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxJQUFJLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVEOzs7Ozs7OztXQVFHO1FBQ0gsR0FBRyxDQUFDLElBQXdCLEVBQUUsYUFBb0MsRUFBRSxFQUFFLFFBQWdCLEVBQUUsRUFBRSxjQUF3QjtZQUNqSCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUNwQiw2QkFBNkI7Z0JBQzdCLElBQUksR0FBRyxn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