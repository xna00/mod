/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorModel = void 0;
    /**
     * The editor model is the heavyweight counterpart of editor input. Depending on the editor input, it
     * resolves from a file system retrieve content and may allow for saving it back or reverting it.
     * Editor models are typically cached for some while because they are expensive to construct.
     */
    class EditorModel extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this.resolved = false;
        }
        /**
         * Causes this model to resolve returning a promise when loading is completed.
         */
        async resolve() {
            this.resolved = true;
        }
        /**
         * Returns whether this model was loaded or not.
         */
        isResolved() {
            return this.resolved;
        }
        /**
         * Find out if this model has been disposed.
         */
        isDisposed() {
            return this._store.isDisposed;
        }
        /**
         * Subclasses should implement to free resources that have been claimed through loading.
         */
        dispose() {
            this._onWillDispose.fire();
            super.dispose();
        }
    }
    exports.EditorModel = EditorModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vZWRpdG9yL2VkaXRvck1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRzs7OztPQUlHO0lBQ0gsTUFBYSxXQUFZLFNBQVEsc0JBQVU7UUFBM0M7O1lBRWtCLG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDN0Qsa0JBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUUzQyxhQUFRLEdBQUcsS0FBSyxDQUFDO1FBK0IxQixDQUFDO1FBN0JBOztXQUVHO1FBQ0gsS0FBSyxDQUFDLE9BQU87WUFDWixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUN0QixDQUFDO1FBRUQ7O1dBRUc7UUFDSCxVQUFVO1lBQ1QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFFRDs7V0FFRztRQUNILFVBQVU7WUFDVCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQy9CLENBQUM7UUFFRDs7V0FFRztRQUNNLE9BQU87WUFDZixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRTNCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBQ0Q7SUFwQ0Qsa0NBb0NDIn0=