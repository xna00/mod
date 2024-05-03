/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerEditorFeature = registerEditorFeature;
    exports.getEditorFeatures = getEditorFeatures;
    const editorFeatures = [];
    /**
     * Registers an editor feature. Editor features will be instantiated only once, as soon as
     * the first code editor is instantiated.
     */
    function registerEditorFeature(ctor) {
        editorFeatures.push(ctor);
    }
    function getEditorFeatures() {
        return editorFeatures.slice(0);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRmVhdHVyZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vZWRpdG9yRmVhdHVyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLHNEQUVDO0lBRUQsOENBRUM7SUFaRCxNQUFNLGNBQWMsR0FBd0IsRUFBRSxDQUFDO0lBRS9DOzs7T0FHRztJQUNILFNBQWdCLHFCQUFxQixDQUFvQyxJQUFvRDtRQUM1SCxjQUFjLENBQUMsSUFBSSxDQUFDLElBQXlCLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQsU0FBZ0IsaUJBQWlCO1FBQ2hDLE9BQU8sY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoQyxDQUFDIn0=