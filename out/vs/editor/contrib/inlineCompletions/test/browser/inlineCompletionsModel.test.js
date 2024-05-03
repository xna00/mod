define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsModel", "vs/editor/common/core/textEdit", "vs/editor/test/common/testTextModel", "vs/editor/common/core/range", "vs/base/test/common/utils"], function (require, exports, assert, position_1, inlineCompletionsModel_1, textEdit_1, testTextModel_1, range_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('inlineCompletionModel', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('getSecondaryEdits - basic', async function () {
            const textModel = (0, testTextModel_1.createTextModel)([
                'function fib(',
                'function fib('
            ].join('\n'));
            const positions = [
                new position_1.Position(1, 14),
                new position_1.Position(2, 14)
            ];
            const primaryEdit = new textEdit_1.SingleTextEdit(new range_1.Range(1, 1, 1, 14), 'function fib() {');
            const secondaryEdits = (0, inlineCompletionsModel_1.getSecondaryEdits)(textModel, positions, primaryEdit);
            assert.deepStrictEqual(secondaryEdits, [new textEdit_1.SingleTextEdit(new range_1.Range(2, 14, 2, 14), ') {')]);
            textModel.dispose();
        });
        test('getSecondaryEdits - cursor not on same line as primary edit 1', async function () {
            const textModel = (0, testTextModel_1.createTextModel)([
                'function fib(',
                '',
                'function fib(',
                ''
            ].join('\n'));
            const positions = [
                new position_1.Position(2, 1),
                new position_1.Position(4, 1)
            ];
            const primaryEdit = new textEdit_1.SingleTextEdit(new range_1.Range(1, 1, 2, 1), [
                'function fib() {',
                '	return 0;',
                '}'
            ].join('\n'));
            const secondaryEdits = (0, inlineCompletionsModel_1.getSecondaryEdits)(textModel, positions, primaryEdit);
            assert.deepStrictEqual(secondaryEdits, [new textEdit_1.SingleTextEdit(new range_1.Range(4, 1, 4, 1), [
                    '	return 0;',
                    '}'
                ].join('\n'))]);
            textModel.dispose();
        });
        test('getSecondaryEdits - cursor not on same line as primary edit 2', async function () {
            const textModel = (0, testTextModel_1.createTextModel)([
                'class A {',
                '',
                'class B {',
                '',
                'function f() {}'
            ].join('\n'));
            const positions = [
                new position_1.Position(2, 1),
                new position_1.Position(4, 1)
            ];
            const primaryEdit = new textEdit_1.SingleTextEdit(new range_1.Range(1, 1, 2, 1), [
                'class A {',
                '	public x: number = 0;',
                '   public y: number = 0;',
                '}'
            ].join('\n'));
            const secondaryEdits = (0, inlineCompletionsModel_1.getSecondaryEdits)(textModel, positions, primaryEdit);
            assert.deepStrictEqual(secondaryEdits, [new textEdit_1.SingleTextEdit(new range_1.Range(4, 1, 4, 1), [
                    '	public x: number = 0;',
                    '   public y: number = 0;',
                    '}'
                ].join('\n'))]);
            textModel.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ29tcGxldGlvbnNNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVDb21wbGV0aW9ucy90ZXN0L2Jyb3dzZXIvaW5saW5lQ29tcGxldGlvbnNNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVlBLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFFbkMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQywyQkFBMkIsRUFBRSxLQUFLO1lBRXRDLE1BQU0sU0FBUyxHQUFHLElBQUEsK0JBQWUsRUFBQztnQkFDakMsZUFBZTtnQkFDZixlQUFlO2FBQ2YsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNkLE1BQU0sU0FBUyxHQUFHO2dCQUNqQixJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7YUFDbkIsQ0FBQztZQUNGLE1BQU0sV0FBVyxHQUFHLElBQUkseUJBQWMsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sY0FBYyxHQUFHLElBQUEsMENBQWlCLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsZUFBZSxDQUFDLGNBQWMsRUFBRSxDQUFDLElBQUkseUJBQWMsQ0FDekQsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ3ZCLEtBQUssQ0FDTCxDQUFDLENBQUMsQ0FBQztZQUNKLFNBQVMs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