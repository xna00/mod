/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/cancellation"], function (require, exports, buffer_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestChannelClient = exports.RequestChannel = void 0;
    class RequestChannel {
        constructor(service) {
            this.service = service;
        }
        listen(context, event) {
            throw new Error('Invalid listen');
        }
        call(context, command, args, token = cancellation_1.CancellationToken.None) {
            switch (command) {
                case 'request': return this.service.request(args[0], token)
                    .then(async ({ res, stream }) => {
                    const buffer = await (0, buffer_1.streamToBuffer)(stream);
                    return [{ statusCode: res.statusCode, headers: res.headers }, buffer];
                });
                case 'resolveProxy': return this.service.resolveProxy(args[0]);
                case 'loadCertificates': return this.service.loadCertificates();
            }
            throw new Error('Invalid call');
        }
    }
    exports.RequestChannel = RequestChannel;
    class RequestChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        async request(options, token) {
            const [res, buffer] = await this.channel.call('request', [options], token);
            return { res, stream: (0, buffer_1.bufferToStream)(buffer) };
        }
        async resolveProxy(url) {
            return this.channel.call('resolveProxy', [url]);
        }
        async loadCertificates() {
            return this.channel.call('loadCertificates');
        }
    }
    exports.RequestChannelClient = RequestChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdElwYy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcmVxdWVzdC9jb21tb24vcmVxdWVzdElwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLE1BQWEsY0FBYztRQUUxQixZQUE2QixPQUF3QjtZQUF4QixZQUFPLEdBQVAsT0FBTyxDQUFpQjtRQUFJLENBQUM7UUFFMUQsTUFBTSxDQUFDLE9BQVksRUFBRSxLQUFhO1lBQ2pDLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQVksRUFBRSxPQUFlLEVBQUUsSUFBVSxFQUFFLFFBQTJCLGdDQUFpQixDQUFDLElBQUk7WUFDaEcsUUFBUSxPQUFPLEVBQUUsQ0FBQztnQkFDakIsS0FBSyxTQUFTLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7cUJBQ3pELElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtvQkFDL0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHVCQUFjLEVBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzVDLE9BQXdCLENBQUMsRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN4RixDQUFDLENBQUMsQ0FBQztnQkFDSixLQUFLLGNBQWMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9ELEtBQUssa0JBQWtCLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUNqRSxDQUFDO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNqQyxDQUFDO0tBQ0Q7SUFwQkQsd0NBb0JDO0lBRUQsTUFBYSxvQkFBb0I7UUFJaEMsWUFBNkIsT0FBaUI7WUFBakIsWUFBTyxHQUFQLE9BQU8sQ0FBVTtRQUFJLENBQUM7UUFFbkQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUF3QixFQUFFLEtBQXdCO1lBQy9ELE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBa0IsU0FBUyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUYsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBQSx1QkFBYyxFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDaEQsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBVztZQUM3QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFxQixjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFFRCxLQUFLLENBQUMsZ0JBQWdCO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQVcsa0JBQWtCLENBQUMsQ0FBQztRQUN4RCxDQUFDO0tBQ0Q7SUFsQkQsb0RBa0JDIn0=