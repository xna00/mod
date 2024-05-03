/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator"], function (require, exports, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WellDefinedPrefixTree = void 0;
    const unset = Symbol('unset');
    /**
     * A simple prefix tree implementation where a value is stored based on
     * well-defined prefix segments.
     */
    class WellDefinedPrefixTree {
        constructor() {
            this.root = new Node();
            this._size = 0;
        }
        get size() {
            return this._size;
        }
        /** Gets the top-level nodes of the tree */
        get nodes() {
            return this.root.children?.values() || iterator_1.Iterable.empty();
        }
        /**
         * Inserts a new value in the prefix tree.
         * @param onNode - called for each node as we descend to the insertion point,
         * including the insertion point itself.
         */
        insert(key, value, onNode) {
            this.opNode(key, n => n._value = value, onNode);
        }
        /** Mutates a value in the prefix tree. */
        mutate(key, mutate) {
            this.opNode(key, n => n._value = mutate(n._value === unset ? undefined : n._value));
        }
        /** Deletes a node from the prefix tree, returning the value it contained. */
        delete(key) {
            const path = this.getPathToKey(key);
            if (!path) {
                return;
            }
            let i = path.length - 1;
            const value = path[i].node._value;
            if (value === unset) {
                return; // not actually a real node
            }
            this._size--;
            path[i].node._value = unset;
            for (; i > 0; i--) {
                const { node, part } = path[i];
                if (node.children?.size || node._value !== unset) {
                    break;
                }
                path[i - 1].node.children.delete(part);
            }
            return value;
        }
        /** Deletes a subtree from the prefix tree, returning the values they contained. */
        *deleteRecursive(key) {
            const path = this.getPathToKey(key);
            if (!path) {
                return;
            }
            const subtree = path[path.length - 1].node;
            // important: run the deletion before we start to yield results, so that
            // it still runs even if the caller doesn't consumer the iterator
            for (let i = path.length - 1; i > 0; i--) {
                const parent = path[i - 1];
                parent.node.children.delete(path[i].part);
                if (parent.node.children.size > 0 || parent.node._value !== unset) {
                    break;
                }
            }
            for (const node of bfsIterate(subtree)) {
                if (node._value !== unset) {
                    this._size--;
                    yield node._value;
                }
            }
        }
        /** Gets a value from the tree. */
        find(key) {
            let node = this.root;
            for (const segment of key) {
                const next = node.children?.get(segment);
                if (!next) {
                    return undefined;
                }
                node = next;
            }
            return node._value === unset ? undefined : node._value;
        }
        /** Gets whether the tree has the key, or a parent of the key, already inserted. */
        hasKeyOrParent(key) {
            let node = this.root;
            for (const segment of key) {
                const next = node.children?.get(segment);
                if (!next) {
                    return false;
                }
                if (next._value !== unset) {
                    return true;
                }
                node = next;
            }
            return false;
        }
        /** Gets whether the tree has the given key or any children. */
        hasKeyOrChildren(key) {
            let node = this.root;
            for (const segment of key) {
                const next = node.children?.get(segment);
                if (!next) {
                    return false;
                }
                node = next;
            }
            return true;
        }
        /** Gets whether the tree has the given key. */
        hasKey(key) {
            let node = this.root;
            for (const segment of key) {
                const next = node.children?.get(segment);
                if (!next) {
                    return false;
                }
                node = next;
            }
            return node._value !== unset;
        }
        getPathToKey(key) {
            const path = [{ part: '', node: this.root }];
            let i = 0;
            for (const part of key) {
                const node = path[i].node.children?.get(part);
                if (!node) {
                    return; // node not in tree
                }
                path.push({ part, node });
                i++;
            }
            return path;
        }
        opNode(key, fn, onDescend) {
            let node = this.root;
            for (const part of key) {
                if (!node.children) {
                    const next = new Node();
                    node.children = new Map([[part, next]]);
                    node = next;
                }
                else if (!node.children.has(part)) {
                    const next = new Node();
                    node.children.set(part, next);
                    node = next;
                }
                else {
                    node = node.children.get(part);
                }
                onDescend?.(node);
            }
            const sizeBefore = node._value === unset ? 0 : 1;
            fn(node);
            const sizeAfter = node._value === unset ? 0 : 1;
            this._size += sizeAfter - sizeBefore;
        }
        /** Returns an iterable of the tree values in no defined order. */
        *values() {
            for (const { _value } of bfsIterate(this.root)) {
                if (_value !== unset) {
                    yield _value;
                }
            }
        }
    }
    exports.WellDefinedPrefixTree = WellDefinedPrefixTree;
    function* bfsIterate(root) {
        const stack = [root];
        while (stack.length > 0) {
            const node = stack.pop();
            yield node;
            if (node.children) {
                for (const child of node.children.values()) {
                    stack.push(child);
                }
            }
        }
    }
    class Node {
        constructor() {
            this._value = unset;
        }
        get value() {
            return this._value === unset ? undefined : this._value;
        }
        set value(value) {
            this._value = value === undefined ? unset : value;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZml4VHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vcHJlZml4VHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBVTlCOzs7T0FHRztJQUNILE1BQWEscUJBQXFCO1FBQWxDO1lBQ2tCLFNBQUksR0FBRyxJQUFJLElBQUksRUFBSyxDQUFDO1lBQzlCLFVBQUssR0FBRyxDQUFDLENBQUM7UUE4TG5CLENBQUM7UUE1TEEsSUFBVyxJQUFJO1lBQ2QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFFRCwyQ0FBMkM7UUFDM0MsSUFBVyxLQUFLO1lBQ2YsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxtQkFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3pELENBQUM7UUFFRDs7OztXQUlHO1FBQ0gsTUFBTSxDQUFDLEdBQXFCLEVBQUUsS0FBUSxFQUFFLE1BQXdDO1lBQy9FLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELDBDQUEwQztRQUMxQyxNQUFNLENBQUMsR0FBcUIsRUFBRSxNQUF3QjtZQUNyRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFFRCw2RUFBNkU7UUFDN0UsTUFBTSxDQUFDLEdBQXFCO1lBQzNCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDeEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsSUFBSSxLQUFLLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sQ0FBQywyQkFBMkI7WUFDcEMsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUU1QixPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9CLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUUsQ0FBQztvQkFDbEQsTUFBTTtnQkFDUCxDQUFDO2dCQUVELElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELG1GQUFtRjtRQUNuRixDQUFDLGVBQWUsQ0FBQyxHQUFxQjtZQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUUzQyx3RUFBd0U7WUFDeEUsaUVBQWlFO1lBQ2pFLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUMxQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMzQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFFLENBQUM7b0JBQ3BFLE1BQU07Z0JBQ1AsQ0FBQztZQUNGLENBQUM7WUFFRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFFLENBQUM7b0JBQzNCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDYixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ25CLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELGtDQUFrQztRQUNsQyxJQUFJLENBQUMsR0FBcUI7WUFDekIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNyQixLQUFLLE1BQU0sT0FBTyxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUMzQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUVELElBQUksR0FBRyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3hELENBQUM7UUFFRCxtRkFBbUY7UUFDbkYsY0FBYyxDQUFDLEdBQXFCO1lBQ25DLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDckIsS0FBSyxNQUFNLE9BQU8sSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3pDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUNELElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUUsQ0FBQztvQkFDM0IsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFFRCxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELCtEQUErRDtRQUMvRCxnQkFBZ0IsQ0FBQyxHQUFxQjtZQUNyQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ3JCLEtBQUssTUFBTSxPQUFPLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1gsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztnQkFFRCxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELCtDQUErQztRQUMvQyxNQUFNLENBQUMsR0FBcUI7WUFDM0IsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNyQixLQUFLLE1BQU0sT0FBTyxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUMzQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBRUQsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDO1FBQzlCLENBQUM7UUFFTyxZQUFZLENBQUMsR0FBcUI7WUFDekMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNWLEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLE9BQU8sQ0FBQyxtQkFBbUI7Z0JBQzVCLENBQUM7Z0JBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUMxQixDQUFDLEVBQUUsQ0FBQztZQUNMLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTyxNQUFNLENBQUMsR0FBcUIsRUFBRSxFQUEyQixFQUFFLFNBQW1DO1lBQ3JHLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDckIsS0FBSyxNQUFNLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDcEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUssQ0FBQztvQkFDM0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDeEMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDYixDQUFDO3FCQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLElBQUksRUFBSyxDQUFDO29CQUMzQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQzlCLElBQUksR0FBRyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUUsQ0FBQztnQkFDakMsQ0FBQztnQkFDRCxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQixDQUFDO1lBRUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pELEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNULE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRCxJQUFJLENBQUMsS0FBSyxJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUM7UUFDdEMsQ0FBQztRQUVELGtFQUFrRTtRQUNsRSxDQUFDLE1BQU07WUFDTixLQUFLLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELElBQUksTUFBTSxLQUFLLEtBQUssRUFBRSxDQUFDO29CQUN0QixNQUFNLE1BQU0sQ0FBQztnQkFDZCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7S0FDRDtJQWhNRCxzREFnTUM7SUFFRCxRQUFRLENBQUMsQ0FBQyxVQUFVLENBQUksSUFBYTtRQUNwQyxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JCLE9BQU8sS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN6QixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFHLENBQUM7WUFDMUIsTUFBTSxJQUFJLENBQUM7WUFFWCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkIsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQzVDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25CLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFNLElBQUk7UUFBVjtZQVdRLFdBQU0sR0FBcUIsS0FBSyxDQUFDO1FBQ3pDLENBQUM7UUFUQSxJQUFXLEtBQUs7WUFDZixPQUFPLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDeEQsQ0FBQztRQUVELElBQVcsS0FBSyxDQUFDLEtBQW9CO1lBQ3BDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDbkQsQ0FBQztLQUdEIn0=