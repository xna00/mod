/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/editor/browser/services/abstractCodeEditorService", "vs/platform/commands/common/commands"], function (require, exports, event_1, abstractCodeEditorService_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestCommandService = exports.TestGlobalStyleSheet = exports.TestCodeEditorService = void 0;
    class TestCodeEditorService extends abstractCodeEditorService_1.AbstractCodeEditorService {
        constructor() {
            super(...arguments);
            this.globalStyleSheet = new TestGlobalStyleSheet();
        }
        _createGlobalStyleSheet() {
            return this.globalStyleSheet;
        }
        getActiveCodeEditor() {
            return null;
        }
        openCodeEditor(input, source, sideBySide) {
            this.lastInput = input;
            return Promise.resolve(null);
        }
    }
    exports.TestCodeEditorService = TestCodeEditorService;
    class TestGlobalStyleSheet extends abstractCodeEditorService_1.GlobalStyleSheet {
        constructor() {
            super(null);
            this.rules = [];
        }
        insertRule(selector, rule) {
            this.rules.unshift(`${selector} {${rule}}`);
        }
        removeRulesContainingSelector(ruleName) {
            for (let i = 0; i < this.rules.length; i++) {
                if (this.rules[i].indexOf(ruleName) >= 0) {
                    this.rules.splice(i, 1);
                    i--;
                }
            }
        }
        read() {
            return this.rules.join('\n');
        }
    }
    exports.TestGlobalStyleSheet = TestGlobalStyleSheet;
    class TestCommandService {
        constructor(instantiationService) {
            this._onWillExecuteCommand = new event_1.Emitter();
            this.onWillExecuteCommand = this._onWillExecuteCommand.event;
            this._onDidExecuteCommand = new event_1.Emitter();
            this.onDidExecuteCommand = this._onDidExecuteCommand.event;
            this._instantiationService = instantiationService;
        }
        executeCommand(id, ...args) {
            const command = commands_1.CommandsRegistry.getCommand(id);
            if (!command) {
                return Promise.reject(new Error(`command '${id}' not found`));
            }
            try {
                this._onWillExecuteCommand.fire({ commandId: id, args });
                const result = this._instantiationService.invokeFunction.apply(this._instantiationService, [command.handler, ...args]);
                this._onDidExecuteCommand.fire({ commandId: id, args });
                return Promise.resolve(result);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    }
    exports.TestCommandService = TestCommandService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yVGVzdFNlcnZpY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL2VkaXRvclRlc3RTZXJ2aWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxxQkFBc0IsU0FBUSxxREFBeUI7UUFBcEU7O1lBRWlCLHFCQUFnQixHQUFHLElBQUksb0JBQW9CLEVBQUUsQ0FBQztRQWMvRCxDQUFDO1FBWm1CLHVCQUF1QjtZQUN6QyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixDQUFDO1FBRUQsbUJBQW1CO1lBQ2xCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVRLGNBQWMsQ0FBQyxLQUEyQixFQUFFLE1BQTBCLEVBQUUsVUFBb0I7WUFDcEcsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDdkIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FDRDtJQWhCRCxzREFnQkM7SUFFRCxNQUFhLG9CQUFxQixTQUFRLDRDQUFnQjtRQUl6RDtZQUNDLEtBQUssQ0FBQyxJQUFLLENBQUMsQ0FBQztZQUhQLFVBQUssR0FBYSxFQUFFLENBQUM7UUFJNUIsQ0FBQztRQUVlLFVBQVUsQ0FBQyxRQUFnQixFQUFFLElBQVk7WUFDeEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxRQUFRLEtBQUssSUFBSSxHQUFHLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRWUsNkJBQTZCLENBQUMsUUFBZ0I7WUFDN0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzVDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQzFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDeEIsQ0FBQyxFQUFFLENBQUM7Z0JBQ0wsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU0sSUFBSTtZQUNWLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsQ0FBQztLQUNEO0lBeEJELG9EQXdCQztJQUVELE1BQWEsa0JBQWtCO1FBVzlCLFlBQVksb0JBQTJDO1lBTnRDLDBCQUFxQixHQUFHLElBQUksZUFBTyxFQUFpQixDQUFDO1lBQ3RELHlCQUFvQixHQUF5QixJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBRTdFLHlCQUFvQixHQUFHLElBQUksZUFBTyxFQUFpQixDQUFDO1lBQ3JELHdCQUFtQixHQUF5QixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBRzNGLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQztRQUNuRCxDQUFDO1FBRU0sY0FBYyxDQUFJLEVBQVUsRUFBRSxHQUFHLElBQVc7WUFDbEQsTUFBTSxPQUFPLEdBQUcsMkJBQWdCLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDL0QsQ0FBQztZQUVELElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQU0sQ0FBQztnQkFDNUgsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDeEQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNkLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBOUJELGdEQThCQyJ9