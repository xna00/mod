/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/findinput/findInput", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/list/listView", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/tree/indexTreeModel", "vs/base/browser/ui/tree/tree", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/map", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/types", "vs/nls", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/common/observable", "vs/css!./media/tree"], function (require, exports, dom_1, event_1, keyboardEvent_1, actionbar_1, findInput_1, inputBox_1, listView_1, listWidget_1, toggle_1, indexTreeModel_1, tree_1, actions_1, arrays_1, async_1, codicons_1, themables_1, map_1, event_2, filters_1, lifecycle_1, numbers_1, types_1, nls_1, hoverDelegateFactory_1, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTree = exports.AbstractTreePart = exports.TreeFindMatchType = exports.TreeFindMode = exports.FuzzyToggle = exports.ModeToggle = exports.TreeRenderer = exports.RenderIndentGuides = exports.AbstractTreeViewState = exports.ComposedTreeDelegate = void 0;
    class TreeElementsDragAndDropData extends listView_1.ElementsDragAndDropData {
        set context(context) {
            this.data.context = context;
        }
        get context() {
            return this.data.context;
        }
        constructor(data) {
            super(data.elements.map(node => node.element));
            this.data = data;
        }
    }
    function asTreeDragAndDropData(data) {
        if (data instanceof listView_1.ElementsDragAndDropData) {
            return new TreeElementsDragAndDropData(data);
        }
        return data;
    }
    class TreeNodeListDragAndDrop {
        constructor(modelProvider, dnd) {
            this.modelProvider = modelProvider;
            this.dnd = dnd;
            this.autoExpandDisposable = lifecycle_1.Disposable.None;
            this.disposables = new lifecycle_1.DisposableStore();
        }
        getDragURI(node) {
            return this.dnd.getDragURI(node.element);
        }
        getDragLabel(nodes, originalEvent) {
            if (this.dnd.getDragLabel) {
                return this.dnd.getDragLabel(nodes.map(node => node.element), originalEvent);
            }
            return undefined;
        }
        onDragStart(data, originalEvent) {
            this.dnd.onDragStart?.(asTreeDragAndDropData(data), originalEvent);
        }
        onDragOver(data, targetNode, targetIndex, targetSector, originalEvent, raw = true) {
            const result = this.dnd.onDragOver(asTreeDragAndDropData(data), targetNode && targetNode.element, targetIndex, targetSector, originalEvent);
            const didChangeAutoExpandNode = this.autoExpandNode !== targetNode;
            if (didChangeAutoExpandNode) {
                this.autoExpandDisposable.dispose();
                this.autoExpandNode = targetNode;
            }
            if (typeof targetNode === 'undefined') {
                return result;
            }
            if (didChangeAutoExpandNode && typeof result !== 'boolean' && result.autoExpand) {
                this.autoExpandDisposable = (0, async_1.disposableTimeout)(() => {
                    const model = this.modelProvider();
                    const ref = model.getNodeLocation(targetNode);
                    if (model.isCollapsed(ref)) {
                        model.setCollapsed(ref, false);
                    }
                    this.autoExpandNode = undefined;
                }, 500, this.disposables);
            }
            if (typeof result === 'boolean' || !result.accept || typeof result.bubble === 'undefined' || result.feedback) {
                if (!raw) {
                    const accept = typeof result === 'boolean' ? result : result.accept;
                    const effect = typeof result === 'boolean' ? undefined : result.effect;
                    return { accept, effect, feedback: [targetIndex] };
                }
                return result;
            }
            if (result.bubble === 1 /* TreeDragOverBubble.Up */) {
                const model = this.modelProvider();
                const ref = model.getNodeLocation(targetNode);
                const parentRef = model.getParentNodeLocation(ref);
                const parentNode = model.getNode(parentRef);
                const parentIndex = parentRef && model.getListIndex(parentRef);
                return this.onDragOver(data, parentNode, parentIndex, targetSector, originalEvent, false);
            }
            const model = this.modelProvider();
            const ref = model.getNodeLocation(targetNode);
            const start = model.getListIndex(ref);
            const length = model.getListRenderCount(ref);
            return { ...result, feedback: (0, arrays_1.range)(start, start + length) };
        }
        drop(data, targetNode, targetIndex, targetSector, originalEvent) {
            this.autoExpandDisposable.dispose();
            this.autoExpandNode = undefined;
            this.dnd.drop(asTreeDragAndDropData(data), targetNode && targetNode.element, targetIndex, targetSector, originalEvent);
        }
        onDragEnd(originalEvent) {
            this.dnd.onDragEnd?.(originalEvent);
        }
        dispose() {
            this.disposables.dispose();
            this.dnd.dispose();
        }
    }
    function asListOptions(modelProvider, options) {
        return options && {
            ...options,
            identityProvider: options.identityProvider && {
                getId(el) {
                    return options.identityProvider.getId(el.element);
                }
            },
            dnd: options.dnd && new TreeNodeListDragAndDrop(modelProvider, options.dnd),
            multipleSelectionController: options.multipleSelectionController && {
                isSelectionSingleChangeEvent(e) {
                    return options.multipleSelectionController.isSelectionSingleChangeEvent({ ...e, element: e.element });
                },
                isSelectionRangeChangeEvent(e) {
                    return options.multipleSelectionController.isSelectionRangeChangeEvent({ ...e, element: e.element });
                }
            },
            accessibilityProvider: options.accessibilityProvider && {
                ...options.accessibilityProvider,
                getSetSize(node) {
                    const model = modelProvider();
                    const ref = model.getNodeLocation(node);
                    const parentRef = model.getParentNodeLocation(ref);
                    const parentNode = model.getNode(parentRef);
                    return parentNode.visibleChildrenCount;
                },
                getPosInSet(node) {
                    return node.visibleChildIndex + 1;
                },
                isChecked: options.accessibilityProvider && options.accessibilityProvider.isChecked ? (node) => {
                    return options.accessibilityProvider.isChecked(node.element);
                } : undefined,
                getRole: options.accessibilityProvider && options.accessibilityProvider.getRole ? (node) => {
                    return options.accessibilityProvider.getRole(node.element);
                } : () => 'treeitem',
                getAriaLabel(e) {
                    return options.accessibilityProvider.getAriaLabel(e.element);
                },
                getWidgetAriaLabel() {
                    return options.accessibilityProvider.getWidgetAriaLabel();
                },
                getWidgetRole: options.accessibilityProvider && options.accessibilityProvider.getWidgetRole ? () => options.accessibilityProvider.getWidgetRole() : () => 'tree',
                getAriaLevel: options.accessibilityProvider && options.accessibilityProvider.getAriaLevel ? (node) => options.accessibilityProvider.getAriaLevel(node.element) : (node) => {
                    return node.depth;
                },
                getActiveDescendantId: options.accessibilityProvider.getActiveDescendantId && (node => {
                    return options.accessibilityProvider.getActiveDescendantId(node.element);
                })
            },
            keyboardNavigationLabelProvider: options.keyboardNavigationLabelProvider && {
                ...options.keyboardNavigationLabelProvider,
                getKeyboardNavigationLabel(node) {
                    return options.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(node.element);
                }
            }
        };
    }
    class ComposedTreeDelegate {
        constructor(delegate) {
            this.delegate = delegate;
        }
        getHeight(element) {
            return this.delegate.getHeight(element.element);
        }
        getTemplateId(element) {
            return this.delegate.getTemplateId(element.element);
        }
        hasDynamicHeight(element) {
            return !!this.delegate.hasDynamicHeight && this.delegate.hasDynamicHeight(element.element);
        }
        setDynamicHeight(element, height) {
            this.delegate.setDynamicHeight?.(element.element, height);
        }
    }
    exports.ComposedTreeDelegate = ComposedTreeDelegate;
    class AbstractTreeViewState {
        static lift(state) {
            return state instanceof AbstractTreeViewState ? state : new AbstractTreeViewState(state);
        }
        static empty(scrollTop = 0) {
            return new AbstractTreeViewState({
                focus: [],
                selection: [],
                expanded: Object.create(null),
                scrollTop,
            });
        }
        constructor(state) {
            this.focus = new Set(state.focus);
            this.selection = new Set(state.selection);
            if (state.expanded instanceof Array) { // old format
                this.expanded = Object.create(null);
                for (const id of state.expanded) {
                    this.expanded[id] = 1;
                }
            }
            else {
                this.expanded = state.expanded;
            }
            this.expanded = state.expanded;
            this.scrollTop = state.scrollTop;
        }
        toJSON() {
            return {
                focus: Array.from(this.focus),
                selection: Array.from(this.selection),
                expanded: this.expanded,
                scrollTop: this.scrollTop,
            };
        }
    }
    exports.AbstractTreeViewState = AbstractTreeViewState;
    var RenderIndentGuides;
    (function (RenderIndentGuides) {
        RenderIndentGuides["None"] = "none";
        RenderIndentGuides["OnHover"] = "onHover";
        RenderIndentGuides["Always"] = "always";
    })(RenderIndentGuides || (exports.RenderIndentGuides = RenderIndentGuides = {}));
    class EventCollection {
        get elements() {
            return this._elements;
        }
        constructor(onDidChange, _elements = []) {
            this._elements = _elements;
            this.disposables = new lifecycle_1.DisposableStore();
            this.onDidChange = event_2.Event.forEach(onDidChange, elements => this._elements = elements, this.disposables);
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    class TreeRenderer {
        static { this.DefaultIndent = 8; }
        constructor(renderer, modelProvider, onDidChangeCollapseState, activeNodes, renderedIndentGuides, options = {}) {
            this.renderer = renderer;
            this.modelProvider = modelProvider;
            this.activeNodes = activeNodes;
            this.renderedIndentGuides = renderedIndentGuides;
            this.renderedElements = new Map();
            this.renderedNodes = new Map();
            this.indent = TreeRenderer.DefaultIndent;
            this.hideTwistiesOfChildlessElements = false;
            this.shouldRenderIndentGuides = false;
            this.activeIndentNodes = new Set();
            this.indentGuidesDisposable = lifecycle_1.Disposable.None;
            this.disposables = new lifecycle_1.DisposableStore();
            this.templateId = renderer.templateId;
            this.updateOptions(options);
            event_2.Event.map(onDidChangeCollapseState, e => e.node)(this.onDidChangeNodeTwistieState, this, this.disposables);
            renderer.onDidChangeTwistieState?.(this.onDidChangeTwistieState, this, this.disposables);
        }
        updateOptions(options = {}) {
            if (typeof options.indent !== 'undefined') {
                const indent = (0, numbers_1.clamp)(options.indent, 0, 40);
                if (indent !== this.indent) {
                    this.indent = indent;
                    for (const [node, templateData] of this.renderedNodes) {
                        this.renderTreeElement(node, templateData);
                    }
                }
            }
            if (typeof options.renderIndentGuides !== 'undefined') {
                const shouldRenderIndentGuides = options.renderIndentGuides !== RenderIndentGuides.None;
                if (shouldRenderIndentGuides !== this.shouldRenderIndentGuides) {
                    this.shouldRenderIndentGuides = shouldRenderIndentGuides;
                    for (const [node, templateData] of this.renderedNodes) {
                        this._renderIndentGuides(node, templateData);
                    }
                    this.indentGuidesDisposable.dispose();
                    if (shouldRenderIndentGuides) {
                        const disposables = new lifecycle_1.DisposableStore();
                        this.activeNodes.onDidChange(this._onDidChangeActiveNodes, this, disposables);
                        this.indentGuidesDisposable = disposables;
                        this._onDidChangeActiveNodes(this.activeNodes.elements);
                    }
                }
            }
            if (typeof options.hideTwistiesOfChildlessElements !== 'undefined') {
                this.hideTwistiesOfChildlessElements = options.hideTwistiesOfChildlessElements;
            }
        }
        renderTemplate(container) {
            const el = (0, dom_1.append)(container, (0, dom_1.$)('.monaco-tl-row'));
            const indent = (0, dom_1.append)(el, (0, dom_1.$)('.monaco-tl-indent'));
            const twistie = (0, dom_1.append)(el, (0, dom_1.$)('.monaco-tl-twistie'));
            const contents = (0, dom_1.append)(el, (0, dom_1.$)('.monaco-tl-contents'));
            const templateData = this.renderer.renderTemplate(contents);
            return { container, indent, twistie, indentGuidesDisposable: lifecycle_1.Disposable.None, templateData };
        }
        renderElement(node, index, templateData, height) {
            this.renderedNodes.set(node, templateData);
            this.renderedElements.set(node.element, node);
            this.renderTreeElement(node, templateData);
            this.renderer.renderElement(node, index, templateData.templateData, height);
        }
        disposeElement(node, index, templateData, height) {
            templateData.indentGuidesDisposable.dispose();
            this.renderer.disposeElement?.(node, index, templateData.templateData, height);
            if (typeof height === 'number') {
                this.renderedNodes.delete(node);
                this.renderedElements.delete(node.element);
            }
        }
        disposeTemplate(templateData) {
            this.renderer.disposeTemplate(templateData.templateData);
        }
        onDidChangeTwistieState(element) {
            const node = this.renderedElements.get(element);
            if (!node) {
                return;
            }
            this.onDidChangeNodeTwistieState(node);
        }
        onDidChangeNodeTwistieState(node) {
            const templateData = this.renderedNodes.get(node);
            if (!templateData) {
                return;
            }
            this._onDidChangeActiveNodes(this.activeNodes.elements);
            this.renderTreeElement(node, templateData);
        }
        renderTreeElement(node, templateData) {
            const indent = TreeRenderer.DefaultIndent + (node.depth - 1) * this.indent;
            templateData.twistie.style.paddingLeft = `${indent}px`;
            templateData.indent.style.width = `${indent + this.indent - 16}px`;
            if (node.collapsible) {
                templateData.container.setAttribute('aria-expanded', String(!node.collapsed));
            }
            else {
                templateData.container.removeAttribute('aria-expanded');
            }
            templateData.twistie.classList.remove(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.treeItemExpanded));
            let twistieRendered = false;
            if (this.renderer.renderTwistie) {
                twistieRendered = this.renderer.renderTwistie(node.element, templateData.twistie);
            }
            if (node.collapsible && (!this.hideTwistiesOfChildlessElements || node.visibleChildrenCount > 0)) {
                if (!twistieRendered) {
                    templateData.twistie.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.treeItemExpanded));
                }
                templateData.twistie.classList.add('collapsible');
                templateData.twistie.classList.toggle('collapsed', node.collapsed);
            }
            else {
                templateData.twistie.classList.remove('collapsible', 'collapsed');
            }
            this._renderIndentGuides(node, templateData);
        }
        _renderIndentGuides(node, templateData) {
            (0, dom_1.clearNode)(templateData.indent);
            templateData.indentGuidesDisposable.dispose();
            if (!this.shouldRenderIndentGuides) {
                return;
            }
            const disposableStore = new lifecycle_1.DisposableStore();
            const model = this.modelProvider();
            while (true) {
                const ref = model.getNodeLocation(node);
                const parentRef = model.getParentNodeLocation(ref);
                if (!parentRef) {
                    break;
                }
                const parent = model.getNode(parentRef);
                const guide = (0, dom_1.$)('.indent-guide', { style: `width: ${this.indent}px` });
                if (this.activeIndentNodes.has(parent)) {
                    guide.classList.add('active');
                }
                if (templateData.indent.childElementCount === 0) {
                    templateData.indent.appendChild(guide);
                }
                else {
                    templateData.indent.insertBefore(guide, templateData.indent.firstElementChild);
                }
                this.renderedIndentGuides.add(parent, guide);
                disposableStore.add((0, lifecycle_1.toDisposable)(() => this.renderedIndentGuides.delete(parent, guide)));
                node = parent;
            }
            templateData.indentGuidesDisposable = disposableStore;
        }
        _onDidChangeActiveNodes(nodes) {
            if (!this.shouldRenderIndentGuides) {
                return;
            }
            const set = new Set();
            const model = this.modelProvider();
            nodes.forEach(node => {
                const ref = model.getNodeLocation(node);
                try {
                    const parentRef = model.getParentNodeLocation(ref);
                    if (node.collapsible && node.children.length > 0 && !node.collapsed) {
                        set.add(node);
                    }
                    else if (parentRef) {
                        set.add(model.getNode(parentRef));
                    }
                }
                catch {
                    // noop
                }
            });
            this.activeIndentNodes.forEach(node => {
                if (!set.has(node)) {
                    this.renderedIndentGuides.forEach(node, line => line.classList.remove('active'));
                }
            });
            set.forEach(node => {
                if (!this.activeIndentNodes.has(node)) {
                    this.renderedIndentGuides.forEach(node, line => line.classList.add('active'));
                }
            });
            this.activeIndentNodes = set;
        }
        dispose() {
            this.renderedNodes.clear();
            this.renderedElements.clear();
            this.indentGuidesDisposable.dispose();
            (0, lifecycle_1.dispose)(this.disposables);
        }
    }
    exports.TreeRenderer = TreeRenderer;
    class FindFilter {
        get totalCount() { return this._totalCount; }
        get matchCount() { return this._matchCount; }
        set pattern(pattern) {
            this._pattern = pattern;
            this._lowercasePattern = pattern.toLowerCase();
        }
        constructor(tree, keyboardNavigationLabelProvider, _filter) {
            this.tree = tree;
            this.keyboardNavigationLabelProvider = keyboardNavigationLabelProvider;
            this._filter = _filter;
            this._totalCount = 0;
            this._matchCount = 0;
            this._pattern = '';
            this._lowercasePattern = '';
            this.disposables = new lifecycle_1.DisposableStore();
            tree.onWillRefilter(this.reset, this, this.disposables);
        }
        filter(element, parentVisibility) {
            let visibility = 1 /* TreeVisibility.Visible */;
            if (this._filter) {
                const result = this._filter.filter(element, parentVisibility);
                if (typeof result === 'boolean') {
                    visibility = result ? 1 /* TreeVisibility.Visible */ : 0 /* TreeVisibility.Hidden */;
                }
                else if ((0, indexTreeModel_1.isFilterResult)(result)) {
                    visibility = (0, indexTreeModel_1.getVisibleState)(result.visibility);
                }
                else {
                    visibility = result;
                }
                if (visibility === 0 /* TreeVisibility.Hidden */) {
                    return false;
                }
            }
            this._totalCount++;
            if (!this._pattern) {
                this._matchCount++;
                return { data: filters_1.FuzzyScore.Default, visibility };
            }
            const label = this.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(element);
            const labels = Array.isArray(label) ? label : [label];
            for (const l of labels) {
                const labelStr = l && l.toString();
                if (typeof labelStr === 'undefined') {
                    return { data: filters_1.FuzzyScore.Default, visibility };
                }
                let score;
                if (this.tree.findMatchType === TreeFindMatchType.Contiguous) {
                    const index = labelStr.toLowerCase().indexOf(this._lowercasePattern);
                    if (index > -1) {
                        score = [Number.MAX_SAFE_INTEGER, 0];
                        for (let i = this._lowercasePattern.length; i > 0; i--) {
                            score.push(index + i - 1);
                        }
                    }
                }
                else {
                    score = (0, filters_1.fuzzyScore)(this._pattern, this._lowercasePattern, 0, labelStr, labelStr.toLowerCase(), 0, { firstMatchCanBeWeak: true, boostFullMatch: true });
                }
                if (score) {
                    this._matchCount++;
                    return labels.length === 1 ?
                        { data: score, visibility } :
                        { data: { label: labelStr, score: score }, visibility };
                }
            }
            if (this.tree.findMode === TreeFindMode.Filter) {
                if (typeof this.tree.options.defaultFindVisibility === 'number') {
                    return this.tree.options.defaultFindVisibility;
                }
                else if (this.tree.options.defaultFindVisibility) {
                    return this.tree.options.defaultFindVisibility(element);
                }
                else {
                    return 2 /* TreeVisibility.Recurse */;
                }
            }
            else {
                return { data: filters_1.FuzzyScore.Default, visibility };
            }
        }
        reset() {
            this._totalCount = 0;
            this._matchCount = 0;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.disposables);
        }
    }
    class ModeToggle extends toggle_1.Toggle {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.listFilter,
                title: (0, nls_1.localize)('filter', "Filter"),
                isChecked: opts.isChecked ?? false,
                hoverDelegate: opts.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'),
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.ModeToggle = ModeToggle;
    class FuzzyToggle extends toggle_1.Toggle {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.searchFuzzy,
                title: (0, nls_1.localize)('fuzzySearch', "Fuzzy Match"),
                isChecked: opts.isChecked ?? false,
                hoverDelegate: opts.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'),
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.FuzzyToggle = FuzzyToggle;
    const unthemedFindWidgetStyles = {
        inputBoxStyles: inputBox_1.unthemedInboxStyles,
        toggleStyles: toggle_1.unthemedToggleStyles,
        listFilterWidgetBackground: undefined,
        listFilterWidgetNoMatchesOutline: undefined,
        listFilterWidgetOutline: undefined,
        listFilterWidgetShadow: undefined
    };
    var TreeFindMode;
    (function (TreeFindMode) {
        TreeFindMode[TreeFindMode["Highlight"] = 0] = "Highlight";
        TreeFindMode[TreeFindMode["Filter"] = 1] = "Filter";
    })(TreeFindMode || (exports.TreeFindMode = TreeFindMode = {}));
    var TreeFindMatchType;
    (function (TreeFindMatchType) {
        TreeFindMatchType[TreeFindMatchType["Fuzzy"] = 0] = "Fuzzy";
        TreeFindMatchType[TreeFindMatchType["Contiguous"] = 1] = "Contiguous";
    })(TreeFindMatchType || (exports.TreeFindMatchType = TreeFindMatchType = {}));
    class FindWidget extends lifecycle_1.Disposable {
        set mode(mode) {
            this.modeToggle.checked = mode === TreeFindMode.Filter;
            this.findInput.inputBox.setPlaceHolder(mode === TreeFindMode.Filter ? (0, nls_1.localize)('type to filter', "Type to filter") : (0, nls_1.localize)('type to search', "Type to search"));
        }
        set matchType(matchType) {
            this.matchTypeToggle.checked = matchType === TreeFindMatchType.Fuzzy;
        }
        get value() {
            return this.findInput.inputBox.value;
        }
        set value(value) {
            this.findInput.inputBox.value = value;
        }
        constructor(container, tree, contextViewProvider, mode, matchType, options) {
            super();
            this.tree = tree;
            this.elements = (0, dom_1.h)('.monaco-tree-type-filter', [
                (0, dom_1.h)('.monaco-tree-type-filter-grab.codicon.codicon-debug-gripper@grab', { tabIndex: 0 }),
                (0, dom_1.h)('.monaco-tree-type-filter-input@findInput'),
                (0, dom_1.h)('.monaco-tree-type-filter-actionbar@actionbar'),
            ]);
            this.width = 0;
            this.right = 0;
            this.top = 0;
            this._onDidDisable = new event_2.Emitter();
            this.onDidDisable = this._onDidDisable.event;
            container.appendChild(this.elements.root);
            this._register((0, lifecycle_1.toDisposable)(() => container.removeChild(this.elements.root)));
            const styles = options?.styles ?? unthemedFindWidgetStyles;
            if (styles.listFilterWidgetBackground) {
                this.elements.root.style.backgroundColor = styles.listFilterWidgetBackground;
            }
            if (styles.listFilterWidgetShadow) {
                this.elements.root.style.boxShadow = `0 0 8px 2px ${styles.listFilterWidgetShadow}`;
            }
            const toggleHoverDelegate = this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            this.modeToggle = this._register(new ModeToggle({ ...styles.toggleStyles, isChecked: mode === TreeFindMode.Filter, hoverDelegate: toggleHoverDelegate }));
            this.matchTypeToggle = this._register(new FuzzyToggle({ ...styles.toggleStyles, isChecked: matchType === TreeFindMatchType.Fuzzy, hoverDelegate: toggleHoverDelegate }));
            this.onDidChangeMode = event_2.Event.map(this.modeToggle.onChange, () => this.modeToggle.checked ? TreeFindMode.Filter : TreeFindMode.Highlight, this._store);
            this.onDidChangeMatchType = event_2.Event.map(this.matchTypeToggle.onChange, () => this.matchTypeToggle.checked ? TreeFindMatchType.Fuzzy : TreeFindMatchType.Contiguous, this._store);
            this.findInput = this._register(new findInput_1.FindInput(this.elements.findInput, contextViewProvider, {
                label: (0, nls_1.localize)('type to search', "Type to search"),
                additionalToggles: [this.modeToggle, this.matchTypeToggle],
                showCommonFindToggles: false,
                inputBoxStyles: styles.inputBoxStyles,
                toggleStyles: styles.toggleStyles,
                history: options?.history
            }));
            this.actionbar = this._register(new actionbar_1.ActionBar(this.elements.actionbar));
            this.mode = mode;
            const emitter = this._register(new event_1.DomEmitter(this.findInput.inputBox.inputElement, 'keydown'));
            const onKeyDown = event_2.Event.chain(emitter.event, $ => $.map(e => new keyboardEvent_1.StandardKeyboardEvent(e)));
            this._register(onKeyDown((e) => {
                // Using equals() so we reserve modified keys for future use
                if (e.equals(3 /* KeyCode.Enter */)) {
                    // This is the only keyboard way to return to the tree from a history item that isn't the last one
                    e.preventDefault();
                    e.stopPropagation();
                    this.findInput.inputBox.addToHistory();
                    this.tree.domFocus();
                    return;
                }
                if (e.equals(18 /* KeyCode.DownArrow */)) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.findInput.inputBox.isAtLastInHistory() || this.findInput.inputBox.isNowhereInHistory()) {
                        // Retain original pre-history DownArrow behavior
                        this.findInput.inputBox.addToHistory();
                        this.tree.domFocus();
                    }
                    else {
                        // Downward through history
                        this.findInput.inputBox.showNextValue();
                    }
                    return;
                }
                if (e.equals(16 /* KeyCode.UpArrow */)) {
                    e.preventDefault();
                    e.stopPropagation();
                    // Upward through history
                    this.findInput.inputBox.showPreviousValue();
                    return;
                }
            }));
            const closeAction = this._register(new actions_1.Action('close', (0, nls_1.localize)('close', "Close"), 'codicon codicon-close', true, () => this.dispose()));
            this.actionbar.push(closeAction, { icon: true, label: false });
            const onGrabMouseDown = this._register(new event_1.DomEmitter(this.elements.grab, 'mousedown'));
            this._register(onGrabMouseDown.event(e => {
                const disposables = new lifecycle_1.DisposableStore();
                const onWindowMouseMove = disposables.add(new event_1.DomEmitter((0, dom_1.getWindow)(e), 'mousemove'));
                const onWindowMouseUp = disposables.add(new event_1.DomEmitter((0, dom_1.getWindow)(e), 'mouseup'));
                const startRight = this.right;
                const startX = e.pageX;
                const startTop = this.top;
                const startY = e.pageY;
                this.elements.grab.classList.add('grabbing');
                const transition = this.elements.root.style.transition;
                this.elements.root.style.transition = 'unset';
                const update = (e) => {
                    const deltaX = e.pageX - startX;
                    this.right = startRight - deltaX;
                    const deltaY = e.pageY - startY;
                    this.top = startTop + deltaY;
                    this.layout();
                };
                disposables.add(onWindowMouseMove.event(update));
                disposables.add(onWindowMouseUp.event(e => {
                    update(e);
                    this.elements.grab.classList.remove('grabbing');
                    this.elements.root.style.transition = transition;
                    disposables.dispose();
                }));
            }));
            const onGrabKeyDown = event_2.Event.chain(this._register(new event_1.DomEmitter(this.elements.grab, 'keydown')).event, $ => $.map(e => new keyboardEvent_1.StandardKeyboardEvent(e)));
            this._register(onGrabKeyDown((e) => {
                let right;
                let top;
                if (e.keyCode === 15 /* KeyCode.LeftArrow */) {
                    right = Number.POSITIVE_INFINITY;
                }
                else if (e.keyCode === 17 /* KeyCode.RightArrow */) {
                    right = 0;
                }
                else if (e.keyCode === 10 /* KeyCode.Space */) {
                    right = this.right === 0 ? Number.POSITIVE_INFINITY : 0;
                }
                if (e.keyCode === 16 /* KeyCode.UpArrow */) {
                    top = 0;
                }
                else if (e.keyCode === 18 /* KeyCode.DownArrow */) {
                    top = Number.POSITIVE_INFINITY;
                }
                if (right !== undefined) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.right = right;
                    this.layout();
                }
                if (top !== undefined) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.top = top;
                    const transition = this.elements.root.style.transition;
                    this.elements.root.style.transition = 'unset';
                    this.layout();
                    setTimeout(() => {
                        this.elements.root.style.transition = transition;
                    }, 0);
                }
            }));
            this.onDidChangeValue = this.findInput.onDidChange;
        }
        getHistory() {
            return this.findInput.inputBox.getHistory();
        }
        focus() {
            this.findInput.focus();
        }
        select() {
            this.findInput.select();
            // Reposition to last in history
            this.findInput.inputBox.addToHistory(true);
        }
        layout(width = this.width) {
            this.width = width;
            this.right = (0, numbers_1.clamp)(this.right, 0, Math.max(0, width - 212));
            this.elements.root.style.right = `${this.right}px`;
            this.top = (0, numbers_1.clamp)(this.top, 0, 24);
            this.elements.root.style.top = `${this.top}px`;
        }
        showMessage(message) {
            this.findInput.showMessage(message);
        }
        clearMessage() {
            this.findInput.clearMessage();
        }
        async dispose() {
            this._onDidDisable.fire();
            this.elements.root.classList.add('disabled');
            await (0, async_1.timeout)(300);
            super.dispose();
        }
    }
    class FindController {
        get pattern() { return this._pattern; }
        get mode() { return this._mode; }
        set mode(mode) {
            if (mode === this._mode) {
                return;
            }
            this._mode = mode;
            if (this.widget) {
                this.widget.mode = this._mode;
            }
            this.tree.refilter();
            this.render();
            this._onDidChangeMode.fire(mode);
        }
        get matchType() { return this._matchType; }
        set matchType(matchType) {
            if (matchType === this._matchType) {
                return;
            }
            this._matchType = matchType;
            if (this.widget) {
                this.widget.matchType = this._matchType;
            }
            this.tree.refilter();
            this.render();
            this._onDidChangeMatchType.fire(matchType);
        }
        constructor(tree, model, view, filter, contextViewProvider, options = {}) {
            this.tree = tree;
            this.view = view;
            this.filter = filter;
            this.contextViewProvider = contextViewProvider;
            this.options = options;
            this._pattern = '';
            this.previousPattern = '';
            this.width = 0;
            this._onDidChangeMode = new event_2.Emitter();
            this.onDidChangeMode = this._onDidChangeMode.event;
            this._onDidChangeMatchType = new event_2.Emitter();
            this.onDidChangeMatchType = this._onDidChangeMatchType.event;
            this._onDidChangePattern = new event_2.Emitter();
            this.onDidChangePattern = this._onDidChangePattern.event;
            this._onDidChangeOpenState = new event_2.Emitter();
            this.onDidChangeOpenState = this._onDidChangeOpenState.event;
            this.enabledDisposables = new lifecycle_1.DisposableStore();
            this.disposables = new lifecycle_1.DisposableStore();
            this._mode = tree.options.defaultFindMode ?? TreeFindMode.Highlight;
            this._matchType = tree.options.defaultFindMatchType ?? TreeFindMatchType.Fuzzy;
            model.onDidSplice(this.onDidSpliceModel, this, this.disposables);
        }
        updateOptions(optionsUpdate = {}) {
            if (optionsUpdate.defaultFindMode !== undefined) {
                this.mode = optionsUpdate.defaultFindMode;
            }
            if (optionsUpdate.defaultFindMatchType !== undefined) {
                this.matchType = optionsUpdate.defaultFindMatchType;
            }
        }
        open() {
            if (this.widget) {
                this.widget.focus();
                this.widget.select();
                return;
            }
            this.widget = new FindWidget(this.view.getHTMLElement(), this.tree, this.contextViewProvider, this.mode, this.matchType, { ...this.options, history: this._history });
            this.enabledDisposables.add(this.widget);
            this.widget.onDidChangeValue(this.onDidChangeValue, this, this.enabledDisposables);
            this.widget.onDidChangeMode(mode => this.mode = mode, undefined, this.enabledDisposables);
            this.widget.onDidChangeMatchType(matchType => this.matchType = matchType, undefined, this.enabledDisposables);
            this.widget.onDidDisable(this.close, this, this.enabledDisposables);
            this.widget.layout(this.width);
            this.widget.focus();
            this.widget.value = this.previousPattern;
            this.widget.select();
            this._onDidChangeOpenState.fire(true);
        }
        close() {
            if (!this.widget) {
                return;
            }
            this._history = this.widget.getHistory();
            this.widget = undefined;
            this.enabledDisposables.clear();
            this.previousPattern = this.pattern;
            this.onDidChangeValue('');
            this.tree.domFocus();
            this._onDidChangeOpenState.fire(false);
        }
        onDidChangeValue(pattern) {
            this._pattern = pattern;
            this._onDidChangePattern.fire(pattern);
            this.filter.pattern = pattern;
            this.tree.refilter();
            if (pattern) {
                this.tree.focusNext(0, true, undefined, node => !filters_1.FuzzyScore.isDefault(node.filterData));
            }
            const focus = this.tree.getFocus();
            if (focus.length > 0) {
                const element = focus[0];
                if (this.tree.getRelativeTop(element) === null) {
                    this.tree.reveal(element, 0.5);
                }
            }
            this.render();
        }
        onDidSpliceModel() {
            if (!this.widget || this.pattern.length === 0) {
                return;
            }
            this.tree.refilter();
            this.render();
        }
        render() {
            const noMatches = this.filter.totalCount > 0 && this.filter.matchCount === 0;
            if (this.pattern && noMatches) {
                if (this.tree.options.showNotFoundMessage ?? true) {
                    this.widget?.showMessage({ type: 2 /* MessageType.WARNING */, content: (0, nls_1.localize)('not found', "No elements found.") });
                }
                else {
                    this.widget?.showMessage({ type: 2 /* MessageType.WARNING */ });
                }
            }
            else {
                this.widget?.clearMessage();
            }
        }
        shouldAllowFocus(node) {
            if (!this.widget || !this.pattern) {
                return true;
            }
            if (this.filter.totalCount > 0 && this.filter.matchCount <= 1) {
                return true;
            }
            return !filters_1.FuzzyScore.isDefault(node.filterData);
        }
        layout(width) {
            this.width = width;
            this.widget?.layout(width);
        }
        dispose() {
            this._history = undefined;
            this._onDidChangePattern.dispose();
            this.enabledDisposables.dispose();
            this.disposables.dispose();
        }
    }
    function stickyScrollNodeStateEquals(node1, node2) {
        return node1.position === node2.position && stickyScrollNodeEquals(node1, node2);
    }
    function stickyScrollNodeEquals(node1, node2) {
        return node1.node.element === node2.node.element &&
            node1.startIndex === node2.startIndex &&
            node1.height === node2.height &&
            node1.endIndex === node2.endIndex;
    }
    class StickyScrollState {
        constructor(stickyNodes = []) {
            this.stickyNodes = stickyNodes;
        }
        get count() { return this.stickyNodes.length; }
        equal(state) {
            return (0, arrays_1.equals)(this.stickyNodes, state.stickyNodes, stickyScrollNodeStateEquals);
        }
        lastNodePartiallyVisible() {
            if (this.count === 0) {
                return false;
            }
            const lastStickyNode = this.stickyNodes[this.count - 1];
            if (this.count === 1) {
                return lastStickyNode.position !== 0;
            }
            const secondLastStickyNode = this.stickyNodes[this.count - 2];
            return secondLastStickyNode.position + secondLastStickyNode.height !== lastStickyNode.position;
        }
        animationStateChanged(previousState) {
            if (!(0, arrays_1.equals)(this.stickyNodes, previousState.stickyNodes, stickyScrollNodeEquals)) {
                return false;
            }
            if (this.count === 0) {
                return false;
            }
            const lastStickyNode = this.stickyNodes[this.count - 1];
            const previousLastStickyNode = previousState.stickyNodes[previousState.count - 1];
            return lastStickyNode.position !== previousLastStickyNode.position;
        }
    }
    class DefaultStickyScrollDelegate {
        constrainStickyScrollNodes(stickyNodes, stickyScrollMaxItemCount, maxWidgetHeight) {
            for (let i = 0; i < stickyNodes.length; i++) {
                const stickyNode = stickyNodes[i];
                const stickyNodeBottom = stickyNode.position + stickyNode.height;
                if (stickyNodeBottom > maxWidgetHeight || i >= stickyScrollMaxItemCount) {
                    return stickyNodes.slice(0, i);
                }
            }
            return stickyNodes;
        }
    }
    class StickyScrollController extends lifecycle_1.Disposable {
        constructor(tree, model, view, renderers, treeDelegate, options = {}) {
            super();
            this.tree = tree;
            this.model = model;
            this.view = view;
            this.treeDelegate = treeDelegate;
            this.maxWidgetViewRatio = 0.4;
            const stickyScrollOptions = this.validateStickySettings(options);
            this.stickyScrollMaxItemCount = stickyScrollOptions.stickyScrollMaxItemCount;
            this.stickyScrollDelegate = options.stickyScrollDelegate ?? new DefaultStickyScrollDelegate();
            this._widget = this._register(new StickyScrollWidget(view.getScrollableElement(), view, tree, renderers, treeDelegate, options.accessibilityProvider));
            this.onDidChangeHasFocus = this._widget.onDidChangeHasFocus;
            this.onContextMenu = this._widget.onContextMenu;
            this._register(view.onDidScroll(() => this.update()));
            this._register(view.onDidChangeContentHeight(() => this.update()));
            this._register(tree.onDidChangeCollapseState(() => this.update()));
            this.update();
        }
        get height() {
            return this._widget.height;
        }
        get count() {
            return this._widget.count;
        }
        getNode(node) {
            return this._widget.getNode(node);
        }
        getNodeAtHeight(height) {
            let index;
            if (height === 0) {
                index = this.view.firstVisibleIndex;
            }
            else {
                index = this.view.indexAt(height + this.view.scrollTop);
            }
            if (index < 0 || index >= this.view.length) {
                return undefined;
            }
            return this.view.element(index);
        }
        update() {
            const firstVisibleNode = this.getNodeAtHeight(0);
            // Don't render anything if there are no elements
            if (!firstVisibleNode || this.tree.scrollTop === 0) {
                this._widget.setState(undefined);
                return;
            }
            const stickyState = this.findStickyState(firstVisibleNode);
            this._widget.setState(stickyState);
        }
        findStickyState(firstVisibleNode) {
            const stickyNodes = [];
            let firstVisibleNodeUnderWidget = firstVisibleNode;
            let stickyNodesHeight = 0;
            let nextStickyNode = this.getNextStickyNode(firstVisibleNodeUnderWidget, undefined, stickyNodesHeight);
            while (nextStickyNode) {
                stickyNodes.push(nextStickyNode);
                stickyNodesHeight += nextStickyNode.height;
                if (stickyNodes.length <= this.stickyScrollMaxItemCount) {
                    firstVisibleNodeUnderWidget = this.getNextVisibleNode(nextStickyNode);
                    if (!firstVisibleNodeUnderWidget) {
                        break;
                    }
                }
                nextStickyNode = this.getNextStickyNode(firstVisibleNodeUnderWidget, nextStickyNode.node, stickyNodesHeight);
            }
            const contrainedStickyNodes = this.constrainStickyNodes(stickyNodes);
            return contrainedStickyNodes.length ? new StickyScrollState(contrainedStickyNodes) : undefined;
        }
        getNextVisibleNode(previousStickyNode) {
            return this.getNodeAtHeight(previousStickyNode.position + previousStickyNode.height);
        }
        getNextStickyNode(firstVisibleNodeUnderWidget, previousStickyNode, stickyNodesHeight) {
            const nextStickyNode = this.getAncestorUnderPrevious(firstVisibleNodeUnderWidget, previousStickyNode);
            if (!nextStickyNode) {
                return undefined;
            }
            if (nextStickyNode === firstVisibleNodeUnderWidget) {
                if (!this.nodeIsUncollapsedParent(firstVisibleNodeUnderWidget)) {
                    return undefined;
                }
                if (this.nodeTopAlignsWithStickyNodesBottom(firstVisibleNodeUnderWidget, stickyNodesHeight)) {
                    return undefined;
                }
            }
            return this.createStickyScrollNode(nextStickyNode, stickyNodesHeight);
        }
        nodeTopAlignsWithStickyNodesBottom(node, stickyNodesHeight) {
            const nodeIndex = this.getNodeIndex(node);
            const elementTop = this.view.getElementTop(nodeIndex);
            const stickyPosition = stickyNodesHeight;
            return this.view.scrollTop === elementTop - stickyPosition;
        }
        createStickyScrollNode(node, currentStickyNodesHeight) {
            const height = this.treeDelegate.getHeight(node);
            const { startIndex, endIndex } = this.getNodeRange(node);
            const position = this.calculateStickyNodePosition(endIndex, currentStickyNodesHeight, height);
            return { node, position, height, startIndex, endIndex };
        }
        getAncestorUnderPrevious(node, previousAncestor = undefined) {
            let currentAncestor = node;
            let parentOfcurrentAncestor = this.getParentNode(currentAncestor);
            while (parentOfcurrentAncestor) {
                if (parentOfcurrentAncestor === previousAncestor) {
                    return currentAncestor;
                }
                currentAncestor = parentOfcurrentAncestor;
                parentOfcurrentAncestor = this.getParentNode(currentAncestor);
            }
            if (previousAncestor === undefined) {
                return currentAncestor;
            }
            return undefined;
        }
        calculateStickyNodePosition(lastDescendantIndex, stickyRowPositionTop, stickyNodeHeight) {
            let lastChildRelativeTop = this.view.getRelativeTop(lastDescendantIndex);
            // If the last descendant is only partially visible at the top of the view, getRelativeTop() returns null
            // In that case, utilize the next node's relative top to calculate the sticky node's position
            if (lastChildRelativeTop === null && this.view.firstVisibleIndex === lastDescendantIndex && lastDescendantIndex + 1 < this.view.length) {
                const nodeHeight = this.treeDelegate.getHeight(this.view.element(lastDescendantIndex));
                const nextNodeRelativeTop = this.view.getRelativeTop(lastDescendantIndex + 1);
                lastChildRelativeTop = nextNodeRelativeTop ? nextNodeRelativeTop - nodeHeight / this.view.renderHeight : null;
            }
            if (lastChildRelativeTop === null) {
                return stickyRowPositionTop;
            }
            const lastChildNode = this.view.element(lastDescendantIndex);
            const lastChildHeight = this.treeDelegate.getHeight(lastChildNode);
            const topOfLastChild = lastChildRelativeTop * this.view.renderHeight;
            const bottomOfLastChild = topOfLastChild + lastChildHeight;
            if (stickyRowPositionTop + stickyNodeHeight > bottomOfLastChild && stickyRowPositionTop <= bottomOfLastChild) {
                return bottomOfLastChild - stickyNodeHeight;
            }
            return stickyRowPositionTop;
        }
        constrainStickyNodes(stickyNodes) {
            if (stickyNodes.length === 0) {
                return [];
            }
            // Check if sticky nodes need to be constrained
            const maximumStickyWidgetHeight = this.view.renderHeight * this.maxWidgetViewRatio;
            const lastStickyNode = stickyNodes[stickyNodes.length - 1];
            if (stickyNodes.length <= this.stickyScrollMaxItemCount && lastStickyNode.position + lastStickyNode.height <= maximumStickyWidgetHeight) {
                return stickyNodes;
            }
            // constrain sticky nodes
            const constrainedStickyNodes = this.stickyScrollDelegate.constrainStickyScrollNodes(stickyNodes, this.stickyScrollMaxItemCount, maximumStickyWidgetHeight);
            if (!constrainedStickyNodes.length) {
                return [];
            }
            // Validate constraints
            const lastConstrainedStickyNode = constrainedStickyNodes[constrainedStickyNodes.length - 1];
            if (constrainedStickyNodes.length > this.stickyScrollMaxItemCount || lastConstrainedStickyNode.position + lastConstrainedStickyNode.height > maximumStickyWidgetHeight) {
                throw new Error('stickyScrollDelegate violates constraints');
            }
            return constrainedStickyNodes;
        }
        getParentNode(node) {
            const nodeLocation = this.model.getNodeLocation(node);
            const parentLocation = this.model.getParentNodeLocation(nodeLocation);
            return parentLocation ? this.model.getNode(parentLocation) : undefined;
        }
        nodeIsUncollapsedParent(node) {
            const nodeLocation = this.model.getNodeLocation(node);
            return this.model.getListRenderCount(nodeLocation) > 1;
        }
        getNodeIndex(node) {
            const nodeLocation = this.model.getNodeLocation(node);
            const nodeIndex = this.model.getListIndex(nodeLocation);
            return nodeIndex;
        }
        getNodeRange(node) {
            const nodeLocation = this.model.getNodeLocation(node);
            const startIndex = this.model.getListIndex(nodeLocation);
            if (startIndex < 0) {
                throw new Error('Node not found in tree');
            }
            const renderCount = this.model.getListRenderCount(nodeLocation);
            const endIndex = startIndex + renderCount - 1;
            return { startIndex, endIndex };
        }
        nodePositionTopBelowWidget(node) {
            const ancestors = [];
            let currentAncestor = this.getParentNode(node);
            while (currentAncestor) {
                ancestors.push(currentAncestor);
                currentAncestor = this.getParentNode(currentAncestor);
            }
            let widgetHeight = 0;
            for (let i = 0; i < ancestors.length && i < this.stickyScrollMaxItemCount; i++) {
                widgetHeight += this.treeDelegate.getHeight(ancestors[i]);
            }
            return widgetHeight;
        }
        getFocus() {
            return this._widget.getFocus();
        }
        domFocus() {
            this._widget.domFocus();
        }
        // Whether sticky scroll was the last focused part in the tree or not
        focusedLast() {
            return this._widget.focusedLast();
        }
        updateOptions(optionsUpdate = {}) {
            if (!optionsUpdate.stickyScrollMaxItemCount) {
                return;
            }
            const validatedOptions = this.validateStickySettings(optionsUpdate);
            if (this.stickyScrollMaxItemCount !== validatedOptions.stickyScrollMaxItemCount) {
                this.stickyScrollMaxItemCount = validatedOptions.stickyScrollMaxItemCount;
                this.update();
            }
        }
        validateStickySettings(options) {
            let stickyScrollMaxItemCount = 7;
            if (typeof options.stickyScrollMaxItemCount === 'number') {
                stickyScrollMaxItemCount = Math.max(options.stickyScrollMaxItemCount, 1);
            }
            return { stickyScrollMaxItemCount };
        }
    }
    class StickyScrollWidget {
        constructor(container, view, tree, treeRenderers, treeDelegate, accessibilityProvider) {
            this.view = view;
            this.tree = tree;
            this.treeRenderers = treeRenderers;
            this.treeDelegate = treeDelegate;
            this.accessibilityProvider = accessibilityProvider;
            this._previousElements = [];
            this._previousStateDisposables = new lifecycle_1.DisposableStore();
            this._rootDomNode = (0, dom_1.$)('.monaco-tree-sticky-container.empty');
            container.appendChild(this._rootDomNode);
            const shadow = (0, dom_1.$)('.monaco-tree-sticky-container-shadow');
            this._rootDomNode.appendChild(shadow);
            this.stickyScrollFocus = new StickyScrollFocus(this._rootDomNode, view);
            this.onDidChangeHasFocus = this.stickyScrollFocus.onDidChangeHasFocus;
            this.onContextMenu = this.stickyScrollFocus.onContextMenu;
        }
        get height() {
            if (!this._previousState) {
                return 0;
            }
            const lastElement = this._previousState.stickyNodes[this._previousState.count - 1];
            return lastElement.position + lastElement.height;
        }
        get count() {
            return this._previousState?.count ?? 0;
        }
        getNode(node) {
            return this._previousState?.stickyNodes.find(stickyNode => stickyNode.node === node);
        }
        setState(state) {
            const wasVisible = !!this._previousState && this._previousState.count > 0;
            const isVisible = !!state && state.count > 0;
            // If state has not changed, do nothing
            if ((!wasVisible && !isVisible) || (wasVisible && isVisible && this._previousState.equal(state))) {
                return;
            }
            // Update visibility of the widget if changed
            if (wasVisible !== isVisible) {
                this.setVisible(isVisible);
            }
            if (!isVisible) {
                this._previousState = undefined;
                this._previousElements = [];
                this._previousStateDisposables.clear();
                return;
            }
            const lastStickyNode = state.stickyNodes[state.count - 1];
            // If the new state is only a change in the last node's position, update the position of the last element
            if (this._previousState && state.animationStateChanged(this._previousState)) {
                this._previousElements[this._previousState.count - 1].style.top = `${lastStickyNode.position}px`;
            }
            // create new dom elements
            else {
                this._previousStateDisposables.clear();
                const elements = Array(state.count);
                for (let stickyIndex = state.count - 1; stickyIndex >= 0; stickyIndex--) {
                    const stickyNode = state.stickyNodes[stickyIndex];
                    const { element, disposable } = this.createElement(stickyNode, stickyIndex, state.count);
                    elements[stickyIndex] = element;
                    this._rootDomNode.appendChild(element);
                    this._previousStateDisposables.add(disposable);
                }
                this.stickyScrollFocus.updateElements(elements, state);
                this._previousElements = elements;
            }
            this._previousState = state;
            // Set the height of the widget to the bottom of the last sticky node
            this._rootDomNode.style.height = `${lastStickyNode.position + lastStickyNode.height}px`;
        }
        createElement(stickyNode, stickyIndex, stickyNodesTotal) {
            const nodeIndex = stickyNode.startIndex;
            // Sticky element container
            const stickyElement = document.createElement('div');
            stickyElement.style.top = `${stickyNode.position}px`;
            if (this.tree.options.setRowHeight !== false) {
                stickyElement.style.height = `${stickyNode.height}px`;
            }
            if (this.tree.options.setRowLineHeight !== false) {
                stickyElement.style.lineHeight = `${stickyNode.height}px`;
            }
            stickyElement.classList.add('monaco-tree-sticky-row');
            stickyElement.classList.add('monaco-list-row');
            stickyElement.setAttribute('data-index', `${nodeIndex}`);
            stickyElement.setAttribute('data-parity', nodeIndex % 2 === 0 ? 'even' : 'odd');
            stickyElement.setAttribute('id', this.view.getElementID(nodeIndex));
            const accessibilityDisposable = this.setAccessibilityAttributes(stickyElement, stickyNode.node.element, stickyIndex, stickyNodesTotal);
            // Get the renderer for the node
            const nodeTemplateId = this.treeDelegate.getTemplateId(stickyNode.node);
            const renderer = this.treeRenderers.find((renderer) => renderer.templateId === nodeTemplateId);
            if (!renderer) {
                throw new Error(`No renderer found for template id ${nodeTemplateId}`);
            }
            // To make sure we do not influence the original node, we create a copy of the node
            // We need to check if it is already a unique instance of the node by the delegate
            let nodeCopy = stickyNode.node;
            if (nodeCopy === this.tree.getNode(this.tree.getNodeLocation(stickyNode.node))) {
                nodeCopy = new Proxy(stickyNode.node, {});
            }
            // Render the element
            const templateData = renderer.renderTemplate(stickyElement);
            renderer.renderElement(nodeCopy, stickyNode.startIndex, templateData, stickyNode.height);
            // Remove the element from the DOM when state is disposed
            const disposable = (0, lifecycle_1.toDisposable)(() => {
                accessibilityDisposable.dispose();
                renderer.disposeElement(nodeCopy, stickyNode.startIndex, templateData, stickyNode.height);
                renderer.disposeTemplate(templateData);
                stickyElement.remove();
            });
            return { element: stickyElement, disposable };
        }
        setAccessibilityAttributes(container, element, stickyIndex, stickyNodesTotal) {
            if (!this.accessibilityProvider) {
                return lifecycle_1.Disposable.None;
            }
            if (this.accessibilityProvider.getSetSize) {
                container.setAttribute('aria-setsize', String(this.accessibilityProvider.getSetSize(element, stickyIndex, stickyNodesTotal)));
            }
            if (this.accessibilityProvider.getPosInSet) {
                container.setAttribute('aria-posinset', String(this.accessibilityProvider.getPosInSet(element, stickyIndex)));
            }
            if (this.accessibilityProvider.getRole) {
                container.setAttribute('role', this.accessibilityProvider.getRole(element) ?? 'treeitem');
            }
            const ariaLabel = this.accessibilityProvider.getAriaLabel(element);
            const observable = (ariaLabel && typeof ariaLabel !== 'string') ? ariaLabel : (0, observable_1.constObservable)(ariaLabel);
            const result = (0, observable_1.autorun)(reader => {
                const value = reader.readObservable(observable);
                if (value) {
                    container.setAttribute('aria-label', value);
                }
                else {
                    container.removeAttribute('aria-label');
                }
            });
            if (typeof ariaLabel === 'string') {
            }
            else if (ariaLabel) {
                container.setAttribute('aria-label', ariaLabel.get());
            }
            const ariaLevel = this.accessibilityProvider.getAriaLevel && this.accessibilityProvider.getAriaLevel(element);
            if (typeof ariaLevel === 'number') {
                container.setAttribute('aria-level', `${ariaLevel}`);
            }
            // Sticky Scroll elements can not be selected
            container.setAttribute('aria-selected', String(false));
            return result;
        }
        setVisible(visible) {
            this._rootDomNode.classList.toggle('empty', !visible);
            if (!visible) {
                this.stickyScrollFocus.updateElements([], undefined);
            }
        }
        getFocus() {
            return this.stickyScrollFocus.getFocus();
        }
        domFocus() {
            this.stickyScrollFocus.domFocus();
        }
        focusedLast() {
            return this.stickyScrollFocus.focusedLast();
        }
        dispose() {
            this.stickyScrollFocus.dispose();
            this._previousStateDisposables.dispose();
            this._rootDomNode.remove();
        }
    }
    class StickyScrollFocus extends lifecycle_1.Disposable {
        get domHasFocus() { return this._domHasFocus; }
        set domHasFocus(hasFocus) {
            if (hasFocus !== this._domHasFocus) {
                this._onDidChangeHasFocus.fire(hasFocus);
                this._domHasFocus = hasFocus;
            }
        }
        constructor(container, view) {
            super();
            this.container = container;
            this.view = view;
            this.focusedIndex = -1;
            this.elements = [];
            this._onDidChangeHasFocus = new event_2.Emitter();
            this.onDidChangeHasFocus = this._onDidChangeHasFocus.event;
            this._onContextMenu = new event_2.Emitter();
            this.onContextMenu = this._onContextMenu.event;
            this._domHasFocus = false;
            this.container.addEventListener('focus', () => this.onFocus());
            this.container.addEventListener('blur', () => this.onBlur());
            this._register(this.view.onDidFocus(() => this.toggleStickyScrollFocused(false)));
            this._register(this.view.onKeyDown((e) => this.onKeyDown(e)));
            this._register(this.view.onMouseDown((e) => this.onMouseDown(e)));
            this._register(this.view.onContextMenu((e) => this.handleContextMenu(e)));
        }
        handleContextMenu(e) {
            const target = e.browserEvent.target;
            if (!(0, listWidget_1.isStickyScrollContainer)(target) && !(0, listWidget_1.isStickyScrollElement)(target)) {
                if (this.focusedLast()) {
                    this.view.domFocus();
                }
                return;
            }
            // The list handles the context menu triggered by a mouse event
            // In that case only set the focus of the element clicked and leave the rest to the list to handle
            if (!(0, dom_1.isKeyboardEvent)(e.browserEvent)) {
                if (!this.state) {
                    throw new Error('Context menu should not be triggered when state is undefined');
                }
                const stickyIndex = this.state.stickyNodes.findIndex(stickyNode => stickyNode.node.element === e.element?.element);
                if (stickyIndex === -1) {
                    throw new Error('Context menu should not be triggered when element is not in sticky scroll widget');
                }
                this.container.focus();
                this.setFocus(stickyIndex);
                return;
            }
            if (!this.state || this.focusedIndex < 0) {
                throw new Error('Context menu key should not be triggered when focus is not in sticky scroll widget');
            }
            const stickyNode = this.state.stickyNodes[this.focusedIndex];
            const element = stickyNode.node.element;
            const anchor = this.elements[this.focusedIndex];
            this._onContextMenu.fire({ element, anchor, browserEvent: e.browserEvent, isStickyScroll: true });
        }
        onKeyDown(e) {
            // Sticky Scroll Navigation
            if (this.domHasFocus && this.state) {
                // Move up
                if (e.key === 'ArrowUp') {
                    this.setFocusedElement(Math.max(0, this.focusedIndex - 1));
                    e.preventDefault();
                    e.stopPropagation();
                }
                // Move down, if last sticky node is focused, move focus into first child of last sticky node
                else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    if (this.focusedIndex >= this.state.count - 1) {
                        const nodeIndexToFocus = this.state.stickyNodes[this.state.count - 1].startIndex + 1;
                        this.view.domFocus();
                        this.view.setFocus([nodeIndexToFocus]);
                        this.scrollNodeUnderWidget(nodeIndexToFocus, this.state);
                    }
                    else {
                        this.setFocusedElement(this.focusedIndex + 1);
                    }
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }
        onMouseDown(e) {
            const target = e.browserEvent.target;
            if (!(0, listWidget_1.isStickyScrollContainer)(target) && !(0, listWidget_1.isStickyScrollElement)(target)) {
                return;
            }
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
        }
        updateElements(elements, state) {
            if (state && state.count === 0) {
                throw new Error('Sticky scroll state must be undefined when there are no sticky nodes');
            }
            if (state && state.count !== elements.length) {
                throw new Error('Sticky scroll focus received illigel state');
            }
            const previousIndex = this.focusedIndex;
            this.removeFocus();
            this.elements = elements;
            this.state = state;
            if (state) {
                const newFocusedIndex = (0, numbers_1.clamp)(previousIndex, 0, state.count - 1);
                this.setFocus(newFocusedIndex);
            }
            else {
                if (this.domHasFocus) {
                    this.view.domFocus();
                }
            }
            // must come last as it calls blur()
            this.container.tabIndex = state ? 0 : -1;
        }
        setFocusedElement(stickyIndex) {
            // doesn't imply that the widget has (or will have) focus
            const state = this.state;
            if (!state) {
                throw new Error('Cannot set focus when state is undefined');
            }
            this.setFocus(stickyIndex);
            if (stickyIndex < state.count - 1) {
                return;
            }
            // If the last sticky node is not fully visible, scroll it into view
            if (state.lastNodePartiallyVisible()) {
                const lastStickyNode = state.stickyNodes[stickyIndex];
                this.scrollNodeUnderWidget(lastStickyNode.endIndex + 1, state);
            }
        }
        scrollNodeUnderWidget(nodeIndex, state) {
            const lastStickyNode = state.stickyNodes[state.count - 1];
            const secondLastStickyNode = state.count > 1 ? state.stickyNodes[state.count - 2] : undefined;
            const elementScrollTop = this.view.getElementTop(nodeIndex);
            const elementTargetViewTop = secondLastStickyNode ? secondLastStickyNode.position + secondLastStickyNode.height + lastStickyNode.height : lastStickyNode.height;
            this.view.scrollTop = elementScrollTop - elementTargetViewTop;
        }
        getFocus() {
            if (!this.state || this.focusedIndex === -1) {
                return undefined;
            }
            return this.state.stickyNodes[this.focusedIndex].node.element;
        }
        domFocus() {
            if (!this.state) {
                throw new Error('Cannot focus when state is undefined');
            }
            this.container.focus();
        }
        focusedLast() {
            if (!this.state) {
                return false;
            }
            return this.view.getHTMLElement().classList.contains('sticky-scroll-focused');
        }
        removeFocus() {
            if (this.focusedIndex === -1) {
                return;
            }
            this.toggleElementFocus(this.elements[this.focusedIndex], false);
            this.focusedIndex = -1;
        }
        setFocus(newFocusIndex) {
            if (0 > newFocusIndex) {
                throw new Error('addFocus() can not remove focus');
            }
            if (!this.state && newFocusIndex >= 0) {
                throw new Error('Cannot set focus index when state is undefined');
            }
            if (this.state && newFocusIndex >= this.state.count) {
                throw new Error('Cannot set focus index to an index that does not exist');
            }
            const oldIndex = this.focusedIndex;
            if (oldIndex >= 0) {
                this.toggleElementFocus(this.elements[oldIndex], false);
            }
            if (newFocusIndex >= 0) {
                this.toggleElementFocus(this.elements[newFocusIndex], true);
            }
            this.focusedIndex = newFocusIndex;
        }
        toggleElementFocus(element, focused) {
            this.toggleElementActiveFocus(element, focused && this.domHasFocus);
            this.toggleElementPassiveFocus(element, focused);
        }
        toggleCurrentElementActiveFocus(focused) {
            if (this.focusedIndex === -1) {
                return;
            }
            this.toggleElementActiveFocus(this.elements[this.focusedIndex], focused);
        }
        toggleElementActiveFocus(element, focused) {
            // active focus is set when sticky scroll has focus
            element.classList.toggle('focused', focused);
        }
        toggleElementPassiveFocus(element, focused) {
            // passive focus allows to show focus when sticky scroll does not have focus
            // for example when the context menu has focus
            element.classList.toggle('passive-focused', focused);
        }
        toggleStickyScrollFocused(focused) {
            // Weather the last focus in the view was sticky scroll and not the list
            // Is only removed when the focus is back in the tree an no longer in sticky scroll
            this.view.getHTMLElement().classList.toggle('sticky-scroll-focused', focused);
        }
        onFocus() {
            if (!this.state || this.elements.length === 0) {
                throw new Error('Cannot focus when state is undefined or elements are empty');
            }
            this.domHasFocus = true;
            this.toggleStickyScrollFocused(true);
            this.toggleCurrentElementActiveFocus(true);
            if (this.focusedIndex === -1) {
                this.setFocus(0);
            }
        }
        onBlur() {
            this.domHasFocus = false;
            this.toggleCurrentElementActiveFocus(false);
        }
        dispose() {
            this.toggleStickyScrollFocused(false);
            this._onDidChangeHasFocus.fire(false);
            super.dispose();
        }
    }
    function asTreeMouseEvent(event) {
        let target = tree_1.TreeMouseEventTarget.Unknown;
        if ((0, dom_1.hasParentWithClass)(event.browserEvent.target, 'monaco-tl-twistie', 'monaco-tl-row')) {
            target = tree_1.TreeMouseEventTarget.Twistie;
        }
        else if ((0, dom_1.hasParentWithClass)(event.browserEvent.target, 'monaco-tl-contents', 'monaco-tl-row')) {
            target = tree_1.TreeMouseEventTarget.Element;
        }
        else if ((0, dom_1.hasParentWithClass)(event.browserEvent.target, 'monaco-tree-type-filter', 'monaco-list')) {
            target = tree_1.TreeMouseEventTarget.Filter;
        }
        return {
            browserEvent: event.browserEvent,
            element: event.element ? event.element.element : null,
            target
        };
    }
    function asTreeContextMenuEvent(event) {
        const isStickyScroll = (0, listWidget_1.isStickyScrollContainer)(event.browserEvent.target);
        return {
            element: event.element ? event.element.element : null,
            browserEvent: event.browserEvent,
            anchor: event.anchor,
            isStickyScroll
        };
    }
    function dfs(node, fn) {
        fn(node);
        node.children.forEach(child => dfs(child, fn));
    }
    /**
     * The trait concept needs to exist at the tree level, because collapsed
     * tree nodes will not be known by the list.
     */
    class Trait {
        get nodeSet() {
            if (!this._nodeSet) {
                this._nodeSet = this.createNodeSet();
            }
            return this._nodeSet;
        }
        constructor(getFirstViewElementWithTrait, identityProvider) {
            this.getFirstViewElementWithTrait = getFirstViewElementWithTrait;
            this.identityProvider = identityProvider;
            this.nodes = [];
            this._onDidChange = new event_2.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        set(nodes, browserEvent) {
            if (!browserEvent?.__forceEvent && (0, arrays_1.equals)(this.nodes, nodes)) {
                return;
            }
            this._set(nodes, false, browserEvent);
        }
        _set(nodes, silent, browserEvent) {
            this.nodes = [...nodes];
            this.elements = undefined;
            this._nodeSet = undefined;
            if (!silent) {
                const that = this;
                this._onDidChange.fire({ get elements() { return that.get(); }, browserEvent });
            }
        }
        get() {
            if (!this.elements) {
                this.elements = this.nodes.map(node => node.element);
            }
            return [...this.elements];
        }
        getNodes() {
            return this.nodes;
        }
        has(node) {
            return this.nodeSet.has(node);
        }
        onDidModelSplice({ insertedNodes, deletedNodes }) {
            if (!this.identityProvider) {
                const set = this.createNodeSet();
                const visit = (node) => set.delete(node);
                deletedNodes.forEach(node => dfs(node, visit));
                this.set([...set.values()]);
                return;
            }
            const deletedNodesIdSet = new Set();
            const deletedNodesVisitor = (node) => deletedNodesIdSet.add(this.identityProvider.getId(node.element).toString());
            deletedNodes.forEach(node => dfs(node, deletedNodesVisitor));
            const insertedNodesMap = new Map();
            const insertedNodesVisitor = (node) => insertedNodesMap.set(this.identityProvider.getId(node.element).toString(), node);
            insertedNodes.forEach(node => dfs(node, insertedNodesVisitor));
            const nodes = [];
            for (const node of this.nodes) {
                const id = this.identityProvider.getId(node.element).toString();
                const wasDeleted = deletedNodesIdSet.has(id);
                if (!wasDeleted) {
                    nodes.push(node);
                }
                else {
                    const insertedNode = insertedNodesMap.get(id);
                    if (insertedNode && insertedNode.visible) {
                        nodes.push(insertedNode);
                    }
                }
            }
            if (this.nodes.length > 0 && nodes.length === 0) {
                const node = this.getFirstViewElementWithTrait();
                if (node) {
                    nodes.push(node);
                }
            }
            this._set(nodes, true);
        }
        createNodeSet() {
            const set = new Set();
            for (const node of this.nodes) {
                set.add(node);
            }
            return set;
        }
    }
    class TreeNodeListMouseController extends listWidget_1.MouseController {
        constructor(list, tree, stickyScrollProvider) {
            super(list);
            this.tree = tree;
            this.stickyScrollProvider = stickyScrollProvider;
        }
        onViewPointer(e) {
            if ((0, listWidget_1.isButton)(e.browserEvent.target) ||
                (0, listWidget_1.isInputElement)(e.browserEvent.target) ||
                (0, listWidget_1.isMonacoEditor)(e.browserEvent.target)) {
                return;
            }
            if (e.browserEvent.isHandledByList) {
                return;
            }
            const node = e.element;
            if (!node) {
                return super.onViewPointer(e);
            }
            if (this.isSelectionRangeChangeEvent(e) || this.isSelectionSingleChangeEvent(e)) {
                return super.onViewPointer(e);
            }
            const target = e.browserEvent.target;
            const onTwistie = target.classList.contains('monaco-tl-twistie')
                || (target.classList.contains('monaco-icon-label') && target.classList.contains('folder-icon') && e.browserEvent.offsetX < 16);
            const isStickyElement = (0, listWidget_1.isStickyScrollElement)(e.browserEvent.target);
            let expandOnlyOnTwistieClick = false;
            if (isStickyElement) {
                expandOnlyOnTwistieClick = true;
            }
            else if (typeof this.tree.expandOnlyOnTwistieClick === 'function') {
                expandOnlyOnTwistieClick = this.tree.expandOnlyOnTwistieClick(node.element);
            }
            else {
                expandOnlyOnTwistieClick = !!this.tree.expandOnlyOnTwistieClick;
            }
            if (!isStickyElement) {
                if (expandOnlyOnTwistieClick && !onTwistie && e.browserEvent.detail !== 2) {
                    return super.onViewPointer(e);
                }
                if (!this.tree.expandOnDoubleClick && e.browserEvent.detail === 2) {
                    return super.onViewPointer(e);
                }
            }
            else {
                this.handleStickyScrollMouseEvent(e, node);
            }
            if (node.collapsible && (!isStickyElement || onTwistie)) {
                const location = this.tree.getNodeLocation(node);
                const recursive = e.browserEvent.altKey;
                this.tree.setFocus([location]);
                this.tree.toggleCollapsed(location, recursive);
                if (expandOnlyOnTwistieClick && onTwistie) {
                    // Do not set this before calling a handler on the super class, because it will reject it as handled
                    e.browserEvent.isHandledByList = true;
                    return;
                }
            }
            if (!isStickyElement) {
                super.onViewPointer(e);
            }
        }
        handleStickyScrollMouseEvent(e, node) {
            if ((0, listWidget_1.isMonacoCustomToggle)(e.browserEvent.target) || (0, listWidget_1.isActionItem)(e.browserEvent.target)) {
                return;
            }
            const stickyScrollController = this.stickyScrollProvider();
            if (!stickyScrollController) {
                throw new Error('Sticky scroll controller not found');
            }
            const nodeIndex = this.list.indexOf(node);
            const elementScrollTop = this.list.getElementTop(nodeIndex);
            const elementTargetViewTop = stickyScrollController.nodePositionTopBelowWidget(node);
            this.tree.scrollTop = elementScrollTop - elementTargetViewTop;
            this.list.domFocus();
            this.list.setFocus([nodeIndex]);
            this.list.setSelection([nodeIndex]);
        }
        onDoubleClick(e) {
            const onTwistie = e.browserEvent.target.classList.contains('monaco-tl-twistie');
            if (onTwistie || !this.tree.expandOnDoubleClick) {
                return;
            }
            if (e.browserEvent.isHandledByList) {
                return;
            }
            super.onDoubleClick(e);
        }
        // to make sure dom focus is not stolen (for example with context menu)
        onMouseDown(e) {
            const target = e.browserEvent.target;
            if (!(0, listWidget_1.isStickyScrollContainer)(target) && !(0, listWidget_1.isStickyScrollElement)(target)) {
                super.onMouseDown(e);
                return;
            }
        }
        onContextMenu(e) {
            const target = e.browserEvent.target;
            if (!(0, listWidget_1.isStickyScrollContainer)(target) && !(0, listWidget_1.isStickyScrollElement)(target)) {
                super.onContextMenu(e);
                return;
            }
        }
    }
    /**
     * We use this List subclass to restore selection and focus as nodes
     * get rendered in the list, possibly due to a node expand() call.
     */
    class TreeNodeList extends listWidget_1.List {
        constructor(user, container, virtualDelegate, renderers, focusTrait, selectionTrait, anchorTrait, options) {
            super(user, container, virtualDelegate, renderers, options);
            this.focusTrait = focusTrait;
            this.selectionTrait = selectionTrait;
            this.anchorTrait = anchorTrait;
        }
        createMouseController(options) {
            return new TreeNodeListMouseController(this, options.tree, options.stickyScrollProvider);
        }
        splice(start, deleteCount, elements = []) {
            super.splice(start, deleteCount, elements);
            if (elements.length === 0) {
                return;
            }
            const additionalFocus = [];
            const additionalSelection = [];
            let anchor;
            elements.forEach((node, index) => {
                if (this.focusTrait.has(node)) {
                    additionalFocus.push(start + index);
                }
                if (this.selectionTrait.has(node)) {
                    additionalSelection.push(start + index);
                }
                if (this.anchorTrait.has(node)) {
                    anchor = start + index;
                }
            });
            if (additionalFocus.length > 0) {
                super.setFocus((0, arrays_1.distinct)([...super.getFocus(), ...additionalFocus]));
            }
            if (additionalSelection.length > 0) {
                super.setSelection((0, arrays_1.distinct)([...super.getSelection(), ...additionalSelection]));
            }
            if (typeof anchor === 'number') {
                super.setAnchor(anchor);
            }
        }
        setFocus(indexes, browserEvent, fromAPI = false) {
            super.setFocus(indexes, browserEvent);
            if (!fromAPI) {
                this.focusTrait.set(indexes.map(i => this.element(i)), browserEvent);
            }
        }
        setSelection(indexes, browserEvent, fromAPI = false) {
            super.setSelection(indexes, browserEvent);
            if (!fromAPI) {
                this.selectionTrait.set(indexes.map(i => this.element(i)), browserEvent);
            }
        }
        setAnchor(index, fromAPI = false) {
            super.setAnchor(index);
            if (!fromAPI) {
                if (typeof index === 'undefined') {
                    this.anchorTrait.set([]);
                }
                else {
                    this.anchorTrait.set([this.element(index)]);
                }
            }
        }
    }
    var AbstractTreePart;
    (function (AbstractTreePart) {
        AbstractTreePart[AbstractTreePart["Tree"] = 0] = "Tree";
        AbstractTreePart[AbstractTreePart["StickyScroll"] = 1] = "StickyScroll";
    })(AbstractTreePart || (exports.AbstractTreePart = AbstractTreePart = {}));
    class AbstractTree {
        get onDidScroll() { return this.view.onDidScroll; }
        get onDidChangeFocus() { return this.eventBufferer.wrapEvent(this.focus.onDidChange); }
        get onDidChangeSelection() { return this.eventBufferer.wrapEvent(this.selection.onDidChange); }
        get onMouseClick() { return event_2.Event.map(this.view.onMouseClick, asTreeMouseEvent); }
        get onMouseDblClick() { return event_2.Event.filter(event_2.Event.map(this.view.onMouseDblClick, asTreeMouseEvent), e => e.target !== tree_1.TreeMouseEventTarget.Filter); }
        get onMouseOver() { return event_2.Event.map(this.view.onMouseOver, asTreeMouseEvent); }
        get onMouseOut() { return event_2.Event.map(this.view.onMouseOut, asTreeMouseEvent); }
        get onContextMenu() { return event_2.Event.any(event_2.Event.filter(event_2.Event.map(this.view.onContextMenu, asTreeContextMenuEvent), e => !e.isStickyScroll), this.stickyScrollController?.onContextMenu ?? event_2.Event.None); }
        get onTap() { return event_2.Event.map(this.view.onTap, asTreeMouseEvent); }
        get onPointer() { return event_2.Event.map(this.view.onPointer, asTreeMouseEvent); }
        get onKeyDown() { return this.view.onKeyDown; }
        get onKeyUp() { return this.view.onKeyUp; }
        get onKeyPress() { return this.view.onKeyPress; }
        get onDidFocus() { return this.view.onDidFocus; }
        get onDidBlur() { return this.view.onDidBlur; }
        get onDidChangeModel() { return event_2.Event.signal(this.model.onDidSplice); }
        get onDidChangeCollapseState() { return this.model.onDidChangeCollapseState; }
        get onDidChangeRenderNodeCount() { return this.model.onDidChangeRenderNodeCount; }
        get findMode() { return this.findController?.mode ?? TreeFindMode.Highlight; }
        set findMode(findMode) { if (this.findController) {
            this.findController.mode = findMode;
        } }
        get findMatchType() { return this.findController?.matchType ?? TreeFindMatchType.Fuzzy; }
        set findMatchType(findFuzzy) { if (this.findController) {
            this.findController.matchType = findFuzzy;
        } }
        get onDidChangeFindPattern() { return this.findController ? this.findController.onDidChangePattern : event_2.Event.None; }
        get expandOnDoubleClick() { return typeof this._options.expandOnDoubleClick === 'undefined' ? true : this._options.expandOnDoubleClick; }
        get expandOnlyOnTwistieClick() { return typeof this._options.expandOnlyOnTwistieClick === 'undefined' ? true : this._options.expandOnlyOnTwistieClick; }
        get onDidDispose() { return this.view.onDidDispose; }
        constructor(_user, container, delegate, renderers, _options = {}) {
            this._user = _user;
            this._options = _options;
            this.eventBufferer = new event_2.EventBufferer();
            this.onDidChangeFindOpenState = event_2.Event.None;
            this.onDidChangeStickyScrollFocused = event_2.Event.None;
            this.disposables = new lifecycle_1.DisposableStore();
            this._onWillRefilter = new event_2.Emitter();
            this.onWillRefilter = this._onWillRefilter.event;
            this._onDidUpdateOptions = new event_2.Emitter();
            this.onDidUpdateOptions = this._onDidUpdateOptions.event;
            this.treeDelegate = new ComposedTreeDelegate(delegate);
            const onDidChangeCollapseStateRelay = new event_2.Relay();
            const onDidChangeActiveNodes = new event_2.Relay();
            const activeNodes = this.disposables.add(new EventCollection(onDidChangeActiveNodes.event));
            const renderedIndentGuides = new map_1.SetMap();
            this.renderers = renderers.map(r => new TreeRenderer(r, () => this.model, onDidChangeCollapseStateRelay.event, activeNodes, renderedIndentGuides, _options));
            for (const r of this.renderers) {
                this.disposables.add(r);
            }
            let filter;
            if (_options.keyboardNavigationLabelProvider) {
                filter = new FindFilter(this, _options.keyboardNavigationLabelProvider, _options.filter);
                _options = { ..._options, filter: filter }; // TODO need typescript help here
                this.disposables.add(filter);
            }
            this.focus = new Trait(() => this.view.getFocusedElements()[0], _options.identityProvider);
            this.selection = new Trait(() => this.view.getSelectedElements()[0], _options.identityProvider);
            this.anchor = new Trait(() => this.view.getAnchorElement(), _options.identityProvider);
            this.view = new TreeNodeList(_user, container, this.treeDelegate, this.renderers, this.focus, this.selection, this.anchor, { ...asListOptions(() => this.model, _options), tree: this, stickyScrollProvider: () => this.stickyScrollController });
            this.model = this.createModel(_user, this.view, _options);
            onDidChangeCollapseStateRelay.input = this.model.onDidChangeCollapseState;
            const onDidModelSplice = event_2.Event.forEach(this.model.onDidSplice, e => {
                this.eventBufferer.bufferEvents(() => {
                    this.focus.onDidModelSplice(e);
                    this.selection.onDidModelSplice(e);
                });
            }, this.disposables);
            // Make sure the `forEach` always runs
            onDidModelSplice(() => null, null, this.disposables);
            // Active nodes can change when the model changes or when focus or selection change.
            // We debounce it with 0 delay since these events may fire in the same stack and we only
            // want to run this once. It also doesn't matter if it runs on the next tick since it's only
            // a nice to have UI feature.
            const activeNodesEmitter = this.disposables.add(new event_2.Emitter());
            const activeNodesDebounce = this.disposables.add(new async_1.Delayer(0));
            this.disposables.add(event_2.Event.any(onDidModelSplice, this.focus.onDidChange, this.selection.onDidChange)(() => {
                activeNodesDebounce.trigger(() => {
                    const set = new Set();
                    for (const node of this.focus.getNodes()) {
                        set.add(node);
                    }
                    for (const node of this.selection.getNodes()) {
                        set.add(node);
                    }
                    activeNodesEmitter.fire([...set.values()]);
                });
            }));
            onDidChangeActiveNodes.input = activeNodesEmitter.event;
            if (_options.keyboardSupport !== false) {
                const onKeyDown = event_2.Event.chain(this.view.onKeyDown, $ => $.filter(e => !(0, listWidget_1.isInputElement)(e.target))
                    .map(e => new keyboardEvent_1.StandardKeyboardEvent(e)));
                event_2.Event.chain(onKeyDown, $ => $.filter(e => e.keyCode === 15 /* KeyCode.LeftArrow */))(this.onLeftArrow, this, this.disposables);
                event_2.Event.chain(onKeyDown, $ => $.filter(e => e.keyCode === 17 /* KeyCode.RightArrow */))(this.onRightArrow, this, this.disposables);
                event_2.Event.chain(onKeyDown, $ => $.filter(e => e.keyCode === 10 /* KeyCode.Space */))(this.onSpace, this, this.disposables);
            }
            if ((_options.findWidgetEnabled ?? true) && _options.keyboardNavigationLabelProvider && _options.contextViewProvider) {
                const opts = this.options.findWidgetStyles ? { styles: this.options.findWidgetStyles } : undefined;
                this.findController = new FindController(this, this.model, this.view, filter, _options.contextViewProvider, opts);
                this.focusNavigationFilter = node => this.findController.shouldAllowFocus(node);
                this.onDidChangeFindOpenState = this.findController.onDidChangeOpenState;
                this.disposables.add(this.findController);
                this.onDidChangeFindMode = this.findController.onDidChangeMode;
                this.onDidChangeFindMatchType = this.findController.onDidChangeMatchType;
            }
            else {
                this.onDidChangeFindMode = event_2.Event.None;
                this.onDidChangeFindMatchType = event_2.Event.None;
            }
            if (_options.enableStickyScroll) {
                this.stickyScrollController = new StickyScrollController(this, this.model, this.view, this.renderers, this.treeDelegate, _options);
                this.onDidChangeStickyScrollFocused = this.stickyScrollController.onDidChangeHasFocus;
            }
            this.styleElement = (0, dom_1.createStyleSheet)(this.view.getHTMLElement());
            this.getHTMLElement().classList.toggle('always', this._options.renderIndentGuides === RenderIndentGuides.Always);
        }
        updateOptions(optionsUpdate = {}) {
            this._options = { ...this._options, ...optionsUpdate };
            for (const renderer of this.renderers) {
                renderer.updateOptions(optionsUpdate);
            }
            this.view.updateOptions(this._options);
            this.findController?.updateOptions(optionsUpdate);
            this.updateStickyScroll(optionsUpdate);
            this._onDidUpdateOptions.fire(this._options);
            this.getHTMLElement().classList.toggle('always', this._options.renderIndentGuides === RenderIndentGuides.Always);
        }
        get options() {
            return this._options;
        }
        updateStickyScroll(optionsUpdate) {
            if (!this.stickyScrollController && this._options.enableStickyScroll) {
                this.stickyScrollController = new StickyScrollController(this, this.model, this.view, this.renderers, this.treeDelegate, this._options);
                this.onDidChangeStickyScrollFocused = this.stickyScrollController.onDidChangeHasFocus;
            }
            else if (this.stickyScrollController && !this._options.enableStickyScroll) {
                this.onDidChangeStickyScrollFocused = event_2.Event.None;
                this.stickyScrollController.dispose();
                this.stickyScrollController = undefined;
            }
            this.stickyScrollController?.updateOptions(optionsUpdate);
        }
        updateWidth(element) {
            const index = this.model.getListIndex(element);
            if (index === -1) {
                return;
            }
            this.view.updateWidth(index);
        }
        // Widget
        getHTMLElement() {
            return this.view.getHTMLElement();
        }
        get contentHeight() {
            return this.view.contentHeight;
        }
        get contentWidth() {
            return this.view.contentWidth;
        }
        get onDidChangeContentHeight() {
            return this.view.onDidChangeContentHeight;
        }
        get onDidChangeContentWidth() {
            return this.view.onDidChangeContentWidth;
        }
        get scrollTop() {
            return this.view.scrollTop;
        }
        set scrollTop(scrollTop) {
            this.view.scrollTop = scrollTop;
        }
        get scrollLeft() {
            return this.view.scrollLeft;
        }
        set scrollLeft(scrollLeft) {
            this.view.scrollLeft = scrollLeft;
        }
        get scrollHeight() {
            return this.view.scrollHeight;
        }
        get renderHeight() {
            return this.view.renderHeight;
        }
        get firstVisibleElement() {
            let index = this.view.firstVisibleIndex;
            if (this.stickyScrollController) {
                index += this.stickyScrollController.count;
            }
            if (index < 0 || index >= this.view.length) {
                return undefined;
            }
            const node = this.view.element(index);
            return node.element;
        }
        get lastVisibleElement() {
            const index = this.view.lastVisibleIndex;
            const node = this.view.element(index);
            return node.element;
        }
        get ariaLabel() {
            return this.view.ariaLabel;
        }
        set ariaLabel(value) {
            this.view.ariaLabel = value;
        }
        get selectionSize() {
            return this.selection.getNodes().length;
        }
        domFocus() {
            if (this.stickyScrollController?.focusedLast()) {
                this.stickyScrollController.domFocus();
            }
            else {
                this.view.domFocus();
            }
        }
        isDOMFocused() {
            return (0, dom_1.isActiveElement)(this.getHTMLElement());
        }
        layout(height, width) {
            this.view.layout(height, width);
            if ((0, types_1.isNumber)(width)) {
                this.findController?.layout(width);
            }
        }
        style(styles) {
            const suffix = `.${this.view.domId}`;
            const content = [];
            if (styles.treeIndentGuidesStroke) {
                content.push(`.monaco-list${suffix}:hover .monaco-tl-indent > .indent-guide, .monaco-list${suffix}.always .monaco-tl-indent > .indent-guide  { border-color: ${styles.treeInactiveIndentGuidesStroke}; }`);
                content.push(`.monaco-list${suffix} .monaco-tl-indent > .indent-guide.active { border-color: ${styles.treeIndentGuidesStroke}; }`);
            }
            // Sticky Scroll Background
            if (styles.listBackground) {
                content.push(`.monaco-list${suffix} .monaco-scrollable-element .monaco-tree-sticky-container { background-color: ${styles.listBackground}; }`);
                content.push(`.monaco-list${suffix} .monaco-scrollable-element .monaco-tree-sticky-container .monaco-tree-sticky-row { background-color: ${styles.listBackground}; }`);
            }
            // Sticky Scroll Focus
            if (styles.listFocusForeground) {
                content.push(`.monaco-list${suffix}.sticky-scroll-focused .monaco-scrollable-element .monaco-tree-sticky-container:focus .monaco-list-row.focused { color: ${styles.listFocusForeground}; }`);
                content.push(`.monaco-list${suffix}:not(.sticky-scroll-focused) .monaco-scrollable-element .monaco-tree-sticky-container .monaco-list-row.focused { color: inherit; }`);
            }
            // Sticky Scroll Focus Outlines
            const focusAndSelectionOutline = (0, dom_1.asCssValueWithDefault)(styles.listFocusAndSelectionOutline, (0, dom_1.asCssValueWithDefault)(styles.listSelectionOutline, styles.listFocusOutline ?? ''));
            if (focusAndSelectionOutline) { // default: listFocusOutline
                content.push(`.monaco-list${suffix}.sticky-scroll-focused .monaco-scrollable-element .monaco-tree-sticky-container:focus .monaco-list-row.focused.selected { outline: 1px solid ${focusAndSelectionOutline}; outline-offset: -1px;}`);
                content.push(`.monaco-list${suffix}:not(.sticky-scroll-focused) .monaco-scrollable-element .monaco-tree-sticky-container .monaco-list-row.focused.selected { outline: inherit;}`);
            }
            if (styles.listFocusOutline) { // default: set
                content.push(`.monaco-list${suffix}.sticky-scroll-focused .monaco-scrollable-element .monaco-tree-sticky-container:focus .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }`);
                content.push(`.monaco-list${suffix}:not(.sticky-scroll-focused) .monaco-scrollable-element .monaco-tree-sticky-container .monaco-list-row.focused { outline: inherit; }`);
                content.push(`.monaco-workbench.context-menu-visible .monaco-list${suffix}.last-focused.sticky-scroll-focused .monaco-scrollable-element .monaco-tree-sticky-container .monaco-list-row.passive-focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }`);
                content.push(`.monaco-workbench.context-menu-visible .monaco-list${suffix}.last-focused.sticky-scroll-focused .monaco-list-rows .monaco-list-row.focused { outline: inherit; }`);
                content.push(`.monaco-workbench.context-menu-visible .monaco-list${suffix}.last-focused:not(.sticky-scroll-focused) .monaco-tree-sticky-container .monaco-list-rows .monaco-list-row.focused { outline: inherit; }`);
            }
            this.styleElement.textContent = content.join('\n');
            this.view.style(styles);
        }
        // Tree navigation
        getParentElement(location) {
            const parentRef = this.model.getParentNodeLocation(location);
            const parentNode = this.model.getNode(parentRef);
            return parentNode.element;
        }
        getFirstElementChild(location) {
            return this.model.getFirstElementChild(location);
        }
        // Tree
        getNode(location) {
            return this.model.getNode(location);
        }
        getNodeLocation(node) {
            return this.model.getNodeLocation(node);
        }
        collapse(location, recursive = false) {
            return this.model.setCollapsed(location, true, recursive);
        }
        expand(location, recursive = false) {
            return this.model.setCollapsed(location, false, recursive);
        }
        toggleCollapsed(location, recursive = false) {
            return this.model.setCollapsed(location, undefined, recursive);
        }
        expandAll() {
            this.model.setCollapsed(this.model.rootRef, false, true);
        }
        collapseAll() {
            this.model.setCollapsed(this.model.rootRef, true, true);
        }
        isCollapsible(location) {
            return this.model.isCollapsible(location);
        }
        setCollapsible(location, collapsible) {
            return this.model.setCollapsible(location, collapsible);
        }
        isCollapsed(location) {
            return this.model.isCollapsed(location);
        }
        expandTo(location) {
            this.model.expandTo(location);
        }
        triggerTypeNavigation() {
            this.view.triggerTypeNavigation();
        }
        openFind() {
            this.findController?.open();
        }
        closeFind() {
            this.findController?.close();
        }
        refilter() {
            this._onWillRefilter.fire(undefined);
            this.model.refilter();
        }
        setAnchor(element) {
            if (typeof element === 'undefined') {
                return this.view.setAnchor(undefined);
            }
            this.eventBufferer.bufferEvents(() => {
                const node = this.model.getNode(element);
                this.anchor.set([node]);
                const index = this.model.getListIndex(element);
                if (index > -1) {
                    this.view.setAnchor(index, true);
                }
            });
        }
        getAnchor() {
            return (0, arrays_1.firstOrDefault)(this.anchor.get(), undefined);
        }
        setSelection(elements, browserEvent) {
            this.eventBufferer.bufferEvents(() => {
                const nodes = elements.map(e => this.model.getNode(e));
                this.selection.set(nodes, browserEvent);
                const indexes = elements.map(e => this.model.getListIndex(e)).filter(i => i > -1);
                this.view.setSelection(indexes, browserEvent, true);
            });
        }
        getSelection() {
            return this.selection.get();
        }
        setFocus(elements, browserEvent) {
            this.eventBufferer.bufferEvents(() => {
                const nodes = elements.map(e => this.model.getNode(e));
                this.focus.set(nodes, browserEvent);
                const indexes = elements.map(e => this.model.getListIndex(e)).filter(i => i > -1);
                this.view.setFocus(indexes, browserEvent, true);
            });
        }
        focusNext(n = 1, loop = false, browserEvent, filter = ((0, dom_1.isKeyboardEvent)(browserEvent) && browserEvent.altKey) ? undefined : this.focusNavigationFilter) {
            this.view.focusNext(n, loop, browserEvent, filter);
        }
        focusPrevious(n = 1, loop = false, browserEvent, filter = ((0, dom_1.isKeyboardEvent)(browserEvent) && browserEvent.altKey) ? undefined : this.focusNavigationFilter) {
            this.view.focusPrevious(n, loop, browserEvent, filter);
        }
        focusNextPage(browserEvent, filter = ((0, dom_1.isKeyboardEvent)(browserEvent) && browserEvent.altKey) ? undefined : this.focusNavigationFilter) {
            return this.view.focusNextPage(browserEvent, filter);
        }
        focusPreviousPage(browserEvent, filter = ((0, dom_1.isKeyboardEvent)(browserEvent) && browserEvent.altKey) ? undefined : this.focusNavigationFilter) {
            return this.view.focusPreviousPage(browserEvent, filter, () => this.stickyScrollController?.height ?? 0);
        }
        focusLast(browserEvent, filter = ((0, dom_1.isKeyboardEvent)(browserEvent) && browserEvent.altKey) ? undefined : this.focusNavigationFilter) {
            this.view.focusLast(browserEvent, filter);
        }
        focusFirst(browserEvent, filter = ((0, dom_1.isKeyboardEvent)(browserEvent) && browserEvent.altKey) ? undefined : this.focusNavigationFilter) {
            this.view.focusFirst(browserEvent, filter);
        }
        getFocus() {
            return this.focus.get();
        }
        getStickyScrollFocus() {
            const focus = this.stickyScrollController?.getFocus();
            return focus !== undefined ? [focus] : [];
        }
        getFocusedPart() {
            return this.stickyScrollController?.focusedLast() ? 1 /* AbstractTreePart.StickyScroll */ : 0 /* AbstractTreePart.Tree */;
        }
        reveal(location, relativeTop) {
            this.model.expandTo(location);
            const index = this.model.getListIndex(location);
            if (index === -1) {
                return;
            }
            if (!this.stickyScrollController) {
                this.view.reveal(index, relativeTop);
            }
            else {
                const paddingTop = this.stickyScrollController.nodePositionTopBelowWidget(this.getNode(location));
                this.view.reveal(index, relativeTop, paddingTop);
            }
        }
        /**
         * Returns the relative position of an element rendered in the list.
         * Returns `null` if the element isn't *entirely* in the visible viewport.
         */
        getRelativeTop(location) {
            const index = this.model.getListIndex(location);
            if (index === -1) {
                return null;
            }
            const stickyScrollNode = this.stickyScrollController?.getNode(this.getNode(location));
            return this.view.getRelativeTop(index, stickyScrollNode?.position ?? this.stickyScrollController?.height);
        }
        getViewState(identityProvider = this.options.identityProvider) {
            if (!identityProvider) {
                throw new tree_1.TreeError(this._user, 'Can\'t get tree view state without an identity provider');
            }
            const getId = (element) => identityProvider.getId(element).toString();
            const state = AbstractTreeViewState.empty(this.scrollTop);
            for (const focus of this.getFocus()) {
                state.focus.add(getId(focus));
            }
            for (const selection of this.getSelection()) {
                state.selection.add(getId(selection));
            }
            const root = this.model.getNode();
            const queue = [root];
            while (queue.length > 0) {
                const node = queue.shift();
                if (node !== root && node.collapsible) {
                    state.expanded[getId(node.element)] = node.collapsed ? 0 : 1;
                }
                queue.push(...node.children);
            }
            return state;
        }
        // List
        onLeftArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            const nodes = this.view.getFocusedElements();
            if (nodes.length === 0) {
                return;
            }
            const node = nodes[0];
            const location = this.model.getNodeLocation(node);
            const didChange = this.model.setCollapsed(location, true);
            if (!didChange) {
                const parentLocation = this.model.getParentNodeLocation(location);
                if (!parentLocation) {
                    return;
                }
                const parentListIndex = this.model.getListIndex(parentLocation);
                this.view.reveal(parentListIndex);
                this.view.setFocus([parentListIndex]);
            }
        }
        onRightArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            const nodes = this.view.getFocusedElements();
            if (nodes.length === 0) {
                return;
            }
            const node = nodes[0];
            const location = this.model.getNodeLocation(node);
            const didChange = this.model.setCollapsed(location, false);
            if (!didChange) {
                if (!node.children.some(child => child.visible)) {
                    return;
                }
                const [focusedIndex] = this.view.getFocus();
                const firstChildIndex = focusedIndex + 1;
                this.view.reveal(firstChildIndex);
                this.view.setFocus([firstChildIndex]);
            }
        }
        onSpace(e) {
            e.preventDefault();
            e.stopPropagation();
            const nodes = this.view.getFocusedElements();
            if (nodes.length === 0) {
                return;
            }
            const node = nodes[0];
            const location = this.model.getNodeLocation(node);
            const recursive = e.browserEvent.altKey;
            this.model.setCollapsed(location, undefined, recursive);
        }
        navigate(start) {
            return new TreeNavigator(this.view, this.model, start);
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.disposables);
            this.stickyScrollController?.dispose();
            this.view.dispose();
        }
    }
    exports.AbstractTree = AbstractTree;
    class TreeNavigator {
        constructor(view, model, start) {
            this.view = view;
            this.model = model;
            if (start) {
                this.index = this.model.getListIndex(start);
            }
            else {
                this.index = -1;
            }
        }
        current() {
            if (this.index < 0 || this.index >= this.view.length) {
                return null;
            }
            return this.view.element(this.index).element;
        }
        previous() {
            this.index--;
            return this.current();
        }
        next() {
            this.index++;
            return this.current();
        }
        first() {
            this.index = 0;
            return this.current();
        }
        last() {
            this.index = this.view.length - 1;
            return this.current();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RUcmVlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvdHJlZS9hYnN0cmFjdFRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0NoRyxNQUFNLDJCQUFzRCxTQUFRLGtDQUFvQztRQUV2RyxJQUFhLE9BQU8sQ0FBQyxPQUE2QjtZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDN0IsQ0FBQztRQUVELElBQWEsT0FBTztZQUNuQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzFCLENBQUM7UUFFRCxZQUFvQixJQUFrRTtZQUNyRixLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUQ1QixTQUFJLEdBQUosSUFBSSxDQUE4RDtRQUV0RixDQUFDO0tBQ0Q7SUFFRCxTQUFTLHFCQUFxQixDQUFpQixJQUFzQjtRQUNwRSxJQUFJLElBQUksWUFBWSxrQ0FBdUIsRUFBRSxDQUFDO1lBQzdDLE9BQU8sSUFBSSwyQkFBMkIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsTUFBTSx1QkFBdUI7UUFNNUIsWUFBb0IsYUFBcUQsRUFBVSxHQUF3QjtZQUF2RixrQkFBYSxHQUFiLGFBQWEsQ0FBd0M7WUFBVSxRQUFHLEdBQUgsR0FBRyxDQUFxQjtZQUhuRyx5QkFBb0IsR0FBZ0Isc0JBQVUsQ0FBQyxJQUFJLENBQUM7WUFDcEQsZ0JBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUVtRSxDQUFDO1FBRWhILFVBQVUsQ0FBQyxJ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