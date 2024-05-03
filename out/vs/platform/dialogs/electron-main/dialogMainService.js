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
define(["require", "exports", "electron", "vs/base/common/async", "vs/base/common/hash", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/normalization", "vs/base/common/platform", "vs/base/node/pfs", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/workspace/common/workspace"], function (require, exports, electron_1, async_1, hash_1, labels_1, lifecycle_1, normalization_1, platform_1, pfs_1, nls_1, dialogs_1, instantiation_1, log_1, productService_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DialogMainService = exports.IDialogMainService = void 0;
    exports.IDialogMainService = (0, instantiation_1.createDecorator)('dialogMainService');
    let DialogMainService = class DialogMainService {
        constructor(logService, productService) {
            this.logService = logService;
            this.productService = productService;
            this.windowFileDialogLocks = new Map();
            this.windowDialogQueues = new Map();
            this.noWindowDialogueQueue = new async_1.Queue();
        }
        pickFileFolder(options, window) {
            return this.doPick({ ...options, pickFolders: true, pickFiles: true, title: (0, nls_1.localize)('open', "Open") }, window);
        }
        pickFolder(options, window) {
            return this.doPick({ ...options, pickFolders: true, title: (0, nls_1.localize)('openFolder', "Open Folder") }, window);
        }
        pickFile(options, window) {
            return this.doPick({ ...options, pickFiles: true, title: (0, nls_1.localize)('openFile', "Open File") }, window);
        }
        pickWorkspace(options, window) {
            const title = (0, nls_1.localize)('openWorkspaceTitle', "Open Workspace from File");
            const buttonLabel = (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'openWorkspace', comment: ['&& denotes a mnemonic'] }, "&&Open"));
            const filters = workspace_1.WORKSPACE_FILTER;
            return this.doPick({ ...options, pickFiles: true, title, filters, buttonLabel }, window);
        }
        async doPick(options, window) {
            // Ensure dialog options
            const dialogOptions = {
                title: options.title,
                buttonLabel: options.buttonLabel,
                filters: options.filters,
                defaultPath: options.defaultPath
            };
            // Ensure properties
            if (typeof options.pickFiles === 'boolean' || typeof options.pickFolders === 'boolean') {
                dialogOptions.properties = undefined; // let it override based on the booleans
                if (options.pickFiles && options.pickFolders) {
                    dialogOptions.properties = ['multiSelections', 'openDirectory', 'openFile', 'createDirectory'];
                }
            }
            if (!dialogOptions.properties) {
                dialogOptions.properties = ['multiSelections', options.pickFolders ? 'openDirectory' : 'openFile', 'createDirectory'];
            }
            if (platform_1.isMacintosh) {
                dialogOptions.properties.push('treatPackageAsDirectory'); // always drill into .app files
            }
            // Show Dialog
            const result = await this.showOpenDialog(dialogOptions, (window || electron_1.BrowserWindow.getFocusedWindow()) ?? undefined);
            if (result && result.filePaths && result.filePaths.length > 0) {
                return result.filePaths;
            }
            return undefined;
        }
        getWindowDialogQueue(window) {
            // Queue message box requests per window so that one can show
            // after the other.
            if (window) {
                let windowDialogQueue = this.windowDialogQueues.get(window.id);
                if (!windowDialogQueue) {
                    windowDialogQueue = new async_1.Queue();
                    this.windowDialogQueues.set(window.id, windowDialogQueue);
                }
                return windowDialogQueue;
            }
            else {
                return this.noWindowDialogueQueue;
            }
        }
        showMessageBox(rawOptions, window) {
            return this.getWindowDialogQueue(window).queue(async () => {
                const { options, buttonIndeces } = (0, dialogs_1.massageMessageBoxOptions)(rawOptions, this.productService);
                let result = undefined;
                if (window) {
                    result = await electron_1.dialog.showMessageBox(window, options);
                }
                else {
                    result = await electron_1.dialog.showMessageBox(options);
                }
                return {
                    response: buttonIndeces[result.response],
                    checkboxChecked: result.checkboxChecked
                };
            });
        }
        async showSaveDialog(options, window) {
            // Prevent duplicates of the same dialog queueing at the same time
            const fileDialogLock = this.acquireFileDialogLock(options, window);
            if (!fileDialogLock) {
                this.logService.error('[DialogMainService]: file save dialog is already or will be showing for the window with the same configuration');
                return { canceled: true };
            }
            try {
                return await this.getWindowDialogQueue(window).queue(async () => {
                    let result;
                    if (window) {
                        result = await electron_1.dialog.showSaveDialog(window, options);
                    }
                    else {
                        result = await electron_1.dialog.showSaveDialog(options);
                    }
                    result.filePath = this.normalizePath(result.filePath);
                    return result;
                });
            }
            finally {
                (0, lifecycle_1.dispose)(fileDialogLock);
            }
        }
        normalizePath(path) {
            if (path && platform_1.isMacintosh) {
                path = (0, normalization_1.normalizeNFC)(path); // macOS only: normalize paths to NFC form
            }
            return path;
        }
        normalizePaths(paths) {
            return paths.map(path => this.normalizePath(path));
        }
        async showOpenDialog(options, window) {
            // Ensure the path exists (if provided)
            if (options.defaultPath) {
                const pathExists = await pfs_1.Promises.exists(options.defaultPath);
                if (!pathExists) {
                    options.defaultPath = undefined;
                }
            }
            // Prevent duplicates of the same dialog queueing at the same time
            const fileDialogLock = this.acquireFileDialogLock(options, window);
            if (!fileDialogLock) {
                this.logService.error('[DialogMainService]: file open dialog is already or will be showing for the window with the same configuration');
                return { canceled: true, filePaths: [] };
            }
            try {
                return await this.getWindowDialogQueue(window).queue(async () => {
                    let result;
                    if (window) {
                        result = await electron_1.dialog.showOpenDialog(window, options);
                    }
                    else {
                        result = await electron_1.dialog.showOpenDialog(options);
                    }
                    result.filePaths = this.normalizePaths(result.filePaths);
                    return result;
                });
            }
            finally {
                (0, lifecycle_1.dispose)(fileDialogLock);
            }
        }
        acquireFileDialogLock(options, window) {
            // If no window is provided, allow as many dialogs as
            // needed since we consider them not modal per window
            if (!window) {
                return lifecycle_1.Disposable.None;
            }
            // If a window is provided, only allow a single dialog
            // at the same time because dialogs are modal and we
            // do not want to open one dialog after the other
            // (https://github.com/microsoft/vscode/issues/114432)
            // we figure this out by `hashing` the configuration
            // options for the dialog to prevent duplicates
            this.logService.trace('[DialogMainService]: request to acquire file dialog lock', options);
            let windowFileDialogLocks = this.windowFileDialogLocks.get(window.id);
            if (!windowFileDialogLocks) {
                windowFileDialogLocks = new Set();
                this.windowFileDialogLocks.set(window.id, windowFileDialogLocks);
            }
            const optionsHash = (0, hash_1.hash)(options);
            if (windowFileDialogLocks.has(optionsHash)) {
                return undefined; // prevent duplicates, return
            }
            this.logService.trace('[DialogMainService]: new file dialog lock created', options);
            windowFileDialogLocks.add(optionsHash);
            return (0, lifecycle_1.toDisposable)(() => {
                this.logService.trace('[DialogMainService]: file dialog lock disposed', options);
                windowFileDialogLocks?.delete(optionsHash);
                // If the window has no more dialog locks, delete it from the set of locks
                if (windowFileDialogLocks?.size === 0) {
                    this.windowFileDialogLocks.delete(window.id);
                }
            });
        }
    };
    exports.DialogMainService = DialogMainService;
    exports.DialogMainService = DialogMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, productService_1.IProductService)
    ], DialogMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nTWFpblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2RpYWxvZ3MvZWxlY3Ryb24tbWFpbi9kaWFsb2dNYWluU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQm5GLFFBQUEsa0JBQWtCLEdBQUcsSUFBQSwrQkFBZSxFQUFxQixtQkFBbUIsQ0FBQyxDQUFDO0lBeUJwRixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFpQjtRQVE3QixZQUNjLFVBQXdDLEVBQ3BDLGNBQWdEO1lBRG5DLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDbkIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBTmpELDBCQUFxQixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBQ3ZELHVCQUFrQixHQUFHLElBQUksR0FBRyxFQUF3RixDQUFDO1lBQ3JILDBCQUFxQixHQUFHLElBQUksYUFBSyxFQUF5RSxDQUFDO1FBTTVILENBQUM7UUFFRCxjQUFjLENBQUMsT0FBaUMsRUFBRSxNQUFzQjtZQUN2RSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxHQUFHLE9BQU8sRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2pILENBQUM7UUFFRCxVQUFVLENBQUMsT0FBaUMsRUFBRSxNQUFzQjtZQUNuRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxHQUFHLE9BQU8sRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLEVBQUUsRUFB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