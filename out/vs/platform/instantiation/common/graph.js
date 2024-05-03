/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Graph = exports.Node = void 0;
    class Node {
        constructor(key, data) {
            this.key = key;
            this.data = data;
            this.incoming = new Map();
            this.outgoing = new Map();
        }
    }
    exports.Node = Node;
    class Graph {
        constructor(_hashFn) {
            this._hashFn = _hashFn;
            this._nodes = new Map();
            // empty
        }
        roots() {
            const ret = [];
            for (const node of this._nodes.values()) {
                if (node.outgoing.size === 0) {
                    ret.push(node);
                }
            }
            return ret;
        }
        insertEdge(from, to) {
            const fromNode = this.lookupOrInsertNode(from);
            const toNode = this.lookupOrInsertNode(to);
            fromNode.outgoing.set(toNode.key, toNode);
            toNode.incoming.set(fromNode.key, fromNode);
        }
        removeNode(data) {
            const key = this._hashFn(data);
            this._nodes.delete(key);
            for (const node of this._nodes.values()) {
                node.outgoing.delete(key);
                node.incoming.delete(key);
            }
        }
        lookupOrInsertNode(data) {
            const key = this._hashFn(data);
            let node = this._nodes.get(key);
            if (!node) {
                node = new Node(key, data);
                this._nodes.set(key, node);
            }
            return node;
        }
        lookup(data) {
            return this._nodes.get(this._hashFn(data));
        }
        isEmpty() {
            return this._nodes.size === 0;
        }
        toString() {
            const data = [];
            for (const [key, value] of this._nodes) {
                data.push(`${key}\n\t(-> incoming)[${[...value.incoming.keys()].join(', ')}]\n\t(outgoing ->)[${[...value.outgoing.keys()].join(',')}]\n`);
            }
            return data.join('\n');
        }
        /**
         * This is brute force and slow and **only** be used
         * to trouble shoot.
         */
        findCycleSlow() {
            for (const [id, node] of this._nodes) {
                const seen = new Set([id]);
                const res = this._findCycle(node, seen);
                if (res) {
                    return res;
                }
            }
            return undefined;
        }
        _findCycle(node, seen) {
            for (const [id, outgoing] of node.outgoing) {
                if (seen.has(id)) {
                    return [...seen, id].join(' -> ');
                }
                seen.add(id);
                const value = this._findCycle(outgoing, seen);
                if (value) {
                    return value;
                }
                seen.delete(id);
            }
            return undefined;
        }
    }
    exports.Graph = Graph;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhcGguanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2luc3RhbnRpYXRpb24vY29tbW9uL2dyYXBoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVoRyxNQUFhLElBQUk7UUFNaEIsWUFDVSxHQUFXLEVBQ1gsSUFBTztZQURQLFFBQUcsR0FBSCxHQUFHLENBQVE7WUFDWCxTQUFJLEdBQUosSUFBSSxDQUFHO1lBTFIsYUFBUSxHQUFHLElBQUksR0FBRyxFQUFtQixDQUFDO1lBQ3RDLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBbUIsQ0FBQztRQUszQyxDQUFDO0tBQ0w7SUFWRCxvQkFVQztJQUVELE1BQWEsS0FBSztRQUlqQixZQUE2QixPQUErQjtZQUEvQixZQUFPLEdBQVAsT0FBTyxDQUF3QjtZQUYzQyxXQUFNLEdBQUcsSUFBSSxHQUFHLEVBQW1CLENBQUM7WUFHcEQsUUFBUTtRQUNULENBQUM7UUFFRCxLQUFLO1lBQ0osTUFBTSxHQUFHLEdBQWMsRUFBRSxDQUFDO1lBQzFCLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUN6QyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUM5QixHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoQixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVELFVBQVUsQ0FBQyxJQUFPLEVBQUUsRUFBSztZQUN4QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVB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