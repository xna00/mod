/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/map", "vs/base/common/objects", "vs/base/common/observable", "vs/base/common/prefixTree", "vs/base/common/uri"], function (require, exports, cancellation_1, map_1, objects_1, observable_1, prefixTree_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileCoverage = exports.ComputedFileCoverage = exports.AbstractFileCoverage = exports.getTotalCoveragePercent = exports.TestCoverage = void 0;
    let incId = 0;
    /**
     * Class that exposese coverage information for a run.
     */
    class TestCoverage {
        constructor(fromTaskId, uriIdentityService, accessor) {
            this.fromTaskId = fromTaskId;
            this.uriIdentityService = uriIdentityService;
            this.accessor = accessor;
            this.fileCoverage = new map_1.ResourceMap();
            this.didAddCoverage = (0, observable_1.observableSignal)(this);
            this.tree = new prefixTree_1.WellDefinedPrefixTree();
            this.associatedData = new Map();
        }
        append(rawCoverage, tx) {
            const coverage = new FileCoverage(rawCoverage, this.accessor);
            const previous = this.getComputedForUri(coverage.uri);
            const applyDelta = (kind, node) => {
                if (!node[kind]) {
                    if (coverage[kind]) {
                        node[kind] = { ...coverage[kind] };
                    }
                }
                else {
                    node[kind].covered += (coverage[kind]?.covered || 0) - (previous?.[kind]?.covered || 0);
                    node[kind].total += (coverage[kind]?.total || 0) - (previous?.[kind]?.total || 0);
                }
            };
            // We insert using the non-canonical path to normalize for casing differences
            // between URIs, but when inserting an intermediate node always use 'a' canonical
            // version.
            const canonical = [...this.treePathForUri(coverage.uri, /* canonical = */ true)];
            const chain = [];
            this.tree.insert(this.treePathForUri(coverage.uri, /* canonical = */ false), coverage, node => {
                chain.push(node);
                if (chain.length === canonical.length) {
                    node.value = coverage;
                }
                else if (!node.value) {
                    // clone because later intersertions can modify the counts:
                    const intermediate = (0, objects_1.deepClone)(rawCoverage);
                    intermediate.id = String(incId++);
                    intermediate.uri = this.treePathToUri(canonical.slice(0, chain.length));
                    node.value = new ComputedFileCoverage(intermediate);
                }
                else {
                    applyDelta('statement', node.value);
                    applyDelta('branch', node.value);
                    applyDelta('declaration', node.value);
                    node.value.didChange.trigger(tx);
                }
            });
            this.fileCoverage.set(coverage.uri, coverage);
            if (chain) {
                this.didAddCoverage.trigger(tx, chain);
            }
        }
        /**
         * Gets coverage information for all files.
         */
        getAllFiles() {
            return this.fileCoverage;
        }
        /**
         * Gets coverage information for a specific file.
         */
        getUri(uri) {
            return this.fileCoverage.get(uri);
        }
        /**
         * Gets computed information for a file, including DFS-computed information
         * from child tests.
         */
        getComputedForUri(uri) {
            return this.tree.find(this.treePathForUri(uri, /* canonical = */ false));
        }
        *treePathForUri(uri, canconicalPath) {
            yield uri.scheme;
            yield uri.authority;
            const path = !canconicalPath && this.uriIdentityService.extUri.ignorePathCasing(uri) ? uri.path.toLowerCase() : uri.path;
            yield* path.split('/');
        }
        treePathToUri(path) {
            return uri_1.URI.from({ scheme: path[0], authority: path[1], path: path.slice(2).join('/') });
        }
    }
    exports.TestCoverage = TestCoverage;
    const getTotalCoveragePercent = (statement, branch, function_) => {
        let numerator = statement.covered;
        let denominator = statement.total;
        if (branch) {
            numerator += branch.covered;
            denominator += branch.total;
        }
        if (function_) {
            numerator += function_.covered;
            denominator += function_.total;
        }
        return denominator === 0 ? 1 : numerator / denominator;
    };
    exports.getTotalCoveragePercent = getTotalCoveragePercent;
    class AbstractFileCoverage {
        /**
         * Gets the total coverage percent based on information provided.
         * This is based on the Clover total coverage formula
         */
        get tpc() {
            return (0, exports.getTotalCoveragePercent)(this.statement, this.branch, this.declaration);
        }
        constructor(coverage) {
            this.didChange = (0, observable_1.observableSignal)(this);
            this.id = coverage.id;
            this.uri = coverage.uri;
            this.statement = coverage.statement;
            this.branch = coverage.branch;
            this.declaration = coverage.declaration;
        }
    }
    exports.AbstractFileCoverage = AbstractFileCoverage;
    /**
     * File coverage info computed from children in the tree, not provided by the
     * extension.
     */
    class ComputedFileCoverage extends AbstractFileCoverage {
    }
    exports.ComputedFileCoverage = ComputedFileCoverage;
    class FileCoverage extends AbstractFileCoverage {
        /** Gets whether details are synchronously available */
        get hasSynchronousDetails() {
            return this._details instanceof Array || this.resolved;
        }
        constructor(coverage, accessor) {
            super(coverage);
            this.accessor = accessor;
        }
        /**
         * Gets per-line coverage details.
         */
        async details(token = cancellation_1.CancellationToken.None) {
            this._details ??= this.accessor.getCoverageDetails(this.id, token);
            try {
                const d = await this._details;
                this.resolved = true;
                return d;
            }
            catch (e) {
                this._details = undefined;
                throw e;
            }
        }
    }
    exports.FileCoverage = FileCoverage;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvdmVyYWdlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi90ZXN0Q292ZXJhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztJQUVkOztPQUVHO0lBQ0gsTUFBYSxZQUFZO1FBT3hCLFlBQ2lCLFVBQWtCLEVBQ2pCLGtCQUF1QyxFQUN2QyxRQUEyQjtZQUY1QixlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ2pCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdkMsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFUNUIsaUJBQVksR0FBRyxJQUFJLGlCQUFXLEVBQWdCLENBQUM7WUFDaEQsbUJBQWMsR0FBRyxJQUFBLDZCQUFnQixFQUEwQyxJQUFJLENBQUMsQ0FBQztZQUNqRixTQUFJLEdBQUcsSUFBSSxrQ0FBcUIsRUFBd0IsQ0FBQztZQUV6RCxtQkFBYyxHQUFHLElBQUksR0FBRyxFQUFvQixDQUFDO1FBTXpELENBQUM7UUFFRSxNQUFNLENBQUMsV0FBMEIsRUFBRSxFQUE0QjtZQUNyRSxNQUFNLFFBQVEsR0FBRyxJQUFJLFlBQVksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUE0QyxFQUFFLElBQTBCLEVBQUUsRUFBRTtnQkFDL0YsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNqQixJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO3dCQUNwQixJ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