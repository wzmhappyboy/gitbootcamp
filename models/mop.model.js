var app=require("@cisco-bpa-platform/mw-util-common-app");
var mongoose =app.mongodb.getConnection();

var Schema=mongoose.Schema;


var mopSchema =new Schema({
    mop_name:{
        type: String
    },
    vendor:{
        type:String
    },
    device_type:{
        type:String
     },
    device_role:{
        type:String
    },
    soruce_version:{
        type:String
    },
    target_version:{
        type:String
    }
} )

module.exports=mongoose.model('mops',mopSchema);