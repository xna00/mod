/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractSignService = void 0;
    class AbstractSignService {
        constructor() {
            this.validators = new Map();
        }
        static { this._nextId = 1; }
        async createNewMessage(value) {
            try {
                const validator = await this.getValidator();
                if (validator) {
                    const id = String(AbstractSignService._nextId++);
                    this.validators.set(id, validator);
                    return {
                        id: id,
                        data: validator.createNewMessage(value)
                    };
                }
            }
            catch (e) {
                // ignore errors silently
            }
            return { id: '', data: value };
        }
        async validate(message, value) {
            if (!message.id) {
                return true;
            }
            const validator = this.validators.get(message.id);
            if (!validator) {
                return false;
            }
            this.validators.delete(message.id);
            try {
                return (validator.validate(value) === 'ok');
            }
            catch (e) {
                // ignore errors silently
                return false;
            }
            finally {
                validator.dispose?.();
            }
        }
        async sign(value) {
            try {
                return await this.signValue(value);
            }
            catch (e) {
                // ignore errors silently
            }
            return value;
        }
    }
    exports.AbstractSignService = AbstractSignService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RTaWduU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc2lnbi9jb21tb24vYWJzdHJhY3RTaWduU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBc0IsbUJBQW1CO1FBQXpDO1lBSWtCLGVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztRQWtEakUsQ0FBQztpQkFuRGUsWUFBTyxHQUFHLENBQUMsQUFBSixDQUFLO1FBTXBCLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFhO1lBQzFDLElBQUksQ0FBQztnQkFDSixNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDZixNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztvQkFDakQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUNuQyxPQUFPO3dCQUNOLEVBQUUsRUFBRSxFQUFFO3dCQUNOLElBQUksRUFBRSxTQUFTLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO3FCQUN2QyxDQUFDO2dCQUNILENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWix5QkFBeUI7WUFDMUIsQ0FBQztZQUNELE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFpQixFQUFFLEtBQWE7WUFDOUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQztnQkFDSixPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWix5QkFBeUI7Z0JBQ3pCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFhO1lBQ3ZCLElBQUksQ0FBQztnQkFDSixPQUFPLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQyxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWix5QkFBeUI7WUFDMUIsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQzs7SUFyREYsa0RBc0RDIn0=