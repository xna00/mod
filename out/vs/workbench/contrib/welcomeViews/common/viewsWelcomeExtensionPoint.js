/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.viewsWelcomeExtensionPointDescriptor = exports.ViewIdentifierMap = exports.ViewsWelcomeExtensionPointFields = void 0;
    var ViewsWelcomeExtensionPointFields;
    (function (ViewsWelcomeExtensionPointFields) {
        ViewsWelcomeExtensionPointFields["view"] = "view";
        ViewsWelcomeExtensionPointFields["contents"] = "contents";
        ViewsWelcomeExtensionPointFields["when"] = "when";
        ViewsWelcomeExtensionPointFields["group"] = "group";
        ViewsWelcomeExtensionPointFields["enablement"] = "enablement";
    })(ViewsWelcomeExtensionPointFields || (exports.ViewsWelcomeExtensionPointFields = ViewsWelcomeExtensionPointFields = {}));
    exports.ViewIdentifierMap = {
        'explorer': 'workbench.explorer.emptyView',
        'debug': 'workbench.debug.welcome',
        'scm': 'workbench.scm',
        'testing': 'workbench.view.testing'
    };
    const viewsWelcomeExtensionPointSchema = Object.freeze({
        type: 'array',
        description: nls.localize('contributes.viewsWelcome', "Contributed views welcome content. Welcome content will be rendered in tree based views whenever they have no meaningful content to display, ie. the File Explorer when no folder is open. Such content is useful as in-product documentation to drive users to use certain features before they are available. A good example would be a `Clone Repository` button in the File Explorer welcome view."),
        items: {
            type: 'object',
            description: nls.localize('contributes.viewsWelcome.view', "Contributed welcome content for a specific view."),
            required: [
                ViewsWelcomeExtensionPointFields.view,
                ViewsWelcomeExtensionPointFields.contents
            ],
            properties: {
                [ViewsWelcomeExtensionPointFields.view]: {
                    anyOf: [
                        {
                            type: 'string',
                            description: nls.localize('contributes.viewsWelcome.view.view', "Target view identifier for this welcome content. Only tree based views are supported.")
                        },
                        {
                            type: 'string',
                            description: nls.localize('contributes.viewsWelcome.view.view', "Target view identifier for this welcome content. Only tree based views are supported."),
                            enum: Object.keys(exports.ViewIdentifierMap)
                        }
                    ]
                },
                [ViewsWelcomeExtensionPointFields.contents]: {
                    type: 'string',
                    description: nls.localize('contributes.viewsWelcome.view.contents', "Welcome content to be displayed. The format of the contents is a subset of Markdown, with support for links only."),
                },
                [ViewsWelcomeExtensionPointFields.when]: {
                    type: 'string',
                    description: nls.localize('contributes.viewsWelcome.view.when', "Condition when the welcome content should be displayed."),
                },
                [ViewsWelcomeExtensionPointFields.group]: {
                    type: 'string',
                    description: nls.localize('contributes.viewsWelcome.view.group', "Group to which this welcome content belongs. Proposed API."),
                },
                [ViewsWelcomeExtensionPointFields.enablement]: {
                    type: 'string',
                    description: nls.localize('contributes.viewsWelcome.view.enablement', "Condition when the welcome content buttons and command links should be enabled."),
                },
            }
        }
    });
    exports.viewsWelcomeExtensionPointDescriptor = {
        extensionPoint: 'viewsWelcome',
        jsonSchema: viewsWelcomeExtensionPointSchema
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3NXZWxjb21lRXh0ZW5zaW9uUG9pbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlbGNvbWVWaWV3cy9jb21tb24vdmlld3NXZWxjb21lRXh0ZW5zaW9uUG9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLElBQVksZ0NBTVg7SUFORCxXQUFZLGdDQUFnQztRQUMzQyxpREFBYSxDQUFBO1FBQ2IseURBQXFCLENBQUE7UUFDckIsaURBQWEsQ0FBQTtRQUNiLG1EQUFlLENBQUE7UUFDZiw2REFBeUIsQ0FBQTtJQUMxQixDQUFDLEVBTlcsZ0NBQWdDLGdEQUFoQyxnQ0FBZ0MsUUFNM0M7SUFZWSxRQUFBLGlCQUFpQixHQUE4QjtRQUMzRCxVQUFVLEVBQUUsOEJBQThCO1FBQzFDLE9BQU8sRUFBRSx5QkFBeUI7UUFDbEMsS0FBSyxFQUFFLGVBQWU7UUFDdEIsU0FBUyxFQUFFLHdCQUF3QjtLQUNuQyxDQUFDO0lBRUYsTUFBTSxnQ0FBZ0MsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUErQjtRQUNwRixJQUFJLEVBQUUsT0FBTztRQUNiLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDBCQUEwQixFQUFFLHdZQUF3WSxDQUFDO1FBQy9iLEtBQUssRUFBRTtZQUNOLElBQUksRUFBRSxRQUFRO1lBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsK0JBQStCLEVBQUUsa0RBQWtELENBQUM7WUFDOUcsUUFBUSxFQUFFO2dCQUNULGdDQUFnQyxDQUFDLElBQUk7Z0JBQ3JDLGdDQUFnQyxDQUFDLFFBQVE7YUFDekM7WUFDRCxVQUFVLEVBQUU7Z0JBQ1gsQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDeEMsS0FBSyxFQUFFO3dCQUNOOzRCQUNDLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG9DQUFvQyxFQUFFLHVGQUF1RixDQUFDO3lCQUN4Sjt3QkFDRDs0QkFDQyxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxvQ0FBb0MsRUFBRSx1RkFBdUYsQ0FBQzs0QkFDeEosSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMseUJBQWlCLENBQUM7eUJBQ3BDO3FCQUNEO2lCQUNEO2dCQUNELENBQUMsZ0NBQWdDLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQzVDLElBQUksRUFBRSxRQUFRO29CQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHdDQUF3QyxFQUFFLG1IQUFtSCxDQUFDO2lCQUN4TDtnQkFDRCxDQUFDLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN4QyxJQUFJLEVBQUUsUUFBUTtvQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxvQ0FBb0MsRUFBRSx5REFBeUQsQ0FBQztpQkFDMUg7Z0JBQ0QsQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDekMsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMscUNBQXFDLEVBQUUsNERBQTRELENBQUM7aUJBQzlIO2dCQUNELENBQUMsZ0NBQWdDLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQzlDLElBQUksRUFBRSxRQUFRO29CQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDBDQUEwQyxFQUFFLGlGQUFpRixDQUFDO2lCQUN4SjthQUNEO1NBQ0Q7S0FDRCxDQUFDLENBQUM7SUFFVSxRQUFBLG9DQUFvQyxHQUFHO1FBQ25ELGNBQWMsRUFBRSxjQUFjO1FBQzlCLFVBQVUsRUFBRSxnQ0FBZ0M7S0FDNUMsQ0FBQyJ9