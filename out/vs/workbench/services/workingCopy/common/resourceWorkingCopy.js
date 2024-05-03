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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/files/common/files"], function (require, exports, async_1, cancellation_1, event_1, lifecycle_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceWorkingCopy = void 0;
    let ResourceWorkingCopy = class ResourceWorkingCopy extends lifecycle_1.Disposable {
        constructor(resource, fileService) {
            super();
            this.resource = resource;
            this.fileService = fileService;
            //#region Orphaned Tracking
            this._onDidChangeOrphaned = this._register(new event_1.Emitter());
            this.onDidChangeOrphaned = this._onDidChangeOrphaned.event;
            this.orphaned = false;
            //#endregion
            //#region Dispose
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
        }
        isOrphaned() {
            return this.orphaned;
        }
        async onDidFilesChange(e) {
            let fileEventImpactsUs = false;
            let newInOrphanModeGuess;
            // If we are currently orphaned, we check if the file was added back
            if (this.orphaned) {
                const fileWorkingCopyResourceAdded = e.contains(this.resource, 1 /* FileChangeType.ADDED */);
                if (fileWorkingCopyResourceAdded) {
                    newInOrphanModeGuess = false;
                    fileEventImpactsUs = true;
                }
            }
            // Otherwise we check if the file was deleted
            else {
                const fileWorkingCopyResourceDeleted = e.contains(this.resource, 2 /* FileChangeType.DELETED */);
                if (fileWorkingCopyResourceDeleted) {
                    newInOrphanModeGuess = true;
                    fileEventImpactsUs = true;
                }
            }
            if (fileEventImpactsUs && this.orphaned !== newInOrphanModeGuess) {
                let newInOrphanModeValidated = false;
                if (newInOrphanModeGuess) {
                    // We have received reports of users seeing delete events even though the file still
                    // exists (network shares issue: https://github.com/microsoft/vscode/issues/13665).
                    // Since we do not want to mark the working copy as orphaned, we have to check if the
                    // file is really gone and not just a faulty file event.
                    await (0, async_1.timeout)(100, cancellation_1.CancellationToken.None);
                    if (this.isDisposed()) {
                        newInOrphanModeValidated = true;
                    }
                    else {
                        const exists = await this.fileService.exists(this.resource);
                        newInOrphanModeValidated = !exists;
                    }
                }
                if (this.orphaned !== newInOrphanModeValidated && !this.isDisposed()) {
                    this.setOrphaned(newInOrphanModeValidated);
                }
            }
        }
        setOrphaned(orphaned) {
            if (this.orphaned !== orphaned) {
                this.orphaned = orphaned;
                this._onDidChangeOrphaned.fire();
            }
        }
        isDisposed() {
            return this._store.isDisposed;
        }
        dispose() {
            // State
            this.orphaned = false;
            // Event
            this._onWillDispose.fire();
            super.dispose();
        }
        //#endregion
        //#region Modified Tracking
        isModified() {
            return this.isDirty();
        }
    };
    exports.ResourceWorkingCopy = ResourceWorkingCopy;
    exports.ResourceWorkingCopy = ResourceWorkingCopy = __decorate([
        __param(1, files_1.IFileService)
    ], ResourceWorkingCopy);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VXb3JraW5nQ29weS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2NvbW1vbi9yZXNvdXJjZVdvcmtpbmdDb3B5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNDekYsSUFBZSxtQkFBbUIsR0FBbEMsTUFBZSxtQkFBb0IsU0FBUSxzQkFBVTtRQUUzRCxZQUNVLFFBQWEsRUFDUixXQUE0QztZQUUxRCxLQUFLLEVBQUUsQ0FBQztZQUhDLGFBQVEsR0FBUixRQUFRLENBQUs7WUFDVyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQU8zRCwyQkFBMkI7WUFFVix5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNuRSx3QkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBRXZELGFBQVEsR0FBRyxLQUFLLENBQUM7WUE0RHpCLFlBQVk7WUFHWixpQkFBaUI7WUFFQSxtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzdELGtCQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7WUExRWxELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEYsQ0FBQztRQVNELFVBQVU7WUFDVCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFtQjtZQUNqRCxJQUFJLGtCQUFrQixHQUFHLEtBQUssQ0FBQztZQUMvQixJQUFJLG9CQUF5QyxDQUFDO1lBRTlDLG9FQUFvRTtZQUNwRSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSw0QkFBNEIsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLCtCQUF1QixDQUFDO2dCQUNyRixJQUFJLDRCQUE0QixFQUFFLENBQUM7b0JBQ2xDLG9CQUFvQixHQUFHLEtBQUssQ0FBQztvQkFDN0Isa0JBQWtCLEdBQUcsSUFBSSxDQUFDO2dCQUMzQixDQUFDO1lBQ0YsQ0FBQztZQUVELDZDQUE2QztpQkFDeEMsQ0FBQztnQkFDTCxNQUFNLDhCQUE4QixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsaUNBQXlCLENBQUM7Z0JBQ3pGLElBQUksOEJBQThCLEVBQUUsQ0FBQztvQkFDcEMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO29CQUM1QixrQkFBa0IsR0FBRyxJQUFJLENBQUM7Z0JBQzNCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxrQkFBa0IsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLG9CQUFvQixFQUFFLENBQUM7Z0JBQ2xFLElBQUksd0JBQXdCLEdBQVksS0FBSyxDQUFDO2dCQUM5QyxJQUFJLG9CQUFvQixFQUFFLENBQUM7b0JBRTFCLG9GQUFvRjtvQkFDcEYsbUZBQW1GO29CQUNuRixxRkFBcUY7b0JBQ3JGLHdEQUF3RDtvQkFDeEQsTUFBTSxJQUFBLGVBQU8sRUFBQyxHQUFHLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRTNDLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7d0JBQ3ZCLHdCQUF3QixHQUFHLElBQUksQ0FBQztvQkFDakMsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUM1RCx3QkFBd0IsR0FBRyxDQUFDLE1BQU0sQ0FBQztvQkFDcEMsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyx3QkFBd0IsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO29CQUN0RSxJQUFJLENBQUMsV0FBVyxDQUFDLHdCQUF3QixDQUFDLENBQUM7Z0JBQzVDLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVTLFdBQVcsQ0FBQyxRQUFpQjtZQUN0QyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO2dCQUV6QixJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEMsQ0FBQztRQUNGLENBQUM7UUFVRCxVQUFVO1lBQ1QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUMvQixDQUFDO1FBRVEsT0FBTztZQUVmLFFBQVE7WUFDUixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUV0QixRQUFRO1lBQ1IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUUzQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVELFlBQVk7UUFFWiwyQkFBMkI7UUFFM0IsVUFBVTtZQUNULE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUM7S0FxQkQsQ0FBQTtJQTlIcUIsa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFJdEMsV0FBQSxvQkFBWSxDQUFBO09BSk8sbUJBQW1CLENBOEh4QyJ9