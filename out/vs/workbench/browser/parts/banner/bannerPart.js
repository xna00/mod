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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/browser/part", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/actions", "vs/platform/opener/browser/link", "vs/base/common/event", "vs/workbench/services/banner/browser/bannerService", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/contextkeys", "vs/css!./media/bannerpart"], function (require, exports, nls_1, dom_1, actionbar_1, extensions_1, instantiation_1, storage_1, themeService_1, themables_1, part_1, layoutService_1, actions_1, link_1, event_1, bannerService_1, markdownRenderer_1, actions_2, actionCommonCategories_1, keybindingsRegistry_1, contextkey_1, uri_1, iconRegistry_1, contextkeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BannerPart = void 0;
    // Banner Part
    let BannerPart = class BannerPart extends part_1.Part {
        get minimumHeight() {
            return this.visible ? this.height : 0;
        }
        get maximumHeight() {
            return this.visible ? this.height : 0;
        }
        get onDidChange() { return this._onDidChangeSize.event; }
        constructor(themeService, layoutService, storageService, contextKeyService, instantiationService) {
            super("workbench.parts.banner" /* Parts.BANNER_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            // #region IView
            this.height = 26;
            this.minimumWidth = 0;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this._onDidChangeSize = this._register(new event_1.Emitter());
            this.visible = false;
            this.focusedActionIndex = -1;
            this.markdownRenderer = this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {});
        }
        createContentArea(parent) {
            this.element = parent;
            this.element.tabIndex = 0;
            // Restore focused action if needed
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.FOCUS, () => {
                if (this.focusedActionIndex !== -1) {
                    this.focusActionLink();
                }
            }));
            // Track focus
            const scopedContextKeyService = this._register(this.contextKeyService.createScoped(this.element));
            contextkeys_1.BannerFocused.bindTo(scopedContextKeyService).set(true);
            return this.element;
        }
        close(item) {
            // Hide banner
            this.setVisibility(false);
            // Remove from document
            (0, dom_1.clearNode)(this.element);
            // Remember choice
            if (typeof item.onClose === 'function') {
                item.onClose();
            }
            this.item = undefined;
        }
        focusActionLink() {
            const length = this.item?.actions?.length ?? 0;
            if (this.focusedActionIndex < length) {
                const actionLink = this.messageActionsContainer?.children[this.focusedActionIndex];
                if (actionLink instanceof HTMLElement) {
                    this.actionBar?.setFocusable(false);
                    actionLink.focus();
                }
            }
            else {
                this.actionBar?.focus(0);
            }
        }
        getAriaLabel(item) {
            if (item.ariaLabel) {
                return item.ariaLabel;
            }
            if (typeof item.message === 'string') {
                return item.message;
            }
            return undefined;
        }
        getBannerMessage(message) {
            if (typeof message === 'string') {
                const element = (0, dom_1.$)('span');
                element.innerText = message;
                return element;
            }
            return this.markdownRenderer.render(message).element;
        }
        setVisibility(visible) {
            if (visible !== this.visible) {
                this.visible = visible;
                this.focusedActionIndex = -1;
                this.layoutService.setPartHidden(!visible, "workbench.parts.banner" /* Parts.BANNER_PART */);
                this._onDidChangeSize.fire(undefined);
            }
        }
        focus() {
            this.focusedActionIndex = -1;
            this.element.focus();
        }
        focusNextAction() {
            const length = this.item?.actions?.length ?? 0;
            this.focusedActionIndex = this.focusedActionIndex < length ? this.focusedActionIndex + 1 : 0;
            this.focusActionLink();
        }
        focusPreviousAction() {
            const length = this.item?.actions?.length ?? 0;
            this.focusedActionIndex = this.focusedActionIndex > 0 ? this.focusedActionIndex - 1 : length;
            this.focusActionLink();
        }
        hide(id) {
            if (this.item?.id !== id) {
                return;
            }
            this.setVisibility(false);
        }
        show(item) {
            if (item.id === this.item?.id) {
                this.setVisibility(true);
                return;
            }
            // Clear previous item
            (0, dom_1.clearNode)(this.element);
            // Banner aria label
            const ariaLabel = this.getAriaLabel(item);
            if (ariaLabel) {
                this.element.setAttribute('aria-label', ariaLabel);
            }
            // Icon
            const iconContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('div.icon-container'));
            iconContainer.setAttribute('aria-hidden', 'true');
            if (themables_1.ThemeIcon.isThemeIcon(item.icon)) {
                iconContainer.appendChild((0, dom_1.$)(`div${themables_1.ThemeIcon.asCSSSelector(item.icon)}`));
            }
            else {
                iconContainer.classList.add('custom-icon');
                if (uri_1.URI.isUri(item.icon)) {
                    iconContainer.style.backgroundImage = (0, dom_1.asCSSUrl)(item.icon);
                }
            }
            // Message
            const messageContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('div.message-container'));
            messageContainer.setAttribute('aria-hidden', 'true');
            messageContainer.appendChild(this.getBannerMessage(item.message));
            // Message Actions
            this.messageActionsContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('div.message-actions-container'));
            if (item.actions) {
                for (const action of item.actions) {
                    this._register(this.instantiationService.createInstance(link_1.Link, this.messageActionsContainer, { ...action, tabIndex: -1 }, {}));
                }
            }
            // Action
            const actionBarContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('div.action-container'));
            this.actionBar = this._register(new actionbar_1.ActionBar(actionBarContainer));
            const label = item.closeLabel ?? 'Close Banner';
            const closeAction = this._register(new actions_1.Action('banner.close', label, themables_1.ThemeIcon.asClassName(iconRegistry_1.widgetClose), true, () => this.close(item)));
            this.actionBar.push(closeAction, { icon: true, label: false });
            this.actionBar.setFocusable(false);
            this.setVisibility(true);
            this.item = item;
        }
        toJSON() {
            return {
                type: "workbench.parts.banner" /* Parts.BANNER_PART */
            };
        }
    };
    exports.BannerPart = BannerPart;
    exports.BannerPart = BannerPart = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, storage_1.IStorageService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, instantiation_1.IInstantiationService)
    ], BannerPart);
    (0, extensions_1.registerSingleton)(bannerService_1.IBannerService, BannerPart, 0 /* InstantiationType.Eager */);
    // Keybindings
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.banner.focusBanner',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 9 /* KeyCode.Escape */,
        when: contextkeys_1.BannerFocused,
        handler: (accessor) => {
            const bannerService = accessor.get(bannerService_1.IBannerService);
            bannerService.focus();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.banner.focusNextAction',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 17 /* KeyCode.RightArrow */,
        secondary: [18 /* KeyCode.DownArrow */],
        when: contextkeys_1.BannerFocused,
        handler: (accessor) => {
            const bannerService = accessor.get(bannerService_1.IBannerService);
            bannerService.focusNextAction();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.banner.focusPreviousAction',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 15 /* KeyCode.LeftArrow */,
        secondary: [16 /* KeyCode.UpArrow */],
        when: contextkeys_1.BannerFocused,
        handler: (accessor) => {
            const bannerService = accessor.get(bannerService_1.IBannerService);
            bannerService.focusPreviousAction();
        }
    });
    // Actions
    class FocusBannerAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.focusBanner'; }
        static { this.LABEL = (0, nls_1.localize2)('focusBanner', "Focus Banner"); }
        constructor() {
            super({
                id: FocusBannerAction.ID,
                title: FocusBannerAction.LABEL,
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.focusPart("workbench.parts.banner" /* Parts.BANNER_PART */);
        }
    }
    (0, actions_2.registerAction2)(FocusBannerAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFubmVyUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvYmFubmVyL2Jhbm5lclBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNEJoRyxjQUFjO0lBRVAsSUFBTSxVQUFVLEdBQWhCLE1BQU0sVUFBVyxTQUFRLFdBQUk7UUFVbkMsSUFBSSxhQUFhO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxJQUFJLGFBQWE7WUFDaEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUdELElBQWEsV0FBVyxLQUFLLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFZbEUsWUFDZ0IsWUFBMkIsRUFDakIsYUFBc0MsRUFDOUMsY0FBK0IsRUFDNUIsaUJBQXNELEVBQ25ELG9CQUE0RDtZQUVuRixLQUFLLG1EQUFvQixFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBSHRELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQWhDcEYsZ0JBQWdCO1lBRVAsV0FBTSxHQUFXLEVBQUUsQ0FBQztZQUNwQixpQkFBWSxHQUFXLENBQUMsQ0FBQztZQUN6QixpQkFBWSxHQUFXLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztZQVVqRCxxQkFBZ0IsR0FBRyxJQUFJLENB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