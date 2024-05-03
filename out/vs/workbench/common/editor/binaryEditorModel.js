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
define(["require", "exports", "vs/workbench/common/editor/editorModel", "vs/platform/files/common/files", "vs/base/common/mime"], function (require, exports, editorModel_1, files_1, mime_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BinaryEditorModel = void 0;
    /**
     * An editor model that just represents a resource that can be loaded.
     */
    let BinaryEditorModel = class BinaryEditorModel extends editorModel_1.EditorModel {
        constructor(resource, name, fileService) {
            super();
            this.resource = resource;
            this.name = name;
            this.fileService = fileService;
            this.mime = mime_1.Mimes.binary;
        }
        /**
         * The name of the binary resource.
         */
        getName() {
            return this.name;
        }
        /**
         * The size of the binary resource if known.
         */
        getSize() {
            return this.size;
        }
        /**
         * The mime of the binary resource if known.
         */
        getMime() {
            return this.mime;
        }
        /**
         * The etag of the binary resource if known.
         */
        getETag() {
            return this.etag;
        }
        async resolve() {
            // Make sure to resolve up to date stat for file resources
            if (this.fileService.hasProvider(this.resource)) {
                const stat = await this.fileService.stat(this.resource);
                this.etag = stat.etag;
                if (typeof stat.size === 'number') {
                    this.size = stat.size;
                }
            }
            return super.resolve();
        }
    };
    exports.BinaryEditorModel = BinaryEditorModel;
    exports.BinaryEditorModel = BinaryEditorModel = __decorate([
        __param(2, files_1.IFileService)
    ], BinaryEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluYXJ5RWRpdG9yTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vZWRpdG9yL2JpbmFyeUVkaXRvck1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQU9oRzs7T0FFRztJQUNJLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEseUJBQVc7UUFPakQsWUFDVSxRQUFhLEVBQ0wsSUFBWSxFQUNmLFdBQTBDO1lBRXhELEtBQUssRUFBRSxDQUFDO1lBSkMsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUNMLFNBQUksR0FBSixJQUFJLENBQVE7WUFDRSxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQVJ4QyxTQUFJLEdBQUcsWUFBSyxDQUFDLE1BQU0sQ0FBQztRQVdyQyxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxPQUFPO1lBQ04sT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2xCLENBQUM7UUFFRDs7V0FFRztRQUNILE9BQU87WUFDTixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDbEIsQ0FBQztRQUVEOztXQUVHO1FBQ0gsT0FBTztZQUNOLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDO1FBRUQ7O1dBRUc7UUFDSCxPQUFPO1lBQ04sT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2xCLENBQUM7UUFFUSxLQUFLLENBQUMsT0FBTztZQUVyQiwwREFBMEQ7WUFDMUQsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDakQsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3hELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDdEIsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ25DLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDdkIsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4QixDQUFDO0tBQ0QsQ0FBQTtJQXhEWSw4Q0FBaUI7Z0NBQWpCLGlCQUFpQjtRQVUzQixXQUFBLG9CQUFZLENBQUE7T0FWRixpQkFBaUIsQ0F3RDdCIn0=