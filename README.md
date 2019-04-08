# JSON-RPC node.js implementation

[JSON-RPC](https://www.jsonrpc.org/specification) official spec.

Extremely fast and simple Node.js JSON-RPCv2 router middleware.
Handle incoming request and apply to controller functions.
Validation available.

**Note** As Router require body-parser which must be used before router.

## Installation

```sh
$ npm install body-parser express-json-rpc-router
```
or

```sh
$ yarn add body-parser express-json-rpc-router
```

## Examples

### Simple
<!-- eslint-disable no-unused-vars -->

```js
const app = require('express')()
const bodyParser = require('body-parser')
const jsonRouter = require('express-json-rpc-router')

const controller = {
    testMethod({ username }) {
        console.log('username: ', username)
        return ['example data 1', 'example data 2']
    }
}

app.use(bodyParser.json())
app.use(jsonRouter({ methods: controller }))
app.listen(3000, () => console.log('Example app listening on port 3000'))
```

and 
```bash
curl -X POST \
  http://localhost:3000 \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "method": "testMethod",
    "params": {
        "username": "valeron"
    },
    "id": 1
 }'
```
will return:
```json
{
  "jsonrpc": "2.0",
  "result": [
    "example data 1",
    "example data 2"
  ],
  "id": 1
}
```

### With Validation, after hooks and onError callback
<!-- eslint-disable no-unused-vars -->

```js
const controller = {
    testMethod({ username }) {
        console.log('username: ', username)
        return ['example data 1', 'example data 2']
    }
}

const beforeController = {
    testMethod() {
        if (Math.random() >= 0.5) { // Random error
            throw new Error('something going wrong')
        }
    }
}

const afterController = {
    testMethod: [() => console.log('testMethod executed 1!'), () => console.log('testMethod executed 2!')]
}

app.use(bodyParser.json())
app.use(jsonRouter({
    methods: controller,
    beforeMethods: beforeController,
    afterMethods: afterController,
    onError(err) {
        console.log(err) // send report
    }
}))
app.listen(3000, () => console.log('Example app listening on port 3000'))
```

and 
```bash
curl -X POST \
  http://localhost:3000 \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "method": "testMethod",
    "params": {
        "username": "valeron"
    },
    "id": 1
 }'
```
will return:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "something going wrong"
  },
  "id": 1
}
```

#### Options

The `express-json-rpc-router` function takes an optional `options` object that may contain any of the following keys:

##### methods `type: Object<function(params)>`
You can pass the object of your methods that will be called when a match is made via JSON-RPC `method` field.

##### beforeMethods `type: Object<function(params)|Array<function(params)>>`
You can provide function or array of functions, which will be called before main method with same name are called. 
This is the best place for validation.
beforeMethods names should be the same as methods names.
Request params will be passed as first argument.

##### afterMethods `type: Object<function(params)|Array<function(params, execResult)>>`
You can provide function or array of functions, which will be called after main method with same name are called.
This is the best place to write logs.
afterMethods names should be the same as methods names.
Method execution result will be passed as second argument.
Request params will be passed as first argument.

##### onError `type: function(err, params)`
callback(err, params) {}
Optionally you can pass onError callback which will be called when json-rpc middleware error occurred.

## License

[MIT](LICENSE)
