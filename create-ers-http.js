#!/usr/bin/env node

const fs = require('fs')
const { execSync } = require('child_process')

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

if (fs.existsSync('package.json')) {
    console.log('package.json already existed')
    process.exit()
}

mkdirSync('config')
mkdirSync('src/graphql')

writeFileSync('config/default.js', `
module.exports = {
    clientId: 'miner',

    http: {
        port: process.env.PORT || 3000,
    },

    eadmin: {
        baseUrl: 'http://api.ersinfotech.com/eadmin2-api',
    },
}
`)

writeFileSync('.gitignore', `
node_modules/
config/*
!config/default.js
EOF
`)

writeFileSync('src/graphql/schema.js', `
module.exports = \`

type Query {
    echo(message: JSON!): JSON
}

\`
`)

writeFileSync('src/graphql/API.js', `
module.exports = class API {
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
module.exports = {
}
`)

writeFileSync('src/graphql/index.js', `
const schema = require('./schema')
const API = require('./API')
const resolver = require('./resolver')

module.exports = (logger) => {
    const api = new API(logger)
    return {api, schema, resolver}
}
`)

writeFileSync('ecosystem.config.js', `
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
global.__base = __dirname
console.json = d => console.log(JSON.stringify(d, null, 2))
`)

writeFileSync('index.js', `
require('./init')
const config = require('config')
const ehttp = require('ers-http')
const graphql = require('./src/graphql')

ehttp(config, {
    graphql,
})
`)

execSync('cp config/default.js config/development.js')
execSync('rm -rf node_modules/')
execSync('npm init -f')
const package = require('./package.json')
package.scripts.start = 'node-dev .'

console.log(package)
fs.writeFileSync('package.json', JSON.stringify(package, null, 2))

execSync('npm i config ers-http')
execSync('npm i -D node-dev')

console.log(`\nyou can 'npm start' now`)
