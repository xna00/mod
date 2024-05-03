/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/workbench/services/aiRelatedInformation/common/aiRelatedInformationService", "vs/platform/log/common/log", "vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation", "vs/base/common/cancellation", "vs/base/test/common/utils"], function (require, exports, assert, sinon, aiRelatedInformationService_1, log_1, aiRelatedInformation_1, cancellation_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('AiRelatedInformationService', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let service;
        setup(() => {
            service = new aiRelatedInformationService_1.AiRelatedInformationService(store.add(new log_1.NullLogService()));
        });
        test('should check if providers are registered', () => {
            assert.equal(service.isEnabled(), false);
            store.add(service.registerAiRelatedInformationProvider(aiRelatedInformation_1.RelatedInformationType.CommandInformation, { provideAiRelatedInformation: () => Promise.resolve([]) }));
            assert.equal(service.isEnabled(), true);
        });
        test('should register and unregister providers', () => {
            const provider = { provideAiRelatedInformation: () => Promise.resolve([]) };
            const disposable = service.registerAiRelatedInformationProvider(aiRelatedInformation_1.RelatedInformationType.CommandInformation, provider);
            assert.strictEqual(service.isEnabled(), true);
            disposable.dispose();
            assert.strictEqual(service.isEnabled(), false);
        });
        test('should get related information', async () => {
            const command = 'command';
            const provider = {
                provideAiRelatedInformation: () => Promise.resolve([{ type: aiRelatedInformation_1.RelatedInformationType.CommandInformation, command, weight: 1 }])
            };
            service.registerAiRelatedInformationProvider(aiRelatedInformation_1.RelatedInformationType.CommandInformation, provider);
            const result = await service.getRelatedInformation('query', [aiRelatedInformation_1.RelatedInformationType.CommandInformation], cancellation_1.CancellationToken.None);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].command, command);
        });
        test('should get different types of related information', async () => {
            const command = 'command';
            const commandProvider = {
                provideAiRelatedInformation: () => Promise.resolve([{ type: aiRelatedInformation_1.RelatedInformationType.CommandInformation, command, weight: 1 }])
            };
            service.registerAiRelatedInformationProvider(aiRelatedInformation_1.RelatedInformationType.CommandInformation, commandProvider);
            const setting = 'setting';
            const settingProvider = {
                provideAiRelatedInformation: () => Promise.resolve([{ type: aiRelatedInformation_1.RelatedInformationType.SettingInformation, setting, weight: 1 }])
            };
            service.registerAiRelatedInformationProvider(aiRelatedInformation_1.RelatedInformationType.SettingInformation, settingProvider);
            const result = await service.getRelatedInformation('query', [
                aiRelatedInformation_1.RelatedInformationType.CommandInformation,
                aiRelatedInformation_1.RelatedInformationType.SettingInformation
            ], cancellation_1.CancellationToken.None);
            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].command, command);
            assert.strictEqual(result[1].setting, setting);
        });
        test('should return empty array on timeout', async () => {
            const clock = sinon.useFakeTimers({
                shouldAdvanceTime: true,
            });
            const provider = {
                provideAiRelatedInformation: () => new Promise((resolve) => {
                    setTimeout(() => {
                        resolve([{ type: aiRelatedInformation_1.RelatedInformationType.CommandInformation, command: 'command', weight: 1 }]);
                    }, aiRelatedInformationService_1.AiRelatedInformationService.DEFAULT_TIMEOUT + 100);
                })
            };
            service.registerAiRelatedInformationProvider(aiRelatedInformation_1.RelatedInformationType.CommandInformation, provider);
            try {
                const promise = service.getRelatedInformation('query', [aiRelatedInformation_1.RelatedInformationType.CommandInformation], cancellation_1.CancellationToken.None);
                clock.tick(aiRelatedInformationService_1.AiRelatedInformationService.DEFAULT_TIMEOUT + 200);
                const result = await promise;
                assert.strictEqual(result.length, 0);
            }
            finally {
                clock.restore();
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWlSZWxhdGVkSW5mb3JtYXRpb25TZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9haVJlbGF0ZWRJbmZvcm1hdGlvbi90ZXN0L2NvbW1vbi9haVJlbGF0ZWRJbmZvcm1hdGlvblNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyxLQUFLLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1FBQ3pDLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUN4RCxJQUFJLE9BQW9DLENBQUM7UUFFekMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLE9BQU8sR0FBRyxJQUFJLHlEQUEyQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxvQkFBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtZQUNyRCxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6QyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxvQ0FBb0MsQ0FBQyw2Q0FBc0IsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLDJCQUEyQixFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0osTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMENBQTBDLEVBQUUsR0FBRyxFQUFFO1lBQ3JELE1BQU0s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