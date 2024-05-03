/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "./jsonSchemaCommon", "vs/workbench/contrib/tasks/common/problemMatcher", "./taskDefinitionRegistry", "vs/workbench/services/configurationResolver/common/configurationResolverUtils", "vs/workbench/services/configurationResolver/common/configurationResolverSchema", "vs/base/common/codicons"], function (require, exports, nls, Objects, jsonSchemaCommon_1, problemMatcher_1, taskDefinitionRegistry_1, ConfigurationResolverUtils, configurationResolverSchema_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.updateTaskDefinitions = updateTaskDefinitions;
    exports.updateProblemMatchers = updateProblemMatchers;
    function fixReferences(literal) {
        if (Array.isArray(literal)) {
            literal.forEach(fixReferences);
        }
        else if (typeof literal === 'object') {
            if (literal['$ref']) {
                literal['$ref'] = literal['$ref'] + '2';
            }
            Object.getOwnPropertyNames(literal).forEach(property => {
                const value = literal[property];
                if (Array.isArray(value) || typeof value === 'object') {
                    fixReferences(value);
                }
            });
        }
    }
    const shellCommand = {
        anyOf: [
            {
                type: 'boolean',
                default: true,
                description: nls.localize('JsonSchema.shell', 'Specifies whether the command is a shell command or an external program. Defaults to false if omitted.')
            },
            {
                $ref: '#/definitions/shellConfiguration'
            }
        ],
        deprecationMessage: nls.localize('JsonSchema.tasks.isShellCommand.deprecated', 'The property isShellCommand is deprecated. Use the type property of the task and the shell property in the options instead. See also the 1.14 release notes.')
    };
    const hide = {
        type: 'boolean',
        description: nls.localize('JsonSchema.hide', 'Hide this task from the run task quick pick'),
        default: true
    };
    const taskIdentifier = {
        type: 'object',
        additionalProperties: true,
        properties: {
            type: {
                type: 'string',
                description: nls.localize('JsonSchema.tasks.dependsOn.identifier', 'The task identifier.')
            }
        }
    };
    const dependsOn = {
        anyOf: [
            {
                type: 'string',
                description: nls.localize('JsonSchema.tasks.dependsOn.string', 'Another task this task depends on.')
            },
            taskIdentifier,
            {
                type: 'array',
                description: nls.localize('JsonSchema.tasks.dependsOn.array', 'The other tasks this task depends on.'),
                items: {
                    anyOf: [
                        {
                            type: 'string',
                        },
                        taskIdentifier
                    ]
                }
            }
        ],
        description: nls.localize('JsonSchema.tasks.dependsOn', 'Either a string representing another task or an array of other tasks that this task depends on.')
    };
    const dependsOrder = {
        type: 'string',
        enum: ['parallel', 'sequence'],
        enumDescriptions: [
            nls.localize('JsonSchema.tasks.dependsOrder.parallel', 'Run all dependsOn tasks in parallel.'),
            nls.localize('JsonSchema.tasks.dependsOrder.sequence', 'Run all dependsOn tasks in sequence.'),
        ],
        default: 'parallel',
        description: nls.localize('JsonSchema.tasks.dependsOrder', 'Determines the order of the dependsOn tasks for this task. Note that this property is not recursive.')
    };
    const detail = {
        type: 'string',
        description: nls.localize('JsonSchema.tasks.detail', 'An optional description of a task that shows in the Run Task quick pick as a detail.')
    };
    const icon = {
        type: 'object',
        description: nls.localize('JsonSchema.tasks.icon', 'An optional icon for the task'),
        properties: {
            id: {
                description: nls.localize('JsonSchema.tasks.icon.id', 'An optional codicon ID to use'),
                type: ['string', 'null'],
                enum: Array.from((0, codicons_1.getAllCodicons)(), icon => icon.id),
                markdownEnumDescriptions: Array.from((0, codicons_1.getAllCodicons)(), icon => `$(${icon.id})`),
            },
            color: {
                description: nls.localize('JsonSchema.tasks.icon.color', 'An optional color of the icon'),
                type: ['string', 'null'],
                enum: [
                    'terminal.ansiBlack',
                    'terminal.ansiRed',
                    'terminal.ansiGreen',
                    'terminal.ansiYellow',
                    'terminal.ansiBlue',
                    'terminal.ansiMagenta',
                    'terminal.ansiCyan',
                    'terminal.ansiWhite'
                ],
            },
        }
    };
    const presentation = {
        type: 'object',
        default: {
            echo: true,
            reveal: 'always',
            focus: false,
            panel: 'shared',
            showReuseMessage: true,
            clear: false,
        },
        description: nls.localize('JsonSchema.tasks.presentation', 'Configures the panel that is used to present the task\'s output and reads its input.'),
        additionalProperties: false,
        properties: {
            echo: {
                type: 'boolean',
                default: true,
                description: nls.localize('JsonSchema.tasks.presentation.echo', 'Controls whether the executed command is echoed to the panel. Default is true.')
            },
            focus: {
                type: 'boolean',
                default: false,
                description: nls.localize('JsonSchema.tasks.presentation.focus', 'Controls whether the panel takes focus. Default is false. If set to true the panel is revealed as well.')
            },
            revealProblems: {
                type: 'string',
                enum: ['always', 'onProblem', 'never'],
                enumDescriptions: [
                    nls.localize('JsonSchema.tasks.presentation.revealProblems.always', 'Always reveals the problems panel when this task is executed.'),
                    nls.localize('JsonSchema.tasks.presentation.revealProblems.onProblem', 'Only reveals the problems panel if a problem is found.'),
                    nls.localize('JsonSchema.tasks.presentation.revealProblems.never', 'Never reveals the problems panel when this task is executed.'),
                ],
                default: 'never',
                description: nls.localize('JsonSchema.tasks.presentation.revealProblems', 'Controls whether the problems panel is revealed when running this task or not. Takes precedence over option \"reveal\". Default is \"never\".')
            },
            reveal: {
                type: 'string',
                enum: ['always', 'silent', 'never'],
                enumDescriptions: [
                    nls.localize('JsonSchema.tasks.presentation.reveal.always', 'Always reveals the terminal when this task is executed.'),
                    nls.localize('JsonSchema.tasks.presentation.reveal.silent', 'Only reveals the terminal if the task exits with an error or the problem matcher finds an error.'),
                    nls.localize('JsonSchema.tasks.presentation.reveal.never', 'Never reveals the terminal when this task is executed.'),
                ],
                default: 'always',
                description: nls.localize('JsonSchema.tasks.presentation.reveal', 'Controls whether the terminal running the task is revealed or not. May be overridden by option \"revealProblems\". Default is \"always\".')
            },
            panel: {
                type: 'string',
                enum: ['shared', 'dedicated', 'new'],
                default: 'shared',
                description: nls.localize('JsonSchema.tasks.presentation.instance', 'Controls if the panel is shared between tasks, dedicated to this task or a new one is created on every run.')
            },
            showReuseMessage: {
                type: 'boolean',
                default: true,
                description: nls.localize('JsonSchema.tasks.presentation.showReuseMessage', 'Controls whether to show the `Terminal will be reused by tasks, press any key to close it` message.')
            },
            clear: {
                type: 'boolean',
                default: false,
                description: nls.localize('JsonSchema.tasks.presentation.clear', 'Controls whether the terminal is cleared before executing the task.')
            },
            group: {
                type: 'string',
                description: nls.localize('JsonSchema.tasks.presentation.group', 'Controls whether the task is executed in a specific terminal group using split panes.')
            },
            close: {
                type: 'boolean',
                description: nls.localize('JsonSchema.tasks.presentation.close', 'Controls whether the terminal the task runs in is closed when the task exits.')
            }
        }
    };
    const terminal = Objects.deepClone(presentation);
    terminal.deprecationMessage = nls.localize('JsonSchema.tasks.terminal', 'The terminal property is deprecated. Use presentation instead');
    const groupStrings = {
        type: 'string',
        enum: [
            'build',
            'test',
            'none'
        ],
        enumDescriptions: [
            nls.localize('JsonSchema.tasks.group.build', 'Marks the task as a build task accessible through the \'Run Build Task\' command.'),
            nls.localize('JsonSchema.tasks.group.test', 'Marks the task as a test task accessible through the \'Run Test Task\' command.'),
            nls.localize('JsonSchema.tasks.group.none', 'Assigns the task to no group')
        ],
        description: nls.localize('JsonSchema.tasks.group.kind', 'The task\'s execution group.')
    };
    const group = {
        oneOf: [
            groupStrings,
            {
                type: 'object',
                properties: {
                    kind: groupStrings,
                    isDefault: {
                        type: ['boolean', 'string'],
                        default: false,
                        description: nls.localize('JsonSchema.tasks.group.isDefault', 'Defines if this task is the default task in the group, or a glob to match the file which should trigger this task.')
                    }
                }
            },
        ],
        defaultSnippets: [
            {
                body: { kind: 'build', isDefault: true },
                description: nls.localize('JsonSchema.tasks.group.defaultBuild', 'Marks the task as the default build task.')
            },
            {
                body: { kind: 'test', isDefault: true },
                description: nls.localize('JsonSchema.tasks.group.defaultTest', 'Marks the task as the default test task.')
            }
        ],
        description: nls.localize('JsonSchema.tasks.group', 'Defines to which execution group this task belongs to. It supports "build" to add it to the build group and "test" to add it to the test group.')
    };
    const taskType = {
        type: 'string',
        enum: ['shell'],
        default: 'process',
        description: nls.localize('JsonSchema.tasks.type', 'Defines whether the task is run as a process or as a command inside a shell.')
    };
    const command = {
        oneOf: [
            {
                oneOf: [
                    {
                        type: 'string'
                    },
                    {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        description: nls.localize('JsonSchema.commandArray', 'The shell command to be executed. Array items will be joined using a space character')
                    }
                ]
            },
            {
                type: 'object',
                required: ['value', 'quoting'],
                properties: {
                    value: {
                        oneOf: [
                            {
                                type: 'string'
                            },
                            {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: nls.localize('JsonSchema.commandArray', 'The shell command to be executed. Array items will be joined using a space character')
                            }
                        ],
                        description: nls.localize('JsonSchema.command.quotedString.value', 'The actual command value')
                    },
                    quoting: {
                        type: 'string',
                        enum: ['escape', 'strong', 'weak'],
                        enumDescriptions: [
                            nls.localize('JsonSchema.tasks.quoting.escape', 'Escapes characters using the shell\'s escape character (e.g. ` under PowerShell and \\ under bash).'),
                            nls.localize('JsonSchema.tasks.quoting.strong', 'Quotes the argument using the shell\'s strong quote character (e.g. \' under PowerShell and bash).'),
                            nls.localize('JsonSchema.tasks.quoting.weak', 'Quotes the argument using the shell\'s weak quote character (e.g. " under PowerShell and bash).'),
                        ],
                        default: 'strong',
                        description: nls.localize('JsonSchema.command.quotesString.quote', 'How the command value should be quoted.')
                    }
                }
            }
        ],
        description: nls.localize('JsonSchema.command', 'The command to be executed. Can be an external program or a shell command.')
    };
    const args = {
        type: 'array',
        items: {
            oneOf: [
                {
                    type: 'string',
                },
                {
                    type: 'object',
                    required: ['value', 'quoting'],
                    properties: {
                        value: {
                            type: 'string',
                            description: nls.localize('JsonSchema.args.quotedString.value', 'The actual argument value')
                        },
                        quoting: {
                            type: 'string',
                            enum: ['escape', 'strong', 'weak'],
                            enumDescriptions: [
                                nls.localize('JsonSchema.tasks.quoting.escape', 'Escapes characters using the shell\'s escape character (e.g. ` under PowerShell and \\ under bash).'),
                                nls.localize('JsonSchema.tasks.quoting.strong', 'Quotes the argument using the shell\'s strong quote character (e.g. \' under PowerShell and bash).'),
                                nls.localize('JsonSchema.tasks.quoting.weak', 'Quotes the argument using the shell\'s weak quote character (e.g. " under PowerShell and bash).'),
                            ],
                            default: 'strong',
                            description: nls.localize('JsonSchema.args.quotesString.quote', 'How the argument value should be quoted.')
                        }
                    }
                }
            ]
        },
        description: nls.localize('JsonSchema.tasks.args', 'Arguments passed to the command when this task is invoked.')
    };
    const label = {
        type: 'string',
        description: nls.localize('JsonSchema.tasks.label', "The task's user interface label")
    };
    const version = {
        type: 'string',
        enum: ['2.0.0'],
        description: nls.localize('JsonSchema.version', 'The config\'s version number.')
    };
    const identifier = {
        type: 'string',
        description: nls.localize('JsonSchema.tasks.identifier', 'A user defined identifier to reference the task in launch.json or a dependsOn clause.'),
        deprecationMessage: nls.localize('JsonSchema.tasks.identifier.deprecated', 'User defined identifiers are deprecated. For custom task use the name as a reference and for tasks provided by extensions use their defined task identifier.')
    };
    const runOptions = {
        type: 'object',
        additionalProperties: false,
        properties: {
            reevaluateOnRerun: {
                type: 'boolean',
                description: nls.localize('JsonSchema.tasks.reevaluateOnRerun', 'Whether to reevaluate task variables on rerun.'),
                default: true
            },
            runOn: {
                type: 'string',
                enum: ['default', 'folderOpen'],
                description: nls.localize('JsonSchema.tasks.runOn', 'Configures when the task should be run. If set to folderOpen, then the task will be run automatically when the folder is opened.'),
                default: 'default'
            },
            instanceLimit: {
                type: 'number',
                description: nls.localize('JsonSchema.tasks.instanceLimit', 'The number of instances of the task that are allowed to run simultaneously.'),
                default: 1
            },
        },
        description: nls.localize('JsonSchema.tasks.runOptions', 'The task\'s run related options')
    };
    const commonSchemaDefinitions = jsonSchemaCommon_1.default.definitions;
    const options = Objects.deepClone(commonSchemaDefinitions.options);
    const optionsProperties = options.properties;
    optionsProperties.shell = Objects.deepClone(commonSchemaDefinitions.shellConfiguration);
    const taskConfiguration = {
        type: 'object',
        additionalProperties: false,
        properties: {
            label: {
                type: 'string',
                description: nls.localize('JsonSchema.tasks.taskLabel', "The task's label")
            },
            taskName: {
                type: 'string',
                description: nls.localize('JsonSchema.tasks.taskName', 'The task\'s name'),
                deprecationMessage: nls.localize('JsonSchema.tasks.taskName.deprecated', 'The task\'s name property is deprecated. Use the label property instead.')
            },
            identifier: Objects.deepClone(identifier),
            group: Objects.deepClone(group),
            isBackground: {
                type: 'boolean',
                description: nls.localize('JsonSchema.tasks.background', 'Whether the executed task is kept alive and is running in the background.'),
                default: true
            },
            promptOnClose: {
                type: 'boolean',
                description: nls.localize('JsonSchema.tasks.promptOnClose', 'Whether the user is prompted when VS Code closes with a running task.'),
                default: false
            },
            presentation: Objects.deepClone(presentation),
            icon: Objects.deepClone(icon),
            hide: Objects.deepClone(hide),
            options: options,
            problemMatcher: {
                $ref: '#/definitions/problemMatcherType',
                description: nls.localize('JsonSchema.tasks.matchers', 'The problem matcher(s) to use. Can either be a string or a problem matcher definition or an array of strings and problem matchers.')
            },
            runOptions: Objects.deepClone(runOptions),
            dependsOn: Objects.deepClone(dependsOn),
            dependsOrder: Objects.deepClone(dependsOrder),
            detail: Objects.deepClone(detail),
        }
    };
    const taskDefinitions = [];
    taskDefinitionRegistry_1.TaskDefinitionRegistry.onReady().then(() => {
        updateTaskDefinitions();
    });
    function updateTaskDefinitions() {
        for (const taskType of taskDefinitionRegistry_1.TaskDefinitionRegistry.all()) {
            // Check that we haven't already added this task type
            if (taskDefinitions.find(schema => {
                return schema.properties?.type?.enum?.find ? schema.properties?.type.enum.find(element => element === taskType.taskType) : undefined;
            })) {
                continue;
            }
            const schema = Objects.deepClone(taskConfiguration);
            const schemaProperties = schema.properties;
            // Since we do this after the schema is assigned we need to patch the refs.
            schemaProperties.type = {
                type: 'string',
                description: nls.localize('JsonSchema.customizations.customizes.type', 'The task type to customize'),
                enum: [taskType.taskType]
            };
            if (taskType.required) {
                schema.required = taskType.required.slice();
            }
            else {
                schema.required = [];
            }
            // Customized tasks require that the task type be set.
            schema.required.push('type');
            if (taskType.properties) {
                for (const key of Object.keys(taskType.properties)) {
                    const property = taskType.properties[key];
                    schemaProperties[key] = Objects.deepClone(property);
                }
            }
            fixReferences(schema);
            taskDefinitions.push(schema);
        }
    }
    const customize = Objects.deepClone(taskConfiguration);
    customize.properties.customize = {
        type: 'string',
        deprecationMessage: nls.localize('JsonSchema.tasks.customize.deprecated', 'The customize property is deprecated. See the 1.14 release notes on how to migrate to the new task customization approach')
    };
    if (!customize.required) {
        customize.required = [];
    }
    customize.required.push('customize');
    taskDefinitions.push(customize);
    const definitions = Objects.deepClone(commonSchemaDefinitions);
    const taskDescription = definitions.taskDescription;
    taskDescription.required = ['label'];
    const taskDescriptionProperties = taskDescription.properties;
    taskDescriptionProperties.label = Objects.deepClone(label);
    taskDescriptionProperties.command = Objects.deepClone(command);
    taskDescriptionProperties.args = Objects.deepClone(args);
    taskDescriptionProperties.isShellCommand = Objects.deepClone(shellCommand);
    taskDescriptionProperties.dependsOn = dependsOn;
    taskDescriptionProperties.hide = Objects.deepClone(hide);
    taskDescriptionProperties.dependsOrder = dependsOrder;
    taskDescriptionProperties.identifier = Objects.deepClone(identifier);
    taskDescriptionProperties.type = Objects.deepClone(taskType);
    taskDescriptionProperties.presentation = Objects.deepClone(presentation);
    taskDescriptionProperties.terminal = terminal;
    taskDescriptionProperties.icon = Objects.deepClone(icon);
    taskDescriptionProperties.group = Objects.deepClone(group);
    taskDescriptionProperties.runOptions = Objects.deepClone(runOptions);
    taskDescriptionProperties.detail = detail;
    taskDescriptionProperties.taskName.deprecationMessage = nls.localize('JsonSchema.tasks.taskName.deprecated', 'The task\'s name property is deprecated. Use the label property instead.');
    // Clone the taskDescription for process task before setting a default to prevent two defaults #115281
    const processTask = Objects.deepClone(taskDescription);
    taskDescription.default = {
        label: 'My Task',
        type: 'shell',
        command: 'echo Hello',
        problemMatcher: []
    };
    definitions.showOutputType.deprecationMessage = nls.localize('JsonSchema.tasks.showOutput.deprecated', 'The property showOutput is deprecated. Use the reveal property inside the presentation property instead. See also the 1.14 release notes.');
    taskDescriptionProperties.echoCommand.deprecationMessage = nls.localize('JsonSchema.tasks.echoCommand.deprecated', 'The property echoCommand is deprecated. Use the echo property inside the presentation property instead. See also the 1.14 release notes.');
    taskDescriptionProperties.suppressTaskName.deprecationMessage = nls.localize('JsonSchema.tasks.suppressTaskName.deprecated', 'The property suppressTaskName is deprecated. Inline the command with its arguments into the task instead. See also the 1.14 release notes.');
    taskDescriptionProperties.isBuildCommand.deprecationMessage = nls.localize('JsonSchema.tasks.isBuildCommand.deprecated', 'The property isBuildCommand is deprecated. Use the group property instead. See also the 1.14 release notes.');
    taskDescriptionProperties.isTestCommand.deprecationMessage = nls.localize('JsonSchema.tasks.isTestCommand.deprecated', 'The property isTestCommand is deprecated. Use the group property instead. See also the 1.14 release notes.');
    // Process tasks are almost identical schema-wise to shell tasks, but they are required to have a command
    processTask.properties.type = {
        type: 'string',
        enum: ['process'],
        default: 'process',
        description: nls.localize('JsonSchema.tasks.type', 'Defines whether the task is run as a process or as a command inside a shell.')
    };
    processTask.required.push('command');
    processTask.required.push('type');
    taskDefinitions.push(processTask);
    taskDefinitions.push({
        $ref: '#/definitions/taskDescription'
    });
    const definitionsTaskRunnerConfigurationProperties = definitions.taskRunnerConfiguration.properties;
    const tasks = definitionsTaskRunnerConfigurationProperties.tasks;
    tasks.items = {
        oneOf: taskDefinitions
    };
    definitionsTaskRunnerConfigurationProperties.inputs = configurationResolverSchema_1.inputsSchema.definitions.inputs;
    definitions.commandConfiguration.properties.isShellCommand = Objects.deepClone(shellCommand);
    definitions.commandConfiguration.properties.args = Objects.deepClone(args);
    definitions.options.properties.shell = {
        $ref: '#/definitions/shellConfiguration'
    };
    definitionsTaskRunnerConfigurationProperties.isShellCommand = Objects.deepClone(shellCommand);
    definitionsTaskRunnerConfigurationProperties.type = Objects.deepClone(taskType);
    definitionsTaskRunnerConfigurationProperties.group = Objects.deepClone(group);
    definitionsTaskRunnerConfigurationProperties.presentation = Objects.deepClone(presentation);
    definitionsTaskRunnerConfigurationProperties.suppressTaskName.deprecationMessage = nls.localize('JsonSchema.tasks.suppressTaskName.deprecated', 'The property suppressTaskName is deprecated. Inline the command with its arguments into the task instead. See also the 1.14 release notes.');
    definitionsTaskRunnerConfigurationProperties.taskSelector.deprecationMessage = nls.localize('JsonSchema.tasks.taskSelector.deprecated', 'The property taskSelector is deprecated. Inline the command with its arguments into the task instead. See also the 1.14 release notes.');
    const osSpecificTaskRunnerConfiguration = Objects.deepClone(definitions.taskRunnerConfiguration);
    delete osSpecificTaskRunnerConfiguration.properties.tasks;
    osSpecificTaskRunnerConfiguration.additionalProperties = false;
    definitions.osSpecificTaskRunnerConfiguration = osSpecificTaskRunnerConfiguration;
    definitionsTaskRunnerConfigurationProperties.version = Objects.deepClone(version);
    const schema = {
        oneOf: [
            {
                'allOf': [
                    {
                        type: 'object',
                        required: ['version'],
                        properties: {
                            version: Objects.deepClone(version),
                            windows: {
                                '$ref': '#/definitions/osSpecificTaskRunnerConfiguration',
                                'description': nls.localize('JsonSchema.windows', 'Windows specific command configuration')
                            },
                            osx: {
                                '$ref': '#/definitions/osSpecificTaskRunnerConfiguration',
                                'description': nls.localize('JsonSchema.mac', 'Mac specific command configuration')
                            },
                            linux: {
                                '$ref': '#/definitions/osSpecificTaskRunnerConfiguration',
                                'description': nls.localize('JsonSchema.linux', 'Linux specific command configuration')
                            }
                        }
                    },
                    {
                        $ref: '#/definitions/taskRunnerConfiguration'
                    }
                ]
            }
        ]
    };
    schema.definitions = definitions;
    function deprecatedVariableMessage(schemaMap, property) {
        const mapAtProperty = schemaMap[property].properties;
        if (mapAtProperty) {
            Object.keys(mapAtProperty).forEach(name => {
                deprecatedVariableMessage(mapAtProperty, name);
            });
        }
        else {
            ConfigurationResolverUtils.applyDeprecatedVariableMessage(schemaMap[property]);
        }
    }
    Object.getOwnPropertyNames(definitions).forEach(key => {
        const newKey = key + '2';
        definitions[newKey] = definitions[key];
        delete definitions[key];
        deprecatedVariableMessage(definitions, newKey);
    });
    fixReferences(schema);
    function updateProblemMatchers() {
        try {
            const matcherIds = problemMatcher_1.ProblemMatcherRegistry.keys().map(key => '$' + key);
            definitions.problemMatcherType2.oneOf[0].enum = matcherIds;
            definitions.problemMatcherType2.oneOf[2].items.anyOf[0].enum = matcherIds;
        }
        catch (err) {
            console.log('Installing problem matcher ids failed');
        }
    }
    problemMatcher_1.ProblemMatcherRegistry.onReady().then(() => {
        updateProblemMatchers();
    });
    exports.default = schema;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvblNjaGVtYV92Mi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvY29tbW9uL2pzb25TY2hlbWFfdjIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUErYWhHLHNEQWlDQztJQXNLRCxzREFRQztJQWhuQkQsU0FBUyxhQUFhLENBQUMsT0FBWTtRQUNsQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUM1QixPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7YUFBTSxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ3hDLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ3pDLENBQUM7WUFDRCxNQUFNLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUN0RCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2hDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDdkQsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN0QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQU0sWUFBWSxHQUFnQjtRQUNqQyxLQUFLLEVBQUU7WUFDTjtnQkFDQyxJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsSUFBSTtnQkFDYixXQUFX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