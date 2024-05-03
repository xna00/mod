/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/workbench/contrib/tasks/common/problemMatcher", "./jsonSchemaCommon"], function (require, exports, nls, Objects, problemMatcher_1, jsonSchemaCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schema = {
        oneOf: [
            {
                allOf: [
                    {
                        type: 'object',
                        required: ['version'],
                        properties: {
                            version: {
                                type: 'string',
                                enum: ['0.1.0'],
                                deprecationMessage: nls.localize('JsonSchema.version.deprecated', 'Task version 0.1.0 is deprecated. Please use 2.0.0'),
                                description: nls.localize('JsonSchema.version', 'The config\'s version number')
                            },
                            _runner: {
                                deprecationMessage: nls.localize('JsonSchema._runner', 'The runner has graduated. Use the official runner property')
                            },
                            runner: {
                                type: 'string',
                                enum: ['process', 'terminal'],
                                default: 'process',
                                description: nls.localize('JsonSchema.runner', 'Defines whether the task is executed as a process and the output is shown in the output window or inside the terminal.')
                            },
                            windows: {
                                $ref: '#/definitions/taskRunnerConfiguration',
                                description: nls.localize('JsonSchema.windows', 'Windows specific command configuration')
                            },
                            osx: {
                                $ref: '#/definitions/taskRunnerConfiguration',
                                description: nls.localize('JsonSchema.mac', 'Mac specific command configuration')
                            },
                            linux: {
                                $ref: '#/definitions/taskRunnerConfiguration',
                                description: nls.localize('JsonSchema.linux', 'Linux specific command configuration')
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
    const shellCommand = {
        type: 'boolean',
        default: true,
        description: nls.localize('JsonSchema.shell', 'Specifies whether the command is a shell command or an external program. Defaults to false if omitted.')
    };
    schema.definitions = Objects.deepClone(jsonSchemaCommon_1.default.definitions);
    const definitions = schema.definitions;
    definitions['commandConfiguration']['properties']['isShellCommand'] = Objects.deepClone(shellCommand);
    definitions['taskDescription']['properties']['isShellCommand'] = Objects.deepClone(shellCommand);
    definitions['taskRunnerConfiguration']['properties']['isShellCommand'] = Objects.deepClone(shellCommand);
    Object.getOwnPropertyNames(definitions).forEach(key => {
        const newKey = key + '1';
        definitions[newKey] = definitions[key];
        delete definitions[key];
    });
    function fixReferences(literal) {
        if (Array.isArray(literal)) {
            literal.forEach(fixReferences);
        }
        else if (typeof literal === 'object') {
            if (literal['$ref']) {
                literal['$ref'] = literal['$ref'] + '1';
            }
            Object.getOwnPropertyNames(literal).forEach(property => {
                const value = literal[property];
                if (Array.isArray(value) || typeof value === 'object') {
                    fixReferences(value);
                }
            });
        }
    }
    fixReferences(schema);
    problemMatcher_1.ProblemMatcherRegistry.onReady().then(() => {
        try {
            const matcherIds = problemMatcher_1.ProblemMatcherRegistry.keys().map(key => '$' + key);
            definitions.problemMatcherType1.oneOf[0].enum = matcherIds;
            definitions.problemMatcherType1.oneOf[2].items.anyOf[1].enum = matcherIds;
        }
        catch (err) {
            console.log('Installing problem matcher ids failed');
        }
    });
    exports.default = schema;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvblNjaGVtYV92MS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvY29tbW9uL2pzb25TY2hlbWFfdjEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsTUFBTSxNQUFNLEdBQWdCO1FBQzNCLEtBQUssRUFBRTtZQUNOO2dCQUNDLEtBQUssRUFBRTtvQkFDTjt3QkFDQyxJQUFJLEVBQUUsUUFBUTt3QkFDZCxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUM7d0JBQ3JCLFVBQVUsRUFBRTs0QkFDWCxPQUFPLEVBQUU7Z0NBQ1IsSUFBSSxFQUFFLFFBQVE7Z0NBQ2QsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDO2dDQUNmLGtCQUFrQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsK0JBQStCLEVBQUUsb0RBQW9ELENBQUM7Z0NBQ3ZILFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLDhCQUE4QixDQUFDOzZCQUMvRTs0QkFDRCxPQUFPLEVBQUU7Z0NBQ1Isa0JBQWtCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSw0REFBNEQsQ0FBQzs2QkFDcEg7NEJBQ0QsTUFBTSxFQUFFO2dDQUNQLElBQUksRUFBRSxRQUFRO2dDQUNkLElBQUksRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUM7Z0NBQzdCLE9BQU8sRUFBRSxTQUFTO2dDQUNsQixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSx3SEFBd0gsQ0FBQzs2QkFDeEs7NEJBQ0QsT0FBTyxFQUFFO2dDQUNSLElBQUksRUFBRSx1Q0FBdUM7Z0NBQzdDLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLHdDQUF3QyxDQUFD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