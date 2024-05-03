/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/nls", "vs/workbench/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform"], function (require, exports, glob, network_1, path_1, resources_1, nls_1, configuration_1, configurationRegistry_1, instantiation_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResolvedStatus = exports.RegisteredEditorPriority = exports.editorsAssociationsSettingId = exports.IEditorResolverService = void 0;
    exports.priorityToRank = priorityToRank;
    exports.globMatchesResource = globMatchesResource;
    exports.IEditorResolverService = (0, instantiation_1.createDecorator)('editorResolverService');
    exports.editorsAssociationsSettingId = 'workbench.editorAssociations';
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const editorAssociationsConfigurationNode = {
        ...configuration_1.workbenchConfigurationNodeBase,
        properties: {
            'workbench.editorAssociations': {
                type: 'object',
                markdownDescription: (0, nls_1.localize)('editor.editorAssociations', "Configure [glob patterns](https://aka.ms/vscode-glob-patterns) to editors (for example `\"*.hex\": \"hexEditor.hexedit\"`). These have precedence over the default behavior."),
                additionalProperties: {
                    type: 'string'
                }
            }
        }
    };
    configurationRegistry.registerConfiguration(editorAssociationsConfigurationNode);
    //#endregion
    //#region EditorResolverService types
    var RegisteredEditorPriority;
    (function (RegisteredEditorPriority) {
        RegisteredEditorPriority["builtin"] = "builtin";
        RegisteredEditorPriority["option"] = "option";
        RegisteredEditorPriority["exclusive"] = "exclusive";
        RegisteredEditorPriority["default"] = "default";
    })(RegisteredEditorPriority || (exports.RegisteredEditorPriority = RegisteredEditorPriority = {}));
    /**
     * If we didn't resolve an editor dictates what to do with the opening state
     * ABORT = Do not continue with opening the editor
     * NONE = Continue as if the resolution has been disabled as the service could not resolve one
     */
    var ResolvedStatus;
    (function (ResolvedStatus) {
        ResolvedStatus[ResolvedStatus["ABORT"] = 1] = "ABORT";
        ResolvedStatus[ResolvedStatus["NONE"] = 2] = "NONE";
    })(ResolvedStatus || (exports.ResolvedStatus = ResolvedStatus = {}));
    //#endregion
    //#region Util functions
    function priorityToRank(priority) {
        switch (priority) {
            case RegisteredEditorPriority.exclusive:
                return 5;
            case RegisteredEditorPriority.default:
                return 4;
            case RegisteredEditorPriority.builtin:
                return 3;
            // Text editor is priority 2
            case RegisteredEditorPriority.option:
            default:
                return 1;
        }
    }
    function globMatchesResource(globPattern, resource) {
        const excludedSchemes = new Set([
            network_1.Schemas.extension,
            network_1.Schemas.webviewPanel,
            network_1.Schemas.vscodeWorkspaceTrust,
            network_1.Schemas.vscodeSettings
        ]);
        // We want to say that the above schemes match no glob patterns
        if (excludedSchemes.has(resource.scheme)) {
            return false;
        }
        const matchOnPath = typeof globPattern === 'string' && globPattern.indexOf(path_1.posix.sep) >= 0;
        const target = matchOnPath ? `${resource.scheme}:${resource.path}` : (0, resources_1.basename)(resource);
        return glob.match(typeof globPattern === 'string' ? globPattern.toLowerCase() : globPattern, target.toLowerCase());
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZWRpdG9yL2NvbW1vbi9lZGl0b3JSZXNvbHZlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK0xoRyx3Q0FhQztJQUVELGtEQWNDO0lBeE1ZLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSwrQkFBZSxFQUF5Qix1QkFBdUIsQ0FBQyxDQUFDO0lBYTFGLFFBQUEsNEJBQTRCLEdBQUcsOEJBQThCLENBQUM7SUFFM0UsTUFBTSxxQkFBcUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFekcsTUFBTSxtQ0FBbUMsR0FBdUI7UUFDL0QsR0FBRyw4Q0FBOEI7UUFDakMsVUFBVSxFQUFFO1lBQ1gsOEJBQThCLEVBQUU7Z0JBQy9CLElBQUksRUFBRSxRQUFRO2dCQUNkLG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLDhLQUE4SyxDQUFDO2dCQUMxTyxvQkFBb0IsRUFBRTtvQkFDckIsSUFBSSxFQUFFLFFBQVE7aUJBQ2Q7YUFDRDtTQUNEO0tBQ0QsQ0FBQztJQVFGLHFCQUFxQixDQUFDLHFCQUFxQixDQUFDLG1DQUFtQyxDQUFDLENBQUM7SUFDakYsWUFBWTtJQUVaLHFDQUFxQztJQUNyQyxJQUFZLHdCQUtYO0lBTEQsV0FBWSx3QkFBd0I7UUFDbkMsK0NBQW1CLENBQUE7UUFDbkIsNkNBQWlCLENBQUE7UUFDakIsbURBQXVCLENBQUE7UUFDdkIsK0NBQW1CLENBQUE7SUFDcEIsQ0FBQyxFQUxXLHdCQUF3Qix3Q0FBeEIsd0JBQXdCLFFBS25DO0lBRUQ7Ozs7T0FJRztJQUNILElBQWtCLGNBR2pCO0lBSEQsV0FBa0IsY0FBYztRQUMvQixxREFBUyxDQUFBO1FBQ1QsbURBQVEsQ0FBQTtJQUNULENBQUMsRUFIaUIsY0FBYyw4QkFBZCxjQUFjLFFBRy9CO0lBaUhELFlBQVk7SUFFWix3QkFBd0I7SUFDeEIsU0FBZ0IsY0FBYyxDQUFDLFFBQWtDO1FBQ2hFLFFBQVEsUUFBUSxFQUFFLENBQUM7WUFDbEIsS0FBSyx3QkFBd0IsQ0FBQyxTQUFTO2dCQUN0QyxPQUFPLENBQUMsQ0FBQztZQUNWLEtBQUssd0JBQXdCLENBQUMsT0FBTztnQkFDcEMsT0FBTyxDQUFDLENBQUM7WUFDVixLQUFLLHdCQUF3QixDQUFDLE9BQU87Z0JBQ3BDLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsNEJBQTRCO1lBQzVCLEtBQUssd0JBQXdCLENBQUMsTUFBTSxDQUFDO1lBQ3JDO2dCQUNDLE9BQU8sQ0FBQyxDQUFDO1FBQ1gsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFnQixtQkFBbUIsQ0FBQyxXQUEyQyxFQUFFLFFBQWE7UUFDN0YsTUFBTSxlQUFlLEdBQUcsSUFBSSxHQUFHLENBQUM7WUFDL0IsaUJBQU8sQ0FBQyxTQUFTO1lBQ2pCLGlCQUFPLENBQUMsWUFBWTtZQUNwQixpQkFBTyxDQUFDLG9CQUFvQjtZQUM1QixpQkFBTyxDQUFDLGNBQWM7U0FDdEIsQ0FBQyxDQUFDO1FBQ0gsK0RBQStEO1FBQy9ELElBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUMxQyxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDRCxNQUFNLFdBQVcsR0FBRyxPQUFPLFdBQVcsS0FBSyxRQUFRLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQyxZQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNGLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBQSxvQkFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hGLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLFdBQVcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3BILENBQUM7O0FBQ0QsWUFBWSJ9