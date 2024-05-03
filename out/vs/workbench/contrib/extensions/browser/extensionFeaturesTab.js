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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/event", "vs/platform/extensions/common/extensions", "vs/base/browser/ui/splitview/splitview", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/platform/list/browser/listService", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/browser/ui/button/button", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/markdownRenderer", "vs/base/common/errors", "vs/platform/opener/common/opener", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/platform/dialogs/common/dialogs", "vs/base/common/themables", "vs/base/common/severity", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/platform/severityIcon/browser/severityIcon", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/common/platform", "vs/base/common/htmlContent", "vs/base/common/color", "vs/workbench/services/extensions/common/extensions", "vs/base/common/codicons", "vs/platform/instantiation/common/descriptors", "vs/base/common/date", "vs/base/common/keybindings"], function (require, exports, lifecycle_1, dom_1, event_1, extensions_1, splitview_1, extensionFeatures_1, platform_1, instantiation_1, nls_1, listService_1, extensionManagementUtil_1, button_1, defaultStyles_1, markdownRenderer_1, errors_1, opener_1, theme_1, themeService_1, scrollableElement_1, dialogs_1, themables_1, severity_1, extensionsIcons_1, severityIcon_1, keybindingLabel_1, platform_2, htmlContent_1, color_1, extensions_2, codicons_1, descriptors_1, date_1, keybindings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionFeaturesTab = void 0;
    let RuntimeStatusMarkdownRenderer = class RuntimeStatusMarkdownRenderer extends lifecycle_1.Disposable {
        static { this.ID = 'runtimeStatus'; }
        constructor(extensionService, extensionFeaturesManagementService) {
            super();
            this.extensionService = extensionService;
            this.extensionFeaturesManagementService = extensionFeaturesManagementService;
            this.type = 'markdown';
        }
        shouldRender(manifest) {
            const extensionId = new extensions_1.ExtensionIdentifier((0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name));
            if (!this.extensionService.extensions.some(e => extensions_1.ExtensionIdentifier.equals(e.identifier, extensionId))) {
                return false;
            }
            return !!manifest.main || !!manifest.browser;
        }
        render(manifest) {
            const disposables = new lifecycle_1.DisposableStore();
            const extensionId = new extensions_1.ExtensionIdentifier((0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name));
            const emitter = disposables.add(new event_1.Emitter());
            disposables.add(this.extensionService.onDidChangeExtensionsStatus(e => {
                if (e.some(extension => extensions_1.ExtensionIdentifier.equals(extension, extensionId))) {
                    emitter.fire(this.getActivationData(manifest));
                }
            }));
            disposables.add(this.extensionFeaturesManagementService.onDidChangeAccessData(e => emitter.fire(this.getActivationData(manifest))));
            return {
                onDidChange: emitter.event,
                data: this.getActivationData(manifest),
                dispose: () => disposables.dispose()
            };
        }
        getActivationData(manifest) {
            const data = new htmlContent_1.MarkdownString();
            const extensionId = new extensions_1.ExtensionIdentifier((0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name));
            const status = this.extensionService.getExtensionsStatus()[extensionId.value];
            if (this.extensionService.extensions.some(extension => extensions_1.ExtensionIdentifier.equals(extension.identifier, extensionId))) {
                data.appendMarkdown(`### ${(0, nls_1.localize)('activation', "Activation")}\n\n`);
                if (status.activationTimes) {
                    if (status.activationTimes.activationReason.startup) {
                        data.appendMarkdown(`Activated on Startup: \`${status.activationTimes.activateCallTime}ms\``);
                    }
                    else {
                        data.appendMarkdown(`Activated by \`${status.activationTimes.activationReason.activationEvent}\` event: \`${status.activationTimes.activateCallTime}ms\``);
                    }
                }
                else {
                    data.appendMarkdown('Not yet activated');
                }
                if (status.runtimeErrors.length) {
                    data.appendMarkdown(`\n ### ${(0, nls_1.localize)('uncaught errors', "Uncaught Errors ({0})", status.runtimeErrors.length)}\n`);
                    for (const error of status.runtimeErrors) {
                        data.appendMarkdown(`$(${codicons_1.Codicon.error.id})&nbsp;${(0, errors_1.getErrorMessage)(error)}\n\n`);
                    }
                }
                if (status.messages.length) {
                    data.appendMarkdown(`\n ### ${(0, nls_1.localize)('messaages', "Messages ({0})", status.messages.length)}\n`);
                    for (const message of status.messages) {
                        data.appendMarkdown(`$(${(message.type === severity_1.default.Error ? codicons_1.Codicon.error : message.type === severity_1.default.Warning ? codicons_1.Codicon.warning : codicons_1.Codicon.info).id})&nbsp;${message.message}\n\n`);
                    }
                }
            }
            const features = platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).getExtensionFeatures();
            for (const feature of features) {
                const accessData = this.extensionFeaturesManagementService.getAccessData(extensionId, feature.id);
                if (accessData) {
                    data.appendMarkdown(`\n ### ${feature.label}\n\n`);
                    const status = accessData?.current?.status;
                    if (status) {
                        if (status?.severity === severity_1.default.Error) {
                            data.appendMarkdown(`$(${extensionsIcons_1.errorIcon.id}) ${status.message}\n\n`);
                        }
                        if (status?.severity === severity_1.default.Warning) {
                            data.appendMarkdown(`$(${extensionsIcons_1.warningIcon.id}) ${status.message}\n\n`);
                        }
                    }
                    if (accessData?.totalCount) {
                        if (accessData.current) {
                            data.appendMarkdown(`${(0, nls_1.localize)('last request', "Last Request: `{0}`", (0, date_1.fromNow)(accessData.current.lastAccessed, true, true))}\n\n`);
                            data.appendMarkdown(`${(0, nls_1.localize)('requests count session', "Requests (Session) : `{0}`", accessData.current.count)}\n\n`);
                        }
                        data.appendMarkdown(`${(0, nls_1.localize)('requests count total', "Requests (Overall): `{0}`", accessData.totalCount)}\n\n`);
                    }
                }
            }
            return data;
        }
    };
    RuntimeStatusMarkdownRenderer = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, extensionFeatures_1.IExtensionFeaturesManagementService)
    ], RuntimeStatusMarkdownRenderer);
    const runtimeStatusFeature = {
        id: RuntimeStatusMarkdownRenderer.ID,
        label: (0, nls_1.localize)('runtime', "Runtime Status"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(RuntimeStatusMarkdownRenderer),
    };
    let ExtensionFeaturesTab = class ExtensionFeaturesTab extends themeService_1.Themable {
        constructor(manifest, feature, themeService, instantiationService) {
            super(themeService);
            this.manifest = manifest;
            this.feature = feature;
            this.instantiationService = instantiationService;
            this.featureView = this._register(new lifecycle_1.MutableDisposable());
            this.layoutParticipants = [];
            this.extensionId = new extensions_1.ExtensionIdentifier((0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name));
            this.domNode = (0, dom_1.$)('div.subcontent.feature-contributions');
            this.create();
        }
        layout(height, width) {
            this.layoutParticipants.forEach(participant => participant.layout(height, width));
        }
        create() {
            const features = this.getFeatures();
            if (features.length === 0) {
                (0, dom_1.append)((0, dom_1.$)('.no-features'), this.domNode).textContent = (0, nls_1.localize)('noFeatures', "No features contributed.");
                return;
            }
            const splitView = new splitview_1.SplitView(this.domNode, {
                orientation: 1 /* Orientation.HORIZONTAL */,
                proportionalLayout: true
            });
            this.layoutParticipants.push({
                layout: (height, width) => {
                    splitView.el.style.height = `${height - 14}px`;
                    splitView.layout(width);
                }
            });
            const featuresListContainer = (0, dom_1.$)('.features-list-container');
            const list = this.createFeaturesList(featuresListContainer);
            list.splice(0, list.length, features);
            const featureViewContainer = (0, dom_1.$)('.feature-view-container');
            this._register(list.onDidChangeSelection(e => {
                const feature = e.elements[0];
                if (feature) {
                    this.showFeatureView(feature, featureViewContainer);
                }
            }));
            const index = this.feature ? features.findIndex(f => f.id === this.feature) : 0;
            list.setSelection([index === -1 ? 0 : index]);
            splitView.addView({
                onDidChange: event_1.Event.None,
                element: featuresListContainer,
                minimumSize: 100,
                maximumSize: Number.POSITIVE_INFINITY,
                layout: (width, _, height) => {
                    featuresListContainer.style.width = `${width}px`;
                    list.layout(height, width);
                }
            }, 200, undefined, true);
            splitView.addView({
                onDidChange: event_1.Event.None,
                element: featureViewContainer,
                minimumSize: 500,
                maximumSize: Number.POSITIVE_INFINITY,
                layout: (width, _, height) => {
                    featureViewContainer.style.width = `${width}px`;
                    this.featureViewDimension = { height, width };
                    this.layoutFeatureView();
                }
            }, splitview_1.Sizing.Distribute, undefined, true);
            splitView.style({
                separatorBorder: this.theme.getColor(theme_1.PANEL_SECTION_BORDER)
            });
        }
        createFeaturesList(container) {
            const renderer = this.instantiationService.createInstance(ExtensionFeatureItemRenderer, this.extensionId);
            const delegate = new ExtensionFeatureItemDelegate();
            const list = this.instantiationService.createInstance(listService_1.WorkbenchList, 'ExtensionFeaturesList', (0, dom_1.append)(container, (0, dom_1.$)('.features-list-wrapper')), delegate, [renderer], {
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                horizontalScrolling: false,
                accessibilityProvider: {
                    getAriaLabel(extensionFeature) {
                        return extensionFeature?.label ?? '';
                    },
                    getWidgetAriaLabel() {
                        return (0, nls_1.localize)('extension features list', "Extension Features");
                    }
                },
                openOnSingleClick: true
            });
            return list;
        }
        layoutFeatureView() {
            this.featureView.value?.layout(this.featureViewDimension?.height, this.featureViewDimension?.width);
        }
        showFeatureView(feature, container) {
            if (this.featureView.value?.feature.id === feature.id) {
                return;
            }
            (0, dom_1.clearNode)(container);
            this.featureView.value = this.instantiationService.createInstance(ExtensionFeatureView, this.extensionId, this.manifest, feature);
            container.appendChild(this.featureView.value.domNode);
            this.layoutFeatureView();
        }
        getFeatures() {
            const features = platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry)
                .getExtensionFeatures().filter(feature => {
                const renderer = this.getRenderer(feature);
                const shouldRender = renderer?.shouldRender(this.manifest);
                renderer?.dispose();
                return shouldRender;
            }).sort((a, b) => a.label.localeCompare(b.label));
            const renderer = this.getRenderer(runtimeStatusFeature);
            if (renderer?.shouldRender(this.manifest)) {
                features.splice(0, 0, runtimeStatusFeature);
            }
            renderer?.dispose();
            return features;
        }
        getRenderer(feature) {
            return feature.renderer ? this.instantiationService.createInstance(feature.renderer) : undefined;
        }
    };
    exports.ExtensionFeaturesTab = ExtensionFeaturesTab;
    exports.ExtensionFeaturesTab = ExtensionFeaturesTab = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService)
    ], ExtensionFeaturesTab);
    class ExtensionFeatureItemDelegate {
        getHeight() { return 22; }
        getTemplateId() { return 'extensionFeatureDescriptor'; }
    }
    let ExtensionFeatureItemRenderer = class ExtensionFeatureItemRenderer {
        constructor(extensionId, extensionFeaturesManagementService) {
            this.extensionId = extensionId;
            this.extensionFeaturesManagementService = extensionFeaturesManagementService;
            this.templateId = 'extensionFeatureDescriptor';
        }
        renderTemplate(container) {
            container.classList.add('extension-feature-list-item');
            const label = (0, dom_1.append)(container, (0, dom_1.$)('.extension-feature-label'));
            const disabledElement = (0, dom_1.append)(container, (0, dom_1.$)('.extension-feature-disabled-label'));
            disabledElement.textContent = (0, nls_1.localize)('revoked', "No Access");
            const statusElement = (0, dom_1.append)(container, (0, dom_1.$)('.extension-feature-status'));
            return { label, disabledElement, statusElement, disposables: new lifecycle_1.DisposableStore() };
        }
        renderElement(element, index, templateData) {
            templateData.disposables.clear();
            templateData.label.textContent = element.label;
            templateData.disabledElement.style.display = element.id === runtimeStatusFeature.id || this.extensionFeaturesManagementService.isEnabled(this.extensionId, element.id) ? 'none' : 'inherit';
            templateData.disposables.add(this.extensionFeaturesManagementService.onDidChangeEnablement(({ extension, featureId, enabled }) => {
                if (extensions_1.ExtensionIdentifier.equals(extension, this.extensionId) && featureId === element.id) {
                    templateData.disabledElement.style.display = enabled ? 'none' : 'inherit';
                }
            }));
            const statusElementClassName = templateData.statusElement.className;
            const updateStatus = () => {
                const accessData = this.extensionFeaturesManagementService.getAccessData(this.extensionId, element.id);
                if (accessData?.current?.status) {
                    templateData.statusElement.style.display = 'inherit';
                    templateData.statusElement.className = `${statusElementClassName} ${severityIcon_1.SeverityIcon.className(accessData.current.status.severity)}`;
                }
                else {
                    templateData.statusElement.style.display = 'none';
                }
            };
            updateStatus();
            templateData.disposables.add(this.extensionFeaturesManagementService.onDidChangeAccessData(({ extension, featureId }) => {
                if (extensions_1.ExtensionIdentifier.equals(extension, this.extensionId) && featureId === element.id) {
                    updateStatus();
                }
            }));
        }
        disposeElement(element, index, templateData, height) {
            templateData.disposables.dispose();
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    ExtensionFeatureItemRenderer = __decorate([
        __param(1, extensionFeatures_1.IExtensionFeaturesManagementService)
    ], ExtensionFeatureItemRenderer);
    let ExtensionFeatureView = class ExtensionFeatureView extends lifecycle_1.Disposable {
        constructor(extensionId, manifest, feature, openerService, instantiationService, extensionFeaturesManagementService, dialogService) {
            super();
            this.extensionId = extensionId;
            this.manifest = manifest;
            this.feature = feature;
            this.openerService = openerService;
            this.instantiationService = instantiationService;
            this.extensionFeaturesManagementService = extensionFeaturesManagementService;
            this.dialogService = dialogService;
            this.layoutParticipants = [];
            this.domNode = (0, dom_1.$)('.extension-feature-content');
            this.create(this.domNode);
        }
        create(content) {
            const header = (0, dom_1.append)(content, (0, dom_1.$)('.feature-header'));
            const title = (0, dom_1.append)(header, (0, dom_1.$)('.feature-title'));
            title.textContent = this.feature.label;
            if (this.feature.access.canToggle) {
                const actionsContainer = (0, dom_1.append)(header, (0, dom_1.$)('.feature-actions'));
                const button = new button_1.Button(actionsContainer, defaultStyles_1.defaultButtonStyles);
                this.updateButtonLabel(button);
                this._register(this.extensionFeaturesManagementService.onDidChangeEnablement(({ extension, featureId }) => {
                    if (extensions_1.ExtensionIdentifier.equals(extension, this.extensionId) && featureId === this.feature.id) {
                        this.updateButtonLabel(button);
                    }
                }));
                this._register(button.onDidClick(async () => {
                    const enabled = this.extensionFeaturesManagementService.isEnabled(this.extensionId, this.feature.id);
                    const confirmationResult = await this.dialogService.confirm({
                        title: (0, nls_1.localize)('accessExtensionFeature', "Enable '{0}' Feature", this.feature.label),
                        message: enabled
                            ? (0, nls_1.localize)('disableAccessExtensionFeatureMessage', "Would you like to revoke '{0}' extension to access '{1}' feature?", this.manifest.displayName ?? this.extensionId.value, this.feature.label)
                            : (0, nls_1.localize)('enableAccessExtensionFeatureMessage', "Would you like to allow '{0}' extension to access '{1}' feature?", this.manifest.displayName ?? this.extensionId.value, this.feature.label),
                        custom: true,
                        primaryButton: enabled ? (0, nls_1.localize)('revoke', "Revoke Access") : (0, nls_1.localize)('grant', "Allow Access"),
                        cancelButton: (0, nls_1.localize)('cancel', "Cancel"),
                    });
                    if (confirmationResult.confirmed) {
                        this.extensionFeaturesManagementService.setEnablement(this.extensionId, this.feature.id, !enabled);
                    }
                }));
            }
            const body = (0, dom_1.append)(content, (0, dom_1.$)('.feature-body'));
            const bodyContent = (0, dom_1.$)('.feature-body-content');
            const scrollableContent = this._register(new scrollableElement_1.DomScrollableElement(bodyContent, {}));
            (0, dom_1.append)(body, scrollableContent.getDomNode());
            this.layoutParticipants.push({ layout: () => scrollableContent.scanDomNode() });
            scrollableContent.scanDomNode();
            if (this.feature.description) {
                const description = (0, dom_1.append)(bodyContent, (0, dom_1.$)('.feature-description'));
                description.textContent = this.feature.description;
            }
            const accessData = this.extensionFeaturesManagementService.getAccessData(this.extensionId, this.feature.id);
            if (accessData?.current?.status) {
                (0, dom_1.append)(bodyContent, (0, dom_1.$)('.feature-status', undefined, (0, dom_1.$)(`span${themables_1.ThemeIcon.asCSSSelector(accessData.current.status.severity === severity_1.default.Error ? extensionsIcons_1.errorIcon : accessData.current.status.severity === severity_1.default.Warning ? extensionsIcons_1.warningIcon : extensionsIcons_1.infoIcon)}`, undefined), (0, dom_1.$)('span', undefined, accessData.current.status.message)));
            }
            const featureContentElement = (0, dom_1.append)(bodyContent, (0, dom_1.$)('.feature-content'));
            if (this.feature.renderer) {
                const renderer = this.instantiationService.createInstance(this.feature.renderer);
                if (renderer.type === 'table') {
                    this.renderTableData(featureContentElement, renderer);
                }
                else if (renderer.type === 'markdown') {
                    this.renderMarkdownData(featureContentElement, renderer);
                }
            }
        }
        updateButtonLabel(button) {
            button.label = this.extensionFeaturesManagementService.isEnabled(this.extensionId, this.feature.id) ? (0, nls_1.localize)('revoke', "Revoke Access") : (0, nls_1.localize)('enable', "Allow Access");
        }
        renderTableData(container, renderer) {
            const tableData = this._register(renderer.render(this.manifest));
            const tableDisposable = this._register(new lifecycle_1.MutableDisposable());
            if (tableData.onDidChange) {
                this._register(tableData.onDidChange(data => {
                    (0, dom_1.clearNode)(container);
                    tableDisposable.value = this.renderTable(data, container);
                }));
            }
            tableDisposable.value = this.renderTable(tableData.data, container);
        }
        renderTable(tableData, container) {
            const disposables = new lifecycle_1.DisposableStore();
            (0, dom_1.append)(container, (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, ...tableData.headers.map(header => (0, dom_1.$)('th', undefined, header))), ...tableData.rows
                .map(row => {
                return (0, dom_1.$)('tr', undefined, ...row.map(rowData => {
                    if (typeof rowData === 'string') {
                        return (0, dom_1.$)('td', undefined, rowData);
                    }
                    const data = Array.isArray(rowData) ? rowData : [rowData];
                    return (0, dom_1.$)('td', undefined, ...data.map(item => {
                        const result = [];
                        if ((0, htmlContent_1.isMarkdownString)(rowData)) {
                            const element = (0, dom_1.$)('', undefined);
                            this.renderMarkdown(rowData, element);
                            result.push(element);
                        }
                        else if (item instanceof keybindings_1.ResolvedKeybinding) {
                            const element = (0, dom_1.$)('');
                            const kbl = disposables.add(new keybindingLabel_1.KeybindingLabel(element, platform_2.OS, defaultStyles_1.defaultKeybindingLabelStyles));
                            kbl.set(item);
                            result.push(element);
                        }
                        else if (item instanceof color_1.Color) {
                            result.push((0, dom_1.$)('span', { class: 'colorBox', style: 'background-color: ' + color_1.Color.Format.CSS.format(item) }, ''));
                            result.push((0, dom_1.$)('code', undefined, color_1.Color.Format.CSS.formatHex(item)));
                        }
                        return result;
                    }).flat());
                }));
            })));
            return disposables;
        }
        renderMarkdownData(container, renderer) {
            container.classList.add('markdown');
            const markdownData = this._register(renderer.render(this.manifest));
            if (markdownData.onDidChange) {
                this._register(markdownData.onDidChange(data => {
                    (0, dom_1.clearNode)(container);
                    this.renderMarkdown(data, container);
                }));
            }
            this.renderMarkdown(markdownData.data, container);
        }
        renderMarkdown(markdown, container) {
            const { element, dispose } = (0, markdownRenderer_1.renderMarkdown)({
                value: markdown.value,
                isTrusted: markdown.isTrusted,
                supportThemeIcons: true
            }, {
                actionHandler: {
                    callback: (content) => this.openerService.open(content, { allowCommands: !!markdown.isTrusted }).catch(errors_1.onUnexpectedError),
                    disposables: this._store
                },
            });
            this._register((0, lifecycle_1.toDisposable)(dispose));
            (0, dom_1.append)(container, element);
        }
        layout(height, width) {
            this.layoutParticipants.forEach(p => p.layout(height, width));
        }
    };
    ExtensionFeatureView = __decorate([
        __param(3, opener_1.IOpenerService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, extensionFeatures_1.IExtensionFeaturesManagementService),
        __param(6, dialogs_1.IDialogService)
    ], ExtensionFeatureView);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRmVhdHVyZXNUYWIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvYnJvd3Nlci9leHRlbnNpb25GZWF0dXJlc1RhYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQ2hHLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQThCLFNBQVEsc0JBQVU7aUJBRXJDLE9BQUUsR0FBRyxlQUFlLEFBQWxCLENBQW1CO1FBR3JDLFlBQ29CLGdCQUFvRCxFQUNsQyxrQ0FBd0Y7WUFFN0gsS0FBSyxFQUFFLENBQUM7WUFINEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNqQix1Q0FBa0MsR0FBbEMsa0NBQWtDLENBQXFDO1lBSnJILFNBQUksR0FBRyxVQUFVLENBQUM7UUFPM0IsQ0FBQztRQUVELFlBQVksQ0FBQyxRQUE0QjtZQUN4QyxNQUFNLFdBQVcsR0FBRyxJQUFJLGdDQUFtQixDQUFDLElBQUEsd0NBQWMsRUFBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQy9GLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGdDQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDeEcsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztRQUM5QyxDQUFDO1FBRUQsTUFBTSxDQUFDLFFBQTRCO1lBQ2xDLE1BQU0sV0FB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