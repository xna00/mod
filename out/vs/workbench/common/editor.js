/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/files/common/files", "vs/base/common/network", "vs/base/common/errorMessage", "vs/base/common/actions", "vs/base/common/severity"], function (require, exports, nls_1, types_1, uri_1, lifecycle_1, instantiation_1, platform_1, files_1, network_1, errorMessage_1, actions_1, severity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorsOrder = exports.CloseDirection = exports.EditorResourceAccessor = exports.EditorCloseMethod = exports.SideBySideEditor = exports.GroupModelChangeKind = exports.EditorCloseContext = exports.AbstractEditorInput = exports.EditorInputCapabilities = exports.SaveSourceRegistry = exports.SaveReason = exports.Verbosity = exports.EditorPaneSelectionCompareResult = exports.EditorPaneSelectionChangeReason = exports.BINARY_DIFF_EDITOR_ID = exports.TEXT_DIFF_EDITOR_ID = exports.SIDE_BY_SIDE_EDITOR_ID = exports.DEFAULT_EDITOR_ASSOCIATION = exports.EditorExtensions = void 0;
    exports.isEditorPaneWithSelection = isEditorPaneWithSelection;
    exports.isEditorPaneWithScrolling = isEditorPaneWithScrolling;
    exports.findViewStateForEditor = findViewStateForEditor;
    exports.isResourceEditorInput = isResourceEditorInput;
    exports.isResourceDiffEditorInput = isResourceDiffEditorInput;
    exports.isResourceMultiDiffEditorInput = isResourceMultiDiffEditorInput;
    exports.isResourceSideBySideEditorInput = isResourceSideBySideEditorInput;
    exports.isUntitledResourceEditorInput = isUntitledResourceEditorInput;
    exports.isResourceMergeEditorInput = isResourceMergeEditorInput;
    exports.isEditorInput = isEditorInput;
    exports.isSideBySideEditorInput = isSideBySideEditorInput;
    exports.isDiffEditorInput = isDiffEditorInput;
    exports.createTooLargeFileError = createTooLargeFileError;
    exports.isEditorInputWithOptions = isEditorInputWithOptions;
    exports.isEditorInputWithOptionsAndGroup = isEditorInputWithOptionsAndGroup;
    exports.isEditorIdentifier = isEditorIdentifier;
    exports.preventEditorClose = preventEditorClose;
    exports.pathsToEditors = pathsToEditors;
    exports.isTextEditorViewState = isTextEditorViewState;
    exports.isEditorOpenError = isEditorOpenError;
    exports.createEditorOpenError = createEditorOpenError;
    // Static values for editor contributions
    exports.EditorExtensions = {
        EditorPane: 'workbench.contributions.editors',
        EditorFactory: 'workbench.contributions.editor.inputFactories'
    };
    // Static information regarding the text editor
    exports.DEFAULT_EDITOR_ASSOCIATION = {
        id: 'default',
        displayName: (0, nls_1.localize)('promptOpenWith.defaultEditor.displayName', "Text Editor"),
        providerDisplayName: (0, nls_1.localize)('builtinProviderDisplayName', "Built-in")
    };
    /**
     * Side by side editor id.
     */
    exports.SIDE_BY_SIDE_EDITOR_ID = 'workbench.editor.sidebysideEditor';
    /**
     * Text diff editor id.
     */
    exports.TEXT_DIFF_EDITOR_ID = 'workbench.editors.textDiffEditor';
    /**
     * Binary diff editor id.
     */
    exports.BINARY_DIFF_EDITOR_ID = 'workbench.editors.binaryResourceDiffEditor';
    var EditorPaneSelectionChangeReason;
    (function (EditorPaneSelectionChangeReason) {
        /**
         * The selection was changed as a result of a programmatic
         * method invocation.
         *
         * For a text editor pane, this for example can be a selection
         * being restored from previous view state automatically.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["PROGRAMMATIC"] = 1] = "PROGRAMMATIC";
        /**
         * The selection was changed by the user.
         *
         * This typically means the user changed the selection
         * with mouse or keyboard.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["USER"] = 2] = "USER";
        /**
         * The selection was changed as a result of editing in
         * the editor pane.
         *
         * For a text editor pane, this for example can be typing
         * in the text of the editor pane.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["EDIT"] = 3] = "EDIT";
        /**
         * The selection was changed as a result of a navigation
         * action.
         *
         * For a text editor pane, this for example can be a result
         * of selecting an entry from a text outline view.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["NAVIGATION"] = 4] = "NAVIGATION";
        /**
         * The selection was changed as a result of a jump action
         * from within the editor pane.
         *
         * For a text editor pane, this for example can be a result
         * of invoking "Go to definition" from a symbol.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["JUMP"] = 5] = "JUMP";
    })(EditorPaneSelectionChangeReason || (exports.EditorPaneSelectionChangeReason = EditorPaneSelectionChangeReason = {}));
    var EditorPaneSelectionCompareResult;
    (function (EditorPaneSelectionCompareResult) {
        /**
         * The selections are identical.
         */
        EditorPaneSelectionCompareResult[EditorPaneSelectionCompareResult["IDENTICAL"] = 1] = "IDENTICAL";
        /**
         * The selections are similar.
         *
         * For a text editor this can mean that the one
         * selection is in close proximity to the other
         * selection.
         *
         * Upstream clients may decide in this case to
         * not treat the selection different from the
         * previous one because it is not distinct enough.
         */
        EditorPaneSelectionCompareResult[EditorPaneSelectionCompareResult["SIMILAR"] = 2] = "SIMILAR";
        /**
         * The selections are entirely different.
         */
        EditorPaneSelectionCompareResult[EditorPaneSelectionCompareResult["DIFFERENT"] = 3] = "DIFFERENT";
    })(EditorPaneSelectionCompareResult || (exports.EditorPaneSelectionCompareResult = EditorPaneSelectionCompareResult = {}));
    function isEditorPaneWithSelection(editorPane) {
        const candidate = editorPane;
        return !!candidate && typeof candidate.getSelection === 'function' && !!candidate.onDidChangeSelection;
    }
    function isEditorPaneWithScrolling(editorPane) {
        const candidate = editorPane;
        return !!candidate && typeof candidate.getScrollPosition === 'function' && typeof candidate.setScrollPosition === 'function' && !!candidate.onDidChangeScroll;
    }
    /**
     * Try to retrieve the view state for the editor pane that
     * has the provided editor input opened, if at all.
     *
     * This method will return `undefined` if the editor input
     * is not visible in any of the opened editor panes.
     */
    function findViewStateForEditor(input, group, editorService) {
        for (const editorPane of editorService.visibleEditorPanes) {
            if (editorPane.group.id === group && input.matches(editorPane.input)) {
                return editorPane.getViewState();
            }
        }
        return undefined;
    }
    function isResourceEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        return uri_1.URI.isUri(candidate?.resource);
    }
    function isResourceDiffEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        return candidate?.original !== undefined && candidate.modified !== undefined;
    }
    function isResourceMultiDiffEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        if (!candidate) {
            return false;
        }
        if (candidate.resources && !Array.isArray(candidate.resources)) {
            return false;
        }
        return !!candidate.resources || !!candidate.multiDiffSource;
    }
    function isResourceSideBySideEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        if (isResourceDiffEditorInput(editor)) {
            return false; // make sure to not accidentally match on diff editors
        }
        const candidate = editor;
        return candidate?.primary !== undefined && candidate.secondary !== undefined;
    }
    function isUntitledResourceEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        if (!candidate) {
            return false;
        }
        return candidate.resource === undefined || candidate.resource.scheme === network_1.Schemas.untitled || candidate.forceUntitled === true;
    }
    function isResourceMergeEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        return uri_1.URI.isUri(candidate?.base?.resource) && uri_1.URI.isUri(candidate?.input1?.resource) && uri_1.URI.isUri(candidate?.input2?.resource) && uri_1.URI.isUri(candidate?.result?.resource);
    }
    var Verbosity;
    (function (Verbosity) {
        Verbosity[Verbosity["SHORT"] = 0] = "SHORT";
        Verbosity[Verbosity["MEDIUM"] = 1] = "MEDIUM";
        Verbosity[Verbosity["LONG"] = 2] = "LONG";
    })(Verbosity || (exports.Verbosity = Verbosity = {}));
    var SaveReason;
    (function (SaveReason) {
        /**
         * Explicit user gesture.
         */
        SaveReason[SaveReason["EXPLICIT"] = 1] = "EXPLICIT";
        /**
         * Auto save after a timeout.
         */
        SaveReason[SaveReason["AUTO"] = 2] = "AUTO";
        /**
         * Auto save after editor focus change.
         */
        SaveReason[SaveReason["FOCUS_CHANGE"] = 3] = "FOCUS_CHANGE";
        /**
         * Auto save after window change.
         */
        SaveReason[SaveReason["WINDOW_CHANGE"] = 4] = "WINDOW_CHANGE";
    })(SaveReason || (exports.SaveReason = SaveReason = {}));
    class SaveSourceFactory {
        constructor() {
            this.mapIdToSaveSource = new Map();
        }
        /**
         * Registers a `SaveSource` with an identifier and label
         * to the registry so that it can be used in save operations.
         */
        registerSource(id, label) {
            let sourceDescriptor = this.mapIdToSaveSource.get(id);
            if (!sourceDescriptor) {
                sourceDescriptor = { source: id, label };
                this.mapIdToSaveSource.set(id, sourceDescriptor);
            }
            return sourceDescriptor.source;
        }
        getSourceLabel(source) {
            return this.mapIdToSaveSource.get(source)?.label ?? source;
        }
    }
    exports.SaveSourceRegistry = new SaveSourceFactory();
    var EditorInputCapabilities;
    (function (EditorInputCapabilities) {
        /**
         * Signals no specific capability for the input.
         */
        EditorInputCapabilities[EditorInputCapabilities["None"] = 0] = "None";
        /**
         * Signals that the input is readonly.
         */
        EditorInputCapabilities[EditorInputCapabilities["Readonly"] = 2] = "Readonly";
        /**
         * Signals that the input is untitled.
         */
        EditorInputCapabilities[EditorInputCapabilities["Untitled"] = 4] = "Untitled";
        /**
         * Signals that the input can only be shown in one group
         * and not be split into multiple groups.
         */
        EditorInputCapabilities[EditorInputCapabilities["Singleton"] = 8] = "Singleton";
        /**
         * Signals that the input requires workspace trust.
         */
        EditorInputCapabilities[EditorInputCapabilities["RequiresTrust"] = 16] = "RequiresTrust";
        /**
         * Signals that the editor can split into 2 in the same
         * editor group.
         */
        EditorInputCapabilities[EditorInputCapabilities["CanSplitInGroup"] = 32] = "CanSplitInGroup";
        /**
         * Signals that the editor wants its description to be
         * visible when presented to the user. By default, a UI
         * component may decide to hide the description portion
         * for brevity.
         */
        EditorInputCapabilities[EditorInputCapabilities["ForceDescription"] = 64] = "ForceDescription";
        /**
         * Signals that the editor supports dropping into the
         * editor by holding shift.
         */
        EditorInputCapabilities[EditorInputCapabilities["CanDropIntoEditor"] = 128] = "CanDropIntoEditor";
        /**
         * Signals that the editor is composed of multiple editors
         * within.
         */
        EditorInputCapabilities[EditorInputCapabilities["MultipleEditors"] = 256] = "MultipleEditors";
        /**
         * Signals that the editor cannot be in a dirty state
         * and may still have unsaved changes
         */
        EditorInputCapabilities[EditorInputCapabilities["Scratchpad"] = 512] = "Scratchpad";
    })(EditorInputCapabilities || (exports.EditorInputCapabilities = EditorInputCapabilities = {}));
    class AbstractEditorInput extends lifecycle_1.Disposable {
    }
    exports.AbstractEditorInput = AbstractEditorInput;
    function isEditorInput(editor) {
        return editor instanceof AbstractEditorInput;
    }
    function isEditorInputWithPreferredResource(editor) {
        const candidate = editor;
        return uri_1.URI.isUri(candidate?.preferredResource);
    }
    function isSideBySideEditorInput(editor) {
        const candidate = editor;
        return isEditorInput(candidate?.primary) && isEditorInput(candidate?.secondary);
    }
    function isDiffEditorInput(editor) {
        const candidate = editor;
        return isEditorInput(candidate?.modified) && isEditorInput(candidate?.original);
    }
    function createTooLargeFileError(group, input, options, message, preferencesService) {
        return createEditorOpenError(message, [
            (0, actions_1.toAction)({
                id: 'workbench.action.openLargeFile', label: (0, nls_1.localize)('openLargeFile', "Open Anyway"), run: () => {
                    const fileEditorOptions = {
                        ...options,
                        limits: {
                            size: Number.MAX_VALUE
                        }
                    };
                    group.openEditor(input, fileEditorOptions);
                }
            }),
            (0, actions_1.toAction)({
                id: 'workbench.action.configureEditorLargeFileConfirmation', label: (0, nls_1.localize)('configureEditorLargeFileConfirmation', "Configure Limit"), run: () => {
                    return preferencesService.openUserSettings({ query: 'workbench.editorLargeFileConfirmation' });
                }
            }),
        ], {
            forceMessage: true,
            forceSeverity: severity_1.default.Warning
        });
    }
    function isEditorInputWithOptions(editor) {
        const candidate = editor;
        return isEditorInput(candidate?.editor);
    }
    function isEditorInputWithOptionsAndGroup(editor) {
        const candidate = editor;
        return isEditorInputWithOptions(editor) && candidate?.group !== undefined;
    }
    function isEditorIdentifier(identifier) {
        const candidate = identifier;
        return typeof candidate?.groupId === 'number' && isEditorInput(candidate.editor);
    }
    /**
     * More information around why an editor was closed in the model.
     */
    var EditorCloseContext;
    (function (EditorCloseContext) {
        /**
         * No specific context for closing (e.g. explicit user gesture).
         */
        EditorCloseContext[EditorCloseContext["UNKNOWN"] = 0] = "UNKNOWN";
        /**
         * The editor closed because it was replaced with another editor.
         * This can either happen via explicit replace call or when an
         * editor is in preview mode and another editor opens.
         */
        EditorCloseContext[EditorCloseContext["REPLACE"] = 1] = "REPLACE";
        /**
         * The editor closed as a result of moving it to another group.
         */
        EditorCloseContext[EditorCloseContext["MOVE"] = 2] = "MOVE";
        /**
         * The editor closed because another editor turned into preview
         * and this used to be the preview editor before.
         */
        EditorCloseContext[EditorCloseContext["UNPIN"] = 3] = "UNPIN";
    })(EditorCloseContext || (exports.EditorCloseContext = EditorCloseContext = {}));
    var GroupModelChangeKind;
    (function (GroupModelChangeKind) {
        /* Group Changes */
        GroupModelChangeKind[GroupModelChangeKind["GROUP_ACTIVE"] = 0] = "GROUP_ACTIVE";
        GroupModelChangeKind[GroupModelChangeKind["GROUP_INDEX"] = 1] = "GROUP_INDEX";
        GroupModelChangeKind[GroupModelChangeKind["GROUP_LABEL"] = 2] = "GROUP_LABEL";
        GroupModelChangeKind[GroupModelChangeKind["GROUP_LOCKED"] = 3] = "GROUP_LOCKED";
        /* Editor Changes */
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_OPEN"] = 4] = "EDITOR_OPEN";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_CLOSE"] = 5] = "EDITOR_CLOSE";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_MOVE"] = 6] = "EDITOR_MOVE";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_ACTIVE"] = 7] = "EDITOR_ACTIVE";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_LABEL"] = 8] = "EDITOR_LABEL";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_CAPABILITIES"] = 9] = "EDITOR_CAPABILITIES";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_PIN"] = 10] = "EDITOR_PIN";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_TRANSIENT"] = 11] = "EDITOR_TRANSIENT";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_STICKY"] = 12] = "EDITOR_STICKY";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_DIRTY"] = 13] = "EDITOR_DIRTY";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_WILL_DISPOSE"] = 14] = "EDITOR_WILL_DISPOSE";
    })(GroupModelChangeKind || (exports.GroupModelChangeKind = GroupModelChangeKind = {}));
    var SideBySideEditor;
    (function (SideBySideEditor) {
        SideBySideEditor[SideBySideEditor["PRIMARY"] = 1] = "PRIMARY";
        SideBySideEditor[SideBySideEditor["SECONDARY"] = 2] = "SECONDARY";
        SideBySideEditor[SideBySideEditor["BOTH"] = 3] = "BOTH";
        SideBySideEditor[SideBySideEditor["ANY"] = 4] = "ANY";
    })(SideBySideEditor || (exports.SideBySideEditor = SideBySideEditor = {}));
    class EditorResourceAccessorImpl {
        getOriginalUri(editor, options) {
            if (!editor) {
                return undefined;
            }
            // Merge editors are handled with `merged` result editor
            if (isResourceMergeEditorInput(editor)) {
                return exports.EditorResourceAccessor.getOriginalUri(editor.result, options);
            }
            // Optionally support side-by-side editors
            if (options?.supportSideBySide) {
                const { primary, secondary } = this.getSideEditors(editor);
                if (primary && secondary) {
                    if (options?.supportSideBySide === SideBySideEditor.BOTH) {
                        return {
                            primary: this.getOriginalUri(primary, { filterByScheme: options.filterByScheme }),
                            secondary: this.getOriginalUri(secondary, { filterByScheme: options.filterByScheme })
                        };
                    }
                    else if (options?.supportSideBySide === SideBySideEditor.ANY) {
                        return this.getOriginalUri(primary, { filterByScheme: options.filterByScheme }) ?? this.getOriginalUri(secondary, { filterByScheme: options.filterByScheme });
                    }
                    editor = options.supportSideBySide === SideBySideEditor.PRIMARY ? primary : secondary;
                }
            }
            if (isResourceDiffEditorInput(editor) || isResourceMultiDiffEditorInput(editor) || isResourceSideBySideEditorInput(editor) || isResourceMergeEditorInput(editor)) {
                return undefined;
            }
            // Original URI is the `preferredResource` of an editor if any
            const originalResource = isEditorInputWithPreferredResource(editor) ? editor.preferredResource : editor.resource;
            if (!originalResource || !options || !options.filterByScheme) {
                return originalResource;
            }
            return this.filterUri(originalResource, options.filterByScheme);
        }
        getSideEditors(editor) {
            if (isSideBySideEditorInput(editor) || isResourceSideBySideEditorInput(editor)) {
                return { primary: editor.primary, secondary: editor.secondary };
            }
            if (isDiffEditorInput(editor) || isResourceDiffEditorInput(editor)) {
                return { primary: editor.modified, secondary: editor.original };
            }
            return { primary: undefined, secondary: undefined };
        }
        getCanonicalUri(editor, options) {
            if (!editor) {
                return undefined;
            }
            // Merge editors are handled with `merged` result editor
            if (isResourceMergeEditorInput(editor)) {
                return exports.EditorResourceAccessor.getCanonicalUri(editor.result, options);
            }
            // Optionally support side-by-side editors
            if (options?.supportSideBySide) {
                const { primary, secondary } = this.getSideEditors(editor);
                if (primary && secondary) {
                    if (options?.supportSideBySide === SideBySideEditor.BOTH) {
                        return {
                            primary: this.getCanonicalUri(primary, { filterByScheme: options.filterByScheme }),
                            secondary: this.getCanonicalUri(secondary, { filterByScheme: options.filterByScheme })
                        };
                    }
                    else if (options?.supportSideBySide === SideBySideEditor.ANY) {
                        return this.getCanonicalUri(primary, { filterByScheme: options.filterByScheme }) ?? this.getCanonicalUri(secondary, { filterByScheme: options.filterByScheme });
                    }
                    editor = options.supportSideBySide === SideBySideEditor.PRIMARY ? primary : secondary;
                }
            }
            if (isResourceDiffEditorInput(editor) || isResourceMultiDiffEditorInput(editor) || isResourceSideBySideEditorInput(editor) || isResourceMergeEditorInput(editor)) {
                return undefined;
            }
            // Canonical URI is the `resource` of an editor
            const canonicalResource = editor.resource;
            if (!canonicalResource || !options || !options.filterByScheme) {
                return canonicalResource;
            }
            return this.filterUri(canonicalResource, options.filterByScheme);
        }
        filterUri(resource, filter) {
            // Multiple scheme filter
            if (Array.isArray(filter)) {
                if (filter.some(scheme => resource.scheme === scheme)) {
                    return resource;
                }
            }
            // Single scheme filter
            else {
                if (filter === resource.scheme) {
                    return resource;
                }
            }
            return undefined;
        }
    }
    var EditorCloseMethod;
    (function (EditorCloseMethod) {
        EditorCloseMethod[EditorCloseMethod["UNKNOWN"] = 0] = "UNKNOWN";
        EditorCloseMethod[EditorCloseMethod["KEYBOARD"] = 1] = "KEYBOARD";
        EditorCloseMethod[EditorCloseMethod["MOUSE"] = 2] = "MOUSE";
    })(EditorCloseMethod || (exports.EditorCloseMethod = EditorCloseMethod = {}));
    function preventEditorClose(group, editor, method, configuration) {
        if (!group.isSticky(editor)) {
            return false; // only interested in sticky editors
        }
        switch (configuration.preventPinnedEditorClose) {
            case 'keyboardAndMouse': return method === EditorCloseMethod.MOUSE || method === EditorCloseMethod.KEYBOARD;
            case 'mouse': return method === EditorCloseMethod.MOUSE;
            case 'keyboard': return method === EditorCloseMethod.KEYBOARD;
        }
        return false;
    }
    exports.EditorResourceAccessor = new EditorResourceAccessorImpl();
    var CloseDirection;
    (function (CloseDirection) {
        CloseDirection[CloseDirection["LEFT"] = 0] = "LEFT";
        CloseDirection[CloseDirection["RIGHT"] = 1] = "RIGHT";
    })(CloseDirection || (exports.CloseDirection = CloseDirection = {}));
    class EditorFactoryRegistry {
        constructor() {
            this.editorSerializerConstructors = new Map();
            this.editorSerializerInstances = new Map();
        }
        start(accessor) {
            const instantiationService = this.instantiationService = accessor.get(instantiation_1.IInstantiationService);
            for (const [key, ctor] of this.editorSerializerConstructors) {
                this.createEditorSerializer(key, ctor, instantiationService);
            }
            this.editorSerializerConstructors.clear();
        }
        createEditorSerializer(editorTypeId, ctor, instantiationService) {
            const instance = instantiationService.createInstance(ctor);
            this.editorSerializerInstances.set(editorTypeId, instance);
        }
        registerFileEditorFactory(factory) {
            if (this.fileEditorFactory) {
                throw new Error('Can only register one file editor factory.');
            }
            this.fileEditorFactory = factory;
        }
        getFileEditorFactory() {
            return (0, types_1.assertIsDefined)(this.fileEditorFactory);
        }
        registerEditorSerializer(editorTypeId, ctor) {
            if (this.editorSerializerConstructors.has(editorTypeId) || this.editorSerializerInstances.has(editorTypeId)) {
                throw new Error(`A editor serializer with type ID '${editorTypeId}' was already registered.`);
            }
            if (!this.instantiationService) {
                this.editorSerializerConstructors.set(editorTypeId, ctor);
            }
            else {
                this.createEditorSerializer(editorTypeId, ctor, this.instantiationService);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                this.editorSerializerConstructors.delete(editorTypeId);
                this.editorSerializerInstances.delete(editorTypeId);
            });
        }
        getEditorSerializer(arg1) {
            return this.editorSerializerInstances.get(typeof arg1 === 'string' ? arg1 : arg1.typeId);
        }
    }
    platform_1.Registry.add(exports.EditorExtensions.EditorFactory, new EditorFactoryRegistry());
    async function pathsToEditors(paths, fileService, logService) {
        if (!paths || !paths.length) {
            return [];
        }
        return await Promise.all(paths.map(async (path) => {
            const resource = uri_1.URI.revive(path.fileUri);
            if (!resource) {
                logService.info('Cannot resolve the path because it is not valid.', path);
                return undefined;
            }
            const canHandleResource = await fileService.canHandleResource(resource);
            if (!canHandleResource) {
                logService.info('Cannot resolve the path because it cannot be handled', path);
                return undefined;
            }
            let exists = path.exists;
            let type = path.type;
            if (typeof exists !== 'boolean' || typeof type !== 'number') {
                try {
                    type = (await fileService.stat(resource)).isDirectory ? files_1.FileType.Directory : files_1.FileType.Unknown;
                    exists = true;
                }
                catch (error) {
                    logService.error(error);
                    exists = false;
                }
            }
            if (!exists && path.openOnlyIfExists) {
                logService.info('Cannot resolve the path because it does not exist', path);
                return undefined;
            }
            if (type === files_1.FileType.Directory) {
                logService.info('Cannot resolve the path because it is a directory', path);
                return undefined;
            }
            const options = {
                ...path.options,
                pinned: true
            };
            if (!exists) {
                return { resource, options, forceUntitled: true };
            }
            return { resource, options };
        }));
    }
    var EditorsOrder;
    (function (EditorsOrder) {
        /**
         * Editors sorted by most recent activity (most recent active first)
         */
        EditorsOrder[EditorsOrder["MOST_RECENTLY_ACTIVE"] = 0] = "MOST_RECENTLY_ACTIVE";
        /**
         * Editors sorted by sequential order
         */
        EditorsOrder[EditorsOrder["SEQUENTIAL"] = 1] = "SEQUENTIAL";
    })(EditorsOrder || (exports.EditorsOrder = EditorsOrder = {}));
    function isTextEditorViewState(candidate) {
        const viewState = candidate;
        if (!viewState) {
            return false;
        }
        const diffEditorViewState = viewState;
        if (diffEditorViewState.modified) {
            return isTextEditorViewState(diffEditorViewState.modified);
        }
        const codeEditorViewState = viewState;
        return !!(codeEditorViewState.contributionsState && codeEditorViewState.viewState && Array.isArray(codeEditorViewState.cursorState));
    }
    function isEditorOpenError(obj) {
        return (0, errorMessage_1.isErrorWithActions)(obj);
    }
    function createEditorOpenError(messageOrError, actions, options) {
        const error = (0, errorMessage_1.createErrorWithActions)(messageOrError, actions);
        error.forceMessage = options?.forceMessage;
        error.forceSeverity = options?.forceSeverity;
        error.allowDialog = options?.allowDialog;
        return error;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29tbW9uL2VkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErVGhHLDhEQUlDO0lBV0QsOERBSUM7SUFpQkQsd0RBUUM7SUErTkQsc0RBUUM7SUFFRCw4REFRQztJQUVELHdFQWNDO0lBRUQsMEVBWUM7SUFFRCxzRUFXQztJQUVELGdFQVFDO0lBd0xELHNDQUVDO0lBMkNELDBEQUlDO0lBZUQsOENBSUM7SUFvRkQsMERBdUJDO0lBV0QsNERBSUM7SUFFRCw0RUFJQztJQXVCRCxnREFJQztJQXlZRCxnREFZQztJQXNGRCx3Q0FtREM7SUFlRCxzREFjQztJQTJCRCw4Q0FFQztJQUVELHNEQVFDO0lBOW1ERCx5Q0FBeUM7SUFDNUIsUUFBQSxnQkFBZ0IsR0FBRztRQUMvQixVQUFVLEVBQUUsaUNBQWlDO1FBQzdDLGFBQWEsRUFBRSwrQ0FBK0M7S0FDOUQsQ0FBQztJQUVGLCtDQUErQztJQUNsQyxRQUFBLDBCQUEwQixHQUFHO1FBQ3pDLEVBQUUsRUFBRSxTQUFTO1FBQ2IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDBDQUEwQyxFQUFFLGFBQWEsQ0FBQztRQUNoRixtQkFBbUIsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSxVQUFVLENBQUM7S0FDdkUsQ0FBQztJQUVGOztPQUVHO0lBQ1UsUUFBQSxzQkFBc0IsR0FBRyxtQ0FBbUMsQ0FBQztJQUUxRTs7T0FFRztJQUNVLFFBQUEsbUJBQW1CLEdBQUcsa0NBQWtDLENBQUM7SUFFdEU7O09BRUc7SUFDVSxRQUFBLHFCQUFxQixHQUFHLDRDQUE0QyxDQUFDO0lBa0tsRixJQUFrQiwrQkE2Q2pCO0lBN0NELFdBQWtCLCtCQUErQjtRQUVoRDs7Ozs7O1dBTUc7UUFDSCxx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