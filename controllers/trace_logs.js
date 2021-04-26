const request = require('request');
const async = require('async');

const osupgrade_info =require('../models/osupgrade_info.model');

const NSO_FLASK_API = "http://10.124.44.46:8081";

exports.get_trace_logs = function(req, res, next) {
    let device_name = req.body.device_name;
    const type = req.body.type;

    let log_end = function (callback) {
        const args = {
            url: `${NSO_FLASK_API}/log_end`,
            body: {
                "device_name": device_name,
                "type": type
            },
            json:true
        };
        request.post(args, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                callback(null, data);
            } else {
                callback(error, data);
            }
        })
    }

    let get_log = function (data, callback) {
        console.log(data);
        const args = {
            url: `${NSO_FLASK_API}/get_log`,
            body: {
                "device_name": device_name,
                "type": type
            },
            json:true
        };
        request.post(args, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                callback(null, data);
            } else {
                callback(error, data);
            }
        })
    }

    let save_logs = function (data, callback) {
        let trace_log_updateStr = {}
        if (device_name === "asr1") {
            device_name = "9k";
        }
        if (data.length === 0) {
            data = "no data";
        }
        data = handleLog(data);
        const trace_log_whereStr  = {"_id": device_name};
        if (type === "connect check"){
            trace_log_updateStr  = {$set:{"trace_logs_connect":JSON.stringify(data)}};
        }else if(type === "pre check"){
            trace_log_updateStr  = {$set:{"trace_logs_pre":JSON.stringify(data)}};
        }else if(type === "post check"){
            trace_log_updateStr  = {$set:{"trace_logs_post":JSON.stringify(data)}};
        }else if(type === "upgrade"){
            trace_log_updateStr  = {$set:{"trace_logs_upgrade":JSON.stringify(data)}};
        }
        osupgrade_info.updateOne(trace_log_whereStr, trace_log_updateStr, function (err, response) {
            if (err) throw callback(err, response);
            else {
                console.log(response);
                callback(null, data)
            }
        })
    }

    async.waterfall([log_end, get_log, save_logs], function (err, data) {
        console.log(err);
        console.log(data);
        if (err) {
            res.json({success: false, result: err}).end('');
        } else {
            res.status(200).json({success: true, result: data}).end('');
        }
    })
}

exports.display_trace_logs = function(req, res, next) {
    const device_name = req.body.device_name;
    const whereStr = {"_id": device_name};
    const conditionStr = {trace_logs_connect: 1,trace_logs_post: 1,trace_logs_pre: 1,trace_logs_upgrade: 1};
    osupgrade_info.find(whereStr, conditionStr, function (err, response) {
        if (err) {
            res.json({success: false, result: err}).end('');
        } else {
            res.status(200).json({success: true, result: response}).end('');
        }
    })
}

handleLog = function (data){
    if (data.length === 0 || data === null) {
        data = "   no data      ";
    } 
    let items = new Array();
    console.log("-----------------------------------------------------> handleLog items");
    console.log(data);
    items = data.split(", ");
    for (let i = 0; i < items.length; i++){
        items[i] = items[i].substring (1, items[i].length - 3);
    }
    return items;
}

exports.get_connect_device_upgrade_logs = function(req, res, next) {
    const device_name = req.body.device_name;
    const device_list = req.body.asr_list;

    let connect_device_upgrade_log_end = function (callback) {
        const args = {
            url: `${NSO_FLASK_API}/connect_device_upgrade_log_end_forworkflow`,
            body: {
                "device_list": device_list
            },
            json:true
        };
        request.post(args, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                callback(null, data);
            } else {
                callback(error, null);
            }
        })
    }

    let get_connect_device_upgrade_log = function (data, callback) {
        const args = {
            url: `${NSO_FLASK_API}/get_connect_device_upgrade_log_forworkflow`,
            body: {
                "device_list": device_list
            },
            json:true
        };
        request.post(args, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                data = handleLog(data);
                callback(null, data);
            } else {
                callback(error, null);
            }
        })
    }

    let save_logs = function (data, callback) {
        if (data === null) {
            data = "No Data";
        }
        const whereStr  = {"_id": device_name};
        const updateStr  = {$set:{"trace_logs_connect":JSON.stringify(data)}};

        osupgrade_info.updateOne(whereStr, updateStr, function (err, response) {
            if (err) {
                console.log(err);
                callback(err, response);
            } else {
                callback(null, data)
            }
        })
    }

    async.waterfall([
        connect_device_upgrade_log_end,
        get_connect_device_upgrade_log,
        save_logs
    ], function (err, data) {
        if (err) {
            res.json({success: false, result: err}).end('');
        } else {
            res.status(200).json({success: true, result: data}).end('');
        }
    })
}