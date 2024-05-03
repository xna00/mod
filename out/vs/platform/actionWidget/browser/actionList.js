var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/browser/ui/list/listWidget", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/themables", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/css!./actionWidget"], function (require, exports, dom, keybindingLabel_1, listWidget_1, cancellation_1, codicons_1, lifecycle_1, platform_1, themables_1, nls_1, contextView_1, keybinding_1, defaultStyles_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActionList = exports.ActionListItemKind = exports.previewSelectedActionCommand = exports.acceptSelectedActionCommand = void 0;
    exports.acceptSelectedActionCommand = 'acceptSelectedCodeAction';
    exports.previewSelectedActionCommand = 'previewSelectedCodeAction';
    var ActionListItemKind;
    (function (ActionListItemKind) {
        ActionListItemKind["Action"] = "action";
        ActionListItemKind["Header"] = "header";
    })(ActionListItemKind || (exports.ActionListItemKind = ActionListItemKind = {}));
    class HeaderRenderer {
        get templateId() { return "header" /* ActionListItemKind.Header */; }
        renderTemplate(container) {
            container.classList.add('group-header');
            const text = document.createElement('span');
            container.append(text);
            return { container, text };
        }
        renderElement(element, _index, templateData) {
            templateData.text.textContent = element.group?.title ?? '';
        }
        disposeTemplate(_templateData) {
            // noop
        }
    }
    let ActionItemRenderer = class ActionItemRenderer {
        get templateId() { return "action" /* ActionListItemKind.Action */; }
        constructor(_supportsPreview, _keybindingService) {
            this._supportsPreview = _supportsPreview;
            this._keybindingService = _keybindingService;
        }
        renderTemplate(container) {
            container.classList.add(this.templateId);
            const icon = document.createElement('div');
            icon.className = 'icon';
            container.append(icon);
            const text = document.createElement('span');
            text.className = 'title';
            container.append(text);
            const keybinding = new keybindingLabel_1.KeybindingLabel(container, platform_1.OS);
            return { container, icon, text, keybinding };
        }
        renderElement(element, _index, data) {
            if (element.group?.icon) {
                data.icon.className = themables_1.ThemeIcon.asClassName(element.group.icon);
                if (element.group.icon.color) {
                    data.icon.style.color = (0, colorRegistry_1.asCssVariable)(element.group.icon.color.id);
                }
            }
            else {
                data.icon.className = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.lightBulb);
                data.icon.style.color = 'var(--vscode-editorLightBulb-foreground)';
            }
            if (!element.item || !element.label) {
                return;
            }
            data.text.textContent = stripNewlines(element.label);
            data.keybinding.set(element.keybinding);
            dom.setVisibility(!!element.keybinding, data.keybinding.element);
            const actionTitle = this._keybindingService.lookupKeybinding(exports.acceptSelectedActionCommand)?.getLabel();
            const previewTitle = this._keybindingService.lookupKeybinding(exports.previewSelectedActionCommand)?.getLabel();
            data.container.classList.toggle('option-disabled', element.disabled);
            if (element.disabled) {
                data.container.title = element.label;
            }
            else if (actionTitle && previewTitle) {
                if (this._supportsPreview && element.canPreview) {
                    data.container.title = (0, nls_1.localize)({ key: 'label-preview', comment: ['placeholders are keybindings, e.g "F2 to Apply, Shift+F2 to Preview"'] }, "{0} to Apply, {1} to Preview", actionTitle, previewTitle);
                }
                else {
                    data.container.title = (0, nls_1.localize)({ key: 'label', comment: ['placeholder is a keybinding, e.g "F2 to Apply"'] }, "{0} to Apply", actionTitle);
                }
            }
            else {
                data.container.title = '';
            }
        }
        disposeTemplate(_templateData) {
            _templateData.keybinding.dispose();
        }
    };
    ActionItemRenderer = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], ActionItemRenderer);
    class AcceptSelectedEvent extends UIEvent {
        constructor() { super('acceptSelectedAction'); }
    }
    class PreviewSelectedEvent extends UIEvent {
        constructor() { super('previewSelectedAction'); }
    }
    function getKeyboardNavigationLabel(item) {
        // Filter out header vs. action
        if (item.kind === 'action') {
            return item.label;
        }
        return undefined;
    }
    let ActionList = class ActionList extends lifecycle_1.Disposable {
        constructor(user, preview, items, _delegate, _contextViewService, _keybindingService) {
            super();
            this._delegate = _delegate;
            this._contextViewService = _contextViewService;
            this._keybindingService = _keybindingService;
            this._actionLineHeight = 24;
            this._headerLineHeight = 26;
            this.cts = this._register(new cancellation_1.CancellationTokenSource());
            this.domNode = document.createElement('div');
            this.domNode.classList.add('actionList');
            const virtualDelegate = {
                getHeight: element => element.kind === "header" /* ActionListItemKind.Header */ ? this._headerLineHeight : this._actionLineHeight,
                getTemplateId: element => element.kind
            };
            this._list = this._register(new listWidget_1.List(user, this.domNode, virtualDelegate, [
                new ActionItemRenderer(preview, this._keybindingService),
                new HeaderRenderer(),
            ], {
                keyboardSupport: false,
                typeNavigationEnabled: true,
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel },
                accessibilityProvider: {
                    getAriaLabel: element => {
                        if (element.kind === "action" /* ActionListItemKind.Action */) {
                            let label = element.label ? stripNewlines(element?.label) : '';
                            if (element.disabled) {
                                label = (0, nls_1.localize)({ key: 'customQuickFixWidget.labels', comment: [`Action widget labels for accessibility.`] }, "{0}, Disabled Reason: {1}", label, element.disabled);
                            }
                            return label;
                        }
                        return null;
                    },
                    getWidgetAriaLabel: () => (0, nls_1.localize)({ key: 'customQuickFixWidget', comment: [`An action widget option`] }, "Action Widget"),
                    getRole: (e) => e.kind === "action" /* ActionListItemKind.Action */ ? 'option' : 'separator',
                    getWidgetRole: () => 'listbox',
                },
            }));
            this._list.style(defaultStyles_1.defaultListStyles);
            this._register(this._list.onMouseClick(e => this.onListClick(e)));
            this._register(this._list.onMouseOver(e => this.onListHover(e)));
            this._register(this._list.onDidChangeFocus(() => this.onFocus()));
            this._register(this._list.onDidChangeSelection(e => this.onListSelection(e)));
            this._allMenuItems = items;
            this._list.splice(0, this._list.length, this._allMenuItems);
            if (this._list.length) {
                this.focusNext();
            }
        }
        focusCondition(element) {
            return !element.disabled && element.kind === "action" /* ActionListItemKind.Action */;
        }
        hide(didCancel) {
            this._delegate.onHide(didCancel);
            this.cts.cancel();
            this._contextViewService.hideContextView();
        }
        layout(minWidth) {
            // Updating list height, depending on how many separators and headers there are.
            const numHeaders = this._allMenuItems.filter(item => item.kind === 'header').length;
            const itemsHeight = this._allMenuItems.length * this._actionLineHeight;
            const heightWithHeaders = itemsHeight + numHeaders * this._headerLineHeight - numHeaders * this._actionLineHeight;
            this._list.layout(heightWithHeaders);
            let maxWidth = minWidth;
            if (this._allMenuItems.length >= 50) {
                maxWidth = 380;
            }
            else {
                // For finding width dynamically (not using resize observer)
                const itemWidths = this._allMenuItems.map((_, index) => {
                    const element = this.domNode.ownerDocument.getElementById(this._list.getElementID(index));
                    if (element) {
                        element.style.width = 'auto';
                        const width = element.getBoundingClientRect().width;
                        element.style.width = '';
                        return width;
                    }
                    return 0;
                });
                // resize observer - can be used in the future since list widget supports dynamic height but not width
                maxWidth = Math.max(...itemWidths, minWidth);
            }
            const maxVhPrecentage = 0.7;
            const height = Math.min(heightWithHeaders, this.domNode.ownerDocument.body.clientHeight * maxVhPrecentage);
            this._list.layout(height, maxWidth);
            this.domNode.style.height = `${height}px`;
            this._list.domFocus();
            return maxWidth;
        }
        focusPrevious() {
            this._list.focusPrevious(1, true, undefined, this.focusCondition);
        }
        focusNext() {
            this._list.focusNext(1, true, undefined, this.focusCondition);
        }
        acceptSelected(preview) {
            const focused = this._list.getFocus();
            if (focused.length === 0) {
                return;
            }
            const focusIndex = focused[0];
            const element = this._list.element(focusIndex);
            if (!this.focusCondition(element)) {
                return;
            }
            const event = preview ? new PreviewSelectedEvent() : new AcceptSelectedEvent();
            this._list.setSelection([focusIndex], event);
        }
        onListSelection(e) {
            if (!e.elements.length) {
                return;
            }
            const element = e.elements[0];
            if (element.item && this.focusCondition(element)) {
                this._delegate.onSelect(element.item, e.browserEvent instanceof PreviewSelectedEvent);
            }
            else {
                this._list.setSelection([]);
            }
        }
        onFocus() {
            const focused = this._list.getFocus();
            if (focused.length === 0) {
                return;
            }
            const focusIndex = focused[0];
            const element = this._list.element(focusIndex);
            this._delegate.onFocus?.(element.item);
        }
        async onListHover(e) {
            const element = e.element;
            if (element && element.item && this.focusCondition(element)) {
                if (this._delegate.onHover && !element.disabled && element.kind === "action" /* ActionListItemKind.Action */) {
                    const result = await this._delegate.onHover(element.item, this.cts.token);
                    element.canPreview = result ? result.canPreview : undefined;
                }
                if (e.index) {
                    this._list.splice(e.index, 1, [element]);
                }
            }
            this._list.setFocus(typeof e.index === 'number' ? [e.index] : []);
        }
        onListClick(e) {
            if (e.element && this.focusCondition(e.element)) {
                this._list.setFocus([]);
            }
        }
    };
    exports.ActionList = ActionList;
    exports.ActionList = ActionList = __decorate([
        __param(4, contextView_1.IContextViewService),
        __param(5, keybinding_1.IKeybindingService)
    ], ActionList);
    function stripNewlines(str) {
        return str.replace(/\r\n|\r|\n/g, ' ');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uTGlzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYWN0aW9uV2lkZ2V0L2Jyb3dzZXIvYWN0aW9uTGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBcUJhLFFBQUEsMkJBQTJCLEdBQUcsMEJBQTBCLENBQUM7SUFDekQsUUFBQSw0QkFBNEIsR0FBRywyQkFBMkIsQ0FBQztJQTBCeEUsSUFBa0Isa0JBR2pCO0lBSEQsV0FBa0Isa0JBQWtCO1FBQ25DLHVDQUFpQixDQUFBO1FBQ2pCLHVDQUFpQixDQUFBO0lBQ2xCLENBQUMsRUFIaUIsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFHbkM7SUFPRCxNQUFNLGNBQWM7UUFFbkIsSUFBSSxVQUFVLEtBQWEsZ0RBQWlDLENBQUMsQ0FBQztRQUU5RCxjQUFjLENBQUMsU0FBc0I7WUFDcEMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFeEMsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUVELGFBQWEsQ0FBQyxPQUEyQixFQUFFLE1BQWMsRUFBRSxZQUFpQztZQUMzRixZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDNUQsQ0FBQztRQUVELGVBQWUsQ0FBQyxhQUFrQztZQUNqRCxPQUFPO1FBQ1IsQ0FBQztLQUNEO0lBRUQsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7UUFFdkIsSUFBSSxVQUFVLEtBQWEs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