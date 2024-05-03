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
define(["require", "exports", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/base/common/linkedList"], function (require, exports, log_1, lifecycle_1, configuration_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyFileOperationParticipant = void 0;
    let WorkingCopyFileOperationParticipant = class WorkingCopyFileOperationParticipant extends lifecycle_1.Disposable {
        constructor(logService, configurationService) {
            super();
            this.logService = logService;
            this.configurationService = configurationService;
            this.participants = new linkedList_1.LinkedList();
        }
        addFileOperationParticipant(participant) {
            const remove = this.participants.push(participant);
            return (0, lifecycle_1.toDisposable)(() => remove());
        }
        async participate(files, operation, undoInfo, token) {
            const timeout = this.configurationService.getValue('files.participants.timeout');
            if (typeof timeout !== 'number' || timeout <= 0) {
                return; // disabled
            }
            // For each participant
            for (const participant of this.participants) {
                try {
                    await participant.participate(files, operation, undoInfo, timeout, token);
                }
                catch (err) {
                    this.logService.warn(err);
                }
            }
        }
        dispose() {
            this.participants.clear();
            super.dispose();
        }
    };
    exports.WorkingCopyFileOperationParticipant = WorkingCopyFileOperationParticipant;
    exports.WorkingCopyFileOperationParticipant = WorkingCopyFileOperationParticipant = __decorate([
        __param(0, log_1.ILogService),
        __param(1, configuration_1.IConfigurationService)
    ], WorkingCopyFileOperationParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlGaWxlT3BlcmF0aW9uUGFydGljaXBhbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3JraW5nQ29weS9jb21tb24vd29ya2luZ0NvcHlGaWxlT3BlcmF0aW9uUGFydGljaXBhbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQU0sbUNBQW1DLEdBQXpDLE1BQU0sbUNBQW9DLFNBQVEsc0JBQVU7UUFJbEUsWUFDYyxVQUF3QyxFQUM5QixvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFIc0IsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNiLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFKbkUsaUJBQVksR0FBRyxJQUFJLHVCQUFVLEVBQXdDLENBQUM7UUFPdkYsQ0FBQztRQUVELDJCQUEyQixDQUFDLFdBQWlEO1lBQzVFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRW5ELE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBeUIsRUFBRSxTQUF3QixFQUFFLFFBQWdELEVBQUUsS0FBd0I7WUFDaEosTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBUyw0QkFBNEIsQ0FBQyxDQUFDO1lBQ3pGLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDakQsT0FBTyxDQUFDLFdBQVc7WUFDcEIsQ0FBQztZQUVELHVCQUF1QjtZQUN2QixLQUFLLE1BQU0sV0FBVyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDN0MsSUFBSSxDQUFDO29CQUNKLE1BQU0sV0FBVyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNFLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDM0IsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRVEsT0FBTztZQUNmLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFMUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRCxDQUFBO0lBdENZLGtGQUFtQztrREFBbkMsbUNBQW1DO1FBSzdDLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEscUNBQXFCLENBQUE7T0FOWCxtQ0FBbUMsQ0FzQy9DIn0=