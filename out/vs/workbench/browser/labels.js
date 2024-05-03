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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/resources", "vs/base/browser/ui/iconLabel/iconLabel", "vs/editor/common/languages/language", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/editor/common/services/model", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/decorations/common/decorations", "vs/base/common/network", "vs/platform/files/common/files", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/platform/label/common/label", "vs/editor/common/services/getIconClasses", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/labels", "vs/workbench/services/notebook/common/notebookDocumentService"], function (require, exports, nls_1, uri_1, resources_1, iconLabel_1, language_1, workspace_1, configuration_1, model_1, textfiles_1, decorations_1, network_1, files_1, themeService_1, event_1, label_1, getIconClasses_1, lifecycle_1, instantiation_1, labels_1, notebookDocumentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceLabel = exports.ResourceLabels = exports.DEFAULT_LABELS_CONTAINER = void 0;
    function toResource(props) {
        if (!props || !props.resource) {
            return undefined;
        }
        if (uri_1.URI.isUri(props.resource)) {
            return props.resource;
        }
        return props.resource.primary;
    }
    exports.DEFAULT_LABELS_CONTAINER = {
        onDidChangeVisibility: event_1.Event.None
    };
    let ResourceLabels = class ResourceLabels extends lifecycle_1.Disposable {
        constructor(container, instantiationService, configurationService, modelService, workspaceService, languageService, decorationsService, themeService, labelService, textFileService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.modelService = modelService;
            this.workspaceService = workspaceService;
            this.languageService = languageService;
            this.decorationsService = decorationsService;
            this.themeService = themeService;
            this.labelService = labelService;
            this.textFileService = textFileService;
            this._onDidChangeDecorations = this._register(new event_1.Emitter());
            this.onDidChangeDecorations = this._onDidChangeDecorations.event;
            this.widgets = [];
            this.labels = [];
            this.registerListeners(container);
        }
        registerListeners(container) {
            // notify when visibility changes
            this._register(container.onDidChangeVisibility(visible => {
                this.widgets.forEach(widget => widget.notifyVisibilityChanged(visible));
            }));
            // notify when extensions are registered with potentially new languages
            this._register(this.languageService.onDidChange(() => this.widgets.forEach(widget => widget.notifyExtensionsRegistered())));
            // notify when model language changes
            this._register(this.modelService.onModelLanguageChanged(e => {
                if (!e.model.uri) {
                    return; // we need the resource to compare
                }
                this.widgets.forEach(widget => widget.notifyModelLanguageChanged(e.model));
            }));
            // notify when model is added
            this._register(this.modelService.onModelAdded(model => {
                if (!model.uri) {
                    return; // we need the resource to compare
                }
                this.widgets.forEach(widget => widget.notifyModelAdded(model));
            }));
            // notify when workspace folders changes
            this._register(this.workspaceService.onDidChangeWorkspaceFolders(() => {
                this.widgets.forEach(widget => widget.notifyWorkspaceFoldersChange());
            }));
            // notify when file decoration changes
            this._register(this.decorationsService.onDidChangeDecorations(e => {
                let notifyDidChangeDecorations = false;
                this.widgets.forEach(widget => {
                    if (widget.notifyFileDecorationsChanges(e)) {
                        notifyDidChangeDecorations = true;
                    }
                });
                if (notifyDidChangeDecorations) {
                    this._onDidChangeDecorations.fire();
                }
            }));
            // notify when theme changes
            this._register(this.themeService.onDidColorThemeChange(() => this.widgets.forEach(widget => widget.notifyThemeChange())));
            // notify when files.associations changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(files_1.FILES_ASSOCIATIONS_CONFIG)) {
                    this.widgets.forEach(widget => widget.notifyFileAssociationsChange());
                }
            }));
            // notify when label formatters change
            this._register(this.labelService.onDidChangeFormatters(e => {
                this.widgets.forEach(widget => widget.notifyFormattersChange(e.scheme));
            }));
            // notify when untitled labels change
            this._register(this.textFileService.untitled.onDidChangeLabel(model => {
                this.widgets.forEach(widget => widget.notifyUntitledLabelChange(model.resource));
            }));
        }
        get(index) {
            return this.labels[index];
        }
        create(container, options) {
            const widget = this.instantiationService.createInstance(ResourceLabelWidget, container, options);
            // Only expose a handle to the outside
            const label = {
                element: widget.element,
                onDidRender: widget.onDidRender,
                setLabel: (label, description, options) => widget.setLabel(label, description, options),
                setResource: (label, options) => widget.setResource(label, options),
                setFile: (resource, options) => widget.setFile(resource, options),
                clear: () => widget.clear(),
                dispose: () => this.disposeWidget(widget)
            };
            // Store
            this.labels.push(label);
            this.widgets.push(widget);
            return label;
        }
        disposeWidget(widget) {
            const index = this.widgets.indexOf(widget);
            if (index > -1) {
                this.widgets.splice(index, 1);
                this.labels.splice(index, 1);
            }
            (0, lifecycle_1.dispose)(widget);
        }
        clear() {
            this.widgets = (0, lifecycle_1.dispose)(this.widgets);
            this.labels = [];
        }
        dispose() {
            super.dispose();
            this.clear();
        }
    };
    exports.ResourceLabels = ResourceLabels;
    exports.ResourceLabels = ResourceLabels = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, model_1.IModelService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, language_1.ILanguageService),
        __param(6, decorations_1.IDecorationsService),
        __param(7, themeService_1.IThemeService),
        __param(8, label_1.ILabelService),
        __param(9, textfiles_1.ITextFileService)
    ], ResourceLabels);
    /**
     * Note: please consider to use `ResourceLabels` if you are in need
     * of more than one label for your widget.
     */
    let ResourceLabel = class ResourceLabel extends ResourceLabels {
        get element() { return this.label; }
        constructor(container, options, instantiationService, configurationService, modelService, workspaceService, languageService, decorationsService, themeService, labelService, textFileService) {
            super(exports.DEFAULT_LABELS_CONTAINER, instantiationService, configurationService, modelService, workspaceService, languageService, decorationsService, themeService, labelService, textFileService);
            this.label = this._register(this.create(container, options));
        }
    };
    exports.ResourceLabel = ResourceLabel;
    exports.ResourceLabel = ResourceLabel = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, model_1.IModelService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, language_1.ILanguageService),
        __param(7, decorations_1.IDecorationsService),
        __param(8, themeService_1.IThemeService),
        __param(9, label_1.ILabelService),
        __param(10, textfiles_1.ITextFileService)
    ], ResourceLabel);
    var Redraw;
    (function (Redraw) {
        Redraw[Redraw["Basic"] = 1] = "Basic";
        Redraw[Redraw["Full"] = 2] = "Full";
    })(Redraw || (Redraw = {}));
    let ResourceLabelWidget = class ResourceLabelWidget extends iconLabel_1.IconLabel {
        constructor(container, options, languageService, modelService, decorationsService, labelService, textFileService, contextService, notebookDocumentService) {
            super(container, options);
            this.languageService = languageService;
            this.modelService = modelService;
            this.decorationsService = decorationsService;
            this.labelService = labelService;
            this.textFileService = textFileService;
            this.contextService = contextService;
            this.notebookDocumentService = notebookDocumentService;
            this._onDidRender = this._register(new event_1.Emitter());
            this.onDidRender = this._onDidRender.event;
            this.label = undefined;
            this.decoration = this._register(new lifecycle_1.MutableDisposable());
            this.options = undefined;
            this.computedIconClasses = undefined;
            this.computedLanguageId = undefined;
            this.computedPathLabel = undefined;
            this.computedWorkspaceFolderLabel = undefined;
            this.needsRedraw = undefined;
            this.isHidden = false;
        }
        notifyVisibilityChanged(visible) {
            if (visible === this.isHidden) {
                this.isHidden = !visible;
                if (visible && this.needsRedraw) {
                    this.render({
                        updateIcon: this.needsRedraw === Redraw.Full,
                        updateDecoration: this.needsRedraw === Redraw.Full
                    });
                    this.needsRedraw = undefined;
                }
            }
        }
        notifyModelLanguageChanged(model) {
            this.handleModelEvent(model);
        }
        notifyModelAdded(model) {
            this.handleModelEvent(model);
        }
        handleModelEvent(model) {
            const resource = toResource(this.label);
            if (!resource) {
                return; // only update if resource exists
            }
            if ((0, resources_1.isEqual)(model.uri, resource)) {
                if (this.computedLanguageId !== model.getLanguageId()) {
                    this.computedLanguageId = model.getLanguageId();
                    this.render({ updateIcon: true, updateDecoration: false }); // update if the language id of the model has changed from our last known state
                }
            }
        }
        notifyFileDecorationsChanges(e) {
            if (!this.options) {
                return false;
            }
            const resource = toResource(this.label);
            if (!resource) {
                return false;
            }
            if (this.options.fileDecorations && e.affectsResource(resource)) {
                return this.render({ updateIcon: false, updateDecoration: true });
            }
            return false;
        }
        notifyExtensionsRegistered() {
            this.render({ updateIcon: true, updateDecoration: false });
        }
        notifyThemeChange() {
            this.render({ updateIcon: false, updateDecoration: false });
        }
        notifyFileAssociationsChange() {
            this.render({ updateIcon: true, updateDecoration: false });
        }
        notifyFormattersChange(scheme) {
            if (toResource(this.label)?.scheme === scheme) {
                this.render({ updateIcon: false, updateDecoration: false });
            }
        }
        notifyUntitledLabelChange(resource) {
            if ((0, resources_1.isEqual)(resource, toResource(this.label))) {
                this.render({ updateIcon: false, updateDecoration: false });
            }
        }
        notifyWorkspaceFoldersChange() {
            if (typeof this.computedWorkspaceFolderLabel === 'string') {
                const resource = toResource(this.label);
                if (uri_1.URI.isUri(resource) && this.label?.name === this.computedWorkspaceFolderLabel) {
                    this.setFile(resource, this.options);
                }
            }
        }
        setFile(resource, options) {
            const hideLabel = options?.hideLabel;
            let name;
            if (!hideLabel) {
                if (options?.fileKind === files_1.FileKind.ROOT_FOLDER) {
                    const workspaceFolder = this.contextService.getWorkspaceFolder(resource);
                    if (workspaceFolder) {
                        name = workspaceFolder.name;
                        this.computedWorkspaceFolderLabel = name;
                    }
                }
                if (!name) {
                    name = (0, labels_1.normalizeDriveLetter)((0, resources_1.basenameOrAuthority)(resource));
                }
            }
            let description;
            if (!options?.hidePath) {
                description = this.labelService.getUriLabel((0, resources_1.dirname)(resource), { relative: true });
            }
            this.setResource({ resource, name, description, range: options?.range }, options);
        }
        setResource(label, options = Object.create(null)) {
            const resource = toResource(label);
            const isSideBySideEditor = label?.resource && !uri_1.URI.isUri(label.resource);
            if (!options.forceLabel && !isSideBySideEditor && resource?.scheme === network_1.Schemas.untitled) {
                // Untitled labels are very dynamic because they may change
                // whenever the content changes (unless a path is associated).
                // As such we always ask the actual editor for it's name and
                // description to get latest in case name/description are
                // provided. If they are not provided from the label we got
                // we assume that the client does not want to display them
                // and as such do not override.
                //
                // We do not touch the label if it represents a primary-secondary
                // because in that case we expect it to carry a proper label
                // and description.
                const untitledModel = this.textFileService.untitled.get(resource);
                if (untitledModel && !untitledModel.hasAssociatedFilePath) {
                    if (typeof label.name === 'string') {
                        label.name = untitledModel.name;
                    }
                    if (typeof label.description === 'string') {
                        const untitledDescription = untitledModel.resource.path;
                        if (label.name !== untitledDescription) {
                            label.description = untitledDescription;
                        }
                        else {
                            label.description = undefined;
                        }
                    }
                    const untitledTitle = untitledModel.resource.path;
                    if (untitledModel.name !== untitledTitle) {
                        options.title = `${untitledModel.name} • ${untitledTitle}`;
                    }
                    else {
                        options.title = untitledTitle;
                    }
                }
            }
            if (!options.forceLabel && !isSideBySideEditor && resource?.scheme === network_1.Schemas.vscodeNotebookCell) {
                // Notebook cells are embeded in a notebook document
                // As such we always ask the actual notebook document
                // for its position in the document.
                const notebookDocument = this.notebookDocumentService.getNotebook(resource);
                const cellIndex = notebookDocument?.getCellIndex(resource);
                if (notebookDocument && cellIndex !== undefined && typeof label.name === 'string') {
                    options.title = (0, nls_1.localize)('notebookCellLabel', "{0} • Cell {1}", label.name, `${cellIndex + 1}`);
                }
                if (typeof label.name === 'string' && notebookDocument && cellIndex !== undefined && typeof label.name === 'string') {
                    label.name = (0, nls_1.localize)('notebookCellLabel', "{0} • Cell {1}", label.name, `${cellIndex + 1}`);
                }
            }
            const hasResourceChanged = this.hasResourceChanged(label);
            const hasPathLabelChanged = hasResourceChanged || this.hasPathLabelChanged(label);
            const hasFileKindChanged = this.hasFileKindChanged(options);
            const hasIconChanged = this.hasIconChanged(options);
            this.label = label;
            this.options = options;
            if (hasResourceChanged) {
                this.computedLanguageId = undefined; // reset computed language since resource changed
            }
            if (hasPathLabelChanged) {
                this.computedPathLabel = undefined; // reset path label due to resource/path-label change
            }
            this.render({
                updateIcon: hasResourceChanged || hasFileKindChanged || hasIconChanged,
                updateDecoration: hasResourceChanged || hasFileKindChanged
            });
        }
        hasFileKindChanged(newOptions) {
            const newFileKind = newOptions?.fileKind;
            const oldFileKind = this.options?.fileKind;
            return newFileKind !== oldFileKind; // same resource but different kind (file, folder)
        }
        hasResourceChanged(newLabel) {
            const newResource = toResource(newLabel);
            const oldResource = toResource(this.label);
            if (newResource && oldResource) {
                return newResource.toString() !== oldResource.toString();
            }
            if (!newResource && !oldResource) {
                return false;
            }
            return true;
        }
        hasPathLabelChanged(newLabel) {
            const newResource = toResource(newLabel);
            return !!newResource && this.computedPathLabel !== this.labelService.getUriLabel(newResource);
        }
        hasIconChanged(newOptions) {
            return this.options?.icon !== newOptions?.icon;
        }
        clear() {
            this.label = undefined;
            this.options = undefined;
            this.computedLanguageId = undefined;
            this.computedIconClasses = undefined;
            this.computedPathLabel = undefined;
            this.setLabel('');
        }
        render(options) {
            if (this.isHidden) {
                if (this.needsRedraw !== Redraw.Full) {
                    this.needsRedraw = (options.updateIcon || options.updateDecoration) ? Redraw.Full : Redraw.Basic;
                }
                return false;
            }
            if (options.updateIcon) {
                this.computedIconClasses = undefined;
            }
            if (!this.label) {
                return false;
            }
            const iconLabelOptions = {
                title: '',
                italic: this.options?.italic,
                strikethrough: this.options?.strikethrough,
                matches: this.options?.matches,
                descriptionMatches: this.options?.descriptionMatches,
                extraClasses: [],
                separator: this.options?.separator,
                domId: this.options?.domId,
                disabledCommand: this.options?.disabledCommand,
                labelEscapeNewLines: this.options?.labelEscapeNewLines,
                descriptionTitle: this.options?.descriptionTitle,
            };
            const resource = toResource(this.label);
            if (this.options?.title !== undefined) {
                iconLabelOptions.title = this.options.title;
            }
            if (resource && resource.scheme !== network_1.Schemas.data /* do not accidentally inline Data URIs */
                && ((!this.options?.title)
                    || ((typeof this.options.title !== 'string') && !this.options.title.markdownNotSupportedFallback))) {
                if (!this.computedPathLabel) {
                    this.computedPathLabel = this.labelService.getUriLabel(resource);
                }
                if (!iconLabelOptions.title || (typeof iconLabelOptions.title === 'string')) {
                    iconLabelOptions.title = this.computedPathLabel;
                }
                else if (!iconLabelOptions.title.markdownNotSupportedFallback) {
                    iconLabelOptions.title.markdownNotSupportedFallback = this.computedPathLabel;
                }
            }
            if (this.options && !this.options.hideIcon) {
                if (!this.computedIconClasses) {
                    this.computedIconClasses = (0, getIconClasses_1.getIconClasses)(this.modelService, this.languageService, resource, this.options.fileKind, this.options.icon);
                }
                iconLabelOptions.extraClasses = this.computedIconClasses.slice(0);
            }
            if (this.options?.extraClasses) {
                iconLabelOptions.extraClasses.push(...this.options.extraClasses);
            }
            if (this.options?.fileDecorations && resource) {
                if (options.updateDecoration) {
                    this.decoration.value = this.decorationsService.getDecoration(resource, this.options.fileKind !== files_1.FileKind.FILE);
                }
                const decoration = this.decoration.value;
                if (decoration) {
                    if (decoration.tooltip) {
                        if (typeof iconLabelOptions.title === 'string') {
                            iconLabelOptions.title = `${iconLabelOptions.title} • ${decoration.tooltip}`;
                        }
                        else if (typeof iconLabelOptions.title?.markdown === 'string') {
                            const title = `${iconLabelOptions.title.markdown} • ${decoration.tooltip}`;
                            iconLabelOptions.title = { markdown: title, markdownNotSupportedFallback: title };
                        }
                    }
                    if (decoration.strikethrough) {
                        iconLabelOptions.strikethrough = true;
                    }
                    if (this.options.fileDecorations.colors) {
                        iconLabelOptions.extraClasses.push(decoration.labelClassName);
                    }
                    if (this.options.fileDecorations.badges) {
                        iconLabelOptions.extraClasses.push(decoration.badgeClassName);
                        iconLabelOptions.extraClasses.push(decoration.iconClassName);
                    }
                }
            }
            if (this.label.range) {
                iconLabelOptions.suffix = this.label.range.startLineNumber !== this.label.range.endLineNumber ?
                    `:${this.label.range.startLineNumber}-${this.label.range.endLineNumber}` :
                    `:${this.label.range.startLineNumber}`;
            }
            this.setLabel(this.label.name ?? '', this.label.description, iconLabelOptions);
            this._onDidRender.fire();
            return true;
        }
        dispose() {
            super.dispose();
            this.label = undefined;
            this.options = undefined;
            this.computedLanguageId = undefined;
            this.computedIconClasses = undefined;
            this.computedPathLabel = undefined;
            this.computedWorkspaceFolderLabel = undefined;
        }
    };
    ResourceLabelWidget = __decorate([
        __param(2, language_1.ILanguageService),
        __param(3, model_1.IModelService),
        __param(4, decorations_1.IDecorationsService),
        __param(5, label_1.ILabelService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, workspace_1.IWorkspaceContextService),
        __param(8, notebookDocumentService_1.INotebookDocumentService)
    ], ResourceLabelWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFiZWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9sYWJlbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUNoRyxTQUFTLFVBQVUsQ0FBQyxLQUFzQztRQUN6RCxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQy9CLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDL0IsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO0lBQy9CLENBQUM7SUFnRVksUUFBQSx3QkFBd0IsR0FBNkI7UUFDakUscUJBQXFCLEVBQUUsYUFBSyxDQUFDLElBQUk7S0FDakMsQ0FBQztJQUVLLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxzQkFBVTtRQVE3QyxZQUNDLFNBQW1DLEVBQ1osb0JBQTRELEVBQzVELG9CQUE0RCxFQUNwRSxZQUE0QyxFQUNqQyxnQkFBMkQsRUFDbkUsZUFBa0QsRUFDL0Msa0JBQXdELEVBQzlELFlBQTRDLEVBQzVDLFlBQTRDLEVBQ3pDLGVBQWtEO1lBRXBFLEtBQUssRUFBRSxDQUFDO1lBVmdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNuRCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNoQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQTBCO1lBQ2xELG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUM5Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzdDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQzNCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ3hCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQWhCcEQsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDdEUsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQztZQUU3RCxZQUFPLEdBQTBCLEVBQUUsQ0FBQztZQUNwQyxXQUFNLEdBQXFCLEVBQUUsQ0FBQztZQWdCckMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxTQUFtQztZQUU1RCxpQ0FBaUM7WUFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ3hELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDekUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLHVFQUF1RTtZQUN2RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFNUgscUNBQXFDO1lBQ3JDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDM0QsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ2xCLE9BQU8sQ0FBQyxrQ0FBa0M7Z0JBQzNDLENBQUM7Z0JBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDNUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLDZCQUE2QjtZQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNyRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNoQixPQUFPLENBQUMsa0NBQWtDO2dCQUMzQyxDQUFDO2dCQUVELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDaEUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLHdDQUF3QztZQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3JFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQztZQUN2RSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosc0NBQXNDO1lBQ3RDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNqRSxJQUFJLDBCQUEwQixHQUFHLEtBQUssQ0FBQztnQkFDdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQzdCLElBQUksTUFBTSxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQzVDLDBCQUEwQixHQUFHLElBQUksQ0FBQztvQkFDbkMsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztnQkFFSCxJQUFJLDBCQUEwQixFQUFFLENBQUM7b0JBQ2hDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDckMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiw0QkFBNEI7WUFDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFMUgseUNBQXlDO1lBQ3pDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyRSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxpQ0FBeUIsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQztnQkFDdkUsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixzQ0FBc0M7WUFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMxRCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN6RSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUoscUNBQXFDO1lBQ3JDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ3JFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsR0FBRyxDQUFDLEtBQWE7WUFDaEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLENBQUM7UUFFRCxNQUFNLENBQUMsU0FBc0IsRUFBRSxPQUFtQztZQUNqRSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1CQUFtQixFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVqRyxzQ0FBc0M7WUFDdEMsTUFBTSxLQUFLLEdBQW1CO2dCQUM3QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87Z0JBQ3ZCLFdBQVcsRUFBRSxNQUFNLENBQUMsV0FBVztnQkFDL0IsUUFBUSxFQUFFLENBQUMsS0FBYSxFQUFFLFdBQW9CLEVBQUUsT0FBZ0MsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQztnQkFDakksV0FBVyxFQUFFLENBQUMsS0FBMEIsRUFBRSxPQUErQixFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUM7Z0JBQ2hILE9BQU8sRUFBRSxDQUFDLFFBQWEsRUFBRSxPQUEyQixFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUM7Z0JBQzFGLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO2dCQUMzQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7YUFDekMsQ0FBQztZQUVGLFFBQVE7WUFDUixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUUxQixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTyxhQUFhLENBQUMsTUFBMkI7WUFDaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0MsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUVELElBQUEsbUJBQU8sRUFBQyxNQUFNLENBQUMsQ0FBQztRQUNqQixDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBQSxtQkFBTyxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNsQixDQUFDO1FBRVEsT0FBTztZQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVoQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDZCxDQUFDO0tBQ0QsQ0FBQTtJQTFJWSx3Q0FBYzs2QkFBZCxjQUFjO1FBVXhCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLG9DQUF3QixDQUFBO1FBQ3hCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLDRCQUFhLENBQUE7UUFDYixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLDRCQUFnQixDQUFBO09BbEJOLGNBQWMsQ0EwSTFCO0lBRUQ7OztPQUdHO0lBQ0ksSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYyxTQUFRLGNBQWM7UUFHaEQsSUFBSSxPQUFPLEtBQXFCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFcEQsWUFDQyxTQUFzQixFQUN0QixPQUE4QyxFQUN2QixvQkFBMkMsRUFDM0Msb0JBQTJDLEVBQ25ELFlBQTJCLEVBQ2hCLGdCQUEwQyxFQUNsRCxlQUFpQyxFQUM5QixrQkFBdUMsRUFDN0MsWUFBMkIsRUFDM0IsWUFBMkIsRUFDeEIsZUFBaUM7WUFFbkQsS0FBSyxDQUFDLGdDQUF3QixFQUFFLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztZQUU5TCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO0tBQ0QsQ0FBQTtJQXRCWSxzQ0FBYTs0QkFBYixhQUFhO1FBUXZCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLG9DQUF3QixDQUFBO1FBQ3hCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLDRCQUFhLENBQUE7UUFDYixXQUFBLHFCQUFhLENBQUE7UUFDYixZQUFBLDRCQUFnQixDQUFBO09BaEJOLGFBQWEsQ0FzQnpCO0lBRUQsSUFBSyxNQUdKO0lBSEQsV0FBSyxNQUFNO1FBQ1YscUNBQVMsQ0FBQTtRQUNULG1DQUFRLENBQUE7SUFDVCxDQUFDLEVBSEksTUFBTSxLQUFOLE1BQU0sUUFHVjtJQUVELElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEscUJBQVM7UUFpQjFDLFlBQ0MsU0FBc0IsRUFDdEIsT0FBOEMsRUFDNUIsZUFBa0QsRUFDckQsWUFBNEMsRUFDdEMsa0JBQXdELEVBQzlELFlBQTRDLEVBQ3pDLGVBQWtELEVBQzFDLGNBQXlELEVBQ3pELHVCQUFrRTtZQUU1RixLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBUlMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3BDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ3JCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDN0MsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDeEIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3pCLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUN4Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBeEI1RSxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzNELGdCQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFdkMsVUFBSyxHQUFvQyxTQUFTLENBQUM7WUFDbkQsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBZSxDQUFDLENBQUM7WUFDbEUsWUFBTyxHQUFzQyxTQUFTLENBQUM7WUFFdkQsd0JBQW1CLEdBQXlCLFNBQVMsQ0FBQztZQUN0RCx1QkFBa0IsR0FBdUIsU0FBUyxDQUFDO1lBQ25ELHNCQUFpQixHQUF1QixTQUFTLENBQUM7WUFDbEQsaUNBQTRCLEdBQXVCLFNBQVMsQ0FBQztZQUU3RCxnQkFBVyxHQUF1QixTQUFTLENBQUM7WUFDNUMsYUFBUSxHQUFZLEtBQUssQ0FBQztRQWNsQyxDQUFDO1FBRUQsdUJBQXVCLENBQUMsT0FBZ0I7WUFDdkMsSUFBSSxPQUFPLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsT0FBTyxDQUFDO2dCQUV6QixJQUFJLE9BQU8sSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUM7d0JBQ1gsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLEtBQUssTUFBTSxDQUFDLElBQUk7d0JBQzVDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxXQUFXLEtBQUssTUFBTSxDQUFDLElBQUk7cUJBQ2xELENBQUMsQ0FBQztvQkFFSCxJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsMEJBQTBCLENBQUMsS0FBaUI7WUFDM0MsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxLQUFpQjtZQUNqQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVPLGdCQUFnQixDQUFDLEtBQWlCO1lBQ3pDLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE9BQU8sQ0FBQyxpQ0FBaUM7WUFDMUMsQ0FBQztZQUVELElBQUksSUFBQSxtQkFBTyxFQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEtBQUssS0FBSyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUM7b0JBQ3ZELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ2hELElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQywrRUFBK0U7Z0JBQzVJLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELDRCQUE0QixDQUFDLENBQWlDO1lBQzdELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLElBQUksQ0FBQyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNqRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDbkUsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELDBCQUEwQjtZQUN6QixJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxpQkFBaUI7WUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRUQsNEJBQTRCO1lBQzNCLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUVELHNCQUFzQixDQUFDLE1BQWM7WUFDcEMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLE1BQU0sS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUM3RCxDQUFDO1FBQ0YsQ0FBQztRQUVELHlCQUF5QixDQUFDLFFBQWE7WUFDdEMsSUFBSSxJQUFBLG1CQUFPLEVBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQzdELENBQUM7UUFDRixDQUFDO1FBRUQsNEJBQTRCO1lBQzNCLElBQUksT0FBTyxJQUFJLENBQUMsNEJBQTRCLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzNELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztvQkFDbkYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLENBQUMsUUFBYSxFQUFFLE9BQTJCO1lBQ2pELE1BQU0sU0FBUyxHQUFHLE9BQU8sRUFBRSxTQUFTLENBQUM7WUFDckMsSUFBSSxJQUF3QixDQUFDO1lBQzdCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxPQUFPLEVBQUUsUUFBUSxLQUFLLGdCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2hELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3pFLElBQUksZUFBZSxFQUFFLENBQUM7d0JBQ3JCLElBQUksR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDO3dCQUM1QixJQUFJLENBQUMsNEJBQTRCLEdBQUcsSUFBSSxDQUFDO29CQUMxQyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLElBQUksR0FBRyxJQUFBLDZCQUFvQixFQUFDLElBQUEsK0JBQW1CLEVBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLFdBQStCLENBQUM7WUFDcEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQztnQkFDeEIsV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLElBQUEsbUJBQU8sRUFBQyxRQUFRLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3BGLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBRUQsV0FBVyxDQUFDLEtBQTBCLEVBQUUsVUFBaUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDM0YsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLE1BQU0sa0JBQWtCLEdBQUcsS0FBSyxFQUFFLFFBQVEsSUFBSSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXpFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLENBQUMsa0JBQWtCLElBQUksUUFBUSxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN6RiwyREFBMkQ7Z0JBQzNELDhEQUE4RDtnQkFDOUQsNERBQTREO2dCQUM1RCx5REFBeUQ7Z0JBQ3pELDJEQUEyRDtnQkFDM0QsMERBQTBEO2dCQUMxRCwrQkFBK0I7Z0JBQy9CLEVBQUU7Z0JBQ0YsaUVBQWlFO2dCQUNqRSw0REFBNEQ7Z0JBQzVELG1CQUFtQjtnQkFDbkIsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLGFBQWEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUMzRCxJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQzt3QkFDcEMsS0FBSyxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDO29CQUNqQyxDQUFDO29CQUVELElBQUksT0FBTyxLQUFLLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUMzQyxNQUFNLG1CQUFtQixHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO3dCQUN4RCxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssbUJBQW1CLEVBQUUsQ0FBQzs0QkFDeEMsS0FBSyxDQUFDLFdBQVcsR0FBRyxtQkFBbUIsQ0FBQzt3QkFDekMsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLEtBQUssQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO3dCQUMvQixDQUFDO29CQUNGLENBQUM7b0JBRUQsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7b0JBQ2xELElBQUksYUFBYSxDQUFDLElBQUksS0FBSyxhQUFhLEVBQUUsQ0FBQzt3QkFDMUMsT0FBTyxDQUFDLEtBQUssR0FBRyxHQUFHLGFBQWEsQ0FBQyxJQUFJLE1BQU0sYUFBYSxFQUFFLENBQUM7b0JBQzVELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxPQUFPLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQztvQkFDL0IsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLENBQUMsa0JBQWtCLElBQUksUUFBUSxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ25HLG9EQUFvRDtnQkFDcEQscURBQXFEO2dCQUNyRCxvQ0FBb0M7Z0JBQ3BDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLGdCQUFnQixJQUFJLFNBQVMsS0FBSyxTQUFTLElBQUksT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNuRixPQUFPLENBQUMsS0FBSyxHQUFHLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDakcsQ0FBQztnQkFFRCxJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksZ0JBQWdCLElBQUksU0FBUyxLQUFLLFNBQVMsSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ3JILEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM5RixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFELE1BQU0sbUJBQW1CLEdBQUcsa0JBQWtCLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzVELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFcEQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFFdkIsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsU0FBUyxDQUFDLENBQUMsaURBQWlEO1lBQ3ZGLENBQUM7WUFFRCxJQUFJLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUMsQ0FBQyxxREFBcUQ7WUFDMUYsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ1gsVUFBVSxFQUFFLGtCQUFrQixJQUFJLGtCQUFrQixJQUFJLGNBQWM7Z0JBQ3RFLGdCQUFnQixFQUFFLGtCQUFrQixJQUFJLGtCQUFrQjthQUMxRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sa0JBQWtCLENBQUMsVUFBa0M7WUFDNUQsTUFBTSxXQUFXLEdBQUcsVUFBVSxFQUFFLFFBQVEsQ0FBQztZQUN6QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztZQUUzQyxPQUFPLFdBQVcsS0FBSyxXQUFXLENBQUMsQ0FBQyxrREFBa0Q7UUFDdkYsQ0FBQztRQUVPLGtCQUFrQixDQUFDLFFBQTZCO1lBQ3ZELE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QyxNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTNDLElBQUksV0FBVyxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNoQyxPQUFPLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDMUQsQ0FBQztZQUVELElBQUksQ0FBQyxXQUFXLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU8sbUJBQW1CLENBQUMsUUFBNkI7WUFDeEQsTUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXpDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0YsQ0FBQztRQUVPLGNBQWMsQ0FBQyxVQUFrQztZQUN4RCxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxLQUFLLFVBQVUsRUFBRSxJQUFJLENBQUM7UUFDaEQsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztZQUN2QixJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQztZQUN6QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsU0FBUyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxTQUFTLENBQUM7WUFDckMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztZQUVuQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ25CLENBQUM7UUFFTyxNQUFNLENBQUMsT0FBMkQ7WUFDekUsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25CLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUNsRyxDQUFDO2dCQUVELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsbUJBQW1CLEdBQUcsU0FBUyxDQUFDO1lBQ3RDLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLGdCQUFnQixHQUF3RDtnQkFDN0UsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTTtnQkFDNUIsYUFBYSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsYUFBYTtnQkFDMUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTztnQkFDOUIsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxrQkFBa0I7Z0JBQ3BELFlBQVksRUFBRSxFQUFFO2dCQUNoQixTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTO2dCQUNsQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLO2dCQUMxQixlQUFlLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxlQUFlO2dCQUM5QyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLG1CQUFtQjtnQkFDdEQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0I7YUFDaEQsQ0FBQztZQUVGLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFeEMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDdkMsZ0JBQWdCLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQzdDLENBQUM7WUFFRCxJQUFJLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxDQUFDLDBDQUEwQzttQkFDdkYsQ0FDRixDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUM7dUJBQ25CLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FDakcsRUFBRSxDQUFDO2dCQUVKLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNsRSxDQUFDO2dCQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLGdCQUFnQixDQUFDLEtBQUssS0FBSyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUM3RSxnQkFBZ0IsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO2dCQUNqRCxDQUFDO3FCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztvQkFDakUsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztnQkFDOUUsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQy9CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFBLCtCQUFjLEVBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4SSxDQUFDO2dCQUVELGdCQUFnQixDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25FLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUM7Z0JBQ2hDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2xFLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsZUFBZSxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUM5QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsS0FBSyxnQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsSCxDQUFDO2dCQUVELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO2dCQUN6QyxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNoQixJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDeEIsSUFBSSxPQUFPLGdCQUFnQixDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQzs0QkFDaEQsZ0JBQWdCLENBQUMsS0FBSyxHQUFHLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxNQUFNLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDOUUsQ0FBQzs2QkFBTSxJQUFJLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQzs0QkFDakUsTUFBTSxLQUFLLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxNQUFNLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs0QkFDM0UsZ0JBQWdCLENBQUMsS0FBSyxHQUFHLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSw0QkFBNEIsRUFBRSxLQUFLLEVBQUUsQ0FBQzt3QkFDbkYsQ0FBQztvQkFDRixDQUFDO29CQUVELElBQUksVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDO3dCQUM5QixnQkFBZ0IsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO29CQUN2QyxDQUFDO29CQUVELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3pDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUMvRCxDQUFDO29CQUVELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3pDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDO3dCQUM5RCxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDOUQsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDdEIsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDOUYsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztvQkFDMUUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN6QyxDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUUvRSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXpCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVRLE9BQU87WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7WUFDdkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7WUFDekIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQztZQUNwQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsU0FBUyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUM7WUFDbkMsSUFBSSxDQUFDLDRCQUE0QixHQUFHLFNBQVMsQ0FBQztRQUMvQyxDQUFDO0tBQ0QsQ0FBQTtJQTlYSyxtQkFBbUI7UUFvQnRCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLDRCQUFnQixDQUFBO1FBQ2hCLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSxrREFBd0IsQ0FBQTtPQTFCckIsbUJBQW1CLENBOFh4QiJ9