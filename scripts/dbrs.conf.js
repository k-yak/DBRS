define({
    config: {
        mode: 'verbose'  
    },
    databases: {
        CRM: {
            version: 'v0.0.1',
            comment: 'no comment',
            minSize: 2000000, //bytes
            success: function(){},
            error: function(){},
            tables: {
                SellerTypes: {
                    id: 'INTEGER PRIMARY KEY',
                    code: 'TEXT',
                    name: 'TEXT',
                    isActive: 'INTEGER',
                    isCallCenter: 'INTEGER',
                },
                Ranges: {
                    id: 'INTEGER PRIMARY KEY',
                    name: 'TEXT',
                    productId: 'INTEGER'
                }
            }
        }
    },    
    requests: {
        CRM: {
            ping : 'REST/SellerTypes.json',
            SellerTypes: {
                getAll: {
                    url: 'REST/SellerTypes.json',
                    type: 'GET',
                    dataType: 'json',
                    async: true,
                    data: {},
                    contentType: 'application/json; charset=UTF-8',
                    subCollection: 'value',
                    success: function(){},
                    error: function(){}
                }
            },
            Ranges: {
                getAll: {
                    url: 'REST/Ranges.json',
                    type: 'GET',
                    dataType: 'json',
                    async: true,
                    data: {},
                    contentType: 'application/json; charset=UTF-8',
                    subCollection: 'value',
                    success: function(){},
                    error: function(){}
                }
            }
        }
    }
});