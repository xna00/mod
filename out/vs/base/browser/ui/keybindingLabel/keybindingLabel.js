/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/common/keybindingLabels", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/nls", "vs/css!./keybindingLabel"], function (require, exports, dom, hoverDelegateFactory_1, updatableHoverWidget_1, keybindingLabels_1, lifecycle_1, objects_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingLabel = exports.unthemedKeybindingLabelOptions = void 0;
    const $ = dom.$;
    exports.unthemedKeybindingLabelOptions = {
        keybindingLabelBackground: undefined,
        keybindingLabelForeground: undefined,
        keybindingLabelBorder: undefined,
        keybindingLabelBottomBorder: undefined,
        keybindingLabelShadow: undefined
    };
    class KeybindingLabel extends lifecycle_1.Disposable {
        constructor(container, os, options) {
            super();
            this.os = os;
            this.keyElements = new Set();
            this.options = options || Object.create(null);
            const labelForeground = this.options.keybindingLabelForeground;
            this.domNode = dom.append(container, $('.monaco-keybinding'));
            if (labelForeground) {
                this.domNode.style.color = labelForeground;
            }
            this.hover = this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.domNode, ''));
            this.didEverRender = false;
            container.appendChild(this.domNode);
        }
        get element() {
            return this.domNode;
        }
        set(keybinding, matches) {
            if (this.didEverRender && this.keybinding === keybinding && KeybindingLabel.areSame(this.matches, matches)) {
                return;
            }
            this.keybinding = keybinding;
            this.matches = matches;
            this.render();
        }
        render() {
            this.clear();
            if (this.keybinding) {
                const chords = this.keybinding.getChords();
                if (chords[0]) {
                    this.renderChord(this.domNode, chords[0], this.matches ? this.matches.firstPart : null);
                }
                for (let i = 1; i < chords.length; i++) {
                    dom.append(this.domNode, $('span.monaco-keybinding-key-chord-separator', undefined, ' '));
                    this.renderChord(this.domNode, chords[i], this.matches ? this.matches.chordPart : null);
                }
                const title = (this.options.disableTitle ?? false) ? undefined : this.keybinding.getAriaLabel() || undefined;
                this.hover.update(title);
                this.domNode.setAttribute('aria-label', title || '');
            }
            else if (this.options && this.options.renderUnboundKeybindings) {
                this.renderUnbound(this.domNode);
            }
            this.didEverRender = true;
        }
        clear() {
            dom.clearNode(this.domNode);
            this.keyElements.clear();
        }
        renderChord(parent, chord, match) {
            const modifierLabels = keybindingLabels_1.UILabelProvider.modifierLabels[this.os];
            if (chord.ctrlKey) {
                this.renderKey(parent, modifierLabels.ctrlKey, Boolean(match?.ctrlKey), modifierLabels.separator);
            }
            if (chord.shiftKey) {
                this.renderKey(parent, modifierLabels.shiftKey, Boolean(match?.shiftKey), modifierLabels.separator);
            }
            if (chord.altKey) {
                this.renderKey(parent, modifierLabels.altKey, Boolean(match?.altKey), modifierLabels.separator);
            }
            if (chord.metaKey) {
                this.renderKey(parent, modifierLabels.metaKey, Boolean(match?.metaKey), modifierLabels.separator);
            }
            const keyLabel = chord.keyLabel;
            if (keyLabel) {
                this.renderKey(parent, keyLabel, Boolean(match?.keyCode), '');
            }
        }
        renderKey(parent, label, highlight, separator) {
            dom.append(parent, this.createKeyElement(label, highlight ? '.highlight' : ''));
            if (separator) {
                dom.append(parent, $('span.monaco-keybinding-key-separator', undefined, separator));
            }
        }
        renderUnbound(parent) {
            dom.append(parent, this.createKeyElement((0, nls_1.localize)('unbound', "Unbound")));
        }
        createKeyElement(label, extraClass = '') {
            const keyElement = $('span.monaco-keybinding-key' + extraClass, undefined, label);
            this.keyElements.add(keyElement);
            if (this.options.keybindingLabelBackground) {
                keyElement.style.backgroundColor = this.options.keybindingLabelBackground;
            }
            if (this.options.keybindingLabelBorder) {
                keyElement.style.borderColor = this.options.keybindingLabelBorder;
            }
            if (this.options.keybindingLabelBottomBorder) {
                keyElement.style.borderBottomColor = this.options.keybindingLabelBottomBorder;
            }
            if (this.options.keybindingLabelShadow) {
                keyElement.style.boxShadow = `inset 0 -1px 0 ${this.options.keybindingLabelShadow}`;
            }
            return keyElement;
        }
        static areSame(a, b) {
            if (a === b || (!a && !b)) {
                return true;
            }
            return !!a && !!b && (0, objects_1.equals)(a.firstPart, b.firstPart) && (0, objects_1.equals)(a.chordPart, b.chordPart);
        }
    }
    exports.KeybindingLabel = KeybindingLabel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ0xhYmVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkva2V5YmluZGluZ0xhYmVsL2tleWJpbmRpbmdMYWJlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQStCSCxRQUFBLDhCQUE4QixHQUEyQjtRQUNyRSx5QkFBeUIsRUFBRSxTQUFTO1FBQ3BDLHlCQUF5QixFQUFFLFNBQVM7UUFDcEMscUJBQXFCLEVBQUUsU0FBUztRQUNoQywyQkFBMkIsRUFBRSxTQUFTO1FBQ3RDLHFCQUFxQixFQUFFLFNBQVM7S0FDaEMsQ0FBQztJQUVGLE1BQWEsZUFBZ0IsU0FBUSxzQkFBVTtRQVk5QyxZQUFZLFNBQXNCLEVBQVUsRUFBbUIsRUFBRSxPQUFnQztZQUNoRyxLQUFLLEVBQUUsQ0FBQztZQURtQyxPQUFFLEdBQUYsRUFBRSxDQUFpQjtZQVA5QyxnQkFBVyxHQUFHLElBQUksR0FBRyxFQUFtQixDQUFDO1lBVXpELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFOUMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQztZQUUvRCxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDOUQsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLGVBQWUsQ0FBQztZQUM1QyxDQUFDO1lBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJ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