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
define(["require", "exports", "vs/nls", "vs/base/common/json", "vs/base/common/jsonEdit", "vs/base/common/async", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/configuration/common/configuration", "vs/platform/files/common/files", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/editor/common/editorService", "vs/platform/notification/common/notification", "vs/workbench/services/preferences/common/preferences", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/common/core/range", "vs/editor/common/core/editOperation", "vs/editor/common/core/selection", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/common/userDataProfile", "vs/base/common/errors"], function (require, exports, nls, json, jsonEdit_1, async_1, platform_1, workspace_1, textfiles_1, configuration_1, files_1, resolverService_1, configurationRegistry_1, editorService_1, notification_1, preferences_1, uriIdentity_1, range_1, editOperation_1, selection_1, userDataProfile_1, userDataProfile_2, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationEditing = exports.EditableConfigurationTarget = exports.ConfigurationEditingError = exports.ConfigurationEditingErrorCode = void 0;
    var ConfigurationEditingErrorCode;
    (function (ConfigurationEditingErrorCode) {
        /**
         * Error when trying to write a configuration key that is not registered.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_UNKNOWN_KEY"] = 0] = "ERROR_UNKNOWN_KEY";
        /**
         * Error when trying to write an application setting into workspace settings.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION"] = 1] = "ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION";
        /**
         * Error when trying to write a machne setting into workspace settings.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE"] = 2] = "ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE";
        /**
         * Error when trying to write an invalid folder configuration key to folder settings.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_FOLDER_CONFIGURATION"] = 3] = "ERROR_INVALID_FOLDER_CONFIGURATION";
        /**
         * Error when trying to write to user target but not supported for provided key.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_USER_TARGET"] = 4] = "ERROR_INVALID_USER_TARGET";
        /**
         * Error when trying to write to user target but not supported for provided key.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_WORKSPACE_TARGET"] = 5] = "ERROR_INVALID_WORKSPACE_TARGET";
        /**
         * Error when trying to write a configuration key to folder target
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_FOLDER_TARGET"] = 6] = "ERROR_INVALID_FOLDER_TARGET";
        /**
         * Error when trying to write to language specific setting but not supported for preovided key
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_RESOURCE_LANGUAGE_CONFIGURATION"] = 7] = "ERROR_INVALID_RESOURCE_LANGUAGE_CONFIGURATION";
        /**
         * Error when trying to write to the workspace configuration without having a workspace opened.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_NO_WORKSPACE_OPENED"] = 8] = "ERROR_NO_WORKSPACE_OPENED";
        /**
         * Error when trying to write and save to the configuration file while it is dirty in the editor.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_CONFIGURATION_FILE_DIRTY"] = 9] = "ERROR_CONFIGURATION_FILE_DIRTY";
        /**
         * Error when trying to write and save to the configuration file while it is not the latest in the disk.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_CONFIGURATION_FILE_MODIFIED_SINCE"] = 10] = "ERROR_CONFIGURATION_FILE_MODIFIED_SINCE";
        /**
         * Error when trying to write to a configuration file that contains JSON errors.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_CONFIGURATION"] = 11] = "ERROR_INVALID_CONFIGURATION";
        /**
         * Error when trying to write a policy configuration
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_POLICY_CONFIGURATION"] = 12] = "ERROR_POLICY_CONFIGURATION";
        /**
         * Internal Error.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INTERNAL"] = 13] = "ERROR_INTERNAL";
    })(ConfigurationEditingErrorCode || (exports.ConfigurationEditingErrorCode = ConfigurationEditingErrorCode = {}));
    class ConfigurationEditingError extends errors_1.ErrorNoTelemetry {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.ConfigurationEditingError = ConfigurationEditingError;
    var EditableConfigurationTarget;
    (function (EditableConfigurationTarget) {
        EditableConfigurationTarget[EditableConfigurationTarget["USER_LOCAL"] = 1] = "USER_LOCAL";
        EditableConfigurationTarget[EditableConfigurationTarget["USER_REMOTE"] = 2] = "USER_REMOTE";
        EditableConfigurationTarget[EditableConfigurationTarget["WORKSPACE"] = 3] = "WORKSPACE";
        EditableConfigurationTarget[EditableConfigurationTarget["WORKSPACE_FOLDER"] = 4] = "WORKSPACE_FOLDER";
    })(EditableConfigurationTarget || (exports.EditableConfigurationTarget = EditableConfigurationTarget = {}));
    let ConfigurationEditing = class ConfigurationEditing {
        constructor(remoteSettingsResource, configurationService, contextService, userDataProfileService, userDataProfilesService, fileService, textModelResolverService, textFileService, notificationService, preferencesService, editorService, uriIdentityService) {
            this.remoteSettingsResource = remoteSettingsResource;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.userDataProfileService = userDataProfileService;
            this.userDataProfilesService = userDataProfilesService;
            this.fileService = fileService;
            this.textModelResolverService = textModelResolverService;
            this.textFileService = textFileService;
            this.notificationService = notificationService;
            this.preferencesService = preferencesService;
            this.editorService = editorService;
            this.uriIdentityService = uriIdentityService;
            this.queue = new async_1.Queue();
        }
        async writeConfiguration(target, value, options = {}) {
            const operation = this.getConfigurationEditOperation(target, value, options.scopes || {});
            // queue up writes to prevent race conditions
            return this.queue.queue(async () => {
                try {
                    await this.doWriteConfiguration(operation, options);
                }
                catch (error) {
                    if (options.donotNotifyError) {
                        throw error;
                    }
                    await this.onError(error, operation, options.scopes);
                }
            });
        }
        async doWriteConfiguration(operation, options) {
            await this.validate(operation.target, operation, !options.handleDirtyFile, options.scopes || {});
            const resource = operation.resource;
            const reference = await this.resolveModelReference(resource);
            try {
                const formattingOptions = this.getFormattingOptions(reference.object.textEditorModel);
                await this.updateConfiguration(operation, reference.object.textEditorModel, formattingOptions, options);
            }
            finally {
                reference.dispose();
            }
        }
        async updateConfiguration(operation, model, formattingOptions, options) {
            if (this.hasParseErrors(model.getValue(), operation)) {
                throw this.toConfigurationEditingError(11 /* ConfigurationEditingErrorCode.ERROR_INVALID_CONFIGURATION */, operation.target, operation);
            }
            if (this.textFileService.isDirty(model.uri) && options.handleDirtyFile) {
                switch (options.handleDirtyFile) {
                    case 'save':
                        await this.save(model, operation);
                        break;
                    case 'revert':
                        await this.textFileService.revert(model.uri);
                        break;
                }
            }
            const edit = this.getEdits(operation, model.getValue(), formattingOptions)[0];
            if (edit && this.applyEditsToBuffer(edit, model)) {
                await this.save(model, operation);
            }
        }
        async save(model, operation) {
            try {
                await this.textFileService.save(model.uri, { ignoreErrorHandler: true });
            }
            catch (error) {
                if (error.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                    throw this.toConfigurationEditingError(10 /* ConfigurationEditingErrorCode.ERROR_CONFIGURATION_FILE_MODIFIED_SINCE */, operation.target, operation);
                }
                throw new ConfigurationEditingError(nls.localize('fsError', "Error while writing to {0}. {1}", this.stringifyTarget(operation.target), error.message), 13 /* ConfigurationEditingErrorCode.ERROR_INTERNAL */);
            }
        }
        applyEditsToBuffer(edit, model) {
            const startPosition = model.getPositionAt(edit.offset);
            const endPosition = model.getPositionAt(edit.offset + edit.length);
            const range = new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
            const currentText = model.getValueInRange(range);
            if (edit.content !== currentText) {
                const editOperation = currentText ? editOperation_1.EditOperation.replace(range, edit.content) : editOperation_1.EditOperation.insert(startPosition, edit.content);
                model.pushEditOperations([new selection_1.Selection(startPosition.lineNumber, startPosition.column, startPosition.lineNumber, startPosition.column)], [editOperation], () => []);
                return true;
            }
            return false;
        }
        getEdits({ value, jsonPath }, modelContent, formattingOptions) {
            if (jsonPath.length) {
                return (0, jsonEdit_1.setProperty)(modelContent, jsonPath, value, formattingOptions);
            }
            // Without jsonPath, the entire configuration file is being replaced, so we just use JSON.stringify
            const content = JSON.stringify(value, null, formattingOptions.insertSpaces && formattingOptions.tabSize ? ' '.repeat(formattingOptions.tabSize) : '\t');
            return [{
                    content,
                    length: modelContent.length,
                    offset: 0
                }];
        }
        getFormattingOptions(model) {
            const { insertSpaces, tabSize } = model.getOptions();
            const eol = model.getEOL();
            return { insertSpaces, tabSize, eol };
        }
        async onError(error, operation, scopes) {
            switch (error.code) {
                case 11 /* ConfigurationEditingErrorCode.ERROR_INVALID_CONFIGURATION */:
                    this.onInvalidConfigurationError(error, operation);
                    break;
                case 9 /* ConfigurationEditingErrorCode.ERROR_CONFIGURATION_FILE_DIRTY */:
                    this.onConfigurationFileDirtyError(error, operation, scopes);
                    break;
                case 10 /* ConfigurationEditingErrorCode.ERROR_CONFIGURATION_FILE_MODIFIED_SINCE */:
                    return this.doWriteConfiguration(operation, { scopes, handleDirtyFile: 'revert' });
                default:
                    this.notificationService.error(error.message);
            }
        }
        onInvalidConfigurationError(error, operation) {
            const openStandAloneConfigurationActionLabel = operation.workspaceStandAloneConfigurationKey === configuration_1.TASKS_CONFIGURATION_KEY ? nls.localize('openTasksConfiguration', "Open Tasks Configuration")
                : operation.workspaceStandAloneConfigurationKey === configuration_1.LAUNCH_CONFIGURATION_KEY ? nls.localize('openLaunchConfiguration', "Open Launch Configuration")
                    : null;
            if (openStandAloneConfigurationActionLabel) {
                this.notificationService.prompt(notification_1.Severity.Error, error.message, [{
                        label: openStandAloneConfigurationActionLabel,
                        run: () => this.openFile(operation.resource)
                    }]);
            }
            else {
                this.notificationService.prompt(notification_1.Severity.Error, error.message, [{
                        label: nls.localize('open', "Open Settings"),
                        run: () => this.openSettings(operation)
                    }]);
            }
        }
        onConfigurationFileDirtyError(error, operation, scopes) {
            const openStandAloneConfigurationActionLabel = operation.workspaceStandAloneConfigurationKey === configuration_1.TASKS_CONFIGURATION_KEY ? nls.localize('openTasksConfiguration', "Open Tasks Configuration")
                : operation.workspaceStandAloneConfigurationKey === configuration_1.LAUNCH_CONFIGURATION_KEY ? nls.localize('openLaunchConfiguration', "Open Launch Configuration")
                    : null;
            if (openStandAloneConfigurationActionLabel) {
                this.notificationService.prompt(notification_1.Severity.Error, error.message, [{
                        label: nls.localize('saveAndRetry', "Save and Retry"),
                        run: () => {
                            const key = operation.key ? `${operation.workspaceStandAloneConfigurationKey}.${operation.key}` : operation.workspaceStandAloneConfigurationKey;
                            this.writeConfiguration(operation.target, { key, value: operation.value }, { handleDirtyFile: 'save', scopes });
                        }
                    },
                    {
                        label: openStandAloneConfigurationActionLabel,
                        run: () => this.openFile(operation.resource)
                    }]);
            }
            else {
                this.notificationService.prompt(notification_1.Severity.Error, error.message, [{
                        label: nls.localize('saveAndRetry', "Save and Retry"),
                        run: () => this.writeConfiguration(operation.target, { key: operation.key, value: operation.value }, { handleDirtyFile: 'save', scopes })
                    },
                    {
                        label: nls.localize('open', "Open Settings"),
                        run: () => this.openSettings(operation)
                    }]);
            }
        }
        openSettings(operation) {
            const options = { jsonEditor: true };
            switch (operation.target) {
                case 1 /* EditableConfigurationTarget.USER_LOCAL */:
                    this.preferencesService.openUserSettings(options);
                    break;
                case 2 /* EditableConfigurationTarget.USER_REMOTE */:
                    this.preferencesService.openRemoteSettings(options);
                    break;
                case 3 /* EditableConfigurationTarget.WORKSPACE */:
                    this.preferencesService.openWorkspaceSettings(options);
                    break;
                case 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */:
                    if (operation.resource) {
                        const workspaceFolder = this.contextService.getWorkspaceFolder(operation.resource);
                        if (workspaceFolder) {
                            this.preferencesService.openFolderSettings({ folderUri: workspaceFolder.uri, jsonEditor: true });
                        }
                    }
                    break;
            }
        }
        openFile(resource) {
            this.editorService.openEditor({ resource, options: { pinned: true } });
        }
        toConfigurationEditingError(code, target, operation) {
            const message = this.toErrorMessage(code, target, operation);
            return new ConfigurationEditingError(message, code);
        }
        toErrorMessage(error, target, operation) {
            switch (error) {
                // API constraints
                case 12 /* ConfigurationEditingErrorCode.ERROR_POLICY_CONFIGURATION */: return nls.localize('errorPolicyConfiguration', "Unable to write {0} because it is configured in system policy.", operation.key);
                case 0 /* ConfigurationEditingErrorCode.ERROR_UNKNOWN_KEY */: return nls.localize('errorUnknownKey', "Unable to write to {0} because {1} is not a registered configuration.", this.stringifyTarget(target), operation.key);
                case 1 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION */: return nls.localize('errorInvalidWorkspaceConfigurationApplication', "Unable to write {0} to Workspace Settings. This setting can be written only into User settings.", operation.key);
                case 2 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE */: return nls.localize('errorInvalidWorkspaceConfigurationMachine', "Unable to write {0} to Workspace Settings. This setting can be written only into User settings.", operation.key);
                case 3 /* ConfigurationEditingErrorCode.ERROR_INVALID_FOLDER_CONFIGURATION */: return nls.localize('errorInvalidFolderConfiguration', "Unable to write to Folder Settings because {0} does not support the folder resource scope.", operation.key);
                case 4 /* ConfigurationEditingErrorCode.ERROR_INVALID_USER_TARGET */: return nls.localize('errorInvalidUserTarget', "Unable to write to User Settings because {0} does not support for global scope.", operation.key);
                case 5 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_TARGET */: return nls.localize('errorInvalidWorkspaceTarget', "Unable to write to Workspace Settings because {0} does not support for workspace scope in a multi folder workspace.", operation.key);
                case 6 /* ConfigurationEditingErrorCode.ERROR_INVALID_FOLDER_TARGET */: return nls.localize('errorInvalidFolderTarget', "Unable to write to Folder Settings because no resource is provided.");
                case 7 /* ConfigurationEditingErrorCode.ERROR_INVALID_RESOURCE_LANGUAGE_CONFIGURATION */: return nls.localize('errorInvalidResourceLanguageConfiguration', "Unable to write to Language Settings because {0} is not a resource language setting.", operation.key);
                case 8 /* ConfigurationEditingErrorCode.ERROR_NO_WORKSPACE_OPENED */: return nls.localize('errorNoWorkspaceOpened', "Unable to write to {0} because no workspace is opened. Please open a workspace first and try again.", this.stringifyTarget(target));
                // User issues
                case 11 /* ConfigurationEditingErrorCode.ERROR_INVALID_CONFIGURATION */: {
                    if (operation.workspaceStandAloneConfigurationKey === configuration_1.TASKS_CONFIGURATION_KEY) {
                        return nls.localize('errorInvalidTaskConfiguration', "Unable to write into the tasks configuration file. Please open it to correct errors/warnings in it and try again.");
                    }
                    if (operation.workspaceStandAloneConfigurationKey === configuration_1.LAUNCH_CONFIGURATION_KEY) {
                        return nls.localize('errorInvalidLaunchConfiguration', "Unable to write into the launch configuration file. Please open it to correct errors/warnings in it and try again.");
                    }
                    switch (target) {
                        case 1 /* EditableConfigurationTarget.USER_LOCAL */:
                            return nls.localize('errorInvalidConfiguration', "Unable to write into user settings. Please open the user settings to correct errors/warnings in it and try again.");
                        case 2 /* EditableConfigurationTarget.USER_REMOTE */:
                            return nls.localize('errorInvalidRemoteConfiguration', "Unable to write into remote user settings. Please open the remote user settings to correct errors/warnings in it and try again.");
                        case 3 /* EditableConfigurationTarget.WORKSPACE */:
                            return nls.localize('errorInvalidConfigurationWorkspace', "Unable to write into workspace settings. Please open the workspace settings to correct errors/warnings in the file and try again.");
                        case 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */: {
                            let workspaceFolderName = '<<unknown>>';
                            if (operation.resource) {
                                const folder = this.contextService.getWorkspaceFolder(operation.resource);
                                if (folder) {
                                    workspaceFolderName = folder.name;
                                }
                            }
                            return nls.localize('errorInvalidConfigurationFolder', "Unable to write into folder settings. Please open the '{0}' folder settings to correct errors/warnings in it and try again.", workspaceFolderName);
                        }
                        default:
                            return '';
                    }
                }
                case 9 /* ConfigurationEditingErrorCode.ERROR_CONFIGURATION_FILE_DIRTY */: {
                    if (operation.workspaceStandAloneConfigurationKey === configuration_1.TASKS_CONFIGURATION_KEY) {
                        return nls.localize('errorTasksConfigurationFileDirty', "Unable to write into tasks configuration file because the file has unsaved changes. Please save it first and then try again.");
                    }
                    if (operation.workspaceStandAloneConfigurationKey === configuration_1.LAUNCH_CONFIGURATION_KEY) {
                        return nls.localize('errorLaunchConfigurationFileDirty', "Unable to write into launch configuration file because the file has unsaved changes. Please save it first and then try again.");
                    }
                    switch (target) {
                        case 1 /* EditableConfigurationTarget.USER_LOCAL */:
                            return nls.localize('errorConfigurationFileDirty', "Unable to write into user settings because the file has unsaved changes. Please save the user settings file first and then try again.");
                        case 2 /* EditableConfigurationTarget.USER_REMOTE */:
                            return nls.localize('errorRemoteConfigurationFileDirty', "Unable to write into remote user settings because the file has unsaved changes. Please save the remote user settings file first and then try again.");
                        case 3 /* EditableConfigurationTarget.WORKSPACE */:
                            return nls.localize('errorConfigurationFileDirtyWorkspace', "Unable to write into workspace settings because the file has unsaved changes. Please save the workspace settings file first and then try again.");
                        case 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */: {
                            let workspaceFolderName = '<<unknown>>';
                            if (operation.resource) {
                                const folder = this.contextService.getWorkspaceFolder(operation.resource);
                                if (folder) {
                                    workspaceFolderName = folder.name;
                                }
                            }
                            return nls.localize('errorConfigurationFileDirtyFolder', "Unable to write into folder settings because the file has unsaved changes. Please save the '{0}' folder settings file first and then try again.", workspaceFolderName);
                        }
                        default:
                            return '';
                    }
                }
                case 10 /* ConfigurationEditingErrorCode.ERROR_CONFIGURATION_FILE_MODIFIED_SINCE */:
                    if (operation.workspaceStandAloneConfigurationKey === configuration_1.TASKS_CONFIGURATION_KEY) {
                        return nls.localize('errorTasksConfigurationFileModifiedSince', "Unable to write into tasks configuration file because the content of the file is newer.");
                    }
                    if (operation.workspaceStandAloneConfigurationKey === configuration_1.LAUNCH_CONFIGURATION_KEY) {
                        return nls.localize('errorLaunchConfigurationFileModifiedSince', "Unable to write into launch configuration file because the content of the file is newer.");
                    }
                    switch (target) {
                        case 1 /* EditableConfigurationTarget.USER_LOCAL */:
                            return nls.localize('errorConfigurationFileModifiedSince', "Unable to write into user settings because the content of the file is newer.");
                        case 2 /* EditableConfigurationTarget.USER_REMOTE */:
                            return nls.localize('errorRemoteConfigurationFileModifiedSince', "Unable to write into remote user settings because the content of the file is newer.");
                        case 3 /* EditableConfigurationTarget.WORKSPACE */:
                            return nls.localize('errorConfigurationFileModifiedSinceWorkspace', "Unable to write into workspace settings because the content of the file is newer.");
                        case 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */:
                            return nls.localize('errorConfigurationFileModifiedSinceFolder', "Unable to write into folder settings because the content of the file is newer.");
                    }
                case 13 /* ConfigurationEditingErrorCode.ERROR_INTERNAL */: return nls.localize('errorUnknown', "Unable to write to {0} because of an internal error.", this.stringifyTarget(target));
            }
        }
        stringifyTarget(target) {
            switch (target) {
                case 1 /* EditableConfigurationTarget.USER_LOCAL */:
                    return nls.localize('userTarget', "User Settings");
                case 2 /* EditableConfigurationTarget.USER_REMOTE */:
                    return nls.localize('remoteUserTarget', "Remote User Settings");
                case 3 /* EditableConfigurationTarget.WORKSPACE */:
                    return nls.localize('workspaceTarget', "Workspace Settings");
                case 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */:
                    return nls.localize('folderTarget', "Folder Settings");
                default:
                    return '';
            }
        }
        defaultResourceValue(resource) {
            const basename = this.uriIdentityService.extUri.basename(resource);
            const configurationValue = basename.substr(0, basename.length - this.uriIdentityService.extUri.extname(resource).length);
            switch (configurationValue) {
                case configuration_1.TASKS_CONFIGURATION_KEY: return configuration_1.TASKS_DEFAULT;
                default: return '{}';
            }
        }
        async resolveModelReference(resource) {
            const exists = await this.fileService.exists(resource);
            if (!exists) {
                await this.textFileService.write(resource, this.defaultResourceValue(resource), { encoding: 'utf8' });
            }
            return this.textModelResolverService.createModelReference(resource);
        }
        hasParseErrors(content, operation) {
            // If we write to a workspace standalone file and replace the entire contents (no key provided)
            // we can return here because any parse errors can safely be ignored since all contents are replaced
            if (operation.workspaceStandAloneConfigurationKey && !operation.key) {
                return false;
            }
            const parseErrors = [];
            json.parse(content, parseErrors, { allowTrailingComma: true, allowEmptyContent: true });
            return parseErrors.length > 0;
        }
        async validate(target, operation, checkDirty, overrides) {
            if (this.configurationService.inspect(operation.key).policyValue !== undefined) {
                throw this.toConfigurationEditingError(12 /* ConfigurationEditingErrorCode.ERROR_POLICY_CONFIGURATION */, target, operation);
            }
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const configurationScope = configurationProperties[operation.key]?.scope;
            /**
             * Key to update must be a known setting from the registry unless
             * 	- the key is standalone configuration (eg: tasks, debug)
             * 	- the key is an override identifier
             * 	- the operation is to delete the key
             */
            if (!operation.workspaceStandAloneConfigurationKey) {
                const validKeys = this.configurationService.keys().default;
                if (validKeys.indexOf(operation.key) < 0 && !configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(operation.key) && operation.value !== undefined) {
                    throw this.toConfigurationEditingError(0 /* ConfigurationEditingErrorCode.ERROR_UNKNOWN_KEY */, target, operation);
                }
            }
            if (operation.workspaceStandAloneConfigurationKey) {
                // Global launches are not supported
                if ((operation.workspaceStandAloneConfigurationKey !== configuration_1.TASKS_CONFIGURATION_KEY) && (target === 1 /* EditableConfigurationTarget.USER_LOCAL */ || target === 2 /* EditableConfigurationTarget.USER_REMOTE */)) {
                    throw this.toConfigurationEditingError(4 /* ConfigurationEditingErrorCode.ERROR_INVALID_USER_TARGET */, target, operation);
                }
            }
            // Target cannot be workspace or folder if no workspace opened
            if ((target === 3 /* EditableConfigurationTarget.WORKSPACE */ || target === 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */) && this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                throw this.toConfigurationEditingError(8 /* ConfigurationEditingErrorCode.ERROR_NO_WORKSPACE_OPENED */, target, operation);
            }
            if (target === 3 /* EditableConfigurationTarget.WORKSPACE */) {
                if (!operation.workspaceStandAloneConfigurationKey && !configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(operation.key)) {
                    if (configurationScope === 1 /* ConfigurationScope.APPLICATION */) {
                        throw this.toConfigurationEditingError(1 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION */, target, operation);
                    }
                    if (configurationScope === 2 /* ConfigurationScope.MACHINE */) {
                        throw this.toConfigurationEditingError(2 /* ConfigurationEditingErrorCode.ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE */, target, operation);
                    }
                }
            }
            if (target === 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */) {
                if (!operation.resource) {
                    throw this.toConfigurationEditingError(6 /* ConfigurationEditingErrorCode.ERROR_INVALID_FOLDER_TARGET */, target, operation);
                }
                if (!operation.workspaceStandAloneConfigurationKey && !configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(operation.key)) {
                    if (configurationScope !== undefined && !configuration_1.FOLDER_SCOPES.includes(configurationScope)) {
                        throw this.toConfigurationEditingError(3 /* ConfigurationEditingErrorCode.ERROR_INVALID_FOLDER_CONFIGURATION */, target, operation);
                    }
                }
            }
            if (overrides.overrideIdentifiers?.length) {
                if (configurationScope !== 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */) {
                    throw this.toConfigurationEditingError(7 /* ConfigurationEditingErrorCode.ERROR_INVALID_RESOURCE_LANGUAGE_CONFIGURATION */, target, operation);
                }
            }
            if (!operation.resource) {
                throw this.toConfigurationEditingError(6 /* ConfigurationEditingErrorCode.ERROR_INVALID_FOLDER_TARGET */, target, operation);
            }
            if (checkDirty && this.textFileService.isDirty(operation.resource)) {
                throw this.toConfigurationEditingError(9 /* ConfigurationEditingErrorCode.ERROR_CONFIGURATION_FILE_DIRTY */, target, operation);
            }
        }
        getConfigurationEditOperation(target, config, overrides) {
            // Check for standalone workspace configurations
            if (config.key) {
                const standaloneConfigurationMap = target === 1 /* EditableConfigurationTarget.USER_LOCAL */ ? configuration_1.USER_STANDALONE_CONFIGURATIONS : configuration_1.WORKSPACE_STANDALONE_CONFIGURATIONS;
                const standaloneConfigurationKeys = Object.keys(standaloneConfigurationMap);
                for (const key of standaloneConfigurationKeys) {
                    const resource = this.getConfigurationFileResource(target, key, standaloneConfigurationMap[key], overrides.resource, undefined);
                    // Check for prefix
                    if (config.key === key) {
                        const jsonPath = this.isWorkspaceConfigurationResource(resource) ? [key] : [];
                        return { key: jsonPath[jsonPath.length - 1], jsonPath, value: config.value, resource: resource ?? undefined, workspaceStandAloneConfigurationKey: key, target };
                    }
                    // Check for prefix.<setting>
                    const keyPrefix = `${key}.`;
                    if (config.key.indexOf(keyPrefix) === 0) {
                        const jsonPath = this.isWorkspaceConfigurationResource(resource) ? [key, config.key.substr(keyPrefix.length)] : [config.key.substr(keyPrefix.length)];
                        return { key: jsonPath[jsonPath.length - 1], jsonPath, value: config.value, resource: resource ?? undefined, workspaceStandAloneConfigurationKey: key, target };
                    }
                }
            }
            const key = config.key;
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const configurationScope = configurationProperties[key]?.scope;
            let jsonPath = overrides.overrideIdentifiers?.length ? [(0, configurationRegistry_1.keyFromOverrideIdentifiers)(overrides.overrideIdentifiers), key] : [key];
            if (target === 1 /* EditableConfigurationTarget.USER_LOCAL */ || target === 2 /* EditableConfigurationTarget.USER_REMOTE */) {
                return { key, jsonPath, value: config.value, resource: this.getConfigurationFileResource(target, key, '', null, configurationScope) ?? undefined, target };
            }
            const resource = this.getConfigurationFileResource(target, key, configuration_1.FOLDER_SETTINGS_PATH, overrides.resource, configurationScope);
            if (this.isWorkspaceConfigurationResource(resource)) {
                jsonPath = ['settings', ...jsonPath];
            }
            return { key, jsonPath, value: config.value, resource: resource ?? undefined, target };
        }
        isWorkspaceConfigurationResource(resource) {
            const workspace = this.contextService.getWorkspace();
            return !!(workspace.configuration && resource && workspace.configuration.fsPath === resource.fsPath);
        }
        getConfigurationFileResource(target, key, relativePath, resource, scope) {
            if (target === 1 /* EditableConfigurationTarget.USER_LOCAL */) {
                if (key === configuration_1.TASKS_CONFIGURATION_KEY) {
                    return this.userDataProfileService.currentProfile.tasksResource;
                }
                else {
                    if (!this.userDataProfileService.currentProfile.isDefault && this.configurationService.isSettingAppliedForAllProfiles(key)) {
                        return this.userDataProfilesService.defaultProfile.settingsResource;
                    }
                    return this.userDataProfileService.currentProfile.settingsResource;
                }
            }
            if (target === 2 /* EditableConfigurationTarget.USER_REMOTE */) {
                return this.remoteSettingsResource;
            }
            const workbenchState = this.contextService.getWorkbenchState();
            if (workbenchState !== 1 /* WorkbenchState.EMPTY */) {
                const workspace = this.contextService.getWorkspace();
                if (target === 3 /* EditableConfigurationTarget.WORKSPACE */) {
                    if (workbenchState === 3 /* WorkbenchState.WORKSPACE */) {
                        return workspace.configuration ?? null;
                    }
                    if (workbenchState === 2 /* WorkbenchState.FOLDER */) {
                        return workspace.folders[0].toResource(relativePath);
                    }
                }
                if (target === 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */) {
                    if (resource) {
                        const folder = this.contextService.getWorkspaceFolder(resource);
                        if (folder) {
                            return folder.toResource(relativePath);
                        }
                    }
                }
            }
            return null;
        }
    };
    exports.ConfigurationEditing = ConfigurationEditing;
    exports.ConfigurationEditing = ConfigurationEditing = __decorate([
        __param(1, configuration_1.IWorkbenchConfigurationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, userDataProfile_1.IUserDataProfileService),
        __param(4, userDataProfile_2.IUserDataProfilesService),
        __param(5, files_1.IFileService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, textfiles_1.ITextFileService),
        __param(8, notification_1.INotificationService),
        __param(9, preferences_1.IPreferencesService),
        __param(10, editorService_1.IEditorService),
        __param(11, uriIdentity_1.IUriIdentityService)
    ], ConfigurationEditing);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbkVkaXRpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9jb25maWd1cmF0aW9uL2NvbW1vbi9jb25maWd1cmF0aW9uRWRpdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE2QmhHLElBQWtCLDZCQXVFakI7SUF2RUQsV0FBa0IsNkJBQTZCO1FBRTlDOztXQUVHO1FBQ0gsMkdBQWlCLENBQUE7UUFFakI7O1dBRUc7UUFDSCwyS0FBaUQsQ0FBQTtRQUVqRDs7V0FFRztRQUNILG1LQUE2QyxDQUFBO1FBRTdDOztXQUVHO1FBQ0gsNklBQWtDLENBQUE7UUFFbEM7O1dBRUc7UUFDSCwySEFBeUIsQ0FBQTtRQUV6Qjs7V0FFRztRQUNILHFJQUE4QixDQUFBO1FBRTlCOztXQUVHO1FBQ0gsK0hBQTJCLENBQUE7UUFFM0I7O1dBRUc7UUFDSCxtS0FBNkMsQ0FBQTtRQUU3Qzs7V0FFRztRQUNILDJIQUF5QixDQUFBO1FBRXpCOztXQUVHO1FBQ0gscUlBQThCLENBQUE7UUFFOUI7O1dBRUc7UUFDSCx3SkFBdUMsQ0FBQTtRQUV2Qzs7V0FFRztRQUNILGdJQUEyQixDQUFBO1FBRTNCOztXQUVHO1FBQ0gsOEhBQTBCLENBQUE7UUFFMUI7O1dBRUc7UUFDSCxzR0FBYyxDQUFBO0lBQ2YsQ0FBQyxFQXZFaUIsNkJBQTZCLDZDQUE3Qiw2QkFBNkIsUUF1RTlDO0lBRUQsTUFBYSx5QkFBMEIsU0FBUSx5QkFBZ0I7UUFDOUQsWUFBWSxPQUFlLEVBQVMsSUFBbUM7WUFDdEUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRG9CLFNBQUksR0FBSixJQUFJLENBQStCO1FBRXZFLENBQUM7S0FDRDtJQUpELDhEQUlDO0lBY0QsSUFBa0IsMkJBS2pCO0lB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