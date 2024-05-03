/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestId = exports.TestPosition = exports.TestIdPathParts = void 0;
    var TestIdPathParts;
    (function (TestIdPathParts) {
        /** Delimiter for path parts in test IDs */
        TestIdPathParts["Delimiter"] = "\0";
    })(TestIdPathParts || (exports.TestIdPathParts = TestIdPathParts = {}));
    /**
     * Enum for describing relative positions of tests. Similar to
     * `node.compareDocumentPosition` in the DOM.
     */
    var TestPosition;
    (function (TestPosition) {
        /** a === b */
        TestPosition[TestPosition["IsSame"] = 0] = "IsSame";
        /** Neither a nor b are a child of one another. They may share a common parent, though. */
        TestPosition[TestPosition["Disconnected"] = 1] = "Disconnected";
        /** b is a child of a */
        TestPosition[TestPosition["IsChild"] = 2] = "IsChild";
        /** b is a parent of a */
        TestPosition[TestPosition["IsParent"] = 3] = "IsParent";
    })(TestPosition || (exports.TestPosition = TestPosition = {}));
    /**
     * The test ID is a stringifiable client that
     */
    class TestId {
        /**
         * Creates a test ID from an ext host test item.
         */
        static fromExtHostTestItem(item, rootId, parent = item.parent) {
            if (item._isRoot) {
                return new TestId([rootId]);
            }
            const path = [item.id];
            for (let i = parent; i && i.id !== rootId; i = i.parent) {
                path.push(i.id);
            }
            path.push(rootId);
            return new TestId(path.reverse());
        }
        /**
         * Cheaply ets whether the ID refers to the root .
         */
        static isRoot(idString) {
            return !idString.includes("\0" /* TestIdPathParts.Delimiter */);
        }
        /**
         * Cheaply gets whether the ID refers to the root .
         */
        static root(idString) {
            const idx = idString.indexOf("\0" /* TestIdPathParts.Delimiter */);
            return idx === -1 ? idString : idString.slice(0, idx);
        }
        /**
         * Creates a test ID from a serialized TestId instance.
         */
        static fromString(idString) {
            return new TestId(idString.split("\0" /* TestIdPathParts.Delimiter */));
        }
        /**
         * Gets the ID resulting from adding b to the base ID.
         */
        static join(base, b) {
            return new TestId([...base.path, b]);
        }
        /**
         * Gets the string ID resulting from adding b to the base ID.
         */
        static joinToString(base, b) {
            return base.toString() + "\0" /* TestIdPathParts.Delimiter */ + b;
        }
        /**
         * Cheaply gets the parent ID of a test identified with the string.
         */
        static parentId(idString) {
            const idx = idString.lastIndexOf("\0" /* TestIdPathParts.Delimiter */);
            return idx === -1 ? undefined : idString.slice(0, idx);
        }
        /**
         * Cheaply gets the local ID of a test identified with the string.
         */
        static localId(idString) {
            const idx = idString.lastIndexOf("\0" /* TestIdPathParts.Delimiter */);
            return idx === -1 ? idString : idString.slice(idx + "\0" /* TestIdPathParts.Delimiter */.length);
        }
        /**
         * Gets whether maybeChild is a child of maybeParent.
         * todo@connor4312: review usages of this to see if using the WellDefinedPrefixTree is better
         */
        static isChild(maybeParent, maybeChild) {
            return maybeChild.startsWith(maybeParent) && maybeChild[maybeParent.length] === "\0" /* TestIdPathParts.Delimiter */;
        }
        /**
         * Compares the position of the two ID strings.
         * todo@connor4312: review usages of this to see if using the WellDefinedPrefixTree is better
         */
        static compare(a, b) {
            if (a === b) {
                return 0 /* TestPosition.IsSame */;
            }
            if (TestId.isChild(a, b)) {
                return 2 /* TestPosition.IsChild */;
            }
            if (TestId.isChild(b, a)) {
                return 3 /* TestPosition.IsParent */;
            }
            return 1 /* TestPosition.Disconnected */;
        }
        constructor(path, viewEnd = path.length) {
            this.path = path;
            this.viewEnd = viewEnd;
            if (path.length === 0 || viewEnd < 1) {
                throw new Error('cannot create test with empty path');
            }
        }
        /**
         * Gets the ID of the parent test.
         */
        get rootId() {
            return new TestId(this.path, 1);
        }
        /**
         * Gets the ID of the parent test.
         */
        get parentId() {
            return this.viewEnd > 1 ? new TestId(this.path, this.viewEnd - 1) : undefined;
        }
        /**
         * Gets the local ID of the current full test ID.
         */
        get localId() {
            return this.path[this.viewEnd - 1];
        }
        /**
         * Gets whether this ID refers to the root.
         */
        get controllerId() {
            return this.path[0];
        }
        /**
         * Gets whether this ID refers to the root.
         */
        get isRoot() {
            return this.viewEnd === 1;
        }
        /**
         * Returns an iterable that yields IDs of all parent items down to and
         * including the current item.
         */
        *idsFromRoot() {
            for (let i = 1; i <= this.viewEnd; i++) {
                yield new TestId(this.path, i);
            }
        }
        /**
         * Returns an iterable that yields IDs of the current item up to the root
         * item.
         */
        *idsToRoot() {
            for (let i = this.viewEnd; i > 0; i--) {
                yield new TestId(this.path, i);
            }
        }
        /**
         * Compares the other test ID with this one.
         */
        compare(other) {
            if (typeof other === 'string') {
                return TestId.compare(this.toString(), other);
            }
            for (let i = 0; i < other.viewEnd && i < this.viewEnd; i++) {
                if (other.path[i] !== this.path[i]) {
                    return 1 /* TestPosition.Disconnected */;
                }
            }
            if (other.viewEnd > this.viewEnd) {
                return 2 /* TestPosition.IsChild */;
            }
            if (other.viewEnd < this.viewEnd) {
                return 3 /* TestPosition.IsParent */;
            }
            return 0 /* TestPosition.IsSame */;
        }
        /**
         * Serializes the ID.
         */
        toJSON() {
            return this.toString();
        }
        /**
         * Serializes the ID to a string.
         */
        toString() {
            if (!this.stringifed) {
                this.stringifed = this.path[0];
                for (let i = 1; i < this.viewEnd; i++) {
                    this.stringifed += "\0" /* TestIdPathParts.Delimiter */;
                    this.stringifed += this.path[i];
                }
            }
            return this.stringifed;
        }
    }
    exports.TestId = TestId;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdElkLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi90ZXN0SWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBRWhHLElBQWtCLGVBR2pCO0lBSEQsV0FBa0IsZUFBZTtRQUNoQywyQ0FBMkM7UUFDM0MsbUNBQWdCLENBQUE7SUFDakIsQ0FBQyxFQUhpQixlQUFlLCtCQUFmLGVBQWUsUUFHaEM7SUFFRDs7O09BR0c7SUFDSCxJQUFrQixZQVNqQjtJQVRELFdBQWtCLFlBQVk7UUFDN0IsY0FBYztRQUNkLG1EQUFNLENBQUE7UUFDTiwwRkFBMEY7UUFDMUYsK0RBQVksQ0FBQTtRQUNaLHdCQUF3QjtRQUN4QixxREFBTyxDQUFBO1FBQ1AseUJBQXlCO1FBQ3pCLHVEQUFRLENBQUE7SUFDVCxDQUFDLEVBVGlCLFlBQVksNEJBQVosWUFBWSxRQVM3QjtJQUlEOztPQUVHO0lBQ0gsTUFBYSxNQUFNO1FBR2xCOztXQUVHO1FBQ0ksTUFBTSxDQUFDLG1CQUFtQixDQUFDLElBQWtCLEVBQUUsTUFBYyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTTtZQUN6RixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDN0IsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZCLEtBQUssSUFBSSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxLQUFLLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN6RCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNqQixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVsQixPQUFPLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRDs7V0FFRztRQUNJLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBZ0I7WUFDcEMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLHNDQUEyQixDQUFDO1FBQ3RELENBQUM7UUFFRDs7V0FFRztRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBZ0I7WUFDbEMsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLE9BQU8sc0NBQTJCLENBQUM7WUFDeEQsT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVEOztXQUVHO1FBQ0ksTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFnQjtZQUN4QyxPQUFPLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLHNDQUEyQixDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVEOztXQUVHO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFZLEVBQUUsQ0FBUztZQUN6QyxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVEOztXQUVHO1FBQ0ksTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFxQixFQUFFLENBQVM7WUFDMUQsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLHVDQUE0QixHQUFHLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQ7O1dBRUc7UUFDSSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQWdCO1lBQ3RDLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxXQUFXLHNDQUEyQixDQUFDO1lBQzVELE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFRDs7V0FFRztRQUNJLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBZ0I7WUFDckMsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLFdBQVcsc0NBQTJCLENBQUM7WUFDNUQsT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcscUNBQTBCLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZGLENBQUM7UUFFRDs7O1dBR0c7UUFDSSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQW1CLEVBQUUsVUFBa0I7WUFDNUQsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLHlDQUE4QixDQUFDO1FBQzNHLENBQUM7UUFFRDs7O1dBR0c7UUFDSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQVMsRUFBRSxDQUFTO1lBQ3pDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNiLG1DQUEyQjtZQUM1QixDQUFDO1lBRUQsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUMxQixvQ0FBNEI7WUFDN0IsQ0FBQztZQUVELElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIscUNBQTZCO1lBQzlCLENBQUM7WUFFRCx5Q0FBaUM7UUFDbEMsQ0FBQztRQUVELFlBQ2lCLElBQXVCLEVBQ3RCLFVBQVUsSUFBSSxDQUFDLE1BQU07WUFEdEIsU0FBSSxHQUFKLElBQUksQ0FBbUI7WUFDdEIsWUFBTyxHQUFQLE9BQU8sQ0FBYztZQUV0QyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1lBQ3ZELENBQUM7UUFDRixDQUFDO1FBRUQ7O1dBRUc7UUFDSCxJQUFXLE1BQU07WUFDaEIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRDs7V0FFRztRQUNILElBQVcsUUFBUTtZQUNsQixPQUFPLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUMvRSxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxJQUFXLE9BQU87WUFDakIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVEOztXQUVHO1FBQ0gsSUFBVyxZQUFZO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQixDQUFDO1FBRUQ7O1dBRUc7UUFDSCxJQUFXLE1BQU07WUFDaEIsT0FBTyxJQUFJLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRUQ7OztXQUdHO1FBQ0ksQ0FBQyxXQUFXO1lBQ2xCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3hDLE1BQU0sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxDQUFDO1FBQ0YsQ0FBQztRQUVEOzs7V0FHRztRQUNJLENBQUMsU0FBUztZQUNoQixLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7UUFFRDs7V0FFRztRQUNJLE9BQU8sQ0FBQyxLQUFzQjtZQUNwQyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMvQixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM1RCxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNwQyx5Q0FBaUM7Z0JBQ2xDLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEMsb0NBQTRCO1lBQzdCLENBQUM7WUFFRCxJQUFJLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQyxxQ0FBNkI7WUFDOUIsQ0FBQztZQUVELG1DQUEyQjtRQUM1QixDQUFDO1FBRUQ7O1dBRUc7UUFDSSxNQUFNO1lBQ1osT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVEOztXQUVHO1FBQ0ksUUFBUTtZQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLFVBQVUsd0NBQTZCLENBQUM7b0JBQzdDLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakMsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztLQUNEO0lBbE5ELHdCQWtOQyJ9