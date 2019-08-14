'use strict';

const drover = require('../../index');
const supertest = require('supertest');
const sinon = require('sinon');
const express = require('express');
const bodyParser = require('body-parser');
const { Master } = require('drover');
const { assert } = require('chai');

class AlreadyInitializedError {}
class InappropriateConditionError {}
class InvalidArgumentError {}
class WorkerStatusError {}

describe('Drover express router plugin', () => {
  it('must failed without "master" option', () => {
    const app = express();
    assert.throws(
      () => {
        app.use('/app', drover({}));
      },
      Error,
      '"master" option is required',
    );
  });

  it('must failed with invalid "master" option', () => {
    const app = express();
    assert.throws(
      () => {
        app.use('/app', drover({ master: new Object(42) }));
      },
      Error,
      '"master" option must be valid instance of "Master"',
    );
  });

  it('GET /app/status must return valid master status', async () => {
    const master = sinon.createStubInstance(Master);
    const expectedStatus = 3;
    master.getStatus.returns(expectedStatus);

    const app = express();
    app.use('/app', drover({ master }));

    const result = await supertest(app).get('/app/status');

    const expectedStatusCode = 200;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.status, expectedStatus);
  });

  it('GET /app/status must return unknown response error', async () => {
    const master = sinon.createStubInstance(Master);
    master.getStatus.throws(new Error('wtf'));

    const app = express();
    app.use('/app', drover({ master }));

    const result = await supertest(app).get('/app/status');

    const expectedStatusCode = 500;
    const expectedErrorCode = 1000;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('GET /app/status/workers must return valid master status', async () => {
    const master = sinon.createStubInstance(Master);
    const expectedStatuses = [3, 3, 3, 3];
    master.getWorkersStatuses.returns(expectedStatuses);

    const app = express();
    app.use('/app', drover({ master }));

    const result = await supertest(app).get('/app/status/workers');

    const expectedStatusCode = 200;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.deepEqual(result.body.workers, expectedStatuses);
  });

  it('GET /app/status/workers must return unknown response error', async () => {
    const master = sinon.createStubInstance(Master);
    master.getWorkersStatuses.throws(new Error('wtf'));

    const app = express();
    app.use('/app', drover({ master }));

    const result = await supertest(app).get('/app/status/workers');

    const expectedStatusCode = 500;
    const expectedErrorCode = 1000;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('PUT /app/start must start application and return valid master status', async () => {
    const master = sinon.createStubInstance(Master);
    const expectedStatus = 3;
    master.getStatus.returns(expectedStatus);

    const app = express();
    app.use('/app', drover({ master }));

    const result = await supertest(app).put('/app/start');

    const expectedStatusCode = 200;

    assert.ok(master.start.calledOnce);
    assert.ok(master.start.calledBefore(master.getStatus));
    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.status, expectedStatus);
  });

  it('PUT /app/start must return AlreadyInitializedError response', async () => {
    const master = sinon.createStubInstance(Master);
    master.start.throws(new AlreadyInitializedError());

    const app = express();
    app.use('/app', drover({ master }));

    const result = await supertest(app).put('/app/start');

    const expectedStatusCode = 400;
    const expectedErrorCode = 1001;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('PUT /app/start must return unknown response error', async () => {
    const master = sinon.createStubInstance(Master);
    master.start.throws(new Error('wtf'));

    const app = express();
    app.use('/app', drover({ master }));

    const result = await supertest(app).put('/app/start');

    const expectedStatusCode = 500;
    const expectedErrorCode = 1000;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('PUT /app/scale must scale application and return valid workers statuses', async () => {
    const master = sinon.createStubInstance(Master);
    const expectedStatuses = [3, 3, 3, 3];
    const size = 4;

    master.getWorkersStatuses.returns(expectedStatuses);

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app)
      .put('/app/scale')
      .send({ size });

    const expectedStatusCode = 200;

    assert.ok(master.rescale.calledOnce);
    assert.ok(master.rescale.calledBefore(master.getWorkersStatuses));
    assert.deepEqual([size], master.rescale.getCall(0).args);
    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.deepEqual(result.body.workers, expectedStatuses);
  });

  it('PUT /app/scale must return unknown response error', async () => {
    const master = sinon.createStubInstance(Master);
    master.rescale.throws(new Error('wtf'));

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app)
      .put('/app/scale')
      .send({ size: 4 });

    const expectedStatusCode = 500;
    const expectedErrorCode = 1000;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('PUT /app/scale must return InappropriateConditionError response', async () => {
    const master = sinon.createStubInstance(Master);
    master.rescale.throws(new InappropriateConditionError());

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app)
      .put('/app/scale')
      .send({ size: 4 });

    const expectedStatusCode = 400;
    const expectedErrorCode = 1002;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('PUT /app/scale must return InvalidArgumentError response', async () => {
    const master = sinon.createStubInstance(Master);
    master.rescale.throws(new InvalidArgumentError());

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app)
      .put('/app/scale')
      .send({ size: 4 });

    const expectedStatusCode = 400;
    const expectedErrorCode = 1003;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('PUT /app/shutdown must graceful shutdown application and return valid status', async () => {
    const master = sinon.createStubInstance(Master);
    const expectedStatus = 1;

    master.getStatus.returns(expectedStatus);

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app).put('/app/shutdown');

    const expectedStatusCode = 200;

    assert.ok(master.gracefulShutdown.calledOnce);
    assert.ok(master.gracefulShutdown.calledBefore(master.getStatus));
    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.status, expectedStatus);
  });

  it('PUT /app/shutdown must return unknown response error', async () => {
    const master = sinon.createStubInstance(Master);
    master.gracefulShutdown.throws(new Error('wtf'));

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app).put('/app/shutdown');

    const expectedStatusCode = 500;
    const expectedErrorCode = 1000;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('PUT /app/shutdown must return InappropriateConditionError response', async () => {
    const master = sinon.createStubInstance(Master);
    master.gracefulShutdown.throws(new InappropriateConditionError());

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app).put('/app/shutdown');

    const expectedStatusCode = 400;
    const expectedErrorCode = 1002;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('PUT /app/shutdown must return WorkerStatusError response', async () => {
    const master = sinon.createStubInstance(Master);
    master.gracefulShutdown.throws(new WorkerStatusError());

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app).put('/app/shutdown');

    const expectedStatusCode = 500;
    const expectedErrorCode = 1004;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('PUT /app/reload must graceful reload application and return valid worker statuses', async () => {
    const master = sinon.createStubInstance(Master);
    const expectedStatuses = [3, 3, 3, 3];

    master.getWorkersStatuses.returns(expectedStatuses);

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app).put('/app/reload');

    const expectedStatusCode = 200;

    assert.ok(master.gracefulReload.calledOnce);
    assert.ok(master.gracefulReload.calledBefore(master.getWorkersStatuses));
    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.deepEqual(result.body.workers, expectedStatuses);
  });

  it('PUT /app/reload must return unknown response error', async () => {
    const master = sinon.createStubInstance(Master);
    master.gracefulReload.throws(new Error('wtf'));

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app).put('/app/reload');

    const expectedStatusCode = 500;
    const expectedErrorCode = 1000;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('PUT /app/reload must return InappropriateConditionError response', async () => {
    const master = sinon.createStubInstance(Master);
    master.gracefulReload.throws(new InappropriateConditionError());

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app).put('/app/reload');

    const expectedStatusCode = 400;
    const expectedErrorCode = 1002;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });

  it('PUT /app/reload must return WorkerStatusError response', async () => {
    const master = sinon.createStubInstance(Master);
    master.gracefulReload.throws(new WorkerStatusError());

    const app = express();
    app.use(bodyParser.json());
    app.use('/app', drover({ master }));

    const result = await supertest(app).put('/app/reload');

    const expectedStatusCode = 500;
    const expectedErrorCode = 1004;

    assert.strictEqual(result.statusCode, expectedStatusCode);
    assert.strictEqual(result.body.error.code, expectedErrorCode);
  });
});
