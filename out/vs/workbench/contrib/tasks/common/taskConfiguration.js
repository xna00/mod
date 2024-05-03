/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/uuid", "vs/workbench/contrib/tasks/common/problemMatcher", "./tasks", "./taskDefinitionRegistry", "vs/workbench/contrib/tasks/common/taskService"], function (require, exports, nls, Objects, Types, UUID, problemMatcher_1, Tasks, taskDefinitionRegistry_1, taskService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskConfigSource = exports.UUIDMap = exports.JsonSchemaVersion = exports.ExecutionEngine = exports.TaskParser = exports.GroupKind = exports.ProblemMatcherConverter = exports.RunOptions = exports.RunOnOptions = exports.CommandString = exports.ITaskIdentifier = exports.ShellQuoting = void 0;
    exports.parse = parse;
    exports.createCustomTask = createCustomTask;
    var ShellQuoting;
    (function (ShellQuoting) {
        /**
         * Default is character escaping.
         */
        ShellQuoting[ShellQuoting["escape"] = 1] = "escape";
        /**
         * Default is strong quoting
         */
        ShellQuoting[ShellQuoting["strong"] = 2] = "strong";
        /**
         * Default is weak quoting.
         */
        ShellQuoting[ShellQuoting["weak"] = 3] = "weak";
    })(ShellQuoting || (exports.ShellQuoting = ShellQuoting = {}));
    var ITaskIdentifier;
    (function (ITaskIdentifier) {
        function is(value) {
            const candidate = value;
            return candidate !== undefined && Types.isString(value.type);
        }
        ITaskIdentifier.is = is;
    })(ITaskIdentifier || (exports.ITaskIdentifier = ITaskIdentifier = {}));
    var CommandString;
    (function (CommandString) {
        function value(value) {
            if (Types.isString(value)) {
                return value;
            }
            else if (Types.isStringArray(value)) {
                return value.join(' ');
            }
            else {
                if (Types.isString(value.value)) {
                    return value.value;
                }
                else {
                    return value.value.join(' ');
                }
            }
        }
        CommandString.value = value;
    })(CommandString || (exports.CommandString = CommandString = {}));
    var ProblemMatcherKind;
    (function (ProblemMatcherKind) {
        ProblemMatcherKind[ProblemMatcherKind["Unknown"] = 0] = "Unknown";
        ProblemMatcherKind[ProblemMatcherKind["String"] = 1] = "String";
        ProblemMatcherKind[ProblemMatcherKind["ProblemMatcher"] = 2] = "ProblemMatcher";
        ProblemMatcherKind[ProblemMatcherKind["Array"] = 3] = "Array";
    })(ProblemMatcherKind || (ProblemMatcherKind = {}));
    const EMPTY_ARRAY = [];
    Object.freeze(EMPTY_ARRAY);
    function assignProperty(target, source, key) {
        const sourceAtKey = source[key];
        if (sourceAtKey !== undefined) {
            target[key] = sourceAtKey;
        }
    }
    function fillProperty(target, source, key) {
        const sourceAtKey = source[key];
        if (target[key] === undefined && sourceAtKey !== undefined) {
            target[key] = sourceAtKey;
        }
    }
    function _isEmpty(value, properties, allowEmptyArray = false) {
        if (value === undefined || value === null || properties === undefined) {
            return true;
        }
        for (const meta of properties) {
            const property = value[meta.property];
            if (property !== undefined && property !== null) {
                if (meta.type !== undefined && !meta.type.isEmpty(property)) {
                    return false;
                }
                else if (!Array.isArray(property) || (property.length > 0) || allowEmptyArray) {
                    return false;
                }
            }
        }
        return true;
    }
    function _assignProperties(target, source, properties) {
        if (!source || _isEmpty(source, properties)) {
            return target;
        }
        if (!target || _isEmpty(target, properties)) {
            return source;
        }
        for (const meta of properties) {
            const property = meta.property;
            let value;
            if (meta.type !== undefined) {
                value = meta.type.assignProperties(target[property], source[property]);
            }
            else {
                value = source[property];
            }
            if (value !== undefined && value !== null) {
                target[property] = value;
            }
        }
        return target;
    }
    function _fillProperties(target, source, properties, allowEmptyArray = false) {
        if (!source || _isEmpty(source, properties)) {
            return target;
        }
        if (!target || _isEmpty(target, properties, allowEmptyArray)) {
            return source;
        }
        for (const meta of properties) {
            const property = meta.property;
            let value;
            if (meta.type) {
                value = meta.type.fillProperties(target[property], source[property]);
            }
            else if (target[property] === undefined) {
                value = source[property];
            }
            if (value !== undefined && value !== null) {
                target[property] = value;
            }
        }
        return target;
    }
    function _fillDefaults(target, defaults, properties, context) {
        if (target && Object.isFrozen(target)) {
            return target;
        }
        if (target === undefined || target === null || defaults === undefined || defaults === null) {
            if (defaults !== undefined && defaults !== null) {
                return Objects.deepClone(defaults);
            }
            else {
                return undefined;
            }
        }
        for (const meta of properties) {
            const property = meta.property;
            if (target[property] !== undefined) {
                continue;
            }
            let value;
            if (meta.type) {
                value = meta.type.fillDefaults(target[property], context);
            }
            else {
                value = defaults[property];
            }
            if (value !== undefined && value !== null) {
                target[property] = value;
            }
        }
        return target;
    }
    function _freeze(target, properties) {
        if (target === undefined || target === null) {
            return undefined;
        }
        if (Object.isFrozen(target)) {
            return target;
        }
        for (const meta of properties) {
            if (meta.type) {
                const value = target[meta.property];
                if (value) {
                    meta.type.freeze(value);
                }
            }
        }
        Object.freeze(target);
        return target;
    }
    var RunOnOptions;
    (function (RunOnOptions) {
        function fromString(value) {
            if (!value) {
                return Tasks.RunOnOptions.default;
            }
            switch (value.toLowerCase()) {
                case 'folderopen':
                    return Tasks.RunOnOptions.folderOpen;
                case 'default':
                default:
                    return Tasks.RunOnOptions.default;
            }
        }
        RunOnOptions.fromString = fromString;
    })(RunOnOptions || (exports.RunOnOptions = RunOnOptions = {}));
    var RunOptions;
    (function (RunOptions) {
        const properties = [{ property: 'reevaluateOnRerun' }, { property: 'runOn' }, { property: 'instanceLimit' }];
        function fromConfiguration(value) {
            return {
                reevaluateOnRerun: value ? value.reevaluateOnRerun : true,
                runOn: value ? RunOnOptions.fromString(value.runOn) : Tasks.RunOnOptions.default,
                instanceLimit: value ? value.instanceLimit : 1
            };
        }
        RunOptions.fromConfiguration = fromConfiguration;
        function assignProperties(target, source) {
            return _assignProperties(target, source, properties);
        }
        RunOptions.assignProperties = assignProperties;
        function fillProperties(target, source) {
            return _fillProperties(target, source, properties);
        }
        RunOptions.fillProperties = fillProperties;
    })(RunOptions || (exports.RunOptions = RunOptions = {}));
    var ShellConfiguration;
    (function (ShellConfiguration) {
        const properties = [{ property: 'executable' }, { property: 'args' }, { property: 'quoting' }];
        function is(value) {
            const candidate = value;
            return candidate && (Types.isString(candidate.executable) || Types.isStringArray(candidate.args));
        }
        ShellConfiguration.is = is;
        function from(config, context) {
            if (!is(config)) {
                return undefined;
            }
            const result = {};
            if (config.executable !== undefined) {
                result.executable = config.executable;
            }
            if (config.args !== undefined) {
                result.args = config.args.slice();
            }
            if (config.quoting !== undefined) {
                result.quoting = Objects.deepClone(config.quoting);
            }
            return result;
        }
        ShellConfiguration.from = from;
        function isEmpty(value) {
            return _isEmpty(value, properties, true);
        }
        ShellConfiguration.isEmpty = isEmpty;
        function assignProperties(target, source) {
            return _assignProperties(target, source, properties);
        }
        ShellConfiguration.assignProperties = assignProperties;
        function fillProperties(target, source) {
            return _fillProperties(target, source, properties, true);
        }
        ShellConfiguration.fillProperties = fillProperties;
        function fillDefaults(value, context) {
            return value;
        }
        ShellConfiguration.fillDefaults = fillDefaults;
        function freeze(value) {
            if (!value) {
                return undefined;
            }
            return Object.freeze(value);
        }
        ShellConfiguration.freeze = freeze;
    })(ShellConfiguration || (ShellConfiguration = {}));
    var CommandOptions;
    (function (CommandOptions) {
        const properties = [{ property: 'cwd' }, { property: 'env' }, { property: 'shell', type: ShellConfiguration }];
        const defaults = { cwd: '${workspaceFolder}' };
        function from(options, context) {
            const result = {};
            if (options.cwd !== undefined) {
                if (Types.isString(options.cwd)) {
                    result.cwd = options.cwd;
                }
                else {
                    context.taskLoadIssues.push(nls.localize('ConfigurationParser.invalidCWD', 'Warning: options.cwd must be of type string. Ignoring value {0}\n', options.cwd));
                }
            }
            if (options.env !== undefined) {
                result.env = Objects.deepClone(options.env);
            }
            result.shell = ShellConfiguration.from(options.shell, context);
            return isEmpty(result) ? undefined : result;
        }
        CommandOptions.from = from;
        function isEmpty(value) {
            return _isEmpty(value, properties);
        }
        CommandOptions.isEmpty = isEmpty;
        function assignProperties(target, source) {
            if ((source === undefined) || isEmpty(source)) {
                return target;
            }
            if ((target === undefined) || isEmpty(target)) {
                return source;
            }
            assignProperty(target, source, 'cwd');
            if (target.env === undefined) {
                target.env = source.env;
            }
            else if (source.env !== undefined) {
                const env = Object.create(null);
                if (target.env !== undefined) {
                    Object.keys(target.env).forEach(key => env[key] = target.env[key]);
                }
                if (source.env !== undefined) {
                    Object.keys(source.env).forEach(key => env[key] = source.env[key]);
                }
                target.env = env;
            }
            target.shell = ShellConfiguration.assignProperties(target.shell, source.shell);
            return target;
        }
        CommandOptions.assignProperties = assignProperties;
        function fillProperties(target, source) {
            return _fillProperties(target, source, properties);
        }
        CommandOptions.fillProperties = fillProperties;
        function fillDefaults(value, context) {
            return _fillDefaults(value, defaults, properties, context);
        }
        CommandOptions.fillDefaults = fillDefaults;
        function freeze(value) {
            return _freeze(value, properties);
        }
        CommandOptions.freeze = freeze;
    })(CommandOptions || (CommandOptions = {}));
    var CommandConfiguration;
    (function (CommandConfiguration) {
        let PresentationOptions;
        (function (PresentationOptions) {
            const properties = [{ property: 'echo' }, { property: 'reveal' }, { property: 'revealProblems' }, { property: 'focus' }, { property: 'panel' }, { property: 'showReuseMessage' }, { property: 'clear' }, { property: 'group' }, { property: 'close' }];
            function from(config, context) {
                let echo;
                let reveal;
                let revealProblems;
                let focus;
                let panel;
                let showReuseMessage;
                let clear;
                let group;
                let close;
                let hasProps = false;
                if (Types.isBoolean(config.echoCommand)) {
                    echo = config.echoCommand;
                    hasProps = true;
                }
                if (Types.isString(config.showOutput)) {
                    reveal = Tasks.RevealKind.fromString(config.showOutput);
                    hasProps = true;
                }
                const presentation = config.presentation || config.terminal;
                if (presentation) {
                    if (Types.isBoolean(presentation.echo)) {
                        echo = presentation.echo;
                    }
                    if (Types.isString(presentation.reveal)) {
                        reveal = Tasks.RevealKind.fromString(presentation.reveal);
                    }
                    if (Types.isString(presentation.revealProblems)) {
                        revealProblems = Tasks.RevealProblemKind.fromString(presentation.revealProblems);
                    }
                    if (Types.isBoolean(presentation.focus)) {
                        focus = presentation.focus;
                    }
                    if (Types.isString(presentation.panel)) {
                        panel = Tasks.PanelKind.fromString(presentation.panel);
                    }
                    if (Types.isBoolean(presentation.showReuseMessage)) {
                        showReuseMessage = presentation.showReuseMessage;
                    }
                    if (Types.isBoolean(presentation.clear)) {
                        clear = presentation.clear;
                    }
                    if (Types.isString(presentation.group)) {
                        group = presentation.group;
                    }
                    if (Types.isBoolean(presentation.close)) {
                        close = presentation.close;
                    }
                    hasProps = true;
                }
                if (!hasProps) {
                    return undefined;
                }
                return { echo: echo, reveal: reveal, revealProblems: revealProblems, focus: focus, panel: panel, showReuseMessage: showReuseMessage, clear: clear, group, close: close };
            }
            PresentationOptions.from = from;
            function assignProperties(target, source) {
                return _assignProperties(target, source, properties);
            }
            PresentationOptions.assignProperties = assignProperties;
            function fillProperties(target, source) {
                return _fillProperties(target, source, properties);
            }
            PresentationOptions.fillProperties = fillProperties;
            function fillDefaults(value, context) {
                const defaultEcho = context.engine === Tasks.ExecutionEngine.Terminal ? true : false;
                return _fillDefaults(value, { echo: defaultEcho, reveal: Tasks.RevealKind.Always, revealProblems: Tasks.RevealProblemKind.Never, focus: false, panel: Tasks.PanelKind.Shared, showReuseMessage: true, clear: false }, properties, context);
            }
            PresentationOptions.fillDefaults = fillDefaults;
            function freeze(value) {
                return _freeze(value, properties);
            }
            PresentationOptions.freeze = freeze;
            function isEmpty(value) {
                return _isEmpty(value, properties);
            }
            PresentationOptions.isEmpty = isEmpty;
        })(PresentationOptions = CommandConfiguration.PresentationOptions || (CommandConfiguration.PresentationOptions = {}));
        let ShellString;
        (function (ShellString) {
            function from(value) {
                if (value === undefined || value === null) {
                    return undefined;
                }
                if (Types.isString(value)) {
                    return value;
                }
                else if (Types.isStringArray(value)) {
                    return value.join(' ');
                }
                else {
                    const quoting = Tasks.ShellQuoting.from(value.quoting);
                    const result = Types.isString(value.value) ? value.value : Types.isStringArray(value.value) ? value.value.join(' ') : undefined;
                    if (result) {
                        return {
                            value: result,
                            quoting: quoting
                        };
                    }
                    else {
                        return undefined;
                    }
                }
            }
            ShellString.from = from;
        })(ShellString || (ShellString = {}));
        const properties = [
            { property: 'runtime' }, { property: 'name' }, { property: 'options', type: CommandOptions },
            { property: 'args' }, { property: 'taskSelector' }, { property: 'suppressTaskName' },
            { property: 'presentation', type: PresentationOptions }
        ];
        function from(config, context) {
            let result = fromBase(config, context);
            let osConfig = undefined;
            if (config.windows && context.platform === 3 /* Platform.Windows */) {
                osConfig = fromBase(config.windows, context);
            }
            else if (config.osx && context.platform === 1 /* Platform.Mac */) {
                osConfig = fromBase(config.osx, context);
            }
            else if (config.linux && context.platform === 2 /* Platform.Linux */) {
                osConfig = fromBase(config.linux, context);
            }
            if (osConfig) {
                result = assignProperties(result, osConfig, context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */);
            }
            return isEmpty(result) ? undefined : result;
        }
        CommandConfiguration.from = from;
        function fromBase(config, context) {
            const name = ShellString.from(config.command);
            let runtime;
            if (Types.isString(config.type)) {
                if (config.type === 'shell' || config.type === 'process') {
                    runtime = Tasks.RuntimeType.fromString(config.type);
                }
            }
            const isShellConfiguration = ShellConfiguration.is(config.isShellCommand);
            if (Types.isBoolean(config.isShellCommand) || isShellConfiguration) {
                runtime = Tasks.RuntimeType.Shell;
            }
            else if (config.isShellCommand !== undefined) {
                runtime = !!config.isShellCommand ? Tasks.RuntimeType.Shell : Tasks.RuntimeType.Process;
            }
            const result = {
                name: name,
                runtime: runtime,
                presentation: PresentationOptions.from(config, context)
            };
            if (config.args !== undefined) {
                result.args = [];
                for (const arg of config.args) {
                    const converted = ShellString.from(arg);
                    if (converted !== undefined) {
                        result.args.push(converted);
                    }
                    else {
                        context.taskLoadIssues.push(nls.localize('ConfigurationParser.inValidArg', 'Error: command argument must either be a string or a quoted string. Provided value is:\n{0}', arg ? JSON.stringify(arg, undefined, 4) : 'undefined'));
                    }
                }
            }
            if (config.options !== undefined) {
                result.options = CommandOptions.from(config.options, context);
                if (result.options && result.options.shell === undefined && isShellConfiguration) {
                    result.options.shell = ShellConfiguration.from(config.isShellCommand, context);
                    if (context.engine !== Tasks.ExecutionEngine.Terminal) {
                        context.taskLoadIssues.push(nls.localize('ConfigurationParser.noShell', 'Warning: shell configuration is only supported when executing tasks in the terminal.'));
                    }
                }
            }
            if (Types.isString(config.taskSelector)) {
                result.taskSelector = config.taskSelector;
            }
            if (Types.isBoolean(config.suppressTaskName)) {
                result.suppressTaskName = config.suppressTaskName;
            }
            return isEmpty(result) ? undefined : result;
        }
        function hasCommand(value) {
            return value && !!value.name;
        }
        CommandConfiguration.hasCommand = hasCommand;
        function isEmpty(value) {
            return _isEmpty(value, properties);
        }
        CommandConfiguration.isEmpty = isEmpty;
        function assignProperties(target, source, overwriteArgs) {
            if (isEmpty(source)) {
                return target;
            }
            if (isEmpty(target)) {
                return source;
            }
            assignProperty(target, source, 'name');
            assignProperty(target, source, 'runtime');
            assignProperty(target, source, 'taskSelector');
            assignProperty(target, source, 'suppressTaskName');
            if (source.args !== undefined) {
                if (target.args === undefined || overwriteArgs) {
                    target.args = source.args;
                }
                else {
                    target.args = target.args.concat(source.args);
                }
            }
            target.presentation = PresentationOptions.assignProperties(target.presentation, source.presentation);
            target.options = CommandOptions.assignProperties(target.options, source.options);
            return target;
        }
        CommandConfiguration.assignProperties = assignProperties;
        function fillProperties(target, source) {
            return _fillProperties(target, source, properties);
        }
        CommandConfiguration.fillProperties = fillProperties;
        function fillGlobals(target, source, taskName) {
            if ((source === undefined) || isEmpty(source)) {
                return target;
            }
            target = target || {
                name: undefined,
                runtime: undefined,
                presentation: undefined
            };
            if (target.name === undefined) {
                fillProperty(target, source, 'name');
                fillProperty(target, source, 'taskSelector');
                fillProperty(target, source, 'suppressTaskName');
                let args = source.args ? source.args.slice() : [];
                if (!target.suppressTaskName && taskName) {
                    if (target.taskSelector !== undefined) {
                        args.push(target.taskSelector + taskName);
                    }
                    else {
                        args.push(taskName);
                    }
                }
                if (target.args) {
                    args = args.concat(target.args);
                }
                target.args = args;
            }
            fillProperty(target, source, 'runtime');
            target.presentation = PresentationOptions.fillProperties(target.presentation, source.presentation);
            target.options = CommandOptions.fillProperties(target.options, source.options);
            return target;
        }
        CommandConfiguration.fillGlobals = fillGlobals;
        function fillDefaults(value, context) {
            if (!value || Object.isFrozen(value)) {
                return;
            }
            if (value.name !== undefined && value.runtime === undefined) {
                value.runtime = Tasks.RuntimeType.Process;
            }
            value.presentation = PresentationOptions.fillDefaults(value.presentation, context);
            if (!isEmpty(value)) {
                value.options = CommandOptions.fillDefaults(value.options, context);
            }
            if (value.args === undefined) {
                value.args = EMPTY_ARRAY;
            }
            if (value.suppressTaskName === undefined) {
                value.suppressTaskName = (context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */);
            }
        }
        CommandConfiguration.fillDefaults = fillDefaults;
        function freeze(value) {
            return _freeze(value, properties);
        }
        CommandConfiguration.freeze = freeze;
    })(CommandConfiguration || (CommandConfiguration = {}));
    var ProblemMatcherConverter;
    (function (ProblemMatcherConverter) {
        function namedFrom(declares, context) {
            const result = Object.create(null);
            if (!Array.isArray(declares)) {
                return result;
            }
            declares.forEach((value) => {
                const namedProblemMatcher = (new problemMatcher_1.ProblemMatcherParser(context.problemReporter)).parse(value);
                if ((0, problemMatcher_1.isNamedProblemMatcher)(namedProblemMatcher)) {
                    result[namedProblemMatcher.name] = namedProblemMatcher;
                }
                else {
                    context.problemReporter.error(nls.localize('ConfigurationParser.noName', 'Error: Problem Matcher in declare scope must have a name:\n{0}\n', JSON.stringify(value, undefined, 4)));
                }
            });
            return result;
        }
        ProblemMatcherConverter.namedFrom = namedFrom;
        function fromWithOsConfig(external, context) {
            let result = {};
            if (external.windows && external.windows.problemMatcher && context.platform === 3 /* Platform.Windows */) {
                result = from(external.windows.problemMatcher, context);
            }
            else if (external.osx && external.osx.problemMatcher && context.platform === 1 /* Platform.Mac */) {
                result = from(external.osx.problemMatcher, context);
            }
            else if (external.linux && external.linux.problemMatcher && context.platform === 2 /* Platform.Linux */) {
                result = from(external.linux.problemMatcher, context);
            }
            else if (external.problemMatcher) {
                result = from(external.problemMatcher, context);
            }
            return result;
        }
        ProblemMatcherConverter.fromWithOsConfig = fromWithOsConfig;
        function from(config, context) {
            const result = [];
            if (config === undefined) {
                return { value: result };
            }
            const errors = [];
            function addResult(matcher) {
                if (matcher.value) {
                    result.push(matcher.value);
                }
                if (matcher.errors) {
                    errors.push(...matcher.errors);
                }
            }
            const kind = getProblemMatcherKind(config);
            if (kind === ProblemMatcherKind.Unknown) {
                const error = nls.localize('ConfigurationParser.unknownMatcherKind', 'Warning: the defined problem matcher is unknown. Supported types are string | ProblemMatcher | Array<string | ProblemMatcher>.\n{0}\n', JSON.stringify(config, null, 4));
                context.problemReporter.warn(error);
            }
            else if (kind === ProblemMatcherKind.String || kind === ProblemMatcherKind.ProblemMatcher) {
                addResult(resolveProblemMatcher(config, context));
            }
            else if (kind === ProblemMatcherKind.Array) {
                const problemMatchers = config;
                problemMatchers.forEach(problemMatcher => {
                    addResult(resolveProblemMatcher(problemMatcher, context));
                });
            }
            return { value: result, errors };
        }
        ProblemMatcherConverter.from = from;
        function getProblemMatcherKind(value) {
            if (Types.isString(value)) {
                return ProblemMatcherKind.String;
            }
            else if (Array.isArray(value)) {
                return ProblemMatcherKind.Array;
            }
            else if (!Types.isUndefined(value)) {
                return ProblemMatcherKind.ProblemMatcher;
            }
            else {
                return ProblemMatcherKind.Unknown;
            }
        }
        function resolveProblemMatcher(value, context) {
            if (Types.isString(value)) {
                let variableName = value;
                if (variableName.length > 1 && variableName[0] === '$') {
                    variableName = variableName.substring(1);
                    const global = problemMatcher_1.ProblemMatcherRegistry.get(variableName);
                    if (global) {
                        return { value: Objects.deepClone(global) };
                    }
                    let localProblemMatcher = context.namedProblemMatchers[variableName];
                    if (localProblemMatcher) {
                        localProblemMatcher = Objects.deepClone(localProblemMatcher);
                        // remove the name
                        delete localProblemMatcher.name;
                        return { value: localProblemMatcher };
                    }
                }
                return { errors: [nls.localize('ConfigurationParser.invalidVariableReference', 'Error: Invalid problemMatcher reference: {0}\n', value)] };
            }
            else {
                const json = value;
                return { value: new problemMatcher_1.ProblemMatcherParser(context.problemReporter).parse(json) };
            }
        }
    })(ProblemMatcherConverter || (exports.ProblemMatcherConverter = ProblemMatcherConverter = {}));
    const partialSource = {
        label: 'Workspace',
        config: undefined
    };
    var GroupKind;
    (function (GroupKind) {
        function from(external) {
            if (external === undefined) {
                return undefined;
            }
            else if (Types.isString(external) && Tasks.TaskGroup.is(external)) {
                return { _id: external, isDefault: false };
            }
            else if (Types.isString(external.kind) && Tasks.TaskGroup.is(external.kind)) {
                const group = external.kind;
                const isDefault = Types.isUndefined(external.isDefault) ? false : external.isDefault;
                return { _id: group, isDefault };
            }
            return undefined;
        }
        GroupKind.from = from;
        function to(group) {
            if (Types.isString(group)) {
                return group;
            }
            else if (!group.isDefault) {
                return group._id;
            }
            return {
                kind: group._id,
                isDefault: group.isDefault,
            };
        }
        GroupKind.to = to;
    })(GroupKind || (exports.GroupKind = GroupKind = {}));
    var TaskDependency;
    (function (TaskDependency) {
        function uriFromSource(context, source) {
            switch (source) {
                case TaskConfigSource.User: return Tasks.USER_TASKS_GROUP_KEY;
                case TaskConfigSource.TasksJson: return context.workspaceFolder.uri;
                default: return context.workspace && context.workspace.configuration ? context.workspace.configuration : context.workspaceFolder.uri;
            }
        }
        function from(external, context, source) {
            if (Types.isString(external)) {
                return { uri: uriFromSource(context, source), task: external };
            }
            else if (ITaskIdentifier.is(external)) {
                return {
                    uri: uriFromSource(context, source),
                    task: Tasks.TaskDefinition.createTaskIdentifier(external, context.problemReporter)
                };
            }
            else {
                return undefined;
            }
        }
        TaskDependency.from = from;
    })(TaskDependency || (TaskDependency = {}));
    var DependsOrder;
    (function (DependsOrder) {
        function from(order) {
            switch (order) {
                case "sequence" /* Tasks.DependsOrder.sequence */:
                    return "sequence" /* Tasks.DependsOrder.sequence */;
                case "parallel" /* Tasks.DependsOrder.parallel */:
                default:
                    return "parallel" /* Tasks.DependsOrder.parallel */;
            }
        }
        DependsOrder.from = from;
    })(DependsOrder || (DependsOrder = {}));
    var ConfigurationProperties;
    (function (ConfigurationProperties) {
        const properties = [
            { property: 'name' },
            { property: 'identifier' },
            { property: 'group' },
            { property: 'isBackground' },
            { property: 'promptOnClose' },
            { property: 'dependsOn' },
            { property: 'presentation', type: CommandConfiguration.PresentationOptions },
            { property: 'problemMatchers' },
            { property: 'options' },
            { property: 'icon' },
            { property: 'hide' }
        ];
        function from(external, context, includeCommandOptions, source, properties) {
            if (!external) {
                return {};
            }
            const result = {};
            if (properties) {
                for (const propertyName of Object.keys(properties)) {
                    if (external[propertyName] !== undefined) {
                        result[propertyName] = Objects.deepClone(external[propertyName]);
                    }
                }
            }
            if (Types.isString(external.taskName)) {
                result.name = external.taskName;
            }
            if (Types.isString(external.label) && context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */) {
                result.name = external.label;
            }
            if (Types.isString(external.identifier)) {
                result.identifier = external.identifier;
            }
            result.icon = external.icon;
            result.hide = external.hide;
            if (external.isBackground !== undefined) {
                result.isBackground = !!external.isBackground;
            }
            if (external.promptOnClose !== undefined) {
                result.promptOnClose = !!external.promptOnClose;
            }
            result.group = GroupKind.from(external.group);
            if (external.dependsOn !== undefined) {
                if (Array.isArray(external.dependsOn)) {
                    result.dependsOn = external.dependsOn.reduce((dependencies, item) => {
                        const dependency = TaskDependency.from(item, context, source);
                        if (dependency) {
                            dependencies.push(dependency);
                        }
                        return dependencies;
                    }, []);
                }
                else {
                    const dependsOnValue = TaskDependency.from(external.dependsOn, context, source);
                    result.dependsOn = dependsOnValue ? [dependsOnValue] : undefined;
                }
            }
            result.dependsOrder = DependsOrder.from(external.dependsOrder);
            if (includeCommandOptions && (external.presentation !== undefined || external.terminal !== undefined)) {
                result.presentation = CommandConfiguration.PresentationOptions.from(external, context);
            }
            if (includeCommandOptions && (external.options !== undefined)) {
                result.options = CommandOptions.from(external.options, context);
            }
            const configProblemMatcher = ProblemMatcherConverter.fromWithOsConfig(external, context);
            if (configProblemMatcher.value !== undefined) {
                result.problemMatchers = configProblemMatcher.value;
            }
            if (external.detail) {
                result.detail = external.detail;
            }
            return isEmpty(result) ? {} : { value: result, errors: configProblemMatcher.errors };
        }
        ConfigurationProperties.from = from;
        function isEmpty(value) {
            return _isEmpty(value, properties);
        }
        ConfigurationProperties.isEmpty = isEmpty;
    })(ConfigurationProperties || (ConfigurationProperties = {}));
    var ConfiguringTask;
    (function (ConfiguringTask) {
        const grunt = 'grunt.';
        const jake = 'jake.';
        const gulp = 'gulp.';
        const npm = 'vscode.npm.';
        const typescript = 'vscode.typescript.';
        function from(external, context, index, source, registry) {
            if (!external) {
                return undefined;
            }
            const type = external.type;
            const customize = external.customize;
            if (!type && !customize) {
                context.problemReporter.error(nls.localize('ConfigurationParser.noTaskType', 'Error: tasks configuration must have a type property. The configuration will be ignored.\n{0}\n', JSON.stringify(external, null, 4)));
                return undefined;
            }
            const typeDeclaration = type ? registry?.get?.(type) || taskDefinitionRegistry_1.TaskDefinitionRegistry.get(type) : undefined;
            if (!typeDeclaration) {
                const message = nls.localize('ConfigurationParser.noTypeDefinition', 'Error: there is no registered task type \'{0}\'. Did you miss installing an extension that provides a corresponding task provider?', type);
                context.problemReporter.error(message);
                return undefined;
            }
            let identifier;
            if (Types.isString(customize)) {
                if (customize.indexOf(grunt) === 0) {
                    identifier = { type: 'grunt', task: customize.substring(grunt.length) };
                }
                else if (customize.indexOf(jake) === 0) {
                    identifier = { type: 'jake', task: customize.substring(jake.length) };
                }
                else if (customize.indexOf(gulp) === 0) {
                    identifier = { type: 'gulp', task: customize.substring(gulp.length) };
                }
                else if (customize.indexOf(npm) === 0) {
                    identifier = { type: 'npm', script: customize.substring(npm.length + 4) };
                }
                else if (customize.indexOf(typescript) === 0) {
                    identifier = { type: 'typescript', tsconfig: customize.substring(typescript.length + 6) };
                }
            }
            else {
                if (Types.isString(external.type)) {
                    identifier = external;
                }
            }
            if (identifier === undefined) {
                context.problemReporter.error(nls.localize('ConfigurationParser.missingType', 'Error: the task configuration \'{0}\' is missing the required property \'type\'. The task configuration will be ignored.', JSON.stringify(external, undefined, 0)));
                return undefined;
            }
            const taskIdentifier = Tasks.TaskDefinition.createTaskIdentifier(identifier, context.problemReporter);
            if (taskIdentifier === undefined) {
                context.problemReporter.error(nls.localize('ConfigurationParser.incorrectType', 'Error: the task configuration \'{0}\' is using an unknown type. The task configuration will be ignored.', JSON.stringify(external, undefined, 0)));
                return undefined;
            }
            const configElement = {
                workspaceFolder: context.workspaceFolder,
                file: '.vscode/tasks.json',
                index,
                element: external
            };
            let taskSource;
            switch (source) {
                case TaskConfigSource.User: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.User, config: configElement });
                    break;
                }
                case TaskConfigSource.WorkspaceFile: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.WorkspaceFile, config: configElement });
                    break;
                }
                default: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.Workspace, config: configElement });
                    break;
                }
            }
            const result = new Tasks.ConfiguringTask(`${typeDeclaration.extensionId}.${taskIdentifier._key}`, taskSource, undefined, type, taskIdentifier, RunOptions.fromConfiguration(external.runOptions), { hide: external.hide });
            const configuration = ConfigurationProperties.from(external, context, true, source, typeDeclaration.properties);
            result.addTaskLoadMessages(configuration.errors);
            if (configuration.value) {
                result.configurationProperties = Object.assign(result.configurationProperties, configuration.value);
                if (result.configurationProperties.name) {
                    result._label = result.configurationProperties.name;
                }
                else {
                    let label = result.configures.type;
                    if (typeDeclaration.required && typeDeclaration.required.length > 0) {
                        for (const required of typeDeclaration.required) {
                            const value = result.configures[required];
                            if (value) {
                                label = label + ': ' + value;
                                break;
                            }
                        }
                    }
                    result._label = label;
                }
                if (!result.configurationProperties.identifier) {
                    result.configurationProperties.identifier = taskIdentifier._key;
                }
            }
            return result;
        }
        ConfiguringTask.from = from;
    })(ConfiguringTask || (ConfiguringTask = {}));
    var CustomTask;
    (function (CustomTask) {
        function from(external, context, index, source) {
            if (!external) {
                return undefined;
            }
            let type = external.type;
            if (type === undefined || type === null) {
                type = Tasks.CUSTOMIZED_TASK_TYPE;
            }
            if (type !== Tasks.CUSTOMIZED_TASK_TYPE && type !== 'shell' && type !== 'process') {
                context.problemReporter.error(nls.localize('ConfigurationParser.notCustom', 'Error: tasks is not declared as a custom task. The configuration will be ignored.\n{0}\n', JSON.stringify(external, null, 4)));
                return undefined;
            }
            let taskName = external.taskName;
            if (Types.isString(external.label) && context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */) {
                taskName = external.label;
            }
            if (!taskName) {
                context.problemReporter.error(nls.localize('ConfigurationParser.noTaskName', 'Error: a task must provide a label property. The task will be ignored.\n{0}\n', JSON.stringify(external, null, 4)));
                return undefined;
            }
            let taskSource;
            switch (source) {
                case TaskConfigSource.User: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.User, config: { index, element: external, file: '.vscode/tasks.json', workspaceFolder: context.workspaceFolder } });
                    break;
                }
                case TaskConfigSource.WorkspaceFile: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.WorkspaceFile, config: { index, element: external, file: '.vscode/tasks.json', workspaceFolder: context.workspaceFolder, workspace: context.workspace } });
                    break;
                }
                default: {
                    taskSource = Object.assign({}, partialSource, { kind: Tasks.TaskSourceKind.Workspace, config: { index, element: external, file: '.vscode/tasks.json', workspaceFolder: context.workspaceFolder } });
                    break;
                }
            }
            const result = new Tasks.CustomTask(context.uuidMap.getUUID(taskName), taskSource, taskName, Tasks.CUSTOMIZED_TASK_TYPE, undefined, false, RunOptions.fromConfiguration(external.runOptions), {
                name: taskName,
                identifier: taskName,
            });
            const configuration = ConfigurationProperties.from(external, context, false, source);
            result.addTaskLoadMessages(configuration.errors);
            if (configuration.value) {
                result.configurationProperties = Object.assign(result.configurationProperties, configuration.value);
            }
            const supportLegacy = true; //context.schemaVersion === Tasks.JsonSchemaVersion.V2_0_0;
            if (supportLegacy) {
                const legacy = external;
                if (result.configurationProperties.isBackground === undefined && legacy.isWatching !== undefined) {
                    result.configurationProperties.isBackground = !!legacy.isWatching;
                }
                if (result.configurationProperties.group === undefined) {
                    if (legacy.isBuildCommand === true) {
                        result.configurationProperties.group = Tasks.TaskGroup.Build;
                    }
                    else if (legacy.isTestCommand === true) {
                        result.configurationProperties.group = Tasks.TaskGroup.Test;
                    }
                }
            }
            const command = CommandConfiguration.from(external, context);
            if (command) {
                result.command = command;
            }
            if (external.command !== undefined) {
                // if the task has its own command then we suppress the
                // task name by default.
                command.suppressTaskName = true;
            }
            return result;
        }
        CustomTask.from = from;
        function fillGlobals(task, globals) {
            // We only merge a command from a global definition if there is no dependsOn
            // or there is a dependsOn and a defined command.
            if (CommandConfiguration.hasCommand(task.command) || task.configurationProperties.dependsOn === undefined) {
                task.command = CommandConfiguration.fillGlobals(task.command, globals.command, task.configurationProperties.name);
            }
            if (task.configurationProperties.problemMatchers === undefined && globals.problemMatcher !== undefined) {
                task.configurationProperties.problemMatchers = Objects.deepClone(globals.problemMatcher);
                task.hasDefinedMatchers = true;
            }
            // promptOnClose is inferred from isBackground if available
            if (task.configurationProperties.promptOnClose === undefined && task.configurationProperties.isBackground === undefined && globals.promptOnClose !== undefined) {
                task.configurationProperties.promptOnClose = globals.promptOnClose;
            }
        }
        CustomTask.fillGlobals = fillGlobals;
        function fillDefaults(task, context) {
            CommandConfiguration.fillDefaults(task.command, context);
            if (task.configurationProperties.promptOnClose === undefined) {
                task.configurationProperties.promptOnClose = task.configurationProperties.isBackground !== undefined ? !task.configurationProperties.isBackground : true;
            }
            if (task.configurationProperties.isBackground === undefined) {
                task.configurationProperties.isBackground = false;
            }
            if (task.configurationProperties.problemMatchers === undefined) {
                task.configurationProperties.problemMatchers = EMPTY_ARRAY;
            }
        }
        CustomTask.fillDefaults = fillDefaults;
        function createCustomTask(contributedTask, configuredProps) {
            const result = new Tasks.CustomTask(configuredProps._id, Object.assign({}, configuredProps._source, { customizes: contributedTask.defines }), configuredProps.configurationProperties.name || contributedTask._label, Tasks.CUSTOMIZED_TASK_TYPE, contributedTask.command, false, contributedTask.runOptions, {
                name: configuredProps.configurationProperties.name || contributedTask.configurationProperties.name,
                identifier: configuredProps.configurationProperties.identifier || contributedTask.configurationProperties.identifier,
                icon: configuredProps.configurationProperties.icon,
                hide: configuredProps.configurationProperties.hide
            });
            result.addTaskLoadMessages(configuredProps.taskLoadMessages);
            const resultConfigProps = result.configurationProperties;
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'group');
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'isBackground');
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'dependsOn');
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'problemMatchers');
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'promptOnClose');
            assignProperty(resultConfigProps, configuredProps.configurationProperties, 'detail');
            result.command.presentation = CommandConfiguration.PresentationOptions.assignProperties(result.command.presentation, configuredProps.configurationProperties.presentation);
            result.command.options = CommandOptions.assignProperties(result.command.options, configuredProps.configurationProperties.options);
            result.runOptions = RunOptions.assignProperties(result.runOptions, configuredProps.runOptions);
            const contributedConfigProps = contributedTask.configurationProperties;
            fillProperty(resultConfigProps, contributedConfigProps, 'group');
            fillProperty(resultConfigProps, contributedConfigProps, 'isBackground');
            fillProperty(resultConfigProps, contributedConfigProps, 'dependsOn');
            fillProperty(resultConfigProps, contributedConfigProps, 'problemMatchers');
            fillProperty(resultConfigProps, contributedConfigProps, 'promptOnClose');
            fillProperty(resultConfigProps, contributedConfigProps, 'detail');
            result.command.presentation = CommandConfiguration.PresentationOptions.fillProperties(result.command.presentation, contributedConfigProps.presentation);
            result.command.options = CommandOptions.fillProperties(result.command.options, contributedConfigProps.options);
            result.runOptions = RunOptions.fillProperties(result.runOptions, contributedTask.runOptions);
            if (contributedTask.hasDefinedMatchers === true) {
                result.hasDefinedMatchers = true;
            }
            return result;
        }
        CustomTask.createCustomTask = createCustomTask;
    })(CustomTask || (CustomTask = {}));
    var TaskParser;
    (function (TaskParser) {
        function isCustomTask(value) {
            const type = value.type;
            const customize = value.customize;
            return customize === undefined && (type === undefined || type === null || type === Tasks.CUSTOMIZED_TASK_TYPE || type === 'shell' || type === 'process');
        }
        const builtinTypeContextMap = {
            shell: taskService_1.ShellExecutionSupportedContext,
            process: taskService_1.ProcessExecutionSupportedContext
        };
        function from(externals, globals, context, source, registry) {
            const result = { custom: [], configured: [] };
            if (!externals) {
                return result;
            }
            const defaultBuildTask = { task: undefined, rank: -1 };
            const defaultTestTask = { task: undefined, rank: -1 };
            const schema2_0_0 = context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */;
            const baseLoadIssues = Objects.deepClone(context.taskLoadIssues);
            for (let index = 0; index < externals.length; index++) {
                const external = externals[index];
                const definition = external.type ? registry?.get?.(external.type) || taskDefinitionRegistry_1.TaskDefinitionRegistry.get(external.type) : undefined;
                let typeNotSupported = false;
                if (definition && definition.when && !context.contextKeyService.contextMatchesRules(definition.when)) {
                    typeNotSupported = true;
                }
                else if (!definition && external.type) {
                    for (const key of Object.keys(builtinTypeContextMap)) {
                        if (external.type === key) {
                            typeNotSupported = !taskService_1.ShellExecutionSupportedContext.evaluate(context.contextKeyService.getContext(null));
                            break;
                        }
                    }
                }
                if (typeNotSupported) {
                    context.problemReporter.info(nls.localize('taskConfiguration.providerUnavailable', 'Warning: {0} tasks are unavailable in the current environment.\n', external.type));
                    continue;
                }
                if (isCustomTask(external)) {
                    const customTask = CustomTask.from(external, context, index, source);
                    if (customTask) {
                        CustomTask.fillGlobals(customTask, globals);
                        CustomTask.fillDefaults(customTask, context);
                        if (schema2_0_0) {
                            if ((customTask.command === undefined || customTask.command.name === undefined) && (customTask.configurationProperties.dependsOn === undefined || customTask.configurationProperties.dependsOn.length === 0)) {
                                context.problemReporter.error(nls.localize('taskConfiguration.noCommandOrDependsOn', 'Error: the task \'{0}\' neither specifies a command nor a dependsOn property. The task will be ignored. Its definition is:\n{1}', customTask.configurationProperties.name, JSON.stringify(external, undefined, 4)));
                                continue;
                            }
                        }
                        else {
                            if (customTask.command === undefined || customTask.command.name === undefined) {
                                context.problemReporter.warn(nls.localize('taskConfiguration.noCommand', 'Error: the task \'{0}\' doesn\'t define a command. The task will be ignored. Its definition is:\n{1}', customTask.configurationProperties.name, JSON.stringify(external, undefined, 4)));
                                continue;
                            }
                        }
                        if (customTask.configurationProperties.group === Tasks.TaskGroup.Build && defaultBuildTask.rank < 2) {
                            defaultBuildTask.task = customTask;
                            defaultBuildTask.rank = 2;
                        }
                        else if (customTask.configurationProperties.group === Tasks.TaskGroup.Test && defaultTestTask.rank < 2) {
                            defaultTestTask.task = customTask;
                            defaultTestTask.rank = 2;
                        }
                        else if (customTask.configurationProperties.name === 'build' && defaultBuildTask.rank < 1) {
                            defaultBuildTask.task = customTask;
                            defaultBuildTask.rank = 1;
                        }
                        else if (customTask.configurationProperties.name === 'test' && defaultTestTask.rank < 1) {
                            defaultTestTask.task = customTask;
                            defaultTestTask.rank = 1;
                        }
                        customTask.addTaskLoadMessages(context.taskLoadIssues);
                        result.custom.push(customTask);
                    }
                }
                else {
                    const configuredTask = ConfiguringTask.from(external, context, index, source, registry);
                    if (configuredTask) {
                        configuredTask.addTaskLoadMessages(context.taskLoadIssues);
                        result.configured.push(configuredTask);
                    }
                }
                context.taskLoadIssues = Objects.deepClone(baseLoadIssues);
            }
            // There is some special logic for tasks with the labels "build" and "test".
            // Even if they are not marked as a task group Build or Test, we automagically group them as such.
            // However, if they are already grouped as Build or Test, we don't need to add this grouping.
            const defaultBuildGroupName = Types.isString(defaultBuildTask.task?.configurationProperties.group) ? defaultBuildTask.task?.configurationProperties.group : defaultBuildTask.task?.configurationProperties.group?._id;
            const defaultTestTaskGroupName = Types.isString(defaultTestTask.task?.configurationProperties.group) ? defaultTestTask.task?.configurationProperties.group : defaultTestTask.task?.configurationProperties.group?._id;
            if ((defaultBuildGroupName !== Tasks.TaskGroup.Build._id) && (defaultBuildTask.rank > -1) && (defaultBuildTask.rank < 2) && defaultBuildTask.task) {
                defaultBuildTask.task.configurationProperties.group = Tasks.TaskGroup.Build;
            }
            else if ((defaultTestTaskGroupName !== Tasks.TaskGroup.Test._id) && (defaultTestTask.rank > -1) && (defaultTestTask.rank < 2) && defaultTestTask.task) {
                defaultTestTask.task.configurationProperties.group = Tasks.TaskGroup.Test;
            }
            return result;
        }
        TaskParser.from = from;
        function assignTasks(target, source) {
            if (source === undefined || source.length === 0) {
                return target;
            }
            if (target === undefined || target.length === 0) {
                return source;
            }
            if (source) {
                // Tasks are keyed by ID but we need to merge by name
                const map = Object.create(null);
                target.forEach((task) => {
                    map[task.configurationProperties.name] = task;
                });
                source.forEach((task) => {
                    map[task.configurationProperties.name] = task;
                });
                const newTarget = [];
                target.forEach(task => {
                    newTarget.push(map[task.configurationProperties.name]);
                    delete map[task.configurationProperties.name];
                });
                Object.keys(map).forEach(key => newTarget.push(map[key]));
                target = newTarget;
            }
            return target;
        }
        TaskParser.assignTasks = assignTasks;
    })(TaskParser || (exports.TaskParser = TaskParser = {}));
    var Globals;
    (function (Globals) {
        function from(config, context) {
            let result = fromBase(config, context);
            let osGlobals = undefined;
            if (config.windows && context.platform === 3 /* Platform.Windows */) {
                osGlobals = fromBase(config.windows, context);
            }
            else if (config.osx && context.platform === 1 /* Platform.Mac */) {
                osGlobals = fromBase(config.osx, context);
            }
            else if (config.linux && context.platform === 2 /* Platform.Linux */) {
                osGlobals = fromBase(config.linux, context);
            }
            if (osGlobals) {
                result = Globals.assignProperties(result, osGlobals);
            }
            const command = CommandConfiguration.from(config, context);
            if (command) {
                result.command = command;
            }
            Globals.fillDefaults(result, context);
            Globals.freeze(result);
            return result;
        }
        Globals.from = from;
        function fromBase(config, context) {
            const result = {};
            if (config.suppressTaskName !== undefined) {
                result.suppressTaskName = !!config.suppressTaskName;
            }
            if (config.promptOnClose !== undefined) {
                result.promptOnClose = !!config.promptOnClose;
            }
            if (config.problemMatcher) {
                result.problemMatcher = ProblemMatcherConverter.from(config.problemMatcher, context).value;
            }
            return result;
        }
        Globals.fromBase = fromBase;
        function isEmpty(value) {
            return !value || value.command === undefined && value.promptOnClose === undefined && value.suppressTaskName === undefined;
        }
        Globals.isEmpty = isEmpty;
        function assignProperties(target, source) {
            if (isEmpty(source)) {
                return target;
            }
            if (isEmpty(target)) {
                return source;
            }
            assignProperty(target, source, 'promptOnClose');
            assignProperty(target, source, 'suppressTaskName');
            return target;
        }
        Globals.assignProperties = assignProperties;
        function fillDefaults(value, context) {
            if (!value) {
                return;
            }
            CommandConfiguration.fillDefaults(value.command, context);
            if (value.suppressTaskName === undefined) {
                value.suppressTaskName = (context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */);
            }
            if (value.promptOnClose === undefined) {
                value.promptOnClose = true;
            }
        }
        Globals.fillDefaults = fillDefaults;
        function freeze(value) {
            Object.freeze(value);
            if (value.command) {
                CommandConfiguration.freeze(value.command);
            }
        }
        Globals.freeze = freeze;
    })(Globals || (Globals = {}));
    var ExecutionEngine;
    (function (ExecutionEngine) {
        function from(config) {
            const runner = config.runner || config._runner;
            let result;
            if (runner) {
                switch (runner) {
                    case 'terminal':
                        result = Tasks.ExecutionEngine.Terminal;
                        break;
                    case 'process':
                        result = Tasks.ExecutionEngine.Process;
                        break;
                }
            }
            const schemaVersion = JsonSchemaVersion.from(config);
            if (schemaVersion === 1 /* Tasks.JsonSchemaVersion.V0_1_0 */) {
                return result || Tasks.ExecutionEngine.Process;
            }
            else if (schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */) {
                return Tasks.ExecutionEngine.Terminal;
            }
            else {
                throw new Error('Shouldn\'t happen.');
            }
        }
        ExecutionEngine.from = from;
    })(ExecutionEngine || (exports.ExecutionEngine = ExecutionEngine = {}));
    var JsonSchemaVersion;
    (function (JsonSchemaVersion) {
        const _default = 2 /* Tasks.JsonSchemaVersion.V2_0_0 */;
        function from(config) {
            const version = config.version;
            if (!version) {
                return _default;
            }
            switch (version) {
                case '0.1.0':
                    return 1 /* Tasks.JsonSchemaVersion.V0_1_0 */;
                case '2.0.0':
                    return 2 /* Tasks.JsonSchemaVersion.V2_0_0 */;
                default:
                    return _default;
            }
        }
        JsonSchemaVersion.from = from;
    })(JsonSchemaVersion || (exports.JsonSchemaVersion = JsonSchemaVersion = {}));
    class UUIDMap {
        constructor(other) {
            this.current = Object.create(null);
            if (other) {
                for (const key of Object.keys(other.current)) {
                    const value = other.current[key];
                    if (Array.isArray(value)) {
                        this.current[key] = value.slice();
                    }
                    else {
                        this.current[key] = value;
                    }
                }
            }
        }
        start() {
            this.last = this.current;
            this.current = Object.create(null);
        }
        getUUID(identifier) {
            const lastValue = this.last ? this.last[identifier] : undefined;
            let result = undefined;
            if (lastValue !== undefined) {
                if (Array.isArray(lastValue)) {
                    result = lastValue.shift();
                    if (lastValue.length === 0) {
                        delete this.last[identifier];
                    }
                }
                else {
                    result = lastValue;
                    delete this.last[identifier];
                }
            }
            if (result === undefined) {
                result = UUID.generateUuid();
            }
            const currentValue = this.current[identifier];
            if (currentValue === undefined) {
                this.current[identifier] = result;
            }
            else {
                if (Array.isArray(currentValue)) {
                    currentValue.push(result);
                }
                else {
                    const arrayValue = [currentValue];
                    arrayValue.push(result);
                    this.current[identifier] = arrayValue;
                }
            }
            return result;
        }
        finish() {
            this.last = undefined;
        }
    }
    exports.UUIDMap = UUIDMap;
    var TaskConfigSource;
    (function (TaskConfigSource) {
        TaskConfigSource[TaskConfigSource["TasksJson"] = 0] = "TasksJson";
        TaskConfigSource[TaskConfigSource["WorkspaceFile"] = 1] = "WorkspaceFile";
        TaskConfigSource[TaskConfigSource["User"] = 2] = "User";
    })(TaskConfigSource || (exports.TaskConfigSource = TaskConfigSource = {}));
    class ConfigurationParser {
        constructor(workspaceFolder, workspace, platform, problemReporter, uuidMap) {
            this.workspaceFolder = workspaceFolder;
            this.workspace = workspace;
            this.platform = platform;
            this.problemReporter = problemReporter;
            this.uuidMap = uuidMap;
        }
        run(fileConfig, source, contextKeyService) {
            const engine = ExecutionEngine.from(fileConfig);
            const schemaVersion = JsonSchemaVersion.from(fileConfig);
            const context = {
                workspaceFolder: this.workspaceFolder,
                workspace: this.workspace,
                problemReporter: this.problemReporter,
                uuidMap: this.uuidMap,
                namedProblemMatchers: {},
                engine,
                schemaVersion,
                platform: this.platform,
                taskLoadIssues: [],
                contextKeyService
            };
            const taskParseResult = this.createTaskRunnerConfiguration(fileConfig, context, source);
            return {
                validationStatus: this.problemReporter.status,
                custom: taskParseResult.custom,
                configured: taskParseResult.configured,
                engine
            };
        }
        createTaskRunnerConfiguration(fileConfig, context, source) {
            const globals = Globals.from(fileConfig, context);
            if (this.problemReporter.status.isFatal()) {
                return { custom: [], configured: [] };
            }
            context.namedProblemMatchers = ProblemMatcherConverter.namedFrom(fileConfig.declares, context);
            let globalTasks = undefined;
            let externalGlobalTasks = undefined;
            if (fileConfig.windows && context.platform === 3 /* Platform.Windows */) {
                globalTasks = TaskParser.from(fileConfig.windows.tasks, globals, context, source).custom;
                externalGlobalTasks = fileConfig.windows.tasks;
            }
            else if (fileConfig.osx && context.platform === 1 /* Platform.Mac */) {
                globalTasks = TaskParser.from(fileConfig.osx.tasks, globals, context, source).custom;
                externalGlobalTasks = fileConfig.osx.tasks;
            }
            else if (fileConfig.linux && context.platform === 2 /* Platform.Linux */) {
                globalTasks = TaskParser.from(fileConfig.linux.tasks, globals, context, source).custom;
                externalGlobalTasks = fileConfig.linux.tasks;
            }
            if (context.schemaVersion === 2 /* Tasks.JsonSchemaVersion.V2_0_0 */ && globalTasks && globalTasks.length > 0 && externalGlobalTasks && externalGlobalTasks.length > 0) {
                const taskContent = [];
                for (const task of externalGlobalTasks) {
                    taskContent.push(JSON.stringify(task, null, 4));
                }
                context.problemReporter.error(nls.localize({ key: 'TaskParse.noOsSpecificGlobalTasks', comment: ['\"Task version 2.0.0\" refers to the 2.0.0 version of the task system. The \"version 2.0.0\" is not localizable as it is a json key and value.'] }, 'Task version 2.0.0 doesn\'t support global OS specific tasks. Convert them to a task with a OS specific command. Affected tasks are:\n{0}', taskContent.join('\n')));
            }
            let result = { custom: [], configured: [] };
            if (fileConfig.tasks) {
                result = TaskParser.from(fileConfig.tasks, globals, context, source);
            }
            if (globalTasks) {
                result.custom = TaskParser.assignTasks(result.custom, globalTasks);
            }
            if ((!result.custom || result.custom.length === 0) && (globals.command && globals.command.name)) {
                const matchers = ProblemMatcherConverter.from(fileConfig.problemMatcher, context).value ?? [];
                const isBackground = fileConfig.isBackground ? !!fileConfig.isBackground : fileConfig.isWatching ? !!fileConfig.isWatching : undefined;
                const name = Tasks.CommandString.value(globals.command.name);
                const task = new Tasks.CustomTask(context.uuidMap.getUUID(name), Object.assign({}, source, { config: { index: -1, element: fileConfig, workspaceFolder: context.workspaceFolder } }), name, Tasks.CUSTOMIZED_TASK_TYPE, {
                    name: undefined,
                    runtime: undefined,
                    presentation: undefined,
                    suppressTaskName: true
                }, false, { reevaluateOnRerun: true }, {
                    name: name,
                    identifier: name,
                    group: Tasks.TaskGroup.Build,
                    isBackground: isBackground,
                    problemMatchers: matchers
                });
                const taskGroupKind = GroupKind.from(fileConfig.group);
                if (taskGroupKind !== undefined) {
                    task.configurationProperties.group = taskGroupKind;
                }
                else if (fileConfig.group === 'none') {
                    task.configurationProperties.group = undefined;
                }
                CustomTask.fillGlobals(task, globals);
                CustomTask.fillDefaults(task, context);
                result.custom = [task];
            }
            result.custom = result.custom || [];
            result.configured = result.configured || [];
            return result;
        }
    }
    const uuidMaps = new Map();
    const recentUuidMaps = new Map();
    function parse(workspaceFolder, workspace, platform, configuration, logger, source, contextKeyService, isRecents = false) {
        const recentOrOtherMaps = isRecents ? recentUuidMaps : uuidMaps;
        let selectedUuidMaps = recentOrOtherMaps.get(source);
        if (!selectedUuidMaps) {
            recentOrOtherMaps.set(source, new Map());
            selectedUuidMaps = recentOrOtherMaps.get(source);
        }
        let uuidMap = selectedUuidMaps.get(workspaceFolder.uri.toString());
        if (!uuidMap) {
            uuidMap = new UUIDMap();
            selectedUuidMaps.set(workspaceFolder.uri.toString(), uuidMap);
        }
        try {
            uuidMap.start();
            return (new ConfigurationParser(workspaceFolder, workspace, platform, logger, uuidMap)).run(configuration, source, contextKeyService);
        }
        finally {
            uuidMap.finish();
        }
    }
    function createCustomTask(contributedTask, configuredProps) {
        return CustomTask.createCustomTask(contributedTask, configuredProps);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza0NvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rhc2tzL2NvbW1vbi90YXNrQ29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrbUVoRyxzQkFrQkM7SUFJRCw0Q0FFQztJQWptRUQsSUFBa0IsWUFlakI7SUFmRCxXQUFrQixZQUFZO1FBQzdCOztXQUVHO1FBQ0gsbURBQVUsQ0FBQTtRQUVWOztXQUVHO1FBQ0gsbURBQVUsQ0FBQTtRQUVWOztXQUVHO1FBQ0gsK0NBQVEsQ0FBQTtJQUNULENBQUMsRUFmaUIsWUFBWSw0QkFBWixZQUFZLFFBZTdCO0lBMkdELElBQWlCLGVBQWUsQ0FLL0I7SUFMRCxXQUFpQixlQUFlO1FBQy9CLFNBQWdCLEVBQUUsQ0FBQyxLQUFVO1lBQzVCLE1BQU0sU0FBUyxHQUFvQixLQUFLLENBQUM7WUFDekMsT0FBTyxTQUFTLEtBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFIZSxrQkFBRSxLQUdqQixDQUFBO0lBQ0YsQ0FBQyxFQUxnQixlQUFlLCtCQUFmLGVBQWUsUUFLL0I7SUF3RUQsSUFBaUIsYUFBYSxDQWM3QjtJQWRELFdBQWlCLGFBQWE7UUFDN0IsU0FBZ0IsS0FBSyxDQUFDLEtBQW9CO1lBQ3pDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMzQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7aUJBQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZ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