/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/toggle/toggle", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/theme/browser/defaultStyles"], function (require, exports, DOM, updatableHoverWidget_1, toggle_1, codicons_1, event_1, lifecycle_1, nls_1, defaultStyles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeItemCheckbox = exports.CheckboxStateHandler = void 0;
    class CheckboxStateHandler extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeCheckboxState = this._register(new event_1.Emitter());
            this.onDidChangeCheckboxState = this._onDidChangeCheckboxState.event;
        }
        setCheckboxState(node) {
            this._onDidChangeCheckboxState.fire([node]);
        }
    }
    exports.CheckboxStateHandler = CheckboxStateHandler;
    class TreeItemCheckbox extends lifecycle_1.Disposable {
        static { this.checkboxClass = 'custom-view-tree-node-item-checkbox'; }
        constructor(container, checkboxStateHandler, hoverDelegate) {
            super();
            this.checkboxStateHandler = checkboxStateHandler;
            this.hoverDelegate = hoverDelegate;
            this.isDisposed = false;
            this._onDidChangeState = new event_1.Emitter();
            this.onDidChangeState = this._onDidChangeState.event;
            this.checkboxContainer = container;
        }
        render(node) {
            if (node.checkbox) {
                if (!this.toggle) {
                    this.createCheckbox(node);
                }
                else {
                    this.toggle.checked = node.checkbox.isChecked;
                    this.toggle.setIcon(this.toggle.checked ? codicons_1.Codicon.check : undefined);
                }
            }
        }
        createCheckbox(node) {
            if (node.checkbox) {
                this.toggle = new toggle_1.Toggle({
                    isChecked: node.checkbox.isChecked,
                    title: '',
                    icon: node.checkbox.isChecked ? codicons_1.Codicon.check : undefined,
                    ...defaultStyles_1.defaultToggleStyles
                });
                this.setHover(node.checkbox);
                this.setAccessibilityInformation(node.checkbox);
                this.toggle.domNode.classList.add(TreeItemCheckbox.checkboxClass);
                this.toggle.domNode.tabIndex = 1;
                DOM.append(this.checkboxContainer, this.toggle.domNode);
                this.registerListener(node);
            }
        }
        registerListener(node) {
            if (this.toggle) {
                this._register({ dispose: () => this.removeCheckbox() });
                this._register(this.toggle);
                this._register(this.toggle.onChange(() => {
                    this.setCheckbox(node);
                }));
            }
        }
        setHover(checkbox) {
            if (this.toggle) {
                if (!this.hover) {
                    this.hover = this._register((0, updatableHoverWidget_1.setupCustomHover)(this.hoverDelegate, this.toggle.domNode, this.checkboxHoverContent(checkbox)));
                }
                else {
                    this.hover.update(checkbox.tooltip);
                }
            }
        }
        setCheckbox(node) {
            if (this.toggle && node.checkbox) {
                node.checkbox.isChecked = this.toggle.checked;
                this.toggle.setIcon(this.toggle.checked ? codicons_1.Codicon.check : undefined);
                this.setHover(node.checkbox);
                this.setAccessibilityInformation(node.checkbox);
                this.checkboxStateHandler.setCheckboxState(node);
            }
        }
        checkboxHoverContent(checkbox) {
            return checkbox.tooltip ? checkbox.tooltip :
                checkbox.isChecked ? (0, nls_1.localize)('checked', 'Checked') : (0, nls_1.localize)('unchecked', 'Unchecked');
        }
        setAccessibilityInformation(checkbox) {
            if (this.toggle && checkbox.accessibilityInformation) {
                this.toggle.domNode.ariaLabel = checkbox.accessibilityInformation.label;
                if (checkbox.accessibilityInformation.role) {
                    this.toggle.domNode.role = checkbox.accessibilityInformation.role;
                }
            }
        }
        removeCheckbox() {
            const children = this.checkboxContainer.children;
            for (const child of children) {
                this.checkboxContainer.removeChild(child);
            }
        }
    }
    exports.TreeItemCheckbox = TreeItemCheckbox;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tib3guanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL3ZpZXdzL2NoZWNrYm94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFhLG9CQUFxQixTQUFRLHNCQUFVO1FBQXBEOztZQUNrQiw4QkFBeUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFlLENBQUMsQ0FBQztZQUMvRSw2QkFBd0IsR0FBdUIsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQztRQUs5RixDQUFDO1FBSE8sZ0JBQWdCLENBQUMsSUFBZTtZQUN0QyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM3QyxDQUFDO0tBQ0Q7SUFQRCxvREFPQztJQUVELE1BQWEsZ0JBQWlCLFNBQVEsc0JBQVU7aUJBTXhCLGtCQUFhLEdBQUcscUNBQXFDLEFBQXhDLENBQXlDO1FBSzdFLFlBQVksU0FBc0IsRUFBVSxvQkFBMEMsRUFBbUIsYUFBNkI7WUFDckksS0FBSyxFQUFFLENBQUM7WUFEbUMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUFtQixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFSL0gsZUFBVSxHQUFHLEtBQUssQ0FBQztZQUtULHNCQUFpQixHQUFHLElBQUksZUFBTyxFQUFXLENBQUM7WUFDbkQscUJBQWdCLEdBQW1CLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFJeEUsSUFBSSxDQUFDLGlCQUFpQixHQUFtQixTQUFTLENBQUM7UUFDcEQsQ0FBQztRQUVNLE1BQU0sQ0FBQyxJQUFlO1lBQzVCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNuQixJQUFJLENB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