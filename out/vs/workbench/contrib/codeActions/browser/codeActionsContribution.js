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
define(["require", "exports", "vs/base/common/event", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/editor/common/config/editorConfigurationSchema", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/common/types", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform"], function (require, exports, event_1, hierarchicalKind_1, lifecycle_1, editorConfigurationSchema_1, codeAction_1, types_1, nls, configurationRegistry_1, keybinding_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionsContribution = exports.editorConfiguration = void 0;
    const createCodeActionsAutoSave = (description) => {
        return {
            type: 'string',
            enum: ['always', 'explicit', 'never', true, false],
            enumDescriptions: [
                nls.localize('alwaysSave', 'Triggers Code Actions on explicit saves and auto saves triggered by window or focus changes.'),
                nls.localize('explicitSave', 'Triggers Code Actions only when explicitly saved'),
                nls.localize('neverSave', 'Never triggers Code Actions on save'),
                nls.localize('explicitSaveBoolean', 'Triggers Code Actions only when explicitly saved. This value will be deprecated in favor of "explicit".'),
                nls.localize('neverSaveBoolean', 'Never triggers Code Actions on save. This value will be deprecated in favor of "never".')
            ],
            default: 'explicit',
            description: description
        };
    };
    const codeActionsOnSaveDefaultProperties = Object.freeze({
        'source.fixAll': createCodeActionsAutoSave(nls.localize('codeActionsOnSave.fixAll', "Controls whether auto fix action should be run on file save.")),
    });
    const codeActionsOnSaveSchema = {
        oneOf: [
            {
                type: 'object',
                properties: codeActionsOnSaveDefaultProperties,
                additionalProperties: {
                    type: 'string'
                },
            },
            {
                type: 'array',
                items: { type: 'string' }
            }
        ],
        markdownDescription: nls.localize('editor.codeActionsOnSave', 'Run Code Actions for the editor on save. Code Actions must be specified and the editor must not be shutting down. Example: `"source.organizeImports": "explicit" `'),
        type: ['object', 'array'],
        additionalProperties: {
            type: 'string',
            enum: ['always', 'explicit', 'never', true, false],
        },
        default: {},
        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
    };
    exports.editorConfiguration = Object.freeze({
        ...editorConfigurationSchema_1.editorConfigurationBaseNode,
        properties: {
            'editor.codeActionsOnSave': codeActionsOnSaveSchema
        }
    });
    let CodeActionsContribution = class CodeActionsContribution extends lifecycle_1.Disposable {
        constructor(codeActionsExtensionPoint, keybindingService) {
            super();
            this._contributedCodeActions = [];
            this._onDidChangeContributions = this._register(new event_1.Emitter());
            codeActionsExtensionPoint.setHandler(extensionPoints => {
                this._contributedCodeActions = extensionPoints.flatMap(x => x.value).filter(x => Array.isArray(x.actions));
                this.updateConfigurationSchema(this._contributedCodeActions);
                this._onDidChangeContributions.fire();
            });
            keybindingService.registerSchemaContribution({
                getSchemaAdditions: () => this.getSchemaAdditions(),
                onDidChange: this._onDidChangeContributions.event,
            });
        }
        updateConfigurationSchema(codeActionContributions) {
            const newProperties = { ...codeActionsOnSaveDefaultProperties };
            for (const [sourceAction, props] of this.getSourceActions(codeActionContributions)) {
                newProperties[sourceAction] = createCodeActionsAutoSave(nls.localize('codeActionsOnSave.generic', "Controls whether '{0}' actions should be run on file save.", props.title));
            }
            codeActionsOnSaveSchema.properties = newProperties;
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
                .notifyConfigurationSchemaUpdated(exports.editorConfiguration);
        }
        getSourceActions(contributions) {
            const defaultKinds = Object.keys(codeActionsOnSaveDefaultProperties).map(value => new hierarchicalKind_1.HierarchicalKind(value));
            const sourceActions = new Map();
            for (const contribution of contributions) {
                for (const action of contribution.actions) {
                    const kind = new hierarchicalKind_1.HierarchicalKind(action.kind);
                    if (types_1.CodeActionKind.Source.contains(kind)
                        // Exclude any we already included by default
                        && !defaultKinds.some(defaultKind => defaultKind.contains(kind))) {
                        sourceActions.set(kind.value, action);
                    }
                }
            }
            return sourceActions;
        }
        getSchemaAdditions() {
            const conditionalSchema = (command, actions) => {
                return {
                    if: {
                        required: ['command'],
                        properties: {
                            'command': { const: command }
                        }
                    },
                    then: {
                        properties: {
                            'args': {
                                required: ['kind'],
                                properties: {
                                    'kind': {
                                        anyOf: [
                                            {
                                                enum: actions.map(action => action.kind),
                                                enumDescriptions: actions.map(action => action.description ?? action.title),
                                            },
                                            { type: 'string' },
                                        ]
                                    }
                                }
                            }
                        }
                    }
                };
            };
            const getActions = (ofKind) => {
                const allActions = this._contributedCodeActions.flatMap(desc => desc.actions);
                const out = new Map();
                for (const action of allActions) {
                    if (!out.has(action.kind) && ofKind.contains(new hierarchicalKind_1.HierarchicalKind(action.kind))) {
                        out.set(action.kind, action);
                    }
                }
                return Array.from(out.values());
            };
            return [
                conditionalSchema(codeAction_1.codeActionCommandId, getActions(hierarchicalKind_1.HierarchicalKind.Empty)),
                conditionalSchema(codeAction_1.refactorCommandId, getActions(types_1.CodeActionKind.Refactor)),
                conditionalSchema(codeAction_1.sourceActionCommandId, getActions(types_1.CodeActionKind.Source)),
            ];
        }
    };
    exports.CodeActionsContribution = CodeActionsContribution;
    exports.CodeActionsContribution = CodeActionsContribution = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], CodeActionsContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbnNDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVBY3Rpb25zL2Jyb3dzZXIvY29kZUFjdGlvbnNDb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJoRyxNQUFNLHlCQUF5QixHQUFHLENBQUMsV0FBbUIsRUFBZSxFQUFFO1FBQ3RFLE9BQU87WUFDTixJQUFJLEVBQUUsUUFBUTtZQUNkLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUM7WUFDbEQsZ0JBQWdCLEVBQUU7Z0JBQ2pCLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLDhGQUE4RixDQUFDO2dCQUMxSCxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxrREFBa0QsQ0FBQztnQkFDaEYsR0FBRyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUscUNBQXFDLENBQUM7Z0JBQ2hFLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUseUdBQXlHLENBQUM7Z0JBQzlJLEdBQUcsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUseUZBQXlGLENBQUM7YUFDM0g7WUFDRCxPQUFPLEVBQUUsVUFBVTtZQUNuQixXQUFXLEVBQUUsV0FBVztTQUN4QixDQUFDO0lBQ0gsQ0FBQyxDQUFDO0lBRUYsTUFBTSxrQ0FBa0MsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFpQjtRQUN4RSxlQUFlLEVBQUUseUJBQXlCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSw4REFBOEQsQ0FBQyxDQUFDO0tBQ3BKLENBQUMsQ0FBQztJQUVILE1BQU0sdUJBQXVCLEdBQWlDO1FB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