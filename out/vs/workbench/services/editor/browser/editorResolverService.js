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
define(["require", "exports", "vs/base/common/glob", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/editor/common/editor", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/network", "vs/workbench/services/editor/common/editorResolverService", "vs/platform/quickinput/common/quickInput", "vs/nls", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/services/editor/common/editorGroupFinder", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/common/event"], function (require, exports, glob, arrays_1, lifecycle_1, resources_1, uri_1, configuration_1, editor_1, editor_2, editorGroupsService_1, network_1, editorResolverService_1, quickInput_1, nls_1, notification_1, telemetry_1, extensions_1, storage_1, extensions_2, log_1, editorGroupFinder_1, instantiation_1, sideBySideEditorInput_1, event_1) {
    "use strict";
    var EditorResolverService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorResolverService = void 0;
    let EditorResolverService = class EditorResolverService extends lifecycle_1.Disposable {
        static { EditorResolverService_1 = this; }
        // Constants
        static { this.configureDefaultID = 'promptOpenWith.configureDefault'; }
        static { this.cacheStorageID = 'editorOverrideService.cache'; }
        static { this.conflictingDefaultsStorageID = 'editorOverrideService.conflictingDefaults'; }
        constructor(editorGroupService, instantiationService, configurationService, quickInputService, notificationService, telemetryService, storageService, extensionService, logService) {
            super();
            this.editorGroupService = editorGroupService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.logService = logService;
            // Events
            this._onDidChangeEditorRegistrations = this._register(new event_1.PauseableEmitter());
            this.onDidChangeEditorRegistrations = this._onDidChangeEditorRegistrations.event;
            // Data Stores
            this._editors = new Map();
            this._flattenedEditors = new Map();
            this._shouldReFlattenEditors = true;
            // Read in the cache on statup
            this.cache = new Set(JSON.parse(this.storageService.get(EditorResolverService_1.cacheStorageID, 0 /* StorageScope.PROFILE */, JSON.stringify([]))));
            this.storageService.remove(EditorResolverService_1.cacheStorageID, 0 /* StorageScope.PROFILE */);
            this._register(this.storageService.onWillSaveState(() => {
                // We want to store the glob patterns we would activate on, this allows us to know if we need to await the ext host on startup for opening a resource
                this.cacheEditors();
            }));
            // When extensions have registered we no longer need the cache
            this._register(this.extensionService.onDidRegisterExtensions(() => {
                this.cache = undefined;
            }));
        }
        resolveUntypedInputAndGroup(editor, preferredGroup) {
            const untypedEditor = editor;
            // Use the untyped editor to find a group
            const findGroupResult = this.instantiationService.invokeFunction(editorGroupFinder_1.findGroup, untypedEditor, preferredGroup);
            if (findGroupResult instanceof Promise) {
                return findGroupResult.then(([group, activation]) => [untypedEditor, group, activation]);
            }
            else {
                const [group, activation] = findGroupResult;
                return [untypedEditor, group, activation];
            }
        }
        async resolveEditor(editor, preferredGroup) {
            // Update the flattened editors
            this._flattenedEditors = this._flattenEditorsMap();
            // Special case: side by side editors requires us to
            // independently resolve both sides and then build
            // a side by side editor with the result
            if ((0, editor_2.isResourceSideBySideEditorInput)(editor)) {
                return this.doResolveSideBySideEditor(editor, preferredGroup);
            }
            let resolvedUntypedAndGroup;
            const resolvedUntypedAndGroupResult = this.resolveUntypedInputAndGroup(editor, preferredGroup);
            if (resolvedUntypedAndGroupResult instanceof Promise) {
                resolvedUntypedAndGroup = await resolvedUntypedAndGroupResult;
            }
            else {
                resolvedUntypedAndGroup = resolvedUntypedAndGroupResult;
            }
            if (!resolvedUntypedAndGroup) {
                return 2 /* ResolvedStatus.NONE */;
            }
            // Get the resolved untyped editor, group, and activation
            const [untypedEditor, group, activation] = resolvedUntypedAndGroup;
            if (activation) {
                untypedEditor.options = { ...untypedEditor.options, activation };
            }
            let resource = editor_2.EditorResourceAccessor.getCanonicalUri(untypedEditor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            // If it was resolved before we await for the extensions to activate and then proceed with resolution or else the backing extensions won't be registered
            if (this.cache && resource && this.resourceMatchesCache(resource)) {
                await this.extensionService.whenInstalledExtensionsRegistered();
            }
            // Undefined resource -> untilted. Other malformed URI's are unresolvable
            if (resource === undefined) {
                resource = uri_1.URI.from({ scheme: network_1.Schemas.untitled });
            }
            else if (resource.scheme === undefined || resource === null) {
                return 2 /* ResolvedStatus.NONE */;
            }
            if (untypedEditor.options?.override === editor_1.EditorResolution.PICK) {
                const picked = await this.doPickEditor(untypedEditor);
                // If the picker was cancelled we will stop resolving the editor
                if (!picked) {
                    return 1 /* ResolvedStatus.ABORT */;
                }
                // Populate the options with the new ones
                untypedEditor.options = picked;
            }
            // Resolved the editor ID as much as possible, now find a given editor (cast here is ok because we resolve down to a string above)
            let { editor: selectedEditor, conflictingDefault } = this.getEditor(resource, untypedEditor.options?.override);
            // If no editor was found and this was a typed editor or an editor with an explicit override we could not resolve it
            if (!selectedEditor && (untypedEditor.options?.override || (0, editor_2.isEditorInputWithOptions)(editor))) {
                return 2 /* ResolvedStatus.NONE */;
            }
            else if (!selectedEditor) {
                // Simple untyped editors that we could not resolve will be resolved to the default editor
                const resolvedEditor = this.getEditor(resource, editor_2.DEFAULT_EDITOR_ASSOCIATION.id);
                selectedEditor = resolvedEditor?.editor;
                conflictingDefault = resolvedEditor?.conflictingDefault;
                if (!selectedEditor) {
                    return 2 /* ResolvedStatus.NONE */;
                }
            }
            // In the special case of diff editors we do some more work to determine the correct editor for both sides
            if ((0, editor_2.isResourceDiffEditorInput)(untypedEditor) && untypedEditor.options?.override === undefined) {
                let resource2 = editor_2.EditorResourceAccessor.getCanonicalUri(untypedEditor, { supportSideBySide: editor_2.SideBySideEditor.SECONDARY });
                if (!resource2) {
                    resource2 = uri_1.URI.from({ scheme: network_1.Schemas.untitled });
                }
                const { editor: selectedEditor2 } = this.getEditor(resource2, undefined);
                if (!selectedEditor2 || selectedEditor.editorInfo.id !== selectedEditor2.editorInfo.id) {
                    const { editor: selectedDiff, conflictingDefault: conflictingDefaultDiff } = this.getEditor(resource, editor_2.DEFAULT_EDITOR_ASSOCIATION.id);
                    selectedEditor = selectedDiff;
                    conflictingDefault = conflictingDefaultDiff;
                }
                if (!selectedEditor) {
                    return 2 /* ResolvedStatus.NONE */;
                }
            }
            // If no override we take the selected editor id so that matches works with the isActive check
            untypedEditor.options = { override: selectedEditor.editorInfo.id, ...untypedEditor.options };
            // Check if diff can be created based on prescene of factory function
            if (selectedEditor.editorFactoryObject.createDiffEditorInput === undefined && (0, editor_2.isResourceDiffEditorInput)(untypedEditor)) {
                return 2 /* ResolvedStatus.NONE */;
            }
            const input = await this.doResolveEditor(untypedEditor, group, selectedEditor);
            if (conflictingDefault && input) {
                // Show the conflicting default dialog
                await this.doHandleConflictingDefaults(resource, selectedEditor.editorInfo.label, untypedEditor, input.editor, group);
            }
            if (input) {
                this.sendEditorResolutionTelemetry(input.editor);
                if (input.editor.editorId !== selectedEditor.editorInfo.id) {
                    this.logService.warn(`Editor ID Mismatch: ${input.editor.editorId} !== ${selectedEditor.editorInfo.id}. This will cause bugs. Please ensure editorInput.editorId matches the registered id`);
                }
                return { ...input, group };
            }
            return 1 /* ResolvedStatus.ABORT */;
        }
        async doResolveSideBySideEditor(editor, preferredGroup) {
            const primaryResolvedEditor = await this.resolveEditor(editor.primary, preferredGroup);
            if (!(0, editor_2.isEditorInputWithOptionsAndGroup)(primaryResolvedEditor)) {
                return 2 /* ResolvedStatus.NONE */;
            }
            const secondaryResolvedEditor = await this.resolveEditor(editor.secondary, primaryResolvedEditor.group ?? preferredGroup);
            if (!(0, editor_2.isEditorInputWithOptionsAndGroup)(secondaryResolvedEditor)) {
                return 2 /* ResolvedStatus.NONE */;
            }
            return {
                group: primaryResolvedEditor.group ?? secondaryResolvedEditor.group,
                editor: this.instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, editor.label, editor.description, secondaryResolvedEditor.editor, primaryResolvedEditor.editor),
                options: editor.options
            };
        }
        bufferChangeEvents(callback) {
            this._onDidChangeEditorRegistrations.pause();
            try {
                callback();
            }
            finally {
                this._onDidChangeEditorRegistrations.resume();
            }
        }
        registerEditor(globPattern, editorInfo, options, editorFactoryObject) {
            let registeredEditor = this._editors.get(globPattern);
            if (registeredEditor === undefined) {
                registeredEditor = new Map();
                this._editors.set(globPattern, registeredEditor);
            }
            let editorsWithId = registeredEditor.get(editorInfo.id);
            if (editorsWithId === undefined) {
                editorsWithId = [];
            }
            const remove = (0, arrays_1.insert)(editorsWithId, {
                globPattern,
                editorInfo,
                options,
                editorFactoryObject
            });
            registeredEditor.set(editorInfo.id, editorsWithId);
            this._shouldReFlattenEditors = true;
            this._onDidChangeEditorRegistrations.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                remove();
                if (editorsWithId && editorsWithId.length === 0) {
                    registeredEditor?.delete(editorInfo.id);
                }
                this._shouldReFlattenEditors = true;
                this._onDidChangeEditorRegistrations.fire();
            });
        }
        getAssociationsForResource(resource) {
            const associations = this.getAllUserAssociations();
            let matchingAssociations = associations.filter(association => association.filenamePattern && (0, editorResolverService_1.globMatchesResource)(association.filenamePattern, resource));
            // Sort matching associations based on glob length as a longer glob will be more specific
            matchingAssociations = matchingAssociations.sort((a, b) => (b.filenamePattern?.length ?? 0) - (a.filenamePattern?.length ?? 0));
            const allEditors = this._registeredEditors;
            // Ensure that the settings are valid editors
            return matchingAssociations.filter(association => allEditors.find(c => c.editorInfo.id === association.viewType));
        }
        getAllUserAssociations() {
            const inspectedEditorAssociations = this.configurationService.inspect(editorResolverService_1.editorsAssociationsSettingId) || {};
            const defaultAssociations = inspectedEditorAssociations.defaultValue ?? {};
            const workspaceAssociations = inspectedEditorAssociations.workspaceValue ?? {};
            const userAssociations = inspectedEditorAssociations.userValue ?? {};
            const rawAssociations = { ...workspaceAssociations };
            // We want to apply the default associations and user associations on top of the workspace associations but ignore duplicate keys.
            for (const [key, value] of Object.entries({ ...defaultAssociations, ...userAssociations })) {
                if (rawAssociations[key] === undefined) {
                    rawAssociations[key] = value;
                }
            }
            const associations = [];
            for (const [key, value] of Object.entries(rawAssociations)) {
                const association = {
                    filenamePattern: key,
                    viewType: value
                };
                associations.push(association);
            }
            return associations;
        }
        /**
         * Given the nested nature of the editors map, we merge factories of the same glob and id to make it flat
         * and easier to work with
         */
        _flattenEditorsMap() {
            // If we shouldn't be re-flattening (due to lack of update) then return early
            if (!this._shouldReFlattenEditors) {
                return this._flattenedEditors;
            }
            this._shouldReFlattenEditors = false;
            const editors = new Map();
            for (const [glob, value] of this._editors) {
                const registeredEditors = [];
                for (const editors of value.values()) {
                    let registeredEditor = undefined;
                    // Merge all editors with the same id and glob pattern together
                    for (const editor of editors) {
                        if (!registeredEditor) {
                            registeredEditor = {
                                editorInfo: editor.editorInfo,
                                globPattern: editor.globPattern,
                                options: {},
                                editorFactoryObject: {}
                            };
                        }
                        // Merge options and factories
                        registeredEditor.options = { ...registeredEditor.options, ...editor.options };
                        registeredEditor.editorFactoryObject = { ...registeredEditor.editorFactoryObject, ...editor.editorFactoryObject };
                    }
                    if (registeredEditor) {
                        registeredEditors.push(registeredEditor);
                    }
                }
                editors.set(glob, registeredEditors);
            }
            return editors;
        }
        /**
         * Returns all editors as an array. Possible to contain duplicates
         */
        get _registeredEditors() {
            return (0, arrays_1.flatten)(Array.from(this._flattenedEditors.values()));
        }
        updateUserAssociations(globPattern, editorID) {
            const newAssociation = { viewType: editorID, filenamePattern: globPattern };
            const currentAssociations = this.getAllUserAssociations();
            const newSettingObject = Object.create(null);
            // Form the new setting object including the newest associations
            for (const association of [...currentAssociations, newAssociation]) {
                if (association.filenamePattern) {
                    newSettingObject[association.filenamePattern] = association.viewType;
                }
            }
            this.configurationService.updateValue(editorResolverService_1.editorsAssociationsSettingId, newSettingObject);
        }
        findMatchingEditors(resource) {
            // The user setting should be respected even if the editor doesn't specify that resource in package.json
            const userSettings = this.getAssociationsForResource(resource);
            const matchingEditors = [];
            // Then all glob patterns
            for (const [key, editors] of this._flattenedEditors) {
                for (const editor of editors) {
                    const foundInSettings = userSettings.find(setting => setting.viewType === editor.editorInfo.id);
                    if ((foundInSettings && editor.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive) || (0, editorResolverService_1.globMatchesResource)(key, resource)) {
                        matchingEditors.push(editor);
                    }
                }
            }
            // Return the editors sorted by their priority
            return matchingEditors.sort((a, b) => {
                // Very crude if priorities match longer glob wins as longer globs are normally more specific
                if ((0, editorResolverService_1.priorityToRank)(b.editorInfo.priority) === (0, editorResolverService_1.priorityToRank)(a.editorInfo.priority) && typeof b.globPattern === 'string' && typeof a.globPattern === 'string') {
                    return b.globPattern.length - a.globPattern.length;
                }
                return (0, editorResolverService_1.priorityToRank)(b.editorInfo.priority) - (0, editorResolverService_1.priorityToRank)(a.editorInfo.priority);
            });
        }
        getEditors(resource) {
            this._flattenedEditors = this._flattenEditorsMap();
            // By resource
            if (uri_1.URI.isUri(resource)) {
                const editors = this.findMatchingEditors(resource);
                if (editors.find(e => e.editorInfo.priority === editorResolverService_1.RegisteredEditorPriority.exclusive)) {
                    return [];
                }
                return editors.map(editor => editor.editorInfo);
            }
            // All
            return (0, arrays_1.distinct)(this._registeredEditors.map(editor => editor.editorInfo), editor => editor.id);
        }
        /**
         * Given a resource and an editorId selects the best possible editor
         * @returns The editor and whether there was another default which conflicted with it
         */
        getEditor(resource, editorId) {
            const findMatchingEditor = (editors, viewType) => {
                return editors.find((editor) => {
                    if (editor.options && editor.options.canSupportResource !== undefined) {
                        return editor.editorInfo.id === viewType && editor.options.canSupportResource(resource);
                    }
                    return editor.editorInfo.id === viewType;
                });
            };
            if (editorId && editorId !== editor_1.EditorResolution.EXCLUSIVE_ONLY) {
                // Specific id passed in doesn't have to match the resource, it can be anything
                const registeredEditors = this._registeredEditors;
                return {
                    editor: findMatchingEditor(registeredEditors, editorId),
                    conflictingDefault: false
                };
            }
            const editors = this.findMatchingEditors(resource);
            const associationsFromSetting = this.getAssociationsForResource(resource);
            // We only want minPriority+ if no user defined setting is found, else we won't resolve an editor
            const minPriority = editorId === editor_1.EditorResolution.EXCLUSIVE_ONLY ? editorResolverService_1.RegisteredEditorPriority.exclusive : editorResolverService_1.RegisteredEditorPriority.builtin;
            let possibleEditors = editors.filter(editor => (0, editorResolverService_1.priorityToRank)(editor.editorInfo.priority) >= (0, editorResolverService_1.priorityToRank)(minPriority) && editor.editorInfo.id !== editor_2.DEFAULT_EDITOR_ASSOCIATION.id);
            if (possibleEditors.length === 0) {
                return {
                    editor: associationsFromSetting[0] && minPriority !== editorResolverService_1.RegisteredEditorPriority.exclusive ? findMatchingEditor(editors, associationsFromSetting[0].viewType) : undefined,
                    conflictingDefault: false
                };
            }
            // If the editor is exclusive we use that, else use the user setting, else use the built-in+ editor
            const selectedViewType = possibleEditors[0].editorInfo.priority === editorResolverService_1.RegisteredEditorPriority.exclusive ?
                possibleEditors[0].editorInfo.id :
                associationsFromSetting[0]?.viewType || possibleEditors[0].editorInfo.id;
            let conflictingDefault = false;
            // Filter out exclusive before we check for conflicts as exclusive editors cannot be manually chosen
            possibleEditors = possibleEditors.filter(editor => editor.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive);
            if (associationsFromSetting.length === 0 && possibleEditors.length > 1) {
                conflictingDefault = true;
            }
            return {
                editor: findMatchingEditor(editors, selectedViewType),
                conflictingDefault
            };
        }
        async doResolveEditor(editor, group, selectedEditor) {
            let options = editor.options;
            const resource = editor_2.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            // If no activation option is provided, populate it.
            if (options && typeof options.activation === 'undefined') {
                options = { ...options, activation: options.preserveFocus ? editor_1.EditorActivation.RESTORE : undefined };
            }
            // If it's a merge editor we trigger the create merge editor input
            if ((0, editor_2.isResourceMergeEditorInput)(editor)) {
                if (!selectedEditor.editorFactoryObject.createMergeEditorInput) {
                    return;
                }
                const inputWithOptions = await selectedEditor.editorFactoryObject.createMergeEditorInput(editor, group);
                return { editor: inputWithOptions.editor, options: inputWithOptions.options ?? options };
            }
            // If it's a diff editor we trigger the create diff editor input
            if ((0, editor_2.isResourceDiffEditorInput)(editor)) {
                if (!selectedEditor.editorFactoryObject.createDiffEditorInput) {
                    return;
                }
                const inputWithOptions = await selectedEditor.editorFactoryObject.createDiffEditorInput(editor, group);
                return { editor: inputWithOptions.editor, options: inputWithOptions.options ?? options };
            }
            // If it's a diff list editor we trigger the create diff list editor input
            if ((0, editor_2.isResourceMultiDiffEditorInput)(editor)) {
                if (!selectedEditor.editorFactoryObject.createMultiDiffEditorInput) {
                    return;
                }
                const inputWithOptions = await selectedEditor.editorFactoryObject.createMultiDiffEditorInput(editor, group);
                return { editor: inputWithOptions.editor, options: inputWithOptions.options ?? options };
            }
            if ((0, editor_2.isResourceSideBySideEditorInput)(editor)) {
                throw new Error(`Untyped side by side editor input not supported here.`);
            }
            if ((0, editor_2.isUntitledResourceEditorInput)(editor)) {
                if (!selectedEditor.editorFactoryObject.createUntitledEditorInput) {
                    return;
                }
                const inputWithOptions = await selectedEditor.editorFactoryObject.createUntitledEditorInput(editor, group);
                return { editor: inputWithOptions.editor, options: inputWithOptions.options ?? options };
            }
            // Should no longer have an undefined resource so lets throw an error if that's somehow the case
            if (resource === undefined) {
                throw new Error(`Undefined resource on non untitled editor input.`);
            }
            // If the editor states it can only be opened once per resource we must close all existing ones except one and move the new one into the group
            const singleEditorPerResource = typeof selectedEditor.options?.singlePerResource === 'function' ? selectedEditor.options.singlePerResource() : selectedEditor.options?.singlePerResource;
            if (singleEditorPerResource) {
                const existingEditors = this.findExistingEditorsForResource(resource, selectedEditor.editorInfo.id);
                if (existingEditors.length) {
                    const editor = await this.moveExistingEditorForResource(existingEditors, group);
                    if (editor) {
                        return { editor, options };
                    }
                    else {
                        return; // failed to move
                    }
                }
            }
            // If no factory is above, return flow back to caller letting them know we could not resolve it
            if (!selectedEditor.editorFactoryObject.createEditorInput) {
                return;
            }
            // Respect options passed back
            const inputWithOptions = await selectedEditor.editorFactoryObject.createEditorInput(editor, group);
            options = inputWithOptions.options ?? options;
            const input = inputWithOptions.editor;
            return { editor: input, options };
        }
        /**
         * Moves the first existing editor for a resource to the target group unless already opened there.
         * Additionally will close any other editors that are open for that resource and viewtype besides the first one found
         * @param resource The resource of the editor
         * @param viewType the viewtype of the editor
         * @param targetGroup The group to move it to
         * @returns The moved editor input or `undefined` if the editor could not be moved
         */
        async moveExistingEditorForResource(existingEditorsForResource, targetGroup) {
            const editorToUse = existingEditorsForResource[0];
            // We should only have one editor but if there are multiple we close the others
            for (const { editor, group } of existingEditorsForResource) {
                if (editor !== editorToUse.editor) {
                    const closed = await group.closeEditor(editor);
                    if (!closed) {
                        return;
                    }
                }
            }
            // Move the editor already opened to the target group
            if (targetGroup.id !== editorToUse.group.id) {
                const moved = editorToUse.group.moveEditor(editorToUse.editor, targetGroup);
                if (!moved) {
                    return;
                }
            }
            return editorToUse.editor;
        }
        /**
         * Given a resource and an editorId, returns all editors open for that resource and editorId.
         * @param resource The resource specified
         * @param editorId The editorID
         * @returns A list of editors
         */
        findExistingEditorsForResource(resource, editorId) {
            const out = [];
            const orderedGroups = (0, arrays_1.distinct)([
                ...this.editorGroupService.groups,
            ]);
            for (const group of orderedGroups) {
                for (const editor of group.editors) {
                    if ((0, resources_1.isEqual)(editor.resource, resource) && editor.editorId === editorId) {
                        out.push({ editor, group });
                    }
                }
            }
            return out;
        }
        async doHandleConflictingDefaults(resource, editorName, untypedInput, currentEditor, group) {
            const editors = this.findMatchingEditors(resource);
            const storedChoices = JSON.parse(this.storageService.get(EditorResolverService_1.conflictingDefaultsStorageID, 0 /* StorageScope.PROFILE */, '{}'));
            const globForResource = `*${(0, resources_1.extname)(resource)}`;
            // Writes to the storage service that a choice has been made for the currently installed editors
            const writeCurrentEditorsToStorage = () => {
                storedChoices[globForResource] = [];
                editors.forEach(editor => storedChoices[globForResource].push(editor.editorInfo.id));
                this.storageService.store(EditorResolverService_1.conflictingDefaultsStorageID, JSON.stringify(storedChoices), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            };
            // If the user has already made a choice for this editor we don't want to ask them again
            if (storedChoices[globForResource] && storedChoices[globForResource].find(editorID => editorID === currentEditor.editorId)) {
                return;
            }
            const handle = this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('editorResolver.conflictingDefaults', 'There are multiple default editors available for the resource.'), [{
                    label: (0, nls_1.localize)('editorResolver.configureDefault', 'Configure Default'),
                    run: async () => {
                        // Show the picker and tell it to update the setting to whatever the user selected
                        const picked = await this.doPickEditor(untypedInput, true);
                        if (!picked) {
                            return;
                        }
                        untypedInput.options = picked;
                        const replacementEditor = await this.resolveEditor(untypedInput, group);
                        if (replacementEditor === 1 /* ResolvedStatus.ABORT */ || replacementEditor === 2 /* ResolvedStatus.NONE */) {
                            return;
                        }
                        // Replace the current editor with the picked one
                        group.replaceEditors([
                            {
                                editor: currentEditor,
                                replacement: replacementEditor.editor,
                                options: replacementEditor.options ?? picked,
                            }
                        ]);
                    }
                },
                {
                    label: (0, nls_1.localize)('editorResolver.keepDefault', 'Keep {0}', editorName),
                    run: writeCurrentEditorsToStorage
                }
            ]);
            // If the user pressed X we assume they want to keep the current editor as default
            const onCloseListener = handle.onDidClose(() => {
                writeCurrentEditorsToStorage();
                onCloseListener.dispose();
            });
        }
        mapEditorsToQuickPickEntry(resource, showDefaultPicker) {
            const currentEditor = (0, arrays_1.firstOrDefault)(this.editorGroupService.activeGroup.findEditors(resource));
            // If untitled, we want all registered editors
            let registeredEditors = resource.scheme === network_1.Schemas.untitled ? this._registeredEditors.filter(e => e.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive) : this.findMatchingEditors(resource);
            // We don't want duplicate Id entries
            registeredEditors = (0, arrays_1.distinct)(registeredEditors, c => c.editorInfo.id);
            const defaultSetting = this.getAssociationsForResource(resource)[0]?.viewType;
            // Not the most efficient way to do this, but we want to ensure the text editor is at the top of the quickpick
            registeredEditors = registeredEditors.sort((a, b) => {
                if (a.editorInfo.id === editor_2.DEFAULT_EDITOR_ASSOCIATION.id) {
                    return -1;
                }
                else if (b.editorInfo.id === editor_2.DEFAULT_EDITOR_ASSOCIATION.id) {
                    return 1;
                }
                else {
                    return (0, editorResolverService_1.priorityToRank)(b.editorInfo.priority) - (0, editorResolverService_1.priorityToRank)(a.editorInfo.priority);
                }
            });
            const quickPickEntries = [];
            const currentlyActiveLabel = (0, nls_1.localize)('promptOpenWith.currentlyActive', "Active");
            const currentDefaultLabel = (0, nls_1.localize)('promptOpenWith.currentDefault', "Default");
            const currentDefaultAndActiveLabel = (0, nls_1.localize)('promptOpenWith.currentDefaultAndActive', "Active and Default");
            // Default order = setting -> highest priority -> text
            let defaultViewType = defaultSetting;
            if (!defaultViewType && registeredEditors.length > 2 && registeredEditors[1]?.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.option) {
                defaultViewType = registeredEditors[1]?.editorInfo.id;
            }
            if (!defaultViewType) {
                defaultViewType = editor_2.DEFAULT_EDITOR_ASSOCIATION.id;
            }
            // Map the editors to quickpick entries
            registeredEditors.forEach(editor => {
                const currentViewType = currentEditor?.editorId ?? editor_2.DEFAULT_EDITOR_ASSOCIATION.id;
                const isActive = currentEditor ? editor.editorInfo.id === currentViewType : false;
                const isDefault = editor.editorInfo.id === defaultViewType;
                const quickPickEntry = {
                    id: editor.editorInfo.id,
                    label: editor.editorInfo.label,
                    description: isActive && isDefault ? currentDefaultAndActiveLabel : isActive ? currentlyActiveLabel : isDefault ? currentDefaultLabel : undefined,
                    detail: editor.editorInfo.detail ?? editor.editorInfo.priority,
                };
                quickPickEntries.push(quickPickEntry);
            });
            if (!showDefaultPicker && (0, resources_1.extname)(resource) !== '') {
                const separator = { type: 'separator' };
                quickPickEntries.push(separator);
                const configureDefaultEntry = {
                    id: EditorResolverService_1.configureDefaultID,
                    label: (0, nls_1.localize)('promptOpenWith.configureDefault', "Configure default editor for '{0}'...", `*${(0, resources_1.extname)(resource)}`),
                };
                quickPickEntries.push(configureDefaultEntry);
            }
            return quickPickEntries;
        }
        async doPickEditor(editor, showDefaultPicker) {
            let resource = editor_2.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            if (resource === undefined) {
                resource = uri_1.URI.from({ scheme: network_1.Schemas.untitled });
            }
            // Get all the editors for the resource as quickpick entries
            const editorPicks = this.mapEditorsToQuickPickEntry(resource, showDefaultPicker);
            // Create the editor picker
            const editorPicker = this.quickInputService.createQuickPick();
            const placeHolderMessage = showDefaultPicker ?
                (0, nls_1.localize)('promptOpenWith.updateDefaultPlaceHolder', "Select new default editor for '{0}'", `*${(0, resources_1.extname)(resource)}`) :
                (0, nls_1.localize)('promptOpenWith.placeHolder', "Select editor for '{0}'", (0, resources_1.basename)(resource));
            editorPicker.placeholder = placeHolderMessage;
            editorPicker.canAcceptInBackground = true;
            editorPicker.items = editorPicks;
            const firstItem = editorPicker.items.find(item => item.type === 'item');
            if (firstItem) {
                editorPicker.selectedItems = [firstItem];
            }
            // Prompt the user to select an editor
            const picked = await new Promise(resolve => {
                editorPicker.onDidAccept(e => {
                    let result = undefined;
                    if (editorPicker.selectedItems.length === 1) {
                        result = {
                            item: editorPicker.selectedItems[0],
                            keyMods: editorPicker.keyMods,
                            openInBackground: e.inBackground
                        };
                    }
                    // If asked to always update the setting then update it even if the gear isn't clicked
                    if (resource && showDefaultPicker && result?.item.id) {
                        this.updateUserAssociations(`*${(0, resources_1.extname)(resource)}`, result.item.id);
                    }
                    resolve(result);
                });
                editorPicker.onDidHide(() => resolve(undefined));
                editorPicker.onDidTriggerItemButton(e => {
                    // Trigger opening and close picker
                    resolve({ item: e.item, openInBackground: false });
                    // Persist setting
                    if (resource && e.item && e.item.id) {
                        this.updateUserAssociations(`*${(0, resources_1.extname)(resource)}`, e.item.id);
                    }
                });
                editorPicker.show();
            });
            // Close picker
            editorPicker.dispose();
            // If the user picked an editor, look at how the picker was
            // used (e.g. modifier keys, open in background) and create the
            // options and group to use accordingly
            if (picked) {
                // If the user selected to configure default we trigger this picker again and tell it to show the default picker
                if (picked.item.id === EditorResolverService_1.configureDefaultID) {
                    return this.doPickEditor(editor, true);
                }
                // Figure out options
                const targetOptions = {
                    ...editor.options,
                    override: picked.item.id,
                    preserveFocus: picked.openInBackground || editor.options?.preserveFocus,
                };
                return targetOptions;
            }
            return undefined;
        }
        sendEditorResolutionTelemetry(chosenInput) {
            if (chosenInput.editorId) {
                this.telemetryService.publicLog2('override.viewType', { viewType: chosenInput.editorId });
            }
        }
        cacheEditors() {
            // Create a set to store glob patterns
            const cacheStorage = new Set();
            // Store just the relative pattern pieces without any path info
            for (const [globPattern, contribPoint] of this._flattenedEditors) {
                const nonOptional = !!contribPoint.find(c => c.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.option && c.editorInfo.id !== editor_2.DEFAULT_EDITOR_ASSOCIATION.id);
                // Don't keep a cache of the optional ones as those wouldn't be opened on start anyways
                if (!nonOptional) {
                    continue;
                }
                if (glob.isRelativePattern(globPattern)) {
                    cacheStorage.add(`${globPattern.pattern}`);
                }
                else {
                    cacheStorage.add(globPattern);
                }
            }
            // Also store the users settings as those would have to activate on startup as well
            const userAssociations = this.getAllUserAssociations();
            for (const association of userAssociations) {
                if (association.filenamePattern) {
                    cacheStorage.add(association.filenamePattern);
                }
            }
            this.storageService.store(EditorResolverService_1.cacheStorageID, JSON.stringify(Array.from(cacheStorage)), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
        resourceMatchesCache(resource) {
            if (!this.cache) {
                return false;
            }
            for (const cacheEntry of this.cache) {
                if ((0, editorResolverService_1.globMatchesResource)(cacheEntry, resource)) {
                    return true;
                }
            }
            return false;
        }
    };
    exports.EditorResolverService = EditorResolverService;
    exports.EditorResolverService = EditorResolverService = EditorResolverService_1 = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, notification_1.INotificationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, storage_1.IStorageService),
        __param(7, extensions_2.IExtensionService),
        __param(8, log_1.ILogService)
    ], EditorResolverService);
    (0, extensions_1.registerSingleton)(editorResolverService_1.IEditorResolverService, EditorResolverService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZWRpdG9yL2Jyb3dzZXIvZWRpdG9yUmVzb2x2ZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxQ3pGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7O1FBT3BELFlBQVk7aUJBQ1ksdUJBQWtCLEdBQUcsaUNBQWlDLEFBQXBDLENBQXFDO2lCQUN2RCxtQkFBYyxHQUFHLDZCQUE2QixBQUFoQyxDQUFpQztpQkFDL0MsaUNBQTRCLEdBQUcsMkNBQTJDLEFBQTlDLENBQStDO1FBUW5HLFlBQ3VCLGtCQUF5RCxFQUN4RCxvQkFBNEQsRUFDNUQsb0JBQTRELEVBQy9ELGlCQUFzRCxFQUNwRCxtQkFBMEQsRUFDN0QsZ0JBQW9ELEVBQ3RELGNBQWdELEVBQzlDLGdCQUFvRCxFQUMxRCxVQUF3QztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQVYrQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXNCO1lBQ3ZDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM5QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ25DLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDNUMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNyQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN6QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBeEJ0RCxTQUFTO1lBQ1Esb0NBQStCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixF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