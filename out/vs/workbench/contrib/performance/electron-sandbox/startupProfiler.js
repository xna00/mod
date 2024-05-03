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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/editor/common/services/resolverService", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/contrib/performance/browser/perfviewEditor", "vs/workbench/services/extensions/common/extensions", "vs/platform/clipboard/common/clipboardService", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/platform/native/common/native", "vs/platform/product/common/productService", "vs/platform/files/common/files", "vs/platform/label/common/label"], function (require, exports, nls_1, resources_1, resolverService_1, dialogs_1, environmentService_1, lifecycle_1, perfviewEditor_1, extensions_1, clipboardService_1, uri_1, opener_1, native_1, productService_1, files_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartupProfiler = void 0;
    let StartupProfiler = class StartupProfiler {
        constructor(_dialogService, _environmentService, _textModelResolverService, _clipboardService, lifecycleService, extensionService, _openerService, _nativeHostService, _productService, _fileService, _labelService) {
            this._dialogService = _dialogService;
            this._environmentService = _environmentService;
            this._textModelResolverService = _textModelResolverService;
            this._clipboardService = _clipboardService;
            this._openerService = _openerService;
            this._nativeHostService = _nativeHostService;
            this._productService = _productService;
            this._fileService = _fileService;
            this._labelService = _labelService;
            // wait for everything to be ready
            Promise.all([
                lifecycleService.when(4 /* LifecyclePhase.Eventually */),
                extensionService.whenInstalledExtensionsRegistered()
            ]).then(() => {
                this._stopProfiling();
            });
        }
        _stopProfiling() {
            if (!this._environmentService.args['prof-startup-prefix']) {
                return;
            }
            const profileFilenamePrefix = uri_1.URI.file(this._environmentService.args['prof-startup-prefix']);
            const dir = (0, resources_1.dirname)(profileFilenamePrefix);
            const prefix = (0, resources_1.basename)(profileFilenamePrefix);
            const removeArgs = ['--prof-startup'];
            const markerFile = this._fileService.readFile(profileFilenamePrefix).then(value => removeArgs.push(...value.toString().split('|')))
                .then(() => this._fileService.del(profileFilenamePrefix, { recursive: true })) // (1) delete the file to tell the main process to stop profiling
                .then(() => new Promise(resolve => {
                const check = () => {
                    this._fileService.exists(profileFilenamePrefix).then(exists => {
                        if (exists) {
                            resolve();
                        }
                        else {
                            setTimeout(check, 500);
                        }
                    });
                };
                check();
            }))
                .then(() => this._fileService.del(profileFilenamePrefix, { recursive: true })); // (3) finally delete the file again
            markerFile.then(() => {
                return this._fileService.resolve(dir).then(stat => {
                    return (stat.children ? stat.children.filter(value => value.resource.path.includes(prefix)) : []).map(stat => stat.resource);
                });
            }).then(files => {
                const profileFiles = files.reduce((prev, cur) => `${prev}${this._labelService.getUriLabel(cur)}\n`, '\n');
                return this._dialogService.confirm({
                    type: 'info',
                    message: (0, nls_1.localize)('prof.message', "Successfully created profiles."),
                    detail: (0, nls_1.localize)('prof.detail', "Please create an issue and manually attach the following files:\n{0}", profileFiles),
                    primaryButton: (0, nls_1.localize)({ key: 'prof.restartAndFileIssue', comment: ['&& denotes a mnemonic'] }, "&&Create Issue and Restart"),
                    cancelButton: (0, nls_1.localize)('prof.restart', "Restart")
                }).then(res => {
                    if (res.confirmed) {
                        Promise.all([
                            this._nativeHostService.showItemInFolder(files[0].fsPath),
                            this._createPerfIssue(files.map(file => (0, resources_1.basename)(file)))
                        ]).then(() => {
                            // keep window stable until restart is selected
                            return this._dialogService.confirm({
                                type: 'info',
                                message: (0, nls_1.localize)('prof.thanks', "Thanks for helping us."),
                                detail: (0, nls_1.localize)('prof.detail.restart', "A final restart is required to continue to use '{0}'. Again, thank you for your contribution.", this._productService.nameLong),
                                primaryButton: (0, nls_1.localize)({ key: 'prof.restart.button', comment: ['&& denotes a mnemonic'] }, "&&Restart")
                            }).then(res => {
                                // now we are ready to restart
                                if (res.confirmed) {
                                    this._nativeHostService.relaunch({ removeArgs });
                                }
                            });
                        });
                    }
                    else {
                        // simply restart
                        this._nativeHostService.relaunch({ removeArgs });
                    }
                });
            });
        }
        async _createPerfIssue(files) {
            const reportIssueUrl = this._productService.reportIssueUrl;
            if (!reportIssueUrl) {
                return;
            }
            const contrib = perfviewEditor_1.PerfviewContrib.get();
            const ref = await this._textModelResolverService.createModelReference(contrib.getInputUri());
            try {
                await this._clipboardService.writeText(ref.object.textEditorModel.getValue());
            }
            finally {
                ref.dispose();
            }
            const body = `
1. :warning: We have copied additional data to your clipboard. Make sure to **paste** here. :warning:
1. :warning: Make sure to **attach** these files from your *home*-directory: :warning:\n${files.map(file => `-\`${file}\``).join('\n')}
`;
            const baseUrl = reportIssueUrl;
            const queryStringPrefix = baseUrl.indexOf('?') === -1 ? '?' : '&';
            this._openerService.open(uri_1.URI.parse(`${baseUrl}${queryStringPrefix}body=${encodeURIComponent(body)}`));
        }
    };
    exports.StartupProfiler = StartupProfiler;
    exports.StartupProfiler = StartupProfiler = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, clipboardService_1.IClipboardService),
        __param(4, lifecycle_1.ILifecycleService),
        __param(5, extensions_1.IExtensionService),
        __param(6, opener_1.IOpenerService),
        __param(7, native_1.INativeHostService),
        __param(8, productService_1.IProductService),
        __param(9, files_1.IFileService),
        __param(10, label_1.ILabelService)
    ], StartupProfiler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnR1cFByb2ZpbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wZXJmb3JtYW5jZS9lbGVjdHJvbi1zYW5kYm94L3N0YXJ0dXBQcm9maWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWU7UUFFM0IsWUFDa0MsY0FBOEIsRUFDVixtQkFBdUQsRUFDeEUseUJBQTRDLEVBQzVDLGlCQUFvQyxFQUNyRCxnQkFBbUMsRUFDbkMsZ0JBQW1DLEVBQ3JCLGNBQThCLEVBQzFCLGtCQUFzQyxFQUN6QyxlQUFnQyxFQUNuQyxZQUEwQixFQUN6QixhQUE0QjtZQVYzQixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDVix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQW9DO1lBQ3hFLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBbUI7WUFDNUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUd2QyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDMUIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUN6QyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDbkMsaUJBQVksR0FBWixZQUFZLENBQWM7WUFDekIsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFFNUQsa0NBQWtDO1lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUM7Z0JBQ1gsZ0JBQWdCLENBQUMsSUFBSSxtQ0FBMkI7Z0JBQ2hELGdCQUFnQixDQUFDLGlDQUFpQyxFQUFFO2FBQ3BELENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNaLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxjQUFjO1lBRXJC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