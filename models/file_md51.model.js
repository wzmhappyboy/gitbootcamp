var app=require("@cisco-bpa-platform/mw-util-common-app");
var mongoose =app.mongodb.getConnection();

var Schema=mongoose.Schema;


var md51Schema =new Schema({
    _id:{
        type: String
    },
    currentOS_version:{
        type:String
    },
    targetOS_version:{
        type:String
    },
    upgrade_tpye:{
        type:String
    },
    host_name:{
        type:String
    },
    region:{
        type:String
    },
    upgrade_status:{
        type:String
    },
    image_transfer_status:{
        type:String
    },
    image_transfer_scheduled_time:{
        type:String
    },
    device_reachability_status:{
        type:String
    },
    pre_check_status:{
        type:String
    },
    pre_check_log:{
        type:String
    },
    post_check_status:{
        type:String
    },
    post_check_log:{
        type:String
    }
})

module.exports = mongoose.model('image_md51',md51Schema);