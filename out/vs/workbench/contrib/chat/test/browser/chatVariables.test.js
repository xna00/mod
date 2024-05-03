/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/test/common/utils", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/workbench/contrib/chat/browser/chatVariables", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatRequestParser", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/test/browser/mockChatWidget", "vs/workbench/contrib/chat/test/common/mockChatService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, cancellation_1, utils_1, instantiationServiceMock_1, log_1, storage_1, chatVariables_1, chatAgents_1, chatRequestParser_1, chatService_1, chatVariables_2, mockChatWidget_1, mockChatService_1, extensions_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ChatVariables', function () {
        let service;
        let instantiationService;
        const testDisposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(function () {
            service = new chatVariables_1.ChatVariablesService(new mockChatWidget_1.MockChatWidgetService());
            instantiationService = testDisposables.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(storage_1.IStorageService, testDisposables.add(new workbenchTestServices_1.TestStorageService()));
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(extensions_1.IExtensionService, new workbenchTestServices_1.TestExtensionService());
            instantiationService.stub(chatVariables_2.IChatVariablesService, service);
            instantiationService.stub(chatService_1.IChatService, new mockChatService_1.MockChatService());
            instantiationService.stub(chatAgents_1.IChatAgentService, instantiationService.createInstance(chatAgents_1.ChatAgentService));
        });
        test('ChatVariables - resolveVariables', async function () {
            const v1 = service.registerVariable({ name: 'foo', description: 'bar' }, async () => ([{ level: 'full', value: 'farboo' }]));
            const v2 = service.registerVariable({ name: 'far', description: 'boo' }, async () => ([{ level: 'full', value: 'farboo' }]));
            const parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const resolveVariables = async (text) => {
                const result = parser.parseChatRequest('1', text);
                return await service.resolveVariables(result, null, () => { }, cancellation_1.CancellationToken.None);
            };
            {
                const data = await resolveVariables('Hello #foo and#far');
                assert.strictEqual(data.variables.length, 1);
                assert.deepEqual(data.variables.map(v => v.name), ['foo']);
            }
            {
                const data = await resolveVariables('#foo Hello');
                assert.strictEqual(data.variables.length, 1);
                assert.deepEqual(data.variables.map(v => v.name), ['foo']);
            }
            {
                const data = await resolveVariables('Hello #foo');
                assert.strictEqual(data.variables.length, 1);
                assert.deepEqual(data.variables.map(v => v.name), ['foo']);
            }
            {
                const data = await resolveVariables('Hello #foo?');
                assert.strictEqual(data.variables.length, 1);
                assert.deepEqual(data.variables.map(v => v.name), ['foo']);
            }
            {
                const data = await resolveVariables('Hello #foo and#far #foo');
                assert.strictEqual(data.variables.length, 2);
                assert.deepEqual(data.variables.map(v => v.name), ['foo', 'foo']);
            }
            {
                const data = await resolveVariables('Hello #foo and #far #foo');
                assert.strictEqual(data.variables.length, 3);
                assert.deepEqual(data.variables.map(v => v.name), ['foo', 'far', 'foo']);
            }
            {
                const data = await resolveVariables('Hello #foo and #far #foo #unknown');
                assert.strictEqual(data.variables.length, 3);
                assert.deepEqual(data.variables.map(v => v.name), ['foo', 'far', 'foo']);
            }
            v1.dispose();
            v2.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFZhcmlhYmxlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L3Rlc3QvYnJvd3Nlci9jaGF0VmFyaWFibGVzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFFdEIsSUFBSSxPQUE2QixDQUFDO1FBQ2xDLElBQUksb0JBQThDLENBQUM7UUFDbkQsTUFBTSxlQUFlLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRWxFLEtBQUssQ0FBQztZQUNMLE9BQU8sR0FBRyxJQUFJLG9DQUFvQixDQUFDLElBQUksc0NBQXFCLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLG9CQUFvQixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxtREFBd0IsRUFBRSxDQUFDLENBQUM7WUFDM0Usb0JBQW9CLENBQUMsSUFBSSxDQUFDLHlCQUFlLEVBQUUsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDBDQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFGLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQkFBVyxFQUFFLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUM7WUFDN0Qsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDhCQUFpQixFQUFFLElBQUksNENBQW9CLEVBQUUsQ0FBQyxDQUFDO1lBQ3pFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQ0FBcUIsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxRCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMEJBQVksRUFBRSxJQUFJLGlDQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELG9CQUFvQixDQUFDLElBQUksQ0FBQyw4QkFBaUIsRUFBRSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkJBQWdCLENBQUMsQ0FBQyxDQUFDO1FBQ3JHLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtDQUFrQyxFQUFFLEtBQUs7WUFFN0MsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3SCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTdILE1BQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxQ0FBaUIsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxFQUFFLElBQVksRUFBRSxFQUFFO2dCQUMvQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNsRCxPQUFPLE1BQU0sT0FBTyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxJQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pGLENBQUMsQ0FBQztZQUVGLENBQUM7Z0JBQ0EsTUFBTSxJQUFJLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBQ0QsQ0FBQztnQkFDQSxNQUFNLElBQUksR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBQ0QsQ0FBQztnQkFDQSxNQUFNLElBQUksR0FBRyxNQUFNLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBQ0QsQ0FBQztnQkFDQSxNQUFNLElBQUksR0FBRyxNQUFNLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBQ0QsQ0FBQztnQkFDQSxNQUFNLElBQUksR0FBRyxNQUFNLGdCQUFnQixDQUFDLHlCQUF5QixDQUFDLENBQUM7Z0JBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBQ0QsQ0FBQztnQkFDQSxNQUFNLElBQUksR0FBRyxNQUFNLGdCQUFnQixDQUFDLDBCQUEwQixDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDMUUsQ0FBQztZQUNELENBQUM7Z0JBQ0EsTUFBTSxJQUFJLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO2dCQUN6RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzFFLENBQUM7WUFFRCxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDYixFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=