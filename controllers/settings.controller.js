var request = require('request')
var async = require('async');
const https =require('https')
const cheerio = require("cheerio");
var mammoth = require("mammoth");
const fs =require('fs');
const cve_list =require('../models/cve_list.model');



exports.get_settings = function(req, res, next) {

    let get_settings_info = function (callback) {
        const args = {
            url: `http://10.124.44.166:9100/api/v1.0/settings/custom-form/SP_Datasource`,
            json:true
        };
        request.get(args, function (error, response, data) {
            if (!error ) {
                console.log('data:'+data)
                callback(null, data);
            } else {
                console.log('error:'+error)
                callback(error, null);
            }
        })
    }
    let get_setting_url = function (data, callback) {
        if (data === null) {
            data = "No Data";
            callback(null,data)
        }
        else {
       //     data = JSON.parse(data);
            var data=data.data;
            var cveInfo=data['cvelist_details'];
            var devicesInfo=data['cvelist_details'];
            console.log('cveInof:'+cveInfo)
            console.log('devicesInfo:'+devicesInfo)
            var info;
           // info.push(cveInfo,devicesInfo);
            info={
                cveInfo:cveInfo,
                devicesInfo:devicesInfo
            }
            console.log('info:'+info)
            callback(null,info)
        }

    }
    let importInfo=function (data,callback) {
        var cveInfo=data['cveInfo'];
        var devicesInfo=data['devicesInfo']


        var userName=cveInfo['username'];
        var password=cveInfo['password']

        var cveDatasource=cveInfo['datasource'];
        var cveUrl=cveInfo['url'];
        var devicesUrl=cveInfo['url'];
        var devicesDatasource=devicesInfo['datasource'];
if(cveDatasource==='Network Profiler')
{
        const args = {
            url:cveUrl ,
            auth: {
                'user':userName,
                'pass':password
            },
        };
        request.get(args, function (error, response, data) {
            var cveTable={};
            var infoList=new Array();
            if (!error ) {
                data=JSON.parse(data)
                var cveList=data.data
                //console.log('length:'+data.data.length)
                for (var cve of cveList)
                {
                    var cveId=cve['cveId']
                    var cveIds=new Array();
                    if (cveId!==null) {
                        cveIds = cveId.split(",");
                        for (var id of cveIds) {
                            if(cveTable.hasOwnProperty(id)===false)
                            {
                                cveTable[id]={
                                    "cveid":id,
                                    "security":cve['sir'],
                                    "owner": "Cisco",
                                    "current_status": "Not start",
                                    "target_resolution_date": "2020-12-15",
                                    "remediation_availability": "Yes",
                                    "device_list":[]
                                }
					                                infoList.push(cveTable[id])
                            }

                            //console.log('cveId:' + id)
                        }
                    }
                    }
                            console.log('cveTable:' + cveTable)

                cve_list.insertMany(infoList,function (err,response) {
                    if(err){
                        callback(error,null);

                    }
                    else{
			console.log(response);
                        callback(null, data)
                    }

                })


            } else {

                console.log(error);

                callback(error,null);
            }
        });
    }
    else{
         read_SA_txt_file(cveUrl);
        //callback(null,cveList)        
    }




       // callback(null,data);
    }
    async.waterfall([get_settings_info,get_setting_url,importInfo],function (err,data) {
        if (err) {
            res.json({success: false, result: err}).end('');
        } else {
            res.status(200).json({success: true}).end('');
        }
    })
    read_SA_txt_file = function(absolutePath) {
        i=0;
        var cveTable={};
        var infoList=new Array();
        url_list = [];
	var cveList=[];
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
        
        for (var url of url_list) {
            let options ={
                url:url,
                // headers:{
                //     'Connection':'keep-alive',
                // },
                // timeout:3000
            }
            request.get(options, function (error, response, data) {
                // console.log('在请求第'+i+'个Url:'+url_list[t])

                if (!error)
                {
                                        const $ = cheerio.load(data);
                                        arr = $('div[class="inlineblock divPaddingTen"]').html();
                    sir =$('div[id="severitycirclecontent"]').html()
                    // console.log('i:' + i + 'cve-id:' + arr);
                    // i++;
                    // break;
                    // if (cve_list.indexOf(arr)==-1)
                    // {

                    //     cve_list.push(arr);
                         console.log('i:' + i + 'cve-id:' + arr+'sir:'+sir);

                    // }
                    if(cveTable.hasOwnProperty(arr)===false)
                    {
                        cveTable[arr]={
                            "cveid":arr,
                            "security":sir,
                            "owner": "Cisco",
                            "current_status": "Not start",
                            "target_resolution_date": "2020-12-15",
                            "remediation_availability": "Yes",
                            "device_list":[]
                        }
                                            infoList.push(cveTable[arr]);
					cveList.push(arr);
                    }
                    i++;
                }
                else {
                    console.log('i:'+i+'erro:'+error)
                    console.log(url_list[t])
                    i++;
                    // var arr= getCveId(url);
                    // if (cve_list.indexOf(arr)==-1)
                    // {
                    //     cve_list.push(arr);
                    // }

                }
                if(i===url_list.length)
                {
                    cve_list.insertMany(infoList,function (err,response) {
                        if(err){
                            res.status(500).json({cve_list: cve_list,success:true}).end('');

                        }
                        else{
                            res.status(200).json({cve_list: cveList,success:true}).end('');

                        }
    
                    })
                    // res.send("cve_list":cve_list,)
                       // return cve_list;

                }
            })


        }
        // console.log('c:'+c)
        //return  i;
    }

}


exports.get_cve = function(req, res, next) {

    let get_settings_info = function (callback) {
        const args = {
            url: `http://10.124.44.166:9100/api/v1.0/settings/custom-form/SP_Datasource`,
            json:true
        };
        request.get(args, function (error, response, data) {
            if (!error ) {
                console.log('data:'+data)
                callback(null, data);
            } else {
                console.log('error:'+error)
                callback(error, null);
            }
        })
    }
    let get_setting_url = function (data, callback) {
        if (data === null) {
            data = "No Data";
            callback(null,data)
        }
        else {
            //     data = JSON.parse(data);
            var info=data.data;
            //console.log('url:'+url['Leaf-811897'])
            var url=info['url'];
            read_SA_txt_file(url)
            callback(null,info)
        }
    }

    let get_cve=function(data,callback){

    }
    async.waterfall([get_settings_info,get_setting_url],function (err,data) {
        if (err) {
            res.json({success: false, result: err}).end('');

        } else {
            res.status(200).json({success: true, data: data}).end('');
        }
    })

    read_SA_txt_file = function(absolutePath) {
        i=0;
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
        
        for (var url of url_list) {
            let options ={
                url:url,
                // headers:{
                //     'Connection':'keep-alive',
                // },
                // timeout:3000
            }
            request.get(options, function (error, response, data) {
                // console.log('在请求第'+i+'个Url:'+url_list[t])

                if (!error)
                {
                                        const $ = cheerio.load(data);
                                        arr = $('div[class="inlineblock divPaddingTen"]').html();
                    sir =$('div[id="severitycirclecontent"]').html()
                    // console.log('i:' + i + 'cve-id:' + arr);
                    // i++;
                    // break;
                    if (cve_list.indexOf(arr)==-1)
                    {

                        cve_list.push(arr);
                        console.log('i:' + i + 'cve-id:' + arr+'sir:'+sir);

                    }
                    i++;
                }
                else {
                    console.log('i:'+i+'erro:'+error)
                    console.log(url_list[t])
                    i++;
                    // var arr= getCveId(url);
                    // if (cve_list.indexOf(arr)==-1)
                    // {
                    //     cve_list.push(arr);
                    // }

                }
                if(i===url_list.length)
                {
                    // res.send("cve_list":cve_list,)
                       // return cve_list;
 res.status(200).json({cve_list: cve_list}).end('');

                }
            })


        }
        // console.log('c:'+c)
        //return  i;
    }



}



rread_SA_txt_file = function() {
    i=0;
    url_list = [];
    let cve_list=[];
    var c=0;
    const absolutePath = "PSIRT_20201006_1945.txt";
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

    return url_list;
    //return  i;
}



  exports.getData=function (req, res, next) {
    let get_settings_info = function (callback) {
        const args = {
            url: `http://10.124.44.166:9100/api/v1.0/settings/custom-form/SP_Datasource`,
            json:true
        };
        request.get(args, function (error, response, data) {
            if (!error ) {
                console.log('data:'+data)
                callback(null, data);
            } else {
                console.log('error:'+error)
                callback(error, null);
            }
        })
    }
    let get_setting_url = function (data, callback) {
        if (data === null) {
            data = "No Data";
            callback(null,data)
        }
        else {
       //     data = JSON.parse(data);
            var data=data.data;
            var cveInfo=data['cvelist_details'];
            var devicesInfo=data['cvelist_details'];
            console.log('cveInof:'+cveInfo)
            console.log('devicesInfo:'+devicesInfo)
            var info;
           // info.push(cveInfo,devicesInfo);
            info={
                cveInfo:cveInfo,
                devicesInfo:devicesInfo
            }
            console.log('info:'+info)
            callback(null,info)
        }

    }
    let importInfo=function (data,callback) {
        var cveInfo=data['cveInfo'];
        var devicesInfo=data['devicesInfo']


        var userName=cveInfo['username'];
        var password=cveInfo['password']

        var cveDatasource=cveInfo['datasource'];
        var cveUrl=cveInfo['url'];
        var devicesUrl=cveInfo['url'];
        var devicesDatasource=devicesInfo['datasource'];
        if(cveDatasource==='File')
{
    var deviceTable=[];
    var t=0;
    var urlList=rread_SA_txt_file();
    console.log(urlList.length)
    //     var deviceList=[];
    for(var url of urlList) {
        let options = {
            url: url,
            // headers:{
            //     'Connection':'keep-alive',
            // },
            // timeout:3000
        }
        request.get(options, function (error, response, data) {
            var deviceList="";

            //  console.log('i:'+urlList[i])
            if (!error) {
                try{
                    //console.log('url:'+options['url'])

                    const $ = cheerio.load(data);
                    const arr = $('div[class="ud-innercontent-area"][id="vulnerableproducts"]').html();
                    const cveId = $('div[class="inlineblock divPaddingTen"]').html();
                    const sir =$('div[id="severitycirclecontent"]').html()
                    var l = arr.split('<ul>');
                    var temp = l[1];
                    var temp2 = temp.split('</ul>')[0]
                    var list = temp2.split('<li>');
                    list.shift();
                    for (var devices of list) {
                        var deviceItem = devices.split("</li")[0];
                        //var device=deviceItem[0]+deviceItem[1]+deviceItem[2]+deviceItem[3];
                        if (checkHref(deviceItem))
                        {
                            deviceItem=deviceItem.split("(<a href=")[0];
                        }
                        if(deviceItem.indexOf("<br>"))
                        {
                            deviceItem=deviceItem.split("<br>")[0];
                        }
                        deviceList+=deviceItem+=',';
                    }
                    var obj={
                        "cveid":cveId,
                        "security":sir,
                        "owner": "Cisco",
                        "current_status": "Not start",
                        "target_resolution_date": "2020-12-15",
                        "remediation_availability": "Yes",
                        "device_type":deviceList
                    }
                    deviceTable.push(obj)
                    console.log('i:'+t+'deviceList:'+deviceList)
                    t++;
                    if (t===urlList.length-1) {
                        cve_list.insertMany(deviceTable,function (err,response) {
                            if(err){
                                callback(err,null)

                            }
                            else{
                                callback(null,deviceTable)
                            }

                        })

                    }
                }
                catch (e) {
                    // console.log('url:'+options['url'])
                    console.log('i:'+t+'erro:'+e)
                    t++;
                    if (t===urlList.length-1) {
                        cve_list.insertMany(deviceTable,function (err,response) {
                            if(err){
                                callback(err,null)

                            }
                            else{
                                callback(null,deviceTable)
                            }

                        })
                    }
                }
            }

        })
    }
    checkHref=function ( string) {
        if(string.indexOf("<a href")!=-1)
        {
            return true;
        }
        else {
            return false;
        }
    }
}
else{
    const args = {
        url:cveUrl ,
        auth: {
            'user':userName,
            'pass':password
        },
    };
    request.get(args, function (error, response, data) {
        var cveTable={};
        var infoList=new Array();
        if (!error ) {
            data=JSON.parse(data)
            var cveList=data.data
            //console.log('length:'+data.data.length)
            for (var cve of cveList)
            {
                var cveId=cve['cveId']
                var cveIds=new Array();
                if (cveId!==null) {
                    cveIds = cveId.split(",");
                    for (var id of cveIds) {
                        if(cveTable.hasOwnProperty(id)===false)
                        {
                            cveTable[id]={
                                "cveid":id,
                                "security":cve['sir'],
                                "owner": "Cisco",
                                "current_status": "Not start",
                                "target_resolution_date": "2020-12-15",
                                "remediation_availability": "Yes",
                                "device_list":[]
                            }
                                                infoList.push(cveTable[id])
                        }

                        //console.log('cveId:' + id)
                    }
                }
                }
                        console.log('cveTable:' + cveTable)

            cve_list.insertMany(infoList,function (err,response) {
                if(err){
                    callback(error,null);

                }
                else{
        console.log(response);
                    callback(null, data)
                }

            })


        } else {

            console.log(error);

            callback(error,null);
        }
    });
}
}
async.waterfall([get_settings_info,get_setting_url,importInfo],function (err,data) {
    if (err) {
        res.json({success: false, result: err}).end('');
    } else {
        res.status(200).json({success: true}).end('');
    }
})
}

exports.getCve3517=function (req, res, next) {
    var deviceTable=[];
    var t=0;

    //     var deviceList=[];
        let options = {
            url: 'https://tools.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-fxos-nxos-cfs-dos-dAmnymbd',
            // headers:{
            //     'Connection':'keep-alive',
            // },
            // timeout:3000
        }
        request.get(options, function (error, response, data) {
            var deviceList="";

            //  console.log('i:'+urlList[i])
            if (!error) {
                try{
                    //console.log('url:'+options['url'])

                    const $ = cheerio.load(data);
                    const arr = $('div[class="ud-innercontent-area"][id="vulnerableproducts"]').html();
                    const cveId = $('div[class="inlineblock divPaddingTen"]').html();
                    const sir =$('div[id="severitycirclecontent"]').html()
                    var l = arr.split('<ul>');
                    var temp = l[1];
                    var temp2 = temp.split('</ul>')[0]
                    var list = temp2.split('<li>');
                    list.shift();
                    for (var devices of list) {
                        var deviceItem = devices.split("</li")[0];
                        //var device=deviceItem[0]+deviceItem[1]+deviceItem[2]+deviceItem[3];
                        if (checkHref(deviceItem))
                        {
                            deviceItem=deviceItem.split("(<a href=")[0];
                        }
                        if(deviceItem.indexOf("<br>"))
                        {
                            deviceItem=deviceItem.split("<br>")[0];
                        }
                        deviceList+=deviceItem+=',';
                    }
                    var obj={
                        "cveid":cveId,
                        "security":sir,
                        "owner": "Cisco",
                        "current_status": "Not start",
                        "target_resolution_date": "2020-12-15",
                        "remediation_availability": "Yes",
                        "device_type":deviceList
                    }
                    deviceTable.push(obj)
                    console.log('i:'+t+'deviceList:'+deviceList)
                    cve_list.insertMany(deviceTable,function (err,response) {
                        if(err){
                            res.json({success: false,erro:err}).end('');

                        }
                        else {
                            res.status(200).json({success: true}).end('')
                        }
                    })



                    }

                catch (e) {
                    // console.log('url:'+options['url'])


                    res.json({success: false,erro:err}).end('');

                    }
                }


        })

    checkHref=function ( string) {
        if(string.indexOf("<a href")!=-1)
        {
            return true;
        }
        else {
            return false;
        }
    }
}


