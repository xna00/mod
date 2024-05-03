define(["require", "exports", "assert", "vs/workbench/services/telemetry/browser/workbenchCommonProperties", "vs/platform/storage/common/storage", "vs/base/test/common/utils"], function (require, exports, assert, workbenchCommonProperties_1, storage_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Browser Telemetry - common properties', function () {
        const commit = (undefined);
        const version = (undefined);
        let testStorageService;
        teardown(() => {
            testStorageService.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            testStorageService = new storage_1.InMemoryStorageService();
        });
        test('mixes in additional properties', async function () {
            const resolveCommonTelemetryProperties = () => {
                return {
                    'userId': '1'
                };
            };
            const props = (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(testStorageService, commit, version, false, undefined, undefined, false, resolveCommonTelemetryProperties);
            assert.ok('commitHash' in props);
            assert.ok('sessionID' in props);
            assert.ok('timestamp' in props);
            assert.ok('common.platform' in props);
            assert.ok('common.timesincesessionstart' in props);
            assert.ok('common.sequence' in props);
            assert.ok('version' in props);
            assert.ok('common.firstSessionDate' in props, 'firstSessionDate');
            assert.ok('common.lastSessionDate' in props, 'lastSessionDate');
            assert.ok('common.isNewSession' in props, 'isNewSession');
            assert.ok('common.machineId' in props, 'machineId');
            assert.strictEqual(props['userId'], '1');
        });
        test('mixes in additional dyanmic properties', async function () {
            let i = 1;
            const resolveCommonTelemetryProperties = () => {
                return Object.defineProperties({}, {
                    'userId': {
                        get: () => {
                            return i++;
                        },
                        enumerable: true
                    }
                });
            };
            const props = (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(testStorageService, commit, version, false, undefined, undefined, false, resolveCommonTelemetryProperties);
            assert.strictEqual(props['userId'], 1);
            const props2 = (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(testStorageService, commit, version, false, undefined, undefined, false, resolveCommonTelemetryProperties);
            assert.strictEqual(props2['userId'], 2);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uUHJvcGVydGllcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGVsZW1ldHJ5L3Rlc3QvYnJvd3Nlci9jb21tb25Qcm9wZXJ0aWVzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBU0EsS0FBSyxDQUFDLHVDQUF1QyxFQUFFO1FBRTlDLE1BQU0sTUFBTSxHQUFXLENBQUMsU0FBUyxDQUFFLENBQUM7UUFDcEMsTUFBTSxPQUFPLEdBQVcsQ0FBQyxTQUFTLENBQUUsQ0FBQztRQUNyQyxJQUFJLGtCQUEwQyxDQUFDO1FBRS9DLFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1Ysa0JBQWtCLEdBQUcsSUFBSSxnQ0FBc0IsRUFBRSxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEtBQUs7WUFDM0MsTUFBTSxnQ0FBZ0MsR0FBRyxHQUFHLEVBQUU7Z0JBQzdDLE9BQU87b0JBQ04sUUFBUSxFQUFFLEdBQUc7aUJBQ2IsQ0FBQztZQUNILENBQUMsQ0FBQztZQUVGLE1BQU0sS0FBSyxHQUFHLElBQUEsNERBQWdDLEVBQUMsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztZQUUxSixNQUFNLENBQUMsRUFBRSxDQUFDLFlBQVksSUFBSSxLQUFLLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsRUFBRSxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsRUFBRSxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsRUFBRSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxFQUFFLENBQUMsOEJBQThCLElBQUksS0FBSyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsRUFBRSxDQUFDLHlCQUF5QixJQUFJLEtBQUssRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxFQUFFLENBQUMsd0JBQXdCLElBQUksS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDaEUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsSUFBSSxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsSUFBSSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0NBQXdDLEVBQUUsS0FBSztZQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDVixNQUFNLGdDQUFnQyxHQUFHLEdBQUcsRUFBRTtnQkFDN0MsT0FBTyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFO29CQUNsQyxRQUFRLEVBQUU7d0JBQ1QsR0FBRyxFQUFFLEdBQUcsRUFBRTs0QkFDVCxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUNaLENBQUM7d0JBQ0QsVUFBVSxFQUFFLElBQUk7cUJBQ2hCO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQztZQUVGLE1BQU0sS0FBSyxHQUFHLElBQUEsNERBQWdDLEVBQUMsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztZQUMxSixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV2QyxNQUFNLE1BQU0sR0FBRyxJQUFBLDREQUFnQyxFQUFDLGtCQUFrQixFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7WUFDM0osTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9