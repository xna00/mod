/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/browser/abstractTaskService", "vs/workbench/contrib/tasks/common/taskService", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, tasks_1, abstractTaskService_1, taskService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskService = void 0;
    class TaskService extends abstractTaskService_1.AbstractTaskService {
        static { this.ProcessTaskSystemSupportMessage = nls.localize('taskService.processTaskSystem', 'Process task system is not support in the web.'); }
        _getTaskSystem() {
            if (this._taskSystem) {
                return this._taskSystem;
            }
            if (this.executionEngine !== tasks_1.ExecutionEngine.Terminal) {
                throw new Error(TaskService.ProcessTaskSystemSupportMessage);
            }
            this._taskSystem = this._createTerminalTaskSystem();
            this._taskSystemListeners =
                [
                    this._taskSystem.onDidStateChange((event) => {
                        this._taskRunningState.set(this._taskSystem.isActiveSync());
                        this._onDidStateChange.fire(event);
                    }),
                ];
            return this._taskSystem;
        }
        _computeLegacyConfiguration(workspaceFolder) {
            throw new Error(TaskService.ProcessTaskSystemSupportMessage);
        }
        _versionAndEngineCompatible(filter) {
            return this.executionEngine === tasks_1.ExecutionEngine.Terminal;
        }
    }
    exports.TaskService = TaskService;
    (0, extensions_1.registerSingleton)(taskService_1.ITaskService, TaskService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rhc2tzL2Jyb3dzZXIvdGFza1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsV0FBWSxTQUFRLHlDQUFtQjtpQkFDM0Isb0NBQStCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQywrQkFBK0IsRUFBRSxnREFBZ0QsQ0FBQyxDQUFDO1FBRWhKLGNBQWM7WUFDdkIsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3RCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUN6QixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLHVCQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3ZELE1BQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLCtCQUErQixDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDcEQsSUFBSSxDQUFDLG9CQUFvQjtnQkFDeEI7b0JBQ0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO3dCQUMzQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFZLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQzt3QkFDN0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDcEMsQ0FBQyxDQUFDO2lCQUNGLENBQUM7WUFDSCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUVTLDJCQUEyQixDQUFDLGVBQWlDO1lBQ3RFLE1BQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLCtCQUErQixDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVTLDJCQUEyQixDQUFDLE1BQW9CO1lBQ3pELE9BQU8sSUFBSSxDQUFDLGVBQWUsS0FBSyx1QkFBZSxDQUFDLFFBQVEsQ0FBQztRQUMxRCxDQUFDOztJQTNCRixrQ0E0QkM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDBCQUFZLEVBQUUsV0FBVyxvQ0FBNEIsQ0FBQyJ9