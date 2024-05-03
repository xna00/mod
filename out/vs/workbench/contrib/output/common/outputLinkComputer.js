/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/extpath", "vs/base/common/resources", "vs/base/common/strings", "vs/editor/common/core/range", "vs/base/common/platform", "vs/base/common/network"], function (require, exports, uri_1, extpath, resources, strings, range_1, platform_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputLinkComputer = void 0;
    exports.create = create;
    class OutputLinkComputer {
        constructor(ctx, createData) {
            this.ctx = ctx;
            this.patterns = new Map();
            this.computePatterns(createData);
        }
        computePatterns(createData) {
            // Produce patterns for each workspace root we are configured with
            // This means that we will be able to detect links for paths that
            // contain any of the workspace roots as segments.
            const workspaceFolders = createData.workspaceFolders
                .sort((resourceStrA, resourceStrB) => resourceStrB.length - resourceStrA.length) // longest paths first (for https://github.com/microsoft/vscode/issues/88121)
                .map(resourceStr => uri_1.URI.parse(resourceStr));
            for (const workspaceFolder of workspaceFolders) {
                const patterns = OutputLinkComputer.createPatterns(workspaceFolder);
                this.patterns.set(workspaceFolder, patterns);
            }
        }
        getModel(uri) {
            const models = this.ctx.getMirrorModels();
            return models.find(model => model.uri.toString() === uri);
        }
        computeLinks(uri) {
            const model = this.getModel(uri);
            if (!model) {
                return [];
            }
            const links = [];
            const lines = strings.splitLines(model.getValue());
            // For each workspace root patterns
            for (const [folderUri, folderPatterns] of this.patterns) {
                const resourceCreator = {
                    toResource: (folderRelativePath) => {
                        if (typeof folderRelativePath === 'string') {
                            return resources.joinPath(folderUri, folderRelativePath);
                        }
                        return null;
                    }
                };
                for (let i = 0, len = lines.length; i < len; i++) {
                    links.push(...OutputLinkComputer.detectLinks(lines[i], i + 1, folderPatterns, resourceCreator));
                }
            }
            return links;
        }
        static createPatterns(workspaceFolder) {
            const patterns = [];
            const workspaceFolderPath = workspaceFolder.scheme === network_1.Schemas.file ? workspaceFolder.fsPath : workspaceFolder.path;
            const workspaceFolderVariants = [workspaceFolderPath];
            if (platform_1.isWindows && workspaceFolder.scheme === network_1.Schemas.file) {
                workspaceFolderVariants.push(extpath.toSlashes(workspaceFolderPath));
            }
            for (const workspaceFolderVariant of workspaceFolderVariants) {
                const validPathCharacterPattern = '[^\\s\\(\\):<>\'"]';
                const validPathCharacterOrSpacePattern = `(?:${validPathCharacterPattern}| ${validPathCharacterPattern})`;
                const pathPattern = `${validPathCharacterOrSpacePattern}+\\.${validPathCharacterPattern}+`;
                const strictPathPattern = `${validPathCharacterPattern}+`;
                // Example: /workspaces/express/server.js on line 8, column 13
                patterns.push(new RegExp(strings.escapeRegExpCharacters(workspaceFolderVariant) + `(${pathPattern}) on line ((\\d+)(, column (\\d+))?)`, 'gi'));
                // Example: /workspaces/express/server.js:line 8, column 13
                patterns.push(new RegExp(strings.escapeRegExpCharacters(workspaceFolderVariant) + `(${pathPattern}):line ((\\d+)(, column (\\d+))?)`, 'gi'));
                // Example: /workspaces/mankala/Features.ts(45): error
                // Example: /workspaces/mankala/Features.ts (45): error
                // Example: /workspaces/mankala/Features.ts(45,18): error
                // Example: /workspaces/mankala/Features.ts (45,18): error
                // Example: /workspaces/mankala/Features Special.ts (45,18): error
                patterns.push(new RegExp(strings.escapeRegExpCharacters(workspaceFolderVariant) + `(${pathPattern})(\\s?\\((\\d+)(,(\\d+))?)\\)`, 'gi'));
                // Example: at /workspaces/mankala/Game.ts
                // Example: at /workspaces/mankala/Game.ts:336
                // Example: at /workspaces/mankala/Game.ts:336:9
                patterns.push(new RegExp(strings.escapeRegExpCharacters(workspaceFolderVariant) + `(${strictPathPattern})(:(\\d+))?(:(\\d+))?`, 'gi'));
            }
            return patterns;
        }
        /**
         * Detect links. Made static to allow for tests.
         */
        static detectLinks(line, lineIndex, patterns, resourceCreator) {
            const links = [];
            patterns.forEach(pattern => {
                pattern.lastIndex = 0; // the holy grail of software development
                let match;
                let offset = 0;
                while ((match = pattern.exec(line)) !== null) {
                    // Convert the relative path information to a resource that we can use in links
                    const folderRelativePath = strings.rtrim(match[1], '.').replace(/\\/g, '/'); // remove trailing "." that likely indicate end of sentence
                    let resourceString;
                    try {
                        const resource = resourceCreator.toResource(folderRelativePath);
                        if (resource) {
                            resourceString = resource.toString();
                        }
                    }
                    catch (error) {
                        continue; // we might find an invalid URI and then we dont want to loose all other links
                    }
                    // Append line/col information to URI if matching
                    if (match[3]) {
                        const lineNumber = match[3];
                        if (match[5]) {
                            const columnNumber = match[5];
                            resourceString = strings.format('{0}#{1},{2}', resourceString, lineNumber, columnNumber);
                        }
                        else {
                            resourceString = strings.format('{0}#{1}', resourceString, lineNumber);
                        }
                    }
                    const fullMatch = strings.rtrim(match[0], '.'); // remove trailing "." that likely indicate end of sentence
                    const index = line.indexOf(fullMatch, offset);
                    offset = index + fullMatch.length;
                    const linkRange = {
                        startColumn: index + 1,
                        startLineNumber: lineIndex,
                        endColumn: index + 1 + fullMatch.length,
                        endLineNumber: lineIndex
                    };
                    if (links.some(link => range_1.Range.areIntersectingOrTouching(link.range, linkRange))) {
                        return; // Do not detect duplicate links
                    }
                    links.push({
                        range: linkRange,
                        url: resourceString
                    });
                }
            });
            return links;
        }
    }
    exports.OutputLinkComputer = OutputLinkComputer;
    // Export this function because this will be called by the web worker for computing links
    function create(ctx, createData) {
        return new OutputLinkComputer(ctx, createData);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0TGlua0NvbXB1dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9vdXRwdXQvY29tbW9uL291dHB1dExpbmtDb21wdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtTGhHLHdCQUVDO0lBaktELE1BQWEsa0JBQWtCO1FBRzlCLFlBQW9CLEdBQW1CLEVBQUUsVUFBdUI7WUFBNUMsUUFBRyxHQUFILEdBQUcsQ0FBZ0I7WUFGL0IsYUFBUSxHQUFHLElBQUksR0FBRyxFQUFrQyxDQUFDO1lBRzVELElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVPLGVBQWUsQ0FBQyxVQUF1QjtZQUU5QyxrRUFBa0U7WUFDbEUsaUVBQWlFO1lBQ2pFLGtEQUFrRDtZQUNsRCxNQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxnQkFBZ0I7aUJBQ2xELElBQUksQ0FBQyxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLDZFQUE2RTtpQkFDN0osR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBRTdDLEtBQUssTUFBTSxlQUFlLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxRQUFRLEdBQUcsa0JBQWtCLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNwRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDOUMsQ0FBQztRQUNGLENBQUM7UUFFTyxRQUFRLENBQUMsR0FBVztZQUMzQixNQUFN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