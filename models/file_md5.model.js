var app=require("@cisco-bpa-platform/mw-util-common-app");
var mongoose =app.mongodb.getConnection();

var Schema=mongoose.Schema;


var md5Schema =new Schema({
    _id:{
        type: String
    },
    md5:{
        type:String
    }
})

module.exports = mongoose.model('image_md5',md5Schema, 'image_md5');