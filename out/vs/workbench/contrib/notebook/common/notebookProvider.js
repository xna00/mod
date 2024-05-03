/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/path", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, glob, path_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookProviderInfo = void 0;
    class NotebookProviderInfo {
        get selectors() {
            return this._selectors;
        }
        get options() {
            return this._options;
        }
        constructor(descriptor) {
            this.extension = descriptor.extension;
            this.id = descriptor.id;
            this.displayName = descriptor.displayName;
            this._selectors = descriptor.selectors?.map(selector => ({
                include: selector.filenamePattern,
                exclude: selector.excludeFileNamePattern || ''
            })) || [];
            this.priority = descriptor.priority;
            this.providerDisplayName = descriptor.providerDisplayName;
            this.exclusive = descriptor.exclusive;
            this._options = {
                transientCellMetadata: {},
                transientDocumentMetadata: {},
                transientOutputs: false,
                cellContentMetadata: {}
            };
        }
        update(args) {
            if (args.selectors) {
                this._selectors = args.selectors;
            }
            if (args.options) {
                this._options = args.options;
            }
        }
        matches(resource) {
            return this.selectors?.some(selector => NotebookProviderInfo.selectorMatches(selector, resource));
        }
        static selectorMatches(selector, resource) {
            if (typeof selector === 'string') {
                // filenamePattern
                if (glob.match(selector.toLowerCase(), (0, path_1.basename)(resource.fsPath).toLowerCase())) {
                    return true;
                }
            }
            if (glob.isRelativePattern(selector)) {
                if (glob.match(selector, (0, path_1.basename)(resource.fsPath).toLowerCase())) {
                    return true;
                }
            }
            if (!(0, notebookCommon_1.isDocumentExcludePattern)(selector)) {
                return false;
            }
            const filenamePattern = selector.include;
            const excludeFilenamePattern = selector.exclude;
            if (glob.match(filenamePattern, (0, path_1.basename)(resource.fsPath).toLowerCase())) {
                if (excludeFilenamePattern) {
                    if (glob.match(excludeFilenamePattern, (0, path_1.basename)(resource.fsPath).toLowerCase())) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        static possibleFileEnding(selectors) {
            for (const selector of selectors) {
                const ending = NotebookProviderInfo._possibleFileEnding(selector);
                if (ending) {
                    return ending;
                }
            }
            return undefined;
        }
        static _possibleFileEnding(selector) {
            const pattern = /^.*(\.[a-zA-Z0-9_-]+)$/;
            let candidate;
            if (typeof selector === 'string') {
                candidate = selector;
            }
            else if (glob.isRelativePattern(selector)) {
                candidate = selector.pattern;
            }
            else if (selector.include) {
                return NotebookProviderInfo._possibleFileEnding(selector.include);
            }
            if (candidate) {
                const match = pattern.exec(candidate);
                if (match) {
                    return match[1];
                }
            }
            return undefined;
        }
    }
    exports.NotebookProviderInfo = NotebookProviderInfo;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svY29tbW9uL25vdGVib29rUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyxNQUFhLG9CQUFvQjtRQVVoQyxJQUFJLFNBQVM7WUFDWixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsWUFBWSxVQUFvQztZQUMvQyxJQUFJLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFDdEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztZQUMxQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDeEQsT0FBTyxFQUFFLFFBQVEsQ0FBQyxlQUFlO2dCQUNqQyxPQUFPLEVBQUUsUUFBUSxDQUFDLHNCQUFzQixJQUFJLEVBQUU7YUFDOUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsSUFBSSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxVQUFVLENBQUMsbUJBQW1CLENBQUM7WUFDMUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxRQUFRLEdBQUc7Z0JBQ2YscUJBQXFCLEVBQUUsRUFBRTtnQkFDekIseUJB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