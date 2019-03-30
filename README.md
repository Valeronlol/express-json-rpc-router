# JSON-RPC node.js implementation

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

[JSON-RPC](https://www.jsonrpc.org/specification) official spec.

Node.js JSON-RPCv2 router middleware.
Handle incoming request and apply to controller functions.
Validation available.

**Note** As Router require body-parser which must be used before router.

## Installation

```sh
$ npm install express-json-rpc-router
```
or

```sh
$ yarn add express-json-rpc-router
```

## Examples

### Simple
<!-- eslint-disable no-unused-vars -->

```js
const app = require('express')()
const bodyParser = require('body-parser')
const jsonRouter = require('express-json-rpc-router')

const controller = {
    testMethod() {
        // your code.
        return { data: ['example data 1', 'example data 2'] }
    }
}

app.use(bodyParser.json())
app.use(jsonRouter({ methods: controller }))
app.listen(3000, () => console.log('Example app listening on port 3000'))
```

and `curl -X POST http://localhost:3000 -H 'Content-Type: application/json' -d \
'{
   "jsonrpc": "2.0",
   "result": ['example data 1', 'example data 2'],
   "id": 1
 }`

will return: `{
    "jsonrpc": "2.0",
    "result": [
        "example data 1",
        "example data 2"
    ],
    "id": 1
}`

### With Validation and onError callback
<!-- eslint-disable no-unused-vars -->

```js
const controller = {
    testMethod() {
        return ['example data 1', 'example data 2']
    }
}

const controllerValidation = {
    testMethod() {
        if (true) {
            throw new Error('something going wrong')
        }
    }
}

app.use(bodyParser.json())
app.use(jsonRouter({
    methods: controller,
    beforeMethods: controllerValidation,
    onError() {
        console.log('Send report!')
    }
}))
app.listen(3000, () => console.log('Example app listening on port 3000'))
```

and `curl -X POST http://localhost:3000 -H 'Content-Type: application/json' -d \
'{
   "jsonrpc": "2.0",
   "result": ['example data 1', 'example data 2'],
   "id": 1
 }`

will return: `{
    "jsonrpc": "2.0",
    "error": {
        "code": -32603,
        "message": "something going wrong"
    },
    "id": 1
}`

#### Options

The `json` function takes an optional `options` object that may contain any of
the following keys:

##### methods

You can pass the object of your methods that will be called when a match is made via JSON-RPC `method` field.

##### beforeMethods

Optionally you can pass the object of your validation methods, which will be called before main method with same name are called.

##### onError

Optionally you can pass onError callback which will be called when json-rpc middleware error occurred.


## License

[MIT](LICENSE)
