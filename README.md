# DBRS

Database REST Synchronise

Javascript ORM and synchronisation tool with REST API

##TODO

###GLOBAL SCOPE
* var db = dbrs.openDB(name) ✔
* var dbs = dbrs.openDBs() ✔
* var db = dbrs.createDB(name) ✔
* var dbs = dbrs.createDBs() ✔

###DB SCOPE
* db.updateAll() ✔
* db.clearAll() ✔
* db.ping() ✔
* db.dropTable(tableName) ✔
* db.dropTables() ✔
* var model = db.createModel() ✔

###CLASS SCOPE
* var obj = model.MyClass.getOneBy(fieldName, value, callback) ✔
* var objs = model.MyClass.getManyBy(fieldName, value, callback) ✔
* var objs = model.MyClass.getAll(callback) ✔
* var obj = new model.MyClass() ✔
* model.MyClass.update() ...

###OBJECT SCOPE 
* obj.save() ✔/...
* obj.remove() ✔
* obj.update() ...
* var obj2 = obj.clone() ...

