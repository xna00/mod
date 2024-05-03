/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom"], function (require, exports, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RowCache = void 0;
    function removeFromParent(element) {
        try {
            element.parentElement?.removeChild(element);
        }
        catch (e) {
            // this will throw if this happens due to a blur event, nasty business
        }
    }
    class RowCache {
        constructor(renderers) {
            this.renderers = renderers;
            this.cache = new Map();
            this.transactionNodesPendingRemoval = new Set();
            this.inTransaction = false;
        }
        /**
         * Returns a row either by creating a new one or reusing
         * a previously released row which shares the same templateId.
         *
         * @returns A row and `isReusingConnectedDomNode` if the row's node is already in the dom in a stale position.
         */
        alloc(templateId) {
            let result = this.getTemplateCache(templateId).pop();
            let isStale = false;
            if (result) {
                isStale = this.transactionNodesPendingRemoval.has(result.domNode);
                if (isStale) {
                    this.transactionNodesPendingRemoval.delete(result.domNode);
                }
            }
            else {
                const domNode = (0, dom_1.$)('.monaco-list-row');
                const renderer = this.getRenderer(templateId);
                const templateData = renderer.renderTemplate(domNode);
                result = { domNode, templateId, templateData };
            }
            return { row: result, isReusingConnectedDomNode: isStale };
        }
        /**
         * Releases the row for eventual reuse.
         */
        release(row) {
            if (!row) {
                return;
            }
            this.releaseRow(row);
        }
        /**
         * Begin a set of changes that use the cache. This lets us skip work when a row is removed and then inserted again.
         */
        transact(makeChanges) {
            if (this.inTransaction) {
                throw new Error('Already in transaction');
            }
            this.inTransaction = true;
            try {
                makeChanges();
            }
            finally {
                for (const domNode of this.transactionNodesPendingRemoval) {
                    this.doRemoveNode(domNode);
                }
                this.transactionNodesPendingRemoval.clear();
                this.inTransaction = false;
            }
        }
        releaseRow(row) {
            const { domNode, templateId } = row;
            if (domNode) {
                if (this.inTransaction) {
                    this.transactionNodesPendingRemoval.add(domNode);
                }
                else {
                    this.doRemoveNode(domNode);
                }
            }
            const cache = this.getTemplateCache(templateId);
            cache.push(row);
        }
        doRemoveNode(domNode) {
            domNode.classList.remove('scrolling');
            removeFromParent(domNode);
        }
        getTemplateCache(templateId) {
            let result = this.cache.get(templateId);
            if (!result) {
                result = [];
                this.cache.set(templateId, result);
            }
            return result;
        }
        dispose() {
            this.cache.forEach((cachedRows, templateId) => {
                for (const cachedRow of cachedRows) {
                    const renderer = this.getRenderer(templateId);
                    renderer.disposeTemplate(cachedRow.templateData);
                    cachedRow.templateData = null;
                }
            });
            this.cache.clear();
            this.transactionNodesPendingRemoval.clear();
        }
        getRenderer(templateId) {
            const renderer = this.renderers.get(templateId);
            if (!renderer) {
                throw new Error(`No renderer found for ${templateId}`);
            }
            return renderer;
        }
    }
    exports.RowCache = RowCache;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93Q2FjaGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9saXN0L3Jvd0NhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxTQUFTLGdCQUFnQixDQUFDLE9BQW9CO1FBQzdDLElBQUksQ0FBQztZQUNKLE9BQU8sQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1osc0VBQXNFO1FBQ3ZFLENBQUM7SUFDRixDQUFDO0lBRUQsTUFBYSxRQUFRO1FBT3BCLFlBQW9CLFNBQTZDO1lBQTdDLGNBQVMsR0FBVCxTQUFTLENBQW9DO1lBTHpELFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQUV6QixtQ0FBOEIsR0FBRyxJQUFJLEdBQUcsRUFBZSxDQUFDO1lBQ2pFLGtCQUFhLEdBQUcsS0FBSyxDQUFDO1FBRXVDLENBQUM7UUFFdEU7Ozs7O1dBS0c7UUFDSCxLQUFLLENBQUMsVUFBa0I7WUFDdkIsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRXJELElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE9BQU8sR0FBRyxJQUFJLENBQUMsOEJBQThCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbEUsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDYixJQUFJLENBQUMsOEJBQThCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFD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