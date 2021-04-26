const capp = require('@cisco-bpa-platform/mw-util-common-app');
const indexRouter = require('./routes/index');

var config = require('./config/settings');
var router = require('express').Router();
const { logger, auditLogger } = require('./helpers/logger');
var environment = capp.environment;

initApp();

function initApp() {
  capp.initApp({ 'port': config.PORT,'DATABASE_NAME': 'remedy_db', 'DB_CONNECTION_MODE':'DEFAULT' }, (app) => {
    logger.info("On After App Initialization bootcamp-ms.");
    onAfterInit(app);
  });
}

function onAfterInit(app) {
  logger.info("On After Init App Initialization bootcamp-ms.");
  app.use("/", router);
  app.use('/api/' + environment.versionRegex, router);
  router.use("/scb", indexRouter);
}

