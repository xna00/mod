/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "fs/promises", "readline", "vs/base/common/platform"], function (require, exports, fs_1, promises_1, readline_1, Platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getOSReleaseInfo = getOSReleaseInfo;
    async function getOSReleaseInfo(errorLogger) {
        if (Platform.isMacintosh || Platform.isWindows) {
            return;
        }
        // Extract release information on linux based systems
        // using the identifiers specified in
        // https://www.freedesktop.org/software/systemd/man/os-release.html
        let handle;
        for (const filePath of ['/etc/os-release', '/usr/lib/os-release', '/etc/lsb-release']) {
            try {
                handle = await (0, promises_1.open)(filePath, fs_1.constants.R_OK);
                break;
            }
            catch (err) { }
        }
        if (!handle) {
            errorLogger('Unable to retrieve release information from known identifier paths.');
            return;
        }
        try {
            const osReleaseKeys = new Set([
                'ID',
                'DISTRIB_ID',
                'ID_LIKE',
                'VERSION_ID',
                'DISTRIB_RELEASE',
            ]);
            const releaseInfo = {
                id: 'unknown'
            };
            for await (const line of (0, readline_1.createInterface)({ input: handle.createReadStream(), crlfDelay: Infinity })) {
                if (!line.includes('=')) {
                    continue;
                }
                const key = line.split('=')[0].toUpperCase().trim();
                if (osReleaseKeys.has(key)) {
                    const value = line.split('=')[1].replace(/"/g, '').toLowerCase().trim();
                    if (key === 'ID' || key === 'DISTRIB_ID') {
                        releaseInfo.id = value;
                    }
                    else if (key === 'ID_LIKE') {
                        releaseInfo.id_like = value;
                    }
                    else if (key === 'VERSION_ID' || key === 'DISTRIB_RELEASE') {
                        releaseInfo.version_id = value;
                    }
                }
            }
            return releaseInfo;
        }
        catch (err) {
            errorLogger(err);
        }
        return;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3NSZWxlYXNlSW5mby5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9ub2RlL29zUmVsZWFzZUluZm8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsNENBd0RDO0lBeERNLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxXQUFpQztRQUN2RSxJQUFJLFFBQVEsQ0FBQyxXQUFXLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2hELE9BQU87UUFDUixDQUFDO1FBRUQscURBQXFEO1FBQ3JELHFDQUFxQztRQUNyQyxtRUFBbUU7UUFDbkUsSUFBSSxNQUE4QixDQUFDO1FBQ25DLEtBQUssTUFBTSxRQUFRLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxxQkFBcUIsRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLENBQUM7WUFDdkYsSUFBSSxDQUFDO2dCQUNKLE1BQU0sR0FBRyxNQUFNLElBQUEsZUFBSSxFQUFDLFFBQVEsRUFBRSxjQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hELE1BQU07WUFDUCxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEIsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNiLFdBQVcsQ0FBQyxxRUFBcUUsQ0FBQyxDQUFDO1lBQ25GLE9BQU87UUFDUixDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQ0osTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUM7Z0JBQzdCLElBQUk7Z0JBQ0osWUFBWTtnQkFDWixTQUFTO2dCQUNULFlBQVk7Z0JBQ1osaUJBQWlCO2FBQ2pCLENBQUMsQ0FBQztZQUNILE1BQU0sV0FBVyxHQUFnQjtnQkFDaEMsRUFBRSxFQUFFLFNBQVM7YUFDYixDQUFDO1lBRUYsSUFBSSxLQUFLLEVBQUUsTUFBTSxJQUFJLElBQUksSUFBQSwwQkFBUyxFQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQy9GLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3pCLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNwRCxJQUFJLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDNUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUN4RSxJQUFJLEdBQUcsS0FBSyxJQUFJLElBQUksR0FBRyxLQUFLLFlBQVksRUFBRSxDQUFDO3dCQUMxQyxXQUFXLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQztvQkFDeEIsQ0FBQzt5QkFBTSxJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDOUIsV0FBVyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7b0JBQzdCLENBQUM7eUJBQU0sSUFBSSxHQUFHLEtBQUssWUFBWSxJQUFJLEdBQUcsS0FBSyxpQkFBaUIsRUFBRSxDQUFDO3dCQUM5RCxXQUFXLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztvQkFDaEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2QsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxPQUFPO0lBQ1IsQ0FBQyJ9