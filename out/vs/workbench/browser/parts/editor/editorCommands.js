/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listWidget", "vs/base/common/arrays", "vs/base/common/keyCodes", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/editorBrowser", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry", "vs/workbench/browser/parts/editor/editorQuickAccess", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/workbench/browser/parts/editor/textDiffEditor", "vs/workbench/common/contextkeys", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/untitled/common/untitledTextEditorService", "./diffEditorCommands"], function (require, exports, dom_1, listWidget_1, arrays_1, keyCodes_1, network_1, resources_1, types_1, uri_1, editorBrowser_1, editorContextKeys_1, nls_1, actionCommonCategories_1, actions_1, commands_1, configuration_1, contextkey_1, editor_1, instantiation_1, keybindingsRegistry_1, listService_1, opener_1, quickInput_1, telemetry_1, editorQuickAccess_1, sideBySideEditor_1, textDiffEditor_1, contextkeys_1, editor_2, diffEditorInput_1, sideBySideEditorInput_1, editorGroupColumn_1, editorGroupsService_1, editorResolverService_1, editorService_1, pathService_1, untitledTextEditorService_1, diffEditorCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EDITOR_CORE_NAVIGATION_COMMANDS = exports.API_OPEN_WITH_EDITOR_COMMAND_ID = exports.API_OPEN_DIFF_EDITOR_COMMAND_ID = exports.API_OPEN_EDITOR_COMMAND_ID = exports.NEW_EMPTY_EDITOR_WINDOW_COMMAND_ID = exports.COPY_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID = exports.MOVE_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID = exports.COPY_EDITOR_INTO_NEW_WINDOW_COMMAND_ID = exports.MOVE_EDITOR_INTO_NEW_WINDOW_COMMAND_ID = exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID = exports.FOCUS_BELOW_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_ABOVE_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_RIGHT_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_LEFT_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_OTHER_SIDE_EDITOR = exports.FOCUS_SECOND_SIDE_EDITOR = exports.FOCUS_FIRST_SIDE_EDITOR = exports.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT = exports.JOIN_EDITOR_IN_GROUP = exports.TOGGLE_SPLIT_EDITOR_IN_GROUP = exports.SPLIT_EDITOR_IN_GROUP = exports.TOGGLE_MAXIMIZE_EDITOR_GROUP = exports.SPLIT_EDITOR_RIGHT = exports.SPLIT_EDITOR_LEFT = exports.SPLIT_EDITOR_DOWN = exports.SPLIT_EDITOR_UP = exports.SPLIT_EDITOR = exports.UNPIN_EDITOR_COMMAND_ID = exports.PIN_EDITOR_COMMAND_ID = exports.REOPEN_WITH_COMMAND_ID = exports.SHOW_EDITORS_IN_GROUP = exports.UNLOCK_GROUP_COMMAND_ID = exports.LOCK_GROUP_COMMAND_ID = exports.TOGGLE_LOCK_GROUP_COMMAND_ID = exports.TOGGLE_KEEP_EDITORS_COMMAND_ID = exports.KEEP_EDITOR_COMMAND_ID = exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID = exports.COPY_ACTIVE_EDITOR_COMMAND_ID = exports.MOVE_ACTIVE_EDITOR_COMMAND_ID = exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID = exports.CLOSE_EDITOR_GROUP_COMMAND_ID = exports.CLOSE_PINNED_EDITOR_COMMAND_ID = exports.CLOSE_EDITOR_COMMAND_ID = exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID = exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID = exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID = exports.CLOSE_SAVED_EDITORS_COMMAND_ID = void 0;
    exports.splitEditor = splitEditor;
    exports.getCommandsContext = getCommandsContext;
    exports.resolveCommandsContext = resolveCommandsContext;
    exports.getMultiSelectedEditorContexts = getMultiSelectedEditorContexts;
    exports.setup = setup;
    exports.CLOSE_SAVED_EDITORS_COMMAND_ID = 'workbench.action.closeUnmodifiedEditors';
    exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID = 'workbench.action.closeEditorsInGroup';
    exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID = 'workbench.action.closeEditorsAndGroup';
    exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID = 'workbench.action.closeEditorsToTheRight';
    exports.CLOSE_EDITOR_COMMAND_ID = 'workbench.action.closeActiveEditor';
    exports.CLOSE_PINNED_EDITOR_COMMAND_ID = 'workbench.action.closeActivePinnedEditor';
    exports.CLOSE_EDITOR_GROUP_COMMAND_ID = 'workbench.action.closeGroup';
    exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID = 'workbench.action.closeOtherEditors';
    exports.MOVE_ACTIVE_EDITOR_COMMAND_ID = 'moveActiveEditor';
    exports.COPY_ACTIVE_EDITOR_COMMAND_ID = 'copyActiveEditor';
    exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID = 'layoutEditorGroups';
    exports.KEEP_EDITOR_COMMAND_ID = 'workbench.action.keepEditor';
    exports.TOGGLE_KEEP_EDITORS_COMMAND_ID = 'workbench.action.toggleKeepEditors';
    exports.TOGGLE_LOCK_GROUP_COMMAND_ID = 'workbench.action.toggleEditorGroupLock';
    exports.LOCK_GROUP_COMMAND_ID = 'workbench.action.lockEditorGroup';
    exports.UNLOCK_GROUP_COMMAND_ID = 'workbench.action.unlockEditorGroup';
    exports.SHOW_EDITORS_IN_GROUP = 'workbench.action.showEditorsInGroup';
    exports.REOPEN_WITH_COMMAND_ID = 'workbench.action.reopenWithEditor';
    exports.PIN_EDITOR_COMMAND_ID = 'workbench.action.pinEditor';
    exports.UNPIN_EDITOR_COMMAND_ID = 'workbench.action.unpinEditor';
    exports.SPLIT_EDITOR = 'workbench.action.splitEditor';
    exports.SPLIT_EDITOR_UP = 'workbench.action.splitEditorUp';
    exports.SPLIT_EDITOR_DOWN = 'workbench.action.splitEditorDown';
    exports.SPLIT_EDITOR_LEFT = 'workbench.action.splitEditorLeft';
    exports.SPLIT_EDITOR_RIGHT = 'workbench.action.splitEditorRight';
    exports.TOGGLE_MAXIMIZE_EDITOR_GROUP = 'workbench.action.toggleMaximizeEditorGroup';
    exports.SPLIT_EDITOR_IN_GROUP = 'workbench.action.splitEditorInGroup';
    exports.TOGGLE_SPLIT_EDITOR_IN_GROUP = 'workbench.action.toggleSplitEditorInGroup';
    exports.JOIN_EDITOR_IN_GROUP = 'workbench.action.joinEditorInGroup';
    exports.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT = 'workbench.action.toggleSplitEditorInGroupLayout';
    exports.FOCUS_FIRST_SIDE_EDITOR = 'workbench.action.focusFirstSideEditor';
    exports.FOCUS_SECOND_SIDE_EDITOR = 'workbench.action.focusSecondSideEditor';
    exports.FOCUS_OTHER_SIDE_EDITOR = 'workbench.action.focusOtherSideEditor';
    exports.FOCUS_LEFT_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusLeftGroupWithoutWrap';
    exports.FOCUS_RIGHT_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusRightGroupWithoutWrap';
    exports.FOCUS_ABOVE_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusAboveGroupWithoutWrap';
    exports.FOCUS_BELOW_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusBelowGroupWithoutWrap';
    exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID = 'workbench.action.openEditorAtIndex';
    exports.MOVE_EDITOR_INTO_NEW_WINDOW_COMMAND_ID = 'workbench.action.moveEditorToNewWindow';
    exports.COPY_EDITOR_INTO_NEW_WINDOW_COMMAND_ID = 'workbench.action.copyEditorToNewWindow';
    exports.MOVE_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID = 'workbench.action.moveEditorGroupToNewWindow';
    exports.COPY_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID = 'workbench.action.copyEditorGroupToNewWindow';
    exports.NEW_EMPTY_EDITOR_WINDOW_COMMAND_ID = 'workbench.action.newEmptyEditorWindow';
    exports.API_OPEN_EDITOR_COMMAND_ID = '_workbench.open';
    exports.API_OPEN_DIFF_EDITOR_COMMAND_ID = '_workbench.diff';
    exports.API_OPEN_WITH_EDITOR_COMMAND_ID = '_workbench.openWith';
    exports.EDITOR_CORE_NAVIGATION_COMMANDS = [
        exports.SPLIT_EDITOR,
        exports.CLOSE_EDITOR_COMMAND_ID,
        exports.UNPIN_EDITOR_COMMAND_ID,
        exports.UNLOCK_GROUP_COMMAND_ID,
        exports.TOGGLE_MAXIMIZE_EDITOR_GROUP
    ];
    const isActiveEditorMoveCopyArg = function (arg) {
        if (!(0, types_1.isObject)(arg)) {
            return false;
        }
        if (!(0, types_1.isString)(arg.to)) {
            return false;
        }
        if (!(0, types_1.isUndefined)(arg.by) && !(0, types_1.isString)(arg.by)) {
            return false;
        }
        if (!(0, types_1.isUndefined)(arg.value) && !(0, types_1.isNumber)(arg.value)) {
            return false;
        }
        return true;
    };
    function registerActiveEditorMoveCopyCommand() {
        const moveCopyJSONSchema = {
            'type': 'object',
            'required': ['to'],
            'properties': {
                'to': {
                    'type': 'string',
                    'enum': ['left', 'right']
                },
                'by': {
                    'type': 'string',
                    'enum': ['tab', 'group']
                },
                'value': {
                    'type': 'number'
                }
            }
        };
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.MOVE_ACTIVE_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 0,
            handler: (accessor, args) => moveCopyActiveEditor(true, args, accessor),
            metadata: {
                description: (0, nls_1.localize)('editorCommand.activeEditorMove.description', "Move the active editor by tabs or groups"),
                args: [
                    {
                        name: (0, nls_1.localize)('editorCommand.activeEditorMove.arg.name', "Active editor move argument"),
                        description: (0, nls_1.localize)('editorCommand.activeEditorMove.arg.description', "Argument Properties:\n\t* 'to': String value providing where to move.\n\t* 'by': String value providing the unit for move (by tab or by group).\n\t* 'value': Number value providing how many positions or an absolute position to move."),
                        constraint: isActiveEditorMoveCopyArg,
                        schema: moveCopyJSONSchema
                    }
                ]
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.COPY_ACTIVE_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 0,
            handler: (accessor, args) => moveCopyActiveEditor(false, args, accessor),
            metadata: {
                description: (0, nls_1.localize)('editorCommand.activeEditorCopy.description', "Copy the active editor by groups"),
                args: [
                    {
                        name: (0, nls_1.localize)('editorCommand.activeEditorCopy.arg.name', "Active editor copy argument"),
                        description: (0, nls_1.localize)('editorCommand.activeEditorCopy.arg.description', "Argument Properties:\n\t* 'to': String value providing where to copy.\n\t* 'value': Number value providing how many positions or an absolute position to copy."),
                        constraint: isActiveEditorMoveCopyArg,
                        schema: moveCopyJSONSchema
                    }
                ]
            }
        });
        function moveCopyActiveEditor(isMove, args = Object.create(null), accessor) {
            args.to = args.to || 'right';
            args.by = args.by || 'tab';
            args.value = typeof args.value === 'number' ? args.value : 1;
            const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
            if (activeEditorPane) {
                switch (args.by) {
                    case 'tab':
                        if (isMove) {
                            return moveActiveTab(args, activeEditorPane);
                        }
                        break;
                    case 'group':
                        return moveCopyActiveEditorToGroup(isMove, args, activeEditorPane, accessor);
                }
            }
        }
        function moveActiveTab(args, control) {
            const group = control.group;
            let index = group.getIndexOfEditor(control.input);
            switch (args.to) {
                case 'first':
                    index = 0;
                    break;
                case 'last':
                    index = group.count - 1;
                    break;
                case 'left':
                    index = index - args.value;
                    break;
                case 'right':
                    index = index + args.value;
                    break;
                case 'center':
                    index = Math.round(group.count / 2) - 1;
                    break;
                case 'position':
                    index = args.value - 1;
                    break;
            }
            index = index < 0 ? 0 : index >= group.count ? group.count - 1 : index;
            group.moveEditor(control.input, group, { index });
        }
        function moveCopyActiveEditorToGroup(isMove, args, control, accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const sourceGroup = control.group;
            let targetGroup;
            switch (args.to) {
                case 'left':
                    targetGroup = editorGroupService.findGroup({ direction: 2 /* GroupDirection.LEFT */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 2 /* GroupDirection.LEFT */);
                    }
                    break;
                case 'right':
                    targetGroup = editorGroupService.findGroup({ direction: 3 /* GroupDirection.RIGHT */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 3 /* GroupDirection.RIGHT */);
                    }
                    break;
                case 'up':
                    targetGroup = editorGroupService.findGroup({ direction: 0 /* GroupDirection.UP */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 0 /* GroupDirection.UP */);
                    }
                    break;
                case 'down':
                    targetGroup = editorGroupService.findGroup({ direction: 1 /* GroupDirection.DOWN */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 1 /* GroupDirection.DOWN */);
                    }
                    break;
                case 'first':
                    targetGroup = editorGroupService.findGroup({ location: 0 /* GroupLocation.FIRST */ }, sourceGroup);
                    break;
                case 'last':
                    targetGroup = editorGroupService.findGroup({ location: 1 /* GroupLocation.LAST */ }, sourceGroup);
                    break;
                case 'previous':
                    targetGroup = editorGroupService.findGroup({ location: 3 /* GroupLocation.PREVIOUS */ }, sourceGroup);
                    break;
                case 'next':
                    targetGroup = editorGroupService.findGroup({ location: 2 /* GroupLocation.NEXT */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService));
                    }
                    break;
                case 'center':
                    targetGroup = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[(editorGroupService.count / 2) - 1];
                    break;
                case 'position':
                    targetGroup = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[args.value - 1];
                    break;
            }
            if (targetGroup) {
                if (isMove) {
                    sourceGroup.moveEditor(control.input, targetGroup);
                }
                else if (sourceGroup.id !== targetGroup.id) {
                    sourceGroup.copyEditor(control.input, targetGroup);
                }
                targetGroup.focus();
            }
        }
    }
    function registerEditorGroupsLayoutCommands() {
        function applyEditorLayout(accessor, layout) {
            if (!layout || typeof layout !== 'object') {
                return;
            }
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.applyLayout(layout);
        }
        commands_1.CommandsRegistry.registerCommand(exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID, (accessor, args) => {
            applyEditorLayout(accessor, args);
        });
        // API Commands
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.setEditorLayout',
            handler: (accessor, args) => applyEditorLayout(accessor, args),
            metadata: {
                description: 'Set Editor Layout',
                args: [{
                        name: 'args',
                        schema: {
                            'type': 'object',
                            'required': ['groups'],
                            'properties': {
                                'orientation': {
                                    'type': 'number',
                                    'default': 0,
                                    'enum': [0, 1]
                                },
                                'groups': {
                                    '$ref': '#/definitions/editorGroupsSchema',
                                    'default': [{}, {}]
                                }
                            }
                        }
                    }]
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.getEditorLayout',
            handler: (accessor) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                return editorGroupService.getLayout();
            },
            metadata: {
                description: 'Get Editor Layout',
                args: [],
                returns: 'An editor layout object, in the same format as vscode.setEditorLayout'
            }
        });
    }
    function registerOpenEditorAPICommands() {
        function mixinContext(context, options, column) {
            if (!context) {
                return [options, column];
            }
            return [
                { ...context.editorOptions, ...(options ?? Object.create(null)) },
                context.sideBySide ? editorService_1.SIDE_GROUP : column
            ];
        }
        // partial, renderer-side API command to open editor
        // complements https://github.com/microsoft/vscode/blob/2b164efb0e6a5de3826bff62683eaeafe032284f/src/vs/workbench/api/common/extHostApiCommands.ts#L373
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.open',
            handler: (accessor, arg) => {
                accessor.get(commands_1.ICommandService).executeCommand(exports.API_OPEN_EDITOR_COMMAND_ID, arg);
            },
            metadata: {
                description: 'Opens the provided resource in the editor.',
                args: [{ name: 'Uri' }]
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.API_OPEN_EDITOR_COMMAND_ID, async function (accessor, resourceArg, columnAndOptions, label, context) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const pathService = accessor.get(pathService_1.IPathService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const untitledTextEditorService = accessor.get(untitledTextEditorService_1.IUntitledTextEditorService);
            const resourceOrString = typeof resourceArg === 'string' ? resourceArg : uri_1.URI.from(resourceArg, true);
            const [columnArg, optionsArg] = columnAndOptions ?? [];
            // use editor options or editor view column or resource scheme
            // as a hint to use the editor service for opening directly
            if (optionsArg || typeof columnArg === 'number' || (0, network_1.matchesScheme)(resourceOrString, network_1.Schemas.untitled)) {
                const [options, column] = mixinContext(context, optionsArg, columnArg);
                const resource = uri_1.URI.isUri(resourceOrString) ? resourceOrString : uri_1.URI.parse(resourceOrString);
                let input;
                if (untitledTextEditorService.isUntitledWithAssociatedResource(resource)) {
                    // special case for untitled: we are getting a resource with meaningful
                    // path from an extension to use for the untitled editor. as such, we
                    // have to assume it as an associated resource to use when saving. we
                    // do so by setting the `forceUntitled: true` and changing the scheme
                    // to a file based one. the untitled editor service takes care to
                    // associate the path properly then.
                    input = { resource: resource.with({ scheme: pathService.defaultUriScheme }), forceUntitled: true, options, label };
                }
                else {
                    // use any other resource as is
                    input = { resource, options, label };
                }
                await editorService.openEditor(input, (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupService, configurationService, column));
            }
            // do not allow to execute commands from here
            else if ((0, network_1.matchesScheme)(resourceOrString, network_1.Schemas.command)) {
                return;
            }
            // finally, delegate to opener service
            else {
                await openerService.open(resourceOrString, { openToSide: context?.sideBySide, editorOptions: context?.editorOptions });
            }
        });
        // partial, renderer-side API command to open diff editor
        // complements https://github.com/microsoft/vscode/blob/2b164efb0e6a5de3826bff62683eaeafe032284f/src/vs/workbench/api/common/extHostApiCommands.ts#L397
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.diff',
            handler: (accessor, left, right, label) => {
                accessor.get(commands_1.ICommandService).executeCommand(exports.API_OPEN_DIFF_EDITOR_COMMAND_ID, left, right, label);
            },
            metadata: {
                description: 'Opens the provided resources in the diff editor to compare their contents.',
                args: [
                    { name: 'left', description: 'Left-hand side resource of the diff editor' },
                    { name: 'right', description: 'Right-hand side resource of the diff editor' },
                    { name: 'title', description: 'Human readable title for the diff editor' },
                ]
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.API_OPEN_DIFF_EDITOR_COMMAND_ID, async function (accessor, originalResource, modifiedResource, labelAndOrDescription, columnAndOptions, context) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const [columnArg, optionsArg] = columnAndOptions ?? [];
            const [options, column] = mixinContext(context, optionsArg, columnArg);
            let label = undefined;
            let description = undefined;
            if (typeof labelAndOrDescription === 'string') {
                label = labelAndOrDescription;
            }
            else if (labelAndOrDescription) {
                label = labelAndOrDescription.label;
                description = labelAndOrDescription.description;
            }
            await editorService.openEditor({
                original: { resource: uri_1.URI.from(originalResource, true) },
                modified: { resource: uri_1.URI.from(modifiedResource, true) },
                label,
                description,
                options
            }, (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupService, configurationService, column));
        });
        commands_1.CommandsRegistry.registerCommand(exports.API_OPEN_WITH_EDITOR_COMMAND_ID, async (accessor, resource, id, columnAndOptions) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const [columnArg, optionsArg] = columnAndOptions ?? [];
            await editorService.openEditor({ resource: uri_1.URI.from(resource, true), options: { ...optionsArg, pinned: true, override: id } }, (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupsService, configurationService, columnArg));
        });
        // partial, renderer-side API command to open diff editor
        // complements https://github.com/microsoft/vscode/blob/2b164efb0e6a5de3826bff62683eaeafe032284f/src/vs/workbench/api/common/extHostApiCommands.ts#L397
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.changes',
            handler: (accessor, title, resources) => {
                accessor.get(commands_1.ICommandService).executeCommand('_workbench.changes', title, resources);
            },
            metadata: {
                description: 'Opens a list of resources in the changes editor to compare their contents.',
                args: [
                    { name: 'title', description: 'Human readable title for the diff editor' },
                    { name: 'resources', description: 'List of resources to open in the changes editor' }
                ]
            }
        });
        commands_1.CommandsRegistry.registerCommand('_workbench.changes', async (accessor, title, resources) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = [];
            for (const [label, original, modified] of resources) {
                editor.push({
                    resource: uri_1.URI.revive(label),
                    original: { resource: uri_1.URI.revive(original) },
                    modified: { resource: uri_1.URI.revive(modified) },
                });
            }
            await editorService.openEditor({ resources: editor, label: title });
        });
        commands_1.CommandsRegistry.registerCommand('_workbench.openMultiDiffEditor', async (accessor, options) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            await editorService.openEditor({
                multiDiffSource: options.multiDiffSourceUri ? uri_1.URI.revive(options.multiDiffSourceUri) : undefined,
                resources: options.resources?.map(r => ({ original: { resource: uri_1.URI.revive(r.originalUri) }, modified: { resource: uri_1.URI.revive(r.modifiedUri) } })),
                label: options.title,
            });
        });
    }
    function registerOpenEditorAtIndexCommands() {
        const openEditorAtIndex = (accessor, editorIndex) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane) {
                const editor = activeEditorPane.group.getEditorByIndex(editorIndex);
                if (editor) {
                    editorService.openEditor(editor);
                }
            }
        };
        // This command takes in the editor index number to open as an argument
        commands_1.CommandsRegistry.registerCommand({
            id: exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID,
            handler: openEditorAtIndex
        });
        // Keybindings to focus a specific index in the tab folder if tabs are enabled
        for (let i = 0; i < 9; i++) {
            const editorIndex = i;
            const visibleIndex = i + 1;
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID + visibleIndex,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: undefined,
                primary: 512 /* KeyMod.Alt */ | toKeyCode(visibleIndex),
                mac: { primary: 256 /* KeyMod.WinCtrl */ | toKeyCode(visibleIndex) },
                handler: accessor => openEditorAtIndex(accessor, editorIndex)
            });
        }
        function toKeyCode(index) {
            switch (index) {
                case 0: return 21 /* KeyCode.Digit0 */;
                case 1: return 22 /* KeyCode.Digit1 */;
                case 2: return 23 /* KeyCode.Digit2 */;
                case 3: return 24 /* KeyCode.Digit3 */;
                case 4: return 25 /* KeyCode.Digit4 */;
                case 5: return 26 /* KeyCode.Digit5 */;
                case 6: return 27 /* KeyCode.Digit6 */;
                case 7: return 28 /* KeyCode.Digit7 */;
                case 8: return 29 /* KeyCode.Digit8 */;
                case 9: return 30 /* KeyCode.Digit9 */;
            }
            throw new Error('invalid index');
        }
    }
    function registerFocusEditorGroupAtIndexCommands() {
        // Keybindings to focus a specific group (2-8) in the editor area
        for (let groupIndex = 1; groupIndex < 8; groupIndex++) {
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: toCommandId(groupIndex),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: undefined,
                primary: 2048 /* KeyMod.CtrlCmd */ | toKeyCode(groupIndex),
                handler: accessor => {
                    const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                    const configurationService = accessor.get(configuration_1.IConfigurationService);
                    // To keep backwards compatibility (pre-grid), allow to focus a group
                    // that does not exist as long as it is the next group after the last
                    // opened group. Otherwise we return.
                    if (groupIndex > editorGroupService.count) {
                        return;
                    }
                    // Group exists: just focus
                    const groups = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
                    if (groups[groupIndex]) {
                        return groups[groupIndex].focus();
                    }
                    // Group does not exist: create new by splitting the active one of the last group
                    const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService);
                    const lastGroup = editorGroupService.findGroup({ location: 1 /* GroupLocation.LAST */ });
                    if (!lastGroup) {
                        return;
                    }
                    const newGroup = editorGroupService.addGroup(lastGroup, direction);
                    // Focus
                    newGroup.focus();
                }
            });
        }
        function toCommandId(index) {
            switch (index) {
                case 1: return 'workbench.action.focusSecondEditorGroup';
                case 2: return 'workbench.action.focusThirdEditorGroup';
                case 3: return 'workbench.action.focusFourthEditorGroup';
                case 4: return 'workbench.action.focusFifthEditorGroup';
                case 5: return 'workbench.action.focusSixthEditorGroup';
                case 6: return 'workbench.action.focusSeventhEditorGroup';
                case 7: return 'workbench.action.focusEighthEditorGroup';
            }
            throw new Error('Invalid index');
        }
        function toKeyCode(index) {
            switch (index) {
                case 1: return 23 /* KeyCode.Digit2 */;
                case 2: return 24 /* KeyCode.Digit3 */;
                case 3: return 25 /* KeyCode.Digit4 */;
                case 4: return 26 /* KeyCode.Digit5 */;
                case 5: return 27 /* KeyCode.Digit6 */;
                case 6: return 28 /* KeyCode.Digit7 */;
                case 7: return 29 /* KeyCode.Digit8 */;
            }
            throw new Error('Invalid index');
        }
    }
    function splitEditor(editorGroupService, direction, context) {
        let sourceGroup;
        if (context && typeof context.groupId === 'number') {
            sourceGroup = editorGroupService.getGroup(context.groupId);
        }
        else {
            sourceGroup = editorGroupService.activeGroup;
        }
        if (!sourceGroup) {
            return;
        }
        // Add group
        const newGroup = editorGroupService.addGroup(sourceGroup, direction);
        // Split editor (if it can be split)
        let editorToCopy;
        if (context && typeof context.editorIndex === 'number') {
            editorToCopy = sourceGroup.getEditorByIndex(context.editorIndex);
        }
        else {
            editorToCopy = sourceGroup.activeEditor ?? undefined;
        }
        // Copy the editor to the new group, else create an empty group
        if (editorToCopy && !editorToCopy.hasCapability(8 /* EditorInputCapabilities.Singleton */)) {
            sourceGroup.copyEditor(editorToCopy, newGroup, { preserveFocus: context?.preserveFocus });
        }
        // Focus
        newGroup.focus();
    }
    function registerSplitEditorCommands() {
        [
            { id: exports.SPLIT_EDITOR_UP, direction: 0 /* GroupDirection.UP */ },
            { id: exports.SPLIT_EDITOR_DOWN, direction: 1 /* GroupDirection.DOWN */ },
            { id: exports.SPLIT_EDITOR_LEFT, direction: 2 /* GroupDirection.LEFT */ },
            { id: exports.SPLIT_EDITOR_RIGHT, direction: 3 /* GroupDirection.RIGHT */ }
        ].forEach(({ id, direction }) => {
            commands_1.CommandsRegistry.registerCommand(id, function (accessor, resourceOrContext, context) {
                splitEditor(accessor.get(editorGroupsService_1.IEditorGroupsService), direction, getCommandsContext(resourceOrContext, context));
            });
        });
    }
    function registerCloseEditorCommands() {
        // A special handler for "Close Editor" depending on context
        // - keybindining: do not close sticky editors, rather open the next non-sticky editor
        // - menu: always close editor, even sticky ones
        function closeEditorHandler(accessor, forceCloseStickyEditors, resourceOrContext, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const editorService = accessor.get(editorService_1.IEditorService);
            let keepStickyEditors = undefined;
            if (forceCloseStickyEditors) {
                keepStickyEditors = false; // explicitly close sticky editors
            }
            else if (resourceOrContext || context) {
                keepStickyEditors = false; // we have a context, as such this command was used e.g. from the tab context menu
            }
            else {
                keepStickyEditors = editorGroupsService.partOptions.preventPinnedEditorClose === 'keyboard' || editorGroupsService.partOptions.preventPinnedEditorClose === 'keyboardAndMouse'; // respect setting otherwise
            }
            // Skip over sticky editor and select next if we are configured to do so
            if (keepStickyEditors) {
                const activeGroup = editorGroupsService.activeGroup;
                const activeEditor = activeGroup.activeEditor;
                if (activeEditor && activeGroup.isSticky(activeEditor)) {
                    // Open next recently active in same group
                    const nextNonStickyEditorInGroup = activeGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true })[0];
                    if (nextNonStickyEditorInGroup) {
                        return activeGroup.openEditor(nextNonStickyEditorInGroup);
                    }
                    // Open next recently active across all groups
                    const nextNonStickyEditorInAllGroups = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true })[0];
                    if (nextNonStickyEditorInAllGroups) {
                        return Promise.resolve(editorGroupsService.getGroup(nextNonStickyEditorInAllGroups.groupId)?.openEditor(nextNonStickyEditorInAllGroups.editor));
                    }
                }
            }
            // With context: proceed to close editors as instructed
            const { editors, groups } = getEditorsContext(accessor, resourceOrContext, context);
            return Promise.all(groups.map(async (group) => {
                if (group) {
                    const editorsToClose = (0, arrays_1.coalesce)(editors
                        .filter(editor => editor.groupId === group.id)
                        .map(editor => typeof editor.editorIndex === 'number' ? group.getEditorByIndex(editor.editorIndex) : group.activeEditor))
                        .filter(editor => !keepStickyEditors || !group.isSticky(editor));
                    await group.closeEditors(editorsToClose, { preserveFocus: context?.preserveFocus });
                }
            }));
        }
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */] },
            handler: (accessor, resourceOrContext, context) => {
                return closeEditorHandler(accessor, false, resourceOrContext, context);
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.CLOSE_PINNED_EDITOR_COMMAND_ID, (accessor, resourceOrContext, context) => {
            return closeEditorHandler(accessor, true /* force close pinned editors */, resourceOrContext, context);
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 53 /* KeyCode.KeyW */),
            handler: (accessor, resourceOrContext, context) => {
                return Promise.all(getEditorsContext(accessor, resourceOrContext, context).groups.map(async (group) => {
                    if (group) {
                        await group.closeAllEditors({ excludeSticky: true });
                        return;
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITOR_GROUP_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ActiveEditorGroupEmptyContext, contextkeys_1.MultipleEditorGroupsContext),
            primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */] },
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const commandsContext = getCommandsContext(resourceOrContext, context);
                let group;
                if (commandsContext && typeof commandsContext.groupId === 'number') {
                    group = editorGroupService.getGroup(commandsContext.groupId);
                }
                else {
                    group = editorGroupService.activeGroup;
                }
                if (group) {
                    editorGroupService.removeGroup(group);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_SAVED_EDITORS_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 51 /* KeyCode.KeyU */),
            handler: (accessor, resourceOrContext, context) => {
                return Promise.all(getEditorsContext(accessor, resourceOrContext, context).groups.map(async (group) => {
                    if (group) {
                        await group.closeEditors({ savedOnly: true, excludeSticky: true }, { preserveFocus: context?.preserveFocus });
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 50 /* KeyCode.KeyT */ },
            handler: (accessor, resourceOrContext, context) => {
                const { editors, groups } = getEditorsContext(accessor, resourceOrContext, context);
                return Promise.all(groups.map(async (group) => {
                    if (group) {
                        const editorsToKeep = editors
                            .filter(editor => editor.groupId === group.id)
                            .map(editor => typeof editor.editorIndex === 'number' ? group.getEditorByIndex(editor.editorIndex) : group.activeEditor);
                        const editorsToClose = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).filter(editor => !editorsToKeep.includes(editor));
                        for (const editorToKeep of editorsToKeep) {
                            if (editorToKeep) {
                                group.pinEditor(editorToKeep);
                            }
                        }
                        await group.closeEditors(editorsToClose, { preserveFocus: context?.preserveFocus });
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    if (group.activeEditor) {
                        group.pinEditor(group.activeEditor);
                    }
                    await group.closeEditors({ direction: 1 /* CloseDirection.RIGHT */, except: editor, excludeSticky: true }, { preserveFocus: context?.preserveFocus });
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.REOPEN_WITH_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const editorService = accessor.get(editorService_1.IEditorService);
                const editorResolverService = accessor.get(editorResolverService_1.IEditorResolverService);
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (!editor) {
                    return;
                }
                const untypedEditor = editor.toUntyped();
                // Resolver can only resolve untyped editors
                if (!untypedEditor) {
                    return;
                }
                untypedEditor.options = { ...editorService.activeEditorPane?.options, override: editor_1.EditorResolution.PICK };
                const resolvedEditor = await editorResolverService.resolveEditor(untypedEditor, group);
                if (!(0, editor_2.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                    return;
                }
                // Replace editor with resolved one
                await resolvedEditor.group.replaceEditors([
                    {
                        editor: editor,
                        replacement: resolvedEditor.editor,
                        forceReplaceDirty: editor.resource?.scheme === network_1.Schemas.untitled,
                        options: resolvedEditor.options
                    }
                ]);
                telemetryService.publicLog2('workbenchEditorReopen', {
                    scheme: editor.resource?.scheme ?? '',
                    ext: editor.resource ? (0, resources_1.extname)(editor.resource) : '',
                    from: editor.editorId ?? '',
                    to: resolvedEditor.editor.editorId ?? ''
                });
                // Make sure it becomes active too
                await resolvedEditor.group.openEditor(resolvedEditor.editor);
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID, async (accessor, resourceOrContext, context) => {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            if (group) {
                await group.closeAllEditors();
                if (group.count === 0 && editorGroupService.getGroup(group.id) /* could be gone by now */) {
                    editorGroupService.removeGroup(group); // only remove group if it is now empty
                }
            }
        });
    }
    function registerFocusEditorGroupWihoutWrapCommands() {
        const commands = [
            {
                id: exports.FOCUS_LEFT_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 2 /* GroupDirection.LEFT */
            },
            {
                id: exports.FOCUS_RIGHT_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 3 /* GroupDirection.RIGHT */
            },
            {
                id: exports.FOCUS_ABOVE_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 0 /* GroupDirection.UP */,
            },
            {
                id: exports.FOCUS_BELOW_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 1 /* GroupDirection.DOWN */
            }
        ];
        for (const command of commands) {
            commands_1.CommandsRegistry.registerCommand(command.id, async (accessor) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const group = editorGroupService.findGroup({ direction: command.direction }, editorGroupService.activeGroup, false);
                group?.focus();
            });
        }
    }
    function registerSplitEditorInGroupCommands() {
        async function splitEditorInGroup(accessor, resourceOrContext, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            if (!editor) {
                return;
            }
            await group.replaceEditors([{
                    editor,
                    replacement: instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, undefined, undefined, editor, editor),
                    forceReplaceDirty: true
                }]);
        }
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.SPLIT_EDITOR_IN_GROUP,
                    title: (0, nls_1.localize2)('splitEditorInGroup', 'Split Editor in Group'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkeys_1.ActiveEditorCanSplitInGroupContext,
                    f1: true,
                    keybinding: {
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkeys_1.ActiveEditorCanSplitInGroupContext,
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 93 /* KeyCode.Backslash */)
                    }
                });
            }
            run(accessor, resourceOrContext, context) {
                return splitEditorInGroup(accessor, resourceOrContext, context);
            }
        });
        async function joinEditorInGroup(accessor, resourceOrContext, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            if (!(editor instanceof sideBySideEditorInput_1.SideBySideEditorInput)) {
                return;
            }
            let options = undefined;
            const activeEditorPane = group.activeEditorPane;
            if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor && group.activeEditor === editor) {
                for (const pane of [activeEditorPane.getPrimaryEditorPane(), activeEditorPane.getSecondaryEditorPane()]) {
                    if (pane?.hasFocus()) {
                        options = { viewState: pane.getViewState() };
                        break;
                    }
                }
            }
            await group.replaceEditors([{
                    editor,
                    replacement: editor.primary,
                    options
                }]);
        }
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.JOIN_EDITOR_IN_GROUP,
                    title: (0, nls_1.localize2)('joinEditorInGroup', 'Join Editor in Group'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkeys_1.SideBySideEditorActiveContext,
                    f1: true,
                    keybinding: {
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkeys_1.SideBySideEditorActiveContext,
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 93 /* KeyCode.Backslash */)
                    }
                });
            }
            run(accessor, resourceOrContext, context) {
                return joinEditorInGroup(accessor, resourceOrContext, context);
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.TOGGLE_SPLIT_EDITOR_IN_GROUP,
                    title: (0, nls_1.localize2)('toggleJoinEditorInGroup', 'Toggle Split Editor in Group'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorCanSplitInGroupContext, contextkeys_1.SideBySideEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                    await joinEditorInGroup(accessor, resourceOrContext, context);
                }
                else if (editor) {
                    await splitEditorInGroup(accessor, resourceOrContext, context);
                }
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT,
                    title: (0, nls_1.localize2)('toggleSplitEditorInGroupLayout', 'Toggle Layout of Split Editor in Group'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkeys_1.SideBySideEditorActiveContext,
                    f1: true
                });
            }
            async run(accessor) {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const currentSetting = configurationService.getValue(sideBySideEditor_1.SideBySideEditor.SIDE_BY_SIDE_LAYOUT_SETTING);
                let newSetting;
                if (currentSetting !== 'horizontal') {
                    newSetting = 'horizontal';
                }
                else {
                    newSetting = 'vertical';
                }
                return configurationService.updateValue(sideBySideEditor_1.SideBySideEditor.SIDE_BY_SIDE_LAYOUT_SETTING, newSetting);
            }
        });
    }
    function registerFocusSideEditorsCommands() {
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.FOCUS_FIRST_SIDE_EDITOR,
                    title: (0, nls_1.localize2)('focusLeftSideEditor', 'Focus First Side in Active Editor'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor) {
                const editorService = accessor.get(editorService_1.IEditorService);
                const commandService = accessor.get(commands_1.ICommandService);
                const activeEditorPane = editorService.activeEditorPane;
                if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor) {
                    activeEditorPane.getSecondaryEditorPane()?.focus();
                }
                else if (activeEditorPane instanceof textDiffEditor_1.TextDiffEditor) {
                    await commandService.executeCommand(diffEditorCommands_1.DIFF_FOCUS_SECONDARY_SIDE);
                }
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.FOCUS_SECOND_SIDE_EDITOR,
                    title: (0, nls_1.localize2)('focusRightSideEditor', 'Focus Second Side in Active Editor'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor) {
                const editorService = accessor.get(editorService_1.IEditorService);
                const commandService = accessor.get(commands_1.ICommandService);
                const activeEditorPane = editorService.activeEditorPane;
                if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor) {
                    activeEditorPane.getPrimaryEditorPane()?.focus();
                }
                else if (activeEditorPane instanceof textDiffEditor_1.TextDiffEditor) {
                    await commandService.executeCommand(diffEditorCommands_1.DIFF_FOCUS_PRIMARY_SIDE);
                }
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.FOCUS_OTHER_SIDE_EDITOR,
                    title: (0, nls_1.localize2)('focusOtherSideEditor', 'Focus Other Side in Active Editor'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor) {
                const editorService = accessor.get(editorService_1.IEditorService);
                const commandService = accessor.get(commands_1.ICommandService);
                const activeEditorPane = editorService.activeEditorPane;
                if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor) {
                    if (activeEditorPane.getPrimaryEditorPane()?.hasFocus()) {
                        activeEditorPane.getSecondaryEditorPane()?.focus();
                    }
                    else {
                        activeEditorPane.getPrimaryEditorPane()?.focus();
                    }
                }
                else if (activeEditorPane instanceof textDiffEditor_1.TextDiffEditor) {
                    await commandService.executeCommand(diffEditorCommands_1.DIFF_FOCUS_OTHER_SIDE);
                }
            }
        });
    }
    function registerOtherEditorCommands() {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.KEEP_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 3 /* KeyCode.Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.pinEditor(editor);
                }
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: exports.TOGGLE_KEEP_EDITORS_COMMAND_ID,
            handler: accessor => {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const currentSetting = configurationService.getValue('workbench.editor.enablePreview');
                const newSetting = currentSetting === true ? false : true;
                configurationService.updateValue('workbench.editor.enablePreview', newSetting);
            }
        });
        function setEditorGroupLock(accessor, resourceOrContext, context, locked) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            group?.lock(locked ?? !group.isLocked);
        }
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.TOGGLE_LOCK_GROUP_COMMAND_ID,
                    title: (0, nls_1.localize2)('toggleEditorGroupLock', 'Toggle Editor Group Lock'),
                    category: actionCommonCategories_1.Categories.View,
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                setEditorGroupLock(accessor, resourceOrContext, context);
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.LOCK_GROUP_COMMAND_ID,
                    title: (0, nls_1.localize2)('lockEditorGroup', 'Lock Editor Group'),
                    category: actionCommonCategories_1.Categories.View,
                    precondition: contextkeys_1.ActiveEditorGroupLockedContext.toNegated(),
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                setEditorGroupLock(accessor, resourceOrContext, context, true);
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.UNLOCK_GROUP_COMMAND_ID,
                    title: (0, nls_1.localize2)('unlockEditorGroup', 'Unlock Editor Group'),
                    precondition: contextkeys_1.ActiveEditorGroupLockedContext,
                    category: actionCommonCategories_1.Categories.View,
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                setEditorGroupLock(accessor, resourceOrContext, context, false);
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.PIN_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.ActiveEditorStickyContext.toNegated(),
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.stickEditor(editor);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: diffEditorCommands_1.DIFF_OPEN_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: editorContextKeys_1.EditorContextKeys.inDiffEditor,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 1024 /* KeyMod.Shift */ | 45 /* KeyCode.KeyO */),
            handler: async (accessor) => {
                const editorService = accessor.get(editorService_1.IEditorService);
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const activeEditor = editorService.activeEditor;
                const activeTextEditorControl = editorService.activeTextEditorControl;
                if (!(0, editorBrowser_1.isDiffEditor)(activeTextEditorControl) || !(activeEditor instanceof diffEditorInput_1.DiffEditorInput)) {
                    return;
                }
                let editor;
                const originalEditor = activeTextEditorControl.getOriginalEditor();
                if (originalEditor.hasTextFocus()) {
                    editor = activeEditor.original;
                }
                else {
                    editor = activeEditor.modified;
                }
                return editorGroupService.activeGroup.openEditor(editor);
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.UNPIN_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.ActiveEditorStickyContext,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.unstickEditor(editor);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.SHOW_EDITORS_IN_GROUP,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const commandsContext = getCommandsContext(resourceOrContext, context);
                if (commandsContext && typeof commandsContext.groupId === 'number') {
                    const group = editorGroupService.getGroup(commandsContext.groupId);
                    if (group) {
                        editorGroupService.activateGroup(group); // we need the group to be active
                    }
                }
                return quickInputService.quickAccess.show(editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX);
            }
        });
    }
    function getEditorsContext(accessor, resourceOrContext, context) {
        const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const listService = accessor.get(listService_1.IListService);
        const editorContext = getMultiSelectedEditorContexts(getCommandsContext(resourceOrContext, context), listService, editorGroupService);
        const activeGroup = editorGroupService.activeGroup;
        if (editorContext.length === 0 && activeGroup.activeEditor) {
            // add the active editor as fallback
            editorContext.push({
                groupId: activeGroup.id,
                editorIndex: activeGroup.getIndexOfEditor(activeGroup.activeEditor)
            });
        }
        return {
            editors: editorContext,
            groups: (0, arrays_1.distinct)(editorContext.map(context => context.groupId)).map(groupId => editorGroupService.getGroup(groupId))
        };
    }
    function getCommandsContext(resourceOrContext, context) {
        if (uri_1.URI.isUri(resourceOrContext)) {
            return context;
        }
        if (resourceOrContext && typeof resourceOrContext.groupId === 'number') {
            return resourceOrContext;
        }
        if (context && typeof context.groupId === 'number') {
            return context;
        }
        return undefined;
    }
    function resolveCommandsContext(editorGroupService, context) {
        // Resolve from context
        let group = context && typeof context.groupId === 'number' ? editorGroupService.getGroup(context.groupId) : undefined;
        let editor = group && context && typeof context.editorIndex === 'number' ? group.getEditorByIndex(context.editorIndex) ?? undefined : undefined;
        // Fallback to active group as needed
        if (!group) {
            group = editorGroupService.activeGroup;
        }
        // Fallback to active editor as needed
        if (!editor) {
            editor = group.activeEditor ?? undefined;
        }
        return { group, editor };
    }
    function getMultiSelectedEditorContexts(editorContext, listService, editorGroupService) {
        // First check for a focused list to return the selected items from
        const list = listService.lastFocusedList;
        if (list instanceof listWidget_1.List && list.getHTMLElement() === (0, dom_1.getActiveElement)()) {
            const elementToContext = (element) => {
                if ((0, editorGroupsService_1.isEditorGroup)(element)) {
                    return { groupId: element.id, editorIndex: undefined };
                }
                const group = editorGroupService.getGroup(element.groupId);
                return { groupId: element.groupId, editorIndex: group ? group.getIndexOfEditor(element.editor) : -1 };
            };
            const onlyEditorGroupAndEditor = (e) => (0, editorGroupsService_1.isEditorGroup)(e) || (0, editor_2.isEditorIdentifier)(e);
            const focusedElements = list.getFocusedElements().filter(onlyEditorGroupAndEditor);
            const focus = editorContext ? editorContext : focusedElements.length ? focusedElements.map(elementToContext)[0] : undefined; // need to take into account when editor context is { group: group }
            if (focus) {
                const selection = list.getSelectedElements().filter(onlyEditorGroupAndEditor);
                if (selection.length > 1) {
                    return selection.map(elementToContext);
                }
                return [focus];
            }
        }
        // Otherwise go with passed in context
        return !!editorContext ? [editorContext] : [];
    }
    function setup() {
        registerActiveEditorMoveCopyCommand();
        registerEditorGroupsLayoutCommands();
        (0, diffEditorCommands_1.registerDiffEditorCommands)();
        registerOpenEditorAPICommands();
        registerOpenEditorAtIndexCommands();
        registerCloseEditorCommands();
        registerOtherEditorCommands();
        registerSplitEditorInGroupCommands();
        registerFocusSideEditorsCommands();
        registerFocusEditorGroupAtIndexCommands();
        registerSplitEditorCommands();
        registerFocusEditorGroupWihoutWrapCommands();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQ29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErb0JoRyxrQ0E4QkM7SUF5cUJELGdEQWNDO0lBRUQsd0RBaUJDO0lBRUQsd0VBaUNDO0lBRUQsc0JBYUM7SUEvM0NZLFFBQUEsOEJBQThCLEdBQUcseUNBQXlDLENBQUM7SUFDM0UsUUFBQSxpQ0FBaUMsR0FBRyxzQ0FBc0MsQ0FBQztJQUMzRSxRQUFBLGtDQUFrQyxHQUFHLHVDQUF1QyxDQUFDO0lBQzdFLFFBQUEscUNBQXFDLEdBQUcseUNBQXlDLENBQUM7SUFDbEYsUUFBQSx1QkFBdUIsR0FBRyxvQ0FBb0MsQ0FBQztJQUMvRCxRQUFBLDhCQUE4QixHQUFHLDBDQUEwQyxDQUFDO0lBQzVFLFFBQUEsNkJBQTZCLEdBQUcsNkJBQTZCLENBQUM7SUFDOUQsUUFBQSx1Q0FBdUMsR0FBRyxvQ0FBb0MsQ0FBQztJQUUvRSxRQUFBLDZCQUE2QixHQUFHLGtCQUFrQixDQUFDO0lBQ25ELFFBQUEsNkJBQTZCLEdBQUcsa0JBQWtCLENBQUM7SUFDbkQsUUFBQSwrQkFBK0IsR0FBRyxvQkFBb0IsQ0FBQztJQUN2RCxRQUFBLHNCQUFzQixHQUFHLDZCQUE2QixDQUFDO0lBQ3ZELFFBQUEsOEJBQThCLEdBQUcsb0NBQW9DLENBQUM7SUFDdEUsUUFBQSw0QkFBNEIsR0FBRyx3Q0FBd0MsQ0FBQztJQUN4RSxRQUFBLHFCQUFxQixHQUFHLGtDQUFrQyxDQUFDO0lBQzNELFFBQUEsdUJBQXVCLEdBQUcsb0NBQW9DLENBQUM7SUFDL0QsUUFBQSxxQkFBcUIsR0FBRyxxQ0FBcUMsQ0FBQztJQUM5RCxRQUFBLHNCQUFzQixHQUFH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