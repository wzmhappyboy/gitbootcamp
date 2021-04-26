var express = require('express');
var router = express.Router();
const common = require('@cisco-bpa-platform/mw-util-common-app');
var userController = require('../controllers/user-controller');
var fileController=require('../controllers/file-handle');
var mopController=require('../controllers/mop-controller');
var templatesController=require('../controllers/templates-controller');
var trace_logs=require('../controllers/trace_logs');
var test_api=require('../controllers/test-controller');

var cveController=require('../controllers/cve-controller');


var app5 = require("../controllers/upload");
/* Upload cve-devices */

var app6=require("../controllers/settings.controller");
router.get('/setting/securitypatching/importData',common.wrapVersion(app6.getData,'1.0'));
router.get('/setting/securitypatching/data',common.wrapVersion(app6.get_settings,'1.0'));

var app7=require("../controllers/test")
router.get('/setting/test',common.wrapVersion(app6.getCve3517,'1.0'));


router.post('/impacted_module',common.wrapVersion(cveController.impactedModule,'1.0'));
router.post('/device_type',common.wrapVersion(cveController.deviceType,'1.0'));
router.post('/current_os_version',common.wrapVersion(cveController.currentOsVersion,'1.0'));
router.post('/target_os_version',common.wrapVersion(cveController.targetOsVersion,'1.0'));



router.post('/insertdevices', common.wrapVersion(mopController.insertDevice, '1.0'));
/* Upload cve-devices */
/* File uploads */

var multer  = require('multer');
const fs = require("fs");
var createFolder = function(folder){
  try{
      fs.accessSync(folder); 
  }catch(e){
      fs.mkdirSync(folder);
  }  
};
var uploadFolder = './files/';
createFolder(uploadFolder);
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, uploadFolder);    
  },
  filename: function (req, file, cb) {    
      cb(null, file.originalname + '-' + Date.now());  
  }
});
router.post('/getdevices',common.wrapVersion(fileController.getDevices,'1.0'));






var upload = multer({ storage: storage });

router.post('/uploadfile',  upload.single('file'),common.wrapVersion(fileController.readFile,'1.0'));
module.exports = router;
/* File uploads */

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({ status: 'bootcamp-ms service is running.' });
});
router.get('/users', common.wrapVersion(userController.getAllUsers, '1.0'));

router.get('/files', common.wrapVersion(fileController.readFile,'1.0'));
router.get('/mops',common.wrapVersion(mopController.getAllMops,'1.0'));

router.get('/getToken',common.wrapVersion(templatesController.get_token,'1.0'));
router.post('/downloadImage',common.wrapVersion(templatesController.downloadImage,'1.0'));
router.post('/preCheck',common.wrapVersion(templatesController.pre_check,'1.0'));
router.post('/pre_check_data_storage',common.wrapVersion(templatesController.pre_check_data_storage,'1.0'));
router.post('/postCheck',common.wrapVersion(templatesController.post_check,'1.0'));
router.post('/checkSize',common.wrapVersion(templatesController.check_size,'1.0'));
router.post('/getMd5Checksum',common.wrapVersion(templatesController.get_md5_checksum,'1.0'));
router.post('/getOsupgradeInfo',common.wrapVersion(templatesController.get_osupgrade_info,'1.0'));
router.post('/updateUpgradeStatus',common.wrapVersion(templatesController.update_upgrade_status,'1.0'));
router.post('/updateTransferStatus',common.wrapVersion(templatesController.update_transfer_status,'1.0'));
router.post('/getPrecheckLog',common.wrapVersion(templatesController.get_precheck_log,'1.0'));
router.post('/getPostcheckLog',common.wrapVersion(templatesController.get_postcheck_log,'1.0'));
router.post('/getValidateDeviceLog',common.wrapVersion(templatesController.get_validate_device_log,'1.0'));
router.post('/getDryRun',common.wrapVersion(templatesController.get_dry_run,'1.0'));
router.post('/display_dry_run',common.wrapVersion(templatesController.display_dry_run,'1.0'));
router.post('/diff_analysis',common.wrapVersion(templatesController.diff_analysis,'1.0'));
router.post('/dry_run_workflow',common.wrapVersion(templatesController.dry_run_workflow,'1.0'));

router.post('/executeWorkflow',common.wrapVersion(templatesController.schedule_image_transfer,'1.0'));
router.get('/getWorkflowData',common.wrapVersion(templatesController.get_workflow_data,'1.0'));
router.get('/checkResponseDB',common.wrapVersion(templatesController.check_responseDB,'1.0'));
router.post('/addition_check',common.wrapVersion(templatesController.addition_check,'1.0'));
router.post('/get_diff_data',common.wrapVersion(templatesController.get_diff_data,'1.0'));

router.post('/testDB_add',common.wrapVersion(templatesController.testDB_add,'1.0'));
router.get('/testDB_delete',common.wrapVersion(templatesController.testDB_delete,'1.0'));
router.post('/post_config_dry_run',common.wrapVersion(templatesController.post_config_dry_run,'1.0'));
router.post('/get_config',common.wrapVersion(templatesController.get_config,'1.0'));
router.post('/validate_device',common.wrapVersion(templatesController.validate_device,'1.0'));
router.post('/upgrade_workflow',common.wrapVersion(templatesController.upgrade_workflow,'1.0'));
router.post('/reschedule_workflow',common.wrapVersion(templatesController.reschedule_workflow,'1.0'));
router.post('/close_with_remarks',common.wrapVersion(templatesController.close_with_remarks,'1.0'));
router.post('/revert_workflow_revert',common.wrapVersion(templatesController.revert_workflow_revert,'1.0'));
router.post('/revert_workflow_unrevert',common.wrapVersion(templatesController.revert_workflow_unrevert,'1.0'));
router.get('/get_cvelist_data',common.wrapVersion(templatesController.get_cvelist_data,'1.0'));
router.post('/main_workflow',common.wrapVersion(templatesController.main_workflow,'1.0'));
router.post('/seek_vendor_advice',common.wrapVersion(templatesController.seek_vendor_advice,'1.0'));
router.get('/assessment_page_data',common.wrapVersion(templatesController.assessment_page_data,'1.0'));
router.get('/import_from_NP',common.wrapVersion(templatesController.import_from_NP,'1.0'));
router.get('/reset_cve_list',common.wrapVersion(templatesController.reset_cve_list,'1.0'));
router.get('/reset_osupgrade_list',common.wrapVersion(templatesController.reset_osupgrade_list,'1.0'));
router.post('/check_cfs_status',common.wrapVersion(templatesController.check_cfs_status,'1.0'));
router.post('/approve_email',common.wrapVersion(templatesController.approve_email,'1.0'));
router.post('/sync_from_device',common.wrapVersion(templatesController.sync_from_device,'1.0'));
router.post('/data_storage',common.wrapVersion(templatesController.data_storage,'1.0'));
router.post('/data_storage_cveList',common.wrapVersion(templatesController.data_storage_cveList,'1.0'));
router.post('/assessment_workflow_start',common.wrapVersion(templatesController.assessment_workflow_start,'1.0'));
router.post('/assessment_workflow_subTask',common.wrapVersion(templatesController.assessment_workflow_subTask,'1.0'));
router.post('/live_status',common.wrapVersion(templatesController.live_status,'1.0'));
router.get('/cp_os_image',common.wrapVersion(templatesController.cp_os_image,'1.0'));
router.post('/check_device_up',common.wrapVersion(templatesController.check_device_up,'1.0'));
router.post('/get_asr_device',common.wrapVersion(templatesController.get_asr_device,'1.0'));
router.post('/scb_download_image_to_ftp',common.wrapVersion(templatesController.scb_download_image_to_ftp,'1.0'));
router.post('/download_image_via_ms',common.wrapVersion(templatesController.download_image_via_ms,'1.0'));


router.post('/get_trace_logs',common.wrapVersion(trace_logs.get_trace_logs,'1.0'));
router.post('/display_trace_logs',common.wrapVersion(trace_logs.display_trace_logs,'1.0'));
router.post('/get_connect_device_upgrade_logs',common.wrapVersion(trace_logs.get_connect_device_upgrade_logs,'1.0'));

router.post('/chenge_trace_logs',common.wrapVersion(test_api.chenge_trace_logs,'1.0'));
router.post('/import_device_table',common.wrapVersion(test_api.import_device_table,'1.0'));

router.post('/importcve',  upload.single('file'),common.wrapVersion(app5.upload_txt,'1.0'));

module.exports = router;