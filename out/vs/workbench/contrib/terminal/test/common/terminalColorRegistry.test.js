/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/theme/common/colorRegistry", "vs/platform/registry/common/platform", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/base/common/color", "vs/platform/theme/common/theme", "vs/base/test/common/utils"], function (require, exports, assert, colorRegistry_1, platform_1, terminalColorRegistry_1, color_1, theme_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, terminalColorRegistry_1.registerColors)();
    const themingRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
    function getMockTheme(type) {
        const theme = {
            selector: '',
            label: '',
            type: type,
            getColor: (colorId) => themingRegistry.resolveDefaultColor(colorId, theme),
            defines: () => true,
            getTokenStyleMetadata: () => undefined,
            tokenColorMap: [],
            semanticHighlighting: false
        };
        return theme;
    }
    suite('Workbench - TerminalColorRegistry', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('hc colors', function () {
            const theme = getMockTheme(theme_1.ColorScheme.HIGH_CONTRAST_DARK);
            const colors = terminalColorRegistry_1.ansiColorIdentifiers.map(colorId => color_1.Color.Format.CSS.formatHexA(theme.getColor(colorId), true));
            assert.deepStrictEqual(colors, [
                '#000000',
                '#cd0000',
                '#00cd00',
                '#cdcd00',
                '#0000ee',
                '#cd00cd',
                '#00cdcd',
                '#e5e5e5',
                '#7f7f7f',
                '#ff0000',
                '#00ff00',
                '#ffff00',
                '#5c5cff',
                '#ff00ff',
                '#00ffff',
                '#ffffff'
            ], 'The high contrast terminal colors should be used when the hc theme is active');
        });
        test('light colors', function () {
            const theme = getMockTheme(theme_1.ColorScheme.LIGHT);
            const colors = terminalColorRegistry_1.ansiColorIdentifiers.map(colorId => color_1.Color.Format.CSS.formatHexA(theme.getColor(colorId), true));
            assert.deepStrictEqual(colors, [
                '#000000',
                '#cd3131',
                '#00bc00',
                '#949800',
                '#0451a5',
                '#bc05bc',
                '#0598bc',
                '#555555',
                '#666666',
                '#cd3131',
                '#14ce14',
                '#b5ba00',
                '#0451a5',
                '#bc05bc',
                '#0598bc',
                '#a5a5a5'
            ], 'The light terminal colors should be used when the light theme is active');
        });
        test('dark colors', function () {
            const theme = getMockTheme(theme_1.ColorScheme.DARK);
            const colors = terminalColorRegistry_1.ansiColorIdentifiers.map(colorId => color_1.Color.Format.CSS.formatHexA(theme.getColor(colorId), true));
            assert.deepStrictEqual(colors, [
                '#000000',
                '#cd3131',
                '#0dbc79',
                '#e5e510',
                '#2472c8',
                '#bc3fbc',
                '#11a8cd',
                '#e5e5e5',
                '#666666',
                '#f14c4c',
                '#23d18b',
                '#f5f543',
                '#3b8eea',
                '#d670d6',
                '#29b8db',
                '#e5e5e5'
            ], 'The dark terminal colors should be used when a dark theme is active');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb2xvclJlZ2lzdHJ5LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL3Rlc3QvY29tbW9uL3Rlcm1pbmFsQ29sb3JSZWdpc3RyeS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLElBQUEsc0NBQWMsR0FBRSxDQUFDO0lBRWpCLE1BQU0sZUFBZSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFpQiwwQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQzFGLFNBQVMsWUFBWSxDQUFDLElBQWlCO1FBQ3RDLE1BQU0sS0FBSyxHQUFHO1lBQ2IsUUFBUSxFQUFFLEVBQUU7WUFDWixLQUFLLEVBQUUsRUFBRTtZQUNULElBQUksRUFBRSxJQUFJO1lBQ1YsUUFBUSxFQUFFLENBQUMsT0FBd0IsRUFBcUIsRUFBRSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDO1lBQzlHLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJO1lBQ25CLHFCQUFxQixFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVM7WUFDdEMsYUFBYSxFQUFFLEVBQUU7WUFDakIsb0JBQW9CLEVBQUUsS0FBSztTQUMzQixDQUFDO1FBQ0YsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRUQsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtRQUMvQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNqQixNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsbUJBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzNELE1BQU0sTUFBTSxHQUFHLDRDQUFvQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFaEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUU7Z0JBQzlCLFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7YUFDVCxFQUFFLDhFQUE4RSxDQUFDLENBQUM7UUFFcEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ3BCLE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxtQkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlDLE1BQU0sTUFBTSxHQUFHLDRDQUFvQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFaEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUU7Z0JBQzlCLFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7YUFDVCxFQUFFLHlFQUF5RSxDQUFDLENBQUM7UUFFL0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ25CLE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxtQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLE1BQU0sTUFBTSxHQUFHLDRDQUFvQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFaEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUU7Z0JBQzlCLFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsU0FBUztnQkFDVCxTQUFTO2dCQUNULFNBQVM7YUFDVCxFQUFFLHFFQUFxRSxDQUFDLENBQUM7UUFDM0UsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9