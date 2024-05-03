/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/processes", "vs/base/common/types", "vs/base/node/pfs"], function (require, exports, path, Platform, process, processes_1, Types, pfs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.win32 = exports.TerminateResponseCode = exports.Source = void 0;
    exports.getWindowsShell = getWindowsShell;
    exports.createQueuedSender = createQueuedSender;
    Object.defineProperty(exports, "Source", { enumerable: true, get: function () { return processes_1.Source; } });
    Object.defineProperty(exports, "TerminateResponseCode", { enumerable: true, get: function () { return processes_1.TerminateResponseCode; } });
    function getWindowsShell(env = process.env) {
        return env['comspec'] || 'cmd.exe';
    }
    // Wrapper around process.send() that will queue any messages if the internal node.js
    // queue is filled with messages and only continue sending messages when the internal
    // queue is free again to consume messages.
    // On Windows we always wait for the send() method to return before sending the next message
    // to workaround https://github.com/nodejs/node/issues/7657 (IPC can freeze process)
    function createQueuedSender(childProcess) {
        let msgQueue = [];
        let useQueue = false;
        const send = function (msg) {
            if (useQueue) {
                msgQueue.push(msg); // add to the queue if the process cannot handle more messages
                return;
            }
            const result = childProcess.send(msg, (error) => {
                if (error) {
                    console.error(error); // unlikely to happen, best we can do is log this error
                }
                useQueue = false; // we are good again to send directly without queue
                // now send all the messages that we have in our queue and did not send yet
                if (msgQueue.length > 0) {
                    const msgQueueCopy = msgQueue.slice(0);
                    msgQueue = [];
                    msgQueueCopy.forEach(entry => send(entry));
                }
            });
            if (!result || Platform.isWindows /* workaround https://github.com/nodejs/node/issues/7657 */) {
                useQueue = true;
            }
        };
        return { send };
    }
    var win32;
    (function (win32) {
        async function findExecutable(command, cwd, paths) {
            // If we have an absolute path then we take it.
            if (path.isAbsolute(command)) {
                return command;
            }
            if (cwd === undefined) {
                cwd = process.cwd();
            }
            const dir = path.dirname(command);
            if (dir !== '.') {
                // We have a directory and the directory is relative (see above). Make the path absolute
                // to the current working directory.
                return path.join(cwd, command);
            }
            if (paths === undefined && Types.isString(process.env['PATH'])) {
                paths = process.env['PATH'].split(path.delimiter);
            }
            // No PATH environment. Make path absolute to the cwd.
            if (paths === undefined || paths.length === 0) {
                return path.join(cwd, command);
            }
            async function fileExists(path) {
                if (await pfs.Promises.exists(path)) {
                    let statValue;
                    try {
                        statValue = await pfs.Promises.stat(path);
                    }
                    catch (e) {
                        if (e.message.startsWith('EACCES')) {
                            // it might be symlink
                            statValue = await pfs.Promises.lstat(path);
                        }
                    }
                    return statValue ? !statValue.isDirectory() : false;
                }
                return false;
            }
            // We have a simple file name. We get the path variable from the env
            // and try to find the executable on the path.
            for (const pathEntry of paths) {
                // The path entry is absolute.
                let fullPath;
                if (path.isAbsolute(pathEntry)) {
                    fullPath = path.join(pathEntry, command);
                }
                else {
                    fullPath = path.join(cwd, pathEntry, command);
                }
                if (await fileExists(fullPath)) {
                    return fullPath;
                }
                let withExtension = fullPath + '.com';
                if (await fileExists(withExtension)) {
                    return withExtension;
                }
                withExtension = fullPath + '.exe';
                if (await fileExists(withExtension)) {
                    return withExtension;
                }
            }
            return path.join(cwd, command);
        }
        win32.findExecutable = findExecutable;
    })(win32 || (exports.win32 = win32 = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzc2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL25vZGUvcHJvY2Vzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlCaEcsMENBRUM7SUFXRCxnREErQkM7SUFuRGtELHVGQUhiLGtCQUFNLE9BR2E7SUFBcUIsc0dBSEEsaUNBQXFCLE9BR0E7SUFPbkcsU0FBZ0IsZUFBZSxDQUFDLE1BQU0sT0FBTyxDQUFDLEdBQW1DO1FBQ2hGLE9BQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLFNBQVMsQ0FBQztJQUNwQyxDQUFDO0lBTUQscUZBQXFGO0lBQ3JGLHFGQUFxRjtJQUNyRiwyQ0FBMkM7SUFDM0MsNEZBQTRGO0lBQzVGLG9GQUFvRjtJQUNwRixTQUFnQixrQkFBa0IsQ0FBQyxZQUE2QjtRQUMvRCxJQUFJLFFBQVEsR0FBYSxFQUFFLENBQUM7UUFDNUIsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBRXJCLE1BQU0sSUFBSSxHQUFHLFVBQVUsR0FBUTtZQUM5QixJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyw4REFBOEQ7Z0JBQ2xGLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFtQixFQUFFLEVBQUU7Z0JBQzdELElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLHVEQUF1RDtnQkFDOUUsQ0FBQztnQkFFRCxRQUFRLEdBQUcsS0FBSyxDQUFDLENBQUMsbURBQW1EO2dCQUVyRSwyRUFBMkU7Z0JBQzNFLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDekIsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdkMsUUFBUSxHQUFHLEVBQUUsQ0FBQztvQkFDZCxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLFNBQVMsQ0FBQywyREFBMkQsRUFBRSxDQUFDO2dCQUMvRixRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLENBQUM7UUFDRixDQUFDLENBQUM7UUFFRixPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVELElBQWlCLEtBQUssQ0ErRHJCO0lBL0RELFdBQWlCLEtBQUs7UUFDZCxLQUFLLFVBQVUsY0FBYyxDQUFDLE9BQWUsRUFBRSxHQUFZLEVBQUUsS0FBZ0I7WUFDbkYsK0NBQStDO1lBQy9DLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUM5QixPQUFPLE9BQU8sQ0FBQztZQUNoQixDQUFDO1lBQ0QsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3ZCLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDckIsQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEMsSUFBSSxHQUFHLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2pCLHdGQUF3RjtnQkFDeEYsb0NBQW9DO2dCQUNwQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFDRCxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDaEUsS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBQ0Qsc0RBQXNEO1lBQ3RELElBQUksS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFFRCxLQUFLLFVBQVUsVUFBVSxDQUFDLElBQVk7Z0JBQ3JDLElBQUksTUFBTSxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNyQyxJQUFJLFNBQTRCLENBQUM7b0JBQ2pDLElBQUksQ0FBQzt3QkFDSixTQUFTLEdBQUcsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDM0MsQ0FBQztvQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUNaLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzs0QkFDcEMsc0JBQXNCOzRCQUN0QixTQUFTLEdBQUcsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDNUMsQ0FBQztvQkFDRixDQUFDO29CQUNELE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUNyRCxDQUFDO2dCQUNELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELG9FQUFvRTtZQUNwRSw4Q0FBOEM7WUFDOUMsS0FBSyxNQUFNLFNBQVMsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDL0IsOEJBQThCO2dCQUM5QixJQUFJLFFBQWdCLENBQUM7Z0JBQ3JCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUNoQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzFDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO2dCQUNELElBQUksTUFBTSxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDaEMsT0FBTyxRQUFRLENBQUM7Z0JBQ2pCLENBQUM7Z0JBQ0QsSUFBSSxhQUFhLEdBQUcsUUFBUSxHQUFHLE1BQU0sQ0FBQztnQkFDdEMsSUFBSSxNQUFNLFVBQVUsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO29CQUNyQyxPQUFPLGFBQWEsQ0FBQztnQkFDdEIsQ0FBQztnQkFDRCxhQUFhLEdBQUcsUUFBUSxHQUFHLE1BQU0sQ0FBQztnQkFDbEMsSUFBSSxNQUFNLFVBQVUsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO29CQUNyQyxPQUFPLGFBQWEsQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUE3RHFCLG9CQUFjLGlCQTZEbkMsQ0FBQTtJQUNGLENBQUMsRUEvRGdCLEtBQUsscUJBQUwsS0FBSyxRQStEckIifQ==