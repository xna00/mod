/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/process"], function (require, exports, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isHotReloadEnabled = isHotReloadEnabled;
    exports.registerHotReloadHandler = registerHotReloadHandler;
    function isHotReloadEnabled() {
        return process_1.env && !!process_1.env['VSCODE_DEV'];
    }
    function registerHotReloadHandler(handler) {
        if (!isHotReloadEnabled()) {
            return { dispose() { } };
        }
        else {
            const handlers = registerGlobalHotReloadHandler();
            handlers.add(handler);
            return {
                dispose() { handlers.delete(handler); }
            };
        }
    }
    function registerGlobalHotReloadHandler() {
        if (!hotReloadHandlers) {
            hotReloadHandlers = new Set();
        }
        const g = globalThis;
        if (!g.$hotReload_applyNewExports) {
            g.$hotReload_applyNewExports = args => {
                const args2 = { config: { mode: undefined }, ...args };
                for (const h of hotReloadHandlers) {
                    const result = h(args2);
                    if (result) {
                        return result;
                    }
                }
                return undefined;
            };
        }
        return hotReloadHandlers;
    }
    let hotReloadHandlers = undefined;
    if (isHotReloadEnabled()) {
        // This code does not run in production.
        registerHotReloadHandler(({ oldExports, newSrc, config }) => {
            if (config.mode !== 'patch-prototype') {
                return undefined;
            }
            return newExports => {
                for (const key in newExports) {
                    const exportedItem = newExports[key];
                    console.log(`[hot-reload] Patching prototype methods of '${key}'`, { exportedItem });
                    if (typeof exportedItem === 'function' && exportedItem.prototype) {
                        const oldExportedItem = oldExports[key];
                        if (oldExportedItem) {
                            for (const prop of Object.getOwnPropertyNames(exportedItem.prototype)) {
                                const descriptor = Object.getOwnPropertyDescriptor(exportedItem.prototype, prop);
                                const oldDescriptor = Object.getOwnPropertyDescriptor(oldExportedItem.prototype, prop);
                                if (descriptor?.value?.toString() !== oldDescriptor?.value?.toString()) {
                                    console.log(`[hot-reload] Patching prototype method '${key}.${prop}'`);
                                }
                                Object.defineProperty(oldExportedItem.prototype, prop, descriptor);
                            }
                            newExports[key] = oldExportedItem;
                        }
                    }
                }
                return true;
            };
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG90UmVsb2FkLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9ob3RSZWxvYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsZ0RBRUM7SUFDRCw0REFVQztJQWJELFNBQWdCLGtCQUFrQjtRQUNqQyxPQUFPLGFBQUcsSUFBSSxDQUFDLENBQUMsYUFBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFDRCxTQUFnQix3QkFBd0IsQ0FBQyxPQUF5QjtRQUNqRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDO1lBQzNCLE9BQU8sRUFBRSxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDMUIsQ0FBQzthQUFNLENBQUM7WUFDUCxNQUFNLFFBQVEsR0FBRyw4QkFBOEIsRUFBRSxDQUFDO1lBQ2xELFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEIsT0FBTztnQkFDTixPQUFPLEtBQUssUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDdkMsQ0FBQztRQUNILENBQUM7SUFDRixDQUFDO0lBWUQsU0FBUyw4QkFBOEI7UUFDdEMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDeEIsaUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBRUQsTUFBTSxDQUFDLEdBQUcsVUFBMkMsQ0FBQztRQUN0RCxJQUFJLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDbkMsQ0FBQyxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQyxFQUFFO2dCQUNyQyxNQUFNLEtBQUssR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDO2dCQUV2RCxLQUFLLE1BQU0sQ0FBQyxJQUFJLGlCQUFrQixFQUFFLENBQUM7b0JBQ3BDLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDeEIsSUFBSSxNQUFNLEVBQUUsQ0FBQzt3QkFBQyxPQUFPLE1BQU0sQ0FBQztvQkFBQyxDQUFDO2dCQUMvQixDQUFDO2dCQUNELE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUMsQ0FBQztRQUNILENBQUM7UUFFRCxPQUFPLGlCQUFpQixDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFJLGlCQUFpQixHQUFnSixTQUFTLENBQUM7SUFZL0ssSUFBSSxrQkFBa0IsRUFBRSxFQUFFLENBQUM7UUFDMUIsd0NBQXdDO1FBQ3hDLHdCQUF3QixDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7WUFDM0QsSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3ZDLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxPQUFPLFVBQVUsQ0FBQyxFQUFFO2dCQUNuQixLQUFLLE1BQU0sR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUM5QixNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3JDLE9BQU8sQ0FBQyxHQUFHLENBQUMsK0NBQStDLEdBQUcsR0FBRyxFQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztvQkFDckYsSUFBSSxPQUFPLFlBQVksS0FBSyxVQUFVLElBQUksWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUNsRSxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ3hDLElBQUksZUFBZSxFQUFFLENBQUM7NEJBQ3JCLEtBQUssTUFBTSxJQUFJLElBQUksTUFBTSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dDQUN2RSxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUUsQ0FBQztnQ0FDbEYsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixDQUFFLGVBQXVCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2dDQUVoRyxJQUFJLFVBQVUsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssYUFBYSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDO29DQUN4RSxPQUFPLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxHQUFHLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztnQ0FDeEUsQ0FBQztnQ0FFRCxNQUFNLENBQUMsY0FBYyxDQUFFLGVBQXVCLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQzs0QkFDN0UsQ0FBQzs0QkFDRCxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsZUFBZSxDQUFDO3dCQUNuQyxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyJ9