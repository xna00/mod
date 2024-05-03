/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/services/languagesRegistry"], function (require, exports, assert, languagesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertCleanState = assertCleanState;
    /**
     * This function is called before test running and also again at the end of test running
     * and can be used to add assertions. e.g. that registries are empty, etc.
     *
     * !! This is called directly by the testing framework.
     *
     * @skipMangle
     */
    function assertCleanState() {
        // If this test fails, it is a clear indication that
        // your test or suite is leaking services (e.g. via leaking text models)
        // assert.strictEqual(LanguageService.instanceCount, 0, 'No leaking ILanguageService');
        assert.strictEqual(languagesRegistry_1.LanguagesRegistry.instanceCount, 0, 'Error: Test run should not leak in LanguagesRegistry.');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC90ZXN0L2NvbW1vbi91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyw0Q0FLQztJQWJEOzs7Ozs7O09BT0c7SUFDSCxTQUFnQixnQkFBZ0I7UUFDL0Isb0RBQW9EO1FBQ3BELHdFQUF3RTtRQUN4RSx1RkFBdUY7UUFDdkYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxxQ0FBaUIsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxFQUFFLHVEQUF1RCxDQUFDLENBQUM7SUFDakgsQ0FBQyJ9