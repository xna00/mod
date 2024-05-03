/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/component", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/types", "vs/base/common/lifecycle", "vs/css!./media/part"], function (require, exports, component_1, dom_1, event_1, types_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiWindowParts = exports.Part = void 0;
    /**
     * Parts are layed out in the workbench and have their own layout that
     * arranges an optional title and mandatory content area to show content.
     */
    class Part extends component_1.Component {
        get dimension() { return this._dimension; }
        get contentPosition() { return this._contentPosition; }
        constructor(id, options, themeService, storageService, layoutService) {
            super(id, themeService, storageService);
            this.options = options;
            this.layoutService = layoutService;
            this._onDidVisibilityChange = this._register(new event_1.Emitter());
            this.onDidVisibilityChange = this._onDidVisibilityChange.event;
            //#region ISerializableView
            this._onDidChange = this._register(new event_1.Emitter());
            this._register(layoutService.registerPart(this));
        }
        onThemeChange(theme) {
            // only call if our create() method has been called
            if (this.parent) {
                super.onThemeChange(theme);
            }
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Called to create title and content area of the part.
         */
        create(parent, options) {
            this.parent = parent;
            this.titleArea = this.createTitleArea(parent, options);
            this.contentArea = this.createContentArea(parent, options);
            this.partLayout = new PartLayout(this.options, this.contentArea);
            this.updateStyles();
        }
        /**
         * Returns the overall part container.
         */
        getContainer() {
            return this.parent;
        }
        /**
         * Subclasses override to provide a title area implementation.
         */
        createTitleArea(parent, options) {
            return undefined;
        }
        /**
         * Returns the title area container.
         */
        getTitleArea() {
            return this.titleArea;
        }
        /**
         * Subclasses override to provide a content area implementation.
         */
        createContentArea(parent, options) {
            return undefined;
        }
        /**
         * Returns the content area container.
         */
        getContentArea() {
            return this.contentArea;
        }
        /**
         * Sets the header area
         */
        setHeaderArea(headerContainer) {
            if (this.headerArea) {
                throw new Error('Header already exists');
            }
            if (!this.parent || !this.titleArea) {
                return;
            }
            (0, dom_1.prepend)(this.parent, headerContainer);
            headerContainer.classList.add('header-or-footer');
            headerContainer.classList.add('header');
            this.headerArea = headerContainer;
            this.partLayout?.setHeaderVisibility(true);
            this.relayout();
        }
        /**
         * Sets the footer area
         */
        setFooterArea(footerContainer) {
            if (this.footerArea) {
                throw new Error('Footer already exists');
            }
            if (!this.parent || !this.titleArea) {
                return;
            }
            this.parent.appendChild(footerContainer);
            footerContainer.classList.add('header-or-footer');
            footerContainer.classList.add('footer');
            this.footerArea = footerContainer;
            this.partLayout?.setFooterVisibility(true);
            this.relayout();
        }
        /**
         * removes the header area
         */
        removeHeaderArea() {
            if (this.headerArea) {
                this.headerArea.remove();
                this.headerArea = undefined;
                this.partLayout?.setHeaderVisibility(false);
                this.relayout();
            }
        }
        /**
         * removes the footer area
         */
        removeFooterArea() {
            if (this.footerArea) {
                this.footerArea.remove();
                this.footerArea = undefined;
                this.partLayout?.setFooterVisibility(false);
                this.relayout();
            }
        }
        relayout() {
            if (this.dimension && this.contentPosition) {
                this.layout(this.dimension.width, this.dimension.height, this.contentPosition.top, this.contentPosition.left);
            }
        }
        /**
         * Layout title and content area in the given dimension.
         */
        layoutContents(width, height) {
            const partLayout = (0, types_1.assertIsDefined)(this.partLayout);
            return partLayout.layout(width, height);
        }
        get onDidChange() { return this._onDidChange.event; }
        layout(width, height, top, left) {
            this._dimension = new dom_1.Dimension(width, height);
            this._contentPosition = { top, left };
        }
        setVisible(visible) {
            this._onDidVisibilityChange.fire(visible);
        }
    }
    exports.Part = Part;
    class PartLayout {
        static { this.HEADER_HEIGHT = 35; }
        static { this.TITLE_HEIGHT = 35; }
        static { this.Footer_HEIGHT = 35; }
        constructor(options, contentArea) {
            this.options = options;
            this.contentArea = contentArea;
            this.headerVisible = false;
            this.footerVisible = false;
        }
        layout(width, height) {
            // Title Size: Width (Fill), Height (Variable)
            let titleSize;
            if (this.options.hasTitle) {
                titleSize = new dom_1.Dimension(width, Math.min(height, PartLayout.TITLE_HEIGHT));
            }
            else {
                titleSize = dom_1.Dimension.None;
            }
            // Header Size: Width (Fill), Height (Variable)
            let headerSize;
            if (this.headerVisible) {
                headerSize = new dom_1.Dimension(width, Math.min(height, PartLayout.HEADER_HEIGHT));
            }
            else {
                headerSize = dom_1.Dimension.None;
            }
            // Footer Size: Width (Fill), Height (Variable)
            let footerSize;
            if (this.footerVisible) {
                footerSize = new dom_1.Dimension(width, Math.min(height, PartLayout.Footer_HEIGHT));
            }
            else {
                footerSize = dom_1.Dimension.None;
            }
            let contentWidth = width;
            if (this.options && typeof this.options.borderWidth === 'function') {
                contentWidth -= this.options.borderWidth(); // adjust for border size
            }
            // Content Size: Width (Fill), Height (Variable)
            const contentSize = new dom_1.Dimension(contentWidth, height - titleSize.height - headerSize.height - footerSize.height);
            // Content
            if (this.contentArea) {
                (0, dom_1.size)(this.contentArea, contentSize.width, contentSize.height);
            }
            return { headerSize, titleSize, contentSize, footerSize };
        }
        setFooterVisibility(visible) {
            this.footerVisible = visible;
        }
        setHeaderVisibility(visible) {
            this.headerVisible = visible;
        }
    }
    class MultiWindowParts extends component_1.Component {
        constructor() {
            super(...arguments);
            this._parts = new Set();
        }
        get parts() { return Array.from(this._parts); }
        registerPart(part) {
            this._parts.add(part);
            return (0, lifecycle_1.toDisposable)(() => this.unregisterPart(part));
        }
        unregisterPart(part) {
            this._parts.delete(part);
        }
        getPart(container) {
            return this.getPartByDocument(container.ownerDocument);
        }
        getPartByDocument(document) {
            if (this._parts.size > 1) {
                for (const part of this._parts) {
                    if (part.element?.ownerDocument === document) {
                        return part;
                    }
                }
            }
            return this.mainPart;
        }
        get activePart() {
            return this.getPartByDocument((0, dom_1.getActiveDocument)());
        }
    }
    exports.MultiWindowParts = MultiWindowParts;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5QmhHOzs7T0FHRztJQUNILE1BQXNCLElBQUssU0FBUSxxQkFBUztRQUczQyxJQUFJLFNBQVMsS0FBNEIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUdsRSxJQUFJLGVBQWUsS0FBK0IsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBWWpGLFlBQ0MsRUFBVSxFQUNGLE9BQXFCLEVBQzdCLFlBQTJCLEVBQzNCLGNBQStCLEVBQ1osYUFBc0M7WUFFekQsS0FBSyxDQUFDLEVBQUUsRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFMaEMsWUFBTyxHQUFQLE9BQU8sQ0FBYztZQUdWLGtCQUFhLEdBQWIsYUFBYSxDQUF5QjtZQWZoRCwyQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFXLENBQUMsQ0FBQztZQUNqRSwwQkFBcUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBZ0tuRSwyQkFBMkI7WUFFakIsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF5QixDQUFDLENBQUM7WUFoSjdFLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFa0IsYUFBYSxDQUFDLEtBQWtCO1lBRWxELG1EQUFtRDtZQUNuRCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakIsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1QixDQUFD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