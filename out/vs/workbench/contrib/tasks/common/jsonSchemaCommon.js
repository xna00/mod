/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/contrib/tasks/common/problemMatcher"], function (require, exports, nls, problemMatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schema = {
        definitions: {
            showOutputType: {
                type: 'string',
                enum: ['always', 'silent', 'never']
            },
            options: {
                type: 'object',
                description: nls.localize('JsonSchema.options', 'Additional command options'),
                properties: {
                    cwd: {
                        type: 'string',
                        description: nls.localize('JsonSchema.options.cwd', 'The current working directory of the executed program or script. If omitted Code\'s current workspace root is used.')
                    },
                    env: {
                        type: 'object',
                        additionalProperties: {
                            type: 'string'
                        },
                        description: nls.localize('JsonSchema.options.env', 'The environment of the executed program or shell. If omitted the parent process\' environment is used.')
                    }
                },
                additionalProperties: {
                    type: ['string', 'array', 'object']
                }
            },
            problemMatcherType: {
                oneOf: [
                    {
                        type: 'string',
                        errorMessage: nls.localize('JsonSchema.tasks.matcherError', 'Unrecognized problem matcher. Is the extension that contributes this problem matcher installed?')
                    },
                    problemMatcher_1.Schemas.LegacyProblemMatcher,
                    {
                        type: 'array',
                        items: {
                            anyOf: [
                                {
                                    type: 'string',
                                    errorMessage: nls.localize('JsonSchema.tasks.matcherError', 'Unrecognized problem matcher. Is the extension that contributes this problem matcher installed?')
                                },
                                problemMatcher_1.Schemas.LegacyProblemMatcher
                            ]
                        }
                    }
                ]
            },
            shellConfiguration: {
                type: 'object',
                additionalProperties: false,
                description: nls.localize('JsonSchema.shellConfiguration', 'Configures the shell to be used.'),
                properties: {
                    executable: {
                        type: 'string',
                        description: nls.localize('JsonSchema.shell.executable', 'The shell to be used.')
                    },
                    args: {
                        type: 'array',
                        description: nls.localize('JsonSchema.shell.args', 'The shell arguments.'),
                        items: {
                            type: 'string'
                        }
                    }
                }
            },
            commandConfiguration: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    command: {
                        type: 'string',
                        description: nls.localize('JsonSchema.command', 'The command to be executed. Can be an external program or a shell command.')
                    },
                    args: {
                        type: 'array',
                        description: nls.localize('JsonSchema.tasks.args', 'Arguments passed to the command when this task is invoked.'),
                        items: {
                            type: 'string'
                        }
                    },
                    options: {
                        $ref: '#/definitions/options'
                    }
                }
            },
            taskDescription: {
                type: 'object',
                required: ['taskName'],
                additionalProperties: false,
                properties: {
                    taskName: {
                        type: 'string',
                        description: nls.localize('JsonSchema.tasks.taskName', "The task's name")
                    },
                    command: {
                        type: 'string',
                        description: nls.localize('JsonSchema.command', 'The command to be executed. Can be an external program or a shell command.')
                    },
                    args: {
                        type: 'array',
                        description: nls.localize('JsonSchema.tasks.args', 'Arguments passed to the command when this task is invoked.'),
                        items: {
                            type: 'string'
                        }
                    },
                    options: {
                        $ref: '#/definitions/options'
                    },
                    windows: {
                        anyOf: [
                            {
                                $ref: '#/definitions/commandConfiguration',
                                description: nls.localize('JsonSchema.tasks.windows', 'Windows specific command configuration'),
                            },
                            {
                                properties: {
                                    problemMatcher: {
                                        $ref: '#/definitions/problemMatcherType',
                                        description: nls.localize('JsonSchema.tasks.matchers', 'The problem matcher(s) to use. Can either be a string or a problem matcher definition or an array of strings and problem matchers.')
                                    }
                                }
                            }
                        ]
                    },
                    osx: {
                        anyOf: [
                            {
                                $ref: '#/definitions/commandConfiguration',
                                description: nls.localize('JsonSchema.tasks.mac', 'Mac specific command configuration')
                            },
                            {
                                properties: {
                                    problemMatcher: {
                                        $ref: '#/definitions/problemMatcherType',
                                        description: nls.localize('JsonSchema.tasks.matchers', 'The problem matcher(s) to use. Can either be a string or a problem matcher definition or an array of strings and problem matchers.')
                                    }
                                }
                            }
                        ]
                    },
                    linux: {
                        anyOf: [
                            {
                                $ref: '#/definitions/commandConfiguration',
                                description: nls.localize('JsonSchema.tasks.linux', 'Linux specific command configuration')
                            },
                            {
                                properties: {
                                    problemMatcher: {
                                        $ref: '#/definitions/problemMatcherType',
                                        description: nls.localize('JsonSchema.tasks.matchers', 'The problem matcher(s) to use. Can either be a string or a problem matcher definition or an array of strings and problem matchers.')
                                    }
                                }
                            }
                        ]
                    },
                    suppressTaskName: {
                        type: 'boolean',
                        description: nls.localize('JsonSchema.tasks.suppressTaskName', 'Controls whether the task name is added as an argument to the command. If omitted the globally defined value is used.'),
                        default: true
                    },
                    showOutput: {
                        $ref: '#/definitions/showOutputType',
                        description: nls.localize('JsonSchema.tasks.showOutput', 'Controls whether the output of the running task is shown or not. If omitted the globally defined value is used.')
                    },
                    echoCommand: {
                        type: 'boolean',
                        description: nls.localize('JsonSchema.echoCommand', 'Controls whether the executed command is echoed to the output. Default is false.'),
                        default: true
                    },
                    isWatching: {
                        type: 'boolean',
                        deprecationMessage: nls.localize('JsonSchema.tasks.watching.deprecation', 'Deprecated. Use isBackground instead.'),
                        description: nls.localize('JsonSchema.tasks.watching', 'Whether the executed task is kept alive and is watching the file system.'),
                        default: true
                    },
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
                    isBuildCommand: {
                        type: 'boolean',
                        description: nls.localize('JsonSchema.tasks.build', 'Maps this task to Code\'s default build command.'),
                        default: true
                    },
                    isTestCommand: {
                        type: 'boolean',
                        description: nls.localize('JsonSchema.tasks.test', 'Maps this task to Code\'s default test command.'),
                        default: true
                    },
                    problemMatcher: {
                        $ref: '#/definitions/problemMatcherType',
                        description: nls.localize('JsonSchema.tasks.matchers', 'The problem matcher(s) to use. Can either be a string or a problem matcher definition or an array of strings and problem matchers.')
                    }
                }
            },
            taskRunnerConfiguration: {
                type: 'object',
                required: [],
                properties: {
                    command: {
                        type: 'string',
                        description: nls.localize('JsonSchema.command', 'The command to be executed. Can be an external program or a shell command.')
                    },
                    args: {
                        type: 'array',
                        description: nls.localize('JsonSchema.args', 'Additional arguments passed to the command.'),
                        items: {
                            type: 'string'
                        }
                    },
                    options: {
                        $ref: '#/definitions/options'
                    },
                    showOutput: {
                        $ref: '#/definitions/showOutputType',
                        description: nls.localize('JsonSchema.showOutput', 'Controls whether the output of the running task is shown or not. If omitted \'always\' is used.')
                    },
                    isWatching: {
                        type: 'boolean',
                        deprecationMessage: nls.localize('JsonSchema.watching.deprecation', 'Deprecated. Use isBackground instead.'),
                        description: nls.localize('JsonSchema.watching', 'Whether the executed task is kept alive and is watching the file system.'),
                        default: true
                    },
                    isBackground: {
                        type: 'boolean',
                        description: nls.localize('JsonSchema.background', 'Whether the executed task is kept alive and is running in the background.'),
                        default: true
                    },
                    promptOnClose: {
                        type: 'boolean',
                        description: nls.localize('JsonSchema.promptOnClose', 'Whether the user is prompted when VS Code closes with a running background task.'),
                        default: false
                    },
                    echoCommand: {
                        type: 'boolean',
                        description: nls.localize('JsonSchema.echoCommand', 'Controls whether the executed command is echoed to the output. Default is false.'),
                        default: true
                    },
                    suppressTaskName: {
                        type: 'boolean',
                        description: nls.localize('JsonSchema.suppressTaskName', 'Controls whether the task name is added as an argument to the command. Default is false.'),
                        default: true
                    },
                    taskSelector: {
                        type: 'string',
                        description: nls.localize('JsonSchema.taskSelector', 'Prefix to indicate that an argument is task.')
                    },
                    problemMatcher: {
                        $ref: '#/definitions/problemMatcherType',
                        description: nls.localize('JsonSchema.matchers', 'The problem matcher(s) to use. Can either be a string or a problem matcher definition or an array of strings and problem matchers.')
                    },
                    tasks: {
                        type: 'array',
                        description: nls.localize('JsonSchema.tasks', 'The task configurations. Usually these are enrichments of task already defined in the external task runner.'),
                        items: {
                            type: 'object',
                            $ref: '#/definitions/taskDescription'
                        }
                    }
                }
            }
        }
    };
    exports.default = schema;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvblNjaGVtYUNvbW1vbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvY29tbW9uL2pzb25TY2hlbWFDb21tb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsTUFBTSxNQUFNLEdBQWdCO1FBQzNCLFdBQVcsRUFBRTtZQUNaLGNBQWMsRUFBRTtnQkFDZixJQUFJLEVBQUUsUUFBUTtnQkFDZCxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQzthQUNuQztZQUNELE9BQU8sRUFBRTtnQkFDUixJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSw0QkFBNEIsQ0FBQztnQkFDN0UsVUFBVSxFQUFFO29CQUNYLEdBQUcsRUFBRTt3QkFDSixJQUFJLEVBQUUsUUFBUTt3QkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxxSEFBcUgsQ0FBQztxQkFDMUs7b0JBQ0QsR0FBRyxFQUFFO3dCQUNKLElBQUksRUFBRSxRQUFRO3dCQUNkLG9CQUFvQixFQUFFOzRCQUNyQixJQUFJLEVBQUUsUUFBUTt5QkFDZDt3QkFDRCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSx3R0FBd0csQ0FBQztxQkFDN0o7aUJBQ0Q7Z0JBQ0Qsb0JBQW9CLEVBQUU7b0JBQ3JCLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDO2lCQUNuQzthQUNEO1lBQ0Qsa0JBQWtCLEVBQUU7Z0JBQ25CLEtBQUssRUFBRTtvQkFDTjt3QkFDQyxJQUFJLEVBQUUsUUFBUTt3QkFDZCxZQUFZLEVBQUUsR0FBRyxDQUFDLFFBQVEs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