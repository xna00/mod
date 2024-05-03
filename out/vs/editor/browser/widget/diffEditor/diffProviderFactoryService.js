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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/stopwatch", "vs/editor/common/core/lineRange", "vs/editor/common/diff/rangeMapping", "vs/editor/common/services/editorWorker", "vs/platform/telemetry/common/telemetry"], function (require, exports, extensions_1, instantiation_1, event_1, stopwatch_1, lineRange_1, rangeMapping_1, editorWorker_1, telemetry_1) {
    "use strict";
    var WorkerBasedDocumentDiffProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkerBasedDocumentDiffProvider = exports.WorkerBasedDiffProviderFactoryService = exports.IDiffProviderFactoryService = void 0;
    exports.IDiffProviderFactoryService = (0, instantiation_1.createDecorator)('diffProviderFactoryService');
    let WorkerBasedDiffProviderFactoryService = class WorkerBasedDiffProviderFactoryService {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
        }
        createDiffProvider(options) {
            return this.instantiationService.createInstance(WorkerBasedDocumentDiffProvider, options);
        }
    };
    exports.WorkerBasedDiffProviderFactoryService = WorkerBasedDiffProviderFactoryService;
    exports.WorkerBasedDiffProviderFactoryService = WorkerBasedDiffProviderFactoryService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], WorkerBasedDiffProviderFactoryService);
    (0, extensions_1.registerSingleton)(exports.IDiffProviderFactoryService, WorkerBasedDiffProviderFactoryService, 1 /* InstantiationType.Delayed */);
    let WorkerBasedDocumentDiffProvider = class WorkerBasedDocumentDiffProvider {
        static { WorkerBasedDocumentDiffProvider_1 = this; }
        static { this.diffCache = new Map(); }
        constructor(options, editorWorkerService, telemetryService) {
            this.editorWorkerService = editorWorkerService;
            this.telemetryService = telemetryService;
            this.onDidChangeEventEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEventEmitter.event;
            this.diffAlgorithm = 'advanced';
            this.diffAlgorithmOnDidChangeSubscription = undefined;
            this.setOptions(options);
        }
        dispose() {
            this.diffAlgorithmOnDidChangeSubscription?.dispose();
        }
        async computeDiff(original, modified, options, cancellationToken) {
            if (typeof this.diffAlgorithm !== 'string') {
                return this.diffAlgorithm.computeDiff(original, modified, options, cancellationToken);
            }
            // This significantly speeds up the case when the original file is empty
            if (original.getLineCount() === 1 && original.getLineMaxColumn(1) === 1) {
                if (modified.getLineCount() === 1 && modified.getLineMaxColumn(1) === 1) {
                    return {
                        changes: [],
                        identical: true,
                        quitEarly: false,
                        moves: [],
                    };
                }
                return {
                    changes: [
                        new rangeMapping_1.DetailedLineRangeMapping(new lineRange_1.LineRange(1, 2), new lineRange_1.LineRange(1, modified.getLineCount() + 1), [
                            new rangeMapping_1.RangeMapping(original.getFullModelRange(), modified.getFullModelRange())
                        ])
                    ],
                    identical: false,
                    quitEarly: false,
                    moves: [],
                };
            }
            const uriKey = JSON.stringify([original.uri.toString(), modified.uri.toString()]);
            const context = JSON.stringify([original.id, modified.id, original.getAlternativeVersionId(), modified.getAlternativeVersionId(), JSON.stringify(options)]);
            const c = WorkerBasedDocumentDiffProvider_1.diffCache.get(uriKey);
            if (c && c.context === context) {
                return c.result;
            }
            const sw = stopwatch_1.StopWatch.create();
            const result = await this.editorWorkerService.computeDiff(original.uri, modified.uri, options, this.diffAlgorithm);
            const timeMs = sw.elapsed();
            this.telemetryService.publicLog2('diffEditor.computeDiff', {
                timeMs,
                timedOut: result?.quitEarly ?? true,
                detectedMoves: options.computeMoves ? (result?.moves.length ?? 0) : -1,
            });
            if (cancellationToken.isCancellationRequested) {
                // Text models might be disposed!
                return {
                    changes: [],
                    identical: false,
                    quitEarly: true,
                    moves: [],
                };
            }
            if (!result) {
                throw new Error('no diff result available');
            }
            // max 10 items in cache
            if (WorkerBasedDocumentDiffProvider_1.diffCache.size > 10) {
                WorkerBasedDocumentDiffProvider_1.diffCache.delete(WorkerBasedDocumentDiffProvider_1.diffCache.keys().next().value);
            }
            WorkerBasedDocumentDiffProvider_1.diffCache.set(uriKey, { result, context });
            return result;
        }
        setOptions(newOptions) {
            let didChange = false;
            if (newOptions.diffAlgorithm) {
                if (this.diffAlgorithm !== newOptions.diffAlgorithm) {
                    this.diffAlgorithmOnDidChangeSubscription?.dispose();
                    this.diffAlgorithmOnDidChangeSubscription = undefined;
                    this.diffAlgorithm = newOptions.diffAlgorithm;
                    if (typeof newOptions.diffAlgorithm !== 'string') {
                        this.diffAlgorithmOnDidChangeSubscription = newOptions.diffAlgorithm.onDidChange(() => this.onDidChangeEventEmitter.fire());
                    }
                    didChange = true;
                }
            }
            if (didChange) {
                this.onDidChangeEventEmitter.fire();
            }
        }
    };
    exports.WorkerBasedDocumentDiffProvider = WorkerBasedDocumentDiffProvider;
    exports.WorkerBasedDocumentDiffProvider = WorkerBasedDocumentDiffProvider = WorkerBasedDocumentDiffProvider_1 = __decorate([
        __param(1, editorWorker_1.IEditorWorkerService),
        __param(2, telemetry_1.ITelemetryService)
    ], WorkerBasedDocumentDiffProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZlByb3ZpZGVyRmFjdG9yeVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2RpZmZQcm92aWRlckZhY3RvcnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFlbkYsUUFBQSwyQkFBMkIsR0FBRyxJQUFBLCtCQUFlLEVBQThCLDRCQUE0QixDQUFDLENBQUM7SUFXL0csSUFBTSxxQ0FBcUMsR0FBM0MsTUFBTSxxQ0FBcUM7UUFHakQsWUFDeUMsb0JBQTJDO1lBQTNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7UUFDaEYsQ0FBQztRQUVMLGtCQUFrQixDQUFDLE9BQW9DO1lBQ3RELE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywrQkFBK0IsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMzRixDQUFDO0tBQ0QsQ0FBQTtJQVZZLHNGQUFxQztvREFBckMscUNBQXFDO1FBSS9DLFdBQUEscUNBQXFCLENBQUE7T0FKWCxxQ0FBcUMsQ0FVakQ7SUFFRCxJQUFBLDhCQUFpQixFQUFDLG1DQUEyQixFQUFFLHFDQUFxQyxvQ0FBNEIsQ0FBQztJQUUxRyxJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUErQjs7aUJBT25CLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBc0QsQUFBaEUsQ0FBaUU7UUFFbEcsWUFDQyxPQUFnRCxFQUMxQixtQkFBMEQsRUFDN0QsZ0JBQW9EO1lBRGhDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDNUMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQVhoRSw0QkFBdUIsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ3RDLGdCQUFXLEdBQWdCLElBQUksQ0FBQyx1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