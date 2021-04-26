
const cheerio = require("cheerio");
const request = require('request');
var mammoth = require("mammoth");
const cve =require('../models/cve_list.model');

const fs =require('fs');

let url_list = [];
let cve_list=[];
let messageALL=[];
var i=0;


exports.upload_txt = function(req, res, next) {
    const absolutePath = req.file.path;
    const fileFullName=req.file.filename;
    const fileName=fileFullName.split(".docx")[0];
    // const jsonString = fs.readFileSync(absolutePath, "utf-8");
    mammoth.extractRawText({path: absolutePath})
        .then(function (result) {
            var text = result.value; // The raw text
            fs.writeFile(fileName+'.txt',text,function (err) {
                if(err){
                    return console.error(err)
                }
                 read_SA_txt_file(fileName+'.txt');
                //console.log('cveId:'+cve_id);
               // res.send(cve_id);

            })
        }).done();
    // while (i===url_list.length-1) {
    //     res.send(cve_list)
    // }


    read_SA_txt_file = function(absolutePath) {
        i=0;
        console.log('absolutePath:'+absolutePath)
        url_list = [];
        let cve_list=[];
        var c=0;
        // const absolutePath = "C:\\Users\\Chengrfa\\Desktop\\SCB_POV_v2\\PSIRT_20201006_1945.txt";
        //const absolutePath = "output.txt";

        const raw_data = fs.readFileSync(absolutePath, "utf-8");
        // console.log(raw_data);
        const new_data = raw_data.split("\n");
        // console.log(typeof new_data);
        // console.log(new_data);
        for (const d of new_data) {
            if (d.search("URL: ") !== -1) {
                url_list.push(d.replace("URL: ", ""));
            }
        }
        console.log(url_list.length);
        for (const url of url_list) {
            request.get(url, function (error, response, data) {


                if (!error)
                {

                    const $ = cheerio.load(data);
                    const arr = $('div[class="inlineblock divPaddingTen"]').html();
                    // console.log('i:' + i + 'cve-id:' + arr);
                    // i++;
                    // break;
                    if (cve_list.indexOf(arr)==-1)
                    {
                        const cve_data = {
                            "cveid": arr,
                            "security": "high",
                            "owner": "Cisco",
                            "current_status": "Not start",
                            "target_resolution_date": "2021-12-31",
                            "remediation_availability": "Yes",
                            "device_type":"",
                            "current_os_version":"",
                            "module_or_feature_impacted":"",
                            "target_os_version":"",
                            "device_list":[],
                            "upgraded_device_list":[],
                            "process_instance_id":[],
                            "submit_device_list":[],
                            "seek_vendor_list":[]
                        };
                        cve.create(cve_data,function (err) {
                            if (err) {
                                const err_message = {
                                    "error_stage": "save cveInfo erro",
                                    "deviceName": arr,
                                    "body": err
                                };
                                messageALL.push(err_message);
                                
                            } 
                        });
                        cve_list.push(arr);
                        console.log('i:' + i + 'cve-id:' + arr);

                    }
                    i++;
                }
                else {
                    var arr= getCveId(url);
                    if (cve_list.indexOf(arr)==-1)
                    {
                        cve_list.push(arr);
                        const cve_data = {
                            "cveid": arr,
                            "security": "high",
                            "owner": "Cisco",
                            "current_status": "Not start",
                            "target_resolution_date": "2021-12-31",
                            "remediation_availability": "Yes",
                            "device_type":"",
                            "current_os_version":"",
                            "module_or_feature_impacted":"",
                            "target_os_version":"",
                            "device_list":[],
                            "upgraded_device_list":[],
                            "process_instance_id":[],
                            "submit_device_list":[],
                            "seek_vendor_list":[]
                        }
                        cve.create(cve_data,function (err) {
                            if (err) {
                                const err_message = {
                                    "error_stage": "save cveInfo erro",
                                    "deviceName": arr,
                                    "body": err
                                };
                                messageALL.push(err_message);
                                
                            } 
                        });
                    }
                    i++;
                }
                if(i===url_list.length-1)
                {
                   // res.send("cve_list":cve_list,)
                   res.status(200).json({cve_list: cve_list, result: messageALL}).end('');

                }
            })


        }
        // console.log('c:'+c)
        return  i;
    }

    getCveId=function (url) {
        request.get(url, function (error, response, data) {
            if (error)
            {
                console.log('执行递归函数')
                return getCveId(url);
            }
            else {
                const $ = cheerio.load(data);
                const arr = $('div[class="inlineblock divPaddingTen"]').html();

                return arr;
            }
        })
    }


}




