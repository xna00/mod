/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/config/domFontInfo"], function (require, exports, domFontInfo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CharWidthRequest = exports.CharWidthRequestType = void 0;
    exports.readCharWidths = readCharWidths;
    var CharWidthRequestType;
    (function (CharWidthRequestType) {
        CharWidthRequestType[CharWidthRequestType["Regular"] = 0] = "Regular";
        CharWidthRequestType[CharWidthRequestType["Italic"] = 1] = "Italic";
        CharWidthRequestType[CharWidthRequestType["Bold"] = 2] = "Bold";
    })(CharWidthRequestType || (exports.CharWidthRequestType = CharWidthRequestType = {}));
    class CharWidthRequest {
        constructor(chr, type) {
            this.chr = chr;
            this.type = type;
            this.width = 0;
        }
        fulfill(width) {
            this.width = width;
        }
    }
    exports.CharWidthRequest = CharWidthRequest;
    class DomCharWidthReader {
        constructor(bareFontInfo, requests) {
            this._bareFontInfo = bareFontInfo;
            this._requests = requests;
            this._container = null;
            this._testElements = null;
        }
        read(targetWindow) {
            // Create a test container with all these test elements
            this._createDomElements();
            // Add the container to the DOM
            targetWindow.document.body.appendChild(this._container);
            // Read character widths
            this._readFromDomElements();
            // Remove the container from the DOM
            targetWindow.document.body.removeChild(this._container);
            this._container = null;
            this._testElements = null;
        }
        _createDomElements() {
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.top = '-50000px';
            container.style.width = '50000px';
            const regularDomNode = document.createElement('div');
            (0, domFontInfo_1.applyFontInfo)(regularDomNode, this._bareFontInfo);
            container.appendChild(regularDomNode);
            const boldDomNode = document.createElement('div');
            (0, domFontInfo_1.applyFontInfo)(boldDomNode, this._bareFontInfo);
            boldDomNode.style.fontWeight = 'bold';
            container.appendChild(boldDomNode);
            const italicDomNode = document.createElement('div');
            (0, domFontInfo_1.applyFontInfo)(italicDomNode, this._bareFontInfo);
            italicDomNode.style.fontStyle = 'italic';
            container.appendChild(italicDomNode);
            const testElements = [];
            for (const request of this._requests) {
                let parent;
                if (request.type === 0 /* CharWidthRequestType.Regular */) {
                    parent = regularDomNode;
                }
                if (request.type === 2 /* CharWidthRequestType.Bold */) {
                    parent = boldDomNode;
                }
                if (request.type === 1 /* CharWidthRequestType.Italic */) {
                    parent = italicDomNode;
                }
                parent.appendChild(document.createElement('br'));
                const testElement = document.createElement('span');
                DomCharWidthReader._render(testElement, request);
                parent.appendChild(testElement);
                testElements.push(testElement);
            }
            this._container = container;
            this._testElements = testElements;
        }
        static _render(testElement, request) {
            if (request.chr === ' ') {
                let htmlString = '\u00a0';
                // Repeat character 256 (2^8) times
                for (let i = 0; i < 8; i++) {
                    htmlString += htmlString;
                }
                testElement.innerText = htmlString;
            }
            else {
                let testString = request.chr;
                // Repeat character 256 (2^8) times
                for (let i = 0; i < 8; i++) {
                    testString += testString;
                }
                testElement.textContent = testString;
            }
        }
        _readFromDomElements() {
            for (let i = 0, len = this._requests.length; i < len; i++) {
                const request = this._requests[i];
                const testElement = this._testElements[i];
                request.fulfill(testElement.offsetWidth / 256);
            }
        }
    }
    function readCharWidths(targetWindow, bareFontInfo, requests) {
        const reader = new DomCharWidthReader(bareFontInfo, requests);
        reader.read(targetWindow);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcldpZHRoUmVhZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9jb25maWcvY2hhcldpZHRoUmVhZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdJaEcsd0NBR0M7SUF0SUQsSUFBa0Isb0JBSWpCO0lBSkQsV0FBa0Isb0JBQW9CO1FBQ3JDLHFFQUFXLENBQUE7UUFDWCxtRUFBVSxDQUFBO1FBQ1YsK0RBQVEsQ0FBQTtJQUNULENBQUMsRUFKaUIsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFJckM7SUFFRCxNQUFhLGdCQUFnQjtRQU01QixZQUFZLEdBQVcsRUFBRSxJQUEwQjtZQUNsRCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNmLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLENBQUM7UUFFTSxPQUFPLENBQUMsS0FBYTtZQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNwQixDQUFDO0tBQ0Q7SUFmRCw0Q0FlQztJQUVELE1BQU0sa0JBQWtCO1FBUXZCLFlBQVksWUFBMEIsRUFBRSxRQUE0QjtZQUNuRSxJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztZQUNsQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUUxQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBRU0sSUFBSSxDQUFDLFlBQW9CO1lBQy9CLHVEQUF1RDtZQUN2RCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUUxQiwrQkFBK0I7WUFDL0IsWUFBWSxDQUFDLFFBQVEs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