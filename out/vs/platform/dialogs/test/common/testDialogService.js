/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/severity"], function (require, exports, event_1, severity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestDialogService = void 0;
    class TestDialogService {
        constructor(defaultConfirmResult = undefined, defaultPromptResult = undefined) {
            this.defaultConfirmResult = defaultConfirmResult;
            this.defaultPromptResult = defaultPromptResult;
            this.onWillShowDialog = event_1.Event.None;
            this.onDidShowDialog = event_1.Event.None;
            this.confirmResult = undefined;
        }
        setConfirmResult(result) {
            this.confirmResult = result;
        }
        async confirm(confirmation) {
            if (this.confirmResult) {
                const confirmResult = this.confirmResult;
                this.confirmResult = undefined;
                return confirmResult;
            }
            return this.defaultConfirmResult ?? { confirmed: false };
        }
        async prompt(prompt) {
            if (this.defaultPromptResult) {
                return this.defaultPromptResult;
            }
            const promptButtons = [...(prompt.buttons ?? [])];
            if (prompt.cancelButton && typeof prompt.cancelButton !== 'string' && typeof prompt.cancelButton !== 'boolean') {
                promptButtons.push(prompt.cancelButton);
            }
            return { result: await promptButtons[0]?.run({ checkboxChecked: false }) };
        }
        async info(message, detail) {
            await this.prompt({ type: severity_1.default.Info, message, detail });
        }
        async warn(message, detail) {
            await this.prompt({ type: severity_1.default.Warning, message, detail });
        }
        async error(message, detail) {
            await this.prompt({ type: severity_1.default.Error, message, detail });
        }
        async input() { {
            return { confirmed: true, values: [] };
        } }
        async about() { }
    }
    exports.TestDialogService = TestDialogService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdERpYWxvZ1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2RpYWxvZ3MvdGVzdC9jb21tb24vdGVzdERpYWxvZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsaUJBQWlCO1FBTzdCLFlBQ1MsdUJBQXdELFNBQVMsRUFDakUsc0JBQXNELFNBQVM7WUFEL0QseUJBQW9CLEdBQXBCLG9CQUFvQixDQUE2QztZQUNqRSx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQTRDO1lBTC9ELHFCQUFnQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDOUIsb0JBQWUsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBTzlCLGtCQUFhLEdBQW9DLFNBQVMsQ0FBQztRQUYvRCxDQUFDO1FBR0wsZ0JBQWdCLENBQUMsTUFBMkI7WUFDM0MsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7UUFDN0IsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBMkI7WUFDeEMsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7Z0JBQ3pDLElBQUksQ0FBQyxhQUFhLEdBQUcsU0FBUyxDQUFDO2dCQUUvQixPQUFPLGFBQWEsQ0FBQztZQUN0QixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsb0JBQW9CLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDMUQsQ0FBQztRQUtELEtBQUssQ0FBQyxNQUFNLENBQUksTUFBK0M7WUFDOUQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7WUFDakMsQ0FBQztZQUNELE1BQU0sYUFBYSxHQUEyQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUUsSUFBSSxNQUFNLENBQUMsWUFBWSxJQUFJLE9BQU8sTUFBTSxDQUFDLFlBQVksS0FBSyxRQUFRLElBQUksT0FBTyxNQUFNLENBQUMsWUFBWSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNoSCxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN6QyxDQUFDO1lBRUQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQzVFLENBQUM7UUFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQWUsRUFBRSxNQUFlO1lBQzFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxrQkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFlLEVBQUUsTUFBZTtZQUMxQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsa0JBQVEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBZSxFQUFFLE1BQWU7WUFDM0MsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFDRCxLQUFLLENBQUMsS0FBSyxLQUE0QixDQUFDO1lBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEYsS0FBSyxDQUFDLEtBQUssS0FBb0IsQ0FBQztLQUNoQztJQXZERCw4Q0F1REMifQ==