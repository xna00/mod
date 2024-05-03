/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/platform/commands/common/commands", "vs/editor/common/services/languageFeatures"], function (require, exports, arrays_1, cancellation_1, errors_1, lifecycle_1, types_1, uri_1, range_1, model_1, commands_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinksList = exports.Link = void 0;
    exports.getLinks = getLinks;
    class Link {
        constructor(link, provider) {
            this._link = link;
            this._provider = provider;
        }
        toJSON() {
            return {
                range: this.range,
                url: this.url,
                tooltip: this.tooltip
            };
        }
        get range() {
            return this._link.range;
        }
        get url() {
            return this._link.url;
        }
        get tooltip() {
            return this._link.tooltip;
        }
        async resolve(token) {
            if (this._link.url) {
                return this._link.url;
            }
            if (typeof this._provider.resolveLink === 'function') {
                return Promise.resolve(this._provider.resolveLink(this._link, token)).then(value => {
                    this._link = value || this._link;
                    if (this._link.url) {
                        // recurse
                        return this.resolve(token);
                    }
                    return Promise.reject(new Error('missing'));
                });
            }
            return Promise.reject(new Error('missing'));
        }
    }
    exports.Link = Link;
    class LinksList {
        constructor(tuples) {
            this._disposables = new lifecycle_1.DisposableStore();
            let links = [];
            for (const [list, provider] of tuples) {
                // merge all links
                const newLinks = list.links.map(link => new Link(link, provider));
                links = LinksList._union(links, newLinks);
                // register disposables
                if ((0, lifecycle_1.isDisposable)(list)) {
                    this._disposables.add(list);
                }
            }
            this.links = links;
        }
        dispose() {
            this._disposables.dispose();
            this.links.length = 0;
        }
        static _union(oldLinks, newLinks) {
            // reunite oldLinks with newLinks and remove duplicates
            const result = [];
            let oldIndex;
            let oldLen;
            let newIndex;
            let newLen;
            for (oldIndex = 0, newIndex = 0, oldLen = oldLinks.length, newLen = newLinks.length; oldIndex < oldLen && newIndex < newLen;) {
                const oldLink = oldLinks[oldIndex];
                const newLink = newLinks[newIndex];
                if (range_1.Range.areIntersectingOrTouching(oldLink.range, newLink.range)) {
                    // Remove the oldLink
                    oldIndex++;
                    continue;
                }
                const comparisonResult = range_1.Range.compareRangesUsingStarts(oldLink.range, newLink.range);
                if (comparisonResult < 0) {
                    // oldLink is before
                    result.push(oldLink);
                    oldIndex++;
                }
                else {
                    // newLink is before
                    result.push(newLink);
                    newIndex++;
                }
            }
            for (; oldIndex < oldLen; oldIndex++) {
                result.push(oldLinks[oldIndex]);
            }
            for (; newIndex < newLen; newIndex++) {
                result.push(newLinks[newIndex]);
            }
            return result;
        }
    }
    exports.LinksList = LinksList;
    function getLinks(providers, model, token) {
        const lists = [];
        // ask all providers for links in parallel
        const promises = providers.ordered(model).reverse().map((provider, i) => {
            return Promise.resolve(provider.provideLinks(model, token)).then(result => {
                if (result) {
                    lists[i] = [result, provider];
                }
            }, errors_1.onUnexpectedExternalError);
        });
        return Promise.all(promises).then(() => {
            const result = new LinksList((0, arrays_1.coalesce)(lists));
            if (!token.isCancellationRequested) {
                return result;
            }
            result.dispose();
            return new LinksList([]);
        });
    }
    commands_1.CommandsRegistry.registerCommand('_executeLinkProvider', async (accessor, ...args) => {
        let [uri, resolveCount] = args;
        (0, types_1.assertType)(uri instanceof uri_1.URI);
        if (typeof resolveCount !== 'number') {
            resolveCount = 0;
        }
        const { linkProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = accessor.get(model_1.IModelService).getModel(uri);
        if (!model) {
            return [];
        }
        const list = await getLinks(linkProvider, model, cancellation_1.CancellationToken.None);
        if (!list) {
            return [];
        }
        // resolve links
        for (let i = 0; i < Math.min(resolveCount, list.links.length); i++) {
            await list.links[i].resolve(cancellation_1.CancellationToken.None);
        }
        const result = list.links.slice(0);
        list.dispose();
        return result;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0TGlua3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2xpbmtzL2Jyb3dzZXIvZ2V0TGlua3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0loRyw0QkFxQkM7SUE3SUQsTUFBYSxJQUFJO1FBS2hCLFlBQVksSUFBVyxFQUFFLFFBQXNCO1lBQzlDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQzNCLENBQUM7UUFFRCxNQUFNO1lBQ0wsT0FBTztnQkFDTixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztnQkFDYixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87YUFDckIsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFJLEdBQUc7WUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFJLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQzNCLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQXdCO1lBQ3JDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDcEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztZQUN2QixDQUFDO1lBRUQsSUFBSSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUN0RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMs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