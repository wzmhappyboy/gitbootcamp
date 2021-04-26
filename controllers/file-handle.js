const fs =require('fs')
const cve_list =require('../models/cve_list.model');
const WebSocket = require('ws');

const WebSocketServer = WebSocket.Server;

const request = require('request');
const async = require('async');

const CORE_API = "http://10.124.196.148:8000";
const AUTH_API = "http://10.124.196.148:9102";


module.exports.readFile = function (req, res, next) {
    const absolutePath = req.file.path;
    const fileFullName=req.file.filename;
    const fileName=fileFullName.split(".csv")[0];
    const jsonString = fs.readFileSync(absolutePath, "utf-8");
    var rows=new Array();
    var table=new Object();
    rows=jsonString.split("\r\n");
    var l=rows.length;
    table.cveid=fileName;
    table.security='high';
    table.owner='chengrfa';
    table.current_status='Not start';
    table.target_resolution_date='2020-12-15';
    table.remediation_availability='Yes';
    table.device_list=new Array();
    for(var i=1;i<rows.length-1;i++){
        table.device_list[i-1]=
            {
                device:rows[i].split(",")[5],
                vendor:'Cisco',
                host_name:rows[i].split(",")[2],
                ip_address:rows[i].split(",")[9],
                management_address:rows[i].split(",")[10],
                operating_system:rows[i].split(",")[8].split(/[0,1,2,3,4,5,6,7,8,9]/)[0],
                version:rows[i].split(",")[8].substring(rows[i].split(",")[8].lastIndexOf(" ")+1),
                model:rows[i].split(",")[4],
                region:rows[i].split(",")[0],
                country:rows[i].split(",")[1],
                serial_number:rows[i].split(",")[3],
                environment:rows[i].split(",")[6],
                roles:rows[i].split(",")[7],
                infrastructure_type:rows[i].split(",")[12],
                device_criticality:rows[i].split(",")[15],
                category:rows[i].split(",")[13],
                risk_rating:rows[i].split(",")[14],
                recommendation:'recommendation',
                workaround:'workaround',
                target_os:'V7.0.3.I7.6',
                vulnerability_score:'60',
                mop:'mop1',
                date_of_execution:'',
                owner:'chengrfa',
            }

    }

    table.impact=new Array();
    table.impact[0]={
        service:'asr1',
        downtime_required: "30mins",
        application: "test APP",
        approval_status: "true",
        cket_number: "15"
    }
    table.impact[1]={
        service:'asr2',
        downtime_required: "30mins",
        application: "test APP",
        approval_status: "true",
        cket_number: "21"
    }


    // var uploadResult;

    // cve_list.create(table, function(err, response){
    //     if(err){
    //         uploadResult=false;
    //     }
    //     else{
    //         uploadResult=true;
    //     }
    // });
    // res.send({cveInfo:table});
    cve_list.find({cveid:{$in: table.cveid}}, {cveid:1, _id:0}, function (err, response) {
      if (err) {
          res.status(500).json({ success: false, Error_Message: err }).end('');
      } else {
          if (response.length === 0) {
              cve_list.create(table, function(err, response){
                  if(err){
                      res.status(500).json({ success: false, Error_Message: err }).end('');
                  }
                  else{
                      res.status(200).json({ success: true, veInfo: table }).end('');
                  }
              });
          } else {
            var flag=true;
            for(var i=0;i<table.device_list.length;i++){
              cve_list.findOneAndUpdate({cveid: table.cveid},{
                '$push':{'device_list':table.device_list[i]}
              },{},
              function(err,response){
                if(err){
                  flag=false;
              }
             
              }

              )
          }
          if(flag)
          {
            res.status(200).json({ success: true, veInfo:"devices add success"}).end('');
          }
          else{
            res.status(500).json({ success: false}).end('');

          }
      }
    
    }
  })  
  }


exports.getDevices=function (req,res) {
    let devices=[];
    let get_token = function (callback) {
        const args = {
            url: `${AUTH_API}/api/v1.0/login`,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic YWRtaW46YWRtaW4="
            }
        };
        request.post(args, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                data = JSON.parse(data);
                const authToken = data.token_type + " " + data.access_token;
                console.log("token:"+authToken);
                callback(null, authToken);
            } else {
                const err_message = {
                    "error_stage": "get_token",
                    "status_code": response.statusCode,
                    "body": JSON.parse(response.body)
                };
                callback(err_message, null);
            }
        });
    }
    let getDevices = function (authToken, callback) {
        const args = {
            url: `${CORE_API}/api/v1.0/device-manager/devices?nsoInstance=ALL`,
            headers: {
                "Authorization": authToken
            }
        };
        request.get(args, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                data = JSON.parse(data);
                for(const dataOne of data) {
                    if (dataOne["ned-id"] == 'cisco-asa-cli-6.8') {
                        devices.push(dataOne.name);
                    }
                }
                callback(null, data)
            } else {
                const err_message = {
                    "error_stage": "get_devices",
                    "status_code": response.statusCode,
                    "body": JSON.parse(response.body)
                };
                devices.push("get_device             failure");
                callback(err_message, null);
            }
        });
    }
    async.waterfall([
        get_token,
        getDevices
    ], function (err) {
        if (err) {
            res.json({success: false}).end('');
        } else {
            res.json({success: true,devices:devices}).end('');
        }
    })
}

