define(["require", "exports", "vs/base/common/async", "vs/base/common/network", "vs/base/common/types", "vs/editor/browser/editorBrowser", "vs/nls", "vs/workbench/common/editor", "vs/workbench/services/configurationResolver/common/variableResolver"], function (require, exports, async_1, network_1, Types, editorBrowser_1, nls, editor_1, variableResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseConfigurationResolverService = void 0;
    class BaseConfigurationResolverService extends variableResolver_1.AbstractVariableResolverService {
        static { this.INPUT_OR_COMMAND_VARIABLES_PATTERN = /\${((input|command):(.*?))}/g; }
        constructor(context, envVariablesPromise, editorService, configurationService, commandService, workspaceContextService, quickInputService, labelService, pathService, extensionService) {
            super({
                getFolderUri: (folderName) => {
                    const folder = workspaceContextService.getWorkspace().folders.filter(f => f.name === folderName).pop();
                    return folder ? folder.uri : undefined;
                },
                getWorkspaceFolderCount: () => {
                    return workspaceContextService.getWorkspace().folders.length;
                },
                getConfigurationValue: (folderUri, suffix) => {
                    return configurationService.getValue(suffix, folderUri ? { resource: folderUri } : {});
                },
                getAppRoot: () => {
                    return context.getAppRoot();
                },
                getExecPath: () => {
                    return context.getExecPath();
                },
                getFilePath: () => {
                    const fileResource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, {
                        supportSideBySide: editor_1.SideBySideEditor.PRIMARY,
                        filterByScheme: [network_1.Schemas.file, network_1.Schemas.vscodeUserData, this.pathService.defaultUriScheme]
                    });
                    if (!fileResource) {
                        return undefined;
                    }
                    return this.labelService.getUriLabel(fileResource, { noPrefix: true });
                },
                getWorkspaceFolderPathForFile: () => {
                    const fileResource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, {
                        supportSideBySide: editor_1.SideBySideEditor.PRIMARY,
                        filterByScheme: [network_1.Schemas.file, network_1.Schemas.vscodeUserData, this.pathService.defaultUriScheme]
                    });
                    if (!fileResource) {
                        return undefined;
                    }
                    const wsFolder = workspaceContextService.getWorkspaceFolder(fileResource);
                    if (!wsFolder) {
                        return undefined;
                    }
                    return this.labelService.getUriLabel(wsFolder.uri, { noPrefix: true });
                },
                getSelectedText: () => {
                    const activeTextEditorControl = editorService.activeTextEditorControl;
                    let activeControl = null;
                    if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                        activeControl = activeTextEditorControl;
                    }
                    else if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
                        const original = activeTextEditorControl.getOriginalEditor();
                        const modified = activeTextEditorControl.getModifiedEditor();
                        activeControl = original.hasWidgetFocus() ? original : modified;
                    }
                    const activeModel = activeControl?.getModel();
                    const activeSelection = activeControl?.getSelection();
                    if (activeModel && activeSelection) {
                        return activeModel.getValueInRange(activeSelection);
                    }
                    return undefined;
                },
                getLineNumber: () => {
                    const activeTextEditorControl = editorService.activeTextEditorControl;
                    if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                        const selection = activeTextEditorControl.getSelection();
                        if (selection) {
                            const lineNumber = selection.positionLineNumber;
                            return String(lineNumber);
                        }
                    }
                    return undefined;
                },
                getExtension: id => {
                    return extensionService.getExtension(id);
                },
            }, labelService, pathService.userHome().then(home => home.path), envVariablesPromise);
            this.configurationService = configurationService;
            this.commandService = commandService;
            this.workspaceContextService = workspaceContextService;
            this.quickInputService = quickInputService;
            this.labelService = labelService;
            this.pathService = pathService;
            this.userInputAccessQueue = new async_1.Queue();
        }
        async resolveWithInteractionReplace(folder, config, section, variables, target) {
            // resolve any non-interactive variables and any contributed variables
            config = await this.resolveAnyAsync(folder, config);
            // resolve input variables in the order in which they are encountered
            return this.resolveWithInteraction(folder, config, section, variables, target).then(mapping => {
                // finally substitute evaluated command variables (if there are any)
                if (!mapping) {
                    return null;
                }
                else if (mapping.size > 0) {
                    return this.resolveAnyAsync(folder, config, Object.fromEntries(mapping));
                }
                else {
                    return config;
                }
            });
        }
        async resolveWithInteraction(folder, config, section, variables, target) {
            // resolve any non-interactive variables and any contributed variables
            const resolved = await this.resolveAnyMap(folder, config);
            config = resolved.newConfig;
            const allVariableMapping = resolved.resolvedVariables;
            // resolve input and command variables in the order in which they are encountered
            return this.resolveWithInputAndCommands(folder, config, variables, section, target).then(inputOrCommandMapping => {
                if (this.updateMapping(inputOrCommandMapping, allVariableMapping)) {
                    return allVariableMapping;
                }
                return undefined;
            });
        }
        /**
         * Add all items from newMapping to fullMapping. Returns false if newMapping is undefined.
         */
        updateMapping(newMapping, fullMapping) {
            if (!newMapping) {
                return false;
            }
            for (const [key, value] of Object.entries(newMapping)) {
                fullMapping.set(key, value);
            }
            return true;
        }
        /**
         * Finds and executes all input and command variables in the given configuration and returns their values as a dictionary.
         * Please note: this method does not substitute the input or command variables (so the configuration is not modified).
         * The returned dictionary can be passed to "resolvePlatform" for the actual substitution.
         * See #6569.
         *
         * @param variableToCommandMap Aliases for commands
         */
        async resolveWithInputAndCommands(folder, configuration, variableToCommandMap, section, target) {
            if (!configuration) {
                return Promise.resolve(undefined);
            }
            // get all "inputs"
            let inputs = [];
            if (this.workspaceContextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ && section) {
                const overrides = folder ? { resource: folder.uri } : {};
                const result = this.configurationService.inspect(section, overrides);
                if (result && (result.userValue || result.workspaceValue || result.workspaceFolderValue)) {
                    switch (target) {
                        case 2 /* ConfigurationTarget.USER */:
                            inputs = result.userValue?.inputs;
                            break;
                        case 5 /* ConfigurationTarget.WORKSPACE */:
                            inputs = result.workspaceValue?.inputs;
                            break;
                        default: inputs = result.workspaceFolderValue?.inputs;
                    }
                }
                else {
                    const valueResult = this.configurationService.getValue(section, overrides);
                    if (valueResult) {
                        inputs = valueResult.inputs;
                    }
                }
            }
            // extract and dedupe all "input" and "command" variables and preserve their order in an array
            const variables = [];
            this.findVariables(configuration, variables);
            const variableValues = Object.create(null);
            for (const variable of variables) {
                const [type, name] = variable.split(':', 2);
                let result;
                switch (type) {
                    case 'input':
                        result = await this.showUserInput(name, inputs);
                        break;
                    case 'command': {
                        // use the name as a command ID #12735
                        const commandId = (variableToCommandMap ? variableToCommandMap[name] : undefined) || name;
                        result = await this.commandService.executeCommand(commandId, configuration);
                        if (typeof result !== 'string' && !Types.isUndefinedOrNull(result)) {
                            throw new Error(nls.localize('commandVariable.noStringType', "Cannot substitute command variable '{0}' because command did not return a result of type string.", commandId));
                        }
                        break;
                    }
                    default:
                        // Try to resolve it as a contributed variable
                        if (this._contributedVariables.has(variable)) {
                            result = await this._contributedVariables.get(variable)();
                        }
                }
                if (typeof result === 'string') {
                    variableValues[variable] = result;
                }
                else {
                    return undefined;
                }
            }
            return variableValues;
        }
        /**
         * Recursively finds all command or input variables in object and pushes them into variables.
         * @param object object is searched for variables.
         * @param variables All found variables are returned in variables.
         */
        findVariables(object, variables) {
            if (typeof object === 'string') {
                let matches;
                while ((matches = BaseConfigurationResolverService.INPUT_OR_COMMAND_VARIABLES_PATTERN.exec(object)) !== null) {
                    if (matches.length === 4) {
                        const command = matches[1];
                        if (variables.indexOf(command) < 0) {
                            variables.push(command);
                        }
                    }
                }
                for (const contributed of this._contributedVariables.keys()) {
                    if ((variables.indexOf(contributed) < 0) && (object.indexOf('${' + contributed + '}') >= 0)) {
                        variables.push(contributed);
                    }
                }
            }
            else if (Array.isArray(object)) {
                for (const value of object) {
                    this.findVariables(value, variables);
                }
            }
            else if (object) {
                for (const value of Object.values(object)) {
                    this.findVariables(value, variables);
                }
            }
        }
        /**
         * Takes the provided input info and shows the quick pick so the user can provide the value for the input
         * @param variable Name of the input variable.
         * @param inputInfos Information about each possible input variable.
         */
        showUserInput(variable, inputInfos) {
            if (!inputInfos) {
                return Promise.reject(new Error(nls.localize('inputVariable.noInputSection', "Variable '{0}' must be defined in an '{1}' section of the debug or task configuration.", variable, 'input')));
            }
            // find info for the given input variable
            const info = inputInfos.filter(item => item.id === variable).pop();
            if (info) {
                const missingAttribute = (attrName) => {
                    throw new Error(nls.localize('inputVariable.missingAttribute', "Input variable '{0}' is of type '{1}' and must include '{2}'.", variable, info.type, attrName));
                };
                switch (info.type) {
                    case 'promptString': {
                        if (!Types.isString(info.description)) {
                            missingAttribute('description');
                        }
                        const inputOptions = { prompt: info.description, ignoreFocusLost: true };
                        if (info.default) {
                            inputOptions.value = info.default;
                        }
                        if (info.password) {
                            inputOptions.password = info.password;
                        }
                        return this.userInputAccessQueue.queue(() => this.quickInputService.input(inputOptions)).then(resolvedInput => {
                            return resolvedInput;
                        });
                    }
                    case 'pickString': {
                        if (!Types.isString(info.description)) {
                            missingAttribute('description');
                        }
                        if (Array.isArray(info.options)) {
                            for (const pickOption of info.options) {
                                if (!Types.isString(pickOption) && !Types.isString(pickOption.value)) {
                                    missingAttribute('value');
                                }
                            }
                        }
                        else {
                            missingAttribute('options');
                        }
                        const picks = new Array();
                        for (const pickOption of info.options) {
                            const value = Types.isString(pickOption) ? pickOption : pickOption.value;
                            const label = Types.isString(pickOption) ? undefined : pickOption.label;
                            // If there is no label defined, use value as label
                            const item = {
                                label: label ? `${label}: ${value}` : value,
                                value: value
                            };
                            if (value === info.default) {
                                item.description = nls.localize('inputVariable.defaultInputValue', "(Default)");
                                picks.unshift(item);
                            }
                            else {
                                picks.push(item);
                            }
                        }
                        const pickOptions = { placeHolder: info.description, matchOnDetail: true, ignoreFocusLost: true };
                        return this.userInputAccessQueue.queue(() => this.quickInputService.pick(picks, pickOptions, undefined)).then(resolvedInput => {
                            if (resolvedInput) {
                                return resolvedInput.value;
                            }
                            return undefined;
                        });
                    }
                    case 'command': {
                        if (!Types.isString(info.command)) {
                            missingAttribute('command');
                        }
                        return this.userInputAccessQueue.queue(() => this.commandService.executeCommand(info.command, info.args)).then(result => {
                            if (typeof result === 'string' || Types.isUndefinedOrNull(result)) {
                                return result;
                            }
                            throw new Error(nls.localize('inputVariable.command.noStringType', "Cannot substitute input variable '{0}' because command '{1}' did not return a result of type string.", variable, info.command));
                        });
                    }
                    default:
                        throw new Error(nls.localize('inputVariable.unknownType', "Input variable '{0}' can only be of type 'promptString', 'pickString', or 'command'.", variable));
                }
            }
            return Promise.reject(new Error(nls.localize('inputVariable.undefinedVariable', "Undefined input variable '{0}' encountered. Remove or define '{0}' to continue.", variable)));
        }
    }
    exports.BaseConfigurationResolverService = BaseConfigurationResolverService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZUNvbmZpZ3VyYXRpb25SZXNvbHZlclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9jb25maWd1cmF0aW9uUmVzb2x2ZXIvYnJvd3Nlci9iYXNlQ29uZmlndXJhdGlvblJlc29sdmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBd0JBLE1BQXNCLGdDQUFpQyxTQUFRLGtEQUErQjtpQkFFN0UsdUNBQWtDLEdBQUcsOEJBQThCLEFBQWpDLENBQWtDO1FBSXBGLFlBQ0MsT0FHQyxFQUNELG1CQUFpRCxFQUNqRCxhQUE2QixFQUNaLG9CQUEyQyxFQUMzQyxjQUErQixFQUMvQix1QkFBaUQsRUFDakQsaUJBQXFDLEVBQ3JDLFlBQTJCLEVBQzNCLFdBQXlCLEVBQzFDLGdCQUFtQztZQUVuQyxLQUFLLENBQUM7Z0JBQ0wsWUFBWSxFQUFFLENBQUMsVUFBa0IsRUFBbUIsRUFBRTtvQkFDckQsTUFBTSxNQUFNLEdBQUcsdUJBQXVCLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ3ZHLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7Z0JBQ3hDLENBQUM7Z0JBQ0QsdUJBQXVCLEVBQUUsR0FBVyxFQUFFO29CQUNyQyxPQUFPLHVCQUF1QixDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBQzlELENBQUM7Z0JBQ0QscUJBQXFCLEVBQUUsQ0FBQyxTQUEwQixFQUFFLE1BQWMsRUFBc0IsRUFBRTtvQkFDekYsT0FBTyxvQkFBb0Is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