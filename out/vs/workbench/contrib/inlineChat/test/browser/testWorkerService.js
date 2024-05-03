var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/test/common/mock", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/base/common/types", "vs/editor/common/services/editorSimpleWorker", "vs/editor/common/core/lineRange", "vs/editor/common/diff/linesDiffComputer", "vs/editor/common/diff/rangeMapping"], function (require, exports, mock_1, range_1, model_1, types_1, editorSimpleWorker_1, lineRange_1, linesDiffComputer_1, rangeMapping_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestWorkerService = void 0;
    let TestWorkerService = class TestWorkerService extends (0, mock_1.mock)() {
        constructor(_modelService) {
            super();
            this._modelService = _modelService;
            this._worker = new editorSimpleWorker_1.EditorSimpleWorker(null, null);
        }
        async computeMoreMinimalEdits(resource, edits, pretty) {
            return undefined;
        }
        async computeDiff(original, modified, options, algorithm) {
            const originalModel = this._modelService.getModel(original);
            const modifiedModel = this._modelService.getModel(modified);
            (0, types_1.assertType)(originalModel);
            (0, types_1.assertType)(modifiedModel);
            this._worker.acceptNewModel({
                url: originalModel.uri.toString(),
                versionId: originalModel.getVersionId(),
                lines: originalModel.getLinesContent(),
                EOL: originalModel.getEOL(),
            });
            this._worker.acceptNewModel({
                url: modifiedModel.uri.toString(),
                versionId: modifiedModel.getVersionId(),
                lines: modifiedModel.getLinesContent(),
                EOL: modifiedModel.getEOL(),
            });
            const result = await this._worker.computeDiff(originalModel.uri.toString(), modifiedModel.uri.toString(), options, algorithm);
            if (!result) {
                return result;
            }
            // Convert from space efficient JSON data to rich objects.
            const diff = {
                identical: result.identical,
                quitEarly: result.quitEarly,
                changes: toLineRangeMappings(result.changes),
                moves: result.moves.map(m => new linesDiffComputer_1.MovedText(new rangeMapping_1.LineRangeMapping(new lineRange_1.LineRange(m[0], m[1]), new lineRange_1.LineRange(m[2], m[3])), toLineRangeMappings(m[4])))
            };
            return diff;
            function toLineRangeMappings(changes) {
                return changes.map((c) => new rangeMapping_1.DetailedLineRangeMapping(new lineRange_1.LineRange(c[0], c[1]), new lineRange_1.LineRange(c[2], c[3]), c[4]?.map((c) => new rangeMapping_1.RangeMapping(new range_1.Range(c[0], c[1], c[2], c[3]), new range_1.Range(c[4], c[5], c[6], c[7])))));
            }
        }
    };
    exports.TestWorkerService = TestWorkerService;
    exports.TestWorkerService = TestWorkerService = __decorate([
        __param(0, model_1.IModelService)
    ], TestWorkerService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFdvcmtlclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvdGVzdC9icm93c2VyL3Rlc3RXb3JrZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFrQk8sSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSxJQUFBLFdBQUksR0FBd0I7UUFJbEUsWUFBMkIsYUFBNkM7WUFDdkUsS0FBSyxFQUFFLENBQUM7WUFEbUMsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFGdkQsWUFBTyxHQUFHLElBQUksdUNBQWtCLENBQUMsSUFBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBSS9ELENBQUM7UUFFUSxLQUFLLENBQUMsdUJBQXVCLENBQUMsUUFBYSxFQUFFLEtBQW9DLEVBQUUsTUFBNEI7WUFDdkgsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVRLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBYSxFQUFFLFFBQWEsRUFBRSxPQUFxQyxFQUFFLFNBQTRCO1lBRTNILE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzVELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTVELElBQUEsa0JBQVUsRUFBQyxhQUFhLENBQUMsQ0FBQztZQUMxQixJQUFBLGtCQUFVLEVBQUMsYUFBYSxDQUFDLENBQUM7WUFFMUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUM7Z0JBQzNCLEdBQUcsRUFBRSxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRTtnQkFDakMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxZQUFZLEVBQUU7Z0JB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