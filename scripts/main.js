require.config({
    baseUrl: 'scripts/',
    paths: {
        jquery: 'libs/jquery-1.11.2.min'
    }
});

require(["jquery", "dbrs"], function($, dbrs) {
    console.log = function(input) {
        $('#console').append(JSON.stringify(input)+'\n');
        $('#console').scrollTop($('#console')[0].scrollHeight);
    }

    
    var db, model, obj;
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
    });
    
    $('#getOneButton').click(function(){
        var a = model.Ranges.getOneBy(
            $('#searchfield').val(),
            $('#searchvalue').val(),
            function(a){obj=a;console.log(a);}
        );
    });
        
    $('#getManyButton').click(function(){
        model.Ranges.getManyBy(
            $('#searchfield').val(),
            $('#searchvalue').val(),
            function(a){console.log(a);}
        );
    });     
    
    $('#getAllButton').click(function(){
        model.Ranges.getAll(
            function(a){console.log(a);}
        );
    });
    
    $('#save').click(function(){
        obj.save();
    }); 
    
    $('#remove').click(function(){
        obj.remove();
    });
    
    $('#clone').click(function(){
        var obj2 = obj.clone();
        console.log(obj);
        console.log(obj2);
        obj = obj2;
    });
    
    $('#createObject').click(function(){
        obj = new model.Ranges();
        console.log(obj);
    });
    
    $('#update').click(function(){
        obj.update();
    });
});