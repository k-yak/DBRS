define(["jquery", "dbrs.conf"], function($, inDBConf) {
    var i, j, k;
    var databases = inDBConf.databases;
    var requests = inDBConf.requests;
    var model = {};
    
    /**** CALLBACK FUNCTIONS ****/
    
    function onErrorCreate(transaction, error) {
        if(inDBConf.config.mode === 'verbose')
            console.log("database error CREATE " + JSON.stringify(transaction) + ' ' + JSON.stringify(error));
    }
    
    function onSuccessCreate(e) {
        if(inDBConf.config.mode === 'verbose')
            console.log('success creating table : ' + JSON.stringify(e));
    }
    
    function onErrorDrop(transaction, error) {
        if(inDBConf.config.mode === 'verbose')
            console.log("database error DROP TABLE " + JSON.stringify(transaction) + ' ' + JSON.stringify(error));
    }
    
    function onSuccessDrop(e) {
        if(inDBConf.config.mode === 'verbose')
            console.log('success DROP TABLE : ' + JSON.stringify(e));
    }
    
    function onErrorInsertGetAll(transaction, error) {
        if(inDBConf.config.mode === 'verbose')
            console.log("database error INSERT " + JSON.stringify(transaction) + ' ' + JSON.stringify(error));
    }
    
    function onSuccessInsertGetAll(e) {
        if(inDBConf.config.mode === 'verbose')
            console.log('success insert get all : ' + JSON.stringify(e));
    }
    
    function onErrorClear(transaction, error) {
        if(inDBConf.config.mode === 'verbose')
            console.log("database error CLEAR " + JSON.stringify(transaction) + ' ' + JSON.stringify(error));
    }
    
    function onSuccessClear(e) {
        if(inDBConf.config.mode === 'verbose')
            console.log('success clearing table : ' + JSON.stringify(e));
    }
    
    /**** DBRS SCOPE ****/
    
    function createDB(curDB) {
        var db;
        
        if(window.openDatabase){
            db = openDatabase(
                curDB,
                databases[curDB].version, 
                databases[curDB].comment, 
                databases[curDB].minSize
            );
            db.name = curDB;

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
                if(inDBConf.config.mode === 'verbose')
                    console.log('CREATE TABLE IF NOT EXISTS ' + i + ' ' + tableFields);

                (function(nameC, tableFieldsC){
                    db.transaction(function(tx) {
                        tx.executeSql('CREATE TABLE IF NOT EXISTS ' + nameC + ' ' + tableFieldsC, [], onSuccessCreate, onErrorCreate);
                    });
                }(i, tableFields));
            }
        }
        else {
            databases[curDBName].error();
            alert('webSql not allowed in your browser, please update it');   
        }
        
        addDBRSAddon(db);
        return db;
    }
    
    function createDBs(){
        var dbs = [];
        for(var curDB in databases) {
            dbs.push(createDB(curDB));   
        }
        return dbs;
    }
    
    function openDB(curDB){
        var db;
        if(window.openDatabase){
            db = openDatabase(
                curDB,
                databases[curDB].version, 
                databases[curDB].comment, 
                databases[curDB].minSize
            );
            db.name = curDB;
            
            if(inDBConf.config.mode === 'verbose')
                console.log('OPEN DATABASE ' + curDB);
        }
        else {
            databases[curDBName].error();
            alert('webSql not allowed in your browser, please update it');  
        }
        addDBRSAddon(db);
        return db;
    }
    
    function openDBs(){
        var dbs = [];
        for(var curDB in databases) {
            dbs.push(openDB(curDB));   
        }
        return dbs;
    }
    
    function dropTable(tableName, self){
        if(typeof(self) === 'undefined')
            var self = this;
        
        self.transaction(function(tx) {
            tx.executeSql('DROP table ' + tableName, [], onSuccessDrop, onErrorDrop);
        });
    }
    
    function dropTables(){
        var self = this;
        for(var tableName in databases[this.name].tables)
            dropTable(tableName, self);
    }
    
    function addDBRSAddon(db){
        db.updateAll = updateAll;
        db.clearAll = clearAll;
        db.dropTable = dropTable;
        db.dropTables = dropTables;
        db.ping = ping;
        db.createModel = createModel
    }
    
    /**** DB SCOPE ****/
    
    function updateAll() {
        var self = this;
        for(var curDBName in databases) {
            var curDB = databases[curDBName]
            for(var curTableName in curDB.tables) {
                var curTable = curDB.tables[curTableName];
                
                (function(curDBNameC, curDBC, curTableNameC, curTableC){
                    $.ajax({
                        url: requests[curDBNameC][curTableNameC].getAll.url,
                        type: requests[curDBNameC][curTableNameC].getAll.type,
                        dataType: requests[curDBNameC][curTableNameC].getAll.dataType,
                        async: requests[curDBNameC][curTableNameC].getAll.async,
                        data: requests[curDBNameC][curTableNameC].getAll.data,
                        contentType: requests[curDBNameC][curTableNameC].getAll.contentType,

                        success: function (result) {
                            self.transaction(function(tx) {
                                if(typeof(requests[curDBNameC][curTableNameC].getAll.subCollection) !== 'undefined')
                                    result = result[requests[curDBNameC][curTableNameC].getAll.subCollection];
                                tx.executeSql('DELETE from ' + curTableNameC,
                                                  [], onSuccessInsertGetAll, onErrorInsertGetAll);
                                for(var i in result)
                                {
                                    var line = result[i];
                                    var insertFields = '(';                    
                                    var tableFields = '(';

                                    var k = 0;
                                    for(j in curTableC) {
                                        if(k !== 0) {
                                            insertFields += ',';
                                            tableFields += ',';
                                        }

                                        if(typeof(line[j]) === 'boolean') line[j] = + line[j];
                                        if(typeof(line[j]) === 'string') insertFields += '"';
                                        if(typeof(line[j]) === 'undefined') insertFields += 'NULL';
                                        else insertFields += line[j];
                                        if(typeof(line[j]) === 'string') insertFields += '"';

                                        tableFields += j;
                                        k++;
                                    }
                                    insertFields += ')';
                                    tableFields += ')';

                                    if(inDBConf.config.mode === 'verbose')
                                        console.log('INSERT INTO ' + curTableNameC  + ' ' + tableFields + ' values ' + insertFields);

                                    tx.executeSql('INSERT OR REPLACE INTO ' + curTableNameC + ' ' + tableFields + ' values ' + insertFields,
                                                  [], onSuccessInsertGetAll, onErrorInsertGetAll);
                                }


                            });
                            requests[curDBNameC][curTableNameC].getAll.success();
                        },
                        error: function (e) {
                            if(inDBConf.config.mode === 'verbose')
                                console.log('error : ' + JSON.stringify(e))
                            requests[curDBNameC][curTableNameC].getAll.error();
                        }
                    });
                }(curDBName, curDB, curTableName, curTable))
            }
        }
    }
    
    function clearAll() {
        var self = this;
        for(var curDBName in databases) {
            var curDB = databases[curDBName]
            for(var curTableName in curDB.tables) {
                var curTable = curDB.tables[curTableName];
                
                (function(curTableNameC){
                    self.transaction(function(tx) {
                        tx.executeSql('DELETE from ' + curTableNameC, [], onSuccessClear, onErrorClear);
                    });
                }(curTableName));
            }
        }
    }
    
    function ping() {
        var self = this;
        var ret = false;
        var first;
                    
        $.ajax({
            url: requests[self.name].ping,
            type: 'HEAD',
            async: false,
            data: {},

            success: function (result) {
                ret = true;
            },
            error: function (e) {
                ret = false;
            }
        });
        
        if(inDBConf.config.mode === 'verbose')
            console.log('accessibility of : ' + requests[self.name].ping + ' => ' + ret);
        
        return ret;
    }
    
    function createModel() {
        var self = this;
        var curDB = databases[self.name];
        for(var curTableName in curDB.tables) {
            var curTable = curDB.tables[curTableName];
            model[curTableName] = function() {};
            for(var curPropName in curTable)
            {
                model[curTableName].prototype[curPropName] = null;
            }
            model[curTableName].DBRSdb = self;
            model[curTableName].DBRSname = curTableName;
            createClassMethods(model[curTableName]);
            createObjectMethods(model[curTableName]);
        }
        
        return model;
    }
    
    function createClassMethods(metaClass) {
        //getAll
        //getBy
        metaClass.getBy = getBy;
        //update
        //create
    }
    
    function createObjectMethods(metaClass) {
        //save
        //update
    }
    
    /**** CLASS SCOPE ****/
    
    function getBy(fieldName, value, callback) {
        var self = this;
        self.DBRSdb.transaction(function (tx) {
            console.log('SELECT * FROM ' + self.DBRSname + ' WHERE ' + fieldName + ' = ' + value);
            tx.executeSql('SELECT * FROM ' + self.DBRSname + ' WHERE ' + fieldName + ' = ' + value, [], function (tx, results) {
                //alert(JSON.stringify(results));
            }, null);
        });
    }
    /**** OBJECT SCOPE ****/
    
    /**** return DBRS SCOPE ****/
    
    var public = {
        createDB: createDB,
        createDBs: createDBs,
        openDB: openDB,
        openDBs: openDBs
    };
    
    return public;
});
