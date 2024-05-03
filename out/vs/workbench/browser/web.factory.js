/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/browser/web.api", "vs/workbench/browser/web.main", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/base/common/performance", "vs/platform/actions/common/actions", "vs/base/common/async", "vs/base/common/arrays"], function (require, exports, web_api_1, web_main_1, lifecycle_1, commands_1, performance_1, actions_1, async_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.workspace = exports.window = exports.env = exports.logger = exports.commands = void 0;
    exports.create = create;
    let created = false;
    const workbenchPromise = new async_1.DeferredPromise();
    /**
     * Creates the workbench with the provided options in the provided container.
     *
     * @param domElement the container to create the workbench in
     * @param options for setting up the workbench
     */
    function create(domElement, options) {
        // Mark start of workbench
        (0, performance_1.mark)('code/didLoadWorkbenchMain');
        // Assert that the workbench is not created more than once. We currently
        // do not support this and require a full context switch to clean-up.
        if (created) {
            throw new Error('Unable to create the VSCode workbench more than once.');
        }
        else {
            created = true;
        }
        // Register commands if any
        if (Array.isArray(options.commands)) {
            for (const command of options.commands) {
                commands_1.CommandsRegistry.registerCommand(command.id, (accessor, ...args) => {
                    // we currently only pass on the arguments but not the accessor
                    // to the command to reduce our exposure of internal API.
                    return command.handler(...args);
                });
                // Commands with labels appear in the command palette
                if (command.label) {
                    for (const menu of (0, arrays_1.asArray)(command.menu ?? web_api_1.Menu.CommandPalette)) {
                        actions_1.MenuRegistry.appendMenuItem(asMenuId(menu), { command: { id: command.id, title: command.label } });
                    }
                }
            }
        }
        // Startup workbench and resolve waiters
        let instantiatedWorkbench = undefined;
        new web_main_1.BrowserMain(domElement, options).open().then(workbench => {
            instantiatedWorkbench = workbench;
            workbenchPromise.complete(workbench);
        });
        return (0, lifecycle_1.toDisposable)(() => {
            if (instantiatedWorkbench) {
                instantiatedWorkbench.shutdown();
            }
            else {
                workbenchPromise.p.then(instantiatedWorkbench => instantiatedWorkbench.shutdown());
            }
        });
    }
    function asMenuId(menu) {
        switch (menu) {
            case web_api_1.Menu.CommandPalette: return actions_1.MenuId.CommandPalette;
            case web_api_1.Menu.StatusBarWindowIndicatorMenu: return actions_1.MenuId.StatusBarWindowIndicatorMenu;
        }
    }
    var commands;
    (function (commands) {
        /**
         * {@linkcode IWorkbench.commands IWorkbench.commands.executeCommand}
         */
        async function executeCommand(command, ...args) {
            const workbench = await workbenchPromise.p;
            return workbench.commands.executeCommand(command, ...args);
        }
        commands.executeCommand = executeCommand;
    })(commands || (exports.commands = commands = {}));
    var logger;
    (function (logger) {
        /**
         * {@linkcode IWorkbench.logger IWorkbench.logger.log}
         */
        function log(level, message) {
            workbenchPromise.p.then(workbench => workbench.logger.log(level, message));
        }
        logger.log = log;
    })(logger || (exports.logger = logger = {}));
    var env;
    (function (env) {
        /**
         * {@linkcode IWorkbench.env IWorkbench.env.retrievePerformanceMarks}
         */
        async function retrievePerformanceMarks() {
            const workbench = await workbenchPromise.p;
            return workbench.env.retrievePerformanceMarks();
        }
        env.retrievePerformanceMarks = retrievePerformanceMarks;
        /**
         * {@linkcode IWorkbench.env IWorkbench.env.getUriScheme}
         */
        async function getUriScheme() {
            const workbench = await workbenchPromise.p;
            return workbench.env.getUriScheme();
        }
        env.getUriScheme = getUriScheme;
        /**
         * {@linkcode IWorkbench.env IWorkbench.env.openUri}
         */
        async function openUri(target) {
            const workbench = await workbenchPromise.p;
            return workbench.env.openUri(target);
        }
        env.openUri = openUri;
    })(env || (exports.env = env = {}));
    var window;
    (function (window) {
        /**
         * {@linkcode IWorkbench.window IWorkbench.window.withProgress}
         */
        async function withProgress(options, task) {
            const workbench = await workbenchPromise.p;
            return workbench.window.withProgress(options, task);
        }
        window.withProgress = withProgress;
        async function createTerminal(options) {
            const workbench = await workbenchPromise.p;
            workbench.window.createTerminal(options);
        }
        window.createTerminal = createTerminal;
    })(window || (exports.window = window = {}));
    var workspace;
    (function (workspace) {
        /**
         * {@linkcode IWorkbench.workspace IWorkbench.workspace.openTunnel}
         */
        async function openTunnel(tunnelOptions) {
            const workbench = await workbenchPromise.p;
            return workbench.workspace.openTunnel(tunnelOptions);
        }
        workspace.openTunnel = openTunnel;
    })(workspace || (exports.workspace = workspace = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViLmZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3dlYi5mYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdCaEcsd0JBOENDO0lBdkRELElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztJQUNwQixNQUFNLGdCQUFnQixHQUFHLElBQUksdUJBQWUsRUFBYyxDQUFDO0lBRTNEOzs7OztPQUtHO0lBQ0gsU0FBZ0IsTUFBTSxDQUFDLFVBQXVCLEVBQUUsT0FBc0M7UUFFckYsMEJBQTBCO1FBQzFCLElBQUEsa0JBQUksRUFBQywyQkFBMkIsQ0FBQyxDQUFDO1FBRWxDLHdFQUF3RTtRQUN4RSxxRUFBcUU7UUFDckUsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsdURBQXVELENBQUMsQ0FBQztRQUMxRSxDQUFDO2FBQU0sQ0FBQztZQUNQLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELDJCQUEyQjtRQUMzQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDckMsS0FBSyxNQUFNLE9BQU8sSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBRXhDLDJCQUFnQixDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxFQUFFLEVBQUU7b0JBQ2xFLCtEQUErRDtvQkFDL0QseURBQXlEO29CQUN6RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDakMsQ0FBQyxDQUFDLENBQUM7Z0JBRUgscURBQXFEO2dCQUNyRCxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUs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