/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/log/common/logService", "vs/platform/terminal/common/requestStore"], function (require, exports, assert_1, utils_1, instantiationServiceMock_1, log_1, logService_1, requestStore_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RequestStore', () => {
        let instantiationService;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(log_1.ILogService, new logService_1.LogService(new log_1.ConsoleLogger()));
        });
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('should resolve requests', async () => {
            const requestStore = store.add(instantiationService.createInstance((requestStore_1.RequestStore), undefined));
            let eventArgs;
            store.add(requestStore.onCreateRequest(e => eventArgs = e));
            const request = requestStore.createRequest({ arg: 'foo' });
            (0, assert_1.strictEqual)(typeof eventArgs?.requestId, 'number');
            (0, assert_1.strictEqual)(eventArgs?.arg, 'foo');
            requestStore.acceptReply(eventArgs.requestId, { data: 'bar' });
            const result = await request;
            (0, assert_1.strictEqual)(result.data, 'bar');
        });
        test('should reject the promise when the request times out', async () => {
            const requestStore = store.add(instantiationService.createInstance((requestStore_1.RequestStore), 1));
            const request = requestStore.createRequest({ arg: 'foo' });
            let threw = false;
            try {
                await request;
            }
            catch (e) {
                threw = true;
            }
            if (!threw) {
                (0, assert_1.fail)();
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdFN0b3JlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL3Rlc3QvY29tbW9uL3JlcXVlc3RTdG9yZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1FBQzFCLElBQUksb0JBQThDLENBQUM7UUFFbkQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLG9CQUFvQixHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUN0RCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUJBQVcsRUFBRSxJQUFJLHVCQUFVLENBQUMsSUFBSSxtQkFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdFLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELElBQUksQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMxQyxNQUFNLFlBQVksR0FBb0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQSwyQkFBK0MsQ0FBQSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDakwsSUFBSSxTQUF5RCxDQUFDO1lBQzlELEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVELE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxhQUFhLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUMzRCxJQUFBLG9CQUFXLEVBQUMsT0FBTyxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ25ELElBQUEsb0JBQVcsRUFBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ25DLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDO1lBQzdCLElBQUEsb0JBQVcsRUFBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNEQUFzRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3ZFLE1BQU0sWUFBWSxHQUFvRCxLQUFLLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxDQUFBLDJCQUErQyxDQUFBLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6SyxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDM0QsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ2xCLElBQUksQ0FBQztnQkFDSixNQUFNLE9BQU8sQ0FBQztZQUNmLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDZCxDQUFDO1lBQ0QsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLElBQUEsYUFBSSxHQUFFLENBQUM7WUFDUixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9