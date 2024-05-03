/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/errors", "vs/base/common/lifecycle"], function (require, exports, dom_1, errors_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeEditorContributions = void 0;
    class CodeEditorContributions extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._editor = null;
            this._instantiationService = null;
            /**
             * Contains all instantiated contributions.
             */
            this._instances = this._register(new lifecycle_1.DisposableMap());
            /**
             * Contains contributions which are not yet instantiated.
             */
            this._pending = new Map();
            /**
             * Tracks which instantiation kinds are still left in `_pending`.
             */
            this._finishedInstantiation = [];
            this._finishedInstantiation[0 /* EditorContributionInstantiation.Eager */] = false;
            this._finishedInstantiation[1 /* EditorContributionInstantiation.AfterFirstRender */] = false;
            this._finishedInstantiation[2 /* EditorContributionInstantiation.BeforeFirstInteraction */] = false;
            this._finishedInstantiation[3 /* EditorContributionInstantiation.Eventually */] = false;
        }
        initialize(editor, contributions, instantiationService) {
            this._editor = editor;
            this._instantiationService = instantiationService;
            for (const desc of contributions) {
                if (this._pending.has(desc.id)) {
                    (0, errors_1.onUnexpectedError)(new Error(`Cannot have two contributions with the same id ${desc.id}`));
                    continue;
                }
                this._pending.set(desc.id, desc);
            }
            this._instantiateSome(0 /* EditorContributionInstantiation.Eager */);
            // AfterFirstRender
            // - these extensions will be instantiated at the latest 50ms after the first render.
            // - but if there is idle time, we will instantiate them sooner.
            this._register((0, dom_1.runWhenWindowIdle)((0, dom_1.getWindow)(this._editor.getDomNode()), () => {
                this._instantiateSome(1 /* EditorContributionInstantiation.AfterFirstRender */);
            }));
            // BeforeFirstInteraction
            // - these extensions will be instantiated at the latest before a mouse or a keyboard event.
            // - but if there is idle time, we will instantiate them sooner.
            this._register((0, dom_1.runWhenWindowIdle)((0, dom_1.getWindow)(this._editor.getDomNode()), () => {
                this._instantiateSome(2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
            }));
            // Eventually
            // - these extensions will only be instantiated when there is idle time.
            // - since there is no guarantee that there will ever be idle time, we set a timeout of 5s here.
            this._register((0, dom_1.runWhenWindowIdle)((0, dom_1.getWindow)(this._editor.getDomNode()), () => {
                this._instantiateSome(3 /* EditorContributionInstantiation.Eventually */);
            }, 5000));
        }
        saveViewState() {
            const contributionsState = {};
            for (const [id, contribution] of this._instances) {
                if (typeof contribution.saveViewState === 'function') {
                    contributionsState[id] = contribution.saveViewState();
                }
            }
            return contributionsState;
        }
        restoreViewState(contributionsState) {
            for (const [id, contribution] of this._instances) {
                if (typeof contribution.restoreViewState === 'function') {
                    contribution.restoreViewState(contributionsState[id]);
                }
            }
        }
        get(id) {
            this._instantiateById(id);
            return this._instances.get(id) || null;
        }
        /**
         * used by tests
         */
        set(id, value) {
            this._instances.set(id, value);
        }
        onBeforeInteractionEvent() {
            // this method is called very often by the editor!
            this._instantiateSome(2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
        }
        onAfterModelAttached() {
            return (0, dom_1.runWhenWindowIdle)((0, dom_1.getWindow)(this._editor?.getDomNode()), () => {
                this._instantiateSome(1 /* EditorContributionInstantiation.AfterFirstRender */);
            }, 50);
        }
        _instantiateSome(instantiation) {
            if (this._finishedInstantiation[instantiation]) {
                // already done with this instantiation!
                return;
            }
            this._finishedInstantiation[instantiation] = true;
            const contribs = this._findPendingContributionsByInstantiation(instantiation);
            for (const contrib of contribs) {
                this._instantiateById(contrib.id);
            }
        }
        _findPendingContributionsByInstantiation(instantiation) {
            const result = [];
            for (const [, desc] of this._pending) {
                if (desc.instantiation === instantiation) {
                    result.push(desc);
                }
            }
            return result;
        }
        _instantiateById(id) {
            const desc = this._pending.get(id);
            if (!desc) {
                return;
            }
            this._pending.delete(id);
            if (!this._instantiationService || !this._editor) {
                throw new Error(`Cannot instantiate contributions before being initialized!`);
            }
            try {
                const instance = this._instantiationService.createInstance(desc.ctor, this._editor);
                this._instances.set(desc.id, instance);
                if (typeof instance.restoreViewState === 'function' && desc.instantiation !== 0 /* EditorContributionInstantiation.Eager */) {
                    console.warn(`Editor contribution '${desc.id}' should be eager instantiated because it uses saveViewState / restoreViewState.`);
                }
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
            }
        }
    }
    exports.CodeEditorContributions = CodeEditorContributions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUVkaXRvckNvbnRyaWJ1dGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9jb2RlRWRpdG9yL2NvZGVFZGl0b3JDb250cmlidXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLHVCQUF3QixTQUFRLHNCQUFVO1FBa0J0RDtZQUdDLEtBQUssRUFBRSxDQUFDO1lBbkJELFlBQU8sR0FBdUIsSUFBSSxDQUFDO1lBQ25DLDBCQUFxQixHQUFpQyxJQUFJLENBQUM7WUFFbkU7O2VBRUc7WUFDYyxlQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFhLEVBQStCLENBQUMsQ0FBQztZQUMvRjs7ZUFFRztZQUNjLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBMEMsQ0FBQztZQUM5RTs7ZUFFRztZQUNjLDJCQUFzQixHQUFjLEVBQUUsQ0FBQztZQU92RCxJQUFJLENBQUMsc0JBQXNCLCtDQUF1QyxHQUFHLEtBQUssQ0FBQztZQUMzRSxJQUFJLENBQUMsc0JBQXNCLDBEQUFrRCxHQUFHLEtBQUssQ0FBQztZQUN0RixJQUFJLENBQUMsc0JBQXNCLGdFQUF3RCxHQUFHLEtBQUssQ0FBQztZQUM1RixJQUFJLENBQUMsc0JBQXNCLG9EQUE0QyxHQUFHLEtBQUssQ0FBQztRQUNqRixDQUFDO1FBRU0sVUFBVSxDQUFDLE1BQW1CLEVBQUUsYUFBK0MsRUFBRSxvQkFBMkM7WUFDbEksSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLHFCQUFxQixHQUFHLG9CQUFvQixDQUFDO1lBRWxELEtBQUssTUFBTSxJQUFJLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQ2xDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFH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