const Mop =require('../models/mop.model');
var request = require('request')
var app = require('@cisco-bpa-platform/mw-util-common-app');
const CORE_API = app.services.core.url;


const device_info=require('../models/cve_device.model');

module.exports.insertDevice = function (req, res, next) {
  var list=req.body.devices;
  var uploadResult=true;
  for(var i=0;i<list.length;i++)
  {
    var info=list[i];
    var device={
    cpyKey:info.cpyKey,
    deviceId:info.deviceId,
    deviceIp:info.deviceIp,
    deviceSysname:info.deviceSysname,
    deviceType:info.deviceType,
    ipAddress:info.ipAddress,
    productFamily:info.productFamily,
    productId:info.productId,
    productType:info.productType,
    swType:info.swType,
    swVersion:info.swVersion
    }
    device_info .create(device,function(err, response){
      if(err){
      uploadResult=false;
        }
        
});
  }

 return res.send({uploadResult: uploadResult});
  
  }


module.exports.getAllMops = function (req, res, next) {
  Mop.find({},function(err,response){
  if(err){
  return  res.status(500).json({res:err}).end('');
  }
  else{
  return res.status(200).json({ success: true, res: response }).end('');
  }
  });

  
  }

exports.execute_template = function(req, res, next){
try {
    const nsoInstance = req.body.nsoInstance;
    const deviceList = req.body.deviceList;
    const protocols = req.body.protocols;
    const fileName = req.body.fileName;
    const targetLocation = req.body.targetLocation;
    const datestamp = req.body.datestamp;
    const now = new Date().getTime() / 1000;
    const scheduleTime = (datestamp - now) * 1000;
        for (const device of deviceList) {
            const args = {
                url: `${CORE_API}/api/v1.0/template-manager/execute?nsoInstance=${nsoInstance}`,
                form: {
                    "deviceName": device,
                    "templateId": "downloadImage",
                    "commandList": [
                        {
                            "command": "copy " + protocols + "://calo@10.122.153.158/" + fileName + " " + targetLocation + ":" + fileName + " vrf management",
                            "isConfigMode": false,
                            "goToStepOnPass": "",
                            "goToStepOnFail": "",
                            "passExpr": "",
                            "rules": []
                        }
                    ]
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    res.status(200).json({success: true, result: data}).end('');
                }
            });
        }
    } catch (e) {
        res.error.json({success: false, return: e});
    }
}