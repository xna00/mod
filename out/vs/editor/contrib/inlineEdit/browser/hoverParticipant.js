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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/contrib/hover/browser/hoverTypes", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/editor/contrib/inlineEdit/browser/inlineEditController", "vs/editor/contrib/inlineEdit/browser/inlineEditHintsWidget"], function (require, exports, lifecycle_1, observable_1, hoverTypes_1, instantiation_1, telemetry_1, inlineEditController_1, inlineEditHintsWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineEditHoverParticipant = exports.InlineEditHover = void 0;
    class InlineEditHover {
        constructor(owner, range, controller) {
            this.owner = owner;
            this.range = range;
            this.controller = controller;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.InlineEditHover = InlineEditHover;
    let InlineEditHoverParticipant = class InlineEditHoverParticipant {
        constructor(_editor, _instantiationService, _telemetryService) {
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._telemetryService = _telemetryService;
            this.hoverOrdinal = 5;
        }
        suggestHoverAnchor(mouseEvent) {
            const controller = inlineEditController_1.InlineEditController.get(this._editor);
            if (!controller) {
                return null;
            }
            const target = mouseEvent.target;
            if (target.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */) {
                // handle the case where the mouse is over the view zone
                const viewZoneData = target.detail;
                if (controller.shouldShowHoverAtViewZone(viewZoneData.viewZoneId)) {
                    // const range = Range.fromPositions(this._editor.getModel()!.validatePosition(viewZoneData.positionBefore || viewZoneData.position));
                    const range = target.range;
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, range, mouseEvent.event.posx, mouseEvent.event.posy, false);
                }
            }
            if (target.type === 7 /* MouseTargetType.CONTENT_EMPTY */) {
                // handle the case where the mouse is over the empty portion of a line following ghost text
                if (controller.shouldShowHoverAt(target.range)) {
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, target.range, mouseEvent.event.posx, mouseEvent.event.posy, false);
                }
            }
            if (target.type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                // handle the case where the mouse is directly over ghost text
                const mightBeForeignElement = target.detail.mightBeForeignElement;
                if (mightBeForeignElement && controller.shouldShowHoverAt(target.range)) {
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, target.range, mouseEvent.event.posx, mouseEvent.event.posy, false);
                }
            }
            return null;
        }
        computeSync(anchor, lineDecorations) {
            if (this._editor.getOption(63 /* EditorOption.inlineEdit */).showToolbar !== 'onHover') {
                return [];
            }
            const controller = inlineEditController_1.InlineEditController.get(this._editor);
            if (controller && controller.shouldShowHoverAt(anchor.range)) {
                return [new InlineEditHover(this, anchor.range, controller)];
            }
            return [];
        }
        renderHoverParts(context, hoverParts) {
            const disposableStore = new lifecycle_1.DisposableStore();
            this._telemetryService.publicLog2('inlineEditHover.shown');
            const w = this._instantiationService.createInstance(inlineEditHintsWidget_1.InlineEditHintsContentWidget, this._editor, false, (0, observable_1.constObservable)(null));
            context.fragment.appendChild(w.getDomNode());
            disposableStore.add(w);
            return disposableStore;
        }
    };
    exports.InlineEditHoverParticipant = InlineEditHoverParticipant;
    exports.InlineEditHoverParticipant = InlineEditHoverParticipant = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, telemetry_1.ITelemetryService)
    ], InlineEditHoverParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJQYXJ0aWNpcGFudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5saW5lRWRpdC9icm93c2VyL2hvdmVyUGFydGljaXBhbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY2hHLE1BQWEsZUFBZTtRQUMzQixZQUNpQixLQUErQyxFQUMvQyxLQUFZLEVBQ1osVUFBZ0M7WUFGaEMsVUFBSyxHQUFMLEtBQUssQ0FBMEM7WUFDL0MsVUFBSyxHQUFMLEtBQUssQ0FBTztZQUNaLGVBQVUsR0FBVixVQUFVLENBQXNCO1FBQzdDLENBQUM7UUFFRSxxQkFBcUIsQ0FBQyxNQUFtQjtZQUMvQyxPQUFPLENBQ04sTUFBTSxDQUFDLElBQUksa0NBQTBCO21CQUNsQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVc7bUJBQ2xELElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUNqRCxDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBZEQsMENBY0M7SUFFTSxJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEwQjtRQUl0QyxZQUNrQixPQUFvQixFQUNkLHFCQUE2RCxFQUNqRSxpQkFBcUQ7WUFGdkQsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNHLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDaEQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUx6RCxpQkFBWSxHQUFXLENBQUMsQ0FBQztRQU96QyxDQUFDO1FBRUQsa0JBQWtCLENBQUMsVUFBNkI7WUFDL0MsTUFBTSxVQUFVLEdBQUcsMkNBQW9CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZ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