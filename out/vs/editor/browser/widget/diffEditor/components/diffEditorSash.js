/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/sash/sash", "vs/base/common/lifecycle", "vs/base/common/observable"], function (require, exports, sash_1, lifecycle_1, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorSash = void 0;
    class DiffEditorSash extends lifecycle_1.Disposable {
        constructor(_options, _domNode, _dimensions, _sashes) {
            super();
            this._options = _options;
            this._domNode = _domNode;
            this._dimensions = _dimensions;
            this._sashes = _sashes;
            this._sashRatio = (0, observable_1.observableValue)(this, undefined);
            this.sashLeft = (0, observable_1.derived)(this, reader => {
                const ratio = this._sashRatio.read(reader) ?? this._options.splitViewDefaultRatio.read(reader);
                return this._computeSashLeft(ratio, reader);
            });
            this._sash = this._register(new sash_1.Sash(this._domNode, {
                getVerticalSashTop: (_sash) => 0,
                getVerticalSashLeft: (_sash) => this.sashLeft.get(),
                getVerticalSashHeight: (_sash) => this._dimensions.height.get(),
            }, { orientation: 0 /* Orientation.VERTICAL */ }));
            this._startSashPosition = undefined;
            this._register(this._sash.onDidStart(() => {
                this._startSashPosition = this.sashLeft.get();
            }));
            this._register(this._sash.onDidChange((e) => {
                const contentWidth = this._dimensions.width.get();
                const sashPosition = this._computeSashLeft((this._startSashPosition + (e.currentX - e.startX)) / contentWidth, undefined);
                this._sashRatio.set(sashPosition / contentWidth, undefined);
            }));
            this._register(this._sash.onDidEnd(() => this._sash.layout()));
            this._register(this._sash.onDidReset(() => this._sashRatio.set(undefined, undefined)));
            this._register((0, observable_1.autorun)(reader => {
                const sashes = this._sashes.read(reader);
                if (sashes) {
                    this._sash.orthogonalEndSash = sashes.bottom;
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description DiffEditorSash.layoutSash */
                const enabled = this._options.enableSplitViewResizing.read(reader);
                this._sash.state = enabled ? 3 /* SashState.Enabled */ : 0 /* SashState.Disabled */;
                this.sashLeft.read(reader);
                this._dimensions.height.read(reader);
                this._sash.layout();
            }));
        }
        /** @pure */
        _computeSashLeft(desiredRatio, reader) {
            const contentWidth = this._dimensions.width.read(reader);
            const midPoint = Math.floor(this._options.splitViewDefaultRatio.read(reader) * contentWidth);
            const sashLeft = this._options.enableSplitViewResizing.read(reader) ? Math.floor(desiredRatio * contentWidth) : midPoint;
            const MINIMUM_EDITOR_WIDTH = 100;
            if (contentWidth <= MINIMUM_EDITOR_WIDTH * 2) {
                return midPoint;
            }
            if (sashLeft < MINIMUM_EDITOR_WIDTH) {
                return MINIMUM_EDITOR_WIDTH;
            }
            if (sashLeft > contentWidth - MINIMUM_EDITOR_WIDTH) {
                return contentWidth - MINIMUM_EDITOR_WIDTH;
            }
            return sashLeft;
        }
    }
    exports.DiffEditorSash = DiffEditorSash;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvclNhc2guanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2NvbXBvbmVudHMvZGlmZkVkaXRvclNhc2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQWEsY0FBZSxTQUFRLHNCQUFVO1FBZ0I3QyxZQUNrQixRQUEyQixFQUMzQixRQUFxQixFQUNyQixXQUF3RSxFQUN4RSxPQUF1RDtZQUV4RSxLQUFLLEVBQUUsQ0FBQztZQUxTLGFBQVEsR0FBUixRQUFRLENBQW1CO1lBQzNCLGFBQVEsR0FBUixRQUFRLENBQWE7WUFDckIsZ0JBQVcsR0FBWCxXQUFXLENBQTZEO1lBQ3hFLFlBQU8sR0FBUCxPQUFPLENBQWdEO1lBbkJ4RCxlQUFVLEdBQUcsSUFBQSw0QkFBZSxFQUFxQixJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFbkUsYUFBUSxHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ2pELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMvRixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0MsQ0FBQyxDQUFDLENBQUM7WUFFYyxVQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLFdBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUMvRCxrQkFBa0IsRUFBRSxDQUFDLEtBQVcsRUFBVSxFQUFFLENBQUMsQ0FBQztnQkFDOUMsbUJBQW1CLEVBQUUs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