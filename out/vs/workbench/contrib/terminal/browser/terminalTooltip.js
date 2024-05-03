/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/common/htmlContent"], function (require, exports, nls_1, arrays_1, htmlContent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInstanceHoverInfo = getInstanceHoverInfo;
    exports.getShellIntegrationTooltip = getShellIntegrationTooltip;
    exports.getShellProcessTooltip = getShellProcessTooltip;
    function getInstanceHoverInfo(instance) {
        let statusString = '';
        const statuses = instance.statusList.statuses;
        const actions = [];
        for (const status of statuses) {
            statusString += `\n\n---\n\n${status.icon ? `$(${status.icon?.id}) ` : ''}${status.tooltip || status.id}`;
            if (status.hoverActions) {
                actions.push(...status.hoverActions);
            }
        }
        const shellProcessString = getShellProcessTooltip(instance, true);
        const shellIntegrationString = getShellIntegrationTooltip(instance, true);
        const content = new htmlContent_1.MarkdownString(instance.title + shellProcessString + shellIntegrationString + statusString, { supportThemeIcons: true });
        return { content, actions };
    }
    function getShellIntegrationTooltip(instance, markdown) {
        const shellIntegrationCapabilities = [];
        if (instance.capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
            shellIntegrationCapabilities.push(2 /* TerminalCapability.CommandDetection */);
        }
        if (instance.capabilities.has(0 /* TerminalCapability.CwdDetection */)) {
            shellIntegrationCapabilities.push(0 /* TerminalCapability.CwdDetection */);
        }
        let shellIntegrationString = '';
        if (shellIntegrationCapabilities.length > 0) {
            shellIntegrationString += `${markdown ? '\n\n---\n\n' : '\n\n'}${(0, nls_1.localize)('shellIntegration.enabled', "Shell integration activated")}`;
        }
        else {
            if (instance.shellLaunchConfig.ignoreShellIntegration) {
                shellIntegrationString += `${markdown ? '\n\n---\n\n' : '\n\n'}${(0, nls_1.localize)('launchFailed.exitCodeOnlyShellIntegration', "The terminal process failed to launch. Disabling shell integration with terminal.integrated.shellIntegration.enabled might help.")}`;
            }
            else {
                if (instance.usedShellIntegrationInjection) {
                    shellIntegrationString += `${markdown ? '\n\n---\n\n' : '\n\n'}${(0, nls_1.localize)('shellIntegration.activationFailed', "Shell integration failed to activate")}`;
                }
            }
        }
        return shellIntegrationString;
    }
    function getShellProcessTooltip(instance, markdown) {
        const lines = [];
        if (instance.processId && instance.processId > 0) {
            lines.push((0, nls_1.localize)({ key: 'shellProcessTooltip.processId', comment: ['The first arg is "PID" which shouldn\'t be translated'] }, "Process ID ({0}): {1}", 'PID', instance.processId) + '\n');
        }
        if (instance.shellLaunchConfig.executable) {
            let commandLine = instance.shellLaunchConfig.executable;
            const args = (0, arrays_1.asArray)(instance.injectedArgs || instance.shellLaunchConfig.args || []).map(x => `'${x}'`).join(' ');
            if (args) {
                commandLine += ` ${args}`;
            }
            lines.push((0, nls_1.localize)('shellProcessTooltip.commandLine', 'Command line: {0}', commandLine));
        }
        return lines.length ? `${markdown ? '\n\n---\n\n' : '\n\n'}${lines.join('\n')}` : '';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUb29sdGlwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsVG9vbHRpcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxvREFnQkM7SUFFRCxnRUFxQkM7SUFFRCx3REFrQkM7SUEzREQsU0FBZ0Isb0JBQW9CLENBQUMsUUFBMkI7UUFDL0QsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ3RCLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO1FBQzlDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNuQixLQUFLLE1BQU0sTUFBTSxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQy9CLFlBQVksSUFBSSxjQUFjLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzFHLElBQUksTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN6QixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3RDLENBQUM7UUFDRixDQUFDO1FBRUQsTUFBTSxrQkFBa0IsR0FBRyxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEUsTUFBTSxzQkFBc0IsR0FBRywwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDMUUsTUFBTSxPQUFPLEdBQUcsSUFBSSw0QkFBYyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsa0JBQWtCLEdB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