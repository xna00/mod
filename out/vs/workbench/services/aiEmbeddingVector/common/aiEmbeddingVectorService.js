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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/async", "vs/platform/instantiation/common/extensions", "vs/base/common/stopwatch", "vs/platform/log/common/log"], function (require, exports, instantiation_1, async_1, extensions_1, stopwatch_1, log_1) {
    "use strict";
    var AiEmbeddingVectorService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AiEmbeddingVectorService = exports.IAiEmbeddingVectorService = void 0;
    exports.IAiEmbeddingVectorService = (0, instantiation_1.createDecorator)('IAiEmbeddingVectorService');
    let AiEmbeddingVectorService = class AiEmbeddingVectorService {
        static { AiEmbeddingVectorService_1 = this; }
        static { this.DEFAULT_TIMEOUT = 1000 * 10; } // 10 seconds
        constructor(logService) {
            this.logService = logService;
            this._providers = [];
        }
        isEnabled() {
            return this._providers.length > 0;
        }
        registerAiEmbeddingVectorProvider(model, provider) {
            this._providers.push(provider);
            return {
                dispose: () => {
                    const index = this._providers.indexOf(provider);
                    if (index >= 0) {
                        this._providers.splice(index, 1);
                    }
                }
            };
        }
        async getEmbeddingVector(strings, token) {
            if (this._providers.length === 0) {
                throw new Error('No embedding vector providers registered');
            }
            const stopwatch = stopwatch_1.StopWatch.create();
            const cancellablePromises = [];
            const timer = (0, async_1.timeout)(AiEmbeddingVectorService_1.DEFAULT_TIMEOUT);
            const disposable = token.onCancellationRequested(() => {
                disposable.dispose();
                timer.cancel();
            });
            for (const provider of this._providers) {
                cancellablePromises.push((0, async_1.createCancelablePromise)(async (t) => {
                    try {
                        return await provider.provideAiEmbeddingVector(Array.isArray(strings) ? strings : [strings], t);
                    }
                    catch (e) {
                        // logged in extension host
                    }
                    // Wait for the timer to finish to allow for another provider to resolve.
                    // Alternatively, if something resolved, or we've timed out, this will throw
                    // as expected.
                    await timer;
                    throw new Error('Embedding vector provider timed out');
                }));
            }
            cancellablePromises.push((0, async_1.createCancelablePromise)(async (t) => {
                const disposable = t.onCancellationRequested(() => {
                    timer.cancel();
                    disposable.dispose();
                });
                await timer;
                throw new Error('Embedding vector provider timed out');
            }));
            try {
                const result = await (0, async_1.raceCancellablePromises)(cancellablePromises);
                // If we have a single result, return it directly, otherwise return an array.
                // This aligns with the API overloads.
                if (result.length === 1) {
                    return result[0];
                }
                return result;
            }
            finally {
                stopwatch.stop();
                this.logService.trace(`[AiEmbeddingVectorService]: getEmbeddingVector took ${stopwatch.elapsed()}ms`);
            }
        }
    };
    exports.AiEmbeddingVectorService = AiEmbeddingVectorService;
    exports.AiEmbeddingVectorService = AiEmbeddingVectorService = AiEmbeddingVectorService_1 = __decorate([
        __param(0, log_1.ILogService)
    ], AiEmbeddingVectorService);
    (0, extensions_1.registerSingleton)(exports.IAiEmbeddingVectorService, AiEmbeddingVectorService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWlFbWJlZGRpbmdWZWN0b3JTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYWlFbWJlZGRpbmdWZWN0b3IvY29tbW9uL2FpRW1iZWRkaW5nVmVjdG9yU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBVW5GLFFBQUEseUJBQXlCLEdBQUcsSUFBQSwrQkFBZSxFQUE0QiwyQkFBMkIsQ0FBQyxDQUFDO0lBZTFHLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXdCOztpQkFHcEIsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBRSxBQUFaLENBQWEsR0FBQyxhQUFhO1FBSTFELFlBQXlCLFVBQXdDO1lBQXZCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFGaEQsZUFBVSxHQUFpQyxFQUFFLENBQUM7UUFFTSxDQUFDO1FBRXRFLFNBQVM7WUFDUixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsaUNBQWlDLENBQUMsS0FBYSxFQUFFLFFBQW9DO1lBQ3BGLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9CLE9BQU87Z0JBQ04sT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDYixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDaEQsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUM7d0JBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDbEMsQ0FBQztnQkFDRixDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFJRCxLQUFL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