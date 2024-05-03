/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/color", "vs/base/common/types"], function (require, exports, nls, color_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createValidator = createValidator;
    exports.getInvalidTypeError = getInvalidTypeError;
    function canBeType(propTypes, ...types) {
        return types.some(t => propTypes.includes(t));
    }
    function isNullOrEmpty(value) {
        return value === '' || (0, types_1.isUndefinedOrNull)(value);
    }
    function createValidator(prop) {
        const type = Array.isArray(prop.type) ? prop.type : [prop.type];
        const isNullable = canBeType(type, 'null');
        const isNumeric = (canBeType(type, 'number') || canBeType(type, 'integer')) && (type.length === 1 || type.length === 2 && isNullable);
        const numericValidations = getNumericValidators(prop);
        const stringValidations = getStringValidators(prop);
        const arrayValidator = getArrayValidator(prop);
        const objectValidator = getObjectValidator(prop);
        return value => {
            if (isNullable && isNullOrEmpty(value)) {
                return '';
            }
            const errors = [];
            if (arrayValidator) {
                const err = arrayValidator(value);
                if (err) {
                    errors.push(err);
                }
            }
            if (objectValidator) {
                const err = objectValidator(value);
                if (err) {
                    errors.push(err);
                }
            }
            if (prop.type === 'boolean' && value !== true && value !== false) {
                errors.push(nls.localize('validations.booleanIncorrectType', 'Incorrect type. Expected "boolean".'));
            }
            if (isNumeric) {
                if (isNullOrEmpty(value) || typeof value === 'boolean' || Array.isArray(value) || isNaN(+value)) {
                    errors.push(nls.localize('validations.expectedNumeric', "Value must be a number."));
                }
                else {
                    errors.push(...numericValidations.filter(validator => !validator.isValid(+value)).map(validator => validator.message));
                }
            }
            if (prop.type === 'string') {
                if (prop.enum && !(0, types_1.isStringArray)(prop.enum)) {
                    errors.push(nls.localize('validations.stringIncorrectEnumOptions', 'The enum options should be strings, but there is a non-string option. Please file an issue with the extension author.'));
                }
                else if (!(0, types_1.isString)(value)) {
                    errors.push(nls.localize('validations.stringIncorrectType', 'Incorrect type. Expected "string".'));
                }
                else {
                    errors.push(...stringValidations.filter(validator => !validator.isValid(value)).map(validator => validator.message));
                }
            }
            if (errors.length) {
                return prop.errorMessage ? [prop.errorMessage, ...errors].join(' ') : errors.join(' ');
            }
            return '';
        };
    }
    /**
     * Returns an error string if the value is invalid and can't be displayed in the settings UI for the given type.
     */
    function getInvalidTypeError(value, type) {
        if (typeof type === 'undefined') {
            return;
        }
        const typeArr = Array.isArray(type) ? type : [type];
        if (!typeArr.some(_type => valueValidatesAsType(value, _type))) {
            return nls.localize('invalidTypeError', "Setting has an invalid type, expected {0}. Fix in JSON.", JSON.stringify(type));
        }
        return;
    }
    function valueValidatesAsType(value, type) {
        const valueType = typeof value;
        if (type === 'boolean') {
            return valueType === 'boolean';
        }
        else if (type === 'object') {
            return value && !Array.isArray(value) && valueType === 'object';
        }
        else if (type === 'null') {
            return value === null;
        }
        else if (type === 'array') {
            return Array.isArray(value);
        }
        else if (type === 'string') {
            return valueType === 'string';
        }
        else if (type === 'number' || type === 'integer') {
            return valueType === 'number';
        }
        return true;
    }
    function toRegExp(pattern) {
        try {
            // The u flag allows support for better Unicode matching,
            // but deprecates some patterns such as [\s-9]
            // Ref https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class#description
            return new RegExp(pattern, 'u');
        }
        catch (e) {
            try {
                return new RegExp(pattern);
            }
            catch (e) {
                // If the pattern can't be parsed even without the 'u' flag,
                // just log the error to avoid rendering the entire Settings editor blank.
                // Ref https://github.com/microsoft/vscode/issues/195054
                console.error(nls.localize('regexParsingError', "Error parsing the following regex both with and without the u flag:"), pattern);
                return /.*/;
            }
        }
    }
    function getStringValidators(prop) {
        const uriRegex = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
        let patternRegex;
        if (typeof prop.pattern === 'string') {
            patternRegex = toRegExp(prop.pattern);
        }
        return [
            {
                enabled: prop.maxLength !== undefined,
                isValid: ((value) => value.length <= prop.maxLength),
                message: nls.localize('validations.maxLength', "Value must be {0} or fewer characters long.", prop.maxLength)
            },
            {
                enabled: prop.minLength !== undefined,
                isValid: ((value) => value.length >= prop.minLength),
                message: nls.localize('validations.minLength', "Value must be {0} or more characters long.", prop.minLength)
            },
            {
                enabled: patternRegex !== undefined,
                isValid: ((value) => patternRegex.test(value)),
                message: prop.patternErrorMessage || nls.localize('validations.regex', "Value must match regex `{0}`.", prop.pattern)
            },
            {
                enabled: prop.format === 'color-hex',
                isValid: ((value) => color_1.Color.Format.CSS.parseHex(value)),
                message: nls.localize('validations.colorFormat', "Invalid color format. Use #RGB, #RGBA, #RRGGBB or #RRGGBBAA.")
            },
            {
                enabled: prop.format === 'uri' || prop.format === 'uri-reference',
                isValid: ((value) => !!value.length),
                message: nls.localize('validations.uriEmpty', "URI expected.")
            },
            {
                enabled: prop.format === 'uri' || prop.format === 'uri-reference',
                isValid: ((value) => uriRegex.test(value)),
                message: nls.localize('validations.uriMissing', "URI is expected.")
            },
            {
                enabled: prop.format === 'uri',
                isValid: ((value) => {
                    const matches = value.match(uriRegex);
                    return !!(matches && matches[2]);
                }),
                message: nls.localize('validations.uriSchemeMissing', "URI with a scheme is expected.")
            },
            {
                enabled: prop.enum !== undefined,
                isValid: ((value) => {
                    return prop.enum.includes(value);
                }),
                message: nls.localize('validations.invalidStringEnumValue', "Value is not accepted. Valid values: {0}.", prop.enum ? prop.enum.map(key => `"${key}"`).join(', ') : '[]')
            }
        ].filter(validation => validation.enabled);
    }
    function getNumericValidators(prop) {
        const type = Array.isArray(prop.type) ? prop.type : [prop.type];
        const isNullable = canBeType(type, 'null');
        const isIntegral = (canBeType(type, 'integer')) && (type.length === 1 || type.length === 2 && isNullable);
        const isNumeric = canBeType(type, 'number', 'integer') && (type.length === 1 || type.length === 2 && isNullable);
        if (!isNumeric) {
            return [];
        }
        let exclusiveMax;
        let exclusiveMin;
        if (typeof prop.exclusiveMaximum === 'boolean') {
            exclusiveMax = prop.exclusiveMaximum ? prop.maximum : undefined;
        }
        else {
            exclusiveMax = prop.exclusiveMaximum;
        }
        if (typeof prop.exclusiveMinimum === 'boolean') {
            exclusiveMin = prop.exclusiveMinimum ? prop.minimum : undefined;
        }
        else {
            exclusiveMin = prop.exclusiveMinimum;
        }
        return [
            {
                enabled: exclusiveMax !== undefined && (prop.maximum === undefined || exclusiveMax <= prop.maximum),
                isValid: ((value) => value < exclusiveMax),
                message: nls.localize('validations.exclusiveMax', "Value must be strictly less than {0}.", exclusiveMax)
            },
            {
                enabled: exclusiveMin !== undefined && (prop.minimum === undefined || exclusiveMin >= prop.minimum),
                isValid: ((value) => value > exclusiveMin),
                message: nls.localize('validations.exclusiveMin', "Value must be strictly greater than {0}.", exclusiveMin)
            },
            {
                enabled: prop.maximum !== undefined && (exclusiveMax === undefined || exclusiveMax > prop.maximum),
                isValid: ((value) => value <= prop.maximum),
                message: nls.localize('validations.max', "Value must be less than or equal to {0}.", prop.maximum)
            },
            {
                enabled: prop.minimum !== undefined && (exclusiveMin === undefined || exclusiveMin < prop.minimum),
                isValid: ((value) => value >= prop.minimum),
                message: nls.localize('validations.min', "Value must be greater than or equal to {0}.", prop.minimum)
            },
            {
                enabled: prop.multipleOf !== undefined,
                isValid: ((value) => value % prop.multipleOf === 0),
                message: nls.localize('validations.multipleOf', "Value must be a multiple of {0}.", prop.multipleOf)
            },
            {
                enabled: isIntegral,
                isValid: ((value) => value % 1 === 0),
                message: nls.localize('validations.expectedInteger', "Value must be an integer.")
            },
        ].filter(validation => validation.enabled);
    }
    function getArrayValidator(prop) {
        if (prop.type === 'array' && prop.items && !Array.isArray(prop.items)) {
            const propItems = prop.items;
            if (propItems && !Array.isArray(propItems.type)) {
                const withQuotes = (s) => `'` + s + `'`;
                return value => {
                    if (!value) {
                        return null;
                    }
                    let message = '';
                    if (!Array.isArray(value)) {
                        message += nls.localize('validations.arrayIncorrectType', 'Incorrect type. Expected an array.');
                        message += '\n';
                        return message;
                    }
                    const arrayValue = value;
                    if (prop.uniqueItems) {
                        if (new Set(arrayValue).size < arrayValue.length) {
                            message += nls.localize('validations.stringArrayUniqueItems', 'Array has duplicate items');
                            message += '\n';
                        }
                    }
                    if (prop.minItems && arrayValue.length < prop.minItems) {
                        message += nls.localize('validations.stringArrayMinItem', 'Array must have at least {0} items', prop.minItems);
                        message += '\n';
                    }
                    if (prop.maxItems && arrayValue.length > prop.maxItems) {
                        message += nls.localize('validations.stringArrayMaxItem', 'Array must have at most {0} items', prop.maxItems);
                        message += '\n';
                    }
                    if (propItems.type === 'string') {
                        if (!(0, types_1.isStringArray)(arrayValue)) {
                            message += nls.localize('validations.stringArrayIncorrectType', 'Incorrect type. Expected a string array.');
                            message += '\n';
                            return message;
                        }
                        if (typeof propItems.pattern === 'string') {
                            const patternRegex = toRegExp(propItems.pattern);
                            arrayValue.forEach(v => {
                                if (!patternRegex.test(v)) {
                                    message +=
                                        propItems.patternErrorMessage ||
                                            nls.localize('validations.stringArrayItemPattern', 'Value {0} must match regex {1}.', withQuotes(v), withQuotes(propItems.pattern));
                                }
                            });
                        }
                        const propItemsEnum = propItems.enum;
                        if (propItemsEnum) {
                            arrayValue.forEach(v => {
                                if (propItemsEnum.indexOf(v) === -1) {
                                    message += nls.localize('validations.stringArrayItemEnum', 'Value {0} is not one of {1}', withQuotes(v), '[' + propItemsEnum.map(withQuotes).join(', ') + ']');
                                    message += '\n';
                                }
                            });
                        }
                    }
                    else if (propItems.type === 'integer' || propItems.type === 'number') {
                        arrayValue.forEach(v => {
                            const errorMessage = getErrorsForSchema(propItems, v);
                            if (errorMessage) {
                                message += `${v}: ${errorMessage}\n`;
                            }
                        });
                    }
                    return message;
                };
            }
        }
        return null;
    }
    function getObjectValidator(prop) {
        if (prop.type === 'object') {
            const { properties, patternProperties, additionalProperties } = prop;
            return value => {
                if (!value) {
                    return null;
                }
                const errors = [];
                if (!(0, types_1.isObject)(value)) {
                    errors.push(nls.localize('validations.objectIncorrectType', 'Incorrect type. Expected an object.'));
                }
                else {
                    Object.keys(value).forEach((key) => {
                        const data = value[key];
                        if (properties && key in properties) {
                            const errorMessage = getErrorsForSchema(properties[key], data);
                            if (errorMessage) {
                                errors.push(`${key}: ${errorMessage}\n`);
                            }
                            return;
                        }
                        if (patternProperties) {
                            for (const pattern in patternProperties) {
                                if (RegExp(pattern).test(key)) {
                                    const errorMessage = getErrorsForSchema(patternProperties[pattern], data);
                                    if (errorMessage) {
                                        errors.push(`${key}: ${errorMessage}\n`);
                                    }
                                    return;
                                }
                            }
                        }
                        if (additionalProperties === false) {
                            errors.push(nls.localize('validations.objectPattern', 'Property {0} is not allowed.\n', key));
                        }
                        else if (typeof additionalProperties === 'object') {
                            const errorMessage = getErrorsForSchema(additionalProperties, data);
                            if (errorMessage) {
                                errors.push(`${key}: ${errorMessage}\n`);
                            }
                        }
                    });
                }
                if (errors.length) {
                    return prop.errorMessage ? [prop.errorMessage, ...errors].join(' ') : errors.join(' ');
                }
                return '';
            };
        }
        return null;
    }
    function getErrorsForSchema(propertySchema, data) {
        const validator = createValidator(propertySchema);
        const errorMessage = validator(data);
        return errorMessage;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNWYWxpZGF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcHJlZmVyZW5jZXMvY29tbW9uL3ByZWZlcmVuY2VzVmFsaWRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsMENBd0RDO0lBS0Qsa0RBV0M7SUFoRkQsU0FBUyxTQUFTLENBQUMsU0FBaUMsRUFBRSxHQUFHLEtBQXVCO1FBQy9FLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsU0FBUyxhQUFhLENBQUMsS0FBYztRQUNwQyxPQUFPLEtBQUssS0FBSyxFQUFFLElBQUksSUFBQSx5QkFBaUIsRUFBQyxLQUFLLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsU0FBZ0IsZUFBZSxDQUFDLElBQWtDO1FBQ2pFLE1BQU0sSUFBSSxHQUEyQixLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEYsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMzQyxNQUFNLFNBQVMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksVUFBVSxD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