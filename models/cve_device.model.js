var app=require("@cisco-bpa-platform/mw-util-common-app");
var mongoose =app.mongodb.getConnection();

var Schema=mongoose.Schema;


var devicechema =new Schema({
    cpyKey: {
        type: Number
    },
    deviceId: {
        type: Number
    },
    deviceIp: {
        type: String
    },
    deviceName: {
        type: String
    },
    deviceSysname: {
        type: String
    },
    deviceType: {
        type: String
    },
    ipAddress: {
        type:String
    },
    productFamily: {
        type:String
    },
    productId: {
        type:String
    },
    productType: {
        type:String
    },
    swType: {
        type:String
    },
    swVersion: {
        type:String
    }
}, {versionKey: false});

module.exports = mongoose.model('cve_devices',devicechema,'cve_devices');