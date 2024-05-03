/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "fs", "vs/base/common/network", "vs/server/node/remoteExtensionHostAgentCli", "vs/server/node/remoteExtensionHostAgentServer", "vs/platform/environment/node/argv", "vs/base/common/path", "perf_hooks", "vs/server/node/serverEnvironmentService", "vs/platform/product/common/product", "vs/base/common/performance"], function (require, exports, os, fs, network_1, remoteExtensionHostAgentCli_1, remoteExtensionHostAgentServer_1, argv_1, path_1, perf_hooks_1, serverEnvironmentService_1, product_1, perf) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.spawnCli = spawnCli;
    exports.createServer = createServer;
    perf.mark('code/server/codeLoaded');
    global.vscodeServerCodeLoadedTime = perf_hooks_1.performance.now();
    const errorReporter = {
        onMultipleValues: (id, usedValue) => {
            console.error(`Option '${id}' can only be defined once. Using value ${usedValue}.`);
        },
        onEmptyValue: (id) => {
            console.error(`Ignoring option '${id}': Value must not be empty.`);
        },
        onUnknownOption: (id) => {
            console.error(`Ignoring option '${id}': not supported for server.`);
        },
        onDeprecatedOption: (deprecatedOption, message) => {
            console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
        }
    };
    const args = (0, argv_1.parseArgs)(process.argv.slice(2), serverEnvironmentService_1.serverOptions, errorReporter);
    const REMOTE_DATA_FOLDER = args['server-data-dir'] || process.env['VSCODE_AGENT_FOLDER'] || (0, path_1.join)(os.homedir(), product_1.default.serverDataFolderName || '.vscode-remote');
    const USER_DATA_PATH = (0, path_1.join)(REMOTE_DATA_FOLDER, 'data');
    const APP_SETTINGS_HOME = (0, path_1.join)(USER_DATA_PATH, 'User');
    const GLOBAL_STORAGE_HOME = (0, path_1.join)(APP_SETTINGS_HOME, 'globalStorage');
    const LOCAL_HISTORY_HOME = (0, path_1.join)(APP_SETTINGS_HOME, 'History');
    const MACHINE_SETTINGS_HOME = (0, path_1.join)(USER_DATA_PATH, 'Machine');
    args['user-data-dir'] = USER_DATA_PATH;
    const APP_ROOT = (0, path_1.dirname)(network_1.FileAccess.asFileUri('').fsPath);
    const BUILTIN_EXTENSIONS_FOLDER_PATH = (0, path_1.join)(APP_ROOT, 'extensions');
    args['builtin-extensions-dir'] = BUILTIN_EXTENSIONS_FOLDER_PATH;
    args['extensions-dir'] = args['extensions-dir'] || (0, path_1.join)(REMOTE_DATA_FOLDER, 'extensions');
    [REMOTE_DATA_FOLDER, args['extensions-dir'], USER_DATA_PATH, APP_SETTINGS_HOME, MACHINE_SETTINGS_HOME, GLOBAL_STORAGE_HOME, LOCAL_HISTORY_HOME].forEach(f => {
        try {
            if (!fs.existsSync(f)) {
                fs.mkdirSync(f, { mode: 0o700 });
            }
        }
        catch (err) {
            console.error(err);
        }
    });
    /**
     * invoked by server-main.js
     */
    function spawnCli() {
        (0, remoteExtensionHostAgentCli_1.run)(args, REMOTE_DATA_FOLDER, serverEnvironmentService_1.serverOptions);
    }
    /**
     * invoked by server-main.js
     */
    function createServer(address) {
        return (0, remoteExtensionHostAgentServer_1.createServer)(address, args, REMOTE_DATA_FOLDER);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLm1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3NlcnZlci9ub2RlL3NlcnZlci5tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBMERoRyw0QkFFQztJQUtELG9DQUVDO0lBcERELElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUM5QixNQUFPLENBQUMsMEJBQTBCLEdBQUcsd0JBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUU3RCxNQUFNLGFBQWEsR0FBa0I7UUFDcEMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFVLEVBQUUsU0FBaUIsRUFBRSxFQUFFO1lBQ25ELE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLDJDQUEyQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFDRCxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRTtZQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFLDZCQUE2QixDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUNELGVBQWUsRUFBRSxDQUFDLEVBQVUsRUFBRSxFQUFFO1lBQy9CLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsOEJBQThCLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBQ0Qsa0JBQWtCLEVBQUUsQ0FBQyxnQkFBd0IsRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUN6RCxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsZ0JBQWdCLG9CQUFvQixPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7S0FDRCxDQUFDO0lBRUYsTUFBTSxJQUFJLEdBQUcsSUFBQSxnQkFBUyxFQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLHdDQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFFNUUsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksSUFBQSxXQUFJLEVBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLGlCQUFPLENBQUMsb0JBQW9CLElBQUksZ0JBQWdCLENBQUMsQ0FBQztJQUNqSyxNQUFNLGNBQWMsR0FBRyxJQUFBLFdBQUksRUFBQyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN4RCxNQUFNLGlCQUFpQixHQUFHLElBQUEsV0FBSSxFQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN2RCxNQUFNLG1CQUFtQixHQUFHLElBQUEsV0FBSSxFQUFDLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ3JFLE1BQU0sa0JBQWtCLEdBQUcsSUFBQSxXQUFJLEVBQUMsaUJBQWlCLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDOUQsTUFBTSxxQkFBcUIsR0FBRyxJQUFBLFdBQUksRUFBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDOUQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLGNBQWMsQ0FBQztJQUN2QyxNQUFNLFFBQVEsR0FBRyxJQUFBLGNBQU8sRUFBQyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxRCxNQUFNLDhCQUE4QixHQUFHLElBQUEsV0FBSSxFQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUNwRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyw4QkFBOEIsQ0FBQztJQUNoRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxJQUFBLFdBQUksRUFBQyxrQkFBa0IsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUUxRixDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxxQkFBcUIsRUFBRSxtQkFBbUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUMzSixJQUFJLENBQUM7WUFDSixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN2QixFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7UUFDRixDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFBQyxDQUFDO0lBQ3RDLENBQUMsQ0FBQyxDQUFDO0lBRUg7O09BRUc7SUFDSCxTQUFnQixRQUFRO1FBQ3ZCLElBQUEsaUNBQU0sRUFBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsd0NBQWEsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLFlBQVksQ0FBQyxPQUF3QztRQUNwRSxPQUFPLElBQUEsNkNBQWMsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDMUQsQ0FBQyJ9