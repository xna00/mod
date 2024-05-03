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
define(["require", "exports", "vs/base/common/assert", "vs/editor/common/services/editorWorker", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/utils"], function (require, exports, assert_1, editorWorker_1, configuration_1, lineRange_1, mapping_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeDiffComputer = void 0;
    exports.toLineRange = toLineRange;
    exports.toRangeMapping = toRangeMapping;
    let MergeDiffComputer = class MergeDiffComputer {
        constructor(editorWorkerService, configurationService) {
            this.editorWorkerService = editorWorkerService;
            this.configurationService = configurationService;
            this.mergeAlgorithm = (0, utils_1.observableConfigValue)('mergeEditor.diffAlgorithm', 'advanced', this.configurationService)
                .map(v => v === 'smart' ? 'legacy' : v === 'experimental' ? 'advanced' : v);
        }
        async computeDiff(textModel1, textModel2, reader) {
            const diffAlgorithm = this.mergeAlgorithm.read(reader);
            const inputVersion = textModel1.getVersionId();
            const outputVersion = textModel2.getVersionId();
            const result = await this.editorWorkerService.computeDiff(textModel1.uri, textModel2.uri, {
                ignoreTrimWhitespace: false,
                maxComputationTimeMs: 0,
                computeMoves: false,
            }, diffAlgorithm);
            if (!result) {
                throw new Error('Diff computation failed');
            }
            if (textModel1.isDisposed() || textModel2.isDisposed()) {
                return { diffs: null };
            }
            const changes = result.changes.map(c => new mapping_1.DetailedLineRangeMapping(toLineRange(c.original), textModel1, toLineRange(c.modified), textModel2, c.innerChanges?.map(ic => toRangeMapping(ic))));
            const newInputVersion = textModel1.getVersionId();
            const newOutputVersion = textModel2.getVersionId();
            if (inputVersion !== newInputVersion || outputVersion !== newOutputVersion) {
                return { diffs: null };
            }
            (0, assert_1.assertFn)(() => {
                for (const c of changes) {
                    const inputRange = c.inputRange;
                    const outputRange = c.outputRange;
                    const inputTextModel = c.inputTextModel;
                    const outputTextModel = c.outputTextModel;
                    for (const map of c.rangeMappings) {
                        let inputRangesValid = inputRange.startLineNumber - 1 <= map.inputRange.startLineNumber
                            && map.inputRange.endLineNumber <= inputRange.endLineNumberExclusive;
                        if (inputRangesValid && map.inputRange.startLineNumber === inputRange.startLineNumber - 1) {
                            inputRangesValid = map.inputRange.endColumn >= inputTextModel.getLineMaxColumn(map.inputRange.startLineNumber);
                        }
                        if (inputRangesValid && map.inputRange.endLineNumber === inputRange.endLineNumberExclusive) {
                            inputRangesValid = map.inputRange.endColumn === 1;
                        }
                        let outputRangesValid = outputRange.startLineNumber - 1 <= map.outputRange.startLineNumber
                            && map.outputRange.endLineNumber <= outputRange.endLineNumberExclusive;
                        if (outputRangesValid && map.outputRange.startLineNumber === outputRange.startLineNumber - 1) {
                            outputRangesValid = map.outputRange.endColumn >= outputTextModel.getLineMaxColumn(map.outputRange.endLineNumber);
                        }
                        if (outputRangesValid && map.outputRange.endLineNumber === outputRange.endLineNumberExclusive) {
                            outputRangesValid = map.outputRange.endColumn === 1;
                        }
                        if (!inputRangesValid || !outputRangesValid) {
                            return false;
                        }
                    }
                }
                return changes.length === 0 || (changes[0].inputRange.startLineNumber === changes[0].outputRange.startLineNumber &&
                    (0, assert_1.checkAdjacentItems)(changes, (m1, m2) => m2.inputRange.startLineNumber - m1.inputRange.endLineNumberExclusive === m2.outputRange.startLineNumber - m1.outputRange.endLineNumberExclusive &&
                        // There has to be an unchanged line in between (otherwise both diffs should have been joined)
                        m1.inputRange.endLineNumberExclusive < m2.inputRange.startLineNumber &&
                        m1.outputRange.endLineNumberExclusive < m2.outputRange.startLineNumber));
            });
            return {
                diffs: changes
            };
        }
    };
    exports.MergeDiffComputer = MergeDiffComputer;
    exports.MergeDiffComputer = MergeDiffComputer = __decorate([
        __param(0, editorWorker_1.IEditorWorkerService),
        __param(1, configuration_1.IConfigurationService)
    ], MergeDiffComputer);
    function toLineRange(range) {
        return new lineRange_1.LineRange(range.startLineNumber, range.length);
    }
    function toRangeMapping(mapping) {
        return new mapping_1.RangeMapping(mapping.originalRange, mapping.modifiedRange);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkNvbXB1dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL21vZGVsL2RpZmZDb21wdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3SGhHLGtDQUVDO0lBRUQsd0NBRUM7SUF6R00sSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7UUFLN0IsWUFDdUIsbUJBQTBELEVBQ3pELG9CQUE0RDtZQUQ1Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ3hDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFObkUsbUJBQWMsR0FBRyxJQUFBLDZCQUFxQixFQUN0RCwyQkFBMkIsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDO2lCQUNsRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxjQUFjLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFNN0UsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsVUFBc0IsRUFBRSxVQUFzQixFQUFFLE1BQWU7WUFDaEYsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkQsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQy9DLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUVoRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLENBQ3hELFVBQVUsQ0FBQyxHQUFHLEVBQ2QsVUFBVSxDQUFDLEdBQUcsRUFDZDtnQkFDQyxvQkFBb0IsRUFBRSxLQUFLO2dCQUMzQixvQkFBb0IsRUFBRSxDQUFDO2dCQUN2QixZQUFZLEVBQUUsS0FBSzthQUNuQixFQUNELGFBQWEsQ0FDYixDQUFDO1lBRUYsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBRUQsSUFBSSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksVUFBVSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ3hELE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDeEIsQ0FBQztZQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQ3RDLElBQUksa0NBQXdCLENBQzNCLFdBQVcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQ3ZCLFVBQVUsRUFDVixXQUFXLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUN2QixVQUFVLEVBQ1YsQ0FBQyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDN0MsQ0FDRCxDQUFDO1lBRUYsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2xELE1BQU0sZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBRW5ELElBQUksWUFBWSxLQUFLLGVBQWUsSUFBSSxhQUFhLEtBQUssZ0JBQWdCLEVBQUUsQ0FBQztnQkFDNUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUN4QixDQUFDO1lBRUQsSUFBQSxpQkFBUSxFQUFDLEdBQUcsRUFBRTtnQkFDYixLQUFLLE1BQU0sQ0FBQyxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUN6QixNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDO29CQUNoQyxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDO29CQUNsQyxNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDO29CQUN4QyxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsZUFBZSxDQUFDO29CQUUxQyxLQUFLLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQzt3QkFDbkMsSUFBSSxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsZUFBZSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLGVBQWU7K0JBQ25GLEdBQUcsQ0FBQyxVQUFVLENBQUMsYUFBYSxJQUFJLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQzt3QkFDdEUsSUFBSSxnQkFBZ0IsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLGVBQWUsS0FBSyxVQUFVLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFDOzRCQUMzRixnQkFBZ0IsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLFNBQVMsSUFBSSxjQUFjLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQzt3QkFDaEgsQ0FBQzt3QkFDRCxJQUFJLGdCQUFnQixJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsYUFBYSxLQUFLLFVBQVUsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDOzRCQUM1RixnQkFBZ0IsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUM7d0JBQ25ELENBQUM7d0JBRUQsSUFBSSxpQkFBaUIsR0FBRyxXQUFXLENBQUMsZUFBZSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLGVBQWU7K0JBQ3RGLEdBQUcsQ0FBQyxXQUFXLENBQUMsYUFBYSxJQUFJLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQzt3QkFDeEUsSUFBSSxpQkFBaUIsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLGVBQWUsS0FBSyxXQUFXLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFDOzRCQUM5RixpQkFBaUIsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsSUFBSSxlQUFlLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDbEgsQ0FBQzt3QkFDRCxJQUFJLGlCQUFpQixJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsYUFBYSxLQUFLLFdBQVcsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDOzRCQUMvRixpQkFBaUIsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUM7d0JBQ3JELENBQUM7d0JBRUQsSUFBSSxDQUFDLGdCQUFnQixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzs0QkFDN0MsT0FBTyxLQUFLLENBQUM7d0JBQ2QsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsT0FBTyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsZUFBZSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsZUFBZTtvQkFDL0csSUFBQSwyQkFBa0IsRUFBQyxPQUFPLEVBQ3pCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxzQkFBc0IsS0FBSyxFQUFFLENBQUMsV0FBVyxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLHNCQUFzQjt3QkFDMUosOEZBQThGO3dCQUM5RixFQUFFLENBQUMsVUFBVSxDQUFDLHNCQUFzQixHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZTt3QkFDcEUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxzQkFBc0IsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FDdkUsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPO2dCQUNOLEtBQUssRUFBRSxPQUFPO2FBQ2QsQ0FBQztRQUNILENBQUM7S0FDRCxDQUFBO0lBakdZLDhDQUFpQjtnQ0FBakIsaUJBQWlCO1FBTTNCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSxxQ0FBcUIsQ0FBQTtPQVBYLGlCQUFpQixDQWlHN0I7SUFFRCxTQUFnQixXQUFXLENBQUMsS0FBb0I7UUFDL0MsT0FBTyxJQUFJLHFCQUFTLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELFNBQWdCLGNBQWMsQ0FBQyxPQUF5QjtRQUN2RCxPQUFPLElBQUksc0JBQVksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN2RSxDQUFDIn0=