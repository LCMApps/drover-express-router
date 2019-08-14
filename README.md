![node](https://img.shields.io/node/v/drover-express-router.svg?style=flat-square)
![npm](https://img.shields.io/npm/v/drover-express-router.svg?style=flat-square)
![npm](https://img.shields.io/npm/dt/drover-express-router.svg?style=flat-square)
![Travis (.org)](https://img.shields.io/travis/LCMApps/drover-express-router.svg?style=flat-square)
[![Coverage Status](https://coveralls.io/repos/github/LCMApps/drover-express-router/badge.svg?branch=master)](https://coveralls.io/github/LCMApps/drover-express-router?branch=master)

# Drover express router plugin

Simple [drover](https://github.com/LCMApps/drover) plugin for [express](https://github.com/expressjs/express)
that provides convenient drover control flow via HTTP

# Installation

Using npm:

```shell
$ npm i --save drover-express-router
```

Using yarn:

```shell
$ yarn add drover-express-router
```

# Usage

```javascript
const { MasterFactory } = require('drover');

const app = require('express')();
const drover = require('drover-express-router');

const demo = MasterFactory.create({
  script: 'path/to/demo.js',
});

// one line to plug-in drover controls into your express app
app.use('/demo', drover({ master: demo }));

app.listen(3000);
```

# API

## Get status

```bash
curl -XGET localhost:3000/demo/status
//{"status": STATUS}
```

## Get workers statuses

```bash
curl -XGET localhost:3000/demo/status/workers
//{"workers": [STATUS]}
```

## Scale

```bash
curl -XPUT localhost:3000/demo/scale -d 'size=4'
```

## Graceful shutdown

```bash
curl -XPUT localhost:3000/demo/shutdown
```

## Start

```bash
curl -XPUT localhost:3000/demo/start
```

## Graceful reload

```bash
curl -XPUT localhost:3000/demo/reload
```

# Composite apps

If you got composite drover application with 2 or more masters you still can do this like this:

```javascript
const { MasterFactory } = require('drover');

const app = require('express')();
const drover = require('drover-express-router');

const foo = MasterFactory.create({ script: 'path/to/foo.js' });
const bar = MasterFactory.create({ script: 'path/to/bar.js' });

app.use('/foo', drover({ master: foo }));
app.use('/bar', drover({ master: bar }));

app.listen(3000);
```
