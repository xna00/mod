/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/viewModel/viewModelImpl", "vs/editor/test/browser/config/testConfiguration", "vs/editor/common/viewModel/monospaceLineBreaksComputer", "vs/editor/test/common/testTextModel", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/theme/test/common/testThemeService"], function (require, exports, viewModelImpl_1, testConfiguration_1, monospaceLineBreaksComputer_1, testTextModel_1, testLanguageConfigurationService_1, testThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testViewModel = testViewModel;
    function testViewModel(text, options, callback) {
        const EDITOR_ID = 1;
        const configuration = new testConfiguration_1.TestConfiguration(options);
        const model = (0, testTextModel_1.createTextModel)(text.join('\n'));
        const monospaceLineBreaksComputerFactory = monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory.create(configuration.options);
        const testLanguageConfigurationService = new testLanguageConfigurationService_1.TestLanguageConfigurationService();
        const viewModel = new viewModelImpl_1.ViewModel(EDITOR_ID, configuration, model, monospaceLineBreaksComputerFactory, monospaceLineBreaksComputerFactory, null, testLanguageConfigurationService, new testThemeService_1.TestThemeService(), {
            setVisibleLines(visibleLines, stabilized) {
            },
        });
        callback(viewModel, model);
        viewModel.dispose();
        model.dispose();
        configuration.dispose();
        testLanguageConfigurationService.dispose();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFZpZXdNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvYnJvd3Nlci92aWV3TW9kZWwvdGVzdFZpZXdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxzQ0FrQkM7SUFsQkQsU0FBZ0IsYUFBYSxDQUFDLElBQWMsRUFBRSxPQUF1QixFQUFFLFFBQTBEO1FBQ2hJLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQztRQUVwQixNQUFNLGFBQWEsR0FBRyxJQUFJLHFDQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JELE1BQU0sS0FBSyxHQUFHLElBQUEsK0JBQWUsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDL0MsTUFBTSxrQ0FBa0MsR0FBRyxnRUFBa0MsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVHLE1BQU0sZ0NBQWdDLEdBQUcsSUFBSSxtRUFBZ0MsRUFBRSxDQUFDO1FBQ2hGLE1BQU0sU0FBUyxHQUFHLElBQUkseUJBQVMsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxrQ0FBa0MsRUFBRSxrQ0FBa0MsRUFBRSxJQUFLLEVBQUUsZ0NBQWdDLEVBQUUsSUFBSSxtQ0FBZ0IsRUFBRSxFQUFFO1lBQ3pNLGVBQWUsQ0FBQyxZQUFZLEVBQUUsVUFBVTtZQUN4QyxDQUFDO1NBQ0QsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUUzQixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4QixnQ0FBZ0MsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM1QyxDQUFDIn0=