var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/browser/link", "vs/platform/theme/common/iconRegistry", "vs/base/common/themables", "vs/css!./bannerController"], function (require, exports, dom_1, actionbar_1, actions_1, lifecycle_1, markdownRenderer_1, instantiation_1, link_1, iconRegistry_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BannerController = void 0;
    const BANNER_ELEMENT_HEIGHT = 26;
    let BannerController = class BannerController extends lifecycle_1.Disposable {
        constructor(_editor, instantiationService) {
            super();
            this._editor = _editor;
            this.instantiationService = instantiationService;
            this.banner = this._register(this.instantiationService.createInstance(Banner));
        }
        hide() {
            this._editor.setBanner(null, 0);
            this.banner.clear();
        }
        show(item) {
            this.banner.show({
                ...item,
                onClose: () => {
                    this.hide();
                    item.onClose?.();
                }
            });
            this._editor.setBanner(this.banner.element, BANNER_ELEMENT_HEIGHT);
        }
    };
    exports.BannerController = BannerController;
    exports.BannerController = BannerController = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], BannerController);
    // TODO@hediet: Investigate if this can be reused by the workspace banner (bannerPart.ts).
    let Banner = class Banner extends lifecycle_1.Disposable {
        constructor(instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this.markdownRenderer = this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {});
            this.element = (0, dom_1.$)('div.editor-banner');
            this.element.tabIndex = 0;
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
        clear() {
            (0, dom_1.clearNode)(this.element);
        }
        show(item) {
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
            if (item.icon) {
                iconContainer.appendChild((0, dom_1.$)(`div${themables_1.ThemeIcon.asCSSSelector(item.icon)}`));
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
            this.actionBar.push(this._register(new actions_1.Action('banner.close', 'Close Banner', themables_1.ThemeIcon.asClassName(iconRegistry_1.widgetClose), true, () => {
                if (typeof item.onClose === 'function') {
                    item.onClose();
                }
            })), { icon: true, label: false });
            this.actionBar.setFocusable(false);
        }
    };
    Banner = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], Banner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFubmVyQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvdW5pY29kZUhpZ2hsaWdodGVyL2Jyb3dzZXIvYmFubmVyQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBaUJBLE1BQU0scUJBQXFCLEdBQUcsRUFBRSxDQUFDO0lBRTFCLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVU7UUFHL0MsWUFDa0IsT0FBb0IsRUFDRyxvQkFBMkM7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFIUyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ0cseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUluRixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFTSxJQUFJO1lBQ1YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUVNLElBQUksQ0FBQyxJQUFpQjtZQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDaEIsR0FBRyxJQUFJO2dCQUNQLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNaLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO2dCQUNsQixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFP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