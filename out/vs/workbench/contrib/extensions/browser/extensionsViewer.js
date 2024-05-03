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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/actions", "vs/workbench/contrib/extensions/common/extensions", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/themeService", "vs/base/common/cancellation", "vs/base/common/arrays", "vs/workbench/contrib/extensions/browser/extensionsList", "vs/platform/theme/common/colorRegistry", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/workbench/contrib/extensions/browser/extensionsViews"], function (require, exports, dom, nls_1, lifecycle_1, actions_1, extensions_1, event_1, instantiation_1, listService_1, configuration_1, contextkey_1, themeService_1, cancellation_1, arrays_1, extensionsList_1, colorRegistry_1, keyboardEvent_1, mouseEvent_1, extensionsViews_1) {
    "use strict";
    var ExtensionRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionData = exports.ExtensionsTree = exports.ExtensionsGridView = void 0;
    exports.getExtensions = getExtensions;
    let ExtensionsGridView = class ExtensionsGridView extends lifecycle_1.Disposable {
        constructor(parent, delegate, instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this.element = dom.append(parent, dom.$('.extensions-grid-view'));
            this.renderer = this.instantiationService.createInstance(extensionsList_1.Renderer, { onFocus: event_1.Event.None, onBlur: event_1.Event.None }, { hoverOptions: { position() { return 2 /* HoverPosition.BELOW */; } } });
            this.delegate = delegate;
            this.disposableStore = this._register(new lifecycle_1.DisposableStore());
        }
        setExtensions(extensions) {
            this.disposableStore.clear();
            extensions.forEach((e, index) => this.renderExtension(e, index));
        }
        renderExtension(extension, index) {
            const extensionContainer = dom.append(this.element, dom.$('.extension-container'));
            extensionContainer.style.height = `${this.delegate.getHeight()}px`;
            extensionContainer.setAttribute('tabindex', '0');
            const template = this.renderer.renderTemplate(extensionContainer);
            this.disposableStore.add((0, lifecycle_1.toDisposable)(() => this.renderer.disposeTemplate(template)));
            const openExtensionAction = this.instantiationService.createInstance(OpenExtensionAction);
            openExtensionAction.extension = extension;
            template.name.setAttribute('tabindex', '0');
            const handleEvent = (e) => {
                if (e instanceof keyboardEvent_1.StandardKeyboardEvent && e.keyCode !== 3 /* KeyCode.Enter */) {
                    return;
                }
                openExtensionAction.run(e.ctrlKey || e.metaKey);
                e.stopPropagation();
                e.preventDefault();
            };
            this.disposableStore.add(dom.addDisposableListener(template.name, dom.EventType.CLICK, (e) => handleEvent(new mouseEvent_1.StandardMouseEvent(dom.getWindow(template.name), e))));
            this.disposableStore.add(dom.addDisposableListener(template.name, dom.EventType.KEY_DOWN, (e) => handleEvent(new keyboardEvent_1.StandardKeyboardEvent(e))));
            this.disposableStore.add(dom.addDisposableListener(extensionContainer, dom.EventType.KEY_DOWN, (e) => handleEvent(new keyboardEvent_1.StandardKeyboardEvent(e))));
            this.renderer.renderElement(extension, index, template);
        }
    };
    exports.ExtensionsGridView = ExtensionsGridView;
    exports.ExtensionsGridView = ExtensionsGridView = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], ExtensionsGridView);
    class AsyncDataSource {
        hasChildren({ hasChildren }) {
            return hasChildren;
        }
        getChildren(extensionData) {
            return extensionData.getChildren();
        }
    }
    class VirualDelegate {
        getHeight(element) {
            return 62;
        }
        getTemplateId({ extension }) {
            return extension ? ExtensionRenderer.TEMPLATE_ID : UnknownExtensionRenderer.TEMPLATE_ID;
        }
    }
    let ExtensionRenderer = class ExtensionRenderer {
        static { ExtensionRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'extension-template'; }
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
        }
        get templateId() {
            return ExtensionRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            container.classList.add('extension');
            const icon = dom.append(container, dom.$('img.icon'));
            const details = dom.append(container, dom.$('.details'));
            const header = dom.append(details, dom.$('.header'));
            const name = dom.append(header, dom.$('span.name'));
            const openExtensionAction = this.instantiationService.createInstance(OpenExtensionAction);
            const extensionDisposables = [dom.addDisposableListener(name, 'click', (e) => {
                    openExtensionAction.run(e.ctrlKey || e.metaKey);
                    e.stopPropagation();
                    e.preventDefault();
                })];
            const identifier = dom.append(header, dom.$('span.identifier'));
            const footer = dom.append(details, dom.$('.footer'));
            const author = dom.append(footer, dom.$('.author'));
            return {
                icon,
                name,
                identifier,
                author,
                extensionDisposables,
                set extensionData(extensionData) {
                    openExtensionAction.extension = extensionData.extension;
                }
            };
        }
        renderElement(node, index, data) {
            const extension = node.element.extension;
            data.extensionDisposables.push(dom.addDisposableListener(data.icon, 'error', () => data.icon.src = extension.iconUrlFallback, { once: true }));
            data.icon.src = extension.iconUrl;
            if (!data.icon.complete) {
                data.icon.style.visibility = 'hidden';
                data.icon.onload = () => data.icon.style.visibility = 'inherit';
            }
            else {
                data.icon.style.visibility = 'inherit';
            }
            data.name.textContent = extension.displayName;
            data.identifier.textContent = extension.identifier.id;
            data.author.textContent = extension.publisherDisplayName;
            data.extensionData = node.element;
        }
        disposeTemplate(templateData) {
            templateData.extensionDisposables = (0, lifecycle_1.dispose)(templateData.extensionDisposables);
        }
    };
    ExtensionRenderer = ExtensionRenderer_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], ExtensionRenderer);
    class UnknownExtensionRenderer {
        static { this.TEMPLATE_ID = 'unknown-extension-template'; }
        get templateId() {
            return UnknownExtensionRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const messageContainer = dom.append(container, dom.$('div.unknown-extension'));
            dom.append(messageContainer, dom.$('span.error-marker')).textContent = (0, nls_1.localize)('error', "Error");
            dom.append(messageContainer, dom.$('span.message')).textContent = (0, nls_1.localize)('Unknown Extension', "Unknown Extension:");
            const identifier = dom.append(messageContainer, dom.$('span.message'));
            return { identifier };
        }
        renderElement(node, index, data) {
            data.identifier.textContent = node.element.extension.identifier.id;
        }
        disposeTemplate(data) {
        }
    }
    let OpenExtensionAction = class OpenExtensionAction extends actions_1.Action {
        constructor(extensionsWorkdbenchService) {
            super('extensions.action.openExtension', '');
            this.extensionsWorkdbenchService = extensionsWorkdbenchService;
        }
        set extension(extension) {
            this._extension = extension;
        }
        run(sideByside) {
            if (this._extension) {
                return this.extensionsWorkdbenchService.open(this._extension, { sideByside });
            }
            return Promise.resolve();
        }
    };
    OpenExtensionAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], OpenExtensionAction);
    let ExtensionsTree = class ExtensionsTree extends listService_1.WorkbenchAsyncDataTree {
        constructor(input, container, overrideStyles, contextKeyService, listService, instantiationService, configurationService, extensionsWorkdbenchService) {
            const delegate = new VirualDelegate();
            const dataSource = new AsyncDataSource();
            const renderers = [instantiationService.createInstance(ExtensionRenderer), instantiationService.createInstance(UnknownExtensionRenderer)];
            const identityProvider = {
                getId({ extension, parent }) {
                    return parent ? this.getId(parent) + '/' + extension.identifier.id : extension.identifier.id;
                }
            };
            super('ExtensionsTree', container, delegate, renderers, dataSource, {
                indent: 40,
                identityProvider,
                multipleSelectionSupport: false,
                overrideStyles,
                accessibilityProvider: {
                    getAriaLabel(extensionData) {
                        return (0, extensionsViews_1.getAriaLabelForExtension)(extensionData.extension);
                    },
                    getWidgetAriaLabel() {
                        return (0, nls_1.localize)('extensions', "Extensions");
                    }
                }
            }, instantiationService, contextKeyService, listService, configurationService);
            this.setInput(input);
            this.disposables.add(this.onDidChangeSelection(event => {
                if (dom.isKeyboardEvent(event.browserEvent)) {
                    extensionsWorkdbenchService.open(event.elements[0].extension, { sideByside: false });
                }
            }));
        }
    };
    exports.ExtensionsTree = ExtensionsTree;
    exports.ExtensionsTree = ExtensionsTree = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, listService_1.IListService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, extensions_1.IExtensionsWorkbenchService)
    ], ExtensionsTree);
    class ExtensionData {
        constructor(extension, parent, getChildrenExtensionIds, extensionsWorkbenchService) {
            this.extension = extension;
            this.parent = parent;
            this.getChildrenExtensionIds = getChildrenExtensionIds;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.childrenExtensionIds = this.getChildrenExtensionIds(extension);
        }
        get hasChildren() {
            return (0, arrays_1.isNonEmptyArray)(this.childrenExtensionIds);
        }
        async getChildren() {
            if (this.hasChildren) {
                const result = await getExtensions(this.childrenExtensionIds, this.extensionsWorkbenchService);
                return result.map(extension => new ExtensionData(extension, this, this.getChildrenExtensionIds, this.extensionsWorkbenchService));
            }
            return null;
        }
    }
    exports.ExtensionData = ExtensionData;
    async function getExtensions(extensions, extensionsWorkbenchService) {
        const localById = extensionsWorkbenchService.local.reduce((result, e) => { result.set(e.identifier.id.toLowerCase(), e); return result; }, new Map());
        const result = [];
        const toQuery = [];
        for (const extensionId of extensions) {
            const id = extensionId.toLowerCase();
            const local = localById.get(id);
            if (local) {
                result.push(local);
            }
            else {
                toQuery.push(id);
            }
        }
        if (toQuery.length) {
            const galleryResult = await extensionsWorkbenchService.getExtensions(toQuery.map(id => ({ id })), cancellation_1.CancellationToken.None);
            result.push(...galleryResult);
        }
        return result;
    }
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const focusBackground = theme.getColor(colorRegistry_1.listFocusBackground);
        if (focusBackground) {
            collector.addRule(`.extensions-grid-view .extension-container:focus { background-color: ${focusBackground}; outline: none; }`);
        }
        const focusForeground = theme.getColor(colorRegistry_1.listFocusForeground);
        if (focusForeground) {
            collector.addRule(`.extensions-grid-view .extension-container:focus { color: ${focusForeground}; }`);
        }
        const foregroundColor = theme.getColor(colorRegistry_1.foreground);
        const editorBackgroundColor = theme.getColor(colorRegistry_1.editorBackground);
        if (foregroundColor && editorBackgroundColor) {
            const authorForeground = foregroundColor.transparent(.9).makeOpaque(editorBackgroundColor);
            collector.addRule(`.extensions-grid-view .extension-container:not(.disabled) .author { color: ${authorForeground}; }`);
            const disabledExtensionForeground = foregroundColor.transparent(.5).makeOpaque(editorBackgroundColor);
            collector.addRule(`.extensions-grid-view .extension-container.disabled { color: ${disabledExtensionForeground}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1ZpZXdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9icm93c2VyL2V4dGVuc2lvbnNWaWV3ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTBUaEcsc0NBa0JDO0lBalRNLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVU7UUFPakQsWUFDQyxNQUFtQixFQUNuQixRQUFrQixFQUNzQixvQkFBMkM7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFGZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUduRixJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx5QkFBUSxFQUFFLEVBQUUsT0FBTyxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxFQUFFLFFBQVEsS0FBSyxtQ0FBMkIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbEwsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDekIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVELGFBQWEsQ0FBQyxVQUF3QjtZQUNyQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzdCLFVBQVUsQ0FBQyxPQUFP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