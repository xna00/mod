/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/event", "vs/base/common/arrays"], function (require, exports, lifecycle_1, dom_1, scrollableElement_1, event_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GettingStartedIndexList = void 0;
    class GettingStartedIndexList extends lifecycle_1.Disposable {
        constructor(options) {
            super();
            this.options = options;
            this._onDidChangeEntries = new event_1.Emitter();
            this.onDidChangeEntries = this._onDidChangeEntries.event;
            this.isDisposed = false;
            this.contextKeysToWatch = new Set();
            this.contextService = options.contextService;
            this.entries = undefined;
            this.itemCount = 0;
            this.list = (0, dom_1.$)('ul');
            this.scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.list, {}));
            this._register(this.onDidChangeEntries(() => this.scrollbar.scanDomNode()));
            this.domElement = (0, dom_1.$)('.index-list.' + options.klass, {}, (0, dom_1.$)('h2', {}, options.title), this.scrollbar.getDomNode());
            this._register(this.contextService.onDidChangeContext(e => {
                if (e.affectsSome(this.contextKeysToWatch)) {
                    this.rerender();
                }
            }));
        }
        getDomElement() {
            return this.domElement;
        }
        layout(size) {
            this.scrollbar.scanDomNode();
        }
        onDidChange(listener) {
            this._register(this.onDidChangeEntries(listener));
        }
        register(d) { if (this.isDisposed) {
            d.dispose();
        }
        else {
            this._register(d);
        } }
        dispose() {
            this.isDisposed = true;
            super.dispose();
        }
        setLimit(limit) {
            this.options.limit = limit;
            this.setEntries(this.entries);
        }
        rerender() {
            this.setEntries(this.entries);
        }
        setEntries(entries) {
            let entryList = entries ?? [];
            this.itemCount = 0;
            const ranker = this.options.rankElement;
            if (ranker) {
                entryList = entryList.filter(e => ranker(e) !== null);
                entryList.sort((a, b) => ranker(b) - ranker(a));
            }
            const activeEntries = entryList.filter(e => !e.when || this.contextService.contextMatchesRules(e.when));
            const limitedEntries = activeEntries.slice(0, this.options.limit);
            const toRender = limitedEntries.map(e => e.id);
            if (this.entries === entries && (0, arrays_1.equals)(toRender, this.lastRendered)) {
                return;
            }
            this.entries = entries;
            this.contextKeysToWatch.clear();
            entryList.forEach(e => {
                const keys = e.when?.keys();
                keys?.forEach(key => this.contextKeysToWatch.add(key));
            });
            this.lastRendered = toRender;
            this.itemCount = limitedEntries.length;
            while (this.list.firstChild) {
                this.list.removeChild(this.list.firstChild);
            }
            this.itemCount = limitedEntries.length;
            for (const entry of limitedEntries) {
                const rendered = this.options.renderElement(entry);
                this.list.appendChild(rendered);
            }
            if (activeEntries.length > limitedEntries.length && this.options.more) {
                this.list.appendChild(this.options.more);
            }
            else if (entries !== undefined && this.itemCount === 0 && this.options.empty) {
                this.list.appendChild(this.options.empty);
            }
            else if (this.options.footer) {
                this.list.appendChild(this.options.footer);
            }
            this._onDidChangeEntries.fire();
        }
    }
    exports.GettingStartedIndexList = GettingStartedIndexList;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWRMaXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lR2V0dGluZ1N0YXJ0ZWQvYnJvd3Nlci9nZXR0aW5nU3RhcnRlZExpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyxNQUFhLHVCQUErRSxTQUFRLHNCQUFVO1FBbUI3RyxZQUNTLE9BQTBDO1lBRWxELEtBQUssRUFBRSxDQUFDO1lBRkEsWUFBTyxHQUFQLE9BQU8sQ0FBbUM7WUFuQmxDLHdCQUFtQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDMUMsdUJBQWtCLEdBQWdCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFZMUUsZUFBVSxHQUFHLEtBQUssQ0FBQztZQUduQix1QkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBTzlDLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQztZQUU3QyxJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQztZQUV6QixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUEsT0FBQyxFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdDQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxJQUFJLENBQUMsVUFBVSxH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RSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFDLENBQUM7aUJBQ0ksSUFBSSxPQUFPLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzlFLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0MsQ0FBQztpQkFDSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUVELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNqQyxDQUFDO0tBQ0Q7SUExSEQsMERBMEhDIn0=