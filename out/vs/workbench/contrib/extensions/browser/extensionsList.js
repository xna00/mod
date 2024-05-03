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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/contrib/extensions/browser/extensionsWidgets", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/notification/common/notification", "vs/platform/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/common/theme", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/css!./media/extension"], function (require, exports, dom_1, lifecycle_1, actionbar_1, instantiation_1, event_1, extensions_1, extensionsActions_1, extensionManagementUtil_1, extensionsWidgets_1, extensions_2, extensionManagement_1, notification_1, extensions_3, themeService_1, themables_1, theme_1, contextView_1, extensionsIcons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Renderer = exports.Delegate = void 0;
    const EXTENSION_LIST_ELEMENT_HEIGHT = 72;
    class Delegate {
        getHeight() { return EXTENSION_LIST_ELEMENT_HEIGHT; }
        getTemplateId() { return 'extension'; }
    }
    exports.Delegate = Delegate;
    let Renderer = class Renderer {
        constructor(extensionViewState, options, instantiationService, notificationService, extensionService, extensionManagementServerService, extensionsWorkbenchService, contextMenuService) {
            this.extensionViewState = extensionViewState;
            this.options = options;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.contextMenuService = contextMenuService;
        }
        get templateId() { return 'extension'; }
        renderTemplate(root) {
            const recommendationWidget = this.instantiationService.createInstance(extensionsWidgets_1.RecommendationWidget, (0, dom_1.append)(root, (0, dom_1.$)('.extension-bookmark-container')));
            const preReleaseWidget = this.instantiationService.createInstance(extensionsWidgets_1.PreReleaseBookmarkWidget, (0, dom_1.append)(root, (0, dom_1.$)('.extension-bookmark-container')));
            const element = (0, dom_1.append)(root, (0, dom_1.$)('.extension-list-item'));
            const iconContainer = (0, dom_1.append)(element, (0, dom_1.$)('.icon-container'));
            const icon = (0, dom_1.append)(iconContainer, (0, dom_1.$)('img.icon', { alt: '' }));
            const iconRemoteBadgeWidget = this.instantiationService.createInstance(extensionsWidgets_1.RemoteBadgeWidget, iconContainer, false);
            const extensionPackBadgeWidget = this.instantiationService.createInstance(extensionsWidgets_1.ExtensionPackCountWidget, iconContainer);
            const details = (0, dom_1.append)(element, (0, dom_1.$)('.details'));
            const headerContainer = (0, dom_1.append)(details, (0, dom_1.$)('.header-container'));
            const header = (0, dom_1.append)(headerContainer, (0, dom_1.$)('.header'));
            const name = (0, dom_1.append)(header, (0, dom_1.$)('span.name'));
            const installCount = (0, dom_1.append)(header, (0, dom_1.$)('span.install-count'));
            const ratings = (0, dom_1.append)(header, (0, dom_1.$)('span.ratings'));
            const syncIgnore = (0, dom_1.append)(header, (0, dom_1.$)('span.sync-ignored'));
            const activationStatus = (0, dom_1.append)(header, (0, dom_1.$)('span.activation-status'));
            const headerRemoteBadgeWidget = this.instantiationService.createInstance(extensionsWidgets_1.RemoteBadgeWidget, header, false);
            const description = (0, dom_1.append)(details, (0, dom_1.$)('.description.ellipsis'));
            const footer = (0, dom_1.append)(details, (0, dom_1.$)('.footer'));
            const publisher = (0, dom_1.append)(footer, (0, dom_1.$)('.author.ellipsis'));
            const verifiedPublisherWidget = this.instantiationService.createInstance(extensionsWidgets_1.VerifiedPublisherWidget, (0, dom_1.append)(publisher, (0, dom_1.$)(`.verified-publisher`)), true);
            const publisherDisplayName = (0, dom_1.append)(publisher, (0, dom_1.$)('.publisher-name.ellipsis'));
            const actionbar = new actionbar_1.ActionBar(footer, {
                actionViewItemProvider: (action, options) => {
                    if (action instanceof extensionsActions_1.ActionWithDropDownAction) {
                        return new extensionsActions_1.ExtensionActionWithDropdownActionViewItem(action, { ...options, icon: true, label: true, menuActionsOrProvider: { getActions: () => action.menuActions }, menuActionClassNames: (action.class || '').split(' ') }, this.contextMenuService);
                    }
                    if (action instanceof extensionsActions_1.ExtensionDropDownAction) {
                        return action.createActionViewItem(options);
                    }
                    return undefined;
                },
                focusOnlyEnabledItems: true
            });
            actionbar.setFocusable(false);
            actionbar.onDidRun(({ error }) => error && this.notificationService.error(error));
            const extensionStatusIconAction = this.instantiationService.createInstance(extensionsActions_1.ExtensionStatusAction);
            const actions = [
                this.instantiationService.createInstance(extensionsActions_1.ExtensionStatusLabelAction),
                this.instantiationService.createInstance(extensionsActions_1.MigrateDeprecatedExtensionAction, true),
                this.instantiationService.createInstance(extensionsActions_1.ExtensionRuntimeStateAction),
                this.instantiationService.createInstance(extensionsActions_1.ActionWithDropDownAction, 'extensions.updateActions', '', [[this.instantiationService.createInstance(extensionsActions_1.UpdateAction, false)], [this.instantiationService.createInstance(extensionsActions_1.ToggleAutoUpdateForExtensionAction, true, [true, 'onlyEnabledExtensions'])]]),
                this.instantiationService.createInstance(extensionsActions_1.InstallDropdownAction),
                this.instantiationService.createInstance(extensionsActions_1.InstallingLabelAction),
                this.instantiationService.createInstance(extensionsActions_1.SetLanguageAction),
                this.instantiationService.createInstance(extensionsActions_1.ClearLanguageAction),
                this.instantiationService.createInstance(extensionsActions_1.RemoteInstallAction, false),
                this.instantiationService.createInstance(extensionsActions_1.LocalInstallAction),
                this.instantiationService.createInstance(extensionsActions_1.WebInstallAction),
                extensionStatusIconAction,
                this.instantiationService.createInstance(extensionsActions_1.ManageExtensionAction)
            ];
            const extensionHoverWidget = this.instantiationService.createInstance(extensionsWidgets_1.ExtensionHoverWidget, { target: root, position: this.options.hoverOptions.position }, extensionStatusIconAction);
            const widgets = [
                recommendationWidget,
                preReleaseWidget,
                iconRemoteBadgeWidget,
                extensionPackBadgeWidget,
                headerRemoteBadgeWidget,
                verifiedPublisherWidget,
                extensionHoverWidget,
                this.instantiationService.createInstance(extensionsWidgets_1.SyncIgnoredWidget, syncIgnore),
                this.instantiationService.createInstance(extensionsWidgets_1.ExtensionActivationStatusWidget, activationStatus, true),
                this.instantiationService.createInstance(extensionsWidgets_1.InstallCountWidget, installCount, true),
                this.instantiationService.createInstance(extensionsWidgets_1.RatingsWidget, ratings, true),
            ];
            const extensionContainers = this.instantiationService.createInstance(extensions_1.ExtensionContainers, [...actions, ...widgets]);
            actionbar.push(actions, { icon: true, label: true });
            const disposable = (0, lifecycle_1.combinedDisposable)(...actions, ...widgets, actionbar, extensionContainers);
            return {
                root, element, icon, name, installCount, ratings, description, publisherDisplayName, disposables: [disposable], actionbar,
                extensionDisposables: [],
                set extension(extension) {
                    extensionContainers.extension = extension;
                }
            };
        }
        renderPlaceholder(index, data) {
            data.element.classList.add('loading');
            data.root.removeAttribute('aria-label');
            data.root.removeAttribute('data-extension-id');
            data.extensionDisposables = (0, lifecycle_1.dispose)(data.extensionDisposables);
            data.icon.src = '';
            data.name.textContent = '';
            data.description.textContent = '';
            data.publisherDisplayName.textContent = '';
            data.installCount.style.display = 'none';
            data.ratings.style.display = 'none';
            data.extension = null;
        }
        renderElement(extension, index, data) {
            data.element.classList.remove('loading');
            data.root.setAttribute('data-extension-id', extension.identifier.id);
            if (extension.state !== 3 /* ExtensionState.Uninstalled */ && !extension.server) {
                // Get the extension if it is installed and has no server information
                extension = this.extensionsWorkbenchService.local.filter(e => e.server === extension.server && (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))[0] || extension;
            }
            data.extensionDisposables = (0, lifecycle_1.dispose)(data.extensionDisposables);
            const computeEnablement = async () => {
                if (extension.state === 3 /* ExtensionState.Uninstalled */) {
                    if (!!extension.deprecationInfo) {
                        return true;
                    }
                    if (this.extensionsWorkbenchService.canSetLanguage(extension)) {
                        return false;
                    }
                    return !(await this.extensionsWorkbenchService.canInstall(extension));
                }
                else if (extension.local && !(0, extensions_3.isLanguagePackExtension)(extension.local.manifest)) {
                    const runningExtension = this.extensionService.extensions.filter(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, extension.identifier))[0];
                    return !(runningExtension && extension.server === this.extensionManagementServerService.getExtensionManagementServer((0, extensions_2.toExtension)(runningExtension)));
                }
                return false;
            };
            const updateEnablement = async () => {
                const disabled = await computeEnablement();
                const deprecated = !!extension.deprecationInfo;
                data.element.classList.toggle('deprecated', deprecated);
                data.root.classList.toggle('disabled', disabled);
            };
            updateEnablement();
            this.extensionService.onDidChangeExtensions(() => updateEnablement(), this, data.extensionDisposables);
            data.extensionDisposables.push((0, dom_1.addDisposableListener)(data.icon, 'error', () => data.icon.src = extension.iconUrlFallback, { once: true }));
            data.icon.src = extension.iconUrl;
            if (!data.icon.complete) {
                data.icon.style.visibility = 'hidden';
                data.icon.onload = () => data.icon.style.visibility = 'inherit';
            }
            else {
                data.icon.style.visibility = 'inherit';
            }
            data.name.textContent = extension.displayName;
            data.description.textContent = extension.description;
            const updatePublisher = () => {
                data.publisherDisplayName.textContent = !extension.resourceExtension && extension.local?.source !== 'resource' ? extension.publisherDisplayName : '';
            };
            updatePublisher();
            event_1.Event.filter(this.extensionsWorkbenchService.onChange, e => !!e && (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))(() => updatePublisher(), this, data.extensionDisposables);
            data.installCount.style.display = '';
            data.ratings.style.display = '';
            data.extension = extension;
            if (extension.gallery && extension.gallery.properties && extension.gallery.properties.localizedLanguages && extension.gallery.properties.localizedLanguages.length) {
                data.description.textContent = extension.gallery.properties.localizedLanguages.map(name => name[0].toLocaleUpperCase() + name.slice(1)).join(', ');
            }
            this.extensionViewState.onFocus(e => {
                if ((0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, e.identifier)) {
                    data.actionbar.setFocusable(true);
                }
            }, this, data.extensionDisposables);
            this.extensionViewState.onBlur(e => {
                if ((0, extensionManagementUtil_1.areSameExtensions)(extension.identifier, e.identifier)) {
                    data.actionbar.setFocusable(false);
                }
            }, this, data.extensionDisposables);
        }
        disposeElement(extension, index, data) {
            data.extensionDisposables = (0, lifecycle_1.dispose)(data.extensionDisposables);
        }
        disposeTemplate(data) {
            data.extensionDisposables = (0, lifecycle_1.dispose)(data.extensionDisposables);
            data.disposables = (0, lifecycle_1.dispose)(data.disposables);
        }
    };
    exports.Renderer = Renderer;
    exports.Renderer = Renderer = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, notification_1.INotificationService),
        __param(4, extensions_2.IExtensionService),
        __param(5, extensionManagement_1.IExtensionManagementServerService),
        __param(6, extensions_1.IExtensionsWorkbenchService),
        __param(7, contextView_1.IContextMenuService)
    ], Renderer);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const verifiedPublisherIconColor = theme.getColor(extensionsWidgets_1.extensionVerifiedPublisherIconColor);
        if (verifiedPublisherIconColor) {
            const disabledVerifiedPublisherIconColor = verifiedPublisherIconColor.transparent(.5).makeOpaque((0, theme_1.WORKBENCH_BACKGROUND)(theme));
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row.disabled .author .verified-publisher ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.verifiedPublisherIcon)} { color: ${disabledVerifiedPublisherIconColor}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc0xpc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvYnJvd3Nlci9leHRlbnNpb25zTGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQmhHLE1BQU0sNkJBQTZCLEdBQUcsRUFBRSxDQUFDO0lBc0J6QyxNQUFhLFFBQVE7UUFDcEIsU0FBUyxLQUFLLE9BQU8sNkJBQTZCLENBQUMsQ0FBQyxDQUFDO1FBQ3JELGFBQWEsS0FBSyxPQUFPLFdBQVcsQ0FBQyxDQUFDLENBQUM7S0FDdkM7SUFIRCw0QkFHQztJQVFNLElBQU0sUUFBUSxHQUFkLE1BQU0sUUFBUTtRQUVwQixZQUNTLGtCQUF3QyxFQUMvQixPQUFxQyxFQUNkLG9CQUEyQyxFQUM1QyxtQkFBeUMsRUFDNUMsZ0JBQW1DLEVBQ25CLGdDQUFtRSxFQUN6RSwwQkFBdUQsRUFDL0Qsa0JBQXVDO1lBUHJFLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDL0IsWUFBTyxHQUFQLE9BQU8sQ0FBOEI7WUFDZCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzVDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDNUMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNuQixxQ0FBZ0MsR0FBaEMsZ0NBQWdDLENBQW1DO1lBQ3pFLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFDL0QsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtRQUMxRSxDQUFDO1FBRUwsSUFBSSxVQUFVLEtBQUssT0FBTyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRXhDLGNBQWMsQ0FBQyxJQUFpQjtZQUMvQixNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFj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