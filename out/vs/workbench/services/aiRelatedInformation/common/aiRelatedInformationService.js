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
define(["require", "exports", "vs/base/common/async", "vs/platform/instantiation/common/extensions", "vs/base/common/stopwatch", "vs/platform/log/common/log", "vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation"], function (require, exports, async_1, extensions_1, stopwatch_1, log_1, aiRelatedInformation_1) {
    "use strict";
    var AiRelatedInformationService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AiRelatedInformationService = void 0;
    let AiRelatedInformationService = class AiRelatedInformationService {
        static { AiRelatedInformationService_1 = this; }
        static { this.DEFAULT_TIMEOUT = 1000 * 10; } // 10 seconds
        constructor(logService) {
            this.logService = logService;
            this._providers = new Map();
        }
        isEnabled() {
            return this._providers.size > 0;
        }
        registerAiRelatedInformationProvider(type, provider) {
            const providers = this._providers.get(type) ?? [];
            providers.push(provider);
            this._providers.set(type, providers);
            return {
                dispose: () => {
                    const providers = this._providers.get(type) ?? [];
                    const index = providers.indexOf(provider);
                    if (index !== -1) {
                        providers.splice(index, 1);
                    }
                    if (providers.length === 0) {
                        this._providers.delete(type);
                    }
                }
            };
        }
        async getRelatedInformation(query, types, token) {
            if (this._providers.size === 0) {
                throw new Error('No related information providers registered');
            }
            // get providers for each type
            const providers = [];
            for (const type of types) {
                const typeProviders = this._providers.get(type);
                if (typeProviders) {
                    providers.push(...typeProviders);
                }
            }
            if (providers.length === 0) {
                throw new Error('No related information providers registered for the given types');
            }
            const stopwatch = stopwatch_1.StopWatch.create();
            const cancellablePromises = providers.map((provider) => {
                return (0, async_1.createCancelablePromise)(async (t) => {
                    try {
                        const result = await provider.provideAiRelatedInformation(query, t);
                        // double filter just in case
                        return result.filter(r => types.includes(r.type));
                    }
                    catch (e) {
                        // logged in extension host
                    }
                    return [];
                });
            });
            try {
                const results = await (0, async_1.raceTimeout)(Promise.allSettled(cancellablePromises), AiRelatedInformationService_1.DEFAULT_TIMEOUT, () => {
                    cancellablePromises.forEach(p => p.cancel());
                    this.logService.warn('[AiRelatedInformationService]: Related information provider timed out');
                });
                if (!results) {
                    return [];
                }
                const result = results
                    .filter(r => r.status === 'fulfilled')
                    .flatMap(r => r.value);
                return result;
            }
            finally {
                stopwatch.stop();
                this.logService.trace(`[AiRelatedInformationService]: getRelatedInformation took ${stopwatch.elapsed()}ms`);
            }
        }
    };
    exports.AiRelatedInformationService = AiRelatedInformationService;
    exports.AiRelatedInformationService = AiRelatedInformationService = AiRelatedInformationService_1 = __decorate([
        __param(0, log_1.ILogService)
    ], AiRelatedInformationService);
    (0, extensions_1.registerSingleton)(aiRelatedInformation_1.IAiRelatedInformationService, AiRelatedInformationService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWlSZWxhdGVkSW5mb3JtYXRpb25TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYWlSZWxhdGVkSW5mb3JtYXRpb24vY29tbW9uL2FpUmVsYXRlZEluZm9ybWF0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTJCOztpQkFHdkIsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBRSxBQUFaLENBQWEsR0FBQyxhQUFhO1FBSTFELFlBQXlCLFVBQXdDO1lBQXZCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFGaEQsZUFBVSxHQUFpRSxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRWpDLENBQUM7UUFFdEUsU0FBUztZQUNSLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxvQ0FBb0MsQ0FBQyxJQUE0QixFQUFFLFFBQXVDO1lBQ3pHLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsRCxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUdyQyxPQUFPO2dCQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNsRCxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FB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