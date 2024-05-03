define(["require", "exports", "vs/editor/common/core/range", "vs/workbench/api/common/extHostTestingPrivateApi", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testItemCollection", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/uri"], function (require, exports, editorRange, extHostTestingPrivateApi_1, testId_1, testItemCollection_1, testTypes_1, Convert, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTestItemCollection = exports.TestItemRootImpl = exports.TestItemImpl = exports.toItemFromContext = void 0;
    const testItemPropAccessor = (api, defaultValue, equals, toUpdate) => {
        let value = defaultValue;
        return {
            enumerable: true,
            configurable: false,
            get() {
                return value;
            },
            set(newValue) {
                if (!equals(value, newValue)) {
                    const oldValue = value;
                    value = newValue;
                    api.listener?.(toUpdate(newValue, oldValue));
                }
            },
        };
    };
    const strictEqualComparator = (a, b) => a === b;
    const propComparators = {
        range: (a, b) => {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.isEqual(b);
        },
        label: strictEqualComparator,
        description: strictEqualComparator,
        sortText: strictEqualComparator,
        busy: strictEqualComparator,
        error: strictEqualComparator,
        canResolveChildren: strictEqualComparator,
        tags: (a, b) => {
            if (a.length !== b.length) {
                return false;
            }
            if (a.some(t1 => !b.find(t2 => t1.id === t2.id))) {
                return false;
            }
            return true;
        },
    };
    const evSetProps = (fn) => v => ({ op: 4 /* TestItemEventOp.SetProp */, update: fn(v) });
    const makePropDescriptors = (api, label) => ({
        range: (() => {
            let value;
            const updateProps = evSetProps(r => ({ range: editorRange.Range.lift(Convert.Range.from(r)) }));
            return {
                enumerable: true,
                configurable: false,
                get() {
                    return value;
                },
                set(newValue) {
                    api.listener?.({ op: 6 /* TestItemEventOp.DocumentSynced */ });
                    if (!propComparators.range(value, newValue)) {
                        value = newValue;
                        api.listener?.(updateProps(newValue));
                    }
                },
            };
        })(),
        label: testItemPropAccessor(api, label, propComparators.label, evSetProps(label => ({ label }))),
        description: testItemPropAccessor(api, undefined, propComparators.description, evSetProps(description => ({ description }))),
        sortText: testItemPropAccessor(api, undefined, propComparators.sortText, evSetProps(sortText => ({ sortText }))),
        canResolveChildren: testItemPropAccessor(api, false, propComparators.canResolveChildren, state => ({
            op: 2 /* TestItemEventOp.UpdateCanResolveChildren */,
            state,
        })),
        busy: testItemPropAccessor(api, false, propComparators.busy, evSetProps(busy => ({ busy }))),
        error: testItemPropAccessor(api, undefined, propComparators.error, evSetProps(error => ({ error: Convert.MarkdownString.fromStrict(error) || null }))),
        tags: testItemPropAccessor(api, [], propComparators.tags, (current, previous) => ({
            op: 1 /* TestItemEventOp.SetTags */,
            new: current.map(Convert.TestTag.from),
            old: previous.map(Convert.TestTag.from),
        })),
    });
    const toItemFromPlain = (item) => {
        const testId = testId_1.TestId.fromString(item.extId);
        const testItem = new TestItemImpl(testId.controllerId, testId.localId, item.label, uri_1.URI.revive(item.uri) || undefined);
        testItem.range = Convert.Range.to(item.range || undefined);
        testItem.description = item.description || undefined;
        testItem.sortText = item.sortText || undefined;
        testItem.tags = item.tags.map(t => Convert.TestTag.to({ id: (0, testTypes_1.denamespaceTestTag)(t).tagId }));
        return testItem;
    };
    const toItemFromContext = (context) => {
        let node;
        for (const test of context.tests) {
            const next = toItemFromPlain(test.item);
            (0, extHostTestingPrivateApi_1.getPrivateApiFor)(next).parent = node;
            node = next;
        }
        return node;
    };
    exports.toItemFromContext = toItemFromContext;
    class TestItemImpl {
        /**
         * Note that data is deprecated and here for back-compat only
         */
        constructor(controllerId, id, label, uri) {
            if (id.includes("\0" /* TestIdPathParts.Delimiter */)) {
                throw new Error(`Test IDs may not include the ${JSON.stringify(id)} symbol`);
            }
            const api = (0, extHostTestingPrivateApi_1.createPrivateApiFor)(this, controllerId);
            Object.defineProperties(this, {
                id: {
                    value: id,
                    enumerable: true,
                    writable: false,
                },
                uri: {
                    value: uri,
                    enumerable: true,
                    writable: false,
                },
                parent: {
                    enumerable: false,
                    get() {
                        return api.parent instanceof TestItemRootImpl ? undefined : api.parent;
                    },
                },
                children: {
                    value: (0, testItemCollection_1.createTestItemChildren)(api, extHostTestingPrivateApi_1.getPrivateApiFor, TestItemImpl),
                    enumerable: true,
                    writable: false,
                },
                ...makePropDescriptors(api, label),
            });
        }
    }
    exports.TestItemImpl = TestItemImpl;
    class TestItemRootImpl extends TestItemImpl {
        constructor(controllerId, label) {
            super(controllerId, controllerId, label, undefined);
            this._isRoot = true;
        }
    }
    exports.TestItemRootImpl = TestItemRootImpl;
    class ExtHostTestItemCollection extends testItemCollection_1.TestItemCollection {
        constructor(controllerId, controllerLabel, editors) {
            super({
                controllerId,
                getDocumentVersion: uri => uri && editors.getDocument(uri)?.version,
                getApiFor: extHostTestingPrivateApi_1.getPrivateApiFor,
                getChildren: (item) => item.children,
                root: new TestItemRootImpl(controllerId, controllerLabel),
                toITestItem: Convert.TestItem.from,
            });
        }
    }
    exports.ExtHostTestItemCollection = ExtHostTestItemCollection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlc3RJdGVtLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0VGVzdEl0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQWNBLE1BQU0sb0JBQW9CLEdBQUcsQ0FDNUIsR0FBd0IsRUFDeEIsWUFBZ0MsRUFDaEMsTUFBaUUsRUFDakUsUUFBOEYsRUFDN0YsRUFBRTtRQUNILElBQUksS0FBSyxHQUFHLFlBQVksQ0FBQztRQUN6QixPQUFPO1lBQ04sVUFBVSxFQUFFLElBQUk7WUFDaEIsWUFBWSxFQUFFLEtBQUs7WUFDbkIsR0FBRztnQkFDRixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxHQUFHLENBQUMsUUFBNEI7Z0JBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQzlCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQztvQkFDdkIsS0FBSyxHQUFHLFFBQVEsQ0FBQztvQkFDakIsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsQ0FBQztZQUNGLENBQUM7U0FDRCxDQUFDO0lBQ0gsQ0FBQyxDQUFDO0lBSUYsTUFBTSxxQkFBcUIsR0FBRyxDQUFJLENBQUksRUFBRSxDQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFekQsTUFBTSxlQUFlLEdBQXdHO1FBQzVILEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNmLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUFDLE9BQU8sSUFBSSxDQUFDO1lBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMs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