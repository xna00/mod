/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/language/common/languageService"], function (require, exports, nls, languageService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.documentationExtensionPointDescriptor = void 0;
    var DocumentationExtensionPointFields;
    (function (DocumentationExtensionPointFields) {
        DocumentationExtensionPointFields["when"] = "when";
        DocumentationExtensionPointFields["title"] = "title";
        DocumentationExtensionPointFields["command"] = "command";
    })(DocumentationExtensionPointFields || (DocumentationExtensionPointFields = {}));
    const documentationExtensionPointSchema = Object.freeze({
        type: 'object',
        description: nls.localize('contributes.documentation', "Contributed documentation."),
        properties: {
            'refactoring': {
                type: 'array',
                description: nls.localize('contributes.documentation.refactorings', "Contributed documentation for refactorings."),
                items: {
                    type: 'object',
                    description: nls.localize('contributes.documentation.refactoring', "Contributed documentation for refactoring."),
                    required: [
                        DocumentationExtensionPointFields.title,
                        DocumentationExtensionPointFields.when,
                        DocumentationExtensionPointFields.command
                    ],
                    properties: {
                        [DocumentationExtensionPointFields.title]: {
                            type: 'string',
                            description: nls.localize('contributes.documentation.refactoring.title', "Label for the documentation used in the UI."),
                        },
                        [DocumentationExtensionPointFields.when]: {
                            type: 'string',
                            description: nls.localize('contributes.documentation.refactoring.when', "When clause."),
                        },
                        [DocumentationExtensionPointFields.command]: {
                            type: 'string',
                            description: nls.localize('contributes.documentation.refactoring.command', "Command executed."),
                        },
                    },
                }
            }
        }
    });
    exports.documentationExtensionPointDescriptor = {
        extensionPoint: 'documentation',
        deps: [languageService_1.languagesExtPoint],
        jsonSchema: documentationExtensionPointSchema
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRhdGlvbkV4dGVuc2lvblBvaW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlQWN0aW9ucy9jb21tb24vZG9jdW1lbnRhdGlvbkV4dGVuc2lvblBvaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxJQUFLLGlDQUlKO0lBSkQsV0FBSyxpQ0FBaUM7UUFDckMsa0RBQWEsQ0FBQTtRQUNiLG9EQUFlLENBQUE7UUFDZix3REFBbUIsQ0FBQTtJQUNwQixDQUFDLEVBSkksaUNBQWlDLEtBQWpDLGlDQUFpQyxRQUlyQztJQVlELE1BQU0saUNBQWlDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBK0I7UUFDckYsSUFBSSxFQUFFLFFBQVE7UUFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSw0QkFBNEIsQ0FBQztRQUNwRixVQUFVLEVBQUU7WUFDWCxhQUFhLEVBQUU7Z0JBQ2QsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsd0NBQXdDLEVBQUUsNkNBQTZDLENBQUM7Z0JBQ2xILEtBQUssRUFBRTtvQkFDTixJQUFJLEVBQUUsUUFBUTtvQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRSw0Q0FBNEMsQ0FBQztvQkFDaEgsUUFBUSxFQUFFO3dCQUNULGlDQUFpQyxDQUFDLEtBQUs7d0JBQ3ZDLGlDQUFpQyxDQUFDLElBQUk7d0JBQ3RDLGlDQUFpQyxDQUFDLE9BQU87cUJBQ3pDO29CQUNELFVBQVUsRUFBRTt3QkFDWCxDQUFDLGlDQUFpQyxDQUFDLEtBQUssQ0FBQyxFQUFFOzRCQUMxQyxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw2Q0FBNkMsRUFBRSw2Q0FBNkMsQ0FBQzt5QkFDdkg7d0JBQ0QsQ0FBQyxpQ0FBaUMsQ0FBQyxJQUFJLENBQUMsRUFBRTs0QkFDekMsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsNENBQTRDLEVBQUUsY0FBYyxDQUFDO3lCQUN2Rjt3QkFDRCxDQUFDLGlDQUFpQyxDQUFDLE9BQU8sQ0FBQyxFQUFFOzRCQUM1QyxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywrQ0FBK0MsRUFBRSxtQkFBbUIsQ0FBQzt5QkFDL0Y7cUJBQ0Q7aUJBQ0Q7YUFDRDtTQUNEO0tBQ0QsQ0FBQyxDQUFDO0lBRVUsUUFBQSxxQ0FBcUMsR0FBRztRQUNwRCxjQUFjLEVBQUUsZUFBZTtRQUMvQixJQUFJLEVBQUUsQ0FBQyxtQ0FBaUIsQ0FBQztRQUN6QixVQUFVLEVBQUUsaUNBQWlDO0tBQzdDLENBQUMifQ==