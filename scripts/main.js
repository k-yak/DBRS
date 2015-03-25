require.config({
    baseUrl: 'scripts/',
    paths: {
        jquery: 'libs/jquery-1.11.2.min'
    }
});

require(["jquery", "dbrs"], function($, dbrs) {
    var db;
    $('#createDB').click(function(){
        db = dbrs.createDB('CRM');
    });
    
    $('#updateAll').click(function(){
        db.updateAll();
    });
    
    $('#openDB').click(function(){
        db = dbrs.openDB('CRM');
    });
    
    $('#clearAll').click(function(){
        db.clearAll();
    });
    
    $('#dropDB').click(function(){
        db.dropTables();
    });
    
    $('#ping').click(function(){
        db.ping();
    });
    
    $('#createModel').click(function(){
        model = db.createModel();
        var a = new model.SellerTypes();
        model.SellerTypes.getBy('id', 1, function(){});
    });
});