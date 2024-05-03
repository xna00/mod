/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/language/common/languageService", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/base/common/lifecycle", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform", "vs/base/common/htmlContent"], function (require, exports, nls, languageService_1, extensionFeatures_1, lifecycle_1, descriptors_1, platform_1, htmlContent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.codeActionsExtensionPointDescriptor = void 0;
    var CodeActionExtensionPointFields;
    (function (CodeActionExtensionPointFields) {
        CodeActionExtensionPointFields["languages"] = "languages";
        CodeActionExtensionPointFields["actions"] = "actions";
        CodeActionExtensionPointFields["kind"] = "kind";
        CodeActionExtensionPointFields["title"] = "title";
        CodeActionExtensionPointFields["description"] = "description";
    })(CodeActionExtensionPointFields || (CodeActionExtensionPointFields = {}));
    const codeActionsExtensionPointSchema = Object.freeze({
        type: 'array',
        markdownDescription: nls.localize('contributes.codeActions', "Configure which editor to use for a resource."),
        items: {
            type: 'object',
            required: [CodeActionExtensionPointFields.languages, CodeActionExtensionPointFields.actions],
            properties: {
                [CodeActionExtensionPointFields.languages]: {
                    type: 'array',
                    description: nls.localize('contributes.codeActions.languages', "Language modes that the code actions are enabled for."),
                    items: { type: 'string' }
                },
                [CodeActionExtensionPointFields.actions]: {
                    type: 'object',
                    required: [CodeActionExtensionPointFields.kind, CodeActionExtensionPointFields.title],
                    properties: {
                        [CodeActionExtensionPointFields.kind]: {
                            type: 'string',
                            markdownDescription: nls.localize('contributes.codeActions.kind', "`CodeActionKind` of the contributed code action."),
                        },
                        [CodeActionExtensionPointFields.title]: {
                            type: 'string',
                            description: nls.localize('contributes.codeActions.title', "Label for the code action used in the UI."),
                        },
                        [CodeActionExtensionPointFields.description]: {
                            type: 'string',
                            description: nls.localize('contributes.codeActions.description', "Description of what the code action does."),
                        },
                    }
                }
            }
        }
    });
    exports.codeActionsExtensionPointDescriptor = {
        extensionPoint: 'codeActions',
        deps: [languageService_1.languagesExtPoint],
        jsonSchema: codeActionsExtensionPointSchema
    };
    class CodeActionsTableRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.codeActions;
        }
        render(manifest) {
            const codeActions = manifest.contributes?.codeActions || [];
            if (!codeActions.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const flatActions = codeActions.map(contribution => contribution.actions.map(action => ({ ...action, languages: contribution.languages }))).flat();
            const headers = [
                nls.localize('codeActions.title', "Title"),
                nls.localize('codeActions.kind', "Kind"),
                nls.localize('codeActions.description', "Description"),
                nls.localize('codeActions.languages', "Languages")
            ];
            const rows = flatActions.sort((a, b) => a.title.localeCompare(b.title))
                .map(action => {
                return [
                    action.title,
                    new htmlContent_1.MarkdownString().appendMarkdown(`\`${action.kind}\``),
                    action.description ?? '',
                    new htmlContent_1.MarkdownString().appendMarkdown(`${action.languages.map(lang => `\`${lang}\``).join('&nbsp;')}`),
                ];
            });
            return {
                data: {
                    headers,
                    rows
                },
                dispose: () => { }
            };
        }
    }
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'codeActions',
        label: nls.localize('codeactions', "Code Actions"),
        access: {
            canToggle: false,
        },
        renderer: new descriptors_1.SyncDescriptor(CodeActionsTableRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbnNFeHRlbnNpb25Qb2ludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUFjdGlvbnMvY29tbW9uL2NvZGVBY3Rpb25zRXh0ZW5zaW9uUG9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLElBQUssOEJBTUo7SUFORCxXQUFLLDhCQUE4QjtRQUNsQyx5REFBdUIsQ0FBQTtRQUN2QixxREFBbUIsQ0FBQTtRQUNuQiwrQ0FBYSxDQUFBO1FBQ2IsaURBQWUsQ0FBQTtRQUNmLDZEQUEyQixDQUFBO0lBQzVCLENBQUMsRUFOSSw4QkFBOEIsS0FBOUIsOEJBQThCLFFBTWxDO0lBYUQsTUFBTSwrQkFBK0IsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUErQjtRQUNuRixJQUFJLEVBQUUsT0FBTztRQUNiLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMseUJBQXlCLEVBQUUsK0NBQStDLENBQUM7UUFDN0csS0FBSyxFQUFFO1lBQ04sSUFBSSxFQUFFLFFBQVE7WUFDZCxRQUFRLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQyxTQUFTLEVBQUUsOEJBQThCLENBQUMsT0FBTyxDQUFDO1lBQzVGLFVBQVUsRUFBRTtnQkFDWCxDQUFDLDhCQUE4QixDQUFDLFNBQVMsQ0FBQyxFQUFFO29CQUMzQyxJQUFJLEVBQUUsT0FBTztvQkFDYixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQ0FBbUMsRUFBRSx1REFBdUQsQ0FBQztvQkFDdkgsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtpQkFDekI7Z0JBQ0QsQ0FBQyw4QkFBOEIsQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDekMsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsUUFBUSxFQUFFLENBQUMs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