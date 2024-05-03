/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/worker/simpleWorker", "vs/editor/common/services/editorSimpleWorker"], function (require, exports, simpleWorker_1, editorSimpleWorker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initialize = initialize;
    let initialized = false;
    function initialize(foreignModule) {
        if (initialized) {
            return;
        }
        initialized = true;
        const simpleWorker = new simpleWorker_1.SimpleWorkerServer((msg) => {
            globalThis.postMessage(msg);
        }, (host) => new editorSimpleWorker_1.EditorSimpleWorker(host, foreignModule));
        globalThis.onmessage = (e) => {
            simpleWorker.onmessage(e.data);
        };
    }
    globalThis.onmessage = (e) => {
        // Ignore first message in this case and initialize if not yet initialized
        if (!initialized) {
            initialize(null);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLndvcmtlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2VkaXRvci53b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsZ0NBYUM7SUFmRCxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFFeEIsU0FBZ0IsVUFBVSxDQUFDLGFBQWtCO1FBQzVDLElBQUksV0FBVyxFQUFFLENBQUM7WUFDakIsT0FBTztRQUNSLENBQUM7UUFDRCxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBRW5CLE1BQU0sWUFBWSxHQUFHLElBQUksaUNBQWtCLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNuRCxVQUFVLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUMsRUFBRSxDQUFDLElBQXVCLEVBQUUsRUFBRSxDQUFDLElBQUksdUNBQWtCLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFFN0UsVUFBVSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQWUsRUFBRSxFQUFFO1lBQzFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQztJQUNILENBQUM7SUFFRCxVQUFVLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBZSxFQUFFLEVBQUU7UUFDMUMsMEVBQTBFO1FBQzFFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNsQixVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEIsQ0FBQztJQUNGLENBQUMsQ0FBQyJ9