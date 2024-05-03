/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/contrib/testing/common/mainThreadTestCollection", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testItemCollection"], function (require, exports, uri_1, mainThreadTestCollection_1, testId_1, testItemCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testStubs = exports.getInitializedMainTestCollection = exports.TestTestCollection = exports.TestTestItem = void 0;
    class TestTestItem {
        get tags() {
            return this.props.tags.map(id => ({ id }));
        }
        set tags(value) {
            this.api.listener?.({ op: 1 /* TestItemEventOp.SetTags */, new: value, old: this.props.tags.map(t => ({ id: t })) });
            this.props.tags = value.map(tag => tag.id);
        }
        get canResolveChildren() {
            return this._canResolveChildren;
        }
        set canResolveChildren(value) {
            this._canResolveChildren = value;
            this.api.listener?.({ op: 2 /* TestItemEventOp.UpdateCanResolveChildren */, state: value });
        }
        get parent() {
            return this.api.parent;
        }
        get id() {
            return this._extId.localId;
        }
        constructor(_extId, label, uri) {
            this._extId = _extId;
            this._canResolveChildren = false;
            this.api = { controllerId: this._extId.controllerId };
            this.children = (0, testItemCollection_1.createTestItemChildren)(this.api, i => i.api, TestTestItem);
            this.props = {
                extId: _extId.toString(),
                busy: false,
                description: null,
                error: null,
                label,
                range: null,
                sortText: null,
                tags: [],
                uri,
            };
        }
        get(key) {
            return this.props[key];
        }
        set(key, value) {
            this.props[key] = value;
            this.api.listener?.({ op: 4 /* TestItemEventOp.SetProp */, update: { [key]: value } });
        }
        toTestItem() {
            const props = { ...this.props };
            props.extId = this._extId.toString();
            return props;
        }
    }
    exports.TestTestItem = TestTestItem;
    class TestTestCollection extends testItemCollection_1.TestItemCollection {
        constructor(controllerId = 'ctrlId') {
            const root = new TestTestItem(new testId_1.TestId([controllerId]), 'root');
            root._isRoot = true;
            super({
                controllerId,
                getApiFor: t => t.api,
                toITestItem: t => t.toTestItem(),
                getChildren: t => t.children,
                getDocumentVersion: () => undefined,
                root,
            });
        }
        get currentDiff() {
            return this.diff;
        }
        setDiff(diff) {
            this.diff = diff;
        }
    }
    exports.TestTestCollection = TestTestCollection;
    /**
     * Gets a main thread test collection initialized with the given set of
     * roots/stubs.
     */
    const getInitializedMainTestCollection = async (singleUse = exports.testStubs.nested()) => {
        const c = new mainThreadTestCollection_1.MainThreadTestCollection({ asCanonicalUri: u => u }, async (t, l) => singleUse.expand(t, l));
        await singleUse.expand(singleUse.root.id, Infinity);
        c.apply(singleUse.collectDiff());
        singleUse.dispose();
        return c;
    };
    exports.getInitializedMainTestCollection = getInitializedMainTestCollection;
    exports.testStubs = {
        nested: (idPrefix = 'id-') => {
            const collection = new TestTestCollection();
            collection.resolveHandler = item => {
                if (item === undefined) {
                    const a = new TestTestItem(new testId_1.TestId(['ctrlId', 'id-a']), 'a', uri_1.URI.file('/'));
                    a.canResolveChildren = true;
                    const b = new TestTestItem(new testId_1.TestId(['ctrlId', 'id-b']), 'b', uri_1.URI.file('/'));
                    collection.root.children.add(a);
                    collection.root.children.add(b);
                }
                else if (item.id === idPrefix + 'a') {
                    item.children.add(new TestTestItem(new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']), 'aa', uri_1.URI.file('/')));
                    item.children.add(new TestTestItem(new testId_1.TestId(['ctrlId', 'id-a', 'id-ab']), 'ab', uri_1.URI.file('/')));
                }
            };
            return collection;
        },
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFN0dWJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL3Rlc3QvY29tbW9uL3Rlc3RTdHVicy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSxZQUFZO1FBSXhCLElBQVcsSUFBSTtZQUNkLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsSUFBVyxJQUFJLENBQUMsS0FBSztZQUNwQixJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxpQ0FBeUIsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDN0csSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsSUFBVyxrQkFBa0I7WUFDNUIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDakMsQ0FBQztRQUVELElBQVcsa0JBQWtCLENBQUMsS0FBYztZQUMzQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLGtEQUEwQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFFRCxJQUFXLE1BQU07WUFDaEIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUN4QixDQUFDO1FBRUQsSUFBVyxFQUFFO1lBQ1osT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUM1QixDQUFDO1FBTUQsWUFDa0IsTUFBYyxFQUMvQixLQUFhLEVBQ2IsR0FBUztZQUZRLFdBQU0sR0FBTixNQUFNLENBQVE7WUFqQ3hCLHdCQUFtQixHQUFHLEtBQUssQ0FBQztZQTRCN0IsUUFBRyxHQUErQixFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBRTdFLGFBQVEsR0FBRyxJQUFBLDJDQUFzQixFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBTzVFLElBQUksQ0FBQyxLQUFLLEdBQUc7Z0JBQ1osS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7Z0JBQ3hCLElBQUksRUFBRSxLQUFLO2dCQUNYLFdBQVcsRUFBRSxJQUFJO2dCQUNqQixLQUFLLEVBQUUsSUFBSTtnQkFDWCxLQUFLO2dCQUNMLEtBQUssRUFBRSxJQUFJO2dCQUNYLFFBQVEsRUFBRSxJQUFJO2dCQUNkLElBQUksRUFBRSxFQUFFO2dCQUNSLEdBQUc7YUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUVNLEdBQUcsQ0FBNEIsR0FBTTtZQUMzQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUVNLEdBQUcsQ0FBNEIsR0FBTSxFQUFFLEtBQW1CO1lBQ2hFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLGlDQUF5QixFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFTSxVQUFVO1lBQ2hCLE1BQU0sS0FBSyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDaEMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztLQUNEO0lBbEVELG9DQWtFQztJQUVELE1BQWEsa0JBQW1CLFNBQVEsdUNBQWdDO1FBQ3ZFLFlBQVksWUFBWSxHQUFHLFFBQVE7WUFDbEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxlQUFNLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2pFLElBQVksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBRTdCLEtBQUssQ0FBQztnQkFDTCxZQUFZO2dCQUNaLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHO2dCQUNyQixXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFO2dCQUNoQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUTtnQkFDNUIsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztnQkFDbkMsSUFBSTthQUNKLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxJQUFXLFdBQVc7WUFDckIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2xCLENBQUM7UUFFTSxPQUFPLENBQUMsSUFBZTtZQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUF0QkQsZ0RBc0JDO0lBRUQ7OztPQUdHO0lBQ0ksTUFBTSxnQ0FBZ0MsR0FBRyxLQUFLLEVBQUUsU0FBUyxHQUFHLGlCQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRTtRQUN4RixNQUFNLENBQUMsR0FBRyxJQUFJLG1EQUF3QixDQUFDLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0csTUFBTSxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDakMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQyxDQUFDO0lBTlcsUUFBQSxnQ0FBZ0Msb0NBTTNDO0lBRVcsUUFBQSxTQUFTLEdBQUc7UUFDeEIsTUFBTSxFQUFFLENBQUMsUUFBUSxHQUFHLEtBQUssRUFBRSxFQUFFO1lBQzVCLE1BQU0sVUFBVSxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztZQUM1QyxVQUFVLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxFQUFFO2dCQUNsQyxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDeEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxlQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUMvRSxDQUFDLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO29CQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLGVBQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQy9FLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxDQUFDO3FCQUFNLElBQUksSUFBSSxDQUFDLEVBQUUsS0FBSyxRQUFRLEdBQUcsR0FBRyxFQUFFLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksZUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxlQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRyxDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBRUYsT0FBTyxVQUFVLENBQUM7UUFDbkIsQ0FBQztLQUNELENBQUMifQ==