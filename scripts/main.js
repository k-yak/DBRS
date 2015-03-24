require.config({
    baseUrl: 'scripts/',
    paths: {
        jquery: 'jquery-1.11.2.min'
    }
});

require(["jquery"], function($) {
    var i, j, k, db;
    
    var databases = {
        CRM_REST_IDUNE: {
            version: 'v0.0.1',
            comment: 'no comment',
            minSize: 2000000, //bytes
            tables: {
                SellerTypes: {
                    id: 'REAL UNIQUE',
                    code: 'TEXT',
                    name: 'TEXT',
                    isActive: 'REAL',
                    isCallCenter: 'REAL',
                }
            }
        }
    };
    
    var requests = {
        CRM_REST_IDUNE: {
            SellerTypes: {
                getAll: {
                    url: 'REST/SellerTypes.json',
                    type: 'GET',
                    dataType: 'json',
                    async: true,
                    data: {},
                    contentType: 'application/json; charset=UTF-8',
                    success: function(){},
                    error: function(){}
                }
            }
        }
    }
    
    function dbCreated(e) {
        console.log('db created : '+ JSON.stringify(e));
    }
    
    function onErrorCreate(e) {
        console.log('error creating table : ' + JSON.stringify(e));
    }
    
    function onSuccessCreate(e) {
        console.log('success creating table : ' + JSON.stringify(e));
    }
    
    function onErrorInsert(e) {
        console.log('error insert : ' + JSON.stringify(e));
    }
    
    function onSuccessInsert(e) {
        console.log('success  : ' + JSON.stringify(e));
    }
    
    for(var curDB in databases) {
        if(window.openDatabase){
            db = openDatabase(
                curDB,
                databases[curDB].version, 
                databases[curDB].comment, 
                databases[curDB].minSize,
                dbCreated
            );

            for(i in databases[curDB].tables) {
                var tableFields = '(';
                k = 0;
                for(j in databases[curDB].tables[i]) {
                    if(k !== 0) tableFields += ',';
                    tableFields += j + ' ' + databases[curDB].tables[i][j];
                    k++;
                }
                tableFields += ')';

                var tableName = databases[curDB].tables[i];
                db.transaction(function(tx) {
                    tx.executeSql('CREATE TABLE IF NOT EXISTS' + i + ' ' + tableFields, [], onSuccessCreate, onErrorCreate);
                });   
            }
        }
        else {
         console.log('webSql not allowed in your browser, please update it');   
        }
    }
        
    for(var curDBName in databases) {
        var curDB = databases[curDBName]
        for(var curTableName in curDB.tables) {
            var curTable = curDB.tables[curTableName];
            $.ajax({
                url: requests[curDBName][curTableName].getAll.url,
                type: requests[curDBName][curTableName].getAll.type,
                dataType: requests[curDBName][curTableName].getAll.dataType,
                async: requests[curDBName][curTableName].getAll.async,
                data: requests[curDBName][curTableName].getAll.data,
                contentType: requests[curDBName][curTableName].getAll.contentType,

                success: function (result) {
                    for(var i in result.value)
                    {
                        var line = result.value[i];
                        var insertFields = '(';                    
                        var tableFields = '(';

                        var k = 0;
                        for(j in curTable) {
                            if(k !== 0) {
                                insertFields += ',';
                                tableFields += ',';
                            }
                            if(typeof(line[j]) === 'boolean') line[j] = + line[j];
                            if(typeof(line[j]) === 'string') insertFields += '"';
                            insertFields += line[j];
                            if(typeof(line[j]) === 'string') insertFields += '"';
                            tableFields += j;
                            k++;
                        }
                        insertFields += ')';
                        tableFields += ')';
                        
                        console.log('INSERT INTO ' + curTableName  + ' ' + tableFields + ' values ' + insertFields);
                        db.transaction(function(tx) {
                            tx.executeSql('INSERT INTO ' + curTableName + ' ' + tableFields + ' values ' + insertFields, [], onSuccessInsert, onErrorInsert);
                        });
                    }
                    requests[curDBName][curTableName].getAll.success();
                },
                error: function (e) {
                    console.log('error : ' + JSON.stringify(e))
                    requests[curDBName][curTableName].getAll.error();
                }
            }); 
        }
    }
});
