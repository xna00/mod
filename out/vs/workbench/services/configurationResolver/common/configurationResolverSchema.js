/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.inputsSchema = void 0;
    const idDescription = nls.localize('JsonSchema.input.id', "The input's id is used to associate an input with a variable of the form ${input:id}.");
    const typeDescription = nls.localize('JsonSchema.input.type', "The type of user input prompt to use.");
    const descriptionDescription = nls.localize('JsonSchema.input.description', "The description is shown when the user is prompted for input.");
    const defaultDescription = nls.localize('JsonSchema.input.default', "The default value for the input.");
    exports.inputsSchema = {
        definitions: {
            inputs: {
                type: 'array',
                description: nls.localize('JsonSchema.inputs', 'User inputs. Used for defining user input prompts, such as free string input or a choice from several options.'),
                items: {
                    oneOf: [
                        {
                            type: 'object',
                            required: ['id', 'type', 'description'],
                            additionalProperties: false,
                            properties: {
                                id: {
                                    type: 'string',
                                    description: idDescription
                                },
                                type: {
                                    type: 'string',
                                    description: typeDescription,
                                    enum: ['promptString'],
                                    enumDescriptions: [
                                        nls.localize('JsonSchema.input.type.promptString', "The 'promptString' type opens an input box to ask the user for input."),
                                    ]
                                },
                                description: {
                                    type: 'string',
                                    description: descriptionDescription
                                },
                                default: {
                                    type: 'string',
                                    description: defaultDescription
                                },
                                password: {
                                    type: 'boolean',
                                    description: nls.localize('JsonSchema.input.password', "Controls if a password input is shown. Password input hides the typed text."),
                                },
                            }
                        },
                        {
                            type: 'object',
                            required: ['id', 'type', 'description', 'options'],
                            additionalProperties: false,
                            properties: {
                                id: {
                                    type: 'string',
                                    description: idDescription
                                },
                                type: {
                                    type: 'string',
                                    description: typeDescription,
                                    enum: ['pickString'],
                                    enumDescriptions: [
                                        nls.localize('JsonSchema.input.type.pickString', "The 'pickString' type shows a selection list."),
                                    ]
                                },
                                description: {
                                    type: 'string',
                                    description: descriptionDescription
                                },
                                default: {
                                    type: 'string',
                                    description: defaultDescription
                                },
                                options: {
                                    type: 'array',
                                    description: nls.localize('JsonSchema.input.options', "An array of strings that defines the options for a quick pick."),
                                    items: {
                                        oneOf: [
                                            {
                                                type: 'string'
                                            },
                                            {
                                                type: 'object',
                                                required: ['value'],
                                                additionalProperties: false,
                                                properties: {
                                                    label: {
                                                        type: 'string',
                                                        description: nls.localize('JsonSchema.input.pickString.optionLabel', "Label for the option.")
                                                    },
                                                    value: {
                                                        type: 'string',
                                                        description: nls.localize('JsonSchema.input.pickString.optionValue', "Value for the option.")
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            type: 'object',
                            required: ['id', 'type', 'command'],
                            additionalProperties: false,
                            properties: {
                                id: {
                                    type: 'string',
                                    description: idDescription
                                },
                                type: {
                                    type: 'string',
                                    description: typeDescription,
                                    enum: ['command'],
                                    enumDescriptions: [
                                        nls.localize('JsonSchema.input.type.command', "The 'command' type executes a command."),
                                    ]
                                },
                                command: {
                                    type: 'string',
                                    description: nls.localize('JsonSchema.input.command.command', "The command to execute for this input variable.")
                                },
                                args: {
                                    oneOf: [
                                        {
                                            type: 'object',
                                            description: nls.localize('JsonSchema.input.command.args', "Optional arguments passed to the command.")
                                        },
                                        {
                                            type: 'array',
                                            description: nls.localize('JsonSchema.input.command.args', "Optional arguments passed to the command.")
                                        },
                                        {
                                            type: 'string',
                                            description: nls.localize('JsonSchema.input.command.args', "Optional arguments passed to the command.")
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvblJlc29sdmVyU2NoZW1hLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvY29uZmlndXJhdGlvblJlc29sdmVyL2NvbW1vbi9jb25maWd1cmF0aW9uUmVzb2x2ZXJTY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsdUZBQXVGLENBQUMsQ0FBQztJQUNuSixNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUFFLHVDQUF1QyxDQUFDLENBQUM7SUFDdkcsTUFBTSxzQkFBc0IsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDhCQUE4QixFQUFFLCtEQUErRCxDQUFDLENBQUM7SUFDN0ksTUFBTSxrQkFBa0IsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDBCQUEwQixFQUFFLGtDQUFrQyxDQUFDLENBQUM7SUFHM0YsUUFBQSxZQUFZLEdBQWdCO1FBQ3hDLFdBQVcsRUFBRTtZQUNaLE1BQU0sRUFBRTtnQkFDUCxJQUFJLEVBQUUsT0FBTztnQkFDYixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxnSEFBZ0gsQ0FBQztnQkFDaEssS0FBSyxFQUFFO29CQUNOLEtBQUssRUFBRTt3QkFDTjs0QkFDQyxJQUFJLEVBQUUsUUFBUTs0QkFDZCxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBQzs0QkFDdkMsb0JBQW9CLEVBQUUsS0FBSzs0QkFDM0IsVUFBVSxFQUFFO2dDQUNYLEVBQUUsRUFBRTtvQ0FDSCxJQUFJLEVBQUUsUUFBUTtvQ0FDZCxXQUFXLEVBQUUsYUFBYTtpQ0FDMUI7Z0NB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