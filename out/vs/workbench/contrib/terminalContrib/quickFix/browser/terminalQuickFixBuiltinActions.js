/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix"], function (require, exports, uri_1, nls_1, quickFix_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickFixSource = exports.PwshUnixCommandNotFoundErrorOutputRegex = exports.PwshGeneralErrorOutputRegex = exports.GitCreatePrOutputRegex = exports.GitPushOutputRegex = exports.FreePortOutputRegex = exports.GitSimilarOutputRegex = exports.GitTwoDashesRegex = exports.GitPushCommandLineRegex = exports.GitPullOutputRegex = exports.GitCommandLineRegex = void 0;
    exports.gitSimilar = gitSimilar;
    exports.gitPull = gitPull;
    exports.gitTwoDashes = gitTwoDashes;
    exports.freePort = freePort;
    exports.gitPushSetUpstream = gitPushSetUpstream;
    exports.gitCreatePr = gitCreatePr;
    exports.pwshGeneralError = pwshGeneralError;
    exports.pwshUnixCommandNotFoundError = pwshUnixCommandNotFoundError;
    exports.GitCommandLineRegex = /git/;
    exports.GitPullOutputRegex = /and can be fast-forwarded/;
    exports.GitPushCommandLineRegex = /git\s+push/;
    exports.GitTwoDashesRegex = /error: did you mean `--(.+)` \(with two dashes\)\?/;
    exports.GitSimilarOutputRegex = /(?:(most similar commands? (is|are)))/;
    exports.FreePortOutputRegex = /(?:address already in use (?:0\.0\.0\.0|127\.0\.0\.1|localhost|::):|Unable to bind [^ ]*:|can't listen on port |listen EADDRINUSE [^ ]*:)(?<portNumber>\d{4,5})/;
    exports.GitPushOutputRegex = /git push --set-upstream origin (?<branchName>[^\s]+)/;
    // The previous line starts with "Create a pull request for \'([^\s]+)\' on GitHub by visiting:\s*"
    // it's safe to assume it's a github pull request if the URL includes `/pull/`
    exports.GitCreatePrOutputRegex = /remote:\s*(?<link>https:\/\/github\.com\/.+\/.+\/pull\/new\/.+)/;
    exports.PwshGeneralErrorOutputRegex = /Suggestion \[General\]:/;
    exports.PwshUnixCommandNotFoundErrorOutputRegex = /Suggestion \[cmd-not-found\]:/;
    var QuickFixSource;
    (function (QuickFixSource) {
        QuickFixSource["Builtin"] = "builtin";
    })(QuickFixSource || (exports.QuickFixSource = QuickFixSource = {}));
    function gitSimilar() {
        return {
            id: 'Git Similar',
            type: 'internal',
            commandLineMatcher: exports.GitCommandLineRegex,
            outputMatcher: {
                lineMatcher: exports.GitSimilarOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 10
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const regexMatch = matchResult.outputMatch?.regexMatch[0];
                if (!regexMatch || !matchResult.outputMatch) {
                    return;
                }
                const actions = [];
                const startIndex = matchResult.outputMatch.outputLines.findIndex(l => l.includes(regexMatch)) + 1;
                const results = matchResult.outputMatch.outputLines.map(r => r.trim());
                for (let i = startIndex; i < results.length; i++) {
                    const fixedCommand = results[i];
                    if (fixedCommand) {
                        actions.push({
                            id: 'Git Similar',
                            type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                            terminalCommand: matchResult.commandLine.replace(/git\s+[^\s]+/, () => `git ${fixedCommand}`),
                            shouldExecute: true,
                            source: "builtin" /* QuickFixSource.Builtin */
                        });
                    }
                }
                return actions;
            }
        };
    }
    function gitPull() {
        return {
            id: 'Git Pull',
            type: 'internal',
            commandLineMatcher: exports.GitCommandLineRegex,
            outputMatcher: {
                lineMatcher: exports.GitPullOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 8
            },
            commandExitResult: 'success',
            getQuickFixes: (matchResult) => {
                return {
                    type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                    id: 'Git Pull',
                    terminalCommand: `git pull`,
                    shouldExecute: true,
                    source: "builtin" /* QuickFixSource.Builtin */
                };
            }
        };
    }
    function gitTwoDashes() {
        return {
            id: 'Git Two Dashes',
            type: 'internal',
            commandLineMatcher: exports.GitCommandLineRegex,
            outputMatcher: {
                lineMatcher: exports.GitTwoDashesRegex,
                anchor: 'bottom',
                offset: 0,
                length: 2
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const problemArg = matchResult?.outputMatch?.regexMatch?.[1];
                if (!problemArg) {
                    return;
                }
                return {
                    type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                    id: 'Git Two Dashes',
                    terminalCommand: matchResult.commandLine.replace(` -${problemArg}`, () => ` --${problemArg}`),
                    shouldExecute: true,
                    source: "builtin" /* QuickFixSource.Builtin */
                };
            }
        };
    }
    function freePort(runCallback) {
        return {
            id: 'Free Port',
            type: 'internal',
            commandLineMatcher: /.+/,
            outputMatcher: {
                lineMatcher: exports.FreePortOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 30
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const port = matchResult?.outputMatch?.regexMatch?.groups?.portNumber;
                if (!port) {
                    return;
                }
                const label = (0, nls_1.localize)("terminal.freePort", "Free port {0}", port);
                return {
                    type: quickFix_1.TerminalQuickFixType.Port,
                    class: undefined,
                    tooltip: label,
                    id: 'Free Port',
                    label,
                    enabled: true,
                    source: "builtin" /* QuickFixSource.Builtin */,
                    run: () => runCallback(port, matchResult.commandLine)
                };
            }
        };
    }
    function gitPushSetUpstream() {
        return {
            id: 'Git Push Set Upstream',
            type: 'internal',
            commandLineMatcher: exports.GitPushCommandLineRegex,
            /**
                Example output on Windows:
                8: PS C:\Users\merogge\repos\xterm.js> git push
                7: fatal: The current branch sdjfskdjfdslkjf has no upstream branch.
                6: To push the current branch and set the remote as upstream, use
                5:
                4:	git push --set-upstream origin sdjfskdjfdslkjf
                3:
                2: To have this happen automatically for branches without a tracking
                1: upstream, see 'push.autoSetupRemote' in 'git help config'.
                0:
    
                Example output on macOS:
                5: meganrogge@Megans-MacBook-Pro xterm.js % git push
                4: fatal: The current branch merogge/asjdkfsjdkfsdjf has no upstream branch.
                3: To push the current branch and set the remote as upstream, use
                2:
                1:	git push --set-upstream origin merogge/asjdkfsjdkfsdjf
                0:
             */
            outputMatcher: {
                lineMatcher: exports.GitPushOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 8
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const matches = matchResult.outputMatch;
                const commandToRun = 'git push --set-upstream origin ${group:branchName}';
                if (!matches) {
                    return;
                }
                const groups = matches.regexMatch.groups;
                if (!groups) {
                    return;
                }
                const actions = [];
                let fixedCommand = commandToRun;
                for (const [key, value] of Object.entries(groups)) {
                    const varToResolve = '${group:' + `${key}` + '}';
                    if (!commandToRun.includes(varToResolve)) {
                        return [];
                    }
                    fixedCommand = fixedCommand.replaceAll(varToResolve, () => value);
                }
                if (fixedCommand) {
                    actions.push({
                        type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                        id: 'Git Push Set Upstream',
                        terminalCommand: fixedCommand,
                        shouldExecute: true,
                        source: "builtin" /* QuickFixSource.Builtin */
                    });
                    return actions;
                }
                return;
            }
        };
    }
    function gitCreatePr() {
        return {
            id: 'Git Create Pr',
            type: 'internal',
            commandLineMatcher: exports.GitPushCommandLineRegex,
            // Example output:
            // ...
            // 10: remote:
            // 9:  remote: Create a pull request for 'my_branch' on GitHub by visiting:
            // 8:  remote:      https://github.com/microsoft/vscode/pull/new/my_branch
            // 7:  remote:
            // 6:  remote: GitHub found x vulnerabilities on microsoft/vscode's default branch (...). To find out more, visit:
            // 5:  remote:      https://github.com/microsoft/vscode/security/dependabot
            // 4:  remote:
            // 3:  To https://github.com/microsoft/vscode
            // 2:  * [new branch]              my_branch -> my_branch
            // 1:  Branch 'my_branch' set up to track remote branch 'my_branch' from 'origin'.
            // 0:
            outputMatcher: {
                lineMatcher: exports.GitCreatePrOutputRegex,
                anchor: 'bottom',
                offset: 4,
                // ~6 should only be needed here for security alerts, but the git provider can customize
                // the text, so use 12 to be safe.
                length: 12
            },
            commandExitResult: 'success',
            getQuickFixes: (matchResult) => {
                const link = matchResult?.outputMatch?.regexMatch?.groups?.link;
                if (!link) {
                    return;
                }
                const label = (0, nls_1.localize)("terminal.createPR", "Create PR {0}", link);
                return {
                    id: 'Git Create Pr',
                    label,
                    enabled: true,
                    type: quickFix_1.TerminalQuickFixType.Opener,
                    uri: uri_1.URI.parse(link),
                    source: "builtin" /* QuickFixSource.Builtin */
                };
            }
        };
    }
    function pwshGeneralError() {
        return {
            id: 'Pwsh General Error',
            type: 'internal',
            commandLineMatcher: /.+/,
            outputMatcher: {
                lineMatcher: exports.PwshGeneralErrorOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 10
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const lines = matchResult.outputMatch?.regexMatch.input?.split('\n');
                if (!lines) {
                    return;
                }
                // Find the start
                let i = 0;
                let inFeedbackProvider = false;
                for (; i < lines.length; i++) {
                    if (lines[i].match(exports.PwshGeneralErrorOutputRegex)) {
                        inFeedbackProvider = true;
                        break;
                    }
                }
                if (!inFeedbackProvider) {
                    return;
                }
                const suggestions = lines[i + 1].match(/The most similar commands are: (?<values>.+)./)?.groups?.values?.split(', ');
                if (!suggestions) {
                    return;
                }
                const result = [];
                for (const suggestion of suggestions) {
                    result.push({
                        id: 'Pwsh General Error',
                        type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                        terminalCommand: suggestion,
                        source: "builtin" /* QuickFixSource.Builtin */
                    });
                }
                return result;
            }
        };
    }
    function pwshUnixCommandNotFoundError() {
        return {
            id: 'Unix Command Not Found',
            type: 'internal',
            commandLineMatcher: /.+/,
            outputMatcher: {
                lineMatcher: exports.PwshUnixCommandNotFoundErrorOutputRegex,
                anchor: 'bottom',
                offset: 0,
                length: 10
            },
            commandExitResult: 'error',
            getQuickFixes: (matchResult) => {
                const lines = matchResult.outputMatch?.regexMatch.input?.split('\n');
                if (!lines) {
                    return;
                }
                // Find the start
                let i = 0;
                let inFeedbackProvider = false;
                for (; i < lines.length; i++) {
                    if (lines[i].match(exports.PwshUnixCommandNotFoundErrorOutputRegex)) {
                        inFeedbackProvider = true;
                        break;
                    }
                }
                if (!inFeedbackProvider) {
                    return;
                }
                // Always remove the first element as it's the "Suggestion [cmd-not-found]"" line
                const result = [];
                let inSuggestions = false;
                for (; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.length === 0) {
                        break;
                    }
                    const installCommand = line.match(/You also have .+ installed, you can run '(?<command>.+)' instead./)?.groups?.command;
                    if (installCommand) {
                        result.push({
                            id: 'Pwsh Unix Command Not Found Error',
                            type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                            terminalCommand: installCommand,
                            source: "builtin" /* QuickFixSource.Builtin */
                        });
                        inSuggestions = false;
                        continue;
                    }
                    if (line.match(/Command '.+' not found, but can be installed with:/)) {
                        inSuggestions = true;
                        continue;
                    }
                    if (inSuggestions) {
                        result.push({
                            id: 'Pwsh Unix Command Not Found Error',
                            type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                            terminalCommand: line.trim(),
                            source: "builtin" /* QuickFixSource.Builtin */
                        });
                    }
                }
                return result;
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxRdWlja0ZpeEJ1aWx0aW5BY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvcXVpY2tGaXgvYnJvd3Nlci90ZXJtaW5hbFF1aWNrRml4QnVpbHRpbkFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUJoRyxnQ0FtQ0M7SUFFRCwwQkFzQkM7SUFFRCxvQ0EwQkM7SUFDRCw0QkE4QkM7SUFFRCxnREFnRUM7SUFFRCxrQ0EyQ0M7SUFFRCw0Q0ErQ0M7SUFFRCxvRUFrRUM7SUEzV1ksUUFBQSxtQkFBbUIsR0FBRyxLQUFLLENBQUM7SUFDNUIsUUFBQSxrQkFBa0IsR0FBRywyQkFBMkIsQ0FBQztJQUNqRCxRQUFBLHVCQUF1QixHQUFHLFlBQVksQ0FBQztJQUN2QyxRQUFBLGlCQUFpQixHQUFHLG9EQUFvRCxDQUFDO0lBQ3pFLFFBQUEscUJBQXFCLEdBQUcsdUNBQXVDLENBQUM7SUFDaEUsUUFBQSxtQkFBbUIsR0FBRyxpS0FBaUssQ0FBQztJQUN4TCxRQUFBLGtCQUFrQixHQUFHLHNEQUFzRCxDQUFDO0lBQ3pGLG1HQUFtRztJQUNuRyw4RUFBOEU7SUFDakUsUUFBQSxzQkFBc0IsR0FBRyxpRUFBaUUsQ0FBQztJQUMzRixRQUFBLDJCQUEyQixHQUFHLHlCQUF5QixDQUFDO0lBQ3hELFFBQUEsdUNBQXVDLEdBQUcsK0JBQStCLENBQUM7SUFFdkYsSUFBa0IsY0FFakI7SUFGRCxXQUFrQixjQUFjO1FBQy9CLHFDQUFtQixDQUFBO0lBQ3BCLENBQUMsRUFGaUIsY0FBYyw4QkFBZCxjQUFjLFFBRS9CO0lBRUQsU0FBZ0IsVUFBVTtRQUN6QixPQUFPO1lBQ04sRUFBRSxFQUFFLGFBQWE7WUFDakIsSUFBSSxFQUFFLFVBQVU7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