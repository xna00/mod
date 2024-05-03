/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinkedList = void 0;
    class Node {
        static { this.Undefined = new Node(undefined); }
        constructor(element) {
            this.element = element;
            this.next = Node.Undefined;
            this.prev = Node.Undefined;
        }
    }
    class LinkedList {
        constructor() {
            this._first = Node.Undefined;
            this._last = Node.Undefined;
            this._size = 0;
        }
        get size() {
            return this._size;
        }
        isEmpty() {
            return this._first === Node.Undefined;
        }
        clear() {
            let node = this._first;
            while (node !== Node.Undefined) {
                const next = node.next;
                node.prev = Node.Undefined;
                node.next = Node.Undefined;
                node = next;
            }
            this._first = Node.Undefined;
            this._last = Node.Undefined;
            this._size = 0;
        }
        unshift(element) {
            return this._insert(element, false);
        }
        push(element) {
            return this._insert(element, true);
        }
        _insert(element, atTheEnd) {
            const newNode = new Node(element);
            if (this._first === Node.Undefined) {
                this._first = newNode;
                this._last = newNode;
            }
            else if (atTheEnd) {
                // push
                const oldLast = this._last;
                this._last = newNode;
                newNode.prev = oldLast;
                oldLast.next = newNode;
            }
            else {
                // unshift
                const oldFirst = this._first;
                this._first = newNode;
                newNode.next = oldFirst;
                oldFirst.prev = newNode;
            }
            this._size += 1;
            let didRemove = false;
            return () => {
                if (!didRemove) {
                    didRemove = true;
                    this._remove(newNode);
                }
            };
        }
        shift() {
            if (this._first === Node.Undefined) {
                return undefined;
            }
            else {
                const res = this._first.element;
                this._remove(this._first);
                return res;
            }
        }
        pop() {
            if (this._last === Node.Undefined) {
                return undefined;
            }
            else {
                const res = this._last.element;
                this._remove(this._last);
                return res;
            }
        }
        _remove(node) {
            if (node.prev !== Node.Undefined && node.next !== Node.Undefined) {
                // middle
                const anchor = node.prev;
                anchor.next = node.next;
                node.next.prev = anchor;
            }
            else if (node.prev === Node.Undefined && node.next === Node.Undefined) {
                // only node
                this._first = Node.Undefined;
                this._last = Node.Undefined;
            }
            else if (node.next === Node.Undefined) {
                // last
                this._last = this._last.prev;
                this._last.next = Node.Undefined;
            }
            else if (node.prev === Node.Undefined) {
                // first
                this._first = this._first.next;
                this._first.prev = Node.Undefined;
            }
            // done
            this._size -= 1;
        }
        *[Symbol.iterator]() {
            let node = this._first;
            while (node !== Node.Undefined) {
                yield node.element;
                node = node.next;
            }
        }
    }
    exports.LinkedList = LinkedList;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua2VkTGlzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vbGlua2VkTGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFaEcsTUFBTSxJQUFJO2lCQUVPLGNBQVMsR0FBRyxJQUFJLElBQUksQ0FBTSxTQUFTLENBQUMsQ0FBQztRQU1yRCxZQUFZLE9BQVU7WUFDckIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQzNCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUM1QixDQUFDOztJQUdGLE1BQWEsVUFBVTtRQUF2QjtZQUVTLFdBQU0sR0FBWSxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ2pDLFVBQUssR0FBWSxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ2hDLFVBQUssR0FBVyxDQUFDLENBQUM7UUFxSDNCLENBQUM7UUFuSEEsSUFBSSxJQUFJO1lBQ1AsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFFRCxPQUFPO1lBQ04sT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDdkMsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUMzQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQzNCLElBQUksR0FBRyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQzdCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNoQixDQUFDO1FBRUQsT0FBTyxDQUFDLE9BQVU7WUFDakIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQVU7WUFDZCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFTyxPQUFPLENBQUMsT0FBVSxFQUFFLFFBQWlCO1lBQzVDLE1BQU0sT0FBTyxHQUFHLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO2dCQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztZQUV0QixDQUFDO2lCQUFNLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU87Z0JBQ1AsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7Z0JBQ3JCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO2dCQUN2QixPQUFPLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztZQUV4QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsVUFBVTtnQkFDVixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUM3QixJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQztnQkFDdEIsT0FBTyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7Z0JBQ3hCLFFBQVEsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO1lBQ3pCLENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztZQUVoQixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDdEIsT0FBTyxHQUFHLEVBQUU7Z0JBQ1gsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNoQixTQUFTLEdBQUcsSUFBSSxDQUFDO29CQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN2QixDQUFDO1lBQ0YsQ0FBQyxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMxQixPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7UUFDRixDQUFDO1FBRUQsR0FBRztZQUNGLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ25DLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3pCLE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztRQUNGLENBQUM7UUFFTyxPQUFPLENBQUMsSUFBYTtZQUM1QixJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDbEUsU0FBUztnQkFDVCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUN6QixNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztZQUV6QixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN6RSxZQUFZO2dCQUNaLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBRTdCLENBQUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDekMsT0FBTztnQkFDUCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSyxDQUFDO2dCQUM5QixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBRWxDLENBQUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDekMsUUFBUTtnQkFDUixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSyxDQUFDO2dCQUNoQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ25DLENBQUM7WUFFRCxPQUFPO1lBQ1AsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7UUFDakIsQ0FBQztRQUVELENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO1lBQ2pCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDdkIsT0FBTyxJQUFJLEtBQUssSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ25CLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUF6SEQsZ0NBeUhDIn0=