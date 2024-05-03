/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/test/common/mock", "vs/base/test/common/snapshot", "vs/base/test/common/utils", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatRequestParser", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/test/common/mockChatService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, mock_1, snapshot_1, utils_1, instantiationServiceMock_1, log_1, storage_1, chatAgents_1, chatRequestParser_1, chatService_1, chatSlashCommands_1, chatVariables_1, mockChatService_1, extensions_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ChatRequestParser', () => {
        const testDisposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let parser;
        let varService;
        setup(async () => {
            instantiationService = testDisposables.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(storage_1.IStorageService, testDisposables.add(new workbenchTestServices_1.TestStorageService()));
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(extensions_1.IExtensionService, new workbenchTestServices_1.TestExtensionService());
            instantiationService.stub(chatService_1.IChatService, new mockChatService_1.MockChatService());
            instantiationService.stub(chatAgents_1.IChatAgentService, instantiationService.createInstance(chatAgents_1.ChatAgentService));
            varService = (0, mock_1.mockObject)()({});
            varService.getDynamicVariables.returns([]);
            instantiationService.stub(chatVariables_1.IChatVariablesService, varService);
        });
        test('plain text', async () => {
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', 'test');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('plain text with newlines', async () => {
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = 'line 1\nline 2\r\nline 3';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('slash command', async () => {
            const slashCommandService = (0, mock_1.mockObject)()({});
            slashCommandService.getCommands.returns([{ command: 'fix' }]);
            instantiationService.stub(chatSlashCommands_1.IChatSlashCommandService, slashCommandService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = '/fix this';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('invalid slash command', async () => {
            const slashCommandService = (0, mock_1.mockObject)()({});
            slashCommandService.getCommands.returns([{ command: 'fix' }]);
            instantiationService.stub(chatSlashCommands_1.IChatSlashCommandService, slashCommandService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = '/explain this';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('multiple slash commands', async () => {
            const slashCommandService = (0, mock_1.mockObject)()({});
            slashCommandService.getCommands.returns([{ command: 'fix' }]);
            instantiationService.stub(chatSlashCommands_1.IChatSlashCommandService, slashCommandService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = '/fix /fix';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('variables', async () => {
            varService.hasVariable.returns(true);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = 'What does #selection mean?';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('variable with question mark', async () => {
            varService.hasVariable.returns(true);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = 'What is #selection?';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('invalid variables', async () => {
            varService.hasVariable.returns(false);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const text = 'What does #selection mean?';
            const result = parser.parseChatRequest('1', text);
            await (0, snapshot_1.assertSnapshot)(result);
        });
        const getAgentWithSlashCommands = (slashCommands) => {
            return { id: 'agent', name: 'agent', extensionId: extensions_1.nullExtensionDescription.identifier, locations: [chatAgents_1.ChatAgentLocation.Panel], metadata: { description: '' }, slashCommands };
        };
        test('agent with subcommand after text', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '@agent Please do /subCommand thanks');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agents, subCommand', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '@agent /subCommand Please do thanks');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agent with question mark', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '@agent? Are you there');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agent and subcommand with leading whitespace', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '    \r\n\t   @agent \r\n\t   /subCommand Thanks');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agent and subcommand after newline', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '    \n@agent\n/subCommand Thanks');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agent not first', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', 'Hello Mr. @agent');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agents and variables and multiline', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            varService.hasVariable.returns(true);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '@agent /subCommand \nPlease do with #selection\nand #debugConsole');
            await (0, snapshot_1.assertSnapshot)(result);
        });
        test('agents and variables and multiline, part2', async () => {
            const agentsService = (0, mock_1.mockObject)()({});
            agentsService.getAgentsByName.returns([getAgentWithSlashCommands([{ name: 'subCommand', description: '' }])]);
            instantiationService.stub(chatAgents_1.IChatAgentService, agentsService);
            varService.hasVariable.returns(true);
            parser = instantiationService.createInstance(chatRequestParser_1.ChatRequestParser);
            const result = parser.parseChatRequest('1', '@agent Please \ndo /subCommand with #selection\nand #debugConsole');
            await (0, snapshot_1.assertSnapshot)(result);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFJlcXVlc3RQYXJzZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC90ZXN0L2NvbW1vbi9jaGF0UmVxdWVzdFBhcnNlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaUJoRyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQy9CLE1BQU0sZUFBZSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVsRSxJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksTUFBeUIsQ0FBQztRQUU5QixJQUFJLFVBQTZDLENBQUM7UUFDbEQsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2hCLG9CQUFvQixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxtREFBd0IsRUFBRSxDQUFDLENBQUM7WUFDM0Usb0JBQW9CLENBQUMsSUFBSSxDQUFDLHlCQUFlLEVBQUUsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDBDQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFGLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQkFBVyxFQUFFLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUM7WUFDN0Qsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDhCQUFpQixFQUFFLElBQUksNENBQW9CLEVBQUUsQ0FBQyxDQUFDO1lBQ3pFLG9CQUFvQixDQUFDLElBQUksQ0FBQywwQkFBWSxFQUFFLElBQUksaUNBQWUsRUFBRSxDQUFDLENBQUM7WUFDL0Qsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDhCQUFpQixFQUFFLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw2QkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFFcEcsVUFBVSxHQUFHLElBQUEsaUJBQVUsR0FBeUIsQ0FBQyxFQUFFLENB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