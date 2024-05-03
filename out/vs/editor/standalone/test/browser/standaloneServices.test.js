/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/standalone/browser/standaloneCodeEditorService", "vs/editor/standalone/browser/standaloneServices", "vs/editor/standalone/browser/standaloneThemeService", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, assert, lifecycle_1, utils_1, standaloneCodeEditorService_1, standaloneServices_1, standaloneThemeService_1, contextKeyService_1, instantiationService_1, serviceCollection_1, log_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('StandaloneKeybindingService', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        class TestStandaloneKeybindingService extends standaloneServices_1.StandaloneKeybindingService {
            testDispatch(e) {
                super._dispatch(e, null);
            }
        }
        test('issue microsoft/monaco-editor#167', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            const instantiationService = new instantiationService_1.InstantiationService(serviceCollection, true);
            const configurationService = new standaloneServices_1.StandaloneConfigurationService();
            const contextKeyService = disposables.add(new contextKeyService_1.ContextKeyService(configurationService));
            const commandService = new standaloneServices_1.StandaloneCommandService(instantiationService);
            const notificationService = new standaloneServices_1.StandaloneNotificationService();
            const standaloneThemeService = disposables.add(new standaloneThemeService_1.StandaloneThemeService());
            const codeEditorService = disposables.add(new standaloneCodeEditorService_1.StandaloneCodeEditorService(contextKeyService, standaloneThemeService));
            const keybindingService = disposables.add(new TestStandaloneKeybindingService(contextKeyService, commandService, telemetryUtils_1.NullTelemetryService, notificationService, new log_1.NullLogService(), codeEditorService));
            let commandInvoked = false;
            disposables.add(keybindingService.addDynamicKeybinding('testCommand', 67 /* KeyCode.F9 */, () => {
                commandInvoked = true;
            }, undefined));
            keybindingService.testDispatch({
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: 67 /* KeyCode.F9 */,
                code: null
            });
            assert.ok(commandInvoked, 'command invoked');
            disposables.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZVNlcnZpY2VzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9zdGFuZGFsb25lL3Rlc3QvYnJvd3Nlci9zdGFuZGFsb25lU2VydmljZXMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdCaEcsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUV6QyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsTUFBTSwrQkFBZ0MsU0FBUSxnREFBMkI7WUFDakUsWUFBWSxDQUFDLENBQWlCO2dCQUNwQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFLLENBQUMsQ0FBQztZQUMzQixDQUFDO1NBQ0Q7UUFFRCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1lBRTlDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDO1lBQ2xELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSwyQ0FBb0IsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvRSxNQUFNLG9CQUFvQixHQUFHLElBQUksbURBQThCLEVBQUUsQ0FBQztZQUNsRSxNQUFNLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxxQ0FBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDdkYsTUFBTSxjQUFjLEdBQUcsSUFBSSw2Q0FBd0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQzFFLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxrREFBNkIsRUFBRSxDQUFDO1lBQ2hFLE1BQU0sc0JBQXNCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLCtDQUFzQixFQUFFLENBQUMsQ0FBQztZQUM3RSxNQUFNLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx5REFBMkIsQ0FBQyxpQkFBaUIsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7WUFDdEgsTUFBTSxpQkFBaUIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksK0JBQStCLENBQUMsaUJBQWlCLEVBQUUsY0FBYyxFQUFFLHFDQUFvQixFQUFFLG1CQUFtQixFQUFFLElBQUksb0JBQWMsRUFBRSxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUV0TSxJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7WUFDM0IsV0FBVyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLHVCQUFjLEdBQUcsRUFBRTtnQkFDdEYsY0FBYyxHQUFHLElBQUksQ0FBQztZQUN2QixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUVmLGlCQUFpQixDQUFDLFlBQVksQ0FBQztnQkFDOUIsMkJBQTJCLEVBQUUsSUFBSTtnQkFDakMsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLE9BQU8scUJBQVk7Z0JBQ25CLElBQUksRUFBRSxJQUFLO2FBQ1gsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUU3QyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9