'use strict';

const { Router } = require('express');

const UnknownErrorResponse = { error: { code: 1000, message: 'Unknown error' } };
const AlreadyStartedErrorResponse = { error: { code: 1001, message: 'Service already started' } };
const InappropriateConditionErrorResponse = { error: { code: 1002, message: 'Inappropriate conditions' } };
const InvalidScaleSizeErrorResponse = { error: { code: 1003, message: 'Invalid scale size' } };
const WorkerStatusErrorResponse = {
  error: { code: 1004, message: 'One or more workers have error state' },
};

/**
 * @param {Master} options.master
 * @return {createApplication.Router}
 */
module.exports = options => {
  const { master } = options;

  if (!master) {
    throw new Error('"master" option is required');
  }

  if (master.constructor.name !== 'Master') {
    throw new Error('"master" option must be valid instance of "Master"');
  }

  const router = new Router();

  router.get('/status', (req, res) => {
    try {
      res.send({ status: master.getStatus() });
    } catch (err) {
      res.status(500).send(UnknownErrorResponse);
    }
  });

  router.get('/status/workers', (req, res) => {
    try {
      res.send({ workers: master.getWorkersStatuses() });
    } catch (err) {
      res.status(500).send(UnknownErrorResponse);
    }
  });

  router.put('/start', async (req, res) => {
    try {
      await master.start();

      res.send({ status: master.getStatus() });
    } catch (err) {
      if (err.constructor.name === 'AlreadyInitializedError') {
        return res.status(400).send(AlreadyStartedErrorResponse);
      }

      res.status(500).send(UnknownErrorResponse);
    }
  });

  router.put('/scale', async (req, res) => {
    const { size } = req.body;

    try {
      await master.rescale(size);

      res.send({ workers: master.getWorkersStatuses() });
    } catch (err) {
      if (err.constructor.name === 'InappropriateConditionError') {
        return res.status(400).send(InappropriateConditionErrorResponse);
      } else if (err.constructor.name === 'InvalidArgumentError') {
        return res.status(400).send(InvalidScaleSizeErrorResponse);
      }

      res.status(500).send(UnknownErrorResponse);
    }
  });

  router.put('/shutdown', async (req, res) => {
    try {
      await master.gracefulShutdown();

      res.send({ status: master.getStatus() });
    } catch (err) {
      if (err.constructor.name === 'InappropriateConditionError') {
        return res.status(400).send(InappropriateConditionErrorResponse);
      } else if (err.constructor.name === 'WorkerStatusError') {
        return res.status(500).send(WorkerStatusErrorResponse);
      }

      res.status(500).send(UnknownErrorResponse);
    }
  });

  router.put('/reload', async (req, res) => {
    try {
      await master.gracefulReload();

      res.send({ workers: master.getWorkersStatuses() });
    } catch (err) {
      if (err.constructor.name === 'InappropriateConditionError') {
        return res.status(400).send(InappropriateConditionErrorResponse);
      } else if (err.constructor.name === 'WorkerStatusError') {
        return res.status(500).send(WorkerStatusErrorResponse);
      }

      res.status(500).send(UnknownErrorResponse);
    }
  });

  return router;
};
