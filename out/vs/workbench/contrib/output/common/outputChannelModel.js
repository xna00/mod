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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/resources", "vs/editor/common/services/editorWorker", "vs/base/common/event", "vs/base/common/async", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/workbench/services/output/common/output", "vs/base/common/errors"], function (require, exports, instantiation_1, resources, editorWorker_1, event_1, async_1, files_1, model_1, lifecycle_1, types_1, editOperation_1, position_1, range_1, buffer_1, log_1, cancellation_1, output_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DelegatedOutputChannelModel = exports.FileOutputChannelModel = void 0;
    class OutputFileListener extends lifecycle_1.Disposable {
        constructor(file, fileService, logService) {
            super();
            this.file = file;
            this.fileService = fileService;
            this.logService = logService;
            this._onDidContentChange = new event_1.Emitter();
            this.onDidContentChange = this._onDidContentChange.event;
            this.watching = false;
            this.syncDelayer = new async_1.ThrottledDelayer(500);
        }
        watch(eTag) {
            if (!this.watching) {
                this.etag = eTag;
                this.poll();
                this.logService.trace('Started polling', this.file.toString());
                this.watching = true;
            }
        }
        poll() {
            const loop = () => this.doWatch().then(() => this.poll());
            this.syncDelayer.trigger(loop).catch(error => {
                if (!(0, errors_1.isCancellationError)(error)) {
                    throw error;
                }
            });
        }
        async doWatch() {
            const stat = await this.fileService.stat(this.file);
            if (stat.etag !== this.etag) {
                this.etag = stat.etag;
                this._onDidContentChange.fire(stat.size);
            }
        }
        unwatch() {
            if (this.watching) {
                this.syncDelayer.cancel();
                this.watching = false;
                this.logService.trace('Stopped polling', this.file.toString());
            }
        }
        dispose() {
            this.unwatch();
            super.dispose();
        }
    }
    let FileOutputChannelModel = class FileOutputChannelModel extends lifecycle_1.Disposable {
        constructor(modelUri, language, file, fileService, modelService, logService, editorWorkerService) {
            super();
            this.modelUri = modelUri;
            this.language = language;
            this.file = file;
            this.fileService = fileService;
            this.modelService = modelService;
            this.editorWorkerService = editorWorkerService;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this.etag = '';
            this.loadModelPromise = null;
            this.model = null;
            this.modelUpdateInProgress = false;
            this.modelUpdateCancellationSource = this._register(new lifecycle_1.MutableDisposable());
            this.appendThrottler = this._register(new async_1.ThrottledDelayer(300));
            this.startOffset = 0;
            this.endOffset = 0;
            this.fileHandler = this._register(new OutputFileListener(this.file, this.fileService, logService));
            this._register(this.fileHandler.onDidContentChange(size => this.onDidContentChange(size)));
            this._register((0, lifecycle_1.toDisposable)(() => this.fileHandler.unwatch()));
        }
        append(message) {
            throw new Error('Not supported');
        }
        replace(message) {
            throw new Error('Not supported');
        }
        clear() {
            this.update(output_1.OutputChannelUpdateMode.Clear, this.endOffset, true);
        }
        update(mode, till, immediate) {
            const loadModelPromise = this.loadModelPromise ? this.loadModelPromise : Promise.resolve();
            loadModelPromise.then(() => this.doUpdate(mode, till, immediate));
        }
        loadModel() {
            this.loadModelPromise = async_1.Promises.withAsyncBody(async (c, e) => {
                try {
                    let content = '';
                    if (await this.fileService.exists(this.file)) {
                        const fileContent = await this.fileService.readFile(this.file, { position: this.startOffset });
                        this.endOffset = this.startOffset + fileContent.value.byteLength;
                        this.etag = fileContent.etag;
                        content = fileContent.value.toString();
                    }
                    else {
                        this.startOffset = 0;
                        this.endOffset = 0;
                    }
                    c(this.createModel(content));
                }
                catch (error) {
                    e(error);
                }
            });
            return this.loadModelPromise;
        }
        createModel(content) {
            if (this.model) {
                this.model.setValue(content);
            }
            else {
                this.model = this.modelService.createModel(content, this.language, this.modelUri);
                this.fileHandler.watch(this.etag);
                const disposable = this.model.onWillDispose(() => {
                    this.cancelModelUpdate();
                    this.fileHandler.unwatch();
                    this.model = null;
                    (0, lifecycle_1.dispose)(disposable);
                });
            }
            return this.model;
        }
        doUpdate(mode, till, immediate) {
            if (mode === output_1.OutputChannelUpdateMode.Clear || mode === output_1.OutputChannelUpdateMode.Replace) {
                this.startOffset = this.endOffset = (0, types_1.isNumber)(till) ? till : this.endOffset;
                this.cancelModelUpdate();
            }
            if (!this.model) {
                return;
            }
            this.modelUpdateInProgress = true;
            if (!this.modelUpdateCancellationSource.value) {
                this.modelUpdateCancellationSource.value = new cancellation_1.CancellationTokenSource();
            }
            const token = this.modelUpdateCancellationSource.value.token;
            if (mode === output_1.OutputChannelUpdateMode.Clear) {
                this.clearContent(this.model);
            }
            else if (mode === output_1.OutputChannelUpdateMode.Replace) {
                this.replacePromise = this.replaceContent(this.model, token).finally(() => this.replacePromise = undefined);
            }
            else {
                this.appendContent(this.model, immediate, token);
            }
        }
        clearContent(model) {
            this.doUpdateModel(model, [editOperation_1.EditOperation.delete(model.getFullModelRange())], buffer_1.VSBuffer.fromString(''));
        }
        appendContent(model, immediate, token) {
            this.appendThrottler.trigger(async () => {
                /* Abort if operation is cancelled */
                if (token.isCancellationRequested) {
                    return;
                }
                /* Wait for replace to finish */
                if (this.replacePromise) {
                    try {
                        await this.replacePromise;
                    }
                    catch (e) { /* Ignore */ }
                    /* Abort if operation is cancelled */
                    if (token.isCancellationRequested) {
                        return;
                    }
                }
                /* Get content to append */
                const contentToAppend = await this.getContentToUpdate();
                /* Abort if operation is cancelled */
                if (token.isCancellationRequested) {
                    return;
                }
                /* Appned Content */
                const lastLine = model.getLineCount();
                const lastLineMaxColumn = model.getLineMaxColumn(lastLine);
                const edits = [editOperation_1.EditOperation.insert(new position_1.Position(lastLine, lastLineMaxColumn), contentToAppend.toString())];
                this.doUpdateModel(model, edits, contentToAppend);
            }, immediate ? 0 : undefined).catch(error => {
                if (!(0, errors_1.isCancellationError)(error)) {
                    throw error;
                }
            });
        }
        async replaceContent(model, token) {
            /* Get content to replace */
            const contentToReplace = await this.getContentToUpdate();
            /* Abort if operation is cancelled */
            if (token.isCancellationRequested) {
                return;
            }
            /* Compute Edits */
            const edits = await this.getReplaceEdits(model, contentToReplace.toString());
            /* Abort if operation is cancelled */
            if (token.isCancellationRequested) {
                return;
            }
            /* Apply Edits */
            this.doUpdateModel(model, edits, contentToReplace);
        }
        async getReplaceEdits(model, contentToReplace) {
            if (!contentToReplace) {
                return [editOperation_1.EditOperation.delete(model.getFullModelRange())];
            }
            if (contentToReplace !== model.getValue()) {
                const edits = await this.editorWorkerService.computeMoreMinimalEdits(model.uri, [{ text: contentToReplace.toString(), range: model.getFullModelRange() }]);
                if (edits?.length) {
                    return edits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text));
                }
            }
            return [];
        }
        doUpdateModel(model, edits, content) {
            if (edits.length) {
                model.applyEdits(edits);
            }
            this.endOffset = this.endOffset + content.byteLength;
            this.modelUpdateInProgress = false;
        }
        cancelModelUpdate() {
            this.modelUpdateCancellationSource.value?.cancel();
            this.modelUpdateCancellationSource.value = undefined;
            this.appendThrottler.cancel();
            this.replacePromise = undefined;
            this.modelUpdateInProgress = false;
        }
        async getContentToUpdate() {
            const content = await this.fileService.readFile(this.file, { position: this.endOffset });
            this.etag = content.etag;
            return content.value;
        }
        onDidContentChange(size) {
            if (this.model) {
                if (!this.modelUpdateInProgress) {
                    if ((0, types_1.isNumber)(size) && this.endOffset > size) {
                        // Reset - Content is removed
                        this.update(output_1.OutputChannelUpdateMode.Clear, 0, true);
                    }
                }
                this.update(output_1.OutputChannelUpdateMode.Append, undefined, false /* Not needed to update immediately. Wait to collect more changes and update. */);
            }
        }
        isVisible() {
            return !!this.model;
        }
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    };
    exports.FileOutputChannelModel = FileOutputChannelModel;
    exports.FileOutputChannelModel = FileOutputChannelModel = __decorate([
        __param(3, files_1.IFileService),
        __param(4, model_1.IModelService),
        __param(5, log_1.ILogService),
        __param(6, editorWorker_1.IEditorWorkerService)
    ], FileOutputChannelModel);
    let OutputChannelBackedByFile = class OutputChannelBackedByFile extends FileOutputChannelModel {
        constructor(id, modelUri, language, file, fileService, modelService, loggerService, logService, editorWorkerService) {
            super(modelUri, language, file, fileService, modelService, logService, editorWorkerService);
            // Donot rotate to check for the file reset
            this.logger = loggerService.createLogger(file, { logLevel: 'always', donotRotate: true, donotUseFormatters: true, hidden: true });
            this._offset = 0;
        }
        append(message) {
            this.write(message);
            this.update(output_1.OutputChannelUpdateMode.Append, undefined, this.isVisible());
        }
        replace(message) {
            const till = this._offset;
            this.write(message);
            this.update(output_1.OutputChannelUpdateMode.Replace, till, true);
        }
        write(content) {
            this._offset += buffer_1.VSBuffer.fromString(content).byteLength;
            this.logger.info(content);
            if (this.isVisible()) {
                this.logger.flush();
            }
        }
    };
    OutputChannelBackedByFile = __decorate([
        __param(4, files_1.IFileService),
        __param(5, model_1.IModelService),
        __param(6, log_1.ILoggerService),
        __param(7, log_1.ILogService),
        __param(8, editorWorker_1.IEditorWorkerService)
    ], OutputChannelBackedByFile);
    let DelegatedOutputChannelModel = class DelegatedOutputChannelModel extends lifecycle_1.Disposable {
        constructor(id, modelUri, language, outputDir, instantiationService, fileService) {
            super();
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this.outputChannelModel = this.createOutputChannelModel(id, modelUri, language, outputDir);
        }
        async createOutputChannelModel(id, modelUri, language, outputDirPromise) {
            const outputDir = await outputDirPromise;
            const file = resources.joinPath(outputDir, `${id.replace(/[\\/:\*\?"<>\|]/g, '')}.log`);
            await this.fileService.createFile(file);
            const outputChannelModel = this._register(this.instantiationService.createInstance(OutputChannelBackedByFile, id, modelUri, language, file));
            this._register(outputChannelModel.onDispose(() => this._onDispose.fire()));
            return outputChannelModel;
        }
        append(output) {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.append(output));
        }
        update(mode, till, immediate) {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.update(mode, till, immediate));
        }
        loadModel() {
            return this.outputChannelModel.then(outputChannelModel => outputChannelModel.loadModel());
        }
        clear() {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.clear());
        }
        replace(value) {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.replace(value));
        }
    };
    exports.DelegatedOutputChannelModel = DelegatedOutputChannelModel;
    exports.DelegatedOutputChannelModel = DelegatedOutputChannelModel = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, files_1.IFileService)
    ], DelegatedOutputChannelModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0Q2hhbm5lbE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9vdXRwdXQvY29tbW9uL291dHB1dENoYW5uZWxNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQ2hHLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVU7UUFTMUMsWUFDa0IsSUFBUyxFQUNULFdBQXlCLEVBQ3pCLFVBQXVCO1lBRXhDLEtBQUssRUFBRSxDQUFDO1lBSlMsU0FBSSxHQUFKLElBQUksQ0FBSztZQUNULGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3pCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFWeEIsd0JBQW1CLEdBQUcsSUFBSSxlQUFPLEVBQXNCLENBQUM7WUFDaEUsdUJBQWtCLEdBQThCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFFaEYsYUFBUSxHQUFZLEtBQUssQ0FBQztZQVVqQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksd0JBQWdCLENBQU8sR0FBRyxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUF3QjtZQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDakIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDL0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDdEIsQ0FBQztRQUNGLENBQUM7UUFFTyxJQUFJO1lBQ1gsTUFBTSxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMxRCxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxJQUFBLDRCQUFtQixFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLE1BQU0sS0FBSyxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxLQUFLLENBQUMsT0FBTztZQUNwQixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRCxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFDLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNuQixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLENBQUM7UUFDRixDQUFDO1FBRVEsT0FBTztZQUNmLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBQ0Q7SUFFTSxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLHNCQUFVO1FBa0JyRCxZQUNrQixRQUFhLEVBQ2IsUUFBNEIsRUFDNUIsSUFBUyxFQUNaLFdBQTBDLEVBQ3pDLFlBQTRDLEVBQzlDLFVBQXVCLEVBQ2QsbUJBQTBEO1lBRWhGLEtBQUssRUFBRSxDQUFDO1lBUlMsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUNiLGFBQVEsR0FBUixRQUFRLENBQW9CO1lBQzVCLFNBQUksR0FBSixJQUFJLENBQUs7WUFDSyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN4QixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUVwQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBdkJoRSxlQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDekQsY0FBUyxHQUFnQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUdoRCxTQUFJLEdBQXVCLEVBQUUsQ0FBQztZQUU5QixxQkFBZ0IsR0FBK0IsSUFBSSxDQUFDO1lBQ3BELFVBQUssR0FBc0IsSUFBSSxDQUFDO1lBQ2hDLDBCQUFxQixHQUFZLEtBQUssQ0FBQztZQUM5QixrQ0FBNkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQTJCLENBQUMsQ0FBQztZQUNqRyxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBR3JFLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1lBQ3hCLGNBQVMsR0FBVyxDQUFDLENBQUM7WUFhN0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDbkcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsTUFBTSxDQUFDLE9BQWU7WUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsT0FBTyxDQUFDLE9BQWU7WUFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksQ0FBQyxNQUFNLENBQUMsZ0NBQXVCLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUE2QixFQUFFLElBQXdCLEVBQUUsU0FBa0I7WUFDakYsTUFBTSxnQkFBZ0IsR0FBaUIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN6RyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELFNBQVM7WUFDUixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQVEsQ0FBQyxhQUFhLENBQWEsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDekUsSUFBSSxDQUFDO29CQUNKLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDakIsSUFBSSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO3dCQUM5QyxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7d0JBQy9GLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQzt3QkFDakUsSUFBSSxDQUFDLElBQUksR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDO3dCQUM3QixPQUFPLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDeEMsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO3dCQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztvQkFDcEIsQ0FBQztvQkFDRCxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDVixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixDQUFDO1FBRU8sV0FBVyxDQUFDLE9BQWU7WUFDbEMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbEYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUU7b0JBQ2hELElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztvQkFDbEIsSUFBQSxtQkFBTyxFQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNyQixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVPLFFBQVEsQ0FBQyxJQUE2QixFQUFFLElBQXdCLEVBQUUsU0FBa0I7WUFDM0YsSUFBSSxJQUFJLEtBQUssZ0NBQXVCLENBQUMsS0FBSyxJQUFJLElBQUksS0FBSyxnQ0FBdUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDeEYsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUEsZ0JBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUMzRSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUMxQixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDakIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQy9DLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLEdBQUcsSUFBSSxzQ0FBdUIsRUFBRSxDQUFDO1lBQzFFLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUU3RCxJQUFJLElBQUksS0FBSyxnQ0FBdUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0IsQ0FBQztpQkFFSSxJQUFJLElBQUksS0FBSyxnQ0FBdUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDLENBQUM7WUFDN0csQ0FBQztpQkFFSSxDQUFDO2dCQUNMLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsQ0FBQztRQUNGLENBQUM7UUFFTyxZQUFZLENBQUMsS0FBaUI7WUFDckMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2RyxDQUFDO1FBRU8sYUFBYSxDQUFDLEtBQWlCLEVBQUUsU0FBa0IsRUFBRSxLQUF3QjtZQUNwRixJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDdkMscUNBQXFDO2dCQUNyQyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUNuQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsZ0NBQWdDO2dCQUNoQyxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDekIsSUFBSSxDQUFDO3dCQUFDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQztvQkFBQyxDQUFDO29CQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDN0QscUNBQXFDO29CQUNyQyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO3dCQUNuQyxPQUFPO29CQUNSLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCwyQkFBMkI7Z0JBQzNCLE1BQU0sZUFBZSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3hELHFDQUFxQztnQkFDckMsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQkFDbkMsT0FBTztnQkFDUixDQUFDO2dCQUVELG9CQUFvQjtnQkFDcEIsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN0QyxNQUFNLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxLQUFLLEdBQUcsQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLG1CQUFRLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLEVBQUUsZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDNUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQ25ELENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMzQyxJQUFJLENBQUMsSUFBQSw0QkFBbUIsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNqQyxNQUFNLEtBQUssQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFpQixFQUFFLEtBQXdCO1lBQ3ZFLDRCQUE0QjtZQUM1QixNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDekQscUNBQXFDO1lBQ3JDLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQ25DLE9BQU87WUFDUixDQUFDO1lBRUQsbUJBQW1CO1lBQ25CLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM3RSxxQ0FBcUM7WUFDckMsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDbkMsT0FBTztZQUNSLENBQUM7WUFFRCxpQkFBaUI7WUFDakIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVPLEtBQUssQ0FBQyxlQUFlLENBQUMsS0FBaUIsRUFBRSxnQkFBd0I7WUFDeEUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3ZCLE9BQU8sQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUQsQ0FBQztZQUNELElBQUksZ0JBQWdCLEtBQUssS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQzNDLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNKLElBQUksS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDO29CQUNuQixPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyw2QkFBYSxDQUFDLE9BQU8sQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDcEYsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFTyxhQUFhLENBQUMsS0FBaUIsRUFBRSxLQUE2QixFQUFFLE9BQWlCO1lBQ3hGLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLENBQUM7WUFDRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztZQUNyRCxJQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1FBQ3BDLENBQUM7UUFFUyxpQkFBaUI7WUFDMUIsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUNuRCxJQUFJLENBQUMsNkJBQTZCLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztZQUNyRCxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7UUFDcEMsQ0FBQztRQUVPLEtBQUssQ0FBQyxrQkFBa0I7WUFDL0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ3pGLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUN6QixPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDdEIsQ0FBQztRQUVPLGtCQUFrQixDQUFDLElBQXdCO1lBQ2xELElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQ2pDLElBQUksSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxFQUFFLENBQUM7d0JBQzdDLDZCQUE2Qjt3QkFDN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQ0FBdUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNyRCxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQ0FBdUIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxnRkFBZ0YsQ0FBQyxDQUFDO1lBQ2hKLENBQUM7UUFDRixDQUFDO1FBRVMsU0FBUztZQUNsQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3JCLENBQUM7UUFFUSxPQUFPO1lBQ2YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN2QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztLQUNELENBQUE7SUFyT1ksd0RBQXNCO3FDQUF0QixzQkFBc0I7UUFzQmhDLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsbUNBQW9CLENBQUE7T0F6QlYsc0JBQXNCLENBcU9sQztJQUVELElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQXNCO1FBSzdELFlBQ0MsRUFBVSxFQUNWLFFBQWEsRUFDYixRQUE0QixFQUM1QixJQUFTLEVBQ0ssV0FBeUIsRUFDeEIsWUFBMkIsRUFDMUIsYUFBNkIsRUFDaEMsVUFBdUIsRUFDZCxtQkFBeUM7WUFFL0QsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFNUYsMkNBQTJDO1lBQzNDLElBQUksQ0FBQyxNQUFNLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2xJLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7UUFFUSxNQUFNLENBQUMsT0FBZTtZQUM5QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsZ0NBQXVCLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBRVEsT0FBTyxDQUFDLE9BQWU7WUFDL0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUMxQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsZ0NBQXVCLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRU8sS0FBSyxDQUFDLE9BQWU7WUFDNUIsSUFBSSxDQUFDLE9BQU8sSUFBSSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLENBQUM7WUFDeEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDMUIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNyQixDQUFDO1FBQ0YsQ0FBQztLQUVELENBQUE7SUExQ0sseUJBQXlCO1FBVTVCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsb0JBQWMsQ0FBQTtRQUNkLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsbUNBQW9CLENBQUE7T0FkakIseUJBQXlCLENBMEM5QjtJQUVNLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFPMUQsWUFDQyxFQUFVLEVBQ1YsUUFBYSxFQUNiLFFBQTRCLEVBQzVCLFNBQXVCLEVBQ0Esb0JBQTRELEVBQ3JFLFdBQTBDO1lBRXhELEtBQUssRUFBRSxDQUFDO1lBSGdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDcEQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFYeEMsZUFBVSxHQUFrQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN4RSxjQUFTLEdBQWdCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBYXZELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDNUYsQ0FBQztRQUVPLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxFQUFVLEVBQUUsUUFBYSxFQUFFLFFBQTRCLEVBQUUsZ0JBQThCO1lBQzdILE1BQU0sU0FBUyxHQUFHLE1BQU0sZ0JBQWdCLENBQUM7WUFDekMsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4RixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHlCQUF5QixFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDN0ksSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0UsT0FBTyxrQkFBa0IsQ0FBQztRQUMzQixDQUFDO1FBRUQsTUFBTSxDQUFDLE1BQWM7WUFDcEIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDdkYsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUE2QixFQUFFLElBQXdCLEVBQUUsU0FBa0I7WUFDakYsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRUQsU0FBUztZQUNSLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUMzRixDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVELE9BQU8sQ0FBQyxLQUFhO1lBQ3BCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3ZGLENBQUM7S0FDRCxDQUFBO0lBL0NZLGtFQUEyQjswQ0FBM0IsMkJBQTJCO1FBWXJDLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxvQkFBWSxDQUFBO09BYkYsMkJBQTJCLENBK0N2QyJ9