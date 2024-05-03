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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/countBadge/countBadge", "vs/base/common/lifecycle", "vs/base/common/path", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/search/browser/searchModel", "vs/base/common/resources", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/actions/browser/toolbar", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/serviceCollection", "vs/platform/theme/browser/defaultStyles", "vs/workbench/contrib/search/common/constants", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory"], function (require, exports, DOM, countBadge_1, lifecycle_1, paths, nls, configuration_1, files_1, label_1, workspace_1, searchModel_1, resources_1, actions_1, instantiation_1, toolbar_1, contextkey_1, serviceCollection_1, defaultStyles_1, constants_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    var FolderMatchRenderer_1, FileMatchRenderer_1, MatchRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchAccessibilityProvider = exports.MatchRenderer = exports.FileMatchRenderer = exports.FolderMatchRenderer = exports.SearchDelegate = void 0;
    class SearchDelegate {
        static { this.ITEM_HEIGHT = 22; }
        getHeight(element) {
            return SearchDelegate.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            if (element instanceof searchModel_1.FolderMatch) {
                return FolderMatchRenderer.TEMPLATE_ID;
            }
            else if (element instanceof searchModel_1.FileMatch) {
                return FileMatchRenderer.TEMPLATE_ID;
            }
            else if (element instanceof searchModel_1.Match) {
                return MatchRenderer.TEMPLATE_ID;
            }
            console.error('Invalid search tree element', element);
            throw new Error('Invalid search tree element');
        }
    }
    exports.SearchDelegate = SearchDelegate;
    let FolderMatchRenderer = class FolderMatchRenderer extends lifecycle_1.Disposable {
        static { FolderMatchRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'folderMatch'; }
        constructor(searchView, labels, contextService, labelService, instantiationService, contextKeyService) {
            super();
            this.searchView = searchView;
            this.labels = labels;
            this.contextService = contextService;
            this.labelService = labelService;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.templateId = FolderMatchRenderer_1.TEMPLATE_ID;
        }
        renderCompressedElements(node, index, templateData, height) {
            const compressed = node.element;
            const folder = compressed.elements[compressed.elements.length - 1];
            const label = compressed.elements.map(e => e.name());
            if (folder.resource) {
                const fileKind = (folder instanceof searchModel_1.FolderMatchWorkspaceRoot) ? files_1.FileKind.ROOT_FOLDER : files_1.FileKind.FOLDER;
                templateData.label.setResource({ resource: folder.resource, name: label }, {
                    fileKind,
                    separator: this.labelService.getSeparator(folder.resource.scheme),
                });
            }
            else {
                templateData.label.setLabel(nls.localize('searchFolderMatch.other.label', "Other files"));
            }
            this.renderFolderDetails(folder, templateData);
        }
        renderTemplate(container) {
            const disposables = new lifecycle_1.DisposableStore();
            const folderMatchElement = DOM.append(container, DOM.$('.foldermatch'));
            const label = this.labels.create(folderMatchElement, { supportDescriptionHighlights: true, supportHighlights: true });
            disposables.add(label);
            const badge = new countBadge_1.CountBadge(DOM.append(folderMatchElement, DOM.$('.badge')), {}, defaultStyles_1.defaultCountBadgeStyles);
            const actionBarContainer = DOM.append(folderMatchElement, DOM.$('.actionBarContainer'));
            const elementDisposables = new lifecycle_1.DisposableStore();
            disposables.add(elementDisposables);
            const contextKeyServiceMain = disposables.add(this.contextKeyService.createScoped(container));
            constants_1.SearchContext.MatchFocusKey.bindTo(contextKeyServiceMain).set(false);
            constants_1.SearchContext.FileFocusKey.bindTo(contextKeyServiceMain).set(false);
            constants_1.SearchContext.FolderFocusKey.bindTo(contextKeyServiceMain).set(true);
            const instantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, contextKeyServiceMain]));
            const actions = disposables.add(instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, actionBarContainer, actions_1.MenuId.SearchActionMenu, {
                menuOptions: {
                    shouldForwardArgs: true
                },
                hiddenItemStrategy: 0 /* HiddenItemStrategy.Ignore */,
                toolbarOptions: {
                    primaryGroup: (g) => /^inline/.test(g),
                },
            }));
            return {
                label,
                badge,
                actions,
                disposables,
                elementDisposables,
                contextKeyService: contextKeyServiceMain
            };
        }
        renderElement(node, index, templateData) {
            const folderMatch = node.element;
            if (folderMatch.resource) {
                const workspaceFolder = this.contextService.getWorkspaceFolder(folderMatch.resource);
                if (workspaceFolder && (0, resources_1.isEqual)(workspaceFolder.uri, folderMatch.resource)) {
                    templateData.label.setFile(folderMatch.resource, { fileKind: files_1.FileKind.ROOT_FOLDER, hidePath: true });
                }
                else {
                    templateData.label.setFile(folderMatch.resource, { fileKind: files_1.FileKind.FOLDER, hidePath: this.searchView.isTreeLayoutViewVisible });
                }
            }
            else {
                templateData.label.setLabel(nls.localize('searchFolderMatch.other.label', "Other files"));
            }
            constants_1.SearchContext.IsEditableItemKey.bindTo(templateData.contextKeyService).set(!folderMatch.hasOnlyReadOnlyMatches());
            templateData.elementDisposables.add(folderMatch.onChange(() => {
                constants_1.SearchContext.IsEditableItemKey.bindTo(templateData.contextKeyService).set(!folderMatch.hasOnlyReadOnlyMatches());
            }));
            this.renderFolderDetails(folderMatch, templateData);
        }
        disposeElement(element, index, templateData) {
            templateData.elementDisposables.clear();
        }
        disposeCompressedElements(node, index, templateData, height) {
            templateData.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
        renderFolderDetails(folder, templateData) {
            const count = folder.recursiveMatchCount();
            templateData.badge.setCount(count);
            templateData.badge.setTitleFormat(count > 1 ? nls.localize('searchFileMatches', "{0} files found", count) : nls.localize('searchFileMatch', "{0} file found", count));
            templateData.actions.context = { viewer: this.searchView.getControl(), element: folder };
        }
    };
    exports.FolderMatchRenderer = FolderMatchRenderer;
    exports.FolderMatchRenderer = FolderMatchRenderer = FolderMatchRenderer_1 = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, label_1.ILabelService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService)
    ], FolderMatchRenderer);
    let FileMatchRenderer = class FileMatchRenderer extends lifecycle_1.Disposable {
        static { FileMatchRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'fileMatch'; }
        constructor(searchView, labels, contextService, configurationService, instantiationService, contextKeyService) {
            super();
            this.searchView = searchView;
            this.labels = labels;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.templateId = FileMatchRenderer_1.TEMPLATE_ID;
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible.');
        }
        renderTemplate(container) {
            const disposables = new lifecycle_1.DisposableStore();
            const elementDisposables = new lifecycle_1.DisposableStore();
            disposables.add(elementDisposables);
            const fileMatchElement = DOM.append(container, DOM.$('.filematch'));
            const label = this.labels.create(fileMatchElement);
            disposables.add(label);
            const badge = new countBadge_1.CountBadge(DOM.append(fileMatchElement, DOM.$('.badge')), {}, defaultStyles_1.defaultCountBadgeStyles);
            const actionBarContainer = DOM.append(fileMatchElement, DOM.$('.actionBarContainer'));
            const contextKeyServiceMain = disposables.add(this.contextKeyService.createScoped(container));
            constants_1.SearchContext.MatchFocusKey.bindTo(contextKeyServiceMain).set(false);
            constants_1.SearchContext.FileFocusKey.bindTo(contextKeyServiceMain).set(true);
            constants_1.SearchContext.FolderFocusKey.bindTo(contextKeyServiceMain).set(false);
            const instantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, contextKeyServiceMain]));
            const actions = disposables.add(instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, actionBarContainer, actions_1.MenuId.SearchActionMenu, {
                menuOptions: {
                    shouldForwardArgs: true
                },
                hiddenItemStrategy: 0 /* HiddenItemStrategy.Ignore */,
                toolbarOptions: {
                    primaryGroup: (g) => /^inline/.test(g),
                },
            }));
            return {
                el: fileMatchElement,
                label,
                badge,
                actions,
                disposables,
                elementDisposables,
                contextKeyService: contextKeyServiceMain
            };
        }
        renderElement(node, index, templateData) {
            const fileMatch = node.element;
            templateData.el.setAttribute('data-resource', fileMatch.resource.toString());
            const decorationConfig = this.configurationService.getValue('search').decorations;
            templateData.label.setFile(fileMatch.resource, { hidePath: this.searchView.isTreeLayoutViewVisible && !(fileMatch.parent() instanceof searchModel_1.FolderMatchNoRoot), hideIcon: false, fileDecorations: { colors: decorationConfig.colors, badges: decorationConfig.badges } });
            const count = fileMatch.count();
            templateData.badge.setCount(count);
            templateData.badge.setTitleFormat(count > 1 ? nls.localize('searchMatches', "{0} matches found", count) : nls.localize('searchMatch', "{0} match found", count));
            templateData.actions.context = { viewer: this.searchView.getControl(), element: fileMatch };
            constants_1.SearchContext.IsEditableItemKey.bindTo(templateData.contextKeyService).set(!fileMatch.hasOnlyReadOnlyMatches());
            templateData.elementDisposables.add(fileMatch.onChange(() => {
                constants_1.SearchContext.IsEditableItemKey.bindTo(templateData.contextKeyService).set(!fileMatch.hasOnlyReadOnlyMatches());
            }));
            // when hidesExplorerArrows: true, then the file nodes should still have a twistie because it would otherwise
            // be hard to tell whether the node is collapsed or expanded.
            const twistieContainer = templateData.el.parentElement?.parentElement?.querySelector('.monaco-tl-twistie');
            twistieContainer?.classList.add('force-twistie');
        }
        disposeElement(element, index, templateData) {
            templateData.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    exports.FileMatchRenderer = FileMatchRenderer;
    exports.FileMatchRenderer = FileMatchRenderer = FileMatchRenderer_1 = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService)
    ], FileMatchRenderer);
    let MatchRenderer = class MatchRenderer extends lifecycle_1.Disposable {
        static { MatchRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'match'; }
        constructor(searchView, contextService, configurationService, instantiationService, contextKeyService) {
            super();
            this.searchView = searchView;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.templateId = MatchRenderer_1.TEMPLATE_ID;
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible.');
        }
        renderTemplate(container) {
            container.classList.add('linematch');
            const lineNumber = DOM.append(container, DOM.$('span.matchLineNum'));
            const parent = DOM.append(container, DOM.$('a.plain.match'));
            const before = DOM.append(parent, DOM.$('span'));
            const match = DOM.append(parent, DOM.$('span.findInFileMatch'));
            const replace = DOM.append(parent, DOM.$('span.replaceMatch'));
            const after = DOM.append(parent, DOM.$('span'));
            const actionBarContainer = DOM.append(container, DOM.$('span.actionBarContainer'));
            const disposables = new lifecycle_1.DisposableStore();
            const contextKeyServiceMain = disposables.add(this.contextKeyService.createScoped(container));
            constants_1.SearchContext.MatchFocusKey.bindTo(contextKeyServiceMain).set(true);
            constants_1.SearchContext.FileFocusKey.bindTo(contextKeyServiceMain).set(false);
            constants_1.SearchContext.FolderFocusKey.bindTo(contextKeyServiceMain).set(false);
            const instantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, contextKeyServiceMain]));
            const actions = disposables.add(instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, actionBarContainer, actions_1.MenuId.SearchActionMenu, {
                menuOptions: {
                    shouldForwardArgs: true
                },
                hiddenItemStrategy: 0 /* HiddenItemStrategy.Ignore */,
                toolbarOptions: {
                    primaryGroup: (g) => /^inline/.test(g),
                },
            }));
            return {
                parent,
                before,
                match,
                replace,
                after,
                lineNumber,
                actions,
                disposables,
                contextKeyService: contextKeyServiceMain
            };
        }
        renderElement(node, index, templateData) {
            const match = node.element;
            const preview = match.preview();
            const replace = this.searchView.model.isReplaceActive() &&
                !!this.searchView.model.replaceString &&
                !(match instanceof searchModel_1.MatchInNotebook && match.isReadonly());
            templateData.before.textContent = preview.before;
            templateData.match.textContent = preview.inside;
            templateData.match.classList.toggle('replace', replace);
            templateData.replace.textContent = replace ? match.replaceString : '';
            templateData.after.textContent = preview.after;
            const title = (preview.fullBefore + (replace ? match.replaceString : preview.inside) + preview.after).trim().substr(0, 999);
            templateData.disposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), templateData.parent, title));
            constants_1.SearchContext.IsEditableItemKey.bindTo(templateData.contextKeyService).set(!(match instanceof searchModel_1.MatchInNotebook && match.isReadonly()));
            const numLines = match.range().endLineNumber - match.range().startLineNumber;
            const extraLinesStr = numLines > 0 ? `+${numLines}` : '';
            const showLineNumbers = this.configurationService.getValue('search').showLineNumbers;
            const lineNumberStr = showLineNumbers ? `${match.range().startLineNumber}:` : '';
            templateData.lineNumber.classList.toggle('show', (numLines > 0) || showLineNumbers);
            templateData.lineNumber.textContent = lineNumberStr + extraLinesStr;
            templateData.disposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), templateData.lineNumber, this.getMatchTitle(match, showLineNumbers)));
            templateData.actions.context = { viewer: this.searchView.getControl(), element: match };
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
        getMatchTitle(match, showLineNumbers) {
            const startLine = match.range().startLineNumber;
            const numLines = match.range().endLineNumber - match.range().startLineNumber;
            const lineNumStr = showLineNumbers ?
                nls.localize('lineNumStr', "From line {0}", startLine, numLines) + ' ' :
                '';
            const numLinesStr = numLines > 0 ?
                '+ ' + nls.localize('numLinesStr', "{0} more lines", numLines) :
                '';
            return lineNumStr + numLinesStr;
        }
    };
    exports.MatchRenderer = MatchRenderer;
    exports.MatchRenderer = MatchRenderer = MatchRenderer_1 = __decorate([
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextkey_1.IContextKeyService)
    ], MatchRenderer);
    let SearchAccessibilityProvider = class SearchAccessibilityProvider {
        constructor(searchView, labelService) {
            this.searchView = searchView;
            this.labelService = labelService;
        }
        getWidgetAriaLabel() {
            return nls.localize('search', "Search");
        }
        getAriaLabel(element) {
            if (element instanceof searchModel_1.FolderMatch) {
                const count = element.allDownstreamFileMatches().reduce((total, current) => total + current.count(), 0);
                return element.resource ?
                    nls.localize('folderMatchAriaLabel', "{0} matches in folder root {1}, Search result", count, element.name()) :
                    nls.localize('otherFilesAriaLabel', "{0} matches outside of the workspace, Search result", count);
            }
            if (element instanceof searchModel_1.FileMatch) {
                const path = this.labelService.getUriLabel(element.resource, { relative: true }) || element.resource.fsPath;
                return nls.localize('fileMatchAriaLabel', "{0} matches in file {1} of folder {2}, Search result", element.count(), element.name(), paths.dirname(path));
            }
            if (element instanceof searchModel_1.Match) {
                const match = element;
                const searchModel = this.searchView.model;
                const replace = searchModel.isReplaceActive() && !!searchModel.replaceString;
                const matchString = match.getMatchString();
                const range = match.range();
                const matchText = match.text().substr(0, range.endColumn + 150);
                if (replace) {
                    return nls.localize('replacePreviewResultAria', "'{0}' at column {1} replace {2} with {3}", matchText, range.startColumn, matchString, match.replaceString);
                }
                return nls.localize('searchResultAria', "'{0}' at column {1} found {2}", matchText, range.startColumn, matchString);
            }
            return null;
        }
    };
    exports.SearchAccessibilityProvider = SearchAccessibilityProvider;
    exports.SearchAccessibilityProvider = SearchAccessibilityProvider = __decorate([
        __param(1, label_1.ILabelService)
    ], SearchAccessibilityProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoUmVzdWx0c1ZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9icm93c2VyL3NlYXJjaFJlc3VsdHNWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUErRGhHLE1BQWEsY0FBYztpQkFFWixnQkFBVyxHQUFHLEVBQUUsQ0FBQztRQUUvQixTQUFTLENBQUMsT0FBd0I7WUFDakMsT0FBTyxjQUFjLENBQUMsV0FBVyxDQUFDO1FBQ25DLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBd0I7WUFDckMsSUFBSSxPQUFPLFlBQVkseUJBQVcsRUFBRSxDQUFDO2dCQUNwQyxPQUFPLG1CQUFtQixDQUFDLFdBQVcsQ0FBQztZQUN4QyxDQUFDO2lCQUFNLElBQUksT0FBTyxZQUFZLHVCQUFTLEVBQUUsQ0FBQztnQkFDekMsT0FBTyxpQkFBaUIsQ0FBQyxXQUFXLENBQUM7WUFDdEMsQ0FBQztpQkFBTSxJQUFJLE9BQU8sWUFBWSxtQkFBSyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sYUFBYSxDQUFDLFdBQVcsQ0FBQztZQUNsQyxDQUFDO1lBRUQsT0FBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN0RCxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDaEQsQ0FBQzs7SUFuQkYsd0NBb0JDO0lBQ00sSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTs7aUJBQ2xDLGdCQUFXLEdBQUcsYUFBYSxBQUFoQixDQUFpQjtRQUk1QyxZQUNTLFVBQXNCLEVBQ3RCLE1BQXNCLEVBQ0osY0FBa0QsRUFDN0QsWUFBNEMsRUFDcEMsb0JBQTRELEVBQy9ELGlCQUFzRDtZQUUxRSxLQUFL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