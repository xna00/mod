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
define(["require", "exports", "vs/editor/common/services/resolverService", "vs/base/common/filters", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/editor/common/core/range", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/editor/common/model/textModel", "vs/workbench/contrib/bulkEdit/browser/preview/bulkEditPreview", "vs/platform/files/common/files", "vs/nls", "vs/platform/label/common/label", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/resources", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/undoRedo/common/undoRedo", "vs/editor/browser/services/bulkEditService", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/language", "vs/editor/common/languages/modesRegistry", "vs/editor/contrib/snippet/browser/snippetParser"], function (require, exports, resolverService_1, filters_1, highlightedLabel_1, range_1, dom, lifecycle_1, textModel_1, bulkEditPreview_1, files_1, nls_1, label_1, iconLabel_1, resources_1, themeService_1, themables_1, strings_1, uri_1, undoRedo_1, bulkEditService_1, languageConfigurationRegistry_1, language_1, modesRegistry_1, snippetParser_1) {
    "use strict";
    var CategoryElementRenderer_1, FileElementRenderer_1, TextEditElementRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkEditNaviLabelProvider = exports.BulkEditDelegate = exports.TextEditElementRenderer = exports.FileElementRenderer = exports.CategoryElementRenderer = exports.BulkEditIdentityProvider = exports.BulkEditAccessibilityProvider = exports.BulkEditSorter = exports.BulkEditDataSource = exports.TextEditElement = exports.FileElement = exports.CategoryElement = void 0;
    exports.compareBulkFileOperations = compareBulkFileOperations;
    class CategoryElement {
        constructor(parent, category) {
            this.parent = parent;
            this.category = category;
        }
        isChecked() {
            const model = this.parent;
            let checked = true;
            for (const file of this.category.fileOperations) {
                for (const edit of file.originalEdits.values()) {
                    checked = checked && model.checked.isChecked(edit);
                }
            }
            return checked;
        }
        setChecked(value) {
            const model = this.parent;
            for (const file of this.category.fileOperations) {
                for (const edit of file.originalEdits.values()) {
                    model.checked.updateChecked(edit, value);
                }
            }
        }
    }
    exports.CategoryElement = CategoryElement;
    class FileElement {
        constructor(parent, edit) {
            this.parent = parent;
            this.edit = edit;
        }
        isChecked() {
            const model = this.parent instanceof CategoryElement ? this.parent.parent : this.parent;
            let checked = true;
            // only text edit children -> reflect children state
            if (this.edit.type === 1 /* BulkFileOperationType.TextEdit */) {
                checked = !this.edit.textEdits.every(edit => !model.checked.isChecked(edit.textEdit));
            }
            // multiple file edits -> reflect single state
            for (const edit of this.edit.originalEdits.values()) {
                if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                    checked = checked && model.checked.isChecked(edit);
                }
            }
            // multiple categories and text change -> read all elements
            if (this.parent instanceof CategoryElement && this.edit.type === 1 /* BulkFileOperationType.TextEdit */) {
                for (const category of model.categories) {
                    for (const file of category.fileOperations) {
                        if (file.uri.toString() === this.edit.uri.toString()) {
                            for (const edit of file.originalEdits.values()) {
                                if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                                    checked = checked && model.checked.isChecked(edit);
                                }
                            }
                        }
                    }
                }
            }
            return checked;
        }
        setChecked(value) {
            const model = this.parent instanceof CategoryElement ? this.parent.parent : this.parent;
            for (const edit of this.edit.originalEdits.values()) {
                model.checked.updateChecked(edit, value);
            }
            // multiple categories and file change -> update all elements
            if (this.parent instanceof CategoryElement && this.edit.type !== 1 /* BulkFileOperationType.TextEdit */) {
                for (const category of model.categories) {
                    for (const file of category.fileOperations) {
                        if (file.uri.toString() === this.edit.uri.toString()) {
                            for (const edit of file.originalEdits.values()) {
                                model.checked.updateChecked(edit, value);
                            }
                        }
                    }
                }
            }
        }
        isDisabled() {
            if (this.parent instanceof CategoryElement && this.edit.type === 1 /* BulkFileOperationType.TextEdit */) {
                const model = this.parent.parent;
                let checked = true;
                for (const category of model.categories) {
                    for (const file of category.fileOperations) {
                        if (file.uri.toString() === this.edit.uri.toString()) {
                            for (const edit of file.originalEdits.values()) {
                                if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                                    checked = checked && model.checked.isChecked(edit);
                                }
                            }
                        }
                    }
                }
                return !checked;
            }
            return false;
        }
    }
    exports.FileElement = FileElement;
    class TextEditElement {
        constructor(parent, idx, edit, prefix, selecting, inserting, suffix) {
            this.parent = parent;
            this.idx = idx;
            this.edit = edit;
            this.prefix = prefix;
            this.selecting = selecting;
            this.inserting = inserting;
            this.suffix = suffix;
        }
        isChecked() {
            let model = this.parent.parent;
            if (model instanceof CategoryElement) {
                model = model.parent;
            }
            return model.checked.isChecked(this.edit.textEdit);
        }
        setChecked(value) {
            let model = this.parent.parent;
            if (model instanceof CategoryElement) {
                model = model.parent;
            }
            // check/uncheck this element
            model.checked.updateChecked(this.edit.textEdit, value);
            // make sure parent is checked when this element is checked...
            if (value) {
                for (const edit of this.parent.edit.originalEdits.values()) {
                    if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                        model.checked.updateChecked(edit, value);
                    }
                }
            }
        }
        isDisabled() {
            return this.parent.isDisabled();
        }
    }
    exports.TextEditElement = TextEditElement;
    // --- DATA SOURCE
    let BulkEditDataSource = class BulkEditDataSource {
        constructor(_textModelService, _undoRedoService, _languageService, _languageConfigurationService) {
            this._textModelService = _textModelService;
            this._undoRedoService = _undoRedoService;
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            this.groupByFile = true;
        }
        hasChildren(element) {
            if (element instanceof FileElement) {
                return element.edit.textEdits.length > 0;
            }
            if (element instanceof TextEditElement) {
                return false;
            }
            return true;
        }
        async getChildren(element) {
            // root -> file/text edits
            if (element instanceof bulkEditPreview_1.BulkFileOperations) {
                return this.groupByFile
                    ? element.fileOperations.map(op => new FileElement(element, op))
                    : element.categories.map(cat => new CategoryElement(element, cat));
            }
            // category
            if (element instanceof CategoryElement) {
                return Array.from(element.category.fileOperations, op => new FileElement(element, op));
            }
            // file: text edit
            if (element instanceof FileElement && element.edit.textEdits.length > 0) {
                // const previewUri = BulkEditPreviewProvider.asPreviewUri(element.edit.resource);
                let textModel;
                let textModelDisposable;
                try {
                    const ref = await this._textModelService.createModelReference(element.edit.uri);
                    textModel = ref.object.textEditorModel;
                    textModelDisposable = ref;
                }
                catch {
                    textModel = new textModel_1.TextModel('', modesRegistry_1.PLAINTEXT_LANGUAGE_ID, textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, null, this._undoRedoService, this._languageService, this._languageConfigurationService);
                    textModelDisposable = textModel;
                }
                const result = element.edit.textEdits.map((edit, idx) => {
                    const range = textModel.validateRange(edit.textEdit.textEdit.range);
                    //prefix-math
                    const startTokens = textModel.tokenization.getLineTokens(range.startLineNumber);
                    let prefixLen = 23; // default value for the no tokens/grammar case
                    for (let idx = startTokens.findTokenIndexAtOffset(range.startColumn - 1) - 1; prefixLen < 50 && idx >= 0; idx--) {
                        prefixLen = range.startColumn - startTokens.getStartOffset(idx);
                    }
                    //suffix-math
                    const endTokens = textModel.tokenization.getLineTokens(range.endLineNumber);
                    let suffixLen = 0;
                    for (let idx = endTokens.findTokenIndexAtOffset(range.endColumn - 1); suffixLen < 50 && idx < endTokens.getCount(); idx++) {
                        suffixLen += endTokens.getEndOffset(idx) - endTokens.getStartOffset(idx);
                    }
                    return new TextEditElement(element, idx, edit, textModel.getValueInRange(new range_1.Range(range.startLineNumber, range.startColumn - prefixLen, range.startLineNumber, range.startColumn)), textModel.getValueInRange(range), !edit.textEdit.textEdit.insertAsSnippet ? edit.textEdit.textEdit.text : snippetParser_1.SnippetParser.asInsertText(edit.textEdit.textEdit.text), textModel.getValueInRange(new range_1.Range(range.endLineNumber, range.endColumn, range.endLineNumber, range.endColumn + suffixLen)));
                });
                textModelDisposable.dispose();
                return result;
            }
            return [];
        }
    };
    exports.BulkEditDataSource = BulkEditDataSource;
    exports.BulkEditDataSource = BulkEditDataSource = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, undoRedo_1.IUndoRedoService),
        __param(2, language_1.ILanguageService),
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], BulkEditDataSource);
    class BulkEditSorter {
        compare(a, b) {
            if (a instanceof FileElement && b instanceof FileElement) {
                return compareBulkFileOperations(a.edit, b.edit);
            }
            if (a instanceof TextEditElement && b instanceof TextEditElement) {
                return range_1.Range.compareRangesUsingStarts(a.edit.textEdit.textEdit.range, b.edit.textEdit.textEdit.range);
            }
            return 0;
        }
    }
    exports.BulkEditSorter = BulkEditSorter;
    function compareBulkFileOperations(a, b) {
        return (0, strings_1.compare)(a.uri.toString(), b.uri.toString());
    }
    // --- ACCESSI
    let BulkEditAccessibilityProvider = class BulkEditAccessibilityProvider {
        constructor(_labelService) {
            this._labelService = _labelService;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('bulkEdit', "Bulk Edit");
        }
        getRole(_element) {
            return 'checkbox';
        }
        getAriaLabel(element) {
            if (element instanceof FileElement) {
                if (element.edit.textEdits.length > 0) {
                    if (element.edit.type & 8 /* BulkFileOperationType.Rename */ && element.edit.newUri) {
                        return (0, nls_1.localize)('aria.renameAndEdit', "Renaming {0} to {1}, also making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }), this._labelService.getUriLabel(element.edit.newUri, { relative: true }));
                    }
                    else if (element.edit.type & 2 /* BulkFileOperationType.Create */) {
                        return (0, nls_1.localize)('aria.createAndEdit', "Creating {0}, also making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                    else if (element.edit.type & 4 /* BulkFileOperationType.Delete */) {
                        return (0, nls_1.localize)('aria.deleteAndEdit', "Deleting {0}, also making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                    else {
                        return (0, nls_1.localize)('aria.editOnly', "{0}, making text edits", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                }
                else {
                    if (element.edit.type & 8 /* BulkFileOperationType.Rename */ && element.edit.newUri) {
                        return (0, nls_1.localize)('aria.rename', "Renaming {0} to {1}", this._labelService.getUriLabel(element.edit.uri, { relative: true }), this._labelService.getUriLabel(element.edit.newUri, { relative: true }));
                    }
                    else if (element.edit.type & 2 /* BulkFileOperationType.Create */) {
                        return (0, nls_1.localize)('aria.create', "Creating {0}", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                    else if (element.edit.type & 4 /* BulkFileOperationType.Delete */) {
                        return (0, nls_1.localize)('aria.delete', "Deleting {0}", this._labelService.getUriLabel(element.edit.uri, { relative: true }));
                    }
                }
            }
            if (element instanceof TextEditElement) {
                if (element.selecting.length > 0 && element.inserting.length > 0) {
                    // edit: replace
                    return (0, nls_1.localize)('aria.replace', "line {0}, replacing {1} with {2}", element.edit.textEdit.textEdit.range.startLineNumber, element.selecting, element.inserting);
                }
                else if (element.selecting.length > 0 && element.inserting.length === 0) {
                    // edit: delete
                    return (0, nls_1.localize)('aria.del', "line {0}, removing {1}", element.edit.textEdit.textEdit.range.startLineNumber, element.selecting);
                }
                else if (element.selecting.length === 0 && element.inserting.length > 0) {
                    // edit: insert
                    return (0, nls_1.localize)('aria.insert', "line {0}, inserting {1}", element.edit.textEdit.textEdit.range.startLineNumber, element.selecting);
                }
            }
            return null;
        }
    };
    exports.BulkEditAccessibilityProvider = BulkEditAccessibilityProvider;
    exports.BulkEditAccessibilityProvider = BulkEditAccessibilityProvider = __decorate([
        __param(0, label_1.ILabelService)
    ], BulkEditAccessibilityProvider);
    // --- IDENT
    class BulkEditIdentityProvider {
        getId(element) {
            if (element instanceof FileElement) {
                return element.edit.uri + (element.parent instanceof CategoryElement ? JSON.stringify(element.parent.category.metadata) : '');
            }
            else if (element instanceof TextEditElement) {
                return element.parent.edit.uri.toString() + element.idx;
            }
            else {
                return JSON.stringify(element.category.metadata);
            }
        }
    }
    exports.BulkEditIdentityProvider = BulkEditIdentityProvider;
    // --- RENDERER
    class CategoryElementTemplate {
        constructor(container) {
            container.classList.add('category');
            this.icon = document.createElement('div');
            container.appendChild(this.icon);
            this.label = new iconLabel_1.IconLabel(container);
        }
    }
    let CategoryElementRenderer = class CategoryElementRenderer {
        static { CategoryElementRenderer_1 = this; }
        static { this.id = 'CategoryElementRenderer'; }
        constructor(_themeService) {
            this._themeService = _themeService;
            this.templateId = CategoryElementRenderer_1.id;
        }
        renderTemplate(container) {
            return new CategoryElementTemplate(container);
        }
        renderElement(node, _index, template) {
            template.icon.style.setProperty('--background-dark', null);
            template.icon.style.setProperty('--background-light', null);
            template.icon.style.color = '';
            const { metadata } = node.element.category;
            if (themables_1.ThemeIcon.isThemeIcon(metadata.iconPath)) {
                // css
                const className = themables_1.ThemeIcon.asClassName(metadata.iconPath);
                template.icon.className = className ? `theme-icon ${className}` : '';
                template.icon.style.color = metadata.iconPath.color ? this._themeService.getColorTheme().getColor(metadata.iconPath.color.id)?.toString() ?? '' : '';
            }
            else if (uri_1.URI.isUri(metadata.iconPath)) {
                // background-image
                template.icon.className = 'uri-icon';
                template.icon.style.setProperty('--background-dark', dom.asCSSUrl(metadata.iconPath));
                template.icon.style.setProperty('--background-light', dom.asCSSUrl(metadata.iconPath));
            }
            else if (metadata.iconPath) {
                // background-image
                template.icon.className = 'uri-icon';
                template.icon.style.setProperty('--background-dark', dom.asCSSUrl(metadata.iconPath.dark));
                template.icon.style.setProperty('--background-light', dom.asCSSUrl(metadata.iconPath.light));
            }
            template.label.setLabel(metadata.label, metadata.description, {
                descriptionMatches: (0, filters_1.createMatches)(node.filterData),
            });
        }
        disposeTemplate(template) {
            template.label.dispose();
        }
    };
    exports.CategoryElementRenderer = CategoryElementRenderer;
    exports.CategoryElementRenderer = CategoryElementRenderer = CategoryElementRenderer_1 = __decorate([
        __param(0, themeService_1.IThemeService)
    ], CategoryElementRenderer);
    let FileElementTemplate = class FileElementTemplate {
        constructor(container, resourceLabels, _labelService) {
            this._labelService = _labelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._localDisposables = new lifecycle_1.DisposableStore();
            this._checkbox = document.createElement('input');
            this._checkbox.className = 'edit-checkbox';
            this._checkbox.type = 'checkbox';
            this._checkbox.setAttribute('role', 'checkbox');
            container.appendChild(this._checkbox);
            this._label = resourceLabels.create(container, { supportHighlights: true });
            this._details = document.createElement('span');
            this._details.className = 'details';
            container.appendChild(this._details);
        }
        dispose() {
            this._localDisposables.dispose();
            this._disposables.dispose();
            this._label.dispose();
        }
        set(element, score) {
            this._localDisposables.clear();
            this._checkbox.checked = element.isChecked();
            this._checkbox.disabled = element.isDisabled();
            this._localDisposables.add(dom.addDisposableListener(this._checkbox, 'change', () => {
                element.setChecked(this._checkbox.checked);
            }));
            if (element.edit.type & 8 /* BulkFileOperationType.Rename */ && element.edit.newUri) {
                // rename: oldName → newName
                this._label.setResource({
                    resource: element.edit.uri,
                    name: (0, nls_1.localize)('rename.label', "{0} → {1}", this._labelService.getUriLabel(element.edit.uri, { relative: true }), this._labelService.getUriLabel(element.edit.newUri, { relative: true })),
                }, {
                    fileDecorations: { colors: true, badges: false }
                });
                this._details.innerText = (0, nls_1.localize)('detail.rename', "(renaming)");
            }
            else {
                // create, delete, edit: NAME
                const options = {
                    matches: (0, filters_1.createMatches)(score),
                    fileKind: files_1.FileKind.FILE,
                    fileDecorations: { colors: true, badges: false },
                    extraClasses: []
                };
                if (element.edit.type & 2 /* BulkFileOperationType.Create */) {
                    this._details.innerText = (0, nls_1.localize)('detail.create', "(creating)");
                }
                else if (element.edit.type & 4 /* BulkFileOperationType.Delete */) {
                    this._details.innerText = (0, nls_1.localize)('detail.del', "(deleting)");
                    options.extraClasses.push('delete');
                }
                else {
                    this._details.innerText = '';
                }
                this._label.setFile(element.edit.uri, options);
            }
        }
    };
    FileElementTemplate = __decorate([
        __param(2, label_1.ILabelService)
    ], FileElementTemplate);
    let FileElementRenderer = class FileElementRenderer {
        static { FileElementRenderer_1 = this; }
        static { this.id = 'FileElementRenderer'; }
        constructor(_resourceLabels, _labelService) {
            this._resourceLabels = _resourceLabels;
            this._labelService = _labelService;
            this.templateId = FileElementRenderer_1.id;
        }
        renderTemplate(container) {
            return new FileElementTemplate(container, this._resourceLabels, this._labelService);
        }
        renderElement(node, _index, template) {
            template.set(node.element, node.filterData);
        }
        disposeTemplate(template) {
            template.dispose();
        }
    };
    exports.FileElementRenderer = FileElementRenderer;
    exports.FileElementRenderer = FileElementRenderer = FileElementRenderer_1 = __decorate([
        __param(1, label_1.ILabelService)
    ], FileElementRenderer);
    let TextEditElementTemplate = class TextEditElementTemplate {
        constructor(container, _themeService) {
            this._themeService = _themeService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._localDisposables = new lifecycle_1.DisposableStore();
            container.classList.add('textedit');
            this._checkbox = document.createElement('input');
            this._checkbox.className = 'edit-checkbox';
            this._checkbox.type = 'checkbox';
            this._checkbox.setAttribute('role', 'checkbox');
            container.appendChild(this._checkbox);
            this._icon = document.createElement('div');
            container.appendChild(this._icon);
            this._label = this._disposables.add(new highlightedLabel_1.HighlightedLabel(container));
        }
        dispose() {
            this._localDisposables.dispose();
            this._disposables.dispose();
        }
        set(element) {
            this._localDisposables.clear();
            this._localDisposables.add(dom.addDisposableListener(this._checkbox, 'change', e => {
                element.setChecked(this._checkbox.checked);
                e.preventDefault();
            }));
            if (element.parent.isChecked()) {
                this._checkbox.checked = element.isChecked();
                this._checkbox.disabled = element.isDisabled();
            }
            else {
                this._checkbox.checked = element.isChecked();
                this._checkbox.disabled = element.isDisabled();
            }
            let value = '';
            value += element.prefix;
            value += element.selecting;
            value += element.inserting;
            value += element.suffix;
            const selectHighlight = { start: element.prefix.length, end: element.prefix.length + element.selecting.length, extraClasses: ['remove'] };
            const insertHighlight = { start: selectHighlight.end, end: selectHighlight.end + element.inserting.length, extraClasses: ['insert'] };
            let title;
            const { metadata } = element.edit.textEdit;
            if (metadata && metadata.description) {
                title = (0, nls_1.localize)('title', "{0} - {1}", metadata.label, metadata.description);
            }
            else if (metadata) {
                title = metadata.label;
            }
            const iconPath = metadata?.iconPath;
            if (!iconPath) {
                this._icon.style.display = 'none';
            }
            else {
                this._icon.style.display = 'block';
                this._icon.style.setProperty('--background-dark', null);
                this._icon.style.setProperty('--background-light', null);
                if (themables_1.ThemeIcon.isThemeIcon(iconPath)) {
                    // css
                    const className = themables_1.ThemeIcon.asClassName(iconPath);
                    this._icon.className = className ? `theme-icon ${className}` : '';
                    this._icon.style.color = iconPath.color ? this._themeService.getColorTheme().getColor(iconPath.color.id)?.toString() ?? '' : '';
                }
                else if (uri_1.URI.isUri(iconPath)) {
                    // background-image
                    this._icon.className = 'uri-icon';
                    this._icon.style.setProperty('--background-dark', dom.asCSSUrl(iconPath));
                    this._icon.style.setProperty('--background-light', dom.asCSSUrl(iconPath));
                }
                else {
                    // background-image
                    this._icon.className = 'uri-icon';
                    this._icon.style.setProperty('--background-dark', dom.asCSSUrl(iconPath.dark));
                    this._icon.style.setProperty('--background-light', dom.asCSSUrl(iconPath.light));
                }
            }
            this._label.set(value, [selectHighlight, insertHighlight], title, true);
            this._icon.title = title || '';
        }
    };
    TextEditElementTemplate = __decorate([
        __param(1, themeService_1.IThemeService)
    ], TextEditElementTemplate);
    let TextEditElementRenderer = class TextEditElementRenderer {
        static { TextEditElementRenderer_1 = this; }
        static { this.id = 'TextEditElementRenderer'; }
        constructor(_themeService) {
            this._themeService = _themeService;
            this.templateId = TextEditElementRenderer_1.id;
        }
        renderTemplate(container) {
            return new TextEditElementTemplate(container, this._themeService);
        }
        renderElement({ element }, _index, template) {
            template.set(element);
        }
        disposeTemplate(_template) { }
    };
    exports.TextEditElementRenderer = TextEditElementRenderer;
    exports.TextEditElementRenderer = TextEditElementRenderer = TextEditElementRenderer_1 = __decorate([
        __param(0, themeService_1.IThemeService)
    ], TextEditElementRenderer);
    class BulkEditDelegate {
        getHeight() {
            return 23;
        }
        getTemplateId(element) {
            if (element instanceof FileElement) {
                return FileElementRenderer.id;
            }
            else if (element instanceof TextEditElement) {
                return TextEditElementRenderer.id;
            }
            else {
                return CategoryElementRenderer.id;
            }
        }
    }
    exports.BulkEditDelegate = BulkEditDelegate;
    class BulkEditNaviLabelProvider {
        getKeyboardNavigationLabel(element) {
            if (element instanceof FileElement) {
                return (0, resources_1.basename)(element.edit.uri);
            }
            else if (element instanceof CategoryElement) {
                return element.category.metadata.label;
            }
            return undefined;
        }
    }
    exports.BulkEditNaviLabelProvider = BulkEditNaviLabelProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0VkaXRUcmVlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9idWxrRWRpdC9icm93c2VyL3ByZXZpZXcvYnVsa0VkaXRUcmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3U2hHLDhEQUVDO0lBblFELE1BQWEsZUFBZTtRQUUzQixZQUNVLE1BQTBCLEVBQzFCLFFBQXNCO1lBRHRCLFdBQU0sR0FBTixNQUFNLENBQW9CO1lBQzFCLGFBQVEsR0FBUixRQUFRLENBQWM7UUFDNUIsQ0FBQztRQUVMLFNBQVM7WUFDUixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzFCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztZQUNuQixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ2pELEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUNoRCxPQUFPLEdBQUcsT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFRCxVQUFVLENBQUMsS0FBYztZQUN4QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzFCLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDakQsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQ2hELEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDMUMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUExQkQsMENBMEJDO0lBRUQsTUFBYSxXQUFXO1FBRXZCLFlBQ1UsTUFBNEMsRUFDNUMsSUFBdUI7WUFEdkIsV0FBTSxHQUFOLE1BQU0sQ0FBc0M7WUFDNUMsU0FBSSxHQUFKLElBQUksQ0FBbUI7UUFDN0IsQ0FBQztRQUVMLFNBQVM7WUFDUixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxZQUFZLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFFeEYsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBRW5CLG9EQUFvRDtZQUNwRCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSwyQ0FBbUMsRUFBRSxDQUFDO2dCQUN2RCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLENBQUM7WUFFRCw4Q0FBOEM7WUFDOUMsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUNyRCxJQUFJLElBQUksWUFBWSxrQ0FBZ0IsRUFBRSxDQUFDO29CQUN0QyxPQUFPLEdBQUcsT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO1lBQ0YsQ0FBQztZQUVELDJEQUEyRDtZQUMzRCxJQUFJLElBQUksQ0FBQyxNQUFNLFlBQVksZUFBZSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSwyQ0FBbUMsRUFBRSxDQUFDO2dCQUNqRyxLQUFLLE1BQU0sUUFBUSxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDekMsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUM7d0JBQzVDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDOzRCQUN0RCxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQ0FDaEQsSUFBSSxJQUFJLFlBQVksa0NBQWdCLEVBQUUsQ0FBQztvQ0FDdEMsT0FBTyxHQUFHLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQ0FDcEQsQ0FBQzs0QkFDRixDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFRCxVQUFVLENBQUMsS0FBYztZQUN4QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxZQUFZLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDeEYsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUNyRCxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELDZEQUE2RDtZQUM3RCxJQUFJLElBQUksQ0FBQyxNQUFNLFlBQVksZUFBZSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSwyQ0FBbUMsRUFBRSxDQUFDO2dCQUNqRyxLQUFLLE1BQU0sUUFBUSxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDekMsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUM7d0JBQzVDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDOzRCQUN0RCxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQ0FDaEQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDOzRCQUMxQyxDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxVQUFVO1lBQ1QsSUFBSSxJQUFJLENBQUMsTUFBTSxZQUFZLGVBQWUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksMkNBQW1DLEVBQUUsQ0FBQztnQkFDakcsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQ2pDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDbkIsS0FBSyxNQUFNLFFBQVEsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3pDLEtBQUssTUFBTSxJQUFJLElBQUksUUFBUSxDQUFDLGNBQWMsRUFBRSxDQUFDO3dCQUM1QyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQzs0QkFDdEQsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0NBQ2hELElBQUksSUFBSSxZQUFZLGtDQUFnQixFQUFFLENBQUM7b0NBQ3RDLE9BQU8sR0FBRyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ3BELENBQUM7NEJBQ0YsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ2pCLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7S0FDRDtJQWpGRCxrQ0FpRkM7SUFFRCxNQUFhLGVBQWU7UUFFM0IsWUFDVSxNQUFtQixFQUNuQixHQUFXLEVBQ1gsSUFBa0IsRUFDbEIsTUFBYyxFQUFXLFNBQWlCLEVBQVcsU0FBaUIsRUFBVyxNQUFjO1lBSC9GLFdBQU0sR0FBTixNQUFNLENBQWE7WUFDbkIsUUFBRyxHQUFILEdBQUcsQ0FBUTtZQUNYLFNBQUksR0FBSixJQUFJLENBQWM7WUFDbEIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUFXLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFBVyxjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQVcsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNyRyxDQUFDO1FBRUwsU0FBUztZQUNSLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQy9CLElBQUksS0FBSyxZQUFZLGVBQWUsRUFBRSxDQUFDO2dCQUN0QyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUN0QixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxVQUFVLENBQUMsS0FBYztZQUN4QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUMvQixJQUFJLEtBQUssWUFBWSxlQUFlLEVBQUUsQ0FBQztnQkFDdEMsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDdEIsQ0FBQztZQUVELDZCQUE2QjtZQUM3QixLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUV2RCw4REFBOEQ7WUFDOUQsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUM1RCxJQUFJLElBQUksWUFBWSxrQ0FBZ0IsRUFBRSxDQUFDO3dCQUNqQixLQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ2hFLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsVUFBVTtZQUNULE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNqQyxDQUFDO0tBQ0Q7SUF2Q0QsMENBdUNDO0lBSUQsa0JBQWtCO0lBRVgsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7UUFJOUIsWUFDb0IsaUJBQXFELEVBQ3RELGdCQUFtRCxFQUNuRCxnQkFBbUQsRUFDdEMsNkJBQTZFO1lBSHhFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDckMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNsQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ3JCLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBK0I7WUFOdEcsZ0JBQVcsR0FBWSxJQUFJLENBQUM7UUFPL0IsQ0FBQztRQUVMLFdBQVcsQ0FBQyxPQUE2QztZQUN4RCxJQUFJLE9BQU8sWUFBWSxXQUFXLEVBQUUsQ0FBQztnQkFDcEMsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFDRCxJQUFJLE9BQU8sWUFBWSxlQUFlLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUE2QztZQUU5RCwwQkFBMEI7WUFDMUIsSUFBSSxPQUFPLFlBQVksb0NBQWtCLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxJQUFJLENBQUMsV0FBVztvQkFDdEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUNoRSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNyRSxDQUFDO1lBRUQsV0FBVztZQUNYLElBQUksT0FBTyxZQUFZLGVBQWUsRUFBRSxDQUFDO2dCQUN4QyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4RixDQUFDO1lBRUQsa0JBQWtCO1lBQ2xCLElBQUksT0FBTyxZQUFZLFdBQVcsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pFLGtGQUFrRjtnQkFDbEYsSUFBSSxTQUFxQixDQUFDO2dCQUMxQixJQUFJLG1CQUFnQyxDQUFDO2dCQUNyQyxJQUFJLENBQUM7b0JBQ0osTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDaEYsU0FBUyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDO29CQUN2QyxtQkFBbUIsR0FBRyxHQUFHLENBQUM7Z0JBQzNCLENBQUM7Z0JBQUMsTUFBTSxDQUFDO29CQUNSLFNBQVMsR0FBRyxJQUFJLHFCQUFTLENBQUMsRUFBRSxFQUFFLHFDQUFxQixFQUFFLHFCQUFTLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUM7b0JBQ2pMLG1CQUFtQixHQUFHLFNBQVMsQ0FBQztnQkFDakMsQ0FBQztnQkFFRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7b0JBQ3ZELE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBRXBFLGFBQWE7b0JBQ2IsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUNoRixJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQywrQ0FBK0M7b0JBQ25FLEtBQUssSUFBSSxHQUFHLEdBQUcsV0FBVyxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVMsR0FBRyxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUNqSCxTQUFTLEdBQUcsS0FBSyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNqRSxDQUFDO29CQUVELGFBQWE7b0JBQ2IsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO29CQUM1RSxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7b0JBQ2xCLEtBQUssSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUUsU0FBUyxHQUFHLEVBQUUsSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUM7d0JBQzNILFNBQVMsSUFBSSxTQUFTLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzFFLENBQUM7b0JBRUQsT0FBTyxJQUFJLGVBQWUsQ0FDekIsT0FBTyxFQUNQLEdBQUcsRUFDSCxJQUFJLEVBQ0osU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxXQUFXLEdBQUcsU0FBUyxFQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQ3BJLFNBQVMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQ2hDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLDZCQUFhLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUMvSCxTQUFTLENBQUMsZUFBZSxDQUFDLElBQUksYUFBSyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FDNUgsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQztnQkFFSCxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDO1lBRUQsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO0tBQ0QsQ0FBQTtJQW5GWSxnREFBa0I7aUNBQWxCLGtCQUFrQjtRQUs1QixXQUFBLG1DQUFpQixDQUFBO1FBQ2pCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSwyQkFBZ0IsQ0FBQTtRQUNoQixXQUFBLDZEQUE2QixDQUFBO09BUm5CLGtCQUFrQixDQW1GOUI7SUFHRCxNQUFhLGNBQWM7UUFFMUIsT0FBTyxDQUFDLENBQWtCLEVBQUUsQ0FBa0I7WUFDN0MsSUFBSSxDQUFDLFlBQVksV0FBVyxJQUFJLENBQUMsWUFBWSxXQUFXLEVBQUUsQ0FBQztnQkFDMUQsT0FBTyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRCxDQUFDO1lBRUQsSUFBSSxDQUFDLFlBQVksZUFBZSxJQUFJLENBQUMsWUFBWSxlQUFlLEVBQUUsQ0FBQztnQkFDbEUsT0FBTyxhQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkcsQ0FBQztZQUVELE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztLQUNEO0lBYkQsd0NBYUM7SUFFRCxTQUFnQix5QkFBeUIsQ0FBQyxDQUFvQixFQUFFLENBQW9CO1FBQ25GLE9BQU8sSUFBQSxpQkFBTyxFQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCxjQUFjO0lBRVAsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBNkI7UUFFekMsWUFBNEMsYUFBNEI7WUFBNUIsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFBSSxDQUFDO1FBRTdFLGtCQUFrQjtZQUNqQixPQUFPLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRUQsT0FBTyxDQUFDLFFBQXlCO1lBQ2hDLE9BQU8sVUFBVSxDQUFDO1FBQ25CLENBQUM7UUFFRCxZQUFZLENBQUMsT0FBd0I7WUFDcEMsSUFBSSxPQUFPLFlBQVksV0FBVyxFQUFFLENBQUM7Z0JBQ3BDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN2QyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSx1Q0FBK0IsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUM3RSxPQUFPLElBQUEsY0FBUSxFQUNkLG9CQUFvQixFQUFFLDZDQUE2QyxFQUNuRSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQzdJLENBQUM7b0JBRUgsQ0FBQzt5QkFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSx1Q0FBK0IsRUFBRSxDQUFDO3dCQUM3RCxPQUFPLElBQUEsY0FBUSxFQUNkLG9CQUFvQixFQUFFLHNDQUFzQyxFQUM1RCxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUNwRSxDQUFDO29CQUVILENBQUM7eUJBQU0sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksdUNBQStCLEVBQUUsQ0FBQzt3QkFDN0QsT0FBTyxJQUFBLGNBQVEsRUFDZCxvQkFBb0IsRUFBRSxzQ0FBc0MsRUFDNUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FDcEUsQ0FBQztvQkFDSCxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsT0FBTyxJQUFBLGNBQVEsRUFDZCxlQUFlLEVBQUUsd0JBQXdCLEVBQ3pDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQ3BFLENBQUM7b0JBQ0gsQ0FBQztnQkFFRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksdUNBQStCLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDN0UsT0FBTyxJQUFBLGNBQVEsRUFDZCxhQUFhLEVBQUUscUJBQXFCLEVBQ3BDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FDN0ksQ0FBQztvQkFFSCxDQUFDO3lCQUFNLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLHVDQUErQixFQUFFLENBQUM7d0JBQzdELE9BQU8sSUFBQSxjQUFRLEVBQ2QsYUFBYSxFQUFFLGNBQWMsRUFDN0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FDcEUsQ0FBQztvQkFFSCxDQUFDO3lCQUFNLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLHVDQUErQixFQUFFLENBQUM7d0JBQzdELE9BQU8sSUFBQSxjQUFRLEVBQ2QsYUFBYSxFQUFFLGNBQWMsRUFDN0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FDcEUsQ0FBQztvQkFDSCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxPQUFPLFlBQVksZUFBZSxFQUFFLENBQUM7Z0JBQ3hDLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNsRSxnQkFBZ0I7b0JBQ2hCLE9BQU8sSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLGtDQUFrQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNqSyxDQUFDO3FCQUFNLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUMzRSxlQUFlO29CQUNmLE9BQU8sSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLHdCQUF3QixFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDaEksQ0FBQztxQkFBTSxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDM0UsZUFBZTtvQkFDZixPQUFPLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSx5QkFBeUIsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3BJLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0tBQ0QsQ0FBQTtJQTVFWSxzRUFBNkI7NENBQTdCLDZCQUE2QjtRQUU1QixXQUFBLHFCQUFhLENBQUE7T0FGZCw2QkFBNkIsQ0E0RXpDO0lBRUQsWUFBWTtJQUVaLE1BQWEsd0JBQXdCO1FBRXBDLEtBQUssQ0FBQyxPQUF3QjtZQUM3QixJQUFJLE9BQU8sWUFBWSxXQUFXLEVBQUUsQ0FBQztnQkFDcEMsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLFlBQVksZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMvSCxDQUFDO2lCQUFNLElBQUksT0FBTyxZQUFZLGVBQWUsRUFBRSxDQUFDO2dCQUMvQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ3pELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRCxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBWEQsNERBV0M7SUFFRCxlQUFlO0lBRWYsTUFBTSx1QkFBdUI7UUFLNUIsWUFBWSxTQUFzQjtZQUNqQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLHFCQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdkMsQ0FBQztLQUNEO0lBRU0sSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7O2lCQUVuQixPQUFFLEdBQVcseUJBQXlCLEFBQXBDLENBQXFDO1FBSXZELFlBQTJCLGFBQTZDO1lBQTVCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBRi9ELGVBQVUsR0FBVyx5QkFBdUIsQ0FBQyxFQUFFLENBQUM7UUFFbUIsQ0FBQztRQUU3RSxjQUFjLENBQUMsU0FBc0I7WUFDcEMsT0FBTyxJQUFJLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCxhQUFhLENBQUMsSUFBNEMsRUFBRSxNQUFjLEVBQUUsUUFBaUM7WUFFNUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzNELFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1RCxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBRS9CLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztZQUMzQyxJQUFJLHFCQUFTLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUM5QyxNQUFNO2dCQUNOLE1BQU0sU0FBUyxHQUFHLHFCQUFTLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0QsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxjQUFjLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JFLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFHdEosQ0FBQztpQkFBTSxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pDLG1CQUFtQjtnQkFDbkIsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDO2dCQUNyQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDdEYsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFeEYsQ0FBQztpQkFBTSxJQUFJLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDOUIsbUJBQW1CO2dCQUNuQixRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUM7Z0JBQ3JDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDM0YsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzlGLENBQUM7WUFFRCxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUU7Z0JBQzdELGtCQUFrQixFQUFFLElBQUEsdUJBQWEsRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2FBQ2xELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxlQUFlLENBQUMsUUFBaUM7WUFDaEQsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQixDQUFDOztJQTlDVywwREFBdUI7c0NBQXZCLHVCQUF1QjtRQU10QixXQUFBLDRCQUFhLENBQUE7T0FOZCx1QkFBdUIsQ0ErQ25DO0lBRUQsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBbUI7UUFTeEIsWUFDQyxTQUFzQixFQUN0QixjQUE4QixFQUNmLGFBQTZDO1lBQTVCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBVjVDLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDckMsc0JBQWlCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFZMUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQztZQUMzQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7WUFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2hELFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXRDLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRTVFLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDcEMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxHQUFHLENBQUMsT0FBb0IsRUFBRSxLQUE2QjtZQUN0RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUMvQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUU7Z0JBQ25GLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksdUNBQStCLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDN0UsNEJBQTRCO2dCQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztvQkFDdkIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRztvQkFDMUIsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2lCQUMxTCxFQUFFO29CQUNGLGVBQWUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtpQkFDaEQsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUVuRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsNkJBQTZCO2dCQUM3QixNQUFNLE9BQU8sR0FBRztvQkFDZixPQUFPLEVBQUUsSUFBQSx1QkFBYSxFQUFDLEtBQUssQ0FBQztvQkFDN0IsUUFBUSxFQUFFLGdCQUFRLENBQUMsSUFBSTtvQkFDdkIsZUFBZSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO29CQUNoRCxZQUFZLEVBQVksRUFBRTtpQkFDMUIsQ0FBQztnQkFDRixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSx1Q0FBK0IsRUFBRSxDQUFDO29CQUN0RCxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ25FLENBQUM7cUJBQU0sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksdUNBQStCLEVBQUUsQ0FBQztvQkFDN0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO29CQUMvRCxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDckMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNoRCxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUF6RUssbUJBQW1CO1FBWXRCLFdBQUEscUJBQWEsQ0FBQTtPQVpWLG1CQUFtQixDQXlFeEI7SUFFTSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFtQjs7aUJBRWYsT0FBRSxHQUFXLHFCQUFxQixBQUFoQyxDQUFpQztRQUluRCxZQUNrQixlQUErQixFQUNqQyxhQUE2QztZQUQzQyxvQkFBZSxHQUFmLGVBQWUsQ0FBZ0I7WUFDaEIsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFKcEQsZUFBVSxHQUFXLHFCQUFtQixDQUFDLEVBQUUsQ0FBQztRQUtqRCxDQUFDO1FBRUwsY0FBYyxDQUFDLFNBQXNCO1lBQ3BDLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDckYsQ0FBQztRQUVELGFBQWEsQ0FBQyxJQUF3QyxFQUFFLE1BQWMsRUFBRSxRQUE2QjtZQUNwRyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCxlQUFlLENBQUMsUUFBNkI7WUFDNUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3BCLENBQUM7O0lBckJXLGtEQUFtQjtrQ0FBbkIsbUJBQW1CO1FBUTdCLFdBQUEscUJBQWEsQ0FBQTtPQVJILG1CQUFtQixDQXNCL0I7SUFFRCxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQVM1QixZQUFZLFNBQXNCLEVBQWlCLGFBQTZDO1lBQTVCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBUC9FLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDckMsc0JBQWlCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFPMUQsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFcEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQztZQUMzQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7WUFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2hELFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXRDLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVsQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksbUNBQWdCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFFRCxHQUFHLENBQUMsT0FBd0I7WUFDM0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBRS9CLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUNsRixPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzNDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2hELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNoRCxDQUFDO1lBRUQsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ2YsS0FBSyxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDeEIsS0FBSyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUM7WUFDM0IsS0FBSyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUM7WUFDM0IsS0FBSyxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFFeEIsTUFBTSxlQUFlLEdBQWUsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDdEosTUFBTSxlQUFlLEdBQWUsRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsZUFBZSxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBRWxKLElBQUksS0FBeUIsQ0FBQztZQUM5QixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDM0MsSUFBSSxRQUFRLElBQUksUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN0QyxLQUFLLEdBQUcsSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM5RSxDQUFDO2lCQUFNLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ3JCLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQ3hCLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxRQUFRLEVBQUUsUUFBUSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ25DLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO2dCQUVuQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFekQsSUFBSSxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUNyQyxNQUFNO29CQUNOLE1BQU0sU0FBUyxHQUFHLHFCQUFTLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNsRCxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLGNBQWMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDbEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBR2pJLENBQUM7cUJBQU0sSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ2hDLG1CQUFtQjtvQkFDbkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDO29CQUNsQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUMxRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUU1RSxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsbUJBQW1CO29CQUNuQixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUM7b0JBQ2xDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUMvRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDbEYsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxlQUFlLEVBQUUsZUFBZSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDaEMsQ0FBQztLQUNELENBQUE7SUE5RkssdUJBQXVCO1FBU1MsV0FBQSw0QkFBYSxDQUFBO09BVDdDLHVCQUF1QixDQThGNUI7SUFFTSxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1Qjs7aUJBRW5CLE9BQUUsR0FBRyx5QkFBeUIsQUFBNUIsQ0FBNkI7UUFJL0MsWUFBMkIsYUFBNkM7WUFBNUIsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFGL0QsZUFBVSxHQUFXLHlCQUF1QixDQUFDLEVBQUUsQ0FBQztRQUVtQixDQUFDO1FBRTdFLGNBQWMsQ0FBQyxTQUFzQjtZQUNwQyxPQUFPLElBQUksdUJBQXVCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRUQsYUFBYSxDQUFDLEVBQUUsT0FBTyxFQUEwQyxFQUFFLE1BQWMsRUFBRSxRQUFpQztZQUNuSCxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxlQUFlLENBQUMsU0FBa0MsSUFBVSxDQUFDOztJQWhCakQsMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFNdEIsV0FBQSw0QkFBYSxDQUFBO09BTmQsdUJBQXVCLENBaUJuQztJQUVELE1BQWEsZ0JBQWdCO1FBRTVCLFNBQVM7WUFDUixPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBd0I7WUFFckMsSUFBSSxPQUFPLFlBQVksV0FBVyxFQUFFLENBQUM7Z0JBQ3BDLE9BQU8sbUJBQW1CLENBQUMsRUFBRSxDQUFDO1lBQy9CLENBQUM7aUJBQU0sSUFBSSxPQUFPLFlBQVksZUFBZSxFQUFFLENBQUM7Z0JBQy9DLE9BQU8sdUJBQXVCLENBQUMsRUFBRSxDQUFDO1lBQ25DLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLHVCQUF1QixDQUFDLEVBQUUsQ0FBQztZQUNuQyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBaEJELDRDQWdCQztJQUdELE1BQWEseUJBQXlCO1FBRXJDLDBCQUEwQixDQUFDLE9BQXdCO1lBQ2xELElBQUksT0FBTyxZQUFZLFdBQVcsRUFBRSxDQUFDO2dCQUNwQyxPQUFPLElBQUEsb0JBQVEsRUFBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLENBQUM7aUJBQU0sSUFBSSxPQUFPLFlBQVksZUFBZSxFQUFFLENBQUM7Z0JBQy9DLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQ3hDLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUFWRCw4REFVQyJ9