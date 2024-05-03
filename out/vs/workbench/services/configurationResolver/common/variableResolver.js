/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/process", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/labels", "vs/nls", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/base/common/strings"], function (require, exports, paths, process, types, objects, platform_1, labels_1, nls_1, configurationResolver_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractVariableResolverService = void 0;
    class AbstractVariableResolverService {
        static { this.VARIABLE_LHS = '${'; }
        static { this.VARIABLE_REGEXP = /\$\{(.*?)\}/g; }
        constructor(_context, _labelService, _userHomePromise, _envVariablesPromise) {
            this._contributedVariables = new Map();
            this._context = _context;
            this._labelService = _labelService;
            this._userHomePromise = _userHomePromise;
            if (_envVariablesPromise) {
                this._envVariablesPromise = _envVariablesPromise.then(envVariables => {
                    return this.prepareEnv(envVariables);
                });
            }
        }
        prepareEnv(envVariables) {
            // windows env variables are case insensitive
            if (platform_1.isWindows) {
                const ev = Object.create(null);
                Object.keys(envVariables).forEach(key => {
                    ev[key.toLowerCase()] = envVariables[key];
                });
                return ev;
            }
            return envVariables;
        }
        resolveWithEnvironment(environment, root, value) {
            return this.recursiveResolve({ env: this.prepareEnv(environment), userHome: undefined }, root ? root.uri : undefined, value);
        }
        async resolveAsync(root, value) {
            const environment = {
                env: await this._envVariablesPromise,
                userHome: await this._userHomePromise
            };
            return this.recursiveResolve(environment, root ? root.uri : undefined, value);
        }
        async resolveAnyBase(workspaceFolder, config, commandValueMapping, resolvedVariables) {
            const result = objects.deepClone(config);
            // hoist platform specific attributes to top level
            if (platform_1.isWindows && result.windows) {
                Object.keys(result.windows).forEach(key => result[key] = result.windows[key]);
            }
            else if (platform_1.isMacintosh && result.osx) {
                Object.keys(result.osx).forEach(key => result[key] = result.osx[key]);
            }
            else if (platform_1.isLinux && result.linux) {
                Object.keys(result.linux).forEach(key => result[key] = result.linux[key]);
            }
            // delete all platform specific sections
            delete result.windows;
            delete result.osx;
            delete result.linux;
            // substitute all variables recursively in string values
            const environmentPromises = {
                env: await this._envVariablesPromise,
                userHome: await this._userHomePromise
            };
            return this.recursiveResolve(environmentPromises, workspaceFolder ? workspaceFolder.uri : undefined, result, commandValueMapping, resolvedVariables);
        }
        async resolveAnyAsync(workspaceFolder, config, commandValueMapping) {
            return this.resolveAnyBase(workspaceFolder, config, commandValueMapping);
        }
        async resolveAnyMap(workspaceFolder, config, commandValueMapping) {
            const resolvedVariables = new Map();
            const newConfig = await this.resolveAnyBase(workspaceFolder, config, commandValueMapping, resolvedVariables);
            return { newConfig, resolvedVariables };
        }
        resolveWithInteractionReplace(folder, config, section, variables) {
            throw new Error('resolveWithInteractionReplace not implemented.');
        }
        resolveWithInteraction(folder, config, section, variables) {
            throw new Error('resolveWithInteraction not implemented.');
        }
        contributeVariable(variable, resolution) {
            if (this._contributedVariables.has(variable)) {
                throw new Error('Variable ' + variable + ' is contributed twice.');
            }
            else {
                this._contributedVariables.set(variable, resolution);
            }
        }
        async recursiveResolve(environment, folderUri, value, commandValueMapping, resolvedVariables) {
            if (types.isString(value)) {
                return this.resolveString(environment, folderUri, value, commandValueMapping, resolvedVariables);
            }
            else if (Array.isArray(value)) {
                return Promise.all(value.map(s => this.recursiveResolve(environment, folderUri, s, commandValueMapping, resolvedVariables)));
            }
            else if (types.isObject(value)) {
                const result = Object.create(null);
                const replaced = await Promise.all(Object.keys(value).map(async (key) => {
                    const replaced = await this.resolveString(environment, folderUri, key, commandValueMapping, resolvedVariables);
                    return [replaced, await this.recursiveResolve(environment, folderUri, value[key], commandValueMapping, resolvedVariables)];
                }));
                // two step process to preserve object key order
                for (const [key, value] of replaced) {
                    result[key] = value;
                }
                return result;
            }
            return value;
        }
        resolveString(environment, folderUri, value, commandValueMapping, resolvedVariables) {
            // loop through all variables occurrences in 'value'
            return (0, strings_1.replaceAsync)(value, AbstractVariableResolverService.VARIABLE_REGEXP, async (match, variable) => {
                // disallow attempted nesting, see #77289. This doesn't exclude variables that resolve to other variables.
                if (variable.includes(AbstractVariableResolverService.VARIABLE_LHS)) {
                    return match;
                }
                let resolvedValue = await this.evaluateSingleVariable(environment, match, variable, folderUri, commandValueMapping);
                resolvedVariables?.set(variable, resolvedValue);
                if ((resolvedValue !== match) && types.isString(resolvedValue) && resolvedValue.match(AbstractVariableResolverService.VARIABLE_REGEXP)) {
                    resolvedValue = await this.resolveString(environment, folderUri, resolvedValue, commandValueMapping, resolvedVariables);
                }
                return resolvedValue;
            });
        }
        fsPath(displayUri) {
            return this._labelService ? this._labelService.getUriLabel(displayUri, { noPrefix: true }) : displayUri.fsPath;
        }
        async evaluateSingleVariable(environment, match, variable, folderUri, commandValueMapping) {
            // try to separate variable arguments from variable name
            let argument;
            const parts = variable.split(':');
            if (parts.length > 1) {
                variable = parts[0];
                argument = parts[1];
            }
            // common error handling for all variables that require an open editor
            const getFilePath = (variableKind) => {
                const filePath = this._context.getFilePath();
                if (filePath) {
                    return (0, labels_1.normalizeDriveLetter)(filePath);
                }
                throw new configurationResolver_1.VariableError(variableKind, ((0, nls_1.localize)('canNotResolveFile', "Variable {0} can not be resolved. Please open an editor.", match)));
            };
            // common error handling for all variables that require an open editor
            const getFolderPathForFile = (variableKind) => {
                const filePath = getFilePath(variableKind); // throws error if no editor open
                if (this._context.getWorkspaceFolderPathForFile) {
                    const folderPath = this._context.getWorkspaceFolderPathForFile();
                    if (folderPath) {
                        return (0, labels_1.normalizeDriveLetter)(folderPath);
                    }
                }
                throw new configurationResolver_1.VariableError(variableKind, (0, nls_1.localize)('canNotResolveFolderForFile', "Variable {0}: can not find workspace folder of '{1}'.", match, paths.basename(filePath)));
            };
            // common error handling for all variables that require an open folder and accept a folder name argument
            const getFolderUri = (variableKind) => {
                if (argument) {
                    const folder = this._context.getFolderUri(argument);
                    if (folder) {
                        return folder;
                    }
                    throw new configurationResolver_1.VariableError(variableKind, (0, nls_1.localize)('canNotFindFolder', "Variable {0} can not be resolved. No such folder '{1}'.", match, argument));
                }
                if (folderUri) {
                    return folderUri;
                }
                if (this._context.getWorkspaceFolderCount() > 1) {
                    throw new configurationResolver_1.VariableError(variableKind, (0, nls_1.localize)('canNotResolveWorkspaceFolderMultiRoot', "Variable {0} can not be resolved in a multi folder workspace. Scope this variable using ':' and a workspace folder name.", match));
                }
                throw new configurationResolver_1.VariableError(variableKind, (0, nls_1.localize)('canNotResolveWorkspaceFolder', "Variable {0} can not be resolved. Please open a folder.", match));
            };
            switch (variable) {
                case 'env':
                    if (argument) {
                        if (environment.env) {
                            // Depending on the source of the environment, on Windows, the values may all be lowercase.
                            const env = environment.env[platform_1.isWindows ? argument.toLowerCase() : argument];
                            if (types.isString(env)) {
                                return env;
                            }
                        }
                        // For `env` we should do the same as a normal shell does - evaluates undefined envs to an empty string #46436
                        return '';
                    }
                    throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.Env, (0, nls_1.localize)('missingEnvVarName', "Variable {0} can not be resolved because no environment variable name is given.", match));
                case 'config':
                    if (argument) {
                        const config = this._context.getConfigurationValue(folderUri, argument);
                        if (types.isUndefinedOrNull(config)) {
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.Config, (0, nls_1.localize)('configNotFound', "Variable {0} can not be resolved because setting '{1}' not found.", match, argument));
                        }
                        if (types.isObject(config)) {
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.Config, (0, nls_1.localize)('configNoString', "Variable {0} can not be resolved because '{1}' is a structured value.", match, argument));
                        }
                        return config;
                    }
                    throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.Config, (0, nls_1.localize)('missingConfigName', "Variable {0} can not be resolved because no settings name is given.", match));
                case 'command':
                    return this.resolveFromMap(configurationResolver_1.VariableKind.Command, match, argument, commandValueMapping, 'command');
                case 'input':
                    return this.resolveFromMap(configurationResolver_1.VariableKind.Input, match, argument, commandValueMapping, 'input');
                case 'extensionInstallFolder':
                    if (argument) {
                        const ext = await this._context.getExtension(argument);
                        if (!ext) {
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.ExtensionInstallFolder, (0, nls_1.localize)('extensionNotInstalled', "Variable {0} can not be resolved because the extension {1} is not installed.", match, argument));
                        }
                        return this.fsPath(ext.extensionLocation);
                    }
                    throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.ExtensionInstallFolder, (0, nls_1.localize)('missingExtensionName', "Variable {0} can not be resolved because no extension name is given.", match));
                default: {
                    switch (variable) {
                        case 'workspaceRoot':
                        case 'workspaceFolder':
                            return (0, labels_1.normalizeDriveLetter)(this.fsPath(getFolderUri(configurationResolver_1.VariableKind.WorkspaceFolder)));
                        case 'cwd':
                            return ((folderUri || argument) ? (0, labels_1.normalizeDriveLetter)(this.fsPath(getFolderUri(configurationResolver_1.VariableKind.Cwd))) : process.cwd());
                        case 'workspaceRootFolderName':
                        case 'workspaceFolderBasename':
                            return (0, labels_1.normalizeDriveLetter)(paths.basename(this.fsPath(getFolderUri(configurationResolver_1.VariableKind.WorkspaceFolderBasename))));
                        case 'userHome': {
                            if (environment.userHome) {
                                return environment.userHome;
                            }
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.UserHome, (0, nls_1.localize)('canNotResolveUserHome', "Variable {0} can not be resolved. UserHome path is not defined", match));
                        }
                        case 'lineNumber': {
                            const lineNumber = this._context.getLineNumber();
                            if (lineNumber) {
                                return lineNumber;
                            }
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.LineNumber, (0, nls_1.localize)('canNotResolveLineNumber', "Variable {0} can not be resolved. Make sure to have a line selected in the active editor.", match));
                        }
                        case 'selectedText': {
                            const selectedText = this._context.getSelectedText();
                            if (selectedText) {
                                return selectedText;
                            }
                            throw new configurationResolver_1.VariableError(configurationResolver_1.VariableKind.SelectedText, (0, nls_1.localize)('canNotResolveSelectedText', "Variable {0} can not be resolved. Make sure to have some text selected in the active editor.", match));
                        }
                        case 'file':
                            return getFilePath(configurationResolver_1.VariableKind.File);
                        case 'fileWorkspaceFolder':
                            return getFolderPathForFile(configurationResolver_1.VariableKind.FileWorkspaceFolder);
                        case 'fileWorkspaceFolderBasename':
                            return paths.basename(getFolderPathForFile(configurationResolver_1.VariableKind.FileWorkspaceFolderBasename));
                        case 'relativeFile':
                            if (folderUri || argument) {
                                return paths.relative(this.fsPath(getFolderUri(configurationResolver_1.VariableKind.RelativeFile)), getFilePath(configurationResolver_1.VariableKind.RelativeFile));
                            }
                            return getFilePath(configurationResolver_1.VariableKind.RelativeFile);
                        case 'relativeFileDirname': {
                            const dirname = paths.dirname(getFilePath(configurationResolver_1.VariableKind.RelativeFileDirname));
                            if (folderUri || argument) {
                                const relative = paths.relative(this.fsPath(getFolderUri(configurationResolver_1.VariableKind.RelativeFileDirname)), dirname);
                                return relative.length === 0 ? '.' : relative;
                            }
                            return dirname;
                        }
                        case 'fileDirname':
                            return paths.dirname(getFilePath(configurationResolver_1.VariableKind.FileDirname));
                        case 'fileExtname':
                            return paths.extname(getFilePath(configurationResolver_1.VariableKind.FileExtname));
                        case 'fileBasename':
                            return paths.basename(getFilePath(configurationResolver_1.VariableKind.FileBasename));
                        case 'fileBasenameNoExtension': {
                            const basename = paths.basename(getFilePath(configurationResolver_1.VariableKind.FileBasenameNoExtension));
                            return (basename.slice(0, basename.length - paths.extname(basename).length));
                        }
                        case 'fileDirnameBasename':
                            return paths.basename(paths.dirname(getFilePath(configurationResolver_1.VariableKind.FileDirnameBasename)));
                        case 'execPath': {
                            const ep = this._context.getExecPath();
                            if (ep) {
                                return ep;
                            }
                            return match;
                        }
                        case 'execInstallFolder': {
                            const ar = this._context.getAppRoot();
                            if (ar) {
                                return ar;
                            }
                            return match;
                        }
                        case 'pathSeparator':
                        case '/':
                            return paths.sep;
                        default:
                            try {
                                const key = argument ? `${variable}:${argument}` : variable;
                                return this.resolveFromMap(configurationResolver_1.VariableKind.Unknown, match, key, commandValueMapping, undefined);
                            }
                            catch (error) {
                                return match;
                            }
                    }
                }
            }
        }
        resolveFromMap(variableKind, match, argument, commandValueMapping, prefix) {
            if (argument && commandValueMapping) {
                const v = (prefix === undefined) ? commandValueMapping[argument] : commandValueMapping[prefix + ':' + argument];
                if (typeof v === 'string') {
                    return v;
                }
                throw new configurationResolver_1.VariableError(variableKind, (0, nls_1.localize)('noValueForCommand', "Variable {0} can not be resolved because the command has no value.", match));
            }
            return match;
        }
    }
    exports.AbstractVariableResolverService = AbstractVariableResolverService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFyaWFibGVSZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2NvbmZpZ3VyYXRpb25SZXNvbHZlci9jb21tb24vdmFyaWFibGVSZXNvbHZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErQmhHLE1BQWEsK0JBQStCO2lCQUUzQixpQkFBWSxHQUFHLElBQUksQUFBUCxDQUFRO2lCQUNwQixvQkFBZSxHQUFHLGNBQWMsQUFBakIsQ0FBa0I7UUFVakQsWUFBWSxRQUFpQyxFQUFFLGFBQTZCLEVBQUUsZ0JBQWtDLEVBQUUsb0JBQW1EO1lBRjNKLDBCQUFxQixHQUFtRCxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBRzNGLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBQ25DLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztZQUN6QyxJQUFJLG9CQUFvQixFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUU7b0JBQ3BFLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDdEMsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztRQUVPLFVBQVUsQ0FBQyxZQUFpQztZQUNuRCw2Q0FBNkM7WUFDN0MsSUFBSSxvQkFBUyxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxFQUFFLEdBQXdCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29C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