import path from 'path'
import hapi from 'hapi'
import inert from 'inert'
import fs from 'vsd-plugin-fs'
import blipp from 'blipp'
import Knex from 'knex'
// import { knexSnakeCaseMappers } from 'objection'
import api from '@stoneware/api'
import { createModels } from '@stoneware/db'

const relativeTo = path.resolve(__dirname, '../project')

async function createServer () {
  // Create the hapi server
  const server = hapi.server({
    port: 3004,
    routes: {
      cors: true
    }
  })

  const appfilePath = path.join(relativeTo, 'app.json')
  const knexfilePath = path.join(relativeTo, 'knexfile')

  const [ app, knexfile ] = await Promise
    .all([ appfilePath, knexfilePath ].map(file => {
      // eslint-disable-next-line
      return import(file)
    }))
    .catch(err => (console.log(err)))

  const environment = process.env.NODE_ENV || 'development'
  const knex = Knex(knexfile[environment])
  const models = await createModels(app, knex, { relativeTo })

  await server.register(inert)
  await server.register(blipp)
  await server.register(fs, { routes: { prefix: '/fs' } })

  await server.register({
    plugin: api,
    options: { app, models, relativeTo }
  }, {
    routes: { prefix: '/api' }
  })

  //
  // todo: Register userland plugins...
  //

  server.ext('onPreResponse', (request, h) => {
    const response = request.response

    if (response.isBoom) {
      // An error was raised during
      // processing the request
      const statusCode = response.output.statusCode

      console.error({
        statusCode: statusCode,
        data: response.data,
        message: response.message
      })
    }
    return h.continue
  })

  server.route({
    method: 'get',
    path: '/app',
    handler: {
      file: {
        path: path.join(relativeTo, 'app.json'),
        confine: false
      }
    }
  })

  server.start()

  return server
}

createServer()
  .then(server => {
    const info = {
      uri: server.info.uri,
      message: 'Started server'
    }

    console.info(info.message, info.uri)
  })
  .catch(err => console.error(err))
