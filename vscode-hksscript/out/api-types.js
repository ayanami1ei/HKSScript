"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiTypes = getApiTypes;
exports.getApiTypeSet = getApiTypeSet;
exports.getApiReturnTypes = getApiReturnTypes;
const apiDef = {
    "version": "1.0",
    "description": "Shared HksScript API type definitions.",
    "types": {
        "Mat": {
            "description": "Image matrix",
            "methods": {
                "FromFile": { "returnType": "Mat", "args": [{ "name": "path", "type": "string" }], "static": true },
                "fromFile": { "returnType": "Mat", "args": [{ "name": "path", "type": "string" }], "static": true }
            }
        },
        "Find": {
            "description": "Circle detection operations",
            "methods": {
                "findCircle": { "returnType": "List<Circle>", "args": [{ "name": "image", "type": "Mat" }], "static": true },
                "FindCircle": { "returnType": "List<Circle>", "args": [{ "name": "image", "type": "Mat" }], "static": true }
            }
        },
        "Area": {
            "description": "Area feature",
            "methods": {
                "new": { "returnType": "Area", "args": [], "static": true }
            }
        },
        "Circle": {
            "description": "Detected circle result",
            "fields": {
                "x": "int",
                "y": "int",
                "r": "int"
            }
        },
        "Feature": {
            "description": "Feature interface",
            "methods": {
                "Execute": { "returnType": "FeatureValue", "args": [{ "name": "input", "type": "Circle" }] },
                "GetName": { "returnType": "string", "args": [] }
            }
        },
        "FeatureValue": {
            "description": "Typed value wrapper"
        },
        "FeatureRegistry": {
            "description": "Feature registry",
            "methods": {
                "register": { "returnType": "void", "args": [{ "name": "feature", "type": "Feature" }], "static": true }
            }
        }
    },
    "builtins": {
        "int": { "description": "32-bit integer" },
        "float": { "description": "64-bit float" },
        "string": { "description": "String" },
        "bool": { "description": "Boolean" }
    }
};
function getApiTypes() {
    return apiDef;
}
function getApiTypeSet() {
    const s = new Set(Object.keys(apiDef.types));
    for (const bt of Object.keys(apiDef.builtins))
        s.add(bt);
    return s;
}
function getApiReturnTypes() {
    const result = {};
    for (const [typeName, typeDef] of Object.entries(apiDef.types)) {
        if (typeDef.methods) {
            const methods = {};
            for (const [methodName, methodDef] of Object.entries(typeDef.methods)) {
                methods[methodName] = methodDef.returnType;
            }
            result[typeName] = methods;
        }
    }
    return result;
}
//# sourceMappingURL=api-types.js.map