var request = require('request')
var async = require('async');
const child_process = require('child_process');
const fs =require('fs');
var app = require('@cisco-bpa-platform/mw-util-common-app');
const md5_file =require('../models/file_md5.model');
const osupgrade_info =require('../models/osupgrade_info.model');
const get_resData =require('../models/resData.model');
const cve_list =require('../models/cve_list.model');

const AUTH_API = app.services.auth.url;
const CORE_API = app.services.core.url;
const NSO_API = "http://10.124.44.46:8080";
const NSO_FLASK_API = "http://10.124.44.46:8081";
const BPA_FLASK_API = "http://10.124.196.148:8881";

const PRE_WORKFLOW_ID = "bc5a618c-5811-11eb-8f49-0242c0a8700e";
const POST_WORKFLOW_ID = "9982db14-5811-11eb-8f49-0242c0a8700e";
const DRY_RUN_WORKFLOW_ID = "694491e3-59c6-11eb-a6fd-0242ac1d0015";
const OSUPGRADE_WORKFLOW_ID = "62530956-5a4e-11eb-acdb-0242c0a85002";
const DOWNLOAD_IMAGE_WORKFLOW_ID = "165f9bd6-5a50-11eb-b553-0242c0a85013";
// const VALIDATE_WORKFLOW_ID = "675e9915-43b0-11eb-9426-0242c0a85002";    
const MAIN_WORKFLOW_ID = "90b4275f-5a49-11eb-ba49-0242c0a81015";
const ASSESSMENT_WORKFLOW_ID = "chengrfa-Assessment-WF:26:3f61632b-5810-11eb-8f49-0242c0a8700e";

const WORKFLOW_ID = "zm_downloadImage:2:7b426cb4-2f4d-11eb-b551-0242ac150006";
const DYNAMIC_TEMPLATE_ID = "5fbe9921e070ff436094797e";

// const EMAIL_TO = ["chengrfa@cisco.com","zimingw@cisco.com","jushao@cisco.com"];
const EMAIL_TO = ["chengrfa@cisco.com","abhkuma6@cisco.com"];

let token = "";
let row_number_map = {};

exports.get_token = function(req, res, next) {
    const args = {
        url: `${AUTH_API}/api/v1.0/login`,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic YWRtaW46YWRtaW4="
        }
    };
    request.post(args, function (error, response, data){
        if (!error && response.statusCode === 200) {
            data = JSON.parse(data);
            const tokenData = data.token_type + " " + data.access_token;
            res.status(200).json({success: true, result: tokenData}).end('');
        } else {
            const err_message = {
                "status_code": response.statusCode,
                "body": JSON.parse(response.body)
            };
            res.json({success: false, result: err_message}).end('');
        }
    });
}

exports.downloadImage = function (req, res, next) {
    const nsoInstance = req.body.nsoInstance;
    const deviceList = req.body.deviceList;
    const protocols = req.body.protocols;
    const fileName = req.body.fileName;
    const targetLocation = req.body.targetLocation;
    const scheduleTpye = req.body.scheduleType;
    const datestamp = req.body.datestamp;
    const now = new Date().getTime() / 1000;
    const scheduleTime = (datestamp - now) * 1000;
    function downloading() {
        for (const device of deviceList){
            const args = {
                url: `${CORE_API}/api/v1.0/template-manager/execute?nsoInstance=${nsoInstance}`,
                form: {
                    "deviceName": device,
                    "templateId": "downloadImage",
                    "commandList": [
                        {
                            "command": "copy " + protocols + "://anonymous@10.124.196.148/" + fileName + " " + targetLocation + ":" + fileName + " vrf management",
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
    }
    if (scheduleTpye === "now") {
        downloading()
    }else {
        setTimeout(downloading, scheduleTime);
    }
}

// exports.pre_check = function(req, res, next) {
//     const resultALL = [];
//     const nsoInstance = req.body.nsoInstance;
//     const deviceList = req.body.deviceList;
//     const imageName = req.body.imageName;
//     for (const device of deviceList) {
//         let get_token = function (callback) {
//             const args = {
//                 url: `${AUTH_API}/api/v1.0/login`,
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": "Basic YWRtaW46YWRtaW4="
//                 }
//             };
//             request.post(args, function (error, response, data) {
//                 if (!error && response.statusCode === 200) {
//                     data = JSON.parse(data);
//                     const authToken = data.token_type + " " + data.access_token;
//                     callback(null, authToken);
//                 } else {
//                     const err_message = {
//                         "error_stage": "get_token",
//                         "deviceName": dataOne.deviceName,
//                         "status_code": response.statusCode,
//                         "body": JSON.parse(response.body)
//                     };
//                     callback(null, err_message);
//                 }
//             });
//         }

//         let pre_check_device = function (authToken, callback) {
//             const args = {
//                 url: `${CORE_API}/api/v1.0/template-manager/execute?nsoInstance=${nsoInstance}`,
//                 form: {
//                     "deviceName": device,
//                     "templateId": "pre-check",
//                     "commandList": [
//                         {
//                             "command": "show module",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         },
//                         {
//                             "command": "show Version",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         },
//                         {
//                             "command": "show log",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         },
//                         {
//                             "command": "show system resources",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         },
//                         {
//                             "command": "show system resources module all",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         },
//                         {
//                             "command": "show cores",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         },
//                         {
//                             "command": "show int brief",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         },
//                         {
//                             "command": "show run",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         },
//                         {
//                             "command": "copy run start",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         },
//                         {
//                             "command": "show install all impact nxos bootflash:" + imageName,
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         }
//                     ]
//                 },
//                 headers: {
//                     "Authorization": authToken,
//                 }
//             };
//             request.post(args, function (error, response, data) {
//                 if (!error && response.statusCode === 200) {
//                     const preCheckWhereStr  = {"_id": device};
//                     const preCheckupdateStr  = {$set:{"pre_check_status": "true", "pre_check_log": data}};
//                     osupgrade_info.updateOne(preCheckWhereStr, preCheckupdateStr);
//                     callback(null, data);
//                     // resultALL.push(data);
//                 } else {
//                     const err_message = {
//                         "status_code": response.statusCode,
//                         "body": JSON.parse(response.body)
//                     };
//                     callback(err_message, data);
//                     // resultALL.push(err_message);
//                 }
//             });
//         }

//         async.waterfall([get_token, pre_check_device], function (err, data) {
//             let results = "";
//             data = JSON.parse(data);
//             console.log(data);
//             for (const command of data.commands){
//                 const result = "<b>" + command.executedCmd.toUpperCase()+ "</b>" + "<br>" + command.cmdOutPut.replace(/\r\n/g,"<br>") + "<br>";
//                 results = results + result;
//             }
//             if (err) {
//                 const email_msg = {
//                     "subject": "Security Patching Pre-Check Failure",
//                     "html": `Task: Pre-Check <br>Task Status: Failure<br>Time of Execution:${new Date().Format("yyyy-MM-dd hh:mm:ss")}<br>Device(s):${device}<br>Output:<br>${results}`
//                 }
//                 send_email(email_msg);
//                 resultALL.push(err);
//             } else {
//                 const email_msg = {
//                     "subject": "Security Patching Pre-Check Success",
//                     "html": `Task: Pre-Check <br>Task Status: Success<br>Time of Execution:${new Date().Format("yyyy-MM-dd hh:mm:ss")}<br>Device(s):${device}<br>Output:<br>${results}`
//                 }
//                 send_email(email_msg);
//                 resultALL.push(data);
//             }
//             if (resultALL.length === deviceList.length) {
//                 res.status(200).json({success: true, result: resultALL}).end('');
//             }
//         })
//     }
// }
exports.pre_check_data_storage = function(req, res, next) {
    const resultALL = [];
    const deviceList = req.body.deviceList;
    for (const device of deviceList) {
        let show_module = function (callback) {
            let status = false;
            const args = {
                url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/live-status/tailf-ned-cisco-nx-stats:exec/any`,
                body: `{
                    "input": {
                        "args": "show module"
                    }
                }`,
                headers: {
                    "Accept": "application/yang-data+json",
                    "Authorization": "Basic cm9vdDphZG1pbg==",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/yang-data+json"
                }
            };
            request.post(args, function(error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data)["tailf-ned-cisco-nx-stats:output"]["result"];
                    if (data.indexOf("Pass") !== -1) {
                        status = true;
                    }
                    const result = {
                        "command": "show module",
                        "cmdOutPut": data,
                        "evaluatedRules":[{"result":status}]
                    }
                    callback(null, result);
                } else {
                    callback(error, null);
                }
            })
        }

        let show_version = function (callback) {
            const args = {
                url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/live-status/tailf-ned-cisco-nx-stats:exec/any`,
                body: `{
                    "input": {
                        "args": "show version"
                    }
                }`,
                headers: {
                    "Accept": "application/yang-data+json",
                    "Authorization": "Basic cm9vdDphZG1pbg==",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/yang-data+json"
                }
            };
            request.post(args, function(error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data)["tailf-ned-cisco-nx-stats:output"]["result"];
                    const result = {
                        "command": "show version",
                        "cmdOutPut": data,
                        "evaluatedRules":[{"result":true}]
                    }
                    callback(null, result);
                } else {
                    callback(error, null);
                }
            })
        }

        let show_system_resources = function (callback) {
            let status = false;
            const args = {
                url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/live-status/tailf-ned-cisco-nx-stats:exec/any`,
                body: `{
                    "input": {
                        "args": "show system resources"
                    }
                }`,
                headers: {
                    "Accept": "application/yang-data+json",
                    "Authorization": "Basic cm9vdDphZG1pbg==",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/yang-data+json"
                }
            };
            request.post(args, function(error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data)["tailf-ned-cisco-nx-stats:output"]["result"];
                    if (data.indexOf("Current memory status: OK") !== -1) {
                        status = true;
                    }
                    const result = {
                        "command": "show system resources",
                        "cmdOutPut": data,
                        "evaluatedRules":[{"result":status}]
                    }
                    callback(null, result);
                } else {
                    callback(error, null);
                }
            })
        }

        let show_system_resources_module_all = function (callback) {
            const args = {
                url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/live-status/tailf-ned-cisco-nx-stats:exec/any`,
                body: `{
                    "input": {
                        "args": "show system resources module all"
                    }
                }`,
                headers: {
                    "Accept": "application/yang-data+json",
                    "Authorization": "Basic cm9vdDphZG1pbg==",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/yang-data+json"
                }
            };
            request.post(args, function(error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data)["tailf-ned-cisco-nx-stats:output"]["result"];
                    const result = {
                        "command": "show system resources module all",
                        "cmdOutPut": data,
                        "evaluatedRules":[{"result":true}]
                    }
                    callback(null, result);
                } else {
                    callback(error, null);
                }
            })
        }

        let show_cores = function (callback) {
            const args = {
                url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/live-status/tailf-ned-cisco-nx-stats:exec/any`,
                body: `{
                    "input": {
                        "args": "show cores"
                    }
                }`,
                headers: {
                    "Accept": "application/yang-data+json",
                    "Authorization": "Basic cm9vdDphZG1pbg==",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/yang-data+json"
                }
            };
            request.post(args, function(error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data)["tailf-ned-cisco-nx-stats:output"]["result"];
                    const result = {
                        "command": "show cores",
                        "cmdOutPut": data,
                        "evaluatedRules":[{"result":true}]
                    }
                    callback(null, result);
                } else {
                    callback(error, null);
                }
            })
        }

        let show_int_brief = function (callback) {
            const args = {
                url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/live-status/tailf-ned-cisco-nx-stats:exec/any`,
                body: `{
                    "input": {
                        "args": "show interface brief"
                    }
                }`,
                headers: {
                    "Accept": "application/yang-data+json",
                    "Authorization": "Basic cm9vdDphZG1pbg==",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/yang-data+json"
                }
            };
            request.post(args, function(error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data)["tailf-ned-cisco-nx-stats:output"]["result"];
                    const result = {
                        "command": "show interface brief",
                        "cmdOutPut": data,
                        "evaluatedRules":[{"result":true}]
                    }
                    callback(null, result);
                } else {
                    callback(error, null);
                }
            })
        }

        let show_run = function (callback) {
            const args = {
                url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/live-status/tailf-ned-cisco-nx-stats:exec/any`,
                body: `{
                    "input": {
                        "args": "show run"
                    }
                }`,
                headers: {
                    "Accept": "application/yang-data+json",
                    "Authorization": "Basic cm9vdDphZG1pbg==",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/yang-data+json"
                }
            };
            request.post(args, function(error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data)["tailf-ned-cisco-nx-stats:output"]["result"];
                    const result = {
                        "command": "show run",
                        "cmdOutPut": data,
                        "evaluatedRules":[{"result":true}]
                    }
                    callback(null, result);
                } else {
                    callback(error, null);
                }
            })
        }

        let copy_run_start = function (callback) {
            let status = false;
            const args = {
                url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/live-status/tailf-ned-cisco-nx-stats:exec/any`,
                body: `{
                    "input": {
                        "args": "copy run start"
                    }
                }`,
                headers: {
                    "Accept": "application/yang-data+json",
                    "Authorization": "Basic cm9vdDphZG1pbg==",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/yang-data+json"
                }
            };
            request.post(args, function(error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data)["tailf-ned-cisco-nx-stats:output"]["result"];
                    if (data.indexOf("Copy complete.")!==-1) {
                        status = true;
                    }
                    const result = {
                        "command": "copy run start",
                        "cmdOutPut": data,
                        "evaluatedRules":[{"result":status}]
                    }
                    callback(null, result);
                } else {
                    callback(error, null);
                }
            })
        }

        let show_os_bin = function (callback) {
            let status =true;
            const args = {
                url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/live-status/tailf-ned-cisco-nx-stats:exec/any`,
                body: `{
                    "input": {
                        "args": "show install all impact nxos bootflash:nxos.7.0.3.I7.9.bin"
                    }
                }`,
                headers: {
                    "Accept": "application/yang-data+json",
                    "Authorization": "Basic cm9vdDphZG1pbg==",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/yang-data+json"
                }
            };
            request.post(args, function(error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data)["tailf-ned-cisco-nx-stats:output"]["result"];
                    if (data.indexOf("ailed") > -1) {
                        status = false;
                    }
                    const result = {
                        "command": "show install all impact nxos bootflash:nxos.7.0.3.I7.9.bin",
                        "cmdOutPut": data,
                        "evaluatedRules":[{"result":status}]
                    }
                    callback(null, result);
                } else {
                    callback(error, null);
                }
            })
        }

        async.parallel([
            show_module,
            show_version,
            show_system_resources,
            show_system_resources_module_all,
            show_cores,
            show_int_brief,
            show_run,
            copy_run_start,
            show_os_bin
        ],function(err,data){
            let results = "";
            for (const cmd of data){
                const result = "<b>" + cmd.command.toUpperCase()+ "</b>" + "<br>" + cmd.cmdOutPut.replace(/\r\n/g,"<br>") + "<br>";
                results = results + result;
                // console.log(results)
            }
            if (err) {
                const email_msg = {
                    "subject": "Security Patching Pre-Check Failure",
                    "html": `Task: Pre-Check <br>Task Status: Failure<br>Time of Execution:${new Date().Format("yyyy-MM-dd hh:mm:ss")}<br>Device(s):${device}<br>Output:<br>${results}`
                }
                send_email(email_msg);
                resultALL.push(err);
            } else {
                const email_msg = {
                    "subject": "Security Patching Pre-Check Success",
                    "html": `Task: Pre-Check <br>Task Status: Success<br>Time of Execution:${new Date().Format("yyyy-MM-dd hh:mm:ss")}<br>Device(s):${device}<br>Output:<br>${results}`
                }
                send_email(email_msg);
                let pre_check_status = "true";
                const result = {
                    "deviceName":device,
                    "commands":data
                };
                for (const command of result.commands) {
                    console.log(command.evaluatedRules[0].result);
                    if (command.evaluatedRules[0].result === false) {
                        pre_check_status = "error";
                        break;
                    }
                }
                const preCheckWhereStr  = {"_id": device};
                let preCheckupdateStr;
                if (pre_check_status === "error") {
                    preCheckupdateStr  = {$set:{"upgrade_status": "Failure", "pre_check_status": pre_check_status, "pre_check_log": JSON.stringify(result)}};
                } else {
                    preCheckupdateStr  = {$set:{"pre_check_status": pre_check_status, "pre_check_log": JSON.stringify(result)}};
                }                
                osupgrade_info.updateOne(preCheckWhereStr, preCheckupdateStr, function (error) {
                    console.log(error);
                });
                resultALL.push(result);
            }
            if (resultALL.length === deviceList.length) {
                res.status(200).json({success: true, result: resultALL}).end('');
            }
        })
    }
}

exports.get_precheck_log = function(req, res, next){
    const device = req.body.device;
    const whereStr  = {"_id": device};
    const conditionStr  = {_id: 1, pre_check_log: 1};
    osupgrade_info.find(whereStr, conditionStr, function(err,response){
        if(err){
            res.status(500).json({success: false, Error_Message: err}).end('');
        }
        else{
            if (response[0].pre_check_log === "") {
                res.status(200).json({success: true, result: "no data"}).end('');
                return;
            }
            const result = {
                "_id": response[0]._id,
                "pre_check_log": JSON.parse(response[0].pre_check_log)
            }
            res.status(200).json({success: true, result: result}).end('');
        }
    });
}

// exports.post_check = function(req, res, next) {
//     const resultALL = [];
//     const nsoInstance = req.body.nsoInstance;
//     const deviceList = req.body.deviceList;
//     for (const device of deviceList) {
//         let get_token = function (callback) {
//             const args = {
//                 url: `${AUTH_API}/api/v1.0/login`,
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": "Basic YWRtaW46YWRtaW4="
//                 }
//             };
//             request.post(args, function (error, response, data) {
//                 if (!error && response.statusCode === 200) {
//                     data = JSON.parse(data);
//                     const authToken = data.token_type + " " + data.access_token;
//                     callback(null, authToken);
//                 } else {
//                     const err_message = {
//                         "error_stage": "get_token",
//                         "deviceName": dataOne.deviceName,
//                         "status_code": response.statusCode,
//                         "body": JSON.parse(response.body)
//                     };
//                     callback(null, err_message);
//                 }
//             });
//         }

//         let post_check = function (authToken, callback) {
//             const args = {
//                 url: `${CORE_API}/api/v1.0/template-manager/execute?nsoInstance=${nsoInstance}`,
//                 form: {
//                     "deviceName": device,
//                     "templateId": "pre-check",
//                     "commandList": [
//                         {
//                             "command": "show module",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         },
//                         {
//                             "command": "show version",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         }
//                     ]
//                 },
//                 headers: {
//                     "Authorization": authToken,
//                 },
//             };
//             request.post(args, function (error, response, data) {
//                 if (!error && response.statusCode === 200) {
//                     const postCheckWhereStr  = {"_id": device};
//                     const postCheckupdateStr  = {$set:{"post_check_status": "true", "post_check_log": data}};
//                     osupgrade_info.updateOne(postCheckWhereStr, postCheckupdateStr);
//                     callback(null, data);
//                     // resultALL.push(data);
//                 } else {
//                     const err_message = {
//                         "status_code": response.statusCode,
//                         "body": JSON.parse(response.body)
//                     };
//                     callback(err_message, data);
//                     // resultALL.push(err_message);
//                 }
//             });
//         }

//         async.waterfall([get_token, post_check], function (err, data) {
//                 let results = "";
//                 data = JSON.parse(data);
//                 for (const command of data.commands){
//                     const result = "<b>" + command.executedCmd.toUpperCase()+ "</b>" + "<br>" + command.cmdOutPut.replace(/\r\n/g,"<br>") + "<br>";
//                     results = results + result;
//                 }
//                 if (err) {
//                     const email_msg = {
//                         "subject": "Security Patching Post-Check Failure",
//                         "html": `Task: Post-Check <br>Task Status: Failure<br>Time of Execution:${new Date().Format("yyyy-MM-dd hh:mm:ss")}<br>Device(s):${device}<br>Output:<br>${results}`
//                     }
//                     send_email(email_msg);
//                     resultALL.push(err);
//                 } else {
//                     const email_msg = {
//                         "subject": "Security Patching Post-Check Success",
//                         "html": `Task: Post-Check <br>Task Status: Success<br>Time of Execution:${new Date().Format("yyyy-MM-dd hh:mm:ss")}<br>Device(s):${device}<br>Output:<br>${results}`
//                     }
//                     send_email(email_msg);
//                     resultALL.push(data);
//                 }
//                 if (resultALL.length === deviceList.length) {
//                     res.status(200).json({success: true, result: resultALL}).end('');
//                 }
//             })
//     }
// }

exports.get_postcheck_log = function(req, res, next){
    const device = req.body.device;
    const whereStr  = {"_id": device};
    const conditionStr  = {_id: 1, post_check_log: 1};
    osupgrade_info.find(whereStr, conditionStr, function(err,response){
        if(err){
            res.status(500).json({success: false, Error_Message: err}).end('');
        }
        else{
            if (response[0].post_check_log === "") {
                res.status(200).json({success: true, result: "no data"}).end('');
                return;
            }
            const result = {
                "_id": response[0]._id,
                "post_check_log": JSON.parse(response[0].post_check_log)
            }
            res.status(200).json({success: true, result: result}).end('');
        }
    });
}

exports.check_size = function(req, res, next){
    const result = [];
    const nsoInstance = req.body.nsoInstance;
    const deviceList = req.body.deviceList;
    for (const device of deviceList) {
        const args = {
            url: `${CORE_API}/api/v1.0/template-manager/execute?nsoInstance=${nsoInstance}`,
            form: {
                "deviceName": device,
                "templateId": "pre-check",
                "commandList": [
                    {
                        "command": "dir",
                        "isConfigMode": false,
                        "goToStepOnPass": "",
                        "goToStepOnFail": "",
                        "passExpr": "",
                        "rules": []
                    }
                ]
            },
        };
        request.post(args, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                // data = JSON.parse(data);
                data = JSON.parse(data).commands[0].cmdOutPut;
                const split = 'Usage for bootflash://';
                data = data.split(split)[1];
                data = data.split("\r\n");
                data.shift();
                data.pop();
                let r1;
                let r2;
                let r3;
                if (device === "F241.16.14-9372-2" || device === "F241.16.14-9372-1" || device === "F241.16.14-93180-1" || device === "F241.16.14-93180-2") {
                    r1 = data[0].split(" ")[0];
                    r2 = data[1].split(" ")[0];
                    r3 = data[2].split(" ")[0];
                } else {
                    r1 = data[0].split(" ")[1];
                    r2 = data[1].split(" ")[1];
                    r3 = data[2].split(" ")[1];
                }

                const dataArray = {
                    "used": (r1 / 1024 / 1024 / 1024).toFixed(2) + "GB",
                    "free": (r2 / 1024 / 1024 / 1024).toFixed(2) + "GB",
                    "total": (r3 / 1024 / 1024 / 1024).toFixed(2) + "GB"
                }
                result.push(dataArray);
                res.status(200).json({success: true, result: result}).end('');
            } else {
                const err_message = {
                    "status_code": response.statusCode,
                    "body": JSON.parse(response.body)
                };
                res.json({success: false, result: err_message}).end('');
            }
        });
    }
}

exports.get_md5_checksum = function(req, res, next) {
    const id = req.body._id;
    const whereStr = {
        "_id":id
    }
    md5_file.find(whereStr,function(err,response){
        if(err){
            res.status(500).json({ success: false, Error_Message: err }).end('');
        }
        else{
            res.status(200).json({ success: true, result: response }).end('');
        }
    });
}

exports.get_osupgrade_info = function(req, res, next) {
    const id = req.body._id;
    const whereStr = {
        "_id":id
    }
    osupgrade_info.find({},function(err,response){
        if(err){
            res.status(500).json({ success: false, Error_Message: err }).end('');
        }
        else{
            res.status(200).json({ success: true, result: response }).end('');
        }
    });
}

exports.update_upgrade_status = function(req, res, next) {
    const status = req.body.status;
    const deviceList = req.body.deviceList;
    for (device of deviceList){
    	const whereStr  = {
        	"_id": device
        };
	    const updateStr  = {$set:{
	            "upgrade_status": status
	        }};
	    osupgrade_info.updateOne(whereStr, updateStr, function(err,response){
	        if(err){
	            res.status(500).json({success: false, Error_Message: err}).end('');
	        }
	        else{
	            res.status(200).json({success: true, result: response}).end('');
	        }
	    });
    }
}

exports.update_transfer_status = function(req, res, next) {
    const status = req.body.status;
    const deviceList = req.body.deviceList;
    for (device of deviceList){
        const whereStr  = {
            "_id": device
        };
        const updateStr  = {$set:{
                "image_transfer_status": status
            }};
        osupgrade_info.updateOne(whereStr, updateStr, function(err,response){
            if(err){
                res.status(500).json({success: false, Error_Message: err}).end('');
            }
            else{
                res.status(200).json({success: true, result: response}).end('');
            }
        });
    }
}

exports.get_workflow_data = function (req, res, next) {
    const processInstanceId = req.body.id;
    const startedAfter = req.body.startedAfter;
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
            const token = data.token_type + " " + data.access_token;
            console.log("Get Token Successfully");
            get_resData.find({}, function(err, response){
                if(err){
                    return err;
                }else if(response.length === 0) {
                    console.log("No data");
                } else {
                    for (const responseOne of response) {
                        const processInstanceId = responseOne._id;
                        const startedAfter = responseOne.startedAfter;
                        const finalResponse = [];
                        const args = {
                            url: `${CORE_API}/api/v1.0/workflow/history/process-instances/get`,
                            body:{
                                "finished": true,
                                "startedAfter": startedAfter,
                                "processDefinitionName": "zm_downloadImage"
                            },
                            json:true,
                            headers: {
                                "Authorization": token,
                            }
                        };
                        console.log(startedAfter);
                        console.log(processInstanceId);
                        request.post(args, function (error, response, data){
                            console.log("1");
                            console.log(error);
                            console.log(response);
                            if (!error && response.statusCode === 200) {
                                console.log(data);
                                let id = "";
                                for (let oneData of data) {
                                    console.log(processInstanceId)
                                    console.log(oneData.id === processInstanceId)
                                    console.log(oneData.state)
                                    if (oneData.state === "COMPLETED" && oneData.id === processInstanceId) {
                                        console.log("Find ID -> " + oneData.id);
                                        id = oneData.id;
                                        const args = {
                                            url: `${CORE_API}/api/v1.0/workflow/history/details?processInstanceId=${id}&variableUpdates=true&deserializeValues=false`,
                                            headers: {
                                                "Authorization": token,
                                            }
                                        };
                                        request.get(args, function (error, response, data) {
                                            if (!error && response.statusCode === 200) {
                                                data = JSON.parse(data);
                                                for (let oneData of data) {
                                                    if (oneData.variableName === "full_response") {
                                                        finalResponse.push(JSON.parse(oneData.value));
                                                    }
                                                }

                                                const preCheckWhereStr  = {"_id": finalResponse[1].body.deviceName};
                                                const preCheckupdateStr  = {$set:{"pre_check_status": "true", "pre_check_log": JSON.stringify(finalResponse[1].body)}};
                                                osupgrade_info.updateOne(preCheckWhereStr, preCheckupdateStr,function (err) {
                                                    if (err) {console.log(err);}
                                                });

                                                const imageWhereStr  = {"_id": finalResponse[6].body.deviceName};
                                                const imageCheckupdateStr  = {$set:{"image_transfer_status" : "Downloaded", "upgrade_status":"Success"}};
                                                osupgrade_info.updateOne(imageWhereStr, imageCheckupdateStr,function (err) {
                                                    if (err) {console.log(err);}
                                                });

                                                const postCheckWhereStr  = {"_id": finalResponse[13].body.deviceName};
                                                const postCheckupdateStr  = {$set:{"post_check_status": "true", "post_check_log": JSON.stringify(finalResponse[13].body)}};
                                                osupgrade_info.updateOne(postCheckWhereStr, postCheckupdateStr,function (err) {
                                                    if (err) {console.log(err);}
                                                });

                                                const diffWhereStr  = {"_id": finalResponse[1].body.deviceName};
                                                const diffupdateStr  = {$set:{"diff_log": JSON.stringify(finalResponse[15].body)}};
                                                osupgrade_info.updateOne(diffWhereStr, diffupdateStr,function (err) {
                                                    if (err) {console.log(err);}
                                                });

                                                get_resData.deleteOne({"_id": id},function (err) {
                                                    if (err) {console.log(err);}
                                                })
                                            } else {
                                                const err_message = {
                                                    "status_code": response.statusCode,
                                                    "body": JSON.parse(response.body)
                                                };
                                                console.log("Cannot get full-response data: " + JSON.stringify(err_message));
                                                return err_message;
                                            }
                                        });
                                    } else {
                                        console.log("No matching data, searching...");
                                    }
                                }
                            } else {
                                const err_message = {
                                    "status_code": response.statusCode,
                                    "body": JSON.parse(response.body)
                                };
                                console.log("Cannot get completed data: " + JSON.stringify(err_message));
                                return err_message;
                            }
                        });
                    }
                }
            });
        }
    });
}

exports.check_responseDB = function(req, res, next) {
    get_resData.find({}, function(err, response){
        if(err){
            res.status(500).json({ success: false, Error_Message: err }).end('');
        }
        else{
            res.status(200).json({ success: true, result: response }).end('');
        }
    });
}

exports.testDB_add = function(req, res, next) {
    const id = req.body.id;
    const startedAfter = req.body.startedAfter;
    const data = {
        "_id": id, 
        "startedAfter": startedAfter
    };
    get_resData.create(data, function(err, response){
        if(err){
            res.json({ success: false, Error_Message: err }).end('');
        }
        else{
            res.status(200).json({ success: true, result: response }).end('');
        }
    });
}

exports.testDB_delete = function(req, res, next) {
    get_resData.deleteMany({}, function(err, response){
        const result = {
            "response": response,
            "message": "Data Deleted"
        }
        if(err){
            res.json({ success: false, Error_Message: err }).end('');
        }
        else{
            res.status(200).json({ success: true, result: result }).end('');
        }
    });
}

// function loop_execution() {
//     const args = {
//         url: `${AUTH_API}/api/v1.0/login`,
//         headers: {
//             "Content-Type": "application/json",
//             "Authorization": "Basic YWRtaW46YWRtaW4="
//         }
//     };
//     request.post(args, function (error, response, data) {
//         if (!error && response.statusCode === 200) {
//             data = JSON.parse(data);
//             const token = data.token_type + " " + data.access_token;
//             console.log("Get Token Successfully");
//             get_resData.find({}, function(err, response){
//                 if(err){
//                     return err;
//                 }else if(response.length === 0) {
//                     console.log("No data");
//                 } else {
//                     for (const responseOne of response) {
//                         const processInstanceId = responseOne._id;
//                         const startedAfter = responseOne.startedAfter;
//                         const finalResponse = [];
//                         const args = {
//                             url: `${CORE_API}/api/v1.0/workflow/history/process-instances/get`,
//                             body:{
//                                 "finished": true,
//                                 "startedAfter": startedAfter,
//                                 "processDefinitionName": "zm_downloadImage"
//                             },
//                             json:true,
//                             headers: {
//                                 "Authorization": token,
//                             }
//                         };
//                         // console.log(startedAfter);
//                         // console.log(processInstanceId);
//                         request.post(args, function (error, response, data){
//                             if (!error && response.statusCode === 200) {
//                                 let id = "";
//                                 for (let oneData of data) {
//                                     if (oneData.state === "COMPLETED" && oneData.id === processInstanceId) {
//                                         console.log("Find ID -> " + oneData.id);
//                                         id = oneData.id;
//                                         const args = {
//                                             url: `${CORE_API}/api/v1.0/workflow/history/details?processInstanceId=${id}&variableUpdates=true&deserializeValues=false`,
//                                             headers: {
//                                                 "Authorization": token,
//                                             }
//                                         };
//                                         request.get(args, function (error, response, data) {
//                                             if (!error && response.statusCode === 200) {
//                                                 data = JSON.parse(data);
//                                                 for (let oneData of data) {
//                                                     if (oneData.variableName === "full_response") {
//                                                         finalResponse.push(JSON.parse(oneData.value));
//                                                     }
//                                                 }

//                                                 const preCheckWhereStr  = {"_id": finalResponse[1].body.deviceName};
//                                                 const preCheckupdateStr  = {$set:{"pre_check_status": "true", "pre_check_log": JSON.stringify(finalResponse[1].body)}};
//                                                 osupgrade_info.updateOne(preCheckWhereStr, preCheckupdateStr,function (err) {
//                                                     if (err) {console.log(err);}
//                                                 });

//                                                 const imageWhereStr  = {"_id": finalResponse[6].body.deviceName};
//                                                 const imageCheckupdateStr  = {$set:{"image_transfer_status" : "Downloaded", "upgrade_status":"Success"}};
//                                                 osupgrade_info.updateOne(imageWhereStr, imageCheckupdateStr,function (err) {
//                                                     if (err) {console.log(err);}
//                                                 });

//                                                 const postCheckWhereStr  = {"_id": finalResponse[13].body.deviceName};
//                                                 const postCheckupdateStr  = {$set:{"post_check_status": "true", "post_check_log": JSON.stringify(finalResponse[13].body)}};
//                                                 osupgrade_info.updateOne(postCheckWhereStr, postCheckupdateStr,function (err) {
//                                                     if (err) {console.log(err);}
//                                                 });

//                                                 const diffWhereStr  = {"_id": finalResponse[1].body.deviceName};
//                                                 const diffupdateStr  = {$set:{"diff_log": JSON.stringify(finalResponse[15].body)}};
//                                                 osupgrade_info.updateOne(diffWhereStr, diffupdateStr,function (err) {
//                                                     if (err) {console.log(err);}
//                                                 });

//                                                 get_resData.deleteOne({"_id": id},function (err) {
//                                                     if (err) {console.log(err);}
//                                                 })
//                                             } else {
//                                                 const err_message = {
//                                                     "status_code": response.statusCode,
//                                                     "body": JSON.parse(response.body)
//                                                 };
//                                                 console.log("Cannot get full-response data: " + JSON.stringify(err_message));
//                                                 return err_message;
//                                             }
//                                         });
//                                     } else {
//                                         console.log("No matching data, searching...");
//                                     }
//                                 }
//                             } else {
//                                 const err_message = {
//                                     "status_code": response.statusCode,
//                                     "body": JSON.parse(response.body)
//                                 };
//                                 console.log("Cannot get completed data: " + JSON.stringify(err_message));
//                                 return err_message;
//                             }
//                         });
//                     }
//                 }
//             });
//         }
//     });
// }

function loop_execution() {
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
            const token = data.token_type + " " + data.access_token;
            console.log("Get Token Successfully");
            get_resData.find({}, function(err, response){
                if(err){
                    return err;
                }else if(response.length === 0) {
                    console.log("No data");
                } else {
                    for (const responseOne of response) {
                        const processInstanceId = responseOne._id;
                        const startedAfter = responseOne.startedAfter;
                        const cve_id = responseOne.cve_id;
                        const deviceName = responseOne.deviceName;
                        const args = {
                            url: `${CORE_API}/api/v1.0/workflow/history/process-instances/get`,
                            body:{
                                "finished": true,
                                "startedAfter": startedAfter,
                                "processDefinitionName": "zm_downloadImage"
                            },
                            json:true,
                            headers: {
                                "Authorization": token,
                            }
                        };
                        request.post(args, function (error, response, data){
                            if (!error && response.statusCode === 200) {
                                let id = "";
                                for (let oneData of data) {
                                    if (oneData.state === "COMPLETED" && oneData.id === processInstanceId) {
                                        console.log("Find ID -> " + oneData.id);
                                        id = oneData.id;
                                        const args = {
                                            url: `${CORE_API}/api/v1.0/workflow/history/details?processInstanceId=${id}&variableUpdates=true&deserializeValues=false`,
                                            headers: {
                                                "Authorization": token,
                                            }
                                        };
                                        request.get(args, function (error, response, data) {
                                            if (!error && response.statusCode === 200) {
                                                data = JSON.parse(data);
                                                for (let oneData of data) {
                                                    if (oneData.variableName === "full_response") {
                                                        if (oneData.activityName === "Execute Pre-check") {
                                                            const preCheckWhereStr = {"_id": deviceName};
                                                            const preCheckupdateStr = {
                                                                $set: {
                                                                    "pre_check_status": "true",
                                                                    "pre_check_log": JSON.stringify(JSON.parse(oneData.value).body)
                                                                }
                                                            };
                                                            osupgrade_info.updateOne(preCheckWhereStr, preCheckupdateStr, function (err) {
                                                                if (err) {
                                                                    console.log(err);
                                                                }
                                                            });
                                                        }

                                                        if (oneData.activityName === "Execute Download Image") {
                                                            const imageWhereStr = {"_id": deviceName};
                                                            const imageCheckupdateStr = {
                                                                $set: {
                                                                    "image_transfer_status": "Downloaded",
                                                                    "upgrade_status": "Success"
                                                                }
                                                            }
                                                            osupgrade_info.updateOne(imageWhereStr, imageCheckupdateStr, function (err) {
                                                                if (err) {
                                                                    console.log(err);
                                                                }
                                                            });
                                                        }

                                                        if (oneData.activityName === "Execute Post-check") {
                                                            const postCheckWhereStr = {"_id": deviceName};
                                                            const postCheckupdateStr = {
                                                                $set: {
                                                                    "post_check_status": "true",
                                                                    "post_check_log": JSON.stringify(JSON.parse(oneData.value).body)
                                                                }
                                                            };
                                                            osupgrade_info.updateOne(postCheckWhereStr, postCheckupdateStr, function (err) {
                                                                if (err) {
                                                                    console.log(err);
                                                                }
                                                            });
                                                        }

                                                        if (oneData.activityName === "Create Pre/Post Diff Report") {
                                                            const diffWhereStr = {"_id": deviceName};
                                                            const diffupdateStr = {$set: {"diff_log": JSON.stringify(JSON.parse(oneData.value).body)}};
                                                            osupgrade_info.updateOne(diffWhereStr, diffupdateStr, function (err) {
                                                                if (err) {
                                                                    console.log(err);
                                                                }
                                                            });
                                                        }

                                                        get_resData.deleteOne({"_id": id},function (err) {
                                                            if (err) {console.log(err);}
                                                        });

                                                        cve_list.find({"cveid":cve_id}, {"submit_device_list":1, "device_list":1, "_id":0}, function (error, response) {
                                                            if (error) {
                                                                console.log(error);
                                                            } else {
                                                                let device_pool = [];
                                                                const submit_device_list = response[0].submit_device_list;
                                                                const device_list = response[0].device_list;

                                                                let i = submit_device_list.indexOf(deviceName);
                                                                if (i !== -1){
                                                                    submit_device_list.splice(i, 1)
                                                                }

                                                                for (const list of device_list) {
                                                                    device_pool.push(list.device);
                                                                }
                                                                let j = device_pool.indexOf(deviceName);
                                                                if (j !== -1){
                                                                    device_list.splice(j, 1)
                                                                }

                                                                cve_list.updateOne({"cveid":cve_id}, {$set:{"device_list":device_list, "submit_device_list":submit_device_list}}, function (error) {
                                                                    if (error){
                                                                        console.log("update cve list error: " + JSON.stringify(error));
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                }
                                            } else {
                                                const err_message = {
                                                    "status_code": response.statusCode,
                                                    "body": JSON.parse(response.body)
                                                };
                                                console.log("Cannot get full-response data: " + JSON.stringify(err_message));
                                                return err_message;
                                            }
                                        });
                                    } else {
                                        console.log("No matching data, searching...");
                                    }
                                }
                            } else {
                                const err_message = {
                                    "status_code": response.statusCode,
                                    "body": JSON.parse(response.body)
                                };
                                console.log("Cannot get completed data: " + JSON.stringify(err_message));
                                return err_message;
                            }
                        });
                    }
                }
            });
        }
    });
}
setInterval(loop_execution, 300000);

exports.addition_check = function(req, res, next){
    let resultALL = [];
    let errorALL = [];
    const nsoInstance = req.body.nsoInstance;
    const deviceList = req.body.deviceList;
    const command = req.body.command;
    for (const device of deviceList){
        const args = {
            url: `${CORE_API}/api/v1.0/template-manager/execute?nsoInstance=${nsoInstance}`,
            form: {
                "deviceName": device,
                "templateId": "SCB_additional_check_template",
                "commandList": [
                    {
                        "command": command,
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
                const resultOne = {
                    "deviceName":device,
                    "response":data.commands
                };
                resultALL.push(resultOne);
                if (errorALL.length + resultALL.length === deviceList.length){
                    res.status(200).json({success: true, result: resultALL});
                }
            } else {
                const err_message = {
                    "status_code": response.statusCode,
                    "body": JSON.parse(response.body)
                };
                errorALL.push(err_message);
                res.json({success: false, result: errorALL});
            }
        });
    }
}

exports.schedule_image_transfer = function (req, res) {
    let messageALL = [];
    let resultALL = [];
    const protocols = req.body.protocols;
    const fileName = req.body.fileName;
    const targetLocation = req.body.targetLocation;
    const date = req.body.scb_date;
    const time = req.body.scb_time;
    const schedule = req.body.scb_schedule;
    const deviceList = req.body.deviceList;
    // const ID = "5fbe9921e070ff436094797e";
    // const deviceName = "9k";
    for (const deviceName of deviceList) {
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
                    messageALL.push("get_token                        success");
                    callback(null, authToken);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_token                        failure");
                    callback(null, err_message);
                }
            });
        }

        let create_dynamic_template = function (authToken, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/template-manager/process-template/${DYNAMIC_TEMPLATE_ID}`,
                form: {
                    "_id": DYNAMIC_TEMPLATE_ID,
                    "name": "dynamic_transform_template",
                    "passExpr": "",
                    "description": "dynamic transform template for SCB",
                    "commands": [
                        {
                            "command": "copy " + protocols + "://anonymous@10.124.196.148/" + fileName + " " + targetLocation + ":" + fileName + " vrf management",
                            "isConfigMode": false,
                            "goToStepOnPass": "",
                            "goToStepOnFail": "",
                            "passExpr": "",
                            "rules": [
                                {
                                    "op": "Contains",
                                    "opvariable": "",
                                    "desc": "",
                                    "rule": "complete"
                                }
                            ]
                        }
                    ]
                },
                headers: {
                    "Authorization": authToken,
                }
            };
            request.put(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    messageALL.push("create_dynamic_template          success");
                    callback(null, authToken);
                } else {
                    const err_message = {
                        "error_stage": "create_dynamic_template",
                        "deviceName": deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("create_dynamic_template          failure");
                    callback(null, err_message);
                }
            })
        }

        let submit_workflow = function (authToken, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/process-definition/${DOWNLOAD_IMAGE_WORKFLOW_ID}/submit-form`,
                headers: {
                    "Authorization": authToken,
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    const dataPackage = {
                        authToken: authToken,
                        processInstanceId: data.id
                    }
                    messageALL.push("submit_workflow                  success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "submit_workflow",
                        "deviceName": deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("submit_workflow                  failure");
                    callback(err_message, null);
                }
            });
        }

        let get_task_ID = function (dataPackage, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/tasks`,
                headers: {
                    "Authorization": dataPackage.authToken
                }
            };
            request.get(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    for(const dataOne of data){
                        if(dataOne.processInstanceId === dataPackage.processInstanceId){
                            dataPackage["id"] = dataOne.id;
                        }
                    }
                    messageALL.push("get_task_ID                      success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "get_task_ID",
                        "deviceName": deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_task_ID                      failure");
                    callback(err_message, null);
                }
            });
        }

        let submit_task = function (dataPackage, callback) {
            console.log(dataPackage);
            let met_value = {
                "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": deviceName}],
                "nedTemplatesJson": [{
                    "platformName": "cisco-nx-cli-5.15",
                    "templateMap": {
                        "analyticsTmpl": null,
                        "dynaTmpl": "dynamic_transform_template",
                        "checkImage": "SCB_CheckImageTransfer"
                    }
                }],
                "abortOnFailure": null,
                "batchSize": null,
                "date": date,
                "time": time,
                "schedule": schedule,
                "scheduleType": false
            };
            met_value = JSON.stringify(met_value);
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/task/${dataPackage.id}/complete`,
                form: {
                    "variables": {
                        "formData": {
                            "value": met_value
                        }
                    }
                },
                headers: {
                    "Authorization": dataPackage.authToken,
                },
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    const processInstanceId = dataPackage.processInstanceId;
                    if (schedule === "now") {
                        const whereStr = {"_id": deviceName};
                        const updateStr = {"$set": {"image_transfer_status": "In-progress",}};
                        osupgrade_info.updateOne(whereStr, updateStr, function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                    messageALL.push("submit_task                      success");
                    callback(null, processInstanceId)
                } else {
                    const err_message = {
                        "error_stage": "submit_task",
                        "deviceName": deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    console.log(err_message);
                    messageALL.push("submit_task                      failure");
                    callback(null, err_message);
                }
            });
        }

        async.waterfall(
            [
                get_token,
                create_dynamic_template,
                submit_workflow,
                get_task_ID,
                submit_task
            ], function (err, data) {
                console.log("waterfall:");
                console.log(data);
                if (err) {
                    console.log(err);
                    messageALL.push("schedule_image_transfer          failure");
                    resultALL.push({success: false, device:deviceName, error_message: err});
                } else {
                    messageALL.push("schedule_image_transfer          success");
                    resultALL.push({success: true, device:deviceName, result: messageALL});
                }
                if (resultALL.length === deviceList.length){
                    res.status(200).json({success: true, result: resultALL}).end('');
                }
            })
    }
}

exports.get_diff_data = function(req, res, next) {
    let resultAll = [];
    const deviceList = req.body.deviceList;
    for (const device of deviceList) {
        const whereStr  = {"_id": device};
        const conditionStr  = {_id: 1, diff_log: 1};
        osupgrade_info.find(whereStr, conditionStr, function(err,response){
            if(err){
                resultAll.push({success: false, result: err});
            }
            else{
                try {
                    console.log(response);
                    const diff_log = JSON.parse(response[0].diff_log);
                    const result = {
                        "_id": response[0]._id,
                        "diff_log": diff_log
                    }
                    resultAll.push({success: true, result: result});
                } catch(e) {
                    const result = {
                        "_id": "Device " + device + " name does not exit!",
                        "diff_log": null
                    }
                    resultAll.push({success: false, result: result});
                }
                if (resultAll.length === deviceList.length){
                    res.status(200).json({success: true, result: resultAll}).end('');
                }
            }
        });
    }
}

exports.post_config_dry_run = function(req, res, next) {
    const device_if_list = [];
    const deviceList = req.body.deviceList;
    for (let device of deviceList) {
        console.log(device);
        device_if_list.push({
            "device-name": device,
            "interface-type": "GigabitEthernet",
            "interface": "1/1",
            "description": "test interface"
        });
    }
    const args = {
        url: `${NSO_API}/restconf/ds/ietf-datastores:running/vlan:vlan?dry-run=native`,
        body: `{
        "vlan:vlan": [
                {
                    "name": "1234",
                    "vlan-id": 300,
                    "device-if": ${JSON.stringify(device_if_list)}
                }
            ]
        }`,
        headers: {
            "Accept": "application/yang-data+json",
            "Authorization": "Basic cm9vdDphZG1pbg==",
            "Cache-Control": "no-cache",
            "Content-Type": "application/yang-data+json"
        }
    };
    console.log(args.body);
    request.patch(args, function(error, response, data) {
        if (!error && response.statusCode === 200) {
            res.json({ success: true, result: JSON.parse(data) }).end('');
        } else if (!error && response.statusCode === 204) {
            res.json({ success: true, result: data }).end('');
        } else {
            res.json({ success: false, error_message: JSON.stringify(data)}).end('');
        }
    })
}

exports.get_config = function(req, res, next) {
    let resultAll = [];
    const deviceList = req.body.deviceList;
    for (let device of deviceList) {
        const args = {
            // url: `${NSO_API}/restconf/ds/ietf-datastores:running/vlan:vlan=1234/device-if`,
            url: `${NSO_API}/restconf/operations/Failover/display`,
            // url: `http://10.124.44.46:8080/restconf/ds/ietf-datastores:running/vlan:vlan=test2`,
            body:{"input":{"device":device}},
            json:true,
            headers: {
                "Accept": "application/yang-data+json",
                "Authorization": "Basic cm9vdDphZG1pbg==",
                "Cache-Control": "no-cache",
                "Content-Type": "application/yang-data+json"
            }
        };
        request.post(args, function(error, response, data) {
            if (!error && response.statusCode === 200) {
                // data = JSON.parse(data);
                console.log(data);
                // for (const dataOne of data["vlan:device-if"]){
                //     if(device === dataOne["device-name"]){
                //         // console.log(dataOne);
                //         resultAll.push(dataOne);
                //     }
                // }
                resultAll.push(data);
                if (resultAll.length === deviceList.length) {
                    res.json({ success: true, result: resultAll }).end('');
                }
            } else {
                const err_message = {
                    "status_code": response.statusCode,
                    "body": JSON.parse(response.body)
                };
                res.json({ success: false, Error_Message: err_message }).end('');
            }
        })
    }
}

// exports.validate_device = function(req, res, next) {
//     let resultALL = [];
//     const nsoInstance = req.body.nsoInstance;
//     const deviceList = req.body.deviceList;
//     for (const device of deviceList) {
//         let get_token = function (callback) {
//             const args = {
//                 url: `${AUTH_API}/api/v1.0/login`,
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": "Basic YWRtaW46YWRtaW4="
//                 }
//             };
//             request.post(args, function (error, response, data) {
//                 if (!error && response.statusCode === 200) {
//                     data = JSON.parse(data);
//                     const authToken = data.token_type + " " + data.access_token;
//                     const dataPkg = {
//                         authToken: authToken
//                     };
//                     callback(null, dataPkg);
//                 } else {
//                     const err_message = {
//                         "error_stage": "get_token",
//                         "deviceName": dataOne.deviceName,
//                         "status_code": response.statusCode,
//                         "body": JSON.parse(response.body)
//                     };
//                     callback(null, err_message);
//                 }
//             });
//         }

//         let connect_check = function (dataPkg, callback) {
//             // trace_logs_start(device, "connect check");
//             const args = {
//                 url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/connect`,
//                 headers: {
//                     "Authorization": "Basic cm9vdDphZG1pbg==",
//                     "Accept": "application/yang-data+json",
//                     "Cache-Control": "no-cache",
//                     "Content-Type": "application/yang-data+json"
//                 }
//             };
//             request.post(args, function (error, response, data) {
//                 if (!error && response.statusCode === 200) {
//                     data = JSON.parse(data);
//                     dataPkg["device_connection_status"] = data["tailf-ncs:output"];
//                     callback(null, dataPkg);
//                 } else {
//                     const err_message = {
//                         "error_stage": "connect_check",
//                         "deviceName": device,
//                         "body": JSON.parse(response.body)
//                     };
//                     callback(null, err_message);
//                 }
//             })
//             // trace_logs_end(device, "connect check");
//         }

//         let validate_check = function (dataPkg, callback) {
//             const args = {
//                 url: `${CORE_API}/api/v1.0/template-manager/execute?nsoInstance=${nsoInstance}`,
//                 form: {
//                     "deviceName": device,
//                     "templateId": "pre-check",
//                     "commandList": [
//                         {
//                             "command": "show environment power",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         },
//                         {
//                             "command": "show environment fan detail",
//                             "isConfigMode": false,
//                             "goToStepOnPass": "",
//                             "goToStepOnFail": "",
//                             "passExpr": "",
//                             "rules": []
//                         }
//                     ]
//                 },
//                 headers: {
//                     "Authorization": dataPkg.authToken,
//                 },
//             };
//             request.post(args, function (error, response, data) {
//                 if (!error && response.statusCode === 200) {
//                     data = JSON.parse(data);
//                     delete dataPkg["authToken"];
//                     dataPkg["validate_check"] = data;
//                     callback(null, dataPkg);
//                 } else {
//                     const err_message = {
//                         "error_stage": "validate_check",
//                         "deviceName": device,
//                         "status_code": response.statusCode,
//                         "body": JSON.parse(response.body)
//                     };
//                     callback(null, err_message);
//                 }
//             });
//         }

//         let change_data_style = function (dataPkg, callback) {
//             const command = {
//                 "executedCmd": "device connection status",
//                 "command": "device connection status",
//                 "cmdIndex": 0,
//                 "overAllCmdResult": true,
//                 "cmdOutPut": `result: ${dataPkg["device_connection_status"]["result"]} \r\nconnection information: ${dataPkg["device_connection_status"]["info"]}`,
//             }
//             const validate_check = dataPkg["validate_check"];
//             validate_check["commands"].unshift(command);
//             callback(null, validate_check);
//         }

//         async.waterfall(
//             [
//                 get_token,
//                 connect_check,
//                 validate_check,
//                 change_data_style,
//             ], function (err, data) {
//                 let results = "";
//                 for (const command of data.commands){
//                     const result = "<b>" + command.executedCmd.toUpperCase()+ "</b>" + "<br>" + command.cmdOutPut.replace(/\r\n/g,"<br>") + "<br>";
//                     results = results + result;
//                 }
//                 if (err) {
//                     const email_msg = {
//                         "subject": "Security Patching Validate Device failure",
//                         "html": `Task: Validate Device <br>Task Status: Failure<br>Time of Execution:${new Date().Format("yyyy-MM-dd hh:mm:ss")}<br>Device(s):${device}<br>Output:<br>${results}`
//                     }
//                     send_email(email_msg);
//                     resultALL.push(err);
//                 } else {
//                     const email_msg = {
//                         "subject": "Security Patching Validate Device success",
//                         "html": `Task: Validate Device <br>Task Status: Success<br>Time of Execution:${new Date().Format("yyyy-MM-dd hh:mm:ss")}<br>Device(s):${device}<br>Output:<br>${results}`
//                     }
//                     send_email(email_msg);
//                     resultALL.push(data);
//                 }
//                 if (resultALL.length === deviceList.length) {
//                     res.status(200).json({success: true, result: resultALL}).end('');
//                 }
//             })
//     }
// }
exports.validate_device = function(req, res, next) {
    let resultALL = [];
    let status = false;
    const nsoInstance = req.body.nsoInstance;
    const deviceList = req.body.deviceList;
    for (const device of deviceList) {
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
                    const dataPkg = {
                        authToken: authToken
                    };
                    callback(null, dataPkg);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    callback(null, err_message);
                }
            });
        }

        let connect_check = function (dataPkg, callback) {
            // trace_logs_start(device, "connect check");
            const args = {
                url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/connect`,
                headers: {
                    "Authorization": "Basic cm9vdDphZG1pbg==",
                    "Accept": "application/yang-data+json",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/yang-data+json"
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    if (data.indexOf("true") !== -1) {
                        status = true;
                    }
                    data = JSON.parse(data);
                    dataPkg["device_connection_status"] = data["tailf-ncs:output"];
                    callback(null, dataPkg);
                } else {
                    const err_message = {
                        "error_stage": "connect_check",
                        "deviceName": device,
                        "body": JSON.parse(response.body)
                    };
                    callback(null, err_message);
                }
            })
        }

        let validate_check = function (dataPkg, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/template-manager/execute?nsoInstance=${nsoInstance}`,
                form: {
                    "deviceName": device,
                    "templateId": "pre-check",
                    "commandList": [
                        {
                            "command": "show environment power",
                            "isConfigMode": false,
                            "goToStepOnPass": "",
                            "goToStepOnFail": "",
                            "passExpr": "",
                            "rules": [
                                {
                                    "op": "Contains",
                                    "opvariable": "",
                                    "desc": "",
                                    "rule": "Power"
                                }
                            ]
                        },
                        {
                            "command": "show environment fan detail",
                            "isConfigMode": false,
                            "goToStepOnPass": "",
                            "goToStepOnFail": "",
                            "passExpr": "",
                            "rules": [
                                {
                                    "op": "Contains",
                                    "opvariable": "",
                                    "desc": "",
                                    "rule": "Fan"
                                }
                            ]
                        }
                    ]
                },
                headers: {
                    "Authorization": dataPkg.authToken,
                },
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    delete dataPkg["authToken"];
                    dataPkg["validate_check"] = data;
                    callback(null, dataPkg);
                } else {
                    const err_message = {
                        "error_stage": "validate_check",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    callback(null, err_message);
                }
            });
        }

        let change_data_style = function (dataPkg, callback) {
            const command = {
                "executedCmd": "device connection status",
                "command": "device connection status",
                "cmdIndex": 0,
                "overAllCmdResult": true,
                "cmdOutPut": `\r\nresult: ${dataPkg["device_connection_status"]["result"]} \r\nconnection information: ${dataPkg["device_connection_status"]["info"]}`,
                "evaluatedRules":[{"result": status}]
            }
            const validate_check = dataPkg["validate_check"];
            validate_check["commands"].unshift(command);
            callback(null, validate_check);
        }

        async.waterfall(
            [
                get_token,
                connect_check,
                validate_check,
                change_data_style,
            ], function (err, data) {
                let results = "";
                for (const command of data.commands){
                    const result = "<b>" + command.executedCmd.toUpperCase()+ "</b>" + "<br>" + command.cmdOutPut.replace(/\r\n/g,"<br>") + "<br>";
                    results = results + result;
                }
                if (err) {
                    const email_msg = {
                        "subject": "Security Patching Validate Device failure",
                        "html": `Task: Validate Device <br>Task Status: Failure<br>Time of Execution:${new Date().Format("yyyy-MM-dd hh:mm:ss")}<br>Device(s):${device}<br>Output:<br>${results}`
                    }
                    send_email(email_msg);
                    resultALL.push(err);
                } else {
                    const email_msg = {
                        "subject": "Security Patching Validate Device success",
                        "html": `Task: Validate Device <br>Task Status: Success<br>Time of Execution:${new Date().Format("yyyy-MM-dd hh:mm:ss")}<br>Device(s):${device}<br>Output:<br>${results}`
                    }
                    send_email(email_msg);
                    resultALL.push(data);

                    const whereStr = {"_id": device};
                    const updateStr = {"$set": {"validate_device_log":JSON.stringify({success: true, result: [data]})}};
                    console.log(whereStr);
                    console.log(updateStr);
                    osupgrade_info.updateOne(whereStr, updateStr, function (err, response) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(response);
                        }
                    });
                }
                if (resultALL.length === deviceList.length) {
                    res.status(200).json({success: true, result: resultALL}).end('');
                }
            })
    }
}

exports.upgrade_workflow = function (req, res) {
    let resultALL = [];
    const deviceList = req.body.deviceList;

    for (const device of deviceList) {
        let messageALL = [];
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
                    messageALL.push("get_token               success");
                    callback(null, authToken);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_token               failure");
                    callback(err_message, null);
                }
            });
        }

        let submit_workflow = function (authToken, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/process-definition/${OSUPGRADE_WORKFLOW_ID}/submit-form`,
                headers: {
                    "Authorization": authToken,
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    const dataPackage = {
                        authToken: authToken,
                        processInstanceId: data.id
                    }
                    messageALL.push("submit_workflow         success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "submit_workflow",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("submit_workflow         failure");
                    callback(err_message, null);
                }
            });
        }

        let get_task_ID = function (dataPackage, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/tasks`,
                headers: {
                    "Authorization": dataPackage.authToken
                }
            };
            request.get(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    for(const dataOne of data){
                        if(dataOne.processInstanceId === dataPackage.processInstanceId){
                            dataPackage["id"] = dataOne.id;
                        }
                    }
                    messageALL.push("get_task_ID             success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "get_task_ID",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_task_ID             failure");
                    callback(err_message, null);
                }
            });
        }

        let submit_task = function (dataPackage, callback) {
            console.log(dataPackage);
            let met_value = {
                "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": device}],
                "nedTemplatesJson": [{
                    "platformName": "cisco-nx-cli-5.15",
                    "templateMap": {
                        "analyticsTmpl": null
                    }
                }],
                "abortOnFailure": null,
                "batchSize": null,
                "date": "2020-12-01",
                "time": "05:15",
                "schedule": "now",
                "scheduleType": false
            };
            met_value = JSON.stringify(met_value);
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/task/${dataPackage.id}/complete`,
                form: {
                    "variables": {
                        "formData": {
                            "value": met_value
                        }
                    }
                },
                headers: {
                    "Authorization": dataPackage.authToken,
                },
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    const processInstanceId = dataPackage.processInstanceId
                    messageALL.push("submit_task             success");
                    callback(null, processInstanceId)
                } else {
                    const err_message = {
                        "error_stage": "submit_task",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    console.log(err_message);
                    messageALL.push("submit_task             failure");
                    callback(null, err_message);
                }
            });
        }

        async.waterfall(
            [
                get_token,
                submit_workflow,
                get_task_ID,
                submit_task
            ], function (err, data) {
                if (err) {
                    messageALL.push("upgrade_workflow            failure");
                    resultALL.push({success: false, error_message: err});
                } else {
                    messageALL.push("upgrade_workflow            success");
                    resultALL.push({success: true, result: messageALL});
                }
                if (resultALL.length === deviceList.length){
                    res.status(200).json({success: true, result: resultALL}).end('');
                }
            })
    }
}

exports.reschedule_workflow = function(req, res) {
    let resultALL = [];
    const new_data = req.body;
    for (const dataOne of new_data) {
        let messageALL = [];
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
                    const dataPkg = {
                        authToken: authToken
                    };
                    messageALL.push("get_token                       success");
                    callback(null, dataPkg);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_token                       failure");
                    callback(err_message, null);
                }
            });
        }

        let get_history_data = function (dataPkg, callback) {
            // console.log("get_history_data --->" + JSON.stringify(dataPkg));
            const whereStr = {"_id": dataOne.deviceName};
            const conditionStr = {history: 1};
            osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                if (err) {
                    const err_message = {
                        "error_stage": "get_history_data",
                        "deviceName": dataOne.deviceName,
                        "body": err
                    };
                    messageALL.push("get_history_data                failure");
                    callback(err_message, null);
                } else {
                    const hisData = JSON.parse(response[0]._doc.history)
                    dataPkg["protocol"] = hisData.protocol;
                    dataPkg["file_name"] = hisData.file_name;
                    dataPkg["target_location"] = hisData.target_location;
                    dataPkg["start_time"] = hisData.start_time;
                    messageALL.push("get_history_data                success");
                    callback(null, dataPkg);
                }
            })
        }

        let get_response_table = function (dataPkg, callback) {
            // console.log("get_response_table --->" + JSON.stringify(dataPkg));
            const whereStr = {"deviceName": dataOne.deviceName};
            get_resData.find(whereStr, function (err, response) {
                if (err) {
                    messageALL.push("get_response_table              failure");
                    callback(err, null);
                } else {
                    if (response.length !== 0) {
                        for (const responseOne of response) {
                            if (responseOne.startTime === dataPkg.start_time) {
                                dataPkg["processInstanceId"] = responseOne._id;
                                messageALL.push("get_response_table              success");
                            }
                        }
                    }
                    callback(null, dataPkg);
                }
            });
        }

        let delete_task = function (dataPkg, callback) {
            // console.log("delete_task --->" + JSON.stringify(dataPkg));
            // console.log(!("processInstanceId" in dataPkg));
            if (!("processInstanceId" in dataPkg)) {
                callback(null, dataPkg);
            } else {
                const args = {
                    url: `${CORE_API}/api/v1.0/workflow/process-instance/${dataPkg.processInstanceId}`,
                    headers: {
                        "Authorization": dataPkg.authToken,
                    }
                };
                request.delete(args, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        messageALL.push("delete_task                     success");
                        callback(null, dataPkg);
                    } else if (response.statusCode === 404) {
                        messageALL.push("delete_task                     404    ");
                        callback(null, dataPkg);
                    } else {
                        const err_message = {
                            "error_stage": "delete_task",
                            "deviceName": dataOne.deviceName,
                            "status_code": response.statusCode,
                            "body": JSON.parse(response.body)
                        };
                        console.log(err_message);
                        messageALL.push("delete_task                     failure");
                        callback(err_message, null);
                    }
                });
            }
        }

        let delete_response_table = function (dataPkg, callback) {
            // console.log("delete_response_table --->" + JSON.stringify(dataPkg));
            if (!("processInstanceId" in dataPkg)) {
                callback(null, dataPkg);
            } else {
                get_resData.deleteOne({"_id": dataPkg.processInstanceId}, function (err) {
                    if (err) {
                        const err_message = {
                            "error_stage": "delete_response_table",
                            "deviceName": dataOne.deviceName,
                            "body": err
                        };
                        messageALL.push("delete_response_table           failure");
                        callback(err_message, null);
                    } else {
                        messageALL.push("delete_response_table           success");
                        callback(null, dataPkg);
                    }
                });
            }
        }

        let change_revert_status = function (dataPkg, callback) {
            const imageWhereStr = {"_id": dataOne.deviceName};
            const historyStr = {
                "protocol": dataPkg.protocol,
                "file_name": dataPkg.file_name,
                "target_location": dataPkg.target_location,
                "start_time": dataOne.new_date + " " + dataOne.new_time,
                "revert_status": "false"
            };
            const imageCheckupdateStr = {
                $set: {
                    "history": JSON.stringify(historyStr)
                }
            };
            osupgrade_info.updateOne(imageWhereStr, imageCheckupdateStr, function (err) {
                if (err) {
                    const err_message = {
                        "error_stage": "change_revert_status",
                        "deviceName": dataOne.deviceName,
                        "body": err
                    };
                    messageALL.push("change_revert_status            failure");
                    callback(err_message, null);
                } else {
                    messageALL.push("change_revert_status            success");
                    callback(null, dataPkg);
                }
            });
        }

        let new_create_dynamic_template = function (dataPkg, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/template-manager/process-template/${DYNAMIC_TEMPLATE_ID}`,
                form: {
                    "_id": DYNAMIC_TEMPLATE_ID,
                    "name": "dynamic_transform_template",
                    "passExpr": "",
                    "description": "dynamic transform template for SCB",
                    "commands": [
                        {
                            "command": "copy " + dataPkg.protocol + "://anonymous@10.124.196.148/" + dataPkg.file_name + " " + dataPkg.target_location + ":" + dataPkg.file_name + " vrf management",
                            "isConfigMode": false,
                            "goToStepOnPass": "",
                            "goToStepOnFail": "",
                            "passExpr": "",
                            "rules": [
                                {
                                    "op": "Contains",
                                    "opvariable": "",
                                    "desc": "",
                                    "rule": "complete"
                                }
                            ]
                        }
                    ]
                },
                headers: {
                    "Authorization": dataPkg.authToken,
                }
            };
            request.put(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    messageALL.push("new_create_dynamic_template     success");
                    callback(null, dataPkg);
                } else {
                    const err_message = {
                        "error_stage": "create_dynamic_template",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("new_create_dynamic_template     failure");
                    callback(err_message, null);
                }
            })
        }

        let new_submit_workflow = function (dataPkg, callback) {
            console.log(dataPkg);
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/process-definition/${MAIN_WORKFLOW_ID}/submit-form`,
                headers: {
                    "Authorization": dataPkg.authToken,
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    console.log(data)
                    const dataPackage = {
                        authToken: dataPkg.authToken,
                        processInstanceId: data.id
                    }
                    console.log("processInstanceId --->");
                    console.log(dataPackage.processInstanceId);
                    messageALL.push("submit_workflow                 success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "submit_workflow",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("submit_workflow                 failure");
                    callback(err_message, null);
                }
            });
        }

        let new_get_task_ID = function (dataPackage, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/tasks`,
                headers: {
                    "Authorization": dataPackage.authToken
                }
            };
            request.get(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    for(const dataOne of data){
                        if(dataOne.processInstanceId === dataPackage.processInstanceId){
                            dataPackage["id"] = dataOne.id;
                        }
                    }
                    console.log("id --->");
                    console.log(dataPackage.id);
                    messageALL.push("get_task_ID                     success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "get_task_ID",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_task_ID                     failure");
                    callback(err_message, null);
                }
            });
        }

        let new_submit_task = function (dataPackage, callback) {
            let met_value = {
                "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": dataOne.deviceName}],
                "nedTemplatesJson": [{
                    "platformName": "cisco-nx-cli-5.15",
                    "templateMap": {
                        "analyticsTmpl": "jushao_diff_test",
                        "checkImage": "SCB_CheckImageTransfer",
                        "dynaTmpl": "dynamic_transform_template",
                        "postCheck": "SCB_post_check_template",
                        "preCheck": "SCB_pre_check_template",
                    }
                }],
                "abortOnFailure": null,
                "batchSize": null,
                "date": dataOne.new_date,
                "time": dataOne.new_time,
                "schedule": "later",
                "scheduleType": false
            };
            met_value = JSON.stringify(met_value);
            const value = met_value.replace(/"/gi, '\"');
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/task/${dataPackage.id}/complete`,
                form: {
                    "variables": {
                        "formData": {
                            "value": value
                        }
                    }
                },
                headers: {
                    "Authorization": dataPackage.authToken,
                },
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    messageALL.push("submit_task                     success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "submit_task",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("submit_task                     failure");
                    callback(err_message, null);
                }
            });
        }

        let new_update_response_table = function (dataPkg, callback) {
            console.log(dataPkg);
            const insertData = {
                "_id": dataPkg.processInstanceId,
                "startedAfter": dataOne.new_date + "T" + dataOne.new_time + ":00.000+0000",
                "startTime": dataOne.new_date + " " + dataOne.new_time,
                "deviceName": dataOne.deviceName
            };
            get_resData.create(insertData, function (err) {
                if (err) {
                    const err_message = {
                        "error_stage": "new_update_response_table",
                        "deviceName": dataOne.deviceName,
                        "body": err
                    };
                    messageALL.push("new_update_response_table       failure");
                    callback(err_message, null);
                } else {
                    messageALL.push("new_update_response_table       success");
                    callback(null, dataPkg);
                }
            });
            osupgrade_info.updateOne({"_id": dataOne.deviceName}, {$set:
                    {"image_transfer_scheduled_time": dataOne.new_date + " " + dataOne.new_time + ":00",
                        "upgrade_time": dataOne.new_date + " " + dataOne.new_time + ":00",
                        "upgrade_status": "Scheduled",
                        "image_transfer_status": "Scheduled",
                        "pre_check_status": "false",
                        "pre_check_log":"",
                        "post_check_status": "false",
                        "post_check_log": ""
                    }}, function (error) {
                console.log(error);
            });
        }

        async.waterfall(
            [
                get_token,
                get_history_data,
                get_response_table,
                delete_task,
                delete_response_table,
                change_revert_status,
                new_create_dynamic_template,
                new_submit_workflow,
                new_get_task_ID,
                new_submit_task,
                new_update_response_table
            ], function (err, data) {
                if (err) {
                    messageALL.push("reschedule_workflow             failure");
                    resultALL.push({success: false, device:dataOne.deviceName, error_message: err});
                } else {
                    messageALL.push("reschedule_workflow             success");
                    resultALL.push({success: true, device:dataOne.deviceName, result: messageALL});
                }
                if (resultALL.length === new_data.length){
                    res.status(200).json({success: true, result: resultALL}).end('');
                }
            })
    }
}

exports.close_with_remarks = function(req, res, next) {
    let resultALL = [];
    const payloads = req.body;
    for (const payload of payloads) {
        let messageALL = [];

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
                    const dataPkg = {
                        authToken: authToken
                    };
                    messageALL.push("get_token                 success");
                    callback(null, dataPkg);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": payload.device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_token                 failure");
                    callback(err_message, null);
                }
            });
        }

        let get_history_data = function (dataPkg, callback) {
            const whereStr = {"_id": payload.device};
            const conditionStr = {history: 1};
            osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                if (err) {
                    const err_message = {
                        "error_stage": "get_history_data",
                        "deviceName": payload.device,
                        "body": err
                    };
                    messageALL.push("get_history_data          failure");
                    callback(err_message, null);
                } else {
                    const hisData = JSON.parse(response[0]._doc.history)
                    dataPkg["protocol"] = hisData.protocol;
                    dataPkg["file_name"] = hisData.file_name;
                    dataPkg["target_location"] = hisData.target_location;
                    dataPkg["start_time"] = hisData.start_time;
                    messageALL.push("get_history_data          success");
                    callback(null, dataPkg);
                }
            })
        }

        let get_response_table = function (dataPkg, callback) {
            const whereStr = {"deviceName": payload.device};
            get_resData.find(whereStr, function (err, response) {
                if (err) {
                    messageALL.push("get_response_table        failure");
                    callback(err, null);
                } else {
                    // console.log("success")
                    for (const responseOne of response) {
                        if (responseOne.startTime === dataPkg.start_time) {
                            dataPkg["processInstanceId"] = responseOne._id;
                            messageALL.push("get_response_table        success");
                            callback(null, dataPkg);
                        }
                    }
                }
            });
        }

        let delete_task = function (dataPkg, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/process-instance/${dataPkg.processInstanceId}`,
                headers: {
                    "Authorization": dataPkg.authToken,
                }
            };
            request.delete(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    messageALL.push("delete_task               success");
                    callback(null, dataPkg)
                } else if (!error && response.statusCode === 404) {
                    messageALL.push("delete_task               not exit");
                    callback(null, dataPkg)
                } else {
                    const err_message = {
                        "error_stage": "delete_task",
                        "deviceName": payload.device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("delete_task               failure");
                    callback(err_message, null);
                }
            });
        }

		let change_cve_status = function(dataPkg, callback) {
            console.log("change_cve_status --->" + JSON.stringify(dataPkg));
            const deviceName = payload.device;
            osupgrade_info.find({"_id":deviceName}, {"cve_id":1, "upgrade_status":1, "_id":1}, function (error, response) {
                const cve_id = response[0].cve_id;
                const upgrade_status = response[0].upgrade_status;
                cve_list.find({"cveid":cve_id}, {"submit_device_list":1, "device_list":1, "upgraded_device_list": 1, "_id":0}, function (error, response) {
                    if (error) {
                        console.log(error);
                    } else {
                        // let device_pool = [];
                        // const submit_device_list = response[0].submit_device_list;
                        const device_list = response[0].device_list;
                        let upgraded_device;

                        if (upgrade_status === "Success") {
                            for (const list of device_list) {
                                if (list.device === deviceName) {
                                    upgraded_device = list;
                                }
                            }

                            cve_list.updateOne({"cveid":cve_id}, {$addToSet:{"upgraded_device_list":upgraded_device}, $pull:{"device_list":upgraded_device, "submit_device_list":payload.device}}, function (error) {
                                if (error){
                                    messageALL.push("change_cve_status         failure");
                                    callback(error, null);
                                } else {
                                    messageALL.push("change_cve_status         success");
                                    callback(null, dataPkg);
                                }
                            });
                        } else {
                            cve_list.updateOne({"cveid":cve_id}, {$pull:{"submit_device_list":payload.device}}, function (error) {
                                if (error){
                                    messageALL.push("change_cve_status         failure");
                                    callback(error, null);
                                } else {
                                    messageALL.push("change_cve_status         success");
                                    callback(null, dataPkg);
                                }
                            });
                        }
                        // if (upgrade_status === "Success") {
                        //     for (const list of device_list) {
                        //         if (list.device === deviceName) {
                        //             upgraded_device_list.push(list);
                        //         }
                        //     }
                        // }
                        //
                        // let i = submit_device_list.indexOf(deviceName);
                        // if (i !== -1){
                        //     submit_device_list.splice(i, 1)
                        // }
                        //
                        // if (upgrade_status === "Success") {
                        //     for (const list of device_list) {
                        //         device_pool.push(list.device);
                        //     }
                        //     let j = device_pool.indexOf(deviceName);
                        //     if (j !== -1){
                        //         device_list.splice(j, 1)
                        //     }
                        // }
                    }
                });
            })
        }

        let delete_big_table = function(dataPkg, callback) {
            osupgrade_info.deleteOne({"_id": payload.device}, function(err, response){
                if(err){
                    messageALL.push("delete_big_table          failure");
                    callback(err, null);
                } else {
                    messageALL.push("delete_big_table          success");
                    callback(null, dataPkg);
                }
            });
        }

        let delete_small_table = function(dataPkg, callback) {
            get_resData.deleteOne({"deviceName": payload.device}, function(err, response){
                if(err){
                    messageALL.push("delete_small_table        failure");
                    callback(err, null);
                } else {
                    messageALL.push("delete_small_table        success");
                    callback(null, dataPkg);
                }
            });
        }

        async.waterfall([
            get_token,
            get_history_data,
            get_response_table,
            delete_task,
            change_cve_status,
            delete_big_table,
            delete_small_table],function(err,data){
            if (err) {
                messageALL.push("close_with_remarks        failure");
                resultALL.push({success: false, result_message: messageALL, error_message: err});
            } else {
                messageALL.push("close_with_remarks        success");
                resultALL.push({success: false, result_message: messageALL, data: data});
            }
            if (resultALL.length === payloads.length) {
                checkCevStatus();
                res.status(200).json({result: resultALL}).end('');
            }
        })
    }
}

exports.revert_workflow_revert = function(req, res, next) {
    let resultALL = [];
    let messageALL = [];
    const new_data = req.body;
    for (const dataOne of new_data) {
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
                    const dataPkg = {
                        authToken: authToken
                    };
                    messageALL.push("get_token               success");
                    callback(null, dataPkg);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    callback(err_message, null);
                }
            });
        }

        let get_history_data = function (dataPkg, callback) {
            // console.log("get_history_data --->" + JSON.stringify(dataPkg));
            const whereStr = {"_id": dataOne.deviceName};
            const conditionStr = {history: 1};
            osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                if (err) {
                    const err_message = {
                        "error_stage": "get_history_data",
                        "deviceName": dataOne.deviceName,
                        "body": err
                    };
                    messageALL.push("get_history_data        failure");
                    callback(err_message, null);
                } else {
                    const hisData = JSON.parse(response[0]._doc.history)
                    dataPkg["protocol"] = hisData.protocol;
                    dataPkg["file_name"] = hisData.file_name;
                    dataPkg["target_location"] = hisData.target_location;
                    dataPkg["start_time"] = hisData.start_time;
                    messageALL.push("get_history_data        success");
                    callback(null, dataPkg);
                }
            })
        }

        let get_response_table = function (dataPkg, callback) {
            // console.log("get_response_table --->" + JSON.stringify(dataPkg));
            const whereStr = {"deviceName": dataOne.deviceName};
            get_resData.find(whereStr, function (err, response) {
                if (err) {
                    messageALL.push("get_response_table        failure");
                    callback(err, null);
                } else {
                    // console.log("success")
                    for (const responseOne of response) {
                        // console.log(responseOne.startTime);
                        // console.log(dataPkg.start_time);
                        if (responseOne.startTime === dataPkg.start_time) {
                            dataPkg["processInstanceId"] = responseOne._id;
                            messageALL.push("get_response_table        success");
                            callback(null, dataPkg);
                        }
                    }
                }
            });
        }

        let delete_task = function (dataPkg, callback) {
            // console.log("delete_task --->" + JSON.stringify(dataPkg));
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/process-instance/${dataPkg.processInstanceId}`,
                headers: {
                    "Authorization": dataPkg.authToken,
                }
            };
            request.delete(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    messageALL.push("delete_task             success");
                    callback(null, dataPkg)
                } else {
                    const err_message = {
                        "error_stage": "delete_task",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    callback(err_message, null);
                }
            });
        }

        let delete_response_table = function (dataPkg, callback) {
            // console.log("delete_response_table --->" + JSON.stringify(dataPkg));
            get_resData.deleteOne({"_id": dataPkg.processInstanceId}, function (err) {
                if (err) {
                    const err_message = {
                        "error_stage": "delete_response_table",
                        "deviceName": dataOne.deviceName,
                        "body": err
                    };
                    messageALL.push("delete_response_table   failure");
                    callback(err_message, null);
                } else {
                    messageALL.push("delete_response_table   success");
                    callback(null, dataPkg);
                }
            });
        }

        let change_revert_status = function (dataPkg, callback) {
            // console.log("change_revert_status --->" + JSON.stringify(dataPkg));
            const imageWhereStr = {"_id": dataOne.deviceName};
            const historyStr = {
                "protocol": dataPkg.protocol,
                "file_name": dataPkg.file_name,
                "target_location": dataPkg.target_location,
                "start_time": dataPkg.start_time,
                "revert_status": "true"
            };
            const imageCheckupdateStr = {
                $set: {
                    "history": JSON.stringify(historyStr)
                }
            };
            osupgrade_info.updateOne(imageWhereStr, imageCheckupdateStr, function (err) {
                if (err) {
                    const err_message = {
                        "error_stage": "change_revert_status",
                        "deviceName": dataOne.deviceName,
                        "body": err
                    };
                    console.log(err_message);
                    messageALL.push("change_revert_status  failure");
                    messageALL.push("change_revert_status  err_message:" + err_message);
                    callback(err_message, null);
                } else {
                    messageALL.push("change_revert_status  success");
                    callback(null, dataPkg);
                }
            });
        }

    async.waterfall(
        [
            get_token,
            get_history_data,
            get_response_table,
            delete_task,
            delete_response_table,
            change_revert_status
        ], function (err, data) {
            if (err) {
                messageALL.push("revert_workflow_revert        failure");
                resultALL.push({success: false, device:dataOne.deviceName, error_message: err});
            } else {
                messageALL.push("revert_workflow_revert        success");
                resultALL.push({success: true, device:dataOne.deviceName, result: messageALL});
                if (resultALL.length === new_data.length){
                    res.status(200).json({success: true, result: resultALL}).end('');
                }
            }
        })
    }
}

exports.revert_workflow_unrevert = function(req, res, next) {
    let resultALL = [];
    let messageALL = [];
    const new_data = req.body;
    // const ID = "5fbe9921e070ff436094797e";
    for (const dataOne of new_data) {
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
                    const dataPkg = {
                        authToken: authToken
                    };
                    messageALL.push("get_token               success");
                    callback(null, dataPkg);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    callback(null, err_message);
                }
            });
        }

        let get_history_data = function (dataPkg, callback) {
            const whereStr = {"_id": dataOne.deviceName};
            const conditionStr = {history: 1};
            osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                if (err) {
                    const err_message = {
                        "error_stage": "get_history_data",
                        "deviceName": dataOne.deviceName,
                        "body": err
                    };
                    messageALL.push("get_history_data        failure");
                    callback(null, err_message);
                } else {
                    const hisData = JSON.parse(response[0]._doc.history)
                    dataPkg["protocol"] = hisData.protocol;
                    dataPkg["file_name"] = hisData.file_name;
                    dataPkg["target_location"] = hisData.target_location;
                    dataPkg["start_time"] = hisData.start_time;
                    messageALL.push("get_history_data        success");
                    callback(null, dataPkg);
                }
            })
        }

        let change_revert_status = function (dataPkg, callback) {
            const imageWhereStr = {"_id": dataOne.deviceName};
            const historyStr = {
                "protocol": dataPkg.protocol,
                "file_name": dataPkg.file_name,
                "target_location": dataPkg.target_location,
                "start_time": dataPkg.start_time,
                "revert_status": "false"
            };
            const imageCheckupdateStr = {
                $set: {
                    "history": JSON.stringify(historyStr)
                }
            };
            osupgrade_info.updateOne(imageWhereStr, imageCheckupdateStr, function (err) {
                if (err) {
                    const err_message = {
                        "error_stage": "change_revert_status",
                        "deviceName": dataOne.deviceName,
                        "body": err
                    };
                    console.log(err_message);
                    messageALL.push("change_revert_status  failure");
                    messageALL.push("change_revert_status  err_message:" + err_message);
                    callback(null, err_message);
                } else {
                    messageALL.push("change_revert_status  success");
                    callback(null, dataPkg);
                }
            });
        }

        let new_create_dynamic_template = function (dataPkg, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/template-manager/process-template/${DYNAMIC_TEMPLATE_ID}`,
                form: {
                    "_id": DYNAMIC_TEMPLATE_ID,
                    "name": "dynamic_transform_template",
                    "passExpr": "",
                    "description": "dynamic transform template for SCB",
                    "commands": [
                        {
                            "command": "copy " + dataPkg.protocol + "://anonymous@10.124.196.148/" + dataPkg.file_name + " " + dataPkg.target_location + ":" + dataPkg.file_name + " vrf management",
                            "isConfigMode": false,
                            "goToStepOnPass": "",
                            "goToStepOnFail": "",
                            "passExpr": "",
                            "rules": [
                                {
                                    "op": "Contains",
                                    "opvariable": "",
                                    "desc": "",
                                    "rule": "complete"
                                }
                            ]
                        }
                    ]
                },
                headers: {
                    "Authorization": dataPkg.authToken,
                }
            };
            request.put(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    messageALL.push("new_create_dynamic_template success");
                    callback(null, dataPkg);
                } else {
                    const err_message = {
                        "error_stage": "create_dynamic_template",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("new_create_dynamic_template failure");
                    callback(null, err_message);
                }
            })
        }

        let new_submit_workflow = function (dataPkg, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/process-definition/${WORKFLOW_ID}/submit-form`,
                headers: {
                    "Authorization": dataPkg.authToken,
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    messageALL.push("new_submit_workflow     success");
                    callback(null, dataPkg)
                } else {
                    const err_message = {
                        "error_stage": "submit_workflow",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("new_submit_workflow     failure");
                    callback(null, err_message);
                }
            });
        }

        let new_get_task_ID = function (dataPkg, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/tasks`,
                headers: {
                    "Authorization": dataPkg.authToken
                }
            };
            request.get(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    dataPkg["TASK_ID"] = data[data.length - 1].id;
                    dataPkg["processInstanceId"] = data[data.length - 1].processInstanceId;
                    messageALL.push("new_get_task_ID         success");
                    callback(null, dataPkg)
                } else {
                    const err_message = {
                        "error_stage": "get_task_ID",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("new_get_task_ID         failure");
                    callback(null, err_message);
                }
            });
        }

        let new_submit_task = function (dataPkg, callback) {
            const now_time = (dataPkg.start_time).split(" ");
            let met_value = {
                "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": dataOne.deviceName}],
                "nedTemplatesJson": [{
                    "platformName": "cisco-nx-cli-5.15",
                    "templateMap": {
                        "analyticsTmpl": "jushao_diff_test",
                        "dynaTmpl": "dynamic_transform_template",
                        "postCheck": "SCB_post_check_template",
                        "preCheck": "SCB_pre_check_template"
                    }
                }],
                "abortOnFailure": null,
                "batchSize": null,
                "date": now_time[0],
                "time": now_time[1],
                "schedule": "now",
                "scheduleType": false
            };
            met_value = JSON.stringify(met_value);
            const value = met_value.replace(/"/gi, '\"');
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/task/${dataPkg.TASK_ID}/complete`,
                form: {
                    "variables": {
                        "formData": {
                            "value": value
                        }
                    }
                },
                headers: {
                    "Authorization": dataPkg.authToken,
                },
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    messageALL.push("submit_task             success");
                    callback(null, dataPkg)
                } else {
                    const err_message = {
                        "error_stage": "submit_task",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    callback(null, err_message);
                }
            });
        }

        let new_update_response_table = function (dataPkg, callback) {
            console.log(dataPkg.start_time);
            const now_time = (dataPkg.start_time).split(" ");
			const new_date = new Date(new Date(now_time[0]).getTime() - 86400000).Format("yyyy-MM-dd");
            const insertData = {
                "_id": dataPkg.processInstanceId,
                // "startedAfter": now_time[0] + "T" + now_time[1] + ":00.000+0800",
                "startedAfter": new_date + "T22:00:00.000+0800",
                "startTime": dataPkg.start_time,
                "deviceName": dataOne.deviceName
            };
            get_resData.create(insertData, function (err) {
                if (err) {
                    const err_message = {
                        "error_stage": "new_update_response_table",
                        "deviceName": dataOne.deviceName,
                        "body": err
                    };
                    messageALL.push("new_update_response_table   failure");
                    callback(null, err_message);
                } else {

                    messageALL.push("new_update_response_table   success");
                    callback(null, dataPkg);
                }
            });
        }

        async.waterfall(
            [
                get_token,
                get_history_data,
                change_revert_status,
                new_create_dynamic_template,
                new_submit_workflow,
                new_get_task_ID,
                new_submit_task,
                new_update_response_table
            ], function (err, data) {
                if (err) {
                    messageALL.push("revert_workflow_unrevert        failure");
                    resultALL.push({success: false, device:dataOne.deviceName, error_message: err});
                } else {
                    messageALL.push("revert_workflow_unrevert        success");
                    resultALL.push({success: true, device:dataOne.deviceName, result: messageALL});
                    if (resultALL.length === new_data.length){
                        res.status(200).json({success: true, result: resultALL}).end('');
                    }
                }
            })
    }
}

exports.get_cvelist_data = function(req, res, next) {
    cve_list.find({},function(err,response){
        if(err){
            res.status(500).json({ success: false, Error_Message: err }).end('');
        }
        else{
            res.status(200).json({ success: true, result: response }).end('');
        }
    });
}

send_email = function (email_msg) {
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
                callback(null, authToken);
            } else {
                const err_message = {
                    "error_stage": "get_token",
                    "deviceName": dataOne.deviceName,
                    "status_code": response.statusCode,
                    "body": JSON.parse(response.body)
                };
                callback(null, err_message);
            }
        });
    }

    let send_email = function (authToken, callback) {
        const args = {
            url: `http://10.124.196.148:9100/api/v1/mail/send`,
            body: {
                "to": EMAIL_TO,
                "subject": email_msg.subject,
                "html": email_msg.html
            },
            json:true,
            headers: {
                "Authorization": authToken,
            },
        };
        request.post(args, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                callback(null, data);
            } else {
                callback(null, response);
            }
        })
    }

    async.waterfall([get_token, send_email], function (err, data) {
            if (err) {
                console.log("send_email error" + error);
                return err;
            } else {
                console.log("send_email data" + data);
                return data;
            }
        })
}

Date.prototype.Format = function (fmt) {
    const o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (const k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

exports.new_main_workflow = function (req, res, next) {
    let messageALL = [];
    let resultALL = [];
    const payloads = req.body;
    console.log(payloads)
    const MAIN_WORKFLOW_ID = "zm_downloadImage:8:af5cd183-3e30-11eb-90dd-0242ac1d0007";
    for (const payload of payloads) {
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
                    messageALL.push("get_token               success");
                    callback(null, authToken);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": payload.device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_token               failure");
                    callback(null, err_message);
                }
            });
        }

        let create_dynamic_template = function (authToken, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/template-manager/process-template/${DYNAMIC_TEMPLATE_ID}`,
                form: {
                    "_id": DYNAMIC_TEMPLATE_ID,
                    "name": "dynamic_transform_template",
                    "passExpr": "",
                    "description": "dynamic transform template for SCB",
                    "commands": [
                        {
                            "command": "copy " + payload.protocols + "://anonymous@10.124.196.148/" + payload.fileName + " " + payload.targetLocation + ":" + payload.fileName + " vrf management",
                            "isConfigMode": false,
                            "goToStepOnPass": "",
                            "goToStepOnFail": "",
                            "passExpr": "",
                            "rules": []
                        }
                    ]
                },
                headers: {
                    "Authorization": authToken,
                }
            };
            request.put(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    messageALL.push("create_dynamic_template success");
                    callback(null, authToken);
                } else {
                    const err_message = {
                        "error_stage": "create_dynamic_template",
                        "deviceName": payload.device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("create_dynamic_template failure");
                    callback(null, err_message);
                }
            })
        }

        let submit_workflow = function (authToken, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/process-definition/${MAIN_WORKFLOW_ID}/submit-form`,
                headers: {
                    "Authorization": authToken,
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    messageALL.push("submit_workflow         success");
                    callback(null, authToken)
                } else {
                    const err_message = {
                        "error_stage": "submit_workflow",
                        "deviceName": payload.device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("submit_workflow         failure");
                    callback(null, err_message);
                }
            });
        }

        let get_task_ID = function (authToken, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/tasks`,
                headers: {
                    "Authorization": authToken
                }
            };
            request.get(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    const TASK_ID = data[data.length - 1].id;
                    const processInstanceId = data[data.length - 1].processInstanceId;
                    const dataPackage = {
                        authToken: authToken,
                        TASK_ID: TASK_ID,
                        processInstanceId: processInstanceId
                    }
                    messageALL.push("get_task_ID             success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "get_task_ID",
                        "deviceName": payload.device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_task_ID             failure");
                    callback(null, err_message);
                }
            });
        }

        let submit_task = function (dataPackage, callback) {
            let met_value = {
                "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": payload.device}],
                "nedTemplatesJson": [{
                    "platformName": "cisco-nx-cli-5.15",
                    "templateMap": {
                        "analyticsTmpl": "jushao_diff_test",
                        "dynaTmpl": "dynamic_transform_template",
                        "postCheck": "SCB_post_check_template",
                        "preCheck": "SCB_pre_check_template"
                    }
                }],
                "abortOnFailure": null,
                "batchSize": null,
                "date": payload.scb_date,
                "time": payload.scb_time,
                "schedule": payload.scb_schedule,
                "scheduleType": false
            };
            met_value = JSON.stringify(met_value);
            const value = met_value.replace(/"/gi, '\"');
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/task/${dataPackage.TASK_ID}/complete`,
                form: {
                    "variables": {
                        "formData": {
                            "value": value
                        }
                    }
                },
                headers: {
                    "Authorization": dataPackage.authToken,
                },
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    const processInstanceId = dataPackage.processInstanceId
                    messageALL.push("submit_task             success");
                    callback(null, processInstanceId)
                } else {
                    const err_message = {
                        "error_stage": "submit_task",
                        "deviceName": payload.device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("submit_task             failure");
                    callback(null, err_message);
                }
            });
        }

        let insert_main_data = function (processInstanceId, callback) {
            const connected_device_list = [];
            const transfer_time = payload.scb_date + " " + payload.scb_time + ":00";
            const historyStr = {
                "protocol": payload.protocols,
                "file_name": payload.fileName,
                "target_location": payload.targetLocation,
                "start_time": payload.scb_date + " " + payload.scb_time,
                "revert_status": "false"
            };
            let n = 106;
            if (payload.connect_device.length !== 0) {
                for (const connDevice of payload.connect_device) {
                    n++;
                    connected_device_list.push({"device":connDevice,"host_name":connDevice,"ip_address":"10.124.196." + n.toString(),"role":"route"})
                }
            }
            console.log(connected_device_list);
            const insertStr = {
                "_id": payload.device,
                "currentOS_version":"V7.0.3.I7.3",
                "targetOS_version":"V7.0.3.I7.9",
                "mop":[
                    {"mop_name":"N9KUpgrade","vendor":"Cisco","device_type":"Nexus9000V","device_role":"Switch","source_version":"V7.0.3.I7.3.bin","target_version":"V7.0.3.I7.9.bin"}],
                "upgrade_tpye":"Single-stage",
                "host_name":"10.124.196.105",
                "region":"Malaysia",
                "upgrade_status":"In-process",
                "image_transfer_status": "Scheduled",
                "image_transfer_scheduled_time": transfer_time,
                "device_reachability_status":"Reachable",
                "pre_check_status":"false",
                "pre_check_log":"",
                "post_check_status":"false",
                "post_check_log":"",
                "diff_log":"",
                "connected_device": connected_device_list,
                "upgrade_time": transfer_time,
                "history": JSON.stringify(historyStr),
                "trace_logs_connect":"",
                "trace_logs_post":"",
                "trace_logs_pre":"",
                "trace_logs_upgrade":""
            };
            osupgrade_info.create(insertStr, function (err) {
                if (err) {
                    const err_message = {
                        "error_stage": "insert_main_data",
                        "deviceName": payload.device,
                        "body": err
                    };
                    messageALL.push("insert_main_data        failure",);
                    console.log(err_message);
                    console.log()
                    callback(null, err_message);
                } else {
                    messageALL.push("insert_main_data        success");
                    callback(null, processInstanceId);
                }
            });
        }

        let insert_response_table = function (processInstanceId, callback) {
            const date = new Date(new Date(payload.scb_date).getTime() - 86400000).Format("yyyy-MM-dd");
            const insertData = {
                "_id": processInstanceId,
                // "startedAfter": payload.scb_date + "T" + payload.scb_time + ":00.000+0000",
                "startedAfter": date + "T22:00:00.000+0800",
                "startTime": payload.scb_date + " " + payload.scb_time,
                "deviceName": payload.device
            };
            console.log(insertData)
            get_resData.create(insertData, function (err, response) {
                if (err) {
                    const err_message = {
                        "error_stage": "update_response_table",
                        "deviceName": payload.device,
                        "body": err
                    };
                    messageALL.push("insert_response_table   failure");
                    callback(null, err_message);
                } else {
                    messageALL.push("insert_response_table   success");
                    callback(null, processInstanceId);
                }
            });
        }

        async.waterfall(
            [
                get_token,
                create_dynamic_template,
                submit_workflow,
                get_task_ID,
                submit_task,
                insert_main_data,
                insert_response_table
            ], function (err, data) {
                if (err) {
                    messageALL.push("test_waterfall          failure");
                    resultALL.push({success: false, device:payload.device, error_message: err});
                } else {
                    messageALL.push("test_waterfall          success");
                    resultALL.push({success: true, device:payload.device, result: messageALL});
                }
                if (resultALL.length === payloads.length){
                    res.status(200).json({success: true, result: resultALL}).end('');
                }
            })
    }
}

exports.seek_vendor_advice = function (req, res, next) {
    let seek_device = [];
    let new_seek_device = [];
    const resultALL = [];
    const device_list = req.body.device_list;
    const cve_id = req.body.cve_id;
    // const cve_id = "CVE-2020-3517";
    cve_list.find({"cveid":cve_id}, {seek_vendor_list:1, _id: 0}, function (error, response) {
        if (error){
            console.log(error);
        } else {
        	let current_status;
            if (response[0].current_status === "Not start" || response[0].current_status === "Partially complete") {
                current_status = "Start";
            } else {
                current_status = "In-process";
            }

            for (const arr of device_list) {
                new_seek_device.push(arr);
            }
            if (response[0].seek_vendor_list.length !== 0) {
                for (const arr of response[0].seek_vendor_list){
                    seek_device.push(arr);
                }
                for (let i = 0; i < seek_device.length; i++){
                    if (new_seek_device.indexOf(seek_device[i]) === -1){
                        new_seek_device.push(seek_device[i])
                    }
                }
            }
            cve_list.updateOne({"cveid":cve_id}, {$set:{"current_status":current_status, "seek_vendor_list":new_seek_device}}, function (error) {
                if (error){
                    console.log(error);
                }
            });
        }
    });

    for (const device of device_list) {
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
                    callback(null, authToken);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    callback(null, err_message);
                }
            });
        }

        let send_email = function (authToken, callback) {
            const args = {
                url: `http://10.124.196.148:9100/api/v1/mail/send`,
                body: {
                    "to": EMAIL_TO,
                    "subject": `Common vulnerabilities in ${device}`,
                    "html":"Device Name: " + device + "<br>" +
                        "Device Type: Cisco Nexus 9000 <br>" +
                        "Device Role: Switch <br>" +
                        "CVE ID: CVE-2020-3517 <br>" +
                        "<br>" +
                        "More details see the MoP "
                },
                json:true,
                headers: {
                    "Authorization": authToken,
                },
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    callback(null, data);
                } else {
                    callback(null, response);
                }
            })
        }

        async.waterfall([get_token, send_email], function (err, data) {
            if (err) {
                resultALL.push(err);
            } else {
                resultALL.push(data);
            }
            if (resultALL.length === device_list.length) {
                res.status(200).json({success: true, result: resultALL}).end('');
            }
        })
    }

}

trace_logs_start = function (device_name, type) {
    const args = {
        url: `${NSO_FLASK_API}/log_start`,
        body: {
            "device_name": device_name,
            "type": type
        },
        json:true
    };
    request.post(args, function (error, response, data) {
        if (!error && response.statusCode === 200) {
            console.log("trace_logs_start data" + data);
        } else {
            console.log("trace_logs_start error" + data);
        }
    })
}

trace_logs_end = function (device_name, type) {
    const args = {
        url: `${AUTH_API}/api/v1.0/login`,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic YWRtaW46YWRtaW4="
        }
    };
    request.post(args, function (error, response, data){
        if (!error && response.statusCode === 200) {
            data = JSON.parse(data);
            tokenData = data.token_type + " " + data.access_token;
            const args = {
                url: `http://10.124.196.148:8000/api/v1.0/scb/get_trace_logs`,
                body: {
                    "device_name": device_name,
                    "type": type
                },
                json:true,
                headers: {
                    "Authorization": tokenData,
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    console.log("trace_logs_end data" + data);
                } else {
                    console.log("trace_logs_end error" + data);
                }
            })
        }
    });
}

exports.assessment_page_data = function(req, res, next) {
    checkCevStatus();

    let get_cvelist_data = function(callback) {
        cve_list.find({},function(err,response){
            if(err){
                callback(err, response);
            }
            else{
                callback(null, response);
            }
        });
    }

    let get_vulnerability_severity_data = function (callback) {
        cve_list.find({}, {security:1, _id:0}, function(err,responses){
            if(err){
                callback(err, response);
            }
            else{
                let high = 0;
                let medium = 0;
                let low = 0;
                let critical = 0;
                const vulnerability_severity_data = {};
                for (const response of responses) {
                    if (response.security === "High" || response.security === "high") {
                        high++;
                    } else if (response.security === "Medium" || response.security === "medium") {
                        medium++;
                    } else if (response.security === "Low" || response.security === "low") {
                        low++;
                    } else if (response.security === "Critical" || response.security === "critical") {
                        critical++;
                    }
                    vulnerability_severity_data["high"] = high;
                    // vulnerability_severity_data["medium"] = medium;
                    vulnerability_severity_data["low"] = low + medium;
                    vulnerability_severity_data["critical"] = critical;
                }
                console.log({vulnerability_severity_data:vulnerability_severity_data});
                callback(null, vulnerability_severity_data);
            }
        });
    }

    let get_vulnerability_device_data = function (callback) {
        cve_list.find({}, {device_list:1, _id:0}, function(err,responses){
            if(err){
                callback(err, response);
            }
            else{
                let high = 0;
                let medium = 0;
                let low = 0;
                let unimpacted = 0;
                let unknown = 0;
                const vulnerability_device_data = {};
                for (const response of responses) {
                    for (const responseOne of response.device_list) {
                        if (responseOne.impact === "High" || response.security === "high") {
                            high++;
                        } else if (responseOne.impact === "Medium" || response.security === "medium") {
                            medium++;
                        } else if (responseOne.impact === "Low" || response.security === "low") {
                            low++;
                        } else if (responseOne.impact === "Unimpacted" || response.security === "unimpacted") {
                            unimpacted++;
                        } else {
                            unknown++;
                        }
                    }
                    vulnerability_device_data["critical"] = high;
                    vulnerability_device_data["major"] = medium;
                    vulnerability_device_data["minor"] = low;
                    vulnerability_device_data["unimpacted"] = unimpacted;
                    vulnerability_device_data["unknown"] = 442 + unknown;
                }
                console.log({vulnerability_device_data:vulnerability_device_data});
                callback(null, vulnerability_device_data);
            }
        });
    }

    async.series([
        get_cvelist_data,
        get_vulnerability_severity_data,
        get_vulnerability_device_data
    ],function(err,data){
        if (err) {
            res.status(500).json({ success: false, Error_Message: err }).end('');
        }
        //console.log(data);
        let result = {};
        result["cvelist"] = data[0];
        result["severity_data"] = data[1];
        result["device_data"] = data[2];
        if (result["cvelist"].length === 0){
            result["severity_data"] = {
                "high": 0,
                "low": 0,
                "critical": 0
            };
            result["device_data"] = {
                "critical": 0,
                "major": 0,
                "minor": 0,
                "unimpacted": 0,
                "unknown": 0
            };
            res.status(200).json({ success: true, result: result }).end('');
        } else {
            res.status(200).json({ success: true, result: result }).end('');
        }
    })
}

exports.import_from_NP = function(req, res, next) {
    const insertStr0 = {
        "cveid": "CVE-2020-3517",
        "security": "High",
        "owner": "chengrfa",
        "current_status": "Not start",
        "target_resolution_date": "2020-12-15",
        "remediation_availability": "Yes",
        "device_list": [
            {
                "device": "9k",
                "vendor": "Cisco",
                "host_name": "my_pjy_lyl_t2_dev_csw_02",
                "ip_address": "10.112.191.25",
                "management_address": "10.112.180.3",
                "operating_system": "Cisco Systems NX-OS",
                "version": "V9.3.3",
                "model": "9k",
                "region": "ASEAN",
                "country": "Malaysia",
                "serial_number": "FDO23390CDT",
                "environment": "Prod",
                "roles": "Switch",
                "infrastructure_type": "LAN-WAN",
                "device_criticality": "Non-Critical",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "V7.0.3.I7.9",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "None",
                "connect_devices": "",
                "impact": "High"
            },
            {
                "device": "F241.16.14-9372-2",
                "vendor": "Cisco",
                "host_name": "my_pjy_lyl_t2_dev_csw_02",
                "ip_address": "10.82.140.114",
                "management_address": "10.112.180.3",
                "operating_system": "Cisco Systems NX-OS",
                "version": "V7.0.3.I7.3",
                "model": "9k",
                "region": "ASEAN",
                "country": "Malaysia",
                "serial_number": "FDO23390CDT",
                "environment": "Prod",
                "roles": "Switch",
                "infrastructure_type": "LAN-WAN",
                "device_criticality": "Non-Critical",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "V7.0.3.I7.9",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "F241.16.14-9372-1",
                "connect_devices": "",
                "impact": "High"
            },
            {
                "device": "F241.16.14-9372-1",
                "vendor": "Cisco",
                "host_name": "my_pjy_lyl_t2_dev_csw_02",
                "ip_address": "10.82.140.115",
                "management_address": "10.112.180.3",
                "operating_system": "Cisco Systems NX-OS",
                "version": "V7.0.3.I7.3",
                "model": "9k",
                "region": "ASEAN",
                "country": "Malaysia",
                "serial_number": "FDO23390CDT",
                "environment": "Prod",
                "roles": "Switch",
                "infrastructure_type": "LAN-WAN",
                "device_criticality": "Non-Critical",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "V7.0.3.I7.9",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "F241.16.14-9372-2",
                "connect_devices": "",
                "impact": "High"
            },
            {
                "device": "F241.16.14-93180-1",
                "vendor": "Cisco",
                "host_name": "my_pjy_lyl_t2_dev_csw_02",
                "ip_address": "10.82.140.116",
                "management_address": "10.112.180.3",
                "operating_system": "Cisco Systems NX-OS",
                "version": "V7.0.3.I7.3",
                "model": "9k",
                "region": "ASEAN",
                "country": "Malaysia",
                "serial_number": "FDO23390CDT",
                "environment": "Prod",
                "roles": "Switch",
                "infrastructure_type": "LAN-WAN",
                "device_criticality": "Non-Critical",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "V7.0.3.I7.9",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "F241.16.14-93180-2",
                "connect_devices": "",
                "impact": "High"
            },
            {
                "device": "F241.16.14-93180-2",
                "vendor": "Cisco",
                "host_name": "my_pjy_lyl_t2_dev_csw_02",
                "ip_address": "10.82.140.117",
                "management_address": "10.112.180.3",
                "operating_system": "Cisco Systems NX-OS",
                "version": "V7.0.3.I7.3",
                "model": "9k",
                "region": "ASEAN",
                "country": "Malaysia",
                "serial_number": "FDO23390CDT",
                "environment": "Prod",
                "roles": "Switch",
                "infrastructure_type": "LAN-WAN",
                "device_criticality": "Non-Critical",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "V7.0.3.I7.9",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "F241.16.14-93180-1",
                "connect_devices": "",
                "impact": "High"
            }
        ],
        "impact": [
            {
                "service": "asr1",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "true",
                "ticket_number": ""
            },
            {
                "service": "asr2",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "true",
                "ticket_number": ""
            }
        ],
        "seek_vendor_list":[],
        "submit_device_list":[],
        "process_instance_id":[],
        "upgraded_device_list":[]
    };
    const insertStr1 = {
        "cveid": "CVE-2020-3415",
        "security": "High",
        "owner": "chengrfa",
        "current_status": "Not start",
        "target_resolution_date": "2020-12-15",
        "remediation_availability": "Yes",
        "device_list": [
            {
                "device": "HK_HKG_JUM_T1_OOB_L2A_314.sc.net",
                "vendor": "Cisco",
                "host_name": "HK_HKG_JUM_T1_OOB_L2A_314.sc.net",
                "ip_address": "10.21.168.195",
                "management_address": "",
                "operating_system": "NX-OS",
                "version": "7.0(3)I2(2b)",
                "model": "",
                "region": "ASEAN",
                "country": "Malaysia ",
                "serial_number": "",
                "environment": "",
                "roles": "Data Center Switches",
                "infrastructure_type": "",
                "device_criticality": "",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "7.0(3)I7(9)",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "None",
                "connect_devices": "",
                "deviceId": "18107923",
                "deviceIp": "10.21.168.195",
                "deviceType": "Managed Chassis",
                "productFamily": "Cisco Nexus 9000 Series Switches",
                "productId": "N9K-C93120TX",
                "impact": "High"
            },
            {
                "device": "HK_HKG_JUM_T1_DEV_L2A_115",
                "vendor": "Cisco",
                "host_name": "HK_HKG_JUM_T1_DEV_L2A_115",
                "ip_address": "10.21.220.109",
                "management_address": "",
                "operating_system": "NX-OS",
                "version": "7.0(3)I2(2b)",
                "model": "",
                "region": "ASEAN",
                "country": "Malaysia ",
                "serial_number": "",
                "environment": "",
                "roles": "Data Center Switches",
                "infrastructure_type": "",
                "device_criticality": "",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "7.0(3)I7(9)",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "None",
                "connect_devices": "18107926",
                "deviceId": "",
                "deviceIp": "",
                "deviceType": "Managed Chassis",
                "productFamily": "Cisco Nexus 9000 Series Switches",
                "productId": "N9K-C93120TX",
                "impact": "High"
            },
            {
                "device": "HK_HKG_JUM_T1_OOB_L2A_303.sc.net",
                "vendor": "Cisco",
                "host_name": "HK_HKG_JUM_T1_OOB_L2A_303.sc.net",
                "ip_address": "10.21.168.157",
                "management_address": "",
                "operating_system": "NX-OS",
                "version": "7.0(3)I2(2b)",
                "model": "",
                "region": "ASEAN",
                "country": "Malaysia ",
                "serial_number": "",
                "environment": "",
                "roles": "Data Center Switches",
                "infrastructure_type": "",
                "device_criticality": "",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "7.0(3)I7(9)",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "None",
                "connect_devices": "",
                "deviceId": "18107933",
                "deviceIp": "10.21.168.157",
                "deviceType": "Managed Chassis",
                "productFamily": "Cisco Nexus 9000 Series Switches",
                "productId": "N9K-C93120TX",
                "impact": "High"
            }
        ]
    };
    const insertStr2 = {
        "cveid": "CVE-2020-3398",
        "security": "High",
        "owner": "chengrfa",
        "current_status": "Not start",
        "target_resolution_date": "2020-12-15",
        "remediation_availability": "Yes",
        "device_list": [
            {
                "device": "HK_HKG_JUM_T1_DEV_L2A_114",
                "vendor": "Cisco",
                "host_name": "HK_HKG_JUM_T1_DEV_L2A_114",
                "ip_address": "10.20.180.236",
                "management_address": "",
                "operating_system": "NX-OS",
                "version": "7.0(3)I2(2b)",
                "model": "",
                "region": "ASEAN",
                "country": "Malaysia ",
                "serial_number": "",
                "environment": "",
                "roles": "Data Center Switches",
                "infrastructure_type": "",
                "device_criticality": "",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "7.0(3)I7(9)",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "None",
                "connect_devices": "",
                "deviceId": "18102390",
                "deviceIp": "10.20.180.236",
                "deviceType": "Managed Chassis",
                "productFamily": "Cisco Nexus 9000 Series Switches",
                "productId": "N9K-C9372PX-E",
                "impact": "High"
            },
            {
                "device": "HK_HKG_JUM_T1_DEV_L2A_115",
                "vendor": "Cisco",
                "host_name": "HK_HKG_JUM_T1_DEV_L2A_115",
                "ip_address": "10.20.180.247",
                "management_address": "",
                "operating_system": "NX-OS",
                "version": "7.0(3)I2(2b)",
                "model": "",
                "region": "ASEAN",
                "country": "Malaysia ",
                "serial_number": "",
                "environment": "",
                "roles": "Data Center Switches",
                "infrastructure_type": "",
                "device_criticality": "",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "7.0(3)I7(9)",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "None",
                "connect_devices": "",
                "deviceId": "18102391",
                "deviceIp": "10.20.180.247",
                "deviceType": "Managed Chassis",
                "productFamily": "Cisco Nexus 9000 Series Switches",
                "productId": "N9K-C9372PX-E",
                "impact": "High"
            },
            {
                "device": "10.21.168.157",
                "vendor": "Cisco",
                "host_name": "HK_HKG_JUM_T1_OOB_L2A_303.sc.net",
                "ip_address": "10.21.168.157",
                "management_address": "",
                "operating_system": "NX-OS",
                "version": "7.0(3)I2(2b)",
                "model": "",
                "region": "ASEAN",
                "country": "Malaysia ",
                "serial_number": "",
                "environment": "",
                "roles": "Data Center Switches",
                "infrastructure_type": "",
                "device_criticality": "",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "7.0(3)I7(9)",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "None",
                "connect_devices": "",
                "deviceId": "18107933",
                "deviceIp": "10.21.168.157",
                "deviceType": "Managed Chassis",
                "productFamily": "Cisco Nexus 9000 Series Switches",
                "productId": "N9K-C93120TX",
                "impact": "High"
            },
            {
                "device": "HK_HKG_JUM_T1_OOB_L2A_303.sc.net",
                "vendor": "Cisco",
                "host_name": "HK_HKG_JUM_T1_SVRFM01_L2A_321.sc",
                "ip_address": "10.21.220.121",
                "management_address": "",
                "operating_system": "NX-OS",
                "version": "7.0(3)I2(2b)",
                "model": "",
                "region": "ASEAN",
                "country": "Malaysia ",
                "serial_number": "",
                "environment": "",
                "roles": "Data Center Switches",
                "infrastructure_type": "",
                "device_criticality": "",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "7.0(3)I7(9)",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "None",
                "connect_devices": "",
                "deviceId": "18107932",
                "deviceIp": "10.21.220.121",
                "deviceType": "Managed Chassis",
                "productFamily": "Cisco Nexus 9000 Series Switches",
                "productId": "N9K-C93120TX",
                "impact": "High"
            },
            {
                "device": "10.20.182.119",
                "vendor": "Cisco",
                "host_name": "HK_HKG_JUM_T1_DEV_L2A_129",
                "ip_address": "10.20.182.119",
                "management_address": "",
                "operating_system": "NX-OS",
                "version": "7.0(3)I2(2b)",
                "model": "",
                "region": "ASEAN",
                "country": "Malaysia ",
                "serial_number": "",
                "environment": "",
                "roles": "Data Center Switches",
                "infrastructure_type": "",
                "device_criticality": "",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "7.0(3)I7(9)",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "None",
                "connect_devices": "",
                "deviceId": "18107924",
                "deviceIp": "10.20.182.119",
                "deviceType": "Managed Chassis",
                "productFamily": "Cisco Nexus 9000 Series Switches",
                "productId": "N9K-C93120TX",
                "impact": "High"
            },
            {
                "device": "10.21.220.104",
                "vendor": "Cisco",
                "host_name": "HK_HKG_JUM_T1_DEV_L2A_129",
                "ip_address": "10.21.220.104",
                "management_address": "",
                "operating_system": "NX-OS",
                "version": "7.0(3)I2(2b)",
                "model": "",
                "region": "ASEAN",
                "country": "Malaysia ",
                "serial_number": "",
                "environment": "",
                "roles": "Data Center Switches",
                "infrastructure_type": "",
                "device_criticality": "",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "7.0(3)I7(9)",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "None",
                "connect_devices": "",
                "deviceId": "18107917",
                "deviceIp": "10.21.220.104",
                "deviceType": "Managed Chassis",
                "productFamily": "Cisco Nexus 9000 Series Switches",
                "productId": "N9K-C93120TX",
                "impact": "High"
            },
            {
                "device": "10.20.182.163",
                "vendor": "Cisco",
                "host_name": "HK_HKG_JUM_T1_OOB_L2A_136.sc.net",
                "ip_address": "10.20.182.163",
                "management_address": "",
                "operating_system": "NX-OS",
                "version": "7.0(3)I2(2b)",
                "model": "",
                "region": "ASEAN",
                "country": "Malaysia ",
                "serial_number": "",
                "environment": "",
                "roles": "Data Center Switches",
                "infrastructure_type": "",
                "device_criticality": "",
                "category": "B",
                "risk_rating": "2",
                "recommendation": "Upgrade",
                "workaround": "None",
                "target_os": "7.0(3)I7(9)",
                "vulnerability_score": "2",
                "mop": "N9KUpgrade",
                "date_of_execution": "",
                "owner": "chengrfa",
                "downtime_required": "45mins",
                "application": "Unknown",
                "approval_status": "",
                "ticket_number": "",
                "peer_device": "None",
                "connect_devices": "",
                "deviceId": "18107913",
                "deviceIp": "10.20.182.163",
                "deviceType": "Managed Chassis",
                "productFamily": "Cisco Nexus 9000 Series Switches",
                "productId": "N9K-C93120TX",
                "impact": "High"
            }
        ]
    };
    const file_data = read_bulletins_file();
    file_data.unshift(insertStr1);
    file_data.unshift(insertStr2);
    file_data.unshift(insertStr0);

    cve_list.find({cveid:{$in: ["CVE-2020-3398","CVE-2020-3415"]}}, {cveid:1, _id:0}, function (err, response) {
        if (err) {
            res.status(500).json({ success: false, Error_Message: err }).end('');
        } else {
            if (response.length === 0) {
                cve_list.insertMany(file_data, function (err, response) {
                    if (err) {
                        res.status(500).json({ success: false, Error_Message: err }).end('');
                    } else {
                        res.status(200).json({ success: true, result: response }).end('');
                    }
                })
            } else {
                res.status(200).json({ success: true, result: "Data exist!" }).end('');
            }
        }
    })
}

exports.reset_cve_list = function(req, res, next) {
    cve_list.deleteMany({}, function (err, response) {
        if (err) {
            res.status(500).json({ success: false, Error_Message: err }).end('');
        } else {
            res.status(200).json({ success: true, result: response }).end('');
        }
    });
}

exports.reset_osupgrade_list = function(req, res, next) {
    osupgrade_info.deleteMany({}, function (err, response) {
        if (err) {
            res.status(500).json({ success: false, Error_Message: err }).end('');
        } else {
            res.status(200).json({ success: true, result: response }).end('');
        }
    });
}

exports.check_cfs_status = function (req, res, next) {
    const resultALL = [];
    const deviceList = req.body.deviceList;
    for (const device of deviceList) {
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
                    callback(null, authToken);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": dataOne.deviceName,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    callback(null, err_message);
                }
            });
        }

        let call_template = function (authToken, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/template-manager/execute?nsoInstance=nso-test-1`,
                body: {
                    "deviceName": device,
                    "templateId": "SCB_check_cfs_status",
                    "commandList": [
                        {
                            "command": "show cfs status",
                            "isConfigMode": false,
                            "goToStepOnPass": "",
                            "goToStepOnFail": "",
                            "passExpr": "",
                            "rules": [
                                {
                                    "op": "!Contains",
                                    "opvariable": "",
                                    "desc": "",
                                    "rule": "Distribution : Enabled"
                                }
                            ]
                        }
                    ]
                },
                json:true,
                headers: {
                    "Authorization": authToken,
                },
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = data.commands[0].evaluatedRules[0].result;
                    callback(null, data);
                } else {
                    const err_message = {
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    callback(err_message, data);
                }
            })
        }

        async.waterfall([get_token, call_template], function (err, data) {
            if (err) {
                resultALL.push(err);
            } else {
                if (data === false) {
                    console.log(device + " is impacted!");
                    resultALL.push(device + " is impacted!");
                } else {
                    console.log(device + " is not impacted!");
                    resultALL.push(device + " is not impacted!");
                }
            }
            if (resultALL.length === deviceList.length) {
                res.status(200).json({success: true, result: resultALL}).end('');
            }
        })
    }
}

exports.approve_email = function (req, res, next) {
    const device = req.body.device;
    const email_msg = {
        "subject": `Device ${device} approve to upgrade`,
        "html": `Task: Upgrade ${device} <br>Time of Execution:${new Date().Format("yyyy-MM-dd hh:mm:ss")}<br>Device Name:${device}`
    }
    send_email(email_msg);
    res.send("success");
}

read_bulletins_file = function() {
    const absolutePath = "/home/node/app/files/get-psr-bulletins.txt";
    const file_data = fs.readFileSync(absolutePath, "utf-8");
    // console.log(file_data);
    let result = [];
    for (const data of JSON.parse(file_data)) {
        if (data.cveId === null) {
            continue;
        } else if (data.cveId.length > 13) {
            const new_data = data.cveId.split(",");
            for (const new_cveId of new_data){
                const cve = {
                    "cveid": new_cveId,
                    "security": data.sir,
                    "owner": "Cisco",
                    "current_status": "Not start",
                    "target_resolution_date": "2020-12-15",
                    "remediation_availability": "Yes",
                    "device_list":[]
                }
                result.push(cve);
            }
        } else {
            const cve = {
                "cveid": data.cveId,
                "security": data.sir,
                "owner": "Cisco",
                "current_status": "Not start",
                "target_resolution_date": "2020-12-15",
                "remediation_availability": "Yes",
                "device_list":[]
            }
            result.push(cve);
        }
    }

    for(let i = 0; i < result.length; i++){
        for(let j = i + 1; j < result.length; j++){
            if(JSON.stringify(result[i]) === JSON.stringify(result[j])){
                result.splice(j,1);
                j--;
            }
        }
    }

    console.log(result);
    return result;
}

function checkCevStatus(){
    var checkStauts=true;
    cve_list.find({},function(err,response){
        if(err){
            return false;
        }
        else{
            for (var cve of response)
            {
                if(cve.current_status==="Not start"){
                    continue;
                }
                var whereStr = {"cveid": cve.cveid};
                console.log("------> device_list.length ---> ", cve.device_list.length);
                console.log("------> submit_device_list.length ---> ", cve.submit_device_list.length);
                console.log("------> current_status ---> ", cve.current_status);
                if (cve.device_list.length !== 0 &&cve.submit_device_list.length === 0&&cve.current_status ==="In-process") {
                    var updateStr = {$set:{"current_status": "Partially complete"}};
                    if (cve.seek_vendor_list.length === 0) {
                        assessment_workflow_status (cve.cveid);
                    }
                    
                    cve_list.updateOne(whereStr, updateStr, function(err,response){
                        if(err){
                            checkStauts=false;
                        }
                    });
                } else if (cve.device_list.length === 0 && cve.submit_device_list.length === 0&&cve.current_status ==="In-process") {
                    var updateStr = {$set:{"current_status": "completed"}};
                    cve_list.updateOne(whereStr, updateStr, function(err,response){
                        if(err){
                            checkStauts=false;
                        }
                    });
                    assessment_workflow_status (cve.cveid);
                } else {
                    continue;
                }
            }
            return checkStauts;
        }
    });
}    

assessment_workflow_status = function (cve_id) {
    cve_list.find({"cveid":cve_id}, {"process_instance_id":1, "_id":0}, function (error, response) {
        if (error) {
            console.log("Receive Completed Message   failure");
            return false;
        } else {
            let msg = [];
            for (const processInstanceId of response[0].process_instance_id) {
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
                            const dataPackage = {
                                authToken: authToken,
                                processInstanceId:processInstanceId
                            };
                            callback(null, dataPackage);
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

                let get_task_ID = function (dataPackage, callback) {
                    const args = {
                        url: `${CORE_API}/api/v1.0/workflow/tasks`,
                        headers: {
                            "Authorization": dataPackage.authToken
                        }
                    };
                    request.get(args, function (error, response, data) {
                        if (!error && response.statusCode === 200) {
                            data = JSON.parse(data);
                            for(const dataOne of data){
                                if(dataOne.processInstanceId === dataPackage.processInstanceId){
                                    dataPackage["id"] = dataOne.id;
                                }
                            }
                            callback(null, dataPackage)
                        } else {
                            const err_message = {
                                "error_stage": "get_task_ID",
                                "status_code": response.statusCode,
                                "body": JSON.parse(response.body)
                            };
                            callback(err_message, null);
                        }
                    });
                }

                let submit_task = function (dataPackage, callback) {
                    let met_value = {
                        "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": "null"}],
                        "nedTemplatesJson": [{
                            "platformName": "cisco-nx-cli-5.15",
                            "templateMap": {
                                "analyticsTmpl": null
                            }
                        }],
                        "abortOnFailure": null,
                        "batchSize": null,
                        "date": "2020-12-01",
                        "time": "05:15",
                        "schedule": "now",
                        "scheduleType": false
                    };
                    met_value = JSON.stringify(met_value);
                    const args = {
                        url: `${CORE_API}/api/v1.0/workflow/task/${dataPackage.id}/complete`,
                        form: {
                            "variables": {
                                "formData": {
                                    "value": met_value
                                }
                            }
                        },
                        headers: {
                            "Authorization": dataPackage.authToken,
                        },
                    };
                    request.post(args, function (error, response, data) {
                        if (!error && response.statusCode === 200) {
                            const processInstanceId = dataPackage.processInstanceId;
                            callback(null, {processInstanceId: processInstanceId})
                        } else {
                            const err_message = {
                                "error_stage": "submit_task",
                                "status_code": response.statusCode,
                                "body": JSON.parse(response.body)
                            };
                            callback(err_message, null);
                        }
                    });
                }

                async.waterfall([
                    get_token,
                    get_task_ID,
                    submit_task
                ], function (err) {
                    if (err) {
                        msg.push(processInstanceId + "failure");
                        console.log(err);
                    } else {
                        cve_list.updateOne({"cveid": cve_id}, {$pull:{"process_instance_id": processInstanceId}}, function (error) {
                            if (error) {
                                msg.push(processInstanceId + " ---> failure");
                                console.log(err);
                            } else {
                                msg.push(processInstanceId + " ---> success");
                            }
                        })
                    }
                    if (msg.length === response[0].process_instance_id.length) {
                        console.log(msg);
                        return true;
                    }
                })
            }
        }
    });
}

setInterval(checkCevStatus, 300000);

exports.sync_from_device = function (req, res, next) {
    const payload = req.body;

    let fetch_host_keys = function (callback) {
        const args = {
            url: `${NSO_API}/restconf/data/tailf-ncs:devices/fetch-ssh-host-keys`,
            body: payload,
            json:true,
            headers: {
                "Authorization": "Basic cm9vdDphZG1pbg==",
                "Cache-Control":"no-cache",
                "Accept":"application/yang-data+json",
                "Content-Type":"application/yang-data+json"
            },
        };
        request.post(args, function (error, response, data) {
            console.log(JSON.stringify(data));
            if (!error && response.statusCode === 200){
                if (data["tailf-ncs:output"]["fetch-result"][0].result === "failed"){
                    callback (data, null);
                } else {
                    callback (null, data);
                }
            } else {
                callback (data, null);
            }
        })
    }

    let sync_from = function (callback) {
        const args = {
            url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${payload.device[0]}/sync-from`,
            json:true,
            headers: {
                "Authorization": "Basic cm9vdDphZG1pbg==",
                "Cache-Control":"no-cache",
                "Accept":"application/yang-data+json",
                "Content-Type":"application/yang-data+json"
            },
        };
        request.post(args, function (error, response, data) {
            if (!error && response.statusCode === 200){
                console.log(JSON.stringify(data));
                if (data["tailf-ncs:output"].result === false) {
                    callback (data, null);
                }else {
                    callback (null, data);
                }
            } else {
                callback (data, null);
            }
        })
    }
    async.series([fetch_host_keys, sync_from], function (err, data) {
            if (err) {
                res.json({success: false, result: err});
            } else {
                res.status(200).json({success: true, result: "Device sync from successfully."}).end('');
            }
        })
}

exports.data_storage = function (req, res, next) {
    const whereStr = req.body.whereStr;
    const updateStr = req.body.updateStr;
    console.log(whereStr);
    console.log(updateStr);
    osupgrade_info.updateOne(whereStr, updateStr, function (err, response) {
        if (err) {
            console.log(err);
            res.json({success: true, result: err}).end('');
        } else {
            console.log(response);
            res.json({success: true, result: response}).end('');
        }
    });
}

exports.get_validate_device_log = function (req, res, next) {
    const device = req.body.device;
    const whereStr  = {"_id": device};
    const conditionStr  = {_id: 1, validate_device_log: 1};
    osupgrade_info.find(whereStr, conditionStr, function(err,response){
        console.log(response);
        if(err){
            res.status(500).json({success: false, Error_Message: err}).end('');
        }
        else{
            if (response[0]._doc.validate_device_log === "") {
                res.status(200).json({success: true, result: "no data"}).end('');
                return;
            }
            console.log(response[0]._doc.validate_device_log);
            const result = {
                "_id": response[0]._id,
                "pre_check_log": JSON.parse(response[0]._doc.validate_device_log)
            }
            res.status(200).json({success: true, result: result}).end('');
        }
    });
}

exports.get_dry_run = function (req, res, next) {
    const device = req.body.device;
    const whereStr  = {"_id": device};
    const conditionStr  = {_id: 0, connected_device: 1};
    osupgrade_info.find(whereStr, conditionStr, function(err,response){
        const device_if_list = [];
        for (const device of response[0].connected_device) {
            device_if_list.push({
                "device-name": device.device,
                "interface-type": "GigabitEthernet",
                "interface": "1/1",
                "description": "modify interface"
            });
        }
        const args = {
            url: `${NSO_API}/restconf/ds/ietf-datastores:running/vlan:vlan?dry-run=native`,
            body: `{
                "vlan:vlan": [
                        {
                            "name": "1234",
                            "vlan-id": 300,
                            "device-if": ${JSON.stringify(device_if_list)}
                        }
                    ]
                }`,
            headers: {
                "Accept": "application/yang-data+json",
                "Authorization": "Basic cm9vdDphZG1pbg==",
                "Cache-Control": "no-cache",
                "Content-Type": "application/yang-data+json"
            }
        };
        console.log(args.body);
        request.patch(args, function(error, response, data) {
            if (!error && response.statusCode === 200) {
                res.json({ success: true, result: JSON.parse(data) }).end('');
            } else {
                res.json({ success: false, error_message: JSON.parse(response.body) }).end('');
            }
        })
    })
}

exports.display_dry_run = function (req, res, next) {
    const device = req.body.device;

    let get_validate_device_log = function (callback) {
        const whereStr  = {"_id": device};
        const conditionStr  = {_id: 0, validate_device_log: 1};
        osupgrade_info.find(whereStr, conditionStr, function(err,response){
            if(err){
                callback(err, null);
            }
            else{
                if (response[0]._doc.validate_device_log === "") {
                    callback(null, "No Data");
                    return;
                }
                callback(null, JSON.parse(response[0]._doc.validate_device_log));
            }
        });
    }

    let get_connected_device_dry_run = function (callback) {
        const whereStr  = {"_id": device};
        const conditionStr  = {_id: 0, connected_device: 1};
        osupgrade_info.find(whereStr, conditionStr, function(err,response){
            const asr_device = response[0].connected_device[0].device;
            console.log(asr_device);
            const args = {
                url: `${NSO_API}/restconf/operations/Failover/display`,
                body: {"input":{"device":asr_device}},
                json:true,
                headers: {
                    "Accept": "application/yang-data+json",
                    "Authorization": "Basic cm9vdDphZG1pbg==",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/yang-data+json"
                }
            };
            request.post(args, function(error, response, data) {
                console.log(response.statusCode);
                console.log(JSON.stringify(data));
                if (!error && response.statusCode === 200) {
                    console.log(data);
                    const new_data = {
                        "dry-run-result":{
                            "native": {
                                "device":[
                                    {
                                        "name":asr_device,
                                        "data":data["FailoverActiveRpc:output"]["info"]
                                    }
                                ]
                            }
                        }
                    };
                    callback(null, new_data);
                } else {
                    callback(err, null);
                }
            })
        })
    }

    let get_preCheck_log = function (callback) {
        const whereStr  = {"_id": device};
        const conditionStr  = {_id: 0, pre_check_log: 1};
        osupgrade_info.find(whereStr, conditionStr, function(err,response){
            if(err){
                callback(err, null);
            }
            else{
                if (response[0]._doc.pre_check_log === "") {
                    callback(null, "No Data");
                    return;
                }
                callback(null, JSON.parse(response[0]._doc.pre_check_log));
            }
        });
    }

    let get_postCheck_log = function (callback) {
        const whereStr  = {"_id": device};
        const conditionStr  = {_id: 0, post_check_log: 1};
        osupgrade_info.find(whereStr, conditionStr, function(err,response){
            if(err){
                callback(err, null);
            }
            else{
                if (response[0]._doc.post_check_log === "") {
                    callback(null, "No Data");
                    return;
                }
                callback(null, JSON.parse(response[0]._doc.post_check_log));
            }
        });
    }

    async.parallel([
        get_validate_device_log,
        get_connected_device_dry_run,
        get_preCheck_log,
        get_postCheck_log
    ],function(err,data){
        if (err) {
            res.status(200).json({success: true, result: err}).end('');
        } else {
            let result = {
                validate_device_log:"",
                get_connected_device_dry_run: "",
                pre_check_log:"",
                post_check_log:"",
            };
            result["validate_device_log"] = data[0];
            if (result["validate_device_log"] === "No Data") {
                result["get_connected_device_dry_run"] = "No Data";
            } else {
                result["get_connected_device_dry_run"] = {result: data[1]};
            }
            result["pre_check_log"] = data[2];
            result["post_check_log"] = data[3];

            res.status(200).json({success: true, result: result}).end('');
        }
    })
}

exports.diff_analysis = function (req, res, next) {
    const deviceName = req.body.deviceName;
    const analyticsTmplId = req.body.analyticsTmplId;
    const firstExecutionId = req.body.firstExecutionId;
    const secondExecutionId = req.body.secondExecutionId;

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
                callback(null, authToken);
            } else {
                const err_message = {
                    "error_stage": "get_token",
                    "deviceName": payload.device,
                    "status_code": response.statusCode,
                    "body": JSON.parse(response.body)
                };
                callback(err_message, null);
            }
        });
    }

    let diff_pre_and_post = function (authToken, callback) {
        const args = {
            url: `${CORE_API}/api/v1.0/diff-analytics/execution`,
            body: req.body,
            json:true,
            headers: {
                "Authorization": authToken,
            }
        };
        request.post(args, function (error, response, data) {
            if(error){
                callback(error, null);
            } else {
                callback(null, data);
            }
        })
    }

    let data_storage = function(data, callback) {
        const diffWhereStr  = {"_id": deviceName};
        const diffupdateStr  = {$set:{"diff_log": JSON.stringify(data)}};
        osupgrade_info.updateOne(diffWhereStr, diffupdateStr,function (err) {
            if(err){
                callback(err, null);
            } else {
                callback(null, data);
            }
        });
    }

    async.waterfall(
        [
            get_token,
            diff_pre_and_post,
            data_storage
        ], function (err, data) {
            if (err) {
                res.json({success: true, result: err}).end('');
            } else {
                res.status(200).json({success: true, result: data}).end('');
            }
        })
}

exports.pre_check = function (req, res) {
    let resultALL = [];
    const deviceList = req.body.deviceList;

    for (const device of deviceList) {
        let messageALL = [];
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
                    messageALL.push("get_token               success");
                    callback(null, authToken);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_token               failure");
                    callback(err_message, null);
                }
            });
        }

        let submit_workflow = function (authToken, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/process-definition/${PRE_WORKFLOW_ID}/submit-form`,
                headers: {
                    "Authorization": authToken,
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    const dataPackage = {
                        authToken: authToken,
                        processInstanceId: data.id
                    }
                    messageALL.push("submit_workflow         success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "submit_workflow",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("submit_workflow         failure");
                    callback(err_message, null);
                }
            });
        }

        let get_task_ID = function (dataPackage, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/tasks`,
                headers: {
                    "Authorization": dataPackage.authToken
                }
            };
            request.get(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    for(const dataOne of data){
                        if(dataOne.processInstanceId === dataPackage.processInstanceId){
                            dataPackage["id"] = dataOne.id;
                        }
                    }
                    messageALL.push("get_task_ID             success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "get_task_ID",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_task_ID             failure");
                    callback(err_message, null);
                }
            });
        }

        let submit_task = function (dataPackage, callback) {
            let met_value = {
                "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": device}],
                "nedTemplatesJson": [{
                    "platformName": "cisco-nx-cli-5.15",
                    "templateMap": {
                        "analyticsTmpl": null,
                        "preCheck": "SCB_pre_check_template",
                        "postCheck": "SCB_post_check_template"
                    }
                }],
                "abortOnFailure": null,
                "batchSize": null,
                "date": "2020-12-01",
                "time": "05:15",
                "schedule": "now",
                "scheduleType": false
            };
            met_value = JSON.stringify(met_value);
            const value = met_value.replace(/"/gi, '\"');
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/task/${dataPackage.id}/complete`,
                form: {
                    "variables": {
                        "formData": {
                            "value": value
                        }
                    }
                },
                headers: {
                    "Authorization": dataPackage.authToken,
                },
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    const processInstanceId = dataPackage.processInstanceId
                    messageALL.push("submit_task             success");
                    callback(null, processInstanceId)
                } else {
                    const err_message = {
                        "error_stage": "submit_task",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    console.log(err_message);
                    messageALL.push("submit_task             failure");
                    callback(null, err_message);
                }
            });
        }

        async.waterfall(
            [
                get_token,
                submit_workflow,
                get_task_ID,
                submit_task
            ], function (err, data) {
                if (err) {
                    messageALL.push("pre_check            failure");
                    resultALL.push({success: false, error_message: err});
                } else {
                    messageALL.push("pre_check            success");
                    resultALL.push({success: true, result: messageALL});
                }
                if (resultALL.length === deviceList.length){
                    res.status(200).json({success: true, result: resultALL}).end('');
                }
            })
    }
}

exports.post_check = function (req, res) {
    let resultALL = [];
    const deviceList = req.body.deviceList;

    for (const device of deviceList) {
        let messageALL = [];
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
                    messageALL.push("get_token               success");
                    callback(null, authToken);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_token               failure");
                    callback(err_message, null);
                }
            });
        }

        let submit_workflow = function (authToken, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/process-definition/${POST_WORKFLOW_ID}/submit-form`,
                headers: {
                    "Authorization": authToken,
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    const dataPackage = {
                        authToken: authToken,
                        processInstanceId: data.id
                    }
                    messageALL.push("submit_workflow         success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "submit_workflow",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("submit_workflow         failure");
                    callback(err_message, null);
                }
            });
        }

        let get_task_ID = function (dataPackage, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/tasks`,
                headers: {
                    "Authorization": dataPackage.authToken
                }
            };
            request.get(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    for(const dataOne of data){
                        if(dataOne.processInstanceId === dataPackage.processInstanceId){
                            dataPackage["id"] = dataOne.id;
                        }
                    }
                    messageALL.push("get_task_ID             success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "get_task_ID",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_task_ID             failure");
                    callback(err_message, null);
                }
            });
        }

        let submit_task = function (dataPackage, callback) {
            let met_value = {
                "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": device}],
                "nedTemplatesJson": [{
                    "platformName": "cisco-nx-cli-5.15",
                    "templateMap": {
                        "analyticsTmpl": null,
                        "postCheck": "SCB_post_check_template"
                    }
                }],
                "abortOnFailure": null,
                "batchSize": null,
                "date": "2020-12-01",
                "time": "05:15",
                "schedule": "now",
                "scheduleType": false
            };
            met_value = JSON.stringify(met_value);
            const value = met_value.replace(/"/gi, '\"');
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/task/${dataPackage.id}/complete`,
                form: {
                    "variables": {
                        "formData": {
                            "value": value
                        }
                    }
                },
                headers: {
                    "Authorization": dataPackage.authToken,
                },
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    const processInstanceId = dataPackage.processInstanceId
                    messageALL.push("post_check              success");
                    callback(null, processInstanceId)
                } else {
                    const err_message = {
                        "error_stage": "submit_task",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    console.log(err_message);
                    messageALL.push("post_check              failure");
                    callback(null, err_message);
                }
            });
        }

        async.waterfall(
            [
                get_token,
                submit_workflow,
                get_task_ID,
                submit_task
            ], function (err, data) {
                if (err) {
                    messageALL.push("validate_device         failure");
                    resultALL.push({success: false, error_message: err});
                } else {
                    messageALL.push("validate_device         success");
                    resultALL.push({success: true, result: messageALL});
                }
                if (resultALL.length === deviceList.length){
                    res.status(200).json({success: true, result: resultALL}).end('');
                }
            })
    }
}

// exports.validate_device = function (req, res) {
//     let resultALL = [];
//     const deviceList = req.body.deviceList;

//     for (const device of deviceList) {
//         let messageALL = [];
//         let get_token = function (callback) {
//             const args = {
//                 url: `${AUTH_API}/api/v1.0/login`,
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": "Basic YWRtaW46YWRtaW4="
//                 }
//             };
//             request.post(args, function (error, response, data) {
//                 if (!error && response.statusCode === 200) {
//                     data = JSON.parse(data);
//                     const authToken = data.token_type + " " + data.access_token;
//                     messageALL.push("get_token               success");
//                     callback(null, authToken);
//                 } else {
//                     const err_message = {
//                         "error_stage": "get_token",
//                         "deviceName": device,
//                         "status_code": response.statusCode,
//                         "body": JSON.parse(response.body)
//                     };
//                     messageALL.push("get_token               failure");
//                     callback(err_message, null);
//                 }
//             });
//         }

//         let submit_workflow = function (authToken, callback) {
//             const args = {
//                 url: `${CORE_API}/api/v1.0/workflow/process-definition/${VALIDATE_WORKFLOW_ID}/submit-form`,
//                 headers: {
//                     "Authorization": authToken,
//                 }
//             };
//             request.post(args, function (error, response, data) {
//                 if (!error && response.statusCode === 200) {
//                     data = JSON.parse(data);
//                     const dataPackage = {
//                         authToken: authToken,
//                         processInstanceId: data.id
//                     }
//                     messageALL.push("submit_workflow         success");
//                     callback(null, dataPackage)
//                 } else {
//                     const err_message = {
//                         "error_stage": "submit_workflow",
//                         "deviceName": device,
//                         "status_code": response.statusCode,
//                         "body": JSON.parse(response.body)
//                     };
//                     messageALL.push("submit_workflow         failure");
//                     callback(err_message, null);
//                 }
//             });
//         }

//         let get_task_ID = function (dataPackage, callback) {
//             const args = {
//                 url: `${CORE_API}/api/v1.0/workflow/tasks`,
//                 headers: {
//                     "Authorization": dataPackage.authToken
//                 }
//             };
//             request.get(args, function (error, response, data) {
//                 if (!error && response.statusCode === 200) {
//                     data = JSON.parse(data);
//                     for(const dataOne of data){
//                         if(dataOne.processInstanceId === dataPackage.processInstanceId){
//                             dataPackage["id"] = dataOne.id;
//                         }
//                     }
//                     messageALL.push("get_task_ID             success");
//                     callback(null, dataPackage)
//                 } else {
//                     const err_message = {
//                         "error_stage": "get_task_ID",
//                         "deviceName": device,
//                         "status_code": response.statusCode,
//                         "body": JSON.parse(response.body)
//                     };
//                     messageALL.push("get_task_ID             failure");
//                     callback(err_message, null);
//                 }
//             });
//         }

//         let submit_task = function (dataPackage, callback) {
//             let met_value = {
//                 "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": device}],
//                 "nedTemplatesJson": [{
//                     "platformName": "cisco-nx-cli-5.15",
//                     "templateMap": {
//                         "analyticsTmpl": null
//                     }
//                 }],
//                 "abortOnFailure": null,
//                 "batchSize": null,
//                 "date": "2020-12-01",
//                 "time": "05:15",
//                 "schedule": "now",
//                 "scheduleType": false
//             };
//             met_value = JSON.stringify(met_value);
//             const value = met_value.replace(/"/gi, '\"');
//             const args = {
//                 url: `${CORE_API}/api/v1.0/workflow/task/${dataPackage.id}/complete`,
//                 form: {
//                     "variables": {
//                         "formData": {
//                             "value": value
//                         }
//                     }
//                 },
//                 headers: {
//                     "Authorization": dataPackage.authToken,
//                 },
//             };
//             request.post(args, function (error, response, data) {
//                 if (!error && response.statusCode === 200) {
//                     const processInstanceId = dataPackage.processInstanceId
//                     messageALL.push("submit_task             success");
//                     callback(null, processInstanceId)
//                 } else {
//                     const err_message = {
//                         "error_stage": "submit_task",
//                         "deviceName": device,
//                         "status_code": response.statusCode,
//                         "body": JSON.parse(response.body)
//                     };
//                     console.log(err_message);
//                     messageALL.push("submit_task             failure");
//                     callback(null, err_message);
//                 }
//             });
//         }

//         async.waterfall(
//             [
//                 get_token,
//                 submit_workflow,
//                 get_task_ID,
//                 submit_task
//             ], function (err, data) {
//                 if (err) {
//                     messageALL.push("validate_device         failure");
//                     resultALL.push({success: false, error_message: err});
//                 } else {
//                     messageALL.push("validate_device         success");
//                     resultALL.push({success: true, result: messageALL});
//                 }
//                 if (resultALL.length === deviceList.length){
//                     res.status(200).json({success: true, result: resultALL}).end('');
//                 }
//             })
//     }
// }

exports.main_workflow = function (req, res) {
    let resultALL = [];
    let device_list = [];
    const payloads = req.body.workflow;
    const cve_id = req.body.cve_id;
    // const deviceList = req.body.deviceList;

    for (const payload of payloads) {
        let messageALL = [];
        device_list.push(payload.device);
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
                    messageALL.push("get_token               success");
                    callback(null, authToken);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": payload.device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_token               failure");
                    callback(err_message, null);
                }
            });
        }

        let insert_main_data = function (authToken, callback) {
            const connected_device_list = [];
            const transfer_time = payload.scb_date + " " + payload.scb_time + ":00";
            const historyStr = {
                "protocol": payload.protocols,
                "file_name": payload.fileName,
                "target_location": payload.targetLocation,
                "start_time": payload.scb_date + " " + payload.scb_time,
                "revert_status": "false"
            };
            // let n = 106;
            if (payload.connect_device.length !== 0) {
                for (const connDevice of payload.connect_device) {
                    if (connDevice === "513E-A-25-ASA-5585-1") {
                        connected_device_list.push({"device":connDevice,"host_name":connDevice,"ip_address":"10.201.168.106","role":"Firewall"});
                    } else {
                        //connDevice === "F241-04-23-ASA5585X-1"
                        connected_device_list.push({"device":connDevice,"host_name":connDevice,"ip_address":"10.82.139.231","role":"Firewall"});
                    }
                }
            }
            
            let host_name;
            let currentOS_version;
            if (payload.device === "F241.16.14-9372-2" || payload.device === "F241.16.14-9372-1" || payload.device === "F241.16.14-93180-1" || payload.device === "F241.16.14-93180-2") {
                currentOS_version = "V7.0.3.I7.3";
            } else {
                currentOS_version = "V9.3.3";
            }
            
            if (payload.device === "F241.16.14-9372-2") {
                host_name = "10.82.140.114";
            } else if (payload.device === "F241.16.14-9372-1") {
                host_name = "10.82.140.115";
            } else if (payload.device === "F241.16.14-93180-1") {
                host_name = "10.82.140.116";
            } else if (payload.device === "F241.16.14-93180-2") {
                host_name = "10.82.140.117";
            } else {
                host_name = "10.124.196.105"
            }
            const insertStr = {
                "_id": payload.device,
                "currentOS_version":currentOS_version,
                "targetOS_version":"V7.0.3.I7.9",
                "mop":[
                    {"mop_name":"N9KUpgrade","vendor":"Cisco","device_type":"Nexus9000V","device_role":"Switch","source_version":"V7.0.3.I7.3.bin","target_version":"V7.0.3.I7.9.bin"}],
                "upgrade_tpye":"Single-stage",
                "host_name": host_name,
                "region":"Malaysia",
                "upgrade_status":"Scheduled",
                "image_transfer_status": "Scheduled",
                "image_transfer_scheduled_time": transfer_time,
                "device_reachability_status":"Reachable",
                "pre_check_status":"false",
                "pre_check_log":"",
                "post_check_status":"false",
                "post_check_log":"",
                "diff_log":"",
                "validate_device_log":"",
                "connected_device": connected_device_list,
                "upgrade_time": transfer_time,
                "history": JSON.stringify(historyStr),
                "trace_logs_connect":"",
                "trace_logs_pre":"",
                "trace_logs_upgrade":"",
                "trace_logs_post":"",
                "cve_id":cve_id
            };
            osupgrade_info.create(insertStr, function (err) {
                if (err) {
                    const err_message = {
                        "error_stage": "insert_main_data",
                        "deviceName": payload.device,
                        "body": err
                    };
                    messageALL.push("insert_main_data        failure",);
                    callback(err_message, null);
                } else {
                    messageALL.push("insert_main_data        success");
                    callback(null, authToken);
                }
            });
        }

        let submit_workflow = function (authToken, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/process-definition/${MAIN_WORKFLOW_ID}/submit-form`,
                headers: {
                    "Authorization": authToken,
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    const dataPackage = {
                        authToken: authToken,
                        processInstanceId: data.id
                    }
                    console.log("processInstanceId --->");
                    console.log(dataPackage.processInstanceId);
                    messageALL.push("submit_workflow         success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "submit_workflow",
                        "deviceName": payload.device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("submit_workflow         failure");
                    callback(err_message, null);
                }
            });
        }

        let get_task_ID = function (dataPackage, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/tasks`,
                headers: {
                    "Authorization": dataPackage.authToken
                }
            };
            request.get(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    for(const dataOne of data){
                        if(dataOne.processInstanceId === dataPackage.processInstanceId){
                            dataPackage["id"] = dataOne.id;
                        }
                    }
                    console.log("id --->");
                    console.log(dataPackage.id);
                    messageALL.push("get_task_ID             success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "get_task_ID",
                        "deviceName": payload.device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_task_ID             failure");
                    callback(err_message, null);
                }
            });
        }

        let submit_task = function (dataPackage, callback) {
            let met_value = {
                "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": payload.device}],
                "nedTemplatesJson": [{
                    "platformName": "cisco-nx-cli-5.15",
                    "templateMap": {
                        "analyticsTmpl": "jushao_diff_test",
                        "checkImage": "SCB_CheckImageTransfer",
                        "dynaTmpl": "SCB_download_image_template",
                        "postCheck": "SCB_post_check_template",
                        "preCheck": "SCB_pre_check_template",
                    }
                }],
                "abortOnFailure": null,
                "batchSize": null,
                "date": payload.scb_date,
                "time": payload.scb_time,
                "schedule": payload.scb_schedule,
                "scheduleType": false
            };
            met_value = JSON.stringify(met_value);
            const value = met_value.replace(/"/gi, '\"');
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/task/${dataPackage.id}/complete`,
                form: {
                    "variables": {
                        "formData": {
                            "value": value
                        }
                    }
                },
                headers: {
                    "Authorization": dataPackage.authToken,
                },
            };
            console.log(args.url);
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    const processInstanceId = dataPackage.processInstanceId
                    messageALL.push("submit_task             success");
                    callback(null, processInstanceId)
                } else {
                    const err_message = {
                        "error_stage": "submit_task",
                        "deviceName": payload.device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    // console.log(err_message);
                    messageALL.push("submit_task             failure");
                    callback(err_message, null);
                }
            });
        }

        let insert_response_table = function (processInstanceId, callback) {
            const date = new Date(new Date(payload.scb_date).getTime() - 86400000).Format("yyyy-MM-dd");
            const insertData = {
                "_id": processInstanceId,
                "startedAfter": date + "T22:00:00.000+0000",
                "startTime": payload.scb_date + " " + payload.scb_time,
                "deviceName": payload.device,
                "cve_id":cve_id
            };
            get_resData.create(insertData, function (err, response) {
                if (err) {
                    const err_message = {
                        "error_stage": "insert_response_table",
                        "deviceName": payload.device,
                        "body": err
                    };
                    messageALL.push("insert_response_table   failure");
                    callback(err_message, null);
                } else {
                    messageALL.push("insert_response_table   success");
                    callback(null, processInstanceId);
                }
            });
        }

        async.waterfall(
            [
                get_token,
                insert_main_data,
                submit_workflow,
                get_task_ID,
                submit_task,
                insert_response_table
            ], function (err, data) {
                if (err) {
                    console.log(err);
                    messageALL.push("main_workflow            failure");
                    resultALL.push({success: false, error_message: err});
                } else {
                    messageALL.push("main_workflow            success");
                    resultALL.push({success: true, result: messageALL});
                }
                if (resultALL.length === payloads.length){
                    cve_list.find({"cveid":cve_id},{"seek_vendor_list":1, "_id":0}, function (error, response) {
                        if (error) {
                            console.log(error);
                        } else {
                            // const seek_vendor_list = response[0].seek_vendor_list;
                            // for (const device of device_list) {
                            //     let i = seek_vendor_list.indexOf(device)
                            //     seek_vendor_list.splice(i, 1)
                            // }
                            // cve_list.updateOne({"cveid":cve_id}, {$set:{"current_status":"In-process", "seek_vendor_list":seek_vendor_list, "submit_device_list":device_list}}, function (error, response) {
                            cve_list.updateOne({"cveid":cve_id}, {
                            	$set:{"current_status":"In-process"}, 
                            	$addToSet:{"submit_device_list":payload.device}, 
                            	$pull:{"seek_vendor_list":payload.device}
                            },function (error, response) {
                                console.log(error);
                            });
                        }
                    })
                    res.status(200).json({success: true, result: resultALL}).end('');
                }
            })
    }
}

exports.cve_status = function (req, res, next) {
    const deviceName = req.body.deviceName;
    osupgrade_info.find({"_id":deviceName}, {"cve_id":1, "_id":1}, function (error, response) {
        const cve_id = response[0].cve_id;
        cve_list.find({"cveid":cve_id}, {"submit_device_list":1, "device_list":1, "_id":0}, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                let device_pool = [];
                const submit_device_list = response[0].submit_device_list;
                const device_list = response[0].device_list;

                let i = submit_device_list.indexOf(deviceName);
                if (i !== -1){
                    submit_device_list.splice(i, 1)
                }

                for (const list of device_list) {
                    device_pool.push(list.device);
                }
                let j = device_pool.indexOf(deviceName);
                if (j !== -1){
                    device_list.splice(j, 1)
                }

                cve_list.updateOne({"cveid":cve_id}, {$set:{"device_list":device_list, "submit_device_list":submit_device_list}}, function (error) {
                    if (error){
                        // console.log("update cve list error: " + JSON.stringify(error));
                        res.json({success: true, result: "update cve list error: " + JSON.stringify(error)}).end('');
                    } else {
                        res.status(200).json({success: true}).end('');
                    }
                });
            }
        });
    })
}

exports.data_storage_cveList = function(req, res, next) {
    const whereStr = req.body.whereStr;
    const updateStr = req.body.updateStr;
    cve_list.updateOne(whereStr, updateStr, function(err, response){
        if(err){
            res.json({success: false, result: err}).end('');
        } else {
            res.status(200).json({success: true, result: response}).end('');
        }
    })
}

exports.assessment_workflow_start = function (req, res) {
    let message = [];
    const cve_id = req.body.cve_id;
    const deviceList = req.body.device_list;
    cve_list.find({"cveid":cve_id}, {seek_vendor_list:1, submit_device_list: 1, _id: 0}, function (error, response) {
        if (error) {
            res.json({success: false, flag: true, result: message, error: error}).end('');
        } else {
            // if (response[0].seek_vendor_list.length !== 0 || response[0].submit_device_list.length !== 0) {
            let device_flag = false;
            let msg;
            for (const device of deviceList) {
            	console.log("deviceList ---> ", deviceList);
            	console.log("device ---> ", device);
            	console.log(response[0].seek_vendor_list.indexOf(device));
                if (response[0].seek_vendor_list.indexOf(device) !== -1 || response[0].submit_device_list.indexOf(device) !== -1) {
                    device_flag = true;
                    msg = "The selected device " + device + " already exists in the upgrade list";
                    break;
                }
            }
            if (device_flag) {
                res.status(200).json({success: true, flag: false, result: msg, data: response[0]}).end('');
            } else {
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
                            message.push("get_token                         success");
                            callback(null, authToken);
                        } else {
                            const err_message = {
                                "error_stage": "get_token",
                                "status_code": response.statusCode,
                                "body": JSON.parse(response.body)
                            };
                            message.push("get_token                         failure");
                            callback(err_message, null);
                        }
                    });
                }

                let submit_workflow = function (authToken, callback) {
                    const args = {
                        url: `${CORE_API}/api/v1.0/workflow/process-definition/${ASSESSMENT_WORKFLOW_ID}/submit-form`,
                        headers: {
                            "Authorization": authToken,
                        }
                    };
                    request.post(args, function (error, response, data) {
                        if (!error && response.statusCode === 200) {
                            data = JSON.parse(data);
                            const dataPackage = {
                                authToken: authToken,
                                processInstanceId: data.id
                            }
                            message.push("submit_workflow                   success");
                            callback(null, dataPackage)
                        } else {
                            const err_message = {
                                "error_stage": "submit_workflow",
                                "status_code": response.statusCode,
                                "body": JSON.parse(response.body)
                            };
                            message.push("submit_workflow                   failure");
                            callback(err_message, null);
                        }
                    });
                }

                let save_processInstanceId = function(dataPackage, callback) {
                    const whereStr = {"cveid": cve_id};
                    const updateStr = {$addToSet:{"process_instance_id": dataPackage.processInstanceId}};
                    cve_list.updateOne(whereStr, updateStr, function(err){
                        if(err){
                            message.push("save_processInstanceId            failure");
                            callback(err, null);
                        } else {
                            message.push("save_processInstanceId            success");
                            callback(null, dataPackage);
                        }
                    })
                }

                let get_task_ID = function (dataPackage, callback) {
                    const args = {
                        url: `${CORE_API}/api/v1.0/workflow/tasks`,
                        headers: {
                            "Authorization": dataPackage.authToken
                        }
                    };
                    request.get(args, function (error, response, data) {
                        if (!error && response.statusCode === 200) {
                            data = JSON.parse(data);
                            for(const dataOne of data){
                                if(dataOne.processInstanceId === dataPackage.processInstanceId){
                                    dataPackage["id"] = dataOne.id;
                                }
                            }
                            console.log("dataPackage.id ----> " + dataPackage.id);
                            message.push("get_task_ID                       success");
                            callback(null, dataPackage)
                        } else {
                            const err_message = {
                                "error_stage": "get_task_ID",
                                "status_code": response.statusCode,
                                "body": JSON.parse(response.body)
                            };
                            message.push("get_task_ID                       failure");
                            callback(err_message, null);
                        }
                    });
                }

                let submit_task = function (dataPackage, callback) {
                    let met_value = {
                        "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": JSON.stringify(deviceList)}],
                        "nedTemplatesJson": [{
                            "platformName": "cisco-nx-cli-5.15",
                            "templateMap": {
                                "analyticsTmpl": null
                            }
                        }],
                        "abortOnFailure": null,
                        "batchSize": null,
                        "date": "2020-12-01",
                        "time": "05:15",
                        "schedule": "now",
                        "scheduleType": false,
                        "deviceList":deviceList,
                        "cveid":cve_id
                    };
                    met_value = JSON.stringify(met_value);
                    const args = {
                        url: `${CORE_API}/api/v1.0/workflow/task/${dataPackage.id}/complete`,
                        form: {
                            "variables": {
                                "formData": {
                                    "value": met_value
                                }
                            }
                        },
                        headers: {
                            "Authorization": dataPackage.authToken,
                        },
                    };
                    request.post(args, function (error, response, data) {
                        if (!error && response.statusCode === 200) {
                            const processInstanceId = dataPackage.processInstanceId;
                            message.push("submit_task                       success");
                            callback(null, {processInstanceId: processInstanceId})
                        } else {
                            const err_message = {
                                "error_stage": "submit_task",
                                "status_code": response.statusCode,
                                "body": JSON.parse(response.body)
                            };
                            message.push("submit_task                       failure");
                            callback(err_message, null);
                        }
                    });
                }

                async.waterfall([
                    get_token,
                    submit_workflow,
                    save_processInstanceId,
                    get_task_ID,
                    submit_task
                ], function (err, data) {
                    console.log(data);
                    if (err) {
                        message.push("assessment_workflow_getSolution   failure");
                        res.json({success: false, flag: true, result: message, error: err}).end('');
                    } else {
                        message.push("assessment_workflow_getSolution   success");
                        res.status(200).json({success: true, flag: true, result: message, data: data}).end('');
                    }
                })}
        }
    })
}

exports.assessment_workflow_subTask = function (req, res) {
    let message = [];
    const cve_id = req.body.cve_id;
    const deviceList = req.body.device_list;
    const workflow_data = req.body.workflow;

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
                message.push("get_token                     success");
                callback(null, authToken);
            } else {
                const err_message = {
                    "error_stage": "get_token",
                    "status_code": response.statusCode,
                    "body": JSON.parse(response.body)
                };
                message.push("get_token                     failure");
                callback(err_message, null);
            }
        });
    }

    let get_processInstanceSubId = function (authToken, callback) {
        cve_list.find({"cveid":cve_id}, {"device_list":1, "_id":0}, function (error, response) {
            if (error) {
                message.push("get_processInstanceSubId      failure");
                callback(error, null);
            } else {
                let process_instance_id_sub = [];
                const device_list_data = response[0].device_list
                for (const device of deviceList) {
                    for (const list_data of device_list_data){
                        if(device === list_data.device){
                            process_instance_id_sub.push(list_data.process_instance_id_sub);
                        }
                    }

                    for (const workflow of workflow_data) {
                        console.log(workflow);
                        if(device === workflow.device){
                            process_instance_id_sub.push(workflow);
                        }
                    }

                }
                console.log(process_instance_id_sub);
                const dataPackage = {
                    authToken: authToken,
                    processInstanceId:process_instance_id_sub
                }
                message.push("get_processInstanceSubId      success");
                callback(null, dataPackage);
            }
        });
    }

    let get_task_ID = function (dataPackage, callback) {
        const id = [];
        const args = {
            url: `${CORE_API}/api/v1.0/workflow/tasks`,
            headers: {
                "Authorization": dataPackage.authToken
            }
        };
        request.get(args, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                data = JSON.parse(data);
                for(const dataOne of data){
                    for(const processInstanceId of dataPackage.processInstanceId){
                        if(dataOne.processInstanceId === processInstanceId){
                            id.push(dataOne.id);
                        }
                    }
                }
                dataPackage["id"] = id;
                message.push("get_task_ID                   success");
                callback(null, dataPackage)
            } else {
                const err_message = {
                    "error_stage": "get_task_ID",
                    "status_code": response.statusCode,
                    "body": JSON.parse(response.body)
                };
                message.push("get_task_ID                   failure");
                callback(err_message, null);
            }
        });
    }

    async.waterfall(
        [
            get_token,
            get_processInstanceSubId,
            get_task_ID
        ], function (err, data) {
            if (err) {
                message.push("assessment_workflow_subTask   failure");
                res.status(200).json({success: false, result: message, error: err}).end('');
            } else {
                let count =0;
                const id_list = data.id;
                const authToken = data.authToken;
                console.log("length ---> "+id_list.length);

                async.whilst(
                    function () {
                        return count < id_list.length;
                        //cb(null, count < id_list.length);
                    },

                    function (callback) {
                        console.log("count --> " + count);
                        console.log("id --> " + id_list[count]);
                        let met_value = {
                            "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": "null"}],
                            "nedTemplatesJson": [{
                                "platformName": "cisco-nx-cli-5.15",
                                "templateMap": {
                                    "analyticsTmpl": null
                                }
                            }],
                            "abortOnFailure": null,
                            "batchSize": null,
                            "date": "2020-12-01",
                            "time": "05:15",
                            "schedule": "now",
                            "scheduleType": false
                        };
                        met_value = JSON.stringify(met_value);
                        const args = {
                            url: `${CORE_API}/api/v1.0/workflow/task/${id_list[count]}/complete`,
                            form: {
                                "variables": {
                                    "formData": {
                                        "value": met_value
                                    }
                                }
                            },
                            headers: {
                                "Authorization": authToken,
                            },
                        };
                        request.post(args, function (error, response, data) {
                            if (!error && response.statusCode === 200) {
                                count++;
                                callback(null, count);
                            } else {
                                const err_message = {
                                    "error_stage": "submit_task",
                                    "task id": id_list[count],
                                    "status_code": response.statusCode,
                                    "body": JSON.parse(response.body)
                                };
                                callback(err_message, null);
                            }
                        });
                    },

                    function (err){
                        if(err){
                            message.push("assessment_workflow_subTask   failure");
                            res.status(200).json({success: false, result: message, error: err}).end('');
                        } else {
                            const SM_id = [];
                            const args = {
                                url: `${CORE_API}/api/v1.0/workflow/tasks`,
                                headers: {
                                    "Authorization": authToken
                                }
                            };
                            request.get(args, function (error, response, result) {
                                if (!error && response.statusCode === 200) {
                                    result = JSON.parse(result);
                                    for(const resultOne of result){
                                        for(const processInstanceId of data.processInstanceId){
                                            if(resultOne.processInstanceId === processInstanceId){
                                                SM_id.push(resultOne.id);
                                                const n = data.processInstanceId.indexOf(processInstanceId);
                                                SM_id.push(data.processInstanceId[n+1]);
                                            }
                                        }
                                    }
                                    data["SM_id"] = SM_id;
                                    message.push("get_task_ID                   success");

                                    let i = 0;
                                    const SM_id_list = data.SM_id;
                                    async.whilst(
                                        function () {
                                            return i < SM_id_list.length;
                                            //cb(null, i < SM_id_list.length);
                                        },

                                        function (callback) {
                                            console.log("i --> " + i);
                                            console.log("SM_id --> " + SM_id_list[i]);
                                            const new_workflow_data = {
                                                "cve_id": cve_id,
                                                "workflow":[
                                                    SM_id_list[i+1]
                                                ]
                                            };
                                            let met_value = {
                                                "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": "null"}],
                                                "nedTemplatesJson": [{
                                                    "platformName": "cisco-nx-cli-5.15",
                                                    "templateMap": {
                                                        "analyticsTmpl": null
                                                    }
                                                }],
                                                "abortOnFailure": null,
                                                "batchSize": null,
                                                "date": "2020-12-01",
                                                "time": "05:15",
                                                "schedule": "now",
                                                "scheduleType": false,
                                                "workflow_data":new_workflow_data
                                            };
                                            met_value = JSON.stringify(met_value);
                                            const args = {
                                                url: `${CORE_API}/api/v1.0/workflow/task/${SM_id_list[i]}/complete`,
                                                form: {
                                                    "variables": {
                                                        "formData": {
                                                            "value": met_value
                                                        }
                                                    }
                                                },
                                                headers: {
                                                    "Authorization": authToken,
                                                },
                                            };
                                            request.post(args, function (error, response, data) {
                                                if (!error && response.statusCode === 200) {
                                                    i+=2;
                                                    callback(null, i);
                                                } else {
                                                    const err_message = {
                                                        "error_stage": "submit_task",
                                                        "task id": SM_id_list[i],
                                                        "status_code": response.statusCode,
                                                        "body": JSON.parse(response.body)
                                                    };
                                                    callback(err_message, null);
                                                }
                                            });
                                        },

                                        function (err){
                                            if(err){
                                                message.push("assessment_workflow_subTask   failure");
                                                res.status(200).json({success: false, result: message, error: err}).end('');
                                            } else {
                                                message.push("assessment_workflow_subTask   success");
                                                res.status(200).json({success: true, result: message, data: data}).end('');
                                            }
                                        });
                                } else {
                                    const err_message = {
                                        "error_stage": "get_task_ID",
                                        "status_code": response.statusCode,
                                        "body": JSON.parse(response.body)
                                    };
                                    message.push("get_task_ID                   failure");
                                    message.push("assessment_workflow_subTask   success");
                                    res.json({success: false, result: message, err_message: err_message}).end('');
                                }
                            });
                        }
                    });
            }
        })
}

exports.dry_run_workflow = function (req, res) {
    let resultALL = [];
    const deviceList = req.body.deviceList;

    for (const device of deviceList) {
        let messageALL = [];
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
                    messageALL.push("get_token               success");
                    callback(null, authToken);
                } else {
                    const err_message = {
                        "error_stage": "get_token",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_token               failure");
                    callback(err_message, null);
                }
            });
        }

        let submit_workflow = function (authToken, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/process-definition/${DRY_RUN_WORKFLOW_ID}/submit-form`,
                headers: {
                    "Authorization": authToken,
                }
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    const dataPackage = {
                        authToken: authToken,
                        processInstanceId: data.id
                    }
                    messageALL.push("submit_workflow         success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "submit_workflow",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("submit_workflow         failure");
                    callback(err_message, null);
                }
            });
        }

        let get_task_ID = function (dataPackage, callback) {
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/tasks`,
                headers: {
                    "Authorization": dataPackage.authToken
                }
            };
            request.get(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = JSON.parse(data);
                    for(const dataOne of data){
                        if(dataOne.processInstanceId === dataPackage.processInstanceId){
                            dataPackage["id"] = dataOne.id;
                        }
                    }
                    messageALL.push("get_task_ID             success");
                    callback(null, dataPackage)
                } else {
                    const err_message = {
                        "error_stage": "get_task_ID",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    messageALL.push("get_task_ID             failure");
                    callback(err_message, null);
                }
            });
        }

        let submit_task = function (dataPackage, callback) {
            console.log(dataPackage);
            let met_value = {
                "selectedDevicesJson": [{"platformName": "cisco-nx-cli-5.15", "deviceName": device}],
                "nedTemplatesJson": [{
                    "platformName": "cisco-nx-cli-5.15",
                    "templateMap": {
                        "analyticsTmpl": null,
                        "preCheck": "SCB_pre_check_template",
                        "postCheck": "SCB_post_check_template"
                    }
                }],
                "abortOnFailure": null,
                "batchSize": null,
                "date": "2020-12-01",
                "time": "05:15",
                "schedule": "now",
                "scheduleType": false
            };
            met_value = JSON.stringify(met_value);
            const args = {
                url: `${CORE_API}/api/v1.0/workflow/task/${dataPackage.id}/complete`,
                form: {
                    "variables": {
                        "formData": {
                            "value": met_value
                        }
                    }
                },
                headers: {
                    "Authorization": dataPackage.authToken,
                },
            };
            request.post(args, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    const processInstanceId = dataPackage.processInstanceId
                    messageALL.push("post_check              success");
                    callback(null, processInstanceId)
                } else {
                    const err_message = {
                        "error_stage": "submit_task",
                        "deviceName": device,
                        "status_code": response.statusCode,
                        "body": JSON.parse(response.body)
                    };
                    console.log(err_message);
                    messageALL.push("post_check              failure");
                    callback(null, err_message);
                }
            });
        }

        async.waterfall(
            [
                get_token,
                submit_workflow,
                get_task_ID,
                submit_task
            ], function (err, data) {
                if (err) {
                    messageALL.push("dry_run         failure");
                    resultALL.push({success: false, error_message: err});
                } else {
                    messageALL.push("dry_run         success");
                    resultALL.push({success: true, result: messageALL});
                }
                if (resultALL.length === deviceList.length){
                    res.status(200).json({success: true, result: resultALL}).end('');
                }
            })
    }
}

exports.live_status = function (req, res) {
    let flagALL = {
        preCheck_flag: false,
        connectedDevice_flag: false,
        upgrade_flag: false,
        postCheck_flag: false
    };
    let dataAll = {
        trace_logs_pre:"",
        trace_logs_connect:"",
        trace_logs_upgrade:"",
        trace_logs_post:""
    };
    console.log(row_number_map);
    const device_name = req.body.device_name;
    if (row_number_map[device_name] === undefined) {
        const args = {
            url: `${NSO_FLASK_API}/live_status_log_start`,
            body: {
                "device_name": device_name
            },
            json:true
        };
        request.post(args, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                row_number_map[device_name] = data
                const whereStr = {"_id": device_name};
                const conditionStr = {_id: 0, trace_logs_pre: 1, trace_logs_connect: 1, trace_logs_upgrade: 1, trace_logs_post: 1, connected_device: 1};
                osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                    // const asr = response[0].connected_device[0].device;
                    // console.log(asr);
                    let asr = "";
                    if (response[0].hasOwnProperty("connected_device")) {
                        if (response[0].connected_device[0].hasOwnProperty("device")) {
                            asr = response[0].connected_device[0].device;
                        }
                    }
                    console.log(asr);
                    // let asr_list = [];
                    // for (const asr_info of response[0].connected_device) {
                    //     asr_list.push(asr_info.device);
                    // }
                    // console.log(asr_list);
                    const args = {
                        url: `${NSO_FLASK_API}/live_status_log_end`,
                        body: {
                            "device_name": device_name,
                            "row_number": row_number_map[device_name]
                        },
                        json:true
                    };
                    const args_conn_start = {
                        url: `${NSO_FLASK_API}/connect_device_upgrade_log_start`,
                        body: {
                            "device_list": [asr]
                        },
                        json:true
                    };
                    const args_conn_end = {
                        url: `${NSO_FLASK_API}/connect_device_upgrade_log_end`,
                        body: {
                            "device_list": [asr]
                        },
                        json:true
                    };
                    const args_conn_getLogs = {
                        url: `${NSO_FLASK_API}/get_connect_device_upgrade_log`,
                        body: {
                            "device_list": [asr]
                        },
                        json:true
                    };
                    if (err) {
                        res.json({success: false, flag: flagALL, data: dataAll}).end('');
                    } else {
                        const logs = response[0];
                        if (logs.trace_logs_pre === ""){
                            request.post(args, function (error, response, data) {
                                if (!error && response.statusCode === 200) {
                                    row_number_map[device_name] = data.current_row_number;
                                    if (data.trace_log !== "") {
                                        dataAll["trace_logs_pre"] = JSON.stringify(data.trace_log);
                                    } else {
                                        dataAll["trace_logs_pre"] = data.trace_log;
                                    }
                                    res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                } else {
                                    res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                }
                            })
                        } else {
                            flagALL["preCheck_flag"] = true;

                            osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                                if (err) {
                                    res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                } else {
                                    dataAll["trace_logs_pre"] = response[0].trace_logs_pre;
                                    if (logs.trace_logs_connect === ""){
                                        // if (asr === "") {
                                        //     dataAll["trace_logs_connect"] = JSON.stringify([""]);
                                        //     res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                        // } else {
                                            request.post(args_conn_start, function (error, response) {
                                                if (!error && response.statusCode === 200) {
                                                    sleep(2000);
                                                    request.post(args_conn_end, function (error, response) {
                                                        if (!error && response.statusCode === 200) {
                                                            request.post(args_conn_getLogs, function (error, response, data) {
                                                                if (!error && response.statusCode === 200) {
                                                                    data = handleLog(data);
                                                                    if (data !== "") {
                                                                        dataAll["trace_logs_connect"] = JSON.stringify(data);
                                                                    } else {
                                                                        dataAll["trace_logs_connect"] = data;
                                                                    }
                                                                    res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                                                } else {
                                                                    res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                                }
                                                            })
                                                        } else {
                                                            res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                        }
                                                    })
                                                } else {
                                                    res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                }
                                            })
                                        // }

                                        // request.post(args, function (error, response, data) {
                                        //         if (!error && response.statusCode === 200) {
                                        //         row_number_map[device_name] = data.current_row_number;
                                        //         if (data.trace_log !== "") {
                                        //             dataAll["trace_logs_connect"] = JSON.stringify(data.trace_log);
                                        //         } else {
                                        //             dataAll["trace_logs_connect"] = data.trace_log;
                                        //         }
                                        //         res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                        //     } else {
                                        //         res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                        //     }
                                        // })

                                    } else {
                                        flagALL["connectedDevice_flag"] = true;

                                        osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                                            if (err) {
                                                res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                            } else {
                                                dataAll["trace_logs_connect"] = response[0].trace_logs_connect;
                                                if (logs.trace_logs_upgrade === ""){
                                                    request.post(args, function (error, response, data) {
                                                        if (!error && response.statusCode === 200) {
                                                            row_number_map[device_name] = data.current_row_number;
                                                            if (data.trace_log !== "") {
                                                                dataAll["trace_logs_upgrade"] = JSON.stringify(data.trace_log);
                                                            } else {
                                                                dataAll["trace_logs_upgrade"] = data.trace_log;
                                                            }
                                                            res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                                        } else {
                                                            res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                        }
                                                    })
                                                } else {
                                                    flagALL["upgrade_flag"] = true;

                                                    osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                                                        if (err) {
                                                            res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                        } else {
                                                            dataAll["trace_logs_upgrade"] = response[0].trace_logs_upgrade;
                                                            if (logs.trace_logs_post === ""){
                                                                request.post(args, function (error, response, data) {
                                                                    if (!error && response.statusCode === 200) {
                                                                        row_number_map[device_name] = data.current_row_number;
                                                                        if (data.trace_log !== "") {
                                                                            dataAll["trace_logs_post"] = JSON.stringify(data.trace_log);
                                                                        } else {
                                                                            dataAll["trace_logs_post"] = data.trace_log;
                                                                        }
                                                                        res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                                                    } else {
                                                                        res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                                    }
                                                                })
                                                            } else {
                                                                flagALL["postCheck_flag"] = true;

                                                                osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                                                                    if (err) {
                                                                        res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                                    } else {
                                                                        dataAll["trace_logs_post"] = response[0].trace_logs_post;
                                                                        res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    }
                })
            } else {
                res.json({success: false, flag: flagALL, data: dataAll}).end('');
            }
        })
    } else {
        const whereStr = {"_id": device_name};
        const conditionStr = {_id: 0, trace_logs_pre: 1, trace_logs_connect: 1, trace_logs_upgrade: 1, trace_logs_post: 1, connected_device: 1};
        osupgrade_info.find(whereStr, conditionStr, function (err, response) {
            // const asr = response[0].connected_device[0].device;
            // console.log(asr);
            let asr = "";
            if (response[0].hasOwnProperty("connected_device")) {
                if (response[0].connected_device[0].hasOwnProperty("device")) {
                    asr = response[0].connected_device[0].device;
                }
            }
            console.log(asr);
            const args = {
                url: `${NSO_FLASK_API}/live_status_log_end`,
                body: {
                    "device_name": device_name,
                    "row_number": row_number_map[device_name]
                },
                json:true
            };
            const args_conn_start = {
                url: `${NSO_FLASK_API}/connect_device_upgrade_log_start`,
                body: {
                    "device_list": [asr]
                },
                json:true
            };
            const args_conn_end = {
                url: `${NSO_FLASK_API}/connect_device_upgrade_log_end`,
                body: {
                    "device_list": [asr]
                },
                json:true
            };
            const args_conn_getLogs = {
                url: `${NSO_FLASK_API}/get_connect_device_upgrade_log`,
                body: {
                    "device_list": [asr]
                },
                json:true
            };
            if (err) {
                res.json({success: false, flag: flagALL, data: dataAll}).end('');
            } else {
                const logs = response[0];
                if (logs.trace_logs_pre === ""){
                    request.post(args, function (error, response, data) {
                        if (!error && response.statusCode === 200) {
                            row_number_map[device_name] = data.current_row_number;
                            if (data.trace_log !== "") {
                                dataAll["trace_logs_pre"] = JSON.stringify(data.trace_log);
                            } else {
                                dataAll["trace_logs_pre"] = data.trace_log;
                            }
                            res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                        } else {
                            res.json({success: false, flag: flagALL, data: dataAll}).end('');
                        }
                    })
                } else {
                    flagALL["preCheck_flag"] = true;

                    osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                        if (err) {
                            res.json({success: false, flag: flagALL, data: dataAll}).end('');
                        } else {
                            dataAll["trace_logs_pre"] = response[0].trace_logs_pre;
                            if (logs.trace_logs_connect === ""){
                                // if (asr === "") {
                                //     dataAll["trace_logs_connect"] = JSON.stringify([""]);
                                //     res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                // } else {
                                    request.post(args_conn_start, function (error, response) {
                                        if (!error && response.statusCode === 200) {
                                            sleep(2000);
                                            request.post(args_conn_end, function (error, response) {
                                                if (!error && response.statusCode === 200) {
                                                    request.post(args_conn_getLogs, function (error, response, data) {
                                                        if (!error && response.statusCode === 200) {
                                                            data = handleLog(data);
                                                            if (data !== "") {
                                                                dataAll["trace_logs_connect"] = JSON.stringify(data);
                                                            } else {
                                                                dataAll["trace_logs_connect"] = data;
                                                            }
                                                            res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                                        } else {
                                                            res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                        }
                                                    })
                                                } else {
                                                    res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                }
                                            })
                                        } else {
                                            res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                        }
                                    })
                                // }

                                // request.post(args, function (error, response, data) {
                                //     if (!error && response.statusCode === 200) {
                                //         row_number_map[device_name] = data.current_row_number;
                                //         if (data.trace_log !== "") {
                                //             dataAll["trace_logs_connect"] = JSON.stringify(data.trace_log);
                                //         } else {
                                //             dataAll["trace_logs_connect"] = data.trace_log;
                                //         }
                                //         res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                //     } else {
                                //         res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                //     }
                                // })
                            } else {
                                flagALL["connectedDevice_flag"] = true;

                                osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                                    if (err) {
                                        res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                    } else {
                                        dataAll["trace_logs_connect"] = response[0].trace_logs_connect;
                                        if (logs.trace_logs_upgrade === ""){
                                            request.post(args, function (error, response, data) {
                                                if (!error && response.statusCode === 200) {
                                                    row_number_map[device_name] = data.current_row_number;
                                                    if (data.trace_log !== "") {
                                                        dataAll["trace_logs_upgrade"] = JSON.stringify(data.trace_log);
                                                    } else {
                                                        dataAll["trace_logs_upgrade"] = data.trace_log;
                                                    }
                                                    res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                                } else {
                                                    res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                }
                                            })
                                        } else {
                                            flagALL["upgrade_flag"] = true;

                                            osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                                                if (err) {
                                                    res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                } else {
                                                    dataAll["trace_logs_upgrade"] = response[0].trace_logs_upgrade;
                                                    if (logs.trace_logs_post === ""){
                                                        request.post(args, function (error, response, data) {
                                                            if (!error && response.statusCode === 200) {
                                                                row_number_map[device_name] = data.current_row_number;
                                                                if (data.trace_log !== "") {
                                                                    dataAll["trace_logs_post"] = JSON.stringify(data.trace_log);
                                                                } else {
                                                                    dataAll["trace_logs_post"] = data.trace_log;
                                                                }
                                                                res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                                            } else {
                                                                res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                            }
                                                        })
                                                    } else {
                                                        flagALL["postCheck_flag"] = true;

                                                        osupgrade_info.find(whereStr, conditionStr, function (err, response) {
                                                            if (err) {
                                                                res.json({success: false, flag: flagALL, data: dataAll}).end('');
                                                            } else {
                                                                dataAll["trace_logs_post"] = response[0].trace_logs_post;
                                                                res.status(200).json({success: true, flag: flagALL, data: dataAll}).end('');
                                                            }
                                                        })
                                                    }
                                                }
                                            })
                                        }
                                    }
                                })
                            }
                        }
                    })
                }
            }
        })
    }
}

exports.cp_os_image = function (req, res) {
    function copyDir(src, dist) {
        child_process.spawn('cp', ['-r', src, dist]);
    }

    copyDir("/home/bpa/image_server/test_image_file.txt", "/home/bpa/os_images/test_image_file.txt")

    res.json({success: true}).end('');
}

exports.check_device_up = function (req, res) {
    sleep(20000);
    const payload = req.body;

    let fetch_host_keys = function (callback) {
        const args = {
            url: `${NSO_API}/restconf/data/tailf-ncs:devices/fetch-ssh-host-keys`,
            body: payload,
            json:true,
            headers: {
                "Authorization": "Basic cm9vdDphZG1pbg==",
                "Cache-Control":"no-cache",
                "Accept":"application/yang-data+json",
                "Content-Type":"application/yang-data+json"
            },
        };
        request.post(args, function (error, response, data) {
            console.log(JSON.stringify(data));
            if (!error && response.statusCode === 200){
                if (data["tailf-ncs:output"]["fetch-result"][0].result === "failed"){
                    callback (data, null);
                } else {
                    callback (null, data);
                }
            } else {
                callback (data, null);
            }
        })
    }

    let sync_from = function (callback) {
        const args = {
            url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${payload.device[0]}/sync-from`,
            json:true,
            headers: {
                "Authorization": "Basic cm9vdDphZG1pbg==",
                "Cache-Control":"no-cache",
                "Accept":"application/yang-data+json",
                "Content-Type":"application/yang-data+json"
            },
        };
        request.post(args, function (error, response, data) {
            if (!error && response.statusCode === 200){
                console.log(JSON.stringify(data));
                if (data["tailf-ncs:output"].result === false) {
                    callback (data, null);
                } else {
                    callback (null, data);
                }
            } else {
                callback (data, null);
            }
        })
    }

    async.series([fetch_host_keys, sync_from], function (err, data) {
        if (err) {
            res.json({success: false, result: err});
        } else {
            res.status(200).json({success: true, result: "Device sync from successfully."}).end('');
        }
    })
}

function sleep(delay) {
    for (let t = Date.now(); Date.now() -t <= delay;);
}

handleLog = function (data){
    if (data.length === 0 || data === null) {
        data = "   no data      ";
    } 
    let items = new Array();
    items = data.split(", ");
    for (let i = 0; i < items.length; i++){
        items[i] = items[i].substring (1, items[i].length - 3);
    }
    return items;
}


exports.get_asr_device = function (req, res) {
    let asr_list = [];
    const device = req.body.device;
    osupgrade_info.find({"_id": device}, {connected_device: 1, _id: 0}, function (err, response) {
        if(err){
            res.json({ success: false, Error_Message: err }).end('');
        } else {
            if (response[0].connected_device.length !== 0){
                console.log(response[0].connected_device)
                for (const asr of response[0].connected_device) {
                    console.log(asr);
                    asr_list.push(asr.device);
                }
            }
            res.status(200).json({ success: true, asr_list: asr_list}).end('');
        }
    })
}

exports.scb_download_image_to_ftp = function (req, res, next) {
    const file_name = req.body.file_name;
    const args = {
        url: `${BPA_FLASK_API}/scb_download_image_to_ftp`,
        body: {
            "file_name": file_name,
        },
        json:true
    }
    request.post(args, function (error, response, data){
        if (!error && response.statusCode === 200) {
            res.status(200).json({success: true, result: data}).end('');
        } else {
            res.json({success: false , result: data}).end('');
        }
    });
}

exports.download_image_via_ms = function (req, res) {
    const device = req.body.device;
    console.log(device);
    let download_image_ms = function(callback) {
        const args = {
            url: `${NSO_API}/restconf/data/tailf-ncs:devices/device=${device}/live-status/tailf-ned-cisco-nx-stats:exec/any`,
            body:{
                "input": {
                    "args": "copy ftp://anonymous@10.124.196.148/nxos.7.0.3.I7.9.bin bootflash:nxos.7.0.3.I7.9.bin vrf management"
                }
            },
            json:true,
            headers: {
                "Authorization": "Basic cm9vdDphZG1pbg==",
                "Cache-Control":"no-cache",
                "Accept":"application/yang-data+json",
                "Content-Type":"application/yang-data+json"
            }
        };
        request.post(args, function (error, response, data) {
            console.log(error);
            console.log(response);
            console.log(data);
            if (error){
                callback(error, null);
            } else {
                callback(null, data);
            }
        })
    }

    async.series([download_image_ms], function (err, data) {
        if (err) {
            res.json({success: false, result: err});
        } else {
            res.status(200).json({success: true, result: data}).end('');
        }
    })
}