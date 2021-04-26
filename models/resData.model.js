var app = require("@cisco-bpa-platform/mw-util-common-app");
var mongoose = app.mongodb.getConnection();
var Schema = mongoose.Schema;

var resData_schema =new Schema({
    _id:{
        type: String
    },
    startedAfter:{
        type: String
    },
    startTime:{
        type: String
    },
    deviceName:{
        type: String
    },
    cve_id:{
        type: String
    }
}, {versionKey: false});

module.exports = mongoose.model('response_db', resData_schema, "response_dbs");