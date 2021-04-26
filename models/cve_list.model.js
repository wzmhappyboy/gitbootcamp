var app=require("@cisco-bpa-platform/mw-util-common-app");
var mongoose =app.mongodb.getConnection();

var Schema=mongoose.Schema;


var cvelistchema =new Schema({
    cveid: {
        type: String
    },
    security: {
        type: String
    },
    owner: {
        type: String
    },
    current_status: {
        type: String
    },
    target_resolution_date: {
        type: String
    },
    remediation_availability: {
        type: String
    },
    device_list: {
        type: Array
    },
    seek_vendor_list: {
        type: Array
    },
    submit_device_list: {
        type: Array
    },
    process_instance_id: {
        type: Array
    },
    process_instance_id_sub: {
        type: String
    },
    upgraded_device_list: {
        type: Array
    },
       device_type:{
        type:String
      },
    current_os_version:{
        type:String
    },
    module_or_feature_impacted:{
        type:String
    },
    target_os_version:{
        type:String
    }

}, {versionKey: false});

module.exports = mongoose.model('cve_list',cvelistchema,'cve_list');