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
define(["require", "exports", "vs/base/common/path", "vs/base/common/uri", "vs/base/node/processes", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostConfiguration", "vs/platform/workspace/common/workspace", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostTask", "vs/base/common/network", "vs/platform/log/common/log", "vs/workbench/api/common/extHostApiDeprecationService", "vs/base/common/resources", "os", "vs/workbench/api/common/extHostVariableResolverService"], function (require, exports, path, uri_1, processes_1, extHostWorkspace_1, extHostDocumentsAndEditors_1, extHostConfiguration_1, workspace_1, extHostTerminalService_1, extHostRpcService_1, extHostInitDataService_1, extHostTask_1, network_1, log_1, extHostApiDeprecationService_1, resources, os_1, extHostVariableResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTask = void 0;
    let ExtHostTask = class ExtHostTask extends extHostTask_1.ExtHostTaskBase {
        constructor(extHostRpc, initData, workspaceService, editorService, configurationService, extHostTerminalService, logService, deprecationService, variableResolver) {
            super(extHostRpc, initData, workspaceService, editorService, configurationService, extHostTerminalService, logService, deprecationService);
            this.workspaceService = workspaceService;
            this.variableResolver = variableResolver;
            if (initData.remote.isRemote && initData.remote.authority) {
                this.registerTaskSystem(network_1.Schemas.vscodeRemote, {
                    scheme: network_1.Schemas.vscodeRemote,
                    authority: initData.remote.authority,
                    platform: process.platform
                });
            }
            else {
                this.registerTaskSystem(network_1.Schemas.file, {
                    scheme: network_1.Schemas.file,
                    authority: '',
                    platform: process.platform
                });
            }
            this._proxy.$registerSupportedExecutions(true, true, true);
        }
        async executeTask(extension, task) {
            const tTask = task;
            if (!task.execution && (tTask._id === undefined)) {
                throw new Error('Tasks to execute must include an execution');
            }
            // We have a preserved ID. So the task didn't change.
            if (tTask._id !== undefined) {
                // Always get the task execution first to prevent timing issues when retrieving it later
                const handleDto = extHostTask_1.TaskHandleDTO.from(tTask, this.workspaceService);
                const executionDTO = await this._proxy.$getTaskExecution(handleDto);
                if (executionDTO.task === undefined) {
                    throw new Error('Task from execution DTO is undefined');
                }
                const execution = await this.getTaskExecution(executionDTO, task);
                this._proxy.$executeTask(handleDto).catch(() => { });
                return execution;
            }
            else {
                const dto = extHostTask_1.TaskDTO.from(task, extension);
                if (dto === undefined) {
                    return Promise.reject(new Error('Task is not valid'));
                }
                // If this task is a custom execution, then we need to save it away
                // in the provided custom execution map that is cleaned up after the
                // task is executed.
                if (extHostTask_1.CustomExecutionDTO.is(dto.execution)) {
                    await this.addCustomExecution(dto, task, false);
                }
                // Always get the task execution first to prevent timing issues when retrieving it later
                const execution = await this.getTaskExecution(await this._proxy.$getTaskExecution(dto), task);
                this._proxy.$executeTask(dto).catch(() => { });
                return execution;
            }
        }
        provideTasksInternal(validTypes, taskIdPromises, handler, value) {
            const taskDTOs = [];
            if (value) {
                for (const task of value) {
                    this.checkDeprecation(task, handler);
                    if (!task.definition || !validTypes[task.definition.type]) {
                        this._logService.warn(`The task [${task.source}, ${task.name}] uses an undefined task type. The task will be ignored in the future.`);
                    }
                    const taskDTO = extHostTask_1.TaskDTO.from(task, handler.extension);
                    if (taskDTO) {
                        taskDTOs.push(taskDTO);
                        if (extHostTask_1.CustomExecutionDTO.is(taskDTO.execution)) {
                            // The ID is calculated on the main thread task side, so, let's call into it here.
                            // We need the task id's pre-computed for custom task executions because when OnDidStartTask
                            // is invoked, we have to be able to map it back to our data.
                            taskIdPromises.push(this.addCustomExecution(taskDTO, task, true));
                        }
                    }
                }
            }
            return {
                tasks: taskDTOs,
                extension: handler.extension
            };
        }
        async resolveTaskInternal(resolvedTaskDTO) {
            return resolvedTaskDTO;
        }
        async getAFolder(workspaceFolders) {
            let folder = (workspaceFolders && workspaceFolders.length > 0) ? workspaceFolders[0] : undefined;
            if (!folder) {
                const userhome = uri_1.URI.file((0, os_1.homedir)());
                folder = new workspace_1.WorkspaceFolder({ uri: userhome, name: resources.basename(userhome), index: 0 });
            }
            return {
                uri: folder.uri,
                name: folder.name,
                index: folder.index,
                toResource: () => {
                    throw new Error('Not implemented');
                }
            };
        }
        async $resolveVariables(uriComponents, toResolve) {
            const uri = uri_1.URI.revive(uriComponents);
            const result = {
                process: undefined,
                variables: Object.create(null)
            };
            const workspaceFolder = await this._workspaceProvider.resolveWorkspaceFolder(uri);
            const workspaceFolders = (await this._workspaceProvider.getWorkspaceFolders2()) ?? [];
            const resolver = await this.variableResolver.getResolver();
            const ws = workspaceFolder ? {
                uri: workspaceFolder.uri,
                name: workspaceFolder.name,
                index: workspaceFolder.index,
                toResource: () => {
                    throw new Error('Not implemented');
                }
            } : await this.getAFolder(workspaceFolders);
            for (const variable of toResolve.variables) {
                result.variables[variable] = await resolver.resolveAsync(ws, variable);
            }
            if (toResolve.process !== undefined) {
                let paths = undefined;
                if (toResolve.process.path !== undefined) {
                    paths = toResolve.process.path.split(path.delimiter);
                    for (let i = 0; i < paths.length; i++) {
                        paths[i] = await resolver.resolveAsync(ws, paths[i]);
                    }
                }
                result.process = await processes_1.win32.findExecutable(await resolver.resolveAsync(ws, toResolve.process.name), toResolve.process.cwd !== undefined ? await resolver.resolveAsync(ws, toResolve.process.cwd) : undefined, paths);
            }
            return result;
        }
        async $jsonTasksSupported() {
            return true;
        }
        async $findExecutable(command, cwd, paths) {
            return processes_1.win32.findExecutable(command, cwd, paths);
        }
    };
    exports.ExtHostTask = ExtHostTask;
    exports.ExtHostTask = ExtHostTask = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostWorkspace_1.IExtHostWorkspace),
        __param(3, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, extHostTerminalService_1.IExtHostTerminalService),
        __param(6, log_1.ILogService),
        __param(7, extHostApiDeprecationService_1.IExtHostApiDeprecationService),
        __param(8, extHostVariableResolverService_1.IExtHostVariableResolverProvider)
    ], ExtHostTask);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRhc2suanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS9leHRIb3N0VGFzay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5QnpGLElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVksU0FBUSw2QkFBZTtRQUMvQyxZQUNxQixVQUE4QixFQUN6QixRQUFpQyxFQUN0QixnQkFBbUMsRUFDMUMsYUFBMEMsRUFDaEQsb0JBQTJDLEVBQ3pDLHNCQUErQyxFQUMzRCxVQUF1QixFQUNMLGtCQUFpRCxFQUM3QixnQkFBa0Q7WUFFckcsS0FBSyxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLG9CQUFvQixFQUFFLHNCQUFzQixFQUFFLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBUnZHLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFNcEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQztZQUdyRyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzNELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxpQkFBTyxDQUFDLFlBQVksRUFBRTtvQkFDN0MsTUFBTSxFQUFFLGlCQUFPLENBQUMsWUFBWTtvQkFDNUIsU0FBUyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUztvQkFDcEMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO2lCQUMxQixDQUFDLENBQUM7WUFDSixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGlCQUFPLENBQUMsSUFBSSxFQUFFO29CQUNyQyxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxJQUFJO29C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