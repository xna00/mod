/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/async", "vs/base/common/extpath", "vs/base/node/pfs", "vs/base/node/terminalEncoding"], function (require, exports, os_1, async_1, extpath_1, pfs_1, terminalEncoding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasStdinWithoutTty = hasStdinWithoutTty;
    exports.stdinDataListener = stdinDataListener;
    exports.getStdinFilePath = getStdinFilePath;
    exports.readFromStdin = readFromStdin;
    function hasStdinWithoutTty() {
        try {
            return !process.stdin.isTTY; // Via https://twitter.com/MylesBorins/status/782009479382626304
        }
        catch (error) {
            // Windows workaround for https://github.com/nodejs/node/issues/11656
        }
        return false;
    }
    function stdinDataListener(durationinMs) {
        return new Promise(resolve => {
            const dataListener = () => resolve(true);
            // wait for 1s maximum...
            setTimeout(() => {
                process.stdin.removeListener('data', dataListener);
                resolve(false);
            }, durationinMs);
            // ...but finish early if we detect data
            process.stdin.once('data', dataListener);
        });
    }
    function getStdinFilePath() {
        return (0, extpath_1.randomPath)((0, os_1.tmpdir)(), 'code-stdin', 3);
    }
    async function readFromStdin(targetPath, verbose, onEnd) {
        let [encoding, iconv] = await Promise.all([
            (0, terminalEncoding_1.resolveTerminalEncoding)(verbose),
            new Promise((resolve_1, reject_1) => { require(['@vscode/iconv-lite-umd'], resolve_1, reject_1); }), // lazy load encoding module for usage
            pfs_1.Promises.appendFile(targetPath, '') // make sure file exists right away (https://github.com/microsoft/vscode/issues/155341)
        ]);
        if (!iconv.encodingExists(encoding)) {
            console.log(`Unsupported terminal encoding: ${encoding}, falling back to UTF-8.`);
            encoding = 'utf8';
        }
        // Use a `Queue` to be able to use `appendFile`
        // which helps file watchers to be aware of the
        // changes because each append closes the underlying
        // file descriptor.
        // (https://github.com/microsoft/vscode/issues/148952)
        const appendFileQueue = new async_1.Queue();
        const decoder = iconv.getDecoder(encoding);
        process.stdin.on('data', chunk => {
            const chunkStr = decoder.write(chunk);
            appendFileQueue.queue(() => pfs_1.Promises.appendFile(targetPath, chunkStr));
        });
        process.stdin.on('end', () => {
            const end = decoder.end();
            appendFileQueue.queue(async () => {
                try {
                    if (typeof end === 'string') {
                        await pfs_1.Promises.appendFile(targetPath, end);
                    }
                }
                finally {
                    onEnd?.();
                }
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RkaW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2Vudmlyb25tZW50L25vZGUvc3RkaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsZ0RBT0M7SUFFRCw4Q0FjQztJQUVELDRDQUVDO0lBRUQsc0NBeUNDO0lBdEVELFNBQWdCLGtCQUFrQjtRQUNqQyxJQUFJLENBQUM7WUFDSixPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxnRUFBZ0U7UUFDOUYsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDaEIscUVBQXFFO1FBQ3RFLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxZQUFvQjtRQUNyRCxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzVCLE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV6Qyx5QkFBeUI7WUFDekIsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDZixPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBRW5ELE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoQixDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFakIsd0NBQXdDO1lBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFnQixnQkFBZ0I7UUFDL0IsT0FBTyxJQUFBLG9CQUFVLEVBQUMsSUFBQSxXQUFNLEdBQUUsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVNLEtBQUssVUFBVSxhQUFhLENBQUMsVUFBa0IsRUFBRSxPQUFnQixFQUFFLEtBQWdCO1FBRXpGLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ3pDLElBQUEsMENBQXVCLEVBQUMsT0FBTyxDQUFDOzREQUN6Qix3QkFBd0IsNkJBQUcsc0NBQXNDO1lBQ3hFLGNBQVEsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLHVGQUF1RjtTQUMzSCxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQ3JDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLFFBQVEsMEJBQTBCLENBQUMsQ0FBQztZQUNsRixRQUFRLEdBQUcsTUFBTSxDQUFDO1FBQ25CLENBQUM7UUFFRCwrQ0FBK0M7UUFDL0MsK0NBQStDO1FBQy9DLG9EQUFvRDtRQUNwRCxtQkFBbUI7UUFDbkIsc0RBQXNEO1FBRXRELE1BQU0sZUFBZSxHQUFHLElBQUksYUFBSyxFQUFFLENBQUM7UUFFcEMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUUzQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUU7WUFDaEMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLGNBQVEsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO1lBQzVCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUUxQixlQUFlLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNoQyxJQUFJLENBQUM7b0JBQ0osSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQzt3QkFDN0IsTUFBTSxjQUFRLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDNUMsQ0FBQztnQkFDRixDQUFDO3dCQUFTLENBQUM7b0JBQ1YsS0FBSyxFQUFFLEVBQUUsQ0FBQztnQkFDWCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMifQ==