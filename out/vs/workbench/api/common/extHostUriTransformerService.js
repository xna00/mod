/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.URITransformerService = exports.IURITransformerService = void 0;
    exports.IURITransformerService = (0, instantiation_1.createDecorator)('IURITransformerService');
    class URITransformerService {
        constructor(delegate) {
            if (!delegate) {
                this.transformIncoming = arg => arg;
                this.transformOutgoing = arg => arg;
                this.transformOutgoingURI = arg => arg;
                this.transformOutgoingScheme = arg => arg;
            }
            else {
                this.transformIncoming = delegate.transformIncoming.bind(delegate);
                this.transformOutgoing = delegate.transformOutgoing.bind(delegate);
                this.transformOutgoingURI = delegate.transformOutgoingURI.bind(delegate);
                this.transformOutgoingScheme = delegate.transformOutgoingScheme.bind(delegate);
            }
        }
    }
    exports.URITransformerService = URITransformerService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFVyaVRyYW5zZm9ybWVyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFVyaVRyYW5zZm9ybWVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVbkYsUUFBQSxzQkFBc0IsR0FBRyxJQUFBLCtCQUFlLEVBQXlCLHdCQUF3QixDQUFDLENBQUM7SUFFeEcsTUFBYSxxQkFBcUI7UUFRakMsWUFBWSxRQUFnQztZQUMzQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO2dCQUNwQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQzNDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ25FLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxRQUFRLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN6RSxJQUFJLENBQUMsdUJBQXVCLEdBQUcsUUFBUSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoRixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBckJELHNEQXFCQyJ9