/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/uri", "vs/nls", "vs/workbench/contrib/comments/common/commentModel", "vs/base/common/lifecycle"], function (require, exports, arrays_1, uri_1, nls_1, commentModel_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsModel = void 0;
    class CommentsModel extends lifecycle_1.Disposable {
        get resourceCommentThreads() { return this._resourceCommentThreads; }
        constructor() {
            super();
            this._resourceCommentThreads = [];
            this.commentThreadsMap = new Map();
        }
        updateResourceCommentThreads() {
            const includeLabel = this.commentThreadsMap.size > 1;
            this._resourceCommentThreads = [...this.commentThreadsMap.values()].map(value => {
                return value.resourceWithCommentThreads.map(resource => {
                    resource.ownerLabel = includeLabel ? value.ownerLabel : undefined;
                    return resource;
                }).flat();
            }).flat();
            this._resourceCommentThreads.sort((a, b) => {
                return a.resource.toString() > b.resource.toString() ? 1 : -1;
            });
        }
        setCommentThreads(uniqueOwner, owner, ownerLabel, commentThreads) {
            this.commentThreadsMap.set(uniqueOwner, { ownerLabel, resourceWithCommentThreads: this.groupByResource(uniqueOwner, owner, commentThreads) });
            this.updateResourceCommentThreads();
        }
        deleteCommentsByOwner(uniqueOwner) {
            if (uniqueOwner) {
                const existingOwner = this.commentThreadsMap.get(uniqueOwner);
                this.commentThreadsMap.set(uniqueOwner, { ownerLabel: existingOwner?.ownerLabel, resourceWithCommentThreads: [] });
            }
            else {
                this.commentThreadsMap.clear();
            }
            this.updateResourceCommentThreads();
        }
        updateCommentThreads(event) {
            const { uniqueOwner, owner, ownerLabel, removed, changed, added } = event;
            const threadsForOwner = this.commentThreadsMap.get(uniqueOwner)?.resourceWithCommentThreads || [];
            removed.forEach(thread => {
                // Find resource that has the comment thread
                const matchingResourceIndex = threadsForOwner.findIndex((resourceData) => resourceData.id === thread.resource);
                const matchingResourceData = matchingResourceIndex >= 0 ? threadsForOwner[matchingResourceIndex] : undefined;
                // Find comment node on resource that is that thread and remove it
                const index = matchingResourceData?.commentThreads.findIndex((commentThread) => commentThread.threadId === thread.threadId) ?? 0;
                if (index >= 0) {
                    matchingResourceData?.commentThreads.splice(index, 1);
                }
                // If the comment thread was the last thread for a resource, remove that resource from the list
                if (matchingResourceData?.commentThreads.length === 0) {
                    threadsForOwner.splice(matchingResourceIndex, 1);
                }
            });
            changed.forEach(thread => {
                // Find resource that has the comment thread
                const matchingResourceIndex = threadsForOwner.findIndex((resourceData) => resourceData.id === thread.resource);
                const matchingResourceData = matchingResourceIndex >= 0 ? threadsForOwner[matchingResourceIndex] : undefined;
                if (!matchingResourceData) {
                    return;
                }
                // Find comment node on resource that is that thread and replace it
                const index = matchingResourceData.commentThreads.findIndex((commentThread) => commentThread.threadId === thread.threadId);
                if (index >= 0) {
                    matchingResourceData.commentThreads[index] = commentModel_1.ResourceWithCommentThreads.createCommentNode(uniqueOwner, owner, uri_1.URI.parse(matchingResourceData.id), thread);
                }
                else if (thread.comments && thread.comments.length) {
                    matchingResourceData.commentThreads.push(commentModel_1.ResourceWithCommentThreads.createCommentNode(uniqueOwner, owner, uri_1.URI.parse(matchingResourceData.id), thread));
                }
            });
            added.forEach(thread => {
                const existingResource = threadsForOwner.filter(resourceWithThreads => resourceWithThreads.resource.toString() === thread.resource);
                if (existingResource.length) {
                    const resource = existingResource[0];
                    if (thread.comments && thread.comments.length) {
                        resource.commentThreads.push(commentModel_1.ResourceWithCommentThreads.createCommentNode(uniqueOwner, owner, resource.resource, thread));
                    }
                }
                else {
                    threadsForOwner.push(new commentModel_1.ResourceWithCommentThreads(uniqueOwner, owner, uri_1.URI.parse(thread.resource), [thread]));
                }
            });
            this.commentThreadsMap.set(uniqueOwner, { ownerLabel, resourceWithCommentThreads: threadsForOwner });
            this.updateResourceCommentThreads();
            return removed.length > 0 || changed.length > 0 || added.length > 0;
        }
        hasCommentThreads() {
            return !!this._resourceCommentThreads.length;
        }
        getMessage() {
            if (!this._resourceCommentThreads.length) {
                return (0, nls_1.localize)('noComments', "There are no comments in this workspace yet.");
            }
            else {
                return '';
            }
        }
        groupByResource(uniqueOwner, owner, commentThreads) {
            const resourceCommentThreads = [];
            const commentThreadsByResource = new Map();
            for (const group of (0, arrays_1.groupBy)(commentThreads, CommentsModel._compareURIs)) {
                commentThreadsByResource.set(group[0].resource, new commentModel_1.ResourceWithCommentThreads(uniqueOwner, owner, uri_1.URI.parse(group[0].resource), group));
            }
            commentThreadsByResource.forEach((v, i, m) => {
                resourceCommentThreads.push(v);
            });
            return resourceCommentThreads;
        }
        static _compareURIs(a, b) {
            const resourceA = a.resource.toString();
            const resourceB = b.resource.toString();
            if (resourceA < resourceB) {
                return -1;
            }
            else if (resourceA > resourceB) {
                return 1;
            }
            else {
                return 0;
            }
        }
    }
    exports.CommentsModel = CommentsModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9jb21tZW50c01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdCaEcsTUFBYSxhQUFjLFNBQVEsc0JBQVU7UUFHNUMsSUFBSSxzQkFBc0IsS0FBbUMsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO1FBR25HO1lBRUMsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsdUJBQXVCLEdBQUcsRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBNEYsQ0FBQztRQUM5SCxDQUFDO1FBRU8sNEJBQTRCO1lBQ25DLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMvRSxPQUFPLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ3RELFFBQVEsQ0FBQyxVQUFVLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7b0JBQ2xFLE9BQU8sUUFBUSxDQUFDO2dCQUNqQixDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNYLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMs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