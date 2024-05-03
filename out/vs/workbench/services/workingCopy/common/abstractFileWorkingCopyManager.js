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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/async", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyBackup"], function (require, exports, event_1, lifecycle_1, map_1, async_1, files_1, log_1, workingCopyBackup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseFileWorkingCopyManager = void 0;
    let BaseFileWorkingCopyManager = class BaseFileWorkingCopyManager extends lifecycle_1.Disposable {
        constructor(fileService, logService, workingCopyBackupService) {
            super();
            this.fileService = fileService;
            this.logService = logService;
            this.workingCopyBackupService = workingCopyBackupService;
            this._onDidCreate = this._register(new event_1.Emitter());
            this.onDidCreate = this._onDidCreate.event;
            this.mapResourceToWorkingCopy = new map_1.ResourceMap();
            this.mapResourceToDisposeListener = new map_1.ResourceMap();
        }
        has(resource) {
            return this.mapResourceToWorkingCopy.has(resource);
        }
        add(resource, workingCopy) {
            const knownWorkingCopy = this.get(resource);
            if (knownWorkingCopy === workingCopy) {
                return; // already cached
            }
            // Add to our working copy map
            this.mapResourceToWorkingCopy.set(resource, workingCopy);
            // Update our dispose listener to remove it on dispose
            this.mapResourceToDisposeListener.get(resource)?.dispose();
            this.mapResourceToDisposeListener.set(resource, workingCopy.onWillDispose(() => this.remove(resource)));
            // Signal creation event
            this._onDidCreate.fire(workingCopy);
        }
        remove(resource) {
            // Dispose any existing listener
            const disposeListener = this.mapResourceToDisposeListener.get(resource);
            if (disposeListener) {
                (0, lifecycle_1.dispose)(disposeListener);
                this.mapResourceToDisposeListener.delete(resource);
            }
            // Remove from our working copy map
            return this.mapResourceToWorkingCopy.delete(resource);
        }
        //#region Get / Get all
        get workingCopies() {
            return [...this.mapResourceToWorkingCopy.values()];
        }
        get(resource) {
            return this.mapResourceToWorkingCopy.get(resource);
        }
        //#endregion
        //#region Lifecycle
        dispose() {
            super.dispose();
            // Clear working copy caches
            //
            // Note: we are not explicitly disposing the working copies
            // known to the manager because this can have unwanted side
            // effects such as backups getting discarded once the working
            // copy unregisters. We have an explicit `destroy`
            // for that purpose (https://github.com/microsoft/vscode/pull/123555)
            //
            this.mapResourceToWorkingCopy.clear();
            // Dispose the dispose listeners
            (0, lifecycle_1.dispose)(this.mapResourceToDisposeListener.values());
            this.mapResourceToDisposeListener.clear();
        }
        async destroy() {
            // Make sure all dirty working copies are saved to disk
            try {
                await async_1.Promises.settled(this.workingCopies.map(async (workingCopy) => {
                    if (workingCopy.isDirty()) {
                        await this.saveWithFallback(workingCopy);
                    }
                }));
            }
            catch (error) {
                this.logService.error(error);
            }
            // Dispose all working copies
            (0, lifecycle_1.dispose)(this.mapResourceToWorkingCopy.values());
            // Finally dispose manager
            this.dispose();
        }
        async saveWithFallback(workingCopy) {
            // First try regular save
            let saveSuccess = false;
            try {
                saveSuccess = await workingCopy.save();
            }
            catch (error) {
                // Ignore
            }
            // Then fallback to backup if that exists
            if (!saveSuccess || workingCopy.isDirty()) {
                const backup = await this.workingCopyBackupService.resolve(workingCopy);
                if (backup) {
                    await this.fileService.writeFile(workingCopy.resource, backup.value, { unlock: true });
                }
            }
        }
    };
    exports.BaseFileWorkingCopyManager = BaseFileWorkingCopyManager;
    exports.BaseFileWorkingCopyManager = BaseFileWorkingCopyManager = __decorate([
        __param(0, files_1.IFileService),
        __param(1, log_1.ILogService),
        __param(2, workingCopyBackup_1.IWorkingCopyBackupService)
    ], BaseFileWorkingCopyManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RGaWxlV29ya2luZ0NvcHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvY29tbW9uL2Fic3RyYWN0RmlsZVdvcmtpbmdDb3B5TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQ3pGLElBQWUsMEJBQTBCLEdBQXpDLE1BQWUsMEJBQTJGLFNBQVEsc0JBQVU7UUFRbEksWUFDZSxXQUE0QyxFQUM3QyxVQUEwQyxFQUM1Qix3QkFBc0U7WUFFakcsS0FBSyxFQUFFLENBQUM7WUFKeUIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDMUIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNULDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMkI7WUFUakYsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFLLENBQUMsQ0FBQztZQUN4RCxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBRTlCLDZCQUF3QixHQUFHLElBQUksaUJBQVcsRUFBSyxDQUFDO1lBQ2hELGlDQUE0QixHQUFHLElBQUksaUJBQVcsRUFBZSxDQUFDO1FBUS9FLENBQUM7UUFFUyxHQUFHLENBQUMsUUFBYTtZQUMxQixPQUFPLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVTLEdBQUcsQ0FBQyxRQUFhLEVBQUUsV0FBYztZQUMxQyxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUMsSUFBSSxnQkFBZ0IsS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxDQUFDLGlCQUFpQjtZ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