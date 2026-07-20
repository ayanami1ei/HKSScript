export interface ApiTypes {
    version: string;
    description: string;
    types: Record<string, ApiTypeDef>;
    builtins: Record<string, { description: string }>;
}

export interface ApiTypeDef {
    description?: string;
    methods?: Record<string, ApiMethodDef>;
    fields?: Record<string, string>;
}

export interface ApiMethodDef {
    returnType: string;
    args: { name: string; type: string }[];
    static?: boolean;
}

const apiDef: ApiTypes = {
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

export function getApiTypes(): ApiTypes {
    return apiDef;
}

export function getApiTypeSet(): Set<string> {
    const s = new Set(Object.keys(apiDef.types));
    for (const bt of Object.keys(apiDef.builtins))
        s.add(bt);
    return s;
}

export function getApiReturnTypes(): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {};
    for (const [typeName, typeDef] of Object.entries(apiDef.types)) {
        if (typeDef.methods) {
            const methods: Record<string, string> = {};
            for (const [methodName, methodDef] of Object.entries(typeDef.methods)) {
                methods[methodName] = methodDef.returnType;
            }
            result[typeName] = methods;
        }
    }
    return result;
}
