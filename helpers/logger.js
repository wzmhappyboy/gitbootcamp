'use strict';
const app = require('@cisco-bpa-platform/mw-util-common-app');
module.exports.logger = {
    "info": app.log,
    "debug": app.debug,
    "warn": app.warn,
    "error": app.error
};

module.exports.auditLogger = app.auditLogger;

