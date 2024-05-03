/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/dom", "vs/base/browser/ui/menu/menu", "vs/base/browser/ui/menu/menubar", "vs/base/test/common/utils"], function (require, exports, assert, dom_1, menu_1, menubar_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getButtonElementByAriaLabel(menubarElement, ariaLabel) {
        let i;
        for (i = 0; i < menubarElement.childElementCount; i++) {
            if (menubarElement.children[i].getAttribute('aria-label') === ariaLabel) {
                return menubarElement.children[i];
            }
        }
        return null;
    }
    function getTitleDivFromButtonDiv(menuButtonElement) {
        let i;
        for (i = 0; i < menuButtonElement.childElementCount; i++) {
            if (menuButtonElement.children[i].classList.contains('menubar-menu-title')) {
                return menuButtonElement.children[i];
            }
        }
        return null;
    }
    function getMnemonicFromTitleDiv(menuTitleDiv) {
        let i;
        for (i = 0; i < menuTitleDiv.childElementCount; i++) {
            if (menuTitleDiv.children[i].tagName.toLocaleLowerCase() === 'mnemonic') {
                return menuTitleDiv.children[i].textContent;
            }
        }
        return null;
    }
    function validateMenuBarItem(menubar, menubarContainer, label, readableLabel, mnemonic) {
        menubar.push([
            {
                actions: [],
                label: label
            }
        ]);
        const buttonElement = getButtonElementByAriaLabel(menubarContainer, readableLabel);
        assert(buttonElement !== null, `Button element not found for ${readableLabel} button.`);
        const titleDiv = getTitleDivFromButtonDiv(buttonElement);
        assert(titleDiv !== null, `Title div not found for ${readableLabel} button.`);
        const mnem = getMnemonicFromTitleDiv(titleDiv);
        assert.strictEqual(mnem, mnemonic, 'Mnemonic not correct');
    }
    suite('Menubar', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const container = (0, dom_1.$)('.container');
        const menubar = new menubar_1.MenuBar(container, {
            enableMnemonics: true,
            visibility: 'visible'
        }, menu_1.unthemedMenuStyles);
        test('English File menu renders mnemonics', function () {
            validateMenuBarItem(menubar, container, '&File', 'File', 'F');
        });
        test('Russian File menu renders mnemonics', function () {
            validateMenuBarItem(menubar, container, '&Файл', 'Файл', 'Ф');
        });
        test('Chinese File menu renders mnemonics', function () {
            validateMenuBarItem(menubar, container, '文件(&F)', '文件', 'F');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudWJhci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvYnJvd3Nlci91aS9tZW51L21lbnViYXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxTQUFTLDJCQUEyQixDQUFDLGNBQTJCLEVBQUUsU0FBaUI7UUFDbEYsSUFBSSxDQUFDLENBQUM7UUFDTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBRXZELElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3pFLE9BQU8sY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQWdCLENBQUM7WUFDbEQsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFFRCxTQUFTLHdCQUF3QixDQUFDLGlCQUE4QjtRQUMvRCxJQUFJLENBQUMsQ0FBQztRQUNOLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsaUJBQWlCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUMxRCxJQUFJLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztnQkFDNUUsT0FBTyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFnQixDQUFDO1lBQ3JELENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsU0FBUyx1QkFBdUIsQ0FBQyxZQUF5QjtRQUN6RCxJQUFJLENBQUMsQ0FBQztRQUNOLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDckQsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUN6RSxPQUFPLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO1lBQzdDLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsU0FBUyxtQkFBbUIsQ0FBQyxPQUFnQixFQUFFLGdCQUE2QixFQUFFLEtBQWEsRUFBRSxhQUFxQixFQUFFLFFBQWdCO1FBQ25JLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDWjtnQkFDQyxPQUFPLEVBQUUsRUFBRTtnQkFDWCxLQUFLLEVBQUUsS0FBSzthQUNaO1NBQ0QsQ0FBQyxDQUFDO1FBRUgsTUFBTSxhQUFhLEdBQUcsMkJBQTJCLENBQUMsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDbkYsTUFBTSxDQUFDLGFBQWEsS0FBSyxJQUFJLEVBQUUsZ0NBQWdDLGFBQWEsVUFBVSxDQUFDLENBQUM7UUFFeEYsTUFBTSxRQUFRLEdBQUcsd0JBQXdCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDekQsTUFBTSxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUUsMkJBQTJCLGFBQWEsVUFBVSxDQUFDLENBQUM7UUFFOUUsTUFBTSxJQUFJLEdBQUcsdUJBQXVCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLHNCQUFzQixDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVELEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1FBQ3JCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUMxQyxNQUFNLFNBQVMsR0FBRyxJQUFBLE9BQUMsRUFBQyxZQUFZLENBQUMsQ0FBQztRQUVsQyxNQUFNLE9BQU8sR0FBRyxJQUFJLGlCQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3RDLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLFVBQVUsRUFBRSxTQUFTO1NBQ3JCLEVBQUUseUJBQWtCLENBQUMsQ0FBQztRQUV2QixJQUFJLENBQUMscUNBQXFDLEVBQUU7WUFDM0MsbUJBQW1CLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQy9ELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFDQUFxQyxFQUFFO1lBQzNDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRTtZQUMzQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9