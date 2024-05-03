/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/color", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/base/test/common/utils", "vs/platform/theme/test/common/testThemeService", "vs/workbench/contrib/debug/browser/debugANSIHandling", "vs/workbench/contrib/debug/browser/linkDetector", "vs/workbench/contrib/debug/test/browser/callStack.test", "vs/workbench/contrib/debug/test/browser/mockDebugModel", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, color_1, lifecycle_1, uuid_1, utils_1, testThemeService_1, debugANSIHandling_1, linkDetector_1, callStack_test_1, mockDebugModel_1, terminalColorRegistry_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - ANSI Handling', () => {
        let disposables;
        let model;
        let session;
        let linkDetector;
        let themeService;
        /**
         * Instantiate services for use by the functions being tested.
         */
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            model = (0, mockDebugModel_1.createMockDebugModel)(disposables);
            session = (0, callStack_test_1.createTestSession)(model);
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            linkDetector = instantiationService.createInstance(linkDetector_1.LinkDetector);
            const colors = {};
            for (const color in terminalColorRegistry_1.ansiColorMap) {
                colors[color] = terminalColorRegistry_1.ansiColorMap[color].defaults.dark;
            }
            const testTheme = new testThemeService_1.TestColorTheme(colors);
            themeService = new testThemeService_1.TestThemeService(testTheme);
            (0, terminalColorRegistry_1.registerColors)();
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('appendStylizedStringToContainer', () => {
            const root = document.createElement('span');
            let child;
            assert.strictEqual(0, root.children.length);
            (0, debugANSIHandling_1.appendStylizedStringToContainer)(root, 'content1', ['class1', 'class2'], linkDetector, session.root);
            (0, debugANSIHandling_1.appendStylizedStringToContainer)(root, 'content2', ['class2', 'class3'], linkDetector, session.root);
            assert.strictEqual(2, root.children.length);
            child = root.firstChild;
            if (child instanceof HTMLSpanElement) {
                assert.strictEqual('content1', child.textContent);
                assert(child.classList.contains('class1'));
                assert(child.classList.contains('class2'));
            }
            else {
                assert.fail('Unexpected assertion error');
            }
            child = root.lastChild;
            if (child instanceof HTMLSpanElement) {
                assert.strictEqual('content2', child.textContent);
                assert(child.classList.contains('class2'));
                assert(child.classList.contains('class3'));
            }
            else {
                assert.fail('Unexpected assertion error');
            }
        });
        /**
         * Apply an ANSI sequence to {@link #getSequenceOutput}.
         *
         * @param sequence The ANSI sequence to stylize.
         * @returns An {@link HTMLSpanElement} that contains the stylized text.
         */
        function getSequenceOutput(sequence) {
            const root = (0, debugANSIHandling_1.handleANSIOutput)(sequence, linkDetector, themeService, session.root);
            assert.strictEqual(1, root.children.length);
            const child = root.lastChild;
            if (child instanceof HTMLSpanElement) {
                return child;
            }
            else {
                assert.fail('Unexpected assertion error');
            }
        }
        /**
         * Assert that a given ANSI sequence maintains added content following the ANSI code, and that
         * the provided {@param assertion} passes.
         *
         * @param sequence The ANSI sequence to verify. The provided sequence should contain ANSI codes
         * only, and should not include actual text content as it is provided by this function.
         * @param assertion The function used to verify the output.
         */
        function assertSingleSequenceElement(sequence, assertion) {
            const child = getSequenceOutput(sequence + 'content');
            assert.strictEqual('content', child.textContent);
            assertion(child);
        }
        /**
         * Assert that a given DOM element has the custom inline CSS style matching
         * the color value provided.
         * @param element The HTML span element to look at.
         * @param colorType If `foreground`, will check the element's css `color`;
         * if `background`, will check the element's css `backgroundColor`.
         * if `underline`, will check the elements css `textDecorationColor`.
         * @param color RGBA object to compare color to. If `undefined` or not provided,
         * will assert that no value is set.
         * @param message Optional custom message to pass to assertion.
         * @param colorShouldMatch Optional flag (defaults TO true) which allows caller to indicate that the color SHOULD NOT MATCH
         * (for testing changes to theme colors where we need color to have changed but we don't know exact color it should have
         * changed to (but we do know the color it should NO LONGER BE))
         */
        function assertInlineColor(element, colorType, color, message, colorShouldMatch = true) {
            if (color !== undefined) {
                const cssColor = color_1.Color.Format.CSS.formatRGB(new color_1.Color(color));
                if (colorType === 'background') {
                    const styleBefore = element.style.backgroundColor;
                    element.style.backgroundColor = cssColor;
                    assert((styleBefore === element.style.backgroundColor) === colorShouldMatch, message || `Incorrect ${colorType} color style found (found color: ${styleBefore}, expected ${cssColor}).`);
                }
                else if (colorType === 'foreground') {
                    const styleBefore = element.style.color;
                    element.style.color = cssColor;
                    assert((styleBefore === element.style.color) === colorShouldMatch, message || `Incorrect ${colorType} color style found (found color: ${styleBefore}, expected ${cssColor}).`);
                }
                else {
                    const styleBefore = element.style.textDecorationColor;
                    element.style.textDecorationColor = cssColor;
                    assert((styleBefore === element.style.textDecorationColor) === colorShouldMatch, message || `Incorrect ${colorType} color style found (found color: ${styleBefore}, expected ${cssColor}).`);
                }
            }
            else {
                if (colorType === 'background') {
                    assert(!element.style.backgroundColor, message || `Defined ${colorType} color style found when it should not have been defined`);
                }
                else if (colorType === 'foreground') {
                    assert(!element.style.color, message || `Defined ${colorType} color style found when it should not have been defined`);
                }
                else {
                    assert(!element.style.textDecorationColor, message || `Defined ${colorType} color style found when it should not have been defined`);
                }
            }
        }
        test('Expected single sequence operation', () => {
            // Bold code
            assertSingleSequenceElement('\x1b[1m', (child) => {
                assert(child.classList.contains('code-bold'), 'Bold formatting not detected after bold ANSI code.');
            });
            // Italic code
            assertSingleSequenceElement('\x1b[3m', (child) => {
                assert(child.classList.contains('code-italic'), 'Italic formatting not detected after italic ANSI code.');
            });
            // Underline code
            assertSingleSequenceElement('\x1b[4m', (child) => {
                assert(child.classList.contains('code-underline'), 'Underline formatting not detected after underline ANSI code.');
            });
            for (let i = 30; i <= 37; i++) {
                const customClassName = 'code-foreground-colored';
                // Foreground colour class
                assertSingleSequenceElement('\x1b[' + i + 'm', (child) => {
                    assert(child.classList.contains(customClassName), `Custom foreground class not found on element after foreground ANSI code #${i}.`);
                });
                // Cancellation code removes colour class
                assertSingleSequenceElement('\x1b[' + i + ';39m', (child) => {
                    assert(child.classList.contains(customClassName) === false, 'Custom foreground class still found after foreground cancellation code.');
                    assertInlineColor(child, 'foreground', undefined, 'Custom color style still found after foreground cancellation code.');
                });
            }
            for (let i = 40; i <= 47; i++) {
                const customClassName = 'code-background-colored';
                // Foreground colour class
                assertSingleSequenceElement('\x1b[' + i + 'm', (child) => {
                    assert(child.classList.contains(customClassName), `Custom background class not found on element after background ANSI code #${i}.`);
                });
                // Cancellation code removes colour class
                assertSingleSequenceElement('\x1b[' + i + ';49m', (child) => {
                    assert(child.classList.contains(customClassName) === false, 'Custom background class still found after background cancellation code.');
                    assertInlineColor(child, 'foreground', undefined, 'Custom color style still found after background cancellation code.');
                });
            }
            // check all basic colors for underlines (full range is checked elsewhere, here we check cancelation)
            for (let i = 0; i <= 255; i++) {
                const customClassName = 'code-underline-colored';
                // Underline colour class
                assertSingleSequenceElement('\x1b[58;5;' + i + 'm', (child) => {
                    assert(child.classList.contains(customClassName), `Custom underline color class not found on element after underline color ANSI code 58;5;${i}m.`);
                });
                // Cancellation underline color code removes colour class
                assertSingleSequenceElement('\x1b[58;5;' + i + 'm\x1b[59m', (child) => {
                    assert(child.classList.contains(customClassName) === false, 'Custom underline color class still found after underline color cancellation code 59m.');
                    assertInlineColor(child, 'underline', undefined, 'Custom underline color style still found after underline color cancellation code 59m.');
                });
            }
            // Different codes do not cancel each other
            assertSingleSequenceElement('\x1b[1;3;4;30;41m', (child) => {
                assert.strictEqual(5, child.classList.length, 'Incorrect number of classes found for different ANSI codes.');
                assert(child.classList.contains('code-bold'));
                assert(child.classList.contains('code-italic'), 'Different ANSI codes should not cancel each other.');
                assert(child.classList.contains('code-underline'), 'Different ANSI codes should not cancel each other.');
                assert(child.classList.contains('code-foreground-colored'), 'Different ANSI codes should not cancel each other.');
                assert(child.classList.contains('code-background-colored'), 'Different ANSI codes should not cancel each other.');
            });
            // Different codes do not ACCUMULATE more than one copy of each class
            assertSingleSequenceElement('\x1b[1;1;2;2;3;3;4;4;5;5;6;6;8;8;9;9;21;21;53;53;73;73;74;74m', (child) => {
                assert(child.classList.contains('code-bold'));
                assert(child.classList.contains('code-italic'), 'italic missing Doubles of each Different ANSI codes should not cancel each other or accumulate.');
                assert(child.classList.contains('code-underline') === false, 'underline PRESENT and double underline should have removed it- Doubles of each Different ANSI codes should not cancel each other or accumulate.');
                assert(child.classList.contains('code-dim'), 'dim missing Doubles of each Different ANSI codes should not cancel each other or accumulate.');
                assert(child.classList.contains('code-blink'), 'blink missing Doubles of each Different ANSI codes should not cancel each other or accumulate.');
                assert(child.classList.contains('code-rapid-blink'), 'rapid blink mkssing Doubles of each Different ANSI codes should not cancel each other or accumulate.');
                assert(child.classList.contains('code-double-underline'), 'double underline missing Doubles of each Different ANSI codes should not cancel each other or accumulate.');
                assert(child.classList.contains('code-hidden'), 'hidden missing Doubles of each Different ANSI codes should not cancel each other or accumulate.');
                assert(child.classList.contains('code-strike-through'), 'strike-through missing Doubles of each Different ANSI codes should not cancel each other or accumulate.');
                assert(child.classList.contains('code-overline'), 'overline missing Doubles of each Different ANSI codes should not cancel each other or accumulate.');
                assert(child.classList.contains('code-superscript') === false, 'superscript PRESENT and subscript should have removed it- Doubles of each Different ANSI codes should not cancel each other or accumulate.');
                assert(child.classList.contains('code-subscript'), 'subscript missing Doubles of each Different ANSI codes should not cancel each other or accumulate.');
                assert.strictEqual(10, child.classList.length, 'Incorrect number of classes found for each style code sent twice ANSI codes.');
            });
            // More Different codes do not cancel each other
            assertSingleSequenceElement('\x1b[1;2;5;6;21;8;9m', (child) => {
                assert.strictEqual(7, child.classList.length, 'Incorrect number of classes found for different ANSI codes.');
                assert(child.classList.contains('code-bold'));
                assert(child.classList.contains('code-dim'), 'Different ANSI codes should not cancel each other.');
                assert(child.classList.contains('code-blink'), 'Different ANSI codes should not cancel each other.');
                assert(child.classList.contains('code-rapid-blink'), 'Different ANSI codes should not cancel each other.');
                assert(child.classList.contains('code-double-underline'), 'Different ANSI codes should not cancel each other.');
                assert(child.classList.contains('code-hidden'), 'Different ANSI codes should not cancel each other.');
                assert(child.classList.contains('code-strike-through'), 'Different ANSI codes should not cancel each other.');
            });
            // New foreground codes don't remove old background codes and vice versa
            assertSingleSequenceElement('\x1b[40;31;42;33m', (child) => {
                assert.strictEqual(2, child.classList.length);
                assert(child.classList.contains('code-background-colored'), 'New foreground ANSI code should not cancel existing background formatting.');
                assert(child.classList.contains('code-foreground-colored'), 'New background ANSI code should not cancel existing foreground formatting.');
            });
            // Duplicate codes do not change output
            assertSingleSequenceElement('\x1b[1;1;4;1;4;4;1;4m', (child) => {
                assert(child.classList.contains('code-bold'), 'Duplicate formatting codes should have no effect.');
                assert(child.classList.contains('code-underline'), 'Duplicate formatting codes should have no effect.');
            });
            // Extra terminating semicolon does not change output
            assertSingleSequenceElement('\x1b[1;4;m', (child) => {
                assert(child.classList.contains('code-bold'), 'Extra semicolon after ANSI codes should have no effect.');
                assert(child.classList.contains('code-underline'), 'Extra semicolon after ANSI codes should have no effect.');
            });
            // Cancellation code removes multiple codes
            assertSingleSequenceElement('\x1b[1;4;30;41;32;43;34;45;36;47;0m', (child) => {
                assert.strictEqual(0, child.classList.length, 'Cancellation ANSI code should clear ALL formatting.');
                assertInlineColor(child, 'background', undefined, 'Cancellation ANSI code should clear ALL formatting.');
                assertInlineColor(child, 'foreground', undefined, 'Cancellation ANSI code should clear ALL formatting.');
            });
        });
        test('Expected single 8-bit color sequence operation', () => {
            // Basic and bright color codes specified with 8-bit color code format
            for (let i = 0; i <= 15; i++) {
                // As these are controlled by theme, difficult to check actual color value
                // Foreground codes should add standard classes
                assertSingleSequenceElement('\x1b[38;5;' + i + 'm', (child) => {
                    assert(child.classList.contains('code-foreground-colored'), `Custom color class not found after foreground 8-bit color code 38;5;${i}`);
                });
                // Background codes should add standard classes
                assertSingleSequenceElement('\x1b[48;5;' + i + 'm', (child) => {
                    assert(child.classList.contains('code-background-colored'), `Custom color class not found after background 8-bit color code 48;5;${i}`);
                });
            }
            // 8-bit advanced colors
            for (let i = 16; i <= 255; i++) {
                // Foreground codes should add custom class and inline style
                assertSingleSequenceElement('\x1b[38;5;' + i + 'm', (child) => {
                    assert(child.classList.contains('code-foreground-colored'), `Custom color class not found after foreground 8-bit color code 38;5;${i}`);
                    assertInlineColor(child, 'foreground', (0, debugANSIHandling_1.calcANSI8bitColor)(i), `Incorrect or no color styling found after foreground 8-bit color code 38;5;${i}`);
                });
                // Background codes should add custom class and inline style
                assertSingleSequenceElement('\x1b[48;5;' + i + 'm', (child) => {
                    assert(child.classList.contains('code-background-colored'), `Custom color class not found after background 8-bit color code 48;5;${i}`);
                    assertInlineColor(child, 'background', (0, debugANSIHandling_1.calcANSI8bitColor)(i), `Incorrect or no color styling found after background 8-bit color code 48;5;${i}`);
                });
                // Color underline codes should add custom class and inline style
                assertSingleSequenceElement('\x1b[58;5;' + i + 'm', (child) => {
                    assert(child.classList.contains('code-underline-colored'), `Custom color class not found after underline 8-bit color code 58;5;${i}`);
                    assertInlineColor(child, 'underline', (0, debugANSIHandling_1.calcANSI8bitColor)(i), `Incorrect or no color styling found after underline 8-bit color code 58;5;${i}`);
                });
            }
            // Bad (nonexistent) color should not render
            assertSingleSequenceElement('\x1b[48;5;300m', (child) => {
                assert.strictEqual(0, child.classList.length, 'Bad ANSI color codes should have no effect.');
            });
            // Should ignore any codes after the ones needed to determine color
            assertSingleSequenceElement('\x1b[48;5;100;42;77;99;4;24m', (child) => {
                assert(child.classList.contains('code-background-colored'));
                assert.strictEqual(1, child.classList.length);
                assertInlineColor(child, 'background', (0, debugANSIHandling_1.calcANSI8bitColor)(100));
            });
        });
        test('Expected single 24-bit color sequence operation', () => {
            // 24-bit advanced colors
            for (let r = 0; r <= 255; r += 64) {
                for (let g = 0; g <= 255; g += 64) {
                    for (let b = 0; b <= 255; b += 64) {
                        const color = new color_1.RGBA(r, g, b);
                        // Foreground codes should add class and inline style
                        assertSingleSequenceElement(`\x1b[38;2;${r};${g};${b}m`, (child) => {
                            assert(child.classList.contains('code-foreground-colored'), 'DOM should have "code-foreground-colored" class for advanced ANSI colors.');
                            assertInlineColor(child, 'foreground', color);
                        });
                        // Background codes should add class and inline style
                        assertSingleSequenceElement(`\x1b[48;2;${r};${g};${b}m`, (child) => {
                            assert(child.classList.contains('code-background-colored'), 'DOM should have "code-foreground-colored" class for advanced ANSI colors.');
                            assertInlineColor(child, 'background', color);
                        });
                        // Underline color codes should add class and inline style
                        assertSingleSequenceElement(`\x1b[58;2;${r};${g};${b}m`, (child) => {
                            assert(child.classList.contains('code-underline-colored'), 'DOM should have "code-underline-colored" class for advanced ANSI colors.');
                            assertInlineColor(child, 'underline', color);
                        });
                    }
                }
            }
            // Invalid color should not render
            assertSingleSequenceElement('\x1b[38;2;4;4m', (child) => {
                assert.strictEqual(0, child.classList.length, `Invalid color code "38;2;4;4" should not add a class (classes found: ${child.classList}).`);
                assert(!child.style.color, `Invalid color code "38;2;4;4" should not add a custom color CSS (found color: ${child.style.color}).`);
            });
            // Bad (nonexistent) color should not render
            assertSingleSequenceElement('\x1b[48;2;150;300;5m', (child) => {
                assert.strictEqual(0, child.classList.length, `Nonexistent color code "48;2;150;300;5" should not add a class (classes found: ${child.classList}).`);
            });
            // Should ignore any codes after the ones needed to determine color
            assertSingleSequenceElement('\x1b[48;2;100;42;77;99;200;75m', (child) => {
                assert(child.classList.contains('code-background-colored'), `Color code with extra (valid) items "48;2;100;42;77;99;200;75" should still treat initial part as valid code and add class "code-background-custom".`);
                assert.strictEqual(1, child.classList.length, `Color code with extra items "48;2;100;42;77;99;200;75" should add one and only one class. (classes found: ${child.classList}).`);
                assertInlineColor(child, 'background', new color_1.RGBA(100, 42, 77), `Color code "48;2;100;42;77;99;200;75" should  style background-color as rgb(100,42,77).`);
            });
        });
        /**
         * Assert that a given ANSI sequence produces the expected number of {@link HTMLSpanElement} children. For
         * each child, run the provided assertion.
         *
         * @param sequence The ANSI sequence to verify.
         * @param assertions A set of assertions to run on the resulting children.
         */
        function assertMultipleSequenceElements(sequence, assertions, elementsExpected) {
            if (elementsExpected === undefined) {
                elementsExpected = assertions.length;
            }
            const root = (0, debugANSIHandling_1.handleANSIOutput)(sequence, linkDetector, themeService, session.root);
            assert.strictEqual(elementsExpected, root.children.length);
            for (let i = 0; i < elementsExpected; i++) {
                const child = root.children[i];
                if (child instanceof HTMLSpanElement) {
                    assertions[i](child);
                }
                else {
                    assert.fail('Unexpected assertion error');
                }
            }
        }
        test('Expected multiple sequence operation', () => {
            // Multiple codes affect the same text
            assertSingleSequenceElement('\x1b[1m\x1b[3m\x1b[4m\x1b[32m', (child) => {
                assert(child.classList.contains('code-bold'), 'Bold class not found after multiple different ANSI codes.');
                assert(child.classList.contains('code-italic'), 'Italic class not found after multiple different ANSI codes.');
                assert(child.classList.contains('code-underline'), 'Underline class not found after multiple different ANSI codes.');
                assert(child.classList.contains('code-foreground-colored'), 'Foreground color class not found after multiple different ANSI codes.');
            });
            // Consecutive codes do not affect previous ones
            assertMultipleSequenceElements('\x1b[1mbold\x1b[32mgreen\x1b[4munderline\x1b[3mitalic\x1b[0mnothing', [
                (bold) => {
                    assert.strictEqual(1, bold.classList.length);
                    assert(bold.classList.contains('code-bold'), 'Bold class not found after bold ANSI code.');
                },
                (green) => {
                    assert.strictEqual(2, green.classList.length);
                    assert(green.classList.contains('code-bold'), 'Bold class not found after both bold and color ANSI codes.');
                    assert(green.classList.contains('code-foreground-colored'), 'Color class not found after color ANSI code.');
                },
                (underline) => {
                    assert.strictEqual(3, underline.classList.length);
                    assert(underline.classList.contains('code-bold'), 'Bold class not found after bold, color, and underline ANSI codes.');
                    assert(underline.classList.contains('code-foreground-colored'), 'Color class not found after color and underline ANSI codes.');
                    assert(underline.classList.contains('code-underline'), 'Underline class not found after underline ANSI code.');
                },
                (italic) => {
                    assert.strictEqual(4, italic.classList.length);
                    assert(italic.classList.contains('code-bold'), 'Bold class not found after bold, color, underline, and italic ANSI codes.');
                    assert(italic.classList.contains('code-foreground-colored'), 'Color class not found after color, underline, and italic ANSI codes.');
                    assert(italic.classList.contains('code-underline'), 'Underline class not found after underline and italic ANSI codes.');
                    assert(italic.classList.contains('code-italic'), 'Italic class not found after italic ANSI code.');
                },
                (nothing) => {
                    assert.strictEqual(0, nothing.classList.length, 'One or more style classes still found after reset ANSI code.');
                },
            ], 5);
            // Consecutive codes with ENDING/OFF codes do not LEAVE affect previous ones
            assertMultipleSequenceElements('\x1b[1mbold\x1b[22m\x1b[32mgreen\x1b[4munderline\x1b[24m\x1b[3mitalic\x1b[23mjustgreen\x1b[0mnothing', [
                (bold) => {
                    assert.strictEqual(1, bold.classList.length);
                    assert(bold.classList.contains('code-bold'), 'Bold class not found after bold ANSI code.');
                },
                (green) => {
                    assert.strictEqual(1, green.classList.length);
                    assert(green.classList.contains('code-bold') === false, 'Bold class found after both bold WAS TURNED OFF with 22m');
                    assert(green.classList.contains('code-foreground-colored'), 'Color class not found after color ANSI code.');
                },
                (underline) => {
                    assert.strictEqual(2, underline.classList.length);
                    assert(underline.classList.contains('code-foreground-colored'), 'Color class not found after color and underline ANSI codes.');
                    assert(underline.classList.contains('code-underline'), 'Underline class not found after underline ANSI code.');
                },
                (italic) => {
                    assert.strictEqual(2, italic.classList.length);
                    assert(italic.classList.contains('code-foreground-colored'), 'Color class not found after color, underline, and italic ANSI codes.');
                    assert(italic.classList.contains('code-underline') === false, 'Underline class found after underline WAS TURNED OFF with 24m');
                    assert(italic.classList.contains('code-italic'), 'Italic class not found after italic ANSI code.');
                },
                (justgreen) => {
                    assert.strictEqual(1, justgreen.classList.length);
                    assert(justgreen.classList.contains('code-italic') === false, 'Italic class found after italic WAS TURNED OFF with 23m');
                    assert(justgreen.classList.contains('code-foreground-colored'), 'Color class not found after color ANSI code.');
                },
                (nothing) => {
                    assert.strictEqual(0, nothing.classList.length, 'One or more style classes still found after reset ANSI code.');
                },
            ], 6);
            // more Consecutive codes with ENDING/OFF codes do not LEAVE affect previous ones
            assertMultipleSequenceElements('\x1b[2mdim\x1b[22m\x1b[32mgreen\x1b[5mslowblink\x1b[25m\x1b[6mrapidblink\x1b[25mjustgreen\x1b[0mnothing', [
                (dim) => {
                    assert.strictEqual(1, dim.classList.length);
                    assert(dim.classList.contains('code-dim'), 'Dim class not found after dim ANSI code 2m.');
                },
                (green) => {
                    assert.strictEqual(1, green.classList.length);
                    assert(green.classList.contains('code-dim') === false, 'Dim class found after dim WAS TURNED OFF with 22m');
                    assert(green.classList.contains('code-foreground-colored'), 'Color class not found after color ANSI code.');
                },
                (slowblink) => {
                    assert.strictEqual(2, slowblink.classList.length);
                    assert(slowblink.classList.contains('code-foreground-colored'), 'Color class not found after color and blink ANSI codes.');
                    assert(slowblink.classList.contains('code-blink'), 'Blink class not found after underline ANSI code 5m.');
                },
                (rapidblink) => {
                    assert.strictEqual(2, rapidblink.classList.length);
                    assert(rapidblink.classList.contains('code-foreground-colored'), 'Color class not found after color, blink, and rapid blink ANSI codes.');
                    assert(rapidblink.classList.contains('code-blink') === false, 'blink class found after underline WAS TURNED OFF with 25m');
                    assert(rapidblink.classList.contains('code-rapid-blink'), 'Rapid blink class not found after rapid blink ANSI code 6m.');
                },
                (justgreen) => {
                    assert.strictEqual(1, justgreen.classList.length);
                    assert(justgreen.classList.contains('code-rapid-blink') === false, 'Rapid blink class found after rapid blink WAS TURNED OFF with 25m');
                    assert(justgreen.classList.contains('code-foreground-colored'), 'Color class not found after color ANSI code.');
                },
                (nothing) => {
                    assert.strictEqual(0, nothing.classList.length, 'One or more style classes still found after reset ANSI code.');
                },
            ], 6);
            // more Consecutive codes with ENDING/OFF codes do not LEAVE affect previous ones
            assertMultipleSequenceElements('\x1b[8mhidden\x1b[28m\x1b[32mgreen\x1b[9mcrossedout\x1b[29m\x1b[21mdoubleunderline\x1b[24mjustgreen\x1b[0mnothing', [
                (hidden) => {
                    assert.strictEqual(1, hidden.classList.length);
                    assert(hidden.classList.contains('code-hidden'), 'Hidden class not found after dim ANSI code 8m.');
                },
                (green) => {
                    assert.strictEqual(1, green.classList.length);
                    assert(green.classList.contains('code-hidden') === false, 'Hidden class found after Hidden WAS TURNED OFF with 28m');
                    assert(green.classList.contains('code-foreground-colored'), 'Color class not found after color ANSI code.');
                },
                (crossedout) => {
                    assert.strictEqual(2, crossedout.classList.length);
                    assert(crossedout.classList.contains('code-foreground-colored'), 'Color class not found after color and hidden ANSI codes.');
                    assert(crossedout.classList.contains('code-strike-through'), 'strike-through class not found after crossout/strikethrough ANSI code 9m.');
                },
                (doubleunderline) => {
                    assert.strictEqual(2, doubleunderline.classList.length);
                    assert(doubleunderline.classList.contains('code-foreground-colored'), 'Color class not found after color, hidden, and crossedout ANSI codes.');
                    assert(doubleunderline.classList.contains('code-strike-through') === false, 'strike-through class found after strike-through WAS TURNED OFF with 29m');
                    assert(doubleunderline.classList.contains('code-double-underline'), 'Double underline class not found after double underline ANSI code 21m.');
                },
                (justgreen) => {
                    assert.strictEqual(1, justgreen.classList.length);
                    assert(justgreen.classList.contains('code-double-underline') === false, 'Double underline class found after double underline WAS TURNED OFF with 24m');
                    assert(justgreen.classList.contains('code-foreground-colored'), 'Color class not found after color ANSI code.');
                },
                (nothing) => {
                    assert.strictEqual(0, nothing.classList.length, 'One or more style classes still found after reset ANSI code.');
                },
            ], 6);
            // underline, double underline are mutually exclusive, test underline->double underline->off and double underline->underline->off
            assertMultipleSequenceElements('\x1b[4munderline\x1b[21mdouble underline\x1b[24munderlineOff\x1b[21mdouble underline\x1b[4munderline\x1b[24munderlineOff', [
                (underline) => {
                    assert.strictEqual(1, underline.classList.length);
                    assert(underline.classList.contains('code-underline'), 'Underline class not found after underline ANSI code 4m.');
                },
                (doubleunderline) => {
                    assert(doubleunderline.classList.contains('code-underline') === false, 'Underline class found after double underline code 21m');
                    assert(doubleunderline.classList.contains('code-double-underline'), 'Double underline class not found after double underline code 21m');
                    assert.strictEqual(1, doubleunderline.classList.length, 'should have found only double underline');
                },
                (nothing) => {
                    assert.strictEqual(0, nothing.classList.length, 'One or more style classes still found after underline off code 4m.');
                },
                (doubleunderline) => {
                    assert(doubleunderline.classList.contains('code-double-underline'), 'Double underline class not found after double underline code 21m');
                    assert.strictEqual(1, doubleunderline.classList.length, 'should have found only double underline');
                },
                (underline) => {
                    assert(underline.classList.contains('code-double-underline') === false, 'Double underline class found after underline code 4m');
                    assert(underline.classList.contains('code-underline'), 'Underline class not found after underline ANSI code 4m.');
                    assert.strictEqual(1, underline.classList.length, 'should have found only underline');
                },
                (nothing) => {
                    assert.strictEqual(0, nothing.classList.length, 'One or more style classes still found after underline off code 4m.');
                },
            ], 6);
            // underline and strike-through and overline can exist at the same time and
            // in any combination
            assertMultipleSequenceElements('\x1b[4munderline\x1b[9mand strikethough\x1b[53mand overline\x1b[24munderlineOff\x1b[55moverlineOff\x1b[29mstriklethoughOff', [
                (underline) => {
                    assert.strictEqual(1, underline.classList.length, 'should have found only underline');
                    assert(underline.classList.contains('code-underline'), 'Underline class not found after underline ANSI code 4m.');
                },
                (strikethrough) => {
                    assert(strikethrough.classList.contains('code-underline'), 'Underline class NOT found after strikethrough code 9m');
                    assert(strikethrough.classList.contains('code-strike-through'), 'Strike through class not found after strikethrough code 9m');
                    assert.strictEqual(2, strikethrough.classList.length, 'should have found underline and strikethrough');
                },
                (overline) => {
                    assert(overline.classList.contains('code-underline'), 'Underline class NOT found after overline code 53m');
                    assert(overline.classList.contains('code-strike-through'), 'Strike through class not found after overline code 53m');
                    assert(overline.classList.contains('code-overline'), 'Overline class not found after overline code 53m');
                    assert.strictEqual(3, overline.classList.length, 'should have found underline,strikethrough and overline');
                },
                (underlineoff) => {
                    assert(underlineoff.classList.contains('code-underline') === false, 'Underline class found after underline off code 24m');
                    assert(underlineoff.classList.contains('code-strike-through'), 'Strike through class not found after underline off code 24m');
                    assert(underlineoff.classList.contains('code-overline'), 'Overline class not found after underline off code 24m');
                    assert.strictEqual(2, underlineoff.classList.length, 'should have found strikethrough and overline');
                },
                (overlineoff) => {
                    assert(overlineoff.classList.contains('code-underline') === false, 'Underline class found after overline off code 55m');
                    assert(overlineoff.classList.contains('code-overline') === false, 'Overline class found after overline off code 55m');
                    assert(overlineoff.classList.contains('code-strike-through'), 'Strike through class not found after overline off code 55m');
                    assert.strictEqual(1, overlineoff.classList.length, 'should have found only strikethrough');
                },
                (nothing) => {
                    assert(nothing.classList.contains('code-strike-through') === false, 'Strike through class found after strikethrough off code 29m');
                    assert.strictEqual(0, nothing.classList.length, 'One or more style classes still found after strikethough OFF code 29m');
                },
            ], 6);
            // double underline and strike-through and overline can exist at the same time and
            // in any combination
            assertMultipleSequenceElements('\x1b[21mdoubleunderline\x1b[9mand strikethough\x1b[53mand overline\x1b[29mstriklethoughOff\x1b[55moverlineOff\x1b[24munderlineOff', [
                (doubleunderline) => {
                    assert.strictEqual(1, doubleunderline.classList.length, 'should have found only doubleunderline');
                    assert(doubleunderline.classList.contains('code-double-underline'), 'Double underline class not found after double underline ANSI code 21m.');
                },
                (strikethrough) => {
                    assert(strikethrough.classList.contains('code-double-underline'), 'Double nderline class NOT found after strikethrough code 9m');
                    assert(strikethrough.classList.contains('code-strike-through'), 'Strike through class not found after strikethrough code 9m');
                    assert.strictEqual(2, strikethrough.classList.length, 'should have found doubleunderline and strikethrough');
                },
                (overline) => {
                    assert(overline.classList.contains('code-double-underline'), 'Double underline class NOT found after overline code 53m');
                    assert(overline.classList.contains('code-strike-through'), 'Strike through class not found after overline code 53m');
                    assert(overline.classList.contains('code-overline'), 'Overline class not found after overline code 53m');
                    assert.strictEqual(3, overline.classList.length, 'should have found doubleunderline,overline and strikethrough');
                },
                (strikethrougheoff) => {
                    assert(strikethrougheoff.classList.contains('code-double-underline'), 'Double underline class NOT found after strikethrough off code 29m');
                    assert(strikethrougheoff.classList.contains('code-overline'), 'Overline class NOT found after strikethrough off code 29m');
                    assert(strikethrougheoff.classList.contains('code-strike-through') === false, 'Strike through class found after strikethrough off code 29m');
                    assert.strictEqual(2, strikethrougheoff.classList.length, 'should have found doubleunderline and overline');
                },
                (overlineoff) => {
                    assert(overlineoff.classList.contains('code-double-underline'), 'Double underline class NOT found after overline off code 55m');
                    assert(overlineoff.classList.contains('code-strike-through') === false, 'Strike through class found after overline off code 55m');
                    assert(overlineoff.classList.contains('code-overline') === false, 'Overline class found after overline off code 55m');
                    assert.strictEqual(1, overlineoff.classList.length, 'Should have found only double underline');
                },
                (nothing) => {
                    assert(nothing.classList.contains('code-double-underline') === false, 'Double underline class found after underline off code 24m');
                    assert.strictEqual(0, nothing.classList.length, 'One or more style classes still found after underline OFF code 24m');
                },
            ], 6);
            // superscript and subscript are mutually exclusive, test superscript->subscript->off and subscript->superscript->off
            assertMultipleSequenceElements('\x1b[73msuperscript\x1b[74msubscript\x1b[75mneither\x1b[74msubscript\x1b[73msuperscript\x1b[75mneither', [
                (superscript) => {
                    assert.strictEqual(1, superscript.classList.length, 'should only be superscript class');
                    assert(superscript.classList.contains('code-superscript'), 'Superscript class not found after superscript ANSI code 73m.');
                },
                (subscript) => {
                    assert(subscript.classList.contains('code-superscript') === false, 'Superscript class found after subscript code 74m');
                    assert(subscript.classList.contains('code-subscript'), 'Subscript class not found after subscript code 74m');
                    assert.strictEqual(1, subscript.classList.length, 'should have found only subscript class');
                },
                (nothing) => {
                    assert.strictEqual(0, nothing.classList.length, 'One or more style classes still found after superscript/subscript off code 75m.');
                },
                (subscript) => {
                    assert(subscript.classList.contains('code-subscript'), 'Subscript class not found after subscript code 74m');
                    assert.strictEqual(1, subscript.classList.length, 'should have found only subscript class');
                },
                (superscript) => {
                    assert(superscript.classList.contains('code-subscript') === false, 'Subscript class found after superscript code 73m');
                    assert(superscript.classList.contains('code-superscript'), 'Superscript class not found after superscript ANSI code 73m.');
                    assert.strictEqual(1, superscript.classList.length, 'should have found only superscript class');
                },
                (nothing) => {
                    assert.strictEqual(0, nothing.classList.length, 'One or more style classes still found after superscipt/subscript off code 75m.');
                },
            ], 6);
            // Consecutive font codes switch to new font class and remove previous and then final switch to default font removes class
            assertMultipleSequenceElements('\x1b[11mFont1\x1b[12mFont2\x1b[13mFont3\x1b[14mFont4\x1b[15mFont5\x1b[10mdefaultFont', [
                (font1) => {
                    assert.strictEqual(1, font1.classList.length);
                    assert(font1.classList.contains('code-font-1'), 'font 1 class NOT found after switch to font 1 with ANSI code 11m');
                },
                (font2) => {
                    assert.strictEqual(1, font2.classList.length);
                    assert(font2.classList.contains('code-font-1') === false, 'font 1 class found after switch to font 2 with ANSI code 12m');
                    assert(font2.classList.contains('code-font-2'), 'font 2 class NOT found after switch to font 2 with ANSI code 12m');
                },
                (font3) => {
                    assert.strictEqual(1, font3.classList.length);
                    assert(font3.classList.contains('code-font-2') === false, 'font 2 class found after switch to font 3 with ANSI code 13m');
                    assert(font3.classList.contains('code-font-3'), 'font 3 class NOT found after switch to font 3 with ANSI code 13m');
                },
                (font4) => {
                    assert.strictEqual(1, font4.classList.length);
                    assert(font4.classList.contains('code-font-3') === false, 'font 3 class found after switch to font 4 with ANSI code 14m');
                    assert(font4.classList.contains('code-font-4'), 'font 4 class NOT found after switch to font 4 with ANSI code 14m');
                },
                (font5) => {
                    assert.strictEqual(1, font5.classList.length);
                    assert(font5.classList.contains('code-font-4') === false, 'font 4 class found after switch to font 5 with ANSI code 15m');
                    assert(font5.classList.contains('code-font-5'), 'font 5 class NOT found after switch to font 5 with ANSI code 15m');
                },
                (defaultfont) => {
                    assert.strictEqual(0, defaultfont.classList.length, 'One or more font style classes still found after reset to default font with ANSI code 10m.');
                },
            ], 6);
            // More Consecutive font codes switch to new font class and remove previous and then final switch to default font removes class
            assertMultipleSequenceElements('\x1b[16mFont6\x1b[17mFont7\x1b[18mFont8\x1b[19mFont9\x1b[20mFont10\x1b[10mdefaultFont', [
                (font6) => {
                    assert.strictEqual(1, font6.classList.length);
                    assert(font6.classList.contains('code-font-6'), 'font 6 class NOT found after switch to font 6 with ANSI code 16m');
                },
                (font7) => {
                    assert.strictEqual(1, font7.classList.length);
                    assert(font7.classList.contains('code-font-6') === false, 'font 6 class found after switch to font 7 with ANSI code 17m');
                    assert(font7.classList.contains('code-font-7'), 'font 7 class NOT found after switch to font 7 with ANSI code 17m');
                },
                (font8) => {
                    assert.strictEqual(1, font8.classList.length);
                    assert(font8.classList.contains('code-font-7') === false, 'font 7 class found after switch to font 8 with ANSI code 18m');
                    assert(font8.classList.contains('code-font-8'), 'font 8 class NOT found after switch to font 8 with ANSI code 18m');
                },
                (font9) => {
                    assert.strictEqual(1, font9.classList.length);
                    assert(font9.classList.contains('code-font-8') === false, 'font 8 class found after switch to font 9 with ANSI code 19m');
                    assert(font9.classList.contains('code-font-9'), 'font 9 class NOT found after switch to font 9 with ANSI code 19m');
                },
                (font10) => {
                    assert.strictEqual(1, font10.classList.length);
                    assert(font10.classList.contains('code-font-9') === false, 'font 9 class found after switch to font 10 with ANSI code 20m');
                    assert(font10.classList.contains('code-font-10'), `font 10 class NOT found after switch to font 10 with ANSI code 20m (${font10.classList})`);
                },
                (defaultfont) => {
                    assert.strictEqual(0, defaultfont.classList.length, 'One or more font style classes (2nd series) still found after reset to default font with ANSI code 10m.');
                },
            ], 6);
            // Blackletter font codes can be turned off with other font codes or 23m
            assertMultipleSequenceElements('\x1b[3mitalic\x1b[20mfont10blacklatter\x1b[23mitalicAndBlackletterOff\x1b[20mFont10Again\x1b[11mFont1\x1b[10mdefaultFont', [
                (italic) => {
                    assert.strictEqual(1, italic.classList.length);
                    assert(italic.classList.contains('code-italic'), 'italic class NOT found after italic code ANSI code 3m');
                },
                (font10) => {
                    assert.strictEqual(2, font10.classList.length);
                    assert(font10.classList.contains('code-italic'), 'no itatic class found after switch to font 10 (blackletter) with ANSI code 20m');
                    assert(font10.classList.contains('code-font-10'), 'font 10 class NOT found after switch to font 10 with ANSI code 20m');
                },
                (italicAndBlackletterOff) => {
                    assert.strictEqual(0, italicAndBlackletterOff.classList.length, 'italic or blackletter (font10) class found after both switched off with ANSI code 23m');
                },
                (font10) => {
                    assert.strictEqual(1, font10.classList.length);
                    assert(font10.classList.contains('code-font-10'), 'font 10 class NOT found after switch to font 10 with ANSI code 20m');
                },
                (font1) => {
                    assert.strictEqual(1, font1.classList.length);
                    assert(font1.classList.contains('code-font-10') === false, 'font 10 class found after switch to font 1 with ANSI code 11m');
                    assert(font1.classList.contains('code-font-1'), 'font 1 class NOT found after switch to font 1 with ANSI code 11m');
                },
                (defaultfont) => {
                    assert.strictEqual(0, defaultfont.classList.length, 'One or more font style classes (2nd series) still found after reset to default font with ANSI code 10m.');
                },
            ], 6);
            // italic can be turned on/off with affecting font codes 1-9  (italic off will clear 'blackletter'(font 23) as per spec)
            assertMultipleSequenceElements('\x1b[3mitalic\x1b[12mfont2\x1b[23mitalicOff\x1b[3mitalicFont2\x1b[10mjustitalic\x1b[23mnothing', [
                (italic) => {
                    assert.strictEqual(1, italic.classList.length);
                    assert(italic.classList.contains('code-italic'), 'italic class NOT found after italic code ANSI code 3m');
                },
                (font10) => {
                    assert.strictEqual(2, font10.classList.length);
                    assert(font10.classList.contains('code-italic'), 'no itatic class found after switch to font 2 with ANSI code 12m');
                    assert(font10.classList.contains('code-font-2'), 'font 2 class NOT found after switch to font 2 with ANSI code 12m');
                },
                (italicOff) => {
                    assert.strictEqual(1, italicOff.classList.length, 'italic class found after both switched off with ANSI code 23m');
                    assert(italicOff.classList.contains('code-italic') === false, 'itatic class found after switching it OFF with ANSI code 23m');
                    assert(italicOff.classList.contains('code-font-2'), 'font 2 class NOT found after switching italic off with ANSI code 23m');
                },
                (italicFont2) => {
                    assert.strictEqual(2, italicFont2.classList.length);
                    assert(italicFont2.classList.contains('code-italic'), 'no itatic class found after italic ANSI code 3m');
                    assert(italicFont2.classList.contains('code-font-2'), 'font 2 class NOT found after italic ANSI code 3m');
                },
                (justitalic) => {
                    assert.strictEqual(1, justitalic.classList.length);
                    assert(justitalic.classList.contains('code-font-2') === false, 'font 2 class found after switch to default font with ANSI code 10m');
                    assert(justitalic.classList.contains('code-italic'), 'italic class NOT found after switch to default font with ANSI code 10m');
                },
                (nothing) => {
                    assert.strictEqual(0, nothing.classList.length, 'One or more classes still found after final italic removal with ANSI code 23m.');
                },
            ], 6);
            // Reverse video reverses Foreground/Background colors WITH both SET and can called in sequence
            assertMultipleSequenceElements('\x1b[38;2;10;20;30mfg10,20,30\x1b[48;2;167;168;169mbg167,168,169\x1b[7m8ReverseVideo\x1b[7mDuplicateReverseVideo\x1b[27mReverseOff\x1b[27mDupReverseOff', [
                (fg10_20_30) => {
                    assert.strictEqual(1, fg10_20_30.classList.length, 'Foreground ANSI color code should add one class.');
                    assert(fg10_20_30.classList.contains('code-foreground-colored'), 'Foreground ANSI color codes should add custom foreground color class.');
                    assertInlineColor(fg10_20_30, 'foreground', new color_1.RGBA(10, 20, 30), '24-bit RGBA ANSI color code (10,20,30) should add matching color inline style.');
                },
                (bg167_168_169) => {
                    assert.strictEqual(2, bg167_168_169.classList.length, 'background ANSI color codes should only add a single class.');
                    assert(bg167_168_169.classList.contains('code-background-colored'), 'Background ANSI color codes should add custom background color class.');
                    assertInlineColor(bg167_168_169, 'background', new color_1.RGBA(167, 168, 169), '24-bit RGBA ANSI background color code (167,168,169) should add matching color inline style.');
                    assert(bg167_168_169.classList.contains('code-foreground-colored'), 'Still Foreground ANSI color codes should add custom foreground color class.');
                    assertInlineColor(bg167_168_169, 'foreground', new color_1.RGBA(10, 20, 30), 'Still 24-bit RGBA ANSI color code (10,20,30) should add matching color inline style.');
                },
                (reverseVideo) => {
                    assert.strictEqual(2, reverseVideo.classList.length, 'background ANSI color codes should only add a single class.');
                    assert(reverseVideo.classList.contains('code-background-colored'), 'Background ANSI color codes should add custom background color class.');
                    assertInlineColor(reverseVideo, 'foreground', new color_1.RGBA(167, 168, 169), 'Reversed 24-bit RGBA ANSI foreground color code (167,168,169) should add matching former background color inline style.');
                    assert(reverseVideo.classList.contains('code-foreground-colored'), 'Still Foreground ANSI color codes should add custom foreground color class.');
                    assertInlineColor(reverseVideo, 'background', new color_1.RGBA(10, 20, 30), 'Reversed 24-bit RGBA ANSI background color code (10,20,30) should add matching former foreground color inline style.');
                },
                (dupReverseVideo) => {
                    assert.strictEqual(2, dupReverseVideo.classList.length, 'After second Reverse Video - background ANSI color codes should only add a single class.');
                    assert(dupReverseVideo.classList.contains('code-background-colored'), 'After second Reverse Video - Background ANSI color codes should add custom background color class.');
                    assertInlineColor(dupReverseVideo, 'foreground', new color_1.RGBA(167, 168, 169), 'After second Reverse Video - Reversed 24-bit RGBA ANSI foreground color code (167,168,169) should add matching former background color inline style.');
                    assert(dupReverseVideo.classList.contains('code-foreground-colored'), 'After second Reverse Video - Still Foreground ANSI color codes should add custom foreground color class.');
                    assertInlineColor(dupReverseVideo, 'background', new color_1.RGBA(10, 20, 30), 'After second Reverse Video - Reversed 24-bit RGBA ANSI background color code (10,20,30) should add matching former foreground color inline style.');
                },
                (reversedBack) => {
                    assert.strictEqual(2, reversedBack.classList.length, 'Reversed Back - background ANSI color codes should only add a single class.');
                    assert(reversedBack.classList.contains('code-background-colored'), 'Reversed Back - Background ANSI color codes should add custom background color class.');
                    assertInlineColor(reversedBack, 'background', new color_1.RGBA(167, 168, 169), 'Reversed Back - 24-bit RGBA ANSI background color code (167,168,169) should add matching color inline style.');
                    assert(reversedBack.classList.contains('code-foreground-colored'), 'Reversed Back -  Foreground ANSI color codes should add custom foreground color class.');
                    assertInlineColor(reversedBack, 'foreground', new color_1.RGBA(10, 20, 30), 'Reversed Back -  24-bit RGBA ANSI color code (10,20,30) should add matching color inline style.');
                },
                (dupReversedBack) => {
                    assert.strictEqual(2, dupReversedBack.classList.length, '2nd Reversed Back - background ANSI color codes should only add a single class.');
                    assert(dupReversedBack.classList.contains('code-background-colored'), '2nd Reversed Back - Background ANSI color codes should add custom background color class.');
                    assertInlineColor(dupReversedBack, 'background', new color_1.RGBA(167, 168, 169), '2nd Reversed Back - 24-bit RGBA ANSI background color code (167,168,169) should add matching color inline style.');
                    assert(dupReversedBack.classList.contains('code-foreground-colored'), '2nd Reversed Back -  Foreground ANSI color codes should add custom foreground color class.');
                    assertInlineColor(dupReversedBack, 'foreground', new color_1.RGBA(10, 20, 30), '2nd Reversed Back -  24-bit RGBA ANSI color code (10,20,30) should add matching color inline style.');
                },
            ], 6);
            // Reverse video reverses Foreground/Background colors WITH ONLY foreground color SET
            assertMultipleSequenceElements('\x1b[38;2;10;20;30mfg10,20,30\x1b[7m8ReverseVideo\x1b[27mReverseOff', [
                (fg10_20_30) => {
                    assert.strictEqual(1, fg10_20_30.classList.length, 'Foreground ANSI color code should add one class.');
                    assert(fg10_20_30.classList.contains('code-foreground-colored'), 'Foreground ANSI color codes should add custom foreground color class.');
                    assertInlineColor(fg10_20_30, 'foreground', new color_1.RGBA(10, 20, 30), '24-bit RGBA ANSI color code (10,20,30) should add matching color inline style.');
                },
                (reverseVideo) => {
                    assert.strictEqual(1, reverseVideo.classList.length, 'Background ANSI color codes should only add a single class.');
                    assert(reverseVideo.classList.contains('code-background-colored'), 'Background ANSI color codes should add custom background color class.');
                    assert(reverseVideo.classList.contains('code-foreground-colored') === false, 'After Reverse with NO background the Foreground ANSI color codes should NOT BE SET.');
                    assertInlineColor(reverseVideo, 'background', new color_1.RGBA(10, 20, 30), 'Reversed 24-bit RGBA ANSI background color code (10,20,30) should add matching former foreground color inline style.');
                },
                (reversedBack) => {
                    assert.strictEqual(1, reversedBack.classList.length, 'Reversed Back - background ANSI color codes should only add a single class.');
                    assert(reversedBack.classList.contains('code-background-colored') === false, 'AFTER Reversed Back - Background ANSI color should NOT BE SET.');
                    assert(reversedBack.classList.contains('code-foreground-colored'), 'Reversed Back -  Foreground ANSI color codes should add custom foreground color class.');
                    assertInlineColor(reversedBack, 'foreground', new color_1.RGBA(10, 20, 30), 'Reversed Back -  24-bit RGBA ANSI color code (10,20,30) should add matching color inline style.');
                },
            ], 3);
            // Reverse video reverses Foreground/Background colors WITH ONLY background color SET
            assertMultipleSequenceElements('\x1b[48;2;167;168;169mbg167,168,169\x1b[7m8ReverseVideo\x1b[27mReverseOff', [
                (bg167_168_169) => {
                    assert.strictEqual(1, bg167_168_169.classList.length, 'Background ANSI color code should add one class.');
                    assert(bg167_168_169.classList.contains('code-background-colored'), 'Background ANSI color codes should add custom foreground color class.');
                    assertInlineColor(bg167_168_169, 'background', new color_1.RGBA(167, 168, 169), '24-bit RGBA ANSI color code (167, 168, 169) should add matching background color inline style.');
                },
                (reverseVideo) => {
                    assert.strictEqual(1, reverseVideo.classList.length, 'After ReverseVideo Foreground ANSI color codes should only add a single class.');
                    assert(reverseVideo.classList.contains('code-foreground-colored'), 'After ReverseVideo Foreground ANSI color codes should add custom background color class.');
                    assert(reverseVideo.classList.contains('code-background-colored') === false, 'After Reverse with NO foreground color the background ANSI color codes should BE SET.');
                    assertInlineColor(reverseVideo, 'foreground', new color_1.RGBA(167, 168, 169), 'Reversed 24-bit RGBA ANSI background color code (10,20,30) should add matching former background color inline style.');
                },
                (reversedBack) => {
                    assert.strictEqual(1, reversedBack.classList.length, 'Reversed Back - background ANSI color codes should only add a single class.');
                    assert(reversedBack.classList.contains('code-foreground-colored') === false, 'AFTER Reversed Back - Foreground ANSI color should NOT BE SET.');
                    assert(reversedBack.classList.contains('code-background-colored'), 'Reversed Back -  Background ANSI color codes should add custom background color class.');
                    assertInlineColor(reversedBack, 'background', new color_1.RGBA(167, 168, 169), 'Reversed Back -  24-bit RGBA ANSI color code (10,20,30) should add matching background color inline style.');
                },
            ], 3);
            // Underline color Different types of color codes still cancel each other
            assertMultipleSequenceElements('\x1b[58;2;101;102;103m24bitUnderline101,102,103\x1b[58;5;3m8bitsimpleUnderline\x1b[58;2;104;105;106m24bitUnderline104,105,106\x1b[58;5;101m8bitadvanced\x1b[58;2;200;200;200munderline200,200,200\x1b[59mUnderlineColorResetToDefault', [
                (adv24Bit) => {
                    assert.strictEqual(1, adv24Bit.classList.length, 'Underline ANSI color codes should only add a single class (1).');
                    assert(adv24Bit.classList.contains('code-underline-colored'), 'Underline ANSI color codes should add custom underline color class.');
                    assertInlineColor(adv24Bit, 'underline', new color_1.RGBA(101, 102, 103), '24-bit RGBA ANSI color code (101,102,103) should add matching color inline style.');
                },
                (adv8BitSimple) => {
                    assert.strictEqual(1, adv8BitSimple.classList.length, 'Multiple underline ANSI color codes should only add a single class (2).');
                    assert(adv8BitSimple.classList.contains('code-underline-colored'), 'Underline ANSI color codes should add custom underline color class.');
                    // changed to simple theme color, don't know exactly what it should be, but it should NO LONGER BE 101,102,103
                    assertInlineColor(adv8BitSimple, 'underline', new color_1.RGBA(101, 102, 103), 'Change to theme color SHOULD NOT STILL BE 24-bit RGBA ANSI color code (101,102,103) should add matching color inline style.', false);
                },
                (adv24BitAgain) => {
                    assert.strictEqual(1, adv24BitAgain.classList.length, 'Multiple underline ANSI color codes should only add a single class (3).');
                    assert(adv24BitAgain.classList.contains('code-underline-colored'), 'Underline ANSI color codes should add custom underline color class.');
                    assertInlineColor(adv24BitAgain, 'underline', new color_1.RGBA(104, 105, 106), '24-bit RGBA ANSI color code (100,100,100) should add matching color inline style.');
                },
                (adv8BitAdvanced) => {
                    assert.strictEqual(1, adv8BitAdvanced.classList.length, 'Multiple underline ANSI color codes should only add a single class (4).');
                    assert(adv8BitAdvanced.classList.contains('code-underline-colored'), 'Underline ANSI color codes should add custom underline color class.');
                    // changed to 8bit advanced color, don't know exactly what it should be, but it should NO LONGER BE 104,105,106
                    assertInlineColor(adv8BitAdvanced, 'underline', new color_1.RGBA(104, 105, 106), 'Change to theme color SHOULD NOT BE 24-bit RGBA ANSI color code (104,105,106) should add matching color inline style.', false);
                },
                (adv24BitUnderlin200) => {
                    assert.strictEqual(1, adv24BitUnderlin200.classList.length, 'Multiple underline ANSI color codes should only add a single class 4.');
                    assert(adv24BitUnderlin200.classList.contains('code-underline-colored'), 'Underline ANSI color codes should add custom underline color class.');
                    assertInlineColor(adv24BitUnderlin200, 'underline', new color_1.RGBA(200, 200, 200), 'after change underline color SHOULD BE 24-bit RGBA ANSI color code (200,200,200) should add matching color inline style.');
                },
                (underlineColorResetToDefault) => {
                    assert.strictEqual(0, underlineColorResetToDefault.classList.length, 'After Underline Color reset to default NO underline color class should be set.');
                    assertInlineColor(underlineColorResetToDefault, 'underline', undefined, 'after RESET TO DEFAULT underline color SHOULD NOT BE SET (no color inline style.)');
                },
            ], 6);
            // Different types of color codes still cancel each other
            assertMultipleSequenceElements('\x1b[34msimple\x1b[38;2;101;102;103m24bit\x1b[38;5;3m8bitsimple\x1b[38;2;104;105;106m24bitAgain\x1b[38;5;101m8bitadvanced', [
                (simple) => {
                    assert.strictEqual(1, simple.classList.length, 'Foreground ANSI color code should add one class.');
                    assert(simple.classList.contains('code-foreground-colored'), 'Foreground ANSI color codes should add custom foreground color class.');
                },
                (adv24Bit) => {
                    assert.strictEqual(1, adv24Bit.classList.length, 'Multiple foreground ANSI color codes should only add a single class.');
                    assert(adv24Bit.classList.contains('code-foreground-colored'), 'Foreground ANSI color codes should add custom foreground color class.');
                    assertInlineColor(adv24Bit, 'foreground', new color_1.RGBA(101, 102, 103), '24-bit RGBA ANSI color code (101,102,103) should add matching color inline style.');
                },
                (adv8BitSimple) => {
                    assert.strictEqual(1, adv8BitSimple.classList.length, 'Multiple foreground ANSI color codes should only add a single class.');
                    assert(adv8BitSimple.classList.contains('code-foreground-colored'), 'Foreground ANSI color codes should add custom foreground color class.');
                    //color is theme based, so we can't check what it should be but we know it should NOT BE 101,102,103 anymore
                    assertInlineColor(adv8BitSimple, 'foreground', new color_1.RGBA(101, 102, 103), 'SHOULD NOT LONGER BE 24-bit RGBA ANSI color code (101,102,103) after simple color change.', false);
                },
                (adv24BitAgain) => {
                    assert.strictEqual(1, adv24BitAgain.classList.length, 'Multiple foreground ANSI color codes should only add a single class.');
                    assert(adv24BitAgain.classList.contains('code-foreground-colored'), 'Foreground ANSI color codes should add custom foreground color class.');
                    assertInlineColor(adv24BitAgain, 'foreground', new color_1.RGBA(104, 105, 106), '24-bit RGBA ANSI color code (104,105,106) should add matching color inline style.');
                },
                (adv8BitAdvanced) => {
                    assert.strictEqual(1, adv8BitAdvanced.classList.length, 'Multiple foreground ANSI color codes should only add a single class.');
                    assert(adv8BitAdvanced.classList.contains('code-foreground-colored'), 'Foreground ANSI color codes should add custom foreground color class.');
                    // color should NO LONGER BE 104,105,106
                    assertInlineColor(adv8BitAdvanced, 'foreground', new color_1.RGBA(104, 105, 106), 'SHOULD NOT LONGER BE 24-bit RGBA ANSI color code (104,105,106) after advanced color change.', false);
                }
            ], 5);
        });
        /**
         * Assert that the provided ANSI sequence exactly matches the text content of the resulting
         * {@link HTMLSpanElement}.
         *
         * @param sequence The ANSI sequence to verify.
         */
        function assertSequencestrictEqualToContent(sequence) {
            const child = getSequenceOutput(sequence);
            assert(child.textContent === sequence);
        }
        test('Invalid codes treated as regular text', () => {
            // Individual components of ANSI code start are printed
            assertSequencestrictEqualToContent('\x1b');
            assertSequencestrictEqualToContent('[');
            // Unsupported sequence prints both characters
            assertSequencestrictEqualToContent('\x1b[');
            // Random strings are displayed properly
            for (let i = 0; i < 50; i++) {
                const uuid = (0, uuid_1.generateUuid)();
                assertSequencestrictEqualToContent(uuid);
            }
        });
        /**
         * Assert that a given ANSI sequence maintains added content following the ANSI code, and that
         * the expression itself is thrown away.
         *
         * @param sequence The ANSI sequence to verify. The provided sequence should contain ANSI codes
         * only, and should not include actual text content as it is provided by this function.
         */
        function assertEmptyOutput(sequence) {
            const child = getSequenceOutput(sequence + 'content');
            assert.strictEqual('content', child.textContent);
            assert.strictEqual(0, child.classList.length);
        }
        test('Empty sequence output', () => {
            const sequences = [
                // No colour codes
                '',
                '\x1b[;m',
                '\x1b[1;;m',
                '\x1b[m',
                '\x1b[99m'
            ];
            sequences.forEach(sequence => {
                assertEmptyOutput(sequence);
            });
            // Check other possible ANSI terminators
            const terminators = 'ABCDHIJKfhmpsu'.split('');
            terminators.forEach(terminator => {
                assertEmptyOutput('\x1b[content' + terminator);
            });
        });
        test('calcANSI8bitColor', () => {
            // Invalid values
            // Negative (below range), simple range, decimals
            for (let i = -10; i <= 15; i += 0.5) {
                assert((0, debugANSIHandling_1.calcANSI8bitColor)(i) === undefined, 'Values less than 16 passed to calcANSI8bitColor should return undefined.');
            }
            // In-range range decimals
            for (let i = 16.5; i < 254; i += 1) {
                assert((0, debugANSIHandling_1.calcANSI8bitColor)(i) === undefined, 'Floats passed to calcANSI8bitColor should return undefined.');
            }
            // Above range
            for (let i = 256; i < 300; i += 0.5) {
                assert((0, debugANSIHandling_1.calcANSI8bitColor)(i) === undefined, 'Values grather than 255 passed to calcANSI8bitColor should return undefined.');
            }
            // All valid colors
            for (let red = 0; red <= 5; red++) {
                for (let green = 0; green <= 5; green++) {
                    for (let blue = 0; blue <= 5; blue++) {
                        const colorOut = (0, debugANSIHandling_1.calcANSI8bitColor)(16 + red * 36 + green * 6 + blue);
                        assert(colorOut.r === Math.round(red * (255 / 5)), 'Incorrect red value encountered for color');
                        assert(colorOut.g === Math.round(green * (255 / 5)), 'Incorrect green value encountered for color');
                        assert(colorOut.b === Math.round(blue * (255 / 5)), 'Incorrect balue value encountered for color');
                    }
                }
            }
            // All grays
            for (let i = 232; i <= 255; i++) {
                const grayOut = (0, debugANSIHandling_1.calcANSI8bitColor)(i);
                assert(grayOut.r === grayOut.g);
                assert(grayOut.r === grayOut.b);
                assert(grayOut.r === Math.round((i - 232) / 23 * 255));
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdBTlNJSGFuZGxpbmcudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvdGVzdC9icm93c2VyL2RlYnVnQU5TSUhhbmRsaW5nLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFFbkMsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksS0FBaUIsQ0FBQztRQUN0QixJQUFJLE9BQXFCLENBQUM7UUFDMUIsSUFBSSxZQUEwQixDQUFDO1FBQy9CLElBQUksWUFBMkIsQ0FBQztRQUVoQzs7V0FFRztRQUNILEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDcEMsS0FBSyxHQUFHLElBQUEscUNBQW9CLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDMUMsT0FBTyxHQUFHLElBQUEsa0NBQWlCLEVBQUMsS0FBSyxDQUFDLENBQUM7WUFFbkMsTUFBTSxvQkFBb0IsR0FBdUQsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDdkksWUFBWSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBWSxDQUFDLENBQUM7WUFFakUsTUFBTSxNQUFNLEdBQTZCLEVBQUUsQ0FBQztZQUM1QyxLQUFLLE1BQU0sS0FBSyxJQUFJLG9DQUFZLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFRLG9DQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztZQUN4RCxDQUFDO1lBQ0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxpQ0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdDLFlB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