define(["require", "exports", "assert", "vs/workbench/api/common/extHostFileSystemEventService", "vs/platform/log/common/log", "vs/base/test/common/utils"], function (require, exports, assert, extHostFileSystemEventService_1, log_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostFileSystemEventService', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('FileSystemWatcher ignore events properties are reversed #26851', function () {
            const protocol = {
                getProxy: () => { return undefined; },
                set: undefined,
                dispose: undefined,
                assertRegistered: undefined,
                drain: undefined
            };
            const watcher1 = new extHostFileSystemEventService_1.ExtHostFileSystemEventService(protocol, new log_1.NullLogService(), undefined).createFileSystemWatcher(undefined, undefined, '**/somethingInteresting', { correlate: false });
            assert.strictEqual(watcher1.ignoreChangeEvents, false);
            assert.strictEqual(watcher1.ignoreCreateEvents, false);
            assert.strictEqual(watcher1.ignoreDeleteEvents, false);
            watcher1.dispose();
            const watcher2 = new extHostFileSystemEventService_1.ExtHostFileSystemEventService(protocol, new log_1.NullLogService(), undefined).createFileSystemWatcher(undefined, undefined, '**/somethingBoring', { ignoreCreateEvents: true, ignoreChangeEvents: true, ignoreDeleteEvents: true, correlate: false });
            assert.strictEqual(watcher2.ignoreChangeEvents, true);
            assert.strictEqual(watcher2.ignoreCreateEvents, true);
            assert.strictEqual(watcher2.ignoreDeleteEvents, true);
            watcher2.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEZpbGVTeXN0ZW1FdmVudFNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2Jyb3dzZXIvZXh0SG9zdEZpbGVTeXN0ZW1FdmVudFNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFVQSxLQUFLLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO1FBRTNDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsZ0VBQWdFLEVBQUU7WUFFdEUsTUFBTSxRQUFRLEdBQWlCO2dCQUM5QixRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsT0FBTyxTQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxHQUFHLEVBQUUsU0FBVTtnQkFDZixPQUFPLEVBQUUsU0FBVTtnQkFDbkIsZ0JBQWdCLEVBQUUsU0FBVTtnQkFDNUIsS0FBSyxFQUFFLFNBQVU7YUFDakIsQ0FBQztZQUVGLE1BQU0sUUFBUSxHQUFHLElBQUksNkRBQTZCLENBQUMsUUFBUSxFQUFFLElBQUksb0JBQWMsRUFBRSxFQUFFLFNBQVUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLFNBQVUsRUFBRSxTQUFVLEVBQUUseUJBQXlCLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNoTSxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2RCxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFbkIsTUFBTSxRQUFRLEdBQUcsSUFBSSw2REFBNkIsQ0FBQyxRQUFRLEVBQUUsSUFBSSxvQkFBYyxFQUFFLEVBQUUsU0FBVSxDQUFDLENBQUMsdUJBQXVCLENBQUMsU0FBVSxFQUFFLFNBQVUsRUFBRSxvQkFBb0IsRUFBRSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ3pRLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RELFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNwQixDQUFDLENBQUMsQ0FBQztJQUVKLENBQUMsQ0FBQyxDQUFDIn0=