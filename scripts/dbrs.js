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
    
    /**** Utils Function ****/
    
    function prepareForSql(val) {
        var ret = '';
        if(typeof(val) === 'boolean') val = + val;
        if(typeof(val) === 'string') ret += '"';
        if(typeof(val) === 'undefined') ret += 'NULL';
        else ret += val;
        if(typeof(val) === 'string') ret += '"';
        return ret;
    }
    
    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
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
            db.DBRSDBName = curDB;

            for(i in databases[curDB].tables) {
                var tableFields = '(';
                k = 0;
                for(j in databases[curDB].tables[i]) {
                    if(k !== 0) tableFields += ',';
                    tableFields += j + ' ' + databases[curDB].tables[i][j];
                    k++;
                }
                tableFields += ', DBRS_guid TEXT';
                tableFields += ', DBRS_status TEXT default "UTD")';

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
            db.DBRSDBName = curDB;
            
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
        
        if(inDBConf.config.mode === 'verbose')
                console.log('DROP table ' + tableName);
        self.transaction(function(tx) {
            tx.executeSql('DROP table ' + tableName, [], onSuccessDrop, onErrorDrop);
        });
    }
    
    function dropTables(){
        var self = this;
        for(var tableName in databases[this.DBRSDBName].tables)
            dropTable(tableName, self);
    }
    
    function addDBRSAddon(db){
        db.updateAll = updateAll;
        db.clearAll = clearAll;
        db.dropTable = dropTable;
        db.dropTables = dropTables;
        db.ping = ping;
        db.createModel = createModel;
        db.sql = sql;
    }
    
    function createURL(url, args, obj) {
        var urlsParts = url.split('?');
        var ret = '';
        if(typeof(args) === 'undefined') return url;

        for(var i in urlsParts) {
            ret += urlsParts[i];
            if(typeof(args[i]) !== 'undefined')
                ret += obj[args[i]];
        }
        return ret;
    }
    
    function prepareData(data) {
        for(var i in data) {
            if(i.split('DBRS_').length > 1)
                delete data[i];
        }
        return JSON.stringify(data);
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
                        url: createURL(requests[curDBNameC][curTableNameC].getAll.url),
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
                                        
                                        insertFields += prepareForSql(line[j]);
                                        
                                        tableFields += j;
                                        k++;
                                    }
                                    tableFields += ',DBRS_guid)';
                                    insertFields += ',' + prepareForSql(guid()) + ')';

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
            url: createURL(requests[self.DBRSDBName].ping),
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
            console.log('accessibility of : ' + requests[self.DBRSDBName].ping + ' => ' + ret);
        
        return ret;
    }
    
    function createModel() {
        var self = this;
        var curDB = databases[self.DBRSDBName];
        for(var curTableName in curDB.tables) {
            var curTable = curDB.tables[curTableName];
            model[curTableName] = function() {
                this.DBRS_guid = guid();
                this.DBRS_status = 'NEW';
            };
            
            for(var curPropName in curTable)
            {
                model[curTableName].prototype[curPropName] = null;
            }
            model[curTableName].DBRSdb = self;
            model[curTableName].prototype.DBRSdb = self;
            model[curTableName].DBRSTableName = curTableName;
            model[curTableName].prototype.DBRSTableName = curTableName;
            model[curTableName].prototype.DBRS_guid = '';

            createClassMethods(model[curTableName]);
            createObjectMethods(model[curTableName]);
        }
        if(inDBConf.config.mode === 'verbose')
            console.log('Model created');
        return model;
    }
    
    function createClassMethods(metaClass) {
        //getAll
        metaClass.getAll = getAll;
        //getBy
        metaClass.getOneBy = getOneBy;
        metaClass.getManyBy = getManyBy;
        //update
        //create
    }
    
    function createObjectMethods(metaClass) {
        //save
        metaClass.prototype.save = save;
        //update
        metaClass.prototype.update = update;
        //remove
        metaClass.prototype.remove = remove;
        //clone
        metaClass.prototype.clone = clone;
    }
    
        
    function sql(command, callbackSuccess, callbackError) {
        var self = this;
        if(inDBConf.config.mode === 'verbose')
            console.log(command);
        
        self.transaction(function(tx) {
            tx.executeSql(command, [], callbackSuccess, callbackError);
        });
    }
    
    /**** CLASS SCOPE ****/
    
    function getOneBy(fieldName, value, callback) {
        var self = this;
        self.DBRSdb.transaction(function (tx) {
            if(inDBConf.config.mode === 'verbose')
                console.log('SELECT * FROM ' + self.DBRSTableName + ' WHERE ' + fieldName + ' LIKE ' + prepareForSql(value) + 'AND DBRS_status <> "RMV"');
            
            tx.executeSql('SELECT * FROM ' + self.DBRSTableName + ' WHERE ' + fieldName + ' LIKE ' + prepareForSql(value) + 'AND DBRS_status <> "RMV"', [], function (tx, results) {
                var ret = null;
                var len = results.rows.length, i;
                if(len !== 0 ) {
                    ret = new self();
                    for(var i in results.rows.item(0)) {
                        ret[i] = results.rows.item(0)[i];
                    }
                }
                callback(ret);
            }, null);
        });
    }
    
    function getManyBy(fieldName, value, callback) {
        var self = this;
        self.DBRSdb.transaction(function (tx) {
            if(inDBConf.config.mode === 'verbose')
                console.log('SELECT * FROM ' + self.DBRSTableName + ' WHERE ' + fieldName + ' LIKE ' + prepareForSql(value) + 'AND DBRS_status <> "RMV"');
            
            tx.executeSql('SELECT * FROM ' + self.DBRSTableName + ' WHERE ' + fieldName + ' LIKE ' + prepareForSql(value) + 'AND DBRS_status <> "RMV"', [], function (tx, results) {
                var ret = [];
                var len = results.rows.length, i;
                for(var i = 0 ; i < len; i++ ) {
                    ret.push(new self());
                    for(var j in results.rows.item(i)) {
                        ret[i][j] = results.rows.item(i)[j];
                    }
                }
                callback(ret);
            }, null);
        });
    }
    
    function getAll(callback) {
        var self = this;
        self.DBRSdb.transaction(function (tx) {
            if(inDBConf.config.mode === 'verbose')
                console.log('SELECT * FROM ' + self.DBRSTableName + 'WHERE DBRS_status <> "RMV"');
            
            tx.executeSql('SELECT * FROM ' + self.DBRSTableName + 'WHERE DBRS_status <> "RMV"', [], function (tx, results) {
                var ret = [];
                var len = results.rows.length, i;
                for(var i = 0 ; i < len; i++ ) {
                    ret.push(new self());
                    for(var j in results.rows.item(i)) {
                        ret[i][j] = results.rows.item(i)[j];
                    }
                }
                callback(ret);
            }, null);
        });
    }
    /**** OBJECT SCOPE ****/
    
    function save(){
        var self = this;
        var saveType = 'UPD';
        self.DBRSdb.transaction(function (tx) {
            if(inDBConf.config.mode === 'verbose')
                console.log('SELECT * FROM ' + self.DBRSTableName + ' WHERE DBRS_guid = ' + prepareForSql(self.DBRS_guid));
            
            tx.executeSql('SELECT * FROM ' + self.DBRSTableName + ' WHERE DBRS_guid = ' + prepareForSql(self.DBRS_guid), [], function (tx, results) {
                var ret = null;
                var len = results.rows.length;
                if(len === 0 ) {
                    createOne(self, tx);
                }
                else {
                    updateOne(self, tx);
                }
            }, null);
        });
    }
    
    function remove(){
        var self = this;
        self.DBRSdb.transaction(function (tx) {
            updateOne(self, tx, 'RMV')
        });
    }
    
    function clone(){
        var self = this;
        var copy = $.extend({}, self)
        copy.DBRS_guid = guid();
        copy.DBRS_status = 'NEW';
        return copy;
    }
    
    function updateOne(self, tx, saveType) {
        if(typeof(saveType) === 'undefined') saveType = 'UPD';
        var updateFields = '';                    

            var k = 0;
            for(j in databases[self.DBRSdb.DBRSDBName].tables[self.DBRSTableName]) {
                if(k !== 0) {
                    updateFields += ',';
                }

                updateFields += j + ' = ';
                updateFields += prepareForSql(self[j]);
                k++;
            }
            updateFields += ',DBRS_status = "' + saveType + '"';

            if(inDBConf.config.mode === 'verbose')
                console.log('UPDATE ' + self.DBRSTableName + ' SET ' + updateFields + ' WHERE DBRS_guid = ' + prepareForSql(self.DBRS_guid));
            tx.executeSql('UPDATE ' + self.DBRSTableName + ' SET ' + updateFields + ' WHERE DBRS_guid = ' + prepareForSql(self.DBRS_guid), [], function (tx, results) {});
    }
    
    function createOne(self, tx) {
        var saveType = 'NEW';
        var insertFields = '(';                    
        var tableFields = '(';

        var k = 0;
        for(j in databases[self.DBRSdb.DBRSDBName].tables[self.DBRSTableName]) {
            if(k !== 0) {
                insertFields += ',';
                tableFields += ',';
            }

            console.log(self);
            insertFields += prepareForSql(self[j]);

            tableFields += j;
            k++;
        }
        tableFields += ',DBRS_status)';
        insertFields += ',' + prepareForSql(saveType) + ')';

        if(inDBConf.config.mode === 'verbose')
            console.log('INSERT INTO ' + self.DBRSTableName  + ' ' + tableFields + ' values ' + insertFields);

        tx.executeSql('INSERT OR REPLACE INTO ' + self.DBRSTableName + ' ' + tableFields + ' values ' + insertFields,
                      []);
    }
    
    function update() {
        var self = this;
        if(self.DBRS_status === 'UPD') {
            $.ajax({
                url: createURL(
                    requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].patch.url,
                    requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].patch.args,
                    self
                ),
                type: requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].patch.type,
                dataType: requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].patch.dataType,
                async: requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].patch.async,
                data: prepareData(self),
                contentType: requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].patch.contentType,

                success: function (result) {
                    requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].patch.success();
                },
                error: function (e) {
                    if(inDBConf.config.mode === 'verbose')
                        console.log('error : ' + JSON.stringify(e))
                    requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].patch.error();
                }
            });
        }
        else if(self.DBRS_status === 'NEW') {
            $.ajax({
                url: createURL(
                    requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].post.url,
                    requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].post.args,
                    self
                ),
                type: requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].post.type,
                dataType: requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].post.dataType,
                async: requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].post.async,
                data: prepareData(self),
                contentType: requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].post.contentType,

                success: function (result) {
                    requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].post.success();
                },
                error: function (e) {
                    if(inDBConf.config.mode === 'verbose')
                        console.log('error : ' + JSON.stringify(e))
                    requests[self.DBRSdb.DBRSDBName][self.DBRSTableName].post.error();
                }
            });
        }else if(self.DBRS_status === 'UTD') {
            //TODO
        }
    }
    
    /**** return DBRS SCOPE ****/
    
    var public = {
        createDB: createDB,
        createDBs: createDBs,
        openDB: openDB,
        openDBs: openDBs
    };
    
    return public;
});
