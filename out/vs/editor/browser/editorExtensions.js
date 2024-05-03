/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/base/common/types", "vs/platform/log/common/log", "vs/base/browser/dom"], function (require, exports, nls, uri_1, codeEditorService_1, position_1, model_1, resolverService_1, actions_1, commands_1, contextkey_1, instantiation_1, keybindingsRegistry_1, platform_1, telemetry_1, types_1, log_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectAllCommand = exports.RedoCommand = exports.UndoCommand = exports.EditorExtensionsRegistry = exports.EditorAction2 = exports.MultiEditorAction = exports.EditorAction = exports.EditorCommand = exports.ProxyCommand = exports.MultiCommand = exports.Command = exports.EditorContributionInstantiation = void 0;
    exports.registerModelAndPositionCommand = registerModelAndPositionCommand;
    exports.registerEditorCommand = registerEditorCommand;
    exports.registerEditorAction = registerEditorAction;
    exports.registerMultiEditorAction = registerMultiEditorAction;
    exports.registerInstantiatedEditorAction = registerInstantiatedEditorAction;
    exports.registerEditorContribution = registerEditorContribution;
    exports.registerDiffEditorContribution = registerDiffEditorContribution;
    var EditorContributionInstantiation;
    (function (EditorContributionInstantiation) {
        /**
         * The contribution is created eagerly when the {@linkcode ICodeEditor} is instantiated.
         * Only Eager contributions can participate in saving or restoring of view state.
         */
        EditorContributionInstantiation[EditorContributionInstantiation["Eager"] = 0] = "Eager";
        /**
         * The contribution is created at the latest 50ms after the first render after attaching a text model.
         * If the contribution is explicitly requested via `getContribution`, it will be instantiated sooner.
         * If there is idle time available, it will be instantiated sooner.
         */
        EditorContributionInstantiation[EditorContributionInstantiation["AfterFirstRender"] = 1] = "AfterFirstRender";
        /**
         * The contribution is created before the editor emits events produced by user interaction (mouse events, keyboard events).
         * If the contribution is explicitly requested via `getContribution`, it will be instantiated sooner.
         * If there is idle time available, it will be instantiated sooner.
         */
        EditorContributionInstantiation[EditorContributionInstantiation["BeforeFirstInteraction"] = 2] = "BeforeFirstInteraction";
        /**
         * The contribution is created when there is idle time available, at the latest 5000ms after the editor creation.
         * If the contribution is explicitly requested via `getContribution`, it will be instantiated sooner.
         */
        EditorContributionInstantiation[EditorContributionInstantiation["Eventually"] = 3] = "Eventually";
        /**
         * The contribution is created only when explicitly requested via `getContribution`.
         */
        EditorContributionInstantiation[EditorContributionInstantiation["Lazy"] = 4] = "Lazy";
    })(EditorContributionInstantiation || (exports.EditorContributionInstantiation = EditorContributionInstantiation = {}));
    class Command {
        constructor(opts) {
            this.id = opts.id;
            this.precondition = opts.precondition;
            this._kbOpts = opts.kbOpts;
            this._menuOpts = opts.menuOpts;
            this.metadata = opts.metadata;
        }
        register() {
            if (Array.isArray(this._menuOpts)) {
                this._menuOpts.forEach(this._registerMenuItem, this);
            }
            else if (this._menuOpts) {
                this._registerMenuItem(this._menuOpts);
            }
            if (this._kbOpts) {
                const kbOptsArr = Array.isArray(this._kbOpts) ? this._kbOpts : [this._kbOpts];
                for (const kbOpts of kbOptsArr) {
                    let kbWhen = kbOpts.kbExpr;
                    if (this.precondition) {
                        if (kbWhen) {
                            kbWhen = contextkey_1.ContextKeyExpr.and(kbWhen, this.precondition);
                        }
                        else {
                            kbWhen = this.precondition;
                        }
                    }
                    const desc = {
                        id: this.id,
                        weight: kbOpts.weight,
                        args: kbOpts.args,
                        when: kbWhen,
                        primary: kbOpts.primary,
                        secondary: kbOpts.secondary,
                        win: kbOpts.win,
                        linux: kbOpts.linux,
                        mac: kbOpts.mac,
                    };
                    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule(desc);
                }
            }
            commands_1.CommandsRegistry.registerCommand({
                id: this.id,
                handler: (accessor, args) => this.runCommand(accessor, args),
                metadata: this.metadata
            });
        }
        _registerMenuItem(item) {
            actions_1.MenuRegistry.appendMenuItem(item.menuId, {
                group: item.group,
                command: {
                    id: this.id,
                    title: item.title,
                    icon: item.icon,
                    precondition: this.precondition
                },
                when: item.when,
                order: item.order
            });
        }
    }
    exports.Command = Command;
    class MultiCommand extends Command {
        constructor() {
            super(...arguments);
            this._implementations = [];
        }
        /**
         * A higher priority gets to be looked at first
         */
        addImplementation(priority, name, implementation, when) {
            this._implementations.push({ priority, name, implementation, when });
            this._implementations.sort((a, b) => b.priority - a.priority);
            return {
                dispose: () => {
                    for (let i = 0; i < this._implementations.length; i++) {
                        if (this._implementations[i].implementation === implementation) {
                            this._implementations.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        runCommand(accessor, args) {
            const logService = accessor.get(log_1.ILogService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            logService.trace(`Executing Command '${this.id}' which has ${this._implementations.length} bound.`);
            for (const impl of this._implementations) {
                if (impl.when) {
                    const context = contextKeyService.getContext((0, dom_1.getActiveElement)());
                    const value = impl.when.evaluate(context);
                    if (!value) {
                        continue;
                    }
                }
                const result = impl.implementation(accessor, args);
                if (result) {
                    logService.trace(`Command '${this.id}' was handled by '${impl.name}'.`);
                    if (typeof result === 'boolean') {
                        return;
                    }
                    return result;
                }
            }
            logService.trace(`The Command '${this.id}' was not handled by any implementation.`);
        }
    }
    exports.MultiCommand = MultiCommand;
    //#endregion
    /**
     * A command that delegates to another command's implementation.
     *
     * This lets different commands be registered but share the same implementation
     */
    class ProxyCommand extends Command {
        constructor(command, opts) {
            super(opts);
            this.command = command;
        }
        runCommand(accessor, args) {
            return this.command.runCommand(accessor, args);
        }
    }
    exports.ProxyCommand = ProxyCommand;
    class EditorCommand extends Command {
        /**
         * Create a command class that is bound to a certain editor contribution.
         */
        static bindToContribution(controllerGetter) {
            return class EditorControllerCommandImpl extends EditorCommand {
                constructor(opts) {
                    super(opts);
                    this._callback = opts.handler;
                }
                runEditorCommand(accessor, editor, args) {
                    const controller = controllerGetter(editor);
                    if (controller) {
                        this._callback(controller, args);
                    }
                }
            };
        }
        static runEditorCommand(accessor, args, precondition, runner) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            // Find the editor with text focus or active
            const editor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
            if (!editor) {
                // well, at least we tried...
                return;
            }
            return editor.invokeWithinContext((editorAccessor) => {
                const kbService = editorAccessor.get(contextkey_1.IContextKeyService);
                if (!kbService.contextMatchesRules(precondition ?? undefined)) {
                    // precondition does not hold
                    return;
                }
                return runner(editorAccessor, editor, args);
            });
        }
        runCommand(accessor, args) {
            return EditorCommand.runEditorCommand(accessor, args, this.precondition, (accessor, editor, args) => this.runEditorCommand(accessor, editor, args));
        }
    }
    exports.EditorCommand = EditorCommand;
    class EditorAction extends EditorCommand {
        static convertOptions(opts) {
            let menuOpts;
            if (Array.isArray(opts.menuOpts)) {
                menuOpts = opts.menuOpts;
            }
            else if (opts.menuOpts) {
                menuOpts = [opts.menuOpts];
            }
            else {
                menuOpts = [];
            }
            function withDefaults(item) {
                if (!item.menuId) {
                    item.menuId = actions_1.MenuId.EditorContext;
                }
                if (!item.title) {
                    item.title = opts.label;
                }
                item.when = contextkey_1.ContextKeyExpr.and(opts.precondition, item.when);
                return item;
            }
            if (Array.isArray(opts.contextMenuOpts)) {
                menuOpts.push(...opts.contextMenuOpts.map(withDefaults));
            }
            else if (opts.contextMenuOpts) {
                menuOpts.push(withDefaults(opts.contextMenuOpts));
            }
            opts.menuOpts = menuOpts;
            return opts;
        }
        constructor(opts) {
            super(EditorAction.convertOptions(opts));
            this.label = opts.label;
            this.alias = opts.alias;
        }
        runEditorCommand(accessor, editor, args) {
            this.reportTelemetry(accessor, editor);
            return this.run(accessor, editor, args || {});
        }
        reportTelemetry(accessor, editor) {
            accessor.get(telemetry_1.ITelemetryService).publicLog2('editorActionInvoked', { name: this.label, id: this.id });
        }
    }
    exports.EditorAction = EditorAction;
    class MultiEditorAction extends EditorAction {
        constructor() {
            super(...arguments);
            this._implementations = [];
        }
        /**
         * A higher priority gets to be looked at first
         */
        addImplementation(priority, implementation) {
            this._implementations.push([priority, implementation]);
            this._implementations.sort((a, b) => b[0] - a[0]);
            return {
                dispose: () => {
                    for (let i = 0; i < this._implementations.length; i++) {
                        if (this._implementations[i][1] === implementation) {
                            this._implementations.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        run(accessor, editor, args) {
            for (const impl of this._implementations) {
                const result = impl[1](accessor, editor, args);
                if (result) {
                    if (typeof result === 'boolean') {
                        return;
                    }
                    return result;
                }
            }
        }
    }
    exports.MultiEditorAction = MultiEditorAction;
    //#endregion EditorAction
    //#region EditorAction2
    class EditorAction2 extends actions_1.Action2 {
        run(accessor, ...args) {
            // Find the editor with text focus or active
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const editor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
            if (!editor) {
                // well, at least we tried...
                return;
            }
            // precondition does hold
            return editor.invokeWithinContext((editorAccessor) => {
                const kbService = editorAccessor.get(contextkey_1.IContextKeyService);
                const logService = editorAccessor.get(log_1.ILogService);
                const enabled = kbService.contextMatchesRules(this.desc.precondition ?? undefined);
                if (!enabled) {
                    logService.debug(`[EditorAction2] NOT running command because its precondition is FALSE`, this.desc.id, this.desc.precondition?.serialize());
                    return;
                }
                return this.runEditorCommand(editorAccessor, editor, ...args);
            });
        }
    }
    exports.EditorAction2 = EditorAction2;
    //#endregion
    // --- Registration of commands and actions
    function registerModelAndPositionCommand(id, handler) {
        commands_1.CommandsRegistry.registerCommand(id, function (accessor, ...args) {
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const [resource, position] = args;
            (0, types_1.assertType)(uri_1.URI.isUri(resource));
            (0, types_1.assertType)(position_1.Position.isIPosition(position));
            const model = accessor.get(model_1.IModelService).getModel(resource);
            if (model) {
                const editorPosition = position_1.Position.lift(position);
                return instaService.invokeFunction(handler, model, editorPosition, ...args.slice(2));
            }
            return accessor.get(resolverService_1.ITextModelService).createModelReference(resource).then(reference => {
                return new Promise((resolve, reject) => {
                    try {
                        const result = instaService.invokeFunction(handler, reference.object.textEditorModel, position_1.Position.lift(position), args.slice(2));
                        resolve(result);
                    }
                    catch (err) {
                        reject(err);
                    }
                }).finally(() => {
                    reference.dispose();
                });
            });
        });
    }
    function registerEditorCommand(editorCommand) {
        EditorContributionRegistry.INSTANCE.registerEditorCommand(editorCommand);
        return editorCommand;
    }
    function registerEditorAction(ctor) {
        const action = new ctor();
        EditorContributionRegistry.INSTANCE.registerEditorAction(action);
        return action;
    }
    function registerMultiEditorAction(action) {
        EditorContributionRegistry.INSTANCE.registerEditorAction(action);
        return action;
    }
    function registerInstantiatedEditorAction(editorAction) {
        EditorContributionRegistry.INSTANCE.registerEditorAction(editorAction);
    }
    /**
     * Registers an editor contribution. Editor contributions have a lifecycle which is bound
     * to a specific code editor instance.
     */
    function registerEditorContribution(id, ctor, instantiation) {
        EditorContributionRegistry.INSTANCE.registerEditorContribution(id, ctor, instantiation);
    }
    /**
     * Registers a diff editor contribution. Diff editor contributions have a lifecycle which
     * is bound to a specific diff editor instance.
     */
    function registerDiffEditorContribution(id, ctor) {
        EditorContributionRegistry.INSTANCE.registerDiffEditorContribution(id, ctor);
    }
    var EditorExtensionsRegistry;
    (function (EditorExtensionsRegistry) {
        function getEditorCommand(commandId) {
            return EditorContributionRegistry.INSTANCE.getEditorCommand(commandId);
        }
        EditorExtensionsRegistry.getEditorCommand = getEditorCommand;
        function getEditorActions() {
            return EditorContributionRegistry.INSTANCE.getEditorActions();
        }
        EditorExtensionsRegistry.getEditorActions = getEditorActions;
        function getEditorContributions() {
            return EditorContributionRegistry.INSTANCE.getEditorContributions();
        }
        EditorExtensionsRegistry.getEditorContributions = getEditorContributions;
        function getSomeEditorContributions(ids) {
            return EditorContributionRegistry.INSTANCE.getEditorContributions().filter(c => ids.indexOf(c.id) >= 0);
        }
        EditorExtensionsRegistry.getSomeEditorContributions = getSomeEditorContributions;
        function getDiffEditorContributions() {
            return EditorContributionRegistry.INSTANCE.getDiffEditorContributions();
        }
        EditorExtensionsRegistry.getDiffEditorContributions = getDiffEditorContributions;
    })(EditorExtensionsRegistry || (exports.EditorExtensionsRegistry = EditorExtensionsRegistry = {}));
    // Editor extension points
    const Extensions = {
        EditorCommonContributions: 'editor.contributions'
    };
    class EditorContributionRegistry {
        static { this.INSTANCE = new EditorContributionRegistry(); }
        constructor() {
            this.editorContributions = [];
            this.diffEditorContributions = [];
            this.editorActions = [];
            this.editorCommands = Object.create(null);
        }
        registerEditorContribution(id, ctor, instantiation) {
            this.editorContributions.push({ id, ctor: ctor, instantiation });
        }
        getEditorContributions() {
            return this.editorContributions.slice(0);
        }
        registerDiffEditorContribution(id, ctor) {
            this.diffEditorContributions.push({ id, ctor: ctor });
        }
        getDiffEditorContributions() {
            return this.diffEditorContributions.slice(0);
        }
        registerEditorAction(action) {
            action.register();
            this.editorActions.push(action);
        }
        getEditorActions() {
            return this.editorActions;
        }
        registerEditorCommand(editorCommand) {
            editorCommand.register();
            this.editorCommands[editorCommand.id] = editorCommand;
        }
        getEditorCommand(commandId) {
            return (this.editorCommands[commandId] || null);
        }
    }
    platform_1.Registry.add(Extensions.EditorCommonContributions, EditorContributionRegistry.INSTANCE);
    function registerCommand(command) {
        command.register();
        return command;
    }
    exports.UndoCommand = registerCommand(new MultiCommand({
        id: 'undo',
        precondition: undefined,
        kbOpts: {
            weight: 0 /* KeybindingWeight.EditorCore */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 56 /* KeyCode.KeyZ */
        },
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '1_do',
                title: nls.localize({ key: 'miUndo', comment: ['&& denotes a mnemonic'] }, "&&Undo"),
                order: 1
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('undo', "Undo"),
                order: 1
            }]
    }));
    registerCommand(new ProxyCommand(exports.UndoCommand, { id: 'default:undo', precondition: undefined }));
    exports.RedoCommand = registerCommand(new MultiCommand({
        id: 'redo',
        precondition: undefined,
        kbOpts: {
            weight: 0 /* KeybindingWeight.EditorCore */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 56 /* KeyCode.KeyZ */],
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 56 /* KeyCode.KeyZ */ }
        },
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '1_do',
                title: nls.localize({ key: 'miRedo', comment: ['&& denotes a mnemonic'] }, "&&Redo"),
                order: 2
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('redo', "Redo"),
                order: 1
            }]
    }));
    registerCommand(new ProxyCommand(exports.RedoCommand, { id: 'default:redo', precondition: undefined }));
    exports.SelectAllCommand = registerCommand(new MultiCommand({
        id: 'editor.action.selectAll',
        precondition: undefined,
        kbOpts: {
            weight: 0 /* KeybindingWeight.EditorCore */,
            kbExpr: null,
            primary: 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */
        },
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarSelectionMenu,
                group: '1_basic',
                title: nls.localize({ key: 'miSelectAll', comment: ['&& denotes a mnemonic'] }, "&&Select All"),
                order: 1
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('selectAll', "Select All"),
                order: 1
            }]
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvZWRpdG9yRXh0ZW5zaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE2ZGhHLDBFQTRCQztJQUVELHNEQUdDO0lBRUQsb0RBSUM7SUFFRCw4REFHQztJQUVELDRFQUVDO0lBTUQsZ0VBRUM7SUFNRCx3RUFFQztJQWhnQkQsSUFBa0IsK0JBK0JqQjtJQS9CRCxXQUFrQiwrQkFBK0I7UUFDaEQ7OztXQUdHO1FBQ0gsdUZBQUssQ0FBQTtRQUVMOzs7O1dBSUc7UUFDSCw2R0FBZ0IsQ0FBQTtRQUVoQjs7OztXQUlHO1FBQ0gseUhBQXNCLENBQUE7UUFFdEI7OztXQUdHO1FBQ0gsaUdBQVUsQ0FBQTtRQUVWOztXQUVHO1FBQ0gscUZBQUksQ0FBQTtJQUNMLENBQUMsRUEvQmlCLCtCQUErQiwrQ0FBL0IsK0JBQStCLFFBK0JoRDtJQXNDRCxNQUFzQixPQUFPO1FBTzVCLFlBQVksSUFBcUI7WUFDaEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUN0QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDM0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUMvQixDQUFDO1FBRU0sUUFBUTtZQUVkLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMs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