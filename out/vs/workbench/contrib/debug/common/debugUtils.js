/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/objects", "vs/base/common/network", "vs/editor/common/core/range", "vs/base/common/cancellation", "vs/base/common/arrays"], function (require, exports, strings_1, uri_1, path_1, objects_1, network_1, range_1, cancellation_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sourcesEqual = void 0;
    exports.formatPII = formatPII;
    exports.filterExceptionsFromTelemetry = filterExceptionsFromTelemetry;
    exports.isSessionAttach = isSessionAttach;
    exports.getExtensionHostDebugSession = getExtensionHostDebugSession;
    exports.isDebuggerMainContribution = isDebuggerMainContribution;
    exports.getExactExpressionStartAndEnd = getExactExpressionStartAndEnd;
    exports.getEvaluatableExpressionAtPosition = getEvaluatableExpressionAtPosition;
    exports.isUri = isUri;
    exports.convertToDAPaths = convertToDAPaths;
    exports.convertToVSCPaths = convertToVSCPaths;
    exports.getVisibleAndSorted = getVisibleAndSorted;
    exports.saveAllBeforeDebugStart = saveAllBeforeDebugStart;
    const _formatPIIRegexp = /{([^}]+)}/g;
    function formatPII(value, excludePII, args) {
        return value.replace(_formatPIIRegexp, function (match, group) {
            if (excludePII && group.length > 0 && group[0] !== '_') {
                return match;
            }
            return args && args.hasOwnProperty(group) ?
                args[group] :
                match;
        });
    }
    /**
     * Filters exceptions (keys marked with "!") from the given object. Used to
     * ensure exception data is not sent on web remotes, see #97628.
     */
    function filterExceptionsFromTelemetry(data) {
        const output = {};
        for (const key of Object.keys(data)) {
            if (!key.startsWith('!')) {
                output[key] = data[key];
            }
        }
        return output;
    }
    function isSessionAttach(session) {
        return session.configuration.request === 'attach' && !getExtensionHostDebugSession(session) && (!session.parentSession || isSessionAttach(session.parentSession));
    }
    /**
     * Returns the session or any parent which is an extension host debug session.
     * Returns undefined if there's none.
     */
    function getExtensionHostDebugSession(session) {
        let type = session.configuration.type;
        if (!type) {
            return;
        }
        if (type === 'vslsShare') {
            type = session.configuration.adapterProxy.configuration.type;
        }
        if ((0, strings_1.equalsIgnoreCase)(type, 'extensionhost') || (0, strings_1.equalsIgnoreCase)(type, 'pwa-extensionhost')) {
            return session;
        }
        return session.parentSession ? getExtensionHostDebugSession(session.parentSession) : undefined;
    }
    // only a debugger contributions with a label, program, or runtime attribute is considered a "defining" or "main" debugger contribution
    function isDebuggerMainContribution(dbg) {
        return dbg.type && (dbg.label || dbg.program || dbg.runtime);
    }
    function getExactExpressionStartAndEnd(lineContent, looseStart, looseEnd) {
        let matchingExpression = undefined;
        let startOffset = 0;
        // Some example supported expressions: myVar.prop, a.b.c.d, myVar?.prop, myVar->prop, MyClass::StaticProp, *myVar
        // Match any character except a set of characters which often break interesting sub-expressions
        const expression = /([^()\[\]{}<>\s+\-/%~#^;=|,`!]|\->)+/g;
        let result = null;
        // First find the full expression under the cursor
        while (result = expression.exec(lineContent)) {
            const start = result.index + 1;
            const end = start + result[0].length;
            if (start <= looseStart && end >= looseEnd) {
                matchingExpression = result[0];
                startOffset = start;
                break;
            }
        }
        // If there are non-word characters after the cursor, we want to truncate the expression then.
        // For example in expression 'a.b.c.d', if the focus was under 'b', 'a.b' would be evaluated.
        if (matchingExpression) {
            const subExpression = /\w+/g;
            let subExpressionResult = null;
            while (subExpressionResult = subExpression.exec(matchingExpression)) {
                const subEnd = subExpressionResult.index + 1 + startOffset + subExpressionResult[0].length;
                if (subEnd >= looseEnd) {
                    break;
                }
            }
            if (subExpressionResult) {
                matchingExpression = matchingExpression.substring(0, subExpression.lastIndex);
            }
        }
        return matchingExpression ?
            { start: startOffset, end: startOffset + matchingExpression.length - 1 } :
            { start: 0, end: 0 };
    }
    async function getEvaluatableExpressionAtPosition(languageFeaturesService, model, position, token) {
        if (languageFeaturesService.evaluatableExpressionProvider.has(model)) {
            const supports = languageFeaturesService.evaluatableExpressionProvider.ordered(model);
            const results = (0, arrays_1.coalesce)(await Promise.all(supports.map(async (support) => {
                try {
                    return await support.provideEvaluatableExpression(model, position, token ?? cancellation_1.CancellationToken.None);
                }
                catch (err) {
                    return undefined;
                }
            })));
            if (results.length > 0) {
                let matchingExpression = results[0].expression;
                const range = results[0].range;
                if (!matchingExpression) {
                    const lineContent = model.getLineContent(position.lineNumber);
                    matchingExpression = lineContent.substring(range.startColumn - 1, range.endColumn - 1);
                }
                return { range, matchingExpression };
            }
        }
        else { // old one-size-fits-all strategy
            const lineContent = model.getLineContent(position.lineNumber);
            const { start, end } = getExactExpressionStartAndEnd(lineContent, position.column, position.column);
            // use regex to extract the sub-expression #9821
            const matchingExpression = lineContent.substring(start - 1, end);
            return {
                matchingExpression,
                range: new range_1.Range(position.lineNumber, start, position.lineNumber, start + matchingExpression.length)
            };
        }
        return null;
    }
    // RFC 2396, Appendix A: https://www.ietf.org/rfc/rfc2396.txt
    const _schemePattern = /^[a-zA-Z][a-zA-Z0-9\+\-\.]+:/;
    function isUri(s) {
        // heuristics: a valid uri starts with a scheme and
        // the scheme has at least 2 characters so that it doesn't look like a drive letter.
        return !!(s && s.match(_schemePattern));
    }
    function stringToUri(source) {
        if (typeof source.path === 'string') {
            if (typeof source.sourceReference === 'number' && source.sourceReference > 0) {
                // if there is a source reference, don't touch path
            }
            else {
                if (isUri(source.path)) {
                    return uri_1.URI.parse(source.path);
                }
                else {
                    // assume path
                    if ((0, path_1.isAbsolute)(source.path)) {
                        return uri_1.URI.file(source.path);
                    }
                    else {
                        // leave relative path as is
                    }
                }
            }
        }
        return source.path;
    }
    function uriToString(source) {
        if (typeof source.path === 'object') {
            const u = uri_1.URI.revive(source.path);
            if (u) {
                if (u.scheme === network_1.Schemas.file) {
                    return u.fsPath;
                }
                else {
                    return u.toString();
                }
            }
        }
        return source.path;
    }
    function convertToDAPaths(message, toUri) {
        const fixPath = toUri ? stringToUri : uriToString;
        // since we modify Source.paths in the message in place, we need to make a copy of it (see #61129)
        const msg = (0, objects_1.deepClone)(message);
        convertPaths(msg, (toDA, source) => {
            if (toDA && source) {
                source.path = fixPath(source);
            }
        });
        return msg;
    }
    function convertToVSCPaths(message, toUri) {
        const fixPath = toUri ? stringToUri : uriToString;
        // since we modify Source.paths in the message in place, we need to make a copy of it (see #61129)
        const msg = (0, objects_1.deepClone)(message);
        convertPaths(msg, (toDA, source) => {
            if (!toDA && source) {
                source.path = fixPath(source);
            }
        });
        return msg;
    }
    function convertPaths(msg, fixSourcePath) {
        switch (msg.type) {
            case 'event': {
                const event = msg;
                switch (event.event) {
                    case 'output':
                        fixSourcePath(false, event.body.source);
                        break;
                    case 'loadedSource':
                        fixSourcePath(false, event.body.source);
                        break;
                    case 'breakpoint':
                        fixSourcePath(false, event.body.breakpoint.source);
                        break;
                    default:
                        break;
                }
                break;
            }
            case 'request': {
                const request = msg;
                switch (request.command) {
                    case 'setBreakpoints':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'breakpointLocations':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'source':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'gotoTargets':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'launchVSCode':
                        request.arguments.args.forEach((arg) => fixSourcePath(false, arg));
                        break;
                    default:
                        break;
                }
                break;
            }
            case 'response': {
                const response = msg;
                if (response.success && response.body) {
                    switch (response.command) {
                        case 'stackTrace':
                            response.body.stackFrames.forEach(frame => fixSourcePath(false, frame.source));
                            break;
                        case 'loadedSources':
                            response.body.sources.forEach(source => fixSourcePath(false, source));
                            break;
                        case 'scopes':
                            response.body.scopes.forEach(scope => fixSourcePath(false, scope.source));
                            break;
                        case 'setFunctionBreakpoints':
                            response.body.breakpoints.forEach(bp => fixSourcePath(false, bp.source));
                            break;
                        case 'setBreakpoints':
                            response.body.breakpoints.forEach(bp => fixSourcePath(false, bp.source));
                            break;
                        case 'disassemble':
                            {
                                const di = response;
                                di.body?.instructions.forEach(di => fixSourcePath(false, di.location));
                            }
                            break;
                        default:
                            break;
                    }
                }
                break;
            }
        }
    }
    function getVisibleAndSorted(array) {
        return array.filter(config => !config.presentation?.hidden).sort((first, second) => {
            if (!first.presentation) {
                if (!second.presentation) {
                    return 0;
                }
                return 1;
            }
            if (!second.presentation) {
                return -1;
            }
            if (!first.presentation.group) {
                if (!second.presentation.group) {
                    return compareOrders(first.presentation.order, second.presentation.order);
                }
                return 1;
            }
            if (!second.presentation.group) {
                return -1;
            }
            if (first.presentation.group !== second.presentation.group) {
                return first.presentation.group.localeCompare(second.presentation.group);
            }
            return compareOrders(first.presentation.order, second.presentation.order);
        });
    }
    function compareOrders(first, second) {
        if (typeof first !== 'number') {
            if (typeof second !== 'number') {
                return 0;
            }
            return 1;
        }
        if (typeof second !== 'number') {
            return -1;
        }
        return first - second;
    }
    async function saveAllBeforeDebugStart(configurationService, editorService) {
        const saveBeforeStartConfig = configurationService.getValue('debug.saveBeforeStart', { overrideIdentifier: editorService.activeTextEditorLanguageId });
        if (saveBeforeStartConfig !== 'none') {
            await editorService.saveAll();
            if (saveBeforeStartConfig === 'allEditorsInActiveGroup') {
                const activeEditor = editorService.activeEditorPane;
                if (activeEditor && activeEditor.input.resource?.scheme === network_1.Schemas.untitled) {
                    // Make sure to save the active editor in case it is in untitled file it wont be saved as part of saveAll #111850
                    await editorService.save({ editor: activeEditor.input, groupId: activeEditor.group.id });
                }
            }
        }
        await configurationService.reloadConfiguration();
    }
    const sourcesEqual = (a, b) => !a || !b ? a === b : a.name === b.name && a.path === b.path && a.sourceReference === b.sourceReference;
    exports.sourcesEqual = sourcesEqual;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdVdGlscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvY29tbW9uL2RlYnVnVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUJoRyw4QkFVQztJQU1ELHNFQVNDO0lBR0QsMENBRUM7SUFNRCxvRUFlQztJQUdELGdFQUVDO0lBRUQsc0VBeUNDO0lBRUQsZ0ZBb0NDO0lBS0Qsc0JBSUM7SUEyQ0QsNENBYUM7SUFFRCw4Q0FhQztJQStFRCxrREEwQkM7SUFpQkQsMERBYUM7SUFsV0QsTUFBTSxnQkFBZ0IsR0FBRyxZQUFZLENBQUM7SUFFdEMsU0FBZ0IsU0FBUyxDQUFDLEtBQWEsRUFBRSxVQUFtQixFQUFFLElBQTJDO1FBQ3hHLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLEtBQUssRUFBRSxLQUFLO1lBQzVELElBQUksVUFBVSxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDeEQsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxJQUFJLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDYixLQUFLLENBQUM7UUFDUixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFnQiw2QkFBNkIsQ0FBdUMsSUFBTztRQUMxRixNQUFNLE1BQU0sR0FBZSxFQUFFLENBQUM7UUFDOUIsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBeUIsRUFBRSxDQUFD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QUFRLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBRUQsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBQ0QsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNoQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQztRQUVELE9BQU8sS0FBSyxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRU0sS0FBSyxVQUFVLHVCQUF1QixDQUFDLG9CQUEyQyxFQUFFLGFBQTZCO1FBQ3ZILE1BQU0scUJBQXFCLEdBQVcsb0JBQW9CLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUFFLEVBQUUsa0JBQWtCLEVBQUUsYUFBYSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQztRQUMvSixJQUFJLHFCQUFxQixLQUFLLE1BQU0sRUFBRSxDQUFDO1lBQ3RDLE1BQU0sYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlCLElBQUkscUJBQXFCLEtBQUsseUJBQXlCLEVBQUUsQ0FBQztnQkFDekQsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixDQUFDO2dCQUNwRCxJQUFJLFlBQVksSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLEtBQUssaUJBQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDOUUsaUhBQWlIO29CQUNqSCxNQUFNLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFDRCxNQUFNLG9CQUFvQixDQUFDLG1CQUFtQixFQUFFLENBQUM7SUFDbEQsQ0FBQztJQUVNLE1BQU0sWUFBWSxHQUFHLENBQUMsQ0FBbUMsRUFBRSxDQUFtQyxFQUFXLEVBQUUsQ0FDakgsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLGVBQWUsS0FBSyxDQUFDLENBQUMsZUFBZSxDQUFDO0lBRDNGLFFBQUEsWUFBWSxnQkFDK0UifQ==