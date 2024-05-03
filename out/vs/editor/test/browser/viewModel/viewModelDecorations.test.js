/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/viewModel", "vs/editor/test/browser/viewModel/testViewModel"], function (require, exports, assert, utils_1, range_1, viewModel_1, testViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ViewModelDecorations', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('getDecorationsViewportData', () => {
            const text = [
                'hello world, this is a buffer that will be wrapped'
            ];
            const opts = {
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 13
            };
            (0, testViewModel_1.testViewModel)(text, opts, (viewModel, model) => {
                assert.strictEqual(viewModel.getLineContent(1), 'hello world, ');
                assert.strictEqual(viewModel.getLineContent(2), 'this is a ');
                assert.strictEqual(viewModel.getLineContent(3), 'buffer that ');
                assert.strictEqual(viewModel.getLineContent(4), 'will be ');
                assert.strictEqual(viewModel.getLineContent(5), 'wrapped');
                model.changeDecorations((accessor) => {
                    const createOpts = (id) => {
                        return {
                            description: 'test',
                            className: id,
                            inlineClassName: 'i-' + id,
                            beforeContentClassName: 'b-' + id,
                            afterContentClassName: 'a-' + id
                        };
                    };
                    // VIEWPORT will be (1,14) -> (1,36)
                    // completely before viewport
                    accessor.addDecoration(new range_1.Range(1, 2, 1, 3), createOpts('dec1'));
                    // starts before viewport, ends at viewport start
                    accessor.addDecoration(new range_1.Range(1, 2, 1, 14), createOpts('dec2'));
                    // starts before viewport, ends inside viewport
                    accessor.addDecoration(new range_1.Range(1, 2, 1, 15), createOpts('dec3'));
                    // starts before viewport, ends at viewport end
                    accessor.addDecoration(new range_1.Range(1, 2, 1, 36), createOpts('dec4'));
                    // starts before viewport, ends after viewport
                    accessor.addDecoration(new range_1.Range(1, 2, 1, 51), createOpts('dec5'));
                    // starts at viewport start, ends at viewport start (will not be visible on view line 2)
                    accessor.addDecoration(new range_1.Range(1, 14, 1, 14), createOpts('dec6'));
                    // starts at viewport start, ends inside viewport
                    accessor.addDecoration(new range_1.Range(1, 14, 1, 16), createOpts('dec7'));
                    // starts at viewport start, ends at viewport end
                    accessor.addDecoration(new range_1.Range(1, 14, 1, 36), createOpts('dec8'));
                    // starts at viewport start, ends after viewport
                    accessor.addDecoration(new range_1.Range(1, 14, 1, 51), createOpts('dec9'));
                    // starts inside viewport, ends inside viewport
                    accessor.addDecoration(new range_1.Range(1, 16, 1, 18), createOpts('dec10'));
                    // starts inside viewport, ends at viewport end
                    accessor.addDecoration(new range_1.Range(1, 16, 1, 36), createOpts('dec11'));
                    // starts inside viewport, ends after viewport
                    accessor.addDecoration(new range_1.Range(1, 16, 1, 51), createOpts('dec12'));
                    // starts at viewport end, ends at viewport end
                    accessor.addDecoration(new range_1.Range(1, 36, 1, 36), createOpts('dec13'));
                    // starts at viewport end, ends after viewport
                    accessor.addDecoration(new range_1.Range(1, 36, 1, 51), createOpts('dec14'));
                    // starts after viewport, ends after viewport
                    accessor.addDecoration(new range_1.Range(1, 40, 1, 51), createOpts('dec15'));
                });
                const actualDecorations = viewModel.getDecorationsInViewport(new range_1.Range(2, viewModel.getLineMinColumn(2), 3, viewModel.getLineMaxColumn(3))).map((dec) => {
                    return dec.options.className;
                }).filter(Boolean);
                assert.deepStrictEqual(actualDecorations, [
                    'dec1',
                    'dec2',
                    'dec3',
                    'dec4',
                    'dec5',
                    'dec6',
                    'dec7',
                    'dec8',
                    'dec9',
                    'dec10',
                    'dec11',
                    'dec12',
                    'dec13',
                    'dec14',
                ]);
                const inlineDecorations1 = viewModel.getViewportViewLineRenderingData(new range_1.Range(1, viewModel.getLineMinColumn(1), 2, viewModel.getLineMaxColumn(2)), 1).inlineDecorations;
                // view line 1: (1,1 -> 1,14)
                assert.deepStrictEqual(inlineDecorations1, [
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 1, 3), 'i-dec1', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 1, 2), 'b-dec1', 1 /* InlineDecorationType.Before */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 3, 1, 3), 'a-dec1', 2 /* InlineDecorationType.After */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 1, 14), 'i-dec2', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 1, 2), 'b-dec2', 1 /* InlineDecorationType.Before */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 14, 1, 14), 'a-dec2', 2 /* InlineDecorationType.After */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 2, 2), 'i-dec3', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 1, 2), 'b-dec3', 1 /* InlineDecorationType.Before */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 3, 13), 'i-dec4', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 1, 2), 'b-dec4', 1 /* InlineDecorationType.Before */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 5, 8), 'i-dec5', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 1, 2), 'b-dec5', 1 /* InlineDecorationType.Before */),
                ]);
                const inlineDecorations2 = viewModel.getViewportViewLineRenderingData(new range_1.Range(2, viewModel.getLineMinColumn(2), 3, viewModel.getLineMaxColumn(3)), 2).inlineDecorations;
                // view line 2: (1,14 -> 1,24)
                assert.deepStrictEqual(inlineDecorations2, [
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 2, 2), 'i-dec3', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 2, 2, 2), 'a-dec3', 2 /* InlineDecorationType.After */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 3, 13), 'i-dec4', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 5, 8), 'i-dec5', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 1, 2, 1), 'i-dec6', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 1, 2, 1), 'b-dec6', 1 /* InlineDecorationType.Before */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 1, 2, 1), 'a-dec6', 2 /* InlineDecorationType.After */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 1, 2, 3), 'i-dec7', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 1, 2, 1), 'b-dec7', 1 /* InlineDecorationType.Before */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 3, 2, 3), 'a-dec7', 2 /* InlineDecorationType.After */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 1, 3, 13), 'i-dec8', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 1, 2, 1), 'b-dec8', 1 /* InlineDecorationType.Before */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 1, 5, 8), 'i-dec9', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 1, 2, 1), 'b-dec9', 1 /* InlineDecorationType.Before */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 3, 2, 5), 'i-dec10', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 3, 2, 3), 'b-dec10', 1 /* InlineDecorationType.Before */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 5, 2, 5), 'a-dec10', 2 /* InlineDecorationType.After */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 3, 3, 13), 'i-dec11', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 3, 2, 3), 'b-dec11', 1 /* InlineDecorationType.Before */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 3, 5, 8), 'i-dec12', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 3, 2, 3), 'b-dec12', 1 /* InlineDecorationType.Before */),
                ]);
                const inlineDecorations3 = viewModel.getViewportViewLineRenderingData(new range_1.Range(2, viewModel.getLineMinColumn(2), 3, viewModel.getLineMaxColumn(3)), 3).inlineDecorations;
                // view line 3 (24 -> 36)
                assert.deepStrictEqual(inlineDecorations3, [
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 3, 13), 'i-dec4', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(3, 13, 3, 13), 'a-dec4', 2 /* InlineDecorationType.After */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 2, 5, 8), 'i-dec5', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 1, 3, 13), 'i-dec8', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(3, 13, 3, 13), 'a-dec8', 2 /* InlineDecorationType.After */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 1, 5, 8), 'i-dec9', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 3, 3, 13), 'i-dec11', 0 /* InlineDecorationType.Regular */),
                    new viewModel_1.InlineDecoration(new range_1.Range(3, 13, 3, 13), 'a-dec11', 2 /* InlineDecorationType.After */),
                    new viewModel_1.InlineDecoration(new range_1.Range(2, 3, 5, 8), 'i-dec12', 0 /* InlineDecorationType.Regular */),
                ]);
            });
        });
        test('issue #17208: Problem scrolling in 1.8.0', () => {
            const text = [
                'hello world, this is a buffer that will be wrapped'
            ];
            const opts = {
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 13
            };
            (0, testViewModel_1.testViewModel)(text, opts, (viewModel, model) => {
                assert.strictEqual(viewModel.getLineContent(1), 'hello world, ');
                assert.strictEqual(viewModel.getLineContent(2), 'this is a ');
                assert.strictEqual(viewModel.getLineContent(3), 'buffer that ');
                assert.strictEqual(viewModel.getLineContent(4), 'will be ');
                assert.strictEqual(viewModel.getLineContent(5), 'wrapped');
                model.changeDecorations((accessor) => {
                    accessor.addDecoration(new range_1.Range(1, 50, 1, 51), {
                        description: 'test',
                        beforeContentClassName: 'dec1'
                    });
                });
                const decorations = viewModel.getDecorationsInViewport(new range_1.Range(2, viewModel.getLineMinColumn(2), 3, viewModel.getLineMaxColumn(3))).filter(x => Boolean(x.options.beforeContentClassName));
                assert.deepStrictEqual(decorations, []);
                const inlineDecorations1 = viewModel.getViewportViewLineRenderingData(new range_1.Range(2, viewModel.getLineMinColumn(2), 3, viewModel.getLineMaxColumn(3)), 2).inlineDecorations;
                assert.deepStrictEqual(inlineDecorations1, []);
                const inlineDecorations2 = viewModel.getViewportViewLineRenderingData(new range_1.Range(2, viewModel.getLineMinColumn(2), 3, viewModel.getLineMaxColumn(3)), 3).inlineDecorations;
                assert.deepStrictEqual(inlineDecorations2, []);
            });
        });
        test('issue #37401: Allow both before and after decorations on empty line', () => {
            const text = [
                ''
            ];
            (0, testViewModel_1.testViewModel)(text, {}, (viewModel, model) => {
                model.changeDecorations((accessor) => {
                    accessor.addDecoration(new range_1.Range(1, 1, 1, 1), {
                        description: 'test',
                        beforeContentClassName: 'before1',
                        afterContentClassName: 'after1'
                    });
                });
                const inlineDecorations = viewModel.getViewportViewLineRenderingData(new range_1.Range(1, 1, 1, 1), 1).inlineDecorations;
                assert.deepStrictEqual(inlineDecorations, [
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 1, 1, 1), 'before1', 1 /* InlineDecorationType.Before */),
                    new viewModel_1.InlineDecoration(new range_1.Range(1, 1, 1, 1), 'after1', 2 /* InlineDecorationType.After */)
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsRGVjb3JhdGlvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvYnJvd3Nlci92aWV3TW9kZWwvdmlld01vZGVsRGVjb3JhdGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1FBRWxDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1lBQ3ZDLE1BQU0sSUFBSSxHQUFHO2dCQUNaLG9EQUFvRDthQUNwRCxDQUFDO1lBQ0YsTUFBTSxJQUFJLEdBQW1CO2dCQUM1QixRQUFRLEVBQUUsZ0JBQWdCO2dCQUMxQixjQUFjLEVBQUUsRUFBRTthQUNsQixDQUFDO1lBQ0YsSUFBQSw2QkFBYSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztnQkFDakUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FB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QUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSx1Q0FBK0I7b0JBQ25GLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxxQ0FBNkI7b0JBQ2pGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsUUFBUSx1Q0FBK0I7b0JBQ3BGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSx1Q0FBK0I7b0JBQ25GLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSx1Q0FBK0I7b0JBQ25GLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxzQ0FBOEI7b0JBQ2xGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxxQ0FBNkI7b0JBQ2pGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSx1Q0FBK0I7b0JBQ25GLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxzQ0FBOEI7b0JBQ2xGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxxQ0FBNkI7b0JBQ2pGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsUUFBUSx1Q0FBK0I7b0JBQ3BGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxzQ0FBOEI7b0JBQ2xGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSx1Q0FBK0I7b0JBQ25GLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxzQ0FBOEI7b0JBQ2xGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyx1Q0FBK0I7b0JBQ3BGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxzQ0FBOEI7b0JBQ25GLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxxQ0FBNkI7b0JBQ2xGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBUyx1Q0FBK0I7b0JBQ3JGLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxzQ0FBOEI7b0JBQ25GLElBQUksNEJBQWdCLENBQUMsSUFBSSxhQUFLLENB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