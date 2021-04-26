var app = require("@cisco-bpa-platform/mw-util-common-app");
var mongoose = app.mongodb.getConnection();

var Schema = mongoose.Schema;


var info_osupgrade_schema =new Schema({
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
    },
    mop:{
        type:Array
    },
    upgrade_time:{
        type:String
    },
    image_transfer_scheduled_time:{
        type:String
    },
    diff_log:{
        type:String
    },
    connected_device:{
        type:Array
    },
    history:{
        type:String
    },
    trace_logs_connect:{
        type:String
    },
    trace_logs_post:{
        type:String
    },
    trace_logs_pre:{
        type:String
    },
    trace_logs_upgrade:{
        type:String
    },
    validate_device_log:{
        type:String
    },
    cve_id:{
        type:String
    }
}, {versionKey: false})

module.exports = mongoose.model('info_osupgrade',info_osupgrade_schema, '');