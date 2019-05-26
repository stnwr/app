import path from 'path'
import Knex from 'knex'
import knexfile from '/Users/dstone/Documents/dev/stoneware/project/knexfile.js'
const environment = process.env.NODE_ENV || 'development'
const knex = Knex(knexfile[environment])
const projectDir = path.resolve(__dirname, '../project')

knex.migrate.latest({
  directory: '../project/db/migrations'
})
