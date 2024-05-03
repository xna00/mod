/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.flakySuite = flakySuite;
    function flakySuite(title, fn) {
        return suite(title, function () {
            // Flaky suites need retries and timeout to complete
            // e.g. because they access browser features which can
            // be unreliable depending on the environment.
            this.retries(3);
            this.timeout(1000 * 20);
            // Invoke suite ensuring that `this` is
            // properly wired in.
            fn.call(this);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFV0aWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL3Rlc3RVdGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQUVoRyxnQ0FhQztJQWJELFNBQWdCLFVBQVUsQ0FBQyxLQUFhLEVBQUUsRUFBYztRQUN2RCxPQUFPLEtBQUssQ0FBQyxLQUFLLEVBQUU7WUFFbkIsb0RBQW9EO1lBQ3BELHNEQUFzRDtZQUN0RCw4Q0FBOEM7WUFDOUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztZQUV4Qix1Q0FBdUM7WUFDdkMscUJBQXFCO1lBQ3JCLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDZixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMifQ==