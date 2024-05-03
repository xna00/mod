/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestClipboardService = void 0;
    class TestClipboardService {
        constructor() {
            this.text = undefined;
            this.findText = undefined;
            this.resources = undefined;
        }
        async writeText(text, type) {
            this.text = text;
        }
        async readText(type) {
            return this.text ?? '';
        }
        async readFindText() {
            return this.findText ?? '';
        }
        async writeFindText(text) {
            this.findText = text;
        }
        async writeResources(resources) {
            this.resources = resources;
        }
        async readResources() {
            return this.resources ?? [];
        }
        async hasResources() {
            return Array.isArray(this.resources) && this.resources.length > 0;
        }
    }
    exports.TestClipboardService = TestClipboardService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENsaXBib2FyZFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2NsaXBib2FyZC90ZXN0L2NvbW1vbi90ZXN0Q2xpcGJvYXJkU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsTUFBYSxvQkFBb0I7UUFBakM7WUFJUyxTQUFJLEdBQXVCLFNBQVMsQ0FBQztZQVVyQyxhQUFRLEdBQXVCLFNBQVMsQ0FBQztZQVV6QyxjQUFTLEdBQXNCLFNBQVMsQ0FBQztRQWFsRCxDQUFDO1FBL0JBLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBWSxFQUFFLElBQWE7WUFDMUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsQ0FBQztRQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBYTtZQUMzQixPQUFPLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFJRCxLQUFLLENBQUMsWUFBWTtZQUNqQixPQUFPLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO1FBQzVCLENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLElBQVk7WUFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDdEIsQ0FBQztRQUlELEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBZ0I7WUFDcEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDNUIsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUM7UUFDN0IsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZO1lBQ2pCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ25FLENBQUM7S0FDRDtJQXJDRCxvREFxQ0MifQ==