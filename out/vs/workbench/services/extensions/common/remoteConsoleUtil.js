/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/console"], function (require, exports, console_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.logRemoteEntry = logRemoteEntry;
    exports.logRemoteEntryIfError = logRemoteEntryIfError;
    function logRemoteEntry(logService, entry, label = null) {
        const args = (0, console_1.parse)(entry).args;
        let firstArg = args.shift();
        if (typeof firstArg !== 'string') {
            return;
        }
        if (!entry.severity) {
            entry.severity = 'info';
        }
        if (label) {
            if (!/^\[/.test(label)) {
                label = `[${label}]`;
            }
            if (!/ $/.test(label)) {
                label = `${label} `;
            }
            firstArg = label + firstArg;
        }
        switch (entry.severity) {
            case 'log':
            case 'info':
                logService.info(firstArg, ...args);
                break;
            case 'warn':
                logService.warn(firstArg, ...args);
                break;
            case 'error':
                logService.error(firstArg, ...args);
                break;
        }
    }
    function logRemoteEntryIfError(logService, entry, label) {
        const args = (0, console_1.parse)(entry).args;
        const firstArg = args.shift();
        if (typeof firstArg !== 'string' || entry.severity !== 'error') {
            return;
        }
        if (!/^\[/.test(label)) {
            label = `[${label}]`;
        }
        if (!/ $/.test(label)) {
            label = `${label} `;
        }
        logService.error(label + firstArg, ...args);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQ29uc29sZVV0aWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9yZW1vdGVDb25zb2xlVXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQUtoRyx3Q0FpQ0M7SUFFRCxzREFlQztJQWxERCxTQUFnQixjQUFjLENBQUMsVUFBdUIsRUFBRSxLQUF3QixFQUFFLFFBQXVCLElBQUk7UUFDNUcsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFLLEVBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQy9CLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM1QixJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2xDLE9BQU87UUFDUixDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQixLQUFLLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztRQUN6QixDQUFDO1FBRUQsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNYLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLEtBQUssR0FBRyxJQUFJLEtBQUssR0FBRyxDQUFDO1lBQ3RCLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2QixLQUFLLEdBQUcsR0FBRyxLQUFLLEdBQUcsQ0FBQztZQUNyQixDQUFDO1lBQ0QsUUFBUSxHQUFHLEtBQUssR0FBRyxRQUFRLENBQUM7UUFDN0IsQ0FBQztRQUVELFFBQVEsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3hCLEtBQUssS0FBSyxDQUFDO1lBQ1gsS0FBSyxNQUFNO2dCQUNWLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBQ25DLE1BQU07WUFDUCxLQUFLLE1BQU07Z0JBQ1YsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDbkMsTUFBTTtZQUNQLEtBQUssT0FBTztnQkFDWCxVQUFVLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUNwQyxNQUFNO1FBQ1IsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxVQUF1QixFQUFFLEtBQXdCLEVBQUUsS0FBYTtRQUNyRyxNQUFNLElBQUksR0FBRyxJQUFBLGVBQUssRUFBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDL0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzlCLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFLENBQUM7WUFDaEUsT0FBTztRQUNSLENBQUM7UUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3hCLEtBQUssR0FBRyxJQUFJLEtBQUssR0FBRyxDQUFDO1FBQ3RCLENBQUM7UUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3ZCLEtBQUssR0FBRyxHQUFHLEtBQUssR0FBRyxDQUFDO1FBQ3JCLENBQUM7UUFFRCxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM3QyxDQUFDIn0=