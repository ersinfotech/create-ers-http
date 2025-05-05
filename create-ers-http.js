#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { execSync, spawnSync } = require('node:child_process')

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

writeFileSync(
  'config/default.cjs',
  `
module.exports = {
  clientId: 'miner',
  eadmin: {
    baseUrl: 'http://api.ersinfotech.com/eadmin2-api',
  },
}
`,
)

writeFileSync(
  '.gitignore',
  `
node_modules/
config/*
!config/default.cjs
`,
)

writeFileSync(
  'src/graphql/schema.ts',
  `
export default \`

type Query {
  echo(message: JSON!): JSON
}

\`
`,
)

writeFileSync(
  'src/graphql/api.ts',
  `
export const echo = async ({ message }, { session }) => {
  console.log(session)
  console.log({ message })
  return message
}
`,
)

writeFileSync(
  'src/graphql/resolver.ts',
  `
export default {
}
`,
)

writeFileSync(
  'src/graphql/index.ts',
  `
import schema from './schema'
import * as api from './api'
import resolver from './resolver'

export default () => {
  return { api, schema, resolver }
}
`,
)

writeFileSync(
  'src/restful/index.ts',
  `
export default (logger, router, restrict) => {
  router.use('/hello', (req, res) => {
    res.end('hello world')
  })
}
`,
)

writeFileSync(
  'ecosystem.config.cjs',
  `
//
// 只修改env里面的内容即可，其他配置请保持不变
// 专门用于pm2 nvm的联合使用
// 感谢使用
// @fanlia
//

var pkg = require('./package.json')

module.exports = {
  apps: [
    {
      name: pkg.name,
      script: pkg.main,
      interpreter: process.env.NVM_DIR + '/nvm-exec',
      interpreter_args: 'npx tsx',
      env: {
        NODE_VERSION: 16,
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
  ],
}
`,
)

writeFileSync(
  'init.ts',
  `
import { fileURLToPath } from 'node:url'
import path from 'node:path'
global.__base = path.dirname(fileURLToPath(import.meta.url))
console.json = d => console.log(JSON.stringify(d, null, 2))
`,
)

writeFileSync(
  'index.ts',
  `
import './init'
import config from 'config'
import ehttp from 'ers-http'
import graphql from '#src/graphql'
import restful from '#src/restful'

ehttp(config, {
  graphql,
  restful,
})
`,
)

execSync('cp config/default.cjs config/development.cjs')
execSync('rm -rf node_modules/')
execSync('npm init -y')

const package = require(package_json_path)
package.scripts.start = 'tsx watch .'
package.type = 'module'
package.main = 'index.ts'
package.imports = package.imports || {}
package.imports['#src/*'] = './src/*'

fs.writeFileSync(package_json_path, JSON.stringify(package, null, 2))

console.log('please wait')

spawnSync('npm', ['i', 'config', 'ers-http'], { stdio: 'inherit' })
spawnSync('npm', ['i', '-D', 'tsx'], { stdio: 'inherit' })

console.log(`\nyou can 'npm start' now`)
