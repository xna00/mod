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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/workbench/browser/parts/views/viewPane", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/common/debug", "vs/platform/workspace/common/workspace", "vs/platform/contextkey/common/contextkey", "vs/base/common/labels", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/strings", "vs/base/common/async", "vs/workbench/browser/labels", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/platform/list/browser/listService", "vs/base/common/lifecycle", "vs/base/common/filters", "vs/workbench/contrib/debug/common/debugContentProvider", "vs/platform/label/common/label", "vs/platform/actions/common/actions", "vs/base/common/codicons", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/theme/common/themeService", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/path/common/pathService", "vs/base/browser/ui/tree/abstractTree"], function (require, exports, nls, path_1, viewPane_1, instantiation_1, contextView_1, keybinding_1, configuration_1, baseDebugView_1, debug_1, workspace_1, contextkey_1, labels_1, platform_1, uri_1, strings_1, async_1, labels_2, files_1, editorService_1, listService_1, lifecycle_1, filters_1, debugContentProvider_1, label_1, actions_1, codicons_1, views_1, opener_1, themeService_1, telemetry_1, pathService_1, abstractTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoadedScriptsView = void 0;
    const NEW_STYLE_COMPRESS = true;
    // RFC 2396, Appendix A: https://www.ietf.org/rfc/rfc2396.txt
    const URI_SCHEMA_PATTERN = /^[a-zA-Z][a-zA-Z0-9\+\-\.]+:/;
    class BaseTreeItem {
        constructor(_parent, _label, isIncompressible = false) {
            this._parent = _parent;
            this._label = _label;
            this.isIncompressible = isIncompressible;
            this._children = new Map();
            this._showedMoreThanOne = false;
        }
        updateLabel(label) {
            this._label = label;
        }
        isLeaf() {
            return this._children.size === 0;
        }
        getSession() {
            if (this._parent) {
                return this._parent.getSession();
            }
            return undefined;
        }
        setSource(session, source) {
            this._source = source;
            this._children.clear();
            if (source.raw && source.raw.sources) {
                for (const src of source.raw.sources) {
                    if (src.name && src.path) {
                        const s = new BaseTreeItem(this, src.name);
                        this._children.set(src.path, s);
                        const ss = session.getSource(src);
                        s.setSource(session, ss);
                    }
                }
            }
        }
        createIfNeeded(key, factory) {
            let child = this._children.get(key);
            if (!child) {
                child = factory(this, key);
                this._children.set(key, child);
            }
            return child;
        }
        getChild(key) {
            return this._children.get(key);
        }
        remove(key) {
            this._children.delete(key);
        }
        removeFromParent() {
            if (this._parent) {
                this._parent.remove(this._label);
                if (this._parent._children.size === 0) {
                    this._parent.removeFromParent();
                }
            }
        }
        getTemplateId() {
            return 'id';
        }
        // a dynamic ID based on the parent chain; required for reparenting (see #55448)
        getId() {
            const parent = this.getParent();
            return parent ? `${parent.getId()}/${this.getInternalId()}` : this.getInternalId();
        }
        getInternalId() {
            return this._label;
        }
        // skips intermediate single-child nodes
        getParent() {
            if (this._parent) {
                if (this._parent.isSkipped()) {
                    return this._parent.getParent();
                }
                return this._parent;
            }
            return undefined;
        }
        isSkipped() {
            if (this._parent) {
                if (this._parent.oneChild()) {
                    return true; // skipped if I'm the only child of my parents
                }
                return false;
            }
            return true; // roots are never skipped
        }
        // skips intermediate single-child nodes
        hasChildren() {
            const child = this.oneChild();
            if (child) {
                return child.hasChildren();
            }
            return this._children.size > 0;
        }
        // skips intermediate single-child nodes
        getChildren() {
            const child = this.oneChild();
            if (child) {
                return child.getChildren();
            }
            const array = [];
            for (const child of this._children.values()) {
                array.push(child);
            }
            return array.sort((a, b) => this.compare(a, b));
        }
        // skips intermediate single-child nodes
        getLabel(separateRootFolder = true) {
            const child = this.oneChild();
            if (child) {
                const sep = (this instanceof RootFolderTreeItem && separateRootFolder) ? ' • ' : path_1.posix.sep;
                return `${this._label}${sep}${child.getLabel()}`;
            }
            return this._label;
        }
        // skips intermediate single-child nodes
        getHoverLabel() {
            if (this._source && this._parent && this._parent._source) {
                return this._source.raw.path || this._source.raw.name;
            }
            const label = this.getLabel(false);
            const parent = this.getParent();
            if (parent) {
                const hover = parent.getHoverLabel();
                if (hover) {
                    return `${hover}/${label}`;
                }
            }
            return label;
        }
        // skips intermediate single-child nodes
        getSource() {
            const child = this.oneChild();
            if (child) {
                return child.getSource();
            }
            return this._source;
        }
        compare(a, b) {
            if (a._label && b._label) {
                return a._label.localeCompare(b._label);
            }
            return 0;
        }
        oneChild() {
            if (!this._source && !this._showedMoreThanOne && this.skipOneChild()) {
                if (this._children.size === 1) {
                    return this._children.values().next().value;
                }
                // if a node had more than one child once, it will never be skipped again
                if (this._children.size > 1) {
                    this._showedMoreThanOne = true;
                }
            }
            return undefined;
        }
        skipOneChild() {
            if (NEW_STYLE_COMPRESS) {
                // if the root node has only one Session, don't show the session
                return this instanceof RootTreeItem;
            }
            else {
                return !(this instanceof RootFolderTreeItem) && !(this instanceof SessionTreeItem);
            }
        }
    }
    class RootFolderTreeItem extends BaseTreeItem {
        constructor(parent, folder) {
            super(parent, folder.name, true);
            this.folder = folder;
        }
    }
    class RootTreeItem extends BaseTreeItem {
        constructor(_pathService, _contextService, _labelService) {
            super(undefined, 'Root');
            this._pathService = _pathService;
            this._contextService = _contextService;
            this._labelService = _labelService;
        }
        add(session) {
            return this.createIfNeeded(session.getId(), () => new SessionTreeItem(this._labelService, this, session, this._pathService, this._contextService));
        }
        find(session) {
            return this.getChild(session.getId());
        }
    }
    class SessionTreeItem extends BaseTreeItem {
        static { this.URL_REGEXP = /^(https?:\/\/[^/]+)(\/.*)$/; }
        constructor(labelService, parent, session, _pathService, rootProvider) {
            super(parent, session.getLabel(), true);
            this._pathService = _pathService;
            this.rootProvider = rootProvider;
            this._map = new Map();
            this._labelService = labelService;
            this._session = session;
        }
        getInternalId() {
            return this._session.getId();
        }
        getSession() {
            return this._session;
        }
        getHoverLabel() {
            return undefined;
        }
        hasChildren() {
            return true;
        }
        compare(a, b) {
            const acat = this.category(a);
            const bcat = this.category(b);
            if (acat !== bcat) {
                return acat - bcat;
            }
            return super.compare(a, b);
        }
        category(item) {
            // workspace scripts come at the beginning in "folder" order
            if (item instanceof RootFolderTreeItem) {
                return item.folder.index;
            }
            // <...> come at the very end
            const l = item.getLabel();
            if (l && /^<.+>$/.test(l)) {
                return 1000;
            }
            // everything else in between
            return 999;
        }
        async addPath(source) {
            let folder;
            let url;
            let path = source.raw.path;
            if (!path) {
                return;
            }
            if (this._labelService && URI_SCHEMA_PATTERN.test(path)) {
                path = this._labelService.getUriLabel(uri_1.URI.parse(path));
            }
            const match = SessionTreeItem.URL_REGEXP.exec(path);
            if (match && match.length === 3) {
                url = match[1];
                path = decodeURI(match[2]);
            }
            else {
                if ((0, path_1.isAbsolute)(path)) {
                    const resource = uri_1.URI.file(path);
                    // return early if we can resolve a relative path label from the root folder
                    folder = this.rootProvider ? this.rootProvider.getWorkspaceFolder(resource) : null;
                    if (folder) {
                        // strip off the root folder path
                        path = (0, path_1.normalize)((0, strings_1.ltrim)(resource.path.substring(folder.uri.path.length), path_1.posix.sep));
                        const hasMultipleRoots = this.rootProvider.getWorkspace().folders.length > 1;
                        if (hasMultipleRoots) {
                            path = path_1.posix.sep + path;
                        }
                        else {
                            // don't show root folder
                            folder = null;
                        }
                    }
                    else {
                        // on unix try to tildify absolute paths
                        path = (0, path_1.normalize)(path);
                        if (platform_1.isWindows) {
                            path = (0, labels_1.normalizeDriveLetter)(path);
                        }
                        else {
                            path = (0, labels_1.tildify)(path, (await this._pathService.userHome()).fsPath);
                        }
                    }
                }
            }
            let leaf = this;
            path.split(/[\/\\]/).forEach((segment, i) => {
                if (i === 0 && folder) {
                    const f = folder;
                    leaf = leaf.createIfNeeded(folder.name, parent => new RootFolderTreeItem(parent, f));
                }
                else if (i === 0 && url) {
                    leaf = leaf.createIfNeeded(url, parent => new BaseTreeItem(parent, url));
                }
                else {
                    leaf = leaf.createIfNeeded(segment, parent => new BaseTreeItem(parent, segment));
                }
            });
            leaf.setSource(this._session, source);
            if (source.raw.path) {
                this._map.set(source.raw.path, leaf);
            }
        }
        removePath(source) {
            if (source.raw.path) {
                const leaf = this._map.get(source.raw.path);
                if (leaf) {
                    leaf.removeFromParent();
                    return true;
                }
            }
            return false;
        }
    }
    /**
     * This maps a model item into a view model item.
     */
    function asTreeElement(item, viewState) {
        const children = item.getChildren();
        const collapsed = viewState ? !viewState.expanded.has(item.getId()) : !(item instanceof SessionTreeItem);
        return {
            element: item,
            collapsed,
            collapsible: item.hasChildren(),
            children: children.map(i => asTreeElement(i, viewState))
        };
    }
    let LoadedScriptsView = class LoadedScriptsView extends viewPane_1.ViewPane {
        constructor(options, contextMenuService, keybindingService, instantiationService, viewDescriptorService, configurationService, editorService, contextKeyService, contextService, debugService, labelService, pathService, openerService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.editorService = editorService;
            this.contextService = contextService;
            this.debugService = debugService;
            this.labelService = labelService;
            this.pathService = pathService;
            this.treeNeedsRefreshOnVisible = false;
            this.loadedScriptsItemType = debug_1.CONTEXT_LOADED_SCRIPTS_ITEM_TYPE.bindTo(contextKeyService);
        }
        renderBody(container) {
            super.renderBody(container);
            this.element.classList.add('debug-pane');
            container.classList.add('debug-loaded-scripts');
            container.classList.add('show-file-icons');
            this.treeContainer = (0, baseDebugView_1.renderViewTree)(container);
            this.filter = new LoadedScriptsFilter();
            const root = new RootTreeItem(this.pathService, this.contextService, this.labelService);
            this.treeLabels = this.instantiationService.createInstance(labels_2.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this._register(this.treeLabels);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleObjectTree, 'LoadedScriptsView', this.treeContainer, new LoadedScriptsDelegate(), [new LoadedScriptsRenderer(this.treeLabels)], {
                compressionEnabled: NEW_STYLE_COMPRESS,
                collapseByDefault: true,
                hideTwistiesOfChildlessElements: true,
                identityProvider: {
                    getId: (element) => element.getId()
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (element) => {
                        return element.getLabel();
                    },
                    getCompressedNodeKeyboardNavigationLabel: (elements) => {
                        return elements.map(e => e.getLabel()).join('/');
                    }
                },
                filter: this.filter,
                accessibilityProvider: new LoadedSciptsAccessibilityProvider(),
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            const updateView = (viewState) => this.tree.setChildren(null, asTreeElement(root, viewState).children);
            updateView();
            this.changeScheduler = new async_1.RunOnceScheduler(() => {
                this.treeNeedsRefreshOnVisible = false;
                if (this.tree) {
                    updateView();
                }
            }, 300);
            this._register(this.changeScheduler);
            this._register(this.tree.onDidOpen(e => {
                if (e.element instanceof BaseTreeItem) {
                    const source = e.element.getSource();
                    if (source && source.available) {
                        const nullRange = { startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0 };
                        source.openInEditor(this.editorService, nullRange, e.editorOptions.preserveFocus, e.sideBySide, e.editorOptions.pinned);
                    }
                }
            }));
            this._register(this.tree.onDidChangeFocus(() => {
                const focus = this.tree.getFocus();
                if (focus instanceof SessionTreeItem) {
                    this.loadedScriptsItemType.set('session');
                }
                else {
                    this.loadedScriptsItemType.reset();
                }
            }));
            const scheduleRefreshOnVisible = () => {
                if (this.isBodyVisible()) {
                    this.changeScheduler.schedule();
                }
                else {
                    this.treeNeedsRefreshOnVisible = true;
                }
            };
            const addSourcePathsToSession = async (session) => {
                if (session.capabilities.supportsLoadedSourcesRequest) {
                    const sessionNode = root.add(session);
                    const paths = await session.getLoadedSources();
                    for (const path of paths) {
                        await sessionNode.addPath(path);
                    }
                    scheduleRefreshOnVisible();
                }
            };
            const registerSessionListeners = (session) => {
                this._register(session.onDidChangeName(async () => {
                    const sessionRoot = root.find(session);
                    if (sessionRoot) {
                        sessionRoot.updateLabel(session.getLabel());
                        scheduleRefreshOnVisible();
                    }
                }));
                this._register(session.onDidLoadedSource(async (event) => {
                    let sessionRoot;
                    switch (event.reason) {
                        case 'new':
                        case 'changed':
                            sessionRoot = root.add(session);
                            await sessionRoot.addPath(event.source);
                            scheduleRefreshOnVisible();
                            if (event.reason === 'changed') {
                                debugContentProvider_1.DebugContentProvider.refreshDebugContent(event.source.uri);
                            }
                            break;
                        case 'removed':
                            sessionRoot = root.find(session);
                            if (sessionRoot && sessionRoot.removePath(event.source)) {
                                scheduleRefreshOnVisible();
                            }
                            break;
                        default:
                            this.filter.setFilter(event.source.name);
                            this.tree.refilter();
                            break;
                    }
                }));
            };
            this._register(this.debugService.onDidNewSession(registerSessionListeners));
            this.debugService.getModel().getSessions().forEach(registerSessionListeners);
            this._register(this.debugService.onDidEndSession(({ session }) => {
                root.remove(session.getId());
                this.changeScheduler.schedule();
            }));
            this.changeScheduler.schedule(0);
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.treeNeedsRefreshOnVisible) {
                    this.changeScheduler.schedule();
                }
            }));
            // feature: expand all nodes when filtering (not when finding)
            let viewState;
            this._register(this.tree.onDidChangeFindPattern(pattern => {
                if (this.tree.findMode === abstractTree_1.TreeFindMode.Highlight) {
                    return;
                }
                if (!viewState && pattern) {
                    const expanded = new Set();
                    const visit = (node) => {
                        if (node.element && !node.collapsed) {
                            expanded.add(node.element.getId());
                        }
                        for (const child of node.children) {
                            visit(child);
                        }
                    };
                    visit(this.tree.getNode());
                    viewState = { expanded };
                    this.tree.expandAll();
                }
                else if (!pattern && viewState) {
                    this.tree.setFocus([]);
                    updateView(viewState);
                    viewState = undefined;
                }
            }));
            // populate tree model with source paths from all debug sessions
            this.debugService.getModel().getSessions().forEach(session => addSourcePathsToSession(session));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        collapseAll() {
            this.tree.collapseAll();
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.tree);
            (0, lifecycle_1.dispose)(this.treeLabels);
            super.dispose();
        }
    };
    exports.LoadedScriptsView = LoadedScriptsView;
    exports.LoadedScriptsView = LoadedScriptsView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, views_1.IViewDescriptorService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, editorService_1.IEditorService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, debug_1.IDebugService),
        __param(10, label_1.ILabelService),
        __param(11, pathService_1.IPathService),
        __param(12, opener_1.IOpenerService),
        __param(13, themeService_1.IThemeService),
        __param(14, telemetry_1.ITelemetryService)
    ], LoadedScriptsView);
    class LoadedScriptsDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return LoadedScriptsRenderer.ID;
        }
    }
    class LoadedScriptsRenderer {
        static { this.ID = 'lsrenderer'; }
        constructor(labels) {
            this.labels = labels;
        }
        get templateId() {
            return LoadedScriptsRenderer.ID;
        }
        renderTemplate(container) {
            const label = this.labels.create(container, { supportHighlights: true });
            return { label };
        }
        renderElement(node, index, data) {
            const element = node.element;
            const label = element.getLabel();
            this.render(element, label, data, node.filterData);
        }
        renderCompressedElements(node, index, data, height) {
            const element = node.element.elements[node.element.elements.length - 1];
            const labels = node.element.elements.map(e => e.getLabel());
            this.render(element, labels, data, node.filterData);
        }
        render(element, labels, data, filterData) {
            const label = {
                name: labels
            };
            const options = {
                title: element.getHoverLabel()
            };
            if (element instanceof RootFolderTreeItem) {
                options.fileKind = files_1.FileKind.ROOT_FOLDER;
            }
            else if (element instanceof SessionTreeItem) {
                options.title = nls.localize('loadedScriptsSession', "Debug Session");
                options.hideIcon = true;
            }
            else if (element instanceof BaseTreeItem) {
                const src = element.getSource();
                if (src && src.uri) {
                    label.resource = src.uri;
                    options.fileKind = files_1.FileKind.FILE;
                }
                else {
                    options.fileKind = files_1.FileKind.FOLDER;
                }
            }
            options.matches = (0, filters_1.createMatches)(filterData);
            data.label.setResource(label, options);
        }
        disposeTemplate(templateData) {
            templateData.label.dispose();
        }
    }
    class LoadedSciptsAccessibilityProvider {
        getWidgetAriaLabel() {
            return nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'loadedScriptsAriaLabel' }, "Debug Loaded Scripts");
        }
        getAriaLabel(element) {
            if (element instanceof RootFolderTreeItem) {
                return nls.localize('loadedScriptsRootFolderAriaLabel', "Workspace folder {0}, loaded script, debug", element.getLabel());
            }
            if (element instanceof SessionTreeItem) {
                return nls.localize('loadedScriptsSessionAriaLabel', "Session {0}, loaded script, debug", element.getLabel());
            }
            if (element.hasChildren()) {
                return nls.localize('loadedScriptsFolderAriaLabel', "Folder {0}, loaded script, debug", element.getLabel());
            }
            else {
                return nls.localize('loadedScriptsSourceAriaLabel', "{0}, loaded script, debug", element.getLabel());
            }
        }
    }
    class LoadedScriptsFilter {
        setFilter(filterText) {
            this.filterText = filterText;
        }
        filter(element, parentVisibility) {
            if (!this.filterText) {
                return 1 /* TreeVisibility.Visible */;
            }
            if (element.isLeaf()) {
                const name = element.getLabel();
                if (name.indexOf(this.filterText) >= 0) {
                    return 1 /* TreeVisibility.Visible */;
                }
                return 0 /* TreeVisibility.Hidden */;
            }
            return 2 /* TreeVisibility.Recurse */;
        }
    }
    (0, actions_1.registerAction2)(class Collapse extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'loadedScripts.collapse',
                viewId: debug_1.LOADED_SCRIPTS_VIEW_ID,
                title: nls.localize('collapse', "Collapse All"),
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 30,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', debug_1.LOADED_SCRIPTS_VIEW_ID)
                }
            });
        }
        runInView(_accessor, view) {
            view.collapseAll();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVkU2NyaXB0c1ZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2Jyb3dzZXIvbG9hZGVkU2NyaXB0c1ZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkNoRyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQztJQUVoQyw2REFBNkQ7SUFDN0QsTUFBTSxrQkFBa0IsR0FBRyw4QkFBOEIsQ0FBQztJQUkxRCxNQUFNLFlBQVk7UUFNakIsWUFBb0IsT0FBaUMsRUFBVSxNQUFjLEVBQWtCLG1CQUFtQixLQUFLO1lBQW5HLFlBQU8sR0FBUCxPQUFPLENBQTBCO1lBQVUsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUFrQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVE7WUFIL0csY0FBUyxHQUFHLElBQUksR0FBRyxFQUF3QixDQUFDO1lBSW5ELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7UUFDakMsQ0FBQztRQUVELFdBQVcsQ0FBQyxLQUFhO1lBQ3hCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLENBQUM7UUFFRCxNQUFNO1lBQ0wsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELFVBQVU7WUFDVCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2xDLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsU0FBUyxDQUFDLE9BQXNCLEVBQUUsTUFBYztZQUMvQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENB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