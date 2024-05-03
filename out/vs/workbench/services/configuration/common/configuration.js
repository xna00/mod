/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation"], function (require, exports, configuration_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.APPLY_ALL_PROFILES_SETTING = exports.TASKS_DEFAULT = exports.IWorkbenchConfigurationService = exports.USER_STANDALONE_CONFIGURATIONS = exports.WORKSPACE_STANDALONE_CONFIGURATIONS = exports.LAUNCH_CONFIGURATION_KEY = exports.TASKS_CONFIGURATION_KEY = exports.FOLDER_SCOPES = exports.WORKSPACE_SCOPES = exports.REMOTE_MACHINE_SCOPES = exports.LOCAL_MACHINE_SCOPES = exports.LOCAL_MACHINE_PROFILE_SCOPES = exports.PROFILE_SCOPES = exports.APPLICATION_SCOPES = exports.tasksSchemaId = exports.launchSchemaId = exports.folderSettingsSchemaId = exports.workspaceSettingsSchemaId = exports.machineSettingsSchemaId = exports.profileSettingsSchemaId = exports.userSettingsSchemaId = exports.defaultSettingsSchemaId = exports.FOLDER_SETTINGS_PATH = exports.FOLDER_SETTINGS_NAME = exports.FOLDER_CONFIG_FOLDER_NAME = void 0;
    exports.FOLDER_CONFIG_FOLDER_NAME = '.vscode';
    exports.FOLDER_SETTINGS_NAME = 'settings';
    exports.FOLDER_SETTINGS_PATH = `${exports.FOLDER_CONFIG_FOLDER_NAME}/${exports.FOLDER_SETTINGS_NAME}.json`;
    exports.defaultSettingsSchemaId = 'vscode://schemas/settings/default';
    exports.userSettingsSchemaId = 'vscode://schemas/settings/user';
    exports.profileSettingsSchemaId = 'vscode://schemas/settings/profile';
    exports.machineSettingsSchemaId = 'vscode://schemas/settings/machine';
    exports.workspaceSettingsSchemaId = 'vscode://schemas/settings/workspace';
    exports.folderSettingsSchemaId = 'vscode://schemas/settings/folder';
    exports.launchSchemaId = 'vscode://schemas/launch';
    exports.tasksSchemaId = 'vscode://schemas/tasks';
    exports.APPLICATION_SCOPES = [1 /* ConfigurationScope.APPLICATION */];
    exports.PROFILE_SCOPES = [2 /* ConfigurationScope.MACHINE */, 3 /* ConfigurationScope.WINDOW */, 4 /* ConfigurationScope.RESOURCE */, 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */, 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */];
    exports.LOCAL_MACHINE_PROFILE_SCOPES = [3 /* ConfigurationScope.WINDOW */, 4 /* ConfigurationScope.RESOURCE */, 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */];
    exports.LOCAL_MACHINE_SCOPES = [1 /* ConfigurationScope.APPLICATION */, ...exports.LOCAL_MACHINE_PROFILE_SCOPES];
    exports.REMOTE_MACHINE_SCOPES = [2 /* ConfigurationScope.MACHINE */, 3 /* ConfigurationScope.WINDOW */, 4 /* ConfigurationScope.RESOURCE */, 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */, 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */];
    exports.WORKSPACE_SCOPES = [3 /* ConfigurationScope.WINDOW */, 4 /* ConfigurationScope.RESOURCE */, 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */, 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */];
    exports.FOLDER_SCOPES = [4 /* ConfigurationScope.RESOURCE */, 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */, 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */];
    exports.TASKS_CONFIGURATION_KEY = 'tasks';
    exports.LAUNCH_CONFIGURATION_KEY = 'launch';
    exports.WORKSPACE_STANDALONE_CONFIGURATIONS = Object.create(null);
    exports.WORKSPACE_STANDALONE_CONFIGURATIONS[exports.TASKS_CONFIGURATION_KEY] = `${exports.FOLDER_CONFIG_FOLDER_NAME}/${exports.TASKS_CONFIGURATION_KEY}.json`;
    exports.WORKSPACE_STANDALONE_CONFIGURATIONS[exports.LAUNCH_CONFIGURATION_KEY] = `${exports.FOLDER_CONFIG_FOLDER_NAME}/${exports.LAUNCH_CONFIGURATION_KEY}.json`;
    exports.USER_STANDALONE_CONFIGURATIONS = Object.create(null);
    exports.USER_STANDALONE_CONFIGURATIONS[exports.TASKS_CONFIGURATION_KEY] = `${exports.TASKS_CONFIGURATION_KEY}.json`;
    exports.IWorkbenchConfigurationService = (0, instantiation_1.refineServiceDecorator)(configuration_1.IConfigurationService);
    exports.TASKS_DEFAULT = '{\n\t\"version\": \"2.0.0\",\n\t\"tasks\": []\n}';
    exports.APPLY_ALL_PROFILES_SETTING = 'workbench.settings.applyToAllProfiles';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2NvbmZpZ3VyYXRpb24vY29tbW9uL2NvbmZpZ3VyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVW5GLFFBQUEseUJBQXlCLEdBQUcsU0FBUyxDQUFDO0lBQ3RDLFFBQUEsb0JBQW9CLEdBQUcsVUFBVSxDQUFDO0lBQ2xDLFFBQUEsb0JBQW9CLEdBQUcsR0FBRyxpQ0FBeUIsSUFBSSw0QkFBb0IsT0FBTyxDQUFDO0lBRW5GLFFBQUEsdUJBQXVCLEdBQUcsbUNBQW1DLENBQUM7SUFDOUQsUUFBQSxvQkFBb0IsR0FBRyxnQ0FBZ0MsQ0FBQztJQUN4RCxRQUFBLHVCQUF1QixHQUFHLG1DQUFtQyxDQUFDO0lBQzlELFFBQUEsdUJBQXVCLEdBQUcsbUNBQW1DLENBQUM7SUFDOUQsUUFBQSx5QkFBeUIsR0FBRyxxQ0FBcUMsQ0FBQztJQUNsRSxRQUFBLHNCQUFzQixHQUFHLGtDQUFrQyxDQUFDO0lBQzVELFFBQUEsY0FBYyxHQUFHLHlCQUF5QixDQUFDO0lBQzNDLFFBQUEsYUFBYSxHQUFHLHdCQUF3QixDQUFDO0lBRXpDLFFBQUEsa0JBQWtCLEdBQUcsd0NBQWdDLENBQUM7SUFDdEQsUUFBQSxjQUFjLEdBQUcsNk1BQXFLLENBQUM7SUFDdkwsUUFBQSw0QkFBNEIsR0FBRyx5SEFBaUcsQ0FBQztJQUNqSSxRQUFBLG9CQUFvQixHQUFHLHlDQUFpQyxHQUFHLG9DQUE0QixDQUFDLENBQUM7SUFDekYsUUFBQSxxQkFBcUIsR0FBRyw2TUFBcUssQ0FBQztJQUM5TCxRQUFBLGdCQUFnQixHQUFHLHlLQUF5SSxDQUFDO0lBQzdKLFFBQUEsYUFBYSxHQUFHLHNJQUE4RyxDQUFDO0lBRS9ILFFBQUEsdUJBQXVCLEdBQUcsT0FBTyxDQUFDO0lBQ2xDLFFBQUEsd0JBQXdCLEdBQUcsUUFBUSxDQUFDO0lBRXBDLFFBQUEsbUNBQW1DLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2RSwyQ0FBbUMsQ0FBQywrQkFBdUIsQ0FBQyxHQUFHLEdBQUcsaUNBQXlCLElBQUksK0JBQXVCLE9BQU8sQ0FBQztJQUM5SCwyQ0FBbUMsQ0FBQyxnQ0FBd0IsQ0FBQyxHQUFHLEdBQUcsaUNBQXlCLElBQUksZ0NBQXdCLE9BQU8sQ0FBQztJQUNuSCxRQUFBLDhCQUE4QixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEUsc0NBQThCLENBQUMsK0JBQXVCLENBQUMsR0FBRyxHQUFHLCtCQUF1QixPQUFPLENBQUM7SUFzQi9FLFFBQUEsOEJBQThCLEdBQUcsSUFBQSxzQ0FBc0IsRUFBd0QscUNBQXFCLENBQUMsQ0FBQztJQStCdEksUUFBQSxhQUFhLEdBQUcsa0RBQWtELENBQUM7SUFFbkUsUUFBQSwwQkFBMEIsR0FBRyx1Q0FBdUMsQ0FBQyJ9