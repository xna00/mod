/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/ternarySearchTree", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri"], function (require, exports, decorators_1, ternarySearchTree_1, paths, resources_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceTree = void 0;
    class Node {
        get childrenCount() {
            return this._children.size;
        }
        get children() {
            return this._children.values();
        }
        get name() {
            return paths.posix.basename(this.relativePath);
        }
        constructor(uri, relativePath, context, element = undefined, parent = undefined) {
            this.uri = uri;
            this.relativePath = relativePath;
            this.context = context;
            this.element = element;
            this.parent = parent;
            this._children = new Map();
        }
        get(path) {
            return this._children.get(path);
        }
        set(path, child) {
            this._children.set(path, child);
        }
        delete(path) {
            this._children.delete(path);
        }
        clear() {
            this._children.clear();
        }
    }
    __decorate([
        decorators_1.memoize
    ], Node.prototype, "name", null);
    function collect(node, result) {
        if (typeof node.element !== 'undefined') {
            result.push(node.element);
        }
        for (const child of node.children) {
            collect(child, result);
        }
        return result;
    }
    class ResourceTree {
        static getRoot(node) {
            while (node.parent) {
                node = node.parent;
            }
            return node;
        }
        static collect(node) {
            return collect(node, []);
        }
        static isResourceNode(obj) {
            return obj instanceof Node;
        }
        constructor(context, rootURI = uri_1.URI.file('/'), extUri = resources_1.extUri) {
            this.extUri = extUri;
            this.root = new Node(rootURI, '', context);
        }
        add(uri, element) {
            const key = this.extUri.relativePath(this.root.uri, uri) || uri.path;
            const iterator = new ternarySearchTree_1.PathIterator(false).reset(key);
            let node = this.root;
            let path = '';
            while (true) {
                const name = iterator.value();
                path = path + '/' + name;
                let child = node.get(name);
                if (!child) {
                    child = new Node(this.extUri.joinPath(this.root.uri, path), path, this.root.context, iterator.hasNext() ? undefined : element, node);
                    node.set(name, child);
                }
                else if (!iterator.hasNext()) {
                    child.element = element;
                }
                node = child;
                if (!iterator.hasNext()) {
                    return;
                }
                iterator.next();
            }
        }
        delete(uri) {
            const key = this.extUri.relativePath(this.root.uri, uri) || uri.path;
            const iterator = new ternarySearchTree_1.PathIterator(false).reset(key);
            return this._delete(this.root, iterator);
        }
        _delete(node, iterator) {
            const name = iterator.value();
            const child = node.get(name);
            if (!child) {
                return undefined;
            }
            if (iterator.hasNext()) {
                const result = this._delete(child, iterator.next());
                if (typeof result !== 'undefined' && child.childrenCount === 0) {
                    node.delete(name);
                }
                return result;
            }
            node.delete(name);
            return child.element;
        }
        clear() {
            this.root.clear();
        }
        getNode(uri) {
            const key = this.extUri.relativePath(this.root.uri, uri) || uri.path;
            const iterator = new ternarySearchTree_1.PathIterator(false).reset(key);
            let node = this.root;
            while (true) {
                const name = iterator.value();
                const child = node.get(name);
                if (!child || !iterator.hasNext()) {
                    return child;
                }
                node = child;
                iterator.next();
            }
        }
    }
    exports.ResourceTree = ResourceTree;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VUcmVlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9yZXNvdXJjZVRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7O0lBb0JoRyxNQUFNLElBQUk7UUFJVCxJQUFJLGFBQWE7WUFDaEIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztRQUM1QixDQUFDO1FBRUQsSUFBSSxRQUFRO1lBQ1gsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFHRCxJQUFJLElBQUk7WUFDUCxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRUQsWUFDVSxHQUFRLEVBQ1IsWUFBb0IsRUFDcEIsT0FBVSxFQUNaLFVBQXlCLFNBQVMsRUFDaEMsU0FBMEMsU0FBUztZQUpuRCxRQUFHLEdBQUgsR0FBRyxDQUFLO1lBQ1IsaUJBQVksR0FBWixZQUFZLENBQVE7WUFDcEIsWUFBTyxHQUFQLE9BQU8sQ0FBRztZQUNaLFlBQU8sR0FBUCxPQUFPLENBQTJCO1lBQ2hDLFdBQU0sR0FBTixNQUFNLENBQTZDO1lBcEJyRCxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQXNCLENBQUM7UUFxQjlDLENBQUM7UUFFTCxHQUFHLENBQUMsSUFBWTtZQUNmLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELEdBQUcsQ0FBQyxJQUFZLEVBQUUsS0FBaUI7WUFDbEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxNQUFNLENB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