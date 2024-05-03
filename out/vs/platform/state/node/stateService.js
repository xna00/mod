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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/types", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log"], function (require, exports, async_1, buffer_1, lifecycle_1, types_1, environment_1, files_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StateService = exports.StateReadonlyService = exports.FileStorage = exports.SaveStrategy = void 0;
    var SaveStrategy;
    (function (SaveStrategy) {
        SaveStrategy[SaveStrategy["IMMEDIATE"] = 0] = "IMMEDIATE";
        SaveStrategy[SaveStrategy["DELAYED"] = 1] = "DELAYED";
    })(SaveStrategy || (exports.SaveStrategy = SaveStrategy = {}));
    class FileStorage extends lifecycle_1.Disposable {
        constructor(storagePath, saveStrategy, logService, fileService) {
            super();
            this.storagePath = storagePath;
            this.saveStrategy = saveStrategy;
            this.logService = logService;
            this.fileService = fileService;
            this.storage = Object.create(null);
            this.lastSavedStorageContents = '';
            this.flushDelayer = this._register(new async_1.ThrottledDelayer(this.saveStrategy === 0 /* SaveStrategy.IMMEDIATE */ ? 0 : 100 /* buffer saves over a short time */));
            this.initializing = undefined;
            this.closing = undefined;
        }
        init() {
            if (!this.initializing) {
                this.initializing = this.doInit();
            }
            return this.initializing;
        }
        async doInit() {
            try {
                this.lastSavedStorageContents = (await this.fileService.readFile(this.storagePath)).value.toString();
                this.storage = JSON.parse(this.lastSavedStorageContents);
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
            }
        }
        getItem(key, defaultValue) {
            const res = this.storage[key];
            if ((0, types_1.isUndefinedOrNull)(res)) {
                return defaultValue;
            }
            return res;
        }
        setItem(key, data) {
            this.setItems([{ key, data }]);
        }
        setItems(items) {
            let save = false;
            for (const { key, data } of items) {
                // Shortcut for data that did not change
                if (this.storage[key] === data) {
                    continue;
                }
                // Remove items when they are undefined or null
                if ((0, types_1.isUndefinedOrNull)(data)) {
                    if (!(0, types_1.isUndefined)(this.storage[key])) {
                        this.storage[key] = undefined;
                        save = true;
                    }
                }
                // Otherwise add an item
                else {
                    this.storage[key] = data;
                    save = true;
                }
            }
            if (save) {
                this.save();
            }
        }
        removeItem(key) {
            // Only update if the key is actually present (not undefined)
            if (!(0, types_1.isUndefined)(this.storage[key])) {
                this.storage[key] = undefined;
                this.save();
            }
        }
        async save() {
            if (this.closing) {
                return; // already about to close
            }
            return this.flushDelayer.trigger(() => this.doSave());
        }
        async doSave() {
            if (!this.initializing) {
                return; // if we never initialized, we should not save our state
            }
            // Make sure to wait for init to finish first
            await this.initializing;
            // Return early if the database has not changed
            const serializedDatabase = JSON.stringify(this.storage, null, 4);
            if (serializedDatabase === this.lastSavedStorageContents) {
                return;
            }
            // Write to disk
            try {
                await this.fileService.writeFile(this.storagePath, buffer_1.VSBuffer.fromString(serializedDatabase), { atomic: { postfix: '.vsctmp' } });
                this.lastSavedStorageContents = serializedDatabase;
            }
            catch (error) {
                this.logService.error(error);
            }
        }
        async close() {
            if (!this.closing) {
                this.closing = this.flushDelayer.trigger(() => this.doSave(), 0 /* as soon as possible */);
            }
            return this.closing;
        }
    }
    exports.FileStorage = FileStorage;
    let StateReadonlyService = class StateReadonlyService extends lifecycle_1.Disposable {
        constructor(saveStrategy, environmentService, logService, fileService) {
            super();
            this.fileStorage = this._register(new FileStorage(environmentService.stateResource, saveStrategy, logService, fileService));
        }
        async init() {
            await this.fileStorage.init();
        }
        getItem(key, defaultValue) {
            return this.fileStorage.getItem(key, defaultValue);
        }
    };
    exports.StateReadonlyService = StateReadonlyService;
    exports.StateReadonlyService = StateReadonlyService = __decorate([
        __param(1, environment_1.IEnvironmentService),
        __param(2, log_1.ILogService),
        __param(3, files_1.IFileService)
    ], StateReadonlyService);
    class StateService extends StateReadonlyService {
        setItem(key, data) {
            this.fileStorage.setItem(key, data);
        }
        setItems(items) {
            this.fileStorage.setItems(items);
        }
        removeItem(key) {
            this.fileStorage.removeItem(key);
        }
        close() {
            return this.fileStorage.close();
        }
    }
    exports.StateService = StateService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9zdGF0ZS9ub2RlL3N0YXRlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjaEcsSUFBa0IsWUFHakI7SUFIRCxXQUFrQixZQUFZO1FBQzdCLHlEQUFTLENBQUE7UUFDVCxxREFBTyxDQUFBO0lBQ1IsQ0FBQyxFQUhpQixZQUFZLDRCQUFaLFlBQVksUUFHN0I7SUFFRCxNQUFhLFdBQVksU0FBUSxzQkFBVTtRQVUxQyxZQUNrQixXQUFnQixFQUNoQixZQUEwQixFQUMxQixVQUF1QixFQUN2QixXQUF5QjtZQUUxQyxLQUFLLEVBQUUsQ0FBQztZQUxTLGdCQUFXLEdBQVgsV0FBVyxDQUFLO1lBQ2hCLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQzFCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDdkIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFabkMsWUFBTyxHQUFvQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9DLDZCQUF3QixHQUFHLEVBQUUsQ0FBQztZQUVyQixpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBTyxJQUFJLENBQUMsWUFBWSxtQ0FBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsb0NBQW9DLENBQUMsQ0FBQyxDQUFDO1lBRWhLLGlCQUFZLEdBQThCLFNBQVMsQ0FBQztZQUNwRCxZQUFPLEdBQThCLFNBQVMsQ0FBQztRQVN2RCxDQUFDO1FBRUQsSUFBSTtZQUNILElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ25DLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztRQUVPLEtBQUssQ0FBQyxNQUFNO1lBQ25CLElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMsd0JBQXdCLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDckcsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQzFELENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUF5QixLQUFNLENBQUMsbUJBQW1CLCtDQUF1QyxFQUFFLENBQUM7b0JBQzVGLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM5QixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFJRCxPQUFPLENBQUksR0FBVyxFQUFFLFlBQWdCO1lBQ3ZDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUIsSUFBSSxJQUFBLHlCQUFpQixFQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sWUFBWSxDQUFDO1lBQ3JCLENBQUM7WUFFRCxPQUFPLEdBQVEsQ0FBQztRQUNqQixDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQVcsRUFBRSxJQUE0RDtZQUNoRixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFRCxRQUFRLENBQUMsS0FBK0Y7WUFDdkcsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO1lBRWpCLEtBQUssTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFFbkMsd0NBQXdDO2dCQUN4QyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ2hDLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCwrQ0FBK0M7Z0JBQy9DLElBQUksSUFBQSx5QkFBaUIsRUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUM3QixJQUFJLENBQUMsSUFBQSxtQkFBVyxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUNyQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQzt3QkFDOUIsSUFBSSxHQUFHLElBQUksQ0FBQztvQkFDYixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsd0JBQXdCO3FCQUNuQixDQUFDO29CQUNMLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUN6QixJQUFJLEdBQUcsSUFBSSxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDYixDQUFDO1FBQ0YsQ0FBQztRQUVELFVBQVUsQ0FBQyxHQUFXO1lBRXJCLDZEQUE2RDtZQUM3RCxJQUFJLENBQUMsSUFBQSxtQkFBVyxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsSUFBSTtZQUNqQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxDQUFDLHlCQUF5QjtZQUNsQyxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRU8sS0FBSyxDQUFDLE1BQU07WUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxDQUFDLHdEQUF3RDtZQUNqRSxDQUFDO1lBRUQsNkNBQTZDO1lBQzdDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQztZQUV4QiwrQ0FBK0M7WUFDL0MsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLElBQUksa0JBQWtCLEtBQUssSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQzFELE9BQU87WUFDUixDQUFDO1lBRUQsZ0JBQWdCO1lBQ2hCLElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2hJLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxrQkFBa0IsQ0FBQztZQUNwRCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsS0FBSztZQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1lBQzVGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztLQUNEO0lBbElELGtDQWtJQztJQUVNLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFNbkQsWUFDQyxZQUEwQixFQUNMLGtCQUF1QyxFQUMvQyxVQUF1QixFQUN0QixXQUF5QjtZQUV2QyxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQzdILENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSTtZQUNULE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBSUQsT0FBTyxDQUFJLEdBQVcsRUFBRSxZQUFnQjtZQUN2QyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNwRCxDQUFDO0tBQ0QsQ0FBQTtJQTFCWSxvREFBb0I7bUNBQXBCLG9CQUFvQjtRQVE5QixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsb0JBQVksQ0FBQTtPQVZGLG9CQUFvQixDQTBCaEM7SUFFRCxNQUFhLFlBQWEsU0FBUSxvQkFBb0I7UUFJckQsT0FBTyxDQUFDLEdBQVcsRUFBRSxJQUE0RDtZQUNoRixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELFFBQVEsQ0FBQyxLQUErRjtZQUN2RyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsVUFBVSxDQUFDLEdBQVc7WUFDckIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELEtBQUs7WUFDSixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDakMsQ0FBQztLQUNEO0lBbkJELG9DQW1CQyJ9