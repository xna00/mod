/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/product/common/product", "vs/platform/dialogs/common/dialogs", "vs/platform/native/common/native", "vs/base/common/errorMessage", "vs/platform/product/common/productService", "vs/base/common/errors"], function (require, exports, nls_1, actions_1, product_1, dialogs_1, native_1, errorMessage_1, productService_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UninstallShellScriptAction = exports.InstallShellScriptAction = void 0;
    const shellCommandCategory = (0, nls_1.localize2)('shellCommand', 'Shell Command');
    class InstallShellScriptAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.installCommandLine',
                title: (0, nls_1.localize2)('install', "Install '{0}' command in PATH", product_1.default.applicationName),
                category: shellCommandCategory,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const productService = accessor.get(productService_1.IProductService);
            try {
                await nativeHostService.installShellCommand();
                dialogService.info((0, nls_1.localize)('successIn', "Shell command '{0}' successfully installed in PATH.", productService.applicationName));
            }
            catch (error) {
                if ((0, errors_1.isCancellationError)(error)) {
                    return;
                }
                dialogService.error((0, errorMessage_1.toErrorMessage)(error));
            }
        }
    }
    exports.InstallShellScriptAction = InstallShellScriptAction;
    class UninstallShellScriptAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.uninstallCommandLine',
                title: (0, nls_1.localize2)('uninstall', "Uninstall '{0}' command from PATH", product_1.default.applicationName),
                category: shellCommandCategory,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const productService = accessor.get(productService_1.IProductService);
            try {
                await nativeHostService.uninstallShellCommand();
                dialogService.info((0, nls_1.localize)('successFrom', "Shell command '{0}' successfully uninstalled from PATH.", productService.applicationName));
            }
            catch (error) {
                if ((0, errors_1.isCancellationError)(error)) {
                    return;
                }
                dialogService.error((0, errorMessage_1.toErrorMessage)(error));
            }
        }
    }
    exports.UninstallShellScriptAction = UninstallShellScriptAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9lbGVjdHJvbi1zYW5kYm94L2FjdGlvbnMvaW5zdGFsbEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQU0sb0JBQW9CLEdBQXFCLElBQUEsZUFBUyxFQUFDLGNBQWMsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUUxRixNQUFhLHdCQUF5QixTQUFRLGlCQUFPO1FBRXBEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxxQ0FBcUM7Z0JBQ3pDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxTQUFTLEVBQUUsK0JBQStCLEVBQUUsaUJBQU8sQ0FBQyxlQUFlLENBQUM7Z0JBQ3JGLFFBQVEsRUFBRSxvQkFBb0I7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFrQixDQUFDLENBQUM7WUFDM0QsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQ0FBZSxDQUFDLENBQUM7WUFFckQsSUFBSSxDQUFDO2dCQUNKLE1BQU0saUJBQWlCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFFOUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUscURBQXFELEVBQUUsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDbEksQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksSUFBQSw0QkFBbUIsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNoQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM1QyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBNUJELDREQTRCQztJQUVELE1BQWEsMEJBQTJCLFNBQVEsaUJBQU87UUFFdEQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHVDQUF1QztnQkFDM0MsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLFdBQVcsRUFBRSxtQ0FBbUMsRUFBRSxpQkFBTyxDQUFDLGVBQWUsQ0FBQztnQkFDM0YsUUFBUSxFQUFFLG9CQUFvQjtnQkFDOUIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUNuQyxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWtCLENBQUMsQ0FBQztZQUMzRCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUFjLENBQUMsQ0FBQztZQUNuRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGdDQUFlLENBQUMsQ0FBQztZQUVyRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxpQkFBaUIsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUVoRCxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSx5REFBeUQsRUFBRSxjQUFjLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUN4SSxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxJQUFBLDRCQUFtQixFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2hDLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzVDLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUE1QkQsZ0VBNEJDIn0=