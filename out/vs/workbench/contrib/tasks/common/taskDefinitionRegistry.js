/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/objects", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/contextkey/common/contextkey", "vs/base/common/event"], function (require, exports, nls, Types, Objects, extensionsRegistry_1, contextkey_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskDefinitionRegistry = void 0;
    const taskDefinitionSchema = {
        type: 'object',
        additionalProperties: false,
        properties: {
            type: {
                type: 'string',
                description: nls.localize('TaskDefinition.description', 'The actual task type. Please note that types starting with a \'$\' are reserved for internal usage.')
            },
            required: {
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            properties: {
                type: 'object',
                description: nls.localize('TaskDefinition.properties', 'Additional properties of the task type'),
                additionalProperties: {
                    $ref: 'http://json-schema.org/draft-07/schema#'
                }
            },
            when: {
                type: 'string',
                markdownDescription: nls.localize('TaskDefinition.when', 'Condition which must be true to enable this type of task. Consider using `shellExecutionSupported`, `processExecutionSupported`, and `customExecutionSupported` as appropriate for this task definition. See the [API documentation](https://code.visualstudio.com/api/extension-guides/task-provider#when-clause) for more information.'),
                default: ''
            }
        }
    };
    var Configuration;
    (function (Configuration) {
        function from(value, extensionId, messageCollector) {
            if (!value) {
                return undefined;
            }
            const taskType = Types.isString(value.type) ? value.type : undefined;
            if (!taskType || taskType.length === 0) {
                messageCollector.error(nls.localize('TaskTypeConfiguration.noType', 'The task type configuration is missing the required \'taskType\' property'));
                return undefined;
            }
            const required = [];
            if (Array.isArray(value.required)) {
                for (const element of value.required) {
                    if (Types.isString(element)) {
                        required.push(element);
                    }
                }
            }
            return {
                extensionId: extensionId.value,
                taskType, required: required,
                properties: value.properties ? Objects.deepClone(value.properties) : {},
                when: value.when ? contextkey_1.ContextKeyExpr.deserialize(value.when) : undefined
            };
        }
        Configuration.from = from;
    })(Configuration || (Configuration = {}));
    const taskDefinitionsExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'taskDefinitions',
        activationEventsGenerator: (contributions, result) => {
            for (const task of contributions) {
                if (task.type) {
                    result.push(`onTaskType:${task.type}`);
                }
            }
        },
        jsonSchema: {
            description: nls.localize('TaskDefinitionExtPoint', 'Contributes task kinds'),
            type: 'array',
            items: taskDefinitionSchema
        }
    });
    class TaskDefinitionRegistryImpl {
        constructor() {
            this._onDefinitionsChanged = new event_1.Emitter();
            this.onDefinitionsChanged = this._onDefinitionsChanged.event;
            this.taskTypes = Object.create(null);
            this.readyPromise = new Promise((resolve, reject) => {
                taskDefinitionsExtPoint.setHandler((extensions, delta) => {
                    this._schema = undefined;
                    try {
                        for (const extension of delta.removed) {
                            const taskTypes = extension.value;
                            for (const taskType of taskTypes) {
                                if (this.taskTypes && taskType.type && this.taskTypes[taskType.type]) {
                                    delete this.taskTypes[taskType.type];
                                }
                            }
                        }
                        for (const extension of delta.added) {
                            const taskTypes = extension.value;
                            for (const taskType of taskTypes) {
                                const type = Configuration.from(taskType, extension.description.identifier, extension.collector);
                                if (type) {
                                    this.taskTypes[type.taskType] = type;
                                }
                            }
                        }
                        if ((delta.removed.length > 0) || (delta.added.length > 0)) {
                            this._onDefinitionsChanged.fire();
                        }
                    }
                    catch (error) {
                    }
                    resolve(undefined);
                });
            });
        }
        onReady() {
            return this.readyPromise;
        }
        get(key) {
            return this.taskTypes[key];
        }
        all() {
            return Object.keys(this.taskTypes).map(key => this.taskTypes[key]);
        }
        getJsonSchema() {
            if (this._schema === undefined) {
                const schemas = [];
                for (const definition of this.all()) {
                    const schema = {
                        type: 'object',
                        additionalProperties: false
                    };
                    if (definition.required.length > 0) {
                        schema.required = definition.required.slice(0);
                    }
                    if (definition.properties !== undefined) {
                        schema.properties = Objects.deepClone(definition.properties);
                    }
                    else {
                        schema.properties = Object.create(null);
                    }
                    schema.properties.type = {
                        type: 'string',
                        enum: [definition.taskType]
                    };
                    schemas.push(schema);
                }
                this._schema = { oneOf: schemas };
            }
            return this._schema;
        }
    }
    exports.TaskDefinitionRegistry = new TaskDefinitionRegistryImpl();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza0RlZmluaXRpb25SZWdpc3RyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvY29tbW9uL3Rhc2tEZWZpbml0aW9uUmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JoRyxNQUFNLG9CQUFvQixHQUFnQjtRQUN6QyxJQUFJLEVBQUUsUUFBUTtRQUNkLG9CQUFvQixFQUFFLEtBQUs7UUFDM0IsVUFBVSxFQUFFO1lBQ1gsSUFBSSxFQUFFO2dCQUNMLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLHFHQUFxRyxDQUFDO2FBQzlKO1lBQ0QsUUFBUSxFQUFFO2dCQUNULElBQUksRUFBRSxPQUFPO2dCQUNiLEtBQUssRUFBRTtvQkFDTixJQUFJLEVBQUUsUUFBUTtpQkFDZDthQUNEO1lBQ0QsVUFBVSxFQUFFO2dCQUNYLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLHdDQUF3QyxDQUFDO2dCQUNoRyxvQkFBb0IsRUFBRTtvQkFDckIsSUFBSSxFQUFFLHlDQUF5QztpQkFDL0M7YUFDRDtZQUNELElBQUksRUFBRTtnQkFDTCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLDBVQUEwVSxDQUFDO2dCQUNwWSxPQUFPLEVBQUUsRUFBRTthQUNYO1NBQ0Q7S0FDRCxDQUFDO0lBRUYsSUFBVSxhQUFhLENBZ0N0QjtJQWhDRCxXQUFVLGFBQWE7UUFRdEIsU0FBZ0IsSUFBSSxDQUFDLEtBQXNCLEVBQUUsV0FBZ0MsRUFBRSxnQkFBMkM7WUFDekgsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3JFLElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsOEJBQThCLEVBQUUsMkVBQTJFLENBQUMsQ0FBQyxDQUFDO2dCQUNsSixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1lBQzlCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsS0FBSyxNQUFNLE9BQU8sSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3RDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUM3QixRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN4QixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTztnQkFDTixXQUFXLEVBQUUsV0FBVyxDQUFDLEtBQUs7Z0JBQzlCLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUTtnQkFDNUIsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN2RSxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsMkJBQWMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2FBQ3JFLENBQUM7UUFDSCxDQUFDO1FBdkJlLGtCQUFJLE9BdUJuQixDQUFBO0lBQ0YsQ0FBQyxFQWhDUyxhQUFhLEtBQWIsYUFBYSxRQWdDdEI7SUFHRCxNQUFNLHVCQUF1QixHQUFHLHVDQUFrQixDQUFDLHNCQUFzQixDQUFrQztRQUMxRyxjQUFjLEVBQUUsaUJBQWlCO1FBQ2pDLHlCQUF5QixFQUFFLENBQUMsYUFBOEMsRUFBRSxNQUFvQyxFQUFFLEVBQUU7WUFDbkgsS0FBSyxNQUFNLElBQUksSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUN4QyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFDRCxVQUFVLEVBQUU7WUFDWCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSx3QkFBd0IsQ0FBQztZQUM3RSxJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRSxvQkFBb0I7U0FDM0I7S0FDRCxDQUFDLENBQUM7SUFXSCxNQUFNLDBCQUEwQjtRQVEvQjtZQUhRLDBCQUFxQixHQUFrQixJQUFJLGVBQU8sRUFBRSxDQUFDO1lBQ3RELHlCQUFvQixHQUFnQixJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBRzNFLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUN6RCx1QkFBdUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEVBQUU7b0JBQ3hELElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDO29CQUN6QixJQUFJLENBQUM7d0JBQ0osS0FBSyxNQUFNLFNBQVMsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7NEJBQ3ZDLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUM7NEJBQ2xDLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7Z0NBQ2xDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0NBQ3RFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ3RDLENBQUM7NEJBQ0YsQ0FBQzt3QkFDRixDQUFDO3dCQUNELEtBQUssTUFBTSxTQUFTLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDOzRCQUNyQyxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDOzRCQUNsQyxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO2dDQUNsQyxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7Z0NBQ2pHLElBQUksSUFBSSxFQUFFLENBQUM7b0NBQ1YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDO2dDQUN0QyxDQUFDOzRCQUNGLENBQUM7d0JBQ0YsQ0FBQzt3QkFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUM1RCxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ25DLENBQUM7b0JBQ0YsQ0FBQztvQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNqQixDQUFDO29CQUNELE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDcEIsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxPQUFPO1lBQ2IsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFFTSxHQUFHLENBQUMsR0FBVztZQUNyQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVNLEdBQUc7WUFDVCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRU0sYUFBYTtZQUNuQixJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sT0FBTyxHQUFrQixFQUFFLENBQUM7Z0JBQ2xDLEtBQUssTUFBTSxVQUFVLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7b0JBQ3JDLE1BQU0sTUFBTSxHQUFnQjt3QkFDM0IsSUFBSSxFQUFFLFFBQVE7d0JBQ2Qsb0JBQW9CLEVBQUUsS0FBSztxQkFDM0IsQ0FBQztvQkFDRixJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUNwQyxNQUFNLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNoRCxDQUFDO29CQUNELElBQUksVUFBVSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDekMsTUFBTSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDOUQsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE1BQU0sQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDekMsQ0FBQztvQkFDRCxNQUFNLENBQUMsVUFBVyxDQUFDLElBQUksR0FBRzt3QkFDekIsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztxQkFDM0IsQ0FBQztvQkFDRixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN0QixDQUFDO2dCQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDbkMsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO0tBQ0Q7SUFFWSxRQUFBLHNCQUFzQixHQUE0QixJQUFJLDBCQUEwQixFQUFFLENBQUMifQ==