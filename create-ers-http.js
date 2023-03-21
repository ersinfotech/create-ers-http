#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

const mkdirSync = (filepath) => {
    if (fs.existsSync(filepath)) {
        return
    }
    fs.mkdirSync(filepath, { recursive: true })
    console.log(`created ${filepath}`)
}

const writeFileSync = (filepath, data) => {
    if (fs.existsSync(filepath)) {
        return
    }
    fs.writeFileSync(filepath, data)
    console.log(`created ${filepath}`)
}

const root = process.cwd()
console.log(root)

const package_json_path = path.join(root, 'package.json')

if (fs.existsSync(package_json_path)) {
    console.log('package.json already existed, skip creating')
    process.exit()
}

mkdirSync('config')
mkdirSync('src/graphql')
mkdirSync('src/restful')

writeFileSync('config/default.json', `
{
    "clientId": "miner",

    "eadmin": {
        "baseUrl": "http://api.ersinfotech.com/eadmin2-api"
    }
}
`)

writeFileSync('config/default-0.json', `
{}
`)

writeFileSync('.gitignore', `
node_modules/
config/*
!config/default.json
!config/default-0.json
`)

writeFileSync('src/graphql/schema.js', `
export default \`

type Query {
    echo(message: JSON!): JSON
}

\`
`)

writeFileSync('src/graphql/API.js', `
export default class API {
    constructor (logger) {
        this.logger = logger
    }

    echo ({message}, {session}) {
        console.log(session)
        return message
    }
}
`)

writeFileSync('src/graphql/resolver.js', `
export default {
}
`)

writeFileSync('src/graphql/index.js', `
import schema from './schema.js'
import API from './API.js'
import resolver from './resolver.js'

export default (logger) => {
    const api = new API(logger)
    return {api, schema, resolver}
}
`)

writeFileSync('src/restful/index.js', `
export default (logger, router, restrict) => {
    router.use('/hello', (req, res) => {
        res.end('hello world')
    })
}
`)

writeFileSync('ecosystem.config.cjs', `
//
// 只修改env里面的内容即可，其他配置请保持不变
// 专门用于pm2 nvm的联合使用
// 感谢使用
// @fanlia
//

var pkg = require('./package.json')

module.exports = {
  apps : [{
    name      : pkg.name,
    script    : pkg.main,
    interpreter: process.env.NVM_DIR + '/nvm-exec',
    interpreter_args: 'node',
    env: {
      NODE_VERSION: 16,
      PORT: 3000,
      NODE_ENV: 'production',
    },
  }],
};
`)

writeFileSync('init.js', `
import { fileURLToPath } from 'node:url'
import path from 'node:path'
global.__base = path.dirname(fileURLToPath(import.meta.url))
console.json = d => console.log(JSON.stringify(d, null, 2))
`)

writeFileSync('index.js', `
import './init.js'
import config from 'config'
import ehttp from 'ers-http'
import graphql from './src/graphql/index.js'
import restful from './src/restful/index.js'

ehttp(config, {
    graphql,
    restful,
})
`)

execSync('cp config/default.json config/development.json')
execSync('rm -rf node_modules/')
execSync('npm init -y')

const package = require(package_json_path)
package.scripts.start = 'node-dev .'
package.type = 'module'

fs.writeFileSync(package_json_path, JSON.stringify(package, null, 2))

console.log('please wait')

execSync('npm i config ers-http --registry=https://registry.npmmirror.com')
execSync('npm i -D node-dev --registry=https://registry.npmmirror.com')

console.log(`\nyou can 'npm start' now`)
