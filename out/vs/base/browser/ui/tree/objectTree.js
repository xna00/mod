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
define(["require", "exports", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/ui/tree/compressedObjectTreeModel", "vs/base/browser/ui/tree/objectTreeModel", "vs/base/common/decorators", "vs/base/common/iterator"], function (require, exports, abstractTree_1, compressedObjectTreeModel_1, objectTreeModel_1, decorators_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompressibleObjectTree = exports.ObjectTree = void 0;
    class ObjectTree extends abstractTree_1.AbstractTree {
        get onDidChangeCollapseState() { return this.model.onDidChangeCollapseState; }
        constructor(user, container, delegate, renderers, options = {}) {
            super(user, container, delegate, renderers, options);
            this.user = user;
        }
        setChildren(element, children = iterator_1.Iterable.empty(), options) {
            this.model.setChildren(element, children, options);
        }
        rerender(element) {
            if (element === undefined) {
                this.view.rerender();
                return;
            }
            this.model.rerender(element);
        }
        updateElementHeight(element, height) {
            this.model.updateElementHeight(element, height);
        }
        resort(element, recursive = true) {
            this.model.resort(element, recursive);
        }
        hasElement(element) {
            return this.model.has(element);
        }
        createModel(user, view, options) {
            return new objectTreeModel_1.ObjectTreeModel(user, view, options);
        }
    }
    exports.ObjectTree = ObjectTree;
    class CompressibleRenderer {
        get compressedTreeNodeProvider() {
            return this._compressedTreeNodeProvider();
        }
        constructor(_compressedTreeNodeProvider, stickyScrollDelegate, renderer) {
            this._compressedTreeNodeProvider = _compressedTreeNodeProvider;
            this.stickyScrollDelegate = stickyScrollDelegate;
            this.renderer = renderer;
            this.templateId = renderer.templateId;
            if (renderer.onDidChangeTwistieState) {
                this.onDidChangeTwistieState = renderer.onDidChangeTwistieState;
            }
        }
        renderTemplate(container) {
            const data = this.renderer.renderTemplate(container);
            return { compressedTreeNode: undefined, data };
        }
        renderElement(node, index, templateData, height) {
            let compressedTreeNode = this.stickyScrollDelegate.getCompressedNode(node);
            if (!compressedTreeNode) {
                compressedTreeNode = this.compressedTreeNodeProvider.getCompressedTreeNode(node.element);
            }
            if (compressedTreeNode.element.elements.length === 1) {
                templateData.compressedTreeNode = undefined;
                this.renderer.renderElement(node, index, templateData.data, height);
            }
            else {
                templateData.compressedTreeNode = compressedTreeNode;
                this.renderer.renderCompressedElements(compressedTreeNode, index, templateData.data, height);
            }
        }
        disposeElement(node, index, templateData, height) {
            if (templateData.compressedTreeNode) {
                this.renderer.disposeCompressedElements?.(templateData.compressedTreeNode, index, templateData.data, height);
            }
            else {
                this.renderer.disposeElement?.(node, index, templateData.data, height);
            }
        }
        disposeTemplate(templateData) {
            this.renderer.disposeTemplate(templateData.data);
        }
        renderTwistie(element, twistieElement) {
            if (this.renderer.renderTwistie) {
                return this.renderer.renderTwistie(element, twistieElement);
            }
            return false;
        }
    }
    __decorate([
        decorators_1.memoize
    ], CompressibleRenderer.prototype, "compressedTreeNodeProvider", null);
    class CompressibleStickyScrollDelegate {
        constructor(modelProvider) {
            this.modelProvider = modelProvider;
            this.compressedStickyNodes = new Map();
        }
        getCompressedNode(node) {
            return this.compressedStickyNodes.get(node);
        }
        constrainStickyScrollNodes(stickyNodes, stickyScrollMaxItemCount, maxWidgetHeight) {
            this.compressedStickyNodes.clear();
            if (stickyNodes.length === 0) {
                return [];
            }
            for (let i = 0; i < stickyNodes.length; i++) {
                const stickyNode = stickyNodes[i];
                const stickyNodeBottom = stickyNode.position + stickyNode.height;
                const followingReachesMaxHeight = i + 1 < stickyNodes.length && stickyNodeBottom + stickyNodes[i + 1].height > maxWidgetHeight;
                if (followingReachesMaxHeight || i >= stickyScrollMaxItemCount - 1 && stickyScrollMaxItemCount < stickyNodes.length) {
                    const uncompressedStickyNodes = stickyNodes.slice(0, i);
                    const overflowingStickyNodes = stickyNodes.slice(i);
                    const compressedStickyNode = this.compressStickyNodes(overflowingStickyNodes);
                    return [...uncompressedStickyNodes, compressedStickyNode];
                }
            }
            return stickyNodes;
        }
        compressStickyNodes(stickyNodes) {
            if (stickyNodes.length === 0) {
                throw new Error('Can\'t compress empty sticky nodes');
            }
            if (!this.modelProvider().isCompressionEnabled()) {
                return stickyNodes[0];
            }
            // Collect all elements to be compressed
            const elements = [];
            for (const stickyNode of stickyNodes) {
                const compressedNode = this.modelProvider().getCompressedTreeNode(stickyNode.node.element);
                if (compressedNode.element) {
                    if (compressedNode.element.incompressible) {
                        break;
                    }
                    elements.push(...compressedNode.element.elements);
                }
            }
            if (elements.length < 2) {
                return stickyNodes[0];
            }
            // Compress the elements
            const lastStickyNode = stickyNodes[stickyNodes.length - 1];
            const compressedElement = { elements, incompressible: false };
            const compressedNode = { ...lastStickyNode.node, children: [], element: compressedElement };
            const stickyTreeNode = new Proxy(stickyNodes[0].node, {});
            const compressedStickyNode = {
                node: stickyTreeNode,
                startIndex: stickyNodes[0].startIndex,
                endIndex: lastStickyNode.endIndex,
                position: stickyNodes[0].position,
                height: stickyNodes[0].height,
            };
            this.compressedStickyNodes.set(stickyTreeNode, compressedNode);
            return compressedStickyNode;
        }
    }
    function asObjectTreeOptions(compressedTreeNodeProvider, options) {
        return options && {
            ...options,
            keyboardNavigationLabelProvider: options.keyboardNavigationLabelProvider && {
                getKeyboardNavigationLabel(e) {
                    let compressedTreeNode;
                    try {
                        compressedTreeNode = compressedTreeNodeProvider().getCompressedTreeNode(e);
                    }
                    catch {
                        return options.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(e);
                    }
                    if (compressedTreeNode.element.elements.length === 1) {
                        return options.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(e);
                    }
                    else {
                        return options.keyboardNavigationLabelProvider.getCompressedNodeKeyboardNavigationLabel(compressedTreeNode.element.elements);
                    }
                }
            }
        };
    }
    class CompressibleObjectTree extends ObjectTree {
        constructor(user, container, delegate, renderers, options = {}) {
            const compressedTreeNodeProvider = () => this;
            const stickyScrollDelegate = new CompressibleStickyScrollDelegate(() => this.model);
            const compressibleRenderers = renderers.map(r => new CompressibleRenderer(compressedTreeNodeProvider, stickyScrollDelegate, r));
            super(user, container, delegate, compressibleRenderers, { ...asObjectTreeOptions(compressedTreeNodeProvider, options), stickyScrollDelegate });
        }
        setChildren(element, children = iterator_1.Iterable.empty(), options) {
            this.model.setChildren(element, children, options);
        }
        createModel(user, view, options) {
            return new compressedObjectTreeModel_1.CompressibleObjectTreeModel(user, view, options);
        }
        updateOptions(optionsUpdate = {}) {
            super.updateOptions(optionsUpdate);
            if (typeof optionsUpdate.compressionEnabled !== 'undefined') {
                this.model.setCompressionEnabled(optionsUpdate.compressionEnabled);
            }
        }
        getCompressedTreeNode(element = null) {
            return this.model.getCompressedTreeNode(element);
        }
    }
    exports.CompressibleObjectTree = CompressibleObjectTree;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0VHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL3RyZWUvb2JqZWN0VHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7SUFtQ2hHLE1BQWEsVUFBMkQsU0FBUSwyQkFBNkM7UUFJNUgsSUFBYSx3QkFBd0IsS0FBOEQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztRQUVoSixZQUNvQixJQUFZLEVBQy9CLFNBQXNCLEVBQ3RCLFFBQWlDLEVBQ2pDLFNBQStDLEVBQy9DLFVBQThDLEVBQUU7WUFFaEQsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxPQUFvRCxDQUFDLENBQUM7WUFOL0UsU0FBSSxHQUFKLElBQUksQ0FBUTtRQU9oQyxDQUFDO1FBRUQsV0FBVyxDQUFDLE9BQWlCLEVBQUUsV0FBNEMsbUJBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUEwQztZQUN0SSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxRQUFRLENBQUMsT0FBVztZQUNuQixJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsbUJBQW1CLENBQUMsT0FBVSxFQUFFLE1BQTBCO1lBQ3pELElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLE1BQU0s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