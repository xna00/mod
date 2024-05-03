/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/node/pfs"], function (require, exports, path_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildTelemetryMessage = buildTelemetryMessage;
    async function buildTelemetryMessage(appRoot, extensionsPath) {
        const mergedTelemetry = Object.create(null);
        // Simple function to merge the telemetry into one json object
        const mergeTelemetry = (contents, dirName) => {
            const telemetryData = JSON.parse(contents);
            mergedTelemetry[dirName] = telemetryData;
        };
        if (extensionsPath) {
            const dirs = [];
            const files = await pfs_1.Promises.readdir(extensionsPath);
            for (const file of files) {
                try {
                    const fileStat = await pfs_1.Promises.stat((0, path_1.join)(extensionsPath, file));
                    if (fileStat.isDirectory()) {
                        dirs.push(file);
                    }
                }
                catch {
                    // This handles case where broken symbolic links can cause statSync to throw and error
                }
            }
            const telemetryJsonFolders = [];
            for (const dir of dirs) {
                const files = (await pfs_1.Promises.readdir((0, path_1.join)(extensionsPath, dir))).filter(file => file === 'telemetry.json');
                if (files.length === 1) {
                    telemetryJsonFolders.push(dir); // // We know it contains a telemetry.json file so we add it to the list of folders which have one
                }
            }
            for (const folder of telemetryJsonFolders) {
                const contents = (await pfs_1.Promises.readFile((0, path_1.join)(extensionsPath, folder, 'telemetry.json'))).toString();
                mergeTelemetry(contents, folder);
            }
        }
        let contents = (await pfs_1.Promises.readFile((0, path_1.join)(appRoot, 'telemetry-core.json'))).toString();
        mergeTelemetry(contents, 'vscode-core');
        contents = (await pfs_1.Promises.readFile((0, path_1.join)(appRoot, 'telemetry-extensions.json'))).toString();
        mergeTelemetry(contents, 'vscode-extensions');
        return JSON.stringify(mergedTelemetry, null, 4);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvbm9kZS90ZWxlbWV0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsc0RBNkNDO0lBN0NNLEtBQUssVUFBVSxxQkFBcUIsQ0FBQyxPQUFlLEVBQUUsY0FBdUI7UUFDbkYsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU1Qyw4REFBOEQ7UUFDOUQsTUFBTSxjQUFjLEdBQUcsQ0FBQyxRQUFnQixFQUFFLE9BQWUsRUFBRSxFQUFFO1lBQzVELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0MsZUFBZSxDQUFDLE9BQU8sQ0FBQyxHQUFHLGFBQWEsQ0FBQztRQUMxQyxDQUFDLENBQUM7UUFFRixJQUFJLGNBQWMsRUFBRSxDQUFDO1lBQ3BCLE1BQU0sSUFBSSxHQUFhLEVBQUUsQ0FBQztZQUUxQixNQUFNLEtBQUssR0FBRyxNQUFNLGNBQVEsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDckQsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDO29CQUNKLE1BQU0sUUFBUSxHQUFHLE1BQU0sY0FBUSxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDakUsSUFBSSxRQUFRLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQzt3QkFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDakIsQ0FBQztnQkFDRixDQUFDO2dCQUFDLE1BQU0sQ0FBQztvQkFDUixzRkFBc0Y7Z0JBQ3ZGLENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSxvQkFBb0IsR0FBYSxFQUFFLENBQUM7WUFDMUMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxNQUFNLGNBQVEsQ0FBQyxPQUFPLENBQUMsSUFBQSxXQUFJLEVBQUMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsQ0FBQztnQkFDNUcsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN4QixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxrR0FBa0c7Z0JBQ25JLENBQUM7WUFDRixDQUFDO1lBRUQsS0FBSyxNQUFNLE1BQU0sSUFBSSxvQkFBb0IsRUFBRSxDQUFDO2dCQUMzQyxNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQU0sY0FBUSxDQUFDLFFBQVEsQ0FBQyxJQUFBLFdBQUksRUFBQyxjQUFjLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN0RyxjQUFjLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2xDLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxRQUFRLEdBQUcsQ0FBQyxNQUFNLGNBQVEsQ0FBQyxRQUFRLENBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzFGLGNBQWMsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFFeEMsUUFBUSxHQUFHLENBQUMsTUFBTSxjQUFRLENBQUMsUUFBUSxDQUFDLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSwyQkFBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM1RixjQUFjLENBQUMsUUFBUSxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFFOUMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDakQsQ0FBQyJ9